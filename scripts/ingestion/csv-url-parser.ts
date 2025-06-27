/**
 * CSV URL parser for bulk ingestion of design system content from multiple URLs
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContentEntry, ContentMetadata, Category } from "../../types/content";
import { fetchURL, URLFetchOptions } from "./url-fetcher";
import { generateId } from "../../src/lib/id-generator";

export interface CSVURLRow {
  url: string;
  title?: string;
  category?: Category;
  tags?: string;
  description?: string;
  confidence?: 'low' | 'medium' | 'high';
  system?: string;
  author?: string;
  version?: string;
}

export interface CSVParseOptions {
  delimiter?: string;
  skipHeader?: boolean;
  chunkSize?: number;
  overlapSize?: number;
  timeout?: number;
  maxConcurrent?: number;
  retryAttempts?: number;
  outputDir?: string;
}

/**
 * Parses a CSV file and extracts URL information
 */
export function parseCSV(csvContent: string, options: CSVParseOptions = {}): CSVURLRow[] {
  const { delimiter = ',', skipHeader = true } = options;

  const lines = csvContent.trim().split('\n');
  const rows: CSVURLRow[] = [];

  // Skip header if requested
  const startIndex = skipHeader ? 1 : 0;

  // Get headers for mapping (assuming first row contains headers)
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line, delimiter);
    const row: CSVURLRow = { url: '' };

    // Map values to row object based on headers
    for (let j = 0; j < values.length && j < headers.length; j++) {
      const header = headers[j];
      const value = values[j].trim();

      switch (header) {
        case 'url':
        case 'link':
        case 'website':
          row.url = value;
          break;
        case 'title':
        case 'name':
          row.title = value;
          break;
        case 'category':
          if (isValidCategory(value)) {
            row.category = value as Category;
          }
          break;
        case 'tags':
          row.tags = value;
          break;
        case 'description':
        case 'desc':
          row.description = value;
          break;
        case 'confidence':
          if (['low', 'medium', 'high'].includes(value)) {
            row.confidence = value as 'low' | 'medium' | 'high';
          }
          break;
        case 'system':
          row.system = value;
          break;
        case 'author':
          row.author = value;
          break;
        case 'version':
          row.version = value;
          break;
      }
    }

    // Validate that URL is present
    if (row.url) {
      rows.push(row);
    } else {
      console.warn(`Row ${i + 1}: Missing URL, skipping`);
    }
  }

  return rows;
}

/**
 * Processes URLs from CSV and creates content entries
 */
export async function processCSVURLs(
  csvFilePath: string,
  options: CSVParseOptions = {}
): Promise<ContentEntry[]> {
  const {
    maxConcurrent = 3,
    retryAttempts = 2,
    outputDir = 'content/entries',
    chunkSize = 1000,
    overlapSize = 100,
    timeout = 30000
  } = options;

  console.log(`📄 Reading CSV file: ${csvFilePath}`);

  // Read and parse CSV file
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const urlRows = parseCSV(csvContent, options);

  console.log(`🔗 Found ${urlRows.length} URLs to process`);

  const entries: ContentEntry[] = [];
  const failed: Array<{ url: string; error: string }> = [];

  // Process URLs in batches to avoid overwhelming servers
  for (let i = 0; i < urlRows.length; i += maxConcurrent) {
    const batch = urlRows.slice(i, i + maxConcurrent);
    console.log(`\n📦 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(urlRows.length / maxConcurrent)}`);

    const batchPromises = batch.map(async (row) => {
      return processURLWithRetry(row, {
        chunkSize,
        overlapSize,
        timeout,
        metadata: buildMetadataFromRow(row)
      }, retryAttempts);
    });

    const batchResults = await Promise.allSettled(batchPromises);

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      const row = batch[j];

      if (result.status === 'fulfilled' && result.value) {
        entries.push(result.value);
        console.log(`✅ ${row.url}`);

        // Save individual entry
        if (outputDir) {
          await saveEntry(result.value, outputDir);
        }
      } else {
        const error = result.status === 'rejected' ? result.reason.message : 'Unknown error';
        failed.push({ url: row.url, error });
        console.log(`❌ ${row.url}: ${error}`);
      }
    }

    // Small delay between batches to be respectful
    if (i + maxConcurrent < urlRows.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Report results
  console.log(`\n📊 Processing complete:`);
  console.log(`✅ Successfully processed: ${entries.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log(`\n❌ Failed URLs:`);
    failed.forEach(({ url, error }) => {
      console.log(`  - ${url}: ${error}`);
    });
  }

  return entries;
}

/**
 * Process a single URL with retry logic
 */
async function processURLWithRetry(
  row: CSVURLRow,
  options: URLFetchOptions,
  maxRetries: number
): Promise<ContentEntry | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry ${attempt}/${maxRetries}: ${row.url}`);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }

      const entry = await fetchURL(row.url, options);

      // Override title if provided in CSV
      if (row.title) {
        entry.title = row.title;
      }

      return entry;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Build metadata object from CSV row
 */
function buildMetadataFromRow(row: CSVURLRow): Partial<ContentMetadata> {
  const metadata: Partial<ContentMetadata> = {};

  if (row.category) metadata.category = row.category;
  if (row.tags) metadata.tags = row.tags.split(',').map(tag => tag.trim());
  if (row.confidence) metadata.confidence = row.confidence;
  if (row.system) metadata.system = row.system;
  if (row.author) metadata.author = row.author;
  if (row.version) metadata.version = row.version;

  return metadata;
}

/**
 * Save a content entry to disk
 */
async function saveEntry(entry: ContentEntry, outputDir: string): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename
  const filename = `${entry.id}-${entry.source.type}-${sanitizeFilename(entry.title)}.json`;
  const filepath = path.join(outputDir, filename);

  // Write file
  fs.writeFileSync(filepath, JSON.stringify(entry, null, 2));
}

/**
 * Parse a CSV line handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      // Don't add the quote character to the current value
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Validate category value
 */
function isValidCategory(value: string): boolean {
  const validCategories = ['general', 'components', 'tokens', 'patterns', 'guidelines', 'tools'];
  return validCategories.includes(value.toLowerCase());
}

/**
 * Sanitize filename for file system
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 50);
}

/**
 * Create a sample CSV template
 */
export function createSampleCSV(outputPath: string): void {
  const sampleCSV = `url,title,category,tags,description,confidence,system,author,version
https://material.io/design/components/buttons.html,Material Design Buttons,components,"button,interaction,material",Material Design button component guidelines,high,Material Design,Google,3.0
https://polaris.shopify.com/components/button,Shopify Polaris Button,components,"button,shopify,polaris",Shopify's design system button component,high,Polaris,Shopify,
https://primer.style/components/button,GitHub Primer Button,components,"button,github,primer",GitHub's design system button guidelines,high,Primer,GitHub,
https://chakra-ui.com/docs/components/button,Chakra UI Button,components,"button,chakra,react",Chakra UI button component documentation,medium,Chakra UI,Segun Adebayo,
https://ant.design/components/button/,Ant Design Button,components,"button,ant,design",Ant Design button component specification,high,Ant Design,Ant Group,4.0`;

  fs.writeFileSync(outputPath, sampleCSV);
  console.log(`📄 Sample CSV created at: ${outputPath}`);
}
