import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waxSamples,vibrationPattern} from './feedback.js';
import {HoldTear,FistTear} from './reveal-gesture.js';
import {coverPoint} from './physics.js';
const random=()=>{let seed=17;return()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);};
test('wax audio is finite, bounded, fades out, and distinguishes cracks from flakes and tear',()=>{
 const variants=['crack','break','tear'].map(kind=>waxSamples(48000,8,kind,random()));
 for(const samples of variants){assert.ok(samples.some(v=>Math.abs(v)>.1));assert.ok(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=.801));assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)),0);}
 assert.ok(variants[0].length<variants[1].length&&variants[1].length<variants[2].length);
 assert.notDeepEqual(waxSamples(48000,1,'break',random()),variants[1]);
 assert.ok(vibrationPattern(1).reduce((a,b)=>a+b)<vibrationPattern(8).reduce((a,b)=>a+b));assert.ok(vibrationPattern(64).reduce((a,b)=>a+b)<60);
});
test('tearing needs a continuous ten-second hold and cancels on dragging or release',()=>{
 const hold=new HoldTear();assert.equal(hold.ready(9000),false);
 hold.begin({x:20,y:20},0);assert.equal(hold.ready(5000),false);assert.equal(hold.ready(9999),false);assert.equal(hold.ready(10000),true);assert.equal(hold.ready(11000),false);
 hold.begin({x:0,y:0},0);hold.move({x:19,y:0});assert.equal(hold.ready(11000),false);
 hold.begin({x:0,y:0},0);hold.cancel();assert.equal(hold.ready(11000),false);
});
test('fist needs ten seconds on the same hand; tracking loss or hand switch resets it',()=>{
 const fist=new FistTear();
 for(let time=0;time<10000;time+=100)assert.equal(fist.update(true,time,'Left'),false);
 assert.equal(fist.update(true,10000,'Left'),true);assert.equal(fist.update(true,10100,'Left'),false);
 fist.update(false,10200,'Left');assert.equal(fist.update(true,10300,'Left'),false);
 assert.equal(fist.update(true,10700,'Left'),false);assert.equal(fist.since,10700);
 fist.update(true,10800,'Right');assert.equal(fist.since,10800);
});
test('rear camera coordinates are unmirrored with the same cover crop',()=>{
 const front=coverPoint({x:.25,y:.5},1280,720,390,844,true),rear=coverPoint({x:.25,y:.5},1280,720,390,844,false);
 assert.ok(front.x>rear.x);assert.ok(Math.abs(front.x+rear.x-390)<.001);assert.equal(front.y,rear.y);
});
