import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

const pluginOwnedMcpServers = [
  "gitops",
  "slack",
  "grafana",
  "atlassian",
  "gsuite",
  "axol",
];

const rfholdPluginRepos = new Map([
  ["rfhold-skills", "skills"],
  ["gitops-query", "gitops-query"],
  ["slack-query", "slack-query"],
  ["grafana-query", "grafana-query"],
  ["atlassian-query", "atlassian-query"],
  ["gsuite-query", "gsuite-query"],
  ["axol-query", "axol"],
  ["cuthulu", "cuthulu"],
  ["homelab", "homelab"],
  ["walter", "walter"],
]);

const rfholdPluginOrder = [...rfholdPluginRepos.keys()];

const rfholdClaudePreviewUrls = new Map([
  ["gitops", "https://preview-gitops-query.holdenitdown.net"],
  ["slack", "https://preview-slack-query.holdenitdown.net"],
  ["grafana", "https://preview-grafana-query.holdenitdown.net"],
]);

const cfaintlExcludes = [
  "environment-discovery",
  "expense-report",
  "grill-me",
  "project-management",
  "simphony",
];

function fail(message: string): never {
  throw new Error(message);
}

function readJsonc(relativePath: string): unknown {
  const filePath = join(root, relativePath);
  const raw = readFileSync(filePath, "utf8");

  try {
    return JSON.parse(stripJsonc(raw));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`${relativePath}: invalid JSON/JSONC: ${message}`);
  }
}

function stripJsonc(input: string): string {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      while (i < input.length && input[i] !== "\n") {
        i++;
      }
      output += "\n";
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) {
        output += input[i] === "\n" ? "\n" : " ";
        i++;
      }
      i++;
      continue;
    }

    output += char;
  }

  return output.replace(/,\s*([}\]])/g, "$1");
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label}: expected object`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    fail(`${label}: expected array`);
  }
  return value;
}

function pluginName(entry: unknown, label: string): string {
  const pluginRef = Array.isArray(entry) ? entry[0] : entry;
  if (typeof pluginRef !== "string") {
    fail(`${label}: plugin entry must start with a string reference`);
  }
  return pluginRef.split("@")[0] ?? pluginRef;
}

function pluginRef(entry: unknown, label: string): string {
  const pluginReference = Array.isArray(entry) ? entry[0] : entry;
  if (typeof pluginReference !== "string") {
    fail(`${label}: plugin entry must start with a string reference`);
  }
  return pluginReference;
}

function assertNoPluginOwnedInlineMcp(config: Record<string, unknown>, label: string): void {
  if (config.mcp === undefined) {
    return;
  }

  const mcp = asRecord(config.mcp, `${label}.mcp`);
  for (const server of pluginOwnedMcpServers) {
    if (server in mcp) {
      fail(`${label}: top-level mcp must not include plugin-owned server '${server}'`);
    }
  }
}

function assertNoPlugin(config: Record<string, unknown>, plugin: string, label: string): void {
  const plugins = config.plugin === undefined ? [] : asArray(config.plugin, `${label}.plugin`);
  if (plugins.some((entry, index) => pluginName(entry, `${label}.plugin[${index}]`) === plugin)) {
    fail(`${label}: ${plugin} must not be present`);
  }
}

function assertRfholdOpenCode(): void {
  const config = asRecord(readJsonc("home/repos/rfhold/.agents/opencode.jsonc"), "rfhold opencode");
  const plugins = asArray(config.plugin, "rfhold opencode.plugin");
  const names = plugins.map((entry, index) => pluginName(entry, `rfhold opencode.plugin[${index}]`));

  assertEqualArray(names, rfholdPluginOrder, "rfhold opencode plugin order");
  assertNoPluginOwnedInlineMcp(config, "rfhold opencode");

  for (const [index, entry] of plugins.entries()) {
    const name = rfholdPluginOrder[index];
    const repo = rfholdPluginRepos.get(name);
    const expected = `${name}@git+ssh://git@git.holdenitdown.net/rfhold/${repo}.git#opencode/v`;
    const ref = pluginRef(entry, `rfhold opencode.plugin[${index}]`);

    if (!repo || !ref.startsWith(expected) || !/^.+#opencode\/v\d+\.\d+\.\d+$/.test(ref)) {
      fail(`rfhold opencode.plugin[${index}]: expected ${expected}X.Y.Z form`);
    }
  }
}

