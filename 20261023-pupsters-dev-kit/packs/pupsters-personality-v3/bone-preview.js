const bitmaps=new Map(),canvases=new Map(),labels={idle:'물고 대기',prepare:'숨 모으기',release:'뱉기',recover:'반동',settle:'다시 물기'};
const showEffects=document.getElementById('effects'),loopToggle=document.getElementById('loop'),scrub=document.getElementById('scrub');
let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=0,previous=performance.now(),ready=false;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const ease=t=>1-(1-clamp(t))**3;
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{bitmaps.set(src,im);resolve()};im.onerror=()=>reject(new Error('이미지를 열 수 없습니다: '+src));im.src=src})}
function phaseAt(dog,time){let left=time;for(const f of dog.frames){if(left<f.durationMs)return {...f,t:left/f.durationMs};left-=f.durationMs}return {...dog.frames.at(-1),t:1}}
function effectState(dog,time){const e=dog.effectTrack,age=time-e.startMs;return {active:age>=0&&time<e.endMs,age,progress:clamp(age/e.durationMs),emitting:time>=e.startMs&&time<e.emissionEndMs}}
function drawEffect(ctx,dog,time){
 const e=dog.effectTrack,s=effectState(dog,time);if(!s.active)return;
 if(e.mode==='bone'){
  const asset=motionData.effects.find(v=>v.file===e.file),b=asset.contentBounds,im=bitmaps.get(e.file),t=s.progress;
  const w=e.size,h=w*(b.bottom-b.top+1)/(b.right-b.left+1),distance=e.travel*t;
  const x=5+420*e.origin[0]+distance*Math.cos(e.angle),y=5+420*e.origin[1]+distance*Math.sin(e.angle)-14*Math.sin(Math.PI*t);
  ctx.save();ctx.translate(x,y);ctx.rotate(e.orientation+e.spin*t);ctx.globalAlpha=1-clamp((t-.85)/.15);
  ctx.drawImage(im,b.left,b.top,b.right-b.left+1,b.bottom-b.top+1,-w/2,-h/2,w,h);ctx.restore();return;
 }
 const asset=motionData.effects.find(v=>v.file===e.file),b=asset.contentBounds,im=bitmaps.get(e.file);
 const sw=b.right-b.left+1,sh=b.bottom-b.top+1;
 const x=5+420*e.origin[0],y=5+420*e.origin[1],t=s.progress;
 let w=e.size,h=w*sh/sw,dx=0,dy=0,alpha=1;
 const fade=1-clamp((t-.72)/.28);
 if(e.mode==='projectile'){dx=e.travel*t;dy=-22*Math.sin(Math.PI*t);alpha=fade;}
 if(e.mode==='bubble'){w=e.size*(.38+.62*ease(s.age/80));h=w*sh/sw;dx=e.travel*clamp((s.age-65)/(e.durationMs-65));dy=-16*Math.sin(Math.PI*t);alpha=fade;}
 if(e.mode==='puff'){w=e.size*(.25+.75*ease(s.age/100));h=w*sh/sw;dx=e.travel*t;alpha=fade;}
 if(e.mode==='breath'){
  const emission=e.emissionEndMs-e.startMs,tail=clamp((s.age-emission)/(e.durationMs-emission));
  w=e.size*(.16+.84*ease(s.age/160));h=w*sh/sw*(.93+.07*Math.sin(s.age/55));
  dx=tail*30;alpha=(.82+.18*Math.sin(s.age/65)**2)*(1-tail);
 }
 if(e.mode==='static'){w=e.size*(.25+.75*ease(s.age/75));h=w*sh/sw;dx=clamp((s.age-140)/260)*28;alpha=fade*(.72+.28*Math.cos(s.age/40)**2);}
 if(e.mode==='bark'){w=e.size*(.35+.65*ease(t));h=w*sh/sw;dx=e.travel*t;alpha=fade;}
 ctx.save();ctx.translate(x,y);ctx.rotate(e.angle);ctx.globalAlpha=alpha;
 // Existing effect artwork follows an independent track. Projectile centres start at the paw/mouth.
 const centered=['projectile','bubble','puff'].includes(e.mode);
 const offsetY=e.mode==='breath'?-.59*h:-h/2;
 ctx.drawImage(im,b.left,b.top,sw,sh,dx-(centered?w/2:4),dy+offsetY,w,h);ctx.restore();
}
function renderDog(dog,time,ctx,withEffects=true){ctx.clearRect(0,0,640,480);const f=phaseAt(dog,time);ctx.drawImage(bitmaps.get(f.file),5,5,420,420);if(withEffects)drawEffect(ctx,dog,time);return f}
function renderAt(time){for(const dog of motionData.characters){const local=loopToggle.checked?time%dog.loopDurationMs:Math.min(time,dog.loopDurationMs);const f=renderDog(dog,local,canvases.get(dog.id),showEffects.checked);document.getElementById('phase-'+dog.id).textContent=labels[f.phase]+(showEffects.checked&&effectState(dog,local).active?' · 효과':'')}document.getElementById('time').textContent=(time/1000).toFixed(2)+'초'}
function updatePause(){document.getElementById('pause').textContent=playing?'일시정지':'계속 재생'}
function tick(now){if(ready){if(playing){elapsed+=Math.min(now-previous,100);if(!loopToggle.checked&&elapsed>=1480){elapsed=1480;playing=false;updatePause()}}renderAt(elapsed);scrub.value=loopToggle.checked?elapsed%1480:elapsed}previous=now;requestAnimationFrame(tick)}
document.getElementById('play').onclick=()=>{elapsed=0;playing=true;updatePause()};
document.getElementById('pause').onclick=()=>{playing=!playing;updatePause()};
showEffects.onchange=()=>{if(ready)renderAt(elapsed)};
loopToggle.onchange=()=>{elapsed=0};
scrub.oninput=()=>{playing=false;loopToggle.checked=false;elapsed=Number(scrub.value);updatePause();if(ready)renderAt(elapsed)};
for(const dog of motionData.characters)canvases.set(dog.id,document.getElementById('canvas-'+dog.id).getContext('2d'));
const paths=[...new Set([...motionData.characters.flatMap(d=>d.frames.map(f=>f.file)),...motionData.effects.map(e=>e.file)])];
Promise.all(paths.map(loadImage)).then(()=>{ready=true;window.previewReady=true;updatePause();renderAt(0)}).catch(e=>{document.querySelector('.hint').textContent=e.message;window.previewError=e.message});
requestAnimationFrame(tick);
