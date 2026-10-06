-- top4 refresh 2026-10-06 post #590 crashloopbackoff-해결-pod-무한-재시작-7가지-원인-진단법
-- KO content + EN content (content_evidence.en.content); adds contentUpdatedAt/changeSummary/officialSources.
-- Guarded by the original KO/EN md5; re-running updates 0 rows. updated_at bumped by trigger; published_at/status/slug/title untouched.
-- original md5: ko=3370cb012fd51446876769d6bc8bcd3f en=5074aa65e90a84844b500e62f834c71e  new md5: ko=f9a13cfbaaa94d99d3035812e3f94e55 en=701b26c9c0ae5b8ff5047801876c8548
BEGIN;
UPDATE posts SET
  content = $top4ko$# CrashLoopBackOff 완벽 해결: Pod 무한 재시작 7가지 원인 진단법

**이 글이 맞는 상태:** `kubectl get pod`의 STATUS가 `CrashLoopBackOff`이고, `kubectl describe pod`의 Events에 `Back-off restarting failed container`가 찍힙니다. 컨테이너는 떴다가 죽고 있으니, 종료 코드와 직전 로그로 원인을 고릅니다.

| 원인 | 확인 명령 | 해결 |
|---|---|---|
| 앱 예외·설정 오류 (Exit 1) | `kubectl logs <pod> --previous` | 로그가 가리키는 코드·환경변수 수정 |
| 메모리 한도 초과 (`OOMKilled`, Exit 137) | `kubectl describe pod <pod>`의 `Last State` | memory limit 상향 또는 사용량 축소 |
| liveness probe 실패 | Events의 `Liveness probe failed` | `startupProbe` 추가, liveness 임계치 완화 |
| 의존 서비스 미준비 (`connection refused`) | `kubectl logs <pod> --previous` | 앱 재시도 로직, 필요하면 initContainer |
| 명령·경로 오류 (`no such file or directory`) | `kubectl describe pod <pod>`의 Command·Mounts | 이미지 ENTRYPOINT 확인, 경로·`subPath` 수정 |

참조한 Secret·ConfigMap이 아예 없으면 STATUS는 CrashLoopBackOff가 아니라 `CreateContainerConfigError`입니다(원인 3 참고).

## 배포는 됐는데 Pod가 무한 재시작된다면

`kubectl get pod`를 쳤더니 STATUS 칸에 `CrashLoopBackOff`가 떠 있고, RESTARTS 카운트가 계속 올라가고 있다면 이 글이 정확히 필요한 순간입니다.

가장 먼저 알아둘 것은 **CrashLoopBackOff는 "상태"가 아니라 "증상"**이라는 점입니다. 컨테이너가 시작 → 크래시 → 쿠버네티스가 재시작 → 또 크래시를 반복하니까, 백오프(지연 재시도) 간격을 두며 다시 시작한다는 뜻일 뿐입니다. 진짜 원인은 컨테이너 **안에서 죽은 이유**에 있습니다.

이 시리즈의 1편에서 다룬 [Pending](/blog/kubernetes-pod-pending-원인-7가지-kubectl-describe로-완벽-진단하는-실전-가이드)은 스케줄링 단계의 문제(자원 부족·노드 셀렉터)였고, 2편의 [ImagePullBackOff](/blog/imagepullbackofferrimagepull-원인-6가지-진단해결-가이드)는 이미지를 아예 못 받아오는 문제였습니다. 반면 CrashLoopBackOff는 **이미지도 받았고 컨테이너도 떴는데, 실행되자마자 죽는** 단계입니다. 즉 한 단계 더 안쪽으로 들어온 셈이죠. 그래서 디버깅 포인트는 "스케줄러"가 아니라 "컨테이너 프로세스의 종료 코드와 로그"입니다.

## 1분 진단 루틴: describe → logs --previous → Exit Code

원인이 뭐든 시작은 항상 이 3단계입니다. 순서대로 치면 범위가 빠르게 좁혀집니다.

### 1단계: describe로 Events 확인

```bash
kubectl describe pod my-app-7d9f8-abcde
```

맨 아래 Events 섹션이 핵심입니다.

```
Events:
  Type     Reason     Age                From     Message
  ----     ------     ----               ----     -------
  Normal   Pulled     2m                 kubelet  Successfully pulled image
  Normal   Created    2m (x4 over 3m)    kubelet  Created container app
  Normal   Started    2m (x4 over 3m)    kubelet  Started container app
  Warning  BackOff    30s (x8 over 3m)   kubelet  Back-off restarting failed container
```

