import os

from pyinfra.context import host
from pyinfra.operations import (
    files,
    brew,
    pacman,
    apk,
    apt,
    git,
    systemd,
    server,
    cargo,
)
from pyinfra.operations.util import any_changed
from pyinfra.facts.files import FindFiles, FindDirectories, File
from pyinfra.facts.server import Command, Home, Os, Which
from pyinfra_fisher import operations as fisher
from pyinfra_paru import operations as paru
from pyinfra_bun import operations as bun
from pyinfra_go import operations as go
from pyinfra_git.facts import GitSigningConfigCurrent, GpgAgentConfigCurrent

# Check if we're in upgrade mode
upgrade_mode = os.environ.get("DOTFILES_UPGRADE", "0") == "1"

# -----------------------------------------------------------------------------
# Package definitions
# -----------------------------------------------------------------------------

PACKAGES = {
    "unwanted": {
        "brew": [],
        "pacman": [],
        "apk": [],
        "apt": [],
    },
    "dev": {
        "brew": ["zig"],
        "pacman": ["zig"],
        "apk": ["zig"],
        "apt": [],
    },
    "gpg": {
        "brew": ["gnupg", "pinentry-mac"],
        "pacman": ["gnupg", "pinentry", "libsecret", "gnome-keyring"],
        "apk": ["gnupg", "pinentry"],
        "apt": ["gnupg", "pinentry-curses"],
    },
    "terminal": {
        "brew": ["fish", "fisher", "tmux", "neovim", "ripgrep", "fd", "fzf", "btop"],
        "pacman": ["fish", "fisher", "tmux", "neovim", "ripgrep", "fd", "fzf", "btop"],
        "apk": [
            "fish",
            "tmux",
            "neovim",
            "ripgrep",
            "fd",
            "fzf",
            "btop",
        ],  # fisher installed via curl
        "apt": ["fish", "tmux", "neovim", "ripgrep", "fd-find", "fzf", "btop"],
    },
    "tools": {
        "brew": ["pulumi", "gh", "argon2"],
        "pacman": [
            "github-cli",
            "tea",
            "argon2",
            "pulumi",
            "kubectl",
            "tekton-cli",
            "p7zip",
            "wireguard-tools",
            "openresolv",
            "yubikey-manager",
            "bind-tools",
            "jq",
        ],
        "apk": ["github-cli", "argon2"],
        "apt": ["gh", "argon2"],
    },
    # Security hardening packages (Arch bare metal only)
    "security": {
        "pacman": ["nftables"],
    },
    # Packages only installed on bare metal (not in containers)
    "bare_metal": {
        "brew": [],  # Docker Desktop installed via cask
        "pacman": [
            "docker",
            "docker-buildx",
            "docker-compose",
            "rootlesskit",  # Required for rootless Docker
            "passt",  # Provides pasta for rootless Docker networking
            "qemu-user-static",  # QEMU emulation binaries
            "qemu-user-static-binfmt",  # binfmt_misc registration
        ],
    },
    # Packages only installed inside containers
    # Note: apt packages require adding Docker/Kubernetes repos first (see container section below)
    "container": {
        "apk": ["docker-cli", "docker-cli-compose", "docker-cli-buildx", "kubectl"],
        "pacman": ["docker", "docker-buildx", "docker-compose", "kubectl"],
        "apt": [],  # Added via add_apt_repo() below
    },
    # Hyprland desktop environment (Arch bare metal only)
    "hyprland": {
        "pacman": [
            # Core Hyprland
            "hyprland",
            "xdg-desktop-portal-hyprland",
            # Hypr ecosystem
            "hyprpaper",
            "hyprlock",
            "hypridle",
            "hyprpicker",
            "hyprpolkitagent",
            "hyprcursor",
            # Desktop utilities
            "waybar",
            "fuzzel",
            "mako",
            "yazi",
            # Screenshot & clipboard
            "grim",
            "slurp",
            "wl-clipboard",
            "cliphist",
            # System utilities
            "brightnessctl",
            "pamixer",
            "playerctl",
            # Terminal
            "ghostty",
            # Notifications
            "libnotify",
            # Theming
            "nwg-look",
            "qt5ct",
            "qt6ct",
            "qt5-wayland",
            "qt6-wayland",
            # Network/Bluetooth
            "networkmanager",
            "network-manager-applet",
            "blueman",
            "kdeconnect",
            # Fonts for waybar icons
            "ttf-font-awesome",
            "noto-fonts",
        ],
    },
}

