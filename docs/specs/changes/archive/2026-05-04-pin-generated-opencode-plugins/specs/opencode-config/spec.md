# Delta: pin-generated-opencode-plugins / opencode-config

This delta is part of the `pin-generated-opencode-plugins` change. The primary Change Overview lives in `docs/specs/changes/pin-generated-opencode-plugins/specs/rfhold-mcp-config/spec.md`.

## MODIFIED Requirements

### Requirement: Plugin Installation Via git+ssh

The system MUST install every rfhold-hosted plugin by listing it in an `opencode.jsonc` `plugin` array using a `git+ssh` specifier pinned to an OpenCode release tag in the plugin's source repository.

#### Scenario: Plugin installed from source repo

Given a plugin named `<name>` lives in `git@git.holdenitdown.net:rfhold/<repo>.git`
When `opencode.jsonc` declares the plugin
Then the entry MUST be of the form `<name>@git+ssh://git@git.holdenitdown.net/rfhold/<repo>.git#opencode/vX.Y.Z`
And the entry MUST NOT depend on a published npm package
And the entry MUST NOT depend on a local file path
