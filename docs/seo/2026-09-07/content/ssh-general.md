### SSH 접속 오류(Connection refused, Permission denied 등) 해결 가이드

SSH 접속 시 발생할 수 있는 다양한 문제들을 원인별로 정리해놓았습니다. `Connection refused`, `Permission denied (publickey)`, `Host key verification failed` 등의 오류 메시지에 대한 진단 방법과 수정 과정을 상세히 설명합니다.

연결 직후 `kex_exchange_identification: read: Connection reset by peer`가 보인다면 [SSH reset by peer·Connection closed 진단](/blog/ssh-connection-closedreset-by-peer-5분-진단복구-fail2banmaxstartups)에서 인증 전 연결 제한과 서버 로그를 확인하세요.

#### 1. Connection refused — SSH 데몬 확인

```bash
# 서버의 SSH 서비스 상태 확인
sudo systemctl status ssh        # Ubuntu/Debian
sudo systemctl status sshd       # CentOS/RHEL

# 중지된 경우 시작 시키기
sudo systemctl start ssh
sudo systemctl enable ssh

# 실제 리스닝 포트 확인
sudo ss -tlnp | grep ssh
```

SSH 데몬이 실행 중인데 `refused`가 발생한다면, SSH 서비스가 22번 포트를 사용하고 있는지 확인해야 합니다. 다음 명령어로 포트 번호를 확인할 수 있습니다.

```bash
# 실제 SSH 서비스 포트 확인
sudo sshd -T | grep port
```

#### 2. Connection refused / timed out — 방화벽 확인

SSH 접속이 `refused` 또는 `timed out`될 때는 OS의 방화벽 설정과 클라우드 제공자의 보안 그룹을 확인해야 합니다.

```bash
# UFW (Ubuntu 기본)
sudo ufw status
sudo ufw allow ssh    # 22번 포트 허용

# firewalld (CentOS/RHEL)
sudo firewall-cmd --list-services
sudo firewall-cmd --add-service=ssh --permanent && sudo firewall-cmd --reload

# iptables 직접 확인
sudo iptables -L INPUT -n | grep 22
```

클라우드 환경에서 SSH 접속이 되지 않는다면, 해당 인스턴스의 보안 그룹 설정을 확인해야 합니다.

```bash
curl -s ifconfig.me
# 위 명령어로 자신의 IP 주소를 얻은 후 해당 IP에 대한 퍼미션을 부여합니다.
```

#### 3. Permission denied (publickey) — 키 인증 실패

SSH 접속 시 `Permission denied (publickey)` 오류가 발생한다면, 다음의 원인들을 확인해야 합니다.

1. **키 파일 경로 지정**: SSH 명령어 실행시 `-i` 옵션을 사용해 키 파일 경로를 명시합니다.
2. **authorized_keys 권한 문제**: 서버에서 `.ssh/authorized_keys` 파일의 소유자와 권한 설정을 확인하고 수정해야 합니다.
3. **공개키 등록**: 클라이언트의 공개키가 서버의 `~/.ssh/authorized_keys` 파일에 올바르게 등록되어 있는지 확인합니다.
4. **sshd_config 설정 문제**: SSH 서비스가 키 인증을 활성화하고 있는지 (`PubkeyAuthentication yes`) 확인합니다.

#### 4. Host key verification failed — fingerprint 불일치

서버 재설치·IP 변경뿐 아니라 다른 서버로 연결되거나 중간자 공격이 있을 때도 나타날 수 있습니다. 관리 콘솔 등 신뢰할 수 있는 별도 경로에서 새 호스트 키 fingerprint를 확인하세요. 정당한 변경임을 확인한 뒤에만 기존 항목을 갱신합니다.

```bash
ssh-keygen -R 서버IP
# 재접속 시 표시되는 fingerprint를 별도 경로에서 확인한 값과 대조
ssh user@서버IP
```

호스트 키 확인 절차는 [OpenSSH 호스트 키 검증 문서](https://man.openbsd.org/ssh#VERIFYING_HOST_KEYS)를 참고하세요.

#### 5. 빠른 진단 체크리스트

다음 명령어들을 순차적으로 실행하여 SSH 접속 문제를 진단합니다.

```bash
ssh -v user@서버IP 2>&1 | head -30   # verbose 로그
telnet 서버IP 22                       # 포트 연결 테스트
curl -v telnet://서버IP:22             # telnet 없을 때 대안
nc -zv 서버IP 22                       # netcat 포트 확인

# 서버에서 실행 (콘솔 접근 가능한 경우)
sudo systemctl is-active ssh           # 데몬 상태
sudo ss -tlnp | grep :22               # 포트 리스닝
sudo ufw status                        # 방화벽
sudo tail -20 /var/log/auth.log        # 인증 로그 (Ubuntu)
sudo tail -20 /var/log/secure          # 인증 로그 (CentOS)
```

### 정리

| 증상 | 확인 순서 |
|---|---|
| Connection refused | ① SSH 데몬 실행 → ② OS 방화벽 → ③ 클라우드 보안 그룹 |
| Connection timed out | ① 클라우드 보안 그룹 → ② OS 방화벽 (DROP 규칙) |
| Permission denied (publickey) | ① 키 파일 경로 → ② .ssh 권한 → ③ authorized_keys 등록 → ④ sshd_config |
| Host key failed | 별도 경로로 fingerprint 확인 → 정당한 변경인 경우 known_hosts 갱신 |

### 자주 묻는 질문 (FAQ)

**Q. SSH connection refused와 timed out은 어떻게 다른가요?**
A. `refused`는 접속 시도에 연결 거부 응답을 받은 경우이고, `timed out`는 제한 시간 안에 연결을 완료하지 못한 경우입니다. 타임아웃만으로 패킷이 서버에 도달하지 않았다고 단정할 수는 없습니다. `refused` 발생시 데몬과 OS 방화벽을, `timed out` 발생 시 클라우드 보안 그룹부터 확인하세요.

**Q. 데몬은 켜져 있는데 계속 connection refused가 납니다.**
A. 포트 번호가 22번이 아닌지(`sshd_config`의 `Port`) 또는 SSH 서비스가 특정 IP에만 바인딩되어 있는지 (`ListenAddress`) 확인해야 합니다. 서버에서 `sudo ss -tlnp | grep sshd`로 실제 리스닝 주소와 포트를 확인하세요.
