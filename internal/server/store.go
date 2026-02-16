package server

import (
	"context"
	"sync"
	"time"

	"dev.rholden.dot/internal/models"
)

// Store is a thread-safe in-memory store for machine session data.
type Store struct {
	mu       sync.RWMutex
	machines map[string]*models.Machine
	ttl      time.Duration
}

// NewStore creates a Store that considers machines stale after ttl.
func NewStore(ttl time.Duration) *Store {
	return &Store{
		machines: make(map[string]*models.Machine),
		ttl:      ttl,
	}
}

// Update upserts machine data from a PushRequest.
func (s *Store) Update(req models.PushRequest) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.machines[req.MachineName] = &models.Machine{
		Name:     req.MachineName,
		SSHHost:  req.SSHHost,
		SSHUser:  req.SSHUser,
		Sessions: req.Sessions,
		LastSeen: time.Now(),
	}
}

// GetAll returns a copy of all machines whose LastSeen is within the TTL.
func (s *Store) GetAll() []models.Machine {
	s.mu.RLock()
	defer s.mu.RUnlock()

	cutoff := time.Now().Add(-s.ttl)
	result := make([]models.Machine, 0, len(s.machines))
	for _, m := range s.machines {
		if m.LastSeen.After(cutoff) {
			// Return a deep copy so callers cannot mutate internal state.
			cp := *m
			cp.Sessions = make([]models.TmuxSession, len(m.Sessions))
			for i, sess := range m.Sessions {
				cp.Sessions[i] = sess
				if len(sess.WindowDetails) > 0 {
					cp.Sessions[i].WindowDetails = make([]models.TmuxWindow, len(sess.WindowDetails))
					for j, win := range sess.WindowDetails {
						cp.Sessions[i].WindowDetails[j] = win
						if len(win.Panes) > 0 {
							cp.Sessions[i].WindowDetails[j].Panes = make([]models.TmuxPane, len(win.Panes))
							copy(cp.Sessions[i].WindowDetails[j].Panes, win.Panes)
						}
					}
				}
			}
			result = append(result, cp)
		}
	}
	return result
}

// StartCleanup runs a background goroutine that removes stale machines every
// interval. It stops when ctx is cancelled.
func (s *Store) StartCleanup(ctx context.Context, interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.cleanup()
			}
		}
	}()
}

func (s *Store) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	cutoff := time.Now().Add(-s.ttl)
	for name, m := range s.machines {
		if m.LastSeen.Before(cutoff) {
			delete(s.machines, name)
		}
	}
}
