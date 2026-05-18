-- ============================================================
-- engineer_guides 추가 시드 데이터 (17개 가이드)
-- Supabase SQL Editor에서 전체 실행
-- ============================================================

-- ① Linux / Shell ─────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'systemd 서비스 관리 완전 가이드',
  'systemd-service-management',
  'systemctl로 서비스를 시작·중지·활성화하고, 직접 서비스 유닛 파일을 작성하는 방법을 단계별로 설명합니다.',
  $g1$
## systemd란?

현대 리눅스 배포판(Ubuntu 16.04+, CentOS 7+, Debian 8+)의 표준 init 시스템. 부팅 시 서비스를 병렬 실행하고 의존성을 관리합니다.

---

## 기본 서비스 조작

```bash
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
```

---

## 서비스 상태 전체 조회

```bash
# 실행 중인 서비스 목록
systemctl list-units --type=service --state=running

# 실패한 서비스 확인
systemctl --failed

# 부팅 시간 분석
systemd-analyze blame | head -20
```

---

## 직접 서비스 유닛 파일 작성

애플리케이션을 systemd 서비스로 등록하는 방법입니다.

```ini
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
```

작성 후 적용:

```bash
systemctl daemon-reload          # 유닛 파일 변경 후 반드시 실행
systemctl enable --now myapp
```

---

## 로그 확인 (journalctl)

```bash
journalctl -u nginx                    # nginx 서비스 전체 로그
journalctl -u nginx -f                 # 실시간 팔로우
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx -n 50             # 최근 50줄
journalctl -u nginx -p err            # 에러만 출력
journalctl --disk-usage               # 로그 디스크 사용량
journalctl --vacuum-time=7d           # 7일 이상 로그 삭제
```

---

## 타이머 (Cron 대체)

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Daily Backup Timer

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
systemctl enable --now backup.timer
systemctl list-timers
```
  $g1$,
  'Linux / Shell',
  ARRAY['systemd', 'systemctl', 'journalctl', '서비스', 'linux'],
  'beginner',
  ARRAY['ubuntu', 'centos', 'debian'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Cron 작업 스케줄러 실전 가이드',
  'cron-scheduler-guide',
  '반복 작업 자동화를 위한 crontab 문법, 환경 변수 설정, 로그 기록 방법을 설명합니다.',
  $g2$
## Cron이란?

시간 기반 작업 스케줄러. 백업, 로그 정리, 리포트 생성 등 반복 작업 자동화에 사용합니다.

---

## crontab 기본 사용법

```bash
crontab -e        # 현재 사용자 편집
crontab -l        # 현재 등록된 작업 목록
crontab -r        # 전체 삭제 (주의)

# 다른 사용자의 crontab
sudo crontab -u www-data -e
```

---

## Cron 문법

```
# ┌─────────── 분 (0-59)
# │  ┌────────── 시 (0-23)
# │  │  ┌───────── 일 (1-31)
# │  │  │  ┌────────── 월 (1-12)
# │  │  │  │  ┌───────── 요일 (0-7, 0과 7=일요일)
# │  │  │  │  │
# *  *  *  *  *  실행할_명령어
```

### 자주 쓰는 패턴

```bash
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
```

---

## 환경 변수 설정

cron은 최소한의 환경변수만 가집니다. 명시적으로 선언하세요.

```bash
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=admin@example.com    # 에러 시 이메일 수신

0 2 * * * /opt/scripts/backup.sh
```

---

## 로그 기록

```bash
# stdout과 stderr를 파일로 저장
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1

# 날짜 타임스탬프 추가
0 2 * * * echo "[$(date)] 백업 시작" >> /var/log/backup.log && /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

---

## /etc/cron.d 방식 (권장)

```bash
# /etc/cron.d/myapp
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

# 매일 새벽 3시, deploy 사용자로 실행
0 3 * * * deploy /opt/myapp/scripts/cleanup.sh >> /var/log/myapp-cron.log 2>&1
```

시스템 전역 cron 설정에 적합하며, 패키지처럼 관리할 수 있습니다.

---

## 자주 하는 실수

| 실수 | 해결 |
|------|------|
| 명령어 경로 미지정 | 절대 경로 사용 (`/usr/bin/python3`) |
| 환경변수 없음 | 스크립트 상단에 `source /etc/environment` |
| 실행 권한 없음 | `chmod +x script.sh` |
| 결과 확인 어려움 | `>> /var/log/cron-job.log 2>&1` 추가 |
  $g2$,
  'Linux / Shell',
  ARRAY['cron', 'crontab', '스케줄러', '자동화', 'linux'],
  'beginner',
  ARRAY['ubuntu', 'centos', 'debian', 'macos'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  '셸 스크립트 실전 기초',
  'shell-script-basics',
  '변수, 조건문, 반복문, 함수, 에러 처리까지 실무에서 바로 쓸 수 있는 bash 스크립트 작성법을 설명합니다.',
  $g3$
## 스크립트 기본 구조

```bash
#!/bin/bash
set -euo pipefail     # e: 에러 즉시 종료, u: 미정의 변수 에러, o pipefail: 파이프 에러 전파

# 스크립트 설명
# 작성자: SecuThive
# 날짜: 2026-05

main() {
  echo "스크립트 시작"
}

main "$@"
```

---

## 변수

```bash
NAME="SecuThive"
echo "안녕, $NAME"          # 큰따옴표 안에서 변수 확장
echo '값: $NAME'           # 작은따옴표는 문자 그대로

readonly VERSION="1.0.0"   # 상수
unset NAME                 # 변수 삭제

# 기본값 설정
PORT="${PORT:-8080}"       # 환경변수 PORT가 없으면 8080 사용

# 배열
SERVERS=("web1" "web2" "web3")
echo "${SERVERS[0]}"       # web1
echo "${#SERVERS[@]}"      # 원소 개수: 3
```

---

## 조건문

```bash
FILE="/etc/nginx/nginx.conf"

if [[ -f "$FILE" ]]; then
  echo "파일 존재"
elif [[ -d "$FILE" ]]; then
  echo "디렉터리"
else
  echo "없음"
fi

# 문자열 비교
if [[ "$ENV" == "production" ]]; then
  echo "운영 환경"
fi

# 숫자 비교
if [[ $COUNT -gt 10 ]]; then
  echo "10 초과"
fi
```

### 자주 쓰는 파일 테스트

| 표현식 | 의미 |
|--------|------|
| `-f FILE` | 일반 파일 존재 |
| `-d DIR` | 디렉터리 존재 |
| `-e PATH` | 경로 존재 (파일/디렉터리 모두) |
| `-r FILE` | 읽기 권한 있음 |
| `-z STRING` | 문자열이 비어있음 |
| `-n STRING` | 문자열이 비어있지 않음 |

---

## 반복문

```bash
# 배열 순회
for server in "${SERVERS[@]}"; do
  echo "배포: $server"
  ssh "$server" "sudo systemctl restart myapp"
done

# 숫자 범위
for i in {1..5}; do
  echo "시도 $i"
done

# while
COUNT=0
while [[ $COUNT -lt 3 ]]; do
  echo "대기 중..."
  sleep 1
  ((COUNT++))
done
```

---

## 함수

```bash
log() {
  local level="$1"
  local msg="$2"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $msg"
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
```

---

## 에러 처리

```bash
# 명령어 실패 시 커스텀 처리
if ! rsync -av /src/ user@host:/dest/; then
  log "ERROR" "rsync 실패"
  exit 1
fi

# trap으로 스크립트 종료 시 정리
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"; echo "정리 완료"' EXIT

# 에러 시 줄 번호 출력
trap 'echo "에러 발생: 줄 $LINENO"' ERR
```
  $g3$,
  'Linux / Shell',
  ARRAY['bash', 'shell', 'script', '자동화', '스크립트'],
  'intermediate',
  ARRAY['ubuntu', 'centos', 'macos'],
  'SecuThive'
);

