# Tmux Viewer

An Android app + Go backend system to view remote tmux sessions and launch SSH connections via Termux.

## Architecture

```
┌─────────────┐    push sessions    ┌──────────────┐    query API    ┌──────────────┐
│ Dev Machine │ ──────────────────> │    Server    │ <───────────── │  Android App │
│ (tmux-agent)│    POST /api/       │ (tmux-server)│    GET /api/    │ (Kotlin/     │
│ runs tmux   │    sessions         │ holds state  │    sessions     │  Compose)    │
└─────────────┘                     │ serves API   │                 └──────┬───────┘
                                    └──────┬───────┘                        │
                                           │                                │ tap session
                                    ┌──────┴───────┐                        v
                                    │  Authentik   │               ┌──────────────┐
                                    │  (OIDC)      │               │   Termux     │
                                    └──────────────┘               │ ssh + tmux   │
                                                                   │   attach     │
                                                                   └──────────────┘
```

### Components

1. **tmux-server** (Go) - Central API server that stores session state from registered machines and serves it to the Android app
2. **tmux-agent** (Go) - Runs on dev machines, periodically pushes tmux session state to the server
3. **Android app** (Kotlin/Jetpack Compose) - Displays sessions, authenticates via Authentik OIDC, launches Termux SSH intents

### Data Flow

1. tmux-agent runs `tmux list-sessions` on the dev machine every 10 seconds
2. Agent authenticates with Authentik using OIDC Client Credentials flow and pushes session data to tmux-server
3. Android app authenticates with Authentik using OIDC Authorization Code + PKCE flow
4. App queries tmux-server for session list, displays grouped by machine
5. User taps a session -> app sends Termux `RUN_COMMAND` intent: `ssh user@host -t 'tmux attach -t <session>'`
6. Termux opens a foreground terminal with the SSH session attached to tmux

### Authentication

All authentication flows through Authentik (self-hosted OIDC provider). Two separate OIDC clients are needed:

| Client | Type | Flow | Purpose |
|--------|------|------|---------|
| `tmux-viewer-android` | Public | Authorization Code + PKCE | Android app user login |
| `tmux-agent` | Confidential | Client Credentials | Machine-to-machine agent auth |

Both clients share the same Authentik issuer. The server validates Bearer tokens from both using `coreos/go-oidc` against the JWKS endpoint.

## Project Structure

```
go.mod                              # Single Go module: dev.rholden.dot
go.sum
cmd/
  tmux-server/
    main.go                         # Server entrypoint, config, HTTP setup
  tmux-agent/
    main.go                         # Agent entrypoint, config, main loop
internal/
  auth/
    middleware.go                    # OIDC token validation middleware (coreos/go-oidc)
  models/
    session.go                      # TmuxSession, Machine, PushRequest structs
  server/
    handlers.go                     # HTTP handlers: GET/POST /api/sessions, GET /health
    store.go                        # In-memory session store with TTL expiry
  agent/
    tmux.go                         # Parse `tmux list-sessions` output
    pusher.go                       # HTTP client to push sessions to server
    credentials.go                  # OIDC Client Credentials token fetcher
android/
  app/
    src/main/
      java/dev/rholden/dot/
        MainActivity.kt             # Single-activity Compose host
        TmuxViewApp.kt              # Application class, DI setup
        auth/
          AuthManager.kt            # AppAuth OIDC wrapper (discovery, login, refresh)
        api/
          TmuxApiClient.kt          # OkHttp client with Bearer token interceptor
        data/
          Models.kt                 # Session, Machine data classes (Kotlin Serialization)
          SessionRepository.kt      # Repository pattern, caches + fetches from API
          SettingsStore.kt           # DataStore for user preferences
        service/
          TermuxLauncher.kt         # Build and send RUN_COMMAND intent to Termux
        ui/
          navigation/
            NavGraph.kt             # Compose Navigation routes
          screens/
            LoginScreen.kt          # OIDC sign-in screen
            SessionListScreen.kt    # Main session list with pull-to-refresh
            SettingsScreen.kt       # Server URL, SSH defaults, auth config
          components/
            SessionCard.kt          # Single session card (name, windows, status)
            MachineHeader.kt        # Machine group header
          theme/
            Theme.kt                # Material 3 theme definition
            Color.kt                # Aura color palette
      res/
        values/
          strings.xml
          themes.xml
        mipmap-*/                   # App icons
      AndroidManifest.xml           # Permissions, redirect handler, package queries
    build.gradle.kts                # App-level build config
  build.gradle.kts                  # Project-level build config
  settings.gradle.kts               # Project settings
  gradle.properties                 # Gradle properties
  gradle/
    libs.versions.toml              # Version catalog
```

