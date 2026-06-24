import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  {
    title: 'PostgreSQL 스트리밍 복제 — Primary/Replica 이중화 구성',
    slug: 'postgresql-streaming-replication',
    summary: 'PostgreSQL Streaming Replication으로 Primary-Replica 이중화를 구성하고, WAL 기반 실시간 동기화와 자동 페일오버 원리를 실습으로 익힙니다.',
    category: '데이터베이스',
    tags: ['postgresql', 'replication', 'ha', 'streaming', 'failover'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## PostgreSQL 스트리밍 복제란?

PostgreSQL Streaming Replication은 Primary 서버에서 발생한 WAL(Write-Ahead Log)을 Replica(Standby) 서버로 실시간 전송해 데이터를 동기화하는 내장 이중화 기술입니다.

- **Hot Standby**: Replica에서 읽기 전용 쿼리 허용
- **동기(sync) / 비동기(async)** 복제 모드 선택 가능
- **WAL 기반**: 트랜잭션 레벨 복제, 데이터 손실 최소화

---

## 환경 구성

| 역할 | IP | OS |
|------|----|----|
| Primary | 192.168.1.10 | Ubuntu 22.04 |
| Replica | 192.168.1.11 | Ubuntu 22.04 |

PostgreSQL 버전은 동일해야 합니다 (여기서는 15 기준).

\`\`\`bash
# 두 서버 모두 설치
sudo apt update && sudo apt install -y postgresql-15
\`\`\`

---

## Primary 서버 설정

### 1. 복제 전용 사용자 생성

\`\`\`sql
-- psql 접속 후
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'StrongPass!23';
\`\`\`

### 2. postgresql.conf 수정

\`\`\`bash
sudo nano /etc/postgresql/15/main/postgresql.conf
\`\`\`

\`\`\`ini
listen_addresses = '*'
wal_level = replica          # 복제 WAL 활성화
max_wal_senders = 5          # 동시 Replica 수 (여유 있게 설정)
wal_keep_size = 512          # WAL 보관 크기 (MB)
synchronous_commit = on      # 동기 복제 시 'remote_apply'로 변경
\`\`\`

### 3. pg_hba.conf — Replica 접속 허용

\`\`\`bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
\`\`\`

\`\`\`
# Replica 서버 IP 허용
host  replication  replicator  192.168.1.11/32  md5
\`\`\`

\`\`\`bash
sudo systemctl restart postgresql
\`\`\`

---

## Replica 서버 설정

### 1. 기존 데이터 디렉터리 초기화 후 베이스 백업

\`\`\`bash
sudo systemctl stop postgresql
sudo rm -rf /var/lib/postgresql/15/main/*

# Primary에서 베이스 백업 받기
sudo -u postgres pg_basebackup \
  -h 192.168.1.10 \
  -U replicator \
  -D /var/lib/postgresql/15/main \
  -Fp -Xs -P -R
# -R: standby.signal + recovery 설정 자동 생성
\`\`\`

### 2. postgresql.conf (Replica 전용 옵션)

\`\`\`ini
hot_standby = on             # 읽기 쿼리 허용
primary_conninfo = 'host=192.168.1.10 port=5432 user=replicator password=StrongPass!23'
\`\`\`

\`pg_basebackup -R\` 사용 시 \`postgresql.auto.conf\`에 자동 기록됩니다.

### 3. Replica 시작

\`\`\`bash
sudo systemctl start postgresql
\`\`\`

---

## 복제 상태 확인

### Primary에서

\`\`\`sql
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn, sync_state
FROM pg_stat_replication;
\`\`\`

\`\`\`
client_addr   | state     | sync_state
--------------+-----------+-----------
192.168.1.11  | streaming | async
\`\`\`

### Replica에서

\`\`\`sql
SELECT * FROM pg_stat_wal_receiver;
-- status: streaming 이면 정상
\`\`\`

---

## 동기 복제 설정 (데이터 무손실)

\`\`\`ini
# Primary postgresql.conf
synchronous_standby_names = 'replica1'
synchronous_commit = remote_apply
\`\`\`

\`\`\`ini
# Replica postgresql.conf
application_name = replica1
\`\`\`

> 동기 모드는 Replica가 응답할 때까지 Primary 커밋이 대기 — 성능 영향 있음.

---

## 수동 페일오버 (Replica → Primary 승격)

Primary 장애 시 Replica를 새 Primary로 승격합니다.

\`\`\`bash
# Replica 서버에서
sudo -u postgres pg_ctl promote -D /var/lib/postgresql/15/main
# 또는
sudo -u postgres psql -c "SELECT pg_promote();"
\`\`\`

승격 후 애플리케이션의 DB 연결을 Replica IP로 변경합니다.

---

## Replication Slot — WAL 유실 방지

Replica가 오프라인 상태일 때 WAL이 삭제되지 않도록 슬롯을 생성합니다.

\`\`\`sql
-- Primary에서
SELECT pg_create_physical_replication_slot('replica1_slot');
\`\`\`

\`\`\`ini
# Replica postgresql.auto.conf
primary_slot_name = 'replica1_slot'
\`\`\`

> 주의: Replica가 장기 오프라인이면 Primary 디스크가 가득 찰 수 있으므로 모니터링 필수.

---

## 모니터링 쿼리

\`\`\`sql
-- 복제 지연(lag) 확인
SELECT
  client_addr,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes,
  write_lag, flush_lag, replay_lag
FROM pg_stat_replication;
\`\`\`

---

## 정리

| 단계 | 위치 | 핵심 설정 |
|------|------|-----------|
| WAL 활성화 | Primary | \`wal_level = replica\` |
| 복제 사용자 | Primary | \`REPLICATION\` 권한 |
| 베이스 백업 | Replica | \`pg_basebackup -R\` |
| 읽기 허용 | Replica | \`hot_standby = on\` |
| 페일오버 | Replica | \`pg_promote()\` |
`,
  },

  {
    title: 'Patroni + etcd로 PostgreSQL 자동 페일오버 HA 클러스터 구성',
    slug: 'postgresql-patroni-ha-cluster',
    summary: 'Patroni와 etcd를 이용해 PostgreSQL 3노드 HA 클러스터를 구성하고, Primary 장애 시 자동 Failover와 HAProxy 기반 부하분산까지 설정합니다.',
    category: '데이터베이스',
    tags: ['postgresql', 'patroni', 'etcd', 'ha', 'failover', 'haproxy'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Patroni란?

Patroni는 Python 기반 PostgreSQL HA 솔루션으로, etcd/Consul/ZooKeeper 등 DCS(Distributed Configuration Store)를 사용해 Leader 선출과 자동 페일오버를 수행합니다.

**구성 요소**

| 컴포넌트 | 역할 |
|----------|------|
| Patroni | PostgreSQL 프로세스 관리 + 페일오버 |
| etcd | Leader 선출용 분산 합의 저장소 |
| HAProxy | 애플리케이션 → Primary/Replica 라우팅 |

---

## 클러스터 구성

| 서버 | IP | 역할 |
|------|----|------|
| pg1 | 192.168.1.10 | PostgreSQL + Patroni + etcd |
| pg2 | 192.168.1.11 | PostgreSQL + Patroni + etcd |
| pg3 | 192.168.1.12 | PostgreSQL + Patroni + etcd |
| lb  | 192.168.1.20 | HAProxy |

---

## 1. etcd 클러스터 설치 (3노드 모두)

\`\`\`bash
sudo apt install -y etcd
\`\`\`

\`\`\`bash
# /etc/default/etcd (pg1 기준)
ETCD_NAME="pg1"
ETCD_DATA_DIR="/var/lib/etcd"
ETCD_LISTEN_PEER_URLS="http://192.168.1.10:2380"
ETCD_LISTEN_CLIENT_URLS="http://192.168.1.10:2379,http://127.0.0.1:2379"
ETCD_INITIAL_ADVERTISE_PEER_URLS="http://192.168.1.10:2380"
ETCD_ADVERTISE_CLIENT_URLS="http://192.168.1.10:2379"
ETCD_INITIAL_CLUSTER="pg1=http://192.168.1.10:2380,pg2=http://192.168.1.11:2380,pg3=http://192.168.1.12:2380"
ETCD_INITIAL_CLUSTER_STATE="new"
ETCD_INITIAL_CLUSTER_TOKEN="pg-etcd-cluster"
\`\`\`

\`\`\`bash
sudo systemctl enable --now etcd
# 상태 확인
etcdctl endpoint status --cluster -w table
\`\`\`

---

## 2. PostgreSQL 설치 (3노드 모두)

\`\`\`bash
sudo apt install -y postgresql-15
sudo systemctl disable --now postgresql   # Patroni가 대신 관리
\`\`\`

---

## 3. Patroni 설치 및 설정

\`\`\`bash
sudo apt install -y python3-pip
pip3 install patroni[etcd] psycopg2-binary
\`\`\`

### /etc/patroni/config.yml (pg1 기준)

\`\`\`yaml
scope: pg-cluster
namespace: /db/
name: pg1

restapi:
  listen: 192.168.1.10:8008
  connect_address: 192.168.1.10:8008

etcd:
  hosts: 192.168.1.10:2379,192.168.1.11:2379,192.168.1.12:2379

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576   # 1MB
    postgresql:
      use_pg_rewind: true
      parameters:
        wal_level: replica
        max_wal_senders: 5
        max_replication_slots: 5
        hot_standby: on
  initdb:
    - encoding: UTF8
    - data-checksums

  pg_hba:
    - host replication replicator 192.168.1.0/24 md5
    - host all all 0.0.0.0/0 md5

  users:
    admin:
      password: AdminPass!23
      options: [createrole, createdb]

postgresql:
  listen: 192.168.1.10:5432
  connect_address: 192.168.1.10:5432
  data_dir: /var/lib/postgresql/15/main
  bin_dir: /usr/lib/postgresql/15/bin
  pgpass: /tmp/pgpass

  authentication:
    replication:
      username: replicator
      password: ReplPass!23
    superuser:
      username: postgres
      password: PgPass!23
    rewind:
      username: rewind_user
      password: RewindPass!23

tags:
  nofailover: false
  noloadbalance: false
  clonefrom: false
\`\`\`

pg2, pg3는 \`name\`, \`listen\`, \`connect_address\`의 IP만 각 서버에 맞게 변경합니다.

### systemd 서비스

\`\`\`bash
cat > /etc/systemd/system/patroni.service << 'EOF'
[Unit]
Description=Patroni PostgreSQL HA
After=network.target etcd.service

[Service]
User=postgres
ExecStart=/usr/local/bin/patroni /etc/patroni/config.yml
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now patroni
\`\`\`

---

## 4. 클러스터 상태 확인

\`\`\`bash
patronictl -c /etc/patroni/config.yml list
\`\`\`

\`\`\`
+ Cluster: pg-cluster ----+----+-----------+
| Member | Host           | Role    | State   |
+--------+----------------+---------+---------+
| pg1    | 192.168.1.10   | Leader  | running |
| pg2    | 192.168.1.11   | Replica | running |
| pg3    | 192.168.1.12   | Replica | running |
+--------+----------------+---------+---------+
\`\`\`

---

## 5. HAProxy 설정 (lb 서버)

\`\`\`bash
sudo apt install -y haproxy
\`\`\`

\`\`\`
# /etc/haproxy/haproxy.cfg
frontend pg_write
    bind *:5432
    default_backend pg_primary

backend pg_primary
    option httpchk GET /master
    http-check expect status 200
    server pg1 192.168.1.10:5432 check port 8008
    server pg2 192.168.1.11:5432 check port 8008
    server pg3 192.168.1.12:5432 check port 8008

frontend pg_read
    bind *:5433
    default_backend pg_replicas

backend pg_replicas
    balance roundrobin
    option httpchk GET /replica
    http-check expect status 200
    server pg1 192.168.1.10:5432 check port 8008
    server pg2 192.168.1.11:5432 check port 8008
    server pg3 192.168.1.12:5432 check port 8008
\`\`\`

Patroni REST API의 \`/master\`, \`/replica\` 엔드포인트를 health check에 활용합니다.

---

## 6. 수동 전환 / 페일오버

\`\`\`bash
# 계획된 전환 (데이터 무손실)
patronictl -c /etc/patroni/config.yml switchover pg-cluster

# 강제 페일오버 (비상 시)
patronictl -c /etc/patroni/config.yml failover pg-cluster
\`\`\`

---

## 정리

| 기능 | 담당 |
|------|------|
| Leader 선출 | etcd 분산 합의 |
| 자동 페일오버 | Patroni (TTL 30초 이내) |
| 쓰기 라우팅 | HAProxy → /master |
| 읽기 분산 | HAProxy → /replica (Round Robin) |
`,
  },

  {
    title: 'MSSQL Always On 가용성 그룹 — SQL Server HA 이중화 구성',
    slug: 'mssql-always-on-availability-group',
    summary: 'SQL Server Always On 가용성 그룹으로 Primary-Secondary 이중화를 구성하고, 자동 페일오버와 읽기 전용 라우팅까지 설정하는 전체 과정을 설명합니다.',
    category: '데이터베이스',
    tags: ['mssql', 'sql-server', 'always-on', 'ha', 'failover', 'windows-server'],
    difficulty: 'advanced',
    os_compat: ['windows'],
    author: 'SecuThive',
    content: `## Always On 가용성 그룹이란?

SQL Server Always On AG(Availability Group)는 데이터베이스 레벨의 HA 솔루션으로, 여러 Secondary 복제본을 유지하며 자동/수동 페일오버를 지원합니다.

**주요 특징**
- 최대 8개 Secondary 복제본 (SQL Server 2022 기준)
- 동기/비동기 커밋 모드 선택
- Secondary에서 읽기 전용 쿼리 오프로드
- Windows Server Failover Cluster(WSFC) 위에서 동작

---

## 사전 요구사항

| 항목 | 요구사항 |
|------|---------|
| SQL Server 에디션 | Enterprise 또는 Developer (테스트용) |
| OS | Windows Server 2019/2022 |
| 도메인 | Active Directory 도메인 필수 |
| WSFC | 모든 노드 공통 클러스터 구성원 |
| 네트워크 | 노드 간 고속 사설망 권장 |

---

## 환경 구성

| 서버 | IP | 역할 |
|------|----|------|
| SQL1 | 192.168.1.10 | Primary |
| SQL2 | 192.168.1.11 | Secondary (동기) |
| SQL3 | 192.168.1.12 | Secondary (비동기, DR) |
| AG Listener | 192.168.1.50 | 애플리케이션 연결 VIP |

---

## Step 1 — Windows Server Failover Cluster 구성

**PowerShell (모든 노드)**

\`\`\`powershell
# 장애 조치 클러스터링 기능 설치
Install-WindowsFeature Failover-Clustering -IncludeManagementTools

# 사전 검사
Test-Cluster -Node SQL1, SQL2, SQL3

# 클러스터 생성 (SQL1에서)
New-Cluster -Name "SQLCluster" -Node SQL1,SQL2,SQL3 -StaticAddress 192.168.1.30
\`\`\`

---

## Step 2 — SQL Server Always On 활성화

**SQL Server Configuration Manager → SQL Server 서비스 → 속성 → Always On 가용성 그룹 탭에서 활성화**

또는 PowerShell:

\`\`\`powershell
Enable-SqlAlwaysOn -ServerInstance "SQL1" -Force
Enable-SqlAlwaysOn -ServerInstance "SQL2" -Force
Enable-SqlAlwaysOn -ServerInstance "SQL3" -Force
\`\`\`

서비스 재시작 필요.

---

## Step 3 — 미러링 엔드포인트 생성 (각 노드)

\`\`\`sql
-- SQL1, SQL2, SQL3 각각 실행
CREATE ENDPOINT [Hadr_endpoint]
    STATE = STARTED
    AS TCP (LISTENER_PORT = 5022)
    FOR DATA_MIRRORING (ROLE = ALL, ENCRYPTION = REQUIRED ALGORITHM AES);

-- 서비스 계정에 CONNECT 권한 부여
GRANT CONNECT ON ENDPOINT::[Hadr_endpoint] TO [DOMAIN\\sql_service];
\`\`\`

---

## Step 4 — 데이터베이스 준비 (Primary)

\`\`\`sql
-- 복구 모드 FULL 필수
ALTER DATABASE [SalesDB] SET RECOVERY FULL;

-- 전체 백업 (Secondary로 복원에 사용)
BACKUP DATABASE [SalesDB]
  TO DISK = '\\\\fileserver\\backup\\SalesDB.bak'
  WITH FORMAT, INIT;

BACKUP LOG [SalesDB]
  TO DISK = '\\\\fileserver\\backup\\SalesDB_log.bak';
\`\`\`

---

## Step 5 — Secondary에서 백업 복원

\`\`\`sql
-- SQL2, SQL3에서 실행 (NORECOVERY 필수)
RESTORE DATABASE [SalesDB]
  FROM DISK = '\\\\fileserver\\backup\\SalesDB.bak'
  WITH NORECOVERY, MOVE 'SalesDB' TO 'C:\\Data\\SalesDB.mdf',
       MOVE 'SalesDB_log' TO 'C:\\Data\\SalesDB_log.ldf';

RESTORE LOG [SalesDB]
  FROM DISK = '\\\\fileserver\\backup\\SalesDB_log.bak'
  WITH NORECOVERY;
\`\`\`

---

## Step 6 — 가용성 그룹 생성 (Primary)

\`\`\`sql
CREATE AVAILABILITY GROUP [AG_Sales]
WITH (
    AUTOMATED_BACKUP_PREFERENCE = SECONDARY,
    FAILURE_CONDITION_LEVEL = 3,
    HEALTH_CHECK_TIMEOUT = 30000
)
FOR DATABASE [SalesDB]
REPLICA ON
  'SQL1' WITH (
    ENDPOINT_URL = 'TCP://SQL1.domain.local:5022',
    FAILOVER_MODE = AUTOMATIC,
    AVAILABILITY_MODE = SYNCHRONOUS_COMMIT,
    BACKUP_PRIORITY = 50,
    SECONDARY_ROLE(ALLOW_CONNECTIONS = NO)
  ),
  'SQL2' WITH (
    ENDPOINT_URL = 'TCP://SQL2.domain.local:5022',
    FAILOVER_MODE = AUTOMATIC,
    AVAILABILITY_MODE = SYNCHRONOUS_COMMIT,
    BACKUP_PRIORITY = 50,
    SECONDARY_ROLE(ALLOW_CONNECTIONS = READ_ONLY)   -- 읽기 오프로드
  ),
  'SQL3' WITH (
    ENDPOINT_URL = 'TCP://SQL3.domain.local:5022',
    FAILOVER_MODE = MANUAL,
    AVAILABILITY_MODE = ASYNCHRONOUS_COMMIT,         -- DR 사이트
    BACKUP_PRIORITY = 60,
    SECONDARY_ROLE(ALLOW_CONNECTIONS = READ_ONLY)
  );
\`\`\`

---

## Step 7 — Secondary 조인

\`\`\`sql
-- SQL2에서
ALTER AVAILABILITY GROUP [AG_Sales] JOIN;
ALTER DATABASE [SalesDB] SET HADR AVAILABILITY GROUP = [AG_Sales];

-- SQL3에서 동일하게 실행
ALTER AVAILABILITY GROUP [AG_Sales] JOIN;
ALTER DATABASE [SalesDB] SET HADR AVAILABILITY GROUP = [AG_Sales];
\`\`\`

---

## Step 8 — AG Listener 생성

\`\`\`sql
-- Primary에서
ALTER AVAILABILITY GROUP [AG_Sales]
ADD LISTENER 'AG_Sales_Listener' (
    WITH IP ((N'192.168.1.50', N'255.255.255.0')),
    PORT = 1433
);
\`\`\`

애플리케이션은 \`192.168.1.50,1433\`으로 연결하며, 페일오버 후에도 동일 주소로 접속됩니다.

---

## 상태 확인

\`\`\`sql
-- 복제 상태
SELECT ag.name, ars.role_desc, ard.synchronization_state_desc,
       ard.synchronization_health_desc, ard.log_send_queue_size,
       ard.redo_queue_size
FROM sys.dm_hadr_availability_replica_states ars
JOIN sys.availability_replicas ar ON ars.replica_id = ar.replica_id
JOIN sys.availability_groups ag ON ag.group_id = ar.group_id
JOIN sys.dm_hadr_database_replica_states ard ON ard.replica_id = ars.replica_id;

-- 페일오버 준비 상태
SELECT * FROM sys.dm_hadr_availability_group_states;
\`\`\`

---

## 수동 페일오버

\`\`\`sql
-- 새 Primary로 지정할 Secondary에서 실행
ALTER AVAILABILITY GROUP [AG_Sales] FAILOVER;
\`\`\`

---

## 읽기 전용 라우팅 (Read Scale-out)

\`\`\`sql
-- Primary에서 라우팅 URL 설정
ALTER AVAILABILITY GROUP [AG_Sales]
MODIFY REPLICA ON 'SQL1' WITH (
    PRIMARY_ROLE(READ_ONLY_ROUTING_LIST = ('SQL2','SQL3'))
);

ALTER AVAILABILITY GROUP [AG_Sales]
MODIFY REPLICA ON 'SQL2' WITH (
    SECONDARY_ROLE(READ_ONLY_ROUTING_URL = N'TCP://SQL2.domain.local:1433')
);
\`\`\`

연결 문자열에 \`ApplicationIntent=ReadOnly\` 추가 시 자동으로 Secondary로 라우팅됩니다.

---

## 정리

| 기능 | Always On AG |
|------|-------------|
| 페일오버 단위 | 데이터베이스 그룹 |
| 자동 페일오버 | 동기 복제본 (WSFC 판단) |
| 읽기 오프로드 | Secondary READ_ONLY 허용 |
| DR 구성 | 비동기 복제본 |
| 연결 단일화 | AG Listener VIP |
`,
  },

  {
    title: 'MSSQL 로그 전달(Log Shipping) — 재해 복구 이중화 구성',
    slug: 'mssql-log-shipping-guide',
    summary: 'SQL Server Log Shipping으로 Primary-Secondary DR 구성을 설정하고, 백업·복사·복원 작업 스케줄링과 모니터링 방법을 실습합니다.',
    category: '데이터베이스',
    tags: ['mssql', 'sql-server', 'log-shipping', 'dr', 'backup', 'recovery'],
    difficulty: 'intermediate',
    os_compat: ['windows'],
    author: 'SecuThive',
    content: `## 로그 전달(Log Shipping)이란?

Log Shipping은 트랜잭션 로그 백업을 주기적으로 Secondary 서버에 복원해 데이터를 동기화하는 SQL Server 내장 DR 솔루션입니다.

- **Always On AG보다 구성 단순** (도메인/WSFC 불필요)
- **허용 지연 시간**: 분 단위 (15분~1시간)
- **비용 효율**: Standard 에디션에서도 사용 가능
- **여러 Secondary** 구성 가능

**3가지 SQL Agent 작업**

| 작업 | 실행 서버 | 역할 |
|------|----------|------|
| 백업 | Primary | 트랜잭션 로그 백업 생성 |
| 복사 | Secondary | 백업 파일을 로컬로 복사 |
| 복원 | Secondary | 로그 백업을 DB에 적용 |

---

## 환경 구성

| 서버 | IP | 역할 |
|------|----|------|
| SQL-Primary | 192.168.1.10 | Primary DB |
| SQL-Secondary | 192.168.1.11 | Secondary (DR) |
| 모니터 서버 | 192.168.1.12 | 선택 사항 |

공유 폴더: \`\\\\SQL-Primary\\LogShipBackup\`

---

## Step 1 — 공유 백업 폴더 설정 (Primary)

\`\`\`powershell
# 폴더 생성
New-Item -Path "C:\\LogShipBackup" -ItemType Directory

# 공유 (Secondary 서버 컴퓨터 계정 허용)
New-SmbShare -Name "LogShipBackup" -Path "C:\\LogShipBackup" \`
  -FullAccess "DOMAIN\\SQL-Secondary$", "DOMAIN\\sql_agent"
\`\`\`

---

## Step 2 — 데이터베이스 복구 모드 확인

\`\`\`sql
-- Primary에서
SELECT name, recovery_model_desc FROM sys.databases WHERE name = 'SalesDB';
-- FULL 이어야 함

-- SIMPLE이면 변경
ALTER DATABASE SalesDB SET RECOVERY FULL;

-- 전체 백업 (Log Shipping 초기화 전 필수)
BACKUP DATABASE SalesDB
  TO DISK = '\\\\SQL-Primary\\LogShipBackup\\SalesDB_full.bak'
  WITH FORMAT, COMPRESSION;
\`\`\`

---

## Step 3 — SSMS로 Log Shipping 구성

1. **SSMS → Primary DB 우클릭 → 속성 → 트랜잭션 로그 전달** 탭
2. **이 데이터베이스를 로그 전달 구성의 주 데이터베이스로 설정** 체크
3. **백업 설정**:
   - 백업 폴더: \`C:\\LogShipBackup\`
   - 네트워크 경로: \`\\\\SQL-Primary\\LogShipBackup\`
   - 백업 간격: 15분
   - 백업 보관 기간: 72시간
4. **Secondary 데이터베이스 추가**:
   - 서버: SQL-Secondary
   - 초기화: 전체 백업에서 복원 선택
   - 복사 간격: 15분
   - 복원 간격: 15분
   - 복원 모드: **STANDBY** (읽기 가능) 또는 **NORECOVERY** (읽기 불가)

---

## T-SQL로 직접 구성 (선택)

### Primary — 백업 작업

\`\`\`sql
-- 로그 전달 Primary 등록
EXEC master.dbo.sp_add_log_shipping_primary_database
    @database = N'SalesDB',
    @backup_directory = N'C:\\LogShipBackup',
    @backup_share = N'\\\\SQL-Primary\\LogShipBackup',
    @backup_job_name = N'LSBackup_SalesDB',
    @backup_retention_period = 4320,      -- 72시간 (분 단위)
    @backup_threshold = 60,               -- 60분 초과 시 경고
    @threshold_alert_enabled = 1,
    @history_retention_period = 5760,
    @backup_job_id = @LS_BackupJobID OUTPUT,
    @primary_id = @LS_PrimaryId OUTPUT;

-- SQL Agent 백업 작업 스케줄 (15분마다)
EXEC msdb.dbo.sp_attach_schedule
    @job_name = N'LSBackup_SalesDB',
    @schedule_name = N'LS_15min';
\`\`\`

### Secondary — 복사 및 복원 작업

\`\`\`sql
EXEC master.dbo.sp_add_log_shipping_secondary_primary
    @primary_server = N'SQL-Primary',
    @primary_database = N'SalesDB',
    @backup_source_directory = N'\\\\SQL-Primary\\LogShipBackup',
    @backup_destination_directory = N'C:\\LogShipRestore',
    @copy_job_name = N'LSCopy_SQL-Primary_SalesDB',
    @restore_job_name = N'LSRestore_SQL-Primary_SalesDB',
    @file_retention_period = 4320,
    @copy_job_id = @LS_CopyJobID OUTPUT,
    @restore_job_id = @LS_RestoreJobID OUTPUT,
    @secondary_id = @LS_SecondaryId OUTPUT;

EXEC master.dbo.sp_add_log_shipping_secondary_database
    @secondary_database = N'SalesDB',
    @primary_server = N'SQL-Primary',
    @primary_database = N'SalesDB',
    @restore_delay = 0,
    @restore_mode = 1,         -- 1: STANDBY (읽기 가능), 0: NORECOVERY
    @disconnect_users = 0,
    @block_size = 512,
    @buffer_count = 15,
    @max_transfer_size = 1048576,
    @restore_threshold = 45,   -- 45분 초과 시 경고
    @threshold_alert_enabled = 1,
    @history_retention_period = 5760,
    @secondary_id = @LS_SecondaryId;
\`\`\`

---

## 모니터링

\`\`\`sql
-- Primary에서 Log Shipping 상태 확인
SELECT
    primary_database,
    last_backup_file,
    last_backup_date,
    DATEDIFF(MINUTE, last_backup_date, GETDATE()) AS minutes_since_backup
FROM msdb.dbo.log_shipping_monitor_primary;

-- Secondary에서 복원 상태 확인
SELECT
    secondary_database,
    last_restored_file,
    last_restored_date,
    last_restored_latency,   -- 분 단위 지연
    restore_threshold
FROM msdb.dbo.log_shipping_monitor_secondary;
\`\`\`

---

## 페일오버 절차

Primary 장애 시 Secondary를 운영 서버로 전환합니다.

\`\`\`sql
-- Secondary에서: 마지막 로그까지 복원 후 RECOVERY
RESTORE DATABASE SalesDB WITH RECOVERY;
-- 이후 DB 상태: ONLINE (쓰기 가능)

-- 애플리케이션 연결 문자열을 SQL-Secondary IP로 변경
\`\`\`

---

## Log Shipping vs Always On AG 비교

| 항목 | Log Shipping | Always On AG |
|------|-------------|-------------|
| 에디션 | Standard 가능 | Enterprise 필요 |
| 복구 시간 | 분 단위 (RPO ~15분) | 초 단위 |
| 자동 페일오버 | 불가 (수동) | 가능 (동기 모드) |
| 도메인 필요 | 불필요 | 필요 (WSFC) |
| 구성 복잡도 | 낮음 | 높음 |
| 읽기 오프로드 | STANDBY 모드 시 가능 | 항상 가능 |
`,
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
