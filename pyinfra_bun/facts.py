from pyinfra.api import FactBase


class BunGlobalPackages(FactBase):
    """
    Returns a list of globally installed Bun packages.

    Example:
        packages = host.get_fact(BunGlobalPackages)
        # Returns: ['opencode-ai', 'typescript', 'prettier']
    """

    # List global packages, extract package names from the output
    # bun pm ls -g outputs packages in a tree format like:
    #   ├── @
    #   └── opencode-ai@1.0.0
    # We parse package names by removing tree chars and version suffix
    command = 'bun pm ls -g 2>/dev/null | grep -E "^[├└]" | sed "s/^[├└]── //" | sed "s/@[^@]*$//" | grep -v "^$" || true'

    def process(self, output):
        if not output:
            return []
        return [line.strip() for line in output if line.strip()]
