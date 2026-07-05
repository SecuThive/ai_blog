/**
 * AI 블로그 글 자동 생성 스크립트
 * 보안(10편) + 인프라(10편) 카테고리 글을 Claude API로 생성 후 DB에 업로드합니다.
 *
 * 사전 준비:
 *   .env.local에 ANTHROPIC_API_KEY 추가
 *
 * 실행:
 *   npx tsx scripts/generate-posts.ts
 *   npx tsx scripts/generate-posts.ts --dry-run   # DB 저장 없이 출력만
 *   npx tsx scripts/generate-posts.ts --limit=3   # 3편만 생성
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const BLOG_API_KEY  = process.env.BLOG_API_KEY ?? '';
const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

if (!ANTHROPIC_KEY) { console.error('❌ ANTHROPIC_API_KEY가 .env.local에 없습니다.'); process.exit(1); }
if (!BLOG_API_KEY)  { console.error('❌ BLOG_API_KEY가 .env.local에 없습니다.');  process.exit(1); }

const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT   = (() => { const m = args.find(a => a.startsWith('--limit=')); return m ? parseInt(m.split('=')[1]) : 999; })();

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ──────────────────────────────────────────────────────────────────────────
// 생성할 주제 목록
// ──────────────────────────────────────────────────────────────────────────

interface Topic {
  category: '보안' | '인프라';
  title: string;
  tags: string[];
  author: string;
  agent_role: string;
}

const TOPICS: Topic[] = [
  // ── 보안 ────────────────────────────────────────────────────────────────
  {
    category: '보안',
    title: '제로트러스트(Zero Trust) 보안 아키텍처 완전 가이드: 개념부터 실전 구축까지',
    tags: ['제로트러스트', '보안아키텍처', 'IAM', 'ZTNA', '네트워크보안'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: '2025년 랜섬웨어 공격 트렌드와 기업 대응 전략 총정리',
    tags: ['랜섬웨어', '사이버위협', '보안대응', 'EDR', '백업전략'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: 'SIEM 도입 실전 가이드: 선택 기준부터 운영 노하우까지',
    tags: ['SIEM', 'SOC', '보안관제', '로그분석', 'SOAR'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: '클라우드 환경 IAM 설계 모범 사례: AWS·Azure·GCP 비교',
    tags: ['IAM', '클라우드보안', 'AWS', 'Azure', '최소권한원칙'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: 'OWASP API Security Top 10: 실전 취약점 분석과 방어 코드',
    tags: ['OWASP', 'API보안', '취약점', '웹보안', 'DevSecOps'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: '내부자 위협(Insider Threat) 탐지 시스템 구축 방법',
    tags: ['내부자위협', 'DLP', 'UEBA', '행위분석', '보안모니터링'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: '공급망 보안(Supply Chain Security)과 SBOM 관리 전략',
    tags: ['공급망보안', 'SBOM', 'SCA', '오픈소스보안', '소프트웨어보안'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: 'DevSecOps 파이프라인 구축 실전: CI/CD에 보안 자동화 통합하기',
    tags: ['DevSecOps', 'CI/CD', 'SAST', 'DAST', '보안자동화'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: '기업 취약점 관리 프로그램(VMP) 구축과 운영 가이드',
    tags: ['취약점관리', '패치관리', 'CVE', '위험평가', '보안운영'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },
  {
    category: '보안',
    title: 'AI 시대의 새로운 보안 위협: LLM 공격 패턴과 방어 전략',
    tags: ['AI보안', 'LLM보안', '프롬프트인젝션', 'AI위협', '생성AI보안'],
    author: 'Security Analyst',
    agent_role: 'security_analyst',
  },

  // ── 인프라 ──────────────────────────────────────────────────────────────
  {
    category: '인프라',
    title: 'Kubernetes 프로덕션 클러스터 구축 완전 가이드: 설계부터 운영까지',
    tags: ['Kubernetes', 'K8s', '컨테이너', '클러스터운영', 'DevOps'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: 'AWS vs Azure vs GCP 2025: 워크로드별 클라우드 선택 완전 비교',
    tags: ['AWS', 'Azure', 'GCP', '멀티클라우드', '클라우드비교'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: 'Terraform으로 인프라 코드화(IaC) 실전: 모듈 설계부터 상태 관리까지',
    tags: ['Terraform', 'IaC', '인프라자동화', 'DevOps', 'GitOps'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: 'GitOps와 ArgoCD로 쿠버네티스 배포 완전 자동화하기',
    tags: ['GitOps', 'ArgoCD', 'Kubernetes', 'CD', '배포자동화'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: '클라우드 비용 최적화 전략: 실전 절감 기법 10가지',
    tags: ['클라우드비용', 'FinOps', 'AWS비용', '비용최적화', '리소스관리'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: '서비스 메시 완전 정복: Istio vs Linkerd vs Cilium 비교',
    tags: ['서비스메시', 'Istio', 'Linkerd', 'Cilium', '마이크로서비스'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: '온프레미스에서 클라우드 마이그레이션 로드맵: 단계별 전략 가이드',
    tags: ['클라우드마이그레이션', '리프트앤시프트', '클라우드전환', 'AWS마이그레이션', '인프라전환'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: '멀티 클라우드 아키텍처 설계 원칙과 실전 운영 전략',
    tags: ['멀티클라우드', '하이브리드클라우드', '클라우드아키텍처', '가용성', '재해복구'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: '컨테이너 이미지 보안: 빌드부터 런타임까지 완전 강화 가이드',
    tags: ['컨테이너보안', 'Docker', '이미지스캐닝', 'Trivy', 'SBOM'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
  {
    category: '인프라',
    title: '서버리스(Serverless) 아키텍처 실전 도입 가이드: 언제, 어떻게 쓸까',
    tags: ['서버리스', 'Lambda', 'CloudFunctions', 'FaaS', '이벤트드리븐'],
    author: 'Infrastructure Engineer',
    agent_role: 'infra_engineer',
  },
];

// ──────────────────────────────────────────────────────────────────────────
// 글 생성
// ──────────────────────────────────────────────────────────────────────────

async function generateContent(topic: Topic): Promise<{ content: string; excerpt: string }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `당신은 IT 전문 미디어 Nodelog의 기술 에디터입니다. AI가 초안을 쓰고 사람이 검토하는 매체이므로, 아래 규칙을 어기면 발행이 자동 보류됩니다.

아래 주제로 실무 기술 가이드를 작성해주세요.

제목: ${topic.title}
카테고리: ${topic.category}
태그: ${topic.tags.join(', ')}

## 필수 구조 (docs/CONTENT_TEMPLATE.md 기준)
1. 적용 상황 — 어떤 문제/에러일 때 이 글을 쓰는지 (에러 메시지 원문 포함)
2. 적용 범위 — 제품·OS·버전 명시 (예: PostgreSQL 14–16, Ubuntu 22.04)
3. 사전 확인·백업 — 작업 전 위험 요소
4. 진단 순서 — 원인을 좁혀가는 단계별 절차
5. 명령어/코드 — 복사해 바로 실행 가능한 코드블록 (언어 지정 필수: \`\`\`bash 등)
6. 예상 정상 결과 — 각 명령 성공 시 출력 예
7. 실패 시 분기 — 다른 출력이 나올 때의 다음 단계
8. 영구 해결 + 임시 조치의 위험
9. 재발 방지
10. 검증 환경 — 실제 확인 환경. 미확인이면 "공식 문서 기준" 명시
11. 공식 참고 자료 — 실제 존재하는 공식 문서 URL만 (모르면 섹션 생략, 지어내지 말 것)

## 절대 금지
- 본문에 H1(\`# \`) 사용 금지 — \`##\`부터 시작 (제목은 별도 필드)
- 확인 불가능한 1인칭 경험 서술 금지: "제가 직접", "저희 팀에서는", "제가 겪은/본",
  "직접 테스트한 결과", "장애의 N%" — 대신 "실무에서 가장 자주 보고되는 원인은…",
  "공식 문서 기준으로…" 같은 객관적 표현 사용
- 출처 없는 확정 수치(벌금·비율·기한·법적 의무) 금지
- 존재하지 않는 URL·문서 인용 금지

## 형식
- 마크다운 (##, ### 헤더), 한국어, 3000자 이상
- 표(비교/의사결정표) 1개 이상 포함
- 전문적이지만 읽기 쉬운 문체

글 본문만 출력하세요.`,
      },
    ],
  });

  const content = response.content[0].type === 'text' ? response.content[0].text : '';
  const excerpt = content.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim().slice(0, 200) + '…';

  return { content, excerpt };
}

async function publishPost(topic: Topic, content: string, excerpt: string): Promise<void> {
  const res = await fetch(`${SITE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BLOG_API_KEY,
    },
    body: JSON.stringify({
      title: topic.title,
      content,
      excerpt,
      category: topic.category,
      tags: topic.tags,
      author: topic.author,
      agent_role: topic.agent_role,
      status: 'published',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API 오류 (${res.status}): ${err}`);
  }

  const json = await res.json();
  // 서버 가드(중복 주제·금지 표현)에 걸리면 발행되지 않고 draft로 보류된다.
  if (json.held_as_draft) {
    console.log(`  ⚠️ 발행 보류(draft) — ${json.reason}`);
    if (json.duplicate_of) console.log(`     중복 대상: ${json.duplicate_of.title}`);
    return;
  }
  console.log(`  ✅ 업로드 완료 — slug: ${json.post.slug}`);
}

/** 주제 선정 전 사전 중복 체크 — 이미 다룬 주제는 생성 자체를 건너뛴다 */
async function fetchCoveredTitles(): Promise<string[]> {
  try {
    const res = await fetch(`${SITE_URL}/api/posts/covered-topics`, {
      headers: { 'x-api-key': BLOG_API_KEY },
    });
    if (!res.ok) return [];
    const { topics } = await res.json();
    return (topics ?? []).map((t: { title: string }) => t.title.toLowerCase());
  } catch { return []; }
}

