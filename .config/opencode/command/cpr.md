---
description: Commit, push, and open a pull request
---

Commit, push, and open a pull request: $ARGUMENTS

1. Stage any relevant changes, write a concise conventional commit message (e.g. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`) that captures the intent, then push to the remote. Use $ARGUMENTS as the commit message hint if provided.
2. Run `git log` and `git diff` against the base branch to understand all changes included in this PR.
3. Draft a short, terse PR title in conventional commit format (e.g. `feat: add login flow`) and a brief description. Do NOT be verbose or overly detailed — keep it concise and to the point.
4. Use `gh pr create` to open the PR. If the branch has not been pushed to the remote yet, push it first with `git push -u origin HEAD`.
5. Open the PR URL in the browser using `gh pr view --web` when done.
