/**
 * 주제(태그·제목 키워드) → 공식 1차 문서 매핑.
 * 글 하단 "관련 공식 문서" 박스에서 사용 — 독자가 확정적 판단 전에 반드시
 * 확인해야 할 공식 출처를 연결한다. (검증된 공식 URL만 등록할 것.)
 */
export interface OfficialDoc {
  name: string;
  url: string;
}

const DOCS: { match: RegExp; docs: OfficialDoc[] }[] = [
  { match: /kubernetes|k8s|kubectl|파드|pod|ingress|crashloopbackoff/i, docs: [
    { name: 'Kubernetes 공식 문서', url: 'https://kubernetes.io/ko/docs/home/' },
  ]},
  { match: /docker|컨테이너|dockerfile|docker[- ]?compose/i, docs: [
    { name: 'Docker 공식 문서', url: 'https://docs.docker.com/' },
  ]},
  { match: /\bgit\b|git\s|깃|github actions/i, docs: [
    { name: 'Git 공식 문서', url: 'https://git-scm.com/doc' },
  ]},
  { match: /redis/i, docs: [
    { name: 'Redis 공식 문서', url: 'https://redis.io/docs/latest/' },
  ]},
  { match: /postgres|postgresql|pgbouncer/i, docs: [
    { name: 'PostgreSQL 공식 문서', url: 'https://www.postgresql.org/docs/' },
  ]},
  { match: /mysql/i, docs: [
    { name: 'MySQL 공식 매뉴얼', url: 'https://dev.mysql.com/doc/' },
  ]},
  { match: /mongodb/i, docs: [
    { name: 'MongoDB 공식 매뉴얼', url: 'https://www.mongodb.com/ko-kr/docs/' },
  ]},
  { match: /terraform/i, docs: [
    { name: 'Terraform 공식 문서', url: 'https://developer.hashicorp.com/terraform/docs' },
  ]},
  { match: /\baws\b|ec2|s3|lambda|dynamodb/i, docs: [
    { name: 'AWS 공식 문서', url: 'https://docs.aws.amazon.com/' },
  ]},
  { match: /azure/i, docs: [
    { name: 'Microsoft Azure 공식 문서', url: 'https://learn.microsoft.com/ko-kr/azure/' },
  ]},
  { match: /\bgcp\b|google cloud/i, docs: [
    { name: 'Google Cloud 공식 문서', url: 'https://cloud.google.com/docs?hl=ko' },
  ]},
  { match: /nginx/i, docs: [
    { name: 'NGINX 공식 문서', url: 'https://nginx.org/en/docs/' },
  ]},
  { match: /linux|리눅스|bash|shell|crontab|systemd|ssh/i, docs: [
    { name: 'GNU/Linux man 페이지', url: 'https://man7.org/linux/man-pages/' },
  ]},
  { match: /python|파이썬/i, docs: [
    { name: 'Python 공식 문서', url: 'https://docs.python.org/ko/3/' },
  ]},
  { match: /node\.?js|npm\b/i, docs: [
    { name: 'Node.js 공식 문서', url: 'https://nodejs.org/docs/latest/api/' },
  ]},
  { match: /\bjava\b|jvm|jdk|spring|maven|gradle|outofmemory|heap space|metaspace|class file/i, docs: [
    { name: 'Oracle Java 공식 문서', url: 'https://docs.oracle.com/en/java/' },
  ]},
  { match: /spring[- ]?boot/i, docs: [
    { name: 'Spring Boot 공식 문서', url: 'https://docs.spring.io/spring-boot/index.html' },
  ]},
  { match: /openai|gpt|chatgpt/i, docs: [
    { name: 'OpenAI 공식 문서', url: 'https://platform.openai.com/docs' },
  ]},
  { match: /claude|anthropic/i, docs: [
    { name: 'Anthropic 공식 문서', url: 'https://docs.claude.com/' },
  ]},
  { match: /langchain/i, docs: [
    { name: 'LangChain 공식 문서', url: 'https://python.langchain.com/docs/' },
  ]},
  { match: /rag|벡터\s?(db|데이터베이스)|임베딩|vector/i, docs: [
    { name: 'pgvector 공식 저장소', url: 'https://github.com/pgvector/pgvector' },
  ]},
  { match: /보안|owasp|취약점|xss|sql\s?injection|injection/i, docs: [
    { name: 'OWASP 공식 문서', url: 'https://owasp.org/' },
  ]},
  { match: /isms|kisa|개인정보보호/i, docs: [
    { name: 'KISA ISMS-P 안내', url: 'https://isms.kisa.or.kr/' },
  ]},
  { match: /web vitals|lcp|cls|성능 최적화|core web/i, docs: [
    { name: 'web.dev Core Web Vitals', url: 'https://web.dev/articles/vitals?hl=ko' },
  ]},
  { match: /kafka/i, docs: [
    { name: 'Apache Kafka 공식 문서', url: 'https://kafka.apache.org/documentation/' },
  ]},
  // ── AI/ML 운영·프레임워크 (2026-07-16 보강: 출처 부족 B급 글 커버) ──
  { match: /mlflow|mlops|llmops|모델\s?레지스트리|모델\s?서빙|experiment tracking/i, docs: [
    { name: 'MLflow 공식 문서', url: 'https://mlflow.org/docs/latest/index.html' },
  ]},
  { match: /wandb|weights\s?&?\s?biases/i, docs: [
    { name: 'Weights & Biases 공식 문서', url: 'https://docs.wandb.ai/' },
  ]},
  { match: /pinecone/i, docs: [
    { name: 'Pinecone 공식 문서', url: 'https://docs.pinecone.io/' },
  ]},
  { match: /weaviate/i, docs: [
    { name: 'Weaviate 공식 문서', url: 'https://weaviate.io/developers/weaviate' },
  ]},
  { match: /faiss/i, docs: [
    { name: 'FAISS 공식 문서', url: 'https://faiss.ai/' },
  ]},
  { match: /hugging\s?face|transformers|파인[- ]?튜닝|fine[- ]?tuning/i, docs: [
    { name: 'Hugging Face 공식 문서', url: 'https://huggingface.co/docs' },
  ]},
  { match: /\bpytorch\b|파이토치/i, docs: [
    { name: 'PyTorch 공식 문서', url: 'https://pytorch.org/docs/stable/index.html' },
  ]},
  { match: /tensorflow|텐서플로|\btflite\b|litert|엣지\s?ai|edge\s?ai|온디바이스/i, docs: [
    { name: 'Google AI Edge (LiteRT) 문서', url: 'https://ai.google.dev/edge/litert' },
  ]},
  { match: /\bonnx\b|onnx\s?runtime/i, docs: [
    { name: 'ONNX Runtime 공식 문서', url: 'https://onnxruntime.ai/docs/' },
  ]},
  { match: /fastapi/i, docs: [
    { name: 'FastAPI 공식 문서', url: 'https://fastapi.tiangolo.com/' },
  ]},
  // ── 인프라·관측성·데이터 ──
  { match: /elasticsearch|elastic\s?search|kibana|\belk\b/i, docs: [
    { name: 'Elasticsearch 공식 가이드', url: 'https://www.elastic.co/guide/index.html' },
  ]},
  { match: /istio|service\s?mesh|서비스\s?메시/i, docs: [
    { name: 'Istio 공식 문서', url: 'https://istio.io/latest/docs/' },
  ]},
  { match: /linkerd/i, docs: [
    { name: 'Linkerd 공식 문서', url: 'https://linkerd.io/docs/' },
  ]},
  { match: /prometheus|프로메테우스/i, docs: [
    { name: 'Prometheus 공식 문서', url: 'https://prometheus.io/docs/introduction/overview/' },
  ]},
  { match: /grafana|그라파나/i, docs: [
    { name: 'Grafana 공식 문서', url: 'https://grafana.com/docs/' },
  ]},
  { match: /ansible|앤서블|플레이북|playbook/i, docs: [
    { name: 'Ansible 공식 문서', url: 'https://docs.ansible.com/' },
  ]},
  { match: /\bvault\b|시크릿\s?관리|secrets?\s?관리/i, docs: [
    { name: 'HashiCorp Vault 공식 문서', url: 'https://developer.hashicorp.com/vault/docs' },
  ]},
  { match: /apache\s?spark|\bspark\b/i, docs: [
    { name: 'Apache Spark 공식 문서', url: 'https://spark.apache.org/docs/latest/' },
  ]},
  { match: /airflow|에어플로/i, docs: [
    { name: 'Apache Airflow 공식 문서', url: 'https://airflow.apache.org/docs/' },
  ]},
  // ── 인증서·암호화 (PKIX·SSL/TLS 계열 출처 보강) ──
  { match: /openssl|인증서|certificate|\bssl\b|\btls\b|pkix|x509|keytool|cacerts|suncertpath/i, docs: [
    { name: 'OpenSSL 공식 문서', url: 'https://docs.openssl.org/master/' },
  ]},
  // ── 컴플라이언스·보안·법령 1차출처 (정부·기관 원문, 2026-07-16 보강) ──
  { match: /ai act|eu ai|글로벌 ai 규제|인공지능.{0,4}규제|ai\s?규제/i, docs: [
    { name: 'EU AI Act (유럽집행위 공식)', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
  ]},
  { match: /\bgdpr\b/i, docs: [
    { name: 'EU 데이터보호(GDPR) 공식', url: 'https://commission.europa.eu/law/law-topic/data-protection_en' },
  ]},
  { match: /ai rmf|모델 거버넌스|ai 거버넌스|ai 신뢰성|responsible ai|ai 편향|모델 드리프트|감사 추적/i, docs: [
    { name: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework' },
  ]},
  { match: /sbom|공급망 보안|supply chain security/i, docs: [
    { name: 'CISA SBOM (미 사이버보안청)', url: 'https://www.cisa.gov/sbom' },
  ]},
  { match: /개인정보|가명정보|프라이버시|privacy/i, docs: [
    { name: '개인정보보호위원회', url: 'https://www.pipc.go.kr/' },
  ]},
  { match: /랜섬웨어|침해대응|취약점 관리|악성코드|보안 위협|사이버 위협/i, docs: [
    { name: 'KISA 보호나라', url: 'https://www.boho.or.kr/' },
  ]},
  { match: /법령|규정|법률|전자금융|감독규정|컴플라이언스|규제 준수|망분리|csap/i, docs: [
    { name: '국가법령정보센터', url: 'https://www.law.go.kr/' },
  ]},
  { match: /보안 통제|보안 표준|보안 프레임워크|nist|보안 감사|취약점 진단/i, docs: [
    { name: 'NIST CSRC (보안 표준)', url: 'https://csrc.nist.gov/' },
  ]},
];

/** 제목·태그·카테고리에서 매칭되는 공식 문서 목록(최대 4개, 중복 제거) */
export function findOfficialDocs(title: string, tags: string[], category: string): OfficialDoc[] {
  const hay = `${title} ${tags.join(' ')} ${category}`;
  const seen = new Set<string>();
  const out: OfficialDoc[] = [];
  for (const { match, docs } of DOCS) {
    if (!match.test(hay)) continue;
    for (const d of docs) {
      if (seen.has(d.url)) continue;
      seen.add(d.url);
      out.push(d);
      if (out.length >= 4) return out;
    }
  }
  return out;
}
