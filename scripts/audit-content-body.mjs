import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data,e}=await q.range(o,o+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;o+=s;}return a;}

const pub=await fa('posts','id,title,slug,content,category,published_at',q=>q.eq('status','published'));
console.log('발행글:',pub.length,'\n');

// 코드펜스(```...```) 와 인라인코드(`...`) 제거 → 산문만 남김
function prose(c){
  return (c||'')
    .replace(/```[\s\S]*?```/g,' ⟦CODE⟧ ')
    .replace(/`[^`\n]*`/g,' ')
    .replace(/\$\$[\s\S]*?\$\$/g,' ')   // LaTeX block
    .replace(/\$[^$\n]*\$/g,' ');        // LaTeX inline
}

// 산문에서만 의심 — 진짜 누출/플레이스홀더/메타발화
const checks=[
  ['플레이스홀더 누출', /placeholder|conceptual diagram|여기에 (이미지|그림|표|차트)|\[이미지[\]:]|\[그림[\]:]|\[차트[\]:]|삽입 ?예정|TODO|TBD|lorem ipsum|작성 중입니다|준비 중입니다/i],
  ['프롬프트/지시문 누출(산문)', /CEO님|지시를 기다|SEO 최적화된 블로그 제목|시리즈명을 입력|위 (제목|내용)으로 (글|본문)을 작성|다음 조건에 맞[춰게] (글|블로그)/],
  ['AI 1인칭 메타발화', /제가 (작성|준비)해 ?드리|AI ?(언어|어시스턴트) ?모델로서|언어모델로서|죄송하지만 (저는|제가)|as an AI|I'?m sorry,? but|I cannot (assist|help|provide)|here is the (article|blog|content)/i],
  ['문장 중 코드조각 누출', /작성해\s?주세요\.?'\)|print\(|입니다\.?'\)|"\)\s*$/m],
  ['깨진이미지', /source\.unsplash\.com|!\[[^\]]*\]\(\s*\)|via\.placeholder|example\.com\/(image|img)/],
];

const flags={};
for(const [name] of checks)flags[name]=[];
for(const p of pub){
  const pr=prose(p.content);
  for(const [name,re] of checks){ if(re.test(pr))flags[name].push(p); }
}

for(const [name,re] of checks){
  const list=flags[name];
  console.log(`\n=== [${name}] ${list.length}건 ===`);
  for(const p of list){
    const pr=prose(p.content);
    const m=pr.match(re);
    const idx=m?pr.indexOf(m[0]):0;
    const ctx=pr.slice(Math.max(0,idx-50),idx+90).replace(/\s+/g,' ');
    console.log(`  #${p.id} "${p.title.slice(0,40)}"\n      …${ctx}…`);
  }
}

// 본문 끝 잘림(코드블록 밖에서 문장부호로 안 끝남)
console.log('\n=== [본문 끝 잘림 의심] ===');
const trunc=pub.filter(p=>{const c=(p.content||'').trim();return c.length>200 && /[,:、(（]$/.test(c.slice(-1));});
for(const p of trunc)console.log(`  #${p.id} "${p.title.slice(0,40)}" …끝: "${(p.content||'').trim().slice(-45).replace(/\n/g,'⏎')}"`);
console.log('  총',trunc.length,'건');

// 너무 짧은 본문
const short=pub.filter(p=>(p.content||'').length<1500).sort((a,b)=>(a.content||'').length-(b.content||'').length);
console.log('\n=== [짧은 본문 <1500자] ',short.length,'건 ===');
for(const p of short)console.log(`  #${p.id} (${(p.content||'').length}자) "${p.title.slice(0,46)}" [${p.category}]`);
