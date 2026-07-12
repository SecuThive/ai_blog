// 발행글 본문에서 '가짜 1인칭 경험/페르소나 서술'을 중립화한다.
// 방침: 정보는 보존, 검증 불가능한 개인 경험 주장·인사말·과장 수식만 제거/중립화.
// (날조 추가가 아니라 날조된 저작 주장 제거 — E-E-A-T/애드센스 진정성 대응)
// dry-run 기본, --apply 로 반영. 백업 scripts/persona-neutralize-backup-<date>.json
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

// id -> [ [find, replace], ... ]  (find 는 본문에 그대로 존재하는 문장/구절)
const MAP={
  25:[
    ['안녕하세요, 개발자 여러분.','']
  ],
  188:[
    ['안녕하세요, 아키텍처 고민이 깊어지는 개발자 여러분.','']
  ],
  327:[
    ['안녕하세요, AI 기반 서비스 개발에 앞장서고 계신 엔지니어 개발자 여러분.','']
  ],
  165:[
    ['안녕하세요, AI 통합 아키텍처를 설계하는 개발자이자 콘텐츠 작가입니다.',''],
    ["하지만 현장에서 직접 프로젝트를 리드해보면, '기술적 가능성'과 '실제 비즈니스 가치' 사이의 간극을 메우는 것이 가장 어려운 숙제임을 깨닫게 됩니다.",
     "하지만 실제 도입 현장에서는 '기술적 가능성'과 '실제 비즈니스 가치' 사이의 간극을 메우는 것이 가장 어려운 숙제입니다."],
    ["저희가 수많은 프로젝트를 거치며 체득한, **'실패하지 않는'** 5단계 로드맵을 공유합니다.",
     "실무에서 검증된 **'실패를 줄이는'** 5단계 로드맵을 정리했습니다."]
  ],
  419:[
    ['GPT-4의 놀라운 추론 능력부터 Claude 3의 맥락 이해력까지, 모델들이 보여주는 성능은 개발자로서 가슴 뛰는 경험을 선사하죠.',
     'GPT-4의 추론 능력부터 Claude 3의 맥락 이해력까지, 최신 모델이 보여주는 성능은 인상적입니다.']
  ],
  121:[
    ['안녕하세요, AI 엔지니어 여러분.','']
  ],
  313:[
    ['안녕하세요, AI 아키텍처를 현업에 깊숙이 심고 있는 동료 엔지니어 여러분.','']
  ],
  247:[
    ['안녕하세요, 아키텍처를 설계하는 개발자 여러분.',''],
    ['저희도 수많은 PoC를 거치며 느낀 점이 있습니다.','여러 PoC 사례에서 공통적으로 확인되는 점이 있습니다.']
  ],
  393:[
    ['안녕하세요, 개발자 여러분.','']
  ],
  177:[
    ['안녕하세요, AI 시스템 아키텍처를 설계하는 엔지니어 여러분.','']
  ],
  321:[
    ['안녕하세요, AI 기반 지식 시스템 구축을 선도하는 [블로그 회사 이름]입니다.','']
  ],
  713:[
    ['안녕하세요, 인프라를 설계하고 운영하는 동료 엔지니어 여러분.',''],
    ['저는 PVC가 Pending일 때, 단순히 `kubectl describe`만 보지 않습니다.',
     'PVC가 Pending일 때는 `kubectl describe`만으로는 충분하지 않습니다.']
  ],
  351:[
    ['안녕하세요, AI 시스템 아키텍처를 설계하고 계신 개발자 여러분.','']
  ],
  296:[
    ['안녕하세요, AI 자동화 시스템 설계에 진심인 개발자 여러분.',''],
    ['저희는 업계에서 가장 강력한 프레임워크인 CrewAI와 LangChain을 중심으로, 어떻게 여러 전문 에이전트들이 유기적으로 협업하여 견고한 자동화 워크플로우를 만들어내는지, 그 아키텍처 설계부터 실제 코드 구현까지 깊숙이 파헤쳐 보겠습니다.',
     '이 글에서는 CrewAI와 LangChain을 중심으로, 여러 전문 에이전트가 협업하여 자동화 워크플로우를 구성하는 방법을 아키텍처 설계부터 코드 구현까지 살펴봅니다.']
  ],
  684:[
    ['안녕하세요, 인프라 아키텍처를 설계하고 운영하는 동료 개발자 및 엔지니어 여러분.',''],
    ['저는 서비스 간 통신을 설계할 때, 단순히 `Service` 이름만 사용하는 것을 지양하고, 가능하면 **서비스 메시(Service Mesh)** 도입을 전제로 아키텍처를 설계하는 것을 권장합니다.',
     '서비스 간 통신을 설계할 때는 `Service` 이름에만 의존하기보다, 규모가 커지면 **서비스 메시(Service Mesh)** 도입을 함께 검토하는 것이 좋습니다.']
  ],
  // --- 트러블슈팅 '제 경험상' 계열: 정보 보존, 개인 경험 주장만 중립화 ---
  653:[
    ['제 경험상 readinessProbe 설정이 빡빡하거나 이미지 풀이 느린 환경에서 자주 터지는데, 락만 풀고 끝내면 **다음에 또 같은 일이 반복**됩니다.',
     'readinessProbe 설정이 빡빡하거나 이미지 풀이 느린 환경에서 자주 발생하는데, 락만 풀고 끝내면 **다음에 또 같은 일이 반복**됩니다.']
  ],
  648:[
    ['제 경험상 통과율을 가장 크게 끌어올리는 건 **사전 협의**입니다.',
     '통과율을 가장 크게 끌어올리는 건 **사전 협의**입니다.']
  ],
  623:[
    ['> **현장 경험 한 줄**: 제가 운영하던 팀에서 락 에러의 80%는 첫 번째와 두 번째였습니다.',
     '> **자주 나오는 패턴**: 현장에서 락 에러의 대부분은 첫 번째와 두 번째 원인에서 발생합니다.']
  ],
  748:[
    ['> **실무 한마디**: 제 경험상 로컬에서 가장 흔한 범인은 단연 "안 죽은 이전 서버"와 "compose 내림 깜빡함"입니다.',
     '> **실무 팁**: 로컬에서 가장 흔한 원인은 "안 죽은 이전 서버"와 "compose 내림 깜빡함"입니다.']
  ],
  736:[
    ['제 경험상 운영 중 가장 많이 본 케이스는 1위 사용자명 혼동(`root` vs `ubuntu`), 2위 `authorized_keys`를 `sudo`로 root 소유로 만들어버린 소유자 문제였습니다.',
     '운영 환경에서 가장 흔한 케이스는 1위 사용자명 혼동(`root` vs `ubuntu`), 2위 `authorized_keys`를 `sudo`로 root 소유로 만들어버린 소유자 문제입니다.']
  ],
  626:[
    ['> **실무 경험 한마디**: 제가 운영하던 환경에서 배포할 때마다 간헐적으로 403이 떴는데, 원인은 CI가 `rsync`로 파일을 올리면서 컨텍스트가 `default_t`로 덮인 거였습니다.',
     '> **자주 나오는 사례**: 배포할 때마다 간헐적으로 403이 뜨는 경우, CI가 `rsync`로 파일을 올리면서 컨텍스트가 `default_t`로 덮이는 것이 흔한 원인입니다.']
  ],
  739:[
    ['> **실무 한마디:** 제 경험상 현업에서 터지는 임포트 에러의 80%는 ②번(인터프리터 불일치) 한 가지입니다.',
     '> **실무 팁:** 현업에서 터지는 임포트 에러의 대부분은 ②번(인터프리터 불일치) 하나로 수렴합니다.']
  ],
  621:[
    ['제 경험상 새벽 NotReady의 70%는 **디스크 압박**과 **CNI 미초기화** 둘로 수렴합니다.',
     '실무에서 새벽 NotReady의 대부분은 **디스크 압박**과 **CNI 미초기화** 둘로 수렴합니다.'],
    ['그래서 알람이 오면 저는 describe Conditions를 본 뒤 묻지도 따지지도 않고 `df -h`와 `ls /etc/cni/net.d`부터 칩니다.',
     '그래서 알람이 오면 describe Conditions를 확인한 뒤 곧바로 `df -h`와 `ls /etc/cni/net.d`부터 점검하는 것이 효율적입니다.']
  ],
  610:[
    ['제 경험상 운영 OOM의 절반 이상은 "힙이 부족해서"가 아니라 "안 줄어들어서"였습니다.',
     '운영 환경의 OOM은 절반 이상이 "힙이 부족해서"가 아니라 "안 줄어들어서" 발생합니다.'],
    ['그래서 저는 장애 시 `-Xmx`부터 올리는 대신 **항상 힙덤프를 먼저 떠둡니다.** 재기동하면 증거가 날아가니까요.',
     '그래서 장애 시 `-Xmx`부터 올리기보다 **힙덤프를 먼저 확보하는 것이 좋습니다.** 재기동하면 증거가 사라지기 때문입니다.'],
    ['일단 덤프 확보 → 재기동 → 차분히 MAT 분석, 이 순서를 몸에 익히면 같은 장애를 두 번 겪지 않습니다.',
     '덤프 확보 → 재기동 → MAT 분석 순서를 지키면 같은 장애를 반복하지 않을 수 있습니다.']
  ],
  636:[
    ["제 경험상 운영에서 터지는 'invalid signature'의 70%는 ④번, 시크릿 끝 개행이거나 ⑤번, 환경별 시크릿 주입 불일치였습니다.",
     "운영에서 터지는 'invalid signature'의 대부분은 ④번(시크릿 끝 개행) 또는 ⑤번(환경별 시크릿 주입 불일치)입니다."]
  ],
  594:[
    ['제 경험상 의존성 충돌로 새벽에 호출당하는 팀의 공통점은 **사람이 모든 버전을 손으로 핀했다는 것**입니다.',
     '의존성 충돌로 새벽에 호출당하는 팀의 공통점은 **모든 버전을 손으로 고정(pin)했다는 것**입니다.']
  ],
  664:[
    ['> **실무 한마디** — 제 경험상 1~3년차 엔지니어가 CrashLoopBackOff로 가장 많이 헤매는 지점은',
     '> **실무 팁** — 1~3년차 엔지니어가 CrashLoopBackOff로 가장 많이 헤매는 지점은']
  ],
  767:[
    ['제 경험상 재발급까지 했는데도 Unauthorized가 안 풀리는 케이스의 대부분은',
     '재발급까지 했는데도 Unauthorized가 안 풀리는 케이스의 대부분은']
  ],
};

