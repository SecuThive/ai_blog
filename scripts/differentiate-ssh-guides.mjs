// 엔지니어 가이드 SSH 보안 클러스터 중복 해소 (재범위화 + 상호 링크)
// - #2 ssh-hardening-guide  → SSH 설정·접근 제어 심화 (fail2ban은 #34로 포인터)
// - #34 ssh-hardening-fail2ban → fail2ban 무차별 대입 차단 심화 (기본 설정은 #2로 포인터)
// - #69 linux-server-initial-security-setup → 심화 가이드 표의 제목/설명을 새 역할에 맞춰 갱신
// 사용: node scripts/differentiate-ssh-guides.mjs           (드라이런: 백업만)
//       node scripts/differentiate-ssh-guides.mjs --apply   (실제 업데이트)
import { createClient } from '@supabase/supabase-js/dist/index.mjs';
import { writeFileSync } from 'node:fs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const APPLY = process.argv.includes('--apply');

// ─────────────────────────────────────────────────────────────
// #2 — SSH 설정·접근 제어 완전 가이드
// ─────────────────────────────────────────────────────────────
const guide2 = {
  id: 2,
  title: 'SSH 설정·접근 제어 완전 가이드 — sshd_config 하드닝과 키 인증',
  summary:
    'sshd_config 하드닝, 키 기반 인증 전환, AllowGroups·Match 블록·MFA까지 SSH 접근을 제어하는 방법을 정리합니다. 무차별 대입 자동 차단(fail2ban)은 별도 가이드에서 다룹니다.',
  tags: ['ssh', 'sshd_config', '보안', '서버', '키인증', '접근제어', 'mfa'],
  content: `## SSH 보안의 출발점 — 현재 설정 점검

SSH 서버의 기본값은 편의성 위주라 공격 표면이 넓습니다. 손대기 전에 실제 적용 중인 값부터 확인합니다.

\`\`\`bash
sudo sshd -T | grep -Ei "permitrootlogin|passwordauthentication|^port|maxauthtries|allowusers|allowgroups"
\`\`\`

> 이 가이드는 **sshd_config 하드닝과 접근 제어**에 집중합니다. 무차별 대입(brute-force) 자동 차단·IP 밴은 [fail2ban으로 SSH 무차별 대입 차단](/engineer/ssh-hardening-fail2ban) 가이드를 함께 적용하세요.

---

## /etc/ssh/sshd_config 핵심 하드닝

\`\`\`bash
# 포트 변경 (기본 22 → 사용자 지정, 자동 스캔 노이즈 감소)
Port 2222

# root 직접 로그인 차단
PermitRootLogin no

# 패스워드 인증 비활성화 (키 설정 완료 후 적용)
PasswordAuthentication no
KbdInteractiveAuthentication no   # 구버전: ChallengeResponseAuthentication no

# 빈 패스워드 금지
PermitEmptyPasswords no

# 인증 시도 횟수 / 로그인 유예 시간
MaxAuthTries 3
LoginGraceTime 20

# 유휴 세션 자동 종료 (5분 무응답 시 끊기)
ClientAliveInterval 300
ClientAliveCountMax 0

# 불필요한 기능 비활성화
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
\`\`\`

적용 전 **반드시 문법 검증** 후 reload — 잘못된 설정으로 잠기는 사고를 막습니다.

\`\`\`bash
sudo sshd -t && sudo systemctl reload ssh   # 데비안/우분투: ssh, RHEL계열: sshd
\`\`\`

> **잠금 방지**: 설정을 바꾸는 동안 기존 SSH 세션을 **하나 더 열어 두세요**. 새 세션으로 접속이 확인되기 전에는 기존 세션을 닫지 않습니다.

---

## SSH 키 기반 인증 설정

**클라이언트 측 (내 PC)** — Ed25519 키 권장(짧고 빠르며 안전).

\`\`\`bash
ssh-keygen -t ed25519 -C "deploy@myserver" -f ~/.ssh/myserver_ed25519
cat ~/.ssh/myserver_ed25519.pub
\`\`\`

**서버 측** — 공개키만 등록(개인키는 절대 서버로 옮기지 않음).

\`\`\`bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAA... deploy@myserver" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
\`\`\`

\`ssh-copy-id\`를 쓰면 위 과정을 한 줄로 처리할 수 있습니다.

\`\`\`bash
ssh-copy-id -i ~/.ssh/myserver_ed25519.pub -p 2222 deploy@server-ip
ssh -i ~/.ssh/myserver_ed25519 -p 2222 deploy@server-ip   # 키 접속 확인
\`\`\`

키 접속이 확인된 **다음에** 위 sshd_config의 \`PasswordAuthentication no\`를 적용합니다.

---

## 접근 제어 심화 — AllowGroups · Match 블록

사용자를 일일이 \`AllowUsers\`에 나열하기보다 **그룹 기반**으로 관리하면 운영이 단순해집니다.

\`\`\`bash
# SSH 허용 그룹 생성 후 사용자 편입
sudo groupadd sshusers
sudo usermod -aG sshusers deploy
\`\`\`

\`\`\`bash
# sshd_config
AllowGroups sshusers
\`\`\`

\`Match\` 블록으로 **조건별 정책**을 분리할 수 있습니다. 예: 배포 계정은 키 인증만, 특정 대역만 접속 허용.

\`\`\`bash
# 특정 사용자에게 SFTP 전용·chroot 적용
Match User backup
    ForceCommand internal-sftp
    ChrootDirectory /srv/backup
    AllowTcpForwarding no

# 내부망에서만 패스워드 허용 (예외 정책)
Match Address 10.0.0.0/8
    PasswordAuthentication yes
\`\`\`

---

## 다단계 인증(MFA) — 키 + TOTP

키가 유출돼도 한 단계 더 막으려면 TOTP(구글 OTP 등)를 추가합니다.

\`\`\`bash
sudo apt install libpam-google-authenticator
google-authenticator   # 대화형: QR 스캔 후 비상 코드 저장
\`\`\`

\`\`\`bash
# /etc/pam.d/sshd 상단에 추가
auth required pam_google_authenticator.so

# /etc/ssh/sshd_config
KbdInteractiveAuthentication yes
AuthenticationMethods publickey,keyboard-interactive
\`\`\`

이제 **키 + OTP** 두 가지를 모두 통과해야 로그인됩니다.

---

## UFW로 SSH 포트만 노출

\`\`\`bash
sudo ufw allow 2222/tcp
sudo ufw enable
sudo ufw status verbose
\`\`\`

> **다음 단계**: 자동 차단까지 갖추려면 [fail2ban으로 SSH 무차별 대입 차단](/engineer/ssh-hardening-fail2ban)을, 새 서버 전체 초기 점검은 [신규 Linux 서버 초기 보안 설정 체크리스트](/engineer/linux-server-initial-security-setup)를 참고하세요.`,
};

