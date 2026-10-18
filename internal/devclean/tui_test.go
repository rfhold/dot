package devclean

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/x/ansi"
)

func presentationModel(t *testing.T) Model {
	t.Helper()
	m := NewModel(context.Background(), Engine{Config: Config{Home: "/home/test", Repo: "/home/test/repos/dot"}})
	t.Cleanup(m.cancel)
	m.color = false
	m.stage = "select"
	pin := DockerPin{Context: "local", Endpoint: "unix:///var/run/docker.sock"}
	m.snapshot = Snapshot{
		Targets: []Target{
			{ID: "node", Kind: Node, Known: true, Bytes: 4096, Path: "/home/test/repos/dot/packages/example/node_modules", Detail: "remove directory"},
			{ID: "docker", Kind: Docker, Detail: pin.Label(), Docker: &pin},
		},
		Warnings: []string{"private scan failure must not appear in the footer"},
	}
	return m
}

func assertFrame(t *testing.T, m Model) {
	t.Helper()
	view := m.View()
	lines := strings.Split(view, "\n")
	if len(lines) > m.height {
		t.Fatalf("height %d > %d:\n%s", len(lines), m.height, view)
	}
	for _, line := range lines {
		if ansi.StringWidth(line) > m.width {
			t.Fatalf("width %d > %d: %q", ansi.StringWidth(line), m.width, line)
		}
	}
}

func TestPresentationResponsiveFrames(t *testing.T) {
	for _, dimensions := range [][2]int{{120, 40}, {80, 24}, {40, 18}, {35, 16}, {20, 12}, {12, 8}, {1, 1}} {
		for _, stage := range []string{"scan", "select", "confirm", "clean", "results", "warnings", "help"} {
			t.Run(fmt.Sprintf("%dx%d/%s", dimensions[0], dimensions[1], stage), func(t *testing.T) {
				m := presentationModel(t)
				m.width, m.height, m.stage = dimensions[0], dimensions[1], stage
				m.queue = m.snapshot.Targets
				m.confirmation = Confirm(m.queue)
				m.input = strings.Repeat("x", 200)
				m.results = []Result{{Target: m.queue[0], Err: errors.New("unavailable")}}
				assertFrame(t, m)
				m.color = true
				assertFrame(t, m)
			})
		}
	}
}

func TestPresentationDetailsSummaryAndColumns(t *testing.T) {
	m := presentationModel(t)
	m.width, m.height = 120, 30
	m.selected["node"], m.selected["docker"] = true, true
	view := m.View()
	for _, want := range []string{"SIZE", "TYPE", "PROJECT / PATH", "dot/packages/example/node_modules", "FOCUSED", m.snapshot.Targets[0].Path, "remove directory", "2 selected · ~4.0 KiB estimated + 1 unknown", "1 scan warnings"} {
		if !strings.Contains(view, want) {
			t.Fatalf("missing %q:\n%s", want, view)
		}
	}
	if strings.Contains(view, m.snapshot.Warnings[0]) {
		t.Fatal("raw scan warning in selection footer")
	}
	if got := m.shortPath(Target{Path: "/home/test/other/cache"}); got != "~/other/cache" {
		t.Fatal(got)
	}
	m.width = 25
	m, _ = key(m, "d")
	if !m.details || m.preview {
		t.Fatal("details mode not active")
	}
	assertReviewLines(t, m, textLines(m.previewLines(m.snapshot.Targets[:1])))
	m, _ = key(m, "d")
	if m.details {
		t.Fatal("details did not close")
	}
}

