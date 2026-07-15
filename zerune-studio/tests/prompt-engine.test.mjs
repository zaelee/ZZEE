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
  emotion: preset.theme.emotion,
  bpm: preset.music.bpm,
  key: preset.music.key,
  meter: preset.music.meter,
  genres: preset.music.genres,
  instruments: preset.music.instruments,
  texture: preset.music.texture,
  musicExclusions: preset.music.exclusions,
  visualCamera: preset.visual.camera,
  visualSubject: preset.visual.subject,
  visualSetting: preset.visual.setting,
  visualPalette: preset.visual.palette,
  visualTexture: preset.visual.texture,
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
});

test("두 기본 프리셋과 서로 다른 핵심 음색을 제공한다", () => {
  assert.deepEqual(Object.keys(presets), ["ryugyong_noodle_room", "neon_edge_before_fall"]);
  assert.match(presets.ryugyong_noodle_room.music.instruments, /prepared piano/);
  assert.match(presets.neon_edge_before_fall.music.instruments, /FM bass/);
});

test("류경호텔 제목 노드는 평양·랭면 훅과 허구 고지를 함께 유지한다", () => {
  const preset = presets.ryugyong_noodle_room;

  assert.equal(preset.titleStrategy.recommended, preset.titles[preset.recommendedTitle]);
  assert.match(preset.titleStrategy.recommended, /평양.*고위층.*랭면/);
  assert.match(preset.titleStrategy.guardrail, /가상의 공간 서사/);
});

test("대표편 길이와 트랙 수에 맞춰 구조를 정확히 나눈다", () => {
  const preset = presets.ryugyong_noodle_room;
  const fields = fieldsFor(preset);
  fields.flagship = "80";
  const result = engine.generate(preset, fields);

  assert.equal(result.trackPlan.length, 10);
  assert.equal(result.trackPlan[0].start, "0:00");
  assert.equal(result.trackPlan.at(-1).end, "1:20:00");
  assert.equal(result.duration.flagship, "80분 · 10개 트랙 · 트랙별 프롬프트 10개 · 평균 8.0분");
});

test("Mureka 메인 프롬프트가 모든 트랙 구조 프롬프트의 일관성 앵커가 된다", () => {
  for (const preset of Object.values(presets)) {
    const result = engine.generate(preset, fieldsFor(preset));
    assert.equal(result.trackPrompts.length, preset.tracks.length);
    assert.match(result.masterPrompt, /^Instrumental master consistency prompt/);
    result.trackPrompts.forEach(({ prompt }) => {
      assert.ok(prompt.startsWith(result.masterPrompt));
      assert.match(prompt, /no vocals/i);
      assert.match(prompt, /Track \d+ structure/);
    });
  }
});

test("트랙 수를 바꾸면 구조와 음악 프롬프트 수가 항상 함께 바뀐다", () => {
  const preset = presets.ryugyong_noodle_room;
  const fields = fieldsFor(preset);
  fields.chapters = "7";
  const result = engine.generate(preset, fields);

  assert.equal(result.trackPlan.length, 7);
  assert.equal(result.trackPrompts.length, 7);
  assert.equal(result.trackPlan[0].phase, "문턱");
  assert.equal(result.trackPlan.at(-1).phase, "귀환");
});

test("사이버펑크 이미지 결과에 독창성 금지 조건이 포함된다", () => {
  const preset = presets.neon_edge_before_fall;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.imagePrompt, /original 2D animated sci-fi film still/i);
  assert.match(result.negativePrompt, /existing characters/i);
  assert.match(result.negativePrompt, /official logos/i);
});

test("각 프리셋은 이미지 프롬프트 추천과 참고 이미지 10개를 제공한다", () => {
  for (const preset of Object.values(presets)) {
    const result = engine.generate(preset, fieldsFor(preset));
    assert.equal(result.imagePrompts.length, 4);
    assert.equal(result.imagePrompts.filter((item) => item.recommended).length, 1);
    assert.equal(preset.visualReferences.length, 10);
  }
});

test("Markdown 내보내기에 메인·트랙별 음악과 이미지·참고 섹션이 포함된다", () => {
  const preset = presets.ryugyong_noodle_room;
  const result = engine.generate(preset, fieldsFor(preset));

  assert.match(result.markdown, /## 추천 메인 Mureka 프롬프트/);
  assert.match(result.markdown, /## 트랙별 Mureka 프롬프트 · 10개/);
  assert.match(result.markdown, /## 이미지 프롬프트/);
  assert.match(result.markdown, /## 참고 이미지/);
  assert.doesNotMatch(result.markdown, /## 배포 캘린더/);
});
