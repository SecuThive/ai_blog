import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const guide = {
  title: 'Linux 성능 진단 심화 — perf · eBPF · FlameGraph 실전',
  slug: 'linux-performance-perf-ebpf-flamegraph',
  summary: 'perf로 CPU 핫스팟을 측정하고, eBPF/bpftrace로 커널 이벤트를 추적하며, FlameGraph로 병목을 시각화하는 — 프로덕션 성능 문제를 뿌리부터 파헤치는 심화 가이드.',
  category: 'Linux / Shell',
  tags: ['perf', 'eBPF', 'bpftrace', 'FlameGraph', '성능진단', '커널', 'linux'],
  difficulty: 'advanced',
  os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `## 성능 진단 도구 선택 기준

| 증상 | 먼저 볼 도구 |
|---|---|
| CPU 사용률 높음 | \`perf top\`, \`perf record\` |
| 특정 함수 병목 의심 | FlameGraph |
| 시스템 콜 추적 | \`strace\`, \`bpftrace\` |
| 커널 레벨 I/O·네트워크 추적 | eBPF / \`bcc\` |
| 레이턴시 분포 확인 | \`bpftrace\` 히스토그램 |

---

## 1. perf — CPU 프로파일링

### 설치

\`\`\`bash
# Ubuntu/Debian
sudo apt install -y linux-perf linux-tools-\$(uname -r)

# CentOS/RHEL
sudo yum install -y perf

# 버전 확인
perf version
\`\`\`

### 실시간 핫스팟 확인

\`\`\`bash
# 시스템 전체 CPU 핫 함수 실시간 표시 (top과 유사)
sudo perf top

# 특정 프로세스만 (PID 1234)
sudo perf top -p 1234

# 커널 심볼 포함 (커널 병목 추적 시)
sudo perf top -g --call-graph dwarf
\`\`\`

### 샘플링 레코드 & 분석

\`\`\`bash
# 30초간 시스템 전체 CPU 샘플링 (99Hz)
sudo perf record -F 99 -a -g -- sleep 30

# 특정 프로세스 30초 샘플링
sudo perf record -F 99 -p 1234 -g -- sleep 30

# 결과 분석 (TUI)
sudo perf report --stdio

# 콜 그래프 포함 분석
sudo perf report -g graph --stdio | head -80
\`\`\`

### 특정 이벤트 카운팅

\`\`\`bash
# L1/L2/LLC 캐시 미스 측정
sudo perf stat -e cache-misses,cache-references,L1-dcache-loads,L1-dcache-load-misses \\
  -p 1234 -- sleep 5

# 컨텍스트 스위치·페이지 폴트 측정
sudo perf stat -e context-switches,page-faults,cpu-migrations \\
  -- ./my-program

# 브랜치 예측 실패율 측정
sudo perf stat -e branch-instructions,branch-misses -- ./my-program
\`\`\`

> **캐시 미스율** = cache-misses / cache-references × 100. 10% 초과면 메모리 접근 패턴 최적화를 검토하세요.

---

## 2. FlameGraph — 병목 시각화

FlameGraph는 perf 샘플을 SVG 불꽃 그래프로 변환해 콜스택 전체를 한눈에 보여줍니다.

### 설치

\`\`\`bash
git clone https://github.com/brendangregg/FlameGraph /opt/FlameGraph
export PATH=/opt/FlameGraph:\$PATH
\`\`\`

### perf → FlameGraph 파이프라인

\`\`\`bash
# 1. 샘플링
sudo perf record -F 99 -a -g -- sleep 30

# 2. 텍스트 변환
sudo perf script > perf.out

# 3. 스택 접기
/opt/FlameGraph/stackcollapse-perf.pl perf.out > perf.folded

# 4. SVG 생성
/opt/FlameGraph/flamegraph.pl perf.folded > flamegraph.svg

# 브라우저로 열기
open flamegraph.svg          # macOS
xdg-open flamegraph.svg      # Linux
\`\`\`

### 특정 함수만 필터링

\`\`\`bash
# "nginx" 관련 스택만 추출
grep "nginx" perf.folded | /opt/FlameGraph/flamegraph.pl > nginx-flame.svg

# CPU 시간 상위 함수 텍스트로 요약
sort perf.folded | uniq -c | sort -rn | head -20
\`\`\`

### 차분 FlameGraph (배포 전후 비교)

\`\`\`bash
# 배포 전 샘플
sudo perf record -F 99 -a -g -- sleep 30
sudo perf script | /opt/FlameGraph/stackcollapse-perf.pl > before.folded

# 배포 후 샘플
sudo perf record -F 99 -a -g -- sleep 30
sudo perf script | /opt/FlameGraph/stackcollapse-perf.pl > after.folded

# 차분 SVG 생성 (빨강=증가, 파랑=감소)
/opt/FlameGraph/difffolded.pl before.folded after.folded | \\
  /opt/FlameGraph/flamegraph.pl > diff-flame.svg
\`\`\`

---

## 3. eBPF / bcc — 커널 레벨 동적 추적

eBPF는 커널 코드를 수정하지 않고 커널 이벤트를 안전하게 추적합니다. \`bcc\`는 eBPF 프로그램 모음입니다.

### 설치

\`\`\`bash
# Ubuntu 22.04+
sudo apt install -y bpfcc-tools linux-headers-\$(uname -r)

# 도구 위치 확인
ls /usr/sbin/*-bpfcc 2>/dev/null || ls /usr/share/bcc/tools/
\`\`\`

### 자주 쓰는 bcc 도구

\`\`\`bash
# 프로세스별 디스크 I/O 레이턴시 추적
sudo biolatency-bpfcc -D 10

# 느린 파일시스템 작업 추적 (10ms 초과)
sudo fileslower-bpfcc 10

# TCP 연결 추적 (실시간)
sudo tcptracer-bpfcc

# TCP 레이턴시 분포 (히스토그램)
sudo tcplife-bpfcc

# 프로세스 실행 추적 (execve)
sudo execsnoop-bpfcc

# 열린 파일 추적
sudo opensnoop-bpfcc -p 1234

# 컨텍스트 스위치가 많은 프로세스
sudo cpudist-bpfcc 5 1

# 메모리 할당 추적 (malloc 누수 의심 시)
sudo memleak-bpfcc -p 1234
\`\`\`

### 프로파일 + FlameGraph 연동

\`\`\`bash
# bcc profile로 CPU 샘플링 (perf 대안)
sudo /usr/share/bcc/tools/profile -F 99 30 > bcc-profile.out

# FlameGraph 변환
/opt/FlameGraph/flamegraph.pl bcc-profile.out > bcc-flame.svg
\`\`\`

---

## 4. bpftrace — 원라이너 커널 추적

bpftrace는 awk 스타일 문법으로 eBPF 추적 스크립트를 작성합니다.

### 설치

\`\`\`bash
sudo apt install -y bpftrace
\`\`\`

### 핵심 원라이너

\`\`\`bash
# 모든 syscall 호출 빈도 (5초)
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_* { @[probe] = count(); } interval:s:5 { print(@); clear(@); exit(); }'

# read() 시스템 콜 레이턴시 히스토그램
sudo bpftrace -e '
tracepoint:syscalls:sys_enter_read { @ts[tid] = nsecs; }
tracepoint:syscalls:sys_exit_read  /@ts[tid]/ {
  @usecs = hist((nsecs - @ts[tid]) / 1000);
  delete(@ts[tid]);
}
interval:s:10 { print(@usecs); exit(); }'

# 특정 프로세스의 write() 호출당 크기 분포
sudo bpftrace -e '
tracepoint:syscalls:sys_enter_write /comm == "nginx"/ {
  @bytes = hist(args->count);
}
interval:s:10 { print(@bytes); exit(); }'

# TCP 연결 수립 레이턴시
sudo bpftrace -e '
kprobe:tcp_v4_connect { @start[tid] = nsecs; }
kretprobe:tcp_v4_connect /@start[tid]/ {
  @ms = hist((nsecs - @start[tid]) / 1000000);
  delete(@start[tid]);
}
interval:s:10 { print(@ms); exit(); }'

# 디스크 I/O 요청 크기 분포
sudo bpftrace -e '
tracepoint:block:block_rq_issue {
  @bytes = hist(args->bytes);
}
interval:s:5 { print(@bytes); exit(); }'
\`\`\`

### bpftrace 스크립트 파일

\`\`\`bash
# /usr/local/bin/slow-syscalls.bt
# 100ms 초과 syscall 로깅

tracepoint:syscalls:sys_enter_* {
  @start[tid] = nsecs;
  @call[tid]  = probe;
}

tracepoint:syscalls:sys_exit_* /@start[tid]/ {
  \$lat = (nsecs - @start[tid]) / 1000000;
  if (\$lat > 100) {
    printf("%-20s %-30s %dms\\n", comm, @call[tid], \$lat);
  }
  delete(@start[tid]);
  delete(@call[tid]);
}
\`\`\`

\`\`\`bash
sudo bpftrace /usr/local/bin/slow-syscalls.bt
\`\`\`

---

## 5. strace — 시스템 콜 디버깅

\`\`\`bash
# 기본 추적 (요약)
sudo strace -c -p 1234

# 특정 syscall만 추적 (파일 관련)
sudo strace -e trace=openat,read,write,close -p 1234

# 타임스탬프·레이턴시 포함
sudo strace -T -tt -p 1234 2>&1 | head -50

# 네트워크 관련 syscall만 추적
sudo strace -e trace=network -p 1234

# 자식 프로세스까지 추적
sudo strace -f -e trace=execve ./my-program
\`\`\`

---

## 6. 실전 — 프로덕션 CPU 스파이크 진단 절차

\`\`\`bash
# 1. 어느 프로세스인지 특정
top -b -n1 | head -20
ps aux --sort=-%cpu | head -10

# 2. 해당 PID의 스레드별 CPU 확인
top -H -p 1234

# 3. perf로 30초 샘플링
sudo perf record -F 99 -p 1234 -g -- sleep 30

# 4. FlameGraph 생성
sudo perf script | /opt/FlameGraph/stackcollapse-perf.pl | \\
  /opt/FlameGraph/flamegraph.pl > /tmp/flame-\$(date +%H%M).svg

# 5. FlameGraph에서 넓은 탑 함수 확인 → 해당 함수 코드 리뷰

# 6. bpftrace로 해당 함수 호출 빈도 추가 확인
sudo bpftrace -e 'uprobe:/usr/bin/myapp:slow_function { @calls = count(); } interval:s:5 { print(@calls); }'
\`\`\`

> **FlameGraph 읽는 법**: X축은 CPU 시간 비율(넓을수록 소비 시간 많음), Y축은 콜스택 깊이입니다. **지붕이 평평하고 넓은 함수**가 CPU를 가장 많이 소비하는 핵심 병목입니다.`,
};

const { error } = await supabase.from('engineer_guides').insert(guide);
if (error) console.error('FAIL:', error.message);
else console.log('OK:', guide.slug);
