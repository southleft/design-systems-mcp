#!/usr/bin/env node

/**
 * Script to check for duplicate URLs in content entries
 */

import * as fs from 'fs';
import * as path from 'path';
import { ContentEntry } from '../types/content';

interface DuplicateInfo {
  url: string;
  files: string[];
  titles: string[];
  count: number;
}

async function checkDuplicates(contentDir: string = 'content/entries'): Promise<void> {
  console.log('🔍 Checking for duplicate URLs in content entries...\n');

  const urlMap = new Map<string, { files: string[], titles: string[] }>();
  const files = fs.readdirSync(contentDir).filter(file => file.endsWith('.json'));

  console.log(`📄 Scanning ${files.length} content files...`);

  // Read all content files and extract URLs
  for (const file of files) {
    const filePath = path.join(contentDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entry: ContentEntry = JSON.parse(content);

      if (entry.source && entry.source.location) {
        const url = entry.source.location.toLowerCase().trim();

        if (!urlMap.has(url)) {
          urlMap.set(url, { files: [], titles: [] });
        }

        urlMap.get(url)!.files.push(file);
        urlMap.get(url)!.titles.push(entry.title);
      }
    } catch (error) {
      console.warn(`⚠️  Could not parse ${file}: ${error}`);
    }
  }

  // Find duplicates
  const duplicates: DuplicateInfo[] = [];
  for (const [url, info] of urlMap) {
    if (info.files.length > 1) {
      duplicates.push({
        url,
        files: info.files,
        titles: info.titles,
        count: info.files.length
      });
    }
  }

  // Report results
  console.log(`\n📊 Analysis Results:`);
  console.log(`  - Total entries scanned: ${files.length}`);
  console.log(`  - Unique URLs found: ${urlMap.size}`);
  console.log(`  - Duplicate URLs found: ${duplicates.length}\n`);

  if (duplicates.length === 0) {
    console.log('✅ No duplicate URLs found! Your content is unique.');
    return;
  }

  // Show duplicates
  console.log('❌ Duplicate URLs found:');
  console.log('=' .repeat(80));

  duplicates.sort((a, b) => b.count - a.count); // Sort by count descending

  for (let i = 0; i < duplicates.length; i++) {
    const dup = duplicates[i];
    console.log(`\n${i + 1}. ${dup.url}`);
    console.log(`   Appears ${dup.count} times:`);

    for (let j = 0; j < dup.files.length; j++) {
      console.log(`   📄 ${dup.files[j]}`);
      console.log(`      Title: "${dup.titles[j]}"`);
    }
  }

  console.log('\n🔧 Recommendations:');
  console.log('1. Review the duplicate entries above');
  console.log('2. Keep the most recent or complete version');
  console.log('3. Delete the duplicate files manually');
  console.log('4. Run `npm run build:manifest` to update the manifest');
  console.log('5. Restart your dev server to reload content');

  // Optional: Show commands to remove duplicates
  console.log('\n🗑️  To remove duplicate files:');
  for (const dup of duplicates) {
    // Suggest removing all but the first file
    for (let i = 1; i < dup.files.length; i++) {
      console.log(`   rm "content/entries/${dup.files[i]}"`);
    }
  }
}

// Parse command line arguments
function parseArgs(): { contentDir?: string; help?: boolean } {
  const args = process.argv.slice(2);
  const options: { contentDir?: string; help?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--content-dir') {
      options.contentDir = args[++i];
    } else if (!arg.startsWith('--')) {
      options.contentDir = arg;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🔍 Content Duplicate Checker

Usage: tsx scripts/check-duplicates.ts [options] [content-dir]

Arguments:
  content-dir          Path to content directory (default: content/entries)

Options:
  --help, -h          Show this help message
  --content-dir DIR   Specify content directory path

Examples:
  tsx scripts/check-duplicates.ts
  tsx scripts/check-duplicates.ts content/entries
  tsx scripts/check-duplicates.ts --content-dir content/entries
`);
}

async function main() {
  const { contentDir, help } = parseArgs();

  if (help) {
    showHelp();
    return;
  }

  try {
    await checkDuplicates(contentDir);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Unexpected error: ${error}`);
    process.exit(1);
  });
}

export { checkDuplicates, main };
