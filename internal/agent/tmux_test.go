package agent

import (
	"testing"
	"time"
)

func TestParseSessions_ValidOutput(t *testing.T) {
	output := "dev\t3\t1\t1700000000\nwork\t5\t0\t1700001000\n"
	sessions, err := ParseSessions(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}

	// First session: attached
	if sessions[0].Name != "dev" {
		t.Errorf("session[0].Name = %q, want %q", sessions[0].Name, "dev")
	}
	if sessions[0].Windows != 3 {
		t.Errorf("session[0].Windows = %d, want %d", sessions[0].Windows, 3)
	}
	if !sessions[0].Attached {
		t.Error("session[0].Attached = false, want true")
	}
	expected := time.Unix(1700000000, 0)
	if !sessions[0].LastActivity.Equal(expected) {
		t.Errorf("session[0].LastActivity = %v, want %v", sessions[0].LastActivity, expected)
	}

	// Second session: detached
	if sessions[1].Name != "work" {
		t.Errorf("session[1].Name = %q, want %q", sessions[1].Name, "work")
	}
	if sessions[1].Windows != 5 {
		t.Errorf("session[1].Windows = %d, want %d", sessions[1].Windows, 5)
	}
	if sessions[1].Attached {
		t.Error("session[1].Attached = true, want false")
	}
}

func TestParseSessions_EmptyOutput(t *testing.T) {
	sessions, err := ParseSessions("")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 0 {
		t.Fatalf("expected 0 sessions, got %d", len(sessions))
	}
}

func TestParseSessions_WhitespaceOnly(t *testing.T) {
	sessions, err := ParseSessions("  \n  \n")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 0 {
		t.Fatalf("expected 0 sessions, got %d", len(sessions))
	}
}

func TestParseSessions_MalformedLine_TooFewFields(t *testing.T) {
	// Line with only 2 fields should be skipped.
	output := "dev\t3\n"
	sessions, err := ParseSessions(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 0 {
		t.Fatalf("expected 0 sessions (malformed line skipped), got %d", len(sessions))
	}
}

func TestParseSessions_InvalidWindowCount(t *testing.T) {
	output := "dev\tnotanumber\t1\t1700000000\n"
	sessions, err := ParseSessions(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 0 {
		t.Fatalf("expected 0 sessions (invalid windows skipped), got %d", len(sessions))
	}
}

func TestParseSessions_InvalidTimestamp(t *testing.T) {
	output := "dev\t3\t1\tnotanumber\n"
	sessions, err := ParseSessions(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 0 {
		t.Fatalf("expected 0 sessions (invalid timestamp skipped), got %d", len(sessions))
	}
}

func TestParseSessions_MixedValidAndInvalid(t *testing.T) {
	output := "good\t2\t0\t1700000000\nbad\n" +
		"also_good\t1\t1\t1700001000\n"
	sessions, err := ParseSessions(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("expected 2 sessions, got %d", len(sessions))
	}
	if sessions[0].Name != "good" {
		t.Errorf("session[0].Name = %q, want %q", sessions[0].Name, "good")
	}
	if sessions[1].Name != "also_good" {
		t.Errorf("session[1].Name = %q, want %q", sessions[1].Name, "also_good")
	}
}

func TestParseSessions_TrailingNewlines(t *testing.T) {
	output := "\ndev\t3\t1\t1700000000\n\n"
	sessions, err := ParseSessions(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}
}

func TestParseSessions_SessionNameWithSpecialChars(t *testing.T) {
	// tmux session names can contain dots, dashes, underscores.
	output := "my-dev.session_1\t4\t0\t1700000000\n"
	sessions, err := ParseSessions(output)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}
	if sessions[0].Name != "my-dev.session_1" {
		t.Errorf("session[0].Name = %q, want %q", sessions[0].Name, "my-dev.session_1")
	}
}
