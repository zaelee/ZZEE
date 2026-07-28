import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const researchPath = path.join(
  os.tmpdir(),
  "cyberpunk2077-build-tier-research",
  "source-materials.json",
);
const sources = JSON.parse(await readFile(researchPath, "utf8"));

function imagePositions(source) {
  return source.images
    .map((image) => ({
      ...image,
      position: source.structuredText.indexOf(
        `[[SOURCE_IMAGE_${image.markerIndex}]]`,
      ),
    }))
    .filter((image) => image.position >= 0)
    .sort((left, right) => left.position - right.position);
}

function nearestImage(images, position, direction, limit) {
  const candidates = images
    .filter((image) =>
      direction === "before"
        ? image.position < position
        : image.position > position,
    )
    .map((image) => ({
      image,
      distance: Math.abs(image.position - position),
    }))
    .filter((candidate) => candidate.distance <= limit)
    .sort((left, right) => left.distance - right.distance);
  return candidates[0] ?? null;
}

function imageRun(images, position, direction, firstLimit, gapLimit, maxItems) {
  const ordered = direction === "after" ? images : [...images].reverse();
  const candidates = ordered.filter((image) =>
    direction === "after"
      ? image.position > position
      : image.position < position,
  );
  const run = [];
  let previousPosition = position;

  for (const image of candidates) {
    const gap = Math.abs(image.position - previousPosition);
    const limit = run.length ? gapLimit : firstLimit;
    if (gap > limit) {
      if (run.length) break;
      continue;
    }
    run.push(image);
    previousPosition = image.position;
    if (run.length >= maxItems) break;
  }

  return direction === "before" ? run.reverse() : run;
}

function selectFinalAttributes(source, images) {
  const matches = [
    ...source.structuredText.matchAll(
      /최종\s*(?:스킬\s*트리|스킬트리|스텟|스탯|특성|특전|퍽|능력치)/gi,
    ),
  ];
  if (!matches.length) return [];

  for (const match of [...matches].reverse()) {
    const position = match.index + match[0].length / 2;
    const after = imageRun(images, position, "after", 520, 720, 8);
    const before = imageRun(images, position, "before", 520, 720, 8);
    const candidates = [after, before]
      .filter((items) => items.length)
      .sort((left, right) => {
        if (right.length !== left.length) return right.length - left.length;
        const leftDistance = Math.min(
          ...left.map((image) => Math.abs(image.position - position)),
        );
        const rightDistance = Math.min(
          ...right.map((image) => Math.abs(image.position - position)),
        );
        return leftDistance - rightDistance;
      });
    if (candidates.length) return candidates[0];
  }
  return [];
}

function selectCyberware(source, images) {
  const headings = [
    ...source.structuredText.matchAll(
      /최종\s*사이버웨어(?:\s*(?:세팅|셋팅|구성))?|사이버웨어\s*(?:최종|세팅|셋팅|구성|장착)|(?:^|\n)\s*(?:\d+\s*[.)]\s*)?사이버웨어\s*:?\s*(?:\n|$)/gi,
    ),
  ];
  if (!headings.length) return [];

  const scored = [];
  for (const heading of headings) {
    const position = heading.index + heading[0].length / 2;
    for (const direction of ["before", "after"]) {
      const candidate = nearestImage(
        images,
        position,
        direction,
        direction === "before" ? 420 : 820,
      );
      if (!candidate) continue;
      const context = `${candidate.image.before ?? ""} ${candidate.image.after ?? ""}`;
      const strong =
        /최종|세팅|셋팅|구성|용량|방어력/.test(heading[0] + context) ? 1 : 0;
      scored.push({
        image: candidate.image,
        score: strong * 1000 - candidate.distance,
      });
    }
  }

  scored.sort((left, right) => right.score - left.score);
  return scored.length ? [scored[0].image] : [];
}

const finalSetups = {};

for (const source of sources) {
  if (!source.accessible || !source.images?.length) {
    finalSetups[source.id] = { attributes: [], cyberware: [] };
    continue;
  }
  const images = imagePositions(source);
  const attributes = selectFinalAttributes(source, images);
  const cyberware = selectCyberware(source, images);

  finalSetups[source.id] = {
    attributes: attributes.map((image, index) => ({
      url: image.url,
      caption:
        attributes.length > 1
          ? `최종 특성·특전 ${index + 1}`
          : "최종 특성·특전",
    })),
    cyberware: cyberware.map((image) => ({
      url: image.url,
      caption: "최종 사이버웨어",
    })),
  };
}

const output = `(() => {\n  globalThis.CyberpunkFinalSetups = ${JSON.stringify(
  finalSetups,
  null,
  2,
)};\n})();\n`;
await writeFile(path.join(projectRoot, "final-setups.js"), output, "utf8");

const summary = Object.entries(finalSetups).map(([id, value]) => ({
  id,
  attributes: value.attributes.length,
  cyberware: value.cyberware.length,
}));
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
