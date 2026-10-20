# OpenCode plugins

OpenCode loads these global plugins from its configuration directory.
`gateway-keys/index.ts` uses the OpenCode V2 plugin API.
OpenCode auto-loads this plugin and permits live key registration on eligible requests.
To disable it, add `-rfhold.gateway-keys` to the configuration's `plugins` array.
OpenCode watches global plugin files; activation permits writes to the gateway's private key API.

## Repository gateway keys

The plugin shares one repository key across the `homelab`, `codex`, `bifrost`, and `claude` provider IDs.
It does not add providers or change provider configuration.
The current configuration defines `homelab`, `codex`, and `claude`, but not `bifrost`.

The plugin uses `http.request` and `experimental.ws.handshake` hooks for every request kind:
`primary`, `title`, `compaction`, and session `generate`.
Each hook reads `ctx.session.get({ sessionID }).location.directory` before Git discovery.
Session moves therefore change attribution on subsequent calls.
The plugin never uses its instance location as the session location.
Sessionless `ctx.generate.text` has no session hooks and receives no repository attribution.

### Identity and cache

Git origins normalize to `host/path`, for example `github.com/rfhold/homelab`.
SSH URLs, HTTPS URLs, and SCP syntax share this identity.
The identity excludes usernames, passwords, query strings, fragments, and the `.git` suffix.
Host names use lowercase; repository paths retain case.
Nondefault ports remain part of the identity.
Distinct hosts remain distinct, even when their repository paths match.
Worktrees share the origin identity.

Without a usable origin, the identity uses `local/<sha256>` of the canonical Git common directory.
Outside Git, it uses the canonical session directory instead.
Gateway metadata never includes an absolute local path.
Directory moves change this fallback identity.

The cache lives at `$XDG_STATE_HOME/opencode/gateway-keys`, or `~/.local/state/opencode/gateway-keys` by default.
Directories use mode `0700`; key files use mode `0600`.
Keys use 32 cryptographically random bytes.
Atomic file writes persist each key with `ready: false` before the API request.
A per-repository directory lock coordinates separate processes.
Lock waits stop after eight seconds.
Dead-owner locks recover automatically; ownerless locks require thirty seconds of age first.
A recovery guard serializes dead-owner checks.
A crash inside recovery can leave its guard behind; subsequent attempts fail open after the bounded wait.
Manual cache repair requires a separate user decision after all OpenCode processes stop.

The plugin submits only `sha256:<64 lowercase hex>` to the fixed config resource API.
The collection PUT omits the resource ID and preserves other keys.
Metadata contains `name: opencode:<identity>`, `user: rfhold`, and `group: <identity>`.
The gateway uses `metadata.group` for Analytics Group.
A successful registration remains in memory and the private cache.
Later model requests do not repeat registration.

After an uncertain API result, the next attempt first lists keys and compares their hashes.
A matching hash completes the cache record without another create.
Otherwise, the plugin retries the same key.
This recovery requires hybrid storage and hash records from the config resource list API.
The plugin never deletes gateway keys.

### Safety and failure behavior

The plugin attaches credentials only when the initial URL matches `https://agent-gateway.holdenitdown.net`, or its `wss` equivalent, on these exact paths:

- `/v1/chat/completions`
- `/v1/responses`
- `/v1/messages`
- `/v1/messages/count_tokens`

The provider ID must also match the four-ID allowlist.
Headers use the repository key only in `Authorization: Bearer`.
The plugin removes `x-api-key` and `api-key`, and preserves unrelated headers.
Agentgateway's default policy reads bearer authorization and removes that header after successful key validation.
No duplicate repository-key header remains for credential-free backends after that removal.

OpenCode 2.0.31 converts hook requests through `HttpClientRequest.fromWeb`, which drops `Request.redirect`.
The plugin therefore does not claim HTTP redirect rejection.
Its HTTP hook cannot configure the Effect fetch service or intercept native redirect hops through the documented API.
The installed Effect `FetchHttpClient` passes request headers to native fetch and supplies no redirect override.
Bun 1.3.12 removes `Authorization` on a cross-origin redirect; its pinned HTTP implementation checks the origin before that removal.
Only bearer authorization carries the repository key, so no duplicate key header survives that boundary.
Same-origin redirects retain authorization and can target paths outside the initial path allowlist.
This mechanism protects the repository key across origins, not the inference body or every redirect destination.
A requirement to reject every model redirect needs a separate transport change and authority.
Config API requests bypass that conversion, explicitly reject redirects, and stop after three seconds.

