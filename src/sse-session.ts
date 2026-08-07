/**
 * SSE Session Durable Object - v2 (MCP-Compliant)
 *
 * Handles Server-Sent Events (SSE) connections for MCP protocol.
 * Each Durable Object instance manages SSE sessions with persistent state.
 *
 * This enables Claude Desktop to connect via the "Add custom connector" UI
 * by simply providing the /sse endpoint URL.
 *
 * Version 2: Implements proper MCP SSE event format (event: endpoint/message)
 */

const CODE_VERSION = 'v2-mcp-compliant';

import {
  searchWithSupabase as searchEntries
} from "./lib/search-handler.js";
import {
  resolveEntriesByCategory,
  resolveAllTags
} from "./lib/supabase-catalog.js";
import { formatSourceReference } from "./lib/source-formatter.js";
import type { Category } from "../types/content";
import { validateBearerToken } from "./oauth-handler.js";

interface SessionData {
  writer: WritableStreamDefaultWriter;
  encoder: TextEncoder;
  lastActivity: number;
}

interface Env {
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
}

export class SSESessionV2 {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<string, SessionData> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;

    // Clean up stale sessions every 5 minutes
    this.state.blockConcurrencyWhile(async () => {
      setInterval(() => this.cleanupStaleSessions(), 5 * 60 * 1000);
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // CORS handling
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // OAuth token validation for SSE endpoint
    if (url.pathname.endsWith('/sse') && request.method === 'GET') {
      // Validate Bearer token (accepts all tokens or no token for backwards compatibility)
      if (!validateBearerToken(request)) {
        return new Response(JSON.stringify({
          error: 'unauthorized',
          message: 'Invalid or expired access token'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'WWW-Authenticate': 'Bearer realm="MCP SSE"'
          }
        });
      }

      return this.handleSSEConnection(request);
    }

    // Handle incoming messages (POST /sse/message)
    if (url.pathname.endsWith('/sse/message') && request.method === 'POST') {
      return this.handleMessage(request);
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Establishes SSE connection with the client
   */
  private async handleSSEConnection(request: Request): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    const origin = new URL(request.url).origin;

    // Store session data
    this.sessions.set(sessionId, {
      writer,
      encoder,
      lastActivity: Date.now()
    });

    console.log(`[SSE] New session created: ${sessionId} (${CODE_VERSION})`);

    // Send SSE headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Session-ID': sessionId,
    };

    // Write initial comment synchronously to activate stream immediately
    writer.write(encoder.encode(': connected\n\n')).catch(() => {});

    // Send initial messages and setup heartbeat (non-blocking)
    (async () => {
      try {
        // Send endpoint URL for message posting (MCP spec format: event: endpoint)
        await this.sendSSEEndpoint(sessionId, `${origin}/sse/message?sessionId=${sessionId}`);

        console.log(`[SSE] ${CODE_VERSION} endpoint sent for ${sessionId}, waiting for initialize`);

        // Keep connection alive with periodic heartbeat
        const heartbeatInterval = setInterval(async () => {
          if (!this.sessions.has(sessionId)) {
            clearInterval(heartbeatInterval);
            return;
          }

          try {
            await writer.write(encoder.encode(': heartbeat\n\n'));
            const session = this.sessions.get(sessionId);
            if (session) {
              session.lastActivity = Date.now();
            }
          } catch (error) {
            console.log(`[SSE] Heartbeat failed for ${sessionId}, cleaning up`);
            clearInterval(heartbeatInterval);
            this.sessions.delete(sessionId);
          }
        }, 15000); // 15 second heartbeat

        // Handle client disconnect
        request.signal?.addEventListener('abort', () => {
          console.log(`[SSE] Client disconnected: ${sessionId}`);
          clearInterval(heartbeatInterval);
          this.sessions.delete(sessionId);
          writer.close().catch(() => {});
        });

      } catch (error) {
        console.error(`[SSE] Initialization error for ${sessionId}:`, error);
        this.sessions.delete(sessionId);
        writer.close().catch(() => {});
      }
    })();

    return new Response(readable, { headers });
  }

  /**
   * Handles incoming MCP messages from the client
   */
  private async handleMessage(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId || !this.sessions.has(sessionId)) {
      console.error(`[SSE] Message for unknown session: ${sessionId}`);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Session not found or expired'
        }
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Update session activity
    const session = this.sessions.get(sessionId)!;
    session.lastActivity = Date.now();

    try {
      const body = await request.json() as any;
      console.log(`[SSE] Received message for ${sessionId}:`, body.method || body.id);

      // Process MCP request
      const response = await this.processMCPRequest(body);

      // Send response via SSE (notifications return null — nothing to send)
      if (response !== null) {
        await this.sendSSEMessage(sessionId, response);
      }

      // Return 200 OK (actual response sent via SSE)
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error: any) {
      console.error(`[SSE] Error processing message:`, error);

      // Send error via SSE
      await this.sendSSEMessage(sessionId, {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      });

      return new Response(null, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }

  /**
   * Send a message to the client via SSE
   */
  private async sendSSEMessage(sessionId: string, message: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SSE] Attempted to send message to closed session: ${sessionId}`);
      return;
    }

    try {
      // MCP spec requires: event: message\ndata: {json}\n\n
      const data = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
      await session.writer.write(session.encoder.encode(data));
    } catch (error) {
      console.error(`[SSE] Failed to send message to ${sessionId}:`, error);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Send SSE endpoint event (MCP spec format)
   * Format: event: endpoint\ndata: "URL"\n\n
   */
  private async sendSSEEndpoint(sessionId: string, endpoint: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SSE] Attempted to send endpoint to closed session: ${sessionId}`);
      return;
    }

