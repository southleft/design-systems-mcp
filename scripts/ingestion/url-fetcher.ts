/**
 * URL content fetcher for extracting design system knowledge from web pages
 */

import { ContentEntry, ContentMetadata } from "../../types/content";
import { parseHTML } from "./html-parser";

export interface URLFetchOptions {
  metadata?: Partial<ContentMetadata>;
  chunkSize?: number;
  overlapSize?: number;
  timeout?: number;
}

/**
 * Fetches and parses content from a URL
 */
export async function fetchURL(
  url: string,
  options: URLFetchOptions = {}
): Promise<ContentEntry> {
  const { timeout = 30000 } = options;

  try {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Fetch the URL
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DesignSystemsMCP/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || '';

    // Check if it's HTML/text content
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    // Get the HTML content
    const htmlContent = await response.text();

    // Parse the HTML content
    const entry = await parseHTML(htmlContent, url, {
      ...options,
      metadata: {
        ...options.metadata,
        source_url: url,
      },
    });

    // Update the source type to 'url'
    entry.source.type = 'url';

    return entry;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Fetch timeout after ${timeout}ms`);
      }
      throw error;
    }
    throw new Error('Unknown error fetching URL');
  }
}

/**
 * Validates if a URL is accessible and returns HTML content
 */
export async function validateURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DesignSystemsMCP/1.0)',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    return response.ok && (
      contentType.includes('text/html') ||
      contentType.includes('text/plain')
    );
  } catch {
    return false;
  }
}
