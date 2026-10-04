// One-time editorial cross-links. Run with .env.local. No article is removed.
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const quick = '/blog/kubectl-get-endpoints-noneservice-connection-refused-5분-진단';
const deep = '/blog/endpoints-noneno-endpoints-available-7가지-원인과-30초-진단법';
const guide = '/engineer/kubernetes-endpoints-none-fix';
const edits = [
  {
    table: 'posts', id: 667,
    change: text => text
      .replace('결론부터 말하면, 이 상황의 90%는 **Service가 트래픽을 보낼 Pod 목록(Endpoints)이 비어있기 때문**입니다.', '먼저 Service가 트래픽을 보낼 대상(Endpoints 또는 EndpointSlice)이 있는지 확인합니다. 대상이 비어 있다면 selector와 Pod의 Ready 상태부터 좁혀 갑니다.')
      .replace('> K8s_Troubleshooting_Guide 14편', `> **빠른 1차 진단**: Service와 Pod 상태를 확인하는 입구입니다. 원인을 더 세분화하려면 [상세 원인 분석](${deep})을, 순서대로 실행하는 절차가 필요하면 [엔지니어 런북](${guide})을 참고하세요.`),
  },
  {
    table: 'posts', id: 805,
    change: text => `> **심화 분석**: 이 글은 빈 백엔드의 원인별 분기와 예외를 다룹니다. 처음 확인할 세 명령은 [빠른 진단](${quick})에, 실행 순서 중심의 절차는 [엔지니어 런북](${guide})에 있습니다.\n\n${text}`,
  },
  {
    table: 'engineer_guides', id: 167,
    change: text => `> **실행용 런북**: selector·Ready·targetPort를 순서대로 확인하는 절차입니다. 증상만 빠르게 확인하려면 [블로그 빠른 진단](${quick})을, 예외와 원인별 설명은 [심화 분석](${deep})을 참고하세요.\n\n${text}`,
  },
];
for (const edit of edits) {
  const { data: before, error } = await db.from(edit.table).select('id,slug,content,updated_at').eq('id', edit.id).single();
  if (error || !before) throw new Error(`Cannot read ${edit.table} ${edit.id}: ${error?.message}`);
  const content = edit.change(before.content);
  if (content === before.content || before.content.includes('**심화 분석**') || before.content.includes('**실행용 런북**')) { console.log(`Skip ${edit.table} ${edit.id}`); continue; }
  writeFileSync(`/tmp/nodelog-${edit.table}-${edit.id}-before-crosslink.json`, JSON.stringify(before, null, 2), { mode: 0o600 });
  const update = edit.table === 'engineer_guides' ? { content, updated_at: new Date().toISOString() } : { content };
  const { error: writeError } = await db.from(edit.table).update(update).eq('id', edit.id).eq('slug', before.slug).eq('updated_at', before.updated_at).select('id').single();
  if (writeError) throw new Error(`Cannot update ${edit.table} ${edit.id}: ${writeError.message}`);
  console.log(`Updated ${edit.table} ${edit.id}`);
}
