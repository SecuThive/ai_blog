import { containsHangul } from './display';

/** Longest-first glossary for leftover Hangul in English bodies, mermaid labels, and comments. */
const GLOSSARY = [
  ['클라이언트에서 실행: 사용자·주소·포트 교체', 'run on the client: replace user, host, and port'],
  ['배포판에 따라 서비스 이름은 ssh 또는 sshd', 'service name is ssh or sshd depending on the distro'],
  ['예시 주소: 실제 차단 IP로 교체', 'example address: replace with the IP you want to block'],
  ['키와 인증서가 같은 쌍인지 (두 해시가 같아야 정상)', 'key and cert must be a pair (hashes must match)'],
  ['docker CLI를 그대로 쓰고 싶을 때: 소켓 경로를 환경변수로 지정', 'to keep using the docker CLI: set the socket path as an env var'],
  ['이전 버전으로 심볼릭 링크 되돌리기', 'restore the symlink to the previous version'],
  ['롤백 전 증적 보존 (필수)', 'keep evidence before rollback (required)'],
  ['반영 확인 — 소켓 지문 재확인', 'confirm it applied — recheck the socket fingerprint'],
  ['Server 섹션이 표시되면 성공', 'success if the Server section is shown'],
  ['containerd 백엔드 사용 시', 'when using the containerd backend'],
  ['podman 백엔드로 응답', 'answers via the podman backend'],
  ['Podman 소켓을 표준 경로로 심볼릭 링크', 'symlink the Podman socket to the standard path'],
  ['Testcontainers 전용 설정', 'Testcontainers-only settings'],
  ['볼륨 백업 (볼륨명 my_data 예시)', 'volume backup (example volume name: my_data)'],
  ['바인드 마운트 파일 I/O 측정', 'bind-mount file I/O measurement'],
  ['빌드 시간 측정 (캐시 없이)', 'build-time measurement (no cache)'],
  ['인증서 조회 실패 (접속/핸드셰이크 오류)', 'certificate lookup failed (connect/handshake error)'],
  ['날짜 파싱 실패', 'date parse failed'],
  ['이미 만료됨', 'already expired'],
  ['인증서 만료 경고 발생', 'certificate expiry warning'],
  ['개인키는 절대 커밋 금지', 'never commit the private key'],
  ['공개키 확인', 'check the public key'],
  ['복수 수신자로 키 분실 대비', 'multiple recipients in case a key is lost'],
  ['또는 훅 파일로 고정', 'or pin it with a hook file'],
  ['매니페스트 방식', 'manifest method'],
  ['buildkit 직접 사용', 'use buildkit directly'],
  ['중요한 이미지 아카이브', 'archive important images'],
  ['이미지 목록 저장', 'save the image list'],
  ['파일 쪽 지문', 'fingerprint on the file'],
  ['소켓 쪽 지문', 'fingerprint on the socket'],
  ['체인 검증', 'verify the chain'],
  ['기대 출력', 'expected output'],
  ['확인 필수', 'must confirm'],
  ['전용 설정', 'dedicated settings'],
  ['심볼릭 링크', 'symlink'],
  ['표준 경로', 'standard path'],
  ['또는 colima', 'or colima'],
  ['일 남음', 'days left'],
  ['인증서', 'certificate'],
  ['만료', 'expiry'],
  ['경고', 'warning'],
  ['실패', 'failed'],
  ['백업', 'backup'],
  ['예시', 'example'],
  ['볼륨명', 'volume name'],
  ['계열', 'stack'],
  ['또는', 'or'],
  ['백엔드', 'backend'],
  ['지문', 'fingerprint'],
  ['교체', 'replace'],
  ['확인', 'check'],
  ['필수', 'required'],
  ['직접 사용', 'use directly'],
  ['소켓', 'socket'],
  ['경로', 'path'],
  ['지정', 'set'],
  ['응답', 'reply'],
  ['사용 시', 'when using'],
  ['표시되면 성공', 'shown means success'],
  ['섹션이', 'section'],
  ['쓰고 싶을 때', 'if you want to keep using it'],
  ['그대로', 'as-is'],
  ['환경변수로', 'as an env var'],
  ['심볼릭', 'symbolic'],
  ['링크', 'link'],
  ['전용', 'dedicated'],
  ['설정', 'settings'],
  ['방식', 'method'],
  ['매니페스트', 'manifest'],
  ['캐시 없이', 'without cache'],
  ['없이', 'without'],
  ['목록', 'list'],
  ['중요한', 'important'],
  ['아카이브', 'archive'],
  ['후', 'after'],
  ['시', 'when'],
  ['를', ''],
  ['로', ''],
  ['은', ''],
  ['는', ''],
  ['이', ''],
  ['가', ''],
  ['을', ''],
  ['의', ''],
  ['에', ''],
  ['와', ''],
  ['과', ''],
  ['도', ''],
  ['만', ''],
  ['부터', 'from'],
  ['까지', 'to'],
  ['위해', 'for'],
  ['때', 'when'],
  ['됨', ''],
  ['음', ''],
  ['함', ''],
  ['임', ''],
  ['됨', ''],
  ['오케스트레이터/워크플로우 엔진', 'Orchestrator / workflow engine'],
  ['K8s Cluster에 배포 및 동기화', 'Deploy and sync to the K8s cluster'],
  ['최종 성능 지표 대시보드', 'Final metrics dashboard'],
  ['데이터 재검토 및 편향 제거', 'Review data and remove bias'],
  ['데이터 전처리 및 정규화', 'Preprocess and normalize data'],
  ['표준화된 JSON 응답', 'Standardized JSON response'],
  ['콜드 부팅 체감 측정', 'Cold-boot feel test'],
  ['도구 종료 후 실행', 'run after quitting the tool'],
  ['바인드 마운트 파일 측정', 'Bind-mount file measurement'],
  ['캐시 없이 이미지', 'Image without cache'],
  ['사용자 요청/이벤트', 'User request / event'],
  ['사용자 요청 접수', 'Receive user request'],
  ['질문 의도 일치도', 'Intent match score'],
  ['Context 기반 검증', 'Context-based check'],
  ['거부/경고 메시지 반환', 'Return deny / warning'],
  ['프롬프트 최적화/검색', 'Prompt optimize / retrieve'],
  ['출력 검증/후처리', 'Validate / post-process output'],
  ['최종 사용자 응답', 'Final user response'],
  ['오류 메시지 반환', 'Return error message'],
  ['데이터 조회 요청', 'Data lookup request'],
  ['재고 상태 판단', 'Judge inventory state'],
  ['대체재 검색', 'Search substitutes'],
  ['최종 결과 반환', 'Return final result'],
  ['데이터 수집/전처리', 'Collect / preprocess data'],
  ['배포 및 모니터링', 'Deploy and monitor'],
  ['이상 감지/제어 로직', 'Anomaly detection / control'],
  ['개발자 코드 커밋', 'Developer code commit'],
  ['질문/답변 쌍', 'Q&A pair'],
  ['Task List 생성', 'Build task list'],
  ['AI-OT 게이트웨이', 'AI-OT gateway'],
  ['현장 제어기', 'Field controller'],
  ['클라우드/MES', 'Cloud / MES'],
  ['모델 선택', 'Model selection'],
  ['모델 학습', 'Train model'],
  ['주문 확정', 'Confirm order'],
  ['평가 모듈', 'Eval module'],
  ['결과 데이터', 'Result data'],
  ['실행/데이터', 'Execute / data'],
  ['지능/추론', 'Intelligence / reasoning'],
  ['최종 응답 생성', 'Generate final response'],
  ['사용자 입력', 'User input'],
  ['외부 요청', 'External request'],
  ['외부 API/DB 호출', 'External API / DB call'],
  ['LLM 호출', 'LLM call'],
  ['호출', 'call'],
  ['외부', 'external'],
  ['레거시 시스템', 'Legacy system'],
  ['Vector DB 검색', 'Vector DB search'],
  ['Query 입력', 'Query input'],
  ['요금 비교', 'pricing comparison'],
  ['실전 계산', 'worked example'],
  ['시나리오', 'scenario'],
  ['아키텍처', 'architecture'],
  ['흐름도', 'flowchart'],
  ['개념도', 'concept diagram'],
  ['사용자', 'User'],
  ['요청', 'Request'],
  ['결과', 'Result'],
  ['측정', 'measure'],
  ['빌드 시간', 'build time'],
  ['이미지 목록', 'image list'],
  ['저장', 'save'],
  ['중요한', 'important'],
  ['아카이브', 'archive'],
  ['볼륨', 'volume'],
  ['파일', 'file'],
  ['실행', 'run'],
  ['종료', 'quit'],
  ['도구', 'tool'],
  ['체감', 'feel'],
  ['부팅', 'boot'],
  ['콜드', 'cold'],
  ['비교', 'compare'],
  ['요금', 'pricing'],
] as [string, string][];
GLOSSARY.sort((a, b) => b[0].length - a[0].length);

