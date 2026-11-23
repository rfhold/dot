import os
from shlex import quote

from pyinfra import host
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
from pyinfra.facts.brew import BrewCasks
from pyinfra.facts.files import FindFiles, FindDirectories, File, Link
from pyinfra.facts.deb import DebPackages
from pyinfra.facts.pacman import PacmanPackages
from pyinfra.facts.server import Arch, Command, Home, LinuxDistribution, MacosVersion, Os, Which
from pyinfra_fisher import operations as fisher
from pyinfra_paru import operations as paru
from pyinfra_bun import operations as bun
from pyinfra_bun.facts import BunGlobalPackages
from pyinfra_go import operations as go
from pyinfra_git.facts import (
    GitSigningConfigCurrent,
    GpgAgentConfigCurrent,
    SmartcardKeysCurrent,
)

# Check if we're in upgrade mode
upgrade_mode = os.environ.get("DOTFILES_UPGRADE", "0") == "1"
pull_mode = os.environ.get("DOTFILES_PULL", "0") == "1"

# Tag filtering: comma-separated tags to run; empty = run all
_tags_env = os.environ.get("DOTFILES_TAGS", "")
active_tags = {t.strip() for t in _tags_env.split(",") if t.strip()}


def has_tag(tag: str) -> bool:
    return not active_tags or tag in active_tags


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
    "lsp": {
        "brew": [
            "bash-language-server",
            "buf",
            "dockerfile-language-server",
            "gopls",
            "lua-language-server",
            "pyright",
            "rust-analyzer",
            "typescript-language-server",
            "vscode-langservers-extracted",
            "yaml-language-server",
        ],
        "pacman": [
            "bash-language-server",
            "buf",
            "clang",
            "dockerfile-language-server",
            "gopls",
            "lua-language-server",
            "pyright",
            "rust-analyzer",
            "typescript",
            "typescript-language-server",
            "vscode-css-languageserver",
            "vscode-json-languageserver",
            "yaml-language-server",
        ],
        "apk": [],
        "apt": [
            "clangd",
            "gopls",
            "rust-analyzer",
        ],
    },
    "tools": {
        "brew": ["pulumi", "gh", "argon2", "openbao"],
        "pacman": [
            "github-cli",
            "tea",
            "argon2",
            "pulumi",
            "kubectl",
            "tekton-cli",
            "p7zip",
            "wireguard-tools",
            "yubikey-manager",
            "bind-tools",
            "inetutils",
            "jq",
            "openbao",
        ],
        "apk": ["github-cli", "argon2"],
        "apt": ["gh", "argon2"],
    },
    # Packages only installed on bare metal (not in containers)
    "bare_metal": {
        "brew": [],  # Docker Desktop installed via cask
        "pacman": [
            "alacritty",
            "docker",
            "docker-buildx",
            "docker-compose",
            "rootlesskit",  # Required for rootless Docker
            "passt",  # Provides pasta for rootless Docker networking
            "fuse-overlayfs",  # Recommended storage driver for rootless Docker
            "qemu-user-static",  # QEMU emulation binaries
            "qemu-user-static-binfmt",  # binfmt_misc registration
            "librewolf",
        ],
    },
    # Packages only installed inside containers
    # Note: apt packages require adding Docker/Kubernetes repos first (see container section below)
    "container": {
        "apk": ["docker-cli", "docker-cli-compose", "docker-cli-buildx", "kubectl"],
        "pacman": ["docker", "docker-buildx", "docker-compose", "kubectl"],
        "apt": [],  # Added via add_apt_repo() below
    },
    "repository": {
        "apt": ["computer-use"],
        "pacman": ["computer-use"],
    },
}

# System-level build/runtime dependencies for specific apps (installed separately from PACKAGES)
SYSTEM_DEPS = {}

CASKS = [
    "font-meslo-lg-nerd-font",
    "hammerspoon",
    "slack",
    "spotify",
    "obsidian",
    "linearmouse",
    "bitwarden",
]

