# 사고멍치 / PUPSTERS — 두 가지 3D 시바

큰 머리와 짧은 몸, 능청스러운 눈썹, 크림색 볼과 발, 말린 꼬리, 입에 문 작은 뼈를 가진 오리지널 시바 모델입니다. 기존 2D 시바를 참고해 실제 입체 지오메트리로 제작했습니다.

| 버전 | 권장 파일 | 구성 | 전체 삼각형 |
| --- | --- | --- | --- |
| 블록·기본 도형 | `native/Shiba-Block.rbxmx` | 44개 기본 부품: Part 40개, WedgePart 4개 | glTF 대체본 2,540개 |
| 둥근 로우폴리 | `models/Shiba_Rounded.gltf` | 47개 메시, 8개 부위 그룹 | 8,568개 |

공통 머리 크기는 2.16 × 1.57 × 1.49 studs, 몸통은 1.49 × 1.17 × 1.13 studs입니다. 머리 폭이 몸통보다 약 45% 큽니다. 모델 전체는 폭 약 2.2~2.3, 높이 약 2.7~2.8, 길이 약 2.9 studs입니다. Y가 위쪽, −Z가 정면이며 발바닥은 Y=0입니다.

## 먼저 보기

압축을 풀고 `index.html`을 열면 두 모델을 비교할 수 있습니다. 드래그·방향키로 회전, 휠·+/−로 확대/축소할 수 있습니다. 정면·측면·뒷면·탑뷰 버튼과 메시 표시도 있습니다. WebGL이 동작하지 않으면 실제 모델을 렌더링한 PNG를 보여줍니다. 인터넷 연결은 필요 없습니다.

`previews/comparison.png`는 같은 내보내기 지오메트리를 직접 렌더링한 비교 이미지입니다. 각 버전의 `*-views.png`에는 정면·측면·뒷면·탑뷰를 담았습니다. 렌더 조명과 Studio 조명이 다르면 색감은 달라질 수 있습니다.

## 블록형을 Roblox Studio에 넣기

1. Explorer에서 **Workspace → 우클릭 → Insert From File…**를 선택합니다.
2. `native/Shiba-Block.rbxmx`를 선택합니다.
3. `Shiba_Block` 모델을 선택해 원하는 위치로 이동합니다. 각 부품은 이미 Anchored=true, CanCollide=false이며 SmoothPlastic 재질입니다.

공식 모델 삽입 예시: [Roblox의 Insert From File 안내](https://create.roblox.com/docs/tutorials/use-case-tutorials/lighting/create-flickering-lights).

파일 삽입 대신 `native/BuildShiba.luau` 전체를 Studio의 **Command Bar**에 붙여 실행해도 같은 모델이 생성됩니다. Command Bar는 **Window → Script** 메뉴 또는 **Ctrl+9**로 열 수 있습니다. 여러 줄 모드에서는 Run 또는 Ctrl+Enter로 실행합니다. 이 코드는 기존 모델을 삭제하지 않고 새 모델을 만들며, 실행할 때마다 한 마리씩 추가합니다. [Command Bar 공식 안내](https://create.roblox.com/docs/studio/ui-overview)

## 둥근형을 Roblox Studio에 넣기

1. **File → Import**에서 `models/Shiba_Rounded.gltf`를 선택합니다. 이 파일은 필요한 버퍼가 내장되어 있어 별도 `.bin` 파일이 필요 없습니다.
2. **Scale Unit=Studs**, **World Up=Top(Y)**, **World Forward=Front(−Z)**로 설정합니다.
3. **Anchored=켜기**, **Merge Meshes=끄기**, **Set Pivot to Scene Origin=켜기**로 설정합니다. Rig Type이 표시되면 **No Rig**를 선택합니다.
4. 미리보기의 경고를 확인하고 Import합니다. 게임 안의 타워/NPC용으로 사용합니다.

glTF/GLB의 색은 단색 PBR 재질에 들어 있으며 외부 텍스처가 없습니다. `Shiba_Rounded.glb`도 같은 모델을 하나의 바이너리 파일로 담은 대체본입니다. OBJ를 사용할 때는 같은 이름의 MTL도 같은 폴더에 둡니다. [Roblox 가져오기 설정](https://create.roblox.com/docs/studio/importer)

## 부위와 현재 범위

`Body`, `Head`, `LegFL`, `LegFR`, `LegBL`, `LegBR`, `Tail`, `MouthBone`으로 나뉘어 있습니다. glTF 부위 그룹은 해당 위치에 피벗을 갖고, 머리에는 입 위치를 표시하는 `Mouth_Att` 노드가 있습니다. 블록형은 `Head/MouthCenter/Mouth` Attachment를 갖습니다.

이번 파일은 **대기 자세 모델**입니다. 본·스킨 리깅, 공격 애니메이션, 적 추적, 충돌·피해 판정은 포함하지 않습니다. 플레이어용 R15 아바타나 마켓플레이스 바디 상품으로 제작한 것이 아닙니다. 많은 수를 동시에 배치하는 실제 게임에서는 부품 병합과 성능 확인이 추가로 필요합니다.

## 검사 결과

glTF/GLB 버퍼·인덱스·노멀·월드 좌표, 메시의 닫힌 면과 방향, 네이티브 XML·CFrame·입 Attachment 위치를 검사했습니다. 각 개별 메시의 삼각형 수는 304개 이하입니다. Roblox의 일반 메시 기준은 개별 메시당 20,000 삼각형입니다. [공식 메시 사양](https://create.roblox.com/docs/art/modeling/specifications)

실제 지오메트리의 CPU 렌더를 정면·측면·뒷면·탑뷰에서 확인했습니다. Roblox Studio 내부 가져오기·Command Bar 실행과 웹 미리보기의 실제 브라우저 동작은 이 환경에서 검사하지 못했습니다. 검사 기록은 `docs/validation.json`, `docs/native-validation.json`에 있습니다.

## 원본 수정

- `scenes/`: 부품별 크기·좌표·색 설정.
- `tools/build_models.py`: 원본 메시 제작과 glTF·GLB·OBJ 내보내기. Python + NumPy 사용.
- `tools/export_native.py`: 블록형 Roblox XML·Luau 내보내기. Python 표준 라이브러리 사용.
- `tools/render_previews.py`: 동일한 메시의 CPU 렌더. Python + NumPy + Pillow 사용.
- `tools/validate_models.py`: 완성 파일의 구조·지오메트리 검사.
- `viewer/`: 오프라인 3D 뷰어. Three.js 라이선스는 `THIRD_PARTY_NOTICES.txt` 참조.

재생성 순서: `build_models.py` → `export_native.py` → `render_previews.py` → `validate_models.py`.

제작일: 2026-10-23.