    try {
      const data = `event: endpoint\ndata: ${JSON.stringify(endpoint)}\n\n`;
      await session.writer.write(session.encoder.encode(data));
    } catch (error) {
      console.error(`[SSE] Failed to send endpoint to ${sessionId}:`, error);
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Process MCP JSON-RPC requests
   */
  private async processMCPRequest(request: any): Promise<any> {
    const { method, id, params } = request;

    try {
      switch (method) {
        case 'initialize':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
                prompts: {}
              },
              serverInfo: {
                name: 'Design Systems Knowledge Base',
                version: '1.0.0'
              }
            }
          };

        case 'notifications/initialized':
          // No response needed for notifications
          return null;

        case 'ping':
          return {
            jsonrpc: '2.0',
            id,
            result: {}
          };

        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: [
                {
                  name: 'search_design_knowledge',
                  description: 'Search through design system knowledge base entries by query, category, or tags',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Search query for finding relevant design system knowledge'
                      },
                      category: {
                        type: 'string',
                        description: 'Filter by category',
                        enum: ['accessibility', 'components', 'general', 'guidelines', 'patterns', 'quality', 'tokens', 'tools', 'variables']
                      },
                      tags: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Filter by specific tags'
                      },
                      limit: {
                        type: 'number',
                        description: 'Maximum number of results to return (default: 15)',
                        default: 15
                      }
                    },
                    required: ['query']
                  }
                },
                {
                  name: 'search_chunks',
                  description: 'Search through specific content chunks for detailed information',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Search query for finding specific content chunks'
                      },
                      limit: {
                        type: 'number',
                        description: 'Maximum number of chunks to return (default: 8)',
                        default: 8
                      }
                    },
                    required: ['query']
                  }
                },
                {
                  name: 'browse_by_category',
                  description: 'Browse all entries in a specific category',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      category: {
                        type: 'string',
                        description: 'Category to browse',
                        enum: ['accessibility', 'components', 'general', 'guidelines', 'patterns', 'quality', 'tokens', 'tools', 'variables']
                      }
                    },
                    required: ['category']
                  }
                },
                {
                  name: 'get_all_tags',
                  description: 'Get a list of all available tags in the knowledge base',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                    additionalProperties: false
                  }
                }
              ]
            }
          };

        case 'tools/call':
          return await this.handleToolCall(id, params);

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`
            }
          };
      }
    } catch (error: any) {
      console.error('[SSE] Error processing MCP request:', error);
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error.message || 'Internal error'
        }
      };
    }
  }

  /**
   * Handle MCP tool calls
   */
  private async handleToolCall(id: any, params: any): Promise<any> {
    const { name, arguments: args } = params;

    try {
      let result;

      switch (name) {
        case 'search_design_knowledge': {
          const searchResults = await searchEntries({
            query: args.query,
            category: args.category as Category | undefined,
            tags: args.tags,
            limit: args.limit || 15,
          }, this.env);

          if (searchResults.length === 0) {
            result = {
              content: [{
                type: 'text',
                text: 'No design system knowledge found matching your search criteria.'
              }]
            };
          } else {
            const formattedResults = searchResults.map((entry, index) => {
              const { displayName, url } = formatSourceReference(entry);
              const sourceLink = url ? `[${displayName}](${url})` : displayName;

              return `**🔍 ${index + 1}. ${entry.title}**

