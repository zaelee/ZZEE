# 사고멍치 음악 인수인계 · 2026-10-29

**음악과 적용 지침 전달본. 아직 Roblox 업로드·게임 연결·최종 청취 검수는 하지 않았다.**

- [다음 작업자에게 전달할 요청](START_HERE.md)
- [파일별 사용처](MUSIC_USAGE.md) · [Roblox 적용 및 QA](ROBLOX_IMPORT_AND_QA.md)
- [56개 파일 미리 듣기](index.html)
- [원본·WAV 전체 다운로드 / GitHub Release](https://github.com/zaelee/ZZEE/releases/tag/pupsters-music-20261029)
- [업로드 후 실제 자산 ID 입력표](data/roblox-upload-register.csv)

## 포함한 파일

| 구분 | 파일 수 | 위치 | 상태 |
| --- | ---: | --- | --- |
| 게임 BGM 후보 | 34 | `audio/bgm/` | A안 후보 1 기반 루프 초안; M24는 엔딩 1회 재생 검토 |
| 이벤트 징글 | 16 | `audio/jingles/` | 1회 재생용 편집 초안 |
| 홍보 영상 | 6 | `audio/promo/` | F11/F12 각각 15·30·60초 |
| 생성 원곡 후보 | 144 | 릴리스의 원본 묶음 | 36종 × A/B × 후보 1/2 |
| 편집 WAV | 56 | 릴리스의 원본 묶음 | OGG를 다시 편집하지 않을 때 사용하는 보존본 |

저장소에 들어간 OGG 총량은 **66.62 MB**, 가장 큰 파일은 **2.92 MB**다. 일반 Git에는 작은 적용용 사본과 문서를 넣고, 큰 원본 묶음은 릴리스 첨부로 분리했다. GitHub는 일반 Git 파일 100MiB 초과를 차단하며 릴리스 첨부는 파일당 2GiB 미만을 지원한다. [파일 제한](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github), [릴리스 제한](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

## 다른 PC에서 이어서 작업

1. 이 저장소의 `gh-pages` 브랜치에서 `20261029-pupsters-music-handoff` 폴더를 받거나 릴리스의 작은 인수인계 ZIP을 받는다.
2. `index.html`에서 사용처와 소리를 확인하고 `START_HERE.md`를 최신 게임 프로젝트와 함께 다음 작업자에게 전달한다.
3. Roblox에 필요한 곡만 업로드하고 실제 자산 ID/소유자/경험 권한을 등록표에 기록한다. 등록표의 모든 ID는 처음에는 비어 있다.
4. 다른 A/B 원곡을 선택하거나 재편집할 때만 큰 원본·WAV ZIP을 추가로 받는다.

## 검증과 남은 작업

- 제공 OGG 56개: 단일 오디오 스트림, 전체 디코딩, 20MB/7분 미만, 44.1kHz 스테레오, 인코딩 후 true peak −1dBTP 이하 검사 통과. [파일별 결과](data/audio-files.json)
- 원본은 로컬에서 144개 전체 디코딩·중복 검사를 통과했다. 공개 원본 묶음은 계정 화면·개인 경로·비공개 다운로드 URL을 제거하고 200개 오디오의 디코딩 결과가 기존 파일과 동일함을 확인했다.
- 편집 시 선택한 A/후보 1은 임시 기준이다. 루프의 음악적 이음새, 실제 박자, 보컬 유무, 반복 피로, 효과음과의 조화는 **미검증**이다.
- 최신 게임 소스에서의 연결·기기별 실행·Roblox 업로드 및 심사는 **미실행**이다.

공개 인수인계는 별도 음원 재사용 라이선스를 선언하지 않는다. 계정/결제/로그인 자료는 포함하지 않는다.
