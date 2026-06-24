import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
for (const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY = process.argv.includes('--apply');

async function show(id){const{data}=await sb.from('posts').select('id,title,status,category').eq('id',id).single();return data;}

console.log(APPLY ? '*** APPLY MODE ***' : '*** DRY RUN (--apply 로 실제 적용) ***');

// 1) #319: 깨진 템플릿이 발행됨 → 발행 해제(draft)
console.log('\n[1] #319 발행 해제 (published → draft)');
console.log('  before:', await show(319));
if (APPLY) { const{error}=await sb.from('posts').update({status:'draft'}).eq('id',319); if(error)console.error(error.message); else console.log('  → draft 처리 완료'); }

// 2) 잘못된 카테고리 수정 (파이프 다중값 → 첫 번째 유효값)
const catFix = { 376:'AI & 자동화', 404:'AI & 자동화' };
console.log('\n[2] 카테고리 수정');
for (const [id,cat] of Object.entries(catFix)) {
  console.log(`  #${id} before:`, await show(+id));
  if (APPLY) { const{error}=await sb.from('posts').update({category:cat}).eq('id',+id); if(error)console.error(error.message); else console.log(`  → "${cat}" 로 수정`); }
}
console.log('\n주의: 초안 #199, #236 은 깨진 순수 템플릿(내용 없음)입니다. 삭제 원하시면 별도 지시 주세요(되돌릴 수 없어 자동 삭제하지 않음).');
