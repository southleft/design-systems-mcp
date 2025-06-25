/**
 * PDF content parser for extracting design system knowledge
 * Uses pdf-parse library to extract text from PDFs
 */

import pdfParse from 'pdf-parse';
import { ContentEntry, ContentMetadata, SourceType } from "../../types/content";
import { chunkBySection } from "../../src/lib/chunker";
import { generateId } from "../../src/lib/id-generator";

export interface PDFParseOptions {
  metadata?: Partial<ContentMetadata>;
  chunkSize?: number;
  overlapSize?: number;
}

/**
 * Parses PDF content using pdf-parse library
 */
export async function parsePDF(
  pdfBuffer: ArrayBuffer,
  sourcePath: string,
  options: PDFParseOptions = {}
): Promise<ContentEntry> {
  try {
    // Convert ArrayBuffer to Buffer for pdf-parse
    const buffer = Buffer.from(pdfBuffer);
    
    // Parse PDF content
    const data = await pdfParse(buffer);
    const textContent = data.text;

    console.log(`Successfully extracted ${textContent.length} characters from PDF`);

    if (!textContent.trim()) {
      console.warn('PDF appears to be empty or contains no extractable text');
    }

    // Create chunks
    const chunks = chunkBySection(textContent, {
      chunkSize: options.chunkSize,
      overlapSize: options.overlapSize,
    });

    // Build the entry
    const entry: ContentEntry = {
      id: generateId(),
      title: `PDF: ${sourcePath.split('/').pop() || sourcePath}`,
      source: {
        type: 'pdf' as SourceType,
        location: sourcePath,
        ingested_at: new Date().toISOString(),
      },
      content: textContent,
      chunks,
      metadata: {
        category: 'general',
        tags: [],
        confidence: 'high', // High confidence for actual parsed content
        last_updated: new Date().toISOString(),
        ...options.metadata,
      },
    };

    return entry;
  } catch (error) {
    console.error(`Error parsing PDF ${sourcePath}:`, error);
    
    // Fallback to placeholder content if parsing fails
    const placeholderContent = `PDF content from ${sourcePath} could not be extracted. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    const chunks = chunkBySection(placeholderContent, {
      chunkSize: options.chunkSize,
      overlapSize: options.overlapSize,
    });

    const entry: ContentEntry = {
      id: generateId(),
      title: `PDF: ${sourcePath.split('/').pop() || sourcePath} (Parse Error)`,
      source: {
        type: 'pdf' as SourceType,
        location: sourcePath,
        ingested_at: new Date().toISOString(),
      },
      content: placeholderContent,
      chunks,
      metadata: {
        category: 'general',
        tags: ['parse-error'],
        confidence: 'low',
        last_updated: new Date().toISOString(),
        ...options.metadata,
      },
    };

    return entry;
  }
}

/**
 * Reads a PDF file from the file system
 * In a Worker environment, this would need to be adapted
 */
export async function readPDFFile(filePath: string): Promise<ArrayBuffer> {
  // In a Node.js environment:
  // const fs = require('fs').promises;
  // const buffer = await fs.readFile(filePath);
  // return buffer.buffer;

  // In a Worker environment, files would be uploaded or fetched
  throw new Error('PDF file reading not implemented for Worker environment');
}
