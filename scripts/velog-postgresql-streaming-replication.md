---
title: "PostgreSQL 스트리밍 복제 — Primary/Replica 이중화 구성"
tags: ["postgresql", "replication", "ha", "streaming"]
---

> 이 글은 **[Nodelog](https://www.thivelab.com/engineer/postgresql-streaming-replication)** 에 게재된 엔지니어 가이드입니다.

## PostgreSQL 스트리밍 복제란?

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

PostgreSQL 버전은 동일해야 합니다 (여기서는 17 기준).

```bash
# 두 서버 모두 설치
sudo apt update && sudo apt install -y postgresql-17
```

---

## Primary 서버 설정

### 1. 복제 전용 사용자 생성

```sql
-- psql 접속 후
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'StrongPass!23';
```

### 2. postgresql.conf 수정

```bash
sudo nano /etc/postgresql/17/main/postgresql.conf
```

```ini
listen_addresses = '*'
wal_level = replica          # 복제 WAL 활성화
max_wal_senders = 5          # 동시 Replica 수 (여유 있게 설정)
wal_keep_size = 512          # WAL 보관 크기 (MB)
synchronous_commit = on      # 동기 복제 시 'remote_apply'로 변경
```

### 3. pg_hba.conf — Replica 접속 허용

```bash
sudo nano /etc/postgresql/17/main/pg_hba.conf
```

```
# Replica 서버 IP 허용
host  replication  replicator  192.168.1.11/32  md5
```

```bash
sudo systemctl restart postgresql
```

---

## Replica 서버 설정

### 1. 기존 데이터 디렉터리 초기화 후 베이스 백업

```bash
sudo systemctl stop postgresql
sudo rm -rf /var/lib/postgresql/17/main/*

# Primary에서 베이스 백업 받기
sudo -u postgres pg_basebackup   -h 192.168.1.10   -U replicator   -D /var/lib/postgresql/17/main   -Fp -Xs -P -R
# -R: standby.signal + recovery 설정 자동 생성
```

### 2. postgresql.conf (Replica 전용 옵션)

```ini
hot_standby = on             # 읽기 쿼리 허용
primary_conninfo = 'host=192.168.1.10 port=5432 user=replicator password=StrongPass!23'
```

`pg_basebackup -R` 사용 시 `postgresql.auto.conf`에 자동 기록됩니다.

### 3. Replica 시작

```bash
sudo systemctl start postgresql
```

---

## 복제 상태 확인

### Primary에서

```sql
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn, sync_state
FROM pg_stat_replication;
```

```
client_addr   | state     | sync_state
--------------+-----------+-----------
192.168.1.11  | streaming | async
```

### Replica에서

```sql
SELECT * FROM pg_stat_wal_receiver;
-- status: streaming 이면 정상
```

---

## 동기 복제 설정 (데이터 무손실)

```ini
# Primary postgresql.conf
synchronous_standby_names = 'replica1'
synchronous_commit = remote_apply
```

```ini
# Replica postgresql.conf
application_name = replica1
```

> 동기 모드는 Replica가 응답할 때까지 Primary 커밋이 대기 — 성능 영향 있음.

---

## 수동 페일오버 (Replica → Primary 승격)

Primary 장애 시 Replica를 새 Primary로 승격합니다.

```bash
# Replica 서버에서
sudo -u postgres pg_ctl promote -D /var/lib/postgresql/17/main
# 또는
sudo -u postgres psql -c "SELECT pg_promote();"
```

승격 후 애플리케이션의 DB 연결을 Replica IP로 변경합니다.

---

## Replication Slot — WAL 유실 방지

Replica가 오프라인 상태일 때 WAL이 삭제되지 않도록 슬롯을 생성합니다.

```sql
-- Primary에서
SELECT pg_create_physical_replication_slot('replica1_slot');
```

```ini
# Replica postgresql.auto.conf
primary_slot_name = 'replica1_slot'
```

> 주의: Replica가 장기 오프라인이면 Primary 디스크가 가득 찰 수 있으므로 모니터링 필수.

---

## 모니터링 쿼리

```sql
-- 복제 지연(lag) 확인
SELECT
  client_addr,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replay_lag_bytes,
  write_lag, flush_lag, replay_lag
FROM pg_stat_replication;
```

---

## 정리

| 단계 | 위치 | 핵심 설정 |
|------|------|-----------|
| WAL 활성화 | Primary | `wal_level = replica` |
| 복제 사용자 | Primary | `REPLICATION` 권한 |
| 베이스 백업 | Replica | `pg_basebackup -R` |
| 읽기 허용 | Replica | `hot_standby = on` |
| 페일오버 | Replica | `pg_promote()` |


---

> 📌 더 많은 실전 가이드는 **[thivelab.com/engineer](https://www.thivelab.com/engineer)** 에서 확인하세요.