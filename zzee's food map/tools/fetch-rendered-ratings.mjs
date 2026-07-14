import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

import { findChromeExecutable } from "./lib/chrome-path.mjs";
import { dateInKorea, requireProviderTermsAcknowledgement } from "./lib/place-data-utils.mjs";

requireProviderTermsAcknowledgement("NAVER/Google rendered pages");

const chromePath = findChromeExecutable();
const dataPath = new URL("../js/data.js", import.meta.url);
const outputPath = new URL("../data/rendered-rating-results.json", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");

const context = {};
vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__restaurants = RESTAURANTS;
globalThis.__naverPlaceData = typeof naverPlaceData === "undefined" ? {} : naverPlaceData;`,
  context,
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const checkedAt = dateInKorea();
const port = 9444 + Math.floor(Math.random() * 500);
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "jae-food-ratings-"));

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1280,1600",
  "about:blank",
]);

const waitForJson = async (endpoint) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${endpoint}`);
      return response.json();
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome debugging endpoint did not open.");
};

const createCdpClient = async () => {
  const targets = await waitForJson("/json");
  const page = targets.find((target) => target.type === "page") || targets[0];
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  const contexts = new Map();
  let id = 0;

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.method === "Runtime.executionContextCreated") {
      contexts.set(payload.params.context.id, payload.params.context);
    }
    if (payload.method === "Runtime.executionContextDestroyed") {
      contexts.delete(payload.params.executionContextId);
    }
    if (payload.method === "Runtime.executionContextsCleared") {
      contexts.clear();
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
      socket.send(JSON.stringify({ id, method, params }));
    });

  await request("Page.enable");
  await request("Runtime.enable");

  return { request, contexts, close: () => socket.close() };
};

const getRenderedText = async (client, url, waitMs) => {
  await client.request("Page.navigate", { url });
  await sleep(waitMs);

  const texts = [];
  for (const [contextId] of client.contexts) {
    const result = await client.request("Runtime.evaluate", {
      contextId,
      expression: `(() => {
        try {
          return document.body && document.body.innerText ? document.body.innerText : "";
        } catch {
          return "";
        }
      })()`,
      returnByValue: true,
    });

    const text = result.result?.result?.value;
    if (text?.trim()) texts.push(text);
  }

  return texts.join("\n");
};

const parseNaver = (text) => {
  const compact = text.replace(/\s+/g, " ");
  const ratingMatch =
    compact.match(/\uBCC4\uC810\s*([0-5](?:\.\d{1,2})?)\s*\uB9AC\uBDF0\s*([\d,]+)/) ||
    compact.match(/별점\s*([0-5](?:\.\d{1,2})?)\s*리뷰\s*([\d,]+)/);
  return {
    rating: ratingMatch ? Number(ratingMatch[1]) : null,
    reviewCount: ratingMatch ? Number(ratingMatch[2].replace(/,/g, "")) : null,
  };
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseGoogle = (text, restaurant) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const target = restaurant.name.replace(/\s+/g, "");

  for (let index = 0; index < lines.length - 1; index += 1) {
    const line = lines[index].replace(/\s+/g, "");
    const next = lines[index + 1];
    if (line.includes(target) && /^[0-5](?:\.\d)?$/.test(next)) {
      return { rating: Number(next), reviewCount: null };
    }
  }

  const pattern = new RegExp(`${escapeRegExp(restaurant.name)}\\s+([0-5](?:\\.\\d)?)`);
  const match = text.match(pattern);
  return {
    rating: match ? Number(match[1]) : null,
    reviewCount: null,
  };
};

const googleUrl = (restaurant) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${restaurant.address}`)}`;

const results = [];
const onlyMissing = process.argv.includes("--missing");
const restaurants = onlyMissing
  ? context.__restaurants.filter(
      (restaurant) => !restaurant.platformRatings?.naver?.rating || !restaurant.platformRatings?.google?.rating,
    )
  : context.__restaurants;

let client;
try {
  client = await createCdpClient();
  for (const restaurant of restaurants) {
    const naverPlace = context.__naverPlaceData[restaurant.name];
    const result = {
      name: restaurant.name,
      naver: { rating: null, reviewCount: null, checkedAt, url: restaurant.naverMapLink },
      google: { rating: null, reviewCount: null, checkedAt, url: googleUrl(restaurant) },
    };

    try {
      if ((!onlyMissing || restaurant.platformRatings?.naver?.rating == null) && (naverPlace?.naverMapLink || restaurant.naverMapLink)) {
        const text = await getRenderedText(client, naverPlace?.naverMapLink || restaurant.naverMapLink, 8500);
        result.naver = { ...result.naver, ...parseNaver(text), url: naverPlace?.naverMapLink || restaurant.naverMapLink };
      }
    } catch (error) {
      result.naver.error = error.message;
    }

    try {
      if (onlyMissing && restaurant.platformRatings?.google?.rating) {
        result.google = {
          ...result.google,
          rating: restaurant.platformRatings.google.rating,
          checkedAt: restaurant.platformRatings.google.checkedAt,
        };
      } else {
        const text = await getRenderedText(client, result.google.url, 8500);
        result.google = { ...result.google, ...parseGoogle(text, restaurant) };
      }
    } catch (error) {
      result.google.error = error.message;
    }

    results.push(result);
    console.log(
      [
        restaurant.name,
        `naver=${result.naver.rating ?? "-"}`,
        `google=${result.google.rating ?? "-"}`,
      ].join("\t"),
    );
  }
} finally {
  client?.close();
  chrome.kill();
  fs.rmSync(profileDir, { recursive: true, force: true });
}

fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
