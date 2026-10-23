const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
(async()=>{
 const file='effects/FX01-bone.png',{data,info}=await sharp(path.join(root,file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
 const frames=[['00-idle.png','idle',460],['01-prepare.png','prepare',220],['02-release.png','release',120],['03-recover.png','recover',200],['03-recover.png','recover',300],['00-idle.png','settle',180]].map(([f,phase,durationMs])=>({file:'animations/shiba-bone/'+f,phase,durationMs}));
 for(const f of frames)assert(fs.existsSync(path.join(root,f.file)),'Missing '+f.file);
 const dog={id:'D01',name:'시바견',slug:'shiba',action:'입에 문 작은 뼈다귀 뱉기',canvas:{width:1254,height:1254},direction:'down-right',loopDurationMs:1480,frames,events:[{name:'ability_start',timeMs:680,effectFile:file,origin:'mouth'},{name:'ability_end',timeMs:800}],effectTrack:{origin:[.680,.758],mode:'bone',startMs:680,emissionEndMs:800,endMs:1280,durationMs:600,travel:205,size:68,angle:.40,orientation:-.28,spin:2.7,file},previewGif:'previews/D01-shiba-bone-spit.gif',previewWebp:'previews/D01-shiba-bone-spit.webp'};
 const manifest={version:4,date:'2026-10-23',title:'시바 — 작은 뼈다귀 뱉기',renderCanvas:{width:640,height:480},generation:'built-in image_gen keyframes and bone sprite; Canvas animation export',characters:[dog],effects:[{id:'FX01',file,dimensions:{width:info.width,height:info.height},contentBounds:{left,top,right,bottom}}]};
 fs.writeFileSync(path.join(root,'shiba-bone-animation.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(root,'bone-data.js'),'const motionData='+JSON.stringify(manifest)+';\n');
 const old=path.resolve(root,'../pupsters-connected-attack-v2');
 fs.copyFileSync(path.join(old,'preview.css'),path.join(root,'attack.css'));
 let js=fs.readFileSync(path.join(old,'preview.js'),'utf8').replaceAll('1360','1480').replace("idle:'대기',prepare:'준비',release:'발동',recover:'반동',settle:'복귀'","idle:'물고 대기',prepare:'숨 모으기',release:'뱉기',recover:'반동',settle:'다시 물기'");
 js=js.replace(" const asset=motionData.effects.find",` if(e.mode==='bone'){
  const asset=motionData.effects.find(v=>v.file===e.file),b=asset.contentBounds,im=bitmaps.get(e.file),t=s.progress;
  const w=e.size,h=w*(b.bottom-b.top+1)/(b.right-b.left+1),distance=e.travel*t;
  const x=5+420*e.origin[0]+distance*Math.cos(e.angle),y=5+420*e.origin[1]+distance*Math.sin(e.angle)-14*Math.sin(Math.PI*t);
  ctx.save();ctx.translate(x,y);ctx.rotate(e.orientation+e.spin*t);ctx.globalAlpha=1-clamp((t-.85)/.15);
  ctx.drawImage(im,b.left,b.top,b.right-b.left+1,b.bottom-b.top+1,-w/2,-h/2,w,h);ctx.restore();return;
 }
 const asset=motionData.effects.find`);
 fs.writeFileSync(path.join(root,'bone-preview.js'),js);
 fs.writeFileSync(path.join(root,'attack-viewer.html'),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>시바 · 뼈다귀 뱉기</title><link rel="stylesheet" href="attack.css"></head><body><header><p class="kicker">PUPSTERS / SHIBA BONE SPIT</p><h1>입에 물었다가,<br>퉤!</h1><p class="intro">작은 뼈를 물고 숨을 모은 뒤 입으로 뱉어요.<br>앞발은 바닥에 두고, 날아간 뼈는 별도로 움직입니다.</p><div class="controls"><button id="play">다시 재생</button><button id="pause">일시정지</button><label><input type="checkbox" id="loop" checked>반복</label><label><input type="checkbox" id="effects" checked>날아가는 뼈 표시</label></div><div class="controls"><label for="scrub">동작 살펴보기</label><input class="scrub" id="scrub" type="range" min="0" max="1480" step="10" value="0"><output class="time" id="time">0.00초</output></div><p class="hint">물기 → 숨 모으기 → 뱉기 → 반동 → 다시 물기</p></header><main style="grid-template-columns:minmax(0,720px);justify-content:center"><article><div class="card-head"><div><h2>시바견</h2><p>뼈다귀 뱉기</p></div><span class="phase" id="phase-D01">불러오는 중</span></div><canvas id="canvas-D01" width="640" height="480" aria-label="입에 문 작은 뼈다귀를 뱉는 시바견"></canvas><div class="card-foot"><a href="${dog.previewGif}" download>GIF ↓</a><a href="${dog.previewWebp}" download>WebP ↓</a><a href="index.html">6종 공격 방식 보기</a></div></article></main><footer>입에서 뼈가 나가는 시점: 0.68초 · 반복: 1.48초 · <a href="shiba-bone-animation.json">프레임 시간표</a></footer><script src="bone-data.js"></script><script src="bone-preview.js"></script></body></html>`);
 console.log('Shiba mouth-spit timeline ready.');
})().catch(e=>{console.error(e);process.exitCode=1});
