# 음악 파일별 사용처

2026-10-29 · 아래 파일은 모두 임시 편집 후보다. 실제 적용 상태는 미연결이며 자산 ID는 비어 있다. 요청 BPM은 실측 템포가 아니다.

A/B 원본 후보는 [음악 릴리스](https://github.com/zaelee/ZZEE/releases/tag/pupsters-music-20261029)에서 받는다. 이 폴더의 가벼운 OGG는 A안 후보 1의 WAV 편집본에서 만든 배포용 사본이다.

## BGM 34개

| ID | 우선순위 | 사용처·현재 기획 상태 | 파일·길이 | 전환·적용 메모 |
| --- | --- | --- | --- | --- |
| M01 | P0 | 제목·메인 시작 화면<br>현재 화면 | [M01 OGG](audio/bgm/PUP_MUS_M01_A_v01_take01_loop_draft.ogg) · 75.29초 | 메인 테마를 먼저 승인해 후속곡의 음색 기준으로 사용. |
| M02 | P0 | Pupsters Village 낮<br>현재 화면 | [M02 OGG](audio/bgm/PUP_MUS_M02_A_v01_take01_loop_draft.ogg) · 102.13초 | 가게를 잠깐 눌러도 기본곡 유지. 물소리는 별도 환경음. |
| M03 | P0 | Pupsters Village 밤<br>현재 화면 | [M03 OGG](audio/bgm/PUP_MUS_M03_A_v01_take01_loop_draft.ogg) · 106.67초 | 낮→밤 크로스페이드. 밤 전환 시 급격한 음량 차이 금지. |
| M04 | P0 | 모드·맵·난이도 선택 공용<br>현재 화면 | [M04 OGG](audio/bgm/PUP_MUS_M04_A_v01_take01_loop_draft.ogg) · 73.85초 | 맵 카드/이지·보통·하드 전환마다 곡 재시작하지 않음. |
| M05 | P0 | 랜덤 매칭·초대·참여·준비 대기<br>현재 기능 | [M05 OGG](audio/bgm/PUP_MUS_M05_A_v01_take01_loop_draft.ogg) · 70.00초 | 연결 오류·친구 입장 소리는 별도 징글. 대기곡은 끊지 않음. |
| M06 | P0 | 모든 스테이지 로딩·전환<br>현재 화면 | [M06 OGG](audio/bgm/PUP_MUS_M06_A_v01_take01_loop_draft.ogg) · 20.87초 | 맵별 로딩곡 신규 생성 대신 해당 맵곡의 인트로 편집본도 활용. |
| M07 | P0 | 스토리 장난감 방 일반 전투<br>현재 맵 room | [M07 OGG](audio/bgm/PUP_MUS_M07_A_v01_take01_loop_draft.ogg) · 107.59초 | 블록 장난감과 따뜻한 방 콘셉트. 실제 장난감 충돌음은 BGM에 넣지 않음. |
| M08 | P0 | 장난감 방 후반 긴장 구간<br>현재 맵 room의 신규 편곡 | [M08 OGG](audio/bgm/PUP_MUS_M08_A_v01_take01_loop_draft.ogg) · 105.00초 | 같은 곡을 빠르게 재생하지 않고 별도 편곡. R1~40 세부 진입점은 구현 때 결정. |
| M09 | P0 | 뒷마당 산책길 일반 전투<br>현재 맵 garden | [M09 OGG](audio/bgm/PUP_MUS_M09_A_v01_take01_loop_draft.ogg) · 104.00초 | 바람·새·발소리는 별도 환경음. 은신/감속 경고를 음악으로 대체하지 않음. |
| M10 | P0 | 뒷마당 후반·빠른 적 집중 구간<br>현재 맵 garden의 신규 편곡 | [M10 OGG](audio/bgm/PUP_MUS_M10_A_v01_take01_loop_draft.ogg) · 101.82초 | 압박 편곡은 적 소리와 겹치는 촘촘한 고음 금지. |
| M11 | P0 | 한밤의 토이샵 일반 전투<br>현재 맵 shop | [M11 OGG](audio/bgm/PUP_MUS_M11_A_v01_take01_loop_draft.ogg) · 102.86초 | 한밤이지만 밝은 강아지 세계 유지. 긴 공포 드론 금지. |
| M12 | P0 | 토이샵 후반·다층 장난감 집중<br>현재 맵 shop의 신규 편곡 | [M12 OGG](audio/bgm/PUP_MUS_M12_A_v01_take01_loop_draft.ogg) · 103.38초 | 금속성 충격음이 BGM에 반복되지 않게 조절. |
| M13 | P0 | 협동 전투<br>현재 맵 duo_yard | [M13 OGG](audio/bgm/PUP_MUS_M13_A_v01_take01_loop_draft.ogg) · 108.39초 | 협동 양쪽 구역에서 BGM을 두 겹 틀지 않고 클라이언트당 한 곡 재생. |
| M14 | P0 | 무한 도전 초중반<br>현재 맵 endless_room | [M14 OGG](audio/bgm/PUP_MUS_M14_A_v01_take01_loop_draft.ogg) · 152.38초 | 라운드마다 재시작하지 않음. 긴 세션 반복 청취 검사 필요. |
| M15 | P0 | 후반 압박·고기록 도전<br>현재 맵 endless_room의 신규 편곡 | [M15 OGG](audio/bgm/PUP_MUS_M15_A_v01_take01_loop_draft.ogg) · 153.04초 | 100라운드 보상 때 J12만 겹쳐 짧게 재생, 영구 승리 엔딩으로 취급하지 않음. |
| M16 | P0 | 블록사우루스·오버클록 골렘 공용 보스전<br>현재 보스용 신규곡 | [M16 OGG](audio/bgm/PUP_MUS_M16_A_v01_take01_loop_draft.ogg) · 102.86초 | 주요 보스 상태 전환에만 사용. 작은 강화 몹마다 보스곡으로 갈아타지 않음. |
| M17 | P1 | 스킨·도감·가방 공용<br>현재 화면, 별도 BGM 추가안 | [M17 OGG](audio/bgm/PUP_MUS_M17_A_v01_take01_loop_draft.ogg) · 78.37초 | 빌리지 모달을 잠깐 열면 M02/M03 유지. 긴 전용 화면일 때만 사용. |
| M18 | P1 | 조각·티어 업그레이드<br>현재 화면, 별도 BGM 추가안 | [M18 OGG](audio/bgm/PUP_MUS_M18_A_v01_take01_loop_draft.ogg) · 76.80초 | 경제 규칙 보류 유지. 구매를 재촉하는 초조한 음악 배제. |
| M19 | P1 | HUNT·PLAY·PACK 특전 트리<br>현재 화면, 별도 BGM 추가안 | [M19 OGG](audio/bgm/PUP_MUS_M19_A_v01_take01_loop_draft.ogg) · 106.67초 | 트리 탭마다 곡 교체 금지. 각 트리는 악센트 음색으로만 차이. |
| M20 | P1 | 프로필·친구·길드·커뮤니티<br>현재 화면, 별도 BGM 추가안 | [M20 OGG](audio/bgm/PUP_MUS_M20_A_v01_take01_loop_draft.ogg) · 105.37초 | 메시지/알림음을 포함하지 않음. 길드 이벤트 전용곡은 F10 후보. |
| M21 | P1 | 온보딩·설치 연습·설명 화면<br>추가 적용안 | [M21 OGG](audio/bgm/PUP_MUS_M21_A_v01_take01_loop_draft.ogg) · 76.80초 | 현재 일반 전투와 분리된 튜토리얼 완성 여부와 무관한 예비곡. |
| M22 | P1 | 스토리·협동 승리 후 보상 확인<br>현재 결과용 신규곡 | [M22 OGG](audio/bgm/PUP_MUS_M22_A_v01_take01_loop_draft.ogg) · 54.34초 | 승리 징글 J05 뒤 낮은 음량으로 이어짐. |
| M23 | P1 | 패배·도전 종료·재도전 선택<br>현재 결과용 신규곡 | [M23 OGG](audio/bgm/PUP_MUS_M23_A_v01_take01_loop_draft.ogg) · 50.53초 | 비웃는 나팔·장례식·과도한 슬픔 금지. 도전 기록을 차분하게 확인. |
| M24 | P1 | 챕터 엔딩·감사·크레딧<br>미구현 연출 대비 | [M24 OGG](audio/bgm/PUP_MUS_M24_A_v01_take01_loop_draft.ogg) · 60.00초 | 스토리 전체 엔딩은 아직 확정되지 않은 연출용. 자연스러운 완결 끝음 허용. 엔딩은 1회 재생을 우선 검토. |
| F01 | P2 | 봄 빌리지·공원 이벤트<br>미확정 미래 후보 | [F01 OGG](audio/bgm/PUP_MUS_F01_A_v01_take01_loop_draft.ogg) · 102.86초 | 봄 이벤트가 확정됐다는 의미는 아님. |
| F02 | P2 | 해변·수영장·여름 스킨 이벤트<br>미확정 미래 후보 | [F02 OGG](audio/bgm/PUP_MUS_F02_A_v01_take01_loop_draft.ogg) · 105.76초 | 파도·물장구 효과음은 곡에 구워 넣지 않음. |
| F03 | P2 | 가을·할로윈 장난감 이벤트<br>미확정 미래 후보 | [F03 OGG](audio/bgm/PUP_MUS_F03_A_v01_take01_loop_draft.ogg) · 102.86초 | 비명·악마 목소리·갑작스러운 큰 충격음 배제. |
| F04 | P2 | 겨울 빌리지·눈 맵·연말 이벤트<br>미확정 미래 후보 | [F04 OGG](audio/bgm/PUP_MUS_F04_A_v01_take01_loop_draft.ogg) · 100.00초 | 기존 캐럴 멜로디를 지정하지 않음. |
| F05 | P2 | 주방·간식 창고 스테이지 후보<br>미확정 미래 후보 | [F05 OGG](audio/bgm/PUP_MUS_F05_A_v01_take01_loop_draft.ogg) · 108.39초 | 초기 3개 스토리 맵에 포함된 것으로 표현하지 않음. |
| F06 | P2 | 욕실·세탁실·거품 스테이지 후보<br>미확정 미래 후보 | [F06 OGG](audio/bgm/PUP_MUS_F06_A_v01_take01_loop_draft.ogg) · 104.73초 | 버블 팝·물 효과음은 따로 제작. 기계 소음 넣지 않음. |
| F07 | P2 | 다락방·오래된 장난감 스테이지 후보<br>미확정 미래 후보 | [F07 OGG](audio/bgm/PUP_MUS_F07_A_v01_take01_loop_draft.ogg) · 106.67초 | 공포/기괴함보다 탐험. 토이샵과 같은 세계의 확장. |
| F08 | P2 | 도시 공원·비 오는 거리·외부 시즌 후보<br>미확정 미래 후보 | [F08 OGG](audio/bgm/PUP_MUS_F08_A_v01_take01_loop_draft.ogg) · 107.59초 | 철도역은 사용자 취소 사항이므로 기차역 전용곡은 제외. |
| F09 | P2 | 추가 협동 맵·대형 공동 보스<br>미확정 미래 후보 | [F09 OGG](audio/bgm/PUP_MUS_F09_A_v01_take01_loop_draft.ogg) · 148.24초 | 현재 2인 협동을 넘어선 인원·레이드 구현 완료를 뜻하지 않음. |
| F10 | P2 | 길드 모임·기념일·빌리지 축제<br>미확정 미래 후보 | [F10 OGG](audio/bgm/PUP_MUS_F10_A_v01_take01_loop_draft.ogg) · 106.67초 | 길드 전투·이벤트 경제를 새로 확정하지 않음. |

## 징글 16개

| ID | 이벤트 | 파일·길이 | 재생·중복 제한 및 QA |
| --- | --- | --- | --- |
| J01 | 브랜드 로고 | [J01 OGG](audio/jingles/PUP_STING_J01_draft.ogg) · 1.76초 | 네 음 안팎의 간결한 발자국 같은 상승·응답. 처음 로고 등장 1회. 너무 높은 종·목소리·짖음 없이 짧게 끝내기. |
| J02 | 게임 출발 | [J02 OGG](audio/jingles/PUP_STING_J02_draft.ogg) · 2.31초 | 짧게 상승하고 첫 박으로 착지. 맵 진입 전 1회. 로딩이 짧으면 생략, 강제 대기 시간 추가 금지. |
| J03 | 웨이브 클리어 | [J03 OGG](audio/jingles/PUP_STING_J03_draft.ogg) · 1.03초 | 두세 음의 가벼운 확인 모티프. 자동 웨이브 연속 재생에서 피곤하면 축소/생략. |
| J04 | 보스 등장 | [J04 OGG](audio/jingles/PUP_STING_J04_draft.ogg) · 2.57초 | 낮은 짧은 질문과 선명한 응답, 규모감 있는 박자. 긴 사이렌·위협적인 비명 금지. 보스당 1회. |
| J05 | 승리 | [J05 OGG](audio/jingles/PUP_STING_J05_draft.ogg) · 5.09초 | 밝게 올라가 안정적으로 해결되는 짧은 팡파르. 승리 결과 루프와 같은 음색으로 이어가기. |
| J06 | 패배·도전 종료 | [J06 OGG](audio/jingles/PUP_STING_J06_draft.ogg) · 3.16초 | 짧게 내려갔다 다시 조금 올라오는 다정한 응답. 조롱하는 실패 나팔 금지. 재도전을 막는 긴 연출 금지. |
| J07 | 일반 진화 | [J07 OGG](audio/jingles/PUP_STING_J07_draft.ogg) · 1.20초 | 작은 두 단계 상승과 또렷한 끝음. 연속 진화 시 중복 재생 제한. |
| J08 | 최종 각성 | [J08 OGG](audio/jingles/PUP_STING_J08_draft.ogg) · 3.53초 | 메인 모티프를 더 넓은 음역과 짧은 화음으로 확장. 음량만 키우지 않고 화성과 편성으로 차별화. |
| J09 | 티어 승급 | [J09 OGG](audio/jingles/PUP_STING_J09_draft.ogg) · 2.40초 | 한 칸 더 높이 쌓이는 느낌의 세 음과 안정된 화음. 전투 중 일반 진화와 다른 리듬을 사용. |
| J10 | 냄새 추적대 합체 | [J10 OGG](audio/jingles/PUP_STING_J10_draft.ogg) · 2.45초 | 작은 음들이 모여 한 번 통통 튀며 마무리되는 코믹한 소절. 구름 회전감을 표현하되 진짜 개 짖음·싸움 소리 금지. |
| J11 | 도전 10·20… 돌파 | [J11 OGG](audio/jingles/PUP_STING_J11_draft.ogg) · 1.90초 | 기록 한 칸이 채워지는 짧은 상승 확인. 첫 돌파와 재도전 동일 음색, 첫 돌파만 화음 한 겹 추가 가능. |
| J12 | 도전 100라운드 돌파 | [J12 OGG](audio/jingles/PUP_STING_J12_draft.ogg) · 4.78초 | 긴장 패턴이 밝은 모티프로 잠깐 열렸다가 착지. 게임이 끝났다는 완결 느낌을 피하고 곧 전투곡 복귀. |
| J13 | 새 강아지 해금 | [J13 OGG](audio/jingles/PUP_STING_J13_draft.ogg) · 2.45초 | 호기심 어린 질문 뒤 반짝이는 따뜻한 응답. 캐릭터 이름 보이스나 짖음 삽입 없음. |
| J14 | 계정 레벨 상승 | [J14 OGG](audio/jingles/PUP_STING_J14_draft.ogg) · 1.33초 | 짧은 상승 모티프와 작은 화음. 특전 1포인트 적립 표시와 겹치면 한 번만 재생. |
| J15 | 보상 받기·퀘스트 완료 | [J15 OGG](audio/jingles/PUP_STING_J15_draft.ogg) · 1.70초 | 가볍고 만족스러운 세 음 마무리. 티켓 개수만큼 반복하지 않음. 계정 경제 변경 없음. |
| J16 | 챕터 완료 | [J16 OGG](audio/jingles/PUP_STING_J16_draft.ogg) · 6.82초 | 메인 모티프를 회상하는 따뜻한 마무리와 잔향. 현재 챕터 연출이 없는 곳에는 미적용 예비. |

## 홍보 전용 6개

게임용 자산 등록표에서는 제외했다. F11은 트레일러·업데이트 영상, F12는 강아지 소개·강아지툰·짧은 일상 영상용이다. 실제 게시나 광고 집행을 뜻하지 않는다.

| ID | 사용처 | 파일·길이 |
| --- | --- | --- |
| F11_15s | 런칭·업데이트 트레일러·15/30/60초 영상 | [F11_15s OGG](audio/promo/PUP_MUS_F11_A_v01_take01_promo_15s_draft.ogg) · 15.00초 |
| F11_30s | 런칭·업데이트 트레일러·15/30/60초 영상 | [F11_30s OGG](audio/promo/PUP_MUS_F11_A_v01_take01_promo_30s_draft.ogg) · 30.00초 |
| F11_60s | 런칭·업데이트 트레일러·15/30/60초 영상 | [F11_60s OGG](audio/promo/PUP_MUS_F11_A_v01_take01_promo_60s_draft.ogg) · 60.00초 |
| F12_15s | 강아지 소개·4컷·짧은 일상 영상 | [F12_15s OGG](audio/promo/PUP_MUS_F12_A_v01_take01_promo_15s_draft.ogg) · 15.00초 |
| F12_30s | 강아지 소개·4컷·짧은 일상 영상 | [F12_30s OGG](audio/promo/PUP_MUS_F12_A_v01_take01_promo_30s_draft.ogg) · 30.00초 |
| F12_60s | 강아지 소개·4컷·짧은 일상 영상 | [F12_60s OGG](audio/promo/PUP_MUS_F12_A_v01_take01_promo_60s_draft.ogg) · 60.00초 |

## 공통 연결 원칙

- 같은 cue 유지 요청은 재시작하지 않는다. 전환 중에만 두 BGM이 잠깐 겹치며 이후 이전 곡을 정리한다.
- 짧은 빌리지 모달은 낮/밤 곡을 유지한다. 독립 전용 화면에서만 M17–M20을 고려한다.
- 일반·압박 곡은 별도 생성곡이다. 같은 멜로디·조성·박자 위치를 공유한다고 가정하지 않는다.
- 주요 보스 시작에 J04/M16, 종료 후 현재 맵 일반/압박 상태로 복귀한다.
- 무한 도전 100라운드는 J12 후 계속 진행하며 엔딩으로 전환하지 않는다.
- M21·M24·J16과 F계열의 콘텐츠가 구현됐다고 가정하지 않는다.
- 자세한 업로드·전환·검수는 [ROBLOX_IMPORT_AND_QA.md](ROBLOX_IMPORT_AND_QA.md)를 따른다.