## Phase 1: Go Module + Shared Libraries

### 1.1 Go Module Initialization

Initialize a single Go module at the repo root.

```bash
go mod init dev.rholden.dot
```

Dependencies:
- `github.com/coreos/go-oidc/v3` - OIDC discovery, JWKS validation, token verification
- `golang.org/x/oauth2` - OAuth2 types, Client Credentials flow for agent
- Standard library only for HTTP server (no framework needed)

### 1.2 Data Models (`internal/models/session.go`)

```go
type TmuxSession struct {
    Name         string    `json:"name"`
    Windows      int       `json:"windows"`
    Attached     bool      `json:"attached"`
    LastActivity time.Time `json:"last_activity"`
}

type Machine struct {
    Name     string         `json:"name"`
    SSHHost  string         `json:"ssh_host"`
    SSHUser  string         `json:"ssh_user"`
    Sessions []TmuxSession  `json:"sessions"`
    LastSeen time.Time      `json:"last_seen"`
}

type PushRequest struct {
    MachineName string        `json:"machine_name"`
    SSHHost     string        `json:"ssh_host"`
    SSHUser     string        `json:"ssh_user"`
    Sessions    []TmuxSession `json:"sessions"`
}

type SessionsResponse struct {
    Machines []Machine `json:"machines"`
}
```

### 1.3 OIDC Auth Middleware (`internal/auth/middleware.go`)

Uses `coreos/go-oidc` to validate Bearer tokens.

- On startup: calls `oidc.NewProvider(ctx, issuerURL)` to perform OIDC discovery
- Creates `provider.Verifier(&oidc.Config{ClientID: clientID})` for token verification
- Middleware extracts `Authorization: Bearer <token>` header
- Calls `verifier.Verify(ctx, rawToken)` which:
  - Fetches JWKS keys from Authentik (cached by `RemoteKeySet`)
  - Validates JWT signature (RS256)
  - Checks issuer, audience, expiry
- Extracts claims (sub, email, preferred_username) into request context
- Returns 401 on any failure

Configuration:
- `AUTHENTIK_ISSUER` - e.g., `https://auth.holdenitdown.net/application/o/tmux-viewer/`
- `OIDC_CLIENT_ID` - must match the Authentik provider's Client ID

The middleware accepts tokens from both the Android app (public client, Authorization Code + PKCE) and the agent (confidential client, Client Credentials). Both produce valid JWTs signed by the same Authentik issuer. The verifier doesn't distinguish between them - it only validates the signature, issuer, audience, and expiry.

### 1.4 In-Memory Session Store (`internal/server/store.go`)

Thread-safe in-memory store. Sessions are ephemeral - if the server restarts, agents re-push within their interval.

- `map[string]*Machine` keyed by machine name, protected by `sync.RWMutex`
- `Update(req PushRequest)` - upsert machine + sessions, update `LastSeen` timestamp
- `GetAll() []Machine` - return all machines with non-expired sessions
- TTL expiry: machines not updated within `SESSION_TTL` (default 60s) are pruned
- Background goroutine runs every 30s to clean expired entries

### 1.5 HTTP Handlers (`internal/server/handlers.go`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Returns `{"status":"ok"}` |
| `GET` | `/api/sessions` | OIDC Bearer | Returns `SessionsResponse` with all machines and their sessions |
| `POST` | `/api/sessions` | OIDC Bearer | Accepts `PushRequest`, updates store. Returns 204 No Content |

Error responses use standard JSON: `{"error": "message"}` with appropriate HTTP status codes.

### 1.6 Server Entrypoint (`cmd/tmux-server/main.go`)

- Parse config from environment variables:
  - `AUTHENTIK_ISSUER` (required)
  - `OIDC_CLIENT_ID` (required)
  - `LISTEN_ADDR` (default `:8080`)
  - `SESSION_TTL` (default `60s`)
- Initialize OIDC provider and verifier
- Initialize in-memory store with TTL cleanup
- Register routes with auth middleware
- Start HTTP server with graceful shutdown on SIGINT/SIGTERM

