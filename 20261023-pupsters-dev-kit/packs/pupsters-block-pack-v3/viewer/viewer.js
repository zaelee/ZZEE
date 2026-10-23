/* An offline viewer for the exact vertices exported in the model files. */
(() => {
  'use strict';
  if (!window.THREE || !window.PUPSTERS_MODELS) return;
  const states=[];
  let yaw=.62,pitch=.46,zoom=1,spin=false,wire=false,drag=null;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  for(const host of document.querySelectorAll('.viewport')){
    let renderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true}); }
    catch(error){console.warn('3D preview unavailable; keeping actual mesh render.',error);continue;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.outputEncoding=THREE.sRGBEncoding;
    renderer.setClearColor(0xf5f1e8);
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2.35,2.35,2.35,-2.35,.1,50);
    scene.add(new THREE.HemisphereLight(0xfffaf0,0xb5a68d,.92));
    const light=new THREE.DirectionalLight(0xfff9e9,.9);light.position.set(-3,7,-5);scene.add(light);
    const geometries=[],materials=[];
    const model=window.PUPSTERS_MODELS[host.dataset.model];
    if(!model){renderer.dispose();continue;}
    for(const part of model.parts){
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.vertices.flat(),3));geometry.setIndex(part.faces.flat());geometry.computeVertexNormals();
      const color=new THREE.Color(...part.color).convertSRGBToLinear();
      const material=new THREE.MeshStandardMaterial({color,roughness:.88,metalness:0,flatShading:true,emissive:part.group==='FX'?color:0x000000,emissiveIntensity:part.group==='FX'?1:0});
      scene.add(new THREE.Mesh(geometry,material));geometries.push(geometry);materials.push(material);
    }
    const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',model.displayName+' 3D. 방향키로 회전, 더하기와 빼기로 확대 및 축소.');
    host.querySelector('img').hidden=true;host.append(canvas);
    const state={host,renderer,scene,camera,materials,geometries};states.push(state);
    canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.009;pitch=clamp(pitch+(e.clientY-drag.y)*.007,-.16,1.55);drag.x=e.clientX;drag.y=e.clientY;});
    canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
    canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.7,2.3);},{passive:false});
    canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')pitch=clamp(pitch+.1,-.16,1.55);if(e.key==='ArrowDown')pitch=clamp(pitch-.1,-.16,1.55);if(e.key==='+'||e.key==='=')zoom=clamp(zoom+.1,.7,2.3);if(e.key==='-')zoom=clamp(zoom-.1,.7,2.3);});
    new ResizeObserver(()=>{const w=host.clientWidth;renderer.setSize(w,w,false);}).observe(host);
  }
  if(!states.length){document.querySelector('nav.controls').hidden=true;return;}
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{const views={three:[.62,.46],front:[0,0],side:[Math.PI/2,0],back:[Math.PI,0],top:[0,1.55]};[yaw,pitch]=views[button.dataset.view];zoom=1;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b===button));});
  document.getElementById('spin').addEventListener('click',e=>{spin=!spin;e.currentTarget.setAttribute('aria-pressed',String(spin));});
  document.getElementById('wire').addEventListener('click',e=>{wire=!wire;e.currentTarget.setAttribute('aria-pressed',String(wire));for(const s of states)for(const m of s.materials)m.wireframe=wire;});
  let last=performance.now();
  function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(spin&&!drag&&!document.hidden)yaw+=dt*.35;
    for(const s of states){s.camera.zoom=zoom;s.camera.updateProjectionMatrix();s.camera.position.set(Math.sin(yaw)*Math.cos(pitch)*8,1.35+Math.sin(pitch)*8,-.15-Math.cos(yaw)*Math.cos(pitch)*8);s.camera.lookAt(0,1.35,-.15);s.renderer.render(s.scene,s.camera);}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
