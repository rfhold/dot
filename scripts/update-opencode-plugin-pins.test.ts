import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { discoverOpenCodeConfigFiles, latestOpenCodeTag, updateOpenCodePluginPins } from "./update-opencode-plugin-pins";

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("latestOpenCodeTag", () => {
  test("selects the newest opencode semver tag", () => {
    expect(
      latestOpenCodeTag([
        "refs/tags/opencode/v0.9.0",
        "refs/tags/opencode/v1.2.2",
        "refs/tags/opencode/v1.10.0",
        "refs/tags/opencode/v1.10.0^{}",
        "refs/tags/other/v9.9.9",
      ]),
    ).toBe("opencode/v1.10.0");
  });
});

describe("updateOpenCodePluginPins", () => {
  test("leaves current pins unchanged", async () => {
    const root = makeRoot();
    const file = writeConfig(root, "opencode.jsonc", [
      '"superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v1.2.3"',
    ]);

    const updates = await updateOpenCodePluginPins({
      root,
      tagLookup: () => ["refs/tags/opencode/v1.2.3"],
    });

    expect(updates).toEqual([]);
    expect(readFileSync(file, "utf8")).toContain("#opencode/v1.2.3");
  });

  test("preserves cfaintl branch references", async () => {
    const root = makeRoot();
    const file = writeConfig(root, "home/repos/cfaintl/.agents/opencode.jsonc", [
      '["cfaintl-skills@git+ssh://git@github.com/cfaintl/skills.git#main", { "include": ["brainstorming"] }]',
    ]);

    const updates = await updateOpenCodePluginPins({
      root,
      tagLookup: () => {
        throw new Error("cfaintl should not query tags");
      },
    });

    expect(updates).toEqual([]);
    expect(readFileSync(file, "utf8")).toContain("git+ssh://git@github.com/cfaintl/skills.git#main");
  });

  test("updates rfhold pins across global, project, and org config layers", async () => {
    const root = makeRoot();
    const global = writeConfig(root, ".config/opencode/opencode.jsonc", [
      '"rfhold-skills@git+ssh://git@git.holdenitdown.net/rfhold/skills.git#opencode/v0.1.0"',
    ]);
    const project = writeConfig(root, "opencode.jsonc", [
      '"superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v0.1.0"',
    ]);
    const org = writeConfig(root, "home/repos/rfhold/.agents/opencode.jsonc", [
      '"gitops-query@git+ssh://git@git.holdenitdown.net/rfhold/gitops-query.git#opencode/v0.1.0"',
      '"slack-query@git+ssh://git@git.holdenitdown.net/rfhold/slack-query.git#opencode/v0.1.0"',
    ]);
    const archived = writeConfig(root, "docs/specs/changes/archive/old/opencode.jsonc", [
      '"archived@git+ssh://git@git.holdenitdown.net/rfhold/archived.git#opencode/v0.1.0"',
    ]);
    writeConfig(root, "node_modules/pkg/opencode.jsonc", [
      '"dependency@git+ssh://git@git.holdenitdown.net/rfhold/dependency.git#opencode/v0.1.0"',
    ]);

    const updates = await updateOpenCodePluginPins({
      root,
      tagLookup: () => ["refs/tags/opencode/v0.1.0", "refs/tags/opencode/v0.2.0"],
    });

    expect(updates.map((update) => update.plugin).sort()).toEqual([
      "gitops-query",
      "rfhold-skills",
      "slack-query",
      "superspec",
    ]);
    expect(readFileSync(global, "utf8")).toContain("#opencode/v0.2.0");
    expect(readFileSync(project, "utf8")).toContain("#opencode/v0.2.0");
    expect(readFileSync(org, "utf8")).toContain("#opencode/v0.2.0");
    expect(readFileSync(archived, "utf8")).toContain("#opencode/v0.1.0");
    expect(discoverOpenCodeConfigFiles(root).map((file) => file.replace(`${root}/`, ""))).toEqual([
      ".config/opencode/opencode.jsonc",
      "home/repos/rfhold/.agents/opencode.jsonc",
      "opencode.jsonc",
    ]);
  });

  test("dry-run reports updates without changing files", async () => {
    const root = makeRoot();
    const file = writeConfig(root, "opencode.jsonc", [
      '"superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v0.1.0"',
    ]);

    const updates = await updateOpenCodePluginPins({
      root,
      dryRun: true,
      tagLookup: () => ["refs/tags/opencode/v0.2.0"],
    });

    expect(updates).toHaveLength(1);
    expect(readFileSync(file, "utf8")).toContain("#opencode/v0.1.0");
  });

  test("ignores dangling symlinks in unrelated directories", async () => {
    const root = makeRoot();
    const file = writeConfig(root, "opencode.jsonc", [
      '"superspec@git+ssh://git@git.holdenitdown.net/rfhold/superspec.git#opencode/v0.1.0"',
    ]);
    const unrelated = join(root, ".config/systemd/user/default.target.wants");
    mkdirSync(unrelated, { recursive: true });
    symlinkSync(join(root, "missing.service"), join(unrelated, "tmux-agent.service"));

    const updates = await updateOpenCodePluginPins({
      root,
      tagLookup: () => ["refs/tags/opencode/v0.2.0"],
    });

    expect(updates).toHaveLength(1);
    expect(readFileSync(file, "utf8")).toContain("#opencode/v0.2.0");
  });
});

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "opencode-pin-test-"));
  tempRoots.push(root);
  return root;
}

function writeConfig(root: string, relativePath: string, plugins: string[]): string {
  const file = join(root, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `{"plugin":[${plugins.join(",")}]}`);
  return file;
}
