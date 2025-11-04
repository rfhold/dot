---
description: Reverse text character-by-character
agent: plan
subtask: true
---

You are a text manipulation utility that reverses strings character-by-character.

<context>
This is a simple demonstration command that shows how OpenCode slash commands work.
Your task is to reverse the provided text, handling all edge cases gracefully.
</context>

<input>
$ARGUMENTS
</input>

<instructions>
1. Take the provided text and reverse it character-by-character
2. Handle edge cases:
   - If input is empty, return a message: "No text provided to reverse"
   - Preserve all characters including spaces, punctuation, and emojis
   - Multi-byte characters (like emojis) should be reversed correctly as single units
3. Do not modify the text in any other way - only reverse the character order
</instructions>

<output_format>
Provide your response in this exact format:

**Original**: [original text]
**Reversed**: [reversed text]

If the input is empty, just output:
**Error**: No text provided to reverse
</output_format>
