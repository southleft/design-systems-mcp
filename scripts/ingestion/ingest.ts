/**
 * Main content ingestion orchestrator
 * Handles ingesting content from various sources and saving as JSON entries
 */

import { ContentEntry, IngestionOptions, ContentMetadata } from "../../types/content";
import { parseHTML } from "./html-parser";
import { parsePDF } from "./pdf-parser";
import { fetchURL } from "./url-fetcher";
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Base directory for content
const CONTENT_DIR = path.join(process.cwd(), 'content');
const ENTRIES_DIR = path.join(CONTENT_DIR, 'entries');
const RAW_DIR = path.join(CONTENT_DIR, 'raw');

/**
 * Main ingestion function
 */
export async function ingestContent(
  options: IngestionOptions
): Promise<ContentEntry> {
  const { source, type, metadata, chunkSize, overlapSize } = options;

  let entry: ContentEntry;

  switch (type) {
    case 'url':
      entry = await fetchURL(source, {
        metadata,
        chunkSize,
        overlapSize,
      });
      break;

    case 'html':
      const htmlContent = await fs.readFile(source, 'utf-8');
      entry = await parseHTML(htmlContent, source, {
        metadata,
        chunkSize,
        overlapSize,
      });
      break;

    case 'pdf':
      const pdfBuffer = await fs.readFile(source);
      entry = await parsePDF(pdfBuffer.buffer.slice(0), source, {
        metadata,
        chunkSize,
        overlapSize,
      });
      break;

    default:
      throw new Error(`Unsupported source type: ${type}`);
  }

  // Save the entry
  await saveEntry(entry);

  return entry;
}

/**
 * Saves an entry to the entries directory
 */
async function saveEntry(entry: ContentEntry): Promise<void> {
  // Ensure directories exist
  await ensureDirectories();

  // Generate filename based on ID and title
  const safeTitle = entry.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 50);
  const filename = `${entry.id}-${safeTitle}.json`;
  const filepath = path.join(ENTRIES_DIR, filename);

  // Save the entry
  await fs.writeFile(
    filepath,
    JSON.stringify(entry, null, 2),
    'utf-8'
  );

  console.log(`Saved entry: ${filename}`);
}

/**
 * Ensures required directories exist
 */
async function ensureDirectories(): Promise<void> {
  await fs.mkdir(ENTRIES_DIR, { recursive: true });
  await fs.mkdir(path.join(RAW_DIR, 'pdfs'), { recursive: true });
  await fs.mkdir(path.join(RAW_DIR, 'html'), { recursive: true });
  await fs.mkdir(path.join(RAW_DIR, 'urls'), { recursive: true });
}

/**
 * Lists all entries in the entries directory
 */
export async function listEntries(): Promise<string[]> {
  try {
    const files = await fs.readdir(ENTRIES_DIR);
    return files.filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
}

/**
 * Loads an entry by filename
 */
export async function loadEntry(filename: string): Promise<ContentEntry> {
  const filepath = path.join(ENTRIES_DIR, filename);
  const content = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(content) as ContentEntry;
}

/**
 * Batch ingestion from a directory
 */
export async function batchIngest(
  directory: string,
  type: 'html' | 'pdf',
  defaultMetadata?: Partial<ContentMetadata>
): Promise<ContentEntry[]> {
  const files = await fs.readdir(directory);
  const entries: ContentEntry[] = [];

  for (const file of files) {
    const filepath = path.join(directory, file);
    const stat = await fs.stat(filepath);

    if (!stat.isFile()) continue;

    // Check file extension
    if (type === 'html' && !file.match(/\.(html?|htm)$/i)) continue;
    if (type === 'pdf' && !file.match(/\.pdf$/i)) continue;

    try {
      console.log(`Ingesting ${file}...`);
      const entry = await ingestContent({
        source: filepath,
        type,
        metadata: defaultMetadata,
      });
      entries.push(entry);
    } catch (error) {
      console.error(`Error ingesting ${file}:`, error);
    }
  }

  return entries;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage:
  node ingest.js <type> <source> [options]

Types:
  url     - Fetch and ingest from URL
  html    - Ingest from HTML file
  pdf     - Ingest from PDF file
  batch   - Batch ingest from directory

Examples:
  node ingest.js url https://material.io/design
  node ingest.js html ./docs/components.html
  node ingest.js pdf ./docs/design-system.pdf
  node ingest.js batch ./docs html
    `);
    process.exit(1);
  }

  const [type, source] = args;

  (async () => {
    try {
      if (type === 'batch') {
        const batchType = args[2] as 'html' | 'pdf';
        const entries = await batchIngest(source, batchType);
        console.log(`Ingested ${entries.length} entries`);
      } else {
        const entry = await ingestContent({
          source,
          type: type as any,
        });
        console.log(`Successfully ingested: ${entry.title}`);
      }
    } catch (error) {
      console.error('Ingestion failed:', error);
      process.exit(1);
    }
  })();
}
