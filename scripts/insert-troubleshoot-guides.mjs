import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const guides = [
  {
    title: 'SSH 접속 안 될 때 — Connection refused · Permission denied 원인별 완전 해결',
    slug: 'ssh-connection-troubleshoot',
    summary: 'ssh: connect to host port 22: Connection refused, Permission denied (publickey) 등 SSH 접속 오류 유형별 원인을 빠르게 특정하고 해결하는 트러블슈팅 가이드.',
    category: '네트워킹 / 서버',
    tags: ['SSH', 'Connection refused', 'Permission denied', '트러블슈팅', '포트22', '방화벽'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
    author: 'Nodelog',
    status: 'published',
    views: 0,
    content: `SSH 접속이 안 될 때 나오는 오류는 크게 세 가지입니다. **오류 메시지를 먼저 확인**하면 원인을 빠르게 좁힐 수 있습니다.

| 오류 메시지 | 원인 |
|---|---|
| \`Connection refused\` | SSH 데몬 미실행 또는 방화벽이 포트 차단 |
| \`Connection timed out\` | 방화벽이 패킷 자체를 드롭 (응답 없음) |
| \`Permission denied (publickey)\` | 키 불일치, authorized_keys 권한 문제 |
| \`Host key verification failed\` | 서버 fingerprint 변경 (재설치 등) |

---

## 1. Connection refused — SSH 데몬 확인

\`\`\`bash
# 서버에 다른 방법으로 접근 후 실행 (콘솔/VNC)
sudo systemctl status ssh        # Ubuntu/Debian
sudo systemctl status sshd       # CentOS/RHEL

# 중지 상태라면 시작
sudo systemctl start ssh
sudo systemctl enable ssh

# 실제 리스닝 포트 확인
sudo ss -tlnp | grep ssh
# 예상 출력: LISTEN  0  128  0.0.0.0:22  ...
\`\`\`

> SSH 데몬이 실행 중인데 refused가 뜬다면 포트가 22가 아닐 수 있습니다.
> \`sudo sshd -T | grep port\` 로 실제 포트를 확인하세요.

---

## 2. Connection refused / timed out — 방화벽 확인

\`\`\`bash
# UFW (Ubuntu 기본)
sudo ufw status
# SSH 허용 안 되어 있으면
sudo ufw allow ssh    # 22번 포트

# firewalld (CentOS/RHEL)
sudo firewall-cmd --list-services
sudo firewall-cmd --add-service=ssh --permanent && sudo firewall-cmd --reload

# iptables 직접 확인
sudo iptables -L INPUT -n | grep 22
\`\`\`

### 클라우드 보안 그룹 확인

AWS, GCP, Azure 사용 중이라면 **인스턴스 보안 그룹/방화벽 규칙**에서 인바운드 TCP 22번이 열려 있는지 확인하세요. OS 방화벽보다 클라우드 레벨 규칙이 먼저 적용됩니다.

\`\`\`bash
# 내 공인 IP 확인 (보안 그룹에 등록할 때)
curl -s ifconfig.me
\`\`\`

---

## 3. Permission denied (publickey) — 키 인증 실패

### 원인 1: 잘못된 키 파일 지정

\`\`\`bash
# -i 로 키 파일 명시
ssh -i ~/.ssh/id_ed25519 user@서버IP

# 어떤 키를 시도하는지 verbose로 확인
ssh -vvv user@서버IP 2>&1 | grep "Offering\|Trying\|identity"
\`\`\`

### 원인 2: authorized_keys 권한 문제

\`\`\`bash
# 서버에서 실행
ls -la ~/.ssh/
# .ssh 디렉터리: 700, authorized_keys: 600 이어야 함

# 잘못된 경우 수정
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 소유자 확인 (root 소유면 안 됨)
ls -la ~/.ssh/authorized_keys
# 올바른 예: -rw------- 1 deploy deploy ...
\`\`\`

### 원인 3: 공개키가 등록되지 않음

\`\`\`bash
# 내 공개키 확인
cat ~/.ssh/id_ed25519.pub

# 서버의 authorized_keys 확인
cat ~/.ssh/authorized_keys

# 공개키 등록
echo "공개키_한줄_전체" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
\`\`\`

### 원인 4: sshd_config 에서 키 인증 비활성화

\`\`\`bash
sudo grep -E "PubkeyAuthentication|AuthorizedKeysFile" /etc/ssh/sshd_config
# PubkeyAuthentication yes 이어야 함

# 설정 변경 후 반드시 재시작
sudo systemctl reload ssh
\`\`\`

---

## 4. Host key verification failed — fingerprint 불일치

서버를 재설치하거나 IP가 재할당되면 나타납니다.

\`\`\`bash
# 에러 메시지
# WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!

# known_hosts 에서 해당 항목 삭제
ssh-keygen -R 서버IP

# 또는 특정 라인만 삭제
ssh-keygen -R [서버IP]:22

# 이후 재접속 시 yes 입력
ssh user@서버IP
\`\`\`

> 정말 재설치한 서버가 맞다면 안전합니다. 그러나 예상치 못한 fingerprint 변경은 MITM 공격 가능성이 있으므로 확인 후 삭제하세요.

---

## 5. 빠른 진단 체크리스트

\`\`\`bash
# 로컬에서 실행 — 순서대로 확인
ssh -v user@서버IP 2>&1 | head -30   # verbose 로그
telnet 서버IP 22                       # 포트 연결 테스트
curl -v telnet://서버IP:22             # telnet 없을 때 대안
nc -zv 서버IP 22                       # netcat 포트 확인
\`\`\`

\`\`\`bash
# 서버에서 실행 (콘솔 접근 가능한 경우)
sudo systemctl is-active ssh           # 데몬 상태
sudo ss -tlnp | grep :22               # 포트 리스닝
sudo ufw status                        # 방화벽
sudo tail -20 /var/log/auth.log        # 인증 로그 (Ubuntu)
sudo tail -20 /var/log/secure          # 인증 로그 (CentOS)
\`\`\`

---

## 정리

| 증상 | 확인 순서 |
|---|---|
| Connection refused | ① SSH 데몬 실행 → ② OS 방화벽 → ③ 클라우드 보안 그룹 |
| Connection timed out | ① 클라우드 보안 그룹 → ② OS 방화벽 (DROP 규칙) |
| Permission denied (publickey) | ① 키 파일 경로 → ② .ssh 권한 → ③ authorized_keys 등록 → ④ sshd_config |
| Host key failed | ssh-keygen -R 서버IP 후 재접속 |`,
  },
  {
    title: 'Nginx 502 Bad Gateway 완전 해결 — upstream 오류 원인 6가지',
    slug: 'nginx-502-bad-gateway-fix',
    summary: 'Nginx 502 Bad Gateway가 뜨는 6가지 원인 (upstream 미실행, 소켓 경로 불일치, PHP-FPM 크래시, 타임아웃, 권한, 메모리)을 로그 기반으로 빠르게 진단하고 해결하는 가이드.',
    category: '네트워킹 / 서버',
    tags: ['Nginx', '502', 'Bad Gateway', '트러블슈팅', 'upstream', 'PHP-FPM', 'proxy'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    status: 'published',
    views: 0,
    content: `502 Bad Gateway는 Nginx가 upstream(백엔드 서버)으로부터 유효한 응답을 받지 못했을 때 발생합니다. **Nginx 자체 문제가 아니라 항상 백엔드 문제**입니다.

---

## 먼저 로그 확인

\`\`\`bash
# Nginx 에러 로그 (가장 먼저)
sudo tail -50 /var/log/nginx/error.log

# 특정 도메인 로그가 따로 있다면
sudo tail -50 /var/log/nginx/도메인.error.log
\`\`\`

로그에 나온 메시지로 아래 원인 중 해당 항목으로 바로 이동하세요.

---

## 원인 1 — upstream 서버가 실행 중이지 않음

**로그 패턴**: \`connect() failed (111: Connection refused)\`

\`\`\`bash
# Node.js 앱인 경우
sudo systemctl status myapp
pm2 status

# PHP-FPM 인 경우
sudo systemctl status php8.2-fpm    # 버전 확인 후

# Gunicorn (Python) 인 경우
sudo systemctl status gunicorn

# 실제 포트가 열려 있는지 확인
sudo ss -tlnp | grep 3000   # 포트 번호에 맞게
\`\`\`

→ 미실행 상태라면 시작 후 즉시 해결됩니다.

---

## 원인 2 — upstream 주소/포트 불일치

**로그 패턴**: \`connect() failed (111: Connection refused) while connecting to upstream\`

\`\`\`bash
# Nginx 설정에서 upstream 주소 확인
sudo grep -rn "proxy_pass\|fastcgi_pass\|uwsgi_pass" /etc/nginx/
\`\`\`

\`\`\`nginx
# 예: proxy_pass가 3000인데 앱은 8080으로 실행 중
proxy_pass http://127.0.0.1:3000;   # ← 실제 앱 포트와 일치해야 함
\`\`\`

\`\`\`bash
# 앱이 실제로 어느 포트에서 듣는지 확인
sudo ss -tlnp | grep LISTEN
\`\`\`

---

## 원인 3 — PHP-FPM 소켓 경로 불일치

**로그 패턴**: \`connect() to unix:/run/php/php8.1-fpm.sock failed (2: No such file or directory)\`

\`\`\`bash
# 실제 소켓 파일 위치 확인
sudo find /run/php/ -name "*.sock" 2>/dev/null
ls /var/run/php/

# PHP-FPM pool 설정에서 실제 소켓 경로 확인
sudo grep "listen" /etc/php/8.2/fpm/pool.d/www.conf
\`\`\`

Nginx 설정과 실제 소켓 경로를 일치시킵니다:

\`\`\`nginx
# /etc/nginx/sites-available/mysite
fastcgi_pass unix:/run/php/php8.2-fpm.sock;   # 실제 소켓 경로로 수정
\`\`\`

\`\`\`bash
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

---

## 원인 4 — upstream 타임아웃

**로그 패턴**: \`upstream timed out (110: Connection timed out)\`

백엔드 처리 시간이 Nginx 타임아웃보다 길 때 발생합니다.

\`\`\`nginx
# /etc/nginx/conf.d/timeout.conf 또는 server 블록 안
proxy_connect_timeout  60s;
proxy_send_timeout     120s;
proxy_read_timeout     120s;   # 이 값을 늘려야 함
\`\`\`

\`\`\`bash
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

> 타임아웃을 무조건 늘리기 전에 **백엔드가 왜 느린지** 먼저 파악하세요. 쿼리 최적화나 캐싱이 근본 해결책입니다.

---

## 원인 5 — 소켓 파일 권한 문제

**로그 패턴**: \`connect() to unix:/run/app.sock failed (13: Permission denied)\`

\`\`\`bash
# 소켓 파일 소유자·권한 확인
ls -la /run/app.sock

# Nginx 워커 프로세스 실행 유저 확인
sudo grep "^user" /etc/nginx/nginx.conf
# 보통 www-data 또는 nginx

# 소켓 파일 권한 수정
sudo chown www-data:www-data /run/app.sock
# 또는 그룹 쓰기 허용
sudo chmod 660 /run/app.sock
\`\`\`

---

## 원인 6 — 서버 메모리/리소스 부족으로 upstream 크래시

**확인 방법**:

\`\`\`bash
# OOM Killer 로그 확인
sudo dmesg | grep -i "oom\|killed process" | tail -10
sudo journalctl -k | grep -i oom | tail -10

# 현재 메모리 상태
free -h
\`\`\`

upstream 프로세스가 OOM으로 죽었다면:
- 스왑 추가: \`sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile\`
- 인스턴스 타입 업그레이드 검토

---

## 빠른 진단 순서

\`\`\`bash
# 1. 에러 로그 확인
sudo tail -30 /var/log/nginx/error.log

# 2. upstream 프로세스 상태
sudo systemctl status php8.2-fpm    # 또는 해당 서비스

# 3. 실제 포트/소켓 리스닝 여부
sudo ss -tlnp

# 4. Nginx 설정 검증
sudo nginx -t

# 5. 설정 반영
sudo systemctl reload nginx
\`\`\``,
  },
  {
    title: '리눅스 디스크 꽉 찼을 때 — No space left on device 10분 해결',
    slug: 'linux-disk-full-fix',
    summary: 'No space left on device 오류가 떴을 때 df·du·find 명령어로 주범을 10분 안에 찾고, 로그·Docker·패키지 캐시·대용량 파일을 안전하게 정리하는 가이드.',
    category: 'Linux / Shell',
    tags: ['디스크', 'No space left', 'df', 'du', '트러블슈팅', 'Docker', '로그 정리'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
    author: 'Nodelog',
    status: 'published',
    views: 0,
    content: `\`No space left on device\` 에러는 디스크 100% 상태에서 파일 쓰기가 실패할 때 나타납니다. 서버가 멈추기 전에 **10분 안에 공간을 확보**해야 합니다.

---

## Step 1 — 상황 파악 (1분)

\`\`\`bash
# 전체 디스크 사용률
df -h

# 출력 예
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        50G   50G     0 100% /        ← 문제
\`\`\`

\`\`\`bash
# inode 사용률도 확인 (파일 수 초과도 같은 에러 발생)
df -i

# inode 100%면 파일 수가 너무 많은 것 → 아래 inode 섹션 참고
\`\`\`

---

## Step 2 — 주범 디렉터리 찾기 (2분)

\`\`\`bash
# 루트 기준 1단계 디렉터리 용량 정렬
sudo du -sh /* 2>/dev/null | sort -rh | head -15

# 용량 큰 디렉터리 안으로 좁혀 들어가기
sudo du -sh /var/* 2>/dev/null | sort -rh | head -10
sudo du -sh /var/log/* 2>/dev/null | sort -rh | head -10
\`\`\`

주로 큰 디렉터리:

| 위치 | 원인 |
|---|---|
| \`/var/log\` | 로그 파일 과다 축적 |
| \`/var/lib/docker\` | Docker 이미지·컨테이너 |
| \`/tmp\` | 임시 파일 미정리 |
| \`/home\` | 사용자 파일 |
| \`/var/cache/apt\` | 패키지 캐시 |

---

## Step 3 — 빠른 정리 (5분)

### 로그 파일 정리

\`\`\`bash
# journald 로그 (가장 효과 큼)
sudo journalctl --disk-usage
sudo journalctl --vacuum-size=200M    # 200MB만 남기기
sudo journalctl --vacuum-time=7d      # 7일치만 남기기

# 오래된 로그 파일 찾기
sudo find /var/log -name "*.log" -mtime +30 -size +10M

# 압축 로그(rotated) 삭제
sudo find /var/log -name "*.gz" -delete
sudo find /var/log -name "*.1" -delete
\`\`\`

### 패키지 캐시 정리

\`\`\`bash
# Ubuntu/Debian
sudo apt autoremove -y
sudo apt autoclean
sudo apt clean    # /var/cache/apt/archives 전부 삭제

# CentOS/RHEL
sudo yum clean all
sudo dnf clean all
\`\`\`

### Docker 정리

\`\`\`bash
# 사용하지 않는 컨테이너·이미지·볼륨·네트워크 일괄 삭제
docker system prune -f

# 볼륨까지 삭제 (데이터 손실 주의!)
docker system prune -f --volumes

# 이미지만 정리
docker image prune -a -f

# 사용량 확인
docker system df
\`\`\`

### 대용량 파일 찾기

\`\`\`bash
# 1GB 이상 파일 전체 탐색
sudo find / -xdev -size +1G -printf "%s\t%p\n" 2>/dev/null | sort -rn | head -10

# 500MB 이상
sudo find / -xdev -size +500M -printf "%s\t%p\n" 2>/dev/null | sort -rn | head -20
\`\`\`

### /tmp 정리

\`\`\`bash
# 오래된 임시 파일 삭제 (7일 이상)
sudo find /tmp -mtime +7 -delete
sudo find /var/tmp -mtime +30 -delete
\`\`\`

---

## Step 4 — inode 부족 해결

디스크 공간은 있는데 같은 에러가 난다면 inode 부족입니다.

\`\`\`bash
df -i    # IUse% 확인

# 파일 수가 많은 디렉터리 찾기
sudo find / -xdev -printf "%h\n" 2>/dev/null | sort | uniq -c | sort -rn | head -10
\`\`\`

주범은 보통:
- PHP 세션 파일: \`/var/lib/php/sessions/\`
- 썸네일 캐시: \`/var/cache/\`
- 메일 큐: \`/var/spool/mail/\`
- Node.js \`node_modules\` 내 소규모 파일 수천 개

\`\`\`bash
# PHP 세션 정리 예시
sudo find /var/lib/php/sessions -mtime +1 -delete
\`\`\`

---

## 재발 방지

\`\`\`bash
# logrotate 설정 확인
cat /etc/logrotate.conf
ls /etc/logrotate.d/

# 디스크 사용률 모니터링 (cron으로 알림)
# /etc/cron.daily/disk-alert 파일 생성
cat > /tmp/disk-alert.sh << 'SCRIPT'
#!/bin/bash
THRESHOLD=85
USAGE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "디스크 사용률 \${USAGE}%" | mail -s "[경고] 디스크 부족" admin@example.com
fi
SCRIPT
sudo mv /tmp/disk-alert.sh /etc/cron.daily/disk-alert
sudo chmod +x /etc/cron.daily/disk-alert
\`\`\``,
  },
  {
    title: 'Address already in use — 포트 충돌 원인 찾고 해결하기',
    slug: 'linux-port-in-use-fix',
    summary: 'bind: address already in use 오류가 떴을 때 ss·lsof·fuser 명령어로 포트를 점유한 프로세스를 특정하고, 안전하게 해제하거나 포트를 변경하는 방법.',
    category: 'Linux / Shell',
    tags: ['포트', 'Address already in use', 'lsof', 'ss', '트러블슈팅', 'bind', 'netstat'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL', 'macOS'],
    author: 'Nodelog',
    status: 'published',
    views: 0,
    content: `서버 시작 시 \`bind: address already in use\` 또는 \`EADDRINUSE\` 오류가 뜨면 해당 포트를 다른 프로세스가 이미 점유 중입니다.

---

## 점유 프로세스 찾기

### ss (권장 — 대부분 기본 설치)

\`\`\`bash
# 특정 포트(예: 3000) 점유 확인
sudo ss -tlnp | grep :3000

# 출력 예
# LISTEN 0  511  0.0.0.0:3000  0.0.0.0:*  users:(("node",pid=12345,fd=22))
#                                                        ↑ 프로세스명  ↑ PID
\`\`\`

\`\`\`bash
# 모든 LISTEN 포트 + 프로세스 한번에 보기
sudo ss -tlnp
\`\`\`

### lsof

\`\`\`bash
sudo lsof -i :3000

# 출력 예
# COMMAND   PID   USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# node    12345 deploy   22u  IPv4  123456      0t0  TCP *:3000 (LISTEN)
\`\`\`

### fuser

\`\`\`bash
sudo fuser 3000/tcp
# 출력: 3000/tcp:  12345   ← PID
\`\`\`

---

## 프로세스 확인 후 처리

\`\`\`bash
# PID로 어떤 프로세스인지 확인
ps -p 12345 -o pid,ppid,user,comm,args

# 실행 경로 확인
ls -la /proc/12345/exe
\`\`\`

### 방법 1: 서비스로 관리 중인 경우

\`\`\`bash
# 서비스명 확인
sudo systemctl status 12345    # PID로 찾기 어려울 때
# 또는
cat /proc/12345/comm           # 프로세스 이름

# 서비스 재시작
sudo systemctl restart myapp

# 또는 완전 중지 후 재시작
sudo systemctl stop myapp
sudo systemctl start myapp
\`\`\`

### 방법 2: 좀비 프로세스 종료

\`\`\`bash
# 정상 종료 (SIGTERM)
sudo kill 12345

# 3초 대기 후도 남아있으면 강제 종료
sleep 3 && sudo kill -9 12345

# 특정 이름의 프로세스 전체 종료
sudo pkill -f "node server.js"
\`\`\`

### 방법 3: 포트를 변경 (프로세스를 죽이지 않고)

\`\`\`bash
# 앱 설정에서 포트 변경 예시 (Node.js)
# PORT=3001 node server.js

# 또는 환경변수 파일 수정
# .env: PORT=3001

# Nginx/Apache 설정 변경
sudo nano /etc/nginx/sites-available/mysite
# listen 3001;  ← 변경 후 reload
sudo nginx -t && sudo systemctl reload nginx
\`\`\`

---

## TIME_WAIT 상태로 포트가 점유된 경우

프로세스를 죽였는데도 포트가 열리지 않는 경우입니다.

\`\`\`bash
# TIME_WAIT 상태 확인
sudo ss -tn | grep TIME-WAIT | grep :3000

# 대기 시간 확인 (기본 60초)
cat /proc/sys/net/ipv4/tcp_fin_timeout
\`\`\`

**빠른 해결 — SO_REUSEADDR 옵션 사용** (앱 코드에서):

Node.js 예:
\`\`\`js
server.listen({ port: 3000, host: '0.0.0.0' }, () => {});
// server 옵션에 reuseAddr: true 추가 (net 모듈)
\`\`\`

**빠른 해결 — 커널 TIME_WAIT 단축**:

\`\`\`bash
# 즉시 적용 (재부팅 후 초기화됨)
sudo sysctl -w net.ipv4.tcp_fin_timeout=15
sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# 영구 적용
echo "net.ipv4.tcp_fin_timeout = 15" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_tw_reuse = 1"     | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
\`\`\`

---

## 정리

| 상황 | 명령어 |
|---|---|
| 점유 프로세스 찾기 | \`sudo ss -tlnp \| grep :포트번호\` |
| PID로 프로세스 확인 | \`ps -p PID -o comm,args\` |
| 정상 종료 | \`sudo kill PID\` |
| 강제 종료 | \`sudo kill -9 PID\` |
| TIME_WAIT 대기 | \`sudo sysctl -w net.ipv4.tcp_fin_timeout=15\` |`,
  },
];

let ok = 0;
for (const guide of guides) {
  const { error } = await supabase.from('engineer_guides').insert(guide);
  if (error) console.error(`FAIL [${guide.slug}]:`, error.message);
  else { console.log(`OK: ${guide.slug}`); ok++; }
}
console.log(`\n${ok}/${guides.length} guides inserted.`);
