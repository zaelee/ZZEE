(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    PuzzleSystem
    ---------------------------------------------------------------------------
    모든 암호 퍼즐은 이 파일에서 관리합니다.

    중요한 설계 원칙:
    - 정답 숫자를 game.js나 puzzle.js에 직접 하드코딩하지 않습니다.
    - puzzle.js는 data/osse_data.json의 회사 정보, 브랜드, 키워드, 퍼즐 규칙을
      조합해 4자리 코드를 계산합니다.
    - 나중에 실제 홈페이지 내용으로 교체할 때는 osse_data.json의 데이터와
      puzzleRules만 수정하면 되고, 게임 로직은 그대로 유지할 수 있습니다.

    현재 지원하는 digit rule:
    - count: 배열 길이를 한 자리 숫자로 변환합니다.
    - keywordOrder: representativeKeywords 안의 특정 키워드 order를 사용합니다.
    - textLength: 문자열 길이를 한 자리 숫자로 변환합니다.
    - sloganWordCount: 슬로건을 쉼표/공백 기준 단어 수로 변환합니다.
    - labelDigitSum: 특정 브랜드 labelCode의 숫자를 합산해 한 자리로 변환합니다.
  */
  class PuzzleSystem {
    constructor(game) {
      this.game = game;
      this.data = null;
      this.active = null;
    }

    async load() {
      /*
        부팅 안정성 메모:
        -----------------------------------------------------------------------
        이 프로젝트는 index.html을 더블클릭해서 실행하는 경우도 고려합니다. 일부 브라우저는
        file:// 환경에서 fetch("data/osse_data.json")를 막기 때문에, 퍼즐 데이터 로딩 실패가
        곧 게임 전체 부팅 실패로 이어질 수 있습니다.

        숫자 정답을 코드에 직접 박아 넣지 않는 규칙은 유지하되, 동일한 구조의 fallback 회사를
        사용하면 퍼즐 계산 함수는 그대로 재사용됩니다. 나중에 실제 홈페이지 데이터로 교체할 때는
        data/osse_data.json만 바꾸면 되고, 이 fallback은 "로컬 실행이 막히지 않게 하는 안전망"
        역할만 합니다.
      */
      try {
        this.data = await loadJsonWithFileFallback("data/osse_data.json");
      } catch (error) {
        console.warn("osse_data.json could not be loaded. Fallback company data will be used.", error);
        this.data = structuredCloneSafe(FALLBACK_OSSE_DATA);
        throw error;
      }
      window.OSSE.OSSE_DATA = this.data;
    }

    startCodeInput(puzzleId) {
      const rule = this.getRule(puzzleId);
      if (!rule) {
        console.warn(`Missing puzzle rule: ${puzzleId}`);
        return;
      }

      this.active = {
        puzzleId,
        value: "",
        maxLength: 4
      };
    }

    close() {
      this.active = null;
    }

    isOpen() {
      return Boolean(this.active);
    }

    inputDigit(digit) {
      if (!this.active) return;

      /*
        포인트 앤 클릭 키패드에서는 잘못 누른 숫자를 즉시 고치고 싶을 때가 많습니다.
        4자리가 이미 찼다면 입력을 무시하지 않고 마지막 칸을 새 숫자로 교체합니다.
        정답 규칙은 그대로 유지하고 입력 UX만 부드럽게 만드는 처리입니다.
      */
      if (this.active.value.length >= this.active.maxLength) {
        this.active.value = `${this.active.value.slice(0, -1)}${digit}`;
        return;
      }

      this.active.value += digit;
    }

    backspace() {
      if (!this.active) return;
      this.active.value = this.active.value.slice(0, -1);
    }

    submit() {
      if (!this.active || this.active.value.length !== this.active.maxLength) return;

      const puzzleId = this.active.puzzleId;
      const entered = this.active.value;
      const expected = this.calculateCode(puzzleId);
      this.close();

      this.game.resolvePuzzleAttempt(puzzleId, entered === expected);
    }

    calculateCode(puzzleId) {
      const rule = this.getRule(puzzleId);
      if (!rule) return "";

      return rule.digits.map((digitRule) => String(this.resolveDigit(digitRule))).join("");
    }

    getRule(puzzleId) {
      return this.data?.puzzleRules?.[puzzleId] || null;
    }

    resolveDigit(rule) {
      switch (rule.type) {
        case "count":
          return toDigit(getPath(this.data, rule.path).length);
        case "keywordOrder":
          return toDigit(this.getKeywordOrder(rule.keyword));
        case "textLength":
          return toDigit(String(getPath(this.data, rule.path)).length);
        case "sloganWordCount":
          return toDigit(String(getPath(this.data, rule.path)).split(/[,\s]+/).filter(Boolean).length);
        case "labelDigitSum":
          return toDigit(this.getBrandLabelDigitSum(rule.brandName));
        case "yearDigit":
          return this.getYearDigit(rule.path, rule.index);
        default:
          console.warn(`Unknown digit rule: ${rule.type}`);
          return 0;
      }
    }

    getYearDigit(path, index) {
      /*
        getYearDigit()
        ---------------------------------------------------------------------
        회사 설립연도처럼 4자리 숫자 자체가 단서가 되는 퍼즐에서 사용합니다.

        왜 별도 규칙으로 분리했는가:
        - 창고 자물쇠는 사진 속 "SINCE 1994" 같은 시각 단서를 보고 푸는 퍼즐입니다.
        - 정답 1994를 puzzle.js에 직접 적으면 나중에 실제 사진/회사 정보가 바뀔 때
          코드까지 수정해야 합니다.
        - 따라서 osse_data.json의 company.foundedYear만 교체하면 각 자리 숫자가
          자동으로 다시 계산되도록 합니다.

        index는 0부터 시작합니다.
        예: foundedYear=1994라면 index 0->1, 1->9, 2->9, 3->4
      */
      const sourceValue = String(getPath(this.data, path) ?? "").replace(/\D/g, "");
      const digit = sourceValue.charAt(Number(index) || 0);
      return toDigit(digit);
    }

    getKeywordOrder(keyword) {
      const list = this.data.company.representativeKeywords || [];
      const found = list.find((item) => item.word === keyword);
      return found ? found.order : 0;
    }

    getBrandLabelDigitSum(brandName) {
      const brand = (this.data.brands || []).find((item) => item.name === brandName);
      if (!brand) return 0;

      return String(brand.labelCode)
        .split("")
        .filter((char) => /\d/.test(char))
        .reduce((sum, char) => sum + Number(char), 0);
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

  function getPath(source, path) {
    return path.split(".").reduce((current, key) => current?.[key], source);
  }

  function toDigit(value) {
    const number = Number(value) || 0;
    return Math.abs(number) % 10;
  }

  const FALLBACK_OSSE_DATA = {
    meta: {
      schemaVersion: 1,
      description: "Fallback OSSE data used only when data/osse_data.json cannot be loaded."
    },
    company: {
      name: "OSSE Inc.",
      codeName: "OSSE",
      foundedYear: 1994,
      foundedYearHintLabel: "SINCE 1994",
      slogan: "Order, Safety, Storage, Escape",
      businessAreas: [
        "brand logistics",
        "office supplies",
        "laundry care",
        "experimental storage"
      ],
      representativeKeywords: [
        { word: "culture", order: 1 },
        { word: "safety", order: 2 },
        { word: "growth", order: 3 },
        { word: "experiment", order: 4 }
      ]
    },
    brands: [
      { name: "OSSE", category: "corporate", labelCode: "01", keyword: "order" },
      { name: "Suyamu", category: "food", labelCode: "12", keyword: "storage" },
      { name: "Laundry Surfing", category: "laundry", labelCode: "03", keyword: "care" }
    ],
    puzzleRules: {
      warehouseLock: {
        label: "Warehouse iron door 4-digit lock",
        hintSources: ["warehouse SINCE text", "old company poster", "password memo"],
        digits: [
          { type: "yearDigit", path: "company.foundedYear", index: 0 },
          { type: "yearDigit", path: "company.foundedYear", index: 1 },
          { type: "yearDigit", path: "company.foundedYear", index: 2 },
          { type: "yearDigit", path: "company.foundedYear", index: 3 }
        ]
      },
      officeDoor: {
        label: "First floor office card and code lock",
        requiresItem: "security_access_card",
        hintSources: ["company slogan", "business areas", "parcel labels"],
        digits: [
          { type: "sloganWordCount", path: "company.slogan" },
          { type: "count", path: "company.businessAreas" },
          { type: "labelDigitSum", brandName: "OSSE" },
          { type: "keywordOrder", keyword: "growth" }
        ]
      }
    }
  };

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  window.OSSE.PuzzleSystem = PuzzleSystem;
  window.OSSE.OSSE_DATA = null;
})();
