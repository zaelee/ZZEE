import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const context = vm.createContext({});
context.globalThis = context;

for (const file of ["data/presets.js", "js/prompt-engine.js"]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

const presets = context.IMPOSSIBLE_SPACES_PRESETS;
const engine = context.ImpossibleSpacesEngine;

const fieldsFor = (preset) => ({
  concept: preset.theme.concept,
  synopsis: preset.theme.synopsis,
  emotion: preset.theme.emotion,
  bpm: preset.music.bpm,
  key: preset.music.key,
  meter: preset.music.meter,
  genres: preset.music.genres,
  soundBalance: preset.music.balance,
  instruments: preset.music.instruments,
  texture: preset.music.texture,
  musicExclusions: preset.music.exclusions,
  visualCamera: preset.visual.camera,
  visualSubject: preset.visual.subject,
  visualSetting: preset.visual.setting,
  visualPalette: preset.visual.palette,
  visualTexture: preset.visual.texture,
  visualNarrative: preset.visual.narrative,
  visualExclusions: preset.visual.exclusions,
  visualOverlay: preset.visual.overlay,
  pilot: String(preset.duration.pilot),
  flagship: String(preset.duration.flagship),
  extended: String(preset.duration.extended),
  chapters: String(preset.tracks.length),
  crossfade: preset.duration.crossfade,
  location: preset.theme.location,
  ritual: preset.theme.ritual,
  promise: preset.theme.promise,
  narrator: preset.theme.narrator,
  ambiguity: preset.theme.ambiguity,
  unresolved: preset.theme.unresolved,
  corePrinciple: preset.theme.corePrinciple,
  keywordMusic: preset.keywords.music,
  keywordDiscovery: preset.keywords.discovery,
});

test("두 기본 프리셋과 서로 다른 핵심 음색을 제공한다", () => {
  assert.deepEqual(Object.keys(presets), ["ryugyong_noodle_room", "neon_edge_before_fall"]);
  assert.match(presets.ryugyong_noodle_room.music.instruments, /옥류금/);
  assert.match(presets.neon_edge_before_fall.music.instruments, /FM bass/);
});

test("류경호텔 작품 제목은 한 문장과 마침표만 고정한다", () => {
  const preset = presets.ryugyong_noodle_room;

  assert.equal(preset.titles.length, 1);
  assert.equal(preset.titleStrategy.recommended, preset.titles[preset.recommendedTitle]);
  assert.equal(preset.titleStrategy.recommended, "지배인 동지, 랭면이 불었습니다.");
  assert.match(preset.titleStrategy.recommended, /\.$/);
  assert.doesNotMatch(preset.titleStrategy.recommended, /playlist|mix|플레이리스트|\|/i);
  assert.match(preset.titleStrategy.formatRule, /부제.*장르명.*플레이리스트/);
});

test("두 번째 작품은 비공식 팬 플레이리스트 제목과 삼중 Fall 의미를 고정한다", () => {
  const preset = presets.neon_edge_before_fall;

  assert.equal(preset.titleStrategy.recommended, "BEFORE THE NEXT FALL — Cyberpunk: Edgerunners 2 Fan Playlist");
  assert.equal(preset.titleStrategy.meanings.length, 3);
  assert.match(preset.meta.status, /UNOFFICIAL FAN WORK/);
  assert.match(preset.video.disclaimer, /not approved or endorsed by CD PROJEKT RED/i);
  assert.doesNotMatch(preset.titleStrategy.recommended, /Official|OST|Soundtrack/i);
});

test("대표편 길이와 트랙 수에 맞춰 구조를 정확히 나눈다", () => {
  const preset = presets.ryugyong_noodle_room;
  const fields = fieldsFor(preset);
  fields.flagship = "80";
  const result = engine.generate(preset, fields);

  assert.equal(result.trackPlan.length, 5);
  assert.equal(result.trackPlan[0].start, "0:00");
  assert.equal(result.trackPlan[0].end, "10:24");
  assert.equal(result.trackPlan.at(-1).end, "1:20:00");
  assert.equal(result.duration.flagship, "80분 · 5개 트랙 · 트랙별 프롬프트 5개 · 평균 16.0분");
});

test("초기 공개 기본값은 30분이고 류경호텔 5막을 끝까지 보존한다", () => {
  const preset = presets.ryugyong_noodle_room;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.equal(preset.duration.flagship, 30);
  assert.deepEqual(Array.from(result.trackPlan, ({ start, end }) => [start, end]), [
    ["0:00", "3:54"],
    ["3:54", "11:24"],
    ["11:24", "18:00"],
    ["18:00", "25:12"],
    ["25:12", "30:00"],
  ]);
  assert.match(result.duration.benchmark, /초기 3–5편.*30분.*60분/);
});

test("BEFORE THE NEXT FALL은 60분 10곡과 정확한 루프 경계를 제공한다", () => {
  const preset = presets.neon_edge_before_fall;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.equal(preset.duration.flagship, 60);
  assert.equal(result.trackPlan.length, 10);
  assert.deepEqual(Array.from(result.trackPlan, ({ start, end }) => [start, end]), [
    ["0:00", "4:48"],
    ["4:48", "10:12"],
    ["10:12", "16:12"],
    ["16:12", "22:12"],
    ["22:12", "28:12"],
    ["28:12", "34:48"],
    ["34:48", "41:24"],
    ["41:24", "48:36"],
    ["48:36", "54:36"],
    ["54:36", "1:00:00"],
  ]);
  assert.equal(result.trackPlan[0].subtitle, "새로운 크루 감지");
  assert.equal(result.trackPlan.at(-1).subtitle, "결말은 도시가 가져간다");
  assert.match(result.duration.benchmark, /55–65분.*10곡.*10부작/);
});

test("Mureka 메인 프롬프트가 모든 트랙 구조 프롬프트의 일관성 앵커가 된다", () => {
  for (const preset of Object.values(presets)) {
    const result = engine.generate(preset, fieldsFor(preset));
    assert.equal(result.trackPrompts.length, preset.tracks.length);
    assert.ok(result.masterPrompt.startsWith(engine.instrumentalLock));
    assert.doesNotMatch(result.masterPrompt, /overall duration/i);
    result.trackPrompts.forEach(({ prompt }) => {
      assert.ok(prompt.startsWith(result.masterPrompt));
      assert.match(prompt, /no vocals/i);
      assert.match(prompt, /Playlist act \d+ of \d+/);
      assert.match(prompt, new RegExp(`generate only this act.*not the full ${preset.duration.flagship}-minute playlist`, "i"));
    });
  }
});

test("모든 Zerune 음악 프롬프트에 강제 무가사 잠금을 고정한다", () => {
  const prohibited = [
    /zero lyrics/i,
    /no vocals/i,
    /no singing/i,
    /no choir/i,
    /no rap/i,
    /no spoken word or dialogue/i,
    /no whispering/i,
    /no humming/i,
    /no vocal chops or voice samples/i,
    /no syllables, phonemes, or non-lexical vocalizations/i,
  ];

  for (const preset of Object.values(presets)) {
    const result = engine.generate(preset, fieldsFor(preset));
    assert.equal(result.instrumentalLock, engine.instrumentalLock);
    assert.ok(result.masterPrompt.startsWith(engine.instrumentalLock));
    prohibited.forEach((pattern) => assert.match(result.masterPrompt, pattern));
    assert.match(result.masterPrompt, /FINAL ENFORCEMENT.*100 percent instrumental/i);
    result.trackPrompts.forEach(({ prompt }) => {
      assert.ok(prompt.startsWith(engine.instrumentalLock));
      assert.match(prompt, /FINAL ENFORCEMENT.*100 percent instrumental.*FINAL ENFORCEMENT.*100 percent instrumental/i);
    });
  }
});

test("Mureka Melody ideas용 30초 자체 MIDI를 생성한다", () => {
  for (const preset of Object.values(presets)) {
    const bytes = engine.buildReferenceMidi(preset);
    const header = String.fromCharCode(...bytes.slice(0, 4));
    const trackHeader = String.fromCharCode(...bytes.slice(14, 18));

    assert.equal(header, "MThd");
    assert.equal(trackHeader, "MTrk");
    assert.ok(bytes.length > 100);
    assert.equal(preset.referenceAudio.duration, 30);
    assert.match(engine.buildReferencePlan(preset).preferredMode, /Melody ideas/);
  }
});

test("트랙 수를 바꾸면 구조와 음악 프롬프트 수가 항상 함께 바뀐다", () => {
  const preset = presets.ryugyong_noodle_room;
  const fields = fieldsFor(preset);
  fields.chapters = "7";
  const result = engine.generate(preset, fields);

  assert.equal(result.trackPlan.length, 7);
  assert.equal(result.trackPrompts.length, 7);
  assert.equal(result.trackPlan[0].phase, "시작");
  assert.equal(result.trackPlan.at(-1).phase, "마지막");
});

test("평양 여름 누아르 음악은 70/30 비율과 무대사 원칙을 유지한다", () => {
  const preset = presets.ryugyong_noodle_room;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.masterPrompt, /70 percent/);
  assert.match(result.masterPrompt, /30 percent/);
  assert.match(result.masterPrompt, /no vocals.*spoken word.*literal dialogue/i);
  assert.equal(result.trackPlan.map((track) => track.phase).join(" → "), "시작 → 기다림 → 목소리 → 절정 → 마지막");
});

