export function coverPoint(point, videoWidth, videoHeight, width, height, mirrored=true) {
  const scale = Math.max(width / videoWidth, height / videoHeight);
  return { x: (mirrored ? 1 - point.x : point.x) * videoWidth * scale - (videoWidth * scale - width) / 2,
    y: point.y * videoHeight * scale - (videoHeight * scale - height) / 2 };
}
export function segmentDistance(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
export function isClosed(hand) {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  return [8, 12, 16, 20].filter(tip => distance(hand[tip], hand[0]) < distance(hand[tip - 2], hand[0]) * 1.12).length >= 3;
}