CASKS = [
    "ghostty",
    "slack",
    "spotify",
    "obsidian",
    "linearmouse",
    "bitwarden",
]

BREW_TAPS = ["pulumi/tap"]

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------


def link_config_dir(source, target, exclude=None):
    import os

    if exclude is None:
        exclude = []

    paths = host.get_fact(FindFiles, path=source, maxdepth=1)
    dirs = host.get_fact(FindDirectories, path=source, maxdepth=1)

    # For subdirectories that already exist as real dirs on the target,
    # link their contents individually instead of replacing the directory.
    real_dir_children = []
    for path in dirs:
        if path == source:
            continue
        dst = path.replace(source, "", 1).lstrip("/")
        if dst in exclude:
            continue
        link_path = f"{target}/{dst}"
        try:
            if os.path.isdir(link_path) and not os.path.islink(link_path):
                real_dir_children.append(path)
                continue
        except OSError:
            pass
        paths.append(path)

    for path in paths:
        if path == source:
            continue

        dst = path.replace(source, "", 1).lstrip("/")
        if dst in exclude:
            continue
        link_path = f"{target}/{dst}"
        link_target = f"{source}/{dst}"

        try:
            if os.path.islink(link_path) and os.readlink(link_path) == link_target:
                continue
        except (OSError, FileNotFoundError):
            pass

        files.link(
            name=f"Link {target}/{dst}",
            path=link_path,
            target=link_target,
            force=True,
            force_backup=True,
        )

    # Recurse into subdirectories that exist as real dirs on the target
    for subdir in real_dir_children:
        sub_dst = subdir.replace(source, "", 1).lstrip("/")
        # Propagate excludes relative to this subdirectory
        sub_excludes = []
        prefix = sub_dst + "/"
        for ex in exclude:
            if ex.startswith(prefix):
                sub_excludes.append(ex[len(prefix):])
        link_config_dir(
            subdir,
            f"{target}/{sub_dst}",
            exclude=sub_excludes,
        )


def install_packages(name, key, present=True):
    pkgs = PACKAGES.get(key, {}).get(pkg_manager)
    if not pkgs:
        return

    if pkg_manager == "brew":
        brew.packages(name=name, packages=pkgs, present=present)
    elif pkg_manager == "pacman":
        pacman.packages(name=name, packages=pkgs, present=present, _sudo=True)
    elif pkg_manager == "apk":
        apk.packages(name=name, packages=pkgs, present=present, _sudo=True)
    elif pkg_manager == "apt":
        apt.packages(name=name, packages=pkgs, present=present, _sudo=True)


def add_apt_repo(name, key_url, keyring_name, repo_line, filename):
    """Add an apt repository with modern keyring approach (Debian only)."""
    keyring_dir = "/etc/apt/keyrings"
    keyring_path = f"{keyring_dir}/{keyring_name}"

    # Ensure keyrings directory exists
    files.directory(
        name=f"[{name}] Create keyrings directory",
        path=keyring_dir,
        present=True,
        mode="0755",
        user="root",
        group="root",
        _sudo=True,
    )

    # Download and convert GPG key if not present
    keyring_exists = host.get_fact(File, path=keyring_path)
    if not keyring_exists:
        server.shell(
            name=f"[{name}] Download and convert GPG key",
            commands=[
                f"curl -fsSL '{key_url}' | gpg --dearmor -o '{keyring_path}'",
            ],
            _sudo=True,
        )

    # Ensure correct permissions on keyring
    files.file(
        name=f"[{name}] Set keyring permissions",
        path=keyring_path,
        present=True,
        mode="0644",
        user="root",
        group="root",
        _sudo=True,
    )

    # Add repository
    apt.repo(
        name=f"[{name}] Add apt repository",
        src=repo_line,
        filename=filename,
        present=True,
        _sudo=True,
    )


