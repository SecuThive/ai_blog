// node --test --experimental-strip-types tests/*.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchSitemapData, resolveSitemapData, type PublishedQuery, type SitemapData } from '../src/lib/sitemapData.ts';

const POSTS = [{ slug: 'a', published_at: '2026-10-01T00:00:00Z', tags: ['series:x'], category: '개발' }];
const GUIDES = [{ slug: 'g', updated_at: '2026-10-02T00:00:00Z' }];

const ok: PublishedQuery = async (table) => ({ data: table === 'posts' ? POSTS : GUIDES, error: null });

function lastGoodStore(initial: SitemapData | null = null) {
  let saved = initial;
  return { lastGood: () => saved, remember: (d: SitemapData) => { saved = d; }, get: () => saved };
}

test('fetchSitemapData returns posts and guides on success', async () => {
  const d = await fetchSitemapData(ok, 1000);
  assert.deepEqual(d.posts, POSTS);
  assert.deepEqual(d.guides, GUIDES);
  assert.ok(!Number.isNaN(Date.parse(d.fetchedAt)));
});

test('fetchSitemapData throws on a PostgREST error (no partial result)', async () => {
  const guidesFail: PublishedQuery = async (table) =>
    table === 'posts' ? { data: POSTS, error: null } : { data: null, error: { code: '57014', message: 'canceling statement due to statement timeout' } };
  await assert.rejects(fetchSitemapData(guidesFail, 1000), /guides fetch failed: 57014/);
});

test('fetchSitemapData throws on zero published posts (never an empty sitemap)', async () => {
  const empty: PublishedQuery = async () => ({ data: [], error: null });
  await assert.rejects(fetchSitemapData(empty, 1000), /0 published posts/);
});

test('fetchSitemapData times out and aborts the request', async () => {
  let aborted = false;
  const hang: PublishedQuery = (_t, _c, signal) =>
    new Promise((resolve) => {
      signal.addEventListener('abort', () => { aborted = true; });
      setTimeout(() => resolve({ data: POSTS, error: null }), 5000).unref();
    });
  const t0 = Date.now();
  await assert.rejects(fetchSitemapData(hang, 50), /timed out after 50ms/);
  assert.ok(Date.now() - t0 < 1000);
  assert.equal(aborted, true);
});

test('resolveSitemapData: success is remembered as last-good', async () => {
  const store = lastGoodStore();
  const r = await resolveSitemapData({ load: () => fetchSitemapData(ok, 1000), ...store, log: () => {} });
  assert.equal(r.source, 'db');
  assert.equal(store.get()?.posts.length, 1);
});

test('resolveSitemapData: DB failure serves the last-good copy instead of throwing', async () => {
  const good = await fetchSitemapData(ok, 1000);
  const store = lastGoodStore(good);
  const logs: string[] = [];
  const failing: PublishedQuery = async () => { throw new TypeError('fetch failed'); };
  const r = await resolveSitemapData({ load: () => fetchSitemapData(failing, 1000), ...store, log: (m) => logs.push(m) });
  assert.equal(r.source, 'last-good');
  assert.equal(r.data, good);
  assert.match(logs[0], /fetch failed.*last-good/);
});

test('resolveSitemapData: timeout with no last-good falls back to static (data null), not a throw', async () => {
  const store = lastGoodStore();
  const logs: string[] = [];
  const hang: PublishedQuery = () => new Promise(() => {});
  const r = await resolveSitemapData({ load: () => fetchSitemapData(hang, 30), ...store, log: (m) => logs.push(m) });
  assert.equal(r.source, 'static');
  assert.equal(r.data, null);
  assert.match(logs[0], /timed out.*static core-route sitemap/);
});

test('resolveSitemapData: an empty result from the source is not served as complete', async () => {
  const good = await fetchSitemapData(ok, 1000);
  const store = lastGoodStore(good);
  const r = await resolveSitemapData({ load: async () => ({ posts: [], guides: [], fetchedAt: 'x' }), ...store, log: () => {} });
  assert.equal(r.source, 'last-good');
  assert.equal(store.get(), good); // empty result did not overwrite last-good
});
