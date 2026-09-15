import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.argv[2] || path.resolve(import.meta.dirname, '..');
const elements = new Map();
class Element {
  constructor(id = '') {
    this.id = id; this.dataset = {}; this.style = { setProperty() {} }; this.children = []; this.listeners = {};
    const classes = new Set(['menu-panel', 'modal-panel', 'settings-panel', 'dialog-box', 'intro-video-panel'].includes(id) ? ['hidden'] : []);
    this.classList = { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, on = !classes.has(x)) { on ? classes.add(x) : classes.delete(x); } };
  }
  set innerHTML(value) { this.children = []; }
  get innerHTML() { return ''; }
  appendChild(x) { this.children.push(x); return x; }
  append(...xs) { xs.forEach(x => this.appendChild(x)); }
  prepend(x) { this.children.unshift(x); }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  setAttribute() {}
  toggleAttribute() {}
  removeAttribute() {}
  querySelectorAll() { return []; }
  querySelector(selector) { return getElement(selector.replace('#', '')); }
  getContext() { return new Proxy({ measureText: text => ({ width: text.length * 8 }) }, { get: (o, k) => o[k] || (() => {}) }); }
  pause() {}
  play() { return Promise.resolve(); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
}
function getElement(id) { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); }
const storage = new Map();
const timers = new Map();
let nextTimer = 1;
const document = { hidden: false, body: new Element(), documentElement: new Element(), getElementById: getElement, createElement: () => new Element(), addEventListener() {} };
const context = vm.createContext({ document, Element, Image: class { constructor() { this.complete = true; this.naturalWidth = 1280; } }, URLSearchParams, performance: { now: () => 0 }, navigator: {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, console, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, setTimeout: fn => { const id = nextTimer++; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id), location: { search: '', protocol: 'http:' }, addEventListener() {} });
context.window = context;
const scripts = [...fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/<script src="([^"?]+)(?:\?[^" ]*)?"/g)].map(m => m[1]);
for (const script of scripts) {
  let source = fs.readFileSync(path.join(root, script), 'utf8');
  if (script === 'game.js') source = source.replace('  window.addEventListener("DOMContentLoaded",', '  window.OSSE.Game = Game;\n  window.addEventListener("DOMContentLoaded",');
  vm.runInContext(source, context, { filename: script });
}
const O = context.OSSE;
const game = new O.Game();
game.dialog.data = JSON.parse(fs.readFileSync(path.join(root, 'dialog.json')));
game.puzzle.data = JSON.parse(fs.readFileSync(path.join(root, 'data/osse_data.json')));
game.quiz.data = JSON.parse(fs.readFileSync(path.join(root, 'quiz.json')));
O.OSSE_DATA = game.puzzle.data;
game.scene.load('company_exterior');
game.mode = 'gameplay';
const clone = value => JSON.parse(JSON.stringify(value));
let checks = 0;
function check(name, fn) { fn(); checks++; console.log(`PASS ${name}`); }

