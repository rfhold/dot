package devclean

import (
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/ansi"
	"github.com/muesli/termenv"
)

type uiLine struct{ text, tone string }

var uiRenderer = func() *lipgloss.Renderer {
	r := lipgloss.NewRenderer(io.Discard)
	r.SetColorProfile(termenv.ANSI256)
	return r
}()

func (m Model) paint(l uiLine) string {
	s := safeText(l.text)
	if !m.color || l.tone == "" {
		return s
	}
	color := "37"
	if l.tone == "warning" {
		color = "214"
	} else if l.tone == "danger" {
		color = "203"
	}
	return uiRenderer.NewStyle().Foreground(lipgloss.Color(color)).Render(s)
}

func wrapLines(lines []uiLine, width int) []uiLine {
	var out []uiLine
	for _, l := range lines {
		for _, s := range strings.Split(ansi.Hardwrap(safeText(l.text), width, true), "\n") {
			out = append(out, uiLine{s, l.tone})
		}
	}
	return out
}

func textLines(ss []string) []uiLine {
	var out []uiLine
	for _, s := range ss {
		out = append(out, uiLine{text: s})
	}
	return out
}

func (m Model) summary() string {
	var bytes int64
	unknown := 0
	ts := m.selection()
	for _, t := range ts {
		if t.Known {
			bytes += t.Bytes
		} else {
			unknown++
		}
	}
	s := fmt.Sprintf("%d selected · ~%s estimated", len(ts), Size(bytes))
	if unknown > 0 {
		s += fmt.Sprintf(" + %d unknown", unknown)
	}
	return s
}

func (m Model) shortPath(t Target) string {
	p := t.Path
	if p == "" {
		return t.Detail
	}
	if root := m.engine.Config.Repo; root != "" && within(p, root) {
		rel, _ := filepath.Rel(root, p)
		return filepath.Join(filepath.Base(root), rel)
	}
	if home := m.engine.Config.Home; home != "" && within(p, home) {
		rel, _ := filepath.Rel(home, p)
		return filepath.Join("~", rel)
	}
	return p
}

func fit(s string, width int) string {
	return ansi.Truncate(safeText(s), max(1, width), "…")
}

func (m Model) targetRow(t Target, focused bool, width int) uiLine {
	marker, check := " ", " "
	if focused {
		marker = ">"
	}
	if m.selected[t.ID] {
		check = "x"
	}
	size := "unknown"
	if t.Known {
		size = "~" + Size(t.Bytes)
	}
	kindWidth := 12
	if width < 65 {
		kindWidth = 5
	}
	row := fmt.Sprintf("%s[%s] %10s %-*s %s", marker, check, size, kindWidth, fit(string(t.Kind), kindWidth), safeText(m.shortPath(t)))
	if width < 40 {
		row = fmt.Sprintf("%s[%s] %s %s", marker, check, size, safeText(m.shortPath(t)))
	}
	tone := ""
	if focused || m.selected[t.ID] {
		tone = "focus"
	}
	return uiLine{fit(row, width), tone}
}

func (m Model) confirmationLayout() (footer []uiLine, reviewRows int) {
	width := max(1, m.width)
	help := "enter: execute · esc: back · up/down: scroll"
	if width < 40 {
		help = "enter run; esc back; up/down scroll"
	}
	input := safeText(m.input)
	if n := ansi.StringWidth(input) - max(1, width-3); n > 0 {
		input = ansi.TruncateLeft(input, n, "…")
	}
	input = fit("> "+input, width)
	footer = wrapLines([]uiLine{{"Type " + m.confirmation.Phrase(), "danger"}, {help, ""}, {input, "focus"}}, width)
	return footer, max(0, m.height-1-len(footer))
}

func (m Model) confirmationResizeView() string {
	lines := wrapLines([]uiLine{{"Resize to review", "warning"}, {"Cleanup blocked.", "warning"}, {"Enlarge pane; esc: back", ""}}, max(1, m.width))
	var out []string
	for _, l := range lines[:min(len(lines), max(1, m.height))] {
		out = append(out, m.paint(l))
	}
	return strings.Join(out, "\n")
}

