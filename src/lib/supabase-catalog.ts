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
/**
 * Ceiling on the rank-only pass. Generous on purpose: these rows carry no
 * `content`, and ranking a truncated match set is how relevant entries get
 * lost. Raise it if the corpus outgrows it.
 */
const MAX_TEXT_MATCH_ROWS = 1000;

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
 * Question words carry no signal but dominate an OR match — a query like
 * "When should I build a web component?" would otherwise match nearly every
 * row on "should"/"build" and bury the entries that are actually about web
 * components.
 */
const STOPWORDS = new Set([
  'a', 'about', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'being',
  'best', 'between', 'but', 'by', 'can', 'did', 'do', 'does', 'for', 'from', 'get',
  'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me',
  'my', 'of', 'on', 'or', 'our', 'out', 'over', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'to', 'us', 'use', 'using', 'want', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'why', 'will', 'with', 'would', 'you', 'your'
]);

/** Query words worth matching on, question scaffolding removed. */
function contentTerms(query: string): string[] {
  const terms = query
    .split(/\s+/)
    .map((term) => sanitizeTsTerm(term).toLowerCase())
    .filter((term) => term.length > 1 && !STOPWORDS.has(term));
  // An all-stopword query ("how do I do this") still deserves an attempt.
  return terms.length > 0 ? terms : query.split(/\s+/).map(sanitizeTsTerm).filter(Boolean);
}

/**
 * Full-text search over the real knowledge base, used when vector search is
 * unavailable (no OpenAI quota/key, RPC failure, or zero vector matches).
 *
 * Matching happens in Postgres against the `search_text` tsvector. Ranking has
 * to happen here (PostgREST cannot order by ts_rank without a dedicated RPC),
 * so this runs in two passes: a wide, cheap pass that fetches only the columns
 * needed to rank, then a second fetch of full rows for the winners. Ranking a
 * truncated slice of matches instead would drop good entries purely on the
 * order Postgres happened to return them in.
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
  const terms = contentTerms(query);

  // Two match sets, unioned rather than tried in sequence:
  //   precision — every word present (AND)
  //   recall    — any content word present (OR)
  //
  // Sequential attempts looked reasonable but ranked badly: on a long question
  // the AND pass returns only sprawling documents that happen to contain every
  // word, and returning early on that non-empty set hides the short, on-topic
  // entry that omits one of them. Both sets are scored together instead, with
  // AND membership as a bonus rather than a gate.
  const [precise, wide] = await Promise.all([
    matchEntries(supabase, options, { expression: query, type: 'websearch' }),
    terms.length > 1
      ? matchEntries(supabase, options, { expression: terms.join(' | ') })
      : Promise.resolve([]),
  ]);

  const preciseIds = new Set(precise.map((entry) => entry.id));
  const candidates = [...precise];
  for (const entry of wide) {
    if (!preciseIds.has(entry.id)) candidates.push(entry);
  }
  if (candidates.length === 0) return [];

  let pool = candidates;
  if (options.tags && options.tags.length > 0) {
    const wanted = options.tags.map((tag) => tag.toLowerCase());
    const filtered = pool.filter((entry) =>
      entry.metadata.tags.some((tag) => wanted.includes(String(tag).toLowerCase()))
    );
    // Tag filters narrow results; don't let them empty out an otherwise
    // useful result set.
    if (filtered.length > 0) pool = filtered;
  }

  const winners = rankByRelevance(pool, terms, preciseIds).slice(0, limit);
  if (winners.length === 0) return [];

  // Second pass: full rows (including content) for the entries we're returning.
  const { data: full, error: fullError } = await supabase
    .from('content_entries')
    .select(ENTRY_COLUMNS)
    .in('id', winners.map((entry) => entry.id))
    .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

  if (fullError) throw new Error(`Supabase entry fetch failed: ${fullError.message}`);
  if (!full || full.length === 0) return [];

  // `in` loses the ranking, so restore it.
  const byId = new Map(full.map((row: any) => [row.id, rowToContentEntry(row)]));
  return winners.map((entry) => byId.get(entry.id) ?? entry);
}

export interface ChunkHit {
  entryId: string;
  title: string;
  sourceLocation: string;
  chunkIndex: number;
  section?: string;
  text: string;
}

/**
 * Search the actual `content_chunks` table.
 *
 * The `search_chunks` tool never did this: it re-ran an entry-level search and
 * relabelled each entry as a chunk, printing the entry's `content` — which
 * begins with the page's flattened heading block. Callers asking for the
 * specific passage that answers a question got a table of contents, while the
 * real chunk rows went unread.
 */
