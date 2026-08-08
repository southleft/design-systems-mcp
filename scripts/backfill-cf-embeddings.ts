/**
 * Backfill the embedding_cf column using Cloudflare Workers AI (bge-m3, 1024-dim).
 *
 * Embeddings are produced by the deployed worker's secret-gated /admin/embed
 * proxy (the AI binding lives in the worker), and written to Supabase with the
 * service key. No OpenAI, no Cloudflare API token, no DB password.
 *
 * Prerequisites:
 *   1. The 20260808_cloudflare_embeddings.sql migration has been run (adds the
 *      embedding_cf columns, HNSW indexes, and search_content_cf RPC).
 *   2. EMBED_ADMIN_SECRET is set on the worker (wrangler secret put) and passed
 *      here as CF_EMBED_SECRET.
 *
 * Usage:
 *   CF_EMBED_SECRET=... npx tsx scripts/backfill-cf-embeddings.ts            # entries, dry run
 *   CF_EMBED_SECRET=... npx tsx scripts/backfill-cf-embeddings.ts --apply
 *   CF_EMBED_SECRET=... npx tsx scripts/backfill-cf-embeddings.ts --apply --chunks
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const DO_CHUNKS = process.argv.includes('--chunks');
const ENDPOINT = process.env.EMBED_ENDPOINT || 'https://design-systems-mcp.southleft.com/admin/embed';
const SECRET = process.env.CF_EMBED_SECRET;
// bge-m3 caps a request at 60k tokens across the whole batch, and one input at
// 8192 tokens. Cap each text and keep the batch small so the total stays well
// under the request limit even for the large handbook PDFs. An entry embedding
// only needs the title + substantial lead content; chunk-level full-text search
// covers the rest.
const BATCH = 10;
const MAX_TEXT_CHARS = 5000;
const cap = (t: string) => (t ?? '').slice(0, MAX_TEXT_CHARS);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}
if (!SECRET) {
  console.error('CF_EMBED_SECRET is required (the worker EMBED_ADMIN_SECRET value)');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function embedTexts(texts: string[]): Promise<number[][]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
    body: JSON.stringify({ texts }),
  });
  if (!res.ok) throw new Error(`embed proxy ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { embeddings?: number[][] };
  if (!body.embeddings || body.embeddings.length !== texts.length) {
    throw new Error(`embed proxy returned ${body.embeddings?.length} vectors for ${texts.length} texts`);
  }
  return body.embeddings;
}

async function pageAll<T = any>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .is('embedding_cf', null)
      .range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

async function backfillEntries() {
  const rows = await pageAll<any>('content_entries', 'id,title,content');
  console.log(`entries missing embedding_cf: ${rows.length}`);
  if (!APPLY || rows.length === 0) return rows.length;

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const texts = batch.map((r) => cap(`${r.title}\n\n${r.content ?? ''}`));
    const vectors = await embedTexts(texts);
    for (let j = 0; j < batch.length; j += 1) {
      const { error } = await supabase
        .from('content_entries')
        .update({ embedding_cf: vectors[j] })
        .eq('id', batch[j].id);
      if (error) throw new Error(`update ${batch[j].id}: ${error.message}`);
    }
    done += batch.length;
    console.log(`  entries ${done}/${rows.length}`);
  }
  return done;
}

async function backfillChunks() {
  const rows = await pageAll<any>('content_chunks', 'id,chunk_text');
  console.log(`chunks missing embedding_cf: ${rows.length}`);
  if (!APPLY || rows.length === 0) return rows.length;

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const vectors = await embedTexts(batch.map((r) => cap(r.chunk_text ?? '')));
    for (let j = 0; j < batch.length; j += 1) {
      const { error } = await supabase
        .from('content_chunks')
        .update({ embedding_cf: vectors[j] })
        .eq('id', batch[j].id);
      if (error) throw new Error(`chunk ${batch[j].id}: ${error.message}`);
    }
    done += batch.length;
    if (done % 320 === 0 || done === rows.length) console.log(`  chunks ${done}/${rows.length}`);
  }
  return done;
}

async function main() {
  console.log(APPLY ? '=== APPLY ===' : '=== DRY RUN ===');
  // Probe the proxy before crawling the whole corpus.
  const probe = await embedTexts(['probe']);
  console.log(`proxy OK — bge-m3 returns ${probe[0].length}-dim vectors\n`);

  await backfillEntries();
  if (DO_CHUNKS) await backfillChunks();

  if (APPLY) {
    console.log('\nDone. Set VECTOR_SEARCH_PROVIDER=cloudflare on the worker to switch search over.');
  } else {
    console.log('\nDry run. Re-run with --apply.');
  }
}

main().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