WebSocket handshake hooks run before socket selection, so a different repository key selects another connection.
OpenCode 2.0.31 uses Bun's native WebSocket constructor under Bun and explicitly sets `followRedirects: false` under Node.
Bun 1.3.12 rejects handshake status codes other than `101`; its upgrade client does not follow redirect locations.
These source checks establish WebSocket redirect behavior; local tests do not open sockets.
Runtime upgrades require another check of these transport guarantees.

On cache, discovery, or API failure, the plugin preserves the original request and emits a fixed, sanitized warning.
The warning and failed registration attempts have thirty-second limits.
No warning includes paths, keys, hashes, response bodies, or headers.
Fail-open behavior preserves open-client access but leaves an attribution gap.

The plugin pauses briefly after registration but does not replay inference requests on `401`.
A replay could duplicate inference work; permissive authentication also accepts an unrecognized key without `401`.
Asynchronous gateway propagation can therefore leave the first request unattributed.
In permissive mode, unsuccessful validation also preserves bearer authorization; this condition does not provide the valid-key consumption guarantee.
The plugin does not detect remote key deletion or gateway database replacement after a successful registration.
Those events require explicit cache repair; the plugin does not rotate keys automatically.

The private-LAN self-service config API remains open by explicit user choice.
This plugin supplies attribution, not authentication hardening, budgets, or access control.
Gateway bootstrap must enable hybrid storage and `llm.policies.apiKey` before registration succeeds.
The current legacy `bifrost/*` routes do not inherit database keys from `llm.policies.apiKey.keys`.
The `bifrost` provider hook supports the same gateway destination, but legacy `bifrost/*` traffic lacks attribution under the current gateway contract.
This plugin does not convert those routes or duplicate their policy lifecycle.
Live HTTP, WebSocket, propagation, and Analytics Group behavior require separate authorized runtime verification.

## Local tests

From the dot repository root:

```sh
bun test ./.config/opencode/plugins/gateway-keys
```

Tests use temporary Git repositories, private temporary caches, subprocesses, and an injected config API mock.
`transport.test.ts` exercises OpenCode's request conversion with the installed Effect client and an injected fetch mock.
It checks the actual fetch input, the absent redirect override, and the bearer-only header contract.
The gateway-consumption assertion removes the default authorization header; pinned gateway source supplies evidence for that removal.
Redirect safety depends on the pinned native-runtime source below, not a mock redirect implementation.
Tests never contact the gateway or an OpenCode service.

## API references

- [OpenCode V2 plugins](https://opencode.ai/v2/docs/build/plugins): lifecycle, session hooks, and instance location scope.
- [OpenCode V2 OpenAPI](https://opencode.ai/v2/openapi.json): `Session.Info.location` and `Location.PublicRef.directory`.
- Installed `@opencode/plugin@2.0.31`, `dist/promise/session.d.ts`: mutable `request`, WebSocket `url`/`headers`, and the four request kinds.
- [OpenCode 2.0.31 model requests](https://github.com/anomalyco/opencode/blob/v2.0.31/packages/core/src/session/model-request.ts): hook conversion through `HttpClientRequest.fromWeb`.
- Installed `effect@4.0.1`, `src/http/FetchHttpClient.ts`: native fetch headers and service-level options.
- [Bun 1.3.12 HTTP](https://github.com/oven-sh/bun/blob/bun-v1.3.12/src/http.zig): redirect origin comparison and `Authorization` removal.
- [OpenCode 2.0.31 WebSocket constructor](https://github.com/anomalyco/opencode/blob/v2.0.31/packages/core/src/effect/websocket-constructor.ts): native Bun constructor and Node redirect rejection.
- [Bun 1.3.12 WebSocket upgrade](https://github.com/oven-sh/bun/blob/bun-v1.3.12/src/http/websocket_client/WebSocketUpgradeClient.zig): `handleData`, `handleDecryptedData`, and `processResponse` reject non-`101` responses.
- [Agentgateway v1.5.0 authorization location](https://github.com/agentgateway/agentgateway/blob/v1.5.0/crates/agentgateway/src/http/auth/mod.rs): default bearer header and single-header removal.
- [Agentgateway v1.5.0 APIKeyHash](https://github.com/agentgateway/agentgateway/blob/v1.5.0/crates/agentgateway/src/http/apikey.rs): SHA-256 bytes, hex encoding, and required `sha256:` prefix.
- [Config resources](https://agentgateway.dev/docs/standalone/1.5.x/documentation/operations/config-resources/): collection create, list response, hybrid storage, and asynchronous propagation.
