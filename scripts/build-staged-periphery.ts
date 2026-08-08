/**
 * Staged entries: design-system practice periphery — team models, adoption,
 * multi-brand theming, versioning/deprecation, contribution, token naming,
 * component API design. Sourced from primary practitioner writing the bulk
 * crawler could not reach (Medium/EightShapes, Substack, gated pages). No
 * backticks in content strings.
 *
 * Run: npx tsx scripts/build-staged-periphery.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'content/staged';
mkdirSync(OUT, { recursive: true });

interface Staged {
  slug: string; title: string; url: string; category: string;
  system?: string; tags: string[]; content: string;
}

const ENTRIES: Staged[] = [
  {
    slug: 'eightshapes-designing-a-systems-team',
    title: 'Designing a Systems Team: Four Stages of Growth (EightShapes)',
    url: 'https://medium.com/eightshapes-llc/designing-a-systems-team-d22f27a2d81d',
    category: 'guidelines',
    system: 'EightShapes',
    tags: ['team-models', 'governance', 'org-design', 'nathan-curtis', 'design-systems', 'scaling'],
    content: `# Designing a Systems Team

Nathan Curtis, EightShapes. The canonical piece on how a design system team grows.

A system team serves product teams — dedicated staff supporting multiple product teams, similar to how research teams function across an organization.

## The four stages of growth

**Stage 1 — Spare Timers.** Individuals working on systems in limited free time, creating starter templates but lacking organizational support or consistent outputs. "Systems built on Friday afternoons or Sunday nights don't endure." These serve primarily as proof-of-concept.

**Stage 2 — Allocated Individual(s).** Managers carve out predictable time allocations (10-25%) from product commitments. Tangible outputs emerge, but documentation often remains disorganized, scattered across platforms. As outputs increase, "you create demand within your organization that [you] cannot meet with current allocations."

**Stage 3 — System Team-as-Product Team.** A formal, dedicated multidisciplinary unit combining design and engineering with product management leadership, functioning as an independent product. Essential roles: designers spanning sub-disciplines, and front-end engineers building conventions and tools. Optional specialists cover content strategy, accessibility, and performance.

**Stage 4 — System Team of Teams.** Massive enterprise structures serving multiple products simultaneously (Google, IBM). Curtis cautions this scale is "completely unrealistic and unnecessary" for most organizations.

## Composition

Design members must excel at crafting visual language across sub-disciplines; engineering staff need front-end expertise, HTML/CSS proficiency, and tool-building capability; product management drives vision, roadmap curation, and adoption monitoring.

## The half-time capacity model

Notably, all team examples employed half-time commitments from staff who retained primary responsibilities within product teams. This creates "relationships into 3-5 key product teams" and "minimizes bias towards any single product," giving visibility into product needs and preventing duplicative efforts — though it requires managing product teams' pressure to demand full-time effort despite partial allocation.

## Six lessons

1. **Encoded Design is Truth** — "a design system's value increases ten-fold when a bridge forms between strong design and engineering practices." Favor unified code implementations over design specifications alone.
2. **Half-time capacity is a strength** when properly coordinated, providing cross-product perspective.
3. **Balance continuity with rotation** — permanent members ensure continuity and tribal knowledge; rotating staff diffuses learning. After major releases, talented individuals can transition back to products as the "next wave" of adopters.
4. **Anticipate periodic contraction** — frame staff transitions back to products after major releases as opportunities to demonstrate system impact.
5. **Onboard new members as a litmus test** — new-member integration exposes documentation gaps and implementation weaknesses.
6. **System staff should span constituencies** — when systems serve multiple business lines, include representatives ensuring adoption across boundaries.

The most successful example featured a well-defined visual language, quick initial delivery (three months for version 1.0), and "engineering investing three half-time developers from flagship products."`
  },
  {
    slug: 'dan-mall-sweet-spot',
    title: 'The Sweet Spot for Design System Work: The 3-or-More-Teams Rule (Dan Mall)',
    url: 'https://danmallteaches.substack.com/p/the-sweet-spot-for-design-system',
    category: 'guidelines',
    tags: ['prioritization', 'dan-mall', 'adoption', 'design-systems', 'component-selection', 'governance'],
    content: `# The Sweet Spot for Design System Work

Dan Mall, December 2023.

## Two failure modes

**Component Factories** — teams that build numerous components without validation, producing "a lot of components that could be used someday by someone but actually isn't used today by anyone," creating a "design system ghost town."

**Staff Augmentation** — design system teams become extra hands for product teams. Initially satisfying, but it creates two problems: components fragment across teams with different needs, and capacity cannot match demand across an organization.

## The sweet spot

Effective design system work requires "a manageable amount of teams for us to work with simultaneously [who] need the same component within the same timeframe."

Teams should "only work on the highest coverage components at scale" — specifically, prioritize requests that **"3 or more teams have in common," since "three times is a pattern."** This ensures one chunk of design-system-team effort has at least three points of impact.

## Seven prioritization criteria

For choosing components and pilot teams:
1. A team eager to collaborate immediately
2. Teams with roadmaps accommodating collaborative processes
3. Component needs arising within 6-8 weeks
4. Potential excitement among 50%+ of other teams
5. Potential time savings of one day or more for 50%+ of teams
6. Technical feasibility within 6-8 weeks
7. Immediate usability by three additional teams post-refinement

## What doesn't work

Scenarios masquerading as effective design system work: different teams needing different components; staggered timelines for the same component; distant future needs; simultaneous demands from too many teams.

"The fundamental challenge is discovering components and teams meeting these criteria simultaneously — a thing contingent upon the right amounts of skill, will, and luck."`
  },
  {
    slug: 'sparkbox-design-system-roi-study',
    title: 'The Value of Design Systems Study: 47% Faster to Build (Sparkbox)',
    url: 'https://sparkbox.com/foundry/design_system_roi_impact_of_design_systems_business_value_carbon_design_system',
    category: 'guidelines',
    system: 'Sparkbox',
    tags: ['roi', 'research', 'measurement', 'design-systems', 'evidence', 'carbon'],
    content: `# Yes, Design Systems Do Improve Developer Efficiency and Design Consistency

Sparkbox. One of very few published controlled experiments putting a number on design system ROI — widely cited as the "47% faster" evidence.

## Method

Eight developers completed identical tasks two ways. A Sparkbox designer created a contact form prototype in Figma following IBM's Carbon design system, serving as the reference standard. Developers coded the form (1) independently without design system support, then (2) using Carbon components and documentation — with the Carbon timeline including the learning period to familiarize themselves with the system. Separate review teams evaluated both versions for visual fidelity against the Figma design.

## Speed findings

"Using a design system made a simple form page **47% faster to develop** versus coding it from scratch. The median time for the scratch submissions was 4.2 hours compared to the 2 hour median time for Carbon submissions."

Individual results varied: one developer went from 4.2 hours (scratch) to 1.1 hours with Carbon — a 74% reduction. The median improvement across participants was approximately 52%.

## Consistency findings

"The top two submissions for visual consistency used the design system." "Visual consistency for five of the eight developers improved when using the design system. In fact, one developer went from 14th place out of 16 for their scratch submission to first place for their Carbon submission."

Only one developer's hand-coded submission exceeded their design system version in visual consistency; two scored comparably, suggesting prior expertise may reduce the relative advantage of systematic components.

## Accessibility outcomes (more nuanced)

One developer advanced from last place to mid-range when adopting the design system; two showed modest improvements; three were equivalent. Important context, stated by Sparkbox: "Two of the developers who coded submissions were IAAP certified Web Accessibility Specialists" — organizational accessibility expertise that likely moderated the benefit, suggesting teams without a strong accessibility culture might see more pronounced improvements.

## Limitations

"This was a small study of a handful of excellent developers." Participants ranged junior to senior, mixed frontend/backend, with staggered timelines. The honest framing of scope is part of why the study is trusted — it is one number from one controlled setting, not a universal law, and it is one of the only such numbers that exists.`
  },
  {
    slug: 'eightshapes-adopting-design-systems',
    title: 'Adopting Design Systems: Scorecards, Commitment Questions, "Hello System" (EightShapes)',
    url: 'https://medium.com/eightshapes-llc/adopting-design-systems-71e599ff660a',
    category: 'guidelines',
    system: 'EightShapes',
    tags: ['adoption', 'governance', 'nathan-curtis', 'design-systems', 'measurement'],
    content: `# Adopting Design Systems: A Playbook for Working with Product Teams

Nathan Curtis, EightShapes. Treats adoption as a structured progression, not a binary implementation choice.

## Adoption models

Teams can pursue a "big bang" approach — halting existing work to implement comprehensively — or an incremental model where integration happens alongside feature development. Neither universally applies; teams should "translate their risks into a workable adoption" faster or slower based on context.

Progress is tracked through achievement levels — clear checklists and measurable milestones, progressing from simpler to more complex. Decompose adoption into sprint-sized stories rather than monolithic requirements.

## Handling the three objections

- **"The System is Too Big"** — reflects misconceptions about modularity; adoption need not be all-or-nothing.
- **"The System is Not Important Enough"** — frame adoption as a portfolio-wide feature enabling cohesiveness.
- **"The System Slows Us Down"** — acknowledge short-term efficiency costs while emphasizing long-term velocity gains.

## Five commitment questions

To gauge genuine adoption intent:
1. Will your product adopt the system?
2. When will adoption occur generally?
3. When will roadmaps reflect an adoption plan?
4. When will teams integrate the code package?
5. What constitutes the first visible **"Hello, System!"** moment in production?

The planning phase itself merits recognition as a milestone, requiring 10-50% of total adoption effort. Initial code integration (adding system dependencies via npm) serves as an early, tangible commitment marker.

## Measurement and celebration

Monitoring occurs through **adoption scorecards** displaying products across rows and adoption levels in columns. This visibility "prevents top performers from eclipsing struggling teams while highlighting accomplishments across the portfolio." Curtis stresses protecting the reputations of legacy or constrained products that cannot achieve full adoption, noting partial implementation often requires greater effort.

The core message: **product adoption itself — not flashy new components — is the system team's primary success metric**, warranting celebration and visibility.`
  },
  {
    slug: 'clearleft-multi-brand-tokens',
    title: 'Designing With Tokens for a Multi-Brand Design System: Theme/Token/Role/Value (Clearleft)',
    url: 'https://clearleft.com/thinking/designing-with-tokens-for-a-flexible-multi-brand-design-system',
    category: 'tokens',
    system: 'Clearleft',
    tags: ['multi-brand', 'theming', 'design-tokens', 'white-label', 'accessibility', 'design-systems'],
    content: `# Designing With Tokens for a Flexible Multi-Brand Design System

Jason Bird, Clearleft, October 2021.

## The tension

"There's an ever growing battle between efficiency and flexibility. How do you deliver an efficient white label product experience while allowing the flexibility for true brand expression between each roll out?"

Bird decided all brands share the same grid and spacing: "The core of a brand's visual language comes from colour and font, not space." Spacing and grids make and break hierarchical relationships but are not where brand lives.

## Why the naive primary/secondary mapping fails

His first approach mapped each brand's colours into primary/secondary/tertiary groups to swap per brand. Three failure modes:

**Accessibility.** "The relationships between the colours of one brand palette might meet AA WCAG 2.1 guidelines, but the same relationships might not work for another brand's colours."

**Brand expression.** "By assigning a colour as 'primary' you are making an inflexible design decision at a meta level... using this to determine colour at a component level removes any attempt of art directing the correct brand values."

**Multiple systems.** "I'm breaking consistency from the core system... I have only created overhead by needing to maintain multiple versions for each brand that will slowly grow further apart."

## The solution: split the system in two

- **Components** — "modular, adaptable components that can flex to the needs of multiple brands"
- **Brand themes** — "sets of styling information specific to a brand or theme that handles colour and typography"

A brand's set of tokens becomes a token sheet making up the brand theme; components reference a brand theme token sheet as the source of truth.

## A token documented in four parts

- **Brand theme** — a set of unique tokens making up a unique brand theme
- **Token** — "the code identifier for a unique role. Tokens are universal and never change across themes. This is what keeps all our brands under one source of truth."
- **Role** — "the systematic usage of a token. Roles cannot be changed between themes. Here you specify how the token can be used beyond its name and even **bake in accessibility criteria.**"
- **Value** — "the actual style (e.g. a hex code) assigned to a token. These can be changed for each brand theme."

Each white-label component references multiple tokens where colour properties change per brand theme while retaining the same token identifier.

"This process not only helps systemise our multi brand-elements, it also sets a precedent of turning design choices into design decisions. Our neutral-600 can become $disabled, a reusable token with more descriptive intention."

Tokens live in JSON, "a raw data format that can be shared not only across websites but also across platforms." The load-bearing idea: accessibility is encoded at the role level, so a brand can swap values without silently breaking contrast.`
  },
  {
    slug: 'eightshapes-versioning-design-systems',
    title: 'Versioning Design Systems: SemVer, Library vs Component, Deprecation Timelines (EightShapes)',
    url: 'https://medium.com/eightshapes-llc/versioning-design-systems-48cceb5ace4d',
    category: 'guidelines',
    system: 'EightShapes',
    tags: ['versioning', 'semver', 'deprecation', 'nathan-curtis', 'design-systems', 'releases'],
    content: `# Versioning Design Systems

Nathan Curtis, EightShapes. Part 3 of the "Releasing Design Systems" series.

## The core disconnect

Engineers compare proposed designs against system code and track breaking changes; designers "readily swap older elements for newer ones without considering version numbers." One designer: "I add a new system feature to my design. Yet the developer says we can't use it."

## SemVer

MAJOR.MINOR.PATCH — MAJOR for incompatible/breaking changes, MINOR for backwards-compatible features, PATCH for backwards-compatible fixes.

## Library vs component versioning

**By library** — all assets receive the same version simultaneously. Any component's feature bumps the whole library's minor; any breaking change bumps the major across the system. "This suits teams delivering vanilla HTML and CSS, since multiple versions of CSS cannot coexist without conflicts" — adopters must use all components from the same library version.

**By component** — teams can mix button 5.3.1 with checkbox 3.1.0 and radio 1.1.0 on the same page. Adopters need not coordinate release timing since markup, styles, and scripts are encapsulated. This aligns with continuous release, React/Vue, or web components — "supporting smaller, more modular changes released more frequently."

## Breaking changes are not always big

"A breaking change triggering 2.0.0 might be renaming a CSS class from system-btn--primary to system-button--primary, or replacing a single toggleModal function with separate openModal and closeModal functions." Small API changes may be cheap to audit and correct.

## Pre-1.0 signaling

"Pre-1.0.0 releases (0.1.0, 0.2.0) signal architectural and feature instability, typically lasting three to six months." 1.0.0 designates stability and readiness for widespread adoption.

## Deprecation

A recommended process: communicate intent through regular channels; establish a timeline; add notices to documentation; run repository commands per package; communicate one final time; ultimately remove the feature.

**Timing evidence:** "Salesforce Lightning provides teams eighteen months notice, while Financial Times' Origami supports compressed timelines of three to six months within their tighter developer community." Systems can maintain old and new versions simultaneously during transitions — Morningstar offered both new and deprecated notification components for six months.

## Coordinating outputs

"System code serves as source of truth, with code versions anchoring documentation, design assets, and tokens." Treat documentation as a product consuming the system library — "documentation should update with every code release, but code shouldn't release for minor documentation improvements."

"Most adopting teams don't upgrade with every release, often maintaining components for six months to years; maintain versioned documentation archives at predictable URLs — such as .com/v1.13.0/." Separating tokens as a packaged dependency "improves flexibility: all adopters gain access to current style definitions, and style evolution proceeds independently from component code."`
  },
  {
    slug: 'codemods-design-system-evolution',
    title: 'Automating Design System Evolution With Codemods: Ship One Per Breaking Change',
    url: 'https://www.hypermod.io/blog/7-automating-design-system-evolution',
    category: 'tools',
    tags: ['codemods', 'migration', 'versioning', 'design-systems', 'ast', 'breaking-changes'],
    content: `# Automating Design System Evolution With Codemods

Daniel Del Core (ex-Atlassian design system engineer), May 2025.

## What codemods are

Scripts that automate large-scale code transformations by parsing code into an Abstract Syntax Tree (AST), enabling precise modifications.

## Why design systems specifically

Design systems are "often widely adopted across many applications, and play a crucial role in maintaining consistency... They are notoriously hard to change at scale due to the number of components and the interdependencies between them."

## The migration classes codemods address

- **Component Renaming** — updating component names across hundreds of files without manual intervention
- **Prop Changes** — modifying prop names or values to align with updated APIs
- **Import Path Updates** — adjusting import statements for new file structures or package names
- **Theme and Token Migrations** — transitioning to new design tokens or theming approaches

## Precedents

Atlassian provides @atlaskit/codemod-cli; MUI offers @mui/codemod for automating major-version migrations (e.g. v4 to v5).

## The best practices

1. **Provide codemods for every breaking change** — "When introducing breaking changes such as renaming components, altering props, or modifying import paths — accompany them with dedicated codemods."
2. **Facilitate complex migrations** — deploy comprehensive updates impractical to perform manually.
3. **Ensure clear documentation** — explain each codemod's purpose, usage, and known limitations.
4. **Incorporate testing and validation** — execute in non-destructive dry-run mode, develop verification tests, conduct code reviews before deployment.
5. **Leverage community tools** — use established tools like jscodeshift.

## The through-line

Treating migrations as a **first-class deliverable of a release** (rather than documentation alone) converts breaking changes from a multi-team coordination cost into an automated, reviewable transformation. This is what lets a system evolve faster without stranding adopters on old versions — the operational answer to the deprecation-timeline problem, and the same "receipted, deterministic" instinct the contracts literature applies to generation.`
  },
  {
    slug: 'eightshapes-defining-contributions',
    title: 'Defining Design System Contributions: Four Types, Frequency vs Cost (EightShapes)',
    url: 'https://medium.com/eightshapes-llc/defining-design-system-contributions-eb48e00e8898',
    category: 'guidelines',
    system: 'EightShapes',
    tags: ['contribution', 'governance', 'nathan-curtis', 'design-systems', 'process'],
    content: `# Defining Design System Contributions

Nathan Curtis, EightShapes, January 2020.

## No single workflow

Teams must optimize **multiple** contribution models "because contributions vary dramatically — adding an icon differs substantially from building a functional data grid component."

## Contribution vs participation

Participation is "untraceable collaborative acts" — verbal feedback in critiques, influencing architecture, attending meetings. A contribution is tangible and measurable: "any proposal, design, code, documentation, or design asset of a new feature, enhancement, or fix completed by someone not on the system core team and released through the system for other people to reuse."

## Four types on a scale

1. **Fixes** — defects, whether code bugs (IE11 compatibility) or design errors (incorrect labels)
2. **Small enhancements** — maintain stable architecture while adding elements (an orange alert color to an existing palette)
3. **Large enhancements** — extend existing features significantly (adding dismissibility, descriptions, and multiple positions to an alert)
4. **New features** — entirely new components or capabilities

## Frequency and cost asymmetry

Small fixes and enhancements occur frequently but need minimal effort, often completed by individuals. Large enhancements and new features are rare and labor-intensive, "demanding weeks or months of collaborative work across disciplines... a large contribution hews towards the rigorous process that a system team uses to get work done."

## The small-contribution failure mode

A critical failure occurs when "a system doesn't respond" promptly to completed work. Curtis warns against release processes that bundle changes into infrequent cycles, "leaving contributors unable to use their own work for extended periods."

## Why large contributions are hard — three obstacles

1. "It's in a contributor's self interest to neither normalize a solution and facilitate wide agreement across many people or groups nor conduct rigorous steps they don't usually do."
2. Contributors typically represent a single discipline — designer OR developer — requiring the system team to absorb additional work or coordinate cross-disciplinary partnerships, which "rarely" happens.
3. Distributed efforts "become far more disconnected collaboratively, degrading the synthesis of things like API naming, examples, and documentation."

"Don't delude yourself to think there's a simple, basic set of a few steps for large contributions. Simplicity will need to give way to more complications."`
  },
  {
    slug: 'amy-hupe-contribution-lessons',
    title: 'Five Lessons on Enabling Design System Contribution (Amy Hupe)',
    url: 'https://amyhupe.co.uk/articles/5-lessons-on-enabling-design-system-contribution/',
    category: 'guidelines',
    tags: ['contribution', 'governance', 'amy-hupe', 'design-systems', 'govuk', 'community'],
    content: `# Design Systems: 5 Lessons in Enabling Contribution

Amy Hupe (ex-GOV.UK Design System, ex-Babylon Health), November 2019. Evidence-based and frequently counterintuitive.

## Lesson 1 — Get comfortable with some multiplication of effort

"If we're not careful, contribution can become a kind of race to the finish line, and there's a danger in trying to reach that end point too early... there is some value in multiplication. If 3 teams arrive at the same solution, independently of each other, that's useful information."

Citing Cathy Dutton: "patterns should never sacrifice user context for efficiency and consistency." "We have to **diverge before we can converge**, or we risk creating a solution that's too constraining to be useful."

## Lesson 2 — Don't compromise on quality to make contribution easier

"Focusing on making it easy to contribute might point us to things like relaxing our standards and lowering the bar on quality... But for users of a design system, we need to provide clear, reliable and evidence-based patterns. Publishing patterns when they're not ready enough makes it more likely they'll need to be changed... This creates instability. If we're constantly imposing updates on our users, we'll start to lose trust, which is likely to impact adoption."

## Lesson 3 — Be inclusive and help the unlikely contributors

"To be able to contribute to an open source project like a design system, people need time, confidence, motivation and permission. If we wait passively for contributors to approach us, it's likely that only the people with all of these things will do so... If the community of people helping to grow the design system isn't representative, the design system isn't going to be representative either."

## Lesson 4 — Accept that no one cares that much about contributing to your design system

"No one cares that much about contributing to our design systems. And that's OK. Those of us working on design systems are paid... to work on our design systems. Our contributors are not... in the end, it's our responsibility to provide patterns — it's not theirs. Repeatedly reminding teams to contribute, going out and pattern hunting, and doing a significant amount of hand-holding is part of the job, and it probably always will be."

## Lesson 5 — Contribution doesn't make things faster, it makes things representative

"When making the case for supporting contribution, we often talk about how it'll help us to scale a design system faster. But in my experience, that's not really true... it usually takes longer to help an external contributor to produce a pattern than it does for the core design system team to do it themselves."

"The value to be had from supporting contribution to a design system is making it representative. Opening up a design system for contribution gives more people a seat at the table." Citing GOV.UK design principle 10: "The more eyes there are on a service the better it gets — howlers are spotted, better alternatives are pointed out, the bar is raised."

This directly contradicts the common ROI pitch for contribution. Both Hupe's "representative, not faster" and the standard "scale faster" framing appear in the literature; Hupe's is the evidence-based correction.`
  },
  {
    slug: 'eightshapes-naming-tokens',
    title: 'Naming Tokens in Design Systems: The Four-Group Taxonomy (EightShapes)',
    url: 'https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676',
    category: 'tokens',
    system: 'EightShapes',
    tags: ['naming', 'design-tokens', 'nathan-curtis', 'design-systems', 'taxonomy', 'architecture'],
    content: `# Naming Tokens in Design Systems

Nathan Curtis, EightShapes, October 2020. The canonical token-naming taxonomy.

"Effective token names improve and sustain a team's shared understanding of visual style through design, code, and other interdisciplinary handoffs. Terms matter."

## Four groups of levels

**Base levels** (a token's backbone): category (color), concept (action), property (size).
**Modifier levels**: variant (primary), state (hover), scale (100), mode (on-dark).
**Object levels**: component (button), element within a component (left-icon), component group (forms).
**Namespace levels**: system (esds), theme (ocean or subbrand), domain (retail).

## Base levels

Tokens exist within a prototypical category — color, font, space, size, elevation, breakpoints, shadow, touch, time. Principle: **avoid homonyms** — "type" is interpreted as many things.

A category pairs with a property (text, background, border, fill), though the pair alone is insufficient for meaning. Tokens group per category by adding concepts — for color: feedback (success, warning, error), action (calls-to-action, selected items), visualization, commerce (sale, clearance, inventory).

**Principle — homogeneity within, heterogeneity between**: "strive for homogeneity within a class (like visualization) and heterogeneity between classes."

## Modifiers

- **Variant** — alternative use cases: text as primary/secondary/tertiary; feedback as success/error/information/warning/new.
- **State** — default, hover, press/active, focus, disabled, visited, error. Yields fully formed tokens like $color-action-text-secondary-focus.
- **Scale** — enumerated (heading levels 1-5), ordered (Material's 50, 100 ... 900), bounded (HSL lightness: slate-42, slate-90), proportion (1-x, 2-x, half-x), t-shirt sizes (s/m/l).
- **Mode** — distinguishes values across surfaces, enabling light and dark: $color-action-background-secondary-hover-on-light vs ...-on-dark.

## Objects

An object level classifies tokens specific to a component, nested element, or group. **"A global token isn't the place to start"** — record component-specific decisions locally first, like BEM CSS: $esds-input-left-icon-color-fill.

**Principles**: "Start within, then promote across components — identifying candidates for and promoting token ideas from local to global locations is a healthy way to add tokens gradually," and "Don't globalize decisions prematurely... This can avoid annoyingly subjective debates and polluting a global namespace prematurely."

## Namespaces

Prepend a system name (comet-, orbit-; five characters or less) or acronym (slds- for Salesforce Lightning, mds- for Morningstar). A **theme** shifts color and typography across a catalog (Marriott: JW Marriott, Renaissance, W, Courtyard). A **domain** lets a business unit create and distribute tokens beyond the core: $esds-consumer-color-marquee-text-primary.

This taxonomy is the reference practitioners cite when comparing Material's md.{ref|sys|comp} grammar, Spectrum's flat human-readable names, and Fluent's two-layer model — all are instances of the base/modifier/object/namespace structure with different choices about depth and separators.`
  },
  {
    slug: 'kent-dodds-inversion-of-control',
    title: 'Inversion of Control: The Theory Behind Composition-Over-Configuration Component APIs',
    url: 'https://kentcdodds.com/blog/inversion-of-control',
    category: 'guidelines',
    tags: ['component-api', 'composition', 'react', 'kent-dodds', 'design-systems', 'slots'],
    content: `# Inversion of Control

Kent C. Dodds, November 2019. The theoretical underpinning of composition-over-configuration component APIs.

## The problem with accreting options

When reusable code is shared, use cases expand and features accrete, creating four problems: bundle size, maintenance burden, logic complexity ("It's never 'just an if statement'" — each conditional compounds with existing logic into untested combinations), and API complexity (users must learn documentation for features they may never need).

## The principle

"Make your abstraction do less stuff, and make your users do that instead."

## The filter example

The traditional approach accepts boolean options:

    function filter(array, {filterNull = true, filterUndefined = true, filterZero = false, filterEmptyString = false} = {})

— supporting 16 combinations though only six are used. The control-inverted approach transfers the decision to the caller:

    function filter(array, filterFn) { /* apply filterFn to each element */ }
    filter(array, (el) => el !== null && el !== undefined)

