# 사고멍치 / PUPSTERS — 탑뷰 · 배경 · UI 컨셉 v1

2026-10-23 제작. 사용자가 승인한 v4의 살짝 통통한 체형, 반쯤 감긴 눈, 굵은 검정 윤곽선을 바탕으로 만든 시각 콘셉트입니다.

## 구성

- 탑뷰 강아지 3종: 말티즈, 시바견, 불도그. 1254×1254 투명 PNG.
- 거실 전투 배경 1장.
- 타이틀부터 설정까지 게임 화면 14장.
- 버튼·카드·아이콘·체력 바·상태를 모은 UI 키트 1장.
- 총 19개 PNG, 생성 프롬프트, 파일 검사 결과.

## 시점과 사용 범위

전투 캐릭터는 지면을 약 65도로 내려다보는 오버헤드 시점을 의도했습니다. 정수리와 등을 보여 주면서 눈과 코도 일부 남긴 방향입니다. 단일 방향의 탑뷰 콘셉트이며, 회전 방향별 스프라이트나 애니메이션 세트는 아직 포함하지 않습니다.

UI 화면은 래스터 콘셉트 이미지입니다. 실제 조작이나 게임 구현을 포함하지 않으며, 화면에 등장하는 비용·웨이브·보상·해금은 구성 확인용 예시값입니다. 버튼, 텍스트, 아이콘이 편집 가능한 개별 레이어로 분리된 자료는 아닙니다.

거실 배경의 길은 장난감 상자에서 침실 문까지 이어지는 단일 경로, 협동 화면은 두 출발 경로가 하나로 합류하는 구조입니다. 시바견에는 구슬 발사기, 불도그에는 테니스공 대포를 적용했습니다.

원래 제작 목록의 초기 수비대는 시바견·불도그·허스키·비글·푸들·보더콜리입니다. 말티즈는 현재 캐릭터/브랜드 마스코트로 표현하고, 미정인 전투 역할은 임의로 확정하지 않았습니다. 협동 화면도 구현 전 콘셉트입니다.

## 탑뷰 캐릭터

- [White Maltese](characters/01-maltese-topdown.png)
- [orange Shiba Inu](characters/02-shiba-topdown.png)
- [fawn-and-white English Bulldog](characters/03-bulldog-topdown.png)

## 배경 및 화면

- [거실 전투 배경](backgrounds/01-living-room-map.png)
- [메인 타이틀](screens/01-title.png)
- [아지트](screens/02-hideout.png)
- [강아지 편성](screens/03-loadout.png)
- [스토리 맵](screens/04-story-map.png)
- [도입 연출](screens/05-intro.png)
- [탑뷰 전투 UI](screens/06-solo-battle.png)
- [선택 및 업그레이드](screens/07-upgrade.png)
- [협동 대기실](screens/08-coop-lobby.png)
- [협동 전투](screens/09-coop-battle.png)
- [보스 등장](screens/10-boss.png)
- [승리](screens/11-victory.png)
- [패배 및 재도전](screens/12-defeat.png)
- [도감 및 성장](screens/13-codex.png)
- [일시정지 및 설정](screens/14-pause-settings.png)
- [공통 UI 구성요소](screens/15-ui-kit.png)

## 제작 및 확인

- 생성 방식: 내장 image_gen, 기존 승인 캐릭터와 생성한 화면을 참조하여 편집/생성.
- [생성 프롬프트](prompts.md)
- [파일 검사 결과](validation.json)
- 주요 한글 메뉴, 캐릭터 시점, 배치 공간, 경로 연결 및 화면 구성은 시각적으로 검토했습니다.
- PNG 파일 열기·개수·크기, 캐릭터 알파 채널 및 압축 묶음 내 파일 개수를 확인했습니다.
- 원본 기획: [공개 인덱스](https://zaelee.github.io/ZZEE/20261022-puppy-defense-blueprint/index.html#branding), 로컬에 저장한 제작 장면·캐릭터·적군 목록을 기준으로 구성했습니다.
