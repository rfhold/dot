---
feature: opencode-config
title: OpenCode Configuration (Skills, Agents, MCP)
status: active
created: 2026-04-19
updated: 2026-10-19
last-change: opencode-v2-migration
---

# OpenCode Configuration (Skills, Agents, MCP)

## Purpose

Defines capability delivery across global (`~/.config/opencode/`), project, and org-root (`~/repos/<org>/opencode.jsonc`) configuration layers for OpenCode v2.0.31.

Source repositories retain responsibility for their skills, agent prompts, MCP contracts, and custom commands. Native plugins remain the intended delivery mechanism for repository-owned capabilities. The v2 compatibility exceptions below do not transfer content ownership to dot.

## V2 Contract And Compatibility Boundary

- Native configuration uses `providers`, `agents`, `plugins`, `permissions`, `commands`, and `mcp.servers`.
- Plugins use `Plugin.define` and `setup(ctx)`. Legacy config mutation hooks do not implement the v2 contract.
- Skills use `ctx.skill.transform` with native skill records, not `config.skills.paths`.
- Remote MCP entries use `type: remote`, `url`, `disabled`, and the pinned `protocol: 2026-07-28`.
- Dot acquires `rfhold-skills` and optional private `cfa-skills` through root `package.json` and `bun.lock`.
- Native directory adapters expose those package skills without copies of skill content in dot.
- The rfhold org config declares inline MCP servers and the `re-search` agent until source repositories supply compatible native plugins.
- This spec does not assert that legacy query, research, service, or superspec plugins support v2 or appear in active configuration.

The ownership requirements below describe the intended source-repository contract. The explicit compatibility scenarios describe the supported v2 exceptions.

### Source Paths

| Contract | Source |
| --- | --- |
| Global service configuration | [`.config/opencode/opencode.jsonc`](../../../.config/opencode/opencode.jsonc) |
| Nonsecret Bao configuration | [`.config/opencode-bao/config.json`](../../../.config/opencode-bao/config.json) |
| CLI theme and plugins | [`.config/opencode/cli.json`](../../../.config/opencode/cli.json) |
| Dot project activation | [`opencode.jsonc`](../../../opencode.jsonc) |
| Org configuration | [`home/repos/rfhold/opencode.jsonc`](../../../home/repos/rfhold/opencode.jsonc), [`home/repos/cfaintl/opencode.jsonc`](../../../home/repos/cfaintl/opencode.jsonc), [`home/repos/stablekernel/opencode.jsonc`](../../../home/repos/stablekernel/opencode.jsonc) |
| Skill package acquisition | [`package.json`](../../../package.json), [`bun.lock`](../../../bun.lock) |
| Native skill adapters | [rfhold adapter](../../../.config/opencode/providers/rfhold-skills/server.ts), [cfaintl adapter](../../../.config/opencode/providers/cfa-skills/server.ts), [shared loader](../../../.config/opencode/providers/skills.ts) |
| Org deployment | [`configure.py`](../../../configure.py), `STATIC_ORG_AGENT_DIRS` and `link_config_dir` |
| Scheduled pin updates | [`scripts/update-opencode-plugin-pins.ts`](../../../scripts/update-opencode-plugin-pins.ts) |

## Requirements

### Requirement: Plugin-Based Capability Delivery

The intended system MUST deliver each repository-owned capability through a native OpenCode plugin in that source repository.
The explicit v2 compatibility adapters and inline org configuration are exceptions to this delivery requirement.

#### Scenario: Query server ships skill and MCP from its own repo

Given a query-server repository (for example `rfhold/gitops-query`) that exposes a remote MCP service
When the plugin for that repository is installed in `opencode.jsonc`
Then OpenCode MUST register the MCP server from that plugin
And OpenCode MUST load the skill teaching when to invoke that MCP from the same plugin
And dot MUST NOT duplicate its MCP registration or skill content

#### Scenario: Legacy skill package requires a v2 adapter

Given a skill package exposes only a legacy plugin entry point
When dot activates its skills on v2
Then a dot-owned native adapter MUST load skill records from the installed package
And the package MUST retain ownership of its skill content
And dot MUST NOT execute the legacy config hook
And dot MUST NOT copy those skills into a generated whitelist tree

