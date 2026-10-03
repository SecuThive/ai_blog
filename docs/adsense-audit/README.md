# Nodelog 애드센스 품질 점검 1단계 (2026-10-03)

이 PR은 코드 변경과 **미적용** SQL 수정안, 점검 기록을 담는다. 운영 DB 쓰기, 배포, 병합, 애드센스 재신청은 하지 않았다.
외부 감사 보고서(`/workspace/adsense-audit/report.md`, 2026-10-03)의 항목을 함께 반영했다.

- SQL 수정안: [`sql/2026-10-03-phase1-content-fixes.sql`](sql/2026-10-03-phase1-content-fixes.sql). 운영 DB 복사본(2026-10-03 04:17 덤프의 posts 테이블을 임시 컨테이너에 복원)에서 8개 UPDATE가 모두 1행씩 적용되는 것까지 확인했다. 운영 DB에는 적용하지 않았다.
- DB 변경 이력과 다른 세션의 10-02 변경: [`db-changes.md`](db-changes.md)
- 연도 불일치 스캔: `year-mismatch-db-scan-2026-10-03.csv`(DB 직접 스캔), `external-audit-date-mismatches.csv`(외부 감사)

## 1. 정책상 필수 (애드센스 정책·법적 고지)

| # | 문제 | 조치(이 PR) |
|---|---|---|
| P1 | `adsbygoogle.js`를 layout에서 모든 화면에 넣었다. 404, 빈 검색, 빈 태그, 북마크, noindex 153편, 구독·문의 화면도 포함 | 전역 로더를 없애고 `AdSenseLoader`를 **콘텐츠가 있는 화면에만** 넣었다: 홈(글이 있을 때), 본문을 보여 주는 가이드, `isAdEligiblePost()`가 참인 글(색인 대상이고 본문 표시). 404·soft-404 카테고리·검색·태그·북마크·구독·문의·수신거부·privacy·COMING SOON 화면에는 넣지 않는다. 게시자 ID `ca-pub-2091277631590195` 값은 그대로 두었다 |
| P2 | 개인정보처리방침에 제3자(Google)의 쿠키·웹 비콘·IP 수집 고지가 없고 링크가 404(`google.com/settings/ads`) | 고지를 추가하고 실제 링크(200 확인)를 달았다: Google 광고 설정, 파트너 사이트 정보 사용 방식, 광고 기술, YourAdChoices, Google 개인정보처리방침. Cloudflare(`cf_clearance`, Web Analytics)와 jsDelivr(Pretendard 글꼴) 고지를 추가했다. 사실과 다른 "세션 쿠키" 문구를 없애고 localStorage 사용을 적었다. 수신거부는 "비활성 처리, 삭제는 요청 시"로 실제 동작에 맞췄다. 보관 기간은 새로 만들지 않았다 |

## 2. 권장 (높음)

