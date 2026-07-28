"use strict";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (items) => items[Math.floor(Math.random() * items.length)];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function drawRoundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

class UI {
  constructor(game) {
    this.game = game;
    this.scoreValue = document.getElementById("scoreValue");
    this.highScoreValue = document.getElementById("highScoreValue");
    this.livesValue = document.getElementById("livesValue");
    this.waveValue = document.getElementById("waveValue");
    this.comboValue = document.getElementById("comboValue");
    this.powerValue = document.getElementById("powerValue");
    this.overlay = document.getElementById("screenOverlay");
    this.overlayKicker = document.getElementById("overlayKicker");
    this.overlayTitle = document.getElementById("overlayTitle");
    this.overlayText = document.getElementById("overlayText");
    this.overlayButton = document.getElementById("overlayButton");
    this.restartButton = document.getElementById("restartButton");

    this.overlayButton.addEventListener("click", () => this.game.restart());
    this.restartButton.addEventListener("click", () => this.game.restart());
  }

  update() {
    const game = this.game;
    this.scoreValue.textContent = game.score.toLocaleString("en-US");
    this.highScoreValue.textContent = game.highScore.toLocaleString("en-US");
    this.livesValue.textContent = String(game.lives);
    this.waveValue.textContent = `${game.wave}/${game.maxWave}`;
    this.comboValue.textContent = `${Math.max(0, game.combo)}x`;

    const powers = [];
    if (game.player.weapon !== "single") {
      powers.push(`${game.player.weapon.toUpperCase()} ${game.player.weaponTimer.toFixed(0)}s`);
    }
    if (game.player.shieldTimer > 0) {
      powers.push(`SHIELD ${game.player.shieldTimer.toFixed(0)}s`);
    }
    this.powerValue.textContent = powers.length ? powers.join(" / ") : "Ready";
  }

  showOverlay(kicker, title, text, buttonText) {
    this.overlayKicker.textContent = kicker;
    this.overlayTitle.textContent = title;
    this.overlayText.textContent = text;
    this.overlayButton.textContent = buttonText;
    this.overlay.classList.remove("is-hidden");
  }

  hideOverlay() {
    this.overlay.classList.add("is-hidden");
  }
}

class ArcadeAudio {
  constructor() {
    this.context = null;
  }

  unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }

  tone(frequency, duration, type = "square", gain = 0.04, endFrequency = frequency) {
    if (!this.context) {
      return;
    }
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), now + duration);
    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(volume);
    volume.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  noise(duration, gain = 0.05) {
    if (!this.context) {
      return;
    }
    const sampleRate = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.context.createBufferSource();
    const volume = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const now = this.context.currentTime;

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(160, now + duration);
    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(volume);
    volume.connect(this.context.destination);
    source.start(now);
    source.stop(now + duration);
  }

  shoot() {
    this.tone(760, 0.08, "square", 0.026, 1280);
    this.tone(380, 0.06, "triangle", 0.016, 620);
  }

  explosion() {
    this.noise(0.22, 0.07);
    this.tone(160, 0.18, "sawtooth", 0.035, 60);
  }

  hit() {
    this.tone(180, 0.13, "square", 0.04, 90);
  }

  power() {
    this.tone(520, 0.08, "triangle", 0.04, 900);
    window.setTimeout(() => this.tone(900, 0.1, "triangle", 0.034, 1320), 70);
  }

  stageClear() {
    [520, 660, 784, 1046].forEach((note, index) => {
      window.setTimeout(() => this.tone(note, 0.13, "square", 0.04, note * 1.04), index * 95);
    });
  }
}

class Bullet {
  constructor(x, y, vx, vy, team, damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.team = team;
    this.damage = damage;
    this.radius = team === "player" ? 6 : 7;
    this.active = true;
    this.spin = rand(0, Math.PI * 2);
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += dt * 12;
    if (this.y < -40 || this.y > game.height + 50 || this.x < -60 || this.x > game.width + 60) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.spin * 0.12);

