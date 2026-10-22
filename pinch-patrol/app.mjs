import { Game, W, H, clamp, cameraPoint, PLAYER_COLORS, ITEM_INFO } from './game-core.mjs';
import { HandCamera } from './camera.mjs';
import { HandTracker } from './hand-tracker.mjs';
import { TouchControls } from './touch-controls.mjs';

const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d'), video = $('video');
const game = new Game(), camera = new HandCamera(video);
const skillTaps = new Set();
const keys = new Set(), touches = new TouchControls();
const touchDevice = matchMedia('(pointer: coarse)').matches;
const cameraHint = () => !isSecureContext ? '이 Wi-Fi 주소에서는 터치로 플레이해요. 카메라는 HTTPS 주소가 필요해요.' : '카메라는 버튼을 누르면 켜져요. 영상은 저장하거나 전송하지 않아요.';
let state = 'menu', mode = 'mouse', pointer = null, pointerFire = false;
let cameraReady = false, loading = false, startSerial = 0;
let playerCount = 1, startWave = 1, tracker = new HandTracker(1);
let stableHand = 0, handWasReady = false, lastFrame = performance.now();
let sound = false, audio = null, lastStatus = '', flash = 0, visualTime = 0;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stars = Array.from({length:100}, (_,i) => ({x:(i*163.7+31)%W,y:(i*97.3+49)%H,size:i%7===0?1.8:1,speed:7+i%17}));
const ship = [
  '000000010000000','000000111000000','000000121000000','000001121100000',
  '000001121100000','001001121100100','001101121101100','001111121111100',
  '011111121111110','111311121113111','111300111003111','110000101000011','100000000000001'
];
const enemies = [
  ['00100000100','00010001000','00111111100','01121112110','11111111111','11011111011','10010001001','00011011000'],
  ['00011111000','00111111100','01121112110','11111111111','10111111101','10011111001','00110001100','01100000110'],
  ['00110001100','01111011110','11111111111','11021112011','11111111111','00111111100','01100000110','11000000011']
];

