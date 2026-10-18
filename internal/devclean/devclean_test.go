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
	"time"

	tea "github.com/charmbracelet/bubbletea"
)

type fakeRunner struct {
	calls []Command
	fn    func(Command) ([]byte, error)
}

func (f *fakeRunner) Run(_ context.Context, c Command) ([]byte, error) {
	f.calls = append(f.calls, c)
	if f.fn != nil {
		return f.fn(c)
	}
	return nil, errors.New("tool unavailable")
}
func fixture(t *testing.T) string {
	t.Helper()
	p, err := filepath.EvalSymlinks(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	return p
}
func file(t *testing.T, p, text string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(p), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(p, []byte(text), 0644); err != nil {
		t.Fatal(err)
	}
}
func nodeTarget(t *testing.T, home string) Target {
	t.Helper()
	p := filepath.Join(home, "repos", "project", "node_modules")
	file(t, filepath.Join(p, "dependency", "index.js"), "123456789")
	st, err := os.Stat(p)
	if err != nil {
		t.Fatal(err)
	}
	return Target{ID: "node:" + p, Kind: Node, Path: p, Identity: st, Known: true, Bytes: 9}
}

func TestSafePath(t *testing.T) {
	home := fixture(t)
	target := nodeTarget(t, home)
	repo := filepath.Dir(target.Path)
	for _, p := range []string{"/", home, repo, filepath.Join(repo, ".."), "relative/node_modules"} {
		if SafePath(p, home, []string{repo}, true) == nil {
			t.Errorf("accepted %q", p)
		}
	}
	if err := SafePath(target.Path, home, []string{repo}, true); err != nil {
		t.Fatal(err)
	}
	alias := filepath.Join(home, "alias")
	if err := os.Symlink(repo, alias); err != nil {
		t.Fatal(err)
	}
	if SafePath(filepath.Join(alias, "node_modules"), home, nil, true) == nil {
		t.Fatal("symlink ancestor accepted")
	}
	if SafePath(target.Path, home, []string{filepath.Join(target.Path, "protected-repo")}, true) == nil {
		t.Fatal("protected descendant accepted")
	}
}

func TestScanNestedWorktreesDedup(t *testing.T) {
	home := fixture(t)
	repo := filepath.Join(home, "repos", "owner", "repo")
	external := filepath.Join(home, "external-worktree")
	file(t, filepath.Join(repo, ".git", "HEAD"), "ref: main")
	file(t, filepath.Join(external, ".git"), "gitdir: somewhere")
	file(t, filepath.Join(repo, "Cargo.toml"), "[workspace]")
	file(t, filepath.Join(repo, "nested", "Cargo.toml"), "[package]")
	file(t, filepath.Join(repo, "packages", "js", "node_modules", "x"), "123")
	file(t, filepath.Join(repo, "target", "ignored", "node_modules", "x"), "ignore")
	file(t, filepath.Join(repo, ".worktrees", "unregistered", "node_modules", "x"), "ignore")
	file(t, filepath.Join(external, "nested", "node_modules", "x"), "123456")
	target := filepath.Join(home, "shared-target")
	file(t, filepath.Join(target, "debug", "data"), "1234567890")
	var metadataCalls int
	r := &fakeRunner{fn: func(c Command) ([]byte, error) {
		if c.Name == "git" {
			return []byte("worktree " + repo + "\x00HEAD abc\x00\x00worktree " + external + "\x00HEAD def\x00\x00"), nil
		}
		if c.Name == "cargo" {
			metadataCalls++
			if !strings.Contains(strings.Join(c.Args, " "), "--offline --locked --no-deps") {
				t.Fatal(c.Args)
			}
			return json.Marshal(cargoMetadata{WorkspaceRoot: repo, TargetDirectory: target})
		}
		return nil, errors.New("missing " + c.Name)
	}}
	e := Engine{Config: Config{Home: home, Repo: repo, Roots: []string{repo}}, Runner: r}
	s := e.Scan(context.Background())
	if len(s.Targets) != 3 {
		t.Fatalf("targets: %#v; warnings: %v", s.Targets, s.Warnings)
	}
	if metadataCalls != 2 {
		t.Fatalf("nested metadata calls=%d", metadataCalls)
	}
	if s.Targets[0].Kind != Cargo || s.Targets[0].Path != target {
		t.Fatalf("sort/dedup: %v", s.Targets)
	}
	if len(s.Warnings) < 4 {
		t.Fatalf("missing tool warnings: %v", s.Warnings)
	}
}

func TestScanSymlinksAndOverlaps(t *testing.T) {
	home := fixture(t)
	repo := filepath.Join(home, "repos", "repo")
	n := filepath.Join(repo, "node_modules")
	file(t, filepath.Join(n, "x"), "content")
	file(t, filepath.Join(repo, "Cargo.toml"), "[package]")
	outside := filepath.Join(home, "outside")
	file(t, filepath.Join(outside, "node_modules", "x"), "no")
	if err := os.Symlink(outside, filepath.Join(repo, "alias")); err != nil {
		t.Fatal(err)
	}
	r := &fakeRunner{fn: func(c Command) ([]byte, error) {
		if c.Name == "cargo" {
			return json.Marshal(cargoMetadata{WorkspaceRoot: repo, TargetDirectory: n})
		}
		return nil, errors.New("absent")
	}}
	s := (Engine{Config: Config{Home: home, Repo: repo}, Runner: r}).Scan(context.Background())
	if len(s.Targets) != 1 {
		t.Fatalf("overlap or symlink target: %v", s.Targets)
	}
}

func TestBareRepositoryExternalWorktree(t *testing.T) {
	home := fixture(t)
	bare := filepath.Join(home, "repos", "bare.git")
	external := filepath.Join(home, "worktree")
	file(t, filepath.Join(bare, "HEAD"), "ref: refs/heads/main")
	file(t, filepath.Join(bare, "config"), "[core]\n bare = true")
	for _, name := range []string{"objects", "refs"} {
		if err := os.MkdirAll(filepath.Join(bare, name), 0755); err != nil {
			t.Fatal(err)
		}
	}
	file(t, filepath.Join(external, "node_modules", "x"), "1234")
	r := &fakeRunner{fn: func(c Command) ([]byte, error) {
		if c.Name == "git" {
			return []byte("worktree " + bare + "\x00bare\x00\x00worktree " + external + "\x00HEAD abc\x00\x00"), nil
		}
		return nil, errors.New("absent")
	}}
	s := (Engine{Config: Config{Home: home, Repo: bare}, Runner: r}).Scan(context.Background())
	if len(s.Targets) != 1 || s.Targets[0].Path != filepath.Join(external, "node_modules") {
		t.Fatalf("%+v", s.Targets)
	}
}

func TestCleanConfirmationAndNodeRecovery(t *testing.T) {
	home := fixture(t)
	target := nodeTarget(t, home)
	r := &fakeRunner{}
	e := Engine{Config: Config{Home: home}, Runner: r}
	s := Snapshot{Protected: []string{filepath.Dir(target.Path)}}
	for _, phrase := range []string{"", "clean", "CLEAN "} {
		result := e.CleanOne(context.Background(), target, s, Confirm([]Target{target}), phrase)
		if result.Err == nil {
			t.Fatal("unconfirmed cleanup")
		}
		if _, err := os.Stat(target.Path); err != nil {
			t.Fatal(err)
		}
	}
	outside := filepath.Join(home, "keep")
	file(t, filepath.Join(outside, "keep.txt"), "safe")
	if err := os.Symlink(outside, filepath.Join(target.Path, "link")); err != nil {
		t.Fatal(err)
	}
	result := e.CleanOne(context.Background(), target, s, Confirm([]Target{target}), "CLEAN")
	if result.Err != nil || !result.Known || result.Recovered != 9 {
		t.Fatalf("result: %+v", result)
	}
	if _, err := os.Stat(filepath.Join(outside, "keep.txt")); err != nil {
		t.Fatal("followed child symlink")
	}
	if len(r.calls) != 0 {
		t.Fatal("node cleanup invoked external command")
	}
}

func TestRevalidateTargetAndCancellation(t *testing.T) {
	home := fixture(t)
	target := nodeTarget(t, home)
	saved := target.Path + ".old"
	if err := os.Rename(target.Path, saved); err != nil {
		t.Fatal(err)
	}
	file(t, filepath.Join(target.Path, "new"), "do not remove")
	e := Engine{Config: Config{Home: home}, Runner: &fakeRunner{}}
	result := e.CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "CLEAN")
	if result.Err == nil || !strings.Contains(result.Err.Error(), "identity changed") {
		t.Fatalf("%+v", result)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	result = e.CleanOne(ctx, target, Snapshot{}, Confirm([]Target{target}), "CLEAN")
	if !errors.Is(result.Err, context.Canceled) {
		t.Fatal(result.Err)
	}
}

func TestNativeCommandsAndFailure(t *testing.T) {
	home := fixture(t)
	path := filepath.Join(home, "cache space;$x")
	file(t, filepath.Join(path, "x"), "data")
	st, _ := os.Stat(path)
	for _, kind := range []Kind{PNPM, Bun, GoCache, Cargo} {
		t.Run(string(kind), func(t *testing.T) {
			target := Target{Kind: kind, Path: path, Identity: st, Manifest: filepath.Join(home, "Cargo.toml"), WorkspaceRoot: home}
			var cleanCommand Command
			r := &fakeRunner{fn: func(c Command) ([]byte, error) {
				joined := strings.Join(c.Args, " ")
				if c.Name == "cargo" && c.Args[0] == "metadata" {
					return json.Marshal(cargoMetadata{WorkspaceRoot: home, TargetDirectory: path})
				}
				if joined == "store path" || joined == "pm cache" || joined == "env GOCACHE" {
					return []byte(path + "\n"), nil
				}
				cleanCommand = c
				return nil, errors.New("deliberate cleanup failure")
			}}
			e := Engine{Config: Config{Home: home}, Runner: r}
			result := e.CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "CLEAN")
			if result.Err == nil || !strings.Contains(result.Err.Error(), "deliberate") {
				t.Fatalf("%+v", result)
			}
			if !reflect.DeepEqual(cleanCommand, target.Commands()[0]) {
				t.Fatalf("command: %+v", cleanCommand)
			}
			if cleanCommand.Name == "sh" || strings.Contains(strings.Join(cleanCommand.Args, " "), "-modcache") {
				t.Fatal(cleanCommand)
			}
		})
	}
}

