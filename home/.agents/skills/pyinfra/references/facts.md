# pyinfra Facts Reference

## Usage

```python
from pyinfra import host
from pyinfra.facts.server import LinuxName, LinuxDistribution, Hostname

value = host.get_fact(FactClass)
value = host.get_fact(FactClass, arg=value)
value = host.get_fact(FactClass, _ignore_errors=True)

# CLI inspection
pyinfra myhost.net fact server.LinuxName
pyinfra myhost.net fact files.File path=/etc/nginx/nginx.conf
```

## `pyinfra.facts.server`

| Fact | Arguments | Returns |
|------|-----------|---------|
| `LinuxName` | — | `"Ubuntu"`, `"Fedora"`, etc. |
| `LinuxDistribution` | — | `{name, major, minor, release_meta}` |
| `OsRelease` | — | dict from `/etc/os-release` |
| `Hostname` | — | `"server1.example.com"` |
| `Arch` | — | `"x86_64"`, `"arm64"` |
| `KernelVersion` | — | `"5.15.0-72-generic"` |
| `Users` | — | dict of username → details |
| `Groups` | — | list of group names |
| `Home` | `user="myuser"` | `/home/myuser` |
| `Which` | `command="nginx"` | path or `None` |
| `Sysctl` | — | dict of sysctl key/values |
| `RebootRequired` | — | bool |
| `Command` | `command="uptime"` | list of output lines |
| `Path` | — | list of PATH entries |
| `Mounts` | — | dict of mount info |

## `pyinfra.facts.files`

| Fact | Arguments | Returns |
|------|-----------|---------|
| `File` | `path="/etc/foo"` | `{user, group, mode, size}` or `None` |
| `Directory` | `path="/etc/nginx"` | `{user, group, mode}` or `None` |
| `Link` | `path="/etc/foo"` | `{user, group, link_target}` or `None` |
| `FileContents` | `path="/etc/foo"` | list of lines or `None` |
| `FindFiles` | `path="/var/log"`, `fname="*.log"` | list of file paths |
| `FindInFile` | `path="/etc/foo"`, `pattern="bar.*"` | list of matching lines |
| `Sha256File` | `path="/etc/foo"` | hash string or `None` |

## `pyinfra.facts.deb` (Debian/Ubuntu)

| Fact | Arguments | Returns |
|------|-----------|---------|
| `DebPackages` | — | dict of package → details |
| `DebPackage` | `name="nginx"` | `{version, ...}` or `None` |

## `pyinfra.facts.rpm` (CentOS/RHEL)

| Fact | Arguments | Returns |
|------|-----------|---------|
| `RpmPackages` | — | dict of package → details |
| `RpmPackage` | `name="nginx"` | details or `None` |

## `pyinfra.facts.systemd`

| Fact | Arguments | Returns |
|------|-----------|---------|
| `SystemdStatus` | — | dict of unit → status |
| `SystemdEnabled` | — | dict of unit → enabled bool |

## `pyinfra.facts.git`

| Fact | Arguments | Returns |
|------|-----------|---------|
| `GitBranch` | `repo="/opt/app"` | branch name |
| `GitCommit` | `repo="/opt/app"` | commit hash |
| `GitRemote` | `repo="/opt/app"`, `remote="origin"` | remote URL |

## Immutability Rule

Only use facts in deploy-time conditionals if the fact **cannot change** as a result of running operations in the same deploy:

- **Safe**: `LinuxName`, `LinuxDistribution`, `Arch`, `Hostname`, `KernelVersion`
- **Unsafe** (use operations' built-in idempotency instead): `File`, `Directory`, `DebPackages`, `SystemdStatus`

When in doubt, declare the desired state unconditionally — operations diff the fact internally at execution time.