function pixelSprite(pattern,x,y,scale,colors) {
  const width = pattern[0].length;
  for(let row=0;row<pattern.length;row++) for(let col=0;col<width;col++) {
    const value=Number(pattern[row][col]);
    if(value){ctx.fillStyle=colors[value-1]||colors[0];ctx.fillRect(Math.round(x+(col-width/2)*scale),Math.round(y+(row-pattern.length/2)*scale),scale,scale);}
  }
}
function text(message,x,y,size=12,color='#8a9bb3',align='center') {
  ctx.fillStyle=color;ctx.font=`500 ${size}px "Space Grotesk", sans-serif`;ctx.textAlign=align;ctx.fillText(message,x,y);
}
function tone(frequency,duration,volume=.035,type='square') {
  if(!sound||!audio) return;
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(40,frequency*.45),audio.currentTime+duration);
  gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+duration);
}
function clearInput(){
  keys.clear();skillTaps.clear();touches.clear();pointerFire=false;pointer=null;
  for(const p of game.players){p.skillHold=0;p.skillRelease=0;}
}
function setStatus(value,active=false){
  if(lastStatus!==value){$('tracking-state').textContent=value;lastStatus=value;}
  $('tracking-dot').classList.toggle('active',active);
}
function buildPlayerHUD(){
  $('skill-controls').innerHTML=game.players.map(p=>`<button type="button" data-player="${p.id}" style="--player-color:${p.color}"></button>`).join('');
  $('player-hud').innerHTML=game.players.map(p=>`<div class="player-card" style="--player-color:${p.color}" id="player-${p.id}"><b>P${p.id+1}</b><span class="player-health"></span><span class="player-weapon"></span><span class="player-buff"></span></div>`).join('');
}
function updateHUD(){
  $('score').textContent=String(game.score).padStart(6,'0');
  $('wave').textContent=String(game.wave).padStart(2,'0');
  $('difficulty').textContent=`WAVE · ${game.difficulty.label}`;
  $('difficulty').style.color=game.wave>=9?'#ff987a':game.wave>=6?'#ffd47d':'';
  const pressure=Math.round((game.pressure-1)*100);
  $('pressure').textContent=`공격 압박 +${pressure}%`;
  $('pressure').hidden=state==='menu';
  $('pressure').classList.toggle('high',pressure>=25);
  $('lives').textContent=`◆ ${game.lives}`;
  $('lives').setAttribute('aria-label',`팀 전체 목숨 ${game.lives}개`);
  for(const p of game.players){
    const card=$(`player-${p.id}`);if(!card)continue;
    card.classList.toggle('eliminated',p.lives<=0);
    card.querySelector('.player-health').textContent=p.lives>0?'♥'.repeat(p.lives):'OUT';
    card.querySelector('.player-weapon').textContent=`LV.${p.level}`;
    card.querySelector('.player-buff').textContent=p.rapid>0?`R ${Math.ceil(p.rapid)}s`:p.level===5?'MAX POWER':'';
  }
  for(const button of $('skill-controls').children){
    const p=game.players[Number(button.dataset.player)];
    button.disabled=state!=='running'||p.lives<=0||p.skillCooldown>0;
    button.textContent=`P${p.id+1} ✦ ${p.lives<=0?'OUT':p.skillCooldown>0?Math.ceil(p.skillCooldown)+'s':'준비'}`;
    button.setAttribute('aria-label',`P${p.id+1} 충격파 스킬 ${p.skillCooldown>0?Math.ceil(p.skillCooldown)+'초 후 준비':'사용'}`);
  }
  $('boss-hud').hidden=!game.boss||state==='menu';
  if(game.boss){
    const b=game.boss;$('boss-phase').textContent=`PHASE ${b.phase} / 3`;
    $('boss-health').max=b.maxHp;$('boss-health').value=Math.max(0,b.hp);
    $('boss-hp').textContent=`${Math.ceil(Math.max(0,b.hp))} / ${b.maxHp}`;
  }
}
function readSettings(){playerCount=Number($('player-count').value);startWave=Number($('start-wave').value);}
function showPanel(panel){
  $('overlay').hidden=!panel;
  for(const id of ['intro-panel','pause-panel','end-panel']) $(id).hidden=id!==panel;
}
function setMode(){
  $('mode-badge').querySelector('span').textContent=`${playerCount}P · ${mode==='camera'?'HAND CONTROL':'LOCAL CO-OP'}`;
  $('mode-badge').classList.toggle('active',state!=='menu');
  $('camera-off').hidden=!cameraReady;
}
function startGame(nextMode){
  mode=nextMode;readSettings();game.reset(playerCount,startWave);tracker.reset(playerCount);buildPlayerHUD();clearInput();stableHand=0;handWasReady=false;
  state='running';document.body.classList.add('playing');showPanel(null);$('pause').disabled=false;$('pause').textContent='Ⅱ 일시정지';
  setMode();updateHUD();fitCanvas();canvas.focus({preventScroll:true});window.scrollTo(0,0);tone(650,.12);
}
function cameraMessage(message,error=false){$('camera-status').textContent=message;$('camera-status').classList.toggle('error',error);}
function loadingUI(value){loading=value;$('start-camera').disabled=value||!isSecureContext;$('start-camera').textContent=value?'준비 중…':'카메라로 출격 ↗';$('cancel-camera').hidden=!value;$('player-count').disabled=value;$('start-wave').disabled=value;$('camera-facing').disabled=value;}
function stopCamera(){
  startSerial++;cameraReady=false;camera.stop();tracker.reset(playerCount);
  stableHand=0;handWasReady=false;$('camera-off').hidden=true;$('pinch-meter').value=0;loadingUI(false);
}
async function startCamera(){
  if(loading) return;
  readSettings();const serial=++startSerial;loadingUI(true);cameraMessage('카메라를 준비하고 있어요…');
  try{
    const ready=await camera.start(message=>{if(serial===startSerial)cameraMessage(message);},playerCount,$('camera-facing').value);
    if(serial!==startSerial||!ready)return;
    cameraReady=true;loadingUI(false);startGame('camera');
  }catch(error){
    if(serial!==startSerial)return;
    loadingUI(false);
    const messages={InsecureContextError:'카메라는 HTTPS 주소에서 사용할 수 있어요. 터치로 출격해주세요.',NotAllowedError:'카메라 권한이 꺼져 있어요. 주소창에서 허용하거나 터치나 마우스로 플레이하세요.',NotFoundError:'연결된 카메라를 찾지 못했어요. 터치나 마우스로 플레이할 수 있어요.',NotReadableError:'카메라를 사용할 수 없어요. 다른 카메라 앱을 닫고 다시 시도해주세요.'};
    cameraMessage(messages[error.name]||'손 추적을 불러오지 못했어요. 인터넷 연결을 확인하거나 터치나 마우스로 플레이하세요.',true);
  }
}
function pause(){
  if(state!=='running')return;state='paused';clearInput();showPanel('pause-panel');
  $('pause').textContent='▶ 계속하기';$('tracking-message').hidden=true;updateHUD();$('resume').focus();
}
function resume(){
  if(state!=='paused')return;state='running';clearInput();stableHand=0;handWasReady=false;
  $('pause').textContent='Ⅱ 일시정지';showPanel(null);updateHUD();canvas.focus({preventScroll:true});
}
function menu(){
  stopCamera();state='menu';document.body.classList.remove('playing');mode='mouse';clearInput();$('pause').disabled=true;
  $('mode-badge').classList.remove('active');$('mode-badge').querySelector('span').textContent='READY TO PLAY';
  setStatus('PILOT NOT CONNECTED');showPanel('intro-panel');$('tracking-message').hidden=true;updateHUD();
  cameraMessage(cameraHint());$('start-mouse').focus({preventScroll:true});
}
$('skill-controls').addEventListener('click',event=>{
  const button=event.target.closest('button[data-player]');
  if(button&&state==='running')skillTaps.add(Number(button.dataset.player));
});
$('start-camera').addEventListener('click',startCamera);
$('start-mouse').addEventListener('click',()=>{stopCamera();startGame('mouse');});
$('cancel-camera').addEventListener('click',()=>{stopCamera();cameraMessage('준비를 취소했어요. 카메라는 꺼졌습니다.');});
$('camera-off').addEventListener('click',()=>{stopCamera();mode='mouse';setMode();pause();setStatus('MOUSE / KEYBOARD');});
$('pause').addEventListener('click',()=>state==='paused'?resume():pause());
$('resume').addEventListener('click',resume);
$('pause-menu').addEventListener('click',menu);
for(const id of ['player-count','start-wave'])$(id).addEventListener('change',()=>{readSettings();game.reset(playerCount,startWave);buildPlayerHUD();updateHUD();});
for(const id of ['restart','restart-paused'])$(id).addEventListener('click',()=>startGame(mode));
$('back-menu').addEventListener('click',menu);
$('sound').addEventListener('click',async()=>{
  sound=!sound;$('sound').textContent=`사운드 ${sound?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(sound));
  if(sound){try{audio??=new (window.AudioContext||window.webkitAudioContext)();await audio.resume();tone(780,.1);}catch{sound=false;$('sound').textContent='사운드 사용 불가';$('sound').setAttribute('aria-pressed','false');}}
});
function aim(event){const rect=canvas.getBoundingClientRect();return {x:(event.clientX-rect.left)/rect.width*W,y:(event.clientY-rect.top)/rect.height*H};}
canvas.addEventListener('pointermove',event=>{
  if(state!=='running'||mode!=='mouse')return;
  if(event.pointerType==='touch')touches.move(event.pointerId,aim(event));else pointer=aim(event);
});
canvas.addEventListener('pointerdown',event=>{
  if(state!=='running'||mode!=='mouse'||event.button!==0)return;
  event.preventDefault();
  if(event.pointerType==='touch'){pointer=null;touches.begin(event.pointerId,aim(event),game.players);}
  else{pointer=aim(event);pointerFire=true;}
  canvas.setPointerCapture(event.pointerId);
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(name,event=>{
  if(event.pointerType==='touch')touches.end(event.pointerId);else pointerFire=false;
});
canvas.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')pointerFire=false;});
canvas.addEventListener('contextmenu',event=>event.preventDefault());
window.addEventListener('keydown',event=>{
  if(!event.repeat&&['KeyP','Escape'].includes(event.code)){event.preventDefault();state==='paused'?resume():pause();return;}
  if(event.target instanceof HTMLElement&&event.target.closest('button,a,input,select')&&event.code!=='Escape')return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyW','KeyA','KeyS','KeyD','ShiftLeft','KeyI','KeyJ','KeyK','KeyL','KeyU','KeyT','KeyF','KeyG','KeyH','KeyR','KeyE','KeyQ','KeyO','KeyY'].includes(event.code)&&state==='running'){
    event.preventDefault();keys.add(event.code);if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)||(playerCount===1&&['KeyW','KeyA','KeyS','KeyD'].includes(event.code)))pointer=null;
  }
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>{clearInput();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();}});
window.addEventListener('pagehide',()=>{stopCamera();audio?.close();});
window.addEventListener('pageshow',event=>{if(event.persisted){audio=null;sound=false;$('sound').textContent='사운드 OFF';$('sound').setAttribute('aria-pressed','false');menu();}});

function cameraControl(now,dt){
  try{
    const detected=camera.detect(now);
    if(detected!==undefined)tracker.update(detected,now,video.videoWidth||640,video.videoHeight||480,camera.mirrored);
  }catch{
    stopCamera();mode='mouse';setMode();pause();setStatus('손 추적 연결 종료 · 키보드로 계속할 수 있어요');return null;
  }
  const alive=game.players.filter(p=>p.lives>0);
  const missing=alive.filter(p=>!tracker.slots[p.id]?.visible||now-tracker.slots[p.id].lastSeen>400);
  if(missing.length){skillTaps.clear();for(const p of alive){p.skillHold=0;p.skillRelease=0;}stableHand=0;handWasReady=false;setStatus(`${missing.map(p=>'P'+(p.id+1)).join(' · ')} 손을 보여주세요`);}
  else{stableHand+=dt;setStatus(`${alive.length} HANDS CONNECTED · CO-OP`,true);}
  const ready=!missing.length&&stableHand>=.7;
  if(ready&&!handWasReady)for(const p of alive){
    const g=tracker.slots[p.id].gesture;p.x=clamp(g.x,25,W-25);p.y=clamp(g.y,34,H-28);p.invincible=Math.max(p.invincible,1);
  }
  handWasReady=ready;
  const message=missing.length?`${missing.map(p=>'P'+(p.id+1)).join(', ')} 손을 보여주세요 · 전투 대기 중`:!ready?'손 인식 완료 · 함께 출격!':'';
  $('tracking-message').hidden=state!=='running'||ready;
  if(message&&$('tracking-message').textContent!==message)$('tracking-message').textContent=message;
  const visible=tracker.slots.filter(slot=>slot?.visible);
  $('pinch-meter').value=visible.length?Math.max(...visible.map(slot=>clamp(1-slot.gesture.ratio/1.4,0,1))):0;
  return ready?game.players.map(p=>p.lives>0?{x:tracker.slots[p.id].gesture.x,y:tracker.slots[p.id].gesture.y,fire:tracker.slots[p.id].gesture.pinch,skill:tracker.slots[p.id].gesture.openPalm,skillTap:skillTaps.delete(p.id)}:{}):null;
}
function keyboardControls(){
  const layouts=[['ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space'],['KeyW','KeyA','KeyS','KeyD','ShiftLeft'],['KeyI','KeyJ','KeyK','KeyL','KeyU'],['KeyT','KeyF','KeyG','KeyH','KeyR']];
  return game.players.map((p,id)=>{
    const [up,left,down,right,fire]=layouts[id];
    const input={dx:Number(keys.has(right))-Number(keys.has(left)),dy:Number(keys.has(down))-Number(keys.has(up)),fire:keys.has(fire),skill:keys.has(['KeyE','KeyQ','KeyO','KeyY'][id]),skillTap:skillTaps.delete(id)};
    if(id===0){
      if(playerCount===1){input.dx+=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));input.dy+=Number(keys.has('KeyS'))-Number(keys.has('KeyW'));}
      if(pointer)Object.assign(input,pointer);input.fire ||= pointerFire;
    }
    const touch=touches.input(id);if(touch)Object.assign(input,touch);
    return p.lives>0?input:{};
  });
}
function drawBackground(){
  ctx.fillStyle='#080f1a';ctx.fillRect(0,0,W,H);
  if(cameraReady&&video.readyState>=2){
    const scale=Math.max(W/video.videoWidth,H/video.videoHeight);
    ctx.save();ctx.globalAlpha=.28;if(camera.mirrored){ctx.translate(W,0);ctx.scale(-1,1);}
    ctx.drawImage(video,(W-video.videoWidth*scale)/2,(H-video.videoHeight*scale)/2,video.videoWidth*scale,video.videoHeight*scale);ctx.restore();
  }
  const haze=ctx.createRadialGradient(720,260,10,720,260,500);haze.addColorStop(0,'#223d502e');haze.addColorStop(1,'#080f1a00');ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#27385125';ctx.lineWidth=1;
  for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  for(const star of stars){ctx.globalAlpha=.25+(star.size>1?.45:0);ctx.fillStyle='#bdcadd';ctx.fillRect(star.x/960*W,(star.y/600*H+visualTime*star.speed)%H,star.size,star.size);}ctx.globalAlpha=1;
}
function drawHand(){
  if(!cameraReady)return;
  tracker.slots.forEach((slot,id)=>{
    if(!slot?.visible||!game.players[id]?.lives)return;
    const {points,gesture}=slot,color=PLAYER_COLORS[id];
    const mapped=points.map(p=>cameraPoint(p,video.videoWidth,video.videoHeight,camera.mirrored));
    ctx.save();ctx.lineWidth=1.5;ctx.strokeStyle=color+'70';
    for(const path of [[0,1,2,3,4],[0,5,6,7,8],[5,9,13,17,0]]){ctx.beginPath();path.forEach((index,i)=>{const p=mapped[index];i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();}
    ctx.setLineDash([3,5]);ctx.strokeStyle=gesture.pinch?color:color+'99';ctx.beginPath();ctx.moveTo(gesture.thumb.x,gesture.thumb.y);ctx.lineTo(gesture.index.x,gesture.index.y);ctx.stroke();ctx.setLineDash([]);
    for(const p of [gesture.thumb,gesture.index]){ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.stroke();}ctx.restore();
  });
}
function drawPlayer(x,y,scale=2.5,player=game.player){
  if(state==='running'&&player.invincible>0&&Math.floor(game.time*12)%2===0)ctx.globalAlpha=.55;
  ctx.save();ctx.shadowColor=player.color;ctx.shadowBlur=reduceMotion?0:13;
  pixelSprite(ship,x,y,scale,[player.color,'#e9ffff','#ffb08a']);ctx.restore();ctx.globalAlpha=1;
  if(player.level>=3){ctx.fillStyle=player.color;ctx.fillRect(x-25,y,4,13);ctx.fillRect(x+21,y,4,13);}
  if(!reduceMotion){ctx.fillStyle='#f2a082';ctx.fillRect(x-3,y+16,6,8+Math.sin(visualTime*30)*4);ctx.fillStyle='#fff1d2';ctx.fillRect(x-1,y+17,2,5);}
  if(state!=='menu')text(`P${player.id+1} · LV.${player.level}`,x,y+37,10,player.color);
}
const bossSprite=[
  '00010000000000000001000','00011000000000000011000','00011100011111000111000',
  '00111110111111101111100','01111111111111111111110','11131111111111111113111',
  '11131111222222211113111','11111111222222211111111','01111111111111111111110',
  '00111111133333111111100','00011111133333111111000','00001111000000011110000','00000111000000011100000'
];
function drawBoss(){
  if(!game.boss)return;
  const b=game.boss;
  ctx.save();ctx.shadowColor=b.phase===3?'#ff697b':'#f2a082';ctx.shadowBlur=reduceMotion?0:22;
  pixelSprite(bossSprite,b.x,b.y,6,[b.phase===3?'#ee7e99':'#bc91d2','#f8dca2','#392d48']);ctx.restore();
  text(`DREADNOUGHT / PHASE ${b.phase}`,b.x,b.y-52,10,'#e7a2e9');
  if(game.beam){
    const beam=game.beam,active=beam.age>=beam.warning;
    ctx.fillStyle=active?'#ffc7a9bb':'#ff8d7940';ctx.fillRect(beam.x-beam.width/2,0,beam.width,H);
    if(active){ctx.fillStyle='#fff2dccc';ctx.fillRect(beam.x-8,0,16,H);}
    else{ctx.setLineDash([8,8]);ctx.strokeStyle='#ffb399';ctx.strokeRect(beam.x-beam.width/2,0,beam.width,H);ctx.setLineDash([]);text('DODGE!',clamp(beam.x,45,W-45),H-70,13,'#ffb399');}
  }
}
function drawItems(){
  for(const item of game.items){
    const info=ITEM_INFO[item.type],y=item.y+(reduceMotion?0:Math.sin(item.age*4)*3);
    ctx.save();ctx.shadowColor=info.color;ctx.shadowBlur=reduceMotion?0:16;ctx.fillStyle='#142332';ctx.strokeStyle=info.color;ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(item.x-13,y-13,26,26,5);ctx.fill();ctx.stroke();text(info.label,item.x,y+5,16,info.color);ctx.restore();
  }
}
function draw(){
  drawBackground();
  if(state==='menu'){
    ctx.save();ctx.globalAlpha=.55;
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)pixelSprite(enemies[row],(620+col*69+Math.sin(visualTime)*12)*W/960,105+row*56,2.5,[['#f2a082','#141b25'],['#dfc98b','#141b25'],['#b1a4e2','#141b25']][row]);
    ctx.restore();
    const x=(745+Math.sin(visualTime*.5)*25)*W/960,y=H*.71;
    ctx.strokeStyle='#b7f3cb40';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,72,0,Math.PI*2);ctx.stroke();ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(x-100,y);ctx.lineTo(x+100,y);ctx.stroke();ctx.setLineDash([]);drawPlayer(x,y,3.7);
    text('YOUR FIGHTER',x,y+109,10,'#b7f3cb');return;
  }
  drawHand();
  for(const e of game.enemies){
    ctx.save();ctx.translate(e.x,e.y);if(e.dive)ctx.rotate(Math.sin(e.dive.t*3)*.4);
    pixelSprite(enemies[e.type],0,0,3,[['#f2a082','#26202b'],['#dfc98b','#26202b'],['#b1a4e2','#26202b']][e.type]);
    if(e.hp>1){ctx.strokeStyle='#b1a4e299';ctx.strokeRect(-20,-17,40,34);}ctx.restore();
  }
  drawBoss();drawItems();
  ctx.save();ctx.shadowBlur=reduceMotion?0:9;for(const b of game.bullets){ctx.fillStyle=b.color||'#d4ffe2';ctx.shadowColor=ctx.fillStyle;ctx.fillRect(b.x-(b.damage>1?2.5:1.5),b.y-9,b.damage>1?5:3,15);}ctx.restore();
  ctx.fillStyle='#ff987a';for(const b of game.enemyBullets){ctx.beginPath();ctx.arc(b.x,b.y,b.radius||4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe7c9';ctx.fillRect(b.x-1,b.y-1,2,2);ctx.fillStyle='#ff987a';}
  if(!reduceMotion)for(const p of game.particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
  for(const wave of game.shockwaves){
    const progress=1-wave.life/.65;ctx.save();ctx.globalAlpha=wave.life/.65;
    ctx.strokeStyle=wave.color;ctx.lineWidth=reduceMotion?3:6*(1-progress)+1;
    ctx.beginPath();ctx.arc(wave.x,wave.y,reduceMotion?70:30+progress*Math.hypot(W,H),0,Math.PI*2);ctx.stroke();
    if(!reduceMotion){ctx.globalAlpha*=.07;ctx.fillStyle=wave.color;ctx.fill();}ctx.restore();
  }
  if(!game.over)for(const p of game.players)if(p.lives>0)drawPlayer(p.x,p.y,2.5,p);
  for(const popup of game.popups){ctx.globalAlpha=Math.min(1,popup.life);text(popup.label,clamp(popup.x,110,W-110),popup.y,13,popup.color);}ctx.globalAlpha=1;
  if(game.banner>0)text(game.boss?'WARNING / BOSS APPROACHING':`WAVE ${String(game.wave).padStart(2,'0')} / GET READY`,W/2,H-35,12,'#b7f3cb');
  if(game.waveWait>0){text('SECTOR CLEAR',W/2,H/2,28,'#b7f3cb');text('+500 BONUS',W/2,H/2+32,12,'#f2a082');}
  if(flash>0&&!reduceMotion){ctx.fillStyle=`rgba(242,130,110,${flash*.16})`;ctx.fillRect(0,0,W,H);}
}
function loop(now){
  const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  if(!reduceMotion&&(state==='menu'||state==='running'))visualTime+=dt;
  let input=null;
  if(cameraReady&&state==='running')input=cameraControl(now,dt);
  if(mode==='mouse'&&state==='running'){
    input=keyboardControls();
    setStatus(touchDevice?'누른 채 드래그 · 이동 + 연사':`${playerCount} PILOT${playerCount>1?'S':''} · LOCAL CO-OP`,true);$('tracking-message').hidden=true;$('pinch-meter').value=input.some(i=>i.fire)?1:0;
  }
  const firing=state==='running'&&!!input?.some(i=>i.fire);
  $('fire-state').textContent=firing?'FIRING':'STANDBY';$('fire-state').classList.toggle('active',firing);
  if(state==='running'&&input){
    game.update(dt,input);
    for(const event of new Set(game.events)){if(event==='shoot')tone(820,.055,.015);if(event==='hit')tone(170,.09,.025,'triangle');if(event==='hurt'){flash=1;tone(90,.24,.07,'sawtooth');}if(event==='wave'||event==='item')tone(1100,.3,.04,'triangle');if(event==='boss'||event==='phase'||event==='warning')tone(180,.35,.035,'sawtooth');if(event==='skill')tone(1500,.6,.05,'sine');if(event==='bossDown')tone(900,.5,.06,'triangle');}
    game.events=[];updateHUD();
    if(game.over){state='over';clearInput();showPanel('end-panel');$('pause').disabled=true;$('final-score').textContent=String(game.score).padStart(6,'0');$('end-score').textContent=`WAVE ${String(game.wave).padStart(2,'0')}까지 지켜냈어요. 한 번 더?`;updateHUD();$('restart').focus();}
  }
  flash=Math.max(0,flash-dt*4);draw();requestAnimationFrame(loop);
}
function fitCanvas(){
  const arena=$('arena'),scale=Math.min(arena.clientWidth/W,arena.clientHeight/H);
  canvas.style.width=`${W*scale}px`;canvas.style.height=`${H*scale}px`;
}
function syncViewport(){
  const portrait=(touchDevice||innerWidth<=600)&&innerHeight>innerWidth;
  const width=portrait?600:960,height=portrait?800:600;
  if(W!==width||H!==height){
    pause();clearInput();game.resize(width,height);tracker.reset(playerCount);stableHand=0;handWasReady=false;
    canvas.width=W;canvas.height=H;
  }
  document.body.classList.toggle('portrait',portrait);fitCanvas();
}
window.addEventListener('resize',syncViewport);
new ResizeObserver(fitCanvas).observe($('arena'));
if(touchDevice){
  document.body.classList.add('touch-device');
  $('start-mouse').textContent='터치로 출격 ↗';$('start-mouse').className='primary';$('start-camera').className='secondary';
  $('touch-help').hidden=false;
}
canvas.setAttribute('aria-label','우주 슈팅 게임. 화면을 누른 채 드래그하면 이동과 연사. 키보드는 방향키와 스페이스, P로 일시정지.');
cameraMessage(cameraHint());loadingUI(false);syncViewport();buildPlayerHUD();updateHUD();
requestAnimationFrame(loop);
