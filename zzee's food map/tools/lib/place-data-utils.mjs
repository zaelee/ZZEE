const KOREA_TIME_ZONE = "Asia/Seoul";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const finiteCoordinate = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
};

export const dateInKorea = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: KOREA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const isDateString = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

export const latestCheckedAt = (records, fallback = dateInKorea()) => {
  const dates = records.map((record) => record?.checkedAt).filter(isDateString).sort();
  return dates.at(-1) ?? fallback;
};

export const normalizePlaceName = (value = "") =>
  String(value)
    .replace(/&amp;/g, "&")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();

export const placeNameScore = (requestedName, matchedName) => {
  const requested = normalizePlaceName(requestedName);
  const matched = normalizePlaceName(matchedName);
  if (!requested || !matched) return 0;
  if (requested === matched) return 1;
  if (requested.includes(matched) || matched.includes(requested)) {
    const lengthRatio = Math.min(requested.length, matched.length) / Math.max(requested.length, matched.length);
    const looksLikeBranchSuffix =
      Math.min(requested.length, matched.length) >= 2 &&
      (requested.startsWith(matched) || matched.startsWith(requested));
    return looksLikeBranchSuffix ? Math.max(0.7, lengthRatio) : lengthRatio;
  }
  return 0;
};

export const coordinates = (value) => {
  const latitude = finiteCoordinate(value?.latitude, -90, 90);
  const longitude = finiteCoordinate(value?.longitude, -180, 180);
  return latitude === null || longitude === null ? null : { latitude, longitude };
};

export const distanceKm = (from, to) => {
  const a = coordinates(from);
  const b = coordinates(to);
  if (!a || !b) return null;

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLatitude = radians(b.latitude - a.latitude);
  const dLongitude = radians(b.longitude - a.longitude);
  const startLatitude = radians(a.latitude);
  const endLatitude = radians(b.latitude);
  const haversine =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(dLongitude / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(Math.min(1, haversine)));
};

export const assessPlaceMatch = ({
  requestedName,
  matchedName,
  address = "",
  lotAddress = "",
  latitude = null,
  longitude = null,
  reference = null,
  aliases = [],
  allowedDistricts = [],
  maximumDistanceKm = 2.2,
}) => {
  const nameScore = Math.max(
    placeNameScore(requestedName, matchedName),
    ...aliases.map((alias) => placeNameScore(alias, matchedName)),
  );
  const candidate = { latitude, longitude };
  const distance = distanceKm(reference, candidate);
  const fullAddress = `${address} ${lotAddress}`;
  const districtAccepted =
    allowedDistricts.length === 0 || allowedDistricts.some((district) => fullAddress.includes(district));
  const coordinateAccepted = Boolean(coordinates(candidate));
  const distanceAccepted = distance !== null && distance <= maximumDistanceKm;
  const nameAccepted = nameScore >= 0.58;
  const accepted =
    nameAccepted &&
    coordinateAccepted &&
    districtAccepted &&
    (reference ? distanceAccepted : true);
  const reasons = [];

  if (!nameAccepted) reasons.push("상호명 불일치");
  if (!coordinateAccepted) reasons.push("후보 좌표 없음");
  if (!districtAccepted) reasons.push("허용 지역 밖 주소");
  if (reference && distance === null) reasons.push("기준 좌표와 거리 계산 불가");
  if (reference && distance !== null && !distanceAccepted) {
    reasons.push(`기준 위치에서 ${distance.toFixed(2)}km`);
  }

  return {
    accepted,
    requiresReview: !accepted,
    nameScore,
    distanceKm: distance,
    reasons,
  };
};

export const requireProviderTermsAcknowledgement = (provider) => {
  if (process.argv.includes("--acknowledge-provider-terms")) return;
  throw new Error(
    `${provider} 라이브 수집은 비공식 화면/엔드포인트를 사용합니다. 최신 약관과 허용 범위를 직접 확인한 뒤 --acknowledge-provider-terms를 명시하세요.`,
  );
};
