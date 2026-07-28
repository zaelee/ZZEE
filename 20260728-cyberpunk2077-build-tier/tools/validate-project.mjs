import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const context = { globalThis: {} };

for (const file of [
  "data.js",
  "final-setups.js",
  "gear-data.js",
  "enhanced-data.js",
]) {
  const source = await readFile(path.join(projectRoot, file), "utf8");
  vm.runInNewContext(source, context, { filename: file });
}

const { builds } = context.globalThis.CyberpunkBuildData;
const errors = [];
if (builds.length !== 38) errors.push(`빌드 수: ${builds.length}/38`);

for (const build of builds) {
  if (!Array.isArray(build.finalAttributeImages)) {
    errors.push(`${build.id}: finalAttributeImages 누락`);
  }
  if (!Array.isArray(build.finalCyberwareImages)) {
    errors.push(`${build.id}: finalCyberwareImages 누락`);
  }
  if (!Array.isArray(build.gear) || build.gear.length !== build.weapons.length) {
    errors.push(`${build.id}: 장비 카드 수 불일치`);
  }
  for (const gear of build.gear ?? []) {
    for (const field of [
      "name",
      "type",
      "description",
      "acquisition",
      "thumbnail",
      "source",
    ]) {
      if (!gear[field]) errors.push(`${build.id}/${gear.name}: ${field} 누락`);
    }
  }
}

async function mapLimit(values, limit, task) {
  const output = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await task(values[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
  return output;
}

const imageUrls = [
  ...new Set([
    ...builds.flatMap((build) =>
      [
        ...build.finalAttributeImages,
        ...build.finalCyberwareImages,
      ].map((image) => image.url),
    ),
    ...builds.flatMap((build) => build.gear.map((gear) => gear.thumbnail)),
  ]),
];

const imageChecks = await mapLimit(imageUrls, 12, async (url) => {
  try {
    const response = await fetch(url, {
      headers: {
        range: "bytes=0-0",
        "user-agent": "Mozilla/5.0",
      },
      redirect: "follow",
    });
    await response.body?.cancel();
    return { url, ok: response.ok, status: response.status };
  } catch (error) {
    return { url, ok: false, status: String(error) };
  }
});
const failedImages = imageChecks.filter((check) => !check.ok);

const summary = {
  builds: builds.length,
  gearCards: builds.reduce((total, build) => total + build.gear.length, 0),
  catalogItems: Object.keys(context.globalThis.CyberpunkGearCatalog).length,
  finalAttributeImages: builds.reduce(
    (total, build) => total + build.finalAttributeImages.length,
    0,
  ),
  finalCyberwareImages: builds.reduce(
    (total, build) => total + build.finalCyberwareImages.length,
    0,
  ),
  uniqueImagesChecked: imageChecks.length,
  failedImages,
  dataErrors: errors,
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
if (errors.length || failedImages.length) process.exitCode = 1;
