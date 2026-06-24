import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fetchAll(t,c){let a=[],f=0,s=1000;for(;;){const{data,e}=await sb.from(t).select(c).range(f,f+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;f+=s;}return a;}
const posts=(await fetchAll('posts','id,title,status,content,views,published_at')).filter(p=>p.status==='published');

function toks(t){return new Set((t||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>1));}
const arr=posts.map(p=>({...p,t:toks(p.title),clen:(p.content||'').length}));
// union-find clustering at jaccard>=0.5
const parent=arr.map((_,i)=>i);
function find(x){return parent[x]===x?x:(parent[x]=find(parent[x]));}
for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
  const a=arr[i].t,b=arr[j].t;let inter=0;for(const x of a)if(b.has(x))inter++;
  if(inter/(a.size+b.size-inter)>=0.5)parent[find(i)]=find(j);
}
const groups={};
for(let i=0;i<arr.length;i++){(groups[find(i)] ||= []).push(arr[i]);}
const clusters=Object.values(groups).filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
console.log('중복 클러스터:',clusters.length,'개 / 관련 발행글 총',clusters.reduce((s,g)=>s+g.length,0),'개\n');
let keepN=0, unpubN=0;
for(const g of clusters){
  // keep: 조회수 우선, 동률이면 본문 길이, 그다음 최신
  g.sort((a,b)=>(b.views-a.views)||(b.clen-a.clen)||((b.published_at||'').localeCompare(a.published_at||'')));
  const keep=g[0];
  keepN++; unpubN+=g.length-1;
  console.log(`■ [${g.length}편] 남길글 → #${keep.id} (views ${keep.views}, ${keep.clen}자) "${keep.title.slice(0,42)}"`);
  for(const p of g.slice(1)) console.log(`    해제후보 #${p.id} (views ${p.views}, ${p.clen}자) "${p.title.slice(0,42)}"`);
}
console.log(`\n요약: 남길 글 ${keepN} / 발행해제 권장 ${unpubN}`);
// export ids
console.log('\n발행해제 후보 ID:', JSON.stringify(clusters.flatMap(g=>g.slice(1).map(p=>p.id))));
