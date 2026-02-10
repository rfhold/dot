import { type Plugin } from "@opencode-ai/plugin"
import { spawn } from "child_process"
import * as fs from "fs/promises"
import * as path from "path"

const BREADCRUMB_DIR = "/tmp/opencode-notify"
const APP_NAME = "opencode"
const SOUNDS_DIR = "/usr/share/sounds/freedesktop/stereo"
const SOUND_MAP: Record<string, string> = {
  normal: `${SOUNDS_DIR}/complete.oga`,
  critical: `${SOUNDS_DIR}/dialog-warning.oga`,
}

/**
 * OpenCode Hyprland Notification Plugin
 *
 * Sends interactive Mako notifications when OpenCode needs attention:
 * - session.idle: Session needs attention (task complete, waiting for input, etc.)
 * - permission.asked: Permission needed, click to focus and respond
 * - question tool running: LLM is asking the user a question via the question tool
 *
 * Subagent sessions are silently ignored.
 * Notifications auto-dismiss after 10 seconds.
 *
 * Each notification's default action runs oc-focus to navigate
 * Ghostty -> tmux session -> correct pane.
 */
export const NotifyPlugin: Plugin = async ({ $ }) => {
  // -------------------------------------------------------------------------
  // Resolve tmux context once at plugin init
  // -------------------------------------------------------------------------
  const tmuxPane = process.env.TMUX_PANE
  let tmuxTarget = "" // "session:window.pane"
  let hyprlandAddr = "" // Hyprland window address for precise focusing
  let breadcrumbPath = ""

  if (tmuxPane) {
    try {
      const session = (
        await $`tmux display-message -p "#{session_name}"`.text()
      ).trim()
      const window = (
        await $`tmux display-message -p "#{window_index}"`.text()
      ).trim()
      const pane = (
        await $`tmux display-message -p "#{pane_index}"`.text()
      ).trim()
      tmuxTarget = `${session}:${window}.${pane}`
    } catch {
      // Not in tmux — notifications will still fire, just no focus action
    }
  }

  // Capture the Hyprland window address of this terminal at init time
  // so oc-focus can target the exact window even with multiple terminals open
  try {
    const activeWindow = (
      await $`hyprctl activewindow -j 2>/dev/null`.text()
    ).trim()
    const parsed = JSON.parse(activeWindow)
    if (parsed.class === "com.mitchellh.ghostty") {
      hyprlandAddr = parsed.address
    }
  } catch {
    // Not in Hyprland or activewindow failed
  }

  // -------------------------------------------------------------------------
  // Resolve context for notification body
  // -------------------------------------------------------------------------
  let repoName = ""
  try {
    const toplevel = (
      await $`git rev-parse --show-toplevel 2>/dev/null`.text()
    ).trim()
    repoName = path.basename(toplevel)
  } catch {
    // Not in a git repo
  }

  const contextLabel = repoName || tmuxTarget || "opencode"

  // -------------------------------------------------------------------------
  // State tracking — only notify when the user isn't actively watching
  // -------------------------------------------------------------------------
  const subagentSessions = new Set<string>()
  const interruptedSessions = new Set<string>()

  // -------------------------------------------------------------------------
  // Sound
  // -------------------------------------------------------------------------

  function playSound(urgency: "low" | "normal" | "critical") {
    const soundFile = SOUND_MAP[urgency] || SOUND_MAP.normal
    if (!soundFile) return
    const child = spawn("pw-play", [soundFile], {
      detached: true,
      stdio: "ignore",
    })
    child.unref()
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  async function ensureBreadcrumb(sessionID: string): Promise<string> {
    if (!tmuxTarget) return ""

    await fs.mkdir(BREADCRUMB_DIR, { recursive: true })
    const filePath = path.join(BREADCRUMB_DIR, sessionID)
    // Line 1: tmux target, Line 2: Hyprland window address (optional)
    const content = hyprlandAddr
      ? `${tmuxTarget}\n${hyprlandAddr}`
      : tmuxTarget
    await fs.writeFile(filePath, content, "utf-8")
    breadcrumbPath = filePath
    return filePath
  }

  async function sendNotification(opts: {
    title: string
    body: string
    urgency?: "low" | "normal" | "critical"
    sessionID?: string
  }) {
    const { title, body, urgency = "normal", sessionID } = opts

    // Ensure breadcrumb exists for focus action
    let crumb = breadcrumbPath
    if (sessionID) {
      crumb = await ensureBreadcrumb(sessionID)
    }

    // Play notification sound
    playSound(urgency)

    if (!crumb) {
      // No tmux context — fire and forget, no action buttons
      spawn("notify-send", ["-a", APP_NAME, "-u", urgency, "-t", "10000", title, body], {
        detached: true,
        stdio: "ignore",
      }).unref()
      return
    }

    // Spawn a detached bash process that:
    // 1. Calls notify-send -A which blocks until user clicks or dismisses (10s TTL)
    // 2. If user clicks "Focus", runs oc-focus to navigate to the pane
    const script = [
      `ACTION=$(notify-send -a "${APP_NAME}" -u ${urgency} -t 10000 -A "default=Focus" "$1" "$2")`,
      `[ "$ACTION" = "default" ] && exec oc-focus "$3"`,
    ].join("; ")

    spawn("bash", ["-c", script, "--", title, body, crumb], {
      detached: true,
      stdio: "ignore",
    }).unref()
  }

  // -------------------------------------------------------------------------
  // Plugin hooks
  // -------------------------------------------------------------------------
  return {
    event: async ({ event }) => {
      // -- Question asked — notify when the question tool is waiting for input --
      if (event.type === "message.part.updated") {
        const part = (event as any).properties?.part
        if (
          part?.type === "tool" &&
          part.tool === "question" &&
          part.state?.status === "running"
        ) {
          const sessionID = part.sessionID
          if (sessionID && subagentSessions.has(sessionID)) return

          // Always notify for questions — no focus check.
          // The user needs to know a question was asked even if they're
          // looking at the terminal (sound is the main signal here).
          const question = part.state?.input?.questions?.[0]?.question || "OpenCode has a question"
          await sendNotification({
            title: "Question",
            body: question.slice(0, 120),
            urgency: "critical",
            sessionID,
          })
        }
        return
      }

      // -- Track subagent sessions so we can skip their notifications --
      if (event.type === "session.created") {
        const info = (event as any).properties?.info
        if (info?.parentID) {
          subagentSessions.add(info.id)
        }
        return
      }

      // -- Clean up subagent tracking on session delete --
      if (event.type === "session.deleted") {
        const info = (event as any).properties?.info
        if (info?.id) {
          subagentSessions.delete(info.id)
        }
        return
      }

      // -- Track session errors (including user interrupts/aborts) --
      if (event.type === "session.error") {
        const sessionID = (event as any).properties?.sessionID
        if (sessionID) {
          interruptedSessions.add(sessionID)
          // Clean up after a short window so it doesn't leak
          setTimeout(() => interruptedSessions.delete(sessionID), 1000)
        }
        return
      }

      // -- Session idle — task complete or waiting for user input --
      // Delay slightly so session.error (which fires ~5ms after idle) can
      // mark the session as interrupted before we decide to notify.
      if (event.type === "session.idle") {
        const sessionID = (event as any).properties?.sessionID
        if (!sessionID) return

        // Skip subagent sessions — only notify for top-level sessions
        if (subagentSessions.has(sessionID)) return

        setTimeout(async () => {
          // Check after delay — session.error will have fired by now
          if (interruptedSessions.has(sessionID)) {
            interruptedSessions.delete(sessionID)
            return
          }
          await sendNotification({
            title: "Task Complete",
            body: contextLabel,
            urgency: "normal",
            sessionID,
          })
        }, 200)
      }

      // -- Permission needed --
      if (event.type === "permission.asked") {
        const props = (event as any).properties
        if (!props) return

        const tool = props.permission || "unknown"
        const patterns = Array.isArray(props.patterns)
          ? props.patterns.join(", ")
          : ""
        const preview =
          patterns.length > 80 ? patterns.slice(0, 77) + "..." : patterns
        const body = preview ? `${tool}: ${preview}` : tool

        await sendNotification({
          title: "Permission Needed",
          body,
          urgency: "critical",
          sessionID: props.sessionID,
        })
      }

    },

  }
}
