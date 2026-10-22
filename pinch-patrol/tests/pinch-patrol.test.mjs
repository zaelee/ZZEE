import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,W,H,handInput,cameraPoint} from '../game-core.mjs';

test('mirrored cover mapping aligns the center and landscape crop',()=>{
  assert.deepEqual(cameraPoint({x:.5,y:.5},640,480),{x:480,y:300});
  assert.deepEqual(cameraPoint({x:0,y:.5},640,480),{x:960,y:300});
  assert.equal(cameraPoint({x:.5,y:0},640,480).y,-60);
});
test('pinch uses palm scale, hysteresis and pixel aspect',()=>{
  const p=Array.from({length:21},()=>({x:.5,y:.5}));
  p[5]={x:.4,y:.5};p[17]={x:.6,y:.5};p[4]={x:.5,y:.5};p[8]={x:.57,y:.5};
  assert.equal(handInput(p,false).pinch,true);
  p[8].x=.6;assert.equal(handInput(p,false).pinch,false);assert.equal(handInput(p,true).pinch,true);
  p[8].x=.65;assert.equal(handInput(p,true).pinch,false);
  assert.equal(handInput(null,false),null);
  p[17]=p[5];assert.equal(handInput(p,false),null);
});
test('movement is frame rate independent and bounded',()=>{
  const a=new Game(()=>.5),b=new Game(()=>.5);
  for(let i=0;i<60;i++)a.update(1/60,{dx:1});
  for(let i=0;i<30;i++)b.update(1/30,{dx:1});
  assert.ok(Math.abs(a.player.x-b.player.x)<.01);
  for(let i=0;i<90;i++)a.update(1/60,{dx:1,dy:1});
  assert.equal(a.player.x,W-25);assert.equal(a.player.y,H-28);
});
test('holding fire repeats, releasing stops and bullets destroy enemies',()=>{
  const g=new Game(()=>.5);g.enemies=[];g.waveWait=-100;
  for(let i=0;i<30;i++)g.update(1/60,{fire:true});
  assert.ok(g.bullets.length>=6);
  const n=g.bullets.length;g.update(1/60,{fire:false});assert.equal(g.bullets.length,n);
  const target={x:480,y:100,homeX:480,homeY:100,col:0,type:0,hp:1,dive:null};
  g.enemies=[target];g.bullets=[{x:480+Math.sin((g.time+.01)*1)*95,y:108}];
  g.update(.01,{});assert.equal(g.enemies.length,0);assert.equal(g.score,150);
});
test('damage gives invulnerability and game over; reset is complete',()=>{
  const g=new Game(()=>.5);g.player.invincible=0;g.hurt();assert.equal(g.lives,2);
  g.hurt();assert.equal(g.lives,2);
  g.player.invincible=0;g.hurt();g.player.invincible=0;g.hurt();assert.equal(g.over,true);
  const time=g.time;g.update(.05,{fire:true});assert.equal(g.time,time);
  g.reset();assert.equal(g.lives,3);assert.equal(g.score,0);assert.equal(g.wave,1);assert.equal(g.over,false);assert.equal(g.enemies.length,32);
});
test('enemy bullets collide, cleared waves progress with a bonus',()=>{
  const g=new Game(()=>.5);g.player.invincible=0;
  g.enemyBullets=[{x:g.player.x,y:g.player.y,vx:0,vy:0}];g.update(.01,{});assert.equal(g.lives,2);
  g.enemies=[];for(let i=0;i<40;i++)g.update(.05,{});
  assert.equal(g.wave,2);assert.equal(g.score,500);assert.equal(g.enemies.length,32);
});

