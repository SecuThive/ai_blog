import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── 데이터베이스 (계속) ─────────────────────────────────
  {
    title: 'Elasticsearch 입문 — 설치·인덱스·쿼리·Kibana 연결',
    slug: 'elasticsearch-setup-basics',
    summary: 'Elasticsearch 설치, 인덱스 생성·문서 CRUD, match/term/range 쿼리, 집계, Kibana 연결까지 검색 엔진 기초를 실습 중심으로 설명합니다.',
    category: '데이터베이스',
    tags: ['elasticsearch', 'kibana', '검색엔진', '인덱스', '쿼리'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 설치 (Ubuntu, Docker 권장)

\`\`\`bash
# Docker Compose로 빠른 시작
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:8.13.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  esdata:
EOF

docker compose up -d

# 상태 확인
curl http://localhost:9200
\`\`\`

---

## 인덱스 관리

\`\`\`bash
# 인덱스 생성 (매핑 명시)
curl -X PUT http://localhost:9200/products \\
  -H 'Content-Type: application/json' -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "name":        { "type": "text", "analyzer": "standard" },
      "price":       { "type": "float" },
      "category":    { "type": "keyword" },
      "stock":       { "type": "integer" },
      "createdAt":   { "type": "date" },
      "description": { "type": "text" }
    }
  }
}'

# 인덱스 목록
curl http://localhost:9200/_cat/indices?v

# 인덱스 삭제
curl -X DELETE http://localhost:9200/products
\`\`\`

---

## 문서 CRUD

\`\`\`bash
# 문서 추가
curl -X POST http://localhost:9200/products/_doc \\
  -H 'Content-Type: application/json' -d '{
  "name": "노트북 Pro 15",
  "price": 1500000,
  "category": "electronics",
  "stock": 50,
  "createdAt": "2025-05-27"
}'

# ID 지정하여 추가/업데이트
curl -X PUT http://localhost:9200/products/_doc/1 \\
  -H 'Content-Type: application/json' -d '{
  "name": "무선 마우스",
  "price": 35000,
  "category": "accessories",
  "stock": 200
}'

# 문서 조회
curl http://localhost:9200/products/_doc/1

# 부분 업데이트
curl -X POST http://localhost:9200/products/_update/1 \\
  -H 'Content-Type: application/json' -d '{
  "doc": { "price": 32000, "stock": 180 }
}'

# 문서 삭제
curl -X DELETE http://localhost:9200/products/_doc/1
\`\`\`

---

## 검색 쿼리

\`\`\`bash
# match — 전문 검색 (형태소 분석)
curl -X GET http://localhost:9200/products/_search \\
  -H 'Content-Type: application/json' -d '{
  "query": {
    "match": { "name": "노트북" }
  }
}'

# term — 정확한 값 매칭 (keyword 타입)
curl -X GET http://localhost:9200/products/_search \\
  -H 'Content-Type: application/json' -d '{
  "query": {
    "term": { "category": "electronics" }
  }
}'

# range — 범위 검색
curl -X GET http://localhost:9200/products/_search \\
  -H 'Content-Type: application/json' -d '{
  "query": {
    "range": {
      "price": { "gte": 100000, "lte": 2000000 }
    }
  }
}'

# bool — 복합 조건
curl -X GET http://localhost:9200/products/_search \\
  -H 'Content-Type: application/json' -d '{
  "query": {
    "bool": {
      "must":   [{ "match": { "name": "노트북" } }],
      "filter": [{ "term":  { "category": "electronics" } }],
      "must_not": [{ "range": { "stock": { "lte": 0 } } }]
    }
  },
  "sort": [{ "price": "asc" }],
  "from": 0,
  "size": 10
}'
\`\`\`

---

## 집계 (Aggregation)

\`\`\`bash
curl -X GET http://localhost:9200/products/_search \\
  -H 'Content-Type: application/json' -d '{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category", "size": 10 }
    },
    "avg_price": {
      "avg": { "field": "price" }
    },
    "price_range": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50000 },
          { "from": 50000, "to": 500000 },
          { "from": 500000 }
        ]
      }
    }
  }
}'
\`\`\`

---

## 한국어 분석기 설정

\`\`\`bash
# 노리(nori) 플러그인 설치 (Docker)
docker exec -it elasticsearch \\
  bin/elasticsearch-plugin install analysis-nori

# 노리 분석기로 인덱스 생성
curl -X PUT http://localhost:9200/korean-products \\
  -H 'Content-Type: application/json' -d '{
  "settings": {
    "analysis": {
      "analyzer": {
        "korean": {
          "type": "nori"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "korean" }
    }
  }
}'
\`\`\``,
  },

  {
    title: 'SQLite 실전 가이드 — CLI · 스키마 · 백업 · Python 연동',
    slug: 'sqlite-practical-guide',
    summary: 'SQLite CLI 사용법, 테이블 설계, 인덱스·트리거, .dump 백업, Python sqlite3 모듈로 CRUD까지 경량 데이터베이스 활용법을 정리합니다.',
    category: '데이터베이스',
    tags: ['sqlite', 'sql', 'python', '경량DB', '백업', 'CLI'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 설치 및 CLI 시작

\`\`\`bash
# 설치
sudo apt install -y sqlite3   # Ubuntu
brew install sqlite           # macOS

# 데이터베이스 열기 (없으면 생성)
sqlite3 myapp.db

# 도움말
sqlite> .help
\`\`\`

---

## CLI 메타 명령

\`\`\`
.tables              테이블 목록
.schema users        테이블 스키마 확인
.mode column         열 정렬 출력
.headers on          헤더 표시
.width 20 10 30      열 너비 설정
.output result.txt   출력을 파일로
.read script.sql     SQL 파일 실행
.quit                종료
\`\`\`

---

## 테이블 생성 및 CRUD

\`\`\`sql
-- 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL,
  email     TEXT    NOT NULL UNIQUE,
  age       INTEGER CHECK(age >= 0),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title     TEXT    NOT NULL,
  body      TEXT,
  published INTEGER DEFAULT 0
);

-- 삽입
INSERT INTO users (name, email, age) VALUES
  ('Alice', 'alice@example.com', 30),
  ('Bob', 'bob@example.com', 25);

-- 조회
SELECT * FROM users WHERE age > 20 ORDER BY name;

SELECT u.name, COUNT(p.id) AS post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id
ORDER BY post_count DESC;

-- 수정
UPDATE users SET age = 31 WHERE email = 'alice@example.com';

-- 삭제
DELETE FROM users WHERE id = 2;
\`\`\`

---

## 인덱스 · 트리거

\`\`\`sql
-- 인덱스 생성
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user ON posts(user_id, published);

-- 업데이트 시간 자동 갱신 트리거
ALTER TABLE users ADD COLUMN updated_at DATETIME;

CREATE TRIGGER users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 인덱스 목록
.indexes users

-- 실행 계획
EXPLAIN QUERY PLAN
SELECT * FROM posts WHERE user_id = 1 AND published = 1;
\`\`\`

---

## 백업 · 복원

\`\`\`bash
# 텍스트 덤프 (SQL 형식)
sqlite3 myapp.db .dump > backup_$(date +%Y%m%d).sql

# 복원
sqlite3 restored.db < backup_20250527.sql

# 바이너리 복사 (DB 잠금 상태 확인 후)
sqlite3 myapp.db "VACUUM INTO 'backup.db'"

# WAL 모드에서 안전한 온라인 백업
sqlite3 myapp.db ".backup backup.db"
\`\`\`

---

## Python sqlite3 연동

\`\`\`python
import sqlite3
from contextlib import contextmanager

@contextmanager
def get_db(path="myapp.db"):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row  # 딕셔너리처럼 접근
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

# 사용 예시
with get_db() as db:
    # 삽입
    db.execute(
        "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
        ("Carol", "carol@example.com", 35)
    )

    # 조회
    rows = db.execute("SELECT * FROM users WHERE age > ?", (20,)).fetchall()
    for row in rows:
        print(dict(row))

    # executemany (배치 삽입)
    data = [
        ("Dave", "dave@example.com", 28),
        ("Eve", "eve@example.com", 32),
    ]
    db.executemany(
        "INSERT OR IGNORE INTO users (name, email, age) VALUES (?, ?, ?)",
        data
    )
\`\`\`

---

## SQLite 사용 적합한 경우

| 적합 | 부적합 |
|---|---|
| 소규모 앱·프로토타입 | 동시 쓰기 많은 서비스 |
| 로컬 캐시·설정 저장 | 수천만 행 이상 대용량 |
| CLI 도구·스크립트 | 분산 클러스터 필요 |
| IoT·엣지 디바이스 | 실시간 복제 필요 |`,
  },

  // ── 트러블슈팅 ──────────────────────────────────────────
  {
    title: 'CPU 과부하 진단 — top · htop · perf · uptime',
    slug: 'high-cpu-load-diagnosis',
    summary: 'top/htop으로 CPU 사용 프로세스를 특정하고, uptime/vmstat으로 부하 추이를 확인하며, perf와 strace로 병목 원인을 찾는 방법을 설명합니다.',
    category: '트러블슈팅',
    tags: ['cpu', 'top', 'htop', 'perf', '성능', '트러블슈팅'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 1단계 — 부하 현황 파악

\`\`\`bash
# Load Average 확인 (1분/5분/15분 평균)
uptime
# 예: load average: 4.20, 3.80, 2.10
# CPU 코어 수보다 높으면 과부하
nproc                  # CPU 코어 수 확인

# 실시간 CPU 상태
vmstat 2 10            # 2초 간격, 10회

# 주요 컬럼
# us: 유저 공간, sy: 커널, wa: I/O 대기, id: 유휴
# si/so: 스왑 입출력 (높으면 메모리 부족)
\`\`\`

---

## 2단계 — CPU 사용 프로세스 특정

\`\`\`bash
# top 실행 후
top
# P 키: CPU 정렬
# M 키: 메모리 정렬
# k 키: PID로 프로세스 종료
# 1 키: 코어별 CPU 표시

# 1회성 스냅샷 (정렬)
ps aux --sort=-%cpu | head -15

# 특정 프로세스 CPU 추적
pidstat -u -p 1234 2 5   # PID 1234, 2초 간격, 5회
\`\`\`

---

## 3단계 — 프로세스 내 병목 분석

\`\`\`bash
# strace — 시스템 콜 추적
strace -p 1234 -c       # 시스템 콜 통계 요약
strace -p 1234 -e trace=read,write  # 특정 콜만

# perf — 성능 카운터 프로파일링
sudo apt install -y linux-tools-common linux-tools-$(uname -r)

# 10초간 CPU 이벤트 수집
sudo perf record -g -p 1234 -- sleep 10

# 결과 분석
sudo perf report

# 시스템 전체 핫스팟 (5초)
sudo perf top

# lsof — 프로세스가 여는 파일 수 확인
sudo lsof -p 1234 | wc -l
\`\`\`

---

## 4단계 — CPU 유형별 원인

### us(유저) CPU가 높을 때

\`\`\`bash
# 무한 루프·비효율 알고리즘 의심
# 스택 트레이스 확인 (Python)
sudo py-spy top --pid 1234

# Java
sudo jstack 1234 | grep -A 5 "RUNNABLE"

# Node.js
kill -USR1 1234   # node --prof 모드 활성화
\`\`\`

### sy(커널) CPU가 높을 때

\`\`\`bash
# 시스템 콜 과다 의심
strace -p 1234 -c -S calls | head -20

# 인터럽트 확인
cat /proc/interrupts | sort -k2 -rn | head -10
\`\`\`

### wa(I/O 대기) CPU가 높을 때

\`\`\`bash
# I/O 병목 (트러블슈팅 별도 가이드 참조)
iostat -x 2 5
iotop -o
\`\`\`

---

## 5단계 — 임시 완화

\`\`\`bash
# 특정 프로세스 CPU 사용 제한 (cgroups)
sudo apt install -y cpulimit
cpulimit -p 1234 -l 50    # PID 1234를 CPU 50%로 제한

# nice 값으로 우선순위 낮추기
renice -n 15 -p 1234

# OOM Killer 점수 조정 (중요 프로세스 보호)
echo -1000 > /proc/1234/oom_score_adj
\`\`\`

---

## 체크리스트

- [ ] Load average가 코어 수를 지속적으로 초과하는가?
- [ ] 특정 프로세스 1개가 CPU의 100%를 점유하는가?
- [ ] 최근 배포나 코드 변경이 있었는가?
- [ ] wa 비율이 높은가? → I/O 병목으로 전환
- [ ] 프로세스 수가 비정상적으로 많은가? → fork 폭탄 의심`,
  },

  {
    title: '메모리 누수 진단 — /proc/meminfo · smaps · valgrind',
    slug: 'memory-leak-diagnosis-linux',
    summary: '/proc/meminfo와 free로 메모리 현황을 파악하고, smaps·pmap으로 프로세스 메모리를 분석하며, valgrind와 AddressSanitizer로 누수를 찾는 방법을 설명합니다.',
    category: '트러블슈팅',
    tags: ['메모리누수', 'valgrind', 'smaps', 'oom', '트러블슈팅', 'linux'],
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 1단계 — 메모리 현황 파악

\`\`\`bash
# 전체 메모리 현황
free -h
# Mem: total=16G, used=14G, free=500M, buff/cache=2G, available=1G
# available이 중요 — 실제 사용 가능한 메모리

# 상세 정보
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|Cached|Buffers|SwapTotal|SwapFree"

# 시간에 따른 메모리 변화 관찰
watch -n 5 'free -h'

# vmstat으로 스왑 활성도 확인
vmstat 5 10
# si/so 컬럼이 지속적으로 0이 아니면 메모리 부족
\`\`\`

---

## 2단계 — 메모리 소비 프로세스 특정

\`\`\`bash
# 메모리 Top 10
ps aux --sort=-%mem | head -11
ps aux --sort=-rss | awk '{print $2, $4, $6, $11}' | head -11

# 특정 프로세스 메모리
ps -p 1234 -o pid,rss,vsz,cmd
# RSS: 실제 점유 메모리 (KB)
# VSZ: 가상 메모리 크기 (공유 라이브러리 포함)

# pidstat으로 메모리 추이 관찰
pidstat -r -p 1234 5 12   # 5초 간격, 1분
\`\`\`

---

## 3단계 — 프로세스 메모리 맵 분석

\`\`\`bash
# pmap — 메모리 매핑 요약
sudo pmap -x 1234
# RSS 합계가 실제 사용량
sudo pmap -x 1234 | tail -1

# /proc/PID/smaps — 상세 분석
sudo cat /proc/1234/smaps | awk '
  /^Private_Dirty/ { pd += $2 }
  /^Shared_Dirty/  { sd += $2 }
  END { printf "Private Dirty: %d KB\\nShared Dirty: %d KB\\n", pd, sd }
'

# smaps_rollup — 요약 (kernel 4.14+)
sudo cat /proc/1234/smaps_rollup

# 힙 크기 확인
sudo cat /proc/1234/status | grep -E "VmRSS|VmHeap|VmPeak"
\`\`\`

---

## 4단계 — 언어별 메모리 누수 추적

### C / C++ — Valgrind

\`\`\`bash
sudo apt install -y valgrind

# 메모리 누수 검사
valgrind --leak-check=full \\
         --show-leak-kinds=all \\
         --track-origins=yes \\
         --verbose \\
         ./myprogram 2>&1 | tee valgrind.log

# 주요 출력
# "definitely lost": 확실한 누수
# "indirectly lost": 간접 누수
# "possibly lost": 누수 가능성
\`\`\`

### C / C++ — AddressSanitizer (빠른 컴파일 타임 검사)

\`\`\`bash
# 컴파일 시 활성화
gcc -fsanitize=address -g -O1 myprogram.c -o myprogram
./myprogram   # 누수 발생 시 자동 보고
\`\`\`

### Python

\`\`\`python
import tracemalloc

tracemalloc.start()

# 분석할 코드
do_something()

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)
\`\`\`

### Node.js

\`\`\`bash
# heapdump로 스냅샷 비교
node --expose-gc server.js

# Chrome DevTools 연결
node --inspect server.js
# chrome://inspect 에서 메모리 프로파일
\`\`\`

---

## 5단계 — OOM Killer 확인

\`\`\`bash
# OOM으로 프로세스가 종료됐는지 확인
dmesg | grep -i "oom\|killed process\|out of memory"
sudo journalctl -k | grep -i oom

# OOM 스코어 확인 (높을수록 먼저 kill)
cat /proc/1234/oom_score

# 중요 프로세스 OOM 보호
echo -1000 | sudo tee /proc/1234/oom_score_adj
\`\`\`

---

## 6단계 — 임시 완화

\`\`\`bash
# 페이지 캐시 해제
sync; echo 1 | sudo tee /proc/sys/vm/drop_caches

# 슬랩 캐시까지 해제
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches

# 스왑 추가 (임시)
sudo dd if=/dev/zero of=/swapfile bs=1G count=4
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
\`\`\``,
  },

  {
    title: '네트워크 패킷 손실 진단 — ping · mtr · tcpdump',
    slug: 'network-packet-loss-diagnosis',
    summary: 'ping으로 패킷 손실을 확인하고, mtr로 경로별 손실 지점을 찾으며, tcpdump로 실제 패킷을 캡처해 재전송·오류를 분석하는 방법을 설명합니다.',
    category: '트러블슈팅',
    tags: ['ping', 'mtr', 'tcpdump', '패킷손실', '네트워크', '트러블슈팅'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 1단계 — ping으로 기본 손실 확인

\`\`\`bash
# 기본 ping (Ctrl+C로 종료 후 통계 확인)
ping 8.8.8.8

# 100개 패킷 전송 후 통계
ping -c 100 8.8.8.8

# 빠른 ping (0.2초 간격)
ping -i 0.2 -c 200 8.8.8.8

# 결과 해석
# packet loss = 0%: 정상
# packet loss = 1~5%: 경미한 손실
# packet loss > 10%: 심각한 문제

# 큰 패킷으로 MTU 문제 확인
ping -s 1400 -M do 8.8.8.8   # Fragmentation 금지
ping -s 1472 -M do gateway_ip  # 최대 MTU 탐색
\`\`\`

---

## 2단계 — mtr로 경로별 손실 지점 찾기

\`\`\`bash
sudo apt install -y mtr-tiny

# 인터랙티브 모드
mtr 8.8.8.8

# 100패킷 후 보고서 출력
mtr --report --report-cycles 100 8.8.8.8

# TCP 모드 (ICMP 차단 환경)
mtr --tcp --port 443 example.com
\`\`\`

### mtr 결과 해석

\`\`\`
                             Loss%   Snt   Avg  Best  Wrst StDev
1. 192.168.1.1 (게이트웨이)   0.0%   100   1.2   0.8   5.1   0.6
2. 100.64.0.1  (ISP)         0.0%   100  10.5   9.8  25.3   2.1
3. 203.0.113.1 (중간 홉)      5.0%   100  18.3  17.1  89.5  12.4  ← 손실 시작
4. 203.0.113.2               5.0%   100  20.1  19.0  92.3  13.2
5. 8.8.8.8    (목적지)        5.0%   100  22.4  21.0  95.0  13.8
\`\`\`

- 3번 홉부터 손실 발생 → 3번 홉 구간 문제
- 중간 홉만 높고 목적지가 0% → 해당 라우터가 ICMP를 rate limiting하는 것 (정상)

---

## 3단계 — tcpdump로 패킷 분석

\`\`\`bash
# 인터페이스 목록 확인
sudo tcpdump -D

# 특정 인터페이스, 호스트 필터
sudo tcpdump -i eth0 host 8.8.8.8

# 포트 필터
sudo tcpdump -i eth0 tcp port 443

# 패킷 내용 출력 (-A: ASCII, -X: Hex+ASCII)
sudo tcpdump -i eth0 -A tcp port 80 | head -50

# 파일에 저장 (Wireshark 분석용)
sudo tcpdump -i eth0 -w capture.pcap tcp port 443

# 저장된 파일 읽기
sudo tcpdump -r capture.pcap

# TCP 재전송 패킷 필터
sudo tcpdump -i eth0 'tcp[tcpflags] & tcp-syn != 0'
\`\`\`

---

## 4단계 — TCP 재전송 통계 확인

\`\`\`bash
# ss로 소켓 통계
ss -s

# TCP 재전송 카운터
cat /proc/net/snmp | grep Tcp
# RetransSegs 값이 지속적으로 증가하면 재전송 중

# netstat으로 확인
netstat -s | grep -i retransmit

# nstat으로 카운터 추적
nstat | grep Retran
\`\`\`

---

## 5단계 — 원인별 해결 방법

### ISP 구간 손실

\`\`\`bash
# ISP 측 문제 — 고객센터 연락 전 증거 수집
mtr --report --report-cycles 200 8.8.8.8 > mtr_report.txt
traceroute -n 8.8.8.8
\`\`\`

### 서버 인터페이스 오류

\`\`\`bash
# 오류 카운터 확인
ip -s link show eth0
# errors, dropped 필드 확인

# 드라이버 오류
dmesg | grep -i "eth0\|network\|link"

# 인터페이스 재시작
sudo ip link set eth0 down && sleep 1 && sudo ip link set eth0 up
\`\`\`

### MTU 불일치

\`\`\`bash
# MTU 확인
ip link show eth0 | grep mtu

# MTU 변경 (VPN 환경에서 자주 필요)
sudo ip link set eth0 mtu 1450
\`\`\`

### 버퍼 튜닝

\`\`\`bash
# 네트워크 버퍼 크기 증가
sudo sysctl -w net.core.rmem_max=134217728
sudo sysctl -w net.core.wmem_max=134217728
sudo sysctl -w net.ipv4.tcp_rmem='4096 87380 134217728'
sudo sysctl -w net.ipv4.tcp_wmem='4096 65536 134217728'
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
