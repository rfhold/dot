"""
Fisher plugin manager operations for pyinfra.

Example usage in configure.py:

    from pyinfra_fisher import operations as fisher
    
    fisher.packages(
        name="Install Fish plugins",
        packages=[
            'jorgebucaran/fisher',
            'realiserad/fish-ai',
        ],
        present=True,
    )
"""

from . import operations, facts

__all__ = ['operations', 'facts']
