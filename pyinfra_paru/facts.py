from pyinfra.api import FactBase


class ParuPackages(FactBase):
    """
    Returns a list of foreign (AUR) packages installed via paru/pacman.

    Example:
        packages = host.get_fact(ParuPackages)
        # Returns: ['opencode', 'spotify', 'yay']
    """

    command = 'pacman -Qm 2>/dev/null | cut -d" " -f1 || true'

    def process(self, output):
        if not output:
            return []
        return [line.strip() for line in output if line.strip()]