# -----------------------------------------------------------------------------
# Detect OS and package manager
# -----------------------------------------------------------------------------


def is_alpine():
    """Check if running on Alpine Linux."""
    return host.get_fact(File, path="/etc/alpine-release") is not None


def is_debian():
    """Check if running on Debian/Ubuntu."""
    return host.get_fact(File, path="/etc/debian_version") is not None


def is_container():
    """Check if running inside a container."""
    # Check for /.dockerenv (Docker) or /run/.containerenv (Podman)
    if host.get_fact(File, path="/.dockerenv") is not None:
        return True
    if host.get_fact(File, path="/run/.containerenv") is not None:
        return True
    return False


def has_systemd():
    """Check if systemd is running (PID 1 is systemd)."""
    # During Docker build, there's no init system, so systemd operations will fail
    comm = host.get_fact(File, path="/proc/1/comm")
    if comm is None:
        return False
    # Read the actual content to check if it's systemd
    result = host.get_fact(
        Command, command="cat /proc/1/comm 2>/dev/null || echo unknown"
    )
    return result.strip() == "systemd" if result else False


os_name = host.get_fact(Os)

if os_name == "Darwin":
    pkg_manager = "brew"
elif os_name == "Linux":
    if is_alpine():
        pkg_manager = "apk"
    elif is_debian():
        pkg_manager = "apt"
    else:
        pkg_manager = "pacman"  # Assuming Arch
else:
    raise Exception(f"Unsupported OS: {os_name}")

home = host.get_fact(Home)

# -----------------------------------------------------------------------------
# Symlink configs
# -----------------------------------------------------------------------------

link_config_dir(f"{home}/dot/.config", f"{home}/.config")
link_config_dir(f"{home}/dot/home", home, exclude=[".ssh/authorized_keys"])

# -----------------------------------------------------------------------------
# Package management
# -----------------------------------------------------------------------------

install_packages("Remove unwanted packages", "unwanted", present=False)

# Brew taps (macOS only)
if pkg_manager == "brew":
    for tap in BREW_TAPS:
        brew.tap(name=f"Add {tap} tap", src=tap)

install_packages("Install dev packages", "dev")
install_packages("Install GPG packages", "gpg")
install_packages("Install terminal packages", "terminal")
install_packages("Install tools", "tools")

# Environment-specific packages
if is_container():
    # Add Docker and Kubernetes repos for Debian (apt requires adding repos first)
    if pkg_manager == "apt":
        arch = host.get_fact(Command, command="dpkg --print-architecture").strip()

        add_apt_repo(
            name="Docker",
            key_url="https://download.docker.com/linux/debian/gpg",
            keyring_name="docker.gpg",
            repo_line=f"deb [arch={arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable",
            filename="docker",
        )

        add_apt_repo(
            name="Kubernetes",
            key_url="https://pkgs.k8s.io/core:/stable:/v1.32/deb/Release.key",
            keyring_name="kubernetes-apt-keyring.gpg",
            repo_line=f"deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.32/deb/ /",
            filename="kubernetes",
        )

        # Update apt cache after adding repos
        apt.update(
            name="Update apt cache after adding repos",
            _sudo=True,
        )

        # Install Docker and Kubernetes packages
        apt.packages(
            name="Install Docker CLI and kubectl",
            packages=[
                "docker-ce-cli",
                "docker-buildx-plugin",
                "docker-compose-plugin",
                "kubectl",
            ],
            present=True,
            _sudo=True,
        )

    install_packages("Install container packages", "container")
