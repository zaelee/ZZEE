import fs from "node:fs";

const dataPath = new URL("../js/data.js", import.meta.url);
const kakaoResultsPath = new URL("../data/kakao-place-results.json", import.meta.url);

const source = fs.readFileSync(dataPath, "utf8");
const results = JSON.parse(fs.readFileSync(kakaoResultsPath, "utf8"));

const compactPlaceData = Object.fromEntries(
  results
    .filter((result) => result.matched)
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
        checkedAt: result.checkedAt,
      },
    ]),
);

const kakaoDataBlock = `const kakaoCheckedAt = "2026-06-30";
const kakaoPlaceData = ${JSON.stringify(compactPlaceData, null, 2)};
`;

let nextSource = source;

if (nextSource.includes("const kakaoCheckedAt")) {
  nextSource = nextSource.replace(
    /const kakaoCheckedAt = ".*?";\nconst kakaoPlaceData = [\s\S]*?;\n\n\/\/ 주소\/좌표는/,
    `${kakaoDataBlock}\n// 주소/좌표는`,
  );
} else {
  nextSource = nextSource.replace(
    "\n\n// 주소/좌표는 verifiedPlaceData를 우선 사용하고, 없는 경우에만 건대입구역 주변 임시 좌표를 씁니다.",
    `\n\n${kakaoDataBlock}\n// 주소/좌표는 카카오 상세 데이터를 우선 사용하고, 없는 경우 검증된 네이버 주소를 씁니다.`,
  );
}

const replacements = [
  [
    "  const verifiedPlace = verifiedPlaceData[name];",
    `  const verifiedPlace = verifiedPlaceData[name];
  const kakaoPlace = kakaoPlaceData[name];
  const displayPlace = kakaoPlace || verifiedPlace;`,
  ],
  [
    "  const mapSearchText = verifiedPlace ? `${verifiedPlace.address} ${name}` : `건대 ${name}`;",
    "  const mapSearchText = displayPlace ? `${displayPlace.address} ${name}` : `건대 ${name}`;",
  ],
  [
    '    kakao: { label: "카카오", rating: null, checkedAt: null, note: "수동 확인 필요" },',
    '    kakao: { label: "카카오", rating: kakaoPlace?.rating ?? null, checkedAt: kakaoPlace?.checkedAt ?? null, note: kakaoPlace ? "카카오 평점 미표시" : "카카오 평점 미확인" },',
  ],
  [
    "    menuItems: buildMenuItems(signatureMenu),",
    "    menuItems: kakaoPlace?.menuItems?.length ? kakaoPlace.menuItems : buildMenuItems(signatureMenu),",
  ],
  [
    "    priceRange: priceByCategory[category],",
    "    priceRange: kakaoPlace?.priceRange || priceByCategory[category],",
  ],
  [
    '    priceSource: "지도 메뉴판 수동 확인 필요",',
    '    priceSource: kakaoPlace?.menuUpdatedAt ? `카카오맵 메뉴 기준 · ${kakaoPlace.menuUpdatedAt}` : "카카오맵 메뉴 가격 미표시",',
  ],
  [
    "    verifiedAt: verifiedPlace ? addressVerifiedAt : null,",
    "    verifiedAt: kakaoPlace?.checkedAt || (verifiedPlace ? addressVerifiedAt : null),",
  ],
  [
    `    verificationNote: verifiedPlace
      ? \`네이버 모바일 지도 검색 결과 기준 주소/좌표 반영\${verifiedPlace.matchedName !== name ? \` · 등록명: \${verifiedPlace.matchedName}\` : ""}\`
      : "정확 주소, 플랫폼 평점, 메뉴 가격 수동 확인 필요",`,
    `    verificationNote: kakaoPlace
      ? \`카카오맵 상세/메뉴 API 기준 반영\${kakaoPlace.matchedName !== name ? \` · 등록명: \${kakaoPlace.matchedName}\` : ""}\`
      : verifiedPlace
        ? \`네이버 모바일 지도 검색 결과 기준 주소/좌표 반영\${verifiedPlace.matchedName !== name ? \` · 등록명: \${verifiedPlace.matchedName}\` : ""}\`
        : "정확 주소, 플랫폼 평점, 메뉴 가격 수동 확인 필요",`,
  ],
  [
    "    kakaoMapLink: `https://map.kakao.com/link/search/${searchQuery}`,",
    "    kakaoMapLink: kakaoPlace?.kakaoMapLink || `https://map.kakao.com/link/search/${searchQuery}`,",
  ],
  [
    '    address: verifiedPlace?.address || "서울 광진구 건대입구역 인근",',
    '    address: displayPlace?.address || "서울 광진구 건대입구역 인근",',
  ],
  [
    "    latitude: verifiedPlace?.latitude || latitude,",
    "    latitude: displayPlace?.latitude || latitude,",
  ],
  [
    "    longitude: verifiedPlace?.longitude || longitude,",
    "    longitude: displayPlace?.longitude || longitude,",
  ],
  [
    "    images: [CATEGORY_META[category].image],",
    "    images: kakaoPlace?.images?.length ? kakaoPlace.images.filter((url) => !url.includes(\"map_roadview\")) : [CATEGORY_META[category].image],",
  ],
];

for (const [from, to] of replacements) {
  if (!nextSource.includes(from)) {
    throw new Error(`Replacement target not found: ${from.slice(0, 80)}`);
  }
  nextSource = nextSource.replace(from, to);
}

fs.writeFileSync(dataPath, nextSource);
