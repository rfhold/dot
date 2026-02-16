package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"dev.rholden.dot/internal/models"
)

// noopMiddleware passes all requests through without auth checks.
func noopMiddleware(next http.Handler) http.Handler {
	return next
}

func setupTestServer(t *testing.T) (*httptest.Server, *Store) {
	t.Helper()
	store := NewStore(1 * time.Minute)
	handler := NewHandler(store)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux, noopMiddleware)
	return httptest.NewServer(mux), store
}

func TestHealth(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/health")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var body map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode failed: %v", err)
	}
	if body["status"] != "ok" {
		t.Fatalf("expected status=ok, got %q", body["status"])
	}
}

func TestPostSessions_Valid(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	req := models.PushRequest{
		MachineName: "test-machine",
		SSHHost:     "10.0.0.1",
		SSHUser:     "testuser",
		Sessions: []models.TmuxSession{
			{Name: "dev", Windows: 3, Attached: true, LastActivity: time.Now()},
		},
	}
	body, _ := json.Marshal(req)

	resp, err := http.Post(ts.URL+"/api/sessions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", resp.StatusCode)
	}
}

func TestPostSessions_MissingMachineName(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	req := models.PushRequest{
		SSHHost: "10.0.0.1",
		SSHUser: "testuser",
	}
	body, _ := json.Marshal(req)

	resp, err := http.Post(ts.URL+"/api/sessions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}

	var errBody map[string]string
	json.NewDecoder(resp.Body).Decode(&errBody)
	if errBody["error"] != "machine_name is required" {
		t.Fatalf("expected machine_name error, got %q", errBody["error"])
	}
}

func TestPostSessions_MissingSSHHost(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	req := models.PushRequest{
		MachineName: "test",
		SSHUser:     "testuser",
	}
	body, _ := json.Marshal(req)

	resp, err := http.Post(ts.URL+"/api/sessions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}

	var errBody map[string]string
	json.NewDecoder(resp.Body).Decode(&errBody)
	if errBody["error"] != "ssh_host is required" {
		t.Fatalf("expected ssh_host error, got %q", errBody["error"])
	}
}

func TestPostSessions_MissingSSHUser(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	req := models.PushRequest{
		MachineName: "test",
		SSHHost:     "10.0.0.1",
	}
	body, _ := json.Marshal(req)

	resp, err := http.Post(ts.URL+"/api/sessions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}

	var errBody map[string]string
	json.NewDecoder(resp.Body).Decode(&errBody)
	if errBody["error"] != "ssh_user is required" {
		t.Fatalf("expected ssh_user error, got %q", errBody["error"])
	}
}

func TestPostSessions_InvalidJSON(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	resp, err := http.Post(ts.URL+"/api/sessions", "application/json", bytes.NewReader([]byte("not json")))
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", resp.StatusCode)
	}
}

func TestGetSessions_Empty(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/sessions")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", resp.StatusCode)
	}

	var body models.SessionsResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("decode failed: %v", err)
	}
	if len(body.Machines) != 0 {
		t.Fatalf("expected 0 machines, got %d", len(body.Machines))
	}
}

func TestGetSessions_AfterPost(t *testing.T) {
	ts, store := setupTestServer(t)
	defer ts.Close()

	// Directly update store (equivalent to a POST).
	store.Update(models.PushRequest{
		MachineName: "m1",
		SSHHost:     "10.0.0.1",
		SSHUser:     "user1",
		Sessions: []models.TmuxSession{
			{Name: "dev", Windows: 3, Attached: true, LastActivity: time.Now()},
			{Name: "build", Windows: 1, Attached: false, LastActivity: time.Now()},
		},
	})

	resp, err := http.Get(ts.URL + "/api/sessions")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	var body models.SessionsResponse
	json.NewDecoder(resp.Body).Decode(&body)

	if len(body.Machines) != 1 {
		t.Fatalf("expected 1 machine, got %d", len(body.Machines))
	}
	if body.Machines[0].Name != "m1" {
		t.Errorf("machine name = %q, want %q", body.Machines[0].Name, "m1")
	}
	if len(body.Machines[0].Sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(body.Machines[0].Sessions))
	}
}

func TestPostThenGetRoundTrip(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	// POST sessions.
	pushReq := models.PushRequest{
		MachineName: "laptop",
		SSHHost:     "192.168.1.100",
		SSHUser:     "dev",
		Sessions: []models.TmuxSession{
			{Name: "main", Windows: 5, Attached: true, LastActivity: time.Now()},
		},
	}
	body, _ := json.Marshal(pushReq)
	resp, err := http.Post(ts.URL+"/api/sessions", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST failed: %v", err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("POST: expected 204, got %d", resp.StatusCode)
	}

	// GET sessions.
	resp, err = http.Get(ts.URL + "/api/sessions")
	if err != nil {
		t.Fatalf("GET failed: %v", err)
	}
	defer resp.Body.Close()

	var sessResp models.SessionsResponse
	json.NewDecoder(resp.Body).Decode(&sessResp)

	if len(sessResp.Machines) != 1 {
		t.Fatalf("expected 1 machine, got %d", len(sessResp.Machines))
	}
	m := sessResp.Machines[0]
	if m.Name != "laptop" {
		t.Errorf("machine name = %q, want %q", m.Name, "laptop")
	}
	if m.SSHHost != "192.168.1.100" {
		t.Errorf("ssh_host = %q, want %q", m.SSHHost, "192.168.1.100")
	}
	if m.SSHUser != "dev" {
		t.Errorf("ssh_user = %q, want %q", m.SSHUser, "dev")
	}
	if len(m.Sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(m.Sessions))
	}
	if m.Sessions[0].Name != "main" {
		t.Errorf("session name = %q, want %q", m.Sessions[0].Name, "main")
	}
	if m.Sessions[0].Windows != 5 {
		t.Errorf("session windows = %d, want %d", m.Sessions[0].Windows, 5)
	}
}

func TestGetSessions_ContentType(t *testing.T) {
	ts, _ := setupTestServer(t)
	defer ts.Close()

	resp, err := http.Get(ts.URL + "/api/sessions")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	ct := resp.Header.Get("Content-Type")
	if ct != "application/json" {
		t.Errorf("Content-Type = %q, want %q", ct, "application/json")
	}
}
