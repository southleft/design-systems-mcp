#!/usr/bin/env node

/**
 * Build script to generate a manifest of all content files
 * This allows the MCP server to dynamically discover and load content
 * without requiring hardcoded file imports
 */

import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'entries');
const MANIFEST_PATH = path.join(process.cwd(), 'content', 'manifest.json');

interface ContentManifest {
	files: string[];
	generated_at: string;
	total_files: number;
}

function generateContentManifest(): ContentManifest {
	console.log('🔄 Generating content manifest...');

	// Ensure content directory exists
	if (!fs.existsSync(CONTENT_DIR)) {
		console.error(`❌ Content directory not found: ${CONTENT_DIR}`);
		process.exit(1);
	}

	// Scan for all JSON files in the entries directory
	const files = fs.readdirSync(CONTENT_DIR)
		.filter(file => file.endsWith('.json'))
		.sort(); // Sort for consistent ordering

	const manifest: ContentManifest = {
		files,
		generated_at: new Date().toISOString(),
		total_files: files.length
	};

	// Write manifest file
	fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

	console.log(`✅ Generated manifest with ${files.length} files:`);
	files.forEach(file => console.log(`   📄 ${file}`));
	console.log(`📝 Manifest saved to: ${MANIFEST_PATH}`);

	return manifest;
}

// Run the script if called directly
if (require.main === module) {
	try {
		generateContentManifest();
	} catch (error) {
		console.error('❌ Failed to generate manifest:', error);
		process.exit(1);
	}
}
