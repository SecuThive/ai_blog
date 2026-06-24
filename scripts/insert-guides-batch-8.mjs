import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── OS / 시스템 ─────────────────────────────────────────
  {
    title: 'systemd timer — cron 대체 스케줄러 완전 가이드',
    slug: 'systemd-timer-guide',
    summary: 'systemd timer 유닛으로 정기 작업을 예약하고, 실패 알림·로그·지연 실행을 설정하는 방법과 cron 대비 장단점을 설명합니다.',
    category: 'OS / 시스템',
    tags: ['systemd', 'timer', 'cron', '스케줄러', '자동화', 'linux'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## systemd timer vs cron

| 항목 | cron | systemd timer |
|---|---|---|
| 로그 | syslog 혼재 | journalctl 통합 |
| 실패 감지 | 어려움 | 자동 (OnFailure=) |
| 의존성 | 없음 | After=, Requires= |
| 누락 실행 보정 | 없음 | Persistent=true |
| 실행 환경 | 제한적 | 서비스 유닛과 동일 |

---

## 기본 구조 — .service + .timer 쌍

\`\`\`bash
# 두 파일이 쌍을 이룸
/etc/systemd/system/mybackup.service   # 실행할 작업
/etc/systemd/system/mybackup.timer     # 실행 스케줄
\`\`\`

---

## 예시: 매일 백업

\`\`\`ini
# /etc/systemd/system/mybackup.service
[Unit]
Description=Daily database backup
After=network.target postgresql.service

[Service]
Type=oneshot
User=backup
ExecStart=/usr/local/bin/backup.sh
StandardOutput=journal
StandardError=journal
\`\`\`

\`\`\`ini
# /etc/systemd/system/mybackup.timer
[Unit]
Description=Run mybackup daily at 3am

[Timer]
OnCalendar=*-*-* 03:00:00     # 매일 03:00
Persistent=true                # 누락된 실행 즉시 보정
RandomizedDelaySec=300         # 최대 5분 랜덤 지연 (서버 분산)
Unit=mybackup.service          # 생략 가능 (같은 이름 자동 연결)

[Install]
WantedBy=timers.target
\`\`\`

\`\`\`bash
# 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable --now mybackup.timer

# 상태 확인
systemctl status mybackup.timer
systemctl list-timers
\`\`\`

---

## OnCalendar 표현식

\`\`\`
*-*-* 00:00:00       # 매일 자정
*-*-* 03:00:00       # 매일 03:00
Mon *-*-* 09:00:00   # 매주 월요일 09:00
*-*-1 00:00:00       # 매월 1일 자정
*-*-* 0/6:00:00      # 6시간마다
hourly               # 매시 정각 (= *-*-* *:00:00)
daily                # 매일 자정 (= *-*-* 00:00:00)
weekly               # 매주 월요일 자정
monthly              # 매월 1일 자정
\`\`\`

\`\`\`bash
# 표현식 검증
systemd-analyze calendar "*-*-* 03:00:00"
systemd-analyze calendar "Mon *-*-* 09:00:00"
\`\`\`

---

## 부팅 후 일정 시간 뒤 실행

\`\`\`ini
[Timer]
OnBootSec=5min         # 부팅 5분 후 1회 실행
OnUnitActiveSec=1h     # 이후 1시간마다 반복
\`\`\`

---

## 실패 알림 설정

\`\`\`ini
# mybackup.service에 추가
[Unit]
OnFailure=notify-failure@%n.service

# /etc/systemd/system/notify-failure@.service
[Unit]
Description=Failure notification for %i

[Service]
Type=oneshot
ExecStart=/usr/local/bin/notify-slack.sh "Timer %i failed"
\`\`\`

---

## 로그 및 수동 실행

\`\`\`bash
# 타이머 전체 목록 (다음 실행 시간 포함)
systemctl list-timers --all

# 서비스 로그
journalctl -u mybackup.service --since today
journalctl -u mybackup.service -n 50

# 수동으로 즉시 실행 (타이머와 별개)
sudo systemctl start mybackup.service

# 타이머만 중지 (서비스는 유지)
sudo systemctl stop mybackup.timer
sudo systemctl disable mybackup.timer
\`\`\``,
  },

  {
    title: 'NFS · 파일시스템 마운트 — /etc/fstab 완전 가이드',
    slug: 'nfs-filesystem-mount-guide',
    summary: 'NFS 서버·클라이언트 설정, /etc/fstab으로 영구 마운트, UUID 기반 디스크 마운트, tmpfs, bind mount 등 리눅스 파일시스템 마운트 방법을 정리합니다.',
    category: 'OS / 시스템',
    tags: ['nfs', 'mount', 'fstab', '파일시스템', 'linux', '스토리지'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## mount 기본

\`\`\`bash
# 현재 마운트 상태 확인
mount | column -t
df -hT

# 수동 마운트
sudo mount /dev/sdb1 /mnt/data

# 파일시스템 타입 지정
sudo mount -t ext4 /dev/sdb1 /mnt/data
sudo mount -t xfs  /dev/sdb2 /mnt/data2

# 언마운트
sudo umount /mnt/data

# 사용 중일 때 확인
sudo lsof +D /mnt/data
sudo fuser -m /mnt/data
\`\`\`

---

## /etc/fstab — 영구 마운트

\`\`\`bash
# fstab 형식
# <장치>  <마운트포인트>  <타입>  <옵션>  <dump>  <pass>

# UUID 확인 (UUID로 마운트해야 디바이스명 변경에 안전)
sudo blkid /dev/sdb1
lsblk -f
\`\`\`

\`\`\`
# /etc/fstab 예시
UUID=a1b2c3d4-e5f6-...  /mnt/data  ext4  defaults,noatime  0  2
UUID=b2c3d4e5-f6a7-...  /mnt/ssd   xfs   defaults          0  2
\`\`\`

### 주요 마운트 옵션

| 옵션 | 의미 |
|---|---|
| defaults | rw,suid,exec,auto,nouser,async |
| noatime | 파일 접근 시간 기록 안 함 (성능 개선) |
| ro | 읽기 전용 |
| noexec | 실행 파일 실행 금지 (보안) |
| nosuid | SUID 비트 무시 (보안) |
| user | 일반 사용자도 마운트 가능 |
| nofail | 마운트 실패해도 부팅 계속 |

\`\`\`bash
# fstab 적용 테스트 (실제 마운트)
sudo mount -a

# 특정 항목만
sudo mount /mnt/data
\`\`\`

---

## NFS 서버 설정

\`\`\`bash
# 설치
sudo apt install -y nfs-kernel-server

# 공유 디렉터리 설정
sudo mkdir -p /srv/nfs/shared
sudo chown nobody:nogroup /srv/nfs/shared

# /etc/exports 설정
sudo nano /etc/exports
\`\`\`

\`\`\`
# /etc/exports
/srv/nfs/shared  192.168.1.0/24(rw,sync,no_subtree_check)
/srv/nfs/shared  10.0.0.5(ro,sync)          # 특정 IP만 읽기
/srv/nfs/shared  *(ro)                       # 모두 읽기 (주의)
\`\`\`

\`\`\`bash
# NFS 서버 적용
sudo exportfs -ra
sudo systemctl enable --now nfs-kernel-server

# 공유 목록 확인
sudo exportfs -v
showmount -e localhost
\`\`\`

---

## NFS 클라이언트 마운트

\`\`\`bash
sudo apt install -y nfs-common

# 수동 마운트
sudo mkdir -p /mnt/nfs/shared
sudo mount -t nfs 192.168.1.100:/srv/nfs/shared /mnt/nfs/shared

# 성능 옵션
sudo mount -t nfs -o rsize=8192,wsize=8192,timeo=14,intr \
  192.168.1.100:/srv/nfs/shared /mnt/nfs/shared

# 영구 마운트 (fstab)
echo "192.168.1.100:/srv/nfs/shared  /mnt/nfs/shared  nfs  defaults,nofail,_netdev  0  0" \
  | sudo tee -a /etc/fstab

# 적용
sudo mount -a
\`\`\`

---

## 특수 마운트

\`\`\`bash
# tmpfs — 메모리 기반 임시 파일시스템
sudo mount -t tmpfs -o size=512m tmpfs /mnt/tmpdir
# fstab: tmpfs /tmp tmpfs defaults,size=1g 0 0

# bind mount — 디렉터리를 다른 위치에 중복 마운트
sudo mount --bind /var/www/html /mnt/webroot
# fstab: /var/www/html /mnt/webroot none bind 0 0

# read-only remount
sudo mount -o remount,ro /mnt/data

# 마운트 오류 진단
dmesg | tail -20
journalctl -k | grep -i "nfs\|mount\|ext4"
\`\`\``,
  },

  // ── 보안 설정 ───────────────────────────────────────────
  {
    title: 'nmap 포트 스캔 — 서버 보안 점검 실전 가이드',
    slug: 'nmap-port-scan-security-guide',
    summary: 'nmap으로 열린 포트·서비스·OS를 탐지하고, 서버 보안을 자체 점검하는 방법과 스캔 결과를 해석하는 방법을 설명합니다.',
    category: '보안 설정',
    tags: ['nmap', '포트스캔', '보안점검', '취약점', 'network', '침투테스트'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 설치

\`\`\`bash
sudo apt install -y nmap    # Ubuntu / Debian
sudo yum install -y nmap    # CentOS / RHEL
brew install nmap           # macOS

nmap --version
\`\`\`

> **중요**: 자신이 소유·관리하는 서버에만 사용하세요. 타인의 서버를 무단 스캔하는 것은 불법입니다.

---

## 기본 스캔

\`\`\`bash
# 단일 호스트 스캔 (기본 1000개 포트)
nmap 192.168.1.1

# 도메인
nmap example.com

# 여러 호스트
nmap 192.168.1.1 192.168.1.2 192.168.1.5

# 대역 스캔
nmap 192.168.1.0/24
nmap 192.168.1.1-50

# 자기 자신 스캔 (서버 보안 점검)
nmap localhost
\`\`\`

---

## 포트 범위 지정

\`\`\`bash
# 특정 포트
nmap -p 22,80,443 192.168.1.1

# 포트 범위
nmap -p 1-1024 192.168.1.1

# 전체 포트 (65535)
nmap -p- 192.168.1.1

# 상위 100개 포트 (빠른 스캔)
nmap -F 192.168.1.1
\`\`\`

---

## 스캔 유형

\`\`\`bash
# SYN 스캔 (기본, root 필요) — 빠르고 은밀
sudo nmap -sS 192.168.1.1

# TCP Connect 스캔 (root 불필요)
nmap -sT 192.168.1.1

# UDP 스캔 (느림)
sudo nmap -sU 192.168.1.1

# ICMP ping 스캔 (호스트 발견)
sudo nmap -sn 192.168.1.0/24

# 포트 스캔 없이 호스트 확인
nmap -sP 192.168.1.0/24
\`\`\`

---

## 서비스 · OS 탐지

\`\`\`bash
# 서비스 버전 탐지 (-sV)
nmap -sV 192.168.1.1

# OS 탐지 (-O, root 필요)
sudo nmap -O 192.168.1.1

# 종합 스캔 (-A: OS + 버전 + 스크립트 + traceroute)
sudo nmap -A 192.168.1.1

# 자기 서버 종합 점검 (실무에서 자주 사용)
sudo nmap -A -p- localhost
\`\`\`

---

## NSE 스크립트 (취약점 스캔)

\`\`\`bash
# 기본 안전 스크립트 실행
nmap --script=default 192.168.1.1

# HTTP 관련 스크립트
nmap --script=http-title,http-headers,http-methods 192.168.1.1

# SSH 관련
nmap --script=ssh-auth-methods,ssh-hostkey 192.168.1.1

# SSL/TLS 점검
nmap --script=ssl-enum-ciphers -p 443 192.168.1.1

# 알려진 취약점 스캔 (vuln 카테고리)
sudo nmap --script=vuln 192.168.1.1

# Heartbleed 확인
nmap --script=ssl-heartbleed -p 443 192.168.1.1
\`\`\`

---

## 결과 저장

\`\`\`bash
# 일반 텍스트
nmap -oN result.txt 192.168.1.1

# XML (파싱용)
nmap -oX result.xml 192.168.1.1

# 세 가지 형식 동시
nmap -oA result 192.168.1.1   # result.nmap, result.xml, result.gnmap

# grep 가능 형식
nmap -oG result.gnmap 192.168.1.1
\`\`\`

---

## 스캔 속도 조절 (탐지 회피 / 네트워크 부하)

\`\`\`bash
# T0~T5 (0=가장 느림, 5=가장 빠름, 기본 T3)
nmap -T1 192.168.1.1    # 느리고 은밀 (IDS 회피)
nmap -T4 192.168.1.1    # 빠름 (내부망 점검)
nmap -T5 192.168.1.1    # 최대 속도 (네트워크 영향 있음)
\`\`\`

---

## 실무 보안 점검 워크플로

\`\`\`bash
# 1. 열린 포트 확인
sudo nmap -p- -T4 localhost

# 2. 불필요한 포트가 있다면 닫기
sudo systemctl stop 불필요한서비스
sudo ufw deny 포트번호

# 3. 서비스 버전 확인 (구버전 → 업데이트)
sudo nmap -sV localhost

# 4. 주기적 점검 스크립트
sudo nmap -oN /var/log/nmap-$(date +%Y%m%d).txt localhost
\`\`\``,
  },

  {
    title: 'AppArmor 기초 — 프로세스 권한 제한 실전 가이드',
    slug: 'apparmor-basics-guide',
    summary: 'AppArmor 모드 이해, 기존 프로파일 적용·비활성화, 새 프로파일 생성(aa-genprof), 로그 분석, Nginx·MySQL 프로파일 예시를 설명합니다.',
    category: '보안 설정',
    tags: ['apparmor', '보안', 'mac', '프로파일', 'linux', '컨테이너'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian'],
    author: 'Nodelog',
    content: `## AppArmor란?

Linux의 MAC(Mandatory Access Control) 보안 모듈로, 프로세스가 접근할 수 있는 파일·네트워크·기능을 프로파일로 제한합니다. Ubuntu의 기본 보안 모듈입니다.

---

## 설치 및 상태 확인

\`\`\`bash
# 대부분의 Ubuntu에는 기본 설치됨
sudo apt install -y apparmor apparmor-utils

# 상태 확인
sudo aa-status
sudo apparmor_status

# 로드된 프로파일 목록
sudo aa-status | grep -A100 "profiles are loaded"
\`\`\`

---

## 3가지 모드

| 모드 | 설명 |
|---|---|
| **enforce** | 정책 위반 시 차단 + 로그 |
| **complain** | 차단하지 않고 로그만 기록 (개발·테스트용) |
| **disabled** | AppArmor 비활성화 |

\`\`\`bash
# 특정 프로파일을 complain 모드로
sudo aa-complain /usr/sbin/nginx

# enforce 모드로 전환
sudo aa-enforce /usr/sbin/nginx

# 특정 프로파일 비활성화
sudo aa-disable /usr/sbin/nginx

# 모든 프로파일 확인
sudo aa-status --verbose
\`\`\`

---

## 기존 프로파일 관리

\`\`\`bash
# 프로파일 위치
ls /etc/apparmor.d/

# 프로파일 로드 (파일 수정 후)
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx

# 전체 프로파일 재로드
sudo systemctl reload apparmor

# 특정 프로파일 언로드
sudo apparmor_parser -R /etc/apparmor.d/usr.sbin.nginx
\`\`\`

---

## 새 프로파일 생성 (aa-genprof)

\`\`\`bash
# 프로파일 자동 생성 (프로그램 실행하며 학습)
sudo aa-genprof /usr/local/bin/myapp

# 1. 다른 터미널에서 myapp 실행 및 테스트
# 2. aa-genprof 프롬프트에서 S(scan) 입력
# 3. 각 접근에 대해 Allow/Deny 선택
# 4. F(finish)로 완료
\`\`\`

---

## 프로파일 수동 작성 예시

\`\`\`
# /etc/apparmor.d/usr.sbin.nginx
#include <tunables/global>

/usr/sbin/nginx {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  capability net_bind_service,
  capability setuid,
  capability setgid,

  # 실행 파일
  /usr/sbin/nginx mr,

  # 설정 파일 읽기
  /etc/nginx/** r,

  # 로그 쓰기
  /var/log/nginx/ rw,
  /var/log/nginx/** rw,

  # 웹 루트 읽기
  /var/www/html/** r,

  # PID 파일
  /run/nginx.pid rw,

  # 소켓
  network inet stream,
  network inet6 stream,

  # 차단: 다른 모든 접근
}
\`\`\`

\`\`\`bash
# 프로파일 적용
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.nginx
sudo aa-enforce /usr/sbin/nginx
\`\`\`

---

## 로그 분석

\`\`\`bash
# AppArmor 거부 로그
sudo dmesg | grep -i apparmor
sudo journalctl -k | grep "apparmor.*DENIED"

# audit 로그
sudo grep "apparmor" /var/log/syslog | tail -30
sudo grep "apparmor" /var/log/kern.log | tail -30

# complain 모드로 배운 내용을 프로파일에 추가
sudo aa-logprof   # 로그를 분석해 자동으로 규칙 제안
\`\`\``,
  },

  {
    title: 'rsyslog로 로그 중앙화 — 원격 수집과 필터링',
    slug: 'rsyslog-centralized-logging',
    summary: 'rsyslog로 여러 서버의 로그를 중앙 서버에 수집하고, 필터링·파싱·전달 규칙을 설정하며, Elasticsearch·파일로 로그를 라우팅하는 방법을 설명합니다.',
    category: '보안 설정',
    tags: ['rsyslog', '로그중앙화', 'syslog', '모니터링', '보안', 'logging'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## rsyslog 구조

\`\`\`
[원격 서버들] → rsyslog (UDP/TCP 514) → [중앙 로그 서버]
                                              ↓
                                    /var/log/ 또는 DB/ES
\`\`\`

---

## 설치 및 기본 설정

\`\`\`bash
sudo apt install -y rsyslog rsyslog-elasticsearch

# 상태 확인
sudo systemctl status rsyslog

# 설정 파일
/etc/rsyslog.conf                  # 메인 설정
/etc/rsyslog.d/*.conf              # 추가 설정 (여기서 관리 권장)
\`\`\`

---

## 중앙 로그 서버 설정 (수신)

\`\`\`bash
# /etc/rsyslog.d/00-server.conf

# UDP 514 수신 활성화
module(load="imudp")
input(type="imudp" port="514")

# TCP 514 수신 (신뢰성 높음)
module(load="imtcp")
input(type="imtcp" port="514")

# 원격 호스트별 파일 분리 저장
template(name="RemoteLog" type="string"
  string="/var/log/remote/%HOSTNAME%/%PROGRAMNAME%.log")

*.* ?RemoteLog
\`\`\`

\`\`\`bash
# 방화벽 허용
sudo ufw allow 514/udp
sudo ufw allow 514/tcp

sudo systemctl restart rsyslog
\`\`\`

---

## 클라이언트 서버 설정 (전송)

\`\`\`bash
# /etc/rsyslog.d/50-remote.conf

# UDP로 전송
*.* @192.168.1.100:514

# TCP로 전송 (더 신뢰성 높음, @@ 사용)
*.* @@192.168.1.100:514

# 큐 사용 (서버 다운 시 로컬 보관 후 재전송)
action(type="omfwd"
  target="192.168.1.100"
  port="514"
  protocol="tcp"
  action.resumeRetryCount="100"
  queue.type="linkedList"
  queue.size="10000"
  queue.filename="remote-fwd"
  queue.maxDiskSpace="1g"
  queue.saveOnShutdown="on")
\`\`\`

---

## 필터링 규칙

\`\`\`bash
# 우선순위(severity) 기준 필터
# auth.* → SSH, sudo 등 인증 로그
# kern.* → 커널 로그
# *.emerg → 긴급 메시지 모두

# /etc/rsyslog.d/10-filters.conf

# 보안 로그 별도 파일
auth,authpriv.*                /var/log/auth.log

# 에러 이상만 중앙 서버로
*.err                          @@192.168.1.100:514

# 특정 프로그램 로그
:programname, isequal, "nginx" /var/log/nginx-syslog.log

# 특정 문자열 포함
:msg, contains, "CRITICAL"    /var/log/critical.log

# 특정 호스트
:fromhost-ip, isequal, "10.0.0.5" /var/log/specific-host.log
\`\`\`

---

## 애플리케이션 로그를 syslog로 전송

\`\`\`bash
# logger 명령으로 테스트
logger -p local0.info "Test message from myapp"
logger -p auth.warning "Failed login attempt" -t myapp

# 앱에서 syslog 사용 (Python)
import logging, logging.handlers
handler = logging.handlers.SysLogHandler(address='/dev/log')
handler.setFormatter(logging.Formatter('myapp: %(message)s'))
logging.getLogger().addHandler(handler)
logging.warning("Something went wrong")
\`\`\`

---

## 로그 로테이션 설정

\`\`\`
# /etc/logrotate.d/remote-logs
/var/log/remote/*/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate
    endscript
}
\`\`\`

---

## 설정 검증

\`\`\`bash
# 설정 문법 검사
sudo rsyslogd -N1

# 재시작 없이 설정 재로드
sudo kill -HUP $(cat /var/run/rsyslogd.pid)
sudo systemctl reload rsyslog

# 동작 확인
logger "test message"
tail -f /var/log/syslog
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
