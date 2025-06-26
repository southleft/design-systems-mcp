/**
 * Dynamic content loader for MCP server
 * Automatically discovers and loads all JSON files from content/entries/
 */

import { ContentEntry } from '../../types/content';

/**
 * Dynamically load all content entries from the entries directory
 * Uses a manifest file to discover all available content files
 */
export async function loadAllContentEntries(): Promise<ContentEntry[]> {
	const entries: ContentEntry[] = [];

	try {
		// Try to load the manifest file (generated during build)
		const manifestModule = await import('../../content/manifest.json');
		const manifest = manifestModule.default as { files: string[], total_files: number };

		console.log(`📄 Found manifest with ${manifest.total_files} files`);

		// Load each file dynamically using imports
		const loadPromises = manifest.files.map(async (filename) => {
			try {
				// Import the JSON file directly - this works in Cloudflare Workers
				const contentModule = await import(`../../content/entries/${filename}`);
				const content = contentModule.default as ContentEntry;
				console.log(`✅ Loaded: ${content.title}`);
				return content;
			} catch (error) {
				console.warn(`⚠️  Failed to load content file: ${filename}`, error);
				return null;
			}
		});

		const results = await Promise.all(loadPromises);
		entries.push(...results.filter((entry): entry is ContentEntry => entry !== null));

		console.log(`🎉 Successfully loaded ${entries.length} content entries`);

	} catch (error) {
		console.error('❌ Error loading manifest, using fallback:', error);
		// Fallback to hardcoded entries if manifest loading fails
		await loadFallbackEntries(entries);
	}

	return entries;
}

/**
 * Fallback method to load known content files
 * This is used when dynamic discovery fails
 */
async function loadFallbackEntries(entries: ContentEntry[]): Promise<void> {
	const knownFiles = [
		'8zWJWrDK_bTOv3_KFo30V-pdf-designsystemshandbook-pdf.json',
		'sample-button-guidelines.json',
		'oRdJezsZL3IrFVL8--U4d-url-github-primer-button.json'
	];

	for (const filename of knownFiles) {
		try {
			const response = await fetch(`/content/entries/${filename}`);
			if (response.ok) {
				const content = await response.json() as ContentEntry;
				entries.push(content);
				console.log(`✅ Loaded: ${content.title}`);
			}
		} catch (error) {
			console.warn(`⚠️  Could not load ${filename}:`, error);
		}
	}
}

/**
 * Generate a manifest file listing all JSON files in the entries directory
 * This should be called during build or when new content is added
 */
export function generateManifest(): { files: string[] } {
	// This would typically scan the filesystem in a Node.js environment
	// For Cloudflare Workers, we'll need to maintain this manually or
	// generate it during the build process

	// For now, return a static list that can be updated
	const files = [
		'8zWJWrDK_bTOv3_KFo30V-pdf-designsystemshandbook-pdf.json',
		'sample-button-guidelines.json',
		'oRdJezsZL3IrFVL8--U4d-url-github-primer-button.json'
	];

	return { files };
}
