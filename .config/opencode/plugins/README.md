# OpenCode plugins

OpenCode loads these global plugins from its configuration directory.
`gateway-keys/index.ts` uses the OpenCode V2 plugin API.
OpenCode auto-loads this plugin and permits live key registration on eligible requests.
To disable it, add `-rfhold.gateway-keys` to the configuration's `plugins` array.
OpenCode watches global plugin files; activation permits writes to the gateway's private key API.

## Repository gateway keys

The plugin shares one repository key across the `homelab`, `codex`, `bifrost`, and `anthropic` provider IDs.
It does not add providers or change provider configuration.
The current configuration defines `homelab` and `codex`, points the built-in `anthropic` provider at the gateway, but does not define `bifrost`.

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

## Anthropic gateway

`anthropic-gateway/index.ts` registers a model transform that prefixes every `anthropic` upstream model ID with `claude/`.
The config points the built-in `anthropic` provider at the gateway, so catalog models route without a maintained alias list.
IDs that already carry the prefix stay unchanged.

```sh
bun test ./.config/opencode/plugins/anthropic-gateway
```

## Session reminders

`reminders/index.ts` adds exactly two tools:

- `set_reminder({seconds: 60, message: "Check progress."})` sets or replaces the caller session's interval.
- `unset_reminder({})` cancels only the caller session's interval; repeated calls do nothing.

Plugin instances share one in-memory registry across locations, so a session has at most one interval per service process.
Seconds accept finite values from `0.001` through `2147483.647`; messages require nonblank text.
The first reminder follows one full interval.
Each tick submits the exact message as a new user prompt with `delivery: "steer"` to that same session.
Busy sessions receive reminders at a step boundary; idle sessions resume model activity and can spend tokens.
No interval starts until a session calls `set_reminder`.

Ticks skip prompt admission while the previous admission remains unresolved; they do not wait for the model's response.
Any admission failure stops that interval and emits a fixed warning, including when the session no longer exists.
Cancellation and replacement prevent future admissions but cannot retract a prompt call that already started or a reminder that OpenCode already admitted.
Each plugin instance clears its own intervals on unload.
Reload and service shutdown also clear intervals; nothing persists.

From the dot repository root, run deterministic tests with no live reminders:

```sh
bun test ./.config/opencode/plugins/reminders
```

## Autopilot

`autopilot/index.ts` adds `/autopilot <instructions>`, `/autopilot status`, and `/autopilot stop` for server-backed Desktop and TUI commands.
The command starts supervision immediately and silently, with no worker prompt, acknowledgment, or immediate supervisor review.
Instructions guide only the supervisor; Autopilot never copies them into worker prompts, including later nudges.
The worker's next turn occurs naturally; no special next-message gate applies.
Status shows `active` after startup. Stop before a new command changes the supervisor instructions.
The separate, tool-free `autopilot` agent inherits the worker model and acts on your behalf.
If the worker has not selected a model, selection stays with OpenCode's native defaults.
The worker keeps its agent, tools, permission configuration, and normal allowed operations.
Autopilot adds no worker restrictions or persistent permission grants.
Status and stop do not resume the worker.
Stop preserves current foreground work and background processes.

Install the pinned plugin-local dependencies after checkout, including when `~/.config/opencode` is a symlink:

```sh
bun install --cwd "$HOME/.config/opencode/plugins/autopilot" --frozen-lockfile --ignore-scripts --omit=peer
```

The local manifest exports `index.ts` as the server entrypoint; its plugin ID remains `rfhold.autopilot`.
Keep this dependency tree local: repository-root dependencies do not reliably resolve through the config symlink.

Normal local shared-background-server sessions need no connection environment variables.
On startup, `Service.discover()` finds an existing healthy, compatible local
service; `Service.headers(endpoint)` supplies its authentication when configured.
Discovery never ensures, starts, or stops a service, and does not run while Autopilot is inactive.

Standalone/custom servers can override discovery with both server-environment variables:

- `OPENCODE_AUTOPILOT_URL`: an HTTPS origin or loopback HTTP origin, without a path or credentials.
- `OPENCODE_AUTOPILOT_AUTHORIZATION`: the complete authorization header value, supplied through your secret environment mechanism.

Setting only one variable, or leaving an explicit value blank, fails closed; explicit and
discovered credentials are never combined. Explicit overrides skip discovery entirely.
Native discovery trusts the local service registration and performs its authenticated
health probe before the plugin validates the returned URL. That SDK probe permits
redirects and has no transport override; use the explicit pair to skip this discovery trust boundary.
For requests after discovery, the bridge rejects unsafe origins and redirects and verifies an in-memory RPC nonce
before task-session operations, every subsequent review, and supervisor cleanup.
A second server with the same database does not satisfy this check.
No discovered endpoint, discovery errors, a nonce mismatch, or API errors fail closed;
the plugin never guesses an alternate server. A verified connection is retained for that
run to avoid repeated health probes; a new run resolves its connection again.
Discovery waits are bounded by the run's 30-second request/abort timeout. The native
discovery probe has no cancellation parameter: an already-started read-only probe may
finish later, but its late result cannot admit task-session operations.
No global configuration changes are necessary.

State supervisor instructions and limits, then send the worker's task as an ordinary message:

```text
/autopilot Check the parser tests. Keep changes local; ask me about ambiguous behavior.
Fix the parser bug and run its tests.
```