func (m Model) View() string {
	if m.stage == "confirm" && !m.quitting {
		if _, reviewRows := m.confirmationLayout(); reviewRows == 0 {
			return m.confirmationResizeView()
		}
	}
	width, height := max(1, m.width), max(1, m.height)
	header := uiLine{"dev-clean", "focus"}
	var body, footer []uiLine
	list := false
	switch m.stage {
	case "scan":
		header.text += " | scan (read-only)"
		body = []uiLine{{"Scanning " + string("|/-\\"[m.frame%4]) + "  Discover repositories, worktrees, nested workspaces and global caches…", "focus"}, {"No cleanup runs during discovery. Sizes appear when the scan completes.", ""}}
		footer = []uiLine{{"ctrl+c: cancel", ""}}
	case "clean":
		header = uiLine{"dev-clean | cleanup", "danger"}
		body = []uiLine{{fmt.Sprintf("%d of %d completed · sequential cleanup", len(m.results), len(m.queue)), ""}}
		if len(m.results) < len(m.queue) {
			body = append(body, uiLine{fmt.Sprintf("Active %d/%d: %s", len(m.results)+1, len(m.queue), m.queue[len(m.results)].Label()), "danger"})
		}
		failed := 0
		for _, r := range m.results {
			if r.Err != nil {
				failed++
			}
		}
		if failed > 0 {
			body = append(body, uiLine{fmt.Sprintf("%d failed; details follow in results", failed), "warning"})
		}
		footer = []uiLine{{"ctrl+c: cancel; completed operations have no undo", "warning"}}
	case "confirm":
		header = uiLine{fmt.Sprintf("Confirm cleanup: %d targets", len(m.queue)), "danger"}
		body = textLines(m.previewLines(m.queue))
		if m.confirmation.Docker {
			header.text = "DOCKER DATA LOSS | " + header.text
			var warnings []uiLine
			for _, t := range m.queue {
				if t.Kind == Docker && t.Docker != nil {
					warnings = append(warnings, uiLine{"Docker destination: " + t.Docker.Label(), "warning"})
				}
			}
			warnings = append(warnings, uiLine{"Deletes ALL stopped containers, unused images/build cache and unused volumes, INCLUDING NAMED VOLUMES.", "danger"}, uiLine{"Preserves containers that run and their referenced resources. This can delete databases and local test data.", "warning"})
			body = append(warnings, body...)
		}
		footer, _ = m.confirmationLayout()
	case "results":
		header.text += " | results"
		var total int64
		for _, r := range m.results {
			body = append(body, uiLine{r.Target.Label(), "focus"})
			status := uiLine{"  OK", ""}
			if r.Err != nil {
				status = uiLine{"  ERROR: " + r.Err.Error(), "warning"}
			}
			estimate := "recovered space unknown"
			if r.Known {
				estimate = "~" + Size(r.Recovered) + " fewer logical bytes"
				total += r.Recovered
			}
			body = append(body, status, uiLine{"  " + estimate, ""})
		}
		body = append(body, uiLine{"Total observed reduction: ~" + Size(total) + " (excludes unknowns; shared layers/files can differ). Logical-byte estimates, not precise disk recovery.", ""})
		footer = []uiLine{{"r: rescan (clears selection) · up/down: scroll · q: quit", ""}}
	case "warnings":
		header = uiLine{fmt.Sprintf("dev-clean | %d scan warnings", len(m.snapshot.Warnings)), "warning"}
		body = textLines(m.snapshot.Warnings)
		if len(body) == 0 {
			body = []uiLine{{"No scan warnings.", ""}}
		}
		footer = []uiLine{{"up/down: scroll · esc: back · r: refresh · q: quit", ""}}
	case "help":
		header.text += " | keys / estimates"
		body = textLines([]string{m.summary(), "Estimates use logical bytes, not exact free disk space. Unknown sizes are excluded from the total.", "up/down or j/k: focus a target", "space: toggle target; a: select filtered targets; n: clear selection", "/: filter; enter/esc: finish filter", "p: selected command preview; d: focused details", "up/down: scroll details, preview, warnings or review", "enter: review selection; type the exact phrase to execute", "w: scan warnings; r: refresh and clear selection", "q: quit; ctrl+c: cancel active work"})
		footer = []uiLine{{"up/down: scroll · esc: back", ""}}
	default:
		header.text += fmt.Sprintf(" | %d targets", len(m.snapshot.Targets))
		footer = []uiLine{{m.summary(), "focus"}}
		if m.filtering || m.filter != "" {
			footer = append(footer, uiLine{"Filter: " + m.filter + " (enter/esc: done)", "focus"})
		}
		if len(m.snapshot.Warnings) > 0 {
			footer = append(footer, uiLine{fmt.Sprintf("%d scan warnings · w: view", len(m.snapshot.Warnings)), "warning"})
		}
		if width >= 65 {
			footer = append(footer, uiLine{"space: toggle · a: select filtered · n: clear · /: filter", ""}, uiLine{"p: preview · d: details · enter: review · r: refresh · q: quit", ""})
		} else {
			footer = append(footer, uiLine{"space: toggle · /: filter · enter: review", ""}, uiLine{"a: all · n: none · p: preview · d: details", ""}, uiLine{"r: refresh · q: quit", ""})
		}
		if width < 30 || height < 14 {
			footer = []uiLine{{fit(m.summary(), width), "focus"}}
			unknown := 0
			for _, t := range m.selection() {
				if !t.Known {
					unknown++
				}
			}
			if unknown > 0 {
				footer = append(footer, uiLine{fmt.Sprintf("%d unknown", unknown), ""})
			}
			if m.filtering || m.filter != "" {
				footer = append(footer, uiLine{fit("Filter: "+m.filter, width), "focus"})
			}
			if len(m.snapshot.Warnings) > 0 {
				footer = append(footer, uiLine{fit(fmt.Sprintf("%d warn (w)", len(m.snapshot.Warnings)), width), "warning"})
			}
			footer = append(footer, uiLine{"space toggle", ""}, uiLine{"enter review", ""}, uiLine{"?: help", ""})
		}
		if m.preview {
			body = textLines(m.previewLines(m.selection()))
			if len(body) == 0 {
				body = []uiLine{{"No targets selected.", ""}}
			}
			body = append([]uiLine{{"SELECTED PREVIEW · up/down: scroll · p: back", "focus"}}, body...)
		} else if m.details {
			body = []uiLine{{"FOCUSED DETAILS · up/down: scroll · d: back", "focus"}}
			ts := m.visible()
			if len(ts) > 0 {
				body = append(body, textLines(m.previewLines(ts[min(m.cursor, len(ts)-1):min(m.cursor, len(ts)-1)+1]))...)
			}
		} else {
			list = true
		}
	}
	if m.quitting {
		footer = []uiLine{{"Cancel requested; wait for the active operation to stop…", "warning"}}
	}
	footer = wrapLines(footer, width)
	// Keep confirmation controls pinned; body text has its own scroll position.
	if len(footer) >= height {
		footer = footer[max(0, len(footer)-height+1):]
	}
	rows := max(0, height-1-len(footer))
	if list {
		body = m.listBody(width, rows)
	} else {
		body = wrapLines(body, width)
		if len(body) > rows && rows > 1 {
			rows--
			offset := min(m.offset, max(0, len(body)-rows))
			end := min(len(body), offset+rows)
			status := uiLine{fit(fmt.Sprintf("[%d–%d/%d · up/down]", offset+1, end, len(body)), width), "focus"}
			body = append(body[offset:end], status)
		} else {
			offset := min(m.offset, max(0, len(body)-rows))
			body = body[offset:min(len(body), offset+rows)]
		}
	}
	out := []string{m.paint(uiLine{fit(header.text, width), header.tone})}
	for _, l := range body {
		out = append(out, m.paint(l))
	}
	for len(out) < height-len(footer) {
		out = append(out, "")
	}
	for _, l := range footer {
		out = append(out, m.paint(l))
	}
	return strings.Join(out, "\n")
}

