# Global Personal Instructions

## Commits and Pull Requests
- Use Conventional Commits format for commit messages and PR titles.
- Do not add "Co-authored-by" trailers to commits or PRs.

## Communication Style
- Do not use emojis unless specifically requested by the user.

## Code Comments
- Keep comments terse; avoid unnecessary comments like section separators or lines that merely restate what the code obviously does.

## Using Subagents
- Treat each new subagent as a fresh session with no knowledge of this conversation, prior decisions, or other agents' work.
- Delegate a bounded task with a clear outcome.
- Make each brief self-contained: include the objective, relevant context, settled decisions, constraints, and acceptance criteria.
- Supply concrete evidence: exact paths, relevant source material, examples, and verified findings that the task depends on.
- When exact text or structure matters, include the approved artifact verbatim or require the subagent to read its accessible file.
- Distinguish requirements from suggestions, examples, assumptions, and unresolved questions.
- State which files the subagent can change, which actions it can take, and which work remains outside its scope.
- Specify the required verification and return format, including results, evidence, deviations, and unresolved issues.
- Require the subagent to report missing context or conflicting requirements rather than invent answers.
- Run independent tasks in parallel only when their write scopes do not overlap.
- Pass verified results to dependent subagents explicitly; agents do not automatically share discoveries.
- Retain responsibility for integration and the final outcome.
- Check actual results against the original requirements; a subagent's success report is not proof.
- Give reviewers the original requirements and evidence, not only the implementer's summary.

## Git
- git worktrees go in a relative .worktrees directory, git exclude or ignore it. you may need to copy a .npmrc, if its git ignored, blindly copy it
- repos are checked out under a standard ~/repos/{OWNER}/{REPO} structure
