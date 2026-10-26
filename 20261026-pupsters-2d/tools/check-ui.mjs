import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => { throw new Error(message); };
const requiredViews = ["home", "squad", "stages", "battle", "coop", "boss", "victory", "defeat", "codex", "kit"];
const requiredIcons = ["bone", "heart", "paw", "frost", "bolt", "crown", "settings", "play", "pause", "coin", "arrow", "speaker"];

for (const file of ["index.html", "styles.css", "data.js", "app.js"]) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing core file: ${file}`);
}

const html = read("index.html");
if (/https?:\/\//i.test(html)) fail("index.html must not load network resources");
if (!html.includes('<script src="data.js"></script>') || !html.includes('<script src="app.js"></script>')) fail("Direct script order is invalid");
for (const view of requiredViews) if (!html.includes(`data-route="${view}"`)) fail(`Review navigation is missing: ${view}`);

const sandbox = { window: {} };
vm.runInNewContext(read("data.js"), sandbox, { filename: "data.js" });
const data = sandbox.window.PUPSTERS_DATA;
if (!data || data.dogs.length !== 6 || data.enemies.length !== 9) fail("Expected 6 dogs and 9 enemies");

const assetPaths = [
  ...data.dogs.map((item) => item.image),
  ...data.dogs.map((item) => item.effect),
  ...data.enemies.map((item) => item.image),
  ...data.stages.filter((item) => item.bg).map((item) => item.bg),
  ...data.uiAssets.map((file) => `assets/ui/${file}`)
];
for (const asset of assetPaths) if (!fs.existsSync(path.join(root, asset))) fail(`Missing local asset: ${asset}`);
for (const icon of requiredIcons) if (!data.uiAssets.includes(`icon-${icon}.svg`)) fail(`Missing required UI icon: ${icon}`);
for (const svgFile of data.uiAssets) {
  const source = read(`assets/ui/${svgFile}`);
  if (!/^<svg[\s>]/.test(source.trim())) fail(`Invalid SVG root: ${svgFile}`);
  if (/https?:\/\//i.test(source.replace("http://www.w3.org/2000/svg", ""))) fail(`External SVG reference: ${svgFile}`);
}
if (data.route.length !== 6 || data.route[0].x !== 7 || data.route.at(-1).x !== 88) fail("Route waypoint contract changed");
if (data.slots.length !== 6) fail("Expected six placement slots");

console.log(`UI check passed: ${requiredViews.length} views, ${data.dogs.length} dogs, ${data.enemies.length} enemies, ${data.uiAssets.length} editable SVG files.`);
