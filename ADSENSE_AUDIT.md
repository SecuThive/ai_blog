# Nodelog (thivelab.com) — AdSense·검색 품질 전면 감사 보고서

감사일: 2026-07-03 ~ 07-06 · 대상: 발행 글 540편 + 가이드 135편 + 전체 라우트 910 URL

---

## 1. 발견한 문제와 조치

| # | 문제 | 심각도 | 조치 | 상태 |
|---|---|---|---|---|
| 1 | 개인정보처리방침 허위 기재 — "개인 식별 정보 미수집"이라 했으나 실제로 댓글(이름·IP해시)·문의폼(이름·이메일·소속) 수집 | **Critical** | 방침 1·2·3·4항 실제 동작 기준 재작성 (Supabase·Resend·GA 위탁 명시, 국외 이전 고지) | ✅ 수정 |
| 2 | 확인 불가능한 1인칭 경험 서술 14곳 ("제가 겪은 90%", "저희 팀에서는" 등) | **High** | 14편 전부 객관적 표현으로 교체, 백업 보관 | ✅ 수정 |
| 3 | 검증 불가 통계 노출 — "4,128 SOURCES", "96.2% nominal", 방침 페이지 과장 claim | **High** | 홈·author·정책 페이지에서 제거/실데이터(DB 자동계산) 교체, 원칙 문구를 실제 운영과 일치하게 완화 | ✅ 수정 |
| 4 | 글 페이지 H1 2개 (본문 markdown `#`이 527편에 존재) | **High** | 렌더러에서 markdown h1→h2 강등 (DB 무수정 일괄 해결) | ✅ 수정 |
| 5 | 저품질(일반론·코드/출처 없음) 글 13편 색인 중 | **High** | 품질 점수 45점 미만 → noindex,follow + sitemap 제외. 보강 후 재색인 (`src/lib/noindexPosts.ts`) | ✅ 수정 |
| 6 | 검색 결과·저장 목록 페이지 색인 가능 상태 | **Medium** | /search, /bookmarks noindex,follow + 고유 title | ✅ 수정 |
| 7 | sitemap lastmod가 매 생성 시 현재 시각 (태그·시리즈·카테고리·정적) | **Medium** | 해당 목록의 실제 최신 글 발행일 반영 | ✅ 수정 |
| 8 | 공식 1차 출처 링크가 5/540편에만 존재 | **Medium** | ①글 하단 "관련 공식 문서" 자동 연결(주제→공식 문서 매핑, `src/lib/officialDocs.ts`) ②신규 글 템플릿에 1차 출처 의무화 | ✅ 부분해결 + 지속과제 |
| 9 | JSON-LD author가 가공 인명(Person "Content Reviewer") | **Medium** | author/editor를 Organization "Nodelog 편집팀"(→/author)으로 정정 | ✅ 수정 |
| 10 | ads.txt 하드코딩 | **Medium** | 환경변수 기반 동적 생성 (`ADSENSE_PUBLISHER_ID` → `NEXT_PUBLIC_ADSENSE_ID` 폴백, 미설정 시 404) | ✅ 수정 |
| 11 | 저가치 페이지(검색·법적고지·문의 등) 광고 로드 | **Medium** | 경로 제외 컴포넌트(`AdSenseScript.tsx`) 구현. **단, 승인 완료까지는 소유 확인을 위해 전역 로드 유지**(운영자 결정) — 승인 후 활성화 | ⏸ 승인 후 적용 |
| 12 | 브랜드 표기 혼용 (Nodelog vs Thivelab) | **Low** | privacy/policy 페이지 Nodelog로 통일 (운영 도메인 표기는 "Nodelog(thivelab.com)") | ✅ 수정 |
| 13 | 카테고리 페이지가 단순 글 목록 | **Low** | 소개·대상 독자·읽기 순서·많이 읽은 글(실데이터) 추가 | ✅ 수정 |
| 14 | 존재 확인 안 되는 privacy@thivelab.com 안내 | **Low** | 실제 운영 메일(thive8564@gmail.com)로 교체 | ✅ 수정 |
| 15 | 잘못된 태그 데이터 (한 문자열에 다중 `#해시태그`, 2편) | **Low** | 개별 태그로 분리 | ✅ 수정 |

### 이전 세션에서 이미 해결된 항목
- 중복(카니벌라이제이션) 12쌍 정리 + 구 URL 308 리다이렉트 + 발행 API 중복 가드(유사도≥0.5 자동 draft 보류)
- robots.txt Cloudflare 충돌 해소, thin 시리즈/태그 sitemap 제외, canonical 인코딩, /blog 308

## 2. 크롤 감사 결과 (910 URL 전수)

