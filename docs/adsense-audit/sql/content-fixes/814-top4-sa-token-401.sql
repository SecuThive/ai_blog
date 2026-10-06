-- top4 refresh 2026-10-06 post #814 쿠버네티스-serviceaccount-토큰-없음401-unauthorized-해결-124
-- KO content + EN content (content_evidence.en.content); adds contentUpdatedAt/changeSummary/officialSources.
-- Guarded by the original KO/EN md5; re-running updates 0 rows. updated_at bumped by trigger; published_at/status/slug/title untouched.
-- original md5: ko=ef2d206f8d85281692dc2c8fb0367931 en=8d0f28f43c108c597421f26d13b3835d  new md5: ko=37688e2881770443f50063c3d33fac61 en=c52c7f0c8de7a5bff70991374a542a11
BEGIN;
UPDATE posts SET
  content = $top4ko$**이 글이 맞는 에러(Pod 안 워크로드 기준):** `open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory`, API 응답 `401 Unauthorized`, `the server has asked for the client to provide credentials`. `403 Forbidden`(`User "system:serviceaccount:..." cannot ...`)이면 인증은 통과한 것이니 [RBAC Forbidden 진단](/blog/k8s-forbidden-오류-rbac부터-serviceaccount까지-5단계로-완벽-진단하는-방법)으로 가세요.

| 원인 | 확인 명령 | 해결 |
|---|---|---|
| 토큰 자동 마운트 꺼짐(SA 또는 Pod) | `kubectl -n <ns> get pod <pod> -o jsonpath='{.spec.automountServiceAccountToken}'` | API를 부르는 Pod에만 `automountServiceAccountToken: true` |
| 앱이 시작할 때 토큰을 한 번만 읽음 | 재시작 직후엔 되다가 일정 시간 뒤 401 | 토큰 파일을 주기적으로 다시 읽기(client-go·Python 공식 클라이언트는 자동) |
| 1.24+에서 SA 토큰 Secret이 안 생김 | `kubectl get secret`에 토큰 Secret 없음 | `kubectl create token <sa> --duration=1h` |
| audience·issuer 불일치(IRSA 토큰 오용 등) | 토큰 `aud` 디코딩(아래 진단 명령 2) | API 호출엔 `/var/run/secrets/kubernetes.io/serviceaccount/token` 사용 |

## 403은 3편, 401·"토큰 파일 없음"은 이번 편입니다

먼저 결론부터 말하면, **401 Unauthorized와 "토큰 파일이 없다"는 RBAC 문제가 아닙니다.** 이 둘은 아예 다른 층위입니다.

- **401 Unauthorized / 토큰 없음** → *인증(authentication)* 실패. "너 누구야?"에 대답을 못 한 상태. RBAC RoleBinding을 아무리 고쳐도 절대 안 고쳐집니다.
- **403 Forbidden** → *인가(authorization)* 실패. 신원은 확인됐는데 권한이 없는 상태. 이건 [K8s RBAC Forbidden 403 진단](/blog/k8s-forbidden-오류-rbac부터-serviceaccount까지-5단계로-완벽-진단하는-방법) 계열의 접근이 필요합니다.

또 하나 경계를 그어둡니다. 기존에 발행한 [kubectl Unauthorized 원인별 3분 진단·복구 런북 (EKS 재발급)](/blog/kubectl-unauthorized-원인별-3분-진단복구-런북-eks-재발급)은 **내 노트북의 kubeconfig 인증**이 깨진 경우를 다룹니다. 이 글은 **Pod 내부에서 돌아가는 워크로드가 API 서버를 호출할 때** 쓰는 ServiceAccount 토큰이 주제입니다. 오퍼레이터, 사이드카, 인그레스 컨트롤러, in-cluster CI 러너처럼 컨테이너 안에서 `rest.InClusterConfig()`를 쓰는 코드가 대상입니다.

이 증상이 2022년 이후 급증한 배경은 명확합니다. Kubernetes 1.24에서 **ServiceAccount에 대한 Secret 자동 생성이 폐지**됐고, 그 이전부터 진행되던 BoundServiceAccountTokenVolume 전환으로 토큰이 **만료되는 단기 자격증명**으로 바뀌었기 때문입니다. 1.23 이하에서 잘 돌던 매니페스트를 1.24+ 클러스터에 그대로 올리면, 특히 `secretName`을 직접 참조하던 파이프라인이 조용히 깨집니다.

## 30초 판정표: 에러 원문 역인덱스

검색창에 친 문자열 그대로 아래 표에서 찾으세요. 각 행의 "점프" 열이 해당 처방 섹션입니다.

