/**
 * Text chunking utilities for breaking content into manageable pieces
 */

import { ContentChunk } from "../../types/content";

export interface ChunkOptions {
  chunkSize?: number;
  overlapSize?: number;
  preserveSentences?: boolean;
}

const DEFAULT_CHUNK_SIZE = 1000; // characters
const DEFAULT_OVERLAP_SIZE = 200; // characters

/**
 * Splits text into chunks with optional overlap
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {}
): ContentChunk[] {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    overlapSize = DEFAULT_OVERLAP_SIZE,
    preserveSentences = true,
  } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: ContentChunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // If we're preserving sentences, try to find a sentence boundary
    if (preserveSentences && endIndex < text.length) {
      const sentenceEndMarkers = ['. ', '! ', '? ', '\n\n'];
      let bestBoundary = endIndex;
      let foundBoundary = false;

      // Look for sentence boundaries near the chunk end
      for (const marker of sentenceEndMarkers) {
        const searchStart = Math.max(startIndex, endIndex - 100);
        const markerIndex = text.lastIndexOf(marker, endIndex);

        if (markerIndex >= searchStart && markerIndex < endIndex) {
          bestBoundary = markerIndex + marker.length;
          foundBoundary = true;
          break;
        }
      }

      // If no sentence boundary found, try to break at word boundary
      if (!foundBoundary && endIndex < text.length) {
        const wordBoundary = text.lastIndexOf(' ', endIndex);
        if (wordBoundary > startIndex) {
          bestBoundary = wordBoundary + 1;
        }
      }

      endIndex = bestBoundary;
    }

    const chunkText = text.slice(startIndex, endIndex).trim();

    if (chunkText.length > 0) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: chunkText,
        metadata: {
          startIndex,
          endIndex,
          chunkIndex,
        },
      });
      chunkIndex++;
    }

    // Move to next chunk with overlap
    startIndex = endIndex - overlapSize;

    // Ensure we don't go backwards
    if (startIndex <= chunks[chunks.length - 1]?.metadata?.startIndex) {
      startIndex = endIndex;
    }
  }

  return chunks;
}

/**
 * Splits text by sections (e.g., headings) and then chunks each section
 */
export function chunkBySection(
  text: string,
  options: ChunkOptions = {}
): ContentChunk[] {
  // Pattern to match common heading patterns
  const headingPattern = /^(#{1,6}\s+.+|[A-Z][A-Z\s]+:?\s*$|\d+\.\s+.+)/gm;

  const sections: Array<{ heading: string; content: string; startIndex: number }> = [];
  let lastIndex = 0;
  let lastHeading = "Introduction";

  // Find all headings and their positions
  const matches = Array.from(text.matchAll(headingPattern));

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const heading = match[0].trim();
    const startIndex = match.index!;

    // Add the content before this heading to the previous section
    if (startIndex > lastIndex) {
      const content = text.slice(lastIndex, startIndex).trim();
      if (content) {
        sections.push({
          heading: lastHeading,
          content,
          startIndex: lastIndex,
        });
      }
    }

    lastHeading = heading.replace(/^#+\s*/, '').replace(/:\s*$/, '');
    lastIndex = startIndex + match[0].length;
  }

  // Add the remaining content
  const remainingContent = text.slice(lastIndex).trim();
  if (remainingContent) {
    sections.push({
      heading: lastHeading,
      content: remainingContent,
      startIndex: lastIndex,
    });
  }

  // If no sections found, treat entire text as one section
  if (sections.length === 0) {
    sections.push({
      heading: "Content",
      content: text,
      startIndex: 0,
    });
  }

  // Chunk each section
  const allChunks: ContentChunk[] = [];
  let globalChunkIndex = 0;

  for (const section of sections) {
    const sectionChunks = chunkText(section.content, options);

    for (const chunk of sectionChunks) {
      allChunks.push({
        ...chunk,
        id: `chunk-${globalChunkIndex}`,
        metadata: {
          ...chunk.metadata,
          section: section.heading,
          globalChunkIndex,
        },
      });
      globalChunkIndex++;
    }
  }

  return allChunks;
}
