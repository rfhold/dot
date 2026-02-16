package server

import (
	"context"
	"sync"
	"testing"
	"time"

	"dev.rholden.dot/internal/models"
)

func makePushRequest(name, host, user string, sessions []models.TmuxSession) models.PushRequest {
	return models.PushRequest{
		MachineName: name,
		SSHHost:     host,
		SSHUser:     user,
		Sessions:    sessions,
	}
}

func TestStore_UpdateAndGetAll(t *testing.T) {
	store := NewStore(1 * time.Minute)

	sessions := []models.TmuxSession{
		{Name: "dev", Windows: 3, Attached: true, LastActivity: time.Now()},
	}
	store.Update(makePushRequest("machine-a", "10.0.0.1", "user", sessions))

	machines := store.GetAll()
	if len(machines) != 1 {
		t.Fatalf("expected 1 machine, got %d", len(machines))
	}

	m := machines[0]
	if m.Name != "machine-a" {
		t.Errorf("Name = %q, want %q", m.Name, "machine-a")
	}
	if m.SSHHost != "10.0.0.1" {
		t.Errorf("SSHHost = %q, want %q", m.SSHHost, "10.0.0.1")
	}
	if m.SSHUser != "user" {
		t.Errorf("SSHUser = %q, want %q", m.SSHUser, "user")
	}
	if len(m.Sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(m.Sessions))
	}
	if m.Sessions[0].Name != "dev" {
		t.Errorf("Sessions[0].Name = %q, want %q", m.Sessions[0].Name, "dev")
	}
}

func TestStore_UpdateReplacesSessions(t *testing.T) {
	store := NewStore(1 * time.Minute)

	// Push initial sessions.
	store.Update(makePushRequest("m1", "h", "u", []models.TmuxSession{
		{Name: "old-session", Windows: 1},
	}))

	// Push updated sessions — should fully replace.
	store.Update(makePushRequest("m1", "h", "u", []models.TmuxSession{
		{Name: "new-session-1", Windows: 2},
		{Name: "new-session-2", Windows: 3},
	}))

	machines := store.GetAll()
	if len(machines) != 1 {
		t.Fatalf("expected 1 machine, got %d", len(machines))
	}
	if len(machines[0].Sessions) != 2 {
		t.Fatalf("expected 2 sessions after update, got %d", len(machines[0].Sessions))
	}
}

func TestStore_MultipleMachines(t *testing.T) {
	store := NewStore(1 * time.Minute)

	store.Update(makePushRequest("m1", "h1", "u1", nil))
	store.Update(makePushRequest("m2", "h2", "u2", nil))

	machines := store.GetAll()
	if len(machines) != 2 {
		t.Fatalf("expected 2 machines, got %d", len(machines))
	}
}

func TestStore_TTLExpiry(t *testing.T) {
	store := NewStore(50 * time.Millisecond)

	store.Update(makePushRequest("m1", "h", "u", nil))

	// Should be visible immediately.
	if machines := store.GetAll(); len(machines) != 1 {
		t.Fatalf("expected 1 machine immediately, got %d", len(machines))
	}

	// Wait for TTL to expire.
	time.Sleep(100 * time.Millisecond)

	// Should be filtered out of GetAll.
	if machines := store.GetAll(); len(machines) != 0 {
		t.Fatalf("expected 0 machines after TTL expiry, got %d", len(machines))
	}
}

func TestStore_Cleanup(t *testing.T) {
	store := NewStore(50 * time.Millisecond)

	store.Update(makePushRequest("m1", "h", "u", nil))

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Cleanup interval of 25ms (half the TTL).
	store.StartCleanup(ctx, 25*time.Millisecond)

	// Wait for TTL + cleanup to run.
	time.Sleep(150 * time.Millisecond)

	// The machine should be physically removed by cleanup.
	store.mu.RLock()
	count := len(store.machines)
	store.mu.RUnlock()

	if count != 0 {
		t.Fatalf("expected 0 machines in map after cleanup, got %d", count)
	}
}

func TestStore_CleanupStopsOnCancel(t *testing.T) {
	store := NewStore(1 * time.Minute)

	ctx, cancel := context.WithCancel(context.Background())
	store.StartCleanup(ctx, 10*time.Millisecond)

	// Cancel should stop the goroutine without panic.
	cancel()
	time.Sleep(50 * time.Millisecond) // Give goroutine time to exit.
}

func TestStore_GetAllReturnsCopies(t *testing.T) {
	store := NewStore(1 * time.Minute)

	store.Update(makePushRequest("m1", "h", "u", []models.TmuxSession{
		{Name: "s1", Windows: 1},
	}))

	machines := store.GetAll()
	// Mutate the returned copy.
	machines[0].Sessions[0].Name = "MUTATED"

	// Original should be unaffected.
	machines2 := store.GetAll()
	if machines2[0].Sessions[0].Name != "s1" {
		t.Fatal("GetAll returned a reference to internal state, not a copy")
	}
}

func TestStore_ConcurrentAccess(t *testing.T) {
	store := NewStore(1 * time.Minute)
	var wg sync.WaitGroup

	// Concurrent writers.
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			store.Update(makePushRequest("m1", "h", "u", []models.TmuxSession{
				{Name: "s1", Windows: n},
			}))
		}(i)
	}

	// Concurrent readers.
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = store.GetAll()
		}()
	}

	wg.Wait()
	// If there were data races, the race detector would catch them.
}

func TestStore_LastSeenSetByUpdate(t *testing.T) {
	store := NewStore(1 * time.Minute)

	before := time.Now()
	store.Update(makePushRequest("m1", "h", "u", nil))
	after := time.Now()

	machines := store.GetAll()
	if len(machines) != 1 {
		t.Fatalf("expected 1 machine, got %d", len(machines))
	}

	lastSeen := machines[0].LastSeen
	if lastSeen.Before(before) || lastSeen.After(after) {
		t.Errorf("LastSeen = %v, expected between %v and %v", lastSeen, before, after)
	}
}
