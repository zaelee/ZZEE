# 사고멍치 — 앉은 자세 공격 모션 v1

승인한 앉은 6종 모델에 준비 → 발사 → 반동 → 복귀를 붙였습니다. 네 발은 고정되며 엉덩이는 바닥에 남습니다. 각 공격은 2초, 30fps의 61개 기준 프레임으로 구성됩니다.

| 캐릭터 | 동작 | 이어지는 이펙트 |
|---|---|---|
| 시바멈 | 뼈를 물고 고개를 젖혔다 앞으로 까딱 | 입에서 작은 네모 뼈 발사 |
| 불돔 | 볼을 부풀렸다가 공기를 뿜는 반동 | 흰 사각 공기 충격파 |
| 머스키 | 숨을 들이마신 뒤 고개를 내밀기 | 입에서 이어지는 냉기·얼음 알갱이 |
| 미글 | 고개를 갸웃하며 침 모으기, 퉤! | 끈적한 파란 침방울 |
| 무들 | 몸을 작게 떨며 충전 | 머리 중앙 번개에서 전기 방전 |
| 모더콜리 | 세 번 고개를 까딱하며 짖기, 왕관 흔들림 | 노란 소리 파동·민트색 응원 범위 |

무들은 기본형의 작은 중앙 번개를 유지했습니다. 주변에 번개가 떠 있는 업그레이드 외형은 이전 v4에 보관되어 있습니다.

## 바로 보기

- `index.html`: 여섯 공격의 반복 GIF와 다운로드.
- `viewer.html`: 한 마리씩 3D 재생, 한 번/반복/일시정지, 0.5×/1×, 시간 탐색, 카메라 회전.
- `previews/attacks-loop.gif`: 여섯 마리 전체 반복 영상.
- `previews/attack-poses.png`: 대기·준비·발사·복귀 장면.
- `previews/D01-attack.gif` ~ `D06-attack.gif`: 개별 반복 GIF.

인터넷 없이 열도록 Three.js와 프레임 데이터를 동봉했습니다. 브라우저가 WebGL을 지원하지 않으면 GIF로 표시합니다. 동작 줄이기 설정에서는 정지 이미지를 우선합니다.

## Roblox에서 보기

**`roblox/Pupsters-Sitting-Attacks-Demo.rbxmx`**를 Studio Workspace에 삽입하고 Play를 누르면 반복 재생하도록 구성했습니다. 여섯 모델은 서로 겹치지 않도록 3×2로 배치됩니다.

개별 `roblox/D01-attack.rbxmx` ~ `D06-attack.rbxmx`는 자동 재생이 꺼져 있습니다. Play 중 서버 Script에서 해당 모델의 이벤트를 호출합니다.

```lua
workspace["시바멈"].Attack:Fire()
```

모델의 `AutoPreview` 속성을 켜면 반복 프리뷰를 사용할 수 있습니다. 모델을 옮기거나 회전한 뒤 호출해도 앞발 기준으로 동작을 배치합니다. 재생 중 중복 호출은 무시하고 종료 후 원래 위치·크기·표시 상태로 복귀합니다.

이 모델은 **Anchored Part의 위치·회전·크기를 움직이는 스크립트 방식**입니다. 업로드한 AnimationId나 Humanoid 리그가 필요하지 않습니다. 게임의 대상 선택·피해 판정·발사 주기는 별도 연결해야 합니다. 자세한 설명과 API 출처는 [Roblox 재생 안내](roblox/README.md)에 있습니다.

## 파일 형식

- `roblox/*.rbxmx`: 실제 부품과 공격 재생 Script, Attack BindableEvent가 들어간 Roblox 모델.
- `animations/D01-attack.glb` ~ `D06-attack.glb`: 일반 3D 도구용 노드 애니메이션. **Roblox 재생에는 rbxmx를 사용하세요.**
- `animations/D01.json` ~ `D06.json`: 공통 모션 데이터. GIF, 웹 프리뷰, GLB, Roblox가 같은 프레임을 사용합니다.
- `scenes/`, `native/`: 원래 앉은 모델 데이터와 스크립트 생성용 기본 부품 모델.
- `tools/`: 재생 데이터·렌더·모델·갤러리 생성 코드.

## 검증과 제한

실제 메시로 GIF와 포즈 모음을 렌더링했습니다. 네 발의 고정, 원래 자세 복귀, 유효한 회전·크기, GLB 애니메이션 채널, 효과 등장 시점, Roblox 파일 구조·기준점·배치, 링크와 JavaScript 문법을 검사했습니다. 결과는 `docs/`와 `roblox/validation.json`에 있습니다.

**Roblox Studio와 Luau 런타임이 없어 실제 가져오기·Play는 미검증입니다. WebGL 브라우저 조작도 미검증이며 정적 검사와 대체 화면 검사까지만 수행했습니다.** 소리, 피해·충돌·타깃 판정, 앉기/걷기 전환은 포함하지 않았습니다.

## 다시 생성하기

Python + NumPy + Pillow 환경에서 순서대로 실행합니다.

1. `python tools/build_attacks.py`
2. `python tools/build_roblox_attacks.py`
3. `python tools/render_attacks.py`
4. `python tools/build_attack_gallery.py`
5. `python tools/validate_attacks.py`

Three.js 라이선스: `THIRD_PARTY_NOTICES.txt`. 이전 v4는 보존했습니다.
