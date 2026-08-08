/**
 * Staged entries: AI prototyping tools' design system features (Bolt.new,
 * Claude Design, Google Stitch, Subframe) + the prototype-to-production shift.
 * No backticks in content strings.
 *
 * Run: npx tsx scripts/build-staged-prototyping.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'content/staged';
mkdirSync(OUT, { recursive: true });

interface Staged {
  slug: string; title: string; url: string; category: string;
  system: string; tags: string[]; authority: string; content: string;
}

const ENTRIES: Staged[] = [
  {
    slug: 'bolt-design-system-agents',
    title: 'Bolt.new Design System Agents: Internal Storybook From Your Source Files',
    url: 'https://support.bolt.new/building/design-system/add-design-system',
    category: 'tools',
    system: 'Bolt.new',
    tags: ['bolt', 'stackblitz', 'ai-generation', 'design-systems', 'storybook', 'npm', 'ai-tools'],
    authority: 'authoritative',
    content: `# Bolt.new Design System Agents

Bolt's "Design System Agents ingest all the source files that define your company's visual identity into Bolt.new." The framing device is eliminating the "translation tax" — the weeks engineers spend rebuilding prototypes mocked outside the production stack.

## The promise

Once integrated, generated code has: "Every button, navbar, form, and input is an existing, approved component pulled directly from your library" (not a hallucinated element); references to actual "design tokens instead of guessing at hex colors or magic numbers"; and "file structure, import paths, and naming patterns match your production codebase exactly."

## The mechanism: a generated internal Storybook

Bolt ingests your sources and generates an internal Storybook — a catalog holding "your UI components in one place, separate from the rest of your app." This is the architecturally distinctive choice: rather than reading your library at generation time, Bolt builds a canonical component catalog once.

## Source types

1. **Files** — up to 10 PDFs, images, or documentation files, or a .zip directory
2. **Websites** — publicly accessible documentation URLs (non-public sites converted to .zip)
3. **GitHub** — public repositories containing design system code or docs
4. **Storybook** — URLs of published Storybook instances
5. **NPM** — public registry package names or npmjs.com URLs, OR a private registry configured with registry URL, authentication token, and optional scopes

"Optional Agent Instructions add contextual guidance such as 'Exclude deprecated components.'"

Source-quality guidance, verbatim: "source quality directly affects your results" — GitHub repos and npm packages yield better outcomes than documentation websites alone.

## Constraints

- Paid Team plans only
- "Each team can add or sync a maximum of 10 design systems weekly"
- Setup takes 45-60 minutes depending on source complexity

## Usage

Click "Design System" in the chat toolbar when starting a project; the system applies components, spacing, typography, and colors throughout. For existing projects, design systems attach/detach via gear icon; attaching "doesn't automatically modify existing code" — you must prompt updates.

The documented optimization is a precise-prompt pattern: instead of "Update my project to use the design system," say "Update all uses of the PrimaryButton to use the design system component, but leave the layout the same." Users can tag components with the @ symbol to reference design system elements directly in prompts. Bolt recommends its Max agent for complex design system work.

## Where Bolt sits among the AI generators

Bolt has the deepest ingestion pipeline of the prompt-to-app cohort (files/URLs/GitHub/Storybook/public+private npm → generated internal Storybook), and its team-level private-npm auth is the mechanism the Typeform case study found decisive. Like every tool in this category it is forward-only (attaching does not migrate existing code) and constrains through catalog + prompts rather than hard component-level enforcement.`
  },
  {
    slug: 'claude-design-capabilities',
    title: 'Claude Design: Design System Import, Self-Checking, and the Claude Code Round-Trip',
    url: 'https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design',
    category: 'tools',
    system: 'Claude Design',
    tags: ['claude-design', 'anthropic', 'ai-generation', 'design-systems', 'claude-code', 'mcp', 'ai-tools'],
    authority: 'authoritative',
    content: `# Claude Design (Anthropic Labs)

Launched April 17, 2026 as an Anthropic Labs research preview: "collaborate with Claude to create polished visual work like designs, prototypes, slides, one-pagers, and more," powered by Claude Opus 4.7. Over one million people used it in its first week.

## How the design system is supplied

"Attach or import your design system from a GitHub repo, design files, raw uploads, or your local codebase." Acceptable inputs:
- **Codebases** — "If your design system lives in code (for example, a React component library), you can link or upload the repository"
- **Prototypes** — screenshots, web flows, design files
- **Documents** — PowerPoint, PDF, slide decks
- **Individual assets** — logos, color palettes, typography specimens

During onboarding "Claude builds a design system for your team by reading your codebase and design files," generating color palettes, typography, components, and layout patterns. You validate with sample prompts, then toggle "Published" to deploy it to all team projects.

## Enforcement and governance

Claude builds using actual components and "checks its own output against your design system" before displaying results — a self-check step comparable to the validation passes practitioners bolt onto other tools by hand.

A Claude Design Admin role can "approve a standard system and lock down edits." Teams can maintain more than one design system.

## The Claude Code round-trip — two mechanisms

1. **The /design-sync command** in Claude Code (v2.1.181+) pulls your design system into Claude Design, and production-ready designs "hand off to Claude Code, which continues from your existing work instead of starting over from a screenshot."

2. **An MCP server.** Config: claude mcp add --scope user --transport http claude-design https://api.anthropic.com/v1/design/mcp — after /design-login, you can "import a design into your codebase, export your code as a live prototype."

The bidirectional handoff (design → code that continues existing work, and code → live prototype) is the distinguishing capability: most tools in this space hand off a screenshot or a static bundle, forcing a rebuild.

## Refinement (Remix)

Refinement happens over the design system itself via "Remix," a chat interface. Three modes: chat (broad changes), inline comments (component-level), and direct WYSIWYG canvas editing ("rich layout controls for quick visual and aesthetic shifts").

## Export

.zip, PDF, PPTX, standalone HTML; integrations with Adobe, Canva, Gamma, Lovable, Miro, Replit, Vercel, Wix; and handoff to Claude Code (local agent or web).

## Documented limitations

Inline comments occasionally fail to persist; large codebases cause lag; web/desktop only; multi-person simultaneous editing unreliable; and "design system quality depends on source material."

Practitioner corroboration (Nick Babich, UX Planet), testing IBM Carbon: three import paths — GitHub link, .fig upload, or individual files — with the headline finding "Claude Design works better when importing a design system from GitHub than Figma." This matches the broader pattern across the AI-generator landscape: code is a higher-fidelity design-system source than the design file.`
  },
  {
    slug: 'google-stitch-design-md-mcp',
    title: 'Google Stitch: DESIGN.md Generation and Design Systems as MCP API Objects',
    url: 'https://stitch.withgoogle.com/docs/design-md/overview/',
    category: 'tools',
    system: 'Google Stitch',
    tags: ['stitch', 'google', 'design-md', 'ai-generation', 'mcp', 'design-systems', 'ai-tools'],
    authority: 'primary',
    content: `# Google Stitch: DESIGN.md and the Design System MCP

## DESIGN.md as the design counterpart to AGENTS.md

"Every project has a visual identity... Traditionally, this lives in a Figma file, a brand PDF, or a designer's head. None of these are readable by an AI agent. DESIGN.md changes that. It's a plain-text design system document that both humans and agents can read, edit, and enforce."

The comparison the docs draw:
- README.md — Humans — "What the project is"
- AGENTS.md — Coding agents — "How to build the project"
- DESIGN.md — Design agents — "How the project should look and feel"

"When a design agent like Stitch reads your DESIGN.md, every screen it generates follows the same visual rules... Without it, each screen stands alone. With it, they look like they belong together."

## Two layers

"Under the hood, every DESIGN.md has two layers: YAML front matter containing machine-readable design tokens (exact hex values, font properties, spacing scales) and a markdown body providing human-readable design rationale. **Tokens give agents precise values. Prose tells them why those values exist.**"

"DESIGN.md is a living artifact, not a static config file. It evolves as your design evolves. The agent generates it, you refine it, and it's re-applied to screens as you iterate."

Permissive by design: "The DESIGN.md spec is a foundation, not a prescription... Unknown sections and custom tokens are accepted, not rejected."

## Three creation paths

1. Agent-generated from a vibe prompt ("A playful coffee shop ordering app with warm colors, rounded corners, and a friendly feel")
2. Derived from branding ("provide a URL or image. The agent extracts your palette, typography, and style patterns")
3. Hand-authored ("just markdown with optional YAML front matter... No special syntax")

## Design systems as first-class MCP API objects

The Stitch MCP server (https://stitch.googleapis.com/mcp) exposes a dedicated Design Systems tool group, making design systems drivable from any MCP client:
- **create_design_system** — "Creates a new design system with foundational design tokens" (takes a display name and theme, optionally associated with a project)
- **update_design_system** — takes the asset resource name, project ID, updated content
- **list_design_systems**
- **apply_design_system** — "Applies a design system to one or more screens" (takes project ID, screen instances, and the design system asset ID)

Plus generation tools: generate_screen_from_text (models GEMINI_3_FLASH or GEMINI_3_1_PRO), edit_screens, generate_variants.

Auth: API keys, or OAuth via the Google Cloud SDK. Claude Code config: claude mcp add stitch --transport http https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: api-key" -s user.

## Significance

Stitch treats the design system as a queryable, mutable API resource rather than a file or an upload — create/update/list/apply as MCP tools. Combined with DESIGN.md's generate-refine-reapply loop, it is the fullest expression of the "design system as agent-addressable object" idea, and the practical anchor under the DESIGN.md format that Google Labs open-sourced separately.`
  },
  {
    slug: 'subframe-design-system-native',
    title: 'Subframe: Design-System-Native Canvas With One-Way CLI Sync',
    url: 'https://docs.subframe.com/concepts/syncing-components',
    category: 'tools',
    system: 'Subframe',
    tags: ['subframe', 'ai-generation', 'design-systems', 'react', 'tailwind', 'radix', 'ai-tools'],
    authority: 'primary',
    content: `# Subframe: Design-System-Native by Construction

Where Bolt, v0, and Claude Design *import* a design system, Subframe *is* one — the canvas holds real components and generation is constrained by construction rather than by prompt.

## Positioning

"Maintain a single source of truth that always reflects what's in production." "Unlike Figma's dev mode, Subframe is built with real React and Tailwind CSS components your developers can actually use." "From design tokens to custom fonts, Subframe's theming system updates your components in one click."

AI generation "generates within a defined design system to ensure all designs stay consistent" — the canvas has real components with props, slots, and variants, and every layer maps to React/Tailwind code. Because the palette of available components is the design system, the model cannot generate off-system UI.

## The sync mechanism

Sync all components with npx @subframe/cli@latest sync --all, or specific ones with npx @subframe/cli@latest sync Button Alert Accordion.

**"Sync is one-way from Subframe to your codebase. Local changes to synced files will be overwritten on the next sync."**

Components sync as a two-file pattern:
- **Button.tsx** — Subframe-generated source, receives updates
- **index.tsx** — your wrapper, safe to edit

An @subframe/sync-disable comment marker prevents CLI overwrites per file ("the marker applies per file, so which file you add it to matters"). Business logic is added via slots (handlers through nested component props) or by editing the wrapper; interactive behavior is built on Radix, and components "pass through props to the top-level element."

First-time setup is npx @subframe/cli@latest, which configures CSS and npm dependencies interactively.

## Where it sits

Subframe answers the source-of-truth question differently from the import-based tools: the design system lives in Subframe, one-way-synced into code, with a documented override marker (@subframe/sync-disable) and a wrapper file as the seam between generated and hand-written code. It is Radix-based underneath, joining shadcn, Radix Themes, and much of the code-first ecosystem on the same accessibility substrate.

Figma sync exists ("so your designs are pixel-perfect"). Note: the official syncing docs mention no MCP integration; third-party reviews describe a Subframe MCP for coding agents, which should be treated as unverified against official docs.`
  },
  {
    slug: 'prototype-to-production-shift',
    title: 'From Prototype to Production: Making AI Tools Use Your Real Design System (Typeform)',
    url: 'https://medium.com/typeforms-engineering-blog/from-prototype-to-production-how-we-made-ui-prototyping-tools-use-our-design-system-dda3a8bd6406',
    category: 'guidelines',
    system: 'Typeform',
    tags: ['prototyping', 'ai', 'design-systems', 'workflow', 'case-study', 'npm', 'machine-readable'],
    authority: 'community',
    content: `# From Prototype to Production: Making UI Prototyping Tools Use Our Design System

Waqar Ali, Typeform R&D blog, August 2025. The strongest primary articulation of the mock-first → production-design-system shift, with concrete mechanics.

## The prototyping paradox

Prototyping tools (Lovable, v0, Bolt) excelled at rapid functionality but produced "generic visual styles," creating two failures:
1. Prototypes lacked visual fidelity for accurate user testing
2. Their code didn't use Typeform's Echo Design System components, forcing engineers to "re-implement all the visual and functional code from scratch"

A prototype that looks generic tests the wrong thing, and a prototype built off-system is thrown away. The value of the prototype is destroyed at the handoff.

## The solution: a shared Design System Knowledge Markdown

Typeform reused an existing "Design System Knowledge Markdown" file — originally written to teach AI Figma-to-code conversion — documenting "all available components... design tokens, and usage examples." They loaded it into each prototyping tool's knowledge base so tools generate with correct Echo components from inception.

The reuse is the insight: the same machine-readable design system description serves Figma-to-code, prototyping tools, and coding agents. Write the agent-facing documentation once; point every tool at it.

## The decisive technical hurdle: private npm auth

The blocker was private npm registry access. "Bolt.new let teams set the access token once at the team account level," enabling installation of the private Echo package into every project. Bolt's "globally available knowledge base that can be shared across a team" meant new projects automatically inherited design system understanding.

This is why the case study lands on Bolt for the deepest integration — team-level credential storage plus a shared knowledge base is exactly what turns "the model knows about our system" into "the model installs and uses our actual package."

The approach worked across Lovable, v0, Bolt.new, Figma Make, and Claude Code.

## Results

- Complex interaction prototyping dropped from "1-2 days" to minutes (~3 hours saved per feature)
- "1-2 weeks" saved in early-stage concept phases
- Hackathon participants without engineering backgrounds "designed, built, and demonstrated" working concepts
- **Prototypes became "functional, on-brand starting points for production code" rather than throwaway mockups** — engineers now focus on "business logic and complex functionalities"

## The shift, stated

The change is not "AI can prototype faster." It is that the prototype stops being disposable. When the prototype is built from the production design system, the handoff is a continuation instead of a rebuild — which is the same conclusion the contract, parity, and CBDS literature reaches from other directions.`
  },
];

let written = 0;
for (const e of ENTRIES) {
  writeFileSync(join(OUT, `${e.slug}.json`), JSON.stringify({
    id: `proto-${e.slug}`,
    title: e.title,
    source: { type: 'url', location: e.url, ingested_at: new Date().toISOString() },
    content: e.content,
    chunks: [],
    metadata: {
      category: e.category, tags: e.tags, confidence: 'high', system: e.system,
      source_url: e.url, authority: e.authority,
      research_batch: 'prototyping-2026-08', last_updated: new Date().toISOString(),
    },
  }, null, 2));
  written++;
}
console.log(`wrote ${written} staged entries`);
for (const e of ENTRIES) console.log(`  ${String(e.content.length).padStart(6)}  ${e.title.slice(0, 64)}`);
