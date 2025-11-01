# pyinfra_fisher/__init__.py

## Overview
The main entry point for the pyinfra_fisher package, which provides Fisher plugin manager integration for pyinfra deployments. This module exposes operations and facts for managing Fish shell plugins through Fisher.

## Exports

### operations
Module containing Fisher operations for installing, removing, and updating plugins.

### facts
Module containing Fisher facts for querying installed plugins.

## Usage Example

```python
from pyinfra_fisher import operations as fisher

fisher.packages(
    name="Install Fish plugins",
    packages=[
        'jorgebucaran/fisher',
        'realiserad/fish-ai',
    ],
    present=True,
)
```

## Dependencies
- **Internal**: 
  - `.operations` - Fisher operation functions
  - `.facts` - Fisher fact collectors

## Notes
- This package is designed to work with pyinfra's deployment system
- Requires Fish shell and Fisher to be available on target hosts
- All operations are idempotent and safe to run multiple times
