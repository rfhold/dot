# pyinfra_fisher/facts.py

## Overview
Provides fact collectors for querying Fisher plugin installation state. Facts are used by pyinfra to gather information about the current state of target hosts before applying operations.

## API Reference

### FisherPlugins

**Description**: A fact collector that returns a list of currently installed Fisher plugins on the target host.

**Base Class**: `pyinfra.api.FactBase`

**Command**: 
```bash
fish -c "fisher list" 2>/dev/null || true
```

**Returns**: `list[str]` - List of installed plugin identifiers (e.g., `['jorgebucaran/fisher', 'ilancosman/tide@v5']`)

**Behavior**:
- Returns an empty list if Fisher is not installed
- Returns an empty list if the command fails
- Filters out empty lines from output
- Each plugin is returned as a string identifier (may include version tags)

**Example**:
```python
from pyinfra import host
from pyinfra_fisher.facts import FisherPlugins

# Query installed plugins
plugins = host.get_fact(FisherPlugins)
# Returns: ['jorgebucaran/fisher', 'realiserad/fish-ai', 'ilancosman/tide@v5']

# Check if specific plugin is installed
if 'jorgebucaran/fisher' in plugins:
    print("Fisher is installed")
```

### process(output)

**Description**: Processes the raw command output to extract the list of installed plugins.

**Parameters**:
- `output` (list[str]): Raw output lines from the command execution

**Returns**: `list[str]` - Filtered list of plugin names with whitespace stripped

**Implementation Details**:
- Filters out empty lines
- Strips whitespace from each line
- Returns empty list for falsy input

## Dependencies
- **External**: 
  - `pyinfra.api.FactBase` - Base class for fact collectors

## Notes
- The command includes `2>/dev/null` to suppress stderr output
- The `|| true` ensures the command always succeeds (exit code 0) even if Fisher isn't installed
- Plugin names may include version tags (e.g., `plugin@v5`)
- Case-sensitive plugin names are preserved as returned by Fisher
