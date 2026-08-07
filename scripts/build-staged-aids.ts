/**
 * Generates staged ContentEntry files for the AI-and-design-systems research batch:
 * component contracts, components-as-data, the source-of-truth debate, and the
 * agent-facing file formats (AGENTS.md / SKILL.md / DESIGN.md / manifests).
 *
 * Run: npx tsx scripts/build-staged-aids.ts
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
  authority: string;
  content: string;
}

const ENTRIES: Staged[] = [
  {
    slug: 'component-contracts-and-schemas',
    title: 'Component Contracts and Schemas: Seven Principles (Nathan Curtis)',
    url: 'https://nathanacurtis.substack.com/p/component-contracts-and-schemas',
    category: 'guidelines',
    system: 'EightShapes',
    tags: ['component-contracts', 'schema', 'design-systems', 'ai', 'governance', 'nathan-curtis', 'specs'],
    authority: 'primary',
    content: `# Component Contracts and Schemas

Nathan Curtis (EightShapes), July 28, 2026. Based on 18 months building the Specs schema and tooling.

## What a contract is

"A UI component contract is an artifact that centralizes design intent in one place so that it can be implemented, verified and evolved across implementations."

"A description informs. A contract arbitrates."

"As a contract, a component spec isn't just about recording truth. Instead, a contract arbitrates interpreting truth across each implementing party. In a multi-platform design system, React, iOS, Android, Web Components and – yes – even Figma are all parties to that contract. As a multi-party agreement, no platform owns it and each platform is meant to sign and abide by it through its implementation."

## Schema vs spec

"A schema is the model a contract is written in. It defines what and how to define a component while deliberately saying nothing about any component in particular... A schema models what a contract *can* say. A spec based on that schema is what a contract *does* say."

The two version independently: "The spec's content (there's a Button with a size prop) is versioned, and the schema model (a Component has Props such as an EnumProp) is versioned too, separately... It's this model that makes a component contract being 'wrong' both computable and inarguable."

## The seven principles

**1. Favor well-typed over loosely formed.** "A type declares what kind of value is legal in a given position... A well-typed contract makes it impossible to write malformed things." In a loosely formed document "every value is just text, and text accepts anything, such as size:med or size: kind of large." Also: "contracts are too loosely formed when signals are left to implicit naming conventions" — encoding states as button-primary-hover means "the contract can't verify and hold every implementation accountable."

**2. Favor normalized over redundant.** "Good contracts state each decision once." The button disabled state: a contract states it once as a configuration variant; a Figma button with 96 variants requires 96 more, "maybe 500ish layers – for one simple intent." "A self-contradicting artifact cannot arbitrate anything." "The moment a decision lives in two places, the contract risks disagreeing with itself."

**3. Favor independent over platform biased.** "A definition extracted untransformed from one party's point-of-view (like a Figma file) is testimony, not a contract." Figma's bias shows in "prop types of INSTANCE_SWAP" and "absolute positioning anchored in constraints rather than edges." Neutralizations include expressing padding sides as start/end rather than left/right.

**4. Favor verifiable over readable.** "Verifiable contracts can be evaluated and decided as right or wrong by a machine, without human intervention. Two questions, two levels: is this a validly structured spec, and is it precisely implemented?" "Reading is review, not verification." "Markdown readers are built to tolerate ambiguity... A format where nothing is invalid is a format where nothing is verifiable." On prose: "When prose like 'Depth is achieved through tonal layers rather than heavy shadows' is load bearing, I'm lost. What makes a shadow heavy?... When I can't verify something, I want to delete it. And if deleting that sentence changes the contract, that sentence was bearing too much load."

**5. Favor determinism over inference.** "Determinism means the same input produces the same output, every time. Generate the spec twice with nothing changed, and your diff should be empty." "In 2026, solely markdown formats serving as 'THE System' makes me nervous. Even when a workflow extracts data deterministically to start, agents layering intent through skills and rules inject uncertainty early and invisibly." "That's my line: inference I configure, not inference I hope for."

**6. Favor efficiency over expense to keep true.** "Efficiency means the cost of bringing the contract current is close to zero – in time, in tokens, and in human attention. Not the cost of building it, the cost of keeping it true." "A rotted contract is worse than no contract at all, because people trust contracts." "If you've got 25 simple components on one platform, this doesn't matter and you shouldn't spend on it."

**7. Favor evolvable over simply flexible.** "Strict doesn't mean static. A contract that can't change dies, and a contract that changes without governance was never actually a contract." Architectural Decision Records (ADRs) are "the machinery to evolve component specs. Decisions in ADRs drive new schema versions, keep specs valid, and communicate downstream to consumers."

## On markdown

"Markdown components specs have spread for a reason: anyone can author it, PR tools can review it, agents can read and write it, and no tooling is needed to adopt it. Yet, markdown is loosely structured and not structurally validated, leaving it weak to arbitration and verification."

## Practical payoff

"With a strong contract, component production is supported by scripts that generate 80-90% of the code you need before agents get to work. This leaves agentic inference for last strides, not foundation-up construction."

"Contracts have replaced meetings with automated and verifiable communication and checks... Now we're mass-delivering an entire library's spec from Figma with a single, repeatable command."

## Timeline expectation

"Settling on the correct form(s) of component contracts will take time. JSON schema took two decades. The W3C design tokens community group needed a full decade after tokens hit the scene."`
  },
  {
    slug: 'components-as-data',
    title: 'Components as Data: Anatomy, Props, Styles, Variants (Nathan Curtis)',
    url: 'https://nathanacurtis.substack.com/p/components-as-data-2be178777f21',
    category: 'guidelines',
    system: 'EightShapes',
    tags: ['components-as-data', 'design-systems', 'yaml', 'schema', 'figma', 'ai', 'nathan-curtis'],
    authority: 'primary',
    content: `# Components as Data

Nathan Curtis, September 2025. The foundational piece the 2026 contracts conversation builds on.

## Definition

"A component definition in data is a structured description of a UI component expressed in a neutral format (like YAML or JSON) instead of hard-coded in design tools or platform-specific code. Data breaks a component into parts like an anatomy of elements, props, styles, layout and how each varies when configurations change."

## Anatomy

"A component's elements of various types (like container) organized into a hierarchy comprise its anatomy. Element concepts correspond to platform-specific constructs, such as a Figma FRAME layer or HTML DIV, SPAN, or SECTION."

    anatomy:
      root: {type: container}
      content: {type: container}
      leadingVisual: {type: slot}
      label: {type: text}

## Props

    props:
      disabled: {type: boolean, default: false}
      selected: {type: boolean, default: false}
      state: {type: string, default: rest, enum: [rest, hover, active]}
      leadingVisual: {type: slot, nullable: true, oneOf: [icon, avatar, image]}
      label: {type: string, default: Label}
      accessibilityLabel: {type: string}

"Within a seemingly simple prop list, subtleties complicate conversations for designers expressing ideas in Figma. Aren't disabled and selected technically enumerated VARIANT props with enumerated values for true and false? Yes. Is leadingVisual an INSTANCE_SWAP prop, and don't we need another BOOLEAN prop to control its visibility? Yes (that's how slots work today in Figma)... How do we even represent accessibility labels? Expose a TEXT prop in the Props panel but not visually."

## Styles

Styles mix raw values and token references, and expose gaps in vocabulary: "the element also omits presumed initial values (paddingTop: 0) and has implied values too (layoutSizingVertical must be FIXED because height is set). Even within styling alone, our team's vocabulary must level up to describe concepts we've implicitly used before but never named."

## Scale

"Simple components (Divider) may only need 20–50 lines of data. On the other hand, sophisticated core components like Alert, Text Input or Card often require 500 lines or more."

Even 1,000 lines can be incomplete, lacking: binding configurations to element values; motion and nontrivial interaction; accessibility ("Figma lacks the ability to express in a structured way"); and non-visual configurations like "an Alert's autohide duration or TextArea's maxRows."

"A core.yaml file for a design system's core components may include 30–50 components (and their subcomponents, too) and be 10,000s lines long."

## Why this matters for LLMs

"AI is everywhere, and it favors structured data. So express components that way. An LLM can answer questions about how the component works, compare it to implementations, and propose improvements via prompts. Sure, you could leverage Figma's Dev Mode MCP Server. But beware: that's a stochastic, incomplete, and imprecise component description biased towards one platform (like React) and framework (like Tailwind). More formally approaching component data makes component knowledge reusable, scalable, and consistently interpretable across contexts."

## Auditing

"Data exposes errant design decisions, making components easier to audit… If I had a nickel for every time I detected a raw value in a stray variant when a token is needed, I'd be rich."

Catalog-wide analysis becomes possible: "How and how often is the foundations/color/surface/secondary token used? Are enumerated options for state handled consistently? Are accessibilityLabels applied across all potential cases?"

## Figma as output

"Teams generate Figma assets too. Soon to be gone are the tedious, manual hours to produce countless variants. Instead, Figma component assets can be automated from a component definition in data... designers are increasingly focusing on architecture more and pointing and clicking and dragging and setting values in the Figma UI less."

"Starting with data and treating Figma assets as output rather than input."`
  },
  {
    slug: 'design-system-contracts-neither-figma-nor-code',
    title: 'Design System Contracts: The Component Lives in Neither Figma Nor Code',
    url: 'https://christinevallaure.substack.com/p/design-system-contracts-the-component',
    category: 'guidelines',
    tags: ['component-contracts', 'design-systems', 'source-of-truth', 'figma', 'drift', 'ai', 'governance'],
    authority: 'primary',
    content: `# Design System Contracts: The Component Lives in Neither Figma Nor Code

Christine Vallaure (moonlearning.io), July 16, 2026.

## The problem

"A design system exists twice at once. It is in Figma as components, and it is in code as the real thing engineers ship. Those two are supposed to be the same. They never quite stay that way."

"Most teams try to fix drift by picking a winner. Either the code is the real system, and Figma has to chase it, or Figma is the real system, and code has to chase it. It does not matter which one you pick. **Whichever you crown, the other becomes a copy that someone has to keep updating.** That is not a discipline problem you can train away. It is just what happens when the same thing has to be maintained in two places by two different people."

## The contract

"Instead of treating Figma or code as the real one, you put a third thing in the middle. For each component, we will use a small file; we will stick with the word 'contract'. This could be a JSON or YAML file per component… What options does it have, like a button being primary or secondary? What colours and tokens does it use? What is allowed inside it? What does it do when you click it?… No pictures, no code, simply the agreement about what the component is."

"Both the Figma version and the code version get built automatically from that one little file... Neither is the original. They are both printouts of the same recipe."

"And there is a checker you can run that compares all three: the contract, the Figma library, and the code, and tells you exactly where they have stopped matching."

## Why JSON/YAML rather than markdown

"Because JSON or YAML are text files where everything has a label. A form with boxes, not a paragraph. A markdown file has to be understood, and understanding varies. But a contract only has to match, and **matching is deterministic** and needs same file in, same answer out, every time. So a computer can check the boxes against Figma and against code and tell you exactly where they stopped agreeing. With a paragraph, it can only be read and interpreted, and that is where drift creeps back in."

## The one rule

"Figma and code are never allowed to update each other directly. If a designer changes a colour or an engineer adds an option, that change does not jump straight from one side to the other. It goes into the contract first, gets reviewed like any other edit, and then both sides rebuild from it. One source in the middle, and everyone else follows."

Contrast with Curtis's practice: "Curtis describes going back and forth between Figma and the data... That is a perfectly sensible way to work when a careful human is holding both ends. The contract is betting that once an AI is in the loop, 'we go back and forth' stops being a workflow and starts being a hole."

## Why now: agentic design systems

"When you hand an AI your design system and ask it to build, it does what any unsupervised copy does. It drifts, only faster than a human ever could. In Southleft's own A/B test, an AI left to its own devices scored 69 out of 100. It invented options that did not exist. It hard-coded colours instead of using your tokens. It restyled components to taste. It made work that looked fine and quietly broke the system in ninety places. The same AI, handed the contract as a strict rulebook, scored 100 out of 100. And when it hit something the system truly could not do yet, it said so, instead of faking a version that looked complete."

## What it is not

"It is not Code Connect, and it is not UXPin Merge. Those sync one surface to the other and crown code. The contract crowns neither, which is the whole point."

"It fixes what a component is made of, not what you can build with it. It can tell an AI a Card takes a header, a body and a footer. It cannot tell it what a good pricing card looks like. That takes worked examples, and they sit beside the contract, not inside it. Plenty else stays outside the file. Things like drag, typeahead, focus-trapping, motion, and good CSS. That is still hand-written. Accessibility is the exception; ARIA semantics do sit in the contract."

## On the checker

"What caught my eye is not that the spec builds both sides, that already exists. It is the checker. Style Dictionary has done 'one source, many outputs' for years, but only for tokens. Running it at the component level and proving the two copies still match is the part I had not seen. And it is boring in the right way... it is a compiler, not a model, which is exactly why it cannot get creative."

## Who needs it

"Solo, or a team of three: you do not need this... Enterprise: this fits, and they will get it first... Everyone in the middle, and this is the part my heart beats for: twenty people, eighty, two hundred. Big enough that Figma and code have properly drifted. Too small to pay anyone to keep them together... Both need it, the middle and the top. Only one can run it. So it lands with whoever can staff it, which is exactly the wrong way round."

"It is not a fantasy; tokens made that exact trip. Style Dictionary was an enterprise pipeline until Tokens Studio put it in a panel, and then a two-designer team could use it."`
  },
  {
    slug: 'code-as-source-of-truth',
    title: 'Code Is the Source of Truth (Not Figma): Governance Beyond Figma',
    url: 'https://www.builder.io/blog/governance-beyond-figma',
    category: 'guidelines',
    tags: ['source-of-truth', 'governance', 'design-drift', 'design-systems', 'code-first', 'ci'],
    authority: 'authoritative',
    content: `# Code Is the Source of Truth (Not Figma)

Steve Sewell, CEO of Builder.io, September 8, 2025. The clearest articulation of the code-as-source-of-truth position. Vendor-adjacent (promotes Fusion) but bluntly argued.

## The position

"Figma is, at best, a set of suggestions. All that matters is what makes it into code."

"Even worse, design systems in Figma are a lie. Pretty, collaborative, and full of backdoors and loopholes. It's too easy to override, detach, and forget what the rules even were. Without something watching the code, drift is inevitable, even if everyone means well."

"At scale, manual redlining is a disaster. Every pixel-perfect mockup turns into a game of telephone, and by the time it reaches production, the details have slipped. You can't hire enough designers to chase down every override or one-off, and without automation in the loop, it's just a matter of when things drift, not if."

## Evidence cited

"Shopify found that after a year, 14% of their admin UI had wandered off the Polaris mainline. This was despite strong adoption and a coverage dashboard watching it. Even at Shopify scale, drift creeps in."

"Even Figma knows this is a thing. They literally added 'detached instance' analytics so you can track how often people break away from the system."

"Jeremy Dizon documented his org's detaches doubling in a year when their library lagged. Uber puts it bluntly, by the time you spot inconsistencies, it could be too late."

## How drift spreads

"One bad override can snowball fast. Manual reviews don't scale. Redlines get skipped when the sprint's on fire. Tokens get forked. 'Just for this use case' turns into three variations nobody remembers making. Components get detached. Now you're fixing bugs in five places instead of one."

## The prescription

"The teams beating drift aren't doing it with more process docs, they're baking adherence into their tools. The goal is to make the right way the path of least resistance. **Governance isn't a PDF. It's a loop baked right into your stack.**"

- "One source of truth in code. Shopify uses coverage dashboards and linting tools to keep everything on Polaris mainline."
- "Guardrails, not unlimited freedom. Uber's CI checks block merges when system rules are broken, automatically filing Jira tickets for fixes."
- "Observability. Treat adherence like a quality metric: dashboards, counters, alerts."

"GitHub runs an accessibility and token check on every pull request. Any violations get caught before merge. No big meeting, no finger pointing, just 'fixed in PR.'"

## Intentional vs accidental rule-breaking

"Governance isn't about locking creativity in a closet. Sometimes you need to break the rules, a marketing splash page, a new homepage hero, a one off experimental UI. The difference is intentional vs accidental. Without guardrails, every deviation is an accident. With them, breaking the system becomes a design choice, and you can flip it off when you're done."

"As one of our designers put it, 'I don't want the freedom to reinvent buttons. I want the freedom to actually design.'... The key is that it's a switch, not a permanent fork."

## Note on the wider debate

Practitioners do not generally call this position "code-led." The debate is known as the **single source of truth** question, and as of 2026 it has three articulated positions: code as source of truth (this piece); design tool as source of truth (a position now largely defended by proxy — no strong 2025-2026 primary essay argues it directly); and the contract position, which crowns neither (Nathan Curtis, Christine Vallaure, the DS Contracts spec).`
  },
  {
    slug: 'astryx-working-with-ai',
    title: 'Astryx Design System: Making a Design System Agent-Legible (Meta)',
    url: 'https://astryx.atmeta.com/docs/working-with-ai',
    category: 'tools',
    system: 'Astryx',
    tags: ['ai', 'design-systems', 'mcp', 'agents', 'cli', 'documentation', 'meta', 'machine-readable'],
    authority: 'primary',
    content: `# Working with AI — Astryx Design System (Meta)

Official docs for Meta's open-source React/StyleX design system (MIT, public beta, 160+ components, open-sourced June 2026). Concrete reference implementation of an agent-legible design system.

## The premise

"The design system is built to be AI-friendly: consistent naming, predictable prop patterns, and a CLI that feeds structured documentation directly into AI context windows. But models still need the right context to avoid falling back to generic React patterns or inventing props."

## Setup

    npx @astryxdesign/cli init --features agents

Generates AGENTS.md by default (the tool-agnostic standard). Targets: --agent claude → .claude/CLAUDE.md; --agent cursor → .cursorrules; --agent codex → AGENTS.md.

## The three-step agent workflow it teaches

"astryx template --list: find a related page pattern to use as reference; astryx template <name> --skeleton: study the layout structure; astryx component <Name>: read props and examples for every component used."

"It also includes rules that prevent common mistakes (no raw divs, no style={{}}, use tokens not magic values)."

## The verification test

"Paste this into your AI before writing any component code. These three questions have a **0% pass rate without docs**; models confidently guess wrong on all of them… 1. What is the correct import path for Button? 2. How do you make a Dialog non-dismissible? 3. What prop does Selector use for its items?"

This is the empirical case for a design-system knowledge source: models do not fail gracefully on component APIs, they fail confidently.

## Cursor caveat

"Cursor project rules aren't always picked up; it selects which rules to apply based on relevance. For reliable inclusion, install the design system context as a User Rule instead."

## Token-efficient output

"Every CLI command supports --dense, which outputs a token-efficient format designed for AI context windows."

## MCP server

"Astryx ships a Model Context Protocol (MCP) server... The MCP server exposes two tools: search(query) for discovering components, doc topics, and templates; and get(name) for retrieving full documentation with props, usage, and examples."

    {"mcpServers": {"xds": {"type": "url", "url": "https://astryx.atmeta.com/mcp"}}}

"The server uses the same keyword index from component docs, so search quality improves automatically as component documentation is updated."

## The typed JSON envelope

"Every command supports --json for machine-readable output. Responses are typed envelopes: {"type": "component.detail", "data": {...}}. Errors: {"error": "No component named \\"Buttn\\"", "code": "ERR_UNKNOWN_COMPONENT", "suggestions": [{"name": "Button", "reason": "similar name"}]}"

"The code field is a stable, machine-readable identifier. Branch on it, never on the human-readable error string, which changes freely as we improve wording… Codes are append-only: once shipped, a code's meaning never changes and a code is never removed."

Error codes: ERR_UNKNOWN_COMPONENT, ERR_UNKNOWN_HOOK, ERR_UNKNOWN_TOPIC, ERR_UNKNOWN_TEMPLATE, ERR_NO_DOC, ERR_INVALID_DOC, ERR_PATH_TRAVERSAL, ERR_THEME_INVALID.

## Capability manifest

"Agents don't have to scrape --help to learn the CLI. A single call returns a self-describing manifest: every command, its arguments, flags (with types, choices, and defaults), whether it supports --json, and the response type discriminators each command can emit. **Think of it as an OpenAPI spec for the CLI.**"

## The alias pattern

"AI agents frequently invoke the CLI with incorrect paths, leading to silent failures. Adding an npm script alias with the correct path eliminates this entirely."

## Detail levels

"--detail <level>: brief (names only) < compact (names + 1-line descriptions) < full."`
  },
  {
    slug: 'design-md-philosophy',
    title: 'DESIGN.md Philosophy: Prose, Not Tokens, Carries the Design Intent (Google Labs)',
    url: 'https://github.com/google-labs-code/design.md/blob/main/PHILOSOPHY.md',
    category: 'guidelines',
    system: 'DESIGN.md',
    tags: ['design-md', 'ai', 'design-systems', 'documentation', 'agents', 'google', 'machine-readable'],
    authority: 'primary',
    content: `# DESIGN.md Philosophy (Google Labs)

Official philosophy document in Google Labs' open-source DESIGN.md repo. Apache 2.0, alpha, open-sourced April 21 2026, extracted from Stitch.

## The core claim

"DESIGN.md captures how a design looks, feels, and behaves. The prose is where the design lives. Everything else in the document exists to support it."

"**The quality of a generated design is determined less by the precision of its values than by how clearly the intent is described.**"

## Prose over tokens

"DESIGN.md contains two primary aspects: tokens and prose... The prose is the most vital part of the specification."

"The token values serve as context and are not rendering instructions. Generally, we do not accept or recommend token requirements in the specification. This keeps tokens as context that serves as a reference in the prose and focuses DESIGN.md on documenting the nature of the design and not trying to reinvent the decades long work established by languages and tools that came before us."

Worked example pairs a YAML block with prose: "**Paper** {colors.paper} is the canvas — warmed xerox stock, never pure white. **Ink** {colors.ink} is graphite-warm and carries all typography, all rules, all diagram strokes; never pure black. **Vermilion** {colors.vermilion} is the single accent and appears only inside diagrams and chart annotations — never on typography, never on page numerals, never on metadata of any kind."

## Specific references beat adjectives

"A design that references 'A 1970s graduate lecture handout in the tradition of an old and established university' evokes a complete world: the one color of ink, the generous margins, the serif set at a reading size, and the absence of decoration. That single sentence carries more useful information than a dozen metric values. It carries the reasoning behind the values."

"'Modern, clean, trustworthy, premium' evokes nothing specific. A model creates something in the center of what those words describe, creating an output that is typically generic. **Adjectives describe a region. A specific reference describes a point.**"

## Negative constraints arrive free

"A clear design reference carries its restrictions automatically. A model knows what a lecture handout is, and it knows what a lecture handout is not. It does not glow or use a gradient. You don't have to list these. Naming the object names them, the same way naming a dog tells the model that dogs don't meow. The negative constraints arrive for free when the reference is specific enough. An intentional list of 'don'ts' is useful. A long rambling list is often a sign the description was too vague to carry them."

Sample don'ts: "Don't add a hero moment to the title page... Don't color the page numeral or any other piece of metadata. Vermilion lives in diagrams only... Don't use Bold. Anywhere. Don't introduce dark mode, gradients, glows, glass surfaces, drop shadows, or rounded corners."

## The format grows through its users

"The spec defines the structural minimum that every DESIGN.md shares: a name, and a small set of categories (colors, typography, spacing, rounded, components) that are universal enough to standardize. Everything beyond that minimum is yours to define... The spec standardizes the categories where consistency helps. It leaves open the categories where flexibility helps more: motion, iconography, elevation, text casing, paragraph measure."

## Structure (from README)

Front matter YAML holds machine-readable tokens; the markdown body holds rationale in ## sections. "The tokens are the normative values. The prose provides context for how to apply them."

Canonical section order: Overview (alias Brand & Style), Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts.

Token types: Color (any CSS color), Dimension (number+unit), Token Reference ({path.to.token}), Typography object.

Valid component properties: backgroundColor, textColor, typography, rounded, padding, size, height, width. "Variants (hover, active, pressed) are expressed as separate component entries with a related key name."

Consumer behavior: unknown section heading → preserve, do not error; unknown color token name → accept if value valid; unknown component property → accept with warning; duplicate section heading → error, reject the file.

Eleven lint rules: broken-ref (error), missing-primary, contrast-ratio (WCAG AA 4.5:1), orphaned-tokens, token-summary, missing-sections, missing-typography, section-order, unknown-key, token-like-ignored, omitted-rules.

CLI: lint, diff (exit 1 on regression), export --format json-tailwind|css-tailwind|tailwind|dtcg, and spec ("Output the DESIGN.md format specification, useful for injecting spec context into agent prompts").`
  },
  {
    slug: 'design-system-agent-files-fragmenting',
    title: 'AGENTS.md, SKILL.md, DESIGN.md: The Agent-Facing Design System Layer',
    url: 'https://blog.murphytrueman.com/your-design-system-is-fragmenting-into-agent-files/',
    category: 'guidelines',
    tags: ['agents-md', 'skill-md', 'design-md', 'ai', 'design-systems', 'governance', 'mcp', 'documentation'],
    authority: 'primary',
    content: `# Your Design System Is Fragmenting Into Agent Files

Murphy Trueman, May 15, 2026. The synthesis of the agent-facing file formats and what they do to design system governance.

## The three formats and their dates

"OpenAI released AGENTS.md in August 2025 and donated it to the Linux Foundation's Agentic AI Foundation in December 2025. Anthropic introduced SKILL.md as part of Agent Skills in October 2025 and opened the spec in December 2025... Google Labs open-sourced DESIGN.md on April 21st, 2026, where it remains at alpha. None of these is a formal standard yet, in the W3C or ISO sense. They are open conventions backed by their originating vendors... They are not the same thing, and they don't compete for the same job."

## AGENTS.md — project instructions

"It lives at the root of your code repository, and it tells coding agents how to operate inside the project. Build commands, test commands, lint rules, naming conventions, the things you'd tell a new engineer on their first day. Claude Code is a notable exception, since it still uses CLAUDE.md instead, though the formats are interchangeable in practice."

Precedence differs by tool: "Codex walks from the project root down and lets the closest file win. Cursor merges. Some tools treat the file as always-on context, others load it only when relevant. The format is portable but the behaviour around it isn't fully consistent yet."

"Community best practice converges on under 150 lines... because token cost rises faster than usefulness once a file passes that threshold."

Critically: "**AGENTS.md is not, in itself, documentation about your design system. It's the orchestration layer.** Design system rules are one input among many, and the file's job is to tell the agent where to look for everything else... If you only adopt one of these formats this quarter, AGENTS.md is the one."

## SKILL.md — procedural knowledge

"A Skill is more than a file. It's a directory with a SKILL.md at the top, plus any helper scripts or templates the agent might need to complete the workflow."

Figma's MCP server ships several: "figma-use teaches an agent how to write to the Figma canvas. figma-generate-design walks through building a screen from a description, using your components and variables. figma-implement-design translates a Figma node into production code... figma-create-design-system-rules analyses your codebase and writes out a rules file."

"Each Skill is procedural. It tells the agent how to do something, step by step."

## DESIGN.md — visual identity, condensed

"DESIGN.md is, functionally, a compressed version of your visual style guide, sized to fit in an LLM's context window... It is not, despite the YAML token block at the top, a replacement for a full token architecture. DESIGN.md tokens are a flat agent-facing surface. A DTCG token system carries semantic structure, themes, modes, and tier separation that DESIGN.md doesn't try to encode."

"DESIGN.md matters most to teams using AI design tools (Google Stitch, Lovable, v0) where the agent doesn't have access to your Figma library... If your engineers use Cursor or Claude Code against an existing codebase with components already built, DESIGN.md is less load-bearing."

## The MCP plumbing

"Storybook 10.3 ships an MCP addon that exposes your Storybook content to agents through a Storybook Component Manifest, a JSON file listing components, props, stories, and documentation in a token-efficient format... Zeroheight has its own MCP server doing similar work."

"The pattern across all of these is the same. Take design system content that already exists in a rich human-facing format and expose a structured, machine-readable subset of it to agents through an MCP server. The markdown formats handle the gaps the MCP servers don't cover."

## Prompt injection warning

"Every one of these files is read as agent instructions, which means content inside them can influence what the agent does. Anyone who can edit your AGENTS.md, SKILL.md, or component manifest can shape agent behaviour, and instructions delivered through MCP payloads increasingly need the same review discipline teams already apply to code and CI configuration. **Prompt injection isn't theoretical when your design system documentation is an executable input.**"

## One decision, five places

Tracing a primary colour: the canonical value in a DTCG JSON tokens file compiled by Style Dictionary; DESIGN.md hardcodes it in YAML "with no automatic link back to the JSON"; AGENTS.md references it indirectly through a rule; a Figma Skill encodes the procedure "without storing the value at all"; the Storybook Component Manifest surfaces it as a prop default.

"So the same decision lives in five places now, derivable in principle from the tokens file but rarely derived in practice unless someone has built the pipeline. **The question this raises is governance, not technology.**"

## The empirical benchmark

"Diana Wolosin at Indeed parsed 77 components from MDX documentation and ran an MCP benchmark across 1,056 prompts and eight different metadata configurations... Markdown queries consumed around 30,000 tokens with 82% coverage and visible hallucinations, while JSON delivered higher accuracy with 80% fewer tokens and roughly 5x lower annual cost. These numbers come from one team's setup at Indeed and may not generalise. Her rule of thumb: '**JSON for MCP, Markdown for LLM**.' Structured component data like APIs, props, and variants belongs in JSON. Prose guidance for the model belongs in Markdown."

## Who owns the seams

"A design system team that started 2025 maintaining tokens, components, and a documentation site now maintains a JSON tokens file, a component manifest, an AGENTS.md, possibly a DESIGN.md, possibly a handful of SKILL.md files, and a Zeroheight MCP server endpoint. None of those existed eighteen months ago. None of the existing governance models were designed for them."

"Tokens are usually owned by design systems, and AGENTS.md is usually owned by engineering. Figma Skills configs sit somewhere between design tooling and platform engineering. DESIGN.md, if anyone owns it at all, is owned by whoever wrote it first. **The seams between them are where things break, and there's no role on the org chart whose job is to keep the seams healthy.**"`
  },
  {
    slug: 'storybook-mcp-manifest',
    title: 'Storybook MCP Reads Your Manifest, Not Your Docs Tab',
    url: 'https://rachel.fyi/posts/storybook-mcp-reads-your-manifest-not-your-docs-tab',
    category: 'tools',
    system: 'Storybook',
    tags: ['storybook', 'mcp', 'ai', 'agents', 'documentation', 'design-systems', 'docgen'],
    authority: 'primary',
    content: `# Storybook MCP Reads Your Manifest, Not Your Docs Tab

Rachel Cantor, July 10, 2026. A specific, reproducible failure mode in agent-facing design system tooling.

## The symptom

"I added Storybook's MCP so my agent would stop rebuilding components I'd already shipped. It rebuilt them anyway."

"I was watching an agent plan out a feature when it proposed building a text input and a select menu from scratch. Both already existed in our design system."

## The principle

"Storybook's MCP serves your agent a manifest built from your stories and components... **documentation an agent can't retrieve might as well not exist.**"

"The agent sees the manifest. Not your source, not your Docs tab, not your intentions. The manifest."

## Failure one: empty props

"get-documentation actions-button came back with a complete component and completely empty props. Every prop was there by name. Every description was blank."

"The cause was the docgen extractor. Storybook ships with react-docgen by default, which is fast and does a shallow parse. It couldn't read Button's prop type, an intersection that pulls in ButtonHTMLAttributes plus a [data-\${string}] index signature. Faced with a type it couldn't statically resolve, it returned nothing rather than guessing."

Fix in .storybook/main.ts:

    typescript: {
      reactDocgen: "react-docgen-typescript",
      reactDocgenTypescriptOptions: {
        propFilter: prop =>
          prop.declarations?.some(d => !d.fileName.includes("node_modules")) ?? true,
      },
    }

"react-docgen-typescript runs the TypeScript compiler instead of a shallow parse... The propFilter matters because once you turn the compiler loose, it will happily document all of the HTML attributes Button inherits."

Caveat: "if your components live in a different workspace package than Storybook: the compiler builds its program from the Storybook project's directory, so inherited types from sibling packages won't resolve until you add their source to the include option."

## Failure two: the guidance the manifest never carries

"The props fix solved a question the agent rarely gets wrong: how do I use this component once I've chosen it. It did nothing for the question the agent actually got wrong: **which component do I choose.**"

"I had written real guidance for that. Each component's story carried a short note on when to reach for it and when to reach for something else. Select pointed to Segmented for a short exclusive set, to Toggle for a boolean, to TextInput for free text... This is the single most useful thing I can hand an agent that is about to pick a component. It is the difference between a lookup and a guess. **None of it was in the manifest.**"

"That guidance lived in each story's parameters.docs.description.component, the prose that renders at the top of the Docs tab. It looks great to a human reading Storybook in a browser. The manifest doesn't carry it. I confirmed this by opening the manifest directly, which you can do at http://localhost:6006/manifests/components.json while Storybook runs. Every component's description field came back as an empty string."

"The fix was not clever. I moved that guidance somewhere the agent reads on every session: our CLAUDE.md."

## Failure three: silent staleness

"The manifest mirrors a running dev server. The first time I listed components, it returned a subset and silently left out several form primitives... A Storybook restart refreshed the index and they appeared. The docgen results can cache the same way. When a result looks wrong, cross-check it against your source or git before you act on it. **The manifest is a live mirror, not a fixed artifact, and a stale mirror fails quietly.**"

## What worked

"A standing instruction in CLAUDE.md, never invent props, look them up, plus the MCP itself, made the agent's default behavior resistant to hallucination. It checked before it wrote. The floor was higher than it would have been with no tooling at all. But the floor is not the ceiling."

## The lesson

"An agent only ever sees what your pipeline chooses to surface, and when the pipeline drops something, it drops it silently. Making a codebase legible to an agent is not only about writing good documentation. **It is about writing it where the machine will actually look.**"

## Storybook manifest reference

Per storybook.js.org/docs/ai/manifests: "Manifests are JSON objects that describe the contents of your Storybook in a concise, structured way that is easy for AI agents to understand and use."

Two manifests — components (fields: id, name, path, stories[{id,name,snippet}], import, jsDocTags, description, reactDocgen) and docs/MDX (id, name, path, title, content). All stories carry the manifest tag by default; exclude with !manifest. Debugger at /manifests/components.html.`
  },
  {
    slug: 'informal-contract-is-over',
    title: 'The Informal Contract Is Over: Agents Read Structure, Not Documentation',
    url: 'https://designsystemscollective.substack.com/p/the-informal-contract-is-over',
    category: 'guidelines',
    tags: ['governance', 'design-systems', 'ai', 'agents', 'naming-conventions', 'infrastructure', 'drift'],
    authority: 'primary',
    content: `# The Informal Contract Is Over

Shane P Williams, Founding Editor, Design Systems Collective. Issue #66 editorial, May 11, 2026.

## The informal contract

"A promise is a strong word. Most teams reach for softer language: guidelines, patterns, recommendations, standards. We build component libraries with the implicit hope that people will follow them, and we write documentation with the quiet understanding that most of it will not be read. We have grown comfortable with the gap between intention and adoption, and we have learned to call that gap 'maturity.'"

## Why it closes now

"But the gap is closing, and not because teams have suddenly become more disciplined. It is closing because **agents do not read documentation. They read structure.** They read naming. They read the shape of the API and the logic encoded in the token. When a machine consumes your design system, it does not interpret intent. It executes whatever you actually built, not what you meant to build. The informal contract that humans could navigate by instinct becomes a hard boundary an agent will test without mercy."

## What changes

"Naming conventions that were always best practice are now functional interfaces. Tokens that drifted quietly for months are now producing inconsistent outputs at scale. A codebase that bypassed the system for the sake of speed is now a liability that compounds with every agent-generated pull request. The work that teams quietly deferred has not gone away. It has simply become more visible, and considerably more expensive."

"The question worth sitting with is not whether your design system is ready for AI. **It is whether it was ever as solid as you thought it was.**"

## Infrastructure, not relationship

"For years, design systems succeeded on a kind of social contract: if the documentation was good enough, and the components were well-named enough, and the team trusted each other enough, things would mostly hold. That was never a system. It was a relationship."

"Token drift does not announce itself. A codebase bypass does not file a ticket. A poorly named property does not fail loudly; it just produces subtly wrong output for long enough that nobody remembers the original intention. These are not new problems. They are old problems that have finally become legible."

"**Infrastructure does not rely on goodwill. It is either load-bearing or it is not.** And teams that have been building systems as though they were living documents, maintained by people who understand their nuance, are now discovering that nuance does not transfer to the next team, the next platform, or the next generation of tooling that will consume their work. The components were always promises. Most teams just never had to honour them at scale."

## Adjacent practitioner work named in the same issue

George William Amalan, "Your Design System Is Not Failing. Your Codebase Is Bypassing It." (ESLint rules, Style Dictionary config, enforcement patterns).

Murphy Trueman, "Every component in your design system is a promise" (contracts vs documentation, typed props, semantic tokens, structural specs).

Daniel Klinke, "Naming conventions were important. AI agents made them essential." — "property names, boolean prefixes and slot naming become the API an agent reads."

Yogesh Shetty, "Design systems are evolving. Our migration tools aren't." (Token Map, deep token detection, weighted matching, scope awareness).

Shane P Williams, "The Layer Nobody Documented" — the community shift "from thinking about design systems as a product to recognising them as infrastructure."`
  },
];

let written = 0;
for (const entry of ENTRIES) {
  const doc = {
    id: `aids-batch-${entry.slug}`,
    title: entry.title,
    source: { type: 'url', location: entry.url, ingested_at: new Date().toISOString() },
    content: entry.content,
    chunks: [],
    metadata: {
      category: entry.category,
      tags: entry.tags,
      confidence: 'high',
      system: entry.system ?? '',
      source_url: entry.url,
      authority: entry.authority,
      research_batch: 'ai-design-systems-2026-08',
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
