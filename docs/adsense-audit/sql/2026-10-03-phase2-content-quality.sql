-- Phase 2 content-quality fixes. Generated from /workspace/posts edit scripts.
-- Each UPDATE is guarded on md5 of the original column value: re-running is a no-op (0 rows).
-- No COMMIT: run inside BEGIN; review row counts; COMMIT manually after a backup.
BEGIN;

-- post 640: ssh.socket(22.10+)·OpenSSH 9.8 sshd-session/PerSourcePenalties 반영, 중복 reload 블록 제거, ss 카운트 헤더 수정
UPDATE posts SET content=$q$`kex_exchange_identification: read: Connection reset by peer`는 SSH 키 교환 단계에서 연결이 리셋됐다는 메시지입니다. `Connection closed by remote host`도 함께 보일 수 있습니다. **이 문자열만으로 Fail2Ban 차단을 확정할 수는 없습니다.** 클라이언트의 `ssh -vvv`와 같은 시각의 서버 로그를 연결해 원인을 좁혀야 합니다.

## SSH 연결 오류를 먼저 구분하세요

| 오류 | 우선 확인할 범위 |
|---|---|
| `Connection refused` | SSH 포트 리슨 여부, 주소·포트, 연결 거부 규칙 |
| `Connection timed out` | 경로·방화벽·보안그룹, 응답하지 않는 서버 |
| `kex_exchange_identification ... reset by peer` | 인증 전 연결 제한, 차단 장비, sshd 로그 |
| `Permission denied (publickey)` | 서버에 도달한 뒤의 사용자·키 인증 |

키 인증 실패와 연결 초기화 오류는 진단 순서가 다릅니다. 일반적인 접속 오류 분류는 [SSH 접속 안 될 때 점검 가이드](/engineer/ssh-connection-troubleshoot)에서 이어서 확인할 수 있습니다.

## 1. ssh -vvv로 중단 지점과 시각 기록

```bash
# 클라이언트에서 실행: 사용자·주소·포트 교체
ssh -vvv -o ConnectTimeout=10 -p 22 user@host
```

마지막 한 줄뿐 아니라 `Connecting to`, `Connection established`, 원격 버전 문자열, 인증 방식 안내가 어디까지 나오는지 기록합니다. verbose 로그는 가능한 원인을 좁히는 자료이며 차단 주체를 단독으로 증명하지는 않습니다.

서버 콘솔이나 기존 관리 세션이 있다면 같은 시각의 로그를 봅니다.

```bash
# 배포판에 따라 서비스 이름은 ssh 또는 sshd
sudo journalctl -u ssh -u sshd --since '15 minutes ago' --no-pager
sudo ss -ltnp
```

