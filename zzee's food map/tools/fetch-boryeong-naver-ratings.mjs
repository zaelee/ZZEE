import fs from "node:fs";

import {
  dateInKorea,
  normalizePlaceName,
  requireProviderTermsAcknowledgement,
} from "./lib/place-data-utils.mjs";

requireProviderTermsAcknowledgement("NAVER Place GraphQL");

const inputPath = new URL("../data/boryeong-naver-place-results.json", import.meta.url);
const outputPath = new URL("../data/boryeong-naver-rating-results.json", import.meta.url);
const endpoint = "https://pcmap-api.place.naver.com/graphql";
const places = JSON.parse(fs.readFileSync(inputPath, "utf8")).filter(
  (place) => place.matched && place.naverPlaceId,
);
const checkedAt = dateInKorea();
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchRating = async (place) => {
  const placeId = String(place.naverPlaceId);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/json",
      origin: "https://m.place.naver.com",
      referer: `https://m.place.naver.com/restaurant/${placeId}/home`,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    },
    body: JSON.stringify({
      operationName: "getDetail",
      variables: { id: placeId, deviceType: "mobile" },
      query: `query getDetail($id: String!, $deviceType: String) {
        business: placeDetail(input: { id: $id, isNx: false, deviceType: $deviceType }) {
          base { id name visitorReviewsScore visitorReviewsTotal }
        }
      }`,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: text.slice(0, 300),
    };
  }

  const json = JSON.parse(text);
  const base = json?.data?.business?.base;
  const rating =
    typeof base?.visitorReviewsScore === "number" &&
    base.visitorReviewsScore > 0 &&
    base.visitorReviewsScore <= 5
      ? base.visitorReviewsScore
      : null;
  const reviewCount =
    Number.isInteger(base?.visitorReviewsTotal) && base.visitorReviewsTotal >= 0
      ? base.visitorReviewsTotal
      : null;
  const expectedNames = [place.requestedName, place.name].map(normalizePlaceName);
  const matchedName = normalizePlaceName(base?.name);
  const nameAccepted = Boolean(matchedName) && expectedNames.some(
    (expected) => expected === matchedName || expected.includes(matchedName) || matchedName.includes(expected),
  );

  return {
    ok: Boolean(base) && nameAccepted,
    status: response.status,
    matchedName: base?.name ?? null,
    nameAccepted,
    rating,
    reviewCount,
    error: !base ? "장소 상세 응답 없음" : nameAccepted ? null : "상호명 불일치",
  };
};

const results = [];
for (const [index, place] of places.entries()) {
  let fetched;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    fetched = await fetchRating(place);
    if (fetched.ok || ![405, 429, 500, 502, 503].includes(fetched.status)) break;
    await sleep(900 * attempt);
  }

  const result = {
    requestedName: place.requestedName,
    expectedName: place.name,
    expectedAddress: place.address,
    naverPlaceId: String(place.naverPlaceId),
    naverMapLink: place.naverMapLink,
    sourceUrl: `https://m.place.naver.com/restaurant/${place.naverPlaceId}/home`,
    sourceField: "placeDetail.base.visitorReviewsScore",
    checkedAt,
    ...fetched,
  };
  results.push(result);
  console.log(
    [
      `${index + 1}/${places.length}`,
      result.ok ? "OK" : `SKIP(${result.status ?? "-"})`,
      result.requestedName,
      result.matchedName ?? "-",
      result.rating ?? "-",
      result.reviewCount ?? "-",
    ].join("\t"),
  );
  await sleep(650);
}

fs.writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: outputPath.pathname,
      total: results.length,
      accepted: results.filter((result) => result.ok && result.rating).length,
      noPublishedRating: results.filter((result) => result.ok && !result.rating).length,
      skipped: results.filter((result) => !result.ok).map((result) => result.requestedName),
    },
    null,
    2,
  ),
);
