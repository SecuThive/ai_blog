# 01 — 언급은 있으나 링크가 없는 페이지 (unlinked mention)

**조사일: 2026-07-20 · 결론: 회수할 언급이 0건이다.**

이 파일은 원래 "언급됐는데 링크가 없는 페이지에 링크를 요청하는" 아웃리치 초안을 담을 자리다.
그런데 21개 쿼리로 조사한 결과 **thivelab.com 자체 페이지를 제외하면 Nodelog를 언급한 외부 페이지가 단 한 건도 없다.** 없는 언급은 회수할 수 없으므로, 이 회차에서는 메일 초안 대신 **조사 범위 기록 + 감시 체계 + 언급을 만들어내는 경로**를 남긴다.

---

## 조사 범위 (재현 가능하도록 쿼리 전량 기록)

향후 회차에서 같은 쿼리를 다시 돌려 **증분**만 보면 된다.

```
1  "노드로그" 블로그 리눅스
2  "thivelab"
3  "thivelab.com" 노드로그
4  "thivelab.com" -site:thivelab.com          ← 분기별 재실행 대상
5  site:velog.io "thivelab"
6  site:tistory.com "노드로그"
7  "Nodelog" 노드로그 기술 블로그 쿠버네티스
8  "Nodelog" Korean tech blog thivelab Linux Kubernetes cited
9  노드로그 Nodelog 테크 미디어 thivelab 소개
10 "노드로그" 개발자 사이트 추천
11 "노드로그" 출처 인용
12 "노드로그" -"노드" site:reddit.com OR site:x.com OR site:twitter.com
13 "노드로그" site:okky.kr OR site:disquiet.io OR site:brunch.co.kr OR site:inflearn.com
14 "노드로그" site:blog.naver.com OR site:cafe.naver.com OR site:medium.com
15 news.hada.io thivelab OR 노드로그
16 "SecuThive" github
17 "Too many open files" ulimit 파일 디스크립터 한계 해결 -thivelab.com
18 "PgBouncer 연결 풀링" "PostgreSQL 성능 최적화"
19 "nmap 포트 스캔" "서버 보안 점검 실전 가이드"
20 "DNS 해석 오류 진단" nslookup dig systemd-resolved 노드로그
21 (본문 문장 그대로 검색 — 도용 탐지 겸용)
   "fd 수가 계속 증가하면 애플리케이션 코드에서 파일"
   "systemd로 관리되는 서비스는 limits.conf가 적용되지 않습니다"
```

### 부수 성과 — 콘텐츠 도용 없음 ✅
17~21번은 **무단 복제 탐지**를 겸한다. 본문 문장 2건을 그대로 검색했을 때 **thivelab.com만 유일하게 나왔다.**
즉 우리 콘텐츠가 출처 표기 없이 긁혀 간 사례가 현재 0건이다. (도용본이 있으면 그건 링크 요청의 가장 강력한 근거가 되므로, 이 검사는 계속 돌린다.)

---

## 왜 브랜드 검색이 구조적으로 불리한가 (중요)

| 충돌원 | 내용 |
| --- | --- |
| **thrivelab.com** | 미국 호르몬 치료 텔레헬스 기업. 자금력 있는 브랜드로 `thivelab` 검색 시 구글이 **`r`을 자동 교정**해 SERP를 통째로 가져간다. thrivelabs.com/.io, Wefunder·Glassdoor 페이지까지 붙는다 |
| **"노드로그"** | 한국어로 노드(node) + 로그(log)로 파싱된다. Pino 로깅, 쿠버네티스 노드 로그, 블록체인 노드 글이 전부 걸린다 |
| **nodelog** | npm 패키지 + 중국 블로그 CMS(nodelog.cn, github.com/nodelog/nodelog)가 이미 선점 |
| **hivelab.co.kr** | 무관한 국내 기업, `thivelab` 쿼리에 함께 노출 |

> **운영 결론**: 브랜드명 기반 언급 감시는 이 사이트에서 **영구적으로 신뢰할 수 없다.**
> 감시 키는 브랜드명이 아니라 **고유한 글 제목 + 본문 문장(위 17~21번)**으로 잡는다.

---

## 같이 발견된 문제 — 색인 속 브랜드 정체성 불일치 ⚠️

검색 결과에서 thivelab.com 홈이 두 가지 제목으로 렌더된다.

| 출처 | 표시되는 제목 |
| --- | --- |
| 라이브 페이지 (2026-07-20 실측) | `Nodelog — IT·개발·보안 테크 미디어` ✅ |
| 일부 검색 색인 캐시 | `Thive Lab — Automation Tools & Data Services for Modern…` ❌ |

