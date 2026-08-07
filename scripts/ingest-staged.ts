/**
 * Ingest staged content entries into Supabase.
 *
 * Reads ContentEntry JSON files from a staging directory, chunks them, and
 * writes entries plus chunks to the database.
 *
 * Two things this does differently from the older ingestion path:
 *
 * 1. It populates BOTH the dedicated columns (category, tags, confidence,
 *    system_name) and the metadata JSONB. The older path wrote metadata only,
 *    which is why the corpus ended up with two incompatible shapes and why
 *    the vector RPC returns null categories for anything ingested by the
 *    other one.
 *
 * 2. Embeddings are optional. When OPENAI_API_KEY has no quota, entries are
 *    written with a null embedding and remain fully searchable through the
 *    keyword path — which is what serves all production traffic while vector
 *    search is down. Run backfill-embeddings.ts once credits are restored;
 *    until then these entries are invisible to the vector RPC, which filters
 *    on `embedding IS NOT NULL`.
 *
 * Usage:
 *   npx tsx scripts/ingest-staged.ts --dir content/staged            # dry run
 *   npx tsx scripts/ingest-staged.ts --dir content/staged --apply
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import OpenAI from 'openai';

const argv = process.argv.slice(2);
const flag = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const APPLY = argv.includes('--apply');
const DIR = flag('--dir') ?? 'content/staged';

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Split on paragraph boundaries where possible so a chunk does not open
 * mid-sentence. Overlap keeps a definition that straddles a boundary
 * retrievable from either side.
 */
function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= CHUNK_SIZE) return clean ? [clean] : [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_SIZE, clean.length);
    if (end < clean.length) {
      const window = clean.slice(start, end);
      const breakAt = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
      if (breakAt > CHUNK_SIZE * 0.5) end = start + breakAt + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function embed(openai: OpenAI | null, text: string): Promise<number[] | null> {
  if (!openai) return null;
  try {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8191),
    });
    return res.data[0].embedding;
  } catch (error: any) {
    const code = error?.error?.code ?? error?.code;
    if (code === 'credit_balance_exhausted' || error?.status === 429) return null;
    throw error;
  }
}

async function main() {
  console.log(APPLY ? '=== APPLY MODE ===' : '=== DRY RUN (no writes) ===');

  const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
  console.log(`staging dir: ${DIR}\nfiles: ${files.length}\n`);
  if (files.length === 0) return;

  // Probe embeddings once rather than failing per entry.
  let openai: OpenAI | null = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
  let embeddingsAvailable = false;
  if (openai) {
    embeddingsAvailable = (await embed(openai, 'probe')) !== null;
  }
  console.log(
    embeddingsAvailable
      ? 'embeddings: AVAILABLE — entries will be fully vector-searchable'
      : 'embeddings: UNAVAILABLE — entries written with null embedding; run backfill-embeddings.ts later\n'
  );
  if (!embeddingsAvailable) openai = null;

  const { data: existing } = await supabase.from('content_entries').select('id,source_location');
  const existingIds = new Set((existing ?? []).map((r: any) => r.id));
  const existingUrls = new Set((existing ?? []).map((r: any) => r.source_location));

  let written = 0, skipped = 0, totalChunks = 0;

  for (const file of files) {
    const entry = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
    const url = entry.source?.location ?? entry.metadata?.source_url ?? '';

    if (existingIds.has(entry.id) || (url && existingUrls.has(url))) {
      console.log(`  SKIP  (already present) ${entry.title.slice(0, 60)}`);
      skipped++;
      continue;
    }

    const chunks = chunkText(entry.content ?? '');
    totalChunks += chunks.length;
    console.log(`  ADD   ${String((entry.content ?? '').length).padStart(6)} chars, ${String(chunks.length).padStart(3)} chunks  ${entry.title.slice(0, 56)}`);

    if (!APPLY) continue;

    const embedding = await embed(openai, `${entry.title}\n\n${entry.content}`);

    // Write columns AND metadata so both retrieval paths see the same values.
    const { error: entryError } = await supabase.from('content_entries').insert({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      embedding,
      source_type: entry.source?.type ?? 'url',
      source_location: url,
      category: entry.metadata?.category ?? 'general',
      tags: entry.metadata?.tags ?? [],
      confidence: entry.metadata?.confidence ?? 'high',
      system_name: entry.metadata?.system ?? null,
      metadata: entry.metadata ?? {},
      ingested_at: new Date().toISOString(),
    });
    if (entryError) throw new Error(`insert ${entry.id}: ${entryError.message}`);

    for (let i = 0; i < chunks.length; i += 1) {
      const chunkEmbedding = await embed(openai, chunks[i]);
      const { error: chunkError } = await supabase.from('content_chunks').insert({
        entry_id: entry.id,
        chunk_text: chunks[i],
        chunk_index: i,
        embedding: chunkEmbedding,
        metadata: { section: entry.metadata?.section ?? 'Content', chunkIndex: i },
      });
      if (chunkError) throw new Error(`chunk ${entry.id}#${i}: ${chunkError.message}`);
    }

    written++;
  }

  console.log(`\n${APPLY ? 'wrote' : 'would write'} ${APPLY ? written : files.length - skipped} entries, ${totalChunks} chunks (skipped ${skipped} already present)`);
  if (!APPLY) console.log('Re-run with --apply to write.');
}

main().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
