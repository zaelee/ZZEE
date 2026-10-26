window.PUPSTERS_DATA = {
  dogs: [
    { id: "D01", name: "시바멈", breed: "시바견", role: "직선 견제", skill: "뼈다귀 퉤!", note: "작은 뼈를 물었다가 정면으로 뱉어요.", color: "coral", cost: 80, power: 34, range: 4, speed: 3, image: "assets/characters/D01-shiba.png", effect: "assets/effects/fx-bone.svg" },
    { id: "D02", name: "불돔", breed: "불도그", role: "근거리 밀치기", skill: "압축 공기 푸핫", note: "짧고 묵직한 바람으로 줄을 밀어내요.", color: "sun", cost: 90, power: 46, range: 2, speed: 2, image: "assets/characters/D02-bulldog.png", effect: "assets/effects/fx-air.svg" },
    { id: "D03", name: "머스키", breed: "허스키", role: "둔화", skill: "꽁꽁 입김", note: "차가운 숨으로 적의 발을 늦춰요.", color: "ice", cost: 100, power: 26, range: 4, speed: 3, image: "assets/characters/D03-husky.png", effect: "assets/effects/fx-frost.svg" },
    { id: "D04", name: "미글", breed: "비글", role: "점착 제어", skill: "끈적 침방울", note: "바닥에 착 붙는 침으로 길을 막아요.", color: "lime", cost: 75, power: 22, range: 3, speed: 4, image: "assets/characters/D04-beagle.png", effect: "assets/effects/fx-saliva.svg" },
    { id: "D05", name: "무들", breed: "푸들", role: "연쇄 공격", skill: "정전기 찌릿", note: "가까운 블록 사이로 전기를 이어 보내요.", color: "lavender", cost: 110, power: 30, range: 4, speed: 4, image: "assets/characters/D05-poodle.png", effect: "assets/effects/fx-static.svg" },
    { id: "D06", name: "모더콜리", breed: "보더콜리", role: "응원 지원", skill: "박자 맞춰 멍!", note: "종이 왕관을 쓰고 주변 친구를 북돋아요.", color: "ink", cost: 95, power: 12, range: 3, speed: 3, image: "assets/characters/D06-collie.png", effect: "assets/effects/fx-bark.svg" }
  ],
  enemies: [
    { id: "E01", name: "기본 블록봇", role: "기본", clue: "정직하게 길을 따라오는 산호색 블록.", image: "assets/enemies/E01-block-bot.png", hp: 3, pace: 2 },
    { id: "E02", name: "바퀴 블록봇", role: "고속", clue: "두 바퀴로 빈틈을 빠르게 파고든다.", image: "assets/enemies/E02-wheelie.png", hp: 2, pace: 5 },
    { id: "E03", name: "벽돌 덩치", role: "탱커", clue: "세 겹 벽돌 몸으로 공격을 버틴다.", image: "assets/enemies/E03-brick-bruiser.png", hp: 5, pace: 1 },
    { id: "E04", name: "장갑 블록봇", role: "장갑", clue: "앞쪽 갑옷은 단단하지만 뒷면은 평범하다.", image: "assets/enemies/E04-shellback.png", hp: 5, pace: 2 },
    { id: "E05", name: "분열 블록봇", role: "분열", clue: "쓰러지면 작은 조각으로 갈라진다.", image: "assets/enemies/E05-split-stack.png", hp: 3, pace: 3 },
    { id: "E06", name: "수리 블록봇", role: "수리", clue: "렌치로 앞선 블록을 고친다.", image: "assets/enemies/E06-fix-it-bot.png", hp: 3, pace: 2 },
    { id: "E07", name: "투명 블록봇", role: "은신", clue: "희미해졌다가 공격 범위 안에서 모습을 드러낸다.", image: "assets/enemies/E07-clear-crawler.png", hp: 2, pace: 3 },
    { id: "E08", name: "블록 운반차", role: "수송", clue: "안에 태운 산호색 블록을 길 위에 내려놓는다.", image: "assets/enemies/E08-carrier-cart.png", hp: 4, pace: 2 },
    { id: "B01", name: "블록사우루스", role: "보스", clue: "세 덩이 장갑을 차례로 깨야 하는 장난감 공룡.", image: "assets/enemies/B01-blockosaur.png", hp: 6, pace: 1 }
  ],
  stages: [
    { id: "living", title: "1. 거실 대소동", kicker: "첫 장난감 습격", status: "open", waves: 8, bg: "assets/backgrounds/living-room.png", color: "coral" },
    { id: "kitchen", title: "2. 주방의 우당탕", kicker: "간식 서랍 너머", status: "locked", waves: 10, color: "lime" },
    { id: "balcony", title: "3. 베란다 바람길", kicker: "화분 사이 추격", status: "locked", waves: 12, color: "ice" },
    { id: "attic", title: "4. 다락방의 왕", kicker: "블록사우루스 출몰", status: "locked", waves: 1, color: "lavender" }
  ],
  route: [
    { x: 7, y: 23 }, { x: 27, y: 23 }, { x: 34, y: 42 }, { x: 59, y: 42 },
    { x: 66, y: 68 }, { x: 88, y: 68 }
  ],
  slots: [
    { x: 18, y: 44 }, { x: 30, y: 66 }, { x: 46, y: 24 },
    { x: 54, y: 63 }, { x: 72, y: 34 }, { x: 80, y: 78 }
  ],
  uiAssets: [
    "panel.svg", "button-default.svg", "button-selected.svg", "button-disabled.svg", "progress-bar.svg",
    "path-overlay.svg", "placement-slot.svg", "icon-bone.svg", "icon-heart.svg", "icon-paw.svg", "icon-frost.svg",
    "icon-bolt.svg", "icon-crown.svg", "icon-settings.svg", "icon-play.svg", "icon-pause.svg", "icon-coin.svg",
    "icon-arrow.svg", "icon-speaker.svg"
  ]
};
