# =============================================================================
# Multi-stage Dockerfile for dotfiles container
# 
# Targets:
#   debian           - Prebaked Debian image (default, recommended)
#   debian-bootstrap - Debian image that runs bootstrap on first start
#   arch             - Prebaked Arch Linux image
#   arch-bootstrap   - Arch Linux image that runs bootstrap on first start
#
# Usage:
#   docker build --target debian -t myimage .
#   docker build --target arch-bootstrap -t myimage .
# =============================================================================

# =============================================================================
# DEBIAN BASE STAGE
# =============================================================================
FROM debian:bookworm-slim AS debian-base

# Install base dependencies required for bootstrap
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    wget \
    git \
    build-essential \
    sudo \
    ca-certificates \
    python3 \
    python3-pip \
    python3-venv \
    openssh-server \
    openssh-client \
    unzip \
    gnupg \
    pkg-config \
    libgtk-3-dev \
    libglib2.0-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Create sshd run directory (required for Debian)
RUN mkdir -p /run/sshd

# =============================================================================
# ARCH BASE STAGE
# =============================================================================
FROM archlinux:latest AS arch-base

# Install base dependencies
RUN pacman -Syu --noconfirm \
    base-devel \
    git \
    curl \
    wget \
    sudo \
    ca-certificates \
    python \
    python-pip \
    openssh \
    unzip \
    gnupg \
    pkgconf \
    gtk3 \
    glib2 \
    webkit2gtk-4.1 \
    libayatana-appindicator \
    librsvg \
    fish \
    && pacman -Scc --noconfirm

# Create sshd run directory
RUN mkdir -p /run/sshd

# =============================================================================
# USER SETUP (shared pattern)
# =============================================================================
FROM debian-base AS debian-user
ARG USERNAME=rfhold
ARG USER_UID=1000
ARG USER_GID=1000

RUN groupadd -g $USER_GID $USERNAME \
    && useradd -m -u $USER_UID -g $USERNAME -s /bin/bash $USERNAME \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && passwd -d $USERNAME

COPY etc/sshd_config /etc/ssh/sshd_config

FROM arch-base AS arch-user
ARG USERNAME=rfhold
ARG USER_UID=1000
ARG USER_GID=1000

RUN groupadd -g $USER_GID $USERNAME \
    && useradd -m -u $USER_UID -g $USERNAME -s /bin/bash $USERNAME \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && passwd -d $USERNAME

COPY etc/sshd_config /etc/ssh/sshd_config

# =============================================================================
# DEBIAN COMMON - Copy dotfiles and configure environment
# =============================================================================
FROM debian-user AS debian-common
ARG USERNAME=rfhold

USER $USERNAME
WORKDIR /home/$USERNAME

# Copy bootstrap script first for better layer caching
COPY --chown=$USERNAME:$USERNAME bin/bootstrap.sh /home/$USERNAME/dot/bin/bootstrap.sh

# Copy the rest of dotfiles (changes more frequently)
COPY --chown=$USERNAME:$USERNAME . /home/$USERNAME/dot

# Environment setup
ENV PATH="/home/rfhold/dot/bin/container:/home/rfhold/.local/bin:/usr/local/go/bin:/home/rfhold/.bun/bin:/home/rfhold/.cargo/bin:/home/rfhold/go/bin:${PATH}"
ENV SHELL=/usr/bin/fish

EXPOSE 22

# =============================================================================
# ARCH COMMON - Copy dotfiles and configure environment
# =============================================================================
FROM arch-user AS arch-common
ARG USERNAME=rfhold

USER $USERNAME
WORKDIR /home/$USERNAME

# Copy bootstrap script first for better layer caching
COPY --chown=$USERNAME:$USERNAME bin/bootstrap.sh /home/$USERNAME/dot/bin/bootstrap.sh

# Copy the rest of dotfiles (changes more frequently)
COPY --chown=$USERNAME:$USERNAME . /home/$USERNAME/dot

# Environment setup
ENV PATH="/home/rfhold/dot/bin/container:/home/rfhold/.local/bin:/usr/local/go/bin:/home/rfhold/.bun/bin:/home/rfhold/.cargo/bin:/home/rfhold/go/bin:${PATH}"
ENV SHELL=/usr/bin/fish

EXPOSE 22

# =============================================================================
# DEBIAN PREBAKED - Bootstrap at build time (recommended)
# =============================================================================
FROM debian-common AS debian
ARG USERNAME=rfhold

# Run bootstrap (installs rustup, uv, go, bun and runs pyinfra)
RUN /home/$USERNAME/dot/bin/bootstrap.sh

# Set fish as the user's login shell
RUN sudo chsh -s /usr/bin/fish $USERNAME

# Aggressive cleanup of build caches to reduce image size
RUN rm -rf ~/.cargo/registry ~/.cargo/git \
    && rm -rf ~/.cache/uv \
    && rm -rf ~/.cache/go-build \
    && rm -rf ~/.bun/install/cache \
    && sudo apt-get clean \
    && sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ENTRYPOINT ["/home/rfhold/dot/bin/entrypoint.sh"]
CMD []

# =============================================================================
# ARCH PREBAKED - Bootstrap at build time
# =============================================================================
FROM arch-common AS arch
ARG USERNAME=rfhold

# Run bootstrap (installs rustup, uv, go, bun and runs pyinfra)
RUN /home/$USERNAME/dot/bin/bootstrap.sh

# Set fish as the user's login shell
RUN sudo chsh -s /usr/bin/fish $USERNAME

# Aggressive cleanup of build caches to reduce image size
RUN rm -rf ~/.cargo/registry ~/.cargo/git \
    && rm -rf ~/.cache/uv \
    && rm -rf ~/.cache/go-build \
    && rm -rf ~/.bun/install/cache \
    && sudo pacman -Scc --noconfirm \
    && sudo rm -rf /tmp/* /var/tmp/*

ENTRYPOINT ["/home/rfhold/dot/bin/entrypoint.sh"]
CMD []

# =============================================================================
# DEBIAN BOOTSTRAP - Bootstrap at runtime (smaller image, slower first start)
# =============================================================================
FROM debian-common AS debian-bootstrap
ARG USERNAME=rfhold

# Set fish as the user's login shell (fish installed via apt in base)
RUN sudo chsh -s /usr/bin/fish $USERNAME

# Clean apt cache
RUN sudo apt-get clean && sudo rm -rf /var/lib/apt/lists/*

# Bootstrap will run on first container start via entrypoint
ENTRYPOINT ["/home/rfhold/dot/bin/entrypoint.sh"]
CMD []

# =============================================================================
# ARCH BOOTSTRAP - Bootstrap at runtime (smaller image, slower first start)
# =============================================================================
FROM arch-common AS arch-bootstrap
ARG USERNAME=rfhold

# Set fish as the user's login shell (fish installed via pacman in base)
RUN sudo chsh -s /usr/bin/fish $USERNAME

# Clean pacman cache
RUN sudo pacman -Scc --noconfirm

# Bootstrap will run on first container start via entrypoint
ENTRYPOINT ["/home/rfhold/dot/bin/entrypoint.sh"]
CMD []
