import fs from "node:fs";
import vm from "node:vm";

const dataPath = new URL("../js/data.js", import.meta.url);
const naverResultsPath = new URL("../data/naver-place-results.json", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");
const results = JSON.parse(fs.readFileSync(naverResultsPath, "utf8"));

const context = {};
vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__verifiedPlaceData = verifiedPlaceData;
globalThis.__kakaoPlaceData = typeof kakaoPlaceData === "undefined" ? {} : kakaoPlaceData;
globalThis.__seongsuRestaurantNames = typeof seongsuRestaurantNames === "undefined" ? new Set() : seongsuRestaurantNames;`,
  context,
);

const checkedAt = "2026-06-30";
const seongsuNames = context.__seongsuRestaurantNames;
const toRadians = (degrees) => (Number(degrees) * Math.PI) / 180;

const distanceKm = (a, b) => {
  if (!a?.latitude || !a?.longitude || !b?.latitude || !b?.longitude) return 0;

  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const isSafeMatch = (result) => {
  if (!result.matched || !result.naverPlaceId) return false;

  const address = `${result.address ?? ""} ${result.lotAddress ?? ""}`;
  if (seongsuNames.has(result.requestedName)) {
    return address.includes("서울특별시 성동구") || address.includes("서울 성동구");
  }

  const reference = context.__kakaoPlaceData[result.requestedName] || context.__verifiedPlaceData[result.requestedName];
  const naverPoint = { latitude: result.latitude, longitude: result.longitude };
  return distanceKm(reference, naverPoint) < 2.2;
};

const skipped = results
  .filter((result) => result.matched && !isSafeMatch(result))
  .map((result) => ({
    name: result.requestedName,
    matchedName: result.name,
    address: result.address,
  }));

const compactPlaceData = Object.fromEntries(
  results
    .filter(isSafeMatch)
    .map((result) => [
      result.requestedName,
      {
        matchedName: result.name,
        naverPlaceId: result.naverPlaceId,
        address: result.address,
        lotAddress: result.lotAddress,
        latitude: result.latitude,
        longitude: result.longitude,
        naverMapLink: result.naverMapLink,
        rating: result.rating,
        images: result.images,
        checkedAt,
      },
    ]),
);

const naverDataBlock = `const naverCheckedAt = "${checkedAt}";
const naverPlaceData = ${JSON.stringify(compactPlaceData, null, 2)};
`;

const nextSource = source.replace(
  /const naverCheckedAt = ".*?";\nconst naverPlaceData = [\s\S]*?;\n\nconst googleCheckedAt/,
  `${naverDataBlock}\nconst googleCheckedAt`,
);

if (nextSource === source) {
  throw new Error("Could not locate naverPlaceData block.");
}

fs.writeFileSync(dataPath, nextSource);
fs.writeFileSync(new URL("../data/naver-skipped-results.json", import.meta.url), `${JSON.stringify(skipped, null, 2)}\n`);

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