test("사이버펑크 이미지 결과는 1화 이전의 독창 크루와 팬 작품 경계를 포함한다", () => {
  const preset = presets.neon_edge_before_fall;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.imagePrompt, /four completely original anonymous young adult crew members/i);
  assert.match(result.imagePrompt, /a living crew preserved before the first choice/i);
  assert.match(result.negativePrompt, /existing characters/i);
  assert.match(result.negativePrompt, /official logos/i);
  assert.doesNotMatch(result.imagePrompt, /courier|optic implant/i);
});

test("비인가 방송 문구와 마지막 루프를 이미지 노드용 결과로 만든다", () => {
  const preset = presets.neon_edge_before_fall;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.videoPlan.intro, /RECORDED BEFORE EPISODE ONE/);
  assert.match(result.videoPlan.intro, /CREW STATUS: ALIVE/);
  assert.match(result.videoPlan.interludes, /DO NOT RECORD THE ENDING/);
  assert.match(result.videoPlan.ending, /SEE YOU IN FALL/);
  assert.match(result.videoPlan.loop, /01의 부팅음/);
});

test("팬 플레이리스트 Mureka 프롬프트는 공식 IP 이름과 사건 재현을 생성 지시로 쓰지 않는다", () => {
  const preset = presets.neon_edge_before_fall;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.doesNotMatch(result.masterPrompt, /Cyberpunk|Edgerunners/i);
  assert.match(result.masterPrompt, /four completely original anonymous crew members/i);
  assert.match(result.masterPrompt, /do not begin, predict or recreate/i);
  assert.match(result.masterPrompt, /official soundtrack melody/);
});

