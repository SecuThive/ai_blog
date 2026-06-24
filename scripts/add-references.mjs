import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env=readFileSync(new URL('../.env.local',import.meta.url),'utf8');
for(const l of env.split('\n')){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)process.env[m[1]]??=m[2].trim();}
const sb=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
const APPLY=process.argv.includes('--apply');

// 검증 완료(200)된 권위 출처만 사용
const REFS={
99:[["Anthropic — Tool use (Function Calling) 공식 문서","https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview"],
    ["Model Context Protocol (MCP)","https://modelcontextprotocol.io/"]],
205:[["NIST SP 800-207: Zero Trust Architecture (공식 표준)","https://csrc.nist.gov/pubs/sp/800/207/final"],
     ["Kubernetes Network Policies 공식 문서","https://kubernetes.io/docs/concepts/services-networking/network-policies/"]],
209:[["OWASP Top 10 (웹 애플리케이션 보안 위험)","https://owasp.org/www-project-top-ten/"]],
213:[["CISA KEV — Known Exploited Vulnerabilities Catalog","https://www.cisa.gov/known-exploited-vulnerabilities-catalog"],
     ["FIRST EPSS — Exploit Prediction Scoring System","https://www.first.org/epss/"]],
214:[["OWASP Top 10 for LLM Applications","https://genai.owasp.org/llm-top-10/"],
     ["Anthropic — Tool use 공식 문서","https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview"]],
217:[["Google Cloud Architecture Framework","https://cloud.google.com/architecture/framework"]],
218:[["Argo CD 공식 문서","https://argo-cd.readthedocs.io/en/stable/"],
     ["OpenGitOps — GitOps 원칙","https://opengitops.dev/"]],
};

let n=0;
for(const [id,refs] of Object.entries(REFS)){
  const {data,error}=await sb.from('posts').select('id,title,content,status').eq('id',+id).single();
  if(error){console.error(id,error.message);continue;}
  if(data.status!=='published'){console.log(`#${id} 미발행 — 건너뜀`);continue;}
  if(data.content.includes('## 참고 자료')){console.log(`#${id} 이미 있음 — 건너뜀`);continue;}
  const block='\n\n## 참고 자료\n'+refs.map(([t,u])=>`- [${t}](${u})`).join('\n');
  const next=data.content.trimEnd()+block;
  console.log(`#${id} "${data.title.slice(0,30)}" +${refs.length}개 링크`);
  if(APPLY){const{error:e}=await sb.from('posts').update({content:next}).eq('id',+id);if(e)console.error(e.message);else n++;}
}
console.log(`\n${APPLY?'적용 '+n+'편':'DRY RUN'}`);
