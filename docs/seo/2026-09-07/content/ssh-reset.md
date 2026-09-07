`kex_exchange_identification: read: Connection reset by peer`는 SSH 키 교환 단계에서 연결이 리셋됐다는 메시지입니다. `Connection closed by remote host`도 함께 보일 수 있습니다. **이 문자열만으로 Fail2Ban 차단을 확정할 수는 없습니다.** 클라이언트의 `ssh -vvv`와 같은 시각의 서버 로그를 연결해 원인을 좁혀야 합니다.

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

## 4. 계정별 정책과 sshd 상태 확인

```bash
sudo sshd -T | grep -iE 'allowusers|denyusers|allowgroups|denygroups'
sudo sshd -t
```

`Match` 조건이 있는 환경에서는 단순 `sshd -T` 결과만으로 특정 연결의 설정을 판단하지 않습니다. 관리자가 실제 사용자·원격 주소 등을 `sshd -T -C`에 지정해 유효 설정을 확인할 수 있습니다. 실행 전 로컬 `man sshd`에서 지원 옵션을 확인하세요.

설정 변경은 기존 관리 세션을 유지한 상태에서 문법 검사 후 적용합니다. 서비스 이름이 `ssh`인 환경의 예시는 다음과 같습니다.

```bash
sudo sshd -t && sudo systemctl reload ssh
```

이후 별도 터미널에서 새 연결이 성공하는지 확인한 뒤 기존 세션을 종료합니다. 리슨 중이던 프로세스가 내려갔다면 먼저 journal의 시작 실패 원인을 수정합니다.

## 5. hosts.deny는 구형 환경에서만 확인

OpenSSH는 **6.7에서 TCP Wrappers/libwrap 지원을 제거**했습니다. 따라서 현대 OpenSSH 서버에서 `/etc/hosts.deny`를 고치는 것을 기본 해결책으로 안내하면 맞지 않습니다. 구형 패키지나 별도 패치로 libwrap을 사용하는 환경인지 확인된 경우에만 조사합니다. [OpenSSH 6.7 릴리스 노트](https://www.openssh.org/txt/release-6.7)

현재 서버의 방화벽은 배포 구성에 따라 nftables, iptables, UFW, 클라우드 보안그룹 등에서 확인합니다. 진단을 위해 전체 방화벽을 해제하기보다 필요한 출발지·목적지·포트 규칙을 확인하세요.

## 접속 경로가 모두 막혔을 때

호스팅 관리 콘솔, 사전에 구성한 시리얼 콘솔, 복구 환경 등 별도 관리 경로를 이용합니다. 클라우드 시리얼 콘솔은 인스턴스·계정·OS별 사전 조건이 있어 버튼만 누르면 항상 연결되는 기능은 아닙니다.

복구 뒤에는 **원인 로그 → 변경한 규칙 → 새 연결 성공 여부**를 기록합니다. 특정 IP 차단인지, 동시 연결 제한인지, sshd 장애인지 확인된 원인에 따라 재발 방지 조치를 선택하세요.


차단 원인을 확인한 뒤 방어 설정을 정리하려면 [SSH 하드닝과 Fail2Ban 구성](/engineer/ssh-hardening-fail2ban)을 참고하세요.
