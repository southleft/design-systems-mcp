/**
 * Corpus cleanup for content_entries / content_chunks.
 *
 * Three problems this fixes, none of which need embeddings:
 *
 * 1. Column/metadata split. Older ingestion wrote category, tags, confidence
 *    and system only into the metadata JSONB; newer ingestion writes the
 *    dedicated columns. The deployed vector RPC reads metadata, the keyword
 *    path reads both, and filters that target the columns silently miss most
 *    of the corpus. Backfills the columns from metadata so both agree.
 *
 * 2. Entries with no chunks. Roughly a third of the corpus was ingested
 *    without chunking, making those entries permanently invisible to
 *    search_chunks no matter what the query is. Chunks are plain text and
 *    searchable without embeddings, so they can be generated now and embedded
 *    later by backfill-embeddings.ts.
 *
 * 3. Entries with no content at all. Indexed, searchable by title, and
 *    returning nothing. Removed, with a backup written first.
 *
 * Usage:
 *   npx tsx scripts/cleanup-corpus.ts               # report only
 *   npx tsx scripts/cleanup-corpus.ts --apply
 *   npx tsx scripts/cleanup-corpus.ts --apply --skip-deletes
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const SKIP_DELETES = process.argv.includes('--skip-deletes');
const BACKUP_DIR = join(process.cwd(), '.backups');

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

/** PostgREST caps responses at 1000 rows; page or lose data silently. */
async function selectAll<T = any>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return out;
}

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= CHUNK_SIZE) return [clean];

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

async function main() {
  console.log(APPLY ? '=== APPLY MODE ===' : '=== DRY RUN (no writes) ===\n');

  const entries = await selectAll<any>(
    'content_entries',
    'id,title,content,category,tags,confidence,system_name,metadata'
  );
  const chunkRows = await selectAll<any>('content_chunks', 'entry_id');
  const chunkOwners = new Set(chunkRows.map((c) => c.entry_id));

  console.log(`entries: ${entries.length} | chunks: ${chunkRows.length}\n`);

  // --- 1. Column backfill from metadata -----------------------------------
  const needsColumns = entries.filter((e) => {
    const meta = e.metadata ?? {};
    const missingCategory = !e.category && meta.category;
    const missingTags = (!Array.isArray(e.tags) || e.tags.length === 0) && Array.isArray(meta.tags) && meta.tags.length > 0;
    const missingConfidence = !e.confidence && meta.confidence;
    const missingSystem = !e.system_name && meta.system;
    return missingCategory || missingTags || missingConfidence || missingSystem;
  });
  console.log(`1. column backfill from metadata: ${needsColumns.length} entries`);

  if (APPLY && needsColumns.length > 0) {
    let done = 0;
    for (const entry of needsColumns) {
      const meta = entry.metadata ?? {};
      const patch: Record<string, any> = {};
      if (!entry.category && meta.category) patch.category = meta.category;
      if ((!Array.isArray(entry.tags) || entry.tags.length === 0) && Array.isArray(meta.tags) && meta.tags.length > 0) {
        patch.tags = meta.tags;
      }
      if (!entry.confidence && meta.confidence) patch.confidence = meta.confidence;
      if (!entry.system_name && meta.system) patch.system_name = meta.system;
      if (Object.keys(patch).length === 0) continue;

      const { error } = await supabase.from('content_entries').update(patch).eq('id', entry.id);
      if (error) throw new Error(`column backfill ${entry.id}: ${error.message}`);
      done++;
      if (done % 25 === 0) console.log(`   ${done}/${needsColumns.length}`);
    }
    console.log(`   ${done}/${needsColumns.length} updated`);
  }

  // --- 2. Chunk generation for unchunked entries --------------------------
  const needsChunks = entries.filter((e) => !chunkOwners.has(e.id) && (e.content ?? '').trim().length >= 200);
  const plannedChunks = needsChunks.reduce((sum, e) => sum + chunkText(e.content).length, 0);
  console.log(`\n2. chunk generation: ${needsChunks.length} entries -> ~${plannedChunks} chunks`);

  if (APPLY && needsChunks.length > 0) {
    let done = 0, made = 0;
    for (const entry of needsChunks) {
      const pieces = chunkText(entry.content);
      for (let i = 0; i < pieces.length; i += 1) {
        const { error } = await supabase.from('content_chunks').insert({
          entry_id: entry.id,
          chunk_text: pieces[i],
          chunk_index: i,
          embedding: null,
          metadata: { section: 'Content', chunkIndex: i, generated_by: 'cleanup-corpus' },
        });
        if (error) throw new Error(`chunk ${entry.id}#${i}: ${error.message}`);
        made++;
      }
      done++;
      if (done % 10 === 0) console.log(`   ${done}/${needsChunks.length} entries, ${made} chunks`);
    }
    console.log(`   ${done}/${needsChunks.length} entries, ${made} chunks created`);
  }

  // --- 3. Empty entries ----------------------------------------------------
  const empties = entries.filter((e) => !(e.content ?? '').trim());
  console.log(`\n3. entries with no content: ${empties.length}`);
  for (const e of empties) console.log(`   ${e.title} :: ${e.id}`);

  if (empties.length > 0 && APPLY && !SKIP_DELETES) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const ids = empties.map((e) => e.id);
    const { data: full, error: backupError } = await supabase
      .from('content_entries')
      .select('*')
      .in('id', ids);
    if (backupError) throw new Error(`backup: ${backupError.message}`);

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = join(BACKUP_DIR, `cleanup-empty-${stamp}.json`);
    writeFileSync(path, JSON.stringify({ created: new Date().toISOString(), entries: full }, null, 2));
    console.log(`   backup: ${path}`);

    const { error } = await supabase.from('content_entries').delete().in('id', ids);
    if (error) throw new Error(`delete: ${error.message}`);
    console.log(`   deleted ${ids.length} empty entries`);
  } else if (empties.length > 0 && SKIP_DELETES) {
    console.log('   (--skip-deletes set, leaving them in place)');
  }

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply.');
    return;
  }

  // --- verification --------------------------------------------------------
  const after = await selectAll<any>('content_entries', 'id,content,category,tags');
  const afterChunks = await selectAll<any>('content_chunks', 'entry_id');
  const afterOwners = new Set(afterChunks.map((c) => c.entry_id));
  console.log(`\n--- after ---`);
  console.log(`entries: ${after.length} | chunks: ${afterChunks.length}`);
  console.log(`missing category column: ${after.filter((e) => !e.category).length}`);
  console.log(`missing tags column:     ${after.filter((e) => !Array.isArray(e.tags) || e.tags.length === 0).length}`);
  console.log(`entries with no chunks:  ${after.filter((e) => !afterOwners.has(e.id)).length}`);
  console.log(`entries with no content: ${after.filter((e) => !(e.content ?? '').trim()).length}`);
}

main().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