#### Scenario: Repo-descriptive skill lives in the repo it describes

Given a skill whose content describes a specific source repository (for example `homelab`, `walter`, `cuthulu`)
When that skill is authored or updated
Then the skill MUST reside under `skills/<skill-name>/` inside the repository it describes
And the skill MUST NOT be duplicated in any other repository

### Requirement: OpenCode Plugin Layout

Native source-repository plugins MUST expose a v2 entry point that OpenCode can resolve from the `plugins` array.

#### Scenario: Plugin repo declares plugin entry point

Given a repository hosting an OpenCode plugin
When the repository is inspected
Then its package MUST expose a native entry point with `Plugin.define` and `setup(ctx)`
And any skills the plugin delivers MUST live under a `skills/` directory at the repository root

#### Scenario: Plugin registers native skills

Given a plugin whose repository contains a `skills/` directory with one or more `SKILL.md` bundles
When OpenCode loads the plugin
Then the plugin MUST register native skill records through `ctx.skill.transform`
And each record MUST retain its package source path and content
And the plugin MUST NOT register duplicate skill identities

#### Scenario: Compatibility adapter uses directory resolution

Given dot supplies an adapter under `~/.config/opencode/providers/<name>/server.ts`
When an active config declares that adapter
Then its `plugins` entry MUST reference the adapter directory
And it MUST NOT reference a standalone `.ts` file as the configured package

### Requirement: Query Plugin Contract

The system MUST ensure that a plugin for a query-server repository registers both the remote MCP server and the skill that describes it.

#### Scenario: Query plugin loads

Given a native query-server plugin appears in the active `opencode.jsonc` `plugins` array
When OpenCode starts
Then the plugin MUST register exactly one MCP server with the short MCP name (for example `gitops`, `slack`, `grafana`)
And it MUST use the native v2 MCP extension API rather than a legacy config mutation hook
And the server MUST use the approved remote URL and protocol
And the plugin MUST register its native skills

#### Scenario: Query plugin not installed

Given no active layer declares a query-server plugin or an explicit compatibility configuration for its capabilities
When OpenCode starts
Then OpenCode MUST NOT register the corresponding MCP server
And the corresponding skill MUST NOT be discoverable by OpenCode

### Requirement: Skill-Only Plugin Contract

The system MUST support plugins that deliver only skills without registering any MCP server, agent, or command.

#### Scenario: Skill-only plugin loads

Given a plugin whose purpose is to deliver skills for a source repository that has no MCP service (for example `homelab`, `walter`, `rfhold-skills`)
When the plugin is loaded by OpenCode
Then the plugin MUST register its native skills through `ctx.skill.transform`
And the plugin MUST NOT register an MCP server
And the plugin MUST NOT register an agent
And the plugin MUST NOT register a command

### Requirement: Agent Plugin Contract

The system MUST allow a plugin to register an OpenCode agent prompt alongside its MCP server and skill, so that an agent backed by a specific MCP lives in the same plugin as that MCP.

#### Scenario: Agent plugin loads

Given a plugin bundles an agent prompt (for example the `research` agent) alongside a remote MCP and a descriptive skill
When the plugin is loaded by OpenCode
Then the plugin MUST register the agent through the native v2 agent extension API
And the agent entry MUST reference the prompt file packaged inside the plugin
And the plugin MUST also register the MCP server and the skill as defined by the query plugin contract

### Requirement: Walter and Cuthulu Direct Plugin Exclusion

The system MUST NOT install Walter or Cuthulu as direct OpenCode plugins in active configuration and MUST NOT require operators to copy either plugin artifact into `~/.config/opencode/plugins/`.

#### Scenario: Walter and Cuthulu absent from direct plugin configuration

Given an active global, project, or org-scoped `opencode.jsonc`
When its direct `plugins` array is inspected
Then neither `cuthulu` nor `walter` MUST be listed

#### Scenario: Legacy loose plugin file removed

