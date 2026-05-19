export function catTone(cat: string): string {
  if (cat.includes('AI') || cat.includes('자동화')) return 'blue';
  if (cat.includes('트렌드') || cat.includes('IT')) return 'purple';
  if (cat.includes('개발') || cat.includes('인프라')) return 'mint';
  if (cat.includes('툴') || cat.includes('리뷰')) return 'amber';
  if (cat.includes('보안')) return 'rose';
  return 'blue';
}

export function engCatTone(cat: string): string {
  if (cat.startsWith('Linux') || cat.startsWith('OS')) return 'mint';
  if (cat.startsWith('Docker') || cat.startsWith('클라우드')) return 'blue';
  if (cat.startsWith('Git')) return 'purple';
  if (cat.startsWith('네트워킹') || cat.startsWith('데이터베이스')) return 'amber';
  if (cat.startsWith('보안')) return 'rose';
  if (cat.startsWith('트러블슈팅')) return 'orange';
  return 'blue';
}

export function diffLabel(d: string): string {
  if (d === 'intermediate') return '중급';
  if (d === 'advanced') return '고급';
  return '초급';
}

export function toneForSeries(name: string): string {
  if (name.includes('RAG') || name.includes('벡터')) return 'blue';
  if (name.includes('AI') || name.includes('자동화') || name.includes('에이전트') || name.includes('Agent')) return 'blue';
  if (name.includes('트렌드') || name.includes('IT') || name.includes('LLM') || name.includes('프로덕션')) return 'purple';
  if (name.includes('개발') || name.includes('인프라') || name.includes('MLOps') || name.includes('ML')) return 'mint';
  if (name.includes('툴') || name.includes('리뷰') || name.includes('생산성')) return 'amber';
  if (name.includes('보안')) return 'rose';
  return 'blue';
}
