(function registerPromptEngine(global) {
  "use strict";

  const safeNumber = (value, fallback) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const compact = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const minutesToClock = (minutes) => {
    const totalSeconds = Math.round(safeNumber(minutes, 0) * 60);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours) return `${hours}:${String(mins).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    return `${mins}:${String(seconds).padStart(2, "0")}`;
  };

  const buildTrackPlan = (preset, fields) => {
    const count = Math.max(1, Math.min(24, Math.round(safeNumber(fields.chapters, preset.tracks.length))));
    const duration = Math.max(1, safeNumber(fields.flagship, preset.duration.flagship));
    const usedSourceIndexes = new Map();
    return Array.from({ length: count }, (_, index) => {
      const sourceIndex = count === 1
        ? 0
        : Math.round((index * (preset.tracks.length - 1)) / (count - 1));
      const source = preset.tracks[sourceIndex];
      const repeat = usedSourceIndexes.get(sourceIndex) || 0;
      usedSourceIndexes.set(sourceIndex, repeat + 1);
      return {
        index: index + 1,
        title: repeat ? `${source.title} · 변주 ${repeat + 1}` : source.title,
        phase: source.phase,
        energy: source.energy,
        focus: source.focus,
        start: minutesToClock((duration * index) / count),
        end: minutesToClock((duration * (index + 1)) / count),
      };
    });
  };

  const buildMasterPrompt = (preset, fields, trackCount) => {
    const variant = preset.music.variants[preset.recommendedMusicVariant || 0];
    const consistentTrackCount = trackCount || Math.max(1, Math.round(safeNumber(fields.chapters, preset.tracks.length)));
    return [
      "Instrumental master consistency prompt",
      fields.genres,
      `${fields.bpm} BPM`,
      fields.key,
      fields.meter,
      fields.instruments,
      fields.texture,
      `core scene: ${fields.concept}`,
      `emotional identity: ${fields.emotion}`,
      `keep the same sound palette, mix space, recurring motif and tonal identity across all ${consistentTrackCount} tracks`,
      `overall duration ${fields.flagship} minutes, gradual narrative peak around 70–80 percent, loopable decompression`,
      `recommended direction: ${variant.direction}`,
      `no ${fields.musicExclusions}`,
    ].map(compact).filter(Boolean).join(", ");
  };

  const buildTrackPrompts = (masterPrompt, trackPlan) => trackPlan.map((track) => ({
    ...track,
    prompt: [
      masterPrompt,
      `Track ${String(track.index).padStart(2, "0")} structure`,
      `${track.start}–${track.end}`,
      `${track.phase} phase`,
      `energy ${track.energy} out of 100`,
      track.focus,
      "preserve the master motif and mix identity; change only density, foreground instrument and narrative function",
    ].map(compact).filter(Boolean).join(". ") + ".",
  }));

  const buildImagePrompt = (fields) => [
    fields.visualCamera,
    fields.visualSubject,
    fields.visualSetting,
    fields.visualPalette,
    fields.visualTexture,
    `visually synchronized with an instrumental ${fields.genres} score at ${fields.bpm} BPM`,
    `carry the same emotional identity: ${fields.emotion}`,
    "quiet narrative tension, a single readable focal point, thumbnail-safe silhouette",
    `no ${fields.visualExclusions}`,
  ].map(compact).filter(Boolean).join(", ");

  const buildImagePrompts = (preset, fields) => {
    const master = buildImagePrompt(fields);
    const variations = preset.meta.id === "ryugyong_noodle_room" ? [
      ["추천 · 메인 스틸", "table-height 35mm view, winter midnight, one stop underexposed, noodles and frosted fruit wine as the focal pair"],
      ["렌즈 변주 · 공간", "24mm low angle from the banquet table edge, stronger triangular perspective, tiny distant skyline, no fisheye distortion"],
      ["노출 변주 · 정물", "85mm close still life, two stops underexposed, brass bowl condensation and berry wine frost, background city dissolved into bokeh"],
      ["시간대 변주 · 새벽", "pre-dawn blue hour, fluorescent fixtures switching off one by one, pale river horizon, colder shadows and softer tungsten remnants"],
    ] : [
      ["추천 · 메인 스틸", "35mm low-angle medium-wide shot, rain at 02:17, cyan and warning red, courier silhouette and leaking optic memory as one focal event"],
      ["렌즈 변주 · 추격", "24mm kinetic diagonal view from platform floor, last train entering frame, longer rain streaks, controlled motion blur"],
      ["노출 변주 · 기억", "85mm compressed close profile, two stops underexposed, optic implant glow exposing only one eye and airborne memory fragments"],
      ["시간대 변주 · 잔향", "pre-dawn after the rain, neon signs shutting down, graphite sky, empty platform and a single abandoned memory cartridge"],
    ];
    return variations.map(([label, direction], index) => ({
      label,
      recommended: index === 0,
      prompt: `${master}, variation: ${direction}`,
    }));
  };

  const buildNegativePrompt = (fields) => [
    fields.visualExclusions,
    "low resolution, muddy focal point, extra limbs, malformed hands, unreadable generated text, oversaturated bloom, generic stock-photo smile",
  ].map(compact).filter(Boolean).join(", ");

  const buildDurationStrategy = (fields) => {
    const chapters = Math.max(1, Math.round(safeNumber(fields.chapters, 10)));
    const flagship = Math.max(1, safeNumber(fields.flagship, 64));
    return {
      flagship: `${flagship}분 · ${chapters}개 트랙 · 트랙별 프롬프트 ${chapters}개 · 평균 ${(flagship / chapters).toFixed(1)}분`,
      crossfade: `${fields.crossfade} 크로스페이드 · 모든 트랙에 같은 메인 프롬프트를 앵커로 사용`,
    };
  };

  const buildMarkdown = (preset, fields, generated) => {
    const lines = [
      `# ${preset.meta.eyebrow} — ${preset.meta.name}`,
      "",
      "## 콘셉트",
      "",
      fields.concept,
      "",
      `- 장소: ${fields.location}`,
      `- 의식: ${fields.ritual}`,
      `- 감정: ${fields.emotion}`,
      "",
      "## 제목 후보",
      "",
      ...preset.titles.map((title, index) => `- ${index === preset.recommendedTitle ? "[추천] " : ""}${title}`),
      "",
      "## 추천 메인 Mureka 프롬프트",
      "",
      generated.masterPrompt,
      "",
      `## 트랙별 Mureka 프롬프트 · ${generated.trackPrompts.length}개`,
      "",
      ...generated.trackPrompts.flatMap((track) => [
        `### ${String(track.index).padStart(2, "0")} · ${track.title}`,
        "",
        `${track.start}–${track.end} · ${track.phase} · 에너지 ${track.energy}/100`,
        "",
        track.prompt,
        "",
      ]),
      "## 이미지 프롬프트",
      "",
      ...generated.imagePrompts.flatMap((item) => [`### ${item.recommended ? "[추천] " : ""}${item.label}`, "", item.prompt, ""]),
      `네거티브: ${generated.negativePrompt}`,
      "",
      "## 참고 이미지",
      "",
      ...preset.visualReferences.map((item, index) => `${index + 1}. [${item.title}](${item.source}) — ${item.angle}`),
    ];
    return lines.join("\n");
  };

  const generate = (preset, fields) => {
    const trackPlan = buildTrackPlan(preset, fields);
    const masterPrompt = buildMasterPrompt(preset, fields, trackPlan.length);
    const result = {
      masterPrompt,
      trackPlan,
      trackPrompts: buildTrackPrompts(masterPrompt, trackPlan),
      imagePrompts: buildImagePrompts(preset, fields),
      imagePrompt: buildImagePrompt(fields),
      negativePrompt: buildNegativePrompt(fields),
      duration: buildDurationStrategy(fields),
    };
    result.markdown = buildMarkdown(preset, fields, result);
    return result;
  };

  global.ImpossibleSpacesEngine = {
    buildDurationStrategy,
    buildImagePrompt,
    buildImagePrompts,
    buildMarkdown,
    buildMasterPrompt,
    buildTrackPlan,
    buildTrackPrompts,
    generate,
    minutesToClock,
  };
})(globalThis);
