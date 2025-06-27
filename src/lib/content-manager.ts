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
 * Improved search matching that handles chapter references and complex questions
 */
export function normalizeSearchTerms(query: string): string[] {
  const queryLower = query.toLowerCase();

  // Handle chapter number variants
  let normalizedQuery = queryLower
    .replace(/\bchapter\s+two\b/g, 'chapter 2')
    .replace(/\bchapter\s+three\b/g, 'chapter 3')
    .replace(/\bchapter\s+four\b/g, 'chapter 4')
    .replace(/\bchapter\s+five\b/g, 'chapter 5')
    .replace(/\bchapter\s+one\b/g, 'chapter 1');

  const terms: string[] = [];

  // Extract chapter references first
  const chapterMatch = normalizedQuery.match(/chapter\s+\d+/);
  if (chapterMatch) {
    terms.push(chapterMatch[0]);
    // Also add just the number for alternate matching
    const numberMatch = chapterMatch[0].match(/\d+/);
    if (numberMatch) {
      terms.push(numberMatch[0]);
    }
  }

  // Extract key domain terms that should be preserved
  const importantTerms = [
    'figma', 'component', 'property', 'properties', 'panel', 'variable', 'variables',
    'token', 'tokens', 'design', 'system', 'atomic', 'molecule', 'organism',
    'template', 'page', 'variant', 'boolean', 'text', 'instance', 'swap',
    'button', 'input', 'form', 'navigation', 'header', 'footer'
  ];

  // Find important terms in the query
  for (const term of importantTerms) {
    if (normalizedQuery.includes(term)) {
      terms.push(term);
    }
  }

  // Handle compound terms like "component properties"
  const compoundTerms = [
    'component properties', 'design system', 'atomic design',
    'design tokens', 'figma panel', 'instance swap'
  ];

  for (const compound of compoundTerms) {
    if (normalizedQuery.includes(compound)) {
      terms.push(compound);
    }
  }

  // Remove common question words but preserve meaningful content
  const cleanedQuery = normalizedQuery
    .replace(/\b(what|how|when|where|why|which|who|does|do|did|will|would|should|could|can|is|are|was|were|the|a|an|of|for|in|on|at|to|from|with|by|about|could|you|read|me|that|this|these|those)\b/g, ' ')
    .replace(/[?!.,;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract additional meaningful terms
  const additionalTerms = cleanedQuery.split(/\s+/)
    .filter(term => term.length > 2)
    .filter(term => !terms.includes(term)) // Avoid duplicates
    .filter(term => !['and', 'but', 'not', 'yet', 'nor', 'for', 'so'].includes(term)); // Filter conjunctions

  terms.push(...additionalTerms);

  return terms.filter(term => term.length > 0);
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
    const searchTerms = normalizeSearchTerms(query);

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

        // Check if any search term matches
        return searchTerms.some(term =>
          titleLower.includes(term) ||
          contentLower.includes(term) ||
          entry.metadata.tags.some(tag => tag.toLowerCase().includes(term))
        );
      });
    }
  }

  // Sort by relevance (simple scoring)
  if (query) {
    const queryLower = query.toLowerCase();
    const searchTerms = normalizeSearchTerms(query);

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
  const searchTerms = normalizeSearchTerms(query);

  const results: Array<{ entry: ContentEntry; chunk: ContentChunk; score: number }> = [];

  for (const entry of entries) {
    for (const chunk of entry.chunks) {
      const chunkTextLower = chunk.text.toLowerCase();

      // Check if chunk matches any search terms
      const exactMatch = chunkTextLower.includes(queryLower);
      const termMatch = searchTerms.some(term => chunkTextLower.includes(term));

      // Also check title for chapter references
      const titleMatch = searchTerms.some(term => entry.title.toLowerCase().includes(term));

      if (exactMatch || termMatch || titleMatch) {
        const score = calculateChunkRelevanceScore(chunk, queryLower, searchTerms, entry);
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
  const titleLower = entry.title.toLowerCase();
  const contentLower = entry.content.toLowerCase();

  // HEAVILY prioritize exact title matches
  if (titleLower.includes(query)) {
    score += 100;
  }

  // Special semantic matching for common patterns
  if (query.includes('property') && titleLower.includes('properties')) {
    score += 80; // Strong semantic match for property/properties
  }
  if (query.includes('figma') && titleLower.includes('component') &&
      (query.includes('property') || query.includes('properties'))) {
    score += 70; // "figma property" should match "component properties"
  }

  // Individual search term matches in title get big bonus
  for (const term of searchTerms) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Title matches are extremely important
    const titleTermMatches = (titleLower.match(new RegExp(escapedTerm, 'g')) || []).length;
    if (titleTermMatches > 0) {
      // Give extra weight to important terms
      if (term.includes('chapter') || /^\d+$/.test(term)) {
        score += titleTermMatches * 50;
      } else if (term === 'component' || term === 'properties' || term === 'property') {
        score += titleTermMatches * 30; // High weight for key Figma terms
      } else if (term === 'figma') {
        score += titleTermMatches * 20; // Medium weight for figma
      } else {
        score += titleTermMatches * 10;
      }
    }

    // Semantic matching - property/properties variants
    if (term === 'property' && titleLower.includes('properties')) {
      score += 25; // Bridge singular/plural
    }
    if (term === 'properties' && titleLower.includes('property')) {
      score += 25; // Bridge plural/singular
    }

    // Content matches are secondary
    const contentTermMatches = (contentLower.match(new RegExp(escapedTerm, 'g')) || []).length;
    score += contentTermMatches * 1;

    // Tag matches are also important
    const tagTermMatches = entry.metadata.tags.filter(tag =>
      tag.toLowerCase().includes(term)
    ).length;
    score += tagTermMatches * 5;
  }

  // Original query exact matches
  const titleMatches = (titleLower.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  score += titleMatches * 20;

  const contentMatches = (contentLower.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  score += contentMatches * 2;

  // Tag exact matches
  const tagMatches = entry.metadata.tags.filter(tag =>
    tag.toLowerCase().includes(query)
  ).length;
  score += tagMatches * 10;

  // Higher confidence entries get a small boost
  if (entry.metadata.confidence === 'high') score += 1;
  if (entry.metadata.confidence === 'medium') score += 0.5;

  return score;
}

/**
 * Detect if a chunk is primarily navigation/header content
 */
function isNavigationContent(chunkText: string): boolean {
  const text = chunkText.toLowerCase();

  // Count link indicators
  const linkCount = (text.match(/\[https?:\/\/[^\]]+\]/g) || []).length;
  const totalLength = text.length;

  // If more than 30% of the content is links, it's likely navigation
  if (linkCount > 5 && (linkCount * 50) / totalLength > 0.3) {
    return true;
  }

  // Check for common navigation patterns
  const navigationPatterns = [
    /product documentation/,
    /administration.*courses.*tutorials.*projects/,
    /help.*enterto select.*navigate.*close/,
    /get started.*billing.*teams.*organizations/,
    /developers.*learn design.*downloads.*careers/,
    /privacy.*status.*compare.*sketch.*adobe xd/,
    /english.*deutsch.*español.*français.*nederlands/
  ];

  return navigationPatterns.some(pattern => pattern.test(text));
}

/**
 * Calculate relevance score for a chunk with proper title prioritization
 */
function calculateChunkRelevanceScore(chunk: ContentChunk, query: string, searchTerms: string[] = [], entry?: ContentEntry): number {
  let score = 0;

  // First check if this is navigation content - heavily penalize it
  if (isNavigationContent(chunk.text)) {
    score -= 50; // Major penalty for navigation content
  }

  // Boost score for chunks that appear to be instructional content
  const instructionalPatterns = [
    /create.*property/i, /apply.*property/i, /component.*properties.*types/i,
    /boolean.*property/i, /text.*property/i, /variant.*property/i,
    /instance.*swap/i, /preferred.*values/i, /expose.*nested/i
  ];

  if (instructionalPatterns.some(pattern => pattern.test(chunk.text))) {
    score += 20; // Bonus for instructional content
  }

  // HEAVILY prioritize title matches - if the title matches search terms, this should rank very high
  if (entry) {
    const titleLower = entry.title.toLowerCase();

    // Exact title phrase matches get massive bonus
    if (titleLower.includes(query)) {
      score += 100;
    }

    // Special semantic matching for common patterns
    if (query.includes('property') && titleLower.includes('properties')) {
      score += 80; // Strong semantic match for property/properties
    }
    if (query.includes('figma') && titleLower.includes('component') &&
        (query.includes('property') || query.includes('properties'))) {
      score += 70; // "figma property" should match "component properties"
    }

    // Individual search term matches in title get big bonus
    for (const term of searchTerms) {
      if (titleLower.includes(term)) {
        // Give extra weight to important terms
        if (term.includes('chapter') || /^\d+$/.test(term)) {
          score += 50;
        } else if (term === 'component' || term === 'properties' || term === 'property') {
          score += 30; // High weight for key Figma terms
        } else if (term === 'figma') {
          score += 20; // Medium weight for figma
        } else {
          score += 10;
        }
      }

      // Semantic matching - property/properties variants
      if (term === 'property' && titleLower.includes('properties')) {
        score += 25; // Bridge singular/plural
      }
      if (term === 'properties' && titleLower.includes('property')) {
        score += 25; // Bridge plural/singular
      }
    }
  }

  // Count occurrences of original query in content
  const chunkLower = chunk.text.toLowerCase();
  const exactMatches = (chunkLower.match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  score += exactMatches * 5;

  // Count occurrences of individual terms in content
  for (const term of searchTerms) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termMatches = (chunkLower.match(new RegExp(escapedTerm, 'g')) || []).length;
    score += termMatches * 1;

    // Bonus for matches in section headings
    if (chunk.metadata?.section?.toLowerCase().includes(term)) {
      score += 2;
    }
  }

  // Bonus for matches in section headings
  if (chunk.metadata?.section?.toLowerCase().includes(query)) {
    score += 5;
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
