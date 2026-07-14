import fs from "node:fs";

const platformCandidates = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"],
};

export const findChromeExecutable = () => {
  const candidates = [process.env.CHROME_PATH, ...(platformCandidates[process.platform] ?? [])].filter(Boolean);
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (executable) return executable;

  throw new Error(
    `Chrome 실행 파일을 찾지 못했습니다. CHROME_PATH를 지정하세요. 확인한 경로: ${candidates.join(", ")}`,
  );
};
