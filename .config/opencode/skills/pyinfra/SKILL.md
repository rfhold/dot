---
name: pyinfra
description: Writing idempotent pyinfra v3 deploy scripts, inventories, facts, and reusable @deploy packages. Use when user mentions "pyinfra", asks to "write a deploy", "create an inventory", "automate server setup", or needs help with operations like apt, files, systemd, git, pip, server tasks, or debugging pyinfra deploys. Do NOT use for Ansible, Terraform, or other IaC tools.
---

# pyinfra

Expert at writing idempotent, well-structured pyinfra v3 deploys.

## CRITICAL: The Two-Phase Model

pyinfra runs in two phases — **plan** then **execute**:

1. All deploy code runs top-to-bottom on every host to *build a plan* (no changes yet)
2. Each operation executes on all hosts in parallel before moving to the next

**This means operation results are not available at plan time:**

```python
# WRONG: op.changed is always False at plan time
result = files.put(src="nginx.conf", dest="/etc/nginx/nginx.conf")
if result.changed:           # always False!
    systemd.service(service="nginx", reloaded=True)

# CORRECT: _if defers the check to execution time
result = files.put(src="nginx.conf", dest="/etc/nginx/nginx.conf")
systemd.service(service="nginx", reloaded=True, _if=result.did_change)
```

## Project Layout

```
myproject/
├── inventory.py           # hosts and groups
├── deploy.py              # main entrypoint
├── group_data/
│   ├── all.py             # defaults for all hosts
│   ├── app_servers.py     # group-specific config
│   └── db_servers.py
├── tasks/
│   ├── setup_base.py      # included task files
│   └── setup_app.py
├── files/                 # static files to upload
└── templates/             # Jinja2 templates (.j2)
```

## Inventory & Data

```python
# inventory.py
app_servers = [
    ("web-1.net", {"ssh_user": "ubuntu"}),
    ("web-2.net", {"ssh_user": "ubuntu"}),
]

# Group with shared data (tuple: list + dict)
db_servers = (
    ["db-1.net", "db-2.net"],
    {"_sudo": True, "ssh_user": "ec2-user"},
)
```

```python
# group_data/all.py
_sudo = True
app_user = "myapp"
app_dir = "/opt/myapp"
```

**Data hierarchy** (highest wins): CLI `--data` > host data > group data > `all.py`

Access data in deploys via `host.data.app_user` or `host.data.get("key", default)`.

## Facts

Facts inspect current host state. They are read at **plan time** — only use immutable facts (OS type, arch) in deploy-time conditionals.

```python
from pyinfra import host
from pyinfra.facts.server import LinuxName, LinuxDistribution, Which
from pyinfra.facts.files import File, Directory, FileContents

distro = host.get_fact(LinuxName)   # "Ubuntu", "Fedora", etc.
file_info = host.get_fact(File, path="/etc/nginx/nginx.conf")  # dict or None

# Branch on OS (safe — immutable fact)
if distro == "Ubuntu":
    apt.packages(packages=["nginx"], update=True)
elif distro in ("CentOS", "AlmaLinux"):
    yum.packages(packages=["nginx"])

# WRONG: file existence may change during deploy — let the operation handle it
if host.get_fact(File, path="/etc/nginx/sites-enabled/default"):
    files.file(path="/etc/nginx/sites-enabled/default", present=False)

# CORRECT: declare desired state; pyinfra diffs internally
files.file(path="/etc/nginx/sites-enabled/default", present=False)
```

Common facts: see `references/facts.md`.

## Common Operations

### apt (Debian/Ubuntu)

```python
from pyinfra.operations import apt

apt.packages(packages=["nginx", "curl"], update=True, cache_time=3600, _sudo=True)
apt.packages(packages=["apache2"], present=False, _sudo=True)   # remove
apt.packages(packages=["nginx=1.18.0"], _sudo=True)             # pin version
apt.packages(packages=["vim"], latest=True, _sudo=True)         # always upgrade
apt.upgrade(auto_remove=True, _sudo=True)
apt.repo(
    src="deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable",
    filename="docker", _sudo=True,
)
```

### yum (CentOS/RHEL/AlmaLinux)

```python
from pyinfra.operations import yum

yum.packages(packages=["nginx"], update=True, _sudo=True)
yum.repo(src="https://download.docker.com/linux/centos/docker-ce.repo", _sudo=True)
```

### Cross-distro

```python
from pyinfra.operations import server
server.packages(packages=["vim"], _sudo=True)  # auto-detects package manager
```

### files

```python
from pyinfra.operations import files

files.file(path="/var/log/myapp.log", present=True, user="myapp", mode="640", create_remote_dir=True)
files.file(path="/etc/old.conf", present=False)
files.directory(path="/opt/myapp", user="myapp", mode="750", recursive=True)
files.put(src="files/nginx.conf", dest="/etc/nginx/nginx.conf", mode="644", _sudo=True)
files.template(src="templates/app.conf.j2", dest="/etc/myapp/app.conf", user="myapp")
files.link(path="/etc/nginx/sites-enabled/myapp", target="/etc/nginx/sites-available/myapp")
files.line(path="/etc/sysctl.conf", line="net.ipv4.ip_forward", replace="net.ipv4.ip_forward = 1")
files.block(path="/etc/hosts", content="10.0.0.1 db-1", marker="# {mark} MYAPP HOSTS")
files.sync(src="files/static/", dest="/var/www/static/", delete=True, exclude=["*.pyc"])
files.download(src="https://example.com/app.tar.gz", dest="/tmp/app.tar.gz", sha256sum="abc123")
```

### server

