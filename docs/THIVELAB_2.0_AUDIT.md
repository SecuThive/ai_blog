# THIVELAB 2.0 현황 진단

기준: 2026-10-09 KST, 저장소 `7ed7435`. 이 문서는 읽기 전용 코드·호스트·공개 HTTP 점검 결과다. Cloudflare 대시보드, 광고 계정, Search Console의 내부 설정은 확인하지 않았다. 비밀키와 DB 행 데이터는 열람하거나 기록하지 않았다.

## 범위와 변경 금지 기준

- 이 단계에서 운영 코드, 데이터, DNS, Tunnel 라우트, PM2 설정을 수정하지 않았다.
- 작업 시작 시 이미 있던 DEV 시안 변경(`src/app/[locale]/page.tsx`, `src/app/globals.css`, 새 `src/components/HeroDepthScene.tsx`)은 이 진단의 변경이 아니다. 운영 빌드와 DEV 서버가 같은 저장소를 참조한다. 이후 TOOLS 개발은 별도 디렉터리와 빌드 산출물로 격리해야 한다.
- `THIVELAB_SYSTEM.md`는 Vercel을 라이브 호스트라고 적고 있으나 현재 실행 상태 및 `README.md`, `docs/SELF_HOST_CLOUDFLARE.md`는 자체 호스팅을 가리킨다. 운영 판단은 현재 프로세스와 공개 응답을 우선했다. 과거 문서의 도메인·배포 설명을 그대로 실행 절차로 사용하면 안 된다.

## 1. 코드와 기술 스택

| 항목 | 확인 결과 | 근거 |
| --- | --- | --- |
| NODELOG 웹 | Next.js 16.2.7, React 19.2.4, TypeScript 5, App Router와 Route Handler | `package.json`, `src/app/`, `src/proxy.ts` |
| 콘텐츠 렌더링 | DB의 글·가이드를 React Markdown/GFM으로 렌더링; `posts`/`engineer_guides` 발행 상태 사용 | `src/app/[locale]/blog/[slug]/page.tsx`, `src/app/[locale]/engineer/[slug]/page.tsx`, `src/lib/supabase.ts` |
| 데이터 | 자체 PostgreSQL 17 + PostgREST Docker 컨테이너. `SUPABASE_*` 변수명과 JS 클라이언트는 호환을 위해 유지 | `docker ps`, `README.md`, `~/project/nodelog-db/README.md` |
| 이메일·분석·광고 | Resend, GA4, AdSense 코드가 저장소에 존재. 계정의 실제 전송·수익 상태는 미확인 | `src/app/api/{contact,subscribe,newsletter/send}/`, `src/app/[locale]/layout.tsx`, `src/components/AdSenseLoader.tsx` |
| 배포 | PM2 `next start` + 원격 관리 Cloudflare Tunnel | `ecosystem.config.cjs`, PM2 관측, `docs/SELF_HOST_CLOUDFLARE.md` |
| 테스트 | Node 내장 테스트 5개 파일, ESLint, TypeScript 검사 스크립트 | `package.json`, `tests/` |

주요 데이터 테이블은 `posts`, `engineer_guides`, `comments`, `subscribers`, `contacts`이다(`supabase-schema.sql`, `comments-schema.sql`). 댓글, 북마크, 구독, 문의, 검색, 피드백과 조회 API가 기존 사이트에 있다. 테마·북마크·최근 검색어 등은 브라우저 `localStorage`, 글 조회 중복 방지는 `sessionStorage`를 사용한다. TOOLS가 이 DB나 키를 재사용할 이유는 MVP에 없다.

## 2. 서비스, 프로세스, 포트, 공개 경로

2026-10-09 PM2·Docker·`lsof` 스냅샷이다. 자원 수치는 순간값이다.