| 에러 원문 / 증상 | 1차 원인 갈래 | 점프 |
|---|---|---|
| `open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory` | automount 비활성(SA 또는 Pod 레벨) | [automount 우선순위](#a-automount-우선순위-pod가-sa를-이깁니다) |
| `Unauthorized` (본문 그대로 한 단어) | 토큰이 만료됐거나 앱이 옛 토큰을 캐싱 | [토큰 캐싱](#c-앱이-토큰을-한-번만-읽고-캐싱하는-함정) |
| `the server has asked for the client to provide credentials` | 토큰 자체가 요청에 안 붙음(경로 오인식·빈 파일) | [automount 우선순위](#a-automount-우선순위-pod가-sa를-이깁니다) |
| `token is expired` / `Token has expired` | 토큰 만료(아래 표의 만료 설명 참고) + 앱의 재읽기 미구현 | [토큰 캐싱](#c-앱이-토큰을-한-번만-읽고-캐싱하는-함정) |
| `serviceaccounts "xxx" not found` | SA 미생성 또는 네임스페이스 불일치 | [진단 2줄 컷](#버전별-동작-차이표와-진단-2줄-컷) |
| SA를 만들었는데 `kubectl get secret`에 토큰 Secret이 안 보임 | 1.24+ 정책 변경(자동 생성 폐지) | [장기 토큰이 필요할 때](#d-ci-외부-시스템용-장기-토큰이-필요할-때) |
| 처방 다 했는데 여전히 401 | audience 불일치 / issuer 설정 / 노드 시계 오차 | [그래도 401일 때](#그래도-401일-때-실패-분기-체크리스트) |

## 버전별 동작 차이표와 진단 2줄 컷

이 경우 정답은 **"내 클러스터 마이너 버전부터 확인"**입니다. 같은 YAML이 버전에 따라 전혀 다르게 동작합니다.

| 버전 | 토큰 형태 | 만료 | SA Secret 자동 생성 | 갱신 주체 |
|---|---|---|---|---|
| ~1.20 | Secret 기반 레거시 JWT | 없음(무기한) | O (SA 생성 시 자동) | 없음 |
| 1.21 | projected 바운드 토큰 기본 마운트(BoundServiceAccountTokenVolume beta) | kubelet 요청 3607초, 연장 시 최대 1년(아래) | O | kubelet |
| 1.22~1.23 | 같음(GA) | 같음 | O | kubelet |
| 1.24~1.25 | projected 바운드 토큰 | 같음 | **X** (LegacyServiceAccountTokenNoAutoGeneration beta) — `kubectl create token` 사용 | kubelet |
| 1.26~1.28 | 같음 | 같음 | X (GA). 1.28부터 레거시 토큰 마지막 사용일 라벨 `kubernetes.io/legacy-token-last-used` GA | kubelet |
| 1.29 이상 | 같음 | 같음 | X. 자동 생성된 레거시 토큰 정리(1.29 beta, 1.30 GA) | kubelet + 정리 컨트롤러 |

기능 단계는 [기능 게이트 목록](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates-removed/) 기준이고, 2026년 10월 현재 지원 중인 버전은 1.35·1.36·1.37입니다([Kubernetes Releases](https://kubernetes.io/releases/)).

**만료 시간 주의**: kubelet은 기본 projected 토큰을 `expirationSeconds: 3607`로 요청하지만, kube-apiserver의 `--service-account-extend-token-expiration`(기본값 true)이 켜져 있으면 자동 주입 토큰의 만료가 최대 1년까지 늘어납니다([kube-apiserver 옵션](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/), [Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)). 그래서 기본 설정 클러스터에서 토큰을 디코딩하면 `exp`가 1시간 뒤가 아니라 훨씬 뒤로 보일 수 있습니다. 1시간 만료를 전제로 진단하지 말고 아래 명령으로 실제 `exp`를 확인하세요. 관리형 서비스는 이 플래그 값을 바꿔 둘 수 있으니 공급자 문서도 확인합니다.

**레거시 토큰 정리 범위**: 1.29부터 정리 컨트롤러는 **자동 생성된** 레거시 토큰 Secret(ServiceAccount의 `secrets` 필드가 가리키는 것)만 다룹니다. 기본 1년 동안 쓰이지 않으면 `kubernetes.io/legacy-token-invalid-since` 라벨로 무효 처리하고, 다시 1년이 지나면 삭제합니다([Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)). 사람이 직접 만든 `kubernetes.io/service-account-token` Secret은 정리 대상이 아니지만 만료도 없으므로, 그런 토큰에 기대는 파이프라인은 유출 시 피해가 큽니다.

### 진단 명령 3종 (복붙용)

**1) SA 레벨 automount 설정 확인**

```bash
kubectl -n <ns> get sa <sa-name> -o jsonpath='{.metadata.name}{"  automount="}{.automountServiceAccountToken}{"\n"}'
```

예상 정상 결과: `my-sa  automount=` (비어 있으면 기본값 true라 마운트됨).
`automount=false`가 찍히면 → automount 갈래로 이동.

**2) Pod 안에 토큰 파일이 실제로 있는지 + 만료 시각 디코딩**

```bash
kubectl -n <ns> exec <pod> -- ls -l /var/run/secrets/kubernetes.io/serviceaccount/
kubectl -n <ns> exec <pod> -- cat /var/run/secrets/kubernetes.io/serviceaccount/token \
  | cut -d. -f2 | tr '_-' '/+' \
  | awk '{n=length($0)%4; if(n) $0=$0 substr("==",1,4-n); print}' \
  | base64 -d | jq '.exp, .iat, .aud, .sub'
```

예상 정상 결과: `ca.crt`, `namespace`, `token` 3개 파일이 보이고, JSON에 `exp`(만료 epoch), `aud`(대상 audience. 클러스터의 `--api-audiences`, 미지정 시 issuer 값이며 kubeadm 기본값은 `https://kubernetes.default.svc.cluster.local`, [kubeadm 소스](https://github.com/kubernetes/kubernetes/blob/master/cmd/kubeadm/app/phases/controlplane/manifests.go)), `sub`(`system:serviceaccount:<ns>:<sa>`)가 출력됩니다.

분기:
- `No such file or directory` → automount 비활성. (a) 섹션.
- 파일의 `exp`는 미래인데 앱은 401 → 앱이 갱신 전 토큰을 메모리에 들고 있을 가능성. (c) 섹션.
- 파일 자체의 `exp`가 이미 과거 → kubelet이 토큰을 교체하지 못한 상태. 해당 노드의 kubelet 로그와 노드 시계를 확인합니다.
- `aud`가 `sts.amazonaws.com` 같은 외부 값만 있음 → API 서버용 audience가 아님. 실패 분기 섹션.
- `base64: invalid input`이나 jq 파싱 오류 → 토큰 파일이 비었거나 JWT가 아님. JWT 본문은 패딩 없는 base64url이라 `base64 -d`에 그대로 넣으면 정상 토큰도 실패하므로, 위처럼 `tr`과 패딩 보정을 거칩니다.
- 이미지에 `cat`이 없으면(distroless) `kubectl debug`로 임시 컨테이너를 붙이거나 `kubectl create token`으로 발급 자체를 먼저 확인합니다.

**3) 토큰 발급 자체가 되는지 검증**

```bash
kubectl -n <ns> create token <sa-name> --duration=30m
```

정상이면 `eyJ...`로 시작하는 JWT가 출력됩니다. 여기서 `serviceaccounts "xxx" not found`가 나면 SA 자체가 없거나 네임스페이스를 잘못 본 것이고, 이건 RBAC이 아니라 오브젝트 부재 문제입니다.

## 원인별 처방

### (a) automount 우선순위: Pod가 SA를 이깁니다

이 경우 정답은 **"Pod spec의 설정이 ServiceAccount 설정을 덮어쓴다"**를 기억하는 것입니다. SA에서 켜 뒀어도 Pod에서 껐으면 안 붙습니다.

| SA `automountServiceAccountToken` | Pod spec `automountServiceAccountToken` | 결과 |
|---|---|---|
| 미지정(기본 true) | 미지정 | 마운트됨 ✅ |
| `false` | 미지정 | **마운트 안 됨** ❌ |
| `false` | `true` | 마운트됨 ✅ (Pod가 우선) |
| 미지정 / `true` | `false` | **마운트 안 됨** ❌ (Pod가 우선) |

두 값을 한 번에 보는 명령:

```bash
kubectl -n <ns> get pod <pod> -o jsonpath='{.spec.serviceAccountName}{" podAutomount="}{.spec.automountServiceAccountToken}{"\n"}'
```

흔한 원인은 보안 하드닝(Kyverno/OPA 정책 등)으로 `default` SA의 automount를 일괄로 끈 경우입니다. [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)(restricted 포함)는 이 필드를 검사하지 않으므로, PSS만 켰다고 토큰이 사라지지는 않습니다. 정책은 유지하되, API를 호출해야 하는 워크로드만 Pod 레벨에서 예외 처리하는 방식이 안전합니다.

```yaml
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: true   # 정책으로 SA가 false여도 이 Pod만 예외
```

### (b) projected volume로 만료·audience 직접 제어

이 경우 정답은 **"automount에 맡기지 말고 projected volume을 명시"**입니다. 만료 시간과 audience를 코드가 기대하는 값으로 고정할 수 있습니다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-caller
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: false     # 기본 마운트는 끄고
  containers:
    - name: app
      image: my/app:1.0
      volumeMounts:
        - name: sa-token
          mountPath: /var/run/secrets/tokens
          readOnly: true
  volumes:
    - name: sa-token
      projected:
        sources:
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600      # 최소 600, API 서버 --service-account-max-token-expiration으로 상한이 걸릴 수 있음
              # audience 생략 → API 서버 기본 audience(API 호출용). 다른 수신자용 토큰일 때만 지정
          - configMap:
              name: kube-root-ca.crt       # 기본 마운트를 껐으므로 CA도 직접 넣음
              items:
                - key: ca.crt
                  path: ca.crt
```

`audience`를 생략하면 API 서버 식별자가 기본값이 됩니다([Projected Volumes](https://kubernetes.io/docs/concepts/storage/projected-volumes/)). API 서버의 `--api-audiences`에 없는 값을 넣으면 그 토큰은 API 호출에서 401로 거부됩니다. 또 `rest.InClusterConfig()`는 `/var/run/secrets/kubernetes.io/serviceaccount/`의 `token`·`ca.crt`만 읽으므로([client-go 소스](https://github.com/kubernetes/client-go/blob/master/rest/config.go)), 위처럼 경로를 바꾸면 앱에서 토큰·CA 경로를 직접 지정해야 합니다. 기본 클라이언트를 그대로 쓰려면 mountPath를 `/var/run/secrets/kubernetes.io/serviceaccount`로 두세요.

반대로 `audience`를 지정한 토큰은 그 대상에만 유효합니다. EKS IRSA나 GKE Workload Identity가 바로 이 메커니즘을 씁니다 — 클라우드 STS용 audience 토큰을 별도 경로에 주입하죠. 그래서 **IRSA용 토큰 경로를 API 호출에 재사용하면 401**이 납니다. 두 토큰은 목적이 다릅니다.

### (c) 앱이 토큰을 한 번만 읽고 캐싱하는 함정

이 경우 정답은 **"파일을 주기적으로 다시 읽어라"**입니다. kubelet은 토큰 파일을 만료 전에 갱신해 주지만, 애플리케이션이 프로세스 시작 시 한 번 읽고 메모리에 들고 있으면 갱신본을 영원히 못 봅니다. 결과는 토큰이 실제로 만료되는 시점(직접 지정한 `expirationSeconds`, 자동 주입 토큰은 연장 설정에 따라 최대 1년)에 `Unauthorized` 또는 `token is expired`. kubelet은 토큰이 TTL의 80%를 넘었거나 24시간이 지나면 교체하고, 다시 읽는 것은 애플리케이션 책임입니다([Configure Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)).

- **client-go**: `rest.InClusterConfig()`는 `BearerTokenFile`을 설정하고, 클라이언트가 이 파일을 1분 주기로 다시 읽습니다([client-go 소스](https://github.com/kubernetes/client-go/blob/master/transport/token_source.go)). 이 경우 보통 문제가 없습니다.
- **직접 `os.ReadFile`로 읽어 헤더에 붙이는 코드 / curl 스크립트 / 자체 HTTP 클라이언트**: 갱신을 못 봅니다. 여기가 대부분의 사고 지점입니다.

Go에서 매 요청마다 다시 읽는 최소 패턴:

```go
const tokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type reloadingTransport struct{ base http.RoundTripper }

func (t *reloadingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	b, err := os.ReadFile(tokenPath) // 매 요청 재읽기 (tmpfs라 비용 낮음)
	if err != nil {
		return nil, fmt.Errorf("SA 토큰 읽기 실패: %w", err)
	}
	r := req.Clone(req.Context())
	r.Header.Set("Authorization", "Bearer "+strings.TrimSpace(string(b)))
	return t.base.RoundTrip(r)
}
```

Bash/사이드카에서 호출한다면 변수에 담아두지 말고 매번 `$(cat ...)`로 읽는 것만으로 해결됩니다.

```bash
curl -sS --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  https://kubernetes.default.svc/api/v1/namespaces/default/pods
```

파이썬 공식 `kubernetes` 클라이언트의 `config.load_incluster_config()`는 기본값 `try_refresh_token=True`로 토큰 파일을 1분마다 다시 읽습니다([소스](https://github.com/kubernetes-client/python/blob/master/kubernetes/config/incluster_config.py)). 다만 토큰 문자열을 직접 꺼내 다른 HTTP 클라이언트 헤더에 넣는 코드는 위 Go 예시처럼 매번 다시 읽어야 합니다.

### (d) CI·외부 시스템용 장기 토큰이 필요할 때

이 경우 정답은 **"수동 Secret 대신 `kubectl create token` 주기 갱신"**입니다.

```bash
# CI 파이프라인 스텝마다 짧게 발급 (권장)
TOKEN=$(kubectl -n ci create token ci-runner-sa --duration=1h)
```

| 방식 | 만료 | 유출 시 회수 | 감사 추적 | 권장 |
|---|---|---|---|---|
| `kubectl create token --duration` | 지정한 짧은 기간 | 만료로 자연 소멸 | 발급 이벤트 남음 | ✅ |
| 수동 `kubernetes.io/service-account-token` Secret | 사실상 무기한 | Secret 삭제로 즉시 회수 | 사용 추적 어려움 | ⚠️ 최후 수단 |
| 클라우드 워크로드 아이덴티티(IRSA/Pod Identity/GKE WI) | 단기 자동 갱신 | IAM 정책으로 통제 | 클라우드 감사로그 | ✅ (클라우드 한정) |

`--duration`은 API 서버의 `--service-account-max-token-expiration` 설정에 의해 상한이 걸릴 수 있습니다. 요청한 값보다 짧게 발급될 수 있으니 발급 후 `exp`를 디코딩해 실제 값을 확인하세요.

수동 Secret이 정말 불가피하다면(예: 토큰 갱신을 지원하지 않는 레거시 외부 시스템) 최소 권한 전용 SA를 별도로 만들고, 만료가 없다는 점을 리스크 등록부에 명시하고, 정기 로테이션 일정을 잡아두는 것이 최소한의 방어선입니다.

## 보안 관점: 끄기, 회수, 추적

**끄기.** `default` SA의 automount를 끄는 것은 좋은 기본값입니다. API를 호출하지 않는 대다수 워크로드에 자격증명을 뿌리지 않게 되니까요.

```bash
kubectl -n <ns> patch serviceaccount default -p '{"automountServiceAccountToken": false}'
```

파급 효과: 이 네임스페이스에서 `default` SA를 쓰면서 API를 호출하던 워크로드가 즉시 깨집니다. 적용 전에 해당 네임스페이스의 Pod들이 어떤 SA를 쓰는지 훑어보세요.

```bash
kubectl -n <ns> get pods -o custom-columns='POD:.metadata.name,SA:.spec.serviceAccountName'
```

**회수.** 여기가 중요합니다 — **바운드 토큰은 개별 무효화가 안 됩니다.**

| 토큰 유형 | 유출 시 회수 방법 |
|---|---|
| projected 바운드 토큰 | 토큰별 취소 API는 없음. 토큰이 묶인 **Pod를 삭제**하면 그 토큰은 무효가 됩니다. **SA 삭제·재생성**은 그 SA의 모든 토큰을 무효화하며, 이 SA를 쓰는 Pod 전부 재시작이 필요합니다. 만료를 기다리는 방법은 위 연장 설정 때문에 최대 1년일 수 있습니다 |
| 레거시 Secret 토큰 | 해당 Secret 삭제 → 즉시 무효 |
| 노드에 바인딩된 토큰 | 해당 Pod/노드 삭제 시 자동 무효화(바인딩 대상 소멸) |

바운드 토큰은 `.spec.boundObjectRef`로 Pod에 묶이기 때문에, Pod가 사라지면 토큰도 유효성을 잃습니다. 사고 대응 시 "Pod 삭제"가 곧 부분적 회수 조치가 되는 셈입니다.

**추적.** 감사로그(audit log)에서 특정 SA의 사용 이력을 뽑는 쿼리 패턴:

```bash
# 감사로그 JSON 라인에서 특정 SA의 호출만 추출
jq -c 'select(.user.username == "system:serviceaccount:prod:my-operator-sa")
       | {ts: .requestReceivedTimestamp, verb, uri: .requestURI, ip: .sourceIPs[0], code: .responseStatus.code}' \
  audit.log | head -50
```

`responseStatus.code`가 401이면 인증 실패, 403이면 인가 실패 — 로그 한 줄에서 이번 글의 주제인지 3편의 주제인지 바로 갈립니다. 예상치 못한 `sourceIPs`가 보이면 토큰 유출을 의심할 근거가 됩니다.

## 그래도 401일 때: 실패 분기 체크리스트

위 처방을 다 했는데도 401이면 순서대로 확인하세요.

1. **audience 불일치.** 토큰의 `aud`가 API 서버가 허용하는 값인지 확인합니다. `kubectl create token <sa> | cut -d. -f2 | tr '_-' '/+' | awk '{n=length($0)%4; if(n) $0=$0 substr("==",1,4-n); print}' | base64 -d | jq .aud`로 기본 audience를 확인하고, Pod의 토큰과 비교하세요. IRSA/Workload Identity를 쓰는 클러스터에서 클라우드용 토큰을 API 호출에 잘못 쓰는 사례가 흔합니다.
2. **API 서버 설정.** `--service-account-issuer`, `--api-audiences`, `--service-account-key-file` 값이 발급/검증 양쪽에서 일관적인지 봅니다. 관리형 클러스터(EKS/GKE/AKS)는 직접 수정 불가이므로, 이 단계에서 이상하면 클라우드 공식 문서 확인이 필요합니다.
3. **노드 시계 오차.** `iat`/`nbf`가 미래로 잡히면 API 서버가 거부합니다. `kubectl exec <pod> -- date -u`와 컨트롤 플레인 시각을 비교하고, 노드의 NTP(chronyd/systemd-timesyncd) 동기화 상태를 확인하세요. 수 분 단위 오차만으로도 재현됩니다.
4. **인증 웹훅/프록시.** 사내 인증 프록시나 서비스 메시가 `Authorization` 헤더를 덮어쓰거나 제거하는지 확인합니다. mTLS 사이드카가 헤더를 재작성하는 구성에서 종종 발생합니다.
5. **토큰 파일 개행/공백.** 셸로 조립한 헤더에서 개행이 섞이면 헤더가 깨집니다. `tr -d '\n'` 또는 `TrimSpace`를 반드시 넣으세요.

### 재발 방지

- 배포 템플릿에 `automountServiceAccountToken`을 **명시적으로** 적어 기본값 변화에 흔들리지 않게 합니다.
- API를 호출하는 앱은 "토큰 재읽기" 여부를 코드리뷰 체크리스트에 넣습니다.
- 스테이징에서 `expirationSeconds: 600` 같은 짧은 만료로 돌려 만료 처리 버그를 조기에 노출시킵니다.
- 클러스터 업그레이드 전, 수동 SA 토큰 Secret과 `secretName` 참조를 전수 조사합니다.

```bash
kubectl get secrets -A --field-selector type=kubernetes.io/service-account-token
```

여기에 결과가 나온다면 1.24+ 환경에서 레거시 방식에 의존 중이라는 뜻입니다. 마이그레이션 대상 목록으로 삼으세요.

## 자주 묻는 질문 (FAQ)

**Q1. 1.24로 올렸더니 SA를 만들어도 Secret이 안 생깁니다. 버그인가요?**
버그가 아니라 의도된 변경입니다. 1.24부터 ServiceAccount 생성 시 토큰 Secret을 자동 생성하지 않습니다. 토큰이 필요하면 `kubectl create token <sa>`로 단기 토큰을 발급하거나, Pod에서는 projected volume(기본 automount)을 사용하세요.

**Q2. 401과 403 중 어느 쪽인지 로그만 보고 구분하는 방법은?**
HTTP 상태 코드로 갈립니다. 401은 "누군지 모르겠다"(토큰 없음·만료·서명 검증 실패), 403은 "누군지는 알겠는데 권한이 없다"입니다. 403 메시지에는 보통 `User "system:serviceaccount:ns:sa" cannot list resource ...`처럼 신원이 찍혀 있습니다. 신원이 찍혔으면 인증은 성공한 것이므로 RBAC을 보면 됩니다.

**Q3. 토큰이 주기적으로 바뀌는데 그때마다 앱을 재시작해야 하나요?**
아닙니다. kubelet이 만료 전에 토큰 파일을 갱신합니다. 앱이 파일을 다시 읽기만 하면 됩니다. 재시작이 필요한 상황이라면 그건 캐싱 버그이므로, 위의 재읽기 패턴을 적용하는 것이 정답입니다.

**Q4. `expirationSeconds`를 아주 길게(예: 1년) 설정할 수 있나요?**
요청은 할 수 있지만 API 서버 정책 상한에 의해 잘릴 수 있고, 보안상 권장되지 않습니다. 단기 자격증명이 제로트러스트 모델의 기본 전제이기 때문입니다. 장기 자격증명이 정말 필요한 외부 연동이라면 토큰 대신 클라우드 워크로드 아이덴티티나 주기적 재발급 파이프라인을 쓰는 편이 낫습니다.

**Q5. 토큰이 유출됐습니다. 즉시 무효화할 방법이 있나요?**
바운드 토큰은 개별 취소 API가 없습니다. 현실적인 선택지는 (1) 해당 SA를 삭제 후 재생성해 기존 토큰 전부를 무효화하고 관련 Pod를 재시작하거나, (2) 토큰이 Pod에 바인딩돼 있다면 그 Pod를 삭제하거나, (3) 만료를 기다리는 것입니다(자동 주입 토큰은 연장 설정 때문에 최대 1년일 수 있습니다). 레거시 Secret 토큰이라면 Secret을 지우면 즉시 회수됩니다. 병행해서 감사로그로 유출 기간 동안의 호출 이력을 반드시 확인하세요.

**Q6. `default` SA의 automount를 끄면 어떤 게 깨지나요?**
그 네임스페이스에서 `default` SA를 쓰면서 API 서버를 호출하던 모든 Pod가 토큰 파일을 잃습니다. 대표적으로 일부 모니터링 에이전트, 서비스 디스커버리를 하는 앱, 자체 리더 선출 로직을 가진 앱이 영향을 받습니다. 적용 전에 네임스페이스의 Pod-SA 매핑을 조회하고, 필요한 Pod에는 Pod 레벨 `automountServiceAccountToken: true`로 예외를 주세요.

**Q7. EKS에서 IRSA를 쓰는데 API 서버 호출이 401입니다.**
IRSA가 주입하는 토큰(`AWS_WEB_IDENTITY_TOKEN_FILE`)은 audience가 `sts.amazonaws.com`으로, AWS STS 전용입니다. Kubernetes API 호출에는 `/var/run/secrets/kubernetes.io/serviceaccount/token`을 써야 합니다. 두 경로를 혼동하지 않았는지 먼저 확인하세요.

---

다음 5편에서는 **네트워크 레벨 차단 — NetworkPolicy와 mTLS 실패 진단**을 다룹니다. 인증도 인가도 통과했는데 연결 자체가 막히는 경우, `connection refused`와 `i/o timeout`을 어떻게 갈라내고 정책 규칙을 역추적할지 같은 방식의 판정표로 정리하겠습니다.$top4ko$,
  content_evidence = jsonb_set(content_evidence, '{en,content}', to_jsonb($top4en$**Errors this covers (workloads inside a Pod):** `open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory`, an API response of `401 Unauthorized`, or `the server has asked for the client to provide credentials`. If you get `403 Forbidden` (`User "system:serviceaccount:..." cannot ...`), authentication already succeeded; go to [diagnosing RBAC Forbidden](/blog/k8s-forbidden-오류-rbac부터-serviceaccount까지-5단계로-완벽-진단하는-방법).

| Cause | Check | Fix |
|---|---|---|
| Token automount disabled (SA or Pod) | `kubectl -n <ns> get pod <pod> -o jsonpath='{.spec.automountServiceAccountToken}'` | Set `automountServiceAccountToken: true` only on Pods that call the API |
| App reads the token once at startup | Works right after a restart, then 401 later | Re-read the token file periodically (client-go and the official Python client do this automatically) |
| No SA token Secret on 1.24+ | `kubectl get secret` shows no token Secret | `kubectl create token <sa> --duration=1h` |
| Audience/issuer mismatch (e.g. using the IRSA token) | Decode the token's `aud` (diagnostic command 2 below) | Use `/var/run/secrets/kubernetes.io/serviceaccount/token` for API calls |

## Part 3 is 403; this part is 401 and "token file not found"

Let's start with the conclusion: **401 Unauthorized and "token file not found" are not RBAC problems.** They live on an entirely different layer.

- **401 Unauthorized / missing token** → *authentication* failure. You couldn't answer "who are you?" No amount of RoleBinding fixes will ever resolve this.
- **403 Forbidden** → *authorization* failure. Identity was verified, but you lack permission. That needs the approach in [Diagnosing Kubernetes RBAC Forbidden 403](/blog/k8s-forbidden-오류-rbac부터-serviceaccount까지-5단계로-완벽-진단하는-방법).

One more boundary: the previously published [kubectl Unauthorized: 3-minute diagnosis and recovery runbook (EKS reissue)](/blog/kubectl-unauthorized-원인별-3분-진단복구-런북-eks-재발급) covers **broken kubeconfig authentication on your laptop**. This article is about the ServiceAccount token that **workloads running inside a Pod use when calling the API server**. The audience is code that uses `rest.InClusterConfig()` from inside a container — operators, sidecars, ingress controllers, in-cluster CI runners, and the like.

The reason this symptom exploded after 2022 is clear. Kubernetes 1.24 **stopped auto-creating Secrets for ServiceAccounts**, and the BoundServiceAccountTokenVolume migration that had already been underway turned tokens into **short-lived, expiring credentials**. If you take a manifest that worked on 1.23 or earlier and apply it unchanged to a 1.24+ cluster, pipelines that directly referenced `secretName` fail silently.

## 30-second triage table: reverse index by error text

Find the exact string you typed into the search box in the table below. The "Jump" column on each row points to the matching fix section.

| Error text / symptom | Primary cause | Jump |
|---|---|---|
| `open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory` | automount disabled (SA or Pod level) | [automount precedence](#a-automount-precedence-the-pod-wins-over-the-sa) |
| `Unauthorized` (the single word, as-is in the body) | Token expired, or the app is caching an old token | [token caching](#c-the-trap-of-reading-the-token-once-and-caching-it) |
| `the server has asked for the client to provide credentials` | Token never attached to the request (wrong path or empty file) | [automount precedence](#a-automount-precedence-the-pod-wins-over-the-sa) |
| `token is expired` / `Token has expired` | Token expired (see the expiry note below the version table) + the app never re-reads it | [token caching](#c-the-trap-of-reading-the-token-once-and-caching-it) |
| `serviceaccounts "xxx" not found` | SA never created, or namespace mismatch | [two-line diagnostic cut](#version-behavior-differences-and-a-two-line-diagnostic-cut) |
| You created an SA but `kubectl get secret` shows no token Secret | Policy change in 1.24+ (auto-creation removed) | [when you need a long-lived token](#d-when-you-need-a-long-lived-token-for-ci-or-external-systems) |
| You applied every fix and still get 401 | Audience mismatch / issuer config / node clock skew | [still getting 401](#still-getting-401-failure-branch-checklist) |

## Version behavior differences and a two-line diagnostic cut

The answer here is **"start by checking your cluster's minor version."** The same YAML behaves completely differently depending on the version.

| Version | Token form | Expiry | SA Secret auto-creation | Who renews |
|---|---|---|---|---|
| ~1.20 | Secret-based legacy JWT | None (never expires) | Yes (automatic on SA creation) | None |
| 1.21 | Projected bound token mounted by default (BoundServiceAccountTokenVolume beta) | kubelet requests 3607 s; up to 1 year when extended (see below) | Yes | kubelet |
| 1.22~1.23 | Same (GA) | Same | Yes | kubelet |
| 1.24~1.25 | Projected bound token | Same | **No** (LegacyServiceAccountTokenNoAutoGeneration beta) — use `kubectl create token` | kubelet |
| 1.26~1.28 | Same | Same | No (GA). From 1.28 the legacy-token last-used label `kubernetes.io/legacy-token-last-used` is GA | kubelet |
| 1.29+ | Same | Same | No. Cleanup of auto-generated legacy tokens (1.29 beta, 1.30 GA) | kubelet + cleanup controller |

Feature stages follow the [feature gate list](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates-removed/); as of October 2026 the supported releases are 1.35, 1.36, and 1.37 ([Kubernetes Releases](https://kubernetes.io/releases/)).

**Watch the expiry**: kubelet requests the default projected token with `expirationSeconds: 3607`, but when kube-apiserver's `--service-account-extend-token-expiration` (default true) is on, admission-injected tokens are extended up to 1 year ([kube-apiserver options](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/), [Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)). So on a cluster with default settings, a decoded token's `exp` may be far later than one hour. Don't diagnose on the assumption of a 1-hour expiry; check the real `exp` with the command below. Managed services may change this flag, so check your provider's docs too.

**What the legacy cleanup covers**: from 1.29 the cleanup controller only handles **auto-generated** legacy token Secrets (the ones referenced from the ServiceAccount's `secrets` field). If unused for one year by default, they are labeled `kubernetes.io/legacy-token-invalid-since` and invalidated, then deleted after another year ([Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)). Hand-made `kubernetes.io/service-account-token` Secrets are not cleaned up, but they never expire either, so pipelines that rely on them take a large hit if one leaks.

### Three diagnostic commands (copy-paste ready)

**1) Check SA-level automount settings**

```bash
kubectl -n <ns> get sa <sa-name> -o jsonpath='{.metadata.name}{"  automount="}{.automountServiceAccountToken}{"\n"}'
```

Expected healthy result: `my-sa  automount=` (empty means the default of true, so it is mounted).
If you see `automount=false` → go to the automount branch.

**2) Confirm the token file actually exists inside the Pod, and decode the expiry**

```bash
kubectl -n <ns> exec <pod> -- ls -l /var/run/secrets/kubernetes.io/serviceaccount/
kubectl -n <ns> exec <pod> -- cat /var/run/secrets/kubernetes.io/serviceaccount/token \
  | cut -d. -f2 | tr '_-' '/+' \
  | awk '{n=length($0)%4; if(n) $0=$0 substr("==",1,4-n); print}' \
  | base64 -d | jq '.exp, .iat, .aud, .sub'
```

Expected healthy result: you see the three files `ca.crt`, `namespace`, and `token`, and the JSON prints `exp` (expiry epoch), `aud` (audience: the cluster's `--api-audiences`, or the issuer if unset; the kubeadm default is `https://kubernetes.default.svc.cluster.local`, [kubeadm source](https://github.com/kubernetes/kubernetes/blob/master/cmd/kubeadm/app/phases/controlplane/manifests.go)), and `sub` (`system:serviceaccount:<ns>:<sa>`).

Branches:
- `No such file or directory` → automount is disabled. Section (a).
- The file's `exp` is in the future but the app gets 401 → the app is likely holding a pre-rotation token in memory. Section (c).
- The file's own `exp` is already in the past → kubelet failed to rotate the token. Check that node's kubelet logs and clock.
- `aud` contains only an external value like `sts.amazonaws.com` → this is not an API-server audience. See the failure-branch section.
- `base64: invalid input` or a jq parse error → the token file is empty or not a JWT. The JWT payload is unpadded base64url, so feeding it straight to `base64 -d` fails even for a valid token; that's why the command above runs `tr` and adds padding.
- If the image has no `cat` (distroless), attach an ephemeral container with `kubectl debug`, or first confirm issuance with `kubectl create token`.

**3) Verify that token issuance itself works**

```bash
kubectl -n <ns> create token <sa-name> --duration=30m
```

If healthy, you get a JWT starting with `eyJ...`. If you get `serviceaccounts "xxx" not found`, the SA itself is missing or you looked at the wrong namespace — that's a missing-object problem, not RBAC.

## Fixes by cause

### (a) automount precedence: the Pod wins over the SA

The answer here is to remember that **"the Pod spec overrides the ServiceAccount setting."** Even if you turned it on at the SA, it will not be mounted if the Pod turned it off.

| SA `automountServiceAccountToken` | Pod spec `automountServiceAccountToken` | Result |
|---|---|---|
| Unspecified (default true) | Unspecified | Mounted ✅ |
| `false` | Unspecified | **Not mounted** ❌ |
| `false` | `true` | Mounted ✅ (Pod wins) |
| Unspecified / `true` | `false` | **Not mounted** ❌ (Pod wins) |

Command to see both values at once:

```bash
kubectl -n <ns> get pod <pod> -o jsonpath='{.spec.serviceAccountName}{" podAutomount="}{.spec.automountServiceAccountToken}{"\n"}'
```

A common cause is security hardening (Kyverno/OPA policies and the like) that bulk-disables automount on the `default` SA. [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) (including restricted) do not check this field, so enabling PSS alone does not remove the token. Keep the policy, but carve out a Pod-level exception only for workloads that actually need to call the API.

```yaml
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: true   # exception for this Pod even if policy sets the SA to false
```

### (b) Control expiry and audience directly with a projected volume

The answer here is **"don't rely on automount — declare a projected volume."** You can pin expiry and audience to the values your code expects.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-caller
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: false     # turn off the default mount
  containers:
    - name: app
      image: my/app:1.0
      volumeMounts:
        - name: sa-token
          mountPath: /var/run/secrets/tokens
          readOnly: true
  volumes:
    - name: sa-token
      projected:
        sources:
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600      # min 600; may be capped by the API server's --service-account-max-token-expiration
              # audience omitted → the API server's default audience (for API calls). Set it only for other recipients
          - configMap:
              name: kube-root-ca.crt       # default mount is off, so add the CA as well
              items:
                - key: ca.crt
                  path: ca.crt
```

If you omit `audience`, it defaults to the API server's identifier ([Projected Volumes](https://kubernetes.io/docs/concepts/storage/projected-volumes/)). A value that is not in the API server's `--api-audiences` makes the token fail API calls with 401. Also, `rest.InClusterConfig()` only reads `token` and `ca.crt` from `/var/run/secrets/kubernetes.io/serviceaccount/` ([client-go source](https://github.com/kubernetes/client-go/blob/master/rest/config.go)), so if you move the path as above, the app must point to the token and CA paths itself. To keep using the default client unchanged, set mountPath to `/var/run/secrets/kubernetes.io/serviceaccount`.

Conversely, a token with `audience` set is valid only for that audience. EKS IRSA and GKE Workload Identity use exactly this mechanism — they inject a cloud-STS audience token at a separate path. That's why **reusing the IRSA token path for API calls produces 401**. The two tokens serve different purposes.

### (c) The trap of reading the token once and caching it

The answer here is **"re-read the file periodically."** kubelet renews the token file before it expires, but if the application reads it once at process start and holds it in memory, it will never see the renewed copy. The result is `Unauthorized` or `token is expired` when the token actually expires (the `expirationSeconds` you set, or up to 1 year for admission-injected tokens when extension is on). kubelet rotates the token once it is older than 80% of its TTL or 24 hours, and reloading it is the application's job ([Configure Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)).

- **client-go**: `rest.InClusterConfig()` sets `BearerTokenFile`, and the client re-reads that file every minute ([client-go source](https://github.com/kubernetes/client-go/blob/master/transport/token_source.go)). This path is usually fine.
- **Code that `os.ReadFile`s once and stuffs it into a header / curl scripts / homegrown HTTP clients**: they never see the renewal. This is where most incidents happen.

Minimal Go pattern that re-reads on every request:

```go
const tokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type reloadingTransport struct{ base http.RoundTripper }

func (t *reloadingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	b, err := os.ReadFile(tokenPath) // re-read on every request (cheap: it's tmpfs)
	if err != nil {
		return nil, fmt.Errorf("reading SA token: %w", err)
	}
	r := req.Clone(req.Context())
	r.Header.Set("Authorization", "Bearer "+strings.TrimSpace(string(b)))
	return t.base.RoundTrip(r)
}
```

If you call from Bash or a sidecar, don't stash the token in a variable — just `$(cat ...)` every time and you're done.

```bash
curl -sS --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  https://kubernetes.default.svc/api/v1/namespaces/default/pods
```

The official Python `kubernetes` client's `config.load_incluster_config()` re-reads the token file every minute by default (`try_refresh_token=True`) ([source](https://github.com/kubernetes-client/python/blob/master/kubernetes/config/incluster_config.py)). Code that pulls the token string out and puts it into another HTTP client's header still has to re-read it each time, as in the Go example.

### (d) When you need a long-lived token for CI or external systems

The answer here is **"periodic `kubectl create token` instead of a hand-made Secret."**

```bash
# issue a short-lived token per CI pipeline step (recommended)
TOKEN=$(kubectl -n ci create token ci-runner-sa --duration=1h)
```

| Method | Expiry | Revocation on leak | Audit trail | Recommended |
|---|---|---|---|---|
| `kubectl create token --duration` | Specified short period | Natural expiry | Issuance event is recorded | ✅ |
| Manual `kubernetes.io/service-account-token` Secret | Effectively never | Immediate via Secret deletion | Hard to track usage | ⚠️ last resort |
| Cloud workload identity (IRSA / Pod Identity / GKE WI) | Short-lived, auto-renewed | Controlled by IAM policy | Cloud audit logs | ✅ (cloud only) |

`--duration` can be capped by the API server's `--service-account-max-token-expiration`. The issued token may be shorter than requested, so decode `exp` after issuance and check the actual value.

If a manual Secret is truly unavoidable (e.g., a legacy external system that cannot refresh tokens), create a dedicated least-privilege SA, record the lack of expiry in your risk register, and put a regular rotation schedule on the calendar. That's the minimum defensive line.

## Security: disable, revoke, track

**Disable.** Turning off automount on the `default` SA is a good default. You stop spraying credentials onto the majority of workloads that never call the API.

```bash
kubectl -n <ns> patch serviceaccount default -p '{"automountServiceAccountToken": false}'
```

Blast radius: any workload in this namespace that uses the `default` SA and calls the API will break immediately. Before applying, scan which SA each Pod in the namespace uses.

```bash
kubectl -n <ns> get pods -o custom-columns='POD:.metadata.name,SA:.spec.serviceAccountName'
```

**Revoke.** This is the important part — **bound tokens cannot be invalidated individually.**

| Token type | How to revoke on leak |
|---|---|
| Projected bound token | No per-token revoke API. **Deleting the Pod** the token is bound to invalidates that token. **Deleting and recreating the SA** invalidates every token for that SA, and all Pods using it must be restarted. Waiting for expiry can take up to 1 year because of the extension setting above |
| Legacy Secret token | Delete the Secret → immediately invalid |
| Node-bound token | Automatically invalid when the Pod/node is deleted (the binding target is gone) |

Bound tokens are tied to a Pod via `.spec.boundObjectRef`, so when the Pod disappears the token loses validity. In incident response, "delete the Pod" is itself a partial revocation action.

**Track.** Query pattern to extract a given SA's usage history from the audit log:

```bash
# extract only one SA's calls from audit-log JSON lines
jq -c 'select(.user.username == "system:serviceaccount:prod:my-operator-sa")
       | {ts: .requestReceivedTimestamp, verb, uri: .requestURI, ip: .sourceIPs[0], code: .responseStatus.code}' \
  audit.log | head -50
```

If `responseStatus.code` is 401 it's an authentication failure; 403 is authorization — one log line tells you whether this article or part 3 applies. Unexpected `sourceIPs` are grounds to suspect a token leak.

## Still getting 401: failure-branch checklist

If you've applied every fix above and still get 401, check these in order.

1. **Audience mismatch.** Confirm the token's `aud` is a value the API server accepts. Check the default audience with `kubectl create token <sa> | cut -d. -f2 | tr '_-' '/+' | awk '{n=length($0)%4; if(n) $0=$0 substr("==",1,4-n); print}' | base64 -d | jq .aud` and compare it to the Pod's token. On clusters using IRSA/Workload Identity, mistakenly using the cloud token for API calls is a common case.
2. **API server flags.** Check that `--service-account-issuer`, `--api-audiences`, and `--service-account-key-file` are consistent on both the issue and verify sides. Managed clusters (EKS/GKE/AKS) cannot be edited directly, so if something looks off at this step you need the cloud vendor's official docs.
3. **Node clock skew.** If `iat`/`nbf` is in the future, the API server rejects the token. Compare `kubectl exec <pod> -- date -u` with control-plane time, and check the node's NTP (chronyd/systemd-timesyncd) sync status. A skew of just a few minutes is enough to reproduce this.
4. **Auth webhook/proxy.** Check whether an in-house auth proxy or service mesh is overwriting or stripping the `Authorization` header. This often shows up in setups where an mTLS sidecar rewrites headers.
5. **Newlines/whitespace in the token file.** If a newline sneaks into a header assembled in the shell, the header breaks. Always use `tr -d '\n'` or `TrimSpace`.

### Preventing recurrence

- Set `automountServiceAccountToken` **explicitly** in deploy templates so default-value changes don't shake you.
- For apps that call the API, put "does it re-read the token?" on the code-review checklist.
- In staging, run with a short expiry like `expirationSeconds: 600` so expiry-handling bugs surface early.
- Before a cluster upgrade, inventory every hand-made SA token Secret and every `secretName` reference.

```bash
kubectl get secrets -A --field-selector type=kubernetes.io/service-account-token
```

If this returns results, you are still depending on the legacy path in a 1.24+ environment. Treat the output as your migration backlog.

## FAQ

**Q1. After upgrading to 1.24, creating an SA no longer creates a Secret. Is this a bug?**
No — it's an intentional change. From 1.24, creating a ServiceAccount no longer auto-creates a token Secret. If you need a token, issue a short-lived one with `kubectl create token <sa>`, or use a projected volume (the default automount) inside the Pod.

**Q2. How do I tell 401 from 403 from logs alone?**
Split on the HTTP status code. 401 is "I don't know who you are" (missing/expired token or signature verification failure); 403 is "I know who you are, but you don't have permission." A 403 message usually includes the identity, like `User "system:serviceaccount:ns:sa" cannot list resource ...`. If the identity is printed, authentication succeeded — look at RBAC.

**Q3. The token changes periodically — do I have to restart the app each time?**
No. kubelet renews the token file before it expires. The app just has to re-read the file. If a restart is required, that's a caching bug — apply the re-read pattern above.

**Q4. Can I set `expirationSeconds` very long (e.g. one year)?**
You can request it, but the API server policy cap may truncate it, and it is not recommended for security. Short-lived credentials are a baseline assumption of a zero-trust model. If an external integration truly needs long-lived credentials, prefer cloud workload identity or a periodic re-issue pipeline over a long-lived token.

**Q5. A token leaked. Can I invalidate it immediately?**
Bound tokens have no per-token cancel API. Realistic options are (1) delete and recreate the SA to invalidate every existing token and restart related Pods, (2) if the token is bound to a Pod, delete that Pod, or (3) wait for expiry (admission-injected tokens can last up to 1 year because of the extension setting). For a legacy Secret token, deleting the Secret revokes it immediately. In parallel, always pull the call history for the leak window from the audit log.

**Q6. What breaks if I turn off automount on the `default` SA?**
Every Pod in that namespace that uses the `default` SA and calls the API server loses its token file. Typical casualties include some monitoring agents, apps that do service discovery, and apps with their own leader-election logic. Before applying, query the namespace's Pod-to-SA mapping and grant a Pod-level `automountServiceAccountToken: true` exception where needed.

**Q7. I'm using IRSA on EKS and API server calls return 401.**
The token IRSA injects (`AWS_WEB_IDENTITY_TOKEN_FILE`) has audience `sts.amazonaws.com` — it is AWS STS only. Kubernetes API calls must use `/var/run/secrets/kubernetes.io/serviceaccount/token`. First check that you didn't mix up the two paths.

---

In part 5 we'll cover **network-level blocking — diagnosing NetworkPolicy and mTLS failures**. When authentication and authorization both pass but the connection itself is blocked, we'll use the same style of lookup table to split `connection refused` from `i/o timeout` and reverse-engineer the policy rules.$top4en$::text))
    || jsonb_build_object('contentUpdatedAt', '2026-10-06', 'changeSummary', $top4s$상단에 에러 원문과 원인→확인 명령→해결 표 추가. 403 링크 오류 수정, 버전표를 기능 게이트 단계·지원 버전(1.35~1.37) 기준으로 정정, --service-account-extend-token-expiration(최대 1년) 반영, base64url JWT 디코딩 명령 수정, projected 예시의 audience·CA·경로 문제 수정, client-go·Python 클라이언트 자동 재읽기 반영.$top4s$::text, 'officialSources', $top4j$[{"label": "Managing Service Accounts", "url": "https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/"}, {"label": "kube-apiserver", "url": "https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/"}, {"label": "Projected Volumes", "url": "https://kubernetes.io/docs/concepts/storage/projected-volumes/"}, {"label": "Configure Service Accounts for Pods", "url": "https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/"}, {"label": "Feature gates (removed)", "url": "https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates-removed/"}, {"label": "Kubernetes Releases", "url": "https://kubernetes.io/releases/"}]$top4j$::jsonb)
WHERE id = 814
  AND md5(content) = 'ef2d206f8d85281692dc2c8fb0367931'
  AND md5(content_evidence->'en'->>'content') = '8d0f28f43c108c597421f26d13b3835d';
COMMIT;
