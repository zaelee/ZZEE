# 사고멍치 — 흰 눈썹 블록 시바 v3

v2의 단순한 블록 시바에 눈동자 크기만 한 흰 눈썹 두 개를 더했습니다. 다른 부품은 v2와 같습니다.

- 눈: 작은 검은 점 두 개.
- 눈썹: 각 눈 바로 위에 0.17 × 0.14 × 0.05 studs의 작은 흰 타원형 무늬. 점눈(0.14 × 0.17 × 0.05)과 같은 면적입니다.
- 코와 입: 작은 네모 코와 짧은 선으로 정리. 볼은 하나의 크림색 직사각형.
- 꼬리: 곡선으로 말린 형태 대신, 끝이 크림색인 짧은 직선 블록 두 개.
- 뼈: 가운데 막대와 네모 끝 두 개, 총 세 개의 블록으로 구성.

총 28개 기본 부품(Part 24개, WedgePart 4개)입니다. glTF 메시 전체는 944 삼각형이며, 눈과 흰 눈썹은 납작한 구로 만들었습니다. 머리 크기 2.16 × 1.57 × 1.49 studs, 몸통 크기 1.49 × 1.17 × 1.13 studs는 v1과 같습니다.

## 확인하기

압축을 풀고 `index.html`을 열면 수정 모델을 돌려볼 수 있습니다. 드래그·방향키는 회전, 휠·+/−는 확대와 축소입니다. WebGL을 사용할 수 없으면 같은 메시를 직접 렌더링한 PNG가 표시됩니다. 인터넷 연결은 필요 없습니다.

`previews/comparison.png`는 수정 전후의 실제 지오메트리 렌더, `previews/block-views.png`는 정면·측면·뒷면·탑뷰입니다. v2 모델과 ZIP은 기존 폴더에 보존했습니다. 비교 이미지는 v2와 v3입니다.

## 로블록스 적용

권장 파일은 `native/Shiba-Block.rbxmx`입니다. Studio의 Explorer에서 **Workspace → 우클릭 → Insert From File…**로 삽입하세요. 각 부품은 Anchored=true, CanCollide=false, SmoothPlastic 재질입니다. [공식 모델 삽입 예시](https://create.roblox.com/docs/tutorials/use-case-tutorials/lighting/create-flickering-lights)

대안으로 `native/BuildShiba.luau`를 Studio의 Command Bar(Ctrl+9)에 붙여 실행하면 같은 모델이 새로 생성됩니다. 기존 모델을 삭제하지 않으며 실행할 때마다 한 마리씩 추가합니다. [Command Bar 안내](https://create.roblox.com/docs/studio/ui-overview)

`models/Shiba_Block.gltf`와 `.glb`도 제공합니다. File → Import로 가져오고 **Studs / Y Up / −Z Front / Anchored 켜기 / Merge Meshes 끄기 / No Rig**를 사용하세요. glTF에 버퍼가 내장되어 있으며 외부 텍스처는 없습니다. OBJ를 사용할 때는 같은 이름의 MTL을 함께 둡니다. [공식 가져오기 설정](https://create.roblox.com/docs/studio/importer)

## 구조와 범위

Body, Head, 네 다리, Tail, MouthBone 그룹으로 나뉘며 입의 기준 위치는 `[0, 0.82, -1.48]`입니다. glTF는 `Mouth_Att`, 기본 부품 모델은 Head/MouthCenter의 `Mouth` Attachment를 제공합니다.

현재는 타워/NPC용 **대기 자세 모델**입니다. 공격 모션·본 리깅·피해 판정은 포함하지 않습니다. Roblox Studio 내부 가져오기와 웹 뷰어 실제 브라우저 동작은 이 환경에서 확인하지 못했습니다. 파일 구조·닫힌 메시·노멀·좌표·네이티브 모델은 검사했고, 실제 메시 렌더를 확인했습니다.

원본 제작 코드는 `tools/`, 크기·좌표 설정은 `scenes/`, 검사 결과는 `docs/`에 있습니다. 재생성 순서는 build_models.py → export_native.py → render_previews.py → validate_models.py입니다. Python + NumPy + Pillow를 사용합니다. Three.js 라이선스는 THIRD_PARTY_NOTICES.txt에 있습니다.

제작일: 2026-10-23.
