/**
 * Re-crawl entries whose stored content was mangled by the old HTML parser.
 *
 * Three parser defects damaged the corpus at ingestion time:
 *   - inline text stripped, so "<strong>Tier-3 tokens</strong> are specific to
 *     components" stored as "are specific to components"
 *   - headings hoisted into a block at the top, severing every heading from
 *     the prose it introduced
 *   - the heading pass querying the whole document rather than the content root
 *
 * All three are fixed in scripts/ingestion/html-parser.ts, but the fix only
 * applies to new ingestion. This re-fetches affected URLs, re-parses with the
 * corrected parser, and replaces content and chunks.
 *
 * Safety: an entry is only replaced when the new content is measurably better
 * — damage signals gone or reduced, and length within a sane band of the
 * original. A re-crawl that hits a paywall, a 403, or a JS-only shell must not
 * be allowed to overwrite good stored content with a login prompt.
 *
 * The embedding is set to null on replacement, because the stored vector
 * describes the old text. backfill-embeddings.ts regenerates it.
 *
 * Usage:
 *   npx tsx scripts/repair-damaged-entries.ts               # report
 *   npx tsx scripts/repair-damaged-entries.ts --apply
 *   npx tsx scripts/repair-damaged-entries.ts --apply --limit 10
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from './ingestion/html-parser.js';

const APPLY = process.argv.includes('--apply');
const limitFlag = process.argv.indexOf('--limit');
const LIMIT = limitFlag >= 0 ? Number(process.argv[limitFlag + 1]) : Infinity;
const BACKUP_DIR = join(process.cwd(), '.backups');

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;
const FETCH_TIMEOUT_MS = 25_000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const ORPHAN_BULLET = /•\s+(are|is|maps?|refers?|can|should|which|that)\b/gi;
const DANGLING = /\b(by|to|the|via|using|from|with)\s+[.,]/gi;
const HOISTED = /#{2,}\s+\w[\w\s]*#{2,}\s+\w[\w\s]*#{2,}/g;

function damageScore(text: string): number {
  const t = text ?? '';
  return (
    (t.match(ORPHAN_BULLET)?.length ?? 0) +
    (t.match(DANGLING)?.length ?? 0) +
    (t.match(HOISTED)?.length ?? 0) * 3
  );
}

function chunkText(text: string): string[] {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
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
  console.log(APPLY ? '=== APPLY MODE ===' : '=== DRY RUN (no writes) ===\n');

  const entries = await selectAll<any>('content_entries', 'id,title,content,source_location,metadata');
  const damaged = entries
    .map((e) => ({ ...e, score: damageScore(e.content) }))
    .filter((e) => e.score > 0 && /^https?:\/\//.test(e.source_location ?? ''))
    .sort((a, b) => b.score - a.score);

  console.log(`entries: ${entries.length} | showing damage signals: ${damaged.length}\n`);

  const targets = damaged.slice(0, LIMIT);
  const results = { repaired: 0, rejected: 0, failed: 0 };
  const repairs: any[] = [];

  for (const entry of targets) {
    const label = entry.title.slice(0, 52).padEnd(54);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(entry.source_location, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DesignSystemsMCP/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        console.log(`FAIL   ${label} HTTP ${response.status}`);
        results.failed++;
        continue;
      }

      const html = await response.text();
      const parsed: any = await parseHTML(html, entry.source_location);
      const fresh = (parsed?.content ?? '').trim();

      const oldLen = (entry.content ?? '').length;
      const newLen = fresh.length;
      const newScore = damageScore(fresh);

      // Guardrails: the replacement must actually be better, and must not be a
      // paywall stub or a JS shell that happens to parse cleanly.
      const betterDamage = newScore < entry.score;
      const plausibleLength = newLen >= Math.max(400, oldLen * 0.6);
      if (!betterDamage || !plausibleLength) {
        console.log(
          `SKIP   ${label} damage ${entry.score}->${newScore}, len ${oldLen}->${newLen}`
        );
        results.rejected++;
        continue;
      }

      console.log(`REPAIR ${label} damage ${entry.score}->${newScore}, len ${oldLen}->${newLen}`);
      repairs.push({ id: entry.id, title: entry.title, oldContent: entry.content, newContent: fresh });
      results.repaired++;

      if (!APPLY) continue;

      // Replace content; null the embedding since it describes the old text.
      const { error: updateError } = await supabase
        .from('content_entries')
        .update({ content: fresh, embedding: null, updated_at: new Date().toISOString() })
        .eq('id', entry.id);
      if (updateError) throw new Error(`update ${entry.id}: ${updateError.message}`);

      // Chunks derive from content, so replace them wholesale.
      const { error: deleteError } = await supabase
        .from('content_chunks')
        .delete()
        .eq('entry_id', entry.id);
      if (deleteError) throw new Error(`chunk delete ${entry.id}: ${deleteError.message}`);

      const pieces = chunkText(fresh);
      for (let i = 0; i < pieces.length; i += 1) {
        const { error: insertError } = await supabase.from('content_chunks').insert({
          entry_id: entry.id,
          chunk_text: pieces[i],
          chunk_index: i,
          embedding: null,
          metadata: { section: 'Content', chunkIndex: i, generated_by: 'repair-damaged-entries' },
        });
        if (insertError) throw new Error(`chunk ${entry.id}#${i}: ${insertError.message}`);
      }
    } catch (error: any) {
      console.log(`FAIL   ${label} ${String(error?.message ?? error).slice(0, 60)}`);
      results.failed++;
    }
  }

  if (APPLY && repairs.length > 0) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const path = join(BACKUP_DIR, `repair-${stamp}.json`);
    writeFileSync(path, JSON.stringify({ created: new Date().toISOString(), repairs }, null, 2));
    console.log(`\nbackup of prior content: ${path}`);
  }

  console.log(
    `\n${APPLY ? 'repaired' : 'would repair'}: ${results.repaired} | rejected as not-better: ${results.rejected} | fetch failed: ${results.failed}`
  );
  if (APPLY && results.repaired > 0) {
    console.log('Repaired entries have a null embedding — run backfill-embeddings.ts once credits are available.');
  }
  if (!APPLY) console.log('Re-run with --apply to write.');
}

main().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
