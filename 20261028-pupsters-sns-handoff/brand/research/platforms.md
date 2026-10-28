# Pupsters / 사고멍치 플랫폼 출시 비용·요건 조사

조사일: 2026-10-27 (Asia/Seoul)
범위: 강아지 캐릭터 2D Roblox 게임의 첫 공개 및, 나중의 독립 모바일·Steam 출시. 계정 생성, 업로드, 구매는 하지 않았다. 금액은 환율로 환산하지 않고 USD/Robux 원문 단위를 유지했다.

## 요약 판단

첫 공개는 Roblox에서 시작하는 편이 초기 현금비용을 가장 낮게 유지할 수 있다. 현재 기본 공개 경로는 **age-checked 16+와 Trusted Friends**이며, 이 경로에 1,000 Robux 수수료는 필수가 아니다. Kids/Select를 포함한 **모든 연령**으로 확장할 때만 추가 신원·2FA·심사 및 Plus/Premium 2개월 또는 환급형 수수료 경로가 생긴다. 독립 iOS/Android/Steam판은 같은 Luau 프로젝트를 버튼 한 번으로 포팅하는 경로가 아니다. 별도 앱/PC 빌드, 스토어 자료·심사·테스트·플랫폼 기능 구현과 QA를 계획해야 한다. 이는 플랫폼 문서가 서로 다른 빌드/스토어 등록 흐름을 요구한다는 점에 근거한 **기획상 추론**이며, 엔진 선택과 포팅 견적은 아직 미확인이다.

## 검증된 비용·출시 조건

| 플랫폼 | 선행 비용 | 반복/선택 비용 | 판매·수익 배분 | 공개/출시의 핵심 조건 |
|---|---|---|---|---|
| **Roblox** | Studio에서 경험을 클라우드에 게시하는 기본 절차에 별도 현금·Robux 가격은 게시 문서에 명시되지 않는다. **16+ / Trusted Friends 공개에는 게시 수수료가 필수가 아님.** 커뮤니티(구 그룹) 생성만 **커뮤니티당 100 Robux 일회성**. | Kids/Select를 포함한 **모든 연령** 공개·도달범위 확장 시, 최근 2개월 연속 Roblox Plus 또는 Premium이 없으면 **게임당 1,000 Robux 환급형 게시 수수료** 또는 **50,000 Robux 환급형 신속 검토 수수료** 중 선택 가능. 전자는 60일 동안 중재 없이 고참여 플레이어 25명을 유지하면 환급, 후자는 90일 뒤 환급 요청 가능. Plus/Premium의 한국 가격은 계정 결제 화면에서만 재확인해야 한다. | 게임패스·개발자 상품 등 인앱 구매는 문서상 창작자에게 **Robux 지출의 70%**, Roblox Marketplace Fee 30%. DevEx는 현금화 요건 충족 시에만 해당. | 기본 공개: 계정이 정상 상태·생성 후 2일 이상이고 age check를 완료, 성숙도 첫 질문에 답하면 16+ 또는 (제한 콘텐츠면) age-verified 18+에게 공개. 모든 연령 확장: 앞 요건 + 미성년은 facial estimation/성인은 정부 ID, 2FA, Plus/Premium 2개월 **또는** 환급형 수수료, Kids/Select 평가 통과, 전체 설문 및 Minimal/Mild/Moderate(9+) 등급이 필요. 기본 썸네일만으로는 홈 추천 노출 대상이 아님. |
| **Apple App Store (나중 iOS)** | Apple Developer Program은 **연 US$99** (일부 지역 현지통화 표기, 세금이 붙을 수 있음). 무료 Apple Developer 등록은 개인 기기 테스트용이며 App Store 배포는 유료 Program 대상. | 연회비. 한국 내 결제 금액·부가세/결제통화는 가입 시 확인. Enterprise **US$299/년**은 직원용 사내 비공개 배포라 일반 소비자 게임용이 아님. | 표준 디지털 앱·인앱 판매 수수료는 **30%**. 승인된 App Store Small Business Program은 **15%**이며, 연결된 계정 포함 연간 proceeds가 US$1m를 초과하면 해당 연도 잔여 기간 표준 수수료 적용. 자동갱신 구독은 1년 초과 고객 갱신분 15%가 표준 규정. | 개인/조직 가입 가능. 개인은 2FA Apple Account와 법적 이름 등이 필요하고, 조직은 법인·D-U-N-S·도메인 이메일/웹사이트 요건이 있다. App Store 배포에는 앱 심사, 필수 연령등급 정보가 필요. |
| **Google Play (나중 Android)** | Play Console 등록 **US$25 일회성**. 18세 이상, 개발자 배포 계약 동의 및 계정 유형/신원 확인 절차가 필요; 위치별 허용 결제수단이 다를 수 있음. | 반복 등록비는 이 공식 문서에 없음. 새 개인 계정은 Android 기기 접근 확인도 요구될 수 있음. | 한국은 Google의 현 문서상 ‘새 2026 요금 롤아웃’의 명시 대상(EEA/UK/US/Australia/Japan) 밖의 남은 시장에 속하는 것으로 읽힌다. 15% 서비스 수수료 tier 가입 개발자는 연간 첫 US$1m 15%, 초과 30%; 자동갱신 구독 15%. 한국에서 허용된 Alternative Billing System 거래는 해당 Play Billing 수수료에서 4%p 인하라고 명시. 프로그램 선택/향후 전세계 롤아웃은 출시 직전 다시 확인. | **2023-11-13 이후 생성된 개인 계정**은 production 접근 전, 앱별 closed test에 **최소 12명**이 **연속 14일** opt-in 상태여야 하고 production access를 신청해야 함. internal test는 이 요건 없음. |
| **Steam (나중 PC)** | Steam Direct는 출시 제품(앱)당 **US$100 또는 현지통화 상당액**. 환불 불가지만 Steam Store/인앱 구매의 Adjusted Gross Revenue가 **US$1,000**에 도달한 뒤 지급에서 회수 가능. 해당 수수료에 국가별 VAT/GST 등 소비세가 붙을 수 있음. | 제품마다 Direct fee. Valve가 문서상 해당 국가 소비세를 부과할 수 있음. | Valve의 2018 공개 공지는 US$10m 초과분 75/25, US$50m 초과분 80/20의 단계와 (그 전 단계의) 70/30을 설명한다. 그러나 현재 적용 계약은 Steam Distribution Agreement/파트너 조건으로 확인해야 하며, 이 공개 공지만으로 2026 한국 정산의 확정값이라고 단정하지 않는다. | 앱 수수료 결제일 뒤 **30일**이 지나야 출시 가능. 공개 Coming Soon 페이지를 **최소 2주** 유지하고, 스토어 페이지와 거의 최종 빌드를 Valve 검토에 제출·승인받아야 출시 가능. Store page/빌드 준비 및 가격 설정도 필요. |

