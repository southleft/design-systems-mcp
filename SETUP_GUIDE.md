# Design Systems MCP Setup Guide

This MCP (Model Context Protocol) server provides trusted design systems knowledge to LLMs, helping designers and developers receive accurate, high-confidence recommendations about components, tokens, patterns, workflows, and more.

## Project Overview

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Content Sources│────▶│ Ingestion Scripts│────▶│  JSON Entries   │
│  (PDF/HTML/URL) │     │   (Parse/Chunk)  │     │ (Structured KB) │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                                                           ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   MCP Server     │◀────│ Content Manager │
                        │ (Tools/Resources)│     │  (Search/Browse)│
                        └──────────────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   LLM Clients   │
                        │ (Claude, etc.)  │
                        └─────────────────┘
```

### Key Components

1. **Content Ingestion** (`scripts/ingestion/`)
   - `ingest.ts` - Main orchestrator for content ingestion
   - `html-parser.ts` - Extracts and structures HTML content
   - `pdf-parser.ts` - Placeholder for PDF extraction (requires pdf-parse)
   - `url-fetcher.ts` - Fetches and parses web content

2. **Content Management** (`src/lib/`)
   - `content-manager.ts` - Manages entries, search, and retrieval
   - `chunker.ts` - Splits content into searchable chunks
   - `id-generator.ts` - Generates unique IDs for entries

3. **MCP Server** (`src/index.ts`)
   - Exposes tools for searching and browsing design system knowledge
   - Provides resources for accessing entry data
   - Includes prompts for design consultations

## Installation

### 1. Install Dependencies

Due to the Cloudflare Worker environment, some dependencies may need special handling:

```bash
# Core dependencies (already in package.json)
npm install

# Additional dependencies for ingestion (Node.js environment)
npm install --save-dev pdf-parse cheerio node-fetch@2 @types/node

# If you encounter permission errors, try:
sudo npm install --global --force npm@latest
npm cache clean --force
```

### 2. Environment Setup

For local development:
```bash
npm run dev
```

For deployment:
```bash
npm run deploy
```

## Content Ingestion

### Ingesting Content from URLs

```bash
# Using the ingestion script (Node.js environment)
npx tsx scripts/ingestion/ingest.ts url https://material.io/design/components/buttons.html

# The content will be saved to content/entries/
```

### Ingesting HTML Files

```bash
# Single file
npx tsx scripts/ingestion/ingest.ts html ./docs/button-guidelines.html

# Batch ingestion
npx tsx scripts/ingestion/ingest.ts batch ./docs html
```

### Ingesting PDFs

```bash
# Note: Requires pdf-parse to be installed
npx tsx scripts/ingestion/ingest.ts pdf ./docs/design-system.pdf
```

### Manual Entry Creation

You can also create entries manually in `content/entries/` following this format:

```json
{
  "id": "unique-id-here",
  "title": "Button Component Best Practices",
  "source": {
    "type": "html",
    "location": "https://example.com/buttons",
    "ingested_at": "2024-01-20T10:00:00Z"
  },
  "content": "Full text content here...",
  "chunks": [
    {
      "id": "chunk-1",
      "text": "Buttons should be clearly distinguishable...",
      "metadata": {
        "section": "Visual Design"
      }
    }
  ],
  "metadata": {
    "category": "components",
    "tags": ["button", "interaction", "accessibility"],
    "confidence": "high",
    "system": "Material Design",
    "last_updated": "2024-01-20T10:00:00Z"
  }
}
```

## Using the MCP Server

### Available Tools

1. **search_design_knowledge**
   - Search across all design system entries
   - Filter by category, tags, and limit results
   ```
   Example: "Search for button accessibility guidelines"
   ```

2. **search_chunks**
   - Find specific information within entries
   - Returns relevant text chunks with context
   ```
   Example: "Find information about color token naming conventions"
   ```

3. **browse_by_category**
   - Browse entries by category (components, tokens, patterns, etc.)
   ```
   Example: "Show me all token-related entries"
   ```

4. **get_all_tags**
   - List all available tags in the knowledge base

### Available Resources

1. **design-system://entry/{id}**
   - Access a specific entry by ID

2. **design-system://entries**
   - List all available entries

### Available Prompts

1. **design_consultation**
   - Get design guidance on specific topics
   - Topics: implementation, accessibility, responsive, theming, best-practices

## Extending the System

### Adding New Categories

Edit `config/categories.json` to add new categories:

```json
{
  "categories": {
    "your-category": {
      "name": "Your Category",
      "description": "Description here",
      "keywords": ["keyword1", "keyword2"]
    }
  }
}
```

### Adding Custom Metadata

Extend the `ContentMetadata` interface in `types/content.ts`:

```typescript
export interface ContentMetadata {
  // ... existing fields ...
  customField?: string;
  version?: string;
  author?: string;
}
```

### Improving Search

The current search is keyword-based. For production, consider:
- Vector embeddings for semantic search
- Elasticsearch or similar for full-text search
- AI-powered relevance ranking

## Production Considerations

### Storage Options

1. **Cloudflare KV** - For small to medium knowledge bases
2. **Cloudflare D1** - For structured queries and relationships
3. **R2 Storage** - For large content files
4. **External API** - For dynamic content from design system sources

### Authentication

For production use, implement authentication:
```javascript
// In src/index.ts
if (!request.headers.get('Authorization')) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Content Validation

Add validation before ingestion:
- URL allowlisting
- Content size limits
- Format validation
- Malware scanning for uploads

### Monitoring

Implement logging and monitoring:
- Track tool usage
- Monitor search queries
- Log errors and performance metrics
- Set up alerts for failures

## Troubleshooting

### Common Issues

1. **npm install fails**
   - Clear npm cache: `npm cache clean --force`
   - Use sudo if needed: `sudo npm install`
   - Try yarn instead: `yarn install`

2. **PDF parsing not working**
   - Ensure pdf-parse is installed
   - Check Node.js version compatibility
   - Consider using a PDF API service for Workers

3. **Content not showing up**
   - Check file paths in ingestion scripts
   - Verify JSON format in entries
   - Ensure content manager is loading entries

### Debug Mode

Enable debug logging:
```javascript
// In content-manager.ts
console.log('Loaded entries:', entries.length);
console.log('Search query:', query);
```

## Next Steps

1. **Add Real Content**: Start ingesting actual design system documentation
2. **Customize Categories**: Adjust categories and tags for your needs
3. **Enhance Search**: Implement more sophisticated search algorithms
4. **Add Versioning**: Track changes to design system knowledge
5. **Build UI**: Create a web interface for content management
6. **Integrate with Tools**: Connect to FigmaLint, Story UI, etc.

## Support

For issues or questions:
- Check the logs: `wrangler tail`
- Review the MCP documentation
- Test with the MCP Inspector tool
- File issues in the project repository
