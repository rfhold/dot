---
name: oc-skill
description: Creates, reviews, and refines skills for Claude Code and OpenCode. Use when user says "create a skill", "write a SKILL.md", "build a new skill", "review my skill", "improve skill triggers", "set up a skill folder", or asks about skill architecture, prompt engineering for skills, or YAML frontmatter formatting.
---

# Skill Editor

Expert at creating and maintaining skills following Anthropic prompt engineering best practices, targeting both Claude Code and OpenCode.

This skill optimizes for high trigger precision, clear execution instructions, small context footprint, and maintainable skill packaging.

## Skill Locations

Skills can be placed in project-local or global directories. Both tools search multiple paths:

### Claude Code
- Project: `.claude/skills/<skill-name>/SKILL.md`
- Global: `~/.claude/skills/<skill-name>/SKILL.md`

### OpenCode
- Project: `.opencode/skills/<skill-name>/SKILL.md`
- Global: `~/.opencode/skills/<skill-name>/SKILL.md`
- Also reads Claude-compatible paths: `.claude/skills/<skill-name>/SKILL.md`
- Also reads agent-compatible paths: `.agents/skills/<skill-name>/SKILL.md`

## Core Principles

1. **Progressive disclosure**
   - Level 1: frontmatter is always available for routing
   - Level 2: SKILL.md body is loaded when skill is selected
   - Level 3: linked deep docs/scripts/assets are loaded on demand
2. **Description is the routing contract**
   - Must say what the skill does and when to use it
   - Include realistic user trigger phrases and domain/file-type keywords
3. **Composable design**
   - Assume multiple skills can co-load
   - Avoid instructions that require exclusive control unless explicitly needed
4. **Specific executable instructions**
   - Prefer concrete steps, validation points, expected outputs, and fallback behavior
   - Use `CRITICAL:` prefix for must-not-skip constraints (e.g., `CRITICAL: Before calling create_project, verify project name is non-empty`)
   - Code/scripts are deterministic; language interpretation is not. Bundle validation scripts when possible.
5. **Problem-first or Tool-first design**
   - Problem-first: user has a goal ("set up a project workspace") and the skill orchestrates the right tools
   - Tool-first: user has a tool ("I have Notion MCP connected") and the skill teaches optimal workflows for it
   - Decide which framing fits and design instructions accordingly
6. **Keep core concise, link depth externally**
   - Keep SKILL.md under 5,000 words (roughly 300-500 lines)
   - Move detailed references to `references/`

## Format Requirements

### Claude Code SKILL.md Format

```yaml
---
name: lowercase-hyphenated
description: Clear, specific description with trigger keywords.
argument-hint: "[optional-hint]"
disable-model-invocation: true/false    # true = user-only
user-invocable: true/false              # false = background only
allowed-tools: Tool1, Tool2
context: fork                           # Run in subagent
agent: Explore                          # Subagent type when forked
---

Instructions Claude follows when skill is active.
```

### OpenCode SKILL.md Format

```yaml
---
name: lowercase-hyphenated              # Must match directory name
description: Clear, specific description with trigger keywords.
license: MIT                            # Optional
compatibility: opencode                 # Optional
metadata:                               # Optional, string-to-string map
  audience: developers
---

Instructions the agent follows when skill is loaded.
```

### OpenCode Frontmatter Fields

| Field         | Required | Notes                                                        |
|---------------|----------|--------------------------------------------------------------|
| name          | Yes      | 1-64 chars, lowercase alphanumeric with single hyphens       |
| description   | Yes      | 1-1024 chars. Agent uses this to decide whether to load      |
| license       | No       |                                                              |
| compatibility | No       |                                                              |
| metadata      | No       | String-to-string map                                         |

### Universal Naming and Metadata Guidance

- `name` must be kebab-case and match the skill directory name
- Avoid reserved vendor-like names (for example names beginning with `claude` or `anthropic`)
- Keep `description` under 1024 chars and avoid XML-like characters (`<` and `>`)
- Use optional metadata for lifecycle and org maintenance:
  - `metadata.author`
  - `metadata.version`
  - `metadata.category`
  - `metadata.tags`
  - `metadata.mcp-server` (if relevant)

### OpenCode Skill Invocation

Skills are NOT directly user-invoked in OpenCode. The agent discovers them via a built-in `skill` tool. The agent sees all skill names/descriptions and calls `skill({ name: "skill-name" })` to load on demand.

Permissions can be controlled in `opencode.json`:
```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "deny"
    }
  }
}
```

## Skill Directory Structure