Given `~/.config/opencode/plugins/cuthulu.js` previously existed as a manual install
When active OpenCode configuration is applied
Then `~/.config/opencode/plugins/cuthulu.js` MUST NOT exist in the dot tree

### Requirement: Plugin Activation Scope

The system MUST activate each plugin at its scope: global, dot project, or org root.
Global plugins belong in `~/.config/opencode/opencode.jsonc`. Dot-project plugins belong in `~/dot/opencode.jsonc`. Org-specific plugins belong in `~/repos/<org>/opencode.jsonc`.

#### Scenario: Global plugin active everywhere

Given a native plugin applies outside any project or org (for example DCP)
When OpenCode is started in any directory
Then the global `plugins` array MUST declare the plugin
And the plugin's capabilities MUST be active regardless of working directory

#### Scenario: dot-project plugin active in dot

Given a plugin applies to the dot repository (for example the `rfhold-skills` adapter)
When OpenCode is started inside `~/dot/` or a subdirectory
Then the dot project `plugins` array MUST declare the plugin
And the plugin's capabilities MUST be active in that directory
And the plugin MUST NOT be listed globally solely to support dot maintenance

#### Scenario: org-scoped plugin active only in its org

Given a plugin applies to one org (for example cfaintl skills under `~/repos/cfaintl/`)
When OpenCode is started inside that org directory or a subdirectory
Then that org's root `opencode.jsonc` `plugins` array MUST declare the plugin
And the plugin's capabilities MUST be active in that directory
And the global `plugins` array MUST NOT declare the org-specific plugin

#### Scenario: org-scoped plugin inactive outside its org

Given a plugin is listed only in one org's `opencode.jsonc`
When OpenCode is started outside that org directory
Then that plugin MUST NOT be loaded
And OpenCode MUST NOT register its MCP server through that plugin
And its skills MUST NOT be discoverable

#### Scenario: Org discovery does not depend on the attached shell

Given `configure.py` applies org configuration for `rfhold`, `cfaintl`, or `stablekernel`
When OpenCode discovers an org ancestor
Then `~/repos/<org>/opencode.jsonc` MUST resolve to `~/dot/home/repos/<org>/opencode.jsonc`
And the org `.envrc` MUST unset `OPENCODE_CONFIG_DIR` and `OPENCODE_CONFIG`
And OpenCode MUST NOT require those variables from the shell that attaches to its service
And org instruction files MUST retain their `.agents/AGENTS.md` paths where the config declares them

### Requirement: Native Service And CLI Configuration

The system MUST separate native service configuration from CLI presentation configuration.
Root `package.json` pins the plugin API to `@opencode/plugin@2.0.31`.

#### Scenario: CLI theme and DCP use v2 configuration

Given OpenCode reads `~/.config/opencode/cli.json`
When the CLI starts
Then `theme.name` MUST select `aura`
And the CLI `plugins` array MUST declare `@tarquinen/opencode-dcp@3.2.0`
And service and org configs that declare DCP MUST use the same version
And the system MUST NOT treat the old `tui.json` as the native CLI configuration

#### Scenario: Shell environment uses a native hook

Given OpenCode discovers `~/.config/opencode/plugins/shell-env.ts`
When the plugin runs `setup(ctx)`
Then it MUST register `ctx.shell.hook("create.before", ...)`
And the hook MUST set `event.env.GIT_EDITOR` to `true`

### Requirement: Global Bao Integration

The system MUST activate `opencode-vault` globally through the service `plugins` array after DCP.
The global release pin is `opencode-vault@git+ssh://git@git.holdenitdown.net/rfhold/opencode-vault.git#opencode/v0.1.2`.
The plugin source repository owns the service and TUI implementations.

#### Scenario: One package supplies service and TUI capabilities

Given the global service config declares the release-tagged Bao package
When OpenCode starts on macOS
Then OpenCode MUST load the package's service plugin
And OpenCode MUST automatically discover its TUI entry from the same package
And dot MUST NOT add a separate Bao entry to `cli.json`
And the plugin MUST use macOS Keychain for authentication state

#### Scenario: Trusted configuration uses normal dot symlinks