## Phase 2: Tmux Agent

### 2.1 Tmux Session Parser (`internal/agent/tmux.go`)

Runs `tmux list-sessions` with a custom format string to get structured output:

```bash
tmux list-sessions -F '#{session_name}\t#{session_windows}\t#{session_attached}\t#{session_activity}'
```

Output format per line: `<name>\t<windows>\t<0|1>\t<epoch_timestamp>`

Parses each line into `TmuxSession` struct. Handles:
- `tmux list-sessions` returning exit code 1 when no server is running (no sessions = empty list, not an error)
- Malformed lines (log warning, skip)

### 2.2 OIDC Client Credentials Token Fetcher (`internal/agent/credentials.go`)

Uses `golang.org/x/oauth2/clientcredentials` to obtain tokens from Authentik:

```go
config := &clientcredentials.Config{
    ClientID:     os.Getenv("OIDC_CLIENT_ID"),
    ClientSecret: os.Getenv("OIDC_CLIENT_SECRET"),
    TokenURL:     tokenEndpoint, // from OIDC discovery
    Scopes:       []string{"openid"},
}
httpClient := config.Client(ctx) // auto-refreshes tokens
```

The `clientcredentials.Config.Client()` returns an `*http.Client` that automatically:
- Fetches an access token on first request
- Caches the token
- Refreshes when expired (before the request, transparent)

Token endpoint is discovered from `AUTHENTIK_ISSUER` via OIDC discovery, or can be set explicitly via `OIDC_TOKEN_URL`.

### 2.3 Session Pusher (`internal/agent/pusher.go`)

HTTP client that POSTs session data to the server.

- Uses the OIDC client credentials HTTP client for automatic token management
- Serializes `PushRequest` as JSON
- POSTs to `{SERVER_URL}/api/sessions`
- Logs response status, retries on transient failures (5xx, network errors) with exponential backoff
- On 401, logs that the OIDC credentials may be invalid

### 2.4 Agent Entrypoint (`cmd/tmux-agent/main.go`)

- Parse config from environment variables:
  - `SERVER_URL` (required) - e.g., `https://tmux.holdenitdown.net`
  - `AUTHENTIK_ISSUER` (required)
  - `OIDC_CLIENT_ID` (required)
  - `OIDC_CLIENT_SECRET` (required)
  - `PUSH_INTERVAL` (default `10s`)
  - `MACHINE_NAME` (default: hostname)
  - `SSH_HOST` (required) - the host the Android app should SSH to for this machine
  - `SSH_USER` (required) - the SSH user for this machine
- Initialize OIDC client credentials token source
- Main loop:
  1. Run tmux parser to get current sessions
  2. Push to server via pusher
  3. Sleep for `PUSH_INTERVAL`
- Graceful shutdown on SIGINT/SIGTERM (finish current push, then exit)
- Log startup info: machine name, server URL, push interval

## Phase 3: Android App

### 3.1 Project Scaffolding

**Gradle setup:**
- Kotlin 2.0+
- Jetpack Compose BOM (latest stable)
- Material 3
- Target SDK 35, Min SDK 26 (Android 8.0 - covers 95%+ of devices)

**Version catalog (`gradle/libs.versions.toml`):**

| Dependency | Version | Purpose |
|-----------|---------|---------|
| `net.openid:appauth` | 0.11.1 | OIDC Authorization Code + PKCE flow |
| `com.squareup.okhttp3:okhttp` | 4.12.0 | HTTP client for API calls |
| `org.jetbrains.kotlinx:kotlinx-serialization-json` | 1.7+ | JSON serialization |
| `org.jetbrains.kotlinx:kotlinx-coroutines-android` | 1.9+ | Async operations |
| `androidx.datastore:datastore-preferences` | 1.1+ | Persistent settings storage |
| `androidx.navigation:navigation-compose` | 2.8+ | Compose navigation |
| `androidx.lifecycle:lifecycle-viewmodel-compose` | 2.8+ | ViewModel integration |

**AndroidManifest.xml permissions and declarations:**

```xml
<!-- Termux RUN_COMMAND permission -->
<uses-permission android:name="com.termux.permission.RUN_COMMAND" />
<!-- Internet for API + OIDC -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Package visibility for Termux (Android 11+) -->
<queries>
    <package android:name="com.termux" />
</queries>

<!-- AppAuth redirect handler -->
<activity
    android:name="net.openid.appauth.RedirectUriReceiverActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="dev.rholden.dot"
              android:host="oauth2"
              android:path="/callback" />
    </intent-filter>
</activity>
```

