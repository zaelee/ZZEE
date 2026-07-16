# 리서치 노트 — 2026-07-16

## 결론부터

프리셋 A는 제작 변수를 줄이는 `30분·5막`, 프리셋 B `BEFORE THE NEXT FALL`은 사용자가 정한 55–65분 범위의 중앙값인 `60분·10곡`으로 시작한다. 약 1시간은 사이버펑크·다크 앰비언트 공개 표본에서 반복되는 강한 형식이고, 10곡은 공식 사이트가 밝힌 10부작과 구조적으로만 대응한다. 실제 에피소드의 사건·순서·결말은 예측하지 않는다.

이 수치는 YouTube 알고리즘의 규칙이 아니다. 공개 표본의 형식과 YouTube가 제공하는 분석 지표를 결합한 **검증용 시작 가설**이다.

## 1. Mureka 현재 기능과 프롬프트 방향

- [Mureka API 공식 소개](https://platform.mureka.ai/)는 기악 생성에 텍스트 프롬프트와 레퍼런스 트랙을 함께 사용할 수 있다고 설명한다.
- [Mureka API 문서](https://platform.mureka.ai/docs/)는 Song Generation, Instrumental Generation, Lyrics Generation, Song Extension을 구분한다.
- [Instrumental Generation API](https://platform.mureka.ai/docs/api/operations/post-v1-instrumental-generate.html)는 비동기 작업 형태다. 이 프로젝트는 정적 GitHub Pages에서도 안전하도록 API를 직접 호출하지 않는다.
- [파일 업로드 API](https://platform.mureka.ai/docs/api/operations/post-v1-files-upload.html)는 `melody`에 5–60초 MP3/M4A/MID를 허용하며 MIDI를 권장한다. `reference`와 `instrumental` 오디오는 MP3/M4A, 정확히 30초이며 초과 구간은 잘린다.
- [변경 기록](https://platform.mureka.ai/docs/en/changelog.html)에는 2026-02-05 기악 생성과 mureka-7.6, 2026년의 후속 모델 개선이 기록되어 있다.
- [Mureka 약관 PDF](https://www.mureka.ai/static/terms-20260513.pdf)는 2026-05-13 버전이다. 상업 게시 시점에 더 새 약관이 있는지 다시 확인해야 한다.

프롬프트에는 추상적인 감정만 쓰지 않고 `기악/무대사 → 장르 → BPM → 조성/모드 → 박자 → 악기 → 환경 질감 → 장면 → 현재 막 → 제외 요소` 순서를 사용한다. 전체 플레이리스트와 모든 막을 한 번에 요청하지 않고, 재사용할 메인 사운드 바이블에 현재 막 하나만 붙여 생성한다. Mureka 생성 한 번에는 3가지 변주 중 하나만 붙여 비교 가능성을 유지한다.

레퍼런스는 다음 순서로 사용한다.

1. 텍스트만으로 3개를 생성해 음색과 공간감을 고른다.
2. 음색은 좋지만 3–4음 기억 모티프가 흔들릴 때만 Studio가 만든 30초 MIDI를 `Melody ideas`에 넣는다.
3. Reference 오디오가 꼭 필요하면 자체 MIDI를 렌더링하고 직접 녹음한 공간음만 더해 정확히 30초 MP3/M4A로 만든다.
4. 타인의 상업음원·북한 노래·애니메이션 OST는 업로드하지 않는다. 약관상 사용자는 입력물에 필요한 권리를 보유해야 하고, 입력물은 비밀 자료로 취급되지 않을 수 있다.

## 2. Edgerunners 2 공식 정보와 팬 작품 경계

- [공식 작품 페이지](https://www.cyberpunk.net/en/edgerunners2)의 현재 공개 창은 `Fall 2026`이며, 새 인물과 새 이야기를 다루는 독립된 10화 작품이다.
- 현재 공식 소개에서 공개된 핵심은 크롬과 과거의 영광을 잃은 전설, 클랜의 복수를 좇는 네트러너, 진실을 기록하는 다큐멘터리스트, 기업 타워와 거리 사이에서 자란 인물까지다. 트랙 2–5는 이 공개 정보와 정서적으로 맞추되 이름·사건·결말을 음악으로 단정하지 않는다.
- [공식 티저 2 소식](https://www.cyberpunk.net/en/news/51984/just-released-cyberpunk-edgerunners-2-official-teaser-2)에서 현재 제작진 정보가 갱신되어 있다.
- [CD PROJEKT RED 팬 콘텐츠 가이드라인](https://www.cdprojektred.com/en/fan-content)은 YouTube 같은 팬 영상을 허용하지만 비공식임을 명확히 밝히라고 요청한다. 그래서 설명과 내보내기에 `This is an unofficial fan work and is not approved or endorsed by CD PROJEKT RED.`를 고정한다.
- 가이드라인은 공식 음악에 별도 제3자 권리가 있을 수 있다고 설명한다. 공식 OST·라디오 음악·대사·캐릭터 음성은 Mureka 입력 소스나 재현 목표에서 제외한다.

정확한 공개일은 아직 고정하지 않는다. 현재 프로젝트는 배포 노드를 다루지 않으므로 `Fall 2026`만 사실성 메모에 남긴다.

관심을 끄는 스틸은 가능하지만 기존 캐릭터·의상·로고·공식 스틸을 복제하지 않는다. 이미지 프롬프트에는 특정 스튜디오 이름 대신 `leaked analog broadcast still`, `35mm surveillance framing`, `damaged scanlines`, `camera-gate dust`, `low exposure` 같은 일반 속성을 사용한다. 크루는 공식 인물과 닮지 않은 완전히 독창적인 익명 인물이며, 글자는 생성 이미지가 아니라 후편집으로 얹는다.

## 3. 장시간 플레이리스트 표본

[YouTube의 앰비언트 음악 동향 글](https://blog.youtube/culture-and-trends/ambient-music/)은 이 장르에서 긴 러닝타임, 연속 스트림, 반복 비주얼이 배경 사용을 지원한다고 설명한다.

2026-07-15에 검색 가능한 공개 YouTube Music 메타데이터에서 확인한 형식 표본:

| 형식 표본 | 공개 길이 | 읽을 수 있는 신호 |
|---|---:|---|
| [The Guild of Ambience · Corridors](https://huntertuber.com/%40GuildofAmbience/videos) | 31분 26초 | 규모가 있는 앰비언트 채널에도 30분대 작품이 존재 |
| [Cryo Chamber 등이 포함된 다크 우주 앰비언트 모음](https://music.youtube.com/playlist?list=PLxkNYq3SHQ9TOF4WsssQFI46Q2-zyQ_LL) | 54분, 57분, 61분, 65분, 75분, 95분, 3시간대 등 | 1시간 전후와 3시간 사용군이 공존 |
| [NEXUS · Dark Dystopian Ambient](https://music.youtube.com/podcast/ZuggW2DAoJU) | 60분 | 하나의 장소/서사를 1시간 사운드스케이프로 유지 |
| [FOCUS AURA · Cyberpunk Phonk](https://music.youtube.com/podcast/1XbXIobY6EA) | 61분 | 약 3–5분 간격의 촘촘한 트랙리스트, 게임/업무 용도 |
| [Futuristic Samurai Blade · Sci-Fi Journey](https://music.youtube.com/podcast/moi150bziGA) | 101분 | 서사형 SF 여정의 1시간 초과형 |
| [Cyberpunk ambience for sleep](https://music.youtube.com/podcast/PpKAwuK2vog) | 180분 | 수면이라는 명확한 장시간 사용 목적 |
| [10-hour space rumble](https://music.youtube.com/watch?v=TPWYQ94Ief4) | 10시간 | 단일 환경음·수면 루프의 극장시간형 |

표본은 성공을 보장하는 성과 순위가 아니며, 장르의 **포맷 범위**를 보기 위한 것이다. 류경호텔 작품은 30분 파일럿 가설을 유지하고, `BEFORE THE NEXT FALL`은 54·57·60·61·65분 표본군과 사용자 요청을 함께 반영해 60분으로 둔다.

## 4. 기승전결 시작값

30분 초기 공개편:

| 구간 | 역할 | 에너지 |
|---|---|---:|
| 0:00–1:39 | 문턱: 7–12초 안에 시각 정체성, 20초 안에 대표 음색 | 24 |
| 1:39–6:34 | 공간 확립: 장소 규칙과 반복 모티프 | 36 |
| 6:34–14:04 | 탐색/의식: 사물·리듬·저역을 천천히 추가 | 48 |
| 14:04–19:41 | 금지/추격: 불협과 밀도 상승 | 70 |
| 19:41–25:19 | 절정: 가장 선명한 선율, 거대한 EDM 드롭은 피함 | 86 |
| 25:19–30:00 | 잔향/귀환: 첫 장면으로 루프 | 30 |

류경호텔 프리셋은 명시적인 5막을 사용한다. `BEFORE THE NEXT FALL`은 10개 트랙의 가중치를 8·9·10·10·10·11·11·12·10·9%로 두어 `0:00 → 4:48 → 10:12 → 16:12 → 22:12 → 28:12 → 34:48 → 41:24 → 48:36 → 54:36 → 60:00`으로 흐른다. 가장 높은 밀도는 8곡째 41:24–48:36에만 두고, 9곡째에는 모든 것을 잠시 멈춘 뒤 10곡째에서 인간 모티프를 지워 첫 곡으로 루프한다. 전환은 6–12초 크로스페이드를 시작값으로 쓴다.

## 5. YouTube 업로드 입력 기준

- [영상 세부정보 공식 도움말](https://support.google.com/youtube/answer/57404?hl=ko)에 따라 제목은 100자, 설명은 5,000자 이내로 검사한다. 태그보다 제목·썸네일·설명이 발견에 더 중요한 요소라는 안내를 화면에도 반영한다.
- [설명 작성 공식 도움말](https://support.google.com/youtube/answer/12948449?hl=ko)에 맞춰 첫 문단에 영상의 고유한 장면과 약속을 두고, 아래에 챕터·작품 고지·해시태그를 합친다.
- [수동 챕터 공식 기준](https://support.google.com/youtube/answer/9884579?hl=ko)에 따라 첫 타임스탬프를 `00:00`으로 두고 오름차순 3개 이상, 각 구간 10초 이상인지 확인한다.
- [변경되거나 합성된 콘텐츠 공식 기준](https://support.google.com/youtube/answer/14328491?hl=ko)은 합성 음악을 공개 대상 예시로 든다. 따라서 Mureka 음악이나 현실적으로 보이는 합성 이미지를 사용하면 `예`를 선택하도록 기본값을 고정한다.
- [동영상 태그 공식 도움말](https://support.google.com/youtube/answer/146402?hl=ko)에 따라 태그는 `랭면/냉면` 같은 표기 변형과 팬 작품 검색어에만 보조로 쓴다. 설명에 과도한 태그를 나열하지 않는다.
- [맞춤 미리보기 이미지 공식 기준](https://support.google.com/youtube/answer/72431?hl=ko)에 따라 16:9, 권장 3840×2160, 최소 너비 640px, JPG/PNG 형식을 제작 메모로 제공한다.
- [재생목록 만들기 공식 도움말](https://support.google.com/youtube/answer/57792?hl=ko)에 맞춰 영상 입력과 재생목록 제목·설명을 별도 복사 블록으로 둔다. 공개 범위는 실제 Studio에서 사용자가 최종 결정한다.

업로드 자체는 앱에서 자동화하지 않는다. 비공개로 먼저 저장하고 처리·저작권 검사·모바일 설명·챕터·썸네일을 확인한 뒤 예약 또는 공개하는 체크리스트만 제공한다.

## 6. 유리한 검증 방식

[YouTube 참여도 도움말](https://support.google.com/youtube/answer/9313698)은 평균 시청시간과 핵심 순간 유지율을 제공하고, 비슷한 길이의 최근 영상과 일반적인 유지율을 비교할 수 있다고 설명한다. [YouTube 검색·추천 설명](https://support.google.com/youtube/answer/9962575)은 검색 관련성에 제목·설명·영상 내용의 일치와 참여 신호가 쓰인다고 설명한다.

첫 3–5편에서 한 번에 하나만 바꾼다.

1. 작품 제목 `지배인 동지, 랭면이 불었습니다.`는 고정하고 두 그릇·재킷·호텔 열쇠의 화면 내 비중만 변경.
2. 이긴 정물 구도를 고정하고 복도 시점·식탁 시점·85mm 흔적 정물을 비교.
3. 초기 3–5편을 30분으로 고정해 콘셉트별 유지 곡선을 축적.
4. 30분 작품이 채널의 평균 시청시간 기준선을 넘으면 동일 콘셉트의 60분 비교편 제작.

CTR만 높고 첫 30초가 급락하면 썸네일의 약속과 실제 첫 장면/첫 음색이 불일치한 것이다. 평균 시청시간만 보고 길이를 계속 늘리지 말고, 핵심 구간 유지율과 재방문 시청자를 함께 본다.

## 7. 참고 이미지 수집 방식

2026-07-15에 2단계 키워드를 다음 검색 묶음으로 나눠 Wikimedia Commons에서 프레임을 찾았다.

- 평양 여름 누아르: `Ryugyong Hotel humid summer skyline`, `empty hotel banquet hall after closing`, `two untouched raengmyeon bowls melted ice`, `jacket on chair hotel key still life`, `half open banquet door`.
- BEFORE THE NEXT FALL: `CCTV control room monitor wall`, `CRT off air damaged broadcast`, `analog film reel unauthorized archive`, `analog movie camera documentary crew`, `wet dystopian city pedestrians night`, `neon reflections rain street`.

각 프리셋은 10개 프레임을 제공한다. 평양 프리셋은 원본 관찰을 `습한 여름·녹은 얼음·두 자리·재킷·열쇠·반쯤 열린 문`의 새 장면으로 결합한다. 팬 플레이리스트 프리셋은 CCTV·CRT·필름 릴·영화 카메라·젖은 도시·네온·브루탈리즘을 `1화 이전 비인가 기록`이라는 새 구도로 결합한다. 앱의 각 카드에서 Wikimedia Commons 파일 페이지로 이동해 저작자와 개별 라이선스를 확인할 수 있다.

참고 프레임은 이미지 생성기에 그대로 넣기 위한 완성 시안이 아니다. 카드의 실제 장면과 다른 `렌즈·시점·노출·시간대·광원·배경` 메모를 붙여 한 원본의 표면적 변형이 아니라 여러 관찰을 결합한 새로운 장면 설계를 유도한다.
