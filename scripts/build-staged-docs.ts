/**
 * Staged entries: AI coding environments (how a design system is supplied to
 * each) and design system documentation methods/formats.
 *
 * Backticks are deliberately avoided in content strings — these are template
 * literals and an unescaped backtick breaks the build.
 *
 * Run: npx tsx scripts/build-staged-docs.ts
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
    slug: 'claude-code-memory-claudemd',
    title: 'Claude Code Memory: CLAUDE.md, Path-Scoped Rules, and Load Order',
    url: 'https://code.claude.com/docs/en/memory',
    category: 'tools',
    system: 'Claude Code',
    tags: ['claude-code', 'claude-md', 'agents-md', 'ai', 'rules', 'design-systems', 'context'],
    authority: 'primary',
    content: `# Claude Code Memory (CLAUDE.md and rules)

The mechanism by which a design system is supplied to Claude Code.

## Load order, broadest to most specific

| Scope | Location | Purpose |
|---|---|---|
| Managed policy | macOS: /Library/Application Support/ClaudeCode/CLAUDE.md; Linux/WSL: /etc/claude-code/CLAUDE.md; Windows: C:\\Program Files\\ClaudeCode\\CLAUDE.md | Organization-wide, managed by IT |
| User instructions | ~/.claude/CLAUDE.md | Personal preferences across projects |
| Project instructions | ./CLAUDE.md or ./.claude/CLAUDE.md | Team-shared, per project |
| Local instructions | ./CLAUDE.local.md | Personal project preferences; gitignore it |

"CLAUDE.md and CLAUDE.local.md files in the directory hierarchy above the working directory are loaded in full at launch. Files in subdirectories load on demand when Claude reads files in those directories."

All discovered files are concatenated rather than overriding each other, ordered from filesystem root down to the working directory.

## Size and adherence

"Target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence."

Specificity guidance: "Use 2-space indentation" rather than "Format code properly"; "Run npm test before committing" rather than "Test your changes"; "API handlers live in src/api/handlers/" rather than "Keep files organized."

## Path-scoped rules — the mechanism for design system scoping

Rules live in .claude/rules/ and can carry YAML frontmatter:

    ---
    paths:
      - "src/components/**/*.tsx"
    ---

    # Component rules
    - Use tokens from @acme/tokens, never hardcoded values
    - Prefer composition over prop drilling

"Rules without a paths field are loaded unconditionally and apply to all files. Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use."

Glob support includes brace expansion (src/**/*.{ts,tsx}), with a budget of 1,000 expanded patterns and 4 MiB per rule.

## Sharing across projects

.claude/rules/ supports symlinks, so a shared rules directory can be linked into many projects. Personal rules in ~/.claude/rules/ apply everywhere; "User-level rules are loaded before project rules, giving project rules higher priority."

## AGENTS.md interop

"Claude Code reads CLAUDE.md, not AGENTS.md. If your repository already uses AGENTS.md for other coding agents, create a CLAUDE.md that imports it so both tools read the same instructions without duplicating them."

A CLAUDE.md containing "@AGENTS.md" imports it. A symlink also works where no Claude-specific content is needed.

## Imports

"@path/to/import" syntax expands files into context at launch. Relative paths resolve relative to the file containing the import. Recursive imports allowed to a maximum depth of four hops. Import parsing skips code spans and fenced blocks, so a path in backticks is mentioned rather than imported.

External imports (resolving outside the working directory) trigger a one-time approval dialog.

## Cross-tool migration

"Running /init reads Cursor rules, in .cursor/rules/ or .cursorrules, and Copilot rules, in .github/copilot-instructions.md, and incorporates the relevant parts into the generated CLAUDE.md."

## The critical caveat for design system rules

"CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself. Claude reads it and tries to follow it, but there's no guarantee of strict compliance, especially for vague or conflicting instructions."

"Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead."

On compaction: "Project-root CLAUDE.md survives compaction. Nested CLAUDE.md files in subdirectories and rules with paths: frontmatter are not re-injected automatically."

## Organization deployment

The claudeMd settings key embeds managed CLAUDE.md content directly in managed-settings.json. claudeMdExcludes can exclude paths, though "Managed policy CLAUDE.md files cannot be excluded."`
  },
  {
    slug: 'claude-code-skills',
    title: 'Claude Code Skills: SKILL.md, Progressive Disclosure, and the Agent Skills Spec',
    url: 'https://code.claude.com/docs/en/skills',
    category: 'tools',
    system: 'Claude Code',
    tags: ['claude-code', 'skills', 'skill-md', 'ai', 'agents', 'design-systems', 'progressive-disclosure'],
    authority: 'primary',
    content: `# Claude Code Skills

## When a skill beats CLAUDE.md — the load-bearing distinction for design systems

"Create a skill when you keep pasting the same instructions, checklist, or multi-step procedure into chat, or when a section of CLAUDE.md has grown into a procedure rather than a fact. **Unlike CLAUDE.md content, a skill's body loads only when it's used, so long reference material costs almost nothing until you need it.**"

Token and component reference material belongs in a skill, not in CLAUDE.md.

## Standard

"Claude Code skills follow the Agent Skills (agentskills.io) open standard, which works across multiple AI tools. Claude Code extends the standard with additional features like invocation control, subagent execution, and dynamic context injection."

## Where skills live

