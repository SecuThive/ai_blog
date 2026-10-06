-- top4 refresh 2026-10-06 post #750 connection-refused-econnrefused-127001-30초-진단-런북
-- KO content + EN content (content_evidence.en.content); adds contentUpdatedAt/changeSummary/officialSources.
-- Guarded by the original KO/EN md5; re-running updates 0 rows. updated_at bumped by trigger; published_at/status/slug/title untouched.
-- original md5: ko=b67f6d555781db653372ab5eaaa28ead en=42c4ef63b47a95eefc85dae68ccf56e1  new md5: ko=94f88693fefcd3b359c7e51c24b36ba1 en=6f7aa35b75aa152f53c3d0c9ec9d365d
BEGIN;
UPDATE posts SET
  content = $top4ko$# connection refused / ECONNREFUSED 127.0.0.1 30초 분기 런북

**이 글이 맞는 에러:** `Error: connect ECONNREFUSED 127.0.0.1:5432`, `connect ECONNREFUSED ::1:3000`, `curl: (7) Failed to connect to localhost port 8080 after 0 ms: Could not connect to server`, `dial tcp 127.0.0.1:6379: connect: connection refused`. 모두 "그 주소·포트에서 듣는 프로세스가 없다"는 뜻입니다.

| 원인 | 확인 명령 | 해결 |
|---|---|---|
| 서버 프로세스가 안 떠 있음 | `sudo ss -tlnp`에 해당 포트가 없음 | 서비스 기동, 기동 실패 로그 확인 |
| `127.0.0.1`에만 바인드(원격·컨테이너 밖에서 접속) | `ss` 출력이 `127.0.0.1:<포트>` | 앱을 `0.0.0.0`(또는 해당 IP)에 바인드 |
| `localhost`가 `::1`로 풀리는데 서버는 IPv4만 | 에러 주소가 `::1` | 클라이언트에 `127.0.0.1` 명시, 또는 서버를 `::`에도 바인드 |
| 컨테이너 안에서 `localhost`로 다른 서비스 접속 | 접속 주소, `docker ps` 포트 매핑 | compose 서비스 이름 또는 `host.docker.internal` 사용 |
| 방화벽 REJECT 규칙 | `sudo nft list ruleset` / `sudo iptables -L -n` | 해당 포트 허용 |

## 'connection refused'는 "무응답"이 아니라 "적극적 거부"다

배포 직후 `curl`이 `Connection refused`를 뱉거나, Node 앱이 `ECONNREFUSED 127.0.0.1:5432`로 죽는 순간 가장 먼저 해야 할 일은 **이 에러의 정체를 정확히 아는 것**입니다.

핵심은 한 줄입니다. **connection refused는 패킷이 대상에 도달했고, 대상이 TCP RST로 "그 포트에서 아무도 안 듣는다"고 즉시 응답한 상태**입니다. 즉 네트워크는 멀쩡합니다. 길이 막힌 게(timeout) 아니라, 도착했는데 문 앞에서 거절당한 겁니다. 이 한 줄이 진단 방향을 통째로 바꿉니다.

