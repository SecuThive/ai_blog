// Add precise verification scope to the six code-corrected posts.
// Usage: node scripts/add-internal-verification-notes-2026-09-30.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs';
const ids = [100, 102, 103, 122, 264, 332];
const lines = readFileSync('/Users/mainthive/.secrets/nodelog_keys.env', 'utf8').split('\n');
const key = process.env.NODELOG_SERVICE_ROLE_KEY || lines.find((line) => line.startsWith('NODELOG_SERVICE_ROLE_KEY='))?.slice('NODELOG_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');
const sources = {
  100: ['[OpenAI model reference](https://developers.openai.com/api/docs/models/all)', '[Anthropic API documentation](https://docs.anthropic.com/en/api/overview)'],
  102: ['[OpenAI model catalog](https://developers.openai.com/api/docs/models/all)', '[OpenAI pricing](https://developers.openai.com/api/docs/pricing)'],
  103: ['[OpenAI pricing](https://developers.openai.com/api/docs/pricing)', '[fine-tuning availability update](https://openai.com/index/gpt-4o-fine-tuning/)'],
  122: ['[NumPy standard deviation](https://numpy.org/doc/stable/reference/generated/numpy.std.html)'],
  264: ['[Python JSON documentation](https://docs.python.org/3/library/json.html)'],
  332: ['[JSON specification](https://www.rfc-editor.org/rfc/rfc8259)'],
};
const rows = [];
for (const id of ids) {
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('select', 'id,slug,content,content_evidence,updated_at');
  url.searchParams.set('id', `eq.${id}`);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Read #${id}: ${response.status}`);
  const [before] = await response.json();
  const evidence = structuredClone(before.content_evidence);
  const koNote = `## 코드 검증 범위 (2026-09-30)\n\nPython 3.14.6에서 코드 블록의 문법을 \`ast.parse\`로 확인했습니다${id === 332 ? ' (JSON 예시는 \`json.loads\`로 확인)' : ''}. 외부 SDK 호출·실제 서비스 연결·성능 수치는 이 검사에 포함되지 않습니다. 예시의 의존성과 모델 사용 가능 여부는 실행 환경에서 별도 확인해야 합니다.\n\n공식 참고: ${sources[id].join(', ')}.`;
  const enNote = `## Code verification scope (2026-09-30)\n\nPython code block syntax was checked with \`ast.parse\` on Python 3.14.6${id === 332 ? '; the JSON example was checked with \`json.loads\`' : ''}. External SDK calls, service connections, and performance claims were outside this check. Verify dependencies and model availability in the deployment environment.\n\nOfficial references: ${sources[id].join(', ')}.`;
  if (before.content.includes('## 코드 검증 범위') || evidence.en.content.includes('## Code verification scope')) throw new Error(`Already noted #${id}`);
  const content = before.content.trimEnd() + '\n\n' + koNote + '\n';
  evidence.en.content = evidence.en.content.trimEnd() + '\n\n' + enNote + '\n';
  rows.push({ before, after: { content, content_evidence: evidence } });
  console.log(`#${id} note prepared`);
}
const backup = '/tmp/nodelog-verification-notes-backup-2026-09-30.json';
if (apply) writeFileSync(backup, JSON.stringify(rows.map(({ before }) => before), null, 2), { flag: 'wx' });
for (const { before, after } of rows) {
  if (!apply) continue;
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('id', `eq.${before.id}`);
  url.searchParams.set('updated_at', `eq.${before.updated_at}`);
  const response = await fetch(url, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify(after) });
  if (!response.ok || (await response.json()).length !== 1) throw new Error(`Update failed #${before.id}: ${response.status}`);
}
console.log(apply ? `Updated ${rows.length}. Backup: ${backup}` : 'Dry run');
