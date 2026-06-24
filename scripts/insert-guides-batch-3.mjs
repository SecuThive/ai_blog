import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── OS / 시스템 ─────────────────────────────────────────
  {
    title: '프로세스 관리 완전 가이드 — ps · kill · nice · htop',
    slug: 'linux-process-management-ps-kill-nice',
    summary: 'ps로 프로세스 조회, kill로 신호 전송, nice/renice로 우선순위 조정, htop 실전 사용법까지 리눅스 프로세스 관리의 핵심을 정리합니다.',
    category: 'OS / 시스템',
    tags: ['ps', 'kill', 'nice', 'htop', '프로세스', 'linux'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## ps — 프로세스 조회

\`\`\`bash
# 현재 세션 프로세스
ps

# 모든 프로세스 (BSD 스타일)
ps aux

# 모든 프로세스 (Unix 스타일)
ps -ef

# 특정 프로세스 검색
ps aux | grep nginx

# 트리 형태로 보기
ps axjf
pstree -p

# 특정 사용자 프로세스
ps -u deploy

# CPU / 메모리 기준 정렬
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
\`\`\`

### 주요 컬럼
| 컬럼 | 의미 |
|---|---|
| PID | 프로세스 ID |
| %CPU | CPU 사용률 |
| %MEM | 메모리 사용률 |
| VSZ | 가상 메모리 크기 (KB) |
| RSS | 실제 메모리 사용량 (KB) |
| STAT | 상태 (S=슬립, R=실행, Z=좀비, D=I/O대기) |

---

## kill — 신호 전송

\`\`\`bash
# 기본 종료 (SIGTERM, 15번 — 정상 종료 요청)
kill 1234

# 강제 종료 (SIGKILL, 9번 — 즉시 종료)
kill -9 1234
kill -KILL 1234

# 프로세스 이름으로 종료
pkill nginx
pkill -9 node

# 모든 일치 프로세스에 신호
killall nginx

# 신호 목록
kill -l
\`\`\`

### 자주 쓰는 신호
| 신호 | 번호 | 의미 |
|---|---|---|
| SIGTERM | 15 | 정상 종료 요청 |
| SIGKILL | 9 | 강제 종료 (무시 불가) |
| SIGHUP | 1 | 재시작 (설정 재로드) |
| SIGSTOP | 19 | 일시 정지 |
| SIGCONT | 18 | 재개 |

---

## nice · renice — 우선순위 조정

nice 값: **-20**(높은 우선순위) ~ **+19**(낮은 우선순위), 기본값 0

\`\`\`bash
# 낮은 우선순위로 실행 (백그라운드 작업)
nice -n 10 tar czf backup.tar.gz /data

# 높은 우선순위 (root 필요)
sudo nice -n -10 ./critical-process

# 실행 중인 프로세스 우선순위 변경
renice -n 5 -p 1234        # PID 기준
renice -n 10 -u deploy     # 사용자 기준

# 현재 우선순위 확인
ps -o pid,ni,comm -p 1234
\`\`\`

---

## htop — 인터랙티브 모니터링

\`\`\`bash
sudo apt install -y htop
htop
\`\`\`

### 주요 단축키
| 키 | 동작 |
|---|---|
| F2 | 설정 |
| F3 / / | 검색 |
| F4 | 필터 |
| F5 | 트리 뷰 |
| F6 | 정렬 기준 선택 |
| F9 | 신호 전송 (kill) |
| F10 / q | 종료 |
| Space | 프로세스 태그 |
| u | 사용자별 필터 |

---

## 백그라운드 프로세스 관리

\`\`\`bash
# 백그라운드 실행
./long-task.sh &

# 작업 목록
jobs

# 포그라운드로 전환
fg %1

# 백그라운드로 전환 (Ctrl+Z 후)
bg %1

# 터미널 종료 후에도 유지
nohup ./script.sh > output.log 2>&1 &

# 실행 중인 프로세스 분리
disown %1
\`\`\``,
  },

  {
    title: '환경변수 완전 가이드 — .bashrc · .zshrc · export · env',
    slug: 'linux-environment-variables-guide',
    summary: '환경변수 설정·조회·해제, 영구 적용 방법(.bashrc/.zshrc/.profile), 프로세스에 변수 전달, .env 파일 관리까지 정리합니다.',
    category: 'OS / 시스템',
    tags: ['환경변수', 'bashrc', 'zshrc', 'export', 'env', 'linux'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 기본 조작

\`\`\`bash
# 설정 (현재 세션만)
export MY_VAR="hello"
export PORT=3000

# 조회
echo $MY_VAR
printenv MY_VAR

# 모든 환경변수 조회
env
printenv
export -p

# 해제
unset MY_VAR

# 변수가 없으면 기본값
echo \${MY_VAR:-"default"}

# 변수 존재 여부 확인
[[ -z "$MY_VAR" ]] && echo "없음" || echo "있음"
\`\`\`

---

## 영구 적용 — 파일 위치

| 파일 | 적용 범위 | 언제 실행 |
|---|---|---|
| \`/etc/environment\` | 시스템 전체 | 로그인 시 |
| \`/etc/profile\` | 시스템 전체 | 로그인 셸 |
| \`/etc/profile.d/*.sh\` | 시스템 전체 | 로그인 셸 |
| \`~/.profile\` | 현재 사용자 | 로그인 셸 |
| \`~/.bashrc\` | 현재 사용자 | 인터랙티브 bash |
| \`~/.zshrc\` | 현재 사용자 | 인터랙티브 zsh |

\`\`\`bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export PATH="$HOME/.local/bin:$PATH"
export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
export EDITOR="vim"

# 적용
source ~/.bashrc
# 또는
. ~/.zshrc
\`\`\`

---

## PATH 관리

\`\`\`bash
# PATH에 디렉터리 추가
export PATH="$HOME/bin:$PATH"        # 앞에 추가 (우선순위 높음)
export PATH="$PATH:/opt/custom/bin"  # 뒤에 추가

# 현재 PATH 확인
echo $PATH | tr ':' '\\n'

# 명령어 위치 확인
which python3
type -a python3    # 모든 위치 표시
\`\`\`

---

## 특정 명령에만 변수 전달

\`\`\`bash
# 앞에 붙이면 해당 명령에만 적용
NODE_ENV=production PORT=8080 node server.js

# env 명령으로 정리
env NODE_ENV=production PORT=8080 node server.js

# 변수를 제거한 환경에서 실행
env -i PATH=$PATH node server.js
\`\`\`

---

## .env 파일 관리

\`\`\`bash
# .env 파일 예시
DB_HOST=localhost
DB_PORT=5432
DB_USER=app
DB_PASS=secret
NODE_ENV=development

# .env 파일 로드 (bash)
set -a; source .env; set +a

# 특정 변수만 로드
export $(grep -v '^#' .env | xargs)

# .env를 현재 세션에 적용
while IFS= read -r line; do
  [[ "$line" =~ ^[^#] ]] && export "$line"
done < .env
\`\`\`

> **주의**: .env 파일은 반드시 .gitignore에 추가하세요.

---

## 시스템 서비스에서 환경변수 (systemd)

\`\`\`ini
# /etc/systemd/system/myapp.service
[Service]
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/etc/myapp/.env   # 파일에서 로드
\`\`\`

\`\`\`bash
systemctl daemon-reload
systemctl restart myapp
# 확인
systemctl show myapp --property=Environment
\`\`\``,
  },

  {
    title: '리눅스 압축·해제 완전 가이드 — tar · gzip · zip · 7z',
    slug: 'linux-archive-compress-guide',
    summary: 'tar, gzip, bzip2, xz, zip, 7z 각 형식의 압축·해제 명령과 용도별 선택 기준을 정리합니다.',
    category: 'OS / 시스템',
    tags: ['tar', 'gzip', 'zip', '압축', '7z', 'linux'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 형식별 비교

| 형식 | 확장자 | 압축률 | 속도 | 용도 |
|---|---|---|---|---|
| gzip | .tar.gz / .tgz | 보통 | 빠름 | 리눅스 일반 배포 |
| bzip2 | .tar.bz2 | 높음 | 느림 | 소스 패키지 |
| xz | .tar.xz | 매우 높음 | 매우 느림 | 커널, 배포판 패키지 |
| zip | .zip | 보통 | 빠름 | 크로스플랫폼 |
| 7-zip | .7z | 매우 높음 | 느림 | 최대 압축 |
| zstd | .tar.zst | 높음 | 매우 빠름 | 최신 배포판, Docker |

---

## tar — 묶기와 압축

\`\`\`bash
# 압축 (gzip)
tar czf archive.tar.gz /path/to/dir

# 압축 (bzip2)
tar cjf archive.tar.bz2 /path/to/dir

# 압축 (xz)
tar cJf archive.tar.xz /path/to/dir

# 압축 (zstd)
tar --zstd -cf archive.tar.zst /path/to/dir

# 진행상황 표시
tar czf archive.tar.gz -v /path/to/dir

# 파일 제외
tar czf archive.tar.gz --exclude='*.log' --exclude='.git' /path/to/dir

# 특정 파일만 포함
tar czf archive.tar.gz file1.txt file2.txt dir/
\`\`\`

---

## tar — 해제

\`\`\`bash
# 해제 (형식 자동 감지)
tar xf archive.tar.gz

# 특정 디렉터리에 해제
tar xzf archive.tar.gz -C /target/dir

# 내용 목록 확인 (해제하지 않음)
tar tzf archive.tar.gz

# 특정 파일만 해제
tar xzf archive.tar.gz path/to/specific/file
\`\`\`

### tar 옵션 요약
| 옵션 | 의미 |
|---|---|
| c | 생성 |
| x | 해제 |
| t | 목록 보기 |
| z | gzip |
| j | bzip2 |
| J | xz |
| f | 파일명 지정 |
| v | 진행상황 출력 |
| C | 대상 디렉터리 |

---

## gzip / gunzip

\`\`\`bash
# 단일 파일 압축 (원본 삭제됨)
gzip file.txt            # → file.txt.gz

# 원본 유지
gzip -k file.txt

# 해제
gunzip file.txt.gz
gzip -d file.txt.gz

# 압축 레벨 (1=빠름, 9=최대 압축)
gzip -9 file.txt

# 여러 파일
gzip *.log
\`\`\`

---

## zip / unzip

\`\`\`bash
# 압축
zip archive.zip file1 file2 dir/

# 디렉터리 재귀 압축
zip -r archive.zip /path/to/dir

# 특정 파일 제외
zip -r archive.zip . -x "*.log" -x ".git/*"

# 암호 설정
zip -e archive.zip files/

# 해제
unzip archive.zip

# 특정 디렉터리에 해제
unzip archive.zip -d /target/dir

# 내용 확인
unzip -l archive.zip
\`\`\`

---

## 7z

\`\`\`bash
sudo apt install -y p7zip-full

# 압축
7z a archive.7z /path/to/dir

# 최대 압축
7z a -mx=9 archive.7z /path/to/dir

# 암호 설정
7z a -p archive.7z files/

# 해제
7z x archive.7z -o/target/dir

# 내용 확인
7z l archive.7z
\`\`\`

---

## 실무 패턴

\`\`\`bash
# 로그 디렉터리 일별 백업
tar czf /backup/logs-$(date +%Y%m%d).tar.gz /var/log/myapp/

# 압축 파일 크기 확인
ls -lh archive.tar.gz

# 원격 서버로 스트리밍 압축 전송
tar czf - /data | ssh user@remote "cat > /backup/data.tar.gz"

# 분할 압축 (4GB 단위)
tar czf - /large-data | split -b 4G - backup.tar.gz.part
\`\`\``,
  },

  // ── 보안 설정 ───────────────────────────────────────────
  {
    title: 'sudo 권한 관리 — sudoers · 최소권한 · 감사 로그',
    slug: 'linux-sudo-privilege-management',
    summary: 'sudoers 파일 문법, 사용자·그룹 sudo 권한 부여, 특정 명령만 허용하는 최소권한 설정, sudo 로그 감사 방법을 설명합니다.',
    category: '보안 설정',
    tags: ['sudo', 'sudoers', '권한관리', '최소권한', '보안', 'linux'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## sudoers 파일 기본

\`\`\`bash
# 절대 직접 편집하지 말 것 — visudo 사용
sudo visudo

# 특정 파일 편집
sudo visudo -f /etc/sudoers.d/myuser
\`\`\`

visudo는 저장 전 문법 검사를 수행해 잘못된 설정으로 sudo가 잠기는 것을 방지합니다.

---

## sudoers 문법

\`\`\`
사용자  호스트=(실행사용자:그룹) 명령
\`\`\`

\`\`\`sudoers
# root는 모든 것 가능
root    ALL=(ALL:ALL) ALL

# deploy 사용자에게 모든 sudo 권한 (패스워드 필요)
deploy  ALL=(ALL:ALL) ALL

# wheel 그룹에 sudo 권한
%wheel  ALL=(ALL) ALL

# sudo 시 패스워드 생략
deploy  ALL=(ALL) NOPASSWD: ALL

# 특정 명령만 허용
deploy  ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl status nginx

# 특정 명령 금지 (허용 목록 뒤에 !로 추가)
deploy  ALL=(ALL) ALL, !/bin/su, !/usr/bin/passwd root
\`\`\`

---

## /etc/sudoers.d/ 활용 (권장)

메인 sudoers 파일 대신 개별 파일로 관리하면 추적이 쉽습니다.

\`\`\`bash
# 파일 생성
sudo visudo -f /etc/sudoers.d/deploy

# 내용
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart myapp

# 권한 설정 (필수)
sudo chmod 440 /etc/sudoers.d/deploy
\`\`\`

---

## 최소권한 원칙 적용 예시

\`\`\`sudoers
# 배포 자동화 사용자 — 특정 서비스 재시작만 허용
ci-runner ALL=(ALL) NOPASSWD: \\
    /usr/bin/systemctl restart myapp, \\
    /usr/bin/systemctl reload nginx

# DBA — PostgreSQL 관련만 허용
dbadmin ALL=(postgres) NOPASSWD: /usr/bin/psql, /usr/bin/pg_dump

# 모니터링 — 읽기 전용 명령만
monitor ALL=(ALL) NOPASSWD: \\
    /usr/bin/systemctl status *, \\
    /usr/bin/journalctl -u *, \\
    /bin/cat /var/log/*
\`\`\`

---

## sudo 로그 감사

\`\`\`bash
# Ubuntu (journald)
sudo journalctl -u sudo | grep -i "command"

# 모든 sudo 명령 실시간 확인
sudo journalctl -f | grep sudo

# /var/log/auth.log에서 확인 (Ubuntu)
grep "sudo:" /var/log/auth.log | tail -50

# /var/log/secure (CentOS)
grep "sudo:" /var/log/secure | tail -50

# 특정 사용자의 sudo 기록
grep "sudo:.*deploy" /var/log/auth.log
\`\`\`

---

## sudo 타임아웃 설정

\`\`\`sudoers
# 기본 타임아웃 변경 (분 단위, 0=항상 물어봄)
Defaults timestamp_timeout=5

# 세션 재인증 없이 sudo 사용
Defaults timestamp_type=global

# 터미널별 개별 타임아웃
Defaults timestamp_type=tty
\`\`\`

---

## 긴급 복구 — sudo 잠긴 경우

\`\`\`bash
# 단일 사용자 모드로 부팅 후
mount -o remount,rw /
visudo    # 또는 직접 수정
# /etc/sudoers 백업 복원
cp /etc/sudoers.bak /etc/sudoers
\`\`\``,
  },

  {
    title: 'Fail2Ban 고급 — 커스텀 필터·액션·화이트리스트',
    slug: 'fail2ban-advanced-custom-rules',
    summary: '커스텀 필터로 애플리케이션 로그를 파싱하고, 액션을 추가하며, 화이트리스트·블랙리스트를 관리하는 Fail2Ban 고급 설정을 설명합니다.',
    category: '보안 설정',
    tags: ['fail2ban', '커스텀필터', '브루트포스', '침입차단', '보안'],
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## Fail2Ban 구조 이해

\`\`\`
/etc/fail2ban/
├── fail2ban.conf        # 메인 설정 (수정 금지)
├── jail.conf            # 기본 jail 설정 (수정 금지)
├── fail2ban.local       # 로컬 오버라이드
├── jail.local           # jail 로컬 설정 (여기서 수정)
├── filter.d/            # 필터 정의
└── action.d/            # 액션 정의
\`\`\`

---

## jail.local 기본 설정

\`\`\`ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
ignoreip = 127.0.0.1/8 ::1 10.0.0.0/8 192.168.0.0/16

[sshd]
enabled  = true
port     = 2222
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 3
bantime  = 24h
\`\`\`

---

## 커스텀 필터 작성

애플리케이션 로그에서 실패 패턴을 찾는 정규식 필터입니다.

\`\`\`ini
# /etc/fail2ban/filter.d/myapp.conf
[Definition]
# 실패 로그 예시: 2025-05-27 10:23:45 LOGIN_FAILED from 203.0.113.45
failregex = ^%Y-%m-%d %H:%M:%S LOGIN_FAILED from <HOST>$
            ^.* authentication failure.* rhost=<HOST>.*$

# 무시할 패턴
ignoreregex = ^.* from 127\\.0\\.0\\.1.*$
\`\`\`

\`\`\`bash
# 필터 테스트
fail2ban-regex /var/log/myapp/auth.log /etc/fail2ban/filter.d/myapp.conf -v

# jail에 추가
# /etc/fail2ban/jail.local
[myapp]
enabled  = true
filter   = myapp
logpath  = /var/log/myapp/auth.log
maxretry = 5
bantime  = 2h
\`\`\`

---

## Nginx 로그인 실패 차단

\`\`\`ini
# /etc/fail2ban/filter.d/nginx-auth.conf
[Definition]
failregex = ^<HOST> -.*"POST /api/login HTTP.*" (401|403) .*$

# /etc/fail2ban/jail.local
[nginx-auth]
enabled  = true
filter   = nginx-auth
logpath  = /var/log/nginx/access.log
maxretry = 10
findtime = 5m
bantime  = 1h
\`\`\`

---

## 커스텀 액션 — Slack 알림

\`\`\`ini
# /etc/fail2ban/action.d/slack-notify.conf
[Definition]
actionstart =
actionstop =
actioncheck =
actionban = curl -X POST -H 'Content-type: application/json' \\
    --data '{"text":"🚫 Fail2Ban: <ip> banned in <name> (%(bantime)s)"}' \\
    https://hooks.slack.com/services/YOUR/WEBHOOK/URL
actionunban =

# jail.local에 추가
[myapp]
action = iptables-multiport[name=myapp, port="80,443"]
         slack-notify
\`\`\`

---

## 화이트리스트 · 블랙리스트

\`\`\`bash
# IP 화이트리스트 (영구 무시)
# jail.local [DEFAULT] ignoreip에 추가
ignoreip = 127.0.0.1/8 1.2.3.4 10.0.0.0/8

# 즉시 특정 IP 차단 (수동)
fail2ban-client set sshd banip 203.0.113.45

# 차단 해제
fail2ban-client set sshd unbanip 203.0.113.45
\`\`\`

---

## 상태 확인 명령

\`\`\`bash
# 전체 상태
fail2ban-client status

# 특정 jail 상태
fail2ban-client status sshd

# 현재 차단된 IP 목록
fail2ban-client status sshd | grep "Banned IP"

# 실시간 로그
tail -f /var/log/fail2ban.log

# 재시작 (설정 변경 후)
sudo systemctl reload fail2ban
\`\`\``,
  },

  {
    title: '파일 권한 완전 가이드 — chmod · chown · ACL',
    slug: 'linux-file-permission-acl-guide',
    summary: 'chmod 숫자/기호 표기, chown 소유자 변경, umask 기본값 설정, setfacl/getfacl로 ACL 세밀한 권한 제어까지 실무 권한 관리를 정리합니다.',
    category: '보안 설정',
    tags: ['chmod', 'chown', 'acl', 'umask', '파일권한', 'linux'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 권한 표기 이해

\`\`\`
-rwxr-xr-- 1 alice developers 4096 May 27 10:00 script.sh
│└──┘└──┘└──┘
│  U   G   O    U=소유자(User), G=그룹(Group), O=기타(Other)
│
└─ 파일 타입 (- 파일, d 디렉터리, l 링크)

r = 읽기(4)  w = 쓰기(2)  x = 실행(1)  - = 없음(0)
\`\`\`

---

## chmod — 권한 변경

\`\`\`bash
# 숫자 표기
chmod 755 script.sh     # rwxr-xr-x
chmod 644 file.txt      # rw-r--r--
chmod 600 secret.key    # rw-------
chmod 777 dir/          # rwxrwxrwx (위험)

# 기호 표기
chmod u+x script.sh     # 소유자에 실행 추가
chmod g-w file.txt      # 그룹에서 쓰기 제거
chmod o=r file.txt      # 기타에 읽기만
chmod a+r file.txt      # 모든 사람에 읽기 추가
chmod ug=rw,o= file.txt # 소유자·그룹 rw, 기타 없음

# 재귀 적용
chmod -R 755 /var/www/html

# 파일은 644, 디렉터리는 755로 구분 적용
find /var/www -type f -exec chmod 644 {} \\;
find /var/www -type d -exec chmod 755 {} \\;
\`\`\`

---

## chown — 소유자 변경

\`\`\`bash
# 소유자 변경
chown alice file.txt

# 소유자:그룹 동시 변경
chown alice:developers file.txt

# 그룹만 변경
chown :developers file.txt
chgrp developers file.txt

# 재귀 적용
chown -R deploy:www-data /var/www/myapp
\`\`\`

---

## 특수 권한 비트

\`\`\`bash
# SUID — 소유자 권한으로 실행
chmod u+s /usr/bin/sudo       # ls -la 시 -rwsr-xr-x

# SGID — 그룹 권한으로 실행 / 디렉터리 내 파일 그룹 상속
chmod g+s /shared/dir/

# Sticky Bit — 소유자만 삭제 가능 (/tmp 등)
chmod +t /tmp
ls -ld /tmp                   # drwxrwxrwt

# 숫자로: 4=SUID, 2=SGID, 1=Sticky
chmod 4755 mybin    # SUID + 755
chmod 1777 /tmp     # Sticky + 777
\`\`\`

---

## umask — 기본 권한 마스크

\`\`\`bash
# 현재 umask 확인
umask           # 0022 (기본값)

# 파일 기본권한 = 666 - umask = 644
# 디렉터리 기본권한 = 777 - umask = 755

# 더 엄격한 umask (그룹·기타 읽기도 금지)
umask 077       # 파일 600, 디렉터리 700

# 영구 적용
echo "umask 022" >> ~/.bashrc
\`\`\`

---

## ACL — 세밀한 권한 제어

표준 권한(UGO)으로 처리하기 어려운 복잡한 시나리오에 사용합니다.

\`\`\`bash
# ACL 패키지 설치
sudo apt install -y acl

# ACL 설정
setfacl -m u:bob:rw file.txt        # bob에게 rw 권한
setfacl -m g:devops:rx /project/    # devops 그룹에 rx
setfacl -m o::- file.txt            # 기타에 권한 없음

# 기본 ACL (디렉터리 — 새 파일에 자동 적용)
setfacl -d -m u:ci:rw /deploy/

# ACL 확인
getfacl file.txt
getfacl -R /project/

# ACL 삭제
setfacl -x u:bob file.txt           # 특정 사용자 ACL 제거
setfacl -b file.txt                 # 모든 ACL 제거

# 복사·백업
getfacl -R /project/ > acl_backup.txt
setfacl --restore=acl_backup.txt
\`\`\``,
  },

  {
    title: 'SSH 2단계 인증 — Google Authenticator OTP 설정',
    slug: 'two-factor-auth-ssh-google-authenticator',
    summary: 'Google Authenticator PAM 모듈을 설치해 SSH 로그인에 TOTP 기반 2단계 인증을 추가하는 방법을 단계별로 설명합니다.',
    category: '보안 설정',
    tags: ['ssh', '2fa', 'otp', 'google-authenticator', 'totp', '보안'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 사전 요구사항

- SSH 키 인증이 이미 설정되어 있을 것 (잠김 방지)
- 스마트폰에 Google Authenticator 또는 Authy 설치
- 테스트용 SSH 세션을 별도로 유지한 채 진행

---

## 1. PAM 모듈 설치

\`\`\`bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y libpam-google-authenticator

# CentOS / RHEL
sudo yum install -y epel-release
sudo yum install -y google-authenticator
\`\`\`

---

## 2. 사용자별 OTP 초기화

**각 사용자가 직접 실행해야 합니다.**

\`\`\`bash
google-authenticator
\`\`\`

질문에 답합니다:
1. **시간 기반 토큰?** → y (TOTP 권장)
2. QR 코드 스캔 → 스마트폰 앱으로 스캔
3. 비상 코드 (Emergency scratch codes) → 안전한 곳에 보관
4. 파일 업데이트? → y
5. **여러 사용 허용 (30초 내)?** → n (재사용 방지)
6. **시간 오차 허용 (±1분)?** → y
7. **Rate limiting?** → y (30초에 3회 제한)

---

## 3. PAM 설정

\`\`\`bash
sudo nano /etc/pam.d/sshd
\`\`\`

파일 상단에 추가:

\`\`\`
# 2FA — OTP 필수 (키 인증 사용자도 OTP 요구)
auth required pam_google_authenticator.so

# 또는 키 인증 성공 시 OTP 생략 (선택)
# auth [success=done default=ignore] pam_google_authenticator.so nullok
\`\`\`

---

## 4. sshd_config 설정

\`\`\`bash
sudo nano /etc/ssh/sshd_config
\`\`\`

\`\`\`
# 키보드 인터랙티브 활성화
ChallengeResponseAuthentication yes
# 또는 (OpenSSH 8.7+)
KbdInteractiveAuthentication yes

# 패스워드 + OTP 조합
UsePAM yes

# 인증 방식: publickey와 keyboard-interactive 모두 요구
AuthenticationMethods publickey,keyboard-interactive
# 패스워드 + OTP만 쓰려면:
# AuthenticationMethods keyboard-interactive
\`\`\`

\`\`\`bash
# 설정 검증
sudo sshd -t

# 재시작
sudo systemctl restart sshd
\`\`\`

---

## 5. 연결 테스트

**현재 세션을 닫지 말고** 새 터미널에서 테스트합니다.

\`\`\`bash
ssh user@server
# Verification code: (앱에서 6자리 입력)
\`\`\`

---

## 비상 접속 — OTP 없이 로그인

스마트폰을 잃어버린 경우, 초기화 시 저장한 비상 코드(Scratch code)를 OTP 입력란에 입력합니다. 각 코드는 1회만 사용 가능합니다.

\`\`\`bash
# ~/.google_authenticator 파일에서 비상 코드 확인 (서버 직접 접속 필요)
cat ~/.google_authenticator
\`\`\`

---

## 특정 사용자만 2FA 제외

\`\`\`
# /etc/pam.d/sshd
auth [success=1 default=ignore] pam_succeed_if.so user in ci-runner:deploy
auth required pam_google_authenticator.so
\`\`\``,
  },
];

async function insertGuides() {
  let success = 0, skipped = 0, failed = 0;
  for (const guide of guides) {
    const { error } = await supabase
      .from('engineer_guides')
      .upsert(guide, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) {
      if (error.code === '23505') { console.log(`⏭  SKIP  ${guide.slug}`); skipped++; }
      else { console.error(`✗ FAIL  ${guide.slug}:`, error.message); failed++; }
    } else {
      console.log(`✓ OK    ${guide.slug}`); success++;
    }
  }
  console.log(`\n완료: ${success}개 삽입, ${skipped}개 중복, ${failed}개 실패`);
}
insertGuides();
