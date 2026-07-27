import fs from "node:fs";
import vm from "node:vm";

import { coordinates, isDateString } from "./lib/place-data-utils.mjs";

const dataPath = new URL("../js/data.js", import.meta.url);
const source = fs.readFileSync(dataPath, "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__rawRestaurants = rawRestaurants;
globalThis.__kakaoPlaceData = kakaoPlaceData;
globalThis.__naverPlaceData = naverPlaceData;
globalThis.__googlePlaceData = googlePlaceData;
globalThis.__seongsuRestaurantNames = seongsuRestaurantNames;
globalThis.__verifiedPlaceData = verifiedPlaceData;
globalThis.__boryeongRestaurantNames = boryeongRestaurantNames;
globalThis.__boryeongPlaceSources = boryeongPlaceSources;
globalThis.__boryeongEditorialData = boryeongEditorialData;
globalThis.__restaurants = RESTAURANTS;`,
  context,
);

const errors = [];
const warnings = [];
const rawNames = context.__rawRestaurants.map(([name]) => name);
const boryeongRestaurants = context.__restaurants.filter((restaurant) =>
  context.__boryeongRestaurantNames.has(restaurant.name),
);
const aliases = JSON.parse(
  fs.readFileSync(new URL("../data/place-aliases.json", import.meta.url), "utf8"),
);
const duplicateNames = rawNames.filter((name, index) => rawNames.indexOf(name) !== index);
if (duplicateNames.length) errors.push(`rawRestaurants 중복: ${[...new Set(duplicateNames)].join(", ")}`);
for (const [name, values] of Object.entries(aliases)) {
  if (!rawNames.includes(name)) errors.push(`place-aliases.${name}: rawRestaurants에 없는 항목`);
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !value.trim())) {
    errors.push(`place-aliases.${name}: 별칭 배열 형식 오류`);
  }
}

for (const name of context.__boryeongRestaurantNames) {
  const place = context.__verifiedPlaceData[name];
  const source = context.__boryeongPlaceSources[name];
  const editorial = context.__boryeongEditorialData[name];
  const restaurant = context.__restaurants.find((item) => item.name === name);
  if (!place) {
    errors.push(`보령.${name}: 장소 데이터 없음`);
    continue;
  }
  if (!`${place.address ?? ""}`.includes("보령시")) errors.push(`보령.${name}: 보령 주소 아님`);
  if (!coordinates(place)) errors.push(`보령.${name}: 좌표 없음 또는 범위 오류`);
  if (!source?.sourceUrl?.startsWith("https://")) errors.push(`보령.${name}: 출처 URL 없음`);
  if (!source?.providerPlaceId) errors.push(`보령.${name}: 출처 장소 ID 없음`);
  if (!isDateString(source?.checkedAt)) errors.push(`보령.${name}: checkedAt 형식 오류`);
  if (!editorial?.menuItems?.length || editorial.menuItems.some((item) => !item.name)) {
    errors.push(`보령.${name}: 공개 메뉴 정보 없음`);
  }
  if (!restaurant?.comment || restaurant.comment.includes("검증 전")) {
    errors.push(`보령.${name}: 한줄 소개 미보강`);
  }
  if (!restaurant?.images?.some((url) => /^https:\/\//.test(url))) {
    errors.push(`보령.${name}: 외부 대표 사진 없음`);
  }
  if (!Number.isFinite(restaurant?.platformRatings?.naver?.rating)) {
    errors.push(`보령.${name}: 네이버 업체 평균 별점 없음`);
  }
  if (restaurant?.platformRatings?.naver?.rating != null) {
    const naverRecord = context.__naverPlaceData[name];
    if (naverRecord?.ratingSourceField !== "placeDetail.base.visitorReviewsScore") {
      errors.push(`보령.${name}: 네이버 업체 평균 출처 필드 오류`);
    }
  }
}

const validateRating = (rating, label) => {
  if (rating === null || rating === undefined) return;
  if (!Number.isFinite(Number(rating)) || Number(rating) <= 0 || Number(rating) > 5) {
    errors.push(`${label}: 평점 범위 오류 (${rating})`);
  }
};

const validateProviderMap = (provider, records) => {
  for (const [name, record] of Object.entries(records)) {
    if (!rawNames.includes(name)) warnings.push(`${provider}.${name}: rawRestaurants에 없는 항목`);
    validateRating(record.rating, `${provider}.${name}`);
    if (!isDateString(record.checkedAt)) errors.push(`${provider}.${name}: checkedAt 형식 오류`);
    if (!coordinates(record)) errors.push(`${provider}.${name}: 좌표 없음 또는 범위 오류`);
    const address = `${record.address ?? ""} ${record.lotAddress ?? ""}`;
    const allowedDistricts = context.__boryeongRestaurantNames.has(name)
      ? ["보령시"]
      : context.__seongsuRestaurantNames.has(name)
        ? ["성동구"]
        : ["광진구", "성동구"];
    if (!allowedDistricts.some((district) => address.includes(district))) {
      errors.push(`${provider}.${name}: 기대 지역 밖 주소 (${record.address ?? "주소 없음"})`);
    }
  }
};

validateProviderMap("kakao", context.__kakaoPlaceData);
validateProviderMap("naver", context.__naverPlaceData);

for (const [name, record] of Object.entries(context.__googlePlaceData)) {
  if (!rawNames.includes(name)) warnings.push(`google.${name}: rawRestaurants에 없는 항목`);
  validateRating(record.rating, `google.${name}`);
  if (!isDateString(record.checkedAt)) errors.push(`google.${name}: checkedAt 형식 오류`);
}

const snapshotFiles = [
  ["kakao", new URL("../data/kakao-place-results.json", import.meta.url)],
  ["naver", new URL("../data/naver-place-results.json", import.meta.url)],
  ["boryeong-kakao", new URL("../data/boryeong-kakao-place-results.json", import.meta.url)],
  ["boryeong-naver", new URL("../data/boryeong-naver-place-results.json", import.meta.url)],
  ["boryeong-naver-rating", new URL("../data/boryeong-naver-rating-results.json", import.meta.url)],
  ["boryeong-rendered", new URL("../data/boryeong-rendered-rating-results.json", import.meta.url)],
  ["boryeong-rendered-probe", new URL("../data/boryeong-rendered-rating-probe.json", import.meta.url)],
  ["rendered", new URL("../data/rendered-rating-results.json", import.meta.url)],
];
const snapshots = {};

for (const [provider, file] of snapshotFiles) {
  const records = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(records)) {
    errors.push(`${provider}: 스냅샷이 배열이 아님`);
    continue;
  }

  const names = records.map((record) => record.requestedName ?? record.name).filter(Boolean);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length) errors.push(`${provider}: 중복 결과 ${[...new Set(duplicates)].join(", ")}`);

  for (const record of records) {
    const name = record.requestedName ?? record.name;
    if (name && !rawNames.includes(name)) warnings.push(`${provider}.${name}: rawRestaurants에 없는 결과`);
    if (record.checkedAt && !isDateString(record.checkedAt)) {
      errors.push(`${provider}.${name}: checkedAt 형식 오류`);
    }
    validateRating(record.rating, `${provider}.${name}`);
    if (record.matched && provider !== "rendered" && !coordinates(record)) {
      errors.push(`${provider}.${record.requestedName}: 매칭 결과 좌표 없음 또는 범위 오류`);
    }
    if (provider.includes("rendered")) {
      for (const platform of ["naver", "google"]) {
        const platformData = record[platform];
        if (!platformData) continue;
        validateRating(platformData.rating, `${provider}.${name}.${platform}`);
        if (platformData.rating != null && !isDateString(platformData.checkedAt)) {
          errors.push(`${provider}.${name}.${platform}: 평점 확인일 형식 오류`);
        }
      }
    }
  }

  snapshots[provider] = records.length;
}

console.log(
  JSON.stringify(
    {
      restaurants: rawNames.length,
      embedded: {
        kakao: Object.keys(context.__kakaoPlaceData).length,
        naver: Object.keys(context.__naverPlaceData).length,
        google: Object.keys(context.__googlePlaceData).length,
      },
      boryeong: {
        restaurants: boryeongRestaurants.length,
        kakaoRated: boryeongRestaurants.filter(
          (restaurant) => restaurant.platformRatings.kakao.rating != null,
        ).length,
        naverRated: boryeongRestaurants.filter(
          (restaurant) => restaurant.platformRatings.naver.rating != null,
        ).length,
        googleRated: boryeongRestaurants.filter(
          (restaurant) => restaurant.platformRatings.google.rating != null,
        ).length,
        withMenus: boryeongRestaurants.filter(
          (restaurant) => restaurant.menuItems?.length >= 2,
        ).length,
        withExternalImages: boryeongRestaurants.filter(
          (restaurant) => restaurant.images?.some((url) => /^https:\/\//.test(url)),
        ).length,
      },
      snapshots,
      warnings,
      errors,
    },
    null,
    2,
  ),
);

if (errors.length) process.exitCode = 1;
