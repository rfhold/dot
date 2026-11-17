# Global Personal Instructions

## Commits and Pull Requests
- Use Conventional Commits format for commit messages and PR titles.
- Do not add "Co-authored-by" trailers to commits or PRs.

## Communication Style
- Do not use emojis unless specifically requested by the user.

## Code Comments
- Keep comments terse; avoid unnecessary comments like section separators or lines that merely restate what the code obviously does.

## Using Subagents

### Choose whether to delegate
- Delegate when parallel work, specialist knowledge, independent review, or context isolation provides a clear benefit.
- Account for the cost of the brief, context transfer, coordination, and verification.
- Keep small, context-heavy tasks in the parent when direct completion costs less than a complete handoff.
- Examples include short contracts, acceptance criteria, examples, and small edits that depend on context the parent already understands.
- The parent owns task decomposition, plan authorship, decisions, integration, and the final outcome.

### Provide complete context
- Treat every new subagent as a fresh session with no knowledge of the parent conversation or other agents' work.
- Give each subagent one bounded outcome.
- Make the brief sufficient for independent execution, either directly or through explicit, accessible references.
- Include the objective, relevant background, requirements, rationale, settled decisions, constraints, non-goals, and acceptance criteria.
- Supply concrete evidence: exact paths, relevant source material, examples, and verified findings.
- When exact text or structure matters, supply the approved artifact verbatim or require the subagent to read its file.
- Never reference “the approved plan,” “our discussion,” or another agent's findings without supplying the relevant content.
- For file references, identify the exact paths and required sections.
- Verify that referenced files contain the necessary information and exist in the subagent's environment.
- Name the permitted files, allowed actions, required verification, and return format.
- Distinguish requirements and verified facts from suggestions, examples, assumptions, and unresolved questions.
- Summarize relevant context into an organized brief.
- Require subagents to report essential context gaps or contradictory requirements before dependent work.
- Do not ask subagents to reconstruct decisions that the parent already knows.

### Maintain operational plans
- For complex work with dependent stages, multiple handoffs, or cross-session continuity, maintain an operational plan file.
- Use the repository's established temporary plan location when available.
- Keep the plan accessible to every agent that needs it.
- Record the objective, approved scope, constraints, decisions, acceptance criteria, and approval boundaries.
- Track stages, owners, dependencies, status, output paths, verification evidence, blockers, and the next action.
- Distinguish proposed work, authorized work, reported results, and verified results.
- The parent authors and maintains the plan.
- Before each handoff, update the plan with current decisions and verified progress.
- Give each subagent the plan path, relevant revision or snapshot, required sections, and assigned stage.
- Include task-specific scope and return requirements in the brief even when a plan exists.
- Across worktrees or isolated environments, explicitly provide the required plan and artifacts.
- Keep temporary operational plans uncommitted.
- At completion, preserve durable decisions in their authoritative documentation.
- After completion or abandonment, remove task-owned temporary plans once no active agent needs them.

### Verify and integrate
- Run independent tasks in parallel only when their write scopes do not overlap.
- Before dependent work starts, verify its prerequisite results.
- Pass those verified results explicitly to the next subagent.
- Give reviewers the original requirements and evidence, plus the implementation artifacts.
- Check actual results against the original requirements.
- Treat a subagent's success report as a claim until verification supports it.

### Examples

These examples use synthetic paths and tasks.

**Bad: inaccessible approval**
> Implement the approved plan.

The plan exists only in the parent conversation.

**Good: explicit context**
> Implement stage 2 from `work-plan.md`, revision 3.
> Read “Approved contract,” “Constraints,” and “Stage 2” first.
> Stage 1 passed verification; its output is `src/parser.ts`.
> Edit only `src/formatter.ts` and `tests/formatter.test.ts`.
> Run the stage 2 checks listed in the plan.
> Return changed paths, check results, deviations, and unresolved questions.

The parent first verifies that the subagent can read the named plan and prerequisite artifact.

**Bad: unnecessary context transfer**
> Write three examples for the contract we just discussed.

The parent already understands the contract and its edge cases.
The handoff costs more than the examples.

**Good: retain the small task**
The parent writes the examples directly from its current context.
If independent review adds value, the reviewer receives the contract, examples, and review criteria.

**Bad: implicit progress**
> Continue where the other agent stopped.

**Good: current operational state**
> Read `work-plan.md`, revision 5, especially “Verified results” and “Stage 3.”
> Stage 2 passed its checks; its output paths and evidence appear there.
> Execute stage 3 within its listed write scope.
> Return the required artifacts, verification results, and blockers.

## Git
- git worktrees go in a relative .worktrees directory, git exclude or ignore it. you may need to copy a .npmrc, if its git ignored, blindly copy it
- repos are checked out under a standard ~/repos/{OWNER}/{REPO} structure
