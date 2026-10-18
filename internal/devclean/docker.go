package devclean

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

type DockerPin struct {
	Context, Endpoint, Fingerprint, TLS string
	HostOverride                        bool
}

func CaptureDocker(ctx context.Context, r Runner, getenv func(string) string) (DockerPin, error) {
	p := DockerPin{}
	// Docker gives an explicit context precedence over DOCKER_HOST.
	if getenv("DOCKER_CONTEXT") == "" && getenv("DOCKER_HOST") != "" {
		p.Endpoint, p.HostOverride = getenv("DOCKER_HOST"), true
		p.TLS = "TLS=" + getenv("DOCKER_TLS") + " TLS_VERIFY=" + getenv("DOCKER_TLS_VERIFY") + " CERT_PATH=" + getenv("DOCKER_CERT_PATH")
		return p, nil
	}
	p.Context = getenv("DOCKER_CONTEXT")
	if p.Context == "" {
		b, err := r.Run(ctx, Command{Name: "docker", Args: []string{"context", "show"}})
		if err != nil {
			return p, err
		}
		p.Context = strings.TrimSpace(string(b))
	}
	if p.Context == "" {
		return p, fmt.Errorf("Docker returned an empty context")
	}
	b, err := r.Run(ctx, Command{Name: "docker", Args: []string{"context", "inspect", p.Context}})
	if err != nil {
		return p, err
	}
	var contexts []struct {
		Endpoints map[string]struct {
			Host          string
			SkipTLSVerify bool
		}
	}
	if err := json.Unmarshal(b, &contexts); err != nil {
		return p, err
	}
	if len(contexts) != 1 || contexts[0].Endpoints["docker"].Host == "" {
		return p, fmt.Errorf("Docker context has no endpoint")
	}
	p.Endpoint = contexts[0].Endpoints["docker"].Host
	p.TLS = fmt.Sprintf("SkipTLSVerify=%t", contexts[0].Endpoints["docker"].SkipTLSVerify)
	p.Fingerprint = string(b)
	return p, nil
}

func (p DockerPin) Label() string {
	if p.HostOverride {
		return "DOCKER_HOST=" + p.Endpoint + " " + p.TLS
	}
	return "context=" + p.Context + " endpoint=" + p.Endpoint + " " + p.TLS
}

func (p DockerPin) Command(args ...string) Command {
	prefix := []string{"--context", p.Context}
	if p.HostOverride {
		prefix = []string{"--host", p.Endpoint}
	}
	return Command{Name: "docker", Args: append(prefix, args...)}
}

func (p DockerPin) Validate(ctx context.Context, r Runner) error {
	if p.HostOverride {
		return nil
	}
	b, err := r.Run(ctx, Command{Name: "docker", Args: []string{"context", "inspect", p.Context}})
	if err != nil {
		return err
	}
	if string(b) != p.Fingerprint {
		return fmt.Errorf("Docker context changed since scan; refresh before cleanup")
	}
	return nil
}

func (p DockerPin) run(ctx context.Context, r Runner, args ...string) ([]byte, error) {
	if err := p.Validate(ctx, r); err != nil {
		return nil, err
	}
	return r.Run(ctx, p.Command(args...))
}

func (p DockerPin) Clean(ctx context.Context, r Runner) error {
	for _, args := range [][]string{{"container", "prune", "--force"}, {"image", "prune", "--all", "--force"}, {"builder", "prune", "--all", "--force"}} {
		if _, err := p.run(ctx, r, args...); err != nil {
			return err
		}
	}
	b, err := p.run(ctx, r, "volume", "ls", "--quiet", "--filter", "dangling=true")
	if err != nil {
		return err
	}
	for _, volume := range strings.Fields(string(b)) {
		// Recheck references; volume rm also refuses volumes attached by a concurrent container.
		refs, err := p.run(ctx, r, "ps", "--all", "--quiet", "--filter", "volume="+volume)
		if err != nil {
			return err
		}
		if len(strings.TrimSpace(string(refs))) != 0 {
			continue
		}
		if _, err := p.run(ctx, r, "volume", "rm", "--", volume); err != nil {
			return err
		}
	}
	return nil
}
