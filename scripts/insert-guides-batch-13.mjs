import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  {
    title: 'MySQL 복제(Replication) — Master-Slave 이중화 완전 가이드',
    slug: 'mysql-replication-master-slave',
    summary: 'MySQL/MariaDB의 binlog 기반 복제로 Master-Slave(Source-Replica) 이중화를 구성하고, GTID·반동기 복제·지연 진단·페일오버까지 실무에 필요한 전 과정을 다룹니다.',
    category: '데이터베이스',
    tags: ['mysql', 'mariadb', 'replication', 'ha', 'binlog'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## MySQL 복제(Replication) 란?

MySQL 복제는 한 서버(Master/Source)의 변경 사항을 다른 서버(Slave/Replica)로 비동기 전파해 데이터를 동일하게 유지하는 내장 기능입니다. 핵심은 **바이너리 로그(binlog)** 입니다. Master는 모든 쓰기 이벤트를 binlog에 기록하고, Replica가 이를 받아 재실행해 같은 상태에 도달합니다.

- **읽기 부하 분산**: 읽기 쿼리를 Replica로 분산
- **고가용성(HA)**: Master 장애 시 Replica를 승격
- **백업 오프로딩**: Replica에서 덤프를 떠 Master 부하 회피

> MySQL 8.0부터 공식 용어가 Master/Slave → Source/Replica로 바뀌었습니다. 이 글은 구버전 호환을 위해 두 표기를 병기합니다.

---

## 복제 토폴로지와 동작 흐름

\`\`\`
[Master] --(binlog write)--> binlog
   |  Dump Thread(전송)
   v
[Replica] -- IO Thread --> relay log -- SQL Thread --> 적용
\`\`\`

| 스레드 | 위치 | 역할 |
|--------|------|------|
| Binlog Dump Thread | Master | Replica에 binlog 이벤트 전송 |
| IO Thread | Replica | 이벤트 수신 → relay log 기록 |
| SQL Thread | Replica | relay log를 읽어 실제 적용 |

binlog 포맷은 \`ROW\`(권장), \`STATEMENT\`, \`MIXED\` 세 가지가 있습니다. 데이터 정합성이 가장 안전한 \`ROW\`를 사용합니다.

---

## 1. Master 설정

\`/etc/mysql/mysql.conf.d/mysqld.cnf\` (또는 \`/etc/my.cnf\`)를 수정합니다.

\`\`\`ini
[mysqld]
# 서버마다 유일해야 함
server-id = 1

# 바이너리 로그 활성화
log_bin = /var/log/mysql/mysql-bin.log
binlog_format = ROW

# GTID 기반 복제(권장)
gtid_mode = ON
enforce_gtid_consistency = ON

# binlog 보관 기간(초) — 7일
binlog_expire_logs_seconds = 604800

# 복제 대상 DB만 기록하고 싶을 때(선택)
# binlog_do_db = appdb
\`\`\`

재시작 후 복제 전용 계정을 만듭니다.

\`\`\`sql
-- Master에서 실행
CREATE USER 'repl'@'192.168.1.%' IDENTIFIED WITH caching_sha2_password BY 'StrongReplPass!2026';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'192.168.1.%';
FLUSH PRIVILEGES;

-- 현재 binlog 위치 확인(비-GTID 방식에서 필요)
SHOW MASTER STATUS\\G
\`\`\`

출력 예시:

\`\`\`
File: mysql-bin.000004
Position: 1547
\`\`\`

> 운영 중인 Master라면 일관된 스냅샷을 위해 \`mysqldump --single-transaction --master-data=2 --source-data=2\` 로 덤프를 뜬 뒤 Replica에 적재해야 합니다.

---

## 2. Replica 설정

\`\`\`ini
[mysqld]
server-id = 2
relay_log = /var/log/mysql/mysql-relay-bin.log
gtid_mode = ON
enforce_gtid_consistency = ON

# Replica를 읽기 전용으로 보호(관리자도 막으려면 super_read_only)
read_only = ON
super_read_only = ON

# 재기동 후 복제 위치를 테이블에 안전 저장
relay_log_recovery = ON
\`\`\`

### GTID 방식 복제 시작 (MySQL 8.0)

\`\`\`sql
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST = '192.168.1.10',
  SOURCE_USER = 'repl',
  SOURCE_PASSWORD = 'StrongReplPass!2026',
  SOURCE_PORT = 3306,
  SOURCE_AUTO_POSITION = 1,
  GET_SOURCE_PUBLIC_KEY = 1;

START REPLICA;
\`\`\`

### 좌표(binlog 위치) 방식 — 구버전/MariaDB 호환

\`\`\`sql
CHANGE MASTER TO
  MASTER_HOST = '192.168.1.10',
  MASTER_USER = 'repl',
  MASTER_PASSWORD = 'StrongReplPass!2026',
  MASTER_LOG_FILE = 'mysql-bin.000004',
  MASTER_LOG_POS = 1547;

START SLAVE;
\`\`\`

---

## 3. 복제 상태 진단

\`\`\`sql
-- MySQL 8.0
SHOW REPLICA STATUS\\G
-- 구버전/MariaDB
SHOW SLAVE STATUS\\G
\`\`\`

확인해야 할 핵심 필드:

| 필드 | 정상 값 | 의미 |
|------|---------|------|
| Replica_IO_Running | Yes | Master 접속/수신 정상 |
| Replica_SQL_Running | Yes | relay log 적용 정상 |
| Seconds_Behind_Source | 0 | 복제 지연(초) |
| Last_IO_Error | (빈 값) | 네트워크/인증 오류 |
| Last_SQL_Error | (빈 값) | 적용 중 SQL 오류 |

IO/SQL 두 스레드가 모두 \`Yes\` 이고 \`Seconds_Behind_Source\` 가 0 또는 낮은 값이면 정상입니다.

---

## 4. 반동기 복제(Semi-Sync)

비동기 복제는 Master가 Replica의 수신을 기다리지 않아 페일오버 시 데이터 유실 가능성이 있습니다. 반동기는 최소 1대의 Replica가 이벤트를 relay log에 받았음을 확인한 뒤 커밋을 완료합니다.

\`\`\`sql
-- Master
INSTALL PLUGIN rpl_semi_sync_source SONAME 'semisync_source.so';
SET GLOBAL rpl_semi_sync_source_enabled = 1;
SET GLOBAL rpl_semi_sync_source_timeout = 1000; -- ms, 초과 시 비동기로 폴백

-- Replica
INSTALL PLUGIN rpl_semi_sync_replica SONAME 'semisync_replica.so';
SET GLOBAL rpl_semi_sync_replica_enabled = 1;
STOP REPLICA IO_THREAD; START REPLICA IO_THREAD;
\`\`\`

> 타임아웃이 지나면 자동으로 비동기로 전환되므로 "반동기는 절대 유실 없음"이 아닙니다. 진짜 무유실이 필요하면 Group Replication/InnoDB Cluster를 검토하세요.

---

## 5. 복제 지연 원인과 대응

| 증상 | 원인 | 대응 |
|------|------|------|
| SQL Thread 적용 지연 | 단일 스레드 적용 | \`replica_parallel_workers\` 로 병렬 적용 |
| 특정 시점 급증 | 대량 배치/ALTER | 야간 배치, pt-online-schema-change |
| IO Thread 지연 | 네트워크 대역 | 압축(\`SOURCE_COMPRESSION_ALGORITHMS\`) |

\`\`\`sql
-- 병렬 복제 활성화(논리 클록 기반)
STOP REPLICA SQL_THREAD;
SET GLOBAL replica_parallel_type = 'LOGICAL_CLOCK';
SET GLOBAL replica_parallel_workers = 4;
SET GLOBAL replica_preserve_commit_order = ON;
START REPLICA SQL_THREAD;
\`\`\`

---

## 6. 깨진 복제 복구

데이터 충돌로 SQL Thread가 멈춘 경우, 원인을 파악한 뒤 GTID 단위로 건너뜁니다.

\`\`\`sql
-- 충돌 이벤트의 GTID 확인 후, 빈 트랜잭션을 주입해 스킵
SET GTID_NEXT = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee:42';
BEGIN; COMMIT;
SET GTID_NEXT = 'AUTOMATIC';
START REPLICA;
\`\`\`

> 이벤트 스킵은 데이터 불일치를 남깁니다. 근본 원인을 확인하고, 정합성이 의심되면 \`pt-table-checksum\` 으로 Master-Replica를 비교하세요.

---

## 7. 페일오버 (수동 승격)

Master 장애 시 Replica를 새 Master로 승격하는 기본 절차입니다.

\`\`\`sql
-- 1) 승격할 Replica에서 복제 중단 및 정보 정리
STOP REPLICA;
RESET REPLICA ALL;

-- 2) 읽기 전용 해제
SET GLOBAL super_read_only = OFF;
SET GLOBAL read_only = OFF;
\`\`\`

이후 애플리케이션의 DB 엔드포인트를 새 Master로 전환합니다. 자동화가 필요하면 **Orchestrator**, **MHA**, ProxySQL/MySQL Router 같은 도구를 함께 사용합니다.

---

## 정리

| 항목 | 권장 설정 |
|------|-----------|
| binlog 포맷 | ROW |
| 복제 좌표 | GTID(SOURCE_AUTO_POSITION=1) |
| Replica 보호 | super_read_only = ON |
| 데이터 유실 방지 | 반동기 + 타임아웃 짧게 |
| 적용 성능 | 병렬 복제(LOGICAL_CLOCK) |
| 정합성 점검 | pt-table-checksum 정기 실행 |
| 자동 페일오버 | Orchestrator / MHA / Router |

MySQL 복제는 binlog → Dump → IO → SQL의 흐름만 정확히 이해하면 진단이 명확해집니다. GTID와 반동기, 병렬 복제를 조합하면 읽기 분산과 HA를 안정적으로 운영할 수 있습니다.`,
  },
  {
    title: 'Redis Sentinel — 고가용성과 자동 페일오버 구성',
    slug: 'redis-sentinel-high-availability',
    summary: 'Redis Sentinel로 마스터-레플리카 모니터링, 자동 페일오버, 서비스 디스커버리를 구성합니다. quorum 동작 원리와 클라이언트 연동, 운영 함정까지 실습으로 정리합니다.',
    category: '데이터베이스',
    tags: ['redis', 'sentinel', 'ha', 'failover'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Redis Sentinel 이란?

Redis Sentinel은 Redis 마스터-레플리카 구성을 감시하고, 마스터 장애 시 레플리카를 자동으로 승격(failover)해 주는 고가용성 솔루션입니다. 별도 프로세스로 동작하며 다음 역할을 수행합니다.

- **모니터링**: 마스터·레플리카가 살아 있는지 지속 점검
- **알림**: 장애 발생 시 이벤트 통지
- **자동 페일오버**: 마스터 다운 시 레플리카 승격
- **서비스 디스커버리**: 클라이언트에 현재 마스터 주소 제공

> Sentinel은 데이터 샤딩이 아닙니다. 데이터 분산이 목적이라면 Redis Cluster를 사용하세요. Sentinel은 "단일 마스터의 가용성"을 책임집니다.

---

## 권장 토폴로지

가장 흔한 구성은 마스터 1 + 레플리카 2 + Sentinel 3 입니다.

| 노드 | IP | 역할 |
|------|----|----|
| node1 | 192.168.1.21 | Redis Master + Sentinel |
| node2 | 192.168.1.22 | Redis Replica + Sentinel |
| node3 | 192.168.1.23 | Redis Replica + Sentinel |

> Sentinel은 **반드시 홀수(3 이상)** 로 두어야 합니다. 그래야 네트워크 분할 시 다수결(quorum)로 정확히 한쪽만 페일오버를 진행할 수 있습니다.

---

## 1. Redis 복제 구성

먼저 일반적인 마스터-레플리카를 만듭니다.

마스터(node1) \`redis.conf\`:

\`\`\`conf
bind 0.0.0.0 -::1
port 6379
requirepass MasterAuth!2026
masterauth MasterAuth!2026
appendonly yes
\`\`\`

레플리카(node2, node3) \`redis.conf\`:

\`\`\`conf
bind 0.0.0.0 -::1
port 6379
requirepass MasterAuth!2026
masterauth MasterAuth!2026
replicaof 192.168.1.21 6379
appendonly yes
\`\`\`

\`masterauth\` 와 \`requirepass\` 를 모든 노드에 동일하게 설정해야 페일오버 후 새 마스터에도 정상 연결됩니다. 복제 상태는 다음으로 확인합니다.

\`\`\`bash
redis-cli -a MasterAuth!2026 info replication
\`\`\`

\`\`\`
# Replication
role:master
connected_slaves:2
slave0:ip=192.168.1.22,port=6379,state=online,offset=...
\`\`\`

---

## 2. Sentinel 설정

각 노드의 \`sentinel.conf\`:

\`\`\`conf
port 26379
bind 0.0.0.0

# 감시할 마스터: <이름> <ip> <port> <quorum>
# quorum 2 = 2개 Sentinel이 다운에 동의해야 페일오버 시작
sentinel monitor mymaster 192.168.1.21 6379 2

# 마스터 인증(requirepass 사용 시 필수)
sentinel auth-pass mymaster MasterAuth!2026

# 응답이 없으면 주관적 다운(SDOWN)으로 판단할 시간(ms)
sentinel down-after-milliseconds mymaster 5000

# 페일오버 중 동시에 새 마스터와 동기화할 레플리카 수
sentinel parallel-syncs mymaster 1

# 페일오버 전체 타임아웃(ms)
sentinel failover-timeout mymaster 60000
\`\`\`

> \`quorum\` 은 "페일오버를 시작할지 합의하는 데 필요한 Sentinel 수"이고, 실제 페일오버 실행은 전체 Sentinel **과반(majority)** 의 투표가 추가로 필요합니다. Sentinel 3대라면 quorum 2가 표준입니다.

실행:

\`\`\`bash
redis-sentinel /etc/redis/sentinel.conf
# 또는 systemd
sudo systemctl enable --now redis-sentinel
\`\`\`

---

## 3. 동작 확인

\`\`\`bash
redis-cli -p 26379 sentinel master mymaster
redis-cli -p 26379 sentinel replicas mymaster
redis-cli -p 26379 sentinel sentinels mymaster
\`\`\`

현재 마스터 주소만 빠르게 묻기:

\`\`\`bash
redis-cli -p 26379 sentinel get-master-addr-by-name mymaster
# 1) "192.168.1.21"
# 2) "6379"
\`\`\`

---

## 4. SDOWN과 ODOWN — 페일오버 판정 흐름

| 단계 | 약어 | 의미 |
|------|------|------|
| 주관적 다운 | SDOWN | 한 Sentinel이 마스터 응답 없음으로 판단 |
| 객관적 다운 | ODOWN | quorum 수만큼 Sentinel이 SDOWN에 동의 |
| 리더 선출 | — | Sentinel들이 페일오버 리더를 투표로 선출 |
| 승격 | — | 리더가 적합한 레플리카를 새 마스터로 승격 |

레플리카 승격 우선순위는 \`replica-priority\`(낮을수록 우선, 0은 승격 제외), 복제 오프셋(최신 데이터), Run ID 순으로 결정됩니다.

---

## 5. 페일오버 강제 테스트

\`\`\`bash
# 마스터 강제 종료
redis-cli -h 192.168.1.21 -a MasterAuth!2026 debug sleep 30
# 또는 프로세스 정지로 다운 유발
sudo systemctl stop redis-server   # node1에서

# Sentinel 로그에서 페일오버 추적
journalctl -u redis-sentinel -f
\`\`\`

\`+switch-master mymaster 192.168.1.21 6379 192.168.1.22 6379\` 로그가 보이면 마스터가 node2로 전환된 것입니다. 수동 페일오버도 가능합니다.

\`\`\`bash
redis-cli -p 26379 sentinel failover mymaster
\`\`\`

---

## 6. 클라이언트 연동

애플리케이션은 마스터 IP를 직접 박으면 안 됩니다. Sentinel에 마스터 주소를 물어 연결하는 Sentinel-aware 클라이언트를 써야 합니다.

\`\`\`python
from redis.sentinel import Sentinel

sentinel = Sentinel(
    [('192.168.1.21', 26379), ('192.168.1.22', 26379), ('192.168.1.23', 26379)],
    socket_timeout=0.5,
    sentinel_kwargs={'password': None},
)

master = sentinel.master_for('mymaster', password='MasterAuth!2026', socket_timeout=0.5)
replica = sentinel.slave_for('mymaster', password='MasterAuth!2026')

master.set('key', 'value')
print(replica.get('key'))
\`\`\`

> 페일오버 직후 짧은 시간 동안 쓰기가 실패할 수 있습니다. 애플리케이션은 재시도 로직을 반드시 갖추세요.

---

## 7. 운영 시 함정

- **min-replicas-to-write**: 마스터에 \`min-replicas-to-write 1\`, \`min-replicas-max-lag 10\` 을 설정하면 레플리카가 모두 떨어졌을 때 쓰기를 거부해 split-brain 유실을 줄입니다.
- **Sentinel은 같은 노드에 두지 않기**: 가능하면 별도 호스트. 최소한 마스터 1대 다운으로 Sentinel 과반이 함께 죽지 않게 배치합니다.
- **시간 동기화(NTP)**: down-after 판정은 타이밍에 민감합니다.
- **방화벽**: 6379(데이터)와 26379(Sentinel) 양쪽 포트를 모두 열어야 합니다.

---

## 정리

| 항목 | 권장 값/방법 |
|------|--------------|
| Sentinel 수 | 홀수(3 이상), 분리된 호스트 |
| quorum | Sentinel 3대 → 2 |
| down-after | 5000ms 부근 |
| 인증 | requirepass + masterauth 전 노드 동일 |
| 유실 방지 | min-replicas-to-write / max-lag |
| 클라이언트 | Sentinel-aware + 재시도 |
| 모니터링 | journalctl, +switch-master 추적 |

Sentinel은 quorum과 과반 선출이라는 두 단계 합의로 split-brain을 막습니다. 홀수 배치, 인증 일관성, Sentinel-aware 클라이언트 이 세 가지만 지켜도 안정적인 단일 마스터 HA를 운영할 수 있습니다.`,
  },
  {
    title: 'PostgreSQL VACUUM·autovacuum — 테이블 팽창 진단과 튜닝',
    slug: 'postgresql-vacuum-autovacuum-tuning',
    summary: 'PostgreSQL의 MVCC가 만드는 dead tuple과 테이블 bloat를 진단하고, VACUUM/autovacuum 파라미터를 튜닝합니다. pg_stat_user_tables, wraparound 방지, VACUUM FULL 대안까지 다룹니다.',
    category: '데이터베이스',
    tags: ['postgresql', 'vacuum', 'autovacuum', 'bloat', 'performance'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## VACUUM 이란?

PostgreSQL은 MVCC(다중 버전 동시성 제어)를 사용합니다. UPDATE나 DELETE를 해도 기존 행을 즉시 지우지 않고, "죽은 버전(dead tuple)"으로 남겨 둡니다. 다른 트랜잭션이 아직 그 버전을 볼 수 있기 때문입니다. 시간이 지나 아무도 참조하지 않게 된 dead tuple을 정리해 공간을 재사용 가능하게 만드는 작업이 바로 **VACUUM** 입니다.

VACUUM이 하는 일:

- dead tuple이 차지하던 공간을 **재사용 가능 상태**로 표시
- **Visibility Map** 갱신 → Index-Only Scan 효율화
- **트랜잭션 ID(XID) freezing** → wraparound 장애 예방
- 통계 갱신(\`ANALYZE\` 병행 시) → 플래너 정확도 향상

> 일반 VACUUM은 디스크를 OS에 반환하지 않습니다(파일 크기 그대로). 공간은 테이블 내부에서 재사용됩니다. 실제 파일 축소는 VACUUM FULL이지만 배타 락이 걸립니다.

---

## Bloat(테이블 팽창) 이란?

dead tuple이 제때 정리되지 않거나, 정리되어도 즉시 채워지지 않으면 테이블·인덱스가 실제 데이터보다 훨씬 커집니다. 이를 **bloat** 라 합니다.

bloat의 영향:

- Seq Scan 시 읽어야 할 페이지 증가 → 쿼리 느려짐
- 캐시(shared_buffers) 효율 저하
- 인덱스 비대화 → 인덱스 스캔 비용 증가

---

## 1. dead tuple 진단

\`\`\`sql
SELECT
  relname,
  n_live_tup,
  n_dead_tup,
  round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;
\`\`\`

\`dead_pct\` 가 10~20%를 넘어가면서 \`last_autovacuum\` 이 오래 전이라면 autovacuum이 따라오지 못하고 있다는 신호입니다.

테이블 물리 크기와 함께 보기:

\`\`\`sql
SELECT
  relname,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  n_dead_tup
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
\`\`\`

bloat 추정에는 \`pgstattuple\` 확장이 정확합니다.

\`\`\`sql
CREATE EXTENSION IF NOT EXISTS pgstattuple;
SELECT * FROM pgstattuple('public.orders');
-- dead_tuple_percent, free_percent 등 확인
\`\`\`

---

## 2. 수동 VACUUM

\`\`\`sql
-- 자세한 로그와 통계 갱신을 함께
VACUUM (VERBOSE, ANALYZE) public.orders;

-- 전체 DB 대상(주기적 운영보다는 점검용)
VACUUM (ANALYZE);
\`\`\`

VERBOSE 출력에서 \`removed N row versions\`, \`there were N dead row versions\` 등을 확인할 수 있습니다.

> 실무에서 일상 정리는 autovacuum에 맡기고, 수동 VACUUM은 대량 배치 직후나 진단 목적으로만 사용하는 것이 정석입니다.

---

## 3. autovacuum 동작 원리

autovacuum은 다음 조건이 충족되면 테이블별로 자동 실행됩니다.

\`\`\`
임계치 = autovacuum_vacuum_threshold
       + autovacuum_vacuum_scale_factor * 테이블 행 수
\`\`\`

기본값은 \`threshold=50\`, \`scale_factor=0.2\` 입니다. 즉 1,000만 행 테이블은 약 200만 개의 dead tuple이 쌓여야 autovacuum이 돕니다. **대형 테이블에서 너무 늦게 도는** 전형적인 문제입니다.

\`postgresql.conf\` 전역 기본:

\`\`\`conf
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s

# 임계치
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.1   # 0.2 → 0.1로 더 자주

# I/O 비용 제한(클수록 더 공격적)
autovacuum_vacuum_cost_limit = 2000
autovacuum_vacuum_cost_delay = 2ms
\`\`\`

---

## 4. 대형 테이블 개별 튜닝

전역 값은 보수적으로 두고, 갱신이 잦은 큰 테이블만 storage parameter로 공격적으로 설정하는 것이 좋습니다.

\`\`\`sql
ALTER TABLE public.orders SET (
  autovacuum_vacuum_scale_factor = 0.02,   -- 2% 쌓이면 실행
  autovacuum_vacuum_threshold = 1000,
  autovacuum_vacuum_cost_limit = 4000,
  autovacuum_analyze_scale_factor = 0.01
);
\`\`\`

| 파라미터 | 의미 | 큰 테이블 권장 |
|----------|------|----------------|
| vacuum_scale_factor | 비율 임계치 | 0.01 ~ 0.05 |
| vacuum_threshold | 절대 임계치 | 1000+ |
| vacuum_cost_limit | I/O 예산 | 2000 ~ 4000 |
| vacuum_cost_delay | 휴식 시간 | 0 ~ 2ms |

---

## 5. 진행 중인 VACUUM 모니터링

\`\`\`sql
SELECT
  p.pid, t.relname, p.phase,
  p.heap_blks_scanned, p.heap_blks_total,
  round(100.0 * p.heap_blks_scanned / NULLIF(p.heap_blks_total, 0), 1) AS pct
FROM pg_stat_progress_vacuum p
JOIN pg_stat_user_tables t ON t.relid = p.relid;
\`\`\`

장시간 도는 autovacuum이 다른 작업을 막는지 확인:

\`\`\`sql
SELECT pid, state, wait_event_type, query, now() - xact_start AS duration
FROM pg_stat_activity
WHERE query ILIKE '%autovacuum%' OR query ILIKE '%vacuum%';
\`\`\`

---

## 6. XID Wraparound 방지

트랜잭션 ID는 약 21억 개로 순환합니다. freezing이 제때 안 되면 wraparound로 DB가 강제로 읽기 전용/중단될 수 있는 치명적 상황이 됩니다.

\`\`\`sql
-- 데이터베이스별 남은 트랜잭션 여유 확인
SELECT datname, age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;
\`\`\`

\`xid_age\` 가 \`autovacuum_freeze_max_age\`(기본 2억) 에 근접하면 강제 anti-wraparound autovacuum이 돕니다. 이 작업은 멈추면 안 되며, 평소 정상적인 VACUUM이 돌고 있으면 거의 마주칠 일이 없습니다.

> 특정 테이블만 age가 비정상적으로 높다면, 그 테이블에 장시간 열린 트랜잭션(\`idle in transaction\`)이 freeze를 막고 있는 경우가 많습니다. \`pg_stat_activity\` 에서 오래된 트랜잭션을 찾아 정리하세요.

---

## 7. bloat 제거 — VACUUM FULL과 대안

\`\`\`sql
-- 파일을 실제로 축소하지만 ACCESS EXCLUSIVE 락(테이블 전체 잠금)
VACUUM FULL public.orders;
\`\`\`

운영 중 무중단이 필요하면 \`pg_repack\` 확장을 사용합니다. 새 테이블을 백그라운드로 만들고 교체하므로 짧은 락만 발생합니다.

\`\`\`bash
pg_repack -d appdb -t orders --no-order
\`\`\`

---

## 정리

| 항목 | 핵심 |
|------|------|
| dead tuple | UPDATE/DELETE가 남기는 죽은 행 버전 |
| 진단 | pg_stat_user_tables.n_dead_tup, pgstattuple |
| 일상 정리 | autovacuum (수동 VACUUM은 배치 직후/진단용) |
| 대형 테이블 | 테이블별 scale_factor 0.01~0.05 |
| 진행 모니터링 | pg_stat_progress_vacuum |
| wraparound | age(datfrozenxid) 감시, 오래된 트랜잭션 정리 |
| bloat 제거 | VACUUM FULL(락) 또는 pg_repack(무중단) |

VACUUM은 "끄면 안 되는" 핵심 유지보수입니다. 큰 테이블의 scale_factor를 낮춰 자주 돌게 하고, dead tuple 비율과 XID age를 정기 모니터링하는 것이 bloat와 wraparound를 동시에 막는 가장 확실한 방법입니다.`,
  },
  {
    title: 'Prometheus + Node Exporter — 서버 메트릭 모니터링 구축',
    slug: 'prometheus-node-exporter-monitoring',
    summary: 'Prometheus와 Node Exporter로 리눅스 서버의 CPU·메모리·디스크·네트워크 메트릭을 수집합니다. scrape_configs, PromQL 쿼리, 레코딩 룰, 보존 정책까지 실무 기준으로 구성합니다.',
    category: '클라우드',
    tags: ['prometheus', 'monitoring', 'node-exporter', 'metrics'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Prometheus 란?

Prometheus는 시계열(time series) 기반의 오픈소스 모니터링 시스템입니다. 핵심 특징은 **Pull 방식** 으로, Prometheus 서버가 주기적으로 대상(target)의 \`/metrics\` 엔드포인트를 긁어(scrape) 옵니다.

- **Pull 모델**: 서버가 대상에 접속해 메트릭 수집
- **다차원 데이터 모델**: 메트릭 이름 + 레이블(label) 조합
- **PromQL**: 강력한 시계열 쿼리 언어
- **서비스 디스커버리**: 정적 설정 + 동적 발견(K8s, Consul 등)

**Node Exporter** 는 리눅스 호스트의 CPU·메모리·디스크·네트워크 등 OS 레벨 메트릭을 노출하는 공식 exporter입니다.

---

## 아키텍처

\`\`\`
[Node Exporter:9100] <--scrape-- [Prometheus:9090] --query--> [Grafana]
         (호스트 메트릭)               (TSDB 저장)            (시각화)
\`\`\`

| 구성요소 | 포트 | 역할 |
|----------|------|------|
| Prometheus | 9090 | 수집·저장·쿼리·알림 |
| Node Exporter | 9100 | 호스트 OS 메트릭 노출 |
| Alertmanager | 9093 | 알림 라우팅(선택) |

---

## 1. Node Exporter 설치

\`\`\`bash
VER=1.8.2
cd /tmp
curl -LO https://github.com/prometheus/node_exporter/releases/download/v\${VER}/node_exporter-\${VER}.linux-amd64.tar.gz
tar xzf node_exporter-\${VER}.linux-amd64.tar.gz
sudo cp node_exporter-\${VER}.linux-amd64/node_exporter /usr/local/bin/

sudo useradd --no-create-home --shell /bin/false node_exporter
\`\`\`

systemd 서비스 \`/etc/systemd/system/node_exporter.service\`:

\`\`\`ini
[Unit]
Description=Prometheus Node Exporter
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter \\
  --collector.systemd \\
  --collector.processes

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl enable --now node_exporter
curl -s localhost:9100/metrics | head
\`\`\`

\`node_cpu_seconds_total\`, \`node_memory_MemAvailable_bytes\` 같은 메트릭이 보이면 성공입니다.

---

## 2. Prometheus 설치

\`\`\`bash
VER=2.53.0
cd /tmp
curl -LO https://github.com/prometheus/prometheus/releases/download/v\${VER}/prometheus-\${VER}.linux-amd64.tar.gz
tar xzf prometheus-\${VER}.linux-amd64.tar.gz
cd prometheus-\${VER}.linux-amd64
sudo cp prometheus promtool /usr/local/bin/
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo cp -r consoles console_libraries /etc/prometheus/
\`\`\`

---

## 3. prometheus.yml 구성

\`/etc/prometheus/prometheus.yml\`:

\`\`\`yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'prod'

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets:
          - '192.168.1.31:9100'
          - '192.168.1.32:9100'
        labels:
          env: 'prod'
    relabel_configs:
      # instance 레이블을 호스트명처럼 깔끔하게
      - source_labels: [__address__]
        regex: '([^:]+):.*'
        target_label: host
        replacement: '$1'
\`\`\`

설정 검증 후 실행:

\`\`\`bash
promtool check config /etc/prometheus/prometheus.yml

/usr/local/bin/prometheus \\
  --config.file=/etc/prometheus/prometheus.yml \\
  --storage.tsdb.path=/var/lib/prometheus \\
  --storage.tsdb.retention.time=30d \\
  --web.enable-lifecycle
\`\`\`

\`--web.enable-lifecycle\` 를 켜면 무중단 리로드가 가능합니다.

\`\`\`bash
curl -X POST http://localhost:9090/-/reload
\`\`\`

대상 상태는 웹 UI \`http://<서버>:9090/targets\` 또는:

\`\`\`bash
curl -s 'http://localhost:9090/api/v1/targets' | jq '.data.activeTargets[].health'
\`\`\`

---

## 4. 핵심 PromQL 쿼리

### CPU 사용률(%)

\`\`\`promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
\`\`\`

### 메모리 사용률(%)

\`\`\`promql
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
\`\`\`

### 디스크 사용률(%) — 루트 파티션

\`\`\`promql
100 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100)
\`\`\`

### 네트워크 수신 트래픽(bytes/s)

\`\`\`promql
rate(node_network_receive_bytes_total{device!~"lo|veth.*"}[5m])
\`\`\`

### 디스크 가득 참 예측(4시간 뒤 0 이하면 위험)

\`\`\`promql
predict_linear(node_filesystem_avail_bytes{mountpoint="/"}[6h], 4 * 3600) < 0
\`\`\`

> \`rate()\` 는 Counter(단조 증가) 메트릭에만 사용합니다. Gauge(증감하는 값, 예: 메모리)에는 \`rate\`를 쓰면 안 됩니다.

---

## 5. 레코딩 룰로 쿼리 비용 절감

자주 쓰는 무거운 쿼리는 미리 계산해 새 시계열로 저장합니다. \`/etc/prometheus/rules/node.yml\`:

\`\`\`yaml
groups:
  - name: node-recording
    interval: 30s
    rules:
      - record: instance:node_cpu_utilization:ratio
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

      - record: instance:node_memory_utilization:ratio
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
\`\`\`

Grafana나 알림에서는 \`instance:node_cpu_utilization:ratio\` 처럼 미리 계산된 값을 참조하면 됩니다.

---

## 6. 보존 정책과 스토리지

| 옵션 | 의미 |
|------|------|
| --storage.tsdb.retention.time=30d | 30일 보관 |
| --storage.tsdb.retention.size=50GB | 용량 기준 보관 |

> 장기 보관·다중 클러스터 집계가 필요하면 Thanos나 VictoriaMetrics 같은 원격 스토리지를 연동합니다. 단일 Prometheus의 로컬 디스크는 단기 보관에 적합합니다.

---

## 정리

| 항목 | 핵심 |
|------|------|
| 수집 방식 | Pull — Prometheus가 /metrics를 scrape |
| 호스트 메트릭 | Node Exporter(:9100) |
| 설정 검증 | promtool check config |
| 무중단 리로드 | --web.enable-lifecycle + POST /-/reload |
| Counter | rate() / Gauge | 직접 사용 |
| 성능 | 레코딩 룰로 사전 계산 |
| 보존 | retention.time / .size, 장기는 Thanos |

Prometheus의 핵심은 "Counter는 rate, Gauge는 그대로"라는 메트릭 타입 구분과 PromQL 패턴입니다. Node Exporter로 OS 메트릭을 안정적으로 수집하면, 다음 단계인 Grafana 시각화와 알림으로 자연스럽게 확장할 수 있습니다.`,
  },
  {
    title: 'Grafana 대시보드 — Prometheus 연동과 알림(Alerting) 설정',
    slug: 'grafana-dashboard-prometheus-alerting',
    summary: 'Grafana에 Prometheus 데이터소스를 연동하고 패널 대시보드를 구성합니다. provisioning 자동화, 변수(template variable), Grafana 통합 알림 규칙과 Contact point까지 실무 기준으로 다룹니다.',
    category: '클라우드',
    tags: ['grafana', 'prometheus', 'dashboard', 'alerting', 'monitoring'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Grafana 란?

Grafana는 시계열·로그·트레이스 데이터를 시각화하고 알림을 보내는 오픈소스 관측(observability) 플랫폼입니다. Prometheus를 데이터소스로 연결하면 PromQL 쿼리 결과를 대시보드 패널로 그리고, 임계치를 넘으면 Slack·이메일 등으로 알림을 보낼 수 있습니다.

- **다양한 데이터소스**: Prometheus, Loki, Elasticsearch, PostgreSQL 등
- **대시보드**: 패널·행·변수로 구성
- **Unified Alerting**: Grafana 8+ 통합 알림(규칙 + Contact point + 라우팅)

> 이 글은 앞서 구축한 Prometheus(:9090) + Node Exporter 환경을 전제로 합니다.

---

## 1. 설치

\`\`\`bash
sudo apt-get install -y apt-transport-https software-properties-common
wget -q -O - https://apt.grafana.com/gpg.key | sudo gpg --dearmor -o /usr/share/keyrings/grafana.gpg
echo "deb [signed-by=/usr/share/keyrings/grafana.gpg] https://apt.grafana.com stable main" \\
  | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt-get update && sudo apt-get install -y grafana

sudo systemctl enable --now grafana-server
\`\`\`

\`http://<서버>:3000\` 접속(초기 admin/admin). 첫 로그인 시 비밀번호를 변경합니다.

---

## 2. Prometheus 데이터소스 연동

UI(Connections → Data sources)에서도 되지만, 운영 환경은 **provisioning** 으로 코드화하는 것이 정석입니다. \`/etc/grafana/provisioning/datasources/prometheus.yml\`:

\`\`\`yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
    jsonData:
      httpMethod: POST
      timeInterval: 15s   # Prometheus scrape_interval과 일치
\`\`\`

\`\`\`bash
sudo systemctl restart grafana-server
\`\`\`

> \`access: proxy\` 는 Grafana 서버가 대신 Prometheus에 질의합니다(브라우저가 직접 접근하지 않음). 보안·CORS 측면에서 권장됩니다.

---

## 3. 대시보드 구성

### 빠른 시작 — 커뮤니티 대시보드 임포트

Node Exporter Full 대시보드(ID **1860**)를 가져오면 즉시 풍부한 패널을 얻습니다. Dashboards → New → Import → \`1860\` 입력 → Prometheus 데이터소스 선택.

### 직접 패널 만들기

패널 쿼리는 PromQL 그대로 사용합니다.

\`\`\`promql
# CPU 사용률 패널
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
\`\`\`

### 템플릿 변수로 호스트 선택

대시보드 Settings → Variables에서 \`instance\` 변수를 만듭니다.

\`\`\`
Type:  Query
Query: label_values(node_uname_info, instance)
\`\`\`

패널 쿼리에서 변수를 사용합니다.

\`\`\`promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle",instance="$instance"}[5m])) * 100)
\`\`\`

이제 드롭다운으로 호스트를 바꿔가며 같은 대시보드를 재사용할 수 있습니다.

---

## 4. 대시보드 provisioning(자동 배포)

JSON으로 내보낸 대시보드를 파일로 관리합니다. \`/etc/grafana/provisioning/dashboards/main.yml\`:

\`\`\`yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: 'Infra'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    options:
      path: /var/lib/grafana/dashboards
\`\`\`

대시보드 JSON 파일을 \`/var/lib/grafana/dashboards/\` 에 두면 Grafana가 자동 로드합니다. 형상 관리(Git)와 잘 어울립니다.

---

## 5. Unified Alerting — 알림 규칙

Grafana 통합 알림은 세 요소로 구성됩니다.

| 요소 | 역할 |
|------|------|
| Alert rule | 조건(임계치)과 평가 주기 |
| Contact point | 알림을 보낼 곳(Slack, Email 등) |
| Notification policy | 어떤 알림을 어디로 보낼지 라우팅 |

### Contact point 설정 (Slack 예시)

Alerting → Contact points → Add. Slack Incoming Webhook URL을 입력합니다.

\`\`\`
Name:        slack-infra
Integration: Slack
Webhook URL: https://hooks.slack.com/services/XXX/YYY/ZZZ
\`\`\`

### Alert rule — CPU 90% 초과 5분 지속

Alerting → Alert rules → New alert rule.

\`\`\`
Query A (Prometheus):
  100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

Expression B (Reduce):  Last value of A
Condition  C (Threshold): B IS ABOVE 90

Evaluation: every 1m, for 5m
Labels:     severity = critical
\`\`\`

\`for 5m\` 은 조건이 5분간 연속 참일 때만 발화시켜 일시적 스파이크에 따른 알림 피로를 줄입니다.

### 라우팅(Notification policy)

\`severity=critical\` 레이블을 \`slack-infra\` Contact point로 보내도록 라벨 매처를 추가합니다. \`group_wait\`, \`group_interval\`, \`repeat_interval\` 로 묶음/재발송 주기를 조정합니다.

---

## 6. 알림을 코드로 관리

알림 규칙도 provisioning이 가능합니다. \`/etc/grafana/provisioning/alerting/rules.yml\`:

\`\`\`yaml
apiVersion: 1

groups:
  - orgId: 1
    name: node-alerts
    folder: Infra
    interval: 1m
    rules:
      - uid: high-mem
        title: HighMemoryUsage
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
        for: 5m
        labels:
          severity: warning
\`\`\`

---

## 7. 운영 팁

- **알림 피로 방지**: \`for\` 지속 시간과 \`repeat_interval\` 을 충분히 길게.
- **No Data 처리**: 데이터가 끊기는 것도 장애입니다. rule의 No Data 상태를 Alerting으로 처리.
- **대시보드 변수 \`$__rate_interval\`**: rate 윈도를 scrape interval에 맞춰 자동 계산해 줍니다.
- **읽기 전용 권한 분리**: 운영자에게 Viewer 역할만 부여해 대시보드 변조 방지.

---

## 정리

| 항목 | 핵심 |
|------|------|
| 데이터소스 | provisioning YAML, access: proxy |
| 대시보드 | ID 1860 임포트 또는 JSON provisioning |
| 변수 | label_values()로 호스트 드롭다운 |
| 알림 구조 | Rule + Contact point + Notification policy |
| 발화 안정화 | for 5m, repeat_interval |
| 코드화 | datasources/dashboards/alerting provisioning |

Grafana는 Prometheus가 모은 데이터를 사람이 읽을 수 있게 만들고, 임계치를 넘는 순간을 알려 주는 마지막 한 조각입니다. 데이터소스·대시보드·알림을 모두 provisioning으로 코드화하면 모니터링 스택 전체를 재현 가능하게 운영할 수 있습니다.`,
  },
];

async function insertGuides() {
  let success = 0, skipped = 0, failed = 0;
  for (const guide of guides) {
    const { error } = await supabase
      .from('engineer_guides')
      .upsert(guide, { onConflict: 'slug', ignoreDuplicates: true });
    if (error?.code === '23505') { console.log(`⏭  SKIP  ${guide.slug}`); skipped++; }
    else if (error) { console.error(`✗ FAIL  ${guide.slug}:`, error.message); failed++; }
    else { console.log(`✓ OK    ${guide.slug}`); success++; }
  }
  console.log(`\n완료: ${success}개 삽입, ${skipped}개 중복, ${failed}개 실패`);
}

insertGuides();
