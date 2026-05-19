import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const guide = {
  title: '신규 Linux 서버 초기 보안 설정 — 처음 10분 체크리스트',
  slug: 'linux-server-initial-security-setup',
  summary: '새 서버를 받았을 때 가장 먼저 해야 할 보안 설정 — 패키지 업데이트, 비루트 사용자 생성, SSH 키 인증, UFW 방화벽, fail2ban 설치까지 순서대로 따라가는 초급 가이드.',
  category: '보안 설정',
  tags: ['서버보안', '초기설정', 'UFW', 'fail2ban', 'SSH', '리눅스', '보안'],
  difficulty: 'beginner',
  os_compat: ['Ubuntu', 'Debian'],
  author: 'Nodelog',
  status: 'published',
  views: 0,
  content: `## 왜 초기 설정이 중요한가

클라우드 서버는 IP가 공개되는 순간부터 SSH 무차별 대입 공격이 시작됩니다. 기본 설정 그대로 두면 수 분 안에 수백 건의 로그인 시도가 쌓입니다.

\`\`\`bash
# 신규 서버의 실제 로그인 시도 확인
sudo journalctl -u ssh --since "1 hour ago" | grep "Failed password" | wc -l
\`\`\`

아래 순서대로 따라가면 대부분의 자동화 공격을 차단할 수 있습니다.

---

## Step 1 — 패키지 업데이트

서버를 받자마자 가장 먼저 해야 할 일입니다.

\`\`\`bash
sudo apt update && sudo apt upgrade -y

# 불필요한 패키지 정리
sudo apt autoremove -y && sudo apt autoclean

# 재부팅이 필요한지 확인
cat /var/run/reboot-required 2>/dev/null && echo "재부팅 필요" || echo "재부팅 불필요"

# 필요하면 재부팅
sudo reboot
\`\`\`

---

## Step 2 — 비루트 관리자 계정 생성

root 계정으로 직접 작업하는 것은 위험합니다. 전용 관리자 계정을 만들고 root 직접 로그인을 막습니다.

\`\`\`bash
# 새 사용자 생성
sudo adduser deploy

# sudo 권한 부여
sudo usermod -aG sudo deploy

# 전환 후 sudo 동작 확인
su - deploy
sudo whoami   # root 출력되어야 함
\`\`\`

---

## Step 3 — SSH 키 인증 설정

비밀번호 대신 SSH 키 인증을 사용하면 무차별 대입 공격을 원천 차단합니다.

### 내 PC에서 키 쌍 생성

\`\`\`bash
# 내 로컬 PC에서 실행
ssh-keygen -t ed25519 -C "my-server"
# 저장 경로: ~/.ssh/id_ed25519 (기본값 엔터)
# 패스프레이즈: 설정 권장

# 공개키 확인
cat ~/.ssh/id_ed25519.pub
\`\`\`

### 서버에 공개키 등록

\`\`\`bash
# 방법 1: ssh-copy-id (가장 간편)
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@서버IP

# 방법 2: 수동 등록 (서버에서)
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "공개키_내용을_여기에_붙여넣기" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
\`\`\`

### 키 인증 동작 확인

\`\`\`bash
# 새 터미널에서 키로 접속 테스트 (비밀번호 없이 접속되어야 함)
ssh -i ~/.ssh/id_ed25519 deploy@서버IP
\`\`\`

> **반드시** 키 접속이 성공한 것을 확인한 뒤 다음 단계로 넘어가세요. 이전에 비밀번호 인증을 끄면 서버에 접근할 수 없게 됩니다.

---

## Step 4 — SSH 보안 설정 강화

\`\`\`bash
sudo nano /etc/ssh/sshd_config
\`\`\`

아래 항목을 찾아 수정합니다.

\`\`\`ini
# root 직접 로그인 차단
PermitRootLogin no

# 비밀번호 인증 비활성화 (키 접속 확인 후!)
PasswordAuthentication no

# 빈 패스워드 허용 금지
PermitEmptyPasswords no

# 인증 시도 횟수 제한
MaxAuthTries 3

# 로그인 대기 시간 제한 (30초)
LoginGraceTime 30

# 사용할 사용자 명시 (선택 사항)
AllowUsers deploy
\`\`\`

\`\`\`bash
# 설정 문법 검사
sudo sshd -t

# 문제 없으면 적용
sudo systemctl reload ssh

# 현재 세션 유지한 채 새 터미널로 접속 테스트
ssh deploy@서버IP
\`\`\`

---

## Step 5 — UFW 방화벽 설정

필요한 포트만 열고 나머지는 모두 차단합니다.

\`\`\`bash
# UFW 설치 확인
sudo apt install -y ufw

# 기본 정책: 들어오는 연결 차단, 나가는 연결 허용
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH 허용 (현재 접속 끊기지 않도록 먼저!)
sudo ufw allow ssh          # 22번 포트

# 웹서버 운영 시 추가
sudo ufw allow http         # 80
sudo ufw allow https        # 443

# UFW 활성화
sudo ufw enable             # y 입력

# 상태 확인
sudo ufw status verbose
\`\`\`

> UFW를 활성화하기 전에 반드시 SSH(22번) 포트를 허용하세요. 그렇지 않으면 서버 접속이 끊깁니다.

---

## Step 6 — fail2ban 설치

반복 로그인 실패 IP를 자동으로 차단합니다.

\`\`\`bash
sudo apt install -y fail2ban

# 로컬 설정 파일 생성 (원본을 직접 수정하지 않음)
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
\`\`\`

\`\`\`ini
[DEFAULT]
# 10분 내 5번 실패 시 1시간 차단
findtime  = 600
maxretry  = 5
bantime   = 3600

[sshd]
enabled = true
port    = ssh
\`\`\`

\`\`\`bash
sudo systemctl enable --now fail2ban

# 차단 현황 확인
sudo fail2ban-client status sshd

# 특정 IP 차단 해제
sudo fail2ban-client set sshd unbanip 1.2.3.4
\`\`\`

---

## Step 7 — 자동 보안 업데이트 설정

패치를 수동으로 챙기기 어렵다면 보안 업데이트만 자동으로 설치합니다.

\`\`\`bash
sudo apt install -y unattended-upgrades

# 설정 확인 및 활성화
sudo dpkg-reconfigure -plow unattended-upgrades

# 설정 파일 확인
cat /etc/apt/apt.conf.d/20auto-upgrades
\`\`\`

\`\`\`ini
# /etc/apt/apt.conf.d/20auto-upgrades
APT::Periodic::Update-Package-Lists "1";      # 매일 목록 갱신
APT::Periodic::Unattended-Upgrade "1";        # 매일 보안 업데이트 설치
APT::Periodic::AutocleanInterval "7";         # 7일마다 캐시 정리
\`\`\`

---

## Step 8 — 최종 확인 체크리스트

\`\`\`bash
# SSH 키 인증만 허용되는지 확인
sudo sshd -T | grep -E "permitrootlogin|passwordauthentication|maxauthtries"

# 방화벽 상태
sudo ufw status verbose

# fail2ban 동작 여부
sudo systemctl is-active fail2ban

# 자동 업데이트 활성화 여부
cat /etc/apt/apt.conf.d/20auto-upgrades

# 최근 로그인 기록
last | head -10
\`\`\`

설정 완료 후 예상 결과:

| 항목 | 확인 결과 |
|---|---|
| root SSH 로그인 | 차단됨 |
| 비밀번호 로그인 | 차단됨 |
| 방화벽 | SSH/HTTP/HTTPS만 허용 |
| fail2ban | 5회 실패 시 1시간 차단 |
| 보안 업데이트 | 자동 적용 중 |`,
};

const { error } = await supabase.from('engineer_guides').insert(guide);
if (error) console.error('FAIL:', error.message);
else console.log('OK:', guide.slug);
