(function registerPromptEngine(global) {
  "use strict";

  const safeNumber = (value, fallback) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const compact = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const INSTRUMENTAL_LOCK = compact(
    "NON-NEGOTIABLE INSTRUMENTAL-ONLY LOCK: use Mureka Instrumental mode only; generate zero lyrics and zero human voice; no vocals; no singing; no lead or backing voice; no choir; no chant; no rap; no spoken word or dialogue; no whispering; no humming; no breathing; no screams, shouts, or counting; no vocal chops or voice samples; no syllables, phonemes, or non-lexical vocalizations such as ah, oh, ooh, la, or na; never introduce a singer or any voice at any point; express every melodic line with instruments only",
  );

  const INSTRUMENTAL_RECHECK = compact(
    "FINAL ENFORCEMENT: remain 100 percent instrumental from the first second to the last; if any vocal element would appear, remove it and replace it with an instrumental timbre",
  );

  const asciiBytes = (value) => Array.from(String(value), (character) => character.charCodeAt(0) & 0x7f);

  const uint32Bytes = (value) => [
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ];

  const variableLengthBytes = (value) => {
    let remaining = Math.max(0, Math.round(value));
    const bytes = [remaining & 0x7f];
    while ((remaining >>= 7)) bytes.unshift((remaining & 0x7f) | 0x80);
    return bytes;
  };

  const buildReferenceMidi = (preset) => {
    const source = preset.referenceAudio;
    if (!source?.notes?.length) return new Uint8Array();

    const division = 480;
    const bpm = Math.max(30, Math.min(240, safeNumber(source.bpm, 66)));
    const duration = Math.max(5, Math.min(60, safeNumber(source.duration, 30)));
    const microsecondsPerQuarter = Math.round(60000000 / bpm);
    const secondsToTicks = (seconds) => Math.round((seconds * bpm * division) / 60);
    const events = [];
    const addEvent = (tick, order, bytes) => events.push({ tick, order, bytes });
    const trackName = asciiBytes("Zerune original 30s motif");

    addEvent(0, 0, [0xff, 0x03, ...variableLengthBytes(trackName.length), ...trackName]);
    addEvent(0, 1, [
      0xff,
      0x51,
      0x03,
      (microsecondsPerQuarter >>> 16) & 0xff,
      (microsecondsPerQuarter >>> 8) & 0xff,
      microsecondsPerQuarter & 0xff,
    ]);
    addEvent(0, 2, [0xc0, Math.max(0, Math.min(127, Math.round(safeNumber(source.program, 0))))]);

    const motifOffsets = [0, 1.45, 3.05, 5.1];
    const noteDurations = [0.55, 0.55, 0.85, 1.15];
    [2, 11.5, 21].forEach((repeatAt, repeatIndex) => {
      source.notes.slice(0, 4).forEach((note, noteIndex) => {
        const start = repeatAt + motifOffsets[noteIndex];
        const noteDuration = noteDurations[noteIndex] + (noteIndex === 3 ? repeatIndex * 0.25 : 0);
        const startTick = secondsToTicks(start);
        const endTick = secondsToTicks(Math.min(duration - 0.25, start + noteDuration));
        const velocity = Math.max(34, 66 - repeatIndex * 9 - noteIndex * 3);
        const midiNote = Math.max(0, Math.min(127, Math.round(safeNumber(note, 60))));
        addEvent(startTick, 2, [0x90, midiNote, velocity]);
        addEvent(endTick, 1, [0x80, midiNote, 0]);
      });
    });

    events.sort((a, b) => a.tick - b.tick || a.order - b.order);
    const trackData = [];
    let previousTick = 0;
    events.forEach((event) => {
      trackData.push(...variableLengthBytes(event.tick - previousTick), ...event.bytes);
      previousTick = event.tick;
    });
    const endTick = secondsToTicks(duration);
    trackData.push(...variableLengthBytes(Math.max(0, endTick - previousTick)), 0xff, 0x2f, 0x00);

    return new Uint8Array([
      ...asciiBytes("MThd"),
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x00,
      0x00, 0x01,
      (division >>> 8) & 0xff, division & 0xff,
      ...asciiBytes("MTrk"),
      ...uint32Bytes(trackData.length),
      ...trackData,
    ]);
  };

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
    const selected = Array.from({ length: count }, (_, index) => {
      const sourceIndex = count === 1
        ? 0
        : Math.round((index * (preset.tracks.length - 1)) / (count - 1));
      const source = preset.tracks[sourceIndex];
      const repeat = usedSourceIndexes.get(sourceIndex) || 0;
      usedSourceIndexes.set(sourceIndex, repeat + 1);
      return {
        source,
        weight: Math.max(0.01, safeNumber(source.weight, 1)),
        index: index + 1,
        title: repeat ? `${source.title} · 변주 ${repeat + 1}` : source.title,
      };
    });
    const totalWeight = selected.reduce((sum, track) => sum + track.weight, 0);
    let elapsedWeight = 0;
    return selected.map(({ source, weight, ...track }) => {
      const startMinutes = (duration * elapsedWeight) / totalWeight;
      const start = minutesToClock(startMinutes);
      elapsedWeight += weight;
      const endMinutes = (duration * elapsedWeight) / totalWeight;
      return {
        ...track,
        subtitle: source.subtitle || "",
        phase: source.phase,
        energy: source.energy,
        focus: source.focus,
        start,
        end: minutesToClock(endMinutes),
        durationMinutes: endMinutes - startMinutes,
      };
    });
  };

  const buildMasterPrompt = (preset, fields, trackCount) => {
    const variant = preset.music.variants[preset.recommendedMusicVariant || 0];
    const consistentTrackCount = trackCount || Math.max(1, Math.round(safeNumber(fields.chapters, preset.tracks.length)));
    return [
      INSTRUMENTAL_LOCK,
      "Mureka reusable sound bible",
      fields.genres,
      `${fields.bpm} BPM`,
      fields.key,
      fields.meter,
      fields.instruments,
      fields.soundBalance,
      fields.texture,
      `core scene: ${preset.music.sceneAnchor || fields.concept}`,
      `emotional identity: ${fields.emotion}`,
      `narrative restraint: ${preset.music.promptRestraint || fields.corePrinciple}`,
      `keep the same sound palette, mix space, recurring motif and tonal identity across ${consistentTrackCount} separate cues; generate only one cue at a time`,
      "slow-burn tension, restrained peak, clean loopable tail for later extension and crossfade",
      `recommended direction: ${variant.direction}`,
      `avoid: ${fields.musicExclusions}`,
      INSTRUMENTAL_RECHECK,
    ].map(compact).filter(Boolean).join(", ");
  };

  const buildTrackPrompts = (masterPrompt, trackPlan, fields = {}) => trackPlan.map((track) => ({
    ...track,
    prompt: [
      masterPrompt,
      `Playlist act ${String(track.index).padStart(2, "0")} of ${String(trackPlan.length).padStart(2, "0")}`,
      `planned edit slot ${track.start}–${track.end}; generate only this act as one self-contained cue, not the full ${fields.flagship || "30"}-minute playlist`,
      `target about ${track.durationMinutes.toFixed(1)} minutes after extension and editing`,
      `${track.phase} phase`,
      `energy ${track.energy} out of 100`,
      track.focus,
      `leave a clean head and tail for ${fields.crossfade || "6–12초"} crossfade`,
      "preserve the master motif and mix identity; change only density, foreground instrument and narrative function",
      INSTRUMENTAL_RECHECK,
    ].map(compact).filter(Boolean).join(". ") + ".",
  }));

  const buildReferencePlan = (preset) => {
    const source = preset.referenceAudio;
    if (!source) return null;
    return {
      preferredMode: source.preferredMode,
      fileName: source.fileName,
      duration: `${source.duration}초`,
      motif: `${source.motifNames} · ${source.bpm} BPM`,
      guidance: source.guidance,
      recipe: source.recipe,
      fallback: source.fallback,
      rights: source.rights,
    };
  };

  const buildImagePrompt = (fields) => [
    fields.visualCamera,
    fields.visualSubject,
    fields.visualSetting,
    fields.visualPalette,
    fields.visualTexture,
    `visually synchronized with an instrumental ${fields.genres} score at ${fields.bpm} BPM`,
    `carry the same emotional identity: ${fields.emotion}`,
    fields.visualNarrative,
    `no ${fields.visualExclusions}`,
  ].map(compact).filter(Boolean).join(", ");

  const buildImagePrompts = (preset, fields) => {
    const master = buildImagePrompt(fields);
    const variations = preset.meta.id === "ryugyong_noodle_room" ? [
      ["추천 · 메인 스틸", "humid Pyongyang summer night after closing, table-height 35mm view, two untouched brass bowls of raengmyeon with melted ice, two empty seats, a manager jacket on one chair, hotel key on the table, half-open banquet door"],
      ["렌즈 변주 · 복도", "50mm view from the dark corridor through the half-open door, the two bowls and empty seats aligned in the distant frame, no person or silhouette"],
      ["노출 변주 · 흔적", "85mm close still life, one and a half stops underexposed, hotel key, damp jacket sleeve, melted ice touching tarnished brass, the second bowl softly out of focus"],
      ["시간대 변주 · 마지막 조명", "deep summer midnight, the final pale-green fluorescent fixture about to switch off, amber hotel light fading, condensation hiding most of the humid city"],
    ] : [
      ["추천 · PRE-EPISODE CREW", "four completely original anonymous crew members together and alive before their first mission, analog movie camera between them, 35mm medium-wide rooftop-garage view, relaxed camaraderie under surveillance, no recognizable franchise character design"],
      ["렌즈 변주 · VIEWFINDER", "50mm frame seen through an analog viewfinder, camera operator just outside the group, four living figures in imperfect focus, red REC dot added later in post"],
      ["노출 변주 · CITY WATCHING", "CCTV control-room wall, each monitor shows a different original pre-mission moment of the same anonymous crew, two stops underexposed, phosphor green and cyan only"],
      ["시간대 변주 · OFF-AIR", "empty edit suite at pre-dawn, film reel slowing beside a blank CRT, crew gear still present but no death imagery, final black frame reserved for post-production text"],
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
      benchmark: flagship <= 35
        ? "초기 3–5편은 30분 안팎으로 고정 · 유지율 확인 뒤에만 60분 비교"
        : flagship >= 55 && flagship <= 65
          ? "55–65분 사이버펑크 플레이리스트 표본의 중앙값 실험 · 10곡을 공식 10부작과 구조적으로만 대응"
          : "확장 길이 실험 · 같은 제목 문법의 짧은 작품과 유지율을 비교",
    };
  };

  const buildVideoPlan = (preset) => {
    if (!preset.video) return null;
    return {
      intro: preset.video.intro,
      interludes: preset.video.interludes,
      ending: preset.video.ending,
      loop: preset.video.loop,
      disclaimer: preset.video.disclaimer,
    };
  };

  const normalizeChapterClock = (clock) => {
    const parts = String(clock || "0:00").split(":");
    if (parts.length === 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return parts.map((part, index) => index === 0 ? part : part.padStart(2, "0")).join(":");
  };

  const buildYouTubePackage = (preset, fields, trackPlan) => {
    const config = preset.youtube || {};
    const title = preset.titles[preset.recommendedTitle];
    const chapters = trackPlan.map((track) => {
      const label = `${track.title}${track.subtitle ? ` — ${track.subtitle}` : ""}`;
      return `${normalizeChapterClock(track.start)} ${label}`;
    }).join("\n");
    const hashtags = (config.hashtags || []).map((item) => `#${String(item).replace(/^#/, "").replace(/\s+/g, "")}`).join(" ");
    const tags = (config.tags || []).join(", ");
    const description = [
      config.descriptionLead || fields.synopsis,
      "",
      "CHAPTERS",
      chapters,
      "",
      "ABOUT THIS WORK",
      config.descriptionBody || fields.promise,
      "",
      config.disclaimer || "",
      "",
      hashtags,
    ].filter((line, index, all) => line !== "" || (index > 0 && all[index - 1] !== "")).join("\n").trim();
    const settings = [
      ["카테고리", "음악"],
      ["재생목록", config.playlistTitle || "ZERUNE"],
      ["시청자층", "아니요, 아동용이 아닙니다"],
      ["변경·합성 콘텐츠", "예 · Mureka/생성형 도구로 만든 음악 또는 이미지를 사용"],
      ["영상 언어", config.language || "보컬·대사 없음"],
      ["수동 챕터", `${trackPlan.length}개 · 00:00 시작 · 자동 챕터보다 우선 적용`],
      ["유료 프로모션", "아니요 · 협찬이나 대가가 있을 때만 예"],
      ["녹화 날짜·장소", config.recordingLocation || "입력 안 함"],
      ["라이선스", "표준 YouTube 라이선스 · 사용한 모든 소스의 권리를 최종 확인"],
      ["공개 상태", "비공개로 1차 확인 → 이상 없을 때 예약 또는 공개"],
      ["댓글", "검토 후 사용 · 아래 고정 댓글 준비됨"],
    ];
    const settingsText = settings.map(([label, value]) => `${label}: ${value}`).join("\n");
    const thumbnail = [
      config.thumbnail || fields.visualOverlay || "문구 없음",
      "파일: 16:9 · 권장 3840×2160 · 최소 너비 640px · JPG/PNG",
      "용량: 데스크톱 50MB 이하 / 모바일 2MB 이하",
    ].join("\n");
    const uploadOrder = [
      "1. 영상을 비공개로 업로드",
      "2. 추천 제목 붙여넣기",
      "3. 통합 설명 붙여넣기 · 수동 챕터가 인식되는지 확인",
      `4. 재생목록 ‘${config.playlistTitle || "ZERUNE"}’ 선택 또는 생성`,
      "5. 썸네일 업로드 · 제목의 약속과 첫 장면이 일치하는지 확인",
      "6. 더보기에서 언어·카테고리·태그·라이선스 설정",
      "7. ‘변경되거나 합성된 콘텐츠’ 예 선택",
      "8. 저작권 검사와 영상 처리 완료 후 전체 재생",
      "9. 공개 또는 예약 전 모바일 설명·챕터·썸네일 확인",
      "10. 공개 후 고정 댓글 붙여넣기",
    ].join("\n");
    const titleStatus = `${title.length}/100자 · ${title.length <= 100 ? "통과" : "100자 이하로 줄이기"}`;
    const descriptionStatus = `${description.length}/5,000자 · ${description.length <= 5000 ? "통과" : "5,000자 이하로 줄이기"}`;
    const chapterStatus = trackPlan.length >= 3 && trackPlan.every((track) => track.durationMinutes * 60 >= 10)
      ? `${trackPlan.length}개 · 00:00 시작 · 각 10초 이상 · 통과`
      : "챕터 요건 확인 필요";
    const allCopy = [
      "[VIDEO TITLE]",
      title,
      "",
      "[VIDEO DESCRIPTION]",
      description,
      "",
      "[PLAYLIST TITLE]",
      config.playlistTitle || "ZERUNE",
      "",
      "[PLAYLIST DESCRIPTION]",
      config.playlistDescription || fields.promise,
      "",
      "[TAGS]",
      tags,
      "",
      "[PINNED COMMENT]",
      config.pinnedComment || fields.promise,
      "",
      "[THUMBNAIL]",
      thumbnail,
      "",
      "[YOUTUBE STUDIO SETTINGS]",
      settingsText,
    ].join("\n");
    return {
      title,
      titleStatus,
      description,
      descriptionStatus,
      chapters,
      chapterStatus,
      playlistTitle: config.playlistTitle || "ZERUNE",
      playlistDescription: config.playlistDescription || fields.promise,
      hashtags,
      tags,
      pinnedComment: config.pinnedComment || fields.promise,
      thumbnail,
      settings,
      settingsText,
      uploadOrder,
      allCopy,
    };
  };

  const buildOverviewText = (preset, fields, generated) => [
    "[01 · CONCEPT]",
    generated.youtube.title,
    fields.concept,
    fields.promise,
    "",
    "[02 · KEYWORDS]",
    `MUSIC: ${fields.keywordMusic}`,
    `IMAGE SEARCH: ${fields.keywordDiscovery}`,
    "",
    "[03 · SOUND + STRUCTURE]",
    `${fields.flagship}분 · ${generated.trackPlan.length}곡 · ${fields.bpm} BPM`,
    fields.genres,
    generated.youtube.chapters,
    "",
    "[04 · RECOMMENDED PROMPTS]",
    "MUSIC:",
    generated.masterPrompt,
    "",
    "TRACK PROMPTS:",
    ...generated.trackPrompts.flatMap((track) => [
      `${String(track.index).padStart(2, "0")} · ${track.title} · ${track.start}–${track.end}`,
      track.prompt,
      "",
    ]),
    "",
    "IMAGE:",
    generated.imagePrompts.find((item) => item.recommended)?.prompt || generated.imagePrompt,
    "",
    "[05 · YOUTUBE INPUT]",
    generated.youtube.allCopy,
  ].join("\n");

  const buildMarkdown = (preset, fields, generated) => {
    const lines = [
      `# ${preset.titles[preset.recommendedTitle]}`,
      "",
      "## 콘셉트",
      "",
      fields.concept,
      "",
      "## 작품 소개문",
      "",
      fields.synopsis,
      "",
      `- 장소: ${fields.location}`,
      `- 의식: ${fields.ritual}`,
      `- 감정: ${fields.emotion}`,
      "",
      "## 작품 제목",
      "",
      ...preset.titles.map((title) => `- ${title}`),
      "",
      "## 화자와 관계",
      "",
      `- 화자: ${fields.narrator}`,
      `- 가능한 해석: ${fields.ambiguity}`,
      `- 설명하지 않을 것: ${fields.unresolved}`,
      `- 핵심 원칙: ${fields.corePrinciple}`,
      "",
      "## Mureka 입력 소스",
      "",
      `- 추천 모드: ${generated.referenceAudio.preferredMode}`,
      `- 파일: ${generated.referenceAudio.fileName} · ${generated.referenceAudio.duration}`,
      `- 모티프: ${generated.referenceAudio.motif}`,
      `- 적용 순서: ${generated.referenceAudio.guidance}`,
      `- 오디오 레퍼런스 대안: ${generated.referenceAudio.fallback}`,
      `- 권리 원칙: ${generated.referenceAudio.rights}`,
      "",
      "## 추천 메인 Mureka 프롬프트",
      "",
      generated.masterPrompt,
      "",
      `## 트랙별 Mureka 프롬프트 · ${generated.trackPrompts.length}개`,
      "",
      ...generated.trackPrompts.flatMap((track) => [
        `### ${String(track.index).padStart(2, "0")} · ${track.title}${track.subtitle ? ` / ${track.subtitle}` : ""}`,
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
      ...(generated.videoPlan ? [
        "## 영상 방송 문구",
        "",
        "### 오프닝",
        "",
        generated.videoPlan.intro,
        "",
        "### 중간 신호",
        "",
        generated.videoPlan.interludes,
        "",
        "### 마지막 화면과 루프",
        "",
        generated.videoPlan.ending,
        "",
        generated.videoPlan.loop,
        "",
        `팬 작품 고지: ${generated.videoPlan.disclaimer}`,
        "",
      ] : []),
      "## YouTube 입력 패키지",
      "",
      `- 제목 길이: ${generated.youtube.titleStatus}`,
      `- 설명 길이: ${generated.youtube.descriptionStatus}`,
      `- 챕터: ${generated.youtube.chapterStatus}`,
      "",
      "### 영상 제목",
      "",
      generated.youtube.title,
      "",
      "### 통합 설명",
      "",
      generated.youtube.description,
      "",
      "### 플레이리스트",
      "",
      generated.youtube.playlistTitle,
      "",
      generated.youtube.playlistDescription,
      "",
      "### 태그",
      "",
      generated.youtube.tags,
      "",
      "### 고정 댓글",
      "",
      generated.youtube.pinnedComment,
      "",
      "### Studio 설정",
      "",
      generated.youtube.settingsText,
      "",
      "### 업로드 순서",
      "",
      generated.youtube.uploadOrder,
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
      instrumentalLock: INSTRUMENTAL_LOCK,
      masterPrompt,
      trackPlan,
      trackPrompts: buildTrackPrompts(masterPrompt, trackPlan, fields),
      referenceAudio: buildReferencePlan(preset),
      imagePrompts: buildImagePrompts(preset, fields),
      imagePrompt: buildImagePrompt(fields),
      negativePrompt: buildNegativePrompt(fields),
      duration: buildDurationStrategy(fields),
      videoPlan: buildVideoPlan(preset),
      youtube: buildYouTubePackage(preset, fields, trackPlan),
    };
    result.overviewText = buildOverviewText(preset, fields, result);
    result.markdown = buildMarkdown(preset, fields, result);
    return result;
  };

  global.ImpossibleSpacesEngine = {
    instrumentalLock: INSTRUMENTAL_LOCK,
    buildDurationStrategy,
    buildImagePrompt,
    buildImagePrompts,
    buildMarkdown,
    buildMasterPrompt,
    buildReferenceMidi,
    buildReferencePlan,
    buildTrackPlan,
    buildTrackPrompts,
    buildVideoPlan,
    buildYouTubePackage,
    buildOverviewText,
    generate,
    minutesToClock,
  };
})(globalThis);