| Location | Path | Applies to |
|---|---|---|
| Enterprise | managed settings | All users in the org |
| Personal | ~/.claude/skills/NAME/SKILL.md | All your projects |
| Project | .claude/skills/NAME/SKILL.md | This project only |
| Plugin | PLUGIN/skills/NAME/SKILL.md | Where plugin is enabled |

"When skills share the same name across levels, enterprise overrides personal, and personal overrides project."

## Monorepo behavior — per-package design system rules

"Skills also load from nested .claude/skills/ directories below your working directory. When Claude reads or edits a file in a subdirectory, skills from that subdirectory's .claude/skills/ become available. This lets a monorepo package provide its own skills that apply when working on that package, even if the session started at the repo root."

The nested variant appears under a directory-qualified name such as "apps/web:deploy", and Claude picks the variant matching the files it is working on.

## Anatomy

    my-skill/
    ├── SKILL.md           # Main instructions (required)
    ├── template.md
    ├── examples/
    │   └── sample.md
    └── scripts/
        └── validate.sh

## Two content types

**Reference content** "adds knowledge Claude applies to your current work. Conventions, patterns, style guides, domain knowledge. This content runs inline so Claude can use it alongside your conversation context."

**Task content** "gives Claude step-by-step instructions for a specific action." Add "disable-model-invocation: true" to prevent automatic triggering.

"Keep the body itself concise. Once a skill loads, its content stays in context across turns, so every line is a recurring token cost. State what to do rather than narrating how or why."

## Frontmatter

Only description is recommended; all fields optional. Key ones:

- description — "What the skill does and when to use it. Claude uses this to decide when to apply the skill... Put the key use case first: the combined description and when_to_use text is truncated at 1,536 characters in the skill listing to reduce context usage."
- when_to_use — trigger phrases or example requests
- allowed-tools — tools usable without asking permission during the invoking turn
- paths — "Glob patterns that limit when this skill is activated... Claude loads the skill automatically only when working with files matching the patterns."

## Progressive disclosure

"Skills can include multiple files in their directory. This keeps SKILL.md focused on the essentials while letting Claude access detailed reference material only when needed. Large reference docs, API specifications, or example collections don't need to load into context every time the skill runs."

"Keep SKILL.md under 500 lines. Move detailed reference material to separate files."

## Portability constraint

"Claude Code accepts every field in the table above. Outside Claude Code, you can use only the fields in the Agent Skills spec." For claude.ai uploads and the Skills API the allowed fields are: name, description, license, compatibility, metadata, allowed-tools. Including a disallowed field fails packaging with a hard error rather than being ignored.

"Claude Code-only body features, such as dynamic context injection, don't function in claude.ai chat or through the API."

Note: "Custom commands have been merged into skills."`
  },
  {
    slug: 'vscode-copilot-custom-instructions',
    title: 'VS Code + GitHub Copilot: Custom Instructions and applyTo Globs',
    url: 'https://code.visualstudio.com/docs/copilot/customization/custom-instructions',
    category: 'tools',
    system: 'GitHub Copilot',
    tags: ['vscode', 'copilot', 'custom-instructions', 'agents-md', 'ai', 'design-systems', 'rules'],
    authority: 'primary',
    content: `# VS Code Copilot Custom Instructions

## Two categories

**Always-on instructions** — "automatically included in every chat request. Use them for project-wide coding standards, architecture decisions, and conventions that apply to all code."

- A single .github/copilot-instructions.md file
- One or more AGENTS.md files (root, and subfolders experimentally)
- Organization-level instructions defined at the GitHub org level
- CLAUDE.md, "for compatibility with Claude Code and other Claude-based tools" — workspace root, .claude folder, or user home

**File-based instructions** — "applied when files that the agent is working on match a specified pattern." One or more .instructions.md files.

"Start with a single .github/copilot-instructions.md file for project-wide coding standards. Add .instructions.md files when you need different rules for different file types or frameworks. Use AGENTS.md if you work with multiple AI agents in your workspace."

Note: "Custom instructions are not taken into account for inline suggestions as you type in the editor."

## Instructions file format

Frontmatter fields: name (display name), description (hover text), and applyTo — "Glob pattern that defines which files the instructions apply to automatically, relative to the workspace root. Use ** to apply to all files. If not specified, the instructions are not applied automatically."

    ---
    applyTo: "**/*.ts,**/*.tsx"
    ---
    # Project coding standards for TypeScript and React

    Apply the [general coding guidelines](./general-coding.instructions.md) to all code.

    ## React Guidelines
    - Use functional components with hooks
    - Use CSS modules for component styling

Instructions can reference other instruction files by Markdown link, and agent tools via a #tool:NAME syntax.

## Locations

| Scope | Default location |
|---|---|
| Workspace | .github/instructions folder |
| Workspace (Claude format) | .claude/rules folder |
| User profile | ~/.copilot/instructions or ~/.claude/rules |

"VS Code searches these folders recursively, to enable you to organize instructions files in subdirectories" — e.g. grouping by frontend/backend/testing.

For .claude/rules files, "VS Code uses a paths property instead of applyTo for glob patterns, following the Claude Rules format."

Monorepos: enable chat.useCustomizationsInParentRepositories to discover instructions from the parent repository root.

## Generating instructions

"/create-instruction ... describe the convention or guideline you want to enforce. The agent asks clarifying questions and generates an .instructions.md file with the appropriate applyTo pattern and content."

