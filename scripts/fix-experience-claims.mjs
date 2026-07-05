// 확인 불가능한 1인칭 경험 서술 → 객관적 표현으로 교체 (14편) + 잘못된 해시태그 태그 정리.
// 백업 후 --apply. 복구: backup JSON의 content로 되돌리면 됨.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');
const FIXES={
 731:[["저희 팀에서는 처음에는 Flyway의 단순한 SQL 구조가 직관적이라 선호했지만","많은 팀이 처음에는 Flyway의 단순한 SQL 구조가 직관적이라 선호하지만"]],
 704:[["제가 겪은 OOM의 절반 이상은 ⑤번, TTL 누락이었습니다","실무에서 가장 자주 보고되는 원인은 ⑤번, TTL 누락입니다"]],
 644:[["저희 팀이 ELK로 전환을 고려할 때 가장 어려웠던 점은","ELK 전환을 검토하는 팀들이 공통적으로 가장 어려워하는 점은"]],
 701:[["제가 경험한 바로는, 캐싱 전략을 도입할 때","일반적으로 캐싱 전략을 도입할 때"]],
 649:[["저희 팀은 검증된","많은 팀이 검증된"]],
 681:[["장애의 80%는 요청이 백엔드 Pod에 도달하기","이 유형의 장애 상당수는 요청이 백엔드 Pod에 도달하기"]],
 707:[["제가 경험상 가장 큰 생산성 향상을 체감한 부분은","가장 큰 생산성 향상이 보고되는 부분은"]],
 689:[["저희 팀이 대규모 트래픽 증가로 인해 간헐적인 지연을 겪었을 때, 단순히 CNI를 교체하는 것만으로는 해결되지 않았습니다","대규모 트래픽 증가로 간헐적 지연이 발생하는 환경에서는 단순히 CNI를 교체하는 것만으로 해결되지 않는 경우가 많습니다"]],
 656:[["제가 본 가장 흔한 사고는","실무에서 가장 흔히 보고되는 사고는"]],
 612:[["제가 겪은 사례의 90%는","가장 흔히 보고되는 원인은"]],
 615:[["제가 겪은 사고의 70%는","흔히 보고되는 사고 패턴은"]],
 577:[["제가 직접 해보니","실제로 적용해 보면"]],
 722:[["제가 경험한 대형 커머스 서비스의 경우, 초기에는","대형 커머스 서비스 사례를 보면, 초기에는"]],
 693:[["제가 경험상 가장 효과적이었던 부분은","일반적으로 가장 효과가 큰 부분은"]],
};
const TAG_FIXES={
 49:["LLM워크플로우","AI에이전트","LangChain","AutoGen","CrewAI","AI자동화"],
 39:["서버리스","엣지컴퓨팅","클라우드아키텍처","분산시스템","시스템설계"],
};
const ids=[...Object.keys(FIXES),...Object.keys(TAG_FIXES)].map(Number);
const {data:rows}=await sb.from('posts').select('id,slug,content,tags').in('id',ids);
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
const backup=[];let planned=0;
for(const [id,pairs] of Object.entries(FIXES)){
  const r=byId[id];if(!r){console.log('⚠ 미존재 #'+id);continue;}
  for(const [from,to] of pairs){
    const n=(r.content.match(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;
    console.log(`#${id} "${from.slice(0,30)}…" → ${n}건`);
    if(n!==1)console.log('   ⚠ 매칭 '+n+'건 — 확인 필요');
    planned+=n;
  }
}
for(const [id,tags] of Object.entries(TAG_FIXES)){
  const r=byId[id];
  const keep=(r.tags||[]).filter(t=>!t.includes('#'));
  console.log(`#${id} tags: 해시태그 문자열 → ${JSON.stringify([...keep,...tags].slice(0,8))}`);
}
if(APPLY){
  for(const [id] of Object.entries(FIXES)) backup.push({id:+id,slug:byId[id].slug,content:byId[id].content});
  for(const [id] of Object.entries(TAG_FIXES)) backup.push({id:+id,slug:byId[id].slug,tags:byId[id].tags});
  writeFileSync(new URL('./experience-claims-backup-2026-07-03.json',import.meta.url),JSON.stringify(backup,null,1));
  let ok=0;
  for(const [id,pairs] of Object.entries(FIXES)){
    let c=byId[id].content;
    for(const [from,to] of pairs)c=c.split(from).join(to);
    const{error}=await sb.from('posts').update({content:c}).eq('id',+id);
    if(error)console.error('실패#'+id,error.message);else ok++;
  }
  for(const [id,tags] of Object.entries(TAG_FIXES)){
    const keep=(byId[id].tags||[]).filter(t=>!t.includes('#'));
    const{error}=await sb.from('posts').update({tags:[...keep,...tags]}).eq('id',+id);
    if(error)console.error('실패#'+id,error.message);else ok++;
  }
  console.log(`\n✅ ${ok}/${Object.keys(FIXES).length+Object.keys(TAG_FIXES).length}편 수정. 백업: scripts/experience-claims-backup-2026-07-03.json`);
}else console.log('\n(dry-run) --apply 로 적용');
