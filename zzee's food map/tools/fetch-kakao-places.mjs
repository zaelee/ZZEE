import fs from "node:fs";
import vm from "node:vm";

import { dateInKorea, requireProviderTermsAcknowledgement } from "./lib/place-data-utils.mjs";

requireProviderTermsAcknowledgement("Kakao Map");

const dataPath = new URL("../js/data.js", import.meta.url);
const outputPath = new URL("../data/kakao-place-results.json", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");

const context = {};
vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__rawRestaurants = rawRestaurants;
globalThis.__verifiedPlaceData = verifiedPlaceData;`,
  context,
);

const restaurants = context.__rawRestaurants.map(([name, category, , , signatureMenu]) => ({
  name,
  category,
  signatureMenu,
  verifiedPlace: context.__verifiedPlaceData[name] ?? null,
}));

const checkedAt = dateInKorea();
const requestDelayMs = Math.max(700, Number(process.env.PLACE_FETCH_DELAY_MS) || 1000);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value = "") => value.replace(/\s+/g, "").toLowerCase();
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

const headers = {
  accept: "application/json, text/plain, */*",
  appVersion: "6.6.0",
  origin: "https://place.map.kakao.com",
  pf: "PC",
  referer: "https://place.map.kakao.com/",
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

const fetchJson = async (url) => {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
};

const searchPlaces = async (restaurant) => {
  const address = restaurant.verifiedPlace?.address ?? "";
  const queries = [
    `${restaurant.name} ${address}`.trim(),
    `${restaurant.verifiedPlace?.matchedName ?? restaurant.name} ${address}`.trim(),
    `${areaHint(restaurant)} ${restaurant.name}`,
    `${areaHint(restaurant)}역 ${restaurant.name}`,
    restaurant.name,
  ];

  for (const query of [...new Set(queries.filter(Boolean))]) {
    const url = `https://search.map.kakao.com/mapsearch/map.daum?q=${encodeURIComponent(query)}&output=json`;
    const data = await fetchJson(url);
    const places = data.place ?? [];
    if (places.length) {
      return { query, places };
    }
    await sleep(requestDelayMs);
  }

  return { query: queries[0], places: [] };
};

const scorePlace = (place, restaurant) => {
  const targetName = normalize(restaurant.name);
  const matchedName = normalize(restaurant.verifiedPlace?.matchedName ?? "");
  const placeName = normalize(place.name);
  const placeAddress = `${place.new_address ?? ""} ${place.address ?? ""}`;
  const verifiedAddress = restaurant.verifiedPlace?.address ?? "";
  let score = 0;

  if (placeName === targetName) score += 80;
  if (matchedName && placeName === matchedName) score += 85;
  if (placeName.includes(targetName) || targetName.includes(placeName)) score += 30;
  if (matchedName && (placeName.includes(matchedName) || matchedName.includes(placeName))) score += 35;
  if (place.cate_name_depth1 === "음식점") score += 20;
  if (place.cate_name_depth2 === restaurant.category) score += 8;
  if (placeAddress.includes("서울")) score += 5;
  if (seongsuRestaurantNames.has(restaurant.name)) {
    if (placeAddress.includes("성동구")) score += 24;
    if (placeAddress.includes("성수")) score += 10;
  } else if (placeAddress.includes("광진구") || placeAddress.includes("성동구")) {
    score += 12;
  }

  if (verifiedAddress) {
    const roadToken = verifiedAddress.match(/[가-힣0-9]+로[0-9]*길?\s?\d+[-\d]*/)?.[0];
    if (roadToken && placeAddress.replace(/\s+/g, "").includes(roadToken.replace(/\s+/g, ""))) {
      score += 35;
    }
  }

  return score;
};

const pickBestPlace = (places, restaurant) => {
  const best = places
    .map((place) => ({ place, score: scorePlace(place, restaurant) }))
    .sort((a, b) => b.score - a.score)[0] ?? null;
  return best?.score >= 70 ? best : null;
};

