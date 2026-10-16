import re
from shlex import quote

from pyinfra.api import FactBase


class BunGlobalPackages(FactBase):
    """
    Returns globally installed Bun package names mapped to their versions.

    Example:
        packages = host.get_fact(BunGlobalPackages)
        # Returns: {'@opencode/cli': '2.0.31', 'typescript': '5.9.3'}
    """

    # A fresh global store exits 1; suppress only a verified missing manifest.
    command = "bun -e " + quote(r'''
const { statSync } = require("node:fs");
const result = Bun.spawnSync([process.execPath, "pm", "ls", "-g"]);
const error = result.stderr.toString();
const missing = error.match(/^error: No package.json was found for directory "([^"\n]+)"\n/);
if (result.exitCode === 1 && missing) {
    try {
        statSync(`${missing[1]}/package.json`);
    } catch (error) {
        if (error.code === "ENOENT") process.exit(0);
    }
}
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.exitCode);
''')

    def process(self, output):
        packages = {}
        for line in output or []:
            match = re.match(r"^[\u251c\u2514]\u2500\u2500\s+(.+)@([^@\s]+)$", line)
            if match:
                packages[match[1].lower()] = match[2]
        return packages


class BunProjectDependencies(FactBase):
    """Whether required root packages match the last successful frozen install."""

    def command(self, path):
        return f"bun {quote(path + '/pyinfra_bun/project-install.js')} check {quote(path)}"

    def process(self, output):
        return output == ["ready"]
