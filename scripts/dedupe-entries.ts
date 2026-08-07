/**
 * Dedupe re-ingested entries in content_entries.
 *
 * Duplicates come from the same source being ingested twice (e.g. the
 * 2025-11-20 13:22 and 14:02 batches). A group is only ever collapsed when
 * every row in it shares one source_location — same title from a different
 * source is a different resource, not a duplicate.
 *
 * Keeper within a group: most chunks, then longest content, then earliest
 * ingested_at. Deleting an entry cascades to its chunks (ON DELETE CASCADE),
 * so the keeper must be the row that actually owns the richer chunk set.
 *
 * Every row this would delete — plus its chunks, embeddings included — is
 * written to .backups/ before a single delete runs, so the operation can be
 * reversed by re-inserting the JSON.
 *
 * Usage:
 *   npx tsx scripts/dedupe-entries.ts            # dry run, writes backup
 *   npx tsx scripts/dedupe-entries.ts --apply    # actually delete
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = join(process.cwd(), '.backups');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}
const supabase = createClient(url, key);

/** PostgREST caps a response at 1000 rows; page or you silently lose data. */
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

async function main() {
  console.log(APPLY ? '=== APPLY MODE — rows will be deleted ===' : '=== DRY RUN — no writes ===\n');

  const entries = await selectAll<any>('content_entries', 'id,title,content,source_location,ingested_at');
  const chunks = await selectAll<any>('content_chunks', 'entry_id');
  console.log(`entries: ${entries.length} | chunks: ${chunks.length}`);

  const chunkCount = new Map<string, number>();
  for (const c of chunks) chunkCount.set(c.entry_id, (chunkCount.get(c.entry_id) ?? 0) + 1);

  const groups = new Map<string, any[]>();
  for (const entry of entries) {
    const groupKey = entry.title.trim().toLowerCase();
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), entry]);
  }

  const doomed: any[] = [];
  const skipped: string[] = [];

  for (const [, rows] of groups) {
    if (rows.length < 2) continue;

    // Same title, different source = different resource. Leave it alone.
    if (new Set(rows.map((r) => r.source_location)).size > 1) {
      skipped.push(rows[0].title);
      continue;
    }

    const ranked = [...rows].sort(
      (a, b) =>
        (chunkCount.get(b.id) ?? 0) - (chunkCount.get(a.id) ?? 0) ||
        (b.content ?? '').length - (a.content ?? '').length ||
        String(a.ingested_at).localeCompare(String(b.ingested_at))
    );
    const [keeper, ...losers] = ranked;

    console.log(`\n"${keeper.title.slice(0, 66)}"`);
    console.log(`  KEEP   ${keeper.id}  chunks=${chunkCount.get(keeper.id) ?? 0} len=${(keeper.content ?? '').length}`);
    for (const loser of losers) {
      console.log(`  DELETE ${loser.id}  chunks=${chunkCount.get(loser.id) ?? 0} len=${(loser.content ?? '').length}`);
      doomed.push(loser);
    }
  }

  if (skipped.length > 0) {
    console.log(`\nSkipped ${skipped.length} same-title group(s) with differing sources:`);
    for (const title of skipped) console.log(`  - ${title}`);
  }

  console.log(`\nWould delete ${doomed.length} row(s); ${entries.length - doomed.length} would remain.`);
  if (doomed.length === 0) return;

  // Full backup, embeddings included, before anything is destroyed.
  const doomedIds = doomed.map((r) => r.id);
  const backupEntries: any[] = [];
  const backupChunks: any[] = [];
  for (let i = 0; i < doomedIds.length; i += 20) {
    const batch = doomedIds.slice(i, i + 20);
    const { data: e, error: eErr } = await supabase.from('content_entries').select('*').in('id', batch);
    if (eErr) throw new Error(`backup entries: ${eErr.message}`);
    backupEntries.push(...(e ?? []));
    const { data: c, error: cErr } = await supabase.from('content_chunks').select('*').in('entry_id', batch);
    if (cErr) throw new Error(`backup chunks: ${cErr.message}`);
    backupChunks.push(...(c ?? []));
  }

  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = join(BACKUP_DIR, `dedupe-${stamp}.json`);
  writeFileSync(
    backupPath,
    JSON.stringify({ created: new Date().toISOString(), entries: backupEntries, chunks: backupChunks }, null, 2)
  );
  console.log(`\nBackup: ${backupPath}`);
  console.log(`  ${backupEntries.length} entries, ${backupChunks.length} chunks`);

  if (backupEntries.length !== doomed.length) {
    throw new Error(`Backup incomplete (${backupEntries.length}/${doomed.length}) — refusing to delete`);
  }

  if (!APPLY) {
    console.log('\nDry run complete. Re-run with --apply to delete.');
    return;
  }

  let deleted = 0;
  for (let i = 0; i < doomedIds.length; i += 20) {
    const batch = doomedIds.slice(i, i + 20);
    const { error } = await supabase.from('content_entries').delete().in('id', batch);
    if (error) throw new Error(`delete failed at batch ${i}: ${error.message}`);
    deleted += batch.length;
    console.log(`  deleted ${deleted}/${doomedIds.length}`);
  }

  const after = await selectAll<any>('content_entries', 'id,title');
  const remainingDupes = new Map<string, number>();
  for (const entry of after) {
    const groupKey = entry.title.trim().toLowerCase();
    remainingDupes.set(groupKey, (remainingDupes.get(groupKey) ?? 0) + 1);
  }
  const stillDuped = [...remainingDupes.values()].filter((n) => n > 1).length;
  const { count: chunksAfter } = await supabase
    .from('content_chunks')
    .select('*', { count: 'exact', head: true });

  console.log(`\nDone. entries: ${after.length} | duplicate title groups left: ${stillDuped} | chunks: ${chunksAfter}`);
}

main().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