"You can also extract instructions from an ongoing conversation. For example, if you corrected the agent's import style during a chat session, ask 'extract an instruction from this' to capture that correction as a project convention."

/init generates workspace-wide always-on instructions.

## Priority

"Higher-priority instructions take precedence when conflicts occur: Personal instructions (user-level, highest priority); Repository instructions (.github/copilot-instructions.md or AGENTS.md); Organization instructions (lowest priority)."

## Authoring guidance

"Keep your instructions short and self-contained. Each instruction should be a single, simple statement."

"**Include the reasoning behind rules.** When instructions explain why a convention exists, the AI makes better decisions in edge cases. For example: 'Use date-fns instead of moment.js because moment.js is deprecated and increases bundle size.'"

"Show preferred and avoided patterns with concrete code examples. The AI responds more effectively to examples than to abstract rules."

"**Focus on non-obvious rules.** Skip conventions that standard linters or formatters already enforce."

## Debugging

"Use the chat customization diagnostics view to see all loaded instruction files and any errors. Right-click in the Chat view and select Diagnostics."`
  },
  {
    slug: 'cursor-rules',
    title: 'Cursor Rules: .mdc Files, Four Activation Types, and Reference-Don\'t-Copy',
    url: 'https://cursor.com/docs/context/rules',
    category: 'tools',
    system: 'Cursor',
    tags: ['cursor', 'rules', 'ai', 'agents', 'design-systems', 'globs', 'agents-md'],
    authority: 'primary',
    content: `# Cursor Rules

"Large language models don't retain memory between completions. Rules provide persistent, reusable context at the prompt level. When applied, rule contents are included at the start of the model context."

## Four rule scopes

Project Rules (.cursor/rules, version-controlled); User Rules (global to your Cursor environment); Team Rules (dashboard-managed, Team and Enterprise plans); AGENTS.md (markdown alternative to .cursor/rules).

## File format matters

"Each rule is an .mdc file... Project rules must use the .mdc extension. A plain .md file in .cursor/rules is ignored by the rules system because it has no frontmatter to specify description, globs, and alwaysApply. If you prefer plain markdown, use AGENTS.md instead."

## Four activation types

| Type | Behavior |
|---|---|
| Always Apply | Apply to every chat session |
| Apply Intelligently | When Agent decides it's relevant based on description |
| Apply to Specific Files | When file matches a specified pattern |
| Apply Manually | When @-mentioned in chat |

Frontmatter interaction:

| alwaysApply | description | globs | Behavior |
|---|---|---|---|
| true | — | — | Always included; globs and description ignored |
| false | — | provided | Auto-attached when a matching file is in context |
| false | provided | omitted | Agent reads the description and pulls it in when relevant |
| false | omitted | omitted | Only when @-mentioned |

## A component-scoped rule (from the docs)

    ---
    globs: src/components/**/*.tsx
    alwaysApply: false
    ---

    - Use named exports, not default exports
    - Co-locate styles in a module CSS file next to the component
    - Keep components under 200 lines. Extract subcomponents into the same
      directory when a file grows beyond that
    - Prefer composition over prop drilling

## Best practices — directly relevant to how much design system detail to inline

"Keep rules under 500 lines. Split large rules into multiple, composable rules. Provide concrete examples or referenced files. Avoid vague guidance. Write rules like clear internal docs. **Reference files instead of copying their contents — this keeps rules short and prevents them from becoming stale as code changes.**"

## What to avoid

"**Copying entire style guides**: Use a linter instead. Agent already knows common style conventions. **Documenting every possible command**: Agent knows common tools like npm, git, and pytest. **Adding instructions for edge cases that rarely apply**. **Duplicating what's already in your codebase**: Point to canonical examples instead of copying code."

"Start simple. Add rules only when you notice Agent making the same mistake repeatedly."

## Template referencing

A rule can point at a canonical file with @filename syntax, e.g. "@component-template.tsx", so the rule describes the pattern and the file demonstrates it.

## Team Rules

"Team Rules are free-form text. They do not use the folder structure of Project Rules." They support glob patterns for file-scoped application.

Precedence: "**Team Rules → Project Rules → User Rules.** All applicable rules are merged; earlier sources take precedence when guidance conflicts."

An "Enforce this rule" flag makes a rule required for all team members and undisableable.

## Remote import — the distribution channel for shipping design system rules

"Import rules directly from any GitHub repository you have access to — public or private... Cursor will scan for all .mdc files in the repo... Rules will be placed in .cursor/rules/imported/REPONAME," preserving relative paths.

## AGENTS.md nesting

Supported in project root and subdirectories. "Instructions from nested AGENTS.md files are combined with parent directories, with more specific instructions taking precedence."

## Scope limits

Rules do not affect Cursor Tab. User Rules are not applied to Inline Edit (Cmd/Ctrl+K); they are only used by Agent (Chat).`
  },
  {
    slug: 'windsurf-devin-rules-activation',
    title: 'Windsurf / Devin Cascade Rules: Activation Modes and Explicit Context Cost',
    url: 'https://docs.devin.ai/desktop/cascade/memories',
    category: 'tools',
    system: 'Windsurf',
    tags: ['windsurf', 'devin', 'cascade', 'rules', 'ai', 'agents', 'context', 'design-systems'],
    authority: 'primary',
    content: `# Windsurf / Devin Cascade: Memories and Rules

Notable for stating the context cost of each activation mode explicitly — the clearest published model of that tradeoff.

