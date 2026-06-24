import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

// [id, [from, to], ...] — to=null 이면 줄 제거
const fixes=[
  {id:336, from:'[더 자세한 정보 및 AWS OpenSearch/Kendra 체험하기] **(Affiliate Link Placeholder)**', to:''},
  {id:108, from:'> **[Conceptual Diagram Placeholder: 비결정성 흐름]**', to:'> **비결정성 흐름 (개념도)**'},
  {id:15,  from:'기술 스택 선택 가이드 (광고/제휴 최적화 영역)', to:'기술 스택 선택 가이드'},
];

const backup=[];
for(const f of fixes){
  const {data,error}=await sb.from('posts').select('id,title,content').eq('id',f.id).single();
  if(error){console.error('조회실패 #'+f.id,error.message);continue;}
  const c=data.content;
  const cnt=c.split(f.from).length-1;
  if(cnt!==1){console.error(`⚠️ #${f.id}: from 문자열 매칭 ${cnt}회 (1이어야 함) — 건너뜀`);continue;}
  let nc=c.replace(f.from, f.to);
  // 빈 줄 잔재 정리: to='' 이고 그 줄이 통째로 비면 빈 줄 합치기
  if(f.to==='') nc=nc.replace(/\n[ \t]*\n[ \t]*\n/g,'\n\n');
  backup.push({id:data.id,title:data.title,content:c});
  console.log(`#${f.id} "${data.title.slice(0,34)}"  -${c.length}자 → ${nc.length}자  (${cnt}곳 치환)`);
  if(APPLY){
    const {error:e2}=await sb.from('posts').update({content:nc}).eq('id',f.id);
    if(e2)console.error('  업데이트 실패:',e2.message); else console.log('  ✅ 적용됨');
  }
}
if(APPLY&&backup.length){
  writeFileSync(new URL('./scaffolding-leaks-backup-2026-06-16.json',import.meta.url), JSON.stringify(backup,null,2));
  console.log('\n백업 저장: scripts/scaffolding-leaks-backup-2026-06-16.json ('+backup.length+'편)');
}else if(!APPLY){console.log('\n(dry-run) --apply 로 실제 적용');}
