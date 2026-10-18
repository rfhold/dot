package devclean

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

func TestCommandArgv(t *testing.T) {
	manifest := "/workspace with spaces/Cargo.toml"
	target := "/cache with spaces;$HOME"
	for _, tc := range []struct {
		kind Kind
		want Command
	}{
		{Cargo, Command{Name: "cargo", Args: []string{"clean", "--manifest-path", manifest, "--target-dir", target}, Dir: "/workspace with spaces"}},
		{PNPM, Command{Name: "pnpm", Args: []string{"store", "prune"}}},
		{Bun, Command{Name: "bun", Args: []string{"pm", "cache", "rm"}}},
		{GoCache, Command{Name: "go", Args: []string{"clean", "-cache"}}},
	} {
		t.Run(string(tc.kind), func(t *testing.T) {
			got := (Target{Kind: tc.kind, Manifest: manifest, Path: target}).Commands()
			if !reflect.DeepEqual(got, []Command{tc.want}) {
				t.Fatalf("got %#v, want %#v", got, tc.want)
			}
		})
	}
}

func TestScanProtectsNestedProjectsAndLateWorkspaceRoots(t *testing.T) {
	for _, late := range []bool{false, true} {
		t.Run(map[bool]string{false: "javascript", true: "metadata-workspace"}[late], func(t *testing.T) {
			home := fixture(t)
			repo := filepath.Join(home, "repos", "repo")
			cache := filepath.Join(home, "cache")
			file(t, filepath.Join(repo, "Cargo.toml"), "[workspace]")
			file(t, filepath.Join(cache, "nested", "package.json"), "{}")
			var roots []string
			if !late {
				roots = []string{cache}
			} else {
				file(t, filepath.Join(repo, "second", "Cargo.toml"), "[workspace]")
			}
			r := &fakeRunner{fn: func(c Command) ([]byte, error) {
				if c.Name == "cargo" {
					workspace := repo
					if c.Dir == filepath.Join(repo, "second") {
						workspace = filepath.Join(cache, "nested")
					}
					return json.Marshal(cargoMetadata{WorkspaceRoot: workspace, TargetDirectory: cache})
				}
				return nil, errors.New("unavailable")
			}}
			s := (Engine{Config: Config{Home: home, Repo: repo, Roots: roots}, Runner: r}).Scan(context.Background())
			if len(s.Targets) != 0 {
				t.Fatalf("target contains protected project: %+v", s.Targets)
			}
			if !strings.Contains(strings.Join(s.Warnings, "\n"), "protected directory") {
				t.Fatalf("missing guard warning: %v", s.Warnings)
			}
		})
	}
}

func TestScanNeverCleansAndRefreshFindsNewTargets(t *testing.T) {
	home := fixture(t)
	target := nodeTarget(t, home)
	r := &fakeRunner{}
	m := NewModel(context.Background(), Engine{Config: Config{Home: home, Repo: filepath.Dir(target.Path)}, Runner: r})
	defer func() { m.cancel() }()
	if len(r.calls) != 0 {
		t.Fatal("model construction ran commands synchronously")
	}
	next, _ := m.Update(m.scan()())
	m = next.(Model)
	if len(m.snapshot.Targets) != 1 || len(m.selection()) != 0 {
		t.Fatalf("initial scan: %+v", m.snapshot)
	}
	m, _ = key(m, "a")
	second := filepath.Join(filepath.Dir(target.Path), "packages", "new", "node_modules")
	file(t, filepath.Join(second, "data"), "1234")
	m, cmd := key(m, "r")
	if cmd == nil || len(m.selection()) != 0 {
		t.Fatal("refresh failed to clear selection")
	}
	batch, ok := cmd().(tea.BatchMsg)
	if !ok || len(batch) != 2 {
		t.Fatal("refresh must schedule scan and animation")
	}
	next, _ = m.Update(batch[0]())
	m = next.(Model)
	if len(m.snapshot.Targets) != 2 || len(m.selection()) != 0 {
		t.Fatalf("refreshed scan: %+v", m.snapshot)
	}
	for _, c := range r.calls {
		if strings.Contains(strings.Join(c.Args, " "), "prune") || strings.Contains(strings.Join(c.Args, " "), "clean") {
			t.Fatalf("scan issued cleanup: %+v", c)
		}
	}
	if _, err := os.Stat(filepath.Join(target.Path, "dependency", "index.js")); err != nil {
		t.Fatal("scan removed fixture", err)
	}
}

func TestTUIContinuesAfterFailureAndReportsUnknownRecovery(t *testing.T) {
	home := fixture(t)
	target := nodeTarget(t, home)
	first := Target{ID: "unavailable", Kind: GoCache, Path: filepath.Join(home, "missing")}
	m := NewModel(context.Background(), Engine{Config: Config{Home: home}, Runner: &fakeRunner{}})
	defer m.cancel()
	m.stage = "clean"
	m.queue = []Target{first, target}
	m.confirmation = Confirm(m.queue)
	m.input = "CLEAN"
	next, cmd := m.Update(m.clean()())
	m = next.(Model)
	if cmd == nil || len(m.results) != 1 || m.results[0].Err == nil {
		t.Fatal("failed target prevented subsequent cleanup")
	}
	next, cmd = m.Update(cmd())
	m = next.(Model)
	if cmd != nil || m.stage != "results" || m.results[1].Err != nil {
		t.Fatalf("results: %+v", m.results)
	}
	view := m.View()
	if !strings.Contains(view, "ERROR") || !strings.Contains(view, "recovered space unknown") || !strings.Contains(view, "9 B") {
		t.Fatal(view)
	}
}

func TestCleanRejectsTargetReplacedBySymlink(t *testing.T) {
	home := fixture(t)
	target := nodeTarget(t, home)
	outside := filepath.Join(home, "keep")
	file(t, filepath.Join(outside, "data"), "keep this")
	if err := os.Rename(target.Path, target.Path+".old"); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, target.Path); err != nil {
		t.Fatal(err)
	}
	r := &fakeRunner{}
	result := (Engine{Config: Config{Home: home}, Runner: r}).CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "CLEAN")
	if result.Err == nil || !strings.Contains(result.Err.Error(), "symlink") || len(r.calls) != 0 {
		t.Fatalf("symlink replacement accepted: %+v", result)
	}
	if data, err := os.ReadFile(filepath.Join(outside, "data")); err != nil || string(data) != "keep this" {
		t.Fatalf("symlink destination changed: %q, %v", data, err)
	}
}