## Rules vs memories

"For knowledge you want Cascade to reliably reuse, write it as a Rule or add it to AGENTS.md in your repo rather than relying on auto-generated Memories. Rules are version-controlled, shareable with your team, and give you explicit control over activation."

Auto-generated memories "live only on your machine," are workspace-scoped, and are not committed to the repository.

## Rule scopes

| Scope | Location | Notes |
|---|---|---|
| Global | ~/.codeium/windsurf/memories/global_rules.md | Single file, all workspaces, always on. **6,000 character limit.** |
| Workspace | .devin/rules/*.md (preferred) or .windsurf/rules/*.md (fallback) | One file per rule, each with its own activation mode. **12,000 character limit per file.** |
| AGENTS.md | Any directory | Root-level = always-on; subdirectory = auto-glob for that directory |
| System (Enterprise) | /etc/devin/rules/ and OS equivalents | Deployed by IT, read-only for end users |

## Activation modes and their context cost

| Mode | trigger: value | How it reaches the agent | Context cost |
|---|---|---|---|
| Always On | always_on | Full rule content in the system prompt on every message | Every message |
| Model Decision | model_decision | Only the description is shown; agent reads the full file when relevant | Description always; full content on demand |
| Glob | glob | Applied when the agent reads or edits a file matching globs | Only when matching files are touched |
| Manual | manual | Not in the system prompt; activated by @rule-name | Only when @mentioned |

Example:

    ---
    trigger: glob
    globs: **/*.test.ts
    ---

    All test files must use describe/it blocks and mock external API calls.

The global rules file and root-level AGENTS.md do not use frontmatter — they are always on.

## Discovery

Rules are discovered from the current workspace and subdirectories, and for git repositories Devin "also searches up to the git root directory to find rules in parent directories." Multiple open folders are deduplicated.

## Best practices

"Keep rules simple, concise, and specific. Rules that are too long or vague may confuse Cascade. There's no need to add generic rules (e.g. 'write good code'), as these are already baked into Cascade's training data. Format your rules using bullet points, numbered lists, and markdown. These are easier for Cascade to follow compared to a long paragraph."

XML tags are suggested as an effective way to group related rules.

## Enterprise distribution

"Enterprise organizations can deploy system-level rules that apply globally across all workspaces and cannot be modified by end users without administrator permissions. This is ideal for enforcing organization-wide coding standards, security policies, and compliance requirements."

"System-level rules are merged with workspace and global rules, providing additional context to Cascade without overriding user-defined rules. This allows organizations to establish baseline standards while still permitting teams to add project-specific customizations."`
  },
  {
    slug: 'storybook-mcp-server',
    title: 'Storybook MCP Server: The Self-Healing Loop for Design-System-Consistent Generation',
    url: 'https://storybook.js.org/docs/ai/mcp/overview',
    category: 'tools',
    system: 'Storybook',
    tags: ['storybook', 'mcp', 'ai', 'agents', 'design-systems', 'testing', 'documentation'],
    authority: 'primary',
    content: `# Storybook MCP Server

"Storybook's MCP server connects your Storybook to AI agents, allowing them to understand your components and documentation, generate stories, run tests, and more. Agents will be equipped to reuse your existing components and follow your documented usage guidelines when generating UI."

"Then they can write stories so you can preview the generated UI and automatically run interaction tests (and accessibility checks) on those stories to validate their work. If any issues are found, the agent can fix them and re-run the tests to confirm they are resolved, **creating a self-healing loop** that helps ensure the quality of the generated UI without requiring you to intervene."

Preview limitation: "currently only supported for React projects."

## Setup

    npx storybook add @storybook/addon-mcp
    npx mcp-add --type http --url "http://localhost:6006/mcp" --scope project

## The recommended AGENTS.md / CLAUDE.md text

Storybook publishes the agent instructions to pair with it, and the anti-hallucination framing is worth quoting:

    When working on UI components, always use the MCP tools to access Storybook's
    component and documentation knowledge before answering or taking any action.

    - CRITICAL: Never hallucinate component properties! Before using ANY property
      on a component from a design system (including common-sounding ones like
      shadow, etc.), you MUST use the MCP tools to check if the property is
      actually documented for that component.
    - Query list-all-documentation to get a list of all components
    - Query get-documentation for that component to see all available properties
    - Only use properties that are explicitly documented or shown in example stories
    - If a property isn't documented, do not assume properties based on naming
      conventions or common patterns from other libraries. Check back with the user.
    - Use get-storybook-story-instructions to fetch the latest conventions.
    - Check your work by running run-story-tests.

    Remember: A story name might not reflect the property name correctly, so always
    verify properties through documentation or example stories before using them.

## Three toolsets

**Docs** — helps the agent reuse components rather than reinvent them:
- list-all-documentation — index of components and unattached docs entries
- get-documentation — props, first three stories, an index of remaining stories, plus additional documentation
- get-documentation-for-story — full story and associated documentation, when get-documentation is insufficient

**Development** — for authoring stories and previewing:
- get-changed-stories — stories changed or possibly affected by local file changes
- get-storybook-story-instructions — how to write useful stories, which props to capture, how to write interaction tests
- preview-stories — story previews rendered in the agent's chat interface, if the agent supports MCP Apps

**Testing**:
- run-story-tests — "Runs tests for specific stories and returns results, including any accessibility issues (if configured). Also instructs the agent to interpret the results and resolve any issues found."

