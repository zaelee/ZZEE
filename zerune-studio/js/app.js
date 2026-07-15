(function startStudio() {
  "use strict";

  const presets = globalThis.IMPOSSIBLE_SPACES_PRESETS;
  const engine = globalThis.ImpossibleSpacesEngine;
  if (!presets || !engine) {
    document.body.textContent = "필수 데이터 파일을 불러오지 못했습니다.";
    return;
  }

  const STORAGE_PREFIX = "zerune-studio/v2/";
  const CURRENT_PRESET_KEY = `${STORAGE_PREFIX}current-preset`;
  const CURRENT_STAGE_KEY = `${STORAGE_PREFIX}current-stage`;

  const STAGES = {
    concept: {
      number: "01",
      title: "콘셉트",
      description: "한 문장으로 장면을 정하고 사람들이 누르고 싶은 제목을 고릅니다.",
      nodes: ["brief", "titles"],
      connections: [["brief", "titles"]],
      board: { width: 1280, height: 1050 },
    },
    keywords: {
      number: "02",
      title: "키워드",
      description: "장소·의식·감각·정서를 음악 재료와 이미지 재료로 나눕니다.",
      nodes: ["keywords", "visual"],
      connections: [["keywords", "visual"]],
      board: { width: 1280, height: 1180 },
    },
    sound: {
      number: "03",
      title: "사운드 + 구조",
      description: "사운드 팔레트와 트랙 수를 정합니다. 이 트랙 수가 다음 단계 프롬프트 수가 됩니다.",
      nodes: ["sound", "duration"],
      connections: [["sound", "duration"]],
      board: { width: 1280, height: 1550 },
    },
    prompts: {
      number: "04",
      title: "프롬프트",
      description: "추천 메인 음악 프롬프트에 각 트랙 구조를 붙이고, 같은 정서를 이미지 프롬프트와 참고 프레임으로 연결합니다.",
      nodes: ["music", "image", "references"],
      connections: [["music", "image"], ["image", "references"]],
      board: { width: 1550, height: 2550 },
    },
  };
  const STAGE_IDS = Object.keys(STAGES);

  const DEFAULT_POSITIONS = {
    brief: { x: 60, y: 60 },
    titles: { x: 480, y: 60 },
    keywords: { x: 60, y: 60 },
    visual: { x: 480, y: 60 },
    sound: { x: 60, y: 60 },
    duration: { x: 480, y: 60 },
    music: { x: 60, y: 60 },
    image: { x: 750, y: 60 },
    references: { x: 60, y: 1350 },
  };

  const NODE_DEFINITIONS = {
    brief: { index: "01 · INPUT", title: "콘셉트 브리프", kind: "input" },
    titles: { index: "01 · OUTPUT", title: "클릭 제목 후보", kind: "output", wide: true },
    keywords: { index: "02 · INPUT", title: "음악 키워드 라이브러리", kind: "input" },
    visual: { index: "02 · INPUT", title: "이미지 키워드 라이브러리", kind: "input", wide: true },
    sound: { index: "03 · INPUT", title: "사운드 설계", kind: "input" },
    duration: { index: "03 · STRUCTURE", title: "대표편 트랙 구조", kind: "output", wide: true },
    music: { index: "04 · MUSIC", title: "메인 + 트랙별 Mureka 프롬프트", kind: "output", xl: true },
    image: { index: "04 · IMAGE", title: "음악과 연결된 이미지 프롬프트", kind: "output", xl: true },
    references: { index: "04 · REFERENCES", title: "키워드로 찾은 참고 프레임 10개", kind: "guard", gallery: true },
  };

  const FIELD_GROUPS = {
    brief: [
      ["concept", "핵심 장면", 4],
      ["location", "장소", 3],
      ["ritual", "행동 / 의식", 3],
      ["emotion", "감정 곡선", 3],
      ["promise", "관객에게 주는 약속", 3],
    ],
    keywords: [
      ["keywordLocation", "공간", 5],
      ["keywordRitual", "사물 / 의식", 5],
      ["keywordSensory", "감각", 5],
      ["keywordEmotion", "정서", 4],
      ["keywordMusic", "음악", 4],
      ["keywordDiscovery", "검색 / 발견", 4],
    ],
    visual: [
      ["visualSubject", "주 피사체", 4],
      ["visualSetting", "공간 / 시간", 4],
      ["visualCamera", "카메라 / 구도", 3],
      ["visualPalette", "색", 2],
      ["visualTexture", "재질 / 후처리", 3],
      ["visualExclusions", "제외할 이미지 요소", 4],
      ["visualOverlay", "후편집 썸네일 문구", 2],
    ],
    sound: [
      ["bpm", "BPM", 1, "input"],
      ["key", "조성 / 모드", 2],
      ["meter", "박자 / 리듬", 2],
      ["genres", "장르 결합", 4],
      ["instruments", "악기", 4],
      ["texture", "환경 질감", 4],
      ["musicExclusions", "제외할 음악 요소", 4],
    ],
  };

  const dom = {
    board: document.querySelector("#board"),
    nodes: document.querySelector("#nodes"),
    wires: document.querySelector("#wires"),
    viewport: document.querySelector("#viewport"),
    template: document.querySelector("#nodeTemplate"),
    toast: document.querySelector("#toast"),
    presetName: document.querySelector("#presetName"),
    presetEyebrow: document.querySelector("#presetEyebrow"),
    presetStatus: document.querySelector("#presetStatus"),
    stageNumber: document.querySelector("#stageNumber"),
    stageTitle: document.querySelector("#stageTitle"),
    stageDescription: document.querySelector("#stageDescription"),
    nextStageButton: document.querySelector("#nextStageButton"),
    importFile: document.querySelector("#importFile"),
  };

  let currentPresetId = loadKey(CURRENT_PRESET_KEY, (value) => Boolean(presets[value]), Object.keys(presets)[0]);
  let currentStageId = loadKey(CURRENT_STAGE_KEY, (value) => Boolean(STAGES[value]), STAGE_IDS[0]);
  let state = loadState(currentPresetId);
  let generated = engine.generate(presets[currentPresetId], state.fields);
  let toastTimer;
  let resizeObserver;

  function loadKey(key, validate, fallback) {
    try {
      const value = localStorage.getItem(key);
      return validate(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function defaultFields(preset) {
    return {
      concept: preset.theme.concept,
      location: preset.theme.location,
      ritual: preset.theme.ritual,
      emotion: preset.theme.emotion,
      promise: preset.theme.promise,
      keywordLocation: preset.keywords.location,
      keywordRitual: preset.keywords.ritual,
      keywordSensory: preset.keywords.sensory,
      keywordEmotion: preset.keywords.emotion,
      keywordMusic: preset.keywords.music,
      keywordDiscovery: preset.keywords.discovery,
      bpm: preset.music.bpm,
      key: preset.music.key,
      meter: preset.music.meter,
      genres: preset.music.genres,
      instruments: preset.music.instruments,
      texture: preset.music.texture,
      musicExclusions: preset.music.exclusions,
      pilot: String(preset.duration.pilot),
      flagship: String(preset.duration.flagship),
      extended: String(preset.duration.extended),
      chapters: String(preset.tracks.length),
      crossfade: preset.duration.crossfade,
      visualSubject: preset.visual.subject,
      visualSetting: preset.visual.setting,
      visualCamera: preset.visual.camera,
      visualPalette: preset.visual.palette,
      visualTexture: preset.visual.texture,
      visualExclusions: preset.visual.exclusions,
      visualOverlay: preset.visual.overlay,
    };
  }

  function defaultState(presetId) {
    return {
      version: 2,
      updatedAt: new Date().toISOString(),
      fields: defaultFields(presets[presetId]),
      positions: structuredClone(DEFAULT_POSITIONS),
      lockedNodes: [],
    };
  }

  function loadState(presetId) {
    const defaults = defaultState(presetId);
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${presetId}`);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      return {
        ...defaults,
        fields: { ...defaults.fields, ...(saved.fields || {}) },
        positions: { ...defaults.positions, ...(saved.positions || {}) },
        lockedNodes: Array.isArray(saved.lockedNodes) ? saved.lockedNodes : [],
      };
    } catch {
      return defaults;
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${currentPresetId}`, JSON.stringify(state));
      localStorage.setItem(CURRENT_PRESET_KEY, currentPresetId);
      localStorage.setItem(CURRENT_STAGE_KEY, currentStageId);
    } catch {
      showToast("자동 저장을 사용할 수 없습니다");
    }
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function renderAll({ preserveScroll = true } = {}) {
    const scroll = { left: dom.viewport.scrollLeft, top: dom.viewport.scrollTop };
    const preset = presets[currentPresetId];
    const stage = STAGES[currentStageId];
    generated = engine.generate(preset, state.fields);

    document.documentElement.style.setProperty("--accent", preset.meta.accent);
    document.documentElement.style.setProperty("--board-width", `${stage.board.width}px`);
    document.documentElement.style.setProperty("--board-height", `${stage.board.height}px`);
    dom.presetName.textContent = preset.meta.name;
    dom.presetEyebrow.textContent = preset.meta.eyebrow;
    dom.presetStatus.textContent = preset.meta.status;
    dom.stageNumber.textContent = `FLOW ${stage.number}`;
    dom.stageTitle.textContent = stage.title;
    dom.stageDescription.textContent = stage.description;
    const currentIndex = STAGE_IDS.indexOf(currentStageId);
    dom.nextStageButton.textContent = currentIndex === STAGE_IDS.length - 1 ? "첫 단계로 ↺" : "다음 단계 →";

    document.querySelectorAll("[data-preset]").forEach((button) => {
      const active = button.dataset.preset === currentPresetId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-stage]").forEach((button) => {
      const index = STAGE_IDS.indexOf(button.dataset.stage);
      const active = button.dataset.stage === currentStageId;
      button.classList.toggle("is-active", active);
      button.classList.toggle("is-complete", index < currentIndex);
      button.setAttribute("aria-current", active ? "step" : "false");
    });

    if (resizeObserver) resizeObserver.disconnect();
    dom.nodes.replaceChildren();
    stage.nodes.forEach(renderNode);
    resizeObserver = new ResizeObserver(drawWires);
    dom.nodes.querySelectorAll(".node").forEach((node) => resizeObserver.observe(node));
    requestAnimationFrame(drawWires);
    if (preserveScroll) {
      dom.viewport.scrollLeft = scroll.left;
      dom.viewport.scrollTop = scroll.top;
    }
  }

  function renderNode(id) {
    const definition = NODE_DEFINITIONS[id];
    const fragment = dom.template.content.cloneNode(true);
    const node = fragment.querySelector(".node");
    const position = state.positions[id] || DEFAULT_POSITIONS[id];
    node.dataset.nodeId = id;
    node.dataset.kind = definition.kind;
    node.style.left = `${position.x}px`;
    node.style.top = `${position.y}px`;
    if (definition.wide) node.classList.add("node--wide");
    if (definition.xl) node.classList.add("node--xl");
    if (definition.gallery) node.classList.add("node--gallery");
    if (state.lockedNodes.includes(id)) node.classList.add("is-locked");
    node.querySelector(".node__index").textContent = definition.index;
    node.querySelector(".node__title").textContent = definition.title;
    renderNodeBody(id, node.querySelector(".node__body"));
    bindNodeControls(node, id);
    dom.nodes.append(fragment);
  }

  function renderNodeBody(id, body) {
    if (FIELD_GROUPS[id]) {
      renderFieldGroup(body, FIELD_GROUPS[id]);
      return;
    }
    if (id === "titles") renderTitles(body);
    if (id === "duration") renderStructure(body);
    if (id === "music") renderMusic(body);
    if (id === "image") renderImage(body);
    if (id === "references") renderReferences(body);
  }

  function renderFieldGroup(body, fields) {
    fields.forEach(([name, label, rows, inputType]) => {
      const wrapper = makeElement("div", "field");
      const labelElement = makeElement("label", "", label);
      labelElement.htmlFor = `field-${currentPresetId}-${name}`;
      const control = document.createElement(inputType === "input" ? "input" : "textarea");
      control.id = labelElement.htmlFor;
      control.dataset.field = name;
      control.value = state.fields[name] || "";
      if (control.tagName === "TEXTAREA") control.rows = rows || 3;
      control.addEventListener("input", handleFieldInput);
      wrapper.append(labelElement, control);
      body.append(wrapper);
    });
  }

  function renderTitles(body) {
    const preset = presets[currentPresetId];
    body.append(makeElement("p", "node__lede", "류경호텔을 모르는 사람도 ‘평양·고위층·랭면’만 보고 장면과 궁금증을 바로 이해하도록 잡았습니다."));
    const list = makeElement("ol", "title-list plain-list");
    preset.titles.forEach((title, index) => {
      const item = makeElement("li", index === preset.recommendedTitle ? "is-recommended" : "");
      const titleText = makeElement("span", "", title);
      item.append(titleText);
      if (index === preset.recommendedTitle) item.append(makeElement("b", "recommend-badge", "추천"));
      const copy = makeElement("button", "copy-button", "복사");
      copy.type = "button";
      copy.addEventListener("click", () => copyText(title));
      item.append(copy);
      list.append(item);
    });
    body.append(list);
  }

  function renderStructure(body) {
    const controls = makeElement("div", "field-row");
    [["flagship", "대표편 / 분", 20, 240], ["chapters", "트랙 수", 1, 24]].forEach(([name, label, min, max]) => {
      const wrapper = makeElement("div", "field");
      wrapper.append(makeElement("label", "", label));
      const input = document.createElement("input");
      input.type = "number";
      input.min = String(min);
      input.max = String(max);
      input.value = state.fields[name];
      input.dataset.field = name;
      input.addEventListener("input", handleFieldInput);
      wrapper.append(input);
      controls.append(wrapper);
    });
    body.append(controls);
    const crossfade = makeElement("div", "field");
    crossfade.append(makeElement("label", "", "크로스페이드"));
    const crossfadeInput = document.createElement("input");
    crossfadeInput.value = state.fields.crossfade;
    crossfadeInput.dataset.field = "crossfade";
    crossfadeInput.addEventListener("input", handleFieldInput);
    crossfade.append(crossfadeInput);
    body.append(crossfade);

    Object.values(generated.duration).forEach((value) => body.append(makeElement("p", "sync-bridge", value)));
    body.append(makeElement("span", "count-badge", `구조 ${generated.trackPlan.length}개 = 다음 단계 음악 프롬프트 ${generated.trackPrompts.length}개`));
    body.append(renderTrackTimeline(generated.trackPlan));
  }

  function renderMusic(body) {
    body.append(makeElement("p", "sync-bridge", `일관성 규칙 · 메인 프롬프트 1개를 고정하고 ${generated.trackPlan.length}개 트랙에는 시간·에너지·전경 악기만 덧붙입니다.`));
    body.append(renderResultBlock("추천 · MASTER CONSISTENCY PROMPT", generated.masterPrompt, { recommended: true }));
    body.append(makeElement("span", "count-badge", `트랙 구조 ${generated.trackPlan.length}개 ↔ 트랙 프롬프트 ${generated.trackPrompts.length}개`));
    generated.trackPrompts.forEach((track) => {
      const details = makeElement("details", "track-prompt");
      const summary = document.createElement("summary");
      summary.append(
        makeElement("span", "", String(track.index).padStart(2, "0")),
        makeElement("strong", "", track.title),
        makeElement("small", "", `${track.start}–${track.end}`),
      );
      const content = makeElement("div", "track-prompt__body");
      content.append(makeElement("p", "track-prompt__meta", `${track.phase} · ENERGY ${track.energy}/100`));
      const result = renderResultBlock("MAIN + TRACK STRUCTURE", track.prompt);
      content.append(result);
      details.append(summary, content);
      body.append(details);
    });
  }

  function renderImage(body) {
    body.append(makeElement("p", "sync-bridge", `음악 연결 · ${state.fields.bpm} BPM · ${state.fields.emotion} · 같은 색·공간·감정 절정을 유지`));
    generated.imagePrompts.forEach((item) => {
      body.append(renderResultBlock(item.label, item.prompt, { recommended: item.recommended }));
    });
    body.append(renderResultBlock("NEGATIVE / ORIGINALITY", generated.negativePrompt));
    body.append(renderResultBlock("후편집 썸네일 문구", state.fields.visualOverlay));
  }

  function renderReferences(body) {
    const preset = presets[currentPresetId];
    const intro = makeElement("div", "reference-intro");
    intro.append(makeElement("p", "", "2단계 키워드에서 장소·음식·빛·건축을 나눠 찾은 참고 프레임입니다. 장면을 그대로 복제하지 말고 카드의 렌즈·노출·시간대 변주 메모를 조합하세요."));
    intro.append(makeElement("span", "count-badge", `${preset.visualReferences.length} REFERENCES`));
    body.append(intro);
    const grid = makeElement("div", "reference-grid");
    preset.visualReferences.forEach((reference, index) => {
      const card = makeElement("article", "reference-card");
      const imageWrap = makeElement("div", "reference-card__image");
      const image = document.createElement("img");
      image.src = reference.src;
      image.alt = reference.title;
      image.loading = index < 5 ? "eager" : "lazy";
      image.referrerPolicy = "no-referrer";
      imageWrap.append(image);
      const cardBody = makeElement("div", "reference-card__body");
      cardBody.append(
        makeElement("h3", "", `${String(index + 1).padStart(2, "0")} · ${reference.title}`),
        makeElement("p", "reference-card__keyword", reference.keyword),
        makeElement("p", "reference-card__angle", reference.angle),
      );
      const link = makeElement("a", "", "원본·라이선스 보기 ↗");
      link.href = reference.source;
      link.target = "_blank";
      link.rel = "noreferrer";
      cardBody.append(link, makeElement("small", "reference-card__credit", reference.credit));
      card.append(imageWrap, cardBody);
      grid.append(card);
    });
    body.append(grid);
    body.append(makeElement("p", "callout", "참고 이미지를 AI로 변형해도 원본과 실질적으로 유사하면 권리 문제가 자동으로 사라지지 않습니다. 공개본은 구도·시점·인물·배경·광원·색을 충분히 새로 설계하세요."));
  }

  function renderTrackTimeline(tracks) {
    const timeline = makeElement("div", "timeline");
    tracks.forEach((track) => {
      const item = makeElement("div", "timeline-item");
      item.style.setProperty("--energy", String(track.energy));
      const top = makeElement("div", "timeline-item__top");
      top.append(makeElement("strong", "", `${String(track.index).padStart(2, "0")} · ${track.title}`), makeElement("span", "", `${track.start}–${track.end} · ${track.energy}`));
      item.append(top, makeElement("p", "", `${track.phase} · ${track.focus}`));
      timeline.append(item);
    });
    return timeline;
  }

  function renderResultBlock(label, text, options = {}) {
    const block = makeElement("section", `result-block${options.recommended ? " is-recommended" : ""}`);
    const head = makeElement("div", "result-block__head");
    const title = makeElement("strong", "", label);
    if (options.recommended) title.append(makeElement("b", "recommend-badge", "추천"));
    const button = makeElement("button", "copy-button", "복사");
    button.type = "button";
    button.addEventListener("click", () => copyText(text));
    head.append(title, button);
    block.append(head, makeElement("p", "result-text", text));
    return block;
  }

  function handleFieldInput(event) {
    state.fields[event.currentTarget.dataset.field] = event.currentTarget.value;
    saveState();
  }

  function bindNodeControls(node, id) {
    const lockButton = node.querySelector(".lock-button");
    const updateLock = () => {
      const locked = state.lockedNodes.includes(id);
      lockButton.textContent = locked ? "◆" : "◇";
      lockButton.title = locked ? "노드 잠금 해제" : "노드 잠금";
      lockButton.setAttribute("aria-label", lockButton.title);
    };
    updateLock();
    lockButton.addEventListener("pointerdown", (event) => event.stopPropagation());
    lockButton.addEventListener("click", () => {
      state.lockedNodes = state.lockedNodes.includes(id)
        ? state.lockedNodes.filter((item) => item !== id)
        : [...state.lockedNodes, id];
      node.classList.toggle("is-locked", state.lockedNodes.includes(id));
      updateLock();
      saveState();
    });
    node.querySelector(".node__header").addEventListener("pointerdown", (event) => startDrag(event, node, id));
  }

  function startDrag(event, node, id) {
    if (event.button !== 0 || state.lockedNodes.includes(id) || event.target.closest("button")) return;
    event.preventDefault();
    const stage = STAGES[currentStageId];
    const header = event.currentTarget;
    const start = { pointerX: event.clientX, pointerY: event.clientY, x: node.offsetLeft, y: node.offsetTop };
    header.setPointerCapture(event.pointerId);
    node.classList.add("is-dragging");
    const move = (moveEvent) => {
      const x = Math.max(0, Math.min(stage.board.width - node.offsetWidth, start.x + moveEvent.clientX - start.pointerX));
      const y = Math.max(0, Math.min(stage.board.height - node.offsetHeight, start.y + moveEvent.clientY - start.pointerY));
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      state.positions[id] = { x: Math.round(x), y: Math.round(y) };
      requestAnimationFrame(drawWires);
    };
    const finish = () => {
      node.classList.remove("is-dragging");
      header.removeEventListener("pointermove", move);
      header.removeEventListener("pointerup", finish);
      header.removeEventListener("pointercancel", finish);
      saveState();
    };
    header.addEventListener("pointermove", move);
    header.addEventListener("pointerup", finish);
    header.addEventListener("pointercancel", finish);
  }

  function drawWires() {
    dom.wires.replaceChildren();
    STAGES[currentStageId].connections.forEach(([sourceId, targetId]) => {
      const source = dom.nodes.querySelector(`[data-node-id="${sourceId}"]`);
      const target = dom.nodes.querySelector(`[data-node-id="${targetId}"]`);
      if (!source || !target) return;
      const x1 = source.offsetLeft + source.offsetWidth;
      const y1 = source.offsetTop + Math.min(source.offsetHeight * 0.3, 150);
      const x2 = target.offsetLeft;
      const y2 = target.offsetTop + Math.min(target.offsetHeight * 0.3, 150);
      const distance = Math.max(70, Math.abs(x2 - x1) * 0.45);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "wire");
      path.setAttribute("d", `M ${x1} ${y1} C ${x1 + distance} ${y1}, ${x2 - distance} ${y2}, ${x2} ${y2}`);
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("class", "wire-dot");
      dot.setAttribute("cx", String(x2));
      dot.setAttribute("cy", String(y2));
      dot.setAttribute("r", "2.5");
      dom.wires.append(path, dot);
    });
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("클립보드에 복사했습니다");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      showToast(copied ? "클립보드에 복사했습니다" : "복사할 수 없습니다");
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    dom.toast.textContent = message;
    dom.toast.classList.add("is-visible");
    toastTimer = setTimeout(() => dom.toast.classList.remove("is-visible"), 1800);
  }

  function switchPreset(presetId) {
    if (!presets[presetId] || presetId === currentPresetId) return;
    saveState();
    currentPresetId = presetId;
    state = loadState(currentPresetId);
    saveState();
    renderAll({ preserveScroll: false });
    dom.viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }

  function switchStage(stageId) {
    if (!STAGES[stageId] || stageId === currentStageId) return;
    currentStageId = stageId;
    saveState();
    renderAll({ preserveScroll: false });
    dom.viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }

  function resetCurrentLayout() {
    STAGES[currentStageId].nodes.forEach((id) => {
      state.positions[id] = structuredClone(DEFAULT_POSITIONS[id]);
      state.lockedNodes = state.lockedNodes.filter((item) => item !== id);
    });
    saveState();
    renderAll({ preserveScroll: false });
    dom.viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
    showToast(`${STAGES[currentStageId].title} 배치를 초기화했습니다`);
  }

  function downloadFile(filename, contents, type) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportJson() {
    const payload = {
      app: "Zerune Studio",
      schemaVersion: 2,
      presetId: currentPresetId,
      exportedAt: new Date().toISOString(),
      state,
      generated,
    };
    downloadFile(`${currentPresetId}-project.json`, JSON.stringify(payload, null, 2), "application/json");
    showToast("JSON 프로젝트를 내보냈습니다");
  }

  function exportMarkdown() {
    downloadFile(`${currentPresetId}-production-plan.md`, generated.markdown, "text/markdown;charset=utf-8");
    showToast("Markdown 제작안을 내보냈습니다");
  }

  function sanitizeImportedState(candidate, presetId) {
    const defaults = defaultState(presetId);
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const fields = { ...defaults.fields };
    Object.keys(fields).forEach((key) => {
      if (typeof source.fields?.[key] === "string") fields[key] = source.fields[key].slice(0, 12000);
    });
    const positions = { ...defaults.positions };
    Object.entries(source.positions || {}).forEach(([id, position]) => {
      if (!DEFAULT_POSITIONS[id] || !position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return;
      positions[id] = { x: Math.max(0, Math.round(position.x)), y: Math.max(0, Math.round(position.y)) };
    });
    const validIds = new Set(Object.keys(NODE_DEFINITIONS));
    const lockedNodes = Array.isArray(source.lockedNodes) ? source.lockedNodes.filter((id) => validIds.has(id)) : [];
    return { ...defaults, fields, positions, lockedNodes };
  }

  async function importProject(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      const presetId = presets[payload.presetId] ? payload.presetId : currentPresetId;
      currentPresetId = presetId;
      state = sanitizeImportedState(payload.state || payload, presetId);
      saveState();
      renderAll({ preserveScroll: false });
      showToast("프로젝트를 안전하게 불러왔습니다");
    } catch {
      showToast("올바른 프로젝트 JSON이 아닙니다");
    } finally {
      dom.importFile.value = "";
    }
  }

  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => switchPreset(button.dataset.preset)));
  document.querySelectorAll("[data-stage]").forEach((button) => button.addEventListener("click", () => switchStage(button.dataset.stage)));
  dom.nextStageButton.addEventListener("click", () => {
    const nextIndex = (STAGE_IDS.indexOf(currentStageId) + 1) % STAGE_IDS.length;
    switchStage(STAGE_IDS[nextIndex]);
  });
  document.querySelector("#generateButton").addEventListener("click", () => {
    generated = engine.generate(presets[currentPresetId], state.fields);
    saveState();
    renderAll();
    showToast("현재 구조에 맞춰 결과를 갱신했습니다");
  });
  document.querySelector("#resetLayoutButton").addEventListener("click", resetCurrentLayout);
  document.querySelector("#exportJsonButton").addEventListener("click", exportJson);
  document.querySelector("#exportMarkdownButton").addEventListener("click", exportMarkdown);
  document.querySelector("#importButton").addEventListener("click", () => dom.importFile.click());
  dom.importFile.addEventListener("change", () => importProject(dom.importFile.files[0]));
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      document.querySelector("#generateButton").click();
    }
  });
  window.addEventListener("resize", drawWires);
  renderAll({ preserveScroll: false });
})();
