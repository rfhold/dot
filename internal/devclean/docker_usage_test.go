package devclean

import (
	"context"
	"encoding/json"
	"errors"
	"math"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"
)

func dockerUsageRows(sizes ...string) []byte {
	var out []byte
	for i, category := range []string{"Images", "Containers", "Local Volumes", "Build Cache"} {
		if i >= len(sizes) {
			break
		}
		b, _ := json.Marshal(map[string]string{"Type": category, "Reclaimable": sizes[i], "Size": "999EB"})
		out = append(append(out, b...), '\n')
	}
	return out
}

func TestDockerSize(t *testing.T) {
	for _, tc := range []struct {
		text string
		want int64
	}{
		{"0B", 0}, {"0 B (0%)", 0}, {"1.5kB (90%)", 1500}, {"1.5KB", 1500},
		{"2.25MB (10.5%)", 2250000}, {"1.5GB", 1500000000}, {"1.25TB", 1250000000000},
		{"1.5KiB (100%)", 1536}, {"2.5MiB", 2621440}, {"1.5GiB", 1610612736},
		{"0.001kB", 1}, {"0.1B", 0}, {"9223372036854775807B", math.MaxInt64},
	} {
		t.Run(tc.text, func(t *testing.T) {
			got, err := parseDockerSize(tc.text)
			if err != nil || got != tc.want {
				t.Fatalf("got %d, %v; want %d", got, err, tc.want)
			}
		})
	}
	for _, text := range []string{"", "N/A", "-1B", "+1B", "NaNMB", "InfGB", "1XB", "10", "1MB garbage", "1MB (-1%)", "1MB (foo%)", "9223372036854775808B", "9223372036854775807.1B", "10EB", "1e9B", "1.2.3GB"} {
		t.Run("reject/"+text, func(t *testing.T) {
			if _, err := parseDockerSize(text); err == nil {
				t.Fatalf("accepted %q", text)
			}
		})
	}
}

func TestParseDockerUsage(t *testing.T) {
	for _, tc := range []struct {
		name string
		data []byte
		want int64
	}{
		{"mixed", dockerUsageRows("1.5MB (90%)", "1.5KiB (50%)", "2GB (100%)", "0B"), 2001501536},
		{"zero", dockerUsageRows("0B", "0B (0%)", "0 B", "0B"), 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := parseDockerUsage(tc.data)
			if err != nil || got != tc.want {
				t.Fatalf("got %d, %v; want %d", got, err, tc.want)
			}
		})
	}
	valid := dockerUsageRows("1B", "2B", "3B", "4B")
	for name, data := range map[string][]byte{
		"empty":         nil,
		"incomplete":    dockerUsageRows("1MB", "2MB", "3MB"),
		"unavailable":   dockerUsageRows("1MB", "N/A", "0B", "0B"),
		"negative":      dockerUsageRows("1MB", "-1B", "0B", "0B"),
		"overflow":      dockerUsageRows("9223372036854775807B", "1B", "0B", "0B"),
		"duplicate":     append(append([]byte{}, valid...), dockerUsageRows("0B")...),
		"unknown":       []byte(strings.ReplaceAll(string(valid), "Images", "Other")),
		"missing field": []byte(strings.Replace(string(valid), `"Reclaimable":"1B",`, "", 1)),
		"null field":    []byte(strings.Replace(string(valid), `"1B"`, "null", 1)),
		"numeric field": []byte(strings.Replace(string(valid), `"1B"`, "1", 1)),
		"trailing junk": append(append([]byte{}, valid...), []byte("oops")...),
		"truncated":     valid[:len(valid)-3],
		"array":         append(append([]byte("["), valid...), ']'),
	} {
		t.Run(name, func(t *testing.T) {
			if got, err := parseDockerUsage(data); err == nil || got != 0 {
				t.Fatalf("got %d, %v for %s", got, err, data)
			}
		})
	}
}

func TestDockerUsagePin(t *testing.T) {
	for _, host := range []bool{false, true} {
		p := DockerPin{Context: "test", Endpoint: "unix:///test.sock", Fingerprint: "original", HostOverride: host}
		r := &fakeRunner{fn: func(c Command) ([]byte, error) {
			if reflect.DeepEqual(c.Args, []string{"context", "inspect", "test"}) {
				return []byte("original"), nil
			}
			if !reflect.DeepEqual(c, p.Command("system", "df", "--format", "{{json .}}")) {
				t.Fatalf("unexpected usage command: %+v", c)
			}
			return dockerUsageRows("1B", "2B", "3B", "4B"), nil
		}}
		n, err := p.estimatedReclaimable(context.Background(), r)
		if err != nil || n != 10 {
			t.Fatalf("got %d, %v", n, err)
		}
		if host && len(r.calls) != 1 || !host && len(r.calls) != 2 {
			t.Fatal(r.calls)
		}
	}
	p := DockerPin{Context: "test", Fingerprint: "original"}
	r := &fakeRunner{fn: func(c Command) ([]byte, error) { return []byte("changed"), nil }}
	if _, err := p.estimatedReclaimable(context.Background(), r); err == nil || !strings.Contains(err.Error(), "context changed") || len(r.calls) != 1 {
		t.Fatalf("context drift: %v; calls %v", err, r.calls)
	}
}

