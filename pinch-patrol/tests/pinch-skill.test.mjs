import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,isOpenPalm,handInput} from '../game-core.mjs';
import {palm} from './palm-fixture.mjs';

test('open palm is rotation/mirror invariant and rejects pinches, bent fingers and unsplayed fingers',()=>{
  const open=palm();assert.equal(isOpenPalm(open),true);assert.equal(handInput(open,false).openPalm,true);assert.equal(handInput(open,false).pinch,false);
  assert.equal(isOpenPalm(open.map(p=>({x:1-p.x,y:p.y}))),true);
  for(const angle of [.5,1.5,3]){
    const rotated=open.map(p=>{const x=(p.x-.5)*640,y=(p.y-.5)*480;return{x:.5+(x*Math.cos(angle)-y*Math.sin(angle))/640,y:.5+(x*Math.sin(angle)+y*Math.cos(angle))/480};});
    assert.equal(isOpenPalm(rotated),true);
  }
  const pinched=palm();pinched[4]={...pinched[8]};assert.equal(isOpenPalm(pinched),false);
  const bent=palm();bent[12]={x:.5,y:.7};assert.equal(isOpenPalm(bent),false);
  const narrow=palm();narrow[20]={x:.5,y:.17};assert.equal(isOpenPalm(narrow),false);
  assert.equal(isOpenPalm(null),false);assert.equal(isOpenPalm(open.map(p=>({x:p.x*.001,y:p.y*.001}))),false);
});
test('skill requires stable open gesture and does not repeat while held after cooldown',()=>{
  const g=new Game(()=>.5);g.reset(1,3);const pilot=g.player;
  for(let i=0;i<3;i++)g.updateSkill(pilot,{skill:true},.05);
  assert.equal(pilot.skillCooldown,0);g.updateSkill(pilot,{skill:true},.05);assert.equal(pilot.skillCooldown,16);
  for(let i=0;i<340;i++)g.updateSkill(pilot,{skill:true},.05);
  assert.equal(pilot.skillCooldown,0);assert.equal(g.events.filter(e=>e==='skill').length,1);
  g.updateSkill(pilot,{skill:false},.05);g.updateSkill(pilot,{skill:true},.2);assert.equal(pilot.skillCooldown,0);
  for(let i=0;i<3;i++)g.updateSkill(pilot,{skill:false},.05);
  for(let i=0;i<4;i++)g.updateSkill(pilot,{skill:true},.05);
  assert.equal(pilot.skillCooldown,16);assert.equal(g.events.filter(e=>e==='skill').length,2);
});
test('gesture attempted during cooldown is consumed, while players own independent cooldowns and rewards',()=>{
  const g=new Game(()=>.5);g.reset(4);
  for(const e of g.enemies)e.hp=1;
  g.update(0,[{},{skillTap:true},{},{}]);assert.equal(g.players[1].skillCooldown,16);
  assert.equal(g.enemies.length,0);assert.equal(g.kills,32);assert.equal(g.items.length,10);
  assert.equal(g.players[1].score,3600);assert.equal(g.players[0].score,0);
  g.updateSkill(g.players[1],{skill:true},.2);
  for(let i=0;i<340;i++)g.updateSkill(g.players[1],{skill:true},.05);
  assert.equal(g.events.filter(e=>e==='skill').length,1);
  assert.equal(g.castSkill(g.players[0]),true);assert.equal(g.castSkill(g.players[0]),false);
  assert.equal(g.kills,32);assert.equal(g.score,3600);
});
test('nova clears bullets and beam, hurts bosses once and respects defeat/loot flow',()=>{
  const g=new Game(()=>.5);g.reset(1,3);g.player.invincible=0;
  g.enemyShot(100,400,0);g.beam={x:480,age:1.4,warning:1.35,duration:.8,width:50};
  const hp=g.boss.hp;g.castSkill(g.player);
  assert.equal(g.boss.hp,hp-21);assert.equal(g.enemyBullets.length,0);assert.equal(g.beam,null);assert.ok(g.player.invincible>=.8);
  g.player.skillCooldown=0;g.boss.hp=1;g.castSkill(g.player);
  assert.equal(g.boss,null);assert.equal(g.score,2500);assert.equal(g.items.length,1);
  g.reset();assert.equal(g.player.skillCooldown,0);assert.equal(g.player.skillLatched,false);assert.equal(g.shockwaves.length,0);
  g.player.lives=0;assert.equal(g.castSkill(g.player),false);g.player.lives=3;g.over=true;assert.equal(g.castSkill(g.player),false);
});
