import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const context = {
  console,
  window: {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
};

vm.createContext(context);

for (const file of ["js/data.js", "js/naver-shared-restaurants.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, {
    filename: file,
  });
}

const summary = vm.runInContext(
  `(() => {
    const combined = [...RESTAURANTS, ...NAVER_SHARED_RESTAURANTS];
    const validCoordinates = combined.filter((restaurant) =>
      Number.isFinite(Number(restaurant.latitude)) && Number.isFinite(Number(restaurant.longitude))
    );
    const platformRatingValues = combined.flatMap((restaurant) =>
      Object.entries(restaurant.platformRatings || {}).map(([platform, data]) => ({
        name: restaurant.name,
        platform,
        rating: data.rating,
        reviewCount: data.reviewCount,
      }))
    );
    const invalidPlatformRatings = platformRatingValues.filter(
      (item) => item.rating !== null && item.rating !== undefined && (!Number.isFinite(item.rating) || item.rating <= 0 || item.rating > 5)
    );
    const categories = [...new Set(combined.map((restaurant) => restaurant.category))].sort();
    const areas = [...new Set(combined.map((restaurant) => restaurant.area))].sort();
    const expectedBoryeongNames = [
      "피자파티",
      "오는정 손만두",
      "제일해물칼국수",
      "성지 보령본점",
      "조양 칼국수",
      "김가네사골수제비",
      "키츠네야",
      "고구려 수제 본 갈비",
      "조개까는남자",
      "윤가네 해물탕",
      "찬찬찬 해장국",
      "대포식당",
      "바이더오",
      "플라르",
      "카페모카브레드",
      "커피인터뷰대천",
      "바다듬루프탑카페",
    ];
    const boryeongSearchMatches = combined.filter((restaurant) =>
      [
        restaurant.name,
        restaurant.area,
        restaurant.category,
        restaurant.comment,
        restaurant.signatureMenu,
        restaurant.jaeComment,
        restaurant.address,
      ]
        .join(" ")
        .toLowerCase()
        .includes("보령")
    );
    const missingBoryeongNames = expectedBoryeongNames.filter(
      (name) => !boryeongSearchMatches.some((restaurant) => restaurant.name === name)
    );
    const boryeongRatings = expectedBoryeongNames.map((name) => {
      const restaurant = combined.find((item) => item.name === name);
      const ratings = ["kakao", "naver", "google"]
        .map((platform) => restaurant?.platformRatings?.[platform]?.rating)
        .filter((rating) => Number.isFinite(rating) && rating > 0 && rating <= 5);
      const average = ratings.length
        ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
        : null;
      return {
        name,
        source: restaurant?.ratingSource,
        platformCount: ratings.length,
        average,
        highRating: average > 4.5,
      };
    });
    return {
      base: RESTAURANTS.length,
      shared: NAVER_SHARED_RESTAURANTS.length,
      total: combined.length,
      validCoordinates: validCoordinates.length,
      invalidPlatformRatings,
      categories,
      areas,
      boryeongSearchMatches: boryeongSearchMatches.length,
      missingBoryeongNames,
      boryeongRatings,
    };
  })()`,
  context
);

console.log(JSON.stringify(summary, null, 2));

if (summary.total === 0) throw new Error("No restaurants loaded");
if (summary.validCoordinates < summary.total * 0.9) throw new Error("Too many restaurants are missing coordinates");
if (summary.invalidPlatformRatings.length) throw new Error("Platform rating field contains non-rating values");
if (summary.missingBoryeongNames.length) {
  throw new Error(`보령 검색 누락: ${summary.missingBoryeongNames.join(", ")}`);
}
if (
  summary.boryeongRatings.some(
    (restaurant) =>
      restaurant.source !== "platformAverage" ||
      restaurant.platformCount < 1 ||
      !Number.isFinite(restaurant.average),
  )
) {
  throw new Error("보령 평균별점 계산 입력 또는 출처 표시 오류");
}
