package devclean

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
)

type Command struct {
	Name string
	Args []string
	Dir  string
}

func (c Command) String() string {
	parts := []string{fmt.Sprintf("%q", c.Name)}
	for _, arg := range c.Args {
		parts = append(parts, fmt.Sprintf("%q", arg))
	}
	s := strings.Join(parts, " ")
	if c.Dir != "" {
		s = fmt.Sprintf("(in %q) %s", c.Dir, s)
	}
	return s
}

type Runner interface {
	Run(context.Context, Command) ([]byte, error)
}

// ExecRunner freezes the process environment, including Docker endpoint and TLS overrides.
type ExecRunner struct {
	Env    []string
	mu     sync.Mutex
	closed bool
	active sync.WaitGroup
}

func (r *ExecRunner) Run(ctx context.Context, c Command) ([]byte, error) {
	r.mu.Lock()
	if r.closed {
		r.mu.Unlock()
		return nil, context.Canceled
	}
	r.active.Add(1)
	r.mu.Unlock()
	defer r.active.Done()
	cmd := exec.CommandContext(ctx, c.Name, c.Args...)
	cmd.Dir, cmd.Env = c.Dir, r.Env
	if c.Name == "cargo" {
		cmd.Env = append(append([]string{}, r.Env...), "RUSTUP_AUTO_INSTALL=0")
	}
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error { return syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL) }
	cmd.WaitDelay = 2 * time.Second
	var stdout, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &stdout, &stderr
	err := cmd.Run()
	if cmd.Process != nil {
		_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
	}
	if err != nil {
		return nil, fmt.Errorf("%s: %w: %s", c.String(), err, strings.TrimSpace(stderr.String()))
	}
	return stdout.Bytes(), nil
}

// Close follows context cancellation and waits until every subprocess exits.
func (r *ExecRunner) Close() {
	r.mu.Lock()
	r.closed = true
	r.mu.Unlock()
	r.active.Wait()
}

type Kind string

const (
	Node    Kind = "node_modules"
	Cargo   Kind = "cargo"
	PNPM    Kind = "pnpm"
	Bun     Kind = "bun"
	GoCache Kind = "go"
	Docker  Kind = "docker"
)

type Target struct {
	ID, Path, Manifest, Detail string
	WorkspaceRoot              string
	Kind                       Kind
	Bytes                      int64
	Known                      bool
	Identity                   os.FileInfo
	Docker                     *DockerPin
}

func (t Target) Label() string {
	if t.Path != "" {
		return string(t.Kind) + "  " + t.Path
	}
	return string(t.Kind) + "  " + t.Detail
}

type Snapshot struct {
	Targets   []Target
	Warnings  []string
	Protected []string
}

type Config struct {
	Home, Repo string
	Roots      []string
}

type Engine struct {
	Config Config
	Runner Runner
}

func within(path, parent string) bool {
	r, err := filepath.Rel(parent, path)
	return err == nil && r != ".." && !strings.HasPrefix(r, ".."+string(os.PathSeparator))
}

// SafePath rejects symlinks in every ancestor and protects home, roots and repositories.
func SafePath(path, home string, protected []string, node bool) error {
	if !filepath.IsAbs(path) || filepath.Clean(path) != path || path == "/" || path == home {
		return fmt.Errorf("unsafe path %q", path)
	}
	if node && filepath.Base(path) != "node_modules" {
		return fmt.Errorf("not node_modules: %q", path)
	}
	for _, p := range append(append([]string{}, protected...), home) {
		if p != "" && within(p, path) {
			return fmt.Errorf("path contains protected directory %q", p)
		}
	}
	for p := path; ; p = filepath.Dir(p) {
		st, err := os.Lstat(p)
		if err != nil {
			return err
		}
		if st.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("symlink in path: %q", p)
		}
		if !st.IsDir() {
			return fmt.Errorf("not a directory: %q", p)
		}
		if p == filepath.Dir(p) {
			break
		}
	}
	return nil
}

func measure(ctx context.Context, path string) (int64, error) {
	var total int64
	err := filepath.WalkDir(path, func(p string, d os.DirEntry, err error) error {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if err != nil {
			return err
		}
		if d.Type()&os.ModeSymlink != 0 {
			return nil
		}
		if !d.IsDir() {
			st, err := d.Info()
			if err != nil {
				return err
			}
			total += st.Size()
		}
		return nil
	})
	return total, err
}

func Size(n int64) string {
	if n < 1024 {
		return fmt.Sprintf("%d B", n)
	}
	v := float64(n)
	units := []string{"KiB", "MiB", "GiB", "TiB"}
	for _, u := range units {
		v /= 1024
		if v < 1024 || u == "TiB" {
			return fmt.Sprintf("%.1f %s", v, u)
		}
	}
	return "?"
}
