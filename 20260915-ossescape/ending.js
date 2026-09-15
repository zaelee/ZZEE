(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    Ending database
    ---------------------------------------------------------------------------
    엔딩은 조건 체크와 출력 데이터를 분리해서 관리합니다.

    BAD END 1은 이번 프롤로그에서 실제로 도달 가능한 엔딩입니다.
    기존 placeholder 엔딩은 이후 테스트를 위해 삭제하지 않고 유지합니다.
  */
  const ENDING_DATA = {
    bad_end_1: {
      id: "bad_end_1",
      title: "BAD END 1",
      text: "겁이 많아 살아남았다."
    },
    bad_end_warehouse_consumed: {
      id: "bad_end_warehouse_consumed",
      title: "BAD END",
      text: "창고는 이미 먹혀 있었다."
    },
    bad_end_simdaeri_auth_failed: {
      id: "bad_end_simdaeri_auth_failed",
      title: "BAD END",
      text: "직원 인증 실패.\n\n심대리는 네 대답을 한참 바라보다가,\n아주 작게 말했다.\n\n\"교육을 다시 받아.\"\n\n다음 순간 회의실 불이 모두 꺼졌다.",
      restartBranch: "first_floor_entrance"
    },
    true_end: {
      id: "true_end",
      title: "END",
      text: "OSSE Inc.\nEscape from OSSE\n\nCredits\nGame Design / Scenario / Prototype\nCodex x eo2jaelee\n\nThank you for playing."
    },
    morning_end: {
      id: "morning_end",
      title: "END",
      text: "다음 날 아침.\n\n눈을 뜨니 회사 로비의 형광등이 평소처럼 켜져 있었다.\n손에는 USB가 쥐어져 있었다.\n\n퇴근한 줄 알았는데,\n이번에는 출근한 줄 알았다."
    },
    true_end_perfect: {
      id: "true_end_perfect",
      title: "TRUE END",
      text: "PROJECT S-02\n\n붉은콩은 사라졌다.\n하지만 연구는 끝나지 않았다."
    },
    to_be_continued: {
      id: "to_be_continued",
      title: "TO BE CONTINUED",
      text: "1층 사무실은 아직 구현 중입니다.\n\n다음 업데이트에서 계속됩니다."
    },
    bad_end_red_root_failed: {
      id: "bad_end_red_root_failed",
      title: "BAD END",
      text: "퇴근 승인 실패.\n\n심콩은 작게 웃었다.\n\n\"아직... 업무가 남았어.\"\n\n붉은콩이 발밑에서 천천히 굴러왔다.",
      restartBranch: "second_floor_entrance"
    },
    bad_end_infection: {
      id: "bad_end_infection",
      title: "BAD END",
      text: "감염은 끝까지 조용했다."
    },
    bad_end_locked_company: {
      id: "bad_end_locked_company",
      title: "BAD END",
      text: "회사는 문을 닫았다. 안쪽에서."
    },
    bad_end_absorbed: {
      id: "bad_end_absorbed",
      title: "BAD END",
      text: "심콩은 너를 기억한다. 몸 안쪽에서."
    },
    bad_end_ceo: {
      id: "bad_end_ceo",
      title: "BAD END",
      text: "다음 날, 너는 회사 대표가 되어 있었다."
    },
    bad_end_second_floor_loop: {
      id: "bad_end_second_floor_loop",
      title: "BAD END",
      text: "2층 복도는 끝나지 않았다."
    },
    bad_end_red_soymilk: {
      id: "bad_end_red_soymilk",
      title: "BAD END",
      text: "붉은 두유는 달지 않았다."
    },
    bad_end_researcher: {
      id: "bad_end_researcher",
      title: "BAD END",
      text: "너는 연구원이 되었다. 연구 대상이기도 했다."
    },
    bad_end_subject_s05: {
      id: "bad_end_subject_s05",
      title: "BAD END",
      text: "실험체 S-05. 적응 양호."
    },
    normal_placeholder: {
      id: "normal_placeholder",
      title: "Placeholder Ending",
      text: "The prototype reached a normal test ending."
    },
    bad_placeholder: {
      id: "bad_placeholder",
      title: "Placeholder Bad Ending",
      text: "The prototype reached a bad test ending."
    }
  };

  class EndingSystem {
    constructor(game) {
      this.game = game;
    }

    show(endingId, options = {}) {
      const ending = ENDING_DATA[endingId];
      if (!ending) {
        console.warn(`Missing ending: ${endingId}`);
        return;
      }

      this.currentId = endingId;
      this.game.flags[`ending_${endingId}`] = true;
      this.game.mode = "ending";
      if (options.save !== false) this.game.save("autosave", { silent: true });

      this.game.ui.showModal({
        title: ending.title,
        body: ending.text,
        actions: [
          {
            label: "다시 시작",
            callback: () => {
              this.game.ui.hideModal();
              if (ending.restartBranch) {
                this.game.restartFromEndingCheckpoint(ending.restartBranch);
                return;
              }
              this.game.restartNewGame();
            }
          },
          {
            label: "시작 화면",
            callback: () => this.game.showMainMenu()
          }
        ]
      });
    }
  }

  window.OSSE.EndingSystem = EndingSystem;
  window.OSSE.ENDING_DATA = ENDING_DATA;
})();
