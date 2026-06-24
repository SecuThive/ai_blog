import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  {
    title: 'Kubernetes Ingress 완전 가이드 — Nginx Ingress Controller로 외부 트래픽 라우팅',
    slug: 'kubernetes-ingress-nginx-controller',
    summary: 'Nginx Ingress Controller를 설치하고 호스트/경로 기반 라우팅, TLS 종료, 리라이트, 인증 등 실전 Ingress 구성을 단계별로 익힙니다.',
    category: 'Docker / 컨테이너',
    tags: ['kubernetes', 'ingress', 'nginx', 'tls', 'routing'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Kubernetes Ingress 란?

Ingress는 클러스터 외부에서 들어오는 HTTP/HTTPS 트래픽을 내부 Service로 라우팅하는 L7 규칙의 집합입니다. Service의 \`type: LoadBalancer\`를 서비스마다 만들면 클라우드 LB가 그만큼 늘어나 비용이 커지지만, Ingress는 단일 진입점에서 호스트명과 경로를 기준으로 여러 Service에 분기할 수 있습니다.

- **Ingress 리소스**: "어떤 호스트/경로를 어떤 Service로 보낼지" 선언만 담음
- **Ingress Controller**: 그 선언을 실제로 처리하는 리버스 프록시(Nginx, HAProxy, Traefik 등)
- Ingress 리소스만 만들고 Controller가 없으면 **아무 일도 일어나지 않습니다.**

> Ingress 객체는 명세(스펙)일 뿐이며, 트래픽을 실제로 처리하려면 반드시 Ingress Controller를 별도로 설치해야 합니다. 이 점을 놓치면 "Ingress를 만들었는데 접속이 안 된다"는 함정에 빠집니다.

---

## Nginx Ingress Controller 설치

가장 널리 쓰이는 \`ingress-nginx\`(쿠버네티스 공식 프로젝트)를 Helm으로 설치합니다.

\`\`\`bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \\
  --namespace ingress-nginx --create-namespace \\
  --set controller.service.type=LoadBalancer \\
  --set controller.metrics.enabled=true
\`\`\`

설치 후 컨트롤러와 외부 IP를 확인합니다.

\`\`\`bash
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx ingress-nginx-controller
# EXTERNAL-IP 가 할당되면 그 IP/도메인으로 트래픽이 들어옵니다
\`\`\`

온프레미스(베어메탈)라면 \`LoadBalancer\` IP가 안 잡히므로 MetalLB를 함께 쓰거나 \`controller.service.type=NodePort\`로 설치합니다.

### IngressClass 확인

최신 쿠버네티스에서는 어떤 컨트롤러가 Ingress를 처리할지 \`ingressClassName\`으로 지정합니다.

\`\`\`bash
kubectl get ingressclass
# NAME    CONTROLLER             PARAMETERS   AGE
# nginx   k8s.io/ingress-nginx   <none>       2m
\`\`\`

---

## 테스트용 백엔드 배포

라우팅을 검증할 두 개의 데모 서비스를 띄웁니다.

\`\`\`yaml
# apps.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-a
spec:
  replicas: 2
  selector: { matchLabels: { app: web-a } }
  template:
    metadata: { labels: { app: web-a } }
    spec:
      containers:
      - name: web
        image: hashicorp/http-echo
        args: ["-text=Hello from A", "-listen=:8080"]
        ports: [{ containerPort: 8080 }]
---
apiVersion: v1
kind: Service
metadata:
  name: web-a
spec:
  selector: { app: web-a }
  ports: [{ port: 80, targetPort: 8080 }]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-b
spec:
  replicas: 2
  selector: { matchLabels: { app: web-b } }
  template:
    metadata: { labels: { app: web-b } }
    spec:
      containers:
      - name: web
        image: hashicorp/http-echo
        args: ["-text=Hello from B", "-listen=:8080"]
        ports: [{ containerPort: 8080 }]
---
apiVersion: v1
kind: Service
metadata:
  name: web-b
spec:
  selector: { app: web-b }
  ports: [{ port: 80, targetPort: 8080 }]
\`\`\`

\`\`\`bash
kubectl apply -f apps.yaml
\`\`\`

---

## 경로 기반 라우팅

하나의 호스트에서 경로별로 다른 백엔드로 분기합니다.

\`\`\`yaml
# ingress-path.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: demo.example.com
    http:
      paths:
      - path: /a
        pathType: Prefix
        backend:
          service:
            name: web-a
            port: { number: 80 }
      - path: /b
        pathType: Prefix
        backend:
          service:
            name: web-b
            port: { number: 80 }
\`\`\`

\`pathType\`은 다음 세 가지가 있습니다.

| pathType | 의미 |
|----------|------|
| \`Prefix\` | 경로 접두사 매칭 (\`/a\` → \`/a\`, \`/a/x\` 모두 매칭) |
| \`Exact\` | 경로 완전 일치만 매칭 |
| \`ImplementationSpecific\` | 컨트롤러 구현에 위임 (정규식 등) |

\`\`\`bash
kubectl apply -f ingress-path.yaml
# /etc/hosts 또는 DNS 에 demo.example.com → EXTERNAL-IP 매핑 후
curl http://demo.example.com/a   # Hello from A
curl http://demo.example.com/b   # Hello from B
\`\`\`

---

## 호스트(도메인) 기반 가상호스팅

서브도메인별로 다른 서비스를 노출하는 패턴입니다.

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: host-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: a.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend: { service: { name: web-a, port: { number: 80 } } }
  - host: b.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend: { service: { name: web-b, port: { number: 80 } } }
\`\`\`

---

## TLS 종료 (HTTPS)

Ingress에서 TLS를 종료하면 백엔드는 평문 HTTP로 통신하고, 외부에는 HTTPS만 노출됩니다.

### 1) 인증서를 Secret으로 등록

테스트는 자체서명, 운영은 cert-manager + Let's Encrypt를 권장합니다.

\`\`\`bash
# 테스트용 자체서명 인증서
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
  -keyout tls.key -out tls.crt \\
  -subj "/CN=demo.example.com/O=demo"

kubectl create secret tls demo-tls --cert=tls.crt --key=tls.key
\`\`\`

### 2) Ingress에 tls 블록 추가

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tls-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"   # HTTP→HTTPS 강제
spec:
  ingressClassName: nginx
  tls:
  - hosts: [demo.example.com]
    secretName: demo-tls
  rules:
  - host: demo.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend: { service: { name: web-a, port: { number: 80 } } }
\`\`\`

### cert-manager로 자동 갱신 (운영 권장)

\`\`\`bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
\`\`\`

\`\`\`yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef: { name: letsencrypt-prod }
    solvers:
    - http01:
        ingress: { ingressClassName: nginx }
\`\`\`

Ingress에 \`cert-manager.io/cluster-issuer: letsencrypt-prod\` 어노테이션만 달면 인증서가 자동 발급·갱신됩니다.

---

## 자주 쓰는 Nginx 어노테이션

\`ingress-nginx\`의 동작은 어노테이션으로 세밀하게 제어합니다.

| 어노테이션 | 용도 |
|-----------|------|
| \`nginx.ingress.kubernetes.io/rewrite-target\` | 경로 재작성 (정규식 캡처 \`$1\` 사용) |
| \`nginx.ingress.kubernetes.io/ssl-redirect\` | HTTP→HTTPS 리다이렉트 |
| \`nginx.ingress.kubernetes.io/proxy-body-size\` | 업로드 최대 크기 (기본 1m) |
| \`nginx.ingress.kubernetes.io/proxy-read-timeout\` | 백엔드 응답 타임아웃(초) |
| \`nginx.ingress.kubernetes.io/auth-type\` | Basic Auth 등 인증 |
| \`nginx.ingress.kubernetes.io/configuration-snippet\` | 임의 Nginx 설정 삽입 |

### rewrite-target 예시 — /api 접두사 제거

\`\`\`yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
  - host: demo.example.com
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend: { service: { name: web-a, port: { number: 80 } } }
\`\`\`

\`/api/users\` 요청이 백엔드에는 \`/users\`로 전달됩니다.

### Basic Auth 적용

\`\`\`bash
htpasswd -c auth admin           # 비밀번호 입력
kubectl create secret generic basic-auth --from-file=auth
\`\`\`

\`\`\`yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"
\`\`\`

---

## 트러블슈팅

\`\`\`bash
# 어떤 라우팅이 적용됐는지 상세 확인
kubectl describe ingress app-ingress

# 컨트롤러 로그 — 502/503, 인증서 오류 추적
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller -f

# 생성된 실제 nginx.conf 덤프
kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf
\`\`\`

| 증상 | 원인 / 점검 |
|------|------------|
| 404 Not Found (nginx) | host/path 불일치 또는 \`ingressClassName\` 누락 |
| 503 Service Unavailable | 백엔드 Pod가 없거나 Service selector 불일치 |
| TLS 인증서 미적용 | \`tls.secretName\` 오타, Secret이 같은 네임스페이스에 없음 |
| 502 Bad Gateway | 백엔드 포트(targetPort) 불일치, 컨테이너 미기동 |

> Ingress 리소스와 백엔드 Service는 **같은 네임스페이스**에 있어야 합니다. cross-namespace 라우팅은 기본 Ingress 스펙으로 불가능하며 ExternalName Service 등 우회가 필요합니다.

---

## 정리

| 항목 | 핵심 |
|------|------|
| Ingress 리소스 | 호스트/경로 → Service 라우팅 규칙 선언 |
| Ingress Controller | 규칙을 실제로 처리하는 프록시 (필수 설치) |
| ingressClassName | 여러 컨트롤러 중 처리 주체 지정 |
| pathType | Prefix / Exact / ImplementationSpecific |
| TLS | \`tls\` 블록 + Secret, 운영은 cert-manager 자동 갱신 |
| 동작 제어 | \`nginx.ingress.kubernetes.io/*\` 어노테이션 |
| 디버깅 | \`describe ingress\` + 컨트롤러 로그 |

단일 진입점에서 비용을 줄이며 L7 라우팅·TLS·인증을 한곳에 모으는 것이 Ingress의 핵심 가치입니다. 운영에서는 cert-manager로 인증서를 자동화하고, 어노테이션으로 타임아웃·바디 크기 같은 현실적 제약을 반드시 조정하세요.`,
  },
  {
    title: 'Kubernetes ConfigMap·Secret — 설정과 민감정보 관리 완전 가이드',
    slug: 'kubernetes-configmap-secret-guide',
    summary: 'ConfigMap과 Secret으로 설정·민감정보를 컨테이너 이미지에서 분리하고, 환경변수/볼륨 주입, 자동 리로드, 암호화 등 실전 패턴을 정리합니다.',
    category: 'Docker / 컨테이너',
    tags: ['kubernetes', 'configmap', 'secret', 'configuration'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## ConfigMap·Secret 이란?

12-factor 원칙의 핵심은 "설정을 코드(이미지)에서 분리"하는 것입니다. 쿠버네티스는 두 리소스로 이를 구현합니다.

- **ConfigMap**: 비민감 설정(앱 옵션, URL, 기능 플래그 등)을 키-값으로 저장
- **Secret**: 비밀번호, 토큰, 인증서 등 민감정보를 저장 (base64 인코딩 + 접근 제어)

둘 다 환경변수나 볼륨 파일로 컨테이너에 주입할 수 있어, 같은 이미지를 dev/stage/prod에서 서로 다른 설정으로 재사용할 수 있습니다.

> Secret의 기본 인코딩은 **암호화가 아니라 base64**입니다. 누구나 디코딩할 수 있으므로 "Secret이니까 안전하다"는 착각은 금물입니다. 진짜 보호는 RBAC + etcd 암호화 + 외부 비밀 관리 도구로 완성됩니다.

---

## ConfigMap 만들기

### 명령형(리터럴/파일)

\`\`\`bash
# 키-값 직접
kubectl create configmap app-config \\
  --from-literal=LOG_LEVEL=info \\
  --from-literal=MAX_CONN=100

# 파일 통째로 (--from-file)
kubectl create configmap nginx-conf --from-file=./nginx.conf

# .env 형식 일괄 (--from-env-file)
kubectl create configmap app-env --from-env-file=./app.env
\`\`\`

### 선언형(YAML) — 권장

\`\`\`yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  MAX_CONN: "100"
  # 파일 형태 설정도 통째로 넣을 수 있음
  application.yaml: |
    server:
      port: 8080
    feature:
      newUI: true
\`\`\`

\`\`\`bash
kubectl apply -f configmap.yaml
kubectl get cm app-config -o yaml
\`\`\`

---

## Secret 만들기

\`\`\`bash
# 일반 비밀값
kubectl create secret generic db-secret \\
  --from-literal=DB_USER=admin \\
  --from-literal=DB_PASS='S3cr3t!23'

# TLS 인증서
kubectl create secret tls web-tls --cert=tls.crt --key=tls.key

# 프라이빗 레지스트리 인증
kubectl create secret docker-registry regcred \\
  --docker-server=registry.example.com \\
  --docker-username=ci --docker-password='token'
\`\`\`

YAML로 쓸 때는 값이 base64여야 합니다. 평문을 그대로 쓰려면 \`stringData\`를 사용하세요.

\`\`\`yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:           # 평문 입력 → 저장 시 자동 base64
  DB_USER: admin
  DB_PASS: "S3cr3t!23"
\`\`\`

Secret의 주요 타입은 다음과 같습니다.

| type | 용도 |
|------|------|
| \`Opaque\` | 임의 키-값 (기본) |
| \`kubernetes.io/tls\` | TLS 인증서/키 |
| \`kubernetes.io/dockerconfigjson\` | 레지스트리 인증 |
| \`kubernetes.io/service-account-token\` | SA 토큰 |

---

## 컨테이너에 주입하기 — 환경변수

### 개별 키 주입

\`\`\`yaml
spec:
  containers:
  - name: app
    image: myapp:1.0
    env:
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: LOG_LEVEL
    - name: DB_PASS
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: DB_PASS
\`\`\`

### 전체 일괄 주입 (envFrom)

\`\`\`yaml
    envFrom:
    - configMapRef: { name: app-config }
    - secretRef: { name: db-secret }
\`\`\`

> 환경변수로 주입한 값은 **Pod가 만들어질 때 한 번** 박힙니다. ConfigMap을 수정해도 이미 떠 있는 Pod의 환경변수는 갱신되지 않습니다. 반영하려면 롤링 재시작이 필요합니다.

---

## 컨테이너에 주입하기 — 볼륨 마운트

ConfigMap/Secret을 파일로 마운트하면, 환경변수와 달리 ConfigMap 변경 시 **마운트된 파일이 자동 갱신**됩니다(수십 초 지연).

\`\`\`yaml
spec:
  containers:
  - name: app
    image: myapp:1.0
    volumeMounts:
    - name: config-vol
      mountPath: /etc/app          # /etc/app/application.yaml 로 생성됨
      readOnly: true
    - name: secret-vol
      mountPath: /etc/secret
      readOnly: true
  volumes:
  - name: config-vol
    configMap:
      name: app-config
      items:                        # 특정 키만 선택 마운트
      - key: application.yaml
        path: application.yaml
  - name: secret-vol
    secret:
      secretName: db-secret
      defaultMode: 0400             # 권한 제한
\`\`\`

| 방식 | 자동 갱신 | 적합한 경우 |
|------|----------|------------|
| 환경변수 (env/envFrom) | 아니오 | 단순 값, 12-factor 앱 |
| 볼륨 마운트 | 예(파일 갱신) | 설정 파일, 인증서, 핫리로드 앱 |

---

## 설정 변경 시 자동 롤링 재시작

환경변수 주입은 자동 반영이 안 되므로, 설정 변경 시 Deployment를 다시 굴려야 합니다. 흔한 패턴은 ConfigMap 내용의 해시를 어노테이션에 박는 것입니다.

\`\`\`yaml
spec:
  template:
    metadata:
      annotations:
        # 내용이 바뀌면 이 값을 갱신 → Pod 템플릿 변경 → 롤링 재시작
        checksum/config: "a1b2c3..."
\`\`\`

수동으로는 다음 명령으로 즉시 롤링합니다.

\`\`\`bash
kubectl rollout restart deployment/myapp
\`\`\`

> \`kubectl edit\` 또는 \`apply\`로 불변(immutable) ConfigMap을 만들면(\`immutable: true\`) 실수 변경을 막고 API 서버 부하도 줄일 수 있습니다. 단, 변경하려면 삭제 후 재생성해야 합니다.

---

## 보안 강화 — Secret 진짜로 보호하기

### 1) etcd 저장 시 암호화

\`\`\`yaml
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources: ["secrets"]
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <base64-32byte-key>
  - identity: {}
\`\`\`

API 서버 기동 옵션에 \`--encryption-provider-config\`를 추가하면 Secret이 etcd에 암호문으로 저장됩니다.

### 2) RBAC로 접근 제한

\`\`\`yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: prod
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["db-secret"]   # 특정 Secret만
  verbs: ["get"]
\`\`\`

### 3) 외부 비밀 관리 연동

운영에서는 평문 Secret을 git에 두지 않고 다음을 권장합니다.

- **External Secrets Operator**: AWS Secrets Manager, Vault 등에서 동기화
- **Sealed Secrets**: 암호문 형태로 git 커밋 가능, 클러스터 내에서만 복호화
- **SOPS**: 키만 KMS로 관리하며 파일 암호화

---

## 검증과 디버깅

\`\`\`bash
# Secret 값 디코딩 확인
kubectl get secret db-secret -o jsonpath='{.data.DB_PASS}' | base64 -d; echo

# Pod 안에서 실제 주입된 환경변수 확인
kubectl exec deploy/myapp -- env | grep -E 'LOG_LEVEL|DB_'

# 마운트된 설정 파일 확인
kubectl exec deploy/myapp -- cat /etc/app/application.yaml
\`\`\`

| 증상 | 원인 |
|------|------|
| CreateContainerConfigError | 참조한 ConfigMap/Secret/key가 존재하지 않음 |
| 값이 빈 문자열 | \`key\` 이름 오타 또는 대소문자 불일치 |
| 파일이 안 보임 | mountPath가 기존 디렉터리를 덮어씀(전체 교체됨) |

---

## 정리

| 항목 | ConfigMap | Secret |
|------|-----------|--------|
| 대상 | 비민감 설정 | 비밀번호/토큰/인증서 |
| 저장 | 평문 | base64 (암호화 아님) |
| 주입 | env / envFrom / volume | 동일 |
| 자동 갱신 | volume 마운트만 | volume 마운트만 |
| 보안 | RBAC | RBAC + etcd 암호화 + 외부도구 |
| 변경 반영 | \`rollout restart\` | 동일 |

설정과 코드의 분리가 ConfigMap/Secret의 본질입니다. 핫리로드가 필요하면 볼륨 마운트, 단순 값은 환경변수를 쓰고, Secret은 base64일 뿐임을 잊지 말고 etcd 암호화·RBAC·외부 비밀관리로 실질적 보호를 갖추세요.`,
  },
  {
    title: 'Kubernetes HPA 오토스케일링 — 리소스 기반 Pod 자동 확장',
    slug: 'kubernetes-hpa-autoscaling',
    summary: 'metrics-server 설치부터 CPU/메모리·커스텀 메트릭 기반 HorizontalPodAutoscaler 구성, 스케일링 동작(behavior) 튜닝, 트러블슈팅까지 실전으로 다룹니다.',
    category: 'Docker / 컨테이너',
    tags: ['kubernetes', 'hpa', 'autoscaling', 'metrics-server', 'scaling'],
    difficulty: 'advanced',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## HPA(HorizontalPodAutoscaler) 란?

HPA는 측정된 메트릭(CPU, 메모리, 커스텀 지표)에 따라 Deployment/ReplicaSet/StatefulSet의 **레플리카 수를 자동으로 늘리거나 줄이는** 컨트롤러입니다. 트래픽이 몰리면 Pod를 늘려 처리량을 확보하고, 한가하면 줄여 비용을 아낍니다.

- **수평 확장(Horizontal)**: Pod 개수를 조절 (vs. VPA는 Pod의 리소스 한도를 조절)
- 기본 동기화 주기는 15초이며, 목표값 대비 현재값 비율로 원하는 레플리카를 계산
- 측정값을 공급하는 **metrics-server**(또는 커스텀 메트릭 API)가 반드시 필요

> HPA가 동작하려면 **Pod에 \`resources.requests\`가 설정**되어 있어야 합니다. CPU 사용률은 "사용량 / requests" 비율로 계산되므로, requests가 없으면 \`<unknown>\`이 떠서 스케일링이 멈춥니다.

---

## metrics-server 설치

HPA의 CPU/메모리 기반 스케일링은 metrics-server가 제공하는 \`metrics.k8s.io\` API에 의존합니다.

\`\`\`bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
\`\`\`

테스트/사설 클러스터에서 kubelet 인증서가 자체서명이라 metrics-server가 못 붙는 경우가 흔합니다. 이때만 임시로 TLS 검증을 끕니다.

\`\`\`bash
kubectl patch deployment metrics-server -n kube-system --type=json \\
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
\`\`\`

설치 확인:

\`\`\`bash
kubectl top nodes
kubectl top pods
# 값이 나오면 metrics-server 정상
\`\`\`

---

## 스케일 대상 워크로드 준비

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-apache
spec:
  replicas: 1
  selector: { matchLabels: { app: php-apache } }
  template:
    metadata: { labels: { app: php-apache } }
    spec:
      containers:
      - name: php-apache
        image: registry.k8s.io/hpa-example
        ports: [{ containerPort: 80 }]
        resources:
          requests:        # HPA 계산의 기준 — 필수!
            cpu: 200m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
---
apiVersion: v1
kind: Service
metadata:
  name: php-apache
spec:
  selector: { app: php-apache }
  ports: [{ port: 80 }]
\`\`\`

---

## HPA 생성 — CPU 기반

### 명령형 (간단)

\`\`\`bash
kubectl autoscale deployment php-apache \\
  --cpu-percent=50 --min=1 --max=10
\`\`\`

### 선언형 (autoscaling/v2, 권장)

v2 API는 다중 메트릭과 스케일링 동작 튜닝을 지원합니다.

\`\`\`yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: php-apache
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization        # requests 대비 비율(%)
        averageUtilization: 50
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue       # 절대값 기준
        averageValue: 200Mi
\`\`\`

여러 메트릭이 있으면 각각 계산해 **가장 큰 레플리카 수**를 채택합니다(보수적 확장).

---

## 스케일링 계산 원리

원하는 레플리카는 다음 공식으로 결정됩니다.

\`\`\`
desiredReplicas = ceil( currentReplicas * (currentMetric / targetMetric) )
\`\`\`

예: 현재 3개 Pod, 평균 CPU 사용률 90%, 목표 50% → \`ceil(3 * 90/50) = ceil(5.4) = 6\`개로 확장.

목표값 근처(기본 ±10% tolerance)에서는 잦은 떨림을 막기 위해 스케일링하지 않습니다.

---

## 부하 테스트로 확인

\`\`\`bash
# 부하 발생기
kubectl run -it --rm load --image=busybox:1.36 --restart=Never -- \\
  /bin/sh -c "while true; do wget -q -O- http://php-apache; done"

# 다른 터미널에서 실시간 관찰
kubectl get hpa php-apache --watch
# NAME         TARGETS         MINPODS  MAXPODS  REPLICAS
# php-apache   250%/50%        1        10       1 → 5 → ...
\`\`\`

부하 종료 후에는 기본 5분(\`stabilizationWindowSeconds\`)을 기다린 뒤 천천히 축소됩니다.

---

## 스케일링 동작 튜닝 (behavior)

급격한 트래픽에 빠르게 확장하고, 축소는 신중하게 하려면 \`behavior\`를 조정합니다.

\`\`\`yaml
spec:
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0     # 즉시 확장
      policies:
      - type: Percent
        value: 100                       # 한 번에 최대 100% 증가
        periodSeconds: 30
      - type: Pods
        value: 4                         # 또는 최대 4개씩
        periodSeconds: 30
      selectPolicy: Max                  # 둘 중 더 공격적인 정책 선택
    scaleDown:
      stabilizationWindowSeconds: 300    # 5분간 안정화 후 축소
      policies:
      - type: Percent
        value: 10                        # 한 번에 최대 10%만 감소
        periodSeconds: 60
\`\`\`

| 파라미터 | 의미 |
|----------|------|
| \`stabilizationWindowSeconds\` | 결정에 사용할 과거 윈도우(떨림 방지) |
| policy \`Percent\` | 비율 기반 변동 한도 |
| policy \`Pods\` | 절대 개수 변동 한도 |
| \`selectPolicy\` | Max(공격적)/Min(보수적)/Disabled |

---

## 커스텀·외부 메트릭 (RPS, 큐 길이)

CPU만으로 부족하면 Prometheus Adapter나 KEDA로 애플리케이션 지표 기반 확장을 합니다.

\`\`\`yaml
  metrics:
  - type: Pods                          # Pod당 커스텀 메트릭
    pods:
      metric: { name: http_requests_per_second }
      target:
        type: AverageValue
        averageValue: "100"
  - type: External                      # 외부 지표(예: SQS 큐 길이)
    external:
      metric: { name: sqs_queue_length }
      target:
        type: AverageValue
        averageValue: "30"
\`\`\`

> 이벤트/메시지 기반 워크로드라면 **KEDA**가 0개까지 축소(scale-to-zero)와 다양한 스케일러(Kafka, RabbitMQ, Cron 등)를 제공해 순수 HPA보다 편리합니다.

---

## 트러블슈팅

\`\`\`bash
kubectl describe hpa php-apache       # 이벤트와 조건(Conditions) 확인
\`\`\`

| 증상 | 원인 / 해결 |
|------|------------|
| TARGETS가 \`<unknown>\` | metrics-server 미동작 또는 \`requests\` 누락 |
| FailedGetResourceMetric | metrics-server 인증서/네트워크 문제 |
| 확장이 안 됨 | maxReplicas 도달, tolerance 범위 내 |
| 축소가 느림 | scaleDown stabilizationWindow가 김(정상 동작) |
| 떨림(flapping) | stabilizationWindow를 늘려 완화 |

> HPA와 Cluster Autoscaler는 **함께** 써야 완성됩니다. HPA가 Pod를 늘려도 노드 리소스가 부족하면 Pending이 되므로, 노드를 자동 추가하는 Cluster Autoscaler(또는 Karpenter)가 받쳐줘야 합니다.

---

## 정리

| 항목 | 핵심 |
|------|------|
| 전제 조건 | metrics-server + Pod의 \`resources.requests\` |
| API 버전 | \`autoscaling/v2\` (다중 메트릭·behavior) |
| 계산식 | \`ceil(현재 * 현재값/목표값)\` |
| 메트릭 종류 | Resource(CPU/Mem) / Pods / Object / External |
| behavior | scaleUp 공격적 + scaleDown 보수적 권장 |
| 이벤트 워크로드 | KEDA(scale-to-zero) 고려 |
| 노드 부족 시 | Cluster Autoscaler/Karpenter 병행 |

HPA의 핵심은 "requests를 기준으로 한 비율 계산"입니다. requests를 현실적으로 잡고, scaleUp은 빠르게·scaleDown은 천천히 튜닝하며, 노드 오토스케일러까지 함께 구성해야 실제 트래픽 변동에 안정적으로 대응할 수 있습니다.`,
  },
  {
    title: 'Docker Swarm 클러스터 — 서비스 배포와 스케일링 완전 가이드',
    slug: 'docker-swarm-cluster-guide',
    summary: 'Docker Swarm으로 매니저/워커 클러스터를 구성하고, 서비스 배포·스케일링·롤링 업데이트·오버레이 네트워크·시크릿까지 운영 관점에서 실습합니다.',
    category: 'Docker / 컨테이너',
    tags: ['docker', 'swarm', 'cluster', 'orchestration', 'scaling'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## Docker Swarm 이란?

Docker Swarm은 Docker 엔진에 내장된 컨테이너 오케스트레이터입니다. 여러 호스트를 하나의 가상 Docker 엔진처럼 묶어 서비스를 분산 배포하고, 스케일링·롤링 업데이트·셀프 힐링(self-healing)을 별도 설치 없이 제공합니다.

- **쿠버네티스보다 단순**: 기존 \`docker\` CLI와 Compose 문법을 거의 그대로 사용
- **내장 기능**: 서비스 디스커버리, 로드밸런싱(라우팅 메시), 롤링 업데이트, 시크릿
- 소규모~중규모 클러스터나 운영 단순함이 중요한 경우에 적합

> 대규모/복잡한 생태계(오토스케일링, 커스텀 컨트롤러, 풍부한 에코시스템)가 필요하면 쿠버네티스가 사실상 표준입니다. Swarm은 "Compose에서 멀티 호스트로의 가장 쉬운 다음 단계"라는 위치를 이해하고 선택하세요.

---

## 클러스터 구성

### 매니저 노드 초기화

\`\`\`bash
# 매니저가 될 노드에서 (--advertise-addr 는 다른 노드가 접속할 IP)
docker swarm init --advertise-addr 192.168.1.10
# Swarm initialized. To add a worker ... docker swarm join --token SWMTKN-1-...
\`\`\`

### 워커 노드 조인

\`\`\`bash
# init 출력의 join 명령을 워커 노드에서 실행
docker swarm join --token SWMTKN-1-xxxx 192.168.1.10:2377
\`\`\`

조인 토큰을 다시 확인하려면:

\`\`\`bash
docker swarm join-token worker      # 워커용
docker swarm join-token manager     # 매니저용
\`\`\`

### 노드 확인

\`\`\`bash
docker node ls
# ID          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
# abc * ...   node1      Ready    Active         Leader
# def ...     node2      Ready    Active
\`\`\`

| 역할 | 책임 |
|------|------|
| Manager | Raft로 클러스터 상태 합의, 스케줄링, API 수신 |
| Worker | 할당된 태스크(컨테이너) 실행만 |

> 매니저는 가용성을 위해 **홀수(3 또는 5개)**로 두세요. Raft 합의는 과반이 필요하므로 3개 중 1개 장애까지 견딥니다. 매니저 2개는 오히려 단일 장애에 취약합니다.

---

## 서비스 배포와 스케일링

Swarm의 배포 단위는 컨테이너가 아니라 **서비스(service)**이며, 서비스는 여러 복제본(replica) 태스크로 실행됩니다.

\`\`\`bash
# nginx 서비스 3개 복제본으로 배포, 80포트 외부 노출
docker service create --name web --replicas 3 -p 80:80 nginx:1.27

docker service ls
docker service ps web      # 어느 노드에서 도는지 태스크 단위 확인
\`\`\`

### 스케일링

\`\`\`bash
docker service scale web=5
# 또는
docker service update --replicas 5 web
\`\`\`

### 셀프 힐링 확인

컨테이너를 죽이거나 노드가 빠져도 Swarm이 원하는 복제본 수를 유지합니다.

\`\`\`bash
docker rm -f <task-container>     # 워커 노드에서 강제 종료
docker service ps web             # 자동으로 새 태스크가 재생성됨
\`\`\`

---

## 라우팅 메시와 게시 모드

서비스를 \`-p 80:80\`으로 게시하면 **모든 노드**의 80포트로 들어온 요청이 라우팅 메시를 통해 복제본으로 분산됩니다. 해당 복제본이 그 노드에 없어도 자동 전달됩니다.

\`\`\`bash
# ingress(기본): 모든 노드에서 접근 + 부하분산
docker service create --name web -p 80:80 nginx

# host: 해당 컨테이너가 실제로 있는 노드에서만 노출
docker service create --name web \\
  --publish published=80,target=80,mode=host nginx
\`\`\`

---

## 오버레이 네트워크

여러 호스트에 걸친 서비스 간 통신은 오버레이 네트워크로 처리합니다. 같은 네트워크의 서비스는 **서비스명으로 DNS 통신**할 수 있습니다.

\`\`\`bash
docker network create --driver overlay --attachable appnet

docker service create --name api --network appnet myapi:1.0
docker service create --name web --network appnet -p 80:80 myweb:1.0
# web 컨테이너 안에서 'http://api:8080' 으로 접근 가능 (내장 VIP 로드밸런싱)
\`\`\`

---

## 롤링 업데이트와 롤백

\`\`\`bash
docker service create --name web --replicas 4 \\
  --update-parallelism 1 \\          # 한 번에 1개씩
  --update-delay 10s \\              # 사이 10초 대기
  --update-failure-action rollback \\ # 실패 시 자동 롤백
  nginx:1.26

# 이미지 교체 → 무중단 롤링
docker service update --image nginx:1.27 web

# 수동 롤백
docker service rollback web
\`\`\`

| 옵션 | 의미 |
|------|------|
| \`--update-parallelism\` | 동시에 갱신할 태스크 수 |
| \`--update-delay\` | 배치 사이 대기 시간 |
| \`--update-failure-action\` | 실패 시 pause/continue/rollback |
| \`--update-order\` | start-first(새 것 먼저) / stop-first |

---

## Stack — Compose로 멀티서비스 배포

여러 서비스를 한 파일로 묶어 배포하는 것이 Stack입니다. \`deploy:\` 섹션이 Swarm 전용입니다.

\`\`\`yaml
# stack.yml
version: "3.9"
services:
  web:
    image: myweb:1.0
    ports: ["80:80"]
    networks: [appnet]
    deploy:
      replicas: 3
      update_config: { parallelism: 1, delay: 10s }
      restart_policy: { condition: on-failure }
      placement:
        constraints: [node.role == worker]   # 워커에만 배치
  api:
    image: myapi:1.0
    networks: [appnet]
    deploy:
      replicas: 2
      resources:
        limits: { cpus: "0.5", memory: 256M }
networks:
  appnet: { driver: overlay }
\`\`\`

\`\`\`bash
docker stack deploy -c stack.yml myapp
docker stack services myapp
docker stack ps myapp
docker stack rm myapp
\`\`\`

---

## Secret과 Config

Swarm은 시크릿/설정을 암호화해 Raft 로그에 저장하고, 실행 중인 컨테이너에만 \`/run/secrets/<name>\`으로 마운트합니다.

\`\`\`bash
echo "S3cr3t!23" | docker secret create db_pass -

docker service create --name api \\
  --secret db_pass myapi:1.0
# 컨테이너 안: cat /run/secrets/db_pass
\`\`\`

> Secret은 환경변수가 아니라 **파일(tmpfs)**로만 노출되어 환경변수 유출 위험이 낮습니다. Compose에서는 \`secrets:\` 섹션과 \`external: true\`로 참조합니다.

---

## 운영 명령 모음

\`\`\`bash
docker service logs -f web              # 서비스 로그 집계
docker node update --availability drain node2   # 노드 비우기(점검 전)
docker node update --availability active node2  # 복귀
docker node rm node2                    # 워커 제거(먼저 drain 권장)
docker swarm leave                      # 워커가 클러스터 탈퇴
docker swarm leave --force              # 매니저 강제 탈퇴
\`\`\`

| 증상 | 점검 |
|------|------|
| 서비스가 Pending | 리소스 제약/placement 조건 불충족 |
| 노드 Down | docker 데몬 상태, 2377/7946/4789 포트 방화벽 |
| 서비스 간 통신 불가 | 같은 overlay 네트워크인지, DNS(서비스명) 확인 |

---

## 정리

| 항목 | 핵심 |
|------|------|
| 초기화 | \`docker swarm init\` / \`join\` |
| 매니저 수 | 홀수(3·5), Raft 과반 합의 |
| 배포 단위 | service → replica 태스크 |
| 부하분산 | 라우팅 메시(ingress) |
| 서비스 통신 | overlay 네트워크 + 서비스명 DNS |
| 업데이트 | 롤링(parallelism/delay) + 자동 롤백 |
| 멀티서비스 | \`docker stack deploy\` (deploy 섹션) |
| 비밀정보 | secret → \`/run/secrets\` 파일 마운트 |

Swarm은 Compose 사용자가 멀티 호스트로 넘어가는 가장 부드러운 길입니다. 매니저를 홀수로 두고, 오버레이 네트워크로 서비스를 연결하며, 롤링 업데이트와 secret을 활용하면 별도 설치 없이 견고한 소규모 클러스터를 운영할 수 있습니다.`,
  },
  {
    title: 'Kubernetes Pod CrashLoopBackOff 진단 — 원인별 완전 해결',
    slug: 'kubernetes-pod-crashloopbackoff-fix',
    summary: 'CrashLoopBackOff의 정확한 의미와 백오프 동작을 이해하고, 종료 코드·로그·프로브·OOMKilled·설정 누락 등 원인별 진단 절차와 해결법을 체계적으로 정리합니다.',
    category: '트러블슈팅',
    tags: ['kubernetes', 'crashloopbackoff', 'debugging', 'troubleshooting'],
    difficulty: 'intermediate',
    os_compat: ['linux'],
    author: 'SecuThive',
    content: `## CrashLoopBackOff 란?

\`CrashLoopBackOff\`는 그 자체가 오류가 아니라 **상태**입니다. 컨테이너가 시작 → 종료(크래시) → 재시작을 반복하자, kubelet이 재시작 간격을 점점 늘려(back-off) 폭주를 막고 있다는 뜻입니다. 즉 "컨테이너가 자꾸 죽어서 잠시 쉬었다가 다시 시도 중"인 상태입니다.

- 재시작 간격은 10s → 20s → 40s … 로 두 배씩 증가, 최대 5분
- 원인은 컨테이너 안에 있으므로, 핵심은 **왜 죽었는지**를 찾는 것
- \`restartPolicy\`가 \`Always\`(기본)/\`OnFailure\`일 때 발생

> CrashLoopBackOff는 원인 그 자체가 아니라 "증상의 묶음"입니다. 종료 코드와 로그를 보지 않고 매니페스트만 수정하면 헛수고하기 쉽습니다. 항상 **종료 코드 → 로그 → 이벤트** 순으로 좁혀가세요.

---

## 1단계: 전체 상태 파악

\`\`\`bash
kubectl get pods
# NAME        READY   STATUS             RESTARTS   AGE
# myapp-xxx   0/1     CrashLoopBackOff   5          3m

kubectl describe pod myapp-xxx
\`\`\`

\`describe\` 출력에서 다음 두 곳을 먼저 봅니다.

\`\`\`
Last State:     Terminated
  Reason:       Error
  Exit Code:    1            ← 핵심 단서
Events:
  Warning  BackOff  ...  Back-off restarting failed container
\`\`\`

---

## 2단계: 종료 코드(Exit Code) 해석

종료 코드는 원인을 빠르게 좁혀줍니다.

| Exit Code | 의미 | 흔한 원인 |
|-----------|------|----------|
| 0 | 정상 종료 | 메인 프로세스가 할 일 끝내고 종료(데몬이 아님) |
| 1 | 일반 애플리케이션 오류 | 코드 예외, 설정 누락, 의존 서비스 미연결 |
| 2 | 셸 사용법/명령 오류 | command/args 오타 |
| 126 | 실행 불가 | 권한 없음, 바이너리 아님 |
| 127 | 명령 없음 | command 경로 오타, 패키지 미설치 |
| 137 | SIGKILL(128+9) | **OOMKilled** 또는 강제 종료 |
| 139 | SIGSEGV(128+11) | 세그폴트(네이티브 크래시) |
| 143 | SIGTERM(128+15) | 종료 신호 정상 수신 |

---

## 3단계: 로그 확인 — 가장 중요한 단서

현재 컨테이너가 아니라 **직전에 죽은** 컨테이너의 로그를 봐야 합니다.

\`\`\`bash
kubectl logs myapp-xxx                 # 현재(또는 마지막) 인스턴스
kubectl logs myapp-xxx --previous      # 이전에 크래시한 인스턴스 ← 핵심
kubectl logs myapp-xxx -c sidecar      # 멀티 컨테이너 시 특정 컨테이너
\`\`\`

> 재시작이 빠르면 로그를 잡기 전에 컨테이너가 사라집니다. \`--previous\`로 직전 인스턴스 로그를 봐야 진짜 원인이 보입니다.

---

## 원인별 해결

### A. 애플리케이션 시작 실패 (Exit 1)

설정/환경변수 누락, DB 연결 실패가 대부분입니다.

\`\`\`bash
kubectl logs myapp-xxx --previous
# 예: "ECONNREFUSED postgres:5432" → DB가 아직 안 떴거나 Service명 오타
\`\`\`

- 환경변수/ConfigMap/Secret이 제대로 주입됐는지 확인
- 의존 서비스 기동 순서 문제라면 \`initContainers\`로 대기

\`\`\`yaml
initContainers:
- name: wait-db
  image: busybox:1.36
  command: ['sh','-c','until nc -z postgres 5432; do echo waiting; sleep 2; done']
\`\`\`

### B. OOMKilled (Exit 137)

메모리 limit 초과로 커널이 컨테이너를 죽인 경우입니다.

\`\`\`bash
kubectl describe pod myapp-xxx | grep -A3 'Last State'
#   Reason: OOMKilled
\`\`\`

해결: limit 상향 또는 앱 메모리 사용 점검.

\`\`\`yaml
resources:
  requests: { memory: 256Mi }
  limits:   { memory: 512Mi }   # 실제 사용량 + 여유
\`\`\`

> JVM·Node 등은 limit과 무관하게 호스트 메모리를 보고 힙을 잡으려다 OOM이 납니다. \`-XX:MaxRAMPercentage\` 또는 \`--max-old-space-size\`로 컨테이너 limit에 맞춰 제한하세요.

### C. 잘못된 command/args (Exit 127/126)

\`\`\`bash
kubectl logs myapp-xxx --previous
# "exec: \\"node\\": executable file not found" → 이미지에 없는 명령
\`\`\`

이미지의 ENTRYPOINT를 덮어쓸 때 경로/철자를 확인하고, 디버깅용으로 직접 셸을 띄워봅니다.

\`\`\`bash
kubectl run debug --rm -it --image=myapp:1.0 --command -- /bin/sh
\`\`\`

### D. 라이브니스 프로브 실패

앱은 멀쩡한데 \`livenessProbe\`가 너무 빡빡해 kubelet이 계속 죽이는 경우입니다. 이때는 종료 코드가 \`137/143\`이고 로그에는 에러가 없습니다.

\`\`\`yaml
livenessProbe:
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 30      # 부팅 느린 앱은 충분히
  periodSeconds: 10
  failureThreshold: 3
# 부팅이 매우 느리면 startupProbe로 분리
startupProbe:
  httpGet: { path: /healthz, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5
\`\`\`

| 단서 | 가능성 높은 원인 |
|------|------------------|
| 로그에 앱 에러 + Exit 1 | 설정/의존성 문제 (A) |
| Reason: OOMKilled, Exit 137 | 메모리 부족 (B) |
| "not found" + Exit 127 | command/이미지 문제 (C) |
| 로그 깨끗 + 주기적 137/143 | 프로브 오설정 (D) |

### E. 설정 리소스 누락 (CreateContainerConfigError)

엄밀히는 CrashLoop 직전 단계지만 함께 자주 만납니다.

\`\`\`bash
kubectl describe pod myapp-xxx
# Warning  Failed  ... configmap "app-config" not found
\`\`\`

참조하는 ConfigMap/Secret/key가 같은 네임스페이스에 있는지 확인합니다.

---

## 실시간 디버깅 기법

\`\`\`bash
# 이벤트를 시간순으로 — 클러스터 차원 원인(스케줄링/이미지풀) 파악
kubectl get events --sort-by=.lastTimestamp

# 임시로 죽지 않게 만들어 안에서 진단 (command를 sleep로 덮어쓰기)
kubectl run probe --rm -it --image=myapp:1.0 \\
  --command -- sleep 3600
kubectl exec -it probe -- sh

# 기존 Pod에 디버그 컨테이너 주입(이미지 변경 없이)
kubectl debug -it myapp-xxx --image=busybox:1.36 --target=myapp
\`\`\`

> 운영 중인 Deployment를 임시 검사할 때 \`kubectl edit\`로 command를 \`sleep\`로 바꾸면 크래시 루프가 멈춰 안에서 천천히 조사할 수 있습니다. 조사 후 원복을 잊지 마세요.

---

## 정리

| 단계 | 명령 | 얻는 것 |
|------|------|---------|
| 상태 | \`kubectl get/describe pod\` | STATUS, Exit Code, 이벤트 |
| 종료 코드 | describe의 Last State | 원인 카테고리 추정 |
| 로그 | \`kubectl logs --previous\` | 진짜 크래시 원인 |
| 이벤트 | \`kubectl get events\` | 스케줄링/이미지/설정 문제 |
| 진단 | \`kubectl run/exec/debug\` | 컨테이너 내부 직접 확인 |

| 종료 코드 | 1순위 해결 |
|-----------|-----------|
| 1 | 로그 확인 → 설정/의존성 |
| 137 | 메모리 limit 상향 (OOMKilled) |
| 127/126 | command/이미지 점검 |
| 137/143 + 로그 정상 | 프로브 완화/ startupProbe |

CrashLoopBackOff는 "다시 시도 중"이라는 상태일 뿐, 원인은 항상 컨테이너 안에 있습니다. **종료 코드 → \`--previous\` 로그 → 이벤트** 순서로 좁히면 거의 모든 케이스를 체계적으로 해결할 수 있습니다.`,
  },
];

async function insertGuides() {
  let success = 0, skipped = 0, failed = 0;
  for (const guide of guides) {
    const { error } = await supabase
      .from('engineer_guides')
      .upsert(guide, { onConflict: 'slug', ignoreDuplicates: true });
    if (error?.code === '23505') { console.log(`⏭  SKIP  ${guide.slug}`); skipped++; }
    else if (error) { console.error(`✗ FAIL  ${guide.slug}:`, error.message); failed++; }
    else { console.log(`✓ OK    ${guide.slug}`); success++; }
  }
  console.log(`\n완료: ${success}개 삽입, ${skipped}개 중복, ${failed}개 실패`);
}

insertGuides();
