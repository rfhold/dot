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
from pyinfra.facts.files import FindFiles, FindDirectories, File, Link
from pyinfra.facts.server import Command, Home, Os, Which
from pyinfra_fisher import operations as fisher
from pyinfra_paru import operations as paru
from pyinfra_bun import operations as bun
from pyinfra_go import operations as go
from pyinfra_git.facts import GitSigningConfigCurrent, GpgAgentConfigCurrent

# Check if we're in upgrade mode
upgrade_mode = os.environ.get("DOTFILES_UPGRADE", "0") == "1"
pull_mode = os.environ.get("DOTFILES_PULL", "0") == "1"

# -----------------------------------------------------------------------------
# Package definitions
# -----------------------------------------------------------------------------

PACKAGES = {
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
        "brew": [
            "fish",
            "fisher",
            "tmux",
            "neovim",
            "ripgrep",
            "fd",
            "fzf",
            "btop",
            "direnv",
        ],
        "pacman": [
            "fish",
            "fisher",
            "tmux",
            "neovim",
            "ripgrep",
            "fd",
            "fzf",
            "btop",
            "direnv",
        ],
        "apk": [
            "fish",
            "tmux",
            "neovim",
            "ripgrep",
            "fd",
            "fzf",
            "btop",
            "direnv",
        ],  # fisher installed via curl
        "apt": [
            "fish",
            "tmux",
            "neovim",
            "ripgrep",
            "fd-find",
            "fzf",
            "btop",
            "direnv",
        ],
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

# System-level build/runtime dependencies for specific apps (installed separately from PACKAGES)
SYSTEM_DEPS = {
    # Tauri runtime/build dependencies for Cuthulu (Arch only)
    "cuthulu": {
        "pacman": [
            "webkit2gtk-4.1",
            "libayatana-appindicator",
            "gtk3",
            "librsvg",
            "libsoup3",
        ],
    },
    # Tauri runtime/build dependencies for Walter (Arch only)
    "walter": {
        "pacman": [
            "webkit2gtk-4.1",
            "libayatana-appindicator",
            "gtk3",
            "librsvg",
            "libsoup3",
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
        link_info = host.get_fact(Link, path=link_path)
        # link_info is False when path exists but is a real directory (not a symlink)
        if link_info is False:
            real_dir_children.append(path)
            continue
        paths.append(path)

    for path in paths:
        if path == source:
            continue

        dst = path.replace(source, "", 1).lstrip("/")
        if dst in exclude:
            continue
        link_path = f"{target}/{dst}"
        link_target = f"{source}/{dst}"

        link_info = host.get_fact(Link, path=link_path)
        if isinstance(link_info, dict) and link_info.get("link_target") == link_target:
            continue

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
                sub_excludes.append(ex[len(prefix) :])
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
# Dotfiles repo
# -----------------------------------------------------------------------------

git.repo(
    name="Dotfiles repo",
    src="git@git.holdenitdown.net:rfhold/dot.git",
    dest=f"{home}/dot",
    pull=pull_mode,
    ssh_keyscan=True,
)

# -----------------------------------------------------------------------------
# Symlink configs
# -----------------------------------------------------------------------------

link_config_dir(f"{home}/dot/.config", f"{home}/.config")
link_config_dir(f"{home}/dot/home", home, exclude=[".ssh/authorized_keys"])

# -----------------------------------------------------------------------------
# Package management
# -----------------------------------------------------------------------------

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
# Managed app repos (clone + make install)
# -----------------------------------------------------------------------------

MANAGED_APPS = [
    {
        "name": "cuthulu",
        "src": "git@git.holdenitdown.net:rfhold/cuthulu.git",
        "dest": f"{home}/repos/rfhold/cuthulu",
        "system_deps_key": "cuthulu",
    },
    {
        "name": "walter",
        "src": "git@git.holdenitdown.net:rfhold/walter.git",
        "dest": f"{home}/repos/rfhold/walter",
        "system_deps_key": "walter",
    },
    {
        "name": "waltr-grafana",
        "src": "git@git.holdenitdown.net:rfhold/waltr-grafana.git",
        "dest": f"{home}/repos/rfhold/waltr-grafana",
    },
    {
        "name": "axol-query",
        "src": "git@git.holdenitdown.net:rfhold/axol.git",
        "dest": f"{home}/repos/rfhold/axol",
    },
]

for app in MANAGED_APPS:
    app_dest = app["dest"]
    app_parent = "/".join(app_dest.rstrip("/").split("/")[:-1])

    files.directory(
        name=f"Ensure parent dir for {app['name']}",
        path=app_parent,
        present=True,
    )

    # Install system-level build/runtime deps (e.g. Tauri libs on Arch)
    sys_deps = SYSTEM_DEPS.get(app.get("system_deps_key", ""), {}).get(pkg_manager)
    if sys_deps and not is_container():
        if pkg_manager == "pacman":
            pacman.packages(
                name=f"Install {app['name']} system deps",
                packages=sys_deps,
                present=True,
                _sudo=True,
            )

    clone = git.repo(
        name=f"Clone {app['name']}",
        src=app["src"],
        dest=app_dest,
        pull=upgrade_mode,
        ssh_keyscan=True,
    )

    server.shell(
        name=f"Install {app['name']}",
        commands=[f"make -C {app_dest} install"],
        _if=clone.did_change,
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

# -----------------------------------------------------------------------------
# Org-scoped OpenCode skills
# -----------------------------------------------------------------------------

ORG_SKILLS = {
    "rfhold": {
        "src": "git@git.holdenitdown.net:rfhold/skills.git",
        "dir": f"{home}/repos/rfhold",
    },
    "cfaintl": {
        "src": "git@github.com:cfaintl/skills.git",
        "dir": f"{home}/repos/cfaintl",
    },
}

for org, config in ORG_SKILLS.items():
    org_dir = config["dir"]
    opencode_dir = f"{org_dir}/.opencode"
    skills_dir = f"{opencode_dir}/skills"

    org_exists = host.get_fact(
        Command, command=f'test -d "{org_dir}" && echo yes || echo no'
    ).strip()
    if org_exists != "yes":
        continue

    files.directory(
        name=f"Ensure {org} .opencode directory",
        path=opencode_dir,
        present=True,
    )

    git.repo(
        name=f"Clone {org} skills repo",
        src=config["src"],
        dest=skills_dir,
        pull=pull_mode,
        ssh_keyscan=True,
    )

    files.line(
        name=f"Write {org} .envrc for OPENCODE_CONFIG_DIR",
        path=f"{org_dir}/.envrc",
        line=f'export OPENCODE_CONFIG_DIR="{opencode_dir}"',
        present=True,
    )

    server.shell(
        name=f"Allow direnv for {org}",
        commands=[f'direnv allow "{org_dir}/.envrc"'],
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
