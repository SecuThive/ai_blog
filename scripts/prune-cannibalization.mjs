import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const MIN_CLUSTER=3;
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data}=await q.range(o,o+s-1);a=a.concat(data);if(data.length<s)break;o+=s;}return a;}
const pub=await fa('posts','id,title,slug,tags,content,views,category,status,published_at,excerpt,cover_image',q=>q.eq('status','published'));

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
const clusters=Object.values(groups).filter(g=>g.length>=MIN_CLUSTER).sort((a,b)=>b.length-a.length);

const demoteIds=[]; const backup=[];
for(const g of clusters){
  g.sort((a,b)=>(b.views-a.views)||(b.clen-a.clen)||((b.published_at||'').localeCompare(a.published_at||'')));
  console.log(`\n■ [${g.length}편] 공통키워드: ${[...g[0].t].slice(0,6).join(', ')}`);
  console.log(`   KEEP #${g[0].id} v${g[0].views} ${g[0].clen}자 [${g[0].category}] "${g[0].title.slice(0,48)}"`);
  for(const p of g.slice(1)){
    console.log(`   DROP #${p.id} v${p.views} ${p.clen}자 [${p.category}] "${p.title.slice(0,48)}"`);
    demoteIds.push(p.id);
    backup.push({id:p.id,title:p.title,slug:p.slug,status:p.status,category:p.category,views:p.views,tags:p.tags,published_at:p.published_at});
  }
}
console.log(`\n=== 클러스터 ${clusters.length}개 / 해제 대상 ${demoteIds.length}편 ===`);
console.log('IDs:',JSON.stringify(demoteIds));
const aiDrop=backup.filter(b=>b.category==='AI & 자동화').length;
console.log(`해제 중 AI&자동화: ${aiDrop}편 (해제 후 AI: ${pub.filter(p=>p.category==='AI & 자동화').length-aiDrop} / ${pub.length-demoteIds.length})`);

if(APPLY){
  writeFileSync(new URL('./cannibalization-prune-backup-2026-06-16.json',import.meta.url), JSON.stringify(backup,null,2));
  let ok=0;
  for(const id of demoteIds){const{error}=await sb.from('posts').update({status:'draft'}).eq('id',id);if(error)console.error('실패 #'+id,error.message);else ok++;}
  console.log(`\n✅ ${ok}/${demoteIds.length}편 draft 전환 완료. 백업: scripts/cannibalization-prune-backup-2026-06-16.json`);
}else{console.log('\n(dry-run) 확인 후 --apply');}
