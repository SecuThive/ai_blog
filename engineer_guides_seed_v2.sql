-- ============================================================
-- engineer_guides 추가 시드 데이터 v2 (22개 가이드)
-- Supabase SQL Editor에서 전체 실행
-- ============================================================

-- ① Linux / Shell ─────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'find 명령어 실전 완전 가이드',
  'linux-find-command-guide',
  '파일 검색부터 조건 필터링, exec 연계 삭제·변환까지 find 명령어를 현업에서 바로 쓸 수 있도록 정리합니다.',
  $g1$
## find 기본 구조

```bash
find [경로] [조건] [액션]
```

---

## 이름·확장자로 검색

```bash
# 파일명 정확히 일치
find /var/log -name "nginx.log"

# 와일드카드 (대소문자 구분)
find . -name "*.log"

# 대소문자 무시
find . -iname "*.Log"

# 특정 디렉터리 제외
find . -name "*.js" -not -path "*/node_modules/*"
```

---

## 타입·크기·날짜 필터

```bash
# 파일만 (-type f), 디렉터리만 (-type d)
find /opt -type f -name "*.conf"

# 크기 조건 (100MB 초과 파일)
find /var -type f -size +100M

# 수정된 지 7일 이내
find /home -type f -mtime -7

# 접근한 지 30일 이상 된 파일
find /tmp -type f -atime +30
```

---

## exec로 결과에 명령 적용

```bash
# 찾은 파일 모두 삭제
find /tmp -type f -name "*.tmp" -exec rm {} \;

# 찾은 파일 권한 변경
find /var/www -type f -exec chmod 644 {} \;

# 디렉터리 권한만 변경
find /var/www -type d -exec chmod 755 {} \;

# xargs로 한 번에 처리 (더 빠름)
find . -name "*.log" -mtime +30 | xargs rm -f
```

---

## 실무 패턴

```bash
# 빈 파일 찾기
find . -type f -empty

# 빈 디렉터리 찾기 및 삭제
find . -type d -empty -delete

# SUID 비트 설정된 파일 (보안 감사)
find / -perm -4000 -type f 2>/dev/null

# 최근 1시간 내 변경된 파일
find /etc -type f -newer /tmp/checkpoint

# 로그 파일 압축 후 삭제
find /var/log -name "*.log" -mtime +7 -exec gzip {} \; -exec mv {}.gz /archive/ \;
```

---

## 주의사항

