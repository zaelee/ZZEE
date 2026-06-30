# 재리의 맛집 (Jae's Food Map)

건대 중심의 개인 맛집 아카이브 정적 웹사이트입니다. HTML, CSS, JavaScript만 사용하며 GitHub Pages 배포를 기준으로 구성했습니다.

## 실행

`index.html`을 브라우저에서 열면 바로 확인할 수 있습니다.

지도는 Leaflet과 CARTO Voyager 타일을 사용합니다. 별도 지도 API 키 없이 GitHub Pages에서 바로 표시됩니다.

## 구조

- `index.html`: 화면 구조와 Leaflet CDN 로드
- `css/style.css`: 반응형 UI, 다크모드, 카드/모달/지도 스타일
- `js/data.js`: 맛집 데이터, 검색어, 지도별 링크/평점 표시 구조
- `js/map.js`: Leaflet 지도 로딩, CARTO/OpenStreetMap 타일, 마커, 팝업, 임시 지도
- `js/app.js`: 검색, 필터, 정렬, 모달, 즐겨찾기, 최근 본 맛집
- `images/`: 카테고리별 대표 이미지

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
