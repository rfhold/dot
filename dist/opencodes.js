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

// src/local-client.ts
import * as net from "net";
import { randomUUID } from "crypto";

class LocalClient {
  opts;
  socket = null;
  backoffMs = 1000;
  stopped = false;
  reconnectTimer = null;
  instanceID;
  socketPath;
  pending = new Map;
  buffer = "";
  constructor(opts) {
    this.opts = opts;
    this.instanceID = randomUUID();
    this.socketPath = LocalClient.getSocketPath();
  }
  static getSocketPath() {
    if (process.env.OPENCODES_SOCKET_PATH)
      return process.env.OPENCODES_SOCKET_PATH;
    const xdg = process.env.XDG_RUNTIME_DIR;
    if (xdg)
      return `${xdg}/opencodes-plugin.sock`;
    const tmpdir = process.env.TMPDIR;
    if (tmpdir)
      return `${tmpdir}/opencodes-plugin.sock`;
    return "/tmp/opencodes-plugin.sock";
  }
  connect() {
    if (this.stopped)
      return;
    this.opts.logger("debug", `connecting to ${this.socketPath}`);
    const socket = net.createConnection(this.socketPath);
    this.socket = socket;
    socket.on("connect", () => {
      this.opts.logger("debug", "socket connected, registering");
      this.sendRegister().catch((err) => {
        this.opts.logger("error", "register failed", { error: String(err) });
        socket.destroy();
      });
      this.backoffMs = 1000;
      if (this.opts.onConnect) {
        this.opts.onConnect().catch((err) => this.opts.logger("error", "onConnect error", { error: String(err) }));
      }
    });
    socket.on("data", (chunk) => {
      this.buffer += chunk.toString();
      let newlineIdx;
      while ((newlineIdx = this.buffer.indexOf(`
`)) !== -1) {
        const line = this.buffer.slice(0, newlineIdx);
        this.buffer = this.buffer.slice(newlineIdx + 1);
        if (line.trim())
          this.handleMessage(line.trim());
      }
    });
    socket.on("close", () => {
      this.opts.logger("debug", "socket closed, scheduling reconnect");
      this.socket = null;
      this.rejectAllPending("socket closed");
      this.scheduleReconnect();
    });
    socket.on("error", (err) => {
      this.opts.logger("warn", "socket error", { error: err.message });
    });
  }
  handleMessage(line) {
    try {
      const msg = JSON.parse(line);
      if (msg.type === "ack" && msg.requestId) {
        const p = this.pending.get(msg.requestId);
        if (p) {
          this.pending.delete(msg.requestId);
          clearTimeout(p.timer);
          if (msg.ok) {
            p.resolve();
          } else {
            p.reject(new Error(msg.error || "server rejected request"));
          }
        }
      } else if (msg.type === "command") {
        this.opts.onCommand(msg).catch((err) => {
          this.opts.logger("error", "onCommand error", { error: String(err) });
        });
      }
    } catch (err) {
      this.opts.logger("error", "failed to handle message", { error: String(err) });
    }
  }
  sendWithAck(msg) {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.socket.destroyed) {
        reject(new Error("not connected"));
        return;
      }
      const requestId = msg.requestId;
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("request timeout"));
      }, 5000);
      this.pending.set(requestId, { resolve, reject, timer });
      this.socket.write(JSON.stringify(msg) + `
`);
    });
  }
  async sendRegister() {
    return this.sendWithAck({
      requestId: randomUUID(),
      type: "register",
      instanceId: this.instanceID,
      pid: process.pid,
      projectDir: this.opts.projectDir,
      opencodeUrl: this.opts.opencodeUrl,
      hostname: this.opts.hostname,
      tmuxSession: this.opts.tmuxSession,
      tmuxWindow: this.opts.tmuxWindow,
      tmuxPane: this.opts.tmuxPane
    });
  }
  isConnected() {
    return this.socket !== null && !this.socket.destroyed;
  }
  sendEvent(eventType, data) {
    if (!this.socket || this.socket.destroyed)
      return;
    try {
      const msg = {
        requestId: randomUUID(),
        type: "event",
        instanceId: this.instanceID,
        eventType,
        data
      };
      this.socket.write(JSON.stringify(msg) + `
`);
    } catch (err) {
      this.opts.logger("error", "sendEvent error", { error: String(err) });
    }
  }
  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.rejectAllPending("client disconnecting");
    if (this.socket !== null) {
      try {
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
  }
  rejectAllPending(reason) {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(new Error(reason));
    }
    this.pending.clear();
  }
  scheduleReconnect() {
    if (this.stopped || this.reconnectTimer !== null)
      return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, 60000);
    this.opts.logger("debug", `reconnecting in ${delay}ms`);
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
            opts.logger("error", "send-message failed", { status: res.status, statusText: res.statusText });
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
            opts.logger("error", "abort failed", { status: res.status, statusText: res.statusText });
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
            opts.logger("error", "permission-response failed", { status: res.status, statusText: res.statusText });
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
                  opts.logger("warn", "restart blocked: instance is busy");
                  return;
                }
              }
            } catch (err) {
              opts.logger("warn", "restart idle-check failed, proceeding", { error: String(err) });
            }
          }
          if (!opts.tmuxPane) {
            opts.logger("error", "restart failed: no tmux pane context");
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
          opts.logger("warn", `unknown command payload: ${cmd.payload}`);
      }
    } catch (err) {
      opts.logger("error", "command handler error", { error: String(err) });
    }
  };
}

// src/index.ts
var OpencodesPlugin = async ({ project, directory, serverUrl, client }) => {
  const logger = (level, message, extra) => {
    client.app.log({ body: { service: "opencodes", level, message, extra } }).catch(() => {});
  };
  try {
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
    const hostname = (await import("os")).hostname().split(".")[0];
    const serverClient = new LocalClient({
      opencodeUrl,
      projectDir: directory || project.worktree,
      hostname,
      tmuxSession,
      tmuxWindow,
      tmuxPane,
      logger,
      onCommand: makeCommandHandler({ opencodeUrl, tmuxPane, logger }),
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
        serverClient.sendEvent(event.type, data);
      }
    };
  } catch (err) {
    logger("error", "plugin init error", { error: String(err) });
  }
  return {};
};
var src_default = OpencodesPlugin;
export {
  src_default as default,
  OpencodesPlugin
};
