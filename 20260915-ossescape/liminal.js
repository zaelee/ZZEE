(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    Liminal system
    ---------------------------------------------------------------------------
    이 파일은 스토리 진행 자체를 바꾸지 않고, 게임 전체에 얇게 깔리는
    "이상 현상 레이어"를 관리합니다.

    담당 범위:
    - 방 이동 시 10% 확률로 발생하는 랜덤 리미널 이벤트
    - 같은 이벤트가 연속으로 나오지 않도록 하는 선택 규칙
    - 플레이어에게 직접 숫자를 보여주지 않는 내부 감염도
    - 감염도에 따라 조금씩 달라지는 화면/메뉴/소리/공간 효과
    - 히든 배드엔딩 후보와 진엔딩 조건 판정

    중요한 설계 원칙:
    - scene.js의 스토리 이벤트를 직접 수정하지 않습니다.
    - game.js에는 최소한의 연결점만 둡니다.
    - 이벤트 데이터는 아래 LIMINAL_EVENTS 배열에 모아두어 쉽게 추가/삭제합니다.
  */

  const LIMINAL_EVENTS = [
    { id: "light_out", text: "형광등 하나가 꺼졌다.", effect: "light", infection: 1 },
    { id: "corridor_longer", text: "복도 길이가 조금 길어진 것 같다.", effect: "stretch", infection: 1 },
    { id: "meeting_number", text: "회의실 번호가 바뀌어 있다.", effect: "text", infection: 1 },
    { id: "chair_turn", text: "의자 하나가 다른 방향을 보고 있다.", effect: "object", infection: 1 },
    { id: "dispenser_shift", text: "정수기 위치가 조금 달라졌다.", effect: "object", infection: 1 },
    { id: "plant_count", text: "화분 개수가 기억과 맞지 않는다.", effect: "object", infection: 1 },
    { id: "blank_print", text: "프린터에서 빈 종이가 한 장 나온다.", effect: "paper", infection: 2 },
    { id: "clock_214", text: "시계가 2:14를 가리켰다가 다시 2:13으로 돌아온다.", effect: "clock", infection: 2 },
    { id: "shadow_delay", text: "그림자가 아주 조금 늦게 따라온다.", effect: "shadowLag", infection: 2 },
    { id: "cursor_missing", text: "마우스 커서가 잠깐 사라진 것 같다.", effect: "cursor", infection: 1 },
    { id: "menu_face", text: "메뉴 뒤쪽에 무언가 붉은 얼굴처럼 번졌다.", effect: "menuFace", infection: 2 },
    { id: "dont_look", text: "모니터에 DON'T LOOK BACK이 한 프레임 지나간다.", effect: "redGlitch", infection: 2 },
    { id: "missing_door", text: "뒤돌아보자 문 하나가 없어진 듯했다.", effect: "door", infection: 2 },
    { id: "new_door", text: "없던 문 하나가 벽에 생긴 것처럼 보인다.", effect: "door", infection: 2 },
    { id: "extra_meeting", text: "회의실이 하나 더 있는 것 같다.", effect: "stretch", infection: 1 },
    { id: "ceiling_bean", text: "천장에서 콩 하나가 툭 떨어진다.", effect: "bean", infection: 3 },
    { id: "cctv_simkong", text: "CCTV 화면에서만 심콩이 지나간다.", effect: "cctv", infection: 3 },
    { id: "corridor_closer", text: "복도 끝이 조금 가까워졌다.", effect: "compress", infection: 2 },
    { id: "window_shadow", text: "창문 밖 사람 그림자가 한 프레임 스친다.", effect: "window", infection: 3 },
    { id: "pc_turn_on", text: "사무실 컴퓨터 하나가 혼자 켜진다.", effect: "monitor", infection: 2 },
    { id: "printer_again", text: "아무도 없는데 프린터가 다시 출력한다.", effect: "paper", infection: 2 },
    { id: "chair_tracks", text: "의자들이 조금씩 플레이어 쪽을 향한다.", effect: "object", infection: 3 },
    { id: "frame_upside", text: "벽 액자가 거꾸로 걸려 있다.", effect: "frame", infection: 2 },
    { id: "cup_count", text: "탕비실 컵 개수가 늘어났다.", effect: "object", infection: 1 },
    { id: "trash_shift", text: "휴지통 위치가 달라졌다.", effect: "object", infection: 1 },
    { id: "name_whisper", text: "누군가 아주 작게 이름을 부른다.", effect: "whisper", infection: 3 },
    { id: "running_far", text: "멀리서 누군가 뛰어가는 소리가 난다.", effect: "sound", infection: 2 },
    { id: "bean_at_end", text: "복도 끝에 붉은콩 하나가 있다.", effect: "bean", infection: 3 },
    { id: "bean_missing_turn", text: "뒤돌아보면 붉은콩은 없다.", effect: "beanGone", infection: 2 },
    { id: "projector_on", text: "회의실 안쪽 프로젝터가 혼자 켜진다.", effect: "monitor", infection: 2 },
    { id: "crt_error", text: "화면이 잠깐 CRT 오류를 일으킨다.", effect: "redGlitch", infection: 2 },
    { id: "air_heavy", text: "공기가 한순간 젖은 종이처럼 무거워진다.", effect: "fog", infection: 2 },
    { id: "floor_tile", text: "바닥 타일 하나가 다른 색이다.", effect: "tile", infection: 1 },
    { id: "exit_sign", text: "비상구 표시가 반대로 깜빡인다.", effect: "light", infection: 1 },
    { id: "elevator_ding", text: "없는 엘리베이터의 도착음이 난다.", effect: "sound", infection: 2 },
    { id: "water_taste", text: "물 냄새에서 아주 희미한 콩 냄새가 난다.", effect: "whisper", infection: 2 },
    { id: "desk_drawer", text: "책상 서랍이 1cm 열려 있다.", effect: "object", infection: 1 },
    { id: "keyboard_typing", text: "빈 자리에서 키보드 소리가 이어진다.", effect: "sound", infection: 2 },
    { id: "wall_breath", text: "벽이 아주 느리게 숨을 쉬는 것 같다.", effect: "breath", infection: 3 },
    { id: "red_reflection", text: "유리창에 붉은 눈이 비쳤다가 사라진다.", effect: "redGlitch", infection: 3 },
    { id: "paper_name", text: "빈 종이에 알 수 없는 글자가 번진다.", effect: "paper", infection: 2 },
    { id: "vent_laugh", text: "환풍구 안쪽에서 웃음소리가 한 번 난다.", effect: "laugh", infection: 3 }
  ];

  const REQUIRED_DOCUMENT_FLAGS = [
    "doc_warehouse_note_01",
    "doc_warehouse_note_02",
    "doc_warehouse_note_03",
    "doc_design_research",
    "doc_project_s",
    "doc_final_report",
    "doc_second_floor_memo"
  ];

  const BAD_ENDING_IDS = [
    "bad_end_infection",
    "bad_end_locked_company",
    "bad_end_absorbed",
    "bad_end_ceo",
    "bad_end_second_floor_loop",
    "bad_end_red_soymilk",
    "bad_end_researcher",
    "bad_end_subject_s05"
  ];

  class LiminalSystem {
    constructor(game) {
      this.game = game;
      this.infection = 0;
      this.foundEvents = {};
      this.lastEventId = "";
      this.activeMessage = null;
      this.messageTimer = 0;
      this.menuFaceTimer = 0;
      this.shadowTrail = [];
      this.distortion = {
        stretch: 0,
        compress: 0,
        fog: 0,
        breath: 0,
        red: 0,
        bean: 0,
        light: 0
      };
    }

    reset() {
      this.infection = 0;
      this.foundEvents = {};
      this.lastEventId = "";
      this.activeMessage = null;
      this.messageTimer = 0;
      this.menuFaceTimer = 0;
      this.shadowTrail = [];
      Object.keys(this.distortion).forEach((key) => {
        this.distortion[key] = 0;
      });
      document.body.classList.remove("liminal-menu-infected");
    }

    serialize() {
      return {
        infection: this.infection,
        foundEvents: this.foundEvents,
        lastEventId: this.lastEventId
      };
    }

    hydrate(payload = {}) {
      this.infection = clamp(payload.infection || 0, 0, 100);
      this.foundEvents = payload.foundEvents || {};
      this.lastEventId = payload.lastEventId || "";
      this.applyPassiveMenuState();
    }

    onSceneChange(previousSceneId, nextSceneId) {
      if (!previousSceneId || previousSceneId === nextSceneId) return;
      if (this.game.mode !== "gameplay") return;
      if (this.game.flags.escape_sequence_started) return;

      if (Math.random() < 0.1) {
        this.triggerRandomEvent();
      }
    }

    triggerRandomEvent() {
      const candidates = LIMINAL_EVENTS.filter((event) => event.id !== this.lastEventId);
      const event = candidates[Math.floor(Math.random() * candidates.length)];
      this.lastEventId = event.id;
      this.foundEvents[event.id] = true;
      this.activeMessage = event.text;
      this.messageTimer = 3.4;
      this.increaseInfection(event.infection || 1);
      this.applyEventEffect(event);
      this.game.save("autosave", { silent: true });
    }

    applyEventEffect(event) {
      if (event.effect === "redGlitch") this.game.effects.redGlitch = 0.12;
      if (event.effect === "cctv") this.game.effects.cctvShadow = 0.16;
      if (event.effect === "menuFace") this.menuFaceTimer = 0.08;
      if (event.effect === "shadowLag") this.distortion.breath = 2.0;
      if (event.effect === "stretch") this.distortion.stretch = 4.0;
      if (event.effect === "compress") this.distortion.compress = 3.0;
      if (event.effect === "fog") this.distortion.fog = 4.0;
      if (event.effect === "breath") this.distortion.breath = 4.0;
      if (event.effect === "bean") this.distortion.bean = 4.0;
      if (event.effect === "light") this.distortion.light = 3.0;
      if (event.effect === "laugh" && this.game.audio.playSmallLaugh) this.game.audio.playSmallLaugh();
      if (event.effect === "sound" && this.game.audio.playDistantFootstep) this.game.audio.playDistantFootstep();
      if (event.effect === "paper" && this.game.audio.playKeyboardTick) this.game.audio.playKeyboardTick();
    }

    increaseInfection(amount) {
      this.infection = clamp(this.infection + amount, 0, 100);
      this.applyPassiveMenuState();

      if (this.infection >= 40 && Math.random() < 0.18 && this.game.audio.playSmallLaugh) {
        this.game.audio.playSmallLaugh();
      }
    }

    recordInteraction(event) {
      const documentMap = {
        warehouse_note_01: "doc_warehouse_note_01",
        warehouse_note_02: "doc_warehouse_note_02",
        warehouse_note_03: "doc_warehouse_note_03",
        design_computer: "doc_design_research",
        ceo_computer: "doc_project_s",
        final_report: "doc_final_report",
        executive_drawer: "doc_second_floor_memo"
      };

      if (documentMap[event.id]) {
        this.game.flags[documentMap[event.id]] = true;
      }
    }

    recordSimkongQuizResult(wrongCount) {
      if (wrongCount === 0) {
        this.game.flags.simkong_quiz_perfect = true;
      }
    }

    recordFinalQuizResult(wrongCount) {
      if (wrongCount === 0) {
        this.game.flags.final_quiz_perfect = true;
      }
    }

    update(delta) {
      if (this.messageTimer > 0) this.messageTimer = Math.max(0, this.messageTimer - delta);
      if (this.menuFaceTimer > 0) this.menuFaceTimer = Math.max(0, this.menuFaceTimer - delta);
      Object.keys(this.distortion).forEach((key) => {
        this.distortion[key] = Math.max(0, this.distortion[key] - delta);
      });

      if (this.infection >= 90 && Math.random() < delta * 0.08) {
        this.activeMessage = "숨소리가 가까워진다.";
        this.messageTimer = 2.0;
      }

      this.shadowTrail.push({ x: this.game.player.x, y: this.game.player.y });
      if (this.shadowTrail.length > 24) {
        this.shadowTrail.shift();
      }
    }

    onMenuOpened() {
      if (this.infection >= 60) {
        document.body.classList.add("liminal-menu-infected");
      }
      if (Math.random() < 0.12 || this.infection >= 60) {
        this.menuFaceTimer = 0.08;
      }
    }

    applyPassiveMenuState() {
      document.body.classList.toggle("liminal-menu-infected", this.infection >= 60);
    }

    getFoundCount() {
      return Object.keys(this.foundEvents).length;
    }

    hasAllDocuments() {
      return REQUIRED_DOCUMENT_FLAGS.every((flag) => this.game.flags[flag]);
    }

    canReachPerfectTrueEnding() {
      return this.infection <= 20
        && this.hasAllDocuments()
        && this.game.flags.simkong_quiz_perfect
        && this.game.flags.final_quiz_perfect
        && this.getFoundCount() >= 20;
    }

    getBadEndingIds() {
      return BAD_ENDING_IDS.slice();
    }

    mutateDialogLine(text) {
      /*
        감염도 30 이상에서만 아주 낮은 확률로 대사 일부를 오염시킵니다.
        원본 dialog.json은 그대로 보존하고, 출력 직전에만 변형하므로 스토리
        작성자가 원문을 잃지 않습니다.
      */
      if (this.infection < 30 || !text || Math.random() > 0.18) {
        return text;
      }

      return text
        .replace("...", "....")
        .replace("콩", "콩?")
        .replace("문", "문?");
    }

    drawWorldMutations(ctx) {
      if (this.distortion.stretch > 0) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = "#0b0d0e";
        ctx.fillRect(0, 260, 1280, 80 + this.distortion.stretch * 12);
        ctx.globalAlpha = 1;
      }

      if (this.distortion.compress > 0) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 160 + this.distortion.compress * 18, 720);
        ctx.fillRect(1120 - this.distortion.compress * 18, 0, 180, 720);
        ctx.globalAlpha = 1;
      }

      if (this.infection >= 20 || this.distortion.bean > 0) {
        ctx.fillStyle = "#7d1111";
        const count = this.infection >= 20 ? 8 : 3;
        for (let i = 0; i < count; i += 1) {
          ctx.fillRect(170 + i * 103, 590 + (i % 3) * 12, 6, 6);
        }
      }

      if (this.infection >= 50) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#111";
        ctx.fillRect(1040, 310, 18, 36);
        ctx.fillRect(1064, 310, 18, 36);
        ctx.globalAlpha = 1;
      }
    }

    drawShadowLag(ctx) {
      if (this.infection < 70 && this.distortion.breath <= 0) return;
      const delayed = this.shadowTrail[0];
      if (!delayed) return;

      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#150000";
      ctx.fillRect(delayed.x - 18, delayed.y - 8, 36, 10);
      ctx.globalAlpha = 1;
    }

    drawOverlay(ctx) {
      if (this.infection >= 80 || this.distortion.red > 0) {
        ctx.globalAlpha = this.infection >= 80 ? 0.08 : 0.04;
        ctx.fillStyle = "#8f0000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.infection >= 10 || this.distortion.light > 0) {
        const pulse = Math.sin(performance.now() * 0.018) > 0.92 ? 0.16 : 0;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#fff4bd";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.messageTimer > 0 && this.activeMessage) {
        ctx.globalAlpha = clamp(this.messageTimer / 0.7, 0, 1);
        ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
        ctx.fillRect(360, 88, 560, 42);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "15px Courier New";
        ctx.textAlign = "center";
        ctx.fillText(this.activeMessage, 640, 115);
        ctx.globalAlpha = 1;
      }

      if (this.menuFaceTimer > 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#8f0000";
        ctx.fillRect(592, 250, 28, 18);
        ctx.fillRect(660, 250, 28, 18);
        ctx.fillRect(612, 322, 58, 8);
        ctx.globalAlpha = 1;
      }
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.OSSE.LiminalSystem = LiminalSystem;
  window.OSSE.LIMINAL_EVENTS = LIMINAL_EVENTS;
})();
