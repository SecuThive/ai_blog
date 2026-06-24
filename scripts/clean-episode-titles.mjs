import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

// 강등 글 ID 수집
const ids=new Set();
for(const f of ['demoted-series-backup-2026-06-07.json','demoted-2ep-backup-2026-06-07.json']){
  const j=JSON.parse(readFileSync(new URL('./'+f,import.meta.url),'utf8'));
  for(const r of j)ids.add(r.id);
}

function cleanTitle(t){
  let s=t;
  // 1) 선두 [ ... N편 ... ] 브래킷 제거 (예: [MLOps 가이드 1편], [RAG 완전 정복 1편], [1편])
  s=s.replace(/^\s*\[[^\]]*\d+\s*편\s*\]\s*/,'');
  // 2) 말미 (N편) / (N/N) / (N/숫자) 제거
  s=s.replace(/\s*\((?:\d+\s*편|\d+\s*\/\s*(?:\d+|[NnＮ]))\)\s*$/,'');
  // 3) 잔여 공백/구두점 정리
  s=s.replace(/\s{2,}/g,' ').replace(/[\s:·,]+$/,'').trim();
  return s;
}

const{data}=await sb.from('posts').select('id,title,slug').in('id',[...ids]);
const changes=[];
for(const p of data){
  const nt=cleanTitle(p.title);
  if(nt!==p.title && nt.length>=8) changes.push({id:p.id,slug:p.slug,before:p.title,after:nt});
}
console.log(`${APPLY?'*** APPLY ***':'*** DRY RUN ***'}  제목 정리 대상: ${changes.length}편 (slug 불변)\n`);
for(const c of changes){
  console.log(`#${c.id}`);
  console.log(`  전: ${c.before}`);
  console.log(`  후: ${c.after}\n`);
}
if(APPLY){
  writeFileSync(new URL('./title-cleanup-backup-2026-06-08.json',import.meta.url),JSON.stringify(changes,null,2));
  for(const c of changes){
    const{error}=await sb.from('posts').update({title:c.after}).eq('id',c.id);
    if(error)console.error('✗',c.id,error.message);
  }
  console.log('적용 완료 + 백업: scripts/title-cleanup-backup-2026-06-08.json');
}