export function translateHangulText(input: string): string {
  if (!containsHangul(input)) return input;
  let out = input;
  for (const [ko, en] of GLOSSARY) {
    if (out.includes(ko)) out = out.split(ko).join(en);
  }
  // Drop leftover Hangul so EN pages never show Korean glyphs.
  out = out.replace(/[가-힣]+/g, '');
  out = out.replace(/\([ \t]*\)/g, '');
  out = out.replace(/[ \t]{2,}/g, ' ');
  return out.trimEnd();
}

/** Translate Hangul in code (comments, echo strings) for English pages. */
export function translateCodeForEnglish(code: string): string {
  if (!containsHangul(code)) return code;
  return code.split('\n').map((line) => translateHangulText(line).replace(/[ \t]+$/g, '')).join('\n');
}

export function translateMermaid(source: string): string {
  let out = translateHangulText(source);
  // Nested () inside mermaid node shapes breaks the parser.
  out = out.replace(/\{([^{}]+)\}/g, (_m, label: string) => `{${label.replace(/[()]/g, '')}}`);
  out = out.replace(/\[([^\[\]]+)\]/g, (_m, label: string) => `[${label.replace(/[()]/g, '')}]`);
  out = out.replace(/\(([^()]+)\)/g, (_m, label: string) => `(${label.replace(/[{}[\]]/g, '')})`);
  return out;
}