```
<skill-name>/
  SKILL.md           # Main instructions (required)
  scripts/           # Optional deterministic checks/automation
  references/        # Detailed reference material (optional)
  assets/            # Optional templates/fonts/icons/etc
```

Rules:
- `SKILL.md` must be exact, case-sensitive filename
- Skill folder name should be kebab-case
- Avoid adding `README.md` inside the skill folder itself; place publish docs at repository root when needed

## Instruction Authoring Workflow

Before writing:
1. Define 2-3 concrete use cases
2. For each use case, specify:
   - trigger prompts
   - tool interactions
   - expected result and acceptance criteria

While writing SKILL.md:
1. Put critical constraints and safety conditions early
2. Use short headings and deterministic step-by-step instructions
3. Include explicit error handling and fallback paths
4. Include examples with:
   - user asks
   - assistant actions
   - expected output/result
5. Put deep detail in `references/` and link to it from SKILL.md

When MCP tools are involved:
- Separate access concerns (MCP availability) from behavior concerns (workflow quality)
- Validate auth/connectivity/tool naming early
- Include recovery instructions for common MCP failures

## Description Engineering (Trigger Tuning)

Description formula: `[What it does]` + `[When to use it]` + `[Key capabilities]`

Good descriptions include specific user trigger phrases:
```yaml
# Good: specific, actionable, includes trigger phrases
description: Manages Linear project workflows including sprint planning,
  task creation, and status tracking. Use when user mentions "sprint",
  "Linear tasks", "project planning", or asks to "create tickets".

# Good: clear scope with negative boundary
description: Advanced data analysis for CSV files. Use for statistical
  modeling, regression, clustering. Do NOT use for simple data viewing
  (use data-viz skill instead).

# Bad: too vague, no triggers
description: Helps with projects.

# Bad: no user-like phrasing
description: Implements the Project entity model with hierarchical relationships.
```

Design `description` for three test buckets:
1. Should trigger (obvious requests)
2. Should trigger (paraphrased requests)
3. Should not trigger (nearby but out-of-scope requests)

Debug technique: Ask Claude *"When would you use the [skill name] skill?"* — it will quote the description back. Adjust based on what's missing or misleading.

Refine wording if either failure mode appears:
- Under-triggering: add missing user phrasing/domain keywords
- Over-triggering: tighten scope, add negatives such as "do not use for ..."

## Skill Creation Procedure

When creating a new skill:

1. Determine the skill's purpose and which tools it targets (Claude Code, OpenCode, or both)
2. Choose a descriptive `lowercase-hyphenated` name
3. Write a description rich in trigger keywords so the agent loads it automatically
4. Draft the SKILL.md body with clear, concise instructions
5. Add examples, troubleshooting, and explicit validation/fallback steps
6. Add optional metadata (`version`, `author`, `category`, `tags`) when useful
7. If instructions become large, split reference material into `references/` files
8. Create the SKILL.md in the appropriate directories:
   - For Claude Code: `.claude/skills/<name>/SKILL.md`
   - For OpenCode: `.opencode/skills/<name>/SKILL.md`
   - For both: create in both locations (or just `.claude/skills/` since OpenCode reads it too)

Recommended body skeleton:

```markdown
---
name: your-skill-name
description: What it does. Use when user asks to ...
---

# Skill Name

## Instructions
## Step 1
## Step 2

## Examples
- User says: "..."
- Actions:
  1. ...
  2. ...
- Result: ...

## Troubleshooting
- Error: ...
- Cause: ...
- Solution: ...
```

## Worked Example: Creating a Skill End-to-End

User says: *"Create a skill that helps deploy Docker containers to my staging server"*

**Step 1 — Define use cases:**
- Deploy a new container from an image tag
- Update a running container to a new version
- Roll back to a previous version

**Step 2 — Choose name and write description:**
```yaml
name: docker-staging-deploy
description: Deploys, updates, and rolls back Docker containers on the
  staging server. Use when user says "deploy to staging", "update container",
  "rollback deployment", or asks about "staging server" Docker workflows.
  Do NOT use for production deployments.
```

**Step 3 — Draft instructions with validation gates:**
```markdown
## Step 1: Identify target
CRITICAL: Confirm the target is the staging server, not production.
Ask for image name and tag if not provided.

## Step 2: Validate image
Run `scripts/check-image.sh IMAGE:TAG` to verify image exists in registry.
If not found: tell user the image/tag doesn't exist and ask them to verify.

## Step 3: Deploy
...
```

**Step 4 — Add examples, troubleshooting, and error handling**

