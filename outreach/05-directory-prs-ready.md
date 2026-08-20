# 05 — 제출 준비 완료된 디렉토리 등록 (승인 대기)

여기 적힌 PR·제출은 **아직 실행하지 않았다.** 제3자 저장소·서비스에 우리 GitHub 계정(SecuThive) 이름으로 공개 기록이 남는 작업이라 운영자 승인 후 실행한다.
승인하면 바로 실행 가능하도록 삽입 위치·형식·검증 결과를 확정해 두었다.

**공통 검증 (2026-07-20)**
- `https://www.thivelab.com/rss` → HTTP 200, `application/xml`, RSS 2.0, item 50건 ✅
- 아래 모든 목록에서 `thivelab` / `Nodelog` 검색 → **전부 미등재** ✅

---

## PR-1. awesome-devblog ⭐ 최우선

| 항목 | 값 |
| --- | --- |
| 저장소 | https://github.com/awesome-devblog/awesome-devblog |
| 규모 | ★3,586 · archived=false · 최근 push 2026-06-06 |
| 파일 | `db_community.yml` |
| 방식 | PR (GitHub 계정 필요) |
| 렌더링 사이트 | https://awesome-devblog.netlify.app/ |

**왜 1순위인가**: 경쟁사 **44BITS**와 **요즘IT**가 바로 이 파일에 등재돼 있는데 Nodelog만 없다. 최근 병합 PR #900(2026-06-06), #899·#897(2026-05-19)로 유지보수 활발.
개인 실명 블로그는 `db.yml`(2,333건)로 분리돼 있으므로 미디어인 우리는 `db_community.yml`이 맞다.

**CONTRIBUTING.md 요건 충족**
- [x] 이름순 정렬 위치에 추가
- [x] 블로그 + RSS 동시 등록
- [x] 이메일 미등록
- [x] 반영까지 최소 이틀 대기

### 삽입 위치
`- name: NHN TOAST UI` 블록 끝과 `- name: NodeMCU 사용자 모임` 사이.

```diff
   rocketpunch: https://www.rocketpunch.com/companies/nhn
+- name: Nodelog
+  blog: https://www.thivelab.com/
+  rss: https://www.thivelab.com/rss
+  github: https://github.com/SecuThive
 - name: NodeMCU 사용자 모임
   facebook: https://www.facebook.com/groups/1984960828444627/
```

> `description:` 필드는 이 파일 전체 1,986행 중 14곳에서만 쓰인다(44BITS·요즘IT 모두 없음). 다수 스타일에 맞춰 **넣지 않는다.**
>
> 파일이 자주 갱신되므로 실행 시점에 `main`을 다시 받아 행 번호가 아닌 **앵커 문자열**(`- name: NodeMCU 사용자 모임`) 기준으로 삽입할 것.

**PR 제목**: `Nodelog 추가`

**PR 본문**
```
db_community.yml에 Nodelog를 추가합니다.

- 블로그: https://www.thivelab.com/
- RSS: https://www.thivelab.com/rss (RSS 2.0, 최근 글 50건)

IT·개발·보안 실무자를 위한 기술 미디어입니다.
공식 문서와 표준 문서를 근거로 초안을 작성하고, 편집자가 사실관계와 명령어를 검증한 뒤 발행합니다.
리눅스·쿠버네티스·DB·보안 트러블슈팅 엔지니어 가이드와 주제별 시리즈를 운영합니다.

CONTRIBUTING.md 기준으로 이름순 위치(NHN TOAST UI와 NodeMCU 사용자 모임 사이)에 넣었고, RSS도 함께 등록했습니다.
```

---

## PR-2. elky84/awesome-blogs (어썸블로그 RSS 슈퍼피드)

| 항목 | 값 |
| --- | --- |
| 저장소 | https://github.com/elky84/awesome-blogs (branch `master`) |
| 파일 | `config/feeds.yml` |
| 라이브 서비스 | https://awesomeblogs.jeho.page/ |
| 상태 | archived=false, 다만 ★6 · 최근 push 2024-03-06 (저장소는 정체, 서비스는 가동 중) |

`production: &production` → `dev:` 그룹 아래에 **가나다순** 삽입. 들여쓰기 4칸, Ruby 심볼 키.

```yaml
    - :author_name: Nodelog
      :feed_url: https://www.thivelab.com/rss
```

**리스크**: 저장소가 2년 넘게 정체라 병합이 안 될 수 있다. PR을 열되 응답 없으면 라이브 서비스 쪽으로 별도 문의.

---

## PR-3·4. 기업 기술 블로그 목록 (적합도 중간 — 판단 필요)

