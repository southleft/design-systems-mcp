import {
  loadEntries,
  SAMPLE_ENTRIES
} from "./lib/content-manager.js";
import {
  resolveEntriesByCategory,
  resolveAllTags
} from "./lib/supabase-catalog.js";
import {
  searchWithSupabase as searchEntries,
  resultsContainAPGContent,
  getAccessibilityGuidanceDisclaimer
} from "./lib/search-handler.js";
import { formatSourceReference } from "./lib/source-formatter.js";
import { formatReliabilityBadge, requiresAccessibilityCaveats } from "./lib/source-authority.js";
import { type Category } from "../types/content";

// OpenAI integration
import { OpenAI } from "openai";

// Export SSE Session Durable Object (V2 with MCP-compliant event format)
export { SSESessionV2, SSESessionV2 as SSESession } from "./sse-session.js";

// OAuth handler imports (flow endpoints kept for backward compatibility;
// discovery is no longer advertised — see the /.well-known handling below)
import {
  handleAuthorizeRequest,
  processTokenRequest
} from "./oauth-handler.js";

// Streamable HTTP handler (MCP 2025-03-26 spec)
import { handleStreamableHttp } from "./streamable-http-handler.js";

// Supabase Vector Search Mode - No file loading needed
console.log('🚀 MCP Server with Supabase Vector Search');

async function loadActualContent() {
  // Vector search mode - data is in Supabase
  // Load sample entries for fallback tools that still need file-based data
  try {
    loadEntries(SAMPLE_ENTRIES);
    console.log('✅ Loaded sample entries for fallback compatibility');
    return true;
  } catch (error) {
    console.error('❌ Failed to load sample entries:', error);
    return false;
  }
}

// Content will be loaded lazily when first tool is called
let contentLoaded = false;

async function ensureContentLoaded() {
  if (!contentLoaded) {
    await loadActualContent();
    contentLoaded = true;
  }
}

// Store env for tool handlers to access
let requestEnv: any = null;

function setEnv(env: any) {
  requestEnv = env;
}

// Utility function to detect resource limit errors
function isResourceLimitError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorStack = error?.stack?.toLowerCase() || '';

  // Common patterns indicating resource limits
  const resourceLimitPatterns = [
    'exceeded',
    'resource limit',
    'cpu time limit',
    'memory limit',
    'execution time',
    'timeout',
    'worker exceeded',
    'script execution time',
    'memory usage',
    'out of memory',
    'maximum execution time'
  ];

  return resourceLimitPatterns.some(pattern =>
    errorMessage.includes(pattern) || errorStack.includes(pattern)
  );
}

// Utility function to create a helpful resource limit error message
function createResourceLimitErrorMessage(): string {
  return `🚫 **Cloudflare Worker Resource Limit Exceeded**

The MCP server has hit Cloudflare Workers resource limits (CPU time, memory, or execution time). This is unusual on the paid plan but can happen with:

• Extremely complex queries requiring extensive processing
• Multiple concurrent requests
• Very large search operations

**Immediate Solutions:**
1. Try breaking complex questions into smaller parts
2. Wait a moment and retry your request
3. Contact the administrator if this persists

**Technical Details:**
• Current setup: Paid plan with enhanced resources (50ms CPU time)
• Full knowledge base: Active (113 entries + 2192 chunks)
• Optimization: Paid plan optimized for comprehensive responses

This is a rare occurrence on the paid tier - please retry your request.`;
}