BREW_TAPS = {
    "pulumi/tap": None,
    "rfhold/tap": "https://git.holdenitdown.net/rfhold/homebrew-tap.git",
}

FORGEJO_REGISTRY = "https://git.holdenitdown.net/api/packages/rfhold"
APT_REPOS = {
    ("debian", "trixie"): {
        "forgejo-rfhold": (
            f"{FORGEJO_REGISTRY}/debian/repository.key",
            "079DAB356BC9ADAC153D0CA391CC5E7E0C22DBF9",
            f"{FORGEJO_REGISTRY}/debian",
            ("amd64", "arm64"),
        ),
    },
}
PACMAN_REPOS = {
    "x86_64": {
        "rfhold.computer-use.git.holdenitdown.net": (
            f"{FORGEJO_REGISTRY}/arch/repository.key",
            "CCB4720047B4EC562427C25900CE9E4919AD3CB3",
            f"{FORGEJO_REGISTRY}/arch/computer-use/x86_64",
            ("arch", "cachyos"),
        ),
    },
}

BUN_LSP_PACKAGES = {
    "brew": ["sql-language-server"],
    "pacman": ["sql-language-server"],
    "apt": [
        "bash-language-server",
        "dockerfile-language-server-nodejs",
        "pyright",
        "sql-language-server",
        "typescript",
        "typescript-language-server",
        "vscode-langservers-extracted",
        "yaml-language-server",
    ],
    "apk": [
        "bash-language-server",
        "dockerfile-language-server-nodejs",
        "pyright",
        "sql-language-server",
        "typescript",
        "typescript-language-server",
        "vscode-langservers-extracted",
        "yaml-language-server",
    ],
}

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
        replace_real_dir = dst == ".agents" and target.startswith(f"{home}/repos/")
        if link_info is False and not replace_real_dir:
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


def ensure_repo_key(name, url, fingerprint, path):
    script = r"""
set -eu
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
verify_key() {
    listing=$(gpg --no-options --batch --homedir "$tmp" --with-colons \
        --show-keys "$1") || return 1
    printf '%s\n' "$listing" | awk -F: -v expected="$fingerprint" '
        $1 == "pub" { count++; primary = 1 }
        $1 == "fpr" && primary { actual = $10; primary = 0 }
        END { exit !(count == 1 && actual == expected) }
    '
}
if [ -f "$path" ] && verify_key "$path"; then
    exit 0
fi
curl --disable --fail --silent --show-error --location \
    --proto '=https' --proto-redir '=https' --max-time 60 --output "$tmp/key.asc" "$url"
if ! verify_key "$tmp/key.asc"; then
    printf 'Unexpected repository key fingerprint for %s\n' "$url" >&2
    exit 1
fi
case "$path" in
    *.gpg)
        gpg --no-options --batch --homedir "$tmp" --dearmor --output "$tmp/key.gpg" "$tmp/key.asc"
        install -m 0644 "$tmp/key.gpg" "$path"
        ;;
    *) install -m 0644 "$tmp/key.asc" "$path" ;;
esac
"""
    server.shell(
        name=f"[{name}] Verify repository public key",
        commands=[
            f"url={quote(url)}; fingerprint={quote(fingerprint)}; path={quote(path)}\n{script}"
        ],
        _sudo=True,
    )


def add_apt_repo(name, key_url, fingerprint, keyring_name, repo_line, filename):
    keyring_dir = "/etc/apt/keyrings"
    keyring_path = f"{keyring_dir}/{keyring_name}"

    files.directory(
        name=f"[{name}] Create keyrings directory",
        path=keyring_dir,
        present=True,
        mode="0755",
        user="root",
        group="root",
        _sudo=True,
    )

    ensure_repo_key(name, key_url, fingerprint, keyring_path)

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


