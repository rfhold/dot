package devclean

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func (t Target) Commands() []Command {
	switch t.Kind {
	case Node:
		return []Command{{Name: "remove directory (no shell)", Args: []string{t.Path}}}
	case Cargo:
		return []Command{{Name: "cargo", Args: []string{"clean", "--manifest-path", t.Manifest, "--target-dir", t.Path}, Dir: manifestDir(t.Manifest)}}
	case PNPM:
		return []Command{{Name: "pnpm", Args: []string{"store", "prune"}}}
	case Bun:
		return []Command{{Name: "bun", Args: []string{"pm", "cache", "rm"}}}
	case GoCache:
		return []Command{{Name: "go", Args: []string{"clean", "-cache"}}}
	case Docker:
		if t.Docker == nil {
			return nil
		}
		p := *t.Docker
		return []Command{p.Command("container", "prune", "--force"), p.Command("image", "prune", "--all", "--force"), p.Command("builder", "prune", "--all", "--force"), p.Command("volume", "ls", "--quiet", "--filter", "dangling=true"), p.Command("ps", "--all", "--quiet", "--filter", "volume=<each unused volume>"), p.Command("volume", "rm", "--", "<each unreferenced volume, including named>")}
	}
	return nil
}

func manifestDir(path string) string {
	i := strings.LastIndex(path, "/")
	if i < 0 {
		return "."
	}
	return path[:i]
}

type Confirmation struct {
	Count  int
	Docker bool
}

func Confirm(targets []Target) Confirmation {
	c := Confirmation{Count: len(targets)}
	for _, t := range targets {
		c.Docker = c.Docker || t.Kind == Docker
	}
	return c
}
func (c Confirmation) Phrase() string {
	if c.Docker {
		return "DELETE DOCKER DATA"
	}
	return "CLEAN"
}
func (c Confirmation) Accept(text string) bool { return c.Count > 0 && text == c.Phrase() }

type Result struct {
	Target    Target
	Err       error
	Recovered int64
	Known     bool
}

func (e Engine) validate(ctx context.Context, t Target, s Snapshot) error {
	if t.Kind == Docker {
		if t.Docker == nil {
			return fmt.Errorf("missing Docker pin")
		}
		return t.Docker.Validate(ctx, e.Runner)
	}
	if err := SafePath(t.Path, e.Config.Home, s.Protected, t.Kind == Node); err != nil {
		return err
	}
	st, err := os.Stat(t.Path)
	if err != nil {
		return err
	}
	if t.Identity == nil || !os.SameFile(t.Identity, st) {
		return fmt.Errorf("target identity changed; refresh before cleanup")
	}
	switch t.Kind {
	case Cargo:
		m, err := e.metadata(ctx, t.Manifest)
		if err != nil {
			return err
		}
		if m.TargetDirectory != t.Path || m.WorkspaceRoot != t.WorkspaceRoot {
			return fmt.Errorf("cargo scope changed; refresh before cleanup")
		}
	case PNPM, Bun, GoCache:
		c := Command{Name: "pnpm", Args: []string{"store", "path"}}
		if t.Kind == Bun {
			c = Command{Name: "bun", Args: []string{"pm", "cache"}}
		}
		if t.Kind == GoCache {
			c = Command{Name: "go", Args: []string{"env", "GOCACHE"}}
		}
		b, err := e.Runner.Run(ctx, c)
		if err != nil {
			return err
		}
		if strings.TrimSpace(string(b)) != t.Path {
			return fmt.Errorf("cache scope changed; refresh before cleanup")
		}
	case Node:
	default:
		return fmt.Errorf("unknown cleanup kind %q", t.Kind)
	}
	return nil
}

// CleanOne requires a confirmation for the complete selection, not a confirmation per command.
func (e Engine) CleanOne(ctx context.Context, t Target, s Snapshot, c Confirmation, phrase string) Result {
	r := Result{Target: t}
	if !c.Accept(phrase) || (t.Kind == Docker && !c.Docker) {
		r.Err = fmt.Errorf("cleanup not confirmed")
		return r
	}
	if ctx.Err() != nil {
		r.Err = ctx.Err()
		return r
	}
	if err := e.validate(ctx, t, s); err != nil {
		r.Err = err
		return r
	}
	before, measureErr := int64(0), error(nil)
	if t.Path != "" {
		before, measureErr = measure(ctx, t.Path)
	}
	// Repeat the guard after measurement, immediately before the destructive operation.
	if err := e.validate(ctx, t, s); err != nil {
		r.Err = err
		return r
	}
	switch t.Kind {
	case Node:
		r.Err = removeNode(t)
	case Docker:
		r.Err = t.Docker.Clean(ctx, e.Runner)
	default:
		for _, cmd := range t.Commands() {
			if _, err := e.Runner.Run(ctx, cmd); err != nil {
				r.Err = err
				break
			}
		}
	}
	if t.Path != "" {
		after, err := measure(ctx, t.Path)
		if os.IsNotExist(err) {
			after, err = 0, nil
		}
		if measureErr == nil && err == nil {
			r.Known = true
			if before > after {
				r.Recovered = before - after
			}
		}
	}
	return r
}

func removeNode(t Target) error {
	parent, err := os.OpenRoot(filepath.Dir(t.Path))
	if err != nil {
		return err
	}
	defer parent.Close()
	st, err := parent.Lstat(filepath.Base(t.Path))
	if err != nil {
		return err
	}
	if st.Mode()&os.ModeSymlink != 0 || !os.SameFile(t.Identity, st) {
		return fmt.Errorf("node_modules changed before removal")
	}
	// The directory handle prevents an ancestor swap from redirecting recursive removal.
	return parent.RemoveAll(filepath.Base(t.Path))
}
