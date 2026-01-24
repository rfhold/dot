"""
Paru AUR helper operations for pyinfra.

Example usage in configure.py:

    from pyinfra_paru import operations as paru

    paru.packages(
        name="Install AUR packages",
        packages=[
            'opencode',
            'spotify',
        ],
        present=True,
    )
"""

from . import operations, facts

__all__ = ["operations", "facts"]