func TestCargoAndCacheScopeChangesAndSuccess(t *testing.T) {
	home := fixture(t)
	path := filepath.Join(home, "cache")
	file(t, filepath.Join(path, "x"), "123456")
	st, _ := os.Stat(path)
	target := Target{Kind: GoCache, Path: path, Identity: st}
	changed := true
	cleanCalls := 0
	r := &fakeRunner{fn: func(c Command) ([]byte, error) {
		if c.Args[0] == "env" {
			if changed {
				return []byte(path + "-other"), nil
			}
			return []byte(path), nil
		}
		cleanCalls++
		return nil, os.Remove(filepath.Join(path, "x"))
	}}
	e := Engine{Config: Config{Home: home}, Runner: r}
	result := e.CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "CLEAN")
	if result.Err == nil || cleanCalls != 0 {
		t.Fatal("changed cache scope accepted")
	}
	changed = false
	result = e.CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "CLEAN")
	if result.Err != nil || !result.Known || result.Recovered != 6 || cleanCalls != 1 {
		t.Fatalf("%+v", result)
	}
	target.Kind = Cargo
	target.Manifest = filepath.Join(home, "workspace", "Cargo.toml")
	target.WorkspaceRoot = filepath.Dir(target.Manifest)
	r.fn = func(c Command) ([]byte, error) {
		if c.Args[0] != "metadata" {
			t.Fatal("clean after changed cargo scope")
		}
		return json.Marshal(cargoMetadata{WorkspaceRoot: filepath.Dir(target.Manifest), TargetDirectory: path + "-other"})
	}
	if e.CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "CLEAN").Err == nil {
		t.Fatal("changed cargo scope accepted")
	}
}

