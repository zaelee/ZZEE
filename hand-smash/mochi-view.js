import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createMochi, disposeModel, createTornHalves } from './mochi-model.js';
import {canTear} from './pull-gesture.js';
import {visibleHit} from './wax-geometry.js';
import {springStep,squishScale,applySoftMaterial} from './soft-body.js';

export class MochiView {
  constructor(canvas, reducedMotion) {
    const mobile=matchMedia('(pointer:coarse)').matches;
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));
    this.renderer.transmissionResolutionScale=mobile ? .65 : 1;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=.92;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.VSMShadowMap;
    this.scene=new THREE.Scene();
    this.camera=new THREE.OrthographicCamera(-3,3,2.4,-2.4,.1,50);
    this.camera.position.set(0,2.9,6);this.camera.lookAt(0,-.32,0);
    const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(this.renderer);
    this.environment=pmrem.fromScene(environment,.04);this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.65;environment.dispose();pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x746357,.65));
    const key=new THREE.DirectionalLight(0xfff0dc,2);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);key.shadow.camera.left=-2.5;key.shadow.camera.right=2.5;key.shadow.camera.top=2.5;key.shadow.camera.bottom=-2.5;key.shadow.normalBias=.025;key.shadow.bias=-.0004;key.shadow.radius=5;key.shadow.blurSamples=mobile?4:8;this.scene.add(key);
    const fill=new THREE.DirectionalLight(0xffd4e5,.7);fill.position.set(4,2,1);this.scene.add(fill);
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(1.43,1.32,.11,96),new THREE.MeshStandardMaterial({color:0xf0e6d5,roughness:.35,metalness:.04}));
    plate.receiveShadow=true;plate.position.y=-1.11;this.scene.add(plate);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(1.38,.024,12,96),new THREE.MeshStandardMaterial({color:0xc4a77d,metalness:.45,roughness:.3}));
    rim.rotation.x=Math.PI/2;rim.position.y=-1.045;this.scene.add(rim);
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
    const context=shadowCanvas.getContext('2d'),gradient=context.createRadialGradient(64,64,5,64,64,64);
    gradient.addColorStop(0,'#3d283f85');gradient.addColorStop(1,'#3d283f00');context.fillStyle=gradient;context.fillRect(0,0,128,128);
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.5,2.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
    shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.045;this.scene.add(shadow);
    this.raycaster=new THREE.Raycaster();this.fragments=[];this.reducedMotion=reducedMotion;this.rotation=-.22;this.tilt=.08;this.preview=false;
    this.softUniforms={softPoint:{value:new THREE.Vector3(0,0,1)},softDent:{value:0}};
    this.reset('strawberry');
    this.environmentReady=this.loadStudio();
  }
  async loadStudio(){
    try{const hdr=await new HDRLoader().loadAsync('./assets/studio_small_05_1k.hdr');const pmrem=new THREE.PMREMGenerator(this.renderer);const next=pmrem.fromEquirectangular(hdr);this.scene.environment=next.texture;this.scene.environmentIntensity=.85;this.scene.environmentRotation.y=.7;this.environment.dispose();this.environment=next;hdr.dispose();pmrem.dispose();return true;}catch{return false;}
  }
  get isAnimating(){return performance.now()<this.holdUntil||Math.abs(this.compression)>.001||Math.abs(this.compressionVelocity)>.01||Math.abs(this.dent)>.001||this.stretch>.001||this.pullTarget>0||(this.torn&&this.tearTime<.65)||this.model.pieces.some(p=>p.userData.intact&&p.userData.detachAt!==null)||this.fragments.some(p=>p.visible);}
  get remaining(){return this.model.pieces.filter(p=>p.userData.intact).length;}
  get count(){return this.model.pieces.length;}
  get tearReady(){return !this.torn&&!this.preview&&canTear(this.remaining,this.count);}
  contains(point){
    this.model.root.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(point.x/this.width*2-1,1-point.y/this.height*2),this.camera);
    return Boolean(visibleHit(this.raycaster.intersectObject(this.model.core,true)));
  }
  pull(amount){if(this.tearReady){this.release();this.pullTarget=amount;}}
  endPull(){this.pullTarget=0;}
  tear(){
    if(!this.tearReady)return false;
    this.torn=true;this.release();this.pullTarget=0;this.stretch=0;this.tearTime=0;
    this.model.skin.visible=false;this.model.cutaway.visible=false;this.model.coat.visible=false;
    for(const piece of this.model.pieces)if(piece.userData.intact){piece.visible=true;this.detach(piece);}
    this.halves=createTornHalves(this.model);this.rotation=-.12;this.tilt=.03;
    return true;
  }
  reset(flavor=this.flavor){
    if(this.model){for(const p of this.fragments){this.scene.remove(p);disposeModel(p);}this.scene.remove(this.model.root);disposeModel(this.model.root);}
    this.torn=false;this.halves=null;this.pullTarget=0;this.stretch=0;this.tearTime=0;this.fragments=[];this.pendingBroken=0;this.pressedPiece=null;this.fracturing=false;this.flavor=flavor;this.model=createMochi(flavor);this.scene.add(this.model.root);this.preview=false;this.rotation=-.22;this.tilt=.08;
    this.model.root.rotation.set(this.tilt,this.rotation,0);this.model.root.position.y=-.08;
    this.compression=0;this.compressionVelocity=0;this.dent=0;this.dentVelocity=0;this.holdUntil=0;this.pressure=0;this.softUniforms.softDent.value=0;
    const originals=new Set(),materials=new Set(),baked=[];
    this.model.core.updateWorldMatrix(true,true);const inverse=this.model.core.matrixWorld.clone().invert();
    this.model.core.traverse(mesh=>{if(!mesh.geometry)return;originals.add(mesh.geometry);baked.push({mesh,matrix:new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld)});});
    for(const {mesh,matrix} of baked){mesh.geometry=mesh.geometry.clone().applyMatrix4(matrix);mesh.castShadow=true;materials.add(mesh.material);}
    this.model.core.traverse(object=>{if(object===this.model.core)return;object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);object.updateMatrix();});
    originals.forEach(g=>g.dispose());materials.forEach(m=>applySoftMaterial(m,this.softUniforms));
    this.model.pieces.forEach(p=>{p.castShadow=false;});
    this.softDepth?.dispose();this.softDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});applySoftMaterial(this.softDepth,this.softUniforms);
    this.model.core.traverse(mesh=>{if(mesh.isMesh)mesh.customDepthMaterial=this.softDepth;});
  }
  resize(width,height){
    width=Math.max(1,width);height=Math.max(1,height);this.width=width;this.height=height;
    const aspect=width/height,vertical=Math.max(4.05,3.35/aspect);
    this.camera.left=-vertical*aspect/2;this.camera.right=vertical*aspect/2;
    this.camera.top=vertical/2;this.camera.bottom=-vertical/2;this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false);
  }
  rotate(dx,dy){this.rotation+=dx*.008;this.tilt=THREE.MathUtils.clamp(this.tilt+dy*.005,-.7,.7);}
  setPreview(value){if(this.torn)return;this.endPull();this.preview=value;this.model.shell.visible=!value;this.model.coat.visible=!value&&!this.fracturing;this.model.skin.visible=!value;this.model.cutaway.visible=value;this.release();}
  press(point,strength=.85,now=performance.now()){
    if(this.torn||this.pullTarget>0)return false;
    this.model.root.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(point.x/this.width*2-1,1-point.y/this.height*2),this.camera);
    const hit=visibleHit(this.raycaster.intersectObject(this.preview?this.model.core:this.model.root,true));
    if(!hit){this.release();return false;}
    this.softUniforms.softPoint.value.copy(this.model.root.worldToLocal(hit.point.clone()));
    const wax=!this.preview?this.raycaster.intersectObjects(this.model.pieces.filter(p=>p.userData.intact),false)[0]:null;
    this.pressedPiece=wax&&wax.distance<=hit.distance+.01?wax.object:null;
    this.holdUntil=now+160;this.pressure=THREE.MathUtils.clamp(strength,0,1);return true;
  }
  release(){this.holdUntil=0;this.pressure=0;this.pressedPiece=null;}
  startFracture(){
    if(this.fracturing)return;this.fracturing=true;this.model.coat.visible=false;
    this.model.pieces.forEach(p=>{if(p.userData.intact)p.visible=true;});
  }
  damage(piece,amount,time){
    const state=piece.userData;if(!state.intact||state.detachAt!==null)return false;
    this.startFracture();state.damage=Math.min(1,state.damage+amount);
    const crack=piece.children[0];crack.material.opacity=Math.min(.92,state.damage*.9);
    if(state.damage>=1)state.detachAt=time+55+(Math.sin(state.home.x*19+state.home.z*31)+1)*45;
    return true;
  }
  hit(a,b,radius=24,all=false){
    if(this.preview||this.torn)return 0;
    const now=performance.now();this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
    const intact=this.model.pieces.filter(p=>p.userData.intact),targets=new Set();
    if(all){this.startFracture();for(const piece of intact){this.damage(piece,1,now);piece.userData.detachAt=now+40+(1-piece.userData.home.z)*190;}return intact.length;}
    const length=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.min(30,Math.max(1,Math.ceil(length/14)));
    for(let i=0;i<=steps;i++){
      const x=a.x+(b.x-a.x)*i/steps,y=a.y+(b.y-a.y)*i/steps;
      for(const [dx,dy] of [[0,0],[radius*.6,0],[-radius*.6,0],[0,radius*.6],[0,-radius*.6]]){
        this.raycaster.setFromCamera(new THREE.Vector2((x+dx)/this.width*2-1,1-(y+dy)/this.height*2),this.camera);
        const wax=this.raycaster.intersectObjects(intact,false)[0],core=visibleHit(this.raycaster.intersectObject(this.model.core,true));
        if(wax&&(!core||wax.distance<core.distance))targets.add(wax.object);
      }
    }
    let affected=0;
    for(const piece of targets){
      if(now-(piece.userData.lastHit??-1000)<85)continue;piece.userData.lastHit=now;
      if(this.damage(piece,.64,now))affected++;
      for(const neighbor of intact){if(neighbor===piece||targets.has(neighbor))continue;
        const distance=neighbor.userData.home.distanceTo(piece.userData.home);
        if(distance<.55)this.damage(neighbor,.14*(1-distance/.55),now);
      }
    }
    if(affected)this.compressionVelocity+=.4;return affected;
  }
  drainBroken(){const count=this.pendingBroken;this.pendingBroken=0;return count;}
  detach(piece){
    piece.userData.intact=false;piece.children[0].visible=false;this.scene.attach(piece);
    const state=piece.userData,direction=piece.position.clone().sub(this.model.root.position).normalize();
    state.velocity=direction.multiplyScalar(.18+Math.random()*.18).add(new THREE.Vector3((Math.random()-.5)*.12,.1+Math.random()*.15,.04));
    state.spin=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(2.4);state.life=0;
    this.fragments.push(piece);this.pendingBroken++;
  }
  render(time,dt){
    const holding=time<this.holdUntil;
    if(holding&&this.pressedPiece&&!this.preview)this.damage(this.pressedPiece,dt*.95*this.pressure,time);
    for(const piece of this.model.pieces)if(piece.userData.intact&&piece.userData.detachAt!==null&&time>=piece.userData.detachAt)this.detach(piece);
    const softness=this.preview||this.remaining<30?1:.55;
    const target=holding ? .29*this.pressure*softness : 0;
    const compression=springStep(this.compression,this.compressionVelocity,target,dt,this.reducedMotion);
    this.compression=compression.value;this.compressionVelocity=compression.velocity;
    const dent=springStep(this.dent,this.dentVelocity,holding ? .32*this.pressure : 0,dt,this.reducedMotion);
    this.dent=dent.value;this.dentVelocity=dent.velocity;this.softUniforms.softDent.value=this.dent;
    const scale=squishScale(this.compression);
    this.stretch+=(this.pullTarget-this.stretch)*(1-Math.exp(-dt*14));
    const elongation=1+this.stretch*.65;
    this.model.root.scale.set(scale.x*elongation,scale.y/Math.sqrt(elongation),scale.z/Math.sqrt(elongation));
    if(this.torn){
      this.tearTime+=dt;const t=this.reducedMotion?1:Math.min(1,this.tearTime/.65),ease=1-Math.pow(1-t,3);
      this.softUniforms.softDent.value=0;
      for(const half of this.halves.children){const side=half.userData.side;half.position.x=side*(.08+ease*.57);half.rotation.y=-side*(Math.PI/2-ease*.62);half.rotation.z=side*Math.sin(t*Math.PI)*.06;}
    }
    this.model.root.rotation.set(this.tilt,this.rotation,0);
    // Anchor the lower edge to the plate instead of letting the compressed mochi float.
    const radius=this.preview||!this.remaining ? .643 : .674;
    this.model.root.position.y=-1.04+radius*scale.y/Math.sqrt(elongation);
    for(const p of this.fragments){
      const state=p.userData;state.life+=dt;
      if(this.reducedMotion){p.scale.setScalar(Math.max(0,1-state.life*2));if(state.life>.5)p.visible=false;continue;}
      if(!p.visible)continue;
      state.velocity.y-=4.6*dt;p.position.addScaledVector(state.velocity,dt);
      p.rotation.x+=state.spin.x*dt;p.rotation.y+=state.spin.y*dt;p.rotation.z+=state.spin.z*dt;
      p.updateMatrixWorld(true);const bounds=p.geometry.boundingBox.clone().applyMatrix4(p.matrixWorld);
      if(bounds.min.y < -1.04 && Math.hypot(p.position.x,p.position.z)<1.4){p.position.y+=-1.04-bounds.min.y;state.velocity.y=Math.abs(state.velocity.y)*.1;state.velocity.x*=.75;state.velocity.z*=.75;state.spin.multiplyScalar(.5);}
      if(state.life>6)p.scale.setScalar(Math.max(0,7-state.life));
      if(state.life>7)p.visible=false;
    }
    this.renderer.render(this.scene,this.camera);
  }
  async exportGLB(){
    const model=createMochi(this.flavor);
    if(this.torn){model.shell.visible=false;model.coat.visible=false;model.skin.visible=false;model.cutaway.visible=false;createTornHalves(model);model.root.name+='-torn';}
    else if(this.preview){model.shell.visible=false;model.coat.visible=false;model.skin.visible=false;model.cutaway.visible=true;model.root.name+='-cutaway';}
    else{model.coat.visible=false;model.pieces.forEach(p=>{p.visible=true;p.children[0].visible=false;});}
    try{
      // The exporter merges roughness via Canvas2D, which needs canvas images instead of DataTexture buffers.
      const converted=new Map();
      model.root.traverse(mesh=>{if(!mesh.material)return;for(const mat of Array.isArray(mesh.material)?mesh.material:[mesh.material])for(const [key,value] of Object.entries(mat)){
        if(!value?.isDataTexture)continue;
        if(!converted.has(value)){
          const {data,width,height}=value.image,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
          canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data),width,height),0,0);
          const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=value.colorSpace;texture.flipY=value.flipY;texture.wrapS=value.wrapS;texture.wrapT=value.wrapT;texture.repeat.copy(value.repeat);texture.offset.copy(value.offset);converted.set(value,texture);
        }
        mat[key]=converted.get(value);
      }});
      converted.forEach((_,original)=>original.dispose());
      return await new GLTFExporter().parseAsync(model.root,{binary:true,onlyVisible:true});
    }
    finally{disposeModel(model.root);}
  }
}
