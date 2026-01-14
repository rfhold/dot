from pyinfra import host
from pyinfra.api import operation

from .facts import GoInstalledPackages


@operation()
def packages(packages=None, present=True, update=False):
    """
    Manage Go packages installed via 'go install'.

    Args:
        packages (list): List of packages to install/remove. Each package should be
                        a full module path, optionally with version (e.g., 
                        'github.com/charmbracelet/gum@latest')
        present (bool): Whether packages should be installed (True) or removed (False)
        update (bool): Whether to update packages to latest version (reinstalls even if present)

    Example:
        go.packages(
            name="Install Go tools",
            packages=[
                'github.com/charmbracelet/gum@latest',
                'github.com/jesseduffield/lazygit@latest',
            ],
            present=True,
        )

        # Update to latest versions
        go.packages(
            name="Update Go tools",
            packages=['github.com/charmbracelet/gum@latest'],
            update=True,
        )
    """

    if packages is None:
        packages = []

    if isinstance(packages, str):
        packages = [packages]

    # Get currently installed binaries
    current_binaries = host.get_fact(GoInstalledPackages) or []
    current_binaries_lower = [b.lower() for b in current_binaries]

    if present:
        for package in packages:
            # Extract binary name from package path
            # e.g., 'github.com/charmbracelet/gum@latest' -> 'gum'
            binary_name = package.split('/')[-1].split('@')[0].lower()
            
            if update or binary_name not in current_binaries_lower:
                yield f'go install {package}'
    else:
        for package in packages:
            # Extract binary name for removal
            binary_name = package.split('/')[-1].split('@')[0]
            
            if binary_name.lower() in current_binaries_lower:
                # Remove binary from GOBIN/GOPATH
                yield f'rm -f "${{GOBIN:-${{GOPATH:-$HOME/go}}/bin}}/{binary_name}"'
