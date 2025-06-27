import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
	loadEntries,
	searchEntries,
	getEntriesByCategory,
	getAllTags,
	getEntryById,
	searchChunks,
	SAMPLE_ENTRIES
} from "./lib/content-manager.js";
import { Category, ContentEntry } from "../types/content";

// OpenAI integration
import { OpenAI } from "openai";

// Load content from actual JSON files (same approach for local and production)
console.log('🔄 Loading content from JSON files...');

async function loadActualContent() {
	try {
		// Load content dynamically using manifest file
		const { loadAllContentEntries } = require('./lib/content-loader');
		const actualEntries = await loadAllContentEntries();

		if (actualEntries.length > 0) {
			loadEntries(actualEntries);

			console.log(`✅ Loaded ${actualEntries.length} content entries dynamically`);
			console.log(`📚 Entries: ${actualEntries.map((e: ContentEntry) => e.title).join(', ')}`);

			// Log some chunks to verify content is loaded
			const totalChunks = actualEntries.reduce((sum: number, entry: ContentEntry) => sum + (entry.chunks?.length || 0), 0);
			console.log(`📄 Total chunks loaded: ${totalChunks}`);

			// Log tags for verification
			const { getAllTags } = require('./lib/content-manager');
			const tags = getAllTags();
			console.log(`🏷️  Available tags: ${tags.length} total`);

			return true;
		} else {
			throw new Error('No content entries loaded from manifest');
		}
	} catch (error) {
		console.error('❌ Failed to load content dynamically:', error);
		console.error('Error details:', error instanceof Error ? error.message : String(error));

		// Fallback to sample entries
		console.log('🔄 Loading fallback sample content...');
		const { SAMPLE_ENTRIES } = require('./lib/content-manager');
		loadEntries(SAMPLE_ENTRIES);
		console.warn('⚠️  Using fallback sample content');
		return false;
	}
}

// Initialize content loading
loadActualContent();

// AI System Prompt
const AI_SYSTEM_PROMPT = `You are a helpful design systems expert with access to a comprehensive design systems knowledge base. Your role is to provide accurate, practical answers about design systems, components, tokens, and best practices.

CRITICAL: You MUST ALWAYS search the knowledge base first before answering any question. You have the following MCP tools available:
1. search_design_knowledge - Search for general design system content
2. search_chunks - Search for specific detailed information (USE THIS for specific terms, names, or detailed questions)
3. browse_by_category - Browse content by category (components, tokens, patterns, workflows, guidelines, general)
4. get_all_tags - Get available tags in the knowledge base

MANDATORY WORKFLOW:
1. For ANY user question, ALWAYS start by calling search_chunks with relevant keywords from the user's query
2. If search_chunks doesn't find specific information, try search_design_knowledge with broader terms
3. Only after searching the knowledge base should you provide your response
4. Always clearly distinguish between knowledge base findings and general knowledge

IMPORTANT: Structure your responses as follows:
## 📚 From Your Knowledge Base
[Include any information found via MCP tools, with specific quotes and sources]

## 🧠 General Design Systems Knowledge
[Include any additional context from your training data]

You must ALWAYS call at least one search tool before responding, even if you think you know the answer.`;

// Available MCP tools for the AI
const MCP_TOOLS = [
	{
		type: "function" as const,
		function: {
			name: "search_design_knowledge",
			description: "Search the design systems knowledge base for general information",
			parameters: {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "Search query for design system knowledge"
					},
					category: {
						type: "string",
						enum: ["components", "tokens", "patterns", "workflows", "guidelines", "general"],
						description: "Filter by category (optional)"
					},
					limit: {
						type: "number",
						description: "Maximum number of results (default: 10)"
					}
				},
				required: ["query"]
			}
		}
	},
	{
		type: "function" as const,
		function: {
			name: "search_chunks",
			description: "Search for specific detailed information in content chunks",
			parameters: {
				type: "object",
				properties: {
					query: {
						type: "string",
						description: "Search query for specific information"
					},
					limit: {
						type: "number",
						description: "Maximum number of chunks (default: 5)"
					}
				},
				required: ["query"]
			}
		}
	},
	{
		type: "function" as const,
		function: {
			name: "browse_by_category",
			description: "Browse content by category",
			parameters: {
				type: "object",
				properties: {
					category: {
						type: "string",
						enum: ["components", "tokens", "patterns", "workflows", "guidelines", "general"],
						description: "Category to browse"
					}
				},
				required: ["category"]
			}
		}
	},
	{
		type: "function" as const,
		function: {
			name: "get_all_tags",
			description: "Get all available tags in the knowledge base",
			parameters: {
				type: "object" as const,
				properties: {},
				required: []
			}
		}
	},

];

