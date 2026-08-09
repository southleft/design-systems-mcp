# Design Systems MCP Server

An AI-powered Model Context Protocol (MCP) server providing intelligent access to authoritative design systems knowledge. 395 curated entries spanning W3C standards, WCAG guidelines, design system practice, and — the part a general-purpose model cannot help you with — the 2025-2026 agent-interface protocols.

🌐 **Live Demo:** [https://design-systems-mcp.southleft.com/](https://design-systems-mcp.southleft.com/)

## Why this exists

A frontier model already knows Atomic Design, BEM, and the WCAG success criteria. It does not reliably know that MCP Apps moved from `_meta["openai/outputTemplate"]` to `_meta.ui.resourceUri`, or that A2UI reached v1.0 candidate in June 2026. On fast-moving specs, **every model's training is stale in a way it cannot detect** — it answers confidently with last year's field names.

That is what this server is for: dated, cited, extracted primary-source content that beats both a smaller model's guess and a frontier model's expensive live re-research.

## Features

### Core Capabilities
- 🎯 **Vector + Keyword Search** - Supabase pgvector with pluggable embeddings (Cloudflare Workers AI `bge-m3`, edge-native and free within the Workers plan; OpenAI optional), plus a Postgres full-text path that keeps working when embeddings are unavailable
- 📚 **395 Curated Entries** - W3C standards, WCAG 2.2, ARIA practices, major design systems, and agent-interface protocols
- 🚦 **Relevance Floor** - IDF-weighted scoring means an uncovered topic returns *nothing* rather than confident, adjacent content
- 🚀 **Edge-Optimized** - Cloudflare Workers deployment with global distribution

### Latest Updates
- 🤖 **Agent-Interface Coverage (Aug 2026)** - A2UI v1.0, MCP Apps SEP-1865, AG-UI, Sentient Design, generative/ephemeral UI, component contracts
- 🧪 **Eval Harness** - `scripts/eval-mcp.ts` scores retrieval *and* substance across four difficulty tiers
- 🛡️ **Source Reliability Badges** - Every answer flags Primary / Authoritative / Reference / Example / Community sources
- 📖 **Universal MCP Client Support** - Works with any MCP-capable client (Claude Desktop, Cursor, Windsurf, Codex, etc.)
- 🏛️ **Major Design Systems, Deeply** - Carbon, Polaris, Atlassian, Material 3, Fluent, Spectrum, Nord, Mantine, shadcn/ui, Radix, Untitled UI — the guidance and token architecture, not just prop tables

### Developer Experience
- 🌐 **Zero Setup Required** - Public MCP endpoint ready to use
- 🤖 **AI Chat Interface** - Natural-language Q&A grounded in the knowledge base, streamed via Cloudflare Workers AI (Llama 3.3 70B) — no OpenAI, no API credits
- 🧪 **Local Development** - Complete testing environment with hot reload
- 📝 **Comprehensive Docs** - Updated setup guides for every major MCP client

## Content Library

### 395 Curated Entries Including:

**Agent Interfaces & AI (2025-2026 — the material a general model gets wrong)**
- A2UI Protocol v1.0 (Google) — adjacency-list components, catalog negotiation, A2A binding
- MCP Apps / SEP-1865 — `ui://` resources, CSP metadata, the `ui/` method namespace, host theming variables
- AG-UI event reference; OpenAI Apps SDK → MCP Apps field-level migration map
- Sentient Design (Josh Clark) — the framework, the triangle, radically adaptive experiences
- Generative & ephemeral UI — Google Research's generative UI paper, content-vs-chrome
- Component contracts and components-as-data (Nathan Curtis, Christine Vallaure)
- AGENTS.md / SKILL.md / DESIGN.md — the agent-facing design system layer
- How Lovable, v0, Figma Make, and Replit each ingest a design system
- The source-of-truth debate: three camps, and why "code-led vs design-led" isn't the real vocabulary
- Context-Based Design Systems, component contracts, and machine-readable documentation
- How a design system reaches Claude Code, Copilot, Cursor, and Windsurf

**Standards & Specifications**
- W3C Design Tokens Community Group (DTCG) Specification
- WCAG 2.2 Guidelines (A, AA, AAA levels)
- WAI-ARIA Authoring Practices Guide (APG)
- W3C Web Content Accessibility Guidelines
- W3C Mobile Accessibility at W3C

**Design System Resources**
- Material Design 3 (Google)
- Fluent Design System (Microsoft)
- Ant Design (Alibaba)
- Carbon Design System (IBM)
- Polaris (Shopify)
- Lightning Design System (Salesforce)
- Atlassian Design System
- Adobe Spectrum
- GitHub Primer
- Shopify Polaris

**Tools & Frameworks**
- Figma Design System Guides
- Style Dictionary Documentation
- Design Tokens Format Module
- Storybook Best Practices

**Methodologies & Best Practices**
- Atomic Design principles
- Design Systems Handbook
- Component architecture patterns
- Accessibility implementation guides

## Quick Start

### Using the Public MCP Server (Recommended)

No installation needed! Connect any MCP client to our live server:

```
https://design-systems-mcp.southleft.com/mcp
```

See [Connect to MCP Clients](#connect-to-mcp-clients) section below for detailed setup instructions.

### Local Development

1. **Clone and Install**
   ```bash
   git clone https://github.com/southleft/design-systems-mcp.git
   cd design-systems-mcp
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars and add your credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server available at: `http://localhost:8787`

## Connect to MCP Clients

Choose your AI coding tool below for setup instructions:

<details>
<summary><b>Claude Desktop</b> - Click to expand configuration</summary>

**Add via Custom Connector UI (Recommended - No JSON editing!)**

1. **Open Claude Desktop** and navigate to **Settings** → **Connectors**

2. **Click "Add custom connector"** at the bottom of the connectors list

3. **Fill in the connector details:**
   - **Name**: `Design Systems Assistant` (or any name you prefer)
   - **URL**: `https://design-systems-mcp.southleft.com/mcp`

4. **Click "Add"** to save the connector

5. **Start using it!** The connector will appear in your connectors list with 4 available tools:
   - `search_design_knowledge`
   - `search_chunks`
   - `browse_by_category`
   - `get_all_tags`
   - `browse_by_tag`

**That's it!** You can now use the Design Systems Assistant in your Claude Desktop conversations.

**Note:** Custom connectors are available for Claude Pro, Team, and Enterprise plans.

</details>

<details>
<summary><b>Claude Code (CLI)</b> - Click to expand configuration</summary>

**Quick Setup via CLI:**
```bash
claude mcp add --transport http design-systems https://design-systems-mcp.southleft.com/mcp
```

**Or manually edit `.mcp.json`:**
```json
{
  "mcpServers": {
    "design-systems": {
      "type": "http",
      "url": "https://design-systems-mcp.southleft.com/mcp"
    }
  }
}
```

**Verify connection:**
```bash
claude mcp list
```

</details>

<details>
<summary><b>Cursor IDE</b> - Click to expand configuration</summary>

**Location:** `~/.cursor/mcp_config.json` or `~/.config/cursor/mcp_config.json`

```json
{
  "mcpServers": {
    "design-systems": {
      "url": "https://design-systems-mcp.southleft.com/mcp"
    }
  }
}
```

**Restart Cursor** after updating the configuration.

</details>

<details>
<summary><b>Cline (VSCode Extension)</b> - Click to expand configuration</summary>

**Location:** VSCode Settings → Extensions → Cline → MCP Settings

**Add to MCP servers configuration:**
```json
{
  "design-systems": {
    "url": "https://design-systems-mcp.southleft.com/mcp",
    "description": "Design systems knowledge and best practices"
  }
}
```

**Or add via Command Palette:** `Cline: Add MCP Server`

**Reload VSCode** after configuration.

</details>

<details>
<summary><b>Continue (VSCode Extension)</b> - Click to expand configuration</summary>

**Location:** VSCode Settings → Extensions → Continue → config.json

```json
{
  "mcpServers": [
    {
      "name": "design-systems",
      "url": "https://design-systems-mcp.southleft.com/mcp",
      "description": "Design systems knowledge base"
    }
  ]
}
```

</details>

<details>
<summary><b>Zed Editor</b> - Click to expand configuration</summary>

**Location:** `~/.config/zed/settings.json`

```json
{
  "mcp": {
    "servers": {
      "design-systems": {
        "url": "https://design-systems-mcp.southleft.com/mcp"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Generic MCP Client</b> - Click to expand configuration</summary>

For any MCP client supporting remote servers:

**Endpoint:** `https://design-systems-mcp.southleft.com/mcp`

**Protocol:** JSON-RPC 2.0 over HTTP/HTTPS

**Transport:** Standard MCP transport (stdio, SSE, or HTTP)

</details>

<details>
<summary><b>Local Development Setup</b> - Click to expand configuration</summary>

To connect to your local development server instead of the public endpoint:

```json
{
  "mcpServers": {
    "design-systems": {
      "url": "http://localhost:8787/mcp"
    }
  }
}
```

**Note:** Local server requires running `npm run dev` first.

</details>

### Connection Troubleshooting

**Server not responding?**
- Verify the URL is correct: `https://design-systems-mcp.southleft.com/mcp`
- Test with curl: `curl https://design-systems-mcp.southleft.com/health`
- Check your client supports remote MCP servers

**Tools not appearing?**
- Restart your MCP client after configuration changes
- Check client logs for connection errors
- Verify JSON configuration syntax is correct

**Need help?**
- Open an issue: [GitHub Issues](../../issues)

## Available MCP Tools

The server provides these tools for AI assistants:

### search_design_knowledge
Search the complete knowledge base with semantic understanding.

**Parameters:**
- `query` (string, required) - Search query
- `category` (string, optional) - Filter by category
- `tags` (array, optional) - Filter by tags
- `limit` (number, optional) - Max results (default: 15)

**Example:**
```json
{
  "name": "search_design_knowledge",
  "arguments": {
    "query": "WCAG 2.2 color contrast requirements",
    "category": "guidelines",
    "limit": 5
  }
}
```

### search_chunks
Find specific information within content chunks for detailed answers.

**Parameters:**
- `query` (string, required) - Search query
- `limit` (number, optional) - Max chunks (default: 8)

**Example:**
```json
{
  "name": "search_chunks",
  "arguments": {
    "query": "W3C DTCG design tokens specification",
    "limit": 3
  }
}
```

### browse_by_category
Browse content organized by category.

**Categories:** components, tokens, patterns, guidelines, workflows, general

**Parameters:**
- `category` (string, required) - Category to browse

### get_all_tags
Get all available content tags for filtering and exploration.

## API Examples

### Direct API Testing

**Health Check:**
```bash
curl https://design-systems-mcp.southleft.com/health
```

**MCP Tools List:**
```bash
curl -X POST https://design-systems-mcp.southleft.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Search Query:**
```bash
curl -X POST https://design-systems-mcp.southleft.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "search_chunks",
      "arguments": {"query": "design tokens", "limit": 3}
    }
  }'
