/**
 * Core types for Design Systems MCP content
 */

export type SourceType = 'pdf' | 'html' | 'url';
export type Category = 'components' | 'tokens' | 'patterns' | 'workflows' | 'guidelines' | 'general';
export type Confidence = 'high' | 'medium' | 'low';

export interface ContentSource {
  type: SourceType;
  location: string;
  ingested_at: string;
}

export interface ChunkMetadata {
  section?: string;
  page?: number;
  heading?: string;
  [key: string]: any; // Allow for additional metadata
}

export interface ContentChunk {
  id: string;
  text: string;
  metadata?: ChunkMetadata;
}

export interface ContentMetadata {
  category: Category;
  tags: string[];
  confidence: Confidence;
  version?: string;
  last_updated: string;
  author?: string;
  system?: string; // e.g., "Material Design", "Carbon", etc.
  [key: string]: any; // Allow for additional metadata
}

export interface ContentEntry {
  id: string;
  title: string;
  source: ContentSource;
  content: string;
  chunks: ContentChunk[];
  metadata: ContentMetadata;
}

export interface SearchOptions {
  query?: string;
  category?: Category;
  tags?: string[];
  confidence?: Confidence;
  limit?: number;
}

export interface IngestionOptions {
  source: string;
  type: SourceType;
  metadata?: Partial<ContentMetadata>;
  chunkSize?: number;
  overlapSize?: number;
}
