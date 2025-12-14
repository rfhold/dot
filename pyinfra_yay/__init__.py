"""
Yay AUR helper operations for pyinfra.

Example usage in configure.py:

    from pyinfra_yay import operations as yay

    yay.packages(
        name="Install AUR packages",
        packages=[
            'opencode',
            'spotify',
        ],
        present=True,
    )
"""

from . import operations, facts

__all__ = ['operations', 'facts']