else:
    install_packages("Install bare metal packages", "bare_metal")

    # Hyprland desktop environment (Arch only)
    if pkg_manager == "pacman":
        install_packages("Install Hyprland desktop", "hyprland")

        # Add user to required groups for GPU/display access
        username = host.get_fact(Command, command="whoami").strip()
        current_groups = host.get_fact(Command, command="groups").strip().split()
        required_groups = ["video", "input", "render"]
        missing_groups = [g for g in required_groups if g not in current_groups]

        if missing_groups:
            server.user(
                name="Add user to required groups for Hyprland",
                user=username,
                groups=missing_groups,
                append=True,
                _sudo=True,
            )

        # Enable NetworkManager for network management
        systemd.service(
            name="Enable NetworkManager",
            service="NetworkManager",
            running=True,
            enabled=True,
            _sudo=True,
        )

        # Docker rootless setup (uses docker-rootless-extras AUR package)
        # Configure subuid/subgid for rootless containers
        files.line(
            name="Configure subuid for rootless Docker",
            path="/etc/subuid",
            line=f"{username}:100000:65536",
            present=True,
            _sudo=True,
        )

        files.line(
            name="Configure subgid for rootless Docker",
            path="/etc/subgid",
            line=f"{username}:100000:65536",
            present=True,
            _sudo=True,
        )

        # Enable user lingering (allows user services to run at boot)
        # Check if lingering is already enabled before running command
        linger_status = host.get_fact(
            Command,
            command=f"loginctl show-user {username} --property=Linger 2>/dev/null || echo 'Linger=no'",
        ).strip()

        if linger_status != "Linger=yes":
            server.shell(
                name="Enable user lingering for rootless Docker",
                commands=[f"loginctl enable-linger {username}"],
                _sudo=True,
            )

        # Load iptables kernel modules at boot (required for Docker networking)
        files.put(
            name="Configure iptables modules to load at boot",
            src=f"{home}/dot/etc/modules-load.d/docker-rootless.conf",
            dest="/etc/modules-load.d/docker-rootless.conf",
            mode="644",
            user="root",
            group="root",
            _sudo=True,
        )

        # Disable rootful Docker (we use rootless instead)
        systemd.service(
            name="Disable rootful Docker socket",
            service="docker.socket",
            running=False,
            enabled=False,
            _sudo=True,
        )

        systemd.service(
            name="Disable rootful Docker service",
            service="docker.service",
            running=False,
            enabled=False,
            _sudo=True,
        )

        # NOTE: Rootless Docker user service is enabled after AUR packages are installed
        # (see end of file after paru.packages)

        # Enable binfmt service for QEMU cross-arch builds
        systemd.service(
            name="Enable binfmt for QEMU cross-arch builds",
            service="systemd-binfmt",
            running=True,
            enabled=True,
            _sudo=True,
        )

        # ---------------------------------------------------------------------
        # Security hardening (Arch bare metal only)
        # ---------------------------------------------------------------------

        install_packages("Install security packages", "security")

        # Deploy nftables firewall configuration
        files.put(
            name="Deploy nftables firewall config",
            src=f"{home}/dot/etc/nftables.conf",
            dest="/etc/nftables.conf",
            mode="644",
            user="root",
            group="root",
            _sudo=True,
        )

        # nftables is a oneshot service - it loads rules and exits
        # running=False prevents pyinfra from trying to "start" a oneshot
        systemd.service(
            name="Enable nftables firewall",
            service="nftables",
            running=False,
            enabled=True,
            _sudo=True,
        )

        # Deploy sysctl hardening configuration
        sysctl_config = files.put(
            name="Deploy sysctl hardening config",
            src=f"{home}/dot/etc/sysctl.d/99-hardening.conf",
            dest="/etc/sysctl.d/99-hardening.conf",
            mode="644",
            user="root",
            group="root",
            _sudo=True,
        )

        server.shell(
            name="Apply sysctl hardening settings",
            commands=["sysctl --system"],
            _sudo=True,
            _if=sysctl_config.did_change,
        )

        # Deploy NetworkManager MAC randomization config
        files.directory(
            name="Ensure NetworkManager conf.d directory exists",
            path="/etc/NetworkManager/conf.d",
            present=True,
            mode="755",
            user="root",
            group="root",
            _sudo=True,
        )

        nm_config = files.put(
            name="Deploy NetworkManager MAC randomization config",
            src=f"{home}/dot/etc/NetworkManager/conf.d/99-mac-randomization.conf",
            dest="/etc/NetworkManager/conf.d/99-mac-randomization.conf",
            mode="644",
            user="root",
            group="root",
            _sudo=True,
        )

        server.shell(
            name="Reload NetworkManager configuration",
            commands=["nmcli general reload conf"],
            _sudo=True,
            _if=nm_config.did_change,
        )

