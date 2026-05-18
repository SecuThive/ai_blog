export function toneForSeries(name: string): string {
  if (name.includes('RAG') || name.includes('벡터')) return 'blue';
  if (name.includes('AI') || name.includes('자동화') || name.includes('에이전트') || name.includes('Agent')) return 'blue';
  if (name.includes('트렌드') || name.includes('IT') || name.includes('LLM') || name.includes('프로덕션')) return 'purple';
  if (name.includes('개발') || name.includes('인프라') || name.includes('MLOps') || name.includes('ML')) return 'mint';
  if (name.includes('툴') || name.includes('리뷰') || name.includes('생산성')) return 'amber';
  if (name.includes('보안')) return 'rose';
  return 'blue';
}
