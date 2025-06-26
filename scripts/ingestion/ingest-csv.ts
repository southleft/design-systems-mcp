#!/usr/bin/env node

/**
 * CLI script for ingesting design system content from CSV files containing URLs
 */

import { processCSVURLs, createSampleCSV, CSVParseOptions } from './csv-url-parser';
import * as path from 'path';
import * as fs from 'fs';

interface CLIOptions extends CSVParseOptions {
  help?: boolean;
  sample?: boolean;
  dryRun?: boolean;
}

function showHelp() {
  console.log(`
🔗 CSV URL Ingestion Tool

Usage: npm run ingest:csv <csv-file> [options]

Arguments:
  csv-file              Path to CSV file containing URLs

Options:
  --help               Show this help message
  --sample             Create a sample CSV file and exit
  --dry-run            Parse CSV and validate URLs without fetching content
  --delimiter <char>   CSV delimiter (default: ',')
  --no-header          CSV file doesn't have a header row
  --chunk-size <num>   Chunk size for content processing (default: 1000)
  --overlap-size <num> Overlap size between chunks (default: 100)
  --timeout <ms>       Request timeout in milliseconds (default: 30000)
  --max-concurrent <n> Maximum concurrent requests (default: 3)
  --retry-attempts <n> Number of retry attempts (default: 2)
  --output-dir <dir>   Output directory for content files (default: content/entries)

CSV Format:
The CSV file should have the following columns (header row recommended):
  - url (required)     - The URL to fetch content from
  - title (optional)   - Custom title for the content
  - category           - Content category (general, components, tokens, patterns, guidelines, tools)
  - tags               - Comma-separated tags
  - description        - Description of the content
  - confidence         - Confidence level (low, medium, high)
  - system             - Design system name
  - author             - Author or organization
  - version            - Version information

Examples:
  npm run ingest:csv urls.csv
  npm run ingest:csv urls.csv --max-concurrent 5 --timeout 60000
  npm run ingest:csv --sample  # Creates sample.csv
  npm run ingest:csv urls.csv --dry-run  # Validate without fetching

Sample CSV content:
url,title,category,tags,description,confidence,system,author,version
https://material.io/components/buttons,Material Buttons,components,"button,material",Material Design buttons,high,Material Design,Google,3.0
`);
}

function parseArgs(): { csvFile?: string; options: CLIOptions } {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};
  let csvFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--sample') {
      options.sample = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--delimiter') {
      options.delimiter = args[++i];
    } else if (arg === '--no-header') {
      options.skipHeader = false;
    } else if (arg === '--chunk-size') {
      options.chunkSize = parseInt(args[++i]);
    } else if (arg === '--overlap-size') {
      options.overlapSize = parseInt(args[++i]);
    } else if (arg === '--timeout') {
      options.timeout = parseInt(args[++i]);
    } else if (arg === '--max-concurrent') {
      options.maxConcurrent = parseInt(args[++i]);
    } else if (arg === '--retry-attempts') {
      options.retryAttempts = parseInt(args[++i]);
    } else if (arg === '--output-dir') {
      options.outputDir = args[++i];
    } else if (!arg.startsWith('--')) {
      csvFile = arg;
    }
  }

  return { csvFile, options };
}

async function validateCSVFile(csvFile: string, options: CLIOptions): Promise<boolean> {
  const { parseCSV } = await import('./csv-url-parser');

  try {
    const csvContent = fs.readFileSync(csvFile, 'utf-8');
    const rows = parseCSV(csvContent, options);

    console.log(`📄 CSV file validation:`);
    console.log(`  - File: ${csvFile}`);
    console.log(`  - Rows found: ${rows.length}`);
    console.log(`  - Delimiter: '${options.delimiter || ','}'`);
    console.log(`  - Has header: ${options.skipHeader !== false}`);

    if (rows.length === 0) {
      console.error(`❌ No valid rows found in CSV file`);
      return false;
    }

    // Show sample of URLs
    console.log(`\n🔗 Sample URLs:`);
    rows.slice(0, 5).forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.url}`);
      if (row.title) console.log(`     Title: ${row.title}`);
      if (row.category) console.log(`     Category: ${row.category}`);
      if (row.tags) console.log(`     Tags: ${row.tags}`);
    });

    if (rows.length > 5) {
      console.log(`  ... and ${rows.length - 5} more`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error reading CSV file: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

async function main() {
  const { csvFile, options } = parseArgs();

  // Show help
  if (options.help) {
    showHelp();
    return;
  }

  // Create sample CSV
  if (options.sample) {
    const samplePath = 'sample-urls.csv';
    createSampleCSV(samplePath);
    console.log(`✅ Sample CSV created at: ${samplePath}`);
    console.log(`\nTo use it: npm run ingest:csv ${samplePath}`);
    return;
  }

  // Validate arguments
  if (!csvFile) {
    console.error('❌ Error: CSV file path is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  // Check if file exists
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ Error: CSV file not found: ${csvFile}`);
    process.exit(1);
  }

  console.log(`🚀 Starting CSV URL ingestion...`);
  console.log(`📄 CSV file: ${csvFile}`);

  try {
    // Validate CSV file first
    const isValid = await validateCSVFile(csvFile, options);
    if (!isValid) {
      process.exit(1);
    }

    // If dry run, stop here
    if (options.dryRun) {
      console.log(`\n✅ Dry run complete - CSV file is valid`);
      console.log(`To proceed with ingestion, run without --dry-run flag`);
      return;
    }

    // Process URLs
    console.log(`\n🔄 Starting content ingestion...`);
    const startTime = Date.now();

    const entries = await processCSVURLs(csvFile, options);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`\n🎉 Ingestion complete!`);
    console.log(`📊 Results:`);
    console.log(`  - Processed: ${entries.length} entries`);
    console.log(`  - Duration: ${duration} seconds`);
    console.log(`  - Output: ${options.outputDir || 'content/entries'}/`);

    if (entries.length > 0) {
      console.log(`\n📁 Generated files:`);
      entries.slice(0, 5).forEach(entry => {
        const filename = `${entry.id}-${entry.source.type}-${entry.title.replace(/[^a-z0-9]/gi, '-').substring(0, 30)}.json`;
        console.log(`  - ${filename}`);
      });
      if (entries.length > 5) {
        console.log(`  ... and ${entries.length - 5} more`);
      }

      // Automatically regenerate manifest
      console.log(`\n🔄 Regenerating content manifest...`);
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        await execAsync('npx tsx scripts/build/generate-manifest.ts');
        console.log(`✅ Manifest updated automatically`);
      } catch (error) {
        console.warn(`⚠️  Failed to regenerate manifest automatically:`, error);
        console.log(`Please run: npm run build:manifest`);
      }

      console.log(`\n🔄 Next steps:`);
      console.log(`1. Restart your development server: npm run dev`);
      console.log(`2. New content will be automatically discovered and loaded`);
      console.log(`3. Test the new content in your chat interface`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Unexpected error: ${error}`);
    process.exit(1);
  });
}

export { main };
