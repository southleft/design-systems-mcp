# Design Systems MCP Server

An AI-powered Model Context Protocol (MCP) server that provides intelligent access to design systems knowledge. This server ingests design system documentation (PDFs, web content) and enables AI assistants to provide expert guidance on design systems, components, tokens, and best practices.

## Features

- 🤖 **AI-Powered Chat Interface** - Natural language queries with OpenAI integration
- 📚 **Content Ingestion** - Supports PDF parsing and web content extraction
- 🔍 **Intelligent Search** - Semantic search across design systems documentation
- 🎨 **Rich Formatting** - Markdown rendering with syntax highlighting
- 🚀 **Cloudflare Workers** - Scalable serverless deployment
- 🧪 **Local Testing** - Full local development environment

## Quick Start

### Prerequisites

- Node.js (v20.17.0+ or v22.9.0+)
- OpenAI API key

### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd design-systems-mcp
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp env.example .dev.vars
   # Edit .dev.vars and add your OpenAI API key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   Server will be available at: `http://localhost:8787`

4. **Test the AI Chat Interface**
   - Open `http://localhost:8787` in your browser
   - Try example queries like:
     - "What are design tokens?"
     - "How do I implement a design system?"
     - "What does the handbook say about Marvel and MailChimp?"

### Adding Content

1. **Ingest Content** (if not already done)
   ```bash
   # Add PDFs to local-content-library/
   npm run ingest:pdf path/to/your-design-guide.pdf

   # Or ingest web content
   npm run ingest:url https://example.com/design-system
   ```

2. **Update Content Loading** in `src/index.ts`
   ```typescript
   // Add new content files
   const newContent = require('../content/entries/your-new-content.json');
   const actualEntries = [handbookContent, buttonContent, newContent];
   ```

3. **Test Locally**
   ```bash
   npm run dev
   # Test your new content in the chat interface
   ```

## Available Tools

The MCP server provides these tools for AI assistants:

- `search_design_knowledge` - Search design systems content
- `search_chunks` - Find specific information in content chunks
- `browse_by_category` - Browse content by category (components, tokens, etc.)
- `get_all_tags` - Get available content tags

## Local Testing Workflow

### Testing New Content
1. Add content files to `content/entries/`
2. Update `src/index.ts` to load new content
3. Restart dev server: `npm run dev`
4. Test queries in chat interface at `http://localhost:8787`
5. Verify AI responses are accurate and complete

### Testing MCP Tools Directly
```bash
# Test MCP search directly
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_chunks","arguments":{"query":"design tokens"}}}'

# Test AI integration
curl -X POST http://localhost:8787/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are design tokens?"}'
```

## Deployment

### Deploy to Cloudflare Workers

1. **Set Environment Variables**
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   ```

2. **Deploy**
   ```bash
   npx wrangler deploy
   ```

3. **Access Your Deployed Server**
   - Your server will be available at: `design-systems-mcp.<your-account>.workers.dev`
   - Chat interface: `https://design-systems-mcp.<your-account>.workers.dev`
   - MCP endpoint: `https://design-systems-mcp.<your-account>.workers.dev/sse`

### Environment Variables

Required environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - Model to use (default: "gpt-4o-mini")
- `AI_SYSTEM_PROMPT` - Custom system prompt (optional)

## Connect to MCP Clients

### Claude Desktop

Add to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "design-systems": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

For production, replace with your deployed URL:
```json
{
  "mcpServers": {
    "design-systems": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://design-systems-mcp.<your-account>.workers.dev/sse"
      ]
    }
  }
}
```

### Cloudflare AI Playground

1. Go to https://playground.ai.cloudflare.com/
2. Enter your MCP server URL: `design-systems-mcp.<your-account>.workers.dev/sse`
3. Start using design systems tools in the playground!

## Project Structure

```
design-systems-mcp/
├── src/
│   ├── index.ts              # Main server with AI integration
│   ├── lib/
│   │   └── content-manager.ts # Content management and search
│   └── tools/                # MCP tool definitions
├── content/
│   ├── entries/              # Ingested content (JSON)
│   └── raw/                  # Raw source files
├── scripts/
│   └── ingestion/            # Content ingestion scripts
├── types/
│   └── content.ts           # TypeScript definitions
├── local-content-library/   # Source PDFs and files
├── wrangler.jsonc          # Cloudflare Workers config
└── .dev.vars              # Local environment variables
```

## Content Management

### Supported Content Types

- **PDFs** - Design system handbooks, guidelines
- **Web Content** - Design system documentation sites
- **JSON** - Pre-processed design system data

### Content Processing

Content is automatically:
- Chunked for optimal search performance
- Tagged and categorized
- Indexed for semantic search
- Made available to AI for intelligent responses

## Development

### Available Scripts

- `npm run dev` - Start local development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run ingest:pdf <file>` - Ingest PDF content
- `npm run ingest:url <url>` - Ingest web content

### Adding New MCP Tools

1. Define tools in `src/index.ts`:
   ```typescript
   server.tool("your_tool_name", schema, async (params) => {
     // Tool implementation
   });
   ```

2. Add to OpenAI function definitions:
   ```typescript
   const MCP_TOOLS = [
     // ... existing tools
     {
       type: "function",
       function: {
         name: "your_tool_name",
         description: "Tool description",
         parameters: { /* JSON schema */ }
       }
     }
   ];
   ```

## Troubleshooting

### Common Issues

**Content not loading:**
- Check that JSON files exist in `content/entries/`
- Verify `require()` paths in `src/index.ts`
- Check server logs for loading errors

**Port issues:**
- Ensure `wrangler.jsonc` has correct dev port (8787)
- Kill existing processes: `pkill -f "wrangler dev"`

**Environment variables:**
- Local: Use `.dev.vars` file
- Production: Set via `npx wrangler secret put`

### Logs and Debugging

```bash
# View server logs
npx wrangler tail

# Local development logs
npm run dev
# Check console output for content loading status
```

---

## Legacy Cloudflare Template Information

This project was built from the Cloudflare remote MCP server template. For additional Cloudflare Workers information:

### Original Template Deploy
[![Deploy to Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)

### Command Line Template
```bash
npm create cloudflare@latest -- my-mcp-server --template=cloudflare/ai/demos/remote-mcp-authless
```