// Function to call MCP tools
async function callMcpTool(toolName: string, args: any): Promise<string> {
	switch (toolName) {
		case "search_design_knowledge":
			const searchResults = searchEntries({
				query: args.query,
				category: args.category as Category | undefined,
				limit: args.limit || 10,
			});

			if (searchResults.length === 0) {
				return "No design system knowledge found matching your search criteria.";
			}

			const formattedResults = searchResults.map((entry, index) =>
				`**${index + 1}. ${entry.title}**
Category: ${entry.metadata.category}
System: ${entry.metadata.system || "N/A"}
Tags: ${entry.metadata.tags.join(", ")}
Confidence: ${entry.metadata.confidence}

${entry.content.slice(0, 300)}${entry.content.length > 300 ? "..." : ""}

---`
			).join("\n\n");

			return `FOUND ${searchResults.length} RESULT${searchResults.length === 1 ? "" : "S"}:

${formattedResults}`;

		case "search_chunks":
			const chunkResults = searchChunks(args.query, args.limit || 5);

			if (chunkResults.length === 0) {
				return "No specific information found matching your query.";
			}

			const formattedChunks = chunkResults.map((result, index) =>
				`**${index + 1}. ${(result.chunk.metadata?.section || "EXCERPT")}**
From: ${result.entry.title}
Relevance Score: ${result.score}

"${result.chunk.text}"

---`
			).join("\n\n");

			return `FOUND ${chunkResults.length} RELEVANT CHUNK${chunkResults.length === 1 ? "" : "S"}:

${formattedChunks}`;

		case "browse_by_category":
			const categoryEntries = getEntriesByCategory(args.category as Category);

			if (categoryEntries.length === 0) {
				return `No entries found in category: ${args.category}`;
			}

			const formattedEntries = categoryEntries.map(entry =>
				`**${entry.title}**
Tags: ${entry.metadata.tags.join(", ")}
System: ${entry.metadata.system || "N/A"}`
			).join("\n\n");

			return `${categoryEntries.length} ENTR${categoryEntries.length === 1 ? "Y" : "IES"} IN "${args.category.toUpperCase()}":

${formattedEntries}`;

		case "get_all_tags":
			const tags = getAllTags();
			return `AVAILABLE TAGS (${tags.length}): ${tags.join(", ")}`;



		default:
			throw new Error(`Unknown tool: ${toolName}`);
	}
}

