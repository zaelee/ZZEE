const targets = await fetch("http://127.0.0.1:9223/json/list").then((response) => response.json());
const page =
  targets.find((target) => target.type === "page" && target.url.includes("127.0.0.1:4177")) ||
  targets.find((target) => target.type === "page");

if (!page) throw new Error("No Chrome page target found");

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = [];

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });

ws.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(new Error(data.error.message));
    else resolve(data.result);
    return;
  }

  if (data.method === "Runtime.exceptionThrown" || data.method === "Log.entryAdded") {
    events.push(data);
  }
});

await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Page.navigate", { url: "http://127.0.0.1:4177/index.html?cdp=checked" });
await new Promise((resolve) => setTimeout(resolve, 5000));

const expression = `(() => ({
  readyState: document.readyState,
  restaurantListChildren: document.getElementById("restaurantList")?.children.length ?? -1,
  resultSummary: document.getElementById("resultSummary")?.textContent ?? "",
  mapStatus: document.getElementById("mapStatus")?.textContent ?? "",
  mapHasLeaflet: !!document.querySelector(".leaflet-container"),
  fallbackPins: document.querySelectorAll(".fallback-pin").length,
  hasFoodMap: typeof FoodMap !== "undefined",
  baseRestaurants: typeof RESTAURANTS !== "undefined" ? RESTAURANTS.length : "missing",
  sharedRestaurants: typeof NAVER_SHARED_RESTAURANTS !== "undefined" ? NAVER_SHARED_RESTAURANTS.length : "missing",
  appState: typeof state !== "undefined" ? { area: state.area, category: state.category } : "missing"
}))()`;

const result = await send("Runtime.evaluate", {
  expression,
  returnByValue: true,
  awaitPromise: true,
});

const screenshot = await send("Page.captureScreenshot", { format: "png" });
await import("node:fs").then((fs) =>
  fs.writeFileSync(new URL("./food-map-cdp-smoke.png", import.meta.url), Buffer.from(screenshot.data, "base64"))
);

console.log(JSON.stringify({ result: result.result.value, events }, null, 2));
ws.close();
