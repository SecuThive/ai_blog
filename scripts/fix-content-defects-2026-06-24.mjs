import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

const SLUG={
  569:'kubernetes-pod-pending-원인-7가지-kubectl-describe로-완벽-진단하는-실전-가이드',
  588:'imagepullbackofferrimagepull-원인-6가지-진단해결-가이드',
  619:'kubernetes-pod-dns-실패coredns-5분-진단-cant-resolve-temporary-failure',
  621:'kubectl-get-nodes-notready-원인-6가지-진단복구-5분-가이드',
  739:'modulenotfounderrorimporterror-5분-해결-원인별-진단표와-복붙-명령어',
};
const U=id=>`/blog/${SLUG[id]}`;

// 각 글: [앵커텍스트, 타겟URL] — 정확 일치 치환
const LINKFIX={
  663:[['ModuleNotFoundError 해결 가이드', U(739)]],
  588:[['1편(Pod Pending 진단)', U(569)]],
  590:[['Pending', U(569)],['ImagePullBackOff', U(588)]],
  622:[['kubectl get nodes NotReady 원인 6가지', U(621)],['CoreDNS DNS 해석 실패', U(619)],
       ['NotReady 진단 1편', U(621)],['CoreDNS 편', U(619)]],
};

const ids=[95,...Object.keys(LINKFIX).map(Number)];
const {data:rows}=await sb.from('posts').select('id,title,content').in('id',ids);
const byId=Object.fromEntries(rows.map(r=>[r.id,r]));
const backup=[]; const updates=[];

// --- #95 중복 블록 제거 ---
{
  const p=byId[95]; const before=p.content;
  const dupRe=/\n\n### 🔄 데이터 파이프라인 구축 시 고려사항:[\s\S]*?### 📊 데이터 드리프트 방지:[\s\S]*?필수적입니다\.\n\n---/;
  const after=before.replace(dupRe,'');
  const removed=before.length-after.length;
  console.log(`#95 중복블록 제거: ${removed>0?'✅ '+removed+'자 제거':'❌ 매치 실패'}`);
  if(removed>0){ backup.push({id:95,before}); updates.push({id:95,content:after}); }
}

// --- ](#) 링크 치환 ---
for(const [id,fixes] of Object.entries(LINKFIX)){
  const p=byId[id]; let c=p.content; const before=c; let n=0;
  for(const [anchor,url] of fixes){
    const target=`[${anchor}](#)`; const repl=`[${anchor}](${url})`;
    if(c.includes(target)){ c=c.split(target).join(repl); n++; }
    else console.log(`  ⚠️ #${id} 앵커 미발견: "${anchor}"`);
  }
  const leftover=(c.match(/\]\(#\)/g)||[]).length;
  console.log(`#${id} 링크 ${n}/${fixes.length}건 치환, 잔여 ](#): ${leftover}`);
  if(c!==before){ backup.push({id:Number(id),before}); updates.push({id:Number(id),content:c}); }
}

console.log(`\n총 수정 대상: ${updates.length}편`);
if(APPLY){
  writeFileSync(new URL('./fix-content-defects-backup-2026-06-24.json',import.meta.url),JSON.stringify(backup,null,2));
  let ok=0;
  for(const u of updates){const{error}=await sb.from('posts').update({content:u.content}).eq('id',u.id);if(error)console.error('실패#'+u.id,error.message);else ok++;}
  console.log(`✅ ${ok}/${updates.length}편 적용. 백업: scripts/fix-content-defects-backup-2026-06-24.json`);
}else console.log('(dry-run) --apply 로 실행');
