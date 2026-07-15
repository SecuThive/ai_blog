// 품질 점수(100점, 프로그래매틱 프록시) → CONTENT_AUDIT.csv
// 루브릭: 독창가치20 + 1차출처20 + 재현가능15 + 중복도15 + 환경버전10 + 신뢰표기10 + 의도해결10
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
async function pull(){let a=[],f=0;for(;;){const{data}=await sb.from('posts').select('id,slug,title,content,category,tags,views,published_at').eq('status','published').range(f,f+499);a=a.concat(data);if(data.length<500)break;f+=500;}return a;}
const posts=await pull();
const STOP=new Set(['가이드','완벽','실전','전략','구축','방법','위한','이해','활용','시대','넘어','정리','핵심','필독','기반','대한','만드는','에러','해결','해결법','진단','원인','런북','가지','완전','정복','및']);
const toks=t=>new Set((t||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w)));
const jac=(a,b)=>{let i=0;for(const x of a)if(b.has(x))i++;return i/(a.size+b.size-i||1);};
const T=posts.map(p=>({id:p.id,t:toks(p.title)}));
function score(p){
  const c=p.content||'';
  const problems=[];
  // 독창 가치 (20): 코드블록·표·절차 구조
  const codeN=(c.match(/```/g)||[]).length/2;
  const tableN=(c.match(/\n\|.*\|\n/g)||[]).length;
  const stepN=(c.match(/^#{2,3} /gm)||[]).length;
  let orig=Math.min(20, codeN*2.5 + tableN*2 + Math.min(stepN,8));
  if(codeN===0&&tableN===0){orig=Math.min(orig,8);problems.push('코드/표 없음');}
  // 1차 출처 (20)
  const offLink=(c.match(/https?:\/\/(docs\.|kubernetes\.io|redis\.io|git-scm|postgresql\.org|dev\.mysql|owasp|learn\.microsoft|cloud\.google|docs\.aws|nginx\.org|python\.org|nodejs\.org|man7\.org|web\.dev|kafka\.apache|isms\.kisa)/g)||[]).length;
  const refSec=/참고 자료|참고자료|References|공식 문서/i.test(c);
  let src=Math.min(20, offLink*7 + (refSec?6:0));
  if(offLink===0)problems.push('공식 링크 없음(하단 자동 안내로 보완)');
  src=Math.min(20,src+4); // 사이트 레벨 '관련 공식 문서' 자동 연결 반영
  // 재현 가능 (15)
  const runnable=(c.match(/```(bash|sh|shell|sql|yaml|yml|json|python|js|javascript|ts|typescript|dockerfile|hcl|conf|ini|java|go)/gi)||[]).length;
  const repro=Math.min(15, runnable*3 + (/(예상 (출력|결과)|정상 (출력|결과)|출력 예)/.test(c)?3:0));
  // 중복도 (15): 최대 유사도 벌점
  const mt=toks(p.title);let maxSim=0;
  for(const o of T){if(o.id===p.id)continue;const s=jac(mt,o.t);if(s>maxSim)maxSim=s;}
  const dup=maxSim>=0.5?3:maxSim>=0.35?9:15;
  if(maxSim>=0.35)problems.push('제목 유사 글 존재('+(maxSim*100|0)+'%)');
  // 환경·버전 (10)
  const ver=Math.min(10, ((c.match(/\b\d+\.\d+(\.\d+)?\b/g)||[]).length>=3?6:2) + (/(Ubuntu|CentOS|RHEL|Debian|Windows|macOS|버전|v\d)/.test(c)?4:0));
  // 신뢰 표기 (10): 편집 검토 블록(사이트 전역)=8, 본문 자체 검증환경 언급 +2
  const trust=8+(/검증 환경|편집자 주/i.test(c)?2:0);
  // 의도 해결 (10): 구조 완결성
  const intent=Math.min(10,(stepN>=4?4:2)+(/(재발 방지|예방|체크리스트|FAQ|자주 묻는)/.test(c)?3:1)+(c.length>3500?3:1));
  const total=Math.round(orig+src+repro+dup+ver+trust+intent);
  return {total,problems,maxSim,len:c.replace(/\s/g,'').length};
}
const rows=[];
for(const p of posts){
  const s=score(p);
  let action='유지', idx='index';
  if(s.total<58){action='noindex + 보강 후 재색인 (애드센스 저가치 대응 프루닝)';idx='noindex';}
  rows.push({url:'https://www.thivelab.com/blog/'+encodeURIComponent(p.slug),title:p.title,status:'published',score:s.total,dup:s.maxSim>=0.35?(s.maxSim*100|0)+'%':'',problems:s.problems.join('; '),action,redirect:'',index:idx,views:p.views});
}
rows.sort((a,b)=>a.score-b.score);
const esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
const csv=['URL,제목,현재상태,품질점수,중복대상,문제점,조치,리다이렉트대상,색인여부'].concat(rows.map(r=>[r.url,r.title,r.status,r.score,r.dup,r.problems,r.action,r.redirect,r.index].map(esc).join(','))).join('\n');
writeFileSync('CONTENT_AUDIT.csv','﻿'+csv);
// 분포 출력
const dist={'~44':0,'45-57':0,'58-69':0,'70-84':0,'85+':0};
rows.forEach(r=>{const s=r.score;dist[s<45?'~44':s<58?'45-57':s<70?'58-69':s<85?'70-84':'85+']++;});
console.log('점수 분포:',JSON.stringify(dist));
console.log('평균:',Math.round(rows.reduce((a,r)=>a+r.score,0)/rows.length));
// GSC 실적상 실수요가 확인된 글은 점수와 무관하게 색인 유지(noindex 목록에서 제외)
let gscProtected=new Set();
try{gscProtected=new Set(JSON.parse(readFileSync('src/lib/gsc-protected-slugs.json','utf8')));}catch{}
import('fs').then(({writeFileSync:w})=>w('src/lib/noindex-slugs.json',JSON.stringify(rows.filter(r=>r.index==='noindex').map(r=>decodeURIComponent(r.url.replace('https://www.thivelab.com/blog/',''))).filter(s=>!gscProtected.has(s)),null,1)));
console.log('\n최하위 12편:');
rows.slice(0,12).forEach(r=>console.log(`  ${r.score}점 v${r.views}  ${r.title.slice(0,52)}  [${r.problems.slice(0,40)}]`));
