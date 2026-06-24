/**
 * 시리즈 통합 스크립트
 * 22개 → 14개로 정리
 *
 * 실행: node scripts/consolidate-series.mjs          (dry-run)
 *       node scripts/consolidate-series.mjs --execute (실제 적용)
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://isfzeksbzxtuqymfocqv.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const EXECUTE = process.argv.includes('--execute');

// ─── 통합 매핑 ────────────────────────────────────────────────────────────────
// key: 기존 series 이름, value: 통합될 새 series 이름 (null = 삭제/해체)
const SERIES_REMAP = {
  // 에이전트 관련 (6개 → 1개)
  'AI 에이전트 실전 마스터 가이드':        'LLM 에이전트 마스터 가이드',
  'LLM 에이전트 심화 마스터 가이드':       'LLM 에이전트 마스터 가이드',
  'AI 에이전트 마스터 클래스':             'LLM 에이전트 마스터 가이드',
  'AI_Agent_Development_Roadmap':          'LLM 에이전트 마스터 가이드',
  '복잡 워크플로우 오케스트레이션 마스터 가이드': 'LLM 에이전트 마스터 가이드',
  'Agent Workflow':                        'LLM 에이전트 마스터 가이드',

  // 아키텍처 관련 (3개 → 1개)
  'AI 시스템 아키텍처 심화':               'LLM 애플리케이션 아키텍처 심화',
  '실시간 데이터 스트리밍 아키텍처 마스터 가이드': 'LLM 애플리케이션 아키텍처 심화',

  // 엔터프라이즈 AI (3개 → 1개, 이름 통일)
  'Enterprise AI Architecture Blueprint':  '엔터프라이즈 AI 아키텍처 가이드',
  '엔터프라이즈AI플랫폼구축로드맵':        '엔터프라이즈 AI 아키텍처 가이드',
  'AI 시스템 통합 아키텍처 가이드':        '엔터프라이즈 AI 아키텍처 가이드',
  'LLM 도입 가이드':                       '엔터프라이즈 AI 아키텍처 가이드',

  // 비용 최적화 (1편 흡수)
  'AI 서비스 비용 최적화 마스터 가이드':   'AI 시스템 경제성 마스터 가이드',

  // RAG (1편 흡수)
  'LLM 심화 학습 시리즈':                 'RAG 완전 정복',
};

// LLM 성능 향상 시리즈: 주제 혼합 → 슬러그별로 개별 매핑
const SLUG_REMAP = {
  // RAG 관련 글 → RAG 완전 정복
  'ai가-헛소리하는-이유-rag검색-증강-생성으로-신뢰도-100-사내-챗봇-만드는-법-초보자-가이드':
    'RAG 완전 정복',

  // LoRA/QLoRA → LLM 애플리케이션 아키텍처 심화
  // (URL 인코딩된 slug - DB에서 조회 후 처리)

  // 라우팅/앙상블/비용 절감 → AI 시스템 경제성 마스터 가이드
  // (URL 인코딩된 slug - DB에서 조회 후 처리)
};

async function main() {
  console.log(`\n🔍 시리즈 통합 스크립트 (${EXECUTE ? '⚡ EXECUTE 모드' : '🔄 DRY-RUN 모드'})\n`);

  // 전체 published 글 조회
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, title, slug, tags')
    .eq('status', 'published');

  if (error) { console.error(error); process.exit(1); }

  const updates = [];
  const stats = {};

  for (const post of posts) {
    const tags = post.tags ?? [];
    const seriesTag = tags.find(t => t.startsWith('series:'));
    if (!seriesTag) continue;

    const oldSeries = seriesTag.replace('series:', '');

    // 시리즈 레벨 리맵
    let newSeries = SERIES_REMAP[oldSeries];

    // 슬러그 레벨 리맵 (LLM 성능 향상 시리즈 처리)
    if (!newSeries && oldSeries === 'LLM 성능 향상 시리즈') {
      if (post.slug === 'ai가-헛소리하는-이유-rag검색-증강-생성으로-신뢰도-100-사내-챗봇-만드는-법-초보자-가이드') {
        newSeries = 'RAG 완전 정복';
      } else if (post.title.includes('LoRA') || post.title.includes('파인튜닝')) {
        newSeries = 'LLM 애플리케이션 아키텍처 심화';
      } else if (post.title.includes('라우팅') || post.title.includes('앙상블') || post.title.includes('비용')) {
        newSeries = 'AI 시스템 경제성 마스터 가이드';
      }
    }

    if (!newSeries) continue; // 변경 불필요

    const newTags = tags.map(t =>
      t === `series:${oldSeries}` ? `series:${newSeries}` : t
    );

    updates.push({ id: post.id, title: post.title, slug: post.slug, oldSeries, newSeries, newTags });

    stats[`${oldSeries} → ${newSeries}`] = (stats[`${oldSeries} → ${newSeries}`] ?? 0) + 1;
  }

  // 결과 출력
  console.log('📊 변경 요약:');
  for (const [key, count] of Object.entries(stats)) {
    console.log(`  ${count}편  ${key}`);
  }
  console.log(`\n총 ${updates.length}개 글의 tags 업데이트\n`);

  if (!EXECUTE) {
    console.log('🔍 상세 목록 (처음 30개):');
    updates.slice(0, 30).forEach(u =>
      console.log(`  [${u.id}] ${u.title.slice(0, 50)}\n       ${u.oldSeries} → ${u.newSeries}`)
    );
    console.log('\n실제 적용: node scripts/consolidate-series.mjs --execute');
    return;
  }

  // 실제 업데이트
  let done = 0;
  const BATCH = 20;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    for (const u of batch) {
      const { error } = await sb
        .from('posts')
        .update({ tags: u.newTags })
        .eq('id', u.id);
      if (error) {
        console.error(`❌ [${u.id}] ${u.title}: ${error.message}`);
      } else {
        done++;
        console.log(`✅ [${u.id}] ${u.oldSeries} → ${u.newSeries} | ${u.title.slice(0, 50)}`);
      }
    }
  }
  console.log(`\n완료: ${done}/${updates.length}개 업데이트`);
}

main().catch(console.error);
