// 경험서술 2차 정리 (2026-07-13): 1차 때 '여러분' 인사말 패턴을 놓친 5편.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const MAP={
  379:['안녕하세요, AI 시스템의 신뢰도를 책임지는 아키텍트 여러분.\n\n'],
  284:['안녕하세요, AI 서비스의 성능과 안정성을 책임지는 아키텍트 여러분.\n\n'],
  88:['안녕하세요, AI 아키텍트 여러분. '],
  242:['안녕하세요, 시스템 아키텍트 여러분. '],
  434:['안녕하세요, AI 플랫폼 아키텍트 여러분.\n\n'],
};
const ids=Object.keys(MAP).map(Number);
const {data}=await sb.from('posts').select('id,slug,title,content').in('id',ids);
const bak=[];let ok=0,miss=0;
for(const id of ids){
  const p=data.find(x=>x.id===id);
  let c=p.content, changed=false;
  for(const find of MAP[id]){
    if(c.includes(find)){c=c.replace(find,'');changed=true;ok++;}
    else{console.log('❓ #'+id+' 미발견:',JSON.stringify(find.slice(0,40)));miss++;}
  }
  if(!changed)continue;
  c=c.replace(/^(#[^\n]*\n)\n+/,'$1\n'); // 제목 뒤 과다 빈줄 정리
  console.log('#'+id, p.title.slice(0,44),'— 인사말 제거');
  if(APPLY){bak.push({id,slug:p.slug,content:p.content});const{error}=await sb.from('posts').update({content:c}).eq('id',id);console.log(error?'  ⚠ '+error.message:'  ✅');}
}
console.log('\n제거',ok,'| 미발견',miss,APPLY?'':'(dry-run)');
if(APPLY){writeFileSync(new URL('./persona-neutralize2-backup-2026-07-13.json',import.meta.url),JSON.stringify(bak));console.log('백업 저장');}
