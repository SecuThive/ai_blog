import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data,e}=await q.range(o,o+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;o+=s;}return a;}

const pub=await fa('posts','id,title,slug,excerpt,content,category,tags,views,published_at',q=>q.eq('status','published'));
const len=s=>(s||'').length;
console.log('발행글:',pub.length);

// 카테고리 분포
const cat={}; for(const p of pub)cat[p.category]=(cat[p.category]||0)+1;
console.log('카테고리:',cat);

// 1) 얇은 글 (low value 리스크)
const thin=pub.filter(p=>len(p.content)<1800).sort((a,b)=>len(a.content)-len(b.content));
console.log('\n[A] 얇은 글(<1800자):',thin.length);
for(const p of thin)console.log(`  #${p.id} (${len(p.content)}자) "${p.title.slice(0,46)}" [${p.category}]`);

// 2) 애매/템플릿 제목
const vague=pub.filter(p=>/SEO 최적화|기획서|제목|중 하나|\{\{|placeholder|테스트|샘플|untitled/i.test(p.title) || len(p.title)<8);
console.log('\n[B] 애매/템플릿 제목:',vague.length);
for(const p of vague)console.log(`  #${p.id} "${p.title}"`);

// 3) 근접 중복 (제목 토큰 자카드 >=0.45) 클러스터
function toks(t){return new Set((t||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>1));}
const arr=pub.map(p=>({...p,t:toks(p.title),clen:len(p.content)}));
const parent=arr.map((_,i)=>i); const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));
for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){const a=arr[i].t,b=arr[j].t;let inter=0;for(const x of a)if(b.has(x))inter++;if(inter/(a.size+b.size-inter)>=0.45)parent[find(i)]=find(j);}
const groups={}; for(let i=0;i<arr.length;i++)(groups[find(i)]||=[]).push(arr[i]);
const clusters=Object.values(groups).filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
console.log('\n[C] 근접중복 클러스터:',clusters.length,'개 / 글',clusters.reduce((s,g)=>s+g.length,0));
let unpub=[];
for(const g of clusters){
  g.sort((a,b)=>(b.views-a.views)||(b.clen-a.clen)||((b.published_at||'').localeCompare(a.published_at||'')));
  console.log(`■ [${g.length}편] 유지 #${g[0].id} (v${g[0].views},${g[0].clen}자) "${g[0].title.slice(0,40)}"`);
  for(const p of g.slice(1)){console.log(`    중복 #${p.id} (v${p.views},${p.clen}자) "${p.title.slice(0,40)}"`);unpub.push(p.id);}
}
console.log('\n중복 발행해제 후보 ID:',JSON.stringify(unpub));
console.log('총 발행해제 후보:',unpub.length);
