#!/usr/bin/env node
// Playwright browser server daemon.
// Must run with Node (not Bun) — Playwright's internal WS server is incompatible with Bun's runtime.
// Launches a persistent-profile Chromium via launchServer (storageState-backed),
// writes the WebSocket endpoint to STATE_FILE, and keeps running until signaled.
//
// Agents connect with:
//   const browser = await chromium.connect(fs.readFileSync(STATE_FILE, 'utf8').trim())

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PROFILE_DIR = join(process.env.HOME, '.local', 'share', 'browser-agent');
const STATE_FILE = join(PROFILE_DIR, 'ws-endpoint');
const STORAGE_FILE = join(PROFILE_DIR, 'storage-state.json');

mkdirSync(PROFILE_DIR, { recursive: true });

const launchOptions = {
  headless: false,
};

// Restore storage state if available
if (existsSync(STORAGE_FILE)) {
  launchOptions.storageState = STORAGE_FILE;
}

const server = await chromium.launchServer(launchOptions);
const wsEndpoint = server.wsEndpoint();

writeFileSync(STATE_FILE, wsEndpoint);
console.log(wsEndpoint);

const cleanup = () => {
  try { writeFileSync(STATE_FILE, ''); } catch {}
};

const shutdown = async () => {
  cleanup();
  await server.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('exit', cleanup);

// Keep alive until the browser process exits
await new Promise((resolve) => {
  const proc = server.process();
  if (proc) {
    proc.on('exit', resolve);
  } else {
    // fallback: poll
    const iv = setInterval(async () => {
      try {
        const b = await chromium.connect(wsEndpoint, { timeout: 1000 });
        await b.close();
      } catch {
        clearInterval(iv);
        resolve();
      }
    }, 2000);
  }
});
cleanup();
