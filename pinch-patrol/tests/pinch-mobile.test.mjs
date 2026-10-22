import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, W, H, cameraPoint } from '../game-core.mjs';
import { TouchControls } from '../touch-controls.mjs';
import { HandCamera } from '../camera.mjs';

test('four contacts steer relatively, release independently, and ignore extra contacts',()=>{
  const game=new Game(),touches=new TouchControls();game.reset(4);
  for(let id=0;id<5;id++)touches.begin(100+id,{x:20+id*10,y:80},game.players);
  assert.equal(touches.contacts.size,4);
  assert.equal(touches.input(0).x,game.players[0].x);
  touches.move(101,{x:60,y:65});
  assert.equal(touches.input(1).x,game.players[1].x+30);
  assert.equal(touches.input(1).y,game.players[1].y-15);
  touches.end(100);assert.equal(touches.input(0),null);
  assert.ok([1,2,3].every(id=>touches.input(id).fire));
  touches.begin(106,{x:10,y:10},game.players);assert.ok(touches.input(0));
  touches.clear();assert.equal(touches.contacts.size,0);
});
test('dragging beyond the edge reverses immediately and skips eliminated pilots',()=>{
  const g=new Game(),t=new TouchControls();g.reset(2);g.players[0].lives=0;
  t.begin(1,{x:0,y:0},g.players);assert.equal(t.input(0),null);
  t.move(1,{x:2000,y:2000});assert.equal(t.input(1).x,W-25);
  t.move(1,{x:1990,y:1990});assert.equal(t.input(1).x,W-35);
});
test('portrait formation and boss stay inside field, rotation preserves progress and objects',()=>{
  const g=new Game(()=>.5);
  try {
    g.resize(600,800);g.reset(4);
    assert.equal(W,600);assert.equal(H,800);
    for(const e of g.enemies)assert.ok(e.homeX-95*W/960>20&&e.homeX+95*W/960<W-20);
    g.reset(4,3);g.score=321;g.player.level=5;g.boss.hp=100;
    g.dropItem(300,400);g.fire(g.player);g.enemyShot(300,200,0);
    g.beam={x:300,age:.2,warning:1.35,duration:.8,width:50};
    const position={x:g.player.x,y:g.player.y};
    g.resize(960,600);
    assert.equal(g.score,321);assert.equal(g.player.level,5);assert.equal(g.boss.hp,100);
    assert.equal(g.player.x,position.x*1.6);assert.equal(g.player.y,position.y*.75);
    assert.equal(g.items[0].x,480);assert.equal(g.items[0].y,300);
    assert.equal(g.beam.x,480);assert.equal(g.enemyBullets.length,1);assert.equal(g.bullets.length,7);
    g.resize(600,800);
    for(let i=0;i<150;i++){g.updateBoss(.05);if(g.boss)assert.ok(g.boss.x>72&&g.boss.x<W-72);}
    const front=cameraPoint({x:.4,y:.5},640,480,true),rear=cameraPoint({x:.4,y:.5},640,480,false);
    assert.equal(front.x+rear.x,W);assert.equal(front.y,rear.y);
  } finally {g.resize(960,600);}
});
test('insecure origins fail clearly before camera access',async()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'isSecureContext');
  Object.defineProperty(globalThis,'isSecureContext',{value:false,configurable:true});
  try {await assert.rejects(new HandCamera({pause(){}}).start(()=>{}),{name:'InsecureContextError'});}
  finally {if(original)Object.defineProperty(globalThis,'isSecureContext',original);else delete globalThis.isSecureContext;}
});
test('rear camera constraints and actual facing mode govern mirroring; failure stops tracks',async()=>{
  const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const originalSecure=Object.getOwnPropertyDescriptor(globalThis,'isSecureContext');
  let constraint,stops=0;
  const track={stop(){stops++;},getSettings(){return {facingMode:'environment'};}};
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async c=>{constraint=c;return {getTracks:()=>[track],getVideoTracks:()=>[track]};}}}});
  Object.defineProperty(globalThis,'isSecureContext',{configurable:true,value:true});
  try {
    const camera=new HandCamera({pause(){},play:async()=>{throw new Error('video failure');}});
    await assert.rejects(camera.start(()=>{},4,'environment'),/video failure/);
    assert.equal(constraint.video.facingMode.ideal,'environment');assert.equal(constraint.audio,false);
    assert.equal(camera.mirrored,false);assert.equal(stops,1);assert.equal(camera.stream,null);
  } finally {
    if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
    if(originalSecure)Object.defineProperty(globalThis,'isSecureContext',originalSecure);else delete globalThis.isSecureContext;
  }
});
