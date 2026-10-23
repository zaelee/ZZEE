# 사고멍치 / Pupsters — 2026-10-23 개발 키트

2D 캐릭터·화면 시안부터 네모네모 3D 강아지, 공격, 몹, 이동·피격·사망, 맵까지 **22개 제작 버전**을 모았습니다.

- [전체 미리보기](index.html)
- [개발 인수인계](docs/HANDOFF.md) · [디자인 결정](docs/DECISIONS.md)
- [사용 스킬과 작업 방식](docs/SKILLS.md) · [재사용 제작 스킬](skills/pupsters-block-production/SKILL.md)
- [원래 기획·브랜딩](https://github.com/zaelee/ZZEE/tree/main/20261022-puppy-defense-blueprint)

## 먼저 볼 파일

| 결과물 | 미리보기 | 다운로드 |
| --- | --- | --- |
| 앉은 강아지 6종 | [갤러리](packs/pupsters-block-pack-v4/index.html) | [ZIP](downloads/pupsters-block-pack-v4.zip) |
| 앉은 공격 6개 | [모션](packs/pupsters-sitting-attacks-v1/index.html) | [ZIP](downloads/pupsters-sitting-attacks-v1.zip) |
| 블록 몹 9종 | [갤러리](packs/pupsters-block-enemies-v1/index.html) | [ZIP](downloads/pupsters-block-enemies-v1.zip) |
| 몹 모션 27개 | [모션](packs/pupsters-enemy-motions-v1/index.html) | [ZIP](downloads/pupsters-enemy-motions-v1.zip) |
| 블록 놀이방 맵 | [3D 뷰어](packs/pupsters-block-map-v1/index.html) | [ZIP](downloads/pupsters-block-map-v1.zip) |
| 최신 2D 캐릭터와 공격 설정 | [갤러리](packs/pupsters-personality-v3/index.html) | [ZIP](downloads/pupsters-personality-v3.zip) |
| 분리된 배경·UI·캐릭터·몹 | [갤러리](packs/pupsters-separated-assets-v1/index.html) | [ZIP](downloads/pupsters-separated-assets-v1.zip) |
| 프로젝트 제작 스킬 | [SKILL.md](skills/pupsters-block-production/SKILL.md) | [ZIP](downloads/pupsters-block-production-skill.zip) |

## 다른 환경에서 이어서 작업하기

1. 이 폴더를 받거나 저장소를 복제합니다.
2. 새 작업자에게 `docs/HANDOFF.md`, `docs/DECISIONS.md`와 목표 팩의 README를 읽도록 합니다.
3. 스킬을 쓸 환경에서는 `skills/pupsters-block-production/` 폴더를 해당 환경의 스킬 경로에 복사합니다. 저장소 업로드만으로 자동 설치되지는 않습니다.
4. 예: “이 개발 키트와 `$pupsters-block-production`을 참고해서, 시바멈 공격을 수정하고 Roblox·GLB·미리보기를 함께 갱신해줘.”

3D 제작 도구는 Python 3 + NumPy + Pillow를 사용합니다. 최신 3D 5개 팩의 PNG 렌더는 기본으로 Windows 맑은 고딕을 사용합니다. 다른 환경에서는 환경 변수 PUPSTERS_FONT를 설치된 한글 폰트 파일 경로로 지정하세요. 굵은 글꼴은 PUPSTERS_FONT_BOLD로 선택할 수 있습니다. 과거 형태 탐색 버전은 당시 Windows 폰트 경로를 유지합니다. 과거 2D 제작용 Node 스크립트는 선택적으로 `sharp`가 필요합니다. 원본 AI 이미지 생성은 프롬프트와 참조 이미지를 이용한 새로운 생성 작업이며, 코드만으로 같은 이미지가 재현되는 것은 아닙니다.

팩별 생성·검사 순서는 각 README에 있습니다. 이 날짜 폴더의 목차와 최신 ZIP을 다시 만들 때는 `python tools/build_publication.py`를 실행합니다. 저장소 전체 검사는 Node 24에서 `npm run check`입니다.

## 버전과 검증

`packs/pupsters-personality-v3`는 디렉터리명을 유지했지만 실제 내용은 최종 v5입니다. v4의 중간 상태는 `packs/pupsters-personality-and-attacks-v4`에 별도로 보존했습니다. 비어 있던 screen-designs 폴더는 포함하지 않았고, 실제 화면 시안은 topdown-ui-v1에 있습니다.

원본 JSON과 생성 모델·모션·배치 데이터의 구조 및 좌표를 검사했습니다. 실제 Roblox Studio 가져오기·Play와 브라우저 WebGL 조작은 아직 미검증입니다. 체력·웨이브·타깃·피해·배치 경제 등 게임 로직은 다음 단계입니다.

[공개본 정리 내역](docs/PUBLISH-NOTES.md)과 [새 ZIP 체크섬](downloads/SHA256SUMS.txt)을 확인할 수 있습니다. 각 팩의 과거 validation/manifest는 제작 당시 검사 기록이며, 공개용 경로 정리 이후 파일의 해시는 `publication-manifest.json`과 다운로드 manifest를 기준으로 합니다.