## The worked loop

Asked to build a login form, the agent queries docs to find TextInput and Button, queries again for detail (learning TextInput has a type prop settable to "password"), composes a LoginForm, generates stories for its states, runs tests, **finds the submit button fails color contrast**, looks up documented theme colors, fixes it, re-runs tests, and shows previews.

## Composition for multi-repo systems

"If a composed Storybook has manifests, the MCP server will automatically include the content from those manifests in its responses, allowing your agent to access the combined knowledge from all composed Storybooks."

Any MCP-capable agent can connect: Claude Code, OpenAI Codex, Cursor, Gemini CLI, VS Code Copilot.`
  },
  {
    slug: 'storybook-manifests',
    title: 'Storybook Manifests: What an Agent Actually Receives About Your Components',
    url: 'https://storybook.js.org/docs/ai/manifests',
    category: 'documentation',
    system: 'Storybook',
    tags: ['storybook', 'manifests', 'machine-readable', 'documentation', 'ai', 'agents', 'docgen'],
    authority: 'primary',
    content: `# Storybook Manifests

"Manifests are JSON objects that describe the contents of your Storybook in a concise, structured way that is easy for AI agents to understand and use. The manifests are generated automatically from your Storybook's CSF and MDX files."

Two manifests: **components** and **docs**.

## Components manifest

Generated from static analysis of CSF files plus prop type extraction from component source.

"For prop type extraction, the manifest generation will use whatever is specified in the reactDocgen option, or react-docgen by default. **We recommend using react-docgen-typescript for most projects**, because it provides more accurate and comprehensive information about your components' props. If manifest generation seems too slow, you can switch to react-docgen, which is faster but less detailed."

"While the types themselves provide a basic level of information, JSDoc comments in your component source code can provide additional metadata for the manifest... **We highly recommend adding JSDoc comments** to your components and their props to provide as much context as possible for the agents."

Accessible at /manifests/components.json while running, or in a built Storybook.

## What an agent actually gets per component

- id (stable), name, path
- stories[] with id, name, and a code snippet each
- **the literal import statement**, e.g. import { Button } from "@mealdrop/ui";
- jsDocTags, description
- reactDocgen with a full typed prop table: per prop, required, tsType (including full union literal enumeration), description, and defaultValue

Subcomponents: "If a story file declares subcomponents, the components manifest will also include a subcomponents object for that component. This gives agents supplemental API documentation for child components, even when those subcomponents are only meant to be used together with the parent."

Caveat: "While in preview, this manifest schema is not yet stable and should not be considered a public API."

## Docs (MDX) manifest

Generated from MDX files — "used to document specific components or to create standalone documentation pages (e.g. a 'Getting Started' guide, accessibility guidelines, design tokens, etc.), all of which can offer helpful context to the agent." Entries carry id, name, path, title, and a content field with the raw MDX source. Available at /manifests/docs.json.

## Debugging

"Storybook provides a combined manifest debugger at http://localhost:6006/manifests/components.html... This page shows the contents of both the component and docs manifests in a human-readable format, along with any errors or warnings that were encountered during manifest generation."

## Curation — governance over what agents can see

"By default, all stories and independent docs pages have the manifest tag applied... You can curate what is included in the manifests by adding or removing the manifest tag from your stories and docs pages. For example, if you have a story that is for instructional purposes only and the agent should not be aware of it, you can remove the manifest tag from that story."

