# OpenCode plugins

OpenCode loads these global plugins from its configuration directory.
`gateway-keys/index.ts` uses the OpenCode V2 plugin API.
OpenCode auto-loads this plugin and permits live key registration on eligible requests.
To disable it, add `-rfhold.gateway-keys` to the configuration's `plugins` array.
OpenCode watches global plugin files; activation permits writes to the gateway's private key API.

## Repository gateway keys

The plugin shares one repository key across the `homelab`, `openai`, `bifrost`, and `anthropic` provider IDs.
It does not add providers or change provider configuration.
The current configuration defines `homelab` and points the built-in `openai` and `anthropic` providers at the gateway.
It does not define `bifrost`.

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

## Gateway model prefixes

`gateway-prefix/index.ts` registers a model transform for two built-in providers:

- `anthropic` upstream model IDs receive `claude/`.
- `openai` upstream model IDs receive `codex/`.

The config points both providers at the gateway, so catalog models route without a custom model list.
The `openai` provider uses HTTP transport for the gateway.
Catalog IDs and variants stay intact; only upstream model IDs change.
IDs that already carry their provider's prefix stay unchanged.
Other providers stay unchanged.

```sh
bun test ./.config/opencode/plugins/gateway-prefix
```

## Fast mode

`fast-mode/index.ts` adds `/fast` for the current session, independently of `gateway-prefix`:

- `/fast` selects the fastest available sibling: `ultrafast`, then `fast`.
- `/fast fast` and `/fast ultrafast` select that exact mode, with no fallback.
- `/fast off` selects the standard sibling.
- `/fast status` reports the current mode and supported modes, with no model change.

Sibling IDs must match the exact base catalog ID and upstream model ID on the same built-in provider.
The command removes a current `-fast` or `-ultrafast` suffix before lookup.
Only available, enabled catalog models qualify; the command never creates models or overrides request bodies.
Unsupported selections stay unchanged, with an explanation.
The command preserves the selected reasoning variant when the target supports it; otherwise, it clears the variant with an explanation.
Unknown arguments, files, agent mentions, and skills reject the command before any model change.
Acknowledgments use `resume: false`; the command starts no agent turn and changes no global defaults.
An absent session model stays absent; the command never guesses a default or another family.
Tests use mocks; Desktop/TUI behavior requires a separate live check.

```sh
bun test ./.config/opencode/plugins/fast-mode
```

## Autopilot

`autopilot/index.ts` registers `supervisor` and `worker`.
`/autopilot onboard` asks the current agent to interview you about communication, responsibilities, and where to keep notes.
It also explores project goals, inbox use, workstreams, and initiative.
It does not switch agents or add automatic note storage.
`autopilot/prompts.ts` holds the supervisor, worker, and onboarding prompts.
The context hook appends role guidance to supervisor and worker agent-loop requests alongside the default base prompt.
The supervisor prompt favors one worker session per workstream, with session reuse for follow-up work.
Onboarding choices and later user instructions guide how both roles operate.
It relays native subagent permission requests to the nearest ancestor with `supervisor` selected.
Each durable synthetic notification includes the native request as evidence, not authority.
Its short description labels the notification in the native Updates display; the full request remains model-visible.
Notifications can resume an idle supervisor and spend model tokens.
Native operator permission controls remain available.
Ordinary session trees receive no notifications.

The supervisor's ordered agent permissions allow the native `subagent` tool only with `agent: "worker"` and deny all other targets.
The plugin relies on native permissions alone; session or global rules can override these agent permissions.
No executor hook enforces a separate delegation restriction.
A continuation with `agent: "worker"` can switch a child to worker, as the native tool permits.

Worker uses subagent mode, broad default tool access, and no custom system prompt or model.
It retains OpenCode's default base prompt and native model inheritance.
Worker permits delegation to `general`, `explore`, and other configured subagents, subject to configured permissions and native limits.
The plugin does not loosen General or Explore restrictions.
The current `experimental.subagent_depth: 2` permits supervisor → worker → regular subagent.
Native mode checks still reject primary-only targets.
These rules cover the native `subagent` tool, not shell commands or session controls as an OS sandbox.

