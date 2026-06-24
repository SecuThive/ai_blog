import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

// 삭제 대상
const BROKEN=[199,236];                                                  // 깨진 순수 템플릿
const DUP=[127,136,172,151,36,43,55,80,81,87,129,131,141,150,184,197,200,132,163]; // 발행글과 중복
const INTERNAL=[13,14,161,169,176,180,187];                              // 블로그 운영/수익화 내부전략 문서
const DELETE=[...BROKEN,...DUP,...INTERNAL];

// 1) 전체 draft 백업 (삭제 복구용)
async function fetchAll(t,c,filt){let a=[],f=0,s=1000;for(;;){let q=sb.from(t).select(c);if(filt)q=filt(q);const{data,e}=await q.range(f,f+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;f+=s;}return a;}
const drafts=await fetchAll('posts','*',q=>q.eq('status','draft'));
console.log('현재 draft 총', drafts.length, '개');
const toDelete=drafts.filter(d=>DELETE.includes(d.id));
console.log('삭제 대상', toDelete.length, '개 (요청', DELETE.length, ')');

if(APPLY){
  writeFileSync(new URL('./deleted-drafts-backup-2026-06-02.json',import.meta.url), JSON.stringify(toDelete,null,2));
  console.log('→ 백업 저장: scripts/deleted-drafts-backup-2026-06-02.json');
  const{error,count}=await sb.from('posts').delete({count:'exact'}).in('id',DELETE);
  if(error)console.error(error.message); else console.log('→ 삭제 완료:', count, '개');
  const{count:dc}=await sb.from('posts').select('id',{count:'exact',head:true}).eq('status','draft');
  const{count:pc}=await sb.from('posts').select('id',{count:'exact',head:true}).eq('status','published');
  console.log('결과: published', pc, '/ draft', dc);
} else {
  console.log('\n[DRY RUN] 삭제 예정 ID:', DELETE.join(', '));
  for(const d of toDelete)console.log(`   #${d.id} "${(d.title||'').slice(0,45)}"`);
  const missing=DELETE.filter(id=>!drafts.some(d=>d.id===id));
  if(missing.length)console.log('주의: draft에 없는 ID(이미 처리됨?):', missing.join(','));
}
