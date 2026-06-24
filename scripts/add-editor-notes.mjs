import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

const NOTES={
65:`

## 에디터 노트 — 현장에서는

RAG를 도입한 팀들을 보면, 실패의 8할은 '검색이 안 돼서'가 아니라 **평가 체계를 안 만들어서**입니다. 데모는 잘 되는데 운영에서 답변 품질이 들쭉날쭉한 원인을 못 찾습니다. 첫 스프린트부터 골든 질문셋 20~30개를 만들어 회귀 테스트처럼 돌리세요. 청킹·임베딩 모델을 바꿀 때마다 이 점수가 오르는지 확인하는 것 — 그게 RAG 운영의 절반입니다. 화려한 아키텍처보다 '측정 가능한 루프'가 먼저입니다.`,
99:`

## 에디터 노트 — 현장에서는

에이전트에 도구를 많이 붙일수록 똑똑해질 것 같지만, 실제로는 도구가 5~6개를 넘으면 LLM이 '어떤 도구를 언제 쓸지' 판단을 자주 틀립니다. 가장 효과가 컸던 건 도구 개수를 줄이고, 각 도구 설명(description)을 사람이 읽어도 안 헷갈릴 만큼 구체적으로 쓰는 것이었습니다 — \`search\`보다 \`search_internal_docs(사내 위키에서 검색)\`처럼요. 도구 설계는 프롬프트 엔지니어링의 연장입니다.`,
205:`

## 에디터 노트 — 현장에서는

제로트러스트는 '제품 사면 끝'이 아니라 조직 정치에 가깝습니다. 가장 큰 저항은 기술이 아니라 '내 권한을 왜 줄이냐'는 부서들이죠. 그래서 성공한 도입은 거의 다 '관리자 계정 MFA + 핵심 시스템 1개'처럼 작게 시작해 성과를 보여준 뒤 확장했습니다. 전사 빅뱅은 대부분 실패합니다. 기술 로드맵만큼 '누구를 먼저 설득하느냐'의 순서를 설계하세요.`,
217:`

## 에디터 노트 — 현장에서는

'어디가 제일 좋냐'는 대개 잘못된 질문입니다. 실무에서 클라우드 선택을 좌우한 건 점유율이나 단가표가 아니라 **이미 가진 팀 역량**이었습니다. .NET·AD 기반 팀은 Azure에서 생산성이 두 배였고, 데이터 분석 중심 팀은 BigQuery 하나 때문에 GCP를 택했습니다. 벤치마크 표를 비교하기 전에 '우리 팀이 내일부터 디버깅할 수 있는 곳이 어디인가'를 먼저 답하세요.`,
218:`

## 에디터 노트 — 현장에서는

GitOps 도입 초기에 가장 자주 깨지는 건 ArgoCD가 아니라 '사람의 습관'입니다. 급하면 누군가 \`kubectl edit\`로 직접 고치고, 그 순간 Git과 클러스터가 어긋납니다. selfHeal을 켜자 그 변경이 자동 롤백돼 '왜 내 수정이 사라지냐'는 항의가 빗발쳤죠. 결국 GitOps는 도구가 아니라 '변경은 무조건 PR로'라는 규율이 정착돼야 굴러갑니다. 도구는 그 규율을 강제하는 장치일 뿐입니다.`,
209:`

## 에디터 노트 — 현장에서는

보안 게이트를 처음부터 'Critical이면 무조건 차단'으로 켜면, 2주 안에 개발팀이 우회로를 찾습니다. 효과적이었던 건 정반대였습니다 — 처음엔 '신규 취약점만 차단, 기존분은 리포트만'으로 시작해 빌드를 안 막으면서 가시성을 확보하고, 팀이 익숙해진 뒤 게이트를 조였습니다. DevSecOps에서 가장 위험한 건 취약점이 아니라 '보안을 우회하고 싶게 만드는 프로세스'입니다.`,
};

let n=0;
for(const [id,note] of Object.entries(NOTES)){
  const {data,error}=await sb.from('posts').select('id,title,content,status').eq('id',+id).single();
  if(error){console.error(id,error.message);continue;}
  if(data.status!=='published'){console.log(`#${id} 미발행 — 건너뜀`);continue;}
  if(data.content.includes('에디터 노트')){console.log(`#${id} 이미 있음 — 건너뜀`);continue;}
  const next=data.content.trimEnd()+'\n'+note;
  console.log(`#${id} "${data.title.slice(0,32)}" ${data.content.length} → ${next.length}자`);
  if(APPLY){const{error:e}=await sb.from('posts').update({content:next}).eq('id',+id);if(e)console.error(e.message);else n++;}
}
console.log(`\n${APPLY?'적용 '+n+'편':'DRY RUN'}`);
