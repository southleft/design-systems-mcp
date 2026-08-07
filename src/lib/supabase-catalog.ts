/**
 * Supabase-backed catalog access for the non-vector tools.
 *
 * `browse_by_category` and `get_all_tags` used to read the in-memory store,
 * which only ever holds SAMPLE_ENTRIES — so they reported a single sample
 * entry and three tags regardless of what was in the database. These helpers
 * read the real knowledge base instead.
 *
 * Everything here is embedding-free, so it keeps working when the OpenAI
 * quota is exhausted and vector search is unavailable.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ContentEntry, Category } from '../../types/content';
import {
  getEntriesByCategory as getEntriesByCategoryLocal,
  getAllTags as getAllTagsLocal
} from './content-manager';

const SUPABASE_TIMEOUT_MS = 10_000;
const CATALOG_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_TEXT_MATCH_ROWS = 200;

/** Columns needed to build a ContentEntry — deliberately excludes `embedding`. */
const ENTRY_COLUMNS =
  'id,title,content,source_type,source_location,category,tags,confidence,system_name,metadata,ingested_at,updated_at';

export function createSupabaseClient(env?: any): SupabaseClient | null {
  const url = env?.SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    env?.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    env?.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Entries were ingested by two generations of scripts: older rows carry
 * category/tags/confidence/system inside the `metadata` JSONB, newer rows use
 * dedicated columns. Read both so neither population disappears.
 */
export function rowToContentEntry(row: any): ContentEntry {
  const metadata = (row.metadata && typeof row.metadata === 'object') ? row.metadata : {};

  const category = row.category || metadata.category || 'general';
  const tags = firstNonEmptyArray(row.tags, metadata.tags);
  const confidence = row.confidence || metadata.confidence || 'medium';
  const system = row.system_name || metadata.system || '';
  const sourceLocation = row.source_location || metadata.source_url || 'supabase';

  return {
    id: row.id,
    title: row.title,
    content: row.content || '',
    source: {
      type: row.source_type || 'database',
      location: sourceLocation,
      ingested_at: row.ingested_at || new Date().toISOString(),
    },
    chunks: [],
    metadata: {
      ...metadata,
      category,
      tags,
      confidence,
      system,
      last_updated: row.updated_at || new Date().toISOString(),
      source_url: sourceLocation,
    },
  };
}

function firstNonEmptyArray(...candidates: any[]): string[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) return candidate;
  }
  return [];
}

/** Matches a category held in either the column or the metadata JSONB. */
function categoryFilter(category: string): string {
  // PostgREST `or` values are comma-separated; a comma in the category would
  // split the filter into nonsense, so reject anything unusual up front.
  const safe = category.replace(/[^a-zA-Z0-9_-]/g, '');
  return `category.eq.${safe},metadata->>category.eq.${safe}`;
}

// ---------------------------------------------------------------------------
// Keyword search (no embeddings required)
// ---------------------------------------------------------------------------

/**
 * Full-text search over the real knowledge base, used when vector search is
 * unavailable (no OpenAI quota/key, RPC failure, or zero vector matches).
 *
 * Postgres does the matching via the `search_text` tsvector; ranking is done
 * here because PostgREST cannot order by ts_rank without a dedicated RPC.
 */
export async function searchSupabaseText(
  env: any,
  options: { query?: string; category?: string; tags?: string[]; limit?: number } = {}
): Promise<ContentEntry[]> {
  const supabase = createSupabaseClient(env);
  if (!supabase) return [];

  const query = (options.query || '').trim();
  if (!query) return [];

  const limit = Math.min(Math.max(1, options.limit ?? 20), 50);
  const terms = query.split(/\s+/).filter(Boolean);

  // AND-match first (precise), then OR-match (recall) if nothing came back.
  const attempts: Array<{ expression: string; type?: 'websearch' }> = [
    { expression: query, type: 'websearch' },
  ];
  if (terms.length > 1) {
    attempts.push({ expression: terms.map(sanitizeTsTerm).filter(Boolean).join(' | ') });
  }

  for (const attempt of attempts) {
    if (!attempt.expression) continue;

    let builder = supabase
      .from('content_entries')
      .select(ENTRY_COLUMNS)
      .textSearch('search_text', attempt.expression, attempt.type ? { type: attempt.type } : undefined)
      .limit(MAX_TEXT_MATCH_ROWS);

    if (options.category) {
      builder = builder.or(categoryFilter(options.category));
    }

    const { data, error } = await builder.abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

    // Surface real failures so the caller can tell "Supabase is down" from
    // "the knowledge base has nothing on this" — they warrant different answers.
    if (error) throw new Error(`Supabase text search failed: ${error.message}`);
    if (!data || data.length === 0) continue;

    let entries = data.map(rowToContentEntry);

    if (options.tags && options.tags.length > 0) {
      const wanted = options.tags.map((tag) => tag.toLowerCase());
      const filtered = entries.filter((entry) =>
        entry.metadata.tags.some((tag) => wanted.includes(String(tag).toLowerCase()))
      );
      // Tag filters narrow results; don't let them empty out an otherwise
      // useful result set.
      if (filtered.length > 0) entries = filtered;
    }

    return rankByRelevance(entries, terms).slice(0, limit);
  }

  return [];
}