// AI System Prompt
const AI_SYSTEM_PROMPT = `You are a knowledgeable design systems expert with access to a comprehensive design systems knowledge base.

🚨🚨🚨 ABSOLUTE CRITICAL RULE - VIOLATION WILL BREAK THE SYSTEM 🚨🚨🚨

YOU MUST FOLLOW THIS SECTION ASSIGNMENT EXACTLY:

1. "📚 From the Knowledge Base" section:
   - PUT HERE: Everything from search_chunks and search_design_knowledge tools
   - PUT HERE: All content with citations like [Design System Glossary]
   - PUT HERE: All content with source links
   - NEVER PUT HERE: Your general AI knowledge

2. "🧠 From General Knowledge" section:
   - PUT HERE: Only your AI training data
   - PUT HERE: General best practices you know
   - NEVER PUT HERE: Any MCP search results
   - NEVER PUT HERE: Any citations or source links

IF YOU PUT CITATIONS IN GENERAL KNOWLEDGE, THE SYSTEM BREAKS.
IF YOU PUT MCP RESULTS IN GENERAL KNOWLEDGE, THE SYSTEM BREAKS.

⚠️⚠️⚠️ CRITICAL SECTION ASSIGNMENT ⚠️⚠️⚠️
• Knowledge Base section = MCP search results WITH citations
• General Knowledge section = Your AI training WITHOUT citations
• NEVER put citations in General Knowledge
• NEVER put uncited content in Knowledge Base
• If you're citing [Design System Glossary] or any source → Knowledge Base ONLY

CRITICAL SEARCH REQUIREMENT:
⚠️ You MUST search the knowledge base before claiming any content doesn't exist.
⚠️ NEVER say "there is no content about X" without first searching for:
   - The exact term (e.g., "slots")
   - Variations (e.g., "slot", "slot-based")
   - Related concepts (e.g., "content projection", "placeholder")

RESPONSE STRUCTURE (REQUIRED):
Always structure your response with these two sections in this exact order:

## 📚 From the Knowledge Base
[CRITICAL: This section MUST contain ONLY the results from your MCP tool searches (search_chunks and search_design_knowledge). Include ALL relevant information found from your searches with proper citations and source links. This is where the curated design systems content goes.

⚠️ NEVER PUT GENERAL AI KNOWLEDGE HERE - ONLY MCP SEARCH RESULTS

✅ COMPREHENSIVE RESPONSE REQUIREMENTS:
• Extract and present EVERY relevant detail from search results
• Include specific examples, code snippets, and practical guidance when available
• Explain concepts thoroughly with context and real-world applications
• **CITE ALL SOURCES INLINE** - This is MANDATORY for every piece of information from search results
• Aim for 800-2000 words in this section for typical queries
• This is specialized, curated content - make it COUNT
• The design systems community expects professional-grade depth
• Don't summarize - EXPAND on the knowledge base content with full detail

📝 CITATION FORMAT (REQUIRED FOR EVERY SOURCE):
• Use inline citations in markdown link format: [Source Name](url)
• Example: "According to [Material Design System](https://material.io), components should..."
• Example: "As explained in [Laying the Foundations](https://designsystem.digital.gov/), design tokens..."
• Place citations naturally within sentences, not just at the end of paragraphs
• EVERY fact, example, or guidance from search results MUST have a citation
• If you mention a design system or source, link to it IMMEDIATELY

🚨🚨🚨 CRITICAL: URL EXTRACTION FROM SEARCH RESULTS 🚨🚨🚨

Search results contain HTML links in this format:
<a href="https://real-url.com/page" target="_blank">Source Name</a>

YOU MUST:
1. **EXTRACT THE REAL URL** from the href attribute in the search result HTML
2. **USE THAT EXACT URL** in your markdown citation: [Source Name](https://real-url.com/page)
3. **NEVER INVENT URLs** - If you see a link in search results, extract its href value
4. **PARSE THE HTML** - Look for <a href="..."> patterns and extract the URL between quotes

🚨 ABSOLUTELY FORBIDDEN:
• ❌ NEVER use example.com URLs
• ❌ NEVER use placeholder.com URLs
• ❌ NEVER make up or guess URLs
• ❌ NEVER use https://example.com/anything

✅ CORRECT APPROACH:
Search result shows: <a href="https://carbondesignsystem.com" target="_blank">Carbon Design System</a>
Your citation: [Carbon Design System](https://carbondesignsystem.com)

✅ IF NO URL IN SEARCH RESULT:
If search result shows just plain text "Source Name" without a link, cite WITHOUT a link:
"According to Source Name" (not "According to [Source Name](fake-url)")

THIS IS CRITICAL - FAKE URLs BREAK THE ENTIRE SYSTEM]

## 🧠 From General Knowledge
[CRITICAL: This section MUST contain ONLY your built-in training knowledge - NOT MCP search results. Add complementary context that supplements the rich Knowledge Base content above. This section should provide general industry best practices and contextual information.

⚠️ NEVER PUT MCP SEARCH RESULTS, CITATIONS, OR SOURCE LINKS HERE - ONLY YOUR TRAINING DATA
✅ Target 300-500 words for this section - substantive but still secondary to Knowledge Base
✅ Focus on general principles, industry context, and complementary insights
✅ This adds value but doesn't overshadow the specialized Knowledge Base content above]

SEARCH STRATEGY:
1. 🚨 PRIMARY TOOL: ALWAYS use search_design_knowledge FIRST - this searches the full production database with 104 design systems entries (default limit: 20)
2. OPTIONAL: Use search_chunks for additional detailed snippets if needed (default limit: 12)
3. **USE MULTIPLE SEARCH QUERIES** for comprehensive coverage:
   - Search for the main concept (e.g., "design systems fundamentals")
   - Search for related terms (e.g., "design system getting started", "design language basics")
   - Search for specific aspects (e.g., "design tokens", "component library")
4. **VARY YOUR SEARCH TERMS** - Don't rely on a single search:
   - If user asks "how to get started", search: "getting started", "introduction", "fundamentals", "basics", "guide"
   - If results seem narrow, broaden or narrow your search terms
5. The knowledge base includes extensive glossaries with definitions - check these
6. **INCREASE LIMITS for broad queries**: Use limit: 20 for search_chunks when topic is general
7. Search diversity is enabled - you'll get results from multiple sources automatically

SECTION ASSIGNMENT RULES (ABSOLUTELY CRITICAL - NEVER VIOLATE):
• MCP tool results (search_chunks, search_design_knowledge) → "📚 From the Knowledge Base" section ONLY
• Your training knowledge → "🧠 From General Knowledge" section ONLY
• Citations like [Design System Glossary], [Laying the Foundations] → Knowledge Base section ONLY
• Source links and references → Knowledge Base section ONLY
• Generic best practices without citations → General Knowledge section ONLY
• NEVER mix MCP results with training knowledge in the same section
• If you cite a source, it MUST be in the Knowledge Base section
• If it comes from a search result, it MUST be in the Knowledge Base section

FORMATTING GUIDELINES:
• Use natural paragraphs for explanations
• **PREFER BULLET LISTS** over numbered lists unless order/sequence truly matters
• Only use numbered lists (1, 2, 3) for: sequential steps, rankings, or ordered instructions
• Use bullet lists (•) for: features, benefits, characteristics, examples, or unordered items
• **AVOID NESTED NUMBERED LISTS** - if nesting is needed, use bullets for nested items
• **CITE SOURCES INLINE** - MANDATORY: [Source Name](url) format
• Citations must appear throughout the text, not just at the end
• Every search result mentioned must have an inline citation with working link
• Example: "The [Carbon Design System](https://carbondesignsystem.com) recommends..."

LIST FORMATTING RULES:
✅ CORRECT - Bullet list for features:
• Design tokens provide consistency
• Components are reusable
• Guidelines ensure accessibility

❌ INCORRECT - Don't use numbered list unless order matters:
1. Design tokens provide consistency
2. Components are reusable
3. Guidelines ensure accessibility

IMPORTANT: The knowledge base contains multiple glossaries with extensive definitions of design system terms. Always search thoroughly before claiming information doesn't exist.

SOURCE RELIABILITY AWARENESS:
Search results include source reliability indicators. When presenting information, be aware of these levels:
• 🥇 Gold Standard (WCAG, HTML Living Standard) - Definitive specifications, highly reliable
• ✅ Authoritative (Inclusive Components, GOV.UK Design System, Deque) - Extensively tested, production-ready
• 📚 Reference (APG/ARIA Patterns) - Educational reference, NOT production-ready accessibility solutions
• 💡 Example (Material Design, Carbon, etc.) - Organization-specific implementations
• 👥 Community - Blog posts, tutorials - verify before implementing

⚠️ CRITICAL ACCESSIBILITY GUIDANCE:
When results include ARIA Authoring Practices Guide (APG) content:
1. ALWAYS note that APG demonstrates ARIA usage, NOT complete accessibility solutions
2. ALWAYS recommend semantic HTML first (button, select, input) over ARIA implementations
3. ALWAYS recommend testing with real assistive technology (NVDA, JAWS, VoiceOver)
4. Reference authoritative alternatives: Inclusive Components, GOV.UK Design System, Deque University
5. The first rule of ARIA is: "Don't use ARIA" - prefer native HTML semantics`;

