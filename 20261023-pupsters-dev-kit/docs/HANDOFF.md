# 사고멍치 / Pupsters 개발 인계

2026-10-23 기준으로 **블록형 에셋의 생성·검증 코드와 입력 데이터**를 함께 보관했다. 최신 기준은 앉은 강아지 6종, 공격 모션 6개, 적 9종과 모션 27개, 76 × 52 studs 놀이방 맵이다. 이 저장소는 에셋 개발 키트이며, 완성된 게임이라고 주장하지 않는다.

## 최신 기준 팩

| 용도 | 기준 팩 | 구현된 것 | 바로 받기 |
| --- | --- | --- | --- |
| 강아지 원형 | [`pupsters-block-pack-v4`](../packs/pupsters-block-pack-v4/README.md) | D01 시바멈, D02 불돔, D03 머스키, D04 미글, D05 무들, D06 모더콜리의 앉은 3D 모델 | [ZIP](../downloads/pupsters-block-pack-v4.zip) |
| 강아지 공격 | [`pupsters-sitting-attacks-v1`](../packs/pupsters-sitting-attacks-v1/README.md) | 6종의 2초 공격 클립과 Roblox 이벤트 재생 모델 | [ZIP](../downloads/pupsters-sitting-attacks-v1.zip) |
| 적 원형 | [`pupsters-block-enemies-v1`](../packs/pupsters-block-enemies-v1/README.txt) | 일반 적 8종과 보스 1종 | [ZIP](../downloads/pupsters-block-enemies-v1.zip) |
| 적 모션 | [`pupsters-enemy-motions-v1`](../packs/pupsters-enemy-motions-v1/README.txt) | 적 9종 × 이동·피격·사망 = 27개 클립 | [ZIP](../downloads/pupsters-enemy-motions-v1.zip) |
| 맵 | [`pupsters-block-map-v1`](../packs/pupsters-block-map-v1/README.txt) | 16개 배치 칸과 6개 경로점을 가진 블록 놀이방 | [ZIP](../downloads/pupsters-block-map-v1.zip) |
| 초기 2D 디자인 근거 | [`pupsters-personality-v3`](../packs/pupsters-personality-v3/README.md) | 견종별 성격·공격 방향과 초기 이미지 생성 기록 | [ZIP](../downloads/pupsters-personality-v3.zip) |

그 밖의 `packs/` 항목은 형태 탐색과 이전 버전을 보존한 이력이다. 새 3D 작업은 위 표의 다섯 3D 팩을 기준으로 삼고, 2D 팩은 기획 근거로만 참고한다.

## 구현 상태

- 강아지는 큰 머리, 짧은 몸, 약간 통통한 블록 실루엣이며 앉은 자세가 기본이다. 모든 눈은 검은 점 형태다.
- 공격은 시바멈 뼈 뱉기, 불돔 압축 공기, 머스키 냉기 숨결, 미글 침방울, 무들 정전기, 모더콜리 지원 짖기다. 총기류는 없다.
- Roblox 동작은 `Anchored Part`를 프레임 데이터로 움직인다. `Humanoid`, 리그, 업로드된 `AnimationId`가 필요 없다.
- 편집 원본 JSON에서 GLB, glTF, OBJ/MTL, RBXMX, 웹 데이터, PNG/GIF를 생성하도록 도구가 들어 있다. 팩별 정확한 재생성 순서는 각 README를 따른다.
- 수정 기준은 팩마다 다르다. 정적 모델은 scene JSON을 읽지만, 맵의 `build_map.py`는 scene/layout JSON을 생성하고 모션 빌더는 프레임 JSON을 생성한다. 생성되는 JSON을 직접 고친 뒤 빌더로 덮어쓰지 않도록, 해당 값을 정의하는 입력이나 빌더를 먼저 확인한다.
- 맵은 76 × 52 studs, 길 폭 6, 중심 경로 길이 192, W01~W06 경로점, 4.2 × 4.2 크기의 P01~P16 배치 칸을 가진다. 바닥 윗면 Y=0, 길 윗면 Y=0.10, 배치 기준 Y=0.26이다.

## 아직 필요한 게임 통합

다음 항목은 에셋에 포함되지 않았다.

- 적 체력, 웨이브 생성, 경로 이동, 목표 지점 도달 처리
- 강아지의 타깃 선택, 공격 주기, 투사체·범위 판정, 피해 적용
- 적의 분열·수리·은신·소환 같은 역할별 실제 로직
- 배치 구매, 재화, 업그레이드, 판매, 패드 점유 처리
- 승패, UI, 저장, 팀 협동, 네트워크 권한, 밸런스와 사운드

## 권장 다음 순서

1. Roblox Studio에서 최신 5개 3D 팩의 대표 RBXMX를 가져오고, 공격·적 모션 데모를 Play로 점검한다.
2. 맵의 `PathWaypoints`와 `PlacementSlots`를 읽는 최소 서버 게임 루프를 만든다.
3. 적 스폰·경로 이동·체력·사망을 `Motion` 이벤트와 연결한다.
4. 강아지 타깃 선택과 공격 판정을 `Attack` 이벤트에 연결한다.
5. 배치 경제와 업그레이드, 승패, UI를 추가한다.
6. 다중 플레이 권한과 성능을 확인한 뒤 수치 밸런스와 사운드를 조정한다.

## 검증 범위와 재현

각 팩에는 생성 도구와 JSON 검증 보고서가 들어 있다. 원본 JSON, GLB, Roblox XML, 웹 프리뷰 데이터 사이의 구조·좌표 일치와 정적 렌더는 검사되었다. 구체적인 명령과 생성 순서는 위 표의 README에 있다.

**실제 Roblox Studio 가져오기·Play와 브라우저 WebGL 조작은 아직 검증하지 않았다.** 따라서 구조 검사가 통과했어도 실제 엔진에서의 표시·재생·게임 연결은 첫 통합 단계에서 확인해야 한다.

`사고멍치`와 `Pupsters`는 작업명이다. 상표·서비스명 사용 가능성은 조사하거나 승인받지 않았다. 이 문서와 [`DECISIONS.md`](DECISIONS.md)는 작업 중 합의와 관찰된 산출물을 기록하며, 시장성·법률 검토의 근거가 아니다.
