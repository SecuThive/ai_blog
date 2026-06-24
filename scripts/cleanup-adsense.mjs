import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data,e}=await q.range(o,o+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;o+=s;}return a;}

const BROKEN=[426];                                          // 깨진 템플릿 재발행
const DUPS=[435,433,424,427,310,438,441,252,183,440];        // 근접중복 발행해제
const UNPUB=[...BROKEN,...DUPS];
const CAT_FIX={450:'AI & 자동화'};                            // 파이프 카테고리 → 유효값

console.log(APPLY?'*** APPLY ***':'*** DRY RUN ***');

// 1) 발행해제(draft)
console.log(`\n[1] 발행해제 ${UNPUB.length}편 → draft:`, UNPUB.join(','));
if(APPLY){const{data,error}=await sb.from('posts').update({status:'draft'}).in('id',UNPUB).select('id');if(error)console.error(error.message);else console.log('  완료:',data.length);}

// 2) 카테고리 수정
for(const[id,c]of Object.entries(CAT_FIX)){
  console.log(`[2] #${id} 카테고리 → "${c}"`);
  if(APPLY){const{error}=await sb.from('posts').update({category:c}).eq('id',+id);if(error)console.error(error.message);}
}

// 3) 새로 유입된 깨진 unsplash 이미지 제거 (발행글)
const IMG=/!\[[^\n]*?\]\(\s*https?:\/\/source\.unsplash\.com\/[^)\n]*\)/g;
const pub=await fa('posts','id,content',q=>q.eq('status','published'));
const hit=pub.filter(p=>(IMG.lastIndex=0,IMG.test(p.content||'')));
console.log(`\n[3] source.unsplash 이미지 포함 발행글: ${hit.length}편`, hit.map(p=>p.id).join(','));
if(APPLY){for(const p of hit){const nc=p.content.replace(IMG,'').replace(/\n[ \t]*\n[ \t]*\n+/g,'\n\n').trim();const{error}=await sb.from('posts').update({content:nc}).eq('id',p.id);if(error)console.error(p.id,error.message);}if(hit.length)console.log('  이미지 제거 완료');}

// 결과
const{count:pc}=await sb.from('posts').select('id',{count:'exact',head:true}).eq('status','published');
const{count:dc}=await sb.from('posts').select('id',{count:'exact',head:true}).eq('status','draft');
console.log(`\n현재: published ${pc} / draft ${dc}`);
