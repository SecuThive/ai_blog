# BACKLINK_REPORT — Nodelog (thivelab.com)

**최종 갱신: 2026-07-20** · 대상: https://www.thivelab.com · GitHub: https://github.com/SecuThive

---

## 1. 요약 (경영진용 3줄)

1. **외부 백링크는 사실상 0이다.** 21개 쿼리로 조사한 결과 thivelab.com을 언급하거나 링크한 외부 페이지가 단 한 건도 확인되지 않았다.
2. 따라서 이번 회차는 *회수*가 아니라 **기반 구축**이다 — 통제 가능한 자체 자산의 자기링크를 먼저 채우고, 제출 가능한 디렉토리를 확정했다.
3. **다음 회차 최대 병목은 승인이다.** 제3자 저장소 PR과 메일 발송은 준비 완료 상태로 대기 중이며, 운영자 승인 없이는 진행하지 않는다.

---

## 2. 백링크 현황 (2026-07-20 조사)

### 확인된 외부 인바운드 링크: **0건**

| 조사 항목 | 결과 |
| --- | --- |
| 외부 페이지의 브랜드 언급 | **0건** (21개 쿼리, 상세는 `outreach/01-unlinked-mention.md`) |
| 콘텐츠 무단 복제 | **0건** ✅ 본문 문장 검색 시 thivelab.com만 유일 노출 |
| 주요 국내 개발 디렉토리 등재 | **전부 미등재** (awesome-devblog 등 4곳 raw 파일 grep 확인) |
| GSC 링크 리포트 | **데이터 없음** — 저장소 `GSC CSV/`에 링크 리포트 미포함 ⚠️ |

> ⚠️ **가장 중요한 데이터 공백**: `GSC CSV/` 폴더에는 검색 노출·검색어·국가·기기·페이지만 있고 **링크 리포트가 없다.**
> GSC → 링크 → *상위 연결 사이트*를 CSV로 내보내 커밋하면 추측이 아닌 1차 데이터로 관리할 수 있다. **다음 회차 최우선 데이터 작업.**
> (본 리포트의 "0건"은 공개 검색 기반 추정이다. GSC 링크 리포트가 유일한 확정 소스다.)

### 브랜드명이 구조적으로 불리하다 (영구 제약)

- **thrivelab.com** — 미국 호르몬 치료 텔레헬스 기업. 구글이 `thivelab` → `thrivelab`으로 **자동 교정**해 SERP를 통째로 가져간다
- **"노드로그"** — 한국어로 노드(node)+로그(log)로 파싱 → Pino·k8s 노드 로그 글이 걸린다
- **nodelog** — npm 패키지 + 중국 CMS(nodelog.cn)가 선점
- → **브랜드명 기반 언급 감시는 신뢰 불가.** 감시 키는 **고유 글 제목 + 본문 문장**으로 잡는다

### 사이트 기술 상태 (링크를 받을 준비는 되어 있는가) — 전부 정상 ✅

| 항목 | 상태 |
| --- | --- |
| `/`, `/rss`, `/sitemap.xml`, `/about`, `/engineer` | 전부 **HTTP 200** |
| RSS | RSS 2.0, `application/xml`, 최근 50건 |
| robots.txt | 정상. 주요 검색봇 + AI 크롤러 명시 허용, `/api/`·`/admin/` 차단, 사이트맵 선언 |
| naver-site-verification | 존재 (네이버 서치어드바이저 등록됨) |
| 홈 메타 태그 | `<title>` · `og:title` · `description` 전부 일치 ✅ |

**단, 색인 캐시 불일치 1건** ⚠️ — 일부 검색 색인이 홈을 아직 옛 제목 `Thive Lab — Automation Tools & Data Services…`로 표시한다.
라이브 HTML은 정상이므로 **코드 수정 불필요**. GSC URL 검사 → 색인 생성 요청 1회로 해결. 외부 아웃리치 *이전에* 처리 권장.

---

## 3. 이번 회차에 직접 등록 완료한 링크

자체 소유·통제 자산에 한해 실제로 실행한 항목이다. (제3자 대상은 전부 미실행 — 4장 참조)

