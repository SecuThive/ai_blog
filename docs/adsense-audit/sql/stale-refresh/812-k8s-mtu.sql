-- stale-refresh 2026-10-04 post #812 쿠버네티스-mtu-문제-진단법-ping은-되는데-큰-응답만-멈출-때
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$## ping은 100% 응답하는데 curl이 40KB에서 멈춘다

이번 편의 증상은 앞선 편들과 결이 다릅니다. 연결이 아예 안 되는 게 아니라, **연결은 완벽하게 되는데 특정 크기부터만** 멈춥니다.

전형적인 재현 로그는 이렇습니다.

```bash
# 1) ping 완전 정상
$ kubectl exec -it client-pod -- ping -c 4 10.244.2.15
PING 10.244.2.15 (10.244.2.15) 56(84) bytes of data.
64 bytes from 10.244.2.15: icmp_seq=1 ttl=62 time=0.412 ms
64 bytes from 10.244.2.15: icmp_seq=2 ttl=62 time=0.388 ms
--- 10.244.2.15 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss

# 2) 작은 응답 정상 (약 200B)
$ kubectl exec -it client-pod -- curl -s -o /dev/null -w '%{http_code} %{size_download}\n' \
    http://api-svc/health
200 187

# 3) 큰 응답 무한 대기 (약 80KB)
$ kubectl exec -it client-pod -- curl -v --max-time 10 http://api-svc/api/list
* Connected to api-svc (10.96.31.7) port 80 (#0)
> GET /api/list HTTP/1.1
> Host: api-svc
>
< HTTP/1.1 200 OK
< Content-Type: application/json
< Transfer-Encoding: chunked
<
* Operation timed out after 10001 milliseconds with 8192 bytes received
```

TLS를 쓰면 더 헷갈립니다. 인증서 체인이 큰 경우 Client Hello는 나가는데 Server Hello가 오지 않고 그대로 멈춥니다.

```bash
$ kubectl exec -it client-pod -- openssl s_client -connect internal-api:443 -servername internal-api
CONNECTED(00000003)
write to 0x... [0x...] (318 bytes => 318 (0x13E))
# ... 여기서 아무것도 오지 않고 정지
```

이 상태에서 개발팀은 "서버가 느리다"고 하고, 인프라팀은 "앱에서 응답을 못 만드는 것"이라고 합니다. 양쪽 다 틀렸습니다. **HTTP 헤더는 넘어왔고 바디 일부(8192B)도 받았다**는 사실이 이미 답을 가리키고 있습니다. 연결과 초기 교환은 성공했는데 큰 세그먼트 하나가 링크를 못 넘어간 겁니다.

앞선 편들이 다룬 "전부 아니면 전무" 실패(연결 거부, 이름 해석 실패, 백엔드 부재)와 달리 이번 계열은 **크기 경계에서만** 발생합니다. 그래서 재현이 불규칙해 보이고, 오진 기간이 며칠 단위로 길어집니다.

### 504 Gateway Time-out 계열과의 결정적 차이

혼동하기 쉬운 게 504입니다. 구분은 명확합니다.

| 구분 | 504 타임아웃 계열 | 이번 편(MTU 계열) |
|---|---|---|
| 실패 원인 계층 | 프록시·백엔드 타임아웃 값 불일치 | 패킷이 링크를 물리적으로 못 넘어감 |
| 타임아웃 값 증설 | 효과 있음 (정렬하면 해결) | **효과 없음** (무한정 기다려도 못 옴) |
| 응답 크기 의존성 | 없음 (느린 쿼리면 작은 응답도 504) | 있음 (작은 응답은 항상 성공) |
| 에러 형태 | 명시적 504 응답 | 응답 없이 hang → 클라이언트 타임아웃 |

**타임아웃 값을 아무리 늘려도 개선이 0이면 이번 편 쪽**입니다.

## 증상 지문 판정표: MTU가 아닌 것부터 쳐낸다

MTU를 의심하기 전에 배제해야 할 원인들이 있습니다.

| 증상 지문 | MTU 의심도 | 대체 원인과 1차 확인 명령 |
|---|---|---|
| ① ping OK + 작은 요청 OK + 큰 응답만 hang | **매우 높음** | 사실상 MTU 확정선. `ping -M do -s 1472 <IP>` |
| ② TLS Client Hello 이후 무응답(인증서 체인 큼) | **매우 높음** | Server Hello가 MTU 초과. `openssl s_client -connect ...` |
| ③ 특정 노드 쌍에서만 발생, 동일 노드 Pod끼리는 정상 | **높음** | 노드 간 캡슐화 경로만 문제. `ip link show \| grep -E 'vxlan\|flannel\|cilium'` |
| ④ VPN·WireGuard 경유 시에만 발생 | **높음** | 암호화 오버헤드 중첩. `wg show`, `ip link show wg0` |
| ⑤ 간헐적이고 요청 크기와 무관 | 낮음 | conntrack table full → `dmesg \| grep nf_conntrack` / NetworkPolicy는 크기 무관 전면 차단 |
| ⑥ 일정 시간 경과 후 끊김(크기 아닌 시간 기준) | 낮음 | keepalive·idle timeout, ingress proxy buffer. `kubectl describe ingress` |

⑤의 conntrack 대조군은 이렇게 확인됩니다. 이 로그가 보이면 MTU 라인에서 빠지세요.

```bash
$ dmesg -T | grep -i conntrack
[Mon Aug 24 09:12:31 2026] nf_conntrack: nf_conntrack: table full, dropping packet
$ sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max
net.netfilter.nf_conntrack_count = 262144
net.netfilter.nf_conntrack_max = 262144
```

배제 대상 주제들은 각각 별도 글에서 다룹니다. 크기와 무관하게 연결 자체가 거부되면 [kubectl get endpoints \<none\>·Service connection refused 5분 진단](/blog/kubectl-get-endpoints-noneservice-connection-refused-5분-진단)을, 헬스체크 계열이 함께 흔들리면 [K8s Liveness/Readiness probe failed·connection refused 원인별 해결](/blog/k8s-livenessreadiness-probe-failedconnection-refused-원인별-해결)을 참고하세요.

