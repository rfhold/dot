package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"dev.rholden.dot/internal/devclean"
	tea "github.com/charmbracelet/bubbletea"
)

type roots []string

func (r *roots) String() string { return fmt.Sprint([]string(*r)) }
func (r *roots) Set(s string) error {
	if s == "" {
		return fmt.Errorf("root cannot be empty")
	}
	*r = append(*r, s)
	return nil
}

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "dev-clean:", err)
		os.Exit(1)
	}
}
func run(args []string) error {
	f := flag.NewFlagSet("dev-clean", flag.ContinueOnError)
	f.SetOutput(os.Stderr)
	var extra roots
	var repo string
	f.Var(&extra, "root", "additional repository search root (repeatable)")
	f.StringVar(&repo, "repo-root", "", "dot repository root (set by launcher)")
	f.Usage = func() {
		fmt.Fprintln(f.Output(), "Usage: dev-clean [--root PATH] [--repo-root PATH]\n\nInteractive, read-only scan; no cleanup until explicit confirmation.\nDefaults: ~/repos and the dot repository. Missing tools produce scan warnings.\nDocker cleanup includes unused named volumes and requires DELETE DOCKER DATA.\n\nOptions:")
		f.PrintDefaults()
	}
	if err := f.Parse(args); err != nil {
		if err == flag.ErrHelp {
			return nil
		}
		return err
	}
	if f.NArg() != 0 {
		return fmt.Errorf("unexpected arguments: %v", f.Args())
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	home, err = filepath.EvalSymlinks(home)
	if err != nil {
		return err
	}
	if repo == "" {
		return fmt.Errorf("use bin/dev-clean or provide --repo-root")
	}
	ctx, cancel := context.WithCancel(context.Background())
	runner := &devclean.ExecRunner{Env: os.Environ()}
	defer func() { cancel(); runner.Close() }()
	e := devclean.Engine{Config: devclean.Config{Home: home, Repo: repo, Roots: extra}, Runner: runner}
	_, err = tea.NewProgram(devclean.NewModel(ctx, e), tea.WithAltScreen()).Run()
	return err
}
