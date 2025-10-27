from pyinfra import host
from pyinfra.api import operation

from .facts import FisherPlugins


@operation()
def packages(packages=None, present=True):
    """
    Manage Fisher plugin packages.
    
    Args:
        packages (list): List of Fisher plugins to install/remove
        present (bool): Whether packages should be installed (True) or removed (False)
    
    Example:
        fisher.packages(
            name="Install Fish plugins",
            packages=[
                'jorgebucaran/fisher',
                'realiserad/fish-ai',
                'ilancosman/tide@v5',
            ],
            present=True,
        )
    """
    
    if packages is None:
        packages = []
    
    if isinstance(packages, str):
        packages = [packages]
    
    # Get currently installed plugins
    current_plugins = host.get_fact(FisherPlugins) or []
    
    # Normalize plugin names (case-insensitive comparison)
    current_plugins_lower = [p.lower() for p in current_plugins]
    
    if present:
        # Install missing plugins
        to_install = []
        for package in packages:
            package_lower = package.lower()
            # Check if package is already installed (with or without version tag)
            package_base = package_lower.split('@')[0]
            is_installed = any(
                p.split('@')[0] == package_base 
                for p in current_plugins_lower
            )
            if not is_installed:
                to_install.append(package)
        
        if to_install:
            # Install packages one by one for better error handling
            for package in to_install:
                yield f'fish -c "fisher install {package}" </dev/null'
    else:
        # Remove installed plugins
        to_remove = []
        for package in packages:
            package_lower = package.lower()
            package_base = package_lower.split('@')[0]
            # Find exact match in current plugins
            for current in current_plugins:
                if current.lower().split('@')[0] == package_base:
                    to_remove.append(current)
                    break
        
        if to_remove:
            # Remove packages
            for package in to_remove:
                yield f'fish -c "fisher remove {package}" </dev/null'


@operation()
def update(packages=None):
    """
    Update Fisher plugin packages.
    
    Args:
        packages (list, optional): List of plugins to update. If None, updates all.
    
    Example:
        # Update all plugins
        fisher.update(
            name="Update all Fish plugins",
        )
        
        # Update specific plugins
        fisher.update(
            name="Update specific plugins",
            packages=['realiserad/fish-ai', 'ilancosman/tide'],
        )
    """
    
    if packages is None:
        # Update all plugins
        yield 'fish -c "fisher update" </dev/null'
    else:
        if isinstance(packages, str):
            packages = [packages]
        
        # Update specific packages
        packages_str = ' '.join(packages)
        yield f'fish -c "fisher update {packages_str}" </dev/null'
