package server

import (
	"encoding/json"
	"net/http"

	"dev.rholden.dot/internal/models"
)

// Handler provides HTTP handlers for the tmux-server API.
type Handler struct {
	store *Store
}

// NewHandler creates a Handler backed by the given Store.
func NewHandler(store *Store) *Handler {
	return &Handler{store: store}
}

// Health responds with {"status":"ok"} and 200 OK.
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// GetSessions returns all active machines and their sessions.
func (h *Handler) GetSessions(w http.ResponseWriter, r *http.Request) {
	machines := h.store.GetAll()
	writeJSON(w, http.StatusOK, models.SessionsResponse{Machines: machines})
}

// PostSessions accepts a PushRequest, validates it, and updates the store.
func (h *Handler) PostSessions(w http.ResponseWriter, r *http.Request) {
	var req models.PushRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if req.MachineName == "" {
		writeError(w, http.StatusBadRequest, "machine_name is required")
		return
	}
	if req.SSHHost == "" {
		writeError(w, http.StatusBadRequest, "ssh_host is required")
		return
	}
	if req.SSHUser == "" {
		writeError(w, http.StatusBadRequest, "ssh_user is required")
		return
	}

	h.store.Update(req)
	w.WriteHeader(http.StatusNoContent)
}

// RegisterRoutes registers all API routes on mux. Protected routes are wrapped
// with authMiddleware.
func (h *Handler) RegisterRoutes(mux *http.ServeMux, authMiddleware func(http.Handler) http.Handler) {
	mux.HandleFunc("GET /health", h.Health)
	mux.Handle("GET /api/sessions", authMiddleware(http.HandlerFunc(h.GetSessions)))
	mux.Handle("POST /api/sessions", authMiddleware(http.HandlerFunc(h.PostSessions)))
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