## Roblox: 비용 없이 먼저 할 수 있는 발견·홍보 수단

다음은 광고비를 쓰지 않는 범위의 현재 기능이다. 노출 자체는 보장되지 않는다.

- 정확한 제목·설명·고유한 아이콘/커스텀 썸네일을 만들고, 실제 게임과 메타데이터를 일치시킨다. 홈 추천은 유저 만족·참여·재방문 신호에 따라 동작하며, 커스텀 썸네일은 홈 추천 impression의 필수 조건이다.
- 공개 경험 상세 페이지, 검색, 친구 참여, 직접 공유 링크와 SNS 공유를 활용한다. 이들은 추천 후보가 되는 데 도움을 줄 수 있지만 광고로 유입된 이용자의 신호는 RFY 순위 신호에 포함되지 않는다고 Roblox가 설명한다.
- 업데이트 공지는 opt-in 이용자에게 알림 스트림으로 보낼 수 있으며 3일에 한 번, 60자 제한이다. 이벤트는 상세 페이지·공유 링크·게임 상세 페이지에서 발견될 수 있고, 이용자는 알림을 신청할 수 있다.
- 공공 이벤트가 시작 7일 내이고 RSVP 1,000명 이상이면 `Trending Events in Experiences` 기준을 충족할 수 있다. 이는 선정·노출 보장이 아니라 차트 자격 조건이다.
- Off-Platform Featuring은 이벤트를 제출해 선정될 경우 Roblox의 외부 채널·앱 스토어에 무료로 소개될 수 있으나, 13세 이상·연결 이메일, 공개 이벤트, 시작 7일 전 제출, 성과/추세 판단 등 조건이 있으며 Roblox의 선택형 프로그램이다.
- 커뮤니티는 팬 공지·역할 관리에는 유용하지만 만들려면 100 Robux가 든다. 처음에는 개인 소유 경험과 무료 공유로 검증하고, 팀 권한·브랜드 커뮤니티가 필요해질 때만 고려하는 편이 비용상 단순하다.

