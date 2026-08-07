/**
 * Staged entries for the source-of-truth / agentic-design-systems batch.
 * Run: npx tsx scripts/build-staged-sot.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'content/staged';
mkdirSync(OUT, { recursive: true });

interface Staged {
  slug: string; title: string; url: string; category: string;
  system?: string; tags: string[]; authority: string; content: string;
}

const ENTRIES: Staged[] = [
  {
    slug: 'source-of-truth-three-camps',
    title: 'The Design System Source-of-Truth Debate: Three Camps, Not Two',
    url: 'https://ds-contracts-spec.pages.dev/',
    category: 'guidelines',
    tags: ['source-of-truth', 'code-led', 'design-led', 'figma', 'design-systems', 'governance', 'contracts', 'debate'],
    authority: 'reference',
    content: `# The Source-of-Truth Debate: Three Camps, Not Two

Practitioners rarely use the terms "code-led" and "design-led." The articulated debate is about the **canonical source of truth**, and as of 2026 it has resolved into three positions, not the two the framing implies.

## Camp 1 — Demote Figma

Figma keeps token management, visual exploration, and stakeholder communication, but loses canonical status. Represented by:

- **JumpCloud Design (Burak Başcı), April 2026** — "Figma is upstream now. The system is the truth." The pipeline "design → handoff → code rebuild" is replaced by "design system as truth → AI-generated implementation." Two steps vanish: handoff and rebuild.
- **Sam Henri Gold, April 2026** — "Why fuss around in a lossy approximation of the thing when you can work directly in the medium where it will actually live?"
- **Joshua Hall, October 2025** — inverts the pipeline so Figma components are *generated from* production code.

## Camp 2 — Refuse the dichotomy (Figma's own position)

Figma does not argue "Figma is the source of truth." At Config 2026, Dylan Field's framing was **"Code is material, just like images, vectors and design layers."** Code layers put code *on the canvas* rather than downstream of it. The company's answer to the demotion argument is to dissolve its premise rather than rebut it.

## Camp 3 — Neither surface; an arbiter between them

The strongest signal in this space is that three unrelated efforts converged here independently:

- **DS Contracts spec** — "A design system's truth should live in a machine-readable contract that sits between the surfaces and generates both."
- **Design System Doc Spec (PJ Onori)** — "A design system's source of truth should survive any rebuild, reorg, or rethink."
- **IBM Carbon MCP** — the MCP server is the "shared source of truth" serving designers, developers, and PMs alike; Figma and code are both clients of it.

## Why the two-camp framing keeps failing

The DS Contracts spec has the sharpest diagnosis. Two organizational starting points converge on an identical failure:

1. Code-side origin: "the system is an npm package, and the design files are an aging picture of it."
2. Design-side origin: "the system is a canvas library, and the code is an approximation of the pictures."

The conclusion: **the choice itself is the bug.** Whichever surface is declared canonical, the other becomes a hand-maintained copy — and "copies drift. Drift erodes trust." Both answers are structurally identical, differing only in which surface absorbs the drift.

## A notable absence

No practitioner was found arguing *"Figma remains canonical"* in those words for 2025-2026. The closest thing to a pro-Figma position is structural rather than declarative: Figma's own "false debate" framing, and Christine Vallaure's question that the code-first camp does not answer — **"Where does visual truth live?"** As she puts it: "Tests tell you if it works. They do not tell you if it looks right, feels like the brand."

The affirmative pro-Figma case appears not to be being made. The vendor is reframing instead of defending. That absence is itself a finding.`
  },
  {
    slug: 'agentic-design-systems-contested',
    title: 'Agentic Design Systems: A Contested Term With Two Incompatible Definitions',
    url: 'https://www.thedrum.com/opinion/what-the-fuck-is-an-agentic-design-system',
    category: 'guidelines',
    tags: ['agentic-design-systems', 'ai', 'design-systems', 'terminology', 'generative-ui', 'definitions'],
    authority: 'primary',
    content: `# Agentic Design Systems: A Contested Term

The phrase is real and in active use, but it is **not a settled concept**. No coiner is identifiable, and the two most credible primary articulations define it incompatibly. Treat it as contested vocabulary, not settled terminology.

## Definition A — automation and access (Luis Ouriach, December 2025)

"A design system enhanced with AI capabilities that can automate routine tasks and accelerate the design-to-development process for anyone involved."

The emphasis is on **democratizing contribution**: designers contributing code, product managers building prototypes, engineers refining interactions in high-fidelity prototypes. The barrier being dissolved is the discipline boundary around who can touch the system.

Ouriach positions design systems as organizational enablers that "operate as central sources of truth, radiating outward across departments." Scope is deliberately expansive — email templates, website layouts, product interfaces, sales decks, tone-of-voice standards — under the principle "meet them where they are."

Terminology he introduces: **product systems / blueprints** (broader than "component library"); **AI-native experiences** (built for AI from the ground up rather than retrofitted); MCP servers framed as a *trust* mechanism for design-to-engineering handover, not merely a data pipe.

One checkable claim: teams using Tailwind CSS are "currently better placed to integrate AI-generated code," because Tailwind is disproportionately represented in LLM training data.

## Definition B — runtime generative behavior (Laurel Burton, CEO of Instrument, April 2026)

"A framework that defines how experiences are generated, not just how they look. It's a set of principles, behaviors and rules."

This is a **personalization** framing, not a tooling framing. Burton's agentic design system is about runtime generation of experiences for end users — not about AI agents writing component code. The distinction is between authoring a bounded number of static variations and defining a system that can "generate an infinite number of experiences, each shaped by the person on the other side of it."

Her refrain: **"It's not components. It's behavior."** The system decides "what shows up, how it shows up and in what format, order and tone."

She is pointed about AI's limits: **"AI will just figure it out. It won't."** Designers must define brand expression, information structure, and the adaptive rules. Generative capability executes judgment; it does not supply it.

## The term is drifting, per its own advocates

Burton concedes directly that the phrase "started drifting into that dangerous territory, where it sounds smart, feels important and yet somehow leaves everyone a little more confused." That is the best citable evidence that the term is under-specified.

Neither author cites the other.

## The substantive adjacent work is called something else

Machine-readable design systems; design system contracts; AIX (AI Experience); MCP-exposed design systems; agent-legible naming. When precision matters, those terms carry more meaning.

## An unresolved tension worth preserving

Burton argues the system must be **defined first, documented last** — inverting the conventional lifecycle where a design system is extracted retroactively from shipped work.

Christine Vallaure argues the opposite: the system is **"a distilled finding"** that must emerge from designing real pages. "Designing the whole page is where the finding happened and hence not redundant."

Direct contradiction. Both defensible.`
  },
  {
    slug: 'figma-no-longer-source-of-truth',
    title: 'Figma Is No Longer the Source of Truth (JumpCloud / Circuit DS)',
    url: 'https://medium.com/@jc-design/figma-is-no-longer-the-source-of-truth-adb89feabafb',
    category: 'guidelines',
    system: 'JumpCloud',
    tags: ['source-of-truth', 'figma', 'code-led', 'storybook', 'cursor', 'code-connect', 'design-systems'],
    authority: 'primary',
    content: `# Figma Is No Longer the Source of Truth

Burak Başcı, writing as JumpCloud Design, April 7 2026. A report on a workflow that already shipped, not a manifesto.

## Thesis

**"Figma is upstream now. The system is the truth."**

The dismantled pipeline: "design → handoff → code rebuild." What replaced it: "design system as truth → AI-generated implementation." Two steps vanished outright — the handoff and the rebuild.

Figma is not discarded. It retains three roles: token management, visual exploration, and stakeholder communication. What it loses is canonical status. The distinction is between being an *input to* the system and being *the* system.

## The precondition: exact parity

Not optional decoration but the load-bearing requirement: **"Every spacing token matches between Figma and implementation. Every component prop maps one-to-one."** Colors and typography likewise.

The enforcement mechanism is **Figma Code Connect**, binding design files directly to their implementation files. The payoff is stated in terms of agent behavior: once Code Connect is in place, the Figma MCP Server can output complete, accurate component data **without interpretation** — the agent is not guessing at a mapping, it is reading a declared one.

## The experiment

The team assembled a repository containing Circuit DS, Storybook, and real component examples, then prompted Cursor against it. Cursor generated full page layouts using the correct components, tokens, and spacing without manual intervention.

The framing of the result: this moved the effort "from exploratory to production-ready." The claim is not that AI produced something interesting but that it produced something *shippable*, and that the difference was attributable to how the system was structured rather than to the model.

## Storybook replaces Figma's working layer

The most easily underweighted point. Storybook replaces not Figma's documentation layer or its exploration layer, but the surface where the team actually works out decisions together.

The reason is a quality argument, not a tooling preference: in Storybook, **"design decisions become real constraints."** Responsive behavior is genuinely responsive; spacing rules are genuinely enforced. A static Figma artifact permits a designer to fake a behavior that will not survive implementation; a live component does not.

Truth is located where things can fail.

## Cursor as execution layer

It required teaching, not merely pointing. The team wrote detailed instructions covering component selection, layout patterns, spacing application, and — significantly — where the system's boundaries are and how to respect them.

The boundary-respect instruction matters: the enforcement problem does not disappear under agentic workflows, it **relocates from lint rules into agent instructions**.

## Where design judgment goes

Explicitly non-declinist. Designers' importance is not diminishing, it is shifting upstream. The named skill that now matters: "understanding how to structure a design system so AI can execute it reliably." Design judgment is encoded into system architecture rather than expressed in individual screens.

Next phase described: attaching business logic scaffolding, moving from "prompt to page" toward "prompt to page to API hooks to logic skeleton."`
  },
  {
    slug: 'ds-contracts-spec',
    title: 'DS Contracts Spec: One Arbiter Between Surfaces, With Published Limits',
    url: 'https://ds-contracts-spec.pages.dev/',
    category: 'guidelines',
    tags: ['component-contracts', 'source-of-truth', 'design-systems', 'specification', 'dtcg', 'determinism'],
    authority: 'primary',
    content: `# Design System Contracts — Open Specification

The most rigorous articulation of the "neither Figma nor code" position, and unusual in the genre for publishing adverse numbers about itself.

## Central claim

**"A design system's truth should live in a machine-readable contract that sits between the surfaces and generates both."**

## The diagnosis

Two organizational starting points converge on an identical failure:

1. Code-side origin: "the system is an npm package, and the design files are an aging picture of it."
2. Design-side origin: "the system is a canvas library, and the code is an approximation of the pictures."

The conclusion drawn is that **the choice itself is the bug**: whichever surface is declared canonical, the other necessarily becomes a hand-maintained copy — and "copies drift. Drift erodes trust."

## The governance rule

**"Surfaces never sync side-to-side."**

Changes originating in either surface flow *through* the contract, appear as reviewable diffs, and are regenerated outward. "One arbiter, version-controlled." The explicit purpose is to eliminate bidirectional sync conflicts, the standard failure of every design-tool-to-code sync product.

## Four foundational positions

- **Bidirectional** — generation flows both ways; "round-trips are proven, not promised."
- **Deterministic** — "Every artifact is computed from file data and byte-pinned; **no LLM guesses in the pipeline**." A deliberate rejection of LLM-in-the-loop translation.
- **Receipted** — gaps are "named on screen" rather than "papered over with a plausible value." The anti-hallucination stance as a product principle: when the contract cannot determine something, surface the gap, do not emit a confident guess.
- **Open** — "the schema, the engine, and every instrument that verifies them are in one repository under one permissive license, with no gated tier."

## Structure

"One small, versioned JSON document per component," containing: props and their legal values (with enum constraints); anatomy, meaning structure plus token bindings; accessibility semantics; declared events; and bindings to **both** surfaces — Figma VARIANT properties on one side, code prop mappings on the other.

The worked example is a banner whose \`status\` prop carries the enum \`info | success | warning | error\`, with that single enum binding simultaneously to a Figma variant property and a code prop. This makes the "generates both" claim concrete rather than rhetorical.

## The measurements — including the adverse one

- 89.6% mean computed-style equality across 54 third-party components, over 379,861 tested cells
- 92.70% conversion accuracy from Figma to code across 537 variants
- **Stated limitation: those 54 components represent only 6.0% of the 893 components examined — characterized as "the tractable ones."**

That admission is the honest counterweight to the spec's own thesis: the contract approach is demonstrated on the tractable 6%, and the hard 94% remains open.

## Operational adoption

51 component contracts in active use; 282 DTCG design tokens shared across surfaces; 188/188 deterministic evaluations passing; 1,618/1,618 enterprise kit sets imported cleanly. The token layer is DTCG-aligned, not proprietary.`
  },
  {
    slug: 'design-system-doc-spec',
    title: 'Design System Doc Spec: Machine-Readable Documentation With an agents Section',
    url: 'https://designsystemdocspec.org/',
    category: 'documentation',
    tags: ['documentation', 'specification', 'machine-readable', 'agents', 'design-systems', 'schema', 'pj-onori'],
    authority: 'primary',
    content: `# Design System Doc Spec (v0.15.2)

Maintained by PJ Onori. Draft dated 16 July 2026. The direct structural counter-argument to the Markdown-file approach (DESIGN.md, AGENTS.md, and the general proliferation of agent files).

## Governing principle

**"Documentation shouldn't have to pick a side. Humans, parsers, and agents all need the same docs."**

The objective: "one source of truth that feeds your docs, trains your agents, and reaches every touchpoint." Note the verb — *trains* your agents, not merely informs them. Documentation is treated as agent training surface, not reference material.

## The durability criterion

**"A design system's source of truth should survive any rebuild, reorg, or rethink."**

This is a distinct argument from the Figma-vs-code debate: the source of truth should not be *any tool*, because tools are exactly the things that do not survive reorgs.

## Structure

**Entities** map to the recognizable furniture of a design system: components, design tokens, themes, foundations, patterns, and guides.

**Document blocks** are modular content chunks, "mostly interoperable" across entity types — so components and tokens share an identical guidance schema rather than each inventing their own. 17 block kinds: guidelines, use-cases, api, states, motion, accessibility, anatomy, checklist, content, design-specifications, interactions, principles, scale, sections, steps, variants.

Metadata fields: aliases, category, governance, last-updated, links, preview, status, summary, tags, thumbnail.

## The agents section — no equivalent in conventional documentation tooling

Reserves structured space specifically for machine consumers, with five fields:

- **intent** — the component's core purpose, stated for an agent rather than a designer browsing a site
- **constraints** — "must" and "must-not" rules governing appropriate usage
- **disambiguation** — explicitly distinguishing components an agent will otherwise confuse; canonical example: button vs link
- **anti-patterns** — named misuse scenarios to warn against
- **keywords** — discoverability support

**disambiguation** and **anti-patterns** are the notable design decisions. Both encode *negative* knowledge — what a component is not, and what you must not do with it — precisely the class of information prose documentation conveys implicitly to humans and not at all to agents.

## The Markdown critique

From the companion post: "Markdown isn't structured enough to describe a design system. Not by a long shot." Google's DESIGN.md is named specifically as the target.

The objection is strategic rather than aesthetic: reliance on unstructured formats creates dependency on a particular workflow — especially AI-agent-centric ones — and that dependency becomes lock-in preventing teams from reassessing tool choices later. This connects directly to the "survive any rebuild, reorg, or rethink" criterion.

His summary of intent: a spec that works "for people, agents, and old-fashioned scripts." The inclusion of "old-fashioned scripts" is deliberate — a real single source of truth cannot privilege the current generation of consumers.`
  },
  {
    slug: 'naming-conventions-for-agents',
    title: 'Naming Conventions Were Important. AI Agents Made Them Essential.',
    url: 'https://www.designsystemscollective.com/naming-conventions-were-important-ai-agents-made-them-essential-633990e55158',
    category: 'guidelines',
    tags: ['naming-conventions', 'figma', 'agents', 'ai', 'design-systems', 'accessibility', 'code-connect'],
    authority: 'primary',
    content: `# Naming Conventions Were Important. AI Agents Made Them Essential.

Daniel Klinke, Design Systems Collective, 4 May 2026.

## Thesis

**"Your names aren't labels. They're instructions. For every tool that touches your file: MCP server, Framelink, Figma REST API, Figma Make, Code Connect."**

## The inflection point

Since **March 2026**, when AI agents gained *write* access to Figma canvases, bad naming stopped being merely an aesthetic or handoff problem. Poor naming now "compounds design debt at machine speed." The read-only era permitted sloppy naming because a human mediated every downstream use; write access removes the mediator.

## The compounding mechanism — easy to miss and the most important observation

When an agent encounters inconsistent naming across a library — his example is a library mixing \`Button / Primary\`, \`card-product\`, and \`inputSearch\`, three casing conventions in one system — the agent does not detect the inconsistency, flag it, or harmonize it.

**It picks one at random and replicates it when extending the system.** Inconsistency is not merely tolerated by agents; it is propagated and amplified by them.

## Two non-negotiables

1. **Consistency across the entire system** — agents learn patterns and apply them predictably, so a consistent system yields predictable extension.
2. **Documentation** — undocumented conventions are invisible to agents; documented conventions become enforced rules. A convention that lives only in the team's habits does not exist as far as the agent is concerned.

## Specific conventions

**Components** — PascalCase (\`Button\`, \`ProductCard\`; not \`button\` or \`product-card\`). Name by intent (\`CTAButton\`), never appearance (\`BlueRoundedButton\`). Slash hierarchy for namespacing: \`Button / Primary\`, \`Card / Product\`.

**Boolean properties** — always prefixed: \`hasIcon\`, \`isDisabled\`, \`isLoading\`; never bare \`Icon\` or \`Disabled\`. A bare noun is indistinguishable from an instance-swap or variant property to a reader that has only the string.

**Instance swap properties** — named by slot *function*, not current contents: \`leadingIcon\`, \`trailingIcon\`; not \`IconSearch\`. Naming a slot after what currently occupies it guarantees the name becomes a lie.

**Variant properties** — consistent value vocabularies: \`sm | md | lg\`, without mixing in \`small\` or \`S\`.

**Layers** — cap nesting at 4 levels to avoid div soup. Semantic names (\`ProductImage\`, not \`Rectangle 3\`). Prefix with context (\`CardContainer\`, not generic \`Container\`).

## The before/after

Poorly named layers produce structurally meaningless markup:

    <div class="frame-482">
      <div class="group-12">
        <img class="rectangle-7" />
        <p class="text-14">Product Title</p>
      </div>
    </div>

Well-named layers produce semantic, shippable markup:

    <article class="product-card">
      <header class="card-header">
        <img class="product-image" alt="Product Title" />
        <h3 class="product-title">Product Title</h3>
      </header>
    </article>

**The design is identical in both cases.** The rendered pixels do not differ. Only the names differ, and the names determined whether the output was semantic HTML with a usable alt attribute and a real heading, or a nest of anonymous divs.

Accessibility, in this framing, is downstream of naming.

## Adoption strategy

Explicitly against a system-wide renaming project. Incremental instead: start with one core component, typically Button; rename its properties and internal layers; test the generated output; verify the improvement; move on. A practical hedge against the well-known failure mode of naming initiatives — proposed as a total migration, estimated accordingly, never scheduled.

On Figma Skills: they help by encoding conventions as explicit instructions, but **"skills work alongside your naming, not instead of it."** Skills do not rescue a badly named library.`
  },
  {
    slug: 'agentic-ai-design-systems-figma-guide',
    title: 'Agentic AI, Design Systems and Figma: Making a Library Agent-Legible',
    url: 'https://uxdesign.cc/agentic-ai-design-systems-figma-a-practical-guide-6ab0b681718d',
    category: 'guidelines',
    tags: ['figma', 'agentic-design-systems', 'ai', 'design-tokens', 'code-connect', 'storybook', 'mcp'],
    authority: 'primary',
    content: `# Agentic AI, Design Systems and Figma: A Practical Guide

Christine Vallaure, UX Collective, 31 March 2026. The strongest articulation of the *pro-Figma-but-restructured* position — she does not concede the source-of-truth question to code, she reframes what the design file has to become.

## Central reframing

**"The design system is no longer just documentation for developers. It is instructions for a machine."**

## On the Storybook agent demo

The most clarifying line, and it deflates considerable hype: **"What Storybook showed was not AI doing design. It was AI that finally knew to use what the designer already built."**

The agent "found a Star component, Typography, and an Avatar. Read their props, understood their states, composed something new." Her characterization is deliberately unromantic: "The agent assembles. It does not wonder... It takes what it is given and builds from it, faithfully and fast."

The implication: the agent's ceiling is set entirely by the quality and legibility of the inventory it is handed.

## Six file-setup requirements — the practical core

1. **Semantic tokens, not just primitives** — \`color/interactive/default\` conveys intent; a hex value or \`blue-500\` conveys appearance. Agents reason on intent.
2. **Matched properties** — Figma component properties must mirror code props exactly, in naming and values. (The same parity requirement JumpCloud names, arrived at from the design side.)
3. **Complete states** — every interactive state must actually be designed: hover, focus, disabled, error, loading. An undesigned state is a state the agent will invent.
4. **Slots** — the Figma feature enabling flexible composition without detachment.
5. **Auto layout** — maps onto CSS Flexbox/Grid; spacing driven by variables rather than hand-set values.
6. **Code Connect** — explicit mapping between Figma components and code counterparts.

## Detaching

Breaking a component instance into an independent frame is "a maintenance disaster" — with the agent-era addition that it does not merely create drift, it prevents the agent from reasoning about the element at all. **A detached frame is invisible as a component.**

## The question the code-first camp does not answer

She asks directly: **"Where does visual truth live?"**

After the agent composes components and the tests pass: "Tests tell you if it works. They do not tell you if it looks right, feels like the brand."

Her second unresolved question — "How does a designer communicate visual intent to a machine?" — comes with the acknowledgment that brand qualities such as "the specific weight of a shadow, the rhythm of a type scale" resist encoding in tokens.

This is the substantive rebuttal to code-as-source-of-truth: passing tests is not the same as being right, and the residue tokens cannot capture is exactly the part designers are employed for.

## On process

The design system must emerge from real design work rather than being authored in isolation: **"The design system is a distilled finding. Designing the whole page is where the finding happened and hence not redundant."**

Her warning: "The agentic AI setup will pull towards efficiency... Cut it, and you have a fast system producing forgettable output, which costs more in the long run than the time you thought you were saving."

Definitions given in-piece: primitives (raw values), semantic tokens (intent-based), variants, detaching, story (the code equivalent of a Figma variant — one component state rendered live with defined props). MCP is defined as "a standardised way for an AI agent to connect to a tool and read information from it."`
  },
  {
    slug: 'machine-readable-design-systems-aix',
    title: 'Machine-Readable Design Systems and AIX: Designing for AI as a User',
    url: 'https://www.designsystemscollective.com/machine-readable-design-systems-designing-for-ai-as-a-user-28077c9f2144',
    category: 'guidelines',
    tags: ['machine-readable', 'aix', 'mcp', 'ai', 'design-systems', 'metadata', 'benchmark', 'json'],
    authority: 'primary',
    content: `# Machine-Readable Design Systems: Designing for AI as a User

Diana Wolosin, Design Systems Collective, 5 March 2026. Derived from preparing the Indeed Design System for AI integration. The empirical entry in this literature — arguing from measurement rather than position.

## Definition

Machine-readable design systems express design knowledge "in structured formats that AI systems can interpret directly," explicitly including component APIs, usage rules, **and accessibility constraints**.

Accessibility constraints appearing in that list is notable: a11y requirements must be machine-readable, not merely documented, or agents will generate inaccessible output while nominally using the right components.

## AIX — the coinage

**AIX (AI Experience)**, introduced as a deliberate parallel to UX, on the premise that "the structure of a design system shapes how AI behaves when generating interfaces."

The move is to treat AI as a *user class* with its own experience quality, rather than as a consumer of an API. That reframing carries real consequences: the design system team owes agents the same considerations — discoverability, disambiguation, error prevention — that it owes human consumers.

She also frames design systems as **"context engines"** — infrastructure enabling auditing, validation, and component generation, rather than static documentation.

## The benchmark

An MCP benchmark testing multiple representations of the *same* design system knowledge — holding content constant and varying only structure. Better-structured formats produced more consistent AI responses, with token processing cost and reasoning variability differing materially across formats.

Figures reported in secondary coverage of her work (worth verifying against primary before asserting): 8 MCP configurations across 1,056 prompts; 77 components parsed from MDX into JSON metadata; ingestion into a Vectra vector database. Markdown queries consumed roughly 30,000 tokens at 82% coverage with visible hallucinations; JSON delivered higher accuracy at roughly 80% fewer tokens and approximately 5× lower annual cost.

Her rule of thumb: **"JSON for MCP, Markdown for LLM."** Structured component data (APIs, props, variants) belongs in JSON; prose guidance can remain Markdown.

## The most valuable finding is the negative one

Even when models selected the **correct** components, secondary failures persisted: **"typography tokens were misapplied, spacing became inconsistent, color usage slowly diverged from the system."**

Her conclusion: metadata alone is insufficient for comprehensive design system compliance.

This is an important corrective to the prevailing assumption that exposing a well-structured MCP surface solves agent adherence. It does not. **It solves component *selection*, and leaves token-level fidelity as an open problem.**

That gap is precisely what the DS Contracts determinism requirement and Klinke's naming discipline each attack from different angles.

## Metadata architecture

From her companion piece on AI metadata: a metadata ecosystem spanning behavioral rules (component states and interactions), business intelligence (goals, audience, product nuances), implementation props (React-specific), and visual properties (delegated to the Figma MCP). The migration described is from "manual metadata in Google spreadsheets" to "a dedicated metadata system in GitLab" with "custom extractors and webhooks" for automatic synchronization. The metadata is "structured schemas, consistent keys, and clear relationships, all expressed in JSON."`
  },
  {
    slug: 'carbon-mcp',
    title: 'Carbon MCP: IBM Carbon Design System as a Queryable Source of Truth',
    url: 'https://carbondesignsystem.com/developing/carbon-mcp/overview/',
    category: 'tools',
    system: 'Carbon',
    tags: ['carbon', 'ibm', 'mcp', 'design-systems', 'ai', 'agents', 'source-of-truth'],
    authority: 'authoritative',
    content: `# Carbon MCP (IBM Carbon Design System)

The reference implementation of a major enterprise design system exposing itself to agents. Public preview.

## Framing claim

Carbon MCP makes "any agentic AI application an instant expert in the Carbon Design System, enabling teams to deliver consistent, high-quality user experiences with greater speed."

MCP is defined as "an open-source standard that enables AI agents or AI applications to securely connect with external tools, data sources, and workflows through a unified integration layer."

## Three stated benefits

1. **Direct access** — AI applications query Carbon design standards directly for context: colors, typography, component guidance.
2. **Code generation** — the server exposes code examples and documentation enabling "high-fidelity Carbon UI code that conforms to design **and** development best practices." Note the conjunction: conformance to both, not translation from one to the other.
3. **Consistency** — teams get "consistent answers and examples from a **shared source of truth**, helping reduce drift and rework."

## The position this implies

Carbon's implicit answer to "Figma or code?" is **neither surface**. The MCP server is the shared source of truth, and its audience is explicitly cross-functional — the documentation states Carbon MCP helps designers, developers, and PMs get consistent answers from that shared source.

This is a meaningfully different arrangement from either camp: the canonical artifact is the queryable knowledge layer, and Figma and code are both clients of it. It converges on the DS Contracts conclusion — an arbiter between surfaces — by a completely different route, and without a formal schema.

## Tool coverage by library

- \`@carbon/react\` — components with variants and props
- \`@carbon/web-components\` — components with variants and props
- Carbon for IBM Products — Tearsheets, PageHeader, and others
- Carbon Icons and Pictograms
- \`@carbon/ai-chat\` — chat components with full examples
- \`@carbon/charts\` — chart descriptions, demos, and code
- \`@carbon-labs/*\` — preview components including AnimatedHeader, Processing, Resizer

Marked "Support coming soon": Carbon TanStack and Carbon Patterns.

Beyond components, the server provides knowledge on core Carbon elements, iconography, pictograms, guidelines, and usage documentation — the guidance layer, not only the API surface. This is the distinction Wolosin's benchmark bears on: exposing props solves selection; exposing guidelines is the attempt at token-level and usage-level fidelity.

## Supported environments

IBM Bob, Cursor, Claude Code, Claude Desktop, and VS Code with Copilot Chat.

Repo: https://github.com/carbon-design-system/carbon-mcp`
  },
  {
    slug: 'code-generated-figma-components',
    title: 'When Code Becomes the Source of Truth: Generating Figma Components From Code',
    url: 'https://medium.com/design-bootcamp/rethinking-design-systems-when-code-becomes-the-source-of-truth-e535646d01fc',
    category: 'guidelines',
    tags: ['source-of-truth', 'code-led', 'figma', 'automation', 'design-systems', 'material-symbols'],
    authority: 'primary',
    content: `# Rethinking Design Systems: When Code Becomes the Source of Truth

Joshua Hall, Bootcamp, 29 October 2025. The code-as-source-of-truth argument made with a working artifact rather than a manifesto — and candid that the full vision remains unproven.

## The inversion

Conventional pipeline: Design → Spec → Code → Figma → Drift.

Proposed: Conceptual Design → React Implementation → **Generate Figma Components from Code** → Publish to Library.

The diagnosis names the root cause as maintaining "two separate sources of truth" that inevitably diverge. The symptom is labelled the **"Design-to-Development Gap"**: components do not match across systems, and synchronization depends on "hope and diligence" rather than mechanism.

The line that captures the inversion: **"When a designer uses a button component in Figma, they're using the button component in code, just rendered in a design tool."**

## Figma's reassigned role

*Visualization layer* rather than specification source. Design tools remain appropriate for conceptual exploration and product design work. What changes is that *published component libraries* are generated programmatically from production code, and carry embedded metadata identifying their code equivalents.

## The proof of concept

Google Material Symbols: roughly 4,000 icons at 504 variants each — approaching two million component variants generated programmatically into Figma.

What it demonstrates:
- Programmatic generation works at scale
- Git-based synchronization against an external repository keeps the library current
- Metadata tracking via Figma's plugin API stores the Git commit SHA that produced each component, alongside SVG content hashes per variant
- **Delta updates** — because hashes permit comparison, only changed icons regenerate. Reported effect: **26+ hours reduced to 1–2 hours** per update cycle. The plugin runs weekly in CI and notifies on upstream changes.

## Operational details

The library is split across 26 Figma files alphabetically, with icon distribution balanced to avoid memory constraints. Failure handling degrades gracefully — if downloads time out or hit rate limits, icons are created with available variants and backfilled later. Deprecated icons receive a \`_deprecated_\` prefix rather than being deleted, so existing designs continue to resolve references while new usage is discouraged. A "preferred icons list" filters 4,000 down to a per-team subset of roughly 100–300.

## Proposed four-tier component hierarchy

1. **Core components** (future code-generated): buttons, fields, dialogs
2. **Product-specific components** (mixed generation): specialized variations composed from core
3. **Product designs** (never generated): actual screens assembling components
4. **Exploration layer** (conceptual): files testing new component ideas

Naming carries metadata to engineers: underscore-prefixed names indicate private components; angle brackets signal React boundaries.

## Stated limitations — the most useful part

The larger vision, generating core React components into Figma, **remains untested in production**; only the icon system is proven. The approach requires organizational maturity, and early-stage products iterating rapidly may not benefit, since the overhead of the generation pipeline exceeds the cost of drift when the system is still churning.`
  },
  {
    slug: 'figma-config-2026-code-is-material',
    title: 'Figma Config 2026: "Code Is Material" and the Refusal of the Design-vs-Code Dichotomy',
    url: 'https://www.figma.com/blog/config-2026-recap/',
    category: 'tools',
    system: 'Figma',
    tags: ['figma', 'config-2026', 'code-layers', 'source-of-truth', 'motion', 'mcp', 'agents'],
    authority: 'authoritative',
    content: `# Figma Config 2026: Code Is Material

Figma's official position statement, and the necessary counterweight to the demotion argument — the company refusing the terms of the debate rather than defending its side of it.

## The framing

Dylan Field: **"Code is material, just like images, vectors and design layers."**

The corollary from the keynote: code is not the opposite of design. Figma's explicit position is that "design versus code" is a false choice, and that code should live *alongside* visual elements on a shared canvas rather than being the thing you hand off to.

This is strategically significant. The code-first camp argues Figma should be demoted to exploration because the artifact that ships is code. Figma's answer with code layers is to refuse the choice entirely and attempt to be both the design surface *and* the production output — which, if it works, dissolves the premise of the demotion argument rather than rebutting it.

## Code Layers

Any layer can be converted into an interactive code layer by click or by prompt. Teams can explore multiple code directions in parallel, iterate on them together, and extract design frames back into editable layers. The bidirectionality is the point: code → layers as well as layers → code. Rollout began July 2026 via waitlist.

## Figma Motion

A native timeline with keyframes and presets, bringing motion design onto the canvas:
- Animating components, with the animation propagating across the design system — **motion becomes a systematized property** rather than a per-screen decoration
- Dev Mode inspection of all timing values and easing curves
- Export to CSS, JSON, React, MP4, WebM, Animated SVG, GIF
- **MCP compatibility for passing animated frames to coding agents**

That last item is the most relevant to agentic design systems: motion is being made machine-readable and agent-consumable, closing one of the standing gaps in what design tokens and component contracts could previously express.

## Shader fills and effects

The Figma agent generates custom shaders from a description or an image reference. Effects transform existing layers; fills create new materials. All parameters surface as editable canvas controls and remain stackable.

## Generative plugins

Teams describe tool behavior, controls, and parameters in natural language, with no plugin API knowledge required. Resulting tools feel native to the canvas and are shareable file-wide, with community publishing planned.

## Enhanced design agent

Custom tools; **skills**, which package workflows into reusable instructions; connectors to external tools including Notion, Slack, and GitHub; and team chat visible by default.

The skills concept connects directly to Daniel Klinke's caveat that "skills work alongside your naming, not instead of it" — a response to exactly this feature.

## Note for readers

Figma does not argue "Figma is the source of truth." It argues the question is malformed. Pair this with the JumpCloud demotion argument and Sam Henri Gold's "lossy approximation" critique to see the full disagreement.`
  },
  {
    slug: 'figma-lossy-approximation-critique',
    title: 'Figma\'s Format as a Lossy Approximation: The Training-Data Argument',
    url: 'https://samhenri.gold/blog/20260418-claude-design/',
    category: 'guidelines',
    tags: ['source-of-truth', 'figma', 'code-led', 'ai', 'design-tools', 'training-data'],
    authority: 'primary',
    content: `# Thoughts and Feelings Around Claude Design

Sam Henri Gold, 18 April 2026. The most pointed statement of *why* the source of truth is migrating, with an argument that appears nowhere else in this literature.

## The training-data argument

Figma's dominance produced a "locked-down, largely-undocumented format," and that proprietary opacity had an unanticipated consequence in the LLM era: **it excluded Figma from AI training data.**

Because models were trained on code rather than on Figma's proprietary primitives, they never learned the system. Under this reading, Figma's format moat became a liability the moment the most important consumer of design artifacts became a model rather than a human.

This is genuinely distinct from the parity and drift arguments made everywhere else.

## On the source of truth

The canonical location has historically been contested between code and design files. Gold predicts the balance tips back toward code as "code becomes easier for designers to write and agents keep improving." Two separate conditions — one about designer capability, one about agent capability — expected to move in the same direction.

## The supporting example

Drawn from Figma's own house: Figma's internal design system files contain **946 color variables**, with nested aliases, mode overrides, and instance-level exceptions.

The point is that this produces debugging nightmares — the tool held up as the model of systematized design has, at scale, produced a variable graph genuinely difficult to reason about. The implicit argument: this complexity is not incidental but is what happens when you express a system in a canvas rather than in code, where tooling for managing indirection is mature.

## The rhetorical core

**"Why fuss around in a lossy approximation of the thing when you can work directly in the medium where it will actually live?"**

The cleanest one-line statement of the code-as-source-of-truth position. "Lossy approximation" is the operative term — the claim is not that Figma is inaccurate but that it is *structurally* incapable of being complete, because it represents an artifact in a different medium than the one that ships.

## The predicted fork

Design tooling bifurcates rather than consolidating:

1. **Code-forward** — exemplified by Claude Design, built on HTML and JS, integrating with Claude Code so design and implementation are the same workflow rather than adjacent ones.
2. **Pure exploration** — an environment deliberately unconstrained by systems thinking, emphasizing high-fidelity compositing and artistic freedom.

The prediction is that the **middle** — a tool that is simultaneously the systematized production surface and the exploration surface — becomes untenable.

This directly contradicts Figma's Config 2026 thesis, which is precisely a bid to occupy that middle. The two should be read together.

## The "Sketch moment"

Gold characterizes Figma as facing the point at which market dominance converts into vulnerability — the transition Sketch underwent when Figma displaced it. His claim is that Figma's infrastructure, built for systematization, now looks baroque relative to agentic workflows generating interfaces directly in code.

The comparison is pointed because Sketch's displacement was not driven by feature deficit but by a change in the collaboration substrate. Gold argues the substrate is changing again — from multiplayer to agentic.`
  },
  {
    slug: 'design-system-migration-tools',
    title: 'Design System Migration Tooling: Why Native Token Swap Fails',
    url: 'https://www.designsystemscollective.com/design-systems-are-evolving-our-migration-tools-arent-15a2f97a6f06',
    category: 'tools',
    tags: ['migration', 'design-tokens', 'figma', 'tooling', 'design-systems', 'plugins', 'drift'],
    authority: 'primary',
    content: `# Design Systems Are Evolving. Our Migration Tools Aren't.

Yogesh Shetty, Design Systems Collective, 4 May 2026. The operational counterpart to the theoretical sources: migration between design systems is the unaddressed bottleneck, and agentic tooling is being applied to greenfield generation while the brownfield problem is ignored.

## The core disconnect

When organizations rename tokens during a system upgrade — which is nearly always, since renaming is usually the point — native automation stops working entirely.

## Three named problems

**1. Naming convention mismatches.** "The native swap only works if the names are identical. Our new system has a completely different naming convention." Figma's built-in swap operates on string equality, so any deliberate taxonomy change defeats it. **The better the migration, the less the tooling helps.**

**2. Hidden technical debt.** Tools overlook hardcoded color values, pixel measurements, and radius specifications buried inside nested components. A migration that only remaps bound variables reports success while leaving the actual drift untouched.

**3. Contextual errors.** Indiscriminate token swapping — substituting a background color token for a text color token because their hex values match — produces broken and inaccessible interfaces. **Hex equality is not semantic equality**, and a tool that cannot tell the difference will confidently destroy contrast ratios.

## The tools built in response

**Intent** — detects detached components and locates their original masters. Addresses the problem Vallaure names independently: a detached instance is invisible to both migration tooling and agents.

**Token Map** — described as a "Design Ops powerhouse," resting on three innovations:
- **Deep token detection** across both variables and hardcoded values — scanning for external variables, local styles, raw hex codes, and manual spacing increments rather than only bound tokens
- **Weighted scoring** requiring 100% match confirmation before an automatic swap
- **Scope-awareness filtering** distinguishing fill tokens from radius tokens, addressing the contextual-error problem

Reported results: roughly 80% of migration tasks automated, data kept local, human confirmation required only for ambiguous matches.

The decision to require human confirmation on ambiguity rather than guessing is the same "receipted" principle the DS Contracts spec states — surface the gap, do not paper over it with a plausible value.

## "Vibe Coding"

Shetty's term for how the tools were produced: using AI to bridge designer intent and functional code, so a designer without formal engineering background can build professional-grade tooling. He supplied the architectural logic; AI generated the TypeScript needed to traverse Figma's layer tree.

The meta-point matters: this is agentic tooling being used to *build* design-system infrastructure, by a design-system practitioner, rather than being consumed as a vendor product.`
  },
];

let written = 0;
for (const entry of ENTRIES) {
  writeFileSync(join(OUT, `${entry.slug}.json`), JSON.stringify({
    id: `sot-batch-${entry.slug}`,
    title: entry.title,
    source: { type: 'url', location: entry.url, ingested_at: new Date().toISOString() },
    content: entry.content,
    chunks: [],
    metadata: {
      category: entry.category, tags: entry.tags, confidence: 'high',
      system: entry.system ?? '', source_url: entry.url, authority: entry.authority,
      research_batch: 'source-of-truth-2026-08', last_updated: new Date().toISOString(),
    },
  }, null, 2));
  written++;
}
console.log(`wrote ${written} staged entries`);
for (const e of ENTRIES) console.log(`  ${String(e.content.length).padStart(6)}  ${e.title.slice(0, 64)}`);
