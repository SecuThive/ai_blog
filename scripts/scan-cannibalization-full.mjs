import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data}=await q.range(o,o+s-1);a=a.concat(data);if(data.length<s)break;o+=s;}return a;}
const pub=await fa('posts','id,title,slug,tags,content,views,category,status,published_at',q=>q.eq('status','published'));
const STOP=new Set(['가이드','완벽','실전','전략','구축','방법','위한','이해','활용','시대','넘어','정리','핵심','필독','기반','대한','만드는','당신','우리','모든','그리고','에러','해결','해결법','진단','원인','런북','가지','완전','정복','및']);
function toks(t){return new Set((t||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w)));}
const arr=pub.map(p=>({...p,t:toks(p.title),tg:new Set((p.tags||[]).filter(x=>!/^(series:|ep:)/.test(x))),clen:(p.content||'').length}));
const parent=arr.map((_,i)=>i);const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));
function jac(a,b){let i=0;for(const x of a)if(b.has(x))i++;return i/(a.size+b.size-i||1);}
function tagOv(a,b){let i=0;for(const x of a)if(b.has(x))i++;return i;}
const pairSim={};
for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
  const js=jac(arr[i].t,arr[j].t),to=tagOv(arr[i].tg,arr[j].tg);
  if(js>=0.35||to>=4){const r=find(i),s=find(j);if(r!==s){parent[r]=s;}pairSim[[arr[i].id,arr[j].id]]=`J${(js*100)|0}/T${to}`;}
}
const groups={};for(let i=0;i<arr.length;i++)(groups[find(i)]||=[]).push(arr[i]);
const clusters=Object.values(groups).filter(g=>g.length>=2).sort((a,b)=>b.length-a.length);
let drop=0;const dropIds=[];
for(const g of clusters){
  g.sort((a,b)=>(b.views-a.views)||(b.clen-a.clen)||((b.published_at||'').localeCompare(a.published_at||'')));
  const kdate=(g[0].published_at||'').slice(0,10);
  console.log(`\n■ [${g.length}편] "${[...g[0].t].slice(0,5).join(', ')}"`);
  console.log(`   KEEP  #${g[0].id} v${g[0].views} ${g[0].clen}자 ${kdate} [${g[0].category}] ${g[0].title.slice(0,52)}`);
  for(const p of g.slice(1)){dropIds.push(p.id);drop++;console.log(`   DROP  #${p.id} v${p.views} ${p.clen}자 ${(p.published_at||'').slice(0,10)} [${p.category}] ${p.title.slice(0,52)}`);}
}
console.log(`\n=== 클러스터 ${clusters.length}개(2편+) / DROP 후보 ${drop}편 / 전체 ${pub.length} ===`);
console.log('  2편 클러스터:',clusters.filter(g=>g.length===2).length,'| 3편+:',clusters.filter(g=>g.length>=3).length);
console.log('DROP_IDS='+JSON.stringify(dropIds));
