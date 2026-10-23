# 사용한 방법과 재사용 스킬

이 목록은 이 프로젝트에 실제로 관련된 방법만 정리한다. 설치된 플러그인 전체 목록이나 시스템 지침 사본은 포함하지 않는다.

| 방법 | 이 프로젝트에서 한 일 | 재사용할 때 |
| --- | --- | --- |
| Image generation | 초기 2D 캐릭터 외형, 공격 자세와 이펙트 탐색. 근거는 [`pupsters-personality-v3`](../packs/pupsters-personality-v3/README.md)에 남아 있다. | 새 시각 방향을 탐색하거나 기존 2D 이미지를 수정할 때 |
| Ponytail | 필요한 산출물과 검증만 남기고 불필요한 추상화·기능 확대를 피했다. | 팩 구조나 생성 도구를 최소 변경으로 고칠 때 |
| Karpathy guidelines | 원본, 파생 파일, 호출부와 검증 범위를 함께 확인하고 미검증 사항을 명시했다. | 생성 파이프라인을 수정하거나 회귀 범위를 정할 때 |
| Skill Creator | 실제 제작 흐름을 짧은 프로젝트 전용 스킬로 정리하고 frontmatter를 검증했다. | 반복 제작 절차를 다른 Codex 작업에서 재사용할 때 |

## 포함된 프로젝트 스킬

[`pupsters-block-production`](../skills/pupsters-block-production/SKILL.md)은 다음 작업에 쓸 수 있다.

- 블록 강아지·적·맵의 scene JSON 수정과 파생 형식 재생성
- 강아지 공격 또는 적 이동·피격·사망 모션 추가
- GLB, Roblox, 웹 프리뷰 사이의 좌표·프레임 일치 검증
- 구현된 에셋과 아직 연결하지 않은 게임 시스템의 경계 문서화

호출 예:

```text
$pupsters-block-production D04 미글의 침 공격 타이밍을 조정하고 관련 팩을 다시 검증해 줘.
```

```text
$pupsters-block-production 기존 블록 비율을 유지한 새 적 1종을 추가하고 GLB·RBXMX·프리뷰까지 만들어 줘.
```

```text
$pupsters-block-production 놀이방 맵의 배치 칸을 수정하되 W01~W06 경로와 기존 캐릭터 비율은 유지해 줘.
```

이 스킬은 외부 게시 권한을 대신하지 않는다. 저장소 공개, 업로드, 배포는 사용자가 해당 작업을 요청한 범위에서 별도로 수행한다.
