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
const aliasesPath = new URL("../data/place-aliases.json", import.meta.url);
const placeAliases = JSON.parse(fs.readFileSync(aliasesPath, "utf8"));
const boryeongOnly = process.argv.includes("--boryeong");
const targetedOnly = process.argv.some((argument) => argument.startsWith("--names="));
const outputPath = new URL(
  boryeongOnly
    ? targetedOnly
      ? "../data/boryeong-rendered-rating-probe.json"
      : "../data/boryeong-rendered-rating-results.json"
    : "../data/rendered-rating-results.json",
  import.meta.url,
);
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

const getRenderedPage = async (client, url, waitMs) => {
  await client.request("Page.navigate", { url });
  await sleep(waitMs);

  const pages = [];
  for (const [contextId] of client.contexts) {
    const result = await client.request("Runtime.evaluate", {
      contextId,
      expression: `(() => {
        try {
          const bodyText = document.body?.innerText || "";
          const ariaText = [...document.querySelectorAll("[aria-label]")]
            .map((node) => node.getAttribute("aria-label"))
            .filter(Boolean)
            .join("\\n");
          return {
            bodyText,
            ariaText,
            title: document.title || "",
            url: location.href,
            placeLinks: [...document.querySelectorAll('a[href*="/maps/place/"]')]
              .map((node) => ({
                text: node.innerText || "",
                ariaLabel: node.getAttribute("aria-label") || "",
                href: node.href || "",
              }))
              .filter((entry) => entry.href)
              .slice(0, 40),
          };
        } catch {
          return null;
        }
      })()`,
      returnByValue: true,
    });

    const page = result.result?.result?.value;
    if (page?.bodyText?.trim()) pages.push(page);
  }

  return pages.sort((a, b) => b.bodyText.length - a.bodyText.length)[0] || {
    bodyText: "",
    ariaText: "",
    title: "",
    url,
  };
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

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();

const parseGoogle = (page, restaurant) => {
  const text = `${page.bodyText}\n${page.ariaText}`;
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidateNames = [restaurant.name, ...(placeAliases[restaurant.name] || [])];
  const targets = candidateNames.map(normalizeText).filter(Boolean);
  const normalizedTitle = normalizeText(page.title);
  const matchingLines = lines.filter((line) => {
    const normalizedLine = normalizeText(line);
    return targets.some((target) => normalizedLine.includes(target) || target.includes(normalizedLine));
  });
  const nameAccepted =
    targets.some((target) => normalizedTitle.includes(target) || target.includes(normalizedTitle)) ||
    matchingLines.length > 0;
  const addressTokens = restaurant.address
    .split(/\s+/)
    .map(normalizeText)
    .filter((token) => token.length >= 2);
  const addressAccepted = addressTokens.some((token) => normalizeText(text).includes(token));

  for (let index = 0; index < lines.length - 1; index += 1) {
    const line = normalizeText(lines[index]);
    const next = lines[index + 1];
    if (targets.some((target) => line.includes(target) || target.includes(line)) && /^[0-5](?:\.\d)?$/.test(next)) {
      return {
        rating: Number(next),
        reviewCount: null,
        nameAccepted,
        addressAccepted,
        evidence: `${lines[index]} | ${next}`,
      };
    }
  }

  const ariaMatch =
    text.match(/별(?:표)?\s*5개\s*만점에\s*([0-5](?:[.,]\d{1,2})?)/i) ||
    text.match(/별표\s*([0-5](?:[.,]\d{1,2})?)개/i) ||
    text.match(/평점\s*([0-5](?:[.,]\d{1,2})?)\s*(?:점|별)/i) ||
    text.match(/([0-5](?:[.,]\d{1,2})?)\s*(?:별표|stars?)/i);
  const namedMatch = candidateNames
    .map((name) => text.match(new RegExp(`${escapeRegExp(name)}\\s+([0-5](?:[.,]\\d{1,2})?)`)))
    .find(Boolean);
  const match = nameAccepted ? ariaMatch || namedMatch : null;
  const reviewMatch =
    text.match(/리뷰\s*([\d,]+)개/i) ||
    text.match(/([\d,]+)\s*(?:개의\s*)?(?:Google\s*)?리뷰/i) ||
    text.match(/([\d,]+)\s+reviews?/i);
  const debugLines = lines
    .filter((line) => /[0-5][.,]\d|별|star|review|리뷰|평점/i.test(line))
    .slice(0, 40);
  return {
    rating: match ? Number(match[1].replace(",", ".")) : null,
    reviewCount: reviewMatch ? Number(reviewMatch[1].replace(/,/g, "")) : null,
    nameAccepted,
    addressAccepted,
    evidence: match?.[0] ?? null,
    debugLines,
  };
};

const GOOGLE_URL_OVERRIDES = {
  "성지 보령본점":
    "https://www.google.com/maps/search/?api=1&query=%EC%84%B1%EC%A7%802%ED%98%B8%EC%A0%90&query_place_id=ChIJvSEFZtN_cDUR_lIPTqxyx-8",
  "성지 2호점":
    "https://www.google.com/maps/search/?api=1&query=%EC%84%B1%EC%A7%802%ED%98%B8%EC%A0%90&query_place_id=ChIJvSEFZtN_cDUR_lIPTqxyx-8",
};

const googleUrl = (restaurant) =>
  GOOGLE_URL_OVERRIDES[restaurant.name] ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${restaurant.address}`)}`;

const results = [];
const onlyMissing = process.argv.includes("--missing");
const googleOnly = process.argv.includes("--google-only");
const scopedRestaurants = boryeongOnly
  ? context.__restaurants.filter((restaurant) => restaurant.area === "보령")
  : context.__restaurants;
const namesArgument = process.argv.find((argument) => argument.startsWith("--names="));
const requestedNames = new Set(
  namesArgument
    ? decodeURIComponent(namesArgument.slice("--names=".length))
        .split("|")
        .map((name) => name.trim())
        .filter(Boolean)
    : [],
);
const namedRestaurants = requestedNames.size
  ? scopedRestaurants.filter((restaurant) => requestedNames.has(restaurant.name))
  : scopedRestaurants;
const restaurants = onlyMissing
  ? namedRestaurants.filter(
      (restaurant) => !restaurant.platformRatings?.naver?.rating || !restaurant.platformRatings?.google?.rating,
    )
  : namedRestaurants;

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
      if (
        !googleOnly &&
        (!onlyMissing || restaurant.platformRatings?.naver?.rating == null) &&
        (naverPlace?.naverMapLink || restaurant.naverMapLink)
      ) {
        const page = await getRenderedPage(client, naverPlace?.naverMapLink || restaurant.naverMapLink, 8500);
        result.naver = {
          ...result.naver,
          ...parseNaver(`${page.bodyText}\n${page.ariaText}`),
          url: page.url || naverPlace?.naverMapLink || restaurant.naverMapLink,
        };
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
        const page = await getRenderedPage(client, result.google.url, 8500);
        result.google = {
          ...result.google,
          ...parseGoogle(page, restaurant),
          title: page.title,
          resolvedUrl: page.url,
          placeLinks: page.placeLinks,
        };
      }
    } catch (error) {
      result.google.error = error.message;
    }

    results.push(result);
    fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
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
  try {
    fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 });
  } catch (error) {
    console.warn(`Chrome 임시 프로필 정리 보류: ${error.message}`);
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
