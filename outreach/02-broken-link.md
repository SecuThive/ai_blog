# 02 — 깨진 링크 대체 제안 (broken link building)

**조사일: 2026-07-20** · **실행 금지 — 운영자 승인 후 PR 제출.**

## 조사 방법과 신뢰도

- 국내 큐레이션 목록 4곳에서 **아웃바운드 링크 1,518개**를 추출해 전수 `curl` 검사
- **403/429는 죽음으로 세지 않았다** (봇 차단·레이트리밋일 뿐) — 과대 보고를 막기 위한 조치
- DNS 실패는 **Cloudflare DoH + Google DNS 두 리졸버로 교차 확인**
- 아래 모든 깨짐·행 번호·대체 URL은 **이 저장소에서 재검증 완료** (2026-07-20)

---

## 대상 저장소 — `Integerous/goQuality-dev-contents`

| 항목 | 값 |
| --- | --- |
| URL | https://github.com/Integerous/goQuality-dev-contents |
| 규모 | **★10,070** · fork 1,389 |
| 상태 | archived=**false** · branch `master` · 최근 push 2025-08-26 |
| 수용성 | ✅ **검증됨** — PR #230 *"접근 불가능한 링크 삭제 및 수정"* 이 **2025-01-29 병합됨.** 깨진 링크 수정은 이 저장소에서 이미 인정된 기여 유형이다 |

> ⚠️ **경로 주의**: 카테고리 README는 전부 **`고퀄리티 컨텐츠 모음/`** 하위에 있다. 이 상위 폴더를 빼면 파일을 못 찾는다.

---

## 강한 주제 적합 — 7건 (전부 실측 검증)

| # | 호스트 파일 : 행 | 깨진 링크 | 검증 결과 | 앵커 텍스트 | 대체 제안 (전부 **200 확인**) |
| --- | --- | --- | --- | --- | --- |
| 1 | `고퀄리티 컨텐츠 모음/8. 인프라 & DevOps/README.md` **:41** | `futurecreator.github.io/2018/11/16/docker-container-basics/` | **404** (futurecreator.cloud로 이전하며 URL 구조 붕괴) | Docker 기초 확실히 다지기 | `/engineer/docker-compose-practical-guide` |
| 2 | `고퀄리티 컨텐츠 모음/15. 도구/README.md` **:33** | `johngrib.github.io/wiki/vim-auto-completion/` | **404** | Vim 자동완성 기능 사용하기 | `/engineer/vim-practical-guide` |
| 3 | `README.md` **:917** | `ilcm96.me/2020-09-13-docker-multi-stage-build-upx` | **DNS 실패** (NXDOMAIN, 두 리졸버 모두) | 가벼운 Golang 이미지 만들기 | `/engineer/docker-multi-stage-build` ⭐ **주제 정확 일치** |
| 4 | `README.md` **:821** | `blog.drakejin.me/Docker-araboza-1/` | **DNS 실패** (NXDOMAIN, 두 리졸버) | Docker에 대해 알아보자(이론편) | `/engineer/docker-networking` |
| 5 | `README.md` **:311** | `xlffm3.github.io/database/service-performance-with-optimizer/` | **404** | 서비스 성능 개선 : MySQL Optimizer 실행 계획 분석 | `/engineer/database-slow-query-analysis` |
| 6 | `README.md` **:361** | `blog.lulab.net/database/optimize-pagination-sql-by-join-instead-of-limit/` | SSL 인증서 불일치 + HTTP **404** | Pagination을 위한 최적화 SQL (Limit vs Join) | `/engineer/postgresql-index-optimization` |
| 7 | `README.md` **:1073** | `smartstudio.tech/custom-github-actions/` | SSL 불일치 + **WordPress.com 만료 안내 페이지** ("plan or domain may have expired") | Custom GitHub Actions 만들어 보기 | `/engineer/github-actions-cicd` |

### 도메인 포렌식
`ilcm96.me` · `blog.drakejin.me` — whois상 **등록은 살아 있으나 A 레코드가 없다.** 등록만 되고 호스팅이 없는 상태라 **자연 복구될 가능성이 없다.** 삭제·대체를 제안해도 안전하다.

### 보조 대상 — `jacking75/NewbieGameServerProgrammerLearningMaterials` (★209, 활성 2026-06)

| 호스트 | 깨진 링크 | 검증 | 앵커 | 대체 |
| --- | --- | --- | --- | --- |
| `README.md:206` | `www.redisgate.com/redis/command/latency.php` | **404** (사이트 루트는 200 — 페이지 단위 소실) | 레디스 게이트 — 기능 설명 | `/engineer/redis-basics-practical-guide` |

---

## 약한 적합 — 제안하지 않는다 (정직성 확보용 기록)

깨진 것은 맞지만 **Nodelog로 대체하면 억지**다. PR에서는 **대체가 아니라 삭제 또는 제3자 콘텐츠**로 처리한다.

