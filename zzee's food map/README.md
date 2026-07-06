# ZZEE's Food Map

건대와 성수 중심의 개인 맛집 아카이브 정적 웹사이트입니다. HTML, CSS, JavaScript만 사용하며 GitHub Pages 배포를 기준으로 구성했습니다.

## 실행

`index.html`을 브라우저에서 열면 바로 확인할 수 있습니다.

지도는 Leaflet과 CARTO Voyager 타일을 사용합니다. 별도 지도 API 키 없이 GitHub Pages에서 바로 표시됩니다.

## 구조

- `index.html`: 화면 구조와 Leaflet CDN 로드
- `css/style.css`: 반응형 UI, 다크모드, 카드/모달/지도 스타일
- `js/data.js`: 맛집 데이터, 검색어, 지도별 링크/평점 표시 구조
- `js/map.js`: Leaflet 지도 로딩, CARTO/OpenStreetMap 타일, 마커, 팝업, 임시 지도
- `js/app.js`: 검색, 지역/카테고리/별점 필터, 정렬, 모달, 즐겨찾기, 최근 본 맛집, 로컬 맛집 추가
- `images/`: 카테고리별 대표 이미지

## 맛집 추가

사이트 우측 상단의 `+` 버튼으로 여는 `맛집 추가` 패널에서 비밀번호, 가게명, 한줄평, 주소만 입력하면 브라우저 LocalStorage에 검증전 맛집을 임시 저장할 수 있습니다. 지역, 카테고리, 지도 검색 링크, 임시 좌표, 기본 이미지는 입력값을 기준으로 자동 생성됩니다. 검증전 맛집은 재리 별점이 `?`로 표시됩니다.

카드의 수정 버튼으로 기존 맛집과 로컬로 추가한 맛집을 다시 열어 수정할 수 있고, 저장할 때 같은 비밀번호를 다시 요구합니다. 기존 맛집 수정값은 원본 파일을 바꾸지 않고 LocalStorage 덮어쓰기 값으로 저장됩니다.

정적 사이트라 이 비밀번호는 서버 보안이 아니라 가벼운 입력 잠금입니다. 정식 데이터로 반영할 식당은 나중에 `js/data.js`의 `rawRestaurants`와 장소 데이터에 옮겨 넣고 `verificationStatus`를 `검증후`로 관리하면 됩니다.

## 데이터 메모

현재 `address`, `latitude`, `longitude`, 카카오 장소 링크, 카카오 평점, 대표 메뉴/가격은 카카오맵 장소 상세 데이터를 기준으로 2026-06-30에 반영했습니다. 카카오맵에 평점이 표시되지 않는 식당은 평점 값을 비워두고 `카카오 평점 미표시`로 남겼습니다.

네이버/구글 평점은 로그인/동적 화면 제약이 있어 자동 입력하지 않았습니다. 검증한 값이 생기면 `js/data.js`에서 아래 필드를 식당별로 덮어쓰면 됩니다.

- `verifiedAt`: 식당 데이터 확인일
- `address`, `latitude`, `longitude`: 정확 주소와 지도 좌표
- `menuItems`: 대표 메뉴 3개와 가격
- `priceRange`, `priceSource`: 가격대와 확인 출처
- `platformRatings.kakao/naver/google.rating`
- `platformRatings.kakao/naver/google.checkedAt`

## 데이터 보강 도구

- `tools/fetch-kakao-places.mjs`: `rawRestaurants` 전체를 카카오맵 검색/장소 상세 API로 조회하고 결과를 `data/kakao-place-results.json`에 저장합니다.
- `tools/apply-kakao-data.mjs`: `data/kakao-place-results.json`의 핵심 값을 `js/data.js`에 반영합니다.
- `tools/fetch-naver-places.mjs`: `rawRestaurants` 전체를 네이버 모바일 지도 검색으로 조회하고 결과를 `data/naver-place-results.json`에 저장합니다.
- `tools/probe-naver-queries.mjs`: 상호명이 다르게 등록된 식당을 별칭 쿼리로 확인할 때 사용합니다.
