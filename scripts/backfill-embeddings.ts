/**
 * Backfill embeddings for entries and chunks that were ingested without them.
 *
 * Content ingested while the OpenAI balance was exhausted has a null embedding.
 * Those rows are fully reachable through the keyword search path, but the
 * vector RPC filters on `embedding IS NOT NULL` — so the moment vector search
 * comes back, they silently disappear from semantic results until this runs.
 *
 * Run this after restoring OpenAI credits. It is idempotent: rows that already
 * have an embedding are skipped, so it is safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/backfill-embeddings.ts           # report what is missing
 *   npx tsx scripts/backfill-embeddings.ts --apply
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const APPLY = process.argv.includes('--apply');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function selectAll<T = any>(table: string, columns: string, nullColumn: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .is(nullColumn, null)
      .range(from, from + 499);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < 500) break;
  }
  return out;
}

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8191),
  });
  return res.data[0].embedding;
}

async function main() {
  const entries = await selectAll<any>('content_entries', 'id,title,content', 'embedding');
  const chunks = await selectAll<any>('content_chunks', 'id,chunk_text', 'embedding');

  console.log(`entries missing embedding: ${entries.length}`);
  console.log(`chunks  missing embedding: ${chunks.length}`);
  if (entries.length === 0 && chunks.length === 0) {
    console.log('\nNothing to backfill.');
    return;
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to generate embeddings.');
    console.log('Approximate cost at text-embedding-3-small rates ($0.02 / 1M tokens):');
    const approxTokens = [...entries, ...chunks].reduce(
      (sum, row) => sum + Math.ceil(((row.content ?? row.chunk_text ?? '').length) / 4),
      0
    );
    console.log(`  ~${approxTokens.toLocaleString()} tokens -> ~$${((approxTokens / 1e6) * 0.02).toFixed(4)}`);
    return;
  }

  // Fail fast on a dead key rather than crawling through every row.
  try {
    await embed('probe');
  } catch (error: any) {
    console.error(`\nEmbeddings unavailable: ${error?.error?.message ?? error.message}`);
    console.error('Restore OpenAI credits before running with --apply.');
    process.exit(1);
  }

  let done = 0;
  for (const entry of entries) {
    const embedding = await embed(`${entry.title}\n\n${entry.content ?? ''}`);
    const { error } = await supabase.from('content_entries').update({ embedding }).eq('id', entry.id);
    if (error) throw new Error(`entry ${entry.id}: ${error.message}`);
    done++;
    if (done % 10 === 0) console.log(`  entries ${done}/${entries.length}`);
  }
  console.log(`  entries ${done}/${entries.length}`);

  done = 0;
  for (const chunk of chunks) {
    const embedding = await embed(chunk.chunk_text ?? '');
    const { error } = await supabase.from('content_chunks').update({ embedding }).eq('id', chunk.id);
    if (error) throw new Error(`chunk ${chunk.id}: ${error.message}`);
    done++;
    if (done % 25 === 0) console.log(`  chunks ${done}/${chunks.length}`);
  }
  console.log(`  chunks ${done}/${chunks.length}`);

  console.log('\nBackfill complete. Vector search now covers every entry.');
}

main().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
