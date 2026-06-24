import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');
async function fetchAll(t,c){let a=[],f=0,s=1000;for(;;){const{data,error}=await sb.from(t).select(c).range(f,f+s-1);if(error){console.error(error.message);break;}a=a.concat(data);if(data.length<s)break;f+=s;}return a;}

// 깨진 unsplash 마크다운 이미지 라인 제거. ![alt](https://source.unsplash.com/...)
const IMG_RE = /!\[[^\n]*?\]\(\s*https?:\/\/source\.unsplash\.com\/[^)\n]*\)/g;

function clean(content){
  let c = content.replace(IMG_RE, '');
  // 이미지 제거로 생긴 3+ 연속 빈 줄을 2줄로 축소
  c = c.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n');
  return c.trim();
}

const posts = await fetchAll('posts','id,title,status,content');
const affected = posts.filter(p=>IMG_RE.test(p.content||'') && (IMG_RE.lastIndex=0,true));
console.log(APPLY?'*** APPLY MODE ***':'*** DRY RUN (--apply 로 실제 적용) ***');
console.log('대상 글:', affected.length, '(published', affected.filter(p=>p.status==='published').length, '/ draft', affected.filter(p=>p.status==='draft').length, ')');

// 샘플 미리보기 1건
const sample = affected[0];
const m = (sample.content.match(IMG_RE)||[]);
console.log('\n[샘플 #'+sample.id+'] 제거될 이미지 마크다운:', JSON.stringify(m[0]));
console.log('변경 전 길이:', sample.content.length, '→ 후:', clean(sample.content).length);

let changed=0, multi=0;
for (const p of affected) {
  const imgs = (p.content.match(IMG_RE)||[]); if(imgs.length>1)multi++;
  const newContent = clean(p.content);
  if (newContent === p.content) continue;
  if (APPLY) {
    const{error}=await sb.from('posts').update({content:newContent}).eq('id',p.id);
    if(error){console.error('#'+p.id,error.message);continue;}
  }
  changed++;
}
console.log('\n이미지 2개 이상 포함 글:', multi);
console.log((APPLY?'수정 완료':'수정 예정')+' 글 수:', changed);
