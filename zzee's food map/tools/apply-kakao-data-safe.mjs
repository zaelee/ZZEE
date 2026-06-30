import fs from "node:fs";
import vm from "node:vm";

const dataPath = new URL("../js/data.js", import.meta.url);
const kakaoResultsPath = new URL("../data/kakao-place-results.json", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");
const results = JSON.parse(fs.readFileSync(kakaoResultsPath, "utf8"));

const context = {};
vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__seongsuRestaurantNames = typeof seongsuRestaurantNames === "undefined" ? new Set() : seongsuRestaurantNames;`,
  context,
);

const checkedAt = "2026-06-30";
const seongsuNames = context.__seongsuRestaurantNames;
const isSafeMatch = (result) => {
  if (!result.matched) return false;
  if (!seongsuNames.has(result.requestedName)) return true;

  const address = `${result.address ?? ""} ${result.lotAddress ?? ""}`;
  return address.includes("서울") && address.includes("성동구");
};

const skipped = results
  .filter((result) => result.matched && !isSafeMatch(result))
  .map((result) => ({
    name: result.requestedName,
    matchedName: result.matchedName,
    address: result.address,
  }));

const compactPlaceData = Object.fromEntries(
  results
    .filter(isSafeMatch)
    .map((result) => [
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

if (nextSource === source) {
  throw new Error("Could not locate kakaoPlaceData block.");
}

fs.writeFileSync(dataPath, nextSource);
fs.writeFileSync(new URL("../data/kakao-skipped-results.json", import.meta.url), `${JSON.stringify(skipped, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      applied: Object.keys(compactPlaceData).length,
      skipped: skipped.length,
      skippedNames: skipped.map((item) => item.name),
    },
    null,
    2,
  ),
);