check('Every referenced runtime asset exists', () => {
  for (const script of scripts) {
    for (const m of fs.readFileSync(path.join(root, script), 'utf8').matchAll(/["']((?:assets|png|20260709)\/[^"']+\.(?:png|jpg|webp))["']/g)) assert.ok(fs.existsSync(path.join(root, m[1])), m[1]);
  }
});
check('Scene, dialogue, ending and minigame action references resolve', () => {
  const visit = obj => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.dialogId) assert.ok(game.dialog.data[obj.dialogId], obj.dialogId);
    if (obj.sceneId) assert.ok(O.SCENE_DATA[obj.sceneId], obj.sceneId);
    if (obj.next) assert.ok(game.dialog.data[obj.next], obj.next);
    if (obj.endingId) assert.ok(O.ENDING_DATA[obj.endingId], obj.endingId);
    if (obj.minigameId) assert.ok(O.MINIGAME_DATA[obj.minigameId], obj.minigameId);
    Object.values(obj).forEach(visit);
  };
  visit(O.SCENE_DATA); visit(game.dialog.data);
});
check('Checkpoints restore access cards, USB and tools', () => {
  game.restartFromEndingCheckpoint('first_floor_entrance'); assert.ok(game.inventory.has('security_access_card'));
  game.restartFromEndingCheckpoint('second_floor_entrance');
  for (const id of ['security_access_card', 'second_floor_auth_card', 'crowbar', 'usb_drive']) assert.ok(game.inventory.has(id), id);
});
check('Puzzle answers and every boss answer are valid', () => {
  for (const id of Object.keys(game.puzzle.data.puzzleRules)) assert.match(game.puzzle.calculateCode(id), /^\d{4}$/);
  for (const set of ['boss', 'finalBoss']) for (const template of game.quiz.data[set]) {
    const built = game.quiz.buildQuestion(template); assert.ok(built.answerIndex >= 0); assert.ok(!built.choices.includes('undefined'));
  }
});
check('Save/reload restores dialogue, puzzle and final boss state', () => {
  game.scene.load('ceo_office'); game.startFinalBossIntro(); game.beginFinalQuiz();
  game.dialog.start('final_boss_intro'); game.dialog.lineIndex = 1;
  const puzzleId = Object.keys(game.puzzle.data.puzzleRules)[0];
  game.puzzle.startCodeInput(puzzleId);
  game.save('manual', { silent: true }); const expected = clone(game.finalBoss);
  game.restartNewGame(); assert.equal(game.quiz.activeBossQuiz, null); assert.equal(game.puzzle.active, null);
  assert.ok(game.load('manual', { silent: true }));
  assert.deepEqual(clone(game.finalBoss), expected); assert.equal(game.dialog.active.id, 'final_boss_intro'); assert.equal(game.dialog.lineIndex, 1); assert.ok(game.quiz.activeBossQuiz); assert.equal(game.puzzle.active.puzzleId, puzzleId);
});
check('Invalid saves do not overwrite the current play session', () => {
  const before = JSON.stringify(game.flags); storage.set('OSSEsecpae.save', JSON.stringify({version: 11, sceneId: 'missing'}));
  assert.equal(game.load('manual', { silent: true }), false); assert.equal(JSON.stringify(game.flags), before);
});
check('Continue chooses the newest valid slot and falls back from corrupt data', () => {
  game.resetTransientState(); game.mode = 'gameplay'; game.flags.latest = 'manual'; game.save('manual', { silent: true });
  const manual = JSON.parse(storage.get('OSSEsecpae.save')); manual.savedAt = '2026-09-15T01:00:00Z'; storage.set('OSSEsecpae.save', JSON.stringify(manual));
  const auto = clone(manual); auto.flags.latest = 'auto'; auto.savedAt = '2026-09-14T01:00:00Z'; storage.set('OSSEsecpae.autosave', JSON.stringify(auto));
  assert.ok(game.load('latest', { silent: true })); assert.equal(game.flags.latest, 'manual');
  storage.set('OSSEsecpae.save', '{broken'); assert.ok(game.load('latest', { silent: true })); assert.equal(game.flags.latest, 'auto');
});
check('Menu and hidden tab freeze timed quiz', () => {
  game.resetTransientState(); game.mode = 'gameplay'; game.startSimkongBoss(); game.beginSimkongQuiz();
  const remaining = game.quiz.activeBossQuiz.remaining;
  game.ui.toggleMenu(true); game.update(5); assert.equal(game.quiz.activeBossQuiz.remaining, remaining);
  game.ui.toggleMenu(false); document.hidden = true; game.update(5); assert.equal(game.quiz.activeBossQuiz.remaining, remaining); document.hidden = false;
});
check('Minigame pause, contact invulnerability and touch movement', () => {
  game.minigame.start('simkong_office_work'); const mini = game.minigame;
  mini.togglePause(); assert.equal(mini.isOpen(), true); assert.equal(mini.paused, true); mini.togglePause();
  mini.bullets = [1, 2, 3].map(() => ({x:640,y:590,vx:0,vy:0,life:1,radius:10})); mini.updateBullets(0); assert.equal(mini.player.hp, 2);
  mini.handlePointer({clientX:1000,clientY:550}); mini.updatePlayer(.1); assert.ok(mini.player.x > 640 && mini.player.x < 1000);
});
check('Restart cancels old timers and every transient activity', () => {
  game.scheduleSession(() => {}, 6200); game.restartNewGame();
  assert.equal(timers.size, 0); assert.equal(game.minigame.isOpen(), false); assert.equal(game.dialog.isOpen(), false); assert.equal(game.quiz.activeBossQuiz, null); assert.equal(game.boxkeeperBoss, null);
});
check('Ending reload restores an actionable ending screen', () => {
  game.ending.show('bad_end_red_root_failed'); game.showMainMenu();
  assert.ok(game.load('autosave', { silent: true })); assert.equal(game.mode, 'ending'); assert.equal(game.ending.currentId, 'bad_end_red_root_failed'); assert.equal(game.ui.modal.classList.contains('hidden'), false);
});
check('Debug jumps cannot overwrite real saves', () => {
  const previous = storage.get('OSSEsecpae.autosave'); game.jumpToDevBranch('dev_final_entry'); game.save('autosave', { silent: true }); assert.equal(storage.get('OSSEsecpae.autosave'), previous);
});
check('Hotspot DOM is stable between frames for keyboard activation', () => {
  game.resetTransientState(); game.flags = {}; game.mode = 'gameplay'; game.scene.load('company_exterior');
  game.syncReliableInteractionLayer(); const button = game.reliableInteractionLayer.children[0]; assert.ok(button);
  game.syncReliableInteractionLayer(); assert.equal(game.reliableInteractionLayer.children[0], button); assert.ok(button.listeners.click);
});
check('Main boss route reaches the escape sequence and ending', () => {
  const finishDialogue = () => { for (let i = 0; i < 100 && game.dialog.isOpen(); i++) { if (game.dialog.choicesVisible) throw new Error('Unexpected choice'); game.dialog.advance(); } };
  game.restartNewGame(); game.mode = 'gameplay'; game.scene.load('boxkeeper_boss'); game.onSceneReady('boxkeeper_boss');
  for (const phase of ['inventory', 'packing', 'delivery']) {
    game.resolveBoxkeeperWork(phase); assert.ok(game.minigame.isOpen());
    for (let i = 0; i < 12 && game.minigame.isOpen(); i++) {
      const mini = game.minigame;
      const target = mini.packTargets.find(t => t.type === mini.current.packSteps[mini.packIndex]);
      mini.handlePointer({ clientX: target.x + target.width / 2, clientY: target.y + target.height / 2 });
    }
    assert.equal(game.minigame.isOpen(), false); finishDialogue();
  }
  game.completeBoxkeeperWork('clear'); finishDialogue(); assert.ok(game.flags.boxkeeper_cleared);
  game.scene.load('meeting_room_01'); game.startSimkongBoss(); game.beginSimkongQuiz();
  for (let i = 0; i < 5; i++) { assert.ok(game.quiz.isBossQuizOpen()); game.quiz.answerBossQuiz(game.quiz.activeBossQuiz.answerIndex); }
  finishDialogue(); game.updateSimkongBoss(1.5); finishDialogue(); assert.ok(game.flags.simkong_defeated);
  game.collectSecondFloorCard(); finishDialogue(); assert.ok(game.inventory.has('second_floor_auth_card'));
  game.scene.load('ceo_office'); game.startFinalBossIntro(); game.beginFinalQuiz();
  for (let i = 0; i < 10; i++) { assert.ok(game.quiz.isBossQuizOpen()); game.quiz.answerBossQuiz(game.quiz.activeBossQuiz.answerIndex); }
  finishDialogue(); assert.equal(game.finalBoss.phase, 'battle_phase1');
  game.startFinalQte(); while (game.qte) game.handleQteInput(game.qte.sequence[game.qte.index].replace('SPACE', ' '));
  finishDialogue(); assert.ok(game.flags.final_boss_defeated);
  game.updateFinalCollapse(10); finishDialogue(); game.readFinalReport(); finishDialogue();
  game.startEscapeSequence(); finishDialogue(); game.finishEscape(); finishDialogue();
  assert.ok(game.flags.escape_finished);
});
check('Settings and loading tolerate disabled storage without corrupting state', () => {
  storage.set('OSSEsecpae.settings', JSON.stringify({ se: 99, windowScale: -2, bindings: {up: 'broken'} }));
  const settings = new O.SettingsSystem(); assert.equal(settings.values.se, 1); assert.equal(settings.values.windowScale, 1); assert.ok(Array.isArray(settings.values.bindings.up));
  const original = context.localStorage;
  context.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.doesNotThrow(() => settings.set('crt', false)); assert.equal(game.load('latest', {silent: true}), false);
  context.localStorage = original;
});
console.log(`${checks} regression checks passed.`);