const panelUrl = (confirmId) => `https://place-api.map.kakao.com/places/panel3/${confirmId}`;

const formatAddress = (summary, fallback) =>
  summary?.address?.road || summary?.address?.disp || fallback?.new_address || fallback?.address || null;

const extractMenuItems = (panel, signatureMenu) => {
  const items = panel?.menu?.menus?.items ?? [];
  const mapped = items
    .filter((item) => typeof item?.name === "string" && item.name.trim() && item.name !== "undefined")
    .map((item) => ({
      name: item.name,
      price: typeof item.price === "number" && item.price > 0 ? item.price : null,
      desc: item.desc ?? null,
      isRecommended: Boolean(item.is_recommend),
      sourceUpdatedAt: item.mod_at ?? null,
    }));

  if (mapped.length) {
    return mapped.slice(0, 3);
  }

  return [{ name: signatureMenu, price: null }];
};

const priceRangeFromMenu = (menuItems, priceSymbol) => {
  const prices = menuItems.map((item) => item.price).filter((price) => typeof price === "number");
  if (!prices.length) return priceSymbol || null;
  const min = Math.min(...prices).toLocaleString("ko-KR");
  const max = Math.max(...prices).toLocaleString("ko-KR");
  return min === max ? `${min}원` : `${min}-${max}원`;
};

const results = [];

for (const restaurant of restaurants) {
  try {
    const { query, places } = await searchPlaces(restaurant);
    const best = pickBestPlace(places, restaurant);

    if (!best?.place) {
      results.push({
        requestedName: restaurant.name,
        matched: false,
        query,
        checkedAt,
      });
      console.log(["NO", restaurant.name, query].join("\t"));
      continue;
    }

    const place = best.place;
    const panel = await fetchJson(panelUrl(place.confirmid));
    const summary = panel.summary ?? {};
    const scoreSet = panel.kakaomap_review?.score_set ?? {};
    const menuItems = extractMenuItems(panel, restaurant.signatureMenu);
    const priceSymbol = panel.ai_mate?.price_level?.symbol ?? null;
    const images = [
      summary?.road_view?.url,
      summary?.main_photo_url,
      panel.my_store_notice?.main_photo_url,
      panel.photos?.photos?.[0]?.url,
      place.img,
    ].filter(Boolean);

    const result = {
      requestedName: restaurant.name,
      source: "Kakao Map 비공식 공개 엔드포인트 스냅샷",
      matched: true,
      query,
      score: best.score,
      kakaoPlaceId: String(place.confirmid),
      matchedName: summary.name ?? place.name,
      category: summary.category?.name ?? place.last_cate_name ?? null,
      address: formatAddress(summary, place),
      lotAddress: summary.address?.jibun ?? place.address ?? null,
      latitude: summary.point?.lat ?? place.lat ?? null,
      longitude: summary.point?.lon ?? place.lon ?? null,
      kakaoMapLink: `https://place.map.kakao.com/${place.confirmid}`,
      rating: scoreSet.average_score || place.rating_average || null,
      ratingCount: scoreSet.review_count || place.rating_count || null,
      reviewCount: place.reviewCount ?? null,
      menuItems,
      menuUpdatedAt: panel.menu?.menus?.items_updated_at ?? null,
      priceRange: priceRangeFromMenu(menuItems, priceSymbol),
      priceSymbol,
      images: [...new Set(images)].slice(0, 3),
      checkedAt,
    };

    results.push(result);
    console.log(
      [
        "OK",
        restaurant.name,
        result.matchedName,
        result.rating ?? "-",
        result.ratingCount ?? "-",
        result.address ?? "-",
        result.menuItems.map((item) => `${item.name}:${item.price ?? "-"}`).join(", "),
      ].join("\t"),
    );
  } catch (error) {
    results.push({
      requestedName: restaurant.name,
      matched: false,
      error: error.message,
      checkedAt,
    });
    console.log(["ERR", restaurant.name, error.message].join("\t"));
  }

  await sleep(requestDelayMs);
}

fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);
