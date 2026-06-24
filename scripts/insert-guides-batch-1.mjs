import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── Linux / Shell ─────────────────────────────────────
  {
    title: 'Bash 고급 스크립트 — 함수·배열·getopts·trap',
    slug: 'bash-scripting-advanced',
    summary: '함수 정의·리턴값, 배열 조작, getopts로 옵션 파싱, trap으로 신호 처리까지 현업 자동화 스크립트 패턴을 정리합니다.',
    category: 'Linux / Shell',
    tags: ['bash', 'shell', '스크립트', '자동화', '함수'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 함수 정의와 리턴

\`\`\`bash
# 기본 함수
greet() {
  local name="$1"          # local로 스코프 제한
  echo "Hello, $name"
}
greet "World"

# 리턴값 (exit code 방식)
is_root() {
  [[ $EUID -eq 0 ]]        # 0이면 true, 1이면 false
}
if is_root; then echo "root입니다"; fi

# stdout으로 값 반환
get_date() {
  date +%Y%m%d
}
TODAY=$(get_date)
echo "$TODAY"
\`\`\`

---

## 배열 조작

\`\`\`bash
# 선언과 접근
fruits=("apple" "banana" "cherry")
echo "\${fruits[0]}"          # apple
echo "\${fruits[@]}"          # 전체
echo "\${#fruits[@]}"         # 길이: 3

# 추가·삭제
fruits+=("grape")
unset fruits[1]              # banana 삭제

# 순회
for fruit in "\${fruits[@]}"; do
  echo "$fruit"
done

# 연관 배열 (Bash 4+)
declare -A config
config[host]="localhost"
config[port]="5432"
echo "\${config[host]}:\${config[port]}"
\`\`\`

---

## getopts로 옵션 파싱

\`\`\`bash
#!/usr/bin/env bash
usage() {
  echo "Usage: $0 [-h] [-n NAME] [-v]"
  exit 1
}

VERBOSE=false
NAME=""

while getopts ":hn:v" opt; do
  case $opt in
    h) usage ;;
    n) NAME="$OPTARG" ;;
    v) VERBOSE=true ;;
    :) echo "Option -$OPTARG requires an argument"; exit 1 ;;
    ?) echo "Unknown option: -$OPTARG"; exit 1 ;;
  esac
done
shift $((OPTIND - 1))       # 남은 positional args

echo "Name: $NAME, Verbose: $VERBOSE"
echo "Remaining args: $*"
\`\`\`

---

## trap으로 신호 처리

\`\`\`bash
# 임시 파일 정리 패턴
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"; echo "Cleaned up"; exit' EXIT INT TERM

# 작업 수행
echo "data" > "$TMPFILE"
sleep 10      # Ctrl+C 눌러도 TMPFILE 자동 삭제됨

# 디버그 트레이스
trap 'echo "Line $LINENO: $BASH_COMMAND"' DEBUG
\`\`\`

---

## 실전 패턴 모음

\`\`\`bash
# 엄격 모드 (항상 권장)
set -euo pipefail

# 색상 출력
RED='\\033[0;31m'; GREEN='\\033[0;32m'; NC='\\033[0m'
echo -e "\${GREEN}OK\${NC} 작업 완료"
echo -e "\${RED}ERROR\${NC} 실패"

# 재시도 함수
retry() {
  local n=0; local max=3; local delay=5
  until "$@"; do
    n=$((n+1))
    [[ $n -ge $max ]] && { echo "Failed after $max attempts"; return 1; }
    echo "Retry $n/$max in \${delay}s..."; sleep $delay
  done
}
retry curl -sf https://example.com

# 로그 함수
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a /var/log/myscript.log
}
log "Started"
\`\`\`

---

## heredoc으로 설정 파일 생성

\`\`\`bash
cat > /etc/myapp/config.conf << EOF
host=\${DB_HOST:-localhost}
port=\${DB_PORT:-5432}
user=\${DB_USER:-app}
EOF

# 변수 치환 없이 그대로 쓰려면
cat > script.sh << 'EOF'
echo "$PATH"   # 그대로 출력됨 (치환 안 함)
EOF
\`\`\``,
  },

  {
    title: 'grep · cut · sort · uniq · wc 파이프라인 실전',
    slug: 'linux-text-processing-grep-cut-sort',
    summary: 'grep 정규식, cut 필드 분리, sort 정렬, uniq 중복 제거, wc 카운트를 파이프라인으로 조합하는 현업 패턴을 정리합니다.',
    category: 'Linux / Shell',
    tags: ['grep', 'cut', 'sort', 'uniq', '텍스트처리', 'linux'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## grep — 패턴 검색

\`\`\`bash
# 기본 검색
grep "error" /var/log/syslog

# 대소문자 무시
grep -i "ERROR" app.log

# 정규식
grep -E "^(GET|POST) /api" access.log

# 역 매칭 (패턴 제외)
grep -v "^#" /etc/nginx/nginx.conf

# 컨텍스트 출력 (전후 3줄)
grep -C 3 "FATAL" app.log

# 재귀 검색
grep -r "TODO" ./src --include="*.ts"

# 파일명만 출력
grep -rl "deprecated" ./src

# 줄 번호 표시
grep -n "listen" /etc/nginx/nginx.conf
\`\`\`

---

## cut — 필드 추출

\`\`\`bash
# 구분자로 필드 추출 (콜론, 3번째 필드)
cut -d: -f3 /etc/passwd

# 여러 필드
cut -d: -f1,3 /etc/passwd

# 바이트 위치로 자르기
cut -c1-10 file.txt

# CSV에서 두 번째 열
cut -d, -f2 data.csv
\`\`\`

---

## sort — 정렬

\`\`\`bash
# 기본 정렬
sort file.txt

# 역순
sort -r file.txt

# 숫자 정렬
sort -n numbers.txt

# 필드 기준 정렬 (공백 구분, 3번째 필드)
sort -k3 -n access.log

# 중복 제거하며 정렬
sort -u file.txt

# 사람이 읽기 쉬운 단위 정렬 (1K, 2M, 3G)
du -sh * | sort -h
\`\`\`

---

## uniq — 중복 처리

\`\`\`bash
# 연속 중복 제거 (sort 후 사용)
sort file.txt | uniq

# 중복 횟수 카운트
sort file.txt | uniq -c

# 중복된 줄만 출력
sort file.txt | uniq -d

# 유일한 줄만 출력
sort file.txt | uniq -u
\`\`\`

---

## wc — 카운트

\`\`\`bash
wc -l file.txt      # 줄 수
wc -w file.txt      # 단어 수
wc -c file.txt      # 바이트 수

# 디렉터리 내 파일 수
ls /etc | wc -l

# 특정 패턴 줄 수
grep -c "ERROR" app.log
\`\`\`

---

## 파이프라인 실전 조합

\`\`\`bash
# Nginx 로그 — 상태코드별 집계 Top 5
awk '{print $9}' /var/log/nginx/access.log \\
  | sort | uniq -c | sort -rn | head -5

# 접속 IP Top 10
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn | head -10

# 에러 로그에서 유니크 에러 메시지만
grep "ERROR" app.log | cut -d']' -f2 | sort -u

# /etc/passwd에서 bash 쓰는 사용자 목록
grep "/bash$" /etc/passwd | cut -d: -f1 | sort

# 프로세스 중 메모리 Top 5
ps aux | sort -k4 -rn | head -6 | awk '{print $4"%", $11}'

# 현재 디렉터리 확장자별 파일 수
find . -type f | grep -oE '\\.[^.]+$' | sort | uniq -c | sort -rn
\`\`\``,
  },

  {
    title: 'Vim 실전 가이드 — 플러그인 없이 현업 활용',
    slug: 'vim-practical-guide',
    summary: '모드 전환, 모션, 비주얼 블록, 매크로, 멀티파일 편집까지 플러그인 없이 Vim을 실무에서 바로 쓸 수 있도록 정리합니다.',
    category: 'Linux / Shell',
    tags: ['vim', '에디터', 'linux', '서버편집', '실전'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 모드 전환

| 키 | 전환 |
|---|---|
| \`i\` | 커서 앞 삽입 |
| \`a\` | 커서 뒤 삽입 |
| \`o\` | 아래 줄 새로 삽입 |
| \`O\` | 위 줄 새로 삽입 |
| \`Esc\` | 노멀 모드 복귀 |
| \`v\` | 비주얼 모드 |
| \`V\` | 줄 비주얼 모드 |
| \`Ctrl+v\` | 블록 비주얼 모드 |
| \`:\` | 커맨드 모드 |

---

## 커서 이동 (노멀 모드)

\`\`\`
h j k l       ← ↓ ↑ →
w / b         다음/이전 단어 시작
e             단어 끝
0 / $         줄 처음/끝
gg / G        파일 처음/끝
50G           50번째 줄로 이동
Ctrl+f / b    페이지 다음/이전
%             짝 괄호로 이동
\`\`\`

---

## 편집 명령

\`\`\`
dd            현재 줄 삭제 (잘라내기)
5dd           5줄 삭제
yy            현재 줄 복사
5yy           5줄 복사
p / P         붙여넣기 (아래/위)
u             실행 취소
Ctrl+r        다시 실행
x             커서 문자 삭제
dw            단어 삭제
cw            단어 변경 (삭제 후 삽입모드)
.             마지막 명령 반복
\`\`\`

---

## 검색과 치환

\`\`\`vim
/pattern        아래로 검색
?pattern        위로 검색
n / N           다음/이전 검색 결과
*               커서 단어 검색

" 전체 치환
:%s/old/new/g

" 확인하며 치환
:%s/old/new/gc

" 특정 범위 (10~20번째 줄)
:10,20s/old/new/g

" 대소문자 무시
:%s/old/new/gi
\`\`\`

---

## 비주얼 블록 (Ctrl+v)

여러 줄에 동시 편집할 때 유용합니다.

1. \`Ctrl+v\`로 블록 비주얼 모드 진입
2. \`j\`/\`k\`로 범위 선택
3. \`I\` → 텍스트 입력 → \`Esc\` : 각 줄 앞에 삽입
4. \`d\` : 블록 삭제
5. \`>\` / \`<\` : 들여쓰기/내어쓰기

---

## 매크로 기록

\`\`\`
qa        'a' 레지스터에 기록 시작
...       편집 작업 수행
q         기록 종료
@a        매크로 실행
10@a      10번 반복 실행
@@        마지막 매크로 재실행
\`\`\`

---

## 멀티파일 편집

\`\`\`vim
:e file.txt           파일 열기
:sp file.txt          수평 분할
:vsp file.txt         수직 분할
Ctrl+w w              분할 창 이동
Ctrl+w =              창 크기 균등

:tabnew file.txt      탭으로 열기
gt / gT               다음/이전 탭
:tabn 2               2번 탭으로 이동

:buffers              열린 버퍼 목록
:b2                   2번 버퍼로 이동
\`\`\`

---

## 유용한 설정 (~/.vimrc)

\`\`\`vim
set number            " 줄 번호
set relativenumber    " 상대 줄 번호
set tabstop=2         " 탭 폭
set expandtab         " 탭을 스페이스로
set autoindent
set hlsearch          " 검색 하이라이트
set incsearch         " 실시간 검색
set ignorecase
set smartcase
syntax on
colorscheme desert
\`\`\``,
  },

  // ── Docker / 컨테이너 ──────────────────────────────────
  {
    title: 'Docker 볼륨 vs 바인드마운트 — 데이터 영속성 완전 가이드',
    slug: 'docker-volume-bind-mount-guide',
    summary: '볼륨과 바인드마운트의 차이점, 백업·복원, 권한 문제 해결까지 Docker 데이터 영속성 패턴을 정리합니다.',
    category: 'Docker / 컨테이너',
    tags: ['docker', 'volume', 'bind-mount', '데이터영속성', '백업'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 볼륨 vs 바인드마운트

| 항목 | 볼륨 | 바인드마운트 |
|---|---|---|
| 위치 | Docker 관리 (/var/lib/docker/volumes) | 호스트 지정 경로 |
| 이식성 | 높음 | 낮음 (경로 의존) |
| 권한 관리 | Docker가 처리 | 호스트 권한 그대로 |
| 백업 | docker volume 명령 | 호스트 파일 시스템 |
| 개발 환경 | 부적합 | 적합 (파일 변경 즉시 반영) |
| 운영 환경 | 적합 | 조건부 적합 |

---

## 볼륨 관리

\`\`\`bash
# 볼륨 생성
docker volume create mydata

# 볼륨 목록
docker volume ls

# 볼륨 상세 정보
docker volume inspect mydata

# 볼륨 마운트
docker run -d \\
  -v mydata:/var/lib/postgresql/data \\
  --name postgres \\
  postgres:16

# 사용 안 하는 볼륨 정리
docker volume prune
\`\`\`

---

## 바인드마운트

\`\`\`bash
# 기본 바인드마운트
docker run -d \\
  -v /host/path:/container/path \\
  nginx

# 읽기 전용 마운트
docker run -d \\
  -v /etc/nginx/conf.d:/etc/nginx/conf.d:ro \\
  nginx

# 현재 디렉터리 마운트 (개발용)
docker run -it \\
  -v $(pwd):/app \\
  -w /app \\
  node:20 bash
\`\`\`

---

## tmpfs 마운트 (메모리, 민감 데이터)

\`\`\`bash
docker run -d \\
  --tmpfs /run:rw,noexec,nosuid,size=64m \\
  --tmpfs /tmp \\
  nginx
\`\`\`

---

## 볼륨 백업·복원

\`\`\`bash
# 백업 — 볼륨을 tar로 추출
docker run --rm \\
  -v mydata:/data \\
  -v $(pwd):/backup \\
  alpine tar czf /backup/mydata-$(date +%Y%m%d).tar.gz -C /data .

# 복원
docker run --rm \\
  -v mydata:/data \\
  -v $(pwd):/backup \\
  alpine tar xzf /backup/mydata-20250101.tar.gz -C /data

# 볼륨 간 복사
docker run --rm \\
  -v source_vol:/from \\
  -v dest_vol:/to \\
  alpine cp -a /from/. /to/
\`\`\`

---

## 권한 문제 해결

\`\`\`bash
# 컨테이너 내부 UID 확인
docker run --rm nginx id

# 호스트 UID와 맞추기
docker run -d \\
  --user 1000:1000 \\
  -v $(pwd)/data:/app/data \\
  myapp

# Dockerfile에서 권한 설정
# RUN chown -R node:node /app
# USER node
\`\`\`

---

## Docker Compose에서 볼륨

\`\`\`yaml
version: '3.8'
services:
  db:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data   # named volume
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # bind mount

  app:
    image: myapp
    volumes:
      - ./src:/app/src   # 개발용 바인드마운트

volumes:
  pgdata:               # 볼륨 선언
    driver: local
\`\`\``,
  },

  {
    title: 'Docker 멀티스테이지 빌드 — 이미지 크기 최소화',
    slug: 'docker-multi-stage-build',
    summary: '멀티스테이지 빌드로 빌드 의존성을 제거해 이미지 크기를 대폭 줄이는 방법을 Node.js, Go, Java 예제로 설명합니다.',
    category: 'Docker / 컨테이너',
    tags: ['docker', 'dockerfile', '멀티스테이지', '이미지최적화', '빌드'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 멀티스테이지 빌드란?

하나의 Dockerfile에서 여러 \`FROM\`을 사용해 빌드 도구는 첫 스테이지에서만 쓰고, 최종 이미지에는 실행에 필요한 결과물만 복사하는 방법입니다.

**일반 빌드**: 빌드 도구 + 소스코드 + 결과물 → 이미지 크기 큼
**멀티스테이지**: 결과물만 복사 → 이미지 크기 최소화

---

## Node.js 예제

\`\`\`dockerfile
# ── Stage 1: 의존성 설치 + 빌드 ──────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# ── Stage 2: 실행 이미지 ──────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 빌드 결과물만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 비루트 사용자
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

---

## Go 예제 (정적 바이너리)

\`\`\`dockerfile
# ── Stage 1: 빌드 ────────────────────────────────
FROM golang:1.22-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# ── Stage 2: scratch (최소 이미지) ───────────────
FROM scratch
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
ENTRYPOINT ["/server"]
\`\`\`

> **scratch** 이미지: OS 없이 바이너리만 포함, 수 MB 수준

---

## Java / Spring Boot 예제

\`\`\`dockerfile
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY . .
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre AS runner
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
\`\`\`

---

## 특정 스테이지만 빌드

\`\`\`bash
# 빌더 스테이지까지만 빌드 (디버그용)
docker build --target builder -t myapp:builder .

# 최종 이미지
docker build -t myapp:latest .
\`\`\`

---

## BuildKit 캐시 최적화

\`\`\`dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

# 패키지만 먼저 복사 → 소스 변경 시 캐시 재사용
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \\
    npm ci

COPY . .
RUN npm run build
\`\`\`

\`\`\`bash
# BuildKit 활성화 후 빌드
DOCKER_BUILDKIT=1 docker build -t myapp .
\`\`\`

---

## 이미지 크기 비교 팁

\`\`\`bash
# 이미지 크기 확인
docker images myapp

# 레이어별 크기 분석
docker history myapp:latest

# dive 도구로 레이어 분석
docker run --rm -it \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  wagoodman/dive myapp:latest
\`\`\``,
  },

  {
    title: 'kubectl 기초 — Pod·Deployment·Service 실전 명령',
    slug: 'kubernetes-basics-kubectl',
    summary: 'kubectl로 Pod·Deployment·Service를 생성·조회·수정·삭제하는 핵심 명령과 실무 패턴을 정리합니다.',
    category: 'Docker / 컨테이너',
    tags: ['kubernetes', 'kubectl', 'pod', 'deployment', 'service'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## kubectl 설치 및 설정

\`\`\`bash
# kubectl 설치 (Linux)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && mv kubectl /usr/local/bin/

# 클러스터 컨텍스트 확인
kubectl config get-contexts
kubectl config use-context my-cluster

# 현재 컨텍스트
kubectl config current-context
\`\`\`

---

## Pod 기본 명령

\`\`\`bash
# Pod 목록
kubectl get pods
kubectl get pods -n kube-system        # 네임스페이스 지정
kubectl get pods -A                    # 모든 네임스페이스
kubectl get pods -o wide               # 노드 정보 포함

# Pod 상세 정보
kubectl describe pod my-pod

# Pod 로그
kubectl logs my-pod
kubectl logs my-pod -c my-container   # 멀티컨테이너
kubectl logs -f my-pod                 # 실시간

# Pod 내부 접속
kubectl exec -it my-pod -- bash
kubectl exec -it my-pod -c my-container -- sh

# Pod 삭제
kubectl delete pod my-pod
\`\`\`

---

## Deployment 관리

\`\`\`bash
# Deployment 생성
kubectl create deployment nginx --image=nginx:latest --replicas=3

# Deployment 목록·상태
kubectl get deployments
kubectl rollout status deployment/nginx

# 이미지 업데이트
kubectl set image deployment/nginx nginx=nginx:1.25

# 롤백
kubectl rollout undo deployment/nginx
kubectl rollout undo deployment/nginx --to-revision=2

# 스케일 조정
kubectl scale deployment nginx --replicas=5

# 롤링 업데이트 히스토리
kubectl rollout history deployment/nginx
\`\`\`

---

## Service 생성·노출

\`\`\`bash
# ClusterIP (내부 통신)
kubectl expose deployment nginx --port=80 --target-port=80

# NodePort (외부 접근)
kubectl expose deployment nginx \\
  --type=NodePort --port=80 --target-port=80

# LoadBalancer (클라우드)
kubectl expose deployment nginx \\
  --type=LoadBalancer --port=80

# Service 목록
kubectl get services
kubectl get svc

# 포트포워딩 (로컬 테스트)
kubectl port-forward service/nginx 8080:80
\`\`\`

---

## YAML 파일로 리소스 관리

\`\`\`yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:1.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "64Mi"
            cpu: "250m"
          limits:
            memory: "128Mi"
            cpu: "500m"
\`\`\`

\`\`\`bash
kubectl apply -f deployment.yaml
kubectl delete -f deployment.yaml
\`\`\`

---

## 유용한 명령 모음

\`\`\`bash
# 리소스 전체 조회
kubectl get all -n my-namespace

# 레이블로 필터
kubectl get pods -l app=nginx

# 이벤트 확인 (문제 진단)
kubectl get events --sort-by='.lastTimestamp'

# 노드 상태
kubectl get nodes -o wide
kubectl top nodes

# Pod 리소스 사용량
kubectl top pods

# ConfigMap / Secret
kubectl get configmap
kubectl get secret
kubectl describe secret my-secret
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
