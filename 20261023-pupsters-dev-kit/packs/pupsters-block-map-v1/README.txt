사고멍치 / Pupsters — 블록 놀이방 맵 v1
제작일: 2026-10-23

기존 네모네모 강아지·몹과 같은 크기 기준으로 만든 실제 3D 맵입니다.
장난감 상자에서 시작해 꺾인 S자 길을 따라 강아지 쉼터에 도착합니다.
나무 바닥, 소파, 책장, 화분, 장난감, 물그릇도 각진 블록 형태로 구성했습니다.

먼저 보기
- index.html: 로컬 3D 뷰어와 다운로드 목록. 시점 변경, 회전·확대, 배치 칸 선택 지원.
- previews/map-showcase.png: 강아지 6종과 몹 5마리를 놓은 실제 크기 예시.
- previews/map-overview.png: 캐릭터 없는 빈 맵.
- previews/map-top.png: 경로점과 P01~P16 배치 칸을 표시한 탑뷰.

맵 규격
- 전체: 76 × 52 studs, 바닥 윗면 Y=0.
- 몹 길: 폭 6 studs, 윗면 Y=0.10, 중심 경로 길이 192 studs.
- 경로점: W01~W06 순서. 시작과 끝이 다른 열린 S자 경로.
- 강아지 자리: 16개, 각 4.2 × 4.2 studs. 안쪽 12개 / 바깥쪽 4개.
- 패드 외곽 윗면 Y=.22, 중앙 3.65 × 3.65 면 윗면 Y=.26.
- 배치 좌표는 중앙 면 Y=.26 기준. 발바닥 무늬는 비충돌 장식.
- 길과 배치 칸 사이에 간격을 두고, 보스의 회전 반경이 길 안에 들어가는지 검사했습니다.

Roblox 파일
- native/Pupsters_Block_Playroom_Map.rbxmx: 맵만 있는 버전.
- native/Pupsters_Block_Playroom_Showcase.rbxmx: 맵 + 정적 캐릭터 배치 예시.
- 둘 중 하나를 선택해 가져오세요. 둘 다 같은 자리에 넣으면 맵이 겹칩니다.
- PathWaypoints 폴더: 투명한 W01~W06 좌표 표식.
- PlacementSlots 폴더: 투명한 P01~P16 배치 표식. CFrame에 배치 방향 포함.
- MapData ModuleScript: 경로와 배치 칸의 데이터.
- 모델은 고정된 Part로 구성했습니다. 바닥·가구·길·패드는 충돌 가능하고,
  예시 캐릭터와 작은 장식은 충돌하지 않습니다.
- 맵을 이동·회전하면 PathWaypoints/PlacementSlots의 현재 Position/CFrame을 사용하세요.
  MapData와 layout.json의 좌표는 원래 맵 배치 기준이며 자동 갱신되지 않습니다.
- 몹 생성·이동 AI, 강아지 구매·배치, 공격·승패 로직은 포함하지 않습니다.
  이전에 만든 공격/몹 모션 팩과 연결할 수 있도록 경로와 자리를 분리했습니다.
- 자세한 구조: docs/ROBLOX.txt.

다른 3D 도구
- models/: Map과 Showcase 각각 GLB, glTF, OBJ+MTL.
- 1 단위 = 1 stud로 제작. 도구가 미터 단위를 가정하면 전체 맵과 캐릭터에
  같은 단위 변환을 적용해야 비율이 유지됩니다.
- glTF/GLB에는 각 파트와 그룹, W/P 좌표 앵커가 있습니다.
  패드 방향과 상세 배치 정보는 layout.json 또는 Roblox 표식을 참조하세요.

편집용 원본
- scenes/map.json, scenes/showcase.json: 최종 파트·재질·배치 데이터.
- source-models/: 예시에 사용한 기존 앉은 강아지와 몹의 원본.
- layout.json: 길, 배치 칸, 출입구, 예시 캐릭터 위치.
- tools/build_map.py: 맵과 GLB/glTF/OBJ, 뷰어 데이터 생성.
- tools/export_map_native.py: Roblox 파일 생성.
- tools/render_map.py: 실제 모델에서 정적 미리보기 렌더.
- tools/validate_map.py: 형상·내보내기·배치 검사.

재생성 (Python 3, numpy, Pillow 필요)
  python tools/build_map.py
  python tools/export_map_native.py
  python tools/render_map.py
  python tools/validate_map.py

검증 범위
- 맵 271파트 / 배치 예시 포함 522파트.
- 원본·GLB·glTF·OBJ·RBXMX·뷰어의 좌표 일치 검사 통과.
- 16개 배치 칸, 소품과 길의 간격, 6종 강아지 크기, 보스 회전 공간 검사 통과.
- 최종 3D 전경 및 탑뷰 PNG를 렌더해 육안 확인했습니다.
- JavaScript 구문 및 DOM 대역을 사용한 뷰어 제어 검사 통과.
- 실제 브라우저 WebGL 실행 및 Roblox Studio 가져오기 검사는 하지 못했습니다.
- 상세 검사 결과: docs/map-validation.json, native/export-checks.json.

이 패키지의 배치 예시는 정적 모델입니다. 개별 캐릭터 애니메이션은 이전 모션 팩을 사용하세요.
뷰어의 Three.js 라이선스는 THIRD_PARTY_NOTICES.txt에 포함했습니다.
