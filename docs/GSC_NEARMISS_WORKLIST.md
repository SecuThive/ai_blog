# GSC 근접키워드 보강 워크리스트 (2026-07-15)

GSC 최근 3개월 실적의 **8~20위(1페이지 문턱)+노출≥5** 키워드 21개. 두 라운드로 보강 완료.

| 상태 | 키워드 | 순위 | 노출 | 클릭 | 걸린 글 |
|---|---|---|---|---|---|
| ✅ 보강완료 | llm ai 보안 및 거버넌스 체크리스트 | 14.55위 | 126 | 0 | [blog] [필독] LLM 에이전트 보안 취약점 분석 및 기업용 AI  |
| ✅ 보강완료 | tar.zst 압축풀기 | 8.89위 | 95 | 5 | [engineer] 리눅스 압축·해제 완전 가이드 — tar · gzip |
| ✅ 보강완료 | mlops 스택 | 18.26위 | 35 | 0 | [blog] MLOps 실전 가이드: 모델 버전 관리부터 프로덕션 배포까 |
| ✅ 보강완료 | ssh permission denied | 9.59위 | 32 | 1 | [blog] SSH Permission denied (publickey) |
| ✅ 보강완료 | postgresql patroni | 9.43위 | 21 | 0 | [engineer] Patroni + etcd로 PostgreSQL 자동 |
| ✅ 보강완료 | ssh connection refused | 10위 | 20 | 0 | [engineer] SSH 접속 안 될 때 — Connection ref |
| ✅ 보강완료 | mssql 이중화 | 8.86위 | 14 | 0 | [engineer] MSSQL Always On 가용성 그룹 — SQL  |
| ✅ 보강완료 | patroni etcd | 8.2위 | 10 | 1 | [engineer] Patroni + etcd로 PostgreSQL 자동 |
| ✅ 보강완료 | 이미지 보안 검증 | 10.2위 | 10 | 0 | [blog] 컨테이너 이미지 보안: 빌드부터 런타임까지 완전 강화 가이드 |
| 🟢 기완비 | crashloopbackoff | 9.22위 | 9 | 0 | [blog] CrashLoopBackOff 해결: Pod 무한 재시작 7 |
| ⏭ 제외 | 헬스 케어 비즈니스 프로세스 자동화 | 13.29위 | 7 | 0 | [blog] 헬스케어 AI, 기술 도입을 넘어 '비즈니스 가치'를 창출하 |
| 🟢 기완비 | exit code 137 | 17.71위 | 7 | 0 | [blog] OOMKilled exit code 137 해결: Pod 메 |
| ✅ 보강완료 | cilium istio | 8.33위 | 6 | 0 | [blog] 서비스 메시 완전 정복: Istio vs Linkerd vs |
| ✅ 보강완료 | devsecops 로드맵 | 8위 | 5 | 0 | [blog] DevSecOps 도입 로드맵: SAST, DAST로 개발  |
| ✅ 보강완료 | tar czf | 8.8위 | 5 | 0 | [engineer] 리눅스 압축·해제 완전 가이드 — tar · gzip |
| ✅ 보강완료 | 개인정보 제3자 제공 위탁 차이 | 9위 | 5 | 0 | [blog] 개인정보 위탁 vs 제3자 제공 차이, 동의 또 받아야 할까 |
| ✅ 보강완료 | 메타데이터 필터링 | 10.6위 | 5 | 0 | [blog] RAG 성능 극대화 가이드: 하이브리드 검색과 메타데이터 필 |
| ✅ 보강완료 | tar.zst 압축 풀기 | 11.6위 | 5 | 0 | [engineer] 리눅스 압축·해제 완전 가이드 — tar · gzip |
| 🟢 기완비 | cannot connect to the docker daemon | 13.6위 | 5 | 0 | [blog] Docker "Cannot connect to the dae |
| ✅ 보강완료 | patroni | 14.8위 | 5 | 0 | [engineer] Patroni + etcd로 PostgreSQL 자동 |
| ⏭ 제외 | 완벽한 자동화 솔루션 | 14.8위 | 5 | 0 | [blog] [비교 가이드] 2026년, 우리 회사에 맞는 RPA vs. |

## 보강 내역
**Round 1 (Top5)**: 가이드#92 tar.zst 섹션 / #168 거버넌스 체크리스트표+FAQ / #21 MLOps 스택표+FAQ / 가이드#133 Patroni 트러블슈팅+FAQ / 가이드#70 SSH refused FAQ

**Round 2**: 가이드#134 MSSQL 이중화 FAQ / #224 이미지 보안검증 FAQ / #220 Cilium vs Istio FAQ / #567 DevSecOps 로드맵 FAQ / #407 RAG 메타데이터 필터링 FAQ / #656 제3자제공·위탁 비교표

**🟢 기완비(패딩 안 함)**: crashloopbackoff(#590, 8887자)·exit code 137(#603)·docker daemon(#670) — 이미 표·FAQ 완비.
**⏭ 제외**: 헬스케어 비즈니스 자동화(범용 에세이·약한 매칭)·완벽한 자동화 솔루션(일반 질의).

## 재측정 (1~2주 후)
GSC 재export → `node scripts/analyze-gsc.mjs "GSC CSV"` → 이 키워드들이 1~7위로 올라왔는지 확인. 올라오면 클릭 발생.

## ③ 콘텐츠 갭 (20위 밖, 신규 기획)
multi-agent llm / feature store / vector index / ai 변화 관리 / 워크플로우 오케스트레이션 → 엔진 content_planner에 키워드 전달.
