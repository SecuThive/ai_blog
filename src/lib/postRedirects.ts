/**
 * 카니벌라이제이션 정리로 draft 강등된 글의 구 URL → 유지된 글 URL 매핑.
 * blog/[slug]에서 글을 못 찾으면 이 맵을 확인해 308(영구) 리다이렉트한다.
 * — 색인된 구 URL의 링크 가치를 유지 글로 이전하고, 404 누적을 방지.
 * (2026-07-03 정리분. 복구 시 해당 항목을 지울 것 — 강등 글을 재발행하면
 *  같은 slug가 다시 살아나므로 맵이 남아있으면 원문 접근이 막힌다.)
 *
 * 값 형식: 블로그 slug(→ /blog/<slug>) 또는 '/'로 시작하는 사이트 내부 경로(예: '/engineer/<slug>').
 * 둘 다 로케일을 유지한다(/en/blog/a → /en/blog/b 또는 /en/engineer/...). 대상이 다시 키가 되면 안 된다
 * (2단 리다이렉트 금지 — tests/postRedirects.test.ts). 맵에 있는 slug는 sitemap에서도 제외된다.
 */
export const POST_REDIRECTS: Record<string, string> = {
  // 최근 자동발행 중복 3쌍 (#756→#634, #757→#655, #759→#610)
  'git-refusing-to-merge-unrelated-histories-30초-진단복구-런북':
    'fatal-refusing-to-merge-unrelated-histories-해결법-복붙-명령어',
  'git-detected-dubious-ownership-해결법-원인복구-런북-dockerci':
    'git-detected-dubious-ownership-에러-상황별-5분-해결-가이드',
  'outofmemoryerror-java-heap-space-30초-진단복구-런북jmapmat': // 2026-10-06 r2: 대상이 draft로 바뀌어 1단 유지를 위해 재지정
    'outofmemoryerror-5계열-30초-진단-런북-heap-space-vs-metaspace-복구-명령',
  // A그룹 명백 중복 6쌍
  'postgresql-too-many-clients-장애-pgbouncer로-5분-만에-복구하고-재발-막는-완벽-가이드': // 2026-10-06 r2: 대상이 draft로 바뀌어 1단 유지를 위해 재지정
    'postgresql-too-many-clients-already-30초-판정-복구-런북',
  '챗봇을-넘어-자율-시스템으로-llm-기반-ai-에이전트-완벽-가이드-개념부터-구축-로드맵까지':
    'llm-에이전트-완전-정복-단순-챗봇을-넘어-자율-작업자로-진화하는-방법',
  'terraform-error-acquiring-the-state-lock-해결법-force-unlock-안전-사용':
    'terraform-state-lock-에러-해결-force-unlockdynamodb-락-삭제',
  'l4-vs-l7-로드-밸런서-서비스-요구사항에-맞는-최적의-트래픽-분배기-선택-가이드':
    'l4-vs-l7-로드-밸런서-비교-msa-환경별-최적-선택-가이드',
  // #737 → #778 (2026-10-06: #589가 #778로 통합되어 대상 변경, 1단 유지)
  '2026-isms-p-인증-준비-체크리스트-단계별-증적일정비용-실무-가이드':
    '2026-isms-p-인증-준비-체크리스트-의무대상절차비용-총정리',
  'pkix-path-building-failed-해결-java-ssl-오류-30초-진단표keytool': // 2026-10-06 r2: 대상이 draft로 바뀌어 1단 유지를 위해 재지정
    'pkix-path-building-failed-suncertpathbuilderexception-30분-해결-런북',
  // B그룹 최근분 유지 3쌍 (#635→#747, #175→#293, #595→#736)
  'git-push-non-fast-forward-failed-to-push-거절-안전하게-해결하기':
    'git-push-거부-non-fast-forward-remote-contains-work-해결법',
  '심층-분석-대규모-rag-시스템-성능-극대화-벡터-db-최적화-프레임워크-가이드':
    '실전-가이드-rag-성능-병목-지점-3가지-진단-및-운영-레벨-최적화-로드맵',
  'git-permission-denied-publickey-에러-해결-ssh-키부터-다중계정까지':
    'ssh-permission-denied-publickey-원인해결-5분-진단-ec2',
  // 2026-09-15: 고신뢰 404 중복
  // nginx 502: 2026-09-18 결정대로 엔지니어 가이드가 정본. 예전에는 next.config redirects()의
  // 한글 source가 매칭되지 않아 #742 URL이 404였고, 아래 두 항목은 308→404로 이어졌다(2026-10-06 수정).
  'nginx-502-bad-gateway-원인-7가지와-errorlog-5분-진단법':
    '/engineer/nginx-502-bad-gateway-fix',
  'nginx-502-bad-gateway-원인별-진단-및-근본-해결-방법-가이드':
    '/engineer/nginx-502-bad-gateway-fix',
  'nginx-502-bad-gateway-원인-진단표복붙-명령어로-5분-해결': // #742 (draft)
    '/engineer/nginx-502-bad-gateway-fix',
  'crashloopbackoff-해결-pod-재시작-원인-7가지exit-code-진단법':
    'crashloopbackoff-해결-pod-무한-재시작-7가지-원인-진단법',
  'k8s-forbidden-에러-원인부터-serviceaccountrbac-디버깅까지-완벽-가이드':
    'k8s-forbidden-오류-rbac부터-serviceaccount까지-5단계로-완벽-진단하는-방법',
  'llm-환각-현상-완벽-해결-가이드-rag검색-증강-생성-아키텍처-완벽-분석':
    'llm-환각-현상-완벽-해결-가이드-rag검색-증강-생성-원리부터-실습까지',
  '단일-llm-호출의-한계를-넘어서-multi-agent-systemmas-아키텍처-완벽-가이드':
    '단순-호출을-넘어선-시스템-설계-multi-agent-systemmas-완벽-가이드',

  // 2026-10-06 중복 묶음 정리 (docs/adsense-audit/dedupe-2026-10-06.md) — 구 slug → 유지 slug
  // CrashLoopBackOff → #590
  'crashloopbackoff-해결-kubectl로-pod-재시작-무한루프-5분-진단': // #746
    'crashloopbackoff-해결-pod-무한-재시작-7가지-원인-진단법',
  'kubernetes-crashloopbackoff-원인-7가지-종료코드로-5분-진단': // #664
    'crashloopbackoff-해결-pod-무한-재시작-7가지-원인-진단법',
  // ImagePullBackOff → #743
  'imagepullbackofferrimagepull-원인-6가지-진단해결-가이드': // #588
    'imagepullbackofferrimagepull-해결-events로-원인-진단하고-복붙으로-끝내기',
  'imagepullbackoffx509unauthorized-사설-레지스트리-에러-5분-진단': // #669
    'imagepullbackofferrimagepull-해결-events로-원인-진단하고-복붙으로-끝내기',
  'imagepullbackofferrimagepull-5분-진단-events-메시지로-원인-6가지-잡기': // #651 (draft)
    'imagepullbackofferrimagepull-해결-events로-원인-진단하고-복붙으로-끝내기',
  // ISMS-P → #778
  '2026-isms-p-인증-준비-체크리스트-102개-항목빈출-결함-실무-가이드': // #589
    '2026-isms-p-인증-준비-체크리스트-의무대상절차비용-총정리',
  'isms-p-인증-준비-심사에서-가장-많이-걸리는-결함-7가지와-체크리스트': // #657
    '2026-isms-p-인증-준비-체크리스트-의무대상절차비용-총정리',
  'isms-p-인증-심사-준비-체크리스트-2026-신청부터-결함-보완까지': // #650 (draft)
    '2026-isms-p-인증-준비-체크리스트-의무대상절차비용-총정리',
  // OOMKilled → #752
  'oomkilled-exit-code-137-해결-pod-메모리-limit-진단부터-튜닝까지': // #603
    'oomkilled-exit-code-137-해결-kubectl-30초-진단5분-복구-런북',
  // CSAP → #665
  'csap-인증-2026-가이드-하중상-등급-차이와-신청-절차-총정리': // #734
    '2026-csap-간편등급-준비-체크리스트-공공-saas-실전-가이드',
  // 전자금융감독규정 망분리 → #604
  '전자금융감독규정-클라우드망분리-실무-준비-가이드중요도평가보고기한': // #792
    '2026-전자금융감독규정-클라우드-망분리-예외-적용-실무-가이드',
  '금융권-클라우드-도입-4단계-망분리-예외csp평가금감원-사전보고-가이드2026': // #698
    '2026-전자금융감독규정-클라우드-망분리-예외-적용-실무-가이드',
  // Kubernetes Endpoints → #805 (가이드 /engineer/kubernetes-endpoints-none-fix는 그대로)
  'kubectl-get-endpoints-noneservice-connection-refused-5분-진단': // #667
    'endpoints-noneno-endpoints-available-7가지-원인과-30초-진단법',

  // 2026-10-06 2차 중복 정리 (docs/adsense-audit/dedupe-plan-round2-2026-10-06.md) — 구 slug → 유지 slug
  // Docker 권한 → #740
  'docker-permission-denied-해결-daemon-socket-에러-sudo-없이-끝내기': // #592
    'docker-permission-denied-varrundockersock-에러-5분-해결법',
  // systemd 재시작 → #597
  'systemd-restartalwayson-failure-예제와-무한재시작-방지법': // #782
    'systemd-자동-재시작-가이드-restartalways-vs-on-failure와-start-limit-hit-해결',
  // Python pip 버전 없음 → #692
  '파이썬-의존성-충돌-해결-venv부터-poetry까지-완벽-환경-구축-로드맵': // #732
    'python-could-not-find-a-version-that-satisfies-에러-의존성-충돌-완벽-해결-가이드-pippoetry',
  // PVC Pending → #629
  'kubernetes-pvc-pending-문제-storageclass-매칭-실패-원인부터-완벽-디버깅-가이드': // #713
    'kubernetes-pvc-pending-안-풀릴-때-원인-6가지-5분-진단-가이드',
  'k8s-pvc-pending-해결-가이드-바인딩-실패-원인-5가지-완벽-진단법': // #673
    'kubernetes-pvc-pending-안-풀릴-때-원인-6가지-5분-진단-가이드',
  '쿠버네티스-pvc-pending-원인-분석-storageclass부터-csi-바인딩-실패-완벽-진단-가이드': // #809
    'kubernetes-pvc-pending-안-풀릴-때-원인-6가지-5분-진단-가이드',
  // CORS → #600
  'cors-에러-해결-콘솔-에러-원문별-진단표-서버별-복붙-설정': // #744
    'cors-no-access-control-allow-origin-에러-5분-진단해결-코드',
  // PKIX → #791
  'pkix-path-building-failed-해결법-keytool-cacerts-import-5분-가이드': // #630
    'pkix-path-building-failed-suncertpathbuilderexception-30분-해결-런북',
  // Too many open files → #606
  'too-many-open-filesemfile-errno-24-30초-진단복구-런북': // #781
    'too-many-open-files-해결-ulimitlimitsconfsystemd-limitnofile-실전',
  // npm ERESOLVE → #620
  'npm-err-code-eresolve-해결법-에러-원문-복붙-진단-런북': // #755
    'npm-eresolve-unable-to-resolve-dependency-tree-원인별-해결법',
  // PostgreSQL too many clients → #788
  'postgresql-too-many-clients-already-5분-진단부터-pgbouncer-해결까지': // #599
    'postgresql-too-many-clients-already-30초-판정-복구-런북',
  // Redis OOM → #704
  'redis-oom-command-not-allowed-에러-5분-진단복구-가이드': // #612
    'redis-oom-에러used-memory-maxmemory-5분-응급처치-가이드',
  // SSH 연결 끊김 → #640
  'ssh-connection-closed-by-remote-host-에러-원문별-트러블슈팅': // #765
    'ssh-connection-closedreset-by-peer-5분-진단복구-fail2banmaxstartups',
  // SELinux → #626
  'selinux-avc-denied-30초-진단-런북-nginxhttpd-접근-거부-해결': // #775
    'selinux-permission-denied-해결법-chmod-정상인데-막힐-때avc-denied',
  // kubectl Unauthorized → #641
  'kubectl-unauthorized-원인별-3분-진단복구-런북-eks-재발급': // #767
    'kubectl-unauthorizedyou-must-be-logged-in-401-해결-6가지',
  // certbot 갱신 → #608
  'certbot-renew-실패neterrcertdateinvalid-30분-복구-가이드': // #738
    'certbot-갱신-실패-해결-certificate-expired-원인별-트러블슈팅',
  // K8s 네트워크/MTU → #690
  '쿠버네티스-네트워크-지연-cni-오버헤드부터-ebpf까지-근본-원인-진단-가이드': // #689
    'kubernetes-네트워크-지연-ebpf로-근본-원인-진단하고-성능-최적화하는-완벽-가이드',
  // Java OOM → #770
  'javalangoutofmemoryerror-java-heap-space-30분-진단해결-가이드': // #610
    'outofmemoryerror-5계열-30초-진단-런북-heap-space-vs-metaspace-복구-명령',
  // No space left on device → #795
  'no-space-left-on-device-해결-df-inode-docker-5분-진단': // #601
    'no-space-left-on-device-30초-판정-런북-df에-용량-남았는데-안-될-때',
};

/** 맵 값 → 사이트 내부 경로(로케일 접두사 없음). */
export function postRedirectPath(target: string): string {
  return target.startsWith('/') ? target : `/blog/${encodeURIComponent(target)}`;
}