Exclude a story with tags: ['!manifest']; exclude an entire component by removing the tag in the file's meta; exclude an MDX page via its Meta tag.`
  },
  {
    slug: 'storybook-ai-documentation-best-practices',
    title: 'What Makes Component Documentation Agent-Consumable (Storybook Best Practices)',
    url: 'https://storybook.js.org/docs/ai/best-practices',
    category: 'documentation',
    system: 'Storybook',
    tags: ['storybook', 'documentation', 'ai', 'agents', 'jsdoc', 'design-tokens', 'machine-readable'],
    authority: 'primary',
    content: `# Best Practices for Using Storybook With AI

The closest thing to a published spec for what makes component documentation agent-consumable, from the tool that generates the machine-readable payload.

## One concept per story

"Stories are referenced by the MCP server to provide examples of how your components are used... Whenever possible, they should demonstrate one concept or use case, and be as descriptive about the 'why' behind the story, not just the 'what'. This will help agents understand when and why to use certain components or patterns."

Good: a Basic story for the default state; a Primary story demonstrating one specific use case; a Disabled story rendering two buttons that both demonstrate the same disabled concept.

Bad: a SizesAndVariants story rendering small/medium/large plus outline and text variants — "demonstrates too many concepts at once, making it less clear and less useful as a reference for agents."

"The manifest generation process evaluates the final rendered story with all args, decorators, etc. applied, so it can focus on the concept being demonstrated, rather than the specifics of how it's implemented."

## Component description and summary

"Help the agent understand what a component should be used for by providing a description (and optional summary) as a JSDoc comment above the export of the component. **The agent will receive the summary, if present, or a truncated version of the description.**"

The recommended example encodes a when-not-to-use rule, which is the machine-readable analogue of a do/don't pair:

    /**
     * Button is used for user interactions that do not navigate to another route.
     * For navigation, use Link instead.
     *
     * @summary for user interactions that do not navigate to another route
     */

## Story summaries

"**Don't just repeat what the story is demonstrating; describe why you would use whatever is demonstrated.** The agent will receive the summary, if present, or the first 60 characters of the description."

    /**
     * Primary buttons are used for the main action in a view.
     * There should not be more than one primary button per view.
     *
     * @summary for the main action in a view
     */

## Docs summaries

Unattached MDX pages (design tokens, guidelines) can carry a summary in the Meta tag, which is included in the manifest.

## The token documentation trap

"Storybook generates this docs manifest through static analysis of your MDX files, which means it is limited to the information that is explicitly present in those files. **For example, the manifest will not include the color tokens in the document below, because their values are not explicitly in the source**" — referring to an MDX page that imports a colors array and maps over it into ColorItem components.

"To ensure that your agents have access to all the necessary information, it's important to include any relevant details directly in your MDX files, rather than referencing external sources."

A beautifully rendered, dynamically generated token page is invisible to the agent. **Human-legible does not imply machine-legible.**

## Manifest curation and the context budget

"It's possible to provide too little or too much context to your agent. If your manifest is missing key information about your components, the agent may not be able to use them effectively. On the other hand, if your manifest includes information irrelevant to the task at hand, it may be overwhelming for the agent and lead to worse performance."

Stories demonstrating anti-patterns, or docs about deprecated components, should be excluded with tags: ['!manifest'].`
  },
  {
    slug: 'eightshapes-documenting-components',
    title: 'Documenting Components: Four Content Types and Page Architecture (EightShapes)',
    url: 'https://eightshapes.com/articles/documenting-components/',
    category: 'documentation',
    system: 'EightShapes',
    tags: ['documentation', 'design-systems', 'nathan-curtis', 'information-architecture', 'audience'],
    authority: 'authoritative',
    content: `# Documenting Components: Serve a System's Audiences With Well-Architected Content

Nathan Curtis, EightShapes. The canonical treatment of design system documentation architecture.

## Audience

"Component documentation must serve both audiences, always, to varying degrees."

"Serving everyone doesn't mean serving each equally. Engineers may visit doc 5, 10, or even more times daily. It may even be an open window adjacent to their code editor! A designer may visit less frequently... A content strategist or researcher may visit rarely."

"I'm a designer. But I'm also a pragmatist. If I had to choose one, without any context, **I'd favor engineers. Getting 50 engineers to code well-designed components is more likely to result in cohesive, efficiently built experiences compared to 50 designers reading tomes of guidance about decisions already built into that code.**"

"Orient tradeoffs towards those using the material closest to the final product, usually code. That means engineers first, designers second."

## The four content types

- **Introduction** — component's name and succinct descriptive content that sets the tone. (Required)
- **Examples** — illustrating named variations, states, and other dimensions, "preferably paired with and rendered by code instead of presented via static images." (Required)
- **Design Reference** — Use Whens, Do's and Don'ts, and guidelines for visual, interaction, and editorial concerns. (Recommended)
- **Code Reference** — the code's API (such as Props) and other implementation concerns. (Required, if code exists)

"The cost of each varies. An Introduction should be quick and cheap... Well-organized Examples are an essential investment... Code references should emerge via straightforward if tedious templates... **Effective Design reference can be very costly**, skimped to achieve only basics, or skipped altogether."

## Fragment or combine?

"Be wary of a design and code split. While convenient to author and publish early on, long term risks may outweigh benefits."

The risks named: "Taxonomies diverge (even for simple names like loader and spinner). Features diverge: design expresses deep features unachievable in code, or code articulates undesigned outcomes."

"Adopters yearn for a single source-of-truth. Those interested in both stories find themselves in a tennis rally, back and forth."

## Canonical page order

1. Introduction
2. **Examples** — "the venerable 'goods' they are most after — front and center"
3. Design guidance
4. Code reference. "If engineers are the priority and Props paramount, elevate that reference table into a dominant position."

"Examples rule, and so long as deeper design and code reference is a click away, you'll be ok."

Industry variance noted: IBM Carbon puts Code first with Usage and Style on later tabs; Hudl's Uniform reverses it; Salesforce Lightning presents a component explorer above a Developer Guidelines tab.

## Navigation

"The longer your page, the more important it is to signal what's there and where you are. Vertical local navigation in a right rail works effectively: ever present, tracking page location as you scroll."

"No matter what: keep section names and order consistent across the library."

## Design-or-code filtering

A toggle to hide design or code concerns "requires classifying each content type as relevant to one, the other, or both audiences": always display introductions, labeled examples, and everything regarding accessibility; "Design Only" hides code snippets and Props tables; "Code Only" hides visual style and editorial sections "but still reveal some guidance — Use Whens, in particular — relevant for engineers."

"Filtering based on content types is a content management challenge more than a technical one."`
  },
  {
    slug: 'zeroheight-design-systems-report-2026',
    title: 'Design Systems Report 2026: Documentation Tooling, Satisfaction, and AI Use',
    url: 'https://report.zeroheight.com/',
    category: 'documentation',
    tags: ['documentation', 'research', 'survey', 'tooling', 'ai', 'design-systems', 'adoption', 'zeroheight'],
    authority: 'authoritative',
    content: `# Design Systems Report 2026 (zeroheight, fifth annual)

n=147 design system practitioners.

## Framing

"Gartner's 2025 Hype Cycle positions design systems sliding from the 'Peak of Inflated Expectations' into the 'Trough of Disillusionment'... Buy-in satisfaction dropped significantly year-over-year, from 42% to just 32%."

"**Documentation is both the biggest pain point and the clearest opportunity.** It's the task everyone knows is essential, no one has time for, and AI might finally help solve."

## Documentation tooling (multi-select, n=100)

| Tool | % |
|---|---|
| Figma | 69% |
| Storybook | 61% |
| zeroheight | 32% |
| Confluence | 18% |
| Custom (Astro, 11ty, Gatsby) | 16% |
| Supernova | 7% |
| Google Docs | 4% |
| Notion | 4% |
| Gitbook | 2% |
| Docusaurus | 1% |

"Documentation is a more fragmented space, with a lot of people relying on existing tools (like Figma, Confluence, Google Docs etc.), or free open-source tools (like Storybook)."

## Satisfaction gap

Documentation tools: Satisfied 60%, Neutral 25%, Dissatisfied 14%.
Design tools: Satisfied 73%, Neutral 19%, Dissatisfied 7%.

"The satisfaction with documentation tooling is lower than design tools, which suggests that the design system documentation space is still maturing."

By area: Design 72%, Code 54%, **Documentation 45%**, UX patterns 20%.

## The integration gap

"**The biggest gap practitioners report isn't missing tools, but the integration between them: keeping design, code, and documentation in sync remains a manual, error-prone process for many teams.**"

Verbatim respondent quotes:
- "The fact that design and dev still use different tools. they're getting closer to being connected but there's still a gap"
- "Documenting the design system is very time-consuming. we ended up doing the majority of our documentation in Figma because it's faster for us to do it there than trying to fight with documentation tools"
- "AI hallucination. none of these AIs support a design system out of the box without hallucinating"

## What design systems contain

Foundations 93%, **Documentation 92%**, Design libraries 91%, Design tokens 86%, Code libraries 78%, Accessibility guidelines 59%, UX patterns 56%, UX copy 38%, Brand guidelines 37%, Illustrations 33%.

Tokens: only 54% of teams had design tokens in design tools, code, AND documentation. "Almost 1 in every 5 teams don't have tokens in code." Documentation for design tokens: 66%.

## Adoption and trust

"Documentation completeness" cited by **45% of teams with poor adoption** and 27% of teams with good adoption.

"Completeness of documentation and design... both being 20% more likely to foster high trust. If a system has what people are looking for and expect, they're more likely to trust the use of the system."

## AI use — current vs wanted

**Currently using:** Code generation 71%, Documentation generation 60%, AI-driven prototyping 50%, Linting 28%, Design generation 24%, Communicating changes 21%, **Documentation delivery (MCP/chatbots) 12%**.

**Excited for:** Documentation generation 57%, Process automation 40%, Code generation 39%, Linting/guidance for consumers 30%.

**Skeptical of:** Design generation 61%, Code generation 35%, Accessibility compliance 20%.

"It's interesting to see documentation delivery (via MCP or chatbots) is still extremely low in penetration."

Support offered to consumers: Documentation 90%, 1-1 consultation 71%, Workshops 40%, Onboarding materials 34%, Videos 19%, **Chatbot 13%**.

Framing quote used in the report: "AI can help us document faster, but it can't decide what's worth documenting."`
  },
  {
    slug: 'supernova-zeroheight-mcp',
    title: 'Hosted Documentation MCP Servers: Supernova and zeroheight',
    url: 'https://learn.supernova.io/latest/design-systems/features/mcp-for-design-system-LIHAMhjr-LIHAMhjr',
    category: 'tools',
    tags: ['supernova', 'zeroheight', 'mcp', 'documentation', 'ai', 'agents', 'design-tokens', 'design-systems'],
    authority: 'primary',
    content: `# Hosted Documentation MCP Servers: Supernova and zeroheight

The hosted-platform equivalent of Storybook's manifests — an authenticated remote MCP endpoint over the whole design system record rather than a build artifact off a dev server.

## Supernova MCP

Endpoint: https://mcp.supernova.io/mcp/ds/{ID} — the design system ID comes from the app.supernova.io URL. Authentication via OAuth.

**Two data-processing claims that matter for agent consumption:**
- "Documentation is converted into clean Markdown" with system-aware optimizations
- **"Token references are fully resolved (even across deeply nested relationships)"** — the agent receives a computed value, not an alias chain it must dereference itself

**16 tools**, structured as list + detail pairs across every layer:
- get_token_list — tokens with values and groupings
- get_design_system_component_list / get_design_system_component_detail
- get_figma_component_list / get_figma_component_detail
- get_documentation_page_list / get_documentation_page_content
- get_asset_list / get_asset_detail
- get_code_component_list / get_code_component_detail
- get_storybook_story_list / get_storybook_story_detail
- get_me

The list/detail split is the same token-efficiency pattern Storybook uses.

**Version/brand scoping:** append ?datasetId={dataset-id} to point an agent at a specific version or brand rather than the whole system.

Client config (Cursor, Windsurf, Claude Desktop):

    {
      "mcpServers": {
        "supernova": {
          "url": "https://mcp.supernova.io/mcp/ds/{ID}",
          "type": "http"
        }
      }
    }

## Supernova's four properties of an AI-ready system

1. **API exposure** — "Tokens, component structures, and documentation aren't buried in tools or static pages — they're accessible via endpoints or MCP servers."
2. **Rich metadata** — components need "states, props, accessibility, platform constraints, and rationale."
3. **Atomic documentation** — moving beyond lengthy reference pages toward "modular, context-rich units of knowledge tied directly to components or patterns."
4. **Cross-layer consistency** — "Whether you're in Figma, reviewing docs, or shipping code, the naming, structure, and behavior should align."

"Your design system is not just for designers anymore. It's for the machines helping them work."

## zeroheight MCP — the counter-positioning

zeroheight states the gap between the three MCP servers a design system team might connect:

"**Figma's MCP surfaces design properties. Storybook's surfaces code. Neither surfaces your guidelines, usage rules, or validated decisions.** zeroheight aggregates all of it – one source of truth, reviewed by your team, used by every agent."

On governance: "SOC 2 compliant, SSO supported, and OAuth covered. **Hidden content stays hidden – so agents work only from published, approved guidelines.**" Plus role-based permissions "essential for multi-brand and multi-team setups."

Four tools: list-pages, get-page, get-page-images (assets as base64), list-releases. Remote HTTPS, with a local MCP available for stricter data requirements.

The distinction worth noting: Figma MCP and Storybook MCP each expose one surface's structural data. A documentation platform's MCP is the only one positioned to expose the *guidance* layer — the usage rules and decisions that neither the design file nor the component source encodes.`
  },
  {
    slug: 'llms-txt-spec',
    title: 'The /llms.txt Standard: Machine-Readable Documentation Without a Server',
    url: 'https://llmstxt.org/',
    category: 'documentation',
    tags: ['llms-txt', 'documentation', 'machine-readable', 'ai', 'standard', 'markdown'],
    authority: 'primary',
    content: `# The /llms.txt File

Jeremy Howard, September 2024. The other machine-readable-documentation standard a design system can adopt — and unlike MCP it requires no server, which makes it the cheapest path for a docs-as-code or hosted documentation site.

## Background

"Large language models increasingly rely on website information, but face a critical limitation: context windows are too small to handle most websites in their entirety. Converting complex HTML pages with navigation, ads, and JavaScript into LLM-friendly plain text is both difficult and imprecise."

## The proposal — two parts, and the second is routinely overlooked

"We propose adding a /llms.txt markdown file to websites to provide LLM-friendly content. This file offers brief background information, guidance, and links to detailed markdown files."

"**We furthermore propose that pages on websites that have information that might be useful for LLMs to read provide a clean markdown version of those pages at the same URL as the original page, but with .md appended.**" (URLs without file names append index.html.md.)

## Format

"At the moment the most widely and easily understood format for language models is Markdown... The llms.txt file is unusual in that it uses Markdown to structure the information rather than a classic structured format such as XML. The reason for this is that we expect many of these files to be read by language models and agents."

Sections, in order:
- An optional byte-order mark
- **An H1 with the name of the project or site. This is the only required section**
- A blockquote with a short summary
- Zero or more markdown sections of any type **except headings**
- Zero or more H2-delimited sections containing "file lists" of URLs
- Each file list is a markdown list with a required hyperlink, optionally followed by ":" and notes

Mock structure:

    # Title

    > Optional description goes here

    Optional details go here

    ## Section name

    - [Link title](https://link_url): Optional link details

    ## Optional

    - [Link title](https://link_url)

## The Optional section

"Note that the 'Optional' section has a special meaning — if it's included, the URLs provided there can be skipped if a shorter context is needed. Use it for secondary information which can often be skipped."

For a design system this maps cleanly: components and tokens in required sections; changelogs, migration guides, and contribution process under Optional.

## Relationship to robots.txt and sitemap.xml

"llms.txt is designed to coexist with current web standards. While sitemaps list all pages for search engines, llms.txt offers a curated overview for LLMs."

"robots.txt is generally used to let automated tools know what access to a site is considered acceptable... llms.txt information will often be used on demand when a user explicitly requests information about a topic... Our expectation is that llms.txt will mainly be useful for inference, i.e. at the time a user is seeking assistance, as opposed to for training."

Why sitemap.xml is not a substitute: it "Often won't have the LLM-readable versions of pages listed; Doesn't include URLs to external sites... Will generally cover documents that in aggregate will be too large to fit in an LLM context window."

## Processing

The spec deliberately does not mandate processing. The FastHTML project expands llms.txt into llms-ctx.txt (excluding Optional URLs) and llms-ctx-full.txt (including them), generated by the llms_txt2ctx command line tool.

## Adoption signal

Anthropic's Claude Code documentation serves llms.txt and prefixes every docs page with "Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt — Use this file to discover all available pages before exploring further."`
  },
];

let written = 0;
for (const e of ENTRIES) {
  writeFileSync(join(OUT, `${e.slug}.json`), JSON.stringify({
    id: `docs-batch-${e.slug}`,
    title: e.title,
    source: { type: 'url', location: e.url, ingested_at: new Date().toISOString() },
    content: e.content,
    chunks: [],
    metadata: {
      category: e.category, tags: e.tags, confidence: 'high', system: e.system ?? '',
      source_url: e.url, authority: e.authority,
      research_batch: 'ai-tools-docs-2026-08', last_updated: new Date().toISOString(),
    },
  }, null, 2));
  written++;
}
console.log(`wrote ${written} staged entries`);
for (const e of ENTRIES) console.log(`  ${String(e.content.length).padStart(6)}  ${e.title.slice(0, 64)}`);