**원인 규명 완료 — 코드 문제가 아니다.** 2026-07-20 라이브 HTML을 직접 확인한 결과 태그는 전부 정상이고 서로 일치한다.

```html
<title>Nodelog — IT·개발·보안 테크 미디어</title>
<meta property="og:title" content="Nodelog — IT·개발·보안 테크 미디어"/>
<meta name="description" content="AI 초안과 사람의 편집 검토를 거쳐 발행하는 IT·개발·보안·인프라 실무 미디어."/>
```

즉 `Thive Lab — Automation Tools & Data Services…`는 **사이트 리브랜딩 이전의 낡은 색인 캐시**일 뿐 고칠 코드가 없다.
→ 액션: **GSC에서 홈 URL 재색인 요청(URL 검사 → 색인 생성 요청)** 한 번이면 끝난다. 코드 수정 불필요.
→ 다만 **언급·링크 요청을 보내는데 검색엔진이 우리를 뭐라고 부르는지 합의가 안 된 상태**면 아웃리치 신뢰도가 깎이므로, 외부 아웃리치를 보내기 *전에* 처리하는 편이 좋다.

> 참고: `og:site_name`은 현재 미출력이다. 브랜드 일관성 관점에서 추가를 검토할 만하다(선택).

---

## 감시 체계 (다음 회차부터 이걸 돌린다)

1. **분기 1회** 위 쿼리 4번·21번 재실행 → 신규 언급과 도용을 동시에 탐지
2. **GSC 링크 리포트** 내보내기 → 이게 유일한 1차 데이터다 (아래 참조)
3. Google Alerts `"노드로그"` / `"thivelab"` — 충돌 때문에 노이즈가 많지만 공짜라 걸어둘 것

> ⚠️ 저장소의 `GSC CSV/` 폴더에는 **링크 리포트가 없다** (검색 노출·검색어·국가·기기·페이지만 있음).
> GSC → 링크 → *상위 연결 사이트* 를 CSV로 내보내 `GSC CSV/링크.csv`로 커밋하면, 추측이 아니라 실데이터로 백링크 현황을 관리할 수 있다. **다음 회차 최우선 데이터 작업.**

---

## 언급이 없는 상태에서 언급을 "만들어내는" 경로

없는 언급을 회수하는 대신, 언급될 이유를 만든다. 순서대로.

1. **자체 자산 자기링크부터 회수** — 비용 0, 통제권 100%.
   → 이번 회차 실행분은 `BACKLINK_REPORT.md`의 등록 현황 표 참조.

2. **인용될 만한 것을 낸다 (핵심)**
   트러블슈팅 가이드는 *읽히고 잊힌다*. 인용되는 건 **직접 측정한 숫자와 표**다.
   - PgBouncer transaction vs session 모드 **실측 벤치마크** (재현 가능한 방법론 포함)
   - 배포판·systemd 버전별 기본 `LimitNOFILE` **비교표**
   - 사람들은 *다시 측정하기 싫은 숫자*에 링크를 건다. 현재 Nodelog에는 이 유형의 자산이 없다.

3. **GeekNews 제출** — 국내 인프라 글이 최초 외부 언급을 얻는 가장 현실적인 경로.
   단, 가이드라인상 한 출처 반복 유통 금지 → `03-guest-post.md`의 제약을 반드시 지킬 것.

4. **질문이 발생하는 상류에서 답한다** — OKKY 등에서 바로 그 에러를 겪는 스레드에 **실질적인 답변**을 하고, 정말 관련될 때만 링크. (링크 목적의 답변은 금지 — 그건 스팸이다)

---

## 감시할 근접 표면 (아직 언급 없음, 생길 가능성 있는 곳)

| 표면 | 왜 |
| --- | --- |
| news.hada.io (GeekNews) | 국내 인프라 글이 픽업되는 정규 경로 |
| OKKY | "개발 업계 소식 확인하는 방법" 류 링크 모음글이 주기적으로 올라옴 |
| velog / tistory | 국내 엔지니어가 트러블슈팅 글 하단에 "참고" 목록을 다는 관행. 현재 Nodelog 참조 0건 |
| Kubernetes Korea Group, KCD South Korea / CNCF | 한국어 k8s 트러블슈팅 리소스가 거명될 수 있는 커뮤니티 |

## 경쟁 집합 (우리 글 제목으로 검색 시 함께 뜨는 사이트)

quirky-guy.com · penguin-gym-linux.com · oneuptime.com · labex.io · sarc.io · markruler.github.io

언급 표면은 아니지만 **우리가 이겨야 할 상대**이자, 일부는 게스트·참조 링크를 받는다. `02-broken-link.md`의 후보군과 겹치는지 확인할 것.
