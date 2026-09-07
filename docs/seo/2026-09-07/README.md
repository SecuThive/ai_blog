# 검색 유입 개선 작업 — 2026-09-07

## 범위와 기준

캐시 갱신 장애 수정, 기존 글 5편의 제목·요약·본문 보강, 관련 가이드 2편의 내부 링크 및 SSH 진단 설명 수정. 기존 URL·발행 상태·발행일은 유지한다. 신규 검색 수요로 관찰된 tar.zst·zst, nginx 502, SSH reset, LLM 거버넌스 질문은 기존 글의 범위에 포함되므로 별도 중복 글을 발행하지 않는다.

국가 필터를 적용한 상세 행에는 누락이 있어 전체 방문자 수로 합산하지 않는다. 한국 일자별 합계와 전체 국가 페이지 실적을 구분하고, 한국 검색어 행은 보강 주제를 찾는 근거로 사용했다.

| 한국 검색, 28일 | 클릭 | 노출 | CTR | 평균 순위 |
|---|---:|---:|---:|---:|
| 2026-07-11~2026-08-07 | 242 | 4996 | 4.84% | 10.09 |
| 2026-08-08~2026-09-04 | 304 | 7477 | 4.07% | 8.44 |

## 대상과 변경

아래 페이지 실적은 2026-08-08~09-04, 전체 국가 기준이다.

| 대상 | 클릭 | 노출 | 평균 순위 |
|---|---:|---:|---:|
| [리눅스 압축 해제 명령어: tar.gz·tar.zst·zst·zip·7z](https://www.thivelab.com/engineer/linux-archive-compress-guide) | 13 | 606 | 18.11 |
| [Nginx 502 Bad Gateway 해결: 로그별 원인과 점검 순서](https://www.thivelab.com/engineer/nginx-502-bad-gateway-fix) | 4 | 185 | 11.03 |
| [SSH kex_exchange_identification: Connection reset by peer 원인과 해결](https://www.thivelab.com/blog/ssh-connection-closedreset-by-peer-5분-진단복구-fail2banmaxstartups) | 8 | 365 | 15.53 |
| [LLM AI 보안 및 거버넌스 체크리스트: RAG·도구 권한·출시 점검](https://www.thivelab.com/blog/필독-llm-에이전트-보안-취약점-분석-및-기업용-ai-거버넌스-프레임워크-구축-가이드) | 0 | 74 | 14.66 |
| [개인정보 위탁 vs 제3자 제공 차이: 동의 필요 여부·사례 비교](https://www.thivelab.com/blog/개인정보-위탁-vs-제3자-제공-차이-동의-또-받아야-할까-2026-가이드) | 16 | 1124 | 8.47 |
| [SSH 접속 오류(Connection refused, Permission denied 등) 해결 가이드](https://www.thivelab.com/engineer/ssh-connection-troubleshoot) | 4 | 137 | 11.08 |
| [logrotate 완전 가이드 — 로그 자동 순환과 압축](https://www.thivelab.com/engineer/logrotate-log-rotation-guide) | 2 | 100 | 9.69 |

- 압축: 확장자별 즉답 표, zst와 tar.zst 구분, gzip 원본 처리 정정, 과장된 속도 배수 제거.
- nginx: 로그 문자열별 판정, HTTP와 FastCGI 구분, 무조건 타임아웃을 늘리라는 안내 제거.
- SSH reset: 인증 전 단계 진단, MaxStartups와 차단 기록 대조, TCP Wrappers의 적용 범위 정정.
- LLM: 검색어에 맞춘 출시 점검표, 담당·증거·테스트 기준, 정규식만으로 방어할 수 있다는 오해 수정.
- 개인정보: 제17조의 동의 외 근거, 제26조 계약·공개·감독, 국외 이전의 별도 요건 구분.
- 관련 가이드: logrotate→압축, 일반 SSH→reset 진단 링크 추가. 일반 SSH 글의 fingerprint 확인·타임아웃 단정도 정정.

정확한 새 제목·메타·본문은 [manifest.json](manifest.json)과 [content](content/)에 있다. 반영 전 원본 해시·수정시각 대조 및 전체 대상 백업을 수행하며 동시 수정이 발견되면 중단한다. reviewed_by 등 사람의 검토를 뜻하는 필드는 변경하지 않는다.

## 캐시 수정과 검증

- 상세 HTML은 revalidate=0으로 요청 시 렌더링하고 명시적 본문 데이터 캐시 60초를 유지한다. 기존 unstable_cache 구성에서 use cache로의 전체 마이그레이션은 이번 범위에 포함하지 않는다.
- 편집 웹훅은 revalidateTag(tag, { expire: 0 })로 다음 요청의 최신 본문을 보장한다.
- 같은 렌더의 메타데이터·본문 조회는 React cache로 합친다. DB 오류는 404로 저장하지 않는다.
- npm run build 성공: /blog/[slug], /engineer/[slug]가 동적 경로로 생성됨.
- 로컬 모의 DB 회귀 테스트: 본문 캐시 재사용, 편집 직후 첫 요청 갱신, 60초 이후 자동 갱신, DB 장애 500 및 복구, 없는 글 404, 인증 실패 401, 잘못된 입력 400 통과.
- 수정 파일 ESLint와 Python 문법 검사 수행. 전체 lint는 기존 insert-new-episodes.mjs, insert-posts.ts의 구문 오류와 bookmarks/page.tsx의 setState effect 오류 때문에 실패. 이번 변경과 무관한 오류는 수정하지 않음.
- 압축 예제 중 gzip 원본 보존, 단일 zst 해제, zstd→tar 파이프 해제를 임시 파일로 검증. 환경: macOS bsdtar 3.5.3, zstd 1.5.7. Linux 서비스·방화벽 명령은 실제 운영 환경에서 실행하지 않았으며 공식 문서와 대조.

동적 HTML 렌더링으로 서버 호출량과 응답 시간이 늘 수 있다. 배포 후 실제 URL의 최신 제목·본문, cache-control, 응답 시간을 확인한다.

## 성과 확인

변경일 이후 28일(2026-09-08~10-05)이 확정 데이터로 제공되면 아래를 실행한다. 비교 기간은 변경 직전 28일과 정확히 일치하지 않으므로 이번 기준값 파일과 함께 해석한다. 재크롤 지연, 국가·기기·검색어 구성 변화 때문에 단순 전후 차이가 인과효과를 증명하지는 않는다.

```bash
/Users/mainthive/project/SAFESUARE/backend/venv/bin/python3 scripts/seo-performance.py --end 2026-10-05 --output scratchpad/seo-2026-10-05.json
```

기준 데이터: scratchpad/seo-2026-09-07/baseline.json. 총량은 일자별 한국 합계, 개선 대상은 동일 URL·검색어 기준으로 비교한다. 자동 실행 일정이나 외부 메시지 발송은 추가하지 않았다.

## 참고 문서

- [Next.js 로컬 가이드: 캐싱](../../../../node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md)
- [Google Search Console 데이터 누락·집계 안내](https://developers.google.com/webmaster-tools/v1/how-tos/all-your-data)
- 콘텐츠별 공식 기술·법령 근거는 각 본문에 직접 링크했다.
