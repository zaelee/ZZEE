사고멍치 / PUPSTERS — 네모네모 몹 3D v1
2026-10-23

기존 몹 기획 8종 + 블록사우루스 보스 1종을 강아지와 같은 블록 조형으로 제작했습니다.
대부분 직육면체이며 눈만 작은 납작한 구체입니다. 뾰족한 쐐기나 삼각형 장식은 없습니다.

모델
E01 기본 블록봇: 산호색 큐브와 짧은 발 / 기본 접근형
E02 바퀴 블록봇: 낮은 노랑 몸통, 큰 네모 바퀴 2개 / 고속 이동형
E03 벽돌 덩치: 넓은 초록 벽돌 3층과 큰 발 / 고내구 길막형
E04 장갑 블록봇: 두꺼운 회색 판과 사각 리벳 / 전방 방어형
E05 분열 블록봇: 서로 엇갈린 보라 큐브 3개 / 분열 압박형
E06 수리 블록봇: 민트 몸통, 네모 렌치와 예비 블록 / 지원 수리형
E07 투명 블록봇: 불투명도 38% 몸통과 파랑 테두리 / 은신 접근형
E08 블록 운반차: 열린 짐칸, 네 바퀴, 작은 빨간 몹 3개 / 적 수송형
B01 블록사우루스: 큰 청록 몸통, 네 발, 뭉툭한 산호색 등판 / 대형 돌진형

폴더
index.html: 전체 목록과 대표컷
model.html: 단일 모델 회전·정면·측면·뒷면·탑뷰, 개별 다운로드
native/: Roblox RBXMX, 개별 9개 + 전체 배치 1개
models/: GLB, glTF, OBJ, MTL
scenes/: 수정 가능한 원본 파트 좌표 JSON
previews/: 실제 모델 좌표를 렌더링한 PNG, 각 모델 4방향 이미지
tools/: 생성·내보내기·검증 Python 소스
docs/validation-report.json: 검사 결과

Roblox용
우선 native/Pupsters_Enemies_All.rbxmx 또는 개별 RBXMX를 사용하세요.
Roblox의 기본 Part로 구성되어 각 블록의 크기·위치·색을 수정할 수 있습니다.
그룹은 Body, Wheels, Armor, Cargo 등 각 모델의 구성에 맞게 분리되어 있습니다.
HitPoint Attachment가 몸체 쪽에 포함됩니다. 이는 향후 피격 효과 위치를 위한 표식입니다.
축은 위 +Y, 앞 -Z, 1좌표 단위=1 stud로 제작했습니다.
전체 배치 파일은 6 stud 간격 3×3 배치입니다. 단일 파일은 원점에 놓여 있습니다.
모든 Part는 Anchored=true, CanCollide=false인 정적 표시용 모델입니다.
이동·공격·분열·수리·은신·소환 AI나 애니메이션은 이번 파일에 포함하지 않았습니다.
특히 네모 바퀴는 현재 정적 외형입니다. 게임에서 이동하거나 굴리는 구현은 별도 작업입니다.
각 역할 설명은 디자인 방향이며 구현된 게임 동작을 뜻하지 않습니다.

일반 3D용
GLB는 한 파일이며 glTF에도 형상 데이터가 내장되어 있습니다.
OBJ는 같은 폴더의 동일 이름 MTL과 함께 사용하세요.
E07은 GLB/glTF의 alphaMode=BLEND, OBJ/MTL의 d=0.38,
Roblox의 Transparency=0.62로 실제 투명도를 기록했습니다.
GLB와 OBJ는 원본 좌표를 그대로 사용하므로 가져올 앱에서 단위를 맞춰 주세요.

미리보기와 확인 범위
대표컷과 네 방향 이미지는 scene JSON의 실제 3D 메시를 CPU로 렌더링한 결과입니다.
전체 대표컷에서 보스는 보기 좋게 축소 표시됩니다. 실제 크기는 manifest.json에 있습니다.
WebGL 뷰어는 같은 메시 데이터를 사용하며 외부 네트워크 요청 없이 동작하도록 구성했습니다.
이 환경에서는 브라우저 WebGL 실행과 Roblox Studio 직접 로드를 확인하지 못했습니다.
원본 좌표/지면 접촉/메시 닫힘/GLB·glTF·OBJ 좌표 일치/투명도/
Roblox XML 구조/HitPoint 좌표/로컬 링크/JS 구문 및 압축 파일을 검사했습니다.
Studio에서의 실제 표시·게임 동작 검증을 완료했다는 의미는 아닙니다.

재생성 (Python + numpy + Pillow 필요)
python tools/build_pack.py
python tools/export_native.py
python tools/validate_pack.py

Three.js 라이선스: THIRD_PARTY_NOTICES.txt
