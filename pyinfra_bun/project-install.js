import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [action, directory] = process.argv.slice(2);
if (!["check", "install"].includes(action) || !directory) {
  throw new Error("Usage: bun project-install.js <check|install> <directory>");
}
const root = resolve(directory);
const manifest = readFileSync(join(root, "package.json"));
const lock = readFileSync(join(root, "bun.lock"));
const hash = createHash("sha256").update(manifest).update(lock).digest("hex");
const pkg = JSON.parse(manifest);
const optional = pkg.optionalDependencies ?? {};
// Missing optional packages must not cause repeated installs without private access.
const required = Object.keys({
  ...pkg.dependencies,
  ...pkg.devDependencies,
  ...pkg.peerDependencies,
}).filter((name) => !(name in optional) && !pkg.peerDependenciesMeta?.[name]?.optional);
const stamp = join(root, "node_modules", ".dot-bun-install.json");

function state() {
  const packages = {};
  for (const name of required) {
    const file = join(root, "node_modules", name, "package.json");
    if (!existsSync(file)) return null;
    packages[name] = createHash("sha256").update(readFileSync(file)).digest("hex");
  }
  return JSON.stringify({ hash, packages });
}

if (action === "check") {
  const current = state();
  console.log(current && existsSync(stamp) && readFileSync(stamp, "utf8") === current ? "ready" : "install");
} else {
  const result = Bun.spawnSync([
    process.execPath, "install", "--frozen-lockfile", "--ignore-scripts",
  ], { cwd: root, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  if (result.exitCode !== 0) process.exit(result.exitCode);
  const current = state();
  if (!current) throw new Error("Bun install did not provide all required root dependencies");
  writeFileSync(stamp, current);
}