# GUI apps (macOS only)
if pkg_manager == "brew":
    brew.casks(name="Install GUI applications", casks=CASKS)

# -----------------------------------------------------------------------------
# Git signing configuration
# -----------------------------------------------------------------------------

git_signing_script = f"{home}/dot/bin/setup-git-signing"
git_signing_current = host.get_fact(
    GitSigningConfigCurrent, script_path=git_signing_script
)

if not git_signing_current:
    server.shell(
        name="Configure git signing based on GPG key availability",
        commands=[git_signing_script],
    )

# -----------------------------------------------------------------------------
# GPG agent configuration
# -----------------------------------------------------------------------------

gpg_agent_script = f"{home}/dot/bin/setup-gpg-agent"
gpg_agent_current = host.get_fact(GpgAgentConfigCurrent, script_path=gpg_agent_script)

if not gpg_agent_current:
    server.shell(
        name="Configure GPG agent based on OS and desktop environment",
        commands=[gpg_agent_script],
    )

# -----------------------------------------------------------------------------
# Tmux Plugin Manager (TPM)
# -----------------------------------------------------------------------------

files.directory(
    name="Ensure tmux plugins directory exists",
    path=f"{home}/.tmux/plugins",
    present=True,
)

git.repo(
    name="Clone Tmux Plugin Manager (TPM)",
    src="https://github.com/tmux-plugins/tpm",
    dest=f"{home}/.tmux/plugins/tpm",
    pull=upgrade_mode,
    _env={"GIT_CONFIG_GLOBAL": "/dev/null"},
)

# -----------------------------------------------------------------------------
# OpenCodes artifacts (from ~/dot/dist/)
# -----------------------------------------------------------------------------

dist_dir = f"{home}/dot/dist"
has_dist = host.get_fact(File, path=f"{dist_dir}/opencodes.js") is not None

