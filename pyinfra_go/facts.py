from pyinfra.api import FactBase


class GoInstalledPackages(FactBase):
    """
    Returns a list of Go packages installed via 'go install'.
    
    Checks GOPATH/bin or GOBIN for installed binaries and maps them
    back to their package paths where possible.
    
    Example:
        packages = host.get_fact(GoInstalledPackages)
        # Returns: ['gum', 'lazygit', 'k9s']
    """
    
    # List binaries in GOBIN or GOPATH/bin
    # Default GOPATH is ~/go, so binaries are in ~/go/bin
    command = 'ls -1 "${GOBIN:-${GOPATH:-$HOME/go}/bin}" 2>/dev/null || true'
    
    def process(self, output):
        if not output:
            return []
        return [line.strip() for line in output if line.strip()]