func (m Model) listBody(width, rows int) []uiLine {
	ts := m.visible()
	if len(ts) == 0 {
		lines := wrapLines([]uiLine{{"No matching targets.", ""}}, width)
		return lines[:min(rows, len(lines))]
	}
	cursor := min(m.cursor, len(ts)-1)
	var detail []uiLine
	if rows >= 7 {
		detail = wrapLines(append([]uiLine{{"FOCUSED · d: full details / commands", "focus"}}, textLines(m.previewLines(ts[cursor:cursor+1]))...), width)
		budget := min(5, rows/2)
		if len(detail) > budget {
			detail = append(detail[:budget-1], uiLine{"… d: full details / commands", "focus"})
		}
	}
	listRows := max(0, rows-len(detail))
	var body []uiLine
	if width >= 40 && listRows > 1 {
		kindWidth := 12
		if width < 65 {
			kindWidth = 5
		}
		body = append(body, uiLine{fit(fmt.Sprintf("     %10s %-*s %s", "SIZE", kindWidth, "TYPE", "PROJECT / PATH"), width), ""})
		listRows--
	}
	start := max(0, cursor-listRows+1)
	for i := start; i < len(ts) && i < start+listRows; i++ {
		body = append(body, m.targetRow(ts[i], i == cursor, width))
	}
	return append(body, detail...)
}
