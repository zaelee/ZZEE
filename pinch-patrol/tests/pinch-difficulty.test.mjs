import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, waveDifficulty } from '../game-core.mjs';

test('difficulty ramps with waves, while late speed and warning remain bounded',()=>{
  for(const players of [1,4])for(let wave=2;wave<=120;wave++){
    const prev=waveDifficulty(wave-1,players),next=waveDifficulty(wave,players);
    for(const key of ['rows','armor','formationRate','shotSpeed','shooters','spread','divers','diveSpeed','bossHp','bossTempo','bossSpread'])assert.ok(next[key]>=prev[key],`${key} regressed at ${wave}`);
    assert.ok(next.shotInterval<=prev.shotInterval&&next.diveInterval<=prev.diveInterval);
    assert.ok(next.shotSpeed<=310&&next.diveSpeed<=320&&next.beamWarning>=.95&&next.shotInterval>.27);
  }
});
test('later regular waves emit wider faster volleys and launch distinct concurrent divers',()=>{
  const samples=[1,4,7,10,13].map(wave=>{
    const g=new Game(()=>.5);g.reset(1,wave);g.attackTimer=0;g.diveTimer=0;g.update(0,{});
    return {g,shots:g.enemyBullets.length,speed:Math.hypot(g.enemyBullets[0].vx,g.enemyBullets[0].vy),divers:g.enemies.filter(e=>e.dive).length};
  });
  assert.deepEqual(samples.map(s=>s.shots),[1,9,15,15,15]);
  assert.deepEqual(samples.map(s=>s.divers),[1,2,3,3,3]);
  assert.ok(samples[4].speed>samples[0].speed);
  assert.ok(samples[4].g.enemies[0].hp>samples[0].g.enemies[0].hp);
  assert.deepEqual(samples.map(s=>s.g.enemies.length),[32,40,40,40,40]);
});
test('successive bosses increase HP, fan/ring density and tempo without losing warning',()=>{
  for(const phase of [1,2,3]){
    const samples=[3,6,9,12].map(wave=>{
      const g=new Game(()=>.5);g.reset(1,wave);g.boss.hp=g.boss.maxHp*(phase===1?1:phase===2?.5:.2);
      g.boss.fireTimer=0;g.boss.beamTimer=0;g.update(0,{});return g;
    });
    for(let i=1;i<samples.length;i++){
      const a=samples[i-1],b=samples[i];
      assert.ok(b.boss.maxHp>a.boss.maxHp);assert.ok(b.enemyBullets.length>a.enemyBullets.length);
      assert.ok(b.boss.fireTimer<a.boss.fireTimer&&b.boss.beamTimer<a.boss.beamTimer);
      assert.ok(b.beam.warning>=.95&&b.beam.warning<a.beam.warning);
    }
  }
});
test('natural transition applies the next profile; restart restores easy wave and clears hazards',()=>{
  const g=new Game(()=>.5);g.reset(4);g.wave=6;g.spawnWave();g.defeatBoss();g.waveWait=1.79;g.player.level=5;g.update(.02,[{},{},{},{}]);
  assert.equal(g.wave,7);assert.equal(g.difficulty.divers,3);assert.equal(g.difficulty.label,'극한');assert.equal(g.player.level,5);
  g.reset(4);assert.equal(g.wave,1);assert.equal(g.difficulty.label,'경계');assert.equal(g.difficulty.spread,0);assert.equal(g.player.level,1);assert.equal(g.boss,null);assert.equal(g.enemyBullets.length,0);
});
test('late portrait waves remain finite and usable during sustained 4P combat',()=>{
  const g=new Game(()=>.5);g.resize(600,800);
  try{
    for(const wave of [13,30]){
      g.reset(4,wave);for(const p of g.players)p.invincible=Infinity;
      for(let frame=0;frame<1200;frame++)g.update(.05,[{},{},{},{}]);
      assert.ok(g.enemyBullets.length<200);assert.ok(g.enemyBullets.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)));
      assert.equal(g.over,false);assert.equal(g.lives,12);
    }
  }finally{g.resize(960,600);}
});