-- ② Docker / 컨테이너 ──────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Dockerfile 최적화 — 이미지 크기와 빌드 속도 줄이기',
  'dockerfile-optimization',
  '레이어 캐시 활용, 멀티스테이지 빌드, 불필요한 파일 제거로 이미지 크기를 절반 이하로 줄이는 기법을 설명합니다.',
  $g4$
## 나쁜 Dockerfile vs 좋은 Dockerfile

### 개선 전 (1.2GB)

```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 개선 후 (180MB)

```dockerfile
# ── 빌드 스테이지
FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 먼저 복사 → 코드 변경 시 npm install 캐시 재사용
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# ── 실행 스테이지 (최소 이미지)
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## 핵심 최적화 원칙

### 1. 레이어 캐시 순서

변경 빈도가 낮은 것을 먼저, 높은 것을 나중에 복사합니다.

```dockerfile
# 의존성 파일만 먼저 (잘 안 바뀜)
COPY package*.json ./
RUN npm ci

# 소스 코드는 나중에 (자주 바뀜)
COPY src/ ./src/
```

### 2. .dockerignore 필수

```
node_modules
.git
.env
*.log
dist
coverage
.DS_Store
```

### 3. RUN 명령어 합치기

```dockerfile
# 나쁜 예: 레이어 3개
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*

# 좋은 예: 레이어 1개
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*
```

### 4. alpine 기반 이미지 선택

| 이미지 | 크기 |
|--------|------|
| `node:20` | 1.1GB |
| `node:20-slim` | 240MB |
| `node:20-alpine` | 140MB |

---

## 빌드 캐시 활용 (BuildKit)

```bash
# BuildKit 활성화
DOCKER_BUILDKIT=1 docker build .

# 캐시 마운트로 npm 캐시 영속화
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

---

## 이미지 크기 분석

```bash
# 레이어별 크기 확인
docker history myapp:latest

# dive 툴 (시각적 분석)
docker run --rm -it \
  -v /var/run/docker.sock:/var/run/docker.sock \
  wagoodman/dive myapp:latest
```
  $g4$,
  'Docker / 컨테이너',
  ARRAY['docker', 'dockerfile', 'multistage', 'alpine', '최적화'],
  'intermediate',
  ARRAY['ubuntu', 'macos', 'windows'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Docker 네트워크 이해와 실전 설정',
  'docker-networking',
  'bridge, host, overlay 네트워크의 차이와 컨테이너 간 통신, 외부 노출 설정 방법을 설명합니다.',
  $g5$
## Docker 네트워크 드라이버

| 드라이버 | 설명 | 사용 상황 |
|----------|------|-----------|
| `bridge` | 기본값, 호스트와 격리된 가상 네트워크 | 단일 호스트 내 컨테이너 통신 |
| `host` | 호스트 네트워크 직접 사용 | 성능 최우선, 포트 충돌 주의 |
| `none` | 네트워크 완전 비활성화 | 완전 격리 필요 시 |
| `overlay` | 멀티 호스트 네트워크 | Docker Swarm, Kubernetes |

---

## 기본 네트워크 명령어

```bash
# 네트워크 목록
docker network ls

# 상세 정보 (연결된 컨테이너, IP 대역)
docker network inspect bridge

# 네트워크 생성
docker network create mynet

# 서브넷 지정
docker network create \
  --driver bridge \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  mynet

# 컨테이너를 네트워크에 연결/해제
docker network connect mynet container1
docker network disconnect mynet container1
```

---

## 사용자 정의 bridge 네트워크 (권장)

```bash
# 기본 bridge는 컨테이너 이름 DNS 해석 불가
# 사용자 정의 네트워크에서는 컨테이너 이름으로 통신 가능

docker network create app-net

docker run -d --name db     --network app-net postgres:16
docker run -d --name backend --network app-net \
  -e DB_HOST=db \           # 컨테이너 이름을 호스트로 사용
  myapp:latest
```

---

## Compose에서 네트워크 설정

```yaml
# docker-compose.yml
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
      - backend      # 외부 노출 없음

networks:
  frontend:
  backend:
    internal: true   # 외부 인터넷 차단
```

---

## 포트 매핑

```bash
# 호스트:컨테이너
docker run -p 8080:80 nginx         # 모든 인터페이스
docker run -p 127.0.0.1:8080:80 nginx  # localhost만 노출
docker run -P nginx                 # EXPOSE 포트 랜덤 매핑

