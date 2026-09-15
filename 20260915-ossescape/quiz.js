(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    QuizSystem
    ---------------------------------------------------------------------------
    모든 퀴즈 데이터는 quiz.json에서 관리합니다.

    기존의 간단한 시스템 테스트 퀴즈는 유지하고, 이번 파트에서 필요한
    "심콩 보스 퀴즈"를 추가했습니다.

    설계 원칙:
    - 문제 원문/선택지/정답 규칙은 quiz.json에 둡니다.
    - 회사명, 슬로건, 브랜드, 사업영역 같은 값은 osse_data.json에서 읽습니다.
    - 실제 홈페이지 데이터로 교체할 때는 osse_data.json과 quiz.json의 source만
      손보면 되도록, 코드에는 특정 정답 텍스트를 박아두지 않습니다.
  */
  const FALLBACK_QUIZ_DATA = {
    system_quiz: {
      id: "system_quiz",
      question: "Which key is used for interaction?",
      choices: ["E", "ESC", "Shift"],
      answerIndex: 0,
      onCorrect: { type: "set_flag", flag: "quiz_test_passed", value: true },
      onWrong: { type: "set_flag", flag: "quiz_test_failed", value: true }
    },
    boss: []
  };

  class QuizSystem {
    constructor(game) {
      this.game = game;
      this.data = FALLBACK_QUIZ_DATA;
      this.activeBossQuiz = null;
    }

    async load() {
      try {
        this.data = await loadJsonWithFileFallback("quiz.json");
      } catch (error) {
        console.warn("quiz.json could not be loaded. Fallback quiz data will be used.", error);
        this.data = FALLBACK_QUIZ_DATA;
        throw error;
      }
      window.OSSE.QUIZ_DATA = this.data;
    }

    start(quizId) {
      const quiz = this.data[quizId] || FALLBACK_QUIZ_DATA[quizId];
      if (!quiz) {
        console.warn(`Missing quiz: ${quizId}`);
        return;
      }

      this.game.ui.showModal({
        title: "Quiz",
        body: quiz.question,
        actions: quiz.choices.map((label, index) => ({
          label,
          callback: () => {
            const isCorrect = index === quiz.answerIndex;
            this.game.handleAction(isCorrect ? quiz.onCorrect : quiz.onWrong);
            this.game.ui.hideModal();
          }
        }))
      });
    }

    startBossQuiz(questionIndex, setId = "boss") {
      const template = this.data[setId]?.[questionIndex];
      if (!template) {
        this.activeBossQuiz = null;
        return false;
      }

      const built = this.buildQuestion(template);
      this.activeBossQuiz = {
        id: template.id,
        setId,
        questionIndex,
        question: built.question,
        choices: built.choices,
        answerIndex: built.answerIndex,
        remaining: template.timeLimitSeconds || 30,
        timeLimit: template.timeLimitSeconds || 30
      };
      return true;
    }

    update(delta) {
      if (!this.activeBossQuiz) return;

      this.activeBossQuiz.remaining = Math.max(0, this.activeBossQuiz.remaining - delta);
      if (this.activeBossQuiz.remaining <= 0) {
        this.answerBossQuiz(-1);
      }
    }

    answerBossQuiz(choiceIndex) {
      if (!this.activeBossQuiz) return;

      const active = this.activeBossQuiz;
      const isCorrect = choiceIndex === active.answerIndex;
      this.activeBossQuiz = null;
      if (active.setId === "finalBoss") {
        this.game.resolveFinalQuizAnswer(isCorrect);
      } else {
        this.game.resolveSimkongQuizAnswer(isCorrect);
      }
    }

    isBossQuizOpen() {
      return Boolean(this.activeBossQuiz);
    }

    buildQuestion(template) {
      const osse = window.OSSE.OSSE_DATA;
      const answer = resolveSource(osse, template.answerSource);
      const distractors = (template.distractorSources || []).map((source) => resolveSource(osse, source));
      const choices = normalizeChoices([answer, ...distractors]).slice(0, 4);
      const answerIndex = choices.indexOf(String(answer));

      return {
        question: template.question,
        choices,
        answerIndex
      };
    }
  }

  async function loadJsonWithFileFallback(path) {
    try {
      const response = await fetch(path, { cache: "no-store", signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (fetchError) {
      if (window.location.protocol !== "file:") throw fetchError;
      return await loadJsonThroughIframe(path, fetchError);
    }
  }

  function loadJsonThroughIframe(path, originalError) {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement("iframe");
      iframe.src = path;
      iframe.className = "json-loader-frame";
      iframe.setAttribute("aria-hidden", "true");

      iframe.addEventListener("load", () => {
        try {
          const text = iframe.contentDocument.body.textContent;
          iframe.remove();
          resolve(JSON.parse(text));
        } catch (error) {
          iframe.remove();
          reject(originalError || error);
        }
      });

      iframe.addEventListener("error", () => {
        iframe.remove();
        reject(originalError || new Error(`Could not load ${path}`));
      });

      document.body.appendChild(iframe);
    });
  }

  function resolveSource(root, source) {
    if (source.type === "literal") {
      return source.value;
    }
    if (source.type === "path") {
      return getPath(root, source.path);
    }
    if (source.type === "brandName") {
      return root.brands[source.index]?.name || "";
    }
    if (source.type === "businessArea") {
      return root.company.businessAreas[source.index] || "";
    }
    if (source.type === "keyword") {
      return root.company.representativeKeywords[source.index]?.word || "";
    }
    return "";
  }

  function getPath(source, path) {
    return path.split(".").reduce((current, key) => current?.[key], source);
  }

  function normalizeChoices(values) {
    const seen = new Set();
    return values
      .map((value) => String(value))
      .filter((value) => {
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
      });
  }

  window.OSSE.QuizSystem = QuizSystem;
  window.OSSE.QUIZ_DATA = FALLBACK_QUIZ_DATA;
})();
