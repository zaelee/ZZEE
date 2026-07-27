import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

import { findChromeExecutable } from "./lib/chrome-path.mjs";

const root = path.resolve(import.meta.dirname, "..");
const port = 4178;
const chromePort = 9630 + Math.floor(Math.random() * 200);
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "zzee-food-ui-"));
const screenshotPath = path.join(os.tmpdir(), "food-map-boryeong-smoke.png");
const expectedNames = [
  "피자파티",
  "오는정 손만두",
  "제일해물칼국수",
  "성지 보령본점",
  "조양 칼국수",
  "김가네사골수제비",
  "키츠네야",
  "고구려 수제 본 갈비",
  "조개까는남자",
  "윤가네 해물탕",
  "찬찬찬 해장국",
  "대포식당",
  "바이더오",
  "플라르",
  "카페모카브레드",
  "커피인터뷰대천",
  "바다듬루프탑카페",
];

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== path.join(root, "index.html")) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const data = fs.readFileSync(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    });
    response.end(data);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

const chrome = spawn(findChromeExecutable(), [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${chromePort}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1440,1800",
  "about:blank",
]);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const waitForJson = async () => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    try {
      return await fetch(`http://127.0.0.1:${chromePort}/json`).then((response) => response.json());
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome debugging endpoint did not open.");
};

let socket;
try {
  const targets = await waitForJson();
  const page = targets.find((target) => target.type === "page") || targets[0];
  socket = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  const errors = [];
  let id = 0;

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.method === "Runtime.exceptionThrown") errors.push(payload.params);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result);
    }
  });
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: `http://127.0.0.1:${port}/index.html?verify=boryeong` });
  await sleep(4500);

  const evaluation = await send("Runtime.evaluate", {
    expression: `(async () => {
      const input = document.querySelector("#searchInput");
      input.value = "보령";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 700));
      return {
        summary: document.querySelector("#resultSummary")?.textContent || "",
        cards: [...document.querySelectorAll(".restaurant-card")].map((card) => ({
          name: card.querySelector("h2")?.textContent?.trim() || "",
          rating: card.querySelector(".rating-source")?.textContent?.trim() || "",
          highBadge: card.querySelector(".high-rating-badge")?.textContent?.trim() || "",
          platform: card.querySelector(".platform-mini")?.textContent?.replace(/\\s+/g, " ")?.trim() || "",
        })),
      };
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });

  const result = evaluation.result.value;
  const names = result.cards.map((card) => card.name);
  const missing = expectedNames.filter((name) => !names.includes(name));
  const requestedCards = result.cards.filter((card) => expectedNames.includes(card.name));
  const highRatingNames = requestedCards.filter((card) => card.highBadge === "4.5+").map((card) => card.name);
  const missingNaverRatings = requestedCards.filter((card) => /N\s+-/.test(card.platform)).map((card) => card.name);
  const missingGoogleRatings = requestedCards.filter((card) => /G\s+-/.test(card.platform)).map((card) => card.name);
  const missingAverageLabels = requestedCards
    .filter((card) => !card.rating.includes("평균별점"))
    .map((card) => card.name);

  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
  });
  fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, "base64"));

  const summary = {
    resultSummary: result.summary,
    renderedCards: result.cards.length,
    requestedCards: requestedCards.length,
    missing,
    missingNaverRatings,
    missingGoogleRatings,
    missingAverageLabels,
    highRatingNames,
    browserErrors: errors.length,
    screenshot: screenshotPath,
  };
  console.log(JSON.stringify(summary, null, 2));

  if (missing.length || requestedCards.length !== expectedNames.length) {
    throw new Error("보령 검색에서 요청 식당이 누락되었습니다.");
  }
  if (missingNaverRatings.length) throw new Error("네이버 평점 표시 누락");
  if (missingGoogleRatings.join("|") !== "고구려 수제 본 갈비") {
    throw new Error(`구글 평점 표시 누락 범위 오류: ${missingGoogleRatings.join(", ")}`);
  }
  if (missingAverageLabels.length) throw new Error("평균별점 라벨 표시 누락");
  if (highRatingNames.join("|") !== "피자파티|오는정 손만두") {
    throw new Error(`4.5+ 배지 대상 오류: ${highRatingNames.join(", ")}`);
  }
  if (errors.length) throw new Error("브라우저 런타임 오류 발생");
} finally {
  socket?.close();
  server.close();
  chrome.kill();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 });
  } catch {
    // Chrome may briefly retain its temporary profile on Windows.
  }
}