/** Strips tsquery operators so user input can't produce a syntax error. */
function sanitizeTsTerm(term: string): string {
  return term.replace(/[^\p{L}\p{N}_-]/gu, '');
}

function rankByRelevance(entries: ContentEntry[], terms: string[]): ContentEntry[] {
  const needles = terms.map((term) => term.toLowerCase()).filter(Boolean);
  if (needles.length === 0) return entries;

  const scored = entries.map((entry, index) => {
    const title = entry.title.toLowerCase();
    const tags = entry.metadata.tags.join(' ').toLowerCase();
    const content = entry.content.toLowerCase();

    let score = 0;
    for (const needle of needles) {
      if (title.includes(needle)) score += 10;
      if (tags.includes(needle)) score += 4;
      if (content.includes(needle)) score += 1;
    }
    // Whole-phrase hits in the title are the strongest signal available.
    if (needles.length > 1 && title.includes(needles.join(' '))) score += 15;

    return { entry, score, index };
  });

  return scored
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((item) => item.entry);
}

// ---------------------------------------------------------------------------
// Tags & categories
// ---------------------------------------------------------------------------

let tagCache: { tags: string[]; expiresAt: number } | null = null;

export async function getAllTagsFromSupabase(env: any): Promise<string[]> {
  if (tagCache && tagCache.expiresAt > Date.now()) return tagCache.tags;

  const supabase = createSupabaseClient(env);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_entries')
    .select('tags,metadata')
    .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

  if (error || !data) return [];

  const tags = new Set<string>();
  for (const row of data as any[]) {
    for (const tag of firstNonEmptyArray(row.tags, row.metadata?.tags)) {
      const normalized = String(tag).trim();
      if (normalized) tags.add(normalized);
    }
  }

  const sorted = Array.from(tags).sort();
  tagCache = { tags: sorted, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS };
  return sorted;
}

export async function getEntriesByCategoryFromSupabase(
  env: any,
  category: Category | string
): Promise<ContentEntry[]> {
  const supabase = createSupabaseClient(env);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_entries')
    .select(ENTRY_COLUMNS)
    .or(categoryFilter(String(category)))
    .order('title')
    .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

  if (error || !data) return [];
  return data.map(rowToContentEntry);
}

/**
 * Tool-facing accessors: read the knowledge base, and only drop to the
 * in-memory sample entries if Supabase is unreachable.
 */
export async function resolveEntriesByCategory(
  env: any,
  category: Category | string
): Promise<ContentEntry[]> {
  try {
    const entries = await getEntriesByCategoryFromSupabase(env, category);
    if (entries.length > 0) return entries;
  } catch (error: any) {
    console.error('[Catalog] browse_by_category fell back to local entries:', error?.message);
  }
  return getEntriesByCategoryLocal(category as Category);
}

export async function resolveAllTags(env: any): Promise<string[]> {
  try {
    const tags = await getAllTagsFromSupabase(env);
    if (tags.length > 0) return tags;
  } catch (error: any) {
    console.error('[Catalog] get_all_tags fell back to local tags:', error?.message);
  }
  return getAllTagsLocal();
}

let categoryCache: { categories: Array<{ name: string; count: number }>; expiresAt: number } | null = null;

/** Category names that actually exist in the knowledge base, with entry counts. */
export async function getCategoriesFromSupabase(
  env: any
): Promise<Array<{ name: string; count: number }>> {
  if (categoryCache && categoryCache.expiresAt > Date.now()) return categoryCache.categories;

  const supabase = createSupabaseClient(env);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_entries')
    .select('category,metadata')
    .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data as any[]) {
    const name = row.category || row.metadata?.category || 'general';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const categories = Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  categoryCache = { categories, expiresAt: Date.now() + CATALOG_CACHE_TTL_MS };
  return categories;
}