The supervisor has exactly three decision tools:

- `autopilot_allow_once({sessionID, requestID})`
- `autopilot_allow_always({sessionID, requestID})`
- `autopilot_reject({sessionID, requestID, message})`, with a nonblank message of at most 4,000 characters.

Each executor verifies the caller's current supervisor selection, actual ancestry, nearest-supervisor scope, and the native request.
Workers and unrelated supervisors cannot decide these requests.
The plugin conceals these tools from non-supervisor model requests; executor checks also protect older tool snapshots.

Always uses the native request's exact `save` patterns and action.
OpenCode 2.0.31 persists these approvals in its database per project, across sessions and service restarts.
They are not restricted to this supervisor or subtree.
Empty save patterns create no persistent rule.
Configured denies remain authoritative.
Native always can also resolve other matching requests; native rejection applies feedback to other requests in the same session.
See the pinned [permission implementation](https://github.com/anomalyco/opencode/blob/v2.0.31/packages/core/src/permission.ts)
and [saved approvals](https://github.com/anomalyco/opencode/blob/v2.0.31/packages/core/src/permission/saved.ts).

Audit records use `decisions/<random UUID>` under plugin storage `rfhold.autopilot` in the local OpenCode database.
Each authorized attempt records the timestamp, trusted supervisor identity, target session, request ID, decision, message, and native request summary.
The summary retains at most 12,000 JSON text characters; error details have the same limit.
Intent writes precede native replies; final writes record success or error and the native reply's certainty.
Stale requests also produce error records.
An intent-storage failure prevents the reply.
An outcome-storage failure reports uncertainty and prohibits automatic retries.
Crashes can leave an intent record without a final outcome; no transaction joins storage and permission replies.
Records can contain sensitive request details and feedback; no automatic expiry or secret redaction exists.
The plugin has no audit viewer, polling, reconciliation, dispatch replacement, or automatic decision policy.
Unload aborts the event subscription; events during downtime receive no replay.

```sh
bun test ./.config/opencode/plugins/autopilot
bunx --no-install tsc -p .config/opencode/plugins/autopilot/tsconfig.json
```

Tests use native agent defaults and schema validation with mocked plugin callbacks.
Rule tests reflect native last-match precedence and session-rule order; executor tests use the native hook fields and `agent` input.
See the [v2.3.0 subagent tool](https://github.com/anomalyco/opencode/blob/v2.3.0/packages/core/src/tool/plugin/subagent.ts)
and [permission evaluator](https://github.com/anomalyco/opencode/blob/v2.3.0/packages/core/src/permission.ts).
Tests make no real permission decisions or inference requests.

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

## Delegation model guidance

`model-guidance/index.ts` appends delegation guidance on the agent-loop `context` hook.
Each request selects its profile from `event.model.providerID`: `openai` or `anthropic`.
Provider switches take effect on the next context; other providers receive no extra prompt.
Title, compaction, and transient generation hooks receive no guidance.
The shared prompt and provider preferences live in `model-guidance/prompts.ts`.
These assignments describe user preferences, not benchmark results.

The default is to omit the subagent model parameter. Discretionary selection requires current
user authorization and permission under the applicable tool instructions. Explicit requests
take precedence over preferences; revocation restores defaults. The prompt requires checking
selectable provider/model IDs and preserves delegation scope, agent roles, and permissions.
Fast variants and reasoning overrides require authorization.

The current subagent tool permits a model override only when the user names a specific model
or variant. Broad authorization to choose models does not satisfy that restriction.
The plugin states this limitation; it only appends text and neither parses authorization nor
changes models, tool descriptions, or permissions. It grants no additional delegation authority.
To disable it, add `-rfhold.model-guidance` to the configuration's `plugins` array.

From the dot repository root:

```sh
bun test ./.config/opencode/plugins/model-guidance
bunx tsc --project .config/opencode/plugins/model-guidance/tsconfig.json --noEmit
```

The plugin uses installed `@opencode/plugin@2.0.31` and its mutable context `system` array.
See the [server plugin hooks](https://opencode.ai/docs/build/plugins/server#hooks).
