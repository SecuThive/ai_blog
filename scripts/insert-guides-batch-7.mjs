import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── Git / CI·CD ────────────────────────────────────────
  {
    title: 'GitLab CI/CD 파이프라인 완전 가이드',
    slug: 'gitlab-cicd-pipeline-guide',
    summary: '.gitlab-ci.yml 문법, 스테이지·잡·아티팩트 설정, Docker 빌드 자동화, 환경별 배포, GitLab Runner 등록까지 GitLab CI/CD 핵심을 설명합니다.',
    category: 'Git / CI·CD',
    tags: ['gitlab', 'cicd', 'pipeline', '자동화', 'devops'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## .gitlab-ci.yml 기본 구조

\`\`\`yaml
# .gitlab-ci.yml

stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"
  IMAGE_NAME: \$CI_REGISTRY_IMAGE

# 잡 정의
lint:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run lint

test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm test
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
\`\`\`

---

## 스테이지와 잡 흐름

\`\`\`yaml
stages:
  - test       # 병렬 실행
  - build      # test 완료 후
  - staging    # build 완료 후
  - production # 수동 승인 후

build-image:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker login -u \$CI_REGISTRY_USER -p \$CI_REGISTRY_PASSWORD \$CI_REGISTRY
    - docker build -t \$IMAGE_NAME:\$CI_COMMIT_SHORT_SHA .
    - docker push \$IMAGE_NAME:\$CI_COMMIT_SHORT_SHA
  only:
    - main
    - develop
\`\`\`

---

## 환경별 배포

\`\`\`yaml
deploy-staging:
  stage: staging
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - kubectl set image deployment/myapp myapp=\$IMAGE_NAME:\$CI_COMMIT_SHORT_SHA
  only:
    - develop

deploy-production:
  stage: production
  environment:
    name: production
    url: https://example.com
  script:
    - kubectl set image deployment/myapp myapp=\$IMAGE_NAME:\$CI_COMMIT_TAG
  when: manual           # 수동 승인 필요
  only:
    - tags
\`\`\`

---

## 캐시와 아티팩트

\`\`\`yaml
# 캐시 — 잡 간 재사용 (node_modules 등)
cache:
  key: \$CI_COMMIT_REF_SLUG
  paths:
    - node_modules/
    - .npm/

# 아티팩트 — 잡 간 파일 전달 + 다운로드 가능
build:
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week    # 보관 기간

# 아티팩트 사용
deploy:
  dependencies:
    - build
  script:
    - ls dist/           # build 잡의 아티팩트 사용 가능
\`\`\`

---

## 조건 실행 — rules

\`\`\`yaml
test:
  script: npm test
  rules:
    - if: '\$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '\$CI_COMMIT_BRANCH == "main"'
    - if: '\$CI_COMMIT_TAG'
      when: never        # 태그에서는 실행 안 함

# 파일 변경 시에만 실행
backend-test:
  script: npm test
  rules:
    - changes:
        - src/**/*
        - package.json
\`\`\`

---

## GitLab Runner 등록

\`\`\`bash
# Runner 설치 (Ubuntu)
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt install -y gitlab-runner

# GitLab 프로젝트 → Settings → CI/CD → Runners에서 토큰 확인
sudo gitlab-runner register \
  --url https://gitlab.com \
  --registration-token YOUR_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "my-runner"

# 상태 확인
sudo gitlab-runner status
sudo gitlab-runner list
\`\`\`

---

## 내장 환경변수 주요 목록

| 변수 | 값 |
|---|---|
| \`\$CI_COMMIT_SHA\` | 전체 커밋 해시 |
| \`\$CI_COMMIT_SHORT_SHA\` | 짧은 커밋 해시 |
| \`\$CI_COMMIT_BRANCH\` | 브랜치 이름 |
| \`\$CI_COMMIT_TAG\` | 태그 이름 |
| \`\$CI_REGISTRY_IMAGE\` | 프로젝트 컨테이너 레지스트리 |
| \`\$CI_ENVIRONMENT_NAME\` | 배포 환경 이름 |
| \`\$CI_PIPELINE_SOURCE\` | 트리거 소스 (push, schedule 등) |`,
  },

  {
    title: 'Git 서브모듈 완전 가이드 — 추가·업데이트·삭제',
    slug: 'git-submodule-guide',
    summary: 'Git 서브모듈로 외부 레포지토리를 프로젝트에 포함하고, 초기화·업데이트·삭제하는 방법과 흔한 실수 해결법을 설명합니다.',
    category: 'Git / CI·CD',
    tags: ['git', 'submodule', '서브모듈', '모노레포', '의존성'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'macOS'],
    author: 'Nodelog',
    content: `## 서브모듈이란?

하나의 Git 레포지토리 안에 다른 Git 레포지토리를 포함하는 방법입니다. 공통 라이브러리, 서드파티 코드, 공유 설정을 여러 프로젝트에서 재사용할 때 사용합니다.

---

## 서브모듈 추가

\`\`\`bash
# 서브모듈 추가
git submodule add https://github.com/org/shared-lib.git libs/shared

# 특정 브랜치 추적
git submodule add -b main https://github.com/org/shared-lib.git libs/shared

# 추가 후 생성되는 파일
# .gitmodules — 서브모듈 설정 파일
cat .gitmodules
# [submodule "libs/shared"]
#     path = libs/shared
#     url = https://github.com/org/shared-lib.git
#     branch = main

# 커밋
git add .gitmodules libs/shared
git commit -m "feat: add shared-lib submodule"
\`\`\`

---

## 서브모듈 포함 레포 클론

\`\`\`bash
# 방법 1: 클론 시 한 번에
git clone --recurse-submodules https://github.com/org/myproject.git

# 방법 2: 이미 클론된 경우
git submodule init
git submodule update

# 한 줄로
git submodule update --init --recursive
\`\`\`

---

## 서브모듈 업데이트

\`\`\`bash
# 특정 서브모듈을 최신으로
cd libs/shared
git pull origin main
cd ../..
git add libs/shared
git commit -m "chore: update shared-lib to latest"

# 모든 서브모듈 한 번에 최신으로
git submodule update --remote --merge

# 병렬 업데이트 (서브모듈 많을 때)
git submodule update --remote --jobs 4
\`\`\`

---

## 서브모듈 삭제

\`\`\`bash
# 1. .gitmodules에서 항목 제거
git config -f .gitmodules --remove-section submodule.libs/shared

# 2. .git/config에서 제거
git config --remove-section submodule.libs/shared

# 3. 스테이징에서 제거
git rm --cached libs/shared

# 4. 파일 삭제
rm -rf libs/shared

# 5. .git/modules 정리
rm -rf .git/modules/libs/shared

# 6. 커밋
git add .gitmodules
git commit -m "chore: remove shared-lib submodule"
\`\`\`

---

## 상태 확인

\`\`\`bash
# 서브모듈 상태
git submodule status
# + abc1234 libs/shared (v1.2.3)
# ^ = 앞서 있음, - = 초기화 안 됨, + = 변경됨

# 서브모듈 포함 전체 상태
git status --recurse-submodules

# 서브모듈 요약
git submodule summary
\`\`\`

---

## 자주 발생하는 문제

\`\`\`bash
# 문제: 서브모듈이 빈 디렉터리
git submodule update --init --recursive

# 문제: detached HEAD 상태
cd libs/shared
git checkout main
git pull

# 문제: URL 변경 후 업데이트 안 됨
git submodule sync
git submodule update --init

# 문제: 서브모듈 변경사항을 부모 레포가 인식 못 함
cd ..
git add libs/shared    # 포인터(커밋 해시)를 업데이트
git commit -m "chore: update submodule pointer"
\`\`\`

---

## GitHub Actions에서 서브모듈

\`\`\`yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive      # 서브모듈 포함 체크아웃
    token: \${{ secrets.PAT }}  # private 서브모듈은 PAT 필요
\`\`\``,
  },

  // ── 네트워킹 / 서버 ────────────────────────────────────
  {
    title: 'WireGuard VPN 설치·설정 완전 가이드',
    slug: 'wireguard-vpn-setup',
    summary: 'WireGuard 서버·클라이언트 설치, 키 생성, 설정 파일 작성, 피어 추가, 라우팅 설정까지 사이트 간 VPN과 원격 접속 구성 방법을 설명합니다.',
    category: '네트워킹 / 서버',
    tags: ['wireguard', 'vpn', '터널링', '보안', '네트워크', 'linux'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## WireGuard 특징

- 기존 OpenVPN/IPSec 대비 코드베이스가 매우 작아 공격 표면 최소
- UDP 기반, 기본 포트 51820
- 커널 모듈로 빠른 처리속도
- 설정 파일 단순 (10줄 내외)

---

## 서버 설치

\`\`\`bash
# Ubuntu 20.04+
sudo apt update && sudo apt install -y wireguard

# CentOS / RHEL
sudo yum install -y epel-release
sudo yum install -y wireguard-tools
\`\`\`

---

## 키 생성

\`\`\`bash
# 서버 키 생성
wg genkey | sudo tee /etc/wireguard/server_private.key \
  | wg pubkey | sudo tee /etc/wireguard/server_public.key

# 클라이언트 키 생성
wg genkey | tee client_private.key | wg pubkey > client_public.key

# 키 확인
sudo cat /etc/wireguard/server_private.key
sudo cat /etc/wireguard/server_public.key

# 권한 설정
sudo chmod 600 /etc/wireguard/server_private.key
\`\`\`

---

## 서버 설정 파일

\`\`\`bash
sudo nano /etc/wireguard/wg0.conf
\`\`\`

\`\`\`ini
[Interface]
PrivateKey = <server_private_key>
Address = 10.0.0.1/24         # VPN 서버 내부 IP
ListenPort = 51820
DNS = 1.1.1.1

# 인터넷 공유 (선택) — 클라이언트 트래픽 전체를 서버로 라우팅
PostUp   = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# 클라이언트 1 (피어)
[Peer]
PublicKey = <client1_public_key>
AllowedIPs = 10.0.0.2/32      # 이 클라이언트의 VPN IP
\`\`\`

---

## IP 포워딩 활성화

\`\`\`bash
# 즉시 활성화
sudo sysctl -w net.ipv4.ip_forward=1

# 영구 적용
echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
\`\`\`

---

## 서버 시작

\`\`\`bash
# WireGuard 시작
sudo wg-quick up wg0

# 부팅 시 자동 시작
sudo systemctl enable --now wg-quick@wg0

# 상태 확인
sudo wg show
\`\`\`

---

## 클라이언트 설정

\`\`\`ini
# /etc/wireguard/wg0.conf (클라이언트)
[Interface]
PrivateKey = <client_private_key>
Address = 10.0.0.2/24          # 클라이언트 VPN IP
DNS = 1.1.1.1

[Peer]
PublicKey = <server_public_key>
Endpoint = 서버_공인IP:51820
AllowedIPs = 0.0.0.0/0         # 모든 트래픽 → VPN (전체 터널)
# AllowedIPs = 10.0.0.0/24     # VPN 네트워크만 (split tunnel)
PersistentKeepalive = 25        # NAT 유지용
\`\`\`

\`\`\`bash
# 클라이언트 연결
sudo wg-quick up wg0

# 연결 확인
curl ifconfig.me    # 서버 공인 IP가 나오면 성공
sudo wg show
\`\`\`

---

## 방화벽 설정 (서버)

\`\`\`bash
sudo ufw allow 51820/udp
sudo ufw reload
\`\`\`

---

## 피어 동적 추가 (재시작 없이)

\`\`\`bash
# 새 클라이언트 추가
sudo wg set wg0 peer <new_client_public_key> \
  allowed-ips 10.0.0.3/32

# 설정 파일에도 반영
sudo wg-quick save wg0
\`\`\``,
  },

  {
    title: 'curl · wget 실전 가이드 — API 테스트와 파일 다운로드',
    slug: 'curl-wget-practical-guide',
    summary: 'curl로 REST API를 테스트하고 헤더·인증·바디를 다루는 방법, wget으로 파일을 다운로드하고 미러링하는 방법, 두 도구의 차이점을 정리합니다.',
    category: '네트워킹 / 서버',
    tags: ['curl', 'wget', 'api', 'http', '파일다운로드', '네트워크'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## curl 기본

\`\`\`bash
# GET 요청
curl https://api.example.com/users

# 응답 예쁘게 출력 (jq 조합)
curl -s https://api.github.com/users/octocat | jq '.'

# 상태 코드만 확인
curl -o /dev/null -s -w "%{http_code}" https://example.com

# 상세 정보 (헤더 포함)
curl -v https://example.com

# 헤더만 출력
curl -I https://example.com

# 리다이렉트 따라가기
curl -L https://example.com

# 타임아웃 설정
curl --connect-timeout 5 --max-time 30 https://example.com
\`\`\`

---

## HTTP 메서드와 헤더

\`\`\`bash
# POST — JSON 바디
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'

# PUT
curl -X PUT https://api.example.com/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated"}'

# DELETE
curl -X DELETE https://api.example.com/users/1

# PATCH
curl -X PATCH https://api.example.com/users/1 \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com"}'

# 여러 헤더
curl https://api.example.com \
  -H "Accept: application/json" \
  -H "X-Request-ID: abc123" \
  -H "User-Agent: MyScript/1.0"
\`\`\`

---

## 인증

\`\`\`bash
# Bearer 토큰
curl -H "Authorization: Bearer eyJhbGci..." https://api.example.com/me

# Basic Auth
curl -u username:password https://api.example.com
# 또는
curl -H "Authorization: Basic $(echo -n user:pass | base64)" https://api.example.com

# API 키
curl -H "X-API-Key: your-api-key" https://api.example.com

# 쿠키
curl -b "session=abc123; token=xyz" https://example.com

# 쿠키 저장 및 전송
curl -c cookies.txt https://example.com/login -d "user=admin&pass=1234"
curl -b cookies.txt https://example.com/dashboard
\`\`\`

---

## 파일 업로드

\`\`\`bash
# 폼 파일 업로드 (multipart)
curl -F "file=@/path/to/file.pdf" https://api.example.com/upload
curl -F "file=@image.jpg;type=image/jpeg" -F "name=profile" https://example.com

# 바이너리 데이터 직접
curl -X PUT --data-binary @file.tar.gz https://example.com/upload
\`\`\`

---

## 파일 다운로드

\`\`\`bash
# 파일 저장 (-O: 원본 파일명, -o: 지정 파일명)
curl -O https://example.com/file.tar.gz
curl -o myfile.tar.gz https://example.com/file.tar.gz

# 진행률 표시
curl -# -O https://example.com/large-file.iso

# 이어받기 (중단된 다운로드)
curl -C - -O https://example.com/large-file.iso

# 병렬 다운로드 (xargs 조합)
cat urls.txt | xargs -n1 -P4 curl -O
\`\`\`

---

## wget 기본

\`\`\`bash
# 파일 다운로드
wget https://example.com/file.tar.gz

# 이어받기
wget -c https://example.com/large-file.iso

# 조용히 (진행률 없이)
wget -q https://example.com/file.tar.gz

# 재시도 횟수
wget --tries=5 https://example.com/file.tar.gz

# 특정 파일명으로 저장
wget -O myfile.tar.gz https://example.com/file

# 재귀 다운로드 (사이트 미러링)
wget -r -np -nH --cut-dirs=1 https://example.com/docs/

# 특정 파일 형식만
wget -r -A "*.pdf" https://example.com/papers/
\`\`\`

---

## curl vs wget 선택 기준

| 상황 | 추천 |
|---|---|
| REST API 테스트 | curl |
| HTTP 메서드/헤더 커스텀 | curl |
| 파일 다운로드 (이어받기) | wget |
| 사이트 미러링 | wget |
| 스크립트 내 API 호출 | curl |
| FTP 파일 다운로드 | curl |`,
  },

  {
    title: 'SSH 포트포워딩 · 터널링 완전 가이드',
    slug: 'ssh-port-forwarding-tunneling',
    summary: '로컬 포트포워딩으로 DB·Redis에 접속하고, 원격 포트포워딩으로 내부 서버를 외부에 노출하며, 동적 포트포워딩으로 SOCKS 프록시를 구성하는 방법을 설명합니다.',
    category: '네트워킹 / 서버',
    tags: ['ssh', '포트포워딩', '터널링', 'socks', 'bastion', '네트워크'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'macOS'],
    author: 'Nodelog',
    content: `## 3가지 포트포워딩 방식

| 방식 | 명령 플래그 | 용도 |
|---|---|---|
| 로컬 (Local) | \`-L\` | 로컬 포트 → 원격 서비스 접속 |
| 원격 (Remote) | \`-R\` | 원격 포트 → 로컬 서비스 노출 |
| 동적 (Dynamic) | \`-D\` | SOCKS 프록시 (전체 트래픽 터널) |

---

## 로컬 포트포워딩 (-L)

**패턴**: 내 컴퓨터의 포트 → 서버를 경유 → 서버 측 서비스 접속

\`\`\`bash
# 문법
ssh -L [로컬IP:]로컬포트:목적지호스트:목적지포트 서버

# 서버의 PostgreSQL에 로컬에서 접속
ssh -L 15432:localhost:5432 deploy@prod-server.example.com
# 이제 로컬에서: psql -h localhost -p 15432 -U admin

# 방화벽 뒤 Redis 접속
ssh -L 16379:10.0.1.5:6379 deploy@bastion.example.com
# redis-cli -h localhost -p 16379

# 여러 포트 동시에
ssh -L 15432:localhost:5432 \
    -L 16379:localhost:6379 \
    -L 18080:localhost:8080 \
    deploy@prod-server.example.com

# 셸 없이 터널만 유지 (-N)
ssh -N -L 15432:localhost:5432 deploy@prod-server.example.com

# 백그라운드로 실행 (-f -N)
ssh -f -N -L 15432:localhost:5432 deploy@prod-server.example.com
\`\`\`

---

## 원격 포트포워딩 (-R)

**패턴**: 서버의 포트 → 로컬 서비스 노출 (NAT 뒤 로컬 서버를 외부에 공개)

\`\`\`bash
# 문법
ssh -R [원격IP:]원격포트:목적지호스트:목적지포트 서버

# 로컬 3000 포트를 서버의 8080으로 노출
ssh -R 8080:localhost:3000 user@public-server.example.com
# 이제 public-server.example.com:8080 접속 → 내 localhost:3000

# 서버 측 /etc/ssh/sshd_config 설정 필요
# GatewayPorts yes    # 외부에서 원격 포트 접속 허용
\`\`\`

---

## 동적 포트포워딩 (-D) — SOCKS 프록시

**패턴**: 로컬 포트를 SOCKS5 프록시로 — 모든 트래픽을 서버 경유

\`\`\`bash
# SOCKS5 프록시 시작 (로컬 1080 포트)
ssh -D 1080 user@server.example.com

# 또는 백그라운드
ssh -f -N -D 1080 user@server.example.com

# curl로 SOCKS5 프록시 사용
curl --socks5 localhost:1080 https://example.com

# 브라우저 설정:
# Firefox → 설정 → 네트워크 → SOCKS5 프록시 localhost:1080
\`\`\`

---

## ~/.ssh/config로 터널 자동화

\`\`\`
# 접속 시 자동으로 DB 터널 열기
Host prod-with-tunnel
    HostName prod-server.example.com
    User deploy
    LocalForward 15432 localhost:5432
    LocalForward 16379 localhost:6379

# 점프 호스트를 통한 터널
Host internal-via-bastion
    HostName 10.0.1.50
    User ubuntu
    ProxyJump bastion
    LocalForward 18080 localhost:8080
\`\`\`

\`\`\`bash
# 설정 후 한 번에 접속 + 터널
ssh prod-with-tunnel
\`\`\`

---

## 터널 프로세스 관리

\`\`\`bash
# 실행 중인 SSH 터널 확인
ps aux | grep "ssh -"
# 또는
ss -tlnp | grep ssh

# 특정 포트의 터널 종료
pkill -f "ssh -N -L 15432"

# autossh로 터널 자동 재연결
sudo apt install -y autossh
autossh -M 0 -f -N -L 15432:localhost:5432 deploy@prod-server.example.com
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
