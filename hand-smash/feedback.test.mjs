import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waxSamples,vibrationPattern} from './feedback.js';
import {HoldReveal,FistReveal} from './reveal-gesture.js';
import {coverPoint} from './physics.js';
const random=()=>{let seed=17;return()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);};
test('wax audio is finite, bounded, fades out, and distinguishes cracks from flakes and tear',()=>{
 const variants=['crack','break','tear'].map(kind=>waxSamples(48000,8,kind,random()));
 for(const samples of variants){assert.ok(samples.some(v=>Math.abs(v)>.1));assert.ok(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=.801));assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)),0);}
 assert.ok(variants[0].length<variants[1].length&&variants[1].length<variants[2].length);
 assert.notDeepEqual(waxSamples(48000,1,'break',random()),variants[1]);
 assert.ok(vibrationPattern(1).reduce((a,b)=>a+b)<vibrationPattern(8).reduce((a,b)=>a+b));assert.ok(vibrationPattern(64).reduce((a,b)=>a+b)<60);
});
test('cutaway needs a continuous five-second hold and cancels on dragging or release',()=>{
 const hold=new HoldReveal();assert.equal(hold.ready(9000),false);
 hold.begin({x:20,y:20},0);assert.equal(hold.ready(4999),false);assert.equal(hold.ready(5000),true);assert.equal(hold.ready(6000),false);
 hold.begin({x:0,y:0},0);hold.move({x:19,y:0});assert.equal(hold.ready(6000),false);
 hold.begin({x:0,y:0},0);hold.cancel();assert.equal(hold.ready(6000),false);
});
test('steady single fist reveals once per close; tracking loss resets the dwell',()=>{
 const fist=new FistReveal();assert.equal(fist.update(true,0),false);assert.equal(fist.update(true,219),false);assert.equal(fist.update(true,220),true);assert.equal(fist.update(true,1000),false);
 fist.update(false,1050);assert.equal(fist.update(true,1100),false);assert.equal(fist.update(true,1320),true);
});
test('rear camera coordinates are unmirrored with the same cover crop',()=>{
 const front=coverPoint({x:.25,y:.5},1280,720,390,844,true),rear=coverPoint({x:.25,y:.5},1280,720,390,844,false);
 assert.ok(front.x>rear.x);assert.ok(Math.abs(front.x+rear.x-390)<.001);assert.equal(front.y,rear.y);
});
