import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

// 손검수 확정: RAG환각 클러스터 #289 유지 / nginx502 클러스터 #742(최신·고품질) 유지
const DRAFT_IDS=[295,728,706,710,735, 579,666];

const {data:rows}=await sb.from('posts').select('id,title,slug,status,category,views,tags,published_at,content').in('id',[...DRAFT_IDS,334]);
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
const backup={drafted:[],edited:[]};

console.log('=== draft 전환 대상 (백업 후 status=draft) ===');
for(const id of DRAFT_IDS){
  const r=byId[id];
  console.log(`  #${id} v${r.views} [${r.category}] "${r.title.slice(0,46)}"`);
  backup.drafted.push({id:r.id,title:r.title,slug:r.slug,status:r.status,category:r.category,views:r.views,tags:r.tags,published_at:r.published_at});
}

// #334 스캐폴딩 마커 제거
const p334=byId[334];
const before=p334.content;
const after=before.replace(/\*\*\[필수 포함\]\s*/g,'**').replace(/\[필수 포함\]\s*/g,'');
console.log('\n=== #334 누출 수정 ===');
console.log('  [필수 포함] 출현:',(before.match(/\[필수 포함\]/g)||[]).length,'→',(after.match(/\[필수 포함\]/g)||[]).length);
backup.edited.push({id:334,field:'content',before});

if(APPLY){
  writeFileSync(new URL('./curated-fix-backup-2026-06-24.json',import.meta.url),JSON.stringify(backup,null,2));
  let ok=0;
  for(const id of DRAFT_IDS){const{error}=await sb.from('posts').update({status:'draft'}).eq('id',id);if(error)console.error('실패#'+id,error.message);else ok++;}
  const{error:e2}=await sb.from('posts').update({content:after}).eq('id',334);
  console.log(`\n✅ draft ${ok}/${DRAFT_IDS.length}편, #334 수정 ${e2?'실패:'+e2.message:'완료'}`);
  console.log('   백업: scripts/curated-fix-backup-2026-06-24.json');
}else{
  console.log('\n(dry-run) --apply 로 실행');
}