const ids=Object.keys(MAP).map(Number);
const {data}=await sb.from('posts').select('id,slug,title,content').in('id',ids);
const byId=Object.fromEntries(data.map(r=>[r.id,r]));
const bak=[]; let okCnt=0, missCnt=0;
for(const id of ids){
  const p=byId[id];
  if(!p){console.log('⚠ #'+id,'글 없음(발행 아님?) — 스킵');continue;}
  let c=p.content, changed=[], missed=[];
  for(const [find,rep] of MAP[id]){
    if(c.includes(find)){ c=c.replace(find,rep); changed.push([find,rep]); }
    else missed.push(find);
  }
  if(missed.length){ missCnt+=missed.length; missed.forEach(f=>console.log('  ❓ #'+id+' 미발견: '+f.slice(0,60))); }
  if(!changed.length) continue;
  okCnt+=changed.length;
  // 인사말 제거로 생긴 앞부분 빈 줄 정리
  c=c.replace(/^\s*\n+/,'').replace(/\n{3,}/g,'\n\n');
  console.log('\n═══ #'+id+' '+p.title.slice(0,44)+' ('+changed.length+'건) ═══');
  changed.forEach(([f,r])=>console.log('  - '+f.slice(0,64)+(f.length>64?'…':'')+'\n  + '+(r?r.slice(0,64)+(r.length>64?'…':''):'(삭제)')));
  if(APPLY){
    bak.push({id:p.id,slug:p.slug,content:p.content});
    const{error}=await sb.from('posts').update({content:c}).eq('id',p.id);
    console.log(error?('  ⚠ '+error.message):'  ✅ 반영');
  }
}
console.log('\n치환 '+okCnt+'건, 미발견 '+missCnt+'건'+(APPLY?'':' (dry-run)'));
if(APPLY){
  const date='2026-07-12';
  writeFileSync(new URL('./persona-neutralize-backup-'+date+'.json',import.meta.url),JSON.stringify(bak));
  console.log('백업: persona-neutralize-backup-'+date+'.json ('+bak.length+'편)');
}
