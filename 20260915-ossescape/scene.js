(function () {
  "use strict";

  window.OSSE = window.OSSE || {};

  /*
    Scene and event database
    ---------------------------------------------------------------------------
    紐⑤뱺 ?대깽?몃뒗 ???뚯씪?먯꽌 愿由ы빀?덈떎.

    媛?scene? RPG Maker??留듭쿂???앷컖?섎㈃ ?⑸땲??
    - id: ????곗씠?곗? ?대깽???대룞?먯꽌 ?ъ슜?섎뒗 怨좎쑀 ??    - name: HUD? 硫붾돱???쒖떆?섎뒗 ?대쫫
    - background: ?ν썑 ?ㅼ젣 ?대?吏濡?援먯껜??諛곌꼍 寃쎈줈
    - renderer: game.js媛 ?대뼡 ?꾩슜 諛곌꼍 ?뚮뜑?щ? ?ъ슜?좎? 寃곗젙?섎뒗 ??    - playerStart: ??留듭뿉 泥섏쓬 ?ㅼ뼱?붿쓣 ???뚮젅?댁뼱 ?쒖옉 ?꾩튂
    - walkBounds: ?뚮젅?댁뼱媛 嫄몄쓣 ???덈뒗 吏곸궗媛곹삎 ?곸뿭
    - events: E ?ㅻ줈 議곗궗 媛?ν븳 ?대깽??紐⑸줉

    TODO : Replace Image
    ?꾩옱 紐⑤뱺 ?대?吏 李몄“??assets/dummy.png留??ъ슜?⑸땲??
  */
  const PHOTO_ASSETS = {
    /*
      PHOTO_ASSETS
      -----------------------------------------------------------------------
      ?ㅼ젣 ?ъ쭊 諛곌꼍 寃쎈줈瑜???怨녹뿉??愿由ы빀?덈떎.

      ?좎?蹂댁닔 洹쒖튃:
      - dummy.png????젣?섏? ?딄퀬 fallback?쇰줈 怨꾩냽 蹂닿??⑸땲??
      - ?ъ쭊 ?뚯씪??援먯껜???뚮뒗 媛숈? ?뚯씪紐낆쑝濡???뼱?곌굅?? ???곸닔??寃쎈줈留?諛붽퓠?덈떎.
      - Scene ?곗씠???덉뿉?쒕뒗 吏곸젒 寃쎈줈 臾몄옄?댁쓣 諛섎났?섏? ?딄퀬 ???곸닔瑜?李몄“?⑸땲??
    */
    fallback: "assets/dummy.png",
    companyExterior: "assets/runtime/photos/01_company_exterior.jpg",
    mainEntrance: "assets/runtime/photos/02_main_entrance.jpg",
    guardRoomWide: "assets/runtime/photos/03_security_room_wide.jpg",
    guardRoomDesk: "assets/runtime/photos/04_security_room_desk.jpg",
    firstFloorCorridor: "assets/runtime/photos/05_first_floor_corridor.jpg",
    warehouseWide: "assets/runtime/photos/06_warehouse_wide.jpg",
    warehouseBoxes: "assets/runtime/photos/07_warehouse_boxes.jpg",
    warehouseLock: "assets/runtime/photos/08_warehouse_lock.jpg",
    warehouseOfficeWhiteboard: "assets/runtime/photos/09_warehouse_office_whiteboard.jpg",
    secondOfficeWide: "assets/runtime/photos/10_second_office_wide.jpg",
    firstFloorMeetingRoom: "assets/runtime/photos/11_first_floor_meeting_room.jpg",
    secondFloorDesign: "assets/runtime/photos/00_second_floor_design.jpg",
    ceoOfficeFront: "assets/runtime/photos/12_ceo_office_front.jpg",
    ceoOfficeWide: "assets/runtime/photos/12_ceo_office_wide.jpg"
  };

  const SCENE_DATA = {
    company_exterior: {
      id: "company_exterior",
      name: "회사 앞",
      background: PHOTO_ASSETS.companyExterior,
      renderer: "companyExterior",
      playerStart: { x: 640, y: 620 },
      walkBounds: { x: 96, y: 430, width: 1088, height: 230 },
      events: [
        {
          id: "escape_front_door",
          name: "회사 밖",
          x: 560,
          y: 540,
          width: 170,
          height: 80,
          kind: "door",
          requiresFlag: "escape_sequence_started",
          action: { type: "finish_escape" }
        },
        {
          id: "front_door",
          name: "정문",
          x: 58,
          y: 340,
          width: 320,
          height: 300,
          markerX: 220,
          markerY: 528,
          kind: "door",
          blockedByFlag: "escape_sequence_started",
          action: { type: "change_scene", sceneId: "main_entrance_zoom" }
        },
        {
          id: "guard_booth_door",
          name: "경비실",
          x: 910,
          y: 360,
          width: 300,
          height: 270,
          markerX: 1050,
          markerY: 515,
          kind: "door",
          action: { type: "dialog", dialogId: "guard_booth_question" }
        },
        {
          id: "warehouse_door",
          name: "창고문",
          x: 462,
          y: 396,
          width: 310,
          height: 220,
          markerX: 622,
          markerY: 530,
          kind: "door",
          requiresFlag: "warehouse_emergency_light_on",
          blockedByFlag: "escape_sequence_started",
          action: { type: "start_warehouse_door" }
        }
      ]
    },

    main_entrance_zoom: {
      id: "main_entrance_zoom",
      name: "정문 확대",
      background: PHOTO_ASSETS.mainEntrance,
      renderer: "photo",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "main_entrance_back",
          name: "뒤로",
          x: 42,
          y: 42,
          width: 120,
          height: 82,
          kind: "back",
          action: { type: "change_scene", sceneId: "company_exterior", player: { x: 620, y: 590 } }
        },
        {
          id: "main_entrance_shutter_zoom",
          name: "잠긴 정문",
          x: 294,
          y: 110,
          width: 690,
          height: 528,
          markerX: 638,
          markerY: 395,
          kind: "door",
          action: { type: "main_entrance_check" }
        },
        {
          id: "main_entrance_reader_zoom",
          name: "카드 리더기",
          x: 918,
          y: 242,
          width: 144,
          height: 220,
          markerX: 990,
          markerY: 350,
          kind: "inspect",
          action: { type: "main_entrance_check" }
        }
      ]
    },

    warehouse_01: {
      id: "warehouse_01",
      name: "1층 창고",
      background: PHOTO_ASSETS.warehouseWide,
      renderer: "warehouse",
      playerStart: { x: 170, y: 610 },
      walkBounds: { x: 90, y: 260, width: 1100, height: 380 },
      events: [
        {
          id: "warehouse_exit",
          name: "1층 사무실 문",
          x: 250,
          y: 236,
          width: 170,
          height: 260,
          markerX: 430,
          markerY: 360,
          kind: "door",
          action: { type: "start_code_puzzle", puzzleId: "warehouseLock" }
        },
        {
          id: "parcel_brand_01",
          name: "택배",
          x: 250,
          y: 520,
          width: 82,
          height: 62,
          disabledUntilPhoto: true,
          kind: "parcel",
          action: { type: "dialog", dialogId: "parcel_brand_osse" }
        },
        {
          id: "parcel_brand_02",
          name: "택배",
          x: 365,
          y: 488,
          width: 92,
          height: 70,
          disabledUntilPhoto: true,
          kind: "parcel",
          action: { type: "dialog", dialogId: "parcel_brand_suyamu" }
        },
        {
          id: "parcel_brand_03",
          name: "택배",
          x: 510,
          y: 536,
          width: 94,
          height: 64,
          disabledUntilPhoto: true,
          kind: "parcel",
          action: { type: "dialog", dialogId: "parcel_brand_laundry" }
        },
        {
          id: "openable_parcel",
          name: "밥솥",
          x: 790,
          y: 330,
          width: 360,
          height: 270,
          markerX: 1040,
          markerY: 472,
          kind: "parcel",
          action: { type: "dialog", dialogId: "warehouse_rice_cooker_box" }
        },
        {
          id: "warehouse_outside_exit",
          name: "밖으로 나가기",
          x: 1110,
          y: 360,
          width: 140,
          height: 210,
          markerX: 1180,
          markerY: 472,
          kind: "door",
          action: { type: "attempt_warehouse_exit" }
        },
        {
          id: "red_bean_focus",
          name: "붉은콩",
          x: 822,
          y: 520,
          width: 52,
          height: 44,
          disabledUntilPhoto: true,
          kind: "inspect",
          requiresFlag: "warehouse_red_bean_visible",
          action: { type: "inspect_warehouse_red_bean" }
        },
        {
          id: "warehouse_note_01",
          name: "찢어진 메모",
          x: 330,
          y: 338,
          width: 72,
          height: 46,
          disabledUntilPhoto: true,
          kind: "note",
          action: { type: "dialog", dialogId: "warehouse_note_culture" }
        },
        {
          id: "warehouse_note_02",
          name: "찢어진 메모",
          x: 610,
          y: 318,
          width: 72,
          height: 46,
          disabledUntilPhoto: true,
          kind: "note",
          action: { type: "dialog", dialogId: "warehouse_note_growth" }
        },
        {
          id: "warehouse_note_03",
          name: "찢어진 메모",
          x: 940,
          y: 410,
          width: 72,
          height: 46,
          disabledUntilPhoto: true,
          kind: "note",
          action: { type: "dialog", dialogId: "warehouse_note_test" }
        },
        {
          id: "warehouse_pallet",
          name: "팔레트",
          x: 760,
          y: 520,
          width: 280,
          height: 112,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_pallet" }
        },
        {
          id: "warehouse_forklift",
          name: "지게차",
          x: 358,
          y: 330,
          width: 210,
          height: 160,
          markerX: 470,
          markerY: 405,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_forklift" }
        },
        {
          id: "warehouse_wrap",
          name: "파레트 랩",
          x: 630,
          y: 240,
          width: 210,
          height: 270,
          markerX: 730,
          markerY: 365,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_wrap" }
        },
        {
          id: "warehouse_paper_boxes",
          name: "종이박스",
          x: 900,
          y: 278,
          width: 300,
          height: 230,
          markerX: 1040,
          markerY: 390,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_paper_boxes" }
        },
        {
          id: "warehouse_sacks",
          name: "대형 포대",
          x: 1030,
          y: 488,
          width: 104,
          height: 86,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_sacks" }
        },
        {
          id: "warehouse_shelf",
          name: "철제 선반",
          x: 620,
          y: 230,
          width: 500,
          height: 240,
          markerX: 830,
          markerY: 340,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_shelf" }
        },
        {
          id: "warehouse_iron_door",
          name: "커다란 철문",
          x: 250,
          y: 236,
          width: 190,
          height: 238,
          markerX: 350,
          markerY: 365,
          disabledUntilPhoto: true,
          kind: "door",
          action: { type: "dialog", dialogId: "warehouse_iron_door" }
        },
        {
          id: "warehouse_keypad",
          name: "창고 안쪽",
          x: 430,
          y: 240,
          width: 250,
          height: 250,
          markerX: 560,
          markerY: 330,
          kind: "inspect",
          action: { type: "change_scene", sceneId: "warehouse_boxes_zoom" }
        },
        {
          id: "warehouse_wall_notice",
          name: "안내문",
          x: 12,
          y: 232,
          width: 122,
          height: 170,
          markerX: 66,
          markerY: 316,
          kind: "note",
          action: { type: "dialog", dialogId: "warehouse_wall_notice", flag: "warehouse_wall_notice_read" }
        },
        {
          id: "warehouse_red_panel",
          name: "붉은 패널",
          x: 290,
          y: 330,
          width: 42,
          height: 80,
          markerX: 312,
          markerY: 382,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_red_panel" }
        },
        {
          id: "warehouse_floor_crack",
          name: "바닥 금",
          x: 420,
          y: 516,
          width: 210,
          height: 70,
          markerX: 520,
          markerY: 552,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_floor_crack" }
        },
        {
          id: "warehouse_torn_paper",
          name: "찢어진 종이",
          x: 700,
          y: 555,
          width: 150,
          height: 80,
          markerX: 770,
          markerY: 598,
          kind: "note",
          action: { type: "dialog", dialogId: "warehouse_torn_paper_backstory", flag: "warehouse_torn_paper_read" }
        },
        {
          id: "warehouse_ceiling_lamp",
          name: "형광등",
          x: 662,
          y: 112,
          width: 124,
          height: 86,
          markerX: 724,
          markerY: 156,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_ceiling_lamp" }
        },
        {
          id: "office_desk",
          name: "책상",
          x: 760,
          y: 232,
          width: 120,
          height: 62,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_office_desk", flag: "warehouse_office_desk_read" }
        },
        {
          id: "office_computer",
          name: "컴퓨터",
          x: 790,
          y: 188,
          width: 72,
          height: 58,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_office_computer" }
        },
        {
          id: "office_cabinet",
          name: "캐비닛",
          x: 910,
          y: 196,
          width: 78,
          height: 118,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_cabinet" }
        },
        {
          id: "warehouse_equipment_area",
          name: "창고 안쪽",
          x: 230,
          y: 450,
          width: 120,
          height: 120,
          markerX: 290,
          markerY: 510,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "change_scene", sceneId: "warehouse_boxes_zoom" }
        },
        {
          id: "office_whiteboard",
          name: "화이트보드",
          x: 48,
          y: 270,
          width: 150,
          height: 260,
          markerX: 660,
          markerY: 250,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "change_scene", sceneId: "warehouse_office_zoom" }
        }
      ]
    },

    warehouse_equipment_zoom: {
      id: "warehouse_equipment_zoom",
      name: "창고 안쪽",
      background: PHOTO_ASSETS.warehouseBoxes,
      renderer: "photo",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "warehouse_equipment_back",
          name: "뒤로",
          x: 42,
          y: 42,
          width: 120,
          height: 82,
          kind: "back",
          action: { type: "change_scene", sceneId: "warehouse_01", player: { x: 520, y: 540 } }
        },
        {
          id: "warehouse_inner_office_area_from_equipment",
          name: "창고 사무공간",
          x: 270,
          y: 210,
          width: 150,
          height: 160,
          markerX: 340,
          markerY: 300,
          kind: "inspect",
          action: { type: "change_scene", sceneId: "warehouse_office_zoom" }
        },
        {
          id: "warehouse_forklift_zoom",
          name: "지게차",
          x: 410,
          y: 280,
          width: 220,
          height: 330,
          markerX: 520,
          markerY: 430,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_forklift" }
        },
        {
          id: "warehouse_pallet_zoom",
          name: "바닥 팔레트",
          x: 780,
          y: 548,
          width: 190,
          height: 110,
          markerX: 870,
          markerY: 610,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_pallet" }
        },
        {
          id: "warehouse_wrap_zoom",
          name: "파레트 랩",
          x: 700,
          y: 172,
          width: 130,
          height: 180,
          markerX: 760,
          markerY: 255,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_wrap" }
        },
        {
          id: "warehouse_paper_boxes_zoom",
          name: "종이박스",
          x: 1000,
          y: 300,
          width: 220,
          height: 170,
          markerX: 1090,
          markerY: 390,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_paper_boxes" }
        },
        {
          id: "warehouse_sacks_zoom",
          name: "완충재",
          x: 910,
          y: 460,
          width: 230,
          height: 130,
          markerX: 1015,
          markerY: 530,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_sacks" }
        },
        {
          id: "warehouse_shelf_zoom",
          name: "철제 선반",
          x: 610,
          y: 225,
          width: 220,
          height: 220,
          markerX: 715,
          markerY: 360,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_shelf" }
        },
        {
          id: "warehouse_locked_inner_door_from_equipment",
          name: "창고 입구쪽",
          x: 1160,
          y: 230,
          width: 100,
          height: 240,
          markerX: 1210,
          markerY: 330,
          kind: "door",
          action: { type: "change_scene", sceneId: "warehouse_01", player: { x: 560, y: 540 } }
        }
      ]
    },

    warehouse_boxes_zoom: {
      id: "warehouse_boxes_zoom",
      name: "택배 더미",
      background: PHOTO_ASSETS.warehouseBoxes,
      renderer: "photo",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "warehouse_boxes_back",
          name: "창고 입구쪽",
          x: 42,
          y: 42,
          width: 120,
          height: 82,
          markerX: 1210,
          markerY: 642,
          kind: "back",
          action: { type: "change_scene", sceneId: "warehouse_01", player: { x: 720, y: 540 } }
        },
        {
          id: "warehouse_inner_office_area_from_boxes",
          name: "창고 사무공간",
          x: 250,
          y: 210,
          width: 180,
          height: 160,
          markerX: 332,
          markerY: 318,
          kind: "inspect",
          action: { type: "change_scene", sceneId: "warehouse_office_zoom" }
        },
        {
          id: "warehouse_forklift_boxes",
          name: "지게차",
          x: 360,
          y: 215,
          width: 250,
          height: 395,
          markerX: 495,
          markerY: 430,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_forklift" }
        },
        {
          id: "warehouse_right_boxes_stack",
          name: "박스 더미",
          x: 930,
          y: 330,
          width: 260,
          height: 220,
          markerX: 930,
          markerY: 404,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_paper_boxes" }
        },
        {
          id: "parcel_brand_01_zoom",
          name: "OSSE 라벨",
          x: 952,
          y: 380,
          width: 250,
          height: 210,
          markerX: 1135,
          markerY: 505,
          kind: "parcel",
          action: { type: "dialog", dialogId: "parcel_brand_osse" }
        },
        {
          id: "parcel_brand_02_zoom",
          name: "수야무 라벨",
          x: 1020,
          y: 285,
          width: 210,
          height: 120,
          markerX: 1160,
          markerY: 326,
          kind: "parcel",
          action: { type: "dialog", dialogId: "parcel_brand_suyamu" }
        },
        {
          id: "openable_parcel_zoom",
          name: "열 수 있는 택배",
          x: 18,
          y: 382,
          width: 310,
          height: 246,
          markerX: 170,
          markerY: 500,
          kind: "parcel",
          action: { type: "open_warehouse_parcel" }
        },
        {
          id: "red_bean_focus_zoom",
          name: "붉은콩",
          x: 548,
          y: 496,
          width: 130,
          height: 96,
          markerX: 612,
          markerY: 542,
          kind: "inspect",
          requiresFlag: "warehouse_red_bean_visible",
          action: { type: "inspect_warehouse_red_bean" }
        }
      ]
    },

    warehouse_lock_zoom: {
      id: "warehouse_lock_zoom",
      name: "창고 안쪽 잠금구역",
      background: PHOTO_ASSETS.warehouseWide,
      renderer: "photo",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "warehouse_lock_back",
          name: "뒤로",
          x: 42,
          y: 42,
          width: 120,
          height: 82,
          kind: "back",
          action: { type: "change_scene", sceneId: "warehouse_boxes_zoom", player: { x: 640, y: 610 } }
        },
        {
          id: "warehouse_inner_office_area",
          name: "창고 사무공간",
          x: 40,
          y: 230,
          width: 260,
          height: 260,
          markerX: 160,
          markerY: 340,
          kind: "inspect",
          action: { type: "change_scene", sceneId: "warehouse_office_zoom" }
        },
        {
          id: "warehouse_iron_door_zoom",
          name: "잠긴 안쪽 문",
          x: 210,
          y: 180,
          width: 300,
          height: 340,
          markerX: 350,
          markerY: 365,
          kind: "door",
          action: { type: "dialog", dialogId: "warehouse_iron_door" }
        },
        {
          id: "warehouse_keypad_zoom",
          name: "4자리 자물쇠",
          x: 430,
          y: 240,
          width: 250,
          height: 250,
          markerX: 530,
          markerY: 350,
          kind: "inspect",
          action: { type: "start_code_puzzle", puzzleId: "warehouseLock" }
        }
      ]
    },

    boxkeeper_boss: {
      id: "boxkeeper_boss",
      name: "창고 / 박스키퍼",
      background: PHOTO_ASSETS.warehouseBoxes,
      renderer: "boxkeeperBoss",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "boxkeeper_intro",
          name: "박스키퍼",
          x: 470,
          y: 108,
          width: 340,
          height: 500,
          markerX: 640,
          markerY: 330,
          kind: "inspect",
          onceFlag: "boxkeeper_phase_inventory",
          action: { type: "dialog", dialogId: "boxkeeper_intro" }
        },
        {
          id: "boxkeeper_inventory_check",
          name: "입고 검수",
          x: 820,
          y: 180,
          width: 150,
          height: 110,
          markerX: 895,
          markerY: 236,
          kind: "inspect",
          requiresFlag: "boxkeeper_phase_inventory",
          onceFlag: "boxkeeper_phase_packing",
          action: { type: "boxkeeper_work", phase: "packing" }
        },
        {
          id: "boxkeeper_packing_work",
          name: "포장 작업",
          x: 900,
          y: 332,
          width: 150,
          height: 110,
          markerX: 975,
          markerY: 386,
          kind: "inspect",
          requiresFlag: "boxkeeper_phase_packing",
          onceFlag: "boxkeeper_phase_delivery",
          action: { type: "boxkeeper_work", phase: "delivery" }
        },
        {
          id: "boxkeeper_delivery_error",
          name: "배송 오류",
          x: 810,
          y: 488,
          width: 150,
          height: 110,
          markerX: 885,
          markerY: 542,
          kind: "inspect",
          requiresFlag: "boxkeeper_phase_delivery",
          onceFlag: "boxkeeper_cleared",
          action: { type: "boxkeeper_work", phase: "clear" }
        },
        {
          id: "boxkeeper_exit",
          name: "1층 사무실 문",
          x: 1100,
          y: 498,
          width: 130,
          height: 120,
          markerX: 1165,
          markerY: 558,
          kind: "door",
          requiresFlag: "boxkeeper_cleared",
          action: { type: "change_scene", sceneId: "office_01", player: { x: 640, y: 610 } }
        }
      ]
    },

    warehouse_office_zoom: {
      id: "warehouse_office_zoom",
      name: "창고 사무공간",
      background: PHOTO_ASSETS.warehouseOfficeWhiteboard,
      renderer: "photo",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "warehouse_office_back",
          name: "뒤로",
          x: 42,
          y: 42,
          width: 120,
          height: 82,
          kind: "back",
          action: { type: "change_scene", sceneId: "warehouse_boxes_zoom", player: { x: 640, y: 610 } }
        },
        {
          id: "warehouse_office_computer_zoom",
          name: "컴퓨터",
          x: 360,
          y: 390,
          width: 230,
          height: 170,
          markerX: 470,
          markerY: 480,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_office_computer", flag: "warehouse_office_computer_read" }
        },
        {
          id: "warehouse_whiteboard_zoom",
          name: "화이트보드",
          x: 470,
          y: 170,
          width: 350,
          height: 230,
          markerX: 640,
          markerY: 285,
          kind: "inspect",
          action: { type: "dialog", dialogId: "warehouse_whiteboard", flag: "warehouse_whiteboard_read" }
        },
        {
          id: "warehouse_note_zoom",
          name: "찢어진 메모",
          x: 700,
          y: 540,
          width: 360,
          height: 122,
          markerX: 884,
          markerY: 602,
          kind: "note",
          action: { type: "dialog", dialogId: "warehouse_note_growth", flag: "warehouse_office_desk_read" }
        }
      ]
    },

    office_corridor_01: {
      id: "office_corridor_01",
      name: "1층 사무실 앞",
      background: PHOTO_ASSETS.firstFloorCorridor,
      renderer: "officeCorridor",
      playerStart: { x: 180, y: 590 },
      walkBounds: { x: 110, y: 330, width: 1050, height: 300 },
      events: [
        {
          id: "office_corridor_back",
          name: "창고 철문",
          x: 96,
          y: 450,
          width: 86,
          height: 146,
          kind: "door",
          action: { type: "change_scene", sceneId: "warehouse_01", player: { x: 1080, y: 540 } }
        },
        {
          id: "office_door_card_reader",
          name: "사무실 카드 리더기",
          x: 944,
          y: 430,
          width: 64,
          height: 74,
          markerX: 928,
          markerY: 466,
          kind: "inspect",
          action: { type: "office_card_reader" }
        },
        {
          id: "office_door_keypad",
          name: "사무실 키패드",
          x: 1016,
          y: 430,
          width: 58,
          height: 72,
          markerX: 1080,
          markerY: 466,
          kind: "inspect",
          requiresFlag: "office_keypad_enabled",
          action: { type: "start_code_puzzle", puzzleId: "officeDoor" }
        }
      ]
    },

    office_01: {
      id: "office_01",
      name: "1층 사무실",
      background: PHOTO_ASSETS.firstFloorCorridor,
      renderer: "office",
      playerStart: { x: 180, y: 610 },
      walkBounds: { x: 100, y: 240, width: 1080, height: 400 },
      events: [
        {
          id: "executive_office_door",
          name: "사무실 안쪽",
          x: 54,
          y: 292,
          width: 180,
          height: 210,
          markerX: 118,
          markerY: 392,
          kind: "door",
          action: { type: "change_scene", sceneId: "office_inner_01", player: { x: 640, y: 620 } }
        },
        {
          id: "second_floor_shutter",
          name: "2층으로 올라가기",
          x: 1040,
          y: 455,
          width: 190,
          height: 160,
          markerX: 1140,
          markerY: 552,
          kind: "door",
          requiresFlag: "got_second_floor_auth_card",
          action: { type: "start_second_floor_shutter" }
        },
        {
          id: "office_red_beans",
          name: "붉은콩",
          x: 470,
          y: 566,
          width: 120,
          height: 64,
          markerX: 530,
          markerY: 594,
          kind: "inspect",
          onceFlag: "office_beans_resolved",
          action: { type: "dialog", dialogId: "office_beans_choice" }
        },
        {
          id: "office_desk",
          name: "책상",
          x: 500,
          y: 360,
          width: 190,
          height: 130,
          markerX: 612,
          markerY: 425,
          kind: "inspect",
          action: { type: "dialog", dialogId: "office_desk" }
        },
        {
          id: "office_monitor",
          name: "모니터",
          x: 690,
          y: 330,
          width: 110,
          height: 80,
          markerX: 742,
          markerY: 372,
          kind: "inspect",
          action: { type: "dialog", dialogId: "office_monitor", flag: "office_monitor_checked" }
        },
        {
          id: "office_printer",
          name: "프린터",
          x: 804,
          y: 344,
          width: 130,
          height: 90,
          markerX: 872,
          markerY: 390,
          kind: "inspect",
          action: { type: "dialog", dialogId: "office_printer", flag: "office_printer_checked" }
        },
        {
          id: "office_cabinet",
          name: "캐비닛",
          x: 318,
          y: 292,
          width: 170,
          height: 230,
          markerX: 405,
          markerY: 405,
          kind: "inspect",
          action: { type: "dialog", dialogId: "office_cabinet" }
        },
        {
          id: "office_whiteboard",
          name: "화이트보드",
          x: 736,
          y: 260,
          width: 150,
          height: 90,
          markerX: 810,
          markerY: 304,
          kind: "inspect",
          action: { type: "dialog", dialogId: "office_whiteboard" }
        },
        {
          id: "office_copier",
          name: "복사기",
          x: 934,
          y: 410,
          width: 150,
          height: 110,
          markerX: 1005,
          markerY: 462,
          kind: "inspect",
          action: { type: "dialog", dialogId: "office_copier" }
        },
        {
          id: "office_pantry",
          name: "탕비실",
          x: 390,
          y: 430,
          width: 120,
          height: 150,
          markerX: 450,
          markerY: 500,
          kind: "door",
          action: { type: "dialog", dialogId: "office_pantry" }
        },
        {
          id: "office_meeting_room_locked",
          name: "회의실",
          x: 86,
          y: 278,
          width: 150,
          height: 180,
          markerX: 246,
          markerY: 326,
          kind: "door",
          blockedByFlag: "office_beans_resolved",
          action: { type: "meeting_room_knock" }
        },
        {
          id: "office_meeting_room_open",
          name: "회의실",
          x: 86,
          y: 278,
          width: 150,
          height: 180,
          markerX: 246,
          markerY: 326,
          kind: "door",
          requiresFlag: "office_beans_resolved",
          action: { type: "change_scene", sceneId: "meeting_room_01", player: { x: 640, y: 620 } }
        }
      ]
    },

    meeting_room_01: {
      id: "meeting_room_01",
      name: "1층 회의실",
      background: PHOTO_ASSETS.firstFloorMeetingRoom,
      renderer: "meetingRoom",
      playerStart: { x: 640, y: 620 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "meeting_room_back",
          name: "1층 사무실",
          x: 44,
          y: 44,
          width: 132,
          height: 86,
          kind: "back",
          action: { type: "change_scene", sceneId: "office_01", player: { x: 180, y: 610 } }
        },
        {
          id: "meeting_room_table",
          name: "회의 테이블",
          x: 468,
          y: 430,
          width: 190,
          height: 104,
          markerX: 560,
          markerY: 478,
          kind: "inspect",
          blockedWhileFlag: "simkong_boss_started",
          unblockedByFlag: "simkong_defeated",
          action: { type: "dialog", dialogId: "meeting_room_table", flag: "meeting_room_table_read" }
        },
        {
          id: "meeting_room_whiteboard",
          name: "화이트보드",
          x: 820,
          y: 210,
          width: 176,
          height: 126,
          markerX: 910,
          markerY: 272,
          kind: "inspect",
          blockedWhileFlag: "simkong_boss_started",
          unblockedByFlag: "simkong_defeated",
          action: { type: "dialog", dialogId: "meeting_room_whiteboard" }
        },
        {
          id: "meeting_room_frame",
          name: "액자",
          x: 566,
          y: 180,
          width: 118,
          height: 88,
          markerX: 625,
          markerY: 224,
          kind: "inspect",
          blockedWhileFlag: "simkong_boss_started",
          unblockedByFlag: "simkong_defeated",
          action: { type: "dialog", dialogId: "meeting_room_frame" }
        },
        {
          id: "meeting_room_simdaeri",
          name: "심대리",
          x: 600,
          y: 250,
          width: 118,
          height: 150,
          markerX: 660,
          markerY: 330,
          kind: "inspect",
          onceFlag: "simkong_boss_started",
          blockedByFlag: "simkong_defeated",
          action: { type: "start_simkong_boss" }
        },
        {
          id: "meeting_room_drawer",
          name: "회의실 서랍",
          x: 592,
          y: 494,
          width: 132,
          height: 70,
          markerX: 658,
          markerY: 530,
          kind: "item",
          requiresFlag: "simdaeri_fled_to_second_floor",
          onceFlag: "got_second_floor_auth_card",
          action: { type: "collect_second_floor_card" }
        }
      ]
    },

    office_inner_01: {
      id: "office_inner_01",
      name: "1층 사무실 안쪽",
      background: PHOTO_ASSETS.firstFloorCorridor,
      renderer: "photo",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "office_inner_back",
          name: "뒤로",
          x: 42,
          y: 42,
          width: 120,
          height: 82,
          kind: "back",
          action: { type: "change_scene", sceneId: "office_01", player: { x: 150, y: 575 } }
        },
        {
          id: "office_inner_sound_door",
          name: "소리가 나는 문",
          x: 72,
          y: 260,
          width: 190,
          height: 230,
          markerX: 164,
          markerY: 368,
          kind: "door",
          action: { type: "office_inner_sound" }
        }
      ]
    },

    second_floor_corridor: {
      id: "second_floor_corridor",
      name: "2층 복도",
      background: PHOTO_ASSETS.secondOfficeWide,
      renderer: "secondFloorCorridor",
      playerStart: { x: 140, y: 590 },
      walkBounds: { x: 90, y: 300, width: 1100, height: 330 },
      events: [
        {
          id: "second_floor_window",
          name: "유리창",
          x: 1000,
          y: 210,
          width: 250,
          height: 210,
          markerX: 1120,
          markerY: 312,
          kind: "inspect",
          action: { type: "dialog", dialogId: "second_floor_window" }
        },
        {
          id: "water_dispenser",
          name: "정수기",
          x: 684,
          y: 392,
          width: 92,
          height: 170,
          markerX: 728,
          markerY: 474,
          kind: "inspect",
          action: { type: "dialog", dialogId: "second_floor_dispenser" }
        },
        {
          id: "meeting_room_201",
          name: "회의실",
          x: 292,
          y: 268,
          width: 190,
          height: 210,
          markerX: 392,
          markerY: 370,
          kind: "door",
          action: { type: "dialog", dialogId: "second_floor_meeting_room" }
        },
        {
          id: "design_studio_door",
          name: "디자인부서 중앙",
          x: 500,
          y: 210,
          width: 300,
          height: 330,
          markerX: 650,
          markerY: 382,
          kind: "door",
          action: { type: "change_scene", sceneId: "design_studio", player: { x: 160, y: 600 } }
        },
        {
          id: "ceo_office_visible",
          name: "대표실",
          x: 850,
          y: 286,
          width: 180,
          height: 230,
          markerX: 940,
          markerY: 400,
          kind: "door",
          requiresFlag: "got_crowbar",
          action: { type: "change_scene", sceneId: "ceo_door_front", player: { x: 610, y: 600 } }
        }
      ]
    },

    design_studio: {
      id: "design_studio",
      name: "디자인 스튜디오",
      background: PHOTO_ASSETS.secondFloorDesign,
      renderer: "designStudio",
      playerStart: { x: 160, y: 600 },
      walkBounds: { x: 90, y: 230, width: 1100, height: 410 },
      events: [
        {
          id: "design_exit",
          name: "2층 입구로 돌아가기",
          x: 42,
          y: 42,
          width: 132,
          height: 86,
          markerX: 106,
          markerY: 84,
          kind: "back",
          action: { type: "change_scene", sceneId: "second_floor_corridor", player: { x: 650, y: 580 } }
        },
        {
          id: "design_computer",
          name: "컴퓨터",
          x: 380,
          y: 330,
          width: 92,
          height: 72,
          kind: "inspect",
          action: { type: "inspect_design_computer" }
        },
        {
          id: "design_locker",
          name: "락커",
          x: 970,
          y: 282,
          width: 96,
          height: 172,
          kind: "inspect",
          action: { type: "dialog", dialogId: "design_locker_locked" }
        },
        {
          id: "crowbar_pickup",
          name: "빠루",
          x: 574,
          y: 500,
          width: 180,
          height: 96,
          markerX: 670,
          markerY: 540,
          kind: "item",
          onceFlag: "got_crowbar",
          action: { type: "pickup_crowbar" }
        },
        {
          id: "design_tablet",
          name: "태블릿",
          x: 546,
          y: 430,
          width: 86,
          height: 50,
          kind: "inspect",
          action: { type: "dialog", dialogId: "design_tablet", flag: "design_tablet_read" }
        },
        {
          id: "design_samples",
          name: "샘플",
          x: 720,
          y: 484,
          width: 130,
          height: 68,
          kind: "inspect",
          action: { type: "dialog", dialogId: "design_samples" }
        }
      ]
    },

    ceo_door_front: {
      id: "ceo_door_front",
      name: "대표실 앞",
      background: PHOTO_ASSETS.ceoOfficeFront,
      renderer: "ceoDoorFront",
      playerStart: { x: 610, y: 600 },
      walkBounds: { x: 130, y: 330, width: 1020, height: 300 },
      events: [
        {
          id: "ceo_blocked_door",
          name: "대표실",
          x: 570,
          y: 260,
          width: 150,
          height: 250,
          markerX: 646,
          markerY: 318,
          kind: "door",
          action: { type: "enter_ceo_office" }
        },
        {
          id: "ceo_crowbar_target",
          name: "나무상자",
          x: 548,
          y: 380,
          width: 198,
          height: 94,
          markerX: 645,
          markerY: 458,
          kind: "inspect",
          requiresFlag: "got_crowbar",
          blockedByFlag: "ceo_door_event_done",
          action: { type: "start_crowbar_event" }
        }
      ]
    },

    ceo_office: {
      id: "ceo_office",
      name: "대표실",
      background: PHOTO_ASSETS.ceoOfficeWide,
      renderer: "ceoOffice",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 120, y: 250, width: 1040, height: 380 },
      events: [
        {
          id: "ceo_office_back",
          name: "대표실 문",
          x: 42,
          y: 42,
          width: 132,
          height: 86,
          kind: "back",
          action: { type: "change_scene", sceneId: "ceo_door_front", player: { x: 640, y: 610 } }
        },
        {
          id: "final_report",
          name: "PROJECT S 최종 보고서",
          x: 592,
          y: 392,
          width: 110,
          height: 54,
          markerX: 560,
          markerY: 382,
          kind: "inspect",
          requiresFlag: "final_boss_defeated",
          onceFlag: "final_report_read",
          action: { type: "read_final_report" }
        },
        {
          id: "ceo_computer",
          name: "대표 컴퓨터",
          x: 570,
          y: 304,
          width: 132,
          height: 86,
          markerX: 640,
          markerY: 312,
          kind: "inspect",
          blockedByFlag: "final_boss_defeated",
          action: { type: "inspect_ceo_computer" }
        },
        {
          id: "ceo_usb_drive",
          name: "USB",
          x: 618,
          y: 396,
          width: 82,
          height: 58,
          markerX: 662,
          markerY: 424,
          kind: "item",
          onceFlag: "got_usb_drive",
          action: { type: "pickup_ceo_usb" }
        },
        {
          id: "ceo_desk",
          name: "대표 책상",
          x: 498,
          y: 388,
          width: 286,
          height: 112,
          markerX: 480,
          markerY: 468,
          kind: "inspect",
          action: { type: "dialog", dialogId: "ceo_desk" }
        },
        {
          id: "ceo_meeting_table",
          name: "회의 테이블",
          x: 260,
          y: 486,
          width: 210,
          height: 92,
          kind: "inspect",
          action: { type: "dialog", dialogId: "ceo_meeting_table" }
        },
        {
          id: "ceo_document_cabinet",
          name: "서류장",
          x: 870,
          y: 280,
          width: 96,
          height: 174,
          kind: "inspect",
          action: { type: "dialog", dialogId: "ceo_document_cabinet" }
        },
        {
          id: "ceo_safe",
          name: "금고",
          x: 990,
          y: 392,
          width: 98,
          height: 102,
          kind: "inspect",
          action: { type: "dialog", dialogId: "ceo_safe" }
        },
        {
          id: "ceo_frame",
          name: "액자",
          x: 330,
          y: 190,
          width: 100,
          height: 72,
          kind: "inspect",
          action: { type: "dialog", dialogId: "ceo_frame" }
        },
        {
          id: "red_simkong_core",
          name: "붉은 씨앗",
          x: 626,
          y: 382,
          width: 56,
          height: 48,
          markerX: 718,
          markerY: 438,
          kind: "inspect",
          requiresFlag: "project_s_read",
          onceFlag: "final_quiz_started",
          action: { type: "start_final_boss_intro" }
        }
      ]
    },

    executive_office: {
      id: "executive_office",
      name: "상무실",
      background: PHOTO_ASSETS.ceoOfficeWide,
      renderer: "executiveOffice",
      playerStart: { x: 640, y: 620 },
      walkBounds: { x: 130, y: 250, width: 1020, height: 390 },
      events: [
        {
          id: "simkong_seed",
          name: "작은 콩",
          x: 624,
          y: 372,
          width: 46,
          height: 38,
          kind: "inspect",
          onceFlag: "simkong_boss_started",
          action: { type: "start_simkong_boss" }
        },
        {
          id: "executive_drawer",
          name: "책상 서랍",
          x: 575,
          y: 394,
          width: 152,
          height: 64,
          kind: "item",
          requiresFlag: "simdaeri_fled_to_second_floor",
          onceFlag: "got_second_floor_auth_card",
          action: { type: "collect_second_floor_card" }
        },
        {
          id: "executive_exit",
          name: "상무실 문",
          x: 92,
          y: 472,
          width: 88,
          height: 154,
          kind: "door",
          requiresFlag: "simkong_defeated",
          action: { type: "change_scene", sceneId: "office_01", player: { x: 150, y: 575 } }
        },
        {
          id: "executive_exit_quiz_waiting",
          name: "나가기",
          x: 92,
          y: 472,
          width: 88,
          height: 154,
          kind: "back",
          requiresFlag: "simkong_quiz_waiting",
          blockedByFlag: "simkong_defeated",
          action: { type: "change_scene", sceneId: "office_inner_01", player: { x: 640, y: 620 } }
        }
      ]
    },

    guard_room: {
      id: "guard_room",
      name: "경비실",
      background: PHOTO_ASSETS.guardRoomWide,
      renderer: "guardRoom",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 150, y: 330, width: 980, height: 300 },
      events: [
        {
          id: "guard_room_exit",
          name: "경비실 문",
          x: 995,
          y: 350,
          width: 88,
          height: 188,
          kind: "door",
          action: { type: "change_scene", sceneId: "company_exterior", player: { x: 210, y: 565 } }
        },
        {
          id: "guard_chair",
          name: "의자",
          x: 760,
          y: 250,
          width: 350,
          height: 260,
          markerX: 940,
          markerY: 440,
          kind: "inspect",
          action: { type: "inspect_chair" }
        },
        {
          id: "guard_desk",
          name: "책상",
          x: 80,
          y: 300,
          width: 650,
          height: 260,
          markerX: 360,
          markerY: 465,
          kind: "inspect",
          action: { type: "change_scene", sceneId: "guard_room_desk_zoom" }
        },
        {
          id: "guard_computer",
          name: "컴퓨터",
          x: 925,
          y: 160,
          width: 190,
          height: 150,
          markerX: 1025,
          markerY: 235,
          kind: "inspect",
          action: { type: "computer_glitch" }
        },
        {
          id: "guard_cctv",
          name: "CCTV",
          x: 650,
          y: 298,
          width: 180,
          height: 120,
          kind: "inspect",
          action: { type: "cctv_glitch" }
        },
        {
          id: "security_access_card",
          name: "출입카드",
          x: 120,
          y: 500,
          width: 220,
          height: 120,
          markerX: 220,
          markerY: 560,
          disabledUntilPhoto: true,
          kind: "item",
          onceFlag: "got_security_access_card",
          action: { type: "pickup_security_card" }
        },
        {
          id: "guard_clock",
          name: "벽시계",
          x: 1060,
          y: 70,
          width: 120,
          height: 100,
          markerX: 1120,
          markerY: 120,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "guard_clock" }
        },
        {
          id: "fluorescent_light",
          name: "형광등",
          x: 430,
          y: 0,
          width: 430,
          height: 90,
          markerX: 640,
          markerY: 46,
          kind: "inspect",
          action: { type: "dialog", dialogId: "fluorescent_light" }
        },
        {
          id: "trash_can",
          name: "쓰레기통",
          x: 1030,
          y: 470,
          width: 140,
          height: 150,
          markerX: 1100,
          markerY: 545,
          disabledUntilPhoto: true,
          kind: "inspect",
          action: { type: "dialog", dialogId: "trash_can" }
        },
        {
          id: "red_puddle",
          name: "바닥",
          x: 690,
          y: 470,
          width: 390,
          height: 180,
          markerX: 900,
          markerY: 560,
          kind: "inspect",
          action: { type: "dialog", dialogId: "red_puddle" }
        }
      ]
    },

    /*
      湲곗〈 ?꾨줈?좏????뚯뒪???ъ엯?덈떎.
      ?대쾲 ?꾨·濡쒓렇?먯꽌???묎렐?섏? ?딆?留? ????꾩씠???댁쫰/?꾪닾/誘몃땲寃뚯엫
      ?쒖뒪?쒖쓣 ?섏쨷???ㅼ떆 寃利앺븷 ???덈룄濡???젣?섏? ?딆뒿?덈떎.
    */
    guard_room_desk_zoom: {
      id: "guard_room_desk_zoom",
      name: "경비실 책상",
      background: PHOTO_ASSETS.guardRoomDesk,
      renderer: "photo",
      playerStart: { x: 640, y: 610 },
      walkBounds: { x: 0, y: 0, width: 1280, height: 720 },
      events: [
        {
          id: "guard_desk_back",
          name: "뒤로",
          x: 42,
          y: 42,
          width: 120,
          height: 82,
          kind: "back",
          action: { type: "change_scene", sceneId: "guard_room", player: { x: 500, y: 520 } }
        },
        {
          id: "security_access_card_zoom",
          name: "경비 출입카드",
          x: 12,
          y: 552,
          width: 180,
          height: 130,
          markerX: 92,
          markerY: 616,
          kind: "item",
          onceFlag: "got_security_access_card",
          action: { type: "pickup_security_card" }
        },
        {
          id: "guard_desk_papers_zoom",
          name: "책상 위 종이",
          x: 70,
          y: 110,
          width: 390,
          height: 520,
          markerX: 250,
          markerY: 420,
          kind: "inspect",
          action: { type: "dialog", dialogId: "guard_desk" }
        },
        {
          id: "guard_radio_zoom",
          name: "무전기",
          x: 708,
          y: 170,
          width: 200,
          height: 160,
          markerX: 810,
          markerY: 245,
          kind: "inspect",
          action: { type: "dialog", dialogId: "guard_desk" }
        },
        {
          id: "guard_mouse_zoom",
          name: "마우스",
          x: 960,
          y: 420,
          width: 250,
          height: 170,
          markerX: 1080,
          markerY: 500,
          kind: "inspect",
          action: { type: "computer_glitch" }
        }
      ]
    },

    office_floor_01: {
      id: "office_floor_01",
      name: "사무 구역 01",
      background: PHOTO_ASSETS.fallback,
      renderer: "prototypeOffice",
      playerStart: { x: 160, y: 420 },
      walkBounds: { x: 80, y: 160, width: 1120, height: 460 },
      events: [
        {
          id: "notice_terminal",
          name: "Notice Terminal",
          x: 420,
          y: 310,
          width: 72,
          height: 72,
          kind: "dialog",
          action: { type: "dialog", dialogId: "system_intro" }
        },
        {
          id: "supply_drawer",
          name: "Supply Drawer",
          x: 650,
          y: 458,
          width: 80,
          height: 48,
          kind: "item",
          onceFlag: "got_test_keycard",
          action: { type: "add_item", itemId: "test_keycard", count: 1, flag: "got_test_keycard" }
        },
        {
          id: "locked_exit",
          name: "Locked Exit",
          x: 1070,
          y: 260,
          width: 90,
          height: 150,
          kind: "door",
          action: { type: "dialog", dialogId: "locked_door" }
        },
        {
          id: "quiz_console",
          name: "Quiz Console",
          x: 250,
          y: 250,
          width: 72,
          height: 72,
          kind: "quiz",
          action: { type: "quiz", quizId: "system_quiz" }
        },
        {
          id: "minigame_machine",
          name: "Calibration Machine",
          x: 820,
          y: 300,
          width: 72,
          height: 72,
          kind: "minigame",
          action: { type: "minigame", minigameId: "system_tap" }
        },
        {
          id: "boss_marker",
          name: "Boss Marker",
          x: 930,
          y: 510,
          width: 72,
          height: 72,
          kind: "battle",
          action: { type: "battle", battleId: "system_boss" }
        }
      ]
    }
  };

  const QUEST_DATA = {
    prologue: {
      id: "prologue",
      title: "Prologue",
      steps: [
        { id: "return", label: "OSSE로 돌아오기", flag: "prologue_seen_exterior" },
        { id: "door", label: "잠긴 정문 확인", flag: "front_door_checked" },
        { id: "guard", label: "경비실 찾기", flag: "entered_guard_room" },
        { id: "card", label: "경비 출입카드 찾기", flag: "got_security_access_card" },
        { id: "warehouse", label: "창고 조사", flag: "warehouse_emergency_light_on" },
        { id: "warehouse_code", label: "창고 비밀번호 단서 찾기", flag: "warehouse_exit_scare_done" },
        { id: "office", label: "사무실 조사", flag: "meeting_room_checked" },
        { id: "second_floor", label: "2층 출입카드 찾기", flag: "got_second_floor_auth_card" },
        { id: "ceo", label: "대표실 문 확인", flag: "ceo_door_event_done" },
        { id: "project_s", label: "PROJECT S 확인", flag: "project_s_read" }
      ]
    },
    prototype_checklist: {
      id: "prototype_checklist",
      title: "Prototype Checklist",
      steps: [
        { id: "talk", label: "Test dialogue", flag: "test_choice_seen" },
        { id: "item", label: "Pick up an item", flag: "got_test_keycard" },
        { id: "quiz", label: "Clear a quiz", flag: "quiz_test_passed" },
        { id: "minigame", label: "Clear a minigame", flag: "minigame_test_cleared" },
        { id: "battle", label: "Clear a battle", flag: "boss_test_cleared" }
      ]
    }
  };

  class SceneSystem {
    constructor(game) {
      this.game = game;
      this.current = null;
      this.backgroundImage = new Image();
      this.imageCache = {};
    }

    load(sceneId, options = {}) {
      const scene = SCENE_DATA[sceneId];
      if (!scene) {
        throw new Error(`Missing scene: ${sceneId}`);
      }

      this.current = scene;
      if (!this.imageCache[scene.background]) {
        const image = new Image();
        image.src = scene.background;
        this.imageCache[scene.background] = image;
      }
      this.backgroundImage = this.imageCache[scene.background];
      if (!options.keepPlayerPosition) {
        this.game.player.x = scene.playerStart.x;
        this.game.player.y = scene.playerStart.y;
      }
      this.game.ui.setSceneName(scene.name);
    }

    getNearbyEvent(player) {
      if (!this.current) return null;

      return this.current.events.find((event) => {
        if (event.disabledUntilPhoto) {
          return false;
        }
        if (event.onceFlag && this.game.flags[event.onceFlag]) {
          return false;
        }
        if (event.requiresFlag && !this.game.flags[event.requiresFlag]) {
          return false;
        }
        if (event.blockedByFlag && this.game.flags[event.blockedByFlag]) {
          return false;
        }
        if (event.blockedWhileFlag && this.game.flags[event.blockedWhileFlag] && !this.game.flags[event.unblockedByFlag]) {
          return false;
        }

        const centerX = event.x + event.width / 2;
        const centerY = event.y + event.height / 2;
        const dx = player.x - centerX;
        const dy = player.y - centerY;
        return Math.hypot(dx, dy) < 96;
      }) || null;
    }

    interact() {
      const event = this.getNearbyEvent(this.game.player);
      if (!event) return false;

      return this.triggerEvent(event);
    }

    /*
      triggerEvent()
      ?대깽???ㅽ뻾 寃쎈줈瑜??쒓납?쇰줈 紐⑥쑝???대깽??留ㅻ땲? ?⑥닔?낅땲??
      湲곗〈 WASD/E 議곗궗 諛⑹떇怨????ъ씤?????대┃ 諛⑹떇??紐⑤몢 ???⑥닔瑜??듦낵?섎㈃,
      ?뚮옒洹?湲곕줉, 由щ???臾몄꽌 ?섏쭛, action ?ㅽ뻾 ?쒖꽌媛 ?쒕줈 ?닿툔?섏? ?딆뒿?덈떎.
    */
    triggerEvent(event) {
      if (!event) return false;

      this.game.handleSceneEvent(event);
      this.game.handleAction(event.action);
      return true;
    }
  }

  window.OSSE.SceneSystem = SceneSystem;
  window.OSSE.SCENE_DATA = SCENE_DATA;
  window.OSSE.QUEST_DATA = QUEST_DATA;
  window.OSSE.PHOTO_ASSETS = PHOTO_ASSETS;
})();
