const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.resolve(root,'../pupsters-attack-motion-v1');
for(const dir of ['frames','effects'])fs.cpSync(path.join(source,dir),path.join(root,dir),{recursive:true});
fs.mkdirSync(path.join(root,'previews'),{recursive:true});
fs.copyFileSync(path.join(source,'preview.css'),path.join(root,'preview.css'));
const oldHTML=fs.readFileSync(path.join(source,'index.html'),'utf8');
const effects=JSON.parse(oldHTML.match(/const effectsData=(\[.*?\]);<\/script>/s)[1]);
const manifest=JSON.parse(fs.readFileSync(path.join(source,'animation-manifest.json'),'utf8'));
const configs=[
 {origin:[.815,.790],mode:'projectile',durationMs:500,travel:210,size:25,angle:.40,description:'앞발이 펴지는 순간 구슬이 출발하고, 발을 내려도 구슬은 계속 날아갑니다.'},
 {origin:[.703,.718],mode:'puff',durationMs:480,travel:190,size:104,angle:.48,description:'입이 열리면서 공기탄이 커지고, 볼이 돌아와도 공기탄은 앞으로 이어집니다.'},
 {origin:[.665,.780],mode:'breath',durationMs:480,travel:180,size:210,angle:.38,description:'입에 붙은 냉기가 짧게 시작해 길어지고, 입을 닫으면 남은 냉기가 앞으로 퍼지며 사라집니다.'},
 {origin:[.674,.705],mode:'bubble',durationMs:500,travel:205,size:43,angle:.44,description:'입술 앞에서 거품이 부풀다가 떨어져 나가며 강아지는 반동에서 회복합니다.'},
 {origin:[.760,.570],mode:'static',durationMs:400,travel:135,size:170,angle:.30,description:'털이 서는 순간 정전기가 바깥으로 뻗고 짧은 잔광을 남깁니다.'},
 {origin:[.668,.692],mode:'bark',durationMs:460,travel:155,size:105,angle:.42,description:'입이 열리는 순간 파동이 시작되고 고개가 돌아오는 동안 바깥으로 퍼집니다.'}
];
manifest.version=2;manifest.title='사고멍치 — 동작과 효과 연결';
manifest.renderCanvas={width:640,height:480};
manifest.generation='Existing native Canvas animation extended with synchronized effect tracks; original image files unchanged.';
manifest.effects=effects;
manifest.characters.forEach((d,i)=>{
 const release=d.events[0].timeMs;
 d.effectTrack={...configs[i],startMs:release,emissionEndMs:d.events[1].timeMs,endMs:release+configs[i].durationMs,file:d.events[0].effectFile};
 d.previewGif=`previews/${d.id}-${d.slug}-connected.gif`;
 d.previewWebp=`previews/${d.id}-${d.slug}-connected.webp`;
});
fs.writeFileSync(path.join(root,'animation-manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(root,'data.js'),'const motionData='+JSON.stringify(manifest)+';\n');
const cards=manifest.characters.map((d,i)=>`<article><div class="card-head"><span class="number">0${i+1}</span><div><h2>${d.name}</h2><p>${d.action}</p></div><span class="phase" id="phase-${d.id}">불러오는 중</span></div><canvas id="canvas-${d.id}" width="640" height="480" aria-label="${d.name} 동작과 효과 연결 애니메이션"></canvas><p class="action-note">${d.effectTrack.description}</p><div class="card-foot"><span>${(d.loopDurationMs/1000).toFixed(2)}초 · 동작 + 효과</span><a href="${d.previewGif}" download>연결 GIF</a><a href="${d.previewWebp}" download>연결 WebP</a></div></article>`).join('');
fs.appendFileSync(path.join(root,'preview.css'),'\n.action-note{font-size:13px;line-height:1.7;color:#626b55;padding:0 20px;min-height:44px}canvas{background:#edf0e7}.scrub{width:min(440px,90vw)}.time{font-variant-numeric:tabular-nums;font-size:12px;color:#626b55}');
fs.writeFileSync(path.join(root,'index.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>사고멍치 · 연결된 공격</title><link rel="stylesheet" href="preview.css"></head><body><header><p class="kicker">PUPSTERS / CONNECTED ATTACK 02</p><h1>공격 동작과 효과를<br>한 번에.</h1><p class="intro">앞발이 펴지고, 입이 열리고, 털이 서는 순간 능력이 시작돼요.<br>강아지가 자세를 되돌리는 동안에도 효과는 이어집니다.</p><div class="controls"><button id="play">다시 재생</button><button id="pause">일시정지</button><label><input type="checkbox" id="loop" checked>반복</label><label><input type="checkbox" id="effects" checked>효과 표시</label></div><div class="controls"><label for="scrub">느리게 살펴보기</label><input class="scrub" id="scrub" type="range" min="0" max="1360" step="10" value="0"><output class="time" id="time">0.00초</output></div><p class="hint">연결된 GIF·WebP와 분리된 원본 PNG를 함께 제공합니다.</p></header><main>${cards}</main><footer>투명 배경 640 × 480 · 우하향 한 방향 · <a href="animation-manifest.json">프레임과 효과 시간표</a> · <a href="README.md">사용 안내</a></footer><script src="data.js"></script><script src="preview.js"></script></body></html>`);
console.log('Viewer and original asset copies ready.');
