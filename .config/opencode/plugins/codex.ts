import type { Plugin } from "@opencode-ai/plugin";

const plugin: Plugin = async () => ({
  "chat.headers": async (input, output) => {
    if (input.model.providerID !== "codex") return;
    output.headers.version = "0.151.0";
  },
  "chat.params": async (input, output) => {
    if (input.model.providerID !== "codex") return;
    output.maxOutputTokens = undefined;
  },
});

export default plugin;