## 30초 판별 명령 시퀀스: 통과 MTU 이분 탐색

핵심은 **노드에서와 Pod 안에서 각각 실행**하는 것입니다. 노드는 물리 NIC 경로를, Pod는 veth → cni0 → 터널 인터페이스를 거치는 완전히 다른 경로를 탑니다. 노드에서만 확인하고 "정상"이라 판단하는 게 가장 흔한 오진입니다.

### 1단계 — DF 비트 고정 ping 이분 탐색 (약 10초)

```bash
# Pod 안에서 실행. -M do = Don't Fragment 고정
$ kubectl exec -it client-pod -- ping -M do -s 1472 -c 1 10.244.2.15
PING 10.244.2.15 (10.244.2.15) 1472(1500) bytes of data.
ping: local error: message too long, mtu=1450

$ kubectl exec -it client-pod -- ping -M do -s 1422 -c 1 10.244.2.15
1430 bytes from 10.244.2.15: icmp_seq=1 ttl=62 time=0.51 ms
```

**예상 정상 결과**: 통과 가능한 최대 `-s` 값 + 28(IP 20 + ICMP 8) = 실제 경로 MTU.
위 예시는 1422 + 28 = **1450**. 인터페이스는 1500이라고 주장하는데 실제로는 1450만 넘어가는 상태입니다.

경로 중간 장비가 응답하는 경우는 메시지가 다릅니다.

```bash
From 10.0.1.1 icmp_seq=1 Frag needed and DF set (mtu = 1450)
```

이 메시지가 보이면 오히려 다행입니다. **PMTUD가 살아있다**는 뜻이고, 5번 섹션의 블랙홀 시나리오는 아닙니다.

### 2단계 — 인터페이스 MTU 불일치 지점 찾기 (약 10초)

```bash
# 노드에서
$ ip link show | grep -E '^[0-9]+:|mtu' | grep -E 'eth0|cni0|flannel|vxlan|cilium|tunl'
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP
4: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN
5: cni0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
7: vethb31a4f2@if3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 ...
```

**여기가 범인입니다.** `flannel.1`은 1450인데 `cni0`와 `veth`는 1500입니다. Pod는 1500짜리 프레임을 만들어 보내고, VXLAN 캡슐화 시점에 1500 + 50 = 1550이 되어 물리 NIC 1500을 초과합니다.

정상적으로 정렬된 클러스터라면 이렇게 보여야 합니다.

```
2: eth0: ... mtu 1500
4: flannel.1: ... mtu 1450
5: cni0: ... mtu 1450
7: vethb31a4f2@if3: ... mtu 1450
```

Pod 안에서도 반드시 확인하세요.

```bash
$ kubectl exec -it client-pod -- ip link show eth0
3: eth0@if7: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
```

Pod 내부가 1500으로 남아 있으면 CNI 설정을 고쳤더라도 **기존 Pod에는 반영되지 않은 상태**입니다.

### 3단계 — 경로상 축소 지점 특정

```bash
$ kubectl exec -it client-pod -- tracepath 10.244.2.15
 1?: [LOCALHOST]      pmtu 1500
 1:  10.244.1.1       0.132ms
 2:  10.0.1.1         0.418ms pmtu 1450
 3:  10.244.2.15      0.522ms reached
     Resume: pmtu 1450 hops 3 back 3
```

`pmtu` 값이 떨어지는 홉이 축소 지점입니다.

### 4단계 — hang 시작 경계 확정

응답 크기를 파라미터로 조절할 수 있는 엔드포인트가 있다면 경계를 직접 찍습니다.

```bash
$ for n in 500 1000 1400 1500 2000; do
    echo -n "size=$n -> "
    kubectl exec -it client-pod -- curl -s --max-time 5 \
      -o /dev/null -w '%{http_code}\n' "http://api-svc/echo?bytes=$n" || echo TIMEOUT
  done
size=500  -> 200
size=1000 -> 200
size=1400 -> 200
size=1500 -> TIMEOUT
size=2000 -> TIMEOUT
```

**1400은 되고 1500부터 죽는다** — 이 경계가 나오면 진단 종료입니다. 이제 값 계산으로 넘어갑니다.

### 5단계 — 3방향 매트릭스로 구간 좁히기

| 경로 | 테스트 명령 | 실패 시 의미 |
|---|---|---|
| 같은 노드 Pod ↔ Pod | 동일 노드 Pod IP로 `ping -M do -s 1472` | 캡슐화 미경유인데 실패 → 브리지/veth MTU 설정 오류 |
| Pod ↔ 노드 IP | Pod에서 노드 IP로 동일 명령 | veth ↔ 호스트 NIC 불일치 |
| 노드 ↔ 노드 | 노드에서 다른 노드 IP로 동일 명령 | 언더레이(클라우드 VPC·물리 스위치) MTU 문제 |

**같은 노드 Pod끼리는 되는데 다른 노드 Pod와만 안 된다** → 터널 인터페이스 오버헤드 계산 문제로 확정입니다. 가장 흔한 패턴입니다.

## CNI별 오버헤드 계산표와 조치

산식은 단순합니다.

```
Pod MTU = 기저 링크 MTU − 캡슐화 오버헤드 (중첩 시 오버헤드 합산)
```

### 캡슐화 오버헤드

| 캡슐화 방식 | 오버헤드 | 비고 |
|---|---|---|
| Flannel VXLAN | 50 B | 기본값 |
| Flannel host-gw | 0 B | 캡슐화 없음, L2 인접 필요 |
| Calico IPIP | 20 B | 기본 모드 |
| Calico VXLAN | 50 B | IPv4 기준 |
| Cilium VXLAN | 50 B | |
| Cilium Geneve | 50 B 이상 | 옵션 헤더 따라 증가 |
| WireGuard 암호화 | IPv4 60 B / IPv6 80 B | Calico는 합산하지 않고 이 값만 뺌(문서 권장). 다른 CNI는 해당 문서로 확인 |