// ─────────────────────────────────────────────────────────────
// #34 — fail2ban으로 SSH 무차별 대입 차단
// ─────────────────────────────────────────────────────────────
const guide34 = {
  id: 34,
  title: 'fail2ban으로 SSH 무차별 대입 차단 — jail 설정과 모니터링',
  summary:
    'fail2ban으로 SSH 브루트포스를 자동 탐지·차단합니다. jail.local 핵심 파라미터, recidive 영구 차단, 이메일 알림, Cloudflare·ipset 연동, 운영 명령까지 정리합니다. SSH 기본 하드닝은 별도 가이드 참고.',
  tags: ['fail2ban', 'ssh', '보안', '무차별대입', 'brute-force', '서버보안', '모니터링'],
  content: `## 이 가이드의 범위

이 글은 **fail2ban으로 SSH 무차별 대입(brute-force) 공격을 자동 차단**하는 데 집중합니다. SSH 키 인증 전환·sshd_config 하드닝 같은 **기본 설정은 먼저** [SSH 설정·접근 제어 완전 가이드](/engineer/ssh-hardening-guide)로 끝내 두세요.

전제: SSH 포트를 \`2222\`로 바꾸고 키 인증만 허용한 상태.

---

## 설치와 jail.local

기본 \`jail.conf\`는 패키지 업데이트 시 덮어쓰이므로 **항상 \`jail.local\`에 오버라이드**합니다.

\`\`\`bash
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
\`\`\`

\`\`\`ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 1h          # 차단 유지 시간
findtime = 10m         # 이 시간 내 실패를 카운트
maxretry = 5           # 임계치 초과 시 차단
ignoreip = 127.0.0.1/8 ::1 203.0.113.10   # 내 고정 IP는 화이트리스트
backend  = systemd     # journald 사용 시

[sshd]
enabled  = true
port     = 2222        # sshd_config에서 바꾼 포트와 일치시킬 것
maxretry = 3
bantime  = 1d
\`\`\`

\`\`\`bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd   # jail 동작 확인
\`\`\`

> **포트 불일치 주의**: SSH 포트를 바꿨다면 \`[sshd]\`의 \`port\`도 같은 값으로 맞춰야 로그가 매칭됩니다. 안 맞으면 차단이 전혀 동작하지 않습니다.

---

## 핵심 파라미터 — bantime · findtime · maxretry

| 파라미터 | 의미 | 권장 |
|---|---|---|
| \`findtime\` | 실패 횟수를 세는 관찰 창 | 10m |
| \`maxretry\` | 이 횟수 초과 시 차단 | SSH 3 |
| \`bantime\` | 한 번 차단 시 유지 시간 | 1d (반복 시 가중) |

\`bantime = -1\`로 두면 **영구 차단**이지만, 오탐 시 본인이 잠길 수 있어 아래 recidive jail로 점증 차단하는 편이 안전합니다.

---

## 반복 위반자 영구 차단 — recidive jail

짧은 밴이 풀리자마자 다시 두드리는 IP를 **장기 차단**합니다. fail2ban 자신의 로그를 다시 감시하는 방식입니다.

\`\`\`ini
# /etc/fail2ban/jail.local
[recidive]
enabled  = true
logpath  = /var/log/fail2ban.log
banaction = %(banaction_allports)s   # 모든 포트 차단
bantime  = 1w
findtime = 1d
maxretry = 5
\`\`\`

---

## 이메일 알림 연동

차단이 발생할 때 메일로 통지받으려면 \`action\`을 메일 포함 버전으로 바꿉니다.

\`\`\`ini
[DEFAULT]
destemail = admin@example.com
sender    = fail2ban@example.com
mta       = sendmail
# 차단 + whois + 관련 로그까지 메일에 포함
action    = %(action_mwl)s
\`\`\`

---

## Cloudflare · ipset 연동 — 엣지에서 차단

서버 앞단(Cloudflare)이나 커널 ipset에서 끊으면 부하가 줄고 차단이 더 빨라집니다.

\`\`\`ini
# Cloudflare API로 차단 (방화벽 규칙 생성)
[sshd]
action = cloudflare[cfuser="me@example.com", cftoken="API_TOKEN"]
\`\`\`

\`\`\`ini
# 또는 ipset + iptables (대량 IP를 O(1)로 차단)
[DEFAULT]
banaction = iptables-ipset-proto6-allports
\`\`\`

---

## 운영 — 상태 확인 · 수동 차단/해제

\`\`\`bash
# jail 상태와 현재 차단 IP
sudo fail2ban-client status sshd

# 특정 IP 수동 차단 / 해제
sudo fail2ban-client set sshd banip 1.2.3.4
sudo fail2ban-client set sshd unbanip 1.2.3.4

# 전체 jail 재로드(설정 변경 후)
sudo fail2ban-client reload
\`\`\`

---

## 로그인 시도 모니터링

차단 규칙이 잘 듣는지, 어떤 IP가 두드리는지 직접 확인합니다.

\`\`\`bash
# 실패한 로그인 시도
journalctl -u ssh | grep "Failed password" | tail -20

# IP별 실패 횟수 (공격 출처 상위)
journalctl -u ssh | grep "Failed password" \\
  | grep -oE "from [0-9.]+" | awk '{print $2}' | sort | uniq -c | sort -rn | head

# fail2ban이 실제로 밴한 기록
sudo zgrep "Ban " /var/log/fail2ban.log* | tail -20
\`\`\`

> **자기 차단 방지**: 작업용 고정 IP는 반드시 \`ignoreip\`에 넣으세요. 빠졌다가 본인이 밴되면 콘솔(웹 KVM)로만 풀 수 있습니다. 기본 SSH 하드닝은 [SSH 설정·접근 제어 완전 가이드](/engineer/ssh-hardening-guide)를 참고하세요.`,
};

