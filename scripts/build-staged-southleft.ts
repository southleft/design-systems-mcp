/**
 * Staged entries from Southleft's own writing (Slot Machine, TJ Pitre).
 * Primary-source material for Context-Based Design Systems, the contract
 * position on source of truth, and the machine-readable/machine-governed line.
 *
 * Run: npx tsx scripts/build-staged-southleft.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'content/staged';
mkdirSync(OUT, { recursive: true });

interface Staged {
  slug: string; title: string; url: string; category: string;
  tags: string[]; content: string;
}

const ENTRIES: Staged[] = [
  {
    slug: 'southleft-use-ai-to-need-less-ai',
    title: 'Use AI to Need Less AI: Computation Over Inference (Southleft)',
    url: 'https://southleft.substack.com/p/use-ai-to-need-less-ai',
    category: 'guidelines',
    tags: ['southleft', 'contracts', 'determinism', 'ai', 'design-systems', 'dtcg', 'source-of-truth', 'governance'],
    content: `# Use AI to Need Less AI

TJ Pitre, Southleft, July 2026.

## The thesis

"The most interesting AI work in design systems right now is the work that takes AI out of the loop."

"I don't think people are sick of AI. I think they're sick of paying inference costs for problems that were never probabilistic to begin with. What token colors the primary button. What props the Card accepts. Whether Figma and code still agree. Those are lookups, not judgments. Asking a model to re-derive them on every request is slow, expensive, and slightly different every time."

## The authoring/enforcement split

"The sharpest people in this space have sorted the work into two piles. **Authoring is judgment-heavy and happens once. Enforcement recurs forever and has to be boring.** AI is great at the first pile and a liability in the second. The new wave of tools puts the model where it belongs: helping you produce a spec, then stepping aside while deterministic machinery does the rest."

"It's happening at three layers at once. Tokens have a spec. Components are getting one. Documentation just got one."

## Tokens made the trip first

The DTCG shipped the first stable token spec (2025.10) in October. Figma, Penpot, Sketch, Tokens Studio, Style Dictionary, and Terrazzo support it or are implementing it; Carbon has an open issue to migrate its entire token pipeline.

"Tokens are the proof that this model works. Standardize the format and drift becomes checkable. Checkable drift means tooling compounds instead of every team rebuilding the same pipeline from scratch."

## Computation over inference

On Nathan Curtis's Specs: "about a second per component versus five to ten minutes of agentic extraction, zero AI tokens versus a hundred thousand, identical output every run versus inference gaps and overconfidence. He calls it 'computation over inference.' I'd put that phrase on a t-shirt."

## The contract position on source of truth

On Christine Vallaure's framing: "stop crowning Figma or code as the source of truth. Put a small machine-readable contract in the middle and generate both surfaces from it. **Neither is the original. Both are printouts of the same recipe.** And the part she singles out as new isn't the generation. It's the checker that proves the two copies still match."

Disclosure noted in the piece: the project is Southleft's own. DS Contracts is "Southleft's proof of concept and candidate spec for exactly this. 51 component contracts and 282 DTCG tokens generate a typed React library and a Figma library, a three-way differ classifies every mismatch between contract, code, and canvas, and extraction adapters pull proposed contracts out of systems you already have."

## The A/B test on honest generation

"An ungoverned agent building screens scored 69/100 with 90 violations. Invented props, hard-coded colors, restyled components. The same model, held to the compiled contract catalog, scored 100/100. And when it hit a real gap in the system, it reported the gap instead of faking around it. Same deterministic judge, both runs."

## The governance answer

"AI at authoring time. Determinism at run time. The model helps you build the thing, and the thing doesn't need the model."

"It also answers the governance question everyone circles once agents enter the workflow: where does authority live? My answer is that **authority belongs to whatever layer can refuse deterministically, not whatever layer instructs loudest. A model can be talked around. A schema can't.**"

## On timeline

"Tokens took roughly a decade to go from a good idea to a stable spec with real adoption. The component layer is moving faster, because agents made the cost of ambiguity visible to everyone at once."`
  },
  {
    slug: 'southleft-my-beef-with-agentic-design-systems',
    title: 'My Beef with Agentic Design Systems (Southleft)',
    url: 'https://southleft.substack.com/p/my-beef-with-agentic-design-systems',
    category: 'guidelines',
    tags: ['southleft', 'agentic-design-systems', 'governance', 'ai', 'design-systems', 'accountability', 'vibe-coding'],
    content: `# My Beef with Agentic Design Systems

TJ Pitre, Southleft, June 2026. The sharpest critique of the term from someone who uses agents heavily.

## The framing

"I am not an AI skeptic. I run a design systems practice that uses agents at nearly every step... I want agents in the loop. I want more of them."

"So when I say I have a beef with 'agentic design systems,' understand that it isn't a beef with agents. It's a beef with one specific move that the term smuggles in... **Here's the move: handing the judgment layer of a design system to an autonomous agent loop that no human owns.**"

## The sleight of hand

"The word doing the quiet damage is *autonomously*, sitting right next to *self-healing loop*. Because there are two completely different things bundled inside the word 'agentic,' and the term deliberately blurs them:

- **Architecture:** are agents acting in a loop? That's a capability question. Answer: yes, and good.
- **Governance:** who owns the loop, and who's accountable for the calls it makes? That's an authority question. And 'agentic design system' answers it by quietly removing the human.

These are different axes."

## A design system is a governance technology

"Strip away the Figma libraries and the Storybook instances and ask what a design system actually is. It's a set of decisions an organization has agreed to and committed to enforcing over time. What does 'primary action' mean here. When do we break our own grid. Does this thing deserve to exist as a component at all, or are we about to enshrine a one-off into the canon forever."

"Those aren't generation problems. They're judgment calls, and they carry consequences the organization is accountable for."

## The durable claim

"I'm not claiming a human will always produce a better component than an agent. That's a capability claim, and capability claims have a shelf life... The durable claim isn't about skill. It's about ownership. **Even if an agent makes an identical call to the one I'd make, that call still needs a human who owns it. Accountability doesn't transfer to a loop.**"

## Versus vibe coding

"At the generation step, yes, they look identical... The difference is what happens next. Vibe coding is defined by what comes after generation, which is nothing. You eyeball it, it feels right, you move on. The defining trait is abdicated verification, and for a throwaway prototype that's completely fine."

"A design system exists for the opposite reason. Its entire job is to kill drift and hold many surfaces to one standard over time. So the verification step isn't optional. It's the reason the thing exists at all."

## The clean test

**"Ask: what rejects the agent's output, and who decided the rule it's being rejected against?"**

"If the answer is a human-owned gate, it's the real thing. If the answer is 'another agent checks it' all the way down, you've built vibe coding with extra infrastructure and a more confident logo. And that version is arguably worse than a person vibe coding in a scratch repo, because **it launders drift through the authority of the system.** The output looks sanctioned. It came from 'the design system.' Nobody chose it."

## The honest part

"A design system is hard, slow, unglamorous work... 'Agentic design system,' in its laziest reading, is being sold as the cheap way out of all that. Point the agents at it, let them self-heal, walk away. The generation is the easy 80%. The judgment and the enforcement are the hard 20%, and the hard 20% is the entire point. Automating away the part that was easy and calling the result 'agentic' gets the ratio exactly backwards."

## Where it lands

"**Agents do the work between the gates. Humans own the gates and the judgment calls.** The instant you remove the human from the judgment layer and let the loop close on itself, you don't have a more advanced design system. You have a faster way to generate confident, unowned drift."

"Not agents versus no agents. Owned judgment versus abandoned judgment."`
  },
  {
    slug: 'southleft-context-based-design-systems',
    title: 'Context-Based Design Systems: Orchestrate-and-Execute, Not Propose-and-Approve',
    url: 'https://southleft.com/insights/design-systems/context-based-design-systems-revisited/',
    category: 'guidelines',
    tags: ['southleft', 'context-based-design-systems', 'cbds', 'context-engineer', 'ai', 'design-systems', 'governance'],
    content: `# Context-Based Design Systems, Revisited

TJ Pitre, Southleft, May 2026. The named framework, revisited a year on.

## The core idea

"If you let context flow through every phase of the product lifecycle, each step gets smarter than the one before it. Design informs code. Code informs documentation. Documentation informs the next round of design."

"**Context, not data, is the unit of value.** Tokens, components, and documentation are useful. But what makes a system work is the meaning that travels with them. The intent behind a button. The conditions where a pattern applies. The reasons something exists at all."

"Every team I've worked with that struggles with AI-assisted workflows has the same root issue. The components are there. The tokens are there. But the meaning is missing or scattered, and AI can't reason about what it can't read."

"**Bad metadata at machine speed is worse than bad metadata at human speed**, because it's harder to notice and faster to spread."

## The operating-model distinction

"The implicit shape of an agentic workflow is **propose-and-approve**. The agent initiates. The human enters when the agent escalates. Even in the most careful versions, the AI is upstream and the human is the gate."

"**CBDS reverses that order. The human is upstream. The AI executes inside constraints a person already set.** Every action has a thread you can follow back to a human decision. The orchestrator stays ahead of the work, not behind it."

"Propose-and-approve assumes the human will catch what matters. **Orchestrate-and-execute** assumes the human is already there."

## What CBDS is

- A workflow where context flows through every phase of the product lifecycle, not just the design phase
- Components that carry intent, behavior, accessibility, and usage rules, not just visual properties
- A human-led operating model where the AI executes inside boundaries a person defined
- A way to bring product designers into the code contribution layer in a meaningful way
- A discipline that treats design QA with the same rigor as code QA

## What CBDS isn't

- Not a system where agents propose changes and humans rubber-stamp them
- Not autonomous maintenance of the design system
- Not a replacement for the people who steward the system
- Not a bet that the AI will catch its own mistakes
- Not "humans in the loop" as a polite afterthought

"The orchestrator is not the reviewer at the gate. The orchestrator is the one driving."

## The real shift: designers contributing code

"For two decades, the design-to-development handoff has been a translation problem... The micro-interactions, the easing equations, the scroll-linked transitions, the fade timings, all the things that separate a good interface from a great one, often get approximated rather than faithfully built."

"In a CBDS workflow, the designer works in a design branch. With AI assistance, they produce the first coded version of the component themselves. They visually QA their own work in code. They iterate on the things only they can feel, the timings, the curves, the negative space... When the component matches their intent, they open a pull request. The context engineer takes it from there."

"What this changes is the value stack. Every role moves up... The whole loop shortens, not because anyone is moving faster, but because no one is duplicating work."

"The old 'should designers code' debate has quietly resolved itself. The question now is who gets to author the first draft."

## The Context Engineer

"These are not prompt engineers. They're system stewards. They own the fidelity of the entire flow from intent to production."

"They are not gatekeepers at the end of the pipeline. They are in session, alongside the work, throughout. They make the upstream decisions the AI executes against... The job, simplified: **own the trust layer.** Make sure that when something ships, you can trace why it shipped, who decided what, and what the AI was authorized to do at every step."

## Why context beats autonomy

"Speed without context creates drift you have to undo later. Speed with context compounds. The teams that win aren't the ones with the most agents. They're the ones with the clearest context flowing through their systems and people who know how to steward it."

**"Tools change fast. Context compounds."**`
  },
  {
    slug: 'southleft-how-context-cascades',
    title: 'How Context Cascades: CSS Cascades Values, Design Systems Should Cascade Intent',
    url: 'https://southleft.com/insights/design-systems/the-cascade-effect-in-context-based-design-systems/',
    category: 'guidelines',
    tags: ['southleft', 'context-based-design-systems', 'cascade', 'design-tokens', 'validation', 'design-systems'],
    content: `# How Context Cascades

TJ Pitre, Southleft. The mechanism underneath Context-Based Design Systems.

## What CSS got only partially right

"The 'cascading' part isn't just a fancy name; it's the core principle that makes CSS powerful. Rules defined at the top level automatically flow down to more specific elements below."

"But here's what CSS got only partially right: **it cascades values, not context.** Your paragraph knows it should be Helvetica, but not why that font was chosen or when to break that rule intelligently."

## Cascading intent

"In a traditional design system, we pass values downstream — colors, spacing, typography. But in a context-based design system, we pass something far more powerful: structured meaning."

"Imagine if every design decision carried a little backpack of context with it:
- Not just '#0066CC' but 'primary-action-color, used for CTAs, high contrast required'
- Not just '16px' but 'body-spacing, scales with viewport, maintains vertical rhythm'
- Not just 'Button' but 'interactive element, has hover/focus/disabled states, expects onClick handler'"

"This context doesn't disappear at handoff. It flows through your entire workflow: **Design Files → Validation → Tokens → Components → Layout Generation → Product.** Each phase inherits everything the previous phase knew, then adds its own intelligence."

## Multiplication, not addition

"When context cascades properly, each layer doesn't just receive information — it becomes smarter and more capable... **It's multiplication, not addition.** One well-structured component with proper context enables dozens of correct implementations downstream."

## The chain reaction works both ways

"Strong context at the source creates a cascade of good decisions. But the inverse is equally true, and this is crucial, **flaws compound as they flow downstream.**"

"A poorly named component in Figma ('Button2_final_v3') loses its context. Without clear intent, developers guess. AI tools hallucinate. Layout generation becomes unreliable. What started as naming laziness becomes hours of debugging and manual fixes."

"This is why validation becomes critical at every layer. Just as a water treatment plant ensures clean flow downstream, design QA tools ensure context remains intact and meaningful as it cascades through your system."

## Enabling new participants

"When context flows properly, something remarkable happens: non-developers can participate meaningfully in the creation process... 'Create a pricing page with three tiers and emphasis on the professional plan' becomes possible because the system understands what a pricing card is, how emphasis works, and which components serve these purposes."

## The intelligent override

"Cascading doesn't mean rigid. Just as CSS allows specific overrides, context-based systems permit exceptions, but now those exceptions can be intelligent. Instead of blindly overriding a color, you might override with context: 'Use danger-color here instead of primary because this action is destructive.'"

"These overrides should be rare. If you're constantly fighting the cascade, something upstream needs attention. Fix the source, and the entire stream clears up."

## The principle

"Context-based design systems succeed because they mirror a fundamental principle of good design: **clarity compounds.**"

"Start at the source. Encode meaning. Let context cascade. Watch your system not just flow, but think."`
  },
  {
    slug: 'southleft-system-parity-not-code-to-design',
    title: 'Code → Design Isn\'t the Point. System Parity Is. (Southleft)',
    url: 'https://southleft.com/insights/design-systems/code-to-design-isnt-the-point-system-parity-is/',
    category: 'guidelines',
    tags: ['southleft', 'parity', 'source-of-truth', 'figma', 'code-to-design', 'governance', 'design-systems'],
    content: `# Code → Design Isn't the Point. System Parity Is.

TJ Pitre, Southleft, February 2026. On the Claude Code to Figma "Code to Canvas" workflow and what it does and doesn't solve.

## The distinction

"These tools aren't competing. They're operating at different layers of the stack."

## What code-to-canvas does well

"The official Claude to Figma flow is strong at one thing: taking a real, running UI and bringing it onto the canvas. That's valuable when you're: Prototyping quickly; Pressure-testing flows; Working through early product ideas; Reviewing something with stakeholders; Capturing exploratory work."

"For many teams, especially in early-stage or marketing-heavy environments, that's a big win. It turns 'vibe-coded' prototypes into something shareable and discussable."

## Where system work actually gets hard

"Design systems work breaks in different places. The hard part isn't generating screens. It's managing: Token inheritance; Variable propagation; Component relationships; Cross-file dependencies; Governance; Documentation; Accessibility; Versioning; Parity between code and design."

"Once you're operating across multiple teams and products, screenshots and layers stop being enough. You need system awareness."

## Visualization vs parity

**Code to Canvas:** Pulls working UI into canvas; optimizes for speed and iteration; great for exploration; minimal system awareness.

**System tooling:** Reads live implementations; maps them to system components; enforces token usage; supports governance and documentation; optimizes for durability.

"One helps you see things. The other helps you keep things aligned."

## The reconciliation loop

Describing the demo: generate a real UI from live components, run it in a dev environment, read that implementation, rebuild it in Figma using system components, tokens, and variables, audit and correct drift, add comments for designers.

"End result: the same UI, mapped back into the design system. **Not as screenshots. Not as generic layers. As governed system assets.** That's the difference. You're not just visualizing code. You're reconciling it with your system."

## The open question

"Once you pull UI into Figma and change it, how reliably does it get back into production code? Right now, that's still fragile in most setups. Without strong componentization and system metadata, you're often relying on 'close enough' regeneration. System-aware tooling is what makes that loop trustworthy. We're not fully there yet."

## Not zero-sum

"A few years ago, 'code ↔ design parity' was niche. Now it's table stakes."

"Long term, the most powerful setups will probably use both... That's where the 'beautiful harmony' actually shows up. Not in one tool replacing another. **In tools specializing and cooperating.**"

"We're finally seeing an ecosystem emerge where: Code isn't isolated; Design isn't static; Systems aren't afterthoughts; **Context travels with the work.**"`
  },
  {
    slug: 'southleft-life-after-the-prototype',
    title: 'Life After the Prototype: The Handshake Is the Hard Part (Southleft)',
    url: 'https://southleft.substack.com/p/life-after-the-prototype',
    category: 'guidelines',
    tags: ['southleft', 'prototyping', 'ai', 'storybook', 'workflow', 'design-systems', 'guardrails'],
    content: `# Life After the Prototype

TJ Pitre, Southleft, June 2026. The workflow for getting from an AI prototype to something shippable.

## The reframe

"Most of the conversation about AI and design right now is stuck on whether the machine can generate a screen. It can. That was never the hard part. **The hard part is the handshake.** Between the AI, your design system, and the people downstream who have to turn it into a product."

"A prototype that looks finished but uses none of your real components is not progress. **It is a liability with good lighting.** It looks shippable, so people assume it almost is, and then someone has to quietly rebuild it from scratch in the actual codebase. That rebuild is where your three months go."

## Start on a branch you can't break

"Work on a dedicated design branch. One that is blocked from merging into anything that touches production... This sounds like a boring operational detail. It is the most important step in the whole process. Because the branch is safe, you can let the AI be loose... **The safety on the outside is what buys you freedom on the inside.**"

## Point it at real materials

"Connect the model to your actual system. Real tokens. Real components... This is the line between vibe coding and something you can defend in review. A model with no access to your system will cheerfully invent a component. A model pointed at your real token and component architecture has somewhere true to stand."

## Write the guardrails down

"Put the rules in a Markdown file. Not in your head, not in a one-off prompt you will forget by Thursday. A file the agent reads every single time."

"Mine say, more or less: stay inside the token and component architecture, do not deviate from it. Build complete UI, but do not invent anything that is not there. **I want zero to one, not zero to one hundred.**"

"That last line does more work than it looks like. Left alone, a model tends to either do the bare minimum or get excited and decorate."

## Generate into Storybook, not a void

"Storybook already holds a manifest of every component. Those components are already wired to your tokens and already styled. There is nothing for the model to fetch, nothing to fabricate, nowhere to wander off to."

"Then read the code. You do not need to be an engineer for this. If it imported your actual components, good. If you see a wall of divs and inline styles, it went rogue and rebuilt your system from scratch instead of using it. **That one tell is most of the game.**"

## Make it grade its own work

"When the screen finally looks right, do not accept it yet. Ask two questions."

**First: "have you deviated from the design system at all?"** "If it says yes, ask where the gaps were and why. The answer is useful either way. Sometimes it deviated because something is genuinely missing from your system, and now you have found a real gap... Sometimes it deviated because it decided something was a best practice and added it on its own. That is not a gap, that is the model freelancing."

**Second: "what are you least confident in right now?"** "AI is your biggest hype man. Left to its own devices it will tell you everything is perfect and everything shipped. That question breaks the spell. It sends the model back through the session to second-guess itself, a little model judging the model. What comes back is often surprising, and it is usually the exact thing you would have caught in review three days later."

## The bonus

"It doubles as design system QA. Every time you run it, the AI shows you where your system is thin. You ship a screen and audit your foundations in the same pass."

"The single most useful thing AI did in this entire process was tell me my system was missing pagination. **Generating a screen is cheap now. Knowing where your system breaks is the expensive, valuable part**, and this surfaces it for free."

## Hand it off like an adult

"This is not AI replacing the engineer. It is a designer getting to a real, in-system eighty percent on a safe branch, and an engineer inheriting clean component-based code instead of a flat redline and a screenshot."

"Cycles are not failure. One-shot magic was never the goal... And keep yourself in the chair as the judge. The model can assemble, check itself, and commit. It still has no idea what your product is for. You do."`
  },
  {
    slug: 'southleft-machine-readable-not-machine-governed',
    title: 'Machine-Readable, Not Machine-Governed (Southleft)',
    url: 'https://southleft.substack.com/p/machine-readable-not-machine-governed',
    category: 'guidelines',
    tags: ['southleft', 'machine-readable', 'governance', 'ai', 'design-systems', 'documentation', 'json'],
    content: `# Machine-Readable, Not Machine-Governed

TJ Pitre, Southleft, July 2026.

## The stance

"Your design system is turning into infrastructure for a reader you never designed it for. That reader is an agent, and agents don't read the way people do."

"**Make the system machine-readable. Don't make it machine-governed.** An agent that can read and reason over your system well is infrastructure, and that's good. An agent that owns the judgment layer, the gates, the calls about what belongs and what gets deprecated, is a category error."

"**A design system is the encoded record of decisions an organization is accountable for.** You can automate the mechanical work of publishing and querying that record. You cannot automate away the human who's responsible for what it says."

## Format as a performance characteristic

On Diana Wolosin's Indeed benchmark: "Her team benchmarked eight metadata formats across more than a thousand prompts to find the best way to feed a design system to an agent over MCP. JSON beat Markdown badly, roughly 80% fewer tokens, a fraction of the cost, and better accuracy."

"**The format your documentation takes is now a performance characteristic.** Prose that reads beautifully to a human can be an expensive, lossy input to a machine."

## The second surface

On Meta's Astryx: "a React and StyleX design system built ground-up to be AI-operable rather than retrofitted. A built-in MCP server so an agent can query components without scraping. A \`--dense\` flag that strips human-friendly filler for token-efficient payloads. A CLI \`manifest\` command that returns a machine-readable contract for every command, basically an OpenAPI spec for the command line."

"The leading edge of this work is no longer only about what humans see in a component gallery. It's about **publishing a second surface: structured, dense, contractual, written for a reader that will never appreciate your prose but will absolutely punish your ambiguity.**"

## Ambiguity becomes a bug

"The design system's job is shifting from coverage (did we document everything) to intent (can a reader recover why)."

"When an agent hits a gap, it doesn't stop and ask. **It fills the space with a plausible approximation and moves on**, and nobody notices until that approximation is three screens deep in production. A naming inconsistency a human would shrug off becomes a fork in an agent's reasoning. **The gaps your team tolerates because everyone knows the unwritten rules are exactly the gaps a machine can't see and won't respect.**"

"That's the actual work of the substrate era, and it's not glamorous. Making the implicit explicit. Writing down the decision you made two years ago so the agent doesn't badly rediscover it every time it builds."

## Where it leaves us

"As code, motion, and effects all collapse into promptable material, the average output gets cheap and the differentiator becomes taste, plus whatever makes your output recognizably yours instead of generic AI slop. A good design system is exactly that: the substrate that makes generated work coherent instead of merely fast."

"So build the substrate. Make it dense, make it contractual, ship the MCP server, benchmark your token cost. **Just keep a person on the judgment layer.** The whole point of investing in the substrate is so that when the agent proposes, a human with taste can direct and judge. That's the only scarce thing left."`
  },
  {
    slug: 'southleft-ai-proposes-design-system-disposes',
    title: 'AI Proposes, The Design System Disposes (Southleft)',
    url: 'https://southleft.substack.com/p/ai-proposes-the-design-system-disposes',
    category: 'guidelines',
    tags: ['southleft', 'design-tokens', 'ai', 'accessibility', 'oklch', 'theming', 'design-systems'],
    content: `# AI Proposes. The Design System Disposes.

TJ Pitre, Southleft, July 2026. A working demo and the argument underneath it.

## The claim

"**AI is only as good as the structured context it can reach.** Point a coding agent at a codebase with clean, semantic design tokens and a well-documented component API, and it ships UI that matches your product on the first pass. Point that same agent at a pile of hardcoded hex values and one-off components, and it guesses. Plausibly, confidently, and wrong. It generates drift. It creates the exact technical debt you hired it to eliminate."

"**The design system is not a nice-to-have that sits next to your AI strategy. It is your AI strategy's substrate.** The teams pulling real speed out of AI tooling right now are the ones who did the boring foundational work first. Everyone else is generating inconsistency at scale."

## The three-tier token architecture

- **Primitives.** The raw palette. \`--sl-color-red-500\` is a specific hex value and nothing more.
- **Semantic aliases.** Meaning, not value. \`--sl-accent\` points at a primitive. \`--sl-bg\`, \`--sl-fg\`, \`--sl-border\`. These are what components actually consume. "A component never knows it's red. It knows it's 'accent.'"
- **Component-level.** Where a specific piece of UI needs its own decision, it references the semantic layer, never the primitive.

"This is Design Systems 101. I'm not claiming novelty. I'm claiming that **the discipline of never letting a component touch a raw value is precisely what buys you everything interesting later.**"

## The division of labor

- **The AI is the art director.** A prompt goes to a serverless function calling Claude with a strict JSON schema. "Claude doesn't return CSS. It returns decisions": a personality, an accent hue, background color carry, a texture, a motion feel, light or dark lead, a typeface.
- **The design system is the guardrail.** "A small color engine running in the browser takes the hue and chroma the AI proposed and derives the full palette in OKLCH, a perceptual color space where 'make this readable' is a math problem instead of a vibe. For every foreground/background pair, it binary-searches the lightness until the combination clears its WCAG AA contrast target."
- **Therefore the AI cannot ship an inaccessible theme.** "The model proposes, the solver disposes... **By construction, not by luck.**"

"**AI proposes. The design system disposes.** That sentence is the product... don't ask AI to be the taste and the guardrails and the accessibility conscience all at once. Ask it to propose within a system that already encodes those things. The system is where correctness lives. The AI is where speed lives."

## Generate, don't duplicate

On the published token file: "For a while, that file was a hand-maintained snapshot. And like every hand-maintained snapshot in the history of software, it drifted... So we fixed it the way you're supposed to fix drift. **We removed the possibility of it.** /tokens.json is now generated at build time by parsing the actual CSS. The stylesheet is the single source of truth. The published token file is a build artifact of it."

"That's a small thing. It's also the entire method. Single source of truth. Generate, don't duplicate. **Make the correct state the only possible state**, so nobody has to remember to keep two things in sync."

## What AI-ready means

"Not bolting a chatbot onto a product, but building the token architecture, the component API, the design-to-code parity, and the machine-readable documentation that let AI operate inside a system that makes bad outcomes structurally difficult."

"Take away the token architecture and there's no demo. There's just an AI generating inaccessible, off-brand CSS very quickly, which is a downgrade, not a feature."

"The gap between 'we have components' and 'an AI can re-derive our entire product from a sentence and stay accessible' is exactly the work, and it's the highest-leverage work you can do before AI tooling is anything other than a liability."`
  },
  {
    slug: 'southleft-vibe-coding-vs-context-engineering',
    title: 'Vibe Coding vs. Context Engineering: The Sketch and the Craft (Southleft)',
    url: 'https://southleft.com/insights/ai/vibe-coding-vs-context-engineering/',
    category: 'guidelines',
    tags: ['southleft', 'vibe-coding', 'context-engineering', 'ai', 'design-systems', 'terminology'],
    content: `# Vibe Coding vs. Context Engineering

TJ Pitre, Southleft, November 2025.

## The problem with the vocabulary

"Every time someone uses AI to generate code, tweak a component, or spin up an interface, they call it 'vibe coding.' And I don't feel like that's quite right. We're starting to lump two very different disciplines into the same bucket, and in doing so, we're blurring a boundary that really matters."

## Vibe coding is the sketch

"Vibe coding is about expression, not execution. It's that burst of creativity when you open Bolt, Lovable, or Cursor and just start building. You don't know exactly where you're headed, but that's the point... It's the pencil sketch before the painting."

"There's beauty in that imperfection. It's playful, fast, and inclusive... But a sketch, no matter how inspired, isn't the finished portrait."

## Context engineering is the craft

"Context engineering isn't a sequel to vibe coding; it's a discipline of its own. It's what happens when you bring structure, semantics, and intent to the table, not vibes."

"When we build Context-Based Design Systems at Southleft, we often use AI to transition components from Figma to codebases. **The AI gets it maybe 50-80% right on average**, depending on the complexity of the component. That's fine. It's not about perfection. What happens next isn't vibe coding, it's context engineering. Experienced developers step in... They contextualize the AI's output. They use their judgment and domain expertise to bring the component the rest of the way — manually, methodically, and intelligently. AI stays in the loop, but it's guided by engineered context rather than open-ended prompts."

## The relationship

"Vibe coding and context engineering are not steps on a single ladder. **They're parallel tracks that can intersect, but don't depend on each other.**

- Vibe coding inspires ideas. Context engineering realizes them.
- Vibe coding invites everyone to play. Context engineering requires skill, patience, and technical literacy.
- Vibe coding asks, 'what if?' Context engineering asks, 'how, exactly?'"

## Why the distinction matters

"When we call everything 'vibe coding,' **we flatten the craft.** We risk implying that all AI-assisted development is casual, unstructured, or chaotic — when in fact, there's a whole other class of work happening quietly behind the scenes: highly skilled engineers designing systems that teach AI to behave responsibly, consistently, and contextually."

"Context engineering deserves its own name because it's its own practice. It's what separates creative generation from intelligent production."

"Vibe coding is freedom. Context engineering is focus. One starts the story. The other finishes it. **Vibe coding is the sketch. Context engineering is the craft.**"`
  },
  {
    slug: 'southleft-declared-vs-designed-documentation',
    title: 'Declared vs. Designed Documentation: Annotations Beat Doc Frames for Agents',
    url: 'https://southleft.substack.com/p/code-prototypes-are-fast-feedback',
    category: 'documentation',
    tags: ['southleft', 'documentation', 'annotations', 'figma', 'ai', 'agents', 'machine-readable'],
    content: `# Declared vs. Designed Documentation

TJ Pitre, Southleft, June 2026. From "Code prototypes are fast. Feedback on them is not."

## The core distinction

"For AI, **declared documentation beats designed documentation.** A description field or an annotation returns structured text an agent can read. A pretty frame on a canvas makes that same agent reconstruct meaning from a node tree and guess."

## Why prototypes are bad review artifacts

"A live prototype is a great build artifact and a poor review artifact. A design lead can't drop a comment on one specific state. An engineer can't see the flow laid out end to end. A PM has a question about a screen buried three interactions deep, and the only way to answer it is to run the prototype again and try to land on the exact moment. **The thing that makes a prototype good for building is the same thing that makes it hard to align on. It only exists in motion.**"

## The annotations are the actual product

"The annotations it writes are interaction and implementation detail in plain text, pinned to the design. A design manager reads them to give feedback. A developer reads them to build the thing. And the next agent that opens the file reads them too, instead of inferring intent from layout."

"Designer intent and developer intent land in the same place, in a form that survives the handoff."

"The annotation detail it produces is more than I'd write by hand on a normal day. That's not a small point. **The tedious documentation you skip when you're busy is the documentation an agent needs most.**"

## Parity falls out for free

"When the skill rebuilds the prototype from your design system, it flags anything that doesn't map cleanly... Sometimes they're new components you invented while iterating, which makes them candidates to contribute back to the system rather than mistakes to clean up. Either way, it surfaces the drift and leaves the call to you."

"Design-to-code parity as a byproduct of doing the main job."

## Make the agent check its own work

"You don't nudge the agent by hand and move on. The overlap is a repeatable failure, so you address it at the source and edit the skill itself... we added a step that runs after the agent thinks it's finished: before it reports done, it takes another pass through the output, re-examines the frames, and confirms nothing overlaps."

"That step exists because **AI will tell you the job is finished when it isn't.** It'll set everything up, declare success, pat itself on the back, and leave you to find the mess. The validation pass works because it forces the agent to look again instead of trusting its own first report."

## Self-check vs eval

"If that sounds a little like an eval, you're not wrong. It's a cousin. **A self-check fixes this one run at runtime. An eval measures how often the skill succeeds across many runs.** Same criteria underneath, different jobs."`
  },
  {
    slug: 'southleft-mise-en-place-greenfield',
    title: 'Mise en Place for AI: Setting Up a Design System From a Blank Directory (Southleft)',
    url: 'https://southleft.substack.com/p/mise-en-place-for-ai-setting-up-a',
    category: 'guidelines',
    tags: ['southleft', 'ai', 'design-tokens', 'dtcg', 'greenfield', 'workflow', 'design-systems'],
    content: `# Mise en Place for AI: Setting Up a Design System From a Blank Directory

TJ Pitre, Southleft, May 2026.

## The unfair advantage most demos have

"Almost every AI-and-design-systems demo I've done starts from an unfair advantage. The codebase already exists. The framework is chosen, the styling method is settled, the token architecture is in place. The AI has dozens of examples to pattern-match against, so of course it produces something reasonable. **It's reading the room because the room is already furnished.** I wanted to see what happens when the room is empty."

## Establish context before generation

"Before I ask the AI to build anything, I want it to know exactly what we're working with: the framework, the styling method, the icon set, and most importantly, where the tokens come from. **So the first move isn't 'build me a button.' It's establishing context.**"

The architecture given up front: React application; Storybook via npm; Lucide icon set; CSS custom properties with CSS Modules; export tokens from the live Figma file.

"That last instruction is the one that matters most. I'm not asking the AI to invent a color palette or guess at spacing. I'm pointing it at the source of truth and telling it to pull from there."

## Why this architecture

"CSS custom properties with CSS Modules keeps the token layer honest... Nothing gets hardcoded into a component. When a value changes upstream, it changes everywhere downstream."

"The token export uses the DTCG JSON spec. That's the part I care about. It means the tokens aren't in some proprietary shape that only this workflow understands... **The JSON is the canonical layer; the rest is downstream.**"

Bidirectional: "Export reads the Figma variables table and writes the tokens out. Import does the reverse... Design-to-code token parity, in both directions. Whichever side moves, the other can catch up."

## Where it got ahead of itself — and the fix

"It connected 312 variables, light and dark mode, tier one and tier two, all coming straight from the Figma variables table into clean CSS custom properties. Then it did something I didn't ask for... it decided to build the button too."

"The first-pass button looked fine at a glance, but it wasn't right. It didn't actually share the token architecture and properties of the real button in Figma... It was enthusiastic. It was also wrong."

"The fix, and it's the whole point of working this way: take a snapshot of the actual button component, digging into the variants, the properties, the descriptions, and the annotations... It found the gaps between what it had assumed and what Figma actually defines, and it corrected them."

"**That gap-and-correction loop is not a failure of the workflow. It's the workflow.** The AI moves fast and sometimes overreaches; the structured context is what reins it in. The tooling is the net, not the whole catch."

## The principle

"The reason the Greenfield setup works at all is that the context is engineered before the generation starts... When it did overreach, the recovery wasn't 'try again and hope.' It was pointing it back at a real, structured source of truth and letting it reconcile."

"**AI-readiness is just good design system hygiene, viewed from a different angle.**"

Build order: "start with primitives and work outward toward components with more dependencies and nesting. Build the foundation first, then the things that lean on it."`
  },
];

let written = 0;
for (const e of ENTRIES) {
  writeFileSync(join(OUT, `${e.slug}.json`), JSON.stringify({
    id: `southleft-${e.slug}`,
    title: e.title,
    source: { type: 'url', location: e.url, ingested_at: new Date().toISOString() },
    content: e.content,
    chunks: [],
    metadata: {
      category: e.category, tags: e.tags, confidence: 'high', system: 'Southleft',
      source_url: e.url, authority: 'primary',
      research_batch: 'southleft-2026-08', last_updated: new Date().toISOString(),
    },
  }, null, 2));
  written++;
}
console.log(`wrote ${written} staged entries`);
for (const e of ENTRIES) console.log(`  ${String(e.content.length).padStart(6)}  ${e.title.slice(0, 64)}`);
