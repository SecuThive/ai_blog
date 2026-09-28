// Round 3 content hardening audit (2026-09-29): thin (2500-2999 non-ws KO chars) + SEO-bait titles
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const noindex = new Set(JSON.parse(readFileSync('src/lib/noindex-slugs.json','utf8')));
const prot = new Set(JSON.parse(readFileSync('src/lib/gsc-protected-slugs.json','utf8')));
const START='<!--NodelogEN', END='NodelogEN-->';
function strip(c){ if(!c) return ''; let s=c.indexOf('\n\n'+START); if(s!==-1) return c.slice(0,s).trimEnd(); s=c.indexOf(START); if(s!==-1) return c.slice(0,s).trimEnd(); return c; }
function emb(c){ if(!c) return null; const s=c.indexOf(START), e=c.lastIndexOf(END); if(s===-1||e===-1||e<=s) return null; try{return JSON.parse(c.slice(s+START.length,e).trim());}catch{return 'BAD';} }
const tagv=(t,p)=>{const h=(t||[]).find(x=>x.startsWith(p)); return h? (h.slice(p.length).trim()||null):null;};
let all=[]; for(let from=0;;from+=1000){ const {data,error}=await sb.from('posts').select('*').eq('status','published').range(from,from+999); if(error) throw error; all=all.concat(data); if(data.length<1000) break; }
const cols = Object.keys(all[0]||{});
const BAIT=/완전\s?정리|총정리|마스터|완벽|필수|완전\s?정복|끝판왕|총망라|A\s?to\s?Z|모든\s?것|한\s?번에\s?끝|치트키|필독|완전\s?가이드|궁극|최강|master|ultimate|complete guide|definitive|must[- ]know|everything you need/i;
const out=[]; 
for(const p of all){
  const ko=strip(p.content); const len=ko.replace(/\s/g,'').length;
  const e=emb(p.content); const ev=p.content_evidence&&typeof p.content_evidence==='object'?p.content_evidence.en:null;
  const titleSrc = p.title_en?.trim()? 'title_en' : tagv(p.tags,'i18n.title:')? 'tag' : ev?.title? 'evidence' : (e&&e!=='BAD'&&e.title)? 'embedded':'none';
  const contentSrc = p.content_en?.trim()? 'content_en' : ev?.content? 'evidence' : (e&&e!=='BAD'&&e.content)? 'embedded':'none';
  const enTitle = p.title_en?.trim() || tagv(p.tags,'i18n.title:') || ev?.title || (e&&e!=='BAD'?e.title:null) || null;
  const idx = !noindex.has(p.slug) || prot.has(p.slug);
  out.push({id:p.id,slug:p.slug,title:p.title,enTitle,len,idx,titleSrc,contentSrc,embBad:e==='BAD',bait:BAIT.test(p.title)||BAIT.test(enTitle||''),category:p.category,published_at:p.published_at,tags:(p.tags||[]).filter(t=>!t.startsWith('i18n.'))});
}
writeFileSync('/tmp/r3-audit.json', JSON.stringify({cols,total:all.length,out},null,1));
const thin=out.filter(o=>o.idx&&o.len>=2500&&o.len<=2999); const bait=out.filter(o=>o.idx&&o.bait);
console.log({cols,total:all.length,indexed:out.filter(o=>o.idx).length,thin:thin.length,bait:bait.length,embBad:out.filter(o=>o.embBad).length});
console.log('titleSrc', thin.concat(bait).reduce((a,o)=>(a[o.titleSrc]=(a[o.titleSrc]||0)+1,a),{}), 'contentSrc', thin.reduce((a,o)=>(a[o.contentSrc]=(a[o.contentSrc]||0)+1,a),{}));
