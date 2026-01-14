"""
Go package operations for pyinfra.

Example usage in configure.py:

    from pyinfra_go import operations as go

    go.packages(
        name="Install Go packages",
        packages=[
            'github.com/charmbracelet/gum@latest',
            'github.com/jesseduffield/lazygit@latest',
        ],
        present=True,
    )
"""

from . import operations, facts

__all__ = ['operations', 'facts']