```

**AI Chat Interface (streaming):**

The `/ai-chat` endpoint returns a **Server-Sent Events** stream so content appears progressively. Each event is `data: {"t": "<chunk>"}\n\n`, terminated by `event: done\ndata: {}\n\n`.

```bash
curl -N -X POST https://design-systems-mcp.southleft.com/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the WCAG 2.2 contrast requirements?"}'
```

The hosted web UI at `/` consumes this stream and renders markdown progressively.

## Adding Content

### Ingest Web Content

```bash
# Single URL
npm run ingest:url https://material.io/components/buttons

# Bulk from CSV
npm run ingest:csv urls.csv

# Crawl entire website
npm run crawl:website https://polaris.shopify.com --max-depth 3
```

### Ingest PDF Content

```bash
npm run ingest:pdf path/to/design-guide.pdf
```

### Generate Vector Embeddings

```bash
npm run ingest:vectors
```

## Development

### Available Scripts

- `npm run dev` - Start local development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run ingest:pdf <file>` - Ingest PDF content
- `npm run ingest:url <url>` - Ingest web content
- `npm run ingest:csv <file>` - Bulk ingest from CSV
- `npm run crawl:website <url>` - Crawl entire websites
- `npm run ingest:vectors` - Generate embeddings for all content
- `npm run setup:supabase` - Initialize Supabase database
- `npm run check:duplicates` - Check for duplicate content