# 현재 포트 매핑 확인
docker port container1
```

---

## 네트워크 디버깅

```bash
# 컨테이너 내부에서 네트워크 확인
docker exec -it myapp sh
> nslookup db          # DNS 확인
> curl http://db:5432   # 연결 테스트
> wget -qO- http://backend:3000/health

# 컨테이너 IP 확인
docker inspect --format '{{.NetworkSettings.IPAddress}}' mycontainer
```
  $g5$,
  'Docker / 컨테이너',
  ARRAY['docker', 'network', 'bridge', 'compose', '컨테이너'],
  'intermediate',
  ARRAY['ubuntu', 'macos', 'windows'],
  'SecuThive'
);

-- ③ Git / CI·CD ────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Git 브랜치 전략 — GitHub Flow & Git Flow',
  'git-branch-strategy',
  '소규모 팀에 적합한 GitHub Flow와 릴리즈 주기가 명확한 팀을 위한 Git Flow를 비교하고 선택 기준을 설명합니다.',
  $g6$
## 두 전략 비교

| 기준 | GitHub Flow | Git Flow |
|------|-------------|----------|
| 복잡도 | 낮음 | 높음 |
| 배포 주기 | 수시 (CD) | 정해진 릴리즈 |
| 브랜치 수 | 적음 | 많음 |
| 적합한 팀 | 스타트업, 소규모 | 앱 스토어 배포, 엔터프라이즈 |

---

## GitHub Flow

단순하고 빠른 CI/CD에 최적화된 전략.

```
main ──────────────────────────────────────►
      │              │
      feat/login     fix/bug-123
      (PR & 리뷰)     (PR & 리뷰)
```

### 작업 흐름

```bash
# 1. main에서 기능 브랜치 생성
git switch -c feat/user-auth

# 2. 작업 + 커밋
git add .
git commit -m "feat: JWT 기반 사용자 인증 구현"

# 3. 원격에 푸시
git push -u origin feat/user-auth

# 4. Pull Request 생성 → 코드 리뷰 → main에 병합
# 5. 배포 (자동 or 수동)
# 6. 브랜치 삭제
git branch -d feat/user-auth
```

---

## Git Flow

버전 릴리즈가 분명한 프로젝트에 적합.

```
main ─────────────────────────────────────► (태그: v1.0, v2.0)
       ↑ merge                ↑ merge
develop ───────────────────────────────────►
        │ merge    │ merge
        feat/A    feat/B
