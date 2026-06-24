import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const THRESHOLD=1;  // 발행 에피소드가 이 수 이하인 시리즈를 강등
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data,e}=await q.range(o,o+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;o+=s;}return a;}

const pub=await fa('posts','id,title,tags',q=>q.eq('status','published'));
const series={};
for(const p of pub){const st=(p.tags||[]).find(t=>t.startsWith('series:'));if(!st)continue;(series[st.slice(7)]||=[]).push(p);}
const targets=Object.entries(series).filter(([,eps])=>eps.length<=THRESHOLD);
console.log(`${APPLY?'*** APPLY ***':'*** DRY RUN ***'} 강등 대상 시리즈: ${targets.length}개 (≤${THRESHOLD}편)`);

const backup=[];
for(const [name,eps] of targets){
  for(const p of eps){
    const removed=(p.tags||[]).filter(t=>/^series:/.test(t)||/^ep:\d+$/.test(t));
    const kept=(p.tags||[]).filter(t=>!/^series:/.test(t)&&!/^ep:\d+$/.test(t));
    backup.push({id:p.id, title:p.title, removed, before:p.tags});
    console.log(`  #${p.id} "${name}" 제거:[${removed.join(', ')}] → 남김 ${kept.length}개`);
    if(APPLY){const{error}=await sb.from('posts').update({tags:kept}).eq('id',p.id);if(error)console.error('  ✗',p.id,error.message);}
  }
}
if(APPLY){
  writeFileSync(new URL('./demoted-series-backup-2026-06-07.json',import.meta.url), JSON.stringify(backup,null,2));
  console.log('\n→ 백업 저장: scripts/demoted-series-backup-2026-06-07.json');
}
// 결과 요약
const remain={};
for(const p of pub){const st=(p.tags||[]).find(t=>t.startsWith('series:'));if(!st)continue;(remain[st.slice(7)]||=[]).push(p);}
console.log(`\n강등 ${backup.length}개 글. (적용 후) 남는 시리즈 수 예상: ${Object.keys(series).length - targets.length}`);
