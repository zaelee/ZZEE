import fs from "node:fs";
import vm from "node:vm";

import {
  dateInKorea,
  normalizePlaceName,
  placeNameScore,
  requireProviderTermsAcknowledgement,
} from "./lib/place-data-utils.mjs";

requireProviderTermsAcknowledgement("NAVER Map/Place");

const dataPath = new URL("../js/data.js", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__rawRestaurants = rawRestaurants;
globalThis.__verifiedPlaceData = verifiedPlaceData;
globalThis.__kakaoPlaceData = typeof kakaoPlaceData === "undefined" ? {} : kakaoPlaceData;`,
  context,
);

const restaurants = context.__rawRestaurants.map(([name, category]) => ({
  name,
  category,
  verifiedPlace: context.__verifiedPlaceData[name],
  kakaoPlace: context.__kakaoPlaceData[name],
}));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const checkedAt = dateInKorea();
const requestDelayMs = Math.max(700, Number(process.env.PLACE_FETCH_DELAY_MS) || 1000);
const seongsuRestaurantNames = new Set([
  "잠수교집",
  "꿉당",
  "땅코참숯구이",
  "성수동양갈비",
  "능동미나리",
  "금금",
  "돼지공탕하우",
  "실비옥",
  "솥솥",
  "조조칼국수",
  "칼",
  "르프리크",
  "bd버거",
  "롸카두들",
  "핑거팁스",
  "마오",
  "마하차이",
  "벱",
  "남짐릇",
  "페이퍼플레이트",
  "세스크멘슬",
  "마리오네",
  "피읻짜",
  "코치",
  "가조쿠",
  "소바마에니고",
  "탐광",
  "토리아에즈",
  "라무라",
  "도죠",
  "죠죠",
  "성수속향연",
  "중앙감속기",
  "데니스타코",
  "영수분식",
  "미정이네식당",
  "소문난 성수 감자탕",
  "성수 족발",
  "높은산",
  "밀스",
  "맥파이앤타이거",
  "커피로우스탠드",
  "스탠드업플리즈",
  "폴린커피바",
  "뵈르뵈르",
  "자연도소금빵",
  "코끼리베이글",
  "차일디쉬",
  "텅 성수 스페이스",
  "마마젤라또",
  "어니언",
]);

const areaHint = (restaurant) => (seongsuRestaurantNames.has(restaurant.name) ? "성수" : "건대");

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
};

const extractBalanced = (text, startIndex, openChar = "[", closeChar = "]") => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) depth += 1;
    if (char === closeChar) depth -= 1;
    if (depth === 0) return text.slice(startIndex, index + 1);
  }

  return null;
};

const extractItems = (html) => {
  const marker = '"items":';
  let markerIndex = html.indexOf(marker);

  while (markerIndex !== -1) {
    const startIndex = html.indexOf("[", markerIndex);
    if (startIndex === -1) return [];
    const json = extractBalanced(html, startIndex);
    const items = json ? JSON.parse(json) : [];

    if (items.some((item) => item?.name && (item?.roadAddress || item?.address))) {
      return items;
    }

    markerIndex = html.indexOf(marker, markerIndex + marker.length);
  }

  return [];
};

const pickBest = (items, restaurant) => {
  const expectedAddress = normalizePlaceName(
    restaurant.kakaoPlace?.address || restaurant.verifiedPlace?.address || "",
  );
  const ranked = items
    .map((item) => {
      const nameScore = placeNameScore(restaurant.name, item.name);
      const candidateAddress = normalizePlaceName(item.roadAddress || item.address || "");
      const addressScore =
        expectedAddress && candidateAddress.includes(expectedAddress.slice(0, 8)) ? 0.35 : 0;
      return { item, score: nameScore + addressScore };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score >= 0.58 ? ranked[0].item : null;
};

const searchPlace = async (restaurant) => {
  const queries = [
    `${restaurant.name} ${restaurant.kakaoPlace?.address || restaurant.verifiedPlace?.address || areaHint(restaurant)}`,
    `${restaurant.name} ${areaHint(restaurant)}`,
    `${restaurant.name} ${areaHint(restaurant)}역`,
    restaurant.name,
  ];

  for (const query of queries) {
    const url = `https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(query)}&sm=hty&style=v5`;
    const html = await fetchText(url);
    const items = extractItems(html);
    const item = pickBest(items, restaurant);
    if (item) return { query, item };
    await sleep(requestDelayMs);
  }

  return { query: queries[0], item: null };
};

const decodeUrl = (value) =>
  value
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");

const collectNaverImages = (html) => {
  const candidates = new Set();
  const decoded = decodeUrl(html);
  const imagePattern =
    /https?:\/\/(?:ldb-phinf|search\.pstatic|pup-review-phinf|naverbooking-phinf)\.pstatic\.net[^"'\\<>\s)]+/g;

  for (const match of decoded.matchAll(imagePattern)) {
    const url = match[0]
      .replace(/\\n/g, "")
      .replace(/,$/, "")
      .replace(/\)+$/, "");

    if (/default|profile|blank|logo|sprite|icon/i.test(url)) continue;
    if (url.includes("type=f") || url.includes("type=m") || url.includes("type=a")) continue;
    candidates.add(url);
  }

  return [...candidates].slice(0, 3);
};

const findRatingCandidate = (html) => {
  const decoded = decodeUrl(html);
  const patterns = [
    /"visitorReviewScore"\s*:\s*"?([0-5](?:\.\d)?)"?/i,
    /"rating"\s*:\s*"?([0-5](?:\.\d)?)"?/i,
    /"score"\s*:\s*"?([0-5](?:\.\d)?)"?/i,
    /평점\s*([0-5](?:\.\d)?)/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) return Number(match[1]);
  }

  return null;
};

const fetchPlacePage = async (placeId) => {
  if (!placeId) return { images: [], rating: null };

  const urls = [
    `https://m.place.naver.com/place/${placeId}/home`,
    `https://pcmap.place.naver.com/place/${placeId}/home`,
  ];

  let images = [];
  let rating = null;

  for (const url of urls) {
    const html = await fetchText(url);
    images = images.length ? images : collectNaverImages(html);
    rating = rating ?? findRatingCandidate(html);
    if (images.length && rating) break;
    await sleep(requestDelayMs);
  }

  return { images, rating };
};

