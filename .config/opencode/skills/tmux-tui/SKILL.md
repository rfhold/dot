---
name: tmux-tui
description: Operating tmux panes to run shell commands, monitor output, and interact with TUI applications. Invoked when needing to execute commands in a terminal pane, send keys to a running program, capture pane output, split windows, or manage pane lifecycle within tmux.
---

# Tmux TUI Pane Operations

Use this skill whenever you need to run commands or interact with programs in a tmux pane rather than (or in addition to) the built-in Bash tool. This is appropriate when you need to:

- Run long-lived processes (servers, watchers, builds) that should persist
- Interact with an existing TUI application (lazygit, nvim, htop, etc.)
- Execute commands in a specific working directory visible to the user
- Monitor output from a running process

## 1. Discovering Your Environment

You are running inside tmux. Your own pane ID is in `$TMUX_PANE`.

**Find sibling panes in the current window:**

```bash
tmux list-panes -F '#{pane_id} #{pane_index} #{pane_current_command} #{pane_current_path}'
```

This lists only panes in the same window. Each line gives you the pane's unique ID (e.g. `%12`), its index, what it's currently running, and its working directory.

**Find your own pane ID explicitly:**

```bash
echo $TMUX_PANE
```

The sibling pane is whichever pane in the output is NOT your own `$TMUX_PANE`.

## 2. Pane Selection Strategy

Follow this decision tree to find a pane to work in:

### Step 1: Identify the sibling pane

List panes in the current window and find the one whose `pane_id` differs from `$TMUX_PANE`. In a typical 2-pane layout, there is exactly one sibling.

### Step 2: Check if the sibling is idle

A pane is **idle** when `pane_current_command` is a shell: `bash`, `zsh`, `fish`, `sh`, `ksh`, or `dash`.

```bash
tmux display -p -t <pane_id> '#{pane_current_command}'
```

### Step 3: Decide

| Sibling state | Action |
|---|---|
| **Idle** (running a shell) | Use it directly. Send commands with `send-keys`. |
| **Running a TUI you want to interact with** (e.g. lazygit, nvim) | Use agent discretion. Identify the app, decide if sending keys is appropriate for the task. See section 6. |
| **Busy with something else** | Create a new pane. See step 4. |

### Step 4: Create a new pane (when sibling is unavailable)

Split the current window and capture the new pane's ID:

```bash
WORK_PANE=$(tmux split-window -h -P -F '#{pane_id}' -c '#{pane_current_path}')
```

Flags:
- `-h` splits horizontally (side by side). Use `-v` for vertical (top/bottom).
- `-P -F '#{pane_id}'` prints the new pane's ID to stdout so you can capture it.
- `-c '#{pane_current_path}'` inherits the working directory.

**Always store the pane ID** you're working with (whether sibling or newly created) for the duration of the task.

### Pane tracking

Once you've selected or created a pane, refer to it by its `%N` pane ID in all subsequent commands. Do not re-discover it each time.

## 3. Sending Commands

Use `tmux send-keys` to type into a pane.

### Shell commands

```bash
tmux send-keys -t %5 'npm run build' C-m
```

`C-m` is Enter. Always include it to execute the command.

### Interrupting a running process

```bash
tmux send-keys -t %5 C-c
```

### Literal text (disable key name interpretation)

```bash
tmux send-keys -l -t %5 'text that contains C-m literally'
```

The `-l` flag sends characters literally without interpreting key names.

### Special key reference

| Key | Name |
|---|---|
| Enter | `C-m` or `Enter` |
| Escape | `Escape` |
| Ctrl+C | `C-c` |
| Ctrl+L | `C-l` |
| Tab | `Tab` |
| Backspace | `BSpace` |
| Arrow keys | `Up`, `Down`, `Left`, `Right` |
| Page up/down | `PgUp`, `PgDn` |
| Home/End | `Home`, `End` |
| Delete | `DC` |
| Function keys | `F1` through `F12` |
| Alt+key | `M-<key>` (e.g. `M-x`) |

### Sending multiple keys in sequence

```bash
tmux send-keys -t %5 Escape ':wq' C-m
```

This sends Escape, then types `:wq`, then presses Enter -- useful for exiting nvim.

## 4. Capturing Output

Use `tmux capture-pane` to read what's on screen or in scrollback.

