import { createClient } from '@supabase/supabase-js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const line of env.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] ??= match[2].trim();
}

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const posts = [];
for (let offset = 0; ; offset += 1000) {
  const { data, error } = await client.from('posts')
    .select('id,slug,title,excerpt,author,published_at,updated_at,cover_image,content')
    .eq('status', 'published')
    .range(offset, offset + 999);
  if (error) throw error;
  posts.push(...data);
  if (data.length < 1000) break;
}

const references = [];
for (const post of posts) {
  if (post.cover_image) references.push({ id: post.id, slug: post.slug, kind: 'cover', url: post.cover_image });
  for (const match of (post.content ?? '').matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)(?:\s+[^)]*)?\)/g)) {
    references.push({ id: post.id, slug: post.slug, kind: 'markdown', url: match[1] });
  }
  for (const match of (post.content ?? '').matchAll(/<img\b[^>]*\bsrc=["'](https?:\/\/[^"']+)["']/gi)) {
    references.push({ id: post.id, slug: post.slug, kind: 'html', url: match[1] });
  }
}

const uniqueUrls = [...new Set(references.map(reference => reference.url))];
const results = [];
for (let start = 0; start < uniqueUrls.length; start += 8) {
  const batch = uniqueUrls.slice(start, start + 8);
  results.push(...await Promise.all(batch.map(async url => {
    try {
      const response = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Mozilla/5.0 THIVELABImageAudit/1.0' } });
      await response.body?.cancel();
      return { url, status: response.status, type: response.headers.get('content-type') ?? '' };
    } catch (error) {
      return { url, status: 0, error: error.cause?.code ?? error.name };
    }
  })));
}

const byUrl = new Map(results.map(result => [result.url, result]));
const failures = references.filter(reference => {
  const result = byUrl.get(reference.url);
  return result.status !== 200 || !result.type.startsWith('image/');
}).map(reference => ({ ...reference, ...byUrl.get(reference.url) }));
const summary = {
  publishedPosts: posts.length,
  imageReferences: references.length,
  uniqueUrls: uniqueUrls.length,
  failedReferences: failures.length,
  failedUrls: new Set(failures.map(failure => failure.url)).size,
  failures,
};
const exportArg = process.argv.find(argument => argument.startsWith('--export-dir='));
if (exportArg) {
  const directory = exportArg.slice('--export-dir='.length);
  if (!directory.startsWith('/private/tmp/')) throw new Error('Audit export must be under /private/tmp');
  mkdirSync(directory, { recursive: true });
  for (const post of posts) {
    const filename = `${post.id}-${post.slug.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)}.md`;
    const frontmatter = [
      '---',
      `title: ${JSON.stringify(post.title)}`,
      `description: ${JSON.stringify(post.excerpt ?? '')}`,
      `author: ${JSON.stringify(post.author ?? '')}`,
      `date: ${JSON.stringify(post.published_at ?? '')}`,
      `updated: ${JSON.stringify(post.updated_at ?? '')}`,
      `canonical: ${JSON.stringify(`https://www.thivelab.com/blog/${post.slug}`)}`,
      '---', '',
    ].join('\n');
    writeFileSync(`${directory}/${filename}`, `${frontmatter}${post.content ?? ''}\n`);
  }
  summary.exportedDirectory = directory;
}
console.log(JSON.stringify(summary, null, 2));
