(() => {
const { builds } = globalThis.CyberpunkBuildData;

const attributePlans = {
  shotgunTech: [
    ["신체", "20 목표", "샷건·기관총 화력, 아드레날린, 정면 생존"],
    ["테크", "20 목표", "사이버웨어 용량, 볼트·폭발·회복 아이템"],
    ["반사신경", "15 이상", "대시·공중 대시와 이동 중 방어"],
    ["냉정", "남는 점수", "치명타·헤드샷 보정이 필요할 때"],
    ["지능", "최소", "퀵핵을 쓰지 않는 구성"],
  ],
  netrunnerSmart: [
    ["지능", "20 목표", "오버클럭·대기열·스마트 무기 핵심"],
    ["테크", "20 목표", "램 보조 사이버웨어와 엣지러너"],
    ["반사신경", "15~20", "SMG·AR와 공중 대시 운용"],
    ["신체", "15 이상", "오버클럭용 체력과 회복 안정성"],
    ["냉정", "남는 점수", "잠입 또는 헤드샷 보조"],
  ],
  bladeThrow: [
    ["반사신경", "20 목표", "블레이드·도살장·공중 기동"],
    ["테크", "20 목표", "근접 피해 사이버웨어와 엣지러너"],
    ["냉정", "15~20", "투척·저글러·암살"],
    ["신체", "15 이상", "근접 생존과 아드레날린"],
    ["지능", "최소", "버서크/산데 중심이면 투자하지 않음"],
  ],
  bladeNetrunner: [
    ["반사신경", "20 목표", "블레이드·도살장·공중 대시"],
    ["지능", "20 목표", "이동 제한·오버클럭·퀵핵 대기열"],
    ["테크", "20 목표", "사이버웨어 용량과 근접 옵션작"],
    ["신체", "15 이상", "정면전 체력과 회복"],
    ["냉정", "남는 점수", "투척 보조가 필요할 때"],
  ],
  pistolSande: [
    ["냉정", "20 목표", "집중·데드아이·핸드건 치명타"],
    ["테크", "20 목표", "산데 쿨다운·사이버웨어 용량"],
    ["반사신경", "15~20", "대시·순풍과 치명 옵션 조율"],
    ["신체", "15 이상", "회복 아이템과 보스전 생존"],
    ["지능", "최소", "산데비스탄이 운영체제 슬롯을 사용"],
  ],
  techNetrunner: [
    ["테크", "20 목표", "볼트·체인라이트닝·테크 무기 충전"],
    ["지능", "20 목표", "제어 퀵핵과 오버클럭"],
    ["반사신경", "15~20", "케렌지코프·공중 대시·SMG/AR"],
    ["냉정", "15 이상", "정밀·스나이퍼 계열 헤드샷"],
    ["신체", "남는 점수", "체력·회복 안정성"],
  ],
  bodyNetrunner: [
    ["신체", "20 목표", "고릴라암·둔기·퀘이크와 아드레날린"],
    ["지능", "20 목표", "오버클럭과 근접 보조 퀵핵"],
    ["테크", "20 목표", "사이버웨어 용량과 근접 피해 옵션"],
    ["반사신경", "15 이상", "접근용 대시·공중 대시"],
    ["냉정", "남는 점수", "투척 보조가 있을 때"],
  ],
  stealthNetrunner: [
    ["지능", "20 목표", "추적 관리·시스템 붕괴·오버클럭"],
    ["냉정", "20 목표", "은신·소음기·집중/데드아이"],
    ["테크", "20 목표", "옵티컬 카모와 사이버웨어 용량"],
    ["반사신경", "15 이상", "발각 시 이탈용 공중 대시"],
    ["신체", "남는 점수", "체력과 회복 보완"],
  ],
  chromeTank: [
    ["신체", "20 목표", "샷건·LMG와 아드레날린 탱킹"],
    ["테크", "20 목표", "크롬 컴프레서·사이보그·엣지러너"],
    ["반사신경", "15 이상", "중화기 이동과 대시"],
    ["냉정", "남는 점수", "정밀 사격 또는 치명 보조"],
    ["지능", "최소", "운영체제를 크롬 컴프레서가 차지"],
  ],
  bodyBerserk: [
    ["신체", "20 목표", "둔기·퀘이크·버서크의 핵심"],
    ["테크", "20 목표", "근접 사이버웨어 용량과 엣지러너"],
    ["반사신경", "15~20", "접근·공중 대시·스태미나 회수"],
    ["냉정", "15 이상", "암살·투척을 섞을 때"],
    ["지능", "최소", "버서크가 운영체제 슬롯을 사용"],
  ],
  pureNetrunner: [
    ["지능", "20 목표", "오버클럭·4칸 대기열·얼티밋 퀵핵"],
    ["테크", "20 목표", "램/회복 사이버웨어와 엣지러너"],
    ["신체", "15~20", "오버클럭이 소비하는 체력 확보"],
    ["냉정", "15 이상", "은신 업로드와 발각 관리"],
    ["반사신경", "남는 점수", "도주·재배치용 대시"],
  ],
  assaultSande: [
    ["반사신경", "20 목표", "AR/SMG 연사·대시·순풍"],
    ["테크", "20 목표", "산데·케렌지코프와 용량 확장"],
    ["신체", "15~20", "반동을 버티는 체력·회복"],
    ["냉정", "15 이상", "정밀 사격과 치명 보조"],
    ["지능", "최소", "산데비스탄 운용"],
  ],
  hybridCool: [
    ["냉정", "20 목표", "투척·리볼버·정밀 사격"],
    ["테크", "20 목표", "수류탄·사이버웨어 용량"],
    ["반사신경", "15~20", "무기 교체와 공중 대시"],
    ["신체", "15 이상", "샷건·LMG와 회복"],
    ["지능", "9 이상", "저비용 제어 퀵핵만 보조"],
  ],
  smartNetrunner: [
    ["지능", "20 목표", "스마트 시너지·오버클럭·램"],
    ["반사신경", "20 목표", "SMG/AR 연사와 재장전"],
    ["테크", "20 목표", "패럴라인·사이버웨어 용량"],
    ["신체", "15 이상", "오버클럭 체력과 전면전 생존"],
    ["냉정", "남는 점수", "헤드샷·잠입 보조"],
  ],
};

const perkPlans = {
  shotgunTech: [
    ["신체", ["샷건 중앙 가지", "립 앤 티어", "고진감래", "아드레날린 러시"]],
    ["테크", ["방화광", "도시를 불태우겠어", "둠런처/볼트", "칩웨어 전문가", "엣지러너"]],
    ["반사신경", ["대시", "공중 대시", "순풍"]],
  ],
  netrunnerSmart: [
    ["지능", ["오버클럭", "4칸 퀵핵 대기열", "대기열 가속", "스마트 시너지", "피의 데몬"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너", "회복 아이템 가지"]],
    ["반사신경", ["SMG/AR 연사 가지", "재장전 이동", "공중 대시"]],
  ],
  bladeThrow: [
    ["반사신경", ["벽력일섬", "기회주의자", "도살장", "탄환 반사", "순풍"]],
    ["냉정", ["저글러", "전갈의 독", "투척 무기 회수 가지", "은신 암살 가지"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너"]],
  ],
  bladeNetrunner: [
    ["반사신경", ["벽력일섬", "기회주의자", "도살장", "탄환 반사", "순풍"]],
    ["지능", ["오버클럭", "퀵핵 대기열", "램 회수 가지", "마무리 공격 보조 퀵핵"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너"]],
  ],
  pistolSande: [
    ["냉정", ["집중", "데드아이", "퀵드로우", "핸드건 스태미나·치명 가지"]],
    ["반사신경", ["대시", "공중 대시", "순풍"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너", "회복 아이템 가지"]],
  ],
  techNetrunner: [
    ["테크", ["볼트", "체인라이트닝", "전자기 재생 처리기", "칩웨어 전문가", "엣지러너"]],
    ["지능", ["오버클럭", "퀵핵 대기열", "제어 퀵핵 비용·업로드 가지"]],
    ["반사신경", ["대시", "공중 대시", "이동 사격 가지"]],
  ],
  bodyNetrunner: [
    ["신체", ["레킹볼", "퀘이크", "세비지 슬링", "고진감래", "아드레날린 러시"]],
    ["지능", ["오버클럭", "퀵핵 대기열", "램 회수", "제어 퀵핵 가지"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너"]],
  ],
  stealthNetrunner: [
    ["냉정", ["킬러 본능", "집중", "데드아이", "은신·소음기 가지"]],
    ["지능", ["오버클럭", "추적 진행 감소", "퀵핵 대기열", "시스템 붕괴 비용 회수"]],
    ["테크", ["옵티컬 카모·회복 아이템 가지", "칩웨어 전문가", "엣지러너"]],
  ],
  chromeTank: [
    ["신체", ["샷건/LMG 중앙 가지", "립 앤 티어", "고진감래", "아드레날린 러시"]],
    ["테크", ["사이보그", "칩웨어 전문가", "라이선스 투 크롬", "엣지러너", "회복 아이템 가지"]],
    ["반사신경", ["대시", "공중 대시"]],
  ],
  bodyBerserk: [
    ["신체", ["레킹볼", "퀘이크", "세비지 슬링", "고진감래", "아드레날린 러시"]],
    ["반사신경", ["대시", "공중 대시", "순풍"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너"]],
  ],
  pureNetrunner: [
    ["지능", ["오버클럭", "4칸 퀵핵 대기열", "대기열 가속", "데이터 재활용", "피의 데몬", "카운터 해킹"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너", "회복 아이템 가지"]],
    ["신체", ["아드레날린 러시", "고진감래", "회복 효율 가지"]],
  ],
  assaultSande: [
    ["반사신경", ["명사수(Sharpshooter)", "소금 뿌리기", "이동 중 재장전", "공중 대시", "순풍"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너"]],
    ["신체", ["아드레날린 러시", "회복 아이템 가지"]],
  ],
  hybridCool: [
    ["냉정", ["집중", "데드아이", "저글러", "퀵드로우", "투척 회수 가지"]],
    ["테크", ["방화광", "수류탄 회복 가지", "칩웨어 전문가", "엣지러너"]],
    ["반사신경", ["대시", "공중 대시", "무기 교체 보조"]],
  ],
  smartNetrunner: [
    ["지능", ["스마트 시너지", "오버클럭", "퀵핵 대기열", "램 회수 가지"]],
    ["반사신경", ["SMG/AR 연사 가지", "서브머신 펀", "공중 대시", "순풍"]],
    ["테크", ["칩웨어 전문가", "라이선스 투 크롬", "엣지러너"]],
  ],
};

const profileById = {
  "mitigation-shotgun": "shotgunTech",
  "contagion-exploder": "netrunnerSmart",
  "explosive-ammo": "shotgunTech",
  "offmeta-blade": "bladeThrow",
  "blade-runner": "bladeNetrunner",
  malorian: "pistolSande",
  "tech-weapon-runner": "techNetrunner",
  "iron-fist-netrunner": "bodyNetrunner",
  "rocket-netrunner": "bodyNetrunner",
  "smg-mantis": "bladeNetrunner",
  "infiltration-netrunner": "stealthNetrunner",
  "sande-handgun": "pistolSande",
  "stealth-pistol-runner": "stealthNetrunner",
  "stealth-runner-rework": "stealthNetrunner",
  "ultimate-cyborg": "chromeTank",
  "bullet-time-punk": "pistolSande",
  "wire-combat-runner": "bladeNetrunner",
  hammer: "bodyBerserk",
  "chemical-punk": "bladeNetrunner",
  "maxtac-operator": "techNetrunner",
  "triple-samurai": "bladeThrow",
  "combination-netrunner": "pureNetrunner",
  "assault-trooper": "assaultSande",
  "kurt-hansen": "hybridCool",
  dildo: "bodyBerserk",
  "trigger-dart": "hybridCool",
  "chain-lightning": "techNetrunner",
  "cyber-shinobi": "bladeNetrunner",
  blackwall: "pureNetrunner",
  "gun-kata": "pistolSande",
  "smart-weapon-runner": "smartNetrunner",
  "electric-mamba": "techNetrunner",
  "adam-smasher": "shotgunTech",
  "cyber-butcher": "bodyBerserk",
  "triple-revolver": "pistolSande",
  "instant-execution": "bladeThrow",
  "spinloading-shotgun": "shotgunTech",
  "cyber-commando": "bladeNetrunner",
};

const signaturePerks = {
  "mitigation-shotgun": ["방화광으로 경감 확보", "볼트샷", "립 앤 티어", "고진감래"],
  "contagion-exploder": ["오버클럭", "스마트 시너지", "대기열 가속", "피의 데몬"],
  "explosive-ammo": ["방화광", "도시를 불태우겠어", "기관총 연속 사격 가지", "엣지러너"],
  "offmeta-blade": ["벽력일섬", "도살장", "기회주의자", "저글러"],
  "blade-runner": ["기회주의자", "도살장", "순풍", "이동 제한 연계"],
  malorian: ["집중", "데드아이", "퀵드로우", "퀵밀리 보조"],
  "tech-weapon-runner": ["볼트", "체인라이트닝", "전자기 재생 처리기", "오버클럭"],
  "iron-fist-netrunner": ["레킹볼", "퀘이크", "세비지 슬링", "오버클럭"],
  "rocket-netrunner": ["방화광", "둠런처", "고진감래", "립 앤 티어"],
  "smg-mantis": ["공중 대시", "도살장", "기회주의자", "SMG 재장전 가지"],
  "infiltration-netrunner": ["추적 진행 감소", "퀵핵 대기열", "시스템 붕괴 비용 회수", "은신 업로드"],
  "sande-handgun": ["집중", "데드아이", "순풍", "칩웨어 전문가"],
  "stealth-pistol-runner": ["킬러 본능", "집중", "데드아이", "오버클럭"],
  "stealth-runner-rework": ["추적 진행 감소", "시스템 붕괴 비용 회수", "볼트", "옵티컬 카모 렐릭"],
  "ultimate-cyborg": ["사이보그", "엣지러너", "고진감래", "아드레날린 러시"],
  "bullet-time-punk": ["집중", "데드아이", "저글러", "퀵드로우"],
  "wire-combat-runner": ["사이펀", "오버클럭", "도살장", "공중 대시"],
  hammer: ["레킹볼", "퀘이크", "세비지 슬링", "고진감래"],
  "chemical-punk": ["오버클럭", "방화광", "도살장", "체인라이트닝"],
  "maxtac-operator": ["볼트", "체인라이트닝", "공중 대시", "엣지러너"],
  "triple-samurai": ["벽력일섬", "도살장", "기회주의자", "순풍"],
  "combination-netrunner": ["오버클럭", "대기열 가속", "데이터 재활용", "피의 데몬"],
  "assault-trooper": ["명사수(Sharpshooter)", "소금 뿌리기", "공중 대시", "순풍"],
  "kurt-hansen": ["저글러", "데드아이", "기관총 연사 가지", "케렌지코프 회피"],
  dildo: ["레킹볼", "퀘이크", "세비지 슬링", "옵티컬 카모 렐릭"],
  "trigger-dart": ["저글러", "데드아이", "방화광", "빠른 무기 교체"],
  "chain-lightning": ["원문 소실로 확인 불가"],
  "cyber-shinobi": ["저글러", "도살장", "공중 대시", "옵티컬 카모 렐릭"],
  blackwall: ["오버클럭", "대기열 가속", "데이터 재활용", "카운터 해킹"],
  "gun-kata": ["데드아이", "퀵드로우", "공중 백대시", "퀵밀리 보조"],
  "smart-weapon-runner": ["스마트 시너지", "오버클럭", "서브머신 펀", "공중 대시"],
  "electric-mamba": ["체인라이트닝", "시한폭탄", "방화광", "저글러"],
  "adam-smasher": ["립 앤 티어", "방화광", "도시를 불태우겠어", "스마트 시너지"],
  "cyber-butcher": ["레킹볼", "퀘이크", "도살장", "옵티컬 카모 렐릭"],
  "triple-revolver": ["집중", "데드아이", "퀵드로우", "수류탄 사격"],
  "instant-execution": ["기회주의자", "도살장", "마무리 공격 가지", "엣지러너"],
  "spinloading-shotgun": ["립 앤 티어", "빠른 무기 교체", "런앤건", "아드레날린 러시"],
  "cyber-commando": ["저글러", "기회주의자", "도살장", "대기열 우선 순위 지정은 제외"],
};

function chooseOperatingSystem(build) {
  if (build.os === "산데비스탄") {
    return {
      choice: build.core.includes("팔콘") ? "밀리테크 팔콘 산데비스탄" : "밀리테크 어포지 산데비스탄",
      why: "시간 감속 중 약점·헤드샷·근접 연계를 안정화한다.",
      alternative: "보스전이나 용량 절약은 다이낼러 계열",
    };
  }
  if (build.os === "버서크") {
    return {
      choice: build.core.includes("바이오다인") ? "바이오다인 버서크" : "버서크 계열",
      why: "근접 돌입 중 사망을 막고 강공·마무리 루프를 유지한다.",
      alternative: "무적 시간과 용량을 비교해 등급 조절",
    };
  }
  if (build.os === "크롬 컴프레서") {
    return {
      choice: "크롬 컴프레서",
      why: "운영체제 액티브를 포기하고 방어·회복·딜 슬롯을 더 채운다.",
      alternative: "기동이 필요하면 산데비스탄형으로 별도 재설계",
    };
  }
  let deck = "테트라토닉 리플러";
  if (build.core.includes("아라사카")) deck = "아라사카 사이버덱";
  if (build.core.includes("레이븐")) deck = "레이븐 마이크로사이버";
  if (build.core.includes("패럴라인")) deck = "밀리테크 패럴라인";
  if (build.core.includes("칸토")) deck = "밀리테크 칸토 MK.6";
  return {
    choice: deck,
    why: "핵심 퀵핵의 램·업로드·고유 효과를 빌드의 무기 루프와 묶는다.",
    alternative: "잠입은 아라사카, 전면전은 테트라토닉 계열",
  };
}

function cyberwarePlan(build) {
  const tags = build.tags.join(" ");
  const isNetrunner = build.os === "넷러닝";
  const isMelee = /블레이드|카타나|둔기|해머|고릴라암|맨티스|모노와이어|근접|딜도|톱날검/.test(tags);
  const isSmart = /스마트/.test(tags) || /신겐|잉롱|바 싱|팔리카|워든/.test(build.core);
  const isThrowing = /투척|단검|다트|닌자/.test(tags);
  const isTechWeapon = /테크무기|테크 피스톨|볼트/.test(tags);
  const isExplosive = /폭발|런처|방화광/.test(tags);

  const arms = build.core.match(/(?:전기 )?(?:고릴라암|고릴라 암|맨티스|모노와이어|투사체 발사기|투사체 발사 시스템)/)?.[0]
    ?? (isMelee ? "전기 고릴라암" : isExplosive ? "투사체 발사 시스템" : "용량 여유에 맞는 사이버암");
  const hand = isSmart
    ? "스마트 링크"
    : isThrowing
      ? "손잡이 싸개"
      : /샷건|리볼버|피스톨/.test(tags)
        ? "마이크로 발전기"
        : "탄도 보조 프로세서 또는 용량 낮은 손 슬롯";
  const frontal = isNetrunner
    ? "엑스디스크 · 램 재분배기 · 아홀로틀/메모리 부스트"
    : "아홀로틀 · 메카트로닉 코어 · 양자 튜너";
  const nervous = isTechWeapon
    ? "케렌지코프 · 디프 필드 비주얼 인터페이스 · 네오섬유"
    : isMelee
      ? "네오섬유 · 케렌지코프 · 아드레노 트리거"
      : "케렌지코프 · 네오섬유 · 리플렉스 튜너";
  const integumentary = /잠입|암살|옵티컬 카모/.test(tags)
    ? "옵티컬 카모 · 페인듀서 · 키틴/카운터셸"
    : "페인듀서 · 키틴 · 디펜지코프/셀룰러 어댑터";
  const skeleton = isMelee
    ? "고밀도 골수 · 에픽모픽 스켈레톤 · 스프링 연결부"
    : "에픽모픽 스켈레톤 · 스프링 연결부 · 램 회수 코일/범용 방어";

  return [
    { slot: "전두피질", choice: frontal, why: isNetrunner ? "램 총량·회수·업로드 속도를 먼저 맞춘다." : "쿨다운과 기계 대상 화력을 확보한다.", alternative: "보스전은 양자 튜너, 다수전은 아홀로틀" },
    { slot: "운영체제", ...chooseOperatingSystem(build) },
    { slot: "팔", choice: arms, why: isMelee ? "접근·CC·마무리 공격 조건을 만든다." : "주무기가 막힐 때 속성/광역 보조로 사용한다.", alternative: "무기 중심이면 저용량 등급으로 조절" },
    { slot: "골격", choice: skeleton, why: isMelee ? "근접 피해와 급사 방지를 함께 챙긴다." : "방어력·경감으로 조준 시간을 번다.", alternative: "용량 부족 시 스프링 연결부를 우선" },
    { slot: "신경계", choice: nervous, why: "시간 감속·경감·정확도 중 이 빌드가 필요한 축을 보완한다.", alternative: "산데 빌드는 딥 필드, 근접은 아드레노 트리거" },
    { slot: "외피", choice: integumentary, why: /잠입|암살/.test(tags) ? "발각 제어와 첫 교전 생존을 책임진다." : "받은 피해를 분산하고 경감 창을 만든다.", alternative: "잠입은 옵티컬 카모, 정면전은 키틴/페인듀서" },
    { slot: "안구·얼굴", choice: isNetrunner && /잠입/.test(tags) ? "오라클 또는 원문 지정 안구" : "키로시 코카트리스", why: "치명타 또는 표적 탐지로 핵심 공격의 성공률을 올린다.", alternative: "치명 확정 빌드는 낮은 용량 안구" },
    { slot: "손", choice: hand, why: isSmart ? "스마트 무기 자동 조준과 해킹 연계를 활성화한다." : isThrowing ? "투척 치명타·회수 루프를 보조한다." : "탄창 소진·도탄 등 주무기 특성을 보강한다.", alternative: "사용하지 않는 손 슬롯은 추가 옵션용 저용량 장비" },
    { slot: "순환계", choice: "혈액펌프 · 바이오모니터 · 힐 온 킬/마이크로 로터", why: isMelee ? "돌입 중 회복과 공격 속도를 자동화한다." : "오버클럭·산데 중 피 관리에 뺏기는 집중을 줄인다.", alternative: "보스전은 피드백 회로, 잡몹전은 힐 온 킬" },
    { slot: "다리", choice: "강화 힘줄", why: "이단 점프와 공중 대시로 사선·고저차를 즉시 바꾼다.", alternative: "은신 취향이면 조용한 착지 계열" },
  ];
}

for (const build of builds) {
  const profile = profileById[build.id];
  const finalSetup = globalThis.CyberpunkFinalSetups?.[build.id] ?? {
    attributes: [],
    cyberware: [],
  };
  build.finalAttributeImages = finalSetup.attributes;
  build.finalCyberwareImages = finalSetup.cyberware;
  build.gear = build.weapons.map((name, index) => {
    const item = globalThis.CyberpunkGearCatalog?.[name] ?? {
      name,
      type: "핵심 장비",
      description: "이 공략에서 지정한 핵심 장비입니다.",
      thumbnail: "",
      acquisition: "원문 공략에서 획득 조건을 확인하세요.",
      source: build.source,
      sourceTitle: "원문 공략",
    };
    const role = index === 0
      ? "주력 · 기본 딜사이클을 담당"
      : index === 1
        ? "보조 · 주력 장비의 빈틈을 보완"
        : "전술 · 정예·광역·위기 상황 대응";
    return { ...item, role };
  });

  if (build.sourceAccessible === false) {
    build.attributePlan = [["특성", "확인 불가", "삭제된 원문을 복원하거나 추측하지 않음"]];
    build.perkPlan = [["필수 특전", ["원문 소실로 확인 불가"]]];
    build.signaturePerks = ["원문 소실로 확인 불가"];
    build.cyberwarePlan = [{
      slot: "전체 슬롯",
      choice: "확인 불가",
      why: "모음 글의 제목과 조합만 남아 세부 세팅을 검증할 수 없다.",
      alternative: "유사한 테크 웨폰 러너 공략을 참고",
    }];
    continue;
  }

  build.attributePlan = attributePlans[profile];
  build.perkPlan = perkPlans[profile];
  build.signaturePerks = signaturePerks[build.id];
  build.cyberwarePlan = cyberwarePlan(build);
}
})();
