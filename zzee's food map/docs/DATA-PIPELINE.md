# 장소·평점 데이터 파이프라인

이 문서는 카카오맵·네이버지도 장소 정보를 보강하며 얻은 교훈과 앞으로 지킬 작업 순서를 기록한다. 특정 실행 시점의 화면 구조보다 오래 유지되는 원칙을 우선한다.

## 확인된 경계

- 카카오 공식 로컬 REST API는 장소명, 카테고리, 전화번호, 주소, 좌표, 장소 상세 링크를 제공한다. 현재 프로젝트가 표시하는 평점, 리뷰 수, 메뉴 전체는 공식 응답 필드가 아니다.
- 네이버 공식 지도 API는 주소·좌표 변환 등 지도 기능을 제공하고, 검색 API는 지역 검색 결과를 제공한다. 네이버 플레이스 화면의 평점과 사진을 별도 데이터베이스처럼 자동 수집·저장하는 작업은 공식 API 범위로 가정하면 안 된다.
- 따라서 기존 `fetch-*.mjs` 결과는 “2026-06-30 당시 비공식 화면/엔드포인트에서 얻은 스냅샷”이다. 최신값도, 공식 보증값도 아니다.
- 제공자 화면은 로그인 상태, A/B 테스트, 상호명 변경, 지점 구분, UI 개편에 따라 언제든 파서가 깨질 수 있다.

공식 참고 문서:

- Kakao Local REST API: <https://developers.kakao.com/docs/en/local/dev-guide>
- Kakao Developers 운영 정책: <https://developers.kakao.com/terms/ko/site-policies>
- NAVER API 서비스 이용약관: <https://developers.naver.com/products/terms/>
- NAVER Cloud Maps 개요: <https://api.ncloud-docs.com/docs/ainaverapi-maps-overview>

## 안전한 작업 순서

1. 공식 API로 가능한 장소 ID·주소·좌표부터 확인한다.
2. 플랫폼 상세 링크에서 평점이 실제 표시되는지 사람이 확인한다. 표시되지 않으면 `null`로 둔다.
3. 수집 결과 JSON은 원본 스냅샷으로 보존한다. 이름만 같다고 자동 확정하지 않는다.
4. `npm run validate:data`로 ID, 날짜, 좌표, 평점 범위, 중복을 검사한다.
5. `npm run preview:kakao` 또는 `npm run preview:naver`로 적용 예정/제외 사유를 검토한다.
6. 결과가 맞을 때만 해당 스크립트에 `--write`를 추가해 `js/data.js`를 갱신한다.
7. `npm run check`를 실행하고, 웹 화면에서 플랫폼 평점과 개인 평점이 섞이지 않았는지 확인한다.

## 매칭 원칙

- 정규화한 상호명이 정확히 같거나 한쪽이 지점명까지 포함하는지를 확인한다.
- 기준 좌표와 후보 좌표가 모두 있을 때만 거리를 계산한다. 하나라도 없으면 거리는 `null`이며 자동 승인하지 않는다.
- 건대권은 광진구·성동구, 성수권은 성동구 주소를 우선한다. 동명이점은 주소와 거리를 함께 확인한다.
- 2.2km를 넘는 후보, 다른 구의 후보, 이름이 부분적으로만 맞는 후보는 수동 검토 대상으로 둔다.
- 후보가 하나뿐이라는 이유로 첫 번째 결과를 선택하지 않는다.
- 플랫폼 등록명 차이를 사람이 확인했다면 `data/place-aliases.json`에만 명시적으로 기록한다. 별칭도 주소·거리 조건을 면제하지 않는다.

## 데이터 의미

- `rawRestaurants`의 별점은 소유자의 개인 평가다.
- `platformRatings.*.rating`은 각 플랫폼에 공개적으로 표시된 값이며, 없거나 숨김이면 `null`이다.
- `checkedAt`은 실제 확인일이다. 스크립트 실행일을 과거 고정값으로 덮어쓰지 않는다.
- `ratingCount`와 `reviewCount`는 제공자마다 뜻이 다를 수 있으므로 출처 필드 없이 합산하지 않는다.
- 이미지 URL은 만료되거나 외부 노출 정책이 바뀔 수 있다. 대표 이미지의 영구 저장 권한이 불분명하면 카테고리 SVG로 대체한다.

## 라이브 수집 도구

`fetch-kakao-places.mjs`, `fetch-naver-places.mjs`, `fetch-rendered-ratings.mjs`는 레거시 조사 도구다. 일반 업데이트 명령이 아니다. 실행 전 최신 약관과 허용 범위를 직접 확인하고, 명시적인 `--acknowledge-provider-terms` 플래그를 붙여야 한다. API 키나 로그인 쿠키를 소스에 넣지 않는다.