export async function searchSupabaseChunks(
  env: any,
  options: { query?: string; limit?: number } = {}
): Promise<ChunkHit[]> {
  const supabase = createSupabaseClient(env);
  if (!supabase) return [];

  const query = (options.query || '').trim();
  if (!query) return [];

  const limit = Math.min(Math.max(1, options.limit ?? 8), 25);
  const terms = contentTerms(query);

  const [precise, wide] = await Promise.all([
    matchChunks(supabase, { expression: query, type: 'websearch' }),
    terms.length > 1
      ? matchChunks(supabase, { expression: terms.join(' | ') })
      : Promise.resolve([]),
  ]);

  const seen = new Set(precise.map((row: any) => row.id));
  const candidates = [...precise];
  for (const row of wide as any[]) {
    if (!seen.has(row.id)) candidates.push(row);
  }
  if (candidates.length === 0) return [];

  const preciseIds = new Set(precise.map((row: any) => row.id));
  const needles = terms.map((term) => term.toLowerCase());
  const ranked = candidates
    .map((row: any, index: number) => {
      const raw = row.chunk_text || '';
      const text = raw.toLowerCase();
      let score = 0;
      for (const needle of needles) {
        if (matchesTerm(text, needle)) score += 3;
      }
      const covered = needles.filter((needle) => matchesTerm(text, needle)).length;
      score += Math.round((covered / Math.max(1, needles.length)) * 10);
      if (preciseIds.has(row.id)) score += 6;
      // A page's flattened heading block names every topic on the page, so it
      // matches almost any query about that page while explaining none of it.
      // Push it below chunks of actual prose.
      if (headingDensity(raw) > 0.25) score -= 12;
      return { row, score, index };
    })
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .slice(0, limit)
    .map((item) => item.row);

  // Attach the parent entry so results can cite a title and source.
  const entryIds = [...new Set(ranked.map((row: any) => row.entry_id))];
  const { data: parents } = await supabase
    .from('content_entries')
    .select('id,title,source_location,metadata')
    .in('id', entryIds)
    .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

  const byId = new Map((parents ?? []).map((row: any) => [row.id, row]));

  return ranked.map((row: any) => {
    const parent: any = byId.get(row.entry_id);
    return {
      entryId: row.entry_id,
      title: parent?.title || 'Untitled',
      sourceLocation: parent?.source_location || parent?.metadata?.source_url || '',
      chunkIndex: row.chunk_index ?? 0,
      section: row.metadata?.section,
      text: row.chunk_text || '',
    };
  });
}

/**
 * Rough share of a chunk that is markdown heading markup. Table-of-contents
 * chunks — the collapsed `# Title ## Section ## Section` block many crawled
 * pages start with — score high; ordinary prose scores near zero.
 */
function headingDensity(text: string): number {
  if (!text) return 0;
  const headings = text.match(/#{1,6}\s+\S/g)?.length ?? 0;
  if (headings === 0) return 0;
  const words = text.split(/\s+/).length;
  return (headings * 8) / Math.max(1, words);
}

async function matchChunks(
  supabase: SupabaseClient,
  attempt: { expression: string; type?: 'websearch' }
): Promise<any[]> {
  if (!attempt.expression) return [];
  const { data, error } = await supabase
    .from('content_chunks')
    .select('id,entry_id,chunk_index,chunk_text,metadata')
    .textSearch('chunk_text', attempt.expression, attempt.type ? { type: attempt.type } : undefined)
    .limit(MAX_TEXT_MATCH_ROWS)
    .abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

  if (error) throw new Error(`Supabase chunk search failed: ${error.message}`);
  return data ?? [];
}

/** One rank-only match pass: cheap columns, no `content`. */
async function matchEntries(
  supabase: SupabaseClient,
  options: { category?: string },
  attempt: { expression: string; type?: 'websearch' }
): Promise<ContentEntry[]> {
  if (!attempt.expression) return [];

  let builder = supabase
    .from('content_entries')
    .select('id,title,category,tags,metadata')
    .textSearch('search_text', attempt.expression, attempt.type ? { type: attempt.type } : undefined)
    .limit(MAX_TEXT_MATCH_ROWS);

  if (options.category) {
    builder = builder.or(categoryFilter(options.category));
  }

  const { data, error } = await builder.abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

  // Surface real failures so the caller can tell "Supabase is down" from
  // "the knowledge base has nothing on this" — they warrant different answers.
  if (error) throw new Error(`Supabase text search failed: ${error.message}`);
  return (data ?? []).map(rowToContentEntry);
}

/** Strips tsquery operators so user input can't produce a syntax error. */
function sanitizeTsTerm(term: string): string {
  return term.replace(/[^\p{L}\p{N}_-]/gu, '');
}

/**
 * Postgres stems inside the tsvector, but ranking here compares raw strings —
 * so "teams" in the query would miss "Team Models for Scaling a Design System"
 * in the title. Comparing against the singular stem closes that gap without
 * pulling in a stemmer.
 */
function matchesTerm(haystack: string, needle: string): boolean {
  if (haystack.includes(needle)) return true;
  if (needle.length > 4 && needle.endsWith('es') && haystack.includes(needle.slice(0, -2))) return true;
  if (needle.length > 3 && needle.endsWith('s') && haystack.includes(needle.slice(0, -1))) return true;
  return false;
}

/**
 * Scores candidates from the rank-only pass, where `content` is empty by
 * design — title and tags are the signals that survive, and they are the ones
 * worth trusting anyway. Postgres has already guaranteed every candidate
 * matches somewhere in its full text.
 */
function rankByRelevance(
  entries: ContentEntry[],
  terms: string[],
  preciseIds: Set<string> = new Set()
): ContentEntry[] {
  const needles = terms.map((term) => term.toLowerCase()).filter(Boolean);
  if (needles.length === 0) return entries;

  const scored = entries.map((entry, index) => {
    const title = entry.title.toLowerCase();
    const tags = entry.metadata.tags.join(' ').toLowerCase();
    const content = (entry.content || '').toLowerCase();

    let score = 0;
    for (const needle of needles) {
      if (matchesTerm(title, needle)) score += 10;
      if (matchesTerm(tags, needle)) score += 4;
      if (matchesTerm(content, needle)) score += 1;
    }
    // Covering most of the query beats matching one word loudly.
    const covered = needles.filter(
      (needle) => matchesTerm(title, needle) || matchesTerm(tags, needle)
    ).length;
    score += Math.round((covered / needles.length) * 12);
    // Whole-phrase hits in the title are the strongest signal available.
    if (needles.length > 1 && title.includes(needles.join(' '))) score += 15;
    // Matching every word somewhere is worth something, but not enough to
    // outrank a title that is plainly about the subject.
    if (preciseIds.has(entry.id)) score += 8;

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
