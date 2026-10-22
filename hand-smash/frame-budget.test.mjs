import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FrameBudget} from './frame-budget.js';
test('mobile active rendering is capped near 30fps, idle work near 6fps',()=>{
 const budget=new FrameBudget(true);let active=0;
 for(let t=0;t<1000;t+=1000/60)active+=budget.due(t,true,true);
 assert.ok(active>=29&&active<=31);
 const idle=new FrameBudget(true);let frames=0;for(let t=0;t<1000;t+=1000/60)frames+=idle.due(t,true,false);
 assert.ok(frames>=6&&frames<=7);
});
test('hidden frames do no rendering and returning input renders immediately',()=>{
 const budget=new FrameBudget(true);assert.equal(budget.due(0,true,true),true);
 assert.equal(budget.due(20,false,true),false);assert.equal(budget.due(21,true,true),true);
 const desktop=new FrameBudget(false);assert.equal(desktop.due(0,true,true),true);assert.equal(desktop.due(8,true,true),true);
});
