/**
 * Translate published posts + engineer_guides into English and store in Supabase.
 *
 * Storage (no schema migration required):
 *   - tags: i18n.title: / i18n.excerpt:
 *   - posts.content_evidence.en: { title, excerpt, content }
 *   - engineer_guides.content: append <!--NodelogEN ... NodelogEN-->
 *
 * Run: node scripts/fill-english.mjs
 *      node scripts/fill-english.mjs --limit=5
 *      node scripts/fill-english.mjs --concurrency=4
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function envFromLocal() {
  const out = {};
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#') || !s.includes('=')) continue;
    const i = s.indexOf('=');
    out[s.slice(0, i)] = s.slice(i + 1);
  }
  return out;
}

function xaiToken() {
  const auth = JSON.parse(readFileSync(join(homedir(), '.grok/auth.json'), 'utf8'));
  const entry = Object.values(auth)[0];
  return entry?.key ?? '';
}

const ENV = envFromLocal();
const SUPABASE_URL = ENV.SUPABASE_URL;
const SUPABASE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const XAI_KEY = process.env.XAI_API_KEY || xaiToken();
const MODEL = process.env.XAI_MODEL || 'grok-4.6';

const args = process.argv.slice(2);
const LIMIT = Number((args.find((a) => a.startsWith('--limit=')) ?? '').split('=')[1] || 0) || 99999;
const CONCURRENCY = Number((args.find((a) => a.startsWith('--concurrency=')) ?? '').split('=')[1] || 4);
const LOG = join(process.cwd(), 'scripts/fill-english.log');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!XAI_KEY) {
  console.error('Missing xAI token');
  process.exit(1);
}

const sbHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

function log(line) {
  const msg = `[${new Date().toISOString()}] ${line}`;
  console.log(msg);
  writeFileSync(LOG, msg + '\n', { flag: 'a' });
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: sbHeaders });
  if (!res.ok) throw new Error(`GET ${path} ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbPatch(table, id, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: sbHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${table} ${id} ${res.status} ${await res.text()}`);
}

function hasEn(row) {
  return (row.tags ?? []).some((t) => t.startsWith('i18n.title:'))
    && Boolean(row.content_evidence?.en?.content || (typeof row.content === 'string' && row.content.includes('<!--NodelogEN')));
}

function extractJson(text) {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : trimmed;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model output');
  return JSON.parse(raw.slice(start, end + 1));
}

async function translateDoc({ title, excerpt, content, kind }) {
  const prompt = `You are translating a Korean IT ${kind} into natural English for practitioners.

Return ONLY a JSON object with keys:
- "title": English title, concise
- "excerpt": 1-2 sentence English summary
- "content": full English Markdown body

Rules:
- Preserve Markdown structure (headings, lists, tables, links).
- Keep code blocks, commands, file paths, and API names unchanged.
- Keep Korean only if it is a proper noun that should stay Korean.
- Do not add a preamble or commentary.

Title:
${title}

Excerpt:
${excerpt || ''}

Body:
${content}`;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${XAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`xAI ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson(text);
  if (!parsed.title || !parsed.content) throw new Error('Incomplete translation JSON');
  return {
    title: String(parsed.title).trim(),
    excerpt: String(parsed.excerpt || '').trim(),
    content: String(parsed.content).trim(),
  };
}

function upsertTags(tags, title, excerpt) {
  const next = (tags ?? []).filter((t) => !t.startsWith('i18n.'));
  next.push(`i18n.title:${title.slice(0, 180)}`);
  if (excerpt) next.push(`i18n.excerpt:${excerpt.slice(0, 240)}`);
  return next;
}

function embedEn(koreanContent, en) {
  const start = koreanContent.indexOf('\n\n<!--NodelogEN');
  const base = (start === -1 ? koreanContent : koreanContent.slice(0, start)).trimEnd();
  return `${base}\n\n<!--NodelogEN\n${JSON.stringify(en)}\nNodelogEN-->`;
}

async function pool(items, limit, worker) {
  let i = 0;
  const running = new Set();
  const results = [];
  async function runOne(idx) {
    const p = Promise.resolve()
      .then(() => worker(items[idx], idx))
      .then((v) => { results[idx] = v; })
      .catch((err) => { results[idx] = { error: err }; })
      .finally(() => running.delete(p));
    running.add(p);
  }
  while (i < items.length || running.size) {
    while (i < items.length && running.size < limit) {
      await runOne(i++);
    }
    if (running.size) await Promise.race(running);
  }
  return results;
}

async function main() {
  if (!existsSync(LOG)) writeFileSync(LOG, '');
  log(`start model=${MODEL} concurrency=${CONCURRENCY} limit=${LIMIT}`);

  const posts = await sbGet('posts?select=id,title,excerpt,content,tags,content_evidence,status&status=eq.published&order=published_at.desc');
  const guides = await sbGet('engineer_guides?select=id,title,summary,content,tags,status&status=eq.published&order=created_at.desc');

  const postJobs = posts.filter((p) => !hasEn(p)).slice(0, LIMIT).map((row) => ({ kind: 'post', row }));
  const remaining = Math.max(0, LIMIT - postJobs.length);
  const guideJobs = guides.filter((g) => !hasEn(g)).slice(0, remaining).map((row) => ({ kind: 'guide', row }));
  const jobs = [...postJobs, ...guideJobs];
  log(`queue posts=${postJobs.length}/${posts.length} guides=${guideJobs.length}/${guides.length}`);

  let ok = 0;
  let fail = 0;

  await pool(jobs, CONCURRENCY, async (job, idx) => {
    const { kind, row } = job;
    const label = `${kind}#${row.id} ${String(row.title).slice(0, 48)}`;
    try {
      const en = await translateDoc({
        title: row.title,
        excerpt: kind === 'post' ? row.excerpt : row.summary,
        content: row.content,
        kind: kind === 'post' ? 'blog post' : 'engineer guide',
      });
      const tags = upsertTags(row.tags, en.title, en.excerpt);
      if (kind === 'post') {
        const evidence = (row.content_evidence && typeof row.content_evidence === 'object')
          ? { ...row.content_evidence, en }
          : { en };
        await sbPatch('posts', row.id, { tags, content_evidence: evidence });
      } else {
        await sbPatch('engineer_guides', row.id, {
          tags,
          content: embedEn(row.content, en),
        });
      }
      ok++;
      log(`ok ${idx + 1}/${jobs.length} ${label} -> ${en.title.slice(0, 60)}`);
    } catch (err) {
      fail++;
      log(`fail ${idx + 1}/${jobs.length} ${label}: ${err.message || err}`);
    }
  });

  log(`done ok=${ok} fail=${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
