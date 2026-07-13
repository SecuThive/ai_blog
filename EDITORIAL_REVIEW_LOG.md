# 편집 검토 로그 (Editorial Review Log)

발행 콘텐츠에 대한 사람 편집자의 검토·수정 이력을 날짜별로 보존한다.
Google AdSense/E-E-A-T 대응 — "AI 초안 + 사람 검토" 신뢰 신호의 내부 근거 기록.
(원문 백업 JSON은 `scripts/*-backup-*.json` 으로 로컬 보존되며 gitignore 대상)

---

## 2026-07-12 — 애드센스 저가치 대응 종합 검토 (검토자: 편집 담당)

색인 후보 규모(약 725 URL) 대비 독창성·1차 출처·진정성을 강화하기 위한 검토 패스.

| 작업 | 대상 | 내용 | 백업 |
|---|---|---|---|
| 가짜 1인칭 경험 서술 중립화 | 28편 / 37문장 | "안녕하세요 ○○ 여러분" 인사말·"저희가 수많은 프로젝트를 거치며" 등 검증 불가 경험 주장 제거·중립화(정보는 보존). #321 미치환 템플릿 `[블로그 회사 이름]` 노출 수정 | `persona-neutralize-backup-2026-07-12.json` |
| 정책 인접 글 발행취소 | #455 | "광고처럼 보이지 않는 수익화"(광고 위장 배치 권장 메타 글) → draft | — |
| 유사제목 통합(카니벌라이제이션) | #622, #589/#778 | #622(kubectl localhost:8080, #768과 동일 에러) draft 통합 / #778 제목 차별화 + #589↔#778 상호링크(재범위화) | `cannibalization-consolidate-backup-2026-07-12.json` |
| 공식 1차 출처 본문 인용 | 89편 | 제목에 도구/표준이 명시된 색인 트러블슈팅 글에 실재 검증된 canonical 공식 문서(kubernetes.io·docs.docker.com·man7.org·redis.io·nginx.org 등) 문맥형 인용 삽입. 개념형 AI 글은 단일 출처 부재로 제외 | `official-sources-backup-2026-07-12.json` |
| 심층 보강 + 색인 복구 | #604, #698, #699 | 고유가치 글(전자금융 망분리 규제 2편 + Kafka Streams)에 법령 1차 출처·의사결정표 추가 → 품질점수 임계(58) 상회로 재색인 | `backup-batch5.json` |
| 색인 프루닝 갱신 | 전체 | 자체 품질점수 <58 프로그래매틱 프루닝 재계산. noindex 196편, 평균 65점 | `CONTENT_AUDIT.csv` |

**검토 원칙(기록용)**: 실제 실행 로그·스크린샷 등 보유하지 않은 근거는 **날조하지 않음**. 편집은 (1) 검증 불가한 저작·경험 주장 제거, (2) 실재하는 1차 출처 인용, (3) 독창적 의사결정 프레임(표·체크리스트) 추가에 한정. 개념형 AI 대량생성 글은 재색인하지 않고 noindex 유지하여 scaled-content 인상을 관리.

## 2026-07-13 — 애드센스 합격 재점검 (검토자: 편집 담당)

전일 작업 라이브 반영 후 종합 재검증. **인프라·sitemap·프루닝 전부 정상 확인**.

| 점검 항목 | 결과 |
|---|---|
| 필수 페이지 8종(about/contact/privacy/terms/policy/author/faq/홈) | 전부 200 ✅ |
| ads.txt / robots / 애드센스 스크립트(ca-pub-2091277631590195) | 라이브 정상 ✅ |
| sitemap | 730 URL(blog 361 + guides 135 + tag 199 + series 18) — **noindex 196편 정상 제외** ✅ |
| 색인 규모 | 발행 557 / 색인 361 / noindex 196(35% 프루닝) |
| 카테고리 편중 | AI&자동화 42%(과거 54~75%→개선), 인프라 29·개발 13·보안 11 |
| 얇은 글(색인, 산문<1500자) | 39편이나 **전부 코드·표 보유 정상 기술글, 진짜 저품질 0편** |
| 잔존 경험서술(색인) | **#98 1편(코드 오탐)만** — 아래 2차 정리로 5편 추가 제거 |

**추가 조치**: 1차 정리에서 '여러분' 인사말 패턴을 놓친 5편(#88·#242·#284·#379·#434) "안녕하세요, ○○ 아키텍트 여러분" 제거. `scripts/neutralize-persona-2.mjs`, 백업 persona-neutralize2-backup-2026-07-13.json.

**종합 판정**: 저가치/scaled-content 리스크가 실질적으로 감소(35% 프루닝 + 진정성 정리 + 독창 프레임·1차출처 보강 + 중복 통합). 인프라는 완전 충족. 남은 상대적 약점 = AI 카테고리 비중 여전히 최대(42%)·유입 저조(→ X/텔레그램 연동으로 개선 중). 신청 가능 상태이나, 1~2주 유입 관찰 후 신청 시 안전마진↑.

### 참고: 재실행 스크립트
- `scripts/score-content-quality.mjs` — 품질점수·noindex 재계산(→ `CONTENT_AUDIT.csv`, `src/lib/noindex-slugs.json`)
- `scripts/neutralize-persona.mjs` — 경험서술 중립화
- `scripts/consolidate-cannibalization-2026-07-12.mjs` — 유사제목 통합
- `scripts/add-official-sources-2026-07-12.mjs` — 공식출처 인용 삽입
- `scripts/enrich/apply.mjs <batchN.json> --apply` — 심층 보강 섹션 삽입
