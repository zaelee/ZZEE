# 사고멍치 — 앉은 강아지 6종 v4

여섯 마리 모두 엉덩이를 바닥에 붙이고 뒷다리를 낮게 접은 앉은 자세입니다. 앞발은 나란히 짚고 큰 머리와 짧은 몸의 비율을 유지했습니다. 얼굴·귀·왕관·입에 문 뼈는 기존 모양 그대로 옮겼습니다.

무들 기본형은 **머리 중앙 위에 작은 지그재그 한 개**만 있습니다. 머리와 번개 사이 간격은 0.13 stud입니다. 머리 위와 양옆의 큰 번개는 **업그레이드 외형**으로 별도 저장했습니다. 통합 6종 파일에는 기본형만 들어갑니다.

| 캐릭터 | 특징 | 공격 설정 | 부품 |
|---|---|---|---:|
| 시바멈 | 뭉툭한 귀 · 흰 눈썹 | 뼈다귀 뱉기 | 30 |
| 불돔 | 넓은 얼굴 · 빵빵한 볼 | 압축 공기탄 | 27 |
| 머스키 | 얼음 귀끝 | 냉기 숨결 | 37 |
| 미글 | 긴 귀 · 삼색 무늬 · 파란 침 | 침방울 튕기기 | 26 |
| 무들 기본형 | 작은 중앙 번개 1개 | 정전기 찌릿 | 32 |
| 모더콜리 | 양쪽 귀 · 낡은 골판지 왕관 | 응원 짖기 | 45 |
| 무들 업그레이드 외형 | 머리 위와 양옆 번개 | 정전기 찌릿 | 49 |

번개는 고정 위치의 3D 장식입니다. Roblox 파일은 Neon, glTF/GLB는 발광 재질, OBJ/MTL은 기본 색을 사용합니다. 기본형은 연결된 막대 세 개로 지그재그 한 개를 표현합니다.

## 보기

압축을 풀고 `index.html`을 여세요. 대표컷·4면도·다운로드와 개별 3D 뷰어를 모았습니다. 업그레이드 외형도 따로 선택할 수 있습니다.

- `previews/collection.png`: 기본형 6종.
- `previews/sitting-side.png`: 여섯 마리의 옆모습.
- `previews/poodle-stages.png`: 무들 기본 / 업그레이드 비교.
- `previews/D05-poodle-top.png`: 기본 무들 탑뷰.
- `previews/*-views.png`: 개별 정면·측면·뒷면·탑뷰.

Three.js와 모델 데이터를 동봉했습니다. WebGL이 불가능하면 같은 지오메트리의 정지 렌더를 표시합니다.

## Roblox 파일

- `native/Pupsters-All-Dogs.rbxmx`: 기본형 6종, 3 × 2 배치.
- `native/D01-shiba.rbxmx` ~ `native/D06-border-collie.rbxmx`: 개별 기본형.
- `native/D05-poodle-upgrade.rbxmx`: 무들 업그레이드 외형, 별도 모델.
- `native/Build-*.luau`: 해당 모델을 추가하는 생성기.
- `models/`: 각 모델의 glTF, GLB, OBJ, MTL.

Studio Explorer에서 **Workspace → 우클릭 → Insert From File…**로 rbxmx를 삽입할 수 있습니다. [공식 삽입 예시](https://create.roblox.com/docs/tutorials/use-case-tutorials/lighting/create-flickering-lights)

기본 Part로 구성되며 눈과 시바멈 눈썹만 납작한 Ball 형태입니다. 모든 부품은 **Anchored=true, CanCollide=false**입니다. 본체는 SmoothPlastic, 전기는 Neon입니다. 외부 텍스처가 필요하지 않습니다.

Luau 생성기는 기존 모델을 삭제하지 않고 카메라 근처 빈 공간에 추가를 시도합니다. GLB/glTF 기준은 **Studs / Y Up / −Z Front / Anchored / No Rig**입니다. [공식 가져오기 안내](https://create.roblox.com/docs/studio/importer)

## 구조와 확인 범위

정면 −Z, 위 +Y, 단위 studs. 발바닥과 엉덩이는 Y=0입니다. Body, Head, 네 다리, Tail, MouthBone, FX 그룹을 유지했습니다. 전기는 FX 그룹에 있습니다.

입 효과 기준점은 glTF의 `Mouth_Att`, Roblox 모델의 `Mouth` Attachment입니다. 앉은 자세에 맞춰 머리와 함께 이동했습니다. 얼굴·귀·왕관의 상대 좌표와 크기는 유지했습니다.

대표컷·옆모습·4면도를 확인하고 glTF/GLB 일치, 메시 부피·노멀·닫힘, 발 접지, native 부품과 입 기준점, 통합 배치, 링크를 검사했습니다. 결과는 `docs/validation.json`, `docs/native-validation.json`, `docs/sitting-validation.json`에 있습니다.

**정지 자세 모델입니다. 앉는 동작 전환, 공격 애니메이션, 피해 판정, 업그레이드 기능은 포함하지 않았습니다. Roblox Studio 내부 가져오기와 웹 뷰어의 브라우저 실행은 이 환경에서 미검증입니다.**

## 재생성

기본형 원본은 `scenes/`, 업그레이드 외형은 `upgrades/D05-poodle-upgrade.json`입니다. Python + NumPy + Pillow 환경에서 실행합니다.

1. `python tools/build_pack.py`
2. `python tools/render_previews.py`
3. `python tools/build_gallery.py`
4. `python tools/validate_models.py`

이전 v3는 보존했습니다. 라이선스: `THIRD_PARTY_NOTICES.txt`. 제작일: 2026-10-23.