📂 Category: ${entry.metadata.category}
🏷️ System: ${entry.metadata.system || 'N/A'}
🔖 Tags: ${entry.metadata.tags.join(', ')}
⭐ Confidence: ${entry.metadata.confidence}
🔗 Source: ${sourceLink}

${entry.content.slice(0, 1000)}${entry.content.length > 1000 ? '...' : ''}

---`;
            }).join('\n\n');

            result = {
              content: [{
                type: 'text',
                text: `**🔍 FOUND ${searchResults.length} RESULT${searchResults.length === 1 ? '' : 'S'}**

${formattedResults}`
              }]
            };
          }
          break;
        }

        case 'search_chunks': {
          const entries = await searchEntries({
            query: args.query,
            limit: args.limit || 8
          }, this.env);

          const chunkResults: Array<{ entry: any; chunk: any }> = [];
          for (const entry of entries) {
            if (entry.chunks && entry.chunks.length > 0) {
              chunkResults.push({
                entry,
                chunk: entry.chunks[0]
              });
            } else if (entry.content) {
              chunkResults.push({
                entry,
                chunk: {
                  id: 'content-0',
                  text: entry.content.substring(0, 1000),
                  metadata: { section: 'Content', chunkIndex: 0 }
                }
              });
            }
          }

          if (chunkResults.length === 0) {
            result = {
              content: [{
                type: 'text',
                text: 'No specific information found matching your query.'
              }]
            };
          } else {
            const formattedChunks = chunkResults.map((item, index) => {
              const { displayName, url } = formatSourceReference(item.entry);
              const sourceLink = url ? `[${displayName}](${url})` : displayName;

              const cleanText = item.chunk.text
                .replace(/^[-*•]\s*/gm, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

              return `### ${item.chunk.metadata?.section || 'Insight'}
*Source: ${sourceLink}*

${cleanText}

---`;
            }).join('\n\n');

            result = {
              content: [{
                type: 'text',
                text: `**🎯 FOUND ${chunkResults.length} RELEVANT CHUNK${chunkResults.length === 1 ? '' : 'S'}**

${formattedChunks}`
              }]
            };
          }
          break;
        }

        case 'browse_by_category': {
          const categoryEntries = await resolveEntriesByCategory(this.env, args.category as Category);

          if (categoryEntries.length === 0) {
            result = {
              content: [{
                type: 'text',
                text: `No entries found in category: ${args.category}`
              }]
            };
          } else {
            const formattedEntries = categoryEntries.map((entry, index) =>
              `**📋 ${index + 1}. ${entry.title}**
Tags: ${entry.metadata.tags.join(', ')}
System: ${entry.metadata.system || 'N/A'}`
            ).join('\n\n');

            result = {
              content: [{
                type: 'text',
                text: `**📁 ${categoryEntries.length} ENTR${categoryEntries.length === 1 ? 'Y' : 'IES'} IN "${args.category.toUpperCase()}"**

${formattedEntries}`
              }]
            };
          }
          break;
        }

        case 'get_all_tags': {
          const tags = await resolveAllTags(this.env);
          result = {
            content: [{
              type: 'text',
              text: `**🏷️ AVAILABLE TAGS (${tags.length})**

${tags.join(', ')}`
            }]
          };
          break;
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Unknown tool: ${name}`
            }
          };
      }

      return {
        jsonrpc: '2.0',
        id,
        result
      };

    } catch (error: any) {
      console.error(`[SSE] Error executing tool ${name}:`, error);
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: error.message || 'Tool execution failed'
        }
      };
    }
  }

  /**
   * Clean up sessions that haven't had activity in 30 minutes
   */
  private cleanupStaleSessions(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > timeout) {
        console.log(`[SSE] Cleaning up stale session: ${sessionId}`);
        session.writer.close().catch(() => {});
        this.sessions.delete(sessionId);
      }
    }
  }
}