const fetchPlace = async (restaurant) => {
  const { query, item } = await searchPlace(restaurant);
  const pageData = await fetchPlacePage(item?.id);

  return {
    query,
    source: "NAVER Map/Place 비공식 공개 화면 스냅샷",
    matched: Boolean(item),
    requestedName: restaurant.name,
    name: item?.name ?? null,
    category: item?.category ?? null,
    address: item?.roadAddress || item?.address || null,
    lotAddress: item?.address ?? null,
    latitude: item?.latitude ?? null,
    longitude: item?.longitude ?? null,
    naverPlaceId: item?.id ?? null,
    naverMapLink: item?.id ? `https://map.naver.com/p/entry/place/${item.id}` : null,
    tel: item?.tel ?? null,
    rating: pageData.rating,
    images: pageData.images,
    checkedAt,
  };
};

const results = [];

for (const restaurant of restaurants) {
  try {
    const result = await fetchPlace(restaurant);
    results.push(result);
    console.log(
      [
        result.matched ? "OK" : "NO",
        restaurant.name,
        result.name ?? "-",
        result.rating ?? "no-rating",
        `${result.images.length} images`,
        result.address ?? "-",
      ].join("\t"),
    );
  } catch (error) {
    results.push({
      matched: false,
      requestedName: restaurant.name,
      error: error.message,
      checkedAt,
    });
    console.log(["ERR", restaurant.name, error.message].join("\t"));
  }

  await sleep(requestDelayMs);
}

fs.writeFileSync(
  new URL("../data/naver-place-results.json", import.meta.url),
  `${JSON.stringify(results, null, 2)}\n`,
);