    if (this.team === "player") {
      const gradient = ctx.createLinearGradient(0, -14, 0, 14);
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.45, "#63d8ff");
      gradient.addColorStop(1, "#4b7dff");
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "#d9fbff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      drawRoundRect(ctx, -5, -16, 10, 26, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = "#ff785f";
      ctx.strokeStyle = "#ffe0a8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.arc(-2, -2, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class Particle {
  constructor(options) {
    this.x = options.x;
    this.y = options.y;
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.life = options.life || 0.5;
    this.maxLife = this.life;
    this.size = options.size || 4;
    this.color = options.color || "#ffffff";
    this.type = options.type || "spark";
    this.text = options.text || "";
    this.gravity = options.gravity || 0;
    this.grow = options.grow || 0;
    this.rotation = options.rotation || rand(0, Math.PI * 2);
    this.spin = options.spin || rand(-6, 6);
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.size += this.grow * dt;
    this.rotation += this.spin * dt;
  }

  get active() {
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    if (this.type === "text") {
      ctx.globalAlpha = Math.min(1, alpha * 1.4);
      ctx.font = "900 20px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(32, 31, 51, 0.75)";
      ctx.fillStyle = this.color;
      ctx.strokeText(this.text, 0, 0);
      ctx.fillText(this.text, 0, 0);
    } else if (this.type === "ring") {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === "confetti") {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size, -this.size * 0.55, this.size * 2, this.size * 1.1);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.radius = 29;
    this.maxSpeed = 440;
    this.reset();
  }

  reset() {
    this.x = this.game.width / 2;
    this.y = this.game.height - 78;
    this.vx = 0;
    this.cooldown = 0;
    this.shootPulse = 0;
    this.hitPulse = 0;
    this.invincible = 0;
    this.weapon = "single";
    this.weaponTimer = 0;
    this.shieldTimer = 0;
  }

  update(dt) {
    const left = this.game.keys.has("ArrowLeft") || this.game.keys.has("KeyA");
    const right = this.game.keys.has("ArrowRight") || this.game.keys.has("KeyD");
    const shoot = this.game.keys.has("Space");
    const direction = (right ? 1 : 0) - (left ? 1 : 0);
    const targetVelocity = direction * this.maxSpeed;

    this.vx += (targetVelocity - this.vx) * Math.min(1, dt * 13);
    this.x += this.vx * dt;
    this.x = clamp(this.x, 45, this.game.width - 45);

    this.cooldown = Math.max(0, this.cooldown - dt);
    this.shootPulse = Math.max(0, this.shootPulse - dt);
    this.hitPulse = Math.max(0, this.hitPulse - dt);
    this.invincible = Math.max(0, this.invincible - dt);

    if (this.weaponTimer > 0) {
      this.weaponTimer -= dt;
      if (this.weaponTimer <= 0) {
        this.weapon = "single";
      }
    }
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
    }

