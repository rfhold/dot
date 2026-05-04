---
feature: opencode-config
title: OpenCode Configuration (Skills, Agents, MCP)
status: active
created: 2026-04-19
updated: 2026-04-19
last-change: plugin-based-opencode
---

# OpenCode Configuration (Skills, Agents, MCP)

## Purpose

Defines how skills, agent prompts, MCP servers, and custom commands are delivered to OpenCode across both global (`~/.config/opencode/`) and org-scoped (`~/repos/<org>/.agents/`) configuration layers. Establishes the plugin-based ownership contract: every such capability is packaged into an OpenCode plugin hosted in the repository that owns the underlying tool, and installed by listing the plugin in `opencode.jsonc`'s `plugin` array. Filesystem-based installation paths (dropping `.ts`/`.js` plugin files into `~/.config/opencode/plugins/`, whitelisting skill folders under `.agents/skills/`, declaring `mcp` stanzas in `opencode.jsonc`) are phased out.

## Requirements

### Requirement: Plugin-Based Capability Delivery

The system MUST deliver every OpenCode skill, MCP server, agent prompt, and custom command owned by a specific source repository through an OpenCode plugin hosted in that same source repository.

#### Scenario: Query server ships skill and MCP from its own repo

Given a query-server repository (for example `rfhold/gitops-query`) that exposes a remote MCP service
When the plugin for that repository is installed in `opencode.jsonc`
Then OpenCode MUST register the MCP server from that plugin
And OpenCode MUST load the skill teaching when to invoke that MCP from the same plugin
And neither the MCP server nor its skill MUST be declared or delivered through any other mechanism

#### Scenario: Repo-descriptive skill lives in the repo it describes

Given a skill whose content describes a specific source repository (for example `homelab`, `walter`, `cuthulu`)
When that skill is authored or updated
Then the skill MUST reside under `skills/<skill-name>/` inside the repository it describes
And the skill MUST NOT be duplicated in any other repository

### Requirement: OpenCode Plugin Layout

The system MUST package every OpenCode plugin using a uniform layout so that OpenCode can resolve it from a `git+ssh` specifier in the `plugin` array.

#### Scenario: Plugin repo declares plugin entry point

Given a repository hosting an OpenCode plugin
When the repository is inspected
Then it MUST contain a `package.json` whose `main` field points at `.opencode/plugins/<plugin-name>.js`
And it MUST contain the referenced `.opencode/plugins/<plugin-name>.js` file
And any skills the plugin delivers MUST live under a `skills/` directory at the repository root

#### Scenario: Plugin registers its skill path

Given a plugin whose repository contains a `skills/` directory with one or more `SKILL.md` bundles
When OpenCode loads the plugin
Then the plugin MUST push the absolute path of that `skills/` directory onto `config.skills.paths`
And the plugin MUST NOT add a path already present in `config.skills.paths`

### Requirement: Query Plugin Contract

The system MUST ensure that a plugin for a query-server repository registers both the remote MCP server and the skill that describes it.

#### Scenario: Query plugin loads

Given a query-server plugin is listed in the active `opencode.jsonc` `plugin` array
When OpenCode starts
Then the plugin MUST add exactly one entry to `config.mcp` keyed by the short MCP name (for example `gitops`, `slack`, `grafana`)
And that entry MUST declare `"type": "remote"` and the MCP service's URL
And the plugin MUST add its `skills/` directory to `config.skills.paths`

#### Scenario: Query plugin not installed

Given a query-server plugin is NOT listed in the active `opencode.jsonc` `plugin` array
When OpenCode starts
Then the corresponding MCP server MUST NOT appear in `config.mcp`
And the corresponding skill MUST NOT be discoverable by OpenCode

### Requirement: Skill-Only Plugin Contract

The system MUST support plugins that deliver only skills without registering any MCP server, agent, or command.

#### Scenario: Skill-only plugin loads

Given a plugin whose purpose is to deliver skills for a source repository that has no MCP service (for example `homelab`, `walter`, `rfhold-skills`)
When the plugin is loaded by OpenCode
Then the plugin MUST push its `skills/` directory onto `config.skills.paths`
And the plugin MUST NOT mutate `config.mcp`
And the plugin MUST NOT mutate `config.agent`
And the plugin MUST NOT mutate `config.command`

### Requirement: Agent Plugin Contract

The system MUST allow a plugin to register an OpenCode agent prompt alongside its MCP server and skill, so that an agent backed by a specific MCP lives in the same plugin as that MCP.

#### Scenario: Agent plugin loads

Given a plugin bundles an agent prompt (for example the `research` agent) alongside a remote MCP and a descriptive skill
When the plugin is loaded by OpenCode
Then the plugin MUST register the agent by adding an entry to `config.agent` keyed by the agent name
And the agent entry MUST reference the prompt file packaged inside the plugin
And the plugin MUST also register the MCP server and the skill as defined by the query plugin contract

### Requirement: Cuthulu Plugin Ownership

The system MUST host the cuthulu OpenCode plugin inside the `rfhold/cuthulu` repository, and MUST NOT require operators to copy the plugin artifact into `~/.config/opencode/plugins/`.

#### Scenario: Cuthulu plugin installed via opencode.jsonc

