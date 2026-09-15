(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    Inventory item database
    ---------------------------------------------------------------------------
    모든 아이템의 이름, 설명, 타입을 한곳에서 관리합니다.

    기존 시스템은 itemId만 저장하고, 화면에 표시할 때 이 데이터베이스를 조회합니다.
    그래서 추후 실제 퍼즐 아이템이 늘어나도 저장 데이터 구조를 바꾸지 않아도 됩니다.

    type 기준:
    - key: 문이나 인증 장치에 사용하는 핵심 아이템
    - tool: 여러 장소에서 재사용 가능한 도구
    - material: 조합 재료
    - document: 읽거나 단서로 쓰는 문서
    - sample: RB-13 관련 샘플/위험물
  */
  const ITEM_DATA = {
    test_keycard: {
      id: "test_keycard",
      name: "Test Keycard",
      description: "A placeholder key item used to verify locked-door events.",
      type: "key"
    },
    security_access_card: {
      id: "security_access_card",
      name: "경비 출입카드",
      description: "경비실 출입 및 일부 셔터를 열 수 있는 카드.",
      type: "key",
      icon: "assets/props/items/security_access_card.png"
    },
    second_floor_auth_card: {
      id: "second_floor_auth_card",
      name: "2층 인증카드",
      description: "2층 셔터를 열 수 있는 인증카드.",
      type: "key",
      icon: "assets/props/items/second_floor_auth_card.png"
    },
    crowbar: {
      id: "crowbar",
      name: "빠루",
      description: "무거운 문이나 잠긴 판을 벌릴 수 있을 것 같다.",
      type: "tool",
      icon: "assets/props/items/crowbar.png"
    },

    employee_badge: {
      id: "employee_badge",
      name: "사원증",
      description: "사진이 조금 낡은 사원증. 카드 리더가 알아볼지는 모르겠다.",
      type: "material",
      icon: "assets/props/items/employee_id_card.png"
    },
    clear_tape: {
      id: "clear_tape",
      name: "투명 테이프",
      description: "찢어진 종이나 임시 표식을 붙일 수 있다.",
      type: "material",
      icon: "assets/props/items/transparent_tape_roll.png"
    },
    temporary_access_card: {
      id: "temporary_access_card",
      name: "임시 출입카드",
      description: "사원증과 테이프를 조합한 임시 카드. 오래 버티지는 못할 것 같다.",
      type: "key",
      icon: "assets/props/items/temporary_access_card.png"
    },
    usb_drive: {
      id: "usb_drive",
      name: "USB",
      description: "회사에 두고 온 USB. 안에 복구 로그가 남아 있을지도 모른다.",
      type: "key",
      icon: "assets/props/items/usb_drive.png"
    },
    screwdriver: {
      id: "screwdriver",
      name: "드라이버",
      description: "나사를 풀거나 작은 패널을 열 때 쓸 수 있다.",
      type: "tool",
      icon: "assets/props/items/screwdriver.png"
    },
    battery: {
      id: "battery",
      name: "배터리",
      description: "아직 전기가 조금 남아 있는 배터리.",
      type: "material",
      icon: "assets/props/items/battery.png"
    },
    flashlight_body: {
      id: "flashlight_body",
      name: "고장난 손전등",
      description: "배터리만 있으면 켜질 것 같다.",
      type: "tool",
      icon: "assets/props/items/broken_flashlight.png"
    },
    flashlight: {
      id: "flashlight",
      name: "손전등",
      description: "어두운 창고 구석을 살필 수 있다.",
      type: "tool",
      icon: "assets/props/items/working_flashlight.png"
    },
    uv_filter: {
      id: "uv_filter",
      name: "UV 필터",
      description: "디자인실 장비에서 떼어낸 필터. 평범한 빛을 이상하게 바꾼다.",
      type: "material",
      icon: "assets/props/items/uv_filter.png"
    },
    uv_flashlight: {
      id: "uv_flashlight",
      name: "UV 손전등",
      description: "숨겨진 메모나 지워진 표시를 드러낼 수 있다.",
      type: "tool",
      icon: "assets/props/items/uv_flashlight.png"
    },
    empty_cup: {
      id: "empty_cup",
      name: "빈 컵",
      description: "탕비실에서 흔히 볼 수 있는 종이컵.",
      type: "material",
      icon: "assets/props/items/empty_cup.png"
    },
    water_cup: {
      id: "water_cup",
      name: "물컵",
      description: "정수기에서 받은 물. 열이나 얼음 퍼즐에 사용할 수 있다.",
      type: "material",
      icon: "assets/props/items/water_cup.png"
    },
    rubber_gloves: {
      id: "rubber_gloves",
      name: "고무장갑",
      description: "붉은콩이나 정체 모를 액체를 직접 만지지 않게 해준다.",
      type: "tool",
      icon: "assets/props/items/rubber_gloves.png"
    },
    red_bean_sample_safe: {
      id: "red_bean_sample_safe",
      name: "보관된 붉은콩",
      description: "고무장갑으로 안전하게 집어 올린 RB-13 샘플.",
      type: "sample",
      icon: "assets/props/items/rb13_sample_jar.png"
    },
    insulated_gloves: {
      id: "insulated_gloves",
      name: "절연장갑",
      description: "전선이나 배전반을 다룰 때 필요하다.",
      type: "tool",
      icon: "assets/props/items/insulated_gloves.png"
    },
    wire_bundle: {
      id: "wire_bundle",
      name: "전선 뭉치",
      description: "끊어진 전원을 임시로 연결할 수 있을 것 같다.",
      type: "material",
      icon: "assets/props/items/wire_bundle.png"
    },
    power_bridge: {
      id: "power_bridge",
      name: "임시 전원 연결선",
      description: "절연장갑을 끼고 전선을 정리해 만든 임시 연결선.",
      type: "tool",
      icon: "assets/props/items/temporary_power_cable.png"
    },
    meeting_key_half_a: {
      id: "meeting_key_half_a",
      name: "회의실 열쇠 조각 A",
      description: "반쪽짜리 열쇠 조각.",
      type: "material"
    },
    meeting_key_half_b: {
      id: "meeting_key_half_b",
      name: "회의실 열쇠 조각 B",
      description: "반쪽짜리 열쇠 조각.",
      type: "material"
    },
    meeting_room_key: {
      id: "meeting_room_key",
      name: "회의실 열쇠",
      description: "두 조각을 맞춰 만든 회의실 열쇠.",
      type: "key"
    }
  };

  /*
    Inventory combination recipes
    ---------------------------------------------------------------------------
    조합은 순서와 상관없이 같은 결과가 나와야 합니다.
    recipe.ingredients를 정렬해서 비교하므로 UI에서는 A+B, B+A 모두 허용됩니다.

    consume=true:
    - 조합 재료를 인벤토리에서 제거하고 결과 아이템을 추가합니다.

    consume=false:
    - 재료를 유지한 채 결과 아이템만 추가합니다.
      예: USB + PC처럼 실제 아이템끼리 합쳐지는 것이 아니라 특정 장소에서 정보를 여는 경우는
      향후 장소 이벤트에서 별도로 처리하는 것이 더 자연스럽습니다.
  */
  const COMBINATION_RECIPES = [
    {
      id: "temporary_access_card",
      ingredients: ["employee_badge", "clear_tape"],
      result: "temporary_access_card",
      consume: true,
      message: "사원증에 테이프를 붙여 임시 출입카드를 만들었다."
    },
    {
      id: "flashlight",
      ingredients: ["flashlight_body", "battery"],
      result: "flashlight",
      consume: true,
      message: "배터리를 끼우자 손전등이 켜졌다."
    },
    {
      id: "uv_flashlight",
      ingredients: ["flashlight", "uv_filter"],
      result: "uv_flashlight",
      consume: true,
      message: "손전등 앞에 UV 필터를 고정했다."
    },
    {
      id: "water_cup",
      ingredients: ["empty_cup", "water_source"],
      result: "water_cup",
      consume: false,
      message: "컵에 물을 받았다."
    },
    {
      id: "red_bean_sample_safe",
      ingredients: ["rubber_gloves", "red_bean_sample"],
      result: "red_bean_sample_safe",
      consume: false,
      message: "고무장갑 덕분에 붉은콩을 직접 만지지 않고 집었다."
    },
    {
      id: "power_bridge",
      ingredients: ["insulated_gloves", "wire_bundle"],
      result: "power_bridge",
      consume: true,
      message: "절연장갑을 끼고 전선을 임시 연결선으로 정리했다."
    },
    {
      id: "meeting_room_key",
      ingredients: ["meeting_key_half_a", "meeting_key_half_b"],
      result: "meeting_room_key",
      consume: true,
      message: "두 조각이 맞물리며 회의실 열쇠가 되었다."
    }
  ];

  class InventorySystem {
    constructor() {
      this.items = new Map();
    }

    add(itemId, count = 1) {
      const current = this.items.get(itemId) || 0;
      this.items.set(itemId, current + count);
    }

    remove(itemId, count = 1) {
      const current = this.items.get(itemId) || 0;
      const next = Math.max(0, current - count);
      if (next === 0) {
        this.items.delete(itemId);
      } else {
        this.items.set(itemId, next);
      }
    }

    has(itemId) {
      return this.items.has(itemId);
    }

    canCombine(itemA, itemB) {
      return Boolean(this.findRecipe(itemA, itemB));
    }

    combine(itemA, itemB) {
      const recipe = this.findRecipe(itemA, itemB);
      if (!recipe) {
        return {
          success: false,
          message: "아무 일도 일어나지 않았다."
        };
      }

      const inventoryIngredients = recipe.ingredients.filter((itemId) => ITEM_DATA[itemId]);
      const hasAllInventoryItems = inventoryIngredients.every((itemId) => this.has(itemId));
      if (!hasAllInventoryItems) {
        return {
          success: false,
          message: "조합에 필요한 아이템이 부족하다."
        };
      }

      if (recipe.consume) {
        inventoryIngredients.forEach((itemId) => this.remove(itemId, 1));
      }
      this.add(recipe.result, 1);

      return {
        success: true,
        recipe,
        item: this.getItemData(recipe.result),
        message: recipe.message
      };
    }

    findRecipe(itemA, itemB) {
      const target = normalizePair([itemA, itemB]);
      return COMBINATION_RECIPES.find((recipe) => normalizePair(recipe.ingredients).join("|") === target.join("|")) || null;
    }

    getItemData(itemId) {
      return ITEM_DATA[itemId] || {
        id: itemId,
        name: itemId,
        description: "",
        type: "unknown"
      };
    }

    serialize() {
      return Array.from(this.items.entries());
    }

    hydrate(entries) {
      this.items = new Map(entries || []);
    }

    list() {
      return Array.from(this.items.entries()).map(([id, count]) => ({
        ...this.getItemData(id),
        id,
        count
      }));
    }
  }

  function normalizePair(values) {
    return values.map((value) => String(value)).sort();
  }

  window.OSSE.InventorySystem = InventorySystem;
  window.OSSE.ITEM_DATA = ITEM_DATA;
  window.OSSE.COMBINATION_RECIPES = COMBINATION_RECIPES;
})();