- `rm`과 조합할 때는 먼저 `-exec ls -la {} \;`로 대상 확인 후 실행
- `/proc`, `/sys` 경로는 `-xdev`로 마운트 경계 넘지 않게 제한
- 대용량 디렉터리는 `find ... | head -20` 으로 먼저 샘플 확인
  $g1$,
  'Linux / Shell', ARRAY['find','파일검색','linux','shell','실전'], 'beginner', ARRAY['Ubuntu','Debian','CentOS','RHEL'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'awk · sed 실전 — 로그 파싱과 텍스트 변환',
  'awk-sed-practical-guide',
  '로그 분석, CSV 변환, 설정 파일 패치 등 현업에서 자주 쓰는 awk·sed 패턴을 한 곳에 정리합니다.',
  $g1$
## awk 기본

```bash
# 구분자로 필드 출력 ($1=첫번째 필드)
awk '{print $1, $3}' access.log

# 구분자 지정 (콜론)
awk -F':' '{print $1}' /etc/passwd

# 조건 필터 (5번째 필드가 200인 행)
awk '$5 == 200 {print $0}' access.log

# 합계 계산
awk '{sum += $NF} END {print "Total:", sum}' numbers.txt
```

---

## awk 실전 로그 분석

```bash
# Nginx access.log에서 상태코드별 집계
awk '{print $9}' /var/log/nginx/access.log | sort | uniq -c | sort -rn

# IP별 요청 수 Top 10
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10

# 응답 크기 합계 (바이트)
awk '{sum += $10} END {printf "Total: %.2f MB\n", sum/1024/1024}' access.log

# 4xx, 5xx 에러만 출력
awk '$9 ~ /^[45]/' /var/log/nginx/access.log
```

---

## sed 기본

```bash
# 문자열 치환 (첫 번째 일치)
sed 's/old/new/' file.txt

# 전체 치환 (g 플래그)
sed 's/old/new/g' file.txt

# 대소문자 무시 치환
sed 's/old/new/gi' file.txt

# 파일 직접 수정 (-i)
sed -i 's/localhost/127.0.0.1/g' config.conf

# 특정 줄 삭제 (3번째 줄)
sed '3d' file.txt

# 빈 줄 제거
sed '/^$/d' file.txt

# 주석 줄 제거
sed '/^#/d' config.conf
```

---

## sed 실전 설정 파일 패치

```bash
# 포트 번호 변경
sed -i 's/^Port 22/Port 2222/' /etc/ssh/sshd_config

# 특정 줄 다음에 새 줄 삽입
sed -i '/^SELINUX=enforcing/a SELINUXTYPE=targeted' /etc/selinux/config

# 여러 파일 일괄 치환
find . -name "*.conf" -exec sed -i 's/old_domain/new_domain/g' {} \;

# 구분자를 / 대신 | 사용 (경로 포함 시 편리)
sed 's|/old/path|/new/path|g' deploy.sh
```

---

## 조합 패턴

```bash
# 특정 범위 줄만 처리 (10~20번째 줄)
sed -n '10,20p' large_file.log

# 패턴 사이 줄 출력
sed -n '/START/,/END/p' file.txt

# awk로 파싱 후 sed로 포맷 정리
awk -F',' '{print $1,$3}' data.csv | sed 's/ /\t/g'
```
  $g1$,
  'Linux / Shell', ARRAY['awk','sed','로그분석','텍스트처리','linux'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','macOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'tmux 완전 가이드 — 세션·창·패널 관리',
  'tmux-complete-guide',
  '원격 서버 작업의 필수 도구 tmux. 세션 유지, 창 분할, 설정 커스터마이징까지 실무 중심으로 정리합니다.',
  $g1$
## tmux가 필요한 이유

SSH 접속이 끊겨도 작업이 유지됩니다. 배포 스크립트, 빌드, 모니터링을 tmux 안에서 실행하면 네트워크 문제로 세션이 끊겨도 서버에서 계속 실행됩니다.

---

## 세션 관리

```bash
# 새 세션 시작
tmux new -s deploy

# 세션 목록
tmux ls

# 세션 재연결 (detach 후 돌아오기)
tmux attach -t deploy

# 세션 종료
tmux kill-session -t deploy
```

---

## 키 바인딩 (기본 prefix: Ctrl+b)

| 단축키 | 동작 |
|--------|------|
| `Ctrl+b d` | 세션 detach (세션은 유지) |
| `Ctrl+b c` | 새 창(window) 생성 |
| `Ctrl+b n / p` | 다음 / 이전 창 |
| `Ctrl+b 0~9` | 창 번호로 이동 |
| `Ctrl+b %` | 세로 패널 분할 |
| `Ctrl+b "` | 가로 패널 분할 |
| `Ctrl+b 방향키` | 패널 간 이동 |
| `Ctrl+b z` | 현재 패널 전체화면 토글 |
| `Ctrl+b [` | 스크롤 모드 진입 (q로 종료) |
| `Ctrl+b ,` | 창 이름 변경 |

---

## ~/.tmux.conf 추천 설정

```bash
# prefix를 Ctrl+a로 변경 (선택 사항)
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# 마우스 활성화 (스크롤, 패널 클릭)
set -g mouse on

# 창 번호 1부터 시작
set -g base-index 1
setw -g pane-base-index 1

# 상태바 색상
set -g status-bg colour235
set -g status-fg colour136

# 히스토리 크기 늘리기
set -g history-limit 10000

# 설정 즉시 적용
bind r source-file ~/.tmux.conf \; display "Config reloaded!"
```

설정 적용: `Ctrl+b r` 또는 `tmux source ~/.tmux.conf`

---

## 실무 패턴

```bash
# 배포용 세션 구성 (자동화)
tmux new-session -d -s prod -n monitor
tmux send-keys -t prod:monitor "htop" Enter
tmux new-window -t prod -n logs
tmux send-keys -t prod:logs "tail -f /var/log/app/app.log" Enter
tmux new-window -t prod -n shell
tmux attach -t prod

# 여러 패널에 동시 입력 (동기화)
Ctrl+b :setw synchronize-panes on
```

---

## 스크롤 모드에서 복사

1. `Ctrl+b [` 로 스크롤 모드 진입
2. 방향키 또는 PageUp/PageDown으로 이동
3. `Space` 로 선택 시작, 방향키로 범위 지정
4. `Enter` 로 복사 (tmux 클립보드)
5. `Ctrl+b ]` 로 붙여넣기
  $g1$,
  'Linux / Shell', ARRAY['tmux','터미널','세션관리','원격작업','productivity'], 'beginner', ARRAY['Ubuntu','Debian','CentOS','macOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'rsync로 안전한 파일 동기화 및 백업',
  'rsync-backup-sync-guide',
  'rsync의 핵심 옵션부터 원격 서버 동기화, 증분 백업 자동화까지 실무 중심으로 설명합니다.',
  $g1$
## rsync 기본 구조

```bash
rsync [옵션] [출발지] [목적지]
```

---

## 필수 옵션

| 옵션 | 의미 |
|------|------|
| `-a` | archive 모드 (권한, 소유자, 타임스탬프, 심볼릭링크 보존) |
| `-v` | verbose (진행상황 출력) |
| `-z` | 압축 전송 (원격 전송 시 유용) |
| `-P` | 진행률 표시 + 부분 전송 재개 |
| `--delete` | 목적지에만 있는 파일 삭제 (미러링) |
| `--dry-run` | 실제 실행 없이 미리보기 |
| `--exclude` | 특정 파일/디렉터리 제외 |

---

## 로컬 동기화

```bash
# 기본 복사 (trailing slash 주의)
rsync -av /src/dir/ /dst/dir/

# trailing slash 없으면 디렉터리 자체가 복사됨
rsync -av /src/dir  /dst/       # → /dst/dir/
rsync -av /src/dir/ /dst/dir/   # → /dst/dir/ 내용만

# 미러링 (목적지에서 사라진 파일도 삭제)
rsync -av --delete /src/dir/ /dst/dir/
```

---

## 원격 서버 동기화

```bash
# 로컬 → 원격 업로드
rsync -avz -P /local/app/ user@server:/opt/app/

# 원격 → 로컬 다운로드 (백업)
rsync -avz user@server:/var/log/ /backup/logs/

# SSH 포트 지정
rsync -avz -e "ssh -p 2222" /local/ user@server:/remote/

# 특정 파일 제외
rsync -av --exclude="*.log" --exclude=".git" /src/ /dst/
```

---

## 증분 백업 스크립트

```bash
#!/bin/bash
# /usr/local/bin/backup.sh

BACKUP_ROOT="/mnt/backup"
SOURCE="/var/www"
DATE=$(date +%Y-%m-%d)
LATEST="$BACKUP_ROOT/latest"
DEST="$BACKUP_ROOT/$DATE"

rsync -av --delete \
  --link-dest="$LATEST" \
  --exclude="*.tmp" \
  --exclude="node_modules" \
  "$SOURCE/" "$DEST/"

# latest 링크 갱신
rm -f "$LATEST"
ln -s "$DEST" "$LATEST"

echo "Backup complete: $DEST"
```

```bash
chmod +x /usr/local/bin/backup.sh

# cron에 등록 (매일 새벽 2시)
echo "0 2 * * * root /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1" \
  > /etc/cron.d/daily-backup
```

`--link-dest`는 하드링크를 이용한 증분 백업 — 변경되지 않은 파일은 공간을 추가로 차지하지 않습니다.

---

## 성능 튜닝

```bash
# 압축 레벨 조정 (0~9, 기본 6)
rsync -av --compress-level=1 /src/ user@server:/dst/

# 병렬 전송 (대용량 파일 다수)
rsync -av --no-compress /src/ user@server:/dst/

# 체크섬 기반 비교 (타임스탬프 대신)
rsync -avc /src/ /dst/
```
  $g1$,
  'Linux / Shell', ARRAY['rsync','백업','동기화','파일전송','linux'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','macOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

-- ② Docker / 컨테이너 ──────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Docker Compose 실전 — 멀티 컨테이너 앱 구성',
  'docker-compose-practical-guide',
  'docker-compose.yml 작성부터 서비스 의존성, 볼륨, 환경변수, 헬스체크까지 실무 패턴을 정리합니다.',
  $g1$
## docker-compose.yml 기본 구조

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mydb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pg_data:
```

---

## 자주 쓰는 명령

```bash
# 빌드 + 시작 (백그라운드)
docker compose up -d --build

# 특정 서비스만 재시작
docker compose restart app

# 로그 실시간 확인
docker compose logs -f app

# 실행 중인 컨테이너 상태
docker compose ps

# 컨테이너 내부 접속
docker compose exec app sh

# 모두 중지 + 네트워크/볼륨 제거
docker compose down -v

# 스케일 업 (app 서비스 3개 실행)
docker compose up -d --scale app=3
```

---

## 환경 파일 분리

```bash
# .env 파일 (기본으로 자동 로드)
DB_PASSWORD=secret
APP_PORT=3000

# docker-compose.yml에서 사용
environment:
  DB_PASSWORD: ${DB_PASSWORD}
  APP_PORT: ${APP_PORT}
```

```bash
# 환경별 오버라이드
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`docker-compose.prod.yml`에서 개발용 볼륨 마운트를 제거하고 리소스 제한을 추가하는 패턴이 일반적입니다.

---

## 리소스 제한

```yaml
services:
  app:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 256M
```

---

## 실전 Nginx + App + DB 구성

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
    depends_on:
      - app

  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - BUILD_ENV=production
    expose:
      - "3000"
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    env_file:
      - .env.db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      retries: 5
    restart: unless-stopped

volumes:
  pg_data:

networks:
  default:
    name: app_network
```
  $g1$,
  'Docker / 컨테이너', ARRAY['docker','docker-compose','컨테이너','멀티서비스','devops'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  '실행 중인 컨테이너 디버깅 — docker exec, logs, inspect',
  'docker-container-debugging',
  '컨테이너가 예상대로 동작하지 않을 때 사용하는 디버깅 명령어와 패턴을 정리합니다.',
  $g1$
## 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너
docker ps

# 종료된 컨테이너 포함
docker ps -a

# 리소스 사용량 실시간 모니터링
docker stats

# 특정 컨테이너만
docker stats my_app
```

---

## 로그 확인

```bash
# 전체 로그
docker logs my_app

# 마지막 100줄
docker logs --tail 100 my_app

# 실시간 스트림
docker logs -f my_app

# 타임스탬프 포함
docker logs -t my_app

# 특정 시간 이후 로그
docker logs --since "2024-01-15T10:00:00" my_app
```

---

## 컨테이너 내부 접속

```bash
# 셸 접속 (bash 없으면 sh 사용)
docker exec -it my_app bash
docker exec -it my_app sh

# 단일 명령 실행
docker exec my_app cat /etc/nginx/nginx.conf

# 루트로 접속 (권한 문제 디버깅)
docker exec -u root -it my_app bash

# 환경변수 확인
docker exec my_app env
```

---

## inspect로 상세 정보 조회

```bash
# 전체 정보 (JSON)
docker inspect my_app

# 특정 필드만 추출
docker inspect -f '{{.State.Status}}' my_app
docker inspect -f '{{.NetworkSettings.IPAddress}}' my_app
docker inspect -f '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' my_app

# 환경변수 목록
docker inspect -f '{{range .Config.Env}}{{.}}{{"\n"}}{{end}}' my_app
```

---

## 컨테이너가 즉시 종료될 때

```bash
# 종료 코드 확인
docker inspect my_app | grep -A5 '"State"'

# 크래시 루프 컨테이너 로그 보기
docker logs my_app 2>&1 | tail -50

# entrypoint 오버라이드로 셸 진입
docker run -it --entrypoint sh my_image:latest

# 종료된 컨테이너에서 파일 복사
docker cp dead_container:/app/error.log ./error.log
```

---

## 네트워크 디버깅

```bash
# 컨테이너 네트워크 목록
docker network ls

# 네트워크 상세 (어떤 컨테이너가 연결됐는지)
docker network inspect bridge

# 컨테이너에서 다른 컨테이너로 ping (컨테이너명 사용)
docker exec my_app ping db

# DNS 해석 확인
docker exec my_app nslookup db

# 포트 리스닝 확인
docker exec my_app ss -tlnp
```

---

## 이미지 레이어 분석

```bash
# 레이어별 크기 확인
docker history my_image:latest

# 상세 레이어 정보
docker history --no-trunc my_image:latest

# dive 도구로 시각화 (설치 필요)
# https://github.com/wagoodman/dive
dive my_image:latest
```
  $g1$,
  'Docker / 컨테이너', ARRAY['docker','디버깅','컨테이너','logs','inspect'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

-- ③ Git / CI·CD ────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'git rebase · cherry-pick 실전 가이드',
  'git-rebase-cherry-pick-guide',
  '커밋 히스토리 정리, 브랜치 동기화, 특정 커밋만 가져오기까지 rebase와 cherry-pick을 실무 관점에서 정리합니다.',
  $g1$
## rebase vs merge

| | merge | rebase |
|--|-------|--------|
| 히스토리 | 머지 커밋 생성, 분기 그대로 | 선형으로 정리 |
| 충돌 해결 | 한 번 | 커밋마다 |
| 공개 브랜치 | 권장 | **사용 금지** |
| 로컬 작업 | 가능 | 권장 |

---

## 기본 rebase

```bash
# feature 브랜치에서 main 최신 내용 반영
git checkout feature/my-feature
git rebase main

# 충돌 발생 시
# 1. 파일 수정하여 충돌 해결
# 2. git add 해결된 파일
# 3. git rebase --continue

# 중단하고 원래 상태로
git rebase --abort
```

---

## interactive rebase — 커밋 정리

```bash
# 최근 3개 커밋 편집
git rebase -i HEAD~3
```

에디터에 표시되는 명령:

```
pick a1b2c3 첫 번째 커밋
pick d4e5f6 두 번째 커밋
pick g7h8i9 세 번째 커밋
```

`pick`을 다음으로 변경:

| 명령 | 동작 |
|------|------|
| `pick` | 그대로 유지 |
| `reword` | 커밋 메시지 수정 |
| `edit` | 커밋 내용 수정 |
| `squash` | 이전 커밋과 합치기 (메시지 합침) |
| `fixup` | 이전 커밋과 합치기 (메시지 버림) |
| `drop` | 커밋 삭제 |

---

## squash 예시 — WIP 커밋 정리

```bash
git rebase -i HEAD~4

# 에디터:
pick a1b2c3 feat: 로그인 기능
fixup d4e5f6 wip
fixup g7h8i9 wip 2
reword h0i1j2 fix: 토큰 갱신 버그
```

결과: 4개 커밋이 2개로 깔끔하게 정리됩니다.

---

## cherry-pick — 특정 커밋만 가져오기

```bash
# 커밋 해시 찾기
git log --oneline feature/hotfix

# 단일 커밋 적용
git cherry-pick a1b2c3

# 범위 지정
git cherry-pick a1b2c3..g7h8i9

# 커밋하지 않고 스테이지만
git cherry-pick -n a1b2c3

# 충돌 해결 후
git cherry-pick --continue

# 중단
git cherry-pick --abort
```

---

## 실무 패턴

```bash
# hotfix를 main과 release 브랜치 양쪽에 적용
git checkout main
git cherry-pick fix-commit-hash

git checkout release/v2.0
git cherry-pick fix-commit-hash

# PR 전 커밋 정리 (squash + rebase)
git fetch origin
git rebase origin/main
git rebase -i origin/main  # WIP 커밋 정리

# 실수로 main에 커밋한 것을 feature로 이동
git checkout -b feature/oops
git checkout main
git reset --hard HEAD~1  # 로컬 main에서만!
```

---

## 주의사항

- **이미 push한 커밋은 rebase 금지** — 협업자의 히스토리가 깨집니다
- 부득이하게 force push할 경우: `git push --force-with-lease` 사용 (남이 중간에 push했으면 거절됨)
  $g1$,
  'Git / CI·CD', ARRAY['git','rebase','cherry-pick','커밋정리','협업'], 'advanced', ARRAY['Ubuntu','macOS','Windows'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'GitHub Actions로 Docker 이미지 빌드 및 레지스트리 배포 자동화',
  'github-actions-docker-build-push',
  'GitHub Actions 워크플로우로 Docker 이미지를 빌드하고 GHCR 또는 Docker Hub에 푸시하는 CI/CD 파이프라인을 구성합니다.',
  $g1$
## 전체 흐름

```
git push → GitHub Actions 트리거
→ 코드 체크아웃
→ Docker 이미지 빌드
→ 레지스트리 푸시 (GHCR / Docker Hub)
→ 서버에서 docker pull + 재시작
```

---

## GHCR(GitHub Container Registry) 배포

```yaml
# .github/workflows/docker-build.yml

name: Docker Build & Push

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=sha-
            type=semver,pattern={{version}}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 빌드 후 서버 자동 배포

```yaml
      - name: Deploy to server
        if: github.ref == 'refs/heads/main'
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker pull ghcr.io/${{ github.repository }}:main
            docker compose -f /opt/app/docker-compose.yml up -d app
            docker image prune -f
```

---

## Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions:

| Secret 이름 | 값 |
|-------------|-----|
| `SERVER_HOST` | 서버 IP 또는 도메인 |
| `SERVER_USER` | SSH 사용자명 |
| `SSH_PRIVATE_KEY` | SSH 개인키 (-----BEGIN OPENSSH PRIVATE KEY----- ...) |

`GITHUB_TOKEN`은 Actions가 자동으로 제공합니다.

---

## 멀티 아키텍처 빌드 (ARM 지원)

```yaml
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Build and push (multi-arch)
        uses: docker/build-push-action@v5
        with:
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
```

ARM 서버(AWS Graviton, Raspberry Pi)와 x86 서버를 동시에 지원할 때 사용합니다.

---

## 캐시로 빌드 속도 개선

`cache-from: type=gha` / `cache-to: type=gha,mode=max` 설정만으로 GitHub Actions 캐시를 활용합니다. 레이어 변경이 없으면 재빌드하지 않아 빌드 시간이 크게 단축됩니다.
  $g1$,
  'Git / CI·CD', ARRAY['github-actions','docker','ci-cd','ghcr','자동배포'], 'intermediate', ARRAY['Ubuntu'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

-- ④ 네트워킹 / 서버 ────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'ss · netstat · tcpdump으로 네트워크 상태 진단',
  'network-diagnostic-ss-netstat-tcpdump',
  '포트 리스닝 확인, 연결 상태 조회, 패킷 캡처까지 리눅스 네트워크 진단의 핵심 도구를 실무 중심으로 정리합니다.',
  $g1$
## ss — 현대적인 소켓 통계

`netstat`의 후계자. 더 빠르고 정보가 풍부합니다.

```bash
# 리스닝 중인 포트 (TCP + UDP)
ss -tlunp

# 옵션 설명
# -t TCP, -u UDP, -l Listening, -n 숫자로, -p 프로세스 표시

# 특정 포트 확인
ss -tlnp | grep :80

# 모든 연결 상태
ss -ta

# ESTABLISHED 연결만
ss -t state established

# 특정 IP와의 연결
ss dst 192.168.1.100

# 연결 수 집계
ss -t | awk 'NR>1 {print $1}' | sort | uniq -c
```

---

## netstat (레거시 서버에서)

```bash
# 설치
apt install net-tools   # Ubuntu/Debian
yum install net-tools   # CentOS/RHEL

# 리스닝 포트 확인
netstat -tlnp

# 연결 상태 요약
netstat -s | head -30

# 특정 포트를 점유한 프로세스
netstat -tlnp | grep :3000
```

---

## tcpdump — 패킷 캡처

```bash
# 특정 인터페이스에서 캡처
tcpdump -i eth0

# 특정 포트 (HTTP)
tcpdump -i eth0 port 80

# 특정 호스트와의 통신
tcpdump -i eth0 host 8.8.8.8

# 파일로 저장 (Wireshark로 열 수 있음)
tcpdump -i eth0 -w /tmp/capture.pcap

# 저장한 파일 읽기
tcpdump -r /tmp/capture.pcap

# HTTP 요청 내용 보기
tcpdump -i eth0 -A port 80 | grep "Host:"

# SYN 패킷만 (연결 시도 모니터링)
tcpdump -i eth0 'tcp[tcpflags] & tcp-syn != 0'
```

---

## 실무 진단 시나리오

```bash
# 시나리오 1: 포트 3000이 열려있는지 확인
ss -tlnp | grep 3000
# 또는
curl -v telnet://localhost:3000

# 시나리오 2: 외부에서 80 포트 접근 가능한지
nc -zv your-server.com 80

# 시나리오 3: TIME_WAIT 연결이 너무 많을 때
ss -t state time-wait | wc -l
# /etc/sysctl.conf에 추가:
# net.ipv4.tcp_tw_reuse = 1
# net.ipv4.tcp_fin_timeout = 30

# 시나리오 4: 특정 프로세스의 모든 연결
ss -tp | grep nginx

# 시나리오 5: 연결이 끊기는 원인 추적
tcpdump -i eth0 -w /tmp/debug.pcap host 10.0.0.5 &
# 문제 재현 후
kill %1
tcpdump -r /tmp/debug.pcap | tail -50
```

---

## 유용한 조합

```bash
# 연결이 많은 상위 IP
ss -t state established | awk 'NR>1 {print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head

# 포트별 연결 수
ss -t | awk 'NR>1 {print $4}' | rev | cut -d: -f1 | rev | sort | uniq -c | sort -rn
```
  $g1$,
  '네트워킹 / 서버', ARRAY['네트워크','ss','netstat','tcpdump','진단'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','RHEL'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'DNS 레코드 완전 가이드 — A, CNAME, MX, TXT 설정과 dig 활용',
  'dns-records-dig-guide',
  'DNS 레코드 타입별 용도와 설정 방법, dig 명령으로 DNS 문제를 직접 진단하는 방법을 정리합니다.',
  $g1$
## DNS 레코드 타입

| 타입 | 용도 | 예시 |
|------|------|------|
| A | 도메인 → IPv4 | `nodelog.kr → 1.2.3.4` |
| AAAA | 도메인 → IPv6 | `nodelog.kr → 2001:db8::1` |
| CNAME | 도메인 → 도메인 | `www → nodelog.kr` |
| MX | 메일 서버 | `@ → mail.nodelog.kr (우선순위 10)` |
| TXT | 텍스트 (SPF, DKIM 등) | `"v=spf1 include:sendgrid.net ~all"` |
| NS | 네임서버 | `@ → ns1.cloudflare.com` |
| CAA | 인증서 발급 허용 CA | `@ → 0 issue "letsencrypt.org"` |

---

## 주요 레코드 설정 예시

```
; A 레코드
nodelog.kr.     300  IN  A     1.2.3.4
www.nodelog.kr. 300  IN  A     1.2.3.4

; CNAME (www를 루트로 리다이렉트)
www.nodelog.kr. 300  IN  CNAME nodelog.kr.

; MX (Gmail 사용 시)
nodelog.kr. 300 IN MX 1  aspmx.l.google.com.
nodelog.kr. 300 IN MX 5  alt1.aspmx.l.google.com.

; SPF (스팸 방지)
nodelog.kr. 300 IN TXT "v=spf1 include:_spf.google.com ~all"

; DMARC
_dmarc.nodelog.kr. 300 IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@nodelog.kr"
```

---

## dig으로 DNS 조회

```bash
# A 레코드 조회
dig nodelog.kr A

# 짧은 출력
dig nodelog.kr +short

# 특정 DNS 서버로 조회 (캐시 우회)
dig @8.8.8.8 nodelog.kr A

# MX 레코드
dig nodelog.kr MX

# TXT 레코드 (SPF/DKIM 확인)
dig nodelog.kr TXT

# NS 조회
dig nodelog.kr NS

# 전체 DNS 전파 경로 추적
dig +trace nodelog.kr
```

---

## DNS 문제 진단 패턴

```bash
# 1. 도메인이 올바른 IP를 가리키는지 확인
dig +short nodelog.kr A

# 2. 전파 전 특정 네임서버에서 직접 조회
dig @ns1.your-registrar.com nodelog.kr A

# 3. 리버스 DNS 조회 (IP → 도메인)
dig -x 1.2.3.4

# 4. SOA 레코드로 캐시 TTL 확인
dig nodelog.kr SOA

# 5. DNSSEC 검증
dig nodelog.kr +dnssec

# 6. 글로벌 전파 상태 확인
# https://dnschecker.org 에서 시각적으로 확인 가능
```

---

## TTL 전략

- **변경 전**: TTL을 300초(5분)로 낮춰 두세요. 실수 시 빠르게 되돌릴 수 있습니다.
- **안정화 후**: TTL을 3600~86400초로 올려 DNS 응답 속도를 높입니다.
- **CDN 사용 시**: CDN 프록시 레코드(Cloudflare orange cloud 등)는 TTL이 자동 관리됩니다.
  $g1$,
  '네트워킹 / 서버', ARRAY['DNS','dig','레코드','네트워크','도메인'], 'beginner', ARRAY['Ubuntu','Debian','CentOS','macOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

-- ⑤ OS / 시스템 ────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  '디스크 관리 실전 — lsblk, df, du, fdisk, LVM',
  'disk-management-lsblk-df-du',
  '디스크 용량 확인부터 파티션 생성, LVM 볼륨 확장까지 서버 디스크 관리의 핵심 명령어를 정리합니다.',
  $g1$
## 현재 상태 파악

```bash
# 블록 디바이스 목록 (마운트 포인트 포함)
lsblk

# 파일시스템 사용량
df -h

# 특정 경로만
df -h /var

# inode 사용량 (파일 수 한계 문제)
df -i

# 디렉터리별 사용량 (1단계)
du -sh /*

# 용량 큰 순서로 정렬
du -sh /var/* | sort -rh | head -10

# 현재 디렉터리 하위 분석
du -sh ./* | sort -rh
```

---

## 디스크 추가 및 파티션 생성

```bash
# 새 디스크 확인 (보통 /dev/sdb 또는 /dev/nvme1n1)
lsblk
fdisk -l /dev/sdb

# 파티션 생성 (대화형)
fdisk /dev/sdb
# → n (새 파티션), p (primary), 1 (번호), Enter, Enter (전체), w (저장)

# GPT 파티션 (대용량 2TB+)
parted /dev/sdb mklabel gpt
parted /dev/sdb mkpart primary ext4 0% 100%

# 포맷
mkfs.ext4 /dev/sdb1

# 마운트
mkdir /data
mount /dev/sdb1 /data

# 부팅 시 자동 마운트 (/etc/fstab)
echo "UUID=$(blkid -s UUID -o value /dev/sdb1) /data ext4 defaults 0 2" >> /etc/fstab
mount -a  # fstab 반영 확인
```

---

## LVM — 논리 볼륨 확장

기존 볼륨 그룹에 디스크를 추가하고 논리 볼륨을 확장합니다.

```bash
# 현재 LVM 상태 확인
pvs    # 물리 볼륨
vgs    # 볼륨 그룹
lvs    # 논리 볼륨

# 새 디스크를 물리 볼륨으로 초기화
pvcreate /dev/sdb

# 기존 볼륨 그룹에 추가
vgextend ubuntu-vg /dev/sdb

# 논리 볼륨 확장 (여유 공간 전부)
lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv

# 파일시스템 확장 (ext4)
resize2fs /dev/ubuntu-vg/ubuntu-lv

# xfs인 경우
xfs_growfs /
```

---

## 디스크 건강 상태 확인

```bash
# SMART 정보
apt install smartmontools
smartctl -a /dev/sda

# 빠른 테스트
smartctl -t short /dev/sda

# I/O 통계 실시간 확인
iostat -x 1 5

# 디스크 읽기/쓰기 속도 테스트
dd if=/dev/zero of=/tmp/test bs=1M count=1024 oflag=direct
dd if=/tmp/test of=/dev/null bs=1M
```

---

## 로그 정리로 공간 확보

```bash
# journald 로그 정리 (2주 이상)
journalctl --vacuum-time=2w

# apt 캐시 정리
apt autoremove && apt clean

# Docker 미사용 리소스 제거
docker system prune -a

# 오래된 로그 파일 찾기
find /var/log -name "*.gz" -mtime +30 -delete
```
  $g1$,
  'OS / 시스템', ARRAY['디스크','lsblk','df','du','LVM','파티션'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','RHEL'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'journalctl 완전 활용 — systemd 로그 조회와 분석',
  'journalctl-log-analysis-guide',
  'journalctl로 시스템 로그를 조회·필터링·분석하는 방법을 실무 시나리오와 함께 정리합니다.',
  $g1$
## 기본 조회

```bash
# 전체 로그 (최신 순)
journalctl -r

# 마지막 100줄
journalctl -n 100

# 실시간 스트림 (tail -f 같은)
journalctl -f

# 부팅 이후 로그
journalctl -b

# 이전 부팅 로그 (-1 = 직전, -2 = 그 전)
journalctl -b -1
```

---

## 서비스별 필터링

```bash
# 특정 유닛 로그
journalctl -u nginx
journalctl -u nginx -f  # 실시간

# 여러 유닛
journalctl -u nginx -u php-fpm

# 특정 PID
journalctl _PID=1234
```

---

## 시간 범위 필터

```bash
# 오늘 로그
journalctl --since today

# 특정 시간 범위
journalctl --since "2024-01-15 10:00:00" --until "2024-01-15 12:00:00"

# 1시간 전부터
journalctl --since "1 hour ago"

# 어제
journalctl --since yesterday --until today
```

---

## 우선순위(레벨) 필터

```bash
# emerg(0) ~ debug(7)
journalctl -p err          # error 이상만
journalctl -p warning..err # warning ~ error 범위

# 레벨 목록
# 0=emerg, 1=alert, 2=crit, 3=err, 4=warning, 5=notice, 6=info, 7=debug
```

---

## 출력 형식

```bash
# JSON 출력 (로그 파이프라인에 유용)
journalctl -u nginx -o json | jq '.MESSAGE'

# 짧은 출력 (타임스탬프 생략)
journalctl -o short

# cat 형식 (메시지만)
journalctl -o cat -u myapp

# 커널 메시지만 (dmesg 대체)
journalctl -k
```

---

## 실무 시나리오

```bash
# 시나리오 1: 서비스 크래시 원인 찾기
journalctl -u myapp -p err --since "1 hour ago"

# 시나리오 2: 부팅 실패 원인
journalctl -b -1 -p err

# 시나리오 3: OOM killer 발생 확인
journalctl -k | grep -i "oom\|killed process"

# 시나리오 4: SSH 로그인 실패 모니터링
journalctl -u sshd | grep "Failed password" | awk '{print $11}' | sort | uniq -c | sort -rn

# 시나리오 5: 특정 메시지 검색
journalctl -u nginx | grep "upstream timed out"

# 시나리오 6: 로그를 파일로 저장
journalctl -u nginx --since today > /tmp/nginx-today.log
```

---

## 로그 용량 관리

```bash
# 현재 저널 용량
journalctl --disk-usage

# 오래된 로그 삭제 (2주 이상)
journalctl --vacuum-time=2w

# 용량 제한 (500MB)
journalctl --vacuum-size=500M

# /etc/systemd/journald.conf 영구 설정
SystemMaxUse=500M
MaxRetentionSec=2week
```
  $g1$,
  'OS / 시스템', ARRAY['journalctl','로그','systemd','모니터링','디버깅'], 'beginner', ARRAY['Ubuntu','Debian','CentOS','RHEL'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  '메모리·스왑 관리 — free, vmstat, 스왑 설정',
  'memory-swap-management-guide',
  '서버 메모리 상태 파악, OOM 원인 분석, 스왑 파일 생성 및 스왑니스 조정까지 실무 중심으로 정리합니다.',
  $g1$
## 메모리 현황 파악

```bash
# 기본 메모리 정보
free -h

# 출력 예시:
#               total  used   free   shared  buff/cache  available
# Mem:           7.6G  2.1G   3.2G     45M        2.3G      5.1G
# Swap:          2.0G  100M   1.9G

# "available"이 실제 사용 가능한 메모리 (buff/cache 포함)
```

---

## 상세 메모리 분석

```bash
# /proc/meminfo 상세 정보
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|SwapTotal|SwapFree"

# 프로세스별 메모리 사용량
ps aux --sort=-%mem | head -10

# 특정 프로세스 상세
cat /proc/$(pgrep nginx)/status | grep -E "VmRSS|VmSize"

# vmstat으로 메모리 + 스왑 + CPU 동향 (1초 간격)
vmstat 1 10
```

---

## OOM(Out of Memory) 이벤트 확인

```bash
# OOM killer 발동 기록
journalctl -k | grep -i "oom\|killed process\|memory"

# 또는
dmesg | grep -i oom

# 특정 프로세스의 OOM score 확인 (높을수록 먼저 킬됨)
cat /proc/$(pgrep myapp)/oom_score

# OOM에서 보호 (-1000: 절대 킬 안됨)
echo -1000 > /proc/$(pgrep sshd)/oom_score_adj
```

---

## 스왑 파일 생성

클라우드 서버(AWS t2, t3)는 기본적으로 스왑이 없습니다.

```bash
# 4GB 스왑 파일 생성
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 부팅 시 자동 활성화
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# 확인
swapon --show
free -h
```

---

## swappiness 조정

`swappiness`는 커널이 RAM 대신 스왑을 얼마나 적극적으로 사용하는지 결정합니다 (0~100, 기본 60).

```bash
# 현재 값 확인
cat /proc/sys/vm/swappiness

# 즉시 변경 (재부팅 시 초기화)
sysctl vm.swappiness=10

# 영구 설정
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

- 데이터베이스 서버: `vm.swappiness=10` (RAM 우선)
- 일반 서버: `vm.swappiness=10~30`
- 기본값 60은 데스크탑용으로 설계됨

---

## 메모리 캐시 비우기

```bash
# PageCache 비우기 (실서버에서는 신중히)
sync && echo 1 > /proc/sys/vm/drop_caches

# PageCache + dentries + inodes
sync && echo 3 > /proc/sys/vm/drop_caches
```

운영 중인 서버에서는 일반적으로 불필요합니다 — 캐시는 free 메모리가 필요할 때 커널이 자동으로 해제합니다.
  $g1$,
  'OS / 시스템', ARRAY['메모리','스왑','OOM','vmstat','free','linux'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','RHEL'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

-- ⑥ 보안 설정 ──────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'SSH 서버 보안 강화 — 설정 최적화와 fail2ban',
  'ssh-hardening-fail2ban',
  'SSH 기본 설정 강화, 키 기반 인증 전용 전환, fail2ban 브루트포스 차단까지 서버 첫 세팅 시 꼭 해야 할 보안 작업을 정리합니다.',
  $g1$
## sshd_config 보안 설정

```bash
# 편집
vim /etc/ssh/sshd_config
```

```ini
# 포트 변경 (기본 22에서 변경, 스캔 노이즈 감소)
Port 2222

# 루트 로그인 금지
PermitRootLogin no

# 비밀번호 인증 비활성화 (키 기반만 허용)
PasswordAuthentication no
ChallengeResponseAuthentication no

# 빈 비밀번호 금지
PermitEmptyPasswords no

# 특정 사용자만 SSH 허용
AllowUsers deploy admin

# 최대 인증 시도 횟수
MaxAuthTries 3

# 비활성 타임아웃 (300초)
ClientAliveInterval 300
ClientAliveCountMax 2

# X11 포워딩 비활성화
X11Forwarding no

# 로그인 배너
Banner /etc/issue.net
```

```bash
# 설정 검증 후 재시작
sshd -t && systemctl restart sshd
```

---

## 키 기반 인증 설정

**서버에서:**
```bash
# deploy 사용자 생성
adduser deploy
usermod -aG sudo deploy

# SSH 디렉터리 준비
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
```

**로컬 머신에서:**
```bash
# 키 생성 (Ed25519 권장)
ssh-keygen -t ed25519 -C "deploy@myserver" -f ~/.ssh/myserver_ed25519

# 공개키를 서버로 복사
ssh-copy-id -i ~/.ssh/myserver_ed25519.pub deploy@server-ip

# 또는 수동으로
cat ~/.ssh/myserver_ed25519.pub | ssh deploy@server-ip "cat >> ~/.ssh/authorized_keys"
```

**서버에서:**
```bash
chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## fail2ban 설치 및 설정

```bash
apt install fail2ban

# 로컬 설정 파일 생성 (업데이트 시 덮어쓰이지 않음)
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

`/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
# 차단 시간 (초, -1 = 영구)
bantime  = 3600
# 관찰 시간 창
findtime = 600
# 허용 실패 횟수
maxretry = 5
# 내 IP는 차단 제외
ignoreip = 127.0.0.1/8 ::1 내.공인IP

[sshd]
enabled = true
port    = 2222
logpath = %(sshd_log)s
backend = %(sshd_backend)s
maxretry = 3
bantime  = 86400
```

```bash
systemctl enable --now fail2ban

# 상태 확인
fail2ban-client status sshd

# 차단된 IP 목록
fail2ban-client status sshd | grep "Banned IP"

# 특정 IP 수동 차단 해제
fail2ban-client set sshd unbanip 1.2.3.4
```

---

## 로그인 시도 모니터링

```bash
# 실패한 로그인 시도
journalctl -u sshd | grep "Failed password" | tail -20

# IP별 실패 횟수
journalctl -u sshd | grep "Failed password" | awk '{print $11}' | sort | uniq -c | sort -rn

# 성공한 로그인
journalctl -u sshd | grep "Accepted"
```
  $g1$,
  '보안 설정', ARRAY['SSH','fail2ban','보안','서버보안','인증'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','RHEL'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'openssl 실전 — 인증서 생성, 확인, 변환',
  'openssl-certificate-guide',
  '자체 서명 인증서 생성, CSR 발급, 인증서 정보 확인, PEM/PFX 형식 변환까지 openssl 핵심 명령어를 정리합니다.',
  $g1$
## 인증서 정보 확인

```bash
# 원격 서버 인증서 확인
openssl s_client -connect nodelog.kr:443 -showcerts </dev/null

# 만료일만 빠르게 확인
echo | openssl s_client -connect nodelog.kr:443 2>/dev/null | openssl x509 -noout -dates

# 로컬 인증서 파일 확인
openssl x509 -in cert.pem -noout -text

# 주요 정보만
openssl x509 -in cert.pem -noout -subject -issuer -dates

# 인증서 지문 (fingerprint)
openssl x509 -in cert.pem -noout -fingerprint -sha256
```

---

## 자체 서명 인증서 생성 (개발/테스트용)

```bash
# 개인키 + 인증서 한 번에 생성 (365일)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=KR/ST=Seoul/L=Seoul/O=MyOrg/CN=localhost"

# SAN(Subject Alternative Name) 포함 (크롬 호환)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
```

---

## CSR(Certificate Signing Request) 생성

실제 CA(Let's Encrypt, DigiCert 등)에 인증서를 요청할 때 사용합니다.

```bash
# 개인키 생성
openssl genrsa -out server.key 4096

# CSR 생성
openssl req -new -key server.key -out server.csr \
  -subj "/C=KR/ST=Seoul/O=MyCompany/CN=nodelog.kr"

# CSR 내용 확인
openssl req -in server.csr -noout -text
```

---

## 형식 변환

```bash
# PEM → DER (바이너리)
openssl x509 -in cert.pem -outform der -out cert.der

# DER → PEM
openssl x509 -in cert.der -inform der -out cert.pem

# PEM → PFX/P12 (Windows/IIS, Java Keystore용)
openssl pkcs12 -export -out cert.pfx -inkey key.pem -in cert.pem \
  -certfile chain.pem -passout pass:mypassword

# PFX → PEM
openssl pkcs12 -in cert.pfx -out cert.pem -nodes -passin pass:mypassword

# 개인키 암호 제거
openssl rsa -in encrypted.key -out decrypted.key
```

---

## 만료 일괄 모니터링 스크립트

```bash
#!/bin/bash
# cert-check.sh — 여러 서버 인증서 만료일 확인

DOMAINS=("nodelog.kr" "api.nodelog.kr" "example.com")
WARN_DAYS=30

for domain in "${DOMAINS[@]}"; do
  expiry=$(echo | openssl s_client -connect "$domain:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

  if [ -z "$expiry" ]; then
    echo "FAIL: $domain (연결 불가)"
    continue
  fi

  days=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))

  if [ "$days" -lt "$WARN_DAYS" ]; then
    echo "WARNING: $domain — ${days}일 후 만료 ($expiry)"
  else
    echo "OK: $domain — ${days}일 남음"
  fi
done
```
  $g1$,
  '보안 설정', ARRAY['openssl','인증서','TLS','SSL','보안'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','macOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

-- ⑦ 클라우드 ────────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'AWS CLI 설치·설정과 핵심 명령어 완전 가이드',
  'aws-cli-setup-and-commands',
  'AWS CLI v2 설치부터 프로파일 설정, EC2·S3·IAM·ECS 자주 쓰는 명령어까지 실무 중심으로 정리합니다.',
  $g1$
## 설치

```bash
# Linux (x86_64)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 버전 확인
aws --version
```

---

## 자격증명 설정

```bash
# 인터랙티브 설정 (Access Key, Secret, Region, 출력 형식)
aws configure

# 프로파일별 설정 (여러 계정)
aws configure --profile prod
aws configure --profile dev

# 환경변수로 임시 설정
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=ap-northeast-2
```

자격증명 파일 위치: `~/.aws/credentials`, `~/.aws/config`

---

## EC2

```bash
# 인스턴스 목록 (이름·상태·IP)
aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[Tags[?Key==`Name`].Value|[0],State.Name,PublicIpAddress]' \
  --output table

# 인스턴스 시작/중지
aws ec2 start-instances --instance-ids i-1234567890abcdef0
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# 인스턴스 타입 변경 (중지 후)
aws ec2 modify-instance-attribute \
  --instance-id i-1234567890abcdef0 \
  --instance-type '{"Value":"t3.medium"}'

# 보안 그룹 규칙 추가 (내 IP로 22번 허용)
MY_IP=$(curl -s ifconfig.me)
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp --port 22 --cidr "$MY_IP/32"
```

---

## S3

```bash
# 버킷 목록
aws s3 ls

# 파일 업로드
aws s3 cp local-file.txt s3://my-bucket/path/

# 디렉터리 동기화
aws s3 sync ./dist s3://my-bucket/static --delete

# 버킷 내 목록
aws s3 ls s3://my-bucket/ --recursive --human-readable

# 파일 다운로드
aws s3 cp s3://my-bucket/backup.tar.gz .

# Presigned URL 생성 (24시간 유효)
aws s3 presign s3://my-bucket/private-file.pdf --expires-in 86400
```

---

## IAM

```bash
# 현재 자격증명 확인
aws sts get-caller-identity

# 사용자 목록
aws iam list-users --output table

# 역할 목록
aws iam list-roles --query 'Roles[*].[RoleName,Arn]' --output table

# 정책 연결 확인
aws iam list-attached-user-policies --user-name myuser
```

---

## 유용한 옵션

```bash
# 특정 프로파일 사용
aws s3 ls --profile prod

# 출력 형식 (json/yaml/table/text)
aws ec2 describe-instances --output yaml

# 리전 지정
aws ec2 describe-instances --region us-east-1

# jq로 파싱
aws ec2 describe-instances | jq '.Reservations[].Instances[].PublicIpAddress'
```
  $g1$,
  '클라우드', ARRAY['AWS','AWS-CLI','EC2','S3','클라우드'], 'beginner', ARRAY['Ubuntu','Debian','CentOS','macOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Terraform 기초 — 인프라를 코드로 관리하기',
  'terraform-basics-infrastructure-as-code',
  'Terraform 설치부터 AWS EC2 인스턴스 프로비저닝, 상태 관리, 실무 워크플로우까지 초보자 관점으로 정리합니다.',
  $g1$
## Terraform이란?

인프라(서버, 네트워크, DB 등)를 코드(.tf 파일)로 선언하고, `terraform apply` 한 번으로 실제 클라우드 리소스를 생성·수정·삭제합니다. AWS, GCP, Azure, Kubernetes 등 모두 지원합니다.

---

## 설치

```bash
# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor \
  | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

terraform version
```

---

## 기본 구조

```
my-infra/
├── main.tf          # 리소스 정의
├── variables.tf     # 입력 변수
├── outputs.tf       # 출력 값
├── providers.tf     # 프로바이더 설정
└── terraform.tfvars # 변수 값 (git 제외)
```

---

## AWS EC2 예시

**providers.tf**
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}
```

**variables.tf**
```hcl
variable "region" {
  default = "ap-northeast-2"
}

variable "instance_type" {
  default = "t3.micro"
}
```

**main.tf**
```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-*-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}

resource "aws_security_group" "web_sg" {
  name = "web-sg"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**outputs.tf**
```hcl
output "instance_public_ip" {
  value = aws_instance.web.public_ip
}
```

---

## 워크플로우

```bash
# 초기화 (프로바이더 다운로드)
terraform init

# 실행 계획 확인 (실제로 뭐가 생성/변경/삭제되는지)
terraform plan

# 적용
terraform apply

# 특정 리소스만 적용
terraform apply -target=aws_instance.web

# 모두 삭제
terraform destroy

# 현재 상태 확인
terraform show
terraform state list
```

---

## 원격 상태 관리 (팀 협업)

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}
```

상태 파일(`terraform.tfstate`)은 반드시 원격 저장소(S3 + DynamoDB 잠금)로 관리하세요. git에 커밋하면 절대 안 됩니다.
  $g1$,
  '클라우드', ARRAY['Terraform','IaC','AWS','인프라','DevOps'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','macOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

-- ⑧ 데이터베이스 ────────────────────────────────────────────

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'PostgreSQL 인덱스 최적화 — 느린 쿼리 진단과 인덱스 전략',
  'postgresql-index-optimization',
  'EXPLAIN ANALYZE로 느린 쿼리를 찾고, 적절한 인덱스 타입을 선택하여 성능을 개선하는 방법을 실무 중심으로 정리합니다.',
  $g1$
## 느린 쿼리 찾기

```sql
-- pg_stat_statements 활성화 (postgresql.conf)
shared_preload_libraries = 'pg_stat_statements'

-- 설치 후
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 상위 10개 느린 쿼리
SELECT
  round(total_exec_time::numeric, 2) AS total_ms,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  left(query, 100) AS query_preview
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## EXPLAIN ANALYZE 읽기

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

핵심 항목:

| 항목 | 의미 |
|------|------|
| `Seq Scan` | 전체 테이블 스캔 (인덱스 없음) |
| `Index Scan` | 인덱스 사용 |
| `Bitmap Heap Scan` | 여러 인덱스 조합 |
| `actual time=0.1..5.2` | 실제 실행 시간 (ms) |
| `rows=1000` | 실제 반환 행 수 |
| `Buffers: shared hit=8` | 캐시 히트 (miss가 많으면 I/O 문제) |

---

## 인덱스 생성

```sql
-- 단일 컬럼
CREATE INDEX idx_orders_user_id ON orders (user_id);

-- 복합 인덱스 (조건 순서 중요: 선택성 높은 것 먼저)
CREATE INDEX idx_orders_user_status ON orders (user_id, status);

-- 부분 인덱스 (조건에 맞는 행만 인덱싱)
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'pending';

-- 표현식 인덱스
CREATE INDEX idx_users_email_lower ON users (lower(email));

-- 온라인 생성 (잠금 없이, 시간 오래 걸림)
CREATE INDEX CONCURRENTLY idx_posts_category ON posts (category);
```

---

## 인덱스 타입 선택

```sql
-- B-tree: 기본, 범위 쿼리 (=, <, >, BETWEEN, LIKE 'prefix%')
CREATE INDEX idx_b ON events (created_at);

-- Hash: = 조건만, 빠름
CREATE INDEX idx_h ON sessions USING HASH (session_token);

-- GIN: 배열, JSONB, 전문 검색
CREATE INDEX idx_gin ON posts USING GIN (tags);
CREATE INDEX idx_jsonb ON products USING GIN (metadata jsonb_path_ops);

-- GiST: 지리 데이터, 범위 타입
CREATE INDEX idx_gist ON locations USING GIST (point);
```

---

## 인덱스 상태 확인

```sql
-- 테이블의 인덱스 목록과 크기
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS size,
  idx_scan AS scans
FROM pg_stat_user_indexes
WHERE relname = 'orders'
ORDER BY idx_scan;

-- 사용되지 않는 인덱스 (scans = 0)
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public';
```

사용되지 않는 인덱스는 쓰기 성능을 저하시키므로 제거를 검토하세요.

---

## VACUUM과 통계 갱신

```sql
-- 통계 갱신 (플래너가 올바른 실행계획 선택)
ANALYZE orders;

-- VACUUM + ANALYZE
VACUUM ANALYZE orders;

-- 자동 VACUUM 설정 확인
SHOW autovacuum;
SELECT * FROM pg_stat_user_tables WHERE relname = 'orders';
```
  $g1$,
  '데이터베이스', ARRAY['PostgreSQL','인덱스','쿼리최적화','성능','SQL'], 'advanced', ARRAY['Ubuntu','Debian','CentOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'Redis 기초 실전 — 캐시, 세션, 메시지 큐 활용',
  'redis-basics-practical-guide',
  'Redis 설치부터 String·Hash·List·Set 자료구조 활용, 캐시 전략, TTL, pub/sub까지 실무 중심으로 정리합니다.',
  $g1$
## 설치

```bash
# Ubuntu
apt install redis-server

# 설정 파일
vim /etc/redis/redis.conf

# 원격 접근 허용 (필요시)
# bind 127.0.0.1 → bind 0.0.0.0
# requirepass yourpassword 설정 권장

systemctl enable --now redis-server

# 접속 테스트
redis-cli ping  # PONG
```

---

## 기본 명령어

```bash
redis-cli

# String
SET user:1:name "Alice"
GET user:1:name
SET counter 0
INCR counter        # 1
INCRBY counter 10   # 11
DEL user:1:name

# TTL (만료)
SET session:abc "token" EX 3600   # 3600초 후 자동 삭제
TTL session:abc                    # 남은 시간 (초)
PERSIST session:abc               # TTL 제거

# 키 조회
KEYS user:*          # 패턴 검색 (운영 환경에선 SCAN 사용)
SCAN 0 MATCH user:* COUNT 100
```

---

## Hash — 객체 저장

```bash
# 사용자 정보
HSET user:1 name "Alice" email "alice@example.com" age 30
HGET user:1 name
HGETALL user:1
HMSET user:2 name "Bob" email "bob@example.com"
HDEL user:1 age
HEXISTS user:1 email  # 1 (있음) / 0 (없음)
```

---

## List — 큐/스택

```bash
# 오른쪽에 추가 (FIFO 큐로 사용)
RPUSH tasks "job1" "job2" "job3"
LPOP tasks       # "job1" (왼쪽에서 꺼냄)
LLEN tasks       # 남은 길이
LRANGE tasks 0 -1  # 전체 조회

# 블로킹 팝 (워커 대기)
BLPOP tasks 30   # 최대 30초 대기
```

---

## Set · Sorted Set

```bash
# Set (중복 없음)
SADD tags "redis" "nosql" "cache"
SMEMBERS tags
SISMEMBER tags "redis"  # 1

# 집합 연산
SUNION tags1 tags2
SINTER tags1 tags2

# Sorted Set (점수로 정렬)
ZADD leaderboard 1500 "alice"
ZADD leaderboard 2300 "bob"
ZADD leaderboard 1800 "carol"
ZRANGE leaderboard 0 -1 WITHSCORES   # 오름차순
ZREVRANGE leaderboard 0 2             # Top 3
ZINCRBY leaderboard 100 "alice"       # 점수 증가
```

---

## 캐시 패턴

```python
# Cache-aside 패턴 (Python 예시)
import redis
import json

r = redis.Redis(host='localhost', port=6379)

def get_user(user_id):
    cache_key = f"user:{user_id}"
    cached = r.get(cache_key)

    if cached:
        return json.loads(cached)

    # DB 조회
    user = db.query(f"SELECT * FROM users WHERE id = {user_id}")

    # 캐시 저장 (1시간)
    r.setex(cache_key, 3600, json.dumps(user))
    return user
```

---

## 모니터링

```bash
# 실시간 명령 모니터링 (주의: 성능 저하)
redis-cli monitor

# 서버 정보
redis-cli info server
redis-cli info memory
redis-cli info stats

# 메모리 사용량 상위 키
redis-cli --bigkeys

# 느린 명령 로그
redis-cli slowlog get 10
```
  $g1$,
  '데이터베이스', ARRAY['Redis','캐시','NoSQL','세션','메시지큐'], 'beginner', ARRAY['Ubuntu','Debian','CentOS'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.engineer_guides (title, slug, summary, content, category, tags, difficulty, os_compat, author)
VALUES (
  'MySQL/MariaDB 백업 · 복원 완전 가이드',
  'mysql-backup-restore-guide',
  'mysqldump, mysqlpump, xtrabackup을 활용한 논리·물리 백업과 복원 절차, 자동화 스크립트까지 정리합니다.',
  $g1$
## mysqldump — 논리 백업

```bash
# 단일 DB 백업
mysqldump -u root -p mydb > mydb_backup.sql

# 여러 DB
mysqldump -u root -p --databases mydb testdb > multi_backup.sql

# 전체 DB
mysqldump -u root -p --all-databases > all_backup.sql

# 압축 백업 (gzip)
mysqldump -u root -p mydb | gzip > mydb_$(date +%Y%m%d).sql.gz

# 구조만 (데이터 제외)
mysqldump -u root -p --no-data mydb > schema_only.sql

# 데이터만 (구조 제외)
mysqldump -u root -p --no-create-info mydb > data_only.sql
```

---

## 복원

```bash
# SQL 파일로 복원
mysql -u root -p mydb < mydb_backup.sql

# 압축 파일 복원
gunzip < mydb_backup.sql.gz | mysql -u root -p mydb

# DB가 없으면 먼저 생성
mysql -u root -p -e "CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p mydb < mydb_backup.sql
```

---

## 백업 자동화 스크립트

```bash
#!/bin/bash
# /usr/local/bin/mysql-backup.sh

DB_USER="backup_user"
DB_PASS="your_password"
BACKUP_DIR="/var/backups/mysql"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

# 모든 DB 목록
DATABASES=$(mysql -u"$DB_USER" -p"$DB_PASS" -e "SHOW DATABASES;" \
  | grep -Ev "Database|information_schema|performance_schema|sys")

for DB in $DATABASES; do
  FILENAME="${BACKUP_DIR}/${DB}_$(date +%Y%m%d_%H%M%S).sql.gz"
  mysqldump -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    "$DB" | gzip > "$FILENAME"
  echo "Backed up: $FILENAME"
done

# 오래된 백업 삭제
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup complete: $(date)"
```

```bash
chmod +x /usr/local/bin/mysql-backup.sh

# 매일 새벽 3시 실행
echo "0 3 * * * root /usr/local/bin/mysql-backup.sh >> /var/log/mysql-backup.log 2>&1" \
  > /etc/cron.d/mysql-backup
```

---

## 중요 옵션

| 옵션 | 용도 |
|------|------|
| `--single-transaction` | InnoDB 일관성 있는 스냅샷 (잠금 없음) |
| `--lock-tables` | MyISAM 테이블 잠금 (--single-transaction과 같이 쓰면 무효) |
| `--routines` | 저장 프로시저, 함수 포함 |
| `--triggers` | 트리거 포함 |
| `--events` | 이벤트 스케줄러 포함 |
| `--hex-blob` | BLOB 데이터를 16진수로 (깨짐 방지) |

---

## Point-in-Time Recovery (바이너리 로그)

```sql
-- 바이너리 로그 활성화 (my.cnf)
-- log_bin = /var/log/mysql/mysql-bin.log
-- binlog_format = ROW

-- 현재 바이너리 로그 위치 확인
SHOW MASTER STATUS;
```

```bash
# 특정 시점까지 복원
mysqlbinlog \
  --start-datetime="2024-01-15 10:00:00" \
  --stop-datetime="2024-01-15 11:30:00" \
  /var/log/mysql/mysql-bin.000001 | mysql -u root -p mydb
```
  $g1$,
  '데이터베이스', ARRAY['MySQL','MariaDB','백업','복원','DBA'], 'intermediate', ARRAY['Ubuntu','Debian','CentOS','RHEL'], 'Nodelog'
) ON CONFLICT (slug) DO NOTHING;
