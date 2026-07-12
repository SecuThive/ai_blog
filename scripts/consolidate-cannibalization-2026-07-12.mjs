// #4 유사제목 통합 (2026-07-12): 진짜 근접중복 2쌍만 처리.
//  (A) #622(kubectl localhost:8080) → #768과 동일 에러 런북, 조회↓·구버전 → draft(통합)
//  (B) #589/#778 ISMS-P — 상호보완이나 제목 접두 동일 → #778 제목/H1 차별화 + 양방향 상호링크(재범위화)
// dry-run 기본, --apply 로 반영.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

const SLUG_589='2026-isms-p-인증-준비-체크리스트-102개-항목빈출-결함-실무-가이드';
const SLUG_778='2026-isms-p-인증-준비-체크리스트-의무대상절차비용-총정리';
const XLINK_TO_589='> 📌 인증기준 **102개 항목별 상세 점검·증적·빈출 결함 대응**은 [ISMS-P 102개 항목 실무 체크리스트](/blog/'+SLUG_589+')에서 다룹니다. 이 글은 **의무대상 판단·신청 절차·기간·비용**에 초점을 맞춥니다.';
const XLINK_TO_778='> 📌 **의무대상 여부·신청 절차·기간·비용**이 궁금하다면 [ISMS-P 의무대상·절차·비용 총정리](/blog/'+SLUG_778+')를 함께 참고하세요. 이 글은 **102개 인증기준 항목별 점검과 빈출 결함 대응**에 집중합니다.';

const OLD_778_H='## 2026 ISMS-P 인증 준비 체크리스트: 의무대상·절차·비용 총정리';
const NEW_778_TITLE='ISMS-P 인증 의무대상·신청절차·비용 총정리 (2026)';
const NEW_778_H='## '+NEW_778_TITLE;
const OLD_589_H='# 2026 ISMS-P 인증 준비 완벽 체크리스트: 102개 항목·빈출 결함 실무 가이드';

const {data}=await sb.from('posts').select('id,title,slug,status,content').in('id',[622,589,778]);
const byId=Object.fromEntries(data.map(r=>[r.id,r]));
const bak=[];

// (A) #622 draft
{
  const p=byId[622];
  console.log('\n[A] #622 '+p.title.slice(0,50)+' — 현재 status='+p.status+' → draft');
  if(APPLY){
    bak.push({id:622,slug:p.slug,status:p.status});
    const{error}=await sb.from('posts').update({status:'draft'}).eq('id',622);
    console.log(error?'  ⚠ '+error.message:'  ✅ draft 전환');
  }
}

// (B1) #778 제목/H1 차별화 + 상호링크(→589)
{
  const p=byId[778];
  let c=p.content;
  const steps=[];
  if(c.includes(OLD_778_H)){c=c.replace(OLD_778_H,NEW_778_H);steps.push('H1 교체');}
  else steps.push('❓H1 미발견');
  // 첫 문단 뒤(“…이어지기 때문입니다.”) 상호링크 삽입
  const anchor='이어지기 때문입니다.';
  if(!c.includes(XLINK_TO_589)){
    if(c.includes(anchor)){c=c.replace(anchor,anchor+'\n\n'+XLINK_TO_589);steps.push('상호링크→589 삽입');}
    else{c=c.replace(NEW_778_H,NEW_778_H+'\n\n'+XLINK_TO_589);steps.push('상호링크→589 삽입(H1 직후 대체위치)');}
  }else steps.push('상호링크 이미 존재');
  console.log('\n[B1] #778 → title="'+NEW_778_TITLE+'" ['+steps.join(', ')+']');
  if(APPLY){
    bak.push({id:778,slug:p.slug,title:p.title,content:p.content});
    const{error}=await sb.from('posts').update({title:NEW_778_TITLE,content:c}).eq('id',778);
    console.log(error?'  ⚠ '+error.message:'  ✅ 반영');
  }
}

// (B2) #589 상호링크(→778)
{
  const p=byId[589];
  let c=p.content;const steps=[];
  if(!c.includes(XLINK_TO_778)){
    if(c.includes(OLD_589_H)){c=c.replace(OLD_589_H,OLD_589_H+'\n\n'+XLINK_TO_778);steps.push('상호링크→778 삽입');}
    else steps.push('❓H1 미발견');
  }else steps.push('상호링크 이미 존재');
  console.log('\n[B2] #589 ['+steps.join(', ')+']');
  if(APPLY){
    bak.push({id:589,slug:p.slug,content:p.content});
    const{error}=await sb.from('posts').update({content:c}).eq('id',589);
    console.log(error?'  ⚠ '+error.message:'  ✅ 반영');
  }
}

if(APPLY){
  writeFileSync(new URL('./cannibalization-consolidate-backup-2026-07-12.json',import.meta.url),JSON.stringify(bak));
  console.log('\n백업: cannibalization-consolidate-backup-2026-07-12.json ('+bak.length+'행)');
}else console.log('\n(dry-run) --apply 로 반영');