**Step 5 — Test:**
- Trigger test: "deploy my-app:v2.1 to staging" (should trigger)
- Trigger test: "deploy to production" (should NOT trigger)
- Functional test: happy path deploy, rollback scenario, bad image tag

**Step 6 — Create file at `.claude/skills/docker-staging-deploy/SKILL.md`**

## Validation and Evaluation

### Testing levels (escalate as needed)

| Level        | Method                                | When to use                       |
|--------------|---------------------------------------|-----------------------------------|
| Manual       | Run queries directly in Claude        | Fast iteration, early development |
| Scripted     | Automate test cases in Claude Code    | Repeatable validation on changes  |
| Programmatic | Build evaluation suites via Skills API| High-visibility or shared skills  |

### Three-layer test approach

1. **Trigger tests**
   - obvious triggers
   - paraphrased triggers
   - non-trigger negatives
2. **Functional tests**
   - expected outputs
   - tool success path
   - edge cases and failure handling
3. **Performance delta tests**
   - compare with/without skill on message count, tool calls, token use, and failure rate

### Aspirational quantitative targets

- Skill triggers on 90%+ of relevant queries (test with 10-20 queries)
- Completes workflow with measurably fewer tool calls than without skill
- 0 failed API/MCP calls per workflow run
- Users don't need to re-prompt or correct the workflow

These are rough benchmarks, not precise thresholds. Expect some vibes-based assessment.

### Iteration strategy

- Perfect one hard workflow first, then generalize
- Track recurring misses and update description/instructions accordingly
- Bump metadata version on meaningful behavior changes

## Anti-Patterns to Avoid

- Vague descriptions ("helps with projects")
- Missing/invalid YAML delimiters or malformed frontmatter
- Skill scope that is too broad, causing over-triggering
- Long ambiguous instructions with buried critical constraints
- Large context footprint from oversized SKILL.md when references would suffice

## Troubleshooting Skills

**Skill won't upload / load:**
- `"Could not find SKILL.md"` — File not named exactly `SKILL.md` (case-sensitive). Check for `SKILL.MD`, `skill.md`, etc.
- `"Invalid frontmatter"` — YAML formatting issue. Check for missing `---` delimiters, unclosed quotes, or XML angle brackets (`<` `>`).
- `"Invalid skill name"` — Name has spaces, capitals, or reserved prefixes (`claude`, `anthropic`).

**Skill doesn't trigger when it should:**
- Ask Claude: *"When would you use the [skill-name] skill?"* — it quotes the description back. Identify missing keywords.
- Add more user-like trigger phrases and domain keywords to the description.
- Check that the description says both WHAT and WHEN.

**Skill triggers too often:**
- Add explicit negative boundaries: `"Do NOT use for ..."`.
- Narrow scope keywords. Remove overly generic terms.
- Consider splitting into multiple focused skills.

**Instructions not followed consistently:**
- Instructions too verbose — use bullet points, move detail to `references/`.
- Critical constraints buried — front-load them with `CRITICAL:` prefix.
- Ambiguous language — be specific with exact values and conditions.
- For critical validations, bundle a script rather than relying on language instructions.

## Architecture Patterns

For common skill architecture patterns (sequential workflow, multi-MCP coordination, iterative refinement, context-aware tool selection, domain-specific intelligence), see `references/architecture-patterns.md`.

## Quality Checklist

For deeper scoring and PR-ready review criteria, use `references/skill-rubric.md`.

Pre-build:
- [ ] 2-3 concrete use cases are defined
- [ ] Success metrics are defined (trigger quality, failures, efficiency)

Build-time:
- [ ] Folder and `name` are kebab-case and match
- [ ] `SKILL.md` filename is exact and case-correct
- [ ] Frontmatter is valid for target platform
- [ ] Description includes what + when + realistic trigger phrases
- [ ] Instructions include validations, error handling, and fallback behavior
- [ ] References/scripts/assets are used for depth and determinism where helpful

Pre-publish / pre-use:
- [ ] Trigger, functional, and negative tests pass
- [ ] MCP connectivity/auth/tool names verified (if applicable)
- [ ] No unnecessary bloat in core instructions

Post-use maintenance:
- [ ] Real usage is monitored for under/over-triggering
- [ ] Failure patterns are folded back into instructions
- [ ] Metadata version updated for significant revisions

## Claude Code Specific Notes

- Use `$ARGUMENTS` when parameterizing user-invoked workflows
- Use command substitution patterns where dynamic runtime context is required
- For side-effect-heavy workflows, consider `disable-model-invocation: true`
