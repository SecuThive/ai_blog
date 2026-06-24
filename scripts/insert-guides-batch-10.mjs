import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── 데이터베이스 ────────────────────────────────────────
  {
    title: 'MySQL 기초 — 설치·사용자·권한·기본 쿼리',
    slug: 'mysql-basics-setup-guide',
    summary: 'MySQL 설치, root 보안 설정, 사용자·DB 생성, 권한 부여, 기본 CRUD 쿼리, 설정 파일 튜닝까지 MySQL 운영 기초를 설명합니다.',
    category: '데이터베이스',
    tags: ['mysql', 'mariadb', '데이터베이스', 'sql', '설치', '권한'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 설치

\`\`\`bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y mysql-server
sudo systemctl enable --now mysql

# CentOS / RHEL (MariaDB)
sudo yum install -y mariadb-server
sudo systemctl enable --now mariadb

# 버전 확인
mysql --version
\`\`\`

---

## 초기 보안 설정

\`\`\`bash
# 보안 마법사 실행 (root 패스워드, 익명 사용자 제거 등)
sudo mysql_secure_installation

# root 접속 (Ubuntu — 소켓 인증)
sudo mysql -u root

# root 접속 (패스워드 인증)
mysql -u root -p
\`\`\`

---

## 사용자 · 데이터베이스 생성

\`\`\`sql
-- 데이터베이스 생성
CREATE DATABASE myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'StrongPass123!';
CREATE USER 'appuser'@'%' IDENTIFIED BY 'StrongPass123!';  -- 원격 허용

-- 권한 부여
GRANT ALL PRIVILEGES ON myapp.* TO 'appuser'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON myapp.* TO 'appuser'@'%';

-- 적용
FLUSH PRIVILEGES;

-- 사용자·권한 확인
SELECT user, host FROM mysql.user;
SHOW GRANTS FOR 'appuser'@'localhost';

-- 권한 제거 / 사용자 삭제
REVOKE ALL PRIVILEGES ON myapp.* FROM 'appuser'@'localhost';
DROP USER 'appuser'@'localhost';
\`\`\`

---

## 기본 관리 명령

\`\`\`sql
-- DB 목록
SHOW DATABASES;

-- DB 선택
USE myapp;

-- 테이블 목록
SHOW TABLES;

-- 테이블 구조
DESCRIBE users;
SHOW CREATE TABLE users;

-- 프로세스 목록 (실행 중인 쿼리)
SHOW PROCESSLIST;

-- 슬로우 쿼리 확인
SHOW STATUS LIKE 'Slow_queries';
SHOW VARIABLES LIKE 'slow_query%';
\`\`\`

---

## 테이블 생성 · CRUD

\`\`\`sql
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  status     ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSERT
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
INSERT INTO users (name, email) VALUES
  ('Bob', 'bob@example.com'),
  ('Carol', 'carol@example.com');

-- SELECT
SELECT * FROM users WHERE status = 'active' ORDER BY created_at DESC LIMIT 10;
SELECT u.name, COUNT(o.id) AS orders
FROM users u LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id HAVING orders > 0;

-- UPDATE
UPDATE users SET status = 'inactive' WHERE id = 2;

-- DELETE
DELETE FROM users WHERE status = 'inactive' AND created_at < NOW() - INTERVAL 30 DAY;
\`\`\`

---

## 설정 파일 튜닝 (/etc/mysql/mysql.conf.d/mysqld.cnf)

\`\`\`ini
[mysqld]
# 기본 설정
character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci

# 연결
max_connections      = 200
connect_timeout      = 10

# InnoDB 버퍼 풀 (총 메모리의 50~70%)
innodb_buffer_pool_size = 1G

# 슬로우 쿼리 로그
slow_query_log       = 1
slow_query_log_file  = /var/log/mysql/slow.log
long_query_time      = 1      # 1초 이상

# 바이너리 로그 (복제·PITR용)
log_bin              = /var/log/mysql/mysql-bin
expire_logs_days     = 7
\`\`\`

\`\`\`bash
# 설정 적용
sudo systemctl restart mysql

# 설정 값 확인
mysql -u root -p -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';"
\`\`\``,
  },

  {
    title: 'PgBouncer 연결 풀링 — PostgreSQL 성능 최적화',
    slug: 'pgbouncer-connection-pooling',
    summary: 'PgBouncer 설치·설정, 풀링 모드(session/transaction/statement) 선택, 사용자 인증, 모니터링 쿼리로 PostgreSQL 연결 수를 줄이고 성능을 높이는 방법을 설명합니다.',
    category: '데이터베이스',
    tags: ['pgbouncer', 'postgresql', '연결풀링', '성능', 'postgres'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## PgBouncer가 필요한 이유

PostgreSQL은 연결당 약 5~10MB 메모리를 사용합니다. 수백 개의 앱 연결이 동시에 열리면:
- 메모리 부족
- 컨텍스트 스위칭 오버헤드
- 연결 한도(max_connections) 초과

PgBouncer는 앱 ↔ DB 사이에서 연결을 재사용(풀링)합니다.

---

## 설치

\`\`\`bash
# Ubuntu / Debian
sudo apt install -y pgbouncer

# 상태 확인
sudo systemctl status pgbouncer
\`\`\`

---

## 풀링 모드 선택

| 모드 | 설명 | 권장 상황 |
|---|---|---|
| **session** | 클라이언트 세션 동안 연결 유지 | SET 명령·임시 테이블 사용 시 |
| **transaction** | 트랜잭션 동안만 연결 할당 | 대부분의 웹 앱 **(권장)** |
| **statement** | 쿼리 하나에만 연결 할당 | 트랜잭션 없는 단순 쿼리 |

---

## pgbouncer.ini 설정

\`\`\`ini
# /etc/pgbouncer/pgbouncer.ini

[databases]
; 데이터베이스 별칭 = 연결 정보
myapp = host=127.0.0.1 port=5432 dbname=myapp
; 원격 서버 연결
myapp_prod = host=db.example.com port=5432 dbname=myapp

[pgbouncer]
listen_addr    = 127.0.0.1       ; 리슨 주소 (외부 노출 시 0.0.0.0)
listen_port    = 6432            ; PgBouncer 포트
auth_type      = md5             ; 인증 방식
auth_file      = /etc/pgbouncer/userlist.txt

pool_mode      = transaction     ; 풀링 모드
max_client_conn = 1000           ; 최대 클라이언트 연결 수
default_pool_size = 25           ; DB당 연결 풀 크기
min_pool_size   = 5
reserve_pool_size = 5

; 로그
logfile        = /var/log/postgresql/pgbouncer.log
pidfile        = /var/run/postgresql/pgbouncer.pid

; 타임아웃
server_idle_timeout = 600
client_idle_timeout = 0
query_timeout       = 0

; 관리자
admin_users    = postgres
stats_users    = monitor
\`\`\`

---

## 사용자 인증 설정

\`\`\`bash
# userlist.txt 형식: "사용자명" "패스워드 해시"

# PostgreSQL에서 해시 추출
sudo -u postgres psql -c "SELECT usename, passwd FROM pg_shadow WHERE usename = 'appuser';"

# /etc/pgbouncer/userlist.txt
echo '"appuser" "md5해시값"' | sudo tee /etc/pgbouncer/userlist.txt
echo '"postgres" "md5해시값"' | sudo tee -a /etc/pgbouncer/userlist.txt

# 권한 설정
sudo chmod 640 /etc/pgbouncer/userlist.txt
sudo chown postgres:postgres /etc/pgbouncer/userlist.txt

# 재시작
sudo systemctl restart pgbouncer
\`\`\`

---

## 앱에서 PgBouncer 연결

\`\`\`
# 기존 PostgreSQL 연결
postgresql://appuser:pass@localhost:5432/myapp

# PgBouncer 경유 연결 (포트만 변경)
postgresql://appuser:pass@localhost:6432/myapp
\`\`\`

---

## 모니터링

\`\`\`bash
# PgBouncer 관리 콘솔 접속
psql -h 127.0.0.1 -p 6432 -U postgres pgbouncer

# 풀 상태
SHOW POOLS;
# database | user | cl_active | cl_waiting | sv_active | sv_idle

# 통계
SHOW STATS;

# 클라이언트 목록
SHOW CLIENTS;

# 서버(DB) 연결 목록
SHOW SERVERS;

# 설정 재로드 (pgbouncer.ini 변경 후)
RELOAD;

# 연결 종료 없이 설정 갱신
RELOAD;
\`\`\`

---

## 튜닝 가이드

\`\`\`ini
; 웹 앱 (100 동시 접속, DB max_connections=100)
pool_mode         = transaction
max_client_conn   = 500
default_pool_size = 20     ; PgBouncer → PostgreSQL 연결 수
min_pool_size     = 5
reserve_pool_size = 5
\`\`\`

**실제 PostgreSQL 연결 수** = \`default_pool_size × DB 수\`
**클라이언트 수** = \`max_client_conn\`
→ 500개 앱 연결을 20개 DB 연결로 처리`,
  },

  {
    title: '슬로우 쿼리 분석 — pg_stat_statements · MySQL slow log',
    slug: 'database-slow-query-analysis',
    summary: 'PostgreSQL pg_stat_statements로 느린 쿼리를 찾고, MySQL slow query log와 EXPLAIN ANALYZE로 인덱스 문제를 진단해 쿼리를 최적화하는 방법을 설명합니다.',
    category: '데이터베이스',
    tags: ['슬로우쿼리', 'pg_stat_statements', 'explain', 'mysql', 'postgresql', '성능'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## PostgreSQL — pg_stat_statements

\`\`\`sql
-- 확장 활성화 (postgresql.conf)
-- shared_preload_libraries = 'pg_stat_statements'

-- DB에서 확장 설치
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 설정 확인
SHOW shared_preload_libraries;
\`\`\`

\`\`\`bash
# postgresql.conf 수정
sudo nano /etc/postgresql/16/main/postgresql.conf

# 추가:
# shared_preload_libraries = 'pg_stat_statements'
# pg_stat_statements.track = all
# pg_stat_statements.max = 10000

sudo systemctl restart postgresql
\`\`\`

---

## 느린 쿼리 Top 10 찾기 (PostgreSQL)

\`\`\`sql
-- 평균 실행 시간 기준 Top 10
SELECT
  round(mean_exec_time::numeric, 2) AS avg_ms,
  calls,
  round(total_exec_time::numeric, 2) AS total_ms,
  rows,
  left(query, 80) AS query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 총 실행 시간 기준 (가장 영향 큰 쿼리)
SELECT
  round(total_exec_time::numeric / 1000, 2) AS total_sec,
  calls,
  round(mean_exec_time::numeric, 2) AS avg_ms,
  left(query, 80) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- I/O 많은 쿼리
SELECT
  left(query, 80),
  shared_blks_read,
  shared_blks_hit,
  round(shared_blks_hit * 100.0 / nullif(shared_blks_hit + shared_blks_read, 0), 1) AS hit_rate
FROM pg_stat_statements
ORDER BY shared_blks_read DESC
LIMIT 10;

-- 통계 초기화
SELECT pg_stat_statements_reset();
\`\`\`

---

## EXPLAIN ANALYZE — 실행 계획 분석

\`\`\`sql
-- 기본 실행 계획
EXPLAIN SELECT * FROM users WHERE email = 'alice@example.com';

-- 실제 실행 + 통계
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id)
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.name
ORDER BY COUNT(o.id) DESC;
\`\`\`

### 실행 계획 주요 포인트

\`\`\`
Seq Scan     → 순차 스캔 (느림, 인덱스 필요)
Index Scan   → 인덱스 사용 (빠름)
Bitmap Scan  → 중간 정도
Hash Join    → 대용량 조인
Nested Loop  → 소용량 조인

Actual Rows >> Estimated Rows → 통계 오래됨
cost=0..1234 → 실행 비용 추정
actual time=0.1..500 ms → 실제 시간
\`\`\`

\`\`\`sql
-- 통계 갱신
ANALYZE users;
ANALYZE VERBOSE users;
\`\`\`

---

## MySQL — Slow Query Log

\`\`\`ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
slow_query_log       = 1
slow_query_log_file  = /var/log/mysql/slow.log
long_query_time      = 1          # 1초 이상
log_queries_not_using_indexes = 1 # 인덱스 안 쓰는 쿼리도 기록
\`\`\`

\`\`\`bash
sudo systemctl restart mysql

# 실시간 모니터링
sudo tail -f /var/log/mysql/slow.log

# mysqldumpslow로 분석
sudo mysqldumpslow -s t -t 10 /var/log/mysql/slow.log   # 총 시간 기준 Top 10
sudo mysqldumpslow -s c -t 10 /var/log/mysql/slow.log   # 호출 횟수 기준
\`\`\`

---

## MySQL EXPLAIN

\`\`\`sql
EXPLAIN SELECT u.name, COUNT(o.id)
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.name;

-- 주요 컬럼
-- type: ALL(풀스캔) < index < range < ref < eq_ref < const (좋아짐)
-- key: 사용된 인덱스
-- rows: 검사 예상 행 수
-- Extra: Using filesort, Using temporary → 성능 문제
\`\`\`

---

## 공통 최적화 패턴

\`\`\`sql
-- 1. 인덱스 없는 WHERE 조건 → 인덱스 추가
CREATE INDEX idx_users_status_email ON users(status, email);

-- 2. SELECT * → 필요한 컬럼만
SELECT id, name FROM users WHERE status = 'active';

-- 3. N+1 문제 → JOIN으로 해결
-- 나쁜 예: 루프에서 각 유저마다 쿼리
-- 좋은 예:
SELECT u.id, u.name, o.id, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active';

-- 4. OFFSET 대신 커서 페이징
-- 나쁜 예: LIMIT 10 OFFSET 10000
-- 좋은 예:
SELECT * FROM users WHERE id > 10000 ORDER BY id LIMIT 10;
\`\`\``,
  },

  // ── 트러블슈팅 ──────────────────────────────────────────
  {
    title: 'I/O 병목 진단 — iostat · iotop · blktrace',
    slug: 'io-bottleneck-diagnosis',
    summary: 'iostat으로 디스크 I/O 사용률을 파악하고, iotop으로 I/O 과부하 프로세스를 찾으며, blktrace와 fio로 스토리지 성능을 측정하는 방법을 설명합니다.',
    category: '트러블슈팅',
    tags: ['iostat', 'iotop', 'io', '디스크', '성능', '트러블슈팅'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## I/O 병목 증상

- CPU가 낮은데 서버가 느림
- \`vmstat\`에서 \`wa\`(wait) 지속적으로 높음
- 응답 시간이 불규칙하게 급증

---

## 1단계 — vmstat으로 wa 확인

\`\`\`bash
vmstat 2 10
# procs  ----------memory---------- --swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si  so    bi    bo   in   cs us sy id wa st
#  1  3      0  512M    20M   1.5G    0   0   8000  4000  500 1000  5  2  3 90  0
#                                                             ↑↑↑↑
# wa=90: CPU가 I/O 완료를 기다리는 중 — 명백한 I/O 병목
\`\`\`

---

## 2단계 — iostat으로 디스크 상태 분석

\`\`\`bash
sudo apt install -y sysstat

# 2초 간격, 5회
iostat -xz 2 5

# 주요 컬럼 해석
# %util: 디스크 사용률 (100%에 가까우면 포화)
# await: 평균 I/O 응답 시간 (ms) — 일반 HDD: <20ms, SSD: <1ms
# r/s, w/s: 초당 읽기/쓰기 요청 수
# rkB/s, wkB/s: 초당 읽기/쓰기 처리량 (KB)
# svctm: 서비스 시간 (await - 큐 대기시간)

# 특정 디바이스만
iostat -x sda sdb 2

# 디스크별 읽기/쓰기 비율
iostat -d -k 2 | grep -v "^$"
\`\`\`

---

## 3단계 — iotop으로 원인 프로세스 찾기

\`\`\`bash
sudo apt install -y iotop

# 인터랙티브 모드
sudo iotop

# I/O 사용 중인 프로세스만 표시 (-o)
sudo iotop -o

# 1회 스냅샷
sudo iotop -b -n 3 | head -20

# 단축키
# o: 활성 프로세스만 토글
# p: 프로세스/스레드 전환
# a: 누적 I/O 토글
\`\`\`

---

## 4단계 — 프로세스별 I/O 상세 (pidstat)

\`\`\`bash
# 특정 프로세스 I/O 추적
pidstat -d -p 1234 2 5

# 모든 프로세스 I/O
pidstat -d 2 5 | sort -k4 -rn | head -10

# 열린 파일 확인 (어떤 파일에 I/O 중인지)
sudo lsof -p 1234 | grep -E "REG|DIR"
sudo ls -la /proc/1234/fd
\`\`\`

---

## 5단계 — fio로 디스크 성능 측정

\`\`\`bash
sudo apt install -y fio

# 순차 읽기 성능
fio --name=seq-read --ioengine=libaio --iodepth=32 \
  --rw=read --bs=128k --direct=1 --size=1G \
  --numjobs=1 --runtime=30 --filename=/tmp/fio-test

# 랜덤 읽기/쓰기 (IOPS 측정 — SSD 성능 지표)
fio --name=rand-rw --ioengine=libaio --iodepth=32 \
  --rw=randrw --bs=4k --direct=1 --size=1G \
  --numjobs=4 --runtime=30 --filename=/tmp/fio-test \
  --group_reporting

# 결과 해석
# READ: IOPS=50k, BW=200MiB/s (SSD 정상)
# IOPS<1000 이면 HDD 수준
\`\`\`

---

## 6단계 — 해결 방법

\`\`\`bash
# DB 쓰기 부하 → 버퍼 풀 증가
# PostgreSQL: shared_buffers = 총 메모리의 25%
# MySQL: innodb_buffer_pool_size = 총 메모리의 50-70%

# 로그 I/O 많음 → 비동기 커밋
# PostgreSQL: synchronous_commit = off (데이터 손실 위험 있음)

# 디스크 캐시 확인
free -h
# buff/cache 많으면 OS가 캐시 활용 중 — 정상

# I/O 스케줄러 변경 (SSD에는 none 또는 mq-deadline)
cat /sys/block/sda/queue/scheduler
echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler
\`\`\``,
  },

  {
    title: 'DNS 해석 오류 진단 — nslookup · dig · systemd-resolved',
    slug: 'dns-resolution-troubleshoot',
    summary: 'DNS 조회 실패, 캐시 오염, 잘못된 nameserver 설정 등 DNS 관련 문제를 nslookup·dig·host·systemd-resolved로 진단하고 해결하는 방법을 설명합니다.',
    category: '트러블슈팅',
    tags: ['dns', 'nslookup', 'dig', '트러블슈팅', 'systemd-resolved', '네트워크'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## DNS 오류 증상

- \`curl: Could not resolve host: example.com\`
- \`ssh: Could not resolve hostname\`
- 브라우저에서 특정 사이트만 접속 안 됨
- ping은 되는데 도메인으로 접속 안 됨

---

## 기본 확인 도구

\`\`\`bash
# 현재 DNS 서버 확인
cat /etc/resolv.conf
# nameserver 8.8.8.8
# nameserver 1.1.1.1

# 기본 DNS 조회 (nslookup)
nslookup google.com
nslookup google.com 8.8.8.8    # 특정 DNS 서버로 조회

# host 명령
host google.com
host google.com 1.1.1.1

# 역방향 조회 (IP → 도메인)
nslookup 8.8.8.8
host 8.8.8.8
\`\`\`

---

## dig — 상세 DNS 분석

\`\`\`bash
# A 레코드 조회
dig google.com

# 특정 레코드 타입
dig google.com A
dig google.com AAAA      # IPv6
dig google.com MX        # 메일 서버
dig google.com TXT       # SPF, DKIM 등
dig google.com NS        # 네임서버
dig google.com CNAME     # 별칭

# 특정 DNS 서버로 조회 (@)
dig @8.8.8.8 google.com
dig @1.1.1.1 google.com

# 짧은 출력 (+short)
dig +short google.com
dig +short google.com MX

# 전파 확인 (여러 DNS에서 조회)
for ns in 8.8.8.8 1.1.1.1 9.9.9.9 208.67.222.222; do
  echo -n "$ns: "; dig +short @$ns example.com
done

# 추적 (루트 → TLD → 권한 서버 순서)
dig +trace google.com
\`\`\`

---

## systemd-resolved (Ubuntu 18.04+)

\`\`\`bash
# 현재 DNS 설정 확인
resolvectl status
resolvectl dns

# 특정 도메인 조회
resolvectl query google.com

# DNS 캐시 초기화
sudo resolvectl flush-caches

# 통계
resolvectl statistics

# DNS 서버 임시 변경
sudo resolvectl dns eth0 8.8.8.8 1.1.1.1
\`\`\`

---

## 흔한 DNS 문제와 해결

### 문제 1: /etc/resolv.conf가 비어있거나 잘못됨

\`\`\`bash
cat /etc/resolv.conf

# 임시 수정
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee -a /etc/resolv.conf

# Ubuntu 영구 설정 (systemd-resolved 사용)
sudo nano /etc/systemd/resolved.conf
# [Resolve]
# DNS=8.8.8.8 1.1.1.1
# FallbackDNS=9.9.9.9
sudo systemctl restart systemd-resolved
\`\`\`

### 문제 2: 특정 도메인만 안 됨 (캐시 오염)

\`\`\`bash
# DNS 캐시 초기화
sudo resolvectl flush-caches             # systemd-resolved
sudo systemd-resolve --flush-caches

# nscd 캐시 초기화 (설치된 경우)
sudo systemctl restart nscd

# 직접 DNS 서버로 조회해서 비교
dig @8.8.8.8 example.com
dig @로컬DNS서버 example.com
\`\`\`

### 문제 3: 내부 DNS 서버 못 찾음

\`\`\`bash
# VPN/사내망에서 내부 도메인 해석 안 될 때
# search 도메인 설정 확인
cat /etc/resolv.conf | grep search

# 특정 도메인에 다른 DNS 사용 (systemd-resolved)
# /etc/systemd/resolved.conf.d/internal.conf
# [Resolve]
# DNS=10.0.0.1
# Domains=internal.example.com
\`\`\`

### 문제 4: TTL 전파 대기

\`\`\`bash
# TTL 확인 (레코드 만료까지 대기 시간)
dig google.com | grep -A1 "ANSWER SECTION"
# google.com. 299 IN A 142.250.196.110
#             ↑ 299초 후 캐시 만료

# 새 레코드 전파 확인
dig +short @ns1.registrar.com yourdomain.com
dig +short @8.8.8.8 yourdomain.com
\`\`\`

---

## 점검 체크리스트

\`\`\`bash
# 1. 기본 인터넷 연결 확인
ping -c 3 8.8.8.8

# 2. DNS 해석 확인
dig +short @8.8.8.8 google.com

# 3. 로컬 DNS 서버 확인
dig +short google.com

# 4. /etc/hosts 확인 (강제 오버라이드 여부)
cat /etc/hosts | grep -v "^#" | grep -v "^$"

# 5. DNS 서버 응답 속도
dig @8.8.8.8 google.com | grep "Query time"
\`\`\``,
  },

  {
    title: '좀비 프로세스 · OOM Killer — 진단과 방지',
    slug: 'zombie-process-oom-killer-fix',
    summary: '좀비 프로세스 발생 원인과 부모 프로세스 찾아 해결하는 방법, OOM Killer 동작 확인·방지·우선순위 조정, cgroup으로 메모리 제한하는 방법을 설명합니다.',
    category: '트러블슈팅',
    tags: ['좀비프로세스', 'oom', 'oom-killer', 'cgroup', '트러블슈팅', 'linux'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 좀비 프로세스 (Z state)

좀비는 실행이 끝났지만 부모가 \`wait()\`를 호출하지 않아 프로세스 테이블에 남은 상태입니다. 시스템 자원을 거의 사용하지 않지만 PID를 점유합니다.

---

## 좀비 프로세스 확인

\`\`\`bash
# 좀비 프로세스 목록
ps aux | grep -w Z
# USER PID %CPU %MEM ... STAT ... COMMAND
# www-data 1234 0.0 0.0 ... Z+  ... [nginx] <defunct>

# 수 확인
ps aux | awk '{print $8}' | grep Z | wc -l

# top에서 확인
top
# Tasks: 150 total, 1 running, 148 sleeping, 0 stopped, 1 zombie
\`\`\`

---

## 좀비의 부모 프로세스 찾기

\`\`\`bash
# 좀비 PID 확인 후 부모 찾기
ps -o ppid= -p <좀비_PID>

# 부모 프로세스 이름 확인
ps -p <부모_PID> -o comm=

# 트리 형태로 보기
pstree -p | grep -B5 defunct
\`\`\`

---

## 해결 방법

\`\`\`bash
# 방법 1: 부모 프로세스를 정상 재시작 (권장)
# 부모가 재시작되면 init(1)이 wait()를 호출해 좀비 정리
sudo systemctl restart nginx    # 예: nginx 워커 좀비

# 방법 2: 부모에 SIGCHLD 신호 전송 (wait() 강제 호출)
kill -SIGCHLD <부모_PID>

# 방법 3: 부모 종료 (자식 좀비는 init이 정리)
kill -TERM <부모_PID>

# 방법 4: 마지막 수단 — 부모 강제 종료
kill -9 <부모_PID>
\`\`\`

좀비 자체를 kill -9로 죽일 수는 없습니다. 반드시 부모 프로세스를 통해 해결해야 합니다.

---

## OOM Killer 확인

메모리 부족 시 커널이 프로세스를 강제 종료합니다.

\`\`\`bash
# OOM Killer 발생 확인
dmesg | grep -E "Out of memory|oom_kill|Killed process"
sudo journalctl -k | grep -i oom

# 어떤 프로세스가 종료됐는지
dmesg | grep "Killed process"
# Killed process 1234 (myapp) total-vm:512000kB, anon-rss:450000kB

# OOM 시점 메모리 덤프
dmesg | grep -A30 "Out of memory"
\`\`\`

---

## OOM Score — 종료 우선순위

\`\`\`bash
# OOM score 확인 (-1000~1000, 높을수록 먼저 종료)
cat /proc/<PID>/oom_score

# oom_score_adj 조정 (-1000~1000)
# -1000 = OOM Killer 완전 제외
# 0 = 기본
# +1000 = 가장 먼저 종료

# 중요 프로세스 보호
echo -1000 | sudo tee /proc/$(pgrep postgres)/oom_score_adj

# 덜 중요한 프로세스 먼저 종료
echo 500 | sudo tee /proc/$(pgrep node)/oom_score_adj

# systemd 서비스 영구 설정
# /etc/systemd/system/myapp.service
# [Service]
# OOMScoreAdjust=-500
\`\`\`

---

## 스왑으로 OOM 예방

\`\`\`bash
# 스왑 파일 추가 (1GB)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 적용
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# swappiness 조정 (0=스왑 최소화, 100=적극 사용)
sudo sysctl vm.swappiness=10
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
\`\`\`

---

## cgroup으로 프로세스 메모리 제한

\`\`\`bash
# systemd 서비스에 메모리 제한
sudo systemctl edit myapp.service

# 추가:
# [Service]
# MemoryMax=512M
# MemoryHigh=400M   # 이 이상이면 스로틀링

sudo systemctl daemon-reload
sudo systemctl restart myapp

# 현재 메모리 한도 확인
sudo systemctl show myapp --property=MemoryMax

# Docker 컨테이너 메모리 제한
docker run --memory=512m --memory-swap=512m myapp
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
