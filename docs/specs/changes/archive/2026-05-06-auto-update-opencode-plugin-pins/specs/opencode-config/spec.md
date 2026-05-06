# OpenCode Configuration Delta Spec

Delta spec at `docs/specs/changes/auto-update-opencode-plugin-pins/specs/opencode-config/spec.md`. Declares operations against the stable spec. Merged wholesale by `code-review`.

## Change Overview

### Why

OpenCode plugin releases now happen across multiple repositories, and dot currently pins those plugins manually. Manual pin bumps leave working copies behind the latest `opencode/v*` tags until an operator notices and edits several config files.

The dot repository also needs to own the scheduler that keeps those pins current. PAC already supports `incoming` webhook triggers, so an hourly Kubernetes `CronJob` can trigger a dot updater pipeline without requiring native PAC schedule annotations.

The cfaintl skills source has moved to plugin delivery. Dot must stop treating cfaintl skills as a cloned filesystem whitelist and instead configure the cfaintl skills plugin with the same approved skill exposure.

### Impact

- **Breaking changes**: org-scoped `.agents` directories are no longer generated directory trees; they become static symlink targets owned by dot.
- **Migration**: existing generated `~/repos/<org>/.agents` directories must be replaced or backed up so the static dot-owned symlink can take over.
- **Cross-change dependencies**: none.

### Non-goals

- Opening pull requests for plugin pin updates.
- Adding native PAC schedule annotations.
- Moving scheduler ownership into homelab/Pulumi.
- Changing plugin release workflow behavior in source plugin repositories.

### Rollback

Revert the dot change that adds the updater pipeline, scheduler manifests, and static org `.agents` content. Delete the deployed scheduler `CronJob` with `kubectl delete -k` if the CI deploy already applied it, then restore the prior pinned plugin values and generated-directory behavior.

---

## MODIFIED Requirements

### Requirement: Plugin Activation Scope

The system MUST activate each plugin at the configuration layer that matches its scope: global plugins in `~/.config/opencode/opencode.jsonc`, dot-project plugins in the dot project configuration, and org-specific plugins in `~/repos/<org>/.agents/opencode.jsonc`.

#### Scenario: Global plugin active everywhere

Given a plugin is relevant outside any single org (for example `re-search`, `rfhold-skills`)
When OpenCode is started in any directory
Then the plugin MUST be listed in the global `plugin` array
And the plugin's capabilities MUST be active regardless of working directory

#### Scenario: dot-project plugin active in dot

Given a plugin is relevant to maintaining the dot repository itself (for example `superspec`)
When OpenCode is started inside `~/dot/` or a subdirectory
Then the plugin MUST be listed in the dot project `plugin` array
And the plugin's capabilities MUST be active in that directory
And the plugin MUST NOT be listed globally solely to support dot maintenance

#### Scenario: org-scoped plugin active only in its org

Given a plugin is relevant only when working on repositories for one org (for example rfhold query plugins under `~/repos/rfhold/` or cfaintl skills under `~/repos/cfaintl/`)
When OpenCode is started inside that org directory or a subdirectory
Then the plugin MUST be listed in that org's `.agents/opencode.jsonc` `plugin` array
And the plugin's capabilities MUST be active in that directory
And the plugin MUST NOT be listed in the global `plugin` array

#### Scenario: org-scoped plugin inactive outside its org

Given a plugin is listed only in one org's `opencode.jsonc`
When OpenCode is started outside that org directory
Then that plugin MUST NOT be loaded
And its MCP server MUST NOT appear in `config.mcp`
And its skills MUST NOT be discoverable

## ADDED Requirements

### Requirement: Scheduled Plugin Pin Updates

The system MUST automatically reconcile every OpenCode plugin specifier stored in the dot tree with its intended upstream reference through an hourly PAC-triggered pipeline that commits changed pin values directly to `main`.

#### Scenario: Latest rfhold release tag applied

Given a dot-owned OpenCode config file contains an rfhold plugin specifier of the form `<name>@git+ssh://git@git.holdenitdown.net/rfhold/<repo>.git#opencode/vA.B.C`
And the plugin source repository has a newer semver release tag matching `opencode/vX.Y.Z`
When the scheduled plugin pin updater runs
Then the system MUST replace that specifier with the newest matching `opencode/vX.Y.Z` tag
And the system MUST commit and push the changed dot files directly to `main`
And the system MUST NOT open a pull request for the update

#### Scenario: No commit when pins are current

Given every dot-owned OpenCode plugin specifier already matches its intended upstream reference
When the scheduled plugin pin updater runs
Then the system MUST leave the dot tree unchanged
And the system MUST NOT create an empty commit

#### Scenario: Branch-tracked external plugin preserved

Given a dot-owned OpenCode config file contains the cfaintl skills plugin entry targeting `git+ssh://git@github.com/cfaintl/skills.git#main`
When the scheduled plugin pin updater scans dot-owned plugin specifiers
Then the system MUST keep the cfaintl skills plugin on the `main` branch reference
And the system MUST NOT convert that entry to an `opencode/vX.Y.Z` tag reference

#### Scenario: Updater owns all dot plugin config layers

Given OpenCode plugin specifiers appear in global, project, or org-scoped dot config files
When the scheduled plugin pin updater runs
Then the system MUST evaluate each plugin specifier in those dot-owned config files
And the system MUST apply the same direct-to-main update behavior to every changed rfhold release-tag pin

### Requirement: Dot-Owned Scheduler Deployment

The system MUST define the scheduled updater as dot-owned Kustomize manifests and MUST deploy those manifests from a dot PAC pipeline on `main` pushes.

#### Scenario: Scheduler manifests deploy to pantheon

Given the dot repository contains Kustomize manifests for the plugin pin updater scheduler
When the scheduler deployment pipeline runs from `main`
Then the system MUST apply those manifests with `kubectl apply -k` against the `pantheon` cluster context
And the system MUST create or update the scheduler resources in the `pipelines-as-code` namespace

#### Scenario: Hourly scheduler triggers PAC incoming

Given the scheduler `CronJob` is deployed in the `pipelines-as-code` namespace on `pantheon`
When the hourly schedule fires
Then the system MUST POST to the PAC incoming endpoint with the dot Repository CR, the `main` branch, and the plugin pin updater PipelineRun
And PAC MUST create a plugin pin updater PipelineRun for the dot repository

#### Scenario: Main push deploys scheduler changes

Given scheduler Kustomize manifests change in the dot repository
When those changes are pushed to `main`
Then the dot PAC deployment pipeline MUST apply the current Kustomize output to the `pantheon` cluster
And the deployed scheduler MUST reflect the committed manifests
