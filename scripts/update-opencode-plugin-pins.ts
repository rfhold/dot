import { execFileSync, spawnSync } from "node:child_process";
import { lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import type { Stats } from "node:fs";
import { join, relative } from "node:path";

export type TagLookup = (repoUrl: string) => Promise<string[]> | string[];

export type PinUpdate = {
  filePath: string;
  plugin: string;
  repoUrl: string;
  from: string;
  to: string;
};

export type UpdateOptions = {
  root: string;
  dryRun?: boolean;
  commit?: boolean;
  push?: boolean;
  tagLookup?: TagLookup;
};

const rfholdPinnedPluginPattern = /([A-Za-z0-9._-]+)@(git\+ssh:\/\/git@git\.holdenitdown\.net\/rfhold\/[A-Za-z0-9._-]+\.git)#(opencode\/v\d+\.\d+\.\d+)/g;
const excludedDirectories = new Set([
  ".bun",
  ".git",
  ".jj",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
]);

export function discoverOpenCodeConfigFiles(root: string): string[] {
  const results: string[] = [];

  function visit(directory: string): void {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      const rel = relative(root, path);
      const stat = safeLstat(path);
      if (!stat) {
        continue;
      }

      if (stat.isDirectory()) {
        if (shouldSkipDirectory(entry, rel)) {
          continue;
        }
        visit(path);
        continue;
      }

      if (stat.isFile() && entry === "opencode.jsonc") {
        results.push(path);
      }
    }
  }

  visit(root);
  return results.sort();
}

export function latestOpenCodeTag(tags: string[]): string | undefined {
  const versions = new Map<string, [number, number, number]>();

  for (const tag of tags) {
    const match = tag.match(/(?:^|\/)opencode\/v(\d+)\.(\d+)\.(\d+)(?:\^\{\})?$/);
    if (!match) {
      continue;
    }

    const version: [number, number, number] = [Number(match[1]), Number(match[2]), Number(match[3])];
    versions.set(`opencode/v${version[0]}.${version[1]}.${version[2]}`, version);
  }

  return [...versions.entries()]
    .sort(([, left], [, right]) => compareSemver(right, left))[0]?.[0];
}

export async function updateOpenCodePluginPins(options: UpdateOptions): Promise<PinUpdate[]> {
  const tagLookup = options.tagLookup ?? lookupRemoteTags;
  const updates: PinUpdate[] = [];
  const latestByRepo = new Map<string, string | undefined>();

  for (const filePath of discoverOpenCodeConfigFiles(options.root)) {
    const original = readFileSync(filePath, "utf8");
    let changed = false;
    const next = await replaceAsync(original, rfholdPinnedPluginPattern, async (full, plugin, repoUrl, currentTag) => {
      let latest = latestByRepo.get(repoUrl);
      if (!latestByRepo.has(repoUrl)) {
        latest = latestOpenCodeTag(await tagLookup(repoUrl));
        latestByRepo.set(repoUrl, latest);
      }

      if (!latest || latest === currentTag) {
        return full;
      }

      changed = true;
      updates.push({ filePath, plugin, repoUrl, from: currentTag, to: latest });
      return `${plugin}@${repoUrl}#${latest}`;
    });

    if (changed && !options.dryRun) {
      writeFileSync(filePath, next);
    }
  }

  if (updates.length > 0 && !options.dryRun && options.commit) {
    commitUpdates(options.root, updates, options.push ?? true);
  }

  return updates;
}

function shouldSkipDirectory(name: string, relativePath: string): boolean {
  if (excludedDirectories.has(name)) {
    return true;
  }

  return (
    relativePath === "docs/specs/archive" ||
    relativePath.startsWith("docs/specs/archive/") ||
    relativePath === "docs/specs/changes/archive" ||
    relativePath.startsWith("docs/specs/changes/archive/")
  );
}

function safeLstat(path: string): Stats | undefined {
  try {
    return lstatSync(path);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return undefined;
    }
    throw error;
  }
}

function compareSemver(left: [number, number, number], right: [number, number, number]): number {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

async function replaceAsync(
  input: string,
  pattern: RegExp,
  replacer: (match: string, ...groups: string[]) => Promise<string>,
): Promise<string> {
  const replacements = await Promise.all([...input.matchAll(pattern)].map((match) => replacer(match[0], ...match.slice(1))));
  let index = 0;
  return input.replace(pattern, () => replacements[index++] ?? "");
}

function lookupRemoteTags(repoUrl: string): string[] {
  const output = execFileSync("git", ["ls-remote", "--tags", repoUrl], { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim().split(/\s+/)[1])
    .filter((tag): tag is string => Boolean(tag));
}

function commitUpdates(root: string, updates: PinUpdate[], push: boolean): void {
  const files = [...new Set(updates.map((update) => relative(root, update.filePath)))];
  execFileSync("git", ["add", ...files], { cwd: root, stdio: "inherit" });

  const diff = spawnSync("git", ["diff", "--cached", "--quiet"], { cwd: root });
  if (diff.status === 0) {
    return;
  }
  if (diff.status !== 1) {
    throw new Error("Failed to inspect staged OpenCode plugin pin updates");
  }

  execFileSync("git", ["commit", "-m", "Update OpenCode plugin pins"], { cwd: root, stdio: "inherit" });

  if (push) {
    execFileSync("git", ["push", "origin", "HEAD:main"], { cwd: root, stdio: "inherit" });
  }
}

function parseArgs(args: string[]): { dryRun: boolean; commit: boolean; push: boolean } {
  let dryRun = false;
  let noPush = false;
  let noCommit = false;

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--no-push") {
      noPush = true;
    } else if (arg === "--no-commit") {
      noCommit = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { dryRun, commit: !dryRun && !noCommit, push: !dryRun && !noPush };
}

async function main(): Promise<void> {
  const root = new URL("..", import.meta.url).pathname;
  const options = parseArgs(Bun.argv.slice(2));
  const updates = await updateOpenCodePluginPins({ root, ...options });

  if (updates.length === 0) {
    console.log("OpenCode plugin pins are already current.");
    return;
  }

  for (const update of updates) {
    console.log(`${relative(root, update.filePath)}: ${update.plugin} ${update.from} -> ${update.to}`);
  }

  if (options.dryRun) {
    console.log("Dry run: no files changed.");
  } else if (!options.commit) {
    console.log("Updated files without committing.");
  } else if (!options.push) {
    console.log("Committed updates without pushing.");
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
