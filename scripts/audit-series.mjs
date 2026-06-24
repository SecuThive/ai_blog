import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data}=await q.range(o,o+s-1);a=a.concat(data);if(data.length<s)break;o+=s;}return a;}
const pub=await fa('posts','id,title,tags,status,published_at',q=>q.eq('status','published'));
const draft=await fa('posts','id,title,tags',q=>q.eq('status','draft'));

function seriesOf(p){return (p.tags||[]).filter(t=>t.startsWith('series:')).map(t=>t.slice(7));}
function epOf(p){const e=(p.tags||[]).find(t=>/^ep:\d+$/.test(t));return e?+e.slice(3):null;}

const map={};
for(const p of pub)for(const s of seriesOf(p)){(map[s]||=[]).push(p);}
const draftSeries={};
for(const p of draft)for(const s of seriesOf(p)){(draftSeries[s]||=[]).push(epOf(p));}

const names=Object.keys(map).sort();
console.log('발행 시리즈:',names.length,'개\n');
let problems=[];
for(const s of names){
  const eps=map[s].map(epOf);
  const withEp=eps.filter(e=>e!=null).sort((a,b)=>a-b);
  const noEp=eps.filter(e=>e==null).length;
  const n=map[s].length;
  const maxEp=withEp.length?withEp[withEp.length-1]:0;
  // 갭: 1..maxEp 중 빠진 번호 (단, draft로 내려간 에피소드면 갭 원인)
  const present=new Set(withEp);
  const gaps=[];
  for(let i=1;i<=maxEp;i++)if(!present.has(i))gaps.push(i);
  const dup=withEp.length!==new Set(withEp).size;
  let flag='';
  if(n===1)flag='⚠️단일에피소드';
  else if(gaps.length)flag=`❌갭[${gaps.join(',')}]`;
  else if(dup)flag='❌ep중복';
  else if(noEp)flag=`⚠️ep태그없음${noEp}편`;
  if(flag)problems.push(s);
  console.log(`${flag?flag:'✅'.padEnd(2)} [${n}편 ep:${withEp.join('/')||'-'}${noEp?` +무번호${noEp}`:''}] ${s}${draftSeries[s]?` (draft에 ep:${(draftSeries[s].filter(x=>x).sort((a,b)=>a-b)).join(',')||'?'})`:''}`);
}
console.log(`\n문제 시리즈: ${problems.length}개`);