**버전·배포판에 따라 보이는 모습이 다릅니다.**
- Ubuntu 22.10 이상(24.04 LTS 포함)은 기본적으로 systemd 소켓 활성화(`ssh.socket`)를 씁니다. `ss -ltnp`에서 22번 포트를 잡은 프로세스가 `sshd`가 아니라 `systemd`로 보이는 것이 정상입니다. 포트·`ListenAddress`를 바꾼 뒤에는 `sudo systemctl daemon-reload && sudo systemctl restart ssh.socket`으로 소켓을 다시 열어야 반영됩니다. [Ubuntu: sshd socket-based activation](https://discourse.ubuntu.com/t/sshd-now-uses-socket-based-activation-ubuntu-22-10-and-later/30189)
- OpenSSH 9.8부터는 접속별 처리를 `sshd-session` 바이너리가 맡아, 일부 로그가 `sshd`가 아닌 `sshd-session` 태그로 찍힙니다. `grep sshd`만으로 찾으면 놓칠 수 있습니다. [OpenSSH 9.8 릴리스 노트](https://www.openssh.com/txt/release-9.8)
- 서버의 OpenSSH 버전은 `ssh -V`(같은 패키지의 클라이언트 버전)나 패키지 관리자(`dpkg -l openssh-server`, `rpm -q openssh-server`)로 확인합니다.

서버에 기록이 전혀 없다면 잘못된 목적지·포트, 중간 방화벽, NAT 경로도 확인합니다. ping 성공은 ICMP 응답만 확인하므로 SSH 포트의 정상 동작을 보장하지 않습니다.

## 2. 특정 출발지 IP에서만 실패하면 차단 기록 확인

Fail2Ban을 실제로 운영하는 서버에서 다음을 확인합니다.

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

`sshd`는 jail 이름의 예시입니다. 활성 jail과 서버에서 관찰한 출발지 IP를 대조합니다. NAT·VPN 환경에서는 클라이언트의 사설 IP와 서버에 보이는 IP가 다를 수 있습니다.

확인된 정상 관리 IP가 해당 jail에 차단되어 있고 해제 권한이 있을 때만 다음을 실행합니다.

```bash
# 203.0.113.10은 예시 주소: 실제 차단 IP로 교체
sudo fail2ban-client set sshd unbanip 203.0.113.10
```

인증 실패 원인도 고치지 않으면 다시 차단될 수 있습니다. [Fail2Ban 클라이언트 명령 문서](https://github.com/fail2ban/fail2ban/blob/master/man/fail2ban-client.1)

## 3. 동시 접속 시에만 발생하면 MaxStartups 확인

```bash
sudo sshd -T | grep -iE 'maxstartups|persourcemaxstartups|logingracetime'
```

`MaxStartups`는 인증을 완료하지 않은 동시 연결을 제한합니다. 예를 들어 유효 설정이 `10:30:100`이라면 미인증 연결 10개부터 30% 확률로 새 연결을 거부하기 시작하고, 100개에 도달하면 모두 거부합니다. 이는 **로그인 완료 세션 수 제한인 MaxSessions와 다릅니다.** 버전·배포판의 실제 유효 설정을 확인하세요. [OpenSSH sshd_config](https://man.openbsd.org/sshd_config#MaxStartups)

자동화 작업이 한 번에 다수 접속을 만드는지 먼저 봅니다. 배포 동시성을 줄이고 연결을 재사용하는 방법을 검토한 뒤, 서버 용량과 보안 정책에 맞춰 제한을 조정합니다. 공격 트래픽 때문에 발생한 상황에서 제한만 올리면 부하가 커질 수 있습니다.

## 3-1. OpenSSH 9.8 이상: 같은 출발지가 한동안 계속 거부될 때

OpenSSH 9.8부터 `PerSourcePenalties`가 **기본으로 켜져** 있습니다. 인증 실패를 반복하거나 인증을 끝내지 않고 연결만 반복하는 출발지 주소에 벌점 시간을 쌓고, 기준을 넘으면 그 주소(그리고 `PerSourceNetBlockSize` 범위)의 새 연결을 벌점이 끝날 때까지 거부합니다. 잘못된 키로 재시도하는 배포 도구, 같은 NAT 출구를 쓰는 사무실 전체가 함께 막히는 형태로 나타납니다. [OpenSSH 9.8 릴리스 노트](https://www.openssh.com/txt/release-9.8)

```bash
ssh -V                                  # 9.8 미만이면 이 절은 해당 없음
sudo sshd -T | grep -iE 'persourcepenalt|persourcenetblocksize'
sudo journalctl -u ssh -u sshd --since '1 hour ago' --no-pager | grep -i penalt
```

**판정 기준:** 벌점 관련 로그가 해당 출발지 IP로 찍히고, 시간이 지나면 저절로 다시 접속된다면 이 기능이 원인일 가능성이 큽니다. 먼저 반복 실패를 만든 원인(잘못된 키, 만료된 계정, 과도한 재시도)을 고칩니다. 관리망처럼 확실히 신뢰하는 대역만 예외로 둘 수 있습니다.

```text
# /etc/ssh/sshd_config (또는 sshd_config.d/*.conf) — 예시 대역은 실제 관리망으로 교체
PerSourcePenaltyExemptList 192.0.2.0/24
```

예외를 넓게 잡으면 무차별 대입 방어가 약해지므로 공용 NAT·클라우드 전체 대역은 넣지 않습니다. 옵션 이름과 기본값은 [sshd_config 매뉴얼](https://man.openbsd.org/sshd_config#PerSourcePenalties)에서 서버 버전 기준으로 확인하세요.

## 4. 계정별 정책과 sshd 상태 확인

```bash
sudo sshd -T | grep -iE 'allowusers|denyusers|allowgroups|denygroups'
sudo sshd -t
```

`Match` 조건이 있는 환경에서는 단순 `sshd -T` 결과만으로 특정 연결의 설정을 판단하지 않습니다. 관리자가 실제 사용자·원격 주소 등을 `sshd -T -C`에 지정해 유효 설정을 확인할 수 있습니다. 실행 전 로컬 `man sshd`에서 지원 옵션을 확인하세요.

설정을 바꿔야 한다면 아래 **설정 변경 후 확인과 재발 방지**의 순서(기존 세션 유지 → 문법 검사 → reload → 새 터미널에서 확인)대로 적용합니다. 리슨 중이던 프로세스가 내려갔다면 먼저 journal의 시작 실패 원인을 수정합니다.

## 5. hosts.deny는 구형 환경에서만 확인

OpenSSH는 **6.7에서 TCP Wrappers/libwrap 지원을 제거**했습니다. 따라서 현대 OpenSSH 서버에서 `/etc/hosts.deny`를 고치는 것을 기본 해결책으로 안내하면 맞지 않습니다. 구형 패키지나 별도 패치로 libwrap을 사용하는 환경인지 확인된 경우에만 조사합니다. [OpenSSH 6.7 릴리스 노트](https://www.openssh.org/txt/release-6.7)

현재 서버의 방화벽은 배포 구성에 따라 nftables, iptables, UFW, 클라우드 보안그룹 등에서 확인합니다. 진단을 위해 전체 방화벽을 해제하기보다 필요한 출발지·목적지·포트 규칙을 확인하세요.

## 접속 경로가 모두 막혔을 때

호스팅 관리 콘솔, 사전에 구성한 시리얼 콘솔, 복구 환경 등 별도 관리 경로를 이용합니다. 클라우드 시리얼 콘솔은 인스턴스·계정·OS별 사전 조건이 있어 버튼만 누르면 항상 연결되는 기능은 아닙니다.

복구 뒤에는 **원인 로그 → 변경한 규칙 → 새 연결 성공 여부**를 기록합니다. 특정 IP 차단인지, 동시 연결 제한인지, sshd 장애인지 확인된 원인에 따라 재발 방지 조치를 선택하세요.

차단 원인을 확인한 뒤 방어 설정을 정리하려면 [SSH 하드닝과 Fail2Ban 구성](/engineer/ssh-hardening-fail2ban)을 참고하세요.

## 설정 변경 후 확인과 재발 방지

원인을 찾아 sshd 설정을 바꿨다면, 적용 과정에서 스스로 접속을 잃지 않도록 순서를 지키는 것이 중요합니다.

**안전한 적용 순서**
1. 기존 SSH 세션 하나를 열어 둔 채로 작업합니다(적용 실패 시 되돌릴 통로).
2. 문법 검사 후 적용합니다.

```bash
sudo sshd -t && echo "config OK"
# 실제 적용된 값 확인 (Include 파일 포함 최종 값)
sudo sshd -T | grep -Ei 'maxstartups|maxsessions|persourcepenalties|logingracetime'
# 재적용 (배포판에 따라 서비스 이름이 ssh 또는 sshd)
sudo systemctl reload ssh || sudo systemctl reload sshd
```

3. 새 터미널에서 접속을 시험한 뒤에만 기존 세션을 닫습니다.

**로그로 원인 재확인**

```bash
sudo journalctl -u ssh -u sshd --since "1 hour ago" | grep -Ei 'MaxStartups|penalt|refused|reset'
```

"past MaxStartups" 문구가 보이면 동시 미인증 연결 한도, penalty 관련 문구가 보이면 위 3-1의 PerSourcePenalties를 확인합니다.

**재발 방지**
- 배포·모니터링 도구처럼 접속이 몰리는 출발지는 연결 재사용(`ControlMaster`/`ControlPersist`)을 설정해 새 연결 수를 줄입니다.
- 공개 인터넷의 무차별 대입 시도는 방화벽에서 출발지를 제한하거나 VPN·배스천 뒤로 옮겨 sshd까지 도달하지 않게 합니다.
- `ss -Htn state established '( sport = :22 )' | wc -l` 값을 주기적으로 수집해 평소 동시 접속 수를 알아 두면, 한도 조정의 근거가 됩니다. `-H`(헤더 생략)를 빼면 제목 줄까지 세어 1이 더 나옵니다. 이 값은 인증을 마친 세션도 포함하므로 `MaxStartups`(미인증 연결) 판단에는 로그의 "past MaxStartups"를 함께 봅니다. [ss 매뉴얼](https://man7.org/linux/man-pages/man8/ss.8.html)
$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$ssh.socket(22.10+)·OpenSSH 9.8 sshd-session/PerSourcePenalties 반영, 중복 reload 블록 제거, ss 카운트 헤더 수정$q$::text))
WHERE id=640 AND md5(content)='6324133cb1d0a5e43789c83163c5f187';
UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$`kex_exchange_identification: read: Connection reset by peer` means the connection was reset during the SSH key-exchange phase. You may also see `Connection closed by remote host`. **This string alone cannot confirm a Fail2Ban ban.** Correlate the client's `ssh -vvv` output with server logs from the same timestamp to narrow the cause.

## Distinguish SSH connection errors first

| Error | Check first |
|---|---|
| `Connection refused` | Whether the SSH port is listening, address/port, connection-refusal rules |
| `Connection timed out` | Path, firewalls, security groups, unresponsive server |
| `kex_exchange_identification ... reset by peer` | Pre-auth connection limits, blocking devices, sshd logs |
| `Permission denied (publickey)` | User and key authentication after the server is reached |

Key-authentication failures and connection-reset errors follow different diagnostic sequences. For a general classification of connection errors, continue with the [SSH connection troubleshooting guide](/engineer/ssh-connection-troubleshoot).

## 1. Record the hang point and timestamp with ssh -vvv

```bash
# 클라이언트에서 실행: 사용자·주소·포트 교체
ssh -vvv -o ConnectTimeout=10 -p 22 user@host
```

Record not only the last line but how far you get: `Connecting to`, `Connection established`, the remote version string, and authentication-method prompts. Verbose logs help narrow possible causes; they do not by themselves prove which component blocked the connection.

If you have a server console or an existing admin session, inspect logs from the same time.

```bash
# The service is named ssh or sshd depending on the distribution
sudo journalctl -u ssh -u sshd --since '15 minutes ago' --no-pager
sudo ss -ltnp
```

**What you see depends on version and distribution.**
- Ubuntu 22.10 and later (including 24.04 LTS) use systemd socket activation (`ssh.socket`) by default. It is normal for `ss -ltnp` to show `systemd`, not `sshd`, holding port 22. After changing `Port` or `ListenAddress`, run `sudo systemctl daemon-reload && sudo systemctl restart ssh.socket` so the socket is reopened. [Ubuntu: sshd socket-based activation](https://discourse.ubuntu.com/t/sshd-now-uses-socket-based-activation-ubuntu-22-10-and-later/30189)
- From OpenSSH 9.8, per-connection work runs in a separate `sshd-session` binary, so some log lines are tagged `sshd-session` rather than `sshd`. Searching only for `sshd` can miss them. [OpenSSH 9.8 release notes](https://www.openssh.com/txt/release-9.8)
- Check the server's OpenSSH version with `ssh -V` (client from the same package) or the package manager (`dpkg -l openssh-server`, `rpm -q openssh-server`).

If the server has no records at all, also check the destination, port, intermediate firewalls, and NAT path. A successful ping only confirms ICMP replies; it does not guarantee that the SSH port is working.

## 2. If it fails only from a specific source IP, check ban records

On a server that actually runs Fail2Ban, check the following.

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

`sshd` is an example jail name. Match active jails against the source IP the server observed. In NAT or VPN environments, the client's private IP may differ from the IP the server sees.

Run the following only if a confirmed legitimate admin IP is banned in that jail and you have permission to unban it.

```bash
# 203.0.113.10은 예시 주소: 실제 차단 IP로 교체
sudo fail2ban-client set sshd unbanip 203.0.113.10
```

If you do not also fix the authentication-failure cause, it can get banned again. [Fail2Ban client command documentation](https://github.com/fail2ban/fail2ban/blob/master/man/fail2ban-client.1)

## 3. If it happens only under concurrent connections, check MaxStartups

```bash
sudo sshd -T | grep -iE 'maxstartups|persourcemaxstartups|logingracetime'
```

`MaxStartups` limits concurrent connections that have not completed authentication. For example, if the effective setting is `10:30:100`, new connections start being refused with 30% probability once there are 10 unauthenticated connections, and all are refused at 100. This is **different from MaxSessions, which limits the number of completed login sessions.** Check the actual effective setting for your version and distribution. [OpenSSH sshd_config](https://man.openbsd.org/sshd_config#MaxStartups)

First check whether automation jobs open many connections at once. After considering reducing deployment concurrency and reusing connections, adjust the limit to match server capacity and security policy. If the situation was caused by attack traffic, raising the limit alone can increase load.

## 3-1. OpenSSH 9.8+: when one source keeps being refused for a while

From OpenSSH 9.8, `PerSourcePenalties` is **on by default**. Source addresses that repeatedly fail authentication, or connect repeatedly without completing it, accrue penalty time; above a threshold, new connections from that address (and its `PerSourceNetBlockSize` range) are refused until the penalty expires. It typically shows up as a deployment tool retrying with a wrong key, or a whole office behind one NAT exit being blocked together. [OpenSSH 9.8 release notes](https://www.openssh.com/txt/release-9.8)

```bash
ssh -V                                  # below 9.8 this section does not apply
sudo sshd -T | grep -iE 'persourcepenalt|persourcenetblocksize'
sudo journalctl -u ssh -u sshd --since '1 hour ago' --no-pager | grep -i penalt
```

**How to decide:** if penalty-related log lines show the source IP and access recovers on its own after a while, this feature is the likely cause. Fix what produced the repeated failures first (wrong key, expired account, aggressive retries). Exempt only ranges you fully trust, such as a management network.

```text
# /etc/ssh/sshd_config (or sshd_config.d/*.conf) — replace the example range with your management network
PerSourcePenaltyExemptList 192.0.2.0/24
```

Broad exemptions weaken brute-force protection, so do not add shared NAT or whole cloud ranges. Check option names and defaults for your server version in the [sshd_config manual](https://man.openbsd.org/sshd_config#PerSourcePenalties).

## 4. Check per-account policies and sshd status

```bash
sudo sshd -T | grep -iE 'allowusers|denyusers|allowgroups|denygroups'
sudo sshd -t
```

In environments with `Match` conditions, do not infer a specific connection's settings from a plain `sshd -T` dump alone. An administrator can pass the actual user, remote address, and so on to `sshd -T -C` to inspect the effective configuration. Before running it, check supported options in the local `man sshd`.

If you need to change the configuration, follow the order in **Verifying Changes and Preventing Recurrence** below (keep a session open → syntax check → reload → test from a new terminal). If the listening process went down, first fix the startup-failure cause in the journal.

## 5. Check hosts.deny only on legacy environments

OpenSSH **removed TCP Wrappers/libwrap support in 6.7**. Therefore, telling people to edit `/etc/hosts.deny` as a default fix is not appropriate for modern OpenSSH servers. Investigate only when you have confirmed a legacy package or a custom patch that still uses libwrap. [OpenSSH 6.7 release notes](https://www.openssh.org/txt/release-6.7)

Check the current server firewall according to the distro setup: nftables, iptables, UFW, cloud security groups, and so on. Rather than disabling the entire firewall for diagnosis, inspect the required source, destination, and port rules.

## When every access path is blocked

Use a separate management path: the hosting admin console, a preconfigured serial console, a recovery environment, and so on. A cloud serial console has instance-, account-, and OS-specific prerequisites; it does not always connect just because you click a button.

After recovery, record **cause logs → rules you changed → whether a new connection succeeded**. Choose recurrence-prevention measures based on the confirmed cause: a specific IP ban, a concurrent-connection limit, or an sshd failure.

After you have identified the block cause, see [SSH hardening and Fail2Ban configuration](/engineer/ssh-hardening-fail2ban) to tidy up defensive settings.

## Verifying Changes and Preventing Recurrence

Once you've found the cause and changed sshd settings, follow an order that won't lock you out while applying them.

**Safe order**
1. Keep one existing SSH session open while you work (your way back if something fails).
2. Test syntax, then apply.

```bash
sudo sshd -t && echo "config OK"
# effective values, including Include files
sudo sshd -T | grep -Ei 'maxstartups|maxsessions|persourcepenalties|logingracetime'
# reload (service name is ssh or sshd depending on distro)
sudo systemctl reload ssh || sudo systemctl reload sshd
```

3. Test a new connection from another terminal before closing the old session.

**Reconfirm the cause in logs**

```bash
sudo journalctl -u ssh -u sshd --since "1 hour ago" | grep -Ei 'MaxStartups|penalt|refused|reset'
```

"past MaxStartups" points to the unauthenticated-connection limit; penalty-related lines point to PerSourcePenalties (section 3-1 above).

**Prevention**
- For sources that open many connections (deployment and monitoring tools), enable connection reuse (`ControlMaster`/`ControlPersist`) to cut new connections.
- Keep internet brute-force attempts from reaching sshd by restricting sources at the firewall or moving SSH behind a VPN or bastion.
- Periodically collect `ss -Htn state established '( sport = :22 )' | wc -l` to know normal concurrency, which gives you a basis for tuning limits. Without `-H` (no header) the header line is counted too. The value includes authenticated sessions, so for `MaxStartups` (unauthenticated connections) also check the "past MaxStartups" log lines. [ss manual](https://man7.org/linux/man-pages/man8/ss.8.html)
$q$::text))
WHERE id=640 AND md5(content_evidence->'en'->>'content')='0b4ce1e437eb03557ac849df7d264ea0';

-- post 817: Docker 구독 조건·가격을 공식 페이지 기준으로 정정, 전환 비용 포함 TCO·손익분기 공식, 기동시간 측정 스크립트 수정
UPDATE posts SET content=$q$## 어느 날 법무팀에서 온 메일 한 통

"우리 회사, Docker Desktop 유료 라이선스 대상인지 확인 부탁드립니다."

국내 개발팀 리드가 가장 곤란해하는 메일 중 하나입니다. Docker 구독 약관상 Docker Desktop은 **직원 250명 미만이면서 연매출 1,000만 달러 미만**인 소규모 사업자와 개인·교육·비상업 오픈소스 용도에는 무료이고, 그 밖의 조직이 업무에 쓰려면 Pro·Team·Business 중 하나의 유료 구독이 필요합니다(2026-10 확인). [Docker Desktop license agreement](https://docs.docker.com/subscription/desktop-license/) 계열사 합산처럼 해석이 필요한 부분은 약관 원문과 법무 검토로 판정하세요. 이 글의 금액은 2026-10 기준 공개 가격으로 계산 방법을 보여 주는 예시이며 환율·세금·할인은 반영하지 않았습니다.

문제는 "그럼 무료 대안 쓰죠"가 생각보다 간단하지 않다는 점입니다. Testcontainers를 쓰는 통합 테스트가 깨지고, `/var/run/docker.sock`을 하드코딩한 사내 스크립트가 멈추고, macOS에서 `node_modules` 볼륨 마운트 성능이 체감으로 달라집니다. 라이선스비 몇 백만 원을 아끼려다 개발자 20명의 하루를 태우면 손익이 뒤집힙니다.

이 글은 다음 5가지 질문에 답합니다.

1. 우리 팀 조건에서 어떤 도구를 골라야 하는가 (30초 판정표)
2. 실제로 돈이 얼마나 절약되는가 (팀 규모별 TCO 계산식)
3. 성능·호환성은 어디까지 감수해야 하는가 (9개 항목 비교)
4. 어떤 명령으로 옮기는가 (마이그레이션 런북)
5. 오히려 Docker Desktop을 유지해야 하는 경우는 언제인가

---

## 30초 선택 판정표: 결론부터 봅니다

아래 트리를 위에서부터 따라가세요.

```text
Q1. 우리 조직이 Docker Desktop 유료 라이선스 적용 대상인가?
    (직원 250명 이상 또는 연매출 1,000만 달러 이상이면 대상 — 약관 원문 확인)
 ├─ NO  → 그대로 무료 사용. 이 글의 나머지는 "성능 튜닝 참고용"으로만 보세요.
 └─ YES → Q2로

Q2. 팀의 주력 OS는?
 ├─ macOS (Apple Silicon) → Q3으로  (OrbStack 유력)
 ├─ macOS (Intel)         → Q3으로  (OrbStack 이점 축소, Rancher 경쟁력 상승)
 └─ Windows + WSL2        → Q3으로  (OrbStack 제외, Rancher/Podman 2파전)

Q3. 로컬에 쿠버네티스 클러스터가 상시 필요한가?
 ├─ YES → 결론 B (Rancher Desktop)
 └─ NO  → Q4로

Q4. 회사 정책상 해외 상용 SaaS 구독 결제가 가능한가?
 ├─ YES → 결론 A (OrbStack)
 └─ NO  → 결론 C (Podman Desktop)
```

### 결론 한 줄 근거

| 결론 | 도구 | 한 줄 근거 |
|---|---|---|
| **A** | OrbStack | macOS 전용 네이티브 가상화로 부팅·파일 I/O 체감이 가장 빠르고, docker CLI 호환이 사실상 무손실. 단 유료(팀 사용 시)이며 macOS 외 지원 없음 |
| **B** | Rancher Desktop | k3s 기반 로컬 K8s가 토글 하나로 켜지고 Windows/macOS/Linux 전부 커버. 오픈소스라 라이선스비 0 |
| **C** | Podman Desktop | rootless·데몬리스 구조로 보안 심사에 유리하고 완전 무료. docker 호환은 소켓 에뮬레이션으로 해결하지만 예외 케이스가 존재 |

### 보조 선택지: GUI가 필요 없다면 colima

CLI만 쓰고 GUI 대시보드가 전혀 필요 없는 팀이라면 **colima**가 가장 가벼운 답입니다. Homebrew로 설치하고 `colima start`면 끝이며, docker CLI와 그대로 붙습니다.

```bash
brew install colima docker docker-compose
colima start --cpu 4 --memory 8 --vm-type vz --mount-type virtiofs
docker context use colima
docker run --rm hello-world
```

정상 결과: `Hello from Docker!` 문구가 출력됩니다. 실패하면 `colima status`로 VM이 Running인지 먼저 확인하세요. `--vm-type vz`는 macOS 13 이상의 Apple Virtualization.framework를 씁니다. 또 colima는 기본적으로 홈 디렉터리(`/Users/$USER`)만 VM에 마운트하므로, 그 밖의 경로를 바인드 마운트하면 **오류 없이 빈 디렉터리**가 보입니다. 이때는 `~/.colima/default/colima.yaml`의 `mounts`에 경로를 추가하고 `colima restart`합니다. [colima FAQ](https://github.com/abiosoft/colima/blob/main/docs/FAQ.md) 단점은 GUI 부재, 문제 발생 시 로그를 직접 파야 한다는 점, 그리고 팀원 중 비-CLI 사용자가 있으면 지원 부담이 커진다는 점입니다.

> 가격·약관 확인일: 2026-10. 가격·버전·라이선스 조건은 바뀌므로 적용 전 공식 문서를 다시 확인하세요.


---

## 돈 계산: 5인·20인·50인 TCO 비교

무료 도구의 진짜 비용은 **공수**입니다. 아래 계산은 다음 식을 씁니다.

```text
상용 도구 연간 비용 = 1인당 월 단가 × 개발자 수 × 12 + 전환 시간 × 개발자 수 × 시급
오픈소스 연간 비용 = (초기 세팅 시간 + 연간 트러블슈팅 시간) × 개발자 수 × 시급
```

가정값(모두 예시입니다):
- 개발자 시급: 60,000원 (연봉 환산 기준의 대략적 가정)
- 환율: 1달러 = 1,400원
- Docker Desktop: 회사에서 여러 명이 쓰면 **Team**(연 결제 1인당 월 $15, 최대 100명) 또는 **Business**(1인당 월 $24)가 현실적입니다. Pro($9)는 1인 구독입니다. 아래 표는 Team $15 ≈ 21,000원으로 계산합니다. [Docker pricing](https://www.docker.com/pricing/)
- OrbStack: 상업적 사용은 **Pro** 1인당 월 $8(연 $96) ≈ 11,000원 [OrbStack pricing](https://orbstack.dev/pricing). 상용 도구라도 설치·검증 시간이 들므로 전환 시간 1인당 1시간을 넣습니다. 연간 트러블슈팅은 현재 쓰는 Docker Desktop과 비슷하다고 보고 0으로 둡니다.
- 오픈소스 초기 세팅: 1인당 3시간, 연간 트러블슈팅: 1인당 6시간 → 총 9시간

### 5인 팀

| 도구 | 계산식 | 연간 비용 |
|---|---|---|
| Docker Desktop (Team) | 21,000 × 5 × 12 | 1,260,000원 |
| OrbStack Pro | 11,000 × 5 × 12 + 1h × 5 × 60,000 | 960,000원 |
| Rancher Desktop | 9h × 5 × 60,000 | 2,700,000원 |
| Podman Desktop | 9h × 5 × 60,000 | 2,700,000원 |

### 20인 팀

| 도구 | 계산식 | 연간 비용 |
|---|---|---|
| Docker Desktop (Team) | 21,000 × 20 × 12 | 5,040,000원 |
| OrbStack Pro | 11,000 × 20 × 12 + 1h × 20 × 60,000 | 3,840,000원 |
| Rancher Desktop | 9h × 20 × 60,000 | 10,800,000원 |
| Podman Desktop | 9h × 20 × 60,000 | 10,800,000원 |

### 50인 팀

| 도구 | 계산식 | 연간 비용 |
|---|---|---|
| Docker Desktop (Team) | 21,000 × 50 × 12 | 12,600,000원 |
| OrbStack Pro | 11,000 × 50 × 12 + 1h × 50 × 60,000 | 9,600,000원 |
| Rancher Desktop | 9h × 50 × 60,000 | 27,000,000원 |
| Podman Desktop | 9h × 50 × 60,000 | 27,000,000원 |

> Docker Business($24)로 계산하면 50인 기준 연 20,160,000원입니다. 단가는 2026-10 공개 가격, 공수는 가정값입니다.

### 이 표를 어떻게 읽어야 하나

숫자만 보면 "무료 도구가 더 비싸다"는 역설이 나옵니다. 하지만 여기엔 중요한 조건이 붙습니다.

- **공수는 1회성 성격이 강합니다.** 초기 3시간은 첫해만 발생하고, 사내 표준 설치 스크립트를 만들어 배포하면 1인당 20분으로 줄어듭니다. 그러면 50인 팀 2년차 비용은 `(0.33h + 6h) × 50 × 60,000 ≈ 1,900만 원`이 아니라, 트러블슈팅 시간을 절반으로 줄였을 때 `3h × 50 × 60,000 = 900만 원` 수준까지 내려갑니다.
- **반대로 라이선스비는 매년 그대로 나갑니다.** 2년차부터의 손익분기는 다음 식으로 바로 계산할 수 있습니다.
  `손익분기 연간 트러블슈팅 시간(1인) = 1인당 월 단가 × 12 ÷ 시급`
  Team 기준 `21,000 × 12 ÷ 60,000 = 4.2시간`입니다. 오픈소스 전환 후 1인당 연간 트러블슈팅이 4.2시간보다 적으면 2년차부터 오픈소스가 싸고, 많으면 계속 비쌉니다. Business 기준이면 `33,600 × 12 ÷ 60,000 ≈ 6.7시간`입니다.
- **가정한 공수 시간이 현실과 다르면 결론이 뒤집힙니다.** 팀에 컨테이너 숙련자가 있으면 트러블슈팅 시간이 1~2시간으로 떨어지고, 반대로 Testcontainers·복잡한 compose 스택을 쓰면 20시간을 넘길 수도 있습니다.

**핵심 결론: 무료가 항상 싸지 않습니다.** 표를 그대로 베끼지 말고, 위 계산식에 여러분 팀의 실제 시급과 예상 공수를 넣어 다시 계산하세요. 비용 비교 방법론 자체는 [GitHub Actions vs GitLab CI 요금 비교: 3개 시나리오 실전 계산](/blog/github-actions-vs-gitlab-ci-요금-비교-3개-시나리오-실전-계산)에서 다룬 접근과 동일합니다.

---

## 성능·사용성 9개 항목 비교

### 측정 환경 고지

아래 표는 **일반적으로 보고되는 경향과 각 도구의 아키텍처적 특성**을 정리한 것입니다. 절대 수치가 아니라 상대적 경향으로 읽어야 하며, 정확한 값은 반드시 여러분의 실제 머신과 워크로드에서 직접 측정해야 합니다.

- 기준 환경 가정: macOS Apple Silicon (M계열), 메모리 16GB, VM 할당 4 vCPU / 8GB
- 워크로드 가정: Node.js 프로젝트(`node_modules` 수만 개 파일) 바인드 마운트, `node:20-alpine` 기반 이미지 빌드
- 수치는 머신 사양·디스크 상태·이미지 캐시 유무에 따라 크게 달라집니다

| 항목 | Docker Desktop | OrbStack | Rancher Desktop | Podman Desktop |
|---|---|---|---|---|
| 콜드 부팅 | 보통 (수십 초대) | 매우 빠름 (수 초대) | 보통~느림 | 보통 |
| 볼륨 I/O (대량 파일) | 개선됐으나 VM 경계 오버헤드 존재 | 가장 유리 (네이티브 가상화 최적화) | 보통 | 보통, 마운트 옵션 튜닝 필요 |
| 이미지 빌드 | buildx 기본 내장, 빠름 | 빠름 (buildx 호환) | nerdctl/buildkit 기반, 양호 | buildah 기반, 옵션 차이 있음 |
| 유휴 메모리 | 높은 편 | 낮음 (동적 할당) | 중간 | 중간 |
| 로컬 K8s | 내장 K8s 토글 | 내장 K8s 지원 | **k3s 기본 제공** | kind 등 별도 구성 |
| docker CLI 호환 | 기준(100%) | 사실상 무손실 | 높음 (nerdctl 병행) | 소켓 에뮬레이션 필요 |
| compose 호환 | 완전 | 완전 | `nerdctl compose` 등 대체 | `podman compose` (일부 문법 차이) |
| rootless | 부분 지원 | VM 격리 | 지원 | **기본 데몬리스·rootless** |
| 한국어 UI / 국내 지원 | 영문 UI, 글로벌 지원 계약 가능 | 영문 UI, 국내 총판 미확인 | 영문 UI, SUSE 계열 파트너 존재 | 영문 UI, Red Hat 파트너 채널 |


측정을 직접 하고 싶다면 아래처럼 최소한의 재현 스크립트를 돌리세요.

```bash
# 1) 런타임 기동 시간: 도구를 완전히 종료한 뒤, 비교할 도구의 시작 명령 한 줄만 남기고 실행
start=$(date +%s)
docker desktop start          # 또는: open -a OrbStack / colima start / podman machine start / rdctl start
until docker info >/dev/null 2>&1; do sleep 1; done
echo "ready in $(( $(date +%s) - start ))s"

# 2) 바인드 마운트 파일 I/O: 홈 디렉터리 아래에서 실행(colima 기본 마운트 범위)
mkdir -p ~/iotest && cd ~/iotest
time docker run --rm -v "$PWD":/w -w /w alpine \
  sh -c 'for i in $(seq 1 5000); do echo x > f_$i; done'
cd ~ && rm -rf ~/iotest

# 3) 빌드 시간 (캐시 없이, 같은 Dockerfile로 도구마다 비교)
time docker build --no-cache -t bench:local .
```

읽는 법: `time`은 호스트 셸에서 재므로 컨테이너 시작 시간까지 포함됩니다. 절대값보다 **같은 머신에서 도구별로 3회씩 잰 중앙값**을 비교하세요. 1번이 끝나지 않고 계속 기다리면 `docker context ls`로 현재 컨텍스트가 방금 시작한 도구를 가리키는지 확인합니다. `docker desktop start`는 Docker Desktop CLI가 들어 있는 버전에서만 동작합니다. [Docker Desktop CLI](https://docs.docker.com/desktop/features/desktop-cli/) 예전 판의 `time docker info`는 이미 떠 있는 데몬의 응답 시간만 재므로 기동 시간 측정이 아니었고, 컨테이너 안의 `time ( ... )`은 alpine의 기본 셸에서 동작하지 않아 이번에 바꿨습니다.

볼륨 마운트 방식이 성능에 미치는 영향은 [Docker 볼륨 vs 바인드마운트 — 데이터 영속성 완전 가이드](/engineer/docker-volume-bind-mount-guide)에서 개념부터 정리해 두었습니다.

---

## 마이그레이션 런북

### 1단계: 현재 상태 백업

```bash
# 이미지 목록 저장
docker images --format '{{.Repository}}:{{.Tag}}' > images.txt

# 중요한 이미지 아카이브
docker save -o backup-images.tar $(cat images.txt | grep -v '<none>' | tr '\n' ' ')

# 볼륨 백업 (볼륨명 my_data 예시)
docker run --rm -v my_data:/src -v "$PWD":/dst alpine \
  tar czf /dst/my_data.tgz -C /src .
```

정상 결과: `backup-images.tar`와 `my_data.tgz` 파일이 생성됩니다. `tar: /src: Cannot open` 오류가 나면 볼륨명이 틀린 것이므로 `docker volume ls`로 정확한 이름을 확인하세요.

### 2단계: 새 런타임 연결

```bash
# --- OrbStack / colima 계열 ---
docker context ls
docker context use orbstack        # 또는 colima
docker version                     # Server 섹션이 표시되면 성공

# --- Rancher Desktop ---
docker context use rancher-desktop
nerdctl ps                         # containerd 백엔드 사용 시

# --- Podman ---
podman machine init --cpus 4 --memory 8192
podman machine start
podman system connection list

# docker CLI를 그대로 쓰고 싶을 때: 소켓 경로를 환경변수로 지정
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
docker ps                          # podman 백엔드로 응답
```

`DOCKER_HOST`는 `~/.zshrc`에 넣어 팀 전체에 배포하면 됩니다. 다만 컨텍스트와 환경변수를 동시에 쓰면 충돌하므로 **한 가지 방식만 선택**하세요.

### 3단계: 이미지·볼륨 복원

```bash
docker load -i backup-images.tar
docker volume create my_data
docker run --rm -v my_data:/dst -v "$PWD":/src alpine \
  tar xzf /src/my_data.tgz -C /dst
```

### 4단계: compose 실행 확인

```bash
# Podman
podman compose up -d
# Rancher Desktop (containerd 백엔드)
nerdctl compose up -d
# OrbStack / colima
docker compose up -d
```

---

## 자주 깨지는 5가지와 우회법

### ① compose 파일 문법 차이

`podman compose`는 내부적으로 외부 compose 구현을 호출하며, `depends_on`의 `condition`, `extends`, 일부 `x-` 확장 필드에서 동작 차이가 보고됩니다.

- 증상: `unsupported key` 또는 서비스 기동 순서가 뒤엉킴
- 우회: `podman-compose` 대신 `docker-compose` 바이너리 + `DOCKER_HOST` 조합을 쓰거나, `depends_on` 대신 애플리케이션 레벨 재시도 로직으로 대체

### ② `/var/run/docker.sock` 하드코딩과 Testcontainers

가장 자주 발목을 잡는 지점입니다. CI 스크립트, Testcontainers, 일부 IDE 플러그인이 소켓 경로를 고정해 두고 있습니다.

macOS에서 `/var/run/docker.sock`을 직접 `ln -sf`로 만들면 재부팅·머신 재생성 때 깨집니다. Podman 공식 설치 패키지는 이 링크를 관리하는 `podman-mac-helper`를 함께 설치합니다. Homebrew 등으로 설치해 링크가 없다면 한 번 실행합니다(관리자 권한 필요, 공식 패키지 경로는 `/opt/podman/bin`).

```bash
sudo podman-mac-helper install
podman machine stop && podman machine start
ls -l /var/run/docker.sock          # podman.sock을 가리키면 정상
```

Testcontainers는 공식 문서의 Podman 설정을 환경변수로 줍니다.

```bash
# macOS
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
# Linux rootless Podman
export DOCKER_HOST="unix://${XDG_RUNTIME_DIR}/podman/podman.sock"
export TESTCONTAINERS_RYUK_DISABLED=true
```

rootless Podman에서는 공식 문서대로 Ryuk(정리 컨테이너)을 꺼야 합니다. 이 경우 테스트가 끝난 컨테이너가 자동으로 정리되지 않으므로 CI에 정리 단계(예: 라벨 `org.testcontainers=true` 컨테이너 삭제)를 둡니다. 예전에 쓰던 `ryuk.container.privileged=true`는 Testcontainers for Java 1.19.0부터 필요 없습니다. [Testcontainers: 지원 런타임](https://java.testcontainers.org/supported_docker_environment/)

### ③ 파일 권한과 uid 매핑

rootless 환경에서는 컨테이너 내부 uid가 호스트 uid로 그대로 매핑되지 않습니다.

- 증상: 바인드 마운트한 디렉터리에 `Permission denied`
- 우회: `--userns=keep-id` 옵션 사용, 또는 Dockerfile에서 `USER`를 호스트 uid와 맞춤

```bash
podman run --rm --userns=keep-id -v "$PWD":/w:Z -w /w alpine touch test.txt
```

SELinux가 켜진 환경(주로 Linux)에서는 `:Z` 라벨이 필수입니다. macOS에서는 무시됩니다.

### ④ DNS·포트 포워딩 차이

컨테이너 간 이름 해석과 `host.docker.internal` 동작이 도구마다 다릅니다.

- Podman: `host.containers.internal`을 사용하며, `--add-host=host.docker.internal:host-gateway`로 별칭 추가 가능
- Rancher Desktop: 포트가 자동 노출되지 않는 설정이 있으므로 GUI의 네트워크 설정 확인

```bash
podman run --rm --add-host=host.docker.internal:host-gateway alpine \
  ping -c1 host.docker.internal
```

### ⑤ buildx 빌더 부재

멀티 아키텍처 빌드(`--platform linux/amd64,linux/arm64`)를 쓰던 팀은 대체 경로가 필요합니다.

```bash
# Podman: 매니페스트 방식
podman build --platform linux/amd64 -t app:amd64 .
podman build --platform linux/arm64 -t app:arm64 .
podman manifest create app:multi
podman manifest add app:multi app:amd64
podman manifest add app:multi app:arm64
podman manifest push app:multi docker://registry.example.com/app:multi

# Rancher Desktop: buildkit 직접 사용
nerdctl build --platform=amd64,arm64 -t app:multi .
```

가장 안전한 대안은 **멀티아키 빌드를 로컬에서 하지 않고 CI로 옮기는 것**입니다. 로컬 런타임 선택과 무관해지므로 마이그레이션 리스크가 사라집니다.

---

## "그냥 Docker Desktop 유지"가 정답인 5가지 경우

솔직하게 말하면, 아래에 해당하면 전환하지 않는 편이 낫습니다.

1. **Testcontainers 기반 통합 테스트가 핵심 파이프라인인 경우** — Ryuk, 소켓 경로, 권한 문제가 겹치면 디버깅 비용이 라이선스비를 금방 넘어섭니다.
2. **엔터프라이즈 보안 스캐닝·정책 관리 기능을 이미 쓰고 있는 경우** — 이미지 취약점 스캔, 레지스트리 접근 제어 같은 관리 기능은 무료 대안에서 별도 도구로 재구성해야 합니다.
3. **비개발 직군까지 도커를 쓰는 조직** — 기획자·QA가 GUI로 컨테이너를 켜고 끄는 환경이라면, CLI 의존도가 높은 대안은 지원 요청 폭증으로 이어집니다.
4. **벤더 지원 계약이 감사 요건인 경우** — 금융·공공 프로젝트에서 "공식 벤더 지원 여부"가 체크리스트에 있으면 오픈소스 전환이 오히려 감사 리스크가 됩니다.
5. **라이선스 대상 조직 안의 소규모 팀** — 대기업 계열사의 5인 팀이라면 Team 기준 연 126만 원을 아끼려고 45시간(시급 6만 원 가정 시 270만 원)을 쓰는 셈입니다. 단독 소규모 회사는 애초에 무료 대상일 수 있으니 약관 기준부터 확인하세요.

---

## 30일 전환 체크리스트

| 기간 | 작업 | 완료 기준 |
|---|---|---|
| D+1~3 | 라이선스 적용 대상 여부 공식 확인, 현재 사용 실태 조사 | 개발자 수·OS 분포·Testcontainers 사용 여부 문서화 |
| D+4~7 | 판정표로 후보 1개 선정, 파일럿 인원 2~3명 지정 | 후보 도구 확정 및 승인 |
| D+8~14 | 파일럿: 주력 프로젝트 1개를 새 런타임에서 완전 기동 | `compose up` → 전체 테스트 통과 |
| D+15~18 | 깨지는 지점 목록화 + 우회법 사내 문서화 | 위 5가지 항목별 대응 여부 기록 |
| D+19~25 | 표준 설치 스크립트 배포, 팀 절반 확산 | 1인당 설치 시간 30분 이내 달성 |
| D+26~30 | 전면 확산 또는 롤백 판정 | 아래 롤백 기준 미달 시 전면 전환 |

**롤백 기준(하나라도 해당하면 Docker Desktop 유지):**
- 파일럿 기간 중 1인당 트러블슈팅 시간이 8시간을 초과
- CI/CD 파이프라인이 로컬 런타임 차이로 실패
- 주력 프로젝트의 개발 사이클(빌드+테스트) 시간이 30% 이상 증가


---

## 자주 묻는 질문 (FAQ)

**Q1. Docker Desktop 유료 라이선스 기준은 정확히 무엇인가요?**
A. 2026-10 기준 약관은 **직원 250명 미만이면서 연매출 1,000만 달러 미만**인 사업자, 개인·교육·비상업 오픈소스 용도를 무료로 두고, 그 밖의 업무용 사용에는 Pro·Team·Business 구독을 요구합니다. [Docker Desktop license agreement](https://docs.docker.com/subscription/desktop-license/) 자회사·계열사 합산 여부처럼 해석이 갈리는 부분은 약관 원문을 기준으로 법무·구매 부서와 함께 판정하세요.

**Q2. Podman Desktop으로 바꾸면 기존 `docker` 명령을 다시 배워야 하나요?**
A. 대부분 그대로 씁니다. `podman`은 docker CLI와 명령 호환성이 높고, `alias docker=podman` 또는 `DOCKER_HOST` 환경변수로 기존 스크립트를 유지할 수 있습니다. 다만 rootless 특성상 권한·네트워크 동작에서 차이가 나므로, 본문의 "자주 깨지는 5가지"를 사전에 점검하세요.

**Q3. OrbStack은 Windows에서도 쓸 수 있나요?**
A. OrbStack은 macOS 전용입니다. Windows/WSL2 환경이 섞인 팀이라면 OS별로 다른 도구를 쓰거나, Rancher Desktop·Podman Desktop처럼 크로스 플랫폼을 지원하는 쪽으로 표준을 통일하는 편이 운영 부담이 적습니다.$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$Docker 구독 조건·가격을 공식 페이지 기준으로 정정, 전환 비용 포함 TCO·손익분기 공식, 기동시간 측정 스크립트 수정$q$::text))
WHERE id=817 AND md5(content)='b9d6c3100a710d93e5a18d6a0dcd86ea';
UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$## The email that arrived from Legal one day

"Please confirm whether our company is in scope for Docker Desktop’s paid license."

It’s one of the emails engineering leads in Korea dread most. Under Docker’s subscription terms, Docker Desktop is free for small businesses with **fewer than 250 employees and less than $10 million in annual revenue**, and for personal use, education, and non-commercial open source; other organizations need a paid Pro, Team, or Business subscription for professional use (checked October 2026). [Docker Desktop license agreement](https://docs.docker.com/subscription/desktop-license/) Questions that need interpretation, such as whether affiliates are counted together, should be settled against the agreement text with Legal. Amounts in this article use public prices as of October 2026 to illustrate the method; exchange rates, taxes, and discounts are not included.

The problem is that “then let’s just use a free alternative” is not as simple as it sounds. Integration tests that use Testcontainers start failing, internal scripts that hardcode `/var/run/docker.sock` stop working, and bind-mount performance for `node_modules` on macOS feels noticeably different. Save a few million KRW on licenses only to burn a full day of 20 developers, and the economics flip.

This article answers five questions:

1. Which tool should our team pick given our constraints? (30-second decision tree)
2. How much money do we actually save? (TCO formulas by team size)
3. How much performance and compatibility should we accept as trade-offs? (9-point comparison)
4. Which commands do we use to migrate? (migration runbook)
5. When should we actually keep Docker Desktop?

---

## 30-second decision tree: start with the conclusion

Follow the tree from the top.

```text
Q1. Is our organization in scope for Docker Desktop’s paid license?
    (In scope if 250+ employees or $10M+ annual revenue — check the agreement text)
 ├─ NO  → Keep using it for free. Treat the rest of this article as performance-tuning reference only.
 └─ YES → Go to Q2

Q2. What is the team’s primary OS?
 ├─ macOS (Apple Silicon) → Go to Q3  (OrbStack is the frontrunner)
 ├─ macOS (Intel)         → Go to Q3  (OrbStack’s edge shrinks; Rancher becomes more competitive)
 └─ Windows + WSL2        → Go to Q3  (OrbStack is out; Rancher vs. Podman)

Q3. Do we need a local Kubernetes cluster running at all times?
 ├─ YES → Conclusion B (Rancher Desktop)
 └─ NO  → Go to Q4

Q4. Can the company pay for a commercial SaaS subscription billed overseas?
 ├─ YES → Conclusion A (OrbStack)
 └─ NO  → Conclusion C (Podman Desktop)
```

### One-line rationale for each conclusion

| Conclusion | Tool | One-line rationale |
|---|---|---|
| **A** | OrbStack | Native virtualization on macOS only: fastest perceived boot and file I/O, and docker CLI compatibility is effectively lossless. Paid for team use, and no support outside macOS |
| **B** | Rancher Desktop | Local K8s based on k3s turns on with a single toggle; covers Windows, macOS, and Linux. Open source, so license cost is 0 |
| **C** | Podman Desktop | Rootless, daemonless architecture is easier to get through security review, and fully free. docker compatibility is handled via socket emulation, but edge cases exist |

### Backup option: colima if you don’t need a GUI

If your team only uses the CLI and has no need for a GUI dashboard, **colima** is the lightest answer. Install via Homebrew, run `colima start`, and you’re done—it attaches to the docker CLI as-is.

```bash
brew install colima docker docker-compose
colima start --cpu 4 --memory 8 --vm-type vz --mount-type virtiofs
docker context use colima
docker run --rm hello-world
```

Expected result: the `Hello from Docker!` message is printed. If it fails, first check that the VM is Running with `colima status`. `--vm-type vz` uses Apple’s Virtualization.framework on macOS 13 or later. By default colima mounts only your home directory (`/Users/$USER`) into the VM, so bind-mounting any other path shows **an empty directory with no error**. Add the path under `mounts` in `~/.colima/default/colima.yaml` and run `colima restart`. [colima FAQ](https://github.com/abiosoft/colima/blob/main/docs/FAQ.md) The downsides: no GUI, you have to dig through logs yourself when something breaks, and support load grows if any teammates are not CLI-native.

> Prices and terms checked October 2026. Prices, versions, and license terms change—recheck the official docs before applying.


---

## Running the numbers: TCO for 5-, 20-, and 50-person teams

The real cost of free tools is **labor hours**. The calculations below use these formulas.

```text
Commercial tool annual cost = monthly price per seat × number of developers × 12 + switching hours × number of developers × hourly rate
Open-source annual cost = (initial setup hours + annual troubleshooting hours) × number of developers × hourly rate
```

Assumptions (all examples):
- Developer hourly rate: 60,000 KRW (a rough assumption based on converting annual salary)
- Exchange rate: $1 = 1,400 KRW
- Docker Desktop: for several people under a company account, **Team** ($15 per user per month billed annually, up to 100 users) or **Business** ($24 per user per month) is the realistic plan; Pro ($9) is a single-user subscription. The tables use Team at $15 ≈ 21,000 KRW. [Docker pricing](https://www.docker.com/pricing/)
- OrbStack: commercial use needs **Pro** at $8 per user per month ($96 a year) ≈ 11,000 KRW [OrbStack pricing](https://orbstack.dev/pricing). A commercial tool still takes time to install and verify, so we add 1 switching hour per person. Annual troubleshooting is assumed similar to the current Docker Desktop and set to 0.
- Open-source initial setup: 3 hours per person; annual troubleshooting: 6 hours per person → 9 hours total

### 5-person team

| Tool | Formula | Annual cost |
|---|---|---|
| Docker Desktop (Team) | 21,000 × 5 × 12 | 1,260,000 KRW |
| OrbStack Pro | 11,000 × 5 × 12 + 1h × 5 × 60,000 | 960,000 KRW |
| Rancher Desktop | 9h × 5 × 60,000 | 2,700,000 KRW |
| Podman Desktop | 9h × 5 × 60,000 | 2,700,000 KRW |

### 20-person team

| Tool | Formula | Annual cost |
|---|---|---|
| Docker Desktop (Team) | 21,000 × 20 × 12 | 5,040,000 KRW |
| OrbStack Pro | 11,000 × 20 × 12 + 1h × 20 × 60,000 | 3,840,000 KRW |
| Rancher Desktop | 9h × 20 × 60,000 | 10,800,000 KRW |
| Podman Desktop | 9h × 20 × 60,000 | 10,800,000 KRW |

### 50-person team

| Tool | Formula | Annual cost |
|---|---|---|
| Docker Desktop (Team) | 21,000 × 50 × 12 | 12,600,000 KRW |
| OrbStack Pro | 11,000 × 50 × 12 + 1h × 50 × 60,000 | 9,600,000 KRW |
| Rancher Desktop | 9h × 50 × 60,000 | 27,000,000 KRW |
| Podman Desktop | 9h × 50 × 60,000 | 27,000,000 KRW |

> With Docker Business ($24), a 50-person team comes to 20,160,000 KRW a year. Prices are public list prices as of October 2026; labor hours are assumptions.

### How to read this table

Looking at the numbers alone, you get the paradox that “free tools cost more.” But several important caveats apply.

- **Labor hours are largely one-time.** The initial 3 hours happen only in year one. If you write an internal standard install script and roll it out, that drops to 20 minutes per person. Then a 50-person team’s year-2 cost is not `(0.33h + 6h) × 50 × 60,000 ≈ 19,000,000 KRW`; if you also cut troubleshooting time in half, it comes down to around `3h × 50 × 60,000 = 9,000,000 KRW`.
- **License fees, by contrast, recur every year.** The break-even from year two can be computed directly:
  `break-even annual troubleshooting hours per person = monthly price per seat × 12 ÷ hourly rate`
  With Team, `21,000 × 12 ÷ 60,000 = 4.2 hours`. If open-source troubleshooting after the switch stays under 4.2 hours per person per year, open source is cheaper from year two; above that it stays more expensive. With Business it is `33,600 × 12 ÷ 60,000 ≈ 6.7 hours`.
- **If actual labor hours differ from these assumptions, the conclusion flips.** If the team has container experts, troubleshooting can drop to 1–2 hours; if you use Testcontainers and a complex Compose stack, it can exceed 20 hours.

**The key takeaway: free is not always cheaper.** Don’t copy this table as-is—plug your team’s actual hourly rate and expected labor hours into the formula above and recalculate. The cost-comparison methodology itself is the same approach covered in [GitHub Actions vs GitLab CI Pricing: Hands-on Calculations Across 3 Scenarios](/blog/github-actions-vs-gitlab-ci-요금-비교-3개-시나리오-실전-계산).

---

## Performance and usability: 9-point comparison

### Measurement environment disclaimer

The table below summarizes **commonly reported tendencies and each tool’s architectural characteristics**. Read it as relative trends, not absolute numbers. You must measure the actual values on your own machines and workloads.

- Assumed baseline: macOS Apple Silicon (M-series), 16GB RAM, VM allocated 4 vCPU / 8GB
- Assumed workload: Node.js project (tens of thousands of files in `node_modules`) bind-mounted; image build based on `node:20-alpine`
- Numbers vary widely depending on machine specs, disk health, and whether the image cache is warm

| Item | Docker Desktop | OrbStack | Rancher Desktop | Podman Desktop |
|---|---|---|---|---|
| Cold boot | Average (tens of seconds) | Very fast (a few seconds) | Average to slow | Average |
| Volume I/O (many files) | Improved, but VM-boundary overhead remains | Most favorable (native virtualization optimizations) | Average | Average; mount-option tuning required |
| Image build | buildx built in by default, fast | Fast (buildx compatible) | nerdctl/buildkit based, decent | buildah based; option differences exist |
| Idle memory | Relatively high | Low (dynamic allocation) | Medium | Medium |
| Local K8s | Built-in K8s toggle | Built-in K8s support | **k3s provided by default** | Separate setup (kind, etc.) |
| docker CLI compatibility | Baseline (100%) | Effectively lossless | High (nerdctl in parallel) | Socket emulation required |
| Compose compatibility | Complete | Complete | Alternatives such as `nerdctl compose` | `podman compose` (some syntax differences) |
| rootless | Partial support | VM isolation | Supported | **Daemonless and rootless by default** |
| Korean UI / Korea support | English UI; global support contracts available | English UI; no confirmed Korean distributor | English UI; SUSE-family partners exist | English UI; Red Hat partner channels |


If you want to measure this yourself, run a minimal reproduction script like the following.

```bash
# 1) Runtime start-up time: quit the tool completely, keep only the start command of the tool you are measuring
start=$(date +%s)
docker desktop start          # or: open -a OrbStack / colima start / podman machine start / rdctl start
until docker info >/dev/null 2>&1; do sleep 1; done
echo "ready in $(( $(date +%s) - start ))s"

# 2) Bind-mount file I/O: run under your home directory (colima's default mount scope)
mkdir -p ~/iotest && cd ~/iotest
time docker run --rm -v "$PWD":/w -w /w alpine \
  sh -c 'for i in $(seq 1 5000); do echo x > f_$i; done'
cd ~ && rm -rf ~/iotest

# 3) Build time (no cache, same Dockerfile for each tool)
time docker build --no-cache -t bench:local .
```

How to read it: `time` runs in the host shell, so container start-up is included. Compare **the median of three runs per tool on the same machine** rather than absolute values. If step 1 keeps waiting, use `docker context ls` to confirm the current context points to the tool you just started. `docker desktop start` works only on Docker Desktop versions that include the Docker Desktop CLI. [Docker Desktop CLI](https://docs.docker.com/desktop/features/desktop-cli/) The previous version used `time docker info`, which only measures an already-running daemon’s response, and `time ( ... )` inside the container, which does not work in alpine’s default shell.

For how volume-mount strategy affects performance, we covered the concepts in [Docker Volumes vs Bind Mounts — A Complete Guide to Data Persistence](/engineer/docker-volume-bind-mount-guide).

---

## Migration runbook

### Step 1: Back up the current state

```bash
# 이미지 목록 저장
docker images --format '{{.Repository}}:{{.Tag}}' > images.txt

# 중요한 이미지 아카이브
docker save -o backup-images.tar $(cat images.txt | grep -v '<none>' | tr '\n' ' ')

# 볼륨 백업 (볼륨명 my_data 예시)
docker run --rm -v my_data:/src -v "$PWD":/dst alpine \
  tar czf /dst/my_data.tgz -C /src .
```

Expected result: `backup-images.tar` and `my_data.tgz` files are created. If you get `tar: /src: Cannot open`, the volume name is wrong—check the exact name with `docker volume ls`.

### Step 2: Connect the new runtime

```bash
# --- OrbStack / colima 계열 ---
docker context ls
docker context use orbstack        # 또는 colima
docker version                     # Server 섹션이 표시되면 성공

# --- Rancher Desktop ---
docker context use rancher-desktop
nerdctl ps                         # containerd 백엔드 사용 시

# --- Podman ---
podman machine init --cpus 4 --memory 8192
podman machine start
podman system connection list

# docker CLI를 그대로 쓰고 싶을 때: 소켓 경로를 환경변수로 지정
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
docker ps                          # podman 백엔드로 응답
```

You can put `DOCKER_HOST` in `~/.zshrc` and roll it out to the whole team. However, using a context and an environment variable at the same time will conflict, so **pick only one approach**.

### Step 3: Restore images and volumes

```bash
docker load -i backup-images.tar
docker volume create my_data
docker run --rm -v my_data:/dst -v "$PWD":/src alpine \
  tar xzf /src/my_data.tgz -C /dst
```

### Step 4: Verify Compose

```bash
# Podman
podman compose up -d
# Rancher Desktop (containerd 백엔드)
nerdctl compose up -d
# OrbStack / colima
docker compose up -d
```

---

## Five things that commonly break, and the workarounds

### ① Compose file syntax differences

`podman compose` internally calls an external Compose implementation, and behavioral differences have been reported for `depends_on` `condition`, `extends`, and some `x-` extension fields.

- Symptom: `unsupported key`, or service startup order gets scrambled
- Workaround: use the `docker-compose` binary + `DOCKER_HOST` instead of `podman-compose`, or replace `depends_on` with application-level retry logic

### ② Hardcoded `/var/run/docker.sock` and Testcontainers

This is the most common tripwire. CI scripts, Testcontainers, and some IDE plugins hardcode the socket path.

On macOS, a `/var/run/docker.sock` link made by hand with `ln -sf` breaks on reboot or machine re-creation. The official Podman installer also installs `podman-mac-helper`, which manages this link. If you installed another way (for example Homebrew) and the link is missing, run it once (needs admin rights; the official package path is `/opt/podman/bin`).

```bash
sudo podman-mac-helper install
podman machine stop && podman machine start
ls -l /var/run/docker.sock          # should point to podman.sock
```

For Testcontainers, set the Podman configuration from the official docs as environment variables.

```bash
# macOS
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
# Linux rootless Podman
export DOCKER_HOST="unix://${XDG_RUNTIME_DIR}/podman/podman.sock"
export TESTCONTAINERS_RYUK_DISABLED=true
```

With rootless Podman the official docs say to disable Ryuk (the cleanup container). Finished test containers are then not removed automatically, so add a cleanup step in CI (for example, removing containers labeled `org.testcontainers=true`). The old `ryuk.container.privileged=true` is no longer needed from Testcontainers for Java 1.19.0. [Testcontainers: supported runtimes](https://java.testcontainers.org/supported_docker_environment/)

### ③ File permissions and UID mapping

In a rootless environment, UIDs inside the container are not mapped 1:1 to host UIDs.

- Symptom: `Permission denied` on a bind-mounted directory
- Workaround: use the `--userns=keep-id` option, or align `USER` in the Dockerfile with the host UID

```bash
podman run --rm --userns=keep-id -v "$PWD":/w:Z -w /w alpine touch test.txt
```

On environments with SELinux enabled (mostly Linux), the `:Z` label is required. On macOS it is ignored.

### ④ DNS and port-forwarding differences

Name resolution between containers and the behavior of `host.docker.internal` differ by tool.

- Podman: uses `host.containers.internal`; you can add an alias with `--add-host=host.docker.internal:host-gateway`
- Rancher Desktop: some settings do not auto-expose ports, so check the network settings in the GUI

```bash
podman run --rm --add-host=host.docker.internal:host-gateway alpine \
  ping -c1 host.docker.internal
```

### ⑤ Missing buildx builder

Teams that were using multi-arch builds (`--platform linux/amd64,linux/arm64`) need an alternative path.

```bash
# Podman: 매니페스트 방식
podman build --platform linux/amd64 -t app:amd64 .
podman build --platform linux/arm64 -t app:arm64 .
podman manifest create app:multi
podman manifest add app:multi app:amd64
podman manifest add app:multi app:arm64
podman manifest push app:multi docker://registry.example.com/app:multi

# Rancher Desktop: buildkit 직접 사용
nerdctl build --platform=amd64,arm64 -t app:multi .
```

The safest alternative is **not doing multi-arch builds locally at all—move them to CI**. That makes it independent of which local runtime you pick, so the migration risk disappears.

---

## Five cases where “just keep Docker Desktop” is the right call

To be honest, if any of the following apply, you’re better off not switching.

1. **Testcontainers-based integration tests are a core pipeline** — when Ryuk, socket-path, and permission issues stack up, debugging cost quickly exceeds the license fee.
2. **You already use enterprise security scanning and policy-management features** — management capabilities like image vulnerability scanning and registry access control have to be reassembled with separate tools on the free alternatives.
3. **Non-engineering roles also use Docker** — if PMs and QA start and stop containers via a GUI, a CLI-heavy alternative leads to a surge in support requests.
4. **A vendor support contract is an audit requirement** — on finance and public-sector projects, if “official vendor support” is on the checklist, switching to open source actually increases audit risk.
5. **A small team inside an organization that needs licenses** — for a 5-person team in a large group, saving 1,260,000 KRW a year (Team) costs 45 hours (2,700,000 KRW at 60,000 KRW/hour). A standalone small company may be free in the first place, so check the license criteria first.

---

## 30-day migration checklist

| Period | Work | Done when |
|---|---|---|
| D+1–3 | Officially confirm whether the paid license applies; survey current usage | Document developer count, OS distribution, and whether Testcontainers is in use |
| D+4–7 | Pick one candidate via the decision tree; designate 2–3 pilot users | Candidate tool confirmed and approved |
| D+8–14 | Pilot: fully bring up one primary project on the new runtime | `compose up` → full test suite passes |
| D+15–18 | Catalog breakage points + document workarounds internally | Record whether each of the five items above has a response |
| D+19–25 | Roll out a standard install script; expand to half the team | Per-person install time under 30 minutes |
| D+26–30 | Full rollout or rollback decision | Full switch only if none of the rollback criteria below are met |

**Rollback criteria (keep Docker Desktop if any one applies):**
- Per-person troubleshooting time exceeds 8 hours during the pilot
- CI/CD pipeline fails due to local-runtime differences
- Primary project’s development cycle (build + test) time increases by 30% or more


---

## FAQ

**Q1. What exactly are the criteria for Docker Desktop’s paid license?**
A. As of October 2026 the agreement makes Docker Desktop free for businesses with **fewer than 250 employees and less than $10 million in annual revenue** and for personal, education, and non-commercial open-source use; other professional use needs a Pro, Team, or Business subscription. [Docker Desktop license agreement](https://docs.docker.com/subscription/desktop-license/) Where interpretation differs, such as counting subsidiaries and affiliates, decide against the agreement text with Legal and Procurement.

**Q2. If we switch to Podman Desktop, do we have to relearn the existing `docker` commands?**
A. For the most part, you keep using them as-is. `podman` has high command compatibility with the docker CLI, and you can keep existing scripts via `alias docker=podman` or the `DOCKER_HOST` environment variable. However, because it is rootless, permissions and networking behave differently—review the “five things that commonly break” section above beforehand.

**Q3. Can OrbStack be used on Windows?**
A. OrbStack is macOS-only. If the team mixes Windows/WSL2 environments, either use different tools per OS or standardize on a cross-platform option like Rancher Desktop or Podman Desktop—that’s less operational overhead.$q$::text))
WHERE id=817 AND md5(content_evidence->'en'->>'content')='62739a0b39bdf5be60302282751d6d88';

-- post 656: 중복 비교표·일반 체크리스트 제거, '연 1회 점검' 모순을 위험도 기반 주기+변경 시 재점검으로 정정
UPDATE posts SET content=$q$**개인정보 위탁과 제3자 제공은 받는 업체가 누구의 업무·목적으로 정보를 처리하는지부터 구분합니다.** 우리 업무를 지시에 따라 대신 처리하면 위탁에 해당할 수 있고, 받는 업체가 자기 목적으로 사용하면 제3자 제공을 검토해야 합니다. 계약서 이름만으로 결정하지 않습니다.

동의 문제는 그다음입니다. **제3자 제공에도 법이 정한 동의 외 근거가 있고, 위탁에도 계약·공개·감독 의무가 있습니다.** 이 글은 개인정보 보호법의 일반적인 구분을 설명하며, 개별 계약의 적법성은 실제 데이터 흐름과 적용 법령에 따라 확인해야 합니다.

## 위탁 vs 제3자 제공 비교표

| 판단 항목 | 개인정보 처리업무 위탁 | 개인정보 제3자 제공 |
|---|---|---|
| 목적·업무 | 위탁자의 업무를 대신 처리 | 받는 자의 목적에 따른 이용 여부 검토 |
| 주요 조문 | 개인정보 보호법 제26조 | 개인정보 보호법 제17조 |
| 동의 | 위탁 자체를 이유로 제3자 제공 동의를 받는 구조와 구별 | 동의를 받거나 법정 비동의 근거의 요건 충족 필요 |
| 운영상 확인 | 위탁 문서, 업무·수탁자 공개, 교육·감독, 재위탁 관리 | 제공 근거, 제공 범위, 수령자의 이용 목적 확인 |
| 예시 | 지시에 따른 배송·고객응대 대행 | 제휴사가 자기 상품 마케팅에 고객정보 사용 |

제17조 제1항은 동의에 따른 제공과 일정한 법적 근거에 따른 제공을 구분하고, 제4항은 당초 수집 목적과 합리적으로 관련된 범위에서의 제공 요건을 둡니다. 따라서 “제3자 제공은 예외 없이 별도 동의”라고 판단하면 부정확합니다. [개인정보 보호법 제17조](https://www.law.go.kr/법령/개인정보보호법/제17조)

## 계약 전에 확인할 5가지 질문

1. **맡기는 업무는 무엇인가?** “고객정보 처리”처럼 넓게 쓰지 말고 주문 배송, 문의 응대 등으로 구체화합니다.
2. **받는 업체가 독자적으로 이용하는가?** 자사 광고, 별도 고객 DB 구축, 범용 모델 학습 등에 쓰는지 약관과 실제 운영을 함께 봅니다.
3. **우리 지시와 관리·감독을 받는가?** 처리 범위, 접근권한, 반환·파기 절차를 확인합니다. 위탁료 유무만으로 분류하지 않습니다.
4. **분류에 맞는 근거와 절차가 있는가?** 제공이면 동의 또는 적용 가능한 법적 근거를, 위탁이면 제26조에 따른 문서·공개·감독을 확인합니다.
5. **국외 이전이 포함되는가?** 해외 저장뿐 아니라 해외에서의 조회·처리위탁 여부도 확인합니다.

## 위탁이면 공개만 하면 끝나나요?

아닙니다. 제26조는 목적 외 처리 금지와 보호조치 등을 포함한 문서, 위탁업무와 수탁자의 공개, 수탁자 교육·감독을 규정합니다. 수탁자가 업무를 다시 위탁하려면 위탁자의 동의가 필요합니다. 홍보·판매 권유 업무의 위탁은 업무 내용과 수탁자를 정보주체에게 알리는 규정도 확인해야 합니다. [개인정보 보호법 제26조](https://www.law.go.kr/법령/개인정보보호법/제26조)

다음은 계약과 운영을 함께 검토하기 위한 실무 점검표입니다. 법정 필수 기재사항을 특정 개수로 단순화한 표가 아닙니다.

| 확인할 자료 | 확인할 내용 |
|---|---|
| 업무 범위·데이터 목록 | 필요한 항목만 전달하는가 |
| 계약·서비스 약관 | 목적 외 이용, 자체 학습·광고 이용이 있는가 |
| 보호조치·권한 내역 | 누가 어떤 데이터에 접근하는가 |
| 재위탁 목록 | 사전 동의와 변경 관리가 가능한가 |
| 종료 절차 | 반환·삭제 범위와 완료 확인 방법이 있는가 |
| 공개 문서·점검 기록 | 실제 수탁자 목록과 운영 상태가 일치하는가 |

교육·점검 주기는 데이터 위험도와 적용 규정에 맞춰 정합니다. 모든 사업자에게 일률적으로 “연 1회면 충분하다”고 판단하지 않습니다.

## 제3자 제공 동의를 받는다면 무엇을 알려야 하나요?

제17조 제2항에 따라 제공받는 자, 이용 목적, 제공 항목, 보유·이용 기간, 동의 거부권과 거부 시 불이익이 있는 경우 그 내용을 알려야 합니다. 법적 근거를 확인하지 않은 채 처리방침에 회사 이름만 적는 것으로 제공 동의를 대체할 수는 없습니다. [제17조 제2항의 안내사항](https://www.law.go.kr/법령/개인정보보호법/제17조)

## 클라우드·SaaS·LLM API는 어떻게 판단하나요?

서비스 종류만으로 일괄 분류하지 않습니다. 우리 목적의 저장·처리를 대행하는 부분과 공급자가 독자적 목적으로 이용하는 부분을 나눠 확인하세요. 특히 학습 이용 조건, 보유기간, 지원 인력의 접근 국가, 재위탁 업체를 계약 자료와 대조합니다.

국외 이전이 있다면 제28조의8에 따른 근거를 별도로 확인합니다. 예를 들어 계약 체결·이행에 필요한 처리위탁·보관은 해당 조문의 공개 또는 알림 요건을 충족하는 방식이 있지만, **모든 해외 서비스가 처리방침 공개만으로 허용되는 것은 아닙니다.** [개인정보 보호법 제28조의8](https://www.law.go.kr/법령/개인정보보호법/제28조의8)

## 실무 사례로 구분하기

- **배송업체가 주문 배송만 수행**: 위탁 여부와 계약·공개·감독 체계를 검토합니다.
- **제휴사가 명단으로 자사 상품 홍보**: 제3자 제공의 근거와 제공 범위를 확인합니다.
- **계열사가 공동 시스템만 운영**: “같은 그룹”이라는 이유로 예외 처리하지 말고 실제 역할을 확인합니다.
- **AI 공급자가 입력을 자체 모델 개선에 사용**: 단순 처리 대행과 다른 이용 목적이 있는지 별도로 검토합니다.

판단 결과에는 “위탁/제공”이라는 결론만 남기지 말고, **업무 목적·전달 항목·이용 주체·적용 근거·종료 시 처리 방법**을 함께 기록하세요.


## 분류가 애매할 때 쓰는 확인 절차

실무에서 분쟁이 생기는 지점은 계약서 제목이 아니라 **데이터가 실제로 누구의 목적을 위해 처리되는가**입니다. 제목이 "업무위탁 계약"이어도 실질이 제3자 제공이면 제3자 제공 규정이 적용될 수 있습니다.

**오분류가 생기는 흔한 원인**
- 수탁사가 받은 개인정보를 자사 서비스 개선·모델 학습 등 **자기 목적**에 함께 사용하는 조항이 있음
- 수탁사가 다른 업체에 다시 맡기는데(재위탁) 위탁자가 이를 모름
- 해외 클라우드·API를 쓰면서 국외 이전 요건 검토가 빠짐

**확인 순서**
1. 처리 목적: 계약서와 서비스 약관에서 "위탁 업무 수행 목적 외 이용 금지"가 명시돼 있는지, 반대로 제공받는 쪽의 이용 권한을 넓게 인정하는 조항은 없는지 봅니다.
2. 문서 필수 항목: 개인정보보호법 제26조와 시행령에 따라 위탁 문서에 들어가야 하는 사항(목적 외 처리 금지, 기술적·관리적 보호조치, 위탁 업무의 목적과 범위, 재위탁 제한, 관리·감독, 손해배상 책임 등)이 빠짐없이 있는지 대조합니다.
3. 재위탁: 수탁사의 하위 처리자 목록을 받고, 재위탁 시 위탁자 동의 절차가 계약에 있는지 확인합니다.
4. 국외 이전: 저장·처리 위치가 국외라면 국외 이전 관련 조항(제28조의8 등) 검토 여부를 기록합니다.
5. 공개: 처리방침에 수탁자와 위탁 업무 내용이 실제로 반영돼 있는지 웹페이지에서 확인합니다.

**LLM API 등 SaaS 점검 포인트**
- 입력 데이터의 학습 활용 여부와 보존 기간을 공급사 문서(데이터 처리 부속서, DPA)에서 확인하고, 학습 제외 설정을 켠 증거(설정 화면, 계약 조항)를 남깁니다.

**재발 방지**
- 신규 SaaS 도입 요청서에 위 5단계를 체크 항목으로 넣고, 수탁자 점검 결과를 데이터 위험도에 맞춰 정한 주기로 기록합니다. 계약 갱신, 재위탁 업체 변경, 학습 이용 조건 변경이 있으면 주기와 관계없이 다시 점검합니다.
- 해석이 갈리는 경우 개인정보보호위원회의 가이드라인·질의응답을 확인하고 법률 검토를 받습니다. 이 글은 법률 자문이 아닙니다.

## 참고 자료

- [개인정보보호위원회](https://www.pipc.go.kr/)
- [개인정보 보호법 안내서](https://www.privacy.go.kr/)

## 검증 환경·편집자 주

- 2026-09 편집. 업종·특례에 따라 해석이 달라질 수 있으니 법무 검토를 병행하세요.

## 자주 묻는 질문 (FAQ)

**Q. 클라우드에 올리면 무조건 제3자 제공인가요?**  
아닙니다. 위탁 형태의 SaaS도 많습니다. **목적·지배력**으로 판단하세요.
$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$중복 비교표·일반 체크리스트 제거, '연 1회 점검' 모순을 위험도 기반 주기+변경 시 재점검으로 정정$q$::text))
WHERE id=656 AND md5(content)='95bf389e4782a51e720062acbe16fab7';
UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$**Start by distinguishing personal information entrustment from third-party provision based on whose business and purpose the receiving company processes the information for.** If they process our work on our instructions, it may be entrustment. If the receiving company uses the information for its own purposes, you should review it as third-party provision. Do not decide based on the contract title alone.

The consent question comes after that. **Third-party provision also has statutory bases other than consent, and entrustment still carries contract, disclosure, and supervision duties.** This article explains the general distinction under the Personal Information Protection Act. Whether a given contract is lawful must be confirmed against the actual data flow and the applicable law.

## Entrustment vs. third-party provision comparison table

| Assessment item | Entrustment of personal information processing | Third-party provision of personal information |
|---|---|---|
| Purpose / work | Processing the entrustor's work on their behalf | Review whether the recipient uses it for its own purposes |
| Key provision | Personal Information Protection Act Article 26 | Personal Information Protection Act Article 17 |
| Consent | Distinct from a structure that collects third-party provision consent merely because of the entrustment itself | Consent is required, or the requirements of a statutory non-consent basis must be met |
| Operational checks | Entrustment documentation, disclosure of work and trustee, training and supervision, sub-entrustment management | Confirm the legal basis for provision, the scope of provision, and the recipient's purpose of use |
| Example | Delivery or customer support performed on instructions | A partner using customer information to market its own products |

Article 17(1) distinguishes provision based on consent from provision based on certain legal grounds, and paragraph (4) sets requirements for provision within a scope reasonably related to the original collection purpose. Therefore, it is inaccurate to conclude that “third-party provision always requires separate consent with no exceptions.” [Personal Information Protection Act Article 17](https://www.law.go.kr/법령/개인정보보호법/제17조)

## Five questions to ask before contracting

1. **What work is being entrusted?** Do not write it broadly as “processing customer information.” Specify order delivery, inquiry handling, and so on.
2. **Does the receiving company use the data independently?** Check both the terms and actual operations for use in its own advertising, building a separate customer DB, or training a general-purpose model.
3. **Is it subject to our instructions and supervision?** Confirm the processing scope, access rights, and return/destruction procedures. Do not classify based solely on whether a fee is paid.
4. **Are there a legal basis and procedures that match the classification?** For provision, confirm consent or an applicable legal basis. For entrustment, confirm documentation, disclosure, and supervision under Article 26.
5. **Does it include a cross-border transfer?** Check not only overseas storage but also overseas access and processing entrustment.

## If it is entrustment, is disclosure enough?

No. Article 26 requires documentation covering prohibition of processing beyond the purpose and protective measures, disclosure of the entrusted work and the trustee, and training and supervision of the trustee. If the trustee sub-entrusts the work, the entrustor's consent is required. For entrustment of promotional or sales solicitation work, also check the rules on notifying data subjects of the work and the trustee. [Personal Information Protection Act Article 26](https://www.law.go.kr/법령/개인정보보호법/제26조)

The following is a practical checklist for reviewing both the contract and operations together. It is not a table that oversimplifies the statutory mandatory items into a fixed count.

| Material to review | What to check |
|---|---|
| Scope of work and data list | Are only necessary items transferred? |
| Contract and service terms | Is there use beyond the purpose, or use for the provider's own training or advertising? |
| Protective measures and access records | Who accesses which data? |
| Sub-entrustment list | Can prior consent and change management be handled? |
| Termination procedures | Are the scope of return/deletion and a method to confirm completion in place? |
| Public documents and inspection records | Do the actual trustee list and operating status match? |

Set training and inspection cycles according to data risk and applicable rules. Do not assume that “once a year is enough” for every business.

## If you obtain consent for third-party provision, what must you tell the data subject?

Under Article 17(2), you must inform them of the recipient, the purpose of use, the items provided, the retention and use period, the right to refuse consent, and any disadvantage from refusal if there is one. Listing only a company name in a privacy policy without confirming a legal basis cannot substitute for provision consent. [Article 17(2) notice items](https://www.law.go.kr/법령/개인정보보호법/제17조)

## How should you assess cloud, SaaS, and LLM APIs?

Do not classify them solely by service type. Separate the parts that store and process data on our behalf from the parts the provider uses for its own purposes. In particular, compare training-use terms, retention periods, the countries from which support staff access data, and sub-entrusted vendors against the contract materials.

If there is a cross-border transfer, separately confirm the basis under Article 28-8. For example, processing entrustment or storage necessary to conclude or perform a contract may be handled by meeting that article’s disclosure or notice requirements, but **not every overseas service is permitted merely by disclosing it in a privacy policy.** [Personal Information Protection Act Article 28-8](https://www.law.go.kr/법령/개인정보보호법/제28조의8)

## Distinguishing with practical cases

- **A delivery company only fulfills order delivery**: Review whether it is entrustment and the contract, disclosure, and supervision framework.
- **A partner uses a customer list to promote its own products**: Confirm the basis for third-party provision and the scope of provision.
- **An affiliate only operates a shared system**: Do not treat it as an exception just because it is “the same group”; confirm the actual role.
- **An AI provider uses inputs to improve its own model**: Separately review whether there is a purpose of use other than simple processing on your behalf.

Do not leave only an “entrustment / provision” conclusion. Record **the purpose of the work, the items transferred, who uses the data, the applicable legal basis, and how data is handled at termination** together.

## A Checklist for Ambiguous Cases

Disputes rarely hinge on the contract title; they hinge on **whose purpose the data is actually processed for**. A contract called "outsourcing agreement" can still be treated as a third-party provision if that is the substance.

**Common causes of misclassification**
- The vendor may also use the personal data for **its own purposes**, such as improving its service or training models
- The vendor subcontracts the work and the controller doesn't know
- Overseas cloud or API use without reviewing cross-border transfer requirements

**Check in this order**
1. Purpose: does the contract/ToS explicitly forbid use beyond the outsourced task, and is there any clause granting the vendor broad usage rights?
2. Required clauses: compare against what Article 26 of the Personal Information Protection Act and its Enforcement Decree require in the outsourcing document (no processing beyond purpose, technical and managerial safeguards, purpose and scope, limits on subcontracting, supervision, liability for damages, etc.).
3. Subcontracting: obtain the vendor's list of sub-processors and confirm the contract requires the controller's consent to re-outsource.
4. Cross-border transfer: if storage or processing is overseas, record whether the transfer provisions (e.g., Article 28-8) were reviewed.
5. Disclosure: confirm on the live privacy policy page that the processor and outsourced tasks are actually listed.

**SaaS / LLM API checkpoints**
- Check in the vendor's documentation (data processing addendum, DPA) whether input data is used for training and how long it is retained, and keep evidence that training opt-out is enabled (settings screenshot, contract clause).

**Prevention**
- Add the five steps above to the intake form for new SaaS, and record processor reviews on a cycle set by data risk. Review again regardless of the cycle when the contract is renewed, a sub-processor changes, or training-use terms change.
- Where interpretations differ, check the PIPC's guidelines and Q&A and get legal review. This article is not legal advice.
$q$::text))
WHERE id=656 AND md5(content_evidence->'en'->>'content')='7f23731f700561fad127ecb23204075e';

-- post 816: 프로토콜 판정 루프 오탐 수정, Let's Encrypt OCSP 종료 반영(stapling 제거), ECDSA 키 대응 키 일치 검사, crontab 줄바꿈 오류 수정, SC-081 일정
UPDATE posts SET content=$q$## 갱신은 분명히 됐는데 왜 아직도 만료라고 뜨는가

새벽 2시에 흔히 벌어지는 장면이 있다. `certbot renew` 로그에는 `Congratulations, all renewals succeeded`가 찍혀 있고, `ls -l /etc/letsencrypt/live/example.com/`을 보면 파일 타임스탬프도 방금 전이다. 그런데 브라우저는 여전히 `NET::ERR_CERT_DATE_INVALID`를 띄운다.

여기서 반드시 잡고 가야 할 전제가 하나 있다.

> **디스크의 인증서 파일과, 서버 프로세스가 메모리에 물고 있는 인증서는 완전히 별개의 물건이다.**

nginx나 haproxy는 기동/reload 시점에 인증서 파일을 읽어 메모리에 올린다. 그 이후 파일이 바뀌어도 프로세스는 알지 못한다. 그래서 "파일을 확인했다"는 것은 진단이 아니다. 진단은 **소켓에서 서버가 실제로 무엇을 내려주는지** 확인하는 것이다.

이 글의 범위는 명확하다. **서버가 내려주는 인증서의 만료·체인 구성·프로토콜 협상 실패**만 다룬다. 클라이언트 쪽 신뢰 저장소나 CA 번들 문제(사내 루트 CA 미설치, JDK cacerts, 파이썬 certifi 등)는 원인 계층이 다르므로 해당 지점에서 링크만 건다.

적용 범위는 다음과 같다.

| 항목 | 범위 |
|---|---|
| OS | Linux 일반 (RHEL/Rocky 8~9, Ubuntu 20.04~24.04) |
| 서버 | nginx 1.18+, haproxy 2.4+ |
| 도구 | OpenSSL 1.1.1 / 3.x, curl 7.x+, certbot / acme.sh |
| 제외 | 클라이언트 트러스트스토어, 사내 CA 배포, mTLS 클라이언트 인증서 |

---

## 에러 원문 → 원인 판정표 (여기서 30초 안에 끝난다)

스크롤하지 말고 지금 보고 있는 에러 문자열을 왼쪽 열에서 찾는다.

| 에러 원문 | 유력 원인 | 함께 나타나야 하는 증상(오판 차단) |
|---|---|---|
| `certificate has expired` / `ERR_CERT_DATE_INVALID` / `Verify return code: 10` | **(a)** notAfter 실제 경과 — 갱신 자체가 안 됨 | 파일 fingerprint와 소켓 fingerprint가 **동일**. certbot 로그에 실패 흔적 |
| 위와 같은 에러인데 파일은 최신 | **(b)** reload 누락 | 파일과 소켓 fingerprint가 **다름**. `ps -o lstart` 기동 시각 < 인증서 갱신 시각 |
| `unable to get local issuer certificate` / `Verify return code: 21` (특정 클라이언트만) | **(c)** 중간 CA 체인 누락 | 브라우저는 정상(AIA 보정), curl·Java·모바일만 실패. `Certificate chain`의 depth 1이 없음 |
| `sslv3 alert handshake failure` / `SSL_ERROR_SYSCALL` / nginx error.log의 `no shared cipher` | **(d)** 프로토콜·암호군 불일치 | 인증서 날짜는 정상. 특정 클라이언트·특정 TLS 버전에서만 실패 |
| `certificate is not yet valid` / `notBefore`가 미래 | **(e)** 시계 오차 또는 체인 상단 교체 | `date -u`가 실제 시각과 어긋남, 또는 컨테이너 시계 드리프트 |

각 분기의 확정 근거는 아래 진단 명령 세트에서 한 번에 나온다. 추측으로 `certbot renew`를 다시 돌리는 것은 (b)~(e) 상황에서 아무것도 고치지 못하고 rate limit만 소모한다.

---

## 30초 진단 명령 세트 — 출력의 어느 줄을 보는가

### 1) 소켓에서 실제 체인 확인

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | head -40
```

**정상(체인 완전) 출력 예시:**

```text
Certificate chain
 0 s:CN = example.com
   i:C = US, O = Let's Encrypt, CN = R11
 1 s:C = US, O = Let's Encrypt, CN = R11
   i:C = US, O = Internet Security Research Group, CN = ISRG Root X1
---
Verify return code: 0 (ok)
```

**depth 1 누락 출력 예시:**

```text
Certificate chain
 0 s:CN = example.com
   i:C = US, O = Let's Encrypt, CN = R11
---
Verify return code: 21 (unable to verify the first certificate)
```

읽는 법은 단순하다.

- **depth 0** = 서버 인증서(리프)
- **depth 1** = 중간 CA
- **depth 2** = 루트(보통 생략되며, 생략이 정상)

depth 1이 통째로 비어 있으면 `ssl_certificate`에 `fullchain.pem`이 아니라 `cert.pem`을 넣었을 가능성이 압도적으로 높다. 이게 **(c)** 분기다.

`Verify return code` 두 값의 차이를 혼동하면 30분이 날아간다.

| 코드 | 의미 | 조치 방향 |
|---|---|---|
| `10 (certificate has expired)` | 날짜 문제 — (a) 또는 (b) | 갱신 여부 + reload 여부 확인 |
| `21 (unable to verify the first certificate)` | 체인 문제 — (c) | fullchain 지정 교정 |
| `0 (ok)` | 서버 측 정상 | 이후는 클라이언트 신뢰 저장소 영역 |

### 2) 서버가 내려준 날짜만 딱 뽑기

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -dates -subject -issuer
```

예상 정상 결과:

```text
notBefore=Aug 20 03:11:02 2026 GMT
notAfter=Nov 18 03:11:01 2026 GMT
subject=CN = example.com
issuer=C = US, O = Let's Encrypt, CN = R11
```

**핵심은 이 값이 파일이 아니라 소켓 기준이라는 점이다.** notAfter가 과거면 (a) 또는 (b), notBefore가 미래면 (e)다.

### 3) curl로 교차 확인

```bash
curl -vI https://example.com 2>&1 | grep -Ei 'expire date|start date|SSL certificate|issuer'
```

`SSL certificate problem: unable to get local issuer certificate`가 나오는데 브라우저에서는 멀쩡하다면 거의 확정적으로 (c)다. Chrome·Edge·Safari 등은 AIA(Authority Information Access) 주소에서 누락된 중간 CA를 내려받아 보정하고, Firefox는 미리 내려받아 둔 중간 CA 목록으로 보정한다. [Firefox intermediate preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) curl·Java·구형 모바일 스택은 이런 보정을 하지 않으므로 서버가 체인을 보내야 한다.

### 4) 실제 서빙 중인 인증서 경로 확정

```bash
nginx -T 2>/dev/null | grep -nE 'server_name|ssl_certificate' | head -40
```

`nginx -T`는 include된 모든 설정을 펼쳐서 보여준다. `sites-enabled`에 예전 vhost가 남아 있어 엉뚱한 경로를 물고 있는 경우가 자주 보고된다.

### 5) reload 누락 확정 — 파일 vs 소켓 fingerprint 대조

이 두 줄이 이 글에서 가장 실전적인 기법이다.

```bash
# 파일 쪽 지문
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -noout -fingerprint -sha256

# 소켓 쪽 지문
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -fingerprint -sha256
```

- **두 값이 같다** → 서버는 파일대로 서빙 중. 만료라면 갱신 자체가 실패한 **(a)**
- **두 값이 다르다** → 파일은 새것, 프로세스는 옛것. **(b) reload 누락 확정**. 더 볼 것 없다

보강 근거는 프로세스 기동 시각이다.

```bash
ss -tlnp | grep :443
PID=$(pgrep -f 'nginx: master' | head -1)
ps -o pid,lstart,cmd -p "$PID"
stat -L -c '%n %y' /etc/letsencrypt/live/example.com/fullchain.pem   # -L: 심볼릭 링크가 가리키는 실제 파일 시각
```

`ps -o lstart` 값이 인증서 파일의 mtime보다 **이르면** 그 프로세스가 기동 시점에 새 인증서를 읽지 않은 것이다. 단 `nginx -s reload`·`systemctl reload`는 마스터 PID와 기동 시각을 바꾸지 않고 설정·인증서만 다시 읽으므로, 이 비교는 보조 근거로만 쓰고 결론은 위의 지문 대조로 낸다. nginx는 인증서를 읽은 뒤 파일을 열어 두지 않으므로 `lsof`로는 확인할 수 없다(예전 판의 `lsof` 단계는 삭제했다).

### 6) no shared cipher 계열 — (d) 확정

nginx `error.log`에 다음 줄이 있으면 날짜·체인은 잊어도 된다.

```text
SSL_do_handshake() failed (SSL: error:1408A0C1:SSL routines:ssl3_get_client_hello:no shared cipher)   # OpenSSL 1.0.x
SSL_do_handshake() failed (SSL: error:0A0000C1:SSL routines::no shared cipher)                         # OpenSSL 3.x
```

서버의 OpenSSL 버전에 따라 오류 코드 표기가 다르므로 `no shared cipher` 문자열로 찾는다.

지원 프로토콜을 직접 훑어 어디서 끊기는지 본다.

```bash
for p in tls1_2 tls1_3; do
  printf '%-8s ' "$p"
  openssl s_client -brief -connect example.com:443 -servername example.com -$p </dev/null 2>&1 \
    | grep -q 'CONNECTION ESTABLISHED' && echo OK || echo FAIL
done
# TLS 1.0/1.1 지원 여부까지 보려면(OpenSSL 3.x 클라이언트는 보안 수준을 0으로 낮춰야 시도 자체를 함)
for p in tls1 tls1_1; do
  printf '%-8s ' "$p"
  openssl s_client -brief -connect example.com:443 -servername example.com -$p \
    -cipher 'DEFAULT:@SECLEVEL=0' </dev/null 2>&1 \
    | grep -q 'CONNECTION ESTABLISHED' && echo OK || echo FAIL
done
```

예전 판의 반복문은 실패해도 출력되는 `Cipher is (NONE)` 줄까지 성공으로 세어 항상 OK가 나왔다. `-brief`의 `CONNECTION ESTABLISHED`로 판정해야 한다. 또 OpenSSL 3.x 클라이언트는 기본 보안 수준(1)에서 TLS 1.2 미만을 아예 쓰지 않으므로, `-tls1`이 FAIL이어도 서버 탓이 아닐 수 있다. [OpenSSL 보안 수준](https://docs.openssl.org/3.0/man3/SSL_CTX_set_security_level/)

TLS 1.2/1.3만 OK이고 1.0/1.1이 FAIL이면 그건 **정상적인 보안 설정**이다. 이때 실패하는 클라이언트는 구형 스택이므로 서버를 낮추기보다 클라이언트를 올리는 게 맞다. 반대로 TLS 1.2도 FAIL이면 `ssl_ciphers` 설정과 키 타입(RSA/ECDSA) 불일치를 의심한다. ECDSA 전용 cipher suite만 남겨둔 상태에서 RSA 키 인증서를 물리면 `no shared cipher`가 그대로 터진다.

권장 기준선:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
```

### 7) 시계 오차 — (e)

```bash
date -u
timedatectl status | grep -E 'System clock|NTP'
```

`System clock synchronized: no`면 컨테이너/VM 시계 드리프트를 먼저 잡는다. 시계가 미래로 어긋난 서버는 정상 인증서도 `certificate has expired`로 판정하고, 과거로 어긋나면 `certificate is not yet valid`를 낸다.

---

## SNI 다중 도메인: '특정 도메인만' 실패할 때

한 IP에 여러 vhost가 붙어 있으면 `-servername` 유무에 따라 결과가 갈린다.

**servername 붙였을 때:**

```bash
openssl s_client -connect 203.0.113.10:443 -servername shop.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject
# subject=CN = shop.example.com
```

**뺐을 때:**

```bash
openssl s_client -connect 203.0.113.10:443 </dev/null 2>/dev/null \
  | openssl x509 -noout -subject
# subject=CN = www.example.com     ← default_server의 인증서
```

이 차이가 의미하는 것을 표로 정리한다.

| 관찰 | 해석 | 조치 |
|---|---|---|
| servername 있을 때만 정상 | 정상 동작. SNI 미지원 클라이언트만 실패 | 구형 Android 4.x·Java 6 등 → 클라이언트 업그레이드 또는 전용 IP 분리 |
| servername 넣어도 다른 CN이 나옴 | `server_name` 오타 또는 vhost 미매칭 → default_server로 흘러감 | `nginx -T`로 server_name 확인, 와일드카드 포함 여부 점검 |
| CN은 맞는데 브라우저가 이름 불일치 | SAN에 해당 호스트 없음 | 아래 SAN 확인 후 재발급 |
| L4/CDN 뒤에서만 실패 | 앞단이 SNI를 원본에 전달하지 않음 | 프록시의 SNI 전달(`proxy_ssl_server_name on` 등) 설정 |

SAN 확인:

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -ext subjectAltName
```

```text
X509v3 Subject Alternative Name:
    DNS:example.com, DNS:www.example.com
```

`shop.example.com`으로 접속하는데 위 목록에 없으면 그 도메인은 처음부터 이 인증서의 대상이 아니다.

여기까지 왔는데 `Verify return code: 0 (ok)`이고 SAN도 맞는다면 서버 측 문제는 끝난 것이다. 그런데도 특정 클라이언트만 실패한다면 원인은 클라이언트 신뢰 저장소로 넘어간다. Java·Go 계열은 [x509 certificate signed by unknown authority 계열 문제](/blog/pkix-path-building-failed-suncertpathbuilderexception-30분-해결-런북), Python 클라이언트는 [SSLCertVerificationError CERTIFICATE_VERIFY_FAILED 원인 5종 판별법](/blog/sslcertverificationerror-해결-certificateverifyfailed-원인-5종-판별법)을 참고하면 된다.

---

## 복구 런북

### cert.pem vs fullchain.pem — (c) 원인의 대부분

**잘못된 설정:**

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/cert.pem;      # ← 서버 인증서만
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
}
```

**교정본:**

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem; # ← 서버+중간 CA
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
}
```

`cert.pem`은 리프 하나뿐이고 `fullchain.pem`은 리프 + 중간 CA다. 한 줄 차이로 depth 1이 사라진다.

**OCSP stapling은 CA에 따라 다르다.** Let's Encrypt는 2025-05-07부터 인증서에 OCSP URL을 넣지 않고 2025-08-06에 OCSP 응답 서버를 껐다. 이후 발급된 Let's Encrypt 인증서에 `ssl_stapling on;`을 두면 nginx가 OCSP 주소가 없다는 경고를 남기고 stapling을 하지 않는다. 예전 판의 교정본에 있던 `ssl_stapling on; ssl_stapling_verify on;`은 그래서 뺐다. OCSP를 계속 제공하는 CA의 인증서를 쓸 때만 켜고, 이때는 `ssl_trusted_certificate`와 `resolver`도 함께 설정한다. [Let's Encrypt OCSP 종료](https://letsencrypt.org/2024/12/05/ending-ocsp/) · [nginx ssl_stapling](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_stapling)

### 키-인증서 매칭과 체인 검증

```bash
# 키와 인증서가 같은 쌍인지: 공개키 해시 비교 (RSA·ECDSA 공통, 두 해시가 같아야 정상)
openssl x509 -in /etc/letsencrypt/live/example.com/cert.pem -noout -pubkey | openssl sha256
sudo openssl pkey -in /etc/letsencrypt/live/example.com/privkey.pem -pubout | openssl sha256

# 체인 검증
openssl verify -untrusted /etc/letsencrypt/live/example.com/chain.pem \
  /etc/letsencrypt/live/example.com/cert.pem
# 기대 출력: cert.pem: OK
```

예전 판은 `openssl rsa -modulus`를 썼는데, certbot 2.0부터 새 인증서의 기본 키가 ECDSA(P-256)라 그 명령은 `openssl rsa`에서 오류가 난다. 위의 `-pubkey`/`pkey -pubout` 비교는 키 종류와 상관없이 동작한다. [certbot 변경 이력](https://github.com/certbot/certbot/blob/master/certbot/CHANGELOG.md)

### 반영 순서

```bash
sudo nginx -t                      # syntax is ok / test is successful 확인 필수
sudo systemctl reload nginx
# 반영 확인 — 소켓 지문 재확인
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -dates -fingerprint -sha256
```

`nginx -t`가 실패한 상태에서 reload하면 기존 설정이 유지되어 "고쳤는데 그대로"인 상황이 재현된다. haproxy는 reload 시 소켓 인계 방식에 따라 순간적으로 기존 연결이 유지되므로, 갱신 반영 여부는 반드시 새 연결로 확인한다.

### reload를 갱신에 묶기 (정석)

```bash
# 1회 실행에 훅 지정 (이번 renew 실행에만 적용된다고 보고, 상시 적용은 아래 훅 파일로)
sudo certbot renew --deploy-hook "systemctl reload nginx"

# 훅 파일로 고정: certbot이 갱신에 성공할 때마다 실행
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null <<'EOF'
#!/bin/sh
/usr/bin/nginx -t && /bin/systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

훅 파일은 인증서가 실제로 갱신됐을 때만 실행된다. 적용 후 `sudo certbot renew --dry-run`으로 훅까지 실행되는지 확인하고, 끝나면 소켓 지문을 다시 본다. [certbot 사용 문서: 갱신 훅](https://eff-certbot.readthedocs.io/en/stable/using.html)

acme.sh는 `--reloadcmd`로 같은 역할을 한다.

```bash
acme.sh --install-cert -d example.com \
  --key-file /etc/nginx/ssl/example.com.key \
  --fullchain-file /etc/nginx/ssl/example.com.crt \
  --reloadcmd "nginx -t && systemctl reload nginx"
```

공인 TLS 인증서의 최대 유효기간은 CA/Browser Forum 투표 SC-081에 따라 발급일 기준 2026-03-15부터 200일, 2027-03-15부터 100일, 2029-03-15부터 47일로 줄어든다. [CA/B Forum Ballot SC-081v3](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/) 갱신이 잦아질수록 **reload 누락 장애가 일어날 기회도 늘어난다**. 갱신 성공과 서비스 반영은 별개 이벤트이기 때문이다. 쓰는 CA의 실제 발급 기간은 그 CA의 공지로 확인한다.

### 롤백

```bash
ls -l /etc/letsencrypt/archive/example.com/
# 롤백 전 증적 보존 (필수)
sudo cp -a /etc/letsencrypt/live/example.com /root/incident-$(date +%Y%m%d%H%M)/
sudo journalctl -u nginx --since "1 hour ago" > /root/incident-nginx.log

# 이전 버전으로 심볼릭 링크 되돌리기 (예: 12 → 11): 네 파일을 같은 번호로 함께 바꾼다
N=11
cd /etc/letsencrypt/live/example.com
for f in cert chain fullchain privkey; do
  sudo ln -sfn "../../archive/example.com/${f}${N}.pem" "${f}.pem"
done
sudo openssl x509 -in fullchain.pem -noout -enddate      # 아직 유효한지 먼저 확인
sudo nginx -t && sudo systemctl reload nginx
```

롤백은 이전 인증서가 아직 유효기간 내일 때만 의미가 있다. 만료된 것으로 되돌리면 상황이 더 나빠진다. 일부 파일만 되돌리면 키와 인증서가 짝이 맞지 않아 nginx가 기동하지 않는다. 다음 `certbot renew`는 새 번호로 링크를 다시 만들므로, 롤백은 원인을 고칠 때까지의 임시 조치다.

---

## 재발 방지 — 파일이 아니라 소켓을 감시한다

파일 mtime을 감시하는 스크립트는 (b) reload 누락을 절대 잡지 못한다. 감시 대상은 반드시 **소켓**이어야 한다.

```bash
#!/usr/bin/env bash
# /usr/local/bin/tls-expiry-check.sh
set -uo pipefail

DOMAINS=(
  "example.com:443"
  "shop.example.com:443"
  "api.example.com:443"
)
THRESHOLD_DAYS="${THRESHOLD_DAYS:-30}"
NOW_EPOCH=$(date +%s)
EXIT_CODE=0

for entry in "${DOMAINS[@]}"; do
  host="${entry%%:*}"
  port="${entry##*:}"

  end_date=$(echo | timeout 10 openssl s_client \
      -connect "${host}:${port}" -servername "${host}" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

  if [ -z "${end_date}" ]; then
    echo "CRITICAL ${host} - 인증서 조회 실패 (접속/핸드셰이크 오류)"
    EXIT_CODE=2
    continue
  fi

  end_epoch=$(date -d "${end_date}" +%s 2>/dev/null) || {
    echo "CRITICAL ${host} - 날짜 파싱 실패: ${end_date}"; EXIT_CODE=2; continue; }

  days_left=$(( (end_epoch - NOW_EPOCH) / 86400 ))

  if   [ "${days_left}" -lt 0 ]; then
    echo "CRITICAL ${host} - 이미 만료됨 (${end_date})"; EXIT_CODE=2
  elif [ "${days_left}" -lt "${THRESHOLD_DAYS}" ]; then
    echo "WARNING  ${host} - ${days_left}일 남음 (${end_date})"
    [ "${EXIT_CODE}" -lt 1 ] && EXIT_CODE=1
  else
    echo "OK       ${host} - ${days_left}일 남음"
  fi
done

exit "${EXIT_CODE}"
```

```bash
sudo chmod +x /usr/local/bin/tls-expiry-check.sh
/usr/local/bin/tls-expiry-check.sh
```

예상 정상 출력:

```text
OK       example.com - 74일 남음
OK       shop.example.com - 74일 남음
WARNING  api.example.com - 12일 남음 (Sep 13 08:22:10 2026 GMT)
```

종료 코드는 0(정상) / 1(경고) / 2(치명)로 나뉘므로 Nagios·Zabbix 계열이나 사내 알림 스크립트에 그대로 물릴 수 있다.

**cron 등록:**

```bash
# crontab -e
# cron은 셸의 줄 이어쓰기(\)를 지원하지 않는다: 명령은 반드시 한 줄로 쓴다.
# cron 환경에는 로그인 셸의 변수가 없으므로 웹훅 주소를 crontab에 직접 정의한다.
WEBHOOK_URL=https://hooks.example.com/REPLACE_ME
0 9 * * * /usr/local/bin/tls-expiry-check.sh >> /var/log/tls-expiry.log 2>&1 || curl -s -X POST -H 'Content-Type: application/json' -d "{\"text\":\"[TLS] 인증서 만료 경고 - $(hostname)\"}" "$WEBHOOK_URL"
```

**systemd service + timer (권장):**

```ini
# /etc/systemd/system/tls-expiry-check.service
[Unit]
Description=TLS certificate expiry check (socket-based)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=THRESHOLD_DAYS=30
ExecStart=/usr/local/bin/tls-expiry-check.sh
StandardOutput=journal
StandardError=journal
```

```ini
# /etc/systemd/system/tls-expiry-check.timer
[Unit]
Description=Run TLS expiry check daily

[Timer]
OnCalendar=*-*-* 09:00:00
RandomizedDelaySec=600
Persistent=true
Unit=tls-expiry-check.service

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tls-expiry-check.timer
systemctl list-timers tls-expiry-check.timer
```

`Persistent=true`는 서버가 꺼져 있어 실행 시각을 놓쳤을 때 부팅 직후 한 번 실행해 준다. 배치 서버처럼 상시 가동이 아닌 장비에서 특히 중요하다.

마지막으로 한 문장만 기억하면 된다. **감시 대상은 파일이 아니라 소켓이다.** 소켓을 보면 갱신 실패도, reload 누락도, 체인 누락도 한 번에 걸린다.

---

## 자주 묻는 질문 (FAQ)

**Q. `certbot renew`가 성공했는데도 브라우저에 만료가 뜹니다. 무엇부터 봐야 하나요?**
A. 파일 fingerprint와 소켓 fingerprint를 대조하세요. `openssl x509 -in fullchain.pem -noout -fingerprint -sha256` 값과 `openssl s_client`로 받은 fingerprint가 다르면 reload 누락이 확정입니다. `nginx -t && systemctl reload nginx`로 즉시 해소되며, 재발 방지는 `--deploy-hook`으로 reload를 갱신에 묶는 것입니다.

**Q. 브라우저에서는 정상인데 curl과 Java 앱만 `unable to get local issuer certificate`가 납니다.**
A. 중간 CA 체인 누락(depth 1 없음)일 가능성이 높습니다. 브라우저는 AIA 내려받기나 미리 내려받은 중간 CA 목록으로 누락분을 보정하지만 다른 스택은 그러지 않습니다. nginx `ssl_certificate`가 `cert.pem`으로 되어 있지 않은지 확인하고 `fullchain.pem`으로 교체한 뒤 reload하세요. 그 후에도 `Verify return code: 0`인데 특정 클라이언트만 실패하면 그때부터는 클라이언트 신뢰 저장소 문제입니다.

**Q. nginx error.log에 `no shared cipher`가 계속 찍힙니다.**
A. 인증서 날짜 문제가 아니라 협상 실패입니다. 서버가 TLS 1.0/1.1을 껐는데 구형 클라이언트가 붙는 경우, 또는 `ssl_ciphers`에 ECDSA 전용 스위트만 남겨둔 채 RSA 키 인증서를 서빙하는 경우가 대표적입니다. `-tls1_2`, `-tls1_3` 옵션으로 어느 버전에서 끊기는지 먼저 확정한 뒤 cipher 목록과 키 타입 조합을 맞추세요.$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$프로토콜 판정 루프 오탐 수정, Let's Encrypt OCSP 종료 반영(stapling 제거), ECDSA 키 대응 키 일치 검사, crontab 줄바꿈 오류 수정, SC-081 일정$q$::text))
WHERE id=816 AND md5(content)='c7acd3d487ce1e19f3dd220387256084';
UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$## The cert was renewed — so why is it still showing as expired?

There's a scene that plays out all too often at 2 a.m. The `certbot renew` log says `Congratulations, all renewals succeeded`, and `ls -l /etc/letsencrypt/live/example.com/` shows file timestamps from moments ago. Yet the browser still throws `NET::ERR_CERT_DATE_INVALID`.

There's one premise you have to lock in before going any further.

> **The certificate file on disk and the certificate the server process is holding in memory are completely different objects.**

nginx and haproxy read the certificate file into memory at start/reload time. After that, the process has no idea if the file changes. So "I checked the file" is not a diagnosis. Diagnosis means checking **what the server actually serves on the socket**.

The scope of this post is explicit. It covers only **expiry of the certificate the server presents, chain construction, and protocol negotiation failures**. Client-side trust store or CA bundle problems (missing internal root CA, JDK cacerts, Python certifi, etc.) live in a different cause layer, so this post only links out at those points.

Scope of applicability:

| Item | Scope |
|---|---|
| OS | Linux in general (RHEL/Rocky 8–9, Ubuntu 20.04–24.04) |
| Server | nginx 1.18+, haproxy 2.4+ |
| Tools | OpenSSL 1.1.1 / 3.x, curl 7.x+, certbot / acme.sh |
| Out of scope | Client trust stores, internal CA distribution, mTLS client certificates |

---

## Error text → cause decision table (finish this in 30 seconds)

Don't scroll. Find the error string you're looking at in the left column.

| Error text | Likely cause | Corroborating symptoms (to block misdiagnosis) |
|---|---|---|
| `certificate has expired` / `ERR_CERT_DATE_INVALID` / `Verify return code: 10` | **(a)** notAfter has actually passed — renewal itself never happened | File fingerprint and socket fingerprint are **the same**. Failure traces in the certbot log |
| Same error, but the file is current | **(b)** missed reload | File and socket fingerprints **differ**. `ps -o lstart` start time < certificate renewal time |
| `unable to get local issuer certificate` / `Verify return code: 21` (certain clients only) | **(c)** missing intermediate CA chain | Browser is fine (AIA fetch fills the gap); curl, Java, mobile fail. No depth 1 in `Certificate chain` |
| `sslv3 alert handshake failure` / `SSL_ERROR_SYSCALL` / `no shared cipher` in nginx error.log | **(d)** protocol / cipher suite mismatch | Certificate dates are fine. Fails only for specific clients / specific TLS versions |
| `certificate is not yet valid` / `notBefore` is in the future | **(e)** clock skew or replacement higher in the chain | `date -u` disagrees with real time, or container clock drift |

The confirming evidence for each branch comes out of the diagnostic command set below in one pass. Blindly re-running `certbot renew` on a guess does nothing for (b)–(e) and only burns your rate limit.

---

## 30-second diagnostic command set — which line of the output to look at

### 1) Confirm the actual chain from the socket

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | head -40
```

**Healthy (complete chain) output example:**

```text
Certificate chain
 0 s:CN = example.com
   i:C = US, O = Let's Encrypt, CN = R11
 1 s:C = US, O = Let's Encrypt, CN = R11
   i:C = US, O = Internet Security Research Group, CN = ISRG Root X1
---
Verify return code: 0 (ok)
```

**Missing depth 1 output example:**

```text
Certificate chain
 0 s:CN = example.com
   i:C = US, O = Let's Encrypt, CN = R11
---
Verify return code: 21 (unable to verify the first certificate)
```

How to read it is simple.

- **depth 0** = server certificate (leaf)
- **depth 1** = intermediate CA
- **depth 2** = root (usually omitted; omission is normal)

If depth 1 is missing entirely, the overwhelming likelihood is that `ssl_certificate` points at `cert.pem` instead of `fullchain.pem`. That's branch **(c)**.

Confusing the two `Verify return code` values will cost you 30 minutes.

| Code | Meaning | Action |
|---|---|---|
| `10 (certificate has expired)` | Date problem — (a) or (b) | Check whether renewal happened + whether reload happened |
| `21 (unable to verify the first certificate)` | Chain problem — (c) | Fix the fullchain path |
| `0 (ok)` | Server side is healthy | Anything after this is the client trust-store layer |

### 2) Extract only the dates the server presented

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -dates -subject -issuer
```

Expected healthy result:

```text
notBefore=Aug 20 03:11:02 2026 GMT
notAfter=Nov 18 03:11:01 2026 GMT
subject=CN = example.com
issuer=C = US, O = Let's Encrypt, CN = R11
```

**The key point is that these values are from the socket, not the file.** If notAfter is in the past, that's (a) or (b). If notBefore is in the future, that's (e).

### 3) Cross-check with curl

```bash
curl -vI https://example.com 2>&1 | grep -Ei 'expire date|start date|SSL certificate|issuer'
```

If you get `SSL certificate problem: unable to get local issuer certificate` but the browser is fine, that is almost certainly (c). Chrome, Edge, Safari and others download the missing intermediate from the AIA (Authority Information Access) URL, and Firefox fills it in from a preloaded intermediate list. [Firefox intermediate preloading](https://wiki.mozilla.org/Security/CryptoEngineering/Intermediate_Preloading) curl, Java, and older mobile stacks do neither, so the server must send the chain.

### 4) Pin down the certificate path actually being served

```bash
nginx -T 2>/dev/null | grep -nE 'server_name|ssl_certificate' | head -40
```

`nginx -T` dumps every included config fully expanded. A leftover vhost in `sites-enabled` still pointing at the wrong path is a frequently reported case.

### 5) Confirm a missed reload — file vs. socket fingerprint

These two lines are the most operationally useful technique in this post.

```bash
# 파일 쪽 지문
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -noout -fingerprint -sha256

# 소켓 쪽 지문
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -fingerprint -sha256
```

- **The two values match** → the server is serving what's on disk. If it's expired, renewal itself failed **(a)**
- **The two values differ** → the file is new, the process is old. **(b) missed reload, confirmed**. Nothing more to look at

Supporting evidence is the process start time.

```bash
ss -tlnp | grep :443
PID=$(pgrep -f 'nginx: master' | head -1)
ps -o pid,lstart,cmd -p "$PID"
stat -L -c '%n %y' /etc/letsencrypt/live/example.com/fullchain.pem   # -L: time of the file the symlink points to
```

If the `ps -o lstart` value is **earlier** than the certificate file's mtime, the process did not read the new certificate at start-up. But `nginx -s reload` and `systemctl reload` re-read config and certificates without changing the master PID or start time, so use this only as supporting evidence and decide with the fingerprint comparison above. nginx does not keep certificate files open after reading them, so `lsof` cannot show this (the `lsof` step from the previous version was removed).

### 6) no shared cipher family — confirming (d)

If nginx `error.log` has the following line, you can forget about dates and chains.

```text
SSL_do_handshake() failed (SSL: error:1408A0C1:SSL routines:ssl3_get_client_hello:no shared cipher)   # OpenSSL 1.0.x
SSL_do_handshake() failed (SSL: error:0A0000C1:SSL routines::no shared cipher)                         # OpenSSL 3.x
```

The error code format depends on the server's OpenSSL version, so search for the string `no shared cipher`.

Walk the supported protocols yourself and see where it breaks.

```bash
for p in tls1_2 tls1_3; do
  printf '%-8s ' "$p"
  openssl s_client -brief -connect example.com:443 -servername example.com -$p </dev/null 2>&1 \
    | grep -q 'CONNECTION ESTABLISHED' && echo OK || echo FAIL
done
# To test TLS 1.0/1.1 as well (an OpenSSL 3.x client only tries them at security level 0)
for p in tls1 tls1_1; do
  printf '%-8s ' "$p"
  openssl s_client -brief -connect example.com:443 -servername example.com -$p \
    -cipher 'DEFAULT:@SECLEVEL=0' </dev/null 2>&1 \
    | grep -q 'CONNECTION ESTABLISHED' && echo OK || echo FAIL
done
```

The previous loop also counted the `Cipher is (NONE)` line printed on failure, so it always reported OK. Decide on `CONNECTION ESTABLISHED` from `-brief` instead. Also, an OpenSSL 3.x client does not use anything below TLS 1.2 at the default security level (1), so a `-tls1` FAIL may not be the server's doing. [OpenSSL security levels](https://docs.openssl.org/3.0/man3/SSL_CTX_set_security_level/)

If only TLS 1.2/1.3 are OK and 1.0/1.1 FAIL, that is a **correct security configuration**. The failing clients are old stacks, so raise the client rather than lower the server. Conversely, if TLS 1.2 also FAILs, suspect a mismatch between the `ssl_ciphers` setting and the key type (RSA/ECDSA). Serving an RSA-key certificate while leaving only ECDSA-only cipher suites will blow up with `no shared cipher` as-is.

Recommended baseline:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
```

### 7) Clock skew — (e)

```bash
date -u
timedatectl status | grep -E 'System clock|NTP'
```

If `System clock synchronized: no`, fix container/VM clock drift first. A server whose clock is skewed into the future will judge a valid certificate as `certificate has expired`; skewed into the past, it will emit `certificate is not yet valid`.

---

## SNI multi-domain: when only a specific domain fails

When multiple vhosts share one IP, results diverge depending on whether `-servername` is present.

**With servername:**

```bash
openssl s_client -connect 203.0.113.10:443 -servername shop.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject
# subject=CN = shop.example.com
```

**Without it:**

```bash
openssl s_client -connect 203.0.113.10:443 </dev/null 2>/dev/null \
  | openssl x509 -noout -subject
# subject=CN = www.example.com     ← default_server의 인증서
```

What that difference means, in a table.

| Observation | Interpretation | Action |
|---|---|---|
| Healthy only with servername | Normal behavior. Only non-SNI clients fail | Old Android 4.x, Java 6, etc. → upgrade the client or split onto a dedicated IP |
| A different CN even with servername | Typo in `server_name` or vhost mismatch → falls through to default_server | Check server_name with `nginx -T`, including whether a wildcard is present |
| CN is correct but the browser reports a name mismatch | Host is not in the SAN | Check SAN below, then reissue |
| Fails only behind L4/CDN | Front end is not forwarding SNI to origin | Configure SNI passthrough on the proxy (`proxy_ssl_server_name on`, etc.) |

SAN check:

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -ext subjectAltName
```

```text
X509v3 Subject Alternative Name:
    DNS:example.com, DNS:www.example.com
```

If you connect as `shop.example.com` and it is not in that list, that domain was never a subject of this certificate to begin with.

If you've gotten this far, `Verify return code: 0 (ok)`, and the SAN is correct, the server-side problem is done. If a specific client still fails, the cause moves to the client trust store. For Java/Go stacks see [x509 certificate signed by unknown authority class of problems](/blog/pkix-path-building-failed-suncertpathbuilderexception-30분-해결-런북); for Python clients see [Five-way diagnosis of SSLCertVerificationError CERTIFICATE_VERIFY_FAILED](/blog/sslcertverificationerror-해결-certificateverifyfailed-원인-5종-판별법).

---

## Recovery runbook

### cert.pem vs fullchain.pem — most of cause (c)

**Wrong config:**

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/cert.pem;      # ← 서버 인증서만
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
}
```

**Corrected:**

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem; # ← 서버+중간 CA
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
}
```

`cert.pem` is the leaf only; `fullchain.pem` is leaf + intermediate CA. One line of difference and depth 1 disappears.

**OCSP stapling depends on the CA.** Let's Encrypt stopped including OCSP URLs in certificates on 2025-05-07 and turned off its OCSP responders on 2025-08-06. With a Let's Encrypt certificate issued since then, `ssl_stapling on;` makes nginx log a warning that there is no OCSP responder URL and skip stapling. That is why `ssl_stapling on; ssl_stapling_verify on;` was removed from the corrected config. Enable it only for certificates from a CA that still provides OCSP, together with `ssl_trusted_certificate` and `resolver`. [Let's Encrypt ending OCSP](https://letsencrypt.org/2024/12/05/ending-ocsp/) · [nginx ssl_stapling](https://nginx.org/en/docs/http/ngx_http_ssl_module.html#ssl_stapling)

### Key–certificate match and chain verification

```bash
# Do the key and certificate match? Compare public-key hashes (works for RSA and ECDSA; both must match)
openssl x509 -in /etc/letsencrypt/live/example.com/cert.pem -noout -pubkey | openssl sha256
sudo openssl pkey -in /etc/letsencrypt/live/example.com/privkey.pem -pubout | openssl sha256

# Chain verification
openssl verify -untrusted /etc/letsencrypt/live/example.com/chain.pem \
  /etc/letsencrypt/live/example.com/cert.pem
# Expected output: cert.pem: OK
```

The previous version used `openssl rsa -modulus`, but since certbot 2.0 the default key for new certificates is ECDSA (P-256), and `openssl rsa` fails on it. The `-pubkey` / `pkey -pubout` comparison above works for either key type. [certbot changelog](https://github.com/certbot/certbot/blob/master/certbot/CHANGELOG.md)

### Apply order

```bash
sudo nginx -t                      # syntax is ok / test is successful 확인 필수
sudo systemctl reload nginx
# 반영 확인 — 소켓 지문 재확인
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -dates -fingerprint -sha256
```

If you reload while `nginx -t` is failing, the old config is kept and you reproduce the "I fixed it but nothing changed" situation. haproxy can keep existing connections briefly depending on how sockets are handed over on reload, so always confirm that the renewal took effect on a **new** connection.

### Bind reload to renewal (the proper way)

```bash
# Hook for a single run (treat it as applying to this renew run; use the hook file below for a permanent hook)
sudo certbot renew --deploy-hook "systemctl reload nginx"

# Permanent hook file: certbot runs it after every successful renewal
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null <<'EOF'
#!/bin/sh
/usr/bin/nginx -t && /bin/systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

The hook file runs only when a certificate was actually renewed. After adding it, run `sudo certbot renew --dry-run` to confirm the hook runs, then check the socket fingerprint again. [certbot user guide: renewal hooks](https://eff-certbot.readthedocs.io/en/stable/using.html)

acme.sh does the same job with `--reloadcmd`.

```bash
acme.sh --install-cert -d example.com \
  --key-file /etc/nginx/ssl/example.com.key \
  --fullchain-file /etc/nginx/ssl/example.com.crt \
  --reloadcmd "nginx -t && systemctl reload nginx"
```

Under CA/Browser Forum Ballot SC-081, the maximum validity of public TLS certificates drops, by issuance date, to 200 days from 2026-03-15, 100 days from 2027-03-15, and 47 days from 2029-03-15. [CA/B Forum Ballot SC-081v3](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/) The more often you renew, the **more chances a missed reload has to cause an outage**. Renewal success and service rollout are separate events. Check your CA's notices for the lifetime it actually issues.

### Rollback

```bash
ls -l /etc/letsencrypt/archive/example.com/
# 롤백 전 증적 보존 (필수)
sudo cp -a /etc/letsencrypt/live/example.com /root/incident-$(date +%Y%m%d%H%M)/
sudo journalctl -u nginx --since "1 hour ago" > /root/incident-nginx.log

# Point the symlinks back to the previous version (e.g. 12 → 11): switch all four files to the same number
N=11
cd /etc/letsencrypt/live/example.com
for f in cert chain fullchain privkey; do
  sudo ln -sfn "../../archive/example.com/${f}${N}.pem" "${f}.pem"
done
sudo openssl x509 -in fullchain.pem -noout -enddate      # confirm it is still valid first
sudo nginx -t && sudo systemctl reload nginx
```

Rollback only makes sense if the previous certificate is still within its validity period. Rolling back to an expired one makes the situation worse. Reverting only some files leaves a mismatched key and certificate, and nginx will not start. The next `certbot renew` recreates the links with a new number, so a rollback is a stopgap until the cause is fixed.

---

## Preventing recurrence — monitor the socket, not the file

A script that watches file mtime will never catch (b) missed reload. The thing you monitor must be the **socket**.

```bash
#!/usr/bin/env bash
# /usr/local/bin/tls-expiry-check.sh
set -uo pipefail

DOMAINS=(
  "example.com:443"
  "shop.example.com:443"
  "api.example.com:443"
)
THRESHOLD_DAYS="${THRESHOLD_DAYS:-30}"
NOW_EPOCH=$(date +%s)
EXIT_CODE=0

for entry in "${DOMAINS[@]}"; do
  host="${entry%%:*}"
  port="${entry##*:}"

  end_date=$(echo | timeout 10 openssl s_client \
      -connect "${host}:${port}" -servername "${host}" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

  if [ -z "${end_date}" ]; then
    echo "CRITICAL ${host} - 인증서 조회 실패 (접속/핸드셰이크 오류)"
    EXIT_CODE=2
    continue
  fi

  end_epoch=$(date -d "${end_date}" +%s 2>/dev/null) || {
    echo "CRITICAL ${host} - 날짜 파싱 실패: ${end_date}"; EXIT_CODE=2; continue; }

  days_left=$(( (end_epoch - NOW_EPOCH) / 86400 ))

  if   [ "${days_left}" -lt 0 ]; then
    echo "CRITICAL ${host} - 이미 만료됨 (${end_date})"; EXIT_CODE=2
  elif [ "${days_left}" -lt "${THRESHOLD_DAYS}" ]; then
    echo "WARNING  ${host} - ${days_left}일 남음 (${end_date})"
    [ "${EXIT_CODE}" -lt 1 ] && EXIT_CODE=1
  else
    echo "OK       ${host} - ${days_left}일 남음"
  fi
done

exit "${EXIT_CODE}"
```

```bash
sudo chmod +x /usr/local/bin/tls-expiry-check.sh
/usr/local/bin/tls-expiry-check.sh
```

Expected healthy output:

```text
OK       example.com - 74일 남음
OK       shop.example.com - 74일 남음
WARNING  api.example.com - 12일 남음 (Sep 13 08:22:10 2026 GMT)
```

Exit codes are 0 (OK) / 1 (WARNING) / 2 (CRITICAL), so you can hook this straight into Nagios/Zabbix-class tools or an internal alert script.

**cron registration:**

```bash
# crontab -e
# cron does not support shell line continuation (\): keep each command on one line.
# cron has none of your login shell's variables, so define the webhook URL in the crontab itself.
WEBHOOK_URL=https://hooks.example.com/REPLACE_ME
0 9 * * * /usr/local/bin/tls-expiry-check.sh >> /var/log/tls-expiry.log 2>&1 || curl -s -X POST -H 'Content-Type: application/json' -d "{\"text\":\"[TLS] certificate expiry warning - $(hostname)\"}" "$WEBHOOK_URL"
```

**systemd service + timer (recommended):**

```ini
# /etc/systemd/system/tls-expiry-check.service
[Unit]
Description=TLS certificate expiry check (socket-based)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
Environment=THRESHOLD_DAYS=30
ExecStart=/usr/local/bin/tls-expiry-check.sh
StandardOutput=journal
StandardError=journal
```

```ini
# /etc/systemd/system/tls-expiry-check.timer
[Unit]
Description=Run TLS expiry check daily

[Timer]
OnCalendar=*-*-* 09:00:00
RandomizedDelaySec=600
Persistent=true
Unit=tls-expiry-check.service

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tls-expiry-check.timer
systemctl list-timers tls-expiry-check.timer
```

`Persistent=true` runs the job once right after boot if the server was down and missed the scheduled time. Especially important on machines that are not always-on, like batch servers.

Remember just one sentence. **You monitor the socket, not the file.** Looking at the socket catches renewal failure, missed reload, and a missing chain in one shot.

---

## FAQ

**Q. `certbot renew` succeeded but the browser still shows expired. What do I look at first?**
A. Diff the file fingerprint against the socket fingerprint. If the value from `openssl x509 -in fullchain.pem -noout -fingerprint -sha256` differs from the fingerprint you get via `openssl s_client`, a missed reload is confirmed. `nginx -t && systemctl reload nginx` clears it immediately; to prevent recurrence, bind reload to renewal with `--deploy-hook`.

**Q. The browser is fine, but curl and the Java app get `unable to get local issuer certificate`.**
A. High likelihood of a missing intermediate CA chain (no depth 1). Browsers fill in the missing piece via AIA download or a preloaded intermediate list; other stacks do not. Check that nginx `ssl_certificate` is not pointing at `cert.pem`, switch it to `fullchain.pem`, and reload. If after that `Verify return code: 0` but a specific client still fails, from that point it is a client trust-store problem.

**Q. nginx error.log keeps logging `no shared cipher`.**
A. This is a negotiation failure, not a certificate date problem. Typical cases: the server turned off TLS 1.0/1.1 and an old client is connecting, or you left only ECDSA-only suites in `ssl_ciphers` while serving an RSA-key certificate. First confirm which version it breaks on with the `-tls1_2` and `-tls1_3` options, then align the cipher list with the key type.$q$::text))
WHERE id=816 AND md5(content_evidence->'en'->>'content')='1f5d3dd0cb5a7a7a2a5dfcbd1b0b984e';

-- post 805: Service selector를 -l에 넣는 명령 오류(jsonpath JSON → app:web) 수정, jq로 key=value 변환
UPDATE posts SET content=$q$> **심화 분석**: 이 글은 빈 백엔드의 원인별 분기와 예외를 다룹니다. 처음 확인할 세 명령은 [빠른 진단](/blog/kubectl-get-endpoints-noneservice-connection-refused-5분-진단)에, 실행 순서 중심의 절차는 [엔지니어 런북](/engineer/kubernetes-endpoints-none-fix)에 있습니다.

## DNS는 풀리는데 트래픽은 어디로 사라졌나

1편에서 CoreDNS 이름 해석을 정리했고, 2편에서 NetworkPolicy 차단이 아니라는 것도 확인했습니다. 그런데도 애플리케이션 파드에서 `curl http://my-svc:8080`을 때리면 여전히 `connection refused`가 돌아옵니다. `kubectl describe svc my-svc`를 보니 답이 한 줄에 있습니다.

```text
Endpoints:         <none>
```

이 시리즈가 다루는 계층은 세 겹입니다. **이름 해석(1편) → 정책 차단(2편) → Service와 Pod의 결합(3편)**. 이번 편은 세 번째, 즉 이름은 풀리고 정책도 열려 있는데 "보낼 곳 자체가 존재하지 않는" 상태를 다룹니다.

트래픽 경로를 텍스트로 펼치면 이렇습니다.

```text
Client Pod
  → DNS 조회 (my-svc.default.svc.cluster.local → 10.96.x.x)   [1편 영역]
  → ClusterIP 10.96.x.x:8080
  → kube-proxy가 설치한 DNAT 룰 (iptables / IPVS / nftables)
  → EndpointSlice에 등록된 Pod IP:targetPort 목록
  → Pod IP 10.244.x.x:8080                                   [4편 영역]
```

`Endpoints: <none>`은 위 흐름에서 **네 번째 줄이 빈 배열**이라는 뜻입니다. 컨트롤 플레인의 endpointslice controller는 Service의 `selector`에 매칭되고 Ready 상태인 파드를 찾아 EndpointSlice를 채우는데, 그 결과가 0건이면 kube-proxy는 전달할 대상이 없다는 사실을 데이터플레인에 반영합니다.

애플리케이션 로그에 찍히는 `no endpoints available for service "default/my-svc"`도 사실상 같은 신호입니다. 이 문구는 API 서버의 프록시 경로나 Ingress 컨트롤러가 백엔드 목록을 조회했을 때 비어 있음을 알리는 메시지이고, 원인 계층은 `Endpoints: <none>`과 완전히 동일합니다.

여기서 첫 갈림길이 하나 생깁니다. **`connection refused`냐 `timeout`이냐**입니다.

| 증상 | kube-proxy 동작 | 시사점 |
|---|---|---|
| 즉시 `connection refused` | 백엔드가 0건이라 REJECT 룰이 설치됨(iptables 기본 동작) | Endpoints가 비었을 확률이 높음 |
| 수 초~수십 초 후 `timeout` | DNAT는 됐지만 패킷이 응답 없이 사라짐 | Endpoints는 채워졌고, CNI·정책·앱 미응답 쪽 |

즉 `connection refused`가 즉시 떨어진다면 이 글의 진단표부터 보면 되고, `timeout`이라면 3장 후반과 4장으로 바로 건너뛰는 편이 빠릅니다. 참고로 증상이 겹치는 케이스는 [kubectl get endpoints <none>·Service connection refused 5분 진단](/blog/kubectl-get-endpoints-noneservice-connection-refused-5분-진단)에서 기본 흐름을 다뤘고, 이번 글은 원인 7종 분해와 버전별 함정, 자동화 게이트에 무게를 둡니다.

적용 범위는 Kubernetes 1.21 이상(EndpointSlice 기본 활성화 이후), kubectl 1.25 이상, kube-proxy iptables/IPVS/nftables 모드 전부입니다.

## 30초 1차 진단: 명령 6줄로 범위 좁히기

장애 상황에서는 생각하지 말고 위에서부터 순서대로 치는 편이 빠릅니다. 서비스명과 네임스페이스만 바꿔 그대로 복사하세요.

```bash
SVC=my-svc
NS=default

# 1) 레거시 Endpoints 객체 확인 (가장 빠른 신호)
kubectl -n "$NS" get endpoints "$SVC"

# 2) EndpointSlice 확인 (1.21+ 실제 소스 오브 트루스)
kubectl -n "$NS" get endpointslices -l "kubernetes.io/service-name=$SVC" -o wide

# 3) Service 정의와 이벤트
kubectl -n "$NS" describe svc "$SVC"

# 4) Service selector 원문
kubectl -n "$NS" get svc "$SVC" -o jsonpath='{.spec.selector}{"\n"}'

# 5) 파드 라벨 전량 확인
kubectl -n "$NS" get pods --show-labels

# 6) selector로 실제 매칭되는 파드 수
#    jsonpath '{.spec.selector}'는 {"app":"web"} 같은 JSON을 내므로 -l에 바로 넣을 수 없습니다.
#    jq로 key=value,key=value 형식으로 바꿉니다.
SEL_KV=$(kubectl -n "$NS" get svc "$SVC" -o json | jq -r '.spec.selector // {} | to_entries | map("\(.key)=\(.value)") | join(",")')
[ -n "$SEL_KV" ] && kubectl -n "$NS" get pods -l "$SEL_KV" -o wide
```

예상 정상 결과는 이렇습니다.

```text
NAME     ENDPOINTS                                   AGE
my-svc   10.244.1.7:8080,10.244.2.9:8080             12d
```

`ENDPOINTS` 칸에 `<none>`이 찍혔다면 확정입니다. 2번 명령의 EndpointSlice가 아예 존재하지 않거나 `ENDPOINTS` 컬럼이 비었다면 같은 결론입니다.

### 계층 분리: Pod IP 직접 curl로 문제를 양분한다

여기서 가장 중요한 판단은 "앱이 죽은 건가, Service 결합이 끊긴 건가, 노드 간 통신이 막힌 건가"입니다. netshoot 임시 파드 하나면 30초 안에 갈립니다.

```bash
kubectl -n default run tmp-netshoot --rm -it --restart=Never \
  --image=nicolaka/netshoot -- /bin/bash
```

파드 셸 안에서 세 계층을 순서대로 때립니다.

```bash
# ① Pod IP 직접 (Service를 건너뜀)
curl -sS -m 3 -o /dev/null -w "podip:%{http_code}\n" http://10.244.1.7:8080/

# ② ClusterIP
curl -sS -m 3 -o /dev/null -w "clusterip:%{http_code}\n" http://10.96.30.11:8080/

# ③ NodePort (해당 서비스가 NodePort 타입일 때)
curl -sS -m 3 -o /dev/null -w "nodeport:%{http_code}\n" http://192.168.10.21:30080/
```

결과 조합으로 바로 범위가 잘립니다.

| ① Pod IP | ② ClusterIP | ③ NodePort | 판정 | 다음 행동 |
|---|---|---|---|---|
| 성공 | 실패 | 실패 | Service ↔ Pod 결합 문제 | 3장 판정표 (a)~(g) 순회 |
| 실패 | 실패 | 실패 | 애플리케이션·컨테이너 포트 문제 | 컨테이너 로그와 `ss -lntp`로 리슨 포트 확인 |
| 성공 | 성공 | 실패 | 노드 외부 진입·externalTrafficPolicy 문제 | 4장 `externalTrafficPolicy: Local` 절 |
| 성공 | 간헐 실패 | 간헐 실패 | 일부 백엔드만 비정상 또는 노드 간 통신 문제 | 4장 kube-proxy 룰 확인 후 4편(CNI) |

`ss -lntp` 확인은 대상 컨테이너 안에서 이렇게 합니다.

```bash
kubectl -n default exec -it deploy/web -- sh -c "ss -lntp || netstat -lntp"
```

정상이라면 `LISTEN 0 128 0.0.0.0:8080` 같은 줄이 보여야 합니다. `127.0.0.1:8080`만 보인다면 앱이 루프백에만 바인딩된 것이고, 이 경우 Endpoints가 채워져도 트래픽은 실패합니다.

### 한 화면에 뽑는 통합 진단 스크립트

반복 장애 대응용으로 파일 하나 만들어 두면 편합니다.

```bash
#!/usr/bin/env bash
# svc-diag.sh — Service/Endpoint 결합 상태 일괄 점검
# usage: ./svc-diag.sh <service-name> [namespace]
set -euo pipefail

SVC="${1:?service name required}"
NS="${2:-default}"

line() { printf '\n=== %s ===\n' "$1"; }

line "Service spec"
kubectl -n "$NS" get svc "$SVC" -o yaml | grep -E 'clusterIP:|type:|externalTrafficPolicy:|publishNotReadyAddresses:' || true

line "Selector"
SELECTOR=$(kubectl -n "$NS" get svc "$SVC" -o jsonpath='{.spec.selector}')
echo "raw: ${SELECTOR:-<empty>}"

line "Ports (port -> targetPort)"
kubectl -n "$NS" get svc "$SVC" \
  -o jsonpath='{range .spec.ports[*]}{.name}{" "}{.port}{" -> "}{.targetPort}{"\n"}{end}'

line "Endpoints (legacy)"
kubectl -n "$NS" get endpoints "$SVC" -o wide || echo "no endpoints object"

line "EndpointSlices"
kubectl -n "$NS" get endpointslices -l "kubernetes.io/service-name=$SVC" -o wide || true

line "EndpointSlice ready conditions"
kubectl -n "$NS" get endpointslices -l "kubernetes.io/service-name=$SVC" \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .endpoints[*]}{.addresses[0]}{"=ready:"}{.conditions.ready}{" "}{end}{"\n"}{end}' || true

line "Matching pods"
SEL_KV=$(kubectl -n "$NS" get svc "$SVC" -o json \
  | jq -r '.spec.selector // {} | to_entries | map("\(.key)=\(.value)") | join(",")')
if [ -n "$SEL_KV" ]; then
  kubectl -n "$NS" get pods -l "$SEL_KV" -o wide || true
else
  echo "selector is empty (selector-less Service: manual EndpointSlice required)"
fi

line "All pod labels in namespace"
kubectl -n "$NS" get pods --show-labels

line "Recent events"
kubectl -n "$NS" get events --sort-by=.lastTimestamp | tail -20
```

```bash
chmod +x svc-diag.sh
./svc-diag.sh my-svc default
```

`Matching pods` 섹션이 `No resources found`로 나오면 원인은 거의 확정적으로 (a) selector 불일치입니다. 파드는 나오는데 EndpointSlice가 비었다면 (c) Readiness 계열입니다.

## 원인별 판정표: 7가지 케이스와 1줄 복구

먼저 전체 지도를 봅니다.

| # | 증상 | 원인 | 확정 명령 | 복구 1줄 |
|---|---|---|---|---|
| a | Endpoints `<none>`, selector로 조회 시 0건 | selector 라벨 오타·불일치 | `kubectl get pods -l app=web` | `kubectl patch svc my-svc -p '{"spec":{"selector":{"app":"web-api"}}}'` |
| b | Endpoints는 있는데 연결 실패 또는 `<none>` | targetPort ↔ containerPort 불일치, named port 미정의 | `kubectl get svc my-svc -o jsonpath='{.spec.ports[*].targetPort}'` | `kubectl patch svc my-svc --type=json -p '[{"op":"replace","path":"/spec/ports/0/targetPort","value":8080}]'` |
| c | 파드는 Running인데 EndpointSlice ready=false | Readiness probe 실패로 NotReady | `kubectl get pods -o wide`의 READY 컬럼 + `kubectl describe pod` | `kubectl patch deploy web --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/healthz"}]'` |
| d | 다른 네임스페이스에서만 접속 실패 | Service는 네임스페이스를 넘지 않음 | `kubectl get pods -A -l app=web` | `curl http://my-svc.other-ns.svc.cluster.local:8080` 로 FQDN 사용 |
| e | `Endpoints: <none>`이지만 DNS는 파드 IP 다수 응답 | Headless Service(`clusterIP: None`) 오설정 | `kubectl get svc my-svc -o jsonpath='{.spec.clusterIP}'` | Service를 삭제 후 `clusterIP: None` 제거한 매니페스트로 재적용 |
| f | selector가 비어 있고 EndpointSlice도 없음 | selector-less Service에 수동 EndpointSlice 누락 | `kubectl get svc my-svc -o jsonpath='{.spec.selector}'` 결과 공백 | 수동 EndpointSlice YAML 적용(아래 예시) |
| g | 일부 파드만 등록·특정 노드에서만 실패 | hostNetwork 파드의 포트 충돌 | `kubectl get pods -o wide`에서 동일 노드 중복 확인 | `kubectl patch deploy web -p '{"spec":{"template":{"spec":{"affinity":{"podAntiAffinity":{"requiredDuringSchedulingIgnoredDuringExecution":[{"labelSelector":{"matchLabels":{"app":"web"}},"topologyKey":"kubernetes.io/hostname"}]}}}}}}'` |

### (a) selector 라벨 오타·불일치

가장 흔한 케이스입니다. Deployment 템플릿 라벨은 `app: web-api`인데 Service selector는 `app: web`으로 적혀 있는 상황입니다.

```yaml
# 잘못된 버전
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: default
spec:
  selector:
    app: web          # 파드 라벨은 web-api
  ports:
    - port: 8080
      targetPort: 8080
```

```yaml
# 수정 버전
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: default
spec:
  selector:
    app: web-api
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      protocol: TCP
```

확정은 아래 한 줄로 끝납니다.

```bash
kubectl -n default get pods -l app=web
```

`No resources found in default namespace.`가 나오면 selector가 아무것도 잡지 못한다는 뜻입니다. 주의할 점은 Service selector가 **AND 조건**이라는 것입니다. `app: web`과 `tier: backend`를 함께 적으면 두 라벨을 모두 가진 파드만 매칭됩니다. 파드에 `tier` 라벨이 없으면 0건이 됩니다.

### (b) targetPort ↔ containerPort 불일치, named port 미정의

named port를 쓰면 가독성은 좋아지지만, 컨테이너 쪽에 이름이 정의되어 있지 않으면 EndpointSlice의 포트가 비거나 잘못된 값으로 채워집니다.

```yaml
# 잘못된 버전: Service는 http라는 이름을 찾는데 컨테이너에 이름이 없음
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  selector:
    app: web-api
  ports:
    - port: 8080
      targetPort: http
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - containerPort: 8080   # name 지정 누락
```

```yaml
# 수정 버전: 컨테이너 포트에 name: http 정의
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  selector:
    app: web-api
  ports:
    - name: http
      port: 8080
      targetPort: http
      protocol: TCP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
```

확인 명령과 예상 결과입니다.

```bash
kubectl -n default get endpointslices -l kubernetes.io/service-name=my-svc \
  -o jsonpath='{range .items[*]}{range .ports[*]}{.name}{":"}{.port}{"\n"}{end}{end}'
```

정상이면 `http:8080`처럼 실제 숫자가 찍힙니다. 이름만 있고 포트가 비어 있다면 (b)가 확정입니다.

### (c) Readiness probe 실패로 NotReady

파드는 `Running`인데 `READY 0/1`이라면 endpointslice controller가 `conditions.ready: false`로 표시하고, kube-proxy는 해당 주소를 서비스 백엔드에서 제외합니다.

```bash
kubectl -n default get pods -l app=web-api
kubectl -n default describe pod <pod-name> | grep -A5 "Readiness"
```

```text
NAME                   READY   STATUS    RESTARTS   AGE
web-6f9c8d5b4c-2xk7p   0/1     Running   0          3m
```

이때 `Warning  Unhealthy  ... Readiness probe failed: HTTP probe failed with statuscode: 404` 같은 이벤트가 함께 보입니다. probe 경로·포트가 앱과 어긋난 전형적인 케이스입니다. probe 실패 원인 자체를 파고들어야 한다면 [K8s Liveness/Readiness probe failed·connection refused 원인별 해결](/blog/k8s-livenessreadiness-probe-failedconnection-refused-원인별-해결)의 분기표를 함께 보면 좋습니다.

`publishNotReadyAddresses: true`는 NotReady 주소까지 EndpointSlice에 싣는 옵션입니다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db-headless
spec:
  clusterIP: None
  publishNotReadyAddresses: true
  selector:
    app: postgres
  ports:
    - name: pg
      port: 5432
      targetPort: 5432
```

용도는 명확합니다. StatefulSet 기반 클러스터 소프트웨어가 부팅 중 서로를 발견해야 하는 피어 디스커버리 상황입니다. 반대로 일반 웹 트래픽 Service에 이 옵션을 켜면 준비되지 않은 파드로 사용자 요청이 흘러가 5xx가 늘어납니다. **장애를 숨기려고 켜는 순간 회귀 불가능한 부채**가 되므로, 임시 우회로 쓰더라도 티켓을 남기고 원복 기한을 정하세요.

### (d) Pod가 다른 네임스페이스에 있음

Service의 selector는 **같은 네임스페이스 안에서만** 파드를 찾습니다. 네임스페이스를 넘는 selector는 존재하지 않습니다.

```bash
kubectl get pods -A -l app=web-api -o wide
```

파드가 `prod` 네임스페이스에 있고 Service가 `default`에 있다면, Service를 옮기거나 클라이언트가 FQDN으로 접근해야 합니다.

```bash
curl -sS http://my-svc.prod.svc.cluster.local:8080/healthz
```

외부 이름을 별칭으로 두고 싶다면 ExternalName을 씁니다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: default
spec:
  type: ExternalName
  externalName: my-svc.prod.svc.cluster.local
```

ExternalName은 CNAME만 반환하므로 `Endpoints`는 원래 비어 있는 것이 정상입니다. 이 경우의 `<none>`은 장애가 아닙니다.

### (e) Headless Service 오설정

StatefulSet용 매니페스트를 복사해 붙이다 `clusterIP: None`이 딸려온 케이스입니다.

```yaml
# 잘못된 버전: 일반 API 서비스인데 headless
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  clusterIP: None
  selector:
    app: web-api
  ports:
    - port: 8080
      targetPort: 8080
```

```yaml
# 수정 버전: ClusterIP 할당
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  type: ClusterIP
  selector:
    app: web-api
  ports:
    - name: http
      port: 8080
      targetPort: 8080
```

`spec.clusterIP`는 불변 필드라 patch로 바꿀 수 없습니다. 삭제 후 재생성해야 합니다.

```bash
kubectl -n default delete svc my-svc
kubectl -n default apply -f my-svc-fixed.yaml
```

DNS 응답 형태 차이로도 구분됩니다.

```bash
kubectl run dnsq --rm -it --restart=Never --image=nicolaka/netshoot -- \
  dig +short my-svc.default.svc.cluster.local
```

| 구성 | dig 결과 | 클라이언트 동작 |
|---|---|---|
| 일반 ClusterIP | `10.96.30.11` 한 줄 | kube-proxy가 로드밸런싱 |
| Headless | `10.244.1.7`, `10.244.2.9` 등 파드 IP 다수 | 클라이언트가 직접 선택, 커넥션 풀 편향 위험 |

### (f) selector 없는 Service + 수동 EndpointSlice

외부 DB나 클러스터 밖 레거시 API를 클러스터 내부 이름으로 노출할 때 쓰는 패턴입니다. selector가 없으면 컨트롤러는 아무것도 채워주지 않으므로 EndpointSlice를 직접 만들어야 합니다.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: legacy-db
  namespace: default
spec:
  ports:
    - name: pg
      port: 5432
      targetPort: 5432
      protocol: TCP
---
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: legacy-db-1
  namespace: default
  labels:
    kubernetes.io/service-name: legacy-db
addressType: IPv4
ports:
  - name: pg
    port: 5432
    protocol: TCP
endpoints:
  - addresses:
      - "192.168.50.31"
    conditions:
      ready: true
```

여기서 자주 빠뜨리는 세 가지입니다.

1. `labels."kubernetes.io/service-name"` — 이 라벨이 없으면 Service와 연결되지 않아 영원히 비어 있습니다.
2. `addressType` — `IPv4`, `IPv6`, `FQDN` 중 하나를 반드시 명시해야 합니다.
3. `ports[].name` — Service의 포트 이름과 정확히 일치해야 합니다. 한쪽만 이름이 있으면 매칭이 깨집니다.

```bash
kubectl -n default apply -f legacy-db.yaml
kubectl -n default get endpointslices -l kubernetes.io/service-name=legacy-db -o wide
```

정상이면 `ENDPOINTS` 컬럼에 `192.168.50.31`이 보입니다.

### (g) hostNetwork 파드와 포트 충돌

`hostNetwork: true` 파드는 노드의 네트워크 네임스페이스를 그대로 씁니다. 같은 노드에 같은 포트를 쓰는 파드가 둘 스케줄되면 두 번째는 포트 바인딩에 실패해 NotReady로 남고, 결과적으로 **일부 백엔드만 등록되는 부분 실패**가 됩니다.

```bash
kubectl -n default get pods -l app=web-api -o wide
```

`NODE` 컬럼에 동일 노드명이 중복되면서 그중 하나가 `0/1`이라면 이 케이스입니다.

```yaml
# 수정 버전: 노드당 1개만 뜨도록 anti-affinity 부여
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      hostNetwork: true
      dnsPolicy: ClusterFirstWithHostNet
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: web-api
              topologyKey: kubernetes.io/hostname
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
```

`hostNetwork` 파드에서 `dnsPolicy: ClusterFirstWithHostNet`을 빠뜨리면 클러스터 DNS를 쓰지 못해 1편에서 다룬 이름 해석 문제가 재발합니다. 세트로 기억하세요.

## Endpoints는 채워졌는데도 실패할 때 + 버전별 함정

### 버전 차이가 진단 명령을 바꾼다

- **1.21**: EndpointSlice가 기본 데이터 소스가 되었습니다. 이후 kube-proxy는 EndpointSlice를 감시하고, 레거시 `Endpoints` 객체는 호환성을 위해 컨트롤러가 미러링해 만들어 줍니다.
- **1.33 기준 권장**: 진단은 `kubectl get endpointslices`로 하는 것이 정확합니다. Endpoints API는 신규 기능(예: 트래픽 분배 관련 필드, 다중 addressType)을 반영하지 않는 방향으로 정리되고 있습니다.
- **100개 초과 분할**: EndpointSlice는 기본적으로 슬라이스당 최대 100개 엔드포인트를 담습니다. 백엔드가 250개면 슬라이스가 3개로 쪼개집니다. 이때 레거시 미러링 Endpoints 객체는 표시가 잘리거나 전체를 반영하지 못할 수 있어, "엔드포인트가 100개밖에 없네"라는 오진을 부릅니다.

대규모 서비스에서는 아래처럼 슬라이스 전체를 합산해서 세는 습관이 필요합니다.

```bash
kubectl -n default get endpointslices -l kubernetes.io/service-name=my-svc \
  -o jsonpath='{range .items[*]}{range .endpoints[*]}{.addresses[0]}{"\n"}{end}{end}' \
  | sort -u | wc -l
```

정상이라면 실제 Ready 파드 수와 같은 숫자가 나옵니다. `kubectl get endpoints`의 출력 길이와 다르다면 EndpointSlice 쪽 숫자를 믿으세요.

### 실패 분기 트리: kube-proxy 모드부터 확인

Endpoints가 정상인데도 ClusterIP 접속이 실패한다면, 다음은 데이터플레인입니다. 먼저 모드를 확인합니다.

```bash
kubectl -n kube-system get cm kube-proxy -o yaml | grep -i "mode"
```

모드별 룰 확인 명령입니다. 노드에 직접 접속하거나 특권 디버그 파드에서 실행합니다.

```bash
# iptables 모드
sudo iptables-save | grep my-svc

# IPVS 모드
sudo ipvsadm -Ln | grep -A3 10.96.30.11

# nftables 모드 (1.31+ 에서 사용 가능)
sudo nft list ruleset | grep my-svc
```

예상 정상 결과는 각각 이렇습니다.

| 모드 | 정상 출력 특징 | 비정상일 때 |
|---|---|---|
| iptables | `KUBE-SVC-XXXX` 체인과 백엔드 수만큼의 `KUBE-SEP-XXXX` 점프 | 체인은 있는데 SEP가 0개 → Endpoints 반영 안 됨 |
| IPVS | `TCP 10.96.30.11:8080` 아래에 real server 목록 | real server 0줄 → 동일 |
| nftables | `kube-proxy` 테이블 내 서비스 체인과 verdict map | 항목 누락 → kube-proxy 파드 로그 확인 |

셋 다 룰이 정상인데 실패한다면 kube-proxy 자체가 아니라 노드 간 경로 문제이므로 4편 영역입니다.

여기서 하나 짚어둘 흐름이 있습니다. Cilium 같은 eBPF 기반 CNI에서 **kube-proxy replacement**를 켜면 위 명령들이 전부 무의미해집니다. `iptables-save`에 서비스 체인이 아예 없는 것이 정상 상태이며, 진단은 `cilium service list`, `cilium endpoint list` 쪽으로 이동합니다. "iptables에 룰이 없다 = 장애"라고 단정하기 전에 CNI 구성을 먼저 확인하세요.

### `externalTrafficPolicy: Local`의 특정 노드 실패 패턴

NodePort/LoadBalancer에서 클라이언트 소스 IP를 보존하려고 `Local`을 설정하면, **해당 노드에 백엔드 파드가 없을 때 그 노드로 들어온 요청은 전달되지 않고 끊깁니다.** "3대 중 1대로 붙을 때만 실패"하는 간헐 장애의 전형적 원인입니다.

```bash
kubectl -n default get svc my-svc -o jsonpath='{.spec.externalTrafficPolicy}{"\n"}'
kubectl -n default get pods -l app=web-api -o wide
kubectl get nodes -o name
```

파드가 떠 있는 노드 목록과 전체 노드 목록을 비교해, 파드가 없는 노드로 요청이 가는지 확인합니다. 해결 방향은 두 갈래입니다.

```bash
# 1) 소스 IP 보존이 필수가 아니면 Cluster로 전환
kubectl -n default patch svc my-svc -p '{"spec":{"externalTrafficPolicy":"Cluster"}}'
```

```yaml
# 2) Local을 유지해야 하면 모든 노드에 파드를 배치 (DaemonSet 또는 anti-affinity + 충분한 replicas)
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: web
spec:
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
```

여기까지 확인했는데도 특정 노드 조합에서만 패킷이 사라진다면 오버레이 터널·MTU·라우팅 문제이고, 이는 4편의 주제입니다.

## 재발 방지: CI 게이트, probe 설계, 알람

### yq 기반 매니페스트 정합성 검증

배포 전에 라벨과 포트를 기계적으로 대조하면 (a), (b) 두 케이스는 프로덕션에 도달하지 못합니다.

```bash
#!/usr/bin/env bash
# validate-svc-match.sh — Service selector ↔ Deployment 라벨/포트 정합성 검증
# usage: ./validate-svc-match.sh deploy.yaml svc.yaml
set -euo pipefail

DEPLOY_FILE="${1:?deployment yaml required}"
SVC_FILE="${2:?service yaml required}"
FAIL=0

POD_LABELS=$(yq -o=json '.spec.template.metadata.labels' "$DEPLOY_FILE")
SELECTOR=$(yq -o=json '.spec.selector' "$SVC_FILE")

echo "pod labels : $POD_LABELS"
echo "selector   : $SELECTOR"

# selector의 모든 key/value가 pod labels에 포함되는지 검사
MISSING=$(echo "$SELECTOR" | jq -r --argjson labels "$POD_LABELS" \
  'to_entries[] | select(($labels[.key] // "") != .value) | .key')

if [ -n "$MISSING" ]; then
  echo "FAIL: selector keys not matched in pod labels -> $MISSING"
  FAIL=1
else
  echo "OK: selector matches pod labels"
fi

# targetPort가 숫자인 경우 containerPort 존재 확인
TARGET=$(yq '.spec.ports[0].targetPort' "$SVC_FILE")
if [[ "$TARGET" =~ ^[0-9]+$ ]]; then
  HIT=$(yq ".spec.template.spec.containers[].ports[] | select(.containerPort == $TARGET) | .containerPort" "$DEPLOY_FILE" || true)
  if [ -z "$HIT" ]; then
    echo "FAIL: targetPort $TARGET has no matching containerPort"
    FAIL=1
  else
    echo "OK: targetPort $TARGET matches containerPort"
  fi
else
  # named port인 경우 이름 정의 확인
  HIT=$(yq ".spec.template.spec.containers[].ports[] | select(.name == \"$TARGET\") | .name" "$DEPLOY_FILE" || true)
  if [ -z "$HIT" ]; then
    echo "FAIL: named targetPort '$TARGET' is not defined in containers[].ports[].name"
    FAIL=1
  else
    echo "OK: named port '$TARGET' defined"
  fi
fi

exit "$FAIL"
```

스키마 검증은 kubeconform으로 함께 겁니다.

```bash
kubeconform -strict -summary -kubernetes-version 1.33.0 deploy.yaml svc.yaml
```

GitHub Actions 예시입니다.

```yaml
name: k8s-manifest-gate
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install tools
        run: |
          sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
          sudo chmod +x /usr/local/bin/yq
          curl -sSL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz
          sudo mv kubeconform /usr/local/bin/
      - name: Schema validation
        run: kubeconform -strict -summary -kubernetes-version 1.33.0 manifests/
      - name: Selector/port match
        run: ./validate-svc-match.sh manifests/deploy.yaml manifests/svc.yaml
```

### Readiness probe 설계 원칙 3가지

1. **의존성을 probe에 넣지 말 것.** DB 연결까지 검사하는 readiness는 DB 순간 장애 때 전 파드를 동시에 백엔드에서 빼버려 `Endpoints: <none>`을 스스로 만듭니다. readiness는 "이 프로세스가 요청을 받을 준비가 되었는가"만 답하게 하고, 의존성 상태는 별도 메트릭으로 노출하세요.
2. **긴 `initialDelaySeconds` 대신 `startupProbe`를 쓸 것.** 부팅이 느린 JVM 앱에 initialDelay를 크게 잡으면 장애 감지도 그만큼 늦어집니다. startupProbe로 부팅 구간만 분리하면 readiness 주기는 짧게 유지할 수 있습니다.
3. **롤아웃 중 전면 NotReady를 막을 것.** `maxUnavailable`과 PodDisruptionBudget을 함께 설정합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
          startupProbe:
            httpGet:
              path: /healthz
              port: http
            failureThreshold: 30
            periodSeconds: 5
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 5
            timeoutSeconds: 2
            failureThreshold: 3
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-api
```

### 알람: 엔드포인트 0개를 5분 안에 잡는다

kube-state-metrics 기반 PrometheusRule입니다.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: service-endpoint-rules
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  groups:
    - name: service-endpoints
      rules:
        - alert: ServiceHasNoEndpoints
          expr: |
            kube_endpoint_address_available == 0
            and on (namespace, service)
            label_replace(
              kube_service_spec_type{type!="ExternalName"},
              "service", "$1", "service", "(.*)"
            )
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Service {{ $labels.namespace }}/{{ $labels.service }} has zero endpoints"
            description: "5분 이상 사용 가능한 엔드포인트가 0개입니다. selector 라벨, targetPort, readiness probe 순서로 확인하세요."
        - alert: ServiceEndpointsDropped
          expr: |
            delta(kube_endpoint_address_available[10m]) < 0
            and kube_endpoint_address_available < 2
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Endpoints decreasing for {{ $labels.namespace }}/{{ $labels.service }}"
            description: "엔드포인트 수가 감소해 2개 미만입니다. 롤아웃 또는 readiness 실패 여부를 확인하세요."
```

`ExternalName` 타입은 Endpoints가 비어 있는 것이 정상이므로 반드시 제외 조건을 넣어야 오탐이 줄어듭니다. 메트릭 이름은 kube-state-metrics 버전에 따라 `kube_endpointslice_*` 계열로도 제공되므로, 배포된 버전의 메트릭 목록을 먼저 확인하고 적용하세요.

## 이번 편 체크리스트와 다음 편 예고

장애 상황에서 위에서부터 순서대로만 치면 됩니다.

1. `kubectl get endpoints <svc>`와 `kubectl get endpointslices -l kubernetes.io/service-name=<svc>`로 비었는지 확정한다.
2. netshoot에서 Pod IP → ClusterIP → NodePort 순으로 curl해 계층을 양분한다.
3. `kubectl get pods -l <selector>` 0건이면 (a) selector 불일치를 먼저 의심한다.
4. 파드는 잡히는데 비었다면 READY 컬럼과 readiness 이벤트로 (c)를 확인한다.
5. `targetPort`가 named port면 컨테이너에 같은 이름이 정의됐는지 확인한다.
6. selector가 비어 있으면 수동 EndpointSlice의 `kubernetes.io/service-name` 라벨과 `addressType`을 점검한다.
7. Endpoints가 정상인데 실패하면 kube-proxy 모드별 룰과 `externalTrafficPolicy: Local`을 본다.

복구 후에도 즉시 반영되지 않는 경우가 있는데, kube-proxy가 EndpointSlice 변경을 감지해 룰을 동기화하는 데 수 초가 걸리고 conntrack에 남은 기존 세션이 이전 경로를 유지하기 때문입니다. 조급하게 추가 변경을 얹지 말고 30초 정도 재확인하는 여유가 필요합니다.

다음 편은 **4편 "Endpoints는 정상인데 노드를 넘으면 끊긴다 — CNI 오버레이·MTU·kube-proxy 데이터플레인 디버깅"**입니다. 같은 노드 안에서는 되는데 노드를 넘으면 죽는 패턴, MTU 불일치로 큰 응답만 사라지는 현상, VXLAN 캡슐화 구간 추적을 다룹니다.

공식 참고 자료로는 Kubernetes 공식 문서의 Service, EndpointSlice, Virtual IPs and Service Proxies 문서를 함께 보시길 권합니다.

## 자주 묻는 질문 (FAQ)

**Q1. Endpoints와 EndpointSlice 중 무엇을 봐야 하나요?**
A. 1.21 이후 실제 데이터 소스는 EndpointSlice입니다. 빠른 확인용으로 `kubectl get endpoints`를 써도 되지만, 백엔드가 100개를 넘어 슬라이스가 분할되는 규모에서는 목록이 잘려 보일 수 있습니다. 정확한 판단이 필요하면 `kubectl get endpointslices -l kubernetes.io/service-name=<svc>`를 기준으로 삼으세요.

**Q2. NotReady 파드로도 트래픽을 보내고 싶습니다.**
A. `spec.publishNotReadyAddresses: true`로 가능합니다. 다만 이 옵션의 정당한 용도는 StatefulSet 피어 디스커버리처럼 부팅 중 상호 발견이 필요한 경우입니다. 일반 사용자 트래픽 Service에 적용하면 준비되지 않은 파드로 요청이 흘러 5xx가 발생하므로, 임시 우회라면 원복 기한을 반드시 정하세요.

**Q3. Headless Service에서 `Endpoints: <none>`이면 항상 장애인가요?**
A. 아닙니다. `clusterIP: None`인 Headless Service는 kubectl 출력 형태가 다를 수 있고, ExternalName 타입은 애초에 엔드포인트 개념이 없어 비어 있는 것이 정상입니다. 판단 기준은 `dig`로 파드 IP가 여러 개 반환되는지, EndpointSlice에 주소가 실제로 존재하는지입니다.

**Q4. 매니페스트를 고쳤는데 왜 바로 복구되지 않나요?**
A. endpointslice controller가 변경을 반영하고 kube-proxy가 각 노드의 룰을 동기화하는 데 시간이 걸립니다. 여기에 conntrack 테이블의 기존 세션이 이전 목적지로 유지되면서 체감 복구가 늦어집니다. 클라이언트 커넥션 풀을 새로 맺게 하거나 확인용 요청을 새 연결로 보내면 차이를 구분할 수 있습니다.

**Q5. `connection refused`와 `timeout` 중 어느 쪽이 어떤 원인을 시사하나요?**
A. 즉시 떨어지는 `connection refused`는 대체로 백엔드가 0건이라 REJECT 룰이 응답한 경우로, 이 글의 7가지 원인부터 확인하면 됩니다. 반면 `timeout`은 패킷이 응답 없이 사라진 것이므로 NetworkPolicy 차단(2편), CNI 경로·MTU 문제(4편), 또는 앱이 응답하지 않는 상황을 의심하는 편이 빠릅니다.$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$Service selector를 -l에 넣는 명령 오류(jsonpath JSON → app:web) 수정, jq로 key=value 변환$q$::text))
WHERE id=805 AND md5(content)='6cbc72334bd677fa4ca9701147a9eaf9';
UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$## DNS Resolves, but Where Did the Traffic Go?

Part 1 covered CoreDNS name resolution, and Part 2 confirmed this is not a NetworkPolicy block. Even so, `curl http://my-svc:8080` from an application pod still returns `connection refused`. `kubectl describe svc my-svc` puts the answer on a single line.

```text
Endpoints:         <none>
```

This series walks three layers: **name resolution (Part 1) → policy blocks (Part 2) → binding Service to Pod (Part 3)**. This installment is the third: the name resolves, policy is open, and yet **there is nowhere to send the packet**.

Unrolled as text, the traffic path looks like this.

```text
Client Pod
  → DNS 조회 (my-svc.default.svc.cluster.local → 10.96.x.x)   [1편 영역]
  → ClusterIP 10.96.x.x:8080
  → kube-proxy가 설치한 DNAT 룰 (iptables / IPVS / nftables)
  → EndpointSlice에 등록된 Pod IP:targetPort 목록
  → Pod IP 10.244.x.x:8080                                   [4편 영역]
```

`Endpoints: <none>` means **line four is an empty array**. The control-plane endpointslice controller looks for pods that match the Service `selector` and are Ready, then fills EndpointSlice. If that result is zero, kube-proxy reflects “no backends” into the data plane.

The application log line `no endpoints available for service "default/my-svc"` is the same signal. It is what the API server proxy path or an Ingress controller emits when the backend list is empty, and the causal layer is identical to `Endpoints: <none>`.

That creates the first fork: **`connection refused` vs `timeout`**.

| Symptom | kube-proxy behavior | Implication |
|---|---|---|
| Immediate `connection refused` | Zero backends, so a REJECT rule is installed (iptables default) | Endpoints are likely empty |
| `timeout` after several to tens of seconds | DNAT happened, but the packet vanished with no reply | Endpoints are populated; look at CNI, policy, or an unresponsive app |

If `connection refused` comes back immediately, start with this post’s decision table. If you get a `timeout`, skip ahead to the second half of section 3 and to Part 4. Overlapping symptoms are covered in the baseline flow at [kubectl get endpoints <none>·Service connection refused 5분 진단](/blog/kubectl-get-endpoints-noneservice-connection-refused-5분-진단); this post focuses on decomposing seven causes, version-specific traps, and automation gates.

Scope: Kubernetes 1.21+ (after EndpointSlice became default), kubectl 1.25+, and all kube-proxy modes (iptables / IPVS / nftables).

## 30-Second First Pass: Narrow the Scope with Six Commands

In an incident, do not think—run these from the top. Copy them and change only the service name and namespace.

```bash
SVC=my-svc
NS=default

# 1) 레거시 Endpoints 객체 확인 (가장 빠른 신호)
kubectl -n "$NS" get endpoints "$SVC"

# 2) EndpointSlice 확인 (1.21+ 실제 소스 오브 트루스)
kubectl -n "$NS" get endpointslices -l "kubernetes.io/service-name=$SVC" -o wide

# 3) Service 정의와 이벤트
kubectl -n "$NS" describe svc "$SVC"

# 4) Service selector 원문
kubectl -n "$NS" get svc "$SVC" -o jsonpath='{.spec.selector}{"\n"}'

# 5) 파드 라벨 전량 확인
kubectl -n "$NS" get pods --show-labels

# 6) selector로 실제 매칭되는 파드 수
#    jsonpath '{.spec.selector}' prints JSON such as {"app":"web"}, which -l does not accept.
#    Convert it to key=value,key=value with jq.
SEL_KV=$(kubectl -n "$NS" get svc "$SVC" -o json | jq -r '.spec.selector // {} | to_entries | map("\(.key)=\(.value)") | join(",")')
[ -n "$SEL_KV" ] && kubectl -n "$NS" get pods -l "$SEL_KV" -o wide
```

Healthy output looks like this.

```text
NAME     ENDPOINTS                                   AGE
my-svc   10.244.1.7:8080,10.244.2.9:8080             12d
```

If the `ENDPOINTS` column shows `<none>`, you have confirmation. The same conclusion holds if command 2 shows no EndpointSlice at all, or an empty `ENDPOINTS` column.

### Split the layers: curl the Pod IP directly

The critical judgment is “is the app dead, is the Service binding broken, or is node-to-node traffic blocked?” One temporary netshoot pod splits that in 30 seconds.

```bash
kubectl -n default run tmp-netshoot --rm -it --restart=Never \
  --image=nicolaka/netshoot -- /bin/bash
```

Inside the pod shell, hit the three layers in order.

```bash
# ① Pod IP 직접 (Service를 건너뜀)
curl -sS -m 3 -o /dev/null -w "podip:%{http_code}\n" http://10.244.1.7:8080/

# ② ClusterIP
curl -sS -m 3 -o /dev/null -w "clusterip:%{http_code}\n" http://10.96.30.11:8080/

# ③ NodePort (해당 서비스가 NodePort 타입일 때)
curl -sS -m 3 -o /dev/null -w "nodeport:%{http_code}\n" http://192.168.10.21:30080/
```

The combination of results cuts the scope immediately.

| ① Pod IP | ② ClusterIP | ③ NodePort | Verdict | Next action |
|---|---|---|---|---|
| Success | Fail | Fail | Service ↔ Pod binding problem | Walk decision table (a)–(g) in section 3 |
| Fail | Fail | Fail | Application / container port problem | Check container logs and `ss -lntp` for the listen port |
| Success | Success | Fail | External node ingress / externalTrafficPolicy | Part 4, `externalTrafficPolicy: Local` section |
| Success | Intermittent fail | Intermittent fail | Some backends unhealthy, or node-to-node communication | Check kube-proxy rules, then Part 4 (CNI) |

Run `ss -lntp` inside the target container like this.

```bash
kubectl -n default exec -it deploy/web -- sh -c "ss -lntp || netstat -lntp"
```

Healthy output includes a line such as `LISTEN 0 128 0.0.0.0:8080`. If you only see `127.0.0.1:8080`, the app is bound to loopback only—and traffic fails even when Endpoints are populated.

### One-screen combined diagnostic script

Keep a file around for repeat incidents.

```bash
#!/usr/bin/env bash
# svc-diag.sh — Service/Endpoint 결합 상태 일괄 점검
# usage: ./svc-diag.sh <service-name> [namespace]
set -euo pipefail

SVC="${1:?service name required}"
NS="${2:-default}"

line() { printf '\n=== %s ===\n' "$1"; }

line "Service spec"
kubectl -n "$NS" get svc "$SVC" -o yaml | grep -E 'clusterIP:|type:|externalTrafficPolicy:|publishNotReadyAddresses:' || true

line "Selector"
SELECTOR=$(kubectl -n "$NS" get svc "$SVC" -o jsonpath='{.spec.selector}')
echo "raw: ${SELECTOR:-<empty>}"

line "Ports (port -> targetPort)"
kubectl -n "$NS" get svc "$SVC" \
  -o jsonpath='{range .spec.ports[*]}{.name}{" "}{.port}{" -> "}{.targetPort}{"\n"}{end}'

line "Endpoints (legacy)"
kubectl -n "$NS" get endpoints "$SVC" -o wide || echo "no endpoints object"

line "EndpointSlices"
kubectl -n "$NS" get endpointslices -l "kubernetes.io/service-name=$SVC" -o wide || true

line "EndpointSlice ready conditions"
kubectl -n "$NS" get endpointslices -l "kubernetes.io/service-name=$SVC" \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .endpoints[*]}{.addresses[0]}{"=ready:"}{.conditions.ready}{" "}{end}{"\n"}{end}' || true

line "Matching pods"
SEL_KV=$(kubectl -n "$NS" get svc "$SVC" -o json \
  | jq -r '.spec.selector // {} | to_entries | map("\(.key)=\(.value)") | join(",")')
if [ -n "$SEL_KV" ]; then
  kubectl -n "$NS" get pods -l "$SEL_KV" -o wide || true
else
  echo "selector is empty (selector-less Service: manual EndpointSlice required)"
fi

line "All pod labels in namespace"
kubectl -n "$NS" get pods --show-labels

line "Recent events"
kubectl -n "$NS" get events --sort-by=.lastTimestamp | tail -20
```

```bash
chmod +x svc-diag.sh
./svc-diag.sh my-svc default
```

If the `Matching pods` section prints `No resources found`, the cause is almost certainly (a) selector mismatch. If pods appear but EndpointSlice is empty, it is (c) Readiness-related.

## Cause Decision Table: 7 Cases and a One-Line Fix

Start with the full map.

| # | Symptom | Cause | Confirm command | One-line recovery |
|---|---|---|---|---|
| a | Endpoints `<none>`, 0 pods via selector | Selector label typo / mismatch | `kubectl get pods -l app=web` | `kubectl patch svc my-svc -p '{"spec":{"selector":{"app":"web-api"}}}'` |
| b | Endpoints exist but connect fails, or `<none>` | targetPort ↔ containerPort mismatch, named port undefined | `kubectl get svc my-svc -o jsonpath='{.spec.ports[*].targetPort}'` | `kubectl patch svc my-svc --type=json -p '[{"op":"replace","path":"/spec/ports/0/targetPort","value":8080}]'` |
| c | Pod is Running but EndpointSlice ready=false | Readiness probe failure → NotReady | READY column from `kubectl get pods -o wide` + `kubectl describe pod` | `kubectl patch deploy web --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/healthz"}]'` |
| d | Fails only from another namespace | Services do not cross namespaces | `kubectl get pods -A -l app=web` | Use FQDN: `curl http://my-svc.other-ns.svc.cluster.local:8080` |
| e | `Endpoints: <none>` but DNS returns many pod IPs | Headless Service (`clusterIP: None`) misconfigured | `kubectl get svc my-svc -o jsonpath='{.spec.clusterIP}'` | Delete the Service and re-apply a manifest without `clusterIP: None` |
| f | Selector empty and no EndpointSlice | Selector-less Service missing a manual EndpointSlice | `kubectl get svc my-svc -o jsonpath='{.spec.selector}'` is blank | Apply a manual EndpointSlice YAML (example below) |
| g | Only some pods registered; fails only on certain nodes | Port collision on hostNetwork pods | Duplicate node in `kubectl get pods -o wide` | `kubectl patch deploy web -p '{"spec":{"template":{"spec":{"affinity":{"podAntiAffinity":{"requiredDuringSchedulingIgnoredDuringExecution":[{"labelSelector":{"matchLabels":{"app":"web"}},"topologyKey":"kubernetes.io/hostname"}]}}}}}}'` |

### (a) Selector label typo / mismatch

This is the most common case. The Deployment template label is `app: web-api`, but the Service selector says `app: web`.

```yaml
# 잘못된 버전
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: default
spec:
  selector:
    app: web          # 파드 라벨은 web-api
  ports:
    - port: 8080
      targetPort: 8080
```

```yaml
# 수정 버전
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: default
spec:
  selector:
    app: web-api
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      protocol: TCP
```

Confirmation is one line.

```bash
kubectl -n default get pods -l app=web
```

`No resources found in default namespace.` means the selector matches nothing. Remember that a Service selector is an **AND**. If you set both `app: web` and `tier: backend`, only pods with both labels match. Missing `tier` on the pod yields zero results.

### (b) targetPort ↔ containerPort mismatch, named port undefined

Named ports improve readability, but if the container does not define the name, the EndpointSlice port is empty or filled with the wrong value.

```yaml
# 잘못된 버전: Service는 http라는 이름을 찾는데 컨테이너에 이름이 없음
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  selector:
    app: web-api
  ports:
    - port: 8080
      targetPort: http
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - containerPort: 8080   # name 지정 누락
```

```yaml
# 수정 버전: 컨테이너 포트에 name: http 정의
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  selector:
    app: web-api
  ports:
    - name: http
      port: 8080
      targetPort: http
      protocol: TCP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
```

Check command and expected result:

```bash
kubectl -n default get endpointslices -l kubernetes.io/service-name=my-svc \
  -o jsonpath='{range .items[*]}{range .ports[*]}{.name}{":"}{.port}{"\n"}{end}{end}'
```

Healthy output looks like `http:8080`—an actual number. If you have a name but an empty port, (b) is confirmed.

### (c) Readiness probe failure → NotReady

If the pod is `Running` but `READY 0/1`, the endpointslice controller marks `conditions.ready: false`, and kube-proxy excludes that address from the service backends.

```bash
kubectl -n default get pods -l app=web-api
kubectl -n default describe pod <pod-name> | grep -A5 "Readiness"
```

```text
NAME                   READY   STATUS    RESTARTS   AGE
web-6f9c8d5b4c-2xk7p   0/1     Running   0          3m
```

You will typically also see an event such as `Warning  Unhealthy  ... Readiness probe failed: HTTP probe failed with statuscode: 404`. Classic case: probe path or port does not match the app. If you need to drill into probe failures themselves, use the branch table in [K8s Liveness/Readiness probe failed·connection refused 원인별 해결](/blog/k8s-livenessreadiness-probe-failedconnection-refused-원인별-해결).

`publishNotReadyAddresses: true` is the option that also puts NotReady addresses into EndpointSlice.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db-headless
spec:
  clusterIP: None
  publishNotReadyAddresses: true
  selector:
    app: postgres
  ports:
    - name: pg
      port: 5432
      targetPort: 5432
```

The legitimate use is clear: StatefulSet-based clustered software that must discover peers during boot. Flip this on a normal web Service and user requests flow to unready pods, and 5xx rates climb. **Turning it on to hide an outage is irreversible debt**—even as a temporary bypass, file a ticket and set a revert deadline.

### (d) Pod lives in another namespace

A Service selector finds pods **only in the same namespace**. There is no cross-namespace selector.

```bash
kubectl get pods -A -l app=web-api -o wide
```

If the pod is in `prod` and the Service is in `default`, move the Service or have the client use the FQDN.

```bash
curl -sS http://my-svc.prod.svc.cluster.local:8080/healthz
```

To alias an external name, use ExternalName.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-svc
  namespace: default
spec:
  type: ExternalName
  externalName: my-svc.prod.svc.cluster.local
```

ExternalName returns only a CNAME, so empty `Endpoints` is expected. `<none>` in this case is not an incident.

### (e) Headless Service misconfiguration

You copied a StatefulSet manifest and `clusterIP: None` came along for the ride.

```yaml
# 잘못된 버전: 일반 API 서비스인데 headless
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  clusterIP: None
  selector:
    app: web-api
  ports:
    - port: 8080
      targetPort: 8080
```

```yaml
# 수정 버전: ClusterIP 할당
apiVersion: v1
kind: Service
metadata:
  name: my-svc
spec:
  type: ClusterIP
  selector:
    app: web-api
  ports:
    - name: http
      port: 8080
      targetPort: 8080
```

`spec.clusterIP` is immutable; you cannot patch it. Delete and recreate.

```bash
kubectl -n default delete svc my-svc
kubectl -n default apply -f my-svc-fixed.yaml
```

DNS response shape also distinguishes the two.

```bash
kubectl run dnsq --rm -it --restart=Never --image=nicolaka/netshoot -- \
  dig +short my-svc.default.svc.cluster.local
```

| Setup | dig result | Client behavior |
|---|---|---|
| Regular ClusterIP | Single line `10.96.30.11` | kube-proxy load-balances |
| Headless | Multiple pod IPs such as `10.244.1.7`, `10.244.2.9` | Client picks directly; connection-pool skew risk |

### (f) Selector-less Service + manual EndpointSlice

This is the pattern for exposing an external DB or an out-of-cluster legacy API under an in-cluster name. With no selector, the controller fills nothing, so you must create the EndpointSlice yourself.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: legacy-db
  namespace: default
spec:
  ports:
    - name: pg
      port: 5432
      targetPort: 5432
      protocol: TCP
---
apiVersion: discovery.k8s.io/v1
kind: EndpointSlice
metadata:
  name: legacy-db-1
  namespace: default
  labels:
    kubernetes.io/service-name: legacy-db
addressType: IPv4
ports:
  - name: pg
    port: 5432
    protocol: TCP
endpoints:
  - addresses:
      - "192.168.50.31"
    conditions:
      ready: true
```

Three things people routinely omit:

1. `labels."kubernetes.io/service-name"` — without this label the Service never binds and stays empty forever.
2. `addressType` — you must set one of `IPv4`, `IPv6`, or `FQDN`.
3. `ports[].name` — must match the Service port name exactly. A name on only one side breaks the match.

```bash
kubectl -n default apply -f legacy-db.yaml
kubectl -n default get endpointslices -l kubernetes.io/service-name=legacy-db -o wide
```

Healthy: the `ENDPOINTS` column shows `192.168.50.31`.

### (g) hostNetwork pods and port collisions

A `hostNetwork: true` pod uses the node’s network namespace as-is. If two pods using the same port land on the same node, the second fails to bind, stays NotReady, and you get a **partial failure where only some backends register**.

```bash
kubectl -n default get pods -l app=web-api -o wide
```

If the `NODE` column repeats the same node name and one of those pods is `0/1`, this is the case.

```yaml
# 수정 버전: 노드당 1개만 뜨도록 anti-affinity 부여
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      hostNetwork: true
      dnsPolicy: ClusterFirstWithHostNet
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchLabels:
                  app: web-api
              topologyKey: kubernetes.io/hostname
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
```

If you omit `dnsPolicy: ClusterFirstWithHostNet` on a `hostNetwork` pod, it will not use cluster DNS and the name-resolution issues from Part 1 come back. Remember them as a pair.

## Endpoints Are Populated and It Still Fails + Version Traps

### Version differences change the diagnostic commands

- **1.21**: EndpointSlice became the default data source. Since then kube-proxy watches EndpointSlice, and the legacy `Endpoints` object is mirrored by a controller for compatibility.
- **Recommended as of 1.33**: Diagnose with `kubectl get endpointslices`. The Endpoints API is being cleaned up in a direction that does not reflect newer features (for example traffic-distribution fields, multiple addressTypes).
- **Split past 100**: An EndpointSlice holds at most 100 endpoints by default. 250 backends become 3 slices. The mirrored legacy Endpoints object may truncate or fail to reflect the full set, which produces the false reading “there are only 100 endpoints.”

On large Services, get in the habit of summing every slice:

```bash
kubectl -n default get endpointslices -l kubernetes.io/service-name=my-svc \
  -o jsonpath='{range .items[*]}{range .endpoints[*]}{.addresses[0]}{"\n"}{end}{end}' \
  | sort -u | wc -l
```

Healthy: the number equals the actual Ready pod count. If that differs from `kubectl get endpoints` output length, trust the EndpointSlice number.

### Failure branch tree: start with kube-proxy mode

If Endpoints look healthy but ClusterIP still fails, you are in the data plane. Check the mode first.

```bash
kubectl -n kube-system get cm kube-proxy -o yaml | grep -i "mode"
```

Mode-specific rule dumps. Run them on the node or from a privileged debug pod.

```bash
# iptables 모드
sudo iptables-save | grep my-svc

# IPVS 모드
sudo ipvsadm -Ln | grep -A3 10.96.30.11

# nftables 모드 (1.31+ 에서 사용 가능)
sudo nft list ruleset | grep my-svc
```

Expected healthy output:

| Mode | Healthy signature | When unhealthy |
|---|---|---|
| iptables | `KUBE-SVC-XXXX` chain and one `KUBE-SEP-XXXX` jump per backend | Chain exists but 0 SEPs → Endpoints not reflected |
| IPVS | Real server list under `TCP 10.96.30.11:8080` | 0 real-server lines → same |
| nftables | Service chain and verdict map in the `kube-proxy` table | Missing entries → check kube-proxy pod logs |

If all three look healthy and it still fails, it is not kube-proxy itself but the node-to-node path—Part 4 territory.

One flow to flag: with eBPF CNIs such as Cilium, **kube-proxy replacement** makes every command above meaningless. Having no service chains in `iptables-save` is the healthy state; diagnosis moves to `cilium service list` and `cilium endpoint list`. Check the CNI config before concluding “no iptables rules = outage.”

### The `externalTrafficPolicy: Local` single-node failure pattern

On NodePort/LoadBalancer, setting `Local` to preserve client source IP means **a request that lands on a node with no backend pod is not forwarded—it is dropped.** Classic cause of “fails only when I hit 1 of 3 nodes.”

```bash
kubectl -n default get svc my-svc -o jsonpath='{.spec.externalTrafficPolicy}{"\n"}'
kubectl -n default get pods -l app=web-api -o wide
kubectl get nodes -o name
```

Compare the nodes that have pods against the full node list, and check whether traffic is hitting nodes with no pods. Two fix directions:

```bash
# 1) 소스 IP 보존이 필수가 아니면 Cluster로 전환
kubectl -n default patch svc my-svc -p '{"spec":{"externalTrafficPolicy":"Cluster"}}'
```

```yaml
# 2) Local을 유지해야 하면 모든 노드에 파드를 배치 (DaemonSet 또는 anti-affinity + 충분한 replicas)
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: web
spec:
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
```

If packets still vanish only for certain node combinations after this, you are looking at overlay tunnel / MTU / routing—the subject of Part 4.

## Preventing Recurrence: CI Gates, Probe Design, Alerts

### yq-based manifest consistency checks

Mechanically comparing labels and ports before deploy keeps cases (a) and (b) out of production.

```bash
#!/usr/bin/env bash
# validate-svc-match.sh — Service selector ↔ Deployment 라벨/포트 정합성 검증
# usage: ./validate-svc-match.sh deploy.yaml svc.yaml
set -euo pipefail

DEPLOY_FILE="${1:?deployment yaml required}"
SVC_FILE="${2:?service yaml required}"
FAIL=0

POD_LABELS=$(yq -o=json '.spec.template.metadata.labels' "$DEPLOY_FILE")
SELECTOR=$(yq -o=json '.spec.selector' "$SVC_FILE")

echo "pod labels : $POD_LABELS"
echo "selector   : $SELECTOR"

# selector의 모든 key/value가 pod labels에 포함되는지 검사
MISSING=$(echo "$SELECTOR" | jq -r --argjson labels "$POD_LABELS" \
  'to_entries[] | select(($labels[.key] // "") != .value) | .key')

if [ -n "$MISSING" ]; then
  echo "FAIL: selector keys not matched in pod labels -> $MISSING"
  FAIL=1
else
  echo "OK: selector matches pod labels"
fi

# targetPort가 숫자인 경우 containerPort 존재 확인
TARGET=$(yq '.spec.ports[0].targetPort' "$SVC_FILE")
if [[ "$TARGET" =~ ^[0-9]+$ ]]; then
  HIT=$(yq ".spec.template.spec.containers[].ports[] | select(.containerPort == $TARGET) | .containerPort" "$DEPLOY_FILE" || true)
  if [ -z "$HIT" ]; then
    echo "FAIL: targetPort $TARGET has no matching containerPort"
    FAIL=1
  else
    echo "OK: targetPort $TARGET matches containerPort"
  fi
else
  # named port인 경우 이름 정의 확인
  HIT=$(yq ".spec.template.spec.containers[].ports[] | select(.name == \"$TARGET\") | .name" "$DEPLOY_FILE" || true)
  if [ -z "$HIT" ]; then
    echo "FAIL: named targetPort '$TARGET' is not defined in containers[].ports[].name"
    FAIL=1
  else
    echo "OK: named port '$TARGET' defined"
  fi
fi

exit "$FAIL"
```

Pair it with kubeconform for schema validation.

```bash
kubeconform -strict -summary -kubernetes-version 1.33.0 deploy.yaml svc.yaml
```

GitHub Actions example:

```yaml
name: k8s-manifest-gate
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install tools
        run: |
          sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
          sudo chmod +x /usr/local/bin/yq
          curl -sSL https://github.com/yannh/kubeconform/releases/latest/download/kubeconform-linux-amd64.tar.gz | tar xz
          sudo mv kubeconform /usr/local/bin/
      - name: Schema validation
        run: kubeconform -strict -summary -kubernetes-version 1.33.0 manifests/
      - name: Selector/port match
        run: ./validate-svc-match.sh manifests/deploy.yaml manifests/svc.yaml
```

### Three principles for Readiness probe design

1. **Do not put dependencies in the probe.** A readiness check that also tests the DB connection will yank every pod out of backends during a brief DB blip and manufacture `Endpoints: <none>` yourself. Readiness should answer only “is this process ready to take requests?” Expose dependency health as a separate metric.
2. **Prefer `startupProbe` over a long `initialDelaySeconds`.** A large initialDelay on a slow-booting JVM app also delays failure detection. Isolate boot with startupProbe and keep the readiness period short.
3. **Prevent a full NotReady during rollout.** Set `maxUnavailable` together with a PodDisruptionBudget.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: web-api
  template:
    metadata:
      labels:
        app: web-api
    spec:
      containers:
        - name: app
          image: nginx:1.27
          ports:
            - name: http
              containerPort: 8080
          startupProbe:
            httpGet:
              path: /healthz
              port: http
            failureThreshold: 30
            periodSeconds: 5
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            periodSeconds: 5
            timeoutSeconds: 2
            failureThreshold: 3
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: web-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: web-api
```

### Alerting: catch zero endpoints within 5 minutes

A PrometheusRule based on kube-state-metrics.

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: service-endpoint-rules
  namespace: monitoring
  labels:
    release: kube-prometheus-stack
spec:
  groups:
    - name: service-endpoints
      rules:
        - alert: ServiceHasNoEndpoints
          expr: |
            kube_endpoint_address_available == 0
            and on (namespace, service)
            label_replace(
              kube_service_spec_type{type!="ExternalName"},
              "service", "$1", "service", "(.*)"
            )
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Service {{ $labels.namespace }}/{{ $labels.service }} has zero endpoints"
            description: "5분 이상 사용 가능한 엔드포인트가 0개입니다. selector 라벨, targetPort, readiness probe 순서로 확인하세요."
        - alert: ServiceEndpointsDropped
          expr: |
            delta(kube_endpoint_address_available[10m]) < 0
            and kube_endpoint_address_available < 2
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Endpoints decreasing for {{ $labels.namespace }}/{{ $labels.service }}"
            description: "엔드포인트 수가 감소해 2개 미만입니다. 롤아웃 또는 readiness 실패 여부를 확인하세요."
```

ExternalName Services normally have empty Endpoints, so the exclusion is mandatory or you will page on noise. Metric names may also appear as the `kube_endpointslice_*` family depending on kube-state-metrics version—check the metrics list on the version you actually run before applying.

## This Installment’s Checklist and a Preview of the Next

In an incident, just run from the top.

1. Confirm emptiness with `kubectl get endpoints <svc>` and `kubectl get endpointslices -l kubernetes.io/service-name=<svc>`.
2. From netshoot, curl Pod IP → ClusterIP → NodePort to split the layers.
3. If `kubectl get pods -l <selector>` is 0, suspect (a) selector mismatch first.
4. If pods match but Endpoints are empty, check the READY column and readiness events for (c).
5. If `targetPort` is a named port, confirm the same name is defined on the container.
6. If the selector is empty, inspect the manual EndpointSlice `kubernetes.io/service-name` label and `addressType`.
7. If Endpoints are healthy and it still fails, inspect kube-proxy rules by mode and `externalTrafficPolicy: Local`.

Recovery is sometimes not instant: kube-proxy can take a few seconds to notice EndpointSlice changes and sync rules, and leftover conntrack sessions keep the old path. Do not pile on extra changes—recheck after about 30 seconds.

Next is **Part 4, “Endpoints Are Healthy but Crossing Nodes Breaks — Debugging CNI Overlay, MTU, and the kube-proxy Data Plane.”** Same-node works, cross-node dies; large responses vanish from MTU mismatch; tracing the VXLAN encapsulation path.

Official references worth reading alongside this: the Kubernetes docs on Service, EndpointSlice, and Virtual IPs and Service Proxies.

## FAQ

**Q1. Should I look at Endpoints or EndpointSlice?**
A. Since 1.21 the real data source is EndpointSlice. `kubectl get endpoints` is fine for a quick check, but once backends exceed 100 and slices split, the list can look truncated. For an accurate call, treat `kubectl get endpointslices -l kubernetes.io/service-name=<svc>` as the source of truth.

**Q2. I want to send traffic to NotReady pods too.**
A. Set `spec.publishNotReadyAddresses: true`. The legitimate use is peer discovery during boot, as with StatefulSets. On a user-facing Service it sends requests to unready pods and produces 5xx. If it is a temporary bypass, set a revert deadline.

**Q3. On a Headless Service, is `Endpoints: <none>` always an incident?**
A. No. A Headless Service with `clusterIP: None` can look different in kubectl output, and ExternalName has no endpoint concept at all—empty is normal. Judge by whether `dig` returns multiple pod IPs and whether addresses actually exist on the EndpointSlice.

**Q4. I fixed the manifest. Why didn’t it recover immediately?**
A. The endpointslice controller has to apply the change, and kube-proxy has to sync rules on every node. On top of that, existing conntrack sessions keep the old destination, so recovery feels delayed. Force clients to open a new connection (or recycle the connection pool) to tell the difference.

**Q5. What do `connection refused` vs `timeout` imply?**
A. Immediate `connection refused` usually means zero backends and a REJECT rule answering—start with the seven causes in this post. A `timeout` means the packet vanished with no reply, so suspect a NetworkPolicy block (Part 2), a CNI path/MTU issue (Part 4), or an app that is not responding.$q$::text))
WHERE id=805 AND md5(content_evidence->'en'->>'content')='64604ac7f650eecd1b457ff122d92aa4';