Given dot declares nonsecret connection settings in `.config/opencode-bao/config.json`
When `configure.py` applies the core configuration on any platform
Then the generic config linker MUST link the Bao config through the normal dot symlink mechanism
And dot MUST NOT add Bao-specific copy or exclusion logic
And the macOS plugin MUST accept config symlinks that resolve to owned, secure targets
And the macOS plugin MUST reject targets that fail its ownership or permission checks
And the source MUST contain only nonsecret connection settings and the workstation's absolute Bao executable path
And dot MUST NOT track tokens, Keychain data, or session state

Dot uses the same generic config linker for Bao as for other configuration.
The plugin source repository owns config target trust checks on macOS.
Optional legacy `parentTokenPolicies` and `parentIdentityPolicies` fields remain accepted but do not enforce parent policies.

#### Scenario: Shared dot configuration reaches another platform

Given the shared global config declares Bao on a non-macOS host
When OpenCode loads the package
Then the Bao plugin MUST perform no work on that platform
And both its service and TUI entry points MUST remain no-ops even if the Bao config link exists
And the generic linker MUST treat `opencode-bao` like other configuration

### Requirement: Scheduled Plugin Pin Updates

The scheduled updater MUST reconcile supported rfhold Git plugin specifiers in dot-owned `opencode.jsonc` files through the hourly PAC-triggered pipeline.
The pipeline commits changed pins directly to `main`.

The updater scans `opencode.jsonc` files only. It does not update root dependencies, `bun.lock`, registry package versions, or CLI plugins in `cli.json`.
The locked `rfhold-skills` dependency therefore requires an explicit dependency update; this pipeline does not reconcile it automatically.
Bao's global Git release pin follows this hourly remote workflow without a separate timer.
Normal local dot refresh acquires the updated remote pin; the scheduled workflow does not refresh workstation files itself.
OpenCode's built-in `update: auto` controls application updates, not plugin release pins.
These requirements describe the scheduled system, not authorization for a local agent to commit, push, trigger pipelines, or deploy resources.

#### Scenario: Latest rfhold release tag applied

Given a dot-owned OpenCode config file contains an rfhold plugin specifier of the form `<name>@git+ssh://git@git.holdenitdown.net/rfhold/<repo>.git#opencode/vA.B.C`
And the plugin source repository has a newer semver release tag matching `opencode/vX.Y.Z`
When the scheduled plugin pin updater runs
Then the system MUST replace that specifier with the newest matching `opencode/vX.Y.Z` tag
And the system MUST commit and push the changed dot files directly to `main`
And the commit subject MUST identify each plugin's resulting version
And the commit body MUST identify each plugin's previous and resulting `opencode/vX.Y.Z` version
And the system MUST NOT open a pull request for the update

#### Scenario: No commit when pins are current

Given every supported plugin specifier in dot-owned `opencode.jsonc` files matches its intended upstream reference
When the scheduled plugin pin updater runs
Then the system MUST leave the dot tree unchanged
And the system MUST NOT create an empty commit

#### Scenario: Branch-tracked external dependency stays outside the updater

Given root `package.json` declares optional `cfa-skills` from `git+ssh://git@github.com/cfaintl/skills.git#main`
When the scheduled plugin pin updater scans dot-owned plugin specifiers
Then the system MUST leave that dependency and its lockfile unchanged
And the system MUST NOT convert that dependency to an `opencode/vX.Y.Z` tag reference

#### Scenario: Updater owns all dot plugin config layers

Given supported rfhold Git plugin specifiers appear in global, project, or org-scoped dot `opencode.jsonc` files
When the scheduled plugin pin updater runs
Then the system MUST evaluate each supported specifier in those dot-owned config files
And the system MUST apply the same direct-to-main update behavior to every changed rfhold release-tag pin

#### Scenario: Updater workflow has SSH-capable Git tooling

Given the scheduled plugin pin updater resolves rfhold plugin tags through `git+ssh` URLs
When the updater PipelineRun starts its update step
Then the system MUST provide `bun`, `git`, `ssh`, and CA certificates from the shared Bun CI image

#### Scenario: Updater workflow trusts Forgejo SSH host