### 클라우드 기저 MTU × CNI 교차 계산표

| 기저 MTU | Flannel VXLAN | Calico IPIP | Calico VXLAN | Cilium VXLAN | Cilium VXLAN + WireGuard |
|---|---|---|---|---|---|
| AWS 9001 (점보) | 8951 | 8981 | 8951 | 8951 | 8871 (−80 기준) |
| AWS/온프렘 1500 | 1450 | 1480 | 1450 | 1450 | 1370 |
| GCP 1460 | **1410** | 1440 | 1410 | 1410 | 1330 |
| VPN 경유 1400 | 1350 | 1380 | 1350 | 1350 | 1270 |

GCP에서 사고가 나는 전형적인 경우가 여기 있습니다. GCP VPC의 기본 MTU는 1460인데([GCP MTU 문서](https://cloud.google.com/vpc/docs/mtu)), 1500 환경에서 쓰던 MTU 1450을 고정값으로 넣어 두면 10바이트가 초과합니다. 정답은 **1410**입니다. Flannel과 Calico는 MTU를 지정하지 않으면 노드 인터페이스를 기준으로 자동 계산하므로([Flannel 설정 문서](https://github.com/flannel-io/flannel/blob/master/Documentation/configuration.md)), 고정값을 넣은 적이 있는지부터 확인하세요.

하이브리드 클러스터(AWS 점보 9001 노드 + 온프렘 1500 노드)에서는 **가장 작은 기저 MTU를 기준**으로 잡아야 합니다.

### Flannel 설정

```bash
$ kubectl edit configmap kube-flannel-cfg -n kube-flannel
```

```json
{
  "Network": "10.244.0.0/16",
  "Backend": {
    "Type": "vxlan",
    "MTU": 1410
  }
}
```

**재기동 범위**: DaemonSet 재시작 → 그 다음 워크로드 Pod 롤아웃까지 필요합니다.

```bash
$ kubectl rollout restart daemonset kube-flannel-ds -n kube-flannel
$ kubectl rollout restart deployment -n <앱 네임스페이스> --all
```

CNI DaemonSet만 재시작하면 `flannel.1`은 바뀌지만 **기존 Pod의 veth는 그대로 1500**입니다. veth는 Pod 샌드박스 생성 시점에 만들어지므로 Pod 재생성이 있어야 반영됩니다. 이 지점을 놓쳐서 "설정 바꿨는데 안 낫는다"고 결론 내리는 경우가 많습니다.

### Calico 설정

Calico는 기본적으로 노드 설정과 켜 둔 캡슐화 모드를 보고 MTU를 자동 감지합니다. 자동 감지 값이 맞지 않을 때만 명시 값을 넣고, 바뀐 MTU는 새 워크로드에만 적용됩니다([Calico MTU 문서](https://docs.tigera.io/calico/latest/networking/configuring/mtu)). operator로 설치했다면 Installation 리소스를 고칩니다.

```bash
$ kubectl patch installation.operator.tigera.io default --type merge \
  -p '{"spec":{"calicoNetwork":{"mtu":1410}}}'
```

매니페스트로 설치했다면 아래처럼 `calico-config`를 고칩니다.

```bash
$ kubectl patch configmap calico-config -n kube-system \
  --type merge -p '{"data":{"veth_mtu":"1410"}}'

# IPIP 모드 터널 MTU
$ kubectl set env daemonset/calico-node -n kube-system FELIX_IPINIPMTU=1440
# VXLAN 모드
$ kubectl set env daemonset/calico-node -n kube-system FELIX_VXLANMTU=1410
$ kubectl rollout restart daemonset calico-node -n kube-system
```

**재기동 범위**: `calico-node` 재시작 후 워크로드 Pod 롤아웃 필수.

### Cilium 설정

```bash
$ helm upgrade cilium cilium/cilium \
  --namespace kube-system --reuse-values \
  --set MTU=1410

$ kubectl rollout restart daemonset cilium -n kube-system
$ kubectl rollout restart deployment -n <앱 네임스페이스> --all
```

WireGuard 노드 간 암호화(`encryption.enabled=true`, `encryption.type=wireguard`)를 함께 쓰면 WireGuard 오버헤드도 반영해야 합니다. 계산 방식은 CNI마다 다르므로(Calico는 캡슐화와 합산하지 않음) 켜 둔 옵션을 전부 나열한 뒤 해당 CNI 문서로 확인하세요.

### 반영 검증

```bash
# 새로 뜬 Pod에서 확인
$ kubectl exec -it <신규-pod> -- ip link show eth0
3: eth0@if11: ... mtu 1410 ...

$ kubectl exec -it <신규-pod> -- ping -M do -s 1382 -c 1 <상대 Pod IP>
1390 bytes from ...: icmp_seq=1 ttl=62 time=0.44 ms
```

### MTU를 못 바꾸는 상황: MSS clamping

관리형 CNI라 변경이 막혀 있거나 변경 승인이 안 나는 경우, 노드에서 TCP MSS를 경로 MTU에 맞춰 강제로 낮출 수 있습니다.

```bash
# 모든 노드에서 실행 (SYN 패킷의 MSS를 경로 MTU에 맞춤)
sudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \
  -j TCPMSS --clamp-mss-to-pmtu

# PMTUD가 아예 안 되는 환경이면 고정값으로
sudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \
  -j TCPMSS --set-mss 1370

# 확인
sudo iptables -t mangle -L FORWARD -n -v | grep TCPMSS
```

**한계는 분명합니다.**

- **TCP에만 적용됩니다.** SYN 패킷의 MSS 옵션을 고쳐 쓰는 방식이라 UDP는 대상이 아닙니다.
- **QUIC(HTTP/3)에는 무효**입니다. UDP 기반이라 MSS 개념 자체가 없습니다. gRPC over HTTP/3, DoQ 등을 쓴다면 근본 MTU 조정이 유일한 해법입니다.
- DNS(UDP 53)의 큰 응답, VXLAN 안의 UDP 트래픽도 보호되지 않습니다.
- 재부팅 시 사라지므로 `iptables-persistent`나 부팅 스크립트로 영속화해야 합니다.

## 실패 분기: MTU를 낮췄는데도 여전할 때

계산표대로 맞추고 Pod까지 재생성했는데 증상이 그대로라면, PMTUD 블랙홀을 의심합니다.

원리는 이렇습니다. 경로 중간 장비가 "이 패킷 너무 크다"고 알려주는 신호가 **ICMP type 3 code 4 (Destination Unreachable / Fragmentation Needed)**입니다. 이게 방화벽에서 드롭되면 송신 측은 축소를 학습하지 못하고, 계속 큰 패킷을 보내다 조용히 사라집니다. 에러 로그도 남지 않습니다.

### 확인 방법

```bash
# 송신 노드에서 ICMP 수신 여부 관찰
$ sudo tcpdump -ni any 'icmp[icmptype] == 3 and icmp[icmpcode] == 4' -c 5
listening on any, link-type LINUX_SLL (Linux cooked v1)
0 packets captured
```

큰 패킷을 계속 보내는데 **0 packets captured**면 블랙홀 확정입니다. 정상이라면 아래처럼 잡혀야 합니다.

```
10:14:22.331 IP 10.0.1.1 > 10.0.2.31: ICMP 10.244.2.15 unreachable -
  need to frag (mtu 1450), length 556
```

커널이 학습한 PMTU 캐시도 확인합니다.

```bash
$ ip route get 10.244.2.15
10.244.2.15 via 10.0.1.1 dev eth0 src 10.0.2.31 mtu 1450
```

`mtu` 항목이 아예 안 붙으면 학습이 안 된 상태입니다.

### 국내 환경 ICMP 정책 체크포인트

ICMP를 통째로 막아 두는 보안 정책 때문에 발생하는 경우가 많습니다. 아래를 순서대로 확인하세요.

| 확인 대상 | 체크포인트 |
|---|---|
| NCP ACG | Inbound/Outbound 규칙에 ICMP 프로토콜 허용 항목이 존재하는지 |
| NCP Network ACL | 서브넷 단위 ACL에서 ICMP가 Deny로 잡혀 있지 않은지 |
| KT클라우드 방화벽 | 방화벽 정책에 ICMP 허용 룰 유무, VPC 간 통신 구간 별도 확인 |
| AWS Security Group | `ICMP - Destination Unreachable (type 3)` 허용 여부 |
| 사내 방화벽·UTM | ICMP 전면 차단 정책, type 3 code 4 예외 등록 여부 |
| DPI·IPS 장비 | ICMP 페이로드 검사로 인한 선택적 드롭 여부 |

정책 변경 승인이 어렵거나 통제 밖 경로가 섞여 있다면, **MSS clamping이 사실상 유일한 실전 해법**입니다. PMTUD에 의존하지 않고 연결 수립 시점에 크기를 확정해 버리기 때문입니다. 단, 앞서 말한 UDP/QUIC 한계는 그대로 남습니다.

### 재발 방지

- CNI 설치 시 MTU를 **명시적으로 고정**합니다. 자동 감지에 맡기면 노드 교체·클라우드 변경 시 조용히 어긋납니다.
- 노드 추가 시 `ip link show`로 MTU 정렬을 확인하는 절차를 노드 부트스트랩 체크리스트에 넣습니다.
- 하이브리드 클러스터는 **최소 기저 MTU 기준**으로 통일합니다.
- 합성 모니터링에 "8KB 이상 응답을 받는 요청"을 하나 넣어 두면 크기 경계 회귀를 조기에 잡을 수 있습니다.
- WireGuard·VPN을 새로 켤 때는 반드시 오버헤드를 재계산합니다.

### 요약 체크리스트

1. **증상 판정** — ping OK + 작은 요청 OK + 큰 응답만 hang인가? conntrack·NetworkPolicy 배제했는가?
2. **3방향 매트릭스** — 같은 노드 / Pod↔노드 / 노드↔노드 중 어디서 깨지는가?
3. **계산표 대입** — 기저 MTU − 캡슐화 오버헤드(중첩 합산) = 목표 Pod MTU
4. **설정 반영** — CNI 설정 변경 + DaemonSet 재시작 + **워크로드 Pod 롤아웃까지**
5. **PMTUD 확인** — ICMP type 3 code 4가 실제로 도달하는가? 아니면 MSS clamping

## 자주 묻는 질문 (FAQ)

**Q. ping은 잘 되는데 왜 MTU 문제일 수 있나요?**
A. 기본 ping은 페이로드 56바이트(총 84바이트)라 어떤 MTU에서도 통과합니다. MTU 문제는 링크 한계를 넘는 큰 패킷에서만 드러나므로, `ping -M do -s 1472`처럼 DF 비트를 세우고 크기를 키워 테스트해야 확인됩니다.

**Q. curl 타임아웃을 늘리면 해결되나요?**
A. 안 됩니다. 패킷이 링크를 넘어가지 못하는 것이므로 아무리 기다려도 도착하지 않습니다. 타임아웃 값 조정으로 개선되는 건 프록시·백엔드 타임아웃이 어긋난 504 계열이고, 이번 증상과는 원인 계층이 다릅니다.

**Q. MTU를 바꿨는데도 그대로입니다. 무엇을 놓쳤나요?**
A. 두 가지가 대표적입니다. 첫째, CNI DaemonSet만 재시작하고 워크로드 Pod를 롤아웃하지 않아 기존 veth가 옛 MTU로 남아 있는 경우(`kubectl exec -- ip link show eth0`으로 확인). 둘째, ICMP type 3 code 4가 방화벽에서 드롭돼 PMTUD가 블랙홀인 경우이며, 이때는 MSS clamping이 필요합니다.

## 출처 · 확인일 2026-10-04
- [Calico, Configure MTU](https://docs.tigera.io/calico/latest/networking/configuring/mtu) — 헤더 크기 IPIP 20 B, VXLAN IPv4 50 B / IPv6 70 B, WireGuard IPv4 60 B / IPv6 80 B, GCE 1460 기준 IPIP 1440·VXLAN 1410, MTU 자동 감지, operator `calicoNetwork.mtu`
- [Flannel, Configuration](https://github.com/flannel-io/flannel/blob/master/Documentation/configuration.md) — MTU 자동 계산 후 subnet.env에 기록
- [Flannel, Backends](https://github.com/flannel-io/flannel/blob/master/Documentation/backends.md) — vxlan 백엔드 `MTU` 설정
- [Google Cloud, Maximum transmission unit](https://cloud.google.com/vpc/docs/mtu) — VPC 기본 MTU 1460$sr$, content_evidence=jsonb_set($j${"en": {"title": "Diagnosing Kubernetes MTU Issues — When ping Works but Large Responses Hang", "content": "## ping replies 100% of the time, but curl hangs at 40KB\n\nThe symptoms in this installment are a different flavor from the previous ones. The connection isn't failing outright — **the connection succeeds perfectly, then hangs only past a certain size**.\n\nA typical reproduction log looks like this.\n\n```bash\n# 1) ping 완전 정상\n$ kubectl exec -it client-pod -- ping -c 4 10.244.2.15\nPING 10.244.2.15 (10.244.2.15) 56(84) bytes of data.\n64 bytes from 10.244.2.15: icmp_seq=1 ttl=62 time=0.412 ms\n64 bytes from 10.244.2.15: icmp_seq=2 ttl=62 time=0.388 ms\n--- 10.244.2.15 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss\n\n# 2) 작은 응답 정상 (약 200B)\n$ kubectl exec -it client-pod -- curl -s -o /dev/null -w '%{http_code} %{size_download}\\n' \\\n    http://api-svc/health\n200 187\n\n# 3) 큰 응답 무한 대기 (약 80KB)\n$ kubectl exec -it client-pod -- curl -v --max-time 10 http://api-svc/api/list\n* Connected to api-svc (10.96.31.7) port 80 (#0)\n> GET /api/list HTTP/1.1\n> Host: api-svc\n>\n< HTTP/1.1 200 OK\n< Content-Type: application/json\n< Transfer-Encoding: chunked\n<\n* Operation timed out after 10001 milliseconds with 8192 bytes received\n```\n\nTLS makes it even more confusing. When the certificate chain is large, Client Hello goes out but Server Hello never arrives — it just stalls.\n\n```bash\n$ kubectl exec -it client-pod -- openssl s_client -connect internal-api:443 -servername internal-api\nCONNECTED(00000003)\nwrite to 0x... [0x...] (318 bytes => 318 (0x13E))\n# ... 여기서 아무것도 오지 않고 정지\n```\n\nAt this point the app team says \"the server is slow\" and the infra team says \"the app isn't producing a response.\" Both are wrong. The fact that **the HTTP headers arrived and part of the body (8192B) was received** already points to the answer. The connection and the initial exchange succeeded; one large segment simply couldn't cross the link.\n\nUnlike the all-or-nothing failures covered in earlier posts (connection refused, name resolution failure, missing backends), this class of issue occurs **only at a size boundary**. That's why reproduction looks flaky and misdiagnosis stretches into days.\n\n### The decisive difference from 504 Gateway Time-out\n\n504 is easy to confuse with this. The distinction is clear.\n\n| Distinction | 504 timeout class | This post (MTU class) |\n|---|---|---|\n| Failure layer | Proxy/backend timeout mismatch | Packet physically cannot cross the link |\n| Raising timeouts | Effective (align them and it resolves) | **No effect** (it never arrives no matter how long you wait) |\n| Response-size dependency | None (a slow query 504s even on a small response) | Yes (small responses always succeed) |\n| Error shape | Explicit 504 response | Hang with no response → client timeout |\n\n**If raising timeouts yields zero improvement, you're in this post's territory.**\n\n## Symptom fingerprint table: rule out non-MTU causes first\n\nThere are causes you should exclude before you suspect MTU.\n\n| Symptom fingerprint | MTU suspicion | Alternate cause and first-check command |\n|---|---|---|\n| ① ping OK + small request OK + hang only on large response | **Very high** | Effectively an MTU smoking gun. `ping -M do -s 1472 <IP>` |\n| ② No response after TLS Client Hello (large cert chain) | **Very high** | Server Hello exceeds MTU. `openssl s_client -connect ...` |\n| ③ Only between a specific node pair; Pods on the same node are fine | **High** | Only the inter-node encapsulation path is broken. `ip link show \\| grep -E 'vxlan\\|flannel\\|cilium'` |\n| ④ Only when traffic goes through VPN/WireGuard | **High** | Stacked encryption overhead. `wg show`, `ip link show wg0` |\n| ⑤ Intermittent and independent of request size | Low | conntrack table full → `dmesg \\| grep nf_conntrack` / NetworkPolicy is a size-independent full block |\n| ⑥ Drops after a fixed elapsed time (time-based, not size-based) | Low | keepalive/idle timeout, ingress proxy buffer. `kubectl describe ingress` |\n\nThe conntrack control case for ⑤ looks like this. If you see this log, drop off the MTU path.\n\n```bash\n$ dmesg -T | grep -i conntrack\n[Mon Aug 24 09:12:31 2026] nf_conntrack: nf_conntrack: table full, dropping packet\n$ sysctl net.netfilter.nf_conntrack_count net.netfilter.nf_conntrack_max\nnet.netfilter.nf_conntrack_count = 262144\nnet.netfilter.nf_conntrack_max = 262144\n```\n\nThe topics being ruled out are covered in separate posts. If the connection itself is refused regardless of size, see [kubectl get endpoints \\<none\\>·Service connection refused 5-minute diagnosis](/blog/kubectl-get-endpoints-noneservice-connection-refused-5분-진단). If health-check issues are shaking at the same time, see [K8s Liveness/Readiness probe failed·connection refused — causes and fixes](/blog/k8s-livenessreadiness-probe-failedconnection-refused-원인별-해결).\n\n## 30-second identification sequence: binary-search the path MTU\n\nThe key is to **run this both on the node and inside the Pod**. The node takes the physical NIC path; the Pod takes a completely different path through veth → cni0 → tunnel interface. Checking only on the node and declaring things \"fine\" is the most common misdiagnosis.\n\n### Step 1 — DF-bit ping binary search (~10 seconds)\n\n```bash\n# Pod 안에서 실행. -M do = Don't Fragment 고정\n$ kubectl exec -it client-pod -- ping -M do -s 1472 -c 1 10.244.2.15\nPING 10.244.2.15 (10.244.2.15) 1472(1500) bytes of data.\nping: local error: message too long, mtu=1450\n\n$ kubectl exec -it client-pod -- ping -M do -s 1422 -c 1 10.244.2.15\n1430 bytes from 10.244.2.15: icmp_seq=1 ttl=62 time=0.51 ms\n```\n\n**Expected healthy result**: largest passing `-s` value + 28 (IP 20 + ICMP 8) = actual path MTU.\nIn the example above, 1422 + 28 = **1450**. The interface claims 1500, but only 1450 actually gets through.\n\nWhen an intermediate device on the path replies, the message is different.\n\n```bash\nFrom 10.0.1.1 icmp_seq=1 Frag needed and DF set (mtu = 1450)\n```\n\nIf you see this message, you're actually lucky. It means **PMTUD is alive**, and you are not in the black-hole scenario in section 5.\n\n### Step 2 — Find the interface MTU mismatch (~10 seconds)\n\n```bash\n# 노드에서\n$ ip link show | grep -E '^[0-9]+:|mtu' | grep -E 'eth0|cni0|flannel|vxlan|cilium|tunl'\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP\n4: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UNKNOWN\n5: cni0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP\n7: vethb31a4f2@if3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 ...\n```\n\n**This is the culprit.** `flannel.1` is 1450, but `cni0` and `veth` are 1500. The Pod builds a 1500-byte frame; at VXLAN encapsulation time that becomes 1500 + 50 = 1550, which exceeds the physical NIC's 1500.\n\nA correctly aligned cluster should look like this.\n\n```\n2: eth0: ... mtu 1500\n4: flannel.1: ... mtu 1450\n5: cni0: ... mtu 1450\n7: vethb31a4f2@if3: ... mtu 1450\n```\n\nAlways check inside the Pod as well.\n\n```bash\n$ kubectl exec -it client-pod -- ip link show eth0\n3: eth0@if7: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP\n```\n\nIf the Pod interior is still 1500, then even if you already fixed the CNI config, **existing Pods have not picked it up**.\n\n### Step 3 — Pinpoint the shrink hop on the path\n\n```bash\n$ kubectl exec -it client-pod -- tracepath 10.244.2.15\n 1?: [LOCALHOST]      pmtu 1500\n 1:  10.244.1.1       0.132ms\n 2:  10.0.1.1         0.418ms pmtu 1450\n 3:  10.244.2.15      0.522ms reached\n     Resume: pmtu 1450 hops 3 back 3\n```\n\nThe hop where the `pmtu` value drops is the shrink point.\n\n### Step 4 — Confirm the hang-start boundary\n\nIf you have an endpoint that lets you control response size as a parameter, hit the boundary directly.\n\n```bash\n$ for n in 500 1000 1400 1500 2000; do\n    echo -n \"size=$n -> \"\n    kubectl exec -it client-pod -- curl -s --max-time 5 \\\n      -o /dev/null -w '%{http_code}\\n' \"http://api-svc/echo?bytes=$n\" || echo TIMEOUT\n  done\nsize=500  -> 200\nsize=1000 -> 200\nsize=1400 -> 200\nsize=1500 -> TIMEOUT\nsize=2000 -> TIMEOUT\n```\n\n**1400 works, 1500 and up die** — once you have that boundary, diagnosis is done. Move on to the numbers.\n\n### Step 5 — Narrow the segment with a 3-way matrix\n\n| Path | Test command | Meaning if it fails |\n|---|---|---|\n| Same-node Pod ↔ Pod | `ping -M do -s 1472` to a same-node Pod IP | Fails without going through encapsulation → bridge/veth MTU misconfig |\n| Pod ↔ node IP | Same command from the Pod to the node IP | veth ↔ host NIC mismatch |\n| Node ↔ node | Same command from a node to another node's IP | Underlay (cloud VPC / physical switch) MTU problem |\n\n**Same-node Pods work, but Pods on different nodes don't** → confirmed as a tunnel-interface overhead calculation problem. This is the most common pattern.\n\n## Per-CNI overhead tables and remediations\n\nThe formula is simple.\n\n```\nPod MTU = underlay link MTU − encapsulation overhead (sum overheads if they stack)\n```\n\n### Encapsulation overhead\n\n| Encapsulation | Overhead | Notes |\n|---|---|---|\n| Flannel VXLAN | 50 B | Default |\n| Flannel host-gw | 0 B | No encapsulation; L2 adjacency required |\n| Calico IPIP | 20 B | Default mode |\n| Calico VXLAN | 50 B | IPv4 |\n| Cilium VXLAN | 50 B | |\n| Cilium Geneve | 50 B or more | Grows with option headers |\n| WireGuard encryption | IPv4 60 B / IPv6 80 B | Calico does not add it to encapsulation; subtract only this (per its docs). Check other CNIs' docs |\n\n### Cloud underlay MTU × CNI cross-calculation table\n\n| Underlay MTU | Flannel VXLAN | Calico IPIP | Calico VXLAN | Cilium VXLAN | Cilium VXLAN + WireGuard |\n|---|---|---|---|---|---|\n| AWS 9001 (jumbo) | 8951 | 8981 | 8951 | 8951 | 8871 (assuming −80) |\n| AWS/on-prem 1500 | 1450 | 1480 | 1450 | 1450 | 1370 |\n| GCP 1460 | **1410** | 1440 | 1410 | 1410 | 1330 |\n| Via VPN 1400 | 1350 | 1380 | 1350 | 1350 | 1270 |\n\nThis is a typical GCP incident. The default VPC MTU on GCP is 1460 ([GCP MTU docs](https://cloud.google.com/vpc/docs/mtu)), so if an MTU of 1450 carried over from a 1500 environment is hard-coded, you overrun by 10 bytes. The correct value is **1410**. Flannel and Calico compute the MTU from the node interface when you do not set one ([Flannel configuration docs](https://github.com/flannel-io/flannel/blob/master/Documentation/configuration.md)), so first check whether a fixed value was ever set.\n\nIn a hybrid cluster (AWS jumbo 9001 nodes + on-prem 1500 nodes), you must **key off the smallest underlay MTU**.\n\n### Flannel configuration\n\n```bash\n$ kubectl edit configmap kube-flannel-cfg -n kube-flannel\n```\n\n```json\n{\n  \"Network\": \"10.244.0.0/16\",\n  \"Backend\": {\n    \"Type\": \"vxlan\",\n    \"MTU\": 1410\n  }\n}\n```\n\n**Restart scope**: you need a DaemonSet restart, then a rollout of the workload Pods.\n\n```bash\n$ kubectl rollout restart daemonset kube-flannel-ds -n kube-flannel\n$ kubectl rollout restart deployment -n <앱 네임스페이스> --all\n```\n\nIf you restart only the CNI DaemonSet, `flannel.1` changes but **existing Pod veths stay at 1500**. A veth is created when the Pod sandbox is created, so Pods must be recreated for the change to take effect. Missing this step is why people often conclude \"I changed the config and it didn't help.\"\n\n### Calico configuration\n\nBy default Calico auto-detects the MTU from node configuration and the encapsulation modes you enabled. Set an explicit value only when auto-detection is wrong; the new MTU applies only to new workloads ([Calico MTU docs](https://docs.tigera.io/calico/latest/networking/configuring/mtu)). For operator installs, patch the Installation resource:\n\n```bash\n$ kubectl patch installation.operator.tigera.io default --type merge \\\n  -p '{\"spec\":{\"calicoNetwork\":{\"mtu\":1410}}}'\n```\n\nFor manifest installs, edit `calico-config` as below.\n\n```bash\n$ kubectl patch configmap calico-config -n kube-system \\\n  --type merge -p '{\"data\":{\"veth_mtu\":\"1410\"}}'\n\n# IPIP 모드 터널 MTU\n$ kubectl set env daemonset/calico-node -n kube-system FELIX_IPINIPMTU=1440\n# VXLAN 모드\n$ kubectl set env daemonset/calico-node -n kube-system FELIX_VXLANMTU=1410\n$ kubectl rollout restart daemonset calico-node -n kube-system\n```\n\n**Restart scope**: after restarting `calico-node`, a workload Pod rollout is mandatory.\n\n### Cilium configuration\n\n```bash\n$ helm upgrade cilium cilium/cilium \\\n  --namespace kube-system --reuse-values \\\n  --set MTU=1410\n\n$ kubectl rollout restart daemonset cilium -n kube-system\n$ kubectl rollout restart deployment -n <앱 네임스페이스> --all\n```\n\nIf you also enable WireGuard node-to-node encryption (`encryption.enabled=true`, `encryption.type=wireguard`), you must account for the WireGuard overhead too. The math differs by CNI (Calico does not add it to encapsulation), so list every option that is actually on and confirm with that CNI's docs.\n\n### Verify the change took effect\n\n```bash\n# 새로 뜬 Pod에서 확인\n$ kubectl exec -it <신규-pod> -- ip link show eth0\n3: eth0@if11: ... mtu 1410 ...\n\n$ kubectl exec -it <신규-pod> -- ping -M do -s 1382 -c 1 <상대 Pod IP>\n1390 bytes from ...: icmp_seq=1 ttl=62 time=0.44 ms\n```\n\n### When you can't change MTU: MSS clamping\n\nIf a managed CNI blocks the change, or you can't get change approval, you can force TCP MSS down to the path MTU on the node.\n\n```bash\n# 모든 노드에서 실행 (SYN 패킷의 MSS를 경로 MTU에 맞춤)\nsudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \\\n  -j TCPMSS --clamp-mss-to-pmtu\n\n# PMTUD가 아예 안 되는 환경이면 고정값으로\nsudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \\\n  -j TCPMSS --set-mss 1370\n\n# 확인\nsudo iptables -t mangle -L FORWARD -n -v | grep TCPMSS\n```\n\n**The limitations are clear.**\n\n- **Applies to TCP only.** It rewrites the MSS option on SYN packets, so UDP is out of scope.\n- **Ineffective for QUIC (HTTP/3).** It's UDP-based, so the MSS concept doesn't exist. If you use gRPC over HTTP/3, DoQ, etc., adjusting MTU at the source is the only fix.\n- Large DNS (UDP 53) responses and UDP traffic inside VXLAN are also unprotected.\n- It disappears on reboot, so persist it with `iptables-persistent` or a boot script.\n\n## Failure branch: you lowered MTU and it's still broken\n\nIf you matched the table and even recreated Pods, but the symptom is unchanged, suspect a PMTUD black hole.\n\nHere's the mechanism. The signal an intermediate device uses to say \"this packet is too big\" is **ICMP type 3 code 4 (Destination Unreachable / Fragmentation Needed)**. If a firewall drops that, the sender never learns to shrink, keeps sending large packets, and they vanish silently. No error log is left behind.\n\n### How to confirm\n\n```bash\n# 송신 노드에서 ICMP 수신 여부 관찰\n$ sudo tcpdump -ni any 'icmp[icmptype] == 3 and icmp[icmpcode] == 4' -c 5\nlistening on any, link-type LINUX_SLL (Linux cooked v1)\n0 packets captured\n```\n\nIf you keep sending large packets and get **0 packets captured**, the black hole is confirmed. In a healthy case you should capture something like this.\n\n```\n10:14:22.331 IP 10.0.1.1 > 10.0.2.31: ICMP 10.244.2.15 unreachable -\n  need to frag (mtu 1450), length 556\n```\n\nAlso check the PMTU cache the kernel has learned.\n\n```bash\n$ ip route get 10.244.2.15\n10.244.2.15 via 10.0.1.1 dev eth0 src 10.0.2.31 mtu 1450\n```\n\nIf the `mtu` field is missing entirely, nothing has been learned.\n\n### ICMP policy checkpoints for Korean environments\n\nThis often happens because of security policies that block ICMP wholesale. Check the following in order.\n\n| Check target | Checkpoint |\n|---|---|\n| NCP ACG | Whether inbound/outbound rules include an allow for the ICMP protocol |\n| NCP Network ACL | Whether ICMP is set to Deny in the subnet-level ACL |\n| KT Cloud firewall | Whether a firewall policy has an ICMP allow rule; check VPC-to-VPC paths separately |\n| AWS Security Group | Whether `ICMP - Destination Unreachable (type 3)` is allowed |\n| Internal firewall / UTM | Blanket ICMP-deny policy; whether type 3 code 4 is excepted |\n| DPI / IPS appliances | Selective drops caused by ICMP payload inspection |\n\nIf change approval is hard, or out-of-your-control paths are mixed in, **MSS clamping is effectively the only practical fix**. It locks the size in at connection setup and does not depend on PMTUD. The UDP/QUIC limitations mentioned earlier still apply.\n\n### Preventing recurrence\n\n- At CNI install time, **pin MTU explicitly**. If you leave it to autodetect, it silently drifts on node replacement or cloud changes.\n- Put an `ip link show` MTU-alignment check on the node bootstrap checklist when adding nodes.\n- In hybrid clusters, unify on the **minimum underlay MTU**.\n- Add one synthetic monitor that \"fetches a response of 8KB or more\" so you catch size-boundary regressions early.\n- Whenever you newly enable WireGuard or a VPN, recalculate overhead.\n\n### Summary checklist\n\n1. **Symptom call** — ping OK + small request OK + hang only on large response? Did you rule out conntrack and NetworkPolicy?\n2. **3-way matrix** — where does it break: same node / Pod↔node / node↔node?\n3. **Plug into the table** — underlay MTU − encapsulation overhead (sum if stacked) = target Pod MTU\n4. **Apply the config** — CNI config change + DaemonSet restart + **workload Pod rollout**\n5. **Check PMTUD** — does ICMP type 3 code 4 actually arrive? If not, MSS clamping\n\n## FAQ\n\n**Q. Ping works fine — how can this still be MTU?**\nA. Default ping uses a 56-byte payload (84 bytes total), so it passes on any MTU. MTU problems only show up on large packets that exceed the link limit. You have to set the DF bit and grow the size, as in `ping -M do -s 1472`, to confirm.\n\n**Q. Will raising the curl timeout fix it?**\nA. No. The packet cannot cross the link, so it will never arrive no matter how long you wait. Timeout tuning helps the 504 class, where proxy/backend timeouts are misaligned — a different failure layer from this symptom.\n\n**Q. I changed MTU and nothing changed. What did I miss?**\nA. Two classics. First, you restarted only the CNI DaemonSet and never rolled out workload Pods, so existing veths still have the old MTU (check with `kubectl exec -- ip link show eth0`). Second, ICMP type 3 code 4 is dropped by a firewall, so PMTUD is a black hole — in that case you need MSS clamping.\n\n## Sources · checked 2026-10-04\n- [Calico, Configure MTU](https://docs.tigera.io/calico/latest/networking/configuring/mtu) — header sizes: IPIP 20 B, VXLAN IPv4 50 B / IPv6 70 B, WireGuard IPv4 60 B / IPv6 80 B; GCE 1460 → IPIP 1440, VXLAN 1410; MTU auto-detection; operator `calicoNetwork.mtu`\n- [Flannel, Configuration](https://github.com/flannel-io/flannel/blob/master/Documentation/configuration.md) — MTU calculated automatically and written to subnet.env\n- [Flannel, Backends](https://github.com/flannel-io/flannel/blob/master/Documentation/backends.md) — `MTU` option for the vxlan backend\n- [Google Cloud, Maximum transmission unit](https://cloud.google.com/vpc/docs/mtu) — default VPC MTU 1460", "excerpt": "If ping is fine but curl hangs only on large responses and the TLS handshake goes silent, you have an MTU problem. This post covers DF-bit ping binary search, the VXLAN 1450 / GCP 1410 calculation table, where to set Flannel, Calico, and Cilium, plus PMTUD black holes and MSS clamping workarounds."}, "verifiedAt": "2026-10-04", "changeSummary": "Calico 공식 문서 기준으로 WireGuard 오버헤드(IPv4 60B/IPv6 80B, Calico는 캡슐화에 합산하지 않음)와 MTU 자동 감지·operator 설정 방법을 반영하고, Flannel이 MTU를 자동 계산한다는 점을 반영해 GCP 사례 설명을 정정. 출처 없는 \"사고 증가 추세\" 문장 삭제. 출처·확인일 추가.", "officialSources": ["https://docs.tigera.io/calico/latest/networking/configuring/mtu", "https://github.com/flannel-io/flannel/blob/master/Documentation/configuration.md", "https://github.com/flannel-io/flannel/blob/master/Documentation/backends.md", "https://cloud.google.com/vpc/docs/mtu"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=812 AND md5(content)='39109fd1eff06c4ad7eccb6050ebe056' AND md5(content_evidence::text)='e224f59ec80f5349cd473aa259d3b4b1' AND md5(coalesce(array_to_string(tags,'|'),''))='a67e575e17e1f9a89dae688ce99ad1ea';
COMMIT;