if has_dist:
    # --- opencodes-tmux plugin ---
    files.directory(
        name="Ensure opencodes-tmux plugin directory",
        path=f"{home}/.tmux/plugins/opencodes-tmux/bin",
        present=True,
    )

    if os_name == "Darwin":
        tmux_binary_src = f"{dist_dir}/opencodes-tmux-darwin"
    else:
        tmux_binary_src = f"{dist_dir}/opencodes-tmux-linux-amd64"

    tmux_binary_dest = f"{home}/.tmux/plugins/opencodes-tmux/bin/opencodes-tmux"
    tmux_binary_tmp = tmux_binary_dest + ".tmp"
    tmux_binary_put = files.put(
        name="Install opencodes-tmux binary",
        src=tmux_binary_src,
        dest=tmux_binary_tmp,
        mode="755",
    )
    tmux_binary_install = server.shell(
        name="Atomically replace opencodes-tmux binary",
        commands=[f"mv -f {tmux_binary_tmp} {tmux_binary_dest}"],
        _if=tmux_binary_put.did_change,
    )
    tmux_plugin_install = files.put(
        name="Install opencodes-tmux.tmux plugin script",
        src=f"{dist_dir}/opencodes-tmux.tmux",
        dest=f"{home}/.tmux/plugins/opencodes-tmux/opencodes-tmux.tmux",
        mode="755",
    )
    server.shell(
        name="Reload tmux config",
        commands=[f"tmux source-file {home}/.tmux.conf 2>/dev/null || true"],
        _if=any_changed(tmux_binary_install, tmux_plugin_install),
    )

    # --- opencodes opencode plugin ---
    files.directory(
        name="Ensure opencode plugins directory",
        path=f"{home}/.config/opencode/plugins",
        present=True,
    )
    files.put(
        name="Install opencodes opencode plugin",
        src=f"{dist_dir}/opencodes.js",
        dest=f"{home}/.config/opencode/plugins/opencodes.js",
        mode="644",
    )

    # --- opencodes tray binary + service ---
    files.directory(
        name="Ensure ~/.local/bin exists",
        path=f"{home}/.local/bin",
        present=True,
    )

    if os_name == "Darwin":
        tray_binary_src = f"{dist_dir}/opencodes-tray-darwin"
    else:
        tray_binary_src = f"{dist_dir}/opencodes-tray-linux-amd64"

    if os_name == "Darwin":
        tray_install = files.put(
            name="Install opencodes-tray binary",
            src=tray_binary_src,
            dest=f"{home}/.local/bin/opencodes-tray",
            mode="755",
        )
        launchagent_path = f"{home}/Library/LaunchAgents/dev.rholden.opencodes-tray.plist"
        plist_install = files.template(
            name="Write opencodes-tray LaunchAgent plist",
            src=f"{home}/dot/etc/launchagents/opencodes-tray.plist",
            dest=launchagent_path,
            tray_path=f"{home}/.local/bin/opencodes-tray",
        )
        server.shell(
            name="Reload opencodes-tray LaunchAgent",
            commands=[
                f"launchctl unload {launchagent_path} 2>/dev/null || true",
                f"launchctl load {launchagent_path}",
            ],
            _if=any_changed(tray_install, plist_install),
        )
    else:
        # Stop the service before replacing the binary to avoid "Text file busy".
        server.shell(
            name="Stop opencodes-tray before binary update",
            commands=["systemctl --user stop opencodes-tray.service 2>/dev/null || true"],
        )
        tray_install = files.put(
            name="Install opencodes-tray binary",
            src=tray_binary_src,
            dest=f"{home}/.local/bin/opencodes-tray",
            mode="755",
        )
        if has_systemd():
            server.shell(
                name="Restart opencodes-tray service after binary update",
                commands=["systemctl --user restart opencodes-tray.service"],
                _if=tray_install.did_change,
            )

# -----------------------------------------------------------------------------
# Fish plugins
# -----------------------------------------------------------------------------

fisher.packages(
    name="Install Fish plugins",
    packages=[
        "jorgebucaran/nvm.fish",
        "realiserad/fish-ai",
    ],
    present=True,
)

# Ensure fish-ai venv is set up (fisher install may not trigger hooks properly)
fish_ai_venv = f"{home}/.local/share/fish-ai"
fish_ai_python = f"{fish_ai_venv}/bin/python"

# Check if venv exists and has python binary (more thorough check)
venv_exists = host.get_fact(File, path=fish_ai_python) is not None

if not venv_exists:
    server.shell(
        name="Setup fish-ai venv using uv",
        commands=[
            f"uv venv --seed --python 3.13 {fish_ai_venv}",
            f"{fish_ai_venv}/bin/pip install fish-ai@git+https://github.com/realiserad/fish-ai",
        ],
    )

# -----------------------------------------------------------------------------
# Node.js (via nvm.fish)
# -----------------------------------------------------------------------------

# Install node and set default (nvm_default_version only activates on interactive shells)
# Also symlink to ~/.local/bin so node is available in non-fish shells
if not host.get_fact(Which, command="node"):
    server.shell(
        name="Install Node.js LTS via nvm and set as default",
        commands=[
            "fish -c 'nvm install lts && set --universal nvm_default_version lts'",
            f"mkdir -p {home}/.local/bin",
            f"ln -sf {home}/.local/share/nvm/*/bin/node {home}/.local/bin/node",
            f"ln -sf {home}/.local/share/nvm/*/bin/npm {home}/.local/bin/npm",
            f"ln -sf {home}/.local/share/nvm/*/bin/npx {home}/.local/bin/npx",
        ],
    )

