// Demote published one-post series to standalone guides in the local Nodelog DB.
// Usage: node scripts/demote-internal-singleton-series-2026-09-30.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs';

const audit = JSON.parse(readFileSync('/tmp/nodelog-content-audit-2026-09-30.json', 'utf8'));
const targets = Object.entries(audit.series)
  .filter(([, items]) => items.length === 1)
  .map(([series, items]) => ({ series, id: items[0].id }));
const lines = readFileSync('/Users/mainthive/.secrets/nodelog_keys.env', 'utf8').split('\n');
const key = process.env.NODELOG_SERVICE_ROLE_KEY || lines.find((line) => line.startsWith('NODELOG_SERVICE_ROLE_KEY='))?.slice('NODELOG_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');
const rows = [];
for (const target of targets) {
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('select', 'id,slug,title,tags,status,updated_at');
  url.searchParams.set('id', `eq.${target.id}`);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Read ${target.id}: ${response.status}`);
  const [row] = await response.json();
  if (!row || row.status !== 'published' || !(row.tags || []).includes(`series:${target.series}`)) throw new Error(`Changed row ${target.id}`);
  rows.push({ ...row, series: target.series });
}
const backup = '/tmp/nodelog-singleton-series-backup-2026-09-30.json';
if (apply) writeFileSync(backup, JSON.stringify(rows, null, 2), { flag: 'wx' });
let changed = 0;
for (const row of rows) {
  const tags = row.tags.filter((tag) => !tag.startsWith('series:') && !/^ep:\d+$/.test(tag));
  console.log(`#${row.id} ${row.series} → standalone guide`);
  if (!apply) continue;
  const url = new URL('http://127.0.0.1:3300/posts');
  url.searchParams.set('id', `eq.${row.id}`);
  url.searchParams.set('updated_at', `eq.${row.updated_at}`);
  const response = await fetch(url, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ tags }) });
  if (!response.ok) throw new Error(`Update ${row.id}: ${response.status} ${(await response.text()).slice(0, 250)}`);
  const updated = await response.json();
  if (updated.length !== 1) throw new Error(`Concurrent update ${row.id}`);
  changed++;
}
console.log(apply ? `Updated ${changed}/${rows.length}. Backup: ${backup}` : `Dry run: ${rows.length} rows`);
