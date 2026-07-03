// A그룹(명백중복 6쌍)+B그룹(최근분 유지 3쌍) 정리. 백업 후 --apply. 복구: backup id를 published로.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const PAIRS=[
  // A: 명백 중복 — 원본/우세본 유지
  {drop:705, keep:599, g:'A', topic:'PostgreSQL too many clients'},
  {drop:290, keep:233, g:'A', topic:'LLM 에이전트(챗봇→자율)'},
  {drop:761, keep:623, g:'A', topic:'Terraform state lock'},
  {drop:715, keep:716, g:'A', topic:'L4 vs L7 로드밸런서'},
  {drop:737, keep:589, g:'A', topic:'2026 ISMS-P 체크리스트'},
  {drop:758, keep:630, g:'A', topic:'PKIX path building failed'},
  // B: 최근분 유지 — 오래된 쪽 강등
  {drop:635, keep:747, g:'B', topic:'git push non-fast-forward'},
  {drop:175, keep:293, g:'B', topic:'RAG 성능 최적화'},
  {drop:595, keep:736, g:'B', topic:'publickey 인증 실패'},
];
const ids=PAIRS.map(p=>p.drop);
const {data:rows}=await sb.from('posts').select('id,title,slug,status,views,published_at,category,tags').in('id',[...ids,...PAIRS.map(p=>p.keep)]);
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
let warn=0;
for(const p of PAIRS){
  const d=byId[p.drop],k=byId[p.keep];
  const kbad=k.status!=='published'?'  ⚠KEEP가 published 아님':'';
  console.log(`\n[${p.g}] ${p.topic}${kbad}`);
  console.log(`  KEEP #${k.id} v${k.views} ${(k.published_at||'').slice(0,10)} "${k.title.slice(0,44)}" (${k.status})`);
  console.log(`  DROP #${d.id} v${d.views} ${(d.published_at||'').slice(0,10)} "${d.title.slice(0,44)}" (${d.status})`);
  if(k.status!=='published')warn++;
}
console.log(`\n총 DROP ${ids.length}편 (A:6, B:3)${warn?`  ⚠경고 ${warn}건`:''}`);
if(APPLY){
  writeFileSync(new URL('./cannibalization-ab-backup-2026-07-03.json',import.meta.url),JSON.stringify(ids.map(id=>byId[id]),null,2));
  let ok=0; for(const id of ids){const{error}=await sb.from('posts').update({status:'draft'}).eq('id',id);if(error)console.error('실패#'+id,error.message);else ok++;}
  console.log(`✅ ${ok}/${ids.length}편 draft 강등 완료. 백업: scripts/cannibalization-ab-backup-2026-07-03.json`);
}else console.log('(dry-run) --apply 로 적용');
