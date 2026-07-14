import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const ignoredDirectories = new Set([".git", "node_modules", "coverage", "tmp"]);

const collectScripts = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || ignoredDirectories.has(entry.name)) return [];

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectScripts(absolutePath);
    return /\.(?:js|mjs)$/.test(entry.name) ? [absolutePath] : [];
  });

const scripts = collectScripts(root);
const failures = [];

for (const script of scripts) {
  const result = spawnSync(process.execPath, ["--check", script], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    failures.push({
      file: path.relative(root, script),
      message: (result.stderr || result.stdout).trim(),
    });
  }
}

console.log(`Syntax checked: ${scripts.length} JavaScript files`);

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
