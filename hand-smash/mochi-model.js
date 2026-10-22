import * as THREE from 'three';
import {organicMaps,planarUV} from './material-textures.js';

export const FLAVORS = {
  strawberry: { label: '딸기 찹쌀떡', wax: 0xf4a9b8, fruit: 0xd92b42, bean: 0x613934 },
  mandarin: { label: '통귤 찹쌀떡', wax: 0xffbf73, fruit: 0xff9b27, bean: 0xe7d4a7 },
  kiwi: { label: '골드키위 찹쌀떡', wax: 0xd8d88e, fruit: 0xe8c33b, bean: 0xe2c994 },
};
const material = (color, roughness = .55) => new THREE.MeshStandardMaterial({ color, roughness });
export {createShellGeometry} from './wax-geometry.js';
import {mochiPoint,createMochiSurface,fractureCells,createShellGeometry} from './wax-geometry.js';

function circle(group,radius,color,z,sy=1){
  const mesh=new THREE.Mesh(new THREE.CircleGeometry(radius,96),material(color,.6));
  mesh.position.z=z;mesh.scale.y=sy;group.add(mesh);return mesh;
}
function strawberryShape(){
  const shape=new THREE.Shape();
  shape.moveTo(0,-.69);shape.bezierCurveTo(-.16,-.59,-.66,.03,-.6,.34);
  shape.bezierCurveTo(-.58,.64,-.19,.72,.015,.65);shape.bezierCurveTo(.22,.7,.59,.61,.6,.34);
  shape.bezierCurveTo(.66,.03,.16,-.59,0,-.69);return shape;
}
function addStrawberry(group){
  const maps=organicMaps('strawberry',512),shape=strawberryShape();
  const geometry=planarUV(new THREE.ExtrudeGeometry(shape,{depth:.045,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.018,bevelThickness:.018,curveSegments:48}));
  const flesh=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({...maps,roughness:1,bumpScale:.009,clearcoat:.5,clearcoatRoughness:.18,ior:1.36}));
  flesh.position.set(0,.025,.063);flesh.name='strawberry-flesh';group.add(flesh);
  const seedGeometry=new THREE.SphereGeometry(1,12,8),seedMat=new THREE.MeshStandardMaterial({color:0xd7ac67,roughness:.48});
  for(let row=0;row<14;row++){
    const y=-.55+row*.083,half=y<.2?.6*(y+.69)/.89:.57*(1-.45*(y-.2));
    for(const side of [-1,1]){
      const seed=new THREE.Mesh(seedGeometry,seedMat);seed.scale.set(.007,.014,.004);
      seed.position.set(side*half*.96,y+.025,.121);seed.rotation.z=side*(-.2+Math.sin(row*4)*.2);group.add(seed);
    }
  }
}
function addMandarin(group){
  const pulpMaps=organicMaps('mandarin');const pulpMaterial=new THREE.MeshPhysicalMaterial({...pulpMaps,roughness:1,bumpScale:.008,clearcoat:.5,clearcoatRoughness:.23});
  circle(group,.68,0xffe1a1,.10,.98);
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5+.023,b=(i+1)*Math.PI/5-.023;
    const shape=new THREE.Shape();shape.moveTo(.07*Math.cos(a),.07*Math.sin(a));shape.lineTo(.63*Math.cos(a),.63*Math.sin(a));shape.absarc(0,0,.63,a,b,false);shape.lineTo(.07*Math.cos(b),.07*Math.sin(b));shape.closePath();
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,steps:1}),pulpMaterial);planarUV(mesh.geometry);mesh.position.z=.13;group.add(mesh);
    for(let j=0;j<12;j++){
      const angle=a+(b-a)*(j%3+1)/4,r=.17+Math.floor(j/3)*.115;
      const pulp=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),material(0xffd26a,.35));
      pulp.position.set(Math.cos(angle)*r,Math.sin(angle)*r,.188);pulp.scale.set(.016,.045,.009);pulp.rotation.z=angle-Math.PI/2;group.add(pulp);
    }
  }
  circle(group,.075,0xffedbe,.19);
}
function addKiwi(group){
  circle(group,.69,0x997139,.08);circle(group,.66,0xe0b936,.09);const flesh=circle(group,.6,0xeace53,.10);flesh.material.dispose();flesh.material=new THREE.MeshPhysicalMaterial({...organicMaps('kiwi',512),roughness:1,bumpScale:.006,clearcoat:.4,clearcoatRoughness:.2});
  circle(group,.21,0xffefb0,.12,.84);
  const lineMat=new THREE.LineBasicMaterial({color:0xf6e483,transparent:true,opacity:.15});
  const seedGeo=new THREE.SphereGeometry(1,8,6),seedMat=material(0x342a20,.35);
  for(let i=0;i<76;i++){
    const a=i*Math.PI*2/76;
    const points=[new THREE.Vector3(Math.cos(a)*.22,Math.sin(a)*.22,.118),new THREE.Vector3(Math.cos(a)*.61,Math.sin(a)*.61,.118)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),lineMat));
    const seed=new THREE.Mesh(seedGeo,seedMat),r=.29+(i%3)*.035;
    seed.position.set(Math.cos(a)*r,Math.sin(a)*r,.132);seed.scale.set(.014,.026,.009);seed.rotation.z=a-Math.PI/2;group.add(seed);
  }
}
export function createMochi(flavor='strawberry') {
  const config=FLAVORS[flavor]||FLAVORS.strawberry;
  const root=new THREE.Group();root.name='Hanjungsun-inspired-wax-mochi';
  const core=new THREE.Group();core.name='mochi-and-fruit';root.add(core);
  const doughMaps=organicMaps('dough');
  const doughMaterial=new THREE.MeshPhysicalMaterial({...doughMaps,roughness:1,bumpScale:.011,sheen:.22,sheenColor:new THREE.Color(0xffecdc),sheenRoughness:.85});
  const skin=new THREE.Group();skin.name='whole-rounded-mochi';core.add(skin);
  const whole=new THREE.Mesh(createMochiSurface(),doughMaterial);whole.name='rice-dough-whole';skin.add(whole);
  const cutaway=new THREE.Group();cutaway.name='fruit-cutaway';cutaway.visible=false;core.add(cutaway);
  const dome=new THREE.Mesh(createMochiSurface(0,true),doughMaterial);dome.name='rice-dough-cut';cutaway.add(dome);
  const outline=[];for(let i=0;i<160;i++){const a=i*Math.PI*2/160;const p=mochiPoint(new THREE.Vector3(Math.cos(a),Math.sin(a),0));outline.push(new THREE.Vector2(p.x,p.y));}
  const shape=new THREE.Shape(outline),cap=new THREE.Mesh(new THREE.ShapeGeometry(shape),doughMaterial);cap.position.z=.01;cap.name='mochi-cut-surface';cutaway.add(cap);
  const lipPath=new THREE.CatmullRomCurve3(outline.map(p=>new THREE.Vector3(p.x*.95,p.y*.95,.025)),true);
  const lip=new THREE.Mesh(new THREE.TubeGeometry(lipPath,160,.055,12,true),doughMaterial);lip.name='soft-rounded-rice-edge';cutaway.add(lip);
  const filling=new THREE.Group();filling.scale.set(.96,.83,1);filling.position.y=.025;cutaway.add(filling);
  const bean=circle(filling,.92,config.bean,.035,.9);bean.name='bean-paste';
  bean.material.dispose();bean.material=new THREE.MeshStandardMaterial({...organicMaps('bean',512),roughness:1,bumpScale:.009,color:flavor==='strawberry'?0xffffff:0xe8d4b6});
  if(flavor==='strawberry')addStrawberry(filling);else if(flavor==='mandarin')addMandarin(filling);else addKiwi(filling);
  const shell=new THREE.Group();shell.name='wax-shell';root.add(shell);
  const shellMat=new THREE.MeshPhysicalMaterial({color:new THREE.Color(config.wax).lerp(new THREE.Color(0xfff8ec),.45),roughness:.32,metalness:0,transmission:.66,thickness:.028,ior:1.43,attenuationColor:new THREE.Color(config.wax),attenuationDistance:.3,clearcoat:.25,clearcoatRoughness:.3,bumpMap:doughMaps.bumpMap,bumpScale:.002,side:THREE.DoubleSide});
  const coat=new THREE.Mesh(createMochiSurface(.031),shellMat);coat.name='unbroken-translucent-wax';root.add(coat);
  const pieces=[];
  for(const cell of fractureCells()){
    const {geometry,center,crackPoints}=createShellGeometry(cell.vertices);
    const mesh=new THREE.Mesh(geometry,shellMat);mesh.position.copy(center);mesh.name=`wax-fragment-${pieces.length}`;mesh.visible=false;
    const crack=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(crackPoints),new THREE.LineBasicMaterial({color:0xfff5eb,transparent:true,opacity:0,depthWrite:false}));crack.name='wax-crack';crack.renderOrder=4;mesh.add(crack);
    mesh.userData={intact:true,home:center.clone(),damage:0,detachAt:null,sides:cell.vertices.length};shell.add(mesh);pieces.push(mesh);
  }

  return {root,core,skin,cutaway,shell,coat,pieces,config};
}
export function disposeModel(root){
  const geometries=new Set(),materials=new Set();
  root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)for(const m of Array.isArray(object.material)?object.material:[object.material])materials.add(m);});
  const textures=new Set();materials.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture)textures.add(v);});textures.forEach(t=>t.dispose());
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}

export function createTornHalves(model){
  const group=new THREE.Group();group.name='torn-mochi-halves';
  for(const side of [-1,1]){
    const half=model.cutaway.clone(true);half.visible=true;half.name=side<0?'left-mochi-half':'right-mochi-half';
    half.userData.side=side;half.position.x=side*.65;half.rotation.y=-side*.95;group.add(half);
  }
  model.root.add(group);return group;
}
