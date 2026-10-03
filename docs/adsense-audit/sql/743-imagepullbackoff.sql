-- stale-refresh 2026-10-04 post #743 imagepullbackofferrimagepull-해결-events로-원인-진단하고-복붙으로-끝내기
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$# ImagePullBackOff·ErrImagePull 해결: Events 메시지로 원인 진단하고 복붙으로 끝내기

> K8s_Troubleshooting_Guide 17편

배포 파이프라인은 초록불인데 Pod가 또 `ImagePullBackOff`로 멈췄다면, PVC도 네트워크 정책도 통과한 다음 단계, 바로 **kubelet이 레지스트리에서 이미지를 끌어오는 단계**에서 막힌 겁니다. 이 글은 그 한 단계에만 집중합니다. `kubectl describe pod`의 **Events 한 줄**만 보고 5가지 원인 중 정답을 특정하고, 원인별 복붙 명령어로 5분 안에 복구하는 게 목표예요.

## ImagePullBackOff vs ErrImagePull, 둘은 같은 문제다

먼저 헷갈리는 두 상태부터 정리하죠. 둘은 별개 문제가 아니라 **같은 실패의 진행 단계**입니다.

- **ErrImagePull**: kubelet이 이미지 풀을 처음 시도했다가 실패한 직후 상태
- **ImagePullBackOff**: 실패가 반복되어 kubelet이 재시도 간격을 지수적으로 늘리며(back-off) 대기 중인 상태

즉 `ErrImagePull`이 잠깐 보이다가 `ImagePullBackOff`로 굳습니다. 둘 다 **원인은 동일하고 진단 방법도 같습니다.** 상태 이름에 집착하지 말고 곧장 Events를 봅시다.

## 1단계 진단 — Events 메시지 읽는 법

원인의 90%는 Events 마지막 줄에 적혀 있습니다. 다음 두 명령이면 충분해요.

```bash
# 최신순으로 이벤트 모아보기
kubectl get events --sort-by=.lastTimestamp -n <namespace>

# 특정 Pod의 Events만 빠르게 추출
kubectl describe pod <pod> -n <namespace> | grep -A10 Events
```

`Warning  Failed` 줄의 메시지 문구를 아래 진단표에 그대로 대조하세요.

### 원인 진단표