| 깨진 링크 | 검증 | 왜 약한가 |
| --- | --- | --- |
| `blog.wonizz.tk/.../certified-kubernetes-administrator/` | DNS NXDOMAIN | CKA 취득 후기 — Nodelog에 자격증 준비 콘텐츠가 없다 |
| `donghoon-khan.github.io/.../deploy-spring-boot-application-on-kubernetes/` | 404 | Spring 특화 — Nodelog k8s 가이드는 프레임워크 중립 |
| `futurecreator.github.io/2018/11/09/it-infrastructure-basics/` | 404 | 범위가 너무 넓다 — 정직하게 대응되는 단일 가이드가 없다 |

---

## ⚠️ PR 작성 전 반드시 읽을 것 — 거절 리스크

이 저장소의 수록 기준은 **"AI가 쉽게 제공할 수 있는 컨텐츠(공식 문서 내용, 프레임워크 문법 설명 등)"를 명시적으로 배제**한다.

→ Nodelog 가이드 중 **레퍼런스·문법 나열처럼 읽히는 글은 거절될 가능성이 높다.**
→ **실제 장애 증상 → 진단 경로 → 해결**의 운영 경험이 앞에 나오는 글만 제안하고, PR 본문에 그 점을 명시한다.
→ AI 초안 사용 사실을 숨기지 않는다. 숨겼다가 나중에 드러나 통째로 되돌려지는 쪽이 훨씬 손해다.

## 제출 전략 — "링크 심기"가 아니라 "링크 정비"로 보이게

**한 건의 PR로 묶고, 약한 적합 3건까지 포함해 전부 정리한다.**

- ❌ 깨진 링크 7개를 전부 thivelab.com 한 도메인으로 바꾸는 PR → **링크 심기(link-dropping)로 읽힌다**
- ✅ 깨진 링크 11개를 정리하면서 그중 7개에 Nodelog를 인용하고, 나머지는 **삭제하거나 제3자 콘텐츠로 대체** → **유지보수로 읽힌다**

병합된 PR #230의 제목 형식(`접근 불가능한 링크 삭제 및 수정 (...)`)을 그대로 따른다.

**카테고리 README(1·2번)를 PR 설명 맨 앞에 세운다.** 루트 README의 "Queue"는 임시 보관함이지만, 카테고리 항목은 **큐레이션을 거친 영구 항목**이라 가치가 다르다.

### PR 본문 초안

```
접근 불가능한 링크 삭제 및 수정 (인프라 & DevOps / 도구 / 루트 Queue)

링크 상태를 일괄 점검하다 접속 불가 항목을 발견해 정리했습니다.
2026-07-20 기준으로 전부 직접 확인했고, 403/429(봇 차단·레이트리밋)는 죽은 링크로 세지 않았습니다.

■ 도메인 소멸 (DNS NXDOMAIN — Cloudflare/Google 두 리졸버 확인)
- ilcm96.me — 가벼운 Golang 이미지 만들기
- blog.drakejin.me — Docker에 대해 알아보자(이론편)
  두 도메인 모두 등록은 유지되나 A 레코드가 없어 자연 복구 가능성이 없습니다.

■ 404 / 도메인 만료
- futurecreator.github.io — futurecreator.cloud 이전 과정에서 URL 구조가 바뀌며 소실
- johngrib.github.io/wiki/vim-auto-completion
- xlffm3.github.io — MySQL Optimizer 실행 계획
- blog.lulab.net — Pagination 최적화 SQL (인증서 불일치 + 404)
- smartstudio.tech — WordPress.com 플랜/도메인 만료 안내 페이지 노출

대체 링크는 주제가 실제로 맞는 항목에만 넣었고,
대응되는 글이 없는 항목은 대체하지 않고 삭제했습니다.

일부 항목에 제가 운영하는 Nodelog(https://www.thivelab.com) 글을 넣었습니다.
이해관계가 있어 먼저 밝힙니다. 저장소 기준에 맞지 않는다고 판단하시면
해당 항목만 빼고 삭제 부분만 반영해 주셔도 좋습니다.

Nodelog는 AI로 초안을 만들고 편집자가 명령어·사실관계를 검증해 발행하는 기술 미디어입니다.
공식 문서 요약형 글은 제외하고, 실제 장애 증상과 진단 과정을 다룬 글만 골랐습니다.
```

> 마지막 두 문단이 이 PR의 성패를 가른다. **이해관계를 먼저 밝히고 판단을 유지자에게 넘기는 것**이 유일하게 지속 가능한 방식이다.

---

## 조사에서 배제된 경로 (다음 회차에 반복하지 말 것)

- **`mamu2830.blogspot.com` "마무: 리눅스 독학 사이트"** — 국내 최다 인용 후보였으나 **자기 글에만 링크**한다. 아웃바운드 0 → 기회 없음
- **velog·Tistory 국내 링크 모음글** — 대부분 자동 점검을 봇 차단(403/429)한다. 검증 비용이 크고 도메인 권위도 낮다
- → **결론: 이 채널은 GitHub awesome-list가 정답이다.** 국내 개인 블로그 리소스 페이지는 투자 대비 회수가 안 된다
