const shared = `Delegation model guidance
Default: omit the subagent model parameter and use native defaults. Discretionary model selection requires both current user authorization and permission under the applicable tool instructions. An explicit user model request takes precedence over these preferences, subject to tool restrictions and availability. If authorization is revoked, return to defaults.
This guidance grants no authority to delegate. Preserve the assigned agent role, task scope, and permissions. If the tool permits overrides only when the user names a specific model or variant, broad permission to choose models is insufficient: omit the override and explain that limitation when relevant. Never bypass or rewrite that restriction.
When selection is permitted, choose the smallest suitable model. Escalate only for concrete task complexity or observed failure, within the authorized scope and retry budget; stop or ask when that budget is exhausted. Verify availability with the model-listing tool and use exact selectable provider/model IDs, not upstream gateway IDs. Do not invent an unavailable model or silently substitute for an explicit request. Do not select fast variants or override reasoning settings without user authorization.
The following assignments are user preferences, not benchmark facts.`

const profiles: Record<string, string | undefined> = {
  openai: `OpenAI preferences:
- openai/gpt-6.1-terra: bounded exploration and simple edits.
- openai/gpt-6.1-sol: multi-file work, debugging, and repository reviews.
- openai/gpt-6-astra: difficult architecture, persistent failures, and consequential reviews.`,
  anthropic: `Anthropic preferences:
- anthropic/claude-sonnet-5-5: routine work.
- anthropic/claude-opus-5-5: complex work.
- anthropic/claude-fable-5-2: an explicitly requested alternative or task-specific user preference; never an automatic upgrade.`,
}

export function guidance(providerID: string): string | undefined {
  const profile = Object.hasOwn(profiles, providerID) ? profiles[providerID] : undefined
  return profile ? `${shared}\n\n${profile}` : undefined
}