    if (shoot && this.cooldown <= 0) {
      this.shoot();
    }
  }

  shoot() {
    const bullets = this.game.bullets;
    const y = this.y - 35;
    const speed = -610;

    if (this.weapon === "triple") {
      bullets.push(new Bullet(this.x, y, 0, speed, "player"));
      bullets.push(new Bullet(this.x - 18, y + 5, -95, speed + 25, "player"));
      bullets.push(new Bullet(this.x + 18, y + 5, 95, speed + 25, "player"));
      this.cooldown = 0.18;
    } else if (this.weapon === "double") {
      bullets.push(new Bullet(this.x - 13, y, -35, speed, "player"));
      bullets.push(new Bullet(this.x + 13, y, 35, speed, "player"));
      this.cooldown = 0.2;
    } else {
      bullets.push(new Bullet(this.x, y, 0, speed, "player"));
      this.cooldown = 0.23;
    }

    this.shootPulse = 0.16;
    this.game.audio.shoot();
    this.game.addMuzzleFlash(this.x, y);
  }

  draw(ctx) {
    const blink = this.invincible > 0 && Math.floor(this.invincible * 18) % 2 === 0;
    if (blink) {
      ctx.globalAlpha = 0.55;
    }

    const motionSquash = Math.abs(this.vx) / this.maxSpeed;
    const pulse = this.shootPulse / 0.16;
    const hit = this.hitPulse / 0.45;
    const squashX = 1 + motionSquash * 0.1 - pulse * 0.08 + hit * 0.12;
    const squashY = 1 - motionSquash * 0.08 + pulse * 0.14 - hit * 0.08;
    const bob = Math.sin(this.game.time * 8) * 1.5;

    ctx.save();
    ctx.translate(this.x, this.y + bob);

    if (this.shieldTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(this.game.time * 10) * 0.12;
      ctx.strokeStyle = "#63d8ff";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 44 + Math.sin(this.game.time * 7) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.scale(squashX, squashY);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#6a4b24";
    ctx.lineWidth = 7;

    ctx.beginPath();
    ctx.moveTo(-25, 7);
    ctx.quadraticCurveTo(-47, 8, -45, -8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(25, 7);
    ctx.quadraticCurveTo(47, 8, 45, -8);
    ctx.stroke();

    ctx.fillStyle = "#6a4b24";
    ctx.beginPath();
    ctx.ellipse(-14, 31, 9, 6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(14, 31, 9, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const bodyGradient = ctx.createRadialGradient(-12, -14, 5, 0, 0, 38);
    bodyGradient.addColorStop(0, "#fff39a");
    bodyGradient.addColorStop(0.42, "#ffd84a");
    bodyGradient.addColorStop(1, "#ffb33d");

    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = "#6a4b24";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.ellipse(-11, -13, 8, 5, -0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#201f33";
    ctx.beginPath();
    ctx.ellipse(-10, -4, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(10, -4, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff8faf";
    ctx.beginPath();
    ctx.arc(-17, 7, 5, 0, Math.PI * 2);
    ctx.arc(17, 7, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 4, 10, 0.16 * Math.PI, 0.84 * Math.PI);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class Enemy {
  constructor(game, homeX, homeY, type, wave, row, col) {
    this.game = game;
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX;
    this.y = homeY - 160 - row * 12;
    this.type = type;
    this.row = row;
    this.col = col;
    this.radius = type === "office" ? 24 : 22;
    this.maxHp = type === "brute" ? 2 + Math.floor(wave / 4) : 1 + (wave >= 4 && row === 0 ? 1 : 0);
    this.hp = this.maxHp;
    this.points = 80 + row * 25 + wave * 12 + (this.maxHp - 1) * 45;
    this.active = true;
    this.state = "formation";
    this.seed = rand(0, Math.PI * 2);
    this.hitTimer = 0;
    this.diveT = 0;
    this.diveDuration = 2.4;
    this.originX = homeX;
    this.originY = homeY;
    this.targetX = homeX;
    this.spin = 0;
  }

  startDive(targetX) {
    if (this.state !== "formation") {
      return;
    }
    this.state = "diving";
    this.diveT = 0;
    this.originX = this.x;
    this.originY = this.y;
    this.targetX = clamp(targetX + rand(-110, 110), 80, this.game.width - 80);
    this.diveDuration = rand(1.85, 2.65) - this.game.wave * 0.08;
    this.spin = rand(-0.7, 0.7);
  }

  update(dt) {
    this.hitTimer = Math.max(0, this.hitTimer - dt);

    if (this.state === "formation") {
      const targetX = this.homeX + this.game.formationOffset;
      const targetY = this.homeY + this.game.formationDrop + Math.sin(this.game.time * 3 + this.seed) * 4;
      this.x += (targetX - this.x) * Math.min(1, dt * 7.5);
      this.y += (targetY - this.y) * Math.min(1, dt * 7.5);
    } else if (this.state === "diving") {
      this.diveT += dt / this.diveDuration;
      const t = clamp(this.diveT, 0, 1);
      const sway = Math.sin(t * Math.PI * 3 + this.seed) * 65;
      const p0 = { x: this.originX, y: this.originY };
      const p1 = { x: this.originX + sway, y: this.originY + 130 };
      const p2 = { x: this.targetX - sway * 0.5, y: this.game.height - 170 };
      const p3 = { x: this.targetX, y: this.game.height + 55 };
      const omt = 1 - t;

      this.x = omt ** 3 * p0.x + 3 * omt ** 2 * t * p1.x + 3 * omt * t ** 2 * p2.x + t ** 3 * p3.x;
      this.y = omt ** 3 * p0.y + 3 * omt ** 2 * t * p1.y + 3 * omt * t ** 2 * p2.y + t ** 3 * p3.y;

      if (this.diveT >= 1) {
        this.state = "returning";
        this.y = -40;
        this.x = clamp(this.targetX + rand(-120, 120), 60, this.game.width - 60);
      }
    } else if (this.state === "returning") {
      const targetX = this.homeX + this.game.formationOffset;
      const targetY = this.homeY + this.game.formationDrop;
      this.x += (targetX - this.x) * Math.min(1, dt * 2.8);
      this.y += (targetY - this.y) * Math.min(1, dt * 2.8);
      if (Math.hypot(targetX - this.x, targetY - this.y) < 8) {
        this.state = "formation";
      }
    }
  }

  hit(damage) {
    this.hp -= damage;
    this.hitTimer = 0.18;
    return this.hp <= 0;
  }

  draw(ctx) {
    const hit = this.hitTimer / 0.18;
    const bob = Math.sin(this.game.time * 5 + this.seed) * 2;
    const squashX = 1 + hit * 0.35;
    const squashY = 1 - hit * 0.22;

    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(this.state === "diving" ? Math.sin(this.diveT * Math.PI * 2) * this.spin : 0);
    ctx.scale(squashX, squashY);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.type === "sprout") {
      this.drawSprout(ctx);
    } else if (this.type === "office") {
      this.drawOffice(ctx);
    } else if (this.type === "brute") {
      this.drawBrute(ctx);
    } else {
      this.drawBlob(ctx);
    }

    if (hit > 0) {
      ctx.globalAlpha = hit * 0.72;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawBlob(ctx) {
    ctx.fillStyle = "#9b7bff";
    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.quadraticCurveTo(-17, -29, -25, -19);
    ctx.moveTo(10, -18);
    ctx.quadraticCurveTo(17, -29, 25, -19);
    ctx.stroke();

    ctx.fillStyle = "#201f33";
    ctx.beginPath();
    ctx.arc(-8, -2, 4, 0, Math.PI * 2);
    ctx.arc(8, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 5, 8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }

  drawSprout(ctx) {
    ctx.fillStyle = "#71dc78";
    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 4, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#58e0ad";
    ctx.beginPath();
    ctx.ellipse(-8, -22, 13, 8, -0.5, 0, Math.PI * 2);
    ctx.ellipse(8, -22, 13, 8, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#201f33";
    ctx.beginPath();
    ctx.ellipse(-7, 0, 3, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(7, 0, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 7, 7, 0.05 * Math.PI, 0.95 * Math.PI);
    ctx.stroke();
  }

  drawOffice(ctx) {
    ctx.fillStyle = "#ffca7a";
    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 4;
    ctx.beginPath();
    drawRoundRect(ctx, -22, -22, 44, 44, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#3d475e";
    ctx.fillRect(-18, -28, 36, 14);
    ctx.strokeRect(-18, -28, 36, 14);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(-11, 22);
    ctx.lineTo(0, 9);
    ctx.lineTo(11, 22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ff6f91";
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.lineTo(6, 24);
    ctx.lineTo(-6, 24);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#201f33";
    ctx.beginPath();
    ctx.arc(-8, -3, 3.5, 0, Math.PI * 2);
    ctx.arc(8, -3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.quadraticCurveTo(0, 12, 7, 8);
    ctx.stroke();
  }

  drawBrute(ctx) {
    ctx.fillStyle = "#ff6f91";
    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 4;
    ctx.beginPath();
    drawRoundRect(ctx, -27, -20, 54, 42, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffe76f";
    ctx.beginPath();
    ctx.moveTo(-18, -18);
    ctx.lineTo(-11, -34);
    ctx.lineTo(-5, -17);
    ctx.moveTo(18, -18);
    ctx.lineTo(11, -34);
    ctx.lineTo(5, -17);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#201f33";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, 11);
    ctx.quadraticCurveTo(0, 18, 13, 11);
    ctx.stroke();
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.width = 900;
    this.height = 700;
    this.maxWave = 5;
    this.keys = new Set();
    this.audio = new ArcadeAudio();
    this.player = new Player(this);
    this.ui = new UI(this);
    this.highScoreKey = "sunny-pop-squadron-high-score";

    this.state = "ready";
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.lives = 3;
    this.wave = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.time = 0;
    this.lastTime = performance.now();
    this.shake = 0;
    this.flash = 0;
    this.waveBannerTimer = 0;
    this.stageClearTimer = 0;

    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.particles = [];
    this.powerups = [];
    this.stars = this.createStars(170);
    this.formationOffset = 0;
    this.formationDrop = 0;
    this.formationDirection = 1;
    this.diveTimer = 1.1;
    this.enemyShotTimer = 1.2;

    this.bindEvents();
    this.resize();
    this.ui.update();
    this.ui.showOverlay(
      "Arcade Mission",
      "Sunny Pop Squadron",
      "A cheerful yellow mascot is ready to clean up a very weird galaxy.",
      "Start Game"
    );
    requestAnimationFrame((time) => this.loop(time));
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "Space", "KeyA", "KeyD"].includes(event.code)) {
        event.preventDefault();
        this.audio.unlock();
        this.keys.add(event.code);
      }
      if (event.code === "Enter" && this.state !== "playing" && this.state !== "stageClear") {
        this.restart();
      }
    });
    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.code);
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.pixelWidth = Math.max(1, Math.floor(rect.width * dpr));
    this.pixelHeight = Math.max(1, Math.floor(rect.height * dpr));
    this.canvas.width = this.pixelWidth;
    this.canvas.height = this.pixelHeight;
    this.renderScaleX = this.pixelWidth / this.width;
    this.renderScaleY = this.pixelHeight / this.height;
  }

  loadHighScore() {
    try {
      return Number(window.localStorage.getItem(this.highScoreKey)) || 0;
    } catch (error) {
      return 0;
    }
  }

  saveHighScore() {
    this.highScore = Math.max(this.highScore, this.score);
    try {
      window.localStorage.setItem(this.highScoreKey, String(this.highScore));
    } catch (error) {
      return;
    }
  }

  restart() {
    this.audio.unlock();
    this.state = "playing";
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.combo = 0;
    this.comboTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.bullets = [];
    this.enemyBullets = [];
    this.particles = [];
    this.powerups = [];
    this.player.reset();
    this.spawnWave();
    this.ui.hideOverlay();
  }

  createStars(count) {
    const colors = ["#ffffff", "#ffe76f", "#63d8ff", "#ffb3c5", "#a6ffd7"];
    return Array.from({ length: count }, () => ({
      x: rand(0, this.width),
      y: rand(0, this.height),
      speed: rand(20, 120),
      size: rand(0.8, 2.8),
      color: pick(colors),
      twinkle: rand(0, Math.PI * 2)
    }));
  }

  spawnWave() {
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.powerups = [];
    this.formationOffset = 0;
    this.formationDrop = 0;
    this.formationDirection = 1;
    this.diveTimer = Math.max(0.42, 1.25 - this.wave * 0.13);
    this.enemyShotTimer = Math.max(0.55, 1.35 - this.wave * 0.12);
    this.waveBannerTimer = 2;

    const rows = Math.min(3 + Math.floor(this.wave / 2), 5);
    const cols = Math.min(7 + this.wave, 11);
    const spacingX = 68;
    const spacingY = 54;
    const startX = this.width / 2 - ((cols - 1) * spacingX) / 2;
    const startY = 88;
    const typeCycle = ["blob", "sprout", "office", "blob", "brute"];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        let type = typeCycle[(row + this.wave + col) % typeCycle.length];
        if (row === 0 && this.wave >= 3 && col % 3 === 0) {
          type = "brute";
        }
        this.enemies.push(new Enemy(
          this,
          startX + col * spacingX,
          startY + row * spacingY,
          type,
          this.wave,
          row,
          col
        ));
      }
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.033, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;
    this.time += dt;
    this.update(dt);
    this.render();
    requestAnimationFrame((time) => this.loop(time));
  }

  update(dt) {
    this.updateStars(dt);
    this.particles.forEach((particle) => particle.update(dt));
    this.particles = this.particles.filter((particle) => particle.active);

    this.shake = Math.max(0, this.shake - dt * 24);
    this.flash = Math.max(0, this.flash - dt * 2.8);

    if (this.state === "playing") {
      this.updatePlaying(dt);
    } else if (this.state === "stageClear") {
      this.stageClearTimer -= dt;
      if (this.stageClearTimer <= 0) {
        if (this.wave >= this.maxWave) {
          this.victory();
        } else {
          this.wave += 1;
          this.state = "playing";
          this.spawnWave();
        }
      }
    }

    this.ui.update();
  }

  updateStars(dt) {
    this.stars.forEach((star) => {
      star.y += star.speed * dt;
      star.twinkle += dt * 3;
      if (star.y > this.height + 8) {
        star.y = -8;
        star.x = rand(0, this.width);
      }
    });
  }

  updatePlaying(dt) {
    this.player.update(dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer <= 0) {
      this.combo = 0;
    }

    this.updateFormation(dt);
    this.updateEnemyAttacks(dt);

    this.bullets.forEach((bullet) => bullet.update(dt, this));
    this.enemyBullets.forEach((bullet) => bullet.update(dt, this));
    this.enemies.forEach((enemy) => enemy.active && enemy.update(dt));
    this.updatePowerups(dt);
    this.handleCollisions();

    this.bullets = this.bullets.filter((bullet) => bullet.active);
    this.enemyBullets = this.enemyBullets.filter((bullet) => bullet.active);
    this.enemies = this.enemies.filter((enemy) => enemy.active);
    this.powerups = this.powerups.filter((powerup) => powerup.active);

    if (this.enemies.length === 0) {
      this.clearWave();
    }
  }

  updateFormation(dt) {
    const speed = 35 + this.wave * 13;
    this.formationOffset += this.formationDirection * speed * dt;

    const formationEnemies = this.enemies.filter((enemy) => enemy.active && enemy.state === "formation");
    if (!formationEnemies.length) {
      return;
    }

    const minX = Math.min(...formationEnemies.map((enemy) => enemy.homeX + this.formationOffset - enemy.radius));
    const maxX = Math.max(...formationEnemies.map((enemy) => enemy.homeX + this.formationOffset + enemy.radius));

    if (minX < 42 || maxX > this.width - 42) {
      this.formationDirection *= -1;
      this.formationOffset = clamp(this.formationOffset, -74, 74);
      this.formationDrop += 10 + this.wave * 1.5;
    }
  }

  updateEnemyAttacks(dt) {
    this.diveTimer -= dt;
    this.enemyShotTimer -= dt;

    if (this.diveTimer <= 0) {
      const candidates = this.enemies.filter((enemy) => enemy.state === "formation");
      if (candidates.length) {
        pick(candidates).startDive(this.player.x);
      }
      this.diveTimer = Math.max(0.38, rand(1.2, 2.0) - this.wave * 0.16);
    }

    if (this.enemyShotTimer <= 0) {
      const shooters = this.enemies.filter((enemy) => enemy.active && enemy.y > 70);
      if (shooters.length) {
        const shooter = pick(shooters);
        const angle = Math.atan2(this.player.y - shooter.y, this.player.x - shooter.x);
        const speed = 190 + this.wave * 18;
        this.enemyBullets.push(new Bullet(
          shooter.x,
          shooter.y + 18,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          "enemy"
        ));
      }
      this.enemyShotTimer = Math.max(0.42, rand(0.75, 1.35) - this.wave * 0.09);
    }
  }

  updatePowerups(dt) {
    this.powerups.forEach((powerup) => {
      powerup.t += dt;
      powerup.y += powerup.vy * dt;
      powerup.x += Math.sin(powerup.t * 4) * 22 * dt;
      if (powerup.y > this.height + 40) {
        powerup.active = false;
      }
    });
  }

  handleCollisions() {
    for (const bullet of this.bullets) {
      if (!bullet.active) {
        continue;
      }
      for (const enemy of this.enemies) {
        if (!enemy.active || distance(bullet, enemy) > bullet.radius + enemy.radius) {
          continue;
        }
        bullet.active = false;
        this.spawnHitSparks(bullet.x, bullet.y);
        if (enemy.hit(bullet.damage)) {
          this.defeatEnemy(enemy);
        }
        break;
      }
    }

    for (const bullet of this.enemyBullets) {
      if (bullet.active && distance(bullet, this.player) < bullet.radius + this.player.radius * 0.82) {
        bullet.active = false;
        this.damagePlayer();
      }
    }

    for (const enemy of this.enemies) {
      if (enemy.active && distance(enemy, this.player) < enemy.radius + this.player.radius * 0.74) {
        this.defeatEnemy(enemy, false);
        this.damagePlayer();
      }
    }

    for (const powerup of this.powerups) {
      if (powerup.active && distance(powerup, this.player) < 34) {
        powerup.active = false;
        this.applyPowerup(powerup.type);
      }
    }
  }

  defeatEnemy(enemy, awardScore = true) {
    enemy.active = false;
    this.audio.explosion();
    this.shake = Math.max(this.shake, 5.5);
    this.flash = Math.max(this.flash, 0.14);
    this.spawnExplosion(enemy.x, enemy.y, enemy.type);

    if (awardScore) {
      this.combo += 1;
      this.comboTimer = 1.7;
      const multiplier = 1 + Math.min(this.combo - 1, 20) * 0.12;
      const gained = Math.round(enemy.points * multiplier);
      this.score += gained;
      this.saveHighScore();
      this.addScorePopup(enemy.x, enemy.y - 22, `+${gained}`);
    }

    const dropChance = 0.09 + this.wave * 0.018 + Math.min(this.combo, 12) * 0.006;
    if (awardScore && Math.random() < dropChance) {
      this.spawnPowerup(enemy.x, enemy.y);
    }
  }

  damagePlayer() {
    if (this.player.invincible > 0) {
      return;
    }

    if (this.player.shieldTimer > 0) {
      this.player.shieldTimer = 0;
      this.player.invincible = 1;
      this.audio.hit();
      this.shake = Math.max(this.shake, 8);
      this.addScorePopup(this.player.x, this.player.y - 42, "BLOCK");
      this.particles.push(new Particle({
        x: this.player.x,
        y: this.player.y,
        type: "ring",
        color: "#63d8ff",
        size: 24,
        grow: 90,
        life: 0.38
      }));
      return;
    }

    this.lives -= 1;
    this.player.invincible = 2.2;
    this.player.hitPulse = 0.45;
    this.combo = 0;
    this.comboTimer = 0;
    this.audio.hit();
    this.shake = Math.max(this.shake, 13);
    this.flash = Math.max(this.flash, 0.42);
    this.spawnExplosion(this.player.x, this.player.y, "player");

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  spawnPowerup(x, y) {
    this.powerups.push({
      x,
      y,
      type: pick(["double", "triple", "shield"]),
      vy: 86,
      t: 0,
      active: true
    });
  }

  applyPowerup(type) {
    if (type === "double") {
      this.player.weapon = "double";
      this.player.weaponTimer = Math.max(this.player.weaponTimer, 10);
      this.addScorePopup(this.player.x, this.player.y - 44, "DOUBLE");
    } else if (type === "triple") {
      this.player.weapon = "triple";
      this.player.weaponTimer = Math.max(this.player.weaponTimer, 9);
      this.addScorePopup(this.player.x, this.player.y - 44, "TRIPLE");
    } else {
      this.player.shieldTimer = Math.max(this.player.shieldTimer, 10);
      this.addScorePopup(this.player.x, this.player.y - 44, "SHIELD");
    }

    this.score += 100;
    this.saveHighScore();
    this.audio.power();
    this.particles.push(new Particle({
      x: this.player.x,
      y: this.player.y,
      type: "ring",
      color: "#ffe76f",
      size: 18,
      grow: 70,
      life: 0.5
    }));
  }

  clearWave() {
    this.state = "stageClear";
    this.stageClearTimer = 2.05;
    this.waveBannerTimer = 2.05;
    this.combo = 0;
    this.comboTimer = 0;
    this.score += 500 + this.wave * 250;
    this.saveHighScore();
    this.audio.stageClear();
    for (let i = 0; i < 80; i += 1) {
      this.particles.push(new Particle({
        x: rand(80, this.width - 80),
        y: rand(80, this.height * 0.55),
        vx: rand(-95, 95),
        vy: rand(-210, -40),
        gravity: 180,
        life: rand(0.8, 1.4),
        size: rand(3, 7),
        color: pick(["#ffe76f", "#63d8ff", "#ff6f91", "#58e0ad"]),
        type: "confetti"
      }));
    }
  }

  gameOver() {
    this.state = "gameover";
    this.saveHighScore();
    this.ui.showOverlay(
      "Mission Failed",
      "Game Over",
      `Final score: ${this.score.toLocaleString("en-US")}. The mascot is already stretching for another run.`,
      "Restart"
    );
  }

  victory() {
    this.state = "victory";
    this.saveHighScore();
    this.audio.stageClear();
    this.ui.showOverlay(
      "All Stages Clear",
      "Victory",
      `Final score: ${this.score.toLocaleString("en-US")}. The weird galaxy is sparkling again.`,
      "Play Again"
    );
  }

  addMuzzleFlash(x, y) {
    for (let i = 0; i < 8; i += 1) {
      this.particles.push(new Particle({
        x,
        y,
        vx: rand(-45, 45),
        vy: rand(-130, -30),
        life: rand(0.16, 0.32),
        size: rand(2, 4),
        color: pick(["#ffffff", "#63d8ff", "#ffe76f"])
      }));
    }
  }

  spawnHitSparks(x, y) {
    for (let i = 0; i < 6; i += 1) {
      this.particles.push(new Particle({
        x,
        y,
        vx: rand(-90, 90),
        vy: rand(-110, 40),
        gravity: 120,
        life: rand(0.18, 0.34),
        size: rand(2, 4),
        color: pick(["#ffffff", "#ffe76f", "#63d8ff"])
      }));
    }
  }

  spawnExplosion(x, y, type) {
    const palette = type === "player"
      ? ["#ffd84a", "#ff6f91", "#ffffff", "#63d8ff"]
      : ["#ff6f91", "#ffe76f", "#58e0ad", "#ffffff"];

    this.particles.push(new Particle({
      x,
      y,
      type: "ring",
      color: "#ffffff",
      size: 12,
      grow: 130,
      life: 0.36
    }));

    for (let i = 0; i < 22; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(70, 260);
      this.particles.push(new Particle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 110,
        life: rand(0.42, 0.82),
        size: rand(2.4, 6),
        color: pick(palette),
        type: Math.random() > 0.55 ? "confetti" : "spark"
      }));
    }
  }

  addScorePopup(x, y, text) {
    this.particles.push(new Particle({
      x,
      y,
      vy: -52,
      life: 0.9,
      size: 1,
      color: "#ffe76f",
      type: "text",
      text
    }));
  }

  render() {
    const ctx = this.ctx;
    ctx.setTransform(this.renderScaleX, 0, 0, this.renderScaleY, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const shakeX = this.shake > 0 ? rand(-this.shake, this.shake) : 0;
    const shakeY = this.shake > 0 ? rand(-this.shake, this.shake) : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);

    this.drawBackground(ctx);
    this.powerups.forEach((powerup) => this.drawPowerup(ctx, powerup));
    this.bullets.forEach((bullet) => bullet.draw(ctx));
    this.enemyBullets.forEach((bullet) => bullet.draw(ctx));
    this.enemies.forEach((enemy) => enemy.draw(ctx));
    this.player.draw(ctx);
    this.particles.forEach((particle) => particle.draw(ctx));
    this.drawBanners(ctx);

    ctx.restore();
    this.drawFlash(ctx);
  }

  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, "#171633");
    gradient.addColorStop(0.48, "#10345a");
    gradient.addColorStop(1, "#21163b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#63d8ff";
    ctx.lineWidth = 1;
    for (let y = 80; y < this.height; y += 72) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(this.time + y) * 6);
      ctx.lineTo(this.width, y + Math.cos(this.time + y) * 6);
      ctx.stroke();
    }
    ctx.restore();

    this.stars.forEach((star) => {
      const alpha = 0.45 + Math.sin(star.twinkle) * 0.28;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#ffe76f";
    for (let x = -80; x < this.width + 80; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      ctx.lineTo(x + 48, this.height - 86);
      ctx.lineTo(x + 96, this.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawPowerup(ctx, powerup) {
    const label = powerup.type === "double" ? "2" : powerup.type === "triple" ? "3" : "S";
    const color = powerup.type === "shield" ? "#63d8ff" : powerup.type === "triple" ? "#ff6f91" : "#ffe76f";
    const bob = Math.sin(powerup.t * 7) * 4;

    ctx.save();
    ctx.translate(powerup.x, powerup.y + bob);
    ctx.rotate(Math.sin(powerup.t * 5) * 0.12);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#201f33";
    ctx.lineWidth = 4;
    ctx.beginPath();
    drawRoundRect(ctx, -18, -18, 36, 36, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#201f33";
    ctx.font = "900 22px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  drawBanners(ctx) {
    if (this.waveBannerTimer <= 0 && this.state !== "ready") {
      return;
    }

    this.waveBannerTimer = Math.max(0, this.waveBannerTimer - 1 / 60);
    const alpha = this.state === "stageClear" ? clamp(this.stageClearTimer, 0, 1) : clamp(this.waveBannerTimer, 0, 1);
    const text = this.state === "stageClear" ? "STAGE CLEAR" : `STAGE ${this.wave}`;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.width / 2, 118);
    ctx.scale(1 + (1 - alpha) * 0.08, 1 - (1 - alpha) * 0.04);
    ctx.font = "900 46px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#201f33";
    ctx.fillStyle = "#ffe76f";
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  drawFlash(ctx) {
    if (this.flash <= 0) {
      return;
    }
    ctx.save();
    ctx.setTransform(this.renderScaleX, 0, 0, this.renderScaleY, 0, 0);
    ctx.globalAlpha = clamp(this.flash, 0, 0.45);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }
}

window.addEventListener("load", () => {
  new Game();
});
