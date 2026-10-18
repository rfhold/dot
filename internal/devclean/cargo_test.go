package devclean

import (
	"context"
	"encoding/json"
	"errors"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

func TestCargoMemberLocalConfigPreservesDiscoveryScope(t *testing.T) {
	home := fixture(t)
	workspace := filepath.Join(home, "repos", "workspace")
	member := filepath.Join(workspace, "member")
	manifest := filepath.Join(member, "Cargo.toml")
	rootTarget := filepath.Join(workspace, "target")
	memberTarget := filepath.Join(member, "local-target")
	file(t, filepath.Join(workspace, "Cargo.toml"), "[workspace]\nmembers = [\"member\"]\n")
	file(t, manifest, "[package]\nname = \"member\"\nversion = \"0.1.0\"\n")
	file(t, filepath.Join(member, ".cargo", "config.toml"), "[build]\ntarget-dir = \"local-target\"\n")
	file(t, filepath.Join(rootTarget, "artifact"), "root build")
	file(t, filepath.Join(memberTarget, "artifact"), "member build")
	var cleans []Command
	drift := false
	r := &fakeRunner{fn: func(c Command) ([]byte, error) {
		if c.Name != "cargo" {
			return nil, errors.New("unavailable")
		}
		if c.Args[0] == "metadata" {
			target := rootTarget
			root := workspace
			if c.Dir == member {
				target = memberTarget
				if c.Args[len(c.Args)-1] != manifest {
					t.Fatalf("metadata lost discovery manifest: %+v", c)
				}
				if drift {
					root = filepath.Join(home, "different-workspace")
				}
			}
			return json.Marshal(cargoMetadata{WorkspaceRoot: root, TargetDirectory: target})
		}
		cleans = append(cleans, c)
		return nil, nil
	}}
	e := Engine{Config: Config{Home: home, Repo: workspace}, Runner: r}
	snapshot := e.Scan(context.Background())
	var target Target
	for _, candidate := range snapshot.Targets {
		if candidate.Path == memberTarget {
			target = candidate
		}
	}
	if target.Manifest != manifest || target.WorkspaceRoot != workspace {
		t.Fatalf("discovery lost member scope: %+v; warnings: %v", target, snapshot.Warnings)
	}
	confirmation := Confirm([]Target{target})
	result := e.CleanOne(context.Background(), target, snapshot, confirmation, "CLEAN")
	if result.Err != nil {
		t.Fatalf("member-local cleanup failed: %v", result.Err)
	}
	want := Command{Name: "cargo", Args: []string{"clean", "--manifest-path", manifest, "--target-dir", memberTarget}, Dir: member}
	if !reflect.DeepEqual(cleans, []Command{want}) {
		t.Fatalf("cleanup invocation: %+v; want %+v", cleans, want)
	}
	drift = true
	result = e.CleanOne(context.Background(), target, snapshot, confirmation, "CLEAN")
	if result.Err == nil || !strings.Contains(result.Err.Error(), "cargo scope changed") || len(cleans) != 1 {
		t.Fatalf("workspace-root drift permitted cleanup: %+v; commands: %+v", result, cleans)
	}
}
