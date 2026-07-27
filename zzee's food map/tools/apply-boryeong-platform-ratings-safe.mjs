import fs from "node:fs";
import vm from "node:vm";

import { latestCheckedAt } from "./lib/place-data-utils.mjs";

const dataPath = new URL("../js/data.js", import.meta.url);
const naverRatingsPath = new URL("../data/boryeong-naver-rating-results.json", import.meta.url);
const googleRatingsPath = new URL("../data/boryeong-rendered-rating-results.json", import.meta.url);
const googleProbePath = new URL("../data/boryeong-rendered-rating-probe.json", import.meta.url);
const shouldWrite = process.argv.includes("--write");

const source = fs.readFileSync(dataPath, "utf8");
const naverResults = JSON.parse(fs.readFileSync(naverRatingsPath, "utf8"));
const googleResults = JSON.parse(fs.readFileSync(googleRatingsPath, "utf8"));
const googleProbeResults = fs.existsSync(googleProbePath)
  ? JSON.parse(fs.readFileSync(googleProbePath, "utf8"))
  : [];
const context = {};

vm.createContext(context);
vm.runInContext(
  `${source}
globalThis.__kakaoPlaceData = kakaoPlaceData;
globalThis.__naverPlaceData = naverPlaceData;
globalThis.__googlePlaceData = googlePlaceData;
globalThis.__boryeongRestaurantNames = boryeongRestaurantNames;`,
  context,
);

const boryeongNames = [...context.__boryeongRestaurantNames];
const validRating = (value) => Number.isFinite(value) && value > 0 && value <= 5;
const round1 = (value) => Math.round(value * 10) / 10;
const average = (values) => {
  const ratings = values.filter(validRating);
  return ratings.length
    ? round1(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
    : null;
};

const naverByName = new Map(naverResults.map((result) => [result.requestedName, result]));
const mergedGoogleResults = new Map(
  [...googleResults, ...googleProbeResults].map((result) => [result.name, result]),
);
const naverSkipped = [];
const googleSkipped = [];
const nextNaverPlaceData = structuredClone(context.__naverPlaceData);
const nextGooglePlaceData = structuredClone(context.__googlePlaceData);

for (const name of boryeongNames) {
  const naver = naverByName.get(name);
  const existingNaver = nextNaverPlaceData[name];
  if (
    !existingNaver ||
    !naver?.ok ||
    !naver.nameAccepted ||
    String(existingNaver.naverPlaceId) !== String(naver.naverPlaceId) ||
    !validRating(naver.rating)
  ) {
    naverSkipped.push(name);
  } else {
    nextNaverPlaceData[name] = {
      ...existingNaver,
      rating: naver.rating,
      reviewCount: naver.reviewCount,
      ratingSourceField: naver.sourceField,
      ratingSourceUrl: naver.sourceUrl,
      ratingCheckedAt: naver.checkedAt,
      checkedAt: naver.checkedAt,
    };
  }

  const rendered = mergedGoogleResults.get(name)?.google;
  if (
    !rendered ||
    !rendered.nameAccepted ||
    !rendered.addressAccepted ||
    !validRating(rendered.rating)
  ) {
    googleSkipped.push(name);
    nextGooglePlaceData[name] = {
      rating: null,
      reviewCount: null,
      googleMapLink:
        rendered?.resolvedUrl ||
        rendered?.url ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " 보령")}`,
      matchedName: null,
      sourceUrl: rendered?.resolvedUrl || rendered?.url || null,
      checkedAt: rendered?.checkedAt || latestCheckedAt(googleResults),
      note: "동일 업체의 공개 구글 평점을 확인하지 못함",
    };
  } else {
    nextGooglePlaceData[name] = {
      rating: rendered.rating,
      reviewCount: rendered.reviewCount,
      googleMapLink: rendered.resolvedUrl || rendered.url,
      matchedName: rendered.title?.replace(/\s*-\s*Google 지도$/, "") || name,
      sourceUrl: rendered.resolvedUrl || rendered.url,
      evidence: rendered.evidence,
      checkedAt: rendered.checkedAt,
      note: "구글 지도 공개 업체 평점",
    };
  }
}

const naverCheckedAt = latestCheckedAt(naverResults);
const googleCheckedAt = latestCheckedAt(
  [...googleResults, ...googleProbeResults].map((result) => ({
    checkedAt: result.google?.checkedAt,
  })),
);
const naverDataBlock = `const naverCheckedAt = "${naverCheckedAt}";
const naverPlaceData = ${JSON.stringify(nextNaverPlaceData, null, 2)};
`;
const googleDataBlock = `const googleCheckedAt = "${googleCheckedAt}";
const googlePlaceData = ${JSON.stringify(nextGooglePlaceData, null, 2)};
`;
const naverDataPattern =
  /const naverCheckedAt = ".*?";\r?\nconst naverPlaceData = [\s\S]*?;\r?\n\r?\nconst googleCheckedAt/;
const googleDataPattern =
  /const googleCheckedAt = ".*?";\r?\nconst googlePlaceData = [\s\S]*?;\r?\n\r?\nconst usefulRestaurantImage/;

if (!naverDataPattern.test(source)) throw new Error("Could not locate naverPlaceData block.");
const withNaver = source.replace(naverDataPattern, `${naverDataBlock}\nconst googleCheckedAt`);
if (!googleDataPattern.test(withNaver)) throw new Error("Could not locate googlePlaceData block.");
const nextSource = withNaver.replace(
  googleDataPattern,
  `${googleDataBlock}\nconst usefulRestaurantImage`,
);

const summaries = boryeongNames.map((name) => {
  const ratings = {
    kakao: context.__kakaoPlaceData[name]?.rating ?? null,
    naver: nextNaverPlaceData[name]?.rating ?? null,
    google: nextGooglePlaceData[name]?.rating ?? null,
  };
  const platformAverage = average(Object.values(ratings));
  return {
    name,
    ...ratings,
    platformAverage,
    highRating: platformAverage > 4.5,
  };
});

if (shouldWrite) fs.writeFileSync(dataPath, nextSource);

console.log(
  JSON.stringify(
    {
      mode: shouldWrite ? "write" : "preview",
      naverCheckedAt,
      googleCheckedAt,
      naverApplied: boryeongNames.length - naverSkipped.length,
      naverSkipped,
      googleApplied: boryeongNames.length - googleSkipped.length,
      googleSkipped,
      highRatingNames: summaries.filter((item) => item.highRating).map((item) => item.name),
      summaries,
      next: shouldWrite ? "js/data.js 갱신 완료" : "검토 후 같은 명령에 --write를 추가하세요.",
    },
    null,
    2,
  ),
);