func TestDockerNoCleanupWithoutConfirmationAndDaemonFailure(t *testing.T) {
	p := DockerPin{HostOverride: true, Endpoint: "unix:///test.sock"}
	target := Target{Kind: Docker, Docker: &p}
	r := &fakeRunner{}
	e := Engine{Runner: r}
	result := e.CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "CLEAN")
	if result.Err == nil || len(r.calls) != 0 {
		t.Fatal("unconfirmed Docker command")
	}
	result = e.CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "DELETE DOCKER DATA")
	if result.Err == nil || len(r.calls) != 1 {
		t.Fatalf("Docker failure: %+v, %v", result, r.calls)
	}
}

func TestDockerPinAndNamedVolumeCleanup(t *testing.T) {
	t.Setenv("DOCKER_CONTEXT", "")
	t.Setenv("DOCKER_HOST", "")
	inspect := `[{"Name":"test","Endpoints":{"docker":{"Host":"unix:///test.sock","SkipTLSVerify":false}}}]`
	r := &fakeRunner{fn: func(c Command) ([]byte, error) {
		if reflect.DeepEqual(c.Args, []string{"context", "show"}) {
			return []byte("test\n"), nil
		}
		if reflect.DeepEqual(c.Args, []string{"context", "inspect", "test"}) {
			return []byte(inspect), nil
		}
		if len(c.Args) < 3 || c.Args[0] != "--context" || c.Args[1] != "test" {
			t.Fatalf("unpinned: %+v", c)
		}
		args := strings.Join(c.Args[2:], " ")
		if args == "volume ls --quiet --filter dangling=true" {
			return []byte("named-database\nanonymous-id\nin-use\n"), nil
		}
		if strings.Contains(args, "volume=in-use") {
			return []byte("running-container"), nil
		}
		return nil, nil
	}}
	p, err := CaptureDocker(context.Background(), r, os.Getenv)
	if err != nil {
		t.Fatal(err)
	}
	target := Target{Kind: Docker, Docker: &p}
	c := Confirm([]Target{target})
	if c.Accept("CLEAN") || !c.Accept("DELETE DOCKER DATA") {
		t.Fatal(c)
	}
	if err := p.Clean(context.Background(), r); err != nil {
		t.Fatal(err)
	}
	removed := []string{}
	var pruneCommands [][]string
	for _, cmd := range r.calls {
		if len(cmd.Args) > 3 && cmd.Args[3] == "prune" {
			pruneCommands = append(pruneCommands, cmd.Args[2:])
		}
		if len(cmd.Args) > 4 && cmd.Args[2] == "volume" && cmd.Args[3] == "rm" {
			if cmd.Args[4] != "--" {
				t.Fatalf("volume removal must not force deletion: %+v", cmd)
			}
			removed = append(removed, cmd.Args[len(cmd.Args)-1])
		}
	}
	if !reflect.DeepEqual(pruneCommands, [][]string{{"container", "prune", "--force"}, {"image", "prune", "--all", "--force"}, {"builder", "prune", "--all", "--force"}}) {
		t.Fatalf("unexpected Docker prune scopes: %v", pruneCommands)
	}
	if !reflect.DeepEqual(removed, []string{"named-database", "anonymous-id"}) {
		t.Fatal(removed)
	}
	inspect = strings.ReplaceAll(inspect, "test.sock", "other.sock")
	before := len(r.calls)
	if p.Clean(context.Background(), r) == nil {
		t.Fatal("changed context accepted")
	}
	if len(r.calls) != before+1 {
		t.Fatal("destructive command after context change")
	}
}

