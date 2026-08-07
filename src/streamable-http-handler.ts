/**
 * MCP Streamable HTTP Transport Handler
 *
 * Implements MCP Streamable HTTP transport (2025-03-26 spec) for Cloudflare Workers.
 * This replaces the deprecated SSE transport with a modern, stateless approach.
 *
 * Key Features:
 * - Single /mcp endpoint (no separate /sse endpoints)
 * - Stateless session management (no Durable Objects needed)
 * - Optional SSE upgrade for streaming responses
 * - Proper MCP protocol compliance
 *
 * @see https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/
 */

import {
  searchWithSupabase as searchEntries,
} from "./lib/search-handler.js";
import {
  loadEntries,
  SAMPLE_ENTRIES,
} from "./lib/content-manager.js";
import {
  resolveEntriesByCategory,
  resolveAllTags,
} from "./lib/supabase-catalog.js";

// Type definitions
interface Env {
  OPENAI_API_KEY?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  SUPABASE_ANON_KEY?: string;
  VECTOR_SEARCH_ENABLED?: string;
  VECTOR_SEARCH_MODE?: string;
  LOG_SEARCH_PERFORMANCE?: string;
  OPENAI_MODEL?: string;
  AI_SYSTEM_PROMPT?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

// Content loading state
let contentLoaded = false;

async function ensureContentLoaded() {
  if (!contentLoaded) {
    try {
      loadEntries(SAMPLE_ENTRIES);
      console.log('✅ Loaded sample entries for fallback compatibility');
      contentLoaded = true;
    } catch (error) {
      console.error('❌ Failed to load sample entries:', error);
    }
  }
}

/**
 * Main Streamable HTTP request handler
 *
 * Handles MCP protocol requests according to the Streamable HTTP specification:
 * - POST: Process JSON-RPC messages (tools/list, tools/call, etc.)
 * - GET: Optional server-initiated message stream (not implemented yet)
 * - DELETE: Session cleanup (stateless, so just returns success)
 *
 * Sessions are optional and stateless - no Durable Objects needed!
 */
export async function handleStreamableHttp(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Accept, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Handle POST requests (main MCP communication)
    if (request.method === "POST") {
      const sessionId = request.headers.get("Mcp-Session-Id");
      const accept = request.headers.get("Accept") || "";
      const wantsStream = accept.includes("text/event-stream");

      // Parse JSON-RPC message(s)
      const body = await request.json() as any;
      const messages = Array.isArray(body) ? body : [body];

      console.log(`[MCP] Processing ${messages.length} message(s), session=${sessionId || "none"}, stream=${wantsStream}`);

      // Process each message
      const results = [];
      let newSessionId: string | null = null;
      for (const message of messages) {
        console.log(`[MCP] Method: ${message.method}, ID: ${message.id}`);

        // Handle different MCP methods
        if (message.method === "initialize") {
          const origin = new URL(request.url).origin;
          // Echo back the client's requested protocol version when we support it,
          // otherwise fall back to our baseline. Strict clients (e.g. Codex) may
          // reject a response that advertises a version they didn't ask for.
          const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26"];
          const requestedVersion = message.params?.protocolVersion;
          const negotiatedVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
            ? requestedVersion
            : "2025-03-26";
          const result = {
            jsonrpc: "2.0",
            id: message.id,
            result: {
              protocolVersion: negotiatedVersion,
              serverInfo: {
                name: "Design Systems Knowledge Base",
                version: "2.0.0",
                // Icon URLs for Claude Desktop (experimental)
                icon: `${origin}/icon.png`,
                iconUrl: `${origin}/icon.png`,
              },
              capabilities: {
                tools: {}, // Server provides tools
              },
              // Additional icon metadata (experimental)
              icon: `${origin}/icon.png`,
              iconUrl: `${origin}/icon.png`,
              favicon: `${origin}/favicon.ico`,
            },
          };

          // Generate session ID for new sessions; attach it to the final
          // response after the whole batch is processed (an early return here
          // would silently drop any remaining batched messages)
          if (!sessionId && !newSessionId) {
            newSessionId = crypto.randomUUID();
            console.log(`[MCP] Generated new session ID: ${newSessionId}`);
          }

          results.push(result);
        }
        else if (message.method === "notifications/initialized") {
          // No response needed for notifications
          console.log("[MCP] Client initialized notification received");
        }
        else if (message.method === "ping") {
          results.push({
            jsonrpc: "2.0",
            id: message.id,
            result: {},
          });
        }
        else if (message.method === "tools/list") {
          // Return list of available tools
          const tools = [
            {
              name: "search_design_knowledge",
              description: "Search through design system knowledge base entries by query, category, or tags",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query for finding relevant design system knowledge"
                  },
                  category: {
                    type: "string",
                    description: "Filter by category",
                    enum: ["accessibility", "components", "general", "guidelines", "patterns", "quality", "tokens", "tools", "variables"]
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Filter by specific tags"
                  },
                  limit: {
                    type: "number",
                    description: "Maximum number of results to return (default: 15)",
                    default: 15
                  }
                },
                required: ["query"]
              }
            },
            {
              name: "search_chunks",
              description: "Search through specific content chunks for detailed information",
              inputSchema: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query for finding specific content chunks"
                  },
                  limit: {
                    type: "number",
                    description: "Maximum number of chunks to return (default: 8)",
                    default: 8
                  }
                },
                required: ["query"]
              }
            },
            {
              name: "browse_by_category",
              description: "Browse all entries in a specific category",
              inputSchema: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    description: "Category to browse",
                    enum: ["accessibility", "components", "general", "guidelines", "patterns", "quality", "tokens", "tools", "variables"]
                  }
                },
                required: ["category"]
              }
            },
            {
              name: "get_all_tags",
              description: "Get a list of all available tags in the knowledge base",
              inputSchema: {
                type: "object",
                properties: {},
                additionalProperties: false
              }
            }
          ];

          results.push({
            jsonrpc: "2.0",
            id: message.id,
            result: { tools },
          });
        }
        else if (message.method === "tools/call") {
          // Call the tool using manual dispatch
          try {
            const toolName = message.params?.name;
            const args = message.params?.arguments || {};

            console.log(`[MCP] Calling tool: ${toolName}`);

            // Manually execute tool logic based on tool name
            let toolResult;

            if (toolName === "search_design_knowledge") {
              await ensureContentLoaded();
              const searchResults = await searchEntries({
                query: args.query,
                category: args.category,
                tags: args.tags,
                limit: args.limit || 15,
              }, env);

              if (searchResults.length === 0) {
                toolResult = {
                  content: [{
                    type: "text" as const,
                    text: "No design system knowledge found matching your search criteria.",
                  }],
                };
              } else {
                const formattedResults = searchResults.map((entry: any, index: number) =>
                  `**🔍 ${index + 1}. ${entry.title}**\n\n📂 Category: ${entry.metadata.category}\n🏷️ System: ${entry.metadata.system || "N/A"}\n🔖 Tags: ${entry.metadata.tags.join(", ")}\n⭐ Confidence: ${entry.metadata.confidence}\n🔗 Source: [${entry.source?.location || entry.metadata?.source_url || "N/A"}](${entry.source?.location || entry.metadata?.source_url || "#"})\n\n${entry.content.slice(0, 1000)}${entry.content.length > 1000 ? "..." : ""}\n\n---`
                ).join("\n\n");

                toolResult = {
                  content: [{
                    type: "text" as const,
                    text: `Found ${searchResults.length} design system knowledge entries:\n\n${formattedResults}`,
                  }],
                };
              }
            }
            else if (toolName === "search_chunks") {
              await ensureContentLoaded();
              const searchResults = await searchEntries({
                query: args.query,
                limit: args.limit || 8,
              }, env);

              if (searchResults.length === 0) {
                toolResult = {
                  content: [{
                    type: "text" as const,
                    text: "No content chunks found matching your search query.",
                  }],
                };
              } else {
                const formattedResults = searchResults.map((entry: any, index: number) =>
                  `**📄 Chunk ${index + 1}: ${entry.title}**\n\n${entry.content}\n\n🔗 Source: [${entry.source?.location || entry.metadata?.source_url || "N/A"}](${entry.source?.location || entry.metadata?.source_url || "#"})\n\n---`
                ).join("\n\n");

                toolResult = {
                  content: [{
                    type: "text" as const,
                    text: `Found ${searchResults.length} content chunks:\n\n${formattedResults}`,
                  }],
                };
              }
            }
            else if (toolName === "browse_by_category") {
              await ensureContentLoaded();
              const entries = await resolveEntriesByCategory(env, args.category);

              if (entries.length === 0) {
                toolResult = {
                  content: [{
                    type: "text" as const,
                    text: `No entries found in category: ${args.category}`,
                  }],
                };
              } else {
                const formattedEntries = entries.map((entry: any, index: number) =>
                  `${index + 1}. **${entry.title}**\n   Tags: ${entry.metadata.tags.join(", ")}\n   Source: [${entry.source?.location || entry.metadata?.source_url || "Link"}](${entry.source?.location || entry.metadata?.source_url || "#"})`
                ).join("\n");

                toolResult = {
                  content: [{
                    type: "text" as const,
                    text: `**Category: ${args.category}** (${entries.length} entries)\n\n${formattedEntries}`,
                  }],
                };
              }
            }
            else if (toolName === "get_all_tags") {
              await ensureContentLoaded();
              const tags = await resolveAllTags(env);
              const sortedTags = [...tags].sort();

              toolResult = {
                content: [{
                  type: "text" as const,
                  text: `**Available Tags** (${tags.length} total):\n\n${sortedTags.map((tag: string) => `• ${tag}`).join("\n")}`,
                }],
              };
            }
            else {
              throw new Error(`Unknown tool: ${toolName}`);
            }

            results.push({
              jsonrpc: "2.0",
              id: message.id,
              result: toolResult,
            });
          } catch (error: any) {
            console.error("[MCP] Tool call error:", error);
            results.push({
              jsonrpc: "2.0",
              id: message.id,
              error: {
                code: -32603,
                message: error.message || "Tool execution failed",
              },
            });
          }
        }
        else {
          // Unknown method
          results.push({
            jsonrpc: "2.0",
            id: message.id,
            error: {
              code: -32601,
              message: `Method not found: ${message.method}`,
            },
          });
        }
      }

      const responseHeaders: Record<string, string> = {
        ...corsHeaders,
        "Content-Type": "application/json",
      };
      if (newSessionId) {
        responseHeaders["Mcp-Session-Id"] = newSessionId;
      }

      // Notification-only posts produce no results; per spec return 202 Accepted
      if (results.length === 0) {
        return new Response(null, { status: 202, headers: responseHeaders });
      }

      // Return single result or batch
      const responseData = messages.length === 1 ? results[0] : results;

      // Standard JSON response (no streaming needed for simple operations)
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: responseHeaders,
      });
    }

    // Handle GET requests (optional server-initiated SSE stream).
    // This server is stateless and doesn't push server-initiated messages, so
    // per the MCP spec we signal that the optional stream isn't offered with a
    // 405 Method Not Allowed. Returning 401/501 here makes strict clients (e.g.
    // Codex) treat the connection as broken and never call tools/list, so the
    // server appears "connected but with no tools."
    if (request.method === "GET") {
      return new Response("Method Not Allowed: this server does not offer a server-initiated stream", {
        status: 405,
        headers: {
          ...corsHeaders,
          "Allow": "POST, DELETE, OPTIONS",
        },
      });
    }

    // Handle DELETE requests (session cleanup)
    if (request.method === "DELETE") {
      const sessionId = request.headers.get("Mcp-Session-Id");
      console.log(`[MCP] DELETE request for session: ${sessionId || "none"}`);

      // Since we're stateless, just return success
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Method not allowed
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        ...corsHeaders,
        "Allow": "GET, POST, DELETE, OPTIONS",
      },
    });

  } catch (error: any) {
    console.error("[MCP] Request handling error:", error);

    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal server error",
        data: error.message,
      },
      id: null,
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
}
