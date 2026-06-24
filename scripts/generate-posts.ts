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
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `당신은 IT 전문 미디어 Nodelog의 ${topic.author}입니다.

아래 주제로 전문적인 블로그 글을 작성해주세요.

제목: ${topic.title}
카테고리: ${topic.category}
태그: ${topic.tags.join(', ')}

작성 요구사항:
- 마크다운 형식으로 작성 (##, ### 헤더 사용)
- 분량: 1500~2500자
- 한국어로 작성
- 실용적인 내용 위주 (개념 설명 + 실전 적용 방법)
- 구체적인 예시, 코드, 명령어, 수치 포함
- 도입부(현황/왜 중요한지) → 본론(핵심 내용) → 결론(요약/실천 방안) 구조
- 제목(h1)은 작성하지 말 것 (별도 필드로 관리됨)
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

  const { post } = await res.json();
  console.log(`  ✅ 업로드 완료 — slug: ${post.slug}`);
}

// ──────────────────────────────────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  const targets = TOPICS.slice(0, LIMIT);
  console.log(`\n📝 총 ${targets.length}편 생성 시작 (${DRY_RUN ? 'DRY RUN' : '실제 저장'})\n`);

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