| 서비스 | 실행 상태·로컬 경로 | 외부 전달에 대해 확인한 것 |
| --- | --- | --- |
| NODELOG 운영 | PM2 `thivelab-web` online, `127.0.0.1:3103`, 약 248MiB RSS | `https://www.thivelab.com/` 200. `thivelab-tunnel` online, 토큰 파일로 실행. 대시보드의 정확한 hostname→origin 규칙은 미확인 |
| NODELOG DEV | PM2 `thivelab-dev` online, `0.0.0.0:3104`, 같은 저장소에서 `next dev` | 개발 서버가 모든 인터페이스에서 수신. 공개 Tunnel 등록 여부는 미확인; 운영과 빌드·소스 분리 필요 |
| NODELOG DB | Docker `nodelog-db-postgres-1` healthy, 호스트 `127.0.0.1:55440`; `nodelog-db-postgrest-1`, `127.0.0.1:3300` | `~/project/NEWGEN/Caddyfile`의 `db.thivelab.com/rest/v1/*` → 3300. 현재 DNS·외부 접근 통제는 별도 보안 검토 필요 |
| CIPHER/game | Docker `game-frontend-1` → `127.0.0.1:3100`, 별도 backend/PostgreSQL/Redis | Caddy의 `game.thivelab.com` → 3100, 공개 홈 200 |
| MOA | PM2 `moa` online, `127.0.0.1:5173`, 별도 B2B 저장소와 SQLite | Caddy의 `moa.thivelab.com` → 5173, 공개 홈 200 |
| 운영 보조 | PM2 `thivelab-indexnow-scheduler` online, `thivelab-tunnel` online | 발행 재검증과 IndexNow는 NODELOG에 결합 |
| 콘텐츠 자동화 | PM2 `blog-refresh`, `blog-approval`, `blog-health`는 관측 시 stopped | 주기 작업은 stopped가 정상일 수 있으나 `blog-approval`의 비정상적으로 큰 재시작 카운터와 실제 승인 경로는 별도 확인 필요 |