Given `rfhold/cuthulu` ships its OpenCode plugin at `.opencode/plugins/cuthulu.ts`
When the cuthulu plugin is listed in the active `opencode.jsonc` `plugin` array
Then OpenCode MUST load the cuthulu session-monitoring functionality
And OpenCode MUST register the `cuthulu` and `cuthulu-query` skills from the plugin's `skills/` directory
And no `cuthulu.js` file MUST be required under `~/.config/opencode/plugins/`

#### Scenario: Legacy loose plugin file removed

Given `~/.config/opencode/plugins/cuthulu.js` previously existed as a manual install
When the plugin-based cuthulu integration is active
Then `~/.config/opencode/plugins/cuthulu.js` MUST NOT exist in the dot tree

### Requirement: Plugin Activation Scope

The system MUST activate each plugin at the configuration layer that matches its scope: global plugins in `~/.config/opencode/opencode.jsonc`, and rfhold-specific plugins in `~/repos/rfhold/.agents/opencode.jsonc`.

#### Scenario: Global plugin active everywhere

Given a plugin is relevant outside any single org (for example `re-search`, `rfhold-skills`)
When OpenCode is started in any directory
Then the plugin MUST be listed in the global `plugin` array
And the plugin's capabilities MUST be active regardless of working directory

#### Scenario: rfhold-scoped plugin active only in rfhold

Given a plugin is relevant only when working on `rfhold/*` repositories (for example any query plugin, `cuthulu`, `homelab`, `walter`)
When OpenCode is started inside `~/repos/rfhold/` or a subdirectory
Then the plugin MUST be listed in `~/repos/rfhold/.agents/opencode.jsonc` `plugin` array
And the plugin's capabilities MUST be active in that directory
And the plugin MUST NOT be listed in the global `plugin` array

#### Scenario: rfhold-scoped plugin inactive outside rfhold

Given a plugin is listed only in the rfhold org `opencode.jsonc`
When OpenCode is started outside `~/repos/rfhold/`
Then that plugin MUST NOT be loaded
And its MCP server MUST NOT appear in `config.mcp`
And its skills MUST NOT be discoverable

### Requirement: No Inline MCP for Plugin-Owned Servers

The system MUST NOT declare an inline `mcp` stanza in `opencode.jsonc` for any MCP server that is delivered through a plugin.

#### Scenario: Plugin-owned MCP is not duplicated

Given a plugin registers an MCP server named `<name>`
When `opencode.jsonc` is inspected at the layer that installs the plugin
Then `opencode.jsonc` MUST NOT contain an entry at `mcp.<name>`
And any previously declared inline entry for `<name>` MUST have been removed

#### Scenario: Non-plugin MCP remains allowed

Given an MCP server is NOT delivered through any plugin (for example `playwright` configured as a local child process)
When `opencode.jsonc` is inspected
Then an inline `mcp.<name>` stanza MAY continue to declare that server

### Requirement: Plugin Installation Via git+ssh

The system MUST install every rfhold-hosted plugin by listing it in an `opencode.jsonc` `plugin` array using a `git+ssh` specifier pinned to an OpenCode release tag in the plugin's source repository.

#### Scenario: Plugin installed from source repo

Given a plugin named `<name>` lives in `git@git.holdenitdown.net:rfhold/<repo>.git`
When `opencode.jsonc` declares the plugin
Then the entry MUST be of the form `<name>@git+ssh://git@git.holdenitdown.net/rfhold/<repo>.git#opencode/vX.Y.Z`
And the entry MUST NOT depend on a published npm package
And the entry MUST NOT depend on a local file path

### Requirement: Plugin-Delivered Skills Supersede Filesystem Whitelist

The system MUST deliver skills that describe specific source repositories through the owning repository's plugin rather than through a filesystem whitelist curated under `.agents/skills/`.

#### Scenario: Relocated skill loaded from plugin

Given a skill (for example `gitops-query`, `cuthulu`, `homelab`, `walter`, `waltr-component`, `axol-query`, `grafana-query`, `cuthulu-query`) has moved into the plugin for its owning repository
When OpenCode loads the plugin
Then the skill MUST be discoverable via `config.skills.paths`
And the skill MUST NOT also exist under any `.agents/skills/` whitelist tree that `configure.py` generates
And the skill MUST NOT also exist under `~/.agents/skills/` as a symlink into `~/dot/home/.agents/skills/`

#### Scenario: Retained rfhold-skills plugin hosts shared skills

Given `rfhold/skills` retains skills that are not coupled to a single source repository (for example `kubectl`, `forgejo-tea`, `tekton-pac`)
When the `rfhold-skills` plugin is installed globally
Then those retained skills MUST be discoverable via the plugin
And those skills MUST NOT be duplicated into any org-scoped `.agents/skills/` directory by `configure.py`

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
And the atlassian-query skill MUST be discoverable via the `atlassian-query` plugin instead

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

The system MUST host the research agent, its remote MCP wiring, and a descriptive research skill in the `rfhold/re-search` repository as a single plugin.

#### Scenario: Research plugin loaded globally

Given the `re-search` plugin is listed in the global `opencode.jsonc` `plugin` array
When OpenCode starts
Then the plugin MUST register the `research` remote MCP server
And the plugin MUST register the `research` agent prompt via `config.agent`
And the plugin MUST register the `research` skill via `config.skills.paths`
And no inline `mcp.research` entry MUST remain in the global `opencode.jsonc`
And no `agent/research.md` file MUST remain under `~/.config/opencode/`

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