| # | 자산 | 실행 내용 | 상태 |
| --- | --- | --- | --- |
| 1 | `github.com/SecuThive` 프로필 README | Nodelog 소개 + 본문 링크 5개(홈·engineer·series·rss·about) | ✅ 등록됨 |
| 2 | `github.com/SecuThive/ai_blog` | description + homepage `https://www.thivelab.com` | ✅ 등록됨 |
| 3 | `ai_blog` 저장소 README | 헤더 링크 + 대표 가이드 4건 링크 | ✅ 등록됨 |
| 4 | `ai_blog` 저장소 topics | `devops` `korean` `nextjs` `seo` `supabase` `tech-blog` | ✅ 등록됨 |
| 5 | **`SecuThive/SecuThive` 저장소 homepage 필드** | `https://www.thivelab.com` 신규 설정 | ✅ **이번 회차 실행** |
| 6 | **`SecuThive/SecuThive` 저장소 topics** | `nodelog` `tech-blog` `korean` 신규 설정 | ✅ **이번 회차 실행** |

> 1~4번은 직전 회차(2026-07-20 오전)에 이미 실행된 것을 이번 회차에 **실측 검증**했다. 5~6번이 이번 회차 신규 실행분이다.

### ❌ 실행 못 한 자체 자산 (차단 사유 명시)

| 자산 | 막힌 지점 | 해제 방법 |
| --- | --- | --- |
| **GitHub 프로필 website 필드** (현재 **비어 있음**) | `gh` 토큰 스코프에 `user` 없음 → `PATCH /user` 404 | 운영자가 아래 1줄 실행 후 재시도 (브라우저 인증 필요) |
| **GitHub 프로필 bio** (현재 `null`) | 위와 동일 | 위와 동일 |

```bash
gh auth refresh -h github.com -s user
# 그 뒤:
gh api -X PATCH user \
  -f blog='https://www.thivelab.com' \
  -f bio='Nodelog(노드로그) 운영 — AI 초안에 사람의 검토를 더한 IT·개발·보안 테크 미디어'
```

> 프로필 website 필드는 GitHub 프로필에서 가장 눈에 띄는 링크 자리이고 비용이 0이다. **다음 회차 최우선 실행 항목.**

### 🔴 신규 발견 — 미활용 자체 자산: **safesquare.co.kr**

| 항목 | 내용 |
| --- | --- |
| URL | https://safesquare.co.kr/ (HTTP 200) |
| 제목 | `SAFESQUARE — 검증된 보안 기술, 한 곳에서.` |
| 관계 | 운영자 이메일 도메인(`@safesquare.co.kr`) + SecuThive 저장소 3곳(`SAFESQUARE`, `SSQ_Homepage`, `SF_homepage_kr`) → **운영자 소유·소속 자산으로 판단** (운영자 확인 필요) |
| 현재 상태 | thivelab.com·Nodelog 링크 **0건** |
| 이미 링크 중인 외부 사이트 | everyzone.com, kica.co.kr, nshc.net, pnpsecure.com, bluemoonsoft.co.kr — **파트너 보안업체 5곳** |

**왜 중요한가**: 보안 기업 사이트 → 보안·IT 기술 미디어 링크는 **주제 적합성이 완벽하고**, 이미 외부 링크 5개를 걸고 있어 링크 추가가 자연스럽다. 무엇보다 **운영자가 직접 통제하는 자산**이라 아웃리치가 필요 없다.

**실행하지 않은 이유**: 기업 홈페이지는 대외 노출 자산이고, 이 저장소에서 배포 경로·권한이 확인되지 않았다. 운영자 승인 없이 회사 사이트를 수정하지 않는다.

**제안 문안** (푸터 또는 "관련 사이트" 영역):
```html
<a href="https://www.thivelab.com" rel="noopener">Nodelog — IT·개발·보안 기술 미디어</a>
```

---

## 4. 승인 대기 중인 외부 제출 (미실행)

