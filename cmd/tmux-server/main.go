package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"dev.rholden.dot/internal/auth"
	"dev.rholden.dot/internal/server"
)

func main() {
	// --- Configuration from environment ---

	skipAuth := os.Getenv("SKIP_AUTH") == "true"

	listenAddr := os.Getenv("LISTEN_ADDR")
	if listenAddr == "" {
		listenAddr = ":8080"
	}

	ttlStr := os.Getenv("SESSION_TTL")
	if ttlStr == "" {
		ttlStr = "60s"
	}
	ttl, err := time.ParseDuration(ttlStr)
	if err != nil {
		slog.Error("invalid SESSION_TTL", "value", ttlStr, "error", err)
		os.Exit(1)
	}

	// --- Initialise components ---

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var authMiddleware func(http.Handler) http.Handler

	if skipAuth {
		slog.Warn("SKIP_AUTH is enabled — authentication is disabled (dev mode)")
		authMiddleware = func(next http.Handler) http.Handler { return next }
	} else {
		issuer := os.Getenv("AUTHENTIK_ISSUER")
		if issuer == "" {
			slog.Error("AUTHENTIK_ISSUER is required (set SKIP_AUTH=true to disable)")
			os.Exit(1)
		}

		clientIDsRaw := os.Getenv("OIDC_CLIENT_IDS")
		if clientIDsRaw == "" {
			slog.Error("OIDC_CLIENT_IDS is required (set SKIP_AUTH=true to disable)")
			os.Exit(1)
		}
		clientIDs := strings.Split(clientIDsRaw, ",")
		for i := range clientIDs {
			clientIDs[i] = strings.TrimSpace(clientIDs[i])
		}

		oidcAuth, err := auth.NewOIDCAuth(ctx, issuer, clientIDs)
		if err != nil {
			slog.Error("failed to initialise OIDC auth", "error", err)
			os.Exit(1)
		}
		authMiddleware = oidcAuth.Middleware
	}

	slog.Info("starting tmux-server",
		"listen_addr", listenAddr,
		"session_ttl", ttl,
		"skip_auth", skipAuth,
	)

	store := server.NewStore(ttl)
	store.StartCleanup(ctx, ttl/2)

	handler := server.NewHandler(store)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux, authMiddleware)

	srv := &http.Server{
		Addr:    listenAddr,
		Handler: mux,
	}

	// --- Start server ---

	errCh := make(chan error, 1)
	go func() {
		slog.Info("listening", "addr", listenAddr)
		errCh <- srv.ListenAndServe()
	}()

	// --- Graceful shutdown ---

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		slog.Info("received signal, shutting down", "signal", sig)
	case err := <-errCh:
		if err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
		}
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "error", err)
	}

	cancel() // stop store cleanup goroutine
	slog.Info("server stopped")
}
