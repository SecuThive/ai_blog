// Correct JSON code fences whose contents are HTML or JSON with comments.
// Usage: node scripts/fix-code-fence-labels-2026-09-30.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs';
const changes = [
  { id: 436, from: '```json\n<script type="application/ld+json">', to: '```html\n<script type="application/ld+json">' },
  { id: 643, from: '```json\n// package.json', to: '```jsonc\n// package.json' },
  { id: 796, from: '```json\n// Elasticsearch Query DSL', to: '```jsonc\n// Elasticsearch Query DSL' },
];
const lines = readFileSync('/Users/mainthive/.secrets/nodelog_keys.env', 'utf8').split('\n');
const key = process.env.NODELOG_SERVICE_ROLE_KEY || lines.find((line) => line.startsWith('NODELOG_SERVICE_ROLE_KEY='))?.slice('NODELOG_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');
const rows = [];
for (const change of changes) {
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('select', 'id,slug,content,content_evidence,updated_at');
  url.searchParams.set('id', `eq.${change.id}`);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Read #${change.id}: ${response.status}`);
  const [before] = await response.json();
  const evidence = structuredClone(before.content_evidence);
  if (!before.content.includes(change.from) || !evidence.en.content.includes(change.from)) throw new Error(`Missing fence #${change.id}`);
  const after = { content: before.content.replace(change.from, change.to), content_evidence: evidence };
  after.content_evidence.en.content = evidence.en.content.replace(change.from, change.to);
  rows.push({ before, after });
  console.log(`#${change.id}: ${change.from.split('\n')[0]} → ${change.to.split('\n')[0]}`);
}
const backup = '/tmp/nodelog-fence-labels-backup-2026-09-30.json';
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