| Events 메시지 (핵심 문구) | 원인 | 해결 섹션 |
|---|---|---|
| `Failed to pull image ... not found` / `manifest unknown` | 태그 오타·존재하지 않는 태그 | → [태그 문제](#원인-1-태그-오타없는-태그) |
| `unauthorized: authentication required` / `pull access denied` | 인증 누락(private registry) | → [인증 누락](#원인-2-인증-누락--imagepullsecrets) |
| `toomanyrequests: You have reached your pull rate limit` | Docker Hub rate limit | → [rate limit](#원인-3-docker-hub-rate-limit) |
| `dial tcp: lookup ... no such host` / `i/o timeout` | 레지스트리 호스트 해석·도달 실패 | → [호스트 해석](#원인-4-레지스트리-호스트-해석-실패) |
| `failed to ... no space left on device` | 노드 디스크 부족 | → [디스크](#원인-5-노드-디스크-부족) |

이 표 한 장이면 "메시지 보이면 바로 여기로" 가 됩니다.

## 2단계 해결 — 원인별 복붙 명령어

### 원인 1: 태그 오타·없는 태그

`not found`면 가장 흔하고 가장 허무한 원인입니다. 레지스트리에 실제로 그 태그가 있는지 먼저 확인하세요.

```bash
# 매니페스트에 박힌 이미지 문자열 확인
kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].image}'

# 로컬에서 동일 태그 풀 가능 여부 테스트
docker pull <registry>/<image>:<tag>
```

오타였다면 `kubectl set image deployment/<deploy> <container>=<image>:<correct-tag>` 로 교체하면 끝입니다.

### 원인 2: 인증 누락 — imagePullSecrets

`unauthorized`면 자격증명이 없는 겁니다. 시크릿을 만들고 Pod에 연결하세요.

```bash
# 1) 레지스트리 로그인이 되는지 먼저 확인
docker login <registry>

# 2) docker-registry 타입 시크릿 생성 (반드시 앱과 같은 네임스페이스에!)
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<password> \
  --docker-email=<email> \
  -n <namespace>
```

Pod(또는 Deployment의 podTemplate)에 시크릿을 붙입니다.

```yaml
spec:
  imagePullSecrets:
    - name: regcred
  containers:
    - name: app
      image: <registry>/<image>:<tag>
```

매 워크로드마다 적기 귀찮다면 [ServiceAccount](/blog/k8s-forbidden-오류-rbac부터-serviceaccount까지-5단계로-완벽-진단하는-방법)에 한 번 붙여 네임스페이스 전체에 적용하세요.

```bash
kubectl patch serviceaccount default -n <namespace> \
  -p '{"imagePullSecrets":[{"name":"regcred"}]}'
```

### 원인 3: Docker Hub rate limit

Docker Hub는 이미지 pull 횟수를 6시간 단위로 제한합니다. 공식 문서(확인일 2026-10-04) 기준으로 비인증 사용자는 IPv4 주소 또는 IPv6 /64 서브넷당 6시간에 100회, 인증한 Personal 계정은 200회이고, Pro·Team·Business 플랜은 무제한입니다. 한도를 넘으면 `toomanyrequests` 오류가 납니다. 비인증 한도는 IP 단위라서 같은 NAT IP를 쓰는 클러스터와 CI 러너가 한도를 나눠 쓰게 되어 특히 잘 걸립니다. 대응은 두 갈래예요.

**(A) 인증 계정으로 풀하기** — 인증하면 한도가 IP가 아니라 계정 기준으로 적용됩니다(Personal 200회/6시간, 유료 플랜 무제한). 위의 `regcred`를 Docker Hub 계정으로 만들어 ServiceAccount에 붙이면 즉시 완화됩니다.

**(B) 미러/풀스루 캐시로 전환** — 근본 해결책입니다. Harbor proxy cache나 ECR pull-through cache를 두고 이미지 경로만 바꾸세요.

```yaml
# 기존: nginx:1.27  (Docker Hub 직접)
# 변경: <account>.dkr.ecr.<region>.amazonaws.com/dockerhub/library/nginx:1.27
image: harbor.mycorp.com/dockerhub-proxy/library/nginx:1.27
```

> 실무 경험담: 한 클러스터에서 야간 배치가 동시에 수십 개 Pod를 띄우자 전부 `toomanyrequests`로 깨진 적이 있습니다. 인증 계정만 붙여도 급한 불은 꺼졌지만, 결국 Harbor 프록시 캐시를 깔고 나서야 재발이 멈췄어요. CI와 운영이 같은 출구 IP를 쓴다면 캐시는 선택이 아니라 필수입니다.

### 원인 4: 레지스트리 호스트 해석 실패

`lookup ... no such host`는 kubelet이 **레지스트리 도메인을 DNS로 풀지 못한** 경우입니다. (DNS 일반 트러블슈팅은 별도 편에서 다뤘으니 여기선 레지스트리 호스트 관점만.) 노드에서 직접 확인하세요.

```bash
# 노드에 들어가 레지스트리 도메인 해석 테스트
nslookup <registry-host>
curl -v https://<registry-host>/v2/
```

사내 레지스트리라면 노드 `/etc/hosts`나 사설 DNS 등록 여부, 프라이빗 엔드포인트 라우팅을 점검합니다.

### 원인 5: 노드 디스크 부족

`no space left on device`는 이미지 레이어를 풀 디스크 공간이 없다는 뜻입니다.

```bash
# 어느 노드에 떴는지 확인
kubectl get pod <pod> -n <ns> -o wide

# 노드 디스크 압박 상태 확인
kubectl describe node <node> | grep -A5 Conditions   # DiskPressure 확인
# 노드 접속 후
df -h /var/lib/containerd   # 또는 /var/lib/docker
crictl rmi --prune          # 미사용 이미지 정리
```

## 3단계 흔한 함정과 클라우드 레지스트리

### 함정 1: secret 네임스페이스 불일치

가장 많이 밟는 지뢰입니다. 시크릿을 `default`에만 만들고 앱은 `prod` 네임스페이스에서 도는 경우, 인증은 절대 적용되지 않습니다. **imagePullSecrets는 Pod와 같은 네임스페이스의 시크릿만 참조**하거든요.

```bash
# prod ns에 똑같이 만들어 줘야 함
kubectl create secret docker-registry regcred ... -n prod
```

### 함정 2: `latest` + `imagePullPolicy: Always`의 디버깅 지옥

`latest` 태그에 `Always` 정책을 쓰면, 매 재시작마다 다른 이미지를 받아올 수 있어 "어제는 됐는데 오늘은 안 되는" 재현 불가 장애가 생깁니다. 권장 전략은 **불변 태그(immutable tag)** 입니다.

- ❌ `myapp:latest` + `imagePullPolicy: Always`
- ✅ `myapp:1.4.2` 또는 `myapp:git-a1b2c3d` (커밋/빌드 기반 고정 태그)

불변 태그를 쓰면 `imagePullPolicy: IfNotPresent`로도 안전하고, 캐시 적중률도 올라갑니다.

### 클라우드별 토큰 만료 자동 갱신

매니지드 레지스트리는 토큰이 **만료**됩니다. 어제 잘 되던 인증이 오늘 `unauthorized`로 바뀌면 토큰 만료를 의심하세요.

| 레지스트리 | 인증 명령 | 만료/권장 |
|---|---|---|
| AWS ECR | `aws ecr get-login-password \| docker login ...` | 토큰 12시간 만료 → **IRSA**로 노드/Pod에 IAM 부여가 정석. 부득이하면 CronJob이 시크릿 재생성 |
| GCP GCR/AR | `gcloud auth configure-docker` | Workload Identity 권장, 토큰 단기 |
| Azure ACR | `az acr login --name <registry>` | AAD 토큰 단기 → AKS는 `--attach-acr`로 자동 인증 |

ECR을 정적 시크릿(`regcred`)으로 쓰면 12시간 뒤 무조건 깨집니다. 가능하면 **IRSA / Workload Identity**로 키 없는 인증을 구성하고, 그게 어렵다면 토큰 갱신 CronJob을 두세요.

```yaml
# ECR 토큰 갱신 CronJob 핵심 로직 (11시간마다)
schedule: "0 */11 * * *"
# 컨테이너 command 예시
# kubectl delete secret regcred -n app --ignore-not-found
# kubectl create secret docker-registry regcred \
#   --docker-server=<acct>.dkr.ecr.<region>.amazonaws.com \
#   --docker-username=AWS \
#   --docker-password=$(aws ecr get-login-password --region <region>) -n app
```

## 결론: 재발 방지 체크리스트

- ✅ 첫 액션은 무조건 `kubectl describe pod | grep -A10 Events`
- ✅ 시크릿은 **앱과 같은 네임스페이스**에 생성, ServiceAccount에 붙여 전파
- ✅ `latest` 금지, **불변 태그 + IfNotPresent** 표준화
- ✅ Docker Hub 직접 풀 대신 **인증 계정 + 풀스루 캐시**
- ✅ ECR/AR/ACR은 **IRSA/Workload Identity** 우선, 정적 시크릿이면 갱신 자동화

다음 **18편**에서는 이미지를 잘 받아와 컨테이너는 떴는데 `CrashLoopBackOff`로 무한 재시작하는 단계 — 로그·exit code·probe로 원인을 가르는 법을 다룹니다.


## 참고: 공식 문서

이 글에서 다루는 동작·설정·에러의 1차 출처는 다음 공식 문서입니다. 버전별 옵션과 정확한 동작은 여기서 확인하세요.

- [Kubernetes 공식 문서](https://kubernetes.io/docs/home/)

## 자주 묻는 질문 (FAQ)

**Q. ImagePullBackOff와 ErrImagePull, 뭐가 더 심각한 건가요?**
A. 심각도 차이가 아니라 진행 단계 차이입니다. ErrImagePull은 풀 실패 직후, ImagePullBackOff는 실패가 반복돼 재시도 대기 중인 상태예요. 원인과 해결법은 완전히 동일하니 곧장 Events 메시지를 확인하면 됩니다.

**Q. imagePullSecrets를 분명히 만들었는데 계속 unauthorized가 떠요.**
A. 십중팔구 네임스페이스 불일치입니다. 시크릿은 Pod와 같은 네임스페이스에 있어야 참조됩니다. `kubectl get secret regcred -n <앱-네임스페이스>`로 존재를 확인하고, ECR이라면 토큰 12시간 만료도 함께 의심하세요.

**Q. Docker Hub toomanyrequests, 인증만 붙이면 끝인가요?**
A. 급한 상황은 인증 계정으로 완화되지만, CI와 운영이 같은 출구 IP를 공유하면 재발합니다. Harbor proxy cache나 ECR pull-through cache 같은 미러를 두고 이미지 경로를 캐시로 돌리는 것이 근본 해결책입니다.

## 출처 · 확인일 2026-10-04
- [Docker Docs, Docker Hub usage and limits](https://docs.docker.com/docker-hub/usage/) — 플랜별 pull 한도(6시간 기준)

한도는 Docker 정책에 따라 바뀔 수 있으니 운영 설정 전에 위 문서를 다시 확인하세요.$sr$, content_evidence=jsonb_set($j${"en": {"title": "Fix ImagePullBackOff · ErrImagePull: Diagnose the Cause from Events and Finish with Copy-Paste", "content": "# Fix ImagePullBackOff · ErrImagePull: Diagnose the Cause from Events Messages and Finish with Copy-Paste\n\n> K8s_Troubleshooting_Guide Part 17\n\nIf the deploy pipeline is green but the Pod is stuck on `ImagePullBackOff` again, you've already cleared PVCs and network policies. You're blocked at the next step: **kubelet pulling the image from the registry**. This post focuses on that one step. The goal is to look at a **single Events line** from `kubectl describe pod`, pinpoint which of five causes it is, and recover in five minutes with copy-paste commands for each cause.\n\n## ImagePullBackOff vs ErrImagePull: They're the Same Problem\n\nLet's clear up these two confusing statuses first. They aren't separate problems — they're **stages of the same failure**.\n\n- **ErrImagePull**: The state right after kubelet first tries to pull the image and fails\n- **ImagePullBackOff**: Failures have repeated, so kubelet is waiting while exponentially increasing the retry interval (back-off)\n\nIn other words, `ErrImagePull` shows up briefly, then hardens into `ImagePullBackOff`. Both have the **same root cause and the same diagnostic method**. Don't obsess over the status name — go straight to Events.\n\n## Step 1: Diagnosis — How to Read Events Messages\n\n90% of causes are written in the last Events line. These two commands are enough.\n\n```bash\n# 최신순으로 이벤트 모아보기\nkubectl get events --sort-by=.lastTimestamp -n <namespace>\n\n# 특정 Pod의 Events만 빠르게 추출\nkubectl describe pod <pod> -n <namespace> | grep -A10 Events\n```\n\nMatch the message text on the `Warning  Failed` line against the diagnosis table below, as-is.\n\n### Cause Diagnosis Table\n\n| Events message (key phrase) | Cause | Fix section |\n|---|---|---|\n| `Failed to pull image ... not found` / `manifest unknown` | Wrong tag / tag does not exist | → [Wrong tag](#cause-1-wrong-tag-or-missing-tag) |\n| `unauthorized: authentication required` / `pull access denied` | Missing auth (private registry) | → [Missing auth](#cause-2-missing-auth--imagepullsecrets) |\n| `toomanyrequests: You have reached your pull rate limit` | Docker Hub rate limit | → [rate limit](#cause-3-docker-hub-rate-limit) |\n| `dial tcp: lookup ... no such host` / `i/o timeout` | Registry host resolution / reachability failure | → [Host resolution](#cause-4-registry-host-resolution-failure) |\n| `failed to ... no space left on device` | Node disk full | → [Disk](#cause-5-node-disk-full) |\n\nWith this one table, it's \"see the message, go here.\"\n\n## Step 2: Fixes — Copy-Paste Commands by Cause\n\n### Cause 1: Wrong Tag or Missing Tag\n\nIf you see `not found`, it's the most common — and most anticlimactic — cause. First check whether that tag actually exists in the registry.\n\n```bash\n# 매니페스트에 박힌 이미지 문자열 확인\nkubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].image}'\n\n# 로컬에서 동일 태그 풀 가능 여부 테스트\ndocker pull <registry>/<image>:<tag>\n```\n\nIf it was a typo, replace it with `kubectl set image deployment/<deploy> <container>=<image>:<correct-tag>` and you're done.\n\n### Cause 2: Missing Auth — imagePullSecrets\n\nIf you see `unauthorized`, you don't have credentials. Create a secret and attach it to the Pod.\n\n```bash\n# 1) 레지스트리 로그인이 되는지 먼저 확인\ndocker login <registry>\n\n# 2) docker-registry 타입 시크릿 생성 (반드시 앱과 같은 네임스페이스에!)\nkubectl create secret docker-registry regcred \\\n  --docker-server=<registry> \\\n  --docker-username=<user> \\\n  --docker-password=<password> \\\n  --docker-email=<email> \\\n  -n <namespace>\n```\n\nAttach the secret to the Pod (or the Deployment's podTemplate).\n\n```yaml\nspec:\n  imagePullSecrets:\n    - name: regcred\n  containers:\n    - name: app\n      image: <registry>/<image>:<tag>\n```\n\nIf you don't want to add it to every workload, attach it once to the [ServiceAccount](/blog/k8s-forbidden-오류-rbac부터-serviceaccount까지-5단계로-완벽-진단하는-방법) and apply it across the namespace.\n\n```bash\nkubectl patch serviceaccount default -n <namespace> \\\n  -p '{\"imagePullSecrets\":[{\"name\":\"regcred\"}]}'\n```\n\n### Cause 3: Docker Hub Rate Limit\n\nDocker Hub limits image pulls per 6-hour window. Per the official docs (checked 2026-10-04), unauthenticated users get 100 pulls per IPv4 address or IPv6 /64 subnet per 6 hours, authenticated Personal accounts get 200, and Pro, Team, and Business plans are unlimited. Going over the limit returns `toomanyrequests`. Because the unauthenticated limit is per IP, clusters and CI runners behind the same NAT IP share it and get hit especially hard. There are two ways to respond.\n\n**(A) Pull with an authenticated account** — Once authenticated, the limit applies per account instead of per IP (Personal: 200 per 6 hours; paid plans: unlimited). Create the `regcred` above with a Docker Hub account and attach it to the ServiceAccount for immediate relief.\n\n**(B) Switch to a mirror / pull-through cache** — This is the real fix. Stand up a Harbor proxy cache or ECR pull-through cache and change only the image path.\n\n```yaml\n# 기존: nginx:1.27  (Docker Hub 직접)\n# 변경: <account>.dkr.ecr.<region>.amazonaws.com/dockerhub/library/nginx:1.27\nimage: harbor.mycorp.com/dockerhub-proxy/library/nginx:1.27\n```\n\n> War story: On one cluster, a nightly batch spun up dozens of Pods at once and they all died with `toomanyrequests`. Attaching an authenticated account put out the fire, but recurrence only stopped after we installed a Harbor proxy cache. If CI and production share the same egress IP, a cache isn't optional — it's required.\n\n### Cause 4: Registry Host Resolution Failure\n\n`lookup ... no such host` means kubelet **could not resolve the registry domain via DNS**. (General DNS troubleshooting is covered in a separate post, so here we only look at it from the registry-host angle.) Check directly on the node.\n\n```bash\n# 노드에 들어가 레지스트리 도메인 해석 테스트\nnslookup <registry-host>\ncurl -v https://<registry-host>/v2/\n```\n\nFor an internal registry, check whether the node `/etc/hosts` or private DNS has the record, and whether private endpoint routing is in place.\n\n### Cause 5: Node Disk Full\n\n`no space left on device` means there isn't enough disk space to pull image layers.\n\n```bash\n# 어느 노드에 떴는지 확인\nkubectl get pod <pod> -n <ns> -o wide\n\n# 노드 디스크 압박 상태 확인\nkubectl describe node <node> | grep -A5 Conditions   # DiskPressure 확인\n# 노드 접속 후\ndf -h /var/lib/containerd   # 또는 /var/lib/docker\ncrictl rmi --prune          # 미사용 이미지 정리\n```\n\n## Step 3: Common Pitfalls and Cloud Registries\n\n### Pitfall 1: Secret Namespace Mismatch\n\nThis is the landmine people step on most. If you create the secret only in `default` while the app runs in the `prod` namespace, auth will never apply. **imagePullSecrets only reference secrets in the same namespace as the Pod**.\n\n```bash\n# prod ns에 똑같이 만들어 줘야 함\nkubectl create secret docker-registry regcred ... -n prod\n```\n\n### Pitfall 2: The Debugging Hell of `latest` + `imagePullPolicy: Always`\n\nIf you use the `latest` tag with an `Always` policy, every restart can pull a different image, which produces unreproducible failures of the \"it worked yesterday, not today\" kind. The recommended strategy is **immutable tags**.\n\n- ❌ `myapp:latest` + `imagePullPolicy: Always`\n- ✅ `myapp:1.4.2` or `myapp:git-a1b2c3d` (commit/build-based pinned tag)\n\nWith immutable tags, `imagePullPolicy: IfNotPresent` is also safe, and cache hit rates go up.\n\n### Auto-Renewing Expired Tokens per Cloud\n\nManaged registries have tokens that **expire**. If auth that worked yesterday turns into `unauthorized` today, suspect token expiry.\n\n| Registry | Auth command | Expiry / recommendation |\n|---|---|---|\n| AWS ECR | `aws ecr get-login-password \\| docker login ...` | Token expires in 12 hours → the standard is granting IAM to the node/Pod via **IRSA**. If you must, have a CronJob recreate the secret |\n| GCP GCR/AR | `gcloud auth configure-docker` | Workload Identity recommended; tokens are short-lived |\n| Azure ACR | `az acr login --name <registry>` | AAD tokens are short-lived → on AKS, use `--attach-acr` for automatic auth |\n\nIf you use ECR with a static secret (`regcred`), it will always break after 12 hours. Prefer keyless auth with **IRSA / Workload Identity**; if that's hard, add a token-refresh CronJob.\n\n```yaml\n# ECR 토큰 갱신 CronJob 핵심 로직 (11시간마다)\nschedule: \"0 */11 * * *\"\n# 컨테이너 command 예시\n# kubectl delete secret regcred -n app --ignore-not-found\n# kubectl create secret docker-registry regcred \\\n#   --docker-server=<acct>.dkr.ecr.<region>.amazonaws.com \\\n#   --docker-username=AWS \\\n#   --docker-password=$(aws ecr get-login-password --region <region>) -n app\n```\n\n## Conclusion: Recurrence-Prevention Checklist\n\n- ✅ First action is always `kubectl describe pod | grep -A10 Events`\n- ✅ Create the secret in the **same namespace as the app**, attach it to the ServiceAccount to propagate\n- ✅ Ban `latest`; standardize on **immutable tags + IfNotPresent**\n- ✅ Instead of pulling Docker Hub directly, use an **authenticated account + pull-through cache**\n- ✅ For ECR/AR/ACR, prefer **IRSA/Workload Identity**; if you use a static secret, automate refresh\n\nIn **Part 18**, we cover the next stage: the image pulled fine and the container started, but it infinitely restarts with `CrashLoopBackOff` — how to split the cause using logs, exit codes, and probes.\n\n## References: Official Docs\n\nThe primary sources for the behavior, settings, and errors covered in this post are the official docs below. Check them for version-specific options and exact behavior.\n\n- [Kubernetes official documentation](https://kubernetes.io/docs/home/)\n\n## FAQ\n\n**Q. Which is more serious, ImagePullBackOff or ErrImagePull?**\nA. It's not a difference in severity — it's a difference in stage. ErrImagePull is immediately after a pull failure; ImagePullBackOff is waiting to retry after repeated failures. Cause and fix are identical, so go straight to the Events message.\n\n**Q. I definitely created imagePullSecrets, but I still get unauthorized.**\nA. Nine times out of ten it's a namespace mismatch. The secret must be in the same namespace as the Pod to be referenced. Confirm it exists with `kubectl get secret regcred -n <app-namespace>`, and if you're on ECR, also suspect the 12-hour token expiry.\n\n**Q. Docker Hub toomanyrequests — is attaching auth enough?**\nA. Auth accounts will ease an urgent situation, but if CI and production share the same egress IP, it will come back. The real fix is to put a mirror in front — Harbor proxy cache or ECR pull-through cache — and point image paths at the cache.\n\n## Sources · checked 2026-10-04\n- [Docker Docs, Docker Hub usage and limits](https://docs.docker.com/docker-hub/usage/) — pull limits by plan (per 6 hours)\n\nLimits can change with Docker’s policy, so re-check this page before changing production settings.", "excerpt": "Pinpoint kubectl ImagePullBackOff and ErrImagePull in five minutes with an Events-message diagnosis table. A hands-on guide that fixes imagePullSecrets namespace issues, private registry auth, Docker Hub rate limits, and ECR token expiry with copy-paste commands."}, "verifiedAt": "2026-10-04", "changeSummary": "\"2024~2025년 들어 익명 pull 한도 강화\" 서술을 Docker 공식 문서의 현재 한도(6시간당 비인증 100회/IP, Personal 200회, 유료 플랜 무제한)로 교체하고 출처·확인일 추가.", "officialSources": ["https://docs.docker.com/docker-hub/usage/"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=743 AND md5(content)='b0a4f07f579e91a09aed5834a974e812' AND md5(content_evidence::text)='66300d5ffc15d0e1684470d852b5711d' AND md5(coalesce(array_to_string(tags,'|'),''))='df14afa2b63d52aa899f5519c578459f';
COMMIT;
