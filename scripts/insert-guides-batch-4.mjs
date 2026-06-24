import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── 클라우드 ──────────────────────────────────────────
  {
    title: 'AWS IAM 역할·정책 실전 — 최소권한 모범사례',
    slug: 'aws-iam-roles-policies-guide',
    summary: 'IAM 사용자·그룹·역할·정책의 개념 차이, JSON 정책 작성법, 최소권한 원칙 적용, MFA 강제, IAM 모범사례를 정리합니다.',
    category: '클라우드',
    tags: ['aws', 'iam', '최소권한', '정책', '보안', 'role'],
    difficulty: 'intermediate',
    os_compat: [],
    author: 'Nodelog',
    content: `## IAM 핵심 개념

| 개념 | 설명 |
|---|---|
| **사용자(User)** | 실제 사람 또는 서비스 계정 |
| **그룹(Group)** | 사용자 모음 — 그룹에 정책 부여 |
| **역할(Role)** | EC2·Lambda 등 AWS 서비스가 가정하는 임시 자격증명 |
| **정책(Policy)** | 허용/거부 규칙 JSON 문서 |
| **권한 경계** | 역할이 가질 수 있는 최대 권한 범위 |

---

## JSON 정책 구조

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ReadOnly",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/*"
      ]
    },
    {
      "Sid": "DenyDeleteEverything",
      "Effect": "Deny",
      "Action": "s3:DeleteObject",
      "Resource": "*"
    }
  ]
}
\`\`\`

> Deny는 Allow보다 항상 우선합니다.

---

## 최소권한 정책 예시

### EC2 읽기 전용

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ec2:Describe*",
      "ec2:List*"
    ],
    "Resource": "*"
  }]
}
\`\`\`

### 특정 S3 버킷만 전체 접근

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListAllMyBuckets",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::my-specific-bucket",
        "arn:aws:s3:::my-specific-bucket/*"
      ]
    }
  ]
}
\`\`\`

---

## EC2 인스턴스 역할 생성

\`\`\`bash
# 역할 생성
aws iam create-role \\
  --role-name EC2-S3-ReadOnly \\
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# 정책 연결
aws iam attach-role-policy \\
  --role-name EC2-S3-ReadOnly \\
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 인스턴스 프로파일 생성 및 연결
aws iam create-instance-profile --instance-profile-name EC2-S3-ReadOnly
aws iam add-role-to-instance-profile \\
  --instance-profile-name EC2-S3-ReadOnly \\
  --role-name EC2-S3-ReadOnly
\`\`\`

---

## MFA 강제 정책

콘솔 접속 시 MFA 미설정 시 권한 차단:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyWithoutMFA",
      "Effect": "Deny",
      "NotAction": [
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:GetUser",
        "iam:ListMFADevices",
        "sts:GetSessionToken"
      ],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}
\`\`\`

---

## IAM 모범사례 체크리스트

\`\`\`bash
# root 계정 사용 현황 확인
aws iam get-account-summary | grep RootAccess

# MFA 미설정 사용자 확인
aws iam generate-credential-report
aws iam get-credential-report | python3 -c "
import sys, base64, csv, io
data = eval(sys.stdin.read())
report = base64.b64decode(data['Content']).decode()
reader = csv.DictReader(io.StringIO(report))
for row in reader:
    if row['mfa_active'] == 'false' and row['password_enabled'] == 'true':
        print(row['user'])
"

# 90일 이상 미사용 접근키
aws iam list-users --query 'Users[*].UserName' --output text | \\
  xargs -I{} aws iam list-access-keys --user-name {} --query \\
  'AccessKeyMetadata[?Status==\`Active\`].[UserName,AccessKeyId,CreateDate]' \\
  --output table
\`\`\`

- root 계정은 MFA 설정 후 사용 금지
- 개인 액세스키 대신 역할(Role) 사용
- 정기적으로 미사용 자격증명 삭제
- AWS Organizations SCP로 계정 수준 가드레일 적용`,
  },

  {
    title: 'AWS RDS 설정 가이드 — 인스턴스·파라미터·백업·스냅샷',
    slug: 'aws-rds-setup-guide',
    summary: 'RDS 인스턴스 생성, 보안그룹 설정, 파라미터 그룹 튜닝, 자동 백업과 스냅샷 관리, 읽기 전용 복제본 생성까지 실무 설정을 정리합니다.',
    category: '클라우드',
    tags: ['aws', 'rds', 'postgresql', 'mysql', '데이터베이스', 'backup'],
    difficulty: 'intermediate',
    os_compat: [],
    author: 'Nodelog',
    content: `## RDS 인스턴스 생성 (CLI)

\`\`\`bash
# PostgreSQL 인스턴스 생성
aws rds create-db-instance \\
  --db-instance-identifier my-postgres \\
  --db-instance-class db.t3.medium \\
  --engine postgres \\
  --engine-version 16.2 \\
  --master-username admin \\
  --master-user-password "SecurePass123!" \\
  --allocated-storage 100 \\
  --storage-type gp3 \\
  --storage-encrypted \\
  --vpc-security-group-ids sg-xxxxxxxx \\
  --db-subnet-group-name my-subnet-group \\
  --backup-retention-period 7 \\
  --no-publicly-accessible \\
  --multi-az \\
  --deletion-protection

# 생성 상태 확인
aws rds describe-db-instances \\
  --db-instance-identifier my-postgres \\
  --query 'DBInstances[0].DBInstanceStatus'
\`\`\`

---

## 보안 그룹 설정

RDS는 **퍼블릭 접근을 차단**하고 애플리케이션 서버의 보안 그룹에서만 접근을 허용합니다.

\`\`\`bash
# RDS 보안 그룹 — 앱 서버 SG에서만 5432 허용
aws ec2 authorize-security-group-ingress \\
  --group-id sg-rds-xxxxxx \\
  --protocol tcp \\
  --port 5432 \\
  --source-group sg-app-xxxxxx

# 퍼블릭 접근 확인
aws rds describe-db-instances \\
  --query 'DBInstances[0].PubliclyAccessible'
\`\`\`

---

## 파라미터 그룹 튜닝

\`\`\`bash
# 파라미터 그룹 생성
aws rds create-db-parameter-group \\
  --db-parameter-group-name my-postgres16 \\
  --db-parameter-group-family postgres16 \\
  --description "Custom PostgreSQL 16 params"

# 파라미터 수정
aws rds modify-db-parameter-group \\
  --db-parameter-group-name my-postgres16 \\
  --parameters \\
    "ParameterName=shared_buffers,ParameterValue={DBInstanceClassMemory/4},ApplyMethod=pending-reboot" \\
    "ParameterName=log_min_duration_statement,ParameterValue=1000,ApplyMethod=immediate" \\
    "ParameterName=max_connections,ParameterValue=200,ApplyMethod=pending-reboot"

# 인스턴스에 파라미터 그룹 적용
aws rds modify-db-instance \\
  --db-instance-identifier my-postgres \\
  --db-parameter-group-name my-postgres16 \\
  --apply-immediately
\`\`\`

---

## 백업 및 스냅샷

\`\`\`bash
# 자동 백업 설정 확인
aws rds describe-db-instances \\
  --db-instance-identifier my-postgres \\
  --query 'DBInstances[0].{Backup:BackupRetentionPeriod,Window:PreferredBackupWindow}'

# 수동 스냅샷 생성
aws rds create-db-snapshot \\
  --db-instance-identifier my-postgres \\
  --db-snapshot-identifier my-postgres-snap-$(date +%Y%m%d)

# 스냅샷 목록
aws rds describe-db-snapshots \\
  --db-instance-identifier my-postgres \\
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \\
  --output table

# 스냅샷에서 복원
aws rds restore-db-instance-from-db-snapshot \\
  --db-instance-identifier my-postgres-restored \\
  --db-snapshot-identifier my-postgres-snap-20250527
\`\`\`

---

## 읽기 전용 복제본 (Read Replica)

\`\`\`bash
# 읽기 복제본 생성
aws rds create-db-instance-read-replica \\
  --db-instance-identifier my-postgres-reader \\
  --source-db-instance-identifier my-postgres \\
  --db-instance-class db.t3.small

# 복제본 엔드포인트 확인
aws rds describe-db-instances \\
  --db-instance-identifier my-postgres-reader \\
  --query 'DBInstances[0].Endpoint'
\`\`\`

---

## 엔드포인트 확인 및 연결

\`\`\`bash
# 엔드포인트 조회
aws rds describe-db-instances \\
  --db-instance-identifier my-postgres \\
  --query 'DBInstances[0].Endpoint.Address' \\
  --output text

# EC2에서 연결 테스트
psql -h my-postgres.xxxxxxxx.ap-northeast-2.rds.amazonaws.com \\
  -U admin -d postgres -p 5432
\`\`\`

---

## 비용 최적화 팁

- 개발 환경은 **db.t3.micro** + 단일 AZ
- 스토리지는 **gp3** (gp2보다 저렴하고 성능 독립적)
- 사용하지 않을 때는 RDS 인스턴스 **중지** (최대 7일)
- Aurora Serverless v2는 트래픽이 불규칙한 환경에 적합`,
  },

  {
    title: 'GCP Compute Engine 기초 — VM 생성·방화벽·SSH·스냅샷',
    slug: 'gcp-compute-engine-basics',
    summary: 'GCP Compute Engine에서 VM 인스턴스를 생성하고, 방화벽 규칙을 설정하며, SSH 접속, 디스크 스냅샷, 머신 이미지를 관리하는 방법을 설명합니다.',
    category: '클라우드',
    tags: ['gcp', 'compute-engine', 'vm', '방화벽', 'ssh', '스냅샷'],
    difficulty: 'beginner',
    os_compat: [],
    author: 'Nodelog',
    content: `## gcloud CLI 설치 및 초기화

\`\`\`bash
# 설치 (Linux)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# 초기화 (프로젝트·계정 설정)
gcloud init

# 현재 설정 확인
gcloud config list
gcloud auth list
\`\`\`

---

## VM 인스턴스 생성

\`\`\`bash
# 기본 VM 생성
gcloud compute instances create my-vm \\
  --project=my-project-id \\
  --zone=asia-northeast3-a \\
  --machine-type=e2-medium \\
  --image-family=ubuntu-2204-lts \\
  --image-project=ubuntu-os-cloud \\
  --boot-disk-size=20GB \\
  --boot-disk-type=pd-ssd \\
  --tags=web-server \\
  --metadata=startup-script='#!/bin/bash
    apt update && apt install -y nginx'

# 인스턴스 목록
gcloud compute instances list

# 인스턴스 상세 정보
gcloud compute instances describe my-vm --zone=asia-northeast3-a

# 시작 / 중지 / 삭제
gcloud compute instances start my-vm --zone=asia-northeast3-a
gcloud compute instances stop my-vm --zone=asia-northeast3-a
gcloud compute instances delete my-vm --zone=asia-northeast3-a
\`\`\`

---

## 방화벽 규칙 설정

\`\`\`bash
# HTTP / HTTPS 허용 (web-server 태그)
gcloud compute firewall-rules create allow-web \\
  --allow tcp:80,tcp:443 \\
  --source-ranges 0.0.0.0/0 \\
  --target-tags web-server \\
  --description "Allow HTTP and HTTPS"

# 특정 IP에서 SSH 허용
gcloud compute firewall-rules create allow-ssh-from-office \\
  --allow tcp:22 \\
  --source-ranges 203.0.113.0/24 \\
  --target-tags web-server

# 내부 통신 허용 (VPC 내부)
gcloud compute firewall-rules create allow-internal \\
  --allow all \\
  --source-ranges 10.0.0.0/8 \\
  --network default

# 방화벽 규칙 목록
gcloud compute firewall-rules list
\`\`\`

---

## SSH 접속

\`\`\`bash
# gcloud로 SSH (키 자동 관리)
gcloud compute ssh my-vm --zone=asia-northeast3-a

# 외부 IP 확인
gcloud compute instances describe my-vm \\
  --zone=asia-northeast3-a \\
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'

# 프로젝트 SSH 키 등록
gcloud compute project-info add-metadata \\
  --metadata ssh-keys="myuser:$(cat ~/.ssh/id_rsa.pub)"

# 포트포워딩
gcloud compute ssh my-vm --zone=asia-northeast3-a \\
  -- -L 5432:localhost:5432
\`\`\`

---

## 디스크 스냅샷

\`\`\`bash
# 스냅샷 생성
gcloud compute disks snapshot my-vm \\
  --zone=asia-northeast3-a \\
  --snapshot-names my-vm-snap-$(date +%Y%m%d)

# 스냅샷 목록
gcloud compute snapshots list

# 스냅샷에서 디스크 복원
gcloud compute disks create restored-disk \\
  --source-snapshot my-vm-snap-20250527 \\
  --zone=asia-northeast3-a

# 스냅샷 삭제
gcloud compute snapshots delete my-vm-snap-20250527

# 자동 스냅샷 정책
gcloud compute resource-policies create snapshot-schedule daily-backup \\
  --region=asia-northeast3 \\
  --max-retention-days=7 \\
  --daily-schedule \\
  --start-time=03:00
\`\`\`

---

## 머신 타입 변경 (스케일업)

\`\`\`bash
# 중지 후 변경
gcloud compute instances stop my-vm --zone=asia-northeast3-a

gcloud compute instances set-machine-type my-vm \\
  --zone=asia-northeast3-a \\
  --machine-type=e2-standard-4

gcloud compute instances start my-vm --zone=asia-northeast3-a
\`\`\`

---

## 비용 절감 팁

- **선점형(Preemptible)** 인스턴스: 최대 80% 저렴, 언제든 중단 가능
- **약정 사용 할인**: 1년/3년 약정으로 최대 57% 할인
- **e2 계열** 머신 타입이 n1 대비 저렴하고 성능 좋음
- 사용하지 않는 VM은 **중지** (디스크 비용만 발생)`,
  },

  {
    title: 'Cloudflare DNS · 프록시 · Page Rules 설정 가이드',
    slug: 'cloudflare-dns-proxy-setup',
    summary: 'Cloudflare에 도메인을 등록하고 DNS를 설정하며, 오렌지 클라우드(프록시) 모드, Page Rules, SSL/TLS 옵션, WAF 기본 설정을 설명합니다.',
    category: '클라우드',
    tags: ['cloudflare', 'dns', 'cdn', 'waf', 'ssl', '프록시'],
    difficulty: 'beginner',
    os_compat: [],
    author: 'Nodelog',
    content: `## Cloudflare 도메인 추가

1. [dash.cloudflare.com](https://dash.cloudflare.com) 로그인
2. **Add a Site** → 도메인 입력
3. 플랜 선택 (Free 플랜으로 충분)
4. Cloudflare가 기존 DNS 레코드 자동 스캔
5. 도메인 레지스트라에서 **네임서버 변경**:

\`\`\`
Before: ns1.yourprovider.com
After:  aria.ns.cloudflare.com
        ben.ns.cloudflare.com
\`\`\`

네임서버 반영에 최대 24시간 소요됩니다.

---

## DNS 레코드 설정

\`\`\`bash
# Cloudflare API로 레코드 관리
ZONE_ID="your_zone_id"
API_TOKEN="your_api_token"

# A 레코드 추가
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data '{
    "type": "A",
    "name": "example.com",
    "content": "1.2.3.4",
    "proxied": true,
    "ttl": 1
  }'

# CNAME 레코드
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \\
  -H "Authorization: Bearer $API_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data '{
    "type": "CNAME",
    "name": "www",
    "content": "example.com",
    "proxied": true
  }'
\`\`\`

### 주요 레코드 예시

| 타입 | 이름 | 값 | 프록시 |
|---|---|---|---|
| A | @ (루트) | 서버 IP | 켜기 |
| A | www | 서버 IP | 켜기 |
| CNAME | api | api-server.example.com | 켜기 |
| MX | @ | mail.example.com | 끄기 |
| TXT | @ | v=spf1 ... | 끄기 |

---

## 오렌지 클라우드 (프록시) 모드

- **주황색 구름 ON**: Cloudflare CDN + DDoS 보호 + 실제 서버 IP 숨김
- **회색 구름 OFF**: DNS만, 실제 IP 노출

> 이메일, FTP, SSH 레코드는 반드시 프록시 OFF

---

## SSL/TLS 설정

대시보드 → SSL/TLS → 모드 선택:

| 모드 | 설명 | 권장 |
|---|---|---|
| Off | HTTP만 | ✗ |
| Flexible | CF↔사용자만 암호화, CF↔서버는 HTTP | ✗ |
| Full | CF↔서버도 암호화, 인증서 미검증 | 조건부 |
| Full (Strict) | 유효한 인증서 필요 | ✓ |

\`\`\`
권장: Full (Strict) + 서버에 Let's Encrypt 설치
\`\`\`

---

## Page Rules

대시보드 → Rules → Page Rules (무료 3개):

### HTTP → HTTPS 리다이렉트
\`\`\`
URL: http://example.com/*
Setting: Always Use HTTPS
\`\`\`

### 캐시 설정
\`\`\`
URL: example.com/static/*
Setting: Cache Level = Cache Everything
         Edge Cache TTL = 1 month
\`\`\`

### 특정 경로 캐시 무시
\`\`\`
URL: example.com/api/*
Setting: Cache Level = Bypass
\`\`\`

---

## WAF 기본 설정 (무료)

대시보드 → Security → WAF:
- **Security Level**: Medium (기본)
- **Bot Fight Mode**: ON (봇 차단)
- **Challenge Passage**: 30분

### IP 차단
대시보드 → Security → WAF → Tools → IP Access Rules:
\`\`\`
Value: 203.0.113.0/24
Action: Block
\`\`\`

---

## Cloudflare Tunnel (내부 서버 노출)

서버 방화벽 포트 오픈 없이 HTTPS로 서비스 노출:

\`\`\`bash
# cloudflared 설치
curl -L --output cloudflared.deb \\
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# 인증 및 터널 생성
cloudflared tunnel login
cloudflared tunnel create my-tunnel
cloudflared tunnel route dns my-tunnel app.example.com

# 설정 파일
# ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: app.example.com
    service: http://localhost:3000
  - service: http_status:404

cloudflared service install
\`\`\``,
  },

  // ── 데이터베이스 ────────────────────────────────────────
  {
    title: 'MongoDB 기초 실전 — CRUD · 인덱스 · 집계 파이프라인',
    slug: 'mongodb-basics-crud-indexing',
    summary: 'MongoDB 설치부터 컬렉션 CRUD, 인덱스 생성, 집계 파이프라인($match/$group/$lookup), mongodump 백업까지 실무 패턴을 정리합니다.',
    category: '데이터베이스',
    tags: ['mongodb', 'nosql', 'crud', '인덱스', '집계', 'aggregation'],
    difficulty: 'beginner',
    os_compat: ['Ubuntu', 'Debian', 'CentOS'],
    author: 'Nodelog',
    content: `## 설치 (Ubuntu 22.04)

\`\`\`bash
# GPG 키 추가
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \\
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \\
  https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \\
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# mongosh 접속
mongosh
\`\`\`

---

## 데이터베이스 · 컬렉션 기본

\`\`\`javascript
// DB 선택 (없으면 자동 생성)
use mydb

// 컬렉션 목록
show collections

// 컬렉션 생성 (삽입 시 자동 생성)
db.createCollection("users")
\`\`\`

---

## CRUD 기본

\`\`\`javascript
// ── Create ──────────────────────────────────────
db.users.insertOne({
  name: "Alice",
  email: "alice@example.com",
  age: 30,
  tags: ["admin", "active"],
  createdAt: new Date()
})

db.users.insertMany([
  { name: "Bob", email: "bob@example.com", age: 25 },
  { name: "Carol", email: "carol@example.com", age: 35 }
])

// ── Read ────────────────────────────────────────
db.users.find()                         // 전체
db.users.find({ age: { $gt: 25 } })    // 조건
db.users.findOne({ email: "alice@example.com" })

// 프로젝션 (필드 선택)
db.users.find({}, { name: 1, email: 1, _id: 0 })

// 정렬·제한·건너뜀
db.users.find().sort({ age: -1 }).limit(10).skip(20)

// ── Update ──────────────────────────────────────
db.users.updateOne(
  { email: "alice@example.com" },
  { $set: { age: 31 }, $push: { tags: "editor" } }
)

db.users.updateMany(
  { age: { $lt: 18 } },
  { $set: { status: "minor" } }
)

// upsert (없으면 삽입)
db.users.updateOne(
  { email: "dave@example.com" },
  { $set: { name: "Dave" } },
  { upsert: true }
)

// ── Delete ──────────────────────────────────────
db.users.deleteOne({ email: "bob@example.com" })
db.users.deleteMany({ status: "inactive" })
\`\`\`

---

## 쿼리 연산자

\`\`\`javascript
// 비교
{ age: { $gt: 25, $lte: 40 } }    // 25 초과 40 이하
{ status: { $in: ["active", "pending"] } }
{ status: { $nin: ["banned"] } }

// 논리
{ $and: [{ age: { $gt: 20 } }, { age: { $lt: 40 } }] }
{ $or: [{ name: "Alice" }, { name: "Bob" }] }

// 배열
{ tags: "admin" }                  // 배열에 값 포함
{ tags: { $all: ["admin", "active"] } }

// 정규식
{ name: { $regex: /^Al/i } }
\`\`\`

---

## 인덱스

\`\`\`javascript
// 단일 인덱스
db.users.createIndex({ email: 1 }, { unique: true })

// 복합 인덱스
db.users.createIndex({ age: -1, name: 1 })

// TTL 인덱스 (30일 후 자동 삭제)
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })

// 인덱스 목록
db.users.getIndexes()

// 쿼리 실행 계획
db.users.find({ email: "alice@example.com" }).explain("executionStats")
\`\`\`

---

## 집계 파이프라인

\`\`\`javascript
// 나이별 평균 계산
db.users.aggregate([
  { $match: { status: "active" } },         // 필터
  { $group: {
    _id: "$department",
    avgAge: { $avg: "$age" },
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } },
  { $limit: 5 }
])

// $lookup — 컬렉션 조인
db.orders.aggregate([
  { $lookup: {
    from: "users",
    localField: "userId",
    foreignField: "_id",
    as: "user"
  }},
  { $unwind: "$user" },
  { $project: { orderId: 1, "user.name": 1, total: 1 } }
])
\`\`\`

---

## 백업 · 복원

\`\`\`bash
# 전체 백업
mongodump --out /backup/$(date +%Y%m%d)

# 특정 DB 백업
mongodump --db mydb --out /backup/

# 복원
mongorestore /backup/20250527/

# 특정 컬렉션만
mongodump --db mydb --collection users --out /backup/
mongorestore --db mydb --collection users /backup/mydb/users.bson
\`\`\``,
  },
];

async function insertGuides() {
  let success = 0, skipped = 0, failed = 0;
  for (const guide of guides) {
    const { error } = await supabase
      .from('engineer_guides')
      .upsert(guide, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) {
      if (error.code === '23505') { console.log(`⏭  SKIP  ${guide.slug}`); skipped++; }
      else { console.error(`✗ FAIL  ${guide.slug}:`, error.message); failed++; }
    } else {
      console.log(`✓ OK    ${guide.slug}`); success++;
    }
  }
  console.log(`\n완료: ${success}개 삽입, ${skipped}개 중복, ${failed}개 실패`);
}
insertGuides();
