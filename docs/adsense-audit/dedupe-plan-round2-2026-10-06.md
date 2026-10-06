> 2026-10-06 20:02 KST 승인본. 승인 시 결정: #809는 #629로 308(내용이 같은 Pending/StorageClass/CSI 바인딩 문제), Saga #48/#561은 제외, fail2ban #638/#777·nginx #602는 조치 없음(#638은 사실 오류만 정정). #624·#636·#718의 #738 링크는 자동 삽입된 무관 키워드 링크라 #636·#718은 링크 해제, #624는 주제가 같은 #791(PKIX)로 연결.

# thivelab.com 중복 글 정리 2차 계획 (읽기 전용 권고안) — 2026-10-06

- 작성: 2026-10-06 19:30–19:55 KST. **아무것도 바꾸지 않았음.** DB 쓰기·커밋·배포 없음. DB는 SELECT만 실행했고, Search Console은 새로 조회하지 않았음(무료 조회 2회 보존).
- 근거 자료
  - 본문: `public.posts` 읽기 전용 export(`/workspace/adsense-audit/round2/posts.jsonl`, `<id>.ko.md`). 스냅샷은 2026-10-06 19:20 KST 전후. #629·#809는 19:35 KST에 추가로 SELECT함
  - Search Console: 1차 때 저장한 `/workspace/adsense-audit/gsc_blog_90d.json`(page 차원, **2026-07-06 ~ 2026-10-04**, 90일). 대상 URL은 모두 이 파일로 판단 가능해서 추가 조회는 하지 않았음. 파일에 행이 없는 URL은 0/0으로 적음
  - 리다이렉트 맵: GitHub `SecuThive/ai_blog` main의 `src/lib/postRedirects.ts`(19:40 KST 조회, 1차 머지 3699ece 반영본)
  - 비교 기준: `docs/adsense-audit/decisions.md` §2(origin/main 사본 `/workspace/adsense-audit/decisions_main.md`)
- 선택 기준(운영자 지정, 1차와 동일): ① 품질 → ② 최신성 → ③ 조회수·클릭 → ④ SNS에 이미 올린 링크. decisions.md는 "색인 상태 → 조회 → 점수 → 범위" 순서라서 결론이 갈리는 곳이 있음
- 조회수는 DB `posts.views`, GSC는 URL별 90일 합계(클릭/노출). 분량은 KO 본문에서 공백을 뺀 글자 수
- 2026-10-06 이후 반영 사항: #640은 오늘(18:37 KST) 본문 수정됨(`contentUpdatedAt` 2026-10-06, ssh.socket·OpenSSH 9.8 반영). #742는 draft이고 `/engineer/nginx-502-bad-gateway-fix`로 308 중(1차 머지에서 수정)
- SNS: 비서실장 확인으로 #795(no space left 30초 판정 런북)에 인스타그램 릴스 링크가 있음 → ④ 가점. 그 밖의 2차 대상 글에서는 SNS 게시 기록을 찾지 못함(1차 조사 기준: X 초안 로그의 #792뿐)

## 요약

| 쌍 | 남길 글 | 308 리다이렉트(→ 남길 글) | 조치 | decisions.md와 | 한 줄 이유 | 접전 |
|---|---|---|---|---|---|---|
| CORS | #600 Jupyter CORS 에러: No Access-Control-Allow-Origin 5분 해결 | #744 | 병합+308 | 동의 | GSC 6/541 vs 0/0이고 Jupyter·Colab·Network 탭 내용이 고유함. #744의 원문 진단표·FastAPI를 옮김 | — |
| Saga | #561 MSA 분산 트랜잭션, SAGA vs 이벤트 소싱 선택 가이드 | #48 | 병합+308(우선순위 낮음) | 동의(조건부) | 둘 다 noindex·출처 0·코드 0. 308보다 §3 재작성/비공개 판단이 먼저임 | — |
| PKIX | #791 PKIX path building failed / SunCertPathBuilderException 30분 해결 런북 | #630 | 병합+308 | 동의 | 스택트레이스 해석·디버그 플래그·JDK별 표로 더 깊고 더 새 글. GSC는 둘 다 미미함 | △ |
| Too many open files | #606 Too many open files 해결: ulimit·limits.conf·systemd LimitNOFILE 실전 | #781 | 병합+308 | 동의 | 클릭 13 vs 1, 조회 36 vs 9. #781은 FD 계산 오류가 더 많음 | — |
| Docker socket | **#740** Docker permission denied /var/run/docker.sock 에러 5분 해결법 | **#592** | 병합+308 | **반대** | #740이 5원인 진단표·getent/id·rootless·CI GID까지 다룸. #592는 sudo 위험성 설명이 사실과 다름 | **●** |
| npm ERESOLVE | #620 npm ERESOLVE unable to resolve dependency tree 원인별 해결법 | #755 | 병합+308 | 동의 | overrides 사용법이 맞고 CI·Docker `npm ci` 절이 있음. #755의 overrides 예시는 EOVERRIDE를 냄 | ● |
| PostgreSQL | #788 PostgreSQL too many clients already 30초 판정 복구 런북 | #599 | 병합+308 | 동의 | 30초 판정표·2단계 안전 종료·풀 계산·모드표. GSC 1/23 vs 0/20, 조회 16 vs 8 | — |
| Redis OOM | #704 Redis OOM 에러(used memory > maxmemory) 5분 응급처치 가이드 | #612 | 병합+308 | 동의 | 10/4 공식 출처 검수 완료(유일). GSC 2/30 vs 0/10 | — |
| SSH reset/closed | #640 SSH kex_exchange_identification: Connection reset by peer 원인 | **#765** | **병합+308** | **반대(역할 분리 아님)** | 의도가 같음. #640 slug부터 closed/reset 둘 다이고 오늘 갱신됨. #765는 hosts.deny·FIN/RST 이분법이 틀림 | △ |
| Python pip | #692 Python 'Could not find a version that satisfies' 에러 | **#732** | **병합+308(+#692 진단부 재작성 필수)** | **반대(역할 분리 아님)** | 둘 다 venv·freeze·Poetry 일반론의 반복. #692는 에러 원인 자체를 잘못 짚어 고쳐야 함 | ● |
| SELinux | #626 SELinux Permission denied 해결법 — chmod 정상인데 막힐 때 | #775 | 병합+308 | 동의 | avc 해부·불리언 표·disabled 재라벨 경고까지 더 완결적. #775의 도메인 단위 permissive·`:Z`를 옮김 | △ |
| fail2ban | #638(차단 안 됨 진단) / #777(초기 설정) 둘 다 유지 | — | 역할 분리 | 동의 | 검색 의도가 실제로 다름(설정 vs 미작동). 이미 #638→#777 링크 있음 | — |
| PVC Pending | **#629** Kubernetes PVC Pending 안 풀릴 때 원인 6가지 5분 진단 가이드 | **#713, #673**(+선택 #809) | 병합+308 | **반대(범위 확장 필요)** | 같은 주제 4편 중 #629만 WaitForFirstConsumer·default SC·zone을 정확히 다룸. #713은 StorageClass가 네임스페이스 범위라는 오류 | △ |
| nginx 504/502 | #602 nginx 504 Gateway Timeout 해결 | — (#742는 이미 가이드로 308) | 조치 없음 | 동의 | 504와 502는 다른 오류. #742 리다이렉트는 오늘 정상화됨 | — |
| systemd Restart | #597 systemd 자동 재시작 가이드: Restart=always vs on-failure와 start-limit-hit 해결 | #782 | 병합+308(+#597 오류 3곳 수정 필수) | 동의 | 노출 815 vs 451, start-limit 공식·`systemctl show` 등 범위가 넓음. 다만 #782가 더 정확한 부분이 많음 | **●** |
| kubectl 401 | #641 kubectl Unauthorized(You must be logged in) 401 해결 6가지 | #767 | 병합+308 | 동의 | 제목이 에러 원문 그대로이고 GSC 노출 37 vs 0. #767의 whoami·aws-auth·KUBECONFIG 병합을 옮김 | ● |
| certbot | #608 certbot 갱신 실패 해결: certificate expired 원인별 트러블슈팅 | #738 | 병합+308 | 동의 | 클릭 4 vs 0, 조회 11 vs 1. 내용 범위도 비슷하거나 넓음 | — |
| K8s 네트워크 지연 | #690 Kubernetes 네트워크 지연: eBPF로 병목 구간 진단하고 튜닝하기 | #689 | 병합+308(+§3 재작성 후보) | 동의 | #689에는 존재하지 않는 sysctl을 복붙하게 하는 오류가 있음. 둘 다 얇음 | ● |
| Java OOM | #770 OutOfMemoryError 5계열 30초 진단 런북 | #610 (+기존 #759 대상 변경) | 병합+308 | 동의 | heap·Metaspace·native thread·direct buffer를 모두 다루고 더 새 글. GSC 0/9 vs 0/0 | △ |
| **신규** No space left | #795 No space left on device 30초 판정 런북 | #601 | 병합+308 | (decisions.md에 없음) | 더 새롭고 길고 주의 문구가 정확함. 인스타 릴스 링크(④). #601은 근거 없는 수치 주장이 있음 | — |

