## Change Overview

- **Why**: Dot's OpenCode plugin pin updater resolves rfhold plugin tags through `git+ssh` URLs, and the current workflow image lacks an SSH client even when Git is present.
- **Impact**: The updater PipelineRun will run in the shared Bun CI image so `bun`, `git`, `ssh`, and CA certificates are available consistently.
- **Non-goals**: This change does not alter plugin reference semantics, change the updater script, change scheduler manifests, or update pinned plugin values.
- **Rollback**: Restore the prior updater workflow image; scheduled pin updates will again depend on per-image tooling availability.

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