`Back-off restarting failed container`는 CrashLoopBackOff의 **공통 신호**입니다. 이게 보이면 "컨테이너가 시작은 했는데 죽었다"가 확정입니다. 이제 *왜* 죽었는지를 봐야 합니다.

### 2단계: logs --previous로 죽은 컨테이너 로그 확보

지금 떠 있는 컨테이너는 또 죽기 직전이라 로그가 비어 있을 수 있습니다. **방금 죽은(이전) 컨테이너**의 로그를 봐야 합니다.

```bash
kubectl logs my-app-7d9f8-abcde --previous
# 컨테이너가 여러 개면
kubectl logs my-app-7d9f8-abcde -c app --previous
```

`--previous`(축약 `-p`)를 빼먹어서 "로그가 안 나온다"며 헤매는 경우가 정말 많습니다. 크래시 디버깅에서 가장 먼저 챙길 옵션입니다.

### 3단계: Exit Code 확인

describe 출력의 `Last State` 블록에서 종료 코드를 읽습니다.

```
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
```

`kubectl get pod`의 RESTARTS 카운트도 같이 보세요. 빠르게 치솟으면 즉시 크래시, 한참 떠 있다가 죽으면 메모리 누수나 probe 문제일 가능성이 큽니다.

### 에러 메시지 → 원인 매핑 표

| 로그/Events 메시지 | 유력 원인 | 바로 갈 섹션 |
|---|---|---|
| `Back-off restarting failed container` | 공통 신호 (컨테이너 크래시) | 전부 |
| `OOMKilled` / Exit 137 | 메모리 한도 초과 | 원인 2 |
| `missing env` / `env XXX is undefined` (앱 로그) | 환경변수·시크릿 키 누락 | 원인 3 |
| `Error: secret "xxx" not found` (STATUS `CreateContainerConfigError`) | 참조한 Secret 자체가 없음(CrashLoopBackOff 아님) | 원인 3 |
| `Liveness probe failed` | 프로브 설정 오류 | 원인 4 |
| `connection refused` / `dial tcp ...` | 의존 서비스(DB) 미준비 | 원인 5 |
| `no such file or directory` | 마운트 경로/command 오류 | 원인 6·7 |
| Exit 1 + 스택트레이스 | 앱 일반 예외 | 원인 1 |

## 원인별 진단·해결 7선

### 원인 1. 애플리케이션 예외 / 엔트리포인트 오류 (Exit 1)

가장 흔한 케이스. 앱 코드가 시작하자마자 예외를 던지고 죽습니다.

```bash
kubectl logs <pod> --previous   # 스택트레이스 확인
```

로그에 `NullPointerException`, `Cannot find module`, `panic:` 같은 메시지가 그대로 찍힙니다. 이건 인프라 문제가 아니라 **앱 버그**이므로, 로그가 가리키는 코드/설정을 고치는 게 정답입니다. 인프라 담당자라면 로그를 캡처해 개발팀에 그대로 넘기면 됩니다.

### 원인 2. OOMKilled (Exit 137)

```bash
kubectl describe pod <pod> | grep -A2 "Last State"   # Reason: OOMKilled 확인
kubectl top pod <pod>                                 # 실사용 메모리 확인(metrics-server 필요)
```

137 = 128 + 9, 즉 [SIGKILL](/blog/npm-err-code-elifecycle-해결법-errno-1134sigkill-원인별-진단)입니다. 메모리 limit을 초과해 커널 OOM killer가 강제 종료한 것이고, describe에 `Reason: OOMKilled`, `Exit Code: 137`로 남습니다([리소스 관리 문서](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)).

**Before (한도가 너무 빡빡)**
```yaml
resources:
  limits:
    memory: "128Mi"
  requests:
    memory: "128Mi"
```

**After (실사용 기반 상향)**
```yaml
resources:
  requests:
    memory: "256Mi"   # 평상시 사용량
  limits:
    memory: "512Mi"   # 피크 여유분
```

근본 해결책은 `kubectl top pod`([metrics-server](https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/) 필요)로 실제 사용량을 측정한 뒤 limit을 맞추는 것입니다. OOM이 잦은 워크로드라면 VPA(Vertical Pod Autoscaler)로 requests/limits를 자동 튜닝하는 것도 최근 많이 쓰는 방법입니다.

### 원인 3. 환경변수 · 시크릿 누락

```bash
kubectl logs <pod> --previous           # "secret not found" / "env XXX is undefined"
kubectl get secret db-credentials        # 시크릿 존재 여부
kubectl describe secret db-credentials  # 키 이름·크기만 확인(값은 출력되지 않음)
```