### Project Structure

```
design-systems-mcp/
├── src/
│   ├── index.ts                    # Main MCP server, transports, tool dispatch, embedded chat UI
│   ├── sse-session.ts              # SSE transport (Durable Object)
│   ├── streamable-http-handler.ts  # Streamable HTTP transport (/mcp)
│   ├── oauth-handler.ts            # OAuth flow
│   └── lib/
│       ├── content-manager.ts      # Content management
│       ├── search-handler.ts       # Vector + keyword search dispatch
│       ├── source-authority.ts     # Reliability tiers & APG disclaimers
│       └── ... (chunker, formatters, ingestion helpers)
├── content/
│   └── entries/              # Ingested content (JSON)
├── supabase/
│   └── migrations/           # SQL schema + RPC functions
├── scripts/
│   ├── ingestion/            # Content ingestion pipeline (URL, PDF, HTML, CSV, crawler)
│   └── build/                # Build helpers (manifest generation)
├── types/
│   └── content.ts           # TypeScript definitions
├── wrangler.jsonc          # Cloudflare Workers config
└── .dev.vars              # Local environment variables
```

## Deployment

### Deploy to Cloudflare Workers

1. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

2. **Set Secrets**
   ```bash
   npx wrangler secret put OPENAI_API_KEY
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_KEY
   npx wrangler secret put SUPABASE_ANON_KEY
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Vector Search Architecture

This server uses Supabase for production-grade vector search:

- **Database:** PostgreSQL with pgvector extension
- **Embeddings:** Cloudflare Workers AI `@cf/baai/bge-m3` (1024-dim, edge-native, no API key) via `VECTOR_SEARCH_PROVIDER=cloudflare`; OpenAI `text-embedding-3-small` (1536-dim) also supported
- **Threshold:** 0.15 for optimal recall
- **Hybrid Search:** Combines semantic vectors with text matching
- **Performance:** Sub-100ms queries with proper indexing

**Statistics:**
- 395 entries in production database
- 4,800+ content chunks; entry-level vector search via Cloudflare Workers AI
- W3C standards, WCAG guidelines, design system documentation
- Regular updates with new authoritative sources

## Troubleshooting

### Common Issues

**Vector search not working:**
- Check Supabase credentials in environment variables
- Verify database tables exist: `npm run setup:supabase`
- Check logs: `npx wrangler tail`

**Content not found:**
- Verify content exists: `npm run check:duplicates`
- Check if embeddings generated: Look for `embedding` field in content entries
- Test search locally: `npm run dev` and use curl commands

**MCP connection fails:**
- Verify URL is correct and accessible
- Check client supports remote MCP servers
- Test with curl: `curl https://design-systems-mcp.southleft.com/health`
- Restart MCP client after configuration changes

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute and add content
- [CREDITS.md](CREDITS.md) - Content sources and attribution

