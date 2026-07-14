const CATEGORY_META = {
  한식: { color: "#FF6B35", image: "./images/korean.svg" },
  중식: { color: "#D94841", image: "./images/chinese.svg" },
  일식: { color: "#3A7CA5", image: "./images/japanese.svg" },
  양식: { color: "#5B8C5A", image: "./images/western.svg" },
  아시아: { color: "#8B5CF6", image: "./images/asian.svg" },
  햄부기: { color: "#B45309", image: "./images/western.svg" },
  멕시칸: { color: "#0F766E", image: "./images/western.svg" },
  고인물: { color: "#7C3AED", image: "./images/korean.svg" },
  디저트: { color: "#C06C84", image: "./images/dessert.svg" },
};

const baseLat = 37.5404;
const baseLng = 127.0692;
const seongsuBaseLat = 37.5446;
const seongsuBaseLng = 127.0557;

const rawRestaurants = [
  ["해남닭집", "한식", 4.2, "식객 허영만에 소개된 통닭집", "통닭", "식객 허영만의 통닭집"],
  ["정면", "한식", 4.5, "미쉐린 부추 고기국수, 깔끔한 국수바", "부추 고기국수", "건대에서 국수 먹고 싶을 때 가장 먼저 떠오르는 곳"],
  ["동대문곱창", "한식", 4, "엔시티 도영 단골로 알려진 곱창집", "곱창구이", "팬심을 빼고 봐도 곱창 컨디션이 좋은 편"],
  ["원조숯불소금구이", "한식", 3.5, "기름기 적은 치맛살과 멸치 향 강한 술밥", "치맛살", "수요미식회 계열의 오래된 고깃집 감성"],
  ["서북면옥", "한식", 3, "밍밍한 매력의 평양냉면집", "평양냉면", "간이 센 음식을 기대하면 아쉽고 슴슴함을 즐기면 좋음"],
  ["은혜즉석떡볶이", "한식", 3, "즉석 짜장 떡볶이", "즉석떡볶이", "친구들이랑 냄비 가운데 두고 먹기 좋은 추억 맛"],
  ["깍둑", "한식", 3, "가성비 좋은 고기집", "돼지고기 구이", "부담 없이 고기 먹기 좋은 선택지"],
  ["김해평화뒷고기", "한식", 3, "가성비 고기와 사이드가 괜찮은 곳", "뒷고기", "사이드까지 챙겨 먹어야 만족도가 올라감"],
  ["아찌떡볶이", "한식", 3, "기본에 충실한 시장 떡볶이집", "떡볶이", "화려하진 않아도 딱 기대한 시장 떡볶이"],
  ["환이네갈비살", "한식", 3, "가성비 소고기집", "갈비살", "소고기를 가볍게 먹고 싶을 때"],
  ["방이샤브칼국수", "한식", 3, "등촌과 경쟁 중인 샤브칼국수", "샤브칼국수", "칼국수와 볶음밥까지 이어지는 안정적인 루틴"],
  ["김밥천국 건대2호점", "한식", 3, "쯔양이 왔다간 묵참, 수제비 맛집", "묵은지참치김밥", "김밥천국이라는 이름보다 메뉴 선택이 더 중요함"],
  ["최신족발", "한식", 2, "순댓국이 나오는 족발집", "족발", "서비스 국물까지 생각하면 기억에 남는 집"],
  ["서소문순두부보쌈", "한식", 2, "건대 백반집", "순두부보쌈", "점심 한 끼용으로 무난한 백반 무드"],
  ["돕감자탕", "한식", 2, "감자탕과 해물탕을 함께 떠올리게 하는 집", "감자탕", "메뉴 조합이 독특해서 한 번쯤 기록"],
  ["포크포크", "한식", 2, "돈까스를 냉면 국물에 적셔 먹는 곳", "돈까스", "취향을 타지만 이야기거리가 확실함"],
  ["김창훈포차", "한식", 2, "곱도리탕 맛?집?", "곱도리탕", "물음표까지 포함해서 기록해두는 포차"],
  ["시홍쓰", "중식", 3.5, "비빔탄탄면이 유명하지만 웨이팅과 회전율이 변수", "비빔탄탄면", "아직 못 먹어본 숙제 같은 곳"],
  ["송화산시도삭면", "중식", 4, "진짜 칼로 써는 도삭면", "도삭면", "면 식감이 확실해서 중식 카테고리 상위권"],
  ["빠오즈푸", "중식", 4, "가성비 좋은 딤섬집", "빠오즈", "딤섬을 편하게 여러 개 시켜보기 좋음"],
  ["매운향솥", "중식", 4, "왜인지 계속 맛있는 마라샹궈", "마라샹궈", "마라샹궈 기준점으로 삼기 좋은 집"],
  ["송화양꼬치", "중식", 2, "건두부무침 반찬이 반가운 양꼬치집", "양꼬치", "반찬 하나가 기억을 살리는 타입"],
  ["638DENO탄탄면", "일식", 4, "일본식 탄탄멘", "탄탄멘", "묵직한 국물과 면의 밸런스를 기대하는 곳"],
  ["브네", "일식", 4.5, "품종과 부위별 돈카츠를 먹을 수 있는 점심 맛집", "돈카츠", "점심에만 돈카츠라 타이밍이 제일 어려움"],
  ["오코노미야키식당하나", "일식", 4.5, "2시간 기다릴 맛은 아닙니다의 주인공", "오코노미야키", "맛있지만 웨이팅까지 포함하면 계산이 필요함"],
  ["멘쇼", "일식", 3.5, "현지의 츠케멘 맛 그대로, 쫄깃한 면", "츠케멘", "면 좋아하는 사람에게 추천하기 좋은 집"],
  ["우마텐텐동", "일식", 3, "느리지만 기본에 충실한 텐동", "텐동", "기다림만 감안하면 기본기는 괜찮음"],
  ["호야초밥참치", "일식", 3, "두툼한 회가 올라간 초밥", "초밥", "회 두께에서 만족감이 오는 초밥집"],
  ["초라멘", "일식", 2, "깔끔한 마제소바와 라멘", "마제소바", "깔끔함 쪽에 가까운 라멘 선택지"],
  ["슈퍼슬라이더", "양식", 3.5, "작은 버거인 슬라이더를 여러 개 맛볼 수 있음", "슬라이더", "여러 맛을 조금씩 먹는 재미가 있음"],
  ["호파스타", "양식", 2, "생면으로 만든 가성비 파스타", "생면 파스타", "가격을 생각하면 충분히 기록할 만함"],
  ["미분당", "아시아", 3, "깔끔하고 조용한 베트남 쌀국수집", "쌀국수", "혼밥하기 좋은 정돈된 쌀국수"],
  ["꾸아", "아시아", 2, "뼈다귀가 통째로 올라가는 쌀국수집", "왕갈비 쌀국수", "비주얼 임팩트가 강한 쌀국수"],
  ["보난자", "디저트", 4, "독일 대표 커피 브랜드, 휘낭시에도 맛있음", "커피와 휘낭시에", "커피 마시러 가서 디저트도 챙기게 되는 곳"],
  ["꼬메노", "디저트", 3, "따뜻한 분위기와 기본기 충실한 디저트", "디저트", "무드가 좋아 오래 앉아 있기 좋음"],
  ["최가회관", "디저트", 3, "콜드브루 전문, 특색 있는 디저트", "콜드브루", "커피 취향이 맞으면 기억에 남는 카페"],
  ["잠수교집", "한식", 3.5, "소스가 맛있는 냉삼집", "냉동삼겹살", "소스 조합까지 같이 기억해야 하는 성수 냉삼집"],
  ["꿉당", "한식", 5, "미쉐린 고깃집, 사이드 맛집", "돼지고기 구이", "고기와 사이드 둘 다 기대하게 되는 성수 고깃집"],
  ["땅코참숯구이", "한식", 3, "왕십리 본점에서 이어진 참숯구이 맛집", "돼지고기 구이", "꿉당 계보 이야기까지 같이 떠오르는 고깃집"],
  ["성수동양갈비", "한식", 3, "양갈비와 사이드가 괜찮은 곳", "양갈비", "양갈비 먹고 사이드까지 챙기기 좋은 집"],
  ["능동미나리", "한식", 3, "용산에서 유명한 미나리 국밥과 미나리 육회", "미나리곰탕", "미나리 향이 선명한 국밥 계열 맛집"],
  ["금금", "한식", 3, "깔끔한 퓨전 한식", "퓨전 한식", "정갈하고 부담 없이 데려가기 좋은 한식"],
  ["돼지공탕하우", "한식", 2, "베이컨 냄새나는 맑은 곰탕과 냉제육", "돼지곰탕", "맑은 국물인데 개성이 또렷한 돼지곰탕"],
  ["실비옥", "한식", 2, "미역 수제비 전골", "미역 수제비 전골", "담백한 전골 무드로 기록해둘 만한 곳"],
  ["솥솥", "한식", 2, "돌솥밥과 누룽지가 좋은 곳", "돌솥밥", "마지막 누룽지까지 챙겨야 완성되는 밥집"],
  ["조조칼국수", "한식", 2, "대구 맛집 계열의 물총조개 칼국수", "물총조개 칼국수", "조개 국물 좋아하면 성수에서도 체크할 곳"],
  ["칼", "한식", 2, "칼국수, 수제비 그리고 전", "칼국수", "비 오는 날 생각나는 밀가루 조합"],
  ["르프리크", "햄부기", 5, "네슈빌 핫치킨 버거 원조격", "핫치킨버거", "한창 유행했던 핫치킨 버거의 기준점 같은 곳"],
  ["bd버거", "햄부기", 3, "새우버거와 가지튀김", "새우버거", "버거보다 사이드까지 같이 봐야 하는 집"],
  ["롸카두들", "햄부기", 3, "르프리크보다 가벼운 네슈빌 핫치킨 버거", "핫치킨버거", "핫치킨 버거를 좀 더 캐주얼하게 먹기 좋은 곳"],
  ["핑거팁스", "햄부기", 2, "수제버거 스타일", "수제버거", "성수 버거 선택지로 가볍게 기록"],
  ["마오", "아시아", 3.5, "모수 출신 셰프의 아시아 음식", "아시아 요리", "셰프 이력 때문에 한 번 확인하고 싶은 곳"],
  ["마하차이", "아시아", 4, "가성비 좋은 태국 음식점", "태국 음식", "가격과 맛 밸런스가 좋은 태국 음식 선택지"],
  ["벱", "아시아", 3, "깔끔한 베트남 음식점", "베트남 음식", "성수에서 깔끔하게 먹기 좋은 베트남 음식"],
  ["남짐릇", "아시아", 1, "분위기 좋은 태국 음식점", "태국 음식", "분위기는 좋지만 맛 기준으로는 보수적으로 기록"],
  ["페이퍼플레이트", "양식", 3.5, "미국식 피자와 윙", "피자와 윙", "피자와 윙을 같이 먹는 미국식 무드"],
  ["세스크멘슬", "양식", 4, "샤퀴테리 맛집", "샤퀴테리", "술과 함께 가는 성수 샤퀴테리 맛집"],
  ["마리오네", "양식", 3, "감베로로쏘 계열의 나폴리 피자", "나폴리 피자", "피자 자체를 보러 가기 좋은 곳"],
  ["피읻짜", "양식", 3, "화덕피자, 피쉬앤칩스, 소시지 맛집", "화덕피자", "여러 메뉴를 나눠 먹기 좋은 피자집"],
  ["코치", "일식", 5, "토종닭 야키토리", "야키토리", "흑백요리사 통편집 서사까지 붙은 야키토리"],
  ["가조쿠", "일식", 4, "오래된 전통의 우동, 소바 맛집", "우동", "성수 일식 면 요리의 안정적인 선택지"],
  ["소바마에니고", "일식", 4, "전통 있는 소바집", "소바", "소바 좋아하면 따로 체크할 만한 곳"],
  ["탐광", "일식", 3, "가츠동과 대창카레", "가츠동", "든든한 일본식 덮밥/카레 선택지"],
  ["토리아에즈", "일식", 3, "야키토리와 이자카야", "야키토리", "가볍게 한잔하기 좋은 이자카야"],
  ["라무라", "일식", 2, "합정에서 유명한 까만 라멘", "라멘", "독특한 비주얼의 라멘으로 기록"],
  ["도죠", "일식", 2, "깔끔한 사케동과 일식 식당", "사케동", "정갈한 일식 한 끼로 무난한 곳"],
  ["죠죠", "일식", 2, "분위기 좋은 오코노미야키 식당", "오코노미야키", "분위기와 철판 요리 무드가 강한 곳"],
  ["오몬자", "일식", null, "몬자야끼 먹고 싶다 아직 안가봄", "몬자야끼", "방문 후 코멘트를 업데이트할 예정"],
  ["성수속향연", "중식", 3, "신라호텔 출신 주방장의 탕수육 맛집", "탕수육", "탕수육 기준으로 체크할 만한 중식"],
  ["중앙감속기", "중식", 1, "최현석의 퓨전 중식", "퓨전 중식", "유명세는 있지만 맛 평가는 보수적으로 기록"],
  ["데니스타코", "멕시칸", 2, "깔끔한 타코집", "타코", "성수에서 무난하게 타코 먹는 선택지"],
  ["영수분식", "고인물", 4, "야채곱창과 막창 맛집", "야채곱창", "전통성 점수까지 얹어 기록할 성수 노포"],
  ["미정이네식당", "고인물", 3, "코다리찜 맛집", "코다리찜", "동네 식당 감성으로 기억할 코다리찜"],
  ["소문난 성수 감자탕", "고인물", 3, "줄이 엄청 긴 감자탕집", "감자탕", "웨이팅까지 포함해 성수 대표 감자탕으로 기록"],
  ["성수 족발", "고인물", 3, "서울 3대 족발로 불리는 곳", "족발", "전통성 있는 족발 맛집으로 체크"],
  ["높은산", "디저트", 3.5, "인도식 밀크티, 럼짜이와 진저짜이", "짜이", "차 향이 또렷한 성수 디저트/티 선택지"],
  ["밀스", "디저트", 3.5, "모수 출신 셰프 카페", "디저트", "셰프 이력 때문에 궁금한 성수 카페"],
  ["맥파이앤타이거", "디저트", 4, "성수뷰와 감도 높은 차와 디저트", "차와 디저트", "공간감과 차 무드를 같이 즐기는 곳"],
  ["커피로우스탠드", "디저트", 3, "테이크아웃 맛집, 가성비 좋은 커피", "커피", "가볍게 들고 가기 좋은 커피 스탠드"],
  ["스탠드업플리즈", "디저트", 3, "콘파냐와 티라미수 콘파냐", "콘파냐", "콘파냐 먹으러 찍어둘 만한 카페"],
  ["폴린커피바", "디저트", 3, "에스프레소바 콘파냐 맛집", "콘파냐", "에스프레소바 무드로 짧게 들르기 좋음"],
  ["뵈르뵈르", "디저트", 3, "꾸덕한 아이스크림", "아이스크림", "진한 아이스크림 먹고 싶을 때"],
  ["자연도소금빵", "디저트", 3, "버터와 소금이 진한 소금빵", "소금빵", "소금빵 하나로도 기억에 남는 곳"],
  ["코끼리베이글", "디저트", 2, "다양한 베이글과 힙한 가게", "베이글", "베이글 종류와 공간감으로 기록"],
  ["차일디쉬", "디저트", 2, "붕어빵 소금빵 원툴", "붕어빵 소금빵", "시그니처 하나로 기억되는 디저트집"],
  ["텅 성수 스페이스", "디저트", 2, "힙하고 생각보다 큰 카페", "커피와 디저트", "큰 공간과 성수다운 분위기가 강한 카페"],
  ["마마젤라또", "디저트", 2, "콘이 맛있는 힙한 젤라또", "젤라또", "젤라또보다 콘까지 같이 기억나는 곳"],
  ["어니언", "디저트", 1, "천장 허무는 감성 카페의 시초", "커피와 베이커리", "성수 감성 카페의 원형처럼 기록"],
];

const priceByCategory = {
  한식: "1만-3만원",
  중식: "1만-2만원",
  일식: "1만-3만원",
  양식: "1만-2만원",
  아시아: "1만-2만원",
  햄부기: "1만-2만원",
  멕시칸: "1만-2만원",
  고인물: "1만-3만원",
  디저트: "5천-1만5천원",
};

const moodByCategory = {
  한식: "편한 동네 식당",
  중식: "활기찬 식사",
  일식: "차분한 한 끼",
  양식: "캐주얼",
  아시아: "가볍고 조용한 식사",
  햄부기: "캐주얼한 버거집",
  멕시칸: "가벼운 타코 무드",
  고인물: "오래된 동네 맛집",
  디저트: "커피와 대화",
};

const buildMenuItems = (signatureMenu) => [
  { name: signatureMenu, price: null },
  { name: "추천 메뉴 확인 필요", price: null },
  { name: "추천 메뉴 확인 필요", price: null },
];

const seongsuRestaurantNames = new Set([
  "잠수교집",
  "꿉당",
  "땅코참숯구이",
  "성수동양갈비",
  "능동미나리",
  "금금",
  "돼지공탕하우",
  "실비옥",
  "솥솥",
  "조조칼국수",
  "칼",
  "르프리크",
  "bd버거",
  "롸카두들",
  "핑거팁스",
  "마오",
  "마하차이",
  "벱",
  "남짐릇",
  "페이퍼플레이트",
  "세스크멘슬",
  "마리오네",
  "피읻짜",
  "코치",
  "가조쿠",
  "소바마에니고",
  "탐광",
  "토리아에즈",
  "라무라",
  "도죠",
  "죠죠",
  "오몬자",
  "성수속향연",
  "중앙감속기",
  "데니스타코",
  "영수분식",
  "미정이네식당",
  "소문난 성수 감자탕",
  "성수 족발",
  "높은산",
  "밀스",
  "맥파이앤타이거",
  "커피로우스탠드",
  "스탠드업플리즈",
  "폴린커피바",
  "뵈르뵈르",
  "자연도소금빵",
  "코끼리베이글",
  "차일디쉬",
  "텅 성수 스페이스",
  "마마젤라또",
  "어니언",
]);

const pendingRestaurantNames = new Set([
  "오몬자",
]);

const addressVerifiedAt = "2026-06-30";
const verifiedPlaceData = {
  해남닭집: { matchedName: "해남닭집", address: "서울특별시 광진구 능동로13길 46 1층", latitude: 37.5440075, longitude: 127.0699822 },
  정면: { matchedName: "정면", address: "서울특별시 광진구 능동로13길 88 1층", latitude: 37.5454903, longitude: 127.0687052 },
  동대문곱창: { matchedName: "동대문곱창", address: "서울특별시 광진구 뚝섬로27길 37", latitude: 37.5375275, longitude: 127.0660391 },
  원조숯불소금구이: { matchedName: "원조숯불소금구이", address: "서울특별시 광진구 광나루로12길 19 1층", latitude: 37.546651, longitude: 127.0676569 },
  서북면옥: { matchedName: "서북면옥", address: "서울특별시 광진구 자양로 199-1 서북면옥", latitude: 37.5453748, longitude: 127.0853467 },
  은혜즉석떡볶이: { matchedName: "은혜즉석떡볶이", address: "서울특별시 광진구 광나루로 381-1", latitude: 37.5481087, longitude: 127.0723468 },
  깍둑: { matchedName: "깍뚝", address: "서울특별시 광진구 능동로19길 36 1층", latitude: 37.5473896, longitude: 127.0718608 },
  김해평화뒷고기: { matchedName: "평화김해뒷고기 건대점", address: "서울특별시 광진구 아차산로31길 9-1 1층", latitude: 37.5415604, longitude: 127.0693913 },
  아찌떡볶이: { matchedName: "아찌떡볶이", address: "서울특별시 광진구 아차산로29길 53", latitude: 37.5432377, longitude: 127.069197 },
  환이네갈비살: { matchedName: "환이네갈비살 본점", address: "서울특별시 광진구 아차산로29길 24 1층", latitude: 37.5419347, longitude: 127.0686643 },
  방이샤브칼국수: { matchedName: "방이샤브샤브칼국수 건대점", address: "서울특별시 광진구 동일로20길 100 1층", latitude: 37.5397827, longitude: 127.0689155 },
  "김밥천국 건대2호점": { matchedName: "김밥천국 건대2호점", address: "서울특별시 광진구 능동로13길 21 1층", latitude: 37.5430562, longitude: 127.0707236 },
  최신족발: { matchedName: "최신족발", address: "서울특별시 광진구 아차산로29길 63", latitude: 37.543646, longitude: 127.0693479 },
  서소문순두부보쌈: { matchedName: "서소문순두부보쌈", address: "서울특별시 광진구 동일로 128", latitude: 37.5436769, longitude: 127.0651039 },
  돕감자탕: { matchedName: "돕감자탕전문점", address: "서울특별시 광진구 아차산로31길 9", latitude: 37.5414896, longitude: 127.0692665 },
  포크포크: { matchedName: "포크포크 건대점", address: "서울특별시 광진구 동일로22길 117-16 1층", latitude: 37.5413126, longitude: 127.0708958 },
  김창훈포차: { matchedName: "김창훈포차", address: "서울특별시 광진구 아차산로31길 27 지하 김창훈포차", latitude: 37.5422067, longitude: 127.0697234 },
  시홍쓰: { matchedName: "시홍쓰", address: "서울특별시 광진구 능동로17길 5 1층", latitude: 37.5461217, longitude: 127.0729933 },
  송화산시도삭면: { matchedName: "송화산시도삭면", address: "서울특별시 광진구 뚝섬로27길 48", latitude: 37.537895, longitude: 127.0664981 },
  빠오즈푸: { matchedName: "빠오즈푸 본점", address: "서울특별시 광진구 광나루로 373", latitude: 37.5480935, longitude: 127.0715598 },
  매운향솥: { matchedName: "매운향솥", address: "서울특별시 광진구 동일로18길 61 1층", latitude: 37.5391111, longitude: 127.0662637 },
  송화양꼬치: { matchedName: "송화양꼬치", address: "서울특별시 광진구 동일로18길 70", latitude: 37.5388206, longitude: 127.0665993 },
  "638DENO탄탄면": { matchedName: "638DENO탄탄면", address: "서울특별시 광진구 능동로13길 81-1 1층", latitude: 37.5452351, longitude: 127.0686744 },
  브네: { matchedName: "브네", address: "서울특별시 광진구 군자로 70 106호 VENEZ 브네", latitude: 37.5489039, longitude: 127.0710627 },
  오코노미야키식당하나: { matchedName: "오코노미야키식당하나", address: "서울특별시 광진구 능동로13길 111 1층", latitude: 37.5462587, longitude: 127.0677047 },
  멘쇼: { matchedName: "멘쇼", address: "서울특별시 광진구 군자로2길 3", latitude: 37.5444084, longitude: 127.0717001 },
  우마텐텐동: { matchedName: "우마텐 텐동", address: "서울특별시 성동구 동일로 143 성수1차 대우아파트 1층 126호", latitude: 37.5454507, longitude: 127.0652057 },
  호야초밥참치: { matchedName: "호야초밥참치 본점", address: "서울특별시 광진구 능동로13길 39 1층", latitude: 37.5434686, longitude: 127.0701571 },
  초라멘: { matchedName: "초라멘", address: "서울특별시 광진구 능동로13길 80 1층", latitude: 37.5451927, longitude: 127.0688595 },
  슈퍼슬라이더: { matchedName: "수퍼슬라이더스", address: "서울특별시 광진구 능동로13길 50 1층 수퍼슬라이더스", latitude: 37.5440698, longitude: 127.0698905 },
  호파스타: { matchedName: "호파스타 생면파스타 건대본점", address: "서울특별시 광진구 군자로3길 23 1층 호파스타", latitude: 37.5442689, longitude: 127.0701674 },
  미분당: { matchedName: "미분당 건대점", address: "서울특별시 광진구 군자로3길 27 1층", latitude: 37.5442223, longitude: 127.0700617 },
  꾸아: { matchedName: "꾸아 성수본점", address: "서울특별시 성동구 왕십리로 94-2 2층", latitude: 37.5461264, longitude: 127.0449212 },
  보난자: { matchedName: "보난자커피 군자", address: "서울특별시 광진구 능동로 239-1 B동 1층 보난자커피", latitude: 37.5516342, longitude: 127.0763031 },
  꼬메노: { matchedName: "꼬메노", address: "서울특별시 광진구 군자로7길 29 1층 카페꼬메노", latitude: 37.5456057, longitude: 127.0691037 },
  최가회관: { matchedName: "최가커피회관", address: "서울특별시 광진구 능동로13길 30 지층", latitude: 37.5434026, longitude: 127.0706141 },
  오몬자: { matchedName: "오몬자", address: "서울 성동구 연무장길 31-1 상가동 3층 301호", latitude: 37.54423235905416, longitude: 127.05477944742798 },
};