func TestDockerHostOverride(t *testing.T) {
	env := map[string]string{"DOCKER_HOST": "tcp://dangerous.example:2376", "DOCKER_TLS_VERIFY": "1", "DOCKER_CERT_PATH": "/cert path"}
	r := &fakeRunner{}
	p, err := CaptureDocker(context.Background(), r, func(k string) string { return env[k] })
	if err != nil || !p.HostOverride || len(r.calls) != 0 {
		t.Fatalf("pin: %+v %v", p, err)
	}
	if !strings.Contains(p.Label(), env["DOCKER_HOST"]) || !strings.Contains(p.Label(), "TLS_VERIFY=1") {
		t.Fatal(p.Label())
	}
	if !reflect.DeepEqual(p.Command("info").Args, []string{"--host", env["DOCKER_HOST"], "info"}) {
		t.Fatal(p.Command("info"))
	}
	env["DOCKER_CONTEXT"] = "override"
	if _, err := CaptureDocker(context.Background(), r, func(k string) string { return env[k] }); err == nil {
		t.Fatal("explicit context did not take precedence")
	}
}

func key(m Model, k string) (Model, tea.Cmd) {
	var msg tea.KeyMsg
	switch k {
	case "enter":
		msg.Type = tea.KeyEnter
	case "space":
		msg.Type = tea.KeySpace
	case "esc":
		msg.Type = tea.KeyEsc
	default:
		msg.Type = tea.KeyRunes
		msg.Runes = []rune(k)
	}
	next, cmd := m.Update(msg)
	return next.(Model), cmd
}
func TestTUISelectionConfirmationRefreshResults(t *testing.T) {
	home := fixture(t)
	target := nodeTarget(t, home)
	m := NewModel(context.Background(), Engine{Config: Config{Home: home}, Runner: &fakeRunner{}})
	defer m.cancel()
	updated, _ := m.Update(scanMsg{Snapshot{Targets: []Target{target}}})
	m = updated.(Model)
	if len(m.selection()) != 0 {
		t.Fatal("initial selection not empty")
	}
	m, _ = key(m, "enter")
	if m.stage != "select" {
		t.Fatal("empty confirm")
	}
	m, _ = key(m, "space")
	m, _ = key(m, "p")
	if !strings.Contains(m.View(), "remove directory") {
		t.Fatal(m.View())
	}
	m, _ = key(m, "enter")
	m, cmd := key(m, "enter")
	if cmd != nil || m.stage != "confirm" {
		t.Fatal("confirmation bypass")
	}
	m, _ = key(m, "CLEAN")
	m, cmd = key(m, "enter")
	if cmd == nil || m.stage != "clean" {
		t.Fatal("no cleanup cmd")
	}
	updated, _ = m.Update(cmd())
	m = updated.(Model)
	if m.stage != "results" || len(m.results) != 1 || m.results[0].Err != nil {
		t.Fatalf("%+v", m.results)
	}
	if !strings.Contains(m.View(), "9 B") {
		t.Fatal(m.View())
	}
	m, cmd = key(m, "r")
	if m.stage != "scan" || len(m.selection()) != 0 || cmd == nil {
		t.Fatal("refresh did not reset")
	}
}

