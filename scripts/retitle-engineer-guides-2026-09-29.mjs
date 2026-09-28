// Retitle 3 engineer guides (2026-09-29): replace "Complete Guide" SEO-bait English
// titles with problem-focused, factual titles. Changes ONLY the English title
// (tag `i18n.title:` + embedded <!--NodelogEN {json} NodelogEN--> "title" field).
// Korean titles for these rows contain no bait wording and are left unchanged.
// Slugs, status, summaries, bodies, and robots settings are never touched.
// Usage (run from scripts/): node retitle-engineer-guides-2026-09-29.mjs [--apply]
//   Without --apply: dry run (prints the diff only).
//   With --apply: writes a before-snapshot of the rows to
//   retitle-engineer-guides-backup-2026-09-29.json (gitignored), then updates.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const envPath = existsSync(join(here, '../.env.local')) ? join(here, '../.env.local') : '.env.local';
const env = Object.fromEntries(readFileSync(envPath, 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
const BACKUP = join(here, 'retitle-engineer-guides-backup-2026-09-29.json');
const START = '<!--NodelogEN', END = 'NodelogEN-->';
const TAG = 'i18n.title:';

const CHANGES = [
  {
    id: 162, slug: 'kubernetes-rbac-role-serviceaccount',
    old_en: 'Kubernetes RBAC Complete Guide — Controlling Permissions with Role, RoleBinding, and ServiceAccount',
    title_en: "Kubernetes RBAC: Diagnosing 'Forbidden' Errors and Granting Least-Privilege Access with Roles and ServiceAccounts",
  },
  {
    id: 164, slug: 'postgresql-roles-privileges-grant',
    old_en: 'The Complete Guide to PostgreSQL Privilege Management — Roles, GRANT, REVOKE, and Schema Privileges',
    title_en: 'PostgreSQL Privileges: Setting Up Read-Only and Least-Privilege Roles with GRANT, REVOKE, and DEFAULT PRIVILEGES',
  },
  {
    id: 165, slug: 'keepalived-vrrp-virtual-ip-failover',
    old_en: 'keepalived VRRP Complete Guide — High Availability with Virtual IP Failover',
    title_en: 'keepalived VRRP: Setting Up Virtual IP Failover with Health Checks and Split-Brain Prevention',
  },
];
const BAIT = /complete|ultimate|master(ing)?\b|definitive/i;

const { data: rows, error } = await sb.from('engineer_guides').select('*').in('id', CHANGES.map(c => c.id));
if (error) throw error;
const byId = Object.fromEntries(rows.map(r => [r.id, r]));

const plans = [];
let problems = 0;
for (const c of CHANGES) {
  const r = byId[c.id];
  const fail = m => { console.log(`#${c.id} ${m}`); problems++; };
  if (!r) { fail('MISSING'); continue; }
  if (r.slug !== c.slug) { fail(`SLUG MISMATCH ${r.slug}`); continue; }
  if (BAIT.test(c.title_en)) { fail('new title still contains bait wording'); continue; }
  const tags = [...(r.tags || [])];
  const ti = tags.findIndex(t => t.startsWith(TAG));
  const content = r.content || '';
  const a = content.indexOf(START), b = content.lastIndexOf(END);
  if (a === -1 || b <= a) { fail('no embedded EN block'); continue; }
  const emb = JSON.parse(content.slice(a + START.length, b).trim());
  const curTag = ti >= 0 ? tags[ti].slice(TAG.length) : null;
  if (curTag === c.title_en && emb.title === c.title_en) { console.log(`#${c.id} already applied, skip`); continue; }
  if (curTag !== c.old_en || emb.title !== c.old_en) { fail(`unexpected current EN title tag=${curTag} emb=${emb.title}`); continue; }
  // Replace only the title value inside the embedded JSON, preserving the rest byte-for-byte.
  const oldKey = '"title":' + JSON.stringify(c.old_en);
  const block = content.slice(a, b);
  if (block.split(oldKey).length !== 2) { fail('embedded title key not found exactly once'); continue; }
  let newContent = content.slice(0, a) + block.replace(oldKey, '"title":' + JSON.stringify(c.title_en)) + content.slice(b);
  // Replace any in-body heading that repeats the old title verbatim (KO body and EN body).
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headRe = new RegExp('^(#{1,6} )' + esc(c.old_en) + '\\s*$', 'gm');
  const nA = newContent.indexOf(START), nB = newContent.lastIndexOf(END);
  const koPart = newContent.slice(0, nA).replace(headRe, `$1${c.title_en}`);
  const newEmb = JSON.parse(newContent.slice(nA + START.length, nB).trim());
  let embOut = newContent.slice(nA, nB);
  if (headRe.test(newEmb.content)) {
    newEmb.content = newEmb.content.replace(headRe, `$1${c.title_en}`);
    embOut = START + '\n' + JSON.stringify(newEmb) + '\n';
  }
  newContent = koPart + embOut + newContent.slice(nB);
  const check = JSON.parse(newContent.slice(newContent.indexOf(START) + START.length, newContent.lastIndexOf(END)).trim());
  if (check.title !== c.title_en || check.content !== newEmb.content || check.excerpt !== emb.excerpt) { fail('post-edit JSON verify failed'); continue; }
  tags[ti] = TAG + c.title_en;
  plans.push({ c, patch: { tags, content: newContent } });
  console.log(`#${c.id} ${c.slug}\n  EN: ${c.old_en}\n   → ${c.title_en}\n  KO (unchanged): ${r.title}\n  content Δchars: ${newContent.length - content.length}`);
}
if (problems) { console.error(`${problems} problem(s); aborting.`); process.exit(1); }
if (!APPLY) { console.log(`\nDRY RUN: ${plans.length} row(s) would change. Re-run with --apply.`); process.exit(0); }
if (!plans.length) { console.log('nothing to apply'); process.exit(0); }
if (existsSync(BACKUP)) { console.error('backup exists, refusing to overwrite:', BACKUP); process.exit(1); }
writeFileSync(BACKUP, JSON.stringify(rows, null, 1));
console.log('backup saved', BACKUP, rows.length);
for (const { c, patch } of plans) {
  const { error: e } = await sb.from('engineer_guides').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', c.id).eq('slug', c.slug);
  if (e) { console.error(`#${c.id} update failed`, e); process.exit(1); }
  console.log(`#${c.id} updated`);
}
