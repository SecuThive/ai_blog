import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function fetchAll(t,c){let a=[],f=0,s=1000;for(;;){const{data,e}=await sb.from(t).select(c).range(f,f+s-1);if(e){console.error(e);break;}a=a.concat(data);if(data.length<s)break;f+=s;}return a;}
const all=await fetchAll('posts','id,title,status,content,category,created_at');
const pub=all.filter(p=>p.status==='published');
// 방금 dup으로 내린 24편 + 깨진템플릿은 제외하고, "원래부터 draft였던" 것만 검토 대상으로
const justUnpub=new Set([253,342,246,383,348,344,416,369,251,415,248,234,384,254,381,378,354,149,195,330,396,92,386,411,319]);
const drafts=all.filter(p=>p.status==='draft' && !justUnpub.has(p.id));
function toks(t){return new Set((t||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>1));}
const pubTok=pub.map(p=>({id:p.id,title:p.title,t:toks(p.title)}));

const broken=[], dupOfPub=[], unique=[];
for(const d of drafts){
  if(/SEO 최적화된 블로그 제목|기획서 기반|소제목1\s*\n/.test(d.title+d.content) || (d.content||'').length<400){broken.push(d);continue;}
  const dt=toks(d.title); let best={jac:0,id:null,title:''};
  for(const p of pubTok){let inter=0;for(const x of dt)if(p.t.has(x))inter++;const j=inter/(dt.size+p.t.size-inter);if(j>best.jac)best={jac:j,id:p.id,title:p.title};}
  if(best.jac>=0.45) dupOfPub.push({d,best}); else unique.push(d);
}
console.log('=== 초안 검토 (대상',drafts.length,'편) ===\n');
console.log('[A] 깨진 템플릿 → 삭제 권장:',broken.length);
for(const d of broken)console.log(`   #${d.id} "${d.title.slice(0,40)}"`);
console.log('\n[B] 기존 발행글과 중복(유사도45%+) → 폐기/보류 권장:',dupOfPub.length);
for(const {d,best} of dupOfPub)console.log(`   #${d.id} "${d.title.slice(0,38)}" ≈ 발행 #${best.id}(${best.jac.toFixed(2)})`);
console.log('\n[C] 고유 주제 → 검토 후 발행 후보:',unique.length);
const byCat={}; for(const d of unique)(byCat[d.category]||=[]).push(d);
for(const [c,list] of Object.entries(byCat)){console.log(`  ▸ ${c} (${list.length})`);for(const d of list)console.log(`     #${d.id} (${(d.content||'').length}자) "${d.title.slice(0,46)}"`);}