Given the scheduled plugin pin updater resolves rfhold plugin tags through `git+ssh://git@git.holdenitdown.net` URLs
When the updater PipelineRun starts its update step
Then the system MUST configure SSH host trust for `git.holdenitdown.net` before resolving plugin tags

#### Scenario: Updater workflow uses pipeline credentials for rfhold lookups

Given the scheduled plugin pin updater has PAC-provided git credentials for `git.holdenitdown.net`
When the updater resolves rfhold plugin tags from `git+ssh://git@git.holdenitdown.net` specifiers
Then the system MUST use the pipeline git credentials for those lookups without changing the stored plugin specifiers

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

### Requirement: No Inline MCP for Plugin-Owned Servers

The system MUST NOT duplicate an MCP server between a native plugin and inline `mcp.servers` configuration.

#### Scenario: Plugin-owned MCP is not duplicated

Given a plugin registers an MCP server named `<name>`
When `opencode.jsonc` is inspected at the layer that installs the plugin
Then `opencode.jsonc` MUST NOT contain an entry at `mcp.servers.<name>`
And any previously declared inline entry for `<name>` MUST have been removed

#### Scenario: Non-plugin MCP remains allowed

Given an MCP server is NOT delivered through any plugin (for example `playwright` configured as a local child process)
When `opencode.jsonc` is inspected
Then an inline `mcp.servers.<name>` stanza can declare that server

#### Scenario: V2 org MCP compatibility configuration

Given legacy source-repository plugins do not implement native v2 registration
When the rfhold org config declares remote servers inline
Then its entries MUST remain under `mcp.servers` at the org root
And each remote entry MUST pin `protocol` to `2026-07-28`
And dot MUST NOT activate the legacy plugin alongside that entry

### Requirement: Plugin Installation Via git+ssh

Native rfhold source-repository plugins MUST use release-tagged `git+ssh` package specifiers in `plugins`.
The v2 skill adapters are explicit local-path exceptions. Root Bun dependencies acquire their source packages separately.

#### Scenario: Plugin installed from source repo

Given a plugin named `<name>` lives in `git@git.holdenitdown.net:rfhold/<repo>.git`
When `opencode.jsonc` declares the plugin
Then the native source-package entry MUST use `<name>@git+ssh://git@git.holdenitdown.net/rfhold/<repo>.git#opencode/vX.Y.Z`
And the entry MUST NOT depend on a published npm package
And the entry MUST NOT depend on a local file path

### Requirement: Plugin-Delivered Skills Supersede Filesystem Whitelist

The system MUST deliver skills that describe specific source repositories through the owning repository's plugin rather than through a filesystem whitelist curated under `.agents/skills/`.

#### Scenario: Relocated skill loaded from plugin

Given a skill (for example `gitops-query`, `cuthulu`, `homelab`, `walter`, `waltr-component`, `axol-query`, `grafana-query`, `cuthulu-query`) has moved into the plugin for its owning repository
When OpenCode loads the plugin
Then OpenCode MUST discover the skill through native skill registration
And the skill MUST NOT also exist under any `.agents/skills/` whitelist tree that `configure.py` generates
And the skill MUST NOT also exist under `~/.agents/skills/` as a symlink into `~/dot/home/.agents/skills/`

#### Scenario: Retained rfhold-skills package hosts shared skills

Given `rfhold/skills` retains skills that are not coupled to a single source repository (for example `kubectl`, `forgejo-tea`, `tekton-pac`)
When the native `rfhold-skills` adapter loads in the dot project or rfhold org
Then OpenCode MUST discover those retained skills from the root Bun dependency
And those skills MUST NOT be duplicated into any org-scoped `.agents/skills/` directory by `configure.py`

#### Scenario: Cfaintl adapter preserves package filters

Given root Bun dependencies supply the private `cfa-skills` package
When the cfaintl org activates its native directory adapter
Then `options.configFile` MUST select `~/repos/cfaintl/.agents/cfa-skills.json`
And the adapter MUST read the filters from that file
And the adapter MUST honor that file's include and exclude filters
And a missing package MUST produce an explicit installation error

