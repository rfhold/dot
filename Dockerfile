FROM debian:bookworm-slim

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

# Add Docker's official GPG key and repository
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && chmod a+r /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update

# Create sshd run directory (required for Debian)
RUN mkdir -p /run/sshd

# Configure sshd with secure defaults
COPY etc/sshd_config /etc/ssh/sshd_config

# Create a non-root user
ARG USERNAME=rfhold
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN groupadd -g $USER_GID $USERNAME \
    && useradd -m -u $USER_UID -g $USERNAME -s /bin/bash $USERNAME \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
    && passwd -d $USERNAME

# Switch to non-root user
USER $USERNAME
WORKDIR /home/$USERNAME

# Copy dotfiles
COPY --chown=$USERNAME:$USERNAME . /home/$USERNAME/dot

# Run bootstrap (installs rustup, uv, go, bun and runs pyinfra)
RUN /home/$USERNAME/dot/bin/bootstrap.sh

# Set fish as the user's login shell (for SSH sessions)
RUN sudo chsh -s /usr/bin/fish $USERNAME

# Set fish as default shell for subsequent RUN commands
SHELL ["/usr/bin/fish", "-c"]

# Add go, bun, cargo, and local bin to PATH for all users
ENV PATH="/home/rfhold/.local/bin:/usr/local/go/bin:/home/rfhold/.bun/bin:/home/rfhold/.cargo/bin:/home/rfhold/go/bin:${PATH}"

# SSH access - mount authorized_keys at runtime:
#   -v ~/.ssh/id_ed25519.pub:/home/$USERNAME/.ssh/authorized_keys:ro
# For persistent host identity, mount host keys:
#   -v /path/to/keys:/etc/ssh:ro
EXPOSE 22

# Entrypoint starts sshd, then execs into CMD
# If no CMD provided, container stays alive with SSH access only
# Examples:
#   docker run image                    # SSH access only (sleep infinity)
#   docker run image opencode serve     # Run opencode serve + SSH access
#   docker run image /usr/bin/fish      # Interactive fish + SSH access
ENTRYPOINT ["/home/rfhold/dot/bin/entrypoint.sh"]
CMD []
