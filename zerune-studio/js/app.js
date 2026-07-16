(function startStudio() {
  "use strict";

  const presets = globalThis.IMPOSSIBLE_SPACES_PRESETS;
  const engine = globalThis.ImpossibleSpacesEngine;
  if (!presets || !engine) {
    document.body.textContent = "필수 데이터 파일을 불러오지 못했습니다.";
    return;
  }

  const STORAGE_PREFIX = "zerune-studio/v6/";
  const LEGACY_STORAGE_PREFIX = "zerune-studio/v5/";
  const OLDER_STORAGE_PREFIX = "zerune-studio/v4/";
  const OLDEST_STORAGE_PREFIX = "zerune-studio/v3/";
  const CURRENT_PRESET_KEY = `${STORAGE_PREFIX}current-preset`;
  const CURRENT_STAGE_KEY = `${STORAGE_PREFIX}current-stage`;
  const LEGACY_CURRENT_PRESET_KEY = `${LEGACY_STORAGE_PREFIX}current-preset`;
  const LEGACY_CURRENT_STAGE_KEY = `${LEGACY_STORAGE_PREFIX}current-stage`;
  const OLDER_CURRENT_PRESET_KEY = `${OLDER_STORAGE_PREFIX}current-preset`;
  const OLDER_CURRENT_STAGE_KEY = `${OLDER_STORAGE_PREFIX}current-stage`;
  const OLDEST_CURRENT_PRESET_KEY = `${OLDEST_STORAGE_PREFIX}current-preset`;
  const OLDEST_CURRENT_STAGE_KEY = `${OLDEST_STORAGE_PREFIX}current-stage`;

  const STAGES = {
    overview: {
      number: "ALL",
      title: "전체보기",
      description: "01–05의 핵심 결과와 복사 패키지를 한 화면에서 최종 확인합니다.",
      nodes: ["overview"],
      connections: [],
      board: { width: 1550, height: 5200 },
    },
    concept: {
      number: "01",
      title: "콘셉트",
      description: "작품 제목과 한 문장 정의, 관계의 여백과 반드시 지킬 원칙을 고정합니다.",
      nodes: ["titles", "brief", "relationship"],
      connections: [["titles", "brief"], ["brief", "relationship"]],
      board: { width: 1500, height: 1180 },
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
      description: "사운드 팔레트에서 30초 자체 모티프 소스와 목표 길이의 트랙 구조를 연결합니다.",
      nodes: ["sound", "source", "duration"],
      connections: [["sound", "source"], ["source", "duration"]],
      board: { width: 1500, height: 1550 },
    },
    prompts: {
      number: "04",
      title: "프롬프트",
      description: "추천 메인 음악 프롬프트에 각 트랙 구조를 붙이고, 같은 정서를 이미지 프롬프트와 참고 프레임으로 연결합니다.",
      nodes: ["music", "image", "references"],
      connections: [["music", "image"], ["image", "references"]],
      board: { width: 1550, height: 3400 },
    },
    youtube: {
      number: "05",
      title: "입력",
      description: "YouTube Studio와 플레이리스트에 붙여 넣을 제목·설명·챕터·검색 정보·설정값을 정리합니다.",
      nodes: ["youtubeMeta", "youtubePlaylist", "youtubeSettings"],
      connections: [["youtubeMeta", "youtubePlaylist"], ["youtubePlaylist", "youtubeSettings"]],
      board: { width: 1550, height: 3600 },
    },
  };
  const FLOW_STAGE_IDS = ["concept", "keywords", "sound", "prompts", "youtube"];
  const STAGE_IDS = ["overview", ...FLOW_STAGE_IDS];

  const DEFAULT_POSITIONS = {
    titles: { x: 60, y: 60 },
    brief: { x: 480, y: 60 },
    relationship: { x: 960, y: 60 },
    keywords: { x: 60, y: 60 },
    visual: { x: 480, y: 60 },
    sound: { x: 60, y: 60 },
    source: { x: 460, y: 60 },
    duration: { x: 940, y: 60 },
    music: { x: 60, y: 60 },
    image: { x: 750, y: 60 },
    references: { x: 60, y: 2280 },
    youtubeMeta: { x: 60, y: 60 },
    youtubePlaylist: { x: 750, y: 60 },
    youtubeSettings: { x: 60, y: 1320 },
    overview: { x: 60, y: 60 },
  };

  const NODE_DEFINITIONS = {
    titles: { index: "01 · TITLE", title: "작품 제목", kind: "output" },
    brief: { index: "01 · WORLD", title: "장면과 핵심 정서", kind: "input", wide: true },
    relationship: { index: "01 · SUBTEXT", title: "화자 · 관계 · 미해결", kind: "guard", wide: true },
    keywords: { index: "02 · INPUT", title: "음악 키워드 라이브러리", kind: "input" },
    visual: { index: "02 · INPUT", title: "이미지 키워드 라이브러리", kind: "input", wide: true },
    sound: { index: "03 · INPUT", title: "사운드 설계", kind: "input" },
    source: { index: "03 · SOURCE", title: "Mureka 30초 자체 소스", kind: "guard", wide: true },
    duration: { index: "03 · STRUCTURE", title: "플레이리스트 트랙 구조", kind: "output", wide: true },
    music: { index: "04 · MUSIC", title: "메인 + 트랙별 Mureka 프롬프트", kind: "output", xl: true },
    image: { index: "04 · IMAGE", title: "음악과 연결된 이미지 프롬프트", kind: "output", xl: true },
    references: { index: "04 · REFERENCES", title: "키워드로 찾은 참고 프레임 10개", kind: "guard", gallery: true },
    youtubeMeta: { index: "05 · VIDEO", title: "영상 제목 · 설명 · 챕터", kind: "output", xl: true },
    youtubePlaylist: { index: "05 · PLAYLIST", title: "재생목록 · 검색 · 댓글", kind: "input", xl: true },
    youtubeSettings: { index: "05 · STUDIO", title: "YouTube Studio 설정 · 입력 순서", kind: "guard", gallery: true },
    overview: { index: "ALL · 01–05", title: "전체 프로젝트 한눈에", kind: "output", gallery: true },
  };

  const FIELD_GROUPS = {
    brief: [
      ["concept", "한 문장 정의", 4],
      ["synopsis", "작품 소개문 · 고정 카피", 8],
      ["location", "배경", 6],
      ["ritual", "화면에 남은 상황", 5],
      ["emotion", "핵심 정서", 5],
      ["promise", "관객에게 건넬 약속", 4],
    ],
    relationship: [
      ["narrator", "화자", 4],
      ["ambiguity", "존재 · 가능한 해석", 7],
      ["unresolved", "설명하지 않을 것", 4],
      ["corePrinciple", "작품의 핵심 원칙", 5],
    ],
    keywords: [
      ["keywordLocation", "공간", 5],
      ["keywordRitual", "사물 / 의식", 5],
      ["keywordSensory", "감각", 5],
      ["keywordEmotion", "정서", 4],
      ["keywordMusic", "음악", 4],
      ["keywordDiscovery", "참고 이미지 검색어", 4],
    ],
    visual: [
      ["visualSubject", "주 피사체", 4],
      ["visualSetting", "공간 / 시간", 4],
      ["visualCamera", "카메라 / 구도", 3],
      ["visualPalette", "색", 2],
      ["visualTexture", "재질 / 후처리", 3],
      ["visualNarrative", "서사 / 인물 경계", 4],
      ["visualExclusions", "제외할 이미지 요소", 4],
      ["visualOverlay", "썸네일 문구 · 비워두기", 2],
    ],
    sound: [
      ["bpm", "BPM", 1, "input"],
      ["key", "조성 / 모드", 2],
      ["meter", "박자 / 리듬", 2],
      ["genres", "장르 결합", 4],
      ["soundBalance", "음향 비율", 2],
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

  let currentPresetId = loadKey(
    CURRENT_PRESET_KEY,
    (value) => Boolean(presets[value]),
    loadKey(LEGACY_CURRENT_PRESET_KEY, (value) => Boolean(presets[value]),
      loadKey(OLDER_CURRENT_PRESET_KEY, (value) => Boolean(presets[value]),
        loadKey(OLDEST_CURRENT_PRESET_KEY, (value) => Boolean(presets[value]), Object.keys(presets)[0]))),
  );
  let currentStageId = loadKey(
    CURRENT_STAGE_KEY,
    (value) => Boolean(STAGES[value]),
    loadKey(LEGACY_CURRENT_STAGE_KEY, (value) => Boolean(STAGES[value]),
      loadKey(OLDER_CURRENT_STAGE_KEY, (value) => Boolean(STAGES[value]),
        loadKey(OLDEST_CURRENT_STAGE_KEY, (value) => Boolean(STAGES[value]), FLOW_STAGE_IDS[0]))),
  );
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
      synopsis: preset.theme.synopsis || "",
      location: preset.theme.location,
      ritual: preset.theme.ritual,
      emotion: preset.theme.emotion,
      promise: preset.theme.promise,
      narrator: preset.theme.narrator || "",
      ambiguity: preset.theme.ambiguity || "",
      unresolved: preset.theme.unresolved || "",
      corePrinciple: preset.theme.corePrinciple || "",
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
      soundBalance: preset.music.balance || "",
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
      visualNarrative: preset.visual.narrative || "",
      visualExclusions: preset.visual.exclusions,
      visualOverlay: preset.visual.overlay,
    };
  }

  function defaultState(presetId) {
    return {
      version: 6,
      updatedAt: new Date().toISOString(),
      fields: defaultFields(presets[presetId]),
      positions: structuredClone(DEFAULT_POSITIONS),
      lockedNodes: [],
    };
  }

  function loadState(presetId) {
    const defaults = defaultState(presetId);
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${presetId}`)
        || localStorage.getItem(`${LEGACY_STORAGE_PREFIX}${presetId}`)
        || localStorage.getItem(`${OLDER_STORAGE_PREFIX}${presetId}`)
        || localStorage.getItem(`${OLDEST_STORAGE_PREFIX}${presetId}`);
      if (!raw) return defaults;
      const saved = JSON.parse(raw);
      let savedFields = { ...(saved.fields || {}) };
      if (Number(saved.version || 0) < 4 && savedFields.flagship === "64") {
        savedFields.flagship = defaults.fields.flagship;
      }
      if (Number(saved.version || 0) < 5 && presetId === "neon_edge_before_fall") {
        savedFields = { ...defaults.fields };
      }
      return {
        ...defaults,
        fields: { ...defaults.fields, ...savedFields },
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
    const currentFlowIndex = FLOW_STAGE_IDS.indexOf(currentStageId);
    dom.nextStageButton.textContent = currentStageId === "overview"
      ? "1단계로 →"
      : currentFlowIndex === FLOW_STAGE_IDS.length - 1
        ? "첫 단계로 ↺"
        : "다음 단계 →";

    document.querySelectorAll("[data-preset]").forEach((button) => {
      const active = button.dataset.preset === currentPresetId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-stage]").forEach((button) => {
      const index = FLOW_STAGE_IDS.indexOf(button.dataset.stage);
      const active = button.dataset.stage === currentStageId;
      button.classList.toggle("is-active", active);
      button.classList.toggle("is-complete", currentFlowIndex >= 0 && index >= 0 && index < currentFlowIndex);
      button.setAttribute("aria-current", active ? "step" : "false");
    });
    const activeStageButton = document.querySelector(`[data-stage="${currentStageId}"]`);
    const stageNavigation = activeStageButton?.closest(".flow-tabs");
    if (stageNavigation && stageNavigation.scrollWidth > stageNavigation.clientWidth) {
      requestAnimationFrame(() => {
        stageNavigation.scrollLeft = Math.max(0, activeStageButton.offsetLeft - ((stageNavigation.clientWidth - activeStageButton.offsetWidth) / 2));
      });
    }

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
    if (id === "source") renderReferenceAudio(body);
    if (id === "duration") renderStructure(body);
    if (id === "music") renderMusic(body);
    if (id === "image") renderImage(body);
    if (id === "references") renderReferences(body);
    if (id === "youtubeMeta") renderYouTubeMeta(body);
    if (id === "youtubePlaylist") renderYouTubePlaylist(body);
    if (id === "youtubeSettings") renderYouTubeSettings(body);
    if (id === "overview") renderOverview(body);
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
    body.append(makeElement("p", "node__lede", preset.titleStrategy?.nodeLede || "한 편의 작품 제목으로 사용할 문장을 고정합니다."));
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
    if (preset.titleStrategy?.meanings?.length) {
      const meanings = makeElement("div", "strategy-grid");
      preset.titleStrategy.meanings.forEach((meaning, index) => {
        const item = makeElement("div", "strategy-item");
        item.append(makeElement("strong", "", `FALL 0${index + 1}`), makeElement("span", "", meaning));
        meanings.append(item);
      });
      body.append(meanings);
    }
    if (preset.titleStrategy?.rationale) body.append(makeElement("p", "sync-bridge", preset.titleStrategy.rationale));
    if (preset.titleStrategy?.formatRule) body.append(makeElement("p", "callout", preset.titleStrategy.formatRule));
    if (preset.titleStrategy?.guardrail) body.append(makeElement("p", "callout", preset.titleStrategy.guardrail));
  }

  function renderReferenceAudio(body) {
    const preset = presets[currentPresetId];
    const plan = generated.referenceAudio;
    body.append(makeElement("p", "node__lede", "외부 상업곡을 흉내 내는 소스가 아니라, 트랙 전체의 기억 모티프를 고정하는 자체 제작 입력입니다."));

    const strategy = makeElement("div", "strategy-grid");
    [
      ["추천 입력", plan.preferredMode],
      ["길이 / 모티프", `${plan.duration} · ${plan.motif}`],
      ["적용 순서", plan.guidance],
      ["30초 구성", plan.recipe],
      ["Reference 대안", plan.fallback],
    ].forEach(([label, value]) => {
      const item = makeElement("div", "strategy-item");
      item.append(makeElement("strong", "", label), makeElement("span", "", value));
      strategy.append(item);
    });
    body.append(strategy);

    const download = makeElement("button", "source-download", "30초 자체 모티프 MIDI 내려받기");
    download.type = "button";
    download.addEventListener("click", () => {
      downloadFile(plan.fileName, engine.buildReferenceMidi(preset), "audio/midi");
      showToast("Mureka Melody ideas용 MIDI를 내보냈습니다");
    });
    body.append(download);
    body.append(makeElement("p", "callout", plan.rights));

    const official = makeElement("a", "official-link", "Mureka 공식 업로드 형식 확인 ↗");
    official.href = "https://platform.mureka.ai/docs/api/operations/post-v1-files-upload.html";
    official.target = "_blank";
    official.rel = "noreferrer";
    body.append(official);
  }

  function renderStructure(body) {
    const controls = makeElement("div", "field-row");
    [["flagship", "전체 길이 / 분", 20, 240], ["chapters", "트랙 수", 1, 24]].forEach(([name, label, min, max]) => {
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
    body.append(makeElement("p", "callout", "ZERUNE 고정 무가사 잠금 · Mureka Instrumental 모드 전용. 가사·노래·대사·허밍·코러스·랩·보컬 찹·의미 없는 음절까지 모든 메인 및 트랙 프롬프트에서 금지합니다."));
    body.append(makeElement("p", "sync-bridge", `Mureka Style 제한 · 마스터 + 현재 트랙 구조를 합친 복사본은 항상 ${generated.murekaStyleLimit.toLocaleString("ko-KR")}자 이내입니다. 한 번에 전체 ${state.fields.flagship}분을 요청하지 않고 ${generated.trackPlan.length}번 나눠 생성합니다.`));
    body.append(renderResultBlock("추천 · MASTER CONSISTENCY PROMPT", generated.masterPrompt, { recommended: true, characterLimit: generated.murekaStyleLimit }));
    body.append(makeElement("span", "count-badge", `트랙 구조 ${generated.trackPlan.length}개 ↔ 트랙 프롬프트 ${generated.trackPrompts.length}개`));
    generated.trackPrompts.forEach((track) => {
      const details = makeElement("details", "track-prompt");
      const summary = document.createElement("summary");
      summary.append(
        makeElement("span", "", String(track.index).padStart(2, "0")),
        makeElement("strong", "", `${track.title}${track.subtitle ? ` / ${track.subtitle}` : ""}`),
        makeElement("small", "", `${track.start}–${track.end}`),
      );
      const content = makeElement("div", "track-prompt__body");
      content.append(makeElement("p", "track-prompt__meta", `${track.phase} · ENERGY ${track.energy}/100`));
      const result = renderResultBlock("MAIN + TRACK STRUCTURE", track.prompt, { characterLimit: generated.murekaStyleLimit });
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
    if (state.fields.visualOverlay.trim()) {
      body.append(renderResultBlock("후편집 썸네일 문구", state.fields.visualOverlay));
    } else {
      body.append(makeElement("p", "callout", "썸네일에는 문구를 넣지 않습니다. 두 그릇과 비어 있는 두 자리, 재킷과 호텔 열쇠만으로 제목의 의미를 전달합니다."));
    }
    if (generated.videoPlan) {
      body.append(renderResultBlock("오프닝 · 비인가 방송", generated.videoPlan.intro, { recommended: true }));
      body.append(renderResultBlock("중간 신호 문구", generated.videoPlan.interludes));
      body.append(renderResultBlock("마지막 화면", `${generated.videoPlan.ending}\n\n${generated.videoPlan.loop}`));
      body.append(renderResultBlock("팬 작품 고지", generated.videoPlan.disclaimer));
    }
  }

  function renderReferences(body) {
    const preset = presets[currentPresetId];
    const intro = makeElement("div", "reference-intro");
    intro.append(makeElement("p", "", "2단계 키워드에서 장소·사물·빛·건축을 나눠 찾은 참고 프레임입니다. 장면을 그대로 복제하지 말고 카드의 렌즈·노출·시간대 변주 메모를 조합하세요."));
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

  function appendOfficialLinks(body, links) {
    const wrapper = makeElement("div", "official-links");
    links.forEach(([label, href]) => {
      const link = makeElement("a", "official-link", `${label} ↗`);
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      wrapper.append(link);
    });
    body.append(wrapper);
  }

  function renderYouTubeMeta(body) {
    const youtube = generated.youtube;
    body.append(makeElement("p", "node__lede", "YouTube Studio의 세부정보 화면에 위에서부터 붙여 넣습니다. 설명 안의 타임스탬프는 수동 챕터 형식으로 이미 정렬되어 있습니다."));

    const status = makeElement("div", "strategy-grid youtube-status");
    [
      ["TITLE", youtube.titleStatus],
      ["DESCRIPTION", youtube.descriptionStatus],
      ["CHAPTERS", youtube.chapterStatus],
    ].forEach(([label, value]) => {
      const item = makeElement("div", "strategy-item");
      item.append(makeElement("strong", "", label), makeElement("span", "", value));
      status.append(item);
    });
    body.append(status);
    body.append(
      renderResultBlock("영상 제목", youtube.title, { recommended: true }),
      renderResultBlock("통합 설명 · 작품 소개 + 챕터 + 고지 + 해시태그", youtube.description, { recommended: true }),
      renderResultBlock("수동 챕터만 복사", youtube.chapters),
    );
    appendOfficialLinks(body, [
      ["YouTube 영상 세부정보 기준", "https://support.google.com/youtube/answer/57404?hl=ko"],
      ["YouTube 챕터 기준", "https://support.google.com/youtube/answer/9884579?hl=ko"],
    ]);
  }

  function renderYouTubePlaylist(body) {
    const youtube = generated.youtube;
    body.append(makeElement("p", "node__lede", "영상 업로드 정보와 재생목록 자체의 정보를 분리했습니다. 각 블록은 입력칸 하나에 맞춰 그대로 복사할 수 있습니다."));
    body.append(
      renderResultBlock("재생목록 제목", youtube.playlistTitle, { recommended: true }),
      renderResultBlock("재생목록 설명", youtube.playlistDescription),
      renderResultBlock("해시태그 · 설명 하단 포함됨", youtube.hashtags),
      renderResultBlock("태그 · 맞춤법·표기 변형 중심", youtube.tags),
      renderResultBlock("공개 후 고정 댓글", youtube.pinnedComment),
      renderResultBlock("썸네일 제작·업로드 사양", youtube.thumbnail),
    );
    body.append(makeElement("p", "callout", "태그는 발견의 핵심 수단이 아닙니다. 제목·썸네일·설명의 약속을 먼저 맞추고, 태그는 ‘랭면/냉면’처럼 검색 표기가 달라질 수 있는 말과 팬 작품 검색어만 보조로 사용합니다."));
    appendOfficialLinks(body, [
      ["YouTube 재생목록 만들기", "https://support.google.com/youtube/answer/57792?hl=ko"],
      ["YouTube 태그 안내", "https://support.google.com/youtube/answer/146402?hl=ko"],
      ["YouTube 썸네일 기준", "https://support.google.com/youtube/answer/72431?hl=ko"],
    ]);
  }

  function renderYouTubeSettings(body) {
    const youtube = generated.youtube;
    body.append(makeElement("p", "node__lede", "업로드는 먼저 비공개로 저장한 뒤 처리·저작권·모바일 표시를 확인하고 공개하는 순서로 정리했습니다."));

    const settings = makeElement("div", "settings-grid");
    youtube.settings.forEach(([label, value]) => {
      const item = makeElement("div", "strategy-item");
      item.append(makeElement("strong", "", label), makeElement("span", "", value));
      settings.append(item);
    });
    body.append(settings);
    body.append(
      renderResultBlock("Studio 설정값만 복사", youtube.settingsText),
      renderResultBlock("업로드 순서 · 체크리스트", youtube.uploadOrder),
      renderResultBlock("추천 · 05 입력 전체 패키지 복사", youtube.allCopy, { recommended: true }),
    );
    body.append(makeElement("p", "callout", "Mureka 생성 음악이나 생성형 이미지를 사용했다면 YouTube의 ‘변경되거나 합성된 콘텐츠’ 질문에 ‘예’를 선택합니다. 이 표시는 수익 창출 자격 자체를 제한하지 않는다는 것이 YouTube의 공식 안내입니다."));
    appendOfficialLinks(body, [
      ["변경·합성 콘텐츠 공개 기준", "https://support.google.com/youtube/answer/14328491?hl=ko"],
      ["설명 작성 도움말", "https://support.google.com/youtube/answer/12948449?hl=ko"],
    ]);
  }

  function makeOverviewSection(number, title) {
    const section = makeElement("section", "overview-section");
    const head = makeElement("header", "overview-section__head");
    head.append(makeElement("span", "", number), makeElement("h3", "", title));
    section.append(head);
    return section;
  }

  function renderOverview(body) {
    const preset = presets[currentPresetId];
    const youtube = generated.youtube;
    const recommendedImage = generated.imagePrompts.find((item) => item.recommended) || generated.imagePrompts[0];
    const actions = makeElement("div", "overview-actions");
    actions.append(
      makeElement("p", "", "01 콘셉트부터 05 YouTube 입력까지, 현재 저장값으로 다시 계산된 프로젝트 전체입니다."),
    );
    const copyAll = makeElement("button", "overview-copy-button", "전체 프로젝트 텍스트 복사");
    copyAll.type = "button";
    copyAll.addEventListener("click", () => copyText(generated.overviewText));
    actions.append(copyAll);
    body.append(actions);

    const concept = makeOverviewSection("01", "콘셉트");
    const conceptGrid = makeElement("div", "overview-grid");
    conceptGrid.append(
      renderResultBlock("추천 제목", youtube.title, { recommended: true }),
      renderResultBlock("한 문장 정의", state.fields.concept),
      renderResultBlock("작품 소개", state.fields.synopsis),
      renderResultBlock("핵심 원칙", state.fields.corePrinciple),
    );
    concept.append(conceptGrid);
    body.append(concept);

    const keywords = makeOverviewSection("02", "키워드");
    const keywordGrid = makeElement("div", "overview-grid");
    keywordGrid.append(
      renderResultBlock("음악 키워드", state.fields.keywordMusic),
      renderResultBlock("참고 이미지 검색어", state.fields.keywordDiscovery),
      renderResultBlock("정서 키워드", state.fields.keywordEmotion),
      renderResultBlock("비주얼 주 피사체", state.fields.visualSubject),
    );
    keywords.append(keywordGrid);
    body.append(keywords);

    const sound = makeOverviewSection("03", "사운드 + 구조");
    const summary = makeElement("div", "strategy-grid overview-metrics");
    [
      ["DURATION", `${state.fields.flagship}분 · ${generated.trackPlan.length}곡 · ${state.fields.crossfade} 크로스페이드`],
      ["TEMPO", `${state.fields.bpm} BPM · ${state.fields.meter}`],
      ["GENRE", state.fields.genres],
      ["SOURCE", `${generated.referenceAudio.duration}초 자체 모티프 · ${generated.referenceAudio.preferredMode}`],
    ].forEach(([label, value]) => {
      const item = makeElement("div", "strategy-item");
      item.append(makeElement("strong", "", label), makeElement("span", "", value));
      summary.append(item);
    });
    sound.append(summary, renderTrackTimeline(generated.trackPlan));
    body.append(sound);

    const prompts = makeOverviewSection("04", "프롬프트");
    const promptGrid = makeElement("div", "overview-grid");
    promptGrid.append(
      renderResultBlock("추천 · MASTER MUSIC", generated.masterPrompt, { recommended: true, characterLimit: generated.murekaStyleLimit }),
      renderResultBlock(`추천 · ${recommendedImage.label}`, recommendedImage.prompt, { recommended: true }),
    );
    prompts.append(promptGrid, makeElement("span", "count-badge", `구조 ${generated.trackPlan.length}개 ↔ 음악 프롬프트 ${generated.trackPrompts.length}개`));
    const promptList = makeElement("div", "overview-prompt-list");
    generated.trackPrompts.forEach((track) => {
      const details = makeElement("details", "track-prompt");
      const summaryElement = document.createElement("summary");
      summaryElement.append(
        makeElement("span", "", String(track.index).padStart(2, "0")),
        makeElement("strong", "", track.title),
        makeElement("small", "", `${track.start}–${track.end}`),
      );
      const content = makeElement("div", "track-prompt__body");
      content.append(renderResultBlock("MAIN + TRACK STRUCTURE", track.prompt, { characterLimit: generated.murekaStyleLimit }));
      details.append(summaryElement, content);
      promptList.append(details);
    });
    prompts.append(promptList);
    body.append(prompts);

    const input = makeOverviewSection("05", "YouTube 입력");
    const inputStatus = makeElement("div", "strategy-grid youtube-status");
    [["TITLE", youtube.titleStatus], ["DESCRIPTION", youtube.descriptionStatus], ["CHAPTERS", youtube.chapterStatus]].forEach(([label, value]) => {
      const item = makeElement("div", "strategy-item");
      item.append(makeElement("strong", "", label), makeElement("span", "", value));
      inputStatus.append(item);
    });
    const inputGrid = makeElement("div", "overview-grid");
    inputGrid.append(
      renderResultBlock("영상 제목", youtube.title, { recommended: true }),
      renderResultBlock("재생목록", `${youtube.playlistTitle}\n\n${youtube.playlistDescription}`),
      renderResultBlock("통합 설명", youtube.description),
      renderResultBlock("Studio 설정", youtube.settingsText),
    );
    input.append(inputStatus, inputGrid, renderResultBlock("추천 · 05 입력 전체 패키지", youtube.allCopy, { recommended: true }));
    body.append(input);

    body.append(makeElement("p", "overview-footnote", `${preset.meta.eyebrow} · 마지막 저장 ${new Date(state.updatedAt).toLocaleString("ko-KR")}`));
  }

  function renderTrackTimeline(tracks) {
    const timeline = makeElement("div", "timeline");
    tracks.forEach((track) => {
      const item = makeElement("div", "timeline-item");
      item.style.setProperty("--energy", String(track.energy));
      const top = makeElement("div", "timeline-item__top");
      top.append(makeElement("strong", "", `${String(track.index).padStart(2, "0")} · ${track.title}${track.subtitle ? ` / ${track.subtitle}` : ""}`), makeElement("span", "", `${track.start}–${track.end} · ${track.energy}`));
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
    head.append(title);
    if (options.characterLimit) {
      const count = makeElement("span", "character-count", `${text.length.toLocaleString("ko-KR")} / ${options.characterLimit.toLocaleString("ko-KR")}자`);
      count.classList.toggle("is-over", text.length > options.characterLimit);
      head.append(count);
    }
    head.append(button);
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
      schemaVersion: 6,
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
    if (currentStageId === "overview") {
      switchStage(FLOW_STAGE_IDS[0]);
      return;
    }
    const nextIndex = (FLOW_STAGE_IDS.indexOf(currentStageId) + 1) % FLOW_STAGE_IDS.length;
    switchStage(FLOW_STAGE_IDS[nextIndex]);
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
