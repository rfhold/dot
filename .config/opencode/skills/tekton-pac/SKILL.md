---
name: tekton-pac
description: Writing Tekton Pipelines as Code (PAC) pipeline definitions for Gitea repositories. Invoked when creating or editing .tekton/ pipeline YAML files, setting up CI/CD for a repo, building container images with BuildKit, posting Gitea PR comments, creating releases, or onboarding a repository to Tekton PAC.
---

# Tekton Pipelines as Code for Gitea

Use this skill when creating or modifying `.tekton/` pipeline definitions for repositories hosted on the Gitea instance at `git.holdenitdown.net`.

## System Architecture

- **Tekton PAC v0.41.1** receives webhook events from a Gitea org-level webhook
- **PAC Global Repository CR** shares Gitea auth config and global parameters across all repos
- All PipelineRuns execute in the `pipelines-as-code` namespace on the **pantheon** cluster
- **BuildKit daemons** (remote, long-running) handle container builds — no DinD or privileged pods in pipelines
- The `buildctl` client connects to daemons over TCP within the cluster

### Infrastructure Endpoints

| Component | Address |
|---|---|
| Gitea | `https://git.holdenitdown.net` |
| Container Registry | `cr.holdenitdown.net` |
| BuildKit amd64 | `tcp://buildkit-amd64.buildkit.svc.cluster.local:1234` |
| BuildKit arm64 | `tcp://buildkit-arm64.buildkit.svc.cluster.local:1234` |
| PAC Webhook | `https://pac.holdenitdown.net` |
| Tekton Dashboard | `https://tekton.holdenitdown.net` |

### Global Parameters

These are injected by the Global Repository CR and available in all pipeline files via `{{ variable }}` syntax:

| Parameter | Value |
|---|---|
| `BUILDKIT_AMD64_ADDR` | `buildkit-amd64.buildkit.svc.cluster.local:1234` |
| `BUILDKIT_ARM64_ADDR` | `buildkit-arm64.buildkit.svc.cluster.local:1234` |
| `CONTAINER_REGISTRY` | `cr.holdenitdown.net` |
| `GITEA_URL` | `https://git.holdenitdown.net` |

Access with: `{{ params.BUILDKIT_AMD64_ADDR }}`, `{{ params.CONTAINER_REGISTRY }}`, etc.

### Available Secrets

These secrets exist in the `pipelines-as-code` namespace and can be mounted in tasks:

| Secret | Purpose | Keys |
|---|---|---|
| `{{ git_auth_secret }}` | Auto-created per PipelineRun with Gitea credentials | `git-provider-token`, `.gitconfig`, `.git-credentials` |
| `gitea-pac-token` | Static Gitea token (prefer `{{ git_auth_secret }}`) | `token` |
| `android-keystore` | Android APK signing keystore | `keystore.jks`, `keystore-password`, `key-alias`, `key-password` |

## PipelineRun File Structure

Every `.tekton/*.yaml` file is a standalone `PipelineRun` with an embedded `pipelineSpec`. PAC uses annotations to determine when to trigger.

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: <unique-name>
  annotations:
    pipelinesascode.tekton.dev/on-event: "[pull_request]"
    pipelinesascode.tekton.dev/on-target-branch: "[main]"
    pipelinesascode.tekton.dev/max-keep-runs: "5"