`www`는 Tunnel 경로, MOA·game·DB는 현재 읽은 Caddy 설정 경로다. 이들이 같은 Cloudflare 배포 정책을 쓴다고 가정하지 않는다. `tools.thivelab.com`은 관측 시 DNS 조회 결과가 없었다. 신규 호스트의 Tunnel/Caddy 선택은 계정의 실제 라우트·DNS를 확인한 뒤 결정해야 한다. Cloudflare 공식 문서는 published application을 공개 hostname과 로컬 service URL의 매핑으로 설명한다: [Tunnel routing](https://developers.cloudflare.com/tunnel/concepts/routing/).

## 3. 라우팅과 SEO 기준선

- 한국어 기본 URL은 접두사 없이 `/`, `/blog/[slug]`, `/engineer/[slug]`, `/category/[cat]`, `/tag/[tag]`, `/series/[id]`; 영어는 `/en/...`이다. `/ko/...`는 308을 의도하고, `/blog` 목록은 홈으로 영구 이동한다. 피드 별칭 `/rss.xml`, `/feed`, `/feed.xml`, `/atom.xml`은 `/rss`로 이동한다(`src/proxy.ts`, `next.config.ts`, `src/app/[locale]/blog/page.tsx`).
- canonical·hreflang은 `src/i18n/metadata.ts` 및 개별 페이지에서 생성한다. `src/app/sitemap.ts`는 발행·색인 가능 콘텐츠, 언어 대체 URL, 본문 변경 기록 기반 `lastmod`를 구성하며 DB 장애 폴백이 있다. `src/app/robots.ts`는 공개 크롤을 허용하면서 일부 경로를 제외한다. 중복 글의 보존 대상 이동은 `src/lib/postRedirects.ts`에 있다.
- 공개 스냅샷: `/`, `/en`, `/robots.txt`, `/sitemap.xml` 200; 임의 없는 경로 404; `http://thivelab.com/`과 `https://thivelab.com/`은 모두 `https://www.thivelab.com/`으로 301. 사이트맵의 `<loc>` 540개와 영어 alternate 540개를 확인했다. 이는 현재 시점 표본이며 전체 URL의 정확성 검증을 뜻하지 않는다.
- `/search?q=test`는 200, `noindex, follow`, 홈 canonical이다. `/blog`·`/en/blog`는 최종 응답이 홈이고, 기존 색인 경로를 TOOLS 도입 때문에 바꾸지 않는다. 기존 SEO 기준선은 `docs/seo/current-state.md`와 `docs/seo/baseline-*.json`에 있다.
- `docs/adsense-audit-2026-10-02/REPORT.md`의 예전 HTTP apex 리디렉션 루프는 이번 공개 재확인에서는 재현되지 않았다. Cloudflare WAF·봇 정책, Search Console 색인 상태, AdSense 계정 승인 상태는 확인하지 못했다.

Google은 URL 변경 때 URL 매핑, redirect, canonical, 내부 링크, sitemap을 함께 점검하도록 안내한다. 이번 제안은 기존 URL을 이동하지 않는 것이 기준이다: [Google Search Central: site moves](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [canonical 신호](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## 4. 자원과 백업·복구

| 관측·절차 | 상태와 의미 |
| --- | --- |
| 하드웨어 | `sysctl` 메모리 32GiB. `memory_pressure`의 순간 가용 비율 44%, `uptime` load average 3.70/6.20/6.74. `top`과 `ps`는 이 실행 환경에서 권한 오류라 호스트 전체 CPU 점유율은 미확인 |
| 디스크 | `/System/Volumes/Data` 460GiB 중 368GiB 사용, 약 50GiB 가용(88%). `ai-blog/.next` 2.7GiB, `node_modules` 684MiB, PM2 로그 729MiB. 새 대용량 파일 업로드·서버 변환을 피할 근거 |
| NODELOG DB 백업 | `com.newgen.nodelog-backup.plist`가 매일 04:17 `pg_dump -Fc` 실행. 10월 9일 5.4MiB 덤프와 성공 로그 확인. 최근 14개 보관, `pg_restore --list` 구조 검사. 실제 최신 덤프 복원 검증은 수행하지 않음 |
| 외부 복사 | plist의 `OFFSITE_DEST`가 비어 있어 꺼져 있음. Mac/디스크 장애에는 로컬 백업만으로 부족. 암호화된 외부 복사와 정기 격리 복원 시험 필요 |
| 재시작 | `pm2.mainthive.plist`는 로그인 시 `pm2 resurrect`로 설정돼 있고 PM2 프로세스가 online. `launchctl list` 조회에서 해당 label은 확인되지 않아 실제 재부팅 자동 복구는 미검증 |
| 코드 롤백 | 문서상 이전 Git 버전 재빌드 후 PM2 재시작. 운영과 DEV가 한 저장소·`.next`를 공유하므로 빌드 중 운영 영향 위험이 있다. 독립 checkout + 별도 산출물 + 포트 전환 절차를 우선 설계해야 함 |
| 데이터 복구 | `~/project/nodelog-db/README.md`는 2026-09-29 복원 시험을 기록. 최신 백업의 격리 복원, RPO/RTO, 복구 담당자·명령은 운영 문서로 재검증해야 함 |

## 5. 결정 전 확인할 사항

1. Cloudflare 계정에서 `www`, `game`, `moa`, `db`의 DNS·Tunnel published application·WAF·Access·캐시 규칙을 내보내 현재 파일과 대조한다. `tools` 호스트의 기존 소유·예약 여부도 확인한다.
2. Mac의 부팅·로그인 뒤 Docker, PM2, Tunnel, Caddy 및 백업 작업이 자동 복구되는지 실제 재부팅 리허설 또는 launchd 상태로 확인한다.
3. NODELOG 최신 덤프를 격리 DB에 복원하고 무결성·복원 소요 시간을 기록한다. 외부 백업의 접근 권한·암호화·보관 정책을 정한다.
4. CIPHER·MOA 데이터 백업과 복구 절차를 각 저장소 운영자 기준으로 별도 확인한다. 이번 진단은 두 앱의 전체 코드·데이터 감사가 아니다.
5. 24시간 이상 CPU·메모리·디스크·DB 연결·응답 시간 추이를 수집한다. 순간 수치로 TOOLS 수용량을 확정하지 않는다.
6. Search Console의 대표 URL·색인 추이와 Cloudflare Analytics 실제 설정을 계정에서 확인한다. 현재 공개 응답만으로 검색 순위 영향이나 사용자 수를 판단하지 않는다.

## 6. 현재 단계 결론

기존 NODELOG URL과 데이터 경로를 유지한 채, `tools.thivelab.com`을 별도 정적 앱으로 시험하는 구조가 현재 관측에 가장 맞는다. 배포 결정 전에 **공유 빌드 격리, 디스크 여유, 외부 백업 및 복원, Cloudflare 실제 라우트**를 확인해야 한다. 구체적 설계와 게이트는 `docs/THIVELAB_2.0_ROADMAP.md`에 둔다.
