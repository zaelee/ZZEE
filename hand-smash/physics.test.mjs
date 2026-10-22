import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverPoint, segmentDistance, isClosed } from './physics.js';
test('mirrored camera maps center and accounts for cover cropping', () => {
  assert.deepEqual(coverPoint({ x: .5, y: .5 }, 1280, 720, 800, 600), { x: 400, y: 300 });
  assert.ok(coverPoint({ x: 0, y: .5 }, 1280, 720, 800, 600).x > 800);
  assert.deepEqual(coverPoint({ x: 0, y: 0 }, 640, 480, 640, 480), { x: 640, y: 0 });
});
test('fast swipe intersects target between frames; stationary point remains finite', () => {
  assert.equal(segmentDistance({ x: 50, y: 10 }, { x: 0, y: 0 }, { x: 100, y: 0 }), 10);
  assert.equal(segmentDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 }), 5);
  assert.equal(segmentDistance({ x: 110, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }), 10);
});
test('fist detection distinguishes curled and extended fingers', () => {
  const hand = Array.from({ length: 21 }, () => ({ x: 0, y: 1 }));
  hand[0] = { x: 0, y: 0 };
  for (const i of [8, 12, 16, 20]) hand[i] = { x: 0, y: 2 };
  assert.equal(isClosed(hand), false);
  for (const i of [8, 12, 16, 20]) hand[i] = { x: 0, y: .5 };
  assert.equal(isClosed(hand), true);
});
