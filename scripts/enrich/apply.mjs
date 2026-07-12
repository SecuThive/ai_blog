// 보강 섹션 적용: '## 자주 묻는 질문' 앞에 삽입, 없으면 끝에 추가. 백업 저장.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
const env=readFileSync(new URL('../../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const batch=process.argv[2];const APPLY=process.argv.includes('--apply');
const adds=JSON.parse(readFileSync(new URL('./'+batch,import.meta.url),'utf8'));
const ids=Object.keys(adds).map(Number);
const {data}=await sb.from('posts').select('id,slug,title,content').in('id',ids);
const bakFile=new URL('./backup-'+batch,import.meta.url);
const bak=existsSync(bakFile)?JSON.parse(readFileSync(bakFile,'utf8')):[];
for(const p of data){
  const add='\n'+adds[p.id].trim()+'\n';
  let c=p.content;
  if(c.includes(adds[p.id].trim().split('\n')[0])){console.log('#'+p.id,'이미 적용됨 — 스킵');continue;}
  const faqIdx=c.search(/^## 자주 묻는 질문/m);
  c = faqIdx>=0 ? c.slice(0,faqIdx)+add+'\n'+c.slice(faqIdx) : c.trimEnd()+'\n'+add;
  console.log(`#${p.id} ${p.title.slice(0,40)} — +${add.length}자 (${faqIdx>=0?'FAQ 앞 삽입':'끝에 추가'})`);
  if(APPLY){
    bak.push({id:p.id,slug:p.slug,content:p.content});
    const{error}=await sb.from('posts').update({content:c}).eq('id',p.id);
    console.log(error?('  ⚠ '+error.message):'  ✅ 적용');
  }
}
if(APPLY){writeFileSync(bakFile,JSON.stringify(bak));console.log('백업:',bakFile.pathname.split('/').pop());}
else console.log('(dry-run) --apply 로 적용');
