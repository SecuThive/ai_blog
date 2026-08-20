// 엔지니어 가이드 5편 신규 추가 (2026-07-16)
// 기존 135편과 중복 없는 갭 주제. 본문은 scratchpad/guides/*.md 에서 읽음.
// 실행: node scripts/add-guides-2026-07-16.mjs [--apply]
//   --apply 없으면 dry-run(검증만), 있으면 실제 insert.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const md = (f) => readFileSync(`scratchpad/guides/${f}`, 'utf8').trim();

const now = new Date().toISOString();
const GUIDES = [
  {
    title: 'Ansible 기초 — 인벤토리·플레이북·모듈로 서버 자동화',
    slug: 'ansible-basics-playbook-inventory',
    summary: '에이전트 없는 Ansible로 서버 구성을 코드화합니다. 인벤토리·ad-hoc 명령·플레이북·핸들러·롤까지 멱등한 자동화의 핵심 흐름을 실전 예제로 정리합니다.',
    content: md('ansible-basics.md'),
    category: '클라우드',
    difficulty: 'intermediate',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    tags: ['ansible', 'automation', 'playbook', 'devops', 'iac'],
  },
  {
    title: 'Kubernetes RBAC 완전 가이드 — Role·RoleBinding·ServiceAccount 권한 제어',
    slug: 'kubernetes-rbac-role-serviceaccount',
    summary: 'Role·ClusterRole·바인딩·ServiceAccount로 클러스터 권한을 최소화하는 법. kubectl auth can-i 디버깅과 CI 배포용 최소권한 예제까지 정리합니다.',
    content: md('kubernetes-rbac.md'),
    category: 'Docker / 컨테이너',
    difficulty: 'advanced',
    os_compat: ['linux'],
    tags: ['kubernetes', 'rbac', 'security', 'serviceaccount', '권한'],
  },
  {
    title: 'git bisect 완전 가이드 — 버그가 처음 생긴 커밋 이진 탐색으로 찾기',
    slug: 'git-bisect-find-regression-commit',
    summary: '수백 개 커밋 속 회귀 버그의 도입 지점을 이진 탐색으로 특정합니다. 수동 bisect부터 git bisect run 자동화, 종료 코드 규칙, 커스텀 판정 스크립트까지.',
    content: md('git-bisect.md'),
    category: 'Git / CI·CD',
    difficulty: 'intermediate',
    os_compat: ['ubuntu', 'macos', 'windows'],
    tags: ['git', 'bisect', 'debugging', 'regression', '버그추적'],
  },
  {
    title: 'PostgreSQL 권한 관리 완전 가이드 — 롤·GRANT·REVOKE·스키마 권한',
    slug: 'postgresql-roles-privileges-grant',
    summary: '롤=유저이자 그룹, DB→스키마→테이블 3층 권한, DEFAULT PRIVILEGES로 미래 테이블까지. 읽기전용 계정과 최소권한을 실전 SQL로 설계합니다.',
    content: md('postgresql-privileges.md'),
    category: '데이터베이스',
    difficulty: 'intermediate',
    os_compat: ['linux'],
    tags: ['postgresql', '권한', 'role', 'grant', '보안'],
  },
  {
    title: 'keepalived VRRP 완전 가이드 — 가상 IP 페일오버로 고가용성 구성',
    slug: 'keepalived-vrrp-virtual-ip-failover',
    summary: 'VRRP로 가상 IP를 여러 노드가 공유해 마스터 장애 시 무중단 전환합니다. MASTER/BACKUP 설정, vrrp_script 헬스체크, split-brain 방지까지 실전 구성.',
    content: md('keepalived-vrrp.md'),
    category: '네트워킹 / 서버',
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    tags: ['keepalived', 'vrrp', '고가용성', 'ha', '가상ip'],
  },
];

// --- 검증 1: 카테고리 문자열이 기존과 정확히 일치하는지 ---
const { data: existing } = await sb.from('engineer_guides').select('category,slug,title');
const cats = new Set(existing.map(g => g.category));
const slugs = new Set(existing.map(g => g.slug));

let bad = false;
for (const g of GUIDES) {
  if (!cats.has(g.category)) { console.error(`✗ 카테고리 불일치: "${g.category}" (${g.slug})`); bad = true; }
  if (slugs.has(g.slug)) { console.error(`✗ slug 중복: ${g.slug}`); bad = true; }
  if (!['beginner', 'intermediate', 'advanced'].includes(g.difficulty)) { console.error(`✗ difficulty 이상: ${g.slug}`); bad = true; }
  if (g.content.length < 1500) { console.error(`✗ 본문이 너무 짧음: ${g.slug} (${g.content.length}자)`); bad = true; }
}

// --- 검증 2: 제목 자카드 근접 중복 (audit-guides-dups 기준 0.4) ---
const stop = new Set(['완전', '가이드', '실전', '기초', '설정', '관리', '입문']);
const toks = s => new Set(s.toLowerCase().replace(/[^a-z0-9가-힣\s·]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !stop.has(w)));
for (const g of GUIDES) {
  const a = toks(g.title);
  for (const e of existing) {
    const b = toks(e.title);
    const inter = [...a].filter(x => b.has(x)).length;
    const uni = new Set([...a, ...b]).size;
    const jac = uni ? inter / uni : 0;
    if (jac >= 0.4) console.warn(`⚠ 제목 근접(${jac.toFixed(2)}): "${g.title}" ≈ "${e.title}"`);
  }
}

console.log(`\n검증 완료. 신규 ${GUIDES.length}편 | 기존 ${existing.length}편`);
for (const g of GUIDES) console.log(`  [${g.category}] ${g.title}  (${g.content.length}자, ${g.difficulty})`);

if (bad) { console.error('\n검증 실패 — 중단.'); process.exit(1); }

if (!APPLY) { console.log('\n(dry-run) --apply 를 붙이면 실제 삽입합니다.'); process.exit(0); }

// --- 삽입 ---
const rows = GUIDES.map(g => ({
  ...g, author: 'SecuThive', views: 0, status: 'published', created_at: now, updated_at: now,
}));
const { data: inserted, error } = await sb.from('engineer_guides').insert(rows).select('id,slug,title,category');
if (error) { console.error('삽입 실패:', error.message); process.exit(1); }

writeFileSync('scripts/add-guides-backup-2026-07-16.json', JSON.stringify(inserted, null, 2));
console.log('\n✓ 삽입 완료:');
for (const r of inserted) console.log(`  #${r.id}  ${r.slug}  — ${r.title}`);
console.log('\n백업: scripts/add-guides-backup-2026-07-16.json (롤백 시 이 id들 삭제)');