전부 **실행하지 않았다.** 제3자 저장소·서비스에 SecuThive 이름으로 공개 기록이 남는 작업이라 운영자 승인이 필요하다.
상세 삽입 위치·형식·검증 결과는 `outreach/05-directory-prs-ready.md` 참조.

**2026-07-20 재검증 결과** — 직전 회차 조사 이후 상태 변동 없음, 전부 여전히 유효:

| # | 대상 | 재검증 | 상태 |
| --- | --- | --- | --- |
| PR-1 ⭐ | **awesome-devblog** (★3,586, 활성, push 2026-06-06) | `db_community.yml` raw grep → `thivelab`/`Nodelog` **0건**. 삽입 앵커 `- name: NodeMCU 사용자 모임` **1698행에 그대로 존재** ✅ | 승인 대기 |
| PR-2 | elky84/awesome-blogs (★6, push 2024-03-06) | 저장소 정체, 라이브 서비스는 가동 | 승인 대기 |
| PR-3 | mabyoungg/awesome-korean-tech-blogs (★1, push 2026-07-13) | 활성 | PR-1 이후 판단 |
| PR-4 | maczniak/awesome-korean-techblog (★23, push 2026-01-28) | 활성 | PR-1 이후 판단 |
| 5 | DevHub `dev-hub.dev/blog/feeds` | HTTP **200** ✅ | 메일 초안 완료, 발송 대기 |
| 6 | ooh.directory `/suggest/` | HTTP **200** ✅ | 폼 입력값 확정, 제출 대기 |
| 7 | GeekNews `news.hada.io/new` | HTTP **200** ✅ | **계정 생성 후 1주 대기 필요 → 지금 계정만 만들어 시계를 돌릴 것** |
| 8 | daily.dev | HTTP **200** ✅ | 거절 가능성 있음 |
| 9 | Feedspot | HTTP **403** (봇 차단, 서비스는 정상) | 무료 티어만, 최후순위 |
| 10 | 요즘IT 기고 | HTTP **200** ✅ | 원고 1편 필요, 최고 권위 |

> **왜 PR-1이 1순위인가**: 경쟁사 **44BITS**와 **요즘IT**가 바로 이 파일에 등재돼 있는데 Nodelog만 없다.

### 🆕 이번 회차 신규 발굴 (05 문서에 없던 기회)

| # | 대상 | 검증 | 상태 |
| --- | --- | --- | --- |
| **PR-5** | **awesome-feeds** https://github.com/DongjunLee/awesome-feeds (★41, 활성, `master`) | raw grep: `44bits` 1건 · `yozm` 1건 · **`thivelab` 0건** ✅ | 승인 대기 |
| **PR-6** ⭐ | **깨진 링크 정비 PR** → `Integerous/goQuality-dev-contents` (**★10,070**, 활성) | 깨진 링크 **8건 실측 확인** + 대체 URL 8개 전부 **200 확인** + 삽입 행 번호까지 검증 | 승인 대기 · 상세 `outreach/02-broken-link.md` |
| **재검토** | **디스콰이엇** disquiet.io | 05 문서는 *"미디어 부적합"*으로 제외했으나, **요즘IT가 실제 제품 등록 + 아웃바운드 링크 확인** → 제외 근거 무너짐 | 재검토 대상 |

**PR-6이 특히 유망한 이유**: 대상 저장소는 ★10,070이고, *"접근 불가능한 링크 삭제 및 수정"* PR #230이 **2025-01-29 병합된 전례**가 있다. 깨진 링크 수정은 이미 인정된 기여 유형이다.
⚠️ 단, 이 저장소는 **"AI가 쉽게 제공할 수 있는 컨텐츠"를 명시적으로 배제**한다. 이해관계를 먼저 밝히고 운영 경험 중심 글만 제안해야 한다.

### 🔧 선행 조건 — 피드 경로 별칭 (제출 전 반드시 배포)

실측 결과 **`/rss`만 200이고 `/rss.xml` · `/feed` · `/feed.xml` · `/atom.xml`은 전부 404**였다.
디렉토리·애그리게이터·RSS 리더 상당수가 `/rss.xml`이나 `/feed`를 관례적으로 먼저 조회하므로, 별칭이 없으면 **제출처에서 "피드 없음"으로 판정돼 등재가 막힐 수 있다.**

