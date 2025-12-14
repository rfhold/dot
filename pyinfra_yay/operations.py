from pyinfra import host
from pyinfra.api import operation

from .facts import YayPackages


@operation()
def packages(packages=None, present=True):
    """
    Manage AUR packages via yay.

    Args:
        packages (list): List of AUR packages to install/remove
        present (bool): Whether packages should be installed (True) or removed (False)

    Example:
        yay.packages(
            name="Install AUR packages",
            packages=[
                'opencode',
                'spotify',
            ],
            present=True,
        )
    """

    if packages is None:
        packages = []

    if isinstance(packages, str):
        packages = [packages]

    current_packages = host.get_fact(YayPackages) or []
    current_packages_lower = [p.lower() for p in current_packages]

    if present:
        to_install = [
            pkg for pkg in packages
            if pkg.lower() not in current_packages_lower
        ]

        for package in to_install:
            yield f'yay -S --noconfirm --needed {package}'
    else:
        to_remove = [
            pkg for pkg in packages
            if pkg.lower() in current_packages_lower
        ]

        for package in to_remove:
            yield f'yay -Rns --noconfirm {package}'