유료 수단(참고): Sponsored Ads/Ads Manager는 광고 예산이 필요하므로 ‘무료 홍보’에는 포함하지 않았다.

### Roblox에서 SNS 링크를 둘 수 있는 위치와 한계

게임/커뮤니티의 외부 SNS 링크는 **게임의 메인 상세 페이지** 또는 **커뮤니티 프로필**의 공식 Social Links에만 둔다. 게임 안 텍스트·UI·설명에는 외부 URL/Discord 초대 등을 직접 표시하거나 공유할 수 없다. 게임 상세 페이지에서 ‘링크는 게임 페이지에서 확인’처럼 안내하는 것은 허용 예시다.

- 추가 권한: 제작자(또는 커뮤니티/그룹 소유 게임의 적격 협업자)가 facial age estimation 또는 정부 ID로 **16세 이상 age check**를 마쳐야 한다. 미검증/16세 미만이면 게임·커뮤니티 링크 UI가 숨겨진다.
- 가시성: 링크는 **age-checked 16+ 이용자에게만** 보이며, 16세 미만 또는 age check 미완료 이용자는 볼 수 없다. 따라서 어린 이용자가 많은 Pupsters의 핵심 유입 수단으로는 신뢰하면 안 된다.
- 수량/종류: 최대 3개, 같은 SNS 유형은 한 번만 가능. 공식 지원 유형은 Facebook, Twitter/X, YouTube, Twitch, Discord, Guilded, Roblox community다.
- 설정 위치: Creator Dashboard의 게임 선택 → `Engagement > Social Links`; 커뮤니티는 `Group Profile > Social Links` 또는 `Configure Community > Social Links`. 커뮤니티/그룹 소유 게임에는 16+ age-checked 협업자가 최소 한 명 있어야 하며, 그런 협업자가 모두 떠나면 기존 링크는 90일 뒤 자동 삭제된다.

## DevEx: 지금 비용이 아니라, 수익 발생 뒤의 체크

DevEx는 필수 선행비용이나 자동 현금화가 아니다. 현금화 신청에는 적어도 13세, **30,000 Earned Robux**, Roblox 인증 이메일, 유효한 DevEx Portal 계정, 비미국 납세자는 **W-8**(미국 납세자는 W-9), 약관/Community Standards 준수가 필요하다. 2026-10-27 기준 표준 환율은 Earned Robux 1개당 US$0.0038 (30,000 = US$114)이나 Roblox는 적격 여부를 요청마다 검토하고, 환율·세무 처리는 변할 수 있다. 한국 거주자의 원천징수·소득/사업자 처리 및 지급수단 비용은 이 조사에서 확정하지 않았다.

## 한국 관련: 확인된 것과 미확인 범위

**확인됨:** Apple은 한국 App Store용 지역 연령등급을 요구하며, 심사 중 GRAC의 공식 등급이 기존 등급과 다르면 RCN(등급분류번호)과 새 버전을 요구할 수 있다. 특히 빈번/강한 모의 도박 콘텐츠가 있는 앱·게임은 RCN 없이는 한국 App Store 이용이 불가하다고 Apple이 명시한다. 이 강아지 2D 게임의 실제 등급은 기능(채팅·UGC·광고·랜덤 유료 아이템 등)과 출시 빌드가 정해져야 판단 가능하다.

**미확인/출시 직전 확인:** 한국의 Roblox Plus/Premium 실제 결제액·세금, Apple/Google/Steam 결제 시 최종 부가세와 카드/환전비, Android/Steam의 한국 게임 등급·사업자·세무 의무, 스토어별 판매자 지급·원천징수, Google의 향후 수수료 전세계 롤아웃 및 Steam 계약상 정확한 배분율. 이들은 의도적으로 추정·계산하지 않았다.