function isCovered(title: string, covered: string[]): boolean {
  const toks = new Set(title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(w => w.length > 1));
  for (const c of covered) {
    const ct = new Set(c.replace(/[^a-z0-9가-힣\s]/g, ' ').split(/\s+/).filter(w => w.length > 1));
    let inter = 0; for (const x of toks) if (ct.has(x)) inter++;
    if (inter / (toks.size + ct.size - inter || 1) >= 0.5) return true;
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  // 주제 선정 전 사전 중복 체크 — 이미 발행된 주제는 생성 자체를 건너뛴다
  const covered = await fetchCoveredTitles();
  const skipped = TOPICS.filter(t => isCovered(t.title, covered));
  skipped.forEach(t => console.log(`⏭  이미 다룬 주제 건너뜀: ${t.title}`));
  const targets = TOPICS.filter(t => !isCovered(t.title, covered)).slice(0, LIMIT);
  console.log(`\n📝 총 ${targets.length}편 생성 시작 (건너뜀 ${skipped.length}편, ${DRY_RUN ? 'DRY RUN' : '실제 저장'})\n`);

  let success = 0;
  let fail = 0;

  for (const [i, topic] of targets.entries()) {
    console.log(`[${i + 1}/${targets.length}] ${topic.category} — ${topic.title}`);
    try {
      const { content, excerpt } = await generateContent(topic);
      if (DRY_RUN) {
        console.log(`  📄 미리보기 (${content.length}자):\n${excerpt}\n`);
      } else {
        await publishPost(topic, content, excerpt);
        success++;
      }
    } catch (e) {
      console.error(`  ❌ 실패:`, e);
      fail++;
    }

    // API rate limit 방지
    if (i < targets.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n✨ 완료 — 성공: ${success}편, 실패: ${fail}편\n`);
}

main();
