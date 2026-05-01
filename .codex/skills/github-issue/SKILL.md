---
name: github-issue
description: 저장소의 이슈 템플릿과 백로그/Epic/Story/Task 입력을 바탕으로 한국어 GitHub 이슈 초안을 작성하고, 요청 시 GitHub 이슈로 등록합니다. 사용자가 Epic, Story, Task, 백로그 항목, 자유 입력을 .github/ISSUE_TEMPLATE/task.md 또는 가장 가까운 이슈 템플릿 기반 GitHub Issue로 변환해 달라고 요청할 때 사용합니다.
---

# GitHub Issue 작성

## 작업 흐름

1. 저장소의 이슈 템플릿을 읽습니다.
2. docs 폴더에 있는 백로그 문서를 읽습니다.
3. GitHub Issue 본문을 한국어 Markdown으로 작성합니다.
   - 템플릿의 구조와 섹션 순서를 유지합니다.
   - 사용자 입력과 기획 문서를 바탕으로 각 항목을 구체적으로 채웁니다.
   - 이슈 본문 밖에 불필요한 설명을 추가하지 않습니다.
4. 이슈 제목을 작성합니다.
   - 형식: `{한 줄 요약} ({대표 API 또는 식별자})`
   - 요약과 API/식별자는 백로그 문서와 현재 브랜치 작업 내용에서 가져옵니다.
   - 대표 API나 식별자가 없으면 괄호 부분은 생략합니다.
5. 사용자가 이슈 생성/등록을 요청하면 GitHub 이슈로 등록합니다.
   - GitHub MCP 이슈 생성 도구가 있으면 우선 사용합니다.
   - 없으면 인증된 GitHub CLI를 사용합니다.

## GitHub CLI 명령어

임시 Markdown 본문 파일을 만든 뒤 다음 명령으로 이슈를 생성합니다.

```bash
gh issue create --title "<이슈 제목>" --body-file "<body-file-path>"
```

## 출력 규칙

- 모든 내용은 한국어로 작성합니다.
