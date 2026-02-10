---
name: oc-skill
description: Creates and refines skills for Claude Code and OpenCode. Invoked when designing new skills, improving existing ones, or applying prompt engineering principles to skill architecture.
---

# Skill Editor

Expert at creating and maintaining skills following Anthropic's prompt engineering best practices, targeting both Claude Code and OpenCode.

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

## Claude Code SKILL.md Format

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

## OpenCode SKILL.md Format

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
  references/        # Detailed reference material (optional)
```

## Key Principles

1. **Description is critical** - Both tools use it for automatic loading/discovery
2. **Keep SKILL.md under 500 lines** - Put detailed reference material in `references/`
3. **Use `$ARGUMENTS`** for user input (Claude Code)
4. **Use `!`command`` for dynamic context** (Claude Code)
5. **Set `disable-model-invocation: true`** for side-effect workflows (Claude Code only)
6. **Name must match directory** - `name` frontmatter must equal the directory name

## Workflow

When creating a new skill:

1. Determine the skill's purpose and which tools it targets (Claude Code, OpenCode, or both)
2. Choose a descriptive `lowercase-hyphenated` name
3. Write a description rich in trigger keywords so the agent loads it automatically
4. Draft the SKILL.md body with clear, concise instructions
5. If instructions exceed ~300 lines, split reference material into `references/` files
6. Create the SKILL.md in the appropriate directories:
   - For Claude Code: `.claude/skills/<name>/SKILL.md`
   - For OpenCode: `.opencode/skills/<name>/SKILL.md`
   - For both: create in both locations (or just `.claude/skills/` since OpenCode reads it too)

## Quality Checklist

- [ ] Description includes trigger keywords for automatic discovery
- [ ] SKILL.md is focused and under 500 lines
- [ ] Reference material in separate files if needed
- [ ] Appropriate invocation controls set
- [ ] Name matches directory name
- [ ] Frontmatter matches target tool's format