## 최소 계정 체크리스트

### 지금: Roblox MVP 공개 전

1. 개인 Roblox 계정 보안(강한 비밀번호·2단계 인증) 및 제작자 이메일을 정리한다.
2. Studio에서 경험을 게시하고, 게임명·설명·아이콘·고유 썸네일·콘텐츠 성숙도 설문·대상 접근을 채운다.
3. 소규모 테스터로 playtest/early tester를 진행한 뒤, 우선 정상 상태·생성 2일 이상 계정의 age check와 성숙도 첫 질문으로 **16+ / Trusted Friends 기본 공개**가 가능한지 확인한다. ‘모든 연령’ 확장을 택할 때에만 추가 2FA·계정 검증·Kids/Select 평가와 Plus/Premium 2개월 또는 1,000 Robux 환급형 게시 수수료 경로를 실제 대시보드에서 재확인한다.
4. 수익이 생긴 뒤에만 커뮤니티(100 Robux), 유료 광고, 게임패스/개발자 상품, DevEx를 차례로 검토한다.

### 나중: 독립 모바일/Steam 포트 착수 전

1. 별도 게임 빌드/엔진·백엔드·계정/저장·결제 기능·스토어 소재의 범위를 견적한다. Roblox Luau 자산과 로직의 재사용 가능 부분을 기술 검증한다.
2. iOS: 배포 시점에 개인 대 조직 가입을 선택하고, 연 US$99 및 한국 결제·세금을 확인한다. App Store Connect 메타데이터·연령등급·개인정보 처리 항목을 준비한다.
3. Android: Play Console US$25를 지불하기 전 계정 유형을 정하고, 새 개인 계정이면 12명/14일 closed testing에 필요한 실제 테스터를 확보한다.
4. Steam: 출시 희망일 최소 30일 이상 전에 제품당 US$100 및 세금을 확인하고, 이미지·설명·트레일러/스크린샷·빌드를 준비해 Coming Soon 2주와 검토 일정을 역산한다.

## 공식 출처 (접근 가능한 공개 페이지)

- Roblox: [게임 게시·16+ 기본 공개·모든 연령 확장·환급형 수수료](https://create.roblox.com/docs/production/publishing/publish-games-and-places), [커뮤니티 생성 100 Robux](https://en.help.roblox.com/hc/en-us/articles/203313730-How-to-create-a-Community), [SNS 링크 조건·위치](https://create.roblox.com/docs/production/promotion/social-media-links), [Community Standards의 외부 링크 금지/예외](https://en.help.roblox.com/hc/en-us/articles/203313410-Roblox-Community-Standards), [Discovery](https://create.roblox.com/docs/discovery), [이벤트·업데이트·Off-Platform Featuring](https://create.roblox.com/docs/production/promotion/experience-events), [수익화/70% 안내](https://create.roblox.com/docs/get-started/monetization), [DevEx](https://create.roblox.com/docs/production/monetization/developer-exchange).
- Apple: [한국 Developer Program 등록/US$99](https://developer.apple.com/kr/programs/enroll/), [멤버십·표준/Small Business 수수료](https://developer.apple.com/programs/whats-included/), [Apple Developer Program License Agreement](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/), [한국 연령등급/RCN](https://developer.apple.com/kr/help/app-store-connect/manage-app-information/set-an-app-age-rating/).
- Google: [Play Console 시작/US$25·신원 확인](https://support.google.com/googleplay/android-developer/answer/6112435), [신규 개인 계정 12명·14일 테스트](https://support.google.com/googleplay/android-developer/answer/14151465), [서비스 수수료](https://support.google.com/googleplay/android-developer/answer/112622).
- Steam: [Steam Direct fee](https://partner.steamgames.com/doc/gettingstarted/appfee?l=english), [Steam Direct 시작·30일](https://partner.steamgames.com/steamdirect/), [Coming Soon 2주](https://partner.steamgames.com/doc/store/coming_soon), [출시 절차](https://partner.steamgames.com/doc/store/releasing?l=english), [세금 FAQ](https://partner.steamgames.com/doc/finance/taxfaq?l=english), [Valve의 2018 단계형 revenue-share 공식 공지](https://steamcommunity.com/groups/steamworks/announcements/detail/1697191267930157838?l=english).
