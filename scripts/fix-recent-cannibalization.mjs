// 최근 자동발행분에서 확인된 근접중복 3쌍 정리.
// 각 쌍에서 조회수↑(동률 시 더 오래 색인된 older)을 KEEP, 최근 중복본을 draft 강등.
// 백업 후 --apply 로 적용. 복구: backup JSON의 id를 status='published'로 되돌리면 됨.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
// DROP id → KEEP id (근거)
const PAIRS=[
  {drop:756, keep:634, topic:'git refusing to merge unrelated histories'},
  {drop:757, keep:655, topic:"git detected dubious ownership"},
  {drop:759, keep:610, topic:'OutOfMemoryError Java heap space'},
];
const ids=PAIRS.map(p=>p.drop);
const {data:rows}=await sb.from('posts').select('id,title,slug,status,views,published_at,category,tags').in('id',[...ids,...PAIRS.map(p=>p.keep)]);
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
console.log('=== 최근 중복 3쌍 정리 ===');
for(const p of PAIRS){
  const d=byId[p.drop],k=byId[p.keep];
  console.log(`\n[${p.topic}]`);
  console.log(`  KEEP #${k.id} v${k.views} ${(k.published_at||'').slice(0,10)} "${k.title.slice(0,46)}" (${k.status})`);
  console.log(`  DROP #${d.id} v${d.views} ${(d.published_at||'').slice(0,10)} "${d.title.slice(0,46)}" (${d.status})`);
}
const backup=ids.map(id=>byId[id]).filter(Boolean);
if(APPLY){
  writeFileSync(new URL('./recent-cannibalization-backup-2026-07-03.json',import.meta.url),JSON.stringify(backup,null,2));
  let ok=0;
  for(const id of ids){const{error}=await sb.from('posts').update({status:'draft'}).eq('id',id);if(error)console.error('실패#'+id,error.message);else ok++;}
  console.log(`\n✅ ${ok}/${ids.length}편 draft 강등 완료. 백업: scripts/recent-cannibalization-backup-2026-07-03.json`);
}else{console.log('\n(dry-run) --apply 로 적용');}
