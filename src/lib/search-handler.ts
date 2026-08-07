/**
 * Unified search handler that checks Supabase first, falls back to local
 * Includes source reliability enrichment for content quality transparency
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { type ContentEntry, type SearchOptions, Category } from '../../types/content';
import { searchEntries as searchEntriesLocal } from './content-manager';
import { searchSupabaseText, rowToContentEntry } from './supabase-catalog';
import {
  getSourceReliability,
  requiresAccessibilityCaveats,
  getAccessibilityGuidanceDisclaimer,
  formatReliabilityBadge
} from './source-authority';

// Server-side bounds, enforced regardless of what callers request
const MAX_LIMIT = 50;
const EMBEDDING_TIMEOUT_MS = 10_000;
const SUPABASE_TIMEOUT_MS = 10_000;

// Per-isolate embedding cache: repeated queries (e.g. UI suggestion buttons,
// an LLM retrying the same search) skip the OpenAI round-trip.
const EMBEDDING_CACHE_TTL_MS = 15 * 60 * 1000;
const EMBEDDING_CACHE_MAX_ENTRIES = 500;
const embeddingCache = new Map<string, { embedding: number[]; expiresAt: number }>();

async function getQueryEmbedding(openaiKey: string, query: string): Promise<number[]> {
  const cacheKey = query.slice(0, 8191);
  const cached = embeddingCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.embedding;
  }

  const openai = new OpenAI({ apiKey: openaiKey, timeout: EMBEDDING_TIMEOUT_MS });
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: cacheKey,
  });
  const embedding = response.data[0].embedding;

  // Lazy eviction: drop expired entries, then oldest, before inserting
  if (embeddingCache.size >= EMBEDDING_CACHE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [key, value] of embeddingCache) {
      if (value.expiresAt <= now) embeddingCache.delete(key);
    }
    if (embeddingCache.size >= EMBEDDING_CACHE_MAX_ENTRIES) {
      embeddingCache.delete(embeddingCache.keys().next().value!);
    }
  }
  embeddingCache.set(cacheKey, { embedding, expiresAt: Date.now() + EMBEDDING_CACHE_TTL_MS });

  return embedding;
}

/**
 * Enrich a content entry with source reliability information
 */
function enrichWithReliability(entry: ContentEntry): ContentEntry {
  const sourceLocation = entry.source?.location || entry.metadata?.source_url || '';
  const reliability = getSourceReliability(sourceLocation);

  // Create enriched metadata
  const enrichedMetadata = {
    ...entry.metadata,
    reliability,
    reliabilityBadge: formatReliabilityBadge(reliability.level)
  };

  // Add important note if source requires caveats (like APG)
  if (reliability.importantNote) {
    enrichedMetadata.importantNote = reliability.importantNote;
  }

  // Adjust confidence based on reliability level
  // APG and reference implementations should not be marked as "high" confidence for accessibility
  if (reliability.level === 'reference' && entry.metadata.confidence === 'high') {
    if (requiresAccessibilityCaveats(sourceLocation)) {
      enrichedMetadata.confidence = 'medium';
    }
  }

  return {
    ...entry,
    metadata: enrichedMetadata
  };
}

/**
 * Check if any results contain APG/ARIA content that needs disclaimers
 */
function resultsContainAPGContent(results: ContentEntry[]): boolean {
  return results.some(entry => {
    const sourceLocation = entry.source?.location || entry.metadata?.source_url || '';
    return requiresAccessibilityCaveats(sourceLocation);
  });
}

