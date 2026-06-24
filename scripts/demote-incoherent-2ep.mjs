import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const TARGETS=["LLMOps 실전 마스터 가이드","LLM 실전 구축 가이드","엔터프라이즈 데이터 연동 AI 가이드"];
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data,e}=await q.range(o,o+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;o+=s;}return a;}
const pub=await fa('posts','id,title,tags',q=>q.eq('status','published'));
console.log(APPLY?'*** APPLY ***':'*** DRY RUN ***');
const backup=[];
for(const name of TARGETS){
  const eps=pub.filter(p=>(p.tags||[]).includes(`series:${name}`));
  console.log(`\n■ "${name}" (${eps.length}편)`);
  for(const p of eps){
    const removed=(p.tags||[]).filter(t=>/^series:/.test(t)||/^ep:\d+$/.test(t));
    const kept=(p.tags||[]).filter(t=>!/^series:/.test(t)&&!/^ep:\d+$/.test(t));
    backup.push({id:p.id,title:p.title,removed,before:p.tags});
    console.log(`  #${p.id} 제거:[${removed.join(', ')}] → 남김 ${kept.length}개  "${p.title.slice(0,40)}"`);
    if(APPLY){const{error}=await sb.from('posts').update({tags:kept}).eq('id',p.id);if(error)console.error('  ✗',error.message);}
  }
}
if(APPLY){writeFileSync(new URL('./demoted-2ep-backup-2026-06-07.json',import.meta.url),JSON.stringify(backup,null,2));console.log('\n→ 백업: scripts/demoted-2ep-backup-2026-06-07.json');}
console.log(`\n강등 ${backup.length}개 글`);
