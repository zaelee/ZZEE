import { handInput } from './game-core.mjs';

// Spatial tracking keeps IDs stable when MediaPipe returns hands in a different order.
// Fully overlapping hands cannot be identified reliably without additional identity cues.
export class HandTracker {
  constructor(count) { this.reset(count); }
  reset(count = this.count) { this.count = count; this.slots = Array(count).fill(null); }
  update(detections, now, width, height, mirrored = true) {
    const candidates = detections.map(points => ({ points, gesture: handInput(points, false, width, height, mirrored) }))
      .filter(c => c.gesture).slice(0, this.count);
    const old = this.slots;
    const active = old.map((slot, i) => slot ? i : -1).filter(i => i >= 0);
    let best = { cost: Infinity, pairs: [] };
    const search = (index, used, pairs, cost) => {
      if (cost >= best.cost) return;
      if (index === active.length) { best = { cost, pairs: [...pairs] }; return; }
      const id = active[index], slot = old[id], elapsed = Math.min((now - slot.lastSeen) / 1000, .25);
      const px = slot.gesture.x + slot.vx * elapsed, py = slot.gesture.y + slot.vy * elapsed;
      for (let j = 0; j < candidates.length; j++) if (!used.has(j)) {
        const distance = Math.hypot(candidates[j].gesture.x - px, candidates[j].gesture.y - py);
        const maxDistance = now - slot.lastSeen > 1800 ? 2000 : 240;
        if (distance < maxDistance) { used.add(j); pairs.push([id, j]); search(index + 1, used, pairs, cost + distance); pairs.pop(); used.delete(j); }
      }
      search(index + 1, used, pairs, cost + 2000);
    };
    search(0, new Set(), [], 0);
    const assigned = new Map(best.pairs), used = new Set(best.pairs.map(([, j]) => j));
    const remaining = candidates.map((c, j) => ({ ...c, j })).filter(c => !used.has(c.j)).sort((a, b) => a.gesture.x - b.gesture.x);
    const free = old.map((slot, i) => !slot ? i : -1).filter(i => i >= 0);
    for (const id of free) { const candidate = remaining.shift(); if (candidate) assigned.set(id, candidate.j); }
    this.slots = old.map((previous, id) => {
      if (!assigned.has(id)) return previous ? { ...previous, visible: false } : null;
      const candidate = candidates[assigned.get(id)];
      const gesture = handInput(candidate.points, previous?.visible && previous.gesture.pinch, width, height, mirrored);
      const dt = previous ? Math.max(.01, (now - previous.lastSeen) / 1000) : 1;
      return { points: candidate.points, gesture, lastSeen: now, visible: true,
        vx: previous?.visible ? (gesture.x - previous.gesture.x) / dt * .5 + previous.vx * .5 : 0,
        vy: previous?.visible ? (gesture.y - previous.gesture.y) / dt * .5 + previous.vy * .5 : 0 };
    });
    return this.slots;
  }
}