/** Translate leftover Hangul in English markdown without breaking hrefs or images. */
export function sanitizeEnglishMarkdown(md: string): string {
  if (!md || !containsHangul(md)) return md;
  const chunks = md.split(/(```[\s\S]*?```)/g);
  return chunks.map((chunk) => {
    const fence = chunk.match(/^```(\w*)[^\n]*\n?([\s\S]*?)```$/);
    if (fence) {
      const lang = fence[1];
      const body = fence[2];
      if (lang === 'mermaid') {
        return '```mermaid\n' + translateMermaid(body).trimEnd() + '\n```';
      }
      return '```' + lang + '\n' + translateCodeForEnglish(body).trimEnd() + '\n```';
    }
    return sanitizeMarkdownText(chunk);
  }).join('');
}

function sanitizeMarkdownText(text: string): string {
  // Preserve markdown destinations: ](url) and bare /blog/한글-slug
  const parts = text.split(/(\[[^\]]*\]\([^)]+\)|https?:\/\/\S+)/g);
  return parts.map((part) => {
    if (part.startsWith('[') && part.includes('](')) {
      const m = part.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
      if (!m) return part;
      return `[${translateHangulText(m[1])}](${m[2]})`;
    }
    if (part.startsWith('http')) return part;
    return translateHangulText(part);
  }).join('');
}