# -----------------------------------------------------------------------------
# Bun packages (bun installed via bootstrap.sh)
# -----------------------------------------------------------------------------

bun.packages(
    name="Install global Bun packages",
    packages=[
        "opencode-ai",
    ],
    present=True,
    update=upgrade_mode,
)

# -----------------------------------------------------------------------------
# Cargo packages (installed via cargo for consistency across all platforms)
# -----------------------------------------------------------------------------

cargo.packages(
    name="Install cargo packages",
    packages=["starship"],
    present=True,
)

# -----------------------------------------------------------------------------
# Go packages (installed via go for consistency across all platforms)
# -----------------------------------------------------------------------------

go.packages(
    name="Install Go tools",
    packages=[
        "github.com/charmbracelet/gum@latest",
        "github.com/jesseduffield/lazygit@latest",
        "github.com/jesseduffield/lazydocker@latest",
        "github.com/derailed/k9s@latest",
    ],
    present=True,
    update=upgrade_mode,
)


# -----------------------------------------------------------------------------
# AUR packages (Arch only)
# -----------------------------------------------------------------------------

if pkg_manager == "pacman" and not is_container():
    # Refresh sudo credentials before AUR install (paru calls sudo internally)
    # Skip this entirely - paru will handle sudo prompts itself if needed
    # and we've already authenticated for earlier operations in this run
    pass

    paru.packages(
        name="Install AUR packages",
        packages=[
            "docker-rootless-extras",  # Rootless Docker systemd user units
            "librewolf-bin",
            "maestro",
        ],
        present=True,
    )

    # Enable rootless Docker user service (now that docker-rootless-extras is installed)
    systemd.service(
        name="Enable rootless Docker socket",
        service="docker.socket",
        running=True,
        enabled=True,
        user_mode=True,
    )

    # Disable old tmux-agent service (superseded by opencodes-tray)
    systemd.service(
        name="Disable old tmux-agent service",
        service="tmux-agent.service",
        running=False,
        enabled=False,
        user_mode=True,
        _ignore_errors=True,
    )

    # Enable opencodes-tray user service (tray daemon + tmux session bridging)
    systemd.service(
        name="Enable opencodes-tray user service",
        service="opencodes-tray.service",
        running=True,
        enabled=True,
        daemon_reload=True,
        user_mode=True,
    )

# -----------------------------------------------------------------------------
# OpenSSH Server (containers only - bare metal doesn't need incoming SSH)
# -----------------------------------------------------------------------------

# SSH client is useful everywhere, but SSH server only in containers
if pkg_manager == "pacman":
    pacman.packages(
        name="Install OpenSSH",
        packages=["openssh"],
        present=True,
        _sudo=True,
    )

# Ensure .ssh is a real directory (not a symlink)
server.shell(
    name="Ensure .ssh directory exists",
    commands=[
        f'test -d "{home}/.ssh" -a ! -L "{home}/.ssh" || '
        f'(rm -f "{home}/.ssh" && mkdir -m 700 "{home}/.ssh")',
    ],
)

files.download(
    name="Download GitHub public keys for rfhold",
    src="https://github.com/rfhold.keys",
    dest=f"{home}/.ssh/authorized_keys",
    mode="600",
)

# SSH server configuration (containers only)
if pkg_manager == "pacman" and is_container():
    files.put(
        name="Configure sshd for key-only authentication",
        src=f"{home}/dot/etc/sshd_config.d/99-key-only.conf",
        dest="/etc/ssh/sshd_config.d/99-key-only.conf",
        mode="644",
        user="root",
        group="root",
        _sudo=True,
    )

    if has_systemd():
        # If systemd is running, use the proper operation to enable and start
        systemd.service(
            name="Enable and start sshd",
            service="sshd",
            running=True,
            enabled=True,
            _sudo=True,
        )
    else:
        # During Docker build, systemd isn't running - just enable for boot
        server.shell(
            name="Enable sshd for boot",
            commands=["systemctl enable sshd.service"],
            _sudo=True,
        )