→ `next.config.ts`에 4개 경로 → `/rss` **308 영구 리다이렉트를 추가했다** (`npx tsc --noEmit` 통과).
→ ⚠️ **커밋·배포하지 않았다. 프로덕션은 여전히 404다.** RSS를 요구하는 제출(PR-1·PR-2·PR-5·DevHub)보다 **먼저 배포**되어야 한다.

---

## 5. 다음 회차 액션 아이템

우선순위 순. 앞의 3개는 승인이 필요 없거나 1줄이면 끝난다.

| 순위 | 액션 | 승인 필요 | 비용 |
| --- | --- | --- | --- |
| 1 | **피드 별칭 커밋 + 배포** (`next.config.ts` 수정 완료) — **모든 RSS 제출의 선행 조건** | ❌ | 5분 |
| 2 | **GSC 링크 리포트 내보내기** → `GSC CSV/링크.csv` 커밋. 현황 "0건"을 실데이터로 확정 | ❌ | 5분 |
| 3 | **GitHub 프로필 website·bio 설정** (`gh auth refresh -s user` 후 위 명령) | ❌ | 2분 |
| 4 | **GSC 홈 URL 재색인 요청** — 옛 `Thive Lab` 제목 캐시 정리 | ❌ | 2분 |
| 5 | **GeekNews 계정 생성** — 1주 대기 시계를 지금 시작 (제출은 나중) | ❌ | 5분 |
| 6 | **safesquare.co.kr에 Nodelog 링크 추가** | ✅ 운영자 | — |
| 7 | **PR-1 awesome-devblog 실행** — 디렉토리 중 단독 최대 가치 | ✅ 운영자 | — |
| 8 | **PR-6 깨진 링크 정비** (★10,070 저장소) — 이번 회차 최대 신규 기회 | ✅ 운영자 | — |
| 9 | PR-5 awesome-feeds → PR-2 → DevHub 메일 → ooh.directory 폼 | ✅ 운영자 | — |
| 10 | **"인용될 자산" 1건 기획** — 실측 벤치마크/비교표 (아래) | ❌ | 중 |
| 11 | 디스콰이엇 등록 재검토 · PR-1 결과 확인 후 PR-3·4 판단 | ✅ 운영자 | — |

### 8번 부연 — 링크를 *부르는* 콘텐츠

트러블슈팅 가이드는 읽히고 잊힌다. 링크되는 건 **직접 측정한 숫자**다. 현재 Nodelog에는 이 유형이 없다.

- PgBouncer transaction vs session 모드 **실측 벤치마크** (재현 가능한 방법론 포함)
- 배포판·systemd 버전별 기본 `LimitNOFILE` **비교표**

> 사람들은 *다시 측정하기 싫은 숫자*에 링크를 건다.

---

## 6. 준수 사항

이번 회차에서 아래를 **일절 하지 않았다**: 유료 링크 구매, PBN, 자동 댓글·포럼 스팸, 대량 자동 제출.
외부 대상 메일·DM은 **전부 초안 상태로만** 저장했고 발송하지 않았다. 실제 등록은 **자체 소유 자산에만** 수행했다.

## 7. 관련 문서

| 파일 | 내용 |
| --- | --- |
| `outreach/01-unlinked-mention.md` | 언급 조사 전량 기록·감시 체계 (결론: 0건) |
| `outreach/02-broken-link.md` | 깨진 링크 대체 제안 |
| `outreach/03-guest-post.md` | 요즘IT 기고·GeekNews·오픈소스 기여 |
| `outreach/04-directory-submission.md` | 디렉토리 제출용 표준 문구 |
| `outreach/05-directory-prs-ready.md` | PR·제출 실행 준비 완료본 |
| `outreach/06-directory-email.md` | 디렉토리 등록 요청 메일 초안 |
| `outreach/07-competitor-gap.md` | 경쟁사 링크 채널 비교·격차 |