spec:
  params:
    - name: repo-url
      value: "{{ repo_url }}"
    - name: revision
      value: "{{ revision }}"
  pipelineSpec:
    params:
      - name: repo-url
        type: string
      - name: revision
        type: string
    workspaces:
      - name: source
    tasks:
      - name: fetch-repository
        taskSpec:
          workspaces:
            - name: output
          steps:
            - name: clone
              image: alpine/git:latest
              workingDir: $(workspaces.output.path)
              script: |
                #!/bin/sh
                set -e
                git clone $(params.repo-url) .
                git checkout $(params.revision)
        workspaces:
          - name: output
            workspace: source
        params:
          - name: repo-url
            value: $(params.repo-url)
          - name: revision
            value: $(params.revision)
  workspaces:
    - name: source
      volumeClaimTemplate:
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 1Gi
```

### Key Annotations

| Annotation | Values | Notes |
|---|---|---|
| `on-event` | `[pull_request]`, `[push]` | Event type filter |
| `on-target-branch` | `[main]`, `[refs/tags/*]`, `[refs/tags/v*]` | Branch/tag filter |
| `max-keep-runs` | `"5"` | Auto-cleanup old PipelineRuns |
| `on-path-change` | `[src/**, docker/**]` | Only trigger on file path matches |
| `on-path-change-ignore` | `[docs/**, *.md]` | Exclude paths from triggering |
| `task` | `[git-clone]` | Fetch catalog tasks by name |

## PAC Template Variables

Available in `.tekton/*.yaml` files via `{{ variable }}` syntax:

| Variable | Description | Available On |
|---|---|---|
| `{{ revision }}` | Full commit SHA | All events |
| `{{ repo_url }}` | Repository clone URL | All events |
| `{{ repo_name }}` | Repository name | All events |
| `{{ repo_owner }}` | Repository owner | All events |
| `{{ source_branch }}` | Source branch name | All events |
| `{{ target_branch }}` | Target branch name | All events |
| `{{ pull_request_number }}` | PR number | PR events only |
| `{{ sender }}` | Username who triggered | All events |
| `{{ git_auth_secret }}` | Auto-created secret name with Gitea credentials | All events |

The `{{ git_auth_secret }}` secret contains `.gitconfig`, `.git-credentials`, and a `git-provider-token` key with the Gitea API token. This token has write scopes (`write:repository`, `write:issue`) and can create releases, post PR comments, and create issues.

The static `gitea-pac-token` secret (used by the Global Repository CR) stores the same token under the key `token`. In PAC-triggered runs, always prefer `{{ git_auth_secret }}` with key `git-provider-token`.

## Building Container Images with BuildKit

Use `buildctl` to build images against the remote BuildKit daemons. The daemons are long-running with 50Gi persistent caches. No privileged mode needed in pipeline tasks.

### Single-Arch Build Task

```yaml
- name: build-image
  runAfter: [fetch-repository]
  taskSpec:
    params:
      - name: image
        type: string
      - name: buildkit-addr
        type: string
      - name: context
        type: string
        default: "."
      - name: dockerfile
        type: string
        default: "Dockerfile"
    workspaces:
      - name: source
    steps:
      - name: build
        image: moby/buildkit:v0.26.3
        workingDir: $(workspaces.source.path)
        script: |
          #!/bin/sh
          set -e
          buildctl \
            --addr tcp://$(params.buildkit-addr) \
            build \
            --frontend dockerfile.v0 \
            --local context=$(params.context) \
            --local dockerfile=$(params.context) \
            --opt filename=$(params.dockerfile) \
            --output type=image,name=$(params.image),push=true
  params:
    - name: image
      value: "{{ params.CONTAINER_REGISTRY }}/{{ repo_owner }}/{{ repo_name }}:latest"
    - name: buildkit-addr
      value: "{{ params.BUILDKIT_AMD64_ADDR }}"
  workspaces:
    - name: source
      workspace: source
```

### Multi-Arch Build Pattern

Run amd64 and arm64 builds in parallel, then create a manifest:

```yaml
tasks:
  - name: build-amd64
    runAfter: [fetch-repository]
    taskSpec:
      # ... same as single-arch build task ...
    params:
      - name: image
        value: "{{ params.CONTAINER_REGISTRY }}/{{ repo_owner }}/{{ repo_name }}:latest-amd64"
      - name: buildkit-addr
        value: "{{ params.BUILDKIT_AMD64_ADDR }}"
    workspaces:
      - name: source
        workspace: source

  - name: build-arm64
    runAfter: [fetch-repository]
    taskSpec:
      # ... same as single-arch build task ...
    params:
      - name: image
        value: "{{ params.CONTAINER_REGISTRY }}/{{ repo_owner }}/{{ repo_name }}:latest-arm64"
      - name: buildkit-addr
        value: "{{ params.BUILDKIT_ARM64_ADDR }}"
    workspaces:
      - name: source
        workspace: source

  - name: create-manifest
    runAfter: [build-amd64, build-arm64]
    taskSpec:
      params:
        - name: base-image
          type: string
        - name: tag
          type: string
      steps:
        - name: manifest
          image: mplatform/manifest-tool:alpine-v2.1.7
          script: |
            #!/bin/sh
            set -e
            manifest-tool push from-args \
              --platforms linux/amd64,linux/arm64 \
              --template $(params.base-image):$(params.tag)-ARCH \
              --target $(params.base-image):$(params.tag)
    params:
      - name: base-image
        value: "{{ params.CONTAINER_REGISTRY }}/{{ repo_owner }}/{{ repo_name }}"
      - name: tag
        value: "latest"
```

### Build Arguments

Append `--opt build-arg:KEY=VALUE` for each build argument:

```sh
buildctl --addr tcp://$(params.buildkit-addr) build \
  --frontend dockerfile.v0 \
  --local context=. \
  --local dockerfile=. \
  --opt filename=Dockerfile \
  --opt build-arg:VERSION=1.0.0 \
  --opt build-arg:GIT_SHA=$(params.revision) \
  --output type=image,name=$(params.image),push=true
```

### Dockerfile Target Stage

Use `--opt target=<stage>`:

```sh
buildctl --addr tcp://$(params.buildkit-addr) build \
  --frontend dockerfile.v0 \
  --local context=. \
  --local dockerfile=. \
  --opt target=production \
  --output type=image,name=$(params.image),push=true
```

## Gitea API Operations

Use `curl` with the token from `{{ git_auth_secret }}` for Gitea API calls. Mount the secret as a volume and read the token from file. Never use `set -x` in scripts that handle the token.

### Posting a PR Comment

```yaml
- name: comment-pr
  taskSpec:
    params:
      - name: pr-number
        type: string
      - name: comment
        type: string
    volumes:
      - name: git-auth
        secret:
          secretName: "{{ git_auth_secret }}"
    steps:
      - name: post
        image: curlimages/curl:latest
        volumeMounts:
          - name: git-auth
            mountPath: /etc/git-auth
        script: |
          #!/bin/sh
          set -e
          TOKEN=$(cat /etc/git-auth/git-provider-token)
          HTTP_CODE=$(curl -w "%{http_code}" -sS -o /tmp/response.json -X POST \
            "{{ params.GITEA_URL }}/api/v1/repos/{{ repo_owner }}/{{ repo_name }}/issues/$(params.pr-number)/comments" \
            -H "Authorization: token $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"body\": \"$(params.comment)\"}")
          if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
            echo "Failed with HTTP $HTTP_CODE"
            cat /tmp/response.json
            exit 1
          fi
          echo "Comment posted (HTTP $HTTP_CODE)"
  params:
    - name: pr-number
      value: "{{ pull_request_number }}"
    - name: comment
      value: "Build succeeded!"
```

### Creating a Release

```yaml
- name: create-release
  taskSpec:
    params:
      - name: tag
        type: string
      - name: body
        type: string
    volumes:
      - name: git-auth
        secret:
          secretName: "{{ git_auth_secret }}"
    steps:
      - name: release
        image: curlimages/curl:latest
        volumeMounts:
          - name: git-auth
            mountPath: /etc/git-auth
        script: |
          #!/bin/sh
          set -e
          TOKEN=$(cat /etc/git-auth/git-provider-token)
          HTTP_CODE=$(curl -w "%{http_code}" -sS -o /tmp/response.json -X POST \
            "{{ params.GITEA_URL }}/api/v1/repos/{{ repo_owner }}/{{ repo_name }}/releases" \
            -H "Authorization: token $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"tag_name\": \"$(params.tag)\", \"name\": \"Release $(params.tag)\", \"body\": \"$(params.body)\"}")
          if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
            echo "Failed with HTTP $HTTP_CODE"
            cat /tmp/response.json
            exit 1
          fi
          echo "Release created (HTTP $HTTP_CODE)"
  params:
    - name: tag
      value: "v1.0.0"
    - name: body
      value: "Automated release"
```

### Creating an Issue

```yaml
- name: create-issue
  taskSpec:
    params:
      - name: title
        type: string
      - name: body
        type: string
    volumes:
      - name: git-auth
        secret:
          secretName: "{{ git_auth_secret }}"
    steps:
      - name: issue
        image: curlimages/curl:latest
        volumeMounts:
          - name: git-auth
            mountPath: /etc/git-auth
        script: |
          #!/bin/sh
          set -e
          TOKEN=$(cat /etc/git-auth/git-provider-token)
          HTTP_CODE=$(curl -w "%{http_code}" -sS -o /tmp/response.json -X POST \
            "{{ params.GITEA_URL }}/api/v1/repos/{{ repo_owner }}/{{ repo_name }}/issues" \
            -H "Authorization: token $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"title\": \"$(params.title)\", \"body\": \"$(params.body)\"}")
          if [ "$HTTP_CODE" -lt 200 ] || [ "$HTTP_CODE" -ge 300 ]; then
            echo "Failed with HTTP $HTTP_CODE"
            cat /tmp/response.json
            exit 1
          fi
          echo "Issue created (HTTP $HTTP_CODE)"
  params:
    - name: title
      value: "Build failure on main"
    - name: body
      value: "Pipeline run failed. Check Tekton dashboard."
```

## Finally Block for Error Handling

Use `finally` tasks for cleanup or failure notifications:

```yaml
pipelineSpec:
  tasks:
    # ... main tasks ...
  finally:
    - name: notify-failure
      when:
        - input: $(tasks.status)
          operator: in
          values: ["Failed"]
      taskSpec:
        # ... post PR comment or create issue about failure ...
```

`$(tasks.status)` is `Succeeded`, `Failed`, or `Completed` (mixed results).

## Security & Safe Scripting

### Never Leak Secrets in Logs

Use `set -e` (not `set -ex`) in scripts that handle tokens or secrets. The `x` flag prints every command with expanded variables to stdout, which ends up in Tekton logs.

```yaml
# WRONG - token will appear in task logs
script: |
  #!/bin/sh
  set -ex
  TOKEN=$(cat /etc/git-auth/git-provider-token)
  curl -H "Authorization: token $TOKEN" ...

# CORRECT - errors still abort, but commands are not echoed
script: |
  #!/bin/sh
  set -e
  TOKEN=$(cat /etc/git-auth/git-provider-token)
  curl -fsS -H "Authorization: token $TOKEN" ...
```

If you need debug output for non-secret commands, enable tracing selectively:

```sh
#!/bin/sh
set -e
TOKEN=$(cat /etc/git-auth/git-provider-token)

set -x
buildctl --addr tcp://$(params.buildkit-addr) build ...
set +x

curl -fsS -H "Authorization: token $TOKEN" ...
```

### curl Flags for API Calls

Always use `-fsS` with curl:
- `-f` — fail with non-zero exit on HTTP errors (4xx/5xx), so `set -e` catches failures
- `-s` — silent mode, suppress progress bars
- `-S` — show errors even in silent mode

Without `-f`, curl exits 0 on a 403/500 and the step appears to succeed.

### Secret Mounting

Mount secrets as volumes, not environment variables. Environment variables are easier to leak through process listings or debug output.

```yaml
# CORRECT - volume mount
taskSpec:
  volumes:
    - name: git-auth
      secret:
        secretName: "{{ git_auth_secret }}"
  steps:
    - name: api-call
      volumeMounts:
        - name: git-auth
          mountPath: /etc/git-auth
      script: |
        TOKEN=$(cat /etc/git-auth/git-provider-token)
```

### Gitea Token Scopes

The PAC Gitea token requires these scopes for full pipeline functionality:

| Operation | Required Scope |
|---|---|
| Clone private repos | `read:repository` |
| Create releases | `write:repository` |
| Post PR comments | `write:issue` |
| Create issues | `write:issue` |
| Push to registry | (registry is open, no token needed) |

If API calls return HTTP 403 with `token does not have at least one of required scope(s)`, the token needs additional scopes. Update it via:
1. Generate a new token in Gitea with required scopes
2. `pulumi config set --secret tekton:giteaToken <new-token>` in `programs/tekton`
3. `pulumi up`

## Onboarding a Repository

To add a Gitea repo to the PAC system:

1. Add the repo path to `programs/tekton/Pulumi.pantheon.yaml` under `tekton:gitea:repositories`:
   ```yaml
   tekton:gitea:
     host: git.holdenitdown.net
     repositories:
       - rfhold/homelab
       - rfhold/new-repo    # add here
   ```
2. Run `pulumi up` in the `programs/tekton` stack (pantheon) — this creates a Repository CR with git_provider config
3. Create a `.tekton/` directory in the repository with PipelineRun YAML files
4. Push — the org-level webhook routes events to PAC automatically

**Repository resources are managed by Pulumi**, not by files in `.tekton/`. The Pulumi code in `src/components/tekton.ts` creates Repository CRs with `git_provider` configuration automatically. Each repo gets its own Repository CR (e.g., `pac-rfhold-dot`) that references the shared Gitea authentication secrets (`gitea-pac-token` and `gitea-pac-webhook`).

No per-repo webhook setup is needed.

## Image Tagging Conventions

| Event | Tag Pattern |
|---|---|
| Pull Request | `pr-<number>` or `pr-<number>-<arch>` |
| Push to main | `latest` or `latest-<arch>` |
| Tag push | `<tag>` or `<tag>-<arch>` |

## Android Keystore

A signing keystore is available in the `pipelines-as-code` namespace for Android APK signing:

**Secret name:** `android-keystore`

| Key | Description |
|---|---|
| `keystore.jks` | Java KeyStore file (binary) |
| `keystore-password` | Keystore password |
| `key-alias` | Signing key alias (`release`) |
| `key-password` | Key password (same as keystore password) |

### Usage Example

```yaml
- name: sign-apk
  taskSpec:
    workspaces:
      - name: source
    steps:
      - name: sign
        image: openjdk:17-slim
        workingDir: $(workspaces.source.path)
        volumeMounts:
          - name: keystore
            mountPath: /keystore
            readOnly: true
        env:
          - name: KEYSTORE_PASSWORD
            valueFrom:
              secretKeyRef:
                name: android-keystore
                key: keystore-password
          - name: KEY_ALIAS
            valueFrom:
              secretKeyRef:
                name: android-keystore
                key: key-alias
        script: |
          set -e
          jarsigner -verbose \
            -keystore /keystore/keystore.jks \
            -storepass "$KEYSTORE_PASSWORD" \
            -keypass "$KEYSTORE_PASSWORD" \
            app-unsigned.apk \
            "$KEY_ALIAS"
          jarsigner -verify -verbose -certs app-unsigned.apk
          mv app-unsigned.apk app-signed.apk
    volumes:
      - name: keystore
        secret:
          secretName: android-keystore
          items:
            - key: keystore.jks
              path: keystore.jks
  workspaces:
    - name: source
      workspace: source
```

**Certificate details:**
- Type: RSA 2048-bit
- Algorithm: SHA256withRSA
- Validity: Until July 2053
- DN: CN=Hold It Down

The keystore is managed via Pulumi in the Tekton stack. See `.opencode/docs/android-keystore-usage.md` for rotation instructions.

## Workspace Notes

- Use `volumeClaimTemplate` with `ReadWriteOnce` for build workspaces
- Parallel tasks sharing a workspace need to land on the same node (K8s scheduling constraint with RWO PVCs), or each task can clone independently
- Mount `docker-credentials` secret as a workspace if registry auth is needed for pushes
- The `{{ git_auth_secret }}` secret is auto-created per PipelineRun — mount it as a volume to access the Gitea token
- The `android-keystore` secret is available for APK signing — mount as volume to access the keystore file

## Common Patterns

### Conditional Execution

```yaml
- name: build-if-dockerfile-exists
  when:
    - input: "$(tasks.check-dockerfile.results.exists)"
      operator: in
      values: ["true"]
```

### Task Results

Pass data between tasks using results:

```yaml
# Producing task
taskSpec:
  results:
    - name: image-digest
  steps:
    - name: build
      script: |
        echo -n "sha256:abc123" > $(results.image-digest.path)

# Consuming task
params:
  - name: digest
    value: "$(tasks.build-image.results.image-digest)"
```

### Subdirectory Builds

For monorepos with multiple Dockerfiles:

```yaml
params:
  - name: context
    value: "docker/myapp"
  - name: dockerfile
    value: "Dockerfile"
```

The buildctl `--local context=` and `--local dockerfile=` paths are relative to the workspace root.

## Troubleshooting

### Pipeline Not Triggering

If pipelines don't trigger after pushing to a PR or branch:

1. **Check PAC controller logs** for errors:
   ```bash
   kubectl logs -n pipelines-as-code deployment/pipelines-as-code-controller --tail=100
   ```

2. **Common error: `failed to find git_provider details in repository spec`**
   - This means the Repository CR is missing `git_provider` configuration
   - Repository resources are managed by Pulumi in `src/components/tekton.ts`
   - Verify the repo is listed in `programs/tekton/Pulumi.pantheon.yaml` under `tekton:gitea:repositories`
   - Run `pulumi up` in the Tekton stack to update the Repository CR
   - Check the Repository: `kubectl get repository pac-<owner>-<repo> -n pipelines-as-code -o yaml`

3. **Verify webhook delivery** in Gitea:
   - Org webhook: `https://git.holdenitdown.net/rfhold/settings/hooks`
   - Check recent deliveries for errors

### Git Clone Failures

**Error: `fatal: unable to read tree (<sha>)`** when using `--depth=1`:
- Shallow clones don't have full history, so specific SHAs may not be available
- **Solution:** Remove `--depth=1` from git clone commands
- Use: `git clone $(params.repo-url) .` followed by `git checkout $(params.revision)`

### Permission Denied Errors in Android Builds

**Error: `chmod: changing permissions of './gradlew': Operation not permitted`**
- Workspace volumes may have different ownership than the container user
- **Solution:** Add a `fix-permissions` step before the build:
  ```yaml
  steps:
    - name: fix-permissions
      image: alpine:latest
      workingDir: $(workspaces.source.path)
      script: |
        #!/bin/sh
        chmod -R 777 .
    - name: build
      image: cimg/android:2025.10.1
      script: |
        sh ./gradlew assembleDebug --no-daemon
  ```
- Use `sh ./gradlew` instead of `chmod +x && ./gradlew`

### Build Fails with Gradle Lock File Error

**Error: `Could not create parent directory for lock file .../.gradle/...`**
- Gradle needs write permission to the workspace for caching
- **Solution:** Add the `fix-permissions` step (see above) or set `GRADLE_USER_HOME` to a writable location
