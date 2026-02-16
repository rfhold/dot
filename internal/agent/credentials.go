package agent

import (
	"context"
	"net/http"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2/clientcredentials"
)

// NewTokenClient performs OIDC discovery and returns an HTTP client that
// automatically manages client-credentials access tokens.
func NewTokenClient(ctx context.Context, issuerURL, clientID, clientSecret string) (*http.Client, error) {
	provider, err := oidc.NewProvider(ctx, issuerURL)
	if err != nil {
		return nil, err
	}

	tokenEndpoint := provider.Endpoint().TokenURL

	config := &clientcredentials.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		TokenURL:     tokenEndpoint,
		Scopes:       []string{"openid"},
	}

	return config.Client(ctx), nil
}