import {HandTracker} from '../hand-tracker.mjs';
function hand(x, closed=true){
  const p=Array.from({length:21},()=>({x,y:.75,z:0}));
  p[5]={x:x-.07,y:.72};p[17]={x:x+.07,y:.72};
  p[4]={x:x-.01,y:.75};p[8]={x:x+(closed?.025:.13),y:.75};return p;
}
test('four players move and fire independently; bullets retain ownership',()=>{
  const g=new Game(()=>.5);g.reset(4);
  const xs=g.players.map(p=>p.x);
  g.update(.05,[{dx:-1,fire:true},{dx:1,fire:true},{dy:-1,fire:true},{dy:1,fire:true}]);
  assert.ok(g.players[0].x<xs[0]);assert.ok(g.players[1].x>xs[1]);
  assert.ok(g.players[2].y<520);assert.ok(g.players[3].y>520);
  assert.deepEqual([...new Set(g.bullets.map(b=>b.owner))],[0,1,2,3]);
  assert.equal(g.bullets.length,8);assert.equal(g.lives,12);
});
test('one elimination does not end a team run and an out player cannot fire',()=>{
  const g=new Game(()=>.5);g.reset(4);
  for(let i=0;i<3;i++){g.players[0].invincible=0;g.hurt(g.players[0]);}
  assert.equal(g.over,false);assert.equal(g.lives,9);
  g.update(.01,Array.from({length:4},()=>({fire:true})));
  assert.ok(g.bullets.every(b=>b.owner!==0));
  for(const p of g.players.slice(1))for(let i=0;i<3;i++){p.invincible=0;g.hurt(p);}
  assert.equal(g.over,true);g.reset();assert.equal(g.players.length,4);assert.equal(g.lives,12);
});
test('a pickup belongs to one nearest living player',()=>{
  const g=new Game(()=>.5);g.reset(4);
  g.players[0].x=480;g.players[1].x=495;g.dropItem(493,520,'power');g.update(.01,[{},{},{},{}]);
  assert.equal(g.players[0].level,1);assert.equal(g.players[1].level,2);assert.equal(g.items.length,0);
});
test('weapon tiers increase spread, damage and speed; upgrades survive a hit',()=>{
  const g=new Game(()=>.5),p=g.player;
  g.fire(p);assert.equal(g.bullets.length,2);
  for(let i=0;i<7;i++)g.collectItem(p,{type:'power'});
  assert.equal(p.level,5);g.bullets=[];g.fire(p);
  assert.equal(g.bullets.length,7);assert.ok(g.bullets.every(b=>b.damage===2));
  assert.ok(g.bullets[0].vx<0&&g.bullets[6].vx>0);assert.equal(p.shotTimer,.12);
  p.invincible=0;g.hurt();assert.equal(p.level,5);
});
test('rapid boost expires; shield respects cap and cannot revive an eliminated player',()=>{
  const g=new Game(()=>.5),p=g.player;
  g.collectItem(p,{type:'rapid'});g.fire(p);assert.ok(p.shotTimer<.1);
  g.enemies=[];g.waveWait=-100;g.supplyTimer=Infinity;
  for(let i=0;i<201;i++)g.update(.05,{});
  assert.equal(p.rapid,0);g.fire(p);assert.equal(p.shotTimer,.17);
  for(let i=0;i<10;i++)g.collectItem(p,{type:'shield'});
  assert.equal(p.lives,5);p.lives=0;g.collectItem(p,{type:'shield'});assert.equal(p.lives,0);
});
test('starter supply and deterministic regular kill drops',()=>{
  const g=new Game(()=>.5);g.reset(4);g.enemies=[];g.waveWait=-100;g.supplyTimer=.01;
  g.update(.02,[{},{},{},{}]);assert.equal(g.items.length,4);assert.ok(g.items.every(i=>i.type==='power'));
  g.reset();g.kills=2;const e=g.enemies[0];g.bullets=[{x:e.x,y:e.y,damage:10,owner:0,vx:0,vy:0}];g.update(0,{});
  assert.equal(g.items.length,1);assert.equal(g.items[0].type,'power');
});
test('wave 3 spawns boss, scales HP for team and changes attack phase',()=>{
  const solo=new Game(()=>.5);solo.reset(1,3);
  const team=new Game(()=>.5);team.reset(4,3);
  assert.equal(solo.enemies.length,0);assert.ok(team.boss.maxHp>solo.boss.maxHp);
  assert.ok(team.players.every(p=>p.level===3));
  solo.boss.hp=solo.boss.maxHp*.5;solo.boss.fireTimer=0;solo.update(.01,{});
  assert.equal(solo.boss.phase,2);assert.equal(solo.enemyBullets.length,9);
  solo.enemyBullets=[];solo.boss.hp=solo.boss.maxHp*.2;solo.boss.fireTimer=0;solo.update(.01,{});
  assert.equal(solo.boss.phase,3);assert.equal(solo.enemyBullets.length,18);
});
test('boss beam warns before damage and applies only one hit during invulnerability',()=>{
  const g=new Game(()=>.5);g.reset(1,3);g.player.invincible=0;
  g.beam={x:g.player.x,age:0,warning:1.35,duration:.8,width:50};
  g.update(.05,{});assert.equal(g.lives,3);
  g.beam.age=1.34;g.update(.05,{});assert.equal(g.lives,2);
  g.update(.05,{});assert.equal(g.lives,2);
});
test('boss defeat awards bonus, removes hazards, drops loot and advances',()=>{
  const g=new Game(()=>.5);g.reset(2,3);g.boss.hp=1;
  g.beam={x:20,age:0,warning:1.35,duration:.8,width:50};
  g.bullets=[{x:g.boss.x,y:g.boss.y,vx:0,vy:0,damage:2,owner:0}];g.update(.001,[{},{}]);
  assert.equal(g.boss,null);assert.equal(g.beam,null);assert.equal(g.enemyBullets.length,0);
  assert.equal(g.score,2500);assert.equal(g.items.length,2);
  for(let i=0;i<38;i++)g.update(.05,[{},{}]);assert.equal(g.wave,4);assert.ok(g.enemies.length>0);
});
test('hand identities are initialized left to right and survive result order swaps',()=>{
  const tracker=new HandTracker(4);
  tracker.update([hand(.2),hand(.8),hand(.4),hand(.6)],0,640,480);
  const before=tracker.slots.map(s=>s.gesture.x);
  assert.deepEqual([...before].sort((a,b)=>a-b),before);
  tracker.update([hand(.6),hand(.4),hand(.8),hand(.2)],50,640,480);
  assert.deepEqual(tracker.slots.map(s=>s.gesture.x),before);
});
test('missing hands stop their slot, preserve other IDs and recover after a long gap',()=>{
  const tracker=new HandTracker(4);tracker.update([hand(.8),hand(.6),hand(.4),hand(.2)],0,640,480);
  tracker.update([hand(.6),hand(.4),hand(.2)],50,640,480);
  assert.equal(tracker.slots[0].visible,false);assert.ok(tracker.slots.slice(1).every(s=>s.visible));
  tracker.update([],3000,640,480);tracker.update([hand(.6)],4000,640,480);
  assert.equal(tracker.slots[1].visible,true);assert.equal(tracker.slots[0].visible,false);
  tracker.update([hand(.8),hand(.6),hand(.4),hand(.2)],4100,640,480);
  assert.ok(tracker.slots.every(s=>s.visible));
});
