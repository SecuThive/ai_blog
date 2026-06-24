import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
// dup-clusters.mjs 가 산출한 발행해제 후보 (남길 글은 유지)
const IDS=[253,342,246,383,348,344,416,369,251,415,248,234,384,254,381,378,354,149,195,330,396,92,386,411];
console.log(APPLY?'*** APPLY ***':'*** DRY RUN ***', '대상', IDS.length, '편 → draft 전환');
if(APPLY){
  const{data,error}=await sb.from('posts').update({status:'draft'}).in('id',IDS).select('id');
  if(error)console.error(error.message); else console.log('완료:', data.length, '편 draft 전환');
}
// 결과 확인
const{count}=await sb.from('posts').select('id',{count:'exact',head:true}).eq('status','published');
console.log('현재 published 글 수:', count);
