"""
Bun global package operations for pyinfra.

Example usage in configure.py:

    from pyinfra_bun import operations as bun

    bun.packages(
        name="Install global Bun packages",
        packages=[
            '@opencode/cli@2.0.31',
            'typescript',
        ],
        present=True,
        trust=True,
    )
"""

from . import operations, facts

__all__ = ['operations', 'facts']
