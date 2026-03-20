# Skill Authoring Rubric

Use this rubric to review Claude Code/OpenCode skills for trigger quality, execution quality, safety, and maintainability.

## How To Use

- Score each criterion from `0` to `2`:
  - `0`: missing or clearly incorrect
  - `1`: present but weak, vague, or incomplete
  - `2`: clear, specific, and production-ready
- Apply all sections before publishing a skill.
- Re-run on each significant revision.

Recommended thresholds:
- `Ready`: >= 85% of maximum score and no critical failures
- `Needs revision`: 65%-84% or any critical failure
- `Block publish`: < 65%

Critical failures (auto-block):
- Invalid/malformed frontmatter
- Description too vague to route correctly
- Missing failure handling for high-impact actions
- No negative trigger tests

## Section A: Discovery and Triggering

1) Description states WHAT and WHEN
- `0`: unclear outcome and no usage context
- `1`: outcome present, usage context weak
- `2`: outcome and usage context are explicit and testable

2) Trigger phrases are realistic
- `0`: no user-like phrasing
- `1`: partial phrasing, lacks paraphrases
- `2`: includes common direct asks and paraphrases

3) Scope boundaries are explicit
- `0`: no boundaries
- `1`: implied boundaries only
- `2`: includes clear in-scope and out-of-scope wording

4) Over-trigger protection exists
- `0`: none
- `1`: minimal narrowing terms
- `2`: explicit negatives ("do not use for ...") where needed

5) Composability with other skills
- `0`: assumes exclusivity
- `1`: partially compatible
- `2`: designed to co-load safely with related skills

## Section B: Frontmatter and Metadata

1) `name` is valid kebab-case and matches directory
2) `description` is <= 1024 chars and high signal
3) No disallowed XML-like angle brackets in frontmatter
4) Optional metadata supports lifecycle (`author`, `version`, `category`, `tags`)
5) Platform-specific fields are valid for target runtime

Score each line item 0-2.

## Section C: Instruction Quality

1) Steps are executable, not abstract
- Includes concrete actions, expected outputs, and stop conditions.

2) Critical constraints are front-loaded
- Safety, policy, and irreversible-action checks appear early.

3) Error handling is explicit
- Includes known failure modes, diagnostics, and fallback paths.

4) Validation gates are defined
- States what must be true before proceeding to next step.

5) Deterministic checks are used when possible
- Uses scripts/check commands for critical verification where appropriate.

## Section D: Structure and Context Economy

1) `SKILL.md` is focused and readable (under 5,000 words / ~500 lines)
2) Deep details moved to `references/`
3) Optional `scripts/` used for repeatable checks
4) Optional `assets/` used for reusable templates/artifacts
5) No unnecessary files inside skill directory (for example internal README noise)

## Section E: Examples and Troubleshooting

1) Includes at least 2 realistic examples
- Each example includes user ask, actions, and expected result.

2) Examples cover at least 1 edge case

3) Troubleshooting section has error/cause/solution format

4) Includes MCP-specific recovery steps when MCP tools are involved

## Section F: Evaluation and Testing

Required test sets:

1) Trigger tests
- Positive obvious prompts
- Positive paraphrased prompts
- Negative non-trigger prompts

2) Functional tests
- Happy path correctness
- Edge cases
- Failure handling

3) Performance delta tests
- Compare with vs without skill on:
  - message count
  - tool call count
  - token use
  - failure rate

Scoring:
- `0`: test class absent
- `1`: partial/informal test class
- `2`: repeatable and documented test class

## Section G: MCP Workflow Readiness (If Applicable)

1) Tool access assumptions are documented
2) Auth/connectivity checks are defined
3) Tool names and required parameters are validated
4) Recovery path for unavailable MCP service
5) Clear separation between access setup and task workflow logic

## Section H: Maintenance and Versioning

1) `metadata.version` present and updated on behavior changes
2) Known issues and failure patterns are tracked
3) Trigger misses feed back into description tuning
4) Execution misses feed back into instruction tuning
5) Release notes or change summary maintained externally (repo-level)

## Consolidated Publish Checklist

- [ ] Name, directory, and SKILL filename are valid
- [ ] Description passes trigger quality review
- [ ] Scope boundaries and negative triggers are defined
- [ ] Instructions include constraints, validation, and fallback
- [ ] Examples and troubleshooting are practical
- [ ] Trigger/functional/perf tests completed
- [ ] MCP checks done (if applicable)
- [ ] Metadata version updated for meaningful changes
- [ ] References/scripts/assets are organized and minimal
- [ ] No critical failures present

## PR Review Template

Use this in pull requests:

```markdown
## Skill Review

Skill: `<name>`
Reviewer: `<name>`
Date: `<yyyy-mm-dd>`

### Scores
- Discovery and Triggering: `x/10`
- Frontmatter and Metadata: `x/10`
- Instruction Quality: `x/10`
- Structure and Context Economy: `x/10`
- Examples and Troubleshooting: `x/8`
- Evaluation and Testing: `x/6`
- MCP Readiness (if applicable): `x/10`
- Maintenance and Versioning: `x/10`

Total: `x/74` (or `x/64` if MCP not applicable)

### Critical Failures
- [ ] None
- [ ] Invalid frontmatter
- [ ] Routing description too vague
- [ ] Missing high-impact failure handling
- [ ] Missing negative trigger tests

### Required Changes Before Merge
1. ...
2. ...

### Nice-to-Have Improvements
1. ...
2. ...
```