func TestTUIFilterViewportDockerAndFailure(t *testing.T) {
	m := NewModel(context.Background(), Engine{})
	defer m.cancel()
	p := DockerPin{Context: "danger", Endpoint: "tcp://host:2375"}
	m.snapshot.Targets = []Target{{ID: "docker", Kind: Docker, Docker: &p, Detail: p.Label()}, {ID: "node", Kind: Node, Path: "/long/path/node_modules"}}
	m.stage = "select"
	m.width = 35
	m.height = 16
	m, _ = key(m, "/")
	m, _ = key(m, "docker")
	m, _ = key(m, "enter")
	m, _ = key(m, "a")
	if len(m.selection()) != 1 || m.selection()[0].Kind != Docker {
		t.Fatal("filter selection")
	}
	m, _ = key(m, "enter")
	view := m.View()
	if !strings.Contains(view, "DOCKER DATA LOSS") {
		t.Fatal(view)
	}
	m, _ = key(m, "CLEAN")
	m, cmd := key(m, "enter")
	if cmd != nil {
		t.Fatal("Docker weak confirmation")
	}
	m.stage = "clean"
	updated, _ := m.Update(resultMsg{Result{Target: m.queue[0], Err: errors.New("daemon unavailable")}})
	m = updated.(Model)
	if !strings.Contains(m.View(), "daemon unavailable") {
		t.Fatal(m.View())
	}
	for _, line := range strings.Split(m.View(), "\n") {
		if len([]rune(line)) > m.width {
			t.Fatalf("oversized line %q", line)
		}
	}
	if strings.Contains(safeText("hello\x1b[31m\n"), "\x1b") {
		t.Fatal("terminal escape preserved")
	}
}

func TestTUILongListWarningsAndCancellation(t *testing.T) {
	m := NewModel(context.Background(), Engine{})
	defer m.cancel()
	m.stage = "select"
	m.height = 15
	for i := 0; i < 100; i++ {
		m.snapshot.Targets = append(m.snapshot.Targets, Target{ID: Size(int64(i)), Kind: Node, Path: "/project/" + Size(int64(i)) + "/node_modules"})
	}
	for i := 0; i < 99; i++ {
		next, _ := m.Update(tea.KeyMsg{Type: tea.KeyDown})
		m = next.(Model)
	}
	m, _ = key(m, "space")
	if len(m.selection()) != 1 || m.cursor != 99 || !strings.Contains(m.View(), "99 B") {
		t.Fatal("long-list navigation failed")
	}
	m.snapshot.Warnings = []string{"first warning", "second warning"}
	m, _ = key(m, "w")
	if !strings.Contains(m.View(), "second warning") {
		t.Fatal(m.View())
	}
	m, _ = key(m, "esc")
	m.stage = "scan"
	next, cmd := m.Update(tea.KeyMsg{Type: tea.KeyCtrlC})
	m = next.(Model)
	if cmd != nil || !m.quitting || m.ctx.Err() == nil {
		t.Fatal("cancellation did not wait")
	}
	_, cmd = m.Update(scanMsg{})
	if cmd == nil {
		t.Fatal("cancelled scan did not quit after return")
	}
}

func TestExecRunnerCancellation(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	start := time.Now()
	runner := &ExecRunner{Env: os.Environ()}
	_, err := runner.Run(ctx, Command{Name: "sh", Args: []string{"-c", "sleep 20 & wait"}})
	runner.Close()
	if err == nil || time.Since(start) > time.Second {
		t.Fatalf("cancellation: %v", err)
	}
	if _, err := runner.Run(context.Background(), Command{Name: "sleep", Args: []string{"20"}}); !errors.Is(err, context.Canceled) {
		t.Fatal("closed runner allowed a new process")
	}
}
