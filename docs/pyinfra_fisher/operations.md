# pyinfra_fisher/operations.py

## Overview
Provides pyinfra operations for managing Fisher plugin packages on Fish shell. These operations are idempotent and handle installation, removal, and updates of Fisher plugins with intelligent state detection.

## API Reference

### packages

**Description**: Install or remove Fisher plugin packages. This operation checks the current state and only makes changes when necessary.

**Decorator**: `@operation()`

**Signature**:
```python
@operation()
def packages(packages=None, present=True):
```

**Parameters**:
- `packages` (list[str] | str | None): Fisher plugin identifiers to manage. Can be a single string or list. Supports version tags (e.g., `'plugin@v5'`)
- `present` (bool): If `True`, install packages. If `False`, remove packages. Default: `True`

**Returns**: Generator yielding shell commands to execute

**Behavior**:
- **Install mode** (`present=True`):
  - Compares requested packages with currently installed plugins
  - Only installs packages that are not already present
  - Version-aware: treats `plugin` and `plugin@v5` as the same base plugin
  - Installs packages one at a time for better error handling
  
- **Remove mode** (`present=False`):
  - Finds matching installed plugins (case-insensitive)
  - Removes only plugins that are currently installed
  - Handles version tags correctly

**Example**:
```python
from pyinfra_fisher import operations as fisher

# Install multiple plugins
fisher.packages(
    name="Install Fish plugins",
    packages=[
        'jorgebucaran/fisher',
        'realiserad/fish-ai',
        'ilancosman/tide@v5',
    ],
    present=True,
)

# Install a single plugin
fisher.packages(
    name="Install Fisher",
    packages='jorgebucaran/fisher',
)

# Remove plugins
fisher.packages(
    name="Remove outdated plugins",
    packages=['old/plugin'],
    present=False,
)
```

---

### update

**Description**: Update Fisher plugin packages. Can update all plugins or specific ones.

**Decorator**: `@operation()`

**Signature**:
```python
@operation()
def update(packages=None):
```

**Parameters**:
- `packages` (list[str] | str | None): Specific plugins to update. If `None`, updates all installed plugins. Can be a single string or list.

**Returns**: Generator yielding shell commands to execute

**Behavior**:
- If `packages` is `None`: runs `fisher update` to update all plugins
- If `packages` is provided: updates only the specified plugins
- Accepts single string or list of plugin identifiers

**Example**:
```python
from pyinfra_fisher import operations as fisher

# Update all plugins
fisher.update(
    name="Update all Fish plugins",
)

# Update specific plugins
fisher.update(
    name="Update specific plugins",
    packages=['realiserad/fish-ai', 'ilancosman/tide'],
)

# Update a single plugin
fisher.update(
    name="Update fish-ai",
    packages='realiserad/fish-ai',
)
```

## Dependencies
- **External**: 
  - `pyinfra.host` - Access to host context and facts
  - `pyinfra.api.operation` - Operation decorator for pyinfra
  
- **Internal**: 
  - `.facts.FisherPlugins` - Fact collector for querying installed plugins

## Implementation Details

### Plugin Name Normalization
- Case-insensitive comparison for plugin matching
- Version tags are stripped when comparing base plugin names
- Example: `plugin@v5` matches `plugin@v6` (same base: `plugin`)

### Command Execution
- All Fisher commands use `fish -c "..."` to execute in Fish shell context
- Commands include `</dev/null` to prevent stdin issues during deployment
- Operations are idempotent: safe to run multiple times without side effects

### Error Handling
- Packages are installed/removed one at a time for granular error reporting
- Empty package lists result in no-op (no commands yielded)
- Missing plugins in remove mode are silently skipped

## Notes
- Requires Fish shell to be installed on target hosts
- Requires Fisher plugin manager to be available (typically installed as a plugin itself)
- Plugin identifiers follow GitHub convention: `owner/repo` or `owner/repo@version`
- The `@operation()` decorator makes these functions compatible with pyinfra's deployment system
- All operations query current state first to ensure idempotency
- Version tags are optional and follow Fisher's syntax (e.g., `@v5`, `@main`)
