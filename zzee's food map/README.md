# ZZEE's Food Map

건대와 성수 중심의 개인 맛집 아카이브입니다. HTML, CSS, JavaScript만 사용하는 GitHub Pages용 정적 사이트입니다.

## Run

`index.html`을 직접 열거나 저장소 루트에서 간단한 정적 서버를 실행합니다.

```sh
python3 -m http.server 4177
```

지도는 Leaflet과 CARTO Voyager 타일을 사용합니다. 별도 지도 API 키는 필요하지 않습니다.

## Structure

- `index.html`: 화면 구조와 Leaflet CDN 로드
- `css/style.css`: 반응형 UI, 다크 모드, 카드·모달·지도 스타일
- `js/data.js`: 개인 맛집과 검토 완료된 플랫폼 장소 스냅샷
- `js/naver-shared-restaurants.js`: 별도 공유 목록
- `js/map.js`: 지도, 타일, 마커, 팝업
- `js/app.js`: 검색, 필터, 정렬, 모달, 즐겨찾기, LocalStorage 편집
- `data/`: 과거 수집 결과 JSON
- `tools/`: 데이터 검증, 매칭 미리보기, 레거시 조사 도구
- `docs/DATA-PIPELINE.md`: 플랫폼 데이터 작업 원칙과 학습 기록

## Local editing

사이트의 `+` 버튼에서 입력한 값과 기존 맛집 수정값은 해당 브라우저의 LocalStorage에만 저장됩니다. 비밀번호는 서버 인증이 아닌 가벼운 입력 잠금이므로 민감한 정보를 넣으면 안 됩니다.

정식 반영 전에는 `js/data.js`의 개인 평가와 플랫폼 평가를 구분합니다.

- `rawRestaurants` 별점: 소유자의 개인 평가
- `platformRatings`: 카카오·네이버·구글에 표시된 공개 평점
- `null`: 평점 없음, 숨김 또는 아직 확인하지 않음

## Verify data

저장소 루트에서 다음 명령을 실행합니다.

```sh
npm run validate:data
npm run preview:kakao
npm run preview:naver
npm run check
```

적용 스크립트는 기본적으로 파일을 바꾸지 않는 미리보기입니다. 제외 사유와 후보를 검토한 뒤에만 직접 `--write`를 추가합니다.

```sh
node "zzee's food map/tools/apply-kakao-data-safe.mjs" --write
node "zzee's food map/tools/apply-naver-data-safe.mjs" --write
```

## Provider-data caution

현재 포함된 카카오·네이버 결과는 2026-06-30 스냅샷입니다. 카카오 공식 로컬 API의 장소 검색 응답에는 평점·리뷰·메뉴가 없고, 네이버 플레이스 평점도 이 프로젝트가 사용할 수 있는 공식 지도 API 필드로 간주할 수 없습니다. 따라서 레거시 수집기는 일반 업데이트 도구로 실행하지 않습니다.

최신 약관과 허용 범위를 직접 확인한 경우에만 `--acknowledge-provider-terms`를 명시해 조사 도구를 실행할 수 있습니다. 자세한 규칙은 [`docs/DATA-PIPELINE.md`](docs/DATA-PIPELINE.md)에 있습니다.
