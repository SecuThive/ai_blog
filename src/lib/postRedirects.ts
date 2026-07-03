/**
 * 카니벌라이제이션 정리로 draft 강등된 글의 구 URL → 유지된 글 URL 매핑.
 * blog/[slug]에서 글을 못 찾으면 이 맵을 확인해 308(영구) 리다이렉트한다.
 * — 색인된 구 URL의 링크 가치를 유지 글로 이전하고, 404 누적을 방지.
 * (2026-07-03 정리분. 복구 시 해당 항목을 지울 것 — 강등 글을 재발행하면
 *  같은 slug가 다시 살아나므로 맵이 남아있으면 원문 접근이 막힌다.)
 */
export const POST_REDIRECTS: Record<string, string> = {
  // 최근 자동발행 중복 3쌍 (#756→#634, #757→#655, #759→#610)
  'git-refusing-to-merge-unrelated-histories-30초-진단복구-런북':
    'fatal-refusing-to-merge-unrelated-histories-해결법-복붙-명령어',
  'git-detected-dubious-ownership-해결법-원인복구-런북-dockerci':
    'git-detected-dubious-ownership-에러-상황별-5분-해결-가이드',
  'outofmemoryerror-java-heap-space-30초-진단복구-런북jmapmat':
    'javalangoutofmemoryerror-java-heap-space-30분-진단해결-가이드',
  // A그룹 명백 중복 6쌍
  'postgresql-too-many-clients-장애-pgbouncer로-5분-만에-복구하고-재발-막는-완벽-가이드':
    'postgresql-too-many-clients-already-5분-진단부터-pgbouncer-해결까지',
  '챗봇을-넘어-자율-시스템으로-llm-기반-ai-에이전트-완벽-가이드-개념부터-구축-로드맵까지':
    'llm-에이전트-완전-정복-단순-챗봇을-넘어-자율-작업자로-진화하는-방법',
  'terraform-error-acquiring-the-state-lock-해결법-force-unlock-안전-사용':
    'terraform-state-lock-에러-해결-force-unlockdynamodb-락-삭제',
  'l4-vs-l7-로드-밸런서-서비스-요구사항에-맞는-최적의-트래픽-분배기-선택-가이드':
    'l4-vs-l7-로드-밸런서-비교-msa-환경별-최적-선택-가이드',
  '2026-isms-p-인증-준비-체크리스트-단계별-증적일정비용-실무-가이드':
    '2026-isms-p-인증-준비-체크리스트-102개-항목빈출-결함-실무-가이드',
  'pkix-path-building-failed-해결-java-ssl-오류-30초-진단표keytool':
    'pkix-path-building-failed-해결법-keytool-cacerts-import-5분-가이드',
  // B그룹 최근분 유지 3쌍 (#635→#747, #175→#293, #595→#736)
  'git-push-non-fast-forward-failed-to-push-거절-안전하게-해결하기':
    'git-push-거부-non-fast-forward-remote-contains-work-해결법',
  '심층-분석-대규모-rag-시스템-성능-극대화-벡터-db-최적화-프레임워크-가이드':
    '실전-가이드-rag-성능-병목-지점-3가지-진단-및-운영-레벨-최적화-로드맵',
  'git-permission-denied-publickey-에러-해결-ssh-키부터-다중계정까지':
    'ssh-permission-denied-publickey-원인해결-5분-진단-ec2',
};