두 목록 모두 활성이고 미등재지만, **명시적으로 "기업 기술 블로그" 목록**이다. Nodelog는 사내 엔지니어링 블로그가 아니라 미디어라 유지보수자가 범위 밖으로 볼 수 있다.
→ PR-1 병합으로 선례를 만든 뒤 시도하고, 본문에서 "미디어"임을 숨기지 말고 밝힌 채 판단을 맡길 것. 거절당해도 정상.

**PR-3. mabyoungg/awesome-korean-tech-blogs** (★1, push 2026-07-13, PR 적극 수용, 표 자동 정렬 Action 있음)
- 파일 `README.md`, `## 국내 기업 기술 블로그` 표
- 형식: `| Nodelog | https://www.thivelab.com/ |  |`
- 커밋 메시지: `docs: Nodelog 기술 블로그 추가`
- 가이드: https://github.com/mabyoungg/awesome-korean-tech-blogs/blob/main/CONTRIBUTING.md

**PR-4. maczniak/awesome-korean-techblog** (★23, branch `master`, push 2026-01-28)
- 파일 `README.md`, `## 기업 블로그 (Corporate Blog)` 섹션, 가나다순
- 형식: `* [Nodelog](https://www.thivelab.com/) (Nodelog, SecuThive)`

---

## 비-PR 제출처

| # | 대상 | 방식 | 비고 |
| --- | --- | --- | --- |
| 5 | **DevHub** https://dev-hub.dev/blog/feeds | 이메일 (`writer0713@naver.com`, 문의 페이지에 난독화 게시) | 계정 불필요. 등록 원하는 URL 명시 요청. 초안은 `06-directory-email.md` |
| 6 | **ooh.directory** https://ooh.directory/suggest/ | 웹 폼 (계정 불필요) | 국제 큐레이션 디렉토리. Technology 카테고리. 반영까지 오래 걸림 |
| 7 | **GeekNews** https://news.hada.io/new | 계정 + **가입 후 1주 대기** | 디렉토리 아님, 글 단위 제출. 44BITS의 최다 채널. **가이드라인상 한 출처를 반복 유통하면 안 되므로 정말 좋은 글만 드물게.** 계정은 지금 만들어 1주 시계를 돌려둘 것 |
| 8 | **daily.dev** https://docs.daily.dev/docs/for-content-creators/suggest-new-source | 계정 + 심사 최대 30일 | 문서상 "corporate and personal blogs 제외" — 거절 가능성 있음 |
| 9 | **Feedspot** https://www.feedspot.com/publisher | 계정 + 심사 | 무료 등재는 실재하나 유료 업셀 퍼널이 강함. **무료 티어만**, 맨 마지막에 |
| 10 | **요즘IT** `yozm_help@wishket.com` | 기고 제안 | 디렉토리가 아니라 편집 매체. 이 목록 중 최고 권위 링크지만 원고 1편이 필요. 초안은 `03-guest-post.md` |

---

## 제출하지 않기로 한 곳

| 후보 | 제외 사유 |
| --- | --- |
| **seonggwonyoon/techblog** | **archived=true (2023-11-20)** — 읽기 전용, PR 불가. ★379로 매력적이나 경로 없음 |
| **jthcast/techblogposts** | **archived=true (2025-06-09)** — 사이트는 살아 있으나 제출 경로 없음 |
| **codenary.co.kr** | 도메인 DNS 해석 실패, 서비스 종료 |
| **seongkyu-lim/TechBlogs** | archived |
| **Kagi Small Web** | 영어 전용 + 1인 개인 블로그 + 광고 없음 + LLM 생성 콘텐츠 금지 → 최소 3개 조건 불충족 |
| **Blogarama** | "do-follow DR75 링크" 유료 판매 = 유료 링크 스킴. **금지 조건에 정면 위배** |
| **Alltop** | AI 큐레이션 뉴스로 전환, 발행처 제출 경로 폐지 |
| **indieblog.page** | IndieWeb 개인 블로그 발굴 목적. AI 보조 미디어는 부적합 |
| **disquiet.io** | 제품 등록 서비스, 미디어 부적합 |
| **devday.kr** | 관련성은 높으나 제출 폼·이메일·저장소 어느 것도 공개돼 있지 않음. 경로 발견 시 재검토 |
| **taptorestart gist** | 대기업 블로그 9개짜리 개인 메모, 댓글 비활성 |

---

## 실행 순서 (승인 시)

1. **PR-1 awesome-devblog** — 단독으로 가장 가치 큼
2. **GeekNews 계정 생성** — 1주 대기 시계를 지금 시작
3. PR-2 → 5(DevHub 메일) → 6(ooh.directory)
4. PR-1 결과 확인 후 PR-3·4 판단
5. 8 → 9 → 10(요즘IT 기고)은 장기
