import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const TARGETS=["LLM 애플리케이션 아키텍처 심화","LLM 에이전트 마스터 가이드","RAG 완전 정복"];
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data}=await q.range(o,o+s-1);a=a.concat(data);if(data.length<s)break;o+=s;}return a;}
const pub=await fa('posts','id,title,tags,published_at',q=>q.eq('status','published'));
const epOf=p=>{const e=(p.tags||[]).find(t=>/^ep:\d+$/.test(t));return e?+e.slice(3):9999;};
const backup=[]; let updates=[];
for(const s of TARGETS){
  const eps=pub.filter(p=>(p.tags||[]).includes(`series:${s}`)).sort((a,b)=>epOf(a)-epOf(b));
  console.log(`\n■ ${s} (${eps.length}편)`);
  eps.forEach((p,i)=>{
    const cur=epOf(p), next=i+1;
    if(cur!==next){
      const newTags=(p.tags||[]).map(t=>/^ep:\d+$/.test(t)?`ep:${next}`:t);
      console.log(`   #${p.id} ep:${cur} → ep:${next}  "${p.title.slice(0,38)}"`);
      backup.push({id:p.id,tags:p.tags});
      updates.push({id:p.id,tags:newTags});
    }
  });
}
console.log(`\n재번호 대상: ${updates.length}편`);
if(APPLY&&updates.length){
  writeFileSync(new URL('./renumber-series-backup-2026-06-16.json',import.meta.url),JSON.stringify(backup,null,2));
  let ok=0;for(const u of updates){const{error}=await sb.from('posts').update({tags:u.tags}).eq('id',u.id);if(error)console.error('실패',u.id,error.message);else ok++;}
  console.log(`✅ ${ok}편 재번호 완료. 백업 scripts/renumber-series-backup-2026-06-16.json`);
}else if(!APPLY)console.log('(dry-run) --apply 로 적용');