def add_pacman_repo(repo, key_url, fingerprint, url, *, refresh=False):
    key = f"/etc/pacman.d/{repo}.asc"
    lines = [f"[{repo}]", "SigLevel = Required", f"Server = {url}"]
    marker = f"# {{mark}} {repo}"
    ensure_repo_key(repo, key_url, fingerprint, key)
    server.shell(
        name=f"[{repo}] Trust pacman signing key",
        commands=[f"pacman-key --add {key} && pacman-key --lsign-key {fingerprint}"],
        _sudo=True,
    )
    repos = host.get_fact(Command, command="pacman-conf --repo-list").splitlines()
    managed = host.get_fact(
        Command, command=f"grep -Fx '# BEGIN {repo}' /etc/pacman.conf || true"
    )
    if repo not in repos or managed:
        files.block(
            name=f"[{repo}] Add pacman repository",
            path="/etc/pacman.conf",
            marker=marker,
            content=lines,
            _sudo=True,
        )
    else:
        configured = host.get_fact(
            Command, command=f"pacman-conf --repo {repo} Server SigLevel"
        ).splitlines()
        if set(configured) != {
            f"Server = {url}",
            "SigLevel = PackageRequired",
            "SigLevel = PackageTrustedOnly",
            "SigLevel = DatabaseRequired",
            "SigLevel = DatabaseTrustedOnly",
        }:
            raise ValueError(f"Check the existing {repo} section in pacman.conf")

    # Populate this index without refreshing the official repositories.
    repo_config = " ".join(f"'{line}'" for line in lines)
    server.shell(
        name=f"[{repo}] Refresh pacman repository",
        commands=[
            'set -eu; dbpath="$(pacman-conf DBPath)"; '
            f'if {"true" if refresh else "false"} || [ ! -s "$dbpath/sync/{repo}.db" ]; then '
            'cfg="$(mktemp)"; trap \'rm -f "$cfg"\' EXIT; '
            'gpgdir="$(pacman-conf GPGDir)"; '
            "printf '%s\\n' '[options]' 'Architecture = auto' "
            f'"DBPath = $dbpath" "GPGDir = $gpgdir" {repo_config} > "$cfg"; '
            'pacman -Sy --config "$cfg"; fi'
        ],
        _sudo=True,
    )


def configure_package_repos():
    release = host.get_fact(LinuxDistribution)["release_meta"]
    distro = release.get("ID")
    if pkg_manager == "apt":
        suite = release.get("VERSION_CODENAME")
        repos = APT_REPOS.get((distro, suite))
        if not repos:
            return False
        arch = host.get_fact(Command, command="dpkg --print-architecture").strip()
        configured = False
        for name, (key_url, fingerprint, url, arches) in repos.items():
            if arch not in arches:
                continue
            key = f"{name}.asc"
            add_apt_repo(
                name=name,
                key_url=key_url,
                fingerprint=fingerprint,
                keyring_name=key,
                repo_line=f"deb [arch={arch} signed-by=/etc/apt/keyrings/{key}] {url} {suite} main",
                filename=name,
            )
            configured = True
        if configured and not set(PACKAGES["repository"]["apt"]).issubset(
            host.get_fact(DebPackages)
        ):
            apt.update(name="Refresh APT repositories", _sudo=True)
        return configured

    if pkg_manager == "pacman":
        repos = PACMAN_REPOS.get(host.get_fact(Arch), {})
        configured = False
        refresh = not set(PACKAGES["repository"]["pacman"]).issubset(
            host.get_fact(PacmanPackages)
        )
        for repo, (key_url, fingerprint, url, distros) in repos.items():
            if distro in distros:
                add_pacman_repo(repo, key_url, fingerprint, url, refresh=refresh)
                configured = True
        return configured

    return False


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
# Smartcard and SSH key setup (must run before git operations)
# -----------------------------------------------------------------------------

if has_tag("core"):
    smartcard_script = f"{home}/dot/bin/setup-smartcard-keys"
    smartcard_current = host.get_fact(
        SmartcardKeysCurrent, script_path=smartcard_script
    )

    if not smartcard_current:
        server.shell(
            name="Setup smartcard GPG keys and SSH host keys",
            commands=[smartcard_script],
        )

# -----------------------------------------------------------------------------
# SSH directory setup (must be early for SSH key operations)
# -----------------------------------------------------------------------------

