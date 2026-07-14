import assert from "node:assert/strict";
import test from "node:test";

import {
  assessPlaceMatch,
  dateInKorea,
  distanceKm,
  isDateString,
  normalizePlaceName,
  placeNameScore,
} from "../lib/place-data-utils.mjs";

test("KST 날짜는 날짜 경계에서도 올바르게 계산된다", () => {
  assert.equal(dateInKorea(new Date("2026-07-14T15:30:00Z")), "2026-07-15");
  assert.equal(isDateString("2026-07-15"), true);
  assert.equal(isDateString("2026-02-30"), false);
});

test("상호명은 공백과 기호 차이를 무시한다", () => {
  assert.equal(normalizePlaceName("텅 성수 스페이스"), "텅성수스페이스");
  assert.equal(placeNameScore("정면", "정면 건대점") > 0.58, true);
  assert.equal(placeNameScore("정면", "정담"), 0);
});

test("좌표가 없으면 거리를 0으로 오인하지 않는다", () => {
  assert.equal(distanceKm({}, { latitude: 37.5, longitude: 127 }), null);
});

test("이름, 지역, 거리, 좌표를 모두 만족한 후보만 자동 승인한다", () => {
  const reference = { latitude: 37.544, longitude: 127.07 };
  const accepted = assessPlaceMatch({
    requestedName: "해남닭집",
    matchedName: "해남닭집",
    address: "서울 광진구 능동로13길 46",
    latitude: 37.54401,
    longitude: 127.06998,
    reference,
    allowedDistricts: ["광진구", "성동구"],
  });
  const rejected = assessPlaceMatch({
    requestedName: "해남닭집",
    matchedName: "해남닭집",
    address: "부산 해운대구",
    latitude: 35.16,
    longitude: 129.16,
    reference,
    allowedDistricts: ["광진구", "성동구"],
  });

  assert.equal(accepted.accepted, true);
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reasons.includes("허용 지역 밖 주소"), true);
});

test("검토 완료한 별칭은 위치 조건과 함께 승인할 수 있다", () => {
  const result = assessPlaceMatch({
    requestedName: "마오",
    matchedName: "안홍마오",
    aliases: ["안홍마오"],
    address: "서울 성동구 뚝섬로4길 21",
    latitude: 37.53887,
    longitude: 127.05078,
    reference: { latitude: 37.5389, longitude: 127.0508 },
    allowedDistricts: ["성동구"],
  });

  assert.equal(result.accepted, true);
});
