(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    Main game controller
    ---------------------------------------------------------------------------
    이 파일은 각 시스템을 묶는 중앙 컨트롤러입니다.

    담당 범위:
    - 캔버스 렌더링
    - 프롤로그 타임라인
    - 입력 처리
    - 플레이어 이동
    - 플래그/퀘스트 상태
    - 세이브/로드/자동저장
    - scene.js 이벤트 액션 라우팅
    - Web Audio API로 만드는 환경음

    스토리 텍스트는 dialog.json에, 맵 이벤트는 scene.js에 둡니다.
    game.js는 데이터의 의미를 직접 늘어놓기보다 "어떻게 실행할지"만 담당합니다.
  */

  const SAVE_KEY = "OSSEsecpae.save";
  const AUTOSAVE_KEY = "OSSEsecpae.autosave";
  const SAVE_VERSION = 11;
  const INTRO_SEEN_STORAGE_KEY = "osse_escape_intro_seen_v1";
  const PROP_OVERLAYS = {
    /*
      PROP_OVERLAYS
      ---------------------------------------------------------------------
      Pixel-art props are intentionally used as interaction feedback, item
      pickups, or clue states. They should not decorate every photo at all
      times, because the real office photos carry the liminal mood.

      Properties:
      - path: image path inside assets/props
      - x, y, width, height: canvas placement in the 1280x720 game frame
      - alpha: optional opacity
      - requiresFlag / blockedByFlag: optional progression conditions
      - requiresCount: optional [flagName, minimumValue] condition
    */
    guard_room: [
      { path: "assets/props/effects/white_glowing_monitor.png", x: 738, y: 274, width: 132, height: 92, alpha: 0.56, requiresFlag: "guard_computer_checked" },
      { path: "assets/props/effects/cctv_static_noise.png", x: 910, y: 214, width: 104, height: 74, alpha: 0.58, requiresFlag: "guard_cctv_checked" }
    ],
    guard_room_desk_zoom: [
      { path: "assets/props/items/security_access_card.png", x: 548, y: 484, width: 132, height: 82, alpha: 0.95, blockedByFlag: "got_security_access_card" },
      { path: "assets/props/effects/red_bean_pile.png", x: 456, y: 494, width: 86, height: 50, alpha: 0.82, requiresFlag: "chair_beans_03_seen" },
      { path: "assets/props/documents/cctv_record_sheet.png", x: 716, y: 424, width: 74, height: 96, alpha: 0.9, requiresFlag: "guard_cctv_checked" }
    ],
    warehouse_01: [
      { path: "assets/props/effects/red_warning_light.png", x: 1010, y: 214, width: 58, height: 74, alpha: 0.46, requiresFlag: "warehouse_emergency_light_on" },
      { path: "assets/props/documents/warehouse_inventory_list.png", x: 480, y: 456, width: 58, height: 82, alpha: 0.84, requiresFlag: "warehouse_wall_notice_read" },
      { path: "assets/props/documents/torn_research_memo.png", x: 700, y: 555, width: 58, height: 82, alpha: 0.84, requiresFlag: "warehouse_torn_paper_read" }
    ],
    warehouse_boxes_zoom: [
      { path: "assets/props/effects/taped_cardboard_box.png", x: 60, y: 438, width: 122, height: 92, alpha: 0.88, requiresCount: ["warehouse_open_parcel_count", 1] },
      { path: "assets/props/effects/rb13_marked_package_box.png", x: 428, y: 386, width: 136, height: 106, alpha: 0.92, requiresCount: ["warehouse_open_parcel_count", 2] },
      { path: "assets/props/effects/red_bean_pile.png", x: 548, y: 506, width: 112, height: 68, alpha: 0.88, requiresFlag: "warehouse_red_bean_visible", blockedByFlag: "warehouse_red_bean_touched" },
      { path: "assets/props/effects/red_bean_liquid_puddle.png", x: 548, y: 536, width: 142, height: 46, alpha: 0.48, requiresFlag: "warehouse_red_bean_touched" }
    ],
    warehouse_office_zoom: [
      { path: "assets/props/documents/ingredient_inspection_report.png", x: 436, y: 452, width: 66, height: 92, alpha: 0.92, requiresFlag: "warehouse_office_desk_read" },
      { path: "assets/props/documents/rb13_safety_guideline.png", x: 520, y: 456, width: 66, height: 92, alpha: 0.92, requiresFlag: "warehouse_whiteboard_read" },
      { path: "assets/props/effects/white_glowing_monitor.png", x: 360, y: 390, width: 120, height: 84, alpha: 0.52, requiresFlag: "warehouse_office_computer_read" }
    ],
    office_01: [
      { path: "assets/props/effects/red_bean_pile.png", x: 486, y: 556, width: 78, height: 46, alpha: 0.82, blockedByFlag: "office_beans_resolved" },
      { path: "assets/props/effects/red_bean_liquid_puddle.png", x: 482, y: 574, width: 124, height: 42, alpha: 0.54, requiresFlag: "office_bean_juice_seen" },
      { path: "assets/props/documents/printer_output_paper.png", x: 936, y: 378, width: 54, height: 76, alpha: 0.88, requiresFlag: "office_printer_checked" },
      { path: "assets/props/documents/internal_messenger_log.png", x: 696, y: 394, width: 54, height: 76, alpha: 0.82, requiresFlag: "office_monitor_checked" }
    ],
    meeting_room_01: [
      { path: "assets/props/documents/meeting_minutes.png", x: 566, y: 414, width: 76, height: 98, alpha: 0.92, requiresFlag: "meeting_room_table_read", blockedByFlag: "simkong_boss_started" },
      { path: "assets/props/effects/single_red_bean.png", x: 652, y: 458, width: 34, height: 26, alpha: 0.9, blockedByFlag: "simkong_boss_started" },
      { path: "assets/props/items/second_floor_auth_card.png", x: 608, y: 500, width: 104, height: 64, alpha: 0.94, requiresFlag: "simkong_defeated", blockedByFlag: "got_second_floor_auth_card" }
    ],
    design_studio: [
      { path: "assets/props/items/crowbar.png", x: 596, y: 516, width: 148, height: 48, alpha: 0.94, blockedByFlag: "got_crowbar" },
      { path: "assets/props/items/uv_filter.png", x: 834, y: 408, width: 56, height: 56, alpha: 0.82, requiresFlag: "design_computer_checked" },
      { path: "assets/props/documents/employee_training_material.png", x: 414, y: 438, width: 68, height: 76, alpha: 0.72, requiresFlag: "design_tablet_read" }
    ],
    ceo_door_front: [
      { path: "assets/props/items/crowbar.png", x: 564, y: 424, width: 148, height: 46, alpha: 0.9, requiresFlag: "got_crowbar", blockedByFlag: "ceo_door_event_done" }
    ],
    ceo_office: [
      { path: "assets/props/items/usb_drive.png", x: 626, y: 408, width: 70, height: 46, alpha: 0.96, blockedByFlag: "got_usb_drive" },
      { path: "assets/props/documents/usb_recovery_log_icon.png", x: 702, y: 400, width: 56, height: 56, alpha: 0.76, requiresFlag: "got_usb_drive", blockedByFlag: "project_s_read" }
    ]
  };
  const DEV_BRANCHES = [
    {
      id: "dev_intro",
      label: "인트로",
      mode: "introVideo",
      sceneId: "company_exterior",
      flags: {}
    },
    {
      id: "dev_exterior",
      label: "회사앞",
      sceneId: "company_exterior",
      flags: { prologue_seen_exterior: true }
    },
    {
      id: "dev_main_entrance",
      label: "정문확대",
      sceneId: "main_entrance_zoom",
      flags: { prologue_seen_exterior: true, front_door_checked: true }
    },
    {
      id: "dev_guard_room",
      label: "경비실",
      sceneId: "guard_room",
      flags: { prologue_seen_exterior: true, front_door_checked: true, entered_guard_room: true, guard_room_lock_scare_done: true }
    },
    {
      id: "dev_guard_desk",
      label: "경비책상",
      sceneId: "guard_room_desk_zoom",
      flags: { prologue_seen_exterior: true, entered_guard_room: true, guard_room_lock_scare_done: true }
    },
    {
      id: "dev_after_card",
      label: "카드후",
      sceneId: "guard_room",
      flags: { prologue_seen_exterior: true, entered_guard_room: true, guard_room_lock_scare_done: true, got_security_access_card: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_warehouse_door",
      label: "창고문",
      sceneId: "company_exterior",
      flags: { prologue_seen_exterior: true, front_door_checked: true, entered_guard_room: true, got_security_access_card: true, warehouse_emergency_light_on: true, reached_warehouse_door: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_warehouse",
      label: "창고",
      sceneId: "warehouse_01",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, warehouse_emergency_light_on: true, reached_warehouse_door: true, warehouse_door_opened: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_warehouse_inner",
      label: "창고안쪽",
      sceneId: "warehouse_boxes_zoom",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, warehouse_emergency_light_on: true, warehouse_door_opened: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_warehouse_office",
      label: "창고사무",
      sceneId: "warehouse_office_zoom",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, warehouse_emergency_light_on: true, warehouse_door_opened: true, warehouse_ceiling_bean_seen: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_office_lock",
      label: "사무실문",
      sceneId: "warehouse_lock_zoom",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, warehouse_emergency_light_on: true, warehouse_door_opened: true, warehouse_exit_scare_done: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_boxkeeper",
      label: "박스키퍼",
      sceneId: "boxkeeper_boss",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, warehouse_emergency_light_on: true, warehouse_door_opened: true, warehouse_lock_open: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_office",
      label: "1층사무실",
      sceneId: "office_01",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, warehouse_lock_open: true, office_keypad_enabled: true, office_door_open: true, office_entered: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_office_inner",
      label: "사무실안쪽",
      sceneId: "office_inner_01",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, warehouse_lock_open: true, office_keypad_enabled: true, office_door_open: true, office_entered: true, office_beans_resolved: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_executive",
      label: "회의실",
      sceneId: "meeting_room_01",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, office_door_open: true, office_entered: true, office_beans_resolved: true, office_inner_sound_heard: true, meeting_room_checked: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_simkong_start",
      label: "심대리 시작",
      sceneId: "meeting_room_01",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, office_door_open: true, office_entered: true, office_beans_resolved: true },
      items: ["security_access_card"],
      afterJump: "startSimkongBoss"
    },
    {
      id: "dev_simdaeri_minigame",
      label: "심대리 미니게임",
      sceneId: "meeting_room_01",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, office_door_open: true, office_entered: true, office_beans_resolved: true, simkong_boss_started: true },
      items: ["security_access_card"],
      afterJump: "startMinigame",
      minigameId: "simkong_office_work"
    },
    {
      id: "dev_simkong_clear",
      label: "심대리 클리어",
      sceneId: "meeting_room_01",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, office_door_open: true, office_entered: true, office_beans_resolved: true, simkong_boss_started: true, simkong_defeated: true, simdaeri_fled_to_second_floor: true },
      items: ["security_access_card"]
    },
    {
      id: "dev_second_floor",
      label: "2층복도",
      sceneId: "second_floor_corridor",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, simkong_defeated: true, got_second_floor_auth_card: true },
      items: ["security_access_card", "second_floor_auth_card"]
    },
    {
      id: "dev_design",
      label: "디자인실",
      sceneId: "design_studio",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, simkong_defeated: true, got_second_floor_auth_card: true },
      items: ["security_access_card", "second_floor_auth_card"]
    },
    {
      id: "dev_ceo_front",
      label: "대표실앞",
      sceneId: "ceo_door_front",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, got_second_floor_auth_card: true, got_crowbar: true, design_room_shifted: true },
      items: ["security_access_card", "second_floor_auth_card", "crowbar"]
    },
    {
      id: "dev_ceo",
      label: "대표실",
      sceneId: "ceo_office",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, got_second_floor_auth_card: true, got_crowbar: true, ceo_door_event_done: true },
      items: ["security_access_card", "second_floor_auth_card", "crowbar"]
    },
    {
      id: "dev_final",
      label: "최종전 준비",
      sceneId: "ceo_office",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, got_second_floor_auth_card: true, got_crowbar: true, ceo_door_event_done: true, project_s_read: true, got_usb_drive: true },
      items: ["security_access_card", "second_floor_auth_card", "crowbar", "usb_drive"]
    },
    {
      id: "dev_final_entry",
      label: "최종전 들어가기",
      sceneId: "ceo_office",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, got_second_floor_auth_card: true, got_crowbar: true, ceo_door_event_done: true, project_s_read: true, got_usb_drive: true },
      items: ["security_access_card", "second_floor_auth_card", "crowbar", "usb_drive"],
      afterJump: "startFinalBossIntro"
    },
    {
      id: "dev_simkong_minigame",
      label: "심콩 미니게임",
      sceneId: "ceo_office",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, got_second_floor_auth_card: true, got_crowbar: true, ceo_door_event_done: true, project_s_read: true, got_usb_drive: true, final_quiz_started: true, final_quiz_complete: true, final_battle_started: true },
      items: ["security_access_card", "second_floor_auth_card", "crowbar", "usb_drive"],
      afterJump: "startMinigame",
      minigameId: "red_root_clock_out"
    },
    {
      id: "dev_final_clear",
      label: "최종전 승리 후",
      sceneId: "ceo_office",
      flags: { prologue_seen_exterior: true, got_security_access_card: true, got_second_floor_auth_card: true, got_crowbar: true, ceo_door_event_done: true, project_s_read: true, got_usb_drive: true, final_quiz_started: true, final_quiz_complete: true, final_battle_started: true, final_boss_defeated: true },
      items: ["security_access_card", "second_floor_auth_card", "crowbar", "usb_drive"]
    }
  ];

  class UiBridge {
    constructor(game) {
      this.game = game;
      this.sceneName = document.getElementById("scene-name");
      this.questSummary = document.getElementById("quest-summary");
      this.menu = document.getElementById("menu-panel");
      this.modal = document.getElementById("modal-panel");
      this.modalTitle = document.getElementById("modal-title");
      this.modalBody = document.getElementById("modal-body");
      this.modalActions = document.getElementById("modal-actions");
      this.inventoryList = document.getElementById("inventory-list");
      this.flagList = document.getElementById("flag-list");
      this.questList = document.getElementById("quest-list");
      this.statsList = document.getElementById("stats-list");
      this.collectionList = document.getElementById("collection-list");
      this.menuSettings = document.getElementById("menu-settings");
      this.hud = document.getElementById("hud");
    }

    setSceneName(name) {
      this.sceneName.textContent = name;
    }

    setQuestSummary(text) {
      this.questSummary.textContent = text;
    }

    setHudVisible(isVisible) {
      this.hud.classList.toggle("hidden", !isVisible);
    }

    toggleMenu(forceOpen) {
      const shouldOpen = typeof forceOpen === "boolean"
        ? forceOpen
        : this.menu.classList.contains("hidden");
      this.menu.classList.toggle("hidden", !shouldOpen);
      if (shouldOpen) {
        this.game.keys.clear();
        this.game.pointClick.moveTarget = null;
        this.game.liminal.onMenuOpened();
        this.renderMenu();
      }
    }

    showModal({ title, body, actions }) {
      this.modalTitle.textContent = title;
      this.modalBody.textContent = body;
      this.modalActions.innerHTML = "";

      actions.forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = action.label;
        button.addEventListener("click", action.callback);
        this.modalActions.appendChild(button);
      });

      this.modal.classList.remove("hidden");
    }

    hideModal() {
      this.modal.classList.add("hidden");
      this.modalActions.innerHTML = "";
    }

    isBlocking() {
      return !this.modal.classList.contains("hidden")
        || !this.menu.classList.contains("hidden")
        || this.game.dialog.isOpen()
        || this.game.puzzle.isOpen()
        || this.game.quiz.isBossQuizOpen()
        || this.game.minigame?.isOpen()
        || this.game.isBossCutscene()
        || this.game.isFinalCutscene()
        || this.game.isFinalBattleBlocking()
        || Boolean(this.game.quickEvent)
        || this.game.mode === "mainMenu"
        || this.game.mode === "prologue"
        || this.game.mode === "transition"
        || this.game.mode === "ending";
    }

    renderMenu() {
      this.renderInventory();
      this.renderQuests();
      this.renderStats();
      this.renderCollections();
      this.game.settings.renderInto(this.menuSettings, () => this.renderMenu());
    }

    renderInventory() {
      const items = this.game.inventory.list();
      this.inventoryList.innerHTML = "";

      if (items.length === 0) {
        this.inventoryList.appendChild(createListItem("비어 있음"));
        return;
      }

      items.forEach((item) => {
        const listItem = createListItem(`${item.name || item.id} x${item.count}`);
        if (item.icon) {
          const icon = document.createElement("img");
          icon.className = "menu-inventory-icon";
          icon.src = item.icon;
          icon.alt = "";
          listItem.prepend(icon);
        }
        this.inventoryList.appendChild(listItem);
      });
    }

    renderFlags() {
      this.flagList.innerHTML = "";
      const flags = Object.entries(this.game.flags);

      if (flags.length === 0) {
        this.flagList.appendChild(createListItem("표시할 플래그가 없습니다."));
        return;
      }

      flags.forEach(([key, value]) => {
        this.flagList.appendChild(createListItem(`${key}: ${value}`));
      });
    }

    renderQuests() {
      this.questList.innerHTML = "";
      const currentObjective = this.getCurrentObjectiveText();

      this.setQuestSummary(currentObjective.hud);
      this.questList.appendChild(createListItem(currentObjective.menu));
    }

    /*
      getCurrentObjectiveText()
      -------------------------------------------------------------------------
      내부 진행 플래그는 그대로 유지하되, 플레이어에게는 다음 목적지를 너무 직접적으로
      알려주지 않습니다. 초반에는 "어디를 눌러야 하는지"보다 "무언가 이상하다"는 감각이
      먼저 오도록 짧은 단서 문장만 노출합니다.
    */
    getCurrentObjectiveText() {
      const flags = this.game.flags;
      if (flags.escape_sequence_started) return { hud: "기록: 퇴근", menu: "정문으로 돌아가 회사를 나가자." };
      if (flags.final_boss_defeated) return { hud: "기록: 마지막 보고서", menu: "마지막 보고서를 확인하고 퇴근하자." };
      if (flags.final_quiz_started) return { hud: "기록: 퇴근 승인", menu: "심콩의 질문과 마지막 업무를 해결하자." };
      if (flags.got_usb_drive) return { hud: "기록: PROJECT S", menu: "대표실 컴퓨터에서 PROJECT S를 읽자." };
      if (flags.got_crowbar && !flags.ceo_door_event_done) return { hud: "기록: 대표실", menu: "쇠지렛대로 대표실 문을 열어보자." };
      if (flags.simkong_defeated && !flags.got_second_floor_auth_card) return { hud: "기록: 남겨진 카드", menu: "회의실에 남겨진 2층 출입카드를 챙기자." };
      if (flags.office_entered && !flags.simkong_defeated) return { hud: "기록: 사무실 안쪽", menu: "사무실을 조사하고 회의실로 이동하자." };
      if (flags.boxkeeper_cleared && !flags.office_entered) return { hud: "기록: 사무실 문", menu: "출입카드와 비밀번호로 사무실 문을 열자." };
      if (flags.warehouse_lock_open && !flags.boxkeeper_cleared) return { hud: "기록: 물류 처리", menu: "박스키퍼의 검수·포장·배송 업무를 마치자." };
      if (this.game.flags.ceo_door_event_done) {
        return { hud: "기록: USB", menu: "대표실 안에서 USB와 컴퓨터를 확인하자." };
      }
      if (this.game.flags.got_second_floor_auth_card) {
        return { hud: "기록: 셔터", menu: "카드가 반응할 만한 곳을 찾아보자." };
      }
      if (this.game.flags.meeting_room_checked) {
        return { hud: "기록: 소리", menu: "방금 들린 소리가 마음에 걸린다." };
      }
      if (this.game.flags.warehouse_exit_scare_done) {
        return { hud: "기록: 숫자", menu: "창고 안의 숫자와 문구를 다시 떠올려보자." };
      }
      if (this.game.flags.warehouse_emergency_light_on) {
        return { hud: "기록: 붉은 불빛", menu: "어두운 복도 끝에 붉은 불빛이 켜졌다." };
      }
      if (this.game.flags.got_security_access_card) {
        return { hud: "기록: 카드", menu: "방금 얻은 카드가 어디에 쓰일지 확인해보자." };
      }
      if (this.game.flags.entered_guard_room) {
        return { hud: "기록: 경비실", menu: "경비실 안을 천천히 살펴보자." };
      }
      if (this.game.flags.front_door_checked) {
        return { hud: "기록: 잠긴 문", menu: "정문은 열리지 않는다. 다른 입구가 있을지도 모른다." };
      }
      if (this.game.mode === "prologue") {
        return { hud: "기록: 돌아온 밤", menu: "잠깐만 들렀다 가면 된다." };
      }
      return { hud: "기록: 회사 앞", menu: "불 꺼진 회사를 살펴보자." };
    }

    renderStats() {
      this.statsList.innerHTML = "";
      this.statsList.appendChild(createListItem(`플레이 시간: ${formatTime(this.game.playTime)}`));
      this.statsList.appendChild(createListItem(`문서: ${this.game.getDocumentCount()} / ${this.game.getDocumentTotal()}`));
      this.statsList.appendChild(createListItem(`숨은 이벤트: ${this.game.liminal.getFoundCount()} / ${window.OSSE.LIMINAL_EVENTS.length}`));
      this.statsList.appendChild(createListItem(`상태: ${this.game.liminal.infection >= 60 ? "불안정" : "조용함"}`));
    }

    renderCollections() {
      const endings = window.OSSE.ENDING_DATA || {};
      const bad = Object.keys(endings).filter((id) => id.startsWith("bad_end"));
      const trueEnds = Object.keys(endings).filter((id) => id.startsWith("true_end"));
      const gotBad = bad.filter((id) => this.game.flags[`ending_${id}`]).length;
      const gotTrue = trueEnds.filter((id) => this.game.flags[`ending_${id}`]).length;

      this.collectionList.innerHTML = "";
      this.collectionList.appendChild(createListItem(`엔딩 달성률: ${gotBad + gotTrue} / ${bad.length + trueEnds.length}`));
      this.collectionList.appendChild(createListItem(`배드엔딩: ${gotBad} / ${bad.length}`));
      this.collectionList.appendChild(createListItem(`진엔딩: ${gotTrue} / ${trueEnds.length}`));
    }
  }

  class AmbientAudio {
    constructor() {
      this.context = null;
      this.master = null;
      this.started = false;
      this.nextDripAt = 0;
      this.nextPipeAt = 18;
      this.nextChairDragAt = 9;
      this.nextFootstepAt = 13;
    }

    /*
      환경음은 BGM이 아닙니다.
      실제 오디오 파일 없이 Web Audio API로 다음 느낌만 아주 약하게 합성합니다.
      - 형광등의 낮은 전기음
      - 멀리서 도는 에어컨의 바람/기계음
      - 간헐적인 물방울 "툭"

      브라우저 자동재생 정책 때문에 첫 키 입력이나 마우스 클릭 후에만 시작합니다.
    */
    start() {
      if (this.started) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.045;
      this.master.connect(this.context.destination);

      this.createFluorescentHum();
      this.createAirConditionerNoise();
      this.createVentilatorPulse();
      this.started = true;
    }

    resume() {
      if (!this.context) {
        this.start();
      }
      if (this.context && this.context.state === "suspended") {
        this.context.resume();
      }
    }

    update(time) {
      if (!this.started || !this.context) return;

      if (time >= this.nextDripAt) {
        this.playDrip();
        this.nextDripAt = time + 2.8 + Math.random() * 4.6;
      }

      if (time >= this.nextPipeAt) {
        this.playMetalPipeDrop();
        this.nextPipeAt = time + 22 + Math.random() * 26;
      }
    }

    createFluorescentHum() {
      const hum = this.context.createOscillator();
      const humGain = this.context.createGain();
      const wobble = this.context.createOscillator();
      const wobbleGain = this.context.createGain();

      hum.type = "sine";
      hum.frequency.value = 58;
      humGain.gain.value = 0.18;

      wobble.type = "sine";
      wobble.frequency.value = 7.5;
      wobbleGain.gain.value = 2.5;
      wobble.connect(wobbleGain);
      wobbleGain.connect(hum.frequency);

      hum.connect(humGain);
      humGain.connect(this.master);
      hum.start();
      wobble.start();
    }

    createAirConditionerNoise() {
      const sampleCount = this.context.sampleRate * 2;
      const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
      const samples = buffer.getChannelData(0);

      for (let i = 0; i < sampleCount; i += 1) {
        samples[i] = (Math.random() * 2 - 1) * 0.35;
      }

      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();

      noise.buffer = buffer;
      noise.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = 420;
      gain.gain.value = 0.16;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      noise.start();
    }

    createVentilatorPulse() {
      const fan = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      fan.type = "sawtooth";
      fan.frequency.value = 31;
      gain.gain.value = 0.035;
      filter.type = "lowpass";
      filter.frequency.value = 180;

      fan.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      fan.start();
    }

    playDrip() {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(980, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.context.currentTime + 0.11);
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.7, this.context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + 0.2);
    }

    playMetalPipeDrop() {
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      osc.type = "square";
      osc.frequency.setValueAtTime(72, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(38, this.context.currentTime + 0.28);
      filter.type = "bandpass";
      filter.frequency.value = 260;
      filter.Q.value = 5;
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(1.0, this.context.currentTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.48);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + 0.5);
    }

    playPickup() {
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.context.currentTime + 0.08);
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.55, this.context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + 0.2);
    }

    playHarshNoise() {
      if (!this.context) return;

      const sampleCount = Math.floor(this.context.sampleRate * 0.5);
      const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
      const samples = buffer.getChannelData(0);

      for (let i = 0; i < sampleCount; i += 1) {
        samples[i] = Math.random() * 2 - 1;
      }

      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();

      noise.buffer = buffer;
      filter.type = "highpass";
      filter.frequency.value = 1600;
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.9, this.context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      noise.start();
      noise.stop(this.context.currentTime + 0.5);
    }

    playScratch() {
      if (!this.context) return;

      const sampleCount = Math.floor(this.context.sampleRate * 0.32);
      const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
      const samples = buffer.getChannelData(0);

      for (let i = 0; i < sampleCount; i += 1) {
        samples[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
      }

      const noise = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();

      noise.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = 780;
      filter.Q.value = 8;
      gain.gain.value = 0.32;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      noise.start();
    }

    playBeanPop() {
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(1200, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.context.currentTime + 0.05);
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.55, this.context.currentTime + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + 0.13);
    }

    playSmallLaugh() {
      if (!this.context) return;

      const gain = this.context.createGain();
      gain.gain.value = 0.09;
      gain.connect(this.master);

      [0, 0.08, 0.16].forEach((offset) => {
        const osc = this.context.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(640 - offset * 900, this.context.currentTime + offset);
        osc.connect(gain);
        osc.start(this.context.currentTime + offset);
        osc.stop(this.context.currentTime + offset + 0.055);
      });
    }

    playKeyboardTick() {
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "square";
      osc.frequency.value = 1800 + Math.random() * 300;
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, this.context.currentTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + 0.04);
    }

    playChairDrag() {
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, this.context.currentTime);
      osc.frequency.linearRampToValueAtTime(55, this.context.currentTime + 0.8);
      filter.type = "lowpass";
      filter.frequency.value = 520;
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, this.context.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.9);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + 0.92);
    }

    playDistantFootstep() {
      if (!this.context) return;

      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = "sine";
      osc.frequency.value = 95;
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, this.context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      osc.stop(this.context.currentTime + 0.18);
    }
  }

  class Game {
    constructor() {
      this.canvas = document.getElementById("game-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.introVideoPanel = document.getElementById("intro-video-panel");
      this.introVideo = document.getElementById("intro-video");
      this.introStatus = document.getElementById("intro-status");
      this.introPlayButton = document.getElementById("intro-play-button");
      this.introSkipButton = document.getElementById("intro-skip-button");
      this.keys = new Set();
      this.flags = {};
      this.mode = "boot";
      this.bootErrors = [];
      this.player = {
        x: 0,
        y: 0,
        width: 32,
        height: 44,
        speed: 220
      };

      this.ui = new UiBridge(this);
      this.audio = new AmbientAudio();
      this.inventory = new window.OSSE.InventorySystem();
      this.settings = new window.OSSE.SettingsSystem();
      this.dialog = new window.OSSE.DialogSystem(this);
      this.quiz = new window.OSSE.QuizSystem(this);
      this.battle = new window.OSSE.BattleSystem(this);
      this.minigame = new window.OSSE.MinigameSystem(this);
      this.ending = new window.OSSE.EndingSystem(this);
      this.puzzle = new window.OSSE.PuzzleSystem(this);
      this.liminal = new window.OSSE.LiminalSystem(this);
      this.scene = new window.OSSE.SceneSystem(this);
      this.pointClick = new window.OSSE.PointClickSceneManager(this);
      this.reliableInteractionLayer = this.createReliableInteractionLayer();
      this.quickEventImages = {};
      this.characterImages = {};
      this.devToolkit = document.getElementById("dev-toolkit");
      this.devToolkitActions = document.getElementById("dev-toolkit-actions");
      this.devToolkitStatus = document.getElementById("dev-toolkit-status");
      this.devToolkitToggle = document.getElementById("dev-toolkit-toggle");
      this.devToolkitCollapsed = false;
      this.isDevToolkitJumping = false;

      this.sessionTimers = new Set();
      this.lastTime = performance.now();
      this.totalTime = 0;
      this.autosaveTimer = 0;
      this.nextOfficeKeyAt = 0;
      this.playTime = 0;
      this.gamepadState = {
        previousButtons: new Set()
      };
      this.transition = null;
      this.effects = {
        whiteFlash: 0,
        blackout: 0,
        redGlitch: 0,
        cctvShadow: 0,
        lockScare: 0,
        heavyNoise: 0,
        warehouseLightBlink: 0,
        boxScare: 0
        ,
        officeLightsOut: 0,
        beanJuice: 0,
        footprintTrail: 0,
        heartbeat: 0,
        simkongExplosion: 0,
        shutterOpen: 0,
        secondFloorBlackout: 0,
        corridorShift: 0,
        designBlackout: 0,
        ceoDrop: 0,
        monitorEyes: 0,
        ceoLightsOut: 0,
        finalShake: 0,
        finalBlackout: 0,
        finalRootSpread: 0,
        endingWhiteout: 0
      };
      this.quickEvent = null;
      this.boxkeeperBoss = null;
      this.boss = null;
      this.finalBoss = null;
      if (this.minigame?.isOpen()) {
        this.minigame.cancel();
      }
      this.qte = null;
      this.prologue = {
        phase: "text",
        timer: 0,
        lineIndex: 0,
        lines: [
          "prologue_line_01",
          "prologue_line_02",
          "prologue_line_03",
          "prologue_line_04",
          "prologue_line_05"
        ]
      };
    }

    getQuickEventImage(path) {
      /*
        getQuickEventImage()
        ---------------------------------------------------------------------
        빠른 연타/QTE 이벤트는 scene.js의 정식 Scene이 아니기 때문에 별도 이미지 캐시를
        사용합니다. 현재는 창고 입구 문 연타 배경처럼 짧게 지나가는 연출에만 씁니다.
      */
      if (!this.quickEventImages[path]) {
        const image = new Image();
        image.src = path;
        this.quickEventImages[path] = image;
      }
      return this.quickEventImages[path];
    }

    getCharacterImage(path) {
      /*
        getCharacterImage()
        ---------------------------------------------------------------------
        보스와 NPC용 투명 PNG 스프라이트를 한 번만 불러와 재사용합니다.
        현재 캐릭터 이미지는 OSSEscape_files/png/ 폴더에 두고, 경로는
        battle.js의 BOSS_ASSETS 또는 data/boss_design.json에서 같은 문자열로
        관리합니다. 이미지가 아직 로딩되지 않았거나 교체 중이어도 게임이 멈추지
        않도록 draw 쪽에서 complete/naturalWidth를 다시 확인합니다.
      */
      if (!this.characterImages[path]) {
        const image = new Image();
        image.src = path;
        this.characterImages[path] = image;
      }
      return this.characterImages[path];
    }

    async init() {
      this.bindInput();
      this.bindUi();
      this.pointClick.bindDomEvents();

      await this.loadBootResources();
      this.showMainMenu();

      if (this.bootErrors.length > 0) {
        this.showBootWarning();
      }

      requestAnimationFrame((time) => this.loop(time));
    }

    /*
      loadBootResources()
      -------------------------------------------------------------------------
      시작 화면이 나오기 전에 필요한 JSON 기반 시스템을 순서대로 로드합니다.

      기존에는 await this.dialog.load() 중 하나라도 실패하면 init() 전체가 중단되어
      검은 화면/빈 화면 상태로 보일 수 있었습니다. 특히 file://로 index.html을 직접 열면
      브라우저 보안 정책 때문에 JSON fetch가 실패할 수 있으므로, 각 리소스를 독립적으로
      기록하고 가능한 시스템은 fallback으로 계속 진행합니다.

      순서를 유지하는 이유:
      - puzzle.load()가 window.OSSE.OSSE_DATA를 세팅합니다.
      - quiz.buildQuestion()은 보스 퀴즈에서 window.OSSE.OSSE_DATA를 참조합니다.
      - dialog는 독립적이지만, 부팅 경고보다 먼저 준비되어야 이후 대화 시스템이 안전합니다.
    */
    async loadBootResources() {
      const loaders = [
        { name: "dialog.json", load: () => this.dialog.load() },
        { name: "data/osse_data.json", load: () => this.puzzle.load() },
        { name: "quiz.json", load: () => this.quiz.load() }
      ];

      for (const loader of loaders) {
        try {
          await loader.load();
        } catch (error) {
          this.bootErrors.push({ name: loader.name, error });
          console.warn(`Boot resource failed: ${loader.name}`, error);
        }
      }
    }

    /*
      showBootWarning()
      -------------------------------------------------------------------------
      부팅은 살리되, 어떤 리소스가 실패했는지는 플레이어/개발자가 바로 알 수 있게 합니다.
      이 안내는 게임 진행을 막지 않는 일회성 모달이며, "시작부터 안 되는" 상태를 피하는
      마지막 안전망입니다.
    */
    showBootWarning() {
      document.getElementById("new-game-button").disabled = true;
      document.getElementById("continue-button").disabled = true;
      this.ui.showModal({
        title: "게임 데이터를 불러오지 못했습니다",
        body: `일부 데이터를 불러오지 못했습니다: ${this.bootErrors.map((item) => item.name).join(", ")}`,
        actions: [
          {
            label: "다시 불러오기",
            callback: () => window.location.reload()
          }
        ]
      });
    }

    /*
      createReliableInteractionLayer()
      -------------------------------------------------------------------------
      QA 복구용 핵심 입력 레이어입니다.

      pointclick.js의 캔버스 좌표/가상 Hotspot 로직과 별개로, 현재 scene.js 이벤트를
      실제 DOM 버튼으로 올립니다. 플레이어가 버튼 영역을 누르면 이벤트 매니저를 통해
      기존 handleSceneEvent()와 handleAction()이 직접 실행되므로, "클릭했는데 대화창이
      안 뜨는" 상태를 가장 단순한 경로에서 차단합니다.
    */
    createReliableInteractionLayer() {
      const screen = document.getElementById("game-screen");
      if (!screen) return null;

      const layer = document.createElement("div");
      layer.id = "reliable-interaction-layer";
      layer.className = "reliable-interaction-layer hidden";
      layer.setAttribute("aria-label", "상호작용 영역");
      screen.appendChild(layer);
      return layer;
    }

    /*
      syncReliableInteractionLayer()
      -------------------------------------------------------------------------
      현재 Scene에서 클릭 가능한 이벤트를 매 프레임 실제 버튼으로 동기화합니다.
      대화/메뉴/모달/퍼즐/퀴즈가 열려 있을 때는 배경 상호작용을 숨겨 중복 입력을 막습니다.
    */
    syncReliableInteractionLayer() {
      if (!this.reliableInteractionLayer) return;

      if (!this.shouldShowReliableInteractionLayer()) {
        this.reliableSignature = null;
        this.reliableInteractionLayer.innerHTML = "";
        this.reliableInteractionLayer.classList.add("hidden");
        return;
      }

      const events = this.getReliableVisibleEvents();
      const signature = this.scene.current.id + JSON.stringify(events);
      if (signature === this.reliableSignature) return;
      this.reliableSignature = signature;
      this.reliableInteractionLayer.innerHTML = "";
      this.reliableInteractionLayer.classList.toggle("hidden", events.length === 0);

      events.forEach((event) => {
        const rect = this.getReliableInteractionRect(event);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `reliable-hotspot ${this.getSceneEventMarkerClass(event)}`;
        button.dataset.eventId = event.id;
        button.setAttribute("aria-label", event.name || "조사");
        button.title = event.name || "조사";
        button.style.left = `${(rect.x / 1280) * 100}%`;
        button.style.top = `${(rect.y / 720) * 100}%`;
        button.style.width = `${(rect.width / 1280) * 100}%`;
        button.style.height = `${(rect.height / 720) * 100}%`;

        const dot = document.createElement("span");
        dot.className = "reliable-hotspot__dot";
        this.positionReliableHotspotDot(dot, event, rect);
        button.appendChild(dot);

        const run = (pointerEvent) => {
          pointerEvent.preventDefault();
          pointerEvent.stopPropagation();
          this.runReliableInteraction(event);
        };

        button.addEventListener("click", run);
        this.reliableInteractionLayer.appendChild(button);
      });
    }

    positionReliableHotspotDot(dot, event, rect) {
      /*
        positionReliableHotspotDot()
        ---------------------------------------------------------------------
        실제 클릭 영역(rect)은 넓게 유지하고, 사용자에게 보이는 표시점은
        scene.js 이벤트의 markerX/markerY 좌표에 고정합니다.

        marker가 없는 기존 이벤트는 기존 방식대로 영역 중앙에 표시합니다.
      */
      const markerX = event.markerX ?? (event.x + event.width / 2);
      const markerY = event.markerY ?? (event.y + event.height / 2);
      const relativeX = ((markerX - rect.x) / rect.width) * 100;
      const relativeY = ((markerY - rect.y) / rect.height) * 100;
      dot.style.left = `${clamp(relativeX, 0, 100)}%`;
      dot.style.top = `${clamp(relativeY, 0, 100)}%`;
    }

    getReliableVisibleEvents() {
      /*
        getReliableVisibleEvents()
        ---------------------------------------------------------------------
        같은 사진 오브젝트 위에 여러 이벤트가 겹치면 플레이어는 어떤 것을 누르는지
        예측하기 어렵습니다. 이 함수는 활성 이벤트를 우선순위로 정리한 뒤,
        이미 표시된 이벤트와 크게 겹치는 이벤트를 숨겨 클릭 충돌을 줄입니다.

        이벤트 자체는 삭제하지 않습니다. 좌표를 세분화하거나 다른 Scene으로 분리하면
        언제든 다시 표시될 수 있습니다.
      */
      const sourceEvents = this.scene.current?.events || [];
      const candidates = sourceEvents
        .filter((event) => this.isSceneEventActive(event))
        .map((event) => ({
          event,
          rect: this.getReliableInteractionRect(event),
          priority: this.getSceneEventPriority(event)
        }))
        .sort((a, b) => b.priority - a.priority);

      const visible = [];
      candidates.forEach((candidate) => {
        const overlaps = visible.some((selected) => this.getRectOverlapRatio(candidate.rect, selected.rect) > 0.58);
        if (!overlaps) visible.push(candidate);
      });

      return visible
        .sort((a, b) => sourceEvents.indexOf(a.event) - sourceEvents.indexOf(b.event))
        .map((item) => item.event);
    }

    getSceneEventPriority(event) {
      if (event.priority !== undefined) return event.priority;
      if (event.kind === "back") return 99;
      if (event.action?.type === "start_code_puzzle") return 96;
      if (event.action?.type === "change_scene") return 92;
      if (event.kind === "item") return 88;
      if (event.kind === "door") return 78;
      return 50;
    }

    getRectOverlapRatio(a, b) {
      const left = Math.max(a.x, b.x);
      const top = Math.max(a.y, b.y);
      const right = Math.min(a.x + a.width, b.x + b.width);
      const bottom = Math.min(a.y + a.height, b.y + b.height);
      const width = Math.max(0, right - left);
      const height = Math.max(0, bottom - top);
      const overlapArea = width * height;
      const smallerArea = Math.min(a.width * a.height, b.width * b.height);
      return smallerArea > 0 ? overlapArea / smallerArea : 0;
    }

    getSceneEventMarkerClass(event) {
      if (event.kind === "back") return "hotspot-back";
      if (event.kind === "item") return "hotspot-item";
      if (event.action?.type === "change_scene" || event.kind === "door") return "hotspot-nav";
      return "hotspot-inspect";
    }

    shouldShowReliableInteractionLayer() {
      const isModalOpen = this.ui.modal && !this.ui.modal.classList.contains("hidden");
      const isMenuOpen = this.ui.menu && !this.ui.menu.classList.contains("hidden");

      return this.mode === "gameplay"
        && !this.dialog.isOpen()
        && !this.puzzle.isOpen()
        && !this.quiz.isBossQuizOpen()
        && !isModalOpen
        && !isMenuOpen
        && !this.quickEvent
        && !this.minigame?.isOpen?.()
        && !this.isBossCutscene()
        && !this.isFinalBattleActive()
        && !this.isFinalCutscene()
        && !this.isFinalBattleBlocking();
    }

    isSceneEventActive(event) {
      if (event.disabledUntilPhoto) return false;
      if (event.onceFlag && this.flags[event.onceFlag]) return false;
      if (event.requiresFlag && !this.flags[event.requiresFlag]) return false;
      if (event.blockedByFlag && this.flags[event.blockedByFlag]) return false;
      if (event.blockedWhileFlag && this.flags[event.blockedWhileFlag] && !this.flags[event.unblockedByFlag]) return false;
      return true;
    }

    getReliableInteractionRect(event) {
      /*
        Point & Click 전용 입력 박스
        ---------------------------------------------------------------------
        사진 위의 실제 오브젝트 범위를 그대로 버튼으로 쓰면 큰 책상/상자/문 영역이 서로
        겹치면서 사용자가 보이는 점과 다른 오브젝트를 누르는 문제가 생깁니다.

        그래서 실제 클릭 판정은 markerX/markerY 주변의 일정한 크기 박스로 통일합니다.
        - 사용자는 화면에 보이는 표시를 누르면 됩니다.
        - 오브젝트 데이터의 x/y/width/height는 사진 분석용 원본 범위로 남겨둡니다.
        - 예외 크기를 허용하지 않아, 모든 포인트가 같은 클릭 감각을 유지합니다.
      */
      const unifiedSize = 96;
      const width = unifiedSize;
      const height = unifiedSize;
      const centerX = event.markerX ?? (event.x + event.width / 2);
      const centerY = event.markerY ?? (event.y + event.height / 2);
      return {
        x: clamp(centerX - width / 2, 0, 1280 - width),
        y: clamp(centerY - height / 2, 0, 720 - height),
        width,
        height
      };
    }

    runReliableInteraction(event) {
      if (!event) return;
      this.audio.resume();
      this.audio.playKeyboardTick();
      this.scene.triggerEvent(event);
      this.pointClick.resetTransientState();
      this.pointClick.renderInventory();
      this.syncReliableInteractionLayer();
    }

    resetTransientState() {
      this.sessionTimers.forEach((timer) => window.clearTimeout(timer));
      this.sessionTimers.clear();
      this.keys.clear();
      this.dialog.close();
      this.puzzle.close();
      this.quiz.activeBossQuiz = null;
      this.minigame.cancel();
      this.ui.hideModal();
      this.ui.toggleMenu(false);
      this.liminal.reset();
      this.settings.waitingForAction = "";
      this.introVideo.pause();
      this.introVideoPanel.classList.add("hidden");
      this.transition = this.quickEvent = this.boxkeeperBoss = this.boss = this.finalBoss = this.qte = null;
      this.ending.currentId = null;
      this.autosaveTimer = 0;
      this.pointClick.resetTransientState({ clearItem: true });
      Object.keys(this.effects).forEach((key) => { this.effects[key] = 0; });
    }

    scheduleSession(callback, delay) {
      const timer = window.setTimeout(() => {
        this.sessionTimers.delete(timer);
        callback();
      }, delay);
      this.sessionTimers.add(timer);
    }

    isPaused() {
      return document.hidden || !this.ui.menu.classList.contains("hidden")
        || !this.ui.modal.classList.contains("hidden")
        || !document.getElementById("settings-panel").classList.contains("hidden");
    }

    showMainMenu() {
      this.resetTransientState();
      document.getElementById("new-game-button").disabled = this.bootErrors.length > 0;
      document.getElementById("continue-button").disabled = this.bootErrors.length > 0;
      this.mode = "mainMenu";
      this.scene.load("company_exterior");
      this.ui.setHudVisible(false);
      document.getElementById("main-menu").classList.remove("hidden");
      this.settings.applyDocumentState();
    }

    restartNewGame() {
      this.resetTransientState();
      this.devSession = false;
      this.flags = {};
      this.inventory.hydrate([]);
      this.playTime = 0;
      this.mode = "introVideo";
      this.prologue.phase = "text";
      this.prologue.timer = 0;
      this.prologue.lineIndex = 0;
      this.transition = null;
      this.quickEvent = null;
      this.boss = null;
      this.finalBoss = null;
      this.qte = null;
      this.liminal.reset();
      Object.keys(this.effects).forEach((key) => {
        this.effects[key] = 0;
      });
      this.scene.load("company_exterior");
      document.getElementById("main-menu").classList.add("hidden");
      document.getElementById("settings-panel").classList.add("hidden");
      this.pointClick.resetTransientState({ clearItem: true });
      this.ui.setHudVisible(false);
      this.ui.renderQuests();
      this.startIntroVideo();
    }

    restartFromEndingCheckpoint(checkpointId) {
      this.resetTransientState();
      /*
        restartFromEndingCheckpoint()
        ---------------------------------------------------------------------
        Some bad endings happen in the middle of the current route. Restarting
        the entire game would make testing and replaying too slow, so those
        endings can send the player back to a curated checkpoint while keeping
        the ending collection flag that was just recorded by EndingSystem.show().
      */
      const endingFlags = Object.fromEntries(
        Object.entries(this.flags).filter(([key]) => key.startsWith("ending_"))
      );

      if (checkpointId === "first_floor_entrance") {
        this.flags = {
          ...endingFlags,
          prologue_seen_exterior: true,
          got_security_access_card: true,
          warehouse_emergency_light_on: true,
          warehouse_door_opened: true,
          warehouse_lock_open: true,
          boxkeeper_cleared: true,
          office_keypad_enabled: true,
          office_door_open: true,
          office_entered: true,
          office_beans_resolved: true
        };
        this.inventory.hydrate([
          ["security_access_card", 1]
        ]);
        this.mode = "gameplay";
        this.transition = null;
        this.quickEvent = null;
        this.boxkeeperBoss = null;
        this.boss = null;
        this.finalBoss = null;
        this.qte = null;
        Object.keys(this.effects).forEach((key) => {
          this.effects[key] = 0;
        });
        this.scene.load("office_01");
        this.player.x = 640;
        this.player.y = 610;
        this.pointClick.resetTransientState({ clearItem: true });
        this.pointClick.renderInventory();
        this.ui.setHudVisible(true);
        this.ui.renderQuests();
        this.syncPointClickUi();
        this.syncReliableInteractionLayer();
        document.getElementById("main-menu").classList.add("hidden");
        document.getElementById("settings-panel").classList.add("hidden");
        this.save("autosave", { silent: true });
        return;
      }

      if (checkpointId === "second_floor_entrance") {
        this.flags = {
          ...endingFlags,
          prologue_seen_exterior: true,
          got_security_access_card: true,
          warehouse_emergency_light_on: true,
          warehouse_door_opened: true,
          warehouse_lock_open: true,
          boxkeeper_cleared: true,
          office_keypad_enabled: true,
          office_door_open: true,
          office_entered: true,
          office_beans_resolved: true,
          simkong_boss_started: true,
          simkong_defeated: true,
          simdaeri_fled_to_second_floor: true,
          got_second_floor_auth_card: true,
          second_floor_shutter_opened: true,
          got_crowbar: true,
          design_room_shifted: true,
          ceo_door_event_done: true,
          got_usb_drive: true,
          project_s_read: true,
          doc_project_s: true
        };
        this.inventory.hydrate([
          ["security_access_card", 1],
          ["second_floor_auth_card", 1],
          ["crowbar", 1],
          ["usb_drive", 1]
        ]);
        this.mode = "gameplay";
        this.transition = null;
        this.quickEvent = null;
        this.boxkeeperBoss = null;
        this.boss = null;
        this.finalBoss = null;
        this.qte = null;
        Object.keys(this.effects).forEach((key) => {
          this.effects[key] = 0;
        });
        this.scene.load("second_floor_corridor");
        this.player.x = 140;
        this.player.y = 590;
        this.pointClick.resetTransientState({ clearItem: true });
        this.pointClick.renderInventory();
        this.ui.setHudVisible(true);
        this.ui.renderQuests();
        this.syncPointClickUi();
        this.syncReliableInteractionLayer();
        document.getElementById("main-menu").classList.add("hidden");
        document.getElementById("settings-panel").classList.add("hidden");
        this.save("autosave", { silent: true });
        return;
      }

      this.restartNewGame();
    }

    startIntroVideo() {
      if (!this.introVideoPanel || !this.introVideo) {
        this.beginPrologueAfterIntro();
        return;
      }

      if (this.hasSeenIntroVideo()) {
        this.beginPrologueAfterIntro({ markIntroSeen: false });
        return;
      }

      this.mode = "introVideo";
      this.introVideoPanel.classList.remove("hidden");
      this.introVideoPanel.classList.remove("intro-video--waiting");
      this.introVideoPanel.classList.remove("intro-video--playing");
      this.introPlayButton?.classList.add("hidden");
      this.setIntroStatus("인트로 영상 불러오는 중... 꺼진 거 아니에요.");
      this.introVideo.currentTime = 0;
      this.introVideo.controls = false;

      const playPromise = this.playIntroVideo();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          this.showIntroPlayPrompt();
        });
      }
    }

    playIntroVideo() {
      if (!this.introVideo) return null;
      this.introPlayButton?.classList.add("hidden");
      this.introVideoPanel?.classList.remove("intro-video--waiting");
      this.introVideoPanel?.classList.add("intro-video--playing");
      this.setIntroStatus("인트로 재생 중... 클릭하면 바로 시작합니다.");
      return this.introVideo.play();
    }

    showIntroPlayPrompt() {
      if (this.mode !== "introVideo") return;
      this.introVideoPanel?.classList.add("intro-video--waiting");
      this.introVideoPanel?.classList.remove("intro-video--playing");
      this.setIntroStatus("브라우저가 자동재생을 막았어요. 버튼을 누르면 인트로가 시작됩니다.");
      this.introPlayButton?.classList.remove("hidden");
    }

    setIntroStatus(message) {
      if (this.introStatus) {
        this.introStatus.textContent = message;
      }
    }

    hasSeenIntroVideo() {
      try {
        return localStorage.getItem(INTRO_SEEN_STORAGE_KEY) === "true";
      } catch (error) {
        return false;
      }
    }

    markIntroVideoSeen() {
      try {
        localStorage.setItem(INTRO_SEEN_STORAGE_KEY, "true");
      } catch (error) {
        // 저장소가 막힌 환경에서는 이번 세션에서만 넘어갑니다.
      }
    }

    handleIntroVideoPointer() {
      if (this.mode !== "introVideo" || !this.introVideo) return;
      if (this.introVideo.paused || this.introVideo.readyState < 2) {
        const playPromise = this.playIntroVideo();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => this.showIntroPlayPrompt());
        }
        return;
      }
      this.beginPrologueAfterIntro();
    }

    beginPrologueAfterIntro(options = {}) {
      if (options.markIntroSeen !== false) {
        this.markIntroVideoSeen();
      }
      if (this.introVideo) {
        this.introVideo.pause();
        this.introVideo.currentTime = 0;
      }
      if (this.introVideoPanel) {
        this.introVideoPanel.classList.add("hidden");
        this.introVideoPanel.classList.remove("intro-video--waiting");
        this.introVideoPanel.classList.remove("intro-video--playing");
      }
      this.introPlayButton?.classList.add("hidden");

      this.mode = "prologue";
      this.prologue.phase = "text";
      this.prologue.timer = 0;
      this.prologue.lineIndex = 0;
      this.save("autosave", { silent: true });
    }

    bindInput() {
      window.addEventListener("keydown", (event) => {
        this.audio.resume();

        if (this.settings.waitingForAction) {
          event.preventDefault();
          this.settings.setBinding(this.settings.waitingForAction, event.key);
          this.renderSettingsPanels();
          return;
        }

        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
          event.preventDefault();
        }

        if (this.settings.isAction("menu", event.key)) {
          if (event.repeat) return;
          if (this.mode === "introVideo") {
            this.beginPrologueAfterIntro();
            return;
          }
          const settingsPanel = document.getElementById("settings-panel");
          if (this.minigame?.isOpen()) {
            this.minigame.cancel();
          } else if (this.pointClick.focusEvent) {
            this.pointClick.goBack();
          } else if (!settingsPanel.classList.contains("hidden")) {
            settingsPanel.classList.add("hidden");
          } else if (this.mode !== "mainMenu" && this.mode !== "prologue" && this.mode !== "transition") {
            this.ui.toggleMenu();
          }
          return;
        }

        if (this.isPaused()) return;
        if (event.repeat && (this.settings.isAction("interact", event.key) || this.qte)) return;
        if (event.target?.closest?.("button, input, select, textarea") && ["Enter", " "].includes(event.key)) return;
        if (this.settings.isAction("interact", event.key)) {
          if (this.mode === "introVideo") {
            this.beginPrologueAfterIntro();
          } else if (this.mode === "prologue") {
            this.advancePrologueByClick();
          } else if (this.quickEvent) {
            this.handleQuickEventInput();
          } else if (this.qte) {
            this.handleQteInput(event.key);
          } else if (this.finalBoss?.phase === "battle_phase3") {
            this.finalBoss.timer = Math.max(0, this.finalBoss.timer - 0.9);
            this.finalBoss.replicateProgress = (this.finalBoss.replicateProgress || 0) + 1;
            if (this.finalBoss.replicateProgress >= 8) {
              this.startFinalQte();
            }
          } else if (this.dialog.isOpen()) {
            this.dialog.advance();
          } else if (!this.pointClick.enabled && !this.ui.isBlocking()) {
            this.scene.interact();
          }
          return;
        }

        if (this.quiz.isBossQuizOpen()) {
          this.handleBossQuizKey(event);
          return;
        }

        if (this.qte) {
          this.handleQteInput(event.key);
          return;
        }

        if (this.puzzle.isOpen()) {
          this.handlePuzzleKey(event);
          return;
        }

        this.keys.add(normalizeInputKey(event.key));
      });

      window.addEventListener("keyup", (event) => {
        this.keys.delete(normalizeInputKey(event.key));
      });

      window.addEventListener("blur", () => this.keys.clear());
      document.addEventListener("visibilitychange", () => this.keys.clear());
      window.addEventListener("pointerdown", () => this.audio.resume(), { once: false });
    }

    bindUi() {
      document.getElementById("new-game-button").addEventListener("click", () => this.restartNewGame());
      document.getElementById("continue-button").addEventListener("click", () => this.load("latest"));
      document.getElementById("settings-button").addEventListener("click", () => this.openSettingsPanel());
      if (this.introVideo) {
        this.introVideo.addEventListener("ended", () => this.beginPrologueAfterIntro());
        this.introVideo.addEventListener("error", () => this.showIntroPlayPrompt());
        this.introVideo.addEventListener("click", () => this.handleIntroVideoPointer());
        this.introVideo.addEventListener("loadstart", () => this.setIntroStatus("인트로 영상 불러오는 중... 꺼진 거 아니에요."));
        this.introVideo.addEventListener("waiting", () => this.setIntroStatus("영상 버퍼링 중... 잠깐만 기다려 주세요."));
        this.introVideo.addEventListener("canplay", () => this.setIntroStatus("인트로 준비 완료. 곧 재생됩니다."));
        this.introVideo.addEventListener("playing", () => {
          this.introVideoPanel?.classList.add("intro-video--playing");
          this.setIntroStatus("인트로 재생 중... 클릭하면 바로 시작합니다.");
        });
      }
      if (this.introPlayButton) {
        this.introPlayButton.addEventListener("click", (event) => {
          event.stopPropagation();
          this.handleIntroVideoPointer();
        });
      }
      if (this.introSkipButton) {
        this.introSkipButton.addEventListener("click", (event) => {
          event.stopPropagation();
          this.beginPrologueAfterIntro();
        });
      }
      document.getElementById("exit-button").addEventListener("click", () => {
        this.ui.showModal({
          title: "나가기",
          body: "브라우저 탭을 닫으면 게임이 종료됩니다.",
          actions: [{ label: "확인", callback: () => this.ui.hideModal() }]
        });
      });
      document.getElementById("settings-close").addEventListener("click", () => {
        document.getElementById("settings-panel").classList.add("hidden");
      });
      document.getElementById("menu-close").addEventListener("click", () => this.ui.toggleMenu(false));
      document.getElementById("save-button").addEventListener("click", () => this.save("manual"));
      document.getElementById("load-button").addEventListener("click", () => this.load("manual"));
      document.getElementById("autosave-button").addEventListener("click", () => this.save("autosave"));
      document.getElementById("restart-button").addEventListener("click", () => {
        this.ui.toggleMenu(false);
        this.restartNewGame();
      });
      document.getElementById("game-menu-button").addEventListener("click", () => {
        if (this.mode === "gameplay") this.ui.toggleMenu();
      });
      document.getElementById("game-action-button").addEventListener("click", () => {
        if (this.isPaused()) return;
        if (this.qte) this.handleQteInput(this.qte.sequence[this.qte.index] === "SPACE" ? " " : this.qte.sequence[this.qte.index]);
        else if (this.finalBoss?.phase === "battle_phase3") {
          this.finalBoss.replicateProgress = (this.finalBoss.replicateProgress || 0) + 1;
          if (this.finalBoss.replicateProgress >= 8) this.startFinalQte();
        } else this.handleVirtualInteract();
      });
      const movePointer = (event) => {
        if (this.isPaused() || !this.shouldDrawPlayerDuringActionMode() || !event.buttons) return;
        const rect = this.canvas.getBoundingClientRect();
        this.pointClick.moveTarget = { x: (event.clientX - rect.left) * 1280 / rect.width, y: (event.clientY - rect.top) * 720 / rect.height };
      };
      this.canvas.addEventListener("pointerdown", (event) => {
        if (this.shouldDrawPlayerDuringActionMode()) this.canvas.setPointerCapture(event.pointerId);
        movePointer(event);
      });
      this.canvas.addEventListener("pointermove", movePointer);
      this.initDevToolkit();
    }

    initDevToolkit() {
      /*
        initDevToolkit()
        ---------------------------------------------------------------------
        개발 중 QA를 빠르게 하기 위한 임시 이동 툴킷입니다.

        중요한 원칙:
        - 정식 게임 플레이 시스템이 아니므로 저장하지 않습니다.
        - changeScene()은 autosave를 실행하므로 사용하지 않습니다.
        - 필요한 플래그와 아이템만 현재 세션에 임시로 세팅합니다.
        - 기존 이벤트/퍼즐/엔딩 데이터는 삭제하거나 우회하지 않고, 특정 지점으로
          "테스트 시작 위치"를 맞추는 용도로만 사용합니다.
      */
      if (!this.devToolkit || !this.devToolkitActions) return;

      const enabled = new URLSearchParams(window.location.search).get("dev") === "1";
      this.devToolkit.classList.toggle("hidden", !enabled);
      if (!enabled) return;
      this.devToolkitActions.innerHTML = "";
      DEV_BRANCHES.forEach((branch) => {
        const button = document.createElement("button");
        button.type = "button";
        button.title = `${branch.label} 지점으로 임시 이동합니다. 저장은 하지 않습니다.`;
        const label = document.createElement("span");
        label.className = "dev-toolkit__label";
        label.textContent = branch.label;
        const scene = document.createElement("span");
        scene.className = "dev-toolkit__scene";
        scene.textContent = branch.mode === "introVideo" ? "intro video" : branch.sceneId;
        button.append(label, scene);
        button.addEventListener("click", () => this.jumpToDevBranch(branch.id));
        this.devToolkitActions.appendChild(button);
      });

      if (this.devToolkitToggle) {
        this.devToolkitToggle.addEventListener("click", () => {
          this.devToolkitCollapsed = !this.devToolkitCollapsed;
          this.devToolkit.classList.toggle("is-collapsed", this.devToolkitCollapsed);
          this.devToolkitToggle.textContent = this.devToolkitCollapsed ? "열기" : "접기";
        });
      }
    }

    jumpToDevBranch(branchId) {
      /*
        jumpToDevBranch()
        ---------------------------------------------------------------------
        개발 툴킷 버튼에서 호출하는 임시 분기 이동 함수입니다.
        자동 저장을 피하기 위해 scene.load()를 직접 사용하고, changeScene()은
        호출하지 않습니다. 따라서 실제 플레이 기록에는 남지 않습니다.
      */
      const branch = DEV_BRANCHES.find((item) => item.id === branchId);
      if (!branch) return;
      this.resetTransientState();
      this.devSession = true;
      this.flags = {};
      this.inventory.hydrate([]);

      if (this.introVideo) {
        this.introVideo.pause();
        this.introVideo.currentTime = 0;
      }
      if (this.introVideoPanel) {
        this.introVideoPanel.classList.add("hidden");
      }

      document.getElementById("main-menu").classList.add("hidden");
      document.getElementById("settings-panel").classList.add("hidden");
      this.ui.toggleMenu(false);
      this.ui.hideModal();
      this.dialog.close();

      this.transition = null;
      this.quickEvent = null;
      this.qte = null;
      this.boxkeeperBoss = null;
      this.boss = null;
      this.finalBoss = null;
      Object.keys(this.effects).forEach((key) => {
        this.effects[key] = 0;
      });

      if (branch.mode === "introVideo") {
        this.flags = {};
        this.inventory.hydrate([]);
        this.pointClick.resetTransientState({ clearItem: true });
        this.scene.load(branch.sceneId || "company_exterior");
        this.ui.setHudVisible(false);
        this.setDevToolkitStatus("인트로로 이동");
        this.startIntroVideo();
        return;
      }

      this.mode = "gameplay";
      this.flags = { ...this.flags, ...(branch.flags || {}) };
      (branch.items || []).forEach((itemId) => {
        if (!this.inventory.has(itemId)) {
          this.inventory.add(itemId, 1);
        }
      });

      const previousSceneId = this.scene.current?.id || "";
      this.isDevToolkitJumping = true;
      this.scene.load(branch.sceneId);
      this.onSceneReady(branch.sceneId);
      this.liminal.onSceneChange(previousSceneId, branch.sceneId);
      this.ui.setHudVisible(true);
      this.ui.renderQuests();
      this.pointClick.resetTransientState({ clearItem: true });
      this.pointClick.renderInventory();
      this.syncPointClickUi();
      this.syncReliableInteractionLayer();

      if (branch.afterJump === "startSimkongBoss") {
        this.startSimkongBoss();
        if (this.boss) {
          this.boss.phase = "appear";
          this.boss.lightIndex = 4;
          this.boss.timer = 0.15;
        }
      }

      if (branch.afterJump === "startFinalBossIntro") {
        this.startFinalBossIntro();
        if (this.finalBoss) {
          this.finalBoss.phase = "reveal";
          this.finalBoss.timer = 0.1;
          this.finalBoss.size = 120;
        }
      }
      if (branch.afterJump === "startMinigame" && branch.minigameId) {
        this.minigame.start(branch.minigameId);
      }
      this.isDevToolkitJumping = false;

      this.setDevToolkitStatus(`${branch.label} 이동 완료`);
    }

    setDevToolkitStatus(message) {
      if (!this.devToolkitStatus) return;
      const sceneName = this.scene.current?.name || this.scene.current?.id || "시작 전";
      this.devToolkitStatus.textContent = `현재: ${sceneName} · ${message} · 저장 안 함`;
    }

    openSettingsPanel() {
      document.getElementById("settings-panel").classList.remove("hidden");
      this.renderSettingsPanels();
    }

    renderSettingsPanels() {
      const render = () => this.renderSettingsPanels();
      this.settings.renderInto(document.getElementById("settings-content"), render);
      if (this.ui.menu && !this.ui.menu.classList.contains("hidden")) {
        this.ui.renderMenu();
      }
      this.applyAudioSettings();
    }

    applyAudioSettings() {
      if (this.audio.master) {
        this.audio.master.gain.value = (document.hidden ? 0 : 0.07 * this.settings.values.se);
      }
    }

    syncPointClickUi() {
      document.getElementById("game-menu-button").disabled = this.mode !== "gameplay" || this.minigame.isOpen();
      const action = document.getElementById("game-action-button");
      action.classList.toggle("hidden", !(this.quickEvent || this.qte || this.finalBoss?.phase === "battle_phase3"));
      action.textContent = this.qte ? `누르기: ${this.qte.sequence[this.qte.index] || "완료"}` : "연타 / 진행";
      const shouldShowInventory = this.pointClick.enabled
        && this.mode === "gameplay"
        && !this.pointClick.isExplorationLocked();
      const shouldShowBack = this.shouldShowPointBackButton();

      if (this.pointClick.inventoryBar) {
        this.pointClick.inventoryBar.classList.toggle("hidden", !shouldShowInventory);
      }

      this.pointClick.setBackButtonVisible(shouldShowBack);
    }

    shouldShowPointBackButton() {
      /*
        shouldShowPointBackButton()
        ---------------------------------------------------------------------
        돌아가기는 진행 막힘을 방지하는 안전장치라서 일반 조사 가능 여부와 분리합니다.
        예를 들어 사진 확대 Scene에서 조사 레이어가 잠시 비활성화되어도, 대화/퍼즐/메뉴가
        열려 있지 않다면 뒤로가기는 계속 보여야 합니다.
      */
      if (!this.pointClick.enabled || this.mode !== "gameplay") return false;
      if (this.ui.menu && !this.ui.menu.classList.contains("hidden")) return false;
      if (this.ui.modal && !this.ui.modal.classList.contains("hidden")) return false;
      if (this.dialog.isOpen() || this.puzzle.isOpen() || this.quiz.isBossQuizOpen()) return false;
      if (this.quickEvent || this.isBossCutscene() || this.isFinalCutscene() || this.isFinalBattleBlocking()) return false;
      return Boolean(this.pointClick.focusEvent || this.getCurrentBackEvent());
    }

    getCurrentBackEvent() {
      /*
        getCurrentBackEvent()
        ---------------------------------------------------------------------
        실제 사진 확대 Scene은 pointclick.js의 focusEvent가 아니라 scene.js의 독립 Scene으로
        이동합니다. 이 경우에도 플레이어가 항상 같은 위치의 "돌아가기" 버튼으로 빠져나올 수
        있도록 현재 Scene에 등록된 kind: "back" 이벤트를 찾아 반환합니다.
      */
      const events = this.scene.current?.events || [];
      return events.find((event) => event.kind === "back" && this.isSceneEventActive(event)) || null;
    }

    handlePointBackButton() {
      /*
        handlePointBackButton()
        ---------------------------------------------------------------------
        하단/좌측의 공통 돌아가기 버튼이 눌렸을 때 호출됩니다.
        - 기존 focusEvent 방식의 가상 확대 화면은 pointClick.goBack()으로 닫습니다.
        - 실제 scene.js 확대 화면은 kind: "back" 이벤트를 이벤트 매니저로 실행합니다.
      */
      if (this.pointClick.focusEvent) {
        this.pointClick.goBack();
        return;
      }

      const backEvent = this.getCurrentBackEvent();
      if (backEvent) {
        this.runReliableInteraction(backEvent);
      }
    }

    handlePuzzleKey(event) {
      if (/^\d$/.test(event.key)) {
        this.puzzle.inputDigit(event.key);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        this.puzzle.backspace();
        return;
      }

      if (event.key === "Enter") {
        this.puzzle.submit();
        return;
      }

      if (event.key === "Escape") {
        this.puzzle.close();
      }
    }

    handleBossQuizKey(event) {
      if (/^[1-4]$/.test(event.key)) {
        this.quiz.answerBossQuiz(Number(event.key) - 1);
      }
    }

    loop(time) {
      const delta = Math.min((time - this.lastTime) / 1000, 0.05);
      this.lastTime = time;
      this.totalTime += delta;

      this.update(delta);
      this.render();
      requestAnimationFrame((nextTime) => this.loop(nextTime));
    }

    update(delta) {
      if (!this.isPaused()) this.audio.update(this.totalTime);
      this.applyAudioSettings();
      this.syncPointClickUi();
      this.syncReliableInteractionLayer();
      this.updateGamepadInput();
      if (this.isPaused() || this.minigame.isOpen() || this.mode === "ending") return;
      this.updateOfficeAmbient();
      this.updateSecondFloorAmbient();
      this.updateEffects(delta);
      this.updateQuickEvent(delta);
      this.updateBoxkeeperBoss(delta);
      this.updateSimkongBoss(delta);
      this.updateFinalBoss(delta);
      this.updateFinalBattle(delta);
      this.liminal.update(delta);
      this.pointClick.update(delta);
      this.syncReliableInteractionLayer();
      this.dialog.update(delta);
      this.quiz.update(delta);

      if (this.mode === "prologue") {
        this.updatePrologue(delta);
      } else if (this.mode === "transition") {
        this.updateTransition(delta);
      } else if (!this.pointClick.enabled && !this.ui.isBlocking() && this.boss?.phase !== "attack" && !this.isFinalBattleActive()) {
        this.updatePlayer(delta);
      }

      if (this.mode === "gameplay") {
        this.playTime += delta;
      }

      this.autosaveTimer += delta;
      if (this.autosaveTimer >= 30 && this.mode === "gameplay") {
        this.autosaveTimer = 0;
        this.save("autosave", { silent: true });
      }
    }

    updateEffects(delta) {
      Object.keys(this.effects).forEach((key) => {
        this.effects[key] = Math.max(0, this.effects[key] - delta);
      });
    }

    updateGamepadInput() {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      const pad = pads[0];
      if (!pad) {
        ["gamepadleft", "gamepadright", "gamepadup", "gamepaddown"].forEach((key) => this.keys.delete(key));
        this.gamepadState.previousButtons.clear();
        return;
      }

      const dead = 0.25;
      this.setVirtualKey("gamepadleft", pad.axes[0] < -dead);
      this.setVirtualKey("gamepadright", pad.axes[0] > dead);
      this.setVirtualKey("gamepadup", pad.axes[1] < -dead);
      this.setVirtualKey("gamepaddown", pad.axes[1] > dead);

      const pressed = new Set();
      pad.buttons.forEach((button, index) => {
        if (button.pressed) pressed.add(index);
      });

      this.handleGamepadButton(pressed, 0, () => { if (!this.isPaused()) this.handleVirtualInteract(); });
      this.handleGamepadButton(pressed, 9, () => { if (this.mode === "gameplay") this.ui.toggleMenu(); });
      this.gamepadState.previousButtons = pressed;
    }

    setVirtualKey(key, isDown) {
      if (isDown) {
        this.keys.add(key);
      } else {
        this.keys.delete(key);
      }
    }

    handleGamepadButton(pressed, index, callback) {
      if (pressed.has(index) && !this.gamepadState.previousButtons.has(index)) {
        callback();
      }
    }

    handleVirtualInteract() {
      if (this.quickEvent) {
        this.handleQuickEventInput();
      } else if (this.qte) {
        this.handleQteInput("e");
      } else if (this.dialog.isOpen()) {
        this.dialog.advance();
      } else if (!this.pointClick.enabled && !this.ui.isBlocking()) {
        this.scene.interact();
      }
    }

    updateOfficeAmbient() {
      if (this.scene.current?.id !== "office_01" || !this.audio.started) return;

      if (this.totalTime >= this.nextOfficeKeyAt) {
        this.audio.playKeyboardTick();
        this.nextOfficeKeyAt = this.totalTime + 0.6 + Math.random() * 1.8;
      }
    }

    updateSecondFloorAmbient() {
      if (!this.audio.started) return;
      const secondFloorScenes = ["second_floor_corridor", "design_studio", "ceo_door_front"];
      if (!secondFloorScenes.includes(this.scene.current?.id)) return;

      if (this.totalTime >= this.audio.nextChairDragAt) {
        this.audio.playChairDrag();
        this.audio.nextChairDragAt = this.totalTime + 18 + Math.random() * 18;
      }
      if (this.totalTime >= this.audio.nextFootstepAt) {
        this.audio.playDistantFootstep();
        this.audio.nextFootstepAt = this.totalTime + 10 + Math.random() * 16;
      }
    }

    updateQuickEvent(delta) {
      if (!this.quickEvent) return;

      if (this.quickEvent.type === "warehouse_door") {
        this.quickEvent.decayTimer += delta;
        if (this.quickEvent.decayTimer >= 0.55) {
          this.quickEvent.decayTimer = 0;
          this.quickEvent.progress = Math.max(0, this.quickEvent.progress - 1);
        }
      }
    }

    updatePrologue(delta) {
      this.prologue.timer += delta;

      if (this.prologue.phase === "text") {
        /*
          인트로 템포:
          ---------------------------------------------------------------------
          포인트앤클릭 방식에서는 플레이어가 텍스트를 읽고 직접 넘기는 감각이 중요합니다.
          자동으로 줄이 넘어가면 읽는 속도와 어긋나고, 반대로 너무 오래 기다리면 시작부터
          답답해집니다. 따라서 텍스트 단계는 updatePrologue()가 자동 진행하지 않고,
          advancePrologueByClick()만 다음 줄로 넘깁니다.
        */
        return;
      }

      if (this.prologue.phase === "exteriorFadeIn" && this.prologue.timer >= 1.25) {
        this.prologue.phase = "exteriorHold";
        this.prologue.timer = 0;
        return;
      }

      if (this.prologue.phase === "exteriorHold" && this.prologue.timer >= 0.45) {
        this.prologue.phase = "exteriorFadeOut";
        this.prologue.timer = 0;
        return;
      }

      if (this.prologue.phase === "exteriorFadeOut" && this.prologue.timer >= 0.9) {
        this.mode = "gameplay";
        this.flags.prologue_seen_exterior = true;
        this.ui.setHudVisible(true);
        this.ui.renderQuests();
        this.save("autosave", { silent: true });
      }
    }

    /*
      skipPrologue()
      -------------------------------------------------------------------------
      포인트앤클릭 게임의 시작부는 빠르게 "눌러볼 수 있는 상태"가 되어야 합니다.
      인트로 대사와 페이드 연출은 유지하되, 플레이어가 클릭하거나 조사 키를 누르면
      즉시 회사 앞 Scene으로 진입합니다. 상태 변경은 updatePrologue()의 정상 완료 루트와
      같은 플래그/HUD/자동저장 처리를 사용합니다.
    */
    skipPrologue() {
      if (this.mode !== "prologue") return;

      this.mode = "gameplay";
      this.flags.prologue_seen_exterior = true;
      this.prologue.phase = "done";
      this.prologue.timer = 0;
      this.ui.setHudVisible(true);
      this.ui.renderQuests();
      this.save("autosave", { silent: true });
    }

    /*
      advancePrologueByClick()
      -------------------------------------------------------------------------
      인트로를 자동으로 길게 기다리게 하지 않고, 플레이어 클릭 리듬에 맞춰 한 줄씩 넘깁니다.
      마지막 텍스트 이후에는 짧은 회사 외관 연출로 넘어가고, 외관 연출 중 클릭하면 즉시
      플레이 가능한 회사 앞 Scene으로 들어갑니다.
    */
    advancePrologueByClick() {
      if (this.mode !== "prologue") return;

      if (this.prologue.phase === "text") {
        this.prologue.timer = 0;
        this.prologue.lineIndex += 1;
        if (this.prologue.lineIndex >= this.prologue.lines.length) {
          this.prologue.phase = "exteriorFadeIn";
          this.prologue.timer = 0;
        }
        return;
      }

      this.skipPrologue();
    }

    updateTransition(delta) {
      if (!this.transition) {
        this.mode = "gameplay";
        return;
      }

      this.transition.timer += delta;
      if (this.transition.timer >= this.transition.duration) {
        const nextSceneId = this.transition.nextSceneId;
        const previousSceneId = this.scene.current?.id || "";
        this.transition = null;
        this.scene.load(nextSceneId);
        this.mode = "gameplay";
        this.onSceneReady(nextSceneId);
        this.liminal.onSceneChange(previousSceneId, nextSceneId);
        this.ui.setHudVisible(true);
        this.ui.renderQuests();
        this.save("autosave", { silent: true });
      }
    }

    onSceneReady(sceneId) {
      if (sceneId === "guard_room" && !this.flags.guard_room_lock_scare_done) {
        this.flags.guard_room_lock_scare_done = true;
        this.effects.lockScare = 1.1;
        this.dialog.start("guard_room_lock_scare");
      }
      if (sceneId === "office_01" && !this.flags.office_entered) {
        this.flags.office_entered = true;
        if (!this.isDevToolkitJumping) {
          this.save("autosave", { silent: true });
        }
      }
      if (sceneId === "meeting_room_01" && !this.flags.simkong_boss_started && !this.flags.simkong_defeated) {
        this.startSimkongBoss();
      }
      if (sceneId === "meeting_room_01" && this.flags.simkong_defeated && !this.flags.simdaeri_fled_to_second_floor && !this.flags.got_second_floor_auth_card) {
        this.flags.simdaeri_fled_to_second_floor = true;
      }
      if (sceneId === "boxkeeper_boss") {
        this.boxkeeperBoss = {
          timer: 0,
          phase: this.flags.boxkeeper_cleared
            ? "cleared"
            : this.flags.boxkeeper_phase_delivery
              ? "delivery"
              : this.flags.boxkeeper_phase_packing
                ? "packing"
                : this.flags.boxkeeper_phase_inventory
                  ? "inventory"
                  : "intro",
          spritePath: "assets/runtime/characters/boxman.png"
        };
      } else if (this.boxkeeperBoss && sceneId !== "boxkeeper_boss") {
        this.boxkeeperBoss = null;
      }
      if (["executive_office", "meeting_room_01"].includes(sceneId) && this.flags.simkong_boss_started && !this.flags.simkong_defeated && !this.boss) {
        this.boss = {
          phase: this.flags.simkong_quiz_waiting ? "dialog_wait" : "quiz",
          timer: 0,
          lightIndex: 4,
          beanX: 766,
          beanY: 392,
          size: 94,
          questionIndex: 0,
          correct: 0,
          wrong: 0,
          infection: 10,
          playerHp: 3,
          attackTimer: 0,
          bullets: [],
          attackDuration: 6
        };
        this.effects.heartbeat = 999;
        if (!this.flags.simkong_quiz_waiting) {
          this.beginSimkongQuiz();
        }
      }
    }

    updatePlayer(delta) {
      const input = this.settings.getAxis(this.keys);
      input.x += Number(this.keys.has("gamepadright")) - Number(this.keys.has("gamepadleft"));
      input.y += Number(this.keys.has("gamepaddown")) - Number(this.keys.has("gamepadup"));

      if (input.x !== 0 && input.y !== 0) {
        input.x *= Math.SQRT1_2;
        input.y *= Math.SQRT1_2;
      }

      const nextX = this.player.x + input.x * this.player.speed * delta;
      const nextY = this.player.y + input.y * this.player.speed * delta;
      this.player.x = nextX;
      this.clampPlayerToScene();
      this.resolveSolidObjectCollision("x");
      this.player.y = nextY;
      this.clampPlayerToScene();
      this.resolveSolidObjectCollision("y");
    }

    clampPlayerToScene() {
      const bounds = this.scene.current.walkBounds;
      this.player.x = clamp(this.player.x, bounds.x, bounds.x + bounds.width);
      this.player.y = clamp(this.player.y, bounds.y, bounds.y + bounds.height);
    }

    resolveSolidObjectCollision(axis) {
      const solids = (this.scene.current.events || []).filter((event) => event.solid);
      solids.forEach((event) => {
        const overlaps = this.player.x > event.x
          && this.player.x < event.x + event.width
          && this.player.y > event.y
          && this.player.y < event.y + event.height;
        if (!overlaps) return;

        if (axis === "x") {
          const left = Math.abs(this.player.x - event.x);
          const right = Math.abs(this.player.x - (event.x + event.width));
          this.player.x = left < right ? event.x - 1 : event.x + event.width + 1;
        } else {
          const top = Math.abs(this.player.y - event.y);
          const bottom = Math.abs(this.player.y - (event.y + event.height));
          this.player.y = top < bottom ? event.y - 1 : event.y + event.height + 1;
        }
      });
    }

    handleSceneEvent(event) {
      this.liminal.recordInteraction(event);

      if (event.id === "front_door") {
        this.flags.front_door_checked = true;
        this.ui.renderQuests();
      }
      if (event.id === "warehouse_door") {
        this.flags.reached_warehouse_door = true;
        this.ui.renderQuests();
      }
      if (this.scene.current?.id === "warehouse_01" && event.id !== "warehouse_exit") {
        this.flags.warehouse_inspection_count = (this.flags.warehouse_inspection_count || 0) + 1;
        this.maybeDropBeanFromCeiling();
      }
      if (this.scene.current?.id === "second_floor_corridor") {
        this.flags.second_floor_shift = ((this.flags.second_floor_shift || 0) + 1) % 5;
        this.effects.corridorShift = 0.5;
      }
    }

    handleAction(action) {
      if (!action) return;

      switch (action.type) {
        case "dialog":
          if (action.flag) {
            this.flags[action.flag] = action.value ?? true;
            this.ui.renderQuests();
            this.save("autosave", { silent: true });
          }
          this.dialog.start(action.dialogId);
          break;
        case "close_dialog":
          this.dialog.close();
          break;
        case "set_flag":
          this.flags[action.flag] = action.value;
          this.ui.renderQuests();
          this.save("autosave", { silent: true });
          break;
        case "add_item":
          this.inventory.add(action.itemId, action.count || 1);
          if (action.flag) {
            this.flags[action.flag] = true;
          }
          this.ui.renderQuests();
          this.pointClick.renderInventory();
          this.save("autosave", { silent: true });
          break;
        case "quiz":
          this.quiz.start(action.quizId);
          break;
        case "battle":
          this.battle.start(action.battleId);
          break;
        case "minigame":
          this.minigame.start(action.minigameId);
          break;
        case "ending":
          this.ending.show(action.endingId);
          break;
        case "enter_guard_room":
          this.enterGuardRoom();
          break;
        case "change_scene":
          this.changeScene(action.sceneId, action.player);
          break;
        case "inspect_chair":
          this.inspectChair();
          break;
        case "computer_glitch":
          this.inspectComputer();
          break;
        case "cctv_glitch":
          this.inspectCctv();
          break;
        case "pickup_security_card":
          this.pickupSecurityCard();
          break;
        case "main_entrance_check":
          this.checkMainEntrance();
          break;
        case "start_warehouse_door":
          this.startWarehouseDoorEvent();
          break;
        case "open_warehouse_parcel":
          this.openWarehouseParcel();
          break;
        case "touch_warehouse_red_bean":
          this.touchWarehouseRedBean();
          break;
        case "inspect_warehouse_red_bean":
          this.inspectWarehouseRedBean();
          break;
        case "attempt_warehouse_exit":
          this.attemptWarehouseExit();
          break;
        case "start_code_puzzle":
          this.startCodePuzzle(action.puzzleId);
          break;
        case "boxkeeper_work":
          this.resolveBoxkeeperWork(action.phase);
          break;
        case "boxkeeper_work_complete":
          this.completeBoxkeeperWork(action.phase);
          break;
        case "boxkeeper_reset":
          this.resetBoxkeeperEncounter();
          break;
        case "office_card_reader":
          this.useOfficeCardReader();
          break;
        case "office_beans_avoid":
          this.resolveOfficeBeans(true);
          break;
        case "office_beans_step":
          this.resolveOfficeBeans(false);
          break;
        case "meeting_room_knock":
          this.inspectMeetingRoom();
          break;
        case "office_inner_sound":
          this.playOfficeInnerSound();
          break;
        case "enter_executive_office":
          this.enterExecutiveOffice();
          break;
        case "start_simkong_boss":
          this.startSimkongBoss();
          break;
        case "begin_simkong_quiz":
          this.beginSimkongQuiz();
          break;
        case "hold_simkong_quiz":
          this.holdSimkongQuiz();
          break;
        case "finish_simkong_boss":
          this.finishSimkongBoss();
          break;
        case "collect_second_floor_card":
          this.collectSecondFloorCard();
          break;
        case "start_second_floor_shutter":
          this.startSecondFloorShutter();
          break;
        case "inspect_design_computer":
          this.inspectDesignComputer();
          break;
        case "design_computer_red_flash":
          this.effects.redGlitch = 0.08;
          break;
        case "pickup_crowbar":
          this.pickupCrowbar();
          break;
        case "inspect_ceo_door":
          this.inspectCeoDoor();
          break;
        case "start_crowbar_event":
          this.startCrowbarEvent();
          break;
        case "enter_ceo_office":
          this.enterCeoOffice();
          break;
        case "inspect_ceo_computer":
          this.inspectCeoComputer();
          break;
        case "pickup_ceo_usb":
          this.pickupCeoUsb();
          break;
        case "morning_ending":
          this.showMorningEnding();
          break;
        case "read_project_s":
          this.readProjectS();
          break;
        case "project_s_finished":
          this.finishProjectSReading();
          break;
        case "start_final_boss_intro":
          this.startFinalBossIntro();
          break;
        case "begin_final_quiz":
          this.beginFinalQuiz();
          break;
        case "finish_final_quiz":
          this.finishFinalQuiz();
          break;
        case "begin_final_battle":
          this.beginFinalBattle();
          break;
        case "final_boss_collapse":
          this.finalBossCollapse();
          break;
        case "read_final_report":
          this.readFinalReport();
          break;
        case "start_escape_sequence":
          this.startEscapeSequence();
          break;
        case "escape_to_front":
          this.escapeToFrontDoor();
          break;
        case "finish_escape":
          this.finishEscape();
          break;
        case "show_true_ending":
          this.showTrueEnding();
          break;
        case "true_bean_choice":
          this.resolveTrueBeanChoice(action.choice);
          break;
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    }

    enterGuardRoom() {
      this.flags.entered_guard_room = true;
      this.mode = "transition";
      this.ui.setHudVisible(false);
      this.transition = {
        kind: "fade",
        timer: 0,
        duration: 1.7,
        nextSceneId: "guard_room"
      };
    }

    changeScene(sceneId, playerPosition) {
      const previousSceneId = this.scene.current?.id || "";
      this.pointClick.resetTransientState();
      this.scene.load(sceneId);
      if (playerPosition) {
        this.player.x = playerPosition.x;
        this.player.y = playerPosition.y;
      }
      this.onSceneReady(sceneId);
      this.liminal.onSceneChange(previousSceneId, sceneId);
      this.ui.renderQuests();
      this.syncPointClickUi();
      this.syncReliableInteractionLayer();
      this.save("autosave", { silent: true });
    }

    inspectChair() {
      const count = this.flags.chair_inspection_count || 0;
      const nextCount = count + 1;
      this.flags.chair_inspection_count = nextCount;

      if (this.flags.got_security_access_card && nextCount > 3) {
        this.dialog.start("chair_beans_after_card");
      } else if (nextCount === 1) {
        this.dialog.start("chair_beans_01");
      } else if (nextCount === 2) {
        this.dialog.start("chair_beans_02");
      } else {
        this.flags.chair_beans_03_seen = true;
        this.effects.whiteFlash = 0.2;
        this.dialog.start("chair_beans_03");
      }

      this.save("autosave", { silent: true });
    }

    inspectComputer() {
      this.flags.guard_computer_checked = true;
      this.effects.redGlitch = 0.08;
      this.dialog.start("computer_glitch");
      this.save("autosave", { silent: true });
    }

    inspectCctv() {
      this.flags.guard_cctv_checked = true;
      this.effects.cctvShadow = 0.08;
      this.dialog.start("cctv_glitch");
      this.save("autosave", { silent: true });
    }

    pickupSecurityCard() {
      this.inventory.add("security_access_card", 1);
      this.flags.got_security_access_card = true;
      this.effects.blackout = 0.5;
      this.audio.playPickup();
      this.dialog.start("security_card_pickup");
      this.ui.renderQuests();
      this.pointClick.renderInventory();
      this.save("autosave", { silent: true });
    }

    checkMainEntrance() {
      this.flags.front_door_checked = true;

      if (this.inventory.has("security_access_card")) {
        this.flags.warehouse_emergency_light_on = true;
        this.dialog.start("main_entrance_after_card");
      } else {
        this.dialog.start("main_entrance_no_card");
      }

      this.ui.renderQuests();
      this.save("autosave", { silent: true });
    }

    startWarehouseDoorEvent() {
      this.flags.reached_warehouse_door = true;
      this.quickEvent = {
        type: "warehouse_door",
        progress: 0,
        target: 8,
        decayTimer: 0,
        background: "assets/runtime/photos/08_warehouse_lock.jpg"
      };
      this.ui.renderQuests();
    }

    handleQuickEventInput() {
      if (!this.quickEvent) return;

      if (this.quickEvent.type === "warehouse_door") {
        this.quickEvent.progress += 1;
        this.effects.warehouseLightBlink = 0.08;

        if (this.quickEvent.progress >= this.quickEvent.target) {
          this.quickEvent = null;
          this.effects.warehouseLightBlink = 0.7;
          this.flags.warehouse_door_opened = true;
          this.dialog.start("warehouse_door_opened");
          this.save("autosave", { silent: true });
        }
      }

      if (this.quickEvent?.type === "second_floor_shutter") {
        this.quickEvent.progress += 1;
        this.effects.shutterOpen = 0.2;
        if (this.quickEvent.progress >= this.quickEvent.target) {
          this.quickEvent = null;
          this.effects.shutterOpen = 1.2;
          this.dialog.start("second_floor_shutter_open");
        }
      }

      if (this.quickEvent?.type === "crowbar_pry") {
        this.quickEvent.progress += 1;
        this.effects.boxScare = 0.25;
        if (this.quickEvent.progress >= this.quickEvent.target) {
          this.quickEvent = null;
          this.flags.ceo_door_event_done = true;
          this.effects.ceoDrop = 1.0;
          this.dialog.start("ceo_door_after_pry");
          this.ui.renderQuests();
          this.save("autosave", { silent: true });
        }
      }
    }

    openWarehouseParcel() {
      const count = this.flags.warehouse_open_parcel_count || 0;
      const nextCount = count + 1;
      this.flags.warehouse_open_parcel_count = nextCount;

      if (nextCount === 1) {
        this.dialog.start("parcel_open_01");
      } else if (nextCount === 2) {
        this.dialog.start("parcel_open_02");
      } else if (nextCount === 3) {
        this.dialog.start("parcel_open_03");
      } else if (nextCount === 4) {
        this.dialog.start("parcel_open_04");
      } else {
        this.dialog.start("parcel_open_after");
      }

      if (nextCount >= 4) {
        this.flags.warehouse_red_bean_visible = true;
      }

      this.maybeDropBeanFromCeiling();
      this.save("autosave", { silent: true });
    }

    touchWarehouseRedBean() {
      if (this.flags.warehouse_red_bean_touched) {
        this.flags.warehouse_red_bean_visible = false;
        this.dialog.start("red_bean_missing");
        this.save("autosave", { silent: true });
        return;
      }

      this.flags.warehouse_red_bean_touched = true;
      this.effects.heavyNoise = 0.5;
      this.audio.playHarshNoise();
      this.dialog.start("red_bean_touch_after");
      this.save("autosave", { silent: true });
    }

    inspectWarehouseRedBean() {
      if (this.flags.warehouse_red_bean_touched) {
        this.flags.warehouse_red_bean_visible = false;
        this.dialog.start("red_bean_missing");
        this.save("autosave", { silent: true });
        return;
      }

      this.dialog.start("red_bean_choice");
    }

    maybeDropBeanFromCeiling() {
      const exploredEnough = (this.flags.warehouse_open_parcel_count || 0) >= 3
        || (this.flags.warehouse_inspection_count || 0) >= 7;
      if (exploredEnough && !this.flags.warehouse_ceiling_bean_seen) {
        this.flags.warehouse_ceiling_bean_seen = true;
        this.scheduleSession(() => {
          if (this.scene.current?.id === "warehouse_01" && !this.dialog.isOpen()) {
            this.dialog.start("bean_falls_from_ceiling");
          }
        }, 900);
      }
    }

    attemptWarehouseExit() {
      if (!this.flags.warehouse_exit_scare_done) {
        this.flags.warehouse_exit_scare_done = true;
        this.effects.boxScare = 0.6;
        this.audio.playMetalPipeDrop();
        this.dialog.start("warehouse_exit_scare");
        this.ui.renderQuests();
        this.save("autosave", { silent: true });
        return;
      }

      this.changeScene("company_exterior", { x: 1040, y: 565 });
    }

    startCodePuzzle(puzzleId) {
      if (puzzleId === "officeDoor" && !this.flags.office_keypad_enabled) {
        this.dialog.start("office_card_reader_no_card");
        return;
      }

      this.puzzle.startCodeInput(puzzleId);
    }

    resolvePuzzleAttempt(puzzleId, isCorrect) {
      if (puzzleId === "warehouseLock") {
        this.resolveWarehouseLock(isCorrect);
        return;
      }

      if (puzzleId === "officeDoor") {
        this.resolveOfficeDoor(isCorrect);
      }
    }

    resolveWarehouseLock(isCorrect) {
      if (isCorrect) {
        this.flags.warehouse_lock_open = true;
        this.dialog.start("warehouse_lock_open");
        this.save("autosave", { silent: true });
        return;
      }

      const attempts = (this.flags.warehouse_lock_failures || 0) + 1;
      this.flags.warehouse_lock_failures = attempts;
      this.audio.playScratch();

      if (attempts >= 7) {
        this.ending.show("bad_end_warehouse_consumed");
        return;
      }

      if (attempts >= 5) {
        this.flags.warehouse_lock_fail_bean = true;
        this.dialog.start("warehouse_lock_wrong_bean");
      } else if (attempts >= 3) {
        this.effects.blackout = 0.7;
        this.dialog.start("warehouse_lock_wrong_light");
      } else {
        this.dialog.start("warehouse_lock_wrong");
      }

      this.save("autosave", { silent: true });
    }

    useOfficeCardReader() {
      if (!this.inventory.has("security_access_card")) {
        this.dialog.start("office_card_reader_no_card");
        return;
      }

      this.flags.office_keypad_enabled = true;
      this.dialog.start("office_card_reader_enabled");
      this.save("autosave", { silent: true });
    }

    resolveOfficeDoor(isCorrect) {
      if (!isCorrect) {
        this.dialog.start("office_door_wrong");
        return;
      }

      this.flags.office_door_open = true;
      this.effects.officeLightsOut = 1.8;
      this.dialog.start("office_door_open");
      this.save("autosave", { silent: true });
    }

    resolveOfficeBeans(tryAvoid) {
      const failedAvoid = tryAvoid && this.flags.warehouse_red_bean_touched;

      if (tryAvoid && !failedAvoid) {
        this.flags.office_beans_resolved = true;
        this.dialog.start("office_beans_safe");
        this.save("autosave", { silent: true });
        return;
      }

      this.flags.office_beans_resolved = true;
      this.flags.office_bean_juice_seen = true;
      this.effects.beanJuice = 3.8;
      this.effects.footprintTrail = 5.2;
      this.audio.playBeanPop();
      this.dialog.start("office_beans_step");
      this.save("autosave", { silent: true });
    }

    inspectMeetingRoom() {
      this.flags.meeting_room_checked = true;
      this.audio.playSmallLaugh();
      this.dialog.start("meeting_room_knock");
      this.ui.renderQuests();
      this.save("autosave", { silent: true });
    }

    playOfficeInnerSound() {
      this.flags.office_inner_sound_heard = true;
      this.effects.redGlitch = 0.12;
      this.audio.playMetalPipeDrop();
      this.dialog.start("office_inner_sound");
      this.save("autosave", { silent: true });
    }

    enterExecutiveOffice() {
      this.effects.blackout = 0.35;
      this.changeScene("meeting_room_01", { x: 640, y: 620 });
    }

    isBossCutscene() {
      return Boolean(this.boss && ["lights", "appear", "clear", "explosion"].includes(this.boss.phase));
    }

    isFinalCutscene() {
      return Boolean(this.finalBoss && ["document_end", "reveal", "clear", "blackout"].includes(this.finalBoss.phase));
    }

    updateBoxkeeperBoss(delta) {
      if (!this.boxkeeperBoss) return;
      this.boxkeeperBoss.timer += delta;
    }

    resetBoxkeeperEncounter() {
      /*
        resetBoxkeeperEncounter()
        ---------------------------------------------------------------------
        Boxkeeper minigames are allowed to fail without causing a permanent
        soft lock. Three packing mistakes return the player to the first
        Boxkeeper encounter state, so the scene can be replayed cleanly.
      */
      delete this.flags.boxkeeper_phase_inventory;
      delete this.flags.boxkeeper_phase_packing;
      delete this.flags.boxkeeper_phase_delivery;
      delete this.flags.boxkeeper_inventory_checked;
      delete this.flags.boxkeeper_packing_done;
      delete this.flags.boxkeeper_delivery_fixed;
      delete this.flags.boxkeeper_cleared;
      this.boxkeeperBoss = {
        timer: 0,
        phase: "intro",
        spritePath: "assets/runtime/characters/boxman.png"
      };
      this.effects.redGlitch = 0.18;
      this.dialog.close();
      this.changeScene("boxkeeper_boss", { x: 640, y: 620 });
      this.save("autosave", { silent: true });
    }

    resolveBoxkeeperWork(phase) {
      /*
        resolveBoxkeeperWork()
        ---------------------------------------------------------------------
        창고 첫 보스인 박스키퍼는 직접 전투가 아니라 회사 물류 업무를
        패러디한 순서형 미니 보스로 처리합니다.

        기존 창고 암호 퍼즐은 그대로 두고, 암호를 맞힌 뒤 이 장면을 거쳐야
        1층 사무실 문 앞으로 진행됩니다. PNG 캐릭터는 boxman.png를 사용하며,
        각 단계는 플래그로 저장되어 불러오기 후에도 같은 진행 상태를 복원합니다.
      */
      if (!this.boxkeeperBoss) {
        this.boxkeeperBoss = { timer: 0, phase: "intro", spritePath: "assets/runtime/characters/boxman.png" };
      }

      const minigames = {
        inventory: "boxkeeper_inventory_check",
        packing: "boxkeeper_packing_work",
        delivery: "boxkeeper_delivery_error"
      };

      if (minigames[phase]) {
        this.minigame.start(minigames[phase]);
        return;
      }

      this.completeBoxkeeperWork(phase);
    }

    completeBoxkeeperWork(phase) {
      if (!this.boxkeeperBoss) {
        this.boxkeeperBoss = { timer: 0, phase: "intro", spritePath: "assets/runtime/characters/boxman.png" };
      }

      if (phase === "inventory") {
        this.flags.boxkeeper_phase_inventory = true;
        this.boxkeeperBoss.phase = "inventory";
        this.effects.redGlitch = 0.08;
        this.dialog.start("boxkeeper_phase_inventory");
      } else if (phase === "packing") {
        this.flags.boxkeeper_phase_packing = true;
        this.boxkeeperBoss.phase = "packing";
        this.effects.boxScare = 0.35;
        this.dialog.start("boxkeeper_phase_packing");
      } else if (phase === "delivery") {
        this.flags.boxkeeper_phase_delivery = true;
        this.boxkeeperBoss.phase = "delivery";
        this.effects.warehouseLightBlink = 0.4;
        this.dialog.start("boxkeeper_phase_delivery");
      } else if (phase === "clear") {
        this.flags.boxkeeper_cleared = true;
        this.boxkeeperBoss.phase = "cleared";
        this.effects.beanJuice = 2.4;
        this.dialog.start("boxkeeper_clear");
      }

      this.ui.renderQuests();
      this.save("autosave", { silent: true });
    }

    startSimkongBoss() {
      this.flags.simkong_boss_started = true;
      this.boss = {
        phase: "lights",
        timer: 0,
        lightIndex: 0,
        beanX: 646,
        beanY: 392,
        size: 96,
        questionIndex: 0,
        correct: 0,
        wrong: 0,
        totalWrong: 0,
        infection: 0,
        playerHp: 3,
        attackTimer: 0,
        bullets: [],
        attackDuration: 6
      };
      this.effects.heartbeat = 999;
      if (!this.isDevToolkitJumping) {
        this.save("autosave", { silent: true });
      }
    }

    updateSimkongBoss(delta) {
      if (!this.boss) return;

      if (this.boss.phase === "lights") {
        this.boss.timer += delta;
        if (this.boss.timer >= 1.0) {
          this.boss.timer = 0;
          this.boss.lightIndex += 1;
        }
        if (this.boss.lightIndex >= 4) {
          this.boss.phase = "appear";
          this.boss.timer = 0;
          this.boss.size = 96;
        }
        return;
      }

      if (this.boss.phase === "appear") {
        this.boss.timer += delta;
        this.boss.beanX = 646 + Math.sin(this.boss.timer * 8) * 3;
        this.boss.size = 96;
        if (this.boss.timer >= 0.8) {
          this.boss.phase = "dialog";
          this.dialog.start("simkong_intro");
        }
        return;
      }

      if (this.boss.phase === "attack") {
        this.updateSimkongAttack(delta);
      }

      if (this.boss.phase === "explosion") {
        this.boss.timer += delta;
        if (this.boss.timer >= 1.3) {
          this.effects.heartbeat = 0;
          this.effects.simkongExplosion = 1.2;
          this.flags.simkong_defeated = true;
          this.flags.simdaeri_fled_to_second_floor = true;
          this.boss.phase = "defeated";
          this.boss.bullets = [];
          this.ui.renderQuests();
          this.dialog.start("simdaeri_fled_to_second_floor");
          this.save("autosave", { silent: true });
        }
      }
    }

    beginSimkongQuiz() {
      if (!this.boss) return;

      this.boss.phase = "quiz";
      this.flags.simkong_quiz_waiting = false;
      this.quiz.startBossQuiz(this.boss.questionIndex);
    }

    holdSimkongQuiz() {
      if (this.boss) {
        this.boss.phase = "dialog_wait";
      }
      this.flags.simkong_quiz_waiting = true;
      this.dialog.start("simkong_quiz_waiting");
      this.save("autosave", { silent: true });
    }

    resolveSimkongQuizAnswer(isCorrect) {
      if (!this.boss) return;

      if (isCorrect) {
        this.boss.correct += 1;
        this.boss.questionIndex += 1;
        this.boss.infection = Math.max(0, this.boss.infection - 8);
        if (this.boss.correct >= 5) {
          this.boss.phase = "clear";
          this.liminal.recordSimkongQuizResult(this.boss.totalWrong || 0);
          this.dialog.start("simkong_clear");
          return;
        }
        this.beginSimkongQuiz();
        return;
      }

      this.boss.wrong += 1;
      this.boss.totalWrong = (this.boss.totalWrong || 0) + 1;
      this.boss.infection += 5;
      if (this.boss.wrong >= 3) {
        this.startSimkongAttack();
      } else {
        this.boss.phase = "dialog";
        this.dialog.start("simkong_wrong");
      }
    }

    startSimkongAttack() {
      this.boss.phase = "attack";
      this.boss.attackTimer = 0;
      this.boss.bullets = [];
      this.boss.wrong = 0;
    }

    updateSimkongAttack(delta) {
      this.updatePlayer(delta);
      this.boss.attackTimer += delta;

      if (Math.floor(this.boss.attackTimer * 6) !== Math.floor((this.boss.attackTimer - delta) * 6)) {
        this.spawnSimkongBullet();
      }

      this.boss.bullets.forEach((bullet) => {
        bullet.x += bullet.vx * delta;
        bullet.y += bullet.vy * delta;
      });
      this.boss.bullets = this.boss.bullets.filter((bullet) => bullet.x > -40 && bullet.x < 1320 && bullet.y > -40 && bullet.y < 760);

      this.boss.bullets.forEach((bullet) => {
        if (bullet.hit) return;
        const dx = bullet.x - this.player.x;
        const dy = bullet.y - (this.player.y - 20);
        if (Math.hypot(dx, dy) < 24) {
          bullet.hit = true;
          this.boss.playerHp = Math.max(0, this.boss.playerHp - 1);
          this.boss.infection += 6;
          this.effects.redGlitch = 0.12;
        }
      });

      if (this.boss.attackTimer >= this.boss.attackDuration || this.boss.playerHp <= 0) {
        this.boss.phase = "quiz";
        this.beginSimkongQuiz();
      }
    }

    spawnSimkongBullet() {
      const targetX = this.player.x;
      const targetY = this.player.y - 24;
      const startX = 704 + Math.random() * 180 - 90;
      const startY = 318 + Math.random() * 40;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const speed = 180 + Math.random() * 70;

      this.boss.bullets.push({
        x: startX,
        y: startY,
        vx: (dx / length) * speed,
        vy: (dy / length) * speed,
        hit: false
      });
    }

    finishSimkongBoss() {
      if (!this.boss) return;

      this.boss.phase = "explosion";
      this.boss.timer = 0;
    }

    collectSecondFloorCard() {
      if (!this.flags.simkong_defeated || !this.flags.simdaeri_fled_to_second_floor) {
        return;
      }
      this.inventory.add("second_floor_auth_card", 1);
      this.flags.got_second_floor_auth_card = true;
      this.flags.doc_second_floor_memo = true;
      this.audio.playPickup();
      this.dialog.start("second_floor_card_pickup");
      this.ui.renderQuests();
      this.pointClick.renderInventory();
      this.save("autosave", { silent: true });
    }

    startSecondFloorShutter() {
      if (!this.inventory.has("second_floor_auth_card")) return;
      this.quickEvent = {
        type: "second_floor_shutter",
        progress: 0,
        target: 4,
        decayTimer: 0
      };
    }

    inspectDesignComputer() {
      this.flags.design_computer_checked = true;
      this.dialog.start("design_computer_research");
      this.save("autosave", { silent: true });
    }

    pickupCrowbar() {
      this.inventory.add("crowbar", 1);
      this.flags.got_crowbar = true;
      this.flags.design_room_shifted = true;
      this.effects.designBlackout = 2.0;
      this.audio.playPickup();
      this.dialog.start("crowbar_pickup");
      this.ui.renderQuests();
      this.pointClick.renderInventory();
      this.save("autosave", { silent: true });
    }

    inspectCeoDoor() {
      this.dialog.start("ceo_door_first");
    }

    startCrowbarEvent() {
      if (!this.inventory.has("crowbar")) return;
      this.quickEvent = {
        type: "crowbar_pry",
        progress: 0,
        target: 3,
        decayTimer: 0
      };
    }

    enterCeoOffice() {
      if (!this.flags.ceo_door_event_done) {
        this.dialog.start("ceo_door_still_blocked");
        return;
      }
      this.dialog.start("ceo_office_enter");
    }

    inspectCeoComputer() {
      if (this.flags.got_usb_drive && !this.flags.project_s_read) {
        this.readProjectS();
        return;
      }

      this.dialog.start("ceo_computer_off");
    }

    pickupCeoUsb() {
      this.flags.got_usb_drive = true;
      this.inventory.add("usb_drive", 1);
      this.pointClick.renderInventory();
      this.ui.renderQuests();
      this.effects.whiteFlash = 0.18;
      this.dialog.start("ceo_usb_found");
      this.save("autosave", { silent: true });
    }

    showMorningEnding() {
      this.flags.morning_end_reached = true;
      this.effects.whiteFlash = 0.35;
      this.ending.show("morning_end");
      this.save("autosave", { silent: true });
    }

    readProjectS() {
      this.flags.project_s_read = true;
      this.flags.doc_project_s = true;
      this.dialog.start("project_s_document");
      this.save("autosave", { silent: true });
    }

    finishProjectSReading() {
      this.effects.monitorEyes = 1.0;
      this.effects.ceoLightsOut = 3.0;
      this.finalBoss = {
        phase: "document_end",
        timer: 0,
        size: 120,
        infection: 18,
        questionIndex: 0,
        correct: 0,
        wrong: 0
      };
    }

    startFinalBossIntro() {
      this.flags.final_quiz_started = true;
      if (!this.finalBoss) {
        this.finalBoss = {
          phase: "reveal",
          timer: 0,
          size: 120,
          infection: 18,
          questionIndex: 0,
          correct: 0,
          wrong: 0
        };
      } else {
        this.finalBoss.phase = "reveal";
        this.finalBoss.timer = 0;
        this.finalBoss.size = 120;
      }
    }

    updateFinalBoss(delta) {
      if (!this.finalBoss) return;

      if (this.finalBoss.phase === "document_end") {
        this.finalBoss.timer += delta;
        if (this.finalBoss.timer >= 3.2) {
          this.startFinalBossIntro();
          this.finalBoss.timer = 0;
        }
        return;
      }

      if (this.finalBoss.phase === "reveal") {
        this.finalBoss.timer += delta;
        this.effects.finalShake = 0.25;
        this.finalBoss.size = 120;
        if (this.finalBoss.timer >= 1.8) {
          this.finalBoss.phase = "dialog";
          this.dialog.start("final_boss_intro");
        }
        return;
      }

      if (this.finalBoss.phase === "blackout") {
        this.finalBoss.timer += delta;
        this.effects.finalBlackout = 2.0;
        if (this.finalBoss.timer >= 1.2) {
          this.flags.final_quiz_complete = true;
          this.save("autosave", { silent: true });
        }
      }
    }

    beginFinalQuiz() {
      if (!this.finalBoss) return;
      this.finalBoss.phase = "quiz";
      this.quiz.startBossQuiz(this.finalBoss.questionIndex, "finalBoss");
    }

    resolveFinalQuizAnswer(isCorrect) {
      if (!this.finalBoss) return;

      if (isCorrect) {
        this.finalBoss.correct += 1;
        this.finalBoss.questionIndex += 1;
        this.finalBoss.infection = Math.max(0, this.finalBoss.infection - 3);
        if (this.finalBoss.correct >= 10) {
          this.finalBoss.phase = "clear";
          this.liminal.recordFinalQuizResult(this.finalBoss.wrong);
          this.dialog.start("final_quiz_clear");
          return;
        }
      } else {
        this.finalBoss.wrong += 1;
        this.finalBoss.infection += 5;
        this.finalBoss.size = Math.min(150, this.finalBoss.size + 8);
      }

      this.beginFinalQuiz();
    }

    finishFinalQuiz() {
      if (!this.finalBoss) return;
      this.finalBoss.phase = "battle_intro";
      this.finalBoss.timer = 0;
      this.effects.finalRootSpread = 2.0;
      this.dialog.start("final_battle_intro");
      this.save("autosave", { silent: true });
    }

    beginFinalBattle() {
      if (!this.finalBoss) return;

      this.finalBoss.phase = "battle_phase1";
      this.finalBoss.timer = 0;
      this.finalBoss.playerHp = 5;
      this.finalBoss.infection = Math.max(this.finalBoss.infection, 15);
      this.finalBoss.bullets = [];
      this.finalBoss.safeZones = [];
      this.finalBoss.phaseDuration = 30;
      this.flags.final_battle_started = true;
      this.pointClick.updateHotspotLayer();
      this.syncReliableInteractionLayer();
      this.save("autosave", { silent: true });
    }

    isFinalBattleActive() {
      return Boolean(this.finalBoss && ["battle_phase1", "battle_phase2", "battle_phase3", "qte"].includes(this.finalBoss.phase));
    }

    isFinalBattleBlocking() {
      return Boolean(this.finalBoss && ["battle_intro", "collapse", "escape_intro", "ending"].includes(this.finalBoss.phase));
    }

    updateFinalBattle(delta) {
      if (!this.finalBoss) return;

      if (this.finalBoss.phase === "battle_phase1") {
        this.updatePlayer(delta);
        this.updateFinalPhase1(delta);
      } else if (this.finalBoss.phase === "battle_phase2") {
        this.updatePlayer(delta);
        this.updateFinalPhase2(delta);
      } else if (this.finalBoss.phase === "battle_phase3") {
        this.updateFinalPhase3(delta);
      } else if (this.finalBoss.phase === "collapse") {
        this.updateFinalCollapse(delta);
      }

      if (this.shouldFailFinalBossBattle()) {
        this.failFinalBossBattle();
      }
    }

    shouldFailFinalBossBattle() {
      if (!this.finalBoss || this.flags.final_boss_defeated) return false;
      if (!["battle_phase1", "battle_phase2", "battle_phase3", "qte"].includes(this.finalBoss.phase)) return false;
      return (this.finalBoss.playerHp ?? 1) <= 0 || (this.finalBoss.infection || 0) >= 100;
    }

    failFinalBossBattle() {
      /*
        failFinalBossBattle()
        ---------------------------------------------------------------------
        Final boss failures are mid-route deaths, not full campaign resets.
        The linked ending restarts from the second-floor entrance with the
        crowbar and required access items restored, so the player can retry
        the final route without replaying the warehouse and first-floor bosses.
      */
      this.finalBoss = null;
      this.qte = null;
      this.effects.redGlitch = 0.35;
      this.effects.finalBlackout = 0.8;
      this.ending.show("bad_end_red_root_failed");
    }

    updateFinalPhase1(delta) {
      this.finalBoss.timer += delta;
      if (Math.floor(this.finalBoss.timer * 3) !== Math.floor((this.finalBoss.timer - delta) * 3)) {
        this.spawnFinalBeanBullet();
      }

      this.finalBoss.bullets.forEach((bullet) => {
        bullet.x += bullet.vx * delta;
        bullet.y += bullet.vy * delta;
      });
      this.finalBoss.bullets = this.finalBoss.bullets.filter((bullet) => bullet.x > -50 && bullet.x < 1330 && bullet.y > -50 && bullet.y < 770);
      this.checkFinalBulletHits();

      if (this.finalBoss.timer >= 30) {
        this.finalBoss.phase = "battle_phase2";
        this.finalBoss.timer = 0;
        this.finalBoss.phase2Elapsed = 0;
        this.finalBoss.bullets = [];
        this.finalBoss.safeZones = [];
      }
    }

    updateFinalPhase2(delta) {
      this.finalBoss.timer += delta;
      if (this.finalBoss.safeZones.length === 0 || this.finalBoss.timer >= 4) {
        this.finalBoss.timer = 0;
        this.finalBoss.safeZones = this.createFinalDangerZones();
      }

      this.finalBoss.safeZones.forEach((zone) => {
        zone.timer += delta;
        if (!zone.exploded && zone.timer >= 2.2) {
          zone.exploded = true;
          if (this.player.x > zone.x && this.player.x < zone.x + zone.width && this.player.y > zone.y && this.player.y < zone.y + zone.height) {
            this.finalBoss.playerHp = Math.max(0, this.finalBoss.playerHp - 1);
            this.finalBoss.infection += 5;
            this.effects.redGlitch = 0.12;
          }
        }
      });

      if ((this.finalBoss.phase2Elapsed || 0) >= 18) {
        this.finalBoss.phase = "battle_phase3";
        this.finalBoss.timer = 0;
        this.finalBoss.replicateProgress = 0;
        this.finalBoss.safeZones = [];
      } else {
        this.finalBoss.phase2Elapsed = (this.finalBoss.phase2Elapsed || 0) + delta;
      }
    }

    updateFinalPhase3(delta) {
      this.finalBoss.timer += delta;
      if (this.finalBoss.timer >= 8) {
        this.finalBoss.infection += 10;
        this.startFinalQte();
      }
    }

    updateFinalCollapse(delta) {
      /*
        최종 QTE 이후에는 붉은 심콩이 산산이 부서지는 짧은 정적이 필요합니다.
        이 상태는 플레이어 입력을 잠깐 막지만, 영구적으로 막히면 최종 보고서를
        읽을 수 없으므로 timer가 끝난 뒤 명시적으로 "defeated" 상태로 넘깁니다.
      */
      this.finalBoss.timer += delta;
      if (this.finalBoss.timer >= 1.8) {
        this.finalBoss.phase = "defeated";
        this.finalBoss.timer = 0;
      }
    }

    spawnFinalBeanBullet() {
      const startX = 650 + Math.random() * 240 - 120;
      const startY = 300 + Math.random() * 80;
      const dx = this.player.x - startX;
      const dy = this.player.y - startY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const speed = 115 + Math.random() * 40;

      this.finalBoss.bullets.push({
        x: startX,
        y: startY,
        vx: (dx / length) * speed,
        vy: (dy / length) * speed,
        hit: false
      });
    }

    checkFinalBulletHits() {
      this.finalBoss.bullets.forEach((bullet) => {
        if (bullet.hit) return;
        if (Math.hypot(bullet.x - this.player.x, bullet.y - (this.player.y - 22)) < 25) {
          bullet.hit = true;
          this.finalBoss.playerHp = Math.max(0, this.finalBoss.playerHp - 1);
          this.finalBoss.infection += 5;
          this.effects.redGlitch = 0.12;
        }
      });
    }

    createFinalDangerZones() {
      const zones = [];
      for (let i = 0; i < 3; i += 1) {
        zones.push({
          x: 220 + i * 260,
          y: 430 + (i % 2) * 70,
          width: 180,
          height: 92,
          timer: 0,
          exploded: false
        });
      }
      return zones;
    }

    handleQteInput(key) {
      if (!this.qte) return;

      const expected = this.qte.sequence[this.qte.index];
      const normalized = key === " " ? "SPACE" : key.toUpperCase();
      if (normalized === expected) {
        this.qte.index += 1;
        this.effects.whiteFlash = 0.08;
      }

      if (this.qte.index >= this.qte.sequence.length) {
        this.qte = null;
        this.dialog.start("final_qte_clear");
      }
    }

    startFinalQte() {
      if (this.qte) return;
      this.finalBoss.phase = "qte";
      this.qte = {
        sequence: ["A", "D", "A", "E", "Q", "SPACE"],
        index: 0
      };
    }

    finalBossCollapse() {
      if (!this.finalBoss) return;
      this.finalBoss.phase = "collapse";
      this.finalBoss.timer = 0;
      this.effects.finalRootSpread = 0;
      this.effects.simkongExplosion = 1.2;
      this.flags.final_boss_defeated = true;
      this.save("autosave", { silent: true });
    }

    readFinalReport() {
      this.flags.final_report_read = true;
      this.flags.doc_final_report = true;
      this.dialog.start("final_report");
      this.save("autosave", { silent: true });
    }

    startEscapeSequence() {
      this.flags.escape_sequence_started = true;
      /*
        실제 탈출 경로는 대표실 -> 복도 -> 디자인 스튜디오 -> 계단 -> 1층 ->
        창고 -> 경비실 -> 정문 순서입니다. 현재는 각 공간을 전부 새 전투 맵처럼
        확장하지 않고, 엔딩 직전의 숨 가쁜 이동을 대화 몽타주로 처리합니다.
        이후 필요하면 이 액션을 세부 플레이어블 탈출 시퀀스로 교체하면 됩니다.
      */
      this.dialog.start("escape_route_montage");
      this.save("autosave", { silent: true });
    }

    escapeToFrontDoor() {
      this.changeScene("company_exterior", { x: 640, y: 590 });
    }

    finishEscape() {
      this.effects.endingWhiteout = 2.0;
      this.flags.escape_finished = true;
      this.dialog.start("ending_morning");
      this.save("autosave", { silent: true });
    }

    showTrueEnding() {
      this.flags.true_end_reached = true;
      if (this.liminal.canReachPerfectTrueEnding()) {
        this.dialog.start("true_final_bean");
        this.save("autosave", { silent: true });
        return;
      }

      this.ending.show("true_end");
      this.scheduleSession(() => {
        /*
          크레딧은 ending modal로 먼저 보여주고, 일정 시간이 지나면 닫아서
          "검은 화면 위의 after credits 대사"가 모달 뒤에 가려지지 않게 합니다.
        */
        this.ui.hideModal();
        this.mode = "gameplay";
        this.effects.finalBlackout = 999;
        this.dialog.start("credits_cookie");
      }, 6200);
    }

    resolveTrueBeanChoice(choice) {
      this.flags.true_final_bean_choice = choice;

      if (choice === "burn") {
        this.dialog.start("true_bean_burn");
        return;
      }

      if (choice === "step") {
        this.ending.show("bad_end_infection");
        return;
      }

      if (choice === "take") {
        this.ending.show("bad_end_subject_s05");
        return;
      }

      this.ending.show("true_end");
    }

    getDocumentTotal() {
      return 7;
    }

    getDocumentCount() {
      return [
        "doc_warehouse_note_01",
        "doc_warehouse_note_02",
        "doc_warehouse_note_03",
        "doc_design_research",
        "doc_project_s",
        "doc_final_report",
        "doc_second_floor_memo"
      ].filter((flag) => this.flags[flag]).length;
    }

    save(slot, options = {}) {
      if (this.devSession || !this.scene.current) return false;
      const key = slot === "autosave" ? AUTOSAVE_KEY : SAVE_KEY;
      const payload = {
        version: SAVE_VERSION,
        savedAt: new Date().toISOString(),
        mode: this.mode,
        sceneId: this.scene.current.id,
        player: { x: this.player.x, y: this.player.y },
        flags: this.flags,
        inventory: this.inventory.serialize(),
        liminal: this.liminal.serialize(),
        playTime: this.playTime,
        runtime: {
          prologue: this.prologue, transition: this.transition, effects: this.effects,
          quickEvent: this.quickEvent, boxkeeperBoss: this.boxkeeperBoss,
          boss: this.boss, finalBoss: this.finalBoss, qte: this.qte,
          dialog: this.dialog.active ? { id: this.dialog.active.id, lineIndex: this.dialog.lineIndex } : null,
          puzzle: this.puzzle.active, quiz: this.quiz.activeBossQuiz,
          minigameId: this.minigame.current?.id || null, endingId: this.ending.currentId
        }
      };

      try {
        localStorage.setItem(key, JSON.stringify(payload));
      } catch (error) {
        console.error("Save failed.", error);
        if (!options.silent) {
          this.ui.showModal({
            title: "저장 실패",
            body: "저장 데이터를 쓸 수 없습니다.",
            actions: [{ label: "확인", callback: () => this.ui.hideModal() }]
          });
        }
        return;
      }

      if (!options.silent) {
        this.ui.showModal({
          title: "저장",
          body: slot === "autosave" ? "자동 저장되었습니다." : "저장되었습니다.",
          actions: [{ label: "확인", callback: () => this.ui.hideModal() }]
        });
      }
    }

    load(slot, options = {}) {
      try {
        const keys = slot === "latest" ? [AUTOSAVE_KEY, SAVE_KEY] : [slot === "autosave" ? AUTOSAVE_KEY : SAVE_KEY];
        const candidates = [];
        for (const key of keys) {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          try {
            const payload = JSON.parse(raw);
            this.validateSave(payload);
            candidates.push(payload);
          } catch (error) {
            if (slot !== "latest") throw error;
          }
        }
        const payload = candidates.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))[0];
        if (!payload) throw new Error("불러올 수 있는 저장 데이터가 없습니다.");
        this.resetTransientState();
        this.devSession = false;
        this.flags = payload.flags || {};
        this.inventory.hydrate(payload.inventory);
        this.liminal.hydrate(payload.liminal || {});
        this.playTime = payload.playTime || 0;
        this.scene.load(payload.sceneId);
        this.player.x = payload.player?.x ?? this.player.x;
        this.player.y = payload.player?.y ?? this.player.y;
        this.mode = payload.mode || "gameplay";
        const runtime = payload.runtime;
        if (runtime) {
          for (const key of ["prologue", "transition", "effects", "quickEvent", "boxkeeperBoss", "boss", "finalBoss", "qte"]) {
            if (runtime[key] != null) this[key] = runtime[key];
          }
          this.puzzle.active = runtime.puzzle || null;
          this.quiz.activeBossQuiz = runtime.quiz || null;
          if (runtime.dialog) {
            this.dialog.start(runtime.dialog.id);
            this.dialog.lineIndex = runtime.dialog.lineIndex;
            this.dialog.renderLine();
          }
          if (runtime.minigameId) this.minigame.start(runtime.minigameId);
        } else {
          // Version 10 did not save encounters; restart the current encounter safely.
          this.mode = "gameplay";
          this.onSceneReady(payload.sceneId);
          if (this.flags.final_quiz_started && !this.flags.final_boss_defeated && payload.sceneId === "ceo_office") this.startFinalBossIntro();
        }
        this.ui.setHudVisible(this.mode === "gameplay");
        this.ui.renderQuests();
        this.pointClick.renderInventory();
        document.getElementById("main-menu").classList.add("hidden");
        document.getElementById("settings-panel").classList.add("hidden");
        if (runtime?.endingId && this.mode === "ending") this.ending.show(runtime.endingId, { save: false });
        else if (!options.silent && !this.minigame.isOpen()) this.ui.showModal({
          title: "불러오기", body: "불러왔습니다.",
          actions: [{ label: "계속", callback: () => this.ui.hideModal() }]
        });
        return true;
      } catch (error) {
        if (!options.silent) this.ui.showModal({
          title: "불러오기 실패", body: error.message || "저장 데이터를 읽을 수 없습니다.",
          actions: [{ label: "확인", callback: () => this.ui.hideModal() }]
        });
        return false;
      }
    }

    validateSave(payload) {
      const object = (value) => value && typeof value === "object" && !Array.isArray(value);
      const valid = object(payload) && [10, SAVE_VERSION].includes(payload.version)
        && Object.hasOwn(window.OSSE.SCENE_DATA, payload.sceneId)
        && Number.isFinite(Date.parse(payload.savedAt))
        && object(payload.flags) && Array.isArray(payload.inventory)
        && payload.inventory.every((entry) => Array.isArray(entry) && typeof entry[0] === "string" && Number.isFinite(entry[1]) && entry[1] > 0)
        && object(payload.player) && Number.isFinite(payload.player.x) && Number.isFinite(payload.player.y)
        && Number.isFinite(payload.playTime) && payload.playTime >= 0;
      if (!valid) throw new Error("저장 데이터가 손상되었거나 지원하지 않는 버전입니다.");
      const runtime = payload.runtime;
      const finiteTree = (value) => {
        if (typeof value === "number") return Number.isFinite(value);
        return !value || typeof value !== "object" || Object.values(value).every(finiteTree);
      };
      if (!finiteTree(payload)) throw new Error("저장 데이터의 숫자가 올바르지 않습니다.");
      if (runtime && ["prologue", "transition", "effects", "quickEvent", "boxkeeperBoss", "boss", "finalBoss", "qte", "dialog", "puzzle", "quiz"].some((key) => runtime[key] != null && !object(runtime[key]))) throw new Error("저장된 진행 상태가 손상되었습니다.");
      if (runtime?.boss && (!Array.isArray(runtime.boss.bullets) || !Number.isFinite(runtime.boss.questionIndex))) throw new Error("전투 기록이 손상되었습니다.");
      if (runtime?.finalBoss?.phase?.startsWith("battle_phase") && (!Array.isArray(runtime.finalBoss.bullets) || !Array.isArray(runtime.finalBoss.safeZones))) throw new Error("최종전 기록이 손상되었습니다.");
      if (runtime?.qte && (!Array.isArray(runtime.qte.sequence) || !Number.isInteger(runtime.qte.index))) throw new Error("입력 기록이 손상되었습니다.");
      if (payload.version === SAVE_VERSION && (!object(runtime)
        || !["gameplay", "transition", "prologue", "ending"].includes(payload.mode)
        || (payload.mode === "ending" && !window.OSSE.ENDING_DATA[runtime.endingId])
        || (payload.mode === "transition" && !window.OSSE.SCENE_DATA[runtime.transition?.nextSceneId])
        || (runtime.dialog && (!this.dialog.data[runtime.dialog.id] || !Number.isInteger(runtime.dialog.lineIndex) || runtime.dialog.lineIndex < 0 || runtime.dialog.lineIndex >= this.dialog.data[runtime.dialog.id].lines.length))
        || (runtime.puzzle && !this.puzzle.getRule(runtime.puzzle.puzzleId))
        || (runtime.quiz && (!this.quiz.data[runtime.quiz.setId]?.[runtime.quiz.questionIndex] || !Array.isArray(runtime.quiz.choices)))
        || (runtime.minigameId && !window.OSSE.MINIGAME_DATA[runtime.minigameId]))) {
        throw new Error("저장된 진행 상태를 읽을 수 없습니다.");
      }
    }

    render() {
      const shake = this.getShakeAmount();

      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

      if (this.mode === "prologue") {
        this.drawPrologue();
      } else {
        this.drawScene();
        this.liminal.drawWorldMutations(this.ctx);
        if (this.mode === "gameplay") {
          if (!this.pointClick.enabled || this.shouldDrawPlayerDuringActionMode()) {
            this.liminal.drawShadowLag(this.ctx);
            this.drawPlayer();
            this.drawInteractionHint();
          }
          this.pointClick.draw(this.ctx);
          this.drawQuickEvent();
          this.drawPuzzleInput();
          this.drawBossQuiz();
        }
        if (this.mode === "transition") {
          this.drawTransitionFade();
        }
      }

      if (this.settings.values.bloom) {
        this.drawPixelBloom();
      }
      this.drawFog();
      this.drawDust();
      if (this.settings.values.crt) {
        this.drawCrtNoise();
      }
      this.drawEffectOverlays();
      this.liminal.drawOverlay(this.ctx);
      this.ctx.restore();
    }

    getShakeAmount() {
      const flickerPulse = Math.sin(this.totalTime * 34) > 0.96 ? 2.2 : 0.55;
      if (this.effects.heavyNoise > 0) {
        return 18;
      }
      if (this.effects.boxScare > 0) {
        return 8;
      }
      if (this.effects.finalShake > 0 || (this.finalBoss && ["reveal", "quiz"].includes(this.finalBoss.phase))) {
        return 5;
      }
      if (this.effects.heartbeat > 0 && this.boss && !this.flags.simkong_defeated) {
        return Math.sin(this.totalTime * 8) > 0.86 ? 6 : 1.4;
      }
      if (this.scene.current?.id === "guard_room" || this.scene.current?.id === "warehouse_01") {
        return flickerPulse;
      }
      return 0.8;
    }

    shouldDrawPlayerDuringActionMode() {
      /*
        포인트 앤 클릭 탐험 중에는 플레이어를 숨기지만, 보스전/최종전처럼
        위치 기반 회피가 필요한 구간에서는 캐릭터가 보여야 조작 의미가 생깁니다.
      */
      return Boolean(this.boss?.phase === "attack" || this.isFinalBattleActive());
    }

    drawPrologue() {
      const ctx = this.ctx;

      if (this.prologue.phase === "text") {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1280, 720);
        this.drawCrtStatic(0.16);

        const dialogId = this.prologue.lines[this.prologue.lineIndex];
        const line = window.OSSE.DIALOGUE_DATA[dialogId]?.lines?.[0] || "";
        const alpha = clamp(this.prologue.timer / 0.9, 0, 1);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "28px Courier New";
        ctx.textAlign = "center";
        ctx.fillText(line, 640, 360);
        ctx.globalAlpha = 1;
        return;
      }

      this.drawCompanyExterior();
      let coverAlpha = 0;

      if (this.prologue.phase === "exteriorFadeIn") {
        coverAlpha = 1 - clamp(this.prologue.timer / 1.25, 0, 1);
      } else if (this.prologue.phase === "exteriorHold") {
        coverAlpha = 0;
      } else if (this.prologue.phase === "exteriorFadeOut") {
        coverAlpha = clamp(this.prologue.timer / 0.9, 0, 1);
      }

      ctx.fillStyle = `rgba(0, 0, 0, ${coverAlpha})`;
      ctx.fillRect(0, 0, 1280, 720);
    }

    drawScene() {
      const renderer = this.scene.current.renderer;

      if (renderer === "boxkeeperBoss") {
        this.drawBoxkeeperBoss();
      } else if (this.isCurrentScenePhotoBacked()) {
        this.drawPhotoScene();
        if (renderer === "executiveOffice") {
          this.drawExecutivePhotoOverlay();
        } else if (renderer === "meetingRoom") {
          this.drawMeetingRoomOverlay();
        } else if (renderer === "ceoOffice") {
          this.drawCeoPhotoOverlay();
        }
      } else if (renderer === "companyExterior") {
        this.drawCompanyExterior();
      } else if (renderer === "guardRoom") {
        this.drawGuardRoom();
      } else if (renderer === "warehouse") {
        this.drawWarehouse();
      } else if (renderer === "officeCorridor") {
        this.drawOfficeCorridor();
      } else if (renderer === "office") {
        this.drawOffice();
      } else if (renderer === "executiveOffice") {
        this.drawExecutiveOffice();
      } else if (renderer === "secondFloorCorridor") {
        this.drawSecondFloorCorridor();
      } else if (renderer === "designStudio") {
        this.drawDesignStudio();
      } else if (renderer === "ceoDoorFront") {
        this.drawCeoDoorFront();
      } else if (renderer === "ceoOffice") {
        this.drawCeoOffice();
      } else if (renderer === "photo") {
        this.drawPhotoScene();
      } else {
        this.drawPrototypeOffice();
      }

      this.drawScenePropOverlays();

      if (!this.pointClick.enabled) {
        this.drawEvents();
      }
    }

    drawScenePropOverlays() {
      const sceneId = this.scene?.current?.id;
      const overlays = PROP_OVERLAYS[sceneId] || [];
      if (overlays.length === 0) return;

      overlays.forEach((overlay) => {
        if (overlay.requiresFlag && !this.flags[overlay.requiresFlag]) return;
        if (overlay.blockedByFlag && this.flags[overlay.blockedByFlag]) return;
        if (overlay.requiresCount) {
          const [flagName, minimumValue] = overlay.requiresCount;
          if ((this.flags[flagName] || 0) < minimumValue) return;
        }

        const image = this.getCharacterImage(overlay.path);
        if (!image.complete || image.naturalWidth <= 0) return;

        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = overlay.alpha ?? 1;
        ctx.shadowColor = overlay.shadowColor || "rgba(0, 0, 0, 0.50)";
        ctx.shadowBlur = overlay.shadowBlur ?? 10;
        ctx.shadowOffsetY = overlay.shadowOffsetY ?? 8;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, overlay.x, overlay.y, overlay.width, overlay.height);
        ctx.restore();
      });
    }

    isCurrentScenePhotoBacked() {
      /*
        isCurrentScenePhotoBacked()
        ---------------------------------------------------------------------
        실제 회사 사진이 연결된 Scene인지 확인합니다.

        기존 렌더러들은 픽셀 아트 프로토타입 시절의 배경 도형을 직접 그립니다.
        사진을 연결한 뒤에도 그 렌더러를 그대로 타면 사진 위를 다시 어두운 도형으로
        덮어버려서, 사용자가 "이미지가 반영되지 않았다"고 느끼게 됩니다.

        따라서 assets/photos/ 아래의 최적화 사진을 가진 Scene은 공용 사진 렌더러를
        우선 사용합니다. 이벤트, 대사, 퍼즐, 플래그는 Scene 데이터 그대로 유지됩니다.
      */
      return Boolean(
        this.scene?.current?.background?.startsWith("assets/photos/")
        || this.scene?.current?.background?.startsWith("assets/runtime/photos/")
      );
    }

    drawPhotoScene() {
      /*
        drawPhotoScene()
        ---------------------------------------------------------------------
        Cube Escape 방식의 확대 사진 Scene을 그리는 공용 렌더러입니다.

        기존 전용 렌더러는 픽셀 아트 더미 배경을 직접 그리는 역할이 강합니다.
        반면 확대 장면은 실제 사진 1장을 중심으로 보여줘야 하므로, 이 함수는
        scene.backgroundImage를 화면 전체에 그리고 가벼운 비네트만 얹습니다.

        이렇게 별도 함수로 분리해두면:
        - 새로운 확대 Scene을 추가할 때 game.js에 렌더러 함수를 계속 늘리지 않아도 됩니다.
        - 실제 사진 교체 시 scene.js의 PHOTO_ASSETS만 바꾸면 됩니다.
        - 기존 렌더러와 기존 이벤트 시스템은 그대로 유지됩니다.
      */
      const ctx = this.ctx;

      if (this.scene.backgroundImage.complete) {
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
      } else {
        ctx.fillStyle = "#050607";
        ctx.fillRect(0, 0, 1280, 720);
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
      ctx.fillRect(0, 0, 1280, 720);

      const vignette = ctx.createRadialGradient(640, 360, 240, 640, 360, 820);
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.26)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 1280, 720);
    }

    drawCompanyExterior() {
      const ctx = this.ctx;
      const flicker = Math.sin(this.totalTime * 18) > 0.82 ? 0.85 : 0.18;

      if (this.isCurrentScenePhotoBacked()) {
        this.drawPhotoScene();

        /*
          실제 외관 사진 위에만 얹는 작은 2층 창문 깜빡임입니다.
          사진을 가리지 않고, 스토리 단서만 유지합니다.
        */

        /*
          사진 기반 화면에서는 붉은 비상등의 위치를 반투명 타원으로 칠하면
          실제 사진 위에 "떠 있는 도형"처럼 보여 몰입을 깹니다.
          비상등 활성 여부는 창고문 핫스팟 표시로 충분히 전달하고,
          조명 연출은 추후 실제 비상등 사진/영상 소스가 들어왔을 때 다시 확장합니다.
        */
        return;
      }

      // TODO : Replace Image
      // 회사 외관 이미지는 아직 dummy.png입니다. 실제 외관 아트가 준비되면
      // scene.js의 company_exterior.background만 교체하면 됩니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.08;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#07090b";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#101415";
      ctx.fillRect(300, 105, 680, 450);
      ctx.fillStyle = "#070808";
      ctx.fillRect(260, 555, 760, 55);
      ctx.fillStyle = "#161a1b";
      ctx.fillRect(560, 356, 160, 202);

      for (let floor = 0; floor < 4; floor += 1) {
        for (let col = 0; col < 6; col += 1) {
          const x = 355 + col * 92;
          const y = 150 + floor * 82;
          ctx.fillStyle = "#0b0e10";
          ctx.fillRect(x, y, 56, 36);
        }
      }

      ctx.globalAlpha = flicker;
      ctx.fillStyle = "#f2e7b8";
      ctx.fillRect(632, 232, 56, 36);
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#1a1d1f";
      ctx.fillRect(118, 392, 172, 150);
      ctx.fillStyle = "#0b0d0f";
      ctx.fillRect(155, 425, 102, 118);
      ctx.fillStyle = "rgba(216, 230, 219, 0.18)";
      ctx.fillRect(168, 412, 78, 18);

      if (this.flags.warehouse_emergency_light_on) {
        const pulse = 0.45 + Math.sin(this.totalTime * 5) * 0.18;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#d12a2a";
        ctx.fillRect(988, 430, 150, 142);
        ctx.globalAlpha = 0.24;
        ctx.fillStyle = "#ff2a2a";
        ctx.beginPath();
        ctx.ellipse(1062, 520, 220, 90, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#202222";
      ctx.fillRect(0, 610, 1280, 110);
      ctx.fillStyle = "#101112";
      ctx.fillRect(0, 660, 1280, 60);

      ctx.fillStyle = "#b5b0a2";
      ctx.font = "28px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("OSSE Inc.", 640, 92);
    }

    drawGuardRoom() {
      const ctx = this.ctx;
      const flicker = Math.sin(this.totalTime * 22) > 0.72 ? 1 : 0.45;

      // TODO : Replace Image
      // 경비실 내부 배경도 현재는 dummy.png만 사용합니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.07;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#141617";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#2a2c2c";
      ctx.fillRect(110, 116, 1060, 510);
      ctx.fillStyle = "#1c1f20";
      ctx.fillRect(110, 300, 1060, 326);
      ctx.fillStyle = "#101213";
      ctx.fillRect(110, 626, 1060, 94);

      ctx.globalAlpha = 0.35 + flicker * 0.35;
      ctx.fillStyle = "#f1eed4";
      ctx.fillRect(520, 128, 240, 18);
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#202425";
      ctx.fillRect(260, 390, 300, 110);
      ctx.fillStyle = "#f5f5f0";
      ctx.fillRect(320, 316, 170, 100);
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fillRect(332, 328, 146, 76);

      ctx.fillStyle = "#191b1c";
      ctx.beginPath();
      ctx.arc(880, 220, 54, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d5d0bd";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#d5d0bd";
      ctx.font = "20px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("2:13", 880, 228);

      ctx.fillStyle = "#0f1011";
      ctx.fillRect(980, 328, 92, 270);
      ctx.fillStyle = "#232525";
      ctx.fillRect(998, 352, 58, 120);

      this.drawGuardRoomObjects();
    }

    drawGuardRoomObjects() {
      const ctx = this.ctx;
      const beanCount = Math.min(34, (this.flags.chair_inspection_count || 0) * 7 + (this.flags.got_security_access_card ? 8 : 0));

      ctx.fillStyle = "#181b1c";
      ctx.fillRect(252, 438, 94, 22);
      ctx.fillStyle = "#303436";
      ctx.fillRect(270, 458, 58, 78);
      ctx.fillStyle = "#1a1d1e";
      ctx.fillRect(284, 536, 12, 36);
      ctx.fillRect(308, 536, 12, 36);

      for (let i = 0; i < beanCount; i += 1) {
        const x = 262 + (i * 19) % 78;
        const y = 446 + ((i * 11) % 76);
        ctx.fillStyle = i % 3 === 0 ? "#7d1717" : "#a32626";
        ctx.fillRect(x, y, 5, 4);
      }

      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#7a1414";
      ctx.beginPath();
      ctx.ellipse(392, 586, 116, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#272a2b";
      ctx.fillRect(388, 390, 220, 116);
      ctx.fillStyle = "#151718";
      ctx.fillRect(440, 310, 128, 82);
      ctx.fillStyle = "#f5f5f0";
      ctx.fillRect(452, 322, 104, 56);

      ctx.fillStyle = "#0b0c0d";
      ctx.fillRect(650, 298, 180, 120);
      for (let i = 0; i < 4; i += 1) {
        const x = 662 + (i % 2) * 82;
        const y = 310 + Math.floor(i / 2) * 52;
        ctx.fillStyle = i === 2 ? "#252928" : "#020303";
        ctx.fillRect(x, y, 70, 42);
      }

      if (!this.flags.got_security_access_card) {
        ctx.fillStyle = "#d7d1bd";
        ctx.fillRect(482, 535, 40, 24);
        ctx.fillStyle = "#445a5e";
        ctx.fillRect(488, 541, 28, 5);
      }

      ctx.fillStyle = "#1b1d1e";
      ctx.fillRect(882, 516, 66, 84);
      ctx.fillStyle = "#303334";
      ctx.fillRect(890, 506, 50, 12);
    }

    drawWarehouse() {
      const ctx = this.ctx;
      const lampPulse = Math.sin(this.totalTime * 10) > 0.86 ? 0.9 : 0.38;

      // TODO : Replace Image
      // 1층 창고 배경도 현재는 dummy.png만 사용합니다. 실제 창고 배경이 준비되면
      // scene.js의 warehouse_01.background를 교체하거나 타일맵 로더를 추가하면 됩니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.06;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#101213";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#222627";
      ctx.fillRect(72, 108, 1136, 560);
      ctx.fillStyle = "#171a1b";
      ctx.fillRect(72, 262, 1136, 406);

      for (let i = 0; i < 9; i += 1) {
        const x = 120 + i * 124;
        ctx.globalAlpha = i % 3 === 0 ? lampPulse : 0.16;
        ctx.fillStyle = "#efeacb";
        ctx.fillRect(x, 124, 72, 12);
      }
      ctx.globalAlpha = 1;

      for (let depth = 0; depth < 8; depth += 1) {
        const y = 282 + depth * 42;
        ctx.globalAlpha = 0.16 - depth * 0.012;
        ctx.fillStyle = "#d8d0b8";
        ctx.fillRect(240 + depth * 24, y, 760 - depth * 48, 2);
      }
      ctx.globalAlpha = 1;

      this.drawWarehouseObjects();
    }

    drawWarehouseObjects() {
      const ctx = this.ctx;

      for (let i = 0; i < 30; i += 1) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const x = 140 + col * 92 + (row % 2) * 24;
        const y = 338 + row * 58;
        ctx.fillStyle = i % 4 === 0 ? "#74644b" : "#8a7352";
        ctx.fillRect(x, y, 62, 42);
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.fillRect(x + 6, y + 7, 50, 3);
      }

      ctx.fillStyle = "#6d5336";
      ctx.fillRect(185, 420, 130, 26);
      ctx.fillRect(185, 450, 130, 18);
      ctx.fillStyle = "#2a2d2e";
      ctx.fillRect(474, 382, 140, 58);
      ctx.fillStyle = "#ad8b3e";
      ctx.fillRect(500, 350, 74, 44);
      ctx.fillStyle = "#111";
      ctx.fillRect(482, 438, 28, 28);
      ctx.fillRect(580, 438, 28, 28);

      ctx.fillStyle = "#bfc4bd";
      ctx.fillRect(692, 376, 38, 94);
      ctx.strokeStyle = "#e3e5df";
      ctx.lineWidth = 2;
      ctx.strokeRect(692, 376, 38, 94);

      ctx.fillStyle = "#9a805b";
      ctx.fillRect(812, 374, 122, 78);
      ctx.fillStyle = "#7d694c";
      ctx.fillRect(840, 330, 88, 48);

      ctx.fillStyle = "#77705f";
      ctx.beginPath();
      ctx.ellipse(1056, 530, 48, 54, 0, 0, Math.PI * 2);
      ctx.ellipse(1102, 536, 42, 48, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#5b6264";
      ctx.lineWidth = 5;
      ctx.strokeRect(1038, 250, 126, 206);
      for (let y = 298; y < 440; y += 48) {
        ctx.beginPath();
        ctx.moveTo(1038, y);
        ctx.lineTo(1164, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#111314";
      ctx.fillRect(1122, 442, 84, 154);
      ctx.strokeStyle = "#6d7070";
      ctx.strokeRect(1122, 442, 84, 154);
      ctx.fillStyle = "#1e2325";
      ctx.fillRect(1060, 472, 44, 62);

      ctx.fillStyle = "#202526";
      ctx.fillRect(650, 136, 370, 190);
      ctx.fillStyle = "#343839";
      ctx.fillRect(760, 232, 122, 60);
      ctx.fillStyle = "#121415";
      ctx.fillRect(790, 188, 72, 54);
      ctx.fillStyle = "#c5c9bd";
      ctx.fillRect(800, 198, 52, 30);
      ctx.fillStyle = "#2d3132";
      ctx.fillRect(910, 196, 78, 118);
      ctx.fillStyle = "#d7d9cf";
      ctx.fillRect(670, 150, 140, 66);
      ctx.fillStyle = "#777c78";
      ctx.font = "16px Courier New";
      ctx.fillText("_1_3", 704, 190);

      if (this.flags.warehouse_red_bean_visible && !this.flags.warehouse_red_bean_touched) {
        const twitch = Math.sin(this.totalTime * Math.PI) > 0.92 ? 1 : 0;
        ctx.fillStyle = "#a32020";
        ctx.fillRect(842 + twitch, 538, 7, 6);
      }

      if (this.flags.warehouse_red_bean_touched) {
        ctx.fillStyle = "#501010";
        ctx.fillRect(840, 556, 5, 4);
      }

      if (this.flags.warehouse_exit_scare_done) {
        ctx.fillStyle = "#9c2020";
        ctx.fillRect(232, 590, 6, 5);
      }

      if (this.flags.warehouse_lock_fail_bean) {
        ctx.fillStyle = "#9c2020";
        ctx.fillRect(1078, 540, 6, 5);
      }
    }

    drawOfficeCorridor() {
      const ctx = this.ctx;

      // TODO : Replace Image
      // 1층 사무실 복도 배경도 현재는 dummy.png만 사용합니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.05;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#151718";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#2b2f30";
      ctx.fillRect(80, 170, 1120, 420);
      ctx.fillStyle = "#1d2021";
      ctx.fillRect(80, 430, 1120, 210);

      for (let i = 0; i < 8; i += 1) {
        const x = 150 + i * 130;
        const shouldTurnOff = this.effects.officeLightsOut > 0 && i < Math.floor((1.8 - this.effects.officeLightsOut) * 5);
        ctx.globalAlpha = shouldTurnOff ? 0.06 : 0.5;
        ctx.fillStyle = "#eee8c8";
        ctx.fillRect(x, 192, 74, 12);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#0e1011";
      ctx.fillRect(92, 450, 86, 146);
      ctx.strokeStyle = "#5d6263";
      ctx.strokeRect(92, 450, 86, 146);

      ctx.fillStyle = "#121415";
      ctx.fillRect(960, 374, 150, 230);
      ctx.strokeStyle = this.flags.office_keypad_enabled ? "#d8d0b8" : "#555";
      ctx.strokeRect(960, 374, 150, 230);
      ctx.fillStyle = this.flags.office_keypad_enabled ? "#6fa98e" : "#384042";
      ctx.fillRect(946, 430, 58, 72);
      ctx.fillStyle = "#222";
      ctx.fillRect(1018, 430, 54, 72);
    }

    drawOffice() {
      const ctx = this.ctx;
      const flicker = Math.sin(this.totalTime * 18) > 0.9 ? 0.26 : 0.56;

      // TODO : Replace Image
      // OSSE 사무실 내부도 현재는 dummy.png만 사용합니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.05;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#191c1d";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#303435";
      ctx.fillRect(74, 126, 1132, 512);
      ctx.fillStyle = "#202324";
      ctx.fillRect(74, 430, 1132, 208);

      for (let i = 0; i < 7; i += 1) {
        ctx.globalAlpha = flicker;
        ctx.fillStyle = "#eee8c8";
        ctx.fillRect(170 + i * 140, 146, 78, 12);
      }
      ctx.globalAlpha = 1;

      this.drawOfficeObjects();
    }

    drawOfficeObjects() {
      const ctx = this.ctx;

      for (let i = 0; i < 5; i += 1) {
        const x = 320 + i * 142;
        ctx.fillStyle = "#363a3b";
        ctx.fillRect(x, 390, 118, 72);
        ctx.fillStyle = "#101213";
        ctx.fillRect(x + 36, 328, 62, 46);
        ctx.fillStyle = "#d8d8cf";
        ctx.fillRect(x + 42, 334, 50, 30);
        ctx.fillStyle = "#1f2223";
        ctx.fillRect(x + 54, 374, 24, 14);
      }

      ctx.fillStyle = "#363a3b";
      ctx.fillRect(538, 360, 116, 68);
      ctx.fillStyle = "#c7c6bd";
      ctx.fillRect(552, 374, 88, 18);
      ctx.fillStyle = "#2b3031";
      ctx.fillRect(730, 326, 84, 140);
      ctx.fillStyle = "#d8d9cf";
      ctx.fillRect(858, 278, 146, 86);
      ctx.fillStyle = "#575d59";
      ctx.font = "14px Courier New";
      ctx.fillText("상무실", 904, 324);
      ctx.fillStyle = "#3b4041";
      ctx.fillRect(980, 424, 118, 92);
      ctx.fillStyle = "#141617";
      ctx.fillRect(176, 300, 96, 124);
      ctx.fillRect(1084, 292, 92, 180);

      if (!this.flags.office_beans_resolved) {
        for (let i = 0; i < 12; i += 1) {
          ctx.fillStyle = "#9d2020";
          ctx.fillRect(238 + (i * 17) % 82, 566 + (i * 11) % 38, 6, 5);
        }
      }

      if (this.flags.office_bean_juice_seen) {
        ctx.globalAlpha = clamp(this.effects.beanJuice / 3.8, 0.18, 0.5);
        ctx.fillStyle = "#8e1717";
        ctx.beginPath();
        ctx.ellipse(280, 592, 70, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (this.effects.footprintTrail > 0) {
        ctx.globalAlpha = clamp(this.effects.footprintTrail / 5.2, 0, 0.42);
        ctx.fillStyle = "#7d1414";
        for (let i = 0; i < 5; i += 1) {
          ctx.fillRect(330 + i * 42, 590 - i * 18, 18, 8);
        }
        ctx.globalAlpha = 1;
      }
    }

    drawBoxkeeperBoss() {
      const ctx = this.ctx;

      this.drawPhotoScene();

      ctx.fillStyle = "rgba(0, 0, 0, 0.46)";
      ctx.fillRect(0, 0, 1280, 720);

      const sprite = this.getCharacterImage("assets/runtime/characters/boxman.png");
      const spriteReady = sprite.complete && sprite.naturalWidth > 0;
      const bob = Math.sin(this.totalTime * 2.4) * 6;

      if (spriteReady) {
        const targetHeight = 860;
        const targetWidth = targetHeight * (sprite.naturalWidth / sprite.naturalHeight);
        const x = 640 - targetWidth / 2;
        const y = 98 + bob;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
        ctx.shadowBlur = 28;
        ctx.shadowOffsetY = 20;
        ctx.drawImage(sprite, x, y, targetWidth, targetHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = "#b78243";
        ctx.fillRect(480, 190 + bob, 320, 300);
        ctx.fillStyle = "#1a1c1d";
        ctx.font = "24px Courier New";
        ctx.textAlign = "center";
        ctx.fillText("BOXKEEPER", 640, 360);
      }

      const phaseLabel = this.flags.boxkeeper_cleared
        ? "처리 완료"
        : this.flags.boxkeeper_phase_delivery
          ? "배송 오류 처리 중"
          : this.flags.boxkeeper_phase_packing
            ? "포장 작업 중"
            : this.flags.boxkeeper_phase_inventory
              ? "재고 검수 중"
              : "입고 대기";

      ctx.fillStyle = "rgba(8, 9, 9, 0.78)";
      ctx.fillRect(74, 70, 360, 116);
      ctx.strokeStyle = "rgba(255, 226, 120, 0.74)";
      ctx.lineWidth = 2;
      ctx.strokeRect(74, 70, 360, 116);
      ctx.fillStyle = "#ffe278";
      ctx.font = "22px Courier New";
      ctx.textAlign = "left";
      ctx.fillText("BOXKEEPER / 박스키퍼", 96, 108);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "15px Courier New";
      ctx.fillText(`현재 업무: ${phaseLabel}`, 96, 142);
      ctx.fillText("입고 · 검수 · 포장 · 배송", 96, 166);

      if (!this.flags.boxkeeper_cleared) {
        ctx.globalAlpha = 0.7 + Math.sin(this.totalTime * 7) * 0.12;
        ctx.fillStyle = "#9c2020";
        ctx.fillRect(838, 130, 12, 12);
        ctx.fillRect(870, 154, 10, 10);
        ctx.fillRect(902, 116, 14, 14);
        ctx.globalAlpha = 1;
      }
    }

    drawExecutivePhotoOverlay() {
      const ctx = this.ctx;
      const bossLight = this.boss ? this.boss.lightIndex : 4;

      if (this.boss && !this.flags.simkong_defeated) {
        ctx.fillStyle = `rgba(0, 0, 0, ${bossLight < 4 ? 0.58 : 0.28})`;
        ctx.fillRect(0, 0, 1280, 720);
        this.drawSimkong();
        return;
      }

      if (!this.flags.simkong_boss_started && !this.flags.simkong_defeated) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#9c2020";
        ctx.beginPath();
        ctx.ellipse(646, 404, 14, 10, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (this.flags.simkong_defeated && !this.flags.got_second_floor_auth_card) {
        ctx.fillStyle = "rgba(10, 12, 14, 0.72)";
        ctx.fillRect(548, 392, 190, 62);
        ctx.strokeStyle = "#d8d0b8";
        ctx.strokeRect(548, 392, 190, 62);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "15px Courier New";
        ctx.textAlign = "center";
        ctx.fillText("서랍이 열려 있다", 643, 429);
      }
    }

    drawCeoPhotoOverlay() {
      if ((this.flags.project_s_read || this.finalBoss) && !this.flags.final_boss_defeated) {
        this.drawFinalBossCore();
      }

      if (this.finalBoss && ["battle_intro", "battle_phase1", "battle_phase2", "battle_phase3", "qte", "collapse"].includes(this.finalBoss.phase)) {
        this.drawFinalBattleOverlay();
      }
    }

    drawMeetingRoomOverlay() {
      const ctx = this.ctx;

      if (this.boss && !this.flags.simkong_defeated) {
        const bossLight = this.boss.lightIndex ?? 4;
        ctx.fillStyle = `rgba(0, 0, 0, ${bossLight < 4 ? 0.42 : 0.18})`;
        ctx.fillRect(0, 0, 1280, 720);
        this.drawSimkong();
        return;
      }

      if (this.flags.simkong_defeated && !this.flags.got_second_floor_auth_card) {
        ctx.save();
        ctx.fillStyle = "rgba(10, 12, 14, 0.72)";
        ctx.fillRect(590, 486, 160, 54);
        ctx.strokeStyle = "#d8d0b8";
        ctx.strokeRect(590, 486, 160, 54);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "15px Courier New";
        ctx.textAlign = "center";
        ctx.fillText("서랍이 열려 있다", 670, 520);
        ctx.restore();
      }
    }

    drawExecutiveOffice() {
      const ctx = this.ctx;
      const bossLight = this.boss ? this.boss.lightIndex : 4;

      // TODO : Replace Image
      // 상무실 배경과 심콩 스프라이트도 현재는 dummy.png/캔버스 도형입니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.04;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#050606";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = bossLight > 0 || this.flags.simkong_defeated ? "#1b1e1f" : "#070808";
      ctx.fillRect(110, 118, 1060, 520);
      ctx.fillStyle = bossLight > 1 || this.flags.simkong_defeated ? "#2b2f30" : "#0b0c0d";
      ctx.fillRect(250, 382, 780, 170);
      ctx.fillStyle = "#121415";
      ctx.fillRect(110, 570, 1060, 92);

      for (let index = 0; index < 4; index += 1) {
        if (bossLight > index || this.flags.simkong_defeated) {
          ctx.globalAlpha = 0.28 + index * 0.08;
          ctx.fillStyle = "#eee8c8";
          ctx.fillRect(250 + index * 210, 142, 112, 14);
        }
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#303435";
      ctx.fillRect(530, 372, 228, 92);
      ctx.fillStyle = "#1c1f20";
      ctx.fillRect(560, 396, 168, 52);

      if (!this.flags.simkong_defeated) {
        this.drawSimkong();
      } else {
        ctx.fillStyle = "#9c2020";
        ctx.fillRect(642, 388, 7, 6);
      }

      if (this.flags.simkong_defeated && !this.flags.got_second_floor_auth_card) {
        ctx.fillStyle = "#d8d0b8";
        ctx.fillRect(590, 408, 112, 28);
      }
    }

    drawSimkong() {
      if (!this.boss) return;

      const ctx = this.ctx;
      const size = this.boss.phase === "defeated" ? 0 : this.boss.size;
      if (size <= 0) return;

      const x = this.boss.beanX;
      const y = this.boss.beanY;
      const infection = clamp(this.boss.infection / 40, 0, 1);
      const spritePath = "assets/runtime/characters/boss_before.png";
      const sprite = this.getCharacterImage(spritePath);
      const spriteReady = sprite.complete && sprite.naturalWidth > 0;

      if (spriteReady) {
        /*
          심콩 PNG 렌더링
          -------------------------------------------------------------------
          들어온 PNG는 투명 배경 캐릭터이므로, 기존 배경/책상/조명 위에
          바로 합성합니다. grow 단계에서는 기존 size 값을 이용해 점점 커지는
          느낌을 유지하고, quiz/attack 단계에서는 플레이어 키 정도로 고정합니다.
        */
        const appearRatio = this.boss.phase === "appear"
          ? clamp(this.boss.timer / 0.8, 0, 1)
          : 1;
        const targetHeight = 760;
        const targetWidth = targetHeight * (sprite.naturalWidth / sprite.naturalHeight);
        const cropY = 74 + Math.sin(this.totalTime * 2.2) * 3;
        ctx.save();
        ctx.globalAlpha = (this.boss.phase === "clear" ? 0.88 : 1) * (0.28 + appearRatio * 0.72);
        ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 16;
        ctx.drawImage(sprite, x - targetWidth / 2, cropY, targetWidth, targetHeight);
        ctx.restore();

        if (infection > 0.05 && this.boss.phase !== "clear") {
          ctx.globalAlpha = 0.14 + infection * 0.22;
          ctx.fillStyle = "#b21717";
          ctx.beginPath();
          ctx.ellipse(x + size * 0.52, y - size * 0.38, size * 0.38, size * 0.5, -0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        /*
          이미지가 아직 로딩되지 않았거나 파일이 교체 중일 때 사용하는 fallback입니다.
          기존 보스전이 빈 화면이 되지 않도록 원래의 단순 픽셀 콩 형태를 유지합니다.
        */
        ctx.fillStyle = "#c8b67b";
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.55, size * 0.72, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.35 + infection * 0.45;
        ctx.fillStyle = "#9c2020";
        ctx.beginPath();
        ctx.ellipse(x + size * 0.16, y + size * 0.08, size * 0.26, size * 0.4, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#111";
        ctx.fillRect(x - size * 0.18, y - size * 0.18, 7, 7);
        ctx.fillStyle = "#d31919";
        ctx.fillRect(x + size * 0.16, y - size * 0.18, 8, 8);
        ctx.fillStyle = "#111";
        ctx.fillRect(x - 12, y + size * 0.16, 26, 4);
      }

      if (["attack", "quiz"].includes(this.boss.phase)) {
        ctx.fillStyle = "#9c2020";
        this.boss.bullets.forEach((bullet) => {
          if (!bullet.hit) {
            ctx.fillRect(bullet.x - 5, bullet.y - 5, 10, 10);
          }
        });
      }

      if (this.boss.phase === "attack") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
        ctx.fillRect(86, 84, 240, 40);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "15px Courier New";
        ctx.textAlign = "left";
        ctx.fillText(`체력 ${this.boss.playerHp} / 클릭으로 회피`, 100, 110);
      }

      if (this.boss.phase === "explosion") {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "#d8d0b8";
        for (let i = 0; i < 80; i += 1) {
          ctx.fillRect((i * 47) % 1280, (this.totalTime * 180 + i * 31) % 720, 5, 6);
        }
        ctx.globalAlpha = 1;
      }
    }

    drawSecondFloorCorridor() {
      const ctx = this.ctx;
      const shift = this.flags.second_floor_shift || 0;

      // TODO : Replace Image
      // 2층 복도 배경도 현재는 dummy.png만 사용합니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.04;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#111314";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#2b2f30";
      ctx.fillRect(72, 132, 1136, 505);
      ctx.fillStyle = "#1b1e1f";
      ctx.fillRect(72, 410, 1136, 227);

      for (let i = 0; i < 7; i += 1) {
        ctx.globalAlpha = i % 2 === 0 ? 0.34 : 0.08;
        ctx.fillStyle = "#eee8c8";
        ctx.fillRect(160 + i * 145, 154, 74, 12);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#010101";
      for (let i = 0; i < 4; i += 1) {
        ctx.fillRect(250 + i * 150, 190, 120, 92);
      }

      ctx.fillStyle = "#101213";
      ctx.fillRect(600, 314, 98, 160);
      ctx.fillRect(930, 314, 120, 176);
      ctx.fillRect(1100, 316, 84, 174);
      ctx.fillStyle = "#d8d0b8";
      ctx.font = "18px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("DESIGN STUDIO", 990, 304);
      if (this.flags.got_crowbar) {
        ctx.fillText("대표실", 1142, 306);
      }

      ctx.fillStyle = "#d8d0b8";
      ctx.fillRect(440 + shift * 18, 396, 70, 120);
      ctx.fillStyle = "#284235";
      ctx.fillRect(760 - shift * 14, 452, 42, 72);
      ctx.fillStyle = "#424446";
      ctx.fillRect(830, 472, 58, 38);
      ctx.strokeStyle = "#7d1f1f";
      ctx.strokeRect(180 + shift * 22, 430, 28, 72);
    }

    drawDesignStudio() {
      const ctx = this.ctx;
      const shifted = this.flags.design_room_shifted ? 28 : 0;

      // TODO : Replace Image
      // 디자인 스튜디오 배경과 작업물 이미지도 현재는 dummy.png만 사용합니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.05;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#171a1b";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#303435";
      ctx.fillRect(78, 112, 1124, 530);
      ctx.fillStyle = "#202324";
      ctx.fillRect(78, 430, 1124, 212);

      for (let i = 0; i < 6; i += 1) {
        ctx.globalAlpha = Math.sin(this.totalTime * 15 + i) > 0.72 ? 0.1 : 0.45;
        ctx.fillStyle = "#eee8c8";
        ctx.fillRect(180 + i * 160, 136, 78, 12);
      }
      ctx.globalAlpha = 1;

      for (let i = 0; i < 5; i += 1) {
        const x = 300 + i * 145 + (i % 2 ? shifted : 0);
        ctx.fillStyle = "#393d3e";
        ctx.fillRect(x, 390, 118, 70);
        ctx.fillStyle = i < 2 ? "#d8d8cf" : "#151718";
        ctx.fillRect(x + 34, 326, 64, 46);
        ctx.fillStyle = "#161819";
        ctx.fillRect(x + 42, 430, 76, 28);
      }

      ctx.fillStyle = "#222627";
      ctx.fillRect(970 - shifted, 282, 96, 172);
      if (!this.flags.got_crowbar) {
        ctx.fillStyle = "#8a8c85";
        ctx.fillRect(1090, 508, 58, 10);
      }
      ctx.fillStyle = "#c2bda8";
      ctx.fillRect(720 + shifted, 484, 130, 68);
      ctx.fillStyle = "#111";
      ctx.fillRect(86, 470, 86, 154);
    }

    drawCeoDoorFront() {
      const ctx = this.ctx;

      // TODO : Replace Image
      // 대표실 문 앞도 현재는 dummy.png만 사용합니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.04;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#111314";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#282c2d";
      ctx.fillRect(120, 150, 1040, 490);
      ctx.fillStyle = "#1b1e1f";
      ctx.fillRect(120, 420, 1040, 220);
      ctx.fillStyle = "#101213";
      ctx.fillRect(570, 260, 150, 250);
      ctx.strokeStyle = "#5a5d5e";
      ctx.strokeRect(570, 260, 150, 250);
      ctx.fillStyle = "#d8d0b8";
      ctx.font = "22px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("대표실", 645, 246);

      if (!this.flags.ceo_door_event_done) {
        ctx.strokeStyle = "#56504b";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(548, 386);
        ctx.lineTo(746, 460);
        ctx.moveTo(548, 456);
        ctx.lineTo(746, 392);
        ctx.stroke();
        ctx.strokeStyle = "#2a2a2a";
        ctx.lineWidth = 5;
        ctx.strokeRect(552, 344, 188, 126);
      } else {
        ctx.fillStyle = "#7d1414";
        ctx.fillRect(650, 508, 6, 6);
      }
    }

    drawCeoOffice() {
      const ctx = this.ctx;
      const lights = this.effects.ceoLightsOut > 0
        ? Math.max(1, Math.ceil(this.effects.ceoLightsOut))
        : 4;

      // TODO : Replace Image
      // 대표실 내부 오브젝트도 현재는 dummy.png 대신 캔버스 도형으로 표시합니다.
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.03;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#202323";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#d6d2c4";
      ctx.fillRect(110, 112, 1060, 520);
      ctx.fillStyle = "#b8b4a7";
      ctx.fillRect(110, 438, 1060, 194);

      for (let i = 0; i < lights; i += 1) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#fff7d7";
        ctx.fillRect(260 + i * 210, 136, 120, 14);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#6d6658";
      ctx.fillRect(498, 388, 286, 112);
      ctx.fillStyle = "#ece9dc";
      ctx.fillRect(570, 304, 132, 86);
      ctx.fillStyle = this.flags.project_s_read ? "#090909" : "#bfc6bd";
      ctx.fillRect(584, 318, 104, 58);

      if (this.effects.monitorEyes > 0) {
        ctx.fillStyle = "#c11212";
        ctx.fillRect(612, 338, 18, 10);
        ctx.fillRect(650, 338, 18, 10);
      }

      ctx.fillStyle = "#756e61";
      ctx.fillRect(260, 486, 210, 92);
      ctx.fillStyle = "#6f695d";
      ctx.fillRect(870, 280, 96, 174);
      ctx.fillStyle = "#4c4f50";
      ctx.fillRect(990, 392, 98, 102);
      ctx.strokeStyle = "#8d887b";
      ctx.strokeRect(330, 190, 100, 72);

      if ((this.flags.project_s_read || this.finalBoss) && !this.flags.final_boss_defeated) {
        this.drawFinalBossCore();
      }

      if (this.finalBoss && ["battle_intro", "battle_phase1", "battle_phase2", "battle_phase3", "qte", "collapse"].includes(this.finalBoss.phase)) {
        this.drawFinalBattleOverlay();
      }
    }

    drawFinalBossCore() {
      const ctx = this.ctx;
      const size = this.finalBoss?.size || 34;
      const infection = clamp((this.finalBoss?.infection || 18) / 50, 0, 1);
      const x = 650;
      const y = 360 - (this.finalBoss?.phase === "reveal" ? Math.sin(this.totalTime * 2) * 8 : 0);
      const sprite = this.getCharacterImage("assets/runtime/characters/boss_after.png");
      const spriteReady = sprite.complete && sprite.naturalWidth > 0;

      if (spriteReady) {
        const revealRatio = this.finalBoss?.phase === "reveal"
          ? clamp((this.finalBoss.timer || 0) / 1.8, 0, 1)
          : 1;
        const targetHeight = 520;
        const targetWidth = targetHeight * (sprite.naturalWidth / sprite.naturalHeight);
        const cropY = 72 + Math.sin(this.totalTime * 2) * 4;
        ctx.save();
        ctx.globalAlpha = 0.35 + revealRatio * 0.65;
        ctx.shadowColor = "rgba(120, 0, 0, 0.64)";
        ctx.shadowBlur = 32;
        ctx.shadowOffsetY = 14;
        ctx.drawImage(sprite, x - targetWidth / 2, cropY, targetWidth, targetHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = "#ad1f1f";
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.58, size * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#f2d7b0";
        ctx.beginPath();
        ctx.ellipse(x - size * 0.16, y - size * 0.1, size * 0.24, size * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#111";
        ctx.fillRect(x - size * 0.2, y - size * 0.16, 9, 8);
        ctx.fillRect(x + size * 0.12, y - size * 0.16, 9, 8);
      }

      if (this.finalBoss?.correct > 0) {
        ctx.strokeStyle = "#f4f0e8";
        ctx.lineWidth = 2;
        for (let i = 0; i < this.finalBoss.correct; i += 1) {
          ctx.beginPath();
          ctx.moveTo(x - 20 + i * 5, y - 30);
          ctx.lineTo(x - 8 + i * 4, y + 18);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = infection;
      ctx.fillStyle = "#5d0000";
      ctx.fillRect(x + size * 0.35, y - size * 0.24, size * 0.18, size * 0.42);
      ctx.globalAlpha = 1;
    }

    drawFinalBattleOverlay() {
      const ctx = this.ctx;

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "#f4f0e8";
      ctx.lineWidth = 1;
      for (let y = 0; y < 720; y += 5) {
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(this.totalTime * 10 + y) * 1.4);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }

      ctx.globalAlpha = this.finalBoss.phase === "collapse" ? 0.2 : 0.55;
      ctx.strokeStyle = "#8f1717";
      ctx.lineWidth = 8;
      for (let i = 0; i < 10; i += 1) {
        ctx.beginPath();
        ctx.moveTo(120 + i * 120, 120);
        ctx.bezierCurveTo(220 + i * 40, 260, 160 + i * 80, 420, 80 + i * 130, 660);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      this.drawFinalBossCore();

      if (this.finalBoss.phase === "battle_phase1") {
        ctx.fillStyle = "#9c2020";
        this.finalBoss.bullets.forEach((bullet) => {
          if (!bullet.hit) ctx.fillRect(bullet.x - 6, bullet.y - 6, 12, 12);
        });
      }

      if (this.finalBoss.phase === "battle_phase2") {
        this.finalBoss.safeZones.forEach((zone) => {
          ctx.globalAlpha = zone.exploded ? 0.5 : 0.22;
          ctx.fillStyle = zone.exploded ? "#ff2a2a" : "#9c2020";
          ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        });
        ctx.globalAlpha = 1;
      }

      if (this.finalBoss.phase === "battle_phase3") {
        const ratio = clamp(this.finalBoss.timer / 8, 0, 1);
        ctx.fillStyle = "rgba(0, 0, 0, 0.74)";
        ctx.fillRect(420, 560, 440, 78);
        ctx.strokeStyle = "#d8d0b8";
        ctx.strokeRect(420, 560, 440, 78);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "18px Courier New";
        ctx.textAlign = "center";
        ctx.fillText("세포 증식 억제 중... E 연타", 640, 586);
        ctx.fillStyle = "#9c2020";
        ctx.fillRect(462, 604, 356 * (1 - ratio), 16);
      }

      if (this.qte) {
        this.drawFinalQte();
      }

      ctx.fillStyle = "#f4f0e8";
      ctx.font = "15px Courier New";
      ctx.textAlign = "left";
      ctx.fillText(`HP ${this.finalBoss.playerHp ?? 5} / 감염도 ${Math.floor(this.finalBoss.infection)}`, 88, 96);
      ctx.restore();
    }

    drawFinalQte() {
      const ctx = this.ctx;
      const current = this.qte.sequence[this.qte.index];

      ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
      ctx.fillRect(390, 190, 500, 220);
      ctx.strokeStyle = "#d8d0b8";
      ctx.lineWidth = 4;
      ctx.strokeRect(390, 190, 500, 220);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "22px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("QTE / 클릭 가능", 640, 236);
      ctx.font = "48px Courier New";
      ctx.fillText(current, 640, 306);
      ctx.font = "16px Courier New";
      ctx.fillText(this.qte.sequence.map((key, index) => index < this.qte.index ? "✓" : key).join("  "), 640, 362);
    }

    drawPrototypeOffice() {
      const ctx = this.ctx;

      // TODO : Replace Image
      if (this.scene.backgroundImage.complete) {
        ctx.globalAlpha = 0.12;
        ctx.drawImage(this.scene.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#2b2e2f";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = "#d7d1bd";
      ctx.fillRect(0, 0, 1280, 155);
      ctx.fillStyle = "#3a3d3e";
      ctx.fillRect(70, 155, 1140, 475);
      ctx.fillStyle = "#252829";
      ctx.fillRect(70, 630, 1140, 90);

      for (let x = 100; x < 1190; x += 120) {
        ctx.fillStyle = "#c9c1ac";
        ctx.fillRect(x, 40, 76, 58);
        ctx.fillStyle = "#7f857e";
        ctx.fillRect(x + 8, 48, 60, 42);
      }

      for (let x = 120; x < 1160; x += 160) {
        ctx.fillStyle = "#565b5d";
        ctx.fillRect(x, 500, 112, 54);
        ctx.fillStyle = "#242728";
        ctx.fillRect(x + 18, 456, 76, 44);
      }
    }

    drawEvents() {
      const ctx = this.ctx;
      const nearby = this.scene.getNearbyEvent(this.player);

      this.scene.current.events.forEach((event) => {
        if (event.onceFlag && this.flags[event.onceFlag]) return;
        if (event.requiresFlag && !this.flags[event.requiresFlag]) return;

        ctx.globalAlpha = nearby && nearby.id === event.id ? 0.18 : 0.04;
        ctx.fillStyle = "#000";
        ctx.fillRect(event.x + 5, event.y + event.height - 4, event.width, 7);
        ctx.fillStyle = "#d8d0b8";
        ctx.fillRect(event.x, event.y, event.width, event.height);
        ctx.globalAlpha = 1;
      });
    }

    drawPlayer() {
      const ctx = this.ctx;
      const x = this.player.x - this.player.width / 2;
      const y = this.player.y - this.player.height;

      // TODO : Replace Image
      // 주인공 스프라이트는 현재 캔버스 픽셀 도형입니다. 실제 16비트 캐릭터
      // 이미지가 준비되면 assets/dummy.png를 교체하거나 스프라이트 로더를
      // 추가하면 됩니다.
      ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
      ctx.fillRect(x - 5, this.player.y - 5, this.player.width + 10, 10);
      ctx.fillStyle = "#ffd6d6";
      ctx.fillRect(x + 8, y, 16, 14);
      ctx.fillStyle = "#4fc3c7";
      ctx.fillRect(x + 4, y + 14, 24, 22);
      ctx.fillStyle = "#2d3032";
      ctx.fillRect(x + 6, y + 36, 8, 8);
      ctx.fillRect(x + 18, y + 36, 8, 8);
    }

    drawInteractionHint() {
      if (this.isFinalBattleActive() || this.isFinalBattleBlocking() || this.minigame?.isOpen?.()) return;
      const event = this.scene.getNearbyEvent(this.player);
      if (!event || this.ui.isBlocking()) return;

      this.ctx.fillStyle = "#f4f0e8";
      this.ctx.font = "24px Courier New";
      this.ctx.textAlign = "center";
      this.ctx.fillText("...", event.x + event.width / 2, event.y - 14);
      this.ctx.font = "14px Courier New";
      this.ctx.fillText("E", event.x + event.width / 2, event.y - 38);
    }

    drawQuickEvent() {
      if (!this.quickEvent) return;

      const ctx = this.ctx;
      const ratio = clamp(this.quickEvent.progress / this.quickEvent.target, 0, 1);

      if (this.quickEvent.background) {
        const image = this.getQuickEventImage(this.quickEvent.background);
        if (image.complete) {
          ctx.drawImage(image, 0, 0, 1280, 720);
        }
        ctx.fillStyle = "rgba(0, 0, 0, 0.26)";
        ctx.fillRect(0, 0, 1280, 720);
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fillRect(420, 560, 440, 78);
      ctx.strokeStyle = "#d8d0b8";
      ctx.lineWidth = 3;
      ctx.strokeRect(420, 560, 440, 78);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "18px Courier New";
      ctx.textAlign = "center";
      const label = this.quickEvent.type === "crowbar_pry"
        ? "빠루질: 클릭 또는 E 3번"
        : this.quickEvent.type === "second_floor_shutter"
          ? "2층 통로 개방: 클릭 또는 E"
          : "무거운 문 밀기: 클릭 또는 E 연타";
      ctx.fillText(label, 640, 586);
      ctx.fillStyle = "#222";
      ctx.fillRect(462, 604, 356, 16);
      ctx.fillStyle = "#d8d0b8";
      ctx.fillRect(462, 604, 356 * ratio, 16);
    }

    drawPuzzleInput() {
      if (!this.puzzle.isOpen()) return;

      const ctx = this.ctx;
      const active = this.puzzle.active;
      const rule = this.puzzle.getRule(active.puzzleId);
      const value = active.value.padEnd(4, "_");

      ctx.fillStyle = "rgba(0, 0, 0, 0.84)";
      ctx.fillRect(368, 182, 544, 476);
      ctx.strokeStyle = "#d8d0b8";
      ctx.lineWidth = 4;
      ctx.strokeRect(368, 182, 544, 476);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "18px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(rule?.label || "4-digit Password", 640, 232);

      for (let i = 0; i < 4; i += 1) {
        const x = 506 + i * 72;
        ctx.fillStyle = "#121415";
        ctx.fillRect(x, 272, 54, 64);
        ctx.strokeStyle = "#77705f";
        ctx.strokeRect(x, 272, 54, 64);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "34px Courier New";
        ctx.fillText(value[i], x + 27, 316);
      }

      ctx.font = "16px Courier New";
      ctx.fillStyle = "#9da4aa";
      const hint = rule?.hintSources?.length ? `Hint: ${rule.hintSources.join(" / ")}` : "Use the number buttons.";
      ctx.fillText(hint, 640, 370);
      ctx.fillText("Enter or OK / X to close", 640, 396);

      const buttons = this.pointClick?.getPuzzleButtons ? this.pointClick.getPuzzleButtons() : [];
      buttons.forEach((button) => {
        const isSubmit = button.kind === "submit";
        const isClose = button.kind === "close";
        const isBackspace = button.kind === "backspace";
        ctx.fillStyle = isClose ? "#5d3131" : isSubmit ? "#315d50" : isBackspace ? "#3a3d42" : "#151719";
        ctx.fillRect(button.x, button.y, button.width, button.height);
        ctx.strokeStyle = isClose ? "#d8d0b8" : "#77705f";
        ctx.strokeRect(button.x, button.y, button.width, button.height);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = isClose ? "20px Courier New" : "18px Courier New";
        ctx.fillText(button.value, button.x + button.width / 2, button.y + (isClose ? 23 : 24));
      });
    }

    drawBossQuiz() {
      if (!this.quiz.isBossQuizOpen()) return;

      const ctx = this.ctx;
      const quiz = this.quiz.activeBossQuiz;
      const ratio = quiz.remaining / quiz.timeLimit;

      ctx.fillStyle = "rgba(0, 0, 0, 0.84)";
      ctx.fillRect(280, 80, 720, 420);
      ctx.strokeStyle = "#d8d0b8";
      ctx.lineWidth = 4;
      ctx.strokeRect(280, 80, 720, 420);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "22px Courier New";
      ctx.textAlign = "center";
      const total = quiz.setId === "finalBoss" ? 10 : 5;
      ctx.fillText(`시험 ${quiz.questionIndex + 1} / ${total}`, 640, 124);
      ctx.font = "20px Courier New";
      ctx.fillText(quiz.question, 640, 170);

      ctx.fillStyle = "#2a2d2e";
      ctx.fillRect(390, 202, 500, 14);
      ctx.fillStyle = ratio < 0.25 ? "#d44f4f" : "#58c7a5";
      ctx.fillRect(390, 202, 500 * ratio, 14);

      quiz.choices.forEach((choice, index) => {
        const y = 246 + index * 54;
        ctx.fillStyle = "#151719";
        ctx.fillRect(360, y, 560, 38);
        ctx.strokeStyle = "#55595a";
        ctx.strokeRect(360, y, 560, 38);
        ctx.fillStyle = "#f4f0e8";
        ctx.font = "17px Courier New";
        ctx.textAlign = "left";
        ctx.fillText(`${index + 1}. ${choice}`, 382, y + 25);
      });
    }

    drawTransitionFade() {
      if (!this.transition) return;

      const half = this.transition.duration / 2;
      const alpha = this.transition.timer < half
        ? clamp(this.transition.timer / half, 0, 1)
        : clamp(1 - (this.transition.timer - half) / half, 0, 1);

      this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      this.ctx.fillRect(0, 0, 1280, 720);
    }

    drawCrtStatic(alpha) {
      const ctx = this.ctx;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 850; i += 1) {
        const shade = Math.random() > 0.5 ? 255 : 0;
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.fillRect(Math.random() * 1280, Math.random() * 720, 2, 1);
      }
      ctx.globalAlpha = 1;
    }

    drawCrtNoise() {
      const ctx = this.ctx;
      this.drawCrtStatic(0.035);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#000";
      for (let y = 0; y < 720; y += 4) {
        ctx.fillRect(0, y, 1280, 1);
      }
      ctx.globalAlpha = 1;
    }

    drawPixelBloom() {
      const ctx = this.ctx;
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#f3efd8";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.globalAlpha = 1;
    }

    drawFog() {
      /*
        drawFog()
        ---------------------------------------------------------------------
        예전에는 큰 반투명 타원 두 개로 안개를 표현했습니다.
        실제 사진 배경에서는 이 타원이 UI 잔상처럼 보여 화면을 지저분하게 만들기 때문에
        현재는 의도적으로 아무것도 그리지 않습니다. 분위기 입자는 drawDust()가 담당합니다.
      */
    }

    drawDust() {
      const ctx = this.ctx;
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#d8d0b8";
      for (let i = 0; i < 42; i += 1) {
        const x = (i * 97 + this.totalTime * (8 + (i % 4))) % 1280;
        const y = (i * 53 + Math.sin(this.totalTime + i) * 16) % 720;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    drawEffectOverlays() {
      const ctx = this.ctx;

      if (this.effects.whiteFlash > 0) {
        ctx.globalAlpha = clamp(this.effects.whiteFlash / 0.2, 0, 1);
        ctx.fillStyle = "#f4f0e8";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (Math.sin(this.totalTime * 41) > 0.965) {
        ctx.globalAlpha = 0.045;
        ctx.fillStyle = "#fff7cc";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.blackout > 0) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1280, 720);
      }

      if (this.effects.designBlackout > 0) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1280, 720);
      }

      if (this.effects.shutterOpen > 0) {
        ctx.globalAlpha = clamp(this.effects.shutterOpen / 1.2, 0, 0.45);
        ctx.fillStyle = "#d8d0b8";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.warehouseLightBlink > 0) {
        const alpha = Math.sin(this.effects.warehouseLightBlink * 60) > 0 ? 0.82 : 0.2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#5c0000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.redGlitch > 0) {
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "#b60000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.cctvShadow > 0) {
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = "#030303";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = "#151515";
        ctx.fillRect(720, 280, 150, 40);
        ctx.globalAlpha = 1;
      }

      if (this.effects.heavyNoise > 0) {
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 2600; i += 1) {
          const shade = Math.random() > 0.5 ? 255 : 0;
          ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
          ctx.fillRect(Math.random() * 1280, Math.random() * 720, 3, 2);
        }
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = "#000";
        for (let y = 0; y < 720; y += 12) {
          ctx.fillRect(Math.random() * 90 - 45, y, 1280, 5);
        }
        ctx.globalAlpha = 1;
      }

      if (this.effects.boxScare > 0) {
        ctx.globalAlpha = clamp(this.effects.boxScare / 0.6, 0, 0.32);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.ceoDrop > 0) {
        ctx.globalAlpha = clamp(this.effects.ceoDrop / 1.0, 0, 0.25);
        ctx.fillStyle = "#7d0000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.finalBlackout > 0) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1280, 720);
      }

      if (this.effects.endingWhiteout > 0) {
        ctx.globalAlpha = clamp(this.effects.endingWhiteout / 2.0, 0, 1);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.heartbeat > 0 && this.boss && !this.flags.simkong_defeated) {
        const pulse = Math.sin(this.totalTime * 9) > 0.88 ? 0.18 : 0.04;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#7d0000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.simkongExplosion > 0) {
        ctx.globalAlpha = clamp(this.effects.simkongExplosion / 1.2, 0, 0.9);
        ctx.fillStyle = "#f4f0e8";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }

      if (this.effects.lockScare > 0) {
        ctx.globalAlpha = clamp(this.effects.lockScare / 1.1, 0, 0.45);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 1280, 720);
        ctx.globalAlpha = 1;
      }
    }
  }

  function createListItem(text) {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function normalizeInputKey(key) {
    return key === " " ? "space" : String(key).toLowerCase();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /*
    DOMContentLoaded boot guard
    ---------------------------------------------------------------------------
    게임 시작 실패는 플레이어 입장에서 가장 치명적인 문제입니다. 생성자, 입력 바인딩,
    리소스 로딩 중 예상 밖 오류가 발생해도 흰 화면으로 방치하지 않고 화면에 원인을
    표시합니다. 정상 루트에서는 기존 Game.init() 흐름을 그대로 사용합니다.
  */
  window.addEventListener("DOMContentLoaded", () => {
    try {
      const game = new Game();
      window.OSSE.game = game;
      game.init().catch((error) => showFatalBootError(error));
    } catch (error) {
      showFatalBootError(error);
    }
  });

  function showFatalBootError(error) {
    console.error("OSSE Inc. boot failed.", error);
    const modal = document.getElementById("modal-panel");
    const title = document.getElementById("modal-title");
    const body = document.getElementById("modal-body");
    const actions = document.getElementById("modal-actions");

    if (!modal || !title || !body || !actions) {
      document.body.textContent = `OSSE Inc. boot failed: ${error?.message || error}`;
      return;
    }

    title.textContent = "시작 실패";
    body.textContent = error?.message || String(error);
    actions.innerHTML = "";
    modal.classList.remove("hidden");
  }
})();
