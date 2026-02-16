---
description: Develop a thorough plan through research, exploration, and clarifying questions
---

Develop a clear, thorough plan for: $ARGUMENTS

Use the ask-question tool, @research, and @explore iteratively until you have a complete understanding of what needs to happen. Do not rush — keep digging until there are no unknowns left.

1. Start by asking clarifying questions about ambiguous requirements, scope, or constraints. Use a single ask-question call with as many questions as needed.
2. Spawn @explore tasks to understand the relevant parts of the codebase — existing patterns, related code, dependencies, and anything that could affect the approach.
3. Spawn @research tasks for any external topics that need investigation — libraries, APIs, best practices, etc.
4. Based on what you learn, ask follow-up questions if new ambiguities surface. Repeat steps 2-4 as needed.
5. Once you have a clear understanding, synthesize everything into a detailed plan and present it to the user for review. Do NOT write it to a file — just present it in the conversation. The user can run `/prep` to save it when ready.
