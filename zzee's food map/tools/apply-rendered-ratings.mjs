import fs from "node:fs";

import { latestCheckedAt } from "./lib/place-data-utils.mjs";

const dataPath = new URL("../js/data.js", import.meta.url);
const ratingsPath = new URL("../data/rendered-rating-results.json", import.meta.url);

const source = fs.readFileSync(dataPath, "utf8");
const ratings = JSON.parse(fs.readFileSync(ratingsPath, "utf8"));
const shouldWrite = process.argv.includes("--write");
const existingGoogleBlock = source.match(/const googlePlaceData = (\{[\s\S]*?\});\n/)?.[1] ?? "{}";
const existingGooglePlaceData = Function(`"use strict"; return (${existingGoogleBlock});`)();

const checkedAt = latestCheckedAt(ratings.flatMap((item) => [item.naver, item.google]));
const byName = Object.fromEntries(ratings.map((item) => [item.name, item]));

const googlePlaceData = {
  ...existingGooglePlaceData,
  ...Object.fromEntries(
  ratings
    .filter((item) => item.google?.rating != null)
    .map((item) => [
      item.name,
      {
        rating: item.google.rating,
        reviewCount: item.google.reviewCount,
        googleMapLink: item.google.url,
        checkedAt,
      },
    ]),
  ),
};

const updateNaverBlock = (block) =>
  block.replace(/"([^"]+)": \{[\s\S]*?\n  \}/g, (entry, name) => {
    const rating = byName[name]?.naver;
    if (!rating || rating.rating == null) return entry;

    let nextEntry = entry;
    nextEntry = nextEntry.replace(/"rating": (null|[\d.]+)/, `"rating": ${rating.rating ?? "null"}`);

    if (nextEntry.includes('"reviewCount"')) {
      nextEntry = nextEntry.replace(/"reviewCount": (null|[\d.]+)/, `"reviewCount": ${rating.reviewCount ?? "null"}`);
    } else {
      nextEntry = nextEntry.replace(
        /("rating": (?:null|[\d.]+),)/,
        `$1\n        "reviewCount": ${rating.reviewCount ?? "null"},`,
      );
    }

    nextEntry = nextEntry.replace(/"checkedAt": ".*?"/, `"checkedAt": "${checkedAt}"`);
    return nextEntry;
  });

let nextSource = source;

nextSource = nextSource.replace(
  /(const naverCheckedAt = ".*?";\nconst naverPlaceData = \{)([\s\S]*?)(\};\n\nconst googleCheckedAt)/,
  (match, prefix, block, suffix) => `${prefix}${updateNaverBlock(block)}${suffix}`,
);

const googleBlock = `const googleCheckedAt = "${checkedAt}";
const googlePlaceData = ${JSON.stringify(googlePlaceData, null, 2)};`;

nextSource = nextSource.replace(
  /const googleCheckedAt = ".*?";\nconst googlePlaceData = \{[\s\S]*?\};/,
  googleBlock,
);

nextSource = nextSource.replace(
  "    googleMapLink: `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,",
  "    googleMapLink: googlePlace?.googleMapLink || `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,",
);

if (shouldWrite) fs.writeFileSync(dataPath, nextSource);

console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "preview",
      checkedAt,
      naverRatings: ratings.filter((item) => item.naver?.rating != null).length,
      googleRatings: Object.keys(googlePlaceData).length,
      next: shouldWrite ? "js/data.js 갱신 완료" : "검토 후 같은 명령에 --write를 추가하세요.",
    },
    null,
    2,
  ),
);
