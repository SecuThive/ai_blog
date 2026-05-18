import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://isfzeksbzxtuqymfocqv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const GUIDES = [
  // ── Linux / Shell ─────────────────────────────────────
  {
    title: 'systemd 서비스 관리 완전 가이드',
    slug: 'systemd-service-management',
    summary: 'systemctl로 서비스를 시작·중지·활성화하고, 직접 서비스 유닛 파일을 작성하는 방법을 단계별로 설명합니다.',
    category: 'Linux / Shell',
    tags: ['systemd', 'systemctl', 'journalctl', '서비스', 'linux'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'centos', 'debian'],
    author: 'SecuThive',
    content: `## systemd란?

현대 리눅스 배포판(Ubuntu 16.04+, CentOS 7+, Debian 8+)의 표준 init 시스템. 부팅 시 서비스를 병렬 실행하고 의존성을 관리합니다.

---

## 기본 서비스 조작

\`\`\`bash
# 상태 확인
systemctl status nginx

# 시작 / 중지 / 재시작
systemctl start  nginx
systemctl stop   nginx
systemctl restart nginx
systemctl reload nginx      # 설정만 재로드 (다운타임 없음)

# 부팅 시 자동 시작 설정/해제
systemctl enable  nginx
systemctl disable nginx

# 활성화 + 즉시 시작 (한 번에)
systemctl enable --now nginx
\`\`\`

---

## 서비스 상태 전체 조회

\`\`\`bash
# 실행 중인 서비스 목록
systemctl list-units --type=service --state=running

# 실패한 서비스 확인
systemctl --failed

# 부팅 시간 분석
systemd-analyze blame | head -20
\`\`\`

---

## 직접 서비스 유닛 파일 작성

\`\`\`ini
# /etc/systemd/system/myapp.service

[Unit]
Description=My Node.js Application
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/node /opt/myapp/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
\`\`\`

작성 후 적용:

\`\`\`bash
systemctl daemon-reload          # 유닛 파일 변경 후 반드시 실행
systemctl enable --now myapp
\`\`\`

---

## 로그 확인 (journalctl)

\`\`\`bash
journalctl -u nginx                    # nginx 서비스 전체 로그
journalctl -u nginx -f                 # 실시간 팔로우
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx -n 50             # 최근 50줄
journalctl -u nginx -p err            # 에러만 출력
journalctl --disk-usage               # 로그 디스크 사용량
journalctl --vacuum-time=7d           # 7일 이상 로그 삭제
\`\`\`

---

## 타이머 (Cron 대체)

\`\`\`ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
\`\`\`

\`\`\`bash
systemctl enable --now backup.timer
systemctl list-timers
\`\`\``,
  },
  {
    title: 'Cron 작업 스케줄러 실전 가이드',
    slug: 'cron-scheduler-guide',
    summary: '반복 작업 자동화를 위한 crontab 문법, 환경 변수 설정, 로그 기록 방법을 설명합니다.',
    category: 'Linux / Shell',
    tags: ['cron', 'crontab', '스케줄러', '자동화', 'linux'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'centos', 'debian', 'macos'],
    author: 'SecuThive',
    content: `## Cron이란?

시간 기반 작업 스케줄러. 백업, 로그 정리, 리포트 생성 등 반복 작업 자동화에 사용합니다.

---

## crontab 기본 사용법

\`\`\`bash
crontab -e        # 현재 사용자 편집
crontab -l        # 현재 등록된 작업 목록
crontab -r        # 전체 삭제 (주의)
sudo crontab -u www-data -e
\`\`\`

---

## Cron 문법

\`\`\`
# ┌─────────── 분 (0-59)
# │  ┌────────── 시 (0-23)
# │  │  ┌───────── 일 (1-31)
# │  │  │  ┌────────── 월 (1-12)
# │  │  │  │  ┌───────── 요일 (0-7, 0과 7=일요일)
# │  │  │  │  │
# *  *  *  *  *  실행할_명령어
\`\`\`

### 자주 쓰는 패턴

\`\`\`bash
# 매분 실행
* * * * * /opt/scripts/check.sh

# 매일 오전 2시에 백업
0 2 * * * /opt/scripts/backup.sh

# 매주 월요일 오전 9시
0 9 * * 1 /opt/scripts/weekly_report.sh

# 매월 1일 자정
0 0 1 * * /opt/scripts/monthly_clean.sh

# 매 5분마다
*/5 * * * * /opt/scripts/heartbeat.sh

# 평일(월~금) 오전 8~18시, 매 30분
*/30 8-18 * * 1-5 /opt/scripts/sync.sh
\`\`\`

---

## 환경 변수 설정

\`\`\`bash
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=admin@example.com

0 2 * * * /opt/scripts/backup.sh
\`\`\`

---

## 로그 기록

\`\`\`bash
# stdout과 stderr를 파일로 저장
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1

# 날짜 타임스탬프 추가
0 2 * * * echo "[$(date)] 백업 시작" >> /var/log/backup.log && /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
\`\`\`

---

## /etc/cron.d 방식 (권장)

\`\`\`bash
# /etc/cron.d/myapp
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

# 매일 새벽 3시, deploy 사용자로 실행
0 3 * * * deploy /opt/myapp/scripts/cleanup.sh >> /var/log/myapp-cron.log 2>&1
\`\`\`

---

## 자주 하는 실수

| 실수 | 해결 |
|------|------|
| 명령어 경로 미지정 | 절대 경로 사용 (\`/usr/bin/python3\`) |
| 환경변수 없음 | 스크립트 상단에 \`source /etc/environment\` |
| 실행 권한 없음 | \`chmod +x script.sh\` |
| 결과 확인 어려움 | \`>> /var/log/cron-job.log 2>&1\` 추가 |`,
  },
  {
    title: '셸 스크립트 실전 기초',
    slug: 'shell-script-basics',
    summary: '변수, 조건문, 반복문, 함수, 에러 처리까지 실무에서 바로 쓸 수 있는 bash 스크립트 작성법을 설명합니다.',
    category: 'Linux / Shell',
    tags: ['bash', 'shell', 'script', '자동화', '스크립트'],
    difficulty: 'intermediate',
    os_compat: ['ubuntu', 'centos', 'macos'],
    author: 'SecuThive',
    content: `## 스크립트 기본 구조

\`\`\`bash
#!/bin/bash
set -euo pipefail

main() {
  echo "스크립트 시작"
}

main "$@"
\`\`\`

---

## 변수

\`\`\`bash
NAME="SecuThive"
echo "안녕, $NAME"
echo '값: $NAME'           # 작은따옴표는 문자 그대로

readonly VERSION="1.0.0"
PORT="\${PORT:-8080}"       # 기본값 설정

SERVERS=("web1" "web2" "web3")
echo "\${SERVERS[0]}"       # web1
echo "\${#SERVERS[@]}"      # 원소 개수
\`\`\`

---

## 조건문

\`\`\`bash
FILE="/etc/nginx/nginx.conf"

if [[ -f "$FILE" ]]; then
  echo "파일 존재"
elif [[ -d "$FILE" ]]; then
  echo "디렉터리"
else
  echo "없음"
fi

if [[ "$ENV" == "production" ]]; then
  echo "운영 환경"
fi

if [[ $COUNT -gt 10 ]]; then
  echo "10 초과"
fi
\`\`\`

### 파일 테스트 연산자

| 표현식 | 의미 |
|--------|------|
| \`-f FILE\` | 일반 파일 존재 |
| \`-d DIR\` | 디렉터리 존재 |
| \`-e PATH\` | 경로 존재 |
| \`-r FILE\` | 읽기 권한 있음 |
| \`-z STRING\` | 문자열이 비어있음 |
| \`-n STRING\` | 문자열이 비어있지 않음 |

---

## 반복문

\`\`\`bash
for server in "\${SERVERS[@]}"; do
  echo "배포: $server"
  ssh "$server" "sudo systemctl restart myapp"
done

for i in {1..5}; do
  echo "시도 $i"
done

COUNT=0
while [[ $COUNT -lt 3 ]]; do
  echo "대기 중..."
  sleep 1
  ((COUNT++))
done
\`\`\`

---

## 함수

\`\`\`bash
log() {
  local level="$1"
  local msg="$2"
  echo "[\$(date '+%Y-%m-%d %H:%M:%S')] [$level] $msg"
}

check_service() {
  local service="$1"
  if systemctl is-active --quiet "$service"; then
    log "INFO" "$service 실행 중"
    return 0
  else
    log "ERROR" "$service 중지됨"
    return 1
  fi
}

check_service nginx || exit 1
\`\`\`

---

## 에러 처리

\`\`\`bash
if ! rsync -av /src/ user@host:/dest/; then
  log "ERROR" "rsync 실패"
  exit 1
fi

TMPFILE=\$(mktemp)
trap 'rm -f "$TMPFILE"; echo "정리 완료"' EXIT
trap 'echo "에러 발생: 줄 $LINENO"' ERR
\`\`\``,
  },

  // ── Docker / 컨테이너 ─────────────────────────────────
  {
    title: 'Dockerfile 최적화 — 이미지 크기와 빌드 속도 줄이기',
    slug: 'dockerfile-optimization',
    summary: '레이어 캐시 활용, 멀티스테이지 빌드, 불필요한 파일 제거로 이미지 크기를 절반 이하로 줄이는 기법을 설명합니다.',
    category: 'Docker / 컨테이너',
    tags: ['docker', 'dockerfile', 'multistage', 'alpine', '최적화'],
    difficulty: 'intermediate',
    os_compat: ['ubuntu', 'macos', 'windows'],
    author: 'SecuThive',
    content: `## 개선 전 (1.2GB) vs 개선 후 (180MB)

### 개선 전

\`\`\`dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

### 개선 후 (멀티스테이지)

\`\`\`dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

---

## 핵심 최적화 원칙

### 1. 레이어 캐시 순서

\`\`\`dockerfile
COPY package*.json ./
RUN npm ci

COPY src/ ./src/
\`\`\`

### 2. .dockerignore 필수

\`\`\`
node_modules
.git
.env
*.log
dist
coverage
\`\`\`

### 3. RUN 명령어 합치기

\`\`\`dockerfile
RUN apt-get update && \\
    apt-get install -y --no-install-recommends curl && \\
    rm -rf /var/lib/apt/lists/*
\`\`\`

### 4. alpine 기반 이미지

| 이미지 | 크기 |
|--------|------|
| \`node:20\` | 1.1GB |
| \`node:20-slim\` | 240MB |
| \`node:20-alpine\` | 140MB |

---

## BuildKit 캐시 마운트

\`\`\`dockerfile
RUN --mount=type=cache,target=/root/.npm \\
    npm ci
\`\`\`

\`\`\`bash
DOCKER_BUILDKIT=1 docker build .
\`\`\`

---

## 이미지 크기 분석

\`\`\`bash
docker history myapp:latest

docker run --rm -it \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  wagoodman/dive myapp:latest
\`\`\``,
  },
  {
    title: 'Docker 네트워크 이해와 실전 설정',
    slug: 'docker-networking',
    summary: 'bridge, host, overlay 네트워크의 차이와 컨테이너 간 통신, 외부 노출 설정 방법을 설명합니다.',
    category: 'Docker / 컨테이너',
    tags: ['docker', 'network', 'bridge', 'compose', '컨테이너'],
    difficulty: 'intermediate',
    os_compat: ['ubuntu', 'macos', 'windows'],
    author: 'SecuThive',
    content: `## Docker 네트워크 드라이버

| 드라이버 | 설명 | 사용 상황 |
|----------|------|-----------|
| \`bridge\` | 기본값, 호스트와 격리된 가상 네트워크 | 단일 호스트 내 컨테이너 통신 |
| \`host\` | 호스트 네트워크 직접 사용 | 성능 최우선 |
| \`none\` | 네트워크 완전 비활성화 | 완전 격리 필요 시 |
| \`overlay\` | 멀티 호스트 네트워크 | Docker Swarm |

---

## 기본 네트워크 명령어

\`\`\`bash
docker network ls
docker network inspect bridge
docker network create mynet
docker network create \\
  --driver bridge \\
  --subnet 172.20.0.0/16 \\
  --gateway 172.20.0.1 \\
  mynet

docker network connect mynet container1
docker network disconnect mynet container1
\`\`\`

---

## 사용자 정의 bridge 네트워크 (권장)

\`\`\`bash
docker network create app-net

docker run -d --name db      --network app-net postgres:16
docker run -d --name backend --network app-net \\
  -e DB_HOST=db \\
  myapp:latest
\`\`\`

---

## Compose 네트워크 설정

\`\`\`yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - frontend

  app:
    build: .
    networks:
      - frontend
      - backend

  db:
    image: postgres:16
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true
\`\`\`

---

## 포트 매핑

\`\`\`bash
docker run -p 8080:80 nginx
docker run -p 127.0.0.1:8080:80 nginx   # localhost만 노출
docker port container1
\`\`\`

---

## 디버깅

\`\`\`bash
docker exec -it myapp sh
# nslookup db
# curl http://db:5432

docker inspect --format '{{.NetworkSettings.IPAddress}}' mycontainer
\`\`\``,
  },

  // ── Git / CI·CD ───────────────────────────────────────
  {
    title: 'Git 브랜치 전략 — GitHub Flow & Git Flow',
    slug: 'git-branch-strategy',
    summary: '소규모 팀에 적합한 GitHub Flow와 릴리즈 주기가 명확한 팀을 위한 Git Flow를 비교하고 선택 기준을 설명합니다.',
    category: 'Git / CI·CD',
    tags: ['git', 'github', 'branch', 'gitflow', '브랜치전략'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'macos', 'windows'],
    author: 'SecuThive',
    content: `## 두 전략 비교

| 기준 | GitHub Flow | Git Flow |
|------|-------------|----------|
| 복잡도 | 낮음 | 높음 |
| 배포 주기 | 수시 (CD) | 정해진 릴리즈 |
| 적합한 팀 | 스타트업, 소규모 | 앱 스토어, 엔터프라이즈 |

---

## GitHub Flow

\`\`\`bash
git switch -c feat/user-auth
git add .
git commit -m "feat: JWT 기반 사용자 인증 구현"
git push -u origin feat/user-auth
# → PR 생성 → 리뷰 → main 병합 → 배포
git branch -d feat/user-auth
\`\`\`

---

## Git Flow 주요 브랜치

| 브랜치 | 역할 |
|--------|------|
| \`main\` | 배포된 코드, 태그로 버전 관리 |
| \`develop\` | 다음 릴리즈 통합 |
| \`feat/*\` | 기능 개발 |
| \`release/*\` | QA·버그픽스 |
| \`hotfix/*\` | 긴급 수정 |

\`\`\`bash
git flow init
git flow feature start login
git flow feature finish login
git flow release start 1.2.0
git flow release finish 1.2.0
\`\`\`

---

## Conventional Commits

\`\`\`
feat(auth): JWT 토큰 갱신 로직 추가
fix(api): 응답 헤더 누락 수정
docs: README 설치 가이드 업데이트
refactor(db): 쿼리 최적화
chore: 의존성 업그레이드
\`\`\`

---

## 브랜치 보호 규칙 (GitHub)

\`Settings → Branches → Add rule\`:
- Require pull request reviews (최소 1명)
- Require status checks (CI 통과 필수)
- Restrict pushes (직접 push 금지)`,
  },
  {
    title: 'Git 실수 복구 완전 가이드 — reset, revert, stash',
    slug: 'git-undo-guide',
    summary: '잘못된 커밋, 잘못된 브랜치 작업, 실수로 삭제한 파일까지 — 상황별 Git 되돌리기 방법을 정리했습니다.',
    category: 'Git / CI·CD',
    tags: ['git', 'reset', 'revert', 'stash', 'reflog', '복구'],
    difficulty: 'intermediate',
    os_compat: ['ubuntu', 'macos', 'windows'],
    author: 'SecuThive',
    content: `## 상황별 복구 방법

| 상황 | 명령어 |
|------|--------|
| 스테이징 취소 | \`git restore --staged <file>\` |
| 작업 디렉터리 되돌리기 | \`git restore <file>\` |
| 마지막 커밋 수정 | \`git commit --amend\` |
| 커밋 되돌리기 (히스토리 유지) | \`git revert HEAD\` |
| 커밋 취소 (히스토리 삭제) | \`git reset HEAD~1\` |
| 작업 임시 저장 | \`git stash\` |
| 삭제된 커밋 복구 | \`git reflog\` |

---

## 스테이징/작업 디렉터리 되돌리기

\`\`\`bash
git restore --staged index.html
git restore index.html
git restore --staged .
git restore .
\`\`\`

---

## 커밋 수정 (push 전에만)

\`\`\`bash
git commit --amend -m "fix: 올바른 메시지"

git add forgotten.txt
git commit --amend --no-edit
\`\`\`

---

## reset

\`\`\`bash
git reset --soft HEAD~1     # 커밋만 취소, 변경사항은 스테이징으로
git reset HEAD~1            # 커밋 취소 + 스테이징 해제, 파일은 유지
git reset --hard HEAD~1     # 커밋 + 변경사항 모두 삭제 (위험)
git reset --hard abc1234
\`\`\`

---

## revert (공유 브랜치)

\`\`\`bash
git revert abc1234

git revert --no-commit HEAD~3..HEAD
git commit -m "revert: 마지막 3개 커밋 되돌리기"
\`\`\`

---

## stash

\`\`\`bash
git stash
git stash push -m "로그인 기능 WIP"
git stash list
git stash pop
git stash apply stash@{1}
git stash drop stash@{0}
git stash branch feat/new stash@{0}
\`\`\`

---

## reflog (삭제된 커밋 복구)

\`\`\`bash
git reflog
git reset --hard HEAD@{3}

git reflog | grep "feat/login"
git checkout -b feat/login abc1234
\`\`\``,
  },
  {
    title: 'GitHub Actions로 CI/CD 파이프라인 구축하기',
    slug: 'github-actions-cicd',
    summary: 'Push 이벤트에 테스트·빌드·배포를 자동화하는 GitHub Actions 워크플로우를 단계별로 작성합니다.',
    category: 'Git / CI·CD',
    tags: ['github-actions', 'cicd', 'automation', 'pipeline', 'deploy'],
    difficulty: 'intermediate',
    os_compat: ['ubuntu'],
    author: 'SecuThive',
    content: `## 워크플로우 기본 구조

\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 의존성 설치
        run: npm ci

      - name: 린트
        run: npm run lint

      - name: 테스트
        run: npm test
\`\`\`

---

## 환경 변수와 시크릿

\`\`\`yaml
steps:
  - name: 배포
    env:
      API_KEY: \${{ secrets.API_KEY }}
      DB_URL: \${{ vars.DATABASE_URL }}
    run: ./deploy.sh
\`\`\`

---

## 조건부 실행

\`\`\`yaml
steps:
  - name: 프로덕션 배포
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    run: ./deploy-prod.sh

  - name: 슬랙 알림
    if: always()
    run: ./notify-slack.sh
\`\`\`

---

## 매트릭스 전략

\`\`\`yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]

    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
\`\`\`

---

## Docker 빌드 + 푸시

\`\`\`yaml
- name: Docker Hub 로그인
  uses: docker/login-action@v3
  with:
    username: \${{ secrets.DOCKER_USERNAME }}
    password: \${{ secrets.DOCKER_TOKEN }}

- name: 이미지 빌드 + 푸시
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myapp:\${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
\`\`\`

---

## SSH로 서버 배포

\`\`\`yaml
- name: 서버 배포
  uses: appleboy/ssh-action@v1
  with:
    host: \${{ secrets.SSH_HOST }}
    username: deploy
    key: \${{ secrets.SSH_KEY }}
    script: |
      cd /opt/myapp
      git pull origin main
      docker compose up -d --build
\`\`\``,
  },

  // ── 네트워킹 / 서버 ───────────────────────────────────
  {
    title: 'Nginx 웹서버 기본 설정과 리버스 프록시',
    slug: 'nginx-basic-configuration',
    summary: 'Nginx 설치부터 정적 파일 서빙, 리버스 프록시, 로드 밸런싱 설정까지 실무에서 바로 쓸 수 있도록 설명합니다.',
    category: '네트워킹 / 서버',
    tags: ['nginx', '웹서버', 'proxy', 'loadbalancer', 'reverse-proxy'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'debian', 'centos'],
    author: 'SecuThive',
    content: `## 설치

\`\`\`bash
sudo apt update && sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo nginx -t          # 설정 문법 검사
sudo nginx -s reload
\`\`\`

---

## 설정 파일 구조

\`\`\`
/etc/nginx/
├── nginx.conf
├── sites-available/
│   └── myapp.conf
└── sites-enabled/
    └── myapp.conf -> ../sites-available/myapp.conf
\`\`\`

---

## 정적 파일 서빙

\`\`\`nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \\.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
\`\`\`

---

## 리버스 프록시

\`\`\`nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 30s;
        proxy_read_timeout    60s;
    }
}
\`\`\`

---

## 로드 밸런싱

\`\`\`nginx
upstream backend {
    least_conn;
    server 10.0.0.1:3000 weight=3;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000 backup;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
\`\`\`

---

## 보안 헤더

\`\`\`nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header X-Content-Type-Options "nosniff";
add_header Strict-Transport-Security "max-age=31536000" always;
server_tokens off;
\`\`\`

---

## 설정 활성화

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/myapp.conf \\
           /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
\`\`\``,
  },
  {
    title: "Let's Encrypt로 HTTPS 무료 SSL 인증서 발급",
    slug: 'letsencrypt-ssl-setup',
    summary: 'Certbot을 사용해 도메인에 무료 SSL 인증서를 발급하고 Nginx에 적용, 자동 갱신을 설정하는 방법입니다.',
    category: '네트워킹 / 서버',
    tags: ['ssl', 'https', 'letsencrypt', 'certbot', 'nginx', 'tls'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'centos', 'debian'],
    author: 'SecuThive',
    content: `## 사전 조건

- 도메인 A 레코드가 서버 IP를 가리키고 있어야 함
- 포트 80, 443 열려 있어야 함

---

## Certbot 설치

\`\`\`bash
sudo apt install -y certbot python3-certbot-nginx
\`\`\`

---

## 인증서 발급

\`\`\`bash
sudo certbot --nginx -d example.com -d www.example.com
\`\`\`

certbot이 자동으로 Nginx 설정에 SSL 블록과 HTTP → HTTPS 리다이렉트를 추가합니다.

---

## 수동 Nginx 설정

\`\`\`bash
sudo certbot certonly --nginx -d example.com
\`\`\`

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

server {
    listen 80;
    server_name example.com;
    return 301 https://\$host\$request_uri;
}
\`\`\`

---

## 자동 갱신 (90일 유효기간)

\`\`\`bash
systemctl status certbot.timer
sudo certbot renew --dry-run
\`\`\`

---

## 와일드카드 인증서

\`\`\`bash
sudo certbot certonly \\
  --manual \\
  --preferred-challenges dns \\
  -d "*.example.com" \\
  -d example.com
\`\`\``,
  },
  {
    title: 'UFW 방화벽 설정 완전 가이드',
    slug: 'ufw-firewall-guide',
    summary: 'Ubuntu UFW로 포트를 열고 닫고, 특정 IP만 허용하고, 로깅과 상태 확인까지 실무 방화벽 설정을 설명합니다.',
    category: '네트워킹 / 서버',
    tags: ['ufw', 'firewall', 'iptables', '방화벽', '보안', 'ubuntu'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'debian'],
    author: 'SecuThive',
    content: `## 기본 사용법

\`\`\`bash
sudo apt install ufw
sudo ufw status verbose

sudo ufw default deny incoming
sudo ufw default allow outgoing
\`\`\`

---

## 포트 허용/차단

\`\`\`bash
sudo ufw allow 22/tcp
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 'Nginx Full'

sudo ufw deny 8080/tcp
sudo ufw allow 3000:4000/tcp

# 특정 IP만 허용
sudo ufw allow from 192.168.1.100 to any port 5432
sudo ufw allow from 10.0.0.0/24
\`\`\`

---

## 규칙 관리

\`\`\`bash
sudo ufw status numbered
sudo ufw delete 3
sudo ufw delete allow 80/tcp
sudo ufw reset
\`\`\`

---

## 로깅

\`\`\`bash
sudo ufw logging on
sudo ufw logging high
sudo tail -f /var/log/ufw.log
sudo grep "BLOCK" /var/log/ufw.log | tail -20
\`\`\`

---

## 권장 초기 설정 (SSH 서버)

\`\`\`bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw logging on
sudo ufw enable
sudo ufw status verbose
\`\`\``,
  },

  // ── OS / 시스템 ───────────────────────────────────────
  {
    title: '리눅스 사용자·그룹 관리',
    slug: 'linux-user-group-management',
    summary: '사용자 생성과 삭제, 그룹 관리, sudo 권한 설정, 패스워드 정책까지 서버 사용자 관리 전반을 설명합니다.',
    category: 'OS / 시스템',
    tags: ['linux', 'user', 'group', 'sudo', 'permission', '사용자관리'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'centos', 'debian'],
    author: 'SecuThive',
    content: `## 사용자 관리

\`\`\`bash
sudo useradd -m -s /bin/bash deploy
sudo useradd -m -s /bin/bash -G docker,sudo deploy

sudo passwd deploy

sudo usermod -s /bin/zsh deploy
sudo usermod -aG docker deploy
sudo usermod -L deploy     # 계정 잠금
sudo usermod -U deploy     # 잠금 해제

sudo userdel deploy
sudo userdel -r deploy     # 홈 + 메일 함께 삭제
\`\`\`

---

## 그룹 관리

\`\`\`bash
sudo groupadd devteam
sudo groupdel devteam

sudo gpasswd -a deploy devteam
sudo gpasswd -d deploy devteam

id
groups deploy
getent group docker
\`\`\`

---

## 계정 만료 설정

\`\`\`bash
sudo chage -l deploy
sudo chage -M 90 deploy           # 90일마다 패스워드 변경 강제
sudo chage -E 2026-12-31 deploy   # 계정 만료일
\`\`\`

---

## sudo 권한 설정

\`\`\`bash
sudo usermod -aG sudo deploy

# visudo 편집
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/docker *
%devteam ALL=(ALL) NOPASSWD: /usr/bin/docker
\`\`\`

---

## 서비스 전용 계정 (보안 권장)

\`\`\`bash
sudo useradd \\
  --system \\
  --no-create-home \\
  --shell /sbin/nologin \\
  --comment "App Service Account" \\
  myapp
\`\`\`

---

## 로그인 현황

\`\`\`bash
who
w
last
lastb    # 실패한 로그인 시도
\`\`\``,
  },
  {
    title: '리눅스 시스템 리소스 모니터링',
    slug: 'linux-system-monitoring',
    summary: 'CPU, 메모리, 디스크, 네트워크를 실시간으로 모니터링하고 병목을 찾는 실무 명령어와 도구를 정리했습니다.',
    category: 'OS / 시스템',
    tags: ['linux', 'monitoring', 'cpu', 'memory', 'disk', 'iostat'],
    difficulty: 'intermediate',
    os_compat: ['ubuntu', 'centos', 'debian'],
    author: 'SecuThive',
    content: `## CPU 모니터링

\`\`\`bash
top -d 1
htop

uptime   # load average 확인 (코어 수보다 크면 과부하)
nproc
lscpu | grep "CPU(s):"

ps aux --sort=-%cpu | head -10
\`\`\`

---

## 메모리 모니터링

\`\`\`bash
free -h
watch -n 1 free -h

ps aux --sort=-%mem | head -10
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|Cached"
swapon --show
\`\`\`

---

## 디스크 모니터링

\`\`\`bash
df -h
df -h /var

du -sh /var/* | sort -rh | head -10
du -sh /*     | sort -rh | head -10

df -i   # inode 사용량

iostat -xz 1
iotop -ao
\`\`\`

---

## 네트워크 모니터링

\`\`\`bash
ss -tunlp
ss -s

iftop -i eth0
nload eth0

# 연결 수 확인 (DDoS 탐지)
ss -tn | awk 'NR>1 {print \$5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head
\`\`\`

---

## vmstat / sar

\`\`\`bash
vmstat 1 10

sudo apt install sysstat
sar -u 1 5   # CPU
sar -r 1 5   # 메모리
sar -d 1 5   # 디스크
\`\`\`

---

## CPU 경보 스크립트

\`\`\`bash
#!/bin/bash
THRESHOLD=90
CPU=\$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | cut -d'%' -f1 | cut -d',' -f1)
CPU=\${CPU%.*}

if [[ \$CPU -gt \$THRESHOLD ]]; then
  echo "[ALERT] CPU \${CPU}%" | mail -s "CPU 경고" admin@example.com
fi
\`\`\``,
  },

  // ── 보안 설정 ─────────────────────────────────────────
  {
    title: 'GPG 키 생성과 파일 암호화 실전',
    slug: 'gpg-encryption-guide',
    summary: 'GPG 키 쌍을 생성하고, 파일을 암호화·복호화하며, 대칭키 암호화와 서명까지 실무에 적용하는 방법입니다.',
    category: '보안 설정',
    tags: ['gpg', 'encryption', 'pgp', '암호화', '서명', '보안'],
    difficulty: 'intermediate',
    os_compat: ['ubuntu', 'centos', 'macos'],
    author: 'SecuThive',
    content: `## GPG란?

GNU Privacy Guard. 공개키 암호화 방식으로 파일 암호화, 디지털 서명, 이메일 암호화에 사용합니다.

---

## 키 생성

\`\`\`bash
gpg --full-generate-key
# RSA 4096 또는 Ed25519 선택, 유효기간 2y 권장

gpg --list-keys
gpg --list-secret-keys --keyid-format LONG
\`\`\`

---

## 파일 암호화 (공개키 방식)

\`\`\`bash
gpg --encrypt --recipient "admin@example.com" secret.txt
# → secret.txt.gpg 생성

gpg --decrypt secret.txt.gpg > secret.txt

gpg --armor --encrypt --recipient "admin@example.com" secret.txt
# → secret.txt.asc (텍스트 형식)
\`\`\`

---

## 대칭키 암호화 (패스워드 방식)

\`\`\`bash
gpg --symmetric --cipher-algo AES256 backup.tar.gz
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz
\`\`\`

---

## 디지털 서명

\`\`\`bash
gpg --detach-sign release.tar.gz
# → release.tar.gz.sig 생성

gpg --verify release.tar.gz.sig release.tar.gz

gpg --sign --encrypt --recipient "admin@example.com" file.txt
\`\`\`

---

## 키 내보내기 / 가져오기

\`\`\`bash
gpg --armor --export "admin@example.com" > public.key
gpg --armor --export-secret-keys "admin@example.com" > private.key

gpg --import public.key
gpg --import private.key
\`\`\``,
  },

  // ── 클라우드 ───────────────────────────────────────────
  {
    title: 'AWS EC2 인스턴스 시작하기',
    slug: 'aws-ec2-getting-started',
    summary: 'EC2 인스턴스를 생성하고, 보안 그룹을 설정하고, SSH 접속 및 기본 서버 설정까지 단계별로 안내합니다.',
    category: '클라우드',
    tags: ['aws', 'ec2', 'cloud', 'ssh', '서버', 'ubuntu'],
    difficulty: 'beginner',
    os_compat: ['ubuntu'],
    author: 'SecuThive',
    content: `## EC2 인스턴스 생성 권장 설정

| 항목 | 권장값 |
|------|--------|
| AMI | Ubuntu 22.04 LTS |
| 인스턴스 타입 | t3.micro (테스트) / t3.small (소규모) |
| 스토리지 | gp3 20GB+ |
| 키 페어 | 새로 생성 후 .pem 파일 안전 보관 |

---

## 보안 그룹 인바운드 규칙

| 포트 | 소스 | 용도 |
|------|------|------|
| 22 | 내 IP | SSH |
| 80 | 0.0.0.0/0 | HTTP |
| 443 | 0.0.0.0/0 | HTTPS |

> SSH 포트는 내 IP만 허용 — 0.0.0.0/0 설정은 보안 위험.

---

## SSH 접속

\`\`\`bash
chmod 400 my-key.pem
ssh -i my-key.pem ubuntu@<EC2-PUBLIC-IP>

# ~/.ssh/config 등록
Host myserver
    HostName 123.45.67.89
    User ubuntu
    IdentityFile ~/.ssh/my-key.pem
    ServerAliveInterval 60

ssh myserver
\`\`\`

---

## 접속 후 초기 설정

\`\`\`bash
sudo apt update && sudo apt upgrade -y

sudo apt install -y curl wget git vim htop build-essential ufw fail2ban

sudo timedatectl set-timezone Asia/Seoul

# 스왑 파일 (t3.micro 메모리 부족 대비)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
\`\`\`

---

## AWS CLI 설정

\`\`\`bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

aws configure
# Region: ap-northeast-2 (서울)

aws ec2 describe-instances \\
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' \\
  --output table
\`\`\`

---

## 인스턴스 유형 선택 기준

| 패밀리 | 용도 | 예시 |
|--------|------|------|
| t3/t4g | 범용, 버스트 가능 | 소규모 웹서버 |
| m6i/m7i | 범용, 일정 성능 | API 서버 |
| c6i/c7i | 컴퓨팅 집약 | 렌더링, 배치 |
| r6i/r7i | 메모리 집약 | DB, 캐시 |`,
  },
  {
    title: 'AWS S3 버킷 생성과 CLI 활용',
    slug: 'aws-s3-cli-guide',
    summary: 'S3 버킷을 생성하고, 버킷 정책과 ACL을 설정하며, AWS CLI로 파일을 업로드·다운로드·동기화하는 방법입니다.',
    category: '클라우드',
    tags: ['aws', 's3', 'cli', '스토리지', '백업', 'cloud'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'macos'],
    author: 'SecuThive',
    content: `## S3 버킷 생성

\`\`\`bash
aws s3 mb s3://my-bucket-name --region ap-northeast-2
aws s3 ls
aws s3 ls s3://my-bucket-name/
aws s3 ls s3://my-bucket-name/logs/ --recursive
\`\`\`

---

## 파일 업로드 / 다운로드

\`\`\`bash
aws s3 cp file.txt s3://my-bucket/file.txt
aws s3 cp ./dist/ s3://my-bucket/dist/ --recursive

aws s3 cp s3://my-bucket/file.txt ./file.txt

aws s3 sync ./dist/ s3://my-bucket/ --delete
aws s3 sync s3://my-bucket/backups/ ./backups/
\`\`\`

---

## 유용한 옵션

\`\`\`bash
aws s3 sync . s3://my-bucket/ --exclude "*.log" --exclude ".git/*"

aws s3 cp backup.tar.gz s3://my-bucket/backups/ \\
  --storage-class STANDARD_IA

# 미리 서명된 URL (1시간)
aws s3 presign s3://my-bucket/private.pdf --expires-in 3600
\`\`\`

---

## 버킷 정책 (공개 읽기)

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}
\`\`\`

\`\`\`bash
aws s3api put-bucket-policy \\
  --bucket my-bucket \\
  --policy file://bucket-policy.json
\`\`\`

---

## 정적 웹사이트 호스팅

\`\`\`bash
aws s3 website s3://my-bucket/ \\
  --index-document index.html \\
  --error-document error.html
\`\`\`

---

## 백업 자동화 (cron + s3)

\`\`\`bash
#!/bin/bash
DATE=\$(date +%Y%m%d-%H%M)
BACKUP_FILE="/tmp/db-backup-\${DATE}.tar.gz"

pg_dump mydb | gzip > "\$BACKUP_FILE"
aws s3 cp "\$BACKUP_FILE" "s3://my-backups/db/\${DATE}.tar.gz" \\
  --storage-class STANDARD_IA
rm -f "\$BACKUP_FILE"
\`\`\`

\`\`\`bash
# crontab
0 3 * * * /opt/scripts/backup-to-s3.sh >> /var/log/s3-backup.log 2>&1
\`\`\``,
  },

  // ── 데이터베이스 ──────────────────────────────────────
  {
    title: 'PostgreSQL 설치와 기본 설정',
    slug: 'postgresql-setup-guide',
    summary: 'Ubuntu에 PostgreSQL을 설치하고, 사용자와 데이터베이스를 생성하며, 원격 접속과 백업까지 설정하는 방법입니다.',
    category: '데이터베이스',
    tags: ['postgresql', 'postgres', 'database', 'sql', 'db', '백업'],
    difficulty: 'beginner',
    os_compat: ['ubuntu', 'debian', 'centos'],
    author: 'SecuThive',
    content: `## 설치

\`\`\`bash
sudo apt install -y postgresql postgresql-contrib

# 최신 버전 (PostgreSQL 공식 APT)
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt \$(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update && sudo apt install -y postgresql-16

sudo systemctl enable --now postgresql
\`\`\`

---

## 기본 접속

\`\`\`bash
sudo -u postgres psql

# psql 내 명령어
\\l          -- 데이터베이스 목록
\\c mydb     -- 데이터베이스 전환
\\dt         -- 테이블 목록
\\d users    -- 테이블 구조
\\du         -- 사용자 목록
\\q          -- 종료
\`\`\`

---

## 사용자 및 데이터베이스 생성

\`\`\`sql
CREATE USER myapp WITH PASSWORD 'strongpassword123!';
CREATE DATABASE myappdb OWNER myapp;
GRANT ALL PRIVILEGES ON DATABASE myappdb TO myapp;
GRANT ALL ON SCHEMA public TO myapp;
GRANT ALL ON ALL TABLES IN SCHEMA public TO myapp;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO myapp;
\`\`\`

---

## postgresql.conf 주요 설정

\`\`\`ini
listen_addresses = '*'          # 원격 접속 허용
max_connections = 100
shared_buffers = 256MB          # RAM의 25% 권장
work_mem = 4MB
log_slow_query = 1000           # 1초 이상 쿼리 로그
\`\`\`

---

## pg_hba.conf (접속 제어)

\`\`\`
local   all   postgres    peer
local   all   all         md5
host    myappdb   myapp   10.0.0.0/24   scram-sha-256
\`\`\`

\`\`\`bash
sudo systemctl reload postgresql
\`\`\`

---

## 백업과 복원

\`\`\`bash
pg_dump -U myapp -h localhost myappdb > backup.sql
pg_dump -U myapp -h localhost -Fc myappdb > backup.dump

sudo -u postgres pg_dumpall > all_databases.sql

psql -U myapp -h localhost myappdb < backup.sql
pg_restore -U myapp -h localhost -d myappdb backup.dump
\`\`\`

---

## 모니터링 쿼리

\`\`\`sql
-- 현재 연결 수
SELECT count(*) FROM pg_stat_activity;

-- 실행 중인 쿼리
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity WHERE state = 'active';

-- 테이블 크기
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
\`\`\``,
  },
];

async function main() {
  console.log(`총 ${GUIDES.length}개 가이드 삽입 시작...`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const guide of GUIDES) {
    const { error } = await supabase
      .from('engineer_guides')
      .upsert(guide, { onConflict: 'slug', ignoreDuplicates: false });

    if (error) {
      if (error.code === '23505') {
        console.log(`  SKIP  ${guide.slug}`);
        skipped++;
      } else {
        console.error(`  FAIL  ${guide.slug} — ${error.message}`);
        failed++;
      }
    } else {
      console.log(`  OK    ${guide.slug}`);
      success++;
    }
  }

  console.log(`\n완료: ${success}개 삽입, ${skipped}개 스킵, ${failed}개 실패`);
}

main().catch(console.error);
