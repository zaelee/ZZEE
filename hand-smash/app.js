import { coverPoint, isClosed } from './physics.js';
import {PullGesture} from './pull-gesture.js';
import {PinchRotation} from './rotate-gesture.js';
const $ = id => document.getElementById(id);
const canvas = $('scene'), ctx = canvas.getContext('2d'), video = $('camera');
const mobileInput=matchMedia('(pointer:coarse)').matches;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let width=0,height=0,trails=[],hands=[],view=null,inspect=false;
let total=0,round=1,playing=false,cameraActive=false,stream=null;
let requestId=0,detector=null,detectorPromise=null,lastVideo=-1,lastDetect=0;
let previousHands=[],previousTime=0,lastFrame=performance.now();
let soundOn=false,audio=null,flash=0,labelTimer=null,pointer=null;
const pullPointers=new Map(),pointerPull=new PullGesture(),handPull=new PullGesture();
let tearState='';
const handRotation=new PinchRotation();
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function updateScore(){
  $('score').textContent=String(total).padStart(3,'0');
  const remaining=view?.remaining??64,count=view?.count??64;
  $('remaining').textContent=view?.torn?'반갈 완료 · 과일 단면 공개':remaining?`왁스 ${remaining} / ${count}조각`:'속의 과일찹쌀떡은 그대로!';
  $('progress').style.width=`${(count-remaining)/count*100}%`;
  $('round').textContent=`ROUND ${String(round).padStart(2,'0')}`;
}
function cancelPull(){handRotation.reset();pullPointers.clear();pointerPull.cancel();handPull.cancel();view?.endPull();pointer=null;view?.release();}
function updateTearUI(){
  if(!view)return;
  const state=view.torn?'torn':view.tearReady?'ready':'locked';
  $('tear').disabled=state!=='ready'||inspect;
  $('touch-rotate').setAttribute('aria-pressed',String(inspect));$('touch-rotate').textContent=inspect?'✳ 부수기로 돌아가기':'↔ 돌리기';$('touch-peel').disabled=inspect||view.preview||view.torn;
  $('tear').textContent=state==='torn'?'반갈 완료 ✓':state==='ready'?'반으로 가르기 ↔  T':`반갈 잠금 · ${Math.floor((view.count-view.remaining)/view.count*100)}% / 80%`;
  if(state!==tearState){
    tearState=state;
    if(state==='ready'){$('canvas-hint').textContent='반갈 준비! 떡을 잡고 빠르게 당기거나, 두 손을 벌려보세요.';notice('왁스를 80% 이상 벗겼어요. 크게, 빠르게 당기면 반으로 갈라져요.');}
    if(state==='torn'){$('canvas-hint').textContent='쭈욱, 반갈! 안쪽 과일이 드러났어요.';notice('다시 코팅하기를 누르면 새 떡으로 돌아가요.');}
  }
  $('cutaway').disabled=view.torn;
}
function tearMochi(){
  if(inspect||!view?.tear())return;
  cancelPull();sound(8);clearTimeout(labelTimer);$('burst-label').textContent='쭈욱!';$('burst-label').classList.add('show');labelTimer=setTimeout(()=>$('burst-label').classList.remove('show'),700);updateScore();updateTearUI();
}
function applyPull(gesture,points,time){const result=gesture.move(points,time,Math.min(width,height));view?.pull(result.amount);if(result.strong)tearMochi();}
function reset(next=false){
  cancelPull();tearState='';
  if(next)round++;inspect=false;$('inspect').setAttribute('aria-pressed','false');$('inspect').textContent='돌려서 구경하기';view?.reset($('flavor').value);flash=0;clearTimeout(labelTimer);$('burst-label').classList.remove('show');
  $('cutaway').setAttribute('aria-pressed','false');$('cutaway').textContent='단면 먼저 보기';
  $('canvas-hint').textContent='꾹 누르면 말랑, 손을 떼면 탱글. 코팅은 쓸어서 와삭.';
  updateScore();updateTearUI();
}
function sound(count) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
    const duration = .16, buffer = audio.createBuffer(1, audio.sampleRate * duration, audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 3;
    const source = audio.createBufferSource(), gain = audio.createGain(), filter = audio.createBiquadFilter();
    source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = 700 + count * 100; gain.gain.value = .16;
    source.connect(filter).connect(gain).connect(audio.destination); source.start();
  } catch { soundOn = false; $('sound').textContent = '소리 사용 불가'; $('sound').setAttribute('aria-pressed', 'false'); }
}
function smash(a,b,radius=24,all=false){
  if(!playing||!view||inspect)return;
  if(view.preview){view.press(b);return;}
  const cracked=view.hit(a,b,radius,all);if(cracked)sound(Math.min(cracked,3));
}
function collectBroken(){
  const broken=view?.drainBroken()||0;if(!broken)return;
  total+=broken;updateScore();sound(Math.min(broken,5));
  if(!view.remaining&&!view.torn){$('burst-label').textContent='와삭!';$('burst-label').classList.add('show');$('canvas-hint').textContent='반갈 준비! 떡을 잡고 빠르게 당겨보세요.';labelTimer=setTimeout(()=>$('burst-label').classList.remove('show'),900);}

}
function draw(time){
  const dt=Math.min((time-lastFrame)/1000,.04);lastFrame=time;
  if(pullPointers.size)applyPull(pointerPull,[...pullPointers.values()],time);
  if(pointer&&!inspect&&!pullPointers.size)view?.press(pointer,.95,time);view?.render(time,dt);collectBroken();updateTearUI();ctx.clearRect(0,0,width,height);
  trails=trails.filter(p=>time-p.time<250);
  for(const p of trails){ctx.globalAlpha=1-(time-p.time)/250;ctx.strokeStyle='#ffc6d6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.a.x,p.a.y);ctx.lineTo(p.b.x,p.b.y);ctx.stroke();}ctx.globalAlpha=1;
  const links=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
  for(const hand of hands){
    ctx.strokeStyle='#ffd0dfbb';ctx.lineWidth=2;
    for(const chain of links){ctx.beginPath();chain.forEach((j,i)=>i?ctx.lineTo(hand[j].x,hand[j].y):ctx.moveTo(hand[j].x,hand[j].y));ctx.stroke();}
    for(const p of hand){ctx.fillStyle='#ffd0df';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}
    ctx.beginPath();ctx.arc(hand[8].x,hand[8].y,15,0,Math.PI*2);ctx.stroke();
  }
  if(handRotation.active&&handRotation.point){const p=handRotation.point;ctx.strokeStyle='#ceff63';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,23,0,Math.PI*1.75);ctx.stroke();}
  if(flash>0){ctx.fillStyle=`rgba(255,220,228,${flash})`;ctx.fillRect(0,0,width,height);flash=Math.max(0,flash-dt);}
  if (cameraActive && video.readyState >= 2 && time-lastDetect > 45 && video.currentTime !== lastVideo) {
    lastDetect=time; lastVideo=video.currentTime;
    try {
      const result = detector.detectForVideo(video, time);
      hands = result.landmarks.map(hand => hand.map(p => coverPoint(p, video.videoWidth, video.videoHeight, width, height)));
      $('tracking').textContent = hands.length ? `손 ${hands.length}개 인식 중` : '손 전체를 카메라에 보여주세요';
      $('status-dot').classList.toggle('active', Boolean(hands.length));
      const rotation=handRotation.update(result.landmarks,hands,result.handedness,time,Math.min(width,height));
      if(rotation.blocked){
        handPull.cancel();if(!pullPointers.size)view?.endPull();view?.release();
        if(!pointer&&!pullPointers.size)view?.rotate(rotation.dx,rotation.dy);
        if(rotation.active)$('tracking').textContent='집어서 회전 중 ↔';
      }
      const gripping=!rotation.blocked&&hands.length===2&&result.landmarks.every(isClosed)&&!inspect&&view?.tearReady&&!pullPointers.size;
      const grips=hands.map(hand=>hand[9]).sort((a,b)=>a.x-b.x);
      if(gripping){
        if(!handPull.start&&grips.every(p=>view.contains(p)))handPull.begin(grips,time);
        if(handPull.start)applyPull(handPull,grips,time);
      }else{handPull.cancel();if(!pullPointers.size)view?.endPull();}
      hands.forEach((hand,i) => {
        if(rotation.blocked){previousHands[i]=null;return;}
        const current = hand[8], prev = time-previousTime < 180 ? previousHands[i] : null;
        if (prev&&!handPull.start) {
          const speed = Math.hypot(current.x-prev.point.x,current.y-prev.point.y) / Math.max(.01,(time-previousTime)/1000);
          if (speed > 100) { smash(prev.point,current,24); trails.push({a:prev.point,b:current,time}); }
        }
        const closed = isClosed(result.landmarks[i]);
        if(closed&&!inspect&&!handPull.start)view?.press(hand[9],1,time);
        if (closed && prev && !prev.closed&&!handPull.start) smash(hand[9],hand[9],Math.min(width,height)*.12);
        previousHands[i]={point:current,closed};
      });
      previousHands.length=hands.length; previousTime=time;
    } catch { stopCamera(); notice('손 인식이 중단됐어요. 카메라를 다시 켜거나 체험 모드를 이용해주세요.',true); }
  }
  requestAnimationFrame(draw);
}
function resize(){
  const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,mobileInput?1.5:2);
  width=box.width;height=box.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);view?.resize(width,height);previousHands=[];hands=[];cancelPull();
}
function stopCamera() {
  handRotation.reset();handPull.cancel();if(!pullPointers.size)view?.endPull();
  requestId++; stream?.getTracks().forEach(track=>track.stop()); stream=null; video.srcObject=null;
  cameraActive=false; video.classList.remove('active'); hands=[]; previousHands=[]; lastVideo=-1;
  $('start').disabled=false; $('start').innerHTML='<span>◉ &nbsp; 카메라로 시작</span><span>↗</span>';
  $('mode').textContent=playing?'●  PLAY MODE':'●  PREVIEW MODE'; $('tracking').textContent=playing?'마우스 · 터치 체험 중':'카메라 연결 대기'; $('status-dot').classList.remove('active');
}
const timeout = (promise, ms, message) => new Promise((resolve,reject)=> {
  const timer=setTimeout(()=>reject(new Error(message)),ms);
  promise.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
});
async function loadDetector() {
  if (!detectorPromise) detectorPromise = (async()=>{
    const {FilesetResolver,HandLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs');
    const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm');
    return HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minTrackingConfidence:.55});
  })().catch(error=>{detectorPromise=null;throw error;});
  return detectorPromise;
}
$('start').addEventListener('click',async()=>{
  if (cameraActive) {stopCamera();notice('카메라를 껐어요. 체험 모드로 계속 즐겨보세요.');return;}
  if (!navigator.mediaDevices?.getUserMedia) {notice('이 브라우저에서는 카메라를 사용할 수 없어요. localhost 또는 HTTPS 주소에서 열어주세요.',true);return;}
  const id=++requestId; $('start').disabled=true; $('start').textContent='카메라 연결 중…'; notice('브라우저의 카메라 접근을 허용해주세요.');
  try {
    const mediaRequest=navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:mobileInput?640:960},height:{ideal:mobileInput?480:720},frameRate:{ideal:24,max:30}},audio:false});
    mediaRequest.then(media=>{if(id!==requestId)media.getTracks().forEach(track=>track.stop());},()=>{});
    const media=await timeout(mediaRequest,45000,'카메라 허용을 기다리다 시간이 지났어요. 다시 시도해주세요.');
    if(id!==requestId){media.getTracks().forEach(track=>track.stop());return;}
    stream=media;video.srcObject=media;await timeout(video.play(),15000,'카메라 영상을 시작하지 못했어요.');
    if(id!==requestId)return;
    notice('손 인식 모델을 준비하고 있어요. 첫 실행은 조금 걸려요.');
    detector=await timeout(loadDetector(),40000,'손 인식 모델을 불러오지 못했어요. 인터넷 연결을 확인해주세요.');
    if(id!==requestId)return;
    playing=true;cameraActive=true;video.classList.add('active');$('mode').textContent='●  LIVE CAMERA';
    $('start').innerHTML='<span>◉ &nbsp; 카메라 끄기</span><span>×</span>';$('start').disabled=false;
    $('canvas-hint').textContent='엄지·검지를 집고 움직이면 회전, 펴서 쓸면 왁스가 깨져요.';
    notice('엄지와 검지만 맞대고 나머지 손가락은 펴주세요. 좌우·위아래로 돌릴 수 있어요.');
    stream.getVideoTracks()[0].addEventListener('ended',()=>{if(cameraActive){stopCamera();notice('카메라 연결이 종료됐어요.',true);}});
  } catch(error) {
    if(id!==requestId)return;stopCamera();
    const messages={NotAllowedError:'카메라 권한이 차단됐어요. 주소창의 권한을 허용한 뒤 다시 눌러주세요.',NotFoundError:'연결된 카메라를 찾지 못했어요. 체험 모드로 즐겨보세요.',NotReadableError:'다른 앱이 카메라를 사용 중일 수 있어요. 확인 후 다시 시도해주세요.'};
    notice(messages[error.name] || (error.message.startsWith('카메라')||error.message.startsWith('손 인식')?error.message:'손 인식을 시작하지 못했어요. 인터넷 연결을 확인하거나 체험 모드를 이용해주세요.'),true);
  }
});
$('demo').addEventListener('click',()=>{stopCamera();playing=true;$('mode').textContent='●  PLAY MODE';$('tracking').textContent='마우스 · 터치 체험 중';$('canvas-hint').textContent='꾹 눌렀다 놓아보세요. 옆으로 쓸면 코팅이 깨져요.';notice('마우스나 터치로 부숴보세요. Space는 한 번에 부수기!');});
function point(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};}
// Keep two-finger pulling inside the toy instead of zooming the page.
for(const type of ['touchstart','touchmove'])canvas.addEventListener(type,event=>event.preventDefault(),{passive:false});
canvas.addEventListener('pointerdown',event=>{
  if(!playing)$('demo').click();const p=point(event);canvas.setPointerCapture(event.pointerId);
  if(!inspect&&view?.tearReady&&view.contains(p)){
    if(pullPointers.size>=2)return;pullPointers.set(event.pointerId,p);pointerPull.begin([...pullPointers.values()],performance.now());pointer=null;handPull.cancel();view.release();return;
  }
  if(pullPointers.size)return;pointer=p;if(!inspect)smash(pointer,pointer,22);
});
canvas.addEventListener('pointermove',event=>{
  const p=point(event);
  if(pullPointers.has(event.pointerId)){pullPointers.set(event.pointerId,p);applyPull(pointerPull,[...pullPointers.values()],performance.now());return;}
  if(!pointer)return;if(inspect)view?.rotate(p.x-pointer.x,p.y-pointer.y);else{smash(pointer,p,22);trails.push({a:pointer,b:p,time:performance.now()});}pointer=p;
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>cancelPull());
$('tear').addEventListener('click',tearMochi);
$('reset').addEventListener('click',()=>reset(true));
function smashAll(){if(!playing)$('demo').click();smash({x:0,y:0},{x:0,y:0},0,true);}
$('keyboard-smash').addEventListener('click',smashAll);
$('touch-peel').addEventListener('click',smashAll);
$('touch-rotate').addEventListener('click',()=>$('inspect').click());
window.addEventListener('keydown',event=>{if(event.code==='KeyT'&&!event.repeat&&!['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName)&&!event.target.isContentEditable){tearMochi();return;}if(inspect&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)&&!['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();view?.rotate(event.code==='ArrowLeft'?-12:event.code==='ArrowRight'?12:0,event.code==='ArrowUp'?-12:event.code==='ArrowDown'?12:0);return;}if(event.code==='Space'&&!event.repeat&&!['INPUT','BUTTON','TEXTAREA','SELECT'].includes(event.target.tagName)&&!event.target.isContentEditable){event.preventDefault();smashAll();}});
$('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').innerHTML=`소리 ${soundOn?'켜짐':'꺼짐'} <span>♪</span>`;$('sound').setAttribute('aria-label',soundOn?'소리 끄기':'소리 켜기');$('sound').setAttribute('aria-pressed',String(soundOn));if(soundOn)sound(3);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelPull();if(document.hidden&&(stream||$('start').disabled)){stopCamera();notice('화면을 벗어나 카메라를 껐어요. 다시 시작할 수 있어요.');}});
window.addEventListener('pagehide',()=>{stopCamera();detector?.close();detector=null;detectorPromise=null;});