- ● = 접전(결론이 바뀔 수 있음), △ = 약한 접전
- **리다이렉트 대상(이번 권고대로면 19~20편)**: #744 #48 #630 #781 #592 #755 #599 #612 #765 #732 #775 #713 #673 #782 #767 #738 #689 #610 #601 (+선택 #809)
- **decisions.md와 다른 곳 4개**: Docker(남길 글 반대), SSH(역할 분리 → 병합), Python(역할 분리 → 병합), PVC(#713 대신 #629를 정본으로)
- **기존 리다이렉트 대상 변경(2단 리다이렉트 방지) 3건**: §2 참고
- **본문 링크 수정 대상 9편**: §3 참고

---

## 1. 쌍별 상세

### 1.1 CORS — 유지 #600 (decisions.md와 동의)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #600 | Jupyter CORS 에러: No Access-Control-Allow-Origin 5분 해결 | `cors-no-access-control-allow-origin-에러-5분-진단해결-코드` | 2026-06-12 | 2026-10-03 | 18 | 6/541 | 0/63 | 8,448 | published |
| 308 | #744 | CORS 에러 해결: 콘솔 에러 원문별 진단표 + 서버별 복붙 설정 | `cors-에러-해결-콘솔-에러-원문별-진단표-서버별-복붙-설정` | 2026-06-24 | 2026-09-17 | 6 | 0/0 | 0/0 | 6,296 | published |

- **이유**: GSC에서 유일하게 의미 있는 성과(KO 6/541)를 내는 글이고 분량도 두 배임. Jupyter·Colab·브라우저 Network 탭 확인 절차는 #744에 없음. #744는 노출이 0이라 308로 잃을 것이 없음
- **#744에서 옮길 내용**: 콘솔 에러 원문별 진단표(Allow-Methods/Allow-Headers 누락, 값 여러 개), 화이트리스트 Origin 반사 + `Vary: Origin`, FastAPI `CORSMiddleware` 예시, 리다이렉트 과정에서 CORS 헤더가 사라지는 경우
- **사실 문제**
  - #744: "`allow_credentials=True`와 `allow_origins=['*']`를 함께 쓰면 Starlette가 내부적으로 막음" → 틀림. Starlette는 credentials 요청일 때 `*` 대신 요청 Origin을 그대로 반사함(오히려 전체 허용이 됨). 옮길 때 고쳐야 함
  - #744: "CORS 에러의 절반은…" 출처 없음
  - #600: "preflight 캐시 24시간" → 오해 소지. Chrome은 `Access-Control-Max-Age`를 최대 2시간(7200초)으로 자름
  - 둘 다 1인칭 경험담 문단이 있음. #600은 제목이 Jupyter 중심인데 slug는 일반 CORS라서, 병합 후 제목에 일반 CORS도 함께 드러내는 것을 권장
- **링크**: #600 본문이 #744를 링크함(125행) → 병합 시 링크 제거

### 1.2 Saga — 유지 #561 (동의, 우선순위 낮음)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #561 | MSA 분산 트랜잭션, SAGA 패턴 vs 이벤트 소싱(ES) 선택 가이드 | `msa-분산-트랜잭션-saga-패턴-vs-이벤트-소싱es-선택-가이드` | 2026-06-09 | 2026-09-17 | 3 | 0/0 | 0/0 | 3,442 | published · noindex |
| 308 | #48 | LLM 기반 워크플로우의 신뢰성 확보: Saga 패턴과 Event Sourcing으로 분산 트랜잭션 문제 해결하기 | `llm-기반-워크플로우의-신뢰성-확보-saga-패턴과-event-sourcing으로-분산-트랜잭션-문제-해결하기` | 2026-05-17 | 2026-09-17 | 6 | 0/0 | 0/0 | 3,285 | published · noindex |

- **이유**: 두 글 모두 noindex이고 출처·코드가 없는 일반론임. #561이 더 새롭고 SAGA와 ES의 차이를 비교 형식으로 정리함. noindex 글끼리 308해도 해는 없지만 효과도 거의 없음
- **권고**: 308보다 decisions.md §3(재작성 또는 비공개) 판단을 먼저 하는 것이 맞음. 둘 다 비공개로 결정되면 #48은 #561이 아니라 404/410 또는 관련 엔지니어 가이드 쪽이 나을 수 있음
- **사실 문제**: #48은 예시 흐름이 코레오그래피인데 결론은 오케스트레이션을 권함(앞뒤 불일치). 같은 절이 반복됨. #561은 이벤트 소싱을 분산 트랜잭션의 "대안 해결책"으로 소개했다가 뒤에서 상호보완이라고 정정함. #561에 1인칭 문단 있음

### 1.3 PKIX — 유지 #791 (동의, 약한 접전)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 308 | #630 | PKIX path building failed 해결법: keytool cacerts import 5분 가이드 | `pkix-path-building-failed-해결법-keytool-cacerts-import-5분-가이드` | 2026-06-14 | 2026-09-17 | 13 | 1/19 | 0/0 | 5,121 | published |
| 유지 | #791 | PKIX path building failed / SunCertPathBuilderException 30분 해결 런북 | `pkix-path-building-failed-suncertpathbuilderexception-30분-해결-런북` | 2026-07-15 | 2026-09-17 | 14 | 0/38 | 0/3 | 6,180 | published |

- **이유**: 스택트레이스 읽는 법, `-Djavax.net.debug`, `keytool -cacerts`, JDK 버전별 cacerts 위치 표, "alias already exists" FAQ까지 #791이 더 깊고 더 새 글. GSC는 둘 다 미미함(#630 1/19, #791 0/41)
- **#630에서 옮길 내용**: Zscaler 등 TLS 검사 프록시·Let's Encrypt 체인 원인표, PKCS12 사용자 truststore 예시, Maven `settings.xml` 프록시, Gradle `--refresh-dependencies`
- **사실 문제(두 글 공통 포함)**
  - `openssl s_client … | openssl x509 -outform PEM`은 **첫 번째(서버 leaf) 인증서만** 저장함. #791은 "최상위(마지막) 인증서"가 저장된다고, #630은 "체인"이 저장된다고 씀 → 둘 다 틀림. `-showcerts`로 받아 필요한 CA를 골라야 함
  - `-Dcom.sun.net.ssl.checkRevocation=false`는 폐기 확인만 끄는 옵션이고(기본값도 대개 꺼짐) 체인 검증을 우회하지 않음
  - #630의 원인 ⑤(인증서 만료)는 실제로는 "path building failed"가 아니라 `CertPathValidatorException: validity check failed`로 나옴
  - #791 "99%" 출처 없음. #630에 1인칭 팁 있음
- **체인**: 기존 맵 `pkix-path-building-failed-해결-java-ssl-오류-30초-진단표keytool` → #630 slug. #630을 308하면 이 항목의 대상을 #791로 바꿔야 함(§2)
- **링크**: #791이 #630을 링크함(16행) → 제거

### 1.4 Too many open files — 유지 #606 (동의)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #606 | Too many open files 해결: ulimit·limits.conf·systemd LimitNOFILE 실전 | `too-many-open-files-해결-ulimitlimitsconfsystemd-limitnofile-실전` | 2026-06-12 | 2026-09-17 | 36 | 11/364 | 2/123 | 4,110 | published |
| 308 | #781 | Too many open files(EMFILE errno 24) 30초 진단·복구 런북 | `too-many-open-filesemfile-errno-24-30초-진단복구-런북` | 2026-07-09 | 2026-09-17 | 9 | 1/4 | 0/0 | 5,844 | published |

- **이유**: 클릭 13(KO 11 + EN 2) vs 1, 조회 36 vs 9. 오류도 #781이 더 많음. 엔지니어 가이드 `/engineer/too-many-open-files-fix`(#77)는 건드리지 않음
- **#781에서 옮길 내용**: 계층별 진단표(셸·PAM·systemd·컨테이너), `systemctl edit` drop-in과 `systemctl show -p LimitNOFILE` 확인, nginx `worker_rlimit_nofile`(공식은 아래처럼 고쳐서), here-document 셸 에러 사례
- **사실 문제**
  - #781: FD 개수를 `lsof | wc -l`로 셈 → 스레드·메모리 맵까지 세서 과대 집계됨. `ls /proc/<PID>/fd | wc -l`이 맞음. 예시 "soft 1024인데 4,832개 열림"도 앞뒤가 안 맞음
  - #781: "worker_connections × 2(클라이언트 + 업스트림)" → 틀림. worker_connections에 이미 프록시 연결이 포함됨
  - 둘 다: "K8s Pod `securityContext`로 nofile 설정" → 그런 필드 없음. 컨테이너 런타임(containerd/dockerd) 기본값이나 `--ulimit`으로 정함
  - #606: "최신 배포판은 기본 LimitNOFILE이 크다" → systemd 240 이상도 soft는 1024, hard만 524288임
  - #781 "8할" 출처 없음. #606에 1인칭 경험담 있음
- **링크**: #781이 #606을 링크함(133행). 외부에서 #781로 들어오는 링크는 없음. #751이 #606을 링크함(유지 글이므로 변경 없음)

### 1.5 Docker socket — **유지 #740 (decisions.md와 반대, 접전)**

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 308 | #592 | Docker permission denied 해결: daemon socket 에러 sudo 없이 끝내기 | `docker-permission-denied-해결-daemon-socket-에러-sudo-없이-끝내기` | 2026-06-11 | 2026-09-17 | 13 | 1/25 | 0/95 | 3,923 | published |
| 유지 | #740 | Docker permission denied /var/run/docker.sock 에러 5분 해결법 | `docker-permission-denied-varrundockersock-에러-5분-해결법` | 2026-06-23 | 2026-09-17 | 17 | 0/67 | 0/28 | 3,858 | published |

- **decisions.md 안**: #592 유지(먼저 색인됨). **반대 이유**: 운영자 기준의 ① 품질과 ② 최신성 모두 #740이 앞섬. #740은 5가지 원인 진단표, `getent group docker` vs `id`로 세션 반영 여부 확인, 소켓 `chown/chmod` 복구, rootless `DOCKER_HOST`, GitHub Actions/GitLab Runner의 GID 문제까지 다룸. #592는 범위가 좁고 아래의 사실 오류가 있음
- **③ 지표는 엇갈림**: 조회 17 vs 13(#740 우세), 노출 95 vs 120(#592 우세, 클릭 1 vs 0). 차이가 작아 ①②를 뒤집을 정도가 아님
- **#592에서 옮길 내용**: WSL2 절(`wsl --shutdown`, Docker Desktop WSL Integration 설정), 데몬 상태 확인(`systemctl status/start/enable docker`)
- **사실 문제**
  - #592: "sudo로 실행하면 바인드 마운트 파일이 root 소유가 되고 컨테이너가 root로 실행되어 탈출 시 더 위험" → 틀림. 데몬은 어느 쪽이든 root로 돌고, 파일 소유권은 컨테이너 안 사용자에 따라 정해짐. docker 그룹 가입 자체가 root와 동등한 권한이라는 점이 올바른 경고임
  - #592: "2026년 rootless/Podman 전환 추세" 출처 없음
  - #740: "거의 100%" 출처 없음, 1인칭 tmux 팁
- **결론을 바꿀 조건**: 운영자가 "먼저 색인된 글 유지"를 우선하면 decisions.md 안(#740 → #592)도 가능함. 그때는 위 #740 고유 내용을 #592로 옮기고 #592의 sudo 설명을 고쳐야 함
- **링크**: 두 글 모두 들어오는 내부 링크 없음

### 1.6 npm ERESOLVE — 유지 #620 (동의, 접전)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 308 | #755 | npm ERR! code ERESOLVE 해결법 — 에러 원문 복붙 진단 런북 | `npm-err-code-eresolve-해결법-에러-원문-복붙-진단-런북` | 2026-06-29 | 2026-09-17 | 8 | 0/5 | 0/44 | 4,165 | published |
| 유지 | #620 | npm ERESOLVE unable to resolve dependency tree 원인별 해결법 | `npm-eresolve-unable-to-resolve-dependency-tree-원인별-해결법` | 2026-06-13 | 2026-09-17 | 8 | 0/10 | 0/3 | 4,683 | published |

- **이유**: #620은 `overrides`의 `$react` 참조 사용법이 맞고, CI·Docker에서의 `npm ci`, lock 파일 초기화의 부작용까지 짚음. 지표는 사실상 동률(조회 8 vs 8, 노출 13 vs 49로 #755가 약간 많지만 클릭 0)
- **#755에서 옮길 내용**: 에러 원문 진단표(`Conflicting peer dependency`, "Fix the upstream dependency conflict" 안내 문구), `npm ls <pkg>`로 의존 경로 추적, yarn/pnpm 비교표(아래처럼 고쳐서), npm 8.3+ overrides 지원 메모
- **사실 문제**
  - #755: 직접 의존성 `react`에 top-level override `"react": "18.3.1"`을 거는 예시 → 명세가 다르면 `EOVERRIDE`로 실패함. `"$react"`를 쓰거나 dependencies의 명세와 맞춰야 함
  - #755: `WARN ERESOLVE overriding peer dependency`를 optional peer 경고라고 설명 → 부정확
  - #755: package.json 예시에 주석(jsonc)을 넣음 → 그대로 복사하면 JSON 파싱 오류
  - 둘 다: "pnpm은 기본이 strict peer" → pnpm 8부터 `strict-peer-dependencies` 기본값은 false. #620은 Yarn Berry도 strict라고 씀(peer 불일치는 경고임)
  - #620 "React 19 이후 폭증" 출처 없음, 1인칭 문단
- **링크**: 들어오는 내부 링크 없음

### 1.7 PostgreSQL too many clients — 유지 #788 (동의)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 308 | #599 | PostgreSQL 'too many clients already' 5분 진단부터 PgBouncer 해결까지 | `postgresql-too-many-clients-already-5분-진단부터-pgbouncer-해결까지` | 2026-06-12 | 2026-09-17 | 8 | 0/20 | 0/0 | 4,539 | published |
| 유지 | #788 | PostgreSQL too many clients already 30초 판정 복구 런북 | `postgresql-too-many-clients-already-30초-판정-복구-런북` | 2026-07-13 | 2026-09-17 | 16 | 1/23 | 0/0 | 6,003 | published |

- **이유**: 30초 판정표, `pg_cancel_backend` → `pg_terminate_backend` 2단계 안전 종료, 커넥션 풀 크기 계산, `idle_in_transaction_session_timeout`, PgBouncer 모드 비교표와 알림 SQL까지 갖춤. GSC 1/23 vs 0/20, 조회 16 vs 8. 더 새 글
- **#599에서 옮길 내용**: PgBouncer `pgbouncer.ini`·`userlist.txt`·앱 DSN 변경 예시, JDBC `prepareThreshold=0` 메모(아래 버전 주의 추가)
- **사실 문제**
  - 둘 다: "트랜잭션 모드에서는 서버 측 prepared statement가 깨진다"를 무조건적으로 씀 → PgBouncer 1.21(2023-10)부터 `max_prepared_statements`로 프로토콜 수준 prepared statement를 지원함. 버전 조건을 붙여야 함
  - #599: "매니지드 DB는 인스턴스 등급별 상한이 고정" → RDS 등은 메모리 기반 **기본값 공식**이고 파라미터 그룹에서 바꿀 수 있음
  - #599: "90%", "대부분" 출처 없음, 1인칭 팁. #788의 "MySQL 1040은 대부분 단순 상향으로 해결"도 근거 없음
  - 참고: PostgreSQL 16의 `reserved_connections`(+`pg_use_reserved_connections` 역할)를 `superuser_reserved_connections` 옆에 함께 적으면 좋음
- **체인**: 기존 맵 `postgresql-too-many-clients-장애-pgbouncer로-5분-만에-복구하고-재발-막는-완벽-가이드` → #599 slug. #599 308 시 대상을 #788로 변경(§2)
- **링크**: #788(10행)과 #813이 #599를 링크함 → #813은 #788 slug로 교체, #788은 자기 참조가 되므로 제거

### 1.8 Redis OOM — 유지 #704 (동의)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #704 | Redis OOM 에러(used memory > maxmemory) 5분 응급처치 가이드 | `redis-oom-에러used-memory-maxmemory-5분-응급처치-가이드` | 2026-06-19 | 2026-10-03 (검수 2026-10-04 / 본문수정 2026-10-03) | 11 | 2/21 | 0/9 | 5,283 | published |
| 308 | #612 | Redis OOM command not allowed 에러 5분 진단·복구 가이드 | `redis-oom-command-not-allowed-에러-5분-진단복구-가이드` | 2026-06-12 | 2026-09-17 | 7 | 0/10 | 0/0 | 4,493 | published |

- **이유**: 2차 대상 중 유일하게 10/4 공식 출처 검수(`verifiedAt` 2026-10-04, 출처 3개, 라이선스 이력·Redis 8.6 LRM 정책 반영)를 거친 글. GSC 2/30 vs 0/10, 조회 11 vs 7
- **#612에서 옮길 내용**: "읽기는 되고 쓰기만 거부되는" 동작 설명 그림, `MEMORY STATS`, `redis-cli --memkeys`, `SCAN` + `TTL`로 영구 키 찾기, 컨테이너에서 `maxmemory=0`이면 Redis OOM이 아니라 커널 OOMKill이 난다는 경고, `CONFIG REWRITE`와 형상관리 충돌 주의
- **사실 문제**
  - #704: 원인 ③과 FAQ에서 "used_memory는 여유인데 단편화 때문에 OOM" → 오해 소지. `OOM command not allowed`는 `used_memory`와 `maxmemory`를 비교하므로 단편화(RSS 증가)로는 이 에러가 나지 않고, OS 스왑이나 커널 OOMKill로 나타남. 문장을 나눠 써야 함. `activedefrag`는 jemalloc 빌드에서만 동작한다는 조건도 필요
  - #612: "가장 흔히 보고되는 원인은 …이 원인이었습니다" 비문이고 출처 없음
- **링크**: 들어오는 내부 링크 없음

### 1.9 SSH reset/closed — **유지 #640, #765 병합 (decisions.md "역할 분리"에 반대)**

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #640 | SSH kex_exchange_identification: Connection reset by peer 원인과 해결 | `ssh-connection-closedreset-by-peer-5분-진단복구-fail2banmaxstartups` | 2026-09-07 | 2026-10-06 (본문수정 2026-10-06) | 93 | 22/855 | 0/306 | 5,075 | published |
| 308 | #765 | SSH Connection closed by remote host 에러 원문별 트러블슈팅 | `ssh-connection-closed-by-remote-host-에러-원문별-트러블슈팅` | 2026-07-04 | 2026-09-17 | 16 | 4/70 | 0/0 | 4,093 | published |

- **역할 분리 판정: 의도가 실제로 다르지 않음.** decisions.md는 "키 교환 전 reset vs closed by remote host"로 나눴지만, 두 메시지는 같은 단계(인증 전 연결 종료)에서 나오고 점검 순서(fail2ban → MaxStartups → 계정 정책 → 방화벽 → 별도 접속 경로)도 같음. #640은 slug(`ssh-connection-closedreset-by-peer-…`)부터 두 메시지를 모두 겨냥하고 본문에서도 closed by remote host를 다룸. 검색자가 어느 문구로 들어와도 #640 하나로 해결됨
- **이유**: #640은 오늘 ssh.socket(Ubuntu 22.10+)·OpenSSH 9.8 `PerSourcePenalties`까지 반영해 갱신됐고, 출처 링크 7개, GSC 22/855(KO) + 0/306(EN), 조회 93으로 사이트 최상위권. #765(4/70)의 클릭은 308로 넘겨받음
- **#765에서 옮길 내용(고쳐서)**: 에러 원문 감별표(Permission denied vs closed/reset 구분), "나만 안 되나 / 다 안 되나" 분기도, `ignoreip` 예시, 클라우드별 out-of-band 접속 경로(SSM Session Manager, EC2 Instance Connect, GCP 시리얼 콘솔/IAP, IPMI)
- **사실 문제(#765)**
  - "closed = 서버가 정상 FIN으로 끊음(차단·정책), reset = RST(방화벽·크래시)" 이분법 → 일반화할 수 없음. fail2ban은 액션에 따라 timeout·refused·reset으로 나타나고, 같은 원인도 경로에 따라 다르게 보임
  - hosts.deny를 현역 원인으로 안내하고 `sed -i '/sshd/d' /etc/hosts.deny`를 권함 → OpenSSH 6.7에서 libwrap 지원이 제거됨(#640이 이를 정확히 씀). 일괄 삭제 명령도 위험함
  - 해결책에 `MaxSessions 20`을 넣음 → MaxSessions는 인증 후 세션 다중화 한도라 이 오류와 무관함
  - `systemctl status sshd` 고정 → Ubuntu/Debian 서비스 이름은 `ssh`. OpenSSH 9.8 PerSourcePenalties 누락
  - "8할", "부쩍 늘었다" 출처 없음
- **링크**: #765가 #640을 링크함(66행). 엔지니어 가이드 `/engineer/ssh-connection-troubleshoot`(#70)가 #640을 링크함(유지 글, 변경 없음). #765로 들어오는 내부 링크 없음

### 1.10 Python pip — **유지 #692, #732 병합 + #692 재작성 (decisions.md "역할 분리"에 반대, 접전)**

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #692 | Python 'Could not find a version that satisfies' 에러: pip·Poetry 의존성 충돌 해결 | `python-could-not-find-a-version-that-satisfies-에러-의존성-충돌-완벽-해결-가이드-pippoetry` | 2026-06-19 | 2026-09-28 | 19 | 1/31 | 0/9 | 4,028 | published |
| 308 | #732 | 파이썬 의존성 충돌 해결: venv·requirements.txt·Poetry로 재현 가능한 환경 만들기 | `파이썬-의존성-충돌-해결-venv부터-poetry까지-완벽-환경-구축-로드맵` | 2026-06-22 | 2026-09-28 | 8 | 0/8 | 0/2 | 3,559 | published |

- **역할 분리 판정: 제목상 의도는 다르지만(환경 구성 vs 특정 pip 오류) 본문이 거의 같음.** 두 글 모두 venv → `pip freeze`/requirements → Poetry → pipdeptree/재설치 순서의 일반론이고, 정작 #692는 제목의 에러를 해결하지 못함. 같은 내용 두 벌보다 한 편을 고쳐 남기는 편이 낫다고 봄
- **이유**: #692가 GSC 1/40, 조회 19로 앞서고(#732 0/10, 8), 에러 원문 검색 수요가 있는 제목임
- **필수 수정(#692)**: "Could not find a version that satisfies the requirement"는 대부분 **의존성 충돌이 아님**. 실제 원인은 패키지 이름 오타, 현재 Python 버전이 `Requires-Python` 범위 밖, 해당 OS/아키텍처용 wheel 없음(예: Apple Silicon, Alpine/musl), 사설 인덱스·프록시·SSL 문제, 너무 오래된 pip임. 진단(`pip --version`, `python -V`, `pip index versions <pkg>`, `pip download --only-binary`)부터 다시 써야 함. 진짜 충돌(`ResolutionImpossible`)은 #594 `pip-resolutionimpossible-…`로 링크
- **#732에서 옮길 내용**: venv 생성·활성화 블록, pip vs Poetry 비교표(아래처럼 고쳐서), `pipdeptree`
- **사실 문제**
  - #732: "pip은 충돌 감지가 어렵고 수동 해결" → pip 20.3부터 백트래킹 resolver가 기본이라 충돌을 감지해 `ResolutionImpossible`로 알려줌
  - #692: "`pip-compile`을 실행하면 pip이 분석" → pip-tools(별도 패키지)의 기능임
  - 둘 다 출처 없음. #732에 1인칭 "주니어 시절" 문단
- **결론을 바꿀 조건**: 운영자가 "환경 구성 입문"을 별도 주제로 남기고 싶다면 역할 분리도 가능함. 그 경우에도 #692의 위 오류는 고쳐야 하고, #732는 uv·pip-tools 등 현재 도구로 재작성해야 차별성이 생김

### 1.11 SELinux — 유지 #626 (동의, 약한 접전)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #626 | SELinux Permission denied 해결법 — chmod 정상인데 막힐 때(avc denied) | `selinux-permission-denied-해결법-chmod-정상인데-막힐-때avc-denied` | 2026-06-14 | 2026-09-17 | 11 | 0/34 | 0/0 | 5,268 | published |
| 308 | #775 | SELinux avc denied 30초 진단 런북: nginx·httpd 접근 거부 해결 | `selinux-avc-denied-30초-진단-런북-nginxhttpd-접근-거부-해결` | 2026-07-07 | 2026-09-17 | 8 | 0/16 | 0/23 | 4,564 | published |

- **이유**: avc 로그 한 줄 해부, 원인 4갈래(컨텍스트·포트·불리언·커스텀 모듈), 켜는 명령까지 포함한 불리언 표, `SELINUX=disabled` 후 재라벨 부담 경고까지 #626이 더 완결적. GSC 노출 34 vs 39(합계)로 비슷하고 조회는 11 vs 8
- **#775에서 옮길 내용**: 전체 `setenforce 0` 대신 **도메인 단위** `semanage permissive -a httpd_t`(#626의 3단계 워크플로를 이것으로 교체 권장), Podman 볼륨 `:Z`, `matchpathcon`으로 기대 라벨 확인, `.te` 파일 검토 단계, `chcon` vs `semanage fcontext` FAQ, 증상 감별표(502 프록시 → `httpd_can_network_connect`), Ansible `sefcontext/seboolean/seport`
- **사실 문제(공통)**: 비표준 포트 예시로 8080을 쓰고 `semanage port -a -t http_port_t -p tcp 8080`을 안내함 → RHEL 계열 기본 정책에서 8080은 이미 `http_cache_port_t`로 정의돼 있어 `-a`는 "already defined" 오류가 남(`-m` 필요). #775의 avc 예시에서 8080의 tcontext를 `unreserved_port_t`로 적은 것도 같은 이유로 틀림. 예시 포트를 8090 등 미정의 포트로 바꾸는 것을 권장
  - #626 "사고의 90%가 -P 누락", #775 "Rocky·Alma 전환 이후 Enforcing 유지 환경이 늘어" 출처 없음. #775에 1인칭 문단, 본문이 H2로 시작(H1 없음)
- **링크**: 들어오는 내부 링크 없음

### 1.12 fail2ban — 역할 분리 유지 (동의)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #638 | fail2ban이 IP 차단 안 할 때: status 0 banned 5분 진단 가이드 | `fail2ban이-ip-차단-안-할-때-status-0-banned-5분-진단-가이드` | 2026-06-15 | 2026-09-17 | 6 | 0/15 | 0/19 | 5,522 | published |
| 유지 | #777 | fail2ban SSH 차단 설정 5분 완성 — jail.local 복붙 예제 | `fail2ban-ssh-차단-설정-5분-완성-jaillocal-복붙-예제` | 2026-07-07 | 2026-09-17 | 6 | 0/12 | 0/0 | 3,509 | published |

- **역할 분리 판정: 의도가 실제로 다름.** #777은 "처음 설치·jail.local 작성"(설정 의도), #638은 "설정했는데 Banned 0"(장애 진단 의도). 본문 겹침은 jail.local 예시 정도이고, #638이 이미 #777을 링크함(27행)
- **권고**: #777에서 엔지니어 가이드 `/engineer/ssh-hardening-fail2ban`(#34)으로 링크를 추가(가이드는 수정하지 않음). #777 → #638("적용했는데 안 막히면") 역링크 추가
- **사실 문제**
  - #638: "Ubuntu 22.04/24.04, RHEL 9는 rsyslog 대신 journald가 기본이라 auth.log가 비어 있거나 없음" → Ubuntu 22.04/24.04와 RHEL 9는 여전히 rsyslog로 `/var/log/auth.log`·`/var/log/secure`를 남김. auth.log가 기본으로 없는 것은 Debian 12 이상임
  - #638 FAQ: "재부팅하면 차단이 풀리는 것은 정상" → fail2ban은 sqlite DB(`dbpurgeage` 기본 1일)로 재시작 후 차단을 복원함
  - #638: 표에는 "Total failed↑ + Banned 0 → banaction", 본문 5절은 "Banned도 오르는데 안 막힘 → banaction"으로 서로 다름. "OpenSSH 8.x→9.x 로그 포맷 변경으로 최근 급증" 출처 없음(실제 이슈는 9.8의 `sshd-session` 프로세스명 변경 → fail2ban 1.1.0 이상 필요). 1인칭 경험담
  - #777: Ubuntu/Debian 템플릿을 `logpath=/var/log/auth.log` + `backend=auto`로 고정 → Debian 12에서는 파일이 없어 jail이 실패함. "IPv6 루프백 오탐 사례" 근거 없음, "2026년 현재도 계속 늘고 있다" 출처 없음, 1인칭. "참고: 공식 문서"가 fail2ban이 아니라 sshd_config 매뉴얼임

### 1.13 PVC Pending — **유지 #629, #713·#673 병합 (decisions.md와 반대: 범위 확장 필요)**

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #629 | Kubernetes PVC Pending 안 풀릴 때 원인 6가지 5분 진단 가이드 | `kubernetes-pvc-pending-안-풀릴-때-원인-6가지-5분-진단-가이드` | 2026-06-14 | 2026-09-17 | 8 | 1/47 | 0/0 | 5,576 | published |
| 308 | #713 | Kubernetes PVC Pending: StorageClass 매칭 실패 원인과 디버깅 순서 | `kubernetes-pvc-pending-문제-storageclass-매칭-실패-원인부터-완벽-디버깅-가이드` | 2026-06-20 | 2026-09-28 | 16 | 2/17 | 0/12 | 3,741 | published |
| 308 | #673 | K8s PVC Pending 해결 가이드: 바인딩 실패 원인 5가지 완벽 진단법 | `k8s-pvc-pending-해결-가이드-바인딩-실패-원인-5가지-완벽-진단법` | 2026-06-17 | 2026-09-30 | 9 | 0/5 | 0/0 | 4,092 | published · noindex |
| 선택 308 | #809 | Kubernetes PVC Pending: StorageClass·CSI 바인딩 실패 진단 | `쿠버네티스-pvc-pending-원인-분석-storageclass부터-csi-바인딩-실패-완벽-진단-가이드` | 2026-08-17 | 2026-09-28 | 2 | 0/40 | 0/11 | 5,078 | published |

- **발견 사항**: 같은 주제 글이 decisions.md의 2편이 아니라 **4편**임(#629, #713, #673, #809). #713을 정본으로 삼아 #673만 보내면, 곧 #629/#809를 다룰 때 #713 자체를 다시 옮겨야 하고 그때 #673 항목도 대상 변경이 필요해짐
- **이유(#629)**: ① 품질: 4편 중 유일하게 이벤트 원문 → 원인 → 명령 매핑표가 있고, WaitForFirstConsumer(정상 동작), default StorageClass 미지정, zone 토폴로지, 정적 vs 동적, 재현용 최소 YAML까지 정확히 다룸. ③ 지표: GSC 노출 47로 최다(클릭 1), 조회 8. #713은 조회 16·GSC 2/29로 클릭은 앞서지만 아래 사실 오류가 있음
- **#713/#673/#809에서 옮길 내용**: #713의 provisioner 오타 YAML 대비 예시와 CSI 컨트롤러 로그 확인, #673의 AccessMode 표(아래처럼 고쳐서)와 CSI 드라이버 Pod 점검 플로, #809의 클라우드 파라미터 불일치·CSI RBAC 시나리오
- **사실 문제**
  - #713: "StorageClass는 네임스페이스 범위로도 정의할 수 있다" → 틀림. StorageClass는 항상 클러스터 범위임
  - #673: RWO의 오류 시나리오를 "여러 Pod 동시 접근"으로 씀 → RWO는 **노드** 단위 제한이고(같은 노드의 여러 Pod는 가능, Pod 단위는 RWOP), 이 경우 PVC는 Bound이며 Pod 쪽 Multi-Attach 오류로 나타남(PVC Pending 원인이 아님). "reclaimPolicy Delete라서 바인딩 오류" 근거 없음. "90% 이상" 출처 없음. WaitForFirstConsumer 누락
  - #809: `kubectl describe storageclass … -n <네임스페이스>` → StorageClass에는 네임스페이스가 없음
  - #629: 분기표의 `volume node affinity conflict`는 PVC가 아니라 Pod 이벤트임. "90%", "절반 이상" 출처 없음. 문서 끝 "다음 편(12편)" 표기가 #641의 "12편"과 겹침(시리즈 번호 정리 필요)
- **결론을 바꿀 조건**: 범위를 decisions.md의 쌍으로만 한정하라면 #673 → #713도 가능함. 다만 위 이유로 비추천. #809(조회 2, GSC 0/52)는 이번 승인 범위 밖이라 "선택"으로 둠
- **링크**: #629(164행)와 #673(19행)이 #713을 링크함 → #629는 링크 제거 또는 다른 글로 교체. #673은 308되므로 무관

### 1.14 nginx 504 vs 502 — 조치 없음 (동의)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #602 | nginx 504 Gateway Timeout 해결: proxy_read_timeout과 업스트림 타임아웃 | `nginx-504-gateway-timeout-해결-proxyreadtimeout과-업스트림-타임아웃` | 2026-06-12 | 2026-09-17 | 11 | 0/0 | 0/0 | 3,935 | published |
| 기존 308 | #742 | nginx 502 Bad Gateway 원인 진단표·복붙 명령어로 5분 해결 | `nginx-502-bad-gateway-원인-진단표복붙-명령어로-5분-해결` | 2026-06-23 | 2026-09-18 | 11 | 1/23 | 0/0 | 5,419 | draft · noindex |

- **판정**: 504(업스트림 응답 지연)와 502(업스트림 연결·응답 불량)는 원인과 처방이 다른 별개 오류. #742는 이미 draft이고 `/engineer/nginx-502-bad-gateway-fix`로 308됨(1차 머지에서 404 → 308 정상화). #602는 손대지 않음
- **선택 개선**: #602의 "504 vs 502" 절에 엔지니어 가이드 502 링크 추가(가이드는 수정하지 않음)

### 1.15 systemd Restart — 유지 #597 (동의, 접전 + 수정 필수)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #597 | systemd 자동 재시작 가이드: Restart=always vs on-failure와 start-limit-hit 해결 | `systemd-자동-재시작-가이드-restartalways-vs-on-failure와-start-limit-hit-해결` | 2026-06-11 | 2026-09-17 | 28 | 1/18 | 4/797 | 4,981 | published |
| 308 | #782 | systemd Restart=always·on-failure 예제와 무한재시작 방지법 | `systemd-restartalwayson-failure-예제와-무한재시작-방지법` | 2026-07-10 | 2026-09-17 | 24 | 3/101 | 3/350 | 5,921 | published |

- **이유**: 노출 815 vs 451(EN 797이 특히 큼), 조회 28 vs 24, 클릭 5 vs 6로 지표는 박빙. #597은 start-limit-hit을 피하는 부등식, `systemctl show -p …`로 적용값 확인, `StartLimitIntervalSec=0`, 종료 원인 진단까지 범위가 넓고 slug에 `start-limit-hit`이 들어 있음
- **그러나 정확성은 #782가 앞섬**. #597을 남기려면 아래 3곳을 반드시 고쳐야 함. 고치지 않을 거라면 #782 유지(#597 → #782)가 낫다고 봄
  1. "`always`는 `systemctl stop`을 해도 다시 올라올 수 있다" → 틀림. `systemctl stop`은 어떤 Restart 값이든 재시작을 일으키지 않음(#782가 정확히 씀). 이 오류 때문에 "웹 서버는 on-failure가 정석"이라는 결론의 근거도 무너짐
  2. 전체 샘플에서 `StartLimitIntervalSec`/`StartLimitBurst`를 `[Service]`에 둠 → systemd 230 이상은 `[Unit]` 지시어이고, `[Service]`의 `StartLimitIntervalSec`는 "Unknown key"로 무시됨(구 이름 `StartLimitInterval`만 호환)
  3. 비교표 제목은 "4종"인데 5개를 나열하고 `on-watchdog`·`on-abort`가 빠짐
- **#782에서 옮길 내용**: stop은 재시작을 유발하지 않는다는 설명, start-limit-hit 실제 `systemctl status` 출력 예시, 적용·검증 런북과 상태별 분기, enable vs start FAQ
- **#782의 사실 문제(옮길 때 주의)**: 비교표의 "SIGTERM 등 시그널" 열에서 `on-failure`·`on-abnormal`을 ✓로 표시 → SIGHUP/SIGINT/SIGTERM/SIGPIPE는 "깨끗한 종료"라서 두 값 모두 재시작하지 않음. "Restart 6종"(실제 7종), "250+에서 안정화된 StartLimitIntervalSec"(230에서 도입) 틀림. "ExecStart는 반드시 절대경로" → systemd 239부터 고정 검색 경로의 명령 이름도 허용. 출처 섹션 없음, 본문이 H2로 시작
- **링크**: 들어오는 내부 링크 없음

### 1.16 kubectl 401 — 유지 #641 (동의, 접전)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #641 | kubectl Unauthorized(You must be logged in) 401 해결 6가지 | `kubectl-unauthorizedyou-must-be-logged-in-401-해결-6가지` | 2026-06-15 | 2026-09-17 | 8 | 0/33 | 0/4 | 4,639 | published |
| 308 | #767 | kubectl Unauthorized 원인별 3분 진단·복구 런북 (EKS 재발급) | `kubectl-unauthorized-원인별-3분-진단복구-런북-eks-재발급` | 2026-07-04 | 2026-09-17 | 8 | 0/0 | 0/0 | 4,523 | published |

- **이유**: 제목이 에러 원문("You must be logged in to the server (Unauthorized)")과 일치하고 GSC 노출 37 vs 0. 시계 오차·context·GKE까지 다룸
- **#767이 더 나은 부분(옮길 내용)**: 에러 원문별 진단표, `kubectl auth whoami`(1.28+), `kubeadm certs check-expiration`/`renew admin.conf`, `aws-auth` ConfigMap·EKS Access Entry 매핑 확인, `KUBECONFIG` 병합 우선순위 함정, `--raw` 출력의 민감정보 경고, CI에서 bound 토큰 만료
- **사실 문제**
  - #767: `Unable to connect to the server: x509: certificate has expired`를 **클라이언트 인증서 만료**로 분류 → 이 메시지는 kubectl이 **API 서버 인증서**를 검증하다 실패한 것(서버 인증서 만료나 시계 오차). 클라이언트 인증서가 만료되면 `Unauthorized`가 나옴
  - #767: "EKS 1.24+부터 `aws eks get-token` 방식이 기본" → get-token은 AWS CLI 1.16.156(2019)부터 있었고 EKS 버전과 무관. "1.24부터 SA 영구 토큰 폐지" → 1.24부터 **자동 생성이 중단**된 것이고 수동 생성은 가능함
  - #767: 본문의 "cert" 앵커가 certbot 글(#738)을 가리킴 → 맥락 무관 링크. "90%" 출처 없음
  - #641: "70% 이상" 1인칭 통계 출처 없음. 시리즈 번호(12편)가 #629와 겹침
  - #814(SA 토큰 401)는 decisions.md대로 별도 역할로 둠(이번에 깊게 보지 않음)
- **링크**: #802, #814가 #767을 링크함 → #641 slug로 교체. #802는 #641도 링크하므로 중복이면 하나만 남김

### 1.17 certbot — 유지 #608 (동의)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #608 | certbot 갱신 실패 해결: certificate expired 원인별 트러블슈팅 | `certbot-갱신-실패-해결-certificate-expired-원인별-트러블슈팅` | 2026-06-12 | 2026-09-17 | 11 | 4/68 | 0/17 | 4,194 | published |
| 308 | #738 | certbot renew 실패·NET::ERR_CERT_DATE_INVALID 30분 복구 가이드 | `certbot-renew-실패neterrcertdateinvalid-30분-복구-가이드` | 2026-06-23 | 2026-09-17 | 1 | 0/1 | 0/12 | 4,168 | published |

- **이유**: 클릭 4 vs 0, 조회 11 vs 1. 원인 5갈래·hook·D-1 긴급 발급까지 범위가 같거나 넓음
- **#738에서 옮길 내용**: 증상 → 원인 매핑표(브라우저 `NET::ERR_CERT_DATE_INVALID` 포함), 원격에서 실제 서비스 중인 인증서 확인(`openssl s_client … | openssl x509 -noout -dates`), webroot 404 절, nginx vs apache 표, cron PATH·snap/apt 경로 충돌
- **사실 문제(공통)**: snap으로 설치한 certbot의 타이머 이름은 `snap.certbot.renew.timer`인데 둘 다 `certbot.timer`(apt 패키지 이름)로 안내함. #608의 `journalctl -u certbot`도 snap에서는 `snap.certbot.renew.service`여야 함
  - #608: `renew_hook`은 renewal conf의 `[renewalparams]` 아래에 있어야 함(위치 명시 필요). `/etc/letsencrypt/renewal-hooks/deploy/` 스크립트 방식이 더 간단함
  - #738: "2026년 현재 단기 인증서 도입을 추진 중" → Let's Encrypt 6일 인증서는 이미 opt-in 프로필로 제공되고 있어 시점 표현 확인 필요. 1인칭 문단
- **링크**: #624, #636, #718, #767이 #738을 링크함 → #608 slug로 교체(#767은 308되므로 무관). #800이 #608을 링크함(변경 없음)

### 1.18 K8s 네트워크 지연 — 유지 #690 (동의, 접전, §3 재작성 후보)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #690 | Kubernetes 네트워크 지연: eBPF로 병목 구간 진단하고 튜닝하기 | `kubernetes-네트워크-지연-ebpf로-근본-원인-진단하고-성능-최적화하는-완벽-가이드` | 2026-06-18 | 2026-09-28 | 10 | 1/9 | 0/13 | 4,142 | published |
| 308 | #689 | 쿠버네티스 네트워크 지연, CNI 오버헤드부터 eBPF까지 근본 원인 진단 가이드 | `쿠버네티스-네트워크-지연-cni-오버헤드부터-ebpf까지-근본-원인-진단-가이드` | 2026-06-18 | 2026-09-17 | 6 | 0/5 | 0/8 | 4,034 | published |

- **이유**: GSC 1/22 vs 0/13, 조회 10 vs 6. 품질은 둘 다 낮음(출처 0, 개념 위주). #689는 명령이 있지만 위험한 오류가 있고, #690은 코드 블록이 0개임
- **#689에서 옮길 내용(고쳐서)**: MTU/MSS 점검 절. 단, 아래 sysctl은 버리고 `ip link`로 MTU 확인, `ping -M do -s <크기>`로 경로 MTU 확인, CNI 설정의 MTU 값 확인으로 바꿔야 함. `iperf3`·`mtr` 사용 예
- **사실 문제**
  - #689: `sysctl -w net.ipv4.tcp_mtu_hook_dev=eth0` → **존재하지 않는 커널 파라미터**. `sysctl -w net.ipv4.tcp_mem = 16777216` → 값이 3개여야 하고 `=` 앞뒤 공백 때문에 명령이 실패하며, MSS와도 무관. 복붙 시 혼란을 주므로 병합과 별개로 빨리 내려야 함
  - #689: "TCP 패킷이 MTU 때문에 조각나서 지연" → TCP는 보통 DF + PMTUD라서 조각화보다 블랙홀/재전송 문제로 나타남. "Calico(BGP)의 주요 오버헤드는 BGP 피어링" → BGP는 제어 평면이라 데이터 경로 지연과 무관. Flannel 행에 "IP-in-IP 또는 VXLAN" 혼재. 1인칭 경험담
  - #690: Calico를 "BGP, iptables(기본)"로만 소개(eBPF 데이터플레인 누락), kube-proxy IPVS/nftables 모드 언급 없음. "Flannel은 오버헤드가 크다" 일반화
- **권고**: 병합 후에도 decisions.md §3 재작성 목록에 올릴 것(애드센스 저품질 판정 위험)
- **링크**: #806이 #690을 링크함(변경 없음). #689로 들어오는 링크 없음

### 1.19 Java OOM — 유지 #770 (동의, 약한 접전)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 308 | #610 | java.lang.OutOfMemoryError: Java heap space 30분 진단·해결 가이드 | `javalangoutofmemoryerror-java-heap-space-30분-진단해결-가이드` | 2026-06-12 | 2026-09-17 | 6 | 0/0 | 0/0 | 3,954 | published |
| 유지 | #770 | OutOfMemoryError 5계열 30초 진단 런북: heap space vs Metaspace 복구 명령 | `outofmemoryerror-5계열-30초-진단-런북-heap-space-vs-metaspace-복구-명령` | 2026-07-05 | 2026-09-17 | 6 | 0/9 | 0/0 | 4,181 | published |
| 기존 308(draft) | #759 | OutOfMemoryError Java heap space 30초 진단·복구 런북(jmap·MAT) | `outofmemoryerror-java-heap-space-30초-진단복구-런북jmapmat` | 2026-07-01 | 2026-07-01 | 1 | 0/5 | 0/0 | 4,599 | draft |

- **이유**: 둘 다 GSC가 미미함(#770 0/9, #610 0/0, 조회 6 vs 6). #770은 heap·Metaspace·GC overhead·native thread·direct buffer 5계열을 모두 다루고 `jstat`, 클래스로더 누수, NMT까지 있어 범위가 넓고 더 새 글. heap 전용 검색도 #770이 받을 수 있음
- **#610에서 옮길 내용**: `-XX:+HeapDumpOnOutOfMemoryError` + `-XX:+ExitOnOutOfMemoryError` 운영 기본값, MAT 분석 순서(Leak Suspects → Dominator Tree → Path to GC Roots), `-Xms=-Xmx` 근거, GC 로그로 누수 vs 단순 부족 구분, 힙 덤프 STW FAQ
- **사실 문제**
  - #610: "JDK 8u191 이전 구버전은 `-XX:+UseContainerSupport`를 명시하라" → 그 옵션은 8u191에서 처음 생겨 이전 버전에는 없음(8u131~8u190은 실험 옵션 `UseCGroupMemoryLimitForHeap`). "GC overhead limit exceeded(98%/2%)"는 Parallel GC 기준이라는 조건 누락. "절반 이상", "80%" 출처 없음
  - #770: `jstat -gcutil`의 M 열이 99%면 누수 확정 → M은 **현재 커밋된 Metaspace 대비 비율**이라 정상 상태에서도 90%대가 흔함. `jstat -gc`의 MU 절대값이나 `jcmd VM.metaspace`로 봐야 함. `jcmd VM.native_memory`는 기동 시 `-XX:NativeMemoryTracking=summary`가 있어야 동작함. "90%", "십중팔구" 출처 없음, 1인칭
- **체인**: 기존 맵 `outofmemoryerror-java-heap-space-30초-진단복구-런북jmapmat`(#759, draft) → #610 slug. #610 308 시 대상을 #770으로 변경(§2)
- **링크**: #610, #770으로 들어오는 내부 링크 없음

### 1.20 신규: No space left on device — 유지 #795 (decisions.md에 없던 쌍)

| 역할 | ID | KO 제목 | slug | 발행 | 수정(DB) (근거) | 조회 | GSC KO 클릭/노출 | GSC EN 클릭/노출 | 분량(KO 공백 제외 글자) | 상태 |
|---|---|---|---|---|---|---|---|---|---|---|
| 유지 | #795 | No space left on device 30초 판정 런북 — df에 용량 남았는데 안 될 때 | `no-space-left-on-device-30초-판정-런북-df에-용량-남았는데-안-될-때` | 2026-07-19 | 2026-09-17 | 13 | 0/7 | 0/24 | 6,671 | published |
| 308 | #601 | No space left on device 해결: df, inode, Docker 5분 진단 | `no-space-left-on-device-해결-df-inode-docker-5분-진단` | 2026-06-12 | 2026-09-17 | 6 | 0/27 | 0/34 | 4,239 | published |

- **이유**: ① 품질: 5개 명령 판정 트리와 결과 해석표, ext4/xfs inode 차이, `/proc/<PID>/fd/<N>` 무중단 truncate와 그 한계, `docker info`로 data-root 확인, `--volumes` 위험 경고, 용량·inode 별도 알림 기준까지 갖춤. 수치 22개는 대부분 예시 출력값(65%, 100% 등)과 "예시 값"이라고 밝힌 임계치(80/90%)라 근거 없는 통계 주장이 없음. ② 최신성: 07-19 발행(#601은 06-12). ④ 인스타그램 릴스 링크가 #795를 가리키므로 유지하면 SNS 링크가 그대로 살아 있음. ③ 지표: 조회 13 vs 6. GSC 노출은 #601이 61 vs 31로 많지만 둘 다 클릭 0
- **#601에서 옮길 내용**: `/etc/systemd/journald.conf`의 `SystemMaxUse`/`SystemMaxFileSize` 영구 제한, `du -sh /var/lib/docker/*`, `docker image prune` 단계, 마운트가 여러 개인 `df` 출력 예시(/data는 여유), `/var/*` 전체를 도는 inode 카운트 루프
- **사실 문제**
  - 둘 다: "삭제됐지만 열린 파일"을 "`df -h`엔 용량이 남았는데 안 되는" 경우로 분류함 → 이 경우 `df`는 **꽉 찬 것으로** 나오고 `du`만 작게 나옴(#795의 예시 출력도 df 100%임). "df와 du가 안 맞을 때"로 고쳐야 함. #795 제목의 "df에 용량 남았는데"에 정확히 해당하는 원인은 inode 고갈이 주이고, 다음이 빠져 있음: inotify 감시 한도 초과(`ENOSPC: System limit for number of file watchers reached`, `fs.inotify.max_user_watches`), 다른 마운트(tmpfs `/tmp`·`/dev/shm`, 컨테이너 overlay)에 쓰는 경우, btrfs 메타데이터 고갈. 추가를 권장
  - 둘 다: `docker system prune -a --volumes`가 named volume(DB 데이터)까지 지운다고 경고 → Docker Engine 23.0 이후에는 volume prune이 기본으로 **익명 볼륨만** 지움(named는 `docker volume prune -a`). 다만 DB 이미지의 VOLUME 지시어로 생긴 익명 볼륨이 지워질 수 있으니 경고는 유지하되 버전 조건을 붙이는 것을 권장
  - #601: "경험상 8할", "평균 복구 시간을 절반으로", "신규 장애 1순위" 출처 없는 수치·1인칭 주장
  - #795: 공식 문서 링크 0개(출처 섹션 없음), 본문이 H2로 시작. 엔지니어 가이드 `/engineer/linux-disk-full-fix`(#72)와 주제가 겹치므로 #795에서 가이드로 링크 추가 권장(가이드는 수정하지 않음)
- **링크**: 두 글 모두 들어오는 내부 링크 없음

---

## 2. 기존 리다이렉트 대상 변경(2단 리다이렉트 방지)

`tests/postRedirects.test.ts`가 2단 리다이렉트를 금지하므로 아래는 새 항목과 **같은 커밋**에서 바꿔야 함.

| 기존 키(구 slug) | 현재 대상 | 바꿀 대상 | 이유 |
|---|---|---|---|
| `outofmemoryerror-java-heap-space-30초-진단복구-런북jmapmat` (#759, draft) | #610 `javalangoutofmemoryerror-java-heap-space-30분-진단해결-가이드` | #770 `outofmemoryerror-5계열-30초-진단-런북-heap-space-vs-metaspace-복구-명령` | #610 → #770 |
| `postgresql-too-many-clients-장애-pgbouncer로-5분-만에-복구하고-재발-막는-완벽-가이드` | #599 `postgresql-too-many-clients-already-5분-진단부터-pgbouncer-해결까지` | #788 `postgresql-too-many-clients-already-30초-판정-복구-런북` | #599 → #788 |
| `pkix-path-building-failed-해결-java-ssl-오류-30초-진단표keytool` | #630 `pkix-path-building-failed-해결법-keytool-cacerts-import-5분-가이드` | #791 `pkix-path-building-failed-suncertpathbuilderexception-30분-해결-런북` | #630 → #791 |

- #742 → `/engineer/nginx-502-bad-gateway-fix`는 그대로 둠(변경 없음)
- 이번 권고의 새 대상(#600 #561 #791 #606 #740 #620 #788 #704 #640 #692 #626 #629 #597 #641 #608 #690 #770 #795) 중 맵의 **키**인 것은 없음 → 다른 2단 리다이렉트 없음
- 대상 slug는 19:20 KST DB 스냅샷 기준. 적용 직전에 slug가 바뀌지 않았는지 다시 확인할 것

## 3. 본문 내부 링크 수정 대상(308 대상 slug를 링크하는 유지 글)

19:45 KST 기준 `posts.content`, `posts.content_evidence`(EN), `engineer_guides.content`를 전수 검색함. 엔지니어 가이드 중에는 308 대상 글을 링크하는 것이 없음(가이드 수정 불필요).

| 링크하는 글 | 지금 가리키는 글(308 예정) | 조치 |
|---|---|---|
| #600 | #744 | 병합 후 자기 참조 → 제거 |
| #791 | #630 | 제거 |
| #788 | #599 | 제거 |
| #813 | #599 | #788 slug로 교체 |
| #629 | #713 | 제거 또는 다른 관련 글로 교체 |
| #624, #636, #718 | #738 | #608 slug로 교체 |
| #802, #814 | #767 | #641 slug로 교체(#802는 이미 #641도 링크하면 하나로 정리) |

- 308 대상끼리의 링크(#781→#606, #765→#640, #673→#713, #767→#738)는 그 글이 draft가 되므로 수정 불필요
- 링크를 고치지 않아도 1단 308로 정상 도착함(1차 때 #167 → #805와 같은 상태). 다만 크롤 예산과 내부 링크 신호를 위해 교체를 권장

## 4. 역할 분리 4쌍 판정 요약

| 쌍 | decisions.md | 판정 | 근거 |
|---|---|---|---|
| #640 / #765 SSH | 역할 분리(키 교환 전 reset vs closed) | **병합**(#765 → #640) | 같은 단계·같은 점검 순서. #640 slug와 본문이 이미 closed/reset을 모두 다룸 |
| #732 / #692 Python | 역할 분리(환경 구성 vs pip 오류) | **병합**(#732 → #692) + #692 재작성 | 본문이 같은 일반론. #692가 에러 원인을 잘못 짚어 고쳐야 하는 상황 |
| #638 / #777 fail2ban | 역할 분리(차단 안 됨 진단 vs 초기 설정) | **역할 분리 유지** | 설정 의도와 장애 진단 의도가 실제로 다르고 상호 링크로 충분 |
| #602 / #742 nginx | 조치 없음 | **조치 없음** | 504와 502는 다른 오류. #742는 이미 가이드로 308 |

## 5. 접전·확인 필요 사항(운영자 판단)

1. **Docker(#740 vs #592)**: 품질·최신성 기준이면 #740, "먼저 색인" 기준이면 #592. 어느 쪽이든 #592의 sudo 설명은 고쳐야 함
2. **systemd(#597 vs #782)**: #597을 남기려면 §1.15의 3곳 수정이 전제임. 수정 작업을 미룰 거라면 #782 유지가 더 안전함
3. **Python**: 병합(권고) vs 역할 분리(입문 글을 따로 남기려는 경우). 어느 쪽이든 #692 진단부 재작성 필요
4. **PVC**: #629를 정본으로 하려면 decisions.md 쌍 범위를 넘는 승인이 필요함(#629 유지, #713·#673 308, #809는 선택)
5. **npm·kubectl·K8s 네트워크**: 지표가 거의 같아 품질 판단에 기댄 결론. K8s 네트워크 두 편은 병합 후에도 재작성 대상
6. **Saga**: 308보다 §3(재작성/비공개) 결정을 먼저 할 것을 권장
7. **#689의 가짜 sysctl**은 병합 여부와 상관없이 빨리 내려야 하는 오류임(복붙 위험)

## 6. 적용 시 체크리스트(승인 후, 1차와 같은 방식)

- 작업 위치: newgen `~/project/ai-blog-adsense` 또는 origin/main에서 새 브랜치 worktree(`~/project/ai-blog`는 건드리지 않음)
- `src/lib/postRedirects.ts`에 새 항목 추가 + §2의 3개 항목 대상 변경 → 테스트(2단 금지·대상 존재) 통과 확인 → 일반 머지(force 없음)
- DB: 308 대상 글은 `status='draft'`만(행 삭제·`published_at` 변경 없음). 유지 글은 고유 내용 이식과 위 사실 오류 수정, §3 링크 교체. 백업은 public 스키마 밖에 둠
- 캐시: 바뀐 slug 전부에 `post-<sha1(slug)[:16]>` 태그 무효화, sitemap 재생성 확인
- 검증: 각 구 URL(KO/EN)이 1단 308 → 200인지, sitemap에 308 slug가 없는지
