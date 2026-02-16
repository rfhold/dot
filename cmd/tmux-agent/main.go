package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"dev.rholden.dot/internal/agent"
	"dev.rholden.dot/internal/models"
)

func main() {
	// --- Configuration from environment ---

	skipAuth := os.Getenv("SKIP_AUTH") == "true"

	serverURL := requireEnv("SERVER_URL")
	sshHost := requireEnv("SSH_HOST")
	sshUser := requireEnv("SSH_USER")

	pushIntervalStr := os.Getenv("PUSH_INTERVAL")
	if pushIntervalStr == "" {
		pushIntervalStr = "10s"
	}
	pushInterval, err := time.ParseDuration(pushIntervalStr)
	if err != nil {
		slog.Error("invalid PUSH_INTERVAL", "value", pushIntervalStr, "error", err)
		os.Exit(1)
	}

	machineName := os.Getenv("MACHINE_NAME")
	if machineName == "" {
		hostname, err := os.Hostname()
		if err != nil {
			slog.Error("failed to get hostname", "error", err)
			os.Exit(1)
		}
		machineName = hostname
	}

	slog.Info("starting tmux-agent",
		"machine_name", machineName,
		"server_url", serverURL,
		"push_interval", pushInterval,
		"skip_auth", skipAuth,
	)

	// --- Initialise components ---

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	var httpClient *http.Client

	if skipAuth {
		slog.Warn("SKIP_AUTH is enabled — using plain HTTP client (dev mode)")
		httpClient = http.DefaultClient
	} else {
		issuer := requireEnv("AUTHENTIK_ISSUER")
		clientID := requireEnv("OIDC_CLIENT_ID")
		clientSecret := requireEnv("OIDC_CLIENT_SECRET")

		httpClient, err = agent.NewTokenClient(ctx, issuer, clientID, clientSecret)
		if err != nil {
			slog.Error("failed to initialise OIDC token client", "error", err)
			os.Exit(1)
		}
	}

	pusher := agent.NewPusher(serverURL, httpClient)

	// --- Main loop ---

	// First push immediately.
	pushOnce(ctx, pusher, machineName, sshHost, sshUser)

	ticker := time.NewTicker(pushInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("shutting down")
			return
		case <-ticker.C:
			pushOnce(ctx, pusher, machineName, sshHost, sshUser)
		}
	}
}

func pushOnce(ctx context.Context, pusher *agent.Pusher, machineName, sshHost, sshUser string) {
	sessions, err := agent.ListSessions()
	if err != nil {
		slog.Error("failed to list tmux sessions", "error", err)
		return
	}

	req := models.PushRequest{
		MachineName: machineName,
		SSHHost:     sshHost,
		SSHUser:     sshUser,
		Sessions:    sessions,
	}

	if err := pusher.Push(ctx, req); err != nil {
		slog.Error("failed to push sessions", "error", err)
		return
	}

	slog.Info("pushed sessions", "count", len(sessions))
}

func requireEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		slog.Error("required environment variable is not set", "key", key)
		os.Exit(1)
	}
	return val
}