예외가 하나 있습니다. 방화벽이 패킷을 버리지(DROP) 않고 REJECT 규칙으로 응답하면 ICMP port-unreachable(기본값)이나 TCP RST가 돌아와 클라이언트에는 똑같이 refused로 보입니다([iptables REJECT](https://ipset.netfilter.org/iptables-extensions.man.html)). 서버가 확실히 떠 있는데 refused라면 방화벽 규칙도 확인하세요.

### 먼저 옆 에러들과 구분하자

| 에러 신호 | TCP 동작 | 1차 의심 원인 |
|---|---|---|
| **connection refused** | 즉시 RST 수신 (빠름) | 프로세스 미기동 / 포트·바인드 불일치 |
| **timeout (no route, hang)** | 응답 없음, 수 초~수십 초 대기 | 방화벽 DROP / 보안그룹 / 라우팅 |
| **EADDRINUSE** | 서버 기동 시 바인드 실패 | 이미 그 포트를 점유한 프로세스 |
| **502 Bad Gateway** | 프록시는 떴으나 업스트림 거부 | 백엔드가 위 1~2번 상태 |

timeout이면 방화벽/라우팅부터 의심하고, refused면 **거의 항상 "서버 측"** 문제입니다. 거부는 빠르고, 차단(DROP)은 느립니다. 이 속도 차이만으로도 절반은 잡힙니다.

## 30초 분기 런북: 4단계 의사결정 트리

에러를 본 직후 위에서 아래로 따라가세요.

```
① 프로세스가 떠 있나?   → ss -tlnp / systemctl status
      └ 없음 → 서버 기동 (원인 확정)
      └ 있음 ↓
② 포트/바인드가 맞나?    → ss 출력의 127.0.0.1:PORT vs 0.0.0.0:PORT
      └ 127.0.0.1만 리스닝인데 외부 접속 → 바인드 변경 (원인 확정)
      └ 맞음 ↓
③ 중간에 막혔나?         → nc -zv / ufw status / docker ps 포트매핑
      └ 방화벽/보안그룹/매핑 누락 → 규칙 허용 (원인 확정)
      └ 통과 ↓
④ 이름이 잘못 풀리나?    → localhost가 ::1(IPv6)로 풀리는지 확인
      └ IPv4만 리스닝 + IPv6 우선 해석 → 127.0.0.1 직접 사용
```

### 위험도 라벨 복붙 명령표

| 라벨 | 명령 | 무엇을 확인/변경 |
|---|---|---|
| 🟢 안전 | `sudo ss -tlnp` | 어떤 프로세스가 어떤 IP:포트로 리스닝 중인지(다른 사용자 프로세스 이름은 sudo가 있어야 보임) |
| 🟢 안전 | `systemctl status <svc>` | 서비스가 실제로 active인지 |
| 🟢 안전 | `nc -zv host port` | 해당 포트로 TCP 연결이 되는지(refused/timeout 구분) |
| 🟢 안전 | `telnet host port` | nc 없을 때 동일 용도 |
| 🟢 안전 | `docker ps` | PORTS 컬럼(`0.0.0.0:8080->80`)로 매핑 유무 |
| 🟢 안전 | `sudo ufw status` | ufw 인바운드 허용 규칙 확인 |
| 🟢 안전 | `sudo iptables -L -n` | 체인별 ACCEPT/DROP/REJECT 규칙 확인 |
| 🟢 안전 | `sudo nft list ruleset` | nftables를 쓰는 배포판의 규칙 확인 |
| 🟡 주의 | `sudo ufw allow 8080/tcp` | 인바운드 포트 개방(상태 변경) |
| 🟡 주의 | `sudo systemctl restart <svc>` | 서비스 재기동(다운타임 발생) |
| 🟡 주의 | `docker run -p 8080:80 ...` | 포트 매핑 재설정으로 재기동 |

🟢는 마음껏 돌려도 됩니다. 🟡는 운영 환경이면 한 번 더 생각하세요.

## 핵심 함정: 127.0.0.1 바인드 vs 0.0.0.0 바인드

현업에서 "로컬에선 되는데 컨테이너/원격에선 refused"가 나오면 **가장 먼저 확인할 것이 이것**입니다. 직접 재현해 봅시다.

```bash
# A. 루프백에만 바인드
python -m http.server --bind 127.0.0.1 8000

# B. 모든 인터페이스에 바인드
python -m http.server --bind 0.0.0.0 8000
```

각각 띄우고 `ss -tlnp`를 보면 차이가 명확합니다.

```
# A의 경우
LISTEN 0  5    127.0.0.1:8000  0.0.0.0:*  users:(("python",pid=...))

# B의 경우
LISTEN 0  5    0.0.0.0:8000    0.0.0.0:*  users:(("python",pid=...))
```

A는 `127.0.0.1:8000`, 즉 **같은 머신 내부에서만** 응답합니다. 다른 호스트나 컨테이너 밖에서 접속하면 커널이 "이 IP로는 그 포트에 리스너 없음" → 즉시 RST → **connection refused**. 반면 B는 외부 IP로 들어온 패킷도 받습니다.

> **실무 경험 한 줄**: 프레임워크 기본값이 함정입니다. Flask `app.run()`은 host를 지정하지 않으면 `127.0.0.1`에서만 듣고([Flask 문서](https://flask.palletsprojects.com/en/stable/api/#flask.Flask.run)), 다른 dev 서버도 루프백이 기본인 경우가 많습니다. "내 노트북에선 멀쩡한데 EC2/도커에서만 거부"가 뜨면 코드부터 보지 말고 `ss -tlnp`로 바인드 주소부터 확인하세요. 저는 이걸로 날린 시간이 며칠치는 됩니다.

## 같은 에러, 다른 얼굴: 언어/툴별 메시지 매핑

아래는 **전부 동일한 TCP RST 신호**입니다. 메시지만 다를 뿐 진단 루트는 같습니다.

| 도구 | 에러 메시지 |
|---|---|
| curl 8.x | `curl: (7) Failed to connect to localhost port 8080 after 0 ms: Could not connect to server` (`-v`로 보면 `connect to 127.0.0.1 port 8080 ... failed: Connection refused`) |
| curl 구버전 | `curl: (7) Failed to connect to localhost port 8080: Connection refused` |
| Node | `Error: connect ECONNREFUSED 127.0.0.1:5432` |
| Node(`localhost`로 접속) | `AggregateError [ECONNREFUSED]` 안에 `connect ECONNREFUSED ::1:5432`, `connect ECONNREFUSED 127.0.0.1:5432` |
| Go | `dial tcp 127.0.0.1:6379: connect: connection refused` |
| psql | `psql: error: connection to server at "127.0.0.1", port 5432 failed: Connection refused` (구버전: `could not connect to server: Connection refused`) |
| redis-cli | `Could not connect to Redis ... Connection refused` |

### 케이스별 진단

- **curl**: `curl -v http://host:port` → 즉시 refused면 서버 미기동/포트 오타. `nc -zv host port`로 교차 검증.
- **Node ECONNREFUSED 127.0.0.1:5432**: DB 호스트가 `localhost`인데 DB가 컨테이너/원격에 있는 경우가 흔함. 연결 문자열의 host 확인 후 `ss -tlnp | grep 5432`.
- **Node에서 `::1`이 찍히는 경우**: Node 17부터 `localhost`를 OS가 돌려준 순서대로 쓰기 때문에(`verbatim`) `::1`이 먼저 나올 수 있습니다([dns 문서](https://nodejs.org/api/dns.html#dnssetdefaultresultorderorder)). Node 20부터는 `autoSelectFamily` 기본값이 true라 IPv6·IPv4 주소를 차례로 시도하고, 모두 실패하면 `AggregateError`로 묶어 보여 줍니다([net 문서](https://nodejs.org/api/net.html#socketconnectoptions-connectlistener)). 2026년 10월 기준 LTS는 Node 24(Active)와 22(Maintenance)이고, Node 20은 2026-04-30에 지원이 끝났습니다([Node.js 릴리스 일정](https://github.com/nodejs/Release#release-schedule)).
- **Go dial tcp**: 동일. 의존 서비스가 아직 안 떴는데 앱이 먼저 뜬 부팅 순서 문제도 잦음(`depends_on`/헬스체크로 해결).
- **psql/redis-cli**: 서버는 떴는데 `127.0.0.1`만 리스닝, 클라이언트는 외부에서 접속 → 바인드 또는 `bind` 설정(redis `bind 127.0.0.1`, postgres `listen_addresses`) 확인.

## Docker·클라우드 특화 함정

컨테이너 환경에서 refused가 급증하는 이유는 명확합니다.

1. **컨테이너 내부 앱이 `127.0.0.1`에 바인드** → `docker run -p 8080:80`을 해도 거부됩니다. `-p`는 호스트 → 컨테이너 외부 인터페이스로 트래픽을 넘기는데, 앱이 컨테이너의 루프백에만 듣고 있으면 도달할 리스너가 없습니다. **컨테이너 안에서는 반드시 `0.0.0.0`에 바인드**하세요.

2. **컨테이너 → 호스트 접속**: 컨테이너 안의 `localhost`는 호스트가 아니라 컨테이너 자신입니다. 호스트 서비스에 붙으려면 `host.docker.internal`을 쓰세요. Docker Desktop(Mac/Windows)은 자동으로 풀어 주고, 리눅스 Docker Engine은 `--add-host=host.docker.internal:host-gateway`(compose는 `extra_hosts`)를 추가해야 합니다([Docker 문서](https://docs.docker.com/reference/cli/docker/container/run/#add-host)). 같은 compose의 다른 컨테이너라면 서비스 이름(예: `db:5432`)으로 접속합니다.

3. **AWS 보안그룹/인바운드**: 다만 보안그룹이 막으면 보통 **timeout(DROP)**이지 refused가 아닙니다. refused인데 보안그룹을 의심한다면 방향이 틀린 겁니다. 단, NLB/타깃그룹이 닫힌 포트로 헬스체크를 보내면 refused가 표면화될 수 있습니다.

4. **IPv6 우선 해석**: `localhost`가 `::1`로 먼저 풀리는데 서버가 IPv4(`0.0.0.0`)에만 리스닝하면 refused가 납니다. 임시 회피는 `127.0.0.1`을 명시적으로 쓰는 것이고, 서버를 `::`(듀얼스택)에도 바인드하면 근본적으로 해결됩니다.

## 결론: 4단계 체크리스트 카드

```
[ ] ① ss -tlnp 로 프로세스/포트 리스닝 확인  (없으면 → 기동)
[ ] ② 바인드 주소 127.0.0.1 vs 0.0.0.0 확인  (루프백만이면 → 0.0.0.0)
[ ] ③ nc -zv / ufw status / docker ps 매핑   (막혔으면 → 규칙·매핑 허용)
[ ] ④ localhost가 ::1로 풀리는지            (IPv6 이슈면 → 127.0.0.1 명시)
```

refused는 거의 항상 서버 측 문제, 그것도 "안 떴거나 / 엉뚱한 주소에 떴거나"입니다. 위에서 아래로 30초면 끝납니다.

## 자주 묻는 질문 (FAQ)

**Q. connection refused와 timeout, 빠르게 구분하는 법은?**
A. `nc -zv host port`를 쳐보세요. **즉시** 실패하며 refused가 뜨면 서버 미기동·포트 불일치(서버 측), 수 초 이상 멈췄다가 실패하면 방화벽 DROP·보안그룹·라우팅 문제입니다. 속도가 곧 단서입니다.

**Q. 로컬에선 되는데 컨테이너/원격에서만 refused가 나요.**
A. 대개 앱이 `127.0.0.1`에 바인드되어 있습니다. `ss -tlnp`로 확인하고 `0.0.0.0`으로 바꾸세요. 컨테이너라면 내부 앱의 바인드 주소가 `0.0.0.0`이어야 `-p` 매핑이 동작합니다.

**Q. ECONNREFUSED 127.0.0.1:5432, DB 주소는 맞는데 왜 거부되나요?**
A. (1) DB 프로세스가 안 떴거나, (2) DB가 컨테이너/원격에 있는데 host를 `localhost`로 지정했거나, (3) postgres `listen_addresses`/redis `bind`가 루프백으로 제한된 경우입니다. `ss -tlnp | grep 5432`로 실제 리스닝 주소부터 확인하세요.$top4ko$,
  content_evidence = jsonb_set(content_evidence, '{en,content}', to_jsonb($top4en$# connection refused / ECONNREFUSED 127.0.0.1: a 30-second triage runbook

**Errors this covers:** `Error: connect ECONNREFUSED 127.0.0.1:5432`, `connect ECONNREFUSED ::1:3000`, `curl: (7) Failed to connect to localhost port 8080 after 0 ms: Could not connect to server`, `dial tcp 127.0.0.1:6379: connect: connection refused`. They all mean "nothing is listening on that address and port."

| Cause | Check | Fix |
|---|---|---|
| Server process not running | The port is missing from `sudo ss -tlnp` | Start the service; read its startup error log |
| Bound to `127.0.0.1` only (client is remote or outside the container) | `ss` shows `127.0.0.1:<port>` | Bind the app to `0.0.0.0` (or the specific IP) |
| `localhost` resolves to `::1` but the server is IPv4-only | The error address is `::1` | Use `127.0.0.1` in the client, or also bind the server to `::` |
| Using `localhost` inside a container to reach another service | The target address and `docker ps` port mapping | Use the compose service name or `host.docker.internal` |
| Firewall REJECT rule | `sudo nft list ruleset` / `sudo iptables -L -n` | Allow the port |

## connection refused is not "no response" — it is an active rejection

Right after a deploy, when `curl` spits out `Connection refused` or a Node app dies with `ECONNREFUSED 127.0.0.1:5432`, the first thing you need to do is **understand exactly what this error is**.

The key is one sentence. **connection refused means the packet reached the target, and the target immediately replied with a TCP RST saying "nobody is listening on that port."** In other words, the network is fine. The path is not blocked (that would be a timeout) — you arrived and got turned away at the door. That one fact completely changes the direction of your diagnosis.

There is one exception. If a firewall answers with a REJECT rule instead of silently dropping the packet, it sends back ICMP port-unreachable (the default) or a TCP RST, and the client sees the same refused error ([iptables REJECT](https://ipset.netfilter.org/iptables-extensions.man.html)). If the server is definitely running and you still get refused, check the firewall rules too.

### First, distinguish it from neighboring errors

| Error signal | TCP behavior | First-line suspected cause |
|---|---|---|
| **connection refused** | Immediate RST received (fast) | Process not running / port or bind mismatch |
| **timeout (no route, hang)** | No response; wait seconds to tens of seconds | Firewall DROP / security group / routing |
| **EADDRINUSE** | Bind failure at server start | A process already occupying that port |
| **502 Bad Gateway** | Proxy is up but upstream refused | Backend is in state 1 or 2 above |

If it's a timeout, start by suspecting the firewall/routing. If it's refused, it is **almost always a server-side** problem. Refusal is fast; blocking (DROP) is slow. That speed difference alone gets you halfway there.

## 30-second triage runbook: a 4-step decision tree

Follow this from top to bottom the moment you see the error.

```
① Is the process running?   → ss -tlnp / systemctl status
      └ No  → start the server (root cause confirmed)
      └ Yes ↓
② Is the port/bind correct?    → 127.0.0.1:PORT vs 0.0.0.0:PORT in ss output
      └ Listening only on 127.0.0.1 but connecting from outside → change the bind (root cause confirmed)
      └ Correct ↓
③ Blocked in the middle?         → nc -zv / ufw status / docker ps port mapping
      └ Firewall/security group/mapping missing → allow the rule (root cause confirmed)
      └ Passes ↓
④ Is the name resolving wrong?    → check whether localhost resolves to ::1 (IPv6)
      └ Listening IPv4 only + IPv6-first resolution → use 127.0.0.1 directly
```

### Copy-paste command table with risk labels

| Label | Command | What it checks/changes |
|---|---|---|
| 🟢 Safe | `sudo ss -tlnp` | Which process is listening on which IP:port (process names of other users need sudo) |
| 🟢 Safe | `systemctl status <svc>` | Whether the service is actually active |
| 🟢 Safe | `nc -zv host port` | Whether a TCP connection to that port succeeds (refused vs timeout) |
| 🟢 Safe | `telnet host port` | Same purpose when nc is unavailable |
| 🟢 Safe | `docker ps` | Presence of mapping via the PORTS column (`0.0.0.0:8080->80`) |
| 🟢 Safe | `sudo ufw status` | Check ufw inbound allow rules |
| 🟢 Safe | `sudo iptables -L -n` | Check ACCEPT/DROP/REJECT rules per chain |
| 🟢 Safe | `sudo nft list ruleset` | Check rules on distros that use nftables |
| 🟡 Caution | `sudo ufw allow 8080/tcp` | Open an inbound port (changes state) |
| 🟡 Caution | `sudo systemctl restart <svc>` | Restart the service (causes downtime) |
| 🟡 Caution | `docker run -p 8080:80 ...` | Restart with port mapping reset |

🟢 you can run freely. 🟡 think twice if this is production.

## The core trap: 127.0.0.1 bind vs 0.0.0.0 bind

In the field, when something "works locally but is refused in a container or remotely," **this is the first thing to check**. Let's reproduce it.

```bash
# A. Bind to loopback only
python -m http.server --bind 127.0.0.1 8000

# B. Bind to all interfaces
python -m http.server --bind 0.0.0.0 8000
```

Start each one and run `ss -tlnp` — the difference is obvious.

```
# Case A
LISTEN 0  5    127.0.0.1:8000  0.0.0.0:*  users:(("python",pid=...))

# Case B
LISTEN 0  5    0.0.0.0:8000    0.0.0.0:*  users:(("python",pid=...))
```

A is `127.0.0.1:8000`, meaning it answers **only from inside the same machine**. If you connect from another host or from outside a container, the kernel says "no listener on that port for this IP" → immediate RST → **connection refused**. B, on the other hand, also accepts packets that arrive on an external IP.

> **One line from the field**: Framework defaults are the trap. Flask `app.run()` listens only on `127.0.0.1` unless you pass a host ([Flask docs](https://flask.palletsprojects.com/en/stable/api/#flask.Flask.run)), and many other dev servers also default to loopback. If you get "fine on my laptop, refused only on EC2/Docker," don't start with the code — check the bind address with `ss -tlnp` first. I've burned days of time on this.

## Same error, different faces: message mapping by language/tool

Everything below is **the same TCP RST signal**. Only the message differs; the diagnostic path is identical.

| Tool | Error message |
|---|---|
| curl 8.x | `curl: (7) Failed to connect to localhost port 8080 after 0 ms: Could not connect to server` (with `-v`: `connect to 127.0.0.1 port 8080 ... failed: Connection refused`) |
| older curl | `curl: (7) Failed to connect to localhost port 8080: Connection refused` |
| Node | `Error: connect ECONNREFUSED 127.0.0.1:5432` |
| Node (connecting to `localhost`) | `AggregateError [ECONNREFUSED]` containing `connect ECONNREFUSED ::1:5432` and `connect ECONNREFUSED 127.0.0.1:5432` |
| Go | `dial tcp 127.0.0.1:6379: connect: connection refused` |
| psql | `psql: error: connection to server at "127.0.0.1", port 5432 failed: Connection refused` (older: `could not connect to server: Connection refused`) |
| redis-cli | `Could not connect to Redis ... Connection refused` |

### Diagnosis by case

- **curl**: `curl -v http://host:port` → if refused immediately, the server is down or the port is mistyped. Cross-check with `nc -zv host port`.
- **Node ECONNREFUSED 127.0.0.1:5432**: Common when the DB host is `localhost` but the DB is in a container or remote. Check the host in the connection string, then `ss -tlnp | grep 5432`.
- **Node shows `::1`**: Since Node 17, `localhost` addresses are used in the order the OS returns them (`verbatim`), so `::1` can come first ([dns docs](https://nodejs.org/api/dns.html#dnssetdefaultresultorderorder)). Since Node 20, `autoSelectFamily` defaults to true, so Node tries the IPv6 and IPv4 addresses in turn and, if all fail, reports them together as an `AggregateError` ([net docs](https://nodejs.org/api/net.html#socketconnectoptions-connectlistener)). As of October 2026 the LTS lines are Node 24 (Active) and Node 22 (Maintenance); Node 20 reached end of life on 2026-04-30 ([Node.js release schedule](https://github.com/nodejs/Release#release-schedule)).
- **Go dial tcp**: Same. Also common: the app starts before a dependent service is up (fix with `depends_on` / health checks).
- **psql/redis-cli**: The server is up but listening only on `127.0.0.1`, while the client connects from outside → check the bind or `bind` settings (redis `bind 127.0.0.1`, postgres `listen_addresses`).

## Docker and cloud-specific traps

There's a clear reason refused spikes in container environments.

1. **The app inside the container binds to `127.0.0.1`** → even `docker run -p 8080:80` gets refused. `-p` forwards traffic from the host to the container's external interface, but if the app is only listening on the container's loopback, there is no listener to reach. **Always bind to `0.0.0.0` inside a container.**

2. **Container → host connections**: `localhost` inside a container is the container itself, not the host. To reach a host service, use `host.docker.internal`. Docker Desktop (Mac/Windows) resolves it automatically; on Linux Docker Engine, add `--add-host=host.docker.internal:host-gateway` (`extra_hosts` in compose) ([Docker docs](https://docs.docker.com/reference/cli/docker/container/run/#add-host)). For another container in the same compose project, connect by service name (for example `db:5432`).

3. **AWS security groups / inbound**: If a security group is blocking you, you usually get a **timeout (DROP)**, not refused. If you see refused and you're blaming the security group, you're looking in the wrong direction. Exception: an NLB/target group sending health checks to a closed port can surface as refused.

4. **IPv6-first resolution**: If `localhost` resolves to `::1` first but the server is listening only on IPv4 (`0.0.0.0`), you get refused. Temporary workaround: explicitly use `127.0.0.1`. Binding the server to `::` (dual-stack) as well fixes it properly.

## Conclusion: 4-step checklist card

```
[ ] ① Confirm process/port listening with ss -tlnp  (if none → start it)
[ ] ② Check bind address 127.0.0.1 vs 0.0.0.0  (loopback only → 0.0.0.0)
[ ] ③ nc -zv / ufw status / docker ps mapping   (if blocked → allow the rule/mapping)
[ ] ④ Whether localhost resolves to ::1            (IPv6 issue → specify 127.0.0.1)
```

refused is almost always a server-side problem — specifically "it isn't running, or it's running on the wrong address." Top to bottom, 30 seconds and you're done.

## FAQ

**Q. How do I quickly tell connection refused from a timeout?**
A. Run `nc -zv host port`. If it fails **immediately** with refused, the server is down or the port is wrong (server-side). If it hangs for several seconds then fails, it's a firewall DROP, security group, or routing problem. Speed is the clue.

**Q. It works locally but I only get refused in a container/remotely.**
A. Usually the app is bound to `127.0.0.1`. Confirm with `ss -tlnp` and change it to `0.0.0.0`. In a container, the inner app must bind to `0.0.0.0` for `-p` mapping to work.

**Q. ECONNREFUSED 127.0.0.1:5432 — the DB address is correct, so why refused?**
A. (1) The DB process isn't running, (2) the DB is in a container/remote but the host is set to `localhost`, or (3) postgres `listen_addresses` / redis `bind` is restricted to loopback. Start by checking the actual listen address with `ss -tlnp | grep 5432`.$top4en$::text))
    || jsonb_build_object('contentUpdatedAt', '2026-10-06', 'changeSummary', $top4s$상단에 에러 원문과 원인→확인 명령→해결 표 추가. 근거 없는 "80%" 문구 삭제, REJECT 규칙도 refused를 만든다는 점, Node 17+/20+ localhost·AggregateError 동작과 2026-10 기준 LTS, curl 8.x·최신 psql 메시지, 리눅스 host-gateway, nftables·sudo 명령 반영(공식 문서 링크).$top4s$::text, 'officialSources', $top4j$[{"label": "Node.js dns.setDefaultResultOrder", "url": "https://nodejs.org/api/dns.html#dnssetdefaultresultorderorder"}, {"label": "Node.js socket.connect autoSelectFamily", "url": "https://nodejs.org/api/net.html#socketconnectoptions-connectlistener"}, {"label": "Node.js release schedule", "url": "https://github.com/nodejs/Release#release-schedule"}, {"label": "iptables-extensions REJECT", "url": "https://ipset.netfilter.org/iptables-extensions.man.html"}, {"label": "docker run --add-host", "url": "https://docs.docker.com/reference/cli/docker/container/run/#add-host"}, {"label": "Flask.run", "url": "https://flask.palletsprojects.com/en/stable/api/#flask.Flask.run"}]$top4j$::jsonb)
WHERE id = 750
  AND md5(content) = 'b67f6d555781db653372ab5eaaa28ead'
  AND md5(content_evidence->'en'->>'content') = '42c4ef63b47a95eefc85dae68ccf56e1';
COMMIT;
