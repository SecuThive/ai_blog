import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── 1. Caddy ──────────────────────────────────────────
  {
    title: 'Caddy 웹서버 — 자동 HTTPS 리버스 프록시 완전 가이드',
    slug: 'caddy-web-server-auto-https',
    summary: 'Caddy의 자동 HTTPS(ACME)와 Caddyfile 문법, 리버스 프록시, 헤더·압축·로깅, API를 통한 무중단 설정까지 실무 운영 패턴을 정리합니다.',
    category: '네트워킹 / 서버',
    tags: ['caddy', 'https', 'reverse-proxy', 'tls', 'web-server'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Caddy 란?

Caddy는 Go로 작성된 웹서버이자 리버스 프록시로, 가장 큰 특징은 **자동 HTTPS**입니다. 도메인을 명시하면 Caddy가 ACME 프로토콜(Let's Encrypt / ZeroSSL)로 인증서를 자동 발급·갱신하고, HTTP를 HTTPS로 리다이렉트하며, OCSP Stapling까지 알아서 처리합니다. Nginx나 Apache처럼 인증서 발급 도구(certbot)를 따로 운영하거나 cron 갱신을 신경 쓸 필요가 없습니다.

설정 파일인 \`Caddyfile\`은 선언적이고 간결합니다. 수십 줄짜리 Nginx server 블록이 Caddy에서는 몇 줄로 끝나는 경우가 많습니다. 이 가이드에서는 Caddy 2.x 기준으로 설치, Caddyfile 문법, 리버스 프록시, TLS 옵션, 그리고 무중단 재로딩을 위한 Admin API까지 다룹니다.

> Caddy는 인증서 발급을 위해 도메인이 실제로 해당 서버를 가리키고(A/AAAA 레코드), 80/443 포트가 외부에서 접근 가능해야 합니다. ACME HTTP-01 챌린지는 80 포트로 들어옵니다.

## 설치

\`\`\`bash
# Debian/Ubuntu 공식 저장소
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \\
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \\
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# 버전 확인
caddy version
\`\`\`

apt로 설치하면 systemd 서비스(\`caddy.service\`)와 전용 사용자 \`caddy\`가 함께 생성되며, 설정 파일 경로는 \`/etc/caddy/Caddyfile\`입니다.

\`\`\`bash
sudo systemctl enable --now caddy
systemctl status caddy
\`\`\`

## Caddyfile 기본 문법

가장 단순한 정적 사이트:

\`\`\`caddy
example.com {
    root * /var/www/example.com
    file_server
    encode gzip zstd
}
\`\`\`

이 세 줄로 example.com에 대해 인증서가 자동 발급되고, HTTP→HTTPS 리다이렉트가 걸리며, 정적 파일이 서빙됩니다. 블록 첫 줄의 **사이트 주소**가 곧 인증서 발급 대상입니다.

여러 도메인을 한 블록에 묶을 수 있습니다.

\`\`\`caddy
example.com, www.example.com {
    redir https://example.com{uri} permanent
}
\`\`\`

\`{uri}\`, \`{host}\`, \`{remote_host}\` 같은 플레이스홀더를 쓸 수 있습니다(템플릿 변수). 와일드카드 인증서를 쓰려면 DNS-01 챌린지가 필요하며, 이는 DNS 제공자 플러그인을 빌드해 넣어야 합니다.

## 리버스 프록시

Caddy의 핵심 용도 중 하나입니다. 백엔드 애플리케이션 앞단에 두면 됩니다.

\`\`\`caddy
app.example.com {
    reverse_proxy localhost:3000
}
\`\`\`

이것만으로 TLS 종료(termination) + 프록시가 완성됩니다. 업스트림이 여러 개면 자동 로드밸런싱이 적용됩니다.

\`\`\`caddy
api.example.com {
    reverse_proxy {
        to localhost:8001 localhost:8002 localhost:8003
        lb_policy round_robin           # least_conn, ip_hash 등
        health_uri /healthz
        health_interval 10s
        health_timeout 3s
    }
}
\`\`\`

경로별로 다른 백엔드로 분기하려면 **matcher**를 씁니다.

\`\`\`caddy
example.com {
    # /api/* 는 백엔드로
    reverse_proxy /api/* localhost:8080

    # 나머지는 정적 파일
    handle {
        root * /var/www/spa
        try_files {path} /index.html      # SPA fallback
        file_server
    }
}
\`\`\`

### 업스트림으로 헤더 전달

Caddy는 기본적으로 \`X-Forwarded-For\`, \`X-Forwarded-Proto\`, \`X-Forwarded-Host\`를 자동으로 붙입니다. 추가 헤더는 다음과 같이 조작합니다.

\`\`\`caddy
reverse_proxy localhost:3000 {
    header_up Host {upstream_hostport}
    header_up X-Real-IP {remote_host}
    header_down -Server                  # 응답에서 Server 헤더 제거
}
\`\`\`

## TLS 세부 옵션

자동 HTTPS를 그대로 두는 것이 권장이지만, 운영 요구에 따라 조정할 수 있습니다.

\`\`\`caddy
example.com {
    tls admin@example.com {              # ACME 계정 이메일
        protocols tls1.2 tls1.3
    }
    reverse_proxy localhost:3000
}
\`\`\`

내부망/테스트에서 사설 인증서를 쓰거나 인증서 발급을 끄려면:

\`\`\`caddy
# 직접 발급한 인증서 사용
tls /etc/ssl/site.crt /etc/ssl/site.key

# 내부 CA로 자체 서명 (개발용)
tls internal
\`\`\`

> 발급 한도 테스트 중에는 Let's Encrypt 운영 환경 대신 스테이징을 쓰세요. 전역 옵션 블록에서 \`acme_ca https://acme-staging-v02.api.letsencrypt.org/directory\`를 지정하면 rate limit 소진을 피할 수 있습니다.

## 전역 옵션과 로깅

파일 맨 위 중괄호 블록이 **전역 옵션**입니다.

\`\`\`caddy
{
    email admin@example.com
    admin localhost:2019                 # Admin API 엔드포인트
    log {
        output file /var/log/caddy/access.log
        format json
    }
}

example.com {
    reverse_proxy localhost:3000
    log {
        output file /var/log/caddy/example.access.log {
            roll_size 50mb
            roll_keep 10
        }
        format console
    }
}
\`\`\`

JSON 로그는 \`jq\`로 바로 파싱할 수 있어 관측성 파이프라인에 유리합니다.

## 설정 검증과 무중단 재로딩

\`\`\`bash
# 문법 검증 및 포맷팅
caddy validate --config /etc/caddy/Caddyfile
caddy fmt --overwrite /etc/caddy/Caddyfile

# 무중단 리로드 (graceful, 연결 끊김 없음)
sudo systemctl reload caddy
# 또는
caddy reload --config /etc/caddy/Caddyfile
\`\`\`

\`reload\`는 프로세스를 죽이지 않고 새 설정을 적용하므로 진행 중인 요청이 끊기지 않습니다. 이 점이 운영 환경에서 큰 장점입니다.

## Admin API

Caddy는 기본적으로 \`localhost:2019\`에서 REST API를 노출합니다. 설정을 JSON으로 조회·교체할 수 있습니다.

\`\`\`bash
# 현재 동작 중인 전체 설정 확인
curl -s localhost:2019/config/ | jq .

# 업스트림 헬스 상태 확인
curl -s localhost:2019/reverse_proxy/upstreams | jq .

# 설정 일부를 동적으로 교체 (PATCH)
curl -X POST localhost:2019/load \\
  -H "Content-Type: application/json" \\
  -d @new-config.json
\`\`\`

> Admin API는 기본적으로 로컬에만 바인딩되지만 인증이 없습니다. 절대 외부에 노출하지 마세요. 컨테이너 환경에서 0.0.0.0에 바인딩하지 않도록 주의합니다.

## 트러블슈팅

| 증상 | 원인 / 확인 |
| --- | --- |
| 인증서 발급 실패 | 80 포트 방화벽 차단, A 레코드 미설정, rate limit |
| \`journalctl -u caddy\` 에 ACME 에러 | DNS 전파 미완료 — \`dig example.com\` 으로 확인 |
| 502 Bad Gateway | 업스트림 미기동, \`reverse_proxy\` 포트 오타 |
| 설정 반영 안 됨 | \`caddy validate\` 통과 후 \`reload\` 했는지 확인 |
| TLS handshake 에러 | \`protocols\` 설정과 클라이언트 호환성 확인 |

로그는 항상 systemd 저널에서 확인합니다.

\`\`\`bash
journalctl -u caddy -f --no-pager
\`\`\`

## 정리

| 항목 | 핵심 |
| --- | --- |
| 자동 HTTPS | 도메인만 명시하면 ACME로 인증서 자동 발급·갱신 |
| Caddyfile | 선언적·간결, 사이트 주소가 인증서 대상 |
| 리버스 프록시 | \`reverse_proxy\` 한 줄, 다중 업스트림 시 LB·헬스체크 |
| matcher | 경로·헤더별 분기, SPA는 \`try_files\` |
| 무중단 리로드 | \`systemctl reload caddy\` / \`caddy reload\` |
| Admin API | localhost:2019, 외부 노출 금지 |

Caddy는 "설정이 적을수록 좋다"는 철학의 웹서버입니다. 자동 HTTPS와 간결한 프록시 문법 덕분에 소규모~중규모 서비스의 엣지 게이트웨이로 빠르게 올릴 수 있습니다.`,
  },

  // ── 2. BIND9 ──────────────────────────────────────────
  {
    title: 'BIND9 DNS 서버 구축 — 권한 있는 네임서버 운영 완전 가이드',
    slug: 'bind9-authoritative-dns-server',
    summary: 'BIND9로 권한 있는(authoritative) 네임서버를 구축합니다. named.conf 구조, 정·역방향 존 파일, SOA·NS·MX 레코드, 마스터/슬레이브 존 전송, DNSSEC 기초까지 다룹니다.',
    category: '네트워킹 / 서버',
    tags: ['bind9', 'dns', 'named', 'zone', 'authoritative'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## 권한 있는(authoritative) DNS 서버 란?

DNS 서버는 크게 두 종류로 나뉩니다. **리커시브 리졸버**(recursive resolver)는 클라이언트 대신 다른 서버에 질의해 답을 찾아주는 서버이고(예: 8.8.8.8), **권한 있는 네임서버**(authoritative)는 특정 도메인(존, zone)의 실제 데이터를 보유하고 그 도메인에 대한 질의에 "공식 답변"을 내려주는 서버입니다.

직접 도메인을 보유하고 \`ns1.example.com\`처럼 자신의 네임서버로 운영하려면 권한 있는 서버가 필요합니다. BIND9(Berkeley Internet Name Domain)는 가장 널리 쓰이는 구현체입니다. 이 가이드는 BIND9로 권한 있는 마스터/슬레이브 네임서버를 구성하는 데 집중합니다. (클라이언트 측 조회 도구인 \`dig\`/\`nslookup\` 사용법은 별도 가이드 영역입니다.)

> 권한 있는 서버와 오픈 리졸버를 한 서버에서 동시에 운영하지 마세요. 오픈 리졸버는 DNS 증폭 공격에 악용됩니다. 권한 있는 서버에서는 반드시 \`recursion no;\` 로 재귀를 끕니다.

## 설치

\`\`\`bash
# Debian/Ubuntu
sudo apt install -y bind9 bind9utils bind9-dnsutils

# RHEL/Rocky
sudo dnf install -y bind bind-utils

named -v          # 버전 확인
\`\`\`

데몬 이름은 \`named\`이고 서비스명은 배포판에 따라 \`named\` 또는 \`bind9\`입니다.

## named.conf 구조

설정은 보통 다음 파일들로 분리됩니다.

| 파일 | 역할 |
| --- | --- |
| \`/etc/bind/named.conf\` | 최상위, 아래 파일들을 include |
| \`named.conf.options\` | 전역 옵션(listen, recursion 등) |
| \`named.conf.local\` | 로컬 존 정의 |
| \`/var/lib/bind/\` 또는 \`/etc/bind/zones/\` | 존 파일 위치 |

전역 옵션 예시:

\`\`\`bind
// /etc/bind/named.conf.options
options {
    directory "/var/cache/bind";

    listen-on { any; };
    listen-on-v6 { any; };

    // 권한 있는 서버이므로 재귀 비활성화
    recursion no;
    allow-query { any; };

    // 존 전송은 슬레이브에게만 허용
    allow-transfer { none; };

    dnssec-validation auto;
    version "not disclosed";       // 버전 노출 방지
};
\`\`\`

## 정방향 존 파일

존을 \`named.conf.local\`에 등록합니다.

\`\`\`bind
// /etc/bind/named.conf.local
zone "example.com" {
    type master;
    file "/etc/bind/zones/db.example.com";
    allow-transfer { 192.0.2.53; };   // 슬레이브 IP
    also-notify { 192.0.2.53; };
};
\`\`\`

존 파일 본문:

\`\`\`dns
; /etc/bind/zones/db.example.com
$TTL    86400
@       IN      SOA     ns1.example.com. admin.example.com. (
                        2026061801      ; Serial (YYYYMMDDnn)
                        3600            ; Refresh
                        1800            ; Retry
                        1209600         ; Expire
                        86400 )         ; Negative Cache TTL

; 네임서버
@       IN      NS      ns1.example.com.
@       IN      NS      ns2.example.com.

; A 레코드
@       IN      A       192.0.2.10
ns1     IN      A       192.0.2.53
ns2     IN      A       192.0.2.54
www     IN      A       192.0.2.10

; 메일
@       IN      MX  10  mail.example.com.
mail    IN      A       192.0.2.20

; 기타
@       IN      TXT     "v=spf1 mx -all"
ftp     IN      CNAME   www
\`\`\`

### SOA 레코드의 의미

SOA(Start of Authority)는 존의 메타데이터입니다. 필드 의미는 다음과 같습니다.

| 필드 | 의미 |
| --- | --- |
| Serial | 존 버전. **변경할 때마다 증가시켜야** 슬레이브가 갱신함 |
| Refresh | 슬레이브가 마스터를 확인하는 주기 |
| Retry | Refresh 실패 시 재시도 간격 |
| Expire | 마스터 연결 실패 시 슬레이브가 데이터를 폐기하는 시점 |
| Negative TTL | 존재하지 않는 레코드(NXDOMAIN)의 캐시 시간 |

> 존 파일을 수정한 뒤 **Serial을 올리지 않으면** 슬레이브와 캐시가 변경 사항을 절대 가져가지 않습니다. 가장 흔한 실수입니다. 날짜 기반(YYYYMMDDnn) 규칙을 쓰면 관리가 쉽습니다.

## 역방향 존 (PTR)

IP→이름 조회(역방향)는 \`in-addr.arpa\` 존으로 구성합니다. 192.0.2.0/24 대역이라면:

\`\`\`bind
// named.conf.local
zone "2.0.192.in-addr.arpa" {
    type master;
    file "/etc/bind/zones/db.192.0.2";
};
\`\`\`

\`\`\`dns
; /etc/bind/zones/db.192.0.2
$TTL    86400
@       IN      SOA     ns1.example.com. admin.example.com. (
                        2026061801 3600 1800 1209600 86400 )
@       IN      NS      ns1.example.com.

10      IN      PTR     example.com.
20      IN      PTR     mail.example.com.
\`\`\`

PTR의 왼쪽 숫자는 IP의 마지막 옥텟입니다. 메일 서버 운영 시 역방향 레코드가 없으면 수신 거부되는 경우가 많습니다.

## 설정 검증과 적용

\`\`\`bash
# 전역 설정 문법 검사
sudo named-checkconf

# 존 파일 검사 (존 이름, 파일경로)
sudo named-checkzone example.com /etc/bind/zones/db.example.com
sudo named-checkzone 2.0.192.in-addr.arpa /etc/bind/zones/db.192.0.2

# 무중단 리로드
sudo rndc reload
# 특정 존만
sudo rndc reload example.com
\`\`\`

\`named-checkzone\`은 Serial과 레코드 문법을 검증해주므로 반영 전 반드시 실행합니다.

## 마스터/슬레이브 존 전송

슬레이브 서버 \`named.conf.local\`:

\`\`\`bind
zone "example.com" {
    type slave;
    masters { 192.0.2.53; };          // 마스터 IP
    file "/var/cache/bind/db.example.com";
};
\`\`\`

마스터에서 \`also-notify\`로 NOTIFY를 보내면 슬레이브가 즉시 AXFR/IXFR로 존을 가져옵니다. 보안을 위해 TSIG 키로 전송을 인증하는 것이 권장됩니다.

\`\`\`bash
# TSIG 키 생성
tsig-keygen -a hmac-sha256 transfer-key
\`\`\`

생성된 키를 양쪽 \`named.conf\`에 넣고 \`allow-transfer { key transfer-key; };\` 로 제한합니다.

## 동작 확인

\`\`\`bash
# 자기 서버에 직접 질의 (권한 응답인지 aa 플래그 확인)
dig @192.0.2.53 example.com SOA +norecurse
dig @192.0.2.53 www.example.com A
dig @192.0.2.53 -x 192.0.2.10           # 역방향 PTR

# 존 전송 테스트 (allow-transfer 허용된 곳에서)
dig @192.0.2.53 example.com AXFR
\`\`\`

응답 헤더에 \`flags: ... aa\`(authoritative answer)가 보이면 권한 있는 응답이 정상 동작하는 것입니다.

## DNSSEC 기초

DNSSEC은 응답에 디지털 서명을 붙여 위변조를 방지합니다. BIND9는 인라인 서명을 지원합니다.

\`\`\`bind
zone "example.com" {
    type master;
    file "/etc/bind/zones/db.example.com";
    dnssec-policy default;            // 자동 키 관리·서명
    inline-signing yes;
};
\`\`\`

서명 후 생성되는 DS 레코드를 상위 도메인 등록기관(레지스트라)에 등록해야 검증 체인이 완성됩니다.

## 트러블슈팅

| 증상 | 원인 |
| --- | --- |
| \`SERVFAIL\` | 존 파일 문법 오류 — \`named-checkzone\` 확인 |
| 슬레이브 미갱신 | Serial 미증가, \`allow-transfer\` 누락 |
| 권한 응답 안 옴(aa 없음) | 존 미로드, \`rndc reload\` 누락 |
| named 기동 실패 | \`journalctl -u named\`, \`named-checkconf\` 확인 |

## 정리

| 항목 | 핵심 |
| --- | --- |
| 권한 vs 재귀 | authoritative는 \`recursion no;\` 필수 |
| 존 파일 | SOA + NS + A/MX/CNAME/PTR |
| Serial | 수정 시마다 증가, 안 올리면 전파 안 됨 |
| 검증 | \`named-checkconf\`, \`named-checkzone\` 후 \`rndc reload\` |
| 마스터/슬레이브 | type slave + masters, TSIG로 전송 인증 |
| DNSSEC | \`dnssec-policy\` + 상위에 DS 등록 |

BIND9 권한 서버 운영의 핵심은 "Serial 관리와 존 검증"입니다. 변경-검증-리로드 사이클을 습관화하면 대부분의 장애를 예방할 수 있습니다.`,
  },

  // ── 3. Vault ──────────────────────────────────────────
  {
    title: 'HashiCorp Vault 기초 — 시크릿 관리와 동적 자격증명',
    slug: 'hashicorp-vault-secrets-management',
    summary: 'HashiCorp Vault의 핵심 개념(seal/unseal, 토큰, 정책, 시크릿 엔진)을 정리하고 KV v2 정적 시크릿과 데이터베이스 동적 자격증명, AppRole 인증까지 실습합니다.',
    category: '보안 설정',
    tags: ['vault', 'secrets', 'hashicorp', 'security', 'kv'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## HashiCorp Vault 란?

Vault는 API 키, DB 비밀번호, 인증서 같은 **시크릿(secret)을 중앙에서 안전하게 보관·발급·감사**하는 도구입니다. 코드에 비밀번호를 하드코딩하거나 환경변수 파일을 여기저기 뿌리는 방식의 근본적 위험을 해결합니다.

Vault의 강력한 차별점은 **동적 시크릿(dynamic secrets)**입니다. 정적 비밀번호를 저장만 하는 게 아니라, 애플리케이션이 요청할 때마다 짧은 수명의 DB 계정을 즉석에서 생성하고 TTL이 지나면 자동 폐기합니다. 비밀번호가 유출되어도 수명이 짧아 피해가 제한되고, 자격증명이 누구에게 언제 발급됐는지 모두 감사 로그에 남습니다.

이 가이드는 단일 노드 개발/스테이징 환경 기준으로 Vault의 핵심 개념과 주요 워크플로(KV 시크릿, DB 동적 자격증명, AppRole)를 다룹니다.

> 이 문서의 \`vault server -dev\`는 학습용입니다. 메모리에만 데이터를 두고 자동 unseal되며 TLS도 없습니다. 운영에는 절대 사용하지 마세요. 운영은 영속 스토리지(Integrated Storage/Raft) + TLS + 분산 unseal 키 구성이 필요합니다.

## 핵심 개념

| 개념 | 설명 |
| --- | --- |
| Seal / Unseal | Vault는 시작 시 암호화된 \`봉인\` 상태. 마스터 키 조각으로 unseal해야 데이터 접근 가능 |
| Unseal Key (Shamir) | 마스터 키를 N개 조각으로 분할, K개 모여야 복호화(예: 5개 중 3개) |
| Root Token | 모든 권한을 가진 초기 토큰. 작업 후 폐기 권장 |
| Token | 모든 요청은 토큰으로 인증. TTL과 정책이 부여됨 |
| Policy | HCL로 작성하는 경로별 권한(capabilities) |
| Secrets Engine | 시크릿을 다루는 플러그인(kv, database, pki 등) |
| Auth Method | 사용자/앱 인증 방식(token, approle, userpass, kubernetes) |

## 서버 기동과 unseal

학습용 dev 서버:

\`\`\`bash
vault server -dev -dev-root-token-id="root"
# 출력된 VAULT_ADDR, Root Token을 메모
\`\`\`

운영형 기동(Raft 스토리지)은 config 파일을 사용합니다.

\`\`\`hcl
# /etc/vault.d/vault.hcl
storage "raft" {
  path    = "/opt/vault/data"
  node_id = "node1"
}
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/etc/vault.d/tls/vault.crt"
  tls_key_file  = "/etc/vault.d/tls/vault.key"
}
api_addr = "https://vault.example.com:8200"
ui = true
\`\`\`

\`\`\`bash
export VAULT_ADDR='https://vault.example.com:8200'
vault operator init          # unseal 키 5개 + root 토큰 발급 (안전 보관!)
vault operator unseal        # 키 3개를 각각 입력
vault status                 # Sealed: false 확인
\`\`\`

> \`vault operator init\` 출력(unseal 키, root 토큰)은 단 한 번만 표시됩니다. 분실하면 데이터를 영구히 잃습니다. 키 조각은 서로 다른 담당자/금고에 분산 보관하세요.

## CLI 로그인

\`\`\`bash
export VAULT_ADDR='http://127.0.0.1:8200'
vault login                  # 토큰 입력 (dev면 root)
vault token lookup           # 현재 토큰 정보·TTL·정책 확인
\`\`\`

## KV v2 — 정적 시크릿

가장 기본적인 시크릿 저장소입니다. v2는 버전 관리와 소프트 삭제를 지원합니다.

\`\`\`bash
# KV v2 엔진 활성화
vault secrets enable -path=secret kv-v2

# 시크릿 저장
vault kv put secret/myapp/db username="appuser" password="s3cr3t"

# 조회
vault kv get secret/myapp/db
vault kv get -field=password secret/myapp/db    # 값만 추출

# 버전 관리
vault kv get -version=1 secret/myapp/db
vault kv metadata get secret/myapp/db           # 버전 이력

# 소프트 삭제 / 복구 / 완전 삭제
vault kv delete secret/myapp/db
vault kv undelete -versions=2 secret/myapp/db
vault kv destroy -versions=1 secret/myapp/db
\`\`\`

KV v2는 API 경로에 \`/data/\`가 끼어든다는 점에 유의해야 합니다(정책 작성 시 중요).

## 정책(Policy)

권한은 경로별 capabilities로 정의합니다.

\`\`\`hcl
# myapp-policy.hcl
# KV v2이므로 실제 경로는 secret/data/...
path "secret/data/myapp/*" {
  capabilities = ["read", "list"]
}
path "secret/metadata/myapp/*" {
  capabilities = ["list", "read"]
}
\`\`\`

\`\`\`bash
vault policy write myapp myapp-policy.hcl
vault policy read myapp
\`\`\`

capabilities는 \`create, read, update, delete, list, sudo, deny\`가 있으며 최소 권한 원칙으로 부여합니다.

## 동적 자격증명 — Database 시크릿 엔진

Vault가 PostgreSQL에 접속해 요청 시마다 임시 계정을 만들어주는 구성입니다.

\`\`\`bash
# 엔진 활성화
vault secrets enable database

# DB 연결 설정 (Vault가 사용할 관리자 계정)
vault write database/config/postgres \\
    plugin_name=postgresql-database-plugin \\
    allowed_roles="readonly" \\
    connection_url="postgresql://{{username}}:{{password}}@db.example.com:5432/app?sslmode=require" \\
    username="vault_admin" \\
    password="adminpass"

# 역할 정의: 발급 시 실행할 SQL과 TTL
vault write database/roles/readonly \\
    db_name=postgres \\
    creation_statements="CREATE ROLE \\"{{name}}\\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT ON ALL TABLES IN SCHEMA public TO \\"{{name}}\\";" \\
    default_ttl="1h" \\
    max_ttl="24h"
\`\`\`

이제 자격증명을 요청하면:

\`\`\`bash
vault read database/creds/readonly
# Key                Value
# lease_id           database/creds/readonly/abc123
# lease_duration     1h
# username           v-token-readonly-x9f2...
# password           A1b2-randomgenerated
\`\`\`

발급된 계정은 1시간 뒤 자동 폐기됩니다. 즉시 회수하려면:

\`\`\`bash
vault lease revoke database/creds/readonly/abc123
\`\`\`

> 동적 자격증명을 쓰려면 Vault 관리자 계정이 DB에서 \`CREATEROLE\` 권한을 가져야 합니다. 이 관리자 계정 자체도 \`vault write database/rotate-root/postgres\`로 주기 교체하세요.

## AppRole — 애플리케이션 인증

사람이 아닌 애플리케이션/CI가 Vault에 인증하는 표준 방식입니다.

\`\`\`bash
vault auth enable approle

vault write auth/approle/role/myapp \\
    token_policies="myapp" \\
    token_ttl=1h token_max_ttl=4h \\
    secret_id_ttl=24h

# RoleID(공개) + SecretID(비밀) 발급
vault read auth/approle/role/myapp/role-id
vault write -f auth/approle/role/myapp/secret-id

# 두 값으로 로그인 → 단기 토큰 획득
vault write auth/approle/login \\
    role_id="<role_id>" secret_id="<secret_id>"
\`\`\`

RoleID는 빌드에 박아두고 SecretID는 런타임에 안전하게 주입하는 패턴(예: CI 시크릿)을 씁니다.

## 감사 로그

\`\`\`bash
vault audit enable file file_path=/var/log/vault/audit.log
\`\`\`

모든 요청·응답이 해시된 형태로 기록됩니다. 컴플라이언스 대응의 핵심입니다.

## 정리

| 항목 | 핵심 |
| --- | --- |
| Seal/Unseal | 시작 시 봉인, Shamir 키 K-of-N으로 해제 |
| KV v2 | 정적 시크릿, 버전·소프트삭제, 경로에 \`/data/\` |
| Policy | 경로별 capabilities, 최소 권한 |
| Database 엔진 | 요청 시 임시 계정 생성, TTL 후 자동 폐기 |
| AppRole | RoleID + SecretID로 앱 인증 |
| 감사 | \`vault audit enable\`로 전체 요청 기록 |

Vault의 진가는 정적 시크릿 보관을 넘어 **동적·단기 자격증명**에 있습니다. "비밀번호를 저장하지 말고 필요할 때 짧게 발급하라"가 핵심 사고방식입니다.`,
  },

  // ── 4. Wireshark ──────────────────────────────────────
  {
    title: 'Wireshark 패킷 분석 실전 — 디스플레이 필터와 트래픽 디버깅',
    slug: 'wireshark-packet-analysis-guide',
    summary: 'Wireshark GUI를 중심으로 캡처/디스플레이 필터 차이, 핵심 디스플레이 필터, Follow TCP Stream, Expert Information, IO 그래프, 그리고 tshark CLI 활용까지 실전 디버깅 흐름을 정리합니다.',
    category: '보안 설정',
    tags: ['wireshark', 'packet-analysis', 'tshark', 'network', 'debugging'],
    difficulty: 'intermediate',
    os_compat: ['linux', 'windows', 'macos'],
    author: 'SecuThive',
    content: `## Wireshark 란?

Wireshark는 네트워크 패킷을 캡처해 **계층별로 디코딩하고 시각적으로 분석**하는 도구입니다. \`tcpdump\`가 CLI로 패킷을 빠르게 캡처·저장하는 데 강하다면, Wireshark는 캡처한 트래픽을 **GUI에서 프로토콜 트리로 펼쳐 보고, 강력한 디스플레이 필터로 좁히고, 흐름을 재구성**하는 데 특화돼 있습니다. 실무에서는 보통 서버에서 \`tcpdump -w\`로 \`.pcap\`을 떠서 Wireshark로 열어 분석하는 조합을 많이 씁니다.

이 가이드는 tcpdump와의 중복을 피해 Wireshark 고유 기능(디스플레이 필터, Follow Stream, Expert Info, 통계)과 그 CLI 형제인 tshark에 집중합니다.

## 캡처 필터 vs 디스플레이 필터

Wireshark 입문자가 가장 많이 혼동하는 지점입니다. **두 필터는 문법도, 동작 시점도 완전히 다릅니다.**

| 구분 | 캡처 필터 (Capture Filter) | 디스플레이 필터 (Display Filter) |
| --- | --- | --- |
| 시점 | 캡처 **전** (커널에서 걸러짐) | 캡처 **후** 표시할 때 |
| 문법 | BPF (\`tcpdump\`와 동일) | Wireshark 고유 문법 |
| 예시 | \`tcp port 443\` | \`tcp.port == 443\` |
| 데이터 | 걸러진 건 저장 안 됨 | 원본 보존, 보기만 필터 |

> 캡처 필터로 너무 좁히면 나중에 필요한 패킷이 통째로 사라집니다. 디스크가 허용한다면 캡처는 넓게 뜨고, 분석은 디스플레이 필터로 좁히는 것이 안전합니다.

## 핵심 디스플레이 필터

디스플레이 필터는 \`프로토콜.필드 비교연산 값\` 형태입니다.

\`\`\`text
# 프로토콜/포트
tcp.port == 443
http.request
dns
tls.handshake.type == 1            # Client Hello

# 주소
ip.addr == 192.168.0.10
ip.src == 10.0.0.5 && ip.dst == 10.0.0.9

# 조합 (논리 연산: && || ! )
tcp.port == 443 && http.request
http.response.code >= 400          # 4xx/5xx만
\`\`\`

TCP 디버깅에 특히 유용한 필터:

\`\`\`text
tcp.flags.syn == 1 && tcp.flags.ack == 0   # SYN (연결 시작)만
tcp.flags.reset == 1                        # RST (강제 종료)
tcp.analysis.retransmission                 # 재전송 (손실/지연 징후)
tcp.analysis.duplicate_ack                  # 중복 ACK
tcp.analysis.zero_window                    # 수신 윈도우 0 (수신측 포화)
tcp.window_size < 1000                      # 작은 윈도우
\`\`\`

\`tcp.analysis.*\`는 Wireshark가 패킷 흐름을 보고 **추론해 붙여주는 가상 필드**입니다. tcpdump에는 없는 Wireshark만의 강점으로, 재전송/지연/혼잡을 한눈에 잡아냅니다.

HTTP/애플리케이션 레벨:

\`\`\`text
http.host contains "example.com"
http.request.method == "POST"
frame contains "password"                   # 페이로드 문자열 검색
\`\`\`

## Follow TCP/HTTP Stream

특정 연결의 전체 대화를 재구성해 보는 기능입니다. 패킷 하나를 우클릭 → **Follow → TCP Stream**(또는 HTTP/TLS Stream)을 선택하면, 그 세션의 요청/응답이 시간순으로 합쳐져 표시됩니다.

- 클라이언트 송신은 빨강, 서버 응답은 파랑으로 구분됩니다.
- HTTP면 헤더·바디가 그대로 보여 API 디버깅에 즉효입니다.
- Follow를 적용하면 자동으로 \`tcp.stream eq N\` 디스플레이 필터가 걸립니다.

\`\`\`text
tcp.stream eq 3                # 3번 스트림(연결)만 표시
\`\`\`

스트림 번호로 여러 연결을 빠르게 오갈 수 있습니다.

## Expert Information

\`Analyze → Expert Information\` 메뉴는 Wireshark가 자동 감지한 이상 징후를 심각도별로 모아 보여줍니다.

| 수준 | 색 | 의미 |
| --- | --- | --- |
| Error | 빨강 | 체크섬 오류, 잘못된 패킷 |
| Warning | 노랑 | 재전송, Zero Window, 연결 리셋 |
| Note | 파랑 | 중복 ACK, 윈도우 업데이트 |
| Chat | 회색 | 정상 흐름(SYN, FIN 등) |

지연·끊김 장애를 분석할 때 Expert Info의 Warning부터 보면 원인 후보를 빠르게 좁힐 수 있습니다.

## 통계 메뉴 활용

\`Statistics\` 메뉴는 전체 캡처를 요약합니다.

- **Protocol Hierarchy**: 어떤 프로토콜이 대역폭을 얼마나 쓰는지
- **Conversations**: 호스트 쌍별 트래픽량, 바이트/패킷 정렬
- **IO Graph**: 시간축 처리량 그래프. 특정 필터(예: \`tcp.analysis.retransmission\`)를 그래프로 그려 손실 시점 파악
- **Endpoints**: 호스트별 송수신 통계, 지도 표시

IO Graph에서 재전송 곡선이 특정 시각에 치솟으면 그 시점에 네트워크 문제가 있었다는 강한 단서입니다.

## tshark — Wireshark의 CLI

GUI를 못 쓰는 서버에서는 동일 엔진의 CLI인 \`tshark\`를 씁니다. 디스플레이 필터 문법을 그대로 사용합니다.

\`\`\`bash
# 인터페이스 목록
tshark -D

# 실시간 캡처 + 디스플레이 필터 (-Y)
sudo tshark -i eth0 -Y "tcp.port == 443 && tcp.flags.syn == 1"

# 캡처 필터(-f, BPF)로 줄이고 파일 저장
sudo tshark -i eth0 -f "tcp port 443" -w /tmp/https.pcap

# 저장된 pcap 분석 + 필드만 추출
tshark -r /tmp/https.pcap -Y "http.request" \\
       -T fields -e ip.src -e http.host -e http.request.uri

# 재전송 개수 집계
tshark -r /tmp/https.pcap -Y "tcp.analysis.retransmission" | wc -l
\`\`\`

여기서도 \`-f\`는 캡처(BPF) 필터, \`-Y\`는 디스플레이 필터로 GUI와 정확히 대응됩니다.

## TLS 트래픽 복호화

HTTPS는 암호화돼 페이로드가 안 보이지만, 클라이언트가 세션 키를 로그로 남기면 복호화할 수 있습니다.

\`\`\`bash
# 브라우저/curl이 키를 기록하도록 환경변수 설정
export SSLKEYLOGFILE=/tmp/sslkeys.log
\`\`\`

Wireshark의 \`Preferences → Protocols → TLS → (Pre)-Master-Secret log filename\`에 이 파일을 지정하면 복호화된 HTTP를 볼 수 있습니다. (서버 비공개 키만으로는 최신 TLS 1.3의 ECDHE를 복호화할 수 없습니다.)

## 실전 디버깅 흐름

1. 서버에서 \`tcpdump -i eth0 -w issue.pcap host <대상>\`으로 캡처
2. Wireshark로 열어 \`tcp.analysis.flags\`로 이상 패킷 스캔
3. 문제 패킷 우클릭 → Follow TCP Stream으로 대화 확인
4. Expert Information으로 재전송/리셋/Zero Window 확인
5. Statistics → IO Graph로 시점·규모 정량화

## 정리

| 항목 | 핵심 |
| --- | --- |
| 캡처 vs 디스플레이 | BPF(\`tcp port 443\`) vs Wireshark(\`tcp.port == 443\`) |
| 분석용 필터 | \`tcp.analysis.retransmission\`, \`zero_window\`, \`duplicate_ack\` |
| Follow Stream | 세션 전체 대화 재구성, \`tcp.stream eq N\` |
| Expert Info | 이상 징후 심각도별 요약 |
| Statistics | Protocol Hierarchy, Conversations, IO Graph |
| tshark | CLI 분석, \`-f\` 캡처 / \`-Y\` 디스플레이 |

Wireshark는 "넓게 캡처하고 디스플레이 필터로 좁혀 흐름을 재구성한다"가 핵심 워크플로입니다. tcpdump가 수집 도구라면 Wireshark는 해석 도구입니다.`,
  },

  // ── 5. TIME_WAIT ──────────────────────────────────────
  {
    title: 'TIME_WAIT 소켓 고갈 진단 — TCP 연결 상태와 커널 튜닝',
    slug: 'tcp-time-wait-socket-exhaustion-fix',
    summary: 'TCP 상태 머신에서 TIME_WAIT이 존재하는 이유, ss로 진단하는 법, 임시 포트 고갈과의 관계, tcp_tw_reuse vs 제거된 tcp_tw_recycle, SO_REUSEADDR까지 정확하게 정리합니다.',
    category: '트러블슈팅',
    tags: ['tcp', 'time-wait', 'socket', 'sysctl', 'kernel-tuning'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## TIME_WAIT 란?

\`TIME_WAIT\`은 TCP 연결을 **능동적으로 닫은(active close) 쪽**이 거치는 마지막 상태입니다. 연결을 종료한 뒤에도 소켓을 일정 시간(보통 2×MSL, 리눅스에서는 약 60초) 동안 유지합니다. 외부에서 보기엔 "이미 끝난 연결이 왜 이렇게 많이 남아 있지?"라고 의아할 수 있지만, 이는 **버그가 아니라 TCP 신뢰성을 위한 의도된 동작**입니다.

문제는 고부하 서버(특히 짧은 연결을 대량으로 맺는 리버스 프록시, HTTP 클라이언트)에서 TIME_WAIT 소켓이 수만~수십만 개 쌓이면서 **임시 포트(ephemeral port) 고갈**로 신규 아웃바운드 연결이 실패하는 상황입니다. \`cannot assign requested address\` 같은 에러가 대표적입니다. 이 가이드는 그 원인과 정확한 대응을 다룹니다.

## TCP 상태 머신과 4-way handshake

연결 종료는 4-way handshake로 진행되며, 먼저 \`FIN\`을 보낸 쪽(active closer)이 TIME_WAIT을 거칩니다.

\`\`\`text
Active Close 측              Passive Close 측
   ESTABLISHED                 ESTABLISHED
       | --- FIN ----------------> |
   FIN_WAIT_1                      |
       | <-- ACK ----------------- |
   FIN_WAIT_2                  CLOSE_WAIT
       | <-- FIN ----------------- |
       | --- ACK ----------------> | LAST_ACK
   TIME_WAIT  (약 60초 대기)      CLOSED
       |
   CLOSED
\`\`\`

| 상태 | 의미 |
| --- | --- |
| FIN_WAIT_1/2 | active close 측이 FIN 보내고 상대 응답 대기 |
| CLOSE_WAIT | passive close 측이 FIN 받고 자기 close() 대기 |
| LAST_ACK | passive close 측이 FIN 보내고 마지막 ACK 대기 |
| TIME_WAIT | active close 측의 마지막 대기 상태 |

> CLOSE_WAIT이 쌓이는 건 TIME_WAIT과 전혀 다른 문제입니다. CLOSE_WAIT 누적은 **애플리케이션이 socket을 close() 하지 않는 버그**(소켓 누수)의 신호입니다. 커널 튜닝이 아니라 코드를 고쳐야 합니다.

## TIME_WAIT이 존재하는 이유

왜 굳이 60초를 기다릴까요? 두 가지 이유가 있습니다.

1. **마지막 ACK 분실 대비**: active closer가 보낸 마지막 ACK가 유실되면 상대가 FIN을 재전송합니다. TIME_WAIT 동안 소켓을 살려둬야 이 재전송 FIN에 다시 ACK를 보낼 수 있습니다. 그렇지 않으면 상대는 RST를 받습니다.
2. **지연된 옛 패킷이 새 연결에 섞이는 것 방지**: 같은 4-튜플(출발IP:포트–목적IP:포트)로 곧바로 새 연결을 열면, 네트워크에 떠돌던 이전 연결의 늦은 패킷이 새 연결로 잘못 들어올 수 있습니다. 2×MSL 대기는 그런 패킷이 모두 소멸하도록 보장합니다.

즉 TIME_WAIT은 안전장치입니다. 무작정 없애려 하지 말고 **누가 active close를 하는지**부터 봐야 합니다.

## 진단: ss로 상태 분포 확인

\`\`\`bash
# 소켓 상태 요약 (가장 빠른 전체 그림)
ss -s

# 출력 예
# TCP:   180344 (estab 412, closed 178900, timewait 178500/0, ...)
\`\`\`

\`timewait\` 수치가 수만을 넘으면 주의 신호입니다. 상세 분포:

\`\`\`bash
# 상태별 개수 집계
ss -ant | awk 'NR>1 {print $1}' | sort | uniq -c | sort -rn

# TIME-WAIT 소켓만 보기
ss -tan state time-wait | head

# 특정 목적지로 향하는 TIME-WAIT (어느 백엔드인지)
ss -tan state time-wait dst 10.0.0.20
\`\`\`

\`netstat\`보다 \`ss\`가 빠르고 권장됩니다. 어떤 목적지로 TIME_WAIT이 몰리는지 보면 active close를 누가 하는지 추정할 수 있습니다.

## 임시 포트(ephemeral port) 고갈

아웃바운드 연결은 출발지 포트를 임시 포트 범위에서 하나씩 빌립니다. 같은 목적지로 향하는 TIME_WAIT 소켓이 이 포트를 점유하면 신규 연결이 포트를 못 받습니다.

\`\`\`bash
# 현재 임시 포트 범위 확인 (기본 32768~60999, 약 28k개)
cat /proc/sys/net/ipv4/ip_local_port_range
sysctl net.ipv4.ip_local_port_range

# 범위 확장 (포트 풀 증가)
sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"
\`\`\`

여기서 핵심은 4-튜플 유일성입니다. **목적지 IP:포트가 다르면** 출발 포트가 같아도 새 연결이 가능합니다. 따라서 단일 백엔드로만 대량 연결하는 경우가 가장 취약합니다. 근본 해법은 다음 순서로 검토합니다.

1. **Keep-Alive / 연결 풀**: 매 요청마다 연결을 새로 맺지 말고 재사용 (가장 효과적)
2. 임시 포트 범위 확장
3. 백엔드를 여러 IP로 분산
4. 커널 파라미터 튜닝(아래)

## tcp_tw_reuse vs tcp_tw_recycle

여기서 흔한 잘못된 조언을 바로잡아야 합니다.

### tcp_tw_recycle — 절대 쓰지 마세요 (제거됨)

\`net.ipv4.tcp_tw_recycle\`은 과거 TIME_WAIT을 공격적으로 회수했지만, NAT 뒤의 여러 클라이언트가 같은 IP로 보일 때 타임스탬프 기반 판단이 깨져 **연결이 무작위로 거부되는** 심각한 버그를 일으켰습니다. 리눅스 커널 **4.12에서 완전히 제거**되었습니다. 최신 시스템엔 이 파라미터가 존재하지도 않습니다. 인터넷의 오래된 가이드에 이 값이 보이면 무시하세요.

### tcp_tw_reuse — 조건부로 안전

\`net.ipv4.tcp_tw_reuse\`는 **아웃바운드(클라이언트 측) 연결**에 한해, TCP 타임스탬프로 안전이 확인된 TIME_WAIT 소켓을 새 연결에 재사용하도록 허용합니다. recycle과 달리 NAT 문제를 일으키지 않습니다.

\`\`\`bash
# 1: loopback 등에 적용, 2(기본): 비활성. 보통 1로 설정
sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# 타임스탬프가 켜져 있어야 reuse가 동작 (기본 1)
sysctl net.ipv4.tcp_timestamps
\`\`\`

> \`tcp_tw_reuse\`는 **연결을 거는 쪽**의 TIME_WAIT에만 효과가 있습니다. 들어오는 연결을 받는 서버(accept 측)의 TIME_WAIT은 줄여주지 않습니다. 서버 쪽이 문제라면 active close 주체를 클라이언트로 옮기는(HTTP라면 클라이언트가 연결을 닫게) 설계가 더 본질적입니다.

### tcp_max_tw_buckets — 상한

\`\`\`bash
# TIME_WAIT 소켓 총 개수 상한. 초과분은 즉시 폐기되고 로그 경고
sysctl net.ipv4.tcp_max_tw_buckets
\`\`\`

상한을 무리하게 낮추면 위에서 설명한 TIME_WAIT의 안전 기능을 깨므로 신중해야 합니다.

## SO_REUSEADDR / SO_REUSEPORT

소켓 옵션으로도 관련 문제를 다룹니다.

| 옵션 | 효과 |
| --- | --- |
| \`SO_REUSEADDR\` | TIME_WAIT 상태의 로컬 주소에 bind() 허용. 서버 재시작 시 "Address already in use" 회피의 주된 수단 |
| \`SO_REUSEPORT\` | 여러 프로세스가 같은 포트에 bind, 커널이 연결 분산(멀티 워커) |

\`\`\`c
int opt = 1;
setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
\`\`\`

대부분의 서버 프레임워크는 \`SO_REUSEADDR\`을 기본으로 켜므로 재시작 시 바인드 실패를 막아줍니다.

## 권장 적용 절차

\`\`\`bash
# /etc/sysctl.d/99-tcp-tuning.conf
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
# net.ipv4.tcp_tw_recycle  ← 존재하지 않음/사용 금지

# 적용
sudo sysctl --system
\`\`\`

> 커널 튜닝은 임시 완화책입니다. 근본 원인은 대개 "연결을 재사용하지 않고 매번 새로 맺는 애플리케이션 동작"입니다. HTTP 클라이언트 Keep-Alive와 연결 풀을 먼저 점검하세요.

## 정리

| 항목 | 핵심 |
| --- | --- |
| TIME_WAIT 주체 | active close(먼저 FIN 보낸 쪽)만 거침 |
| 존재 이유 | 마지막 ACK 재전송 대비 + 옛 패킷 혼입 방지 |
| 진단 | \`ss -s\`, \`ss -tan state time-wait\` |
| 포트 고갈 | 임시 포트 범위 + 4-튜플 유일성 |
| tcp_tw_recycle | 커널 4.12에서 제거, 사용 금지 |
| tcp_tw_reuse | 아웃바운드 한정 안전, 타임스탬프 필요 |
| SO_REUSEADDR | 재시작 시 bind 실패 회피 |
| 근본 해법 | Keep-Alive / 연결 풀로 연결 재사용 |

TIME_WAIT은 없애야 할 적이 아니라 이해하고 다뤄야 할 안전장치입니다. "누가 active close를 하는가"와 "연결을 재사용하는가"를 먼저 보면 대부분의 고갈 문제가 풀립니다.`,
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