// ─────────────────────────────────────────────────────────────
// #69 — 심화 가이드 표를 새 제목/역할에 맞춰 갱신
// ─────────────────────────────────────────────────────────────
const OLD_TABLE_BLOCK = `| 주제 | 가이드 | 난이도 |
|---|---|---|
| SSH 키·포트·AllowUsers 완전 설정 | SSH 보안 강화 설정 완전 가이드 | 중급 |
| fail2ban jail 규칙·이메일 알림·Cloudflare 연동 | SSH 서버 보안 강화 — 설정 최적화와 fail2ban | 중급 |
| UFW 포트 범위·앱 프로파일·로깅 | UFW 방화벽 설정 완전 가이드 | 초급 |`;

const NEW_TABLE_BLOCK = `| 주제 | 가이드 | 난이도 |
|---|---|---|
| sshd_config 하드닝·키 인증·AllowGroups·MFA | [SSH 설정·접근 제어 완전 가이드](/engineer/ssh-hardening-guide) | 중급 |
| fail2ban jail·recidive 영구 차단·이메일·Cloudflare | [fail2ban으로 SSH 무차별 대입 차단](/engineer/ssh-hardening-fail2ban) | 중급 |
| UFW 포트 범위·앱 프로파일·로깅 | UFW 방화벽 설정 완전 가이드 | 초급 |`;

