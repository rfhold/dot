## Change Overview

- **Why**: The updater workflow has PAC-provided HTTPS git credentials, while nested rfhold tag lookups still use `git+ssh` URLs from plugin specifiers and fail without SSH repository credentials.
- **Impact**: The updater workflow will use the existing pipeline git credentials for rfhold plugin tag lookups while preserving the committed plugin specifier format.
- **Non-goals**: This change does not alter plugin specifier semantics, updater script behavior, scheduler deployment, or the shared Bun CI image.
- **Rollback**: Remove the workflow git URL rewrite and return nested lookups to their prior `git+ssh` transport behavior.

## MODIFIED Requirements

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