"The inverted version enables unlimited use cases without expanding the function itself."

## Compound components (the React implementation)

Rather than accepting props for every customization, components share state implicitly:

    <Menu><MenuButton>Actions</MenuButton><MenuList><MenuItem onSelect={...}>Download</MenuItem></MenuList></Menu>

This grants users rendering control while maintaining implicit state sharing.

## The state reducer pattern

Developed for the Downshift library: instead of adding props like closeOnSelection, provide a function that intercepts state changes. "This single addition dramatically reduced feature requests by empowering developers to modify behavior at the state-change level."

## When NOT to invert

"If a single use case never expands, inverting control adds unnecessary complexity." Dodds advocates "AHA Programming" — Avoid Hasty Abstractions — remaining thoughtful about when abstraction genuinely serves multiple needs.

## Why this matters for design systems

This is the theory under slots-vs-props: **every boolean prop added to satisfy one team's use case is a permanent API and testing liability**, while slots, children, and render-control push variation to consumers. It is the same conclusion Nathan Curtis reaches empirically in "Slots in Design Systems" and that Radix implements with asChild — decomposition and composition over configuration-heavy supercomponents.`
  },
  {
    slug: 'eightshapes-crafting-component-api',
    title: 'Crafting Component API Together: Anatomy, Properties, Layout Across Code and Design (EightShapes)',
    url: 'https://medium.com/eightshapes-llc/crafting-ui-component-api-together-81946d140371',
    category: 'guidelines',
    system: 'EightShapes',
    tags: ['component-api', 'nathan-curtis', 'figma', 'design-systems', 'collaboration', 'process'],
    content: `# Crafting Component API, Together

Nathan Curtis, EightShapes, July 2021. On unifying a component's API across code and design tools.

## The aspiration

"A design system aspires to achieve a shared vocabulary between designers and developers... if design systems deliver a shared vocabulary across libraries built in and documented for developers and designers, shouldn't an API be as similar as possible in code and design tools?"

"Figma's Variants opened minds to concretely mirror how code works in designer tools." This replaced the era of "Sketch's symbol overrides... forcing odd properties and wacky layers so distinct from how code works."

## Three API topics to draft

**1. Anatomy** — "the hierarchy of elements and groups that map to web markup, object composition, and Figma layers." Rapid drafts expose divergence: element names (metadata vs subtitle, body vs description), hierarchy (are actions contained by or a sibling of content?), and subcomponents (CardMedia vs CardImage). Anatomy should reveal needed subcomponents likely requiring their own properties.

**2. Properties** — "both developer and design tools should evoke consistent property names, option names, and defaults" — e.g. the same Dropdown properties for inlineLabel (boolean) and helperTextPlacement (options right or bottom). "It's very common for code to include more properties, such as aria-label and id."

**3. Layout** — "relate anatomy and property choices to element-by-element width, height, spacing, fluidity, and responsive breakpoints."

## When to fit API into a workflow

For small teams: an activity within tasks — a designer and developer sync early, a developer drafts a proposal, the squad critiques. For many makers or outputs: "precede production with a formal API step when handing off to 2+ developers or designers." When starting from what exists: evaluate the existing API during planning to identify constraints to live within or break from.

## Where to draft

"In a visible tool, started from a template, critiqued as a group, available for asynchronous review — findable and editable by everyone (Google Docs, Jira, Asana)." Discipline-specific tools (a code file, a Figma page) "have proven less cross-functionally inclusive." Critique conversations last 15 minutes to an hour per component.

## What it changes

"Drafting API early isn't (just) to minimize divergence. It's also to anchor collaborative expectations and behaviors between designers and developers." Developers invite designers to collaborate on properties and anatomy rather than gatekeeping; design specs drift toward API constructs, with Anatomy and Variants sections grounding handoff.`
  },
  {
    slug: 'eightshapes-slots-in-design-systems',
    title: 'Slots in Design Systems: Four Categories and Decomposition Over Supercomponents (EightShapes)',
    url: 'https://nathanacurtis.substack.com/p/slots-in-design-systems',
    category: 'components',
    system: 'EightShapes',
    tags: ['slots', 'composition', 'component-api', 'nathan-curtis', 'design-systems', 'figma'],
    content: `# Slots in Design Systems

Nathan Curtis, EightShapes, November 2025.

## Definition

Slots are "designated places inside a component where custom content can be inserted" — intentional openings that enable customization while maintaining system consistency.

In Figma, slots appear as pink-bordered layers functioning as frames within component instances. In code, they manifest through the children parameter or named props such as footer:

    <Card footer={<Button variant="primary">Buy now</Button>}>
      <h2>Product name</h2>
      <p>Product description</p>
    </Card>

Slots "make components composable and adaptable, providing a predictable way to customize content while preserving control of the component's surrounding layout, styling, and behavior."

## Four categories

1. **General slots** — moderately-sized components (Modals, Cards) where users compose content, typically the code children.
2. **Named slots** — components with multiple customizable areas. A Row with slots for leading visuals, central content, and trailing actions, enabling variation "without requiring extensive property configurations."
3. **Repeating item slots** — groups like Checkbox Groups, Tabs, Breadcrumbs that accommodate indeterminate quantities of predictable child types.
4. **Nested and higher-order slots** — composition through multiple hierarchy levels, from subcomponents up through page-level layout patterns.

## Architectural requirements

Implementing slots requires defining name (including default slots), description, default values, **permitted children types**, and layout specifications controlling direction, spacing, and padding.

## The core recommendation

"Decompose larger components into simpler subcomponent parts rather than creating bloated, configuration-heavy supercomponents." This is the slots-vs-props resolution in practice — the applied form of Dodds's inversion of control.

This approach demands "ready-made examples as distinct deliverables — scaffolded starting points representing neither documentation nor raw assets, but practical composition templates."

## The Figma/code alignment challenge

A critical challenge is maintaining consistency between Figma and code: slot depth within hierarchies, optimal quantity per component, naming conventions across platforms, handoff complexity, styling inheritance, and constraint levels.

"Slots represent an acknowledgment that real product work is messy and requires space for improvisation, yet this flexibility demands discipline through clear purpose, depth rules, comprehensive examples, and systematic guidance to prevent chaos."`
  },
  {
    slug: 'brad-frost-design-system-ecosystem',
    title: 'The Design System Ecosystem: Core, Recipes, and the 3-Tier Token Layer (Brad Frost)',
    url: 'https://bradfrost.com/blog/post/the-design-system-ecosystem/',
    category: 'guidelines',
    tags: ['architecture', 'brad-frost', 'recipes', 'multi-brand', 'theming', 'web-components', 'design-systems'],
    content: `# The Design System Ecosystem

Brad Frost, September 2023. A mature design system ecosystem as "a delicious-yet-dense layer cake."

## Theming is nearly universal

"Nearly all of our design-system client work over the last 5 years has included creating/evolving some form of themeable design system," and "architecting a thoughtful **3-tier token architecture** is the secret sauce for making a design system support multiple brands, white-labeling, different product families, redesigns, dark mode, and more."

## The layers

**Core design system layer** — "the official story of how it designs and builds user interfaces": design tokens ("low-level design definitions" functioning as brand variables), icons, and UI components with documentation. Tokens warrant separation from UI components to "unlock theming, create a separation of concerns between brand language and UI components, and version brand languages independent of UI components." In code, "JSON files serve as the token source of truth, with tooling like Style Dictionary converting them into technology-specific formats."

**Technology-specific implementation layer** (optional) — Web Components are the recommended core technology: "a standard, part of the web platform itself," interoperable across frameworks, "lightweight, themeable, and self-contained." Framework wrappers address compatibility; "teams with existing React/Angular/Vue libraries that power real products should preserve all that hard-earned adoption" while gradually replacing internals with web-component-powered alternatives.

**Recipe layer** — "a pressure release valve for the UI ecosystem": product-specific libraries combining core components into reusable compositions for particular business domains.

"The design system doesn't have to own, include, or oversee every bit of UI across a company's product landscape. It just needs to provide a core set of ingredients — and support/encourage teams to build recipes with those ingredients."

This gives business units "important agency and autonomy over their domain while still adhering to the standards defined by the core design system." Successful recipes may graduate into the core system.

Above recipes sits an optional **smart component layer** ("back-of-the-front-end": form validation, payment processing, typeahead, data table logic), and some organizations extend to **software starter kits**.

## The governance truth

"Design systems are less about assets and their relationships to one another, but more about people and their relationships to one another." Technical architecture alone cannot maintain layer synchronization — "the humans managing different ecosystem layers must actively collaborate."`
  },
];

let written = 0;
for (const e of ENTRIES) {
  writeFileSync(join(OUT, `${e.slug}.json`), JSON.stringify({
    id: `periphery-${e.slug}`,
    title: e.title,
    source: { type: 'url', location: e.url, ingested_at: new Date().toISOString() },
    content: e.content,
    chunks: [],
    metadata: {
      category: e.category, tags: e.tags, confidence: 'high', system: e.system ?? '',
      source_url: e.url, authority: 'primary',
      research_batch: 'periphery-2026-08', last_updated: new Date().toISOString(),
    },
  }, null, 2));
  written++;
}
console.log(`wrote ${written} staged entries`);
for (const e of ENTRIES) console.log(`  ${String(e.content.length).padStart(6)}  ${e.title.slice(0, 64)}`);
