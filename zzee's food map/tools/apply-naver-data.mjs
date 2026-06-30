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
globalThis.__kakaoPlaceData = typeof kakaoPlaceData === "undefined" ? {} : kakaoPlaceData;`,
  context,
);

const checkedAt = "2026-06-30";

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

const compactPlaceData = Object.fromEntries(
  results
    .filter((result) => {
      if (!result.matched || !result.naverPlaceId) return false;

      const reference = context.__kakaoPlaceData[result.requestedName] || context.__verifiedPlaceData[result.requestedName];
      const naverPoint = { latitude: result.latitude, longitude: result.longitude };
      return distanceKm(reference, naverPoint) < 2.2;
    })
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

const googleCheckedAt = "${checkedAt}";
const googlePlaceData = {};
`;

let nextSource = source;

nextSource = nextSource.replace(
  /\nconst naverCheckedAt = "[\s\S]*?\nconst googlePlaceData = \{[\s\S]*?\};\n/g,
  "\n",
);

if (!nextSource.includes("const naverCheckedAt")) {
  nextSource = nextSource.replace(
    "\nconst RESTAURANTS = rawRestaurants.map",
    `\n${naverDataBlock}
const usefulRestaurantImage = (url) => typeof url === "string" && !url.includes("map_roadview");
const mergeRestaurantImages = (...groups) => {
  const urls = groups.flat().filter(usefulRestaurantImage);
  return [...new Set(urls)];
};

const RESTAURANTS = rawRestaurants.map`,
  );
}

const replacements = [
  [
    `  const kakaoPlace = kakaoPlaceData[name];
  const displayPlace = kakaoPlace || verifiedPlace;`,
    `  const kakaoPlace = kakaoPlaceData[name];
  const naverPlace = naverPlaceData[name];
  const googlePlace = googlePlaceData[name];
  const displayPlace = kakaoPlace || naverPlace || verifiedPlace;`,
  ],
  [
    `  const platformRatings = {
    kakao: { label: "카카오", rating: kakaoPlace?.rating ?? null, checkedAt: kakaoPlace?.checkedAt ?? null, note: kakaoPlace ? \`리뷰 \${kakaoPlace.ratingCount ?? kakaoPlace.reviewCount ?? 0}개\` : "카카오 평점 미확인" },
    naver: { label: "네이버", rating: null, checkedAt: null, note: "수동 확인 필요" },
    google: { label: "구글", rating: null, checkedAt: null, note: "수동 확인 필요" },
  };`,
    `  const platformRatings = {
    kakao: { label: "카카오", rating: kakaoPlace?.rating ?? null, checkedAt: kakaoPlace?.checkedAt ?? null, note: kakaoPlace ? "카카오 평점 미표시" : "카카오 평점 미확인" },
    naver: { label: "네이버", rating: naverPlace?.rating ?? null, checkedAt: naverPlace?.checkedAt ?? null, note: naverPlace ? "네이버 평점 미표시" : "네이버 평점 미확인" },
    google: { label: "구글", rating: googlePlace?.rating ?? null, checkedAt: googlePlace?.checkedAt ?? null, note: googlePlace ? "구글 평점 미표시" : "구글 평점 미확인" },
  };`,
  ],
  [
    "    naverMapLink: `https://map.naver.com/p/search/${searchQuery}`,",
    "    naverMapLink: naverPlace?.naverMapLink || `https://map.naver.com/p/search/${searchQuery}`,",
  ],
  [
    "    images: kakaoPlace?.images?.length ? kakaoPlace.images : [CATEGORY_META[category].image],",
    "    images: mergeRestaurantImages(naverPlace?.images || [], kakaoPlace?.images || [], [CATEGORY_META[category].image]),",
  ],
];

for (const [from, to] of replacements) {
  if (!nextSource.includes(from)) {
    throw new Error(`Replacement target not found: ${from.slice(0, 80)}`);
  }
  nextSource = nextSource.replace(from, to);
}

fs.writeFileSync(dataPath, nextSource);

console.log(`Applied ${Object.keys(compactPlaceData).length} Naver places.`);
