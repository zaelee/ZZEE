export let W = 960, H = 600;
export const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export function cameraPoint(point, videoWidth, videoHeight, mirrored = true) {
  const scale = Math.max(W / videoWidth, H / videoHeight);
  const x = point.x * videoWidth * scale - (videoWidth * scale - W) / 2;
  return {
    x: mirrored ? W - x : x,
    y: point.y * videoHeight * scale - (videoHeight * scale - H) / 2,
  };
}

export function isOpenPalm(points, width = 640, height = 480) {
  if (!points || points.length < 21 || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return false;
  const dist = (a, b) => Math.hypot((points[a].x - points[b].x) * width, (points[a].y - points[b].y) * height);
  const palm = dist(5, 17);
  if (palm < 8) return false;
  const straight = (base, joint, tip) => {
    const a = { x: (points[joint].x - points[base].x) * width, y: (points[joint].y - points[base].y) * height };
    const b = { x: (points[tip].x - points[joint].x) * width, y: (points[tip].y - points[joint].y) * height };
    return (a.x * b.x + a.y * b.y) / Math.max(1, Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y)) > .72;
  };
  return [[5,6,8],[9,10,12],[13,14,16],[17,18,20]].every(([base,joint,tip]) =>
    straight(base,joint,tip) && dist(tip,0) > dist(joint,0) * 1.12)
    && straight(2,3,4) && dist(4,0) > dist(2,0) * 1.25
    && dist(8,20) > palm * 1.5 && dist(4,8) > palm * .85;
}

export function handInput(points, wasPinched, videoWidth = 640, videoHeight = 480, mirrored = true) {
  if (!points || points.length < 21) return null;
  const distance = (a, b) => Math.hypot((a.x - b.x) * videoWidth, (a.y - b.y) * videoHeight);
  const palm = distance(points[5], points[17]);
  if (palm < 8) return null;
  const ratio = distance(points[4], points[8]) / palm;
  const thumb = cameraPoint(points[4], videoWidth, videoHeight, mirrored);
  const index = cameraPoint(points[8], videoWidth, videoHeight, mirrored);
  return { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2,
    pinch: ratio < (wasPinched ? 0.62 : 0.43), ratio, thumb, index, openPalm: isOpenPalm(points, videoWidth, videoHeight) };
}

export const PLAYER_COLORS = ['#b7f3cb', '#8acbff', '#e7a2e9', '#ffd47d'];
export const ITEM_INFO = {
  power: { label: 'P', color: '#b7f3cb', name: 'POWER UP' },
  rapid: { label: 'R', color: '#ffd47d', name: 'RAPID FIRE' },
  shield: { label: 'S', color: '#8acbff', name: 'SHIELD +1' },
};

export function waveDifficulty(wave, players = 1) {
  const step = Math.max(0, wave - 1), bossRank = Math.max(0, Math.floor(wave / 3) - 1);
  // Speed and density are bounded to keep late waves readable on a phone.
  return {
    label: wave < 3 ? '경계' : wave < 6 ? '위험' : wave < 9 ? '극한' : '지옥',
    rows: Math.min(5, 4 + Math.floor(step / 3)),
    armor: 2 + Math.floor(step / 3),
    formationRate: 1 + Math.min(.9, step * .06),
    shotSpeed: 190 + Math.min(120, step * 10),
    shotInterval: (.36 + .34 * Math.exp(-step / 8)) / (1 + (players - 1) * .1),
    shooters: Math.min(3, 1 + Math.floor(wave / 2) + (players > 1 ? 1 : 0)),
    spread: wave < 3 ? 0 : wave < 7 ? 1 : 2,
    divers: Math.min(3, 1 + Math.floor(step / 3)),
    diveInterval: Math.max(.85, 2.3 - step * .14),
    diveSpeed: 205 + Math.min(115, step * 9),
    bossHp: Math.round((560 + bossRank * 160 + bossRank * bossRank * 24) * players),
    bossTempo: 1.3 + Math.min(.9, bossRank * .12),
    bossSpread: 1 + Math.min(3, bossRank),
    bossShotSpeed: 1.18 + Math.min(.48, bossRank * .07),
    beamWarning: Math.max(.95, 1.2 - bossRank * .04),
  };
}

