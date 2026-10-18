package devclean

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"math/big"
	"regexp"
	"time"
)

const dockerUsageTimeout = 15 * time.Second

func (p DockerPin) estimatedReclaimable(ctx context.Context, r Runner) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, dockerUsageTimeout)
	defer cancel()
	out, err := p.run(ctx, r, "system", "df", "--format", "{{json .}}")
	if ctx.Err() != nil {
		return 0, ctx.Err()
	}
	if err != nil {
		return 0, err
	}
	return parseDockerUsage(out)
}

func parseDockerUsage(out []byte) (int64, error) {
	seen := map[string]bool{"Images": false, "Containers": false, "Local Volumes": false, "Build Cache": false}
	decoder := json.NewDecoder(bytes.NewReader(out))
	var total int64
	for {
		var row struct {
			Type, Reclaimable string
		}
		if err := decoder.Decode(&row); err == io.EOF {
			break
		} else if err != nil {
			return 0, fmt.Errorf("invalid Docker usage JSON: %w", err)
		}
		if done, ok := seen[row.Type]; !ok || done {
			return 0, fmt.Errorf("unexpected or duplicate Docker usage category %q", row.Type)
		}
		n, err := parseDockerSize(row.Reclaimable)
		if err != nil {
			return 0, fmt.Errorf("Docker %s reclaimable: %w", row.Type, err)
		}
		if n > math.MaxInt64-total {
			return 0, fmt.Errorf("Docker reclaimable total overflows bytes")
		}
		total += n
		seen[row.Type] = true
	}
	for category, done := range seen {
		if !done {
			return 0, fmt.Errorf("Docker usage missing %s reclaimable", category)
		}
	}
	return total, nil
}

var dockerSizePattern = regexp.MustCompile(`^\s*([0-9]+(?:\.[0-9]+)?)\s*(B|kB|KB|MB|GB|TB|PB|EB|KiB|MiB|GiB|TiB|PiB|EiB)(?:\s+\([0-9]+(?:\.[0-9]+)?%\))?\s*$`)

func parseDockerSize(text string) (int64, error) {
	m := dockerSizePattern.FindStringSubmatch(text)
	if m == nil {
		return 0, fmt.Errorf("invalid size %q", text)
	}
	units := map[string]int64{
		"B": 1, "kB": 1000, "KB": 1000, "MB": 1e6, "GB": 1e9, "TB": 1e12, "PB": 1e15, "EB": 1e18,
		"KiB": 1 << 10, "MiB": 1 << 20, "GiB": 1 << 30, "TiB": 1 << 40, "PiB": 1 << 50, "EiB": 1 << 60,
	}
	n, ok := new(big.Rat).SetString(m[1])
	if !ok {
		return 0, fmt.Errorf("invalid size %q", text)
	}
	n.Mul(n, new(big.Rat).SetInt64(units[m[2]]))
	if n.Cmp(new(big.Rat).SetInt64(math.MaxInt64)) > 0 {
		return 0, fmt.Errorf("size overflows bytes: %q", text)
	}
	return new(big.Int).Quo(n.Num(), n.Denom()).Int64(), nil
}
