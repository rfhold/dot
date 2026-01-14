"""
Bun global package operations for pyinfra.

Example usage in configure.py:

    from pyinfra_bun import operations as bun

    bun.packages(
        name="Install global Bun packages",
        packages=[
            'opencode-ai',
            'typescript',
        ],
        present=True,
    )
"""

from . import operations, facts

__all__ = ['operations', 'facts']
