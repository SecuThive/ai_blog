import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
async function fa(t,c,f){let a=[],o=0,s=1000;for(;;){let q=sb.from(t).select(c);if(f)q=f(q);const{data,e}=await q.range(o,o+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;o+=s;}return a;}

// 시리즈 소속 발행글 전부 (드래프트 제외)
const pub=await fa('posts','id,title,tags,published_at,status',q=>q.eq('status','published'));
const groups={};
for(const p of pub){
  const st=(p.tags||[]).find(t=>t.startsWith('series:'));
  if(!st)continue;
  (groups[st.slice(7)]||=[]).push(p);
}
let updates=0, seriesN=0;
for(const [name,eps] of Object.entries(groups)){
  seriesN++;
  // 발행순(같으면 id순)
  eps.sort((a,b)=>((a.published_at||'').localeCompare(b.published_at||''))||(a.id-b.id));
  console.log(`\n■ "${name}" (${eps.length}편)`);
  for(let i=0;i<eps.length;i++){
    const p=eps[i];
    const epNum=i+1;
    // 기존 ep: 태그 제거 후 재부착 (멱등)
    const base=(p.tags||[]).filter(t=>!/^ep:\d+$/.test(t));
    const next=[...base, `ep:${epNum}`];
    const changed = JSON.stringify(next)!==JSON.stringify(p.tags||[]);
    if(changed) updates++;
    console.log(`   ep:${epNum}  #${p.id} ${p.title.slice(0,48)} ${changed?'':'(변동없음)'}`);
    if(APPLY && changed){
      const{error}=await sb.from('posts').update({tags:next}).eq('id',p.id);
      if(error)console.error('  ✗',p.id,error.message);
    }
  }
}
console.log(`\n${APPLY?'적용 완료':'DRY RUN'}: 시리즈 ${seriesN}개, 태그 갱신 ${updates}개`);
