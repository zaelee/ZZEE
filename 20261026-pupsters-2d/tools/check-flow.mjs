// Browser-free event/markup integration check. This does not verify rendering.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const events = {}, windowEvents = {}, frames = new Map(), nodes = new Map();
let nextFrame = 1, checks = 0;
const node = selector => {
  if (!nodes.has(selector)) nodes.set(selector, {
    innerHTML: '', textContent: '', style: {}, dataset: {}, attributes: {},
    focus() {}, showModal() { this.open = true; },
    classList: { add() {}, contains() { return false; }, toggle() {} },
    addEventListener(type, callback) { this[type] = callback; },
    getAttribute(key) { return this.attributes[key]; },
    setAttribute(key, value) { this.attributes[key] = value; }
  });
  return nodes.get(selector);
};
const document = {
  body: { dataset: {} },
  querySelector: node,
  querySelectorAll() { return []; },
  addEventListener(type, fn) { events[type] = fn; }
};
const window = { addEventListener(type, fn) { windowEvents[type] = fn; }, scrollTo() {} };
const location = { hash: '' };
const context = vm.createContext({ window, document, location, console,
  requestAnimationFrame(fn) { const id = nextFrame++; frames.set(id, fn); return id; },
  cancelAnimationFrame(id) { frames.delete(id); }
});
vm.runInContext(read('data.js'), context, { filename: 'data.js' });
vm.runInContext(read('app.js'), context, { filename: 'app.js' });
const markup = () => node('#app').innerHTML;
const click = (selector, dataset = {}) => {
  const attribute = selector.startsWith('[') ? selector.slice(1, -1) : null;
  if (attribute) assert.ok((markup()+read('index.html')).includes(attribute), `Rendered control missing: ${selector}`);
  const target = { dataset, closest(query) { return query === selector ? this : null; } };
  const previous = location.hash;
  events.click({ target, preventDefault() {} });
  if (previous !== location.hash) windowEvents.hashchange();
};
const route = route => click('[data-route]', { route });
const check = (condition, label) => { assert.ok(condition, label); checks++; };
const coins = () => Number(markup().match(/id="coin-count">(\d+)/)?.[1]);
const tick = time => {
  const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(time));
};

for (const name of ['home','squad','stages','battle','coop','boss','victory','defeat','codex','kit']) {
  route(name);
  check(document.body.dataset.route === name, `Route ${name}`);
  check(!markup().includes('undefined'), `No undefined markup in ${name}`);
  for (const match of markup().matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)) {
    assert.ok(fs.existsSync(path.join(root, match[1])), `${name}: missing ${match[1]}`);
  }
}
route('squad');
click('[data-select-dog]', {selectDog:'D05'});
click('[data-toggle-squad]', {toggleSquad:'D05'});
route('battle');
check(markup().includes('data-select-battle-dog="D05"'), 'Squad choice reaches battle');
check(!markup().includes('data-select-battle-dog="D03"'), 'Fourth selection replaces final squad slot');
check(/data-upgrade disabled/.test(markup()), 'No upgrade before placement');
click('[data-upgrade]');
check(coins() === 600, 'Unplaced upgrade cannot spend coins');
click('[data-slot]', {slot:'0'});
check(coins() === 490, 'Poodle placement costs110');
check(markup().includes('무들 · Lv.1'), 'Placed sprite and level shown');
click('[data-select-battle-dog]', {selectBattleDog:'D02'});
click('[data-slot]', {slot:'0'});
check(coins() === 490 && markup().includes('무들 · Lv.1'), 'Occupied slot selects existing dog without replacing');
click('[data-upgrade]');
check(coins() === 430 && markup().includes('무들 · Lv.2'), 'Upgrade spends60 and persists level');
click('[data-upgrade]'); click('[data-upgrade]');
check(coins() === 370 && markup().includes('최고 단계 · Lv.3'), 'Upgrade cap prevents further spend');
click('[data-pause]');
check(markup().includes('is-running') && frames.size === 1, 'Start schedules one animation');
tick(100); tick(150);
check(Number.parseFloat(node('#moving-enemy').style.left) > 7, 'Enemy advances along path');
click('[data-speed]');
check(markup().includes('×2') && frames.size === 1, 'Speed switch retains one frame loop');
click('[data-pause]');
check(!markup().includes('is-running') && frames.size === 0, 'Pause stops motion class and loop');
click('[data-pause]'); route('home'); route('battle');
check(frames.size === 0 && !markup().includes('is-running'), 'Navigation returns paused');
click('[data-reset-battle]');
check(coins() === 600 && !markup().includes('Lv.1</span>') && frames.size === 0, 'Reset restores fresh placement demo');
click('[data-pause]');
for(let time=100;time<=40000;time+=50) tick(time);
check(coins() >= 680 && /<b>2\/8<\/b>/.test(markup()), 'Wave completion restores placement budget');
route('codex'); click('[data-filter]', {filter:'boss'});
check((markup().match(/class="enemy-card/g)||[]).length === 1, 'Boss filter');
click('[data-filter]', {filter:'normal'});
check((markup().match(/class="enemy-card/g)||[]).length === 8, 'Normal enemy filter');
node('#open-settings').click();
check(node('#settings-modal').open, 'Settings open handler');
node('#volume').input({target:{value:42}});
check(node('#volume-output').textContent === '42%', 'Volume label updates');
const result = {status:'passed', checks, method:'Node VM event handlers and generated markup; no browser, layout, or real click verification', routes:10};
fs.writeFileSync(path.join(root,'docs/flow-check.json'), JSON.stringify(result,null,2));
console.log(`PASS: ${checks} browser-free flow assertions; 10 views and local image/download references.`);
