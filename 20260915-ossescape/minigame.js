(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  const MINIGAME_DATA = {
    boxkeeper_inventory_check: {
      id: "boxkeeper_inventory_check",
      mode: "box_packing",
      title: "박스키퍼 / 재고 검수",
      enemy: "assets/runtime/characters/boxman.png",
      instruction: "상자, 테이프, 송장 순서로 클릭해 임시 포장을 끝내세요.",
      packSteps: ["box", "tape", "label"],
      onClear: { type: "boxkeeper_work_complete", phase: "inventory" }
    },
    boxkeeper_packing_work: {
      id: "boxkeeper_packing_work",
      mode: "box_packing",
      title: "박스키퍼 / 포장 작업",
      enemy: "assets/runtime/characters/boxman.png",
      instruction: "상자 두 개를 차례대로 포장하세요. 틀리면 콩이 하나 더 굴러듭니다.",
      packSteps: ["box", "tape", "label", "box", "tape", "label"],
      onClear: { type: "boxkeeper_work_complete", phase: "packing" }
    },
    boxkeeper_delivery_error: {
      id: "boxkeeper_delivery_error",
      mode: "box_packing",
      title: "박스키퍼 / 배송 오류",
      enemy: "assets/runtime/characters/boxman.png",
      instruction: "RB-13 상자를 다시 봉인하세요. 순서는 상자, 테이프, 송장입니다.",
      packSteps: ["box", "tape", "label", "tape", "label"],
      onClear: { type: "boxkeeper_work_complete", phase: "delivery" }
    },
    simkong_office_work: {
      id: "simkong_office_work",
      mode: "dodge",
      title: "심대리 / 업무 처리",
      duration: 9,
      enemy: "assets/runtime/characters/boss_before.png",
      instruction: "심대리가 던지는 업무 요청을 피하며 버티세요.",
      onClear: { type: "set_flag", flag: "simkong_office_work_done", value: true }
    },
    simkong_memory_recovery: {
      id: "simkong_memory_recovery",
      mode: "dodge",
      title: "심대리 / 기억 복구",
      duration: 10,
      enemy: "assets/runtime/characters/boss_before.png",
      instruction: "흩어진 기억 조각 사이에서 붉은콩을 피하세요.",
      onClear: { type: "set_flag", flag: "simkong_memory_restored", value: true }
    },
    red_root_liminal_route: {
      id: "red_root_liminal_route",
      mode: "dodge",
      title: "심콩 / 리미널 경로",
      duration: 11,
      enemy: "assets/runtime/characters/boss_after.png",
      instruction: "검은 복도 안에서 잘못된 길이 붉은콩처럼 쫓아옵니다.",
      onClear: { type: "set_flag", flag: "red_root_route_solved", value: true }
    },
    red_root_clock_out: {
      id: "red_root_clock_out",
      mode: "dodge",
      title: "심콩 / 퇴근 처리",
      duration: 12,
      enemy: "assets/runtime/characters/boss_after.png",
      instruction: "퇴근 승인 전까지 마지막 붉은콩을 피하세요.",
      onClear: { type: "set_flag", flag: "red_root_clock_out_done", value: true }
    },
    system_tap: {
      id: "system_tap",
      mode: "dodge",
      title: "Calibration",
      duration: 6,
      enemy: "assets/runtime/characters/boss_after.png",
      instruction: "시스템 보정 중입니다. 붉은 점을 피하세요.",
      onClear: { type: "set_flag", flag: "minigame_test_cleared", value: true }
    }
  };
  const PACKING_MISTAKE_LIMIT = 3;

  class MinigameSystem {
    constructor(game) {
      this.game = game;
      this.current = null;
      this.elapsed = 0;
      this.lastTime = 0;
      this.animationId = 0;
      this.keys = new Set();
      this.player = { x: 640, y: 590, radius: 12, speed: 285, hp: 3 };
      this.enemy = { x: 640, y: 230 };
      this.bullets = [];
      this.spawnTimer = 0;
      this.invincibleTimer = 0;
      this.packIndex = 0;
      this.packFlash = 0;
      this.packMistakes = 0;
      this.packTargets = [];
      this.helpTimer = 0;
      this.elements = this.createScreen();
      this.bindInput();
    }

    createScreen() {
      const screen = document.getElementById("game-screen");
      const root = document.createElement("section");
      root.id = "minigame-window";
      root.className = "minigame-window hidden";
      root.setAttribute("aria-label", "Minigame");
      root.innerHTML = [
        "<canvas id=\"minigame-canvas\" class=\"minigame-window__canvas\" width=\"1280\" height=\"720\"></canvas>",
        "<div class=\"minigame-window__hud\">",
        "  <strong id=\"minigame-title\"></strong>",
        "  <span id=\"minigame-status\"></span>",
        "</div>",
        "<button id=\"minigame-pause\" type=\"button\">일시정지</button>",
        "<p id=\"minigame-help\" class=\"minigame-window__help\"></p>"
      ].join("");

      screen.appendChild(root);
      root.querySelector("#minigame-pause").addEventListener("click", (event) => { event.stopPropagation(); this.togglePause(); });
      root.addEventListener("pointermove", (event) => {
        if (event.buttons && this.current?.mode === "dodge") this.handlePointer(event);
      });
      root.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) return;
        root.setPointerCapture(event.pointerId);
        event.preventDefault();
        event.stopPropagation();
        this.handlePointer(event);
      });
      root.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });

      const canvas = root.querySelector("#minigame-canvas");
      return {
        root,
        canvas,
        ctx: canvas.getContext("2d"),
        title: root.querySelector("#minigame-title"),
        status: root.querySelector("#minigame-status"),
        help: root.querySelector("#minigame-help")
      };
    }

    bindInput() {
      window.addEventListener("blur", () => { this.keys.clear(); this.pointerTarget = null; });
      document.addEventListener("visibilitychange", () => { this.keys.clear(); this.pointerTarget = null; });
      window.addEventListener("keydown", (event) => {
        if (!this.isOpen()) return;
        const key = this.normalizeKey(event.key);
        if (key === "escape") {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (!event.repeat) this.togglePause();
          return;
        }
        if (key) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.keys.add(key);
        }
      }, true);

      window.addEventListener("keyup", (event) => {
        if (!this.isOpen()) return;
        const key = this.normalizeKey(event.key);
        if (key) {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.keys.delete(key);
        }
      }, true);
    }

    togglePause() {
      this.paused = !this.paused;
      this.keys.clear();
      this.pointerTarget = null;
      this.elements.root.querySelector("#minigame-pause").textContent = this.paused ? "계속하기" : "일시정지";
      this.elements.help.textContent = this.paused ? "일시정지 · 계속하기 또는 ESC" : "WASD / 방향키 또는 화면 드래그 · ESC: 일시정지";
    }

    normalizeKey(key) {
      const value = String(key).toLowerCase();
      if (value === "arrowup" || value === "w") return "up";
      if (value === "arrowdown" || value === "s") return "down";
      if (value === "arrowleft" || value === "a") return "left";
      if (value === "arrowright" || value === "d") return "right";
      if (value === "escape") return "escape";
      return "";
    }

    start(minigameId) {
      const data = MINIGAME_DATA[minigameId];
      if (!data) {
        console.warn(`Missing minigame: ${minigameId}`);
        return;
      }

      this.cancel();
      this.paused = false;
      this.pointerTarget = null;
      this.current = data;
      this.elapsed = 0;
      this.lastTime = performance.now();
      this.keys.clear();
      this.player = { x: 640, y: 590, radius: 12, speed: 285, hp: 3 };
      this.enemy = { x: 640, y: data.mode === "box_packing" ? 150 : 230 };
      this.bullets = [];
      this.spawnTimer = 0;
      this.invincibleTimer = 0;
      this.packIndex = 0;
      this.packFlash = 0;
      this.packMistakes = 0;
      this.packTargets = this.createPackTargets();
      this.helpTimer = data.mode === "box_packing" ? 2.4 : 3.2;
      this.elements.root.querySelector("#minigame-pause").textContent = "일시정지";
      this.elements.title.textContent = data.title;
      this.elements.help.textContent = data.mode === "box_packing"
        ? "마우스로 포장 순서 클릭 · ESC: 일시정지"
        : "WASD / 방향키 또는 화면 드래그로 피하기 · ESC: 일시정지";
      this.elements.root.classList.remove("hidden");
      this.loop(this.lastTime);
    }

    isOpen() {
      return Boolean(this.current) && !this.elements.root.classList.contains("hidden");
    }

    cancel() {
      this.current = null;
      this.keys.clear();
      this.bullets = [];
      this.elements.root.classList.add("hidden");
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = 0;
      }
    }

    complete() {
      const action = this.current?.onClear;
      this.cancel();
      if (action) this.game.handleAction(action);
    }

    loop(now) {
      if (!this.current) return;
      const delta = Math.min(0.033, Math.max(0, (now - this.lastTime) / 1000));
      this.lastTime = now;
      if (!this.paused && !document.hidden) this.update(delta);
      if (!this.current) return;
      this.draw();
      this.animationId = requestAnimationFrame((time) => this.loop(time));
    }

    update(delta) {
      this.elapsed += delta;
      this.packFlash = Math.max(0, this.packFlash - delta);
      this.helpTimer = Math.max(0, this.helpTimer - delta);
      if (this.current.mode === "box_packing") {
        return;
      }

      this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);
      this.updatePlayer(delta);
      this.updateBullets(delta);
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnBulletWave();
        const pressure = Math.min(0.42, this.elapsed / 40);
        this.spawnTimer = Math.max(0.28, 0.82 - pressure);
      }

      if (this.player.hp <= 0) {
        if (this.current.id && this.current.id.startsWith("red_root_")) {
          this.cancel();
          this.game.ending.show("bad_end_red_root_failed");
          return;
        }
        this.player.hp = 3;
        this.player.x = 640;
        this.player.y = 590;
        this.bullets = [];
        this.elapsed = Math.max(0, this.elapsed - 1.2);
        this.invincibleTimer = 1.1;
      }

      if (this.elapsed >= this.current.duration) {
        this.complete();
      }
    }

    handlePointer(event) {
      if (!this.current || this.paused) return;
      const rect = this.elements.canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 1280;
      const y = ((event.clientY - rect.top) / rect.height) * 720;
      if (this.current.mode === "dodge") {
        this.pointerTarget = { x: Math.max(60, Math.min(1220, x)), y: Math.max(350, Math.min(670, y)) };
        return;
      }
      const expected = this.current.packSteps[this.packIndex];
      const hoveredTargets = this.packTargets.filter((item) => (
        x >= item.x
        && x <= item.x + item.width
        && y >= item.y
        && y <= item.y + item.height
      ));
      const target = hoveredTargets.find((item) => item.type === expected) || hoveredTargets[0];
      if (!target) return;

      if (target.type === expected) {
        this.packIndex += 1;
        this.packFlash = 0.18;
        if (this.packIndex >= this.current.packSteps.length) {
          this.complete();
        }
      } else {
        this.packMistakes += 1;
        this.packFlash = 0.32;
        if (this.packMistakes >= PACKING_MISTAKE_LIMIT) {
          this.failBoxkeeperPacking();
        }
      }
    }

    failBoxkeeperPacking() {
      this.cancel();
      this.game.handleAction({ type: "boxkeeper_reset" });
    }

    createPackTargets() {
      return [
        { type: "box", label: "상자", x: 450, y: 324, width: 380, height: 190 },
        { type: "tape", label: "테이프", x: 506, y: 382, width: 268, height: 66 },
        { type: "label", label: "라벨", x: 662, y: 318, width: 142, height: 102 }
      ];
    }

    updatePlayer(delta) {
      let dx = 0;
      let dy = 0;
      if (this.keys.has("left")) dx -= 1;
      if (this.keys.has("right")) dx += 1;
      if (this.keys.has("up")) dy -= 1;
      if (this.keys.has("down")) dy += 1;
      if (dx || dy) this.pointerTarget = null;
      else if (this.pointerTarget) {
        const distance = Math.hypot(this.pointerTarget.x - this.player.x, this.pointerTarget.y - this.player.y);
        if (distance > 1) {
          const step = Math.min(distance, this.player.speed * delta);
          this.player.x += (this.pointerTarget.x - this.player.x) / distance * step;
          this.player.y += (this.pointerTarget.y - this.player.y) / distance * step;
        }
      }
      const length = Math.hypot(dx, dy) || 1;
      this.player.x += (dx / length) * this.player.speed * delta;
      this.player.y += (dy / length) * this.player.speed * delta;
      this.player.x = Math.max(60, Math.min(1220, this.player.x));
      this.player.y = Math.max(350, Math.min(670, this.player.y));
    }

    updateBullets(delta) {
      this.bullets.forEach((bullet) => {
        bullet.x += bullet.vx * delta;
        bullet.y += bullet.vy * delta;
        bullet.life -= delta;
      });
      this.bullets = this.bullets.filter((bullet) => (
        bullet.life > 0
        && bullet.x > -40
        && bullet.x < 1320
        && bullet.y > -40
        && bullet.y < 760
      ));

      if (this.invincibleTimer > 0) return;
      this.bullets.forEach((bullet) => {
        if (this.invincibleTimer > 0) return;
        if (bullet.hit) return;
        const distance = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
        if (distance < bullet.radius + this.player.radius) {
          bullet.hit = true;
          this.player.hp -= 1;
          this.invincibleTimer = 0.8;
        }
      });
    }

    spawnBulletWave() {
      const count = 5 + Math.floor(this.elapsed / 3);
      const baseAngle = Math.random() * Math.PI * 2;
      for (let index = 0; index < count; index += 1) {
        const angle = baseAngle + (Math.PI * 2 * index) / count + Math.sin(this.elapsed) * 0.18;
        const speed = 125 + Math.min(95, this.elapsed * 8) + Math.random() * 22;
        this.bullets.push({
          x: this.enemy.x,
          y: this.enemy.y + 36,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 55,
          radius: 8,
          life: 6,
          hit: false
        });
      }
    }

    draw() {
      const ctx = this.elements.ctx;
      ctx.clearRect(0, 0, 1280, 720);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 1280, 720);
      this.drawBackgroundNoise(ctx);
      this.drawEnemy(ctx);

      if (this.current.mode === "box_packing") {
        this.drawPackingGame(ctx);
      } else {
        this.drawBullets(ctx);
        this.drawPlayer(ctx);
      }
      this.drawStartHint(ctx);
      this.drawStatus();
    }

    drawStartHint(ctx) {
      if (this.helpTimer <= 0) return;
      const alpha = Math.min(1, this.helpTimer / 0.6);
      const text = this.current.mode === "box_packing"
        ? "상자, 테이프, 라벨 순서로 클릭하세요!"
        : "화살표를 움직여서 붉은콩을 피하세요!";

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
      ctx.fillRect(304, 72, 672, 48);
      ctx.strokeStyle = "rgba(255, 226, 120, 0.88)";
      ctx.lineWidth = 2;
      ctx.strokeRect(304, 72, 672, 48);
      ctx.fillStyle = "#ffe278";
      ctx.font = "22px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(text, 640, 104);
      ctx.restore();
    }

    drawBackgroundNoise(ctx) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "#f4f0e8";
      for (let y = 0; y < 720; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(this.elapsed * 12 + y) * 1.5);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawEnemy(ctx) {
      const image = this.game.getCharacterImage(this.current.enemy || "assets/runtime/characters/boss_after.png");
      const bob = Math.sin(this.elapsed * 3) * 4;
      if (image.complete && image.naturalWidth > 0) {
        const targetHeight = this.current.enemy?.includes("boxman") ? 170 : 190;
        const targetWidth = targetHeight * (image.naturalWidth / image.naturalHeight);
        ctx.save();
        ctx.shadowColor = "rgba(140, 0, 0, 0.8)";
        ctx.shadowBlur = 24;
        ctx.drawImage(image, this.enemy.x - targetWidth / 2, this.enemy.y - targetHeight / 2 + bob, targetWidth, targetHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = "#9c2020";
        ctx.beginPath();
        ctx.ellipse(this.enemy.x, this.enemy.y + bob, 42, 52, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawPackingGame(ctx) {
      const expected = this.current.packSteps[this.packIndex] || "";
      const shake = this.packFlash > 0 && this.packMistakes > 0 ? Math.sin(this.elapsed * 60) * 4 : 0;
      ctx.save();
      ctx.translate(shake, 0);
      ctx.fillStyle = "#b67a42";
      ctx.fillRect(450, 324, 380, 190);
      ctx.fillStyle = "#8e5f33";
      ctx.fillRect(450, 324, 380, 28);
      ctx.strokeStyle = expected === "box" ? "#ffe278" : "#21170f";
      ctx.lineWidth = expected === "box" ? 5 : 3;
      ctx.strokeRect(450, 324, 380, 190);

      ctx.fillStyle = "#d8d0b8";
      ctx.fillRect(522, 398, 236, 34);
      ctx.strokeStyle = expected === "tape" ? "#ffe278" : "#453f32";
      ctx.lineWidth = expected === "tape" ? 5 : 3;
      ctx.strokeRect(522, 398, 236, 34);

      ctx.fillStyle = "#f4f0e8";
      ctx.fillRect(682, 338, 100, 62);
      ctx.strokeStyle = expected === "label" ? "#ffe278" : "#453f32";
      ctx.lineWidth = expected === "label" ? 5 : 3;
      ctx.strokeRect(682, 338, 100, 62);
      ctx.fillStyle = "#111";
      ctx.font = "16px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("RB-13", 732, 366);
      ctx.fillText("LOT 04", 732, 386);
      ctx.restore();

      ctx.fillStyle = "#f4f0e8";
      ctx.font = "20px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(this.current.instruction, 640, 574);
      ctx.fillStyle = "#ffe278";
      ctx.fillText(`다음 클릭: ${this.getPackLabel(expected)}`, 640, 610);
    }

    getPackLabel(type) {
      if (type === "box") return "상자";
      if (type === "tape") return "테이프";
      if (type === "label") return "라벨";
      return "완료";
    }

    drawBullets(ctx) {
      ctx.fillStyle = "#b21717";
      this.bullets.forEach((bullet) => {
        if (bullet.hit) return;
        ctx.beginPath();
        ctx.ellipse(bullet.x, bullet.y, bullet.radius, bullet.radius, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    drawPlayer(ctx) {
      ctx.save();
      ctx.globalAlpha = this.invincibleTimer > 0 && Math.floor(this.elapsed * 18) % 2 === 0 ? 0.45 : 1;
      ctx.fillStyle = "#f4f0e8";
      ctx.fillRect(this.player.x - 10, this.player.y - 14, 20, 28);
      ctx.fillStyle = "#ffe278";
      ctx.fillRect(this.player.x - 6, this.player.y - 20, 12, 8);
      ctx.restore();
    }

    drawStatus() {
      if (this.current.mode === "box_packing") {
        this.elements.status.textContent = `포장 ${this.packIndex} / ${this.current.packSteps.length} · 실수 ${this.packMistakes}`;
        return;
      }
      const remain = Math.max(0, this.current.duration - this.elapsed);
      this.elements.status.textContent = `남은 시간 ${remain.toFixed(1)}초 · 체력 ${this.player.hp}`;
    }
  }

  window.OSSE.MinigameSystem = MinigameSystem;
  window.OSSE.MINIGAME_DATA = MINIGAME_DATA;
})();
