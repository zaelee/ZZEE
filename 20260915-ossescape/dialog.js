(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    DialogSystem
    ---------------------------------------------------------------------------
    모든 대사와 선택지는 dialog.json에 저장합니다.

    이 파일은 대사를 직접 보관하지 않고, JSON 파일을 읽어서 출력하는 역할만
    담당합니다. 이렇게 분리하면 이후 스토리 작성자가 코드 구조를 건드리지 않고
    dialog.json만 편집해 대사, 선택지, 완료 액션을 추가할 수 있습니다.

    로딩 방식:
    - 일반적인 로컬 서버/웹 서버에서는 fetch("dialog.json")를 사용합니다.
    - index.html을 파일로 직접 열었을 때 일부 브라우저가 fetch를 막을 수 있어,
      같은 폴더의 dialog.json을 숨은 iframe으로 읽는 보조 방식을 둡니다.
    - 두 방식 모두 실패하면 게임은 실행되지만 대사 호출 시 경고만 출력합니다.
  */

  class DialogSystem {
    constructor(game) {
      this.game = game;
      this.data = {};
      this.active = null;
      this.lineIndex = 0;
      this.choicesVisible = false;
      this.visibleText = "";
      this.fullText = "";
      this.typeTimer = 0;
      this.typeSpeed = 38;
      this.elements = {
        box: document.getElementById("dialog-box"),
        speaker: document.getElementById("dialog-speaker"),
        text: document.getElementById("dialog-text"),
        choices: document.getElementById("choice-list")
      };

      this.bindDomEvents();
    }

    /*
      bindDomEvents()
      -------------------------------------------------------------------------
      포인트앤클릭 방식에서는 화면에 뜬 대화창 자체도 "클릭 가능한 UI"로 느껴져야 합니다.
      기존 키보드 진행(E)은 유지하고, 대화창을 클릭하면 현재 문장을 즉시 다 보여주거나
      다음 문장으로 넘어가거나 마지막 문장에서는 창을 닫고 onComplete 액션을 실행합니다.

      선택지 버튼은 개별 버튼 클릭으로 처리해야 하므로 이벤트 전파를 막습니다. 그렇지 않으면
      선택지를 누른 직후 부모 대화창 클릭까지 함께 실행되어 의도치 않게 다음 액션이 겹칠 수
      있습니다.
    */
    bindDomEvents() {
      if (!this.elements.box) return;

      this.elements.box.addEventListener("click", () => {
        this.advance();
      });

      if (this.elements.choices) {
        this.elements.choices.addEventListener("click", (event) => {
          event.stopPropagation();
        });
      }
    }

    async load() {
      try {
        this.data = await loadJsonWithFileFallback("dialog.json");
        window.OSSE.DIALOGUE_DATA = this.data;
      } catch (error) {
        console.warn("dialog.json could not be loaded.", error);
        this.data = {};
        window.OSSE.DIALOGUE_DATA = this.data;
        throw error;
      }
    }

    start(dialogId) {
      const data = this.data[dialogId];
      if (!data) {
        console.warn(`Missing dialogue: ${dialogId}`);
        return;
      }

      this.active = data;
      this.lineIndex = 0;
      this.choicesVisible = false;
      this.elements.box.classList.remove("hidden");
      this.renderLine();
    }

    advance() {
      if (!this.active) return false;

      if (this.visibleText !== this.fullText) {
        this.visibleText = this.fullText;
        this.elements.text.textContent = this.visibleText;
        return true;
      }

      if (this.choicesVisible) {
        return true;
      }

      const hasNextLine = this.lineIndex < this.active.lines.length - 1;
      if (hasNextLine) {
        this.lineIndex += 1;
        this.renderLine();
        return true;
      }

      if (this.active.choices && this.active.choices.length > 0) {
        this.renderChoices();
        return true;
      }

      const onComplete = this.active.onComplete;
      this.close();
      if (onComplete) {
        this.game.handleAction(onComplete);
      }
      return true;
    }

    renderLine() {
      this.elements.speaker.textContent = this.active.speaker || "";
      const rawLine = this.active.lines[this.lineIndex] || "";
      this.fullText = this.game.liminal
        ? this.game.liminal.mutateDialogLine(rawLine)
        : rawLine;
      this.visibleText = "";
      this.typeTimer = 0;
      this.elements.text.textContent = "";
      this.elements.choices.innerHTML = "";
      this.choicesVisible = false;
    }

    update(delta) {
      if (!this.active || this.choicesVisible || this.visibleText === this.fullText) return;

      this.typeTimer += delta * this.typeSpeed;
      const targetLength = Math.min(this.fullText.length, Math.floor(this.typeTimer));
      this.visibleText = this.fullText.slice(0, targetLength);
      this.elements.text.textContent = this.visibleText;
    }

    renderChoices() {
      this.elements.choices.innerHTML = "";
      this.choicesVisible = true;

      this.active.choices.forEach((choice) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = choice.label;
        button.disabled = !this.canSelect(choice);
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          this.choose(choice);
        });
        this.elements.choices.appendChild(button);
      });
    }

    canSelect(choice) {
      if (choice.requiresItem && !this.game.inventory.has(choice.requiresItem)) {
        return false;
      }
      if (choice.requiresFlag && !this.game.flags[choice.requiresFlag]) {
        return false;
      }
      return true;
    }

    choose(choice) {
      const action = choice.action;

      this.close();
      if (choice.next) {
        this.start(choice.next);
        return;
      }
      if (!action) {
        return;
      }
      this.game.handleAction(action);
    }

    close() {
      this.active = null;
      this.lineIndex = 0;
      this.choicesVisible = false;
      this.visibleText = "";
      this.fullText = "";
      this.elements.box.classList.add("hidden");
      this.elements.choices.innerHTML = "";
    }

    isOpen() {
      return Boolean(this.active);
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

  window.OSSE.DialogSystem = DialogSystem;
  window.OSSE.DIALOGUE_DATA = {};
})();
