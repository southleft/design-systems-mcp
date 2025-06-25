/**
 * Content management system for Design Systems MCP
 * Handles loading, searching, and managing content entries
 */

import { ContentEntry, Category, SearchOptions, ContentChunk } from "../../types/content";

// In-memory storage for entries
let entries: ContentEntry[] = [];
let tags: Set<string> = new Set();

// Sample entries for demo purposes
export const SAMPLE_ENTRIES: ContentEntry[] = [
  {
    id: "sample-button-guide",
    title: "Button Component Guidelines",
    source: {
      type: "html",
      location: "sample-button-guidelines.json",
      ingested_at: "2024-01-20T10:00:00Z"
    },
    content: "Buttons are fundamental interactive elements in design systems. They should be clearly distinguishable, accessible, and follow consistent patterns across all platforms. Primary buttons are used for main actions, secondary buttons for supporting actions, and tertiary buttons for subtle interactions.",
    chunks: [
      {
        id: "chunk-1",
        text: "Buttons are fundamental interactive elements in design systems. They should be clearly distinguishable, accessible, and follow consistent patterns across all platforms.",
        metadata: {
          section: "Introduction",
          chunkIndex: 0
        }
      },
      {
        id: "chunk-2",
        text: "Primary buttons are used for main actions, secondary buttons for supporting actions, and tertiary buttons for subtle interactions.",
        metadata: {
          section: "Button Types",
          chunkIndex: 1
        }
      }
    ],
    metadata: {
      category: "components",
      tags: ["button", "interaction", "accessibility"],
      confidence: "high",
      system: "Sample Design System",
      last_updated: "2024-01-20T10:00:00Z"
    }
  }
];

/**
 * Load entries into memory
 */
export function loadEntries(entriesToLoad: ContentEntry[]): void {
  entries = [...entriesToLoad];

  // Build tags index
  tags.clear();
  for (const entry of entries) {
    for (const tag of entry.metadata.tags) {
      tags.add(tag);
    }
  }

  console.log(`Loaded ${entries.length} entries with ${tags.size} unique tags`);
}

/**
 * Load entries from the content/entries directory (Node.js environment only)
 * For Cloudflare Workers, entries should be loaded directly via loadEntries()
 */
export async function loadEntriesFromDisk(): Promise<void> {
  // This function is intended for Node.js environments only
  // In Cloudflare Workers, use loadEntries() with imported data
  console.log('loadEntriesFromDisk() is not available in Cloudflare Worker environment');
  console.log('Falling back to sample entries');
  loadEntries(SAMPLE_ENTRIES);
}

/**
 * Search entries based on query and filters
 */
export function searchEntries(options: SearchOptions = {}): ContentEntry[] {
  const { query, category, tags: filterTags, confidence, limit = 50 } = options;

  let results = [...entries];

  // Filter by category
  if (category) {
    results = results.filter(entry => entry.metadata.category === category);
  }

  // Filter by tags
  if (filterTags && filterTags.length > 0) {
    results = results.filter(entry =>
      filterTags.some(tag => entry.metadata.tags.includes(tag))
    );
  }

  // Filter by confidence
  if (confidence) {
    results = results.filter(entry => entry.metadata.confidence === confidence);
  }

  // Search by query in title and content
  if (query) {
    const queryLower = query.toLowerCase();

    // Extract key terms from questions (remove common question words)
    const cleanedQuery = queryLower
      .replace(/^(what|how|when|where|why|which|who|does|do|did|will|would|should|could|can|is|are|was|were)\s+/gi, '')
      .replace(/\b(are|is|the|a|an|of|for|in|on|at|to|from|with|by|about)\b/gi, '')
      .replace(/[?!.,;]/g, '')
      .trim();

    // Split into individual terms for better matching
    const searchTerms = cleanedQuery.split(/\s+/).filter(term => term.length > 2);

    // First, calculate scores for all entries
    const scoredResults = results.map(entry => ({
      entry,
      score: calculateRelevanceScore(entry, queryLower, searchTerms)
    }));

    // Filter out entries with very low scores (less than 1.0)
    const relevantResults = scoredResults.filter(item => item.score >= 1.0);

    // If we have good matches, use them. Otherwise, fall back to basic matching
    if (relevantResults.length > 0) {
      results = relevantResults.map(item => item.entry);
    } else {
      // Fallback: basic text matching for very broad queries
      results = results.filter(entry => {
        const titleLower = entry.title.toLowerCase();
        const contentLower = entry.content.toLowerCase();
        const tagsLower = entry.metadata.tags.map(tag => tag.toLowerCase());

        // Check original query first
        const exactTitleMatch = titleLower.includes(queryLower);
        const exactContentMatch = contentLower.includes(queryLower);
        const exactTagMatch = entry.metadata.tags.some(tag => tag.toLowerCase().includes(queryLower));

        return exactTitleMatch || exactContentMatch || exactTagMatch;
      });
    }
  }

  // Sort by relevance (simple scoring)
  if (query) {
    const queryLower = query.toLowerCase();
    const cleanedQuery = queryLower
      .replace(/^(what|how|when|where|why|which|who|does|do|did|will|would|should|could|can|is|are|was|were)\s+/gi, '')
      .replace(/\b(are|is|the|a|an|of|for|in|on|at|to|from|with|by|about)\b/gi, '')
      .replace(/[?!.,;]/g, '')
      .trim();
    const searchTerms = cleanedQuery.split(/\s+/).filter(term => term.length > 2);

    results.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a, queryLower, searchTerms);
      const scoreB = calculateRelevanceScore(b, queryLower, searchTerms);
      return scoreB - scoreA;
    });
  }

  return results.slice(0, limit);
}

