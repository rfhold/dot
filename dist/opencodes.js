// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __require = import.meta.require;

// src/index.ts
import * as fs2 from "fs";

// src/server-client.ts
import * as fs from "fs";
var LOG_FILE = "/tmp/opencodes-plugin.log";
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}
`;
  fs.appendFileSync(LOG_FILE, line);
  console.error(...args);
}

class ServerClient {
  opts;
  ws = null;
  backoffMs = 1000;
  stopped = false;
  reconnectTimer = null;
  instanceID;
  constructor(opts) {
    this.opts = opts;
    this.instanceID = crypto.randomUUID();
  }
  connect() {
    if (this.stopped)
      return;
    const isLocal = this.opts.serverAddr.startsWith("localhost:") || this.opts.serverAddr.startsWith("127.0.0.1:");
    const proto = isLocal ? "ws" : "wss";
    const url = `${proto}://${this.opts.serverAddr}/ws`;
    log(`[opencodes] connecting to ${url}`);
    const ws = new WebSocket(url);
    this.ws = ws;
    ws.addEventListener("open", () => {
      log("[opencodes] connection open, registering");
      ws.send(JSON.stringify({
        type: "register",
        instanceId: this.instanceID,
        pid: process.pid,
        projectDir: this.opts.projectDir,
        opencodeUrl: this.opts.opencodeUrl,
        hostname: this.opts.hostname,
        tmuxSession: this.opts.tmuxSession,
        tmuxWindow: this.opts.tmuxWindow,
        tmuxPane: this.opts.tmuxPane
      }));
      this.backoffMs = 1000;
      if (this.opts.onConnect) {
        this.opts.onConnect().catch((err) => log("[opencodes] onConnect error:", err));
      }
    });
    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "command") {
          this.opts.onCommand(msg).catch((err) => {
            log("[opencodes] onCommand error:", err);
          });
        }
      } catch (err) {
        log("[opencodes] failed to handle message:", err);
      }
    });
    ws.addEventListener("close", () => {
      log("[opencodes] connection closed, scheduling reconnect");
      this.ws = null;
      this.scheduleReconnect();
    });
    ws.addEventListener("error", (event) => {
      log("[opencodes] websocket error:", event.message ?? event.type);
    });
  }
  wsState() {
    return this.ws?.readyState ?? -1;
  }
  sendEvent(eventType, data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
      return;
    try {
      this.ws.send(JSON.stringify({ type: "event", event: eventType, data }));
    } catch (err) {
      log("[opencodes] sendEvent error:", err);
    }
  }
  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws !== null) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
  scheduleReconnect() {
    if (this.stopped || this.reconnectTimer !== null)
      return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, 60000);
    log(`[opencodes] reconnecting in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// src/commands.ts
function makeCommandHandler(opts) {
  return async (cmd) => {
    try {
      const base = opts.opencodeUrl.replace(/\/$/, "");
      switch (cmd.payload) {
        case "sendMessage": {
          if (!cmd.sessionId)
            return;
          const text = cmd.sendMessage?.text ?? "";
          const res = await fetch(`${base}/session/${cmd.sessionId}/prompt_async`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parts: [{ type: "text", text }] })
          });
          if (!res.ok) {
            console.error(`[opencodes] send-message failed: ${res.status} ${res.statusText}`);
          }
          break;
        }
        case "abort": {
          if (!cmd.sessionId)
            return;
          const res = await fetch(`${base}/session/${cmd.sessionId}/abort`, {
            method: "POST"
          });
          if (!res.ok) {
            console.error(`[opencodes] abort failed: ${res.status} ${res.statusText}`);
          }
          break;
        }
        case "permit": {
          if (!cmd.sessionId)
            return;
          const permissionId = cmd.permit?.permissionId ?? "";
          const allow = cmd.permit?.allow ?? false;
          const res = await fetch(`${base}/session/${cmd.sessionId}/permissions/${permissionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ allow })
          });
          if (!res.ok) {
            console.error(`[opencodes] permission-response failed: ${res.status} ${res.statusText}`);
          }
          break;
        }
        case "restart": {
          const force = cmd.restart?.force ?? false;
          if (!force) {
            try {
              const statusRes = await fetch(`${base}/session/status`);
              if (statusRes.ok) {
                const statuses = await statusRes.json();
                const busy = Object.values(statuses).some((s) => s === "running" || s === "permission");
                if (busy) {
                  console.error("[opencodes] restart blocked: instance is busy");
                  return;
                }
              }
            } catch (err) {
              console.error("[opencodes] restart idle-check failed, proceeding:", err);
            }
          }
          if (!opts.tmuxPane) {
            console.error("[opencodes] restart failed: no tmux pane context");
            return;
          }
          const paneTarget = `%${opts.tmuxPane}`;
          Bun.spawn(["tmux", "send-keys", "-t", paneTarget, "C-c", ""]);
          setTimeout(() => {
            Bun.spawn([
              "tmux",
              "send-keys",
              "-t",
              paneTarget,
              `kill ${process.pid} && sleep 1 && opencode --continue`,
              "Enter"
            ]);
          }, 500);
          break;
        }
        default:
          console.warn(`[opencodes] unknown command payload: ${cmd.payload}`);
      }
    } catch (err) {
      console.error("[opencodes] command handler error:", err);
    }
  };
}

// src/index.ts
function log2(...args) {
  fs2.appendFileSync("/tmp/opencodes-plugin.log", `[${new Date().toISOString()}] ${args.join(" ")}
`);
}
var OpencodesPlugin = async ({ project, directory, serverUrl, client }) => {
  try {
    const serverAddr = process.env.OPENCODES_SERVER_ADDR ?? "opencodes.holdenitdown.net:443";
    const opencodeUrl = serverUrl.toString().replace(/\/$/, "");
    let tmuxSession = "";
    let tmuxWindow = "";
    let tmuxPane = (process.env.TMUX_PANE ?? "").replace(/^%/, "");
    if (process.env.TMUX) {
      try {
        const proc = Bun.spawnSync(["tmux", "display-message", "-p", "#S\t#W"]);
        const parts = proc.stdout.toString().trim().split("\t");
        tmuxSession = parts[0] ?? "";
        tmuxWindow = parts[1] ?? "";
      } catch {}
    }
    const hostname = (await import("os")).hostname();
    const serverClient = new ServerClient({
      serverAddr,
      opencodeUrl,
      projectDir: directory || project.worktree,
      hostname,
      tmuxSession,
      tmuxWindow,
      tmuxPane,
      onCommand: makeCommandHandler({ opencodeUrl, tmuxPane }),
      onConnect: async () => {
        const resp = await client.session.list();
        for (const sess of resp.data ?? []) {
          serverClient.sendEvent("session.created", { info: sess });
        }
      }
    });
    serverClient.connect();
    return {
      event: async ({ event }) => {
        const data = event.properties ?? event;
        log2(`[opencodes] hook event: ${event.type} ws=${serverClient.wsState()}`);
        serverClient.sendEvent(event.type, data);
      }
    };
  } catch (err) {
    console.error("[opencodes] plugin init error:", err);
  }
  return {};
};
var src_default = OpencodesPlugin;
export {
  src_default as default,
  OpencodesPlugin
};
