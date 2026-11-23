// Run after building and starting a candidate: npm run test:seo:live -- http://127.0.0.1:3114
import assert from 'node:assert/strict';
const origin = process.argv[2];
if (!origin || !/^https?:\/\//.test(origin)) throw new Error('Pass the candidate HTTP origin explicitly');
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1].toLowerCase(), decode(m[2])]));
const get = path => fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(45000), headers: { 'User-Agent': 'ThiveLab-SEO-regression/1.0' } });
const response = await get('/sitemap.xml'); assert.equal(response.status, 200);
const xml = await response.text();
const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, block]) => ({
  url: decode(block.match(/<loc>(.*?)<\/loc>/)[1]),
  languages: Object.fromEntries([...block.matchAll(/<(?:\w+:)?link\b[^>]*>/g)].map(([tag]) => { const a = attrs(tag); return [a.hreflang, a.href]; })),
}));
assert.ok(entries.length > 0);
const map = new Map(entries.map(e => [e.url, e])); assert.equal(map.size, entries.length);
for (const e of entries) for (const alternate of Object.values(e.languages)) {
  assert.ok(map.has(alternate), `sitemap missing alternate ${alternate}`);
  assert.deepEqual(map.get(alternate).languages, e.languages);
}
const untranslated = ['/blog/git-reflog-recover-deleted-commit-branch', '/engineer/git-reset-hard-recover-reflog', '/blog/webshell-detection-response-linux-nginx-apache-guide'];
for (const path of untranslated) assert.ok(entries.some(e => new URL(e.url).pathname === path), `missing representative content ${path}; possible static fallback`);
const samples = ['git-push-http-413', 'ssh-connection-closedreset-by-peer', ...untranslated];
const targets = entries.filter(e => /\/(category|series)\//.test(e.url) || /\/engineer$/.test(e.url) || samples.some(s => e.url.includes(s)));
const errors = [];
for (const e of targets) {
  try {
    const r = await get(new URL(e.url).pathname); assert.equal(r.status, 200, e.url);
    const html = await r.text();
    const links = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => attrs(tag));
    assert.deepEqual(links.filter(a => a.rel === 'canonical').map(a => a.href), [e.url], 'canonical');
    assert.deepEqual(Object.fromEntries(links.filter(a => a.rel === 'alternate' && a.hreflang).map(a => [a.hreflang, a.href])), e.languages, 'hreflang');
    assert.ok(![...html.matchAll(/<meta\b[^>]*>/g)].map(([tag]) => attrs(tag)).some(a => ['robots', 'googlebot'].includes(a.name) && a.content?.includes('noindex')), 'sitemap includes noindex');
    const schema = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(([, json]) => JSON.parse(json));
    assert.ok(schema.length, 'missing JSON-LD');
    function visit(value) {
      if (!value || typeof value !== 'object') return;
      if (value.editor) assert.equal(value.editor['@type'], 'Person');
      if (['Article', 'TechArticle', 'BlogPosting'].includes(value['@type'])) {
        const main = value.mainEntityOfPage;
        assert.equal(typeof main === 'object' ? main['@id'] : main ?? value.url, e.url, 'article schema URL');
        assert.equal(value.inLanguage.slice(0, 2), new URL(e.url).pathname.startsWith('/en/') ? 'en' : 'ko');
      }
      if (value['@type'] === 'CollectionPage' && e.url.includes('/category/')) {
        const list = value.mainEntity; assert.equal(list['@type'], 'ItemList');
        assert.equal(list.numberOfItems, list.itemListElement.length);
        assert.deepEqual(list.itemListElement.map(x => x.position), list.itemListElement.map((_, i) => i + 1));
      }
      if (typeof value.url === 'string') for (const path of untranslated) assert.ok(!value.url.endsWith('/en' + path), 'schema points to untranslated URL');
      for (const child of Object.values(value)) visit(child);
    }
    schema.forEach(visit);
  } catch (error) { errors.push({ url: e.url, error: error.message }); }
}
for (const path of untranslated) {
  const r = await get('/en' + path);
  assert.equal(r.status, 307, path);
  assert.equal(new URL(r.headers.get('location'), origin).pathname, path);
  assert.ok(!entries.some(e => new URL(e.url).pathname === '/en' + path));
}
console.log(JSON.stringify({ sitemapUrls: entries.length, checked: targets.length, redirects: untranslated.length, errors }, null, 2));
assert.equal(errors.length, 0, 'candidate SEO contract failed');
