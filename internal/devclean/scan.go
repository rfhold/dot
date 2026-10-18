package devclean

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type cargoMetadata struct {
	WorkspaceRoot   string `json:"workspace_root"`
	TargetDirectory string `json:"target_directory"`
}

func (e Engine) metadata(ctx context.Context, manifest string) (cargoMetadata, error) {
	var m cargoMetadata
	b, err := e.Runner.Run(ctx, Command{Name: "cargo", Args: []string{"metadata", "--offline", "--locked", "--no-deps", "--format-version", "1", "--manifest-path", manifest}, Dir: filepath.Dir(manifest)})
	if err == nil {
		err = json.Unmarshal(b, &m)
	}
	if err == nil && (!filepath.IsAbs(m.WorkspaceRoot) || !filepath.IsAbs(m.TargetDirectory)) {
		err = fmt.Errorf("invalid cargo metadata")
	}
	return m, err
}

func (e Engine) Scan(ctx context.Context) Snapshot {
	s := Snapshot{}
	warn := func(err error) {
		if err != nil {
			s.Warnings = append(s.Warnings, err.Error())
		}
	}
	roots := append([]string{filepath.Join(e.Config.Home, "repos"), e.Config.Repo}, e.Config.Roots...)
	queue := []string{}
	for _, r := range roots {
		if r == "" {
			continue
		}
		a, err := filepath.Abs(r)
		if err != nil {
			warn(err)
			continue
		}
		// Canonical roots allow macOS /var and a symlinked dot checkout without following child symlinks.
		a, err = filepath.EvalSymlinks(a)
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			warn(err)
			continue
		}
		queue = append(queue, a)
		s.Protected = append(s.Protected, a)
	}
	visited, repos, manifests := map[string]bool{}, map[string]bool{}, []string{}
	var nodes []string
	for len(queue) > 0 && ctx.Err() == nil {
		root := queue[0]
		queue = queue[1:]
		warn(filepath.WalkDir(root, func(p string, d os.DirEntry, err error) error {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			if err != nil {
				warn(err)
				if d != nil && d.IsDir() {
					return filepath.SkipDir
				}
				return nil
			}
			if d.Type()&os.ModeSymlink != 0 {
				return nil
			}
			if d.IsDir() {
				if visited[p] {
					return filepath.SkipDir
				}
				visited[p] = true
				if p != root {
					switch d.Name() {
					case "node_modules":
						nodes = append(nodes, p)
						return filepath.SkipDir
					case ".git", "target", ".worktrees", ".cache", "vendor", ".pnpm-store", ".bun":
						return filepath.SkipDir
					}
				}
				if isRepository(p) && !repos[p] {
					repos[p] = true
					s.Protected = append(s.Protected, p)
					out, err := e.Runner.Run(ctx, Command{Name: "git", Args: []string{"-C", p, "worktree", "list", "--porcelain", "-z"}})
					warn(err)
					if err == nil {
						for _, f := range strings.Split(string(out), "\x00") {
							if strings.HasPrefix(f, "worktree ") {
								w := strings.TrimPrefix(f, "worktree ")
								canonical, err := filepath.EvalSymlinks(w)
								if err == nil {
									queue = append(queue, canonical)
									s.Protected = append(s.Protected, canonical)
								} else {
									warn(err)
								}
							}
						}
					}
				}
			} else {
				switch d.Name() {
				case "Cargo.toml":
					manifests = append(manifests, p)
					s.Protected = append(s.Protected, filepath.Dir(p))
				case "package.json":
					s.Protected = append(s.Protected, filepath.Dir(p))
				}
			}
			return nil
		}))
	}
	add := func(t Target) {
		if err := SafePath(t.Path, e.Config.Home, s.Protected, t.Kind == Node); err != nil {
			warn(err)
			return
		}
		st, err := os.Stat(t.Path)
		if err != nil {
			if !os.IsNotExist(err) {
				warn(err)
			}
			return
		}
		t.Identity = st
		n, err := measure(ctx, t.Path)
		t.Bytes, t.Known = n, err == nil
		warn(err)
		t.ID = string(t.Kind) + ":" + t.Path
		s.Targets = append(s.Targets, t)
	}
	for _, n := range nodes {
		add(Target{Kind: Node, Path: n})
	}
	seenCargo := map[string]bool{}
	for _, manifest := range manifests {
		if ctx.Err() != nil {
			break
		}
		m, err := e.metadata(ctx, manifest)
		if err != nil {
			warn(err)
			continue
		}
		s.Protected = append(s.Protected, m.WorkspaceRoot)
		if seenCargo[m.TargetDirectory] {
			continue
		}
		seenCargo[m.TargetDirectory] = true
		add(Target{Kind: Cargo, Path: m.TargetDirectory, Manifest: manifest, WorkspaceRoot: m.WorkspaceRoot, Detail: "cargo clean scope: entire target directory (including shared/external outputs)"})
	}
	for _, cache := range []struct {
		kind    Kind
		command Command
	}{
		{PNPM, Command{Name: "pnpm", Args: []string{"store", "path"}}},
		{Bun, Command{Name: "bun", Args: []string{"pm", "cache"}}},
		{GoCache, Command{Name: "go", Args: []string{"env", "GOCACHE"}}},
	} {
		if ctx.Err() != nil {
			break
		}
		out, err := e.Runner.Run(ctx, cache.command)
		if err != nil {
			warn(err)
			continue
		}
		path := strings.TrimSpace(string(out))
		if path == "off" {
			continue
		}
		add(Target{Kind: cache.kind, Path: path, Detail: "global cache; shared across projects"})
	}
	if ctx.Err() == nil {
		pin, err := CaptureDocker(ctx, e.Runner, os.Getenv)
		if err != nil {
			warn(err)
		} else {
			_, err = e.Runner.Run(ctx, pin.Command("info", "--format", "{{.ID}}"))
			if err != nil {
				warn(err)
			} else {
				target := Target{ID: "docker", Kind: Docker, Detail: pin.Label(), Docker: &pin}
				target.Bytes, err = pin.estimatedReclaimable(ctx, e.Runner)
				if err != nil {
					target.Detail += "; estimated reclaimable unavailable"
					warn(fmt.Errorf("Docker estimated reclaimable unavailable (%s): %w", pin.Label(), err))
				} else {
					target.Known = true
					target.Detail += "; estimated reclaimable (approximate): " + Size(target.Bytes) + "; shared image/build-cache accounting can overlap; not exact free disk space"
				}
				s.Targets = append(s.Targets, target)
			}
		}
	}
	// Collapse overlapping filesystem scopes rather than claim the same bytes twice.
	sort.SliceStable(s.Targets, func(i, j int) bool { return len(s.Targets[i].Path) < len(s.Targets[j].Path) })
	var unique []Target
	for _, t := range s.Targets {
		// Metadata can reveal protected workspace roots after a target was measured.
		if t.Path != "" {
			if err := SafePath(t.Path, e.Config.Home, s.Protected, t.Kind == Node); err != nil {
				warn(err)
				continue
			}
		}
		overlap := false
		for _, u := range unique {
			if t.Path != "" && u.Path != "" && within(t.Path, u.Path) {
				overlap = true
				warn(fmt.Errorf("omitted overlapping %s; covered by %s", t.Label(), u.Label()))
				break
			}
		}
		if !overlap {
			unique = append(unique, t)
		}
	}
	s.Targets = unique
	sort.SliceStable(s.Targets, func(i, j int) bool {
		if s.Targets[i].Bytes != s.Targets[j].Bytes {
			return s.Targets[i].Bytes > s.Targets[j].Bytes
		}
		return s.Targets[i].Label() < s.Targets[j].Label()
	})
	return s
}

func isRepository(path string) bool {
	if _, err := os.Lstat(filepath.Join(path, ".git")); err == nil {
		return true
	}
	// Bare repositories also register worktrees, often outside the search roots.
	for _, name := range []string{"HEAD", "config", "objects", "refs"} {
		if _, err := os.Lstat(filepath.Join(path, name)); err != nil {
			return false
		}
	}
	return true
}
