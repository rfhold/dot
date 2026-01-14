from pyinfra import host
from pyinfra.api import operation

from .facts import BunGlobalPackages


@operation()
def packages(packages=None, present=True, update=False):
    """
    Manage globally installed Bun packages.

    Args:
        packages (list): List of packages to install/remove globally
        present (bool): Whether packages should be installed (True) or removed (False)
        update (bool): Whether to update packages to latest version (reinstalls even if present)

    Example:
        bun.packages(
            name="Install global Bun packages",
            packages=[
                'opencode-ai',
                'typescript',
            ],
            present=True,
        )

        # Update to latest versions
        bun.packages(
            name="Update global Bun packages",
            packages=['opencode-ai'],
            update=True,
        )
    """

    if packages is None:
        packages = []

    if isinstance(packages, str):
        packages = [packages]

    current_packages = host.get_fact(BunGlobalPackages) or []
    current_packages_lower = [p.lower() for p in current_packages]

    if present:
        if update:
            # Update mode: reinstall all specified packages
            for package in packages:
                yield f'bun add -g {package}'
        else:
            # Normal mode: only install missing packages
            to_install = [
                pkg for pkg in packages
                if pkg.lower() not in current_packages_lower
            ]

            for package in to_install:
                yield f'bun add -g {package}'
    else:
        to_remove = [
            pkg for pkg in packages
            if pkg.lower() in current_packages_lower
        ]

        for package in to_remove:
            yield f'bun remove -g {package}'


@operation()
def update(packages=None):
    """
    Update globally installed Bun packages.

    Args:
        packages (list, optional): List of packages to update. If None, updates all global packages.

    Example:
        # Update all global packages
        bun.update(
            name="Update all global Bun packages",
        )

        # Update specific packages
        bun.update(
            name="Update specific global packages",
            packages=['opencode-ai', 'typescript'],
        )
    """

    if packages is None:
        # Update all global packages
        yield 'bun update -g'
    else:
        if isinstance(packages, str):
            packages = [packages]

        # Update specific packages (reinstall with latest)
        for package in packages:
            yield f'bun add -g {package}'