## License & Attribution

**License:** MIT License - Free for personal and commercial use

**Content Attribution:** This project compiles design systems knowledge from many brilliant creators. All original content remains the intellectual property of their respective authors.

- See [CREDITS.md](CREDITS.md) for complete attribution
- Always link back to original sources when sharing insights
- Support original creators by visiting their websites

## Security & Privacy

- No sensitive data stored - Only public design system knowledge
- Environment variables use Cloudflare secrets
- Open source and auditable
- Privacy-focused - No user data collection
- Regular security updates

Report security issues to: [GitHub Security](../../security/advisories)

## Contributing

We welcome contributions! Whether you want to:
- Report bugs or issues
- Suggest new features
- Add more design system content
- Improve the codebase
- Enhance documentation

Please:
1. Check existing [issues](../../issues)
2. Open a new issue to discuss
3. Submit a pull request
4. Follow [contribution guidelines](CONTRIBUTING.md)

## Support

- Issues: [GitHub Issues](../../issues)
- Discussions: [GitHub Discussions](../../discussions)
- Live Demo: [https://design-systems-mcp.southleft.com/](https://design-systems-mcp.southleft.com/)

## Acknowledgments

Thanks to the design systems community for sharing knowledge:

- Brad Frost for Atomic Design methodology
- W3C Design Tokens Community Group
- Web Accessibility Initiative (WAI)
- All design teams who openly share their work
- The entire design systems community

See [CREDITS.md](CREDITS.md) for the complete list.

---

Built with ❤️ using Cloudflare Workers and the Model Context Protocol
