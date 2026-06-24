import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

const fixes=[
  {id:61,  from:'**🛠️ 데이터 흐름 개념도 (Conceptual Diagram)**\n\n(독자 여러분이 머릿속으로 그려보세요. 이 흐름이 바로 서비스의 핵심입니다.)\n\n', to:'**🛠️ 데이터 흐름 개념도**\n\n'},
  {id:120, from:'### 🛠️ 개념 아키텍처 흐름도 (Conceptual Diagram)', to:'### 🛠️ 개념 아키텍처 흐름도'},
  {id:307, from:'### 🏗️ 필수 아키텍처 흐름도 (Conceptual Diagram)', to:'### 🏗️ 필수 아키텍처 흐름도'},
  {id:512, from:'> **[아키텍처 흐름 시각화 (Conceptual Diagram)]**', to:'> **아키텍처 흐름 시각화**'},
  {id:359, from:'> **[필수 포함] ReAct 패턴의 구조적 흐름도 (Conceptual Diagram)**', to:'> **ReAct 패턴의 구조적 흐름도**'},
];

const backup=[];
for(const f of fixes){
  const {data,error}=await sb.from('posts').select('id,title,content').eq('id',f.id).single();
  if(error){console.error('조회실패 #'+f.id,error.message);continue;}
  const c=data.content;
  const cnt=c.split(f.from).length-1;
  if(cnt!==1){console.error(`⚠️ #${f.id}: from 매칭 ${cnt}회 (1이어야 함) — 건너뜀`);continue;}
  const nc=c.replace(f.from,f.to);
  backup.push({id:data.id,title:data.title,content:c});
  console.log(`#${f.id} "${data.title.slice(0,32)}"  ${c.length}→${nc.length}자  (라벨 정리)`);
  if(APPLY){
    const {error:e2}=await sb.from('posts').update({content:nc}).eq('id',f.id);
    if(e2)console.error('  실패:',e2.message); else console.log('  ✅ 적용');
  }
}
if(APPLY&&backup.length){
  writeFileSync(new URL('./conceptual-diagram-backup-2026-06-16.json',import.meta.url), JSON.stringify(backup,null,2));
  console.log('\n백업: scripts/conceptual-diagram-backup-2026-06-16.json ('+backup.length+'편)');
}else if(!APPLY)console.log('\n(dry-run) --apply 로 적용');
