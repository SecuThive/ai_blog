import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const guide = {
  title: 'Linux 커널 파라미터 튜닝 — sysctl · 네트워크 스택 · 메모리 최적화',
  slug: 'linux-kernel-tuning-sysctl-network-memory',
  summary: 'sysctl로 TCP 스택·파일 디스크립터·메모리 관리를 제어하고, 프로덕션 워크로드(고트래픽 웹서버, DB, 컨테이너 호스트)별 최적 파라미터를 적용하는 심화 가이드.',
  category: 'OS / 시스템',
  tags: ['sysctl', '커널튜닝', 'TCP최적화', '메모리관리', 'OS', '성능최적화', 'linux'],
  difficulty: 'advanced',
  os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `## sysctl 기본 사용법

\`sysctl\`은 커널이 실행 중인 상태에서 파라미터를 읽고 쓸 수 있는 인터페이스입니다.

\`\`\`bash
# 현재 값 조회
sysctl net.core.somaxconn
sysctl -a | grep tcp_tw          # 패턴 검색

# 즉시 적용 (재부팅 시 초기화)
sudo sysctl -w net.core.somaxconn=65535

# 영구 적용 (/etc/sysctl.d/99-tuning.conf)
echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.d/99-tuning.conf
sudo sysctl -p /etc/sysctl.d/99-tuning.conf

# 전체 재로드
sudo sysctl --system
\`\`\`

> 파라미터는 /proc/sys/ 경로로도 직접 접근합니다. \`net.core.somaxconn\` = \`/proc/sys/net/core/somaxconn\`

---

## 1. 네트워크 스택 튜닝

### TCP 연결 처리 한도

\`\`\`ini
# /etc/sysctl.d/99-network.conf

# SYN 백로그 큐 크기 (높은 동시 접속 시 SYN 드롭 방지)
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# 네트워크 디바이스 입력 큐 크기
net.core.netdev_max_backlog = 65535

# 로컬 포트 범위 확장 (아웃바운드 연결 많을 때)
net.ipv4.ip_local_port_range = 1024 65535
\`\`\`

### TIME_WAIT 소켓 재사용

대량의 단기 연결(HTTP/1.1 폴링, 마이크로서비스 내부 통신)에서 TIME_WAIT 소켓이 포트를 고갈시킬 수 있습니다.

\`\`\`ini
# TIME_WAIT 상태 소켓 재사용 허용 (클라이언트 측)
net.ipv4.tcp_tw_reuse = 1

# FIN_WAIT2 타임아웃 단축 (기본 60s → 15s)
net.ipv4.tcp_fin_timeout = 15

# TIME_WAIT 버킷 최대 수 (메모리 절약)
net.ipv4.tcp_max_tw_buckets = 1440000
\`\`\`

\`\`\`bash
# 현재 소켓 상태 분포 확인
ss -s

# TIME_WAIT 수 실시간 모니터링
watch -n1 "ss -s | grep TIME-WAIT"
\`\`\`

### TCP 버퍼 크기 — 처리량 최적화

고대역폭(1Gbps+) 환경에서는 버퍼가 작으면 TCP 윈도우 스케일링이 제한되어 처리량이 저하됩니다.

\`\`\`ini
# TCP 소켓 읽기·쓰기 버퍼 (min / default / max, bytes)
net.core.rmem_default = 262144
net.core.rmem_max = 134217728     # 128MB
net.core.wmem_default = 262144
net.core.wmem_max = 134217728

# TCP 자동 튜닝 범위 (min / pressure / max)
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728

# 자동 버퍼 튜닝 활성화
net.ipv4.tcp_moderate_rcvbuf = 1

# BBR 혼잡 제어 알고리즘 (리눅스 4.9+, 고RTT 환경에서 CUBIC보다 우수)
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
\`\`\`

\`\`\`bash
# BBR 지원 여부 확인
sysctl net.ipv4.tcp_available_congestion_control

# 현재 혼잡 제어 알고리즘
sysctl net.ipv4.tcp_congestion_control

# TCP 처리량 측정 (iperf3)
iperf3 -c TARGET_HOST -t 30 -P 4
\`\`\`

### Keepalive — 좀비 연결 제거

\`\`\`ini
# Keepalive 프로브 시작까지 대기 시간 (기본 7200s → 60s)
net.ipv4.tcp_keepalive_time = 60

# 프로브 재시도 간격
net.ipv4.tcp_keepalive_intvl = 10

# 프로브 최대 횟수 (초과 시 연결 끊음)
net.ipv4.tcp_keepalive_probes = 6
\`\`\`

---

## 2. 파일 디스크립터 및 inotify 한도

고트래픽 서버에서 "Too many open files" 오류의 원인과 해결책입니다.

\`\`\`ini
# /etc/sysctl.d/99-fs.conf

# 시스템 전체 최대 파일 핸들 수
fs.file-max = 2097152

# inotify 와처 한도 (Kafka, Elasticsearch, Docker 환경)
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512

# AIO 한도 (데이터베이스 I/O)
fs.aio-max-nr = 1048576
\`\`\`

\`\`\`bash
# /etc/security/limits.d/99-nofile.conf (프로세스별 한도)
*    soft nofile 1048576
*    hard nofile 1048576
root soft nofile 1048576
root hard nofile 1048576
\`\`\`

\`\`\`bash
# 현재 사용 중인 파일 핸들 수 / 최대치
cat /proc/sys/fs/file-nr      # 사용 중 / 미사용 / 최대

# 특정 프로세스의 열린 파일 수
ls /proc/1234/fd | wc -l

# 시스템 전체 프로세스별 파일 핸들 사용량 상위 10개
lsof 2>/dev/null | awk '{print \$1}' | sort | uniq -c | sort -rn | head 10
\`\`\`

---

## 3. 메모리 관리 튜닝

### vm.swappiness — 스왑 사용 성향

\`\`\`ini
# /etc/sysctl.d/99-memory.conf

# 스왑 사용 적극성 (0=스왑 최소화, 100=적극 사용)
# 데이터베이스 서버: 1~10 권장 (메모리 캐시 보호)
# 일반 서버: 10~30
vm.swappiness = 10

# 더티 페이지 비율 제한 (I/O 버스트 방지)
vm.dirty_ratio = 10           # 전체 메모리의 10% 초과 시 강제 flush
vm.dirty_background_ratio = 5 # 5% 초과 시 백그라운드 flush 시작

# 더티 페이지 최대 보관 시간 (100cs = 1초)
vm.dirty_expire_centisecs = 3000   # 30초
vm.dirty_writeback_centisecs = 500 # 5초마다 flush 스레드 깨움
\`\`\`

\`\`\`bash
# 현재 더티 페이지 상황
cat /proc/meminfo | grep -i dirty

# 강제로 더티 페이지 flush (주의: I/O 스파이크 발생)
sync; echo 3 | sudo tee /proc/sys/vm/drop_caches
\`\`\`

### OOM Killer 제어

\`\`\`bash
# OOM 점수 확인 (높을수록 먼저 죽음, -1000=절대 보호)
cat /proc/1234/oom_score
cat /proc/1234/oom_score_adj

# 중요 프로세스 OOM 보호 (PostgreSQL 예시)
echo -500 | sudo tee /proc/\$(pgrep -f "postgres: checkpointer")/oom_score_adj

# systemd 서비스 단위로 OOM 정책 설정
# /etc/systemd/system/postgresql.service.d/override.conf
[Service]
OOMScoreAdjust=-500
\`\`\`

\`\`\`ini
# OOM이 발생해도 패닉 없이 프로세스 종료 (기본값 유지 권장)
vm.panic_on_oom = 0
vm.oom_kill_allocating_task = 0
\`\`\`

### HugePages — 대용량 메모리 DB 최적화

PostgreSQL, Oracle, Redis 등 대용량 메모리를 사용하는 프로세스는 HugePages로 TLB 미스를 줄일 수 있습니다.

\`\`\`bash
# 현재 HugePage 사용 현황
grep -i huge /proc/meminfo

# 필요한 HugePage 수 계산 (PostgreSQL shared_buffers 기준)
# shared_buffers = 8GB, HugePage = 2MB
# 필요 수 = 8 * 1024 / 2 = 4096

# HugePage 수 설정
echo "vm.nr_hugepages = 4096" | sudo tee -a /etc/sysctl.d/99-hugepages.conf
sudo sysctl -p /etc/sysctl.d/99-hugepages.conf

# PostgreSQL에서 HugePage 활성화
# postgresql.conf: huge_pages = on
\`\`\`

---

## 4. cgroups v2 — 리소스 격리

cgroups v2는 프로세스·컨테이너별로 CPU·메모리·I/O를 정밀하게 제한합니다.

\`\`\`bash
# cgroups v2 마운트 여부 확인
mount | grep cgroup2
# 또는
stat -fc %T /sys/fs/cgroup/

# 현재 cgroup 계층 확인
systemctl status --no-pager | head -5
cat /proc/1234/cgroup
\`\`\`

### systemd로 서비스 리소스 제한

\`\`\`bash
# /etc/systemd/system/myapp.service.d/limits.conf
[Service]
# CPU: 최대 2코어 상당 (200%)
CPUQuota=200%

# 메모리: 최대 4GB (초과 시 OOM Kill)
MemoryMax=4G
MemorySwapMax=0       # 스왑 사용 금지

# I/O: 초당 읽기/쓰기 각 100MB 제한
IOReadBandwidthMax=/dev/sda 100M
IOWriteBandwidthMax=/dev/sda 100M

# 프로세스 수 제한
TasksMax=512
\`\`\`

\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl restart myapp

# 실시간 리소스 사용량 확인
systemctl status myapp | grep -E "Memory|CPU|Tasks"

# cgroup 통계 직접 확인
cat /sys/fs/cgroup/system.slice/myapp.service/memory.current
cat /sys/fs/cgroup/system.slice/myapp.service/cpu.stat
\`\`\`

### 수동 cgroup 생성 및 프로세스 배치

\`\`\`bash
# cgroup 생성
sudo mkdir /sys/fs/cgroup/batch-jobs

# CPU 가중치 설정 (기본 100, 낮을수록 우선순위 낮음)
echo 20 | sudo tee /sys/fs/cgroup/batch-jobs/cpu.weight

# 메모리 한도 설정
echo $((2 * 1024 * 1024 * 1024)) | sudo tee /sys/fs/cgroup/batch-jobs/memory.max

# 프로세스 배치
echo \$BASHPID | sudo tee /sys/fs/cgroup/batch-jobs/cgroup.procs

# 배치 작업 실행 (해당 cgroup에서)
./heavy-batch-job.sh
\`\`\`

---

## 5. NUMA 아키텍처 최적화

멀티소켓 서버에서 NUMA 토폴로지를 무시하면 크로스-노드 메모리 접근으로 레이턴시가 급등합니다.

\`\`\`bash
# NUMA 토폴로지 확인
numactl --hardware
numastat

# 프로세스를 특정 NUMA 노드에 고정
numactl --cpunodebind=0 --membind=0 ./my-program

# PostgreSQL을 NUMA 노드 0에 고정
numactl --cpunodebind=0 --membind=0 -u postgres pg_ctl start

# NUMA 자동 밸런싱 비활성화 (DB 서버 권장)
echo 0 | sudo tee /proc/sys/kernel/numa_balancing
\`\`\`

---

## 6. 워크로드별 권장 프로파일

### 고트래픽 웹서버 (Nginx / HAProxy)

\`\`\`ini
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
fs.file-max = 2097152
\`\`\`

### 데이터베이스 서버 (PostgreSQL / MySQL)

\`\`\`ini
vm.swappiness = 1
vm.dirty_ratio = 5
vm.dirty_background_ratio = 2
vm.nr_hugepages = 4096          # shared_buffers 크기에 맞게 조정
kernel.numa_balancing = 0
net.ipv4.tcp_keepalive_time = 60
net.ipv4.tcp_keepalive_intvl = 10
net.ipv4.tcp_keepalive_probes = 6
fs.aio-max-nr = 1048576
\`\`\`

### 컨테이너 호스트 (Docker / Kubernetes)

\`\`\`ini
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 512
vm.max_map_count = 262144        # Elasticsearch 필수
net.bridge.bridge-nf-call-iptables = 1   # Kubernetes CNI
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
kernel.pid_max = 4194304
\`\`\`

\`\`\`bash
# 설정 검증 — 적용 후 현재값 일괄 확인
for param in net.core.somaxconn vm.swappiness fs.file-max vm.nr_hugepages; do
  echo "\$param = \$(sysctl -n \$param)"
done
\`\`\``,
};

const { error } = await supabase.from('engineer_guides').insert(guide);
if (error) console.error('FAIL:', error.message);
else console.log('OK:', guide.slug);