/**
 * Search within content chunks for more granular results
 */
export function searchChunks(query: string, limit: number = 5): Array<{
  entry: ContentEntry;
  chunk: ContentChunk;
  score: number;
}> {
  const queryLower = query.toLowerCase();

  // Extract key terms from questions (same logic as main search)
  const cleanedQuery = queryLower
    .replace(/^(what|how|when|where|why|which|who|does|do|did|will|would|should|could|can|is|are|was|were)\s+/gi, '')
    .replace(/\b(are|is|the|a|an|of|for|in|on|at|to|from|with|by|about)\b/gi, '')
    .replace(/[?!.,;]/g, '')
    .trim();
  const searchTerms = cleanedQuery.split(/\s+/).filter(term => term.length > 2);

  const results: Array<{ entry: ContentEntry; chunk: ContentChunk; score: number }> = [];

  for (const entry of entries) {
    for (const chunk of entry.chunks) {
      const chunkTextLower = chunk.text.toLowerCase();

      // Check if chunk matches original query or individual terms
      const exactMatch = chunkTextLower.includes(queryLower);
      const termMatch = searchTerms.some(term => chunkTextLower.includes(term));

      if (exactMatch || termMatch) {
        const score = calculateChunkRelevanceScore(chunk, queryLower, searchTerms);
        results.push({ entry, chunk, score });
      }
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Get entries by category
 */
export function getEntriesByCategory(category: Category): ContentEntry[] {
  return entries.filter(entry => entry.metadata.category === category);
}

/**
 * Get all available tags
 */
export function getAllTags(): string[] {
  return Array.from(tags).sort();
}

/**
 * Get entry by ID
 */
export function getEntryById(id: string): ContentEntry | undefined {
  return entries.find(entry => entry.id === id);
}

/**
 * Calculate relevance score for an entry
 */
function calculateRelevanceScore(entry: ContentEntry, query: string, searchTerms: string[] = []): number {
  let score = 0;

  // Title matches are worth more
  const titleMatches = (entry.title.toLowerCase().match(new RegExp(query, 'g')) || []).length;
  score += titleMatches * 3;

  // Content matches
  const contentMatches = (entry.content.toLowerCase().match(new RegExp(query, 'g')) || []).length;
  score += contentMatches * 1;

  // Tag matches are worth more
  const tagMatches = entry.metadata.tags.filter(tag =>
    tag.toLowerCase().includes(query)
  ).length;
  score += tagMatches * 2;

  // Individual term matches
  for (const term of searchTerms) {
    const titleTermMatches = (entry.title.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    const contentTermMatches = (entry.content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    const tagTermMatches = entry.metadata.tags.filter(tag =>
      tag.toLowerCase().includes(term)
    ).length;

    score += titleTermMatches * 2;
    score += contentTermMatches * 0.5;
    score += tagTermMatches * 1.5;
  }

  // Higher confidence entries get a small boost
  if (entry.metadata.confidence === 'high') score += 0.5;
  if (entry.metadata.confidence === 'medium') score += 0.2;

  return score;
}

/**
 * Calculate relevance score for a chunk
 */
function calculateChunkRelevanceScore(chunk: ContentChunk, query: string, searchTerms: string[] = []): number {
  let score = 0;

  // Count occurrences of original query
  const matches = (chunk.text.toLowerCase().match(new RegExp(query, 'g')) || []).length;
  score += matches;

  // Count occurrences of individual terms
  for (const term of searchTerms) {
    const termMatches = (chunk.text.toLowerCase().match(new RegExp(term, 'g')) || []).length;
    score += termMatches * 0.5;

    // Bonus for matches in section headings
    if (chunk.metadata?.section?.toLowerCase().includes(term)) {
      score += 1;
    }
  }

  // Bonus for matches in section headings
  if (chunk.metadata?.section?.toLowerCase().includes(query)) {
    score += 2;
  }

  return score;
}

/**
 * Get entry count
 */
export function getEntryCount(): number {
  return entries.length;
}

/**
 * Get entries summary for debugging
 */
export function getEntriesSummary(): Array<{ id: string; title: string; category: string; tags: string[] }> {
  return entries.map(entry => ({
    id: entry.id,
    title: entry.title,
    category: entry.metadata.category,
    tags: entry.metadata.tags
  }));
}
