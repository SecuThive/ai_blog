import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── Linux / Shell ─────────────────────────────────────
  {
    title: 'jq 실전 가이드 — JSON 파싱·필터링·변환',
    slug: 'jq-json-processing-guide',
    summary: 'curl API 응답, 설정 파일, 로그를 jq로 파싱·필터링·변환하는 현업 패턴을 정리합니다. 셸 스크립트에서 JSON을 다루는 표준 방법입니다.',
    category: 'Linux / Shell',
    tags: ['jq', 'json', 'cli', 'api', '파싱', 'shell'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 설치

\`\`\`bash
sudo apt install -y jq        # Ubuntu / Debian
sudo yum install -y jq        # CentOS / RHEL
brew install jq               # macOS

jq --version
\`\`\`

---

## 기본 사용법

\`\`\`bash
# . : 입력을 그대로 예쁘게 출력
echo '{"name":"Alice","age":30}' | jq '.'

# 파일에서 읽기
jq '.' data.json

# 특정 필드 추출
echo '{"name":"Alice","age":30}' | jq '.name'
# "Alice"

# 문자열만 (따옴표 없이)
jq -r '.name' data.json
\`\`\`

---

## 배열 처리

\`\`\`bash
# 배열 전체 순회
echo '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]' | jq '.[]'

# 특정 인덱스
jq '.[0]' array.json
jq '.[-1]' array.json         # 마지막

# 특정 필드만 추출
jq '.[].name' array.json

# 배열 길이
jq 'length' array.json

# 슬라이스
jq '.[2:5]' array.json
\`\`\`

---

## 필터링 — select

\`\`\`bash
# 조건에 맞는 항목만
jq '.[] | select(.age > 25)' users.json

# 여러 조건
jq '.[] | select(.age > 20 and .active == true)' users.json

# 특정 값 포함
jq '.[] | select(.role == "admin")' users.json

# null 제거
jq '.[] | select(.email != null)' users.json
\`\`\`

---

## 변환 — map · to_entries · from_entries

\`\`\`bash
# map으로 전체 변환
jq 'map(.age += 1)' users.json

# 필드 선택해서 새 오브젝트 생성
jq '.[] | {id, name, email: .contact.email}' users.json

# 키-값 쌍으로 변환
echo '{"a":1,"b":2}' | jq 'to_entries'
# [{"key":"a","value":1},{"key":"b","value":2}]

# 키 이름 변경
jq '[.[] | {userId: .id, userName: .name}]' users.json
\`\`\`

---

## 실전 패턴

\`\`\`bash
# curl API 응답 파싱
curl -s https://api.github.com/repos/nodejs/node/releases \
  | jq -r '.[0] | "버전: \(.tag_name)  날짜: \(.published_at)"'

# AWS CLI JSON 파싱
aws ec2 describe-instances \
  | jq -r '.Reservations[].Instances[] | "\(.InstanceId) \(.State.Name) \(.PublicIpAddress // "N/A")"'

# Docker inspect
docker inspect mycontainer | jq '.[0].NetworkSettings.IPAddress'

# JSON → CSV 변환
jq -r '.[] | [.id, .name, .email] | @csv' users.json

# 여러 JSON 파일 병합
jq -s '.[0] * .[1]' base.json override.json

# 빈 값 기본값 처리
jq '.users[] | .nickname // "anonymous"' data.json

# 숫자 포매팅
jq '.[] | .price | tostring + "원"' products.json

# 특정 키가 있는 항목만
jq '.[] | select(has("email"))' users.json

# 중첩 필드 안전하게 접근 (없으면 null)
jq '.user?.address?.city // "unknown"' data.json
\`\`\`

---

## 변수와 조건

\`\`\`bash
# 변수 정의
jq --arg name "Alice" '.[] | select(.name == \$name)' users.json

# 숫자 변수
jq --argjson min 25 '.[] | select(.age >= \$min)' users.json

# if-then-else
jq '.[] | if .age >= 18 then .name + " (성인)" else .name + " (미성년)" end' users.json
\`\`\``,
  },

  {
    title: 'SSH Config 파일 완전 활용 — 다중 서버 접속 관리',
    slug: 'ssh-config-client-guide',
    summary: '~/.ssh/config로 다중 서버 단축키·점프 호스트·키 파일·포트포워딩을 관리하고 ssh-agent로 키를 자동 로드하는 방법을 설명합니다.',
    category: 'Linux / Shell',
    tags: ['ssh', 'ssh-config', '다중서버', 'jump-host', 'ssh-agent'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## ~/.ssh/config 기본 구조

\`\`\`
Host <별칭>
    HostName <실제 IP 또는 도메인>
    User <사용자명>
    Port <포트>
    IdentityFile <키 파일 경로>
\`\`\`

파일 생성:

\`\`\`bash
mkdir -p ~/.ssh
touch ~/.ssh/config
chmod 600 ~/.ssh/config
\`\`\`

---

## 기본 서버 등록

\`\`\`
# ~/.ssh/config

# 운영 서버
Host prod
    HostName 203.0.113.10
    User deploy
    Port 2222
    IdentityFile ~/.ssh/prod_rsa

# 개발 서버
Host dev
    HostName 203.0.113.20
    User ubuntu
    IdentityFile ~/.ssh/dev_rsa

# AWS 인스턴스
Host aws-web
    HostName ec2-12-34-56-78.ap-northeast-2.compute.amazonaws.com
    User ec2-user
    IdentityFile ~/.ssh/my-key.pem
\`\`\`

\`\`\`bash
# 이제 이렇게 접속
ssh prod
ssh dev
ssh aws-web
\`\`\`

---

## 글로벌 기본값 설정

\`\`\`
Host *
    ServerAliveInterval 60      # 60초마다 keepalive
    ServerAliveCountMax 3       # 3번 응답 없으면 종료
    AddKeysToAgent yes          # ssh-agent에 자동 추가
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking ask   # 새 호스트 확인 요청
\`\`\`

---

## 점프 호스트 (Bastion/Jump Server)

외부에서 직접 접속할 수 없는 내부 서버에 경유 서버를 통해 접속합니다.

\`\`\`
Host bastion
    HostName 203.0.113.1
    User admin
    IdentityFile ~/.ssh/bastion_rsa

Host internal-db
    HostName 10.0.1.50
    User ubuntu
    IdentityFile ~/.ssh/internal_rsa
    ProxyJump bastion          # bastion 경유
    # 구버전 OpenSSH:
    # ProxyCommand ssh -W %h:%p bastion
\`\`\`

\`\`\`bash
ssh internal-db    # bastion 경유 자동 접속
\`\`\`

---

## 포트포워딩 자동 설정

\`\`\`
Host tunnel-db
    HostName prod-server.example.com
    User deploy
    LocalForward 15432 localhost:5432   # 로컬 15432 → 서버 5432
    LocalForward 16379 localhost:6379   # 로컬 16379 → 서버 6379
\`\`\`

\`\`\`bash
ssh -N tunnel-db    # 포트포워딩만 (셸 없이)
# 이제 로컬에서 localhost:15432로 PostgreSQL 접속 가능
\`\`\`

---

## ssh-agent — 키 자동 관리

비밀번호 없이 키를 반복 사용하려면 ssh-agent를 활용합니다.

\`\`\`bash
# agent 시작
eval "\$(ssh-agent -s)"

# 키 등록
ssh-add ~/.ssh/id_ed25519
ssh-add ~/.ssh/prod_rsa

# 등록된 키 목록
ssh-add -l

# 모든 키 제거
ssh-add -D

# macOS: Keychain에 저장 (재부팅 후에도 유지)
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
\`\`\`

~/.ssh/config에 추가하면 자동 로드됩니다:

\`\`\`
Host *
    AddKeysToAgent yes
    UseKeychain yes    # macOS 전용
\`\`\`

---

## 파일 권한 (중요)

\`\`\`bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/authorized_keys
\`\`\`

권한이 너무 넓으면 SSH가 키 파일 사용을 거부합니다.`,
  },

  {
    title: 'strace · ltrace 실전 — 시스템 콜과 라이브러리 콜 추적',
    slug: 'strace-ltrace-debugging-guide',
    summary: 'strace로 프로세스의 시스템 콜을 추적해 파일·네트워크·신호 관련 문제를 진단하고, ltrace로 라이브러리 함수 호출을 분석하는 방법을 설명합니다.',
    category: 'Linux / Shell',
    tags: ['strace', 'ltrace', '디버깅', '시스템콜', 'linux', '트러블슈팅'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## strace 기본 사용법

\`\`\`bash
sudo apt install -y strace    # Ubuntu / Debian

# 프로그램 실행하며 추적
strace ls /tmp

# 실행 중인 프로세스 추적 (PID)
sudo strace -p 1234

# 자식 프로세스도 추적
sudo strace -f -p 1234

# 시스템 콜 통계 요약 (-c)
strace -c ls /tmp

# 특정 시스템 콜만 추적
strace -e trace=open,read,write ls /tmp

# 타임스탬프 출력
strace -t ls /tmp              # 절대 시간
strace -r ls /tmp              # 상대 시간 (콜 간 간격)
\`\`\`

---

## 파일 접근 추적

어떤 파일을 열고 읽는지 확인할 때 가장 많이 사용합니다.

\`\`\`bash
# 열리는 파일 추적
strace -e trace=openat,open,read,write,close ls /tmp 2>&1 | grep open

# 실용적인 패턴: 설정 파일 위치 찾기
strace -e trace=openat nginx 2>&1 | grep "\.conf"

# 어떤 파일을 읽는지 확인
strace -e trace=openat python3 myapp.py 2>&1 | grep -v "No such file"

# 파일 출력을 별도 파일로
strace -o trace.log -p 1234
\`\`\`

---

## 네트워크 소켓 추적

\`\`\`bash
# 네트워크 관련 콜만
strace -e trace=network curl https://example.com

# connect 실패 원인 확인
strace -e trace=connect,socket myapp 2>&1 | grep -E "connect|ECONNREFUSED|ETIMEDOUT"

# 수신 데이터 크기 확인
strace -e trace=read,write -s 1024 curl https://example.com 2>&1 | grep "read("
\`\`\`

---

## 통계로 병목 찾기

\`\`\`bash
# 시스템 콜별 호출 횟수·시간 통계
strace -c -p 1234

# 예시 출력
# % time     seconds  usecs/call     calls    errors syscall
# -------  -----------  ----------  --------  -------- -------
#  45.23    0.002345         12      195           read
#  32.11    0.001667          8      208           write
#  12.05    0.000625          6      104   42      openat   ← 오류 많음

# 느린 시스템 콜 찾기
strace -T -p 1234 2>&1 | awk -F'<' '{if($2+0 > 0.01) print}' | head -20
\`\`\`

---

## 실전 진단 패턴

\`\`\`bash
# 프로그램이 갑자기 종료될 때 — 시그널 확인
strace -e trace=signal -p 1234

# Permission denied 원인 찾기
strace -e trace=openat,access myapp 2>&1 | grep "EACCES\|EPERM"

# 데드락 의심 — 차단된 시스템 콜 확인
sudo strace -p 1234        # 멈춰있으면 어느 콜에서 블로킹인지 표시

# execve로 어떤 프로그램을 실행하는지 추적
strace -e trace=execve -f bash myscript.sh 2>&1 | grep execve
\`\`\`

---

## ltrace — 라이브러리 함수 추적

\`\`\`bash
sudo apt install -y ltrace

# 라이브러리 콜 추적
ltrace ls /tmp

# 특정 함수만
ltrace -e malloc,free myapp

# 통계 요약
ltrace -c myapp

# strace와 함께 (시스템 콜 + 라이브러리 콜)
ltrace -S myapp 2>&1 | head -50
\`\`\`

---

## strace vs ltrace vs perf 선택 기준

| 도구 | 용도 |
|---|---|
| strace | 파일·네트워크·프로세스 관련 커널 인터페이스 문제 |
| ltrace | 공유 라이브러리 함수 호출 패턴 (malloc 누수 등) |
| perf | CPU 병목, 핫스팟 찾기, 성능 카운터 |`,
  },

  // ── Docker / 컨테이너 ──────────────────────────────────
  {
    title: 'Helm 차트 기초 — Kubernetes 패키지 관리',
    slug: 'helm-chart-basics',
    summary: 'Helm 설치, 공개 차트 배포, values.yaml로 커스터마이징, 직접 차트 작성, 릴리즈 관리까지 Kubernetes 패키지 관리 필수 기초를 설명합니다.',
    category: 'Docker / 컨테이너',
    tags: ['helm', 'kubernetes', 'k8s', '차트', '패키지관리', 'devops'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## Helm 설치

\`\`\`bash
# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# macOS
brew install helm

# 버전 확인
helm version
\`\`\`

---

## 기본 개념

| 용어 | 설명 |
|---|---|
| **Chart** | Helm 패키지 (k8s 리소스 템플릿 모음) |
| **Repository** | Chart 저장소 |
| **Release** | 클러스터에 배포된 Chart 인스턴스 |
| **Values** | Chart 설정값 (values.yaml) |

---

## 레포지토리 관리

\`\`\`bash
# 공식 stable 레포 추가
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# 레포 목록
helm repo list

# 레포 업데이트
helm repo update

# 차트 검색
helm search repo nginx
helm search repo bitnami/postgresql
\`\`\`

---

## 차트 배포 (install / upgrade)

\`\`\`bash
# 기본 설치
helm install my-nginx ingress-nginx/ingress-nginx

# 네임스페이스 지정
helm install my-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace

# values.yaml 파일로 커스터마이징
helm install my-app bitnami/wordpress -f custom-values.yaml

# 커맨드라인으로 값 오버라이드
helm install my-pg bitnami/postgresql \
  --set auth.postgresPassword=MySecretPass \
  --set primary.persistence.size=20Gi

# 드라이런 (실제 배포 없이 확인)
helm install my-app bitnami/nginx --dry-run --debug

# 업그레이드 (없으면 설치)
helm upgrade --install my-nginx ingress-nginx/ingress-nginx
\`\`\`

---

## 릴리즈 관리

\`\`\`bash
# 배포된 릴리즈 목록
helm list
helm list -A            # 모든 네임스페이스

# 릴리즈 상태
helm status my-nginx

# 적용된 values 확인
helm get values my-nginx

# 릴리즈 히스토리
helm history my-nginx

# 롤백
helm rollback my-nginx 1    # 1번 리비전으로

# 삭제
helm uninstall my-nginx
\`\`\`

---

## 직접 Chart 생성

\`\`\`bash
helm create mychart

# 생성된 구조
mychart/
├── Chart.yaml           # 차트 메타데이터
├── values.yaml          # 기본 설정값
├── templates/           # k8s 리소스 템플릿
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── _helpers.tpl     # 공통 템플릿 함수
└── charts/              # 의존 차트
\`\`\`

---

## values.yaml 커스터마이징

\`\`\`yaml
# values.yaml
replicaCount: 3

image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  limits:
    cpu: 500m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 64Mi

ingress:
  enabled: true
  host: myapp.example.com
\`\`\`

---

## 템플릿 문법 기초

\`\`\`yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
  labels:
    {{- include "mychart.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        ports:
        - containerPort: {{ .Values.service.port }}
        {{- if .Values.resources }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        {{- end }}
\`\`\`

\`\`\`bash
# 템플릿 렌더링 확인
helm template mychart ./mychart -f my-values.yaml

# 린트
helm lint ./mychart
\`\`\``,
  },

  {
    title: '사설 Docker 레지스트리 — Harbor · AWS ECR · GHCR 운영',
    slug: 'docker-private-registry-guide',
    summary: 'Harbor 셀프호스팅 레지스트리 구축, AWS ECR, GitHub Container Registry에 이미지를 push/pull하는 방법과 Kubernetes에서 사설 레지스트리를 사용하는 패턴을 설명합니다.',
    category: 'Docker / 컨테이너',
    tags: ['docker', 'registry', 'harbor', 'ecr', 'ghcr', 'kubernetes'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 왜 사설 레지스트리인가?

- 외부 공개 불가한 이미지 관리
- Docker Hub rate limit 우회
- 빌드 속도 개선 (내부 네트워크)
- 취약점 스캔·접근 제어 통합

---

## 1. Harbor — 셀프호스팅 레지스트리

\`\`\`bash
# Docker Compose로 Harbor 설치
curl -LO https://github.com/goharbor/harbor/releases/latest/download/harbor-online-installer.tgz
tar xzf harbor-online-installer.tgz
cd harbor

# harbor.yml 설정
cp harbor.yml.tmpl harbor.yml
# hostname, https.certificate, https.private_key 수정

# 설치
sudo ./install.sh --with-trivy    # Trivy 이미지 스캔 포함
\`\`\`

로그인 및 이미지 push:

\`\`\`bash
docker login harbor.example.com
docker tag myapp:latest harbor.example.com/myproject/myapp:latest
docker push harbor.example.com/myproject/myapp:latest
docker pull harbor.example.com/myproject/myapp:latest
\`\`\`

---

## 2. AWS ECR (Elastic Container Registry)

\`\`\`bash
# 레지스트리 생성
aws ecr create-repository \
  --repository-name myapp \
  --region ap-northeast-2

# 레지스트리 URI 확인
aws ecr describe-repositories \
  --query 'repositories[0].repositoryUri' \
  --output text

# 로그인 (토큰 12시간 유효)
aws ecr get-login-password --region ap-northeast-2 \
  | docker login --username AWS \
    --password-stdin 123456789012.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 태그 + push
REGISTRY=123456789012.dkr.ecr.ap-northeast-2.amazonaws.com
docker tag myapp:latest \${REGISTRY}/myapp:latest
docker push \${REGISTRY}/myapp:latest

# 이미지 목록
aws ecr list-images --repository-name myapp

# 오래된 이미지 자동 삭제 정책
aws ecr put-lifecycle-policy \
  --repository-name myapp \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": {"type": "expire"}
    }]
  }'
\`\`\`

---

## 3. GitHub Container Registry (GHCR)

\`\`\`bash
# PAT 생성: GitHub → Settings → Developer settings → Personal access tokens
# 권한: write:packages, read:packages, delete:packages

# 로그인
echo \$GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 이미지 push
docker tag myapp:latest ghcr.io/USERNAME/myapp:latest
docker push ghcr.io/USERNAME/myapp:latest
\`\`\`

GitHub Actions에서:
\`\`\`yaml
- name: Login to GHCR
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: \${{ github.actor }}
    password: \${{ secrets.GITHUB_TOKEN }}

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: ghcr.io/\${{ github.repository }}:latest
\`\`\`

---

## Kubernetes에서 사설 레지스트리 사용

\`\`\`bash
# imagePullSecret 생성
kubectl create secret docker-registry regcred \
  --docker-server=harbor.example.com \
  --docker-username=admin \
  --docker-password=Harbor12345 \
  --namespace=default
\`\`\`

\`\`\`yaml
# deployment.yaml
spec:
  template:
    spec:
      imagePullSecrets:
      - name: regcred
      containers:
      - name: myapp
        image: harbor.example.com/myproject/myapp:latest
\`\`\`

ECR은 IRSA(IAM Role for Service Account)로 시크릿 없이 가능:

\`\`\`bash
# eksctl로 IRSA 설정
eksctl create iamserviceaccount \
  --name ecr-access \
  --namespace default \
  --cluster my-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly \
  --approve
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
