# Skill Architecture Patterns

Five common patterns for structuring skill instructions. Choose based on the workflow shape.

## Pattern 1: Sequential Workflow Orchestration

Use when users need multi-step processes that must run in a specific order.

Key techniques:
- Explicit step ordering with numbered phases
- Dependencies between steps clearly stated
- Validation gate at each stage before proceeding
- Rollback instructions if a step fails

Example shape:
```
Step 1: Gather inputs → validate
Step 2: Create resource → verify exists
Step 3: Configure resource → run check script
Step 4: Activate → confirm status
Rollback: if Step 3 fails, delete resource from Step 2
```

## Pattern 2: Multi-MCP Coordination

Use when workflows span multiple services (e.g., Figma to Drive to Linear to Slack).

Key techniques:
- Clear phase separation (one MCP per phase)
- Data passing between phases (output of phase N feeds phase N+1)
- Validation before calling next MCP
- Independent failure handling per MCP

Example shape:
```
Phase 1: Fetch design from Figma MCP → extract component list
Phase 2: Create doc in Google Drive MCP using component list
Phase 3: Create tasks in Linear MCP from doc sections
Phase 4: Post summary to Slack MCP
```

## Pattern 3: Iterative Refinement

Use when output quality improves through multiple passes.

Key techniques:
- Explicit quality criteria defined upfront
- Validation scripts or checklists to measure progress
- Maximum iteration count to prevent infinite loops
- Clear "done" condition

Example shape:
```
Draft → validate against criteria → if failing, refine → re-validate
Max 3 iterations. If still failing after 3, present best attempt with issues listed.
```

## Pattern 4: Context-Aware Tool Selection

Use when the same outcome can be achieved with different tools depending on context.

Key techniques:
- Clear decision criteria (what determines which tool)
- Fallback chain if preferred tool is unavailable
- Transparency about which path was chosen and why

Example shape:
```
If project uses npm → use npm commands
If project uses pnpm → use pnpm commands
If neither detected → ask user
Fallback: if package manager command fails, suggest manual steps
```

## Pattern 5: Domain-Specific Intelligence

Use when the skill adds specialized knowledge beyond tool access (compliance rules, style guides, industry standards).

Key techniques:
- Domain expertise embedded in decision logic
- Compliance/standards checks before action
- Audit trail of decisions and rationale
- References to authoritative sources

Example shape:
```
Before creating resource:
  - Check against compliance rules in references/compliance.md
  - Verify naming follows org standards
  - Log decision rationale
Then proceed with creation.
```

## Choosing a Pattern

| Your workflow...                          | Use pattern               |
|-------------------------------------------|---------------------------|
| Has ordered steps with dependencies       | Sequential Orchestration  |
| Spans multiple external services          | Multi-MCP Coordination    |
| Needs multiple passes to reach quality    | Iterative Refinement      |
| Could use different tools for same goal   | Context-Aware Selection   |
| Requires specialized domain knowledge     | Domain-Specific           |

Patterns can be combined. A skill might use Sequential Orchestration overall with Iterative Refinement at one step and Domain-Specific Intelligence for validation.
