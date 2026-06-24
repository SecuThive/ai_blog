import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const posts = JSON.parse(readFileSync(resolve(__dirname, 'posts-data.json'), 'utf-8'));

const API_KEY = 'sb_publishable_KLMgvewGeEnTH6dcwDDhSw_zs4BPex7';
const BASE_URL = 'http://localhost:3000';

let success = 0;
let fail = 0;

console.log(`\n📝 총 ${posts.length}편 삽입 시작\n`);

for (const [i, post] of posts.entries()) {
  process.stdout.write(`[${i + 1}/${posts.length}] [${post.category}] ${post.title.slice(0, 45)}... `);

  try {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(post),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log(`❌ (${res.status}) ${err.slice(0, 80)}`);
      fail++;
    } else {
      const data = await res.json();
      console.log(`✅ slug: ${data.post?.slug ?? '?'}`);
      success++;
    }
  } catch (e) {
    console.log(`❌ ${e.message}`);
    fail++;
  }

  if (i < posts.length - 1) await new Promise(r => setTimeout(r, 300));
}

console.log(`\n✨ 완료 — 성공: ${success}편, 실패: ${fail}편\n`);