```

### 주요 브랜치

| 브랜치 | 역할 |
|--------|------|
| `main` | 배포된 코드, 태그로 버전 관리 |
| `develop` | 다음 릴리즈 통합 |
| `feat/*` | 기능 개발 (develop에서 분기) |
| `release/*` | QA·버그픽스 (develop → main) |
| `hotfix/*` | 긴급 수정 (main에서 분기) |

```bash
# git-flow CLI 사용
brew install git-flow-avh    # macOS
apt install git-flow         # Ubuntu

git flow init
git flow feature start login
git flow feature finish login
git flow release start 1.2.0
git flow release finish 1.2.0
```

---

## 공통 커밋 메시지 컨벤션 (Conventional Commits)

```
<type>(<scope>): <요약>

feat(auth): JWT 토큰 갱신 로직 추가
fix(api): 응답 헤더 누락 수정
docs: README 설치 가이드 업데이트
refactor(db): 쿼리 최적화
chore: 의존성 업그레이드
```

---

## 브랜치 보호 규칙 (GitHub)

`Settings → Branches → Add rule`:

- Require pull request reviews (최소 1명)
- Require status checks (CI 통과 필수)
- Restrict pushes (직접 push 금지)
  $g6$,
  'Git / CI·CD',
  ARRAY['git', 'github', 'branch', 'gitflow', '브랜치전략'],
  'beginner',
  ARRAY['ubuntu', 'macos', 'windows'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Git 실수 복구 완전 가이드 — reset, revert, stash',
  'git-undo-guide',
  '잘못된 커밋, 잘못된 브랜치 작업, 실수로 삭제한 파일까지 — 상황별 Git 되돌리기 방법을 정리했습니다.',
  $g7$
## 상황별 복구 방법 한눈에 보기

| 상황 | 명령어 |
|------|--------|
| 스테이징 취소 | `git restore --staged <file>` |
| 작업 디렉터리 되돌리기 | `git restore <file>` |
| 마지막 커밋 수정 | `git commit --amend` |
| 커밋 되돌리기 (히스토리 유지) | `git revert HEAD` |
| 커밋 취소 (히스토리 삭제) | `git reset HEAD~1` |
| 작업 임시 저장 | `git stash` |
| 삭제된 커밋 복구 | `git reflog` |

---

## 스테이징/작업 디렉터리 되돌리기

```bash
# 스테이징 취소 (파일 변경 내용은 유지)
git restore --staged index.html

# 작업 디렉터리 변경 취소 (파일 변경 내용 삭제 — 주의)
git restore index.html

# 전체 되돌리기
git restore --staged .
git restore .
```

---

## 커밋 수정 (push 전에만)

```bash
# 마지막 커밋 메시지 수정
git commit --amend -m "fix: 올바른 메시지"

# 마지막 커밋에 파일 추가
git add forgotten.txt
git commit --amend --no-edit
```

> push된 커밋은 --amend 후 force push가 필요하므로 공유 브랜치에서는 사용 금지.

---

## reset — 로컬 커밋 취소

```bash
# --soft: 커밋만 취소, 변경사항은 스테이징으로
git reset --soft HEAD~1

# --mixed (기본): 커밋 취소 + 스테이징 해제, 파일은 유지
git reset HEAD~1

# --hard: 커밋 + 변경사항 모두 삭제 (위험)
git reset --hard HEAD~1

# 특정 커밋으로 이동
git reset --hard abc1234
```

---

## revert — 공유 브랜치에서 커밋 취소

```bash
# 특정 커밋을 되돌리는 새 커밋 생성
git revert abc1234

# 여러 커밋 revert (커밋은 하나만 생성)
git revert --no-commit HEAD~3..HEAD
git commit -m "revert: 마지막 3개 커밋 되돌리기"
```

---

## stash — 작업 임시 저장

```bash
git stash                          # 현재 변경사항 임시 저장
git stash push -m "로그인 기능 WIP"  # 이름 붙여서 저장
git stash list                     # 저장 목록 확인
git stash pop                      # 최근 stash 적용 + 삭제
git stash apply stash@{1}          # 특정 stash 적용 (삭제 안 함)
git stash drop stash@{0}           # 특정 stash 삭제
git stash branch feat/new stash@{0}  # stash를 브랜치로 분리
```

---

## reflog — 삭제된 커밋 복구

```bash
# 최근 작업 히스토리 확인 (reset, checkout 포함)
git reflog

# 특정 시점으로 복구
git reset --hard HEAD@{3}

# 삭제된 브랜치 복구
git reflog | grep "feat/login"
git checkout -b feat/login abc1234
```
  $g7$,
  'Git / CI·CD',
  ARRAY['git', 'reset', 'revert', 'stash', 'reflog', '복구'],
  'intermediate',
  ARRAY['ubuntu', 'macos', 'windows'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'GitHub Actions로 CI/CD 파이프라인 구축하기',
  'github-actions-cicd',
  'Push 이벤트에 테스트·빌드·배포를 자동화하는 GitHub Actions 워크플로우를 단계별로 작성합니다.',
  $g8$
## 워크플로우 기본 구조

파일 위치: `.github/workflows/ci.yml`

```yaml
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
```

---

## 환경 변수와 시크릿

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      NODE_ENV: production

    steps:
      - name: 배포
        env:
          API_KEY: ${{ secrets.API_KEY }}       # GitHub Secrets
          DB_URL: ${{ vars.DATABASE_URL }}       # GitHub Variables (공개)
        run: ./deploy.sh
```

> Secrets 등록: `Settings → Secrets and variables → Actions → New repository secret`

---

## 조건부 실행

```yaml
steps:
  # main 브랜치 push 시에만 배포
  - name: 프로덕션 배포
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    run: ./deploy-prod.sh

  # 이전 스텝 실패해도 실행
  - name: 슬랙 알림
    if: always()
    run: ./notify-slack.sh
```

---

## 매트릭스 전략 (여러 버전 테스트)

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, macos-latest]

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

---

## 캐시 활용

```yaml
- name: 캐시 복원
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

---

## Docker 빌드 + 레지스트리 푸시

```yaml
- name: Docker Hub 로그인
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_TOKEN }}

- name: 이미지 빌드 + 푸시
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: myapp:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

---

## SSH로 서버 배포

```yaml
- name: 서버 배포
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.SSH_HOST }}
    username: deploy
    key: ${{ secrets.SSH_KEY }}
    script: |
      cd /opt/myapp
      git pull origin main
      docker compose up -d --build
```
  $g8$,
  'Git / CI·CD',
  ARRAY['github-actions', 'cicd', 'automation', 'pipeline', 'deploy'],
  'intermediate',
  ARRAY['ubuntu'],
  'SecuThive'
);

-- ④ 네트워킹 / 서버 ────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Nginx 웹서버 기본 설정과 리버스 프록시',
  'nginx-basic-configuration',
  'Nginx 설치부터 정적 파일 서빙, 리버스 프록시, 로드 밸런싱 설정까지 실무에서 바로 쓸 수 있도록 설명합니다.',
  $g9$
## 설치

```bash
# Ubuntu
sudo apt update && sudo apt install -y nginx
sudo systemctl enable --now nginx

# 상태 확인
sudo nginx -t          # 설정 문법 검사
sudo nginx -s reload   # 설정 재로드
```

---

## 기본 설정 파일 구조

```
/etc/nginx/
├── nginx.conf          # 메인 설정
├── sites-available/    # 사용 가능한 가상 호스트
│   └── myapp.conf
└── sites-enabled/      # 활성화된 가상 호스트 (심볼릭 링크)
    └── myapp.conf -> ../sites-available/myapp.conf
```

---

## 정적 파일 서빙

```nginx
# /etc/nginx/sites-available/static.conf

server {
    listen 80;
    server_name example.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA 지원
    }

    # 캐시 설정
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 리버스 프록시 (Node.js/Python 앱 앞단)

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;

        # 필수 헤더
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 타임아웃
        proxy_connect_timeout 30s;
        proxy_read_timeout    60s;

        # 버퍼링
        proxy_buffering on;
        proxy_buffer_size 4k;
    }
}
```

---

## 로드 밸런싱

```nginx
upstream backend {
    least_conn;                  # 연결 수 적은 서버 우선 (기본: round_robin)
    server 10.0.0.1:3000 weight=3;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000 backup; # 나머지 모두 다운 시에만 사용
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

---

## 유용한 보안 헤더

```nginx
server {
    # 클릭재킹 방지
    add_header X-Frame-Options "SAMEORIGIN";
    # XSS 필터
    add_header X-XSS-Protection "1; mode=block";
    # MIME 스니핑 방지
    add_header X-Content-Type-Options "nosniff";
    # HTTPS 강제 (SSL 설정 후)
    add_header Strict-Transport-Security "max-age=31536000" always;

    # 서버 버전 숨기기
    server_tokens off;
}
```

---

## 설정 활성화

```bash
sudo ln -s /etc/nginx/sites-available/myapp.conf \
           /etc/nginx/sites-enabled/

sudo nginx -t && sudo systemctl reload nginx
```
  $g9$,
  '네트워킹 / 서버',
  ARRAY['nginx', '웹서버', 'proxy', 'loadbalancer', 'reverse-proxy'],
  'beginner',
  ARRAY['ubuntu', 'debian', 'centos'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Let''s Encrypt로 HTTPS 무료 SSL 인증서 발급',
  'letsencrypt-ssl-setup',
  'Certbot을 사용해 도메인에 무료 SSL 인증서를 발급하고 Nginx에 적용, 자동 갱신을 설정하는 방법입니다.',
  $g10$
## 사전 조건

- 도메인이 서버 IP를 가리키고 있어야 함 (`A` 레코드)
- 포트 80, 443이 열려 있어야 함

---

## Certbot 설치

```bash
# Ubuntu
sudo apt install -y certbot python3-certbot-nginx

# CentOS
sudo yum install -y certbot python3-certbot-nginx
```

---

## 인증서 발급 (Nginx 자동 설정)

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

certbot이 자동으로:
1. 인증서 발급
2. Nginx 설정에 SSL 블록 추가
3. HTTP → HTTPS 리다이렉트 추가

---

## 수동 설정 (제어가 필요한 경우)

```bash
# 인증서만 발급 (Nginx 건드리지 않음)
sudo certbot certonly --nginx -d example.com
```

발급된 파일 위치:

```
/etc/letsencrypt/live/example.com/
├── fullchain.pem   # 인증서 + 체인
├── privkey.pem     # 개인키
├── cert.pem        # 인증서만
└── chain.pem       # 체인만
```

Nginx에 직접 적용:

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 권장 SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

---

## 자동 갱신 (90일 유효기간)

Certbot 설치 시 자동으로 systemd 타이머가 등록됩니다.

```bash
# 갱신 타이머 확인
systemctl status certbot.timer

# 갱신 테스트 (실제 갱신 아님)
sudo certbot renew --dry-run

# 갱신 후 Nginx 자동 재로드 설정 (이미 포함된 경우 많음)
# /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
#!/bin/bash
systemctl reload nginx
```

---

## 와일드카드 인증서 (DNS 방식)

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d "*.example.com" \
  -d example.com
```

발급 시 DNS TXT 레코드를 도메인에 추가해야 합니다.
  $g10$,
  '네트워킹 / 서버',
  ARRAY['ssl', 'https', 'letsencrypt', 'certbot', 'nginx', 'tls'],
  'beginner',
  ARRAY['ubuntu', 'centos', 'debian'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'UFW 방화벽 설정 완전 가이드',
  'ufw-firewall-guide',
  'Ubuntu UFW로 포트를 열고 닫고, 특정 IP만 허용하고, 로깅과 상태 확인까지 실무 방화벽 설정을 설명합니다.',
  $g11$
## UFW란?

Uncomplicated Firewall. iptables의 복잡한 문법을 단순화한 Ubuntu 기본 방화벽 도구.

---

## 기본 사용법

```bash
# 설치 및 상태 확인
sudo apt install ufw
sudo ufw status verbose

# 활성화 / 비활성화
sudo ufw enable
sudo ufw disable

# 기본 정책 설정 (먼저 설정 권장)
sudo ufw default deny incoming   # 인바운드 전체 차단
sudo ufw default allow outgoing  # 아웃바운드 전체 허용
```

> 주의: 원격 서버에서 `ufw enable` 전에 반드시 SSH 포트를 허용하세요.

---

## 포트 허용/차단

```bash
# SSH 허용 (22번 포트)
sudo ufw allow 22/tcp
sudo ufw allow ssh       # 서비스 이름으로도 가능

# 웹 서버
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 'Nginx Full'    # 80 + 443 한번에

# 특정 포트 차단
sudo ufw deny 8080/tcp

# 포트 범위
sudo ufw allow 3000:4000/tcp

# 특정 IP만 허용 (DB 서버 접근 제한)
sudo ufw allow from 192.168.1.100 to any port 5432

# 특정 서브넷 허용
sudo ufw allow from 10.0.0.0/24
```

---

## 규칙 관리

```bash
# 현재 규칙 번호 포함 조회
sudo ufw status numbered

# 규칙 삭제 (번호로)
sudo ufw delete 3

# 규칙 삭제 (내용으로)
sudo ufw delete allow 80/tcp

# 모든 규칙 초기화
sudo ufw reset
```

---

## 로깅

```bash
# 로깅 활성화
sudo ufw logging on
sudo ufw logging high    # low / medium / high / full

# 로그 확인
sudo tail -f /var/log/ufw.log

# 차단된 연결 확인
sudo grep "BLOCK" /var/log/ufw.log | tail -20
```

---

## 권장 초기 설정 (SSH 서버)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp        # SSH (또는 사용자 지정 포트)
sudo ufw allow 80/tcp        # HTTP
sudo ufw allow 443/tcp       # HTTPS
sudo ufw logging on
sudo ufw enable
sudo ufw status verbose
```

---

## iptables 직접 규칙 추가 (UFW 우회)

```bash
# 특정 IP 즉시 차단 (공격 대응)
sudo iptables -I INPUT -s 1.2.3.4 -j DROP

# UFW 재시작 후에도 유지하려면
# /etc/ufw/before.rules 에 추가
```
  $g11$,
  '네트워킹 / 서버',
  ARRAY['ufw', 'firewall', 'iptables', '방화벽', '보안', 'ubuntu'],
  'beginner',
  ARRAY['ubuntu', 'debian'],
  'SecuThive'
);

-- ⑤ OS / 시스템 ───────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  '리눅스 사용자·그룹 관리',
  'linux-user-group-management',
  '사용자 생성과 삭제, 그룹 관리, sudo 권한 설정, 패스워드 정책까지 서버 사용자 관리 전반을 설명합니다.',
  $g12$
## 사용자 관리

```bash
# 사용자 생성
sudo useradd -m -s /bin/bash deploy       # 홈 디렉터리 + bash 쉘
sudo useradd -m -s /bin/bash -G docker,sudo deploy  # 그룹 포함

# 패스워드 설정
sudo passwd deploy

# 사용자 정보 수정
sudo usermod -s /bin/zsh deploy           # 쉘 변경
sudo usermod -aG docker deploy            # 그룹 추가 (-a 없으면 기존 그룹 제거)
sudo usermod -L deploy                    # 계정 잠금
sudo usermod -U deploy                    # 잠금 해제

# 사용자 삭제
sudo userdel deploy                       # 홈 유지
sudo userdel -r deploy                    # 홈 + 메일 함께 삭제
```

---

## 그룹 관리

```bash
# 그룹 생성/삭제
sudo groupadd devteam
sudo groupdel devteam

# 사용자를 그룹에 추가/제거
sudo gpasswd -a deploy devteam
sudo gpasswd -d deploy devteam

# 현재 사용자의 그룹 확인
id
groups deploy

# 특정 그룹의 멤버 확인
getent group docker
```

---

## /etc/passwd & /etc/shadow

```bash
# 사용자 정보 확인
getent passwd deploy
# deploy:x:1001:1001::/home/deploy:/bin/bash
# 필드: 이름:패스워드:UID:GID:코멘트:홈:쉘

# 계정 만료 정보
sudo chage -l deploy
sudo chage -M 90 deploy      # 90일마다 패스워드 변경 강제
sudo chage -E 2026-12-31 deploy  # 계정 만료일 설정
```

---

## sudo 권한 설정

```bash
# sudo 그룹에 추가 (Ubuntu: sudo, CentOS: wheel)
sudo usermod -aG sudo deploy

# 세밀한 권한 설정 (visudo로 편집)
sudo visudo

# 예시: deploy는 패스워드 없이 특정 명령만 실행 가능
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/docker *

# 그룹에 권한 부여
%devteam ALL=(ALL) NOPASSWD: /usr/bin/docker
```

---

## 서비스 전용 계정 (보안 권장)

```bash
# 시스템 계정: 로그인 불가, 홈 없음
sudo useradd -r -s /sbin/nologin www-data

# 애플리케이션 전용 계정
sudo useradd \
  --system \
  --no-create-home \
  --shell /sbin/nologin \
  --comment "App Service Account" \
  myapp
```

---

## 현재 로그인 사용자 확인

```bash
who          # 로그인 중인 사용자
w            # 로그인 + 현재 작업
last         # 최근 로그인 기록
lastb        # 실패한 로그인 시도
```
  $g12$,
  'OS / 시스템',
  ARRAY['linux', 'user', 'group', 'sudo', 'permission', '사용자관리'],
  'beginner',
  ARRAY['ubuntu', 'centos', 'debian'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  '리눅스 시스템 리소스 모니터링',
  'linux-system-monitoring',
  'CPU, 메모리, 디스크, 네트워크를 실시간으로 모니터링하고 병목을 찾는 실무 명령어와 도구를 정리했습니다.',
  $g13$
## CPU 모니터링

```bash
# 실시간 CPU 사용률 (1초 간격)
top -d 1
htop                    # 컬러풀한 인터랙티브 뷰어

# CPU 평균 부하 (load average)
uptime
# 15:30:00 up 10 days, 3:20, 1 user, load average: 0.52, 0.48, 0.41
# CPU 코어 수보다 load average가 크면 과부하

# 코어 수 확인
nproc
lscpu | grep "CPU(s):"

# CPU 사용률 상위 프로세스
ps aux --sort=-%cpu | head -10
```

---

## 메모리 모니터링

```bash
# 메모리 현황 (사람이 읽기 좋은 단위)
free -h
# buff/cache는 실제 사용 가능한 메모리이므로 available 컬럼이 중요

# 실시간
watch -n 1 free -h

# 메모리 사용 상위 프로세스
ps aux --sort=-%mem | head -10

# 상세 메모리 정보
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|Cached|Buffers"

# 스왑 사용량
swapon --show
```

---

## 디스크 모니터링

```bash
# 파일시스템 사용량
df -h                              # 전체
df -h /var                         # 특정 경로만

# 디렉터리 크기 (큰 것 찾기)
du -sh /var/*  | sort -rh | head -10
du -sh /*      | sort -rh | head -10

# inode 사용량 (파일 개수 부족 문제)
df -i

# 실시간 I/O
iostat -xz 1
iotop -ao             # I/O 많은 프로세스 확인 (sudo 필요)

# 특정 프로세스의 I/O
lsof -p PID
```

---

## 네트워크 모니터링

```bash
# 현재 연결 상태
ss -tunlp                          # tcp/udp 포트 + 프로세스
ss -s                              # 연결 요약

# 실시간 트래픽
iftop -i eth0                      # 인터페이스별 트래픽
nload eth0                         # 수신/송신 그래프

# 연결 수 확인 (DDoS 탐지)
ss -tn | awk 'NR>1 {print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head

# 네트워크 통계
netstat -s | grep -E "segments|failed"
```

---

## 종합 모니터링 도구

```bash
# vmstat: CPU, 메모리, I/O, 스왑 한번에
vmstat 1 10      # 1초 간격, 10번 출력

# sar: 시간대별 기록 (sysstat 패키지)
sudo apt install sysstat
sar -u 1 5       # CPU (1초 간격, 5번)
sar -r 1 5       # 메모리
sar -d 1 5       # 디스크

# 과거 데이터 조회
sar -u -f /var/log/sysstat/sa$(date +%d -d yesterday)
```

---

## 알람 설정 예시 (간단 스크립트)

```bash
#!/bin/bash
# CPU 90% 초과 시 알람

THRESHOLD=90
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
CPU=${CPU%.*}

if [[ $CPU -gt $THRESHOLD ]]; then
  echo "[ALERT] CPU 사용률 ${CPU}%" | mail -s "CPU 경고" admin@example.com
fi
```
  $g13$,
  'OS / 시스템',
  ARRAY['linux', 'monitoring', 'cpu', 'memory', 'disk', 'iostat'],
  'intermediate',
  ARRAY['ubuntu', 'centos', 'debian'],
  'SecuThive'
);

-- ⑥ 보안 설정 ─────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'GPG 키 생성과 파일 암호화 실전',
  'gpg-encryption-guide',
  'GPG 키 쌍을 생성하고, 파일을 암호화·복호화하며, 대칭키 암호화와 서명까지 실무에 적용하는 방법입니다.',
  $g14$
## GPG란?

GNU Privacy Guard. 공개키 암호화 방식으로 파일 암호화, 디지털 서명, 이메일 암호화 등에 사용합니다.

---

## 키 생성

```bash
# 대화형 키 생성 (권장)
gpg --gen-key

# 상세 옵션으로 생성
gpg --full-generate-key
# → RSA 4096 또는 Ed25519 선택
# → 유효기간 설정 (2y 권장)
# → 이름/이메일 입력

# 생성된 키 확인
gpg --list-keys
gpg --list-secret-keys --keyid-format LONG
```

---

## 파일 암호화 (공개키 방식)

```bash
# 수신자 공개키로 암호화 (수신자만 복호화 가능)
gpg --encrypt --recipient "admin@example.com" secret.txt
# → secret.txt.gpg 생성

# 복호화 (개인키 필요)
gpg --decrypt secret.txt.gpg > secret.txt

# ASCII 아머 형식으로 암호화 (텍스트 전송 시)
gpg --armor --encrypt --recipient "admin@example.com" secret.txt
# → secret.txt.asc 생성
```

---

## 대칭키 암호화 (패스워드 방식)

```bash
# 패스워드로 암호화 (공개키 불필요)
gpg --symmetric --cipher-algo AES256 backup.tar.gz
# → backup.tar.gz.gpg 생성

# 복호화
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz
```

---

## 디지털 서명

```bash
# 분리 서명 파일 생성 (원본 + .sig)
gpg --detach-sign release.tar.gz
# → release.tar.gz.sig 생성

# 서명 검증
gpg --verify release.tar.gz.sig release.tar.gz

# 서명 + 암호화 동시
gpg --sign --encrypt --recipient "admin@example.com" file.txt
```

---

## 키 내보내기 / 가져오기

```bash
# 공개키 내보내기 (공유용)
gpg --armor --export "admin@example.com" > public.key

# 개인키 내보내기 (백업용, 안전하게 보관)
gpg --armor --export-secret-keys "admin@example.com" > private.key

# 키 가져오기
gpg --import public.key
gpg --import private.key

# 신뢰도 설정
gpg --edit-key "admin@example.com"
> trust → 5 (최종 신뢰)
```

---

## 키 서버 활용

```bash
# 키 서버에 공개키 업로드
gpg --keyserver hkps://keys.openpgp.org --send-keys KEY_ID

# 키 서버에서 검색
gpg --keyserver hkps://keys.openpgp.org --search-keys "admin@example.com"
```
  $g14$,
  '보안 설정',
  ARRAY['gpg', 'encryption', 'pgp', '암호화', '서명', '보안'],
  'intermediate',
  ARRAY['ubuntu', 'centos', 'macos'],
  'SecuThive'
);

-- ⑦ 클라우드 ────────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'AWS EC2 인스턴스 시작하기',
  'aws-ec2-getting-started',
  'EC2 인스턴스를 생성하고, 보안 그룹을 설정하고, SSH 접속 및 기본 서버 설정까지 단계별로 안내합니다.',
  $g15$
## EC2 인스턴스 생성

### 추천 설정

| 항목 | 권장값 |
|------|--------|
| AMI | Ubuntu 22.04 LTS |
| 인스턴스 타입 | t3.micro (테스트) / t3.small (소규모 운영) |
| 스토리지 | gp3 20GB+ |
| 키 페어 | 새로 생성 후 .pem 파일 안전 보관 |

---

## 보안 그룹 설정

인바운드 규칙:

| 포트 | 프로토콜 | 소스 | 용도 |
|------|----------|------|------|
| 22 | TCP | 내 IP | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP |
| 443 | TCP | 0.0.0.0/0 | HTTPS |

> SSH 포트는 내 IP만 허용 — 0.0.0.0/0 설정은 보안 취약.

---

## SSH 접속

```bash
# 키 파일 권한 설정 (최초 1회)
chmod 400 my-key.pem

# 접속
ssh -i my-key.pem ubuntu@<EC2-PUBLIC-IP>

# ~/.ssh/config 등록 (편리하게 접속)
Host myserver
    HostName 123.45.67.89
    User ubuntu
    IdentityFile ~/.ssh/my-key.pem
    ServerAliveInterval 60

# 이후
ssh myserver
```

---

## 접속 후 초기 설정

```bash
# 패키지 업데이트
sudo apt update && sudo apt upgrade -y

# 기본 도구 설치
sudo apt install -y \
  curl wget git vim htop \
  build-essential ufw fail2ban

# 타임존 설정 (한국)
sudo timedatectl set-timezone Asia/Seoul

# 스왑 파일 생성 (t3.micro 메모리 부족 대비)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 방화벽 설정
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Elastic IP 연결 (고정 IP)

EC2 재시작 시 공인 IP가 바뀌므로, 운영 서버에는 Elastic IP를 연결합니다.

1. `EC2 → Elastic IPs → Allocate`
2. 생성된 IP 선택 → `Associate Elastic IP`
3. 인스턴스 선택 후 연결

---

## AWS CLI 설정

```bash
# 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# 자격증명 설정
aws configure
# AWS Access Key ID: ...
# AWS Secret Access Key: ...
# Default region: ap-northeast-2  (서울)
# Default output format: json

# 인스턴스 목록 확인
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]' --output table
```

---

## 인스턴스 유형 선택 기준

| 패밀리 | 용도 | 예시 |
|--------|------|------|
| t3/t4g | 범용, 버스트 가능 | 소규모 웹서버 |
| m6i/m7i | 범용, 일정 성능 | API 서버 |
| c6i/c7i | 컴퓨팅 집약 | 렌더링, 배치 |
| r6i/r7i | 메모리 집약 | DB, 캐시 |
  $g15$,
  '클라우드',
  ARRAY['aws', 'ec2', 'cloud', 'ssh', '서버', 'ubuntu'],
  'beginner',
  ARRAY['ubuntu'],
  'SecuThive'
);

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'AWS S3 버킷 생성과 CLI 활용',
  'aws-s3-cli-guide',
  'S3 버킷을 생성하고, 버킷 정책과 ACL을 설정하며, AWS CLI로 파일을 업로드·다운로드·동기화하는 방법입니다.',
  $g16$
## S3 버킷 생성

```bash
# AWS CLI로 생성 (서울 리전)
aws s3 mb s3://my-bucket-name --region ap-northeast-2

# 버킷 목록
aws s3 ls

# 버킷 내 파일 목록
aws s3 ls s3://my-bucket-name/
aws s3 ls s3://my-bucket-name/logs/ --recursive
```

---

## 파일 업로드 / 다운로드

```bash
# 단일 파일 업로드
aws s3 cp file.txt s3://my-bucket/file.txt

# 디렉터리 업로드 (재귀)
aws s3 cp ./dist/ s3://my-bucket/dist/ --recursive

# 다운로드
aws s3 cp s3://my-bucket/file.txt ./file.txt

# 디렉터리 동기화 (변경된 파일만 전송)
aws s3 sync ./dist/ s3://my-bucket/ --delete   # 로컬에 없는 S3 파일 삭제 포함
aws s3 sync s3://my-bucket/backups/ ./backups/ # S3 → 로컬
```

---

## 유용한 옵션

```bash
# 특정 파일 제외
aws s3 sync . s3://my-bucket/ --exclude "*.log" --exclude ".git/*"

# 특정 파일만 포함
aws s3 sync . s3://my-bucket/ --include "*.html" --exclude "*"

# 공개 접근 허용 (정적 웹사이트)
aws s3 cp index.html s3://my-bucket/ --acl public-read

# 스토리지 클래스 지정 (비용 절감)
aws s3 cp backup.tar.gz s3://my-bucket/backups/ \
  --storage-class STANDARD_IA

# 만료 시간 있는 미리 서명된 URL (1시간)
aws s3 presign s3://my-bucket/private.pdf --expires-in 3600
```

---

## 버킷 정책 (공개 정적 웹사이트)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
```

```bash
aws s3api put-bucket-policy \
  --bucket my-bucket \
  --policy file://bucket-policy.json
```

---

## 정적 웹사이트 호스팅 설정

```bash
aws s3 website s3://my-bucket/ \
  --index-document index.html \
  --error-document error.html
```

웹사이트 엔드포인트: `http://my-bucket.s3-website.ap-northeast-2.amazonaws.com`

---

## 백업 자동화 (cron + aws s3)

```bash
#!/bin/bash
# /opt/scripts/backup-to-s3.sh

DATE=$(date +%Y%m%d-%H%M)
BACKUP_FILE="/tmp/db-backup-${DATE}.tar.gz"

# DB 덤프
pg_dump mydb | gzip > "$BACKUP_FILE"

# S3 업로드
aws s3 cp "$BACKUP_FILE" "s3://my-backups/db/${DATE}.tar.gz" \
  --storage-class STANDARD_IA

rm -f "$BACKUP_FILE"
echo "[$(date)] 백업 완료: ${DATE}"
```

```bash
# crontab에 등록
0 3 * * * /opt/scripts/backup-to-s3.sh >> /var/log/s3-backup.log 2>&1
```
  $g16$,
  '클라우드',
  ARRAY['aws', 's3', 'cli', '스토리지', '백업', 'cloud'],
  'beginner',
  ARRAY['ubuntu', 'macos'],
  'SecuThive'
);

-- ⑧ 데이터베이스 ───────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'PostgreSQL 설치와 기본 설정',
  'postgresql-setup-guide',
  'Ubuntu에 PostgreSQL을 설치하고, 사용자와 데이터베이스를 생성하며, 원격 접속과 백업까지 설정하는 방법입니다.',
  $g17$
## 설치

```bash
# Ubuntu 22.04 (기본 저장소)
sudo apt install -y postgresql postgresql-contrib

# 최신 버전 설치 (PostgreSQL 공식 APT)
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update && sudo apt install -y postgresql-16

# 서비스 시작
sudo systemctl enable --now postgresql
```

---

## 기본 접속

```bash
# postgres 슈퍼유저로 접속
sudo -u postgres psql

# psql 내 기본 명령어
\l          -- 데이터베이스 목록
\c mydb     -- 데이터베이스 전환
\dt         -- 테이블 목록
\d users    -- 테이블 구조
\du         -- 사용자 목록
\q          -- 종료
```

---

## 사용자 및 데이터베이스 생성

```bash
sudo -u postgres psql
```

```sql
-- 사용자 생성
CREATE USER myapp WITH PASSWORD 'strongpassword123!';

-- 데이터베이스 생성 (소유자 지정)
CREATE DATABASE myappdb OWNER myapp;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE myappdb TO myapp;

-- 특정 스키마 권한
GRANT ALL ON SCHEMA public TO myapp;
GRANT ALL ON ALL TABLES IN SCHEMA public TO myapp;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO myapp;
```

---

## 설정 파일

```bash
# 설정 파일 위치 확인
sudo -u postgres psql -c "SHOW config_file;"
# /etc/postgresql/16/main/postgresql.conf
```

### postgresql.conf 주요 설정

```ini
# 원격 접속 허용
listen_addresses = '*'          # 기본값: localhost

# 연결 수
max_connections = 100

# 메모리 (RAM의 25% 권장)
shared_buffers = 256MB

# 임시 정렬 메모리
work_mem = 4MB

# 로그
log_destination = 'stderr'
logging_collector = on
log_line_prefix = '%t [%p]: [%l-1] '
log_slow_query = 1000           # 1초 이상 쿼리 로그
```

### pg_hba.conf (접속 제어)

```
# 로컬
local   all   postgres    peer
local   all   all         md5

# 원격 (특정 IP 대역만 허용)
host    myappdb   myapp   10.0.0.0/24   scram-sha-256
host    all       all     127.0.0.1/32  scram-sha-256
```

```bash
sudo systemctl reload postgresql
```

---

## 백업과 복원

```bash
# 단일 DB 덤프
pg_dump -U myapp -h localhost myappdb > backup.sql
pg_dump -U myapp -h localhost -Fc myappdb > backup.dump  # 압축 포맷

# 전체 클러스터 백업
sudo -u postgres pg_dumpall > all_databases.sql

# 복원
psql -U myapp -h localhost myappdb < backup.sql
pg_restore -U myapp -h localhost -d myappdb backup.dump

# 테이블만 덤프
pg_dump -U myapp -t users myappdb > users.sql
```

---

## 자주 쓰는 모니터링 쿼리

```sql
-- 현재 연결 수
SELECT count(*) FROM pg_stat_activity;

-- 실행 중인 쿼리
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active';

-- 테이블 크기
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 슬로우 쿼리
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;
```
  $g17$,
  '데이터베이스',
  ARRAY['postgresql', 'postgres', 'database', 'sql', 'db', '백업'],
  'beginner',
  ARRAY['ubuntu', 'debian', 'centos'],
  'SecuThive'
);

-- 완료 확인
SELECT category, count(*) as guide_count
FROM public.engineer_guides
WHERE status = 'published'
GROUP BY category
ORDER BY category;