// AI Chat Handler
async function handleAiChat(request: Request, env: any): Promise<Response> {
	try {
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

		const { message } = await request.json() as any;

		// Get OpenAI config from environment variables
		const apiKey = env?.OPENAI_API_KEY;
		const model = env?.OPENAI_MODEL || "gpt-4o-mini";

		if (!apiKey) {
			return new Response(JSON.stringify({
				error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
			}), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		// Initialize OpenAI
		const openai = new OpenAI({
			apiKey: apiKey,
		});

		// Create the chat completion with tool calling
		const completion = await openai.chat.completions.create({
			model: model,
			messages: [
				{
					role: "system",
					content: AI_SYSTEM_PROMPT
				},
				{
					role: "user",
					content: message
				}
			],
			tools: MCP_TOOLS,
			tool_choice: "auto",
		});

		let response = completion.choices[0].message;

		// Handle tool calls
		if (response.tool_calls && response.tool_calls.length > 0) {
			const messages: any[] = [
				{
					role: "system",
					content: AI_SYSTEM_PROMPT
				},
				{
					role: "user",
					content: message
				},
				response
			];

			// Execute each tool call
			for (const toolCall of response.tool_calls) {
				try {
					const toolResult = await callMcpTool(
						toolCall.function.name,
						JSON.parse(toolCall.function.arguments)
					);

					messages.push({
						role: "tool",
						tool_call_id: toolCall.id,
						content: toolResult // Now it's a string, not JSON
					});
				} catch (error: any) {
					messages.push({
						role: "tool",
						tool_call_id: toolCall.id,
						content: `Error: ${error.message}`
					});
				}
			}

			// Get final response with tool results
			const finalCompletion = await openai.chat.completions.create({
				model: model,
				messages: messages,
			});

			response = finalCompletion.choices[0].message;
		}

		return new Response(JSON.stringify({
			response: response.content
		}), {
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});

	} catch (error: any) {
		console.error("AI Chat Error:", error);

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		return new Response(JSON.stringify({
			error: error.message || "An error occurred while processing your request"
		}), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	}
}

// Create MCP server instance
const server = new McpServer({
	name: "Design Systems Knowledge Base",
	version: "1.0.0",
});

// Initialize MCP tools
server.tool(
	"search_design_knowledge",
	{
		query: z.string().describe("Search query for design system knowledge"),
		category: z.enum(["components", "tokens", "patterns", "workflows", "guidelines", "general"])
			.optional()
			.describe("Filter by category"),
		tags: z.array(z.string()).optional().describe("Filter by tags"),
		limit: z.number().min(1).max(50).default(10).describe("Maximum number of results"),
	},
	async ({ query, category, tags, limit }) => {
		const results = searchEntries({
			query,
			category: category as Category | undefined,
			tags,
			limit,
		});

		if (results.length === 0) {
			return {
				content: [{
					type: "text",
					text: "No design system knowledge found matching your search criteria."
				}],
			};
		}

		const formattedResults = results.map((entry, index) =>
			`<strong>🔍 ${index + 1}. ${entry.title}</strong>

<em>📂 Category:</em> ${entry.metadata.category}
<em>🏷️ System:</em> ${entry.metadata.system || "N/A"}
<em>🔖 Tags:</em> ${entry.metadata.tags.join(", ")}
<em>⭐ Confidence:</em> ${entry.metadata.confidence}

${entry.content.slice(0, 300)}${entry.content.length > 300 ? "..." : ""}

<hr style="border: 1px solid #ddd; margin: 20px 0;">`
		).join("\n\n");

		return {
			content: [{
				type: "text",
				text: `<strong>🔍 FOUND ${results.length} RESULT${results.length === 1 ? "" : "S"}</strong>

${formattedResults}`
			}],
		};
	}
);

// Tool: Search chunks for specific information
server.tool(
	"search_chunks",
	{
		query: z.string().describe("Search query for specific information"),
		limit: z.number().min(1).max(20).default(5).describe("Maximum number of chunks"),
	},
	async ({ query, limit }) => {
		const results = searchChunks(query, limit);

		if (results.length === 0) {
			return {
				content: [{
					type: "text",
					text: "No specific information found matching your query."
				}],
			};
		}

		const formattedChunks = results.map((result, index) =>
			`<strong>💡 ${index + 1}. ${(result.chunk.metadata?.section || "EXCERPT")}</strong>

<em>📚 From:</em> ${result.entry.title}
<em>⚡ Relevance Score:</em> ${result.score}

<blockquote style="border-left: 3px solid #007acc; padding-left: 16px; margin: 16px 0; color: #333; font-style: italic;">
"${result.chunk.text}"
</blockquote>

<hr style="border: 1px solid #ddd; margin: 20px 0;">`
		).join("\n\n");

		return {
			content: [{
				type: "text",
				text: `<strong>🎯 FOUND ${results.length} RELEVANT CHUNK${results.length === 1 ? "" : "S"}</strong>

${formattedChunks}`
			}],
		};
	}
);

// Tool: Browse by category
server.tool(
	"browse_by_category",
	{
		category: z.enum(["components", "tokens", "patterns", "workflows", "guidelines", "general"])
			.describe("Category to browse"),
	},
	async ({ category }) => {
		const entries = getEntriesByCategory(category as Category);

		if (entries.length === 0) {
			return {
				content: [{
					type: "text",
					text: `No entries found in category: ${category}`
				}],
			};
		}

		const formattedEntries = entries.map(entry =>
			`<strong>📋 ${entry.title}</strong>
<em>🔖 Tags:</em> ${entry.metadata.tags.join(", ")}
<em>🏷️ System:</em> ${entry.metadata.system || "N/A"}`
		).join("\n\n");

		return {
			content: [{
				type: "text",
				text: `<strong>📁 ${entries.length} ENTR${entries.length === 1 ? "Y" : "IES"} IN "${category.toUpperCase()}"</strong>

${formattedEntries}`
			}],
		};
	}
);

// Tool: Get all tags
server.tool(
	"get_all_tags",
	{},
	async () => {
		const tags = getAllTags();

		return {
			content: [{
				type: "text",
				text: `<strong>🏷️ AVAILABLE TAGS (${tags.length})</strong>

${tags.map(tag => `<span style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; margin: 2px;">🔖 ${tag}</span>`).join(" ")}`
			}],
		};
	}
);

// Simple request handler
async function handleMcpRequest(request: Request): Promise<Response> {
	try {
		// Add CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		// Handle OPTIONS request
		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Only handle POST requests for MCP
		if (request.method !== "POST") {
			return new Response("Method not allowed", { status: 405 });
		}

				const body = await request.json() as any;

		// Handle MCP JSON-RPC request
		if (body.method === "tools/call") {
			const toolName = body.params?.name;
			const args = body.params?.arguments || {};

			let result;

			switch (toolName) {
				case "search_design_knowledge":
					const searchResults = searchEntries({
						query: args.query,
						category: args.category,
						tags: args.tags,
						limit: args.limit || 10,
					});

					if (searchResults.length === 0) {
						result = {
							content: [{
								type: "text",
								text: "No design system knowledge found matching your search criteria."
							}],
						};
					} else {
						const formattedResults = searchResults.map((entry, index) =>
							`<strong>🔍 ${index + 1}. ${entry.title}</strong>

<em>📂 Category:</em> ${entry.metadata.category}
<em>🏷️ System:</em> ${entry.metadata.system || "N/A"}
<em>🔖 Tags:</em> ${entry.metadata.tags.join(", ")}
<em>⭐ Confidence:</em> ${entry.metadata.confidence}

${entry.content.slice(0, 300)}${entry.content.length > 300 ? "..." : ""}

<hr style="border: 1px solid #ddd; margin: 20px 0;">`
						).join("\n\n");

						result = {
							content: [{
								type: "text",
								text: `<strong>🔍 FOUND ${searchResults.length} RESULT${searchResults.length === 1 ? "" : "S"}</strong>

${formattedResults}`
							}],
						};
					}
					break;

				case "search_chunks":
					const chunkResults = searchChunks(args.query, args.limit || 5);

					if (chunkResults.length === 0) {
						result = {
							content: [{
								type: "text",
								text: "No specific information found matching your query."
							}],
						};
					} else {
						const formattedChunks = chunkResults.map((result, index) =>
							`<strong>💡 ${index + 1}. ${(result.chunk.metadata?.section || "EXCERPT")}</strong>

<em>📚 From:</em> ${result.entry.title}
<em>⚡ Relevance Score:</em> ${result.score}

<blockquote style="border-left: 3px solid #007acc; padding-left: 16px; margin: 16px 0; color: #333; font-style: italic;">
"${result.chunk.text}"
</blockquote>

<hr style="border: 1px solid #ddd; margin: 20px 0;">`
						).join("\n\n");

						result = {
							content: [{
								type: "text",
								text: `<strong>🎯 FOUND ${chunkResults.length} RELEVANT CHUNK${chunkResults.length === 1 ? "" : "S"}</strong>

${formattedChunks}`
							}],
						};
					}
					break;

				case "browse_by_category":
					const categoryEntries = getEntriesByCategory(args.category as Category);

					if (categoryEntries.length === 0) {
						result = {
							content: [{
								type: "text",
								text: `No entries found in category: ${args.category}`
							}],
						};
					} else {
						const formattedEntries = categoryEntries.map((entry, index) =>
							`<strong>📋 ${index + 1}. ${entry.title}</strong>
<em>🔖 Tags:</em> ${entry.metadata.tags.join(", ")}
<em>🏷️ System:</em> ${entry.metadata.system || "N/A"}`
						).join("\n\n");

						result = {
							content: [{
								type: "text",
								text: `<strong>📁 ${categoryEntries.length} ENTR${categoryEntries.length === 1 ? "Y" : "IES"} IN "${args.category.toUpperCase()}"</strong>

${formattedEntries}`
							}],
						};
					}
					break;

				case "get_all_tags":
					const tags = getAllTags();
					const tagList = tags.map(tag => `<span style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; margin: 2px;">🔖 ${tag}</span>`).join(" ");
					result = {
						content: [{
							type: "text",
							text: `<strong>🏷️ AVAILABLE TAGS (${tags.length})</strong>

${tagList}`
						}],
					};
					break;

				default:
					return new Response(JSON.stringify({
						jsonrpc: "2.0",
						id: body.id,
						error: {
							code: -32601,
							message: `Method not found: ${toolName}`
						}
					}), {
						status: 400,
						headers: { ...corsHeaders, "Content-Type": "application/json" }
					});
			}

			return new Response(JSON.stringify({
				jsonrpc: "2.0",
				id: body.id,
				result
			}), {
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		return new Response(JSON.stringify({
			jsonrpc: "2.0",
			id: body.id,
			error: {
				code: -32600,
				message: "Invalid Request"
			}
		}), {
			status: 400,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});

	} catch (error) {
		return new Response(JSON.stringify({
			jsonrpc: "2.0",
			id: null,
			error: {
				code: -32603,
				message: "Internal error"
			}
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/mcp") {
			return handleMcpRequest(request);
		}

		if (url.pathname === "/ai-chat") {
			return handleAiChat(request, env);
		}

		// Serve the AI chat interface
		if (url.pathname === "/" || url.pathname === "/chat") {
			return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Design Systems Assistant - AI-Powered Design Systems Knowledge</title>
    <meta name="description" content="AI-powered assistant that searches through design systems knowledge base to answer questions about components, tokens, patterns, and best practices.">

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎨</text></svg>">

    <!-- Open Graph / Social Media Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Design Systems Assistant - AI-Powered Knowledge Base">
    <meta property="og:description" content="AI assistant that searches through 109 design systems resources to answer questions about components, tokens, patterns, and best practices.">
    <meta property="og:url" content="https://design-systems-mcp.southleft.com">
    <meta property="og:image" content="https://design-systems-mcp.southleft.com/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Design Systems Assistant">
    <meta name="twitter:description" content="AI-powered assistant for design systems knowledge">
    <meta name="twitter:image" content="https://design-systems-mcp.southleft.com/og-image.png">

    <!-- Additional Meta -->
    <meta name="theme-color" content="#339af0">
    <meta name="author" content="Southleft">
    <link rel="canonical" href="https://design-systems-mcp.southleft.com">

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        }
        #root {
            min-height: 100vh;
        }
        .loader-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1a1b1e;
            color: #c1c2c5;
            z-index: 9999;
        }
        .loader {
            display: inline-block;
            width: 24px;
            height: 24px;
            border: 3px solid #495057;
            border-radius: 50%;
            border-top-color: #339af0;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="loader" class="loader-container">
        <div style="text-align: center;">
            <div class="loader"></div>
            <div style="margin-top: 16px; font-size: 14px;">Loading Design Systems Chat...</div>
        </div>
    </div>
    <div id="root"></div>

    <!-- React and ReactDOM -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <!-- Babel Standalone for JSX -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <!-- Mantine Core and Hooks -->
    <script src="https://unpkg.com/@mantine/core@7.12.2/esm/index.js" type="module"></script>
    <script src="https://unpkg.com/@mantine/hooks@7.12.2/esm/index.js" type="module"></script>

    <!-- Mantine CSS -->
    <link href="https://unpkg.com/@mantine/core@7.12.2/styles.css" rel="stylesheet" />

    <!-- Marked for markdown parsing -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

    <!-- Tabler Icons -->
    <script src="https://unpkg.com/@tabler/icons-react@3.14.0/dist/index.umd.js"></script>

    <script type="text/babel">
        const { useState, useEffect, useRef } = React;
        const { createRoot } = ReactDOM;

        // Mock Mantine components and hooks (since CDN import might not work perfectly)
        const MantineProvider = ({ children, defaultColorScheme }) => {
            React.useEffect(() => {
                document.documentElement.setAttribute('data-mantine-color-scheme', defaultColorScheme);
            }, [defaultColorScheme]);
            return children;
        };

        const Container = ({ children, size = 'lg', style = {} }) => (
            <div style={{
                maxWidth: size === 'lg' ? '1200px' : '100%',
                margin: '0 auto',
                padding: '0 16px',
                ...style
            }}>
                {children}
            </div>
        );

        const Stack = ({ children, gap = 'md', style = {} }) => (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: gap === 'md' ? '16px' : gap === 'lg' ? '24px' : gap === 'sm' ? '8px' : gap,
                ...style
            }}>
                {children}
            </div>
        );

        const Group = ({ children, justify = 'flex-start', align = 'center', gap = 'md', style = {} }) => (
            <div style={{
                display: 'flex',
                justifyContent: justify,
                alignItems: align,
                gap: gap === 'md' ? '16px' : gap === 'lg' ? '24px' : gap === 'sm' ? '8px' : gap,
                flexWrap: 'wrap',
                ...style
            }}>
                {children}
            </div>
        );

        const Card = ({ children, padding = 'md', radius = 'md', withBorder = true, style = {} }) => (
            <div style={{
                background: '#25262b',
                border: withBorder ? '1px solid #373a40' : 'none',
                borderRadius: radius === 'md' ? '8px' : radius === 'lg' ? '12px' : radius,
                padding: padding === 'md' ? '16px' : padding === 'lg' ? '24px' : padding,
                ...style
            }}>
                {children}
            </div>
        );

        const Title = ({ children, order = 1, style = {} }) => {
            const Tag = \`h\${order}\`;
            const fontSize = order === 1 ? '32px' : order === 2 ? '24px' : order === 3 ? '20px' : '16px';
            return (
                <Tag style={{
                    color: '#c1c2c5',
                    margin: 0,
                    fontSize,
                    fontWeight: order <= 2 ? '700' : '600',
                    ...style
                }}>
                    {children}
                </Tag>
            );
        };

        const Text = ({ children, size = 'sm', c = '#909296', fw, style = {} }) => (
            <p style={{
                color: c,
                margin: 0,
                fontSize: size === 'sm' ? '14px' : size === 'md' ? '16px' : size === 'lg' ? '18px' : size,
                fontWeight: fw || 'normal',
                ...style
            }}>
                {children}
            </p>
        );

        const Button = ({ children, variant = 'filled', size = 'md', leftSection, rightSection, loading, disabled, onClick, style = {} }) => {
            const baseStyle = {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: size === 'md' ? '10px 16px' : '8px 12px',
                border: 'none',
                borderRadius: '6px',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                opacity: disabled || loading ? 0.6 : 1,
                ...style
            };

            const variantStyles = {
                filled: {
                    background: 'linear-gradient(135deg, #339af0 0%, #1c7ed6 100%)',
                    color: 'white',
                },
                light: {
                    background: '#1e3a5f',
                    color: '#339af0',
                },
                outline: {
                    background: 'transparent',
                    color: '#339af0',
                    border: '1px solid #339af0',
                }
            };

            return (
                <button
                    style={{ ...baseStyle, ...variantStyles[variant] }}
                    onClick={disabled || loading ? undefined : onClick}
                    disabled={disabled || loading}
                >
                    {loading && <div className="loader" style={{width: '16px', height: '16px'}}></div>}
                    {leftSection}
                    {children}
                    {rightSection}
                </button>
            );
        };

        const Textarea = ({ placeholder, value, onChange, onKeyDown, rows = 3, style = {} }) => (
            <textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={rows}
                style={{
                    width: '100%',
                    background: '#1a1b1e',
                    border: '1px solid #373a40',
                    borderRadius: '6px',
                    padding: '12px',
                    color: '#c1c2c5',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    minHeight: '48px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    ...style
                }}
                onFocus={(e) => e.target.style.borderColor = '#339af0'}
                onBlur={(e) => e.target.style.borderColor = '#373a40'}
            />
        );

        const Badge = ({ children, variant = 'light', color = 'blue', size = 'sm', style = {} }) => (
            <span style={{
                display: 'inline-block',
                padding: size === 'sm' ? '4px 8px' : '6px 12px',
                backgroundColor: color === 'green' ? '#2f5233' : '#1e3a5f',
                color: color === 'green' ? '#51cf66' : '#339af0',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                ...style
            }}>
                {children}
            </span>
        );

        const ScrollArea = ({ children, style = {} }) => (
            <div style={{
                overflow: 'auto',
                ...style
            }}>
                {children}
            </div>
        );

        // Example questions data
        const EXAMPLE_QUESTIONS = [
            { icon: '🎨', text: 'What are design tokens and how should I use them?' },
            { icon: '♿', text: 'How do I create accessible button components?' },
            { icon: '🔧', text: 'What causes design debt and how can I reduce it?' },
            { icon: '📚', text: 'What are the best practices for organizing a design system?' },
            { icon: '🧩', text: 'How do components work in design systems?' },
            { icon: '🏷️', text: 'What categories and tags are available in the knowledge base?' }
        ];

        // Chat App Component
        function ChatApp() {
            const [messages, setMessages] = useState([{
                type: 'system',
                content: '🎯 Welcome! I\\'m your AI design systems assistant. I can search through your design systems knowledge base and provide expert answers.\\n\\n💡 Ask me anything about design systems, components, tokens, or best practices!'
            }]);
            const [inputValue, setInputValue] = useState('');
            const [isLoading, setIsLoading] = useState(false);
            const messagesEndRef = useRef(null);

            const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            };

            useEffect(() => {
                scrollToBottom();
            }, [messages]);

            const addMessage = (type, content) => {
                setMessages(prev => [...prev, { type, content, id: Date.now() }]);
            };

            const askQuestion = (question) => {
                setInputValue(question);
                setTimeout(() => sendMessage(question), 100);
            };

            const sendMessage = async (messageText = inputValue) => {
                const message = messageText.trim();
                if (!message) return;

                addMessage('user', message);
                setInputValue('');
                setIsLoading(true);

                // Add thinking message
                const thinkingId = Date.now();
                addMessage('thinking', 'Analyzing your question and searching the knowledge base...');

                try {
                    const response = await fetch('/ai-chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });

                    // Remove thinking message
                    setMessages(prev => prev.filter(msg => msg.type !== 'thinking'));

                    if (!response.ok) {
                        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                    }

                    const data = await response.json();

                    if (data.error) {
                        addMessage('error', \`❌ \${data.error}\`);
                    } else {
                        addMessage('assistant', data.response);
                    }
                } catch (error) {
                    setMessages(prev => prev.filter(msg => msg.type !== 'thinking'));
                    addMessage('error', \`❌ Error: \${error.message}. Make sure the MCP server is running and OpenAI API key is configured.\`);
                } finally {
                    setIsLoading(false);
                }
            };

            const handleKeyPress = (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                }
            };

            const MessageComponent = ({ message }) => {
                const getMessageStyle = (type) => {
                    const base = {
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        maxWidth: '85%',
                        lineHeight: '1.6'
                    };

                    switch (type) {
                        case 'user':
                            return {
                                ...base,
                                background: 'linear-gradient(135deg, #339af0 0%, #1c7ed6 100%)',
                                color: 'white',
                                marginLeft: 'auto'
                            };
                        case 'assistant':
                            return {
                                ...base,
                                background: '#25262b',
                                color: '#c1c2c5',
                                border: '1px solid #373a40'
                            };
                        case 'system':
                            return {
                                ...base,
                                background: '#1e3a5f',
                                color: '#339af0',
                                border: '1px solid #339af0',
                                fontStyle: 'italic',
                                textAlign: 'center',
                                maxWidth: '100%'
                            };
                        case 'thinking':
                            return {
                                ...base,
                                background: '#2d1e00',
                                color: '#ffd43b',
                                border: '1px solid #fab005',
                                fontStyle: 'italic'
                            };
                        case 'error':
                            return {
                                ...base,
                                background: '#2d0e0e',
                                color: '#ff6b6b',
                                border: '1px solid #e03131'
                            };
                        default:
                            return base;
                    }
                };

                const renderContent = (content, type) => {
                    if (type === 'assistant') {
                        return { __html: marked.parse(content) };
                    }
                    if (type === 'thinking') {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    <span style={{
                                        width: '4px', height: '4px', background: '#ffd43b', borderRadius: '50%',
                                        animation: 'thinking 1.5s ease-in-out infinite'
                                    }}></span>
                                    <span style={{
                                        width: '4px', height: '4px', background: '#ffd43b', borderRadius: '50%',
                                        animation: 'thinking 1.5s ease-in-out infinite 0.2s'
                                    }}></span>
                                    <span style={{
                                        width: '4px', height: '4px', background: '#ffd43b', borderRadius: '50%',
                                        animation: 'thinking 1.5s ease-in-out infinite 0.4s'
                                    }}></span>
                                </div>
                                {content}
                            </div>
                        );
                    }
                    return content;
                };

                return (
                    <div style={getMessageStyle(message.type)}>
                        {message.type === 'assistant' ? (
                            <div dangerouslySetInnerHTML={renderContent(message.content, message.type)} />
                        ) : (
                            renderContent(message.content, message.type)
                        )}
                    </div>
                );
            };

            return (
                <div style={{
                    minHeight: '100vh',
                    background: '#1a1b1e',
                    color: '#c1c2c5',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Container size="lg" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
                        {/* Floating Header */}
                        <div style={{
                            background: '#25262b',
                            border: '1px solid #373a40',
                            borderRadius: '0 0 16px 16px',
                            padding: '16px 24px',
                            position: 'sticky',
                            top: 0,
                            zIndex: 100,
                            margin: '0 16px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}>
                            <Group justify="space-between" align="center">
                                <div>
                                    <Title order={3} style={{ color: '#c1c2c5', marginBottom: '2px', fontWeight: '600' }}>
                                        Design Systems Assistant
                                    </Title>
                                    <Text size="sm" style={{ color: '#909296' }}>
                                        Powered by AI • 109 design systems resources
                                    </Text>
                                </div>
                                <Badge variant="light" color="green" size="sm">
                                    Online
                                </Badge>
                            </Group>
                        </div>

                        {/* Messages Area */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0 24px'
                        }}>
                            <ScrollArea style={{ flex: 1 }}>
                                {messages.length === 1 && messages[0].type === 'system' ? (
                                    // Welcome screen when no messages - centered like ChatGPT
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: 'calc(100vh - 200px)',
                                        textAlign: 'center',
                                        paddingTop: '60px'
                                    }}>
                                        {/* Elegant centered title */}
                                        <div style={{ marginBottom: '48px' }}>
                                            <Title
                                                order={1}
                                                style={{
                                                    color: '#c1c2c5',
                                                    marginBottom: '16px',
                                                    fontSize: '48px',
                                                    fontWeight: '300',
                                                    letterSpacing: '-0.02em'
                                                }}
                                            >
                                                Design Systems Assistant
                                            </Title>
                                            <Text
                                                style={{
                                                    color: '#909296',
                                                    fontSize: '18px',
                                                    fontWeight: '400',
                                                    maxWidth: '600px',
                                                    lineHeight: '1.5'
                                                }}
                                            >
                                                Search through your design systems knowledge base to answer questions about components, tokens, patterns, and best practices.
                                            </Text>
                                        </div>

                                        {/* Centered input area */}
                                        <div style={{
                                            width: '100%',
                                            maxWidth: '700px',
                                            marginBottom: '32px'
                                        }}>
                                            <div style={{
                                                background: '#25262b',
                                                border: '1px solid #373a40',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '0',
                                                transition: 'border-color 0.2s ease'
                                            }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = '#339af0'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = '#373a40'}
                                            >
                                                <textarea
                                                    placeholder="Ask me anything about design systems..."
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    onKeyDown={handleKeyPress}
                                                    rows={1}
                                                    style={{
                                                        flex: 1,
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#c1c2c5',
                                                        fontSize: '16px',
                                                        fontFamily: 'inherit',
                                                        resize: 'none',
                                                        outline: 'none',
                                                        padding: '16px 20px',
                                                        lineHeight: '1.5',
                                                        minHeight: 'auto'
                                                    }}
                                                    disabled={isLoading}
                                                    onFocus={(e) => {
                                                        e.target.parentElement.style.borderColor = '#339af0';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.parentElement.style.borderColor = '#373a40';
                                                    }}
                                                />
                                                <button
                                                    onClick={() => sendMessage()}
                                                    disabled={!inputValue.trim() || isLoading}
                                                    style={{
                                                        background: inputValue.trim() && !isLoading
                                                            ? '#339af0'
                                                            : '#373a40',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '8px',
                                                        margin: '8px',
                                                        cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s ease',
                                                        minWidth: '32px',
                                                        height: '32px'
                                                    }}
                                                >
                                                    {isLoading ? (
                                                        <div style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            border: '2px solid #ffffff40',
                                                            borderTop: '2px solid #ffffff',
                                                            borderRadius: '50%',
                                                            animation: 'spin 1s linear infinite'
                                                        }} />
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{
                                                            color: inputValue.trim() ? 'white' : '#909296'
                                                        }}>
                                                            <path
                                                                d="M7 11L12 6L17 11M12 18V7"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                transform="rotate(90 12 12)"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Topic suggestions below input */}
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '8px',
                                            justifyContent: 'center',
                                            maxWidth: '600px',
                                            marginBottom: '32px'
                                        }}>
                                            {[
                                                'Design tokens',
                                                'Button components',
                                                'Design debt',
                                                'Component architecture',
                                                'Accessibility',
                                                'Available resources'
                                            ].map((topic, index) => (
                                                <button
                                                    key={index}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: 'transparent',
                                                        border: '1px solid #373a40',
                                                        borderRadius: '20px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        color: '#909296',
                                                        transition: 'all 0.2s ease',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.borderColor = '#339af0';
                                                        e.target.style.color = '#339af0';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.borderColor = '#373a40';
                                                        e.target.style.color = '#909296';
                                                    }}
                                                    onClick={() => askQuestion(\`Tell me about \${topic.toLowerCase()}\`)}
                                                >
                                                    {topic}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Subtle helper text */}
                                        <Text
                                            size="sm"
                                            style={{
                                                color: '#6c6f75',
                                                fontSize: '14px'
                                            }}
                                        >
                                            Press Enter to send, Shift+Enter for new line
                                        </Text>
                                    </div>
                                ) : (
                                    // Regular chat messages
                                    <div style={{ padding: '24px 0' }}>
                                        {messages.map((message) => (
                                            <MessageComponent key={message.id || Math.random()} message={message} />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Input Area for active conversations */}
                        {messages.length > 1 || (messages.length === 1 && messages[0].type !== 'system') ? (
                            <div style={{
                                padding: '16px 24px 24px',
                                borderTop: '1px solid #373a40',
                                background: '#1a1b1e'
                            }}>
                                <div style={{
                                    maxWidth: '800px',
                                    margin: '0 auto',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        background: '#25262b',
                                        border: '1px solid #373a40',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'border-color 0.2s ease'
                                    }}>
                                        <textarea
                                            placeholder="Ask me anything about design systems..."
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            rows={1}
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#c1c2c5',
                                                fontSize: '16px',
                                                fontFamily: 'inherit',
                                                resize: 'none',
                                                outline: 'none',
                                                padding: '16px 20px',
                                                lineHeight: '1.5',
                                                minHeight: 'auto'
                                            }}
                                            disabled={isLoading}
                                            onFocus={(e) => {
                                                e.target.parentElement.style.borderColor = '#339af0';
                                            }}
                                            onBlur={(e) => {
                                                e.target.parentElement.style.borderColor = '#373a40';
                                            }}
                                        />
                                        <button
                                            onClick={() => sendMessage()}
                                            disabled={!inputValue.trim() || isLoading}
                                            style={{
                                                background: inputValue.trim() && !isLoading
                                                    ? '#339af0'
                                                    : '#373a40',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                margin: '8px',
                                                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                minWidth: '32px',
                                                height: '32px'
                                            }}
                                        >
                                            {isLoading ? (
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    border: '2px solid #ffffff40',
                                                    borderTop: '2px solid #ffffff',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite'
                                                }} />
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{
                                                    color: inputValue.trim() ? 'white' : '#909296'
                                                }}>
                                                    <path
                                                        d="M7 11L12 6L17 11M12 18V7"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        transform="rotate(90 12 12)"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </Container>

                    {/* Footer */}
                    <footer style={{
                        background: '#25262b',
                        borderTop: '1px solid #373a40',
                        padding: '16px 24px',
                        textAlign: 'center',
                        marginTop: 'auto'
                    }}>
                        <Text size="sm" style={{ color: '#6c6f75', fontSize: '13px' }}>
                            Made with ❤️ by{' '}
                            <a
                                href="https://southleft.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#339af0',
                                    textDecoration: 'none',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                                Southleft
                            </a>
                        </Text>
                    </footer>
                </div>
            );
        }

        // Hide loader and render app
        function init() {
            document.getElementById('loader').style.display = 'none';
            const root = createRoot(document.getElementById('root'));
            root.render(
                <MantineProvider defaultColorScheme="dark">
                    <ChatApp />
                </MantineProvider>
            );
        }

        // Initialize when everything is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    </script>

    <style>
        @keyframes thinking {
            0%, 60%, 100% {
                transform: scale(1);
                opacity: 0.3;
            }
            30% {
                transform: scale(1.2);
                opacity: 1;
            }
        }

        /* Custom scrollbar for dark theme */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #25262b;
        }
        ::-webkit-scrollbar-thumb {
            background: #495057;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #5c6370;
        }
    </style>
</body>
</html>
			`, {
				headers: {
					"Content-Type": "text/html",
					"Access-Control-Allow-Origin": "*"
				}
			});
		}

		// Health check endpoint
		if (url.pathname === "/health") {
			return new Response(JSON.stringify({
				status: "ok",
				service: "Design Systems MCP",
				version: "1.0.0"
			}), {
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*"
				}
			});
		}

		return new Response("Design Systems MCP Server - Use /mcp or /ai-chat endpoints", {
			status: 200,
			headers: {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": "*"
			}
		});
	},
};
