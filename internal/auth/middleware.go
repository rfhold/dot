package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
)

type contextKey string

const (
	contextKeySub   contextKey = "sub"
	contextKeyEmail contextKey = "email"
)

// TokenVerifier verifies a raw token string and returns the parsed IDToken.
// This interface exists to allow test doubles for the OIDC verifier.
type TokenVerifier interface {
	Verify(ctx context.Context, rawToken string) (*oidc.IDToken, error)
}

// OIDCAuth validates Bearer tokens using OIDC discovery.
type OIDCAuth struct {
	verifier          TokenVerifier
	acceptedClientIDs []string
}

// NewOIDCAuth performs OIDC discovery against issuerURL and returns an
// authenticator that accepts tokens whose aud claim contains at least one of
// the provided clientIDs.
func NewOIDCAuth(ctx context.Context, issuerURL string, clientIDs []string) (*OIDCAuth, error) {
	provider, err := oidc.NewProvider(ctx, issuerURL)
	if err != nil {
		return nil, err
	}

	verifier := provider.Verifier(&oidc.Config{
		SkipClientIDCheck: true,
	})

	return &OIDCAuth{
		verifier:          verifier,
		acceptedClientIDs: clientIDs,
	}, nil
}

// NewOIDCAuthWithVerifier creates an OIDCAuth using the provided TokenVerifier.
// This is intended for testing, allowing injection of a mock verifier.
func NewOIDCAuthWithVerifier(verifier TokenVerifier, clientIDs []string) *OIDCAuth {
	return &OIDCAuth{
		verifier:          verifier,
		acceptedClientIDs: clientIDs,
	}
}

// Middleware returns an http.Handler that validates the Authorization Bearer
// token on every request. On success it stores the subject and email claims in
// the request context; on failure it responds with 401 JSON.
func (a *OIDCAuth) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			writeAuthError(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			writeAuthError(w, http.StatusUnauthorized, "invalid authorization header format")
			return
		}
		rawToken := parts[1]

		idToken, err := a.verifier.Verify(r.Context(), rawToken)
		if err != nil {
			writeAuthError(w, http.StatusUnauthorized, "invalid token: "+err.Error())
			return
		}

		// Extract claims to check audience and get user info.
		var claims struct {
			Sub   string        `json:"sub"`
			Email string        `json:"email"`
			Aud   claimAudience `json:"aud"`
		}
		if err := idToken.Claims(&claims); err != nil {
			writeAuthError(w, http.StatusUnauthorized, "failed to parse claims: "+err.Error())
			return
		}

		if !a.audienceAccepted(claims.Aud) {
			writeAuthError(w, http.StatusUnauthorized, "token audience not accepted")
			return
		}

		ctx := context.WithValue(r.Context(), contextKeySub, claims.Sub)
		ctx = context.WithValue(ctx, contextKeyEmail, claims.Email)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// audienceAccepted returns true when at least one value in aud matches one of
// the accepted client IDs.
func (a *OIDCAuth) audienceAccepted(aud []string) bool {
	for _, a1 := range aud {
		for _, a2 := range a.acceptedClientIDs {
			if a1 == a2 {
				return true
			}
		}
	}
	return false
}

// claimAudience handles the JWT aud claim which may be a single string or an
// array of strings.
type claimAudience []string

func (c *claimAudience) UnmarshalJSON(data []byte) error {
	// Try single string first.
	var single string
	if err := json.Unmarshal(data, &single); err == nil {
		*c = []string{single}
		return nil
	}

	// Otherwise try array.
	var multi []string
	if err := json.Unmarshal(data, &multi); err != nil {
		return err
	}
	*c = multi
	return nil
}

// SubjectFromContext returns the "sub" claim stored by the auth middleware.
func SubjectFromContext(ctx context.Context) string {
	v, _ := ctx.Value(contextKeySub).(string)
	return v
}

// EmailFromContext returns the "email" claim stored by the auth middleware.
func EmailFromContext(ctx context.Context) string {
	v, _ := ctx.Value(contextKeyEmail).(string)
	return v
}

func writeAuthError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
