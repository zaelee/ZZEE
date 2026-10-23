const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SVG_DIR = path.join(ROOT, 'svg');
const PNG_DIR = path.join(ROOT, 'png');
const QA_DIR = path.join(ROOT, 'qa');

const C = {
  ink: '#171716',
  ivory: '#FFF7E8',
  bone: '#F3E5CC',
  orange: '#FF8738',
  orangePressed: '#E96A2B',
  sage: '#A8C99A',
  mint: '#C9E7B7',
  blue: '#86C9F0',
  coral: '#FF625B',
  green: '#73C94C',
  gray: '#D6D5D0',
  grayDark: '#777873',
};

const esc = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (w, h, title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">\n` +
  `  <title>${esc(title)}</title>\n${body}\n</svg>\n`;

const asset = (id, category, w, h, purpose, body, nineSlice = null) => ({
  id,
  category,
  width: w,
  height: h,
  purpose,
  nineSlice,
  content: svg(w, h, purpose, body),
});

const buttonBody = (fill, y = 12, bottom = 116, stroke = C.ink) => `  <path d="M40 ${y} C24 ${y + 1} 13 ${y + 13} 14 ${y + 31} L15 ${bottom - 27} C16 ${bottom - 11} 28 ${bottom - 2} 46 ${bottom - 2} L437 ${bottom - 3} C455 ${bottom - 3} 467 ${bottom - 14} 466 ${bottom - 31} L465 ${y + 29} C464 ${y + 12} 452 ${y + 3} 434 ${y + 3} Z" fill="${fill}" stroke="${stroke}" stroke-width="10" stroke-linejoin="round"/>`;

const gearPoints = (cx, cy, teeth, outer, inner) => {
  const pts = [];
  for (let i = 0; i < teeth * 2; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / teeth;
    const radius = i % 2 === 0 ? outer : inner;
    pts.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
  }
  return pts.join(' ');
};

const assets = [
  asset('button-orange-normal', 'button', 480, 128, 'Primary button background, normal state', buttonBody(C.orange), { left: 44, top: 32, right: 44, bottom: 32 }),
  asset('button-orange-pressed', 'button', 480, 128, 'Primary button background, pressed state', `${buttonBody(C.orangePressed, 19, 120)}\n  <path d="M44 30 C144 24 337 25 432 30" stroke="#FFAD6E" stroke-width="7" stroke-linecap="round" opacity="0.7"/>`, { left: 44, top: 34, right: 44, bottom: 28 }),
  asset('button-disabled-gray', 'button', 480, 128, 'Disabled button background', buttonBody(C.gray), { left: 44, top: 32, right: 44, bottom: 32 }),
  asset('button-ivory-secondary', 'button', 480, 128, 'Secondary ivory button background', buttonBody(C.ivory), { left: 44, top: 32, right: 44, bottom: 32 }),
  asset('button-blue-secondary', 'button', 480, 128, 'Secondary blue button background', buttonBody(C.blue), { left: 44, top: 32, right: 44, bottom: 32 }),

  asset('panel-large', 'panel', 720, 500, 'Large empty content panel', `  <path d="M55 19 C34 20 20 36 21 60 L24 441 C24 466 42 482 68 481 L654 478 C683 478 699 461 698 435 L696 62 C696 35 678 20 650 21 Z" fill="${C.ivory}" stroke="${C.ink}" stroke-width="12" stroke-linejoin="round"/>\n  <path d="M59 43 C203 37 503 38 648 43" stroke="${C.bone}" stroke-width="8" stroke-linecap="round"/>`, { left: 58, top: 52, right: 58, bottom: 52 }),
  asset('panel-compact-pill', 'panel', 420, 112, 'Compact empty pill panel', `  <path d="M57 12 C27 12 13 30 14 56 C14 84 31 100 61 100 L359 99 C390 99 407 83 406 55 C405 28 389 13 359 13 Z" fill="${C.ivory}" stroke="${C.ink}" stroke-width="10" stroke-linejoin="round"/>`, { left: 58, top: 31, right: 58, bottom: 31 }),
  asset('panel-speech-bubble', 'panel', 600, 300, 'Empty speech bubble panel', `  <path d="M57 18 C34 19 20 34 20 56 L21 210 C21 234 38 249 62 249 L142 248 L119 283 C115 290 124 294 132 288 L190 248 L541 247 C565 247 581 230 580 207 L578 57 C578 33 562 18 538 19 Z" fill="${C.ivory}" stroke="${C.ink}" stroke-width="11" stroke-linejoin="round"/>`, { left: 56, top: 50, right: 56, bottom: 66 }),

  asset('frame-card-normal', 'frame', 320, 400, 'Empty portrait or card frame, normal state', `  <path d="M38 14 C23 15 14 26 14 43 L16 355 C16 374 28 386 48 386 L275 384 C294 384 306 372 305 352 L304 44 C304 25 292 15 272 16 Z" fill="${C.ivory}" stroke="${C.ink}" stroke-width="10" stroke-linejoin="round"/>\n  <path d="M40 42 C102 36 220 37 279 42" stroke="${C.orange}" stroke-width="8" stroke-linecap="round"/>`, { left: 42, top: 46, right: 42, bottom: 44 }),
  asset('frame-card-selected', 'frame', 320, 400, 'Empty portrait or card frame, selected state', `  <path d="M37 14 C22 15 13 26 14 44 L16 355 C16 375 29 387 49 386 L274 384 C294 384 307 371 306 351 L304 43 C304 25 292 15 272 16 Z" fill="${C.mint}" stroke="${C.ink}" stroke-width="10" stroke-linejoin="round"/>\n  <path d="M36 37 C96 29 229 31 283 38 L282 360 C220 367 94 367 39 360 Z" stroke="${C.sage}" stroke-width="9" stroke-linejoin="round"/>`, { left: 45, top: 48, right: 45, bottom: 48 }),

  asset('health-track', 'health', 480, 64, 'Empty health bar track', `  <path d="M30 9 C19 9 12 17 12 29 L12 36 C12 49 21 56 34 55 L447 55 C460 55 468 47 468 34 L467 28 C467 17 458 10 446 10 Z" fill="${C.gray}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>`, { left: 29, top: 22, right: 29, bottom: 22 }),
  asset('health-fill-green', 'health', 420, 32, 'Healthy-state fill strip', `  <path d="M17 5 C10 5 6 9 6 16 C6 24 11 27 18 27 L402 27 C410 27 414 23 414 16 C414 9 409 5 401 5 Z" fill="${C.green}"/>`),
  asset('health-fill-orange', 'health', 420, 32, 'Warning-state fill strip', `  <path d="M17 5 C10 5 6 9 6 16 C6 24 11 27 18 27 L402 27 C410 27 414 23 414 16 C414 9 409 5 401 5 Z" fill="${C.orange}"/>`),
  asset('health-fill-coral', 'health', 420, 32, 'Danger-state fill strip', `  <path d="M17 5 C10 5 6 9 6 16 C6 24 11 27 18 27 L402 27 C410 27 414 23 414 16 C414 9 409 5 401 5 Z" fill="${C.coral}"/>`),

  asset('slider-rail', 'control', 440, 48, 'Slider rail', `  <path d="M23 13 C16 13 11 18 11 24 C11 32 17 36 25 35 L416 35 C424 35 429 31 429 24 C429 17 423 13 415 13 Z" fill="${C.bone}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`, { left: 24, top: 14, right: 24, bottom: 14 }),
  asset('control-knob-round', 'control', 96, 96, 'Shared circular knob for sliders and toggles', `  <path d="M49 8 C26 7 10 22 9 46 C8 70 23 87 47 88 C71 89 87 73 88 49 C89 26 73 9 49 8 Z" fill="${C.ivory}" stroke="${C.ink}" stroke-width="9"/>\n  <path d="M33 30 C39 25 48 23 56 26" stroke="white" stroke-width="7" stroke-linecap="round" opacity="0.85"/>`),
  asset('toggle-rail-on', 'control', 240, 112, 'Toggle rail, on state; pair with separate round knob', `  <path d="M58 13 C30 13 14 31 14 56 C14 82 31 99 60 99 L181 98 C210 98 226 82 226 56 C226 30 209 14 180 14 Z" fill="${C.sage}" stroke="${C.ink}" stroke-width="10" stroke-linejoin="round"/>`, { left: 57, top: 34, right: 57, bottom: 34 }),
  asset('toggle-rail-off', 'control', 240, 112, 'Toggle rail, off state; pair with separate round knob', `  <path d="M58 13 C30 13 14 31 14 56 C14 82 31 99 60 99 L181 98 C210 98 226 82 226 56 C226 30 209 14 180 14 Z" fill="${C.gray}" stroke="${C.ink}" stroke-width="10" stroke-linejoin="round"/>`, { left: 57, top: 34, right: 57, bottom: 34 }),
  asset('badge-round-empty', 'badge', 176, 176, 'Empty round badge background', `  <path d="M89 11 C44 9 13 39 12 85 C11 132 41 164 87 165 C134 166 165 135 165 88 C166 43 135 12 89 11 Z" fill="${C.ivory}" stroke="${C.ink}" stroke-width="10"/>\n  <circle cx="88" cy="88" r="61" stroke="${C.orange}" stroke-width="7"/>`, { left: 48, top: 48, right: 48, bottom: 48 }),
  asset('selection-ring', 'selection', 240, 240, 'Selection highlight ring for a character or object', `  <path d="M121 14 C59 12 17 53 15 116 C13 180 55 225 118 226 C182 227 225 184 226 121 C227 58 184 16 121 14 Z" stroke="${C.ink}" stroke-width="15"/>\n  <path d="M121 27 C66 25 29 62 28 117 C27 173 63 212 119 213 C175 214 212 177 213 121 C214 66 176 29 121 27 Z" stroke="${C.mint}" stroke-width="12"/>`),

  asset('icon-play', 'icon', 128, 128, 'Play action icon', `  <path d="M42 25 C37 22 32 26 32 32 L33 96 C33 103 39 106 44 102 L99 68 C105 64 105 59 99 55 Z" fill="${C.ink}"/>`),
  asset('icon-pause', 'icon', 128, 128, 'Pause action icon', `  <path d="M31 24 C27 24 25 27 25 31 L25 97 C25 101 28 104 32 104 L48 104 C52 104 55 101 55 97 L55 31 C55 27 52 24 48 24 Z" fill="${C.ink}"/>\n  <path d="M80 24 C76 24 73 27 73 31 L73 97 C73 101 76 104 80 104 L96 104 C100 104 103 101 103 97 L103 31 C103 27 100 24 96 24 Z" fill="${C.ink}"/>`),
  asset('icon-fast-forward', 'icon', 128, 128, 'Fast-forward action icon', `  <path d="M16 29 C13 27 10 29 10 34 L11 94 C11 99 15 101 19 98 L59 68 C63 65 63 61 59 58 Z" fill="${C.ink}"/>\n  <path d="M62 29 C58 27 55 29 55 34 L56 94 C56 99 60 101 64 98 L104 68 C108 65 108 61 104 58 Z" fill="${C.ink}"/>\n  <rect x="105" y="28" width="13" height="72" rx="6" fill="${C.ink}"/>`),
  asset('icon-settings', 'icon', 128, 128, 'Settings icon', `  <defs><mask id="settings-hole" maskUnits="userSpaceOnUse"><rect width="128" height="128" fill="white"/><circle cx="64" cy="64" r="17" fill="black"/></mask></defs>\n  <polygon points="${gearPoints(64, 64, 10, 52, 39)}" fill="${C.ink}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round" mask="url(#settings-hole)"/>`),
  asset('icon-back', 'icon', 128, 128, 'Back navigation icon', `  <path d="M58 25 L20 61 C16 65 16 69 20 73 L58 105 C62 109 69 106 69 100 L69 80 C86 79 98 86 108 99 C111 103 117 101 116 95 C114 64 99 49 69 48 L69 30 C69 24 62 21 58 25 Z" fill="${C.ink}"/>`),
  asset('icon-close', 'icon', 128, 128, 'Close or dismiss icon', `  <path d="M29 21 C25 18 20 19 17 23 C14 27 15 32 19 36 L48 64 L20 93 C16 97 16 102 20 106 C24 110 29 109 33 105 L64 75 L95 105 C99 109 104 109 108 105 C112 101 111 96 107 92 L76 63 L105 34 C109 30 109 25 105 21 C101 17 96 18 92 22 L64 52 Z" fill="${C.ink}"/>`),
  asset('icon-heart', 'icon', 128, 128, 'Health or favorite icon', `  <path d="M64 108 C57 100 27 81 18 62 C8 42 20 22 39 21 C51 20 60 27 65 36 C71 26 79 20 91 21 C111 22 121 42 111 62 C102 80 75 100 64 108 Z" fill="${C.coral}" stroke="${C.ink}" stroke-width="8" stroke-linejoin="round"/>`),
  asset('icon-screw-parts', 'icon', 128, 128, 'Parts currency icon represented by a screw', `  <defs><mask id="screw-cuts" maskUnits="userSpaceOnUse"><rect width="128" height="128" fill="white"/><path d="M45 29 L83 29" stroke="black" stroke-width="7" stroke-linecap="round"/><path d="M50 61 L78 61 M50 75 L77 75 M51 89 L76 89" stroke="black" stroke-width="5" stroke-linecap="round"/></mask></defs>\n  <g transform="rotate(-31 64 64)" mask="url(#screw-cuts)">\n    <path d="M46 19 L82 19 C88 19 92 23 92 29 L92 40 C92 46 88 50 82 50 L46 50 C40 50 36 46 36 40 L36 29 C36 23 40 19 46 19 Z" fill="${C.ink}"/>\n    <path d="M48 48 L80 48 L76 97 C75 105 70 110 64 110 C57 110 52 105 51 97 Z" fill="${C.ink}"/>\n  </g>`),
  asset('icon-target', 'icon', 128, 128, 'Targeting icon', `  <circle cx="64" cy="64" r="46" stroke="${C.ink}" stroke-width="9"/>\n  <circle cx="64" cy="64" r="25" stroke="${C.ink}" stroke-width="9"/>\n  <circle cx="64" cy="64" r="7" fill="${C.ink}"/>\n  <path d="M64 7 L64 25 M64 103 L64 121 M7 64 L25 64 M103 64 L121 64" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`),
  asset('icon-sell-trash', 'icon', 128, 128, 'Sell or discard icon', `  <defs><mask id="trash-cuts" maskUnits="userSpaceOnUse"><rect width="128" height="128" fill="white"/><path d="M60 54 L61 97 M84 54 L82 97" stroke="black" stroke-width="6" stroke-linecap="round"/></mask></defs>\n  <g mask="url(#trash-cuts)">\n    <path d="M36 40 L42 104 C43 112 49 117 57 117 L87 117 C95 117 101 111 102 103 L108 40 Z" fill="${C.ink}"/>\n    <path d="M27 29 C27 24 31 21 36 21 L52 21 L57 14 C59 11 62 10 66 10 L80 10 C84 10 87 12 89 15 L93 21 L109 21 C114 21 117 24 117 29 C117 34 114 37 109 37 L36 37 C31 37 27 34 27 29 Z" fill="${C.ink}"/>\n  </g>`),
  asset('icon-lock', 'icon', 128, 128, 'Locked state icon', `  <defs><mask id="lock-keyhole" maskUnits="userSpaceOnUse"><rect width="128" height="128" fill="white"/><circle cx="64" cy="78" r="9" fill="black"/><path d="M64 84 L64 101" stroke="black" stroke-width="7" stroke-linecap="round"/></mask></defs>\n  <path d="M34 54 L34 44 C34 25 46 12 64 12 C82 12 94 25 94 44 L94 54" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/>\n  <path d="M27 49 C21 49 18 53 18 59 L19 108 C19 114 23 118 29 118 L99 118 C105 118 109 114 109 108 L110 60 C110 53 106 49 99 49 Z" fill="${C.ink}" mask="url(#lock-keyhole)"/>`),
  asset('icon-ping', 'icon', 128, 128, 'Ping or alert marker icon', `  <circle cx="64" cy="65" r="9" fill="${C.ink}"/>\n  <path d="M46 47 C36 57 36 73 46 83 M82 47 C92 57 92 73 82 83" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>\n  <path d="M33 34 C16 51 16 79 33 96 M95 34 C112 51 112 79 95 96" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>\n  <path d="M64 74 L51 115 L77 115 Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>`),
  asset('icon-check', 'icon', 128, 128, 'Confirm or selected icon', `  <path d="M17 67 C13 63 13 57 17 53 C21 49 27 49 31 53 L52 74 L96 28 C100 24 106 24 110 28 C114 32 114 38 110 42 L59 96 C55 100 49 101 44 96 Z" fill="${C.ink}"/>`),
  asset('icon-paw', 'icon', 128, 128, 'Paw category icon', `  <ellipse cx="34" cy="43" rx="15" ry="21" transform="rotate(-22 34 43)" fill="${C.ink}"/>\n  <ellipse cx="61" cy="31" rx="15" ry="22" transform="rotate(-4 61 31)" fill="${C.ink}"/>\n  <ellipse cx="91" cy="42" rx="15" ry="21" transform="rotate(20 91 42)" fill="${C.ink}"/>\n  <path d="M64 54 C45 53 27 73 29 92 C31 109 48 112 63 103 C78 113 96 108 99 92 C102 73 83 55 64 54 Z" fill="${C.ink}"/>`),
];

if (assets.length !== 34) throw new Error(`Expected 34 assets, got ${assets.length}`);
if (new Set(assets.map((item) => item.id)).size !== assets.length) throw new Error('Asset IDs must be unique');

const manifest = {
  schemaVersion: 1,
  kit: 'Pupsters Production UI Starter Kit',
  generatedAssetCount: assets.length,
  pairedFileCount: assets.length * 2,
  transparentCanvas: true,
  visualRules: {
    outline: 'near-black, rounded, slightly irregular',
    fills: 'flat colors only; no gradients or grunge',
    content: 'surfaces contain no text, dog portraits, or baked icons',
  },
  palette: C,
  assets: assets.map(({ id, category, width, height, purpose, nineSlice }) => ({
    id,
    category,
    files: { svg: `svg/${id}.svg`, png: `png/${id}.png` },
    dimensions: { width, height },
    purpose,
    nineSlice,
  })),
};

const labels = {
  locale: 'ko-KR',
  strings: {
    start: '시작',
    formation: '편성',
    select: '선택',
    locked: '잠금',
    defenders: '수비대',
    wave: '웨이브',
    inProgress: '진행 중',
    upgrade: '강화',
    sell: '판매',
    continue: '계속하기',
    hideout: '아지트',
    ready: '준비',
    pause: '일시정지',
    settings: '설정',
    back: '뒤로',
    close: '닫기',
  },
};

async function renderContactSheet() {
  const cellW = 250;
  const cellH = 210;
  const cols = 5;
  const rows = Math.ceil(assets.length / cols);
  const width = cellW * cols;
  const height = cellH * rows;
  const composites = [];

  for (let i = 0; i < assets.length; i += 1) {
    const item = assets[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const maxW = 200;
    const maxH = 150;
    const scale = Math.min(maxW / item.width, maxH / item.height, 1);
    const w = Math.max(1, Math.round(item.width * scale));
    const h = Math.max(1, Math.round(item.height * scale));
    const rendered = await sharp(Buffer.from(item.content)).resize(w, h).png().toBuffer();
    composites.push({ input: rendered, left: col * cellW + Math.round((cellW - w) / 2), top: row * cellH + 12 + Math.round((maxH - h) / 2) });
    const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellW}" height="44"><text x="125" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#333">${esc(item.id)}</text><text x="125" y="36" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#777">${item.width} x ${item.height}</text></svg>`;
    composites.push({ input: Buffer.from(labelSvg), left: col * cellW, top: row * cellH + 163 });
  }

  await sharp({
    create: { width, height, channels: 4, background: { r: 238, g: 238, b: 235, alpha: 1 } },
  }).composite(composites).png().toFile(path.join(QA_DIR, 'ui-contact-sheet.png'));
}

async function main() {
  fs.mkdirSync(SVG_DIR, { recursive: true });
  fs.mkdirSync(PNG_DIR, { recursive: true });
  fs.mkdirSync(QA_DIR, { recursive: true });

  for (const item of assets) {
    const svgPath = path.join(SVG_DIR, `${item.id}.svg`);
    const pngPath = path.join(PNG_DIR, `${item.id}.png`);
    fs.writeFileSync(svgPath, item.content, 'utf8');
    await sharp(Buffer.from(item.content)).png().toFile(pngPath);
    const metadata = await sharp(pngPath).metadata();
    if (metadata.width !== item.width || metadata.height !== item.height || !metadata.hasAlpha) {
      throw new Error(`PNG verification failed for ${item.id}`);
    }
  }

  fs.writeFileSync(path.join(ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(ROOT, 'labels.ko.json'), `${JSON.stringify(labels, null, 2)}\n`, 'utf8');
  await renderContactSheet();
  console.log(`Generated and verified ${assets.length} SVG + ${assets.length} transparent PNG assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