test("각 프리셋은 이미지 프롬프트 추천과 참고 이미지 10개를 제공한다", () => {
  for (const preset of Object.values(presets)) {
    const result = engine.generate(preset, fieldsFor(preset));
    assert.equal(result.imagePrompts.length, 4);
    assert.equal(result.imagePrompts.filter((item) => item.recommended).length, 1);
    assert.equal(preset.visualReferences.length, 10);
  }
  const ryugyong = engine.generate(presets.ryugyong_noodle_room, fieldsFor(presets.ryugyong_noodle_room));
  assert.match(ryugyong.imagePrompt, /랭면 두 그릇/);
  assert.match(ryugyong.imagePrompt, /지배인의 재킷/);
  assert.match(ryugyong.negativePrompt, /person.*face.*human silhouette/i);
});

test("Markdown 내보내기에 메인·트랙별 음악과 이미지·참고 섹션이 포함된다", () => {
  const preset = presets.ryugyong_noodle_room;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.markdown, /^# 지배인 동지, 랭면이 불었습니다\.\n/);
  assert.doesNotMatch(result.markdown.split("\n", 1)[0], /ZERUNE|playlist|mix|플레이리스트|\|/i);
  assert.match(result.markdown, /## 작품 제목\n\n- 지배인 동지, 랭면이 불었습니다\./);
  assert.match(result.markdown, /## 작품 소개문\n\n여름밤, 류경호텔 105층\./);
  assert.match(result.markdown, /## 화자와 관계/);
  assert.match(result.markdown, /## Mureka 입력 소스/);
  assert.match(result.markdown, /ryugyong-30s-memory-motif\.mid/);
  assert.match(result.markdown, /## 추천 메인 Mureka 프롬프트/);
  assert.match(result.markdown, /## 트랙별 Mureka 프롬프트 · 5개/);
  assert.match(result.markdown, /## 이미지 프롬프트/);
  assert.match(result.markdown, /## 참고 이미지/);
  assert.doesNotMatch(result.markdown, /## 배포 캘린더/);
});

test("두 번째 작품 Markdown에 10곡, 영상 문구와 팬 작품 고지가 함께 남는다", () => {
  const preset = presets.neon_edge_before_fall;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.markdown, /^# BEFORE THE NEXT FALL — Cyberpunk: Edgerunners 2 Fan Playlist\n/);
  assert.match(result.markdown, /## 트랙별 Mureka 프롬프트 · 10개/);
  assert.match(result.markdown, /NEW CREW DETECTED \/ 새로운 크루 감지/);
  assert.match(result.markdown, /## 영상 방송 문구/);
  assert.match(result.markdown, /CREW STATUS: ALIVE/);
  assert.match(result.markdown, /not approved or endorsed by CD PROJEKT RED/i);
});

test("모든 프로젝트에 YouTube 제목·설명·챕터·플레이리스트 복사 패키지를 만든다", () => {
  for (const preset of Object.values(presets)) {
    const result = engine.generate(preset, fieldsFor(preset));

    assert.equal(result.youtube.title, preset.titles[preset.recommendedTitle]);
    assert.match(result.youtube.titleStatus, /\/100자 · 통과/);
    assert.match(result.youtube.descriptionStatus, /\/5,000자 · 통과/);
    assert.equal(result.youtube.chapters.split("\n").length, preset.tracks.length);
    assert.match(result.youtube.chapters, /^00:00 /);
    assert.match(result.youtube.chapterStatus, /00:00 시작.*각 10초 이상.*통과/);
    assert.match(result.youtube.settingsText, /카테고리: 음악/);
    assert.match(result.youtube.settingsText, /변경·합성 콘텐츠: 예/);
    assert.match(result.youtube.uploadOrder, /비공개로 업로드/);
    assert.ok(result.youtube.hashtags.split(" ").length <= 3);
  }
});

test("프로젝트별 YouTube 문구와 팬 고지를 보존한다", () => {
  const ryugyong = engine.generate(presets.ryugyong_noodle_room, fieldsFor(presets.ryugyong_noodle_room));
  const edgerunners = engine.generate(presets.neon_edge_before_fall, fieldsFor(presets.neon_edge_before_fall));

  assert.equal(ryugyong.youtube.title, "지배인 동지, 랭면이 불었습니다.");
  assert.match(ryugyong.youtube.description, /실제 류경호텔의 내부나 운영을 기록한 영상이 아니라/);
  assert.match(ryugyong.youtube.tags, /평양 랭면.*평양 냉면/);
  assert.match(edgerunners.youtube.description, /Everyone is still alive before episode one/);
  assert.match(edgerunners.youtube.description, /not approved or endorsed by CD PROJEKT RED/i);
  assert.match(edgerunners.youtube.pinnedComment, /unofficial fan work/i);
});

test("전체보기와 Markdown에 01–05 핵심 결과가 한 번에 포함된다", () => {
  const preset = presets.neon_edge_before_fall;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.overviewText, /\[01 · CONCEPT\]/);
  assert.match(result.overviewText, /\[02 · KEYWORDS\]/);
  assert.match(result.overviewText, /\[03 · SOUND \+ STRUCTURE\]/);
  assert.match(result.overviewText, /\[04 · RECOMMENDED PROMPTS\]/);
  assert.match(result.overviewText, /\[05 · YOUTUBE INPUT\]/);
  assert.match(result.markdown, /## YouTube 입력 패키지/);
  assert.match(result.markdown, /### 통합 설명/);
  assert.match(result.markdown, /### Studio 설정/);
});
