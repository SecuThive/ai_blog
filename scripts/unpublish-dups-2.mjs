import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data,e}=await q.range(o,o+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;o+=s;}return a;}

// 운영/메타성 글 — 독자용 아님, 항상 발행해제 대상
const META_IDS=[467,576];

const pub=await fa('posts','id,title,slug,content,category,tags,views,status,published_at',q=>q.eq('status','published'));
console.log('발행글:',pub.length);

// audit-adsense.mjs 와 동일한 클러스터 로직 (제목 토큰 자카드 >=0.45)
const len=s=>(s||'').length;
function toks(t){return new Set((t||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>1));}
const arr=pub.map(p=>({...p,t:toks(p.title),clen:len(p.content)}));
const parent=arr.map((_,i)=>i); const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));
for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){const a=arr[i].t,b=arr[j].t;let inter=0;for(const x of a)if(b.has(x))inter++;if(inter/(a.size+b.size-inter)>=0.45)parent[find(i)]=find(j);}
const groups={}; for(let i=0;i<arr.length;i++)(groups[find(i)]||=[]).push(arr[i]);
const clusters=Object.values(groups).filter(g=>g.length>1).sort((a,b)=>b.length-a.length);

const unpub=[];
for(const g of clusters){
  g.sort((a,b)=>(b.views-a.views)||(b.clen-a.clen)||((b.published_at||'').localeCompare(a.published_at||'')));
  console.log(`■ [${g.length}편] 유지 #${g[0].id} (v${g[0].views},${g[0].clen}자) "${g[0].title.slice(0,40)}"`);
  for(const p of g.slice(1)){console.log(`    해제 #${p.id} (v${p.views},${p.clen}자) "${p.title.slice(0,40)}"`);unpub.push(p.id);}
}
for(const id of META_IDS){
  const p=pub.find(x=>x.id===id);
  if(p&&!unpub.includes(id)){console.log(`■ 메타글 해제 #${id} "${p.title.slice(0,40)}"`);unpub.push(id);}
}
console.log(`\n클러스터 ${clusters.length}개 / 발행해제 대상 ${unpub.length}편 (중복 ${unpub.length-META_IDS.filter(id=>pub.some(p=>p.id===id)).length} + 메타)`);

if(!APPLY){console.log('\n*** DRY RUN *** --apply 로 실행하면 백업 후 draft 전환');process.exit(0);}

// 백업 (전체 행) 후 draft 전환
const rows=pub.filter(p=>unpub.includes(p.id)).map(({t,clen,...r})=>r);
const bak=new URL('./dup-cleanup-backup-2026-06-12.json',import.meta.url);
writeFileSync(bak,JSON.stringify(rows,null,1));
console.log('백업:',bak.pathname,`(${rows.length}편)`);
const{data,error}=await sb.from('posts').update({status:'draft'}).in('id',unpub).select('id');
if(error){console.error(error.message);process.exit(1);}
console.log('완료:',data.length,'편 draft 전환');
const{count}=await sb.from('posts').select('id',{count:'exact',head:true}).eq('status','published');
console.log('현재 published 글 수:',count);
