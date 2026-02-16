package agent

import (
	"fmt"
	"log/slog"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"dev.rholden.dot/internal/models"
)

// ListSessions runs `tmux list-sessions` and parses the output into TmuxSession structs,
// including nested window and pane details.
func ListSessions() ([]models.TmuxSession, error) {
	cmd := exec.Command("tmux", "list-sessions", "-F",
		"#{session_name}\t#{session_windows}\t#{session_attached}\t#{session_activity}")
	output, err := cmd.Output()
	if err != nil {
		// Exit code 1 means tmux server is not running (no sessions) — not an error.
		if exitErr, ok := err.(*exec.ExitError); ok && exitErr.ExitCode() == 1 {
			return []models.TmuxSession{}, nil
		}
		return nil, fmt.Errorf("tmux list-sessions: %w", err)
	}

	sessions, err := ParseSessions(string(output))
	if err != nil {
		return nil, err
	}

	// Enrich each session with window and pane details.
	for i := range sessions {
		windows, err := listWindows(sessions[i].Name)
		if err != nil {
			slog.Warn("failed to list windows for session", "session", sessions[i].Name, "error", err)
			continue
		}
		sessions[i].WindowDetails = windows
	}

	return sessions, nil
}

// listWindows runs `tmux list-windows` for a session and returns parsed TmuxWindow structs,
// each enriched with pane details.
func listWindows(sessionName string) ([]models.TmuxWindow, error) {
	cmd := exec.Command("tmux", "list-windows", "-t", sessionName, "-F",
		"#{window_index}\t#{window_name}\t#{window_active}\t#{window_panes}")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("tmux list-windows -t %s: %w", sessionName, err)
	}

	windows, err := ParseWindows(string(output))
	if err != nil {
		return nil, err
	}

	// Enrich each window with pane details.
	for i := range windows {
		panes, err := listPanes(sessionName, windows[i].Index)
		if err != nil {
			slog.Warn("failed to list panes", "session", sessionName, "window", windows[i].Index, "error", err)
			continue
		}
		windows[i].Panes = panes
	}

	return windows, nil
}

// listPanes runs `tmux list-panes` for a specific window and returns parsed TmuxPane structs.
func listPanes(sessionName string, windowIndex int) ([]models.TmuxPane, error) {
	target := fmt.Sprintf("%s:%d", sessionName, windowIndex)
	cmd := exec.Command("tmux", "list-panes", "-t", target, "-F",
		"#{pane_index}\t#{pane_current_command}\t#{pane_active}\t#{pane_title}")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("tmux list-panes -t %s: %w", target, err)
	}

	return ParsePanes(string(output))
}

// ParseSessions parses the tab-separated output of `tmux list-sessions -F`
// into TmuxSession structs. Each line is expected to have the format:
// session_name\twindow_count\tattached(0|1)\tactivity_epoch
func ParseSessions(output string) ([]models.TmuxSession, error) {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	var sessions []models.TmuxSession

	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, "\t", 4)
		if len(parts) != 4 {
			slog.Warn("malformed tmux session line, skipping", "line", line)
			continue
		}

		windows, err := strconv.Atoi(parts[1])
		if err != nil {
			slog.Warn("invalid window count, skipping line", "line", line, "error", err)
			continue
		}

		attached := parts[2] == "1"

		epoch, err := strconv.ParseInt(parts[3], 10, 64)
		if err != nil {
			slog.Warn("invalid activity timestamp, skipping line", "line", line, "error", err)
			continue
		}

		sessions = append(sessions, models.TmuxSession{
			Name:         parts[0],
			Windows:      windows,
			Attached:     attached,
			LastActivity: time.Unix(epoch, 0),
		})
	}

	return sessions, nil
}

// ParseWindows parses the tab-separated output of `tmux list-windows -F`
// into TmuxWindow structs. Each line is expected to have the format:
// window_index\twindow_name\twindow_active(0|1)\twindow_panes
func ParseWindows(output string) ([]models.TmuxWindow, error) {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	var windows []models.TmuxWindow

	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, "\t", 4)
		if len(parts) != 4 {
			slog.Warn("malformed tmux window line, skipping", "line", line)
			continue
		}

		index, err := strconv.Atoi(parts[0])
		if err != nil {
			slog.Warn("invalid window index, skipping line", "line", line, "error", err)
			continue
		}

		active := parts[2] == "1"

		windows = append(windows, models.TmuxWindow{
			Index:  index,
			Name:   parts[1],
			Active: active,
		})
	}

	return windows, nil
}

// ParsePanes parses the tab-separated output of `tmux list-panes -F`
// into TmuxPane structs. Each line is expected to have the format:
// pane_index\tpane_current_command\tpane_active(0|1)\tpane_title
func ParsePanes(output string) ([]models.TmuxPane, error) {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	var panes []models.TmuxPane

	for _, line := range lines {
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, "\t", 4)
		if len(parts) != 4 {
			slog.Warn("malformed tmux pane line, skipping", "line", line)
			continue
		}

		index, err := strconv.Atoi(parts[0])
		if err != nil {
			slog.Warn("invalid pane index, skipping line", "line", line, "error", err)
			continue
		}

		active := parts[2] == "1"

		panes = append(panes, models.TmuxPane{
			Index:          index,
			CurrentCommand: parts[1],
			Active:         active,
			Title:          parts[3],
		})
	}

	return panes, nil
}