if has_tag("core"):
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

# -----------------------------------------------------------------------------
# Dotfiles repo
# -----------------------------------------------------------------------------

if has_tag("core"):
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

if has_tag("core"):
    link_config_dir(f"{home}/dot/.config", f"{home}/.config")
    files.directory(
        name="Ensure repos directory exists",
        path=f"{home}/repos",
        present=True,
    )
    link_config_dir(
        f"{home}/dot/home",
        home,
        exclude=[".ssh/authorized_keys", "repos"],
    )

# -----------------------------------------------------------------------------
# Package management
# -----------------------------------------------------------------------------

if has_tag("packages"):
    install_packages("Install dev packages", "dev")
    install_packages("Install GPG packages", "gpg")
    install_packages("Install terminal packages", "terminal")
    install_packages("Install LSP packages", "lsp")
    bun.packages(
        name="Install npm-distributed LSP packages",
        packages=BUN_LSP_PACKAGES.get(pkg_manager, []),
        present=True,
        update=upgrade_mode,
    )
    install_packages("Install tools", "tools")

# -----------------------------------------------------------------------------
# GPG agent configuration (must be before git signing)
# -----------------------------------------------------------------------------

if has_tag("git"):
    gpg_agent_script = f"{home}/dot/bin/setup-gpg-agent"
    gpg_agent_current = host.get_fact(
        GpgAgentConfigCurrent, script_path=gpg_agent_script
    )

    if not gpg_agent_current:
        server.shell(
            name="Configure GPG agent based on OS and desktop environment",
            commands=[gpg_agent_script],
        )

# -----------------------------------------------------------------------------
# Git signing configuration
# -----------------------------------------------------------------------------

if has_tag("git"):
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
# Brew taps (macOS only) - after git config is set up
# -----------------------------------------------------------------------------

if has_tag("packages") and pkg_manager == "brew":
    for tap, url in BREW_TAPS.items():
        brew.tap(name=f"Add {tap} tap", src=tap, url=url)

if (
    (has_tag("packages") or has_tag("repos"))
    and pkg_manager in ("apt", "pacman")
    and not is_container()
    and configure_package_repos()
):
    install_packages("Install repository packages", "repository")

# -----------------------------------------------------------------------------
# Environment-specific packages
# -----------------------------------------------------------------------------

