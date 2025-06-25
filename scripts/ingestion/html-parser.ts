/**
 * HTML content parser for extracting design system knowledge
 */

import { ContentEntry, ContentMetadata, SourceType } from "../../types/content";
import { chunkBySection } from "../../src/lib/chunker";
import { generateId } from "../../src/lib/id-generator";
// Note: cheerio will need to be installed: npm install cheerio

export interface HTMLParseOptions {
  metadata?: Partial<ContentMetadata>;
  chunkSize?: number;
  overlapSize?: number;
}

/**
 * Extracts text content from HTML, preserving structure
 */
export async function parseHTML(
  htmlContent: string,
  sourcePath: string,
  options: HTMLParseOptions = {}
): Promise<ContentEntry> {
  // For now, we'll use a simple regex-based approach
  // In production, use cheerio for better parsing

  // Remove script and style tags
  let cleanedHtml = htmlContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Extract title
  const titleMatch = cleanedHtml.match(/<title[^>]*>(.*?)<\/title>/i);
  const h1Match = cleanedHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = cleanText(titleMatch?.[1] || h1Match?.[1] || 'Untitled Document');

  // Convert HTML to structured text
  let textContent = cleanedHtml
    // Convert headings to markdown-style
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')
    // Convert paragraphs and divs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
    .replace(/<div[^>]*>(.*?)<\/div>/gi, '\n$1\n')
    // Convert lists
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    // Convert code blocks
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n')
    // Convert links (preserve URL info)
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 [$1]')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Clean up excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Clean the text
  textContent = cleanText(textContent);

  // Extract metadata hints from content
  const extractedMetadata = extractMetadataFromContent(textContent);

  // Create chunks
  const chunks = chunkBySection(textContent, {
    chunkSize: options.chunkSize,
    overlapSize: options.overlapSize,
  });

  // Build the entry
  const entry: ContentEntry = {
    id: generateId(),
    title,
    source: {
      type: 'html' as SourceType,
      location: sourcePath,
      ingested_at: new Date().toISOString(),
    },
    content: textContent,
    chunks,
    metadata: {
      category: 'general',
      tags: [],
      confidence: 'medium',
      last_updated: new Date().toISOString(),
      ...extractedMetadata,
      ...options.metadata,
    },
  };

  return entry;
}

/**
 * Cleans text by decoding HTML entities and normalizing whitespace
 */
function cleanText(text: string): string {
  return text
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attempts to extract metadata from the content itself
 */
function extractMetadataFromContent(content: string): Partial<ContentMetadata> {
  const metadata: Partial<ContentMetadata> = {};
  const contentLower = content.toLowerCase();

  // Try to detect category
  if (contentLower.includes('component') || contentLower.includes('button') ||
      contentLower.includes('form') || contentLower.includes('card')) {
    metadata.category = 'components';
  } else if (contentLower.includes('token') || contentLower.includes('color') ||
             contentLower.includes('spacing') || contentLower.includes('typography')) {
    metadata.category = 'tokens';
  } else if (contentLower.includes('pattern') || contentLower.includes('layout')) {
    metadata.category = 'patterns';
  } else if (contentLower.includes('workflow') || contentLower.includes('process')) {
    metadata.category = 'workflows';
  } else if (contentLower.includes('guideline') || contentLower.includes('principle')) {
    metadata.category = 'guidelines';
  }

  // Extract potential tags
  const tags: string[] = [];
  const tagPatterns = [
    /\b(button|input|form|card|modal|dropdown|nav|header|footer)\b/gi,
    /\b(color|spacing|typography|shadow|border|radius)\b/gi,
    /\b(responsive|mobile|desktop|tablet|accessibility|a11y)\b/gi,
  ];

  for (const pattern of tagPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      tags.push(...matches.map(m => m.toLowerCase()));
    }
  }

  metadata.tags = [...new Set(tags)].slice(0, 10); // Unique tags, max 10

  return metadata;
}
