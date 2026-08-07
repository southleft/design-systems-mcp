/**
 * Generates staged ContentEntry files for the agent-UI / generative-UI research batch.
 *
 * Content is extracted from primary sources (protocol specs, originating-team
 * blogs, research papers) by research agents, then condensed here with the
 * technical specifics preserved verbatim — field names, MIME types, method
 * names, and the authors' own definitions. Those specifics are the whole point:
 * these protocols revised their field names repeatedly through 2025-2026, so a
 * model answering from training data emits confidently wrong shapes.
 *
 * Run: npx tsx scripts/build-staged-agentui.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'content/staged';
mkdirSync(OUT, { recursive: true });

interface Staged {
  slug: string;
  title: string;
  url: string;
  category: string;
  system?: string;
  tags: string[];
  /** primary | authoritative | reference | community */
  authority: string;
  /** Status qualifier for specs still in flux. */
  status?: string;
  content: string;
}

const ENTRIES: Staged[] = [
  {
    slug: 'sentient-design-definition',
    title: 'Sentient Design: Definition and Core Attributes (Big Medium)',
    url: 'https://bigmedium.com/ideas/hello-sentient-design.html',
    category: 'patterns',
    system: 'Sentient Design',
    tags: ['sentient-design', 'ai', 'intelligent-interfaces', 'adaptive-ui', 'josh-clark', 'ux-framework'],
    authority: 'primary',
    content: `# Sentient Design: Definition and Core Attributes

By Josh Clark and Veronika Kindred, Big Medium. The canonical essay that coins and defines the term. Published June 12, 2024.

## Definition

"Sentient Design is the already-here future of intelligent interfaces: experiences that feel almost self-aware in their response to user needs. Sentient Design moves past static info and presentation to embrace UX as a radically adaptive story. These experiences are conceived and compiled in real time based on your intent in the moment—AI-mediated experiences that adapt to people, instead of forcing the reverse."

"Sentient Design describes not only the form of this new user experience but also a framework and a philosophy for working with machine intelligence as design material."

## The two fundamental attributes

"Sentient Design refers to intelligent interfaces that are aware of context and intent so that they can be radically adaptive to user needs in the moment. Those are the fundamental attributes of Sentient Design experiences: aware and radically adaptive."

## The four supporting characteristics

Collaborative — "The system is an active (often proactive) partner throughout the user journey, often with independent ability to perform tasks on your behalf."

Multimodal — "The system works across channels and media, going beyond traditional interfaces to speech, text, touch, physical gesture, etc."

Continuous and ambient — "The interface is available when it can be helpful and quiet or invisible when it can't."

Deferential — "The system suggests instead of imposing; it defers to user goals and preferences. It offers signals, not answers."

Note that generation is deliberately excluded from this list: "'making stuff' is not included in this list—not explicitly, at least. Writing text, making images, or generating code might all be the means or even the desired outcomes of Sentient Design experiences—but they're not defining characteristics."

## What "sentient" means here

The term does not imply consciousness. "The 'sentient' in Sentient Design describes a combination that is far more modest but still powerful: awareness, interpretation, agency, and adaptation."

This is framed as a continuum: "Think of it as a dial that you can turn: from simple utilities that add sparks of helpful intelligence to humble web forms to more capable companions like agents or assistants."

## Defensive design

"Instead of designing for success—for the happy path—we have to do more to anticipate failure and uncertainty. Sentient Design experiences allow AI and machine learning to mediate experiences in ways that are new and that sometimes take the designer out of the loop. We have to anticipate how and where the system is unreliable—where the system will be weird and where the human will be weird."

The framing question the authors pose: "how can Sentient Design experiences engage critical thought, or amplify human judgment and agency, instead of replacing them?"

## Relationship to AI

"Sentient Design is about AI… but also not. While AI and machine learning are the enabling technologies, the goal is not to 'make AI products.' Sentient Design lets us deliver meaningful human outcomes in ways that haven't been possible until now."`
  },
  {
    slug: 'sentient-design-triangle',
    title: 'The Sentient Design Triangle: Grounded, Interoperable, Radically Adaptive',
    url: 'https://bigmedium.com/ideas/shape-of-sentient-design.html',
    category: 'patterns',
    system: 'Sentient Design',
    tags: ['sentient-design', 'ai', 'framework', 'ternary-diagram', 'agents', 'copilots', 'adaptive-ui'],
    authority: 'primary',
    content: `# The Shape of Sentient Design

Josh Clark, Big Medium, July 28, 2024. Adapts Matt Webb's ternary framework ("Mapping the landscape of gen-AI product user experience", interconnected.org, July 19 2024) with relabelled axes.

## The three axes

The triangle plots AI-mediated experiences by how much each blends three characteristics:

Grounded — "It has the info it needs to deliver reliable results." (Webb's original label: "RAG or large context.")

Interoperable — "It can share data and instructions with other systems." (Webb's original: "structured generation.")

Radically adaptive — "It morphs in real time to user needs and context." (Webb's original: "real-time.")

Clark relabelled deliberately: the new labels describe "how Sentient Design experiences manifest rather than how the underlying tech is implemented."

## The four archetypes

Per Matt Webb's original formulation:

Tools — "Users control AI to generate something."
Copilots — "The AI works alongside the user in an app in multiple ways."
Agents — "The AI has some autonomy over how it approaches a task."
Chat — "The user talks to the AI as a peer in real time."

## The three edges

Each side of the triangle names a quality emerging from the pair of attributes it spans:

Collaborative = Radically adaptive + Interoperable
Autonomous = Interoperable + Grounded
Iterative = Radically adaptive + Grounded

Important caveat from the author: "these edge labels are not meant to suggest opposition to the point across the way. 'Collaborative' is not the opposite of 'grounded,' and 'autonomous' is not the opposite of 'radically adaptive.'"

## The ternary limitation

"In so-called ternary diagrams like this one, increasing the level of any two dimensions (grounded and interoperable, for example) necessarily reduces the third (radically adaptive). Mapping 3D attributes in a 2D chart means we lose some depth. That means this map can't plot an AI experience with all three attributes maxed out."

The diagram is therefore "more of a compass than a map." Webb: "it's not a tool that gives me answers, it's not that kind of map. But it helps me communicate, and it's a decent lens, and it's a helpful framework in a workshop context."

## Scope

"This is a map of features more than products. While some products might be single-feature, many more will include several at once."

## NPC pattern

NPC means "non-player character," borrowed from gaming: "an automated character with pre-determined behaviors. In more general Sentient Design experiences, NPCs might appear as Slack bots, Figma users, or Miro sidekicks; they have a user account and some agency, but the system runs them."`
  },
  {
    slug: 'radically-adaptive-experiences-patterns',
    title: 'Radically Adaptive Experiences: Bespoke UI, Intelligent Canvas, Casual Intelligence',
    url: 'https://bigmedium.com/ideas/when-interfaces-draw-themselves.html',
    category: 'patterns',
    system: 'Sentient Design',
    tags: ['radically-adaptive-ui', 'bespoke-ui', 'generative-ui', 'design-systems', 'ai', 'sentient-design'],
    authority: 'primary',
    content: `# When Interfaces Design Themselves: Radically Adaptive Experiences

Josh Clark and Veronika Kindred, Big Medium, September 30, 2025. The fullest published statement of radically adaptive experiences and their named patterns.

## Definition

"Radically adaptive experiences change content, structure, style, or behavior—sometimes all at once—to provide the right experience for the moment. They're a cornerstone of Sentient Design, a framework for creating intelligent interfaces that have awareness and agency."

## Casual intelligence

The entry-level pattern: "Drizzle some machine smarts onto everyday content and interface elements. Even small interventions like these add up to a quietly intelligent interface that is aware and adaptive."

Example: Google Forms suggesting an answer type from question phrasing — start typing "How would you rate…" and the default answer format updates to "Linear scale." "The interface doesn't decide for you, but it tees up a smart default as an informed suggestion."

## Bespoke UI — the design-system-critical pattern

"Bespoke UIs compose their own layout in direct response to immediate context. This approach relies on a stable set of interface elements that can be remixed to meet the moment."

It is one of **14 Sentient Design experience patterns** spanning the postures of tools, chat, agents, and copilots.

The Salesforce generative canvas is given as the conservative, reliable implementation: "The interface elements are chosen on the fly but only from a curated collection of UI patterns from Salesforce's design system. This includes familiar elements like tables, charts, trend indicators, and other data visualization tools. While the layout itself may be radically adaptive, the individual components are templated for visual and functional consistency—just like a design system provides consistent tools for human designers, too."

The constraint that makes it work: "Successful bespoke UI experiences rely on familiarity and a tightly constrained set of UI and interaction patterns. The Gemini example succeeds because it has a very small number of UI widgets in its design system, and the system was taught to match specific patterns to specific user intent. Experiences like this are open-ended in what they accept for input, but they're constrained in the language they produce."

## Intelligent canvas

"Sentient Design's intelligent canvas experience pattern, where radical adaptability dissolves the boundaries between maker and user." Examples cited: iPad Math Notes, tldraw's "Make Real", Anthropic's "Imagine with Claude" research preview.

"Taken all the way to its logical conclusion, every canvas (or file or session) could become its own ephemeral application—disposable software manifested when you need it and discarded when you don't."

## Other named patterns

Beyond bespoke UI and intelligent canvas, the framework names alchemist agents, sculptor tools, and non-player characters (NPCs), among 14 total.

## The designer's changed role

"The designer's job shifts from crafting each interaction to system-level design of the rules and guardrails to help AI tailor and deliver these experiences. What are the design patterns and interactions the system can and can't use? How does it choose the right pattern to match context? What is the manner it should adopt? The work is behavior design… not only for the user but for the system itself."

"For designers, creating this system is like being a creative director. You give the system the brief, the constraints, and the design patterns to use."

## The risk

"An interface that constantly changes risks eroding the very consistency and predictability that helps users build mastery and confidence. Unchecked, a radically adaptive experience can quickly become a chaotic and untrustworthy one."

"You have to craft the constraints as carefully as the capabilities; you design for failure as much as for success."`
  },
  {
    slug: 'wiring-interface-to-intent',
    title: 'Wiring Interface to Intent: Call-and-Response UI and System Prompt Patterns',
    url: 'https://bigmedium.com/ideas/wiring-interface-to-intent.html',
    category: 'patterns',
    system: 'Sentient Design',
    tags: ['bespoke-ui', 'system-prompt', 'design-systems', 'ai', 'intent-mapping', 'generative-ui'],
    authority: 'primary',
    content: `# Wiring Interface to Intent

Josh Clark, Big Medium, October 2, 2025. The practical companion essay: how to actually wire an LLM to a design system.

## Call-and-response UI

"A specific flavor of bespoke UI is 'call-and-response UI,' where the system responds to an explicit action—a question, UI interaction, or event trigger—with an interface element specifically tailored to the request."

The key architectural inversion: "the language model doesn't reply directly to the user—it replies to the UI engine, giving it instructions for how to present the response. The conversation happens in UI components, not in text bubbles." And: "The LLM talks to the interface, not the user."

## Why LLMs are suited to this

"LLMs are exceptional manner machines that can understand intent and the shape of the expected response. They're not great at facts (hi, hallucination), but they're sensational at manner."

"Just like LLMs can speak in whatever tone, language, or format you specify, they can equally speak UI."

## The starter system prompt

    The user will ask for questions and information about exploring a city. Your job is to:
    - Determine the user's intent
    - Determine if we have enough information to provide a response.
      - If yes, determine the available UI component that best matches the user's intent,
        and generate a brief JSON description of the response.
      - If not, ask for additional information
    - Return a response in JSON with the following format:

    {
      "intent": "string: description of user intent",
      "UI": "string: name of UI component",
      "rationale": "string: why you chose this pattern",
      "data": { object with structured data }
    }

Components are then declared with an explicit intent mapping, e.g.:

    ### Quick Filter
    - A set of buttons that show category suggestions.
    - User intent: Looking for high-level suggestions for the kind of activities to explore.

    ### Map
    - Interactive map displaying locations as pins.
    - User intent: Seeking nearby points of interest and spatial exploration

"In production, you'd likely provide this set of components via an external file or resource instead of directly in the system prompt."

## System Prompt Templates: A Pattern Library

Intent classification — "Determine the user's intent from the user's [message or actions], and classify it into one of these intent categories: x, y, z."
Action determination — "Based on the user's request, choose the most appropriate action to take: x, y, z."
Tool or data selection — "Choose the appropriate tool or data source to fulfill the user's request: x, y, z."
Manner and tone — "Identify the appropriate tone (x, y, z) to respond to the user's message."
Task list — "Determine the user's goal, and make a plan to accomplish it in a sequenced list of 3–5 tasks."
Ambiguity detection — "Evaluate if the user's request is clear and actionable. If it is ambiguous or lacks details, respond with a clarifying question."
Guardrails — "Evaluate the user's request for prohibited, harmful, or out-of-scope content."
Persona alignment — "Respond in the voice, style, and knowledge domain of [persona]."
Pattern selection — "Based on the user's [message or actions], select the best UI pattern to provide or request info as appropriate: x, y, z."
Explainability — "After every answer, include a short explanation of why you chose this response and your confidence level on a 0–100 scale."
Delegation — "If the task is outside your capabilities or should be handled by [human/tool], explain why and suggest or enable the next action."

## Prompt as design spec

"The prompt serves triple duty as technical, creative, and product spec." Design, product, and engineering can work in the same artifact simultaneously rather than in sequence.

## The design system conclusion

"Constrain the outputs, map them to intents, and let the LLM handle the translation."

"In the end, it's all fundamental design system stuff. Create UI solutions for common problems and scenarios, and then give the designer (a robot designer in this case) the info to know what to use when. Clean, context-based design systems are more important than ever, as is clear communication about what they do. That's how you wire interface to intent."`
  },
  {
    slug: 'a2ui-protocol-v1',
    title: 'A2UI Protocol v1.0: Agent-to-UI Declarative Rendering (Google)',
    url: 'https://github.com/google/A2UI/blob/main/specification/v1_0/docs/a2ui_protocol.md',
    category: 'tools',
    system: 'A2UI',
    tags: ['a2ui', 'agent-ui', 'protocol', 'generative-ui', 'json-render', 'server-driven-ui', 'design-systems', 'google'],
    authority: 'primary',
    status: 'draft-proposal — v1.0 is a release candidate; v0.9.1 is current stable',
    content: `# A2UI Protocol v1.0 (Agent to UI)

Google, Apache 2.0. Announced December 15, 2025. Spec header: Version 1.0, Status **Candidate**, created Nov 20 2025, last updated Jun 8 2026. v0.9.1 is the current stable release; v0.8 is legacy. Status matters — v1.0 mechanics should be treated as draft.

## Core philosophy

"The A2UI Protocol is designed for dynamically rendering user interfaces from a stream of JSON objects sent from an agent. Its core philosophy emphasizes a clean separation of UI structure and application data, enabling progressive rendering as the renderer processes each message."

Agents describe interfaces declaratively; clients render them with their own native components. "The same server-side logic should be able to render a UI on a Flutter app, a web browser, or potentially other platforms without modification."

## Message envelope (agent to renderer)

createSurface — creates a new surface and begins rendering it
updateComponents — adds or updates component definitions in a surface
updateDataModel — inserts or replaces surface data
deleteSurface — removes a surface and its contents

Renderer to agent: action (user interaction), error, functionResponse.

## The adjacency-list component model

Components are a flat list, not a nested tree. Relationships are string ID references:

    {
      "version": "v1.0",
      "createSurface": {
        "surfaceId": "user_profile_card",
        "catalogId": "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json",
        "components": [
          {"id": "root", "component": "Column", "children": ["user_name"]},
          {"id": "user_name", "component": "Text", "text": {"path": "/name"}}
        ],
        "dataModel": {"name": "John Doe"}
      }
    }

The rationale is explicitly about LLM generation: "Requiring an LLM to generate a perfectly nested JSON tree in a single pass is difficult and error-prone. A flat list of components, where relationships are defined by simple string IDs, is much easier to generate piece by piece." And: "The protocol should use a straightforward, declarative format rather than an imperative one. LLMs excel at generating structured, declarative data."

"The renderer is responsible for storing all components in a map (e.g., Map<String, Component>) and recreating the tree structure at render time. This model allows the agent to send component definitions in any order. Rendering can begin as soon as the root component is defined."

One component MUST have "id": "root". surfaceId must be globally unique for the renderer's lifetime.

## Data binding

Dynamic types (DynamicString, DynamicNumber, DynamicBoolean, DynamicStringList) accept a literal value, a JSON Pointer (RFC 6901) path, or a FunctionCall:

    {"text": {"literalString": "Static"}}
    {"text": {"path": "/user/name"}}

ChildList supports either a static array of ComponentIds or an object template generating children from a data-bound list.

updateDataModel replaces the value at the given path; omitting path replaces the whole model. Setting value to null deletes the key.

Input components: "Write (View → Model): As soon as a user interacts, the renderer **immediately** writes the new value into the local Data Model." Local model updates are synchronous, guaranteeing the model is current before any event resolves its context paths.

## Catalogs — where the design system lives

"Component types and their properties are defined by the active Catalog, not the core protocol."

A catalog contains: catalogId (required), instructions ("Markdown-formatted design principles, rules, or developer guidelines specific to this catalog. These rules guide LLMs when generating UI layouts under this catalog"), components (map of type → JSON Schema), functions (map of name → definition).

Catalog resolution order is strict: component-level catalogId → surface default catalogId → resolution error. "There is **no fallback** to the list of catalogs declared in rendererCapabilities."

catalogId "is a string identifier, not a resolvable URI."

Composition validation uses allowedParents and allowedChildren arrays on component schemas, producing error codes UNALLOWED_PARENT and UNALLOWED_CHILD.

## Identifier rules (new in v1.0)

All component names, function names, and property names "MUST adhere strictly to Unicode Standard Annex #31 (UAX #31) variable naming rules." Canonical regex: ^[\\p{XID_Start}_][\\p{XID_Continue}]*$

Valid: UserProfileCard, submit_form, item_id_1. Invalid: "User Card", 1stItem, submit-form, user#name.

The component type name "Surface" is reserved; catalogs MUST NOT define one.

## v0.9 → v1.0 changes

Bidirectional RPC messaging (actionResponse, callFunction/functionResponse); single-message UI instantiation (component trees and data models embedded directly in createSurface); **decoupled branding** — "Removes rigid theme properties (removing hardcoded brand colors) to defer visual styling entirely to the target framework's native theme"; enhanced catalog schemas with O(1) function lookups; strict UAX #31 identifiers and a reserved @ namespace for system context (e.g. @index).

## Function execution boundary

"When a renderer receives a callFunction message, it MUST look up the requested function name in its active catalog registry... If the requested function is configured in the catalog as rendererOnly, or if the function is not registered at all, the renderer MUST immediately reject the call and return an error message with code: 'INVALID_FUNCTION_CALL'." The boundary defaults to rendererOnly when omitted.

## Security posture

"A2UI is a declarative data format, not executable code. The client maintains a catalog of trusted components such as Card, Button or TextField. The agent can only reference types in this catalog."

## Transports

Transport-agnostic with four requirements: reliable in-order delivery, message framing, metadata support, and an optional return channel. Named bindings: AG-UI (standard binding), A2A (via the A2UI A2A Extension), MCP, SSE+JSON-RPC, WebSockets, REST.`
  },
  {
    slug: 'a2ui-vs-mcp-apps',
    title: 'A2UI vs MCP Apps vs AG-UI vs ChatKit: The Agent-UI Ecosystem',
    url: 'https://github.com/google/A2UI/blob/main/docs/public/introduction/agent-ui-ecosystem.md',
    category: 'tools',
    system: 'A2UI',
    tags: ['a2ui', 'mcp-apps', 'ag-ui', 'agent-ui', 'design-systems', 'comparison', 'protocol'],
    authority: 'primary',
    status: 'reference — first-party comparison, self-interested',
    content: `# How A2UI Compares: A2UI vs MCP Apps vs AG-UI vs ChatKit

Google's own positioning document. Self-interested but the clearest available statement of how the four approaches relate — and the decision a design systems team actually faces.

## The comparison

| | A2UI | MCP Apps | AG-UI |
|---|---|---|---|
| Approach | Declarative component blueprints | Pre-built HTML via ui:// URIs | Protocol connecting backends to frontends |
| Rendering | Native components (Angular, Flutter, Lit) | Sandboxed iframe | Developer-defined (any framework) |
| Styling | Host app controls: inherits design system | Isolated: remote server controls appearance | Developer controls: part of host app |
| Security | Declarative data, no code execution | Sandboxed iframe isolation | Trusted code within your own app |
| Multi-agent | Across trust boundaries | Multiple MCP servers | Primarily single-agent |
| Cross-platform | Web, mobile, desktop, native | Web-focused (iframe) | Framework-agnostic protocol |
| LLM generation | Designed for streaming output | Pre-built by server | Via A2UI integration |
| Spec | Open protocol (Apache 2.0) | MCP extension (SEP-1865) | Open source (CopilotKit) |

## A2UI vs MCP Apps — the core architectural choice

"MCP Apps treat UI as a **resource**: servers provide pre-built HTML via ui:// URIs, rendered in sandboxed iframes. The remote integration controls all content and appearance, with configuration happening through tool calling. A2UI takes a **declarative UI** approach: agents send component blueprints, but the host application controls styling, theming, and how those components are configured and rendered."

"Choose MCP Apps when the server should own the full UI experience; choose A2UI when you want dynamic, cross-platform UI that fits naturally into your app."

For design systems this is the decision that matters. Under MCP Apps the server ships pixels and the host injects CSS variables to harmonize them. Under A2UI the server ships intent — a component type name plus bound values — and the host renders with its own already-accessible, already-branded component, inheriting focus management, ARIA semantics, and touch targets for free.

## A2UI vs AG-UI

"AG-UI is a **transport protocol** connecting agent backends to frontends with real-time state sync. A2UI is a **UI format**: the payload that describes what to render. They're complementary: use AG-UI as the pipe, A2UI as the content." AG-UI has day-zero A2UI compatibility.

Caveat worth noting: AG-UI's own docs do not document generative UI as a first-class protocol concept. Generative UI in AG-UI is an emergent pattern over the ToolCallStart/Args/End triad plus StateDelta. The "pipe and content" framing is Google's, and AG-UI does not assert it symmetrically.

## A2UI vs ChatKit (OpenAI)

"ChatKit offers a tightly integrated experience within the OpenAI ecosystem. A2UI shares some design philosophy with ChatKit: both define a set of basic components and use a configurable, declarative abstraction layer. A2UI is **platform-agnostic**."

## Using them together

"A2UI + AG-UI: AG-UI as transport, A2UI as the generative UI format. A2UI + A2A: A2UI messages sent via the A2A protocol for multi-agent systems. A2UI + MCP: Upcoming bridge lets MCP servers provide A2UI blueprints alongside HTML resources."

## Key glossary terms

**Catalog** — "Itemized renderer capabilities: List of components that the agent can use to generate UI; List of functions that can be invoked by renderer; Styles and themes." Catalogs range from basic primitives (buttons, labels, rows, columns) to domain components (HotelCheckout, FlightSelector).

**Catalog Transformer** — "A rule set that programmatically filters, adapts, or mutates a pristine Catalog before system prompt instructions are generated." Motivations: context-window token optimization (injecting all component schemas is expensive), task-specific capability guardrails (disabling form inputs in guest mode), and model signature reduction for smaller LLMs. Named utilities: ComponentPruningTransformer, FunctionPruningTransformer.

**Surface** — "An area of UI, constructed by A2UI agent and managed by the A2UI renderer, which consists of a number of components. Surfaces cannot nest."

**A2UI Tag** — "Enclosing delimiter tags (such as <a2ui-json>, <a2ui>) used to bound A2UI payload code blocks within LLM text output." Parsing proceeds in two phases: Tag Unwrapping, then Compilation.

**Client function vs LLM tool** — A client function is executed by the A2UI renderer after the agent's message is sent, for UI logic (validation, visibility toggles, formatting), with access to DataContext and input values. An LLM tool is invoked before the message is sent, for reasoning, data fetching, and backend actions.

**NoAI information** — "Information, categorized as not accessible by AI (for example, credit card information)... end users want to clearly see what their input is allowed to go to the AI and what is not allowed."

Known GenUI patterns named: Chat, Canvas, Dashboard, Wizard.`
  },
  {
    slug: 'mcp-apps-sep-1865',
    title: 'MCP Apps (SEP-1865): Interactive User Interfaces for MCP',
    url: 'https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp',
    category: 'tools',
    system: 'Model Context Protocol',
    tags: ['mcp', 'mcp-apps', 'agent-ui', 'protocol', 'sep-1865', 'specification', 'design-systems'],
    authority: 'primary',
    status: 'accepted-spec — Final, Extensions Track, created 2025-11-21',
    content: `# SEP-1865: MCP Apps — Interactive User Interfaces for MCP

Status: **Final**. Type: Extensions Track. Created 2025-11-21. Shipped as one of two official extensions in the 2026-07-28 MCP specification release candidate (the other being Tasks, SEP-2663).

Authors: Ido Salomon, Liad Yosef, Olivier Chafik, Jerome Swannack, Jonathan Hefner, Anton Pidkuiko, Nick Cooper, Bryan Ashley, Alexi Christakis.

## Abstract

"This SEP proposes an extension to MCP (per SEP-1724) that enables servers to deliver interactive user interfaces to hosts. MCP Apps introduces a standardized pattern for declaring UI resources via the ui:// URI scheme, associating them with tools through metadata, and facilitating bi-directional communication between the UI and the host using MCP's JSON-RPC base protocol."

## Motivation

"MCP lacks a standardized way for servers to deliver rich, interactive user interfaces to hosts. This gap blocks many use cases that require visual presentation and interactivity that go beyond plain text or structured data."

Problems named: "Servers cannot reliably expect UI support via MCP; Each host may implement slightly different behaviors; Security and auditability patterns are inconsistent; Developers must maintain separate implementations or adapters for different hosts (e.g., MCP-UI vs. Apps SDK)."

## What it introduces

"**UI Resources:** Predeclared resources using the ui:// URI scheme. **Resource Discovery:** Tools reference UI resources via metadata. **Bi-directional Communication:** UI iframes communicate with hosts using standard MCP JSON-RPC protocol. **Security Model:** Mandatory iframe sandboxing with auditable communication."

## Rationale — what was rejected and why

### Predeclared resources vs inline embedding

Chosen because it allows "Hosts to prefetch templates before tool execution, improving performance; Separation of presentation (template) from data (tool results), facilitating caching; Security review of UI resources."

Rejected: **Embedded resources** (the MCP-UI approach of returning resources in tool results) — "more convenient for server development, it was deferred due to the gaps in performance optimization and the challenges in the UI review process." **Resource links** — deferred for performance reasons.

### Reusing MCP JSON-RPC instead of a custom protocol

"Reuses existing MCP infrastructure... JSON-RPC offers advanced capabilities (timeouts, errors, etc.)."

Rejected: **Custom message protocol** (MCP-UI's tool/intent/prompt message types). **Global API object** — "Rejected because it requires host-specific injection and doesn't work with external iframe sources."

### HTML-only MVP

"HTML is universally supported and well-understood; Simplest security model (standard iframe sandbox); Allows screenshot/preview generation; Sufficient for most observed use cases."

Rejected for MVP: **External URLs** — "deferred due to concerns around model visibility, inability to screenshot content, and review process."

## Lineage

"MCP-UI has demonstrated the viability and value of MCP apps built on UI resources... MCP-UI's adopters, including hosts and providers such as Postman, HuggingFace, Shopify, Goose, and ElevenLabs, have provided critical insights."

"OpenAI's Apps SDK, launched in November 2025, further validated the demand... The architecture of both the Apps SDK and MCP-UI has significantly informed the design of this specification."

mcp-ui is now subordinate to the spec — it self-describes as "an SDK implementing the MCP Apps standard," and its creators are the lead SEP authors.

## Security

"**Iframe sandboxing**: All UI content runs in sandboxed iframes with restricted permissions. **Predeclared templates**: Hosts can review HTML content before rendering. **Auditable messages**: All UI-to-host communication goes through loggable JSON-RPC. **User consent**: Hosts can require explicit approval for UI-initiated tool calls."

## Backward compatibility

"The proposal is an optional extension to the core protocol. Existing implementations continue working without changes."

Extensions are identified by reverse-DNS IDs, negotiated through an extensions map on client and server capabilities, live in their own ext-* repositories, and version independently of the specification.`
  },
  {
    slug: 'mcp-apps-specification-fields',
    title: 'MCP Apps Extension Spec: ui:// Resources, CSP Metadata, and the ui/ Method Namespace',
    url: 'https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx',
    category: 'tools',
    system: 'Model Context Protocol',
    tags: ['mcp', 'mcp-apps', 'specification', 'csp', 'sandbox', 'design-tokens', 'theming', 'agent-ui'],
    authority: 'primary',
    status: 'accepted-spec — revision 2026-01-26, extension id io.modelcontextprotocol/ui',
    content: `# MCP Apps Extension Specification (revision 2026-01-26)

Extension identifier: **io.modelcontextprotocol/ui**

Note on staleness: this contract changed materially across revisions. Models trained on 2025 material emit the older mcp-ui or openai/outputTemplate shapes. The flat _meta["ui/resourceUri"] form is deprecated and "will be removed before GA."

## UI resource format

    interface UIResource {
      uri: string;           // MUST use ui:// scheme, e.g. "ui://weather-dashboard"
      name: string;
      description?: string;
      mimeType: string;      // SHOULD be text/html;profile=mcp-app
      _meta?: { ui?: UIResourceMeta; }
    }

    interface McpUiResourceCsp {
      connectDomains?: string[],   // fetch/XHR/WebSocket; maps to CSP connect-src
      resourceDomains?: string[],  // images, scripts, styles, fonts, media
      frameDomains?: string[],     // nested iframes; maps to frame-src
      baseUriDomains?: string[],   // maps to base-uri
    }

    interface UIResourceMeta {
      csp?: McpUiResourceCsp,
      permissions?: {
        camera?: {}, microphone?: {}, geolocation?: {}, clipboardWrite?: {},
      },
      domain?: string,
      prefersBorder?: boolean,
    }

Requirements: URI MUST start with ui://; mimeType MUST be text/html;profile=mcp-app; content MUST be provided via text or base64 blob; content MUST be a valid HTML5 document.

## Restrictive CSP default

If ui.csp is omitted the host MUST use:

    default-src 'none';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data:;
    media-src 'self' data:;
    connect-src 'none';

"**No Loosening:** Host MAY further restrict but MUST NOT allow undeclared domains."

## Tool linkage and visibility

    interface McpUiToolMeta {
      resourceUri?: string;
      visibility?: Array<"model" | "app">;  // Default: ["model", "app"]
    }

"'model': Tool is visible to and callable by the agent. 'app': Tool is callable by the app from the same server connection only. **tools/list behavior:** Host MUST NOT include tools in the agent's tool list when their visibility does not include 'model'. **tools/call behavior:** Host MUST reject tools/call requests from apps for tools that don't include 'app'."

## Capability negotiation

    {"capabilities": {"extensions": {"io.modelcontextprotocol/ui": {
       "mimeTypes": ["text/html;profile=mcp-app"]}}}}

## The ui/ method namespace

View → Host requests:
- ui/open-link — params { url }; error -32000 for denied/invalid/policy violation
- ui/message — params { role: "user", content: { type: "text", text } }
- ui/request-display-mode — params { mode: "inline" | "fullscreen" | "pip" }; result returns the actual mode set
- ui/update-model-context — params { content?, structuredContent? }; "Each request overwrites the previous context sent by the View"
- plus standard tools/call, resources/read, notifications/message, ping

Host → View notifications:
- ui/notifications/tool-input — complete arguments; sent at most once, required before tool-result
- ui/notifications/tool-input-partial — streaming arguments, zero or more times
- ui/notifications/tool-result
- ui/notifications/tool-cancelled
- ui/notifications/host-context-changed
- ui/notifications/size-changed
- ui/resource-teardown — MUST be sent before cleanup

Lifecycle uses ui/initialize → ui/notifications/initialized, "replaces custom iframe-ready pattern in MCP-UI". Note this is separate from core MCP initialize.

## Host context — the design system integration point

Initialization responses include a hostContext providing: theme preference (light/dark); **a standardized set of CSS variables for colors, typography, borders, and shadows** (HostContext.styles.variables); display mode and available modes; container dimensions; locale, timezone, platform, device capabilities.

"Views apply fallback values for graceful degradation when variables are omitted."

This is the spec's answer to visual consistency: rather than the server guessing the host's brand, the host publishes a token contract the embedded view consumes. For design systems teams this is the concrete integration point — your tokens must be expressible as, or mapped onto, the standardized CSS variable set the host publishes.

## Sandbox proxy (web hosts) — normative

"If the Host is a web page, it MUST wrap the View and communicate with it through an intermediate Sandbox proxy. 1. The Host and the Sandbox MUST have different origins. 2. The Sandbox MUST have the following permissions: allow-scripts, allow-same-origin. 3. The Sandbox MUST send a ui/notifications/sandbox-proxy-ready notification when ready. 4. Once ready, the Host MUST send the raw HTML resource in a ui/notifications/sandbox-resource-ready notification. 5. The Sandbox MUST load the raw HTML with CSP settings that enforce the declared domains... 6. The Sandbox MUST forward messages between Host and View for any method that doesn't start with ui/notifications/sandbox-."

## App capabilities

    interface McpUiAppCapabilities {
      experimental?: {};
      tools?: { listChanged?: boolean; };
      availableDisplayModes?: Array<"inline" | "fullscreen" | "pip">;
    }

## Client support

As documented: Claude, Claude Desktop, VS Code GitHub Copilot, Microsoft 365 Copilot, Goose, Postman, MCPJam, Archestra.AI.`
  },
  {
    slug: 'openai-apps-sdk-to-mcp-apps-migration',
    title: 'OpenAI Apps SDK to MCP Apps: Field-Level Migration Map',
    url: 'https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/migrate_from_openai_apps.md',
    category: 'tools',
    system: 'Model Context Protocol',
    tags: ['mcp-apps', 'openai-apps-sdk', 'migration', 'agent-ui', 'metadata', 'csp'],
    authority: 'authoritative',
    status: 'reference — SDK documentation, not normative protocol text',
    content: `# Migrating from OpenAI Apps SDK to MCP Apps

The only concrete field-level mapping between the two competing agent-UI metadata dialects. Directly useful because a model working from 2025 training data will emit the OpenAI shapes.

## Tool metadata mapping

| OpenAI | MCP Apps | Notes |
|---|---|---|
| _meta["openai/outputTemplate"] | _meta.ui.resourceUri | URI of UI resource |
| _meta["openai/toolInvocation/invoking"] | — | Not yet implemented |
| _meta["openai/toolInvocation/invoked"] | — | Not yet implemented |
| _meta["openai/widgetAccessible"] (boolean) | _meta.ui.visibility (string[]) | true/false → include/exclude "app" |
| _meta["openai/visibility"] (string) | _meta.ui.visibility (string[]) | "public"/"private" → include/exclude "model" |

## Resource metadata mapping

| OpenAI | MCP Apps |
|---|---|
| _meta["openai/widgetCSP"] | _meta.ui.csp |
| — | _meta.ui.permissions (camera, microphone, geolocation, clipboard) |
| _meta["openai/widgetDomain"] | _meta.ui.domain |
| _meta["openai/widgetPrefersBorder"] | _meta.ui.prefersBorder |
| _meta["openai/widgetDescription"] | — (not yet implemented) |

## CSP field mapping

resource_domains → resourceDomains ("Origins for static assets")
connect_domains → connectDomains ("Origins for fetch/XHR/WebSocket requests")
frame_domains → frameDomains ("Origins for nested iframes")
redirect_domains → — (OpenAI-only: origins for openExternal redirects)
— → baseUriDomains (MCP-only: base-uri CSP directive)

## MIME type

text/html+skybridge (OpenAI) → text/html;profile=mcp-app (MCP Apps; use the RESOURCE_MIME_TYPE constant)

## Registration

OpenAI: direct server.registerTool() / server.registerResource().
MCP Apps: helper functions registerAppTool() / registerAppResource() from @modelcontextprotocol/ext-apps/server.

    registerAppTool(server, "shopping-cart", {
      title: "Shopping Cart",
      inputSchema: { userId: z.string() },
      _meta: { ui: { resourceUri: "ui://view/cart.html" } },
    }, async (args) => {
      const cart = await getCart(args.userId);
      return { content: [{ type: "text", text: JSON.stringify(cart) }],
               structuredContent: { cart } };
    });

## Seven key differences (verbatim)

"1. **Metadata Structure**: OpenAI uses flat _meta["openai/..."] properties; MCP uses nested _meta.ui.* structure. 2. **Tool Visibility**: OpenAI uses boolean/string (true/"public"); MCP uses string arrays (["app", "model"]). 3. **CSP Field Names**: snake_case → camelCase. 4. **App Permissions**: MCP adds _meta.ui.permissions for camera, microphone, geolocation, clipboard. 5. **Resource MIME Type**: text/html+skybridge → text/html;profile=mcp-app. 6. **Helper Functions**: MCP provides registerAppTool() and registerAppResource(). 7. **Not Yet Implemented**: openai/toolInvocation/invoking, openai/toolInvocation/invoked, and openai/widgetDescription don't have MCP equivalents yet."

## Client side

OpenAI uses an implicit window.openai global with pre-populated properties and synchronous access. MCP Apps uses an explicit App instance (new App({name, version})), async connection plus notifications, and getters with event handlers.

    await app.connect();                       // auto-detects OpenAI env
    await app.connect(new PostMessageTransport(...));  // force MCP mode
    app.getHostContext()?.theme                // "light" | "dark"`
  },
  {
    slug: 'airbnb-server-driven-ui',
    title: "Airbnb's Server-Driven UI System: Sections, Screens, and the Ghost Platform",
    url: 'https://medium.com/airbnb-engineering/a-deep-dive-into-airbnbs-server-driven-ui-system-842244c5f5',
    category: 'patterns',
    system: 'Airbnb',
    tags: ['server-driven-ui', 'sdui', 'json-render', 'design-systems', 'architecture', 'airbnb'],
    authority: 'primary',
    content: `# A Deep Dive into Airbnb's Server-Driven UI System

Ryan Brooks, Airbnb Tech Blog. The canonical source for server-driven UI vocabulary — the terms every 2025-2026 AI-driven successor (A2UI, MCP Apps) inherits.

## Core premise

"We pass both the UI and the data together, and the client displays it agnostic of the data it contains."

Everything — the screen's layout, how sections are arranged, the data displayed, and the actions taken on interaction — is controlled by a single backend response served identically to web, iOS, and Android.

## The Ghost Platform (GP)

Airbnb's unified SDUI system, named for its focus on "'Guest' and 'Host' features, the two sides to our Airbnb apps." It provides frameworks in each client's native language — "Typescript, Swift, and Kotlin, respectively" — and powers search, listing pages, and checkout.

The backbone is a single shared GraphQL schema across all platforms: "the same schema for handling responses and generating strongly typed data models across all of our platforms." The schema is the contract; clients are generated consumers of it.

## Sections

"A section is the most primitive building block of GP. A section describes the data of a cohesive group of UI components, containing the exact data to be displayed — already translated, localized, and formatted."

The emphasis on *already translated, localized, and formatted* is the load-bearing decision: no client-side business logic transforms section data before display. Sections are independent of one another and reusable across screens.

## Screens

Screens describe layout and the placement of sections within it. They "define other metadata, such as how to render sections — e.g., as a popover, modal, or full-screen." The screen is the presentation envelope, distinct from the content of its sections.

## Section component mapping

The SectionComponentType field controls how a section's data renders. One data model can back multiple renderings — the example contrasts TITLE versus PLUS_TITLE, identical backing data producing different visual presentations. A section component maps "a section data model to **one** unique rendering" and contains no feature-specific business logic.

This is the design-system insight: the server names a semantic role, and the client's component library owns the pixels.

## Layouts (ILayout)

ILayout implementations enable dynamic layout configuration from the server. Layouts specify "various placements. Placements contain one or many SectionDetail types that point to sections in the response's outermost sections array."

The indirection matters: sections live in a flat top-level array and layouts reference them by pointer rather than nesting them. This is the same adjacency-list pattern A2UI later adopted explicitly for LLM-generation reasons.

## Actions (IAction)

While sections and components are forbidden business logic, actions are the sanctioned escape hatch: features implement custom actions, and because they have "feature-specific event handlers scoped to the feature, they can contain as much feature-specific business logic as they wish."

## The rendering pipeline

1. GP parses the GPResponse and builds sections.
2. Section components transform section data models into native UI, selected via SectionComponentType.
3. Layout renderers inflate the ILayout, locating corresponding section components.
4. The built UI is inserted into declared placements.
5. Action handlers route user interactions to feature-specific logic.

## The constraint that carries forward

The set of section components installed in the client binary is the complete universe of what the server can ask for. Any genuinely new visual treatment still requires a client release.

This "the server can only reference components the client already has" property is exactly the constraint A2UI and MCP Apps re-derive for AI-generated UI — where the motivation shifts from release-cycle economics to safety.`
  },
  {
    slug: 'google-generative-ui-research',
    title: 'Generative UI: LLMs are Effective UI Generators (Google Research)',
    url: 'https://generativeui.github.io/',
    category: 'patterns',
    system: 'Google Research',
    tags: ['generative-ui', 'ephemeral-ui', 'research', 'evaluation', 'gemini', 'ai', 'design-systems'],
    authority: 'primary',
    content: `# Generative UI: LLMs are Effective UI Generators

Google Research, November 2025. Authors: Yaniv Leviathan, Dani Valevski, Matan Kalman, Danny Lumen, Eyal Segalis, Eyal Molad, Shlomi Pasternak, Vishnu Natchu, Valerie Nygaard, Srinivasan Venkatachary, James Manyika, Yossi Matias.

Shipped as "dynamic view" in the Gemini app and in AI Mode in Google Search.

## Definition

Generative UI names a paradigm in which LLMs produce not only content but the interface itself. The model generates "not just content, but the entire user experience" — "This work represents a first step toward fully AI-generated user experiences, where users automatically get dynamic interfaces tailored to their needs, rather than having to select from an existing catalog of applications."

## Architecture — three parts

1. **Server infrastructure** exposing endpoints for key tools — image generation and web search.
2. **Carefully crafted system instructions** incorporating goals, planning guidelines, examples, and technical specifications.
3. **Post-processors** addressing common issues that instructions alone do not resolve.

The third component is the instructive one: even with a four-and-a-half-page system prompt, deterministic post-processing is required to bring model output into acceptable state. Any design system contemplating LLM-generated UI should expect the same shape — prompt, then repair.

## Evaluation

Five output formats compared using 100 prompts drawn from LMArena, with pairwise human ratings: custom human-expert websites; top Google Search results; plain text LLM output; standard markdown LLM output; and the generative UI implementation.

Result: the generative UI implementation achieved an ELO of 1736.2, "demonstrating strong user preference over all other formats, except human experts." Reported ordering: "The sites designed by human experts had the highest preference rates. These were followed closely by the results from our generative UI implementation, with a substantial gap from all other output methods." Generation speed was excluded from the comparison.

The PAGEN dataset of human expert–made websites was created for this evaluation and is to be released to the research community.

## Calibrating the "human expert" baseline

Disclosed on page 15: the human-expert comparison websites were built by highly-rated Upwork freelancers paid $100–130 per site, averaging three to five hours each. The generative UI result should therefore be read as "approaches a good freelancer on a short brief," not "approaches a mature product team."

## The system prompt

The appendix from page 15 contains the four-and-a-half-page system instruction. It opens with a Core Philosophy demanding an interactive-first approach: "Even for simple queries that could be answered with static text (e.g., 'What's the time in Tel Aviv?', 'What's the weather?'), your primary goal is to create an interactive application." The technical substrate specified is Tailwind CSS, HTML Canvas, and SVG.

A seven-step internal thought process is prescribed: interpret the query and decide whether search is mandatory; plan the application concept; plan content including storylines, scripts and character descriptions; identify data and image needs; perform searches diligently; brainstorm roughly twelve UI components and interactive elements; filter and integrate, discarding weak ideas.

## The design-systems observation

Seven planning steps govern *what to build and what facts to gather*. Exactly one paragraph governs *how it should look*: "Use Tailwind CSS effectively to create modern, visually appealing interfaces. Consider layout, typography, color schemes including gradients, spacing, and subtle transitions or animations where appropriate."

The resulting visual homogeneity critics observe — a recurring house style of one-sided thick borders, Playfair Display paired with Lato, pill-shaped buttons — is the predictable consequence of leaving aesthetics to model priors rather than to a token system or component catalog.

This is the strongest available empirical argument for the A2UI / MCP Apps position that the client's design system, not the model, should own presentation.

## Limitations acknowledged

"Our current implementation can sometimes take a minute or more to generate results, and there are occasional inaccuracies in the outputs." The capability is characterized as emerging, with newer models showing substantially improved accuracy.`
  },
  {
    slug: 'ephemeral-interface-content-not-chrome',
    title: 'Generative UI and the Ephemeral Interface: Content, Not Chrome',
    url: 'https://rogerwong.me/2025/11/generative-ui-and-the-ephemeral-interface',
    category: 'patterns',
    tags: ['ephemeral-ui', 'generative-ui', 'consistency', 'usability', 'design-systems', 'nngroup'],
    authority: 'community',
    content: `# Generative UI and the Ephemeral Interface

Roger Wong, November 21 2025. Practitioner analysis; the clearest articulation of the content-vs-chrome distinction, which is the most useful conceptual tool in the ephemeral-UI literature.

## The consistency objection

NN/g defines generative UI as "a user interface that is dynamically generated in real time by artificial intelligence to provide an experience customized to fit the user's needs and context."

NN/g simultaneously warned that "Constantly changing UIs will cause usability problems" — that "you could be shown a different UI every time you use a website."

This lands on Nielsen's fourth usability heuristic: consistency. Design standards form the foundation of user understanding; when interfaces shift per individual, users face continuous relearning. Wong raises a consequence rarely discussed: how could a support organization troubleshoot an interface that is different for every user and every session?

## The resolving distinction

Wong's central claim: **"the generative UI in Gemini isn't the chrome or frame around the experience, it's the content."**

This dissolves most of the consistency objection. The application shell, navigation, and persistent affordances remain stable and learnable; only the generated artifact inside them varies. The comparison drawn is to a TikTok feed featuring varied content rather than to a traditional interface being redesigned per user.

**For design systems this reframes the question entirely: the system still owns the chrome, and what is newly ephemeral is the content region — which historically the design system governed loosely anyway.** The parallel is to interactive charts published by The New York Times: bespoke, single-purpose, never reused, and no one considers them a design system failure.

## The aesthetic ceiling

Wong rates the output "a solid B or B+ letter grade." Consistent tells across generated sites: rounded rectangles with a thick border on just one side, Playfair Display paired with Lato, and pill-shaped buttons everywhere. The results "look like the work of about three or four mid designers but lack the sophistication of seasoned pros."

He argues this adequacy suits the use case precisely because "these interactive experiences are entirely ephemeral" — nothing needs to survive a redesign cycle or accumulate muscle memory. He adds a maintenance note: visual styles warrant annual updating to prevent staleness comparable to default Google Slides templates. A generative system has a house style, and that house style ages.

## On the designer's role

Designers must continue orchestrating alignment within organizations, performing systems thinking, and dispatching and monitoring AI designer agents — becoming "puppet masters." The emerging workflow may consolidate into "prompt, generate, deploy."

Wong suggests Gemini's implementation may be the spiritual successor to HyperCard for the AI era, with the crucial difference that these UIs are ephemeral rather than persistent like HyperCard stacks.

He cites Jakob Nielsen's projection that AI-generated UI "will be better than human-created UI design by late 2026," while remaining skeptical of the projection's accuracy.`
  },
  {
    slug: 'design-systems-for-generative-composition',
    title: 'Elastic Primitives and Text-to-Hydration: Design Systems for Generative Composition',
    url: 'https://www.builder.io/blog/designing-generative-ui-in-an-agent-native-world',
    category: 'guidelines',
    tags: ['generative-ui', 'design-systems', 'documentation', 'machine-readable', 'governance', 'ai'],
    authority: 'community',
    content: `# Designing Generative UI in an Agent-Native World

Builder.io. Vendor blog with commercial interest, but the clearest articulation of what generative UI does to design system documentation practice.

## Text-to-hydration

The central claim: the dominant generative-UI pattern is not generating UI from scratch but **"text-to-hydration"** — AI arranging and filling pre-built components with data. This reframes the design system's job from supplying screens to supplying a composable kit.

## Elastic primitives

The unit of that kit: "a modular set of components designed for dynamic composition rather than for placement into predetermined page templates." The shift is from page-based design to primitive-based design, where no one authors the arrangement in advance.

## AI as a chaotic user of your design system

The quotable line: **"AI really is a chaotic user of your design system."**

Unlike human developers, who possess intuitive design sense and unspoken shorthand about what looks acceptable, AI lacks the tacit understanding required to avoid overcrowding layouts or violating visual hierarchy:

"If you don't give it hyper-explicit rules, it will gladly grab your gorgeous, pixel-perfect primitives and stitch them together into a cluttered, unusable mess"

This is the practical rebuttal to the assumption that a good component library is sufficient protection. A component library constrains *what* can appear; it does not constrain *how many*, *in what order*, *at what density*, or *under what conditions*. Those constraints historically lived in designers' heads and in review, and a generative pipeline has neither.

## Machine-legible documentation requirements

Design systems must transition from "casual, fluffy prose meant for people" to **"highly structured, machine-legible metadata."** Three concrete obligations:

1. Defining exact compression thresholds — the point at which a container must collapse rather than continue shrinking.
2. Specifying conditions for component visibility — for example, an analytics chart appearing only under specific data scenarios rather than whenever the model feels it would be nice.
3. Encoding design philosophy as programmatic guardrails inside component APIs, rather than as guidance in a docs site the model never reads.

The third is the structural point: guidance that lives only in prose documentation is guidance a generative system will violate. If a rule matters, it must be expressible as a prop constraint, a type, a validation, or a refusal — something the component enforces at composition time.

This converges with the catalog-based approach in A2UI and the visibility metadata in MCP Apps: in all three, the design system's authority is exercised through what the schema permits rather than through what the documentation advises.

## Global cascading effects

Because elastic primitives are composed at runtime rather than assembled into fixed screens, changes to a primitive propagate system-wide instantly, affecting how the AI composes across the entire application ecosystem simultaneously.

This is a fundamental shift from isolated screen templates, where a component change had a bounded, enumerable blast radius reviewable screen by screen. Under generative composition there is no finite set of screens to review — the surface area of a change is every arrangement the model might produce.

The governance implication: visual regression testing against a fixed screen inventory stops being a meaningful safety net.`
  },
  {
    slug: 'ag-ui-events-reference',
    title: 'AG-UI Protocol: Event Reference for Agent-to-Frontend Streaming',
    url: 'https://docs.ag-ui.com/concepts/events',
    category: 'tools',
    system: 'AG-UI',
    tags: ['ag-ui', 'agent-ui', 'protocol', 'streaming', 'copilotkit', 'events', 'json-patch'],
    authority: 'primary',
    status: 'open protocol, actively versioned — not a standards-body spec',
    content: `# AG-UI Events Reference (Agent User Interaction Protocol)

CopilotKit's open protocol. A2UI classifies it as a Stable transport binding with "day-zero A2UI compatibility."

All communication flows through typed events inheriting from BaseEvent, which carries type, optional timestamp, and optional rawEvent. Transport-agnostic: HTTP SSE, an HTTP binary protocol, WebSockets, and webhooks. The standard client HttpAgent "accepts RunAgentInput parameters and returns Observable<BaseEvent>".

## Lifecycle events

RunStarted — threadId, runId, parentRunId (optional, for branching), input (optional)
RunFinished — outcome (discriminated union, type "success" or "interrupt"), result, interrupts (array of pending human inputs)
RunError — message, code
StepStarted / StepFinished — stepName

## Text message events

TextMessageStart — messageId, role ("assistant", "user", "tool")
TextMessageContent — messageId, delta (text segment to append)
TextMessageEnd — messageId
TextMessageChunk — convenience wrapper auto-expanding to Start→Content→End

## Tool call events

ToolCallStart — toolCallId, toolCallName, parentMessageId
ToolCallArgs — toolCallId, delta (argument fragment, often JSON)
ToolCallEnd — toolCallId
ToolCallResult — messageId, toolCallId, content, role
ToolCallChunk — convenience wrapper auto-expanding to Start→Args→End

This streaming tool-call triad is the mechanism most commonly used for generative UI in AG-UI hosts: the frontend renders a component keyed on toolCallName and progressively hydrates it from ToolCallArgs deltas before ToolCallResult arrives. This is why A2UI describes AG-UI as "the pipe" and A2UI as "the content."

Important caveat: AG-UI's own documentation does not describe generative UI as a first-class protocol concept. Its architecture page says nothing about UI rendering. Generative UI in AG-UI is an emergent pattern over these events, not a specified feature.

## State management events

StateSnapshot — snapshot (complete state object)
StateDelta — delta (RFC 6902 JSON Patch operation array)
MessagesSnapshot — messages (complete transcript)

## Activity events

ActivitySnapshot — messageId, activityType (e.g. "PLAN", "SEARCH"), content, replace (default true)
ActivityDelta — messageId, activityType, patch (RFC 6902 operations)

## Special events

Raw — event, source (passes external system events through unmodified)
Custom — name, value (protocol extension escape hatch)

## Architecture

A client-server model: the frontend holds the Application and the AG-UI Client; backends host AI agents plus an optional Secure Proxy. A middleware layer provides compatibility through a flexible event structure and transport flexibility, which "allows existing agent frameworks to adapt their native event formats with minimal effort."`
  },
  {
    slug: 'a2ui-a2a-extension-binding',
    title: 'A2UI over A2A: Extension Binding, Agent Cards, and Catalog Negotiation',
    url: 'https://github.com/google/A2UI/blob/main/specification/v1_0/extensions/a2a/docs/a2ui_extension_specification.md',
    category: 'tools',
    system: 'A2UI',
    tags: ['a2ui', 'a2a', 'agent-ui', 'protocol', 'multi-agent', 'catalog', 'design-systems'],
    authority: 'primary',
    status: 'draft-proposal — part of the v1.0 candidate release',
    content: `# A2UI A2A Extension Specification v1.0

The normative binding for carrying A2UI over the Agent2Agent (A2A) protocol — the junction where multi-agent systems meet interface rendering.

Extension URI: **https://a2ui.org/a2a-extension/a2ui/v1.0**

"This URI is the canonical way to communicate protocol versioning between renderers and agents. The extension URI explicitly encodes the version (e.g., v1.0). A renderer requesting this specific URI indicates it supports the v1.0 schema format."

## Optional activation

"A2UI extension activation is optional as renderers and agents can negotiate A2UI support using A2A message.metadata['a2uiRendererCapabilities'] which is attached to every A2A message from the renderer and contains the supported protocol version and catalogs."

## AgentCard advertisement

    {
      "name": "Dashboard Agent",
      "capabilities": {
        "extensions": [{
          "uri": "https://a2ui.org/a2a-extension/a2ui/v1.0",
          "required": false,
          "params": {
            "supportedCatalogIds": [
              "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json",
              "https://my-company.com/a2ui/v1.0/my_custom_catalog.json"
            ],
            "acceptsInlineCatalogs": true
          }
        }]
      }
    }

"params.supportedCatalogIds (optional): An array of strings, where each string is an ID identifying a Catalog Definition Schema that the agent can generate. This is not necessarily a resolvable URI. params.acceptsInlineCatalogs (optional): A boolean indicating if the agent can accept an inlineCatalogs array... If omitted, this defaults to false."

The inlineCatalogs field is the hook by which an organization publishes **its own design system** as the agent's addressable vocabulary. The agent may only reference types present in the negotiated catalog.

## Transport activation

JSON-RPC and HTTP use the X-A2A-Extensions header:

    POST /v1/messages HTTP/1.1
    X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v1.0
    Content-Type: application/json

gRPC adds the extension URI to sendMessageParams.metadata["X-A2A-Extensions"].

Explicit anti-pattern warning: "You should not use accepted_output_modes: ['a2ui'] (which is not an A2UI standard) to trigger A2UI."

## Renderer-to-agent metadata

a2uiRendererCapabilities carries the supported version and catalog IDs on every message.

a2uiRendererDataModel: "When a surface enables Data Model Sync, the renderer sends sendMessageRequest.message['a2uiRendererDataModel'] on every message. This model provides the agent with the latest UI state."

## Data encoding

"Agents and renderers encode A2UI messages as an A2A DataPart. To identify a DataPart as containing A2UI data, it must have the following metadata: DataPart.data.metadata['mimeType'] = 'application/a2ui+json'. The data field contains a list of A2UI JSON messages. It MUST be an array of messages."

## Non-transactional processing — an easily missed rule

"The data field contains a list of messages. This list is NOT a transactional unit. Receivers MUST process messages in the list sequentially. If a single message in the list fails to validate or apply, the receiver SHOULD report/log the error for that specific message and MUST continue processing the remaining messages in the list. Atomicity is guaranteed only at the individual message level. However, for a better user experience, a renderer SHOULD NOT repaint the UI until all messages in the list have been processed. This prevents intermediate states from flickering to the user."

## Trust boundary

"The renderer determines a function's execution boundary (e.g., rendererOnly status) at runtime by reading its configuration from the active catalog definition" — the trust boundary is enforced client-side, not negotiated over the wire.`
  },
];

let written = 0;
for (const entry of ENTRIES) {
  const doc = {
    id: `a2ui-batch-${entry.slug}`,
    title: entry.title,
    source: {
      type: 'url',
      location: entry.url,
      ingested_at: new Date().toISOString(),
    },
    content: entry.content,
    chunks: [],
    metadata: {
      category: entry.category,
      tags: entry.tags,
      confidence: 'high',
      system: entry.system ?? '',
      source_url: entry.url,
      authority: entry.authority,
      ...(entry.status ? { spec_status: entry.status } : {}),
      research_batch: 'agent-ui-2026-08',
      last_updated: new Date().toISOString(),
    },
  };
  writeFileSync(join(OUT, `${entry.slug}.json`), JSON.stringify(doc, null, 2));
  written++;
}

console.log(`wrote ${written} staged entries to ${OUT}/`);
for (const e of ENTRIES) {
  console.log(`  ${String(e.content.length).padStart(6)} chars  ${e.title.slice(0, 66)}`);
}
