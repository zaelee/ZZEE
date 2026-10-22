# Pinch Patrol

Buildless Canvas shooter with camera pinch-to-fire, open-palm Nova, 1–4 local players, relative multi-touch steering, pickups, and escalating boss waves. Native ES modules; no install or build step.

## Play
- Camera: pinch thumb/index to fire; spread all five fingers for ~0.2 s to cast Nova. Relax the hand before casting again. Each player has a 16 s cooldown.
- Touch: choose player count, hold and drag on the field; touch contacts claim P1–P4 in order. Use each player's ✦ button for Nova.
- Keyboard: P1 arrows/Space/E; P2 WASD/left Shift/Q; P3 IJKL/U/O; P4 TFGH/R/Y (move/fire/skill). P or Escape pauses.
- HTTPS or localhost is required for camera access. Video stays in the browser. MediaPipe Tasks Vision 0.10.32 and its hand model load from CDN on camera start; initial loading requires internet. Front/rear selection mirrors only the front view.

## Hard-mode balance
Wave 1 has 32 enemies with at least 3 HP, first fire after 0.9 s, and 190-speed bullets every 0.70 s. Additional shooters, spread shots, armor and group dives ramp with waves. Every third wave is a boss; the first has 560 HP per player. Armor keeps growing beyond the late waves and firing intervals approach a bounded minimum smoothly. After 8 seconds in a wave, attack and dive frequency gradually rises by up to 50% over 40 seconds, and newly emitted hostile bullets gain up to 10% speed. The HUD shows this pressure; it pauses with the simulation and resets on the next wave. Beam warnings are not shortened by pressure.

Nova clears enemy bullets/beams, grants 0.8 s protection and deals 1–3 enemy damage / 15–27 boss damage based on weapon level. It cannot wipe a healthy opening wave. Weapons retain upgrades through damage and wave changes.

## Checks
Run `node --test pinch-patrol/tests/*.test.mjs` from the repository root, or `npm run check` for the whole site. Tests cover gestures, independent 4P controls, pickups, difficulty, boss phases, Nova debounce/cooldowns, camera transforms and portrait resize. Chromium touch emulation and synthetic landmark checks were run; physical-hand calibration and real iOS/Android devices still need playtesting.