### 3.2 Auth Layer (`auth/AuthManager.kt`)

Wraps AppAuth-Android for OIDC operations.

**Configuration (stored in DataStore, editable in Settings):**
- Authentik domain (e.g., `auth.holdenitdown.net`)
- Application slug (e.g., `tmux-viewer`)
- Client ID (e.g., `tmux-viewer-android`)
- Redirect URI: `dev.rholden.dot://oauth2/callback`
- Scopes: `openid profile email offline_access`

**OIDC Discovery:**
- Fetches `https://{domain}/application/o/{slug}/.well-known/openid-configuration`
- Caches the `AuthorizationServiceConfiguration`

**Authorization Flow:**
1. Build `AuthorizationRequest` with:
   - `ResponseTypeValues.CODE` (Authorization Code flow)
   - PKCE is automatic (AppAuth generates `code_verifier` + `code_challenge` with S256)
   - Requested scopes
2. Launch intent via `AuthorizationService.getAuthorizationRequestIntent()`
3. User authenticates in Chrome Custom Tab (redirected to Authentik login page)
4. Authentik redirects back to `dev.rholden.dot://oauth2/callback` with auth code
5. `RedirectUriReceiverActivity` captures the redirect
6. Exchange auth code for tokens via `AuthorizationService.performTokenRequest()`
   - AppAuth includes the `code_verifier` automatically
   - Receives: `access_token`, `id_token`, `refresh_token` (if `offline_access` was granted)

**Token Management:**
- `AuthState` persisted to SharedPreferences via `authState.jsonSerializeString()`
- Restored on app launch via `AuthState.jsonDeserialize()`
- `performActionWithFreshTokens()` transparently refreshes expired tokens using the refresh token
- If refresh fails (e.g., refresh token expired), redirect to login screen

**Exposed interface:**
```kotlin
val isAuthorized: Boolean
val idToken: String?
suspend fun discoverConfiguration()
fun buildAuthIntent(): Intent
fun handleAuthResponse(intent: Intent, onComplete: (success: Boolean, error: String?) -> Unit)
fun performWithFreshToken(action: (token: String) -> Unit)
fun logout()
```

### 3.3 API Client (`api/TmuxApiClient.kt`)

OkHttp-based client for the tmux-server API.

- Base URL configurable (stored in DataStore)
- Interceptor adds `Authorization: Bearer <id_token>` to every request
- Token is fetched via `AuthManager.performWithFreshToken()` before each request

**Endpoints:**

```kotlin
suspend fun getSessions(): Result<SessionsResponse>
```

- `GET {baseUrl}/api/sessions`
- Deserializes response with Kotlin Serialization
- Returns `Result<T>` for error handling (network errors, 401, 5xx)
- On 401: signals AuthManager that re-auth is needed

### 3.4 Data Models (`data/Models.kt`)

```kotlin
@Serializable
data class TmuxSession(
    val name: String,
    val windows: Int,
    val attached: Boolean,
    @SerialName("last_activity")
    val lastActivity: Long  // epoch seconds
)

@Serializable
data class Machine(
    val name: String,
    @SerialName("ssh_host")
    val sshHost: String,
    @SerialName("ssh_user")
    val sshUser: String,
    val sessions: List<TmuxSession>,
    @SerialName("last_seen")
    val lastSeen: Long
)

@Serializable
data class SessionsResponse(
    val machines: List<Machine>
)
```

### 3.5 Settings Store (`data/SettingsStore.kt`)

Uses Jetpack DataStore (Preferences) for persistent settings.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `server_url` | String | `""` | tmux-server base URL |
| `authentik_domain` | String | `""` | Authentik domain |
| `authentik_slug` | String | `""` | OIDC application slug |
| `oidc_client_id` | String | `""` | Public client ID |
| `default_ssh_user` | String | `""` | Override SSH user (optional, per-machine values from API take priority) |
| `auto_refresh_interval` | Int | `30` | Seconds between auto-refreshes on session list |

### 3.6 Termux Launcher (`service/TermuxLauncher.kt`)

Builds and sends the `RUN_COMMAND` intent to Termux.

