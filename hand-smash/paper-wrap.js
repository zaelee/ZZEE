import * as THREE from 'three';
// Procedural hanji folds inspired by the reference packaging; no copied photo assets.
export function createPaperWrap(flavor='strawberry'){
  const root=new THREE.Group();root.name='hanji-package';root.scale.setScalar(.84);root.position.y=-.15;
  const colors={strawberry:0x983a50,mandarin:0xda831e,kiwi:0xc8a52c};
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#bdb5a4';ctx.fillRect(0,0,256,256);
  let seed=91;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for(let i=0;i<4500;i++){const x=random()*256,y=random()*256;ctx.strokeStyle=random()>.5?'#ffffff35':'#453c3420';ctx.lineWidth=.3+random()*.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*12-6,y+random()*5);ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  const paper=new THREE.MeshStandardMaterial({color:colors[flavor]||colors.strawberry,roughness:1,bumpMap:texture,bumpScale:.022,side:THREE.DoubleSide,transparent:true});paper.forceSinglePass=true;
  const profile=[[-1.02,.22],[-.84,.88],[-.5,1.16],[-.1,1.22],[.3,1.06],[.62,.69],[.86,.28],[1.03,.39],[1.24,.62],[1.48,.71]];
  const panels=[];
  for(let panel=0;panel<4;panel++){
    const positions=[],uv=[],indices=[],columns=16,rows=27;
    for(let y=0;y<=rows;y++){
      const t=y/rows*(profile.length-1),k=Math.min(profile.length-2,Math.floor(t)),mix=t-k;
      const height=THREE.MathUtils.lerp(profile[k][0],profile[k+1][0],mix),base=THREE.MathUtils.lerp(profile[k][1],profile[k+1][1],mix);
      for(let x=0;x<=columns;x++){
        const angle=(panel+x/columns)*Math.PI/2;
        const pleat=Math.sin(angle*19+height*2)*.045+Math.sin(angle*37-height*7)*.023;
        const radius=base+pleat*(height>.6?1.6:1);
        const edge=y===rows?Math.sin(angle*7)*.15+Math.cos(angle*13)*.07:0;
        positions.push(Math.cos(angle)*radius,height+edge,Math.sin(angle)*radius);
        uv.push((panel+x/columns)/2,y/rows*2);
        if(y<rows&&x<columns){const a=y*(columns+1)+x,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,paper);mesh.name=`hanji-fold-${panel}`;mesh.userData.angle=(panel+.5)*Math.PI/2;root.add(mesh);panels.push(mesh);
  }
  const tie=new THREE.Mesh(new THREE.TorusGeometry(.3,.024,6,40),new THREE.MeshStandardMaterial({color:0xcbb68d,roughness:.95}));tie.rotation.x=Math.PI/2;tie.position.y=.86;root.add(tie);
  const label=document.createElement('canvas');label.width=256;label.height=384;const lc=label.getContext('2d');lc.fillStyle='#f5edda';lc.fillRect(0,0,256,384);lc.fillStyle='#5c4c39';lc.textAlign='center';lc.font='22px serif';lc.fillText('한 정 선',128,65);lc.font='12px sans-serif';lc.fillText('HANJUNGSEON',128,92);lc.fillStyle=flavor==='strawberry'?'#af4057':flavor==='mandarin'?'#df8c29':'#bda232';lc.beginPath();lc.ellipse(128,186,44,52,0,0,Math.PI*2);lc.fill();lc.fillStyle='#5b7442';lc.fillRect(125,121,6,18);lc.fillStyle='#5c4c39';lc.font='20px sans-serif';lc.fillText({strawberry:'딸기 찹쌀떡',mandarin:'통귤 찹쌀떡',kiwi:'골드키위 찹쌀떡'}[flavor]||'과일찹쌀떡',128,290);lc.font='12px sans-serif';lc.fillText('FRUIT MOCHI',128,322);
  const labelTexture=new THREE.CanvasTexture(label);labelTexture.colorSpace=THREE.SRGBColorSpace;
  const tag=new THREE.Mesh(new THREE.PlaneGeometry(.43,.65),new THREE.MeshStandardMaterial({map:labelTexture,roughness:1,side:THREE.DoubleSide}));tag.position.set(.25,.28,1.33);tag.rotation.z=-.13;tag.rotation.x=-.1;root.add(tag);
  root.userData={panels,paper,tie,tag};return root;
}
export function openPaperWrap(root,progress){
  const t=1-Math.pow(1-progress,3);
  for(const panel of root.userData.panels){const a=panel.userData.angle;panel.position.set(Math.cos(a)*t*1.4,-t*.55,Math.sin(a)*t*1.4);panel.rotation.set(Math.sin(a)*t*.9,0,-Math.cos(a)*t*.9);}
  root.userData.paper.opacity=1-Math.max(0,(progress-.5)*2);
  root.userData.tie.scale.setScalar(Math.max(0,1-progress*3));root.userData.tag.scale.setScalar(Math.max(0,1-progress*2));
}
