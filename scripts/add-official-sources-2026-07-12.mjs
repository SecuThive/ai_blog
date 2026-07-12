// #3 공식 1차 출처 본문 인용 (2026-07-12)
// 원칙: 제목에 '특정 도구/표준'이 명시된 색인 글 중 본문에 공식 링크가 없는 글에만,
//       내가 확신하는 실재 canonical URL 을 문맥형으로 삽입. (개념형 글은 대상 제외)
//       URL 날조 금지 — 안정적인 랜딩/섹션 페이지만 사용.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

// 이미 공식 링크가 있으면 스킵하는 판정(점수 루브릭과 동일)
const OFF=/https?:\/\/(docs\.|kubernetes\.io|redis\.io|git-scm|postgresql\.org|dev\.mysql|owasp|learn\.microsoft|cloud\.google|docs\.aws|nginx\.org|python\.org|nodejs\.org|man7\.org|web\.dev|kafka\.apache|isms\.kisa|jwt\.io|datatracker\.ietf|oracle\.com|helm\.sh|hashicorp|istio\.io|prometheus\.io|argo-cd\.readthedocs|man\.openssh)/;

// [제목 매칭 정규식, URL, 라벨] — 위에서부터 첫 매칭 사용(구체적인 것 먼저)
const RULES=[
  [/argo\s?cd|argocd/i,'https://argo-cd.readthedocs.io/en/stable/','Argo CD 공식 문서'],
  [/istio/i,'https://istio.io/latest/docs/','Istio 공식 문서'],
  [/prometheus/i,'https://prometheus.io/docs/introduction/overview/','Prometheus 공식 문서'],
  [/ansible/i,'https://docs.ansible.com/','Ansible 공식 문서'],
  [/terraform/i,'https://developer.hashicorp.com/terraform/docs','Terraform 공식 문서'],
  [/\bhelm\b/i,'https://helm.sh/docs/','Helm 공식 문서'],
  [/kafka/i,'https://kafka.apache.org/documentation/','Apache Kafka 공식 문서'],
  [/selinux/i,'https://man7.org/linux/man-pages/man8/selinux.8.html','SELinux 매뉴얼 페이지(man7.org)'],
  [/\bssh\b|sshd|openssh|publickey/i,'https://man7.org/linux/man-pages/man5/sshd_config.5.html','OpenSSH sshd_config 매뉴얼(man7.org)'],
  [/\bjwt\b/i,'https://datatracker.ietf.org/doc/html/rfc7519','RFC 7519 — JSON Web Token 표준'],
  [/postgres/i,'https://www.postgresql.org/docs/current/','PostgreSQL 공식 문서'],
  [/\bredis\b/i,'https://redis.io/docs/latest/','Redis 공식 문서'],
  [/nginx/i,'https://nginx.org/en/docs/','nginx 공식 문서'],
  [/docker/i,'https://docs.docker.com/','Docker 공식 문서'],
  [/kubernetes|k8s|kubectl|crashloop|imagepull|\bpvc\b|kubelet|coredns|파드|kube-/i,'https://kubernetes.io/docs/home/','Kubernetes 공식 문서'],
  [/(java|\bjvm\b|outofmemory|heap\s*space|가비지\s*컬렉|\bgc\b)/i,'https://docs.oracle.com/en/java/javase/21/','Oracle Java SE 21 공식 문서'],
  [/(python|\bpip\b|modulenotfound|importerror|resolutionimpossible)/i,'https://docs.python.org/3/','Python 공식 문서'],
  [/(node\.?js|npm )/i,'https://nodejs.org/en/docs','Node.js 공식 문서'],
  [/owasp/i,'https://owasp.org/','OWASP 공식 자료'],
];

// 오해 소지(다중 도구/개념 글에 특정 도구 링크가 오독을 부르는 경우) 수동 제외
const EXCLUDE=new Set([135,265,540,598,772]);
const noindex=new Set(JSON.parse(readFileSync(new URL('../src/lib/noindex-slugs.json',import.meta.url),'utf8')));
let a=[],f=0;for(;;){const{data}=await sb.from('posts').select('id,slug,title,content').eq('status','published').range(f,f+499);a=a.concat(data);if(data.length<500)break;f+=500;}

const targets=[];
for(const p of a){
  if(EXCLUDE.has(p.id))continue;                   // 오독 소지 수동 제외
  if(noindex.has(p.slug))continue;                 // 색인 글만
  if(OFF.test(p.content||''))continue;              // 이미 공식 링크 있으면 스킵
  const codeN=(p.content.match(/```/g)||[]).length/2;
  if(codeN<1)continue;                              // 코드 없는 순개념글 제외
  const rule=RULES.find(r=>r[0].test(p.title));     // 제목에 도구명 명시된 것만
  if(!rule)continue;
  targets.push({p,url:rule[1],label:rule[2]});
}
console.log('대상:',targets.length,'편\n');

const bak=[];let done=0;
for(const {p,url,label} of targets){
  const note='\n## 참고: 공식 문서\n\n이 글에서 다루는 동작·설정·에러의 1차 출처는 다음 공식 문서입니다. 버전별 옵션과 정확한 동작은 여기서 확인하세요.\n\n- [' + label + '](' + url + ')\n';
  if(p.content.includes(url)){console.log('#'+p.id,'이미 링크 존재 — 스킵');continue;}
  let c=p.content;
  const faqIdx=c.search(/^## (자주 묻는 질문|FAQ)/m);
  c = faqIdx>=0 ? c.slice(0,faqIdx)+note+'\n'+c.slice(faqIdx) : c.trimEnd()+'\n'+note;
  done++;
  console.log('#'+p.id+' ['+label+'] '+p.title.slice(0,50)+(faqIdx>=0?'  (FAQ앞)':'  (끝)'));
  if(APPLY){
    bak.push({id:p.id,slug:p.slug,content:p.content});
    const{error}=await sb.from('posts').update({content:c}).eq('id',p.id);
    if(error)console.log('  ⚠ '+error.message);
  }
}
console.log('\n삽입 '+done+'편'+(APPLY?'':' (dry-run)'));
if(APPLY){writeFileSync(new URL('./official-sources-backup-2026-07-12.json',import.meta.url),JSON.stringify(bak));console.log('백업: official-sources-backup-2026-07-12.json ('+bak.length+'편)');}
