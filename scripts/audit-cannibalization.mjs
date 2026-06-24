import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data}=await q.range(o,o+s-1);a=a.concat(data);if(data.length<s)break;o+=s;}return a;}
const pub=await fa('posts','id,title,tags,content,views,category,published_at',q=>q.eq('status','published'));
console.log('발행글:',pub.length);
const cat={}; for(const p of pub)cat[p.category]=(cat[p.category]||0)+1;
console.log('카테고리 분포:',JSON.stringify(cat),'\n');

const STOP=new Set(['가이드','완벽','실전','전략','구축','방법','위한','이해','활용','시대','넘어','정리','핵심','필독','기반','대한','만드는','당신','우리','모든','그리고']);
function toks(t){return new Set((t||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w)));}
const arr=pub.map(p=>({...p,t:toks(p.title),tg:new Set((p.tags||[]).filter(x=>!/^(series:|ep:)/.test(x))),clen:(p.content||'').length}));
const parent=arr.map((_,i)=>i); const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));
function jac(a,b){let i=0;for(const x of a)if(b.has(x))i++;return i/(a.size+b.size-i||1);}
function tagOv(a,b){let i=0;for(const x of a)if(b.has(x))i++;return i;}
for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
  if(jac(arr[i].t,arr[j].t)>=0.35 || tagOv(arr[i].tg,arr[j].tg)>=4) parent[find(i)]=find(j);
}
const groups={}; for(let i=0;i<arr.length;i++)(groups[find(i)]||=[]).push(arr[i]);
const clusters=Object.values(groups).filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
console.log('자기잠식 클러스터:',clusters.length,'개 / 관련글',clusters.reduce((s,g)=>s+g.length,0),'\n');
let demote=0;
for(const g of clusters){
  g.sort((a,b)=>(b.views-a.views)||(b.clen-a.clen)||((b.published_at||'').localeCompare(a.published_at||'')));
  demote+=g.length-1;
  console.log(`■ [${g.length}편] 대표키워드 일부: ${[...g[0].t].slice(0,5).join(',')}`);
  for(let k=0;k<g.length;k++){const p=g[k];console.log(`   ${k===0?'KEEP ':'  dem'} #${p.id} v${p.views} ${p.clen}자 "${p.title.slice(0,44)}"`);}
}
console.log(`\n해제 권장(보수적, 클러스터당 1편 유지): ${demote}편`);
