from pyinfra.api import FactBase


class GitSigningConfigCurrent(FactBase):
    """
    Returns True if git signing config matches the current GPG key state.

    Uses the setup-git-signing --check script to determine if the
    ~/.gitconfig.local file is correctly configured based on whether
    the GPG signing key is present.
    """

    def command(self, script_path: str):
        # The script outputs "current" on success, "needs_update" on failure
        # We use || true to ensure the command always succeeds for pyinfra
        return f"{script_path} --check 2>/dev/null || echo needs_update"

    def process(self, output):
        # Check if output indicates config is current
        # output is a list of lines from stdout
        if not output:
            return False
        return output[0].strip() == "current"


class GpgAgentConfigCurrent(FactBase):
    """
    Returns True if gpg-agent.conf matches the current environment.

    Uses the setup-gpg-agent --check script to determine if the
    ~/.gnupg/gpg-agent.conf file is correctly configured for the
    current OS and desktop environment (e.g., Hyprland).
    """

    def command(self, script_path: str):
        # The script outputs "current" on success, "needs_update" on failure
        # We use || true to ensure the command always succeeds for pyinfra
        return f"{script_path} --check 2>/dev/null || echo needs_update"

    def process(self, output):
        # Check if output indicates config is current
        # output is a list of lines from stdout
        if not output:
            return False
        return output[0].strip() == "current"
