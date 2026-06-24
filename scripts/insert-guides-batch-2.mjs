import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── Git / CI·CD ────────────────────────────────────────
  {
    title: 'Git Hooks 실전 — pre-commit으로 코드 품질 자동화',
    slug: 'git-hooks-pre-commit-guide',
    summary: 'pre-commit, commit-msg, pre-push 훅을 직접 작성하거나 pre-commit 프레임워크로 린트·포매팅·테스트를 커밋 전에 자동 실행하는 방법을 설명합니다.',
    category: 'Git / CI·CD',
    tags: ['git', 'git-hooks', 'pre-commit', '코드품질', '자동화'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'macOS'],
    author: 'Nodelog',
    content: `## Git Hooks 위치

\`\`\`bash
ls .git/hooks/
# pre-commit.sample, commit-msg.sample, pre-push.sample ...
\`\`\`

훅 파일은 확장자 없이 저장하고 실행 권한을 부여해야 합니다.

---

## pre-commit 훅 직접 작성

\`\`\`bash
# .git/hooks/pre-commit
#!/usr/bin/env bash
set -e

echo "Running pre-commit checks..."

# ESLint 검사
if ! npx eslint --max-warnings 0 $(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(js|ts)$'); then
  echo "ESLint failed. Fix errors before committing."
  exit 1
fi

# Prettier 포매팅 확인
if ! npx prettier --check $(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(js|ts|json|css)$'); then
  echo "Prettier check failed. Run: npx prettier --write ."
  exit 1
fi

echo "Pre-commit checks passed."
\`\`\`

\`\`\`bash
chmod +x .git/hooks/pre-commit
\`\`\`

---

## commit-msg 훅 — 커밋 메시지 형식 강제

\`\`\`bash
# .git/hooks/commit-msg
#!/usr/bin/env bash
COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Conventional Commits 형식 검사
PATTERN='^(feat|fix|docs|style|refactor|test|chore|perf|ci)(\\(.+\\))?: .{1,72}'
if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo "❌ 커밋 메시지 형식 오류"
  echo "   올바른 형식: feat: 기능 추가"
  echo "   타입: feat|fix|docs|style|refactor|test|chore|perf|ci"
  exit 1
fi
\`\`\`

---

## pre-push 훅 — 테스트 통과 후 푸시

\`\`\`bash
# .git/hooks/pre-push
#!/usr/bin/env bash
set -e

echo "Running tests before push..."
npm test -- --passWithNoTests

echo "All tests passed. Pushing..."
\`\`\`

---

## pre-commit 프레임워크 (권장)

팀 단위로 훅을 공유하려면 [pre-commit](https://pre-commit.com) 프레임워크를 사용합니다.

\`\`\`bash
pip install pre-commit
\`\`\`

\`\`\`yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-merge-conflict

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: \\.(js|ts)$
        additional_dependencies:
          - eslint@8.56.0

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.1.0
    hooks:
      - id: prettier
\`\`\`

\`\`\`bash
# 훅 설치 (팀원 모두 실행)
pre-commit install
pre-commit install --hook-type commit-msg

# 수동 실행
pre-commit run --all-files

# 특정 파일만
pre-commit run --files src/index.ts
\`\`\`

---

## 훅 우회 (긴급 시)

\`\`\`bash
git commit --no-verify -m "hotfix: 긴급 패치"
git push --no-verify
\`\`\`

> 일상적으로 사용하지 말 것. 우회 이력이 남도록 팀 내 규칙을 정하세요.`,
  },

  {
    title: 'Semantic Versioning + Conventional Commits + 자동 CHANGELOG',
    slug: 'semantic-versioning-changelog',
    summary: 'semver 규칙, Conventional Commits 형식, standard-version / release-please로 버전 태그와 CHANGELOG를 자동 생성하는 방법을 설명합니다.',
    category: 'Git / CI·CD',
    tags: ['semver', 'conventional-commits', 'changelog', '버전관리', 'git'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'macOS'],
    author: 'Nodelog',
    content: `## Semantic Versioning 규칙

\`MAJOR.MINOR.PATCH\` — 예: \`2.4.1\`

| 변경 유형 | 올리는 번호 | 예시 |
|---|---|---|
| 하위 호환 버그 수정 | PATCH | 2.4.1 → 2.4.2 |
| 하위 호환 기능 추가 | MINOR | 2.4.1 → 2.5.0 |
| 하위 호환 불가 변경 | MAJOR | 2.4.1 → 3.0.0 |

- \`1.0.0\` 이전은 초기 개발 단계 (파괴적 변경 자유)
- 프리릴리즈: \`1.0.0-alpha.1\`, \`1.0.0-beta.2\`
- 빌드 메타: \`1.0.0+20250527\`

---

## Conventional Commits 형식

\`\`\`
<type>(<scope>): <subject>

[body]

[footer]
\`\`\`

**타입 목록:**

| 타입 | 의미 | 버전 영향 |
|---|---|---|
| feat | 새 기능 | MINOR |
| fix | 버그 수정 | PATCH |
| docs | 문서만 변경 | - |
| style | 포매팅 (기능 변화 없음) | - |
| refactor | 기능 변화 없는 코드 정리 | - |
| perf | 성능 개선 | PATCH |
| test | 테스트 추가·수정 | - |
| chore | 빌드·설정 변경 | - |
| ci | CI 설정 변경 | - |
| BREAKING CHANGE | 하위 호환 불가 | MAJOR |

\`\`\`bash
# 예시
git commit -m "feat(auth): OAuth2 로그인 추가"
git commit -m "fix(api): 타임아웃 오류 수정"
git commit -m "feat!: 기존 API 제거"
# 또는 footer에
git commit -m "feat: 새 인증 방식

BREAKING CHANGE: /api/v1/login 엔드포인트 제거됨"
\`\`\`

---

## standard-version으로 자동 릴리즈

\`\`\`bash
npm install --save-dev standard-version
\`\`\`

\`\`\`json
// package.json
{
  "scripts": {
    "release": "standard-version",
    "release:minor": "standard-version --release-as minor",
    "release:major": "standard-version --release-as major",
    "release:patch": "standard-version --release-as patch"
  }
}
\`\`\`

\`\`\`bash
# 자동으로 버전 bump + CHANGELOG 생성 + git tag
npm run release

# 드라이런 (실제 변경 없이 확인)
npx standard-version --dry-run

# 태그 푸시
git push --follow-tags
\`\`\`

---

## GitHub Actions로 자동 릴리즈

\`\`\`yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0      # 전체 히스토리 필요

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Release
        run: |
          npm ci
          npx standard-version
          git push --follow-tags
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
\`\`\`

---

## CHANGELOG.md 예시 출력

\`\`\`markdown
# Changelog

## [2.5.0] - 2025-05-27
### Features
- **auth:** OAuth2 로그인 추가 (abc1234)

### Bug Fixes
- **api:** 타임아웃 오류 수정 (def5678)

## [2.4.2] - 2025-05-20
### Bug Fixes
- **db:** 연결 누수 수정 (ghi9012)
\`\`\``,
  },

  // ── 네트워킹 / 서버 ────────────────────────────────────
  {
    title: 'HAProxy 로드밸런서 설치 · 헬스체크 · 스티키세션',
    slug: 'haproxy-load-balancer-setup',
    summary: 'HAProxy 설치부터 라운드로빈·최소연결 알고리즘, 헬스체크, 스티키세션, SSL 종료까지 실무 설정 방법을 단계별로 설명합니다.',
    category: '네트워킹 / 서버',
    tags: ['haproxy', '로드밸런서', '헬스체크', '스티키세션', '고가용성'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 설치

\`\`\`bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y haproxy

# CentOS / RHEL
sudo yum install -y haproxy

# 버전 확인
haproxy -v

# 서비스 시작
sudo systemctl enable --now haproxy
\`\`\`

---

## 기본 설정 구조

\`\`\`
/etc/haproxy/haproxy.cfg
\`\`\`

\`\`\`haproxy
global
    log /dev/log local0
    maxconn 50000
    user haproxy
    group haproxy
    daemon

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    timeout connect 5s
    timeout client  30s
    timeout server  30s
    option  forwardfor        # X-Forwarded-For 헤더 추가
    option  http-server-close

# 프론트엔드 (클라이언트 연결 수신)
frontend web_front
    bind *:80
    bind *:443 ssl crt /etc/ssl/mysite.pem
    redirect scheme https if !{ ssl_fc }   # HTTP → HTTPS 리다이렉트
    default_backend web_back

# 백엔드 (서버 풀)
backend web_back
    balance roundrobin            # 알고리즘: roundrobin, leastconn, source
    option  httpchk GET /health   # 헬스체크 경로

    server web1 192.168.1.10:3000 check weight 1
    server web2 192.168.1.11:3000 check weight 1
    server web3 192.168.1.12:3000 check weight 2  # 가중치 2배
\`\`\`

---

## 헬스체크 설정

\`\`\`haproxy
backend api_back
    option httpchk GET /api/health HTTP/1.1\\r\\nHost:\\ api.example.com
    http-check expect status 200

    server api1 10.0.0.1:8080 check inter 2s rise 2 fall 3
    server api2 10.0.0.2:8080 check inter 2s rise 2 fall 3
    # inter: 체크 간격, rise: 복구 판정 횟수, fall: 장애 판정 횟수

    # 백업 서버 (모든 서버 장애 시 사용)
    server backup 10.0.0.99:8080 check backup
\`\`\`

---

## 스티키세션 (세션 유지)

\`\`\`haproxy
backend app_back
    balance leastconn
    cookie SERVERID insert indirect nocache   # 쿠키 기반 스티키세션

    server app1 10.0.0.1:3000 check cookie app1
    server app2 10.0.0.2:3000 check cookie app2
\`\`\`

---

## Stats 대시보드

\`\`\`haproxy
frontend stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats auth admin:StrongPass123   # 기본 인증
    stats show-legends
\`\`\`

브라우저에서 \`http://서버IP:8404/stats\` 접속

---

## 설정 검증 및 재로드

\`\`\`bash
# 설정 문법 검사
sudo haproxy -c -f /etc/haproxy/haproxy.cfg

# 무중단 재로드 (기존 연결 유지)
sudo systemctl reload haproxy

# 상태 확인
sudo systemctl status haproxy
\`\`\``,
  },

  {
    title: 'iptables 실전 — 룰 추가·NAT·포트포워딩',
    slug: 'linux-iptables-guide',
    summary: 'iptables 체인 구조부터 입출력 필터링, NAT 마스커레이딩, 포트포워딩, 룰 영구 저장까지 실무 방화벽 설정을 정리합니다.',
    category: '네트워킹 / 서버',
    tags: ['iptables', '방화벽', 'NAT', '포트포워딩', 'linux'],
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 체인 구조

\`\`\`
패킷 수신
    ↓
PREROUTING (NAT)
    ↓
라우팅 판단
    ├── 로컬 프로세스 → INPUT → 프로세스 → OUTPUT → 송신
    └── 포워딩 → FORWARD → POSTROUTING → 송신
\`\`\`

테이블 종류: **filter** (기본), **nat**, **mangle**, **raw**

---

## 기본 명령

\`\`\`bash
# 현재 룰 조회
sudo iptables -L -n -v --line-numbers

# NAT 테이블 조회
sudo iptables -t nat -L -n -v

# 특정 체인만
sudo iptables -L INPUT -n -v
\`\`\`

---

## 기본 정책 설정

\`\`\`bash
# 기본 DROP (화이트리스트 방식)
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# 로컬루프백 허용
sudo iptables -A INPUT -i lo -j ACCEPT

# 기존 연결 유지
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# SSH 허용 (잠기지 않도록 가장 먼저!)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# HTTP / HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# ICMP (ping)
sudo iptables -A INPUT -p icmp -j ACCEPT
\`\`\`

---

## 특정 IP 차단·허용

\`\`\`bash
# IP 차단
sudo iptables -A INPUT -s 203.0.113.0/24 -j DROP

# IP 허용 (특정 포트)
sudo iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 5432 -j ACCEPT

# 차단 룰 삭제 (줄 번호 사용)
sudo iptables -L INPUT --line-numbers
sudo iptables -D INPUT 3    # 3번째 룰 삭제

# 특정 룰 삭제
sudo iptables -D INPUT -s 203.0.113.0/24 -j DROP
\`\`\`

---

## NAT 마스커레이딩 (인터넷 공유)

\`\`\`bash
# IP 포워딩 활성화
echo 1 > /proc/sys/net/ipv4/ip_forward
# 영구 적용: /etc/sysctl.conf에 net.ipv4.ip_forward = 1

# NAT 설정 (인터넷 공유, eth0이 외부 인터페이스)
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables -A FORWARD -i eth1 -o eth0 -j ACCEPT
sudo iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
\`\`\`

---

## 포트포워딩

\`\`\`bash
# 80 → 내부 서버 8080
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.10:8080
sudo iptables -A FORWARD -p tcp -d 192.168.1.10 --dport 8080 -j ACCEPT

# 로컬 포트 리다이렉션 (3000 → 80, 루트 없이)
sudo iptables -t nat -A OUTPUT -p tcp --dport 80 -j REDIRECT --to-port 3000
\`\`\`

---

## 룰 영구 저장

\`\`\`bash
# Ubuntu / Debian
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
sudo netfilter-persistent reload

# CentOS / RHEL
sudo service iptables save
# 저장 위치: /etc/sysconfig/iptables

# 수동 저장·복원
sudo iptables-save > /etc/iptables/rules.v4
sudo iptables-restore < /etc/iptables/rules.v4
\`\`\`

---

## 전체 룰 초기화

\`\`\`bash
sudo iptables -F        # 모든 룰 삭제
sudo iptables -X        # 사용자 정의 체인 삭제
sudo iptables -t nat -F
sudo iptables -P INPUT ACCEPT   # 정책을 ACCEPT로 복원
\`\`\``,
  },

  {
    title: 'Apache 가상호스트 설정 — Virtual Host·모듈 관리',
    slug: 'apache-virtual-host-setup',
    summary: 'Apache에서 도메인별 가상호스트를 구성하고, 모듈 활성화, 리다이렉트, SSL 연동, 로그 분리까지 실무 설정 방법을 설명합니다.',
    category: '네트워킹 / 서버',
    tags: ['apache', 'virtualhost', 'httpd', '웹서버', 'ssl'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 설치

\`\`\`bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y apache2

# CentOS / RHEL
sudo yum install -y httpd

# 서비스 시작
sudo systemctl enable --now apache2   # Ubuntu
sudo systemctl enable --now httpd     # CentOS
\`\`\`

---

## 디렉터리 구조 (Ubuntu)

\`\`\`
/etc/apache2/
├── apache2.conf        # 메인 설정
├── sites-available/    # 가상호스트 설정 파일
├── sites-enabled/      # 활성화된 사이트 (심볼릭 링크)
├── mods-available/     # 사용 가능한 모듈
└── mods-enabled/       # 활성화된 모듈
\`\`\`

---

## 기본 가상호스트 설정

\`\`\`apache
# /etc/apache2/sites-available/example.com.conf
<VirtualHost *:80>
    ServerName  example.com
    ServerAlias www.example.com
    DocumentRoot /var/www/example.com

    <Directory /var/www/example.com>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog  \${APACHE_LOG_DIR}/example.com-error.log
    CustomLog \${APACHE_LOG_DIR}/example.com-access.log combined
</VirtualHost>
\`\`\`

\`\`\`bash
# 사이트 활성화
sudo a2ensite example.com.conf
sudo systemctl reload apache2

# 사이트 비활성화
sudo a2dissite 000-default.conf
\`\`\`

---

## HTTP → HTTPS 리다이렉트

\`\`\`apache
<VirtualHost *:80>
    ServerName example.com
    Redirect permanent / https://example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName example.com
    DocumentRoot /var/www/example.com

    SSLEngine on
    SSLCertificateFile    /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem

    Header always set Strict-Transport-Security "max-age=31536000"
</VirtualHost>
\`\`\`

---

## 모듈 관리

\`\`\`bash
# 모듈 활성화
sudo a2enmod rewrite    # URL 재작성
sudo a2enmod ssl        # HTTPS
sudo a2enmod headers    # 헤더 조작
sudo a2enmod proxy proxy_http  # 리버스 프록시

# 모듈 비활성화
sudo a2dismod autoindex

# 활성화된 모듈 확인
apache2ctl -M
\`\`\`

---

## .htaccess와 mod_rewrite

\`\`\`apache
# /var/www/example.com/.htaccess
Options -Indexes
RewriteEngine On

# www → non-www
RewriteCond %{HTTP_HOST} ^www\\.(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]

# SPA 라우팅 (React, Vue 등)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
\`\`\`

---

## 리버스 프록시 (Node.js 앱 연동)

\`\`\`apache
<VirtualHost *:443>
    ServerName api.example.com

    ProxyPreserveHost On
    ProxyPass        / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
\`\`\`

---

## 설정 검증 및 재로드

\`\`\`bash
# 문법 검사
sudo apache2ctl configtest
# 또는
sudo apachectl configtest

# 무중단 재로드
sudo systemctl reload apache2
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
