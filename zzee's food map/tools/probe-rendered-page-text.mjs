import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { findChromeExecutable } from "./lib/chrome-path.mjs";
import { requireProviderTermsAcknowledgement } from "./lib/place-data-utils.mjs";

requireProviderTermsAcknowledgement("Rendered provider page");

const chromePath = findChromeExecutable();
const url = process.argv[2] || "https://map.naver.com/p/entry/place/20069127";
const port = 9223 + Math.floor(Math.random() * 1000);
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "jae-food-chrome-"));

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1280,1600",
  url,
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForJson = async (endpoint) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 12000) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${endpoint}`);
      return response.json();
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome debugging endpoint did not open.");
};

const send = (socket, id, method, params = {}) => {
  socket.send(JSON.stringify({ id, method, params }));
};

try {
  const targets = await waitForJson("/json");
  const page = targets.find((target) => target.type === "page") || targets[0];
  const socket = new WebSocket(page.webSocketDebuggerUrl);

  let id = 0;
  const pending = new Map();
  const contexts = new Map();

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.method === "Runtime.executionContextCreated") {
      contexts.set(payload.params.context.id, payload.params.context);
    }
    if (payload.id && pending.has(payload.id)) {
      pending.get(payload.id)(payload);
      pending.delete(payload.id);
    }
  });

  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));

  const request = (method, params = {}) =>
    new Promise((resolve) => {
      id += 1;
      pending.set(id, resolve);
      send(socket, id, method, params);
    });

  await request("Page.enable");
  await request("Runtime.enable");
  await sleep(12000);

  const texts = [];

  for (const [contextId, context] of contexts) {
    const result = await request("Runtime.evaluate", {
      contextId,
      expression: `(() => {
        try {
          const text = document.body ? document.body.innerText : "";
          return text && text.trim() ? text : "";
        } catch {
          return "";
        }
      })()`,
      returnByValue: true,
    });

    const text = result.result?.result?.value;
    if (text) {
      texts.push(`--- context ${contextId} ${context.origin || ""} ---\n${text}`);
    }
  }

  console.log(texts.join("\n\n"));
  socket.close();
} finally {
  chrome.kill();
  fs.rmSync(profileDir, { recursive: true, force: true });
}
