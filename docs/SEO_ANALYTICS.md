# SEO·도메인·분석 운영 가이드

이 문서는 대표 도메인 설정, 필요한 환경변수, 검색엔진 등록 체크리스트, sitemap/RSS 제출 URL,
분석 이벤트 목록과 개인정보 원칙을 한곳에 정리합니다. 코드 변경 없이 Vercel/Search Console/
네이버 서치어드바이저에서 사람이 직접 확인·설정해야 하는 항목도 함께 표시합니다.

## 1. 대표(canonical) 도메인

**실제 서비스 중인 대표 도메인은 `https://www.thivelab.com`입니다.**

```
$ curl -sI https://thivelab.com/
HTTP/2 301
location: https://www.thivelab.com/
```

apex(`thivelab.com`)는 Cloudflare에서 301로 `www.thivelab.com`으로 리디렉션되고 있습니다 —
이 리디렉션은 의도된 것이며 코드/DNS 어느 쪽도 바꾸지 않았습니다. 코드의 `metadataBase`,
canonical, Open Graph URL, `sitemap.xml`, `robots.txt`, RSS, JSON-LD는 모두
`NEXT_PUBLIC_SITE_URL`(기본값 `https://www.thivelab.com`) 하나를 기준으로 생성되므로
이미 일관되게 www로 통일되어 있습니다.

- **Vercel Domains에서 확인할 항목**: `www.thivelab.com`이 Primary(대표) 도메인으로 지정되어
  있는지, `thivelab.com`(apex)과 `*.vercel.app` 기본 도메인이 각각 www로 리디렉션되도록
  설정되어 있는지 확인하세요. apex→www 리디렉션이 Cloudflare(DNS 프록시)에서 이미 처리되고
  있다면 Vercel에서 동일한 리디렉션을 중복 설정할 필요는 없지만, Vercel이 apex 도메인의
  트래픽을 직접 받는 경로가 있다면(Cloudflare를 우회하는 경우) Vercel Domains의
  "Redirect to" 기능으로 `www.thivelab.com`을 가리키게 설정해야 합니다.
- **`*.vercel.app` 기본 도메인**: 검색엔진이 `ai-blog-mocha.vercel.app` 같은 Vercel 기본
  도메인을 색인하지 않도록, Vercel Domains에서 프로덕션 도메인을 `www.thivelab.com`으로
  고정하고 기본 `.vercel.app` 도메인에는 별도로 canonical을 지정하거나(코드가 이미
  `NEXT_PUBLIC_SITE_URL` 기준으로 canonical을 절대경로로 생성하므로 자동으로 처리됨) 접근을
  제한하는 것을 권장합니다.

## 2. 환경변수

| 변수 | 설명 | 비고 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | canonical/OG/sitemap/robots/RSS/JSON-LD의 기준 URL | 프로덕션은 `https://www.thivelab.com`, Preview/개발은 비워두면 코드 기본값(같은 값)으로 폴백 |
| `NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 "HTML 태그" 소유 확인 코드 | 콤마로 여러 개 지정 가능(`code1,code2`). 값 자체는 페이지 소스에 공개되지만 계정별로 달라지므로 코드에 고정하지 않음. 미설정 시 메타 태그 미출력 |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console "HTML 태그" 소유 확인 코드 | 미설정 시 메타 태그 미출력 |

나머지 필수/기능별 환경변수는 README의 "환경 변수" 절을 참고하세요.

## 3. Google Search Console 등록 체크리스트

1. 속성 유형은 **도메인 속성**(`thivelab.com`)을 권장 — apex/www, http/https를 한 번에 커버합니다.
   (이미 GSC 자동 수집 스크립트가 `sc-domain:thivelab.com`로 설정되어 있음 — `.env.local`의
   `GSC_SITE_URL` 참고.)
2. 소유 확인 후 사이트맵 제출: **`https://www.thivelab.com/sitemap.xml`**
3. URL 검사 도구로 `https://www.thivelab.com/`과 `https://thivelab.com/`을 각각 검사해
   apex가 www로 정상 리디렉션되는지, www 버전이 "제출한 URL과 사용자가 선택한 URL이 동일"로
   나오는지 확인합니다.
4. 이전에 apex 기준으로 별도 속성을 등록했다면 그대로 두어도 무방합니다(도메인 속성이 포함).

## 4. 네이버 서치어드바이저 등록 체크리스트

1. 사이트 등록: **`https://www.thivelab.com`**
2. 소유 확인: "HTML 태그" 방식 선택 → 발급된 코드를 Vercel 프로젝트의 `NAVER_SITE_VERIFICATION`
   환경변수에 넣고 재배포 → `<meta name="naver-site-verification">`가 페이지 소스에 출력되는지
   확인 후 "확인" 클릭. PC/모바일 속성을 각각 등록했다면 두 코드를 콤마로 이어서 넣습니다.
