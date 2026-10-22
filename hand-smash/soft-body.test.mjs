import {test} from 'node:test';
import assert from 'node:assert/strict';
import {springStep,squishScale} from './soft-body.js';
test('held pressure reaches target and release rebounds then settles',()=>{
  let state={value:0,velocity:0};
  for(let i=0;i<120;i++)state=springStep(state.value,state.velocity,.29,1/60);
  assert.ok(Math.abs(state.value-.29)<.001);
  let rebound=false;
  for(let i=0;i<180;i++){state=springStep(state.value,state.velocity,0,1/60);if(state.value<-.005)rebound=true;}
  assert.ok(rebound);assert.ok(Math.abs(state.value)<.0001);assert.ok(Math.abs(state.velocity)<.001);
});
test('squish preserves volume and remains finite across dropped frames',()=>{
  for(const amount of [-.5,0,.2,.36,1]){const s=squishScale(amount);assert.ok(Math.abs(s.x*s.y*s.z-1)<1e-12);assert.ok(s.y>0);}
  const s=springStep(.2,8,0,1);assert.ok(Number.isFinite(s.value));
});
test('reduced motion restores without oscillating',()=>{
  let state={value:.3,velocity:3};
  for(let i=0;i<120;i++){state=springStep(state.value,state.velocity,0,1/60,true);assert.ok(state.value>=0);}
  assert.ok(state.value<1e-6);assert.equal(state.velocity,0);
});
