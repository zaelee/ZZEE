import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "node_modules", "coverage", "tmp"]);

const collectHtml = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || ignoredDirectories.has(entry.name)) return [];
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectHtml(absolutePath);
    return entry.name.endsWith(".html") ? [absolutePath] : [];
  });

const localReference = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
const ignoredReference = /^(?:#|https?:|data:|mailto:|tel:|javascript:|\/\/)/i;
const failures = [];
let checkedReferences = 0;

for (const htmlPath of collectHtml(root)) {
  const source = fs.readFileSync(htmlPath, "utf8");
  for (const match of source.matchAll(localReference)) {
    const reference = match[2];
    if (!reference || ignoredReference.test(reference) || reference.includes("${")) continue;

    const cleanReference = reference.split(/[?#]/, 1)[0];
    let decodedReference;
    try {
      decodedReference = decodeURIComponent(cleanReference);
    } catch {
      failures.push({ file: path.relative(root, htmlPath), reference, reason: "잘못된 URL 인코딩" });
      continue;
    }

    const target = path.resolve(path.dirname(htmlPath), decodedReference);
    checkedReferences += 1;
    if (!fs.existsSync(target)) {
      failures.push({ file: path.relative(root, htmlPath), reference, reason: "대상 파일 없음" });
    }
  }
}

console.log(`Local links checked: ${checkedReferences}`);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
