# ZAE AI 작업환경 마이그레이션 · 2026-11-24

Windows용 공개 이식판입니다. 개인 스킬 15개와 작업 규칙, 설정 참고값·플러그인 목록을 제공합니다. 원본 PC의 스킬 목록 119개 전체가 설치되는 것은 아닙니다.

## 처음 사용하는 순서

1. GitHub Pages의 ZAE 인덱스 Information에서 오늘 날짜의 ZIP과 SHA256SUMS.txt를 내려받습니다. `Get-FileHash .\ZAE-Migration-2026-11-24.zip -Algorithm SHA256` 값을 게시된 값과 비교합니다. 해시는 전송 손상 확인용이며 전자서명이 아닙니다. 신뢰한 공식 게시 주소에서 받으세요.
2. 압축을 풀고 그 안의 ZAE-Migration-2026-11-24 폴더를 Codex에서 작업 폴더로 엽니다. RESTORE-PROMPT.md의 문장을 붙여넣어도 됩니다.
3. Windows PowerShell에서 먼저 미리보기를 실행합니다. 관리자 권한은 필요 없습니다.

```powershell
powershell.exe -NoProfile -File .\Install-Migration.ps1
```

4. 결과를 확인한 뒤 실제 적용합니다.

```powershell
powershell.exe -NoProfile -File .\Install-Migration.ps1 -Apply
```

조직 정책이나 Windows 다운로드 차단이 있으면 관리자/현재 Codex의 허용된 방식으로 확인하세요. 실행 정책·보안 설정을 우회하지 않습니다. 스크립트를 쓸 수 없다면 Codex가 manifest의 해시를 확인한 뒤 같은 충돌 보존·백업 규칙으로 수동 복원할 수 있습니다.

## 적용되는 내용

- 새 스킬은 CODEX_HOME/skills, CODEX_HOME이 없으면 사용자 홈의 .codex/skills에 설치됩니다.
- 기존 .agents/skills 공용 복사본과 .codex/skills 항목은 동일하면 유지하고 내용이 다르면 해당 스킬 전체를 건너뜁니다.
- 정리된 메모리 규칙은 AGENTS.md의 ZAE_MIGRATION 관리 블록에 반영합니다. 나머지 지침은 유지합니다.
- 설정·역할 예시·문서는 .codex/migrations/2026-11-24 아래 참고 자료로 복사됩니다. 기존 config.toml은 백업만 합니다.
- 수정 전 백업 경로는 결과 JSON의 backupPath에 나옵니다. 충돌 목록도 함께 확인하세요.

## 마지막 확인

Codex를 다시 열거나 새 채팅에서 스킬을 확인합니다. docs/DEPENDENCIES.md와 settings/plugins.json을 따라 도구·플러그인의 설치/로그인 상태를 확인합니다. 개인 메모리 DB, 회사 원문, API 키는 포함하지 않습니다. 원본 자동화·NAS 연결·앱 창 연동은 별도 준비 대상입니다.
