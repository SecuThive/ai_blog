/** Production integration check. Run after npm run build; only a local mock DB is used. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const stamp = Date.now();
const slug = `캐시-검증-${stamp}`;
const guideSlug = `cache-check-${stamp}`;
let revision = 'before';
let fail = false;
let lookups = 0;
const database = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const requested = url.searchParams.get('slug');
  res.setHeader('Content-Type', 'application/json');
  if (requested === `eq.${slug}` || requested === `eq.${guideSlug}`) {
    lookups++;
    if (fail) {
      res.writeHead(503);
      res.end(JSON.stringify({ code: 'TEST_DB_UNAVAILABLE', message: 'Simulated outage' }));
      return;
    }
    res.end(JSON.stringify([{
      id: 987654, slug: requested.slice(3), title: `Cache ${revision}`,
      content: `## Cache verification\n\nCACHE_BODY_${revision}`, excerpt: `Summary ${revision}`,
      summary: `Summary ${revision}`, category: '개발', difficulty: 'beginner', tags: [],
      os_compat: ['Linux'], author: 'Test', views: 0, status: 'published', published_at: '2026-09-01T00:00:00Z',
      created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-07T00:00:00Z',
    }]));
  } else res.end('[]');
});
database.listen(0, '127.0.0.1');
await once(database, 'listening');
const dbUrl = `http://127.0.0.1:${database.address().port}`;
const portServer = createServer();
portServer.listen(0, '127.0.0.1');
await once(portServer, 'listening');
const port = portServer.address().port;
await new Promise(resolve => portServer.close(resolve));
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', '127.0.0.1'], {
  env: { ...process.env, SUPABASE_URL: dbUrl, NEXT_PUBLIC_SUPABASE_URL: dbUrl,
    SUPABASE_ANON_KEY: 'mock-anon', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service', BLOG_API_KEY: 'mock-webhook' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
app.stdout.on('data', chunk => { logs += chunk; });
app.stderr.on('data', chunk => { logs += chunk; });
const base = `http://127.0.0.1:${port}`;
async function get(path) {
  const response = await fetch(`${base}${path}`, { headers: { 'user-agent': 'Googlebot' } });
  return { response, text: await response.text() };
}
async function invalidate(body, key = 'mock-webhook') {
  return fetch(`${base}/api/revalidate`, { method: 'POST', headers: {
    'content-type': 'application/json', 'x-api-key': key,
  }, body: JSON.stringify(body) });
}
try {
  for (let i = 0; i < 100; i++) {
    if (logs.includes('Ready in')) break;
    if (app.exitCode !== null) throw new Error(logs);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  for (const [path, currentSlug, type] of [
    [`/blog/${encodeURIComponent(slug)}`, slug, 'post'],
    [`/engineer/${guideSlug}`, guideSlug, 'guide'],
  ]) {
    revision = 'before';
    const first = await get(path);
    assert.equal(first.response.status, 200);
    assert.match(first.response.headers.get('cache-control') ?? '', /no-store/);
    assert.match(first.text, /CACHE_BODY_before/);
    const cachedLookups = lookups;
    revision = 'after';
    const cached = await get(path);
    assert.match(cached.text, /CACHE_BODY_before/);
    assert.equal(lookups, cachedLookups, 'Data cache should avoid a second DB lookup');
    assert.equal((await invalidate({ slug: currentSlug, type })).status, 200);
    const fresh = await get(path);
    assert.equal(fresh.response.status, 200);
    assert.match(fresh.text, /CACHE_BODY_after/);
    assert.match(fresh.text, /<title>Cache after/);
    assert.ok(!fresh.text.includes('CACHE_BODY_before'));
    assert.equal(lookups, cachedLookups + 1, 'Metadata and body share a single lookup');
    fail = true;
    await invalidate({ slug: currentSlug, type });
    const outage = await get(path);
    assert.equal(outage.response.status, 500, 'A DB outage must not become a cacheable 404');
    fail = false;
    const recovered = await get(path);
    assert.equal(recovered.response.status, 200);
    assert.match(recovered.text, /CACHE_BODY_after/);
    console.log(`PASS ${type}: cached data, immediate webhook refresh, DB outage recovery`);
  }
  // Unlike HTML ISR, expired data is refreshed by the live request itself.
  revision = 'ttl-refresh';
  console.log('Checking automatic data refresh after the 60-second TTL...');
  await new Promise(resolve => setTimeout(resolve, 61_000));
  for (const path of [`/blog/${encodeURIComponent(slug)}`, `/engineer/${guideSlug}`]) {
    let text = '';
    for (let attempt = 0; attempt < 20; attempt++) {
      text = (await get(path)).text;
      if (text.includes('CACHE_BODY_ttl-refresh')) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.match(text, /CACHE_BODY_ttl-refresh/);
  }
  console.log('PASS automatic TTL refresh for both detail routes');
  assert.equal((await get(`/blog/missing-${stamp}`)).response.status, 404);
  assert.equal((await invalidate({ slug }, 'wrong-key')).status, 401);
  for (const body of [null, [], { slug: {} }, { slug: '' }, { type: 'invalid' }]) {
    assert.equal((await invalidate(body)).status, 400);
  }
  console.log('PASS missing page 404, unauthorized webhook 401, malformed webhook 400');
} catch (error) {
  console.error(logs.slice(-5000));
  throw error;
} finally {
  if (app.exitCode === null) {
    app.kill('SIGTERM');
    await once(app, 'exit');
  }
  database.closeAllConnections();
  await new Promise(resolve => database.close(resolve));
}
