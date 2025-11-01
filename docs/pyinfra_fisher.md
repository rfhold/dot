# pyinfra_fisher

## Overview

`pyinfra_fisher` is a Python package that provides pyinfra operations and facts for managing [Fisher](https://github.com/jorgebucaran/fisher), a plugin manager for the Fish shell. It enables declarative installation, removal, and updating of Fish shell plugins through pyinfra's infrastructure-as-code approach.

## Installation

This package is designed to be used within a pyinfra project. Import it in your `configure.py` or deployment scripts:

```python
from pyinfra_fisher import operations as fisher
from pyinfra_fisher import facts
```

## Module Structure

- **`operations`**: Pyinfra operations for managing Fisher plugins
- **`facts`**: Pyinfra facts for querying installed Fisher plugins

## API Reference

### Operations

#### `packages(packages=None, present=True)`

Manage Fisher plugin packages (install or remove).

**Parameters**:
- `packages` (list or str, optional): List of Fisher plugins to install/remove. Can be a single string or list of strings. Supports version tags (e.g., `'ilancosman/tide@v5'`). Default: `[]`
- `present` (bool, optional): Whether packages should be installed (`True`) or removed (`False`). Default: `True`

**Behavior**:
- When `present=True`: Installs plugins that are not already installed
- When `present=False`: Removes plugins that are currently installed
- Performs case-insensitive comparison of plugin names
- Handles version tags intelligently (compares base package names)
- Installs/removes packages one by one for better error handling

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
    name="Install Fisher itself",
    packages='jorgebucaran/fisher',
    present=True,
)

# Remove plugins
fisher.packages(
    name="Remove Fish plugins",
    packages=['realiserad/fish-ai'],
    present=False,
)
```

---

#### `update(packages=None)`

Update Fisher plugin packages.

**Parameters**:
- `packages` (list or str, optional): List of specific plugins to update. If `None`, updates all installed plugins. Can be a single string or list of strings. Default: `None`

**Behavior**:
- When `packages=None`: Updates all installed Fisher plugins
- When `packages` is provided: Updates only the specified plugins

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
    name="Update Fish AI plugin",
    packages='realiserad/fish-ai',
)
```

### Facts

#### `FisherPlugins`

A pyinfra fact that returns a list of currently installed Fisher plugins.

**Returns**: `list` - List of installed Fisher plugin names (e.g., `['jorgebucaran/fisher', 'ilancosman/tide@v5']`). Returns an empty list if Fisher is not installed or if the command fails.

**Example**:
```python
from pyinfra import host
from pyinfra_fisher.facts import FisherPlugins

# Get list of installed plugins
plugins = host.get_fact(FisherPlugins)

# Check if a specific plugin is installed
if 'realiserad/fish-ai' in plugins:
    print("Fish AI is installed")
```

## Dependencies

### External
- **pyinfra**: Infrastructure-as-code framework (required for operations and facts)
- **fish**: Fish shell must be installed on the target system
- **fisher**: The Fisher plugin manager should be installed (can be bootstrapped using this package)

### Internal
- `operations.py` imports `facts.FisherPlugins`

## Usage Patterns

### Bootstrap Fisher

```python
from pyinfra_fisher import operations as fisher

# First install Fisher itself
fisher.packages(
    name="Bootstrap Fisher",
    packages='jorgebucaran/fisher',
    present=True,
)
```

### Complete Plugin Management Workflow

```python
from pyinfra_fisher import operations as fisher

# Install Fisher plugin manager
fisher.packages(
    name="Install Fisher",
    packages='jorgebucaran/fisher',
    present=True,
)

# Install desired plugins
fisher.packages(
    name="Install Fish plugins",
    packages=[
        'realiserad/fish-ai',
        'ilancosman/tide@v5',
        'PatrickF1/fzf.fish',
    ],
    present=True,
)

# Update all plugins
fisher.update(
    name="Update all Fish plugins",
)
```

### Conditional Plugin Management

```python
from pyinfra import host
from pyinfra_fisher import operations as fisher
from pyinfra_fisher.facts import FisherPlugins

# Get currently installed plugins
current_plugins = host.get_fact(FisherPlugins)

# Install a plugin only if another is present
if 'ilancosman/tide' in current_plugins:
    fisher.packages(
        name="Install Tide extensions",
        packages='jorgebucaran/nvm.fish',
        present=True,
    )
```

## Notes

- **Plugin naming**: Fisher plugins are typically referenced using GitHub-style names (e.g., `username/repository`)
- **Version tags**: You can specify versions using the `@` syntax (e.g., `ilancosman/tide@v5`)
- **Case insensitivity**: Plugin name comparisons are case-insensitive
- **Idempotency**: Operations are idempotent; running them multiple times produces the same result
- **Error handling**: The `FisherPlugins` fact gracefully handles cases where Fisher is not installed, returning an empty list
- **Shell requirement**: All operations require the Fish shell to be available on the target system
- **Input redirection**: All Fish commands use `</dev/null` to prevent stdin-related issues in non-interactive environments

## Related Files

- `pyinfra_fisher/operations.py`: Implementation of Fisher operations
- `pyinfra_fisher/facts.py`: Implementation of Fisher facts
- `configure.py`: Example usage in your dotfiles configuration