export async function searchWithSupabase(options: SearchOptions = {}, env?: any): Promise<ContentEntry[]> {
  const { query, category, tags: filterTags, confidence } = options;
  const limit = Math.min(Math.max(1, options.limit ?? 50), MAX_LIMIT);

  // Get environment variables from either process.env or Cloudflare env
  const vectorEnabled = env?.VECTOR_SEARCH_ENABLED || process.env.VECTOR_SEARCH_ENABLED;
  const vectorSearchMode = env?.VECTOR_SEARCH_MODE || process.env.VECTOR_SEARCH_MODE || 'text';
  const supabaseUrl = env?.SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const openaiKey = env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const logPerformance = (env?.LOG_SEARCH_PERFORMANCE || process.env.LOG_SEARCH_PERFORMANCE) === 'true';

  // DEBUG: Log environment variable status to diagnose credential issues
  if (logPerformance) {
    console.log('[Vector Search] Checking credentials...');
    console.log('[Vector Search] vectorEnabled:', vectorEnabled);
    console.log('[Vector Search] vectorSearchMode:', vectorSearchMode);
    console.log('[Vector Search] supabaseUrl:', supabaseUrl ? 'SET (' + supabaseUrl.substring(0, 30) + '...)' : 'MISSING');
    console.log('[Vector Search] supabaseKey:', supabaseKey ? 'SET (length: ' + supabaseKey.length + ')' : 'MISSING');
    console.log('[Vector Search] openaiKey:', openaiKey ? 'SET (length: ' + openaiKey.length + ')' : 'MISSING');
    console.log('[Vector Search] Condition check:', query ? 'query=YES' : 'query=NO', vectorEnabled === 'true' ? 'enabled=YES' : 'enabled=' + vectorEnabled, vectorSearchMode === 'vector' ? 'mode=YES' : 'mode=' + vectorSearchMode);
  }

  // Check if we should use Supabase vector search
  if (query && vectorEnabled === 'true' && vectorSearchMode === 'vector') {
    try {
      if (supabaseUrl && supabaseKey && openaiKey) {
        if (logPerformance) {
          console.log('[Vector Search] ✅ All credentials present, proceeding with vector search...');
        }
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Generate embedding for the query (cached per isolate)
        const queryEmbedding = await getQueryEmbedding(openaiKey, query);

        // Search Supabase with vector similarity
        // Lower threshold to 0.15 for better recall - retrieves more relevant results
        const { data, error } = await supabase.rpc('search_content', {
          query_embedding: queryEmbedding,
          query_text: query, // Hybrid search
          match_threshold: 0.15,
          match_count: limit,
          filter_category: category,
          filter_tags: filterTags
        }).abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));

        if (!error && data && data.length > 0) {
          if (logPerformance) {
            console.log(`[Vector Search] Found ${data.length} results`);
          }

          // Convert Supabase results to ContentEntry format and enrich with reliability.
          // rowToContentEntry reads category/tags from either the dedicated
          // columns or the metadata JSONB, since both ingestion shapes exist.
          return data.map((row: any) => enrichWithReliability(rowToContentEntry(row)));
        }

        if (error && logPerformance) {
          console.error('[Vector Search] Supabase error:', error.message);
        }
      } else if (logPerformance) {
        console.log('[Vector Search] ❌ Credential check FAILED - one or more required credentials missing');
        console.log('[Vector Search] supabaseUrl:', supabaseUrl ? 'OK' : '❌ MISSING');
        console.log('[Vector Search] supabaseKey:', supabaseKey ? 'OK' : '❌ MISSING');
        console.log('[Vector Search] openaiKey:', openaiKey ? 'OK' : '❌ MISSING');
      }
    } catch (error: any) {
      if (logPerformance) {
        console.error('[Vector Search] Error:', error?.message || 'Unknown error');
      }
      // Continue to fallback
    }
  }

  // Vector search unavailable (no OpenAI quota, missing key, RPC failure, or no
  // matches). Fall back to Postgres full-text search over the same knowledge
  // base rather than the in-memory sample entries — degraded relevance is far
  // better than answering every query with the sample button entry.
  if (query && supabaseUrl && supabaseKey) {
    try {
      const textResults = await searchSupabaseText(env, {
        query,
        category,
        tags: filterTags,
        limit
      });

      if (logPerformance) {
        console.log(`[Search] Supabase keyword fallback returned ${textResults.length} results`);
      }

      // The knowledge base answered — return what it has, empty included.
      // Answering "no matches" with the sample button entry is what made every
      // query look like the database contained a single sample record.
      return textResults.map(entry => enrichWithReliability(entry));
    } catch (error: any) {
      if (logPerformance) {
        console.error('[Search] Supabase keyword fallback error:', error?.message || 'Unknown error');
      }
    }
  }

  // Last resort: the in-memory sample entries. Only reached when Supabase is
  // unreachable or genuinely has nothing matching.
  if (logPerformance) {
    console.log('[Search] Using local keyword search');
  }
  const localResults = searchEntriesLocal(options);

  // Enrich local results with reliability information
  return localResults.map(entry => enrichWithReliability(entry));
}

/**
 * Export helper functions for use in tool formatting
 */
export { resultsContainAPGContent, getAccessibilityGuidanceDisclaimer };
