/**
 * Add two ASCII-slug Kubernetes engineer runbooks (KO + embedded EN).
 * Also softens remaining homepage/series UI copy (마스터/완벽/완전 정복).
 *
 * Run on newgen: cd ~/project/ai-blog && /opt/homebrew/bin/node scripts/insert-k8s-runbooks-2026-09-22.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const APPLY = process.argv.includes('--apply');
const ALSO_COPY = !process.argv.includes('--skip-copy');

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

function embedEn(koBody, en) {
  return `${koBody.trim()}\n\n<!--NodelogEN\n${JSON.stringify(en)}\nNodelogEN-->`;
}

const imagePullKo = `# ImagePullBackOff 진단 런북

\`ImagePullBackOff\` / \`ErrImagePull\`은 Pod가 **컨테이너 이미지를 가져오지 못해** 기동에 실패한 상태입니다. CrashLoopBackOff와 달리 컨테이너 프로세스가 한 번도 뜨지 않은 경우가 많습니다.

## 30초 체크리스트

1. \`kubectl get pod <name> -o wide\` — STATUS가 \`ImagePullBackOff\` / \`ErrImagePull\`인지 확인
2. \`kubectl describe pod <name>\` — Events 맨 아래 \`Failed\` / \`BackOff\` 메시지 복사
3. 이미지 문자열 확인: \`registry/repo:tag\` 오타, digest, \`latest\` 의존
4. 프라이빗 레지스트리면 \`imagePullSecrets\` / 노드 IAM / 네트워크(방화벽·DNS) 점검
5. 워커 노드에서 동일 이미지 \`crictl pull\` 또는 \`ctr images pull\`로 재현

## Events에서 원인 분류

\`\`\`bash
kubectl describe pod <pod> -n <ns> | sed -n '/Events:/,$p'
kubectl get events -n <ns> --field-selector involvedObject.name=<pod> --sort-by=.lastTimestamp
\`\`\`

| Events 키워드 | 의미 | 다음 액션 |
|---|---|---|
| \`not found\` / \`manifest unknown\` | 태그·이름 없음 | 레지스트리에서 태그 존재 확인, CI 푸시 여부 |
| \`unauthorized\` / \`denied\` / \`401\` / \`403\` | 인증·권한 | Secret, IRSA/Workload Identity, robot account |
| \`i/o timeout\` / \`no such host\` / \`TLS\` | 네트워크·DNS·인증서 | 노드 DNS, 프록시, 사설 CA |
| \`toomanyrequests\` / \`429\` | 레이트 리밋 | 미러, pull-through cache, 재시도 백오프 |
| \`rpc error\` / \`context deadline\` | 런타임·디스크 | 노드 disk-pressure, containerd 로그 |

## 진단 명령

\`\`\`bash
# 이미지 참조 확인
kubectl get pod <pod> -n <ns> -o jsonpath='{range .spec.containers[*]}{.name}{"\\t"}{.image}{"\\n"}{end}'

# imagePullSecrets
kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.imagePullSecrets[*].name}{"\\n"}'
kubectl get sa default -n <ns> -o yaml | sed -n '/imagePullSecrets/,/^[^ ]/p'

# 노드에서 직접 pull (containerd 예시)
IMAGE=$(kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[0].image}')
NODE=$(kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.nodeName}')
kubectl debug node/$NODE -it --image=busybox -- chroot /host crictl pull "$IMAGE"
\`\`\`

## 원인별 수정

### 1) 잘못된 태그·레지스트리

\`\`\`yaml
# before
image: ghcr.io/acme/api:v1.2.3
# after — 실제 존재하는 태그/digest
image: ghcr.io/acme/api@sha256:…
\`\`\`

### 2) 프라이빗 레지스트리 인증

\`\`\`bash
kubectl create secret docker-registry regcred \\
  --docker-server=ghcr.io \\
  --docker-username=<user> \\
  --docker-password=<token> \\
  -n <ns>

# Pod 또는 ServiceAccount에 연결
\`\`\`

\`\`\`yaml
spec:
  imagePullSecrets:
    - name: regcred
\`\`\`

EKS라면 노드 역할 / IRSA가 ECR \`GetAuthorizationToken\`·\`BatchGetImage\`를 갖는지 확인하세요.

### 3) 네트워크·DNS

- 노드에서 \`getent hosts registry.example.com\`
- HTTP 프록시 환경이면 containerd의 proxy 설정
- 사설 HTTPS면 노드 신뢰 저장소에 CA 추가

### 4) 레이트 리밋

Docker Hub 익명 pull 한도에 걸리면 인증 pull, 미러, 또는 사내 pull-through cache로 이동하세요.

## 재발 방지

- 배포 이미지에 **mutable \`latest\` 금지**, digest 고정
- CI에서 \`crane digest\` / \`skopeo inspect\`로 존재 확인 후 롤아웃
- \`imagePullPolicy: IfNotPresent\`는 태그 재사용 시 위험 — digest면 안전
- 클러스터에 레지스트리 미러/캐시

## 빠른 판정표

| 증상 | 첫 수정 |
|---|---|
| manifest unknown | 태그·푸시 확인 |
| unauthorized | pull secret / 클라우드 IAM |
| timeout / no such host | DNS·방화벽·프록시 |
| 429 | 인증·미러 |
| 특정 노드만 실패 | 그 노드 디스크·런타임·네트워크 |

ImagePullBackOff는 앱 버그가 아니라 **이미지 공급 경로** 문제입니다. Events 한 줄만 제대로 읽어도 대부분 5분 안에 갈래가 갈립니다.
`;

const imagePullEn = {
  title: 'Kubernetes ImagePullBackOff Fix — Events Checklist and Commands',
  excerpt:
    'A diagnostic runbook for ImagePullBackOff and ErrImagePull: read Events, classify not-found vs auth vs network vs rate-limit, then verify with describe, secrets, and node-side pull.',
  content: `# ImagePullBackOff diagnostic runbook

\`ImagePullBackOff\` / \`ErrImagePull\` means the kubelet **could not fetch the container image**. Unlike CrashLoopBackOff, the process often never started.

## 30-second checklist

1. \`kubectl get pod <name> -o wide\` — confirm \`ImagePullBackOff\` / \`ErrImagePull\`
2. \`kubectl describe pod <name>\` — copy the bottom Events (\`Failed\` / \`BackOff\`)
3. Validate the image string: registry/repo:tag, digest, avoid relying on \`latest\`
4. For private registries: \`imagePullSecrets\`, node IAM, network (firewall/DNS)
5. Reproduce on the worker with \`crictl pull\` / \`ctr images pull\`

## Classify from Events

\`\`\`bash
kubectl describe pod <pod> -n <ns> | sed -n '/Events:/,$p'
kubectl get events -n <ns> --field-selector involvedObject.name=<pod> --sort-by=.lastTimestamp
\`\`\`

| Events keyword | Meaning | Next step |
|---|---|---|
| \`not found\` / \`manifest unknown\` | Missing tag/name | Confirm tag in registry; check CI push |
| \`unauthorized\` / \`denied\` / \`401\` / \`403\` | Auth/RBAC | Secret, IRSA/Workload Identity, robot account |
| \`i/o timeout\` / \`no such host\` / \`TLS\` | Network/DNS/certs | Node DNS, proxy, private CA |
| \`toomanyrequests\` / \`429\` | Rate limit | Mirror, pull-through cache, backoff |
| \`rpc error\` / \`context deadline\` | Runtime/disk | disk-pressure, containerd logs |

## Diagnostic commands

\`\`\`bash
kubectl get pod <pod> -n <ns> -o jsonpath='{range .spec.containers[*]}{.name}{"\\t"}{.image}{"\\n"}{end}'
kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.imagePullSecrets[*].name}{"\\n"}'

IMAGE=$(kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[0].image}')
NODE=$(kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.nodeName}')
kubectl debug node/$NODE -it --image=busybox -- chroot /host crictl pull "$IMAGE"
\`\`\`

## Fixes by cause

### Wrong tag or registry

Pin a real tag or digest. Do not redeploy on a floating \`latest\` without verification.

### Private registry auth

\`\`\`bash
kubectl create secret docker-registry regcred \\
  --docker-server=ghcr.io \\
  --docker-username=<user> \\
  --docker-password=<token> \\
  -n <ns>
\`\`\`

Attach via Pod \`imagePullSecrets\` or the ServiceAccount. On EKS, confirm the node role / IRSA can call ECR \`GetAuthorizationToken\` and \`BatchGetImage\`.

### Network and DNS

- \`getent hosts registry.example.com\` on the node
- Configure containerd proxy if required
- Trust private CAs on the node

### Rate limits

Authenticate pulls, use a mirror, or a pull-through cache.

## Prevent recurrence

- Pin digests in production
- CI verifies image existence before rollout
- Prefer digest over mutable tags with \`IfNotPresent\`
- Cluster-level registry mirror/cache

ImagePullBackOff is a **supply-path** failure, not an app crash. One clear Events line usually splits the tree in minutes.
`,
};

const endpointsKo = `# Endpoints none 진단 런북

Service는 살아 있는데 \`Endpoints\`/\`EndpointSlice\`가 비어 있으면(\`Endpoints none\`, \`endpoints: []\`) 트래픽이 Pod로 전달되지 않습니다. 증상은 타임아웃·\`connection refused\`·로드밸런서 unhealthy로 나타납니다.

## 30초 체크리스트

1. \`kubectl get svc,endpoints,endpointslice -n <ns>\` — Service 대비 Endpoints 비었는지
2. Service \`selector\`와 Pod \`labels\`가 **완전히** 일치하는지
3. Ready Pod가 있는지 (\`kubectl get pods\` READY 0/1이면 Endpoints에 안 실음)
4. \`publishNotReadyAddresses\` / headless / ExternalName 예외인지
5. NetworkPolicy·kube-proxy·Cilium/kube-proxy-free 환경 여부

## Events·오브젝트 확인

\`\`\`bash
kubectl get svc <svc> -n <ns> -o yaml
kubectl get endpoints <svc> -n <ns> -o yaml
kubectl get endpointslice -n <ns> -l kubernetes.io/service-name=<svc> -o yaml
kubectl describe svc <svc> -n <ns>
\`\`\`

Endpoints가 비어 있으면 kube-proxy/ dataplane이 백엔드를 프로그램할 대상이 없습니다.

## selector ↔ label 대조

\`\`\`bash
# Service selector
kubectl get svc <svc> -n <ns> -o jsonpath='{.spec.selector}{"\\n"}'

# 그 selector로 Pod가 실제로 잡히는지
SEL=$(kubectl get svc <svc> -n <ns> -o jsonpath='{range $k,$v := .spec.selector}{$k}={$v},{end}' | sed 's/,$//')
kubectl get pods -n <ns> -l "$SEL" -o wide

# Pod 라벨 덤프
kubectl get pods -n <ns> --show-labels
\`\`\`

흔한 실수:

- \`app: api\` vs \`app.kubernetes.io/name: api\` 혼용
- Helm 차트에서 selector를 immutable하게 바꾼 뒤 업그레이드 실패/불일치
- 잘못된 네임스페이스의

## Ready가 아니면 Endpoints에 안 붙음

\`\`\`bash
kubectl get pods -n <ns> -o wide
kubectl describe pod <pod> -n <ns> | sed -n '/Conditions:/,/Containers:/p'
kubectl get pod <pod> -n <ns> -o jsonpath='{range .status.conditions[*]}{.type}={.status}{"\\n"}{end}'
\`\`\`

| 상태 | 결과 |
|---|---|
| Ready=False (probe fail) | Endpoints에서 제외 |
| CrashLoopBackOff | 제외 |
| Pending / ImagePullBackOff | 제외 |
| Ready=True | Endpoints에 IP 등록 |

\`\`\`yaml
# 디버그 중에만 — NotReady도 노출 (주의)
spec:
  publishNotReadyAddresses: true
\`\`\`

## targetPort·프로토콜

\`\`\`bash
kubectl get svc <svc> -n <ns> -o jsonpath='{range .spec.ports[*]}{.name}{"\\t"}{.port}{"→"}{.targetPort}{"\\t"}{.protocol}{"\\n"}{end}'
kubectl get pod <pod> -n <ns> -o jsonpath='{range .spec.containers[*].ports[*]}{.containerPort}{"\\t"}{.protocol}{"\\n"}{end}'
\`\`\`

Endpoints에 IP는 있는데 포트가 비면 \`targetPort\` 이름이 컨테이너 포트 name과 안 맞는 경우입니다.

## NetworkPolicy·dataplane

- Ingress/Egress policy가 kube-apiserver→Pod 또는 클라이언트→Pod를 막는지
- Cilium/Calico identity 기반 정책에서 label 변경 후 미반영
- \`kubectl run netshot --rm -it --image=nicolaka/netshoot -- /bin/bash\`로 Service ClusterIP·Pod IP 직접 curl

## 빠른 판정표

| 관찰 | 조치 |
|---|---|
| selector로 Pod 0개 | 라벨/네임스페이스 수정 |
| Pod는 있는데 Ready=False | probe·CrashLoop·이미지 문제 먼저 |
| Endpoints IP 있는데 접속 실패 | targetPort·NetworkPolicy·노드 방화벽 |
| ExternalName/없는 selector | Endpoints가 비는 것이 정상일 수 있음 |

## 재발 방지

- Service selector와 Deployment template labels를 한 소스(Helm values)에서 생성
- CI에서 \`kubectl get endpoints\`가 비면 배포 실패 처리
- readinessProbe를 실제 트래픽 포트에 맞추기
- 라벨 스키마를 \`app.kubernetes.io/*\`로 통일

Endpoints none은 “Service 고장”이 아니라 **셀렉터·Ready·포트 계약**이 깨졌다는 신호입니다. selector로 Pod가 잡히는지부터 확인하면 대부분 갈래가 정해집니다.
`;

const endpointsEn = {
  title: 'Kubernetes Endpoints None Fix — Empty Service Backends Runbook',
  excerpt:
    'When a Service has no Endpoints/EndpointSlices, traffic goes nowhere. Match selectors to labels, require Ready pods, verify targetPort, then check NetworkPolicy and the dataplane.',
  content: `# Endpoints none diagnostic runbook

If the Service exists but \`Endpoints\` / \`EndpointSlice\` is empty (\`Endpoints none\`, \`endpoints: []\`), traffic never reaches Pods. You usually see timeouts, connection refused, or an unhealthy load balancer.

## 30-second checklist

1. \`kubectl get svc,endpoints,endpointslice -n <ns>\` — confirm empty backends
2. Service \`selector\` must **exactly** match Pod labels
3. At least one Ready Pod (\`READY 0/1\` pods are excluded)
4. Check exceptions: \`publishNotReadyAddresses\`, headless, ExternalName
5. Consider NetworkPolicy and kube-proxy / Cilium dataplane

## Inspect objects

\`\`\`bash
kubectl get svc <svc> -n <ns> -o yaml
kubectl get endpoints <svc> -n <ns> -o yaml
kubectl get endpointslice -n <ns> -l kubernetes.io/service-name=<svc> -o yaml
kubectl describe svc <svc> -n <ns>
\`\`\`

Empty Endpoints means the dataplane has nothing to program.

## Match selector to labels

\`\`\`bash
kubectl get svc <svc> -n <ns> -o jsonpath='{.spec.selector}{"\\n"}'
SEL=$(kubectl get svc <svc> -n <ns> -o jsonpath='{range $k,$v := .spec.selector}{$k}={$v},{end}' | sed 's/,$//')
kubectl get pods -n <ns> -l "$SEL" -o wide
kubectl get pods -n <ns> --show-labels
\`\`\`

Common mistakes: mixing \`app\` vs \`app.kubernetes.io/name\`, Helm selector immutability drift, wrong namespace.

## Not Ready ⇒ not in Endpoints

\`\`\`bash
kubectl get pods -n <ns> -o wide
kubectl get pod <pod> -n <ns> -o jsonpath='{range .status.conditions[*]}{.type}={.status}{"\\n"}{end}'
\`\`\`

| State | Result |
|---|---|
| Ready=False | Excluded from Endpoints |
| CrashLoopBackOff / Pending / ImagePullBackOff | Excluded |
| Ready=True | Pod IP registered |

## targetPort and protocol

Compare Service \`targetPort\` (name or number) with container ports. IP present but no ports usually means a name mismatch.

## NetworkPolicy and dataplane

- Policies blocking client→Pod or probe paths
- CNI identity lag after label changes
- Debug with netshoot against ClusterIP and Pod IP

## Decision table

| Observation | Action |
|---|---|
| 0 pods for selector | Fix labels/namespace |
| Pods exist, Ready=False | Fix probes / crashes / image first |
| Endpoints IP but connect fails | targetPort, NetworkPolicy, node firewall |
| ExternalName / no selector | Empty Endpoints can be expected |

## Prevent recurrence

- Generate Service selector and Pod labels from one Helm values source
- Fail CI when Endpoints stay empty after rollout
- Point readinessProbe at the real traffic port
- Standardize on \`app.kubernetes.io/*\` labels

Endpoints none is not a “broken Service object” — it means the **selector / Ready / port contract** broke. Start with “does this selector return Pods?”
`,
};

const GUIDES = [
  {
    title: 'Kubernetes ImagePullBackOff 진단 — Events·체크리스트·명령',
    slug: 'kubernetes-imagepullbackoff-fix',
    summary:
      'ImagePullBackOff·ErrImagePull을 Events로 분류하고, 태그/인증/네트워크/레이트 리밋을 체크리스트와 노드 pull 명령으로 좁히는 진단형 런북입니다.',
    category: '트러블슈팅',
    difficulty: 'intermediate',
    os_compat: ['linux'],
    tags: [
      'kubernetes',
      'imagepullbackoff',
      'errimagepull',
      'troubleshooting',
      'kubectl',
      'i18n.title:Kubernetes ImagePullBackOff Fix — Events Checklist and Commands',
      'i18n.excerpt:A diagnostic runbook for ImagePullBackOff and ErrImagePull: read Events, classify not-found vs auth vs network vs rate-limit, then verify with describe, secrets, and node-side pull.',
    ],
    author: 'Nodelog',
    status: 'published',
    content: embedEn(imagePullKo, imagePullEn),
  },
  {
    title: 'Kubernetes Endpoints none 진단 — 셀렉터·Ready·targetPort',
    slug: 'kubernetes-endpoints-none-fix',
    summary:
      'Service는 있는데 Endpoints가 비는 원인을 selector·Ready·targetPort·NetworkPolicy 순으로 좁히는 진단형 런북입니다. 체크리스트와 kubectl 명령을 포함합니다.',
    category: '트러블슈팅',
    difficulty: 'intermediate',
    os_compat: ['linux'],
    tags: [
      'kubernetes',
      'endpoints',
      'endpointslice',
      'service',
      'troubleshooting',
      'i18n.title:Kubernetes Endpoints None Fix — Empty Service Backends Runbook',
      'i18n.excerpt:When a Service has no Endpoints/EndpointSlices, traffic goes nowhere. Match selectors to labels, require Ready pods, verify targetPort, then check NetworkPolicy and the dataplane.',
    ],
    author: 'Nodelog',
    status: 'published',
    content: embedEn(endpointsKo, endpointsEn),
  },
];

function patchCopy() {
  const seriesPage = 'src/app/[locale]/series/page.tsx';
  let t = readFileSync(seriesPage, 'utf8');
  const before = t;
  t = t.replace(
    '14개 시리즈, 100편 이상의 심층 연재. RAG부터 엔터프라이즈 AI까지 단계별로 완전 정복.',
    '14개 시리즈, 100편 이상의 심층 연재. RAG부터 엔터프라이즈 AI까지 순서대로 읽으면 됩니다.',
  );
  if (t !== before) {
    writeFileSync(seriesPage, t);
    console.log('patched', seriesPage);
  } else {
    console.log('series page already soft, or pattern missing');
  }
}

async function main() {
  if (ALSO_COPY) patchCopy();

  const { data: existing, error: e1 } = await sb.from('engineer_guides').select('slug,category');
  if (e1) throw e1;
  const slugs = new Set(existing.map((g) => g.slug));
  const cats = new Set(existing.map((g) => g.category));

  for (const g of GUIDES) {
    if (!cats.has(g.category)) throw new Error(`bad category ${g.category}`);
    if (slugs.has(g.slug)) {
      console.log('exists, will update:', g.slug);
    } else {
      console.log('new:', g.slug);
    }
    console.log('  content chars', g.content.length);
  }

  if (!APPLY) {
    console.log('dry-run only. pass --apply to upsert.');
    return;
  }

  for (const g of GUIDES) {
    const row = {
      title: g.title,
      slug: g.slug,
      summary: g.summary,
      content: g.content,
      category: g.category,
      tags: g.tags,
      difficulty: g.difficulty,
      os_compat: g.os_compat,
      author: g.author,
      status: g.status,
      updated_at: new Date().toISOString(),
    };
    if (slugs.has(g.slug)) {
      const { error } = await sb.from('engineer_guides').update(row).eq('slug', g.slug);
      if (error) throw error;
      console.log('updated', g.slug);
    } else {
      const { error } = await sb.from('engineer_guides').insert({
        ...row,
        created_at: new Date().toISOString(),
        views: 0,
      });
      if (error) throw error;
      console.log('inserted', g.slug);
    }
  }

  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
