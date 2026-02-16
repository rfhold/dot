package agent

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"dev.rholden.dot/internal/models"
)

// Pusher sends tmux session data to the tmux-server API.
type Pusher struct {
	serverURL  string
	httpClient *http.Client
}

// NewPusher creates a Pusher that posts sessions to the given server URL
// using the provided (OIDC-authenticated) HTTP client.
func NewPusher(serverURL string, httpClient *http.Client) *Pusher {
	return &Pusher{
		serverURL:  serverURL,
		httpClient: httpClient,
	}
}

// Push serialises the PushRequest as JSON and POSTs it to the server.
func (p *Pusher) Push(ctx context.Context, req models.PushRequest) error {
	body, err := json.Marshal(req)
	if err != nil {
		return fmt.Errorf("marshal push request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, p.serverURL+"/api/sessions", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode == http.StatusNoContent:
		return nil
	case resp.StatusCode == http.StatusUnauthorized:
		slog.Warn("authentication failed, check OIDC credentials")
		return fmt.Errorf("push failed: 401 unauthorized")
	case resp.StatusCode >= 500:
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("push failed: server error %d: %s", resp.StatusCode, string(respBody))
	default:
		return fmt.Errorf("push failed: unexpected status %d", resp.StatusCode)
	}
}