export class Game {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  get player() { return this.players[0]; }
  get pressure() { return 1 + clamp((this.time - this.waveStarted - 8) / 40, 0, 1) * .5; }
  get lives() { return this.players.reduce((sum, p) => sum + p.lives, 0); }
  reset(count = this.playerCount || 1, startWave = 1) {
    this.playerCount = clamp(Math.floor(count), 1, 4);
    this.time = 0; this.score = 0; this.wave = startWave; this.over = false;
    this.players = Array.from({ length: this.playerCount }, (_, id) => ({
      id, x: W * (id + 1) / (this.playerCount + 1), y: H - 80,
      lives: 3, invincible: 1.8, level: startWave > 1 ? 3 : 1,
      rapid: 0, shotTimer: 0, skillCooldown: 0, skillHold: 0, skillRelease: 0, skillLatched: false, score: 0, color: PLAYER_COLORS[id],
    }));
    this.bullets = []; this.enemyBullets = []; this.particles = []; this.events = [];
    this.items = []; this.popups = []; this.shockwaves = []; this.kills = 0; this.dropCount = 0;
    this.supplyTimer = 6; this.waveWait = 0; this.banner = 2.6;
    this.spawnWave();
  }
  // One shared playfield; preserve the active run when the device rotates.
  resize(width, height) {
    const sx = width / W, sy = height / H;
    for (const entity of [...this.players, ...this.enemies, ...this.bullets, ...this.enemyBullets,
      ...this.items, ...this.particles, ...this.popups, ...this.shockwaves, ...(this.boss ? [this.boss] : [])]) {
      entity.x *= sx; entity.y *= sy;
      if (entity.homeX !== undefined) { entity.homeX *= sx; entity.homeY *= sy; }
      if (entity.dive) { entity.dive.x *= sx; entity.dive.y *= sy; entity.dive.vx *= sx; }
    }
    if (this.beam) this.beam.x *= sx;
    W = width; H = height;
  }
  spawnWave() {
    this.difficulty = waveDifficulty(this.wave, this.playerCount);
    const d = this.difficulty;
    this.enemies = []; this.boss = null; this.beam = null; this.enemyBullets = [];
    this.bullets = []; this.attackTimer = .9; this.diveTimer = 2.2; this.banner = 2.6;
    this.waveStarted = this.time;
    if (this.wave % 3 === 0) {
      const maxHp = d.bossHp;
      this.boss = { x: W / 2, y: 105, hp: maxHp, maxHp, phase: 1, fireTimer: 1.3, beamTimer: 4.5, age: 0 };
      this.events.push('boss');
      return;
    }
    const rows = d.rows;
    for (let row = 0; row < rows; row++) for (let col = 0; col < 8; col++) {
      this.enemies.push({ x: (200 + col * 80) * W / 960, y: 65 + row * 49,
        homeX: (200 + col * 80) * W / 960, homeY: 65 + row * 49,
        row, col, type: row % 3, hp: 1 + d.armor + (row < (this.wave - 1) % 3 ? 1 : 0), dive: null });
    }
  }
  burst(x, y, color, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = this.random() * Math.PI * 2, speed = 45 + this.random() * 140;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: .35 + this.random() * .35, color });
    }
  }
  popup(x, y, label, color) { this.popups.push({ x, y, label, color, life: 1.5 }); }
  dropItem(x, y, type = 'power') {
    this.items.push({ x: clamp(x, 30, W - 30), y: clamp(y, 35, H - 60), type, age: 0 });
  }
  collectItem(player, item) {
    if (item.dead || player.lives <= 0) return;
    item.dead = true;
    if (item.type === 'power') player.level = Math.min(5, player.level + 1);
    if (item.type === 'rapid') player.rapid = 10;
    if (item.type === 'shield') { player.lives = Math.min(5, player.lives + 1); player.invincible = Math.max(player.invincible, 2); }
    const bonus = item.type === 'power' ? 100 : 50;
    this.score += bonus; player.score += bonus;
    this.popup(player.x, player.y - 30, item.type === 'power' ? `P${player.id + 1}  WEAPON LV.${player.level}` : ITEM_INFO[item.type].name, ITEM_INFO[item.type].color);
    this.burst(player.x, player.y, ITEM_INFO[item.type].color, 12); this.events.push('item');
  }
  rewardEnemy(e, player) {
    const earned = e.dive ? 200 : (3 - e.type) * 50;
    this.score += earned; player.score += earned;
    this.burst(e.x, e.y, ['#ff917c', '#e3c67c', '#b0a4ef'][e.type]); this.events.push('hit');
    this.kills++;
    if (this.kills % 3 === 0) {
      const types = ['power', 'power', 'rapid', 'power', 'shield'];
      this.dropItem(e.x, e.y, types[this.dropCount++ % types.length]);
    }
  }
  castSkill(player) {
    if (this.over || player.lives <= 0 || player.skillCooldown > 0) return false;
    player.skillCooldown = 16; player.invincible = Math.max(player.invincible, .8);
    this.enemyBullets = []; this.beam = null;
    this.shockwaves.push({ x: player.x, y: player.y, color: player.color, life: .65 });
    this.popup(player.x, player.y - 45, `P${player.id + 1}  PALM NOVA`, player.color);
    for (const e of this.enemies) if (e.hp > 0) {
      e.hp -= 1 + Math.floor(player.level / 2);
      if (e.hp <= 0) this.rewardEnemy(e, player);
    }
    if (this.boss) {
      this.boss.hp -= 12 + player.level * 3;
      if (this.boss.hp <= 0) this.defeatBoss();
    }
    this.events.push('skill'); return true;
  }
  updateSkill(player, input, dt) {
    player.skillCooldown = Math.max(0, player.skillCooldown - dt);
    if (input.skill) {
      player.skillRelease = 0; player.skillHold += dt;
      if (player.skillHold >= .18 && !player.skillLatched) {
        player.skillLatched = true; this.castSkill(player);
      }
    } else {
      player.skillHold = 0; player.skillRelease += dt;
      if (player.skillRelease >= .12) player.skillLatched = false;
    }
    if (input.skillTap) this.castSkill(player);
  }
  hurt(player = this.player) {
    if (player.invincible > 0 || player.lives <= 0 || this.over) return;
    player.lives--; player.invincible = 1.25;
    this.burst(player.x, player.y, player.color, 28); this.events.push('hurt');
    if (player.lives === 0) this.popup(player.x, player.y - 25, `P${player.id + 1} OUT`, player.color);
    if (this.lives === 0) { this.over = true; this.events.push('over'); }
  }
  fire(player) {
    const level = player.level, speed = 610;
    const angles = level === 1 ? [0, 0] : level === 2 ? [-.13, 0, .13] : level < 5 ? [-.24, -.12, 0, .12, .24] : [-.33, -.22, -.11, 0, .11, .22, .33];
    angles.forEach((angle, index) => this.bullets.push({
      x: player.x + (level === 1 ? (index ? 6 : -6) : 0), y: player.y - 17,
      vx: Math.sin(angle) * speed, vy: -Math.cos(angle) * speed,
      damage: level >= 4 ? 2 : 1, owner: player.id, color: player.color,
    }));
    player.shotTimer = (level >= 4 ? .12 : .17) * (player.rapid > 0 ? .52 : 1);
    this.events.push('shoot');
  }
  target() {
    const alive = this.players.filter(p => p.lives > 0);
    return alive[Math.floor(this.random() * alive.length)] || this.player;
  }
  enemyShot(x, y, angle, speed = 160, radius = 4) {
    speed *= 1 + (this.pressure - 1) * .2;
    this.enemyBullets.push({ x, y, vx: Math.sin(angle) * speed, vy: Math.cos(angle) * speed, radius });
  }
  updateBoss(dt) {
    const boss = this.boss, d = this.difficulty;
    if (!boss) return;
    boss.age += dt; boss.x = W / 2 + Math.sin(boss.age * .65 * d.bossTempo) * 250 * W / 960;
    boss.y = 100 + Math.sin(boss.age * 1.1) * 24;
    const phase = boss.hp / boss.maxHp > .66 ? 1 : boss.hp / boss.maxHp > .33 ? 2 : 3;
    if (phase !== boss.phase) { boss.phase = phase; this.events.push('phase'); this.popup(boss.x, boss.y + 70, `PHASE ${phase}`, '#ff9e8a'); }
    boss.fireTimer -= dt * this.pressure; boss.beamTimer -= dt * this.pressure;
    if (boss.fireTimer <= 0) {
      if (phase === 1) {
        const p = this.target(), aim = Math.atan2(p.x - boss.x, Math.max(60, p.y - boss.y));
        for (let i = -2 - d.bossSpread; i <= 2 + d.bossSpread; i++) this.enemyShot(boss.x, boss.y + 35, aim + i * .15, 155 * d.bossShotSpeed);
      } else if (phase === 2) {
        for (let i = -3 - d.bossSpread; i <= 3 + d.bossSpread; i++) this.enemyShot(boss.x, boss.y + 35, i * .22 + Math.sin(boss.age) * .18, 180 * d.bossShotSpeed);
      } else {
        const count = 14 + d.bossSpread * 4;
        for (let i = 0; i < count; i++) this.enemyShot(boss.x, boss.y, i * Math.PI * 2 / count + boss.age * .2, 165 * d.bossShotSpeed, 5);
      }
      boss.fireTimer += (phase === 1 ? 1.15 : phase === 2 ? .9 : .8) / d.bossTempo;
    }
    if (boss.beamTimer <= 0 && !this.beam) {
      this.beam = { x: this.target().x, age: 0, warning: d.beamWarning, duration: .8, width: 50 };
      boss.beamTimer += (phase === 3 ? 5 : 7) / d.bossTempo; this.events.push('warning');
    }
    if (this.beam) {
      this.beam.age += dt;
      if (this.beam.age >= this.beam.warning && this.beam.age < this.beam.warning + this.beam.duration) {
        for (const p of this.players) if (p.lives > 0 && Math.abs(p.x - this.beam.x) < this.beam.width / 2 + 10) this.hurt(p);
      }
      if (this.beam.age >= this.beam.warning + this.beam.duration) this.beam = null;
    }
    for (const bullet of this.bullets) if (!bullet.dead && Math.abs(bullet.x - boss.x) < 72 && Math.abs(bullet.y - boss.y) < 41) {
      bullet.dead = true; boss.hp -= bullet.damage || 1;
      if (boss.hp <= 0) { this.defeatBoss(); break; }
    }
    if (this.boss) for (const p of this.players) if (p.lives > 0 && Math.abs(p.x - boss.x) < 80 && Math.abs(p.y - boss.y) < 48) this.hurt(p);
  }
  defeatBoss() {
    const boss = this.boss;
    this.burst(boss.x, boss.y, '#ffd47d', 90);
    this.score += 2500; this.popup(boss.x, boss.y, 'BOSS DOWN +2500', '#ffd47d');
    for (const p of this.players.filter(p => p.lives > 0)) this.dropItem(p.x, Math.min(p.y - 100, 350), 'power');
    this.boss = null; this.beam = null; this.enemyBullets = []; this.bullets = [];
    this.events.push('bossDown');
  }
  update(dt, inputs = {}) {
    if (this.over) return;
    dt = clamp(dt, 0, .05); this.time += dt; this.banner = Math.max(0, this.banner - dt);
    const d = this.difficulty;
    const commands = Array.isArray(inputs) ? inputs : [inputs];
    for (const p of this.players) {
      if (p.lives <= 0) continue;
      const input = commands[p.id] || {};
      p.invincible = Math.max(0, p.invincible - dt); p.rapid = Math.max(0, p.rapid - dt);
      if (Number.isFinite(input.x) && Number.isFinite(input.y)) {
        const smoothing = 1 - Math.exp(-18 * dt);
        p.x += (clamp(input.x, 25, W - 25) - p.x) * smoothing;
        p.y += (clamp(input.y, 34, H - 28) - p.y) * smoothing;
      } else {
        const dx = input.dx || 0, dy = input.dy || 0, norm = Math.max(1, Math.hypot(dx, dy));
        p.x = clamp(p.x + dx / norm * 370 * dt, 25, W - 25);
        p.y = clamp(p.y + dy / norm * 370 * dt, 34, H - 28);
      }
      this.updateSkill(p, input, dt);
      p.shotTimer -= dt;
      if (input.fire && p.shotTimer <= 0) this.fire(p);
    }
    for (const b of this.bullets) { b.x += (b.vx || 0) * dt; b.y += (b.vy ?? -610) * dt; }
    for (const b of this.enemyBullets) { b.x += b.vx * dt; b.y += b.vy * dt; }
    for (const q of this.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    for (const wave of this.shockwaves) wave.life -= dt;
    this.shockwaves = this.shockwaves.filter(wave => wave.life > 0);
    for (const q of this.popups) { q.y -= 24 * dt; q.life -= dt; }
    this.particles = this.particles.filter(q => q.life > 0).slice(-400);
    this.popups = this.popups.filter(q => q.life > 0);
    for (const e of this.enemies) {
      if (e.dive) {
        e.dive.t += dt; e.x = e.dive.x + Math.sin(e.dive.t * 3) * 90 + e.dive.vx * e.dive.t;
        e.y = e.dive.y + e.dive.t * d.diveSpeed;
        if (e.y > H + 50) { e.dive = null; e.x = e.homeX; e.y = e.homeY; }
      } else {
        e.x = e.homeX + Math.sin(this.time * d.formationRate) * 95 * W / 960;
        e.y = e.homeY + Math.sin(this.time * 1.5 + e.col * .45) * 8;
      }
      for (const b of this.bullets) if (!b.dead && e.hp > 0 && Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 19) {
        b.dead = true; e.hp -= b.damage || 1;
        if (e.hp <= 0) {
          this.rewardEnemy(e, this.players[b.owner || 0]);
        }
      }
      for (const p of this.players) if (p.lives > 0 && e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 27) {
        this.hurt(p); e.hp = 0; this.burst(e.x, e.y, '#b0a4ef');
      }
    }
    this.updateBoss(dt);
    for (const b of this.enemyBullets) for (const p of this.players) {
      if (!b.dead && p.lives > 0 && Math.hypot(b.x - p.x, b.y - p.y) < 10 + (b.radius || 4)) { b.dead = true; this.hurt(p); }
    }
    this.supplyTimer -= dt;
    if (this.supplyTimer <= 0) {
      for (const p of this.players.filter(p => p.lives > 0)) this.dropItem(p.x, Math.max(40, p.y - 130), 'power');
      this.supplyTimer = Infinity;
    }
    for (const item of this.items) {
      item.age += dt; item.y += 48 * dt;
      const nearby = this.players.filter(p => p.lives > 0 && Math.hypot(p.x - item.x, p.y - item.y) < 31)
        .sort((a, b) => Math.hypot(a.x - item.x, a.y - item.y) - Math.hypot(b.x - item.x, b.y - item.y));
      if (nearby.length) this.collectItem(nearby[0], item);
    }
    this.items = this.items.filter(i => !i.dead && i.y < H + 25 && i.age < 16);
    this.enemies = this.enemies.filter(e => e.hp > 0);
    this.bullets = this.bullets.filter(b => !b.dead && b.y > -20 && b.x > -20 && b.x < W + 20);
    this.enemyBullets = this.enemyBullets.filter(b => !b.dead && b.y > -30 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
    if (this.enemies.length) {
      this.attackTimer -= dt * this.pressure; this.diveTimer -= dt * this.pressure;
      if (this.attackTimer <= 0) {
        const shooters = [...this.enemies];
        for (let shot = 0; shot < d.shooters && shooters.length; shot++) {
          const [e] = shooters.splice(Math.floor(this.random() * shooters.length), 1), p = this.target();
          const aim = Math.atan2(p.x - e.x, Math.max(90, p.y - e.y));
          for (let i = -d.spread; i <= d.spread; i++) this.enemyShot(e.x, e.y + 13, aim + i * .17, d.shotSpeed);
        }
        // Preserve timer overshoot so pressure does not depend on frame rate.
        this.attackTimer += d.shotInterval;
      }
      if (this.diveTimer <= 0) {
        const idle = this.enemies.filter(e => !e.dive);
        for (let i = 0; i < d.divers && idle.length; i++) {
          const [e] = idle.splice(Math.floor(this.random() * idle.length), 1);
          e.dive = { t: 0, x: e.x, y: e.y, vx: clamp((this.target().x - e.x) / 2, -100, 100) };
        }
        this.diveTimer += d.diveInterval;
      }
    } else if (!this.boss && !this.over) {
      this.waveWait += dt;
      if (this.waveWait > 1.8) { this.wave++; this.score += 500; this.waveWait = 0; this.spawnWave(); this.events.push('wave'); }
    }
  }
}
