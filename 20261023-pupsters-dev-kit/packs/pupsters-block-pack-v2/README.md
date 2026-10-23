# 사고멍치 — 네모 강아지 v2

견종마다 비슷해 보이던 얼굴·몸통·귀의 비율을 다시 잡았습니다. 큰 머리와 짧은 몸, 작은 검은 점눈은 유지했습니다. 귀·얼음·왕관의 삼각형과 뾰족한 돌출부를 뭉툭한 직육면체로 교체했습니다. 기존 v1은 별도 폴더에 보존했습니다.

| 견종 | 외형 변화 | 공격 설정 | 부품 |
|---|---|---|---:|
| 시바멈 | 짧고 뭉툭한 귀 · 작은 흰 눈썹 | 뼈다귀 뱉기 | 30 |
| 불돔 | 넓고 납작한 얼굴 · 빵빵한 볼 | 압축 공기탄 | 27 |
| 머스키 | 사각 얼음 귀끝·좁고 긴 회색 얼굴 | 냉기 숨결 | 36 |
| 미글 | 긴 네모 귀 · 삼색 얼굴 · 파란 침 | 침방울 튕기기 | 25 |
| 무들 | 계단 털뭉치 · 노랑·하늘 전기 | 정전기 찌릿 | 33 |
| 모더콜리 | 짝귀·네모 볼털·낡은 골판지 왕관 | 응원 짖기 | 37 |

불돔은 넓고 납작하게, 머스키는 조금 좁고 길게, 미글은 긴 귀가 늘어지게, 무들은 털 덩어리가 계단처럼 퍼지게 만들었습니다. 모더콜리는 짝귀와 볼털, 끝이 평평한 골판지 왕관을 씁니다. 시바멈은 짧고 뭉툭한 귀와 흰 눈썹을 유지합니다.

위의 공격은 캐릭터 설정입니다. 이번 파일은 **대기 자세의 정적 모델**이며 공격 애니메이션, 이펙트, 피해 판정, 본 리깅은 포함하지 않습니다.

## 먼저 보기

압축을 풀고 `index.html`을 여세요. 6종의 대표컷과 각 모델의 다운로드를 모았습니다. ‘3D로 보기’에서 한 마리씩 회전할 수 있도록 구성했습니다. 드래그·방향키는 회전, 휠·+/−는 확대와 축소입니다. 인터넷 연결 없이 작동하도록 Three.js와 모델 데이터를 동봉했습니다.

- `previews/collection.png`: 수정된 6종의 실제 모델 렌더.
- `previews/silhouettes.png`: 색과 무늬를 뺀 정면 실루엣 비교.
- `previews/D0*-*.png`: 견종별 대표컷.
- `previews/D0*-*-views.png`: 정면·측면·뒷면·탑뷰.
- WebGL 사용이 불가능하면 같은 모델의 정지 렌더 이미지가 표시됩니다.

## 로블록스 적용

**추천: `native/Pupsters-All-Dogs.rbxmx`**를 Studio의 Explorer에서 **Workspace → 우클릭 → Insert From File…**로 삽입하세요. 6종이 서로 겹치지 않게 3 × 2로 배치됩니다. 개별 삽입은 같은 폴더의 `D01-shiba.rbxmx`부터 `D06-border-collie.rbxmx`까지 해당 견종 파일을 사용합니다. [공식 모델 삽입 예시](https://create.roblox.com/docs/tutorials/use-case-tutorials/lighting/create-flickering-lights)

모델은 Roblox의 Part로 구성했습니다. 삼각 쐐기 부품은 사용하지 않았습니다. 눈과 시바멈의 눈썹만 납작한 Ball 형태를 씁니다. 모든 부품은 **Anchored=true, CanCollide=false, SmoothPlastic**입니다. 외부 이미지나 텍스처 업로드 없이 기본 부품 색으로 표현됩니다.

대안은 `native/Build-D0*-*.luau`입니다. 원하는 견종 파일의 전체 내용을 Studio의 Command Bar(Ctrl+9)에 붙여 실행하면 한 마리가 추가됩니다. 기존 모델을 삭제하지 않으며, 카메라 초점 근처에서 빈 공간을 찾아 배치를 시도합니다. [Command Bar 안내](https://create.roblox.com/docs/studio/ui-overview)

`models/`에는 견종마다 **glTF / GLB / OBJ + MTL**도 있습니다. glTF·GLB는 Studio의 File → Import를 이용하고 **Studs / Y Up / −Z Front / Anchored 켜기 / Merge Meshes 끄기 / No Rig**로 가져오세요. glTF에 버퍼가 내장되어 있으며 외부 텍스처는 없습니다. OBJ와 MTL은 같은 폴더에 둡니다. [공식 가져오기 설정](https://create.roblox.com/docs/studio/importer)

## 모델 구조

정면은 −Z, 위는 +Y, 단위는 studs이며 발바닥이 Y=0에 놓입니다. Body, Head, 네 다리, Tail 그룹으로 분리했습니다. 시바멈의 입에 문 뼈는 MouthBone 그룹입니다. 네이티브 모델에는 다른 견종에서도 빈 MouthBone 그룹이 남아 있습니다.

glTF에는 `Mouth_Att` 노드, 기본 부품 모델에는 Head 그룹의 입 부품에 `Mouth` Attachment가 있습니다. 입에서 시작하는 공격 효과를 나중에 연결할 기준점입니다. 구체적인 좌표는 `manifest.json`의 `mouth`를 참고하세요. Attachment가 공격이나 애니메이션을 자동으로 실행하지는 않습니다.

## 확인 범위

6종의 실제 지오메트리를 렌더링해 대표컷과 네 방향을 확인했습니다. 파일 검사는 glTF/GLB 일치, 좌표·크기·노멀·닫힌 메시·양의 부피, 네이티브 모델 부품과 입 기준점, 통합 모델의 배치를 확인합니다. 결과는 `docs/validation.json`과 `docs/native-validation.json`에 있습니다.

**Roblox Studio 내부 가져오기와 웹 뷰어의 실제 브라우저 조작은 이 환경에서 확인하지 못했습니다.** 정적 파일 검사와 렌더 확인 결과를 Studio 실기동 확인으로 간주하지 않습니다.

## 편집 및 재생성

원본 설정은 `scenes/`, 생성 코드는 `tools/`에 있습니다. Python + NumPy + Pillow 환경에서 아래 순서로 실행합니다.

1. `python tools/build_pack.py`
2. `python tools/render_previews.py`
3. `python tools/build_gallery.py`
4. `python tools/validate_models.py`

Three.js 라이선스는 `THIRD_PARTY_NOTICES.txt`에 있습니다. 제작일: 2026-10-23.