const kakaoCheckedAt = "2026-06-30";
const kakaoPlaceData = {
  "해남닭집": {
    "matchedName": "해남닭집",
    "kakaoPlaceId": "11499383",
    "address": "서울 광진구 능동로13길 46 1층",
    "lotAddress": "화양동 12-40",
    "latitude": 37.54398311546965,
    "longitude": 127.06999831351119,
    "kakaoMapLink": "https://place.map.kakao.com/11499383",
    "rating": 4,
    "ratingCount": 44,
    "reviewCount": 117,
    "menuItems": [
      {
        "name": "후라이드치킨",
        "price": 18000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-10-10 23:41:25"
      },
      {
        "name": "양념치킨",
        "price": 19000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-10-10 22:40:22"
      },
      {
        "name": "반반치킨",
        "price": 19000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-10-10 23:24:22"
      }
    ],
    "menuUpdatedAt": "2024-03-04 17:35:49",
    "priceRange": "18,000-19,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100654_9151652_20260402020715_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/3e3c82937bbc4310402affe4c4833dce061fed79?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "정면": {
    "matchedName": "정면",
    "kakaoPlaceId": "2103908554",
    "address": "서울 광진구 능동로13길 88 1층",
    "lotAddress": "화양동 32-17",
    "latitude": 37.545486746718964,
    "longitude": 127.06869613606028,
    "kakaoMapLink": "https://place.map.kakao.com/2103908554",
    "rating": 4.6,
    "ratingCount": 206,
    "reviewCount": 621,
    "menuItems": [
      {
        "name": "곁들임 냉제육(한정20접시)",
        "price": 11000,
        "desc": "향긋한 고수와 새콤달콤한 레몬소스가 어우러진 곁들임 냉제육",
        "isRecommended": true,
        "sourceUpdatedAt": "2025-06-11 01:40:23"
      },
      {
        "name": "백면",
        "price": 11000,
        "desc": "부드러운 돼지목살의 육향과 깔끔하고 깊은육수가 특징인 백면 ",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-01 22:48:02"
      },
      {
        "name": "홍면",
        "price": 11000,
        "desc": "깊은 맛 뒤에 느껴지는 매콤한 국물이 특징인 홍면 ",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-01 22:48:02"
      }
    ],
    "menuUpdatedAt": "2026-01-01 22:48:02",
    "priceRange": "11,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101234_9151652_20260402030255_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/75BAA5D0ECF640639A32857D97B0862D"
    ],
    "checkedAt": "2026-06-30"
  },
  "동대문곱창": {
    "matchedName": "동대문곱창",
    "kakaoPlaceId": "8256333",
    "address": "서울 광진구 뚝섬로27길 37 1층",
    "lotAddress": "자양동 845-10",
    "latitude": 37.5375054148691,
    "longitude": 127.06602308871672,
    "kakaoMapLink": "https://place.map.kakao.com/8256333",
    "rating": 3.5,
    "ratingCount": 48,
    "reviewCount": 330,
    "menuItems": [
      {
        "name": "곱창",
        "price": 13000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-10 10:24:19"
      },
      {
        "name": "오돌뼈",
        "price": 13000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-10 10:24:19"
      },
      {
        "name": "치즈곱창",
        "price": 16000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-10 10:24:19"
      }
    ],
    "menuUpdatedAt": "2026-06-10 10:24:19",
    "priceRange": "13,000-16,000원",
    "priceSymbol": "₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_102437_9151652_20260402064706_cube/front_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/9B9F91293C6B45E59D1E55F4569868BE",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/1789e14361ca2e5d043e3c22341e84827b42f5d4?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "원조숯불소금구이": {
    "matchedName": "원조숯불소금구이",
    "kakaoPlaceId": "10692259",
    "address": "서울 광진구 광나루로12길 19 1층",
    "lotAddress": "화양동 20-25",
    "latitude": 37.54665865094554,
    "longitude": 127.0676470862037,
    "kakaoMapLink": "https://place.map.kakao.com/10692259",
    "rating": 4,
    "ratingCount": 24,
    "reviewCount": 59,
    "menuItems": [
      {
        "name": "돼지치맛살(150g)",
        "price": 18000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-05 00:34:57"
      },
      {
        "name": "갈매기살(160g)",
        "price": 17000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-05 07:19:42"
      },
      {
        "name": "한우등심채끝(180g)",
        "price": 45000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-05 05:43:50"
      }
    ],
    "menuUpdatedAt": "2025-09-05 07:19:42",
    "priceRange": "17,000-45,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101288_9151652_20260402030956_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/bda39851541ab0be8153cd061734cd9848ff3856?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "서북면옥": {
    "matchedName": "서북면옥",
    "kakaoPlaceId": "7939102",
    "address": "서울 광진구 자양로 199-1 1층",
    "lotAddress": "구의동 80-47",
    "latitude": 37.54539660029566,
    "longitude": 127.08534387836036,
    "kakaoMapLink": "https://place.map.kakao.com/7939102",
    "rating": 3.6,
    "ratingCount": 385,
    "reviewCount": 697,
    "menuItems": [
      {
        "name": "비빔냉면",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-29 17:00:44"
      },
      {
        "name": "물냉면",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-29 17:00:44"
      },
      {
        "name": "만두국",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-29 17:00:44"
      }
    ],
    "menuUpdatedAt": "2026-02-26 22:56:32",
    "priceRange": "12,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148283/2_102876_9148283_20250709034135_cube/left_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/DE9B8F1BF97742A5A562B023DF3095E1",
      "http://t1.kakaocdn.net/mystore/F483A537E43E4A819ABB6DFA012B636F"
    ],
    "checkedAt": "2026-06-30"
  },
  "은혜즉석떡볶이": {
    "matchedName": "은혜즉석떡볶이",
    "kakaoPlaceId": "11354357",
    "address": "서울 광진구 광나루로 381-1 2층",
    "lotAddress": "군자동 361-25",
    "latitude": 37.54813712067502,
    "longitude": 127.07232428784693,
    "kakaoMapLink": "https://place.map.kakao.com/11354357",
    "rating": 3.1,
    "ratingCount": 120,
    "reviewCount": 384,
    "menuItems": [
      {
        "name": "떡2인분세트 1",
        "price": 15000,
        "desc": "라면+오뎅+계란2+만두2",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-29 13:20:08"
      },
      {
        "name": "떡 2인분세트 2",
        "price": 15000,
        "desc": "쫄면+오뎅+계란2+만두2",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-29 13:20:08"
      },
      {
        "name": "떡 3인분세트 1",
        "price": 20000,
        "desc": "라면+오뎅+계란3+만두3",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-29 13:20:08"
      }
    ],
    "menuUpdatedAt": "2026-01-29 13:20:08",
    "priceRange": "15,000-20,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148341/2_100160_9148341_20250711001526_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/d885d1330a6f0b958a233f4701e8e088055122b0?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "깍둑": {
    "matchedName": "깍뚝",
    "kakaoPlaceId": "24944745",
    "address": "서울 광진구 능동로19길 36 1층",
    "lotAddress": "화양동 111-161",
    "latitude": 37.54745266328354,
    "longitude": 127.07183024350354,
    "kakaoMapLink": "https://place.map.kakao.com/24944745",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 117,
    "menuItems": [
      {
        "name": "숙성 삼겹살 한판 (600g)",
        "price": 25900,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2025-10-27 14:35:11"
      },
      {
        "name": "숙성 목살 한판 (600g)",
        "price": 25900,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2022-12-08 17:59:07"
      },
      {
        "name": "숙성 삼겹살 반판 (300g)",
        "price": 15900,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-12-08 17:59:07"
      }
    ],
    "menuUpdatedAt": "2025-10-27 14:35:11",
    "priceRange": "15,900-25,900원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100527_9151652_20260402015805_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/63D7A26B0A9A4F13B025602788723811"
    ],
    "checkedAt": "2026-06-30"
  },
  "김해평화뒷고기": {
    "matchedName": "평화김해뒷고기 건대본점",
    "kakaoPlaceId": "269850048",
    "address": "서울 광진구 아차산로31길 9-1 1층",
    "lotAddress": "화양동 9-19",
    "latitude": 37.54155079230561,
    "longitude": 127.06936238644813,
    "kakaoMapLink": "https://place.map.kakao.com/269850048",
    "rating": 4,
    "ratingCount": 57,
    "reviewCount": 70,
    "menuItems": [
      {
        "name": "치즈김치볶음밥",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-24 00:04:19"
      },
      {
        "name": "평화뒷고기(1인분)",
        "price": 7000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-10-15 00:18:00"
      },
      {
        "name": "평화껍데기(1인분)",
        "price": 6500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-23 23:40:27"
      }
    ],
    "menuUpdatedAt": "2026-02-24 00:04:19",
    "priceRange": "6,500-8,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101087_9151652_20260402025127_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/2b1053f64e80c5fffcc4149dc5540d57fe1ba4ec?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "아찌떡볶이": {
    "matchedName": "아찌떡볶이",
    "kakaoPlaceId": "19238595",
    "address": "서울 광진구 아차산로29길 53 1층",
    "lotAddress": "화양동 34-5",
    "latitude": 37.54323038182346,
    "longitude": 127.0691466851365,
    "kakaoMapLink": "https://place.map.kakao.com/19238595",
    "rating": 3.3,
    "ratingCount": 149,
    "reviewCount": 306,
    "menuItems": [
      {
        "name": "친구세트",
        "price": 12000,
        "desc": "(떡볶이+튀김+찹쌀순대)",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-10-31 10:42:12"
      },
      {
        "name": "패밀리세트",
        "price": 18000,
        "desc": "(떡볶이2인분+튀김+찹쌀순대+부산어묵)",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-10-31 10:42:12"
      },
      {
        "name": "떡볶이",
        "price": 4000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-10-31 10:42:12"
      }
    ],
    "menuUpdatedAt": "2026-06-16 13:33:33",
    "priceRange": "4,000-18,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100906_9151652_20260402022721_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/05daf7df4889ca3ed2fff35cb3de4af9a4ff8150?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "환이네갈비살": {
    "matchedName": "환이네갈비살 본점",
    "kakaoPlaceId": "461883111",
    "address": "서울 광진구 아차산로29길 24 1층",
    "lotAddress": "화양동 9-36",
    "latitude": 37.541911596669685,
    "longitude": 127.06867022510825,
    "kakaoMapLink": "https://place.map.kakao.com/461883111",
    "rating": 4,
    "ratingCount": 44,
    "reviewCount": 146,
    "menuItems": [
      {
        "name": "소갈비살(120g)(미국산)",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-17 10:54:08"
      },
      {
        "name": "차돌박이(120g)(호주산)",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-17 10:54:08"
      },
      {
        "name": "육회비빔냉면",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-17 10:54:08"
      }
    ],
    "menuUpdatedAt": "2026-06-17 10:54:08",
    "priceRange": "10,000-15,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100921_9151652_20260402022826_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/e948e7e6d36467c1152ee9f23bb1fc927e690df4?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "방이샤브칼국수": {
    "matchedName": "방이샤브샤브칼국수 건대점",
    "kakaoPlaceId": "20495977",
    "address": "서울 광진구 동일로20길 100 1층",
    "lotAddress": "자양동 5-10",
    "latitude": 37.53975987077375,
    "longitude": 127.0689081289244,
    "kakaoMapLink": "https://place.map.kakao.com/20495977",
    "rating": 3.4,
    "ratingCount": 29,
    "reviewCount": 73,
    "menuItems": [
      {
        "name": "샤브샤브세트메뉴 (1인분)",
        "price": 15000,
        "desc": "야채+칼국수+볶음밥+고기/2인이상주문",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-19 22:01:03"
      },
      {
        "name": "전주비빔밥",
        "price": 9000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-19 22:01:03"
      },
      {
        "name": "돌솥비빔밥",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-19 22:01:03"
      }
    ],
    "menuUpdatedAt": "2026-01-19 22:01:03",
    "priceRange": "9,000-15,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_102764_9151652_20260402072232_cube/right_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/1E76A85E565A4A62A38BB5D854176B4A"
    ],
    "checkedAt": "2026-06-30"
  },
  "김밥천국 건대2호점": {
    "matchedName": "김밥천국 건대2호점",
    "kakaoPlaceId": "2141404953",
    "address": "서울 광진구 능동로13길 21 1층",
    "lotAddress": "화양동 11-30",
    "latitude": 37.542969969452315,
    "longitude": 127.07070797636088,
    "kakaoMapLink": "https://place.map.kakao.com/2141404953",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 24,
    "menuItems": [
      {
        "name": "열무비빔국수",
        "price": null,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-06-26 02:10:41"
      },
      {
        "name": "등심돈비냉",
        "price": null,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-06-25 13:08:13"
      },
      {
        "name": "열무국수",
        "price": null,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-06-26 00:10:01"
      }
    ],
    "menuUpdatedAt": "2025-06-26 02:10:41",
    "priceRange": "₩₩",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100642_9151652_20260402020653_cube/right_800.jpg",
      "https://blog.kakaocdn.net/dn/cbnB93/dJMcadWNKRN/JW8rMChhpdUN1nrp5sPCWk/img.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "최신족발": {
    "matchedName": "최신족발 건대직영점",
    "kakaoPlaceId": "19409834",
    "address": "서울 광진구 아차산로29길 63 1층",
    "lotAddress": "화양동 34-3",
    "latitude": 37.54360506459849,
    "longitude": 127.06937334205425,
    "kakaoMapLink": "https://place.map.kakao.com/19409834",
    "rating": 3.6,
    "ratingCount": 36,
    "reviewCount": 56,
    "menuItems": [
      {
        "name": "반반족발 (대)(앞발 3~4인분)",
        "price": 45000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-04-10 15:23:58"
      },
      {
        "name": "숯불양념족발 (대) (앞발 3~4인분)",
        "price": 43000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-07-25 20:40:33"
      },
      {
        "name": "숯불양념족발 (중) (앞발 2~3인분)",
        "price": 37000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-04-10 15:23:58"
      }
    ],
    "menuUpdatedAt": "2023-09-19 20:34:31",
    "priceRange": "37,000-45,000원",
    "priceSymbol": "₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100901_9151652_20260402022702_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/7fc58657c8783786d8ad67d8be5f7c38e2de26d4?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "서소문순두부보쌈": {
    "matchedName": "서소문순두부보쌈",
    "kakaoPlaceId": "13290722",
    "address": "서울 광진구 동일로 128 재향군인회관 1층",
    "lotAddress": "화양동 42-29",
    "latitude": 37.54369036190835,
    "longitude": 127.06515045545035,
    "kakaoMapLink": "https://place.map.kakao.com/13290722",
    "rating": 3.5,
    "ratingCount": 27,
    "reviewCount": 73,
    "menuItems": [
      {
        "name": "스페셜보쌈",
        "price": 100000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-21 23:23:53"
      },
      {
        "name": "낙지보쌈",
        "price": 65000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-21 23:54:08"
      },
      {
        "name": "굴보쌈",
        "price": 65000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-21 11:55:33"
      }
    ],
    "menuUpdatedAt": "2026-01-22 00:15:57",
    "priceRange": "65,000-100,000원",
    "priceSymbol": "₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101941_9151652_20260402054658_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/4ceb63eabd9e5129a691b189a2380b495abe07b9?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "돕감자탕": {
    "matchedName": "돕",
    "kakaoPlaceId": "7834861",
    "address": "서울 광진구 아차산로31길 9 1층",
    "lotAddress": "화양동 9-22",
    "latitude": 37.54147876816737,
    "longitude": 127.06926727186031,
    "kakaoMapLink": "https://place.map.kakao.com/7834861",
    "rating": 3.1,
    "ratingCount": 98,
    "reviewCount": 143,
    "menuItems": [
      {
        "name": "통문어 해물감자탕 (중)",
        "price": 49000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-25 18:45:03"
      },
      {
        "name": "감자탕 (대)",
        "price": 40000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-08-02 13:13:42"
      },
      {
        "name": "감자탕 (소)",
        "price": 28000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-08-02 13:13:42"
      }
    ],
    "menuUpdatedAt": "2026-06-26 14:32:46",
    "priceRange": "28,000-49,000원",
    "priceSymbol": "₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101086_9151652_20260402025124_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/8c4a1d3b156779cf4ca754fd66cd9a53b11ff566?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "포크포크": {
    "matchedName": "포크포크 본점",
    "kakaoPlaceId": "26874320",
    "address": "서울 광진구 동일로22길 117-16 1층",
    "lotAddress": "화양동 5-95",
    "latitude": 37.54131922804073,
    "longitude": 127.07089198667795,
    "kakaoMapLink": "https://place.map.kakao.com/26874320",
    "rating": 4.2,
    "ratingCount": 83,
    "reviewCount": 105,
    "menuItems": [
      {
        "name": "매콤돈까스",
        "price": 9500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-04-24 08:46:03"
      },
      {
        "name": "칡물냉면",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-04-24 08:46:03"
      },
      {
        "name": "칡비빔냉면",
        "price": 8500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-04-24 08:46:03"
      }
    ],
    "menuUpdatedAt": "2025-04-24 23:10:23",
    "priceRange": "8,000-9,500원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101053_9151652_20260402024350_cube/back_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/054956021182f09821e6f894e676a6f2dc4b6490?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "김창훈포차": {
    "matchedName": "김창훈포차 육지점",
    "kakaoPlaceId": "2086408454",
    "address": "서울 광진구 아차산로31길 27 지하층",
    "lotAddress": "화양동 9-76",
    "latitude": 37.54219930372981,
    "longitude": 127.06971602556149,
    "kakaoMapLink": "https://place.map.kakao.com/2086408454",
    "rating": 3.4,
    "ratingCount": 9,
    "reviewCount": 630,
    "menuItems": [
      {
        "name": "즉석떡볶이",
        "price": 7900,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-01-08 10:57:10"
      },
      {
        "name": "고기탕수육",
        "price": 6900,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-01-08 10:57:10"
      },
      {
        "name": "컵라면볶음밥",
        "price": 6000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-01-08 10:57:10"
      }
    ],
    "menuUpdatedAt": "2025-01-08 22:38:10",
    "priceRange": "6,000-7,900원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101095_9151652_20260402025148_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/84621282BB4B44ABB7A44BD166F57F11"
    ],
    "checkedAt": "2026-06-30"
  },
  "시홍쓰": {
    "matchedName": "시홍쓰",
    "kakaoPlaceId": "1736699136",
    "address": "서울 광진구 능동로17길 5 1층",
    "lotAddress": "화양동 94-1",
    "latitude": 37.54608602258155,
    "longitude": 127.07301484039233,
    "kakaoMapLink": "https://place.map.kakao.com/1736699136",
    "rating": 4.5,
    "ratingCount": 161,
    "reviewCount": 253,
    "menuItems": [
      {
        "name": "토마토계란 덮밥",
        "price": 9500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-12 14:32:36"
      },
      {
        "name": "마파가지튀김",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-11-13 14:27:25"
      },
      {
        "name": "마파두부밥",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-10-04 15:04:11"
      }
    ],
    "menuUpdatedAt": "2025-09-12 14:32:36",
    "priceRange": "9,500-12,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100779_9151652_20260402021657_cube/right_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/855E6FA5173E48F19495DE5A9E810AD5"
    ],
    "checkedAt": "2026-06-30"
  },
  "송화산시도삭면": {
    "matchedName": "송화산시도삭면 본점",
    "kakaoPlaceId": "1467670437",
    "address": "서울 광진구 뚝섬로27길 48 1층",
    "lotAddress": "자양동 851-20",
    "latitude": 37.53789076082872,
    "longitude": 127.06652580026014,
    "kakaoMapLink": "https://place.map.kakao.com/1467670437",
    "rating": 4.1,
    "ratingCount": 483,
    "reviewCount": 611,
    "menuItems": [
      {
        "name": "도삭면",
        "price": 9000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-02-27 23:42:44"
      },
      {
        "name": "쇼룽포오(6p)",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-02-27 15:37:16"
      },
      {
        "name": "쇼마이(5p)",
        "price": 9000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-02-27 23:11:37"
      }
    ],
    "menuUpdatedAt": "2025-09-12 14:32:37",
    "priceRange": "8,000-9,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2013/05/1007845/2_100082_1007845_20130426014321_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/5db761952b7bbce3f627a6e3b2f85b6a66f6b2f3?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "빠오즈푸": {
    "matchedName": "빠오즈푸",
    "kakaoPlaceId": "15101449",
    "address": "서울 광진구 광나루로 373 1층",
    "lotAddress": "군자동 361-32",
    "latitude": 37.548097972994974,
    "longitude": 127.07150948201458,
    "kakaoMapLink": "https://place.map.kakao.com/15101449",
    "rating": 3.9,
    "ratingCount": 193,
    "reviewCount": 297,
    "menuItems": [
      {
        "name": "새우지짐만두 (9개)",
        "price": 9000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-11-17 14:23:03"
      },
      {
        "name": "고기_빠오즈 (8개)",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-11-17 14:23:03"
      },
      {
        "name": "매운 훈둔면",
        "price": 8500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-11-17 14:23:03"
      }
    ],
    "menuUpdatedAt": "2026-06-26 15:30:20",
    "priceRange": "8,000-9,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101704_9151652_20260402050600_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/457F5A5E546344DA80A793AF02EBC395"
    ],
    "checkedAt": "2026-06-30"
  },
  "매운향솥": {
    "matchedName": "매운향솥",
    "kakaoPlaceId": "19983662",
    "address": "서울 광진구 동일로18길 61 1층",
    "lotAddress": "자양동 9-33",
    "latitude": 37.53914149590237,
    "longitude": 127.06626440648117,
    "kakaoMapLink": "https://place.map.kakao.com/19983662",
    "rating": 4.2,
    "ratingCount": 546,
    "reviewCount": 309,
    "menuItems": [
      {
        "name": "마라샹궈 (100g)",
        "price": 3000,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2022-11-12 03:15:23"
      },
      {
        "name": "마라탕 (100g)",
        "price": 3000,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2022-11-12 05:17:07"
      },
      {
        "name": "크림새우",
        "price": 11000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-11-13 00:29:03"
      }
    ],
    "menuUpdatedAt": "2022-11-13 00:29:03",
    "priceRange": "3,000-11,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_102099_9151652_20260402061709_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/B7DC34AF308846AFA65AFE84D614A7B7"
    ],
    "checkedAt": "2026-06-30"
  },
  "송화양꼬치": {
    "matchedName": "송화양꼬치",
    "kakaoPlaceId": "14822911",
    "address": "서울 광진구 동일로18길 70 1층",
    "lotAddress": "자양동 11-2",
    "latitude": 37.5387773215343,
    "longitude": 127.06656732122401,
    "kakaoMapLink": "https://place.map.kakao.com/14822911",
    "rating": 4.2,
    "ratingCount": 133,
    "reviewCount": 302,
    "menuItems": [
      {
        "name": "꿔바로우",
        "price": 18000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-04-23 01:05:11"
      },
      {
        "name": "가지튀김",
        "price": 16000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-11 16:29:41"
      },
      {
        "name": "어향가지",
        "price": 16000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-11 16:29:41"
      }
    ],
    "menuUpdatedAt": "2026-06-23 17:40:59",
    "priceRange": "16,000-18,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_102103_9151652_20260402061716_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/2e0149d6659b08b070de0427aec5eac18cc28924?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "638DENO탄탄면": {
    "matchedName": "638데노탄탄면",
    "kakaoPlaceId": "906824475",
    "address": "서울 광진구 능동로13길 81-1 1층",
    "lotAddress": "화양동 33-21",
    "latitude": 37.54521647874289,
    "longitude": 127.06864157227828,
    "kakaoMapLink": "https://place.map.kakao.com/906824475",
    "rating": 4.7,
    "ratingCount": 137,
    "reviewCount": 48,
    "menuItems": [
      {
        "name": "나고야풍 마제멘",
        "price": 9000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-24 15:48:13"
      },
      {
        "name": "탄탄멘(시루나시)",
        "price": 9000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-05-18 18:08:33"
      },
      {
        "name": "라멘 나가사키",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-24 15:48:13"
      }
    ],
    "menuUpdatedAt": "2026-06-04 17:03:01",
    "priceRange": "9,000-10,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101236_9151652_20260402030332_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/d4aa2759b26646cb8cccc32fda5271a39168fd34?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "브네": {
    "matchedName": "오다 브네",
    "kakaoPlaceId": "807472188",
    "address": "서울 광진구 군자로 70 나동 1층 106호",
    "lotAddress": "군자동 362-1",
    "latitude": 37.548912889866344,
    "longitude": 127.07082222671009,
    "kakaoMapLink": "https://place.map.kakao.com/807472188",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 128,
    "menuItems": [
      {
        "name": "가츠산도(목살)",
        "price": 16000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-12-13 10:47:09"
      },
      {
        "name": "상로스카츠정식(특등심한정)",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-12-13 10:47:09"
      },
      {
        "name": "가지튀김",
        "price": 14000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-12-13 10:47:09"
      }
    ],
    "menuUpdatedAt": "2024-12-16 10:34:36",
    "priceRange": "14,000-16,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148334/2_101226_9148334_20250710031925_cube/left_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/5501EA00133F4FF4BC8230059040FBD3"
    ],
    "checkedAt": "2026-07-06"
  },
  "오코노미야키식당하나": {
    "matchedName": "오코노미야키식당하나",
    "kakaoPlaceId": "1441425449",
    "address": "서울 광진구 능동로13길 111 1층",
    "lotAddress": "화양동 31-4",
    "latitude": 37.546218930005004,
    "longitude": 127.06770553173196,
    "kakaoMapLink": "https://place.map.kakao.com/1441425449",
    "rating": 4.6,
    "ratingCount": 284,
    "reviewCount": 363,
    "menuItems": [
      {
        "name": "돼지오징어타마",
        "price": 15000,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2025-12-31 00:19:02"
      },
      {
        "name": "시오소바",
        "price": 14500,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2025-12-31 00:19:02"
      },
      {
        "name": "돈페이야키",
        "price": 7500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-12-31 00:19:02"
      }
    ],
    "menuUpdatedAt": "2025-12-31 00:19:02",
    "priceRange": "7,500-15,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100687_9151652_20260402020827_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/CA84C687839240D599CD356A9EA85C60"
    ],
    "checkedAt": "2026-06-30"
  },
  "멘쇼": {
    "matchedName": "멘쇼",
    "kakaoPlaceId": "1990556306",
    "address": "서울 광진구 군자로2길 3",
    "lotAddress": "화양동 1-10",
    "latitude": 37.544418188717515,
    "longitude": 127.0716824914236,
    "kakaoMapLink": "https://place.map.kakao.com/1990556306",
    "rating": 4.3,
    "ratingCount": 164,
    "reviewCount": 215,
    "menuItems": [
      {
        "name": "매운맛츠케멘(R)",
        "price": 11000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-30 00:24:57"
      },
      {
        "name": "츠케멘(R)",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-29 17:20:56"
      },
      {
        "name": "츠케멘(L)",
        "price": 11000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-29 17:20:56"
      }
    ],
    "menuUpdatedAt": "2026-04-30 00:24:57",
    "priceRange": "10,000-11,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100853_9151652_20260402022310_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/16401af7d19ba00e9a44af30b9198b8702c84638?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "우마텐텐동": {
    "matchedName": "우마텐 텐동",
    "kakaoPlaceId": "1165080047",
    "address": "서울 성동구 동일로 143 성수대우1차 아파트 1층 126호",
    "lotAddress": "성수동2가 279-50",
    "latitude": 37.545427382410985,
    "longitude": 127.06534207285083,
    "kakaoMapLink": "https://place.map.kakao.com/1165080047",
    "rating": 3.3,
    "ratingCount": 89,
    "reviewCount": 157,
    "menuItems": [
      {
        "name": "우마텐동",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-02-28 23:10:09"
      },
      {
        "name": "에비텐동",
        "price": 13000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-02-28 23:26:50"
      },
      {
        "name": "스페셜텐동",
        "price": 17000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-02-28 23:04:14"
      }
    ],
    "menuUpdatedAt": "2024-03-14 16:31:27",
    "priceRange": "10,000-17,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151653/2_100074_9151653_20260402052953_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/104DB14E3C864C289C307DF3C76FBD5A"
    ],
    "checkedAt": "2026-06-30"
  },
  "호야초밥참치": {
    "matchedName": "호야초밥참치 본점",
    "kakaoPlaceId": "11989881",
    "address": "서울 광진구 능동로13길 39 한아름건물 1층",
    "lotAddress": "화양동 10-1",
    "latitude": 37.543453279873276,
    "longitude": 127.07007928988185,
    "kakaoMapLink": "https://place.map.kakao.com/11989881",
    "rating": 2.9,
    "ratingCount": 284,
    "reviewCount": 747,
    "menuItems": [
      {
        "name": "참다랑어",
        "price": 43000,
        "desc": "턱살,뱃살,등살,속살",
        "isRecommended": false,
        "sourceUpdatedAt": "2021-04-15 12:08:23"
      },
      {
        "name": "대뱃살",
        "price": 44000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-08-29 14:48:33"
      },
      {
        "name": "오도로배꼽 (12PCS)",
        "price": 45000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2019-08-07 09:01:05"
      }
    ],
    "menuUpdatedAt": "2023-11-22 15:33:34",
    "priceRange": "43,000-45,000원",
    "priceSymbol": "₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100649_9151652_20260402020707_cube/right_800.jpg",
      "https://thumb.kakaocdn.net/dna/kamp/source/rv069p5mo0ek4080j1juujsks/thumbs/1.jpg?credential=TuMuFGKUIcirOSjFzOpncbomGFEIdZWK&expires=33338513122&kamp_tidx=0&signature=2guLAhPo9Gz9VdO8k5dkK8ruy%2Bc%3D&ts=1781604322",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/f0771687cdc89a39078ad0ad44f13e117014b517?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "초라멘": {
    "matchedName": "초라멘",
    "kakaoPlaceId": "1477555417",
    "address": "서울 광진구 능동로13길 80 1층",
    "lotAddress": "화양동 16-28",
    "latitude": 37.54516587784888,
    "longitude": 127.06889047302755,
    "kakaoMapLink": "https://place.map.kakao.com/1477555417",
    "rating": 4.6,
    "ratingCount": 250,
    "reviewCount": 161,
    "menuItems": [
      {
        "name": "마제멘",
        "price": 10500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-23 14:53:02"
      },
      {
        "name": "토리파이탄",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-23 14:53:02"
      },
      {
        "name": "카라파이탄",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-23 14:53:02"
      }
    ],
    "menuUpdatedAt": "2026-06-23 14:53:02",
    "priceRange": "10,000-10,500원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100671_9151652_20260402020749_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/67536bae5be28675a9f75b0b862be966fbd1237c?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "슈퍼슬라이더": {
    "matchedName": "수퍼슬라이더스",
    "kakaoPlaceId": "1093085311",
    "address": "서울 광진구 능동로13길 50 1층 1호",
    "lotAddress": "화양동 12-41",
    "latitude": 37.54409128090282,
    "longitude": 127.06992146844901,
    "kakaoMapLink": "https://place.map.kakao.com/1093085311",
    "rating": 4.7,
    "ratingCount": 102,
    "reviewCount": 223,
    "menuItems": [
      {
        "name": "부바검프쉬림프",
        "price": 4300,
        "desc": "슬라이더2개 8,200원, 슬라이더3개 12,000원, 슬라이더4개 15,800원",
        "isRecommended": false,
        "sourceUpdatedAt": "2024-03-19 09:27:01"
      },
      {
        "name": "버드맨",
        "price": 4300,
        "desc": "슬라이더2개 8,200원, 슬라이더3개 12,000원, 슬라이더4개 15,800원",
        "isRecommended": false,
        "sourceUpdatedAt": "2024-03-19 09:27:01"
      },
      {
        "name": "모던타임즈",
        "price": 8600,
        "desc": "세트 12,100원",
        "isRecommended": false,
        "sourceUpdatedAt": "2024-03-19 09:27:01"
      }
    ],
    "menuUpdatedAt": "2024-04-30 20:34:46",
    "priceRange": "4,300-8,600원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100656_9151652_20260402020720_cube/left_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/BE6FFA1D89FA4601834416646DA09660",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/3594dd3f1b6086abb1bc6e8050ce10128d098730?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "호파스타": {
    "matchedName": "호파스타 생면파스타건대본점HO PASTA",
    "kakaoPlaceId": "841786170",
    "address": "서울 광진구 군자로3길 23",
    "lotAddress": "화양동 12-52",
    "latitude": 37.54425329685715,
    "longitude": 127.07019772141224,
    "kakaoMapLink": "https://place.map.kakao.com/841786170",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 14,
    "menuItems": [
      {
        "name": "생면 파스타",
        "price": null
      }
    ],
    "menuUpdatedAt": null,
    "priceRange": "₩₩",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2013/03/1008010/2_100262_1008010_20130315034747_cube/left_800.jpg",
      "https://postfiles.pstatic.net/MjAyNjAxMThfMjA4/MDAxNzY4NzE2NTI0MjEw.sJJG-UJG6t4JD8KN8_BsYnbHKZ2w1EoF0KLl6RkMs_Yg.v-yPyA_cHT_vw1qivREVR1JZTgVsmF7gE5lxYc241xEg.JPEG/SE-0c2e8b18-8a05-4c1e-80e8-a51450da8599.jpg?type=w966"
    ],
    "checkedAt": "2026-06-30"
  },
  "미분당": {
    "matchedName": "미분당 건대점",
    "kakaoPlaceId": "27487909",
    "address": "서울 광진구 군자로3길 27 1층",
    "lotAddress": "화양동 12-42",
    "latitude": 37.5441849123411,
    "longitude": 127.07004376471083,
    "kakaoMapLink": "https://place.map.kakao.com/27487909",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 90,
    "menuItems": [
      {
        "name": "차돌양지힘줄 쌀국수",
        "price": 12000,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2025-05-24 01:01:02"
      },
      {
        "name": "양지쌀국수",
        "price": 11000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-23 23:44:59"
      },
      {
        "name": "차돌박이 쌀국수",
        "price": 9500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-24 00:42:11"
      }
    ],
    "menuUpdatedAt": "2026-03-20 18:38:45",
    "priceRange": "9,500-12,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100892_9151652_20260402022628_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/12BDCCD188C54EDDB0FA2D988EF4EDD4"
    ],
    "checkedAt": "2026-06-30"
  },
  "꾸아": {
    "matchedName": "꾸아 서울숲역점",
    "kakaoPlaceId": "2021790703",
    "address": "서울 성동구 왕십리로 94-2 2층",
    "lotAddress": "성수동1가 661-2",
    "latitude": 37.546121678234,
    "longitude": 127.044915171904,
    "kakaoMapLink": "https://place.map.kakao.com/2021790703",
    "rating": 3.7,
    "ratingCount": 23,
    "reviewCount": 209,
    "menuItems": [
      {
        "name": "반세오",
        "price": 28000,
        "desc": "한국에서 유일하게 제대로된 반세오를 만드는 곳, 다낭 호이안 오리지날 레시피!",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-03-10 07:39:40"
      },
      {
        "name": "분짜",
        "price": 18000,
        "desc": "베트남현지 조리방식에 최상급비장탄으로 구워낸 숯불분짜, 흐엉리엔 스타일",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-03-10 07:39:40"
      },
      {
        "name": "오리지널하노이직화쌀국수",
        "price": 11500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-03-11 11:33:13"
      }
    ],
    "menuUpdatedAt": "2026-03-11 11:33:13",
    "priceRange": "11,500-28,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148512/2_103210_9148512_20250721041752_cube/left_800.jpg",
      "https://blog.kakaocdn.net/dn/nfSuW/dJMcaiDwp8I/PUQaPJcIzp1PowhIHhk6Uk/img.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "보난자": {
    "matchedName": "보난자커피 군자점",
    "kakaoPlaceId": "1928816021",
    "address": "서울 광진구 능동로 239-1 B동 1층",
    "lotAddress": "군자동 270",
    "latitude": 37.55164136690014,
    "longitude": 127.0762025318072,
    "kakaoMapLink": "https://place.map.kakao.com/1928816021",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 511,
    "menuItems": [
      {
        "name": "프랍",
        "price": 7500,
        "desc": "군자점에서만 맛볼 수 있는 에스프레소와 아이스크림이 블렌딩되어 부드럽게 마시는 달콤한 커피 쉐이크",
        "isRecommended": true,
        "sourceUpdatedAt": "2023-09-13 18:41:05"
      },
      {
        "name": "서울라떼",
        "price": 6500,
        "desc": "우유와 크림을 블렌딩하여 기분좋은 단맛과 고소한 늬양스가 특징적인 라떼",
        "isRecommended": false,
        "sourceUpdatedAt": "2023-09-13 18:41:05"
      },
      {
        "name": "아메리카노",
        "price": 5300,
        "desc": "독일의 스페셜티 커피 브랜드 Bonanza의 시그니처 블랜드를 사용하여 단맛과 산미의 밸러스가 좋은 블랙커피",
        "isRecommended": false,
        "sourceUpdatedAt": "2023-09-13 17:40:06"
      }
    ],
    "menuUpdatedAt": "2023-09-14 00:00:45",
    "priceRange": "5,300-7,500원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148357/2_101152_9148357_20250705010641_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/1B92D313A149475EB227600334F3B82E"
    ],
    "checkedAt": "2026-06-30"
  },
  "꼬메노": {
    "matchedName": "꼬메노",
    "kakaoPlaceId": "15954181",
    "address": "서울 광진구 군자로7길 29 1층",
    "lotAddress": "화양동 16-24",
    "latitude": 37.545583814214446,
    "longitude": 127.06910812179872,
    "kakaoMapLink": "https://place.map.kakao.com/15954181",
    "rating": 4.7,
    "ratingCount": 123,
    "reviewCount": 107,
    "menuItems": [
      {
        "name": "꼬메노커피(ICE)",
        "price": 6000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-11 12:32:08"
      },
      {
        "name": "퐁당오쇼콜라",
        "price": 6500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-17 15:36:42"
      },
      {
        "name": "티라미수",
        "price": 6500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-05 02:00:57"
      }
    ],
    "menuUpdatedAt": "2026-06-29 17:47:36",
    "priceRange": "6,000-6,500원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_101230_9151652_20260402030243_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/7661c90532291286205d8e388799a5b595bbee30?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "최가회관": {
    "matchedName": "최가회관",
    "kakaoPlaceId": "1540990560",
    "address": "서울 광진구 능동로13길 30 지하1층",
    "lotAddress": "화양동 12-34",
    "latitude": 37.543366463110196,
    "longitude": 127.07061782676277,
    "kakaoMapLink": "https://place.map.kakao.com/1540990560",
    "rating": 4.3,
    "ratingCount": 56,
    "reviewCount": 69,
    "menuItems": [
      {
        "name": "유자파운드케이크 + 유자소스",
        "price": 7000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-17 14:48:43"
      },
      {
        "name": "다크초코무스",
        "price": 7000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-03-16 11:31:51"
      },
      {
        "name": "호두당근케이크",
        "price": 6500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-03-16 22:59:51"
      }
    ],
    "menuUpdatedAt": "2026-06-17 14:48:43",
    "priceRange": "6,500-7,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151652/2_100646_9151652_20260402020701_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/a4ac5343d0eba75a94e8621cd5e42f6f77b42855?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "잠수교집": {
    "matchedName": "잠수교집 성수점",
    "kakaoPlaceId": "475641876",
    "address": "서울 성동구 아차산로 137 1층",
    "lotAddress": "성수동2가 277-156",
    "latitude": 37.54381598619771,
    "longitude": 127.05928909657804,
    "kakaoMapLink": "https://place.map.kakao.com/475641876",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 455,
    "menuItems": [
      {
        "name": "급랭 삼겹살(1인분)",
        "price": 16000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-15 13:47:27"
      },
      {
        "name": "생삼겹살(1인분)",
        "price": 18000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-15 13:47:27"
      },
      {
        "name": "시골청국장",
        "price": 9500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-15 13:47:27"
      }
    ],
    "menuUpdatedAt": "2026-06-30 17:00:44",
    "priceRange": "9,500-18,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100187_9151598_20260402234226_cube/left_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/29BC06F19A744966937A85940137A43F"
    ],
    "checkedAt": "2026-06-30"
  },
  "꿉당": {
    "matchedName": "꿉당 성수점",
    "kakaoPlaceId": "239928138",
    "address": "서울 성동구 성수이로20길 10 1층",
    "lotAddress": "성수동2가 273-24",
    "latitude": 37.54324377096504,
    "longitude": 127.05763205578747,
    "kakaoMapLink": "https://place.map.kakao.com/239928138",
    "rating": 3.9,
    "ratingCount": 189,
    "reviewCount": 484,
    "menuItems": [
      {
        "name": "KOKUMI 목살(180g)",
        "price": 19000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-10-17 07:20:41"
      },
      {
        "name": "꿉살(150g)",
        "price": 20000,
        "desc": "테이블당2인분 한정",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-24 14:27:43"
      },
      {
        "name": "삼겹살(180g)",
        "price": 20000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-24 14:27:43"
      }
    ],
    "menuUpdatedAt": "2026-04-24 14:27:43",
    "priceRange": "19,000-20,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101584_9151598_20260403012203_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/ed8b28406397dfee6f3c5ae5fea366ce60c319c5?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "땅코참숯구이": {
    "matchedName": "땅코참숯구이 본점",
    "kakaoPlaceId": "487116221",
    "address": "서울 성동구 행당로17길 26 1층",
    "lotAddress": "행당동 292-34",
    "latitude": 37.5606857384056,
    "longitude": 127.03299007959369,
    "kakaoMapLink": "https://place.map.kakao.com/487116221",
    "rating": 4,
    "ratingCount": 339,
    "reviewCount": 659,
    "menuItems": [
      {
        "name": "목살 (200g)",
        "price": 20000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-12-07 13:28:02"
      },
      {
        "name": "삼겹살 (200g)",
        "price": 20000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-12-07 13:28:02"
      },
      {
        "name": "전투라면",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-12-29 23:00:00"
      }
    ],
    "menuUpdatedAt": "2025-12-29 23:29:54",
    "priceRange": "8,000-20,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148469/2_103398_9148469_20250723044047_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/AA7D7D1136A84A2784D42313F9C247B5"
    ],
    "checkedAt": "2026-06-30"
  },
  "성수동양갈비": {
    "matchedName": "성수동양갈비",
    "kakaoPlaceId": "1774035310",
    "address": "서울 성동구 성수일로12길 33 1층",
    "lotAddress": "성수동2가 299-234",
    "latitude": 37.54770334137667,
    "longitude": 127.05462991598964,
    "kakaoMapLink": "https://place.map.kakao.com/1774035310",
    "rating": 4.6,
    "ratingCount": 38,
    "reviewCount": 29,
    "menuItems": [
      {
        "name": "양갈비 (250g)",
        "price": 28000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-22 08:13:11"
      },
      {
        "name": "돼지갈비 (280g)",
        "price": 20000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-07-28 22:53:17"
      },
      {
        "name": "양곰탕",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-07-28 22:53:17"
      }
    ],
    "menuUpdatedAt": "2025-07-29 22:44:30",
    "priceRange": "10,000-28,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102307_9148454_20250722051040_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/d9b0748f226ceffff601a748cdd13ce88a129b48?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "능동미나리": {
    "matchedName": "능동미나리 성수점",
    "kakaoPlaceId": "134670855",
    "address": "서울 성동구 연무장길 42 1층",
    "lotAddress": "성수동2가 310-14",
    "latitude": 37.542758970024174,
    "longitude": 127.05395190924062,
    "kakaoMapLink": "https://place.map.kakao.com/134670855",
    "rating": 4,
    "ratingCount": 301,
    "reviewCount": 1503,
    "menuItems": [
      {
        "name": "능동미나리곰탕",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-03-25 17:25:17"
      },
      {
        "name": "능동육회비빔밥",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-01 23:18:18"
      },
      {
        "name": "능동곰탕",
        "price": 14000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-05-28 13:55:10"
      }
    ],
    "menuUpdatedAt": "2026-06-01 23:18:18",
    "priceRange": "14,000-15,000원",
    "priceSymbol": "₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101185_9151598_20260403004203_cube/left_800.jpg",
      "https://thumb.kakaocdn.net/dna/kamp/source/rv45nupqps3xaku38cfr0przc/thumbs/1.jpg?credential=TuMuFGKUIcirOSjFzOpncbomGFEIdZWK&expires=33326943960&kamp_tidx=0&signature=EfsLmz1y4wkuCszUXIJ4UJMyAQc%3D&ts=1770035160",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/cad066cdc7416906a1cd95eb7f8257f7fb09d083?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "금금": {
    "matchedName": "금금",
    "kakaoPlaceId": "282713203",
    "address": "서울 성동구 성수이로12길 11 1층 101호",
    "lotAddress": "성수동2가 269-115",
    "latitude": 37.53982765242884,
    "longitude": 127.05665633866963,
    "kakaoMapLink": "https://place.map.kakao.com/282713203",
    "rating": 3.9,
    "ratingCount": 158,
    "reviewCount": 204,
    "menuItems": [
      {
        "name": "보리된장고기국수",
        "price": 13500,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2024-03-27 10:51:14"
      },
      {
        "name": "들기름통밀국수",
        "price": 9500,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2024-03-27 10:51:14"
      },
      {
        "name": "문어간장비빔밥",
        "price": 13000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-03-27 10:51:14"
      }
    ],
    "menuUpdatedAt": "2026-06-30 16:13:52",
    "priceRange": "9,500-13,500원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101552_9151598_20260403011057_cube/left_800.jpg",
      "http://t1.daumcdn.net/place/5542B886E8F1415782FCE37A40D6A665",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/21a6b4b807c4524bc7761fe35f611d30cfc99d19?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "돼지공탕하우": {
    "matchedName": "돼지공탕 하우 성수점",
    "kakaoPlaceId": "1159905218",
    "address": "서울 성동구 아차산로7길 36 1층 2호",
    "lotAddress": "성수동2가 289-39",
    "latitude": 37.548420039143075,
    "longitude": 127.05569416860772,
    "kakaoMapLink": "https://place.map.kakao.com/1159905218",
    "rating": 4.4,
    "ratingCount": 36,
    "reviewCount": 352,
    "menuItems": [
      {
        "name": "하우 곰탕(보통)",
        "price": 12000,
        "desc": "엄선된 문경 약돌 돼지를 저온, 고압에서 천천히 우려낸 국물에 육수에 특제 오일을 더한 맑은 돼지 곰탕입니다. 하우만 깊은 맛을 곰탕 한그릇에 오롯이 담았습니다.",
        "isRecommended": true,
        "sourceUpdatedAt": "2025-07-31 16:24:45"
      },
      {
        "name": "하우 냉면",
        "price": 14000,
        "desc": "문경 약돌 돼지를 저온, 고압에서 진하게 우려낸 풍미 깊은 육수에 구수한 메밀면을 더한 평양식 물냉면을 선보입니다. 마지막에 같이 공깃밥을 말아드시는게 별미.",
        "isRecommended": true,
        "sourceUpdatedAt": "2025-07-31 16:24:45"
      },
      {
        "name": "하우 곰탕(특)",
        "price": 15000,
        "desc": "엄선된 문경 약돌 돼지를 저온, 고압에서 천천히 우려낸 국물에 육수에 특제 오일을 더한 맑은 돼지 곰탕입니다. 하우만 깊은 맛을 곰탕 한그릇에 오롯이 담았습니다.",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-07-31 23:35:06"
      }
    ],
    "menuUpdatedAt": "2025-07-31 23:53:11",
    "priceRange": "12,000-15,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102834_9148454_20250722054409_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/91DFD8BCAF4249239B16EEE1A078E124"
    ],
    "checkedAt": "2026-06-30"
  },
  "실비옥": {
    "matchedName": "실비옥",
    "kakaoPlaceId": "1907528700",
    "address": "서울 성동구 아차산로 126",
    "lotAddress": "성수동2가 273-52",
    "latitude": 37.54349944850003,
    "longitude": 127.05805319024685,
    "kakaoMapLink": "https://place.map.kakao.com/1907528700",
    "rating": 3.9,
    "ratingCount": 16,
    "reviewCount": 228,
    "menuItems": [
      {
        "name": "소고기미역수제비전골",
        "price": 12900,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-22 09:43:26"
      },
      {
        "name": "오징어미나리전",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-22 23:20:46"
      },
      {
        "name": "오징어미나리수제비전골",
        "price": 13900,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-22 09:43:26"
      }
    ],
    "menuUpdatedAt": "2026-05-19 12:35:39",
    "priceRange": "12,900-15,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100476_9151598_20260402235954_cube/left_800.jpg",
      "https://postfiles.pstatic.net/MjAyNjA2MDlfNjcg/MDAxNzgwOTcxMjIzMjIy.i2ta0veNZ-XBsUFkIgiN2ttd_iM0mDmT3ntWwpnOFx4g.xvgjhsKq3096wBeKOEj8iCqnumeojqwg8u_NeAYsWw4g.JPEG/SE-BCE6F32C-99EA-491E-952F-E19304D07CD2.jpg?type=w773"
    ],
    "checkedAt": "2026-06-30"
  },
  "조조칼국수": {
    "matchedName": "조조칼국수 성수점",
    "kakaoPlaceId": "1143126185",
    "address": "서울 성동구 성수일로8길 55 1층",
    "lotAddress": "성수동2가 289-257",
    "latitude": 37.54523363664487,
    "longitude": 127.05668306123671,
    "kakaoMapLink": "https://place.map.kakao.com/1143126185",
    "rating": 4.3,
    "ratingCount": 177,
    "reviewCount": 1649,
    "menuItems": [
      {
        "name": "동죽칼국수",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-03 17:01:29"
      },
      {
        "name": "낙지해물파전",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-03 17:01:29"
      },
      {
        "name": "물총조개탕",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-03 17:01:29"
      }
    ],
    "menuUpdatedAt": "2025-09-03 17:01:29",
    "priceRange": "10,000-15,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_103323_9148454_20250722063658_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/fc3519b5e8f4655501a199e9b61943d0775b4e2e?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "칼": {
    "matchedName": "칼",
    "kakaoPlaceId": "1563080666",
    "address": "서울 성동구 성수이로 126 1층",
    "lotAddress": "성수동2가 277-20",
    "latitude": 37.54620617768321,
    "longitude": 127.05779275946557,
    "kakaoMapLink": "https://place.map.kakao.com/1563080666",
    "rating": 4,
    "ratingCount": 27,
    "reviewCount": 186,
    "menuItems": [
      {
        "name": "부추수제비",
        "price": 11000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-11 08:48:12"
      },
      {
        "name": "바지락칼국수",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-11 08:48:12"
      },
      {
        "name": "녹두전(한접시)",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-11 23:20:32"
      }
    ],
    "menuUpdatedAt": "2026-02-12 11:31:41",
    "priceRange": "10,000-11,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102773_9148454_20250722054051_cube/right_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/D2C771823B5A42928999C2F8DF0716D6"
    ],
    "checkedAt": "2026-06-30"
  },
  "르프리크": {
    "matchedName": "르프리크",
    "kakaoPlaceId": "936069123",
    "address": "서울 성동구 연무장5길 9-16 B103호",
    "lotAddress": "성수동2가 302-8",
    "latitude": 37.544439016637995,
    "longitude": 127.05265860726594,
    "kakaoMapLink": "https://place.map.kakao.com/936069123",
    "rating": 4.3,
    "ratingCount": 524,
    "reviewCount": 726,
    "menuItems": [
      {
        "name": "SIGNATURE",
        "price": 12800,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-05-02 15:59:54"
      },
      {
        "name": "CHAT POTATO",
        "price": 7300,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-10-02 10:47:23"
      },
      {
        "name": "EGGPLANT",
        "price": 7800,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-10-02 10:47:23"
      }
    ],
    "menuUpdatedAt": "2025-10-02 10:47:23",
    "priceRange": "7,300-12,800원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100810_9151598_20260403001841_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/DFE065E50ED64CE9843870C1720E0542"
    ],
    "checkedAt": "2026-06-30"
  },
  "bd버거": {
    "matchedName": "비디버거 성수",
    "kakaoPlaceId": "1724006766",
    "address": "서울 성동구 성수이로14길 7 2층",
    "lotAddress": "성수동2가 322-20",
    "latitude": 37.54106033026674,
    "longitude": 127.05642644215017,
    "kakaoMapLink": "https://place.map.kakao.com/1724006766",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 1088,
    "menuItems": [
      {
        "name": "[SIGNATURE] bd WASABI SHRIMP",
        "price": 11400,
        "desc": "[SIGNATURE] 부드러워진 와사비 소스와 새우, 청겨자의 조화로 더욱 새로워진 bd시그니처 수제버거. 와사비 새우 버거.",
        "isRecommended": true,
        "sourceUpdatedAt": "2025-11-22 12:50:02"
      },
      {
        "name": "[BEST] DOUBLE CHEESE BURGER",
        "price": 12400,
        "desc": "[BEST] 두툼한 식감의 더블 치즈&패티와 육즙 가득한 비프 버거",
        "isRecommended": true,
        "sourceUpdatedAt": "2025-11-22 12:50:02"
      },
      {
        "name": "[BEST] 버터갈릭 감자튀김",
        "price": 6900,
        "desc": "[BEST] 갈릭향이 가득한 버터소스가 꾸덕하게 얹어진 짭쪼롬한 감자튀김",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-02-01 22:03:10"
      }
    ],
    "menuUpdatedAt": "2025-11-22 12:50:02",
    "priceRange": "6,900-12,400원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101610_9151598_20260403012314_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/7194FAA523864DC085A5B429592DA0E9"
    ],
    "checkedAt": "2026-06-30"
  },
  "롸카두들": {
    "matchedName": "롸카두들 내쉬빌 핫치킨 성수점",
    "kakaoPlaceId": "87489103",
    "address": "서울 성동구 성수일로4길 25 서울숲코오롱디지털타워 상가 1층 108호",
    "lotAddress": "성수동2가 308-4",
    "latitude": 37.542255253699025,
    "longitude": 127.05207319978068,
    "kakaoMapLink": "https://place.map.kakao.com/87489103",
    "rating": 4.4,
    "ratingCount": 120,
    "reviewCount": 348,
    "menuItems": [
      {
        "name": "클래식",
        "price": 11800,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2023-10-11 20:56:11"
      },
      {
        "name": "포포",
        "price": 12800,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-15 17:25:15"
      },
      {
        "name": "그랜파",
        "price": 11500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-15 17:25:15"
      }
    ],
    "menuUpdatedAt": "2025-07-09 09:43:49",
    "priceRange": "11,500-12,800원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100728_9151598_20260403001254_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/9326C59F31EA471CA6BC7819487FB7A7"
    ],
    "checkedAt": "2026-06-30"
  },
  "핑거팁스": {
    "matchedName": "핑거팁스",
    "kakaoPlaceId": "1257457465",
    "address": "서울 성동구 광나루로2길 34-17 1층",
    "lotAddress": "성수동2가 299-231",
    "latitude": 37.54786550852177,
    "longitude": 127.05465719319054,
    "kakaoMapLink": "https://place.map.kakao.com/1257457465",
    "rating": 4.5,
    "ratingCount": 17,
    "reviewCount": 168,
    "menuItems": [
      {
        "name": "인덱스버거",
        "price": 9400,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-04 02:07:57"
      },
      {
        "name": "투썸즈버거",
        "price": 12400,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-18 11:33:23"
      },
      {
        "name": "핑키버거",
        "price": 10900,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-03 23:31:16"
      }
    ],
    "menuUpdatedAt": "2025-08-18 11:33:23",
    "priceRange": "9,400-12,400원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102999_9148454_20250722060142_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/1a9b0435f15557092468e5c2ee1ca8ba12d5203d?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "마하차이": {
    "matchedName": "마하차이",
    "kakaoPlaceId": "522438272",
    "address": "서울 성동구 뚝섬로 399 2층",
    "lotAddress": "성수동2가 339-22",
    "latitude": 37.53895262378738,
    "longitude": 127.05508517665906,
    "kakaoMapLink": "https://place.map.kakao.com/522438272",
    "rating": 4,
    "ratingCount": 128,
    "reviewCount": 261,
    "menuItems": [
      {
        "name": "오물렛팟타이",
        "price": 13000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-05-31 00:24:02"
      },
      {
        "name": "푸팟퐁커리덮밥",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-06-03 09:03:12"
      },
      {
        "name": "나시고랭",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-12-09 22:59:17"
      }
    ],
    "menuUpdatedAt": "2026-06-25 14:38:45",
    "priceRange": "12,000-15,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100085_9151598_20260402233311_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/0BCBE06FBECC4821805E4343CD7B558B"
    ],
    "checkedAt": "2026-06-30"
  },
  "벱": {
    "matchedName": "벱",
    "kakaoPlaceId": "1079903424",
    "address": "서울 성동구 성수일로4가길 2 1층",
    "lotAddress": "성수동2가 321-21",
    "latitude": 37.542063371714406,
    "longitude": 127.05401024761336,
    "kakaoMapLink": "https://place.map.kakao.com/1079903424",
    "rating": 4.1,
    "ratingCount": 266,
    "reviewCount": 474,
    "menuItems": [
      {
        "name": "해산물 볶음밥",
        "price": 13000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-21 07:30:19"
      },
      {
        "name": "짜조",
        "price": 5000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-21 07:30:19"
      },
      {
        "name": "양지&차돌박이 쌀국수",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-04-21 07:30:19"
      }
    ],
    "menuUpdatedAt": "2026-04-21 07:30:19",
    "priceRange": "5,000-13,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101072_9151598_20260403003420_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/c3c7dc48882d25cc225fc6d5b4bc5e013ef21852?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "남짐릇": {
    "matchedName": "남짐릇",
    "kakaoPlaceId": "913958943",
    "address": "서울 성동구 연무장5가길 32 지하1층",
    "lotAddress": "성수동2가 315-21",
    "latitude": 37.54306445370971,
    "longitude": 127.05579428666519,
    "kakaoMapLink": "https://place.map.kakao.com/913958943",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 461,
    "menuItems": [
      {
        "name": "카오카무",
        "price": 14000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-01-17 10:07:03"
      },
      {
        "name": "닭고기 쌀국수",
        "price": 11500,
        "desc": "닭다리 포함한 금액입니다.",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-01-17 10:07:03"
      }
    ],
    "menuUpdatedAt": "2025-01-17 10:07:03",
    "priceRange": "11,500-14,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100852_9151598_20260403002029_cube/left_800.jpg",
      "https://postfiles.pstatic.net/MjAyNjA2MjRfMTQy/MDAxNzgyMjc5ODAwNzY5.UzFTt3B6laIvbjPEUWykFK4GH9vP9Kc4SRXnEtvzZ64g.lbCYc3b28eMQel9sinPEw-04oiOf0FM9Qp7CEJq_GYEg.JPEG/IMG%EF%BC%BF9663.jpg?type=w966"
    ],
    "checkedAt": "2026-06-30"
  },
  "페이퍼플레이트": {
    "matchedName": "페이퍼플레이트",
    "kakaoPlaceId": "632570382",
    "address": "서울 성동구 성수이로14길 15 1층",
    "lotAddress": "성수동2가 322-21",
    "latitude": 37.54173775387809,
    "longitude": 127.05669399285443,
    "kakaoMapLink": "https://place.map.kakao.com/632570382",
    "rating": 4.6,
    "ratingCount": 140,
    "reviewCount": 353,
    "menuItems": [
      {
        "name": "CHEESE",
        "price": 6000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-06 08:13:02"
      },
      {
        "name": "PEPPERONI",
        "price": 7000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-06 08:13:02"
      },
      {
        "name": "MARGHERITA",
        "price": 7500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-06 08:13:02"
      }
    ],
    "menuUpdatedAt": "2026-01-06 08:13:02",
    "priceRange": "6,000-7,500원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101602_9151598_20260403012246_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/AE5C05A9FBC848628A0812D9E09B8686"
    ],
    "checkedAt": "2026-06-30"
  },
  "마리오네": {
    "matchedName": "마리오네",
    "kakaoPlaceId": "1590694902",
    "address": "서울 성동구 광나루로2길 23-1 1층",
    "lotAddress": "성수동2가 299-50",
    "latitude": 37.54892884318993,
    "longitude": 127.05431847915159,
    "kakaoMapLink": "https://place.map.kakao.com/1590694902",
    "rating": 4.3,
    "ratingCount": 313,
    "reviewCount": 747,
    "menuItems": [
      {
        "name": "가리발디",
        "price": 29000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-11-12 12:51:02"
      },
      {
        "name": "프로슈토 부팔라",
        "price": 32000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-03-12 17:54:03"
      },
      {
        "name": "보따르가",
        "price": 40000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-11-12 12:51:02"
      }
    ],
    "menuUpdatedAt": "2026-03-12 17:54:03",
    "priceRange": "29,000-40,000원",
    "priceSymbol": null,
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102982_9148454_20250722055950_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/94B69056429C4849861F3D06014FF930"
    ],
    "checkedAt": "2026-06-30"
  },
  "피읻짜": {
    "matchedName": "피읻짜",
    "kakaoPlaceId": "1117466948",
    "address": "서울 성동구 아차산로7길 11 2층",
    "lotAddress": "성수동2가 289-101",
    "latitude": 37.546236618167434,
    "longitude": 127.05440705315878,
    "kakaoMapLink": "https://place.map.kakao.com/1117466948",
    "rating": 4.4,
    "ratingCount": 49,
    "reviewCount": 145,
    "menuItems": [
      {
        "name": "마르게리따피자",
        "price": 19000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-02-29 17:56:14"
      },
      {
        "name": "살라미피자",
        "price": 20000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-02-29 17:56:14"
      },
      {
        "name": "화덕 먹태구이",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-02-29 17:56:14"
      }
    ],
    "menuUpdatedAt": "2025-08-22 15:43:14",
    "priceRange": "15,000-20,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102807_9148454_20250722054320_cube/right_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/5B2671852D82421FA5CD22F3B8D5A620"
    ],
    "checkedAt": "2026-06-30"
  },
  "코치": {
    "matchedName": "코치",
    "kakaoPlaceId": "1990658906",
    "address": "서울 성동구 성덕정17길 11 1층",
    "lotAddress": "성수동2가 565",
    "latitude": 37.538184936035016,
    "longitude": 127.05516155205558,
    "kakaoMapLink": "https://place.map.kakao.com/1990658906",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 1012,
    "menuItems": [
      {
        "name": "다리살대파",
        "price": 3800,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-11-12 13:08:24"
      },
      {
        "name": "염통",
        "price": 3000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-11-12 13:08:24"
      },
      {
        "name": "볏짚에 구운 통허벅지",
        "price": 4800,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-11-12 13:08:24"
      }
    ],
    "menuUpdatedAt": "2025-11-13 00:03:20",
    "priceRange": "3,000-4,800원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_100671_9148454_20250722010011_cube/right_800.jpg",
      "https://postfiles.pstatic.net/MjAyNjA2MTlfMjQy/MDAxNzgxODQyMTkxODEx.hvyZX6rnhPJO_hg7qXYH6yJ6fptCEDQ7ka0loHIIMGIg.ylbTmrHeyfWlG8rC9nAXJ6PsT1ngdT_xY6ye067EJHcg.JPEG/SE-FE0FC81D-F1D1-483D-874E-A9991770E1EE.jpg?type=w386"
    ],
    "checkedAt": "2026-06-30"
  },
  "가조쿠": {
    "matchedName": "가조쿠",
    "kakaoPlaceId": "1869562416",
    "address": "서울 성동구 연무장길 31-2 1층",
    "lotAddress": "성수동2가 316-77",
    "latitude": 37.543199043323405,
    "longitude": 127.05310130205304,
    "kakaoMapLink": "https://place.map.kakao.com/1869562416",
    "rating": 3.9,
    "ratingCount": 164,
    "reviewCount": 299,
    "menuItems": [
      {
        "name": "(따뜻한)에비텐소바",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-27 12:58:59"
      },
      {
        "name": "(따뜻한)니싱소바",
        "price": 18000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-27 12:58:59"
      },
      {
        "name": "(시원한)자루소바",
        "price": 11000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-27 12:58:59"
      }
    ],
    "menuUpdatedAt": "2025-09-06 23:29:43",
    "priceRange": "11,000-18,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101176_9151598_20260403004139_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/ad960e5528405db82b28e5dc3333acff40f1f10a?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "소바마에니고": {
    "matchedName": "소바마에니고",
    "kakaoPlaceId": "6928575",
    "address": "서울 성동구 연무장길 39-15 지층",
    "lotAddress": "성수동2가 316-40",
    "latitude": 37.54332481609053,
    "longitude": 127.05391158119325,
    "kakaoMapLink": "https://place.map.kakao.com/6928575",
    "rating": 2.8,
    "ratingCount": 65,
    "reviewCount": 295,
    "menuItems": [
      {
        "name": "카모세이로",
        "price": 21800,
        "desc": "따뜻한 국물에 오리고기가 들어가있고 냉소바를 적셔 먹는다.",
        "isRecommended": true,
        "sourceUpdatedAt": "2024-10-24 17:10:16"
      },
      {
        "name": "니싱소바",
        "price": 21800,
        "desc": "냉,온소바가 있다. 말린 청어를 달짝지근하게 조려 올라가있는 면이다. 소바마에의 시니쳐이기도하다.",
        "isRecommended": false,
        "sourceUpdatedAt": "2024-10-24 17:10:16"
      },
      {
        "name": "카케소바",
        "price": 13800,
        "desc": "냉,온소바가있다 가장 기본적인 소바로 씀씀한 국물에 야채4종이 토핑되어있다.",
        "isRecommended": false,
        "sourceUpdatedAt": "2024-10-24 17:10:16"
      }
    ],
    "menuUpdatedAt": "2025-07-03 20:33:35",
    "priceRange": "13,800-21,800원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100835_9151598_20260403001958_cube/left_800.jpg",
      "http://t1.kakaocdn.net/fiy_reboot/place/1F6BBEC78C7D47F9A0C8669B28626DA1"
    ],
    "checkedAt": "2026-06-30"
  },
  "탐광": {
    "matchedName": "탐광",
    "kakaoPlaceId": "1855191777",
    "address": "서울 성동구 연무장5가길 26 1층",
    "lotAddress": "성수동2가 315-24",
    "latitude": 37.54317275263071,
    "longitude": 127.05541416728498,
    "kakaoMapLink": "https://place.map.kakao.com/1855191777",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 1363,
    "menuItems": [
      {
        "name": "에비에비카츠동",
        "price": 17000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-01-08 13:04:05"
      },
      {
        "name": "뉴에비가츠동",
        "price": 14000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-09-12 17:08:13"
      },
      {
        "name": "대창소고기카레누들",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-09-12 17:08:13"
      }
    ],
    "menuUpdatedAt": "2024-10-08 14:35:42",
    "priceRange": "14,000-17,000원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100849_9151598_20260403002024_cube/left_800.jpg",
      "https://postfiles.pstatic.net/MjAyNjA2MjRfNTkg/MDAxNzgyMzA2MTAwNTkx.wq4CzEZ7Pg_77WJiyjLCcgOFNzFbfQmIoQBAmT6m9agg.Hwi394gL63bmS5Q-0fEG3E6tPtYhvfOcOcBOrMyY9jgg.JPEG/SE-4394E941-8D8B-451C-B321-28D2B56B2428.jpg?type=w773"
    ],
    "checkedAt": "2026-06-30"
  },
  "토리아에즈": {
    "matchedName": "토리아에즈 성수점",
    "kakaoPlaceId": "1461015420",
    "address": "서울 성동구 아차산로7길 7 1층",
    "lotAddress": "성수동2가 289-273",
    "latitude": 37.5460204201641,
    "longitude": 127.05431636875717,
    "kakaoMapLink": "https://place.map.kakao.com/1461015420",
    "rating": 4.5,
    "ratingCount": 32,
    "reviewCount": 69,
    "menuItems": [
      {
        "name": "명란구이",
        "price": 4900,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-01-29 01:48:12"
      },
      {
        "name": "계란구이",
        "price": 2800,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-05 13:46:10"
      },
      {
        "name": "레몬하이볼",
        "price": 6000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-06-05 13:46:10"
      }
    ],
    "menuUpdatedAt": "2026-06-06 00:06:21",
    "priceRange": "2,800-6,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102805_9148454_20250722054315_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/374BB4B99C8E44A190CEDC1E0AD4572B"
    ],
    "checkedAt": "2026-06-30"
  },
  "도죠": {
    "matchedName": "도죠",
    "kakaoPlaceId": "1318637977",
    "address": "서울 성동구 성수이로 126 A열 5호",
    "lotAddress": "성수동2가 277-20",
    "latitude": 37.54622407999898,
    "longitude": 127.05803267121173,
    "kakaoMapLink": "https://place.map.kakao.com/1318637977",
    "rating": 3.4,
    "ratingCount": 30,
    "reviewCount": 437,
    "menuItems": [
      {
        "name": "나가사끼 짬뽕",
        "price": 10500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-07-11 08:36:18"
      },
      {
        "name": "카라미소 라멘",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-07-11 08:36:18"
      },
      {
        "name": "탄탄멘",
        "price": 10000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-07-11 08:36:18"
      }
    ],
    "menuUpdatedAt": "2025-07-11 08:36:18",
    "priceRange": "10,000-10,500원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102341_9148454_20250722051209_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/e835087e22fd6a4fae40e5bc67cbb41d41f12c24?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "죠죠": {
    "matchedName": "죠죠 성수점",
    "kakaoPlaceId": "1103690927",
    "address": "서울 성동구 연무장17길 7 1층",
    "lotAddress": "성수동2가 272-1",
    "latitude": 37.54149413176378,
    "longitude": 127.06101622430816,
    "kakaoMapLink": "https://place.map.kakao.com/1103690927",
    "rating": 3.8,
    "ratingCount": 147,
    "reviewCount": 3396,
    "menuItems": [
      {
        "name": "명란 몬자야끼",
        "price": 19500,
        "desc": "명란과 모찌가 들어간 감칠맛 몬자야끼",
        "isRecommended": true,
        "sourceUpdatedAt": "2026-03-03 12:56:02"
      },
      {
        "name": "몬자야끼 2인",
        "price": 39500,
        "desc": "명란 몬자야끼 + 카라이 야끼소바 + 폭포테이토",
        "isRecommended": true,
        "sourceUpdatedAt": "2026-03-03 12:56:02"
      },
      {
        "name": "폭포테이토",
        "price": 7000,
        "desc": "죠죠의 인기 사이드 메뉴 포테이토매쉬 위 계란이 올라간 요리 🥚",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-11-06 15:24:02"
      }
    ],
    "menuUpdatedAt": "2026-03-03 12:56:02",
    "priceRange": "7,000-39,500원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101654_9151598_20260403012803_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/00C2670443314736B9AE718BB898B0A2"
    ],
    "checkedAt": "2026-06-30"
  },
  "성수속향연": {
    "matchedName": "성수속향연",
    "kakaoPlaceId": "1177409967",
    "address": "서울 성동구 성수이로 65 협성빌딩 1층 102호",
    "lotAddress": "성수동2가 309-148",
    "latitude": 37.540974297418785,
    "longitude": 127.05544874865501,
    "kakaoMapLink": "https://place.map.kakao.com/1177409967",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 427,
    "menuItems": [
      {
        "name": "향연 짜장면",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-02 09:17:45"
      },
      {
        "name": "향연 부추 해물 짬뽕",
        "price": 9500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-02 09:17:45"
      },
      {
        "name": "안심 탕수육 (소)",
        "price": 18000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-02 09:17:45"
      }
    ],
    "menuUpdatedAt": "2024-07-02 09:17:45",
    "priceRange": "8,000-18,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101017_9151598_20260403003100_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/FC796FFFA39A4F11B3C50B0B4902AD54"
    ],
    "checkedAt": "2026-06-30"
  },
  "중앙감속기": {
    "matchedName": "중앙감속기",
    "kakaoPlaceId": "138978252",
    "address": "서울 성동구 성수일로6길 7-1 1층",
    "lotAddress": "성수동2가 301-98",
    "latitude": 37.545574967144404,
    "longitude": 127.05108424107581,
    "kakaoMapLink": "https://place.map.kakao.com/138978252",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 917,
    "menuItems": [
      {
        "name": "바질 새우 춘권(4pcs)",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-11-20 11:58:05"
      },
      {
        "name": "차돌 마라 크림 짬뽕",
        "price": 19500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2022-02-16 13:26:07"
      },
      {
        "name": "어향부라타",
        "price": 19000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-11-20 11:58:05"
      }
    ],
    "menuUpdatedAt": "2023-11-20 11:58:05",
    "priceRange": "15,000-19,500원",
    "priceSymbol": "₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100542_9151598_20260403000153_cube/left_800.jpg",
      "https://postfiles.pstatic.net/MjAyNjA2MjhfOTMg/MDAxNzgyNjE0NDA4NTIy.HAFN109jl4b_2fm4thMeTkGjYHCJDZdM_SGMpXvXrFcg.ozlb6478CxYOIsTeQSJ94p5R7jaTk4oSR1skD0-KLLkg.JPEG/IMG%EF%BC%BF7033.jpg?type=w773"
    ],
    "checkedAt": "2026-06-30"
  },
  "영수분식": {
    "matchedName": "영수분식",
    "kakaoPlaceId": "21421301",
    "address": "서울 성동구 성덕정15길 2-12",
    "lotAddress": "성수동2가 335-149",
    "latitude": 37.537918800408924,
    "longitude": 127.05394842179088,
    "kakaoMapLink": "https://place.map.kakao.com/21421301",
    "rating": 4.1,
    "ratingCount": 48,
    "reviewCount": 205,
    "menuItems": [
      {
        "name": "숯불치즈곱창",
        "price": 15000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-02 10:05:24"
      },
      {
        "name": "날치알계란찜",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-02-02 10:05:24"
      },
      {
        "name": "숯불양념알곱창",
        "price": 13000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-10-20 11:50:21"
      }
    ],
    "menuUpdatedAt": "2026-02-12 21:32:28",
    "priceRange": "8,000-15,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148512/2_104627_9148512_20250721060249_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/ef2fdc350b25afb95973609e1e009034b234cfbe?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "소문난 성수 감자탕": {
    "matchedName": "소문난성수감자탕",
    "kakaoPlaceId": "13289056",
    "address": "서울 성동구 연무장길 45 1층",
    "lotAddress": "성수동2가 315-100",
    "latitude": 37.54283084229667,
    "longitude": 127.05440457812003,
    "kakaoMapLink": "https://place.map.kakao.com/13289056",
    "rating": 2.9,
    "ratingCount": 1104,
    "reviewCount": 2682,
    "menuItems": [
      {
        "name": "감자탕(대)",
        "price": 49000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-05 05:45:51"
      },
      {
        "name": "감자탕(중)",
        "price": 37000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-09-05 03:17:25"
      },
      {
        "name": "감자탕(소)",
        "price": 32000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-25 22:36:24"
      }
    ],
    "menuUpdatedAt": "2025-09-05 06:24:40",
    "priceRange": "32,000-49,000원",
    "priceSymbol": "₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100703_9151598_20260403001203_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/fd6ad7c86db810e2bd5a4f3e6679555824c361f7?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "성수 족발": {
    "matchedName": "성수족발",
    "kakaoPlaceId": "8416853",
    "address": "서울 성동구 아차산로7길 7 1층",
    "lotAddress": "성수동2가 289-273",
    "latitude": 37.54602762815355,
    "longitude": 127.05431637398702,
    "kakaoMapLink": "https://place.map.kakao.com/8416853",
    "rating": 3.3,
    "ratingCount": 301,
    "reviewCount": 559,
    "menuItems": [
      {
        "name": "족발 (대)",
        "price": 50000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-29 16:29:37"
      },
      {
        "name": "족발 (중)",
        "price": 45000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-29 16:29:37"
      },
      {
        "name": "족발 (특대)",
        "price": 55000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-29 16:29:37"
      }
    ],
    "menuUpdatedAt": "2025-08-29 16:29:37",
    "priceRange": "45,000-55,000원",
    "priceSymbol": "₩₩₩₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_102805_9148454_20250722054315_cube/right_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/7bde944768a195a2159adb513ae56b125ea3472f?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "높은산": {
    "matchedName": "높은산",
    "kakaoPlaceId": "1440389368",
    "address": "서울 성동구 성수이로 18-1 1층",
    "lotAddress": "성수동2가 535-2",
    "latitude": 37.536855531337025,
    "longitude": 127.05414226561115,
    "kakaoMapLink": "https://place.map.kakao.com/1440389368",
    "rating": 4.7,
    "ratingCount": 139,
    "reviewCount": 422,
    "menuItems": [
      {
        "name": "진저 짜이",
        "price": 4000,
        "desc": "생강, 카더멈",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-03-11 11:43:08"
      },
      {
        "name": "마살라 짜이",
        "price": 4500,
        "desc": "카더멈, 정향, 팔각, 시나몬",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-03-11 11:43:08"
      },
      {
        "name": "사프란 짜이",
        "price": 5000,
        "desc": "생강, 카더멈, 사프란",
        "isRecommended": false,
        "sourceUpdatedAt": "2025-03-11 11:43:08"
      }
    ],
    "menuUpdatedAt": "2025-03-15 21:05:17",
    "priceRange": "4,000-5,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_100380_9148454_20250722003545_cube/back_800.jpg",
      "http://t1.kakaocdn.net/mystore/D3DC54295480485784032765E1A33144"
    ],
    "checkedAt": "2026-06-30"
  },
  "밀스": {
    "matchedName": "밀스",
    "kakaoPlaceId": "1427326028",
    "address": "서울 성동구 뚝섬로4길 21 1,2층",
    "lotAddress": "성수동1가 275-6",
    "latitude": 37.538857235381684,
    "longitude": 127.05080357604334,
    "kakaoMapLink": "https://place.map.kakao.com/1427326028",
    "rating": null,
    "ratingCount": null,
    "reviewCount": 583,
    "menuItems": [
      {
        "name": "브락워스트 소시지번",
        "price": 5500,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2025-06-01 17:23:04"
      },
      {
        "name": "반 밀스 번",
        "price": 6500,
        "desc": null,
        "isRecommended": true,
        "sourceUpdatedAt": "2025-06-01 17:23:04"
      },
      {
        "name": "나폴리탄번",
        "price": 5000,
        "desc": "직접 만든 소시지와 나폴리탄 파스타, 치즈가 듬뿍 들어간 나폴리탄번 :) 베스트메뉴 중 하나 입니다 💙",
        "isRecommended": false,
        "sourceUpdatedAt": "2024-07-09 17:39:44"
      }
    ],
    "menuUpdatedAt": "2025-06-01 17:23:04",
    "priceRange": "5,000-6,500원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148512/2_104182_9148512_20250721052106_cube/left_800.jpg",
      "http://t1.kakaocdn.net/mystore/947D9FBD4DC84C648ED2DA94B0C10A65"
    ],
    "checkedAt": "2026-06-30"
  },
  "맥파이앤타이거": {
    "matchedName": "맥파이앤타이거 성수티룸",
    "kakaoPlaceId": "1492088819",
    "address": "서울 성동구 성수이로 97 5층",
    "lotAddress": "성수동2가 315-108",
    "latitude": 37.543647924190466,
    "longitude": 127.05658681002872,
    "kakaoMapLink": "https://place.map.kakao.com/1492088819",
    "rating": 4.7,
    "ratingCount": 106,
    "reviewCount": 761,
    "menuItems": [
      {
        "name": "쑥 티라미수",
        "price": 7000,
        "desc": "향긋하고 고소한 쑥의 향기와 부드럽고 진한 마스카포네 치즈의 향미가 가득한 쑥 티라미수",
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-13 23:22:34"
      },
      {
        "name": "Signature Tea",
        "price": 8000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2026-01-13 08:34:04"
      }
    ],
    "menuUpdatedAt": "2026-01-13 23:22:34",
    "priceRange": "7,000-8,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100489_9151598_20260403000023_cube/right_800.jpg",
      "http://t1.kakaocdn.net/mystore/973BF629355E4970826CD66F99AA1151"
    ],
    "checkedAt": "2026-06-30"
  },
  "커피로우스탠드": {
    "matchedName": "로우커피스탠드",
    "kakaoPlaceId": "940053669",
    "address": "서울 성동구 왕십리로4길 28-2 1층",
    "lotAddress": "성수동1가 8-16",
    "latitude": 37.54715896195635,
    "longitude": 127.04663583870042,
    "kakaoMapLink": "https://place.map.kakao.com/940053669",
    "rating": 4.5,
    "ratingCount": 203,
    "reviewCount": 184,
    "menuItems": [
      {
        "name": "AMERICANO",
        "price": 2500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-05 11:28:17"
      },
      {
        "name": "CAFE LATTE",
        "price": 3000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-05 11:28:17"
      },
      {
        "name": "CAPPUCCINO (HOT)",
        "price": 3000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-05-05 11:28:17"
      }
    ],
    "menuUpdatedAt": "2025-05-05 11:28:17",
    "priceRange": "2,500-3,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148512/2_104851_9148512_20250721062938_cube/right_800.jpg",
      "http://t1.daumcdn.net/place/F709A3EBCBF74BCA8408DEF7F0D8CC70",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/1dd657646cdfef82b408b9e2eed41de39848441c?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "스탠드업플리즈": {
    "matchedName": "스탠드업플리즈",
    "kakaoPlaceId": "151718461",
    "address": "서울 성동구 연무장3길 14 1층 2호",
    "lotAddress": "성수동2가 302-24",
    "latitude": 37.54476735863771,
    "longitude": 127.05180336978641,
    "kakaoMapLink": "https://place.map.kakao.com/151718461",
    "rating": 4.6,
    "ratingCount": 60,
    "reviewCount": 108,
    "menuItems": [
      {
        "name": "콘판나",
        "price": 2500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-25 10:28:10"
      },
      {
        "name": "마르소",
        "price": 3000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-25 10:28:10"
      },
      {
        "name": "빈센트",
        "price": 3000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2025-08-25 10:28:10"
      }
    ],
    "menuUpdatedAt": "2025-09-05 04:01:28",
    "priceRange": "2,500-3,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_100768_9151598_20260403001538_cube/right_800.jpg",
      "https://thumb.kakaocdn.net/dna/kamp/source/rvwlqis61gzmkklf1pmk7mto9/thumbs/1.jpg?credential=TuMuFGKUIcirOSjFzOpncbomGFEIdZWK&expires=33316904153&kamp_tidx=0&signature=BULi6qAh1kIazec6hlWIJfxvt94%3D&ts=1759995353",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/095f175c2ad23cd632aa2933d943e93c768bb974?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "자연도소금빵": {
    "matchedName": "자연도소금빵 in성수",
    "kakaoPlaceId": "134679676",
    "address": "서울 성동구 연무장길 56-1 1층",
    "lotAddress": "성수동2가 321-74",
    "latitude": 37.54230416818566,
    "longitude": 127.05545878580577,
    "kakaoMapLink": "https://place.map.kakao.com/134679676",
    "rating": 3.4,
    "ratingCount": 351,
    "reviewCount": 2946,
    "menuItems": [
      {
        "name": "소금빵4개",
        "price": 12000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2023-09-27 23:08:24"
      }
    ],
    "menuUpdatedAt": "2023-09-27 23:08:24",
    "priceRange": "12,000원",
    "priceSymbol": "₩₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101199_9151598_20260403004225_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/79167a9ac229dd757bdeb7ab34735da9d8294afe?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "차일디쉬": {
    "matchedName": "차일디쉬",
    "kakaoPlaceId": "2009228453",
    "address": "서울 성동구 연무장길 114 2층",
    "lotAddress": "성수동2가 275-12",
    "latitude": 37.540470295750424,
    "longitude": 127.06159472156686,
    "kakaoMapLink": "https://place.map.kakao.com/2009228453",
    "rating": 3.9,
    "ratingCount": 65,
    "reviewCount": 588,
    "menuItems": [
      {
        "name": "불장난크림커피",
        "price": 6800,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-09-12 10:38:17"
      },
      {
        "name": "아메리카노",
        "price": 4500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-09-12 10:38:17"
      },
      {
        "name": "에스프레소",
        "price": 3500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-09-12 10:38:17"
      }
    ],
    "menuUpdatedAt": "2024-09-19 17:37:46",
    "priceRange": "3,500-6,800원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2026/04/9151598/2_101256_9151598_20260403004524_cube/left_800.jpg",
      "http://t1.daumcdn.net/local/kakaomapPhoto/review/cd5cc9e1d7970e8ea4ee91f8e767b001096cdce6?original"
    ],
    "checkedAt": "2026-06-30"
  },
  "어니언": {
    "matchedName": "어니언 성수",
    "kakaoPlaceId": "145791269",
    "address": "서울 성동구 아차산로9길 8 1-2층",
    "lotAddress": "성수동2가 277-135",
    "latitude": 37.544782395189884,
    "longitude": 127.05820807890457,
    "kakaoMapLink": "https://place.map.kakao.com/145791269",
    "rating": 3.3,
    "ratingCount": 382,
    "reviewCount": 725,
    "menuItems": [
      {
        "name": "에스프레소(Espresso)",
        "price": 5000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-01-18 23:07:32"
      },
      {
        "name": "아메리카노(Americano)",
        "price": 5500,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-01-18 23:45:39"
      },
      {
        "name": "카페라떼(Cafe latte)",
        "price": 6000,
        "desc": null,
        "isRecommended": false,
        "sourceUpdatedAt": "2024-01-18 23:14:46"
      }
    ],
    "menuUpdatedAt": "2025-02-04 16:32:57",
    "priceRange": "5,000-6,000원",
    "priceSymbol": "₩",
    "images": [
      "https://map.kakaocdn.net/map_roadview/2025/07/9148454/2_103533_9148454_20250722070004_cube/front_800.jpg",
      "http://t1.kakaocdn.net/mystore/D759B82401654920ABB1E17978FCF06F"
    ],
    "checkedAt": "2026-06-30"
  }
};