먼저 구분할 점이 있습니다. 참조한 Secret이 아예 없으면 컨테이너가 시작되지 않으므로 STATUS는 CrashLoopBackOff가 아니라 `CreateContainerConfigError`이고, Events에 `Error: secret "db-credential" not found`가 찍힙니다. kubelet은 Secret이 생길 때까지 주기적으로 다시 시도합니다([Secret 문서](https://kubernetes.io/docs/concepts/configuration/secret/)). CrashLoopBackOff가 되는 건 Secret은 있지만 키 이름이 달라 `envFrom`으로 기대한 환경변수가 비어 있고, 앱이 기동 중 설정 검증에 실패해 죽는 경우입니다. `-o yaml`은 Secret 값(base64)까지 터미널에 출력하므로 키 확인에는 `describe`가 안전합니다.

**Before (Secret 이름 오타 → CreateContainerConfigError)**
```yaml
envFrom:
  - secretRef:
      name: db-credential   # 's' 누락
```

**After**
```yaml
envFrom:
  - secretRef:
      name: db-credentials
```

근본 해결책: 시크릿/ConfigMap을 Pod보다 **먼저** 배포하고, 이름과 키를 `kubectl get secret`으로 대조하세요. 같은 네임스페이스에 있는지도 꼭 확인합니다.

### 원인 4. Liveness Probe 오류

컨테이너 자체는 멀쩡한데, 앱이 다 뜨기도 전에 probe가 실패해서 kubelet이 죽이는 경우입니다.

```
Warning  Unhealthy  kubelet  Liveness probe failed: HTTP probe failed with statuscode: 500
Normal   Killing    kubelet  Container failed liveness probe, will be restarted
```

**Before (기동 시간을 안 줌)**
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 1
  failureThreshold: 1
```

**After (기동 여유 + 임계치 완화)**
```yaml
startupProbe:          # 기동 전용 프로브(1.20 GA): 통과할 때까지 liveness 검사 보류
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 5
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 10
  failureThreshold: 3
  periodSeconds: 10
```

근본 해결책: 기동이 느린 앱은 `startupProbe`로 분리하고, liveness는 "진짜로 죽었을 때만" 발동하도록 보수적으로 설정합니다. startupProbe는 1.20에서 GA가 됐고([기능 게이트 목록](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates-removed/)), 성공할 때까지 liveness·readiness 검사를 미룹니다([프로브 설정 문서](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)). 위 예시는 최대 30×5초=150초까지 기동을 기다립니다.

### 원인 5. 의존 서비스(DB) 연결 실패

```bash
kubectl logs <pod> --previous   # "connection refused" / "dial tcp 10.x:5432"
```

앱이 DB·Redis가 준비되기 전에 떠서 연결 실패로 죽는 케이스입니다.

**해결: initContainer로 의존성 대기**
```yaml
initContainers:
  - name: wait-for-db
    image: busybox:1.36
    command: ['sh', '-c',
      'until nc -z postgres 5432; do echo waiting; sleep 2; done']
```

근본적으로는 **앱에 재시도(backoff retry) 로직**을 넣는 것이 가장 견고합니다. initContainer는 기동 순서를 보장하지만, 운영 중 DB가 잠깐 끊겼을 때의 복원력은 앱 레벨 재시도가 책임집니다.

### 원인 6. ConfigMap 마운트 경로 오류

```bash
kubectl logs <pod> --previous   # "no such file or directory: /config/app.yaml"
kubectl describe pod <pod>      # Volumes / Mounts 확인
```

**Before (subPath 없이 디렉터리째 덮어 기존 파일이 사라짐)**
```yaml
volumeMounts:
  - name: config
    mountPath: /app/config/app.yaml   # 파일을 디렉터리로 마운트
```

**After (subPath로 단일 파일만 주입)**
```yaml
volumeMounts:
  - name: config
    mountPath: /app/config/app.yaml
    subPath: app.yaml
volumes:
  - name: config
    configMap:
      name: app-config
```

근본 해결책: 단일 파일을 주입할 땐 `subPath`를 쓰고, mountPath가 앱이 실제로 읽는 경로와 일치하는지 확인합니다. 단, `subPath`로 마운트한 파일은 ConfigMap을 수정해도 갱신되지 않으므로 변경 후 Pod를 재시작해야 합니다([ConfigMap 문서](https://kubernetes.io/docs/concepts/configuration/configmap/)).

### 원인 7. 잘못된 command / args

이미지 엔트리포인트를 잘못 덮어쓰면 `exec: "xxx": executable file not found`가 뜹니다.

**Before**
```yaml
command: ["python3"]
args: ["app.py"]   # 작업 디렉터리에 app.py가 없음 → 즉시 종료
```

**After**
```yaml
command: ["python3"]
args: ["/app/main.py"]
```

근본 해결책: 이미지의 기본 ENTRYPOINT/CMD를 확인하고, 꼭 필요할 때만 override 하세요.

## Exit Code 해석 표

| Exit Code | 시그널 | 의미 | 먼저 볼 곳 |
|---|---|---|---|
| 0 | - | 정상 종료인데 재시작 | restartPolicy·엔트리포인트가 데몬으로 안 떠 있음 |
| 1 | - | 앱 일반 예외 | `logs --previous` 스택트레이스 |
| 137 | SIGKILL | OOM 또는 강제 종료 | memory limit, `kubectl top` |
| 139 | SIGSEGV | 세그멘테이션 폴트 | 네이티브 라이브러리/아키텍처(arm vs amd) |
| 143 | SIGTERM | 정상 종료 신호 | graceful shutdown 처리, 외부 종료 요인 |

Exit 0인데 재시작한다면 대개 "한 번 실행하고 끝나는 스크립트"를 Deployment로 띄운 경우입니다. 일회성 작업이면 Job으로 바꾸세요.

## 로그가 아예 안 남는 즉시 종료 디버깅

가장 짜증나는 케이스. `--previous`를 쳐도 로그가 비어 있고, 컨테이너가 너무 빨리 죽어 `exec`도 못 들어가는 상황입니다. 이럴 땐 **컨테이너를 일부러 살려두고** 내부를 직접 봅니다.

```yaml
# 임시로 엔트리포인트를 sleep으로 덮어 컨테이너를 살려둠
command: ["sleep", "3600"]
```

이 상태로 배포한 뒤 내부에 들어가 손으로 실행해 봅니다.

```bash
kubectl exec -it <pod> -- sh
# 안에서 직접 실행해 진짜 에러 메시지 확인
/app/entrypoint.sh
```

원본 이미지를 건드리기 싫다면 ephemeral container를 붙이는 `kubectl debug`도 좋습니다.

```bash
kubectl debug -it <pod> --image=busybox:1.36 --target=app -- sh
```

컨테이너가 너무 빨리 죽어 `--target`으로 붙을 수 없다면, 명령을 셸로 바꾼 Pod 사본을 만듭니다. 원본 Pod는 그대로 두고 사본 안에서 엔트리포인트를 손으로 실행해 볼 수 있습니다([공식 디버깅 문서](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/)).

```bash
kubectl debug <pod> -it --copy-to=<pod>-debug --container=app -- sh
# 확인이 끝나면 사본 삭제
kubectl delete pod <pod>-debug
```

> **실무 경험 한마디:** 새벽 장애 대응에서 제가 가장 자주 만난 CrashLoopBackOff 원인은 "환경변수·시크릿 키 설정 오류"와 "OOMKilled"였습니다. 그래서 호출 받으면 무조건 `describe`로 Exit Code부터 봅니다. 137이면 메모리, 설정 관련 메시지면 Secret·ConfigMap, 그 외면 `logs --previous`로 직행합니다.

## 결론: 진단 체크리스트

1. `kubectl get pod` → RESTARTS 카운트와 STATUS 확인
2. `kubectl describe pod` → Events의 `Back-off restarting...`와 Exit Code 확인
3. `kubectl logs <pod> --previous` → 죽은 컨테이너 로그 확보
4. Exit Code로 분기: 137→메모리, 1→앱 예외, secret/env→설정, probe→프로브
5. 로그가 없으면 `command: sleep` override 또는 `kubectl debug`로 내부 진입

이미지를 못 받아오는 ImagePullBackOff는 **2편**, 스케줄링 단계에서 막히는 Pending은 **1편**을 참고하세요. 컨테이너는 떴는데 외부에서 접속이 안 된다면, 다음 **4편 Service/Endpoint 연결 실패 트러블슈팅**에서 이어집니다.


## 참고: 공식 문서

이 글에서 다루는 동작·설정·에러의 1차 출처는 다음 공식 문서입니다. 버전별 옵션과 정확한 동작은 여기서 확인하세요.

- [Pod 라이프사이클: 컨테이너 재시작과 백오프](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-restarts)
- [실행 중인 Pod 디버깅(kubectl debug)](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/)
- [Liveness·Readiness·Startup 프로브 설정](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [컨테이너 리소스 관리(OOMKilled)](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) · [ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/)

## 자주 묻는 질문 (FAQ)

**Q. `kubectl logs --previous`를 쳤는데 "previous terminated container not found"가 나옵니다.**
A. 아직 컨테이너가 재시작되지 않았거나(첫 크래시 직후), 노드가 이전 컨테이너를 정리한 경우입니다. 잠깐 기다렸다가 RESTARTS가 올라간 뒤 다시 치거나, `kubectl describe`의 `Last State` 블록에서 종료 이유를 확인하세요.

**Q. Exit Code 137인데 `kubectl top pod`로 보면 메모리가 limit보다 낮습니다. 왜 OOM이 날까요?**
A. 순간 피크에서 limit을 넘겼다가 죽은 뒤 측정된 값일 수 있습니다. `top`은 현재값만 보여주므로, [Prometheus](/blog/uptime-kuma-vs-netdata-vs-prometheus-소규모-서버-모니터링-추천) 등으로 `container_memory_working_set_bytes`의 피크를 확인하고 limit을 그 위로 올리세요. 137이 SIGKILL이라는 점에서 외부 강제 종료(예: 노드 자원 압박)도 의심해볼 수 있습니다.

**Q. CrashLoopBackOff 상태에서 재시작 간격이 점점 길어지는데 정상인가요?**
A. 정상입니다. kubelet은 재시작 지연을 10초, 20초, 40초…로 두 배씩 늘리고 300초(5분)에서 멈춥니다. 컨테이너가 10분 동안 문제없이 실행되면 백오프 타이머가 리셋되고, RESTARTS 숫자 자체는 그대로 남습니다([Pod 라이프사이클 문서](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-restarts)). 1.35부터 베타(기본 활성)인 `KubeletCrashLoopBackOffMax`를 쓰면 노드별로 최대 지연을 조정할 수 있습니다([기능 게이트 목록](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/)). 간격이 길다고 장애가 심한 건 아니니, 간격보다 **종료 코드와 로그**에 집중하세요.$top4ko$,
  content_evidence = jsonb_set(content_evidence, '{en,content}', to_jsonb($top4en$# Completely Fixing CrashLoopBackOff: Diagnosing 7 Causes of Infinite Pod Restarts

**What this covers:** `kubectl get pod` shows STATUS `CrashLoopBackOff`, and `kubectl describe pod` Events show `Back-off restarting failed container`. The container starts and then dies, so pick the cause from the exit code and the previous container's logs.

| Cause | Check | Fix |
|---|---|---|
| App exception or bad config (Exit 1) | `kubectl logs <pod> --previous` | Fix the code or env var the log points to |
| Memory limit exceeded (`OOMKilled`, Exit 137) | `Last State` in `kubectl describe pod <pod>` | Raise the memory limit or cut usage |
| Liveness probe failing | `Liveness probe failed` in Events | Add a `startupProbe`; relax liveness thresholds |
| Dependency not ready (`connection refused`) | `kubectl logs <pod> --previous` | Retry logic in the app; an initContainer if needed |
| Wrong command or path (`no such file or directory`) | Command and Mounts in `kubectl describe pod <pod>` | Check the image ENTRYPOINT; fix the path or `subPath` |

If a referenced Secret or ConfigMap does not exist at all, the STATUS is `CreateContainerConfigError`, not CrashLoopBackOff (see Cause 3).

## The deploy succeeded, but the Pod keeps restarting

You ran `kubectl get pod` and the STATUS column shows `CrashLoopBackOff`, with the RESTARTS count climbing. This article is for that exact moment.

The first thing to understand is that **CrashLoopBackOff is a symptom, not a root cause**. It simply means the container starts → crashes → Kubernetes restarts it → it crashes again, so kubelet retries with a backoff (delayed retry) interval. The real cause is **why the process died inside the container**.

Part 1 of this series covered [Pending](/blog/kubernetes-pod-pending-원인-7가지-kubectl-describe로-완벽-진단하는-실전-가이드), a scheduling-stage problem (resource shortage, node selectors). Part 2 covered [ImagePullBackOff](/blog/imagepullbackofferrimagepull-원인-6가지-진단해결-가이드), where the image never gets pulled at all. CrashLoopBackOff is one layer deeper: **the image was pulled and the container started, then died immediately**. So the debugging focus is not the scheduler, but the container process's exit code and logs.

## The 1-minute diagnostic routine: describe → logs --previous → Exit Code

Whatever the cause, always start with these three steps. Follow them in order and the scope narrows quickly.

### Step 1: Check Events with describe

```bash
kubectl describe pod my-app-7d9f8-abcde
```

The Events section at the bottom is what matters.

```
Events:
  Type     Reason     Age                From     Message
  ----     ------     ----               ----     -------
  Normal   Pulled     2m                 kubelet  Successfully pulled image
  Normal   Created    2m (x4 over 3m)    kubelet  Created container app
  Normal   Started    2m (x4 over 3m)    kubelet  Started container app
  Warning  BackOff    30s (x8 over 3m)   kubelet  Back-off restarting failed container
```

`Back-off restarting failed container` is the **common signal** for CrashLoopBackOff. When you see it, you know the container started and then died. Now you need to find out *why*.

### Step 2: Capture the dead container's logs with logs --previous

The currently running container may be about to die again, so its logs can be empty. You need the logs from the **previously terminated container**.

```bash
kubectl logs my-app-7d9f8-abcde --previous
# if the Pod has multiple containers
kubectl logs my-app-7d9f8-abcde -c app --previous
```

A lot of people forget `--previous` (short form `-p`) and waste time wondering why there are no logs. It is the first flag to reach for in crash debugging.

### Step 3: Check the Exit Code

Read the exit code from the `Last State` block in the describe output.

```
    Last State:     Terminated
      Reason:       OOMKilled
      Exit Code:    137
```

Also watch the RESTARTS count from `kubectl get pod`. If it spikes quickly, the process is crashing immediately. If the container stays up for a while then dies, you're more likely looking at a memory leak or a probe issue.

### Error message → cause mapping table

| Log / Events message | Likely cause | Jump to |
|---|---|---|
| `Back-off restarting failed container` | Common signal (container crash) | All |
| `OOMKilled` / Exit 137 | Memory limit exceeded | Cause 2 |
| `missing env` / `env XXX is undefined` (app log) | Missing env var or secret key | Cause 3 |
| `Error: secret "xxx" not found` (STATUS `CreateContainerConfigError`) | Referenced Secret does not exist (not CrashLoopBackOff) | Cause 3 |
| `Liveness probe failed` | Probe misconfiguration | Cause 4 |
| `connection refused` / `dial tcp ...` | Dependent service (DB) not ready | Cause 5 |
| `no such file or directory` | Mount path / command error | Causes 6 and 7 |
| Exit 1 + stack trace | Generic application exception | Cause 1 |

## Diagnosing and fixing the 7 causes

### Cause 1. Application exception / entrypoint error (Exit 1)

The most common case. The app throws an exception and dies as soon as it starts.

```bash
kubectl logs <pod> --previous   # check the stack trace
```

The logs will show messages like `NullPointerException`, `Cannot find module`, or `panic:` verbatim. This is an **application bug**, not an infra problem, so the fix is the code or config the logs point to. If you're on the infra side, capture the logs and hand them to the development team as-is.

### Cause 2. OOMKilled (Exit 137)

```bash
kubectl describe pod <pod> | grep -A2 "Last State"   # look for Reason: OOMKilled
kubectl top pod <pod>                                 # actual memory use (needs metrics-server)
```

137 = 128 + 9, i.e. [SIGKILL](/blog/npm-err-code-elifecycle-해결법-errno-1134sigkill-원인별-진단). The kernel OOM killer terminated the process because it exceeded its memory limit, and describe records it as `Reason: OOMKilled`, `Exit Code: 137` ([resource management docs](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)).

**Before (limit too tight)**
```yaml
resources:
  limits:
    memory: "128Mi"
  requests:
    memory: "128Mi"
```

**After (raised based on actual usage)**
```yaml
resources:
  requests:
    memory: "256Mi"   # typical usage
  limits:
    memory: "512Mi"   # headroom for peaks
```

The real fix is to measure actual usage with `kubectl top pod` (requires [metrics-server](https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/)) and set the limit accordingly. For workloads that OOM often, auto-tuning requests/limits with VPA (Vertical Pod Autoscaler) is a common approach these days.

### Cause 3. Missing environment variables or secrets

```bash
kubectl logs <pod> --previous           # "secret not found" / "env XXX is undefined"
kubectl get secret db-credentials        # does the Secret exist?
kubectl describe secret db-credentials  # key names and sizes only (values are not printed)
```

First, tell two cases apart. If the referenced Secret does not exist at all, the container never starts, so the STATUS is `CreateContainerConfigError` rather than CrashLoopBackOff, and Events show `Error: secret "db-credential" not found`. The kubelet keeps retrying until the Secret appears ([Secret docs](https://kubernetes.io/docs/concepts/configuration/secret/)). You get CrashLoopBackOff when the Secret exists but a key name differs, so the env var you expected from `envFrom` is empty and the app dies during its startup config check. `-o yaml` prints the Secret values (base64) to your terminal, so `describe` is the safer way to check keys.

**Before (Secret name typo → CreateContainerConfigError)**
```yaml
envFrom:
  - secretRef:
      name: db-credential   # missing 's'
```

**After**
```yaml
envFrom:
  - secretRef:
      name: db-credentials
```

The real fix: deploy Secrets/ConfigMaps **before** the Pod, and cross-check names and keys with `kubectl get secret`. Also confirm they live in the same namespace.

### Cause 4. Liveness probe failure

The container itself is fine, but the probe fails before the app is fully up, so kubelet kills it.

```
Warning  Unhealthy  kubelet  Liveness probe failed: HTTP probe failed with statuscode: 500
Normal   Killing    kubelet  Container failed liveness probe, will be restarted
```

**Before (no startup grace period)**
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 1
  failureThreshold: 1
```

**After (startup grace + relaxed thresholds)**
```yaml
startupProbe:          # startup-only probe (GA in 1.20): holds off liveness until it passes
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 5
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 10
  failureThreshold: 3
  periodSeconds: 10
```

The real fix: split slow-starting apps onto a `startupProbe`, and configure liveness conservatively so it only fires when the process is actually dead. startupProbe went GA in 1.20 ([feature gate list](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates-removed/)), and it defers liveness and readiness checks until it succeeds ([probe docs](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)). The example above waits up to 30×5 s = 150 s for startup.

### Cause 5. Dependent service (DB) connection failure

```bash
kubectl logs <pod> --previous   # "connection refused" / "dial tcp 10.x:5432"
```

The app comes up before DB or Redis is ready and dies on a connection failure.

**Fix: wait for the dependency with an initContainer**
```yaml
initContainers:
  - name: wait-for-db
    image: busybox:1.36
    command: ['sh', '-c',
      'until nc -z postgres 5432; do echo waiting; sleep 2; done']
```

Fundamentally, putting **backoff retry logic in the app** is the most robust approach. An initContainer guarantees startup order, but resilience when the DB blips during operation is the app-level retry's job.

### Cause 6. ConfigMap mount path error

```bash
kubectl logs <pod> --previous   # "no such file or directory: /config/app.yaml"
kubectl describe pod <pod>      # check Volumes / Mounts
```

**Before (no subPath — mounting a directory overwrites existing files)**
```yaml
volumeMounts:
  - name: config
    mountPath: /app/config/app.yaml   # mounts a directory where a file is expected
```

**After (inject a single file with subPath)**
```yaml
volumeMounts:
  - name: config
    mountPath: /app/config/app.yaml
    subPath: app.yaml
volumes:
  - name: config
    configMap:
      name: app-config
```

The real fix: use `subPath` when injecting a single file, and confirm mountPath matches the path the app actually reads. Note that a file mounted with `subPath` does not receive ConfigMap updates, so restart the Pod after changing the ConfigMap ([ConfigMap docs](https://kubernetes.io/docs/concepts/configuration/configmap/)).

### Cause 7. Wrong command / args

If you override the image entrypoint incorrectly, you'll see `exec: "xxx": executable file not found`.

**Before**
```yaml
command: ["python3"]
args: ["app.py"]   # app.py is not in the working directory → exits immediately
```

**After**
```yaml
command: ["python3"]
args: ["/app/main.py"]
```

The real fix: check the image's default ENTRYPOINT/CMD, and override only when you actually need to.

## Exit code cheat sheet

| Exit Code | Signal | Meaning | Look here first |
|---|---|---|---|
| 0 | - | Exited cleanly but still restarting | restartPolicy / entrypoint is not running as a daemon |
| 1 | - | Generic app exception | `logs --previous` stack trace |
| 137 | SIGKILL | OOM or forced kill | memory limit, `kubectl top` |
| 139 | SIGSEGV | Segmentation fault | Native library / architecture (arm vs amd) |
| 143 | SIGTERM | Graceful termination signal | Graceful shutdown handling, external kill |

If you get Exit 0 but it still restarts, it's usually a "run once and exit" script deployed as a Deployment. Switch one-shot work to a Job.

## Debugging instant exits that leave no logs

The most frustrating case. Even `--previous` returns empty logs, and the container dies too fast to `exec` in. In that situation, **keep the container alive on purpose** and inspect it from the inside.

```yaml
# temporarily override the entrypoint with sleep to keep the container alive
command: ["sleep", "3600"]
```

Deploy it that way, then exec in and run the process by hand.

```bash
kubectl exec -it <pod> -- sh
# run it by hand inside to see the real error message
/app/entrypoint.sh
```

If you don't want to touch the original image, attaching an ephemeral container with `kubectl debug` is also a good option.

```bash
kubectl debug -it <pod> --image=busybox:1.36 --target=app -- sh
```

If the container dies too fast to attach with `--target`, make a copy of the Pod with the command replaced by a shell. The original Pod stays as it is, and you can run the entrypoint by hand inside the copy ([official debugging docs](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/)).

```bash
kubectl debug <pod> -it --copy-to=<pod>-debug --container=app -- sh
# delete the copy when you're done
kubectl delete pod <pod>-debug
```

> **A note from the field:** In overnight incident response, the CrashLoopBackOff causes I ran into most often were "wrong env var or secret key" and "OOMKilled". So when I get paged, I always start with the Exit Code from `describe`. 137 means memory, a config-related message means Secrets/ConfigMaps, otherwise I go straight to `logs --previous`.

## Conclusion: diagnostic checklist

1. `kubectl get pod` → check RESTARTS count and STATUS
2. `kubectl describe pod` → check Events for `Back-off restarting...` and the Exit Code
3. `kubectl logs <pod> --previous` → capture the dead container's logs
4. Branch on Exit Code: 137 → memory, 1 → app exception, secret/env → config, probe → probes
5. If there are no logs, override with `command: sleep` or exec in via `kubectl debug`

For ImagePullBackOff (image never pulled), see **Part 2**. For Pending (stuck at scheduling), see **Part 1**. If the container is up but you can't reach it from outside, that continues in **Part 4: troubleshooting Service/Endpoint connection failures**.


## References: official docs

The primary source for the behavior, settings, and errors covered in this article is the official documentation below. Check it for version-specific options and exact behavior.

- [Pod lifecycle: container restarts and backoff](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-restarts)
- [Debug running Pods (kubectl debug)](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/)
- [Configure liveness, readiness, and startup probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Resource management for containers (OOMKilled)](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/) · [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)

## FAQ

**Q. I ran `kubectl logs --previous` and got "previous terminated container not found".**
A. Either the container hasn't restarted yet (right after the first crash), or the node already cleaned up the previous container. Wait until RESTARTS increments and try again, or check the termination reason in the `Last State` block of `kubectl describe`.

**Q. Exit Code is 137, but `kubectl top pod` shows memory below the limit. Why did it OOM?**
A. It may have spiked over the limit and died, and you're looking at the post-death measurement. `top` only shows the current value, so check the peak of `container_memory_working_set_bytes` with [Prometheus](/blog/uptime-kuma-vs-netdata-vs-prometheus-소규모-서버-모니터링-추천) or similar and raise the limit above that. Because 137 is SIGKILL, also consider an external kill (e.g. node resource pressure).

**Q. In CrashLoopBackOff, the restart interval keeps getting longer. Is that normal?**
A. Yes. The kubelet doubles the restart delay (10 s, 20 s, 40 s, …) and caps it at 300 s (5 minutes). Once a container runs for 10 minutes without problems, the backoff timer resets; the RESTARTS number itself stays ([Pod lifecycle docs](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-restarts)). From 1.35, the `KubeletCrashLoopBackOffMax` feature (beta, enabled by default) lets you tune the maximum delay per node ([feature gate list](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/)). A long interval does not mean a worse outage — focus on the **exit code and logs**, not the gap.$top4en$::text))
    || jsonb_build_object('contentUpdatedAt', '2026-10-06', 'changeSummary', $top4s$상단에 상태 원문과 원인→확인 명령→해결 표 추가. 근거 없는 수치(90%·70%·절반) 삭제, Secret 부재는 CreateContainerConfigError라는 점 정정, Secret 값이 출력되는 -o yaml 대신 describe 사용, startupProbe 1.20 GA로 정정, 백오프 10초~300초·10분 리셋·KubeletCrashLoopBackOffMax 반영, subPath 갱신 불가와 kubectl debug --copy-to 추가.$top4s$::text, 'officialSources', $top4j$[{"label": "Pod Lifecycle", "url": "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-restarts"}, {"label": "Debug Running Pods", "url": "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/"}, {"label": "Configure Liveness, Readiness and Startup Probes", "url": "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"}, {"label": "Resource Management for Pods and Containers", "url": "https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/"}, {"label": "Secrets", "url": "https://kubernetes.io/docs/concepts/configuration/secret/"}, {"label": "ConfigMaps", "url": "https://kubernetes.io/docs/concepts/configuration/configmap/"}]$top4j$::jsonb)
WHERE id = 590
  AND md5(content) = '3370cb012fd51446876769d6bc8bcd3f'
  AND md5(content_evidence->'en'->>'content') = '5074aa65e90a84844b500e62f834c71e';
COMMIT;
