const bitmaps=new Map(),canvases=new Map(),labels={idle:'대기',prepare:'준비',release:'발동',recover:'반동',settle:'복귀'};
let playing=!matchMedia('(prefers-reduced-motion: reduce)').matches, elapsed=0, previous=performance.now(), ready=false;
const showEffects=document.getElementById('effects'),loopToggle=document.getElementById('loop');
function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{bitmaps.set(src,im);resolve()};im.onerror=()=>reject(new Error('이미지를 열 수 없습니다: '+src));im.src=src})}
function phaseAt(dog,time){let left=time;for(let i=0;i<dog.frames.length;i++){const f=dog.frames[i];if(left<f.durationMs)return {...f,index:i,t:left/f.durationMs};left-=f.durationMs}return {...dog.frames[dog.frames.length-1],index:4,t:1}}
function drawEffect(ctx,dog,t){
 const effect=effectsData.find(e=>e.file===dog.events[0].effectFile),im=bitmaps.get(effect.file),b=effect.contentBounds;
 const sw=b.right-b.left+1,sh=b.bottom-b.top+1;
 const origin=dog.id==='D01'?[.84,.80]:dog.id==='D05'?[.60,.60]:[.72,.79];
 const x=8+292*origin[0],y=6+292*origin[1];
 ctx.save();ctx.translate(x,y);ctx.rotate(.48);
 let w=65,h=48,dx=0,dy=-24;
 if(dog.id==='D01'){w=h=22;dx=12+t*110;dy=-11;}
 if(dog.id==='D02'){w=78;h=46;dx=8+t*50;dy=-23;}
 if(dog.id==='D03'){w=122+18*t;h=70;dy=-35;}
 if(dog.id==='D04'){w=h=25+10*t;dx=8+t*90;dy=-h/2;}
 if(dog.id==='D05'){w=118;h=48;dx=8;dy=-24;ctx.globalAlpha=.7+.3*Math.sin(t*18)**2;}
 if(dog.id==='D06'){w=55+t*28;h=68+t*20;dx=8+t*32;dy=-h/2;ctx.globalAlpha=1-.5*t;}
 ctx.drawImage(im,b.left,b.top,sw,sh,dx,dy,w,h);ctx.restore();
}
function renderAt(time){
 for(const dog of motionData.characters){
  const local=loopToggle.checked?time%dog.loopDurationMs:Math.min(time,dog.loopDurationMs);
  const f=phaseAt(dog,local),ctx=canvases.get(dog.id);
  ctx.clearRect(0,0,440,330);
  ctx.drawImage(bitmaps.get(f.file),8,6,292,292);
  if(showEffects.checked&&f.phase==='release')drawEffect(ctx,dog,f.t);
  document.getElementById('phase-'+dog.id).textContent=labels[f.phase];
 }
}
function tick(now){if(ready){if(playing)elapsed+=Math.min(now-previous,100);renderAt(elapsed)}previous=now;requestAnimationFrame(tick)}
document.getElementById('play').onclick=()=>{elapsed=0;playing=true;document.getElementById('pause').textContent='일시정지'};
document.getElementById('pause').onclick=()=>{playing=!playing;document.getElementById('pause').textContent=playing?'일시정지':'계속 재생'};
showEffects.onchange=()=>{if(ready)renderAt(elapsed)};
loopToggle.onchange=()=>{elapsed=0};
for(const dog of motionData.characters)canvases.set(dog.id,document.getElementById('canvas-'+dog.id).getContext('2d'));
const paths=[...new Set([...motionData.characters.flatMap(d=>d.frames.map(f=>f.file)),...effectsData.map(e=>e.file)])];
Promise.all(paths.map(loadImage)).then(()=>{ready=true;window.previewReady=true;renderAt(0);if(!playing)document.getElementById('pause').textContent='계속 재생'}).catch(e=>{document.querySelector('.hint').textContent=e.message;window.previewError=e.message});
requestAnimationFrame(tick);