// ─────────────────────────────────────────────────────────────
async function main() {
  // 백업
  const { data: backup, error: bErr } = await supabase
    .from('engineer_guides')
    .select('*')
    .in('id', [2, 34, 69]);
  if (bErr) { console.error('BACKUP FAIL:', bErr.message); process.exit(1); }
  const backupPath = 'scripts/ssh-guides-backup-2026-06-13.json';
  writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`백업 저장: ${backupPath} (${backup.length} rows)`);

  const g69 = backup.find(g => g.id === 69);
  const has69Table = g69 && g69.content.includes(OLD_TABLE_BLOCK);
  console.log(`#69 표 블록 매칭: ${has69Table ? 'OK' : '⚠️ 못 찾음 (스킵)'}`);

  if (!APPLY) {
    console.log('\n[DRY-RUN] --apply 없이 실행됨. 백업만 저장하고 종료합니다.');
    console.log('적용 예정:');
    console.log(`  #2  title → ${guide2.title}`);
    console.log(`  #34 title → ${guide34.title}`);
    console.log(`  #69 표 갱신 → ${has69Table ? 'YES' : 'SKIP'}`);
    return;
  }

  for (const g of [guide2, guide34]) {
    const { error } = await supabase
      .from('engineer_guides')
      .update({ title: g.title, summary: g.summary, tags: g.tags, content: g.content })
      .eq('id', g.id);
    if (error) { console.error(`#${g.id} UPDATE FAIL:`, error.message); process.exit(1); }
    console.log(`#${g.id} 업데이트 완료 (content ${g.content.length}자)`);
  }

  if (has69Table) {
    const updated69 = g69.content.replace(OLD_TABLE_BLOCK, NEW_TABLE_BLOCK);
    const { error } = await supabase
      .from('engineer_guides')
      .update({ content: updated69 })
      .eq('id', 69);
    if (error) { console.error('#69 UPDATE FAIL:', error.message); process.exit(1); }
    console.log('#69 심화 가이드 표 갱신 완료');
  }

  console.log('\n✅ SSH 보안 클러스터 중복 해소 완료.');
}

main();