3. 사이트맵 제출: **`https://www.thivelab.com/sitemap.xml`**
4. RSS 제출(선택, 신규 글 수집 가속): **`https://www.thivelab.com/rss`**
   (`/rss.xml`, `/feed`, `/feed.xml`, `/atom.xml`은 모두 `/rss`로 301 리디렉션됩니다.)
5. 크롤러 허용 확인: `robots.txt`에 `Yeti`, `NaverBot` 모두 `Allow: /`로 명시되어 있습니다.

## 5. sitemap / RSS 제출 URL 요약

- Sitemap: `https://www.thivelab.com/sitemap.xml`
- RSS: `https://www.thivelab.com/rss`
- Robots: `https://www.thivelab.com/robots.txt`

## 6. 분석 이벤트와 개인정보 원칙

기존에 **Vercel Analytics**(페이지뷰 자동 수집)와 **GA4**(`gtag`, `layout.tsx`에 설치됨)가
이미 설치되어 있습니다. 커스텀 이벤트는 Vercel Analytics Custom Events가 Pro 요금제 전용이라
**이미 설치된 GA4로 전송**하는 방식을 택했습니다(`src/lib/analytics.ts`) — 새 분석 서비스는
추가하지 않았습니다.

### 이벤트 목록

| 이벤트 | 발생 위치 | 전송 필드 |
| --- | --- | --- |
| `related_post_click` | 관련 글/가이드 카드, 본문 TOC 옆 "바로 이어보기" | `path`(현재 경로), `target_slug`(클릭한 글의 slug), `position`(카드 순서) |
| `toc_click` | 글 상세 목차 항목 클릭 | `path`, `heading_id` |
| `code_copy` | 코드 블록 복사 버튼 | `path`, `language` |
| `category_click` | 홈/레인/가이드 섹션의 카테고리 이동 링크 | `path`, `category`, `position`(선택) |
| `outbound_link_click` | 본문 "관련 공식 문서" 외부 링크 | `path`, `domain`(호스트명만, 전체 URL·쿼리 미포함) |

### 개인정보 원칙

- 전송 필드는 경로·slug·카테고리·언어·도메인 등 "무엇을 클릭했는지" 식별에 필요한 최소 정보만
  포함합니다.
- 검색어 원문, 댓글/코드 내용, 이메일, IP, 쿠키 기반 사용자 식별자는 절대 전송하지 않습니다.
- `trackEvent()`는 `window.gtag`가 없거나 광고 차단기 등으로 호출이 실패해도 예외를 던지지
  않습니다 — 링크 이동·복사 등 실제 기능은 분석 성공 여부와 무관하게 항상 동작합니다.
- 이벤트를 붙이기 위해 페이지 전체를 client component로 전환하지 않았습니다. 데이터 계산은
  서버 컴포넌트에서 그대로 수행하고, 클릭 추적이 필요한 링크만 작은 client 컴포넌트
  (`TrackedLink`, `TrackedExternalLink`)로 감쌌습니다.

### GA4에서 확인하는 법

GA4 속성 → 보고서 → 참여도 → 이벤트에서 위 5개 이벤트 이름이 수집되는지 확인하세요. 필요하면
"주요 이벤트(전환)"로 표시해 관련 글 클릭률·코드 복사율을 목표로 추적할 수 있습니다.

## 7. Vercel Analytics — Hostnames 탭에서 배포 후 확인할 사항

Vercel Analytics 화면에 `ai-blog-mocha.vercel.app +2`처럼 여러 호스트명이 섞여 표시되는 것은
프로덕션 도메인(`www.thivelab.com`), apex(`thivelab.com`), Vercel 기본 도메인
(`*.vercel.app`)이 모두 같은 프로젝트로 잡혀 트래픽이 합산되기 때문입니다. 배포 후
Hostnames 탭에서:

1. `www.thivelab.com` 트래픽이 실제 방문자 수의 대부분을 차지하는지 확인합니다.
2. `*.vercel.app` 유입이 크롤러/헬스체크가 아닌 실사용자 트래픽으로 잡히는지 확인합니다 —
   비중이 크다면 apex/www 리디렉션이 실제로 적용되기 전(예: 캐시된 링크, 오래된 북마크)의
   유입일 수 있습니다.
3. 특정 호스트명만 따로 보고 싶다면 Hostnames 필터로 `www.thivelab.com`만 선택해 조회수·
   이탈률을 별도로 확인하세요(현재 보고된 지표는 모든 호스트명 합산치일 가능성이 있습니다).