| 지표 | 결과 |
|---|---|
| 사이트맵 URL 상태 | **910/910 전부 200** (404·500·리다이렉트 0) |
| 내부 링크 404 | **0** (`/cdn-cgi/l/email-protection`은 Cloudflare 이메일 보호 아티팩트 — 브라우저 정상) |
| canonical 불일치 | **0** |
| 중복 title | 1건(기본 title 공유 4페이지) → 고유 title 부여로 해소 |
| H1≠1 | 505페이지 → markdown h1 강등으로 해소 |
| 구조화 데이터 | **910/910 JSON-LD 존재** |
| 호스트 통일 | http→https 308, non-www→www 301 (대표: `https://www.thivelab.com`) ✅ |
| legacy `/post/*` | 코드·이력에 존재하지 않음 → 진짜 404 반환 (조치 불필요) |

## 3. 콘텐츠 품질 (CONTENT_AUDIT.csv, 540편)

- 점수 분포: **85+ 2 / 70–84 140 / 58–69 203 / 45–57 186 / 45미만 13** (평균 62)
- 45점 미만 13편 → **noindex + 재작성 후보** (CSV `조치` 열 참조)
- 45–57점 186편 → 순차 보강 대상 (공식 출처·코드 예시·검증 환경 추가)
- 허위 경험 표현 0 (14곳 교체 완료) · 중복 제목 0 · 빈/초단문 글 0

## 4. 색인 제어 현황

- noindex: /search, /bookmarks, thin 태그·시리즈, 저품질 13편 (모두 sitemap 제외와 일관)
- sitemap: 실데이터 자동 생성, lastmod 실제 발행일, 200·indexable URL만 포함
- robots.txt: 앱 단일 소스, Googlebot 전체 허용, sitemap 명시

## 5. 사람이 추가로 확인할 항목 (코드로 해결 불가)

1. **외부 글 생성 파이프라인 프롬프트 갱신** — `docs/CONTENT_TEMPLATE.md`의 13단계 템플릿·금지 표현·태그 규칙 반영 (특히 본문 `#` H1 금지, 1차 출처 필수)
2. **45–57점 186편 순차 보강** — CSV 하위 순으로 공식 출처·재현 절차 추가. 13편 noindex 글은 보강 후 `src/lib/noindexPosts.ts`에서 제거해 재색인
3. **EEA/UK/스위스 광고** — 승인 후 AdSense "Privacy & messaging"에서 CMP 활성화하거나 해당 지역 광고 미게재 선택
4. **승인 완료 후** — `AdSenseScript` 경로 게이팅으로 전환(레이아웃 head의 전역 스크립트 → 컴포넌트), 저가치 페이지 광고 제외 적용
5. **Vercel 환경변수** — `ADSENSE_PUBLISHER_ID`(pub-…) 추가 권장 (현재는 `NEXT_PUBLIC_ADSENSE_ID` 폴백으로 동작)
6. **제휴 링크** — 현재 콘텐츠에 제휴 링크 없음. 도입 시 `rel="sponsored nofollow"` + 본문 상단 고지 필수
7. **정정 이력** — 오류 제보로 정정한 글은 본문 상단에 정정 사실·일자 표기 (현재 케이스 0)

## 6. 애드센스 신청 전 최종 체크리스트

- [x] 모든 공개 페이지 200 + 크롤 가능 (910/910)
- [x] 내부 링크 404 = 0
- [x] 구 URL 처리 — 중복 정리분 308, 미존재 경로 진짜 404
- [x] sitemap에 404·리다이렉트·noindex URL 없음
- [x] robots.txt·ads.txt·개인정보처리방침·이용약관·문의 채널 존재
- [x] 방침이 실제 수집 항목(댓글·문의·뉴스레터·분석·광고 쿠키)과 일치
- [x] 모든 글에 작성 주체(AI 초안)·검토(사람 편집)·발행일·제보 채널 표기
- [x] 확인 불가능한 경험·통계 표현 0
- [x] 저품질 글 색인 제외 (13편 noindex, 보강 후 재색인 계획)
- [x] 홈·About·Author 통계 = DB 실데이터 자동 계산
- [x] 구조화 데이터: WebSite·Organization·NewsArticle·BreadcrumbList·CollectionPage — 허위 평점/조회수 없음
- [x] 프로덕션 빌드 정상 (757페이지, exit 0)
- [ ] (승인 후) 저가치 페이지 광고 게이팅 활성화
- [ ] (승인 후) EEA CMP 결정

> 주의: 본 감사는 정책 요건 충족을 확인한 것이며, 애드센스 승인은 Google의 재량 심사로 보장되지 않습니다.
