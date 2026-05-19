import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const guides = [

/* ── 1. MySQL 접속 오류 ─────────────────────────────── */
{
  title: 'MySQL/MariaDB 접속 오류 완전 해결 — ERROR 1045 · Can\'t connect · socket',
  slug: 'mysql-connection-error-fix',
  summary: 'ERROR 1045 (28000): Access denied, Can\'t connect to MySQL server on localhost, socket 파일 없음 등 MySQL·MariaDB 접속 오류 유형별 원인과 해결법.',
  category: '트러블슈팅',
  tags: ['MySQL', 'MariaDB', 'ERROR 1045', 'Access denied', '트러블슈팅', 'socket', '데이터베이스'],
  difficulty: 'beginner',
  os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `MySQL·MariaDB 접속 오류는 크게 세 가지입니다. **오류 메시지를 먼저 확인**하세요.

| 오류 메시지 | 원인 |
|---|---|
| \`ERROR 1045 (28000): Access denied\` | 비밀번호·사용자·호스트 불일치 |
| \`Can't connect to MySQL server on 'localhost'\` | MySQL 데몬 미실행 또는 포트 차단 |
| \`Can't connect to local MySQL server through socket\` | 소켓 파일 경로 불일치 |
| \`Host 'x.x.x.x' is not allowed to connect\` | 원격 접속 권한 없음 |

---

## 1. ERROR 1045 — Access denied

### 비밀번호 확인

\`\`\`bash
# root 비밀번호로 접속 시도
mysql -u root -p

# 특정 사용자
mysql -u myuser -p mydb
\`\`\`

### 비밀번호를 잊어버린 경우 — 초기화

\`\`\`bash
# MySQL 서비스 중지
sudo systemctl stop mysql

# 인증 없이 시작
sudo mysqld_safe --skip-grant-tables &

# 접속 후 비밀번호 변경
mysql -u root
\`\`\`

\`\`\`sql
-- MySQL 5.7 이하
UPDATE mysql.user SET authentication_string=PASSWORD('새비밀번호') WHERE User='root';
FLUSH PRIVILEGES;

-- MySQL 8.0+
ALTER USER 'root'@'localhost' IDENTIFIED BY '새비밀번호';
FLUSH PRIVILEGES;
EXIT;
\`\`\`

\`\`\`bash
# 정상 재시작
sudo systemctl restart mysql
\`\`\`

### 사용자·권한 확인

\`\`\`sql
-- root로 접속 후
SELECT user, host, authentication_string FROM mysql.user;

-- 특정 사용자에게 권한 부여
GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'localhost' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
\`\`\`

---

## 2. Can't connect to MySQL server — 데몬 미실행

\`\`\`bash
# 서비스 상태 확인
sudo systemctl status mysql      # Ubuntu/Debian
sudo systemctl status mariadb    # MariaDB

# 실행 중이지 않으면 시작
sudo systemctl start mysql
sudo systemctl enable mysql

# 실제 포트 리스닝 확인
sudo ss -tlnp | grep 3306
\`\`\`

\`\`\`bash
# 오류 로그 확인 (시작 실패 원인)
sudo journalctl -u mysql -n 50
sudo tail -50 /var/log/mysql/error.log
\`\`\`

---

## 3. socket 파일 없음·경로 불일치

**오류**: \`Can't connect to local MySQL server through socket '/var/run/mysqld/mysqld.sock'\`

\`\`\`bash
# 실제 소켓 파일 위치 찾기
sudo find /var/run /tmp -name "*.sock" 2>/dev/null
sudo find /run -name "mysqld.sock" 2>/dev/null

# MySQL 설정에서 소켓 경로 확인
sudo grep -r "socket" /etc/mysql/
\`\`\`

소켓 경로가 다르면 접속 시 명시합니다:

\`\`\`bash
mysql -u root -p --socket=/tmp/mysql.sock
\`\`\`

또는 \`~/.my.cnf\` 에 기본 소켓 경로 설정:

\`\`\`ini
[client]
socket = /tmp/mysql.sock
\`\`\`

---

## 4. 원격 접속 허용 안 됨

**오류**: \`Host 'x.x.x.x' is not allowed to connect to this MySQL server\`

\`\`\`sql
-- root로 접속 후 원격 허용 계정 생성
CREATE USER 'myuser'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON mydb.* TO 'myuser'@'%';
FLUSH PRIVILEGES;
\`\`\`

\`\`\`bash
# MySQL이 127.0.0.1만 리스닝하는지 확인
sudo grep -r "bind-address" /etc/mysql/
# bind-address = 127.0.0.1 → 0.0.0.0 으로 변경 후 재시작
sudo systemctl restart mysql
\`\`\`

> 원격 접속을 열면 방화벽(UFW)에서 3306 포트를 신뢰 IP만 허용하도록 설정하세요.
> \`sudo ufw allow from 신뢰IP to any port 3306\`

---

## 빠른 진단

\`\`\`bash
sudo systemctl status mysql          # 서비스 상태
sudo ss -tlnp | grep 3306            # 포트 리스닝
sudo tail -30 /var/log/mysql/error.log  # 오류 로그
mysql -u root -p --verbose           # verbose 접속
\`\`\``,
},

/* ── 2. Docker 컨테이너 재시작 반복 ──────────────────── */
{
  title: 'Docker 컨테이너 계속 재시작될 때 — Exit code별 원인과 해결',
  slug: 'docker-container-keeps-restarting',
  summary: 'docker ps에서 Restarting 또는 Exited 상태가 반복될 때 로그·exit code·restart policy를 확인해 원인을 진단하고 해결하는 가이드.',
  category: '트러블슈팅',
  tags: ['Docker', 'Restarting', 'Exited', 'exit code', '트러블슈팅', 'restart policy', 'container'],
  difficulty: 'beginner',
  os_compat: ['Ubuntu', 'Debian', 'CentOS'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `컨테이너가 계속 재시작되거나 Exited 상태로 멈춘다면 **로그와 exit code**로 원인을 바로 알 수 있습니다.

---

## Step 1 — 상태와 exit code 확인

\`\`\`bash
# 모든 컨테이너 상태 (중지된 것 포함)
docker ps -a

# 출력 예
# CONTAINER ID  IMAGE    STATUS                     NAMES
# abc123        myapp    Restarting (1) 5s ago      myapp
# def456        nginx    Exited (137) 2 minutes ago nginx
#                        ↑ exit code
\`\`\`

| Exit code | 의미 | 주요 원인 |
|---|---|---|
| \`0\` | 정상 종료 | 컨테이너 작업이 끝남 (의도된 종료) |
| \`1\` | 앱 오류 | 애플리케이션 런타임 에러 |
| \`137\` | SIGKILL | OOM Killer 또는 \`docker kill\` |
| \`139\` | Segfault | 앱 메모리 충돌 |
| \`143\` | SIGTERM | \`docker stop\` 이후 정상 종료 |

---

## Step 2 — 컨테이너 로그 확인

\`\`\`bash
# 마지막 100줄 로그
docker logs --tail 100 컨테이너명

# 실시간 로그 (재시작 반복 중 확인)
docker logs -f 컨테이너명

# 타임스탬프 포함
docker logs -t --tail 50 컨테이너명

# 중지된 컨테이너 로그도 볼 수 있음
docker logs 컨테이너ID
\`\`\`

---

## Exit code 1 — 앱 크래시

로그에서 에러 메시지를 확인합니다.

\`\`\`bash
docker logs 컨테이너명 2>&1 | tail -30
\`\`\`

주요 원인:
- **환경변수 누락**: \`Error: DATABASE_URL is not defined\`
- **포트 충돌**: \`Error: listen EADDRINUSE :::3000\`
- **파일/설정 없음**: \`No such file or directory\`

\`\`\`bash
# 환경변수 확인
docker inspect 컨테이너명 | grep -A 20 '"Env"'

# 컨테이너 안에서 직접 확인 (일회성 실행)
docker run --rm -it --env-file .env 이미지명 /bin/sh
\`\`\`

---

## Exit code 137 — OOM 강제 종료

\`\`\`bash
# OOM으로 죽었는지 확인
docker inspect 컨테이너명 | grep -i oom
# "OOMKilled": true 이면 OOM

# 메모리 사용량 확인
docker stats --no-stream 컨테이너명
\`\`\`

\`\`\`bash
# 메모리 제한 늘리기 (docker run)
docker run -m 512m 이미지명

# docker-compose.yml
# services:
#   myapp:
#     mem_limit: 512m
\`\`\`

---

## restart policy 확인·변경

\`\`\`bash
# 현재 restart policy 확인
docker inspect 컨테이너명 | grep -A 3 'RestartPolicy'
\`\`\`

| Policy | 동작 |
|---|---|
| \`no\` | 재시작 안 함 (기본값) |
| \`always\` | 항상 재시작 (exit code 무관) |
| \`on-failure\` | 비정상 종료(non-0)만 재시작 |
| \`unless-stopped\` | 수동 중지 전까지 항상 재시작 |

\`\`\`bash
# 재시작 반복이 문제라면 policy를 on-failure로 변경
docker update --restart=on-failure:5 컨테이너명
# 5회 시도 후 중지

# 완전히 중지
docker update --restart=no 컨테이너명
docker stop 컨테이너명
\`\`\`

---

## 디버깅 — 컨테이너를 수동으로 시작

\`\`\`bash
# entrypoint 무시하고 쉘로 진입 (원인 직접 파악)
docker run --rm -it --entrypoint /bin/sh 이미지명

# 기존 컨테이너 설정 그대로 쉘 진입
docker run --rm -it \
  $(docker inspect 컨테이너명 --format '{{range .Config.Env}}-e {{.}} {{end}}') \
  --entrypoint /bin/sh \
  이미지명
\`\`\``,
},

/* ── 3. SSL 인증서 오류·갱신 실패 ───────────────────── */
{
  title: 'SSL 인증서 만료·갱신 실패 해결 — certbot renew 오류 완전 정리',
  slug: 'ssl-certificate-renewal-fix',
  summary: 'NET::ERR_CERT_DATE_INVALID, certbot renew 실패, 포트 80 차단, Nginx reload 실패 등 Let\'s Encrypt SSL 인증서 갱신 오류를 단계별로 해결하는 가이드.',
  category: '트러블슈팅',
  tags: ['SSL', 'certbot', 'Let\'s Encrypt', '인증서 갱신', '트러블슈팅', 'HTTPS', 'Nginx'],
  difficulty: 'beginner',
  os_compat: ['Ubuntu', 'Debian'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `브라우저에 \`NET::ERR_CERT_DATE_INVALID\` 또는 \`Your connection is not private\` 가 뜬다면 SSL 인증서가 만료된 것입니다.

---

## 현재 인증서 만료일 확인

\`\`\`bash
# 도메인 인증서 만료일 확인 (외부에서)
echo | openssl s_client -connect 도메인:443 2>/dev/null | openssl x509 -noout -dates

# 로컬 certbot 인증서 목록
sudo certbot certificates
\`\`\`

---

## 즉시 갱신 시도

\`\`\`bash
sudo certbot renew --dry-run    # 테스트 (실제 갱신 안 함)
sudo certbot renew              # 실제 갱신
\`\`\`

성공 시:
\`\`\`
Congratulations, all renewals succeeded
\`\`\`

실패 시 아래 원인별로 확인합니다.

---

## 원인 1 — 포트 80이 막혀 있음

Let's Encrypt는 HTTP-01 챌린지를 위해 **포트 80이 반드시 열려 있어야** 합니다.

\`\`\`bash
# 포트 80 리스닝 확인
sudo ss -tlnp | grep :80

# UFW 방화벽 확인
sudo ufw status | grep 80

# 없으면 허용
sudo ufw allow http
\`\`\`

\`\`\`bash
# Nginx가 실행 중인지 확인 (standalone 모드는 중지 필요)
sudo systemctl status nginx
\`\`\`

---

## 원인 2 — Nginx/Apache 설정 오류로 플러그인 실패

\`\`\`bash
# Nginx 설정 검증
sudo nginx -t

# 갱신 시 웹서버 플러그인 명시
sudo certbot renew --nginx       # Nginx 사용 시
sudo certbot renew --apache      # Apache 사용 시

# standalone 모드 (웹서버를 잠깐 중지)
sudo systemctl stop nginx
sudo certbot renew --standalone
sudo systemctl start nginx
\`\`\`

---

## 원인 3 — 도메인 DNS가 서버를 가리키지 않음

\`\`\`bash
# 도메인이 현재 서버 IP를 가리키는지 확인
dig +short 도메인
curl -s ifconfig.me   # 서버 공인 IP
\`\`\`

두 값이 다르면 DNS 설정 문제입니다. DNS가 맞다면 전파 대기(최대 48시간) 후 재시도합니다.

---

## 원인 4 — Rate limit 초과

Let's Encrypt는 도메인당 주 5회 발급 제한이 있습니다.

\`\`\`bash
# 갱신 로그 확인
sudo tail -50 /var/log/letsencrypt/letsencrypt.log | grep -i "rate\|limit"
\`\`\`

Rate limit에 걸렸다면 **7일 대기** 후 재시도하거나, 스테이징 서버로 테스트합니다:

\`\`\`bash
sudo certbot renew --dry-run --staging
\`\`\`

---

## 자동 갱신 설정 확인

\`\`\`bash
# 자동 갱신 타이머 상태 확인
sudo systemctl status certbot.timer
sudo systemctl list-timers | grep certbot

# 타이머가 없으면 cron 확인
sudo crontab -l | grep certbot
cat /etc/cron.d/certbot
\`\`\`

\`\`\`bash
# 자동 갱신 cron이 없으면 추가
echo "0 3 * * * root certbot renew --quiet" | sudo tee /etc/cron.d/certbot
\`\`\`

---

## 갱신 후 Nginx 반영

\`\`\`bash
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

갱신 후에도 브라우저 캐시가 남아 있을 수 있습니다. \`Ctrl+Shift+R\` 로 강제 새로고침하거나 시크릿 창으로 확인하세요.`,
},

/* ── 4. Too many open files ──────────────────────────── */
{
  title: 'Too many open files — ulimit 파일 디스크립터 한계 해결',
  slug: 'too-many-open-files-fix',
  summary: 'EMFILE: too many open files, accept4() failed (24: Too many open files) 등 파일 디스크립터 한계 오류를 ulimit, limits.conf, systemd LimitNOFILE로 해결하는 가이드.',
  category: '트러블슈팅',
  tags: ['ulimit', 'Too many open files', 'EMFILE', 'file descriptor', '트러블슈팅', 'systemd', 'limits.conf'],
  difficulty: 'intermediate',
  os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `\`Too many open files\` 오류는 프로세스가 열 수 있는 파일 디스크립터(fd) 수의 한계에 도달했을 때 발생합니다. 소켓·파이프·실제 파일 모두 fd를 사용합니다.

---

## 현재 한계 확인

\`\`\`bash
# 현재 쉘의 soft/hard 한계
ulimit -Sn    # soft limit (실제 제한)
ulimit -Hn    # hard limit (올릴 수 있는 최대)

# 시스템 전체 최대값
cat /proc/sys/fs/file-max
sysctl fs.file-max
\`\`\`

\`\`\`bash
# 특정 프로세스의 현재 fd 사용량
ls /proc/PID/fd | wc -l

# fd 수 많이 쓰는 프로세스 TOP 10
sudo lsof 2>/dev/null | awk '{print \$2}' | sort | uniq -c | sort -rn | head -10
\`\`\`

---

## 즉시 해결 — 현재 세션 한계 올리기

\`\`\`bash
# 현재 쉘에서만 적용 (재시작 시 초기화)
ulimit -n 65535

# 확인
ulimit -n
\`\`\`

---

## 영구 해결 1 — /etc/security/limits.conf

\`\`\`bash
sudo nano /etc/security/limits.conf
\`\`\`

\`\`\`ini
# 맨 아래에 추가
*         soft    nofile    65535
*         hard    nofile    65535
root      soft    nofile    65535
root      hard    nofile    65535

# 특정 사용자만 적용 시
deploy    soft    nofile    65535
deploy    hard    nofile    65535
\`\`\`

\`\`\`bash
# PAM limits 모듈 활성화 확인
grep "pam_limits" /etc/pam.d/common-session
# 없으면 추가
echo "session required pam_limits.so" | sudo tee -a /etc/pam.d/common-session
\`\`\`

**로그아웃 후 재접속**해야 적용됩니다.

---

## 영구 해결 2 — systemd 서비스 (권장)

systemd로 관리되는 서비스는 limits.conf가 적용되지 않습니다. 서비스 파일에 직접 설정합니다.

\`\`\`bash
# 서비스 override 파일 생성
sudo systemctl edit nginx    # 또는 해당 서비스명
\`\`\`

\`\`\`ini
[Service]
LimitNOFILE=65535
\`\`\`

\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl restart nginx

# 적용 확인
sudo cat /proc/$(pgrep nginx | head -1)/limits | grep "open files"
\`\`\`

---

## 영구 해결 3 — 시스템 전체 커널 파라미터

\`\`\`bash
# 즉시 적용
sudo sysctl -w fs.file-max=2097152

# 영구 적용
echo "fs.file-max = 2097152" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
\`\`\`

---

## Nginx 전용 설정

Nginx는 \`nginx.conf\` 에서도 직접 설정할 수 있습니다.

\`\`\`nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
  worker_connections 4096;
}
\`\`\`

\`\`\`bash
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

---

## 근본 원인 — fd 누수 확인

한계를 올려도 계속 오류가 난다면 **fd 누수(leak)** 가 있을 수 있습니다.

\`\`\`bash
# 프로세스가 열고 있는 fd 목록 확인
sudo lsof -p PID | head -50

# fd 수 변화 모니터링 (10초 간격)
watch -n 10 "ls /proc/PID/fd | wc -l"
\`\`\`

fd 수가 계속 증가하면 애플리케이션 코드에서 파일·소켓을 닫지 않는 버그입니다.`,
},

/* ── 5. Git push rejected ─────────────────────────────── */
{
  title: 'git push rejected 완전 해결 — non-fast-forward · protected branch · pre-receive hook',
  slug: 'git-push-rejected-fix',
  summary: 'Updates were rejected, remote rejected, pre-receive hook declined 등 git push 실패 유형별 원인을 파악하고 안전하게 해결하는 가이드.',
  category: '트러블슈팅',
  tags: ['Git', 'push rejected', 'non-fast-forward', 'protected branch', '트러블슈팅', 'rebase', 'merge'],
  difficulty: 'beginner',
  os_compat: ['Ubuntu', 'Debian', 'macOS', 'Windows'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `\`git push\` 가 거부될 때 나오는 메시지로 원인을 특정할 수 있습니다.

---

## 오류 유형별 빠른 찾기

| 오류 메시지 | 원인 |
|---|---|
| \`Updates were rejected because the remote contains work\` | 원격에 내 로컬에 없는 커밋 존재 |
| \`Updates were rejected because the tip of your current branch is behind\` | 원격보다 로컬이 뒤처짐 |
| \`remote: error: GH006: Protected branch update failed\` | GitHub 보호 브랜치 |
| \`remote rejected ... pre-receive hook declined\` | 서버 훅 또는 보호 규칙 |

---

## 원인 1 — non-fast-forward (가장 흔함)

원격에 다른 사람이 커밋을 push 한 상태에서 내 push 가 충돌합니다.

\`\`\`bash
# 원격 상태 확인
git fetch origin
git log --oneline HEAD..origin/main   # 원격에만 있는 커밋
git log --oneline origin/main..HEAD   # 내 로컬에만 있는 커밋
\`\`\`

### 방법 A: rebase (권장 — 커밋 히스토리 깔끔)

\`\`\`bash
git fetch origin
git rebase origin/main

# 충돌이 없으면 바로 push 가능
git push origin main
\`\`\`

충돌 발생 시:

\`\`\`bash
# 충돌 파일 수정 후
git add 충돌파일
git rebase --continue

# 포기하고 되돌리기
git rebase --abort
\`\`\`

### 방법 B: merge

\`\`\`bash
git fetch origin
git merge origin/main
git push origin main
\`\`\`

### 방법 C: pull --rebase (한 번에)

\`\`\`bash
git pull --rebase origin main
git push origin main
\`\`\`

---

## 원인 2 — GitHub Protected Branch

\`\`\`bash
# 오류 예시
# remote: error: GH006: Protected branch update failed
# remote: error: Required status check "CI" is failing.
\`\`\`

직접 push가 막혀 있습니다. 해결 방법:

1. **Pull Request로 병합** (정상적인 방법)
2. **GitHub 설정에서 보호 해제** (관리자 권한 필요)
   - Repository → Settings → Branches → Branch protection rules

> force push로 우회하는 것은 팀 작업 중에 타인의 커밋을 날릴 위험이 있습니다. PR 방식을 사용하세요.

---

## 원인 3 — 원격 브랜치와 현재 브랜치 이름 불일치

\`\`\`bash
# 현재 브랜치 확인
git branch

# 원격 브랜치 목록
git branch -r

# 브랜치 명시 push
git push origin 로컬브랜치명:원격브랜치명

# 예: feature/login → origin의 feature/login
git push origin feature/login
\`\`\`

---

## 원인 4 — 원격 저장소가 bare가 아닌 경우

자체 호스팅 git 서버에서 원격 브랜치가 현재 checked out 상태이면 push를 거부합니다.

\`\`\`bash
# 원격 서버에서 실행
git config --bool receive.denyCurrentBranch false

# 또는 bare 저장소로 설정
git config receive.denyCurrentBranch updateInstead
\`\`\`

---

## 원인 5 — 대용량 파일이 포함된 경우

\`\`\`bash
# 오류 예시
# remote: error: File bigfile.zip is 120.00 MB; this exceeds GitHub's file size limit of 100.00 MB

# 해당 커밋에서 파일 제거
git log --oneline -5
git show --stat HEAD | grep 큰파일

# 마지막 커밋에서 파일만 제거
git rm --cached 큰파일.zip
echo "큰파일.zip" >> .gitignore
git commit --amend --no-edit
\`\`\`

대용량 파일은 Git LFS를 사용하세요:

\`\`\`bash
git lfs install
git lfs track "*.zip"
git add .gitattributes
\`\`\`

---

## 정리

| 상황 | 해결 |
|---|---|
| 원격에 새 커밋 있음 | \`git pull --rebase\` 후 push |
| Protected branch | PR 생성 |
| 브랜치명 불일치 | \`git push origin 로컬:원격\` 명시 |
| 대용량 파일 | \`git rm --cached\` 후 amend |`,
},

];

let ok = 0;
for (const guide of guides) {
  const { error } = await supabase.from('engineer_guides').insert(guide);
  if (error) console.error(`FAIL [${guide.slug}]:`, error.message);
  else { console.log(`OK: ${guide.slug}`); ok++; }
}
console.log(`\n${ok}/${guides.length} guides inserted.`);
