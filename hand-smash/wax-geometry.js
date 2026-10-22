import * as THREE from 'three';
import {ConvexHull} from 'three/addons/math/ConvexHull.js';
export const WAX_COUNT=64;
export function mochiPoint(direction,coat=0){
  const d=direction.clone().normalize(),angle=Math.atan2(d.z,d.x);
  const shoulder=1+.025*Math.sin(angle*3+.4)*(1-d.y*d.y)+.012*Math.cos(angle*7)*Math.pow(1-d.y*d.y,2);
  let y=d.y*.76;
  if(y<-.48)y=-.48+.16*Math.tanh((y+.48)/.16);
  y-=.025*Math.max(0,d.y)*Math.exp(-(d.x*d.x+d.z*d.z)*12);
  return new THREE.Vector3(d.x*1.055*shoulder,y,d.z*.965*shoulder).addScaledVector(d,coat);
}
export function mochiNormal(direction){
  const d=direction.clone().normalize(),t=new THREE.Vector3().crossVectors(d,Math.abs(d.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize(),b=new THREE.Vector3().crossVectors(d,t);
  const p=mochiPoint(d),a=mochiPoint(d.clone().addScaledVector(t,.0005)).sub(p),c=mochiPoint(d.clone().addScaledVector(b,.0005)).sub(p);
  return a.cross(c).normalize();
}
export function createMochiSurface(coat=0,half=false){
  const g=new THREE.SphereGeometry(1,96,64,0,Math.PI*2,0,half?Math.PI/2:Math.PI);
  if(half)g.rotateX(-Math.PI/2);
  const p=g.getAttribute('position'),n=g.getAttribute('normal');
  for(let i=0;i<p.count;i++){const direction=new THREE.Vector3().fromBufferAttribute(p,i),point=mochiPoint(direction,coat),normal=mochiNormal(direction);p.setXYZ(i,...point.toArray());n.setXYZ(i,...normal.toArray());}
  g.computeBoundingBox();g.computeBoundingSphere();return g;
}
export function fractureCells(count=WAX_COUNT){
  let state=72841;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const seeds=Array.from({length:count},(_,i)=>{
    const y=1-2*(i+.5)/count,a=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-y*y);
    return new THREE.Vector3(Math.cos(a)*r+(random()-.5)*.24,y+(random()-.5)*.2,Math.sin(a)*r+(random()-.5)*.24).normalize();
  });
  const hull=new ConvexHull().setFromPoints(seeds),cells=seeds.map(seed=>({seed,vertices:[]}));
  for(const face of hull.faces){let edge=face.edge;do{const index=seeds.indexOf(edge.head().point);cells[index].vertices.push(face.normal.clone().normalize());edge=edge.next;}while(edge!==face.edge);}
  for(const cell of cells){
    const t=new THREE.Vector3().crossVectors(cell.seed,new THREE.Vector3(0,1,0)).normalize(),b=new THREE.Vector3().crossVectors(cell.seed,t);
    cell.vertices.sort((a,c)=>Math.atan2(a.dot(b),a.dot(t))-Math.atan2(c.dot(b),c.dot(t)));
  }
  return cells;
}
// Shared endpoints produce the same jagged border for both neighboring cells.
function edgePoints(a,b){
  const forward=a.x<b.x||(a.x===b.x&&a.y<b.y),start=forward?a:b,end=forward?b:a;
  const across=new THREE.Vector3().crossVectors(start,end).normalize();
  const phase=Math.sin(start.x*83+end.y*61+start.z*37)*2;
  const points=[0,1/3,2/3,1].map(t=>start.clone().lerp(end,t).normalize().addScaledVector(across,.012*Math.sin(Math.PI*t)*Math.sin(t*7+phase)).normalize());
  return forward?points:points.reverse();
}
export function createShellGeometry(vertices){
  const centerDirection=vertices.reduce((sum,v)=>sum.add(v),new THREE.Vector3()).normalize();
  const center=mochiPoint(centerDirection,.031),border=[];
  for(let i=0;i<vertices.length;i++)border.push(...edgePoints(vertices[i],vertices[(i+1)%vertices.length]).slice(0,-1));
  const positions=[],normals=[],uv=[];
  function triangle(a,b,c,inside=false,side=false){
    const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    for(const p of [a,b,c]){positions.push(p.x-center.x,p.y-center.y,p.z-center.z);const n=side?normal:mochiNormal(new THREE.Vector3(p.x/1.055,p.y/.76,p.z/.965)).multiplyScalar(inside?-1:1);normals.push(...n.toArray());uv.push(p.x*.5+.5,p.y*.5+.5);}
  }
  const outer=d=>mochiPoint(d,.031),inner=d=>mochiPoint(d,.008);
  function subdivide(a,b,c,depth){
    if(!depth){triangle(outer(a),outer(b),outer(c));triangle(inner(c),inner(b),inner(a),true);return;}
    const ab=a.clone().add(b).normalize(),bc=b.clone().add(c).normalize(),ca=c.clone().add(a).normalize();
    subdivide(a,ab,ca,depth-1);subdivide(ab,b,bc,depth-1);subdivide(ca,bc,c,depth-1);subdivide(ab,bc,ca,depth-1);
  }
  for(let i=0;i<border.length;i++){
    const a=border[i].clone().lerp(centerDirection,-.0001).normalize(),b=border[(i+1)%border.length].clone().lerp(centerDirection,-.0001).normalize();
    subdivide(centerDirection,a,b,2);
    for(let j=0;j<4;j++){const u=a.clone().lerp(b,j/4).normalize(),v=a.clone().lerp(b,(j+1)/4).normalize();triangle(outer(u),inner(u),outer(v),false,true);triangle(outer(v),inner(u),inner(v),false,true);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const crackPoints=[];for(let i=0;i<border.length;i++)for(let j=0;j<4;j++)crackPoints.push(mochiPoint(border[i].clone().lerp(border[(i+1)%border.length],j/4).normalize(),.034).sub(center));
  return {geometry,center,crackPoints};
}
export function visibleHit(intersections){
  return intersections.find(hit=>{if(!hit.object.isMesh)return false;for(let o=hit.object;o;o=o.parent)if(!o.visible)return false;return true;});
}