```python
from pyinfra.operations import server

server.user(user="myapp", home="/opt/myapp", shell="/bin/bash", system=True, create_home=True,
            groups=["docker"], append=True)
server.group(group="docker", system=True)
server.shell(commands=["./init.sh"], _sudo=True, _chdir="/opt/myapp")
server.sysctl(key="net.ipv4.ip_forward", value=1, persist=True)
server.hostname(hostname="app-01.example.com")
server.reboot(delay=30, reboot_timeout=300)
```

### systemd

```python
from pyinfra.operations import systemd

systemd.service(service="nginx", running=True, enabled=True, daemon_reload=True)
systemd.service(service="nginx", restarted=True)
systemd.service(service="nginx", reloaded=True, _if=config_file.did_change)
systemd.daemon_reload()
```

### git

```python
from pyinfra.operations import git

git.repo(src="https://github.com/org/app.git", dest="/opt/app", branch="main",
         user="myapp", update_submodules=True)
```

### pip

```python
from pyinfra.operations import pip

pip.venv(path="/opt/app/venv", python="python3.11")
pip.packages(requirements="/opt/app/requirements.txt", virtualenv="/opt/app/venv")
pip.packages(packages=["gunicorn==21.2.0"], virtualenv="/opt/app/venv")
```

## Idempotency Patterns

### Pattern 1: Declare desired state (most operations handle it internally)

```python
apt.packages(packages=["nginx"], present=True)   # idempotent by default
```

### Pattern 2: Conditional with `_if`

```python
config = files.put(src="nginx.conf", dest="/etc/nginx/nginx.conf")
systemd.service(service="nginx", reloaded=True, _if=config.did_change)

# Multiple conditions
from pyinfra.operations.util import any_changed, all_changed
server.shell(commands=["./setup.sh"], _if=any_changed(op1, op2))
```

**Operation result methods**: `did_change`, `did_not_change`, `did_succeed`, `did_error` — all callables evaluated at execution time.

### Pattern 3: Runtime logic with `python.call`

```python
from pyinfra.operations import python

result = server.shell(commands=["cat /etc/machine-id"])

def use_output():
    print(result.stdout)   # only available at execution time

python.call(function=use_output)
```

## Global Arguments

All operations accept `_`-prefixed kwargs:

```python
server.shell(
    commands=["..."],
    _sudo=True, _sudo_user="postgres",
    _env={"MY_VAR": "value"},
    _chdir="/opt/myapp",
    _timeout=30,
    _ignore_errors=True,
    _if=some_op.did_change,
    _run_once=True,          # only run on first host
    _serial=True,            # host-by-host (not parallel)
    _retries=3, _retry_delay=10,
)
```

Set defaults globally:

```python
from pyinfra import config
config.SUDO = True
config.REQUIRE_PYINFRA_VERSION = "~=3.0"
```

## @deploy — Reusable Packages

```python
# deploys/nginx.py
from pyinfra.api import deploy
from pyinfra import host
from pyinfra.operations import apt, files, systemd

DEFAULTS = {"nginx_worker_processes": "auto"}

@deploy("Install and configure Nginx", data_defaults=DEFAULTS)
def install_nginx():
    apt.packages(packages=["nginx"], update=True, _sudo=True)
    files.template(
        src="templates/nginx.conf.j2", dest="/etc/nginx/nginx.conf",
        worker_processes=host.data.nginx_worker_processes,
    )
    systemd.service(service="nginx", running=True, enabled=True)
```

```python
# deploy.py
from deploys.nginx import install_nginx
install_nginx()                    # all global args work on @deploy too
install_nginx(_sudo=True)
```

## Splitting Deploys with `local.include`

```python
# deploy.py
from pyinfra import host, local

local.include("tasks/setup_base.py")

if "db_servers" in host.groups:
    local.include("tasks/setup_db.py")

if "web_servers" in host.groups:
    local.include("tasks/setup_web.py")

# Pass data to included files
for env in ["staging", "production"]:
    local.include("tasks/setup_env.py", data={"env": env})
```

## CLI Quick Reference

```bash
# Run a deploy
uvx pyinfra inventory.py deploy.py

# Ad-hoc operations
uvx pyinfra my-server.net exec -- uptime
uvx pyinfra inventory.py apt.packages vim update=true _sudo=true
uvx pyinfra inventory.py systemd.service nginx running=true enabled=true _sudo=true

# Facts
uvx pyinfra my-server.net fact server.LinuxName
uvx pyinfra my-server.net fact files.File path=/etc/nginx/nginx.conf

# Debug
uvx pyinfra inventory.py debug-inventory
uvx pyinfra inventory.py deploy.py --debug-facts
uvx pyinfra inventory.py deploy.py --debug-operations

# Limit scope
uvx pyinfra inventory.py deploy.py --limit app_servers
uvx pyinfra inventory.py deploy.py --limit "web-*"

# Verbosity
uvx pyinfra inventory.py deploy.py -vvv

# Docker for fast iteration
uvx pyinfra @docker/ubuntu:22.04 deploy.py
```

## Best Practices Checklist

- Always add `name=` to every operation for readable output
- Use `cache_time=3600` with `apt.update=True` to avoid redundant refreshes
- Use `@deploy` from the start if the deploy will be reused
- Use `group_data/` for environment-specific config — never hardcode values
- Use `_if=op.did_change` (not `if op.changed:`) for conditional operations
- Only branch on immutable facts (OS type, arch) at deploy-time
- Use `uvx pyinfra @docker/ubuntu:22.04` during development for fast iteration
- Use `--debug-operations` to inspect the operation plan before running

## References

- `references/facts.md` — complete facts reference
- Official docs: https://docs.pyinfra.com/en/3.x/
