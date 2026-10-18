package devclean

import (
	"context"
	"os"
	"strings"
	"time"
	"unicode"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/muesli/termenv"
)

type scanMsg struct{ Snapshot Snapshot }
type resultMsg struct{ Result Result }
type spinMsg struct{ generation int }

type Model struct {
	engine                        Engine
	parent, ctx                   context.Context
	cancel                        context.CancelFunc
	snapshot                      Snapshot
	selected                      map[string]bool
	stage, filter, input          string
	filtering, preview, quitting  bool
	cursor, width, height, offset int
	queue                         []Target
	confirmation                  Confirmation
	results                       []Result
	color, details                bool
	frame, generation             int
}

func NewModel(ctx context.Context, e Engine) Model {
	work, cancel := context.WithCancel(ctx)
	_, noColor := os.LookupEnv("NO_COLOR")
	color := !noColor && os.Getenv("TERM") != "dumb" && lipgloss.ColorProfile() != termenv.Ascii
	return Model{engine: e, parent: ctx, ctx: work, cancel: cancel, selected: map[string]bool{}, stage: "scan", width: 80, height: 24, color: color}
}

func (m Model) Init() tea.Cmd { return tea.Batch(m.scan(), m.tick()) }
func (m Model) tick() tea.Cmd {
	generation := m.generation
	return tea.Tick(100*time.Millisecond, func(time.Time) tea.Msg { return spinMsg{generation} })
}
func (m Model) scan() tea.Cmd { return func() tea.Msg { return scanMsg{m.engine.Scan(m.ctx)} } }
func (m Model) clean() tea.Cmd {
	t := m.queue[len(m.results)]
	return func() tea.Msg { return resultMsg{m.engine.CleanOne(m.ctx, t, m.snapshot, m.confirmation, m.input)} }
}
func (m Model) visible() []Target {
	var ts []Target
	for _, t := range m.snapshot.Targets {
		if strings.Contains(strings.ToLower(t.Label()+" "+t.Detail), strings.ToLower(m.filter)) {
			ts = append(ts, t)
		}
	}
	return ts
}
func (m Model) selection() []Target {
	var ts []Target
	for _, t := range m.snapshot.Targets {
		if m.selected[t.ID] {
			ts = append(ts, t)
		}
	}
	return ts
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case spinMsg:
		if m.stage == "scan" && !m.quitting && msg.generation == m.generation {
			m.frame++
			return m, m.tick()
		}
	case tea.WindowSizeMsg:
		m.width, m.height = msg.Width, msg.Height
	case scanMsg:
		m.snapshot = msg.Snapshot
		m.stage = "select"
		m.cursor = 0
		if m.quitting {
			return m, tea.Quit
		}
	case resultMsg:
		m.results = append(m.results, msg.Result)
		if m.quitting {
			return m, tea.Quit
		}
		if len(m.results) < len(m.queue) && m.ctx.Err() == nil {
			return m, m.clean()
		}
		m.stage = "results"
		m.offset = 0
	case tea.KeyMsg:
		key := msg.String()
		if msg.Type == tea.KeySpace {
			key = "space"
		}
		if key == "ctrl+c" || (key == "q" && !m.filtering && m.stage != "confirm") {
			m.cancel()
			if m.stage == "scan" || m.stage == "clean" {
				m.quitting = true
				return m, nil
			}
			return m, tea.Quit
		}
		if m.stage == "scan" || m.stage == "clean" {
			return m, nil
		}
		if m.stage == "confirm" {
			switch key {
			case "esc":
				m.stage = "select"
				m.input = ""
				m.offset = 0
			case "enter":
				_, reviewRows := m.confirmationLayout()
				if reviewRows > 0 && m.confirmation.Accept(m.input) {
					m.stage = "clean"
					m.results = nil
					return m, m.clean()
				}
			case "backspace":
				m.input = dropLast(m.input)
			case "up":
				if m.offset > 0 {
					m.offset--
				}
			case "down":
				m.offset++
			default:
				if msg.Type == tea.KeyRunes {
					m.input += string(msg.Runes)
				} else if key == "space" {
					m.input += " "
				}
			}
			return m, nil
		}
		if m.filtering {
			switch key {
			case "esc", "enter":
				m.filtering = false
			case "backspace":
				m.filter = dropLast(m.filter)
			default:
				if msg.Type == tea.KeyRunes {
					m.filter += string(msg.Runes)
				} else if key == "space" {
					m.filter += " "
				}
			}
			m.cursor = 0
			return m, nil
		}
		if key == "r" {
			m.cancel()
			m.ctx, m.cancel = context.WithCancel(m.parent)
			m.stage = "scan"
			m.selected = map[string]bool{}
			m.results = nil
			m.filter = ""
			m.preview = false
			m.details = false
			m.offset = 0
			m.frame = 0
			m.generation++
			return m, tea.Batch(m.scan(), m.tick())
		}
		if m.stage == "warnings" || m.stage == "help" {
			if key == "esc" || (key == "w" && m.stage == "warnings") || key == "?" {
				m.stage = "select"
				m.offset = 0
			}
			if key == "up" && m.offset > 0 {
				m.offset--
			}
			if key == "down" {
				m.offset++
			}
			return m, nil
		}
		if m.stage == "results" {
			if key == "up" && m.offset > 0 {
				m.offset--
			}
			if key == "down" {
				m.offset++
			}
			return m, nil
		}
		ts := m.visible()
		switch key {
		case "?":
			m.stage = "help"
			m.offset = 0
		case "w":
			m.stage = "warnings"
			m.offset = 0
		case "/":
			m.filtering = true
		case "p":
			m.preview = !m.preview
			m.details = false
			m.offset = 0
		case "d":
			m.details = !m.details
			m.preview = false
			m.offset = 0
		case "up", "k":
			if m.preview || m.details {
				if m.offset > 0 {
					m.offset--
				}
			} else if m.cursor > 0 {
				m.cursor--
			}
		case "down", "j":
			if m.preview || m.details {
				m.offset++
			} else if m.cursor+1 < len(ts) {
				m.cursor++
			}
		case "pgdown":
			m.cursor = min(m.cursor+10, max(0, len(ts)-1))
		case "pgup":
			m.cursor = max(0, m.cursor-10)
		case "space":
			if len(ts) > 0 {
				t := ts[m.cursor]
				m.selected[t.ID] = !m.selected[t.ID]
			}
		case "a":
			for _, t := range ts {
				m.selected[t.ID] = true
			}
		case "n":
			m.selected = map[string]bool{}
		case "enter":
			m.queue = m.selection()
			m.confirmation = Confirm(m.queue)
			if len(m.queue) > 0 {
				m.stage = "confirm"
				m.input = ""
				m.offset = 0
			}
		}
	}
	return m, nil
}

func dropLast(s string) string {
	rs := []rune(s)
	if len(rs) == 0 {
		return s
	}
	return string(rs[:len(rs)-1])
}

func safeText(s string) string {
	// Do not let paths, daemon metadata or subprocess errors inject terminal escapes.
	return strings.Map(func(r rune) rune {
		if unicode.IsControl(r) || unicode.Is(unicode.Cf, r) {
			return ' '
		}
		return r
	}, s)
}

func (m Model) previewLines(ts []Target) []string {
	var lines []string
	for _, t := range ts {
		lines = append(lines, t.Label())
		if t.Detail != "" {
			lines = append(lines, "  "+t.Detail)
		}
		for _, c := range t.Commands() {
			lines = append(lines, "  "+c.String())
		}
	}
	return lines
}