func assertReviewLines(t *testing.T, m Model, expected []uiLine) {
	t.Helper()
	var views []string
	for i := 0; i < 300; i++ {
		m.offset = i
		assertFrame(t, m)
		views = append(views, ansi.Strip(m.View()))
	}
	for _, line := range wrapLines(expected, m.width) {
		found := false
		for _, view := range views {
			if strings.Contains(view, line.text) {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("review never exposes %q", line.text)
		}
	}
}

func TestPresentationDockerReviewFullTextAndPinnedControls(t *testing.T) {
	m := presentationModel(t)
	m.width, m.height = 24, 14
	m.queue = m.snapshot.Targets
	m.confirmation = Confirm(m.queue)
	m.stage = "confirm"
	m.input = "DELETE DOCKER DATA"
	expected := textLines(m.previewLines(m.queue))
	expected = append(expected,
		uiLine{text: "Docker destination: " + m.queue[1].Docker.Label()},
		uiLine{text: "Deletes ALL stopped containers, unused images/build cache and unused volumes, INCLUDING NAMED VOLUMES."},
		uiLine{text: "Preserves containers that run and their referenced resources. This can delete databases and local test data."},
	)
	assertReviewLines(t, m, expected)
	for _, offset := range []int{0, 10, 10000} {
		m.offset = offset
		view := m.View()
		controls := wrapLines([]uiLine{{text: "Type DELETE DOCKER DATA"}, {text: "enter run; esc back; up/down scroll"}, {text: "> DELETE DOCKER DATA"}}, m.width)
		for _, control := range controls {
			want := control.text
			if !strings.Contains(view, want) {
				t.Fatalf("missing control %q:\n%s", want, view)
			}
		}
	}
}

func TestPresentationSafeStylesAndNoColor(t *testing.T) {
	m := presentationModel(t)
	unsafe := "untrusted\x1b]52;c;payload\a\x1b[31m\n\r\u009b31m\u202e"
	m.snapshot.Targets[0].Path = unsafe
	m.snapshot.Targets[0].Detail = unsafe
	m.filter = unsafe
	m.color = true
	view := m.View()
	if !strings.Contains(view, "\x1b[") {
		t.Fatal("trusted styling absent")
	}
	for _, bad := range []string{"\x1b]", "\a", "\r", "\u009b", "\u202e", "\x1b[31m"} {
		if strings.Contains(view, bad) {
			t.Fatalf("external control survived: %q", bad)
		}
	}
	m.color = false
	plain := m.View()
	if strings.Contains(plain, "\x1b") || plain != ansi.Strip(view) {
		t.Fatalf("no-color differs from styled text:\n%s", plain)
	}
	t.Setenv("NO_COLOR", "")
	noColor := NewModel(context.Background(), Engine{})
	defer noColor.cancel()
	if noColor.color {
		t.Fatal("NO_COLOR presence must disable color")
	}
	t.Setenv("TERM", "dumb")
	if err := os.Unsetenv("NO_COLOR"); err != nil {
		t.Fatal(err)
	}
	if dumb := NewModel(context.Background(), Engine{}); dumb.color {
		dumb.cancel()
		t.Fatal("dumb terminal has color")
	} else {
		dumb.cancel()
	}
}

func TestPresentationCompactHelpAndEmptyViews(t *testing.T) {
	m := presentationModel(t)
	m.width, m.height = 12, 8
	m.snapshot.Warnings = nil
	if !strings.Contains(m.View(), ">[ ]") || !strings.Contains(m.View(), "?: help") {
		t.Fatal("compact pane must retain a target and help access:\n" + m.View())
	}
	m, _ = key(m, "?")
	if m.stage != "help" {
		t.Fatal("help did not open")
	}
	assertReviewLines(t, m, []uiLine{{text: m.summary()}, {text: "space: toggle target; a: select filtered targets; n: clear selection"}})
	m, _ = key(m, "esc")
	if m.stage != "select" {
		t.Fatal("help did not return to selection")
	}
	m.snapshot.Targets = nil
	assertFrame(t, m)
	m.width, m.height = 80, 24
	if !strings.Contains(m.View(), "No matching targets.") {
		t.Fatal(m.View())
	}
	m, _ = key(m, "p")
	if !strings.Contains(m.View(), "No targets selected.") {
		t.Fatal(m.View())
	}
}

func TestPresentationNormalConfirmationAndProgress(t *testing.T) {
	m := presentationModel(t)
	m.stage, m.width, m.height = "confirm", 20, 12
	m.queue = m.snapshot.Targets[:1]
	m.confirmation = Confirm(m.queue)
	assertReviewLines(t, m, textLines(m.previewLines(m.queue)))
	if !strings.Contains(m.View(), "Type CLEAN") || !strings.Contains(m.View(), "> ") {
		t.Fatal(m.View())
	}
	m.input = strings.Repeat("long pasted text", 200)
	assertFrame(t, m)
	if !strings.Contains(m.View(), "Type CLEAN") {
		t.Fatal("long input hid the exact confirmation phrase")
	}
	m.stage, m.width, m.height = "clean", 100, 24
	m.queue = m.snapshot.Targets
	m.results = []Result{{Target: m.queue[0], Err: errors.New("mock failure")}}
	for _, want := range []string{"1 of 2 completed", "Active 2/2:", "1 failed", "no undo"} {
		if !strings.Contains(m.View(), want) {
			t.Fatalf("missing progress %q:\n%s", want, m.View())
		}
	}
}

func TestConfirmationBlocksUntilReviewFits(t *testing.T) {
	for _, tc := range []struct {
		name          string
		docker        bool
		width, height int
	}{
		{name: "docker20x6", docker: true, width: 20, height: 6},
		{name: "regular20x5", width: 20, height: 5},
	} {
		t.Run(tc.name, func(t *testing.T) {
			m := presentationModel(t)
			runner := &fakeRunner{}
			m.engine.Runner = runner
			m.stage, m.width, m.height = "confirm", tc.width, tc.height
			m.queue = m.snapshot.Targets[:1]
			if tc.docker {
				m.queue = m.snapshot.Targets
			}
			m.confirmation = Confirm(m.queue)
			m.input = m.confirmation.Phrase()
			if _, rows := m.confirmationLayout(); rows != 0 {
				t.Fatalf("expected no review rows, got %d", rows)
			}
			for _, offset := range []int{0, 1, 1000} {
				m.offset = offset
				assertFrame(t, m)
				view := m.View()
				if !strings.Contains(view, "Resize to review") || !strings.Contains(view, "Cleanup blocked.") {
					t.Fatalf("missing resize notice:\n%s", view)
				}
				var cmd tea.Cmd
				m, cmd = key(m, "enter")
				if cmd != nil || m.stage != "confirm" || len(m.results) != 0 || len(runner.calls) != 0 {
					t.Fatal("exact phrase bypassed unavailable review")
				}
			}
			next, _ := m.Update(tea.WindowSizeMsg{Width: 80, Height: 24})
			m = next.(Model)
			if _, rows := m.confirmationLayout(); rows < 1 {
				t.Fatal("resize did not restore review space")
			}
			if !strings.Contains(m.View(), "Type "+m.confirmation.Phrase()) || !strings.Contains(m.View(), "> "+m.input) || strings.Contains(m.View(), "Cleanup blocked.") {
				t.Fatalf("resize did not restore controls:\n%s", m.View())
			}
			assertReviewLines(t, m, textLines(m.previewLines(m.queue)))
			m, cmd := key(m, "enter")
			if cmd == nil || m.stage != "clean" || len(runner.calls) != 0 {
				t.Fatal("adequate resize did not restore normal confirmation")
			}
		})
	}
}

func TestPresentationFilterRefreshAndAnimationLifecycle(t *testing.T) {
	m := presentationModel(t)
	m.stage = "scan"
	batch, ok := m.Init()().(tea.BatchMsg)
	if !ok || len(batch) != 2 {
		t.Fatal("init must schedule scan and tick")
	}
	before := m.View()
	next, cmd := m.Update(spinMsg{m.generation})
	m = next.(Model)
	if cmd == nil || m.frame != 1 || m.View() == before {
		t.Fatal("scan animation did not advance")
	}
	if _, ok := cmd().(spinMsg); !ok {
		t.Fatal("animation command did not emit a tick")
	}
	next, _ = m.Update(scanMsg{m.snapshot})
	m = next.(Model)
	if _, cmd = m.Update(spinMsg{m.generation}); cmd != nil {
		t.Fatal("animation continued after scan")
	}
	m, _ = key(m, "a")
	m, _ = key(m, "/")
	m, _ = key(m, "docker")
	m, _ = key(m, "enter")
	m, _ = key(m, "n")
	m, _ = key(m, "a")
	if len(m.selection()) != 1 || !m.selected["docker"] {
		t.Fatal("filtered selection changed")
	}
	generation := m.generation
	m, cmd = key(m, "r")
	if cmd == nil || len(m.selection()) != 0 || m.filter != "" || m.stage != "scan" {
		t.Fatal("refresh safety changed")
	}
	if _, cmd = m.Update(spinMsg{generation}); cmd != nil {
		t.Fatal("stale animation survived refresh")
	}
	m, _ = key(m, "ctrl+c")
	if _, cmd = m.Update(spinMsg{m.generation}); cmd != nil {
		t.Fatal("cancelled animation continued")
	}
}