// Available MCP tools for the AI
const MCP_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_design_knowledge",
      description: "Search the design systems knowledge base for general information. Results include source reliability indicators (Gold Standard, Authoritative, Reference, Example, Community).",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for design system knowledge"
          },
          category: {
            type: "string",
            enum: ["accessibility", "components", "general", "guidelines", "patterns", "quality", "tokens", "tools", "variables"],
            description: "Filter by category (optional)"
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default: 20, paid plan optimized)"
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
            description: "Maximum number of chunks (default: 12, paid plan optimized)"
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
            enum: ["accessibility", "components", "general", "guidelines", "patterns", "quality", "tokens", "tools", "variables"],
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
async function callMcpTool(toolName: string, args: any, env?: any): Promise<string> {
  // Ensure content is loaded before any tool call
  await ensureContentLoaded();

  // Log which tool is being called to diagnose search issues
  console.log(`[Tool Call] ${toolName} with args:`, JSON.stringify(args).substring(0, 100));

  switch (toolName) {
    case "search_design_knowledge": {
      const searchResults = await searchEntries({
        query: args.query,
        category: args.category as Category | undefined,
        limit: args.limit || 20,
      }, env);

      if (searchResults.length === 0) {
        return "No design system knowledge found matching your search criteria.";
      }

      // Check if results contain APG content that needs disclaimers
      const hasAPGContent = resultsContainAPGContent(searchResults);

      const formattedResults = searchResults.map((entry, index) => {
        const { displayName, url } = formatSourceReference(entry);
        const sourceLink = url
          ? `<a href="${url}" target="_blank">${displayName}</a>`
          : displayName;

        // Get reliability badge
        const reliabilityBadge = entry.metadata.reliabilityBadge ||
          formatReliabilityBadge(entry.metadata.reliability?.level || 'community');

        // Check if this specific entry needs a caveat
        const sourceLocation = entry.source?.location || entry.metadata?.source_url || '';
        const needsCaveat = requiresAccessibilityCaveats(sourceLocation);
        const caveatNote = needsCaveat
          ? `\n<em style="color: #f59f00;">⚠️ Note: ${entry.metadata.importantNote || 'This is a reference implementation. Prefer semantic HTML and test with assistive technology.'}</em>`
          : '';

        return `<strong>🔍 ${index + 1}. ${entry.title}</strong>

<em>📂 Category:</em> ${entry.metadata.category}
<em>🏷️ System:</em> ${entry.metadata.system || "N/A"}
<em>🔖 Tags:</em> ${entry.metadata.tags.join(", ")}
<em>⭐ Confidence:</em> ${entry.metadata.confidence}
<em>📊 Source Type:</em> ${reliabilityBadge}
<em>🔗 Source:</em> ${sourceLink}${caveatNote}

${entry.content.slice(0, 1000)}${entry.content.length > 1000 ? "..." : ""}

<hr style="border: none; border-top: 1px solid #373a40; margin: 16px 0;">`;
      }).join("\n\n");

      // Add accessibility guidance disclaimer if APG content is present
      const accessibilityDisclaimer = hasAPGContent
        ? `\n\n<div style="background: #2d2000; border: 1px solid #f59f00; border-radius: 8px; padding: 16px; margin-top: 16px;">
<strong style="color: #f59f00;">⚠️ Accessibility Implementation Note</strong>
<p style="margin: 8px 0; color: #c1c2c5;">Some results reference ARIA Authoring Practices Guide (APG). Remember:</p>
<ul style="margin: 8px 0; color: #c1c2c5;">
<li><strong>Prefer semantic HTML</strong> - Native elements like &lt;button&gt;, &lt;select&gt;, &lt;input&gt; are already accessible</li>
<li><strong>APG demonstrates ARIA usage</strong>, not complete accessibility solutions</li>
<li><strong>Test with assistive technology</strong> (NVDA, JAWS, VoiceOver) before production</li>
</ul>
<p style="margin: 8px 0; color: #909296;"><em>See also: <a href="https://inclusive-components.design/" target="_blank">Inclusive Components</a>, <a href="https://design-system.service.gov.uk/" target="_blank">GOV.UK Design System</a></em></p>
</div>`
        : '';

      return `FOUND ${searchResults.length} RESULT${searchResults.length === 1 ? "" : "S"}:

${formattedResults}${accessibilityDisclaimer}`;
    }

    case "browse_by_category": {
      const categoryEntries = await resolveEntriesByCategory(env, args.category as Category);

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
    }

    case "get_all_tags": {
      const tags = await resolveAllTags(env);
      return `AVAILABLE TAGS (${tags.length}): ${tags.join(", ")}`;
    }



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

    // Reject missing/oversized input before spending OpenAI budget on it
    const MAX_MESSAGE_LENGTH = 4000;
    if (typeof message !== "string" || message.trim().length === 0 || message.length > MAX_MESSAGE_LENGTH) {
      return new Response(JSON.stringify({
        error: `Message must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters.`
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get OpenAI config from environment variables
    const apiKey = env?.OPENAI_API_KEY;
    const model = env?.OPENAI_MODEL || "gpt-4o";

    // Validate model name (include GPT-5 models)
    const validModels = ['gpt-5-nano', 'gpt-5', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    // Only warn if model doesn't match any known pattern
    if (!validModels.some(m => model.includes(m)) && !model.includes('gpt')) {
      console.warn(`[AI Chat] Unknown model "${model}" specified, proceeding anyway`);
    }

    // Log the model being used (only in development)
    if (env?.LOG_SEARCH_PERFORMANCE === 'true') {
      console.log(`[AI Chat] Using OpenAI model: ${model}`);
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize OpenAI (timeout guards against a stalled upstream holding
    // the request open until Cloudflare's wall-clock limit kills it)
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 60_000,
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
      max_completion_tokens: 16000,  // Increased for comprehensive, detailed responses (gpt-4o supports up to 16384)
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

      // Execute all tool calls in parallel (preserves input order in results)
      const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
          try {
            const content = await callMcpTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments),
              env
            );
            return { role: "tool" as const, tool_call_id: toolCall.id, content };
          } catch (error: any) {
            return { role: "tool" as const, tool_call_id: toolCall.id, content: `Error: ${error.message}` };
          }
        })
      );
      for (const r of toolResults) messages.push(r);

      // Stream the final synthesis response
      const stream = await openai.chat.completions.create({
        model: model,
        messages: messages,
        max_completion_tokens: 16000,
        stream: true,
      });

      const encoder = new TextEncoder();
      let fullText = '';
      const streamStart = Date.now();
      let serverChunkCount = 0;
      const body = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const piece = chunk.choices[0]?.delta?.content || '';
              if (piece) {
                fullText += piece;
                serverChunkCount++;
                // SSE format: data: <json>\n\n  (proxies don't buffer SSE)
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: piece })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            if (env?.LOG_SEARCH_PERFORMANCE === 'true') {
              console.log(`[stream] ${serverChunkCount} chunks, ${fullText.length} chars in ${Date.now() - streamStart}ms`);
            }
            // Post-stream validation (console-only)
            const gk = fullText.match(/## 🧠 From General Knowledge[\s\S]*$/);
            if (gk && /\[[^\]]+\]/.test(gk[0])) {
              console.error('[Validation] VIOLATION: Citations in General Knowledge section');
            }
            const kb = fullText.match(/## 📚 From the Knowledge Base[\s\S]*?(?=## 🧠|$)/);
            if (kb && kb[0].replace(/## 📚 From the Knowledge Base/, '').trim().length < 100 && !kb[0].includes('no content found')) {
              console.error('[Validation] WARNING: Knowledge Base section too short');
            }
            controller.close();
          } catch (err: any) {
            console.error('[AI Chat] Stream error:', err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: `\n\n❌ ${err?.message || 'Stream error'}` })}\n\n`));
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-store, no-transform",
          "X-Accel-Buffering": "no",
          "X-Content-Type-Options": "nosniff",
          "Connection": "keep-alive",
        }
      });
    }

    // No tool calls — emit the direct answer as a single SSE message
    const directEncoder = new TextEncoder();
    const directBody = new ReadableStream({
      start(controller) {
        controller.enqueue(directEncoder.encode(`data: ${JSON.stringify({ t: response.content || '' })}\n\n`));
        controller.enqueue(directEncoder.encode(`event: done\ndata: {}\n\n`));
        controller.close();
      }
    });
    return new Response(directBody, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, no-transform",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
        "Connection": "keep-alive",
      }
    });

  } catch (error: any) {
    console.error("AI Chat Error:", error);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (isResourceLimitError(error)) {
      return new Response(JSON.stringify({
        error: createResourceLimitErrorMessage()
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      error: error.message || "An error occurred while processing your request"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}


export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const origin = url.origin;

    // OAuth discovery: intentionally NOT served.
    //
    // This is a public, no-authentication MCP server. Serving
    // /.well-known/oauth-protected-resource (or -authorization-server) tells
    // spec-strict clients "this server is an OAuth-protected resource, go
    // authenticate." But we only ever implemented an anonymous auto-approve
    // flow with no dynamic client registration (RFC 7591), so such a client
    // (e.g. Codex) can discover that auth is "required" yet has no way to
    // complete it — it then reports "Auth: Unsupported", shows a dead
    // Authenticate button, and never lists the tools. Returning 404 here makes
    // the server present as no-auth, so clients connect directly to the tools.
    if (url.pathname === "/.well-known/oauth-authorization-server" ||
        url.pathname === "/.well-known/oauth-authorization-server/sse" ||
        url.pathname === "/.well-known/oauth-protected-resource" ||
        url.pathname === "/.well-known/oauth-protected-resource/sse") {
      return new Response("Not Found", {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Dynamic Client Registration (RFC 7591): also intentionally NOT served.
    //
    // 404-ing discovery alone was not enough. When discovery fails, clients
    // fall back to the conventional endpoint locations, and the catch-all at
    // the bottom of this handler used to answer *everything* with 200 plus a
    // line of plain text. Claude's connector POSTed /register, got a 200, tried
    // to parse a client registration response out of "Design Systems MCP
    // Server - Use /mcp or /ai-chat endpoints", and reported "Couldn't register
    // with Design Systems Assistant's sign-in service" — a registration
    // failure, on a server that has no registration to offer.
    //
    // An explicit 404 says "there is no registration here", which is what lets
    // a client fall through to connecting anonymously.
    if (url.pathname === "/register" || url.pathname === "/oauth/register") {
      return new Response("Not Found", {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // OAuth Authorization Endpoint
    if (url.pathname === "/oauth/authorize") {
      return handleAuthorizeRequest(url, origin);
    }

    // OAuth Token Endpoint
    if (url.pathname === "/oauth/token") {
      if (request.method === 'POST') {
        const formData = await request.formData();
        return await processTokenRequest(formData);
      }
      return new Response('Method not allowed', { status: 405 });
    }

    // SSE endpoint for Claude Desktop "Add custom connector" UI
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      // Use versioned name to force new instances after code changes
      const id = env.SSE_SESSION.idFromName("mcp-session-v2");
      const stub = env.SSE_SESSION.get(id);
      return stub.fetch(request);
    }

    // MCP Streamable HTTP endpoint (NEW - recommended transport)
    if (url.pathname === "/mcp") {
      console.log('[Router] Using Streamable HTTP handler for /mcp');
      return handleStreamableHttp(request, env, ctx);
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
    <meta name="description" content="MCP (Model Context Protocol) server with specialized design systems knowledge. Search through hundreds of curated resources to get expert answers about components, tokens, patterns, and best practices.">

    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="512x512" href="/icon.png">
    <link rel="apple-touch-icon" href="/icon.png">

    <!-- Open Graph / Social Media Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="Design Systems Assistant - AI-Powered Knowledge Base">
    <meta property="og:description" content="MCP server with specialized design systems knowledge. Search through hundreds of curated resources to get expert answers about components, tokens, patterns, and best practices.">
    <meta property="og:url" content="https://design-systems-mcp.southleft.com">
    <meta property="og:image" content="https://design-systems-mcp.southleft.com/og-image.png">
    <meta property="og:image:width" content="900">
    <meta property="og:image:height" content="630">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Design Systems Assistant">
    <meta name="twitter:description" content="MCP server with specialized design systems knowledge and curated resources">
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
            background: #1a1b1e;
            color: #c1c2c5;
        }
        #root {
            min-height: 100vh;
            background: #1a1b1e;
            display: flex;
            flex-direction: column;
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

    <!-- Lucide Icons (pinned to 0.x; "latest" rolls forward and has burned us before) -->
    <script src="https://unpkg.com/lucide@0"></script>

    <!-- Babel Standalone for JSX
         Pinned to v7: v8.0.2 (unpkg "latest" as of 2026-06) emits ESM output by
         default and breaks the inline <script type="text/babel"> bootstrap with
         "Cannot use import statement outside a module". -->
    <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>

    <!-- Marked for markdown parsing - preload for better performance -->
    <link rel="preload" href="https://cdn.jsdelivr.net/npm/marked@14/marked.min.js" as="script">
    <script src="https://cdn.jsdelivr.net/npm/marked@14/marked.min.js"></script>
    <!-- DOMPurify sanitizes rendered markdown before it is injected into the DOM.
         Assistant output can echo HTML from ingested third-party pages, so it
         must never reach dangerouslySetInnerHTML unsanitized. -->
    <script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>

    <script type="text/babel">
        // Configure marked for better rendering
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: false,
            mangle: false
        });

        const { useState, useEffect, useRef } = React;
        const { createRoot, flushSync } = ReactDOM;

        // Set dark theme on document immediately (not in useEffect)
        document.documentElement.setAttribute('data-color-scheme', 'dark');

        const Container = ({ children, size = 'lg', style = {} }) => (
            <div style={{
                maxWidth: size === 'lg' ? '900px' : '100%',
                margin: '0 auto',
                padding: '0 16px',
                width: '100%',
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
                    {loading && (
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTop: '2px solid rgba(255, 255, 255, 0.9)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginRight: children ? '8px' : '0'
                        }} />
                    )}
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

        // Icon Component using Lucide
        function Icon({ name, size = 16, color = 'currentColor', style = {} }) {
            const iconRef = useRef(null);

            useEffect(() => {
                if (iconRef.current && window.lucide) {
                    // Use Lucide's createIcons function to replace the i element
                    window.lucide.createIcons({
                        icons: window.lucide.icons,
                        attrs: {
                            'stroke-width': 2,
                            width: size,
                            height: size
                        }
                    });
                }
            }, [name, size]);

            return (
                <i
                    ref={iconRef}
                    data-lucide={name}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color,
                        ...style
                    }}
                />
            );
        }

        // Example questions data
        const EXAMPLE_QUESTIONS = [
            { icon: 'help-circle', text: 'Overview' },
            { icon: 'rocket', text: 'Getting Started' },
            { icon: 'palette', text: 'Theming' },
            { icon: 'coins', text: 'Tokens' },
            { icon: 'handshake', text: 'Adoption' }
        ];


        // Chat App Component
        function ChatApp() {
            const [messages, setMessages] = useState([{
                type: 'system',
                content: 'Welcome! I\\'m your AI design systems assistant. I can search through your design systems knowledge base and provide expert answers.\\n\\nAsk me anything about design systems, components, tokens, or best practices!'
            }]);
            const [inputValue, setInputValue] = useState('');
            const [isLoading, setIsLoading] = useState(false);
            const messagesEndRef = useRef(null);
            const textareaRef = useRef(null);
            const textareaRef2 = useRef(null);
            const lastScrolledIdRef = useRef(null);
            const abortRef = useRef(null);

            // Reset the chat back to the empty welcome state.
            // Aborts any in-flight response so we don't append to a fresh session.
            const startNewChat = () => {
                abortRef.current?.abort();
                setMessages([{
                    type: 'system',
                    content: 'Welcome! I\\'m your AI design systems assistant.'
                }]);
                setInputValue('');
                setIsLoading(false);
                lastScrolledIdRef.current = null;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            // Set dark theme on document
            useEffect(() => {
                document.documentElement.setAttribute('data-color-scheme', 'dark');
            }, []);

            // Scroll a newly-arrived message into view ONCE at its top.
            // Skipped during streaming content updates (same id) so the scroll
            // doesn't bounce as text fills in below.
            useEffect(() => {
                const visible = messages.filter(m => m.type !== 'system' && m.type !== 'thinking');
                const lastMsg = visible[visible.length - 1];
                if (!lastMsg || lastMsg.id === lastScrolledIdRef.current) return;
                lastScrolledIdRef.current = lastMsg.id;
                const el = document.querySelector(\`[data-msg-id="\${lastMsg.id}"]\`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, [messages]);

            // Auto-resize textareas
            const autoResizeTextarea = (textarea) => {
                if (textarea) {
                    textarea.style.height = 'auto';
                    const newHeight = Math.min(textarea.scrollHeight, 200);
                    textarea.style.height = newHeight + 'px';
                }
            };

            useEffect(() => {
                autoResizeTextarea(textareaRef.current);
                autoResizeTextarea(textareaRef2.current);
            }, [inputValue]);

            // Add input handler for real-time resizing
            const handleTextareaInput = (e) => {
                setInputValue(e.target.value);
                autoResizeTextarea(e.target);
            };

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

                abortRef.current = new AbortController();
                const signal = abortRef.current.signal;

                try {
                    const response = await fetch('/ai-chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message }),
                        signal
                    });

                    const contentType = response.headers.get('content-type') || '';

                    // Error path: JSON body (or no body)
                    if (!response.ok || contentType.includes('application/json')) {
                        setMessages(prev => prev.filter(msg => msg.type !== 'thinking'));
                        let errMsg = \`HTTP \${response.status}: \${response.statusText}\`;
                        try {
                            const data = await response.json();
                            if (data.error) errMsg = data.error;
                        } catch (_) { /* ignore parse failure */ }
                        addMessage('error', \`❌ \${errMsg}\`);
                        return;
                    }

                    // Streaming SSE path
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    const assistantId = Date.now();
                    const streamStart = performance.now();
                    let buffer = '';
                    let accumulated = '';
                    let firstChunk = true;
                    let eventCount = 0;
                    let networkChunks = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        networkChunks++;
                        buffer += decoder.decode(value, { stream: true });

                        // SSE messages are separated by \\n\\n
                        let sepIdx;
                        while ((sepIdx = buffer.indexOf('\\n\\n')) !== -1) {
                            const raw = buffer.slice(0, sepIdx);
                            buffer = buffer.slice(sepIdx + 2);
                            if (!raw.trim()) continue;
                            // Skip the terminal 'event: done' marker
                            if (raw.startsWith('event: done')) continue;
                            const dataLine = raw.split('\\n').find(l => l.startsWith('data: '));
                            if (!dataLine) continue;
                            try {
                                const payload = JSON.parse(dataLine.slice(6));
                                if (payload.t) {
                                    accumulated += payload.t;
                                    eventCount++;
                                    if (firstChunk) {
                                        firstChunk = false;
                                        flushSync(() => {
                                            setMessages(prev => [
                                                ...prev.filter(m => m.type !== 'thinking'),
                                                { type: 'assistant', content: accumulated, id: assistantId }
                                            ]);
                                        });
                                    } else {
                                        flushSync(() => {
                                            setMessages(prev => prev.map(m =>
                                                m.id === assistantId ? { ...m, content: accumulated } : m
                                            ));
                                        });
                                    }
                                }
                            } catch (parseErr) {
                                console.warn('[chat-stream] failed to parse SSE event:', raw, parseErr);
                            }
                        }
                    }
                    console.log(\`[chat-stream] done: \${networkChunks} net chunks, \${eventCount} SSE events, \${accumulated.length} chars in \${((performance.now() - streamStart)/1000).toFixed(1)}s\`);

                    // If the stream produced no content at all
                    if (firstChunk) {
                        setMessages(prev => prev.filter(msg => msg.type !== 'thinking'));
                        addMessage('error', '❌ Empty response from server.');
                    }
                } catch (error) {
                    // Silently bail if the user started a new chat mid-stream
                    if (error.name === 'AbortError') return;
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
                        padding: '16px 24px',
                        marginBottom: '16px',
                        lineHeight: '1.6',
                        fontSize: '16px'
                    };

                    switch (type) {
                        case 'user':
                            return {
                                ...base,
                                background: '#2c2e33',
                                color: '#c1c2c5',
                                borderRadius: '12px',
                                maxWidth: '85%',
                                marginLeft: 'auto',
                                marginRight: '0'
                            };
                        case 'assistant':
                            return {
                                ...base,
                                background: '#25262b',
                                color: '#c1c2c5',
                                borderRadius: '12px',
                                maxWidth: '85%',
                                marginLeft: '0',
                                marginRight: 'auto'
                            };
                        case 'thinking':
                            return {
                                ...base,
                                background: '#25262b',
                                color: '#909296',
                                border: '1px solid #373a40',
                                fontStyle: 'normal',
                                borderRadius: '12px',
                                maxWidth: '100%',
                                marginLeft: '0',
                                marginRight: '0'
                            };
                        case 'error':
                            return {
                                ...base,
                                background: '#2d0e0e',
                                color: '#ff6b6b',
                                border: '1px solid #e03131',
                                borderRadius: '8px',
                                maxWidth: '85%',
                                marginLeft: '0',
                                marginRight: 'auto'
                            };
                        default:
                            return base;
                    }
                };

                const renderContent = (content, type) => {
                    if (type === 'assistant') {
                        let html = marked.parse(content);
                        // Replace book emoji with Lucide icon
                        html = html.replace(/📚/g, '<i data-lucide="book-open" style="display: inline-flex; width: 20px; height: 20px; vertical-align: text-bottom; margin-right: 4px;"></i>');
                        // Replace brain emoji with Lucide icon
                        html = html.replace(/🧠/g, '<i data-lucide="brain" style="display: inline-flex; width: 20px; height: 20px; vertical-align: text-bottom; margin-right: 4px;"></i>');
                        // Sanitize before injecting: model output may quote raw HTML
                        // from ingested third-party content
                        html = DOMPurify.sanitize(html, {
                            ADD_ATTR: ['data-lucide', 'target'],
                            FORBID_TAGS: ['style', 'form', 'input'],
                        });
                        // Initialize Lucide icons for the newly added icons
                        setTimeout(() => {
                            if (window.lucide) {
                                window.lucide.createIcons({
                                    icons: window.lucide.icons,
                                    attrs: { 'stroke-width': 2 }
                                });
                            }
                        }, 0);
                        return { __html: html };
                    }
                    if (type === 'thinking') {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                    <span style={{
                                        width: '6px', height: '6px', background: '#339af0', borderRadius: '50%',
                                        animation: 'thinking 1.5s ease-in-out infinite'
                                    }}></span>
                                    <span style={{
                                        width: '6px', height: '6px', background: '#339af0', borderRadius: '50%',
                                        animation: 'thinking 1.5s ease-in-out infinite 0.2s'
                                    }}></span>
                                    <span style={{
                                        width: '6px', height: '6px', background: '#339af0', borderRadius: '50%',
                                        animation: 'thinking 1.5s ease-in-out infinite 0.4s'
                                    }}></span>
                                </div>
                                {content}
                            </div>
                        );
                    }
                    return content;
                };

                // Don't render system messages in conversation view
                if (message.type === 'system') {
                    return null;
                }

                return (
                    <div data-msg-id={message.id} style={{
                        maxWidth: '768px',
                        margin: '0 auto',
                        width: '100%',
                        padding: '0 24px',
                        scrollMarginTop: '24px'
                    }}>
                        <div style={getMessageStyle(message.type)}>
                            {message.type === 'assistant' ? (
                                <div className="message-content" dangerouslySetInnerHTML={renderContent(message.content, message.type)} />
                            ) : (
                                renderContent(message.content, message.type)
                            )}
                        </div>
                    </div>
                );
            };

            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Container size="lg" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
                        {/* Floating Header — only shown once chat is active; the welcome hero serves as the title on the empty state */}
                        {messages.filter(msg => msg.type !== 'system').length > 0 && (
                            <div style={{
                                background: '#25262b',
                                border: '1px solid #373a40',
                                borderRadius: '0 0 16px 16px',
                                padding: '16px 24px',
                                position: 'sticky',
                                top: 0,
                                zIndex: 100,
                                margin: '0 16px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '16px'
                            }}>
                                <div>
                                    <Title order={3} style={{ color: '#c1c2c5', marginBottom: '2px', fontWeight: '600' }}>
                                        Design Systems Assistant
                                    </Title>
                                    <Text size="sm" style={{ color: '#909296' }}>
                                        MCP Server for Design Systems
                                    </Text>
                                </div>
                                <button
                                    onClick={startNewChat}
                                    title="Start a new chat"
                                    aria-label="Start a new chat"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #373a40',
                                        color: '#c1c2c5',
                                        padding: '8px 14px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        fontFamily: 'inherit',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.15s ease',
                                        flexShrink: 0
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#339af0';
                                        e.currentTarget.style.color = '#339af0';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#373a40';
                                        e.currentTarget.style.color = '#c1c2c5';
                                    }}
                                >
                                    <Icon name="square-pen" size={14} />
                                    <span>New chat</span>
                                </button>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '0 24px'
                        }}>
                                {messages.filter(msg => msg.type !== 'system').length === 0 ? (
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
                                                AI-powered design systems knowledge for your AI coding assistant. Search W3C, WCAG, ARIA APG, and 10+ major design systems — or connect this MCP server to any AI client that supports MCP.
                                            </Text>
                                        </div>

                                        {/* Centered input area */}
                                        <div style={{
                                            width: '100%',
                                            maxWidth: '768px',
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
                                                    ref={textareaRef}
                                                    placeholder="Ask me anything about design systems..."
                                                    value={inputValue}
                                                    onChange={(e) => handleTextareaInput(e)}
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
                                                        padding: '12px 16px',
                                                        lineHeight: '1.5',
                                                        maxHeight: '200px',
                                                        overflowY: 'auto'
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
                                            gap: '8px',
                                            justifyContent: 'center',
                                            maxWidth: '768px',
                                            marginBottom: '32px'
                                        }}>
                                                                                    {EXAMPLE_QUESTIONS.map((item, index) => (
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
                                                        fontFamily: 'inherit',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.borderColor = '#339af0';
                                                        e.target.style.color = '#339af0';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.borderColor = '#373a40';
                                                        e.target.style.color = '#909296';
                                                    }}
                                                    onClick={() => {
                                                        const queries = {
                                                            'Overview': 'What is a design system?',
                                                            'Getting Started': 'How do I get started with design systems?',
                                                            'Theming': 'Tell me about theming',
                                                            'Tokens': 'What are design tokens?',
                                                            'Adoption': 'How do I get stakeholder buy-in for design systems?'
                                                        };
                                                        askQuestion(queries[item.text] || item.text);
                                                    }}
                                                >
                                                    <Icon name={item.icon} size={16} />
                                                    <span>{item.text}</span>
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
                                    <div style={{ padding: '24px 0 100px 0' }}>
                                        {messages.filter(msg => msg.type !== 'system').map((message) => (
                                            <MessageComponent key={message.id || Math.random()} message={message} />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                        </div>

                        {/* Input Area for active conversations */}
                        {messages.filter(msg => msg.type !== 'system').length > 0 ? (
                            <div style={{
                                padding: '16px 24px 24px',
                                borderTop: '1px solid #373a40',
                                background: '#1a1b1e'
                            }}>
                                <div style={{
                                    maxWidth: '768px',
                                    margin: '0 auto',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        background: '#25262b',
                                        border: '1px solid #373a40',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'border-color 0.2s ease',
                                        padding: '12px 16px'
                                    }}>
                                        <textarea
                                            ref={textareaRef2}
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
                                                padding: '0',
                                                lineHeight: '24px',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                marginRight: '12px'
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
                                                borderRadius: '6px',
                                                padding: '6px',
                                                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s ease',
                                                width: '28px',
                                                height: '28px',
                                                flexShrink: 0
                                            }}
                                        >
                                            {isLoading ? (
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
                                                    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
                                                    <path d="M 8 2 A 6 6 0 0 1 14 8" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" style={{ animation: 'spin 0.8s linear infinite', transformOrigin: 'center' }} />
                                                </svg>
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
                        textAlign: 'center'
                    }}>
                        <Text size="sm" style={{ color: '#6c6f75', fontSize: '13px', marginBottom: '8px' }}>
                            MCP Server for Design Systems • Powered by curated knowledge base
                        </Text>
                        <Text size="sm" style={{ color: '#6c6f75', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            Made by{' '}
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
                            {' • '}
                            <a
                                href="https://github.com/southleft/design-systems-mcp"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#339af0',
                                    textDecoration: 'none',
                                    fontWeight: '500',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                                <Icon name="github" size={14} />
                                View on GitHub
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
            root.render(<ChatApp />);
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

        /* Enhanced markdown styling */
        .message-content {
            line-height: 1.6;
            color: #c1c2c5;
        }

        /* Section headers (h1, h2) stay blue - these are "From the Knowledge Base" etc. */
        .message-content h1,
        .message-content h2 {
            color: #fff;
            margin: 24px 0 16px 0;
            font-weight: 600;
        }

        /* Content headers (h3, h4, h5, h6) are white and larger - these are internal headers */
        .message-content h3,
        .message-content h4,
        .message-content h5,
        .message-content h6 {
            color: #c1c2c5;
            margin: 24px 0 16px 0;
            font-weight: 600;
        }

        .message-content h1 { font-size: 24px; }
        .message-content h2 { font-size: 20px; }
        .message-content h3 { font-size: 22px; }  /* Increased from 18px */
        .message-content h4 { font-size: 20px; }  /* Increased from 16px */
        .message-content h5 { font-size: 18px; }
        .message-content h6 { font-size: 16px; }

        .message-content p {
            margin: 12px 0;
            line-height: 1.6;
        }

        .message-content ul,
        .message-content ol {
            margin: 8px 0;
            padding-left: 20px;
        }

        .message-content li {
            margin: 4px 0;
            line-height: 1.4;
        }

        .message-content ul li {
            list-style-type: disc;
        }

        .message-content ol li {
            list-style-type: decimal;
        }

        .message-content a {
            color: #339af0;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s ease;
        }

        .message-content a:hover {
            border-bottom-color: #339af0;
        }

        .message-content code {
            background: #2c2e33;
            color: #ff7979;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 14px;
        }

        .message-content pre {
            background: #2c2e33;
            color: #c1c2c5;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 16px 0;
        }

        .message-content pre code {
            background: none;
            padding: 0;
            color: inherit;
        }

        .message-content blockquote {
            border-left: 3px solid #339af0;
            background: #2c2e33;
            margin: 16px 0;
            padding: 12px 16px;
            color: #909296;
            font-style: italic;
        }

        .message-content hr {
            border: none;
            border-top: 1px solid #373a40;
            margin: 20px 0;
        }

        .message-content strong {
            color: #fff;
            font-weight: 600;
        }

        .message-content em {
            color: #b3b6ba;
            font-style: italic;
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

    // Unknown path: 404, not 200.
    //
    // Answering every unmatched path with 200 made each one look like a live
    // endpoint to any client probing for one — which is exactly how the
    // connector's registration probe turned into a confusing sign-in error
    // rather than a clean "no auth needed here".
    return new Response("Not Found - Use /mcp or /ai-chat endpoints", {
      status: 404,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      }
    });
  },
};
