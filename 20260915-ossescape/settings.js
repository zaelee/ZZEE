(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    SettingsSystem
    ---------------------------------------------------------------------------
    새 콘텐츠를 만들지 않고 게임의 품질 옵션을 한곳에 모으는 시스템입니다.

    담당 범위:
    - BGM / SE / CRT / Bloom / Language / Window Scale / Colorblind Mode
    - 키 설정 변경
    - 입력 액션을 실제 키보드 키와 분리해서 game.js가 하드코딩 키에 덜 의존하게 함
    - 설정 저장/로드

    현재 게임에는 파일 기반 BGM이 없으므로 BGM 옵션은 향후 오디오 트랙이 붙을 때
    바로 사용할 수 있는 상태값으로 유지합니다. SE는 Web Audio 합성음의 master
    볼륨에 반영됩니다.
  */

  const SETTINGS_KEY = "OSSEsecpae.settings";

  const DEFAULT_SETTINGS = {
    bgm: 0.7,
    se: 0.65,
    crt: true,
    bloom: true,
    language: "ko",
    windowScale: 1,
    colorblind: false,
    bindings: {
      up: ["w", "arrowup"],
      down: ["s", "arrowdown"],
      left: ["a", "arrowleft"],
      right: ["d", "arrowright"],
      interact: ["e"],
      menu: ["escape"]
    }
  };

  class SettingsSystem {
    constructor() {
      this.values = structuredCloneSafe(DEFAULT_SETTINGS);
      this.waitingForAction = "";
      this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        this.values = mergeSettings(DEFAULT_SETTINGS, saved);
      } catch (error) {
        console.warn("Settings could not be loaded.", error);
        this.values = structuredCloneSafe(DEFAULT_SETTINGS);
      }
    }

    save() {
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.values)); }
      catch { /* Settings still apply for this session when storage is unavailable. */ }
    }

    set(key, value) {
      this.values[key] = value;
      this.save();
      this.applyDocumentState();
    }

    setBinding(action, key) {
      const normalized = normalizeKey(key);
      if (!normalized) return;
      this.values.bindings[action] = [normalized];
      this.waitingForAction = "";
      this.save();
    }

    isAction(action, key) {
      const normalized = normalizeKey(key);
      return (this.values.bindings[action] || []).includes(normalized);
    }

    getAxis(keys) {
      const has = (action) => (this.values.bindings[action] || []).some((key) => keys.has(key));
      return {
        x: Number(has("right")) - Number(has("left")),
        y: Number(has("down")) - Number(has("up"))
      };
    }

    applyDocumentState() {
      document.body.classList.toggle("colorblind-mode", Boolean(this.values.colorblind));
      document.body.classList.toggle("crt-off", !this.values.crt);
      document.documentElement.style.setProperty("--screen-width-effective", `${1280 * this.values.windowScale}px`);
    }

    renderInto(container, onChange) {
      container.innerHTML = "";
      container.appendChild(this.createRange("효과음", "se", onChange));
      container.appendChild(this.createToggle("CRT", "crt", onChange));
      container.appendChild(this.createToggle("Bloom", "bloom", onChange));
      container.appendChild(this.createToggle("색약 모드", "colorblind", onChange));
      container.appendChild(this.createSelect("창 크기", "windowScale", [
        [0.75, "75%"],
        [1, "100%"],
        [1.25, "125%"]
      ], onChange));
      container.appendChild(this.createBindings(onChange));
    }

    createRange(label, key, onChange) {
      const row = createRow(label);
      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "1";
      input.step = "0.05";
      input.value = String(this.values[key]);
      input.addEventListener("change", () => {
        this.set(key, Number(input.value));
        onChange();
      });
      row.appendChild(input);
      return row;
    }

    createToggle(label, key, onChange) {
      const row = createRow(label);
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(this.values[key]);
      input.addEventListener("change", () => {
        this.set(key, input.checked);
        onChange();
      });
      row.appendChild(input);
      return row;
    }

    createSelect(label, key, options, onChange) {
      const row = createRow(label);
      const select = document.createElement("select");
      options.forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = String(value);
        option.textContent = text;
        if (String(this.values[key]) === String(value)) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        const value = key === "windowScale" ? Number(select.value) : select.value;
        this.set(key, value);
        onChange();
      });
      row.appendChild(select);
      return row;
    }

    createBindings(onChange) {
      const group = document.createElement("div");
      group.className = "settings__bindings";
      const title = document.createElement("h3");
      title.textContent = "키 설정";
      group.appendChild(title);

      ["up", "down", "left", "right", "interact", "menu"].forEach((action) => {
        const button = document.createElement("button");
        button.type = "button";
        const current = (this.values.bindings[action] || [])[0] || "-";
        const label = getActionLabel(action);
        button.textContent = this.waitingForAction === action
          ? `${label}: 키를 누르세요`
          : `${label}: ${current.toUpperCase()}`;
        button.addEventListener("click", () => {
          this.waitingForAction = action;
          onChange();
        });
        group.appendChild(button);
      });

      return group;
    }
  }

  function createRow(labelText) {
    const label = document.createElement("label");
    label.className = "settings__row";
    const span = document.createElement("span");
    span.textContent = labelText;
    label.appendChild(span);
    return label;
  }

  function getActionLabel(action) {
    const labels = {
      up: "위",
      down: "아래",
      left: "왼쪽",
      right: "오른쪽",
      interact: "조사",
      menu: "메뉴"
    };
    return labels[action] || action;
  }

  function mergeSettings(defaults, saved) {
    const values = structuredCloneSafe(defaults);
    if (!saved || typeof saved !== "object") return values;
    for (const key of ["bgm", "se"]) {
      if (Number.isFinite(saved[key])) values[key] = Math.max(0, Math.min(1, saved[key]));
    }
    for (const key of ["crt", "bloom", "colorblind"]) {
      if (typeof saved[key] === "boolean") values[key] = saved[key];
    }
    if ([0.75, 1, 1.25].includes(saved.windowScale)) values.windowScale = saved.windowScale;
    for (const action of Object.keys(values.bindings)) {
      const keys = saved.bindings?.[action];
      if (Array.isArray(keys) && keys.length && keys.every((key) => typeof key === "string" && key.length > 0)) values.bindings[action] = keys;
    }
    return values;
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeKey(key) {
    if (!key) return "";
    return key === " " ? "space" : String(key).toLowerCase();
  }

  window.OSSE.SettingsSystem = SettingsSystem;
})();
