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
  registered = false;
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
    if (process.env.CUTHULU_SOCKET_PATH)
      return process.env.CUTHULU_SOCKET_PATH;
    const xdg = process.env.XDG_RUNTIME_DIR;
    if (xdg)
      return `${xdg}/cuthulu-plugin.sock`;
    const tmpdir = process.env.TMPDIR;
    if (tmpdir)
      return `${tmpdir}/cuthulu-plugin.sock`;
    return "/tmp/cuthulu-plugin.sock";
  }
  connect() {
    if (this.stopped)
      return;
    this.opts.logger("debug", `connecting to ${this.socketPath}`);
    const socket = net.createConnection(this.socketPath);
    this.socket = socket;
    socket.on("connect", () => {
      this.opts.logger("debug", "socket connected, registering");
      this.registered = false;
      this.backoffMs = 1000;
      this.sendRegister().then(() => {
        this.registered = true;
        return this.opts.onConnect?.();
      }).catch((err) => {
        this.opts.logger("error", "register failed", { error: String(err) });
        socket.destroy();
      });
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
      this.registered = false;
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
    if (!this.registered)
      return;
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
      switch (cmd.payload) {
        case "sendMessage": {
          if (!cmd.sessionId)
            return;
          const text = cmd.sendMessage?.text ?? "";
          const newSession = cmd.sendMessage?.newSession ?? false;
          const agent = cmd.sendMessage?.agent ?? "";
          const modelId = cmd.sendMessage?.modelId ?? "";
          const providerId = cmd.sendMessage?.providerId ?? "";
          let targetSessionId = cmd.sessionId;
          if (newSession) {
            const created = await opts.client.session.create();
            if (created.error) {
              opts.logger("error", "create-session failed", { error: created.error });
              break;
            }
            targetSessionId = created.data?.id ?? cmd.sessionId;
          }
          const res = await opts.client.session.promptAsync({
            path: { id: targetSessionId },
            body: {
              parts: [{ type: "text", text }],
              agent: agent || undefined,
              model: modelId && providerId ? { modelID: modelId, providerID: providerId } : undefined
            }
          });
          if (res.error) {
            opts.logger("error", "send-message failed", { error: res.error });
          }
          break;
        }
        case "abort": {
          if (!cmd.sessionId)
            return;
          const res = await opts.client.session.abort({
            path: { id: cmd.sessionId }
          });
          if (res.error) {
            opts.logger("error", "abort failed", { error: res.error });
          }
          break;
        }
        case "permit": {
          if (!cmd.sessionId)
            return;
          const permissionId = cmd.permit?.permissionId ?? "";
          const allow = cmd.permit?.allow ?? false;
          const always = cmd.permit?.always ?? false;
          const response = always ? "always" : allow ? "once" : "reject";
          const res = await opts.client.postSessionIdPermissionsPermissionId({
            path: { id: cmd.sessionId, permissionID: permissionId },
            body: { response }
          });
          if (res.error) {
            opts.logger("error", "permission-response failed", { error: res.error });
          }
          break;
        }
        case "respondQuestion": {
          const requestId = cmd.respondQuestion?.requestId ?? "";
          const reject = cmd.respondQuestion?.reject ?? false;
          const inner = opts.client._client;
          if (reject) {
            const res = await inner.post({
              url: "/question/{requestID}/reject",
              path: { requestID: requestId }
            });
            if (res.error) {
              opts.logger("error", "question-reject failed", { error: res.error });
            }
          } else {
            const rawAnswers = cmd.respondQuestion?.answers ?? [];
            const answers = rawAnswers.map((a) => {
              try {
                return JSON.parse(a);
              } catch {
                return [a];
              }
            });
            const res = await inner.post({
              url: "/question/{requestID}/reply",
              path: { requestID: requestId },
              body: { answers },
              headers: { "Content-Type": "application/json" }
            });
            if (res.error) {
              opts.logger("error", "question-reply failed", { error: res.error });
            }
          }
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
var CuthuluPlugin = async ({ project, directory, serverUrl, client }) => {
  const logger = (level, message, extra) => {
    client.app.log({ body: { service: "cuthulu", level, message, extra } }).catch(() => {});
  };
  try {
    const opencodeUrl = serverUrl.toString().replace(/\/$/, "");
    let tmuxSession = "";
    let tmuxWindow = "";
    let tmuxPane = (process.env.TMUX_PANE ?? "").replace(/^%/, "");
    if (process.env.TMUX) {
      try {
        const proc = Bun.spawnSync(["tmux", "display-message", "-t", `%${tmuxPane}`, "-p", "#S\t#W"]);
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
      onCommand: makeCommandHandler({ client, tmuxPane, logger }),
      onConnect: async () => {
        const resp = await client.session.list();
        for (const sess of resp.data ?? []) {
          serverClient.sendEvent("session.updated", { info: sess });
        }
        const agentsResp = await client.app.agents();
        serverClient.sendEvent("app.agents", { agents: agentsResp.data ?? [] });
        const providersResp = await client.provider.list();
        serverClient.sendEvent("app.providers", providersResp.data ?? {});
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
var src_default = CuthuluPlugin;
export {
  src_default as default,
  CuthuluPlugin
};