```kotlin
fun launchSshTmuxSession(
    context: Context,
    sshHost: String,
    sshUser: String,
    sessionName: String
) {
    val intent = Intent().apply {
        setClassName("com.termux", "com.termux.app.RunCommandService")
        action = "com.termux.RUN_COMMAND"
        putExtra("com.termux.RUN_COMMAND_PATH",
            "/data/data/com.termux/files/usr/bin/ssh")
        putExtra("com.termux.RUN_COMMAND_ARGUMENTS", arrayOf(
            "$sshUser@$sshHost",
            "-t",
            "tmux attach -t $sessionName"
        ))
        putExtra("com.termux.RUN_COMMAND_WORKDIR",
            "/data/data/com.termux/files/home")
        putExtra("com.termux.RUN_COMMAND_BACKGROUND", false)
        putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0")
        putExtra("com.termux.RUN_COMMAND_COMMAND_LABEL",
            "SSH to $sshHost - tmux $sessionName")
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
    } else {
        context.startService(intent)
    }
}
```

**Intent details:**
- **Action:** `com.termux.RUN_COMMAND`
- **Component:** `com.termux/com.termux.app.RunCommandService`
- **COMMAND_PATH:** `/data/data/com.termux/files/usr/bin/ssh` (absolute path to Termux's SSH binary)
- **ARGUMENTS:** `["user@host", "-t", "tmux attach -t session_name"]` (String array, no shell quoting needed)
- **BACKGROUND:** `false` (SSH is interactive, needs a terminal)
- **SESSION_ACTION:** `"0"` (create new terminal session, switch to it, bring Termux to foreground)

**Error handling:**
- Check if Termux is installed via `PackageManager.getPackageInfo("com.termux", 0)`
- Show a dialog if Termux is not installed with instructions
- Catch `SecurityException` if the permission hasn't been granted

### 3.7 UI Screens

#### Navigation (`ui/navigation/NavGraph.kt`)

Three routes:
- `/login` - shown when not authenticated
- `/sessions` - main session list (default when authenticated)
- `/settings` - configuration screen

Uses Compose Navigation with conditional start destination based on `AuthManager.isAuthorized`.

#### Login Screen (`ui/screens/LoginScreen.kt`)

- App name/logo at top
- "Sign in with Authentik" button (filled, purple accent)
- Loading indicator during OIDC flow
- Error message display
- First-launch: prompt to configure server URL first (link to settings)

#### Session List Screen (`ui/screens/SessionListScreen.kt`)

- Top app bar: "Tmux Sessions" title + settings icon button + refresh icon button
- Pull-to-refresh via `PullToRefreshBox`
- Auto-refresh every N seconds (configurable, default 30s)
- Content: `LazyColumn` with sections per machine
  - **Machine header:** machine name + SSH host + "last seen X ago" subtitle
  - **Session cards:** one per tmux session under each machine
- Empty state: "No sessions found" with refresh button
- Loading state: circular progress indicator
- Error state: error message + retry button

#### Session Card (`ui/components/SessionCard.kt`)

A Material 3 `Card` for each tmux session:

```
┌──────────────────────────────────┐
│  session-name              ● 2w  │
│  Last active: 3 min ago         │
│                        [Attach]  │
└──────────────────────────────────┘
```

- Session name (bold, left-aligned)
- Attached indicator: green dot if attached, gray if detached
- Window count badge: "2w" = 2 windows
- Last activity: relative time ("3 min ago", "just now")
- "Attach" button (or tap entire card) -> `TermuxLauncher.launchSshTmuxSession()`

#### Settings Screen (`ui/screens/SettingsScreen.kt`)

Grouped settings with Material 3 list items:

**Server Configuration:**
- Server URL (text field)
- Test connection button (hits `/health` endpoint)

**Authentication:**
- Authentik domain (text field)
- Application slug (text field)
- Client ID (text field)
- Current auth status (authenticated as: email)
- Sign out button

**SSH Defaults:**
- Default SSH user override (text field, optional)

**About:**
- App version
- Link to Termux setup instructions

### 3.8 Theme (`ui/theme/`)

Aura theme matching the tmux config colors:

**Color palette (`Color.kt`):**

```kotlin
// Primary purple shades
val Purple300 = Color(0xFFa78bfa)  // primary
val Purple400 = Color(0xFFc084fc)  // secondary
val Purple100 = Color(0xFFe9d5ff)  // tertiary / highlights

// Backgrounds
val Dark900 = Color(0xFF0f0f0f)    // surface / background
val Dark800 = Color(0xFF1a1a2e)    // surface variant
val Dark700 = Color(0xFF374151)    // card backgrounds

// Text
val Gray300 = Color(0xFFd1d5db)    // primary text
val Gray400 = Color(0xFF9ca3af)    // secondary text
val Gray600 = Color(0xFF4b5563)    // disabled text

// Status
val Green400 = Color(0xFF4ade80)   // attached indicator
val Red400 = Color(0xFFf87171)     // error / disconnected
```

**Theme (`Theme.kt`):**
- Dark theme only (matches terminal aesthetic)
- Material 3 `darkColorScheme` with the Aura palette mapped to Material roles
- Typography: default Material 3 with monospace for session names

## Phase 4: Authentik Configuration

### Android App Client (Public)

1. Admin > Applications > Create with provider
2. Application name: `Tmux Viewer`
3. Slug: `tmux-viewer`
4. Provider type: OAuth2/OIDC
5. Settings:
   - **Client type:** Public
   - **Client ID:** `tmux-viewer-android`
   - **Redirect URIs:** `dev.rholden.dot://oauth2/callback`
   - **Signing Key:** Select a certificate (enables RS256 JWT signing)
   - **Scopes:** `openid`, `profile`, `email`, `offline_access`
   - **Subject mode:** Based on the user's hashed ID
   - **Access token validity:** `hours=1`
   - **Refresh token validity:** `days=30`

### Agent Client (Confidential)

1. Admin > Providers > Create
2. Provider type: OAuth2/OIDC
3. Settings:
   - **Client type:** Confidential
   - **Client ID:** `tmux-agent`
   - **Client Secret:** auto-generated (store securely, provide to agent via env var)
   - **Redirect URIs:** (empty, not used for Client Credentials)
   - **Signing Key:** Same certificate as above
   - **Grant types:** Enable `client_credentials`
   - **Scopes:** `openid`
4. Create a matching Application with slug `tmux-viewer` (same application, different provider - or use the same provider if Authentik allows both flows)

Note: Authentik may require a separate provider for Client Credentials. In that case, configure the tmux-server to accept tokens from both client IDs by either:
- Setting `SkipClientIDCheck: true` in the `oidc.Config` and validating the issuer only
- Accepting a list of valid client IDs and checking the `aud` claim manually

## Build Instructions

### Server

```bash
# Build
go build -o tmux-server ./cmd/tmux-server

# Run
export AUTHENTIK_ISSUER="https://auth.holdenitdown.net/application/o/tmux-viewer/"
export OIDC_CLIENT_ID="tmux-viewer-android"
export LISTEN_ADDR=":8080"
export SESSION_TTL="60s"
./tmux-server
```

### Agent

```bash
# Build
go build -o tmux-agent ./cmd/tmux-agent

# Run
export SERVER_URL="https://tmux.holdenitdown.net"
export AUTHENTIK_ISSUER="https://auth.holdenitdown.net/application/o/tmux-viewer/"
export OIDC_CLIENT_ID="tmux-agent"
export OIDC_CLIENT_SECRET="<secret-from-authentik>"
export MACHINE_NAME="devbox"
export SSH_HOST="devbox.holdenitdown.net"
export SSH_USER="rfhold"
export PUSH_INTERVAL="10s"
./tmux-agent
```

### Android

```bash
cd android

# Debug build
./gradlew assembleDebug
# APK at: app/build/outputs/apk/debug/app-debug.apk

# Install on connected device
./gradlew installDebug

# Release build (requires signing config)
./gradlew assembleRelease
```

## Termux Setup (One-Time)

The user must configure Termux to accept external commands:

1. Install Termux from F-Droid (not Play Store - the Play Store version is outdated and broken)
2. Install OpenSSH: `pkg install openssh`
3. Enable external apps:
   ```bash
   echo "allow-external-apps = true" >> ~/.termux/termux.properties
   termux-reload-settings
   ```
4. Set up SSH key: `ssh-keygen` and copy public key to dev machine
5. Grant "Draw Over Apps" permission to Termux:
   Android Settings > Apps > Termux > Advanced > Display over other apps > Allow
6. After installing the Tmux Viewer app, grant the Termux permission:
   Android Settings > Apps > Tmux Viewer > Permissions > Additional permissions > Run commands in Termux environment
