---
title: "Git Hooks 실전 — pre-commit으로 코드 품질 자동화"
tags: ["git", "git-hooks", "pre-commit", "코드품질"]
---

> 이 글은 **[Nodelog](https://www.thivelab.com/engineer/git-hooks-pre-commit-guide)** 에 게재된 엔지니어 가이드입니다.

## Git Hooks 위치

```bash
ls .git/hooks/
# pre-commit.sample, commit-msg.sample, pre-push.sample ...
```

훅 파일은 확장자 없이 저장하고 실행 권한을 부여해야 합니다.

---

## pre-commit 훅 직접 작성

```bash
# .git/hooks/pre-commit
#!/usr/bin/env bash
set -e

echo "Running pre-commit checks..."

# ESLint 검사
if ! npx eslint --max-warnings 0 $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts)$'); then
  echo "ESLint failed. Fix errors before committing."
  exit 1
fi

# Prettier 포매팅 확인
if ! npx prettier --check $(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|json|css)$'); then
  echo "Prettier check failed. Run: npx prettier --write ."
  exit 1
fi

echo "Pre-commit checks passed."
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## commit-msg 훅 — 커밋 메시지 형식 강제

```bash
# .git/hooks/commit-msg
#!/usr/bin/env bash
COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Conventional Commits 형식 검사
PATTERN='^(feat|fix|docs|style|refactor|test|chore|perf|ci)(\(.+\))?: .{1,72}'
if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "❌ 커밋 메시지 형식 오류"
  echo "   올바른 형식: feat: 기능 추가"
  echo "   타입: feat|fix|docs|style|refactor|test|chore|perf|ci"
  exit 1
fi
```

---

## pre-push 훅 — 테스트 통과 후 푸시

```bash
# .git/hooks/pre-push
#!/usr/bin/env bash
set -e

echo "Running tests before push..."
npm test -- --passWithNoTests

echo "All tests passed. Pushing..."
```

---

## pre-commit 프레임워크 (권장)

팀 단위로 훅을 공유하려면 [pre-commit](https://pre-commit.com) 프레임워크를 사용합니다.

```bash
pip install pre-commit
```

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-merge-conflict

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \.(js|ts)$
        additional_dependencies:
          - eslint@8.56.0

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
```

```bash
# 훅 설치 (팀원 모두 실행)
pre-commit install
pre-commit install --hook-type commit-msg

# 수동 실행
pre-commit run --all-files

# 특정 파일만
pre-commit run --files src/index.ts
```

---

## 훅 우회 (긴급 시)

```bash
git commit --no-verify -m "hotfix: 긴급 패치"
git push --no-verify
```

> 일상적으로 사용하지 말 것. 우회 이력이 남도록 팀 내 규칙을 정하세요.

---

> 📌 더 많은 실전 가이드는 **[thivelab.com/engineer](https://www.thivelab.com/engineer)** 에서 확인하세요.