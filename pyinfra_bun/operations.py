from shlex import quote

from pyinfra import host
from pyinfra.api import operation

from .facts import BunGlobalPackages, BunProjectDependencies


@operation()
def project_dependencies(path):
    """Install the dot checkout's locked dependencies without lifecycle scripts."""
    if not host.get_fact(BunProjectDependencies, path=path):
        yield f"bun {quote(path + '/pyinfra_bun/project-install.js')} install {quote(path)}"


@operation()
def packages(packages=None, present=True, update=False, trust=False):
    """
    Manage globally installed Bun packages.

    Args:
        packages (list): Package names or name@version specs to install/remove globally
        present (bool): Whether packages should be installed (True) or removed (False)
        update (bool): Reinstall requested specs even if present (unpinned names use latest)
        trust (bool): Allow lifecycle scripts for explicitly installed packages

    Example:
        bun.packages(
            name="Install global Bun packages",
            packages=[
                '@opencode/cli@2.0.31',
                'typescript',
            ],
            present=True,
            trust=True,
        )

        # Update to latest versions
        bun.packages(
            name="Update global Bun packages",
            packages=['@opencode/cli'],
            update=True,
        )
    """

    if packages is None:
        packages = []

    if isinstance(packages, str):
        packages = [packages]

    current_packages = host.get_fact(BunGlobalPackages) or {}
    trust_flag = " --trust" if trust else ""

    for package in packages:
        name, version = _package_spec(package)
        current_version = current_packages.get(name.lower())
        if present:
            if update or current_version is None or (version and version != current_version):
                yield f"bun add -g{trust_flag} {quote(package)}"
        elif current_version is not None:
            yield f"bun remove -g {quote(name)}"


def _package_spec(package):
    name, separator, version = package.rpartition("@")
    if separator and name:
        return name, version
    return package, None


@operation()
def update(packages=None, trust=False):
    """
    Update globally installed Bun packages.

    Args:
        packages (list, optional): List of packages to update. If None, updates all global packages.
        trust (bool): Allow lifecycle scripts for explicitly named packages

    Example:
        # Update all global packages
        bun.update(
            name="Update all global Bun packages",
        )

        # Update specific packages
        bun.update(
            name="Update specific global packages",
            packages=['@opencode/cli', 'typescript'],
        )
    """

    if packages is None:
        if trust:
            raise ValueError("trust=True requires explicit package names")
        # Update all global packages
        yield 'bun update -g'
    else:
        if isinstance(packages, str):
            packages = [packages]

        # Update specific packages (reinstall with latest)
        for package in packages:
            trust_flag = " --trust" if trust else ""
            yield f"bun add -g{trust_flag} {quote(package)}"