if has_tag("packages"):
    if is_container():
        # Add Docker and Kubernetes repos for Debian (apt requires adding repos first)
        if pkg_manager == "apt":
            arch = host.get_fact(Command, command="dpkg --print-architecture").strip()

            add_apt_repo(
                name="Docker",
                key_url="https://download.docker.com/linux/debian/gpg",
                fingerprint="9DC858229FC7DD38854AE2D88D81803C0EBFCD88",
                keyring_name="docker.gpg",
                repo_line=f"deb [arch={arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable",
                filename="docker",
            )

            add_apt_repo(
                name="Kubernetes",
                key_url="https://pkgs.k8s.io/core:/stable:/v1.32/deb/Release.key",
                fingerprint="DE15B14486CD377B9E876E1A234654DA9A296436",
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

        if pkg_manager == "pacman":
            username = host.get_fact(Command, command="whoami").strip()

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

            # Load kernel modules at boot (required for rootless Docker networking)
            files.put(
                name="Configure rootless Docker modules to load at boot",
                src=f"{home}/dot/etc/modules-load.d/docker-rootless.conf",
                dest="/etc/modules-load.d/docker-rootless.conf",
                mode="644",
                user="root",
                group="root",
                _sudo=True,
            )

            server.shell(
                name="Load rootless Docker kernel modules",
                commands=[
                    "if [ -d /lib/modules/$(uname -r) ]; then modprobe tun ip_tables iptable_nat iptable_filter; else echo \"Skipping module load: no modules installed for running kernel $(uname -r)\" >&2; fi"
                ],
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


# GUI apps (macOS only)
if has_tag("packages") and pkg_manager == "brew":
    brew.casks(name="Install GUI applications", casks=CASKS)
    if (
        host.get_fact(Arch) == "arm64"
        and int(host.get_fact(MacosVersion).split(".", 1)[0]) >= 15
        and "browser-use" not in host.get_fact(BrewCasks)
    ):
        brew.casks(name="Install Browser Use", casks=["rfhold/tap/browser-use"])

    alacritty_source = f"{home}/.cache/dot/alacritty"
    files.directory(name="Ensure Alacritty source parent exists", path=f"{home}/.cache/dot")
    git.repo(
        name="Clone Alacritty 0.17.0 source",
        src="https://github.com/alacritty/alacritty.git",
        dest=alacritty_source,
        branch="v0.17.0",
        pull=False,
    )
    server.shell(
        name="Build and install Alacritty for macOS",
        commands=[
            'case "$(/Applications/Alacritty.app/Contents/MacOS/alacritty --version 2>/dev/null)" in '
            '"alacritty 0.17.0"*) ;; *) '
            f'make -C "{alacritty_source}" app && '
            f'ditto "{alacritty_source}/target/release/osx/Alacritty.app" /Applications/Alacritty.app ;; '
            'esac',
        ],
    )
    server.shell(
        name="Install Alacritty terminfo",
        commands=[
            'if ! infocmp alacritty >/dev/null 2>&1; then '
            f'tic -x -e alacritty,alacritty-direct "{alacritty_source}/extra/alacritty.info"; '
            'fi',
        ],
    )

# -----------------------------------------------------------------------------
# Tmux Plugin Manager (TPM)
# -----------------------------------------------------------------------------

if has_tag("tpm"):
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

MANAGED_APPS = []

if has_tag("apps"):
    files.directory(
        name="Ensure Go binary directory exists",
        path=f"{home}/go/bin",
        present=True,
    )
    app_state_dir = f"{home}/.local/state/dot/apps"
    files.directory(
        name="Ensure managed app state directory exists",
        path=app_state_dir,
        present=True,
    )

    for app in MANAGED_APPS:
        app_dest = app["dest"]
        app_parent = "/".join(app_dest.rstrip("/").split("/")[:-1])
        install_marker = f"{app_state_dir}/{app['name']}"

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

        files.file(
            name=f"Mark {app['name']} for reinstall after update",
            path=install_marker,
            present=False,
            _if=clone.did_change,
        )

        server.shell(
            name=f"Install {app['name']}",
            commands=[
                f'test -f "{install_marker}" || '
                f'{{ make -C "{app_dest}" install && touch "{install_marker}"; }}'
            ],
        )

# -----------------------------------------------------------------------------
# Fish plugins
# -----------------------------------------------------------------------------

if has_tag("fish"):
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

if has_tag("node"):
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

if has_tag("bun"):
    bun.project_dependencies(
        name="Install locked dot dependencies",
        path=f"{home}/dot",
    )
    legacy_opencode = "opencode-ai" in (host.get_fact(BunGlobalPackages) or {})
    bun.packages(
        name="Remove legacy OpenCode package",
        packages=["opencode-ai"],
        present=False,
    )
    bun.packages(
        name="Install global Bun packages",
        packages=[
            "@opencode/cli@2.3.2",
        ],
        present=True,
        update=upgrade_mode or legacy_opencode,
        trust=True,
    )

# -----------------------------------------------------------------------------
# Cargo packages (installed via cargo for consistency across all platforms)
# -----------------------------------------------------------------------------

if has_tag("cargo"):
    cargo.packages(
        name="Install cargo packages",
        packages=["starship", "tree-sitter-cli"],
        present=True,
    )

# -----------------------------------------------------------------------------
# Tree-sitter parsers for Neovim 0.12+ (native treesitter support)
# -----------------------------------------------------------------------------

if has_tag("treesitter"):
    TREESITTER_LANGS = {
        "bash": "tree-sitter/tree-sitter-bash",
        "go": "tree-sitter/tree-sitter-go",
        "javascript": "tree-sitter/tree-sitter-javascript",
        "json": "tree-sitter/tree-sitter-json",
        "lua": "tree-sitter-grammars/tree-sitter-lua",
        "markdown": "tree-sitter-grammars/tree-sitter-markdown",
        "python": "tree-sitter/tree-sitter-python",
        "rust": "tree-sitter/tree-sitter-rust",
        "toml": "tree-sitter/tree-sitter-toml",
        "typescript": "tree-sitter/tree-sitter-typescript",
        "yaml": "tree-sitter-grammars/tree-sitter-yaml",
    }
    TREESITTER_BUILD_SUBDIRS = {
        "markdown": "tree-sitter-markdown",
        "typescript": "typescript",
    }

    parser_dir = f"{home}/.local/share/nvim/site/parser"
    files.directory(
        name="Ensure nvim treesitter parser directory exists",
        path=parser_dir,
        present=True,
    )

    for lang, repo in TREESITTER_LANGS.items():
        parser_path = f"{parser_dir}/{lang}.so"
        repo_url = f"https://github.com/{repo}.git"
        clone_dir = f"{home}/.cache/tree-sitter-parsers/{lang}"
        build_subdir = TREESITTER_BUILD_SUBDIRS.get(lang)
        build_dir = f"{clone_dir}/{build_subdir}" if build_subdir else clone_dir

        # Check if parser already exists
        parser_exists = host.get_fact(File, path=parser_path)
        if not parser_exists:
            # Clone the grammar repo
            clone = git.repo(
                name=f"Clone {lang} treesitter grammar",
                src=repo_url,
                dest=clone_dir,
                pull=False,
            )

            # Build the parser
            server.shell(
                name=f"Build {lang} parser",
                commands=[
                    f"cd {build_dir} && tree-sitter build --output {parser_path}",
                ],
                _if=clone.did_change,
            )

# -----------------------------------------------------------------------------

if has_tag("go"):
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

if has_tag("aur") and pkg_manager == "pacman" and not is_container():
    paru.packages(
        name="Install AUR packages",
        packages=[
            "docker-rootless-extras",  # Rootless Docker systemd user units
            "maestro-bin",
        ],
        present=True,
    )

    # Reconcile older direct service startups back to socket activation.
    systemd.service(
        name="Disable direct rootless Docker service",
        service="docker.service",
        running=False,
        enabled=False,
        daemon_reload=True,
        user_mode=True,
    )

    # Enable rootless Docker user service (now that docker-rootless-extras is installed)
    systemd.service(
        name="Enable rootless Docker socket",
        service="docker.socket",
        running=True,
        enabled=True,
        daemon_reload=True,
        user_mode=True,
    )

# -----------------------------------------------------------------------------
# Org-scoped AI tool configuration (.agents and root OpenCode config)
# -----------------------------------------------------------------------------

STATIC_ORG_AGENT_DIRS = ["rfhold", "cfaintl", "stablekernel"]

if has_tag("skills"):
    for org in STATIC_ORG_AGENT_DIRS:
        source_dir = f"{home}/dot/home/repos/{org}"
        org_dir = f"{home}/repos/{org}"
        envrc_path = f"{org_dir}/.envrc"

        files.directory(
            name=f"Ensure repo directory exists for {org}",
            path=org_dir,
            present=True,
        )

        link_config_dir(source_dir, org_dir, exclude=["opencode.jsonc"])
        files.link(
            name=f"Link OpenCode config for {org}",
            path=f"{org_dir}/opencode.jsonc",
            target=f"{source_dir}/opencode.jsonc",
            force=True,
            force_backup=True,
        )

        server.shell(
            name=f"Allow direnv for {org}",
            commands=[f'direnv allow "{envrc_path}"'],
        )


# -----------------------------------------------------------------------------
# OpenSSH Server (containers only - bare metal doesn't need incoming SSH)
# -----------------------------------------------------------------------------

if has_tag("ssh-server"):
    # SSH client is useful everywhere, but SSH server only in containers
    if pkg_manager == "pacman":
        pacman.packages(
            name="Install OpenSSH",
            packages=["openssh"],
            present=True,
            _sudo=True,
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
