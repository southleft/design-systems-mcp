# Design Systems MCP Project Structure

This project serves trusted design systems knowledge to LLMs via the Model Context Protocol (MCP).

## Directory Structure

```
design-systems-mcp/
├── content/                    # All content data
│   ├── entries/               # Processed JSON entries ready to serve
│   │   └── *.json            # Individual knowledge entries
│   └── raw/                   # Original source files (PDFs, HTML, etc.)
│       ├── pdfs/
│       ├── html/
│       └── urls/
│
├── scripts/                   # Utility scripts
│   └── ingestion/            # Content ingestion scripts
│       ├── ingest.ts         # Main ingestion orchestrator
│       ├── pdf-parser.ts     # PDF content extraction
│       ├── html-parser.ts    # HTML content extraction
│       └── url-fetcher.ts    # URL content fetching
│
├── src/                      # Main application source
│   ├── index.ts             # MCP server entry point
│   ├── lib/                 # Shared libraries
│   │   ├── content-manager.ts  # Content loading and management
│   │   ├── chunker.ts         # Text chunking utilities
│   │   └── metadata.ts        # Metadata handling
│   └── tools/               # MCP tool implementations
│       ├── search.ts        # Search design system knowledge
│       ├── browse.ts        # Browse by category/tag
│       └── audit.ts         # Audit recommendations
│
├── types/                    # TypeScript type definitions
│   └── content.ts           # Content-related types
│
├── config/                   # Configuration files
│   └── categories.json      # Design system categories
│
└── tests/                    # Test files
    ├── ingestion/
    └── tools/
```

## Content Entry Schema

Each processed entry in `content/entries/` follows this structure:

```json
{
  "id": "unique-identifier",
  "title": "Entry Title",
  "source": {
    "type": "pdf|html|url",
    "location": "path/to/source",
    "ingested_at": "2024-01-20T10:00:00Z"
  },
  "content": "Main content text",
  "chunks": [
    {
      "id": "chunk-1",
      "text": "Chunk text...",
      "metadata": {
        "section": "Optional section name",
        "page": 1
      }
    }
  ],
  "metadata": {
    "category": "components|tokens|patterns|workflows",
    "tags": ["button", "color", "spacing"],
    "confidence": "high|medium|low",
    "version": "1.0.0",
    "last_updated": "2024-01-20T10:00:00Z"
  }
}
```

## Key Features

1. **Modular Ingestion**: Separate parsers for different content types
2. **Structured Entries**: JSON-based knowledge entries with rich metadata
3. **Chunking Support**: Break large content into searchable chunks
4. **Extensible Metadata**: Support for categories, tags, versions, and custom fields
5. **MCP Integration**: Tools for searching, browsing, and auditing design system knowledge
