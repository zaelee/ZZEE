import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canTear,PullGesture} from './pull-gesture.js';
test('tear unlocks only after at least eighty percent of current shell is removed',()=>{
  assert.equal(canTear(13,64),false);assert.equal(canTear(12,64),true);assert.equal(canTear(0,64),true);assert.equal(canTear(0,0),false);
});
test('pull needs both distance and outward speed, slow stretching and release do not tear',()=>{
  const p=new PullGesture();p.begin([{x:100}],0);
  assert.equal(p.move([{x:140}],50,500).strong,false);
  assert.equal(p.move([{x:210}],150,500).strong,true);
  p.begin([{x:100}],0);for(let i=1;i<=12;i++)assert.equal(p.move([{x:100+i*10}],i*150,500).strong,false);
  p.cancel();assert.equal(p.move([{x:400}],1900,500).strong,false);
});
test('two-hand separation works independent of hand order and rejects lost tracking',()=>{
  const p=new PullGesture();p.begin([{x:200},{x:300}],0);
  assert.equal(p.move([{x:370},{x:130}],150,500).strong,true);
  p.begin([{x:200},{x:300}],0);assert.equal(p.move([{x:80},{x:420}],400,500).strong,false);
});

test('stationary render frames do not turn a slow stepped drag into a fast yank',()=>{
  const p=new PullGesture();p.begin([{x:0}],0);
  for(let i=1;i<=20;i++){const time=i*100;for(let j=1;j<=5;j++)p.move([{x:(i-1)*10}],time-100+j*16,500);assert.equal(p.move([{x:i*10}],time,500).strong,false);}
});