$('flavor').addEventListener('change',()=>{reset();$('target-display').textContent=$('flavor').selectedOptions[0].textContent;});
$('inspect').addEventListener('click',()=>{cancelPull();inspect=!inspect;$('inspect').setAttribute('aria-pressed',String(inspect));$('inspect').textContent=inspect?'부수기로 돌아가기':'돌려서 구경하기';$('canvas-hint').textContent=inspect?'드래그·방향키 또는 카메라에서 엄지·검지를 집고 움직여 돌려보세요.':'코팅을 톡 누르거나 쓸어보세요.';});
$('cutaway').addEventListener('click',()=>{if(!view||view.torn)return;cancelPull();view.setPreview(!view.preview);$('cutaway').setAttribute('aria-pressed',String(view.preview));$('cutaway').textContent=view.preview?'코팅 다시 보기':'단면 먼저 보기';$('canvas-hint').textContent=view.preview?'과일찹쌀떡을 꾹 눌러보세요. 놓으면 말랑하게 돌아와요.':'코팅을 톡 누르거나 쓸어보세요.';});
$('export-model').addEventListener('click',async()=>{
  if(!view)return;const button=$('export-model');button.disabled=true;
  try{const data=await view.exportGLB(),url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download=`hanjungsun-${view.flavor}${view.torn?'-torn':view.preview?'-cutaway':''}.glb`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);notice('3D 모델을 GLB 파일로 저장했어요.');}
  catch{notice('모델 저장에 실패했어요. 다시 시도해주세요.',true);}finally{button.disabled=false;}
});
new ResizeObserver(resize).observe(canvas);resize();requestAnimationFrame(draw);
try{const {MochiView}=await import('./mochi-view.js');view=new MochiView($('model'),reducedMotion);resize();reset();$('render-state').textContent='3D MODEL / LIVE';}
catch(error){$('render-state').textContent='3D 로딩 실패';notice('3D 화면을 열지 못했어요. WebGL을 지원하는 Chrome 또는 Safari에서 다시 열어주세요.',true);for(const id of ['start','demo','inspect','cutaway','export-model','keyboard-smash','touch-rotate','touch-peel'])$(id).disabled=true;}