### Capture the last N lines

```bash
tmux capture-pane -p -t %5 -S -50 -J
```

Flags:
- `-p` prints to stdout (essential for scripting).
- `-S -50` starts 50 lines back from the bottom.
- `-J` joins wrapped lines (prevents long lines from splitting across multiple output lines).

### Capture entire visible pane

```bash
tmux capture-pane -p -t %5 -J
```

### Capture all scrollback

```bash
tmux capture-pane -p -t %5 -S - -E - -J
```

`-S -` means from the very beginning, `-E -` means to the very end.

### When to capture

Capture output **on demand** when you need to check results -- don't poll in a loop. Typical uses:
- After a build command finishes, capture to check for errors
- After running tests, capture to see results
- To inspect the current state of a TUI

## 5. Waiting for Command Completion

After sending a command, you may need to wait for it to finish before proceeding.

### Strategy: poll `pane_current_command`

When a shell command is running, `pane_current_command` reflects the running process. When it finishes, it reverts to the shell name.

```bash
# Check if the pane has returned to the shell prompt
CMD=$(tmux display -p -t %5 '#{pane_current_command}')
# If CMD is bash/zsh/fish/sh/ksh/dash, the command has finished
```

### Practical pattern

1. Send the command with `send-keys`
2. Wait a moment (`sleep 1` or more depending on expected duration)
3. Check `pane_current_command` -- if it's back to a shell, the command is done
4. Capture the output to inspect results

Do not use tight loops. Space out checks with reasonable sleep intervals (1-3 seconds). Set a timeout so you don't wait indefinitely.

```bash
# Example: wait up to 60 seconds for a command to finish
for i in $(seq 1 60); do
  CMD=$(tmux display -p -t %5 '#{pane_current_command}')
  case "$CMD" in
    bash|zsh|fish|sh|ksh|dash) break ;;
  esac
  sleep 1
done
```

## 6. TUI Interaction

When the target pane is running a TUI application, you can interact with it by sending keys.

### Identifying the application

```bash
tmux display -p -t %5 '#{pane_current_command}'
```

Common values: `nvim`, `vim`, `lazygit`, `htop`, `less`, `man`, `k9s`, `lazydocker`.

### Guidelines for TUI interaction

- **Know the app's keybindings** before sending keys. Don't guess.
- **Modal editors** (nvim/vim): Be aware of which mode the app is likely in. Send `Escape` first to ensure you're in normal mode before sending commands.
- **Confirmation prompts**: Some apps ask for confirmation (e.g. lazygit push). Account for this by sending the confirmation key after the action key.
- **Capture the screen** after sending keys to verify the result: `tmux capture-pane -p -t %5 -J`
- **Prefer discrete actions**: Send one logical action at a time, verify with a capture, then proceed. Don't blindly chain long key sequences.

### Example: stage all and commit in lazygit

```bash
# Assuming lazygit is running in %5 and is on the files panel
tmux send-keys -t %5 'a'        # stage all
tmux send-keys -t %5 'c'        # open commit dialog
sleep 0.5
tmux send-keys -t %5 'fix: typo in readme' Enter  # type message and confirm
```

### When NOT to interact with a TUI

- If you're unsure what the app is doing or what state it's in
- If the interaction could cause data loss (e.g. force-quitting an editor with unsaved changes)
- If a simpler approach exists (e.g. use `git` CLI directly instead of driving lazygit)

Use your judgment. When in doubt, create a new pane and work there instead.

## 7. Cleanup

**Do not close panes you created.** Leave them open so the user can inspect output, scroll through history, or continue working in them.

If you split a pane for a task, note its ID in your response so the user knows where to find it.

## Quick Reference

```bash
# Discover sibling pane
tmux list-panes -F '#{pane_id} #{pane_current_command}'

# Check if idle
tmux display -p -t %N '#{pane_current_command}'

# Create new pane (capture ID)
PANE=$(tmux split-window -h -P -F '#{pane_id}' -c '#{pane_current_path}')

# Send command
tmux send-keys -t %N 'command here' C-m

# Send special key
tmux send-keys -t %N C-c

# Capture output (last 50 lines)
tmux capture-pane -p -t %N -S -50 -J

# Wait for idle
tmux display -p -t %N '#{pane_current_command}'
```
