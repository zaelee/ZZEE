사고멍치 / PUPSTERS — 네모네모 몹 모션 v1
2026-10-23

일반 몹 8종 + 블록사우루스 보스 1종에 이동·피격·사망 모션을 추가했습니다.
원본 네모 모델의 형태와 색을 유지합니다. 9종 × 3개 = 총 27개 모션입니다.

바로 보기
index.html: 전체 몹 목록, 이동/피격/사망 전환, 개별 GIF와 다운로드
viewer.html: 3D 회전, 한 번/반복 재생, 일시정지, 시간 탐색, 0.5배속
previews/enemy-motions-demo.gif: 9종의 이동 → 피격 → 사망을 이어 보여주는 비교 영상
previews/all-move.gif, all-hit.gif, all-death.gif: 동작별 전체 비교
previews/motions-overview.png: 27개 주요 포즈

동작 구성 (30 fps 원본 프레임)
Move: 1.2초 / 37프레임. 제자리 보행 또는 바퀴 회전 루프.
Hit: 0.6초 / 19프레임. 반동, 찡그린 눈, 몸체·장식 흔들림 후 기본 자세로 복귀.
Death: 1.6초 / 49프레임. 쓰러짐/무너짐 → 잠시 정지 → 축소 → 소멸.
GIF는 15 fps 비교용으로 반복 표시됩니다. 사망 GIF는 끝난 뒤 다시 나타납니다.
3D 뷰어의 한 번 재생과 Roblox Death는 사망 후 숨김 상태를 유지합니다.

개성
E01 기본 블록봇: 짧은 발로 통통 걷기 / 움찔 / 옆으로 넘어지기
E02 바퀴 블록봇: 바퀴 회전과 차체 들썩임 / 덜컥 / 전복과 바퀴 헛돌기
E03 벽돌 덩치: 묵직한 발걸음 / 윗벽돌 흔들림 / 세 층 무너지기
E04 장갑 블록봇: 짧은 장갑 보행 / 장갑 흔들림 / 단단하게 쓰러지기
E05 분열 블록봇: 세 층 엇박자 흔들림 / 아래에서 위로 반동 / 셋으로 흩어지기
E06 수리 블록봇: 렌치를 흔들며 걷기 / 팔 흔들림 / 렌치와 함께 쓰러지기
E07 투명 블록봇: 살금살금 네 발 보행 / 찌그러짐 / 납작해졌다 축소되기
E08 블록 운반차: 네 바퀴 회전과 승객 들썩임 / 덜컹 / 작은 몹 셋 떨어지기
B01 블록사우루스: 네 다리 보행과 꼬리 흔들림 / 머리 반동 / 옆으로 무겁게 쓰러지기

Roblox
roblox/Pupsters-Enemy-Motions-Demo.rbxmx: 9종 전체 자동 재생 데모.
roblox/E01-motions.rbxmx ~ E08-motions.rbxmx, B01-motions.rbxmx: 개별 적용용.
각 모델의 Motion BindableEvent에 다음 명령을 보냅니다.

  model.Motion:Fire("Move")
  model.Motion:Fire("Hit")
  model.Motion:Fire("Death")
  model.Motion:Fire("Stop")
  model.Motion:Fire("Reset")

개별 모델은 자동 재생하지 않습니다. 실행 시 Move/Hit/Death를 연결하세요.
Move 도중 Hit를 보내면 피격이 끝나고 이동 모션으로 돌아갑니다.
Death는 다른 모션을 중단하며 Reset 전까지 사망 상태를 유지합니다.
Stop은 진행 중인 모션을 멈추고 기본 자세로 복귀합니다. 사망 상태 해제에는 Reset을 씁니다.
모든 파트는 Anchored=true, CanCollide=false입니다.
MotionRoot를 기준으로 재생하므로 실제 경로 이동은 Model:PivotTo(...)로 연결할 수 있습니다.
모델 안의 스크립트가 샘플 좌표를 재생합니다. Roblox AnimationId나 Humanoid 리그 파일은 아닙니다.
이동 경로·체력·피해·충돌·분열 소환·수리 효과는 게임 시스템에서 연결해야 합니다.
사망 때 흩어지는 블록은 시각 연출이며 새 적을 소환하지 않습니다.
자세한 동작 및 데모 설정: docs/ROBLOX.txt

GLB / 원본
animations/{ID}-motions.glb에는 Move, Hit, Death라는 표준 노드 TRS 애니메이션 3개가 있습니다.
GLB를 열고 원하는 클립을 선택하세요. 앱의 애니메이션 재생 기능이 필요합니다.
animations/{ID}.json은 동일 모션의 원본 파트 형상과 모든 프레임입니다.
native/는 모션 없이 기본 자세만 있는 정적 Roblox 파일입니다.
scenes/는 원래 블록의 위치·크기·색을 수정할 수 있는 원본 JSON입니다.
앞 -Z, 위 +Y, 좌표 단위 stud입니다. 다른 3D 앱에서는 단위/가져오기 배율을 확인하세요.
투명 몹의 몸통은 불투명도 38%이며 피격·사망 때도 원래 투명도가 유지됩니다.
죽을 때 축소 후 숨겨집니다. GLB는 보이지 않을 만큼 작은 스케일로 같은 종결 상태를 표현합니다.

검증 범위
모든 27개 클립의 프레임·지면 침범·루프 연결·사망 종결·투명도를 검사했습니다.
원본 JSON, GLB, 브라우저 데이터, Roblox 내장 Lua 프레임이 일치하는지도 검사했습니다.
docs/motion-validation.json, roblox/validation.json에 결과가 있습니다.
실제 3D 좌표로 GIF와 주요 프레임을 렌더링해 확인했습니다.
브라우저 스크립트 구문 및 모의 UI 검사는 통과했습니다.
이 환경에서는 Roblox Studio/Luau 런타임과 브라우저 WebGL을 직접 실행하지 못했습니다.
따라서 Studio에서의 실제 재생과 게임 연결은 아직 검증하지 않은 상태입니다.

재생성 (Python + numpy + Pillow)
python tools/build_motions.py
python tools/render_motions.py
python tools/build_roblox_motions.py
python tools/build_motion_gallery.py
python tools/validate_motions.py

라이선스: THIRD_PARTY_NOTICES.txt (로컬 Three.js)
