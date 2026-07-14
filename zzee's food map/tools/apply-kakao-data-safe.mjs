import fs from "node:fs";
import vm from "node:vm";

import { assessPlaceMatch, latestCheckedAt } from "./lib/place-data-utils.mjs";

const dataPath = new URL("../js/data.js", import.meta.url);
const kakaoResultsPath = new URL("../data/kakao-place-results.json", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");
const results = JSON.parse(fs.readFileSync(kakaoResultsPath, "utf8"));
const aliases = JSON.parse(
  fs.readFileSync(new URL("../data/place-aliases.json", import.meta.url), "utf8"),
);
const shouldWrite = process.argv.includes("--write");

const context = {};
vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__verifiedPlaceData = verifiedPlaceData;
globalThis.__seongsuRestaurantNames = typeof seongsuRestaurantNames === "undefined" ? new Set() : seongsuRestaurantNames;`,
  context,
);

const checkedAt = latestCheckedAt(results);
const assess = (result) => {
  if (!result.matched || !result.kakaoPlaceId) {
    return { accepted: false, reasons: [result.error || "장소 매칭 실패"] };
  }

  const isSeongsu = context.__seongsuRestaurantNames.has(result.requestedName);
  return assessPlaceMatch({
    requestedName: result.requestedName,
    matchedName: result.matchedName,
    address: result.address,
    lotAddress: result.lotAddress,
    latitude: result.latitude,
    longitude: result.longitude,
    reference: context.__verifiedPlaceData[result.requestedName] ?? null,
    aliases: aliases[result.requestedName] ?? [],
    allowedDistricts: isSeongsu ? ["성동구"] : ["광진구", "성동구"],
  });
};

const assessedResults = results.map((result) => ({ result, assessment: assess(result) }));
const acceptedResults = assessedResults.filter(({ assessment }) => assessment.accepted);
const skipped = assessedResults
  .filter(({ assessment }) => !assessment.accepted)
  .map(({ result, assessment }) => ({
    name: result.requestedName,
    matchedName: result.matchedName ?? null,
    address: result.address ?? null,
    reasons: assessment.reasons,
  }));

const compactPlaceData = Object.fromEntries(
  acceptedResults.map(({ result, assessment }) => [
    result.requestedName,
    {
      matchedName: result.matchedName,
      kakaoPlaceId: result.kakaoPlaceId,
      address: result.address,
      lotAddress: result.lotAddress,
      latitude: result.latitude,
      longitude: result.longitude,
      kakaoMapLink: result.kakaoMapLink,
      rating: result.rating,
      ratingCount: result.ratingCount,
      reviewCount: result.reviewCount,
      menuItems: result.menuItems,
      menuUpdatedAt: result.menuUpdatedAt,
      priceRange: result.priceRange,
      priceSymbol: result.priceSymbol,
      images: result.images,
      checkedAt: result.checkedAt ?? checkedAt,
      matchDistanceKm: assessment.distanceKm,
    },
  ]),
);

const kakaoDataBlock = `const kakaoCheckedAt = "${checkedAt}";
const kakaoPlaceData = ${JSON.stringify(compactPlaceData, null, 2)};
`;
const nextSource = source.replace(
  /const kakaoCheckedAt = ".*?";\nconst kakaoPlaceData = [\s\S]*?;\n\n(?:\/\/.*\n)?const naverCheckedAt/,
  `${kakaoDataBlock}\nconst naverCheckedAt`,
);

if (nextSource === source) throw new Error("Could not locate kakaoPlaceData block.");

if (shouldWrite) {
  fs.writeFileSync(dataPath, nextSource);
  fs.writeFileSync(
    new URL("../data/kakao-skipped-results.json", import.meta.url),
    `${JSON.stringify(skipped, null, 2)}\n`,
  );
}

console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "preview",
      checkedAt,
      applied: Object.keys(compactPlaceData).length,
      skipped: skipped.length,
      skippedResults: skipped,
      next: shouldWrite ? "js/data.js 갱신 완료" : "검토 후 같은 명령에 --write를 추가하세요.",
    },
    null,
    2,
  ),
);
