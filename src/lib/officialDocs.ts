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