### Requirement: Broken Skill Symlinks Removed

The system MUST ensure that `~/.agents/skills/` contains no dangling symlinks or orphaned skill directories after the plugin migration.

#### Scenario: Dangling oc-agent symlink removed

Given `~/.agents/skills/oc-agent` previously pointed at a target under `~/dot/home/.agents/skills/` that no longer exists
When the plugin migration is complete
Then `~/.agents/skills/oc-agent` MUST NOT exist

#### Scenario: Dangling oc-skill symlink removed

Given `~/.agents/skills/oc-skill` previously pointed at a target under `~/dot/home/.agents/skills/` that no longer exists
When the plugin migration is complete
Then `~/.agents/skills/oc-skill` MUST NOT exist

#### Scenario: Orphan atlassian-query entry removed

Given `~/.agents/skills/atlassian-query/` exists with only a dangling `SKILL.md` symlink and a stale backup file
When the plugin migration is complete
Then `~/.agents/skills/atlassian-query/` MUST NOT exist
And a native replacement MUST supply the skill before the system claims equivalent capability

### Requirement: Per-Repository Skill Home

The system MUST co-locate a skill with the repository whose tool the skill describes, for every skill that describes a single source repository.

#### Scenario: Query server skills colocated with their server

Given a query-server repository (for example `rfhold/gitops-query`, `rfhold/slack-query`, `rfhold/grafana-query`, `rfhold/atlassian-query`, `rfhold/gsuite-query`, `rfhold/axol`)
When the corresponding `*-query` skill is authored
Then the skill MUST live under `skills/<skill-name>/` in that same repository
And the skill's frontmatter `source-repo` MUST reference that same repository

#### Scenario: Service skills colocated with their service

Given a service repository (for example `rfhold/cuthulu`, `rfhold/walter`, `rfhold/homelab`)
When a skill describing that service is authored
Then the skill MUST live under `skills/<skill-name>/` in that same repository
And the skill's frontmatter `source-repo` MUST reference that same repository

### Requirement: Research Plugin Ownership

The intended source-repository contract MUST keep the research agent, remote MCP integration, and descriptive skill together in `rfhold/re-search`.
The v2 compatibility configuration below does not establish completion of that plugin contract.

#### Scenario: Native research plugin replaces compatibility configuration

Given `rfhold/re-search` supplies a native v2 plugin with equivalent capabilities
And an approved config change replaces the compatibility configuration at its intended scope
When OpenCode starts
Then the plugin MUST register the remote MCP server
And the plugin MUST register its agent prompt through the native agent extension API
And the plugin MUST register its descriptive skill through `ctx.skill.transform`
And the active config MUST NOT duplicate the plugin's MCP server or agent
And no `agent/research.md` file MUST remain under `~/.config/opencode/`

#### Scenario: Research remains an rfhold org compatibility capability

Given the native research plugin contract lacks an active implementation
When OpenCode loads `~/repos/rfhold/opencode.jsonc`
Then `mcp.servers.re-search` MUST declare the remote MCP endpoint with `codemode: false`
And `agents.re-search` MUST declare the research-only subagent prompt
And the agent permissions MUST deny other tools and allow `re_search_*`
And global configuration MUST NOT declare that research capability
And dot MUST NOT claim a plugin-delivered research skill solely from this inline configuration

### Requirement: Plugin Source-Repo Accuracy

The system MUST ensure that every skill's frontmatter `source-repo` field identifies the repository that actually owns the skill content after relocation.

#### Scenario: Relocated grafana-query skill frontmatter corrected

Given the `grafana-query` skill previously declared `source-repo: rfhold/waltr-grafana` despite describing the `rfhold/grafana-query` service
When the skill is relocated into `rfhold/grafana-query`
Then its frontmatter MUST declare `source-repo: rfhold/grafana-query`

#### Scenario: Newly authored query skills declare correct source-repo

Given new skill stubs are authored for `slack-query`, `atlassian-query`, and `gsuite-query` during the migration
When each skill is committed
Then each frontmatter MUST declare `source-repo: rfhold/<corresponding-query-repo>`
