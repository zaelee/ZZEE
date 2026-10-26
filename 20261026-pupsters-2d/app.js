(function () {
  "use strict";

  const data = window.PUPSTERS_DATA;
  const app = document.querySelector("#app");
  const modal = document.querySelector("#settings-modal");
  const state = {
    route: "home",
    selectedDog: "D01",
    squad: ["D01", "D02", "D03"],
    placements: {},
    selectedSlot: null,
    levels: {},
    running: false,
    speed: 1,
    progress: 0,
    wave: 1,
    coins: 600,
    raf: 0,
    lastTime: 0,
    codexFilter: "all"
  };
  const validRoutes = new Set(["home", "squad", "stages", "battle", "coop", "boss", "victory", "defeat", "codex", "kit"]);

  const icon = (name, label = "") => `<img class="inline-icon" src="assets/ui/icon-${name}.svg" alt="${label}">`;
  const dogById = (id) => data.dogs.find((dog) => dog.id === id);
  const enemyById = (id) => data.enemies.find((enemy) => enemy.id === id);
  const meter = (value, max = 5) => `<span class="dot-meter" aria-label="${max}칸 중 ${value}칸">${Array.from({ length: max }, (_, index) => `<i class="${index < value ? "on" : ""}"></i>`).join("")}</span>`;

  function dogImage(dog, className = "") {
    return `<span class="art-wrap ${className}" data-art-label="${dog.name}"><img src="${dog.image}" alt="${dog.name}, ${dog.breed}" loading="eager"></span>`;
  }

  function enemyImage(enemy, className = "") {
    return `<span class="art-wrap ${className}" data-art-label="${enemy.name}"><img src="${enemy.image}" alt="${enemy.name}" loading="lazy"></span>`;
  }

  function button(label, route, className = "") {
    return `<button class="shape-button ${className}" data-route="${route}">${label}</button>`;
  }

  function shell(content, className = "") {
    return `<section class="screen ${className}"><div class="paper-specks" aria-hidden="true"></div>${content}</section>`;
  }

  function homeView() {
    return shell(`
      <div class="home-cloud cloud-a" aria-hidden="true"></div><div class="home-cloud cloud-b" aria-hidden="true"></div>
      <div class="title-copy">
        <p class="eyebrow scribble">장난감보다 말썽이 먼저!</p>
        <h1><span>사고</span><span class="coral">멍치</span></h1>
        <p class="latin-mark">PUPSTERS</p>
        <p class="title-tagline">여섯 멍치가 벌이는<br>거실 한복판 방어 작전</p>
        <div class="title-actions">
          ${button(`${icon("play")} 놀러 가기`, "squad", "selected jumbo")}
          ${button("화면 둘러보기", "stages", "soft")}
        </div>
      </div>
      <div class="hero-pack" aria-label="사고멍치 여섯 캐릭터">
        ${data.dogs.map((dog, index) => `<div class="hero-dog dog-${index + 1}">${dogImage(dog)}<b>${dog.name}</b></div>`).join("")}
        <span class="hero-scribble one" aria-hidden="true">✦</span><span class="hero-scribble two" aria-hidden="true">〰</span>
      </div>
      <footer class="stage-footer"><span>화면 디자인 프로토타입</span><span>1–2명 · 장난감 방어</span></footer>
    `, "view-home");
  }

  function squadView() {
    const selected = dogById(state.selectedDog);
    return shell(`
      <div class="screen-head">
        <div><p class="eyebrow">출동 준비</p><h1>오늘의 멍치 편성</h1><p>카드를 눌러 세 자리를 채워 보세요.</p></div>
        <div class="squad-slots" aria-label="현재 편성">${[0, 1, 2].map((slot) => {
          const dog = dogById(state.squad[slot]);
          return `<button class="mini-slot ${dog ? "filled" : ""}" data-remove-squad="${dog?.id || ""}" aria-label="${dog ? `${dog.name} 편성 해제` : "빈 편성 자리"}">${dog ? `${dogImage(dog)}<b>${dog.name}</b>` : `<span>+</span><small>빈자리</small>`}</button>`;
        }).join("")}</div>
      </div>
      <div class="squad-layout">
        <div class="dog-grid" role="list" aria-label="멍치 목록">
          ${data.dogs.map((dog) => `<button role="listitem" class="dog-card tone-${dog.color} ${state.selectedDog === dog.id ? "is-selected" : ""}" data-select-dog="${dog.id}" aria-pressed="${state.selectedDog === dog.id}">
            <span class="card-check">${state.squad.includes(dog.id) ? "✓ 편성" : "+ 선택"}</span>${dogImage(dog, "card-art")}
            <span class="dog-card-copy"><small>${dog.breed} · ${dog.role}</small><b>${dog.name}</b><em>${dog.skill}</em></span>
          </button>`).join("")}
        </div>
        <aside class="dog-detail tone-${selected.color}" aria-label="선택한 멍치 정보">
          <div class="detail-sticker">${selected.id}</div>${dogImage(selected, "detail-art")}
          <div class="detail-copy"><p>${selected.breed} · ${selected.role}</p><h2>${selected.name}</h2><h3>${selected.skill}</h3><p>${selected.note}</p>
            <dl class="stats"><div><dt>힘</dt><dd>${meter(selected.power > 40 ? 5 : selected.power > 29 ? 4 : selected.power > 20 ? 3 : 2)}</dd></div><div><dt>범위</dt><dd>${meter(selected.range)}</dd></div><div><dt>속도</dt><dd>${meter(selected.speed)}</dd></div></dl>
            <button class="shape-button selected wide" data-toggle-squad="${selected.id}">${state.squad.includes(selected.id) ? "편성에서 빼기" : "이 멍치 편성"}</button>
          </div>
        </aside>
      </div>
      <div class="bottom-actions">${button("처음으로", "home", "ghost")}${button("스테이지 고르기 →", "stages", "selected")}</div>
    `, "view-squad");
  }

  function stagesView() {
    return shell(`
      <div class="screen-head compact"><div><p class="eyebrow">어디서 놀까?</p><h1>스테이지 고르기</h1></div><div class="room-progress">${icon("paw")} <b>1</b><span>/ 4 방</span></div></div>
      <div class="stage-map">
        ${data.stages.map((stage, index) => `<article class="room-card room-${index + 1} tone-${stage.color} ${stage.status === "locked" ? "locked" : "open"}">
          <div class="room-number">${index + 1}</div>
          <div class="room-thumb ${stage.id === "living" ? "has-bg" : ""}" ${stage.bg ? `style="--room-bg:url('${stage.bg}')"` : ""}><span>${stage.status === "locked" ? "🔒" : "START"}</span></div>
          <p>${stage.kicker}</p><h2>${stage.title}</h2><div class="room-meta"><span>${stage.waves} 웨이브</span><span>${stage.status === "open" ? "열림" : "조금만 기다려!"}</span></div>
          ${stage.status === "open" ? `<button class="shape-button selected" data-route="battle">들어가기 ${icon("arrow")}</button>` : `<button class="shape-button disabled" disabled>잠긴 방</button>`}
        </article>`).join("")}
      </div>
      <div class="bottom-actions">${button("← 편성 바꾸기", "squad", "ghost")}</div>
    `, "view-stages");
  }

  function routePath() {
    return data.route.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  }

  function battleStage({ boss = false } = {}) {
    const battleEnemy = boss ? enemyById("B01") : enemyById("E01");
    return `<div class="game-stage ${boss ? "boss-stage" : ""} ${state.running ? "is-running" : ""}" style="--attack-cycle:${2.2 / state.speed}s" id="game-stage">
      <img class="room-background" src="assets/backgrounds/living-room.png" alt="장난감이 흩어진 밝은 거실">
      <div class="room-fallback" aria-hidden="true"><span class="window-shape"></span><span class="sofa-shape"></span><span class="rug-shape"></span></div>
      <svg class="route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="route-shadow" d="${routePath()}"></path><path class="route-line" d="${routePath()}"></path></svg>
      <div class="route-label route-start">장난감 상자</div><div class="route-label route-goal">방석</div>
      ${boss ? "" : data.slots.map((slot, index) => {
        const dog = dogById(state.placements[index]);
        return `<button class="placement-slot ${dog ? "occupied" : ""} ${state.selectedSlot === index ? "is-selected" : ""}" style="left:${slot.x}%;top:${slot.y}%" data-slot="${index}" aria-label="${dog ? `${dog.name} 배치됨. 눌러서 강화 선택` : `${index + 1}번 자리, 선택한 멍치 배치`}">${dog ? `${dogImage(dog, "slot-dog")}<img class="slot-effect" src="${dog.effect}" alt=""><span>${dog.name} · Lv.${state.levels[index] || 1}</span>` : `<img src="assets/ui/placement-slot.svg" alt=""><span>여기!</span>`}</button>`;
      }).join("")}
      <div class="moving-enemy ${boss ? "is-boss" : ""}" id="moving-enemy">${enemyImage(battleEnemy)}<span class="hit-pop" aria-hidden="true">퍽!</span></div>
      <div class="battle-hud top-left"><span class="heart-count">${icon("heart")} <b>${boss ? 3 : 5}</b></span><span>WAVE <b>${boss ? "BOSS" : `${state.wave}/8`}</b></span></div>
      <div class="battle-hud top-right"><span>${icon("coin")} <b id="coin-count">${state.coins}</b></span><button class="hud-button" data-speed aria-label="재생 속도 변경">×${state.speed}</button><button class="hud-button" data-pause aria-label="${state.running ? "일시정지" : "시작"}">${icon(state.running ? "pause" : "play")}</button></div>
      ${boss ? `<div class="boss-bar"><span><b>블록사우루스</b><small>장난감 왕</small></span><div><i style="width:78%"></i></div><strong>갑옷 3/3</strong></div>` : ""}
    </div>`;
  }

  function battleView() {
    const placed = state.selectedSlot !== null && state.placements[state.selectedSlot];
    if (placed) state.selectedDog = placed;
    else if (!state.squad.includes(state.selectedDog)) state.selectedDog = state.squad[0];
    const selected = dogById(state.selectedDog);
    const level = state.levels[state.selectedSlot] || 1;
    return shell(`
      <div class="battle-heading"><div><p class="eyebrow">1. 거실 대소동</p><h1>장난감 길목을 지켜!</h1></div><p class="demo-chip">조작 가능한 배치 데모</p></div>
      <div class="battle-layout">
        <div class="stage-column">${battleStage()}<div class="stage-caption"><span>멍치를 고른 뒤 반짝이는 자리를 눌러 배치하세요.</span><span class="control-legend">${icon("play")} 시작 · ×2 속도 · ${icon("pause")} 멈춤</span></div></div>
        <aside class="battle-panel">
          <div class="panel-tabs" role="group" aria-label="전투 패널"><span class="active">멍치</span><button data-panel-message="배치한 멍치를 선택하면 간식 강화로 단계가 올라가요.">강화 안내</button></div>
          <div class="battle-roster">${state.squad.map((id) => {
            const dog = dogById(id); return `<button class="roster-dog ${state.selectedDog === id ? "active" : ""}" data-select-battle-dog="${id}" aria-pressed="${state.selectedDog === id}">${dogImage(dog)}<span><b>${dog.name}</b><small>${icon("coin")} ${dog.cost}</small></span></button>`;
          }).join("")}</div>
          <div class="upgrade-card tone-${selected.color}">${dogImage(selected)}<div><p>${placed ? `${state.selectedSlot + 1}번 자리 · Lv.${level}` : "배치할 멍치"}</p><h2>${selected.name}</h2><b>${selected.skill}</b><small>${selected.role}</small></div><button class="shape-button soft wide" data-upgrade ${!placed || level >= 3 || state.coins < 60 ? "disabled" : ""}>${!placed ? "먼저 자리에 배치하세요" : level >= 3 ? "최고 단계 · Lv.3" : `간식 강화 · ${icon("coin")} 60`}</button></div>
          <button class="shape-button selected wide wave-button" data-pause>${state.running ? `${icon("pause")} 잠깐 멈춤` : `${icon("play")} 웨이브 시작`}</button>
          <p class="panel-hint" id="panel-hint">${placed ? `${selected.name}을 선택했어요. 강화하거나 다른 자리에 더 배치할 수 있어요.` : `빈 자리를 눌러 ${selected.name}을 배치하세요.`}</p>
        </aside>
      </div>
      <div class="bottom-actions">${button("← 스테이지", "stages", "ghost")}<button class="shape-button ghost" data-reset-battle>배치 초기화</button>${button("결과 화면 보기", "victory", "soft")}</div>
    `, "view-battle");
  }

  function coopView() {
    const host = dogById("D01");
    const guest = dogById("D05");
    return shell(`
      <div class="screen-head compact"><div><p class="eyebrow">소파 옆자리 비었어!</p><h1>함께 놀기</h1><p>같은 화면에서 역할을 나눠 보는 로비 시안입니다.</p></div><div class="coop-code"><small>방 메모</small><b>멍-42</b></div></div>
      <div class="coop-board">
        <section class="player-card coral-player"><span class="player-stamp">1P · 방장</span>${dogImage(host, "player-art")}<div><p>공격 멍치</p><h2>${host.name}</h2><b>준비 완료!</b></div></section>
        <div class="coop-knot" aria-hidden="true"><span>+</span><i></i></div>
        <section class="player-card lavender-player"><span class="player-stamp">2P · 친구</span>${dogImage(guest, "player-art")}<div><p>연쇄 멍치</p><h2>${guest.name}</h2><b>준비 완료!</b></div></section>
        <div class="coop-plan"><div><b>${icon("paw")} 1P</b><span>왼쪽 자리 · 초반 방어</span></div><div><b>${icon("bolt")} 2P</b><span>오른쪽 자리 · 연쇄 공격</span></div><div><b>${icon("heart")} 함께</b><span>간식 코인 공유</span></div></div>
      </div>
      <div class="coop-actions"><button class="shape-button ghost" data-coop-copy>방 메모 보기</button>${button(`${icon("play")} 배치 화면 보기`, "battle", "selected jumbo")}</div>
      <p class="prototype-note">온라인 연결 없이 협동 로비의 화면 흐름만 보여 주는 디자인 시안입니다.</p>
    `, "view-coop");
  }

  function bossView() {
    return shell(`
      <div class="battle-heading"><div><p class="eyebrow">특별 작전 · 거실 보스 습격</p><h1>블록사우루스가 깨어났다!</h1></div><p class="demo-chip boss-chip">보스 모드 변형</p></div>
      <div class="boss-layout"><div class="stage-column">${battleStage({ boss: true })}<div class="stage-caption"><span>세 겹 장갑을 깨고 드러난 배를 노리세요.</span><span>다음 포효까지 08초</span></div></div>
        <aside class="boss-plan"><p class="eyebrow">작전 낙서</p><h2>장갑부터<br>차근차근!</h2><ol><li><span>1</span>머스키로 발을 얼린다</li><li><span>2</span>불돔으로 방향을 튼다</li><li><span>3</span>무들의 전기를 이어 준다</li></ol><div class="boss-sticker">꼬리 쪽이<br><b>빈틈!</b></div>${button("승리 화면 →", "victory", "selected wide")}</aside>
      </div>
      <div class="bottom-actions">${button("← 스테이지", "stages", "ghost")}</div>
    `, "view-boss");
  }

  function resultView(victory) {
    const lead = dogById(victory ? "D01" : "D02");
    return shell(`
      <div class="result-burst ${victory ? "win" : "lose"}" aria-hidden="true"></div>
      <div class="result-copy"><p class="eyebrow">${victory ? "거실을 지켜 냈다!" : "방석까지 밀려났다…"}</p><h1>${victory ? "우당탕 승리!" : "한 번 더 멍!"}</h1><p>${victory ? "흩어진 블록을 모두 장난감 상자로 돌려보냈어요." : "편성과 자리를 바꾸면 다음엔 충분히 막을 수 있어요."}</p>
        <div class="result-score"><div><small>${victory ? "남은 방석" : "최고 웨이브"}</small><b>${victory ? `${icon("heart")} 4` : "6 / 8"}</b></div><div><small>${victory ? "모은 간식" : "쓰러뜨린 블록"}</small><b>${victory ? `${icon("coin")} 320` : "24"}</b></div><div><small>오늘의 멍치</small><b>${lead.name}</b></div></div>
        <div class="result-actions">${button(victory ? "스테이지 선택" : "배치 다시 보기", victory ? "stages" : "battle", "selected jumbo")}${button("멍치 편성", "squad", "soft")}</div>
      </div>
      <div class="result-dog">${dogImage(lead)}<span>${victory ? "해냈다멍!" : "자리만 바꿔볼까?"}</span></div>
    `, `view-result ${victory ? "is-victory" : "is-defeat"}`);
  }

  function codexView() {
    const visible = data.enemies.filter((enemy) => state.codexFilter === "all" || (state.codexFilter === "boss" ? enemy.id.startsWith("B") : !enemy.id.startsWith("B")));
    return shell(`
      <div class="screen-head compact"><div><p class="eyebrow">장난감 상자 관찰 기록</p><h1>블록봇 도감</h1><p>생김새와 움직임을 미리 살펴봐요.</p></div><div class="codex-count"><b>${data.enemies.length}</b><span>종 발견</span></div></div>
      <div class="filter-tabs" role="group" aria-label="도감 필터"><button class="${state.codexFilter === "all" ? "active" : ""}" data-filter="all">모두</button><button class="${state.codexFilter === "normal" ? "active" : ""}" data-filter="normal">블록봇</button><button class="${state.codexFilter === "boss" ? "active" : ""}" data-filter="boss">보스</button></div>
      <div class="codex-grid">${visible.map((enemy) => `<article class="enemy-card ${enemy.id.startsWith("B") ? "boss-enemy" : ""}"><span class="enemy-id">${enemy.id}</span>${enemyImage(enemy, "enemy-art")}<div class="enemy-copy"><p>${enemy.role}</p><h2>${enemy.name}</h2><p>${enemy.clue}</p><div><span>튼튼함 ${meter(enemy.hp, 6)}</span><span>빠르기 ${meter(enemy.pace, 5)}</span></div></div></article>`).join("")}</div>
    `, "view-codex");
  }

  function kitView() {
    const raster = [
      ...data.dogs.map((dog) => ({ name: dog.name, path: dog.image, kind: "멍치" })),
      ...data.enemies.map((enemy) => ({ name: enemy.name, path: enemy.image, kind: "블록봇" })),
      { name: "거실", path: "assets/backgrounds/living-room.png", kind: "배경" },
      ...data.dogs.map((dog) => ({ name: `${dog.name} 공격 효과`, path: dog.effect, kind: "공격 효과" }))
    ];
    return shell(`
      <div class="screen-head compact"><div><p class="eyebrow">분리 원화와 조립 부품</p><h1>에셋 / UI 킷</h1><p>원본 아트와 편집 가능한 SVG를 바로 살펴보고 내려받을 수 있어요.</p><p><a href="downloads/pupsters-2d-20261026.zip" download>전체 작업 파일 ZIP ↓</a> · <a href="previews/line-weight.html">선 두께 기준·비교 →</a></p></div><div class="kit-stamp">2D<br><b>DOODLE</b></div></div>
      <section class="kit-section"><div class="section-title"><span>01</span><div><h2>원본 아트</h2><p>투명 PNG 캐릭터 · 16:9 거실 배경 · 분리 SVG 효과</p></div></div><div class="asset-grid raster-grid">${raster.map((asset) => `<article class="asset-card"><a href="${asset.path}" download><span class="asset-preview">${asset.kind === "멍치" ? dogImage(data.dogs.find((dog) => dog.image === asset.path)) : asset.kind === "블록봇" ? enemyImage(data.enemies.find((enemy) => enemy.image === asset.path)) : `<span class="room-asset" style="background-image:url('${asset.path}')"></span>`}</span><span class="asset-label"><small>${asset.kind}</small><b>${asset.name}</b><em>${asset.path.endsWith(".svg") ? "SVG" : "PNG"} ↓</em></span></a></article>`).join("")}</div></section>
      <section class="kit-section"><div class="section-title"><span>02</span><div><h2>손그림 UI 부품</h2><p>글자 없는 개별 SVG · 색과 선을 직접 편집 가능</p></div></div><div class="asset-grid ui-grid">${data.uiAssets.map((file) => `<article class="asset-card ui-asset"><a href="assets/ui/${file}" download><span class="asset-preview"><img src="assets/ui/${file}" alt="${file}"></span><span class="asset-label"><small>UI SVG</small><b>${file.replace(".svg", "")}</b><em>SVG ↓</em></span></a></article>`).join("")}</div></section>
    `, "view-kit");
  }

  const views = {
    home: homeView,
    squad: squadView,
    stages: stagesView,
    battle: battleView,
    coop: coopView,
    boss: bossView,
    victory: () => resultView(true),
    defeat: () => resultView(false),
    codex: codexView,
    kit: kitView
  };

  function render(route = state.route, options = {}) {
    stopAnimation();
    if (route !== state.route) state.running = false;
    state.route = validRoutes.has(route) ? route : "home";
    app.innerHTML = views[state.route]();
    document.body.dataset.route = state.route;
    document.querySelectorAll("[data-route]").forEach((node) => node.classList.toggle("active", node.dataset.route === state.route));
    if (state.route === "battle" || state.route === "boss") updateEnemyPosition();
    if ((state.route === "battle" || state.route === "boss") && state.running) state.raf = requestAnimationFrame(animate);
    if (state.route !== "battle" && state.route !== "boss") state.running = false;
    if (options.focus !== false) app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function navigate(route) {
    const hash = `#${route}`;
    if (location.hash === hash) render(route);
    else location.hash = hash;
  }

  function updateSquad(id) {
    const index = state.squad.indexOf(id);
    if (index >= 0) state.squad.splice(index, 1);
    else if (state.squad.length < 3) state.squad.push(id);
    else state.squad[state.squad.length - 1] = id;
    if (!state.squad.length) state.squad.push(id);
  }

  function pointOnRoute(progress) {
    const points = data.route;
    const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
    const total = lengths.reduce((sum, value) => sum + value, 0);
    let distance = progress * total;
    for (let index = 0; index < lengths.length; index += 1) {
      if (distance <= lengths[index]) {
        const ratio = distance / lengths[index];
        return { x: points[index].x + (points[index + 1].x - points[index].x) * ratio, y: points[index].y + (points[index + 1].y - points[index].y) * ratio };
      }
      distance -= lengths[index];
    }
    return points[points.length - 1];
  }

  function updateEnemyPosition() {
    const enemy = document.querySelector("#moving-enemy");
    if (!enemy) return;
    const point = pointOnRoute(state.progress);
    enemy.style.left = `${point.x}%`;
    enemy.style.top = `${point.y}%`;
  }

  function animate(time) {
    if (!state.running) return;
    const delta = Math.min(50, time - (state.lastTime || time));
    state.lastTime = time;
    state.progress += delta * 0.000035 * state.speed;
    if (state.progress >= 1) {
      state.progress = 0;
      state.wave = state.wave >= 8 ? 1 : state.wave + 1;
      if (state.route === "battle") state.coins += 80;
      render(state.route, { focus: false });
      return;
    }
    updateEnemyPosition();
    state.raf = requestAnimationFrame(animate);
  }

  function toggleAnimation() {
    state.running = !state.running;
    state.lastTime = 0;
    render(state.route, { focus: false });
  }

  function stopAnimation() {
    cancelAnimationFrame(state.raf);
    state.raf = 0;
    state.lastTime = 0;
  }

  document.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route]");
    if (routeButton) { event.preventDefault(); navigate(routeButton.dataset.route); return; }
    const dogSelect = event.target.closest("[data-select-dog]");
    if (dogSelect) { state.selectedDog = dogSelect.dataset.selectDog; render("squad", { focus: false }); return; }
    const toggleSquad = event.target.closest("[data-toggle-squad]");
    if (toggleSquad) { updateSquad(toggleSquad.dataset.toggleSquad); render("squad", { focus: false }); return; }
    const removeSquad = event.target.closest("[data-remove-squad]");
    if (removeSquad?.dataset.removeSquad && state.squad.length > 1) { updateSquad(removeSquad.dataset.removeSquad); render("squad", { focus: false }); return; }
    const battleDog = event.target.closest("[data-select-battle-dog]");
    if (battleDog) { state.selectedSlot = null; state.selectedDog = battleDog.dataset.selectBattleDog; render("battle", { focus: false }); return; }
    if (event.target.closest("[data-reset-battle]")) {
      state.placements = {}; state.levels = {}; state.selectedSlot = null;
      state.coins = 600; state.progress = 0; state.wave = 1; state.speed = 1; state.running = false;
      render("battle", { focus: false }); return;
    }
    const slot = event.target.closest("[data-slot]");
    if (slot) {
      const index = Number(slot.dataset.slot);
      const current = state.placements[index];
      if (current) {
        state.selectedSlot = index; state.selectedDog = current;
        render("battle", { focus: false }); return;
      }
      if (!current && state.coins < dogById(state.selectedDog).cost) {
        const hint = document.querySelector("#panel-hint");
        if (hint) hint.textContent = "간식 코인이 모자라요. 다른 멍치를 골라 보세요.";
        return;
      }
      if (!current) state.coins -= dogById(state.selectedDog).cost;
      state.placements[index] = state.selectedDog;
      state.selectedSlot = index;
      state.levels[index] = 1;
      render("battle", { focus: false }); return;
    }
    if (event.target.closest("[data-pause]")) { toggleAnimation(); return; }
    if (event.target.closest("[data-speed]")) { state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 3 : 1; render(state.route, { focus: false }); return; }
    if (event.target.closest("[data-upgrade]")) {
      const hint = document.querySelector("#panel-hint");
      if (state.selectedSlot === null || !state.placements[state.selectedSlot] || state.levels[state.selectedSlot] >= 3) return;
      if (state.coins >= 60) { state.coins -= 60; state.levels[state.selectedSlot] += 1; render("battle", { focus: false }); }
      else if (hint) hint.textContent = "간식 코인이 조금 모자라요.";
      return;
    }
    const filter = event.target.closest("[data-filter]");
    if (filter) { state.codexFilter = filter.dataset.filter; render("codex", { focus: false }); return; }
    const panelMessage = event.target.closest("[data-panel-message]");
    if (panelMessage) { document.querySelector("#panel-hint").textContent = panelMessage.dataset.panelMessage; return; }
    if (event.target.closest("[data-coop-copy]")) {
      const buttonNode = event.target.closest("[data-coop-copy]");
      buttonNode.textContent = "방 메모: 멍-42";
      return;
    }
    const toggle = event.target.closest(".toggle");
    if (toggle) { const on = toggle.getAttribute("aria-pressed") !== "true"; toggle.setAttribute("aria-pressed", String(on)); toggle.classList.toggle("is-on", on); }
  });

  document.addEventListener("error", (event) => {
    if (event.target.tagName !== "IMG") return;
    const art = event.target.closest(".art-wrap");
    if (art) art.classList.add("is-missing");
    if (event.target.classList.contains("room-background")) event.target.classList.add("is-missing");
  }, true);

  document.querySelector("#open-settings").addEventListener("click", () => modal.showModal());
  document.querySelector("#volume").addEventListener("input", (event) => { document.querySelector("#volume-output").textContent = `${event.target.value}%`; });
  window.addEventListener("hashchange", () => render(location.hash.slice(1) || "home"));
  window.addEventListener("beforeunload", stopAnimation);
  render(location.hash.slice(1) || "home", { focus: false });
}());
