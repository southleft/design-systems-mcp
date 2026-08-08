/**
 * Bulk-crawl a manifest of URLs into staged ContentEntry files, using the
 * FIXED html parser (single ordered pass, inline text preserved).
 *
 * This is the volume pipeline: research agents return CRAWL_LIST manifests of
 * verified documentation URLs; this script fetches each, parses, quality-gates,
 * and writes staged JSON for ingest-staged.ts.
 *
 * Manifest format (one per line, pipe-separated; # comments and blanks ok):
 *   url | title-hint or description | system | category | tag1,tag2,tag3
 * Only url is required. Missing fields fall back to parse results/defaults.
 *
 * Quality gates — a page is SKIPPED (never staged) when:
 *   - fetch fails or is not HTML
 *   - parsed content is under MIN_CHARS (JS shell, paywall, redirect stub)
 *   - parsed content shows damage signals (should not happen with the fixed
 *     parser; belt and suspenders)
 *   - the URL is already in the database (by source_location)
 *
 * Usage:
 *   npx tsx scripts/crawl-to-staged.ts --manifest crawl-manifest.txt
 *   npx tsx scripts/crawl-to-staged.ts --manifest crawl-manifest.txt --limit 20
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseHTML } from './ingestion/html-parser.js';

const argv = process.argv.slice(2);
const flag = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const MANIFEST = flag('--manifest');
const LIMIT = Number(flag('--limit') ?? Infinity);
const OUT = flag('--out') ?? 'content/staged';

const MIN_CHARS = 900;
const FETCH_TIMEOUT_MS = 25_000;
const POLITENESS_DELAY_MS = 350;

if (!MANIFEST) {
  console.error('Usage: npx tsx scripts/crawl-to-staged.ts --manifest <file> [--limit N] [--out dir]');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

interface ManifestRow {
  url: string;
  description: string;
  system: string;
  category: string;
  tags: string[];
}

function parseManifest(path: string): ManifestRow[] {
  const rows: ManifestRow[] = [];
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('|').map((part) => part.trim());
    if (!/^https?:\/\//.test(parts[0])) continue;
    rows.push({
      url: parts[0],
      description: parts[1] ?? '',
      system: parts[2] ?? '',
      category: parts[3] ?? 'guidelines',
      tags: (parts[4] ?? '').split(',').map((tag) => tag.trim()).filter(Boolean),
    });
  }
  return rows;
}

function slugify(url: string): string {
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, '').replace(/\./g, '-');
  const path = parsed.pathname.replace(/\/+$/, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${host}${path ? '-' + path : ''}`.slice(0, 90).toLowerCase();
}

function hasDamageSignals(text: string): boolean {
  return (
    /•\s+(are|is|maps?|refers?|can|should|which|that)\b/i.test(text) ||
    /#{2,}\s+\w[\w\s]*#{2,}\s+\w[\w\s]*#{2,}/.test(text)
  );
}

/** Infer default tags from the URL path when the manifest gives none. */
function inferTags(url: string, system: string): string[] {
  const tags = new Set<string>();
  if (system) tags.add(system.toLowerCase().replace(/\s+/g, '-'));
  const path = new URL(url).pathname.toLowerCase();
  for (const [pattern, tag] of [
    ['token', 'design-tokens'], ['color', 'color'], ['typograph', 'typography'],
    ['accessib', 'accessibility'], ['content', 'content-design'], ['motion', 'motion'],
    ['spacing', 'spacing'], ['icon', 'iconography'], ['contribut', 'contribution'],
    ['governance', 'governance'], ['pattern', 'patterns'], ['theme', 'theming'],
    ['theming', 'theming'], ['grid', 'layout'], ['layout', 'layout'],
  ] as const) {
    if (path.includes(pattern)) tags.add(tag);
  }
  tags.add('design-systems');
  return [...tags];
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const rows = parseManifest(MANIFEST!).slice(0, LIMIT);
  console.log(`manifest: ${MANIFEST} | ${rows.length} URLs\n`);

  // Existing URLs so re-runs and overlapping manifests skip cleanly.
  const existing = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from('content_entries').select('source_location').range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const row of data as any[]) existing.add((row.source_location ?? '').replace(/\/+$/, ''));
    if (data.length < 1000) break;
  }

  const results = { staged: 0, skippedExisting: 0, skippedThin: 0, skippedDamaged: 0, failed: 0 };

  for (const row of rows) {
    const label = row.url.slice(0, 76).padEnd(78);
    if (existing.has(row.url.replace(/\/+$/, ''))) {
      console.log(`SKIP-DUP  ${label}`);
      results.skippedExisting++;
      continue;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(row.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DesignSystemsMCP/1.0; +https://design-systems-mcp.southleft.com)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timer);

      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.includes('html')) {
        console.log(`FAIL      ${label} HTTP ${response.status} ${contentType.split(';')[0]}`);
        results.failed++;
        continue;
      }

      const html = await response.text();
      const parsed: any = await parseHTML(html, row.url);
      const content = (parsed?.content ?? '').trim();

      if (content.length < MIN_CHARS) {
        console.log(`SKIP-THIN ${label} ${content.length} chars`);
        results.skippedThin++;
        continue;
      }
      if (hasDamageSignals(content)) {
        console.log(`SKIP-DMG  ${label}`);
        results.skippedDamaged++;
        continue;
      }

      const title = parsed?.title && parsed.title !== 'Untitled Document'
        ? parsed.title
        : row.description || row.url;
      const slug = slugify(row.url);
      const tags = row.tags.length > 0 ? row.tags : inferTags(row.url, row.system);

      writeFileSync(join(OUT, `${slug}.json`), JSON.stringify({
        id: `crawl-${slug}`,
        title: row.system && !title.toLowerCase().includes(row.system.toLowerCase())
          ? `${title} (${row.system})`
          : title,
        source: { type: 'url', location: row.url, ingested_at: new Date().toISOString() },
        content,
        chunks: [],
        metadata: {
          category: row.category,
          tags,
          confidence: 'high',
          system: row.system,
          source_url: row.url,
          authority: 'primary',
          research_batch: 'bulk-crawl-2026-08',
          last_updated: new Date().toISOString(),
        },
      }, null, 2));

      console.log(`STAGE     ${label} ${content.length} chars`);
      results.staged++;
    } catch (error: any) {
      console.log(`FAIL      ${label} ${String(error?.message ?? error).slice(0, 50)}`);
      results.failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, POLITENESS_DELAY_MS));
  }

  console.log(`\nstaged: ${results.staged} | dup: ${results.skippedExisting} | thin: ${results.skippedThin} | damaged: ${results.skippedDamaged} | failed: ${results.failed}`);
  console.log(`Next: npx tsx scripts/ingest-staged.ts --dir ${OUT} --apply`);
}

main().catch((error) => {
  console.error('\nFAILED:', error.message);
  process.exit(1);
});