type usageContextRunner struct {
	t    *testing.T
	wait bool
}

func (r usageContextRunner) Run(ctx context.Context, _ Command) ([]byte, error) {
	deadline, ok := ctx.Deadline()
	if !ok || time.Until(deadline) > dockerUsageTimeout {
		r.t.Fatal("usage probe has no bounded deadline")
	}
	if !r.wait {
		return dockerUsageRows("0B", "0B", "0B", "0B"), nil
	}
	<-ctx.Done()
	return nil, ctx.Err()
}

func TestDockerUsageTimeoutAndCancellation(t *testing.T) {
	p := DockerPin{HostOverride: true, Endpoint: "unix:///test.sock"}
	if _, err := p.estimatedReclaimable(context.Background(), usageContextRunner{t: t}); err != nil {
		t.Fatal(err)
	}
	for _, canceled := range []bool{false, true} {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
		if canceled {
			cancel()
		}
		_, err := p.estimatedReclaimable(ctx, usageContextRunner{t: t, wait: true})
		want := context.DeadlineExceeded
		if canceled {
			want = context.Canceled
		}
		cancel()
		if !errors.Is(err, want) {
			t.Fatalf("got %v; want %v", err, want)
		}
	}
}

func TestScanDockerUsageAndFallback(t *testing.T) {
	t.Setenv("DOCKER_CONTEXT", "")
	t.Setenv("DOCKER_HOST", "unix:///test.sock")
	for _, tc := range []struct {
		name  string
		out   []byte
		err   error
		known bool
		want  int64
	}{
		{"success", dockerUsageRows("1MB", "2B", "3B", "4B"), nil, true, 1000009},
		{"zero", dockerUsageRows("0B", "0B", "0B", "0B"), nil, true, 0},
		{"malformed", []byte("not JSON"), nil, false, 0},
		{"incomplete", dockerUsageRows("1MB"), nil, false, 0},
		{"unavailable", nil, errors.New("daemon unavailable"), false, 0},
		{"timeout", nil, context.DeadlineExceeded, false, 0},
	} {
		t.Run(tc.name, func(t *testing.T) {
			home := fixture(t)
			node := nodeTarget(t, home)
			r := &fakeRunner{fn: func(c Command) ([]byte, error) {
				if c.Name == "docker" {
					switch strings.Join(c.Args, " ") {
					case "--host unix:///test.sock info --format {{.ID}}":
						return []byte("daemon"), nil
					case "--host unix:///test.sock system df --format {{json .}}":
						return tc.out, tc.err
					default:
						t.Fatalf("unexpected Docker command: %v", c)
					}
				}
				return nil, errors.New("unavailable")
			}}
			s := (Engine{Config: Config{Home: home, Repo: filepath.Dir(node.Path)}, Runner: r}).Scan(context.Background())
			var target Target
			for _, candidate := range s.Targets {
				if candidate.Kind == Docker {
					target = candidate
				}
			}
			if target.Docker == nil || target.Known != tc.known || target.Bytes != tc.want || !strings.Contains(target.Detail, "DOCKER_HOST=unix:///test.sock") {
				t.Fatalf("target: %+v; warnings %v", target, s.Warnings)
			}
			if tc.known {
				if !strings.Contains(target.Detail, "estimated reclaimable (approximate)") || !strings.Contains(target.Detail, "can overlap") {
					t.Fatal(target.Detail)
				}
				if tc.want > node.Bytes && s.Targets[0].Kind != Docker {
					t.Fatal("Docker estimate not used for sorting")
				}
			} else if !strings.Contains(strings.Join(s.Warnings, " "), "Docker estimated reclaimable unavailable (DOCKER_HOST=unix:///test.sock") {
				t.Fatal(s.Warnings)
			}
		})
	}
}

func TestDockerEstimatedTargetRecoveryRemainsUnknown(t *testing.T) {
	p := DockerPin{HostOverride: true, Endpoint: "unix:///test.sock"}
	target := Target{Kind: Docker, Docker: &p, Known: true, Bytes: 1000000}
	r := &fakeRunner{fn: func(Command) ([]byte, error) { return nil, nil }}
	result := (Engine{Runner: r}).CleanOne(context.Background(), target, Snapshot{}, Confirm([]Target{target}), "DELETE DOCKER DATA")
	if result.Err != nil || result.Known || result.Recovered != 0 {
		t.Fatalf("estimate became recovered bytes: %+v", result)
	}
}
