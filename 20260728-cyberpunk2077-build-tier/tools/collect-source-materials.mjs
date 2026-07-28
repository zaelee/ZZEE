import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const dataSource = await readFile(path.join(projectRoot, "data.js"), "utf8");
const sandbox = { globalThis: {} };
vm.runInNewContext(dataSource, sandbox);

const { builds } = sandbox.globalThis.CyberpunkBuildData;
const outputDirectory = path.join(os.tmpdir(), "cyberpunk2077-build-tier-research");
await mkdir(outputDirectory, { recursive: true });

const decodeEntities = (value) =>
  value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

function htmlToText(value) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

function extractArticle(html) {
  const start = html.indexOf('<div class="write_div"');
  const end = start >= 0 ? html.indexOf('<div class="btn_recommend_box', start) : -1;
  if (start < 0 || end < 0) return null;

  const bodyHtml = html.slice(start, end);
  const images = [];
  const marked = bodyHtml.replace(/<img\b[^>]*>/gi, (tag) => {
    const original = tag.match(/\bdata-original=["']([^"']+)/i)?.[1];
    const source = tag.match(/\bsrc=["']([^"']+)/i)?.[1];
    const fileNumber = tag.match(/\bdata-fileno=["']([^"']+)/i)?.[1] ?? "";
    const markerIndex = images.length;
    const image = {
      url: decodeEntities(original ?? source ?? ""),
      fileNumber,
      markerIndex,
      before: "",
      after: "",
    };
    const index = images.push(image) - 1;
    return `\n[[SOURCE_IMAGE_${index}]]\n`;
  });
  const textWithMarkers = htmlToText(marked);

  for (let index = 0; index < images.length; index += 1) {
    const marker = `[[SOURCE_IMAGE_${index}]]`;
    const markerIndex = textWithMarkers.indexOf(marker);
    if (markerIndex < 0) continue;
    const before = textWithMarkers.slice(0, markerIndex).trim();
    const after = textWithMarkers.slice(markerIndex + marker.length).trim();
    images[index].before = before.slice(-260).replace(/\s+/g, " ");
    images[index].after = after.slice(0, 260).replace(/\s+/g, " ");
  }

  const articleBodyMatch = [...html.matchAll(
    /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis,
  )]
    .map((match) => {
      try {
        return JSON.parse(match[1]);
      } catch {
        return null;
      }
    })
    .find((item) => item?.["@type"] === "DiscussionForumPosting");

  const uniqueImages = images
    .filter((image) => image.url.includes("dcimg"))
    .filter(
      (image, index, collection) =>
        collection.findIndex((candidate) => candidate.url === image.url) === index,
    )
    .map((image, index) => ({
      ...image,
      fileNumber: image.fileNumber || String(index + 1),
    }));

  return {
    headline: articleBodyMatch?.headline ?? "",
    articleBody: articleBodyMatch?.articleBody ?? htmlToText(bodyHtml),
    structuredText: textWithMarkers,
    images: uniqueImages,
  };
}

const results = [];

for (const [index, build] of builds.entries()) {
  if (build.sourceAccessible === false) {
    results.push({ id: build.id, source: build.source, accessible: false });
    continue;
  }

  const postNumber = build.source.match(/(?:no=|cyberpunk2077\/)(\d+)/)?.[1];
  const fetchUrl = postNumber
    ? `https://gall.dcinside.com/mgallery/board/view/?id=cyberpunk2077&no=${postNumber}`
    : build.source;
  const response = await fetch(fetchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });
  const html = await response.text();
  const article = extractArticle(html);
  results.push({
    id: build.id,
    source: build.source,
    fetchedFrom: fetchUrl,
    accessible: response.ok && Boolean(article),
    status: response.status,
    ...article,
  });
  process.stdout.write(
    `[${index + 1}/${builds.length}] ${build.id}: ${article?.images.length ?? 0} images\n`,
  );
}

const outputPath = path.join(outputDirectory, "source-materials.json");
await writeFile(outputPath, JSON.stringify(results, null, 2), "utf8");
process.stdout.write(`${outputPath}\n`);
