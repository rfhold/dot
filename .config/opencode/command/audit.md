---
description: Scrutinize all changes against existing codebase patterns
---

Scrutinize every aspect of the current changes.

Spawn two explore tasks to start:
1. Run `git status` and identify new features and the components they belong to
2. Identify component boundaries and the patterns that were pre-existing prior to the changes from `git status`

After both tasks complete, spawn an explore task for each component identified and scrutinize the changes vs how the codebase had patterns prior to the changes.

After all audit tasks complete, compile every distinct finding and classify each as critical, high, medium, or low severity. Then present findings to the user in a single ask-question call with one multi-select question per severity tier that has findings. For example, if there are critical, high, and medium findings but no low findings, ask three questions in one call:

- "Which critical issues do you want to address?" — each critical finding as a selectable option
- "Which high issues do you want to address?" — each high finding as a selectable option
- "Which medium issues do you want to address?" — each medium finding as a selectable option

Skip any severity tier that has no findings.

For all selected findings, write a detailed fix plan as a markdown document to `.opencode/plans/` — descriptive kebab-case filename, comprehensive context, steps to execute, and rationale. Then stop and wait for further instructions.
