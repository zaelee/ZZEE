# 리서치 노트 — 2026-07-15

## 결론부터

첫 공개값은 `28분 파일럿 → 64분 대표편 → 검증 후 128분 확장편`이 가장 실용적이다. 약 1시간은 사이버펑크·다크 앰비언트 공개 표본에서 반복적으로 보이는 단위이고, 더 긴 2–3시간/10시간 콘텐츠는 집중·테이블탑·수면처럼 사용 목적이 더 분명한 별도 군이다. 따라서 새 레이블이 처음부터 제작비가 큰 초장편 하나에 베팅하기보다, 짧은 파일럿으로 패키징을 확인한 뒤 늘리는 편이 유리하다.

이 수치는 YouTube 알고리즘의 규칙이 아니다. 공개 표본의 형식과 YouTube가 제공하는 분석 지표를 결합한 **검증용 시작 가설**이다.

## 1. Mureka 현재 기능과 프롬프트 방향

- [Mureka 기능 소개](https://www.mureka.ai/features)는 텍스트 프롬프트, 장르·무드, 다국어 입력, 곡 구조, 레퍼런스 트랙 사용을 설명한다.
- [Mureka API 문서](https://platform.mureka.ai/docs/)는 Song Generation, Instrumental Generation, Lyrics Generation, Song Extension을 구분한다.
- [Instrumental Generation API](https://platform.mureka.ai/docs/api/operations/post-v1-instrumental-generate.html)는 비동기 작업 형태다. 이 프로젝트는 정적 GitHub Pages에서도 안전하도록 API를 직접 호출하지 않는다.
- [변경 기록](https://platform.mureka.ai/docs/en/changelog.html)에는 2026-02-05 기악 생성과 mureka-7.6, 2026년의 후속 모델 개선이 기록되어 있다.
- [Mureka 약관 PDF](https://www.mureka.ai/static/terms-20260513.pdf)는 2026-05-13 버전이다. 상업 게시 시점에 더 새 약관이 있는지 다시 확인해야 한다.

프롬프트에는 추상적인 감정만 쓰지 않고 `기악 → 장르 → BPM → 조성/모드 → 박자 → 악기 → 환경 질감 → 장면 → 전개 → 제외 요소` 순서를 사용한다. Mureka 생성 한 번에는 3가지 변주 중 하나만 붙여 비교 가능성을 유지한다.

## 2. Edgerunners 2 타이밍과 독창성 경계

- [공식 작품 페이지](https://www.cyberpunk.net/en/edgerunners2)의 현재 공개 창은 `Fall 2026`이다.
- [CD PROJEKT RED 공식 발표](https://www.cdprojekt.com/en/media/news/cyberpunk-edgerunners-2-officially-announced/)는 Netflix용 독립된 10화 이야기라고 설명한다.
- [공식 티저 2 소식](https://www.cyberpunk.net/en/news/51984/just-released-cyberpunk-edgerunners-2-official-teaser-2)에서 현재 제작진 정보가 갱신되어 있다.

정확한 날짜가 아직 노드의 고정값이 될 수 없으므로 `T-10주` 같은 상대 일정으로 둔다. 공식 날짜 발표 후 캘린더 노드만 이동한다.

관심을 끄는 스틸은 가능하지만 기존 캐릭터·의상·로고·공식 스틸을 복제하지 않는다. 이미지 프롬프트에는 특정 스튜디오 이름 대신 `original 2D animated sci-fi still`, `kinetic diagonal framing`, `hard rim light`, `cel shading`, `chromatic split`, `35mm grain`처럼 일반적인 시각 속성을 사용한다. 썸네일과 설명에는 `original / unofficial / not affiliated`를 명시한다.

## 3. 장시간 플레이리스트 표본

[YouTube의 앰비언트 음악 동향 글](https://blog.youtube/culture-and-trends/ambient-music/)은 이 장르에서 긴 러닝타임, 연속 스트림, 반복 비주얼이 배경 사용을 지원한다고 설명한다.

2026-07-15에 검색 가능한 공개 YouTube Music 메타데이터에서 확인한 형식 표본:

| 형식 표본 | 공개 길이 | 읽을 수 있는 신호 |
|---|---:|---|
| [Cryo Chamber 등이 포함된 다크 우주 앰비언트 모음](https://music.youtube.com/playlist?list=PLxkNYq3SHQ9TOF4WsssQFI46Q2-zyQ_LL) | 54분, 57분, 61분, 65분, 75분, 95분, 3시간대 등 | 1시간 전후와 3시간 사용군이 공존 |
| [NEXUS · Dark Dystopian Ambient](https://music.youtube.com/podcast/ZuggW2DAoJU) | 60분 | 하나의 장소/서사를 1시간 사운드스케이프로 유지 |
| [FOCUS AURA · Cyberpunk Phonk](https://music.youtube.com/podcast/1XbXIobY6EA) | 61분 | 약 3–5분 간격의 촘촘한 트랙리스트, 게임/업무 용도 |
| [Futuristic Samurai Blade · Sci-Fi Journey](https://music.youtube.com/podcast/moi150bziGA) | 101분 | 서사형 SF 여정의 1시간 초과형 |
| [Cyberpunk ambience for sleep](https://music.youtube.com/podcast/PpKAwuK2vog) | 180분 | 수면이라는 명확한 장시간 사용 목적 |
| [10-hour space rumble](https://music.youtube.com/watch?v=TPWYQ94Ief4) | 10시간 | 단일 환경음·수면 루프의 극장시간형 |

표본은 성공을 보장하는 성과 순위가 아니며, 장르의 **포맷 범위**를 보기 위한 것이다. 이를 토대로 새 채널의 대표편을 64분으로 두고, 128분 확장은 반응 확인 뒤로 미룬다.

## 4. 기승전결 시작값

64분 대표편:

| 구간 | 역할 | 에너지 |
|---|---|---:|
| 0:00–3:31 | 문턱: 7–12초 안에 시각 정체성, 20초 안에 대표 음색 | 24 |
| 3:31–14:01 | 공간 확립: 장소 규칙과 반복 모티프 | 36 |
| 14:01–30:01 | 탐색/의식: 사물·리듬·저역을 천천히 추가 | 48 |
| 30:01–41:59 | 금지/추격: 불협과 밀도 상승 | 70 |
| 41:59–54:01 | 절정: 가장 선명한 선율, 거대한 EDM 드롭은 피함 | 86 |
| 54:01–64:00 | 잔향/귀환: 첫 장면으로 루프 | 30 |

9–12개 챕터, 평균 4–7분, 6–12초 크로스페이드를 초기값으로 둔다. 집중형은 갑작스러운 무음이나 음량 점프를 피하고, 사이버펑크형의 가장 높은 밀도도 전체의 약 65–84% 구간에 제한해 청취 피로를 줄인다.

## 5. 유리한 검증 방식

[YouTube 참여도 도움말](https://support.google.com/youtube/answer/9313698)은 평균 시청시간과 핵심 순간 유지율을 제공하고, 비슷한 길이의 최근 영상과 일반적인 유지율을 비교할 수 있다고 설명한다. [YouTube 검색·추천 설명](https://support.google.com/youtube/answer/9962575)은 검색 관련성에 제목·설명·영상 내용의 일치와 참여 신호가 쓰인다고 설명한다.

첫 3–5편에서 한 번에 하나만 바꾼다.

1. 같은 음악 구조, 썸네일의 주 피사체만 변경.
2. 이긴 썸네일을 고정하고 한글/영문 제목 문법 변경.
3. 이긴 패키지를 고정하고 28분과 64분의 유지 곡선 비교.
4. 64분이 채널의 평균 시청시간 기준선을 넘으면 128분 제작.

CTR만 높고 첫 30초가 급락하면 썸네일의 약속과 실제 첫 장면/첫 음색이 불일치한 것이다. 평균 시청시간만 보고 길이를 계속 늘리지 말고, 핵심 구간 유지율과 재방문 시청자를 함께 본다.

## 6. 참고 이미지 수집 방식

2026-07-15에 2단계 키워드를 다음 검색 묶음으로 나눠 Wikimedia Commons에서 프레임을 찾았다.

- 류경호텔: `Ryugyong Hotel distant skyline`, `Ryugyong Hotel at night`, `Pyongyang skyline at night`, `mul-naengmyeon`, `Soviet hotel restaurant interior`.
- 사이버펑크: `neon reflections rain street`, `Hong Kong neon signs night`, `Tokyo neon blue hour`, `brutalist concrete geometry night`.

각 프리셋은 건물 외관만 반복하지 않고 장소·도시 빛·음식 정물·내부 공간, 또는 빗길·간판·도로 깊이·브루탈리즘 구조를 섞어 10개로 구성했다. 앱의 각 카드에서 Wikimedia Commons 파일 페이지로 이동해 저작자와 개별 라이선스를 확인할 수 있다.

참고 프레임은 이미지 생성기에 그대로 넣기 위한 완성 시안이 아니다. 카드의 실제 장면과 다른 `렌즈·시점·노출·시간대·광원·배경` 메모를 붙여 한 원본의 표면적 변형이 아니라 여러 관찰을 결합한 새로운 장면 설계를 유도한다.
