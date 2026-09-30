// Fix confirmed syntax defects in six published articles (KO + EN).
// Dry run by default; --apply writes to the local Nodelog PostgREST database.
import { readFileSync, writeFileSync } from 'node:fs';

const audit = JSON.parse(readFileSync('/tmp/nodelog-content-audit-2026-09-30.json', 'utf8'));
const ids = [100, 102, 103, 122, 264, 332];
const lines = readFileSync('/Users/mainthive/.secrets/nodelog_keys.env', 'utf8').split('\n');
const key = process.env.NODELOG_SERVICE_ROLE_KEY || lines.find((line) => line.startsWith('NODELOG_SERVICE_ROLE_KEY='))?.slice('NODELOG_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');

function replaceOnce(body, before, after, id) {
  if (!body.includes(before)) throw new Error(`#${id}: expected text missing: ${JSON.stringify(before.slice(0, 70))}`);
  if (body.indexOf(before) !== body.lastIndexOf(before)) throw new Error(`#${id}: replacement is not unique`);
  return body.replace(before, after);
}
function fix(id, body, locale) {
  const r = (a, b) => { body = replaceOnce(body, a, b, id); };
  if (id === 100) {
    r('f"기존 요약: {self.summary}\n\n"', 'f"기존 요약: {self.summary}\\n\\n"');
    r('conversation = "\n".join', 'conversation = "\\n".join');
    r('요약하세요:\n\n{conversation}"', '요약하세요:\\n\\n{conversation}"');
    r('f"[이전 대화 요약]\n{self.summary}"', 'f"[이전 대화 요약]\\n{self.summary}"');
    r('system_content += "\n\n[관련 기억]\n" + "\n".join', 'system_content += "\\n\\n[관련 기억]\\n" + "\\n".join');
    r('def __init__(self, user_id):\n        self.short_term', 'def __init__(self, user_id, supabase_client):\n        self.short_term');
    r('LongTermMemory(user_id=user_id)', 'LongTermMemory(user_id=user_id, supabase_client=supabase_client)');
    r('self.long_term.extract_and_save(f"사용자: {user_input}\n어시스턴트: {reply}")', 'self.long_term.save(f"사용자: {user_input}\\n어시스턴트: {reply}")');
  } else if (id === 102) {
    const label = locale === 'ko' ? '다음 텍스트의 감성을 positive/negative/neutral 중 하나로만 답하세요:' : 'Classify the sentiment of the following text as only one of positive/negative/neutral:';
    r(`${label}\n{text}"`, `${label}\\n{text}"`);
    const review = locale === 'ko' ? '다음 코드의 버그와 개선점을 찾아주세요:' : 'Find bugs and improvements in the following code:';
    r(`${review}\n\x60\x60\x60\n{code}\n\x60\x60\x60"`, `${review}\\n{code}"`);
  } else if (id === 103) {
    r('f"참고 문서:\n{context}\n\n질문: {question}"', 'f"참고 문서:\\n{context}\\n\\n질문: {question}"');
  } else if (id === 122) {
    r('skewness = np.mean(((data_window - np.mean(data_window)) / np.std(data_window))**3))',
      'std = np.std(data_window)\n    skewness = 0.0 if std == 0 else np.mean(((data_window - np.mean(data_window)) / std) ** 3)');
  } else if (id === 264) {
    r('```python\n# Pseudocode: AdapterService.py', '```python\nimport json\n\n# Architecture sketch: supply a client and data formatter before running.');
    r('response_schema="{"action": "string", "params": "object"}"',
      'response_schema={"type": "object", "properties": {"action": {"type": "string"}, "params": {"type": "object"}}}');
  } else if (id === 332) {
    r('  // ... 다른 테스트 케이스들\n', '');
    r('  },\n]\n```', '  }\n]\n```');
  }
  return body;
}

const rows = [];
for (const id of ids) {
  const snapshot = audit.posts.find((post) => post.id === id);
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('select', 'id,slug,content,content_evidence,updated_at');
  url.searchParams.set('id', `eq.${id}`);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Read #${id}: ${response.status}`);
  const [row] = await response.json();
  if (!row || row.updated_at !== snapshot.updated_at) throw new Error(`Concurrent edit #${id}`);
  const evidence = structuredClone(row.content_evidence);
  const content = fix(id, row.content, 'ko');
  evidence.en.content = fix(id, evidence.en.content, 'en');
  rows.push({ before: row, after: { content, content_evidence: evidence } });
  console.log(`#${id}: KO ${content.length - row.content.length} chars, EN ${evidence.en.content.length - row.content_evidence.en.content.length} chars`);
}
const backup = '/tmp/nodelog-code-examples-backup-2026-09-30.json';
if (!apply) {
  const proposed = structuredClone(audit);
  for (const { before, after } of rows) Object.assign(proposed.posts.find((post) => post.id === before.id), after);
  writeFileSync('/tmp/nodelog-code-proposed-2026-09-30.json', JSON.stringify(proposed));
}
if (apply) writeFileSync(backup, JSON.stringify(rows.map(({ before }) => before), null, 2), { flag: 'wx' });
for (const { before, after } of rows) {
  if (!apply) continue;
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('id', `eq.${before.id}`);
  url.searchParams.set('updated_at', `eq.${before.updated_at}`);
  const response = await fetch(url, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(after) });
  if (!response.ok) throw new Error(`Update #${before.id}: ${response.status} ${(await response.text()).slice(0, 250)}`);
  if ((await response.json()).length !== 1) throw new Error(`Concurrent update #${before.id}`);
}
console.log(apply ? `Updated ${rows.length} articles. Backup: ${backup}` : `Dry run: ${rows.length} articles`);
