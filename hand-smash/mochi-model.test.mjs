import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createMochi,disposeModel,FLAVORS} from './mochi-model.js';
import {mochiPoint,fractureCells,WAX_COUNT,visibleHit,visibleMeshes} from './wax-geometry.js';
test('whole mochi is squat with a flattened base and separate cutaway',()=>{
  const model=createMochi(),box=new THREE.Box3().setFromObject(model.skin);
  assert.ok(box.max.x-box.min.x>2);assert.ok(box.max.y-box.min.y<1.5);
  assert.ok(model.skin.visible);assert.equal(model.cutaway.visible,false);
  assert.ok(Math.abs(mochiPoint(new THREE.Vector3(0,-1,0)).y-mochiPoint(new THREE.Vector3(.2,-1,.2)).y)<.015);
  disposeModel(model.root);
});
test('irregular cells form polygons of different sizes with thin translucent material',()=>{
  const cells=fractureCells();assert.equal(cells.length,WAX_COUNT);
  assert.ok(new Set(cells.map(c=>c.vertices.length)).size>1);
  for(const flavor of Object.keys(FLAVORS)){
    const model=createMochi(flavor),sizes=[];assert.equal(model.pieces.length,WAX_COUNT);
    assert.ok(model.coat.material.transmission>.5);assert.ok(model.coat.material.thickness<.05);
    for(const piece of model.pieces){
      const p=piece.geometry.getAttribute('position'),n=piece.geometry.getAttribute('normal');
      assert.ok(p.count>100);assert.equal(p.count,n.count);assert.ok([...p.array,...n.array].every(Number.isFinite));
      assert.equal(piece.userData.intact,true);sizes.push(piece.geometry.boundingSphere.radius);
    }
    assert.ok(Math.max(...sizes)/Math.min(...sizes)>1.4);disposeModel(model.root);
  }
});
test('visible wax is hit before whole mochi, hidden cutaway never blocks it',()=>{
  const model=createMochi();model.root.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(.13,.1,5),new THREE.Vector3(0,0,-1));
  const initialHits=ray.intersectObject(model.root,true);
  assert.equal(visibleHit([{object:new THREE.Line()},...initialHits]).object.name,'unbroken-translucent-wax');
  model.coat.visible=false;model.shell.visible=false;
  assert.equal(visibleHit(ray.intersectObject(model.root,true)).object.name,'rice-dough-whole');
  model.skin.visible=false;model.cutaway.visible=true;
  assert.notEqual(visibleHit(ray.intersectObject(model.root,true)).object.name,'rice-dough-whole');disposeModel(model.root);
});

test('visible-only raycasting skips hidden fruit triangles but preserves the nearest hit',()=>{
 const model=createMochi();model.root.updateMatrixWorld(true);let hiddenCalls=0;
 model.cutaway.traverse(o=>{if(o.isMesh){o.raycast=()=>hiddenCalls++;}});
 const ray=new THREE.Raycaster(new THREE.Vector3(.13,.1,5),new THREE.Vector3(0,0,-1));
 assert.equal(visibleHit(ray.intersectObjects(visibleMeshes(model.root),false)).object.name,'unbroken-translucent-wax');assert.equal(hiddenCalls,0);
 model.coat.visible=false;assert.equal(visibleHit(ray.intersectObjects(visibleMeshes(model.root),false)).object.name,'rice-dough-whole');assert.equal(hiddenCalls,0);disposeModel(model.root);
});
test('mobile dome keeps its silhouette with fewer triangles and hidden unused crack lines',()=>{
 const full=createMochi(),mobile=createMochi('strawberry',true);
 assert.ok(mobile.coat.geometry.index.count<full.coat.geometry.index.count*.3);
 for(const axis of ['x','y','z'])assert.ok(Math.abs(mobile.coat.geometry.boundingBox.max[axis]-full.coat.geometry.boundingBox.max[axis])<.02);
 assert.ok(mobile.pieces.every(p=>!p.children[0].visible));disposeModel(full.root);disposeModel(mobile.root);
});
