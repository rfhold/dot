---
description: Create a pull request for the current branch using gh CLI
---

Create a pull request for the current branch using the `gh` CLI.

1. Run `git log` and `git diff` against the base branch to understand all changes included in this PR.
2. Draft a short, terse PR title and description. Do NOT be verbose or overly detailed — keep it concise and to the point.
3. Use `gh pr create` to open the PR. If the branch has not been pushed to the remote yet, push it first with `git push -u origin HEAD`.
4. Open the PR URL in the browser using `gh pr view --web` when done.
