# 사고멍치 · 게임 개편 및 3채널 통합 인수인계

전달일 **2026-10-28 / Asia·Seoul**. 이번 묶음은 **다음 GPT에게 실제 수정을 맡기기 위한 요청서**입니다. 게임 수정, 새 일러스트 제작, 실기기 QA가 완료된 빌드는 아닙니다.

## 다음 작업 시작

1. [START_HERE.md — 그대로 전달할 작업 요청](START_HERE.md)
2. [UI·맵·일러스트·레벨·재화 수정 요청](UI_PROGRESSION_REWORK_REQUEST.md)
3. [14종·공격·조합·특전·밸런스 수정 요청](PUPSTERS_GAMEPLAY_REWORK_REQUEST.md)
4. [게임·강아지툰 SNS·키즈 YouTube 운영안](THREE_CHANNEL_OPERATIONS.md)
5. [최신 사용자 요청 원문](USER_REQUESTS_20261028.md)

[**통합 ZIP 다운로드**](https://github.com/zaelee/ZZEE/raw/refs/heads/gh-pages/20261028-pupsters-game-ui-handoff/pupsters-complete-handoff-20261028.zip)

ZIP을 풀면 이 폴더와 `20261028-pupsters-sns-handoff`가 나란히 생깁니다. 두 폴더의 상대 위치를 유지하면 참고 문서·브랜드 HTML·만화를 오프라인에서 열 수 있습니다. 원래 SNS 전달본의 ZIP도 함께 보존했습니다. 현재 통합 ZIP 자체는 ZIP 안에 다시 넣지 않습니다.

## 포함된 결정

- 가로 전투 맵, 강아지 소환·설치 창, 맵 선택 미리보기, 빌리지 배치, 전체 모달·설정창 재설계.
- C–S 티어 아이콘·테두리·상승 연출 통일, 스킨의 진화·공격/지원 모션 필수 제작.
- 기존 2D의 분리된 색면·작은 코·점눈·일관된 선 유지. 실제 플레이에서 공격 시 캐릭터가 작아지는 문제 교정.
- 기본 6종 외 8종을 5레벨마다 해금, 레벨당 특전 1포인트. 기존 30포인트 한도와의 관계는 제안과 확정을 구분.
- 견종 사용량 기반 조각, 직접 공격 없는 지원견의 기여 인정, 스킨 티켓 보너스 중복 금지, 희귀 재화 멍코인·스킨 최소 10멍코인.
- 골든 보급 삭제·지원견 개편, 속성 반응·시바 오총사·5종 영구 합체 추적대와 처치 성장.
- 다음 담당자에게 실제 구현·QA·밸런스 조정 및 조합 트리별 스킨 콘셉트 이미지 제작 요청.

## 함께 전달되는 기존 자료

- [브랜드와 3채널 보고서](../20261028-pupsters-sns-handoff/brand/index.html)
- [SNS 인수인계](../20261028-pupsters-sns-handoff/HANDOFF.md) · [최신 4컷 〈좋은 자리〉](../20261028-pupsters-sns-handoff/comic/EP01-good-spot.png)
- [만화 제작 규칙](../20261028-pupsters-sns-handoff/comic/workflow-notes.txt) · [선 두께 기준](../20261028-pupsters-sns-handoff/reference/line-weight-spec.json)
- [키즈 채널 계획](../20261028-pupsters-sns-handoff/brand/kids-channel-plan.json) · [키즈 파일럿 대본](../20261028-pupsters-sns-handoff/kids/2026-10-27/KIDS01/script.txt)
- [기존 2D 게임·에셋](https://github.com/zaelee/ZZEE/tree/gh-pages/20261026-pupsters-2d) — 별도 저장소 폴더이며 통합 ZIP에 게임 전체를 복제하지 않음.

## 먼저 알아둘 것

- **이번 UI·진행 요청 → 이번 전투 MD → 과거 SNS·브랜드 자료** 순서로 최신 결정을 적용합니다. 단, 새 요청에 없는 설정은 임의로 폐기하지 않습니다.
- 과거 자료의 불돔·공기탄·골든 보급·모더콜리 직접 피해는 최신 전투 사양보다 우선하지 않습니다. 기존 ID와 저장 데이터는 보존하며 표시·효과를 수정합니다.
- 현재 14종과 빌리지 UI를 포함한 최신 실행 프로젝트는 이 문서 작성 중 확인하지 않았습니다. 과거 6종 시제품을 최신 게임 전체로 착각하지 않습니다.
- 브랜드 조사 기준일은 **2026-10-27**입니다. 비용·정책·상표·계정 가용성은 새로 검증한 정보가 아닙니다.
- 최신 만화는 **사용자 검토 대기**, 키즈 파일럿은 **대본 단계**입니다. 계정 개설·게시·자동화 이전은 이 자료를 받는 것만으로 실행되지 않습니다.
- 전달본의 파일·링크·계산 검사는 [checks.json](checks.json), 파일 해시는 [file-manifest.json](file-manifest.json)에 기록합니다. 실제 게임 QA와 구분합니다.
