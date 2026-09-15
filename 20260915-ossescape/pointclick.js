(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    PointClickSceneManager
    ---------------------------------------------------------------------------
    Cube Escape / Rusty Lake 스타일의 포인트 앤 클릭 조작 계층입니다.

    기존 프로젝트 규칙을 지키기 위해 다음 원칙으로 설계했습니다.
    - scene.js의 기존 Scene/Event 데이터는 삭제하거나 이름을 바꾸지 않습니다.
    - 기존 이벤트 action은 그대로 사용하고, 이 파일은 클릭 입력을 해당 action으로
      전달하는 "UI/UX 어댑터" 역할만 합니다.
    - 기존 WASD 이동 코드는 남겨두되, game.js에서 이 매니저가 활성화된 동안
      이동 업데이트와 플레이어 렌더링을 건너뛰게 합니다.
    - 실제 회사 사진으로 교체하기 쉽도록 이미지 경로는 이 파일의 상수와 scene.js의
      background 값을 함께 사용합니다.

    Scene 모델:
    - Room Scene: scene.js의 기존 scene.current를 그대로 사용합니다.
    - Focus Scene: 책상/컴퓨터/서랍/택배처럼 한 오브젝트를 확대한 가상 Scene입니다.
      Focus Scene에서 다시 클릭하면 원래 scene.js 이벤트가 실행됩니다.
  */

  const POINT_CLICK_ASSET_PATHS = {
    fallbackBackground: "assets/dummy.png"
  };

  const FOCUSABLE_KINDS = new Set(["inspect", "item", "parcel", "note", "quiz", "minigame", "battle", "dialog"]);

  class PointClickSceneManager {
    constructor(game) {
      this.game = game;
      this.enabled = true;
      this.hoveredHotspot = null;
      this.focusEvent = null;
      this.selectedItemId = "";
      this.fade = 0;
      this.lastPointer = { x: 0, y: 0 };
      this.moveTarget = null;
      this.hintTimer = 0;
      this.screen = document.getElementById("game-screen");
      this.hotspotLayer = this.createHotspotLayer();
      this.inventoryBar = document.getElementById("quick-inventory");
      this.backButton = document.getElementById("point-back");
    }

    /*
      createHotspotLayer()
      -------------------------------------------------------------------------
      캔버스에 그리는 Hotspot은 시각 효과일 뿐이라, 브라우저/레이어/좌표 스케일 문제로
      클릭이 누락되면 플레이어는 진행할 수 없습니다. 이 레이어는 사진 위에 실제 DOM 버튼을
      만들어서 클릭 입력을 브라우저 기본 hit-test에 맡깁니다.

      scene.js 이벤트 데이터는 그대로 사용하고, 이 레이어는 "입력 표면"만 담당합니다.
    */
    createHotspotLayer() {
      if (!this.screen) return null;

      const layer = document.createElement("div");
      layer.id = "point-hotspot-layer";
      layer.className = "point-hotspot-layer";
      layer.setAttribute("aria-label", "클릭 가능한 영역");
      this.screen.appendChild(layer);
      return layer;
    }

    /*
      bindDomEvents()
      캔버스 클릭, 포인터 이동, 뒤로가기 버튼, 하단 인벤토리 클릭을 연결합니다.
      기존 키보드 입력 시스템은 유지하지만, 실제 탐험 조작은 이 함수에서 처리합니다.
    */
    bindDomEvents() {
      this.game.canvas.addEventListener("pointermove", (event) => this.handlePointerMove(event));

      /*
        Pointer input layer
        -----------------------------------------------------------------------
        이전에는 canvas에만 pointerdown을 연결했습니다. 하지만 포인트앤클릭 UI는 HUD,
        인벤토리, 대화창, BACK 버튼 같은 DOM 레이어가 캔버스 위에 올라오기 때문에,
        특정 레이어가 마우스 이벤트를 먼저 받으면 사진 속 Hotspot 클릭이 사라진 것처럼
        보일 수 있습니다.

        그래서 클릭 입력은 game-screen 전체에서 받고, 실제 UI 조작 요소는 제외합니다.
        이렇게 하면 사진 영역 클릭은 안정적으로 Hotspot 처리되고, 대화창/선택지/메뉴 버튼은
        각자의 DOM 이벤트만 실행됩니다.
      */
      const handleLayerPointerDown = (event) => {
        if (event.osseHandled) return;
        if (this.shouldIgnoreDomPointer(event.target)) return;
        event.osseHandled = true;
        this.handlePointerDown(event);
      };
      const inputLayer = this.screen || this.game.canvas;
      inputLayer.addEventListener("pointerdown", handleLayerPointerDown);
      this.game.canvas.addEventListener("pointerdown", handleLayerPointerDown);
      if (this.hotspotLayer) {
        this.hotspotLayer.addEventListener("click", (event) => this.handleHotspotLayerPointer(event), true);
      }

      /*
        시작 안정성 메모:
        -----------------------------------------------------------------------
        포인트앤클릭 전환 이후 #point-back / #quick-inventory는 필수 UI가 되었지만,
        HTML 작업 중 요소가 잠시 빠지면 게임 전체가 TypeError로 부팅 실패할 수 있습니다.
        요소가 없을 때 조용히 기능만 비활성화하고 경고를 남기면, 다른 시스템 QA를 계속할 수
        있고 어떤 마크업이 누락되었는지도 콘솔에서 바로 확인할 수 있습니다.
      */
      if (this.backButton) {
        this.backButton.addEventListener("click", () => this.game.handlePointBackButton());
      } else {
        console.warn("PointClickSceneManager: #point-back was not found.");
      }
      this.renderInventory();
      this.updateHotspotLayer();
    }

    /*
      shouldIgnoreDomPointer()
      -------------------------------------------------------------------------
      화면 전체에서 클릭을 받되, 실제 UI 컴포넌트를 누른 경우에는 포인트앤클릭 Hotspot
      처리로 넘기지 않습니다. 선택지 버튼을 눌렀는데 배경 Hotspot까지 같이 눌리는 문제를
      막는 안전장치입니다.
    */
    shouldIgnoreDomPointer(target) {
      if (!(target instanceof Element)) return false;
      if (target === this.game.canvas) return false;
      if (target.closest(".point-hotspot")) return true;
      return Boolean(target.closest("button, input, select, textarea, .dialog, .menu, .modal, .settings, .quick-inventory, .dev-toolkit, .minigame-window"));
    }

    /*
      handleHotspotLayerPointer()
      -------------------------------------------------------------------------
      실제 DOM Hotspot 버튼을 누르는 가장 직접적인 입력 경로입니다.
      캔버스 좌표 계산, 화면 스케일, hover 상태와 무관하게 dataset의 hotspot id로 현재
      Scene 이벤트를 찾아 실행합니다.
    */
    handleHotspotLayerPointer(event) {
      const button = event.target instanceof Element
        ? event.target.closest(".point-hotspot")
        : null;
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();
      event.osseHandled = true;

      const hotspot = this.getCurrentHotspots().find((item) => item.id === button.dataset.hotspotId);
      this.activateHotspot(hotspot);
    }

    /*
      isExplorationLocked()
      대화/퍼즐/퀴즈/전투/전환 중에는 사진 Hotspot 클릭을 막습니다.
      이것이 없으면 대화창 뒤에서 다른 이벤트가 중복 실행되어 플래그 충돌이 생길 수 있습니다.
    */
    isExplorationLocked() {
      return this.game.ui.isBlocking()
        || this.game.puzzle.isOpen()
        || this.game.quiz.isBossQuizOpen()
        || this.game.minigame?.isOpen()
        || this.game.isFinalBattleActive()
        || this.game.boss?.phase === "attack"
        || Boolean(this.game.quickEvent)
        || this.game.mode !== "gameplay";
    }

    /*
      handlePointerMove()
      화면 좌표를 1280x720 게임 좌표로 변환한 뒤 현재 Hotspot을 찾습니다.
      Hover 상태는 커서 모양과 Hotspot 하이라이트 렌더링에 사용됩니다.
    */
    handlePointerMove(event) {
      const point = this.getCanvasPoint(event);
      this.lastPointer = point;
      this.hoveredHotspot = this.getHotspotAt(point.x, point.y);
      this.updateCursor();
    }

    /*
      handlePointerDown()
      포인트 앤 클릭의 핵심 입력입니다.
      - Focus Scene이 아닌 경우: 오브젝트 종류에 따라 확대하거나 즉시 이벤트 실행
      - Focus Scene인 경우: 확대된 오브젝트를 다시 클릭하면 기존 이벤트 실행
    */
    handlePointerDown(event) {
      if (!this.enabled) return;

      if (this.game.mode === "prologue") {
        this.game.advancePrologueByClick();
        return;
      }

      if (this.game.qte) {
        this.handleQtePointer();
        return;
      }

      if (this.game.puzzle.isOpen()) {
        this.handlePuzzlePointer(this.getCanvasPoint(event));
        return;
      }

      if (this.game.quiz.isBossQuizOpen()) {
        this.handleQuizPointer(this.getCanvasPoint(event));
        return;
      }

      if (this.isPointerMoveAllowedDuringActionMode()) {
        this.moveTarget = this.getCanvasPoint(event);
        return;
      }

      if (this.game.quickEvent && this.game.mode === "gameplay") {
        this.game.handleQuickEventInput();
        return;
      }

      if (this.isExplorationLocked()) return;

      const point = this.getCanvasPoint(event);
      const hotspot = this.getHotspotAt(point.x, point.y);
      if (!hotspot) {
        this.logMissedClick(point);
        return;
      }

      this.activateHotspot(hotspot);
    }

    /*
      activateHotspot()
      -------------------------------------------------------------------------
      캔버스 좌표 클릭과 DOM Hotspot 버튼 클릭이 같은 실행 경로를 공유합니다.
      이렇게 해야 입력 방식이 바뀌어도 대화/이벤트/확대 화면의 결과가 서로 달라지지 않습니다.
    */
    activateHotspot(hotspot) {
      if (!hotspot) return;

      this.fade = 0.28;
      this.game.audio.playKeyboardTick();

      if (hotspot.type === "back") {
        this.goBack();
        return;
      }

      if (hotspot.type === "execute") {
        this.executeSceneEvent(hotspot.event);
        return;
      }

      if (this.shouldOpenFocusScene(hotspot.event)) {
        this.openFocusScene(hotspot.event);
        return;
      }

      this.executeSceneEvent(hotspot.event);
    }

    /*
      update()
      Fade 효과와 hover 상태를 매 프레임 갱신합니다.
    */
    update(delta) {
      this.fade = Math.max(0, this.fade - delta);
      this.hintTimer = Math.max(0, this.hintTimer - delta);
      this.updateFirstHint(delta);
      if (this.isExplorationLocked()) {
        this.hoveredHotspot = null;
        this.updateCursor();
        this.updateHotspotLayer();
        this.updateActionMove(delta);
        return;
      }
      this.hoveredHotspot = this.getHotspotAt(this.lastPointer.x, this.lastPointer.y);
      this.updateCursor();
      this.updateHotspotLayer();
    }

    /*
      isPointerMoveAllowedDuringActionMode()
      포인트 앤 클릭 전환 이후에도 보스전/최종전에서는 위치 회피가 필요합니다.
      키보드 조작을 유지하면서, 마우스 클릭 위치로 이동하는 보조 조작을 제공합니다.
    */
    isPointerMoveAllowedDuringActionMode() {
      return this.game.mode === "gameplay"
        && (this.game.boss?.phase === "attack" || this.game.isFinalBattleActive());
    }

    /*
      updateActionMove()
      전투 중 클릭 이동 보조입니다. 즉시 텔레포트하지 않고 천천히 이동해
      기존 회피 난이도와 분위기를 크게 망치지 않습니다.
    */
    updateActionMove(delta) {
      if (!this.moveTarget || !this.isPointerMoveAllowedDuringActionMode()) return;

      const dx = this.moveTarget.x - this.game.player.x;
      const dy = this.moveTarget.y - this.game.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 8) {
        this.moveTarget = null;
        return;
      }

      const speed = this.game.player.speed * 0.85;
      this.game.player.x += (dx / distance) * speed * delta;
      this.game.player.y += (dy / distance) * speed * delta;
      this.game.clampPlayerToScene();
    }

    /*
      handlePuzzlePointer()
      암호 입력 UI를 마우스로 조작할 수 있게 합니다.
      키보드 입력은 기존 game.js에 그대로 남겨 두고, 클릭은 같은 PuzzleSystem API를 호출합니다.
    */
    handlePuzzlePointer(point) {
      const buttons = this.getPuzzleButtons();
      const hit = buttons.find((button) => point.x >= button.x
        && point.x <= button.x + button.width
        && point.y >= button.y
        && point.y <= button.y + button.height);
      if (!hit) return;

      if (hit.kind === "digit") {
        this.game.puzzle.inputDigit(hit.value);
      } else if (hit.kind === "backspace") {
        this.game.puzzle.backspace();
      } else if (hit.kind === "submit") {
        this.game.puzzle.submit();
      } else if (hit.kind === "close") {
        this.game.puzzle.close();
      }
    }

    /*
      handleQtePointer()
      최종 QTE는 기존 키보드 입력을 유지하되, 포인트 앤 클릭 플레이어가 막히지 않도록
      화면 클릭으로 현재 요구 키를 하나씩 입력한 것처럼 처리합니다.
    */
    handleQtePointer() {
      const current = this.game.qte?.sequence[this.game.qte.index];
      if (!current) return;
      this.game.handleQteInput(current === "SPACE" ? " " : current);
    }

    /*
      handleQuizPointer()
      보스 퀴즈 선택지를 클릭으로 고를 수 있게 합니다.
      화면에 그려지는 선택지 좌표와 동일한 영역을 사용합니다.
    */
    handleQuizPointer(point) {
      for (let index = 0; index < 4; index += 1) {
        const y = 246 + index * 54;
        if (point.x >= 360 && point.x <= 920 && point.y >= y && point.y <= y + 38) {
          this.game.quiz.answerBossQuiz(index);
          return;
        }
      }
    }

    /*
      getPuzzleButtons()
      drawPuzzleInput()과 같은 좌표계를 공유하는 클릭 키패드 정의입니다.
      하드코딩을 줄이기 위해 버튼 배치를 한 함수에서 생성합니다.
    */
    getPuzzleButtons() {
      const buttons = [];
      const labels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "OK"];
      labels.forEach((label, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = 500 + col * 94;
        const y = 430 + row * 48;
        buttons.push({
          x,
          y,
          width: 78,
          height: 36,
          value: label,
          kind: label === "OK" ? "submit" : label === "DEL" ? "backspace" : "digit"
        });
      });
      buttons.push({
        x: 854,
        y: 198,
        width: 38,
        height: 34,
        value: "X",
        kind: "close"
      });
      return buttons;
    }

    /*
      updateHotspotLayer()
      -------------------------------------------------------------------------
      현재 Scene의 Hotspot 목록을 실제 DOM 버튼으로 동기화합니다.

      중요한 UX 원칙:
      - 대화창/메뉴/퍼즐/퀴즈가 열려 있을 때는 배경 버튼을 모두 제거합니다.
      - gameplay 상태에서만 버튼을 만듭니다.
      - 좌표는 1280x720 기준 데이터를 퍼센트로 변환해서 창 크기가 바뀌어도 맞게 합니다.
      - 버튼 클릭은 stopPropagation 처리하여 screen/canvas fallback 입력과 중복 실행되지
        않게 합니다.
    */
    updateHotspotLayer() {
      if (!this.hotspotLayer) return;

      if (
        !this.enabled
        || this.game.mode !== "gameplay"
        || this.isExplorationLocked()
        || this.game.minigame?.isOpen?.()
        || this.game.isFinalBattleActive?.()
        || this.game.isFinalBattleBlocking?.()
      ) {
        this.hotspotSignature = null;
        this.hotspotLayer.innerHTML = "";
        this.hotspotLayer.classList.add("hidden");
        return;
      }

      const hotspots = this.getCurrentHotspots();
      const signature = this.game.scene.current.id + JSON.stringify(hotspots);
      if (signature === this.hotspotSignature) return;
      this.hotspotSignature = signature;
      this.hotspotLayer.innerHTML = "";
      this.hotspotLayer.classList.toggle("hidden", hotspots.length === 0);

      hotspots.forEach((hotspot) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "point-hotspot";
        button.dataset.hotspotId = hotspot.id;
        button.setAttribute("aria-label", hotspot.name || "조사");
        button.title = hotspot.name || "조사";
        button.style.left = `${(hotspot.x / 1280) * 100}%`;
        button.style.top = `${(hotspot.y / 720) * 100}%`;
        button.style.width = `${(hotspot.width / 1280) * 100}%`;
        button.style.height = `${(hotspot.height / 720) * 100}%`;

        const dot = document.createElement("span");
        dot.className = "point-hotspot__dot";
        this.positionHotspotDot(dot, hotspot, hotspot);
        button.appendChild(dot);

        button.addEventListener("pointerenter", () => {
          this.hoveredHotspot = hotspot;
          this.updateCursor();
        });

        button.addEventListener("pointerleave", () => {
          if (this.hoveredHotspot?.id === hotspot.id) {
            this.hoveredHotspot = null;
            this.updateCursor();
          }
        });

        const activateFromDom = (event) => {
          if (event.osseHandled) return;
          event.preventDefault();
          event.stopPropagation();
          event.osseHandled = true;
          this.activateHotspot(hotspot);
        };

        button.addEventListener("click", activateFromDom);

        this.hotspotLayer.appendChild(button);
      });
    }

    positionHotspotDot(dot, hotspot, rect) {
      /*
        positionHotspotDot()
        ---------------------------------------------------------------------
        클릭 영역과 시각 표시점을 분리합니다.

        포인트앤클릭 사진에서는 "클릭 가능한 영역"은 넓게 잡아야 UX가 편하지만,
        표시점까지 그 넓은 영역의 정중앙에 놓으면 실제 물체와 어긋나 보입니다.
        scene.js 이벤트에 markerX/markerY가 있으면 그 지점을 표시점으로 사용하고,
        없으면 기존처럼 클릭 영역 중앙에 표시합니다.
      */
      const markerX = hotspot.markerX ?? (hotspot.x + hotspot.width / 2);
      const markerY = hotspot.markerY ?? (hotspot.y + hotspot.height / 2);
      const relativeX = ((markerX - rect.x) / rect.width) * 100;
      const relativeY = ((markerY - rect.y) / rect.height) * 100;
      dot.style.left = `${Math.max(0, Math.min(100, relativeX))}%`;
      dot.style.top = `${Math.max(0, Math.min(100, relativeY))}%`;
    }

    /*
      openFocusScene()
      기존 scene.js에는 없는 "확대 화면"을 가상으로 엽니다.
      실제 scene id를 바꾸지 않기 때문에 이벤트 순서와 저장 데이터는 유지됩니다.
    */
    openFocusScene(event) {
      this.focusEvent = event;
      this.setBackButtonVisible(true);
    }

    /*
      goBack()
      확대 화면에서 원래 사진 Scene으로 돌아갑니다.
      ESC 키나 화면의 BACK 버튼에서 호출됩니다.
    */
    goBack() {
      if (!this.focusEvent) return;
      this.focusEvent = null;
      this.setBackButtonVisible(false);
      this.fade = 0.2;
    }

    /*
      shouldOpenFocusScene()
      어떤 기존 이벤트를 확대 화면으로 먼저 보여줄지 결정합니다.
      문/화살표/장면 전환은 Cube Escape처럼 바로 이동하고, 조사/아이템/퍼즐은
      확대 후 다시 클릭하도록 처리합니다.
    */
    shouldOpenFocusScene(event) {
      /*
        자동 확대 오버레이 비활성화
        ---------------------------------------------------------------------
        초기에 Cube Escape 느낌을 내기 위해 일반 조사/아이템 클릭 시 canvas 위에 가상
        확대 화면을 한 번 더 띄웠습니다. 실제 사진 기반 Scene이 늘어나면서 이 오버레이는
        핫스팟과 설명이 겹쳐 보이고, 이야기 진행에도 꼭 필요하지 않게 되었습니다.

        앞으로 확대가 필요한 경우에는 scene.js에 명시된 독립 Scene으로만 이동합니다.
        이 함수는 기존 호출 구조를 유지하기 위해 남겨두되 항상 false를 반환합니다.
      */
      return false;
    }

    /*
      executeSceneEvent()
      기존 SceneSystem.interact()와 같은 순서로 event manager를 통과시킵니다.
      선택한 아이템이 있으면 이벤트 실행 전에 사용 가능 여부를 먼저 확인합니다.
    */
    executeSceneEvent(event) {
      if (!event) return;

      if (this.selectedItemId) {
        const result = this.tryUseSelectedItem(event);
        if (result.handled && result.success) {
          this.clearSelectedItem();
          this.focusEvent = null;
          this.setBackButtonVisible(false);
        }
        if (result.handled) {
          return;
        }
      }

      if (this.isExecutionBlockedBySelection(event)) {
        return;
      }

      this.game.scene.triggerEvent(event);
      this.focusEvent = null;
      this.setBackButtonVisible(false);
      this.renderInventory();
    }

    /*
      tryUseSelectedItem()
      포인트 앤 클릭 방식의 아이템 사용 규칙입니다.
      기존 이벤트/아이템/플래그는 그대로 사용하고, 사용 UI만 하단 인벤토리 선택형으로
      바꿉니다. 예: 빠루 선택 -> 대표실 문/나무판자 클릭 -> 기존 빠루 QTE 실행.
    */
    tryUseSelectedItem(event) {
      if (this.selectedItemId === "crowbar" && ["ceo_crowbar_target", "ceo_blocked_door"].includes(event.id)) {
        this.game.handleAction({ type: "start_crowbar_event" });
        return { handled: true, success: true };
      }

      if (this.selectedItemId === "second_floor_auth_card" && event.id === "second_floor_shutter") {
        this.game.handleAction({ type: "start_second_floor_shutter" });
        return { handled: true, success: true };
      }

      if (this.selectedItemId === "security_access_card" && event.id === "office_door_card_reader") {
        this.game.handleAction({ type: "office_card_reader" });
        return { handled: true, success: true };
      }

      this.game.dialog.start("item_use_failed");
      return { handled: true, success: false };
    }

    /*
      isExecutionBlockedBySelection()
      아이템 선택 상태에서 일반 조사를 바로 실행하면 플레이어 입장에서는
      "아이템을 썼는지, 그냥 조사했는지"가 흐려집니다. 실패 메시지를 보여준 뒤
      같은 확대 화면에 남겨 UX를 명확하게 유지합니다.
    */
    isExecutionBlockedBySelection(event) {
      return Boolean(this.selectedItemId && event);
    }

    /*
      getHotspotAt()
      현재 Room Scene 또는 Focus Scene에서 좌표에 맞는 Hotspot을 찾습니다.
      onceFlag/requiresFlag/blockedByFlag 규칙은 scene.js의 기존 이벤트 규칙과 동일하게
      적용합니다.
    */
    getHotspotAt(x, y) {
      const directHit = this.getCurrentHotspots().find((hotspot) => (
        x >= hotspot.x
        && x <= hotspot.x + hotspot.width
        && y >= hotspot.y
        && y <= hotspot.y + hotspot.height
      ));

      if (directHit) {
        return directHit;
      }

      return null;
    }

    /*
      getNearestHotspot()
      -------------------------------------------------------------------------
      포인트앤클릭 게임에서 "봤는데 눌러도 아무 일 없음"은 치명적인 UX 문제입니다.
      정확한 사각형을 클릭하지 못해도 주변에 명확한 Hotspot이 있으면 그 오브젝트로
      보정합니다. 특히 dummy.png 단계에서는 실제 사진 윤곽이 없기 때문에 판정을 넉넉하게
      가져가야 진행이 막히지 않습니다.
    */
    getNearestHotspot(x, y) {
      const hotspots = this.getCurrentHotspots();
      const nearest = hotspots
        .map((hotspot) => {
          const centerX = hotspot.x + hotspot.width / 2;
          const centerY = hotspot.y + hotspot.height / 2;
          return {
            hotspot,
            distance: Math.hypot(x - centerX, y - centerY)
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];

      if (!nearest) return null;

      const forgivingRadius = this.focusEvent ? 190 : 150;
      return nearest.distance <= forgivingRadius ? nearest.hotspot : null;
    }

    /*
      logMissedClick()
      -------------------------------------------------------------------------
      QA용 안전 로그입니다. 플레이어 화면에는 아무것도 띄우지 않지만, 개발 중에는 콘솔에서
      "클릭은 들어왔는데 Hotspot이 없었다"를 즉시 확인할 수 있습니다.
    */
    logMissedClick(point) {
      if (!window.OSSE_DEBUG_POINTERS) return;
      console.debug("PointClick missed", {
        scene: this.game.scene.current?.id,
        x: Math.round(point.x),
        y: Math.round(point.y),
        hotspots: this.getCurrentHotspots().map((hotspot) => ({
          id: hotspot.id,
          x: Math.round(hotspot.x),
          y: Math.round(hotspot.y),
          width: Math.round(hotspot.width),
          height: Math.round(hotspot.height)
        }))
      });
    }

    /*
      getCurrentHotspots()
      Scene 위 클릭 가능한 영역 목록을 반환합니다.
      Focus Scene에서는 중앙의 큰 실행 Hotspot과 뒤로가기 Hotspot만 반환합니다.
    */
    getCurrentHotspots() {
      if (this.focusEvent) {
        return [
          {
            id: `${this.focusEvent.id}_execute`,
            name: this.focusEvent.name,
            type: "execute",
            event: this.focusEvent,
            x: 360,
            y: 150,
            width: 560,
            height: 390
          },
          {
            id: "focus_back",
            name: "돌아가기",
            type: "back",
            x: 48,
            y: 604,
            width: 160,
            height: 56
          }
        ];
      }

      return (this.game.scene.current?.events || [])
        .filter((event) => this.isEventActive(event))
        .map((event) => this.createSceneHotspot(event));
    }

    /*
      createSceneHotspot()
      scene.js의 원본 좌표는 유지하면서 포인트 앤 클릭용 클릭 판정만 보정합니다.
      작은 오브젝트를 실제 사진에서 누르기 어렵지 않도록 최소 크기를 둡니다.
    */
    createSceneHotspot(event) {
      const size = 96;
      const width = size;
      const height = size;
      const centerX = event.markerX ?? (event.x + event.width / 2);
      const centerY = event.markerY ?? (event.y + event.height / 2);

      return {
        id: event.id,
        name: event.name,
        type: "scene",
        event,
        x: clamp(centerX - width / 2, 0, 1280 - width),
        y: clamp(centerY - height / 2, 0, 720 - height),
        width,
        height
      };
    }

    /*
      isEventActive()
      기존 SceneSystem.getNearbyEvent()의 플래그 필터를 포인트 앤 클릭에도 적용합니다.
    */
    isEventActive(event) {
      if (event.disabledUntilPhoto) return false;
      if (event.onceFlag && this.game.flags[event.onceFlag]) return false;
      if (event.requiresFlag && !this.game.flags[event.requiresFlag]) return false;
      if (event.blockedByFlag && this.game.flags[event.blockedByFlag]) return false;
      return true;
    }

    /*
      renderInventory()
      하단 빠른 인벤토리를 현재 inventory.js 상태로 다시 그립니다.
      아이템 데이터와 보유 개수는 반드시 InventorySystem을 통해서만 읽습니다.
    */
    renderInventory() {
      if (!this.inventoryBar) {
        console.warn("PointClickSceneManager: #quick-inventory was not found.");
        return;
      }

      const items = this.game.inventory.list();
      this.inventoryBar.innerHTML = "";
      this.inventoryBar.classList.toggle("is-empty", items.length === 0);

      if (items.length === 0) {
        const empty = document.createElement("span");
        empty.className = "quick-inventory__empty";
        empty.textContent = "인벤토리 비어 있음";
        this.inventoryBar.appendChild(empty);
        return;
      }

      items.forEach((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quick-inventory__item";
        button.classList.toggle("is-selected", this.selectedItemId === item.id);
        button.textContent = `${item.name || item.id} x${item.count}`;
        button.title = item.description || item.id;
        button.addEventListener("click", () => {
          if (this.selectedItemId && this.selectedItemId !== item.id) {
            const result = this.game.inventory.combine(this.selectedItemId, item.id);
            if (result.success) {
              this.selectedItemId = "";
              this.game.ui.showModal({
                title: "조합",
                body: result.message,
                actions: [{ label: "확인", callback: () => this.game.ui.hideModal() }]
              });
              this.renderInventory();
              this.game.ui.renderMenu();
              return;
            }
          }

          this.selectedItemId = this.selectedItemId === item.id ? "" : item.id;
          this.renderInventory();
        });
        this.inventoryBar.appendChild(button);
      });
    }

    /*
      clearSelectedItem()
      아이템 사용 성공 후 선택 상태를 정리합니다.
    */
    clearSelectedItem() {
      this.selectedItemId = "";
      this.renderInventory();
    }

    /*
      resetTransientState()
      저장/불러오기, 새 게임, 장면 전환처럼 큰 상태 변화가 있을 때 Focus Scene,
      클릭 이동 목표, hover 상태을 정리합니다. 세이브 파일에는 임시 UI 상태를
      남기지 않는 편이 안정적입니다.
    */
    resetTransientState(options = {}) {
      this.focusEvent = null;
      this.moveTarget = null;
      this.hoveredHotspot = null;
      this.setBackButtonVisible(false);
      if (options.clearItem) {
        this.clearSelectedItem();
      }
      this.updateCursor();
    }

    /*
      setBackButtonVisible()
      -------------------------------------------------------------------------
      Focus Scene에서 원래 Scene으로 돌아가는 버튼의 표시 상태를 한 곳에서 관리합니다.
      HTML에는 #point-back이 존재하지만, QA 중 마크업이 변경되어도 포인트앤클릭 시스템이
      부팅을 막지 않도록 null-safe 처리를 유지합니다.
    */
    setBackButtonVisible(isVisible) {
      if (!this.backButton) return;
      this.backButton.classList.toggle("hidden", !isVisible);
      this.backButton.toggleAttribute("data-active", isVisible);
      this.backButton.setAttribute("aria-hidden", String(!isVisible));
    }

    /*
      draw()
      포인트 앤 클릭 UI 렌더링입니다.
      - Focus Scene 확대 배경
      - Hotspot hover/click 가능 영역
      - Fade 전환
    */
    draw(ctx) {
      if (!this.enabled || this.game.mode !== "gameplay") return;
      if (this.isExplorationLocked()) return;

      if (this.focusEvent) {
        this.drawFocusScene(ctx);
      }

      this.drawHotspots(ctx);
      this.drawSelectedItemStatus(ctx);
      this.drawFirstHint(ctx);
      this.drawFade(ctx);
    }

    /*
      drawSelectedItemStatus()
      현재 어떤 아이템을 들고 있는지 상단에 짧게 표시합니다.
      아이템 오사용이 버그처럼 느껴지지 않게 하는 UX 피드백입니다.
    */
    drawSelectedItemStatus(ctx) {
      if (!this.selectedItemId) return;
      const item = this.game.inventory.list().find((entry) => entry.id === this.selectedItemId);
      const name = item?.name || this.selectedItemId;
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.64)";
      ctx.fillRect(466, 140, 348, 34);
      ctx.strokeStyle = "#58c7a5";
      ctx.strokeRect(466, 140, 348, 34);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "14px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(`선택한 아이템: ${name}`, 640, 162);
      ctx.restore();
    }

    /*
      updateFirstHint()
      첫 플레이어가 포인트 앤 클릭 조작을 놓치지 않도록 짧은 힌트를 한 번만 띄웁니다.
      스토리 대사가 아니므로 dialog.json이 아니라 UI 상태로 관리합니다.
    */
    updateFirstHint(delta) {
      if (this.game.mode !== "gameplay") return;
      if (!this.game.flags.prologue_seen_exterior || this.game.flags.point_click_hint_seen) return;
      this.game.flags.point_click_hint_seen = true;
      this.hintTimer = 5.0;
    }

    /*
      drawFirstHint()
      분위기를 해치지 않도록 짧고 낮은 대비로 조작 힌트를 보여줍니다.
    */
    drawFirstHint(ctx) {
      if (this.hintTimer <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(0.85, this.hintTimer / 0.8);
      ctx.fillStyle = "rgba(0, 0, 0, 0.58)";
      ctx.fillRect(438, 94, 404, 38);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "15px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("사진 속 사물을 클릭해 조사한다.", 640, 119);
      ctx.restore();
    }

    /*
      drawFocusScene()
      확대 사진 화면입니다. 현재는 dummy.png 기반의 프레임으로 표현하며,
      실제 회사 사진이 준비되면 scene.js background 또는 별도 image map만 교체하면 됩니다.
      TODO : Replace Image
    */
    drawFocusScene(ctx) {
      ctx.save();
      ctx.fillStyle = "#08090a";
      ctx.fillRect(0, 0, 1280, 720);

      if (this.game.scene.backgroundImage.complete) {
        const crop = this.getFocusCrop();
        ctx.globalAlpha = 0.22;
        ctx.drawImage(this.game.scene.backgroundImage, 0, 0, 1280, 720);
        ctx.globalAlpha = 1;
        ctx.drawImage(
          this.game.scene.backgroundImage,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          260,
          118,
          760,
          464
        );
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
      ctx.fillRect(260, 118, 760, 464);
      ctx.strokeStyle = "#d8d0b8";
      ctx.lineWidth = 4;
      ctx.strokeRect(260, 118, 760, 464);
      ctx.fillStyle = "#f4f0e8";
      ctx.font = "24px Courier New";
      ctx.textAlign = "center";
      ctx.fillText(this.focusEvent.name || "Inspect", 640, 122);
      ctx.font = "15px Courier New";
      ctx.fillStyle = "#9da4aa";
      ctx.fillText("오브젝트를 클릭해 조사하거나 선택한 아이템을 사용한다.", 640, 560);
      ctx.restore();
    }

    /*
      getFocusCrop()
      Focus Scene이 실제 사진 확대처럼 느껴지도록, 원본 Scene 배경에서 클릭한
      Hotspot 주변을 넉넉히 잘라 확대합니다. dummy.png일 때도 나중에 실사진으로
      바꿨을 때 바로 자연스럽게 동작합니다.
    */
    getFocusCrop() {
      const event = this.focusEvent;
      const width = Math.min(720, Math.max(260, event.width * 3.4));
      const height = Math.min(440, Math.max(200, event.height * 3.4));
      const centerX = event.x + event.width / 2;
      const centerY = event.y + event.height / 2;
      return {
        x: clamp(centerX - width / 2, 0, 1280 - width),
        y: clamp(centerY - height / 2, 0, 720 - height),
        width,
        height
      };
    }

    /*
      drawHotspots()
      Hover 가능한 영역을 미묘하게 표시합니다.
      실제 사진 위에서 너무 게임 UI처럼 보이지 않도록 낮은 투명도와 픽셀 테두리만 사용합니다.
    */
    drawHotspots(ctx) {
      this.getCurrentHotspots().forEach((hotspot) => {
        const isHover = this.hoveredHotspot?.id === hotspot.id;
        ctx.save();
        ctx.globalAlpha = isHover ? 0.18 : 0;
        ctx.fillStyle = isHover ? "#f4f0e8" : "#d8d0b8";
        ctx.fillRect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);
        ctx.globalAlpha = isHover ? 0.48 : 0;
        ctx.strokeStyle = isHover ? "#58c7a5" : "#d8d0b8";
        ctx.lineWidth = isHover ? 2 : 1;
        ctx.strokeRect(hotspot.x, hotspot.y, hotspot.width, hotspot.height);

        /*
          Hotspot hint dot
          ---------------------------------------------------------------------
          포인트앤클릭에서는 첫 장면부터 "어디가 반응하는지"가 최소한 감으로 보여야 합니다.
          큰 튜토리얼 문구 대신 작은 점만 표시해서 탐색감을 해치지 않으면서 첫 클릭 실패를
          줄입니다.
        */
        ctx.globalAlpha = isHover ? 0.9 : 0.12;
        ctx.fillStyle = "#f4f0e8";
        ctx.beginPath();
        const markerX = hotspot.markerX ?? (hotspot.x + hotspot.width / 2);
        const markerY = hotspot.markerY ?? (hotspot.y + hotspot.height / 2);
        ctx.arc(markerX, markerY, isHover ? 5 : 2, 0, Math.PI * 2);
        ctx.fill();

        if (isHover) {
          const labelWidth = Math.min(280, Math.max(100, hotspot.name.length * 15));
          const labelX = Math.min(1280 - labelWidth - 8, Math.max(8, hotspot.x));
          const labelY = Math.max(8, hotspot.y - 28);
          ctx.fillStyle = "#0a0c0d";
          ctx.fillRect(labelX, labelY, labelWidth, 24);
          ctx.fillStyle = "#f4f0e8";
          ctx.font = "14px Courier New";
          ctx.textAlign = "left";
          ctx.fillText(hotspot.name, labelX + 8, labelY + 17);
        }
        ctx.restore();
      });
    }

    /*
      drawFade()
      Cube Escape식 장면 전환을 위한 짧은 Fade입니다.
    */
    drawFade(ctx) {
      if (this.fade <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, this.fade / 0.28);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
    }

    /*
      updateCursor()
      기본 커서를 숨기고 CSS 클래스 기반 픽셀 커서 상태를 전환합니다.
    */
    updateCursor() {
      document.body.classList.toggle("cursor-hotspot", Boolean(this.hoveredHotspot));
      document.body.classList.toggle("cursor-item", Boolean(this.selectedItemId));
    }

    /*
      getCanvasPoint()
      CSS로 리사이즈된 캔버스 좌표를 내부 1280x720 좌표로 변환합니다.
    */
    getCanvasPoint(event) {
      const rect = this.game.canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * 1280,
        y: ((event.clientY - rect.top) / rect.height) * 720
      };
    }
  }

  window.OSSE.PointClickSceneManager = PointClickSceneManager;
  window.OSSE.POINT_CLICK_ASSET_PATHS = POINT_CLICK_ASSET_PATHS;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
})();
