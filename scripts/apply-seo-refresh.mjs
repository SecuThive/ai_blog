/** Apply a reviewed content manifest, preserving URLs and checking for concurrent edits.
 * Dry-run by default. --apply writes a mandatory backup before changing any row.
 * node scripts/apply-seo-refresh.mjs <manifest.json> [--apply --backup <backup.json>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const manifestPath = args[0];
const apply = args.includes('--apply');
const backupPath = args[args.indexOf('--backup') + 1];
if (!manifestPath || (apply && (!args.includes('--backup') || !backupPath))) {
  throw new Error('Usage: <manifest.json> [--apply --backup <backup.json>]');
}
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].trim().replace(/^['"]|['"]$/g, '');
}
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const prepared = [];
const seen = new Set();
for (const item of manifest) {
  if (!['posts', 'engineer_guides'].includes(item.table) || !Number.isInteger(item.id)) {
    throw new Error('Invalid table/id');
  }
  const key = `${item.table}/${item.id}`;
  if (seen.has(key)) throw new Error(`Duplicate target: ${key}`);
  seen.add(key);
  const { data: before, error } = await sb.from(item.table).select('*').eq('id', item.id).single();
  if (error) throw error;
  if (before.slug !== item.slug || before.status !== 'published') throw new Error(`Target changed: ${key}`);
  for (const [field, expected] of Object.entries(item.expected)) {
    const actual = field === 'contentSha256' ? hash(before.content) : before[field];
    if (actual !== expected) throw new Error(`Concurrent edit: ${key} ${field}; review before applying`);
  }
  const content = fs.readFileSync(path.resolve(path.dirname(manifestPath), item.contentFile), 'utf8').trim();
  let inFence = false;
  let hasH1 = false;
  for (const line of content.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence;
    else if (!inFence && /^# /.test(line)) hasH1 = true;
  }
  if (content.length < 500 || hasH1 || inFence) {
    throw new Error(`Invalid content structure: ${key}`);
  }
  const fields = { content };
  const metaField = item.table === 'posts' ? 'excerpt' : 'summary';
  for (const field of ['title', metaField]) if (item[field]) fields[field] = item[field];
  console.log(JSON.stringify({ target: key, slug: item.slug,
    title: [before.title, fields.title ?? before.title],
    contentChars: [before.content.length, content.length], fields: Object.keys(fields) }));
  prepared.push({ table: item.table, id: item.id, before, fields });
}
if (!apply) {
  console.log(`Dry run passed: ${prepared.length} reviewed pages. No database writes.`);
} else {
  // Exclusive backup prevents rerunning from destroying the original rollback material.
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(prepared, null, 2), { flag: 'wx', mode: 0o600 });
  const receipt = [];
  for (const entry of prepared) {
    const fields = { ...entry.fields, updated_at: new Date().toISOString() };
    let update = sb.from(entry.table).update(fields).eq('id', entry.id)
      .eq('slug', entry.before.slug).eq('status', 'published');
    update = entry.before.updated_at == null
      ? update.is('updated_at', null) : update.eq('updated_at', entry.before.updated_at);
    const { data, error } = await update.select('id,slug,title,content,updated_at');
    if (error || data?.length !== 1) throw new Error(`Update failed or concurrent edit: ${entry.table}/${entry.id}`);
    if (data[0].content !== fields.content) throw new Error('Stored content differs from reviewed content');
    receipt.push({ table: entry.table, id: entry.id, slug: data[0].slug,
      title: data[0].title, updated_at: data[0].updated_at, contentSha256: hash(data[0].content) });
    fs.writeFileSync(`${backupPath}.receipt.json`, JSON.stringify(receipt, null, 2));
    console.log(`Applied ${entry.table}/${entry.id}`);
  }
  console.log(`Applied ${receipt.length} pages. Invalidate their caches and verify live HTML next.`);
}