function assertRfholdClaude(): void {
  const config = asRecord(readJsonc("home/repos/rfhold/.agents/.claude.json"), "rfhold claude");
  const mcpServers = asRecord(config.mcpServers, "rfhold claude.mcpServers");
  const names = Object.keys(mcpServers).sort();
  assertEqualArray(names, [...rfholdClaudePreviewUrls.keys()].sort(), "rfhold claude MCP server set");

  for (const [server, expectedUrl] of rfholdClaudePreviewUrls) {
    const entry = asRecord(mcpServers[server], `rfhold claude.mcpServers.${server}`);
    if (entry.type !== "http") {
      fail(`rfhold claude.mcpServers.${server}: type must be http`);
    }
    if (entry.url !== expectedUrl) {
      fail(`rfhold claude.mcpServers.${server}: url must be ${expectedUrl}`);
    }
  }
}

function assertCfaintlOpenCode(): void {
  const config = asRecord(readJsonc("home/repos/cfaintl/.agents/opencode.jsonc"), "cfaintl opencode");
  const plugins = asArray(config.plugin, "cfaintl opencode.plugin");
  const cfaPlugins = plugins.filter(
    (entry, index) => pluginName(entry, `cfaintl opencode.plugin[${index}]`) === "cfaintl-skills",
  );

  assertNoPluginOwnedInlineMcp(config, "cfaintl opencode");
  assertNoPlugin(config, "superspec", "cfaintl opencode");

  if (cfaPlugins.length !== 1) {
    fail("cfaintl opencode.plugin: expected exactly one cfaintl skills plugin entry");
  }

  const [entry] = cfaPlugins;
  const ref = pluginRef(entry, "cfaintl opencode.plugin[0]");
  if (ref !== "cfaintl-skills@git+ssh://git@github.com/cfaintl/skills.git#main") {
    fail("cfaintl opencode.plugin[0]: expected cfaintl skills main branch plugin reference");
  }

  if (Array.isArray(entry)) {
    fail("cfaintl opencode.plugin[0]: filters must be configured in cfa-skills.json");
  }

  const settings = asRecord(readJsonc("home/repos/cfaintl/.agents/cfa-skills.json"), "cfaintl skills");
  const exclude = asArray(settings.exclude, "cfaintl skills.exclude");
  if (!exclude.every((item) => typeof item === "string")) {
    fail("cfaintl skills.exclude: all entries must be strings");
  }

  assertEqualArray(exclude as string[], cfaintlExcludes, "cfaintl exclude filter list");
}

function assertGlobalOpenCode(): void {
  const config = asRecord(readJsonc(".config/opencode/opencode.jsonc"), "global opencode");
  assertNoPluginOwnedInlineMcp(config, "global opencode");
  assertNoPlugin(config, "superspec", "global opencode");
  assertNoPlugin(config, "rfhold-skills", "global opencode");
}

function assertDotOpenCode(): void {
  const config = asRecord(readJsonc("opencode.jsonc"), "dot opencode");
  const plugins = asArray(config.plugin, "dot opencode.plugin");
  assertNoPluginOwnedInlineMcp(config, "dot opencode");

  if (plugins.length !== 1) {
    fail("dot opencode.plugin: expected exactly one rfhold-skills plugin entry");
  }

  const ref = pluginRef(plugins[0], "dot opencode.plugin[0]");
  const expected = "rfhold-skills@git+ssh://git@git.holdenitdown.net/rfhold/skills.git#opencode/v";
  if (!ref.startsWith(expected) || !/^.+#opencode\/v\d+\.\d+\.\d+$/.test(ref)) {
    fail(`dot opencode.plugin[0]: expected ${expected}X.Y.Z form`);
  }
}

function assertNoGeneratedOrgAgentContent(): void {
  const reposPath = join(root, "home/repos");
  for (const org of readdirSync(reposPath)) {
    const agentsPath = join(reposPath, org, ".agents");
    if (!existsSync(agentsPath) || !statSync(agentsPath).isDirectory()) {
      continue;
    }

    for (const generatedDir of ["skills-src", "skills"]) {
      const generatedPath = join(agentsPath, generatedDir);
      if (existsSync(generatedPath)) {
        fail(`${org} .agents: checked-in static org directories must not contain generated ${generatedDir}/ content`);
      }
    }
  }
}

function assertEqualArray(actual: string[], expected: string[], label: string): void {
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertGlobalOpenCode();
assertDotOpenCode();
assertRfholdOpenCode();
assertRfholdClaude();
assertCfaintlOpenCode();
assertNoGeneratedOrgAgentContent();

console.log("OpenCode plugin config validation passed.");
