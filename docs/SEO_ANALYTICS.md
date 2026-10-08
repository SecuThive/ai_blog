# SEO·도메인·분석 운영 가이드

이 문서는 대표 도메인 설정, 필요한 환경변수, 검색엔진 등록 체크리스트, sitemap/RSS 제출 URL,
분석 이벤트 목록과 개인정보 원칙을 한곳에 정리합니다. 코드 변경 없이 Cloudflare/Search Console/
네이버 서치어드바이저에서 사람이 직접 확인·설정해야 하는 항목도 함께 표시합니다.

## 1. 대표(canonical) 도메인

**실제 서비스 중인 대표 도메인은 `https://www.thivelab.com`입니다.**

```
$ curl -sI https://thivelab.com/
HTTP/2 301
location: https://www.thivelab.com/
```

apex(`thivelab.com`)는 Cloudflare에서 301로 `www.thivelab.com`으로 리디렉션되고 있습니다.
웹 서버는 Cloudflare Tunnel을 통해 공개됩니다. 코드의 `metadataBase`,
canonical, Open Graph URL, `sitemap.xml`, `robots.txt`, RSS, JSON-LD는 모두
`NEXT_PUBLIC_SITE_URL`(기본값 `https://www.thivelab.com`) 하나를 기준으로 생성되므로
이미 일관되게 www로 통일되어 있습니다.

- **Cloudflare에서 확인할 항목**: `www.thivelab.com`이 Tunnel로 연결되는지,
  HTTP 및 apex 요청이 HTTPS 대표 주소로 301 이동하는지 확인합니다.
- **남은 Vercel 계정 작업**: 이전 프로젝트의 GitHub 자동 배포 연동은 계정에서
  해제 여부를 확인해야 합니다. Vercel 기본 도메인이 남아 있더라도 공개 페이지의
  canonical은 `NEXT_PUBLIC_SITE_URL`을 기준으로 생성됩니다.

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

현재 코드에는 **GA4**(`gtag`, `SiteAnalytics.tsx`)가 설치되어 있고, 클릭 이벤트도
GA4로 전송합니다(`src/lib/analytics.ts`). 이전 Vercel Analytics 코드는 자체 호스팅
전환 때 제거했습니다. Cloudflare Web Analytics의 브라우저 비콘 데이터가 현재
`www.thivelab.com`에서 수집되고 있습니다. 두 분석 도구의 방문·조회 지표는 수집 방식이
달라 같은 수치로 취급하지 않습니다.

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

## 7. Cloudflare Web Analytics에서 확인할 사항

Web Analytics 화면에서 호스트를 `www.thivelab.com`으로 제한하고 날짜와 시간대를
명시합니다. `thivelab.com`의 다른 서브도메인과 합산하지 않습니다. 방문(Visits)은
고유한 사람 수가 아니고, HTTP 요청 수에는 이미지·정적 파일·크롤러 요청이 포함될 수
있습니다. 사람 유입 추세는 Web Analytics의 브라우저 비콘 지표와 GA4를 함께 확인합니다.

개인정보처리방침에는 현재 사용하는 GA4와 Cloudflare Web Analytics를 안내합니다.
분석 설정이나 수집 범위가 바뀌면 실제 운영 상태를 확인한 뒤 이 문서와 방침을 갱신합니다.