Normal session events and the poll trigger reviews after startup; startup itself does not trigger a review.
Lifecycle changes, completion, failures, reload, and unload produce no automatic worker messages.
Only supervisor-judged intervention produces unsolicited main-session speech, after fresh evidence confirms an idle worker or a question/permission wait.
Nudges resume only an idle worker. Human escalations do not resume it; explicit status and stop replies also do not resume it.

The supervisor derives ordinary task answers and pending permission decisions from your goal.
Permission approvals use `once`, never `always`; configured denials are not bypassed.
Human rejection stops monitoring. Uncertain choices and unsupported external forms return to you.
Local goal work is the default authorization. Commits, pushes, publication, deployments,
destructive work, external decisions, and scope expansion need explicit human authority.
Goal interpretation and risk classification are model judgments, not a security sandbox.
Code validates decision structure, goal excerpts, exact pending request identity/content,
worker ownership, freshness, and late/duplicate decisions before proxy actions.
Transcript, form, permission, and shell content cannot supply additional human authority.
The obsolete `--scope` JSON syntax is rejected.

The plugin observes actual session activity, direct-child activity, tool state, inbox entries, and transcript-linked shells.
Direct children in other worktrees count as wakeup sources; their shells are inspected read-only and never become cancellation targets.
Inspection is bounded to 16 direct children and eight worker-owned running shells; larger inventories fail closed.
Child inventory follows cursors, including short or empty pages, with limits of eight pages and 256 scanned records.
Repeated cursors or real inventory limits fail closed; a next cursor alone does not indicate overflow.
A 15-second poll supplies a wakeup after background activity ends; legitimate background work does not trigger an idle poke.
Live intervals from the local `reminders` plugin are observed read-only through its shared registry.
The native API does not inventory arbitrary future plugin timers; other undisclosed wakeups may be invisible.
The plugin never answers child requests or cancels unrelated shells.
Shells without a transcript ownership link remain outside cancellation authority.
Long shells are reviewed at most every two minutes. Cancellation needs a fresh snapshot,
a goal-authorized supervisor decision, and concrete positive output evidence of stuck or suboptimal execution.
Stuck decisions also require unchanged samples across two minutes; suboptimal execution may still produce output.
Cancellation rechecks exact shell identity (ID, command, directory, start time), ownership,
running status, and the diagnostic excerpt. Advancing logs do not invalidate a suboptimal
decision when that execution and diagnostic remain current; other actions retain full snapshot checks.
Age or silence alone never authorizes cancellation.

Each run permits 24 supervisor reviews, 12 interventions, one hour, and two consecutive failures.
Supervisor output permits at most 1,000 tokens per review; retries remain disabled.
Supervisor data permits at most 48,000 characters of structured JSON.
Goal, activity, pending forms/permissions, and owned-shell evidence remain complete; oversized critical data pauses without inference.
The full transcript is retained when it fits. Budgeted excerpts and omitted messages are marked.
A completion proposal with historical omissions selects 1–8 exact transcript indices for one
extra review of those messages unabridged, the trusted goal, and fresh current critical state.
Only an explicit full-goal verification acknowledging every selected index can finish;
irrelevant older omissions do not permanently veto completion. Both reviews count toward the same budget.
Missing, inconclusive, or oversized required evidence returns to the human. The selected
whole messages and critical state must fit 48,000 characters; there is no further retrieval round.
Duplicate triggers do not spend another review; a deferred poke is reconsidered after its cooldown.
Pokes require two minutes between interventions.
Each poke requires a concrete unfinished task, a task-specific worker instruction, and an exact indexed transcript quote.
The quote must occur in the latest message with nonempty user or assistant text; later completion text supersedes older unfinished reports.
Idle, model-switch, tool-only, and empty-text records do not supersede that quote source.
The supervisor still considers all later records, including tool results, for contradiction or completion; quote selection does not remove snapshot evidence.
The supervisor checks whether current evidence still shows unfinished work; completed or contradicted tasks receive no poke.
The controller checks the quote and the fresh snapshot before it sends the supervisor's specific instruction, not a generic continuation prompt.
Supervisor-only instructions remain separate. These checks verify evidence references, not semantic task completion without supervisor judgment.
Completion, unclear authority, human rejection, repeated failures, and exhausted budgets end active supervision.
An uncertain mutation outcome pauses immediately; the plugin never blindly repeats that mutation.
`status` shows the latest eight log entries.
Failed reviews report controlled operation or inventory-limit diagnostics in status, not raw API errors or payloads.
Reload or unload clears owned timers, subscriptions, supervisor records, and review authority; nothing resumes from storage.
Supervisor-record cleanup is best effort if the bridge is unavailable.
Stop blocks late decisions but cannot retract an API mutation that already began.
These controls constrain plugin authority, not the host shell or independent agents.
Desktop/TUI end-to-end behavior requires a separate live check.

From the dot repository root:

```sh
bun test ./.config/opencode/plugins/autopilot ./.config/opencode/plugins/reminders
bunx tsc --project .config/opencode/plugins/autopilot/tsconfig.json --noEmit
```

The implementation targets installed `@opencode/plugin` and `@opencode/client` version `2.0.31`.
See the [server plugin API](https://opencode.ai/docs/build/plugins/server) and [client API](https://opencode.ai/docs/build/client).
