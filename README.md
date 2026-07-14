# ZZEE

개인적으로 만든 정적 웹 프로젝트를 한곳에서 관리하는 GitHub Pages 저장소입니다.

## Projects

- `zzee's food map/`: 건대·성수 중심 개인 맛집 지도와 플랫폼별 장소 정보
- `camping-inventory/`: 오토캠핑·백패킹 장비 인벤토리
- `blog-automation/`: 네이버 블로그 입력 문서 생성 도우미
- `haidilao/`: 하이디라오 이용 가이드
- `dtd/`: 데이브 더 다이버 운영 공략표
- `index.html`: 프로젝트 허브

## Local check

Node 버전은 `mise`로 고정합니다.

```sh
mise install
npm run check
```

의존성이 없는 정적 사이트라 빌드 단계는 없습니다. `npm run check`는 JavaScript 구문, 데이터 스키마, 장소 매칭 유틸리티, 음식 지도 런타임을 검사합니다.

맛집 데이터 수집·적용 규칙은 [`zzee's food map/docs/DATA-PIPELINE.md`](zzee%27s%20food%20map/docs/DATA-PIPELINE.md)를 참고하세요.
