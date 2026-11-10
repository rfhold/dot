export type Request = { goal: string }
export const boundary = "Act on the user's behalf within their trusted goal and limits. Local goal work is the default authorization. Commits, pushes, publication, deployments, destructive work, external decisions, and scope expansion need explicit human authority. Escalate uncertainty; never infer high-risk consent or override a human rejection or configured denial."

export function parseRequest(text: string): Request {
  const goal = text.trim()
  if (!goal || goal.length > 8000) throw new Error("Provide a plain-language goal and limits, at most 8,000 characters.")
  if (/(^|\s)--scope(?:\s|$)/.test(goal)) throw new Error("--scope JSON is no longer supported. State your goal and limits in plain language.")
  return { goal }
}
