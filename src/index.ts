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
		// Use dynamic imports which work better in Cloudflare Workers
		const [handbookModule, buttonModule] = await Promise.all([
			import('../content/entries/8zWJWrDK_bTOv3_KFo30V-pdf-designsystemshandbook-pdf.json'),
			import('../content/entries/sample-button-guidelines.json')
		]);

		const actualEntries = [
			handbookModule.default as ContentEntry,
			buttonModule.default as ContentEntry
		];

		loadEntries(actualEntries);

		console.log(`✅ Loaded ${actualEntries.length} content entries from JSON files`);
		console.log(`📚 Entries: ${actualEntries.map(e => e.title).join(', ')}`);

		// Log some chunks to verify content is loaded
		const totalChunks = actualEntries.reduce((sum, entry) => sum + (entry.chunks?.length || 0), 0);
		console.log(`📄 Total chunks loaded: ${totalChunks}`);

		// Log tags for verification
		const { getAllTags } = require('./lib/content-manager');
		const tags = getAllTags();
		console.log(`🏷️  Available tags: ${tags.length} total`);

		return true;
	} catch (error) {
		console.error('❌ Failed to load content from JSON files:', error);
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
	}
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
    <title>AI-Powered Design Systems Chat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: #f5f5f5;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
        }

        .header p {
            opacity: 0.9;
            font-size: 1rem;
        }

        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
            padding: 1rem;
        }

        .messages {
            flex: 1;
            overflow-y: auto;
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            min-height: 400px;
        }

        .message {
            margin-bottom: 1.5rem;
            padding: 1rem;
            border-radius: 12px;
            max-width: 85%;
            line-height: 1.6;
        }

        .message.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin-left: auto;
        }

        .message.assistant {
            background: #f8fafc;
            color: #1f2937;
            border: 1px solid #e5e7eb;
        }

        .message.error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
        }

        .message.system {
            background: #f0f9ff;
            color: #0369a1;
            border: 1px solid #bae6fd;
            font-style: italic;
            text-align: center;
        }

        .message.thinking {
            background: #fffbeb;
            color: #d97706;
            border: 1px solid #fed7aa;
            font-style: italic;
        }

        .input-container {
            display: flex;
            gap: 0.5rem;
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .input-container textarea {
            flex: 1;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 1rem;
            resize: vertical;
            min-height: 50px;
            max-height: 150px;
            font-family: inherit;
        }

        .input-container button {
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            white-space: nowrap;
        }

        .input-container button:hover {
            opacity: 0.9;
        }

        .input-container button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            opacity: 0.7;
        }

        .examples {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .examples h3 {
            margin-bottom: 0.75rem;
            color: #374151;
            font-size: 1.1rem;
        }

        .examples-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 0.5rem;
        }

        .example-item {
            padding: 0.75rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            background: #fafafa;
        }

        .example-item:hover {
            background: #f0f9ff;
            border-color: #0369a1;
        }

        .status {
            text-align: center;
            padding: 0.75rem;
            font-size: 0.875rem;
            color: #6b7280;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 0.5rem;
            background: #10b981;
        }

        .loader {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #f3f3f3;
            border-radius: 50%;
            border-top-color: #667eea;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .thinking-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .thinking-dots {
            display: flex;
            gap: 2px;
        }

        .thinking-dots span {
            width: 4px;
            height: 4px;
            background: #d97706;
            border-radius: 50%;
            animation: thinking 1.5s ease-in-out infinite;
        }

        .thinking-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .thinking-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }

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
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI-Powered Design Systems Assistant</h1>
        <p>Ask me anything about design systems, and I'll search through your knowledge base to provide expert answers</p>
    </div>

    <div class="chat-container">
        <div class="examples">
            <h3>💡 Try asking me about:</h3>
            <div class="examples-grid">
                <div class="example-item" onclick="askQuestion('What are design tokens and how should I use them?')">
                    🎨 What are design tokens and how should I use them?
                </div>
                <div class="example-item" onclick="askQuestion('How do I create accessible button components?')">
                    ♿ How do I create accessible button components?
                </div>
                <div class="example-item" onclick="askQuestion('What causes design debt and how can I reduce it?')">
                    🔧 What causes design debt and how can I reduce it?
                </div>
                <div class="example-item" onclick="askQuestion('What are the best practices for organizing a design system?')">
                    📚 What are the best practices for organizing a design system?
                </div>
                <div class="example-item" onclick="askQuestion('How do components work in design systems?')">
                    🧩 How do components work in design systems?
                </div>
                <div class="example-item" onclick="askQuestion('What categories and tags are available in the knowledge base?')">
                    🏷️ What categories and tags are available in the knowledge base?
                </div>
            </div>
        </div>

        <div class="messages" id="messages">
            <div class="message system">
                🎯 Welcome! I'm your AI design systems assistant. I can search through your design systems knowledge base and provide expert answers.
                <br><br>
                💡 Ask me anything about design systems, components, tokens, or best practices!
            </div>
        </div>

        <div class="input-container">
            <textarea
                id="messageInput"
                placeholder="Ask me anything about design systems..."
                onkeydown="handleKeyPress(event)"
            ></textarea>
            <button onclick="sendMessage()" id="sendButton">Send</button>
        </div>

        <div class="status" id="status">
            <span class="status-indicator"></span>
            Ready to chat • MCP Server: Connected ✅
        </div>
    </div>

         <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
     <script>
         function addMessage(type, content) {
             const messagesDiv = document.getElementById('messages');
             const messageDiv = document.createElement('div');
             messageDiv.className = \`message \${type}\`;

             // Render markdown for assistant messages
             if (type === 'assistant') {
                 messageDiv.innerHTML = marked.parse(content);
             } else {
                 messageDiv.innerHTML = content;
             }

             messagesDiv.appendChild(messageDiv);
             messagesDiv.scrollTop = messagesDiv.scrollHeight;
         }

        function askQuestion(question) {
            document.getElementById('messageInput').value = question;
            sendMessage();
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }

        async function sendMessage() {
            const input = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            const message = input.value.trim();

            if (!message) return;

            addMessage('user', message);
            input.value = '';

            sendButton.disabled = true;
            sendButton.innerHTML = '<span class="loader"></span> Thinking...';

            addMessage('thinking', \`<div class="thinking-indicator">
                <div class="thinking-dots"><span></span><span></span><span></span></div>
                Analyzing your question and searching the knowledge base...
            </div>\`);

            try {
                const response = await fetch('/ai-chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message
                    })
                });

                const thinkingMessage = document.querySelector('.message.thinking:last-of-type');
                if (thinkingMessage) {
                    thinkingMessage.remove();
                }

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
                const thinkingMessage = document.querySelector('.message.thinking:last-of-type');
                if (thinkingMessage) {
                    thinkingMessage.remove();
                }

                addMessage('error', \`❌ Error: \${error.message}. Make sure the MCP server is running and OpenAI API key is configured.\`);
            } finally {
                sendButton.disabled = false;
                sendButton.textContent = 'Send';
            }
        }
    </script>
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
