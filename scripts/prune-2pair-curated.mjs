import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
// 손으로 검수한 '진짜 근접중복'에서 저조한 1편씩만 해제. (과병합/별개 9쌍은 제외)
const DEMOTE=[73,646,137,75,505,358,387,390,430,365,316,389,64,186,520,229,650,652];
const KEEP_PAIR={73:103,646:645,137:241,75:135,505:394,358:34,387:304,390:347,430:413,365:255,316:345,389:392,64:284,186:250,520:243,229:247,650:589,652:590};
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data}=await q.range(o,o+s-1);a=a.concat(data);if(data.length<s)break;o+=s;}return a;}
const rows=await fa('posts','id,title,slug,status,category,views,tags,published_at',q=>q.in('id',[...DEMOTE,...Object.values(KEEP_PAIR)]));
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
const backup=[]; let bad=0;
for(const id of DEMOTE){
  const p=byId[id], keep=byId[KEEP_PAIR[id]];
  if(!p){console.log(`⚠️ #${id} 없음 — 건너뜀`);bad++;continue;}
  if(p.status!=='published'){console.log(`⚠️ #${id} 이미 ${p.status} — 건너뜀`);bad++;continue;}
  if(!keep||keep.status!=='published'){console.log(`⚠️ 유지대상 #${KEEP_PAIR[id]} 발행 아님 — #${id} 보류`);bad++;continue;}
  console.log(`DROP #${id} v${p.views} "${p.title.slice(0,40)}"  → 유지 #${keep.id} v${keep.views} "${keep.title.slice(0,32)}"`);
  backup.push({id:p.id,title:p.title,slug:p.slug,status:p.status,category:p.category,views:p.views,tags:p.tags,published_at:p.published_at});
}
console.log(`\n해제 ${backup.length}편 / 스킵 ${bad}편`);
if(APPLY&&backup.length){
  writeFileSync(new URL('./prune-2pair-backup-2026-06-16.json',import.meta.url),JSON.stringify(backup,null,2));
  let ok=0; for(const b of backup){const{error}=await sb.from('posts').update({status:'draft'}).eq('id',b.id);if(error)console.error('실패',b.id,error.message);else ok++;}
  console.log(`✅ ${ok}편 draft 전환. 백업 scripts/prune-2pair-backup-2026-06-16.json`);
}else if(!APPLY)console.log('(dry-run) --apply 로 적용');