const naverCheckedAt = "2026-06-30";
const naverPlaceData = {
  "해남닭집": {
    "matchedName": "해남닭집",
    "naverPlaceId": 20069127,
    "address": "서울특별시 광진구 능동로13길 46 1층",
    "lotAddress": "서울특별시 광진구 화양동 12-40 1층",
    "latitude": 37.5440075,
    "longitude": 127.0699822,
    "naverMapLink": "https://map.naver.com/p/entry/place/20069127",
    "rating": 4.53,
        "reviewCount": 786,
    "images": [
      "https://ldb-phinf.pstatic.net/20210706_97/1625499079756jhvh4_JPEG/qpNGt7N4Afth-YWQuMrXC5aY.jpg",
      "https://ldb-phinf.pstatic.net/20240915_272/1726376599613VJSh0_JPEG/919.jpg",
      "https://ldb-phinf.pstatic.net/20240915_29/17263768114084Cl7K_JPEG/923.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "정면": {
    "matchedName": "정면",
    "naverPlaceId": 1765453403,
    "address": "서울특별시 광진구 능동로13길 88 1층",
    "lotAddress": "서울특별시 광진구 화양동 32-17 1층",
    "latitude": 37.5454903,
    "longitude": 127.0687052,
    "naverMapLink": "https://map.naver.com/p/entry/place/1765453403",
    "rating": 4.86,
        "reviewCount": 2511,
    "images": [
      "https://ldb-phinf.pstatic.net/20250609_24/1749475964859TIBsr_JPEG/IMG_5841.jpeg",
      "https://ldb-phinf.pstatic.net/20250609_128/1749475972982ShVII_JPEG/IMG_5840.jpeg",
      "https://ldb-phinf.pstatic.net/20250609_270/1749476030427bbSF3_JPEG/IMG_5836.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "동대문곱창": {
    "matchedName": "동대문곱창",
    "naverPlaceId": 32090089,
    "address": "서울특별시 광진구 뚝섬로27길 37",
    "lotAddress": "서울특별시 광진구 자양동 845-10",
    "latitude": 37.5375275,
    "longitude": 127.0660391,
    "naverMapLink": "https://map.naver.com/p/entry/place/32090089",
    "rating": 4.66,
        "reviewCount": 731,
    "images": [
      "https://ldb-phinf.pstatic.net/20191222_96/1576987558273hHnDV_JPEG/k-uxhYyVwBggrb1eFAwi0lOh.jpg",
      "https://ldb-phinf.pstatic.net/20221020_189/1666261760281NqMjJ_JPEG/7DC078FB-4FCC-47B7-B8B8-353E4CB29A75.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "원조숯불소금구이": {
    "matchedName": "원조숯불소금구이",
    "naverPlaceId": 20844012,
    "address": "서울특별시 광진구 광나루로12길 19 1층",
    "lotAddress": "서울특별시 광진구 화양동 20-25 1층",
    "latitude": 37.546651,
    "longitude": 127.0676569,
    "naverMapLink": "https://map.naver.com/p/entry/place/20844012",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://pup-review-phinf.pstatic.net/MjAyNjAxMjlfMTk3/MDAxNzY5NjY3ODgzMTYw.lRZNjSPApD__d8A_rkECA2FXqZbjMwLuC-zvwFmDgfEg.httDRpTmy6yweY-H4bwAqZCcFivCfkAM3uVDOhN1nhQg.PNG/%C3%83%C2%AC%C3%82%C2%8B%C3%82%C2%AC%C3%83%C2%AC%C3%82%C2%9E%C3%82%C2%A5_%C3%83%C2%AC%C3%82%C2%8B%C3%82%C2%9C%C3%83%C2%AD%C3%82%C2%82%C3%82%C2%B4_%C3%83%C2%AC%C3%82%C2%A3%C3%82%C2%BC%C3%83%C2%AB%C3%82%C2%AC%C3%82%C2%B8_%C3%83%C2%AC%C3%82%C2%99%C3%82.png",
      "https://pup-review-phinf.pstatic.net/MjAyNTA4MTdfMTQx/MDAxNzU1NDIyMzk3Njgw.mDJkeHi1wywio5hT40hcR1D_FKNLbwBrLgcU4lZdaVcg.xAe5M-7trnHc3e1Fd-QWS_bCiprYm_xRdn79N9jlCp8g.JPEG/IMG_7063.jpeg",
      "https://ldb-phinf.pstatic.net/20250516_195/1747386896249mtp6t_JPEG/Resized_%C1%A6%B8%F1%C0%BB-%C0%D4%B7%C2%C7%D8%C1%D6%BC%BC%BF%E4_-001%284%29.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "서북면옥": {
    "matchedName": "서북면옥",
    "naverPlaceId": 11727906,
    "address": "서울특별시 광진구 자양로 199-1 서북면옥",
    "lotAddress": "서울특별시 광진구 구의동 80-47 서북면옥",
    "latitude": 37.5453748,
    "longitude": 127.0853467,
    "naverMapLink": "https://map.naver.com/p/entry/place/11727906",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250505_67/1746407573015dc6II_JPEG/IMG_4057.jpeg",
      "https://ldb-phinf.pstatic.net/20150831_137/1441030738247q5Ht8_JPEG/11727906_0.jpg",
      "https://ldb-phinf.pstatic.net/20150831_244/1441030738444nvPM1_JPEG/11727906_1.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "은혜즉석떡볶이": {
    "matchedName": "은혜즉석떡볶이",
    "naverPlaceId": 20912981,
    "address": "서울특별시 광진구 광나루로 381-1",
    "lotAddress": "서울특별시 광진구 군자동 361-25",
    "latitude": 37.5481087,
    "longitude": 127.0723468,
    "naverMapLink": "https://map.naver.com/p/entry/place/20912981",
    "rating": 4.35,
        "reviewCount": 2512,
    "images": [
      "https://ldb-phinf.pstatic.net/20251212_130/1765544907266AHJMx_JPEG/20251212_205046.jpg",
      "https://ldb-phinf.pstatic.net/20200221_221/1582270411176nMkbz_JPEG/JtMwiXXASzJSTuU7qP9Z_fdQ.jpeg.jpg",
      "https://ldb-phinf.pstatic.net/20220827_217/1661562992577Og7Lv_JPEG/Screenshot_20220826-100858_Samsung_Internet.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "깍둑": {
    "matchedName": "깍뚝",
    "naverPlaceId": 35357402,
    "address": "서울특별시 광진구 능동로19길 36 1층",
    "lotAddress": "서울특별시 광진구 화양동 111-161 1층",
    "latitude": 37.5473896,
    "longitude": 127.0718608,
    "naverMapLink": "https://map.naver.com/p/entry/place/35357402",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://pup-review-phinf.pstatic.net/MjAyNTA4MzFfNjkg/MDAxNzU2NjMwNzYyNjQ5.7ZKHY-1CONhXKf3FXlv97CrAnWcU_xuw3u63HsuSn98g.sLNbwAC3uLaPC1FAVJBAJwORxn-lc8MdsWeOp32OzwAg.JPEG/20250814_132648.jpg",
      "https://ldb-phinf.pstatic.net/20211117_186/1637085529774Us44S_JPEG/%B1%EF%B6%D2_%BB%EF%B0%E3%BB%EC_%C7%D1%C6%C7.jpg",
      "https://ldb-phinf.pstatic.net/20211117_83/1637085511159oRJ8o_JPEG/%B1%EF%B6%D2_%B8%F1%BB%EC_%C7%D1%C6%C7.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "김해평화뒷고기": {
    "matchedName": "평화김해뒷고기 건대점",
    "naverPlaceId": 1393442096,
    "address": "서울특별시 광진구 아차산로31길 9-1 1층",
    "lotAddress": "서울특별시 광진구 화양동 9-19 1층",
    "latitude": 37.5415604,
    "longitude": 127.0693913,
    "naverMapLink": "https://map.naver.com/p/entry/place/1393442096",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250729_222/1753777091797I3E6v_JPEG/%BD%A1%BA%D2%BE%E7%B3%E4%B5%DE%B0%ED%B1%E2_%C5%D7%C0%CC%BA%ED%BF%C0%B4%F5%BF%EB_%B8%DE%B4%BA%BB%E7%C1%F8.jpg",
      "https://ldb-phinf.pstatic.net/20250724_136/1753348081097b7OCU_JPEG/%B5%DE%B0%ED%B1%E2.jpg",
      "https://ldb-phinf.pstatic.net/20250724_201/1753348077092qCd3k_JPEG/%B5%DE%B0%ED%B1%E2_%B0%A3%C0%E5%BC%D2%BD%BA.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "아찌떡볶이": {
    "matchedName": "아찌떡볶이",
    "naverPlaceId": 13153060,
    "address": "서울특별시 광진구 아차산로29길 53",
    "lotAddress": "서울특별시 광진구 화양동 34-5",
    "latitude": 37.5432377,
    "longitude": 127.069197,
    "naverMapLink": "https://map.naver.com/p/entry/place/13153060",
    "rating": 3.5,
    "images": [
      "https://ldb-phinf.pstatic.net/20220209_210/1644366567782E6oYO_JPEG/IMG_9843.jpg",
      "https://ldb-phinf.pstatic.net/20220209_291/164436663873503GBV_JPEG/IMG_9839.jpg",
      "https://ldb-phinf.pstatic.net/20200523_165/1590234944142t9Fv4_JPEG/VBcd9owuN8aoTFNxUtAFHUiC.jpeg.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "환이네갈비살": {
    "matchedName": "환이네갈비살 본점",
    "naverPlaceId": 1436916083,
    "address": "서울특별시 광진구 아차산로29길 24 1층",
    "lotAddress": "서울특별시 광진구 화양동 9-36 1층",
    "latitude": 37.5419347,
    "longitude": 127.0686643,
    "naverMapLink": "https://map.naver.com/p/entry/place/1436916083",
    "rating": 4.4,
        "reviewCount": 1121,
    "images": [
      "https://ldb-phinf.pstatic.net/20201113_285/1605252606079IltjJ_JPEG/UVMygig5rxrHBlzXfaSiBA3q.JPG.jpg",
      "https://ldb-phinf.pstatic.net/20201113_6/1605252628675xRhbz_JPEG/-6_L_1Orfiv-TqPNWUPw36nR.JPG.jpg",
      "https://ldb-phinf.pstatic.net/20250504_279/1746331080836mhdYm_JPEG/20250502_170612.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "방이샤브칼국수": {
    "matchedName": "방이샤브샤브칼국수 건대점",
    "naverPlaceId": 17994062,
    "address": "서울특별시 광진구 동일로20길 100 1층",
    "lotAddress": "서울특별시 광진구 자양동 5-10 1층",
    "latitude": 37.5397827,
    "longitude": 127.0689155,
    "naverMapLink": "https://map.naver.com/p/entry/place/17994062",
    "rating": 4.39,
        "reviewCount": 1284,
    "images": [
      "https://ldb-phinf.pstatic.net/20260119_40/1768822807503IakBv_JPEG/image.jpg",
      "https://ldb-phinf.pstatic.net/20260119_292/1768822576475bK2c1_JPEG/image.jpg",
      "https://ldb-phinf.pstatic.net/20260119_77/1768822628113Jo3AG_JPEG/image.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "김밥천국 건대2호점": {
    "matchedName": "김밥천국 건대2호점",
    "naverPlaceId": 18834914,
    "address": "서울특별시 광진구 능동로13길 21 1층",
    "lotAddress": "서울특별시 광진구 화양동 11-30 1층",
    "latitude": 37.5430562,
    "longitude": 127.0707236,
    "naverMapLink": "https://map.naver.com/p/entry/place/18834914",
    "rating": 4.27,
        "reviewCount": 1205,
    "images": [
      "https://ldb-phinf.pstatic.net/20230626_64/1687766367847Wd1B4_JPEG/IMG_0550.jpeg",
      "https://ldb-phinf.pstatic.net/20230626_274/168776649312721SFp_JPEG/IMG_0555.jpeg",
      "https://ldb-phinf.pstatic.net/20230626_112/1687766493119tguQu_JPEG/IMG_0552.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "최신족발": {
    "matchedName": "최신족발",
    "naverPlaceId": 32794440,
    "address": "서울특별시 광진구 아차산로29길 63",
    "lotAddress": "서울특별시 광진구 화양동 34-3",
    "latitude": 37.543646,
    "longitude": 127.0693479,
    "naverMapLink": "https://map.naver.com/p/entry/place/32794440",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20200514_164/1589464927264QgA3s_JPEG/OBFBUPKk8V9G9xOn9hA3bj2c.jpg",
      "https://ldb-phinf.pstatic.net/20200514_166/1589464896920lsIwD_JPEG/SqmUXCMvZtChWtpMpGf6JAW7.jpg",
      "https://ldb-phinf.pstatic.net/20200514_203/1589465016126kAi7Q_JPEG/-kDXzAHsuPtPJd9fIQQSvKtD.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "서소문순두부보쌈": {
    "matchedName": "서소문순두부보쌈",
    "naverPlaceId": 13154500,
    "address": "서울특별시 광진구 동일로 128",
    "lotAddress": "서울특별시 광진구 화양동 42-29",
    "latitude": 37.5436769,
    "longitude": 127.0651039,
    "naverMapLink": "https://map.naver.com/p/entry/place/13154500",
    "rating": 4.29,
        "reviewCount": 1631,
    "images": [
      "https://ldb-phinf.pstatic.net/20221019_22/1666151866648wT7Rz_JPEG/IMG_7433.JPG",
      "https://ldb-phinf.pstatic.net/20221019_275/1666152102613tMYkD_JPEG/IMG_7951.JPG",
      "https://ldb-phinf.pstatic.net/20221019_53/1666152376513KCt4f_JPEG/IMG_7583.JPG"
    ],
    "checkedAt": "2026-06-30"
  },
  "돕감자탕": {
    "matchedName": "돕감자탕전문점",
    "naverPlaceId": 11836177,
    "address": "서울특별시 광진구 아차산로31길 9",
    "lotAddress": "서울특별시 광진구 화양동 9-22",
    "latitude": 37.5414896,
    "longitude": 127.0692665,
    "naverMapLink": "https://map.naver.com/p/entry/place/11836177",
    "rating": 4.42,
        "reviewCount": 2499,
    "images": [
      "https://ldb-phinf.pstatic.net/20260602_215/1780392567630LhMpu_JPEG/KakaoTalk_20260601_131000349_10.jpg",
      "https://ldb-phinf.pstatic.net/20201116_42/1605526882536Ofxh4_JPEG/Rirl23M6iKqQLDj1RnHXx_Od.jpg",
      "https://ldb-phinf.pstatic.net/20201116_263/1605526799810CjrIQ_JPEG/iykwni5Pwk_Feagwn8CClPbj.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "포크포크": {
    "matchedName": "포크포크 건대점",
    "naverPlaceId": 1755431931,
    "address": "서울특별시 광진구 동일로22길 117-16 1층",
    "lotAddress": "서울특별시 광진구 화양동 5-95 1층",
    "latitude": 37.5413126,
    "longitude": 127.0708958,
    "naverMapLink": "https://map.naver.com/p/entry/place/1755431931",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250329_118/1743228218475PNtvY_JPEG/1000013390.jpg",
      "https://ldb-phinf.pstatic.net/20250329_89/1743228011842Nvqtj_JPEG/1000013392.jpg",
      "https://ldb-phinf.pstatic.net/20250329_203/1743228953996Qp1f4_JPEG/1000013396.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "김창훈포차": {
    "matchedName": "김창훈포차",
    "naverPlaceId": 1929531895,
    "address": "서울특별시 광진구 아차산로31길 27 지하 김창훈포차",
    "lotAddress": "서울특별시 광진구 화양동 9-76 지하 김창훈포차",
    "latitude": 37.5422067,
    "longitude": 127.0697234,
    "naverMapLink": "https://map.naver.com/p/entry/place/1929531895",
    "rating": 4.57,
        "reviewCount": 3235,
    "images": [
      "https://ldb-phinf.pstatic.net/20260304_195/17725632445208FC9B_JPEG/1000071843.jpg",
      "https://ldb-phinf.pstatic.net/20251218_279/1766062784083aDj9W_JPEG/1.jpg",
      "https://ldb-phinf.pstatic.net/20251218_224/176606383355099G6M_JPEG/%B1%E2%BA%BB%BE%C8%C1%D6.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "시홍쓰": {
    "matchedName": "시홍쓰",
    "naverPlaceId": 1494321970,
    "address": "서울특별시 광진구 능동로17길 5 1층",
    "lotAddress": "서울특별시 광진구 화양동 94-1 1층",
    "latitude": 37.5461217,
    "longitude": 127.0729933,
    "naverMapLink": "https://map.naver.com/p/entry/place/1494321970",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://pup-review-phinf.pstatic.net/MjAyNjA2MDFfMjIy/MDAxNzgwMzEyMjA0Njg3.XrRXt8g-yJCGWtx9zgJl3WTV33XtxHhZmwMIoliHaIYg.ZMRyl1iRmns6JGPghgP4r8Y3d7fxikhd-QVczGV2BjQg.JPEG/IMG_2339.jpeg",
      "https://ldb-phinf.pstatic.net/20201230_249/1609305244229oMcmW_JPEG/u8YvvJEtaPZQVtbZp8sU_qdD.jpeg.jpg",
      "https://ldb-phinf.pstatic.net/20220603_37/1654235871906XeHmW_JPEG/8B895E83-1023-433A-9959-82A8E2AA8DFA.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "송화산시도삭면": {
    "matchedName": "송화산시도삭면",
    "naverPlaceId": 1359051109,
    "address": "서울특별시 광진구 뚝섬로27길 48",
    "lotAddress": "서울특별시 광진구 자양동 851-20",
    "latitude": 37.537895,
    "longitude": 127.0664981,
    "naverMapLink": "https://map.naver.com/p/entry/place/1359051109",
    "rating": 4.53,
        "reviewCount": 6849,
    "images": [
      "https://ldb-phinf.pstatic.net/20171222_273/1513909993152wbpV8_JPEG/fM-4sk2LkYUe0jmd83plu51X.JPG.jpg",
      "https://ldb-phinf.pstatic.net/20171222_65/151391003987560ndg_JPEG/rDlNRA3oBSqew6IzU4ZpuivL.JPG.jpg",
      "https://pup-review-phinf.pstatic.net/MjAyNTA5MDlfMjAw/MDAxNzU3Mzc4NjYwMjMw.ZhI0oN0eFLEiu8fRJlKVpuPQ584ao6jAlFv4bcSyYtYg.pCM3nMAh-jDje7eSgSQXZvcvE16UEliRZfpM_A2rbAIg.JPEG/rP1985625.jpg?type=w1500_60_sharpen"
    ],
    "checkedAt": "2026-06-30"
  },
  "빠오즈푸": {
    "matchedName": "빠오즈푸 본점",
    "naverPlaceId": 20757891,
    "address": "서울특별시 광진구 광나루로 373",
    "lotAddress": "서울특별시 광진구 군자동 361-32",
    "latitude": 37.5480935,
    "longitude": 127.0715598,
    "naverMapLink": "https://map.naver.com/p/entry/place/20757891",
    "rating": 4.48,
        "reviewCount": 4628,
    "images": [
      "https://ldb-phinf.pstatic.net/20221113_279/1668323664644zsJDP_JPEG/E4275242-6EDA-4A77-B9AE-A1FD7BFC677F.jpeg",
      "https://ldb-phinf.pstatic.net/20221113_162/166832374827970thm_JPEG/B057231D-4BD9-4051-941A-B43F3B7FFCCB.jpeg",
      "https://ldb-phinf.pstatic.net/20221113_264/1668323685945U0T9Q_JPEG/F60EBF52-1937-436F-8FAC-063200D60368.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "매운향솥": {
    "matchedName": "매운향솥",
    "naverPlaceId": 34203618,
    "address": "서울특별시 광진구 동일로18길 61 1층",
    "lotAddress": "서울특별시 광진구 자양동 9-33 1층",
    "latitude": 37.5391111,
    "longitude": 127.0662637,
    "naverMapLink": "https://map.naver.com/p/entry/place/34203618",
    "rating": 4.49,
        "reviewCount": 1,
    "images": [
      "https://ldb-phinf.pstatic.net/20191121_87/15743047607866sr9t_JPEG/3JhLSTOkw79xvNPSZ8QJRRB7.JPG.jpg",
      "https://ldb-phinf.pstatic.net/20191121_290/1574304787563RuMyG_JPEG/e4esgeEi22tuQ5FY3WlFSXF4.JPG.jpg",
      "https://ldb-phinf.pstatic.net/20191121_155/1574304802872ofgac_JPEG/oLvgMFzv0xF30mWokx5P_9tH.JPG.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "송화양꼬치": {
    "matchedName": "송화양꼬치",
    "naverPlaceId": 12966607,
    "address": "서울특별시 광진구 동일로18길 70",
    "lotAddress": "서울특별시 광진구 자양동 11-2",
    "latitude": 37.5388206,
    "longitude": 127.0665993,
    "naverMapLink": "https://map.naver.com/p/entry/place/12966607",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20190213_77/15500360744298Y1Uz_JPEG/jASlCskCiE3Wk91j1gbiaz6F.jpg",
      "https://ldb-phinf.pstatic.net/20220504_218/1651634066457BNeab_JPEG/%BC%DB%C8%AD%BE%E7%B2%BF%C4%A1.JPG",
      "https://ldb-phinf.pstatic.net/20220504_84/165163410961010Xxi_JPEG/%BE%E7%B0%A5%BA%F1%BB%EC_1.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "638DENO탄탄면": {
    "matchedName": "638DENO탄탄면",
    "naverPlaceId": 1479756144,
    "address": "서울특별시 광진구 능동로13길 81-1 1층",
    "lotAddress": "서울특별시 광진구 화양동 33-21 1층",
    "latitude": 37.5452351,
    "longitude": 127.0686744,
    "naverMapLink": "https://map.naver.com/p/entry/place/1479756144",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20210513_23/1620889811073WduRH_JPEG/tMLWPkCAX_VV5fDFpMV7Rw8S.jpg",
      "https://ldb-phinf.pstatic.net/20210513_246/1620889876651Ia0Er_JPEG/uwKkMBvs0gQsF1voUwSXzqM9.jpg",
      "https://ldb-phinf.pstatic.net/20250406_271/1743934642019iBPJt_JPEG/1000002446.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "브네": {
    "matchedName": "브네",
    "naverPlaceId": 1580083114,
    "address": "서울특별시 광진구 군자로 70 106호 VENEZ 브네",
    "lotAddress": "서울특별시 광진구 군자동 362-1 106호 VENEZ 브네",
    "latitude": 37.5489039,
    "longitude": 127.0710627,
    "naverMapLink": "https://map.naver.com/p/entry/place/1580083114",
    "rating": 4.7,
        "reviewCount": 750,
    "images": [
      "https://ldb-phinf.pstatic.net/20250910_267/1757498330602jLAF0_JPEG/302B145E-1F13-4ECA-8AC0-B470962F7290.jpeg",
      "https://ldb-phinf.pstatic.net/20250318_298/17422924773804pwWR_JPEG/IMG_3904.jpeg",
      "https://ldb-phinf.pstatic.net/20250910_78/17574983410450Q000_JPEG/118716A1-D2A7-43F2-ACA7-8500DD28B68B.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "오코노미야키식당하나": {
    "matchedName": "오코노미야키식당하나",
    "naverPlaceId": 1788087862,
    "address": "서울특별시 광진구 능동로13길 111 1층",
    "lotAddress": "서울특별시 광진구 화양동 31-4 1층",
    "latitude": 37.5462587,
    "longitude": 127.0677047,
    "naverMapLink": "https://map.naver.com/p/entry/place/1788087862",
    "rating": 4.52,
        "reviewCount": 2811,
    "images": [
      "https://ldb-phinf.pstatic.net/20220521_157/1653071808518dRViR_JPEG/Screenshot_20220425-143544_Gallery.jpg",
      "https://ldb-phinf.pstatic.net/20240927_106/1727377162603l91Ws_JPEG/IMG_1441.JPG",
      "https://ldb-phinf.pstatic.net/20220521_278/1653071897679h3Dq2_JPEG/Screenshot_20220425-143544_Gallery.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "멘쇼": {
    "matchedName": "멘쇼",
    "naverPlaceId": 760819243,
    "address": "서울특별시 광진구 군자로2길 3",
    "lotAddress": "서울특별시 광진구 화양동 1-10",
    "latitude": 37.5444084,
    "longitude": 127.0717001,
    "naverMapLink": "https://map.naver.com/p/entry/place/760819243",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20210328_268/1616916588407HxXe7_JPEG/5uyA9YsZiX6deMUDxh_OQAFG.jpg",
      "https://ldb-phinf.pstatic.net/20210328_237/161691662224306XBa_JPEG/3rgDjjlzYI1WLSunZIAbKUWp.jpg",
      "https://ldb-phinf.pstatic.net/20210328_220/1616916644800tmQ1o_JPEG/CLhJmZKM85GgsP9Lv-8halv1.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "우마텐텐동": {
    "matchedName": "우마텐 텐동",
    "naverPlaceId": 1040714903,
    "address": "서울특별시 성동구 동일로 143 성수1차 대우아파트 1층 126호",
    "lotAddress": "서울특별시 성동구 성수동2가 279-50 성수1차 대우아파트 1층 126호",
    "latitude": 37.5454507,
    "longitude": 127.0652057,
    "naverMapLink": "https://map.naver.com/p/entry/place/1040714903",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20260502_225/1777687374984nee2k_JPEG/1000003564.jpg",
      "https://ldb-phinf.pstatic.net/20260502_300/1777687630413PQWRi_JPEG/1000008274.jpg",
      "https://ldb-phinf.pstatic.net/20260502_75/1777687722771kHSzP_JPEG/1000008275.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "호야초밥참치": {
    "matchedName": "호야초밥참치 본점",
    "naverPlaceId": 32089668,
    "address": "서울특별시 광진구 능동로13길 39 1층",
    "lotAddress": "서울특별시 광진구 화양동 10-1 1층",
    "latitude": 37.5434686,
    "longitude": 127.0701571,
    "naverMapLink": "https://map.naver.com/p/entry/place/32089668",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20200316_273/1584333926916isMg1_PNG/LqaOSa7ArPUmvaB540KTAL4w.png",
      "https://ldb-phinf.pstatic.net/20150901_192/1441074093103rGACl_JPEG/166851515150624_1.jpg",
      "https://ldb-phinf.pstatic.net/20150901_89/14410740934962WrUO_JPEG/166851515150624_2.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "초라멘": {
    "matchedName": "초라멘",
    "naverPlaceId": 1267891433,
    "address": "서울특별시 광진구 능동로13길 80 1층",
    "lotAddress": "서울특별시 광진구 화양동 16-28 1층",
    "latitude": 37.5451927,
    "longitude": 127.0688595,
    "naverMapLink": "https://map.naver.com/p/entry/place/1267891433",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20200115_102/1579082949064oWETw_JPEG/o_1DeWjJscuxMiW4TfzEB7Wk.jpg",
      "https://ldb-phinf.pstatic.net/20190624_115/1561332214168gLLbz_JPEG/wEwnNH-iIHEzQ4S0MIopTZUm.jpg",
      "https://ldb-phinf.pstatic.net/20190624_122/15613323309150D4AV_JPEG/OwHdpYnXENcu_eOsOp2HM0pF.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "슈퍼슬라이더": {
    "matchedName": "수퍼슬라이더스",
    "naverPlaceId": 1720361242,
    "address": "서울특별시 광진구 능동로13길 50 1층 수퍼슬라이더스",
    "lotAddress": "서울특별시 광진구 화양동 12-41 1층 수퍼슬라이더스",
    "latitude": 37.5440698,
    "longitude": 127.0698905,
    "naverMapLink": "https://map.naver.com/p/entry/place/1720361242",
    "rating": 4.6,
        "reviewCount": 2046,
    "images": [
      "https://ldb-phinf.pstatic.net/20220408_218/1649409922458sCAUC_JPEG/DSC04824_1280.JPG",
      "https://ldb-phinf.pstatic.net/20220408_155/1649410044330C8v6b_JPEG/DSC04875_1280.JPG",
      "https://ldb-phinf.pstatic.net/20251202_266/176466747473366klp_JPEG/%BC%F6%C6%DB%BD%BD%B6%F3%C0%CC%B4%F5%BD%BA_028.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "호파스타": {
    "matchedName": "호파스타 생면파스타 건대본점",
    "naverPlaceId": 1134743279,
    "address": "서울특별시 광진구 군자로3길 23 1층 호파스타",
    "lotAddress": "서울특별시 광진구 화양동 12-52 1층 호파스타",
    "latitude": 37.5442689,
    "longitude": 127.0701674,
    "naverMapLink": "https://map.naver.com/p/entry/place/1134743279",
    "rating": 4.39,
        "reviewCount": 1940,
    "images": [
      "https://ldb-phinf.pstatic.net/20240415_76/1713161683321R4Tjs_PNG/%B6%F3%B1%B8%B6%F3%C0%DA%B3%C4.png",
      "https://ldb-phinf.pstatic.net/20240415_65/17131615648070aIHM_PNG/%B9%D9%C1%FA%B6%F3%C0%DA%B3%C4.png",
      "https://ldb-phinf.pstatic.net/20221003_49/1664781322918NKHXm_PNG/BPT_2265_.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "미분당": {
    "matchedName": "미분당 건대점",
    "naverPlaceId": 37475126,
    "address": "서울특별시 광진구 군자로3길 27 1층",
    "lotAddress": "서울특별시 광진구 화양동 12-42 1층",
    "latitude": 37.5442223,
    "longitude": 127.0700617,
    "naverMapLink": "https://map.naver.com/p/entry/place/37475126",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20240309_54/17099362196672WTz9_JPEG/IMG_0075.jpeg",
      "https://ldb-phinf.pstatic.net/20240309_300/1709936251565QjrLn_JPEG/IMG_0076.jpeg",
      "https://ldb-phinf.pstatic.net/20240309_92/17099363190190Enl7_JPEG/IMG_0077.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "보난자": {
    "matchedName": "보난자커피 군자",
    "naverPlaceId": 1689645997,
    "address": "서울특별시 광진구 능동로 239-1 B동 1층 보난자커피",
    "lotAddress": "서울특별시 광진구 군자동 270 B동 1층 보난자커피",
    "latitude": 37.5516342,
    "longitude": 127.0763031,
    "naverMapLink": "https://map.naver.com/p/entry/place/1689645997",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20220921_87/1663725440286UcUAF_JPEG/%28%C7%CA%C5%CD%C4%BF%C7%C7%29Colombia_El_carmen_2.jpg",
      "https://ldb-phinf.pstatic.net/20220921_265/1663725440289C3Hp4_JPEG/%28%C7%CA%C5%CD%C4%BF%C7%C7%29Colombia_El_carmen_1.jpg",
      "https://ldb-phinf.pstatic.net/20230817_127/1692252275402ateIw_JPEG/%BA%A3%C0%CC%C4%BF%B8%AE_%C6%C4%BF%EE%B5%E5_%C3%CA%C4%DD%B8%B4_%C6%C4%BF%EE%B5%E5_%C4%C9%C0%CC%C5%A9.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "꼬메노": {
    "matchedName": "꼬메노",
    "naverPlaceId": 20322289,
    "address": "서울특별시 광진구 군자로7길 29 1층 카페꼬메노",
    "lotAddress": "서울특별시 광진구 화양동 16-24 1층 카페꼬메노",
    "latitude": 37.5456057,
    "longitude": 127.0691037,
    "naverMapLink": "https://map.naver.com/p/entry/place/20322289",
    "rating": 4.71,
        "reviewCount": 815,
    "images": [
      "https://ldb-phinf.pstatic.net/20240604_266/1717465090328hqPJg_JPEG/IMG_3145.jpeg",
      "https://pup-review-phinf.pstatic.net/MjAyNTEyMTdfMjIw/MDAxNzY1OTI4Mzg2NDkz.fmEHk3V71CHmAe7IZxaLimbY_w5r-aQH0db7GMjT64wg.citTtDf0114YldD30qAjkCwOOE-fRzAedHlBLHZb_U0g.JPEG/IMG_7298.jpeg",
      "https://pup-review-phinf.pstatic.net/MjAyNTEyMTdfMTA0/MDAxNzY1OTI4Mzg3ODg1.BUZ8hSSiRY4yhsQUqziaE-sF95Muk0xjoCO6yYusHVkg.csCiAnMGS_aGa0LwpvDqcdmriB_0BEhv8sbFiDqa1gQg.JPEG/IMG_7274.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "최가회관": {
    "matchedName": "최가커피회관",
    "naverPlaceId": 1332129677,
    "address": "서울특별시 광진구 능동로13길 30 지층",
    "lotAddress": "서울특별시 광진구 화양동 12-34 지층",
    "latitude": 37.5434026,
    "longitude": 127.0706141,
    "naverMapLink": "https://map.naver.com/p/entry/place/1332129677",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250706_229/17517718772262Fzs7_JPEG/IMG_7415.jpeg",
      "https://ldb-phinf.pstatic.net/20250710_20/1752148668393HLvXw_JPEG/IMG_7443.jpeg",
      "https://ldb-phinf.pstatic.net/20250710_225/1752146788623zqenP_JPEG/IMG_7439.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "잠수교집": {
    "matchedName": "잠수교집 성수 직영점",
    "naverPlaceId": 1920277706,
    "address": "서울특별시 성동구 아차산로 137 1층 잠수교집",
    "lotAddress": "서울특별시 성동구 성수동2가 277-156 1층 잠수교집",
    "latitude": 37.5438438,
    "longitude": 127.059245,
    "naverMapLink": "https://map.naver.com/p/entry/place/1920277706",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20260430_141/1777509885253QuQiq_JPEG/KakaoTalk_20260422_175121681_02.jpg",
      "https://ldb-phinf.pstatic.net/20260430_71/1777509873502gbpwC_JPEG/KakaoTalk_20260422_175121681_01.jpg",
      "https://ldb-phinf.pstatic.net/20260430_186/1777509858391PNEQF_JPEG/KakaoTalk_20260422_175121681.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "꿉당": {
    "matchedName": "꿉당 성수점",
    "naverPlaceId": 1739440199,
    "address": "서울특별시 성동구 성수이로20길 10 경협회관 104호",
    "lotAddress": "서울특별시 성동구 성수동2가 273-24 경협회관 104호",
    "latitude": 37.5432305,
    "longitude": 127.0575635,
    "naverMapLink": "https://map.naver.com/p/entry/place/1739440199",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20220905_84/1662366985454qSzqi_JPEG/%B4%EB%C7%A5%B8%DE%B4%BA.JPG",
      "https://ldb-phinf.pstatic.net/20220905_300/1662366961311sminQ_JPEG/%B4%EB%C7%A5%B8%DE%B4%BA.JPG",
      "https://ldb-phinf.pstatic.net/20220905_281/1662366931601gBtXH_JPEG/%B4%EB%C7%A5%B8%DE%B4%BA.JPG"
    ],
    "checkedAt": "2026-06-30"
  },
  "땅코참숯구이": {
    "matchedName": "땅코참숯구이 본점",
    "naverPlaceId": 1328684927,
    "address": "서울특별시 성동구 행당로17길 26 1층 땅코참숯구이",
    "lotAddress": "서울특별시 성동구 행당동 292-34 1층 땅코참숯구이",
    "latitude": 37.5606964,
    "longitude": 127.0330078,
    "naverMapLink": "https://map.naver.com/p/entry/place/1328684927",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20190610_180/15601551850769XUty_JPEG/nmyyVu4D_Ne95o1MXRxN3J_3.jpg",
      "https://ldb-phinf.pstatic.net/20190610_170/1560155195785znxCO_JPEG/xYq91s-RWTlUFmRw4T8JZ2j4.jpg",
      "https://ldb-phinf.pstatic.net/20190610_44/1560155208639qLLui_JPEG/OaYpV3oSmjbL3rc_2fYMZWFq.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "성수동양갈비": {
    "matchedName": "성수동양갈비",
    "naverPlaceId": 12770339,
    "address": "서울특별시 성동구 성수일로12길 33",
    "lotAddress": "서울특별시 성동구 성수동2가 299-233",
    "latitude": 37.5477155,
    "longitude": 127.0546753,
    "naverMapLink": "https://map.naver.com/p/entry/place/12770339",
    "rating": 4.68,
        "reviewCount": 257,
    "images": [
      "https://ldb-phinf.pstatic.net/20251005_206/1759671534689HrNws_JPEG/1000045802.jpg",
      "https://ldb-phinf.pstatic.net/20251005_280/1759671547646maVmN_JPEG/1000045801.jpg",
      "https://ldb-phinf.pstatic.net/20251005_124/1759671593097EETmo_JPEG/1000045803.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "능동미나리": {
    "matchedName": "능동미나리 성수지점",
    "naverPlaceId": 1594044291,
    "address": "서울특별시 성동구 연무장길 42 1, 2층",
    "lotAddress": "서울특별시 성동구 성수동2가 310-14 1, 2층",
    "latitude": 37.5427551,
    "longitude": 127.0539622,
    "naverMapLink": "https://map.naver.com/p/entry/place/1594044291",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250224_31/17403598821931AY5P_JPEG/%C7%C1%B8%AE%B9%CC%BE%F6--%C2%F7%B5%B9-%B8%F0%B5%D2-%B0%F5%C5%C1_%BC%BA%BC%F6%C1%A1.JPG",
      "https://ldb-phinf.pstatic.net/20231128_213/1701148101976YoVNu_PNG/%B4%C9%B5%BF%B9%CC%B3%AA%B8%AE%B0%F5%C5%C1%2815%2C000%29.PNG",
      "https://ldb-phinf.pstatic.net/20231123_16/1700726899785tMXo2_JPEG/%B4%C9%B5%BF%C0%B0%C8%B8%BA%F1%BA%F6%B9%E4%2815%2C000%29.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "금금": {
    "matchedName": "금금 성수점",
    "naverPlaceId": 1818902068,
    "address": "서울특별시 성동구 성수이로12길 11 1층 101호",
    "lotAddress": "서울특별시 성동구 성수동2가 269-115 1층 101호",
    "latitude": 37.5397954,
    "longitude": 127.0566502,
    "naverMapLink": "https://map.naver.com/p/entry/place/1818902068",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20251205_98/17648946069597oYpd_JPEG/%BA%B8%B8%AE%B5%C8%C0%E5.jpg",
      "https://ldb-phinf.pstatic.net/20240321_300/1711013105029AbIOi_JPEG/1.%BA%B8%B8%AE%B5%C8%C0%E5%B1%B9%BC%F6_%282%29.jpg",
      "https://ldb-phinf.pstatic.net/20251205_37/1764894349774FLzg1_JPEG/%B5%E9%B1%E2%B8%A7%C5%EB%B9%D0.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "돼지공탕하우": {
    "matchedName": "돼지공탕 하우 성수본점",
    "naverPlaceId": 1559602117,
    "address": "서울특별시 성동구 아차산로7길 36 1층 2호",
    "lotAddress": "서울특별시 성동구 성수동2가 289-39 1층 2호",
    "latitude": 37.548435,
    "longitude": 127.0556892,
    "naverMapLink": "https://map.naver.com/p/entry/place/1559602117",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20241120_30/1732092253788MMumS_JPEG/%C7%CF%BF%EC_%B0%F8%C5%C1_%BA%B8%C5%EB_02.jpg",
      "https://ldb-phinf.pstatic.net/20241120_11/1732092252842UzQCu_JPEG/%C7%CF%BF%EC_%B0%F8%C5%C1_%BA%B8%C5%EB_01.jpg",
      "https://ldb-phinf.pstatic.net/20241120_44/1732092333982PIoOD_JPEG/%C7%CF%BF%EC_%B3%C3%B8%E9_02.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "실비옥": {
    "matchedName": "실비옥",
    "naverPlaceId": 2026535112,
    "address": "서울특별시 성동구 아차산로 126 지하1층 B107호",
    "lotAddress": "서울특별시 성동구 성수동2가 273-52 지하1층 B107호",
    "latitude": 37.5434961,
    "longitude": 127.0580599,
    "naverMapLink": "https://map.naver.com/p/entry/place/2026535112",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250605_97/1749102914119x8Eds_JPEG/250528_%BD%C7%BA%F1%BF%C19983.jpg",
      "https://ldb-phinf.pstatic.net/20250605_106/1749102965747YPri5_JPEG/250528_%BD%C7%BA%F1%BF%C19991.jpg",
      "https://ldb-phinf.pstatic.net/20250605_108/1749102892608LTyT4_JPEG/250528_%BD%C7%BA%F1%BF%C19989.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "솥솥": {
    "matchedName": "솔솥 성수점",
    "naverPlaceId": 1580152953,
    "address": "서울특별시 성동구 연무장5가길 24 솔솥 성수점",
    "lotAddress": "서울특별시 성동구 성수동2가 315-25 솔솥 성수점",
    "latitude": 37.5432111,
    "longitude": 127.0553145,
    "naverMapLink": "https://map.naver.com/p/entry/place/1580152953",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20240109_40/1704777701194n4MDs_PNG/1._%BD%BA%C5%D7%C0%CC%C5%A9%BC%DC%B9%E4.png",
      "https://ldb-phinf.pstatic.net/20240109_18/1704777708554Nv0cm_PNG/2._%B5%B5%B9%CC%B0%FC%C0%DA%BC%DC%B9%E4.png",
      "https://ldb-phinf.pstatic.net/20240109_31/1704777716325NLeIa_PNG/5._%C0%FC%BA%B9%BC%DC%B9%E4.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "조조칼국수": {
    "matchedName": "조조칼국수 성수점",
    "naverPlaceId": 1057264169,
    "address": "서울특별시 성동구 성수일로8길 55 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 289-257 1층",
    "latitude": 37.5451733,
    "longitude": 127.0567604,
    "naverMapLink": "https://map.naver.com/p/entry/place/1057264169",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230901_65/1693535985227kysYc_JPEG/KakaoTalk_20230801_160127326_05.jpg",
      "https://ldb-phinf.pstatic.net/20230901_109/1693535992478fgjwj_JPEG/KakaoTalk_20230801_160127326_04.jpg",
      "https://ldb-phinf.pstatic.net/20230901_75/1693535997458SeoQ2_JPEG/KakaoTalk_20230801_160127326_06.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "칼": {
    "matchedName": "칼 성수점",
    "naverPlaceId": 1001495826,
    "address": "서울특별시 성동구 성수이로 126 성수실업 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 277-20 성수실업 1층",
    "latitude": 37.5462187,
    "longitude": 127.0577743,
    "naverMapLink": "https://map.naver.com/p/entry/place/1001495826",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230105_12/1672898136002pHJSn_JPEG/C4BDB1D8-DBA5-4D01-A026-869C268172FE.jpeg",
      "https://ldb-phinf.pstatic.net/20230105_81/1672898091229oxngV_JPEG/570D0A27-C5BA-4833-920A-769F858D8391.jpeg",
      "https://ldb-phinf.pstatic.net/20230105_103/16728981510644LbsX_JPEG/BB6FC96B-43AA-41CF-AD2E-9D1D24695E50.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "르프리크": {
    "matchedName": "르프리크 성수",
    "naverPlaceId": 1227114216,
    "address": "서울특별시 성동구 연무장5길 9-16 블루스톤타워 B103",
    "lotAddress": "서울특별시 성동구 성수동2가 302-8 블루스톤타워 B103",
    "latitude": 37.5444391,
    "longitude": 127.0526591,
    "naverMapLink": "https://map.naver.com/p/entry/place/1227114216",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20260519_172/1779189206761y73la_JPEG/IMG_4521.jpg",
      "https://ldb-phinf.pstatic.net/20220722_39/1658489511789llOX6_JPEG/0D69A458-C3C9-4FCB-8530-8EB4B31C304E.JPG",
      "https://ldb-phinf.pstatic.net/20220722_225/1658489506377ADipd_JPEG/IMG_4657.JPG"
    ],
    "checkedAt": "2026-06-30"
  },
  "bd버거": {
    "matchedName": "bd버거 성수역연무장길 점심저녁",
    "naverPlaceId": 1026594418,
    "address": "서울특별시 성동구 성수이로14길 7 2층",
    "lotAddress": "서울특별시 성동구 성수동2가 322-20 2층",
    "latitude": 37.5410965,
    "longitude": 127.0564655,
    "naverMapLink": "https://map.naver.com/p/entry/place/1026594418",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20251203_73/1764717131010ypzbH_JPEG/img_0013_1x1.JPG",
      "https://ldb-phinf.pstatic.net/20251203_138/1764717051392FMCmL_JPEG/img_0068_1x1_%C5%BA_%C1%A4%B5%B5%B8%A6_%C1%D9%C0%D3.JPG",
      "https://ldb-phinf.pstatic.net/20240711_282/1720684948923sN4ds_PNG/%B9%F6%B0%A5%C6%A2.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "롸카두들": {
    "matchedName": "롸카두들 내쉬빌 핫치킨 성수점",
    "naverPlaceId": 1882528663,
    "address": "서울특별시 성동구 성수일로4길 25 상가 108호",
    "lotAddress": "서울특별시 성동구 성수동2가 308-4 상가 108호",
    "latitude": 37.5422354,
    "longitude": 127.0520827,
    "naverMapLink": "https://map.naver.com/p/entry/place/1882528663",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20231011_72/1697024286763yWdJ1_PNG/Classic.png",
      "https://ldb-phinf.pstatic.net/20231011_143/1697024293416sXgTN_PNG/grandpa.png",
      "https://ldb-phinf.pstatic.net/20231011_214/1697024299874WHFyw_PNG/OG.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "핑거팁스": {
    "matchedName": "핑거팁스",
    "naverPlaceId": 1566517542,
    "address": "서울특별시 성동구 광나루로2길 34-17 1F",
    "lotAddress": "서울특별시 성동구 성수동2가 299-231 1F",
    "latitude": 37.5478758,
    "longitude": 127.0546824,
    "naverMapLink": "https://map.naver.com/p/entry/place/1566517542",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20241113_173/1731495757781SE8iR_JPEG/%B9%CC%B5%E9%B9%F6%B0%C5.jpg",
      "https://ldb-phinf.pstatic.net/20240603_204/1717377951022njy44_JPEG/KakaoTalk_20240521_180351141.jpg",
      "https://ldb-phinf.pstatic.net/20240519_174/1716112970926lmmX9_JPEG/%C5%F5%BD%E6%C1%EE%B9%F6%B0%C5.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "마오": {
    "matchedName": "안홍마오",
    "naverPlaceId": 1909402080,
    "address": "서울특별시 성동구 뚝섬로4길 21 지하1층",
    "lotAddress": "서울특별시 성동구 성수동1가 275-6 지하1층",
    "latitude": 37.5388739,
    "longitude": 127.0507762,
    "naverMapLink": "https://map.naver.com/p/entry/place/1909402080",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20260616_295/1781588159008CS63G_JPEG/%B3%C3_%B4%DF%B4%D9%B8%AE%BB%EC_%BD%D2%B1%B9%BC%F6.jpg",
      "https://ldb-phinf.pstatic.net/20240424_187/1713948376920NY6tm_JPEG/KakaoTalk_20240419_194548821_03.jpg",
      "https://ldb-phinf.pstatic.net/20240324_158/17112757156122tLC2_JPEG/%BA%D0%C2%A5.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "마하차이": {
    "matchedName": "마하차이 성수본점",
    "naverPlaceId": 1963449777,
    "address": "서울특별시 성동구 뚝섬로 399 2층",
    "lotAddress": "서울특별시 성동구 성수동2가 339-22 2층",
    "latitude": 37.538947,
    "longitude": 127.0550993,
    "naverMapLink": "https://map.naver.com/p/entry/place/1963449777",
    "rating": 4.52,
        "reviewCount": 1987,
    "images": [
      "https://ldb-phinf.pstatic.net/20190108_256/1546912185056Wzm2Y_JPEG/RMlUCiS6VK74q7IY3z5B3iT7.jpg",
      "https://ldb-phinf.pstatic.net/20190108_177/1546912150303isYoq_JPEG/nAPsWl-SQ_qlah7KHx1QWYci.jpg",
      "https://ldb-phinf.pstatic.net/20190119_222/1547882365282AiCtT_JPEG/5-jooX41oAMu2j-rqXWhoO5p.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "벱": {
    "matchedName": "벱",
    "naverPlaceId": 1465603515,
    "address": "서울특별시 성동구 성수일로4가길 2 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 321-21 1층",
    "latitude": 37.542102,
    "longitude": 127.0540044,
    "naverMapLink": "https://map.naver.com/p/entry/place/1465603515",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250107_53/1736254145792fSNrr_JPEG/IMG_2907.jpeg",
      "https://ldb-phinf.pstatic.net/20200417_54/1587110582306tSkJI_JPEG/NQtRGwRYFtsoRxSGhlAJFc44.jpg",
      "https://ldb-phinf.pstatic.net/20200417_24/1587110585600LtGQH_JPEG/4pxGaNhbR8vwp5kQ7MpNmmJi.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "남짐릇": {
    "matchedName": "남짐릇",
    "naverPlaceId": 1957072341,
    "address": "서울특별시 성동구 연무장5가길 32 지하1층",
    "lotAddress": "서울특별시 성동구 성수동2가 315-21 지하1층",
    "latitude": 37.5431138,
    "longitude": 127.0557818,
    "naverMapLink": "https://map.naver.com/p/entry/place/1957072341",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20240708_109/1720430849645WGoBb_JPEG/%BD%D2%B1%B9%BC%F6.jpg",
      "https://ldb-phinf.pstatic.net/20240824_266/1724489521931PJDnS_JPEG/KakaoTalk_20240824_175001178.jpg",
      "https://ldb-phinf.pstatic.net/20240910_143/17259463990983Sh5P_JPEG/KakaoTalk_20240910_140651542_01.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "페이퍼플레이트": {
    "matchedName": "페이퍼 플레이트",
    "naverPlaceId": 1683846629,
    "address": "서울특별시 성동구 성수이로14길 15 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 322-21 1층",
    "latitude": 37.5417281,
    "longitude": 127.0566909,
    "naverMapLink": "https://map.naver.com/p/entry/place/1683846629",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250926_247/1758894780063l2wWL_JPEG/IMG_5518.jpeg",
      "https://ldb-phinf.pstatic.net/20230511_151/1683807595259eaqKx_JPEG/IMG_0352.jpeg",
      "https://ldb-phinf.pstatic.net/20230511_119/1683807183077RtpaD_JPEG/IMG_0347.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "세스크멘슬": {
    "matchedName": "세스크멘슬",
    "naverPlaceId": 1057225152,
    "address": "서울특별시 성동구 성수이로14길 7 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 322-20 1층",
    "latitude": 37.5410221,
    "longitude": 127.056438,
    "naverMapLink": "https://map.naver.com/p/entry/place/1057225152",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230627_253/1687834285312CKqGt_JPEG/MAN00054.jpg",
      "https://ldb-phinf.pstatic.net/20210325_32/1616645146889c7NuM_PNG/image.png",
      "https://pup-review-phinf.pstatic.net/MjAyNjAzMDdfMjgz/MDAxNzcyODYzMDAyMjU1.CfCJ_3gpB5z7U-lP63MhwQAyUF6C1nWImiry_i-ezP4g.KhOsZ6vMJBEJjj8HRhTmEYMubM5BLRi0WfKo321H21Qg.JPEG/DCB364E7-CF2C-40A1-B008-1429AB941E8C.jpeg?type=w1500_60_sharpen"
    ],
    "checkedAt": "2026-06-30"
  },
  "마리오네": {
    "matchedName": "마리오네",
    "naverPlaceId": 1118354814,
    "address": "서울특별시 성동구 광나루로2길 23-1 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 299-50 1층",
    "latitude": 37.5488963,
    "longitude": 127.0542761,
    "naverMapLink": "https://map.naver.com/p/entry/place/1118354814",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250318_82/1742287014130yQA8g_JPEG/IMG_9385.jpeg",
      "https://ldb-phinf.pstatic.net/20250318_125/1742287207901VCmwE_JPEG/9F0E69DE-D98E-4622-BA23-97B73328B098.jpeg",
      "https://ldb-phinf.pstatic.net/20210408_200/1617893150909kfKsk_JPEG/FvO7oGp2VdxogBBaIF6CAIVs.jpeg.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "피읻짜": {
    "matchedName": "피읻짜",
    "naverPlaceId": 1080140629,
    "address": "서울특별시 성동구 아차산로7길 11 2층",
    "lotAddress": "서울특별시 성동구 성수동2가 289-101 2층",
    "latitude": 37.5462599,
    "longitude": 127.0544591,
    "naverMapLink": "https://map.naver.com/p/entry/place/1080140629",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20221021_193/1666340983295agsX6_JPEG/8BDE1983-90FA-40C1-A42B-8A7CC1EE64EF.jpeg",
      "https://ldb-phinf.pstatic.net/20221021_105/1666341224271YtLia_JPEG/8A74B7D6-C4C3-4A20-BCCF-5FFF9EC3664B.jpeg",
      "https://ldb-phinf.pstatic.net/20221021_60/1666341030275JS8o3_JPEG/6005883B-477B-4CB2-A7E9-9CE9CAEA1F98.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "코치": {
    "matchedName": "코치",
    "naverPlaceId": 1933103682,
    "address": "서울특별시 성동구 성덕정17길 11 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 565 1층",
    "latitude": 37.5382184,
    "longitude": 127.0551985,
    "naverMapLink": "https://map.naver.com/p/entry/place/1933103682",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250806_116/1754461100629vGJ1p_JPEG/1000022368.jpg",
      "https://ldb-phinf.pstatic.net/20260128_115/1769584655076gXNuD_JPEG/1000024895.jpg",
      "https://ldb-phinf.pstatic.net/20260128_17/1769587244151W1jqQ_JPEG/1000024924.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "가조쿠": {
    "matchedName": "가조쿠",
    "naverPlaceId": 1716744205,
    "address": "서울특별시 성동구 연무장길 31-2 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 316-77 1층",
    "latitude": 37.5431995,
    "longitude": 127.0530996,
    "naverMapLink": "https://map.naver.com/p/entry/place/1716744205",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20240430_231/1714483924327EcXzY_JPEG/7EC44E71-AE52-4318-92EA-7CCBD7E8FEEB.jpeg",
      "https://ldb-phinf.pstatic.net/20240430_105/1714483991425HlM2l_JPEG/35EBCC1C-8C26-4036-8394-C7CA21480E35.jpeg",
      "https://ldb-phinf.pstatic.net/20240430_162/1714484096961FnmGF_JPEG/699156AE-A042-4703-98FF-95B181A1D659.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "소바마에니고": {
    "matchedName": "소바마에 니고",
    "naverPlaceId": 1133279249,
    "address": "서울특별시 성동구 연무장길 39-15 지1층",
    "lotAddress": "서울특별시 성동구 성수동2가 316-40 지1층",
    "latitude": 37.5433406,
    "longitude": 127.0539046,
    "naverMapLink": "https://map.naver.com/p/entry/place/1133279249",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20241021_164/1729487882353caPyk_PNG/SOBAMAE_BRANDING_MAKETING_V1__61.png",
      "https://ldb-phinf.pstatic.net/20241021_55/1729489391462pTOWr_PNG/SOBAMAE_BRANDING_MAKETING_V1_%BD%BA%C6%E4%BC%C8%C5%D9%B5%BF.png",
      "https://ldb-phinf.pstatic.net/20241021_116/1729488123431wx6qD_PNG/SOBAMAE_BRANDING_MAKETING_V1_%BF%C2%C3%B5%B0%E8%B6%F5.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "탐광": {
    "matchedName": "탐광",
    "naverPlaceId": 1778707941,
    "address": "서울특별시 성동구 연무장5가길 26 1층,B1",
    "lotAddress": "서울특별시 성동구 성수동2가 315-24 1층,B1",
    "latitude": 37.5432134,
    "longitude": 127.0554483,
    "naverMapLink": "https://map.naver.com/p/entry/place/1778707941",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230419_271/1681870203629TkSyK_JPEG/KakaoTalk_20230419_102831742_05.jpg",
      "https://ldb-phinf.pstatic.net/20230419_84/1681870248288o7jMD_JPEG/KakaoTalk_20230419_102831742_13.jpg",
      "https://ldb-phinf.pstatic.net/20230419_204/1681870363799b7bdj_JPEG/KakaoTalk_20230419_102831742_12.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "토리아에즈": {
    "matchedName": "토리아에즈 성수점",
    "naverPlaceId": 1398181678,
    "address": "서울특별시 성동구 아차산로7길 7 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 289-273 1층",
    "latitude": 37.5460286,
    "longitude": 127.0543476,
    "naverMapLink": "https://map.naver.com/p/entry/place/1398181678",
    "rating": 4.65,
        "reviewCount": 727,
    "images": [
      "https://ldb-phinf.pstatic.net/20220509_154/1652078567923Bj1eo_JPEG/KakaoTalk_20220509_105939947_01.jpg",
      "https://ldb-phinf.pstatic.net/20220509_186/1652078580416OLRig_JPEG/KakaoTalk_20220509_105939947_02.jpg",
      "https://ldb-phinf.pstatic.net/20240509_268/1715230134463evzPp_JPEG/KakaoTalk_20240509_134517446.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "라무라": {
    "matchedName": "라무라 성수",
    "naverPlaceId": 1989241430,
    "address": "서울특별시 성동구 성수이로12길 8 2층 라무라 성수",
    "lotAddress": "서울특별시 성동구 성수동2가 328-74 2층 라무라 성수",
    "latitude": 37.5398091,
    "longitude": 127.0559804,
    "naverMapLink": "https://map.naver.com/p/entry/place/1989241430",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230522_57/16847329668989mWrw_JPEG/F20AA12D-CD6D-4327-8D83-85229E11CB41.jpeg",
      "https://ldb-phinf.pstatic.net/20230522_21/1684732874023EozAG_JPEG/3854A6E2-A19E-4624-9001-5C37AD49DC9E.jpeg",
      "https://ldb-phinf.pstatic.net/20221013_158/1665662300777WhK7r_JPEG/CBF4D23F-20E7-4458-BED5-0D6B4D0570C3.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "도죠": {
    "matchedName": "도죠",
    "naverPlaceId": 1093763709,
    "address": "서울특별시 성동구 성수이로 126 도죠",
    "lotAddress": "서울특별시 성동구 성수동2가 277-20 도죠",
    "latitude": 37.5462909,
    "longitude": 127.0578707,
    "naverMapLink": "https://map.naver.com/p/entry/place/1093763709",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230207_230/16757532832911tc6i_JPEG/1631031049677-3.jpg",
      "https://ldb-phinf.pstatic.net/20210908_292/1631026800107CkYNx_JPEG/beIAPaFzLiKKWqCNLFiNulIJ.jpg",
      "https://ldb-phinf.pstatic.net/20240129_175/1706538255965UDsco_JPEG/KakaoTalk_20210903_163548974_04.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "죠죠": {
    "matchedName": "죠죠 성수점",
    "naverPlaceId": 1006460400,
    "address": "서울특별시 성동구 연무장17길 7 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 272-1 1층",
    "latitude": 37.5414821,
    "longitude": 127.0609786,
    "naverMapLink": "https://map.naver.com/p/entry/place/1006460400",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20260303_63/1772509137328h5IN8_PNG/%B8%F3%C0%DA%BE%DF%B3%A2_%BC%BC%C6%AE.png",
      "https://ldb-phinf.pstatic.net/20260303_85/1772509072835lKW0L_PNG/%B8%ED%B6%F5%B8%F3%C0%DA%BE%DF%B3%A2.png",
      "https://ldb-phinf.pstatic.net/20260303_293/1772509099614N3Qpm_PNG/%B8%D4%B9%B0%B8%F3%C0%DA%BE%DF%B3%A2.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "성수속향연": {
    "matchedName": "성수속향연",
    "naverPlaceId": 1772785792,
    "address": "서울특별시 성동구 성수이로 65 협성빌딩 102호",
    "lotAddress": "서울특별시 성동구 성수동2가 309-148 협성빌딩 102호",
    "latitude": 37.5409192,
    "longitude": 127.0554901,
    "naverMapLink": "https://map.naver.com/p/entry/place/1772785792",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20240229_62/17091878322500Ifmg_JPEG/KakaoTalk_20240228_162754897_11.jpg",
      "https://ldb-phinf.pstatic.net/20240229_94/1709186947725J2766_JPEG/KakaoTalk_20240228_153052662.jpg",
      "https://ldb-phinf.pstatic.net/20230530_216/1685435761953YNHvM_JPEG/%C0%AF%B8%B0%B1%E2.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "중앙감속기": {
    "matchedName": "중앙감속기",
    "naverPlaceId": 20937806,
    "address": "서울특별시 성동구 성수일로6길 7-1 1층 중앙감속기",
    "lotAddress": "서울특별시 성동구 성수동2가 301-98 1층 중앙감속기",
    "latitude": 37.5455321,
    "longitude": 127.0511192,
    "naverMapLink": "https://map.naver.com/p/entry/place/20937806",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250609_91/1749440268438dW4KI_JPEG/%B9%DF%BB%E7%B9%CD%B2%E3%B9%D9%B7%CE%BF%EC_02.jpg",
      "https://ldb-phinf.pstatic.net/20221228_92/1672192013918Ns7Cg_JPEG/%B8%B6%B6%F3%C5%A9%B8%B2%C2%AB%BB%CD_0813%28O%29.jpg",
      "https://ldb-phinf.pstatic.net/20221228_201/1672193248114CD359_JPEG/%C3%E1%B1%C7_0750%28O%29.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "영수분식": {
    "matchedName": "영수분식",
    "naverPlaceId": 1656481040,
    "address": "서울특별시 성동구 성덕정15길 4-8",
    "lotAddress": "서울특별시 성동구 성수동2가 335-103",
    "latitude": 37.5379816,
    "longitude": 127.0539571,
    "naverMapLink": "https://map.naver.com/p/entry/place/1656481040",
    "rating": 4.52,
        "reviewCount": 876,
    "images": [
      "https://pup-review-phinf.pstatic.net/MjAyNTA3MDhfMjcg/MDAxNzUxOTgzODAzODAy.K2HF61Gfdw1hDGz43cgyKWh7jPkU-Fp4vQ6DQwQcIxcg.6OugNoideBqdyoE6mpuWkfIfL6rkZ000q7Ik2_Yuz_Yg.JPEG/weverse_20250701174143.jpg",
      "https://ldb-phinf.pstatic.net/20240129_245/17065037001826QTn7_JPEG/%B4%D9%BF%EE%B7%CE%B5%E5.jpeg.jpg",
      "https://ldb-phinf.pstatic.net/20200311_261/15839167454725y7PQ_JPEG/9u7eakrupes16seJGtGI4LWM.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "미정이네식당": {
    "matchedName": "미정이네식당",
    "naverPlaceId": 20765291,
    "address": "서울특별시 성동구 성덕정15길 6-5",
    "lotAddress": "서울특별시 성동구 성수동2가 335-138",
    "latitude": 37.5382801,
    "longitude": 127.0539036,
    "naverMapLink": "https://map.naver.com/p/entry/place/20765291",
    "rating": 4.4,
        "reviewCount": 369,
    "images": [
      "https://ldb-phinf.pstatic.net/20181012_196/1539309576011qRs0o_JPEG/K0E1oN6wC1eCok9LBmCiF1-d.jpg",
      "https://ldb-phinf.pstatic.net/20230315_121/1678871111129Gxb28_JPEG/1678871039613.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "소문난 성수 감자탕": {
    "matchedName": "소문난성수감자탕",
    "naverPlaceId": 11721256,
    "address": "서울특별시 성동구 연무장길 45",
    "lotAddress": "서울특별시 성동구 성수동2가 315-100",
    "latitude": 37.542837,
    "longitude": 127.054387,
    "naverMapLink": "https://map.naver.com/p/entry/place/11721256",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20191020_166/15715629787278M1Hw_JPEG/E69ekAleEjpoSsUzvkV3ROyG.jpg",
      "https://ldb-phinf.pstatic.net/20200611_102/15918567916517Y3NK_JPEG/Ybi-iCx9-NrK3KQBzbcRg4tj.jpg",
      "https://ldb-phinf.pstatic.net/20200630_171/1593473894596Nn5Ma_JPEG/dMFHb2q2HGjrVG7YLWXSC17S.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "성수 족발": {
    "matchedName": "성수족발",
    "naverPlaceId": 19862383,
    "address": "서울특별시 성동구 아차산로7길 7 동진빌딩 1층 성수족발",
    "lotAddress": "서울특별시 성동구 성수동2가 289-273 동진빌딩 1층 성수족발",
    "latitude": 37.546072,
    "longitude": 127.05437,
    "naverMapLink": "https://map.naver.com/p/entry/place/19862383",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250805_175/1754385368070EyDVm_PNG/5071.png",
      "https://ldb-phinf.pstatic.net/20250805_223/17543853779275snBm_PNG/5071.png",
      "https://ldb-phinf.pstatic.net/20250805_35/1754385389090jB2Xy_PNG/5071.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "높은산": {
    "matchedName": "높은산",
    "naverPlaceId": 1081045129,
    "address": "서울특별시 성동구 성수이로 18-1",
    "lotAddress": "서울특별시 성동구 성수동2가 535-2",
    "latitude": 37.5368643,
    "longitude": 127.054162,
    "naverMapLink": "https://map.naver.com/p/entry/place/1081045129",
    "rating": 4.81,
        "reviewCount": 1186,
    "images": [
      "https://ldb-phinf.pstatic.net/20220707_145/1657189436977vfmbu_JPEG/KakaoTalk_Photo_2022-07-07-19-23-33_001.jpeg",
      "https://ldb-phinf.pstatic.net/20220707_219/1657189487293IPbr3_JPEG/KakaoTalk_Photo_2022-07-07-19-23-33_002.jpeg",
      "https://ldb-phinf.pstatic.net/20230608_112/1686201597138Pc8Up_JPEG/KakaoTalk_Photo_2023-06-08-14-19-24_001.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "밀스": {
    "matchedName": "밀스",
    "naverPlaceId": 1250194088,
    "address": "서울특별시 성동구 뚝섬로4길 21 1층, 2층",
    "lotAddress": "서울특별시 성동구 성수동1가 275-6 1층, 2층",
    "latitude": 37.5388416,
    "longitude": 127.0507944,
    "naverMapLink": "https://map.naver.com/p/entry/place/1250194088",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20241001_220/1727755465017Vn5EU_JPEG/P1038192_copy.jpg",
      "https://ldb-phinf.pstatic.net/20241001_59/17277554549181gajc_JPEG/P1038226_copy.jpg",
      "https://ldb-phinf.pstatic.net/20240809_178/1723169950577e3wTR_JPEG/P1037596_copy.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "맥파이앤타이거": {
    "matchedName": "맥파이앤타이거 성수티룸",
    "naverPlaceId": 1038370038,
    "address": "서울특별시 성동구 성수이로 97 5층",
    "lotAddress": "서울특별시 성동구 성수동2가 315-108 5층",
    "latitude": 37.5436565,
    "longitude": 127.0566125,
    "naverMapLink": "https://map.naver.com/p/entry/place/1038370038",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20221011_90/1665460558866mndlg_JPEG/%BC%BA%BC%F6%C6%BC%B7%EB9.jpg",
      "https://ldb-phinf.pstatic.net/20231204_15/1701696381376phqHe_PNG/%BD%BA%C5%A9%B8%B0%BC%A6_2023-12-04_%BF%C0%C8%C4_4.02.56.png",
      "https://ldb-phinf.pstatic.net/20260421_289/1776751100524Tca6K_JPEG/DSCF2438.JPG"
    ],
    "checkedAt": "2026-06-30"
  },
  "커피로우스탠드": {
    "matchedName": "로우커피스탠드 성수점",
    "naverPlaceId": 1404930910,
    "address": "서울특별시 성동구 연무장길 94 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 272-30 1층",
    "latitude": 37.5411195,
    "longitude": 127.0595433,
    "naverMapLink": "https://map.naver.com/p/entry/place/1404930910",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230628_273/1687941792513IxAze_PNG/%B8%DE%B4%BA%C0%CC%B9%CC%C1%F6.png",
      "https://ldb-phinf.pstatic.net/20200608_154/1591582693057VcSd1_JPEG/9OPxCtXoKOnNBiNHIolyizFn.jpeg.jpg",
      "https://ldb-phinf.pstatic.net/20211010_272/16338371288369gSiL_JPEG/Kzdvv5zw5TAmo9aBjNXodtRH.jpeg.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "스탠드업플리즈": {
    "matchedName": "스탠드업플리즈",
    "naverPlaceId": 1306390433,
    "address": "서울특별시 성동구 연무장3길 14 1층 2호",
    "lotAddress": "서울특별시 성동구 성수동2가 302-24 1층 2호",
    "latitude": 37.5447929,
    "longitude": 127.0518223,
    "naverMapLink": "https://map.naver.com/p/entry/place/1306390433",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://pup-review-phinf.pstatic.net/MjAyNTEwMDdfMjAg/MDAxNzU5ODQ3OTA1MTYy.4ayRGbp8FXxsDijzY44NMAr7Cf6h9FjnthaopHHG_e4g.jEu6Ct3JhJSrVtBHM8ERGGgjGn6jM3gfrzd4VVYYpH0g.JPEG/2CAAE1EB-9E01-4A8E-9F2E-A7E7A81AED4F.jpeg",
      "https://pup-review-phinf.pstatic.net/MjAyNTEwMDdfMjQw/MDAxNzU5ODQ3OTA1MTEy.FL3dArixl6We2PknBM4vc_Dw-aXn6ppROrd6Yl7w-7wg.iTUB-N29lSDReEUae_EPwlqigGOq4JnOgxBR3NuOCjMg.JPEG/AA076D6D-82E6-4B31-819F-E992A29EF34D.jpeg",
      "https://pup-review-phinf.pstatic.net/MjAyNTExMTJfMzAw/MDAxNzYyOTU1NDM5MzI0.2NCWYJ-j7Cf1uXtAOVFFvVAhZRkin7tFUQs46elFpFsg.-GDv3Db6_pOzlIFFjdfGxlOqxYwnQGuyA-1vWdQp2LMg.JPEG/C995F46B-5984-40D4-9652-7645F30A5C2C.jpeg?type=w1500_60_sharpen"
    ],
    "checkedAt": "2026-06-30"
  },
  "뵈르뵈르": {
    "matchedName": "뵈르뵈르 성수점",
    "naverPlaceId": 2058486345,
    "address": "서울특별시 성동구 성수이로7가길 22 1층 2호",
    "lotAddress": "서울특별시 성동구 성수동2가 320-1 1층 2호",
    "latitude": 37.5420571,
    "longitude": 127.0555808,
    "naverMapLink": "https://map.naver.com/p/entry/place/2058486345",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20260323_150/1774249030069xs0RE_JPEG/%BE%C6%C0%CC%BD%BA%C5%A9%B8%B2.jpeg",
      "https://ldb-phinf.pstatic.net/20260401_180/1775032181994AxhRC_JPEG/%B4%F5%BA%ED.jpeg",
      "https://ldb-phinf.pstatic.net/20260401_291/1775032286249EElk6_JPEG/%BD%C4%BD%BA%C6%D1.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "자연도소금빵": {
    "matchedName": "자연도소금빵in 성수",
    "naverPlaceId": 1022429915,
    "address": "서울특별시 성동구 연무장길 56-1 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 321-74 1층",
    "latitude": 37.542326,
    "longitude": 127.0555087,
    "naverMapLink": "https://map.naver.com/p/entry/place/1022429915",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230814_195/1691999239582SBeqD_JPEG/KakaoTalk_20230814_164205841.jpg",
      "https://ldb-phinf.pstatic.net/20230821_10/1692624841117gCCt1_JPEG/KakaoTalk_20230821_223246131.jpg",
      "https://ldb-phinf.pstatic.net/20230821_289/1692624839026wemK5_JPEG/KakaoTalk_20230821_223251353.jpg"
    ],
    "checkedAt": "2026-06-30"
  },
  "코끼리베이글": {
    "matchedName": "코끼리베이글 성수",
    "naverPlaceId": 1543901744,
    "address": "서울특별시 성동구 성수이로26길 17 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 278-53 1층",
    "latitude": 37.5460779,
    "longitude": 127.0595824,
    "naverMapLink": "https://map.naver.com/p/entry/place/1543901744",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://pup-review-phinf.pstatic.net/MjAyNTEwMDhfNjEg/MDAxNzU5OTAwMjgwMzg0.AGWuZGyjNeE2tDxqbHrHIYZsaVhWWmfudQz0xYE_dI4g._0XuVKzP37btL_SZVNHJWhsAfg0P18IbVX3yzkST-Gkg.JPEG/1000039581.jpg.jpg?type=w1500_60_sharpen",
      "https://ldb-phinf.pstatic.net/20230130_144/1675004532064XV2GF_JPEG/FD87FA77-C527-4EA8-A8D4-113D8175FCAE.jpeg",
      "https://ldb-phinf.pstatic.net/20240506_85/1714984008578Yhfbd_JPEG/1A5345F7-EA67-4661-854D-24AB2C0D6A3E.jpeg"
    ],
    "checkedAt": "2026-06-30"
  },
  "차일디쉬": {
    "matchedName": "차일디쉬",
    "naverPlaceId": 1217287130,
    "address": "서울특별시 성동구 연무장길 114 2층 차일디쉬",
    "lotAddress": "서울특별시 성동구 성수동2가 275-12 2층 차일디쉬",
    "latitude": 37.5404568,
    "longitude": 127.0615718,
    "naverMapLink": "https://map.naver.com/p/entry/place/1217287130",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20230801_126/1690850935506jXnia_JPEG/AC1C62FF-0CBA-418E-B288-20EBDB87E525.jpeg",
      "https://ldb-phinf.pstatic.net/20231010_264/1696912910364i1mlT_JPEG/IMG_7504.jpeg",
      "https://ldb-phinf.pstatic.net/20260407_297/17755189384560yw98_PNG/IMG_5199.png"
    ],
    "checkedAt": "2026-06-30"
  },
  "마마젤라또": {
    "matchedName": "마망젤라또 성수점",
    "naverPlaceId": 1057884253,
    "address": "서울특별시 성동구 연무장9길 8 1층",
    "lotAddress": "서울특별시 성동구 성수동2가 315-18 1층",
    "latitude": 37.5429522,
    "longitude": 127.05596,
    "naverMapLink": "https://map.naver.com/p/entry/place/1057884253",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20250130_218/1738245841975sVEEB_JPEG/2cup.jpg",
      "https://ldb-phinf.pstatic.net/20250130_134/1738245889919tMqKm_JPEG/3cup.jpg",
      "https://ldb-phinf.pstatic.net/20250202_45/1738494779971qh6Xl_JPEG/IMG_3048_%281%29.JPG"
    ],
    "checkedAt": "2026-06-30"
  },
  "어니언": {
    "matchedName": "어니언 성수",
    "naverPlaceId": 38561949,
    "address": "서울특별시 성동구 아차산로9길 8 어니언",
    "lotAddress": "서울특별시 성동구 성수동2가 277-135 어니언",
    "latitude": 37.5446909,
    "longitude": 127.0581051,
    "naverMapLink": "https://map.naver.com/p/entry/place/38561949",
    "rating": null,
        "reviewCount": null,
    "images": [
      "https://ldb-phinf.pstatic.net/20240124_90/1706082401528Vyp3j_JPEG/%BE%C6%B8%DE.jpg",
      "https://ldb-phinf.pstatic.net/20240124_19/1706082437147oKDvv_JPEG/%C3%CA%C4%DD%B8%B4.jpg",
      "https://ldb-phinf.pstatic.net/20240124_284/1706084521562jFw7D_JPEG/%BA%A3%C0%CC%C4%BF%B8%AE_%C6%CE%B5%B5%B8%A3_6000.jpg"
    ],
    "checkedAt": "2026-06-30"
  }
};

const googleCheckedAt = "2026-06-30";
const googlePlaceData = {
  "해남닭집": {
    "rating": 4.1,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%95%B4%EB%82%A8%EB%8B%AD%EC%A7%91%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C13%EA%B8%B8%2046%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "정면": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%A0%95%EB%A9%B4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C13%EA%B8%B8%2088%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "동대문곱창": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%8F%99%EB%8C%80%EB%AC%B8%EA%B3%B1%EC%B0%BD%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%9A%9D%EC%84%AC%EB%A1%9C27%EA%B8%B8%2037%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "원조숯불소금구이": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%9B%90%EC%A1%B0%EC%88%AF%EB%B6%88%EC%86%8C%EA%B8%88%EA%B5%AC%EC%9D%B4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B4%91%EB%82%98%EB%A3%A8%EB%A1%9C12%EA%B8%B8%2019%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "서북면옥": {
    "rating": 4.1,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%84%9C%EB%B6%81%EB%A9%B4%EC%98%A5%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%9E%90%EC%96%91%EB%A1%9C%20199-1%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "은혜즉석떡볶이": {
    "rating": 4.1,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%9D%80%ED%98%9C%EC%A6%89%EC%84%9D%EB%96%A1%EB%B3%B6%EC%9D%B4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B4%91%EB%82%98%EB%A3%A8%EB%A1%9C%20381-1%202%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "아찌떡볶이": {
    "rating": 3.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%95%84%EC%B0%8C%EB%96%A1%EB%B3%B6%EC%9D%B4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C29%EA%B8%B8%2053%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "환이네갈비살": {
    "rating": 4.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%99%98%EC%9D%B4%EB%84%A4%EA%B0%88%EB%B9%84%EC%82%B4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C29%EA%B8%B8%2024%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "최신족발": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%B5%9C%EC%8B%A0%EC%A1%B1%EB%B0%9C%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C29%EA%B8%B8%2063%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "서소문순두부보쌈": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%84%9C%EC%86%8C%EB%AC%B8%EC%88%9C%EB%91%90%EB%B6%80%EB%B3%B4%EC%8C%88%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8F%99%EC%9D%BC%EB%A1%9C%20128%20%EC%9E%AC%ED%96%A5%EA%B5%B0%EC%9D%B8%ED%9A%8C%EA%B4%80%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "돕감자탕": {
    "rating": 3.9,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%8F%95%EA%B0%90%EC%9E%90%ED%83%95%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C31%EA%B8%B8%209%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "포크포크": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%8F%AC%ED%81%AC%ED%8F%AC%ED%81%AC%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8F%99%EC%9D%BC%EB%A1%9C22%EA%B8%B8%20117-16%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "김창훈포차": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EA%B9%80%EC%B0%BD%ED%9B%88%ED%8F%AC%EC%B0%A8%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C31%EA%B8%B8%2027%20%EC%A7%80%ED%95%98%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "시홍쓰": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%8B%9C%ED%99%8D%EC%93%B0%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C17%EA%B8%B8%205%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "송화산시도삭면": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%86%A1%ED%99%94%EC%82%B0%EC%8B%9C%EB%8F%84%EC%82%AD%EB%A9%B4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%9A%9D%EC%84%AC%EB%A1%9C27%EA%B8%B8%2048%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "빠오즈푸": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%B9%A0%EC%98%A4%EC%A6%88%ED%91%B8%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B4%91%EB%82%98%EB%A3%A8%EB%A1%9C%20373%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "매운향솥": {
    "rating": 4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A7%A4%EC%9A%B4%ED%96%A5%EC%86%A5%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8F%99%EC%9D%BC%EB%A1%9C18%EA%B8%B8%2061%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "송화양꼬치": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%86%A1%ED%99%94%EC%96%91%EA%BC%AC%EC%B9%98%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8F%99%EC%9D%BC%EB%A1%9C18%EA%B8%B8%2070%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "638DENO탄탄면": {
    "rating": 4.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=638DENO%ED%83%84%ED%83%84%EB%A9%B4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C13%EA%B8%B8%2081-1%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "브네": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%B8%8C%EB%84%A4%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B5%B0%EC%9E%90%EB%A1%9C%2070%20%EB%82%98%EB%8F%99%201%EC%B8%B5%20106%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "오코노미야키식당하나": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%98%A4%EC%BD%94%EB%85%B8%EB%AF%B8%EC%95%BC%ED%82%A4%EC%8B%9D%EB%8B%B9%ED%95%98%EB%82%98%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C13%EA%B8%B8%20111%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "멘쇼": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A9%98%EC%87%BC%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B5%B0%EC%9E%90%EB%A1%9C2%EA%B8%B8%203",
    "checkedAt": "2026-06-30"
  },
  "우마텐텐동": {
    "rating": 3.9,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%9A%B0%EB%A7%88%ED%85%90%ED%85%90%EB%8F%99%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EB%8F%99%EC%9D%BC%EB%A1%9C%20143%20%EC%84%B1%EC%88%98%EB%8C%80%EC%9A%B01%EC%B0%A8%20%EC%95%84%ED%8C%8C%ED%8A%B8%201%EC%B8%B5%20126%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "초라멘": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%B4%88%EB%9D%BC%EB%A9%98%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C13%EA%B8%B8%2080%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "호파스타": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%98%B8%ED%8C%8C%EC%8A%A4%ED%83%80%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B5%B0%EC%9E%90%EB%A1%9C3%EA%B8%B8%2023",
    "checkedAt": "2026-06-30"
  },
  "미분당": {
    "rating": 3.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%AF%B8%EB%B6%84%EB%8B%B9%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B5%B0%EC%9E%90%EB%A1%9C3%EA%B8%B8%2027%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "꾸아": {
    "rating": 4.8,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EA%BE%B8%EC%95%84%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%99%95%EC%8B%AD%EB%A6%AC%EB%A1%9C%2094-2%202%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "보난자": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%B3%B4%EB%82%9C%EC%9E%90%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C%20239-1%20B%EB%8F%99%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "꼬메노": {
    "rating": 4.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EA%BC%AC%EB%A9%94%EB%85%B8%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EA%B5%B0%EC%9E%90%EB%A1%9C7%EA%B8%B8%2029%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "최가회관": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%B5%9C%EA%B0%80%ED%9A%8C%EA%B4%80%20%EC%84%9C%EC%9A%B8%20%EA%B4%91%EC%A7%84%EA%B5%AC%20%EB%8A%A5%EB%8F%99%EB%A1%9C13%EA%B8%B8%2030%20%EC%A7%80%ED%95%981%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "잠수교집": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%9E%A0%EC%88%98%EA%B5%90%EC%A7%91%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C%20137%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "꿉당": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EA%BF%89%EB%8B%B9%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C20%EA%B8%B8%2010%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "땅코참숯구이": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%95%85%EC%BD%94%EC%B0%B8%EC%88%AF%EA%B5%AC%EC%9D%B4%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%ED%96%89%EB%8B%B9%EB%A1%9C17%EA%B8%B8%2026%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "성수동양갈비": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%84%B1%EC%88%98%EB%8F%99%EC%96%91%EA%B0%88%EB%B9%84%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%BC%EB%A1%9C12%EA%B8%B8%2033%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "능동미나리": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%8A%A5%EB%8F%99%EB%AF%B8%EB%82%98%EB%A6%AC%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A5%EA%B8%B8%2042%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "금금": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EA%B8%88%EA%B8%88%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C12%EA%B8%B8%2011%201%EC%B8%B5%20101%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "돼지공탕하우": {
    "rating": 4.9,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%8F%BC%EC%A7%80%EA%B3%B5%ED%83%95%ED%95%98%EC%9A%B0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C7%EA%B8%B8%2036%201%EC%B8%B5%202%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "실비옥": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%8B%A4%EB%B9%84%EC%98%A5%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C%20126",
    "checkedAt": "2026-06-30"
  },
  "조조칼국수": {
    "rating": 4.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%A1%B0%EC%A1%B0%EC%B9%BC%EA%B5%AD%EC%88%98%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%BC%EB%A1%9C8%EA%B8%B8%2055%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "칼": {
    "rating": 4.7,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%B9%BC%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C%20126%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "르프리크": {
    "rating": 4.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A5%B4%ED%94%84%EB%A6%AC%ED%81%AC%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A55%EA%B8%B8%209-16%20B103%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "bd버거": {
    "rating": 4.8,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=bd%EB%B2%84%EA%B1%B0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C14%EA%B8%B8%207%202%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "롸카두들": {
    "rating": 4.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A1%B8%EC%B9%B4%EB%91%90%EB%93%A4%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%BC%EB%A1%9C4%EA%B8%B8%2025%20%EC%84%9C%EC%9A%B8%EC%88%B2%EC%BD%94%EC%98%A4%EB%A1%B1%EB%94%94%EC%A7%80%ED%84%B8%ED%83%80%EC%9B%8C%20%EC%83%81%EA%B0%80%201%EC%B8%B5%20108%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "핑거팁스": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%95%91%EA%B1%B0%ED%8C%81%EC%8A%A4%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EA%B4%91%EB%82%98%EB%A3%A8%EB%A1%9C2%EA%B8%B8%2034-17%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "마오": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A7%88%EC%98%A4%20%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EB%9A%9D%EC%84%AC%EB%A1%9C4%EA%B8%B8%2021%20%EC%A7%80%ED%95%981%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "마하차이": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A7%88%ED%95%98%EC%B0%A8%EC%9D%B4%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EB%9A%9D%EC%84%AC%EB%A1%9C%20399%202%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "벱": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%B2%B1%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%BC%EB%A1%9C4%EA%B0%80%EA%B8%B8%202%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "남짐릇": {
    "rating": 4.8,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%82%A8%EC%A7%90%EB%A6%87%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A55%EA%B0%80%EA%B8%B8%2032%20%EC%A7%80%ED%95%981%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "페이퍼플레이트": {
    "rating": 4.7,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%8E%98%EC%9D%B4%ED%8D%BC%ED%94%8C%EB%A0%88%EC%9D%B4%ED%8A%B8%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C14%EA%B8%B8%2015%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "세스크멘슬": {
    "rating": 4.8,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%84%B8%EC%8A%A4%ED%81%AC%EB%A9%98%EC%8A%AC%20%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C14%EA%B8%B8%207%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "마리오네": {
    "rating": 4.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A7%88%EB%A6%AC%EC%98%A4%EB%84%A4%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EA%B4%91%EB%82%98%EB%A3%A8%EB%A1%9C2%EA%B8%B8%2023-1%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "피읻짜": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%94%BC%EC%9D%BB%EC%A7%9C%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C7%EA%B8%B8%2011%202%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "코치": {
    "rating": 4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%BD%94%EC%B9%98%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EB%8D%95%EC%A0%9517%EA%B8%B8%2011%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "가조쿠": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EA%B0%80%EC%A1%B0%EC%BF%A0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A5%EA%B8%B8%2031-2%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "소바마에니고": {
    "rating": 3.5,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%86%8C%EB%B0%94%EB%A7%88%EC%97%90%EB%8B%88%EA%B3%A0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A5%EA%B8%B8%2039-15%20%EC%A7%80%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "탐광": {
    "rating": 4.8,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%83%90%EA%B4%91%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A55%EA%B0%80%EA%B8%B8%2026%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "토리아에즈": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%86%A0%EB%A6%AC%EC%95%84%EC%97%90%EC%A6%88%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C7%EA%B8%B8%207%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "라무라": {
    "rating": 4.4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%9D%BC%EB%AC%B4%EB%9D%BC%20%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C12%EA%B8%B8%208%202%EC%B8%B5%20%EB%9D%BC%EB%AC%B4%EB%9D%BC%20%EC%84%B1%EC%88%98",
    "checkedAt": "2026-06-30"
  },
  "도죠": {
    "rating": 4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%8F%84%EC%A3%A0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C%20126%20A%EC%97%B4%205%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "죠죠": {
    "rating": 4.8,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%A3%A0%EC%A3%A0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A517%EA%B8%B8%207%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "성수속향연": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%84%B1%EC%88%98%EC%86%8D%ED%96%A5%EC%97%B0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C%2065%20%ED%98%91%EC%84%B1%EB%B9%8C%EB%94%A9%201%EC%B8%B5%20102%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "중앙감속기": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%A4%91%EC%95%99%EA%B0%90%EC%86%8D%EA%B8%B0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%BC%EB%A1%9C6%EA%B8%B8%207-1%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "영수분식": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%98%81%EC%88%98%EB%B6%84%EC%8B%9D%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EB%8D%95%EC%A0%9515%EA%B8%B8%202-12",
    "checkedAt": "2026-06-30"
  },
  "미정이네식당": {
    "rating": 4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%AF%B8%EC%A0%95%EC%9D%B4%EB%84%A4%EC%8B%9D%EB%8B%B9%20%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EB%8D%95%EC%A0%9515%EA%B8%B8%206-5",
    "checkedAt": "2026-06-30"
  },
  "소문난 성수 감자탕": {
    "rating": 4.1,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%86%8C%EB%AC%B8%EB%82%9C%20%EC%84%B1%EC%88%98%20%EA%B0%90%EC%9E%90%ED%83%95%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A5%EA%B8%B8%2045%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "성수 족발": {
    "rating": 4,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%84%B1%EC%88%98%20%EC%A1%B1%EB%B0%9C%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C7%EA%B8%B8%207%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "높은산": {
    "rating": 4.8,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%86%92%EC%9D%80%EC%82%B0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C%2018-1%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "밀스": {
    "rating": 4.7,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%B0%80%EC%8A%A4%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EB%9A%9D%EC%84%AC%EB%A1%9C4%EA%B8%B8%2021%201%2C2%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "맥파이앤타이거": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%A7%A5%ED%8C%8C%EC%9D%B4%EC%95%A4%ED%83%80%EC%9D%B4%EA%B1%B0%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C%2097%205%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "스탠드업플리즈": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%8A%A4%ED%83%A0%EB%93%9C%EC%97%85%ED%94%8C%EB%A6%AC%EC%A6%88%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A53%EA%B8%B8%2014%201%EC%B8%B5%202%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "뵈르뵈르": {
    "rating": 4.9,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EB%B5%88%EB%A5%B4%EB%B5%88%EB%A5%B4%20%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C7%EA%B0%80%EA%B8%B8%2022%201%EC%B8%B5%202%ED%98%B8",
    "checkedAt": "2026-06-30"
  },
  "자연도소금빵": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%9E%90%EC%97%B0%EB%8F%84%EC%86%8C%EA%B8%88%EB%B9%B5%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A5%EA%B8%B8%2056-1%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "코끼리베이글": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%BD%94%EB%81%BC%EB%A6%AC%EB%B2%A0%EC%9D%B4%EA%B8%80%20%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%9D%B4%EB%A1%9C26%EA%B8%B8%2017%201%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "차일디쉬": {
    "rating": 4.6,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%B0%A8%EC%9D%BC%EB%94%94%EC%89%AC%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%97%B0%EB%AC%B4%EC%9E%A5%EA%B8%B8%20114%202%EC%B8%B5",
    "checkedAt": "2026-06-30"
  },
  "텅 성수 스페이스": {
    "rating": 4.3,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%ED%85%85%20%EC%84%B1%EC%88%98%20%EC%8A%A4%ED%8E%98%EC%9D%B4%EC%8A%A4%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%84%B1%EC%88%98%EC%97%AD%20%EC%9D%B8%EA%B7%BC",
    "checkedAt": "2026-06-30"
  },
  "어니언": {
    "rating": 4.2,
    "reviewCount": null,
    "googleMapLink": "https://www.google.com/maps/search/?api=1&query=%EC%96%B4%EB%8B%88%EC%96%B8%20%EC%84%9C%EC%9A%B8%20%EC%84%B1%EB%8F%99%EA%B5%AC%20%EC%95%84%EC%B0%A8%EC%82%B0%EB%A1%9C9%EA%B8%B8%208%201-2%EC%B8%B5",
    "checkedAt": "2026-06-30"
  }
};

const usefulRestaurantImage = (url) => typeof url === "string" && !url.includes("map_roadview");
const mergeRestaurantImages = (...groups) => {
  const urls = groups.flat().filter(usefulRestaurantImage);
  return [...new Set(urls)];
};

const RESTAURANTS = rawRestaurants.map((item, index) => {
  const [name, category, rating, comment, signatureMenu, jaeComment] = item;
  const verifiedPlace = verifiedPlaceData[name];
  const kakaoPlace = kakaoPlaceData[name];
  const naverPlace = naverPlaceData[name];
  const googlePlace = googlePlaceData[name];
  const isPending = pendingRestaurantNames.has(name);
  const displayPlace = kakaoPlace || naverPlace || verifiedPlace;
  const ring = Math.floor(index / 8) + 1;
  const angle = (index * 47 * Math.PI) / 180;
  const fallbackLat = seongsuRestaurantNames.has(name) ? seongsuBaseLat : baseLat;
  const fallbackLng = seongsuRestaurantNames.has(name) ? seongsuBaseLng : baseLng;
  const areaKeyword = seongsuRestaurantNames.has(name) ? "성수" : "건대";
  const latitude = +(fallbackLat + Math.sin(angle) * 0.0017 * ring).toFixed(6);
  const longitude = +(fallbackLng + Math.cos(angle) * 0.0022 * ring).toFixed(6);
  const mapSearchText = displayPlace ? `${displayPlace.address} ${name}` : `${areaKeyword} ${name}`;
  const searchQuery = encodeURIComponent(mapSearchText);
  const platformRatings = {
    kakao: {
      label: "카카오",
      rating: kakaoPlace?.rating ?? null,
      reviewCount: kakaoPlace?.ratingCount ?? kakaoPlace?.reviewCount ?? null,
      checkedAt: kakaoPlace?.checkedAt ?? null,
      note:
        kakaoPlace?.rating != null
          ? "카카오 공개 평점"
          : kakaoPlace
            ? "카카오 평점 미표시"
            : "카카오 평점 미확인",
    },
    naver: {
      label: "네이버",
      rating: naverPlace?.rating ?? null,
      reviewCount: naverPlace?.reviewCount ?? null,
      checkedAt: naverPlace?.checkedAt ?? null,
      note:
        naverPlace?.rating != null
          ? "네이버 공개 평점"
          : naverPlace
            ? "네이버 평점 미표시"
            : "네이버 평점 미확인",
    },
    google: {
      label: "구글",
      rating: googlePlace?.rating ?? null,
      reviewCount: googlePlace?.reviewCount ?? null,
      checkedAt: googlePlace?.checkedAt ?? null,
      note:
        googlePlace?.rating != null
          ? "구글 공개 평점"
          : googlePlace
            ? "구글 평점 미표시"
            : "구글 평점 미확인",
    },
  };

  return {
    id: name.replace(/\s+/g, "-").toLowerCase(),
    name,
    area: areaKeyword,
    category,
    rating,
    comment,
    signatureMenu,
    menuItems: kakaoPlace?.menuItems?.length ? kakaoPlace.menuItems : buildMenuItems(signatureMenu),
    priceRange: kakaoPlace?.priceRange || priceByCategory[category],
    priceSource: kakaoPlace?.menuUpdatedAt ? `카카오맵 메뉴 기준 · ${kakaoPlace.menuUpdatedAt}` : "카카오맵 메뉴 가격 미표시",
    verifiedAt: isPending ? null : kakaoPlace?.checkedAt || (verifiedPlace ? addressVerifiedAt : null),
    verificationStatus: isPending ? "검증전" : kakaoPlace || verifiedPlace ? "검증후" : "검증전",
    verificationNote: isPending
      ? "사용자 입력으로 추가된 검증 전 맛집입니다. 플랫폼 평점, 메뉴, 가격은 추후 확인 필요."
      : kakaoPlace
        ? `카카오맵 상세/메뉴 API 기준 반영${kakaoPlace.matchedName !== name ? ` · 등록명: ${kakaoPlace.matchedName}` : ""}`
        : verifiedPlace
          ? `네이버 모바일 지도 검색 결과 기준 주소/좌표 반영${verifiedPlace.matchedName !== name ? ` · 등록명: ${verifiedPlace.matchedName}` : ""}`
          : "정확 주소, 플랫폼 평점, 메뉴 가격 수동 확인 필요",
    mood: moodByCategory[category],
    jaeComment,
    searchKeyword: mapSearchText,
    naverMapLink: naverPlace?.naverMapLink || `https://map.naver.com/p/search/${searchQuery}`,
    kakaoMapLink: kakaoPlace?.kakaoMapLink || `https://map.kakao.com/link/search/${searchQuery}`,
    googleMapLink: googlePlace?.googleMapLink || `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
    platformRatings,
    address: displayPlace?.address || (seongsuRestaurantNames.has(name) ? "서울 성동구 성수역 인근" : "서울 광진구 건대입구역 인근"),
    latitude: displayPlace?.latitude || latitude,
    longitude: displayPlace?.longitude || longitude,
    images: mergeRestaurantImages(naverPlace?.images || [], kakaoPlace?.images || [], [CATEGORY_META[category].image]),
    recommendedOrder: index + 1,
  };
});
