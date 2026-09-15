(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    BattleSystem
    ---------------------------------------------------------------------------
    이 파일은 "전투"라는 이름을 유지하지만, AFTER HOURS: OSSE에서는 보스를
    단순 체력 싸움이 아니라 회사 업무를 패러디한 인증/검수/처리 절차로 다룹니다.

    기존 scene.js와 game.js가 BattleSystem.start(), attack(), defend()를 호출할 수
    있으므로 함수명과 전역 이름은 유지합니다. 대신 BATTLE_DATA를 확장해서
    박스키퍼, 심콩, 최종 시스템 보스가 어떤 회사 시스템을 상징하는지 데이터로
    관리합니다. 실제 세부 미니게임은 minigame.js의 MINIGAME_DATA와 연결됩니다.
  */
  const BOSS_ASSETS = {
    boxkeeper: "assets/runtime/characters/boxman.png",
    simDaeriNormal: "assets/runtime/characters/boss_before.png",
    simkong: "assets/runtime/characters/boss_after.png"
  };

  const BATTLE_DATA = {
    boxkeeper_logistics: {
      id: "boxkeeper_logistics",
      name: "BOXKEEPER / 박스키퍼",
      role: "물류 시스템",
      asset: BOSS_ASSETS.boxkeeper,
      hp: 3,
      theme: "입고, 검수, 출고, 배송 업무가 멈추지 않는 창고 관리 보스",
      phases: [
        {
          id: "inventory_check",
          title: "Phase 1 : 재고 검수",
          minigameId: "boxkeeper_inventory_check",
          failEffect: "잘못된 박스에서 붉은콩이 생성됩니다."
        },
        {
          id: "packing_work",
          title: "Phase 2 : 포장 작업",
          minigameId: "boxkeeper_packing_work",
          failEffect: "테이프가 엉키고 방어력이 회복됩니다."
        },
        {
          id: "delivery_error",
          title: "Phase 3 : 배송 오류",
          minigameId: "boxkeeper_delivery_error",
          failEffect: "컨베이어에 작은 붉은콩이 섞입니다."
        }
      ],
      clearText: ["처리 완료", "재고 정리 완료"],
      onWin: { type: "set_flag", flag: "boxkeeper_cleared", value: true },
      onLose: { type: "ending", endingId: "bad_warehouse_consumed" }
    },

    simkong_employee_auth: {
      id: "simkong_employee_auth",
      name: "SHIMKONG / 심콩",
      role: "퇴근하지 못한 직원",
      asset: BOSS_ASSETS.simkong,
      humanAsset: BOSS_ASSETS.simDaeriNormal,
      hp: 5,
      theme: "심대리의 기억과 RB-13 감염이 섞인 직원 인증 보스",
      phases: [
        {
          id: "training_test",
          title: "Phase 1 : 사내 교육 테스트",
          quizSet: "boss",
          failEffect: "RB-13 폭주 게이지가 증가합니다."
        },
        {
          id: "office_work",
          title: "Phase 2 : 업무 처리",
          minigameId: "simkong_office_work",
          failEffect: "심콩의 변이가 심해집니다."
        },
        {
          id: "memory_recovery",
          title: "Phase 3 : 기억 복구",
          minigameId: "simkong_memory_recovery",
          failEffect: "심대리의 기억 조각 순서가 흐려집니다."
        }
      ],
      clearText: ["아...", "퇴근...", "할 수 있었네..."],
      onWin: { type: "set_flag", flag: "simkong_defeated", value: true },
      onLose: { type: "ending", endingId: "bad_simgong_training" }
    },

    red_root_system: {
      id: "red_root_system",
      name: "OSSE SYSTEM / RED ROOT",
      role: "회사 자체",
      asset: null,
      hp: 3,
      theme: "RB-13과 회사 시스템이 결합한 최종 인증 절차",
      phases: [
        {
          id: "company_auth",
          title: "Phase 1 : 회사 인증",
          quizSet: "final",
          failEffect: "플레이어의 사원 기록이 갱신됩니다."
        },
        {
          id: "liminal_route",
          title: "Phase 2 : 리미널 공간 퍼즐",
          minigameId: "red_root_liminal_route",
          failEffect: "복도가 다시 같은 자리로 돌아옵니다."
        },
        {
          id: "clock_out_approval",
          title: "Phase 3 : 퇴근 처리",
          minigameId: "red_root_clock_out",
          failEffect: "퇴근 실패 기록이 누적됩니다."
        }
      ],
      clearText: ["퇴근 승인 완료", "회사 문이 열립니다."],
      onWin: { type: "ending", endingId: "normal_clock_out" },
      onLose: { type: "ending", endingId: "bad_new_employee" }
    },

    /*
      기존 테스트용 보스입니다. 다른 파일에서 system_boss를 참조할 수 있으므로
      삭제하지 않고 유지합니다.
    */
    system_boss: {
      id: "system_boss",
      name: "Placeholder Boss",
      hp: 3,
      onWin: { type: "set_flag", flag: "boss_test_cleared", value: true },
      onLose: { type: "ending", endingId: "bad_placeholder" }
    }
  };

  class BattleSystem {
    constructor(game) {
      this.game = game;
      this.current = null;
      this.playerHp = 3;
      this.phaseIndex = 0;
    }

    /*
      start()
      -------------------------------------------------------------------------
      battleId에 해당하는 보스 데이터를 불러와 현재 전투 상태를 초기화합니다.
      현재는 기존 프로토타입 UI와 호환되도록 간단한 모달 방식으로 표시하지만,
      phases/minigameId 데이터를 이용하면 이후 각 보스 페이즈를 실제 미니게임으로
      자연스럽게 확장할 수 있습니다.
    */
    start(battleId) {
      const battle = BATTLE_DATA[battleId];
      if (!battle) {
        console.warn(`Missing battle: ${battleId}`);
        return;
      }

      this.current = { ...battle, hp: battle.hp };
      this.playerHp = 3;
      this.phaseIndex = 0;
      this.render();
    }

    /*
      attack()
      -------------------------------------------------------------------------
      기존 버튼 전투 호환용 입력입니다. 새 보스 설계에서는 "공격"을 업무 처리
      성공으로 해석합니다. 체력이 0이 되면 onWin 액션을 실행합니다.
    */
    attack() {
      if (!this.current) return;

      this.current.hp -= 1;
      if (this.current.hp <= 0) {
        const action = this.current.onWin;
        this.current = null;
        this.game.ui.hideModal();
        this.game.handleAction(action);
        return;
      }

      this.phaseIndex = Math.min(this.phaseIndex + 1, Math.max(0, (this.current.phases || []).length - 1));
      this.playerHp -= 1;
      if (this.playerHp <= 0) {
        const action = this.current.onLose;
        this.current = null;
        this.game.ui.hideModal();
        this.game.handleAction(action);
        return;
      }

      this.render();
    }

    /*
      defend()
      -------------------------------------------------------------------------
      기존 버튼 전투 호환용 방어 입력입니다. 새 구조에서는 잠시 관찰하거나
      업무 지시를 다시 확인하는 행동으로 취급합니다.
    */
    defend() {
      if (!this.current) return;
      this.render("지시서를 다시 확인했다. 이상하게도 글자가 조금 바뀐 것 같다.");
    }

    /*
      render()
      -------------------------------------------------------------------------
      보스의 현재 페이즈, 상징 역할, 향후 연결될 미니게임 ID를 보여줍니다.
      실제 출시용 보스전은 이 데이터를 바탕으로 minigame.js의 각 단계 UI를
      호출하도록 확장하면 됩니다.
    */
    render(extraText = "") {
      const phase = (this.current.phases || [])[this.phaseIndex];
      const body = [
        `${this.current.name}`,
        this.current.role ? `역할: ${this.current.role}` : "",
        this.current.theme || "",
        phase ? `현재 절차: ${phase.title}` : "",
        phase?.minigameId ? `연결 미니게임: ${phase.minigameId}` : "",
        phase?.quizSet ? `연결 퀴즈: ${phase.quizSet}` : "",
        `Boss HP: ${this.current.hp}`,
        `Player HP: ${this.playerHp}`,
        extraText
      ].filter(Boolean).join("\n");

      this.game.ui.showModal({
        title: "회사 시스템 응답",
        body,
        actions: [
          { label: "업무 처리", callback: () => this.attack() },
          { label: "지시 확인", callback: () => this.defend() }
        ]
      });
    }
  }

  window.OSSE.BattleSystem = BattleSystem;
  window.OSSE.BATTLE_DATA = BATTLE_DATA;
  window.OSSE.BOSS_ASSETS = BOSS_ASSETS;
})();