| # | 문제 | 조치 |
|---|---|---|
| R1 | 'REVIEWED · UPDATED' 배지가 4곳(page.tsx L143·L297, HomeClient L361, OG 이미지 L146)에 고정 문구로 박혀 있었다. 실제 검토 기록(`reviewed_at`)은 전부 NULL | 고정 배지를 지웠다. 검증 기록(`verifiedAt`+`reviewScope`+https 출처 1개 이상)이 있을 때만 "검증 기록"을 표시한다(`src/lib/editorialRecord.ts`) |
| R2 | 화면 "수정일", JSON-LD `dateModified`, sitemap `lastmod`가 `updated_at`이었다. 이 값은 트리거로 번역 배치(09-18, 09-29) 때 수백 편이 한꺼번에 바뀌었다 | `content_evidence.contentUpdatedAt`+`changeSummary`가 있고 발행일보다 늦을 때만 수정일로 쓴다. 없으면 발행일만 표시한다 |
| R3 | 홈의 LLM 회고 글(#400): EN 제목·설명이 옛 「Model Selection Guide」, 비용 공식 표기가 모호, KO 안내문의 시간 순서 오류 | SQL 수정안(미적용). 코드에서는 이 글에 "기준 시점" 안내를 띄우고 홈 노출에서 뺐다(`src/lib/historicalPosts.ts`) |
| R4 | 제목 연도만 바뀐 글: #263 LLM 트렌드 리포트, #206 랜섬웨어, #217 AWS/Azure/GCP, #402 AI 거버넌스, #265 AI 개발 보안(본문 H1이 옛 제목), #262·#267(noindex) | SQL 수정안(미적용) |
| R5 | `/category/<없는 값>`이 200, 404 화면에 robots 메타가 두 개(noindex와 index,follow) | 알 수 없는 카테고리는 `notFound()`. layout의 전역 `robots: index,follow`를 없애 404의 robots 메타가 noindex 하나만 남는다(빌드 결과로 확인) |
| R6 | `/tag/Node.js`가 404(`src/proxy.ts`가 점이 든 경로를 정적 파일로 보고 건너뜀) | `/blog`, `/engineer`, `/tag`, `/series`, `/category`는 점이 있어도 페이지 경로로 처리한다. `/favicon.ico`, `/robots.txt`는 계속 정적 처리(로컬 확인). `/ko` 리디렉션을 308로 바꿨다 |
| R7 | `/unsubscribe?email=`가 404, `/api/unsubscribe`는 이메일만으로 해지(제3자가 남의 구독을 해지할 수 있음, 이메일이 URL·로그에 남음) | 서명 토큰 `<subscriber id>.<HMAC-SHA256>`으로 바꿨다. 새 환경변수 **`UNSUBSCRIBE_TOKEN_SECRET`**(32자 이상 무작위 값, Vercel에는 아직 설정하지 않음). `/unsubscribe` 화면(noindex, 광고 없음)에서 버튼을 눌러야 POST로 해지된다. 메일 보안 스캐너가 링크를 미리 열어도 해지되지 않는다. 예전 `?email=` 링크는 상태를 바꾸지 않고 이메일 없는 안내 화면으로 보낸다. 환영 메일과 주간 메일의 링크도 토큰 방식으로 바꿨다. 비밀키가 없으면 메일 링크가 회신 메일(mailto)로 대체된다 |
| R8 | sitemap 캐시가 약 40시간까지 관측됨(lastmod 지연), `/archive` HTML 5.6MB | sitemap을 요청마다 생성한다(DB가 자체 운영으로 바뀌어 egress 쿼터 문제 없음, JSON 경로 선택으로 가벼운 조회). 글·가이드 `<loc>`를 퍼센트 인코딩하고 `/engineer`의 lastmod는 최신 가이드 기준. archive는 제목만 서버에서 계산해 넘겨 **약 0.73MB**로 줄였다(로컬 빌드 측정) |
| R9 | 시리즈 페이지 19개의 HTML에 hreflang이 없음 | `/series`, `/series/[id]`에 ko/en/x-default `alternates.languages`를 추가했다(로컬 확인) |

### 이 PR에서 함께 고친 사실과 다른 문구
- 홈 통계 "검토 완료" 성격의 표현 → `AI-ASSISTED DRAFTS`. 소개·작성자·FAQ·정책 문구를 실제 파이프라인에 맞췄다: 대부분 AI 초안이고, 발행은 운영자가 결정하며, 검토 기록은 있는 글에만 표시한다. 승인 게이트는 2026-07-31부터 있었지만 스크립트 발행이 이를 거치지 않았다.
- "Nodelog 기술 편집팀" → "Nodelog 편집"(실제 팀이 아님). OG 이미지의 페르소나 작성자명을 사이트 작성자 표기로 바꿨다.
- 뉴스레터 "매주 화요일 오전 8시 발송", "평균 6분 분량" 문구를 없앴다. 발송 크론이 없다(Vercel 크론은 `/api/indexnow`뿐).
- 구독 화면의 출처 불명 구독자 후기(★★★★★ 3개)를 없앴다. 실제 구독자는 3명이다.
- `PUT /api/posts/[id]`가 요청 본문 전체를 그대로 저장해 `reviewed_at`·`published_at`·`updated_at`·`views` 등을 덮어쓸 수 있었다. 이 필드들을 제거하고 저장한다.

## 3. 편집자가 사람 눈으로 확인할 것 (코드·SQL로 판단하지 않음)
- [ ] #589 ISMS-P "102개 항목, 개인정보 22개": 2023.11 개정 이후 101/21개일 가능성. 고시 원문 확인
- [ ] #604 클라우드 관련 "제8조의2" 인용: 14조의2일 가능성. 원문 확인
- [ ] #665와 #734의 CSAP 등급 설명이 서로 다름(간편등급 vs 하/중/상)
- [ ] #805 `kubectl get pods -l "$(... | tr -d '{}"' | tr ',' ',')"`는 `app:x`를 만들어 라벨 셀렉터가 되지 않음. 명령 수정
- [ ] #102(현행 LLM 선택 가이드, #400이 링크): 모델 ID(claude-sonnet-4-6, claude-opus-4-7) 미검증, `client`를 OpenAI()로 다시 할당한 뒤 `client.messages.create` 호출, "Sonnet이 코드에 강하다" 근거 없음
- [ ] #206 "2024년 피해액 42억 달러", #217 점유율 31/25/11% 출처
- [ ] #402 규제 문장(EU AI Act·국내 AI 기본법)의 현재 상태
- [ ] #743 Docker Hub 제한(2024~2025) 확인일 표기
- [ ] 영문판 전체: 09-18·09-29 일괄 기계번역, 품질 미검토
- [ ] noindex 저우선순위: `2024-구글-seo-…`, `2024년-it-개발자가-주목해야-할-llm-…` 제목 연도

## 4. 중복·통합 제안 (실행하지 않음, 승인 필요)
| 묶음 | 글 | 제안 |
|---|---|---|
| 망분리 | 604 / 792 / 698(noindex) | 604를 대표로 두고 792 내용 흡수, 698·792는 301 |
| CSAP | 665 / 734 | 등급 설명을 통일한 뒤 하나로 합치기 |
| ISMS-P | 589 / 778 / 657 | 589 대표, 항목 수 확인 후 통합 |
| Endpoints | 667 / 805 / 가이드 167 | 10-02 다른 세션이 역할을 나눠 둠. 805 명령 오류 수정 후 유지 여부 판단 |
| CORS 등 | 600 / 744 외 (`SEMANTIC_DUP_REPORT.csv`) | 개별 판단 |
| noindex 153편 | `src/lib/noindexPosts.ts` | 보강·통합·삭제(410) 중 결정. 색인 글과 겹치는 것은 통합 후 301 |

## 5. 코드 밖 조치 (소유자 판단·승인 필요)
1. **Cloudflare**: `http://thivelab.com/`이 자기 자신으로 301(무한 루프). Cloudflare 리디렉션 규칙을 수정해야 한다.
2. **AdSense 콘솔**: 유럽(EEA·영국·스위스)용 Google 인증 CMP 메시지 설정. 자동 광고를 쓰면 URL 제외(`/search`, `/tag/*`, `/bookmarks`, `/subscribe`, `/contact`, `/unsubscribe`). 남은 위험: 광고 대상 글을 먼저 연 뒤 클라이언트 측 이동으로 광고 비대상 화면에 가면 이미 로드된 스크립트가 문서에 남는다. 콘솔의 URL 제외가 그 보완책이다.
3. **CSP(`next.config.ts`)**: 광고 관련 도메인 보완 검토(`*.adtrafficquality.google`, `*.doubleclick.net`, `adservice.google.com`, CMP 도메인). Cloudflare Web Analytics를 쓸 거면 `static.cloudflareinsights.com`, `cloudflareinsights.com` 허용, 안 쓸 거면 대시보드에서 끄기(현재 CSP가 비콘을 막고 있다).
4. **Vercel 환경변수**: `UNSUBSCRIBE_TOKEN_SECRET` 설정(예: `openssl rand -base64 48`). 설정 전에는 메일의 해지 링크가 mailto로 나간다.
5. **GA4**: 검색어 `q` 파라미터가 page_location에 남는다. 마스킹 검토.
6. **파이프라인**: pm2 `blog-approval`(텔레그램 승인 봇) 파일 없음으로 2,700만 회 재시작 중, `blog-refresh` 정지. `scripts/insert-*.mjs`가 승인 게이트 없이 DB에 직접 발행한다. 정리 필요.
7. **트리거**: 번역만 바뀌어도 `updated_at`이 찍힌다(SQL 파일 끝의 선택 수정안).
8. **개인정보처리방침 확인**: 7일 내 답변 약속, 정책 변경 시 구독자 메일 안내 여부, 처리 위치, Cloudflare Web Analytics 사용 여부.

## 6. 검증
- `npm run typecheck`, `npm test`(8건 통과), 변경 파일 eslint(기존 경고 3건만), `npm run build` 성공
- 로컬 `next start` 확인: 404·없는 카테고리·없는 태그는 404, robots 메타 1개, 광고 스크립트 없음. `/tag/Node.js` 200(noindex,follow). 홈·색인 글은 광고 스크립트 1개(HTML+RSC 페이로드). noindex 글·검색·북마크·privacy·구독·수신거부에는 없음. 시리즈 hreflang 출력. `/api/unsubscribe?email=` → 303 `/unsubscribe?legacy=1`. 잘못된 토큰 POST → 400. sitemap `Cache-Control: max-age=0, must-revalidate`
- 로컬에는 `ADSENSE_PUBLISHER_ID`가 없어 `/ads.txt`가 404로 나온다. 운영은 정상이고 이 PR은 이 파일을 바꾸지 않았다.