test('hard opening survives a novice nova and starts pressure before two seconds',()=>{
  const g=new Game(()=>.5);assert.equal(g.enemies.length,32);assert.ok(g.enemies.every(e=>e.hp>=3));
  assert.ok(g.attackTimer<1&&g.diveTimer<=2.2);
  g.castSkill(g.player);assert.equal(g.player.skillCooldown,16);assert.equal(g.kills,0);assert.ok(g.enemies.every(e=>e.hp>=2));
  g.reset(1,3);assert.equal(g.boss.maxHp,560);assert.ok(g.boss.fireTimer<1.5);
  g.reset(4,3);assert.equal(g.boss.maxHp,2240);
});

test('pressure ramps smoothly after eight seconds and remains bounded',()=>{
  const g=new Game();
  for(const [elapsed,expected] of [[0,1],[8,1],[18,1.125],[28,1.25],[48,1.5],[300,1.5]]){
    g.time=g.waveStarted+elapsed;assert.equal(g.pressure,expected);
  }
});
test('long waves emit more attacks and only new projectiles gain speed',()=>{
  function sample(time){
    const g=new Game(()=>.5);g.time=time;g.attackTimer=0;g.diveTimer=Infinity;g.player.invincible=Infinity;
    const shot=g.enemyShot;let count=0;
    g.enemyShot=function(...args){count++;return shot.apply(this,args);};
    for(let i=0;i<120;i++)g.update(.05,{});
    return {count,g};
  }
  const early=sample(0),late=sample(48);assert.ok(late.count>early.count*1.35);
  const g=new Game();g.enemyShot(100,200,0,200);const existing=g.enemyBullets[0];
  g.time=48;g.enemyShot(100,200,0,200);
  assert.equal(existing.vy,200);assert.ok(Math.abs(g.enemyBullets[1].vy-220)<.001);
});
test('pressure accelerates normal dives and boss attack clocks without shortening beam warning',()=>{
  const normal=new Game();normal.time=48;normal.attackTimer=1;normal.diveTimer=1;normal.update(.05,{});
  assert.ok(Math.abs(normal.attackTimer-.925)<.001);assert.ok(Math.abs(normal.diveTimer-.925)<.001);
  const boss=new Game();boss.reset(1,3);boss.time=48;boss.boss.fireTimer=1;boss.boss.beamTimer=1;boss.update(.05,{});
  assert.ok(Math.abs(boss.boss.fireTimer-.925)<.001);assert.ok(Math.abs(boss.boss.beamTimer-.925)<.001);
  boss.boss.beamTimer=0;boss.update(0,{});assert.equal(boss.beam.warning,boss.difficulty.beamWarning);
  assert.ok(boss.beam.warning>=.95);
});
test('late waves keep increasing armor and fire rate beyond the old plateau',()=>{
  const g=new Game();g.reset(1,40);const hp=g.enemies[0].hp,interval=g.difficulty.shotInterval;
  g.wave=41;g.spawnWave();assert.ok(g.enemies[0].hp>hp);assert.ok(g.difficulty.shotInterval<interval);
  g.wave=43;g.spawnWave();assert.ok(g.enemies.every(e=>e.hp>hp));
});
test('new waves reset pressure while keeping upgrades; orientation does not reset pressure',()=>{
  const g=new Game();g.time=48;g.player.level=5;
  try{g.resize(600,800);assert.equal(g.pressure,1.5);}finally{g.resize(960,600);}
  g.enemies=[];g.waveWait=1.79;g.update(.02,{});
  assert.equal(g.wave,2);assert.equal(g.pressure,1);assert.equal(g.player.level,5);
  g.time+=48;g.reset();assert.equal(g.pressure,1);assert.equal(g.player.level,1);
});
