import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

const guides = [

  // ── 보안 설정 ─────────────────────────────────────────────────────
  {
    title: 'Linux 시스템 보안 감사 — Lynis · auditd · SELinux 실전',
    slug: 'linux-security-audit-lynis-auditd-selinux',
    summary: 'Lynis 자동 감사, auditd 이벤트 추적, SELinux 정책 적용까지 — 프로덕션 서버의 보안 수준을 측정하고 강화하는 심화 가이드.',
    category: '보안 설정',
    tags: ['SELinux', 'auditd', 'Lynis', '보안감사', '리눅스보안', '시스템보안'],
    difficulty: 'advanced',
    os_compat: ['CentOS', 'RHEL', 'Ubuntu', 'Debian'],
    author: 'Nodelog',
    content: `## 보안 감사의 3단계 전략

프로덕션 서버 보안은 단일 도구로 해결되지 않습니다. **측정(Lynis) → 추적(auditd) → 강제(SELinux/AppArmor)** 세 단계를 조합해야 합니다.

---

## 1단계 — Lynis 자동 보안 감사

Lynis는 시스템 전체를 스캔해 보안 점수(Hardening Index)를 산출하고 취약 항목을 보고합니다.

### 설치

\`\`\`bash
# RHEL/CentOS
sudo yum install -y lynis

# Ubuntu/Debian
sudo apt install -y lynis

# 최신 버전 (패키지 저장소보다 항상 최신)
git clone https://github.com/CISOfy/lynis /usr/local/lynis
\`\`\`

### 전체 시스템 감사 실행

\`\`\`bash
sudo lynis audit system

# 조용한 모드 (CI 파이프라인용)
sudo lynis audit system --quiet

# 결과를 파일로 저장
sudo lynis audit system --log-file /var/log/lynis.log --report-file /var/log/lynis-report.dat
\`\`\`

### 보고서 해석

\`\`\`bash
# 하드닝 인덱스 확인 (100점 만점)
grep "hardening_index" /var/log/lynis-report.dat

# WARNING 항목만 추출
grep "^warning\[\]" /var/log/lynis-report.dat

# SUGGESTION 항목 추출
grep "^suggestion\[\]" /var/log/lynis-report.dat
\`\`\`

> **목표 점수**: 프로덕션 서버는 최소 75점 이상을 유지하세요. 신규 서버는 90점 이상을 목표로 초기 설정하는 것이 좋습니다.

### 핵심 취약 항목 수동 수정

\`\`\`bash
# AIDE 파일 무결성 모니터링 설치
sudo apt install -y aide
sudo aideinit
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# 주간 무결성 검사 크론 등록
echo "0 3 * * 0 root /usr/bin/aide --check" >> /etc/cron.d/aide-check

# 불필요한 컴파일러 제거 (권장)
sudo apt purge -y gcc make

# USB 마운트 비활성화 (서버용)
echo "install usb-storage /bin/false" > /etc/modprobe.d/disable-usb-storage.conf
\`\`\`

---

## 2단계 — auditd 이벤트 추적

auditd는 커널 레벨에서 파일 접근, 시스템 콜, 권한 변경을 실시간으로 기록합니다.

### 설치 및 활성화

\`\`\`bash
sudo apt install -y auditd audispd-plugins
sudo systemctl enable --now auditd
\`\`\`

### 핵심 감사 규칙 설정

\`\`\`bash
# /etc/audit/rules.d/hardening.rules

# 감사 규칙 잠금 (재부팅 전까지 변경 불가)
-e 2

# 시스템 시간 변경 감시
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b64 -S clock_settime -k time-change

# 사용자·그룹 변경 감시
-w /etc/group -p wa -k identity
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k identity
-w /etc/sudoers.d/ -p wa -k identity

# 네트워크 설정 변경 감시
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k system-locale
-w /etc/hosts -p wa -k system-locale
-w /etc/network/ -p wa -k system-locale

# 로그인·로그아웃 감시
-w /var/log/faillog -p wa -k logins
-w /var/log/lastlog -p wa -k logins

# 권한 상승 감시 (sudo, su)
-w /bin/su -p x -k priv-esc
-w /usr/bin/sudo -p x -k priv-esc
-w /etc/sudoers -p wa -k priv-esc

# 프로세스 실행 감시 (주요 경로)
-a always,exit -F arch=b64 -S execve -k exec
\`\`\`

\`\`\`bash
# 규칙 로드
sudo augenrules --load
sudo systemctl restart auditd

# 현재 규칙 확인
sudo auditctl -l
\`\`\`

### auditd 로그 분석

\`\`\`bash
# 특정 키로 이벤트 검색
sudo ausearch -k identity --interpret

# 실패한 로그인 시도
sudo ausearch -m USER_LOGIN --success no

# 특정 사용자의 명령어 이력
sudo ausearch -ua 1001 -m EXECVE --interpret | grep -A2 "type=EXECVE"

# 지난 1시간 내 권한 상승 시도
sudo ausearch -k priv-esc --start recent --interpret

# 보고서 생성 (일별 요약)
sudo aureport --summary
sudo aureport --login --summary
sudo aureport --failed --summary
\`\`\`

> **알림 연동**: \`audisp-remote\` 플러그인을 사용하면 중앙 SIEM(Splunk, Elastic)으로 이벤트를 실시간 전송할 수 있습니다.

---

## 3단계 — SELinux 정책 적용 (RHEL/CentOS)

SELinux는 프로세스가 접근할 수 있는 파일·포트를 커널 레벨에서 강제합니다. 잘못 설정하면 서비스가 중단되므로 단계적으로 적용합니다.

### 모드 이해

\`\`\`bash
# 현재 모드 확인
getenforce          # Enforcing / Permissive / Disabled

# 상세 상태
sestatus

# 임시로 Permissive 전환 (테스트용, 재부팅 시 원복)
sudo setenforce 0

# 영구 설정 (/etc/selinux/config)
SELINUX=enforcing   # 권장 (프로덕션)
SELINUX=permissive  # 로깅만, 차단 없음 (마이그레이션 단계)
SELINUX=disabled    # 비권장
\`\`\`

### 거부 로그 분석 및 정책 생성

\`\`\`bash
# SELinux 거부 메시지 확인
sudo ausearch -m AVC --interpret | tail -30
sudo grep "denied" /var/log/audit/audit.log | tail -20

# audit2why로 원인 설명
sudo ausearch -m AVC | audit2why

# audit2allow로 맞춤 정책 자동 생성
sudo ausearch -m AVC | audit2allow -M my_custom_policy
sudo semodule -i my_custom_policy.pp
\`\`\`

### 실전 — Nginx SELinux 설정

\`\`\`bash
# Nginx가 비표준 포트(8080)를 Listen하도록 허용
sudo semanage port -a -t http_port_t -p tcp 8080

# 현재 http 허용 포트 목록
sudo semanage port -l | grep http_port_t

# Nginx가 upstream 네트워크에 연결하도록 허용
sudo setsebool -P httpd_can_network_connect 1

# Nginx가 NFS를 읽도록 허용
sudo setsebool -P httpd_use_nfs 1

# 커스텀 웹 루트 디렉터리에 컨텍스트 적용
sudo semanage fcontext -a -t httpd_sys_content_t "/data/www(/.*)?"
sudo restorecon -Rv /data/www
\`\`\`

### AppArmor (Ubuntu 대안)

\`\`\`bash
# 프로파일 상태 확인
sudo aa-status

# 특정 프로그램 프로파일 활성화
sudo aa-enforce /etc/apparmor.d/usr.sbin.nginx

# 위반 로그 모니터링
sudo journalctl -f | grep apparmor

# complain 모드로 전환 (차단 없이 로깅만)
sudo aa-complain /etc/apparmor.d/usr.sbin.nginx
\`\`\`

---

## 자동화 — 정기 보안 감사 스크립트

\`\`\`bash
#!/bin/bash
# /usr/local/bin/security-audit.sh

REPORT_DIR="/var/log/security-audit"
DATE=$(date +%Y%m%d)
mkdir -p "$REPORT_DIR"

echo "=== Security Audit: $DATE ===" > "$REPORT_DIR/$DATE.txt"

# Lynis 스캔
lynis audit system --quiet >> "$REPORT_DIR/$DATE.txt" 2>&1

# 실패 로그인 요약
echo "--- Failed Logins ---" >> "$REPORT_DIR/$DATE.txt"
aureport --failed --login >> "$REPORT_DIR/$DATE.txt"

# SUID 파일 변경 감지
find / -perm /4000 -type f 2>/dev/null | sort > /tmp/suid_current.txt
if [ -f /tmp/suid_baseline.txt ]; then
  diff /tmp/suid_baseline.txt /tmp/suid_current.txt | grep "^>" >> "$REPORT_DIR/$DATE.txt"
fi
cp /tmp/suid_current.txt /tmp/suid_baseline.txt

# 메일 발송 (필요 시)
# mail -s "Security Audit $DATE" admin@example.com < "$REPORT_DIR/$DATE.txt"
\`\`\`

\`\`\`bash
# 매일 새벽 2시 실행
echo "0 2 * * * root /usr/local/bin/security-audit.sh" > /etc/cron.d/security-audit
chmod 644 /etc/cron.d/security-audit
\`\`\``,
  },

  // ── 클라우드 ──────────────────────────────────────────────────────
  {
    title: 'Amazon EKS 실전 — 클러스터 구성, 배포 전략, 운영 패턴',
    slug: 'aws-eks-production-guide',
    summary: 'eksctl로 EKS 클러스터를 구성하고, ALB Ingress·HPA·Karpenter를 적용해 프로덕션 수준의 Kubernetes 워크로드를 운영하는 심화 가이드.',
    category: '클라우드',
    tags: ['EKS', 'Kubernetes', 'AWS', 'Karpenter', 'HPA', 'ALB', 'DevOps'],
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'macOS'],
    author: 'Nodelog',
    content: `## EKS 프로덕션 아키텍처 개요

EKS(Elastic Kubernetes Service)는 AWS 관리형 컨트롤 플레인 위에서 Kubernetes를 운영합니다. 프로덕션에서는 **Multi-AZ 노드 그룹 + Karpenter 오토스케일링 + ALB Ingress** 조합이 표준입니다.

---

## 사전 준비 — 도구 설치

\`\`\`bash
# eksctl
curl -sL "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin

# helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 버전 확인
eksctl version && kubectl version --client && helm version
\`\`\`

---

## 클러스터 생성 — eksctl 선언형 설정

\`\`\`yaml
# cluster.yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: prod-cluster
  region: ap-northeast-2
  version: "1.29"

iam:
  withOIDC: true  # IRSA(IAM Roles for Service Accounts) 활성화

managedNodeGroups:
  - name: system
    instanceType: m6i.large
    minSize: 2
    maxSize: 4
    desiredCapacity: 2
    availabilityZones: [ap-northeast-2a, ap-northeast-2b, ap-northeast-2c]
    labels:
      role: system
    taints:
      - key: CriticalAddonsOnly
        value: "true"
        effect: NoSchedule
    iam:
      attachPolicyARNs:
        - arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
        - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
        - arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy

addons:
  - name: vpc-cni
    version: latest
  - name: coredns
    version: latest
  - name: kube-proxy
    version: latest
  - name: aws-ebs-csi-driver
    version: latest
    wellKnownPolicies:
      ebsCSIController: true
\`\`\`

\`\`\`bash
eksctl create cluster -f cluster.yaml
# kubeconfig 자동 업데이트됨
kubectl get nodes
\`\`\`

---

## Karpenter — 지능형 노드 오토스케일링

Cluster Autoscaler 대신 Karpenter를 사용하면 미사용 노드를 빠르게 정리하고 비용을 절감합니다.

### Karpenter 설치

\`\`\`bash
export CLUSTER_NAME=prod-cluster
export AWS_REGION=ap-northeast-2
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# IRSA 생성
eksctl create iamserviceaccount \\
  --name karpenter \\
  --namespace karpenter \\
  --cluster $CLUSTER_NAME \\
  --attach-policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/KarpenterControllerPolicy \\
  --approve

# Helm으로 설치
helm upgrade --install karpenter oci://public.ecr.aws/karpenter/karpenter \\
  --version v0.37.0 \\
  --namespace karpenter --create-namespace \\
  --set settings.clusterName=$CLUSTER_NAME \\
  --set settings.interruptionQueue=$CLUSTER_NAME \\
  --wait
\`\`\`

### NodePool · NodeClass 정의

\`\`\`yaml
# karpenter-nodepool.yaml
apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      nodeClassRef:
        name: default
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand", "spot"]
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["m6i.large", "m6i.xlarge", "m6a.large", "m6a.xlarge"]
        - key: topology.kubernetes.io/zone
          operator: In
          values: ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]
  limits:
    cpu: 200
    memory: 400Gi
  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 30s
---
apiVersion: karpenter.k8s.aws/v1beta1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2
  role: KarpenterNodeRole-prod-cluster
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: prod-cluster
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: prod-cluster
  blockDeviceMappings:
    - deviceName: /dev/xvda
      ebs:
        volumeSize: 50Gi
        volumeType: gp3
        encrypted: true
\`\`\`

\`\`\`bash
kubectl apply -f karpenter-nodepool.yaml
\`\`\`

---

## ALB Ingress Controller + HTTPS 설정

\`\`\`bash
# AWS Load Balancer Controller 설치
helm repo add eks https://aws.github.io/eks-charts && helm repo update

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \\
  -n kube-system \\
  --set clusterName=$CLUSTER_NAME \\
  --set serviceAccount.create=false \\
  --set serviceAccount.name=aws-load-balancer-controller
\`\`\`

\`\`\`yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:ap-northeast-2:ACCOUNT:certificate/CERT-ID
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
spec:
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
\`\`\`

---

## HPA — CPU/메모리 기반 Pod 오토스케일링

\`\`\`yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 5분간 관망 후 스케일 다운
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
\`\`\`

---

## 운영 — 핵심 명령어 모음

\`\`\`bash
# 클러스터 전체 리소스 사용량
kubectl top nodes
kubectl top pods -A

# Karpenter 노드 현황
kubectl get nodeclaims
kubectl get nodepools

# HPA 상태 모니터링
kubectl get hpa -w

# 롤링 업데이트 (무중단)
kubectl set image deployment/api app=my-image:v2
kubectl rollout status deployment/api

# 롤백
kubectl rollout undo deployment/api
kubectl rollout history deployment/api --revision=3

# 강제 종료 없이 파드 재스케줄
kubectl drain node-id --ignore-daemonsets --delete-emptydir-data

# 비용 최적화: Spot 중단 시뮬레이션
kubectl taint nodes NODE_NAME karpenter.sh/disruption:NoSchedule-
\`\`\`

---

## 보안 강화 — IRSA와 NetworkPolicy

\`\`\`bash
# IRSA: Pod에 최소 권한 IAM 역할 부여
eksctl create iamserviceaccount \\
  --name s3-reader \\
  --namespace production \\
  --cluster $CLUSTER_NAME \\
  --attach-policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess \\
  --approve
\`\`\`

\`\`\`yaml
# networkpolicy.yaml — 기본 차단 후 필요한 것만 허용
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-ingress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - port: 8080
\`\`\``,
  },

  // ── 데이터베이스 ──────────────────────────────────────────────────
  {
    title: 'PostgreSQL 복제 · WAL · PITR — 프로덕션 HA 구성 완전 가이드',
    slug: 'postgresql-replication-wal-pitr',
    summary: 'Streaming Replication으로 고가용성 구성, WAL 아카이빙으로 특정 시점 복구(PITR)를 구현하는 PostgreSQL 운영 심화 가이드.',
    category: '데이터베이스',
    tags: ['PostgreSQL', 'Streaming Replication', 'WAL', 'PITR', 'HA', '고가용성', 'DBA'],
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
    author: 'Nodelog',
    content: `## PostgreSQL 고가용성 아키텍처

프로덕션 PostgreSQL은 **Primary + Standby Streaming Replication** 구성이 기본입니다. 여기에 WAL 아카이빙을 추가하면 분 단위 PITR(Point-in-Time Recovery)이 가능해집니다.

\`\`\`
[Primary]  ──── WAL Stream ────►  [Standby (Hot Standby)]
    │
    └── WAL Archive ──► [S3 / NFS]  ◄── PITR 복구 시 사용
\`\`\`

---

## 1. Primary 서버 설정

### postgresql.conf 핵심 파라미터

\`\`\`ini
# /etc/postgresql/16/main/postgresql.conf

# 복제 설정
wal_level = replica              # replica 또는 logical
max_wal_senders = 5              # 최대 Standby 연결 수
wal_keep_size = 1GB              # WAL 보관 크기
hot_standby = on

# WAL 아카이빙 (PITR용)
archive_mode = on
archive_command = 'aws s3 cp %p s3://my-wal-bucket/archive/%f'
archive_timeout = 60             # 최대 60초마다 강제 아카이빙

# 성능 튜닝
wal_compression = zstd
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# 모니터링
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
\`\`\`

### pg_hba.conf — 복제 연결 허용

\`\`\`conf
# /etc/postgresql/16/main/pg_hba.conf
# TYPE  DATABASE    USER        ADDRESS         METHOD
host    replication replicator  10.0.1.0/24     scram-sha-256
\`\`\`

\`\`\`bash
# 복제 전용 사용자 생성
sudo -u postgres psql -c "
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'strong-password';
"

sudo systemctl reload postgresql
\`\`\`

---

## 2. Standby 서버 초기 구성

\`\`\`bash
# Standby에서: Primary의 베이스 백업으로 데이터 디렉터리 초기화
sudo -u postgres pg_basebackup \\
  -h 10.0.1.10 \\            # Primary IP
  -U replicator \\
  -D /var/lib/postgresql/16/main \\
  -Fp -Xs -P -R              # -R: recovery 설정 자동 생성

# -Fp: plain format
# -Xs: WAL streaming 포함
# -P: 진행률 표시
# -R: standby.signal + postgresql.auto.conf 자동 생성
\`\`\`

\`\`\`ini
# postgresql.auto.conf (pg_basebackup -R 이 자동 생성)
primary_conninfo = 'host=10.0.1.10 port=5432 user=replicator password=strong-password application_name=standby1'
\`\`\`

\`\`\`bash
# Standby 시작
sudo systemctl start postgresql

# 복제 상태 확인 (Primary에서)
sudo -u postgres psql -c "SELECT * FROM pg_stat_replication;"
\`\`\`

---

## 3. 복제 지연 모니터링

\`\`\`sql
-- Primary에서: 각 Standby의 WAL 지연 확인
SELECT
  application_name,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS replication_lag,
  write_lag,
  flush_lag,
  replay_lag
FROM pg_stat_replication;

-- Standby에서: 수신 중인 WAL 상태
SELECT
  status,
  receive_start_lsn,
  received_tli,
  pg_size_pretty(pg_wal_lsn_diff(pg_last_wal_receive_lsn(), pg_last_wal_replay_lsn())) AS replay_lag
FROM pg_stat_wal_receiver;
\`\`\`

> **알림 기준**: \`replay_lag\`이 30초를 초과하면 알림을 발생시키세요. 지속적인 지연은 Standby의 I/O 병목 또는 네트워크 문제를 의미합니다.

---

## 4. Failover — Standby를 Primary로 승격

\`\`\`bash
# 방법 1: pg_ctl promote (즉시 승격)
sudo -u postgres pg_ctl promote -D /var/lib/postgresql/16/main

# 방법 2: 트리거 파일 (권장 — 스크립트 자동화 용이)
sudo -u postgres touch /tmp/failover.trigger
# postgresql.conf에 설정: promote_trigger_file = '/tmp/failover.trigger'

# 승격 확인
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
# 결과: f (false) → Primary로 전환됨
\`\`\`

### 구 Primary를 새 Standby로 재편입 (pg_rewind)

\`\`\`bash
# 구 Primary(장애 복구 후)에서
sudo systemctl stop postgresql

sudo -u postgres pg_rewind \\
  --target-pgdata=/var/lib/postgresql/16/main \\
  --source-server="host=10.0.1.20 user=replicator dbname=postgres"

# standby.signal 생성
sudo -u postgres touch /var/lib/postgresql/16/main/standby.signal

# primary_conninfo를 새 Primary(10.0.1.20)로 업데이트
sudo -u postgres psql -c "
ALTER SYSTEM SET primary_conninfo = 'host=10.0.1.20 port=5432 user=replicator password=strong-password';
"

sudo systemctl start postgresql
\`\`\`

---

## 5. PITR — 특정 시점 복구

WAL 아카이빙이 활성화된 경우, 아카이브된 WAL을 재생해 임의의 시점으로 복구할 수 있습니다.

\`\`\`bash
# 복구 서버에서: 최신 베이스 백업 다운로드
aws s3 cp s3://my-wal-bucket/basebackup/latest.tar.gz /tmp/
sudo -u postgres tar -xzf /tmp/latest.tar.gz -C /var/lib/postgresql/16/main

# recovery.conf 역할: postgresql.conf에 작성 (PG12 이후)
\`\`\`

\`\`\`ini
# postgresql.conf (복구 서버)

restore_command = 'aws s3 cp s3://my-wal-bucket/archive/%f %p'

# 목표 시점 지정 (실수로 DROP TABLE한 직전 시각)
recovery_target_time = '2026-05-19 14:30:00 KST'
recovery_target_action = 'promote'   # 복구 완료 후 자동 승격
\`\`\`

\`\`\`bash
# standby.signal 생성 (복구 모드로 시작)
sudo -u postgres touch /var/lib/postgresql/16/main/standby.signal

sudo systemctl start postgresql

# 복구 진행 로그 실시간 확인
sudo journalctl -u postgresql -f | grep -E "recovery|redo|consistent"

# 복구 완료 확인
sudo -u postgres psql -c "SELECT pg_is_in_recovery();"
\`\`\`

---

## 6. 자동 베이스 백업 스크립트

\`\`\`bash
#!/bin/bash
# /usr/local/bin/pg-basebackup.sh

S3_BUCKET="s3://my-wal-bucket/basebackup"
DATE=$(date +%Y%m%d-%H%M)
BACKUP_DIR="/tmp/pg-backup-$DATE"

# 베이스 백업 생성
sudo -u postgres pg_basebackup \\
  -D "$BACKUP_DIR" \\
  -Ft -z \\        # tar + gzip
  -Xs \\           # WAL streaming 포함
  -P

# S3 업로드
aws s3 cp "$BACKUP_DIR/base.tar.gz" "$S3_BUCKET/$DATE/base.tar.gz"
aws s3 cp "$BACKUP_DIR/pg_wal.tar.gz" "$S3_BUCKET/$DATE/pg_wal.tar.gz"

# 로컬 정리
rm -rf "$BACKUP_DIR"

# 30일 이상 된 S3 백업 삭제
aws s3 ls "$S3_BUCKET/" | awk '{print $4}' | while read dir; do
  dir_date=$(echo "$dir" | cut -d'-' -f1)
  if [ "$(date -d "$dir_date" +%s 2>/dev/null)" -lt "$(date -d '30 days ago' +%s)" ]; then
    aws s3 rm "$S3_BUCKET/$dir" --recursive
  fi
done

echo "Backup completed: $DATE"
\`\`\`

\`\`\`bash
# 매일 새벽 1시 실행
echo "0 1 * * * root /usr/local/bin/pg-basebackup.sh >> /var/log/pg-backup.log 2>&1" > /etc/cron.d/pg-backup
\`\`\``,
  },

  // ── 네트워킹 / 서버 ───────────────────────────────────────────────
  {
    title: 'Nginx 고급 운영 — 로드밸런싱 · 캐싱 · Rate Limiting · 보안 헤더',
    slug: 'nginx-advanced-load-balancing-caching-security',
    summary: 'upstream 로드밸런싱 전략, proxy_cache 콘텐츠 캐싱, limit_req rate limiting, 보안 헤더까지 — 프로덕션 Nginx를 완전히 제어하는 심화 가이드.',
    category: '네트워킹 / 서버',
    tags: ['Nginx', '로드밸런싱', '캐싱', 'rate-limiting', '보안헤더', '웹서버', '성능최적화'],
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
    author: 'Nodelog',
    content: `## 프로덕션 Nginx 설정 구조

단순 리버스 프록시를 넘어, Nginx를 로드밸런서·캐시서버·WAF 전방 배치 레이어로 활용하는 패턴을 다룹니다.

---

## 1. upstream 로드밸런싱 전략

### 기본 구성 (Round Robin)

\`\`\`nginx
http {
  upstream app_servers {
    least_conn;          # 최소 연결 수 기준 분배 (Round Robin 대신 권장)

    server 10.0.1.10:8080 weight=3;   # 가중치: 트래픽 30%
    server 10.0.1.11:8080 weight=2;
    server 10.0.1.12:8080 weight=1;
    server 10.0.1.13:8080 backup;     # 나머지 전부 다운 시 사용

    keepalive 32;        # upstream keepalive 연결 풀
    keepalive_timeout 60s;
  }

  server {
    listen 443 ssl http2;
    server_name api.example.com;

    location / {
      proxy_pass http://app_servers;
      proxy_http_version 1.1;
      proxy_set_header Connection "";         # keepalive 유지
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
\`\`\`

### 세션 지속성 (Sticky Session)

\`\`\`nginx
upstream app_servers {
  ip_hash;              # 동일 클라이언트 IP는 항상 같은 서버로
  server 10.0.1.10:8080;
  server 10.0.1.11:8080;
}
\`\`\`

### 헬스체크 (Nginx Plus 없이 수동 구현)

\`\`\`nginx
upstream app_servers {
  server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
  server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
}
# max_fails: 30초 내 3번 실패 시 해당 서버 일시 제외
\`\`\`

---

## 2. proxy_cache — 콘텐츠 캐싱

\`\`\`nginx
http {
  # 캐시 저장소 정의 (nginx.conf 최상단 http 블록)
  proxy_cache_path /var/cache/nginx
    levels=1:2                    # 디렉터리 계층 구조
    keys_zone=app_cache:50m       # 메모리 내 키 저장소 50MB
    max_size=10g                  # 최대 디스크 사용량
    inactive=60m                  # 60분간 미접근 시 삭제
    use_temp_path=off;

  server {
    location / {
      proxy_pass http://app_servers;

      proxy_cache app_cache;
      proxy_cache_key "$scheme$request_method$host$request_uri";
      proxy_cache_valid 200 302 10m;   # 200/302 응답 10분 캐시
      proxy_cache_valid 404      1m;
      proxy_cache_use_stale error timeout updating http_500 http_502 http_503;
      proxy_cache_lock on;             # 동일 키 중복 요청 방지 (thundering herd)
      proxy_cache_lock_timeout 5s;

      # 캐시 상태 헤더 노출 (디버깅용)
      add_header X-Cache-Status $upstream_cache_status;
    }

    # 캐시 우회: 특정 조건에서
    location /api/user {
      proxy_pass http://app_servers;
      proxy_cache_bypass $cookie_session;  # 세션 쿠키 있으면 캐시 건너뜀
      proxy_no_cache $cookie_session;
    }

    # 캐시 퍼지 (내부에서만 허용)
    location ~ /purge(/.*) {
      allow 127.0.0.1;
      deny all;
      proxy_cache_purge app_cache "$scheme$request_method$host$1";
    }
  }
}
\`\`\`

\`\`\`bash
# 캐시 상태 확인
curl -I https://example.com/static/logo.png | grep X-Cache-Status
# HIT / MISS / BYPASS / UPDATING

# 캐시 디렉터리 크기 확인
du -sh /var/cache/nginx

# 캐시 전체 초기화
sudo rm -rf /var/cache/nginx/*
sudo nginx -s reload
\`\`\`

---

## 3. Rate Limiting — DDoS / 무차별 대입 방어

\`\`\`nginx
http {
  # 요청 속도 제한 존 정의
  limit_req_zone $binary_remote_addr zone=api_limit:20m rate=10r/s;
  limit_req_zone $binary_remote_addr zone=login_limit:10m rate=3r/m;
  limit_req_zone $http_x_api_key    zone=key_limit:10m  rate=100r/s;

  # 연결 수 제한 존
  limit_conn_zone $binary_remote_addr zone=conn_limit:20m;

  server {
    # API 엔드포인트: 초당 10req, 버스트 20개 허용
    location /api/ {
      limit_req zone=api_limit burst=20 nodelay;
      limit_conn conn_limit 20;
      limit_req_status 429;

      proxy_pass http://app_servers;
    }

    # 로그인: 분당 3회, 초과 시 큐잉 (nodelay 없음)
    location /auth/login {
      limit_req zone=login_limit burst=5;
      limit_req_status 429;
      proxy_pass http://app_servers;
    }

    # Rate Limit 초과 응답 커스터마이징
    error_page 429 /rate_limit.json;
    location = /rate_limit.json {
      internal;
      default_type application/json;
      return 429 '{"error":"Too Many Requests","retry_after":60}';
    }
  }
}
\`\`\`

---

## 4. 보안 헤더 및 SSL 강화

\`\`\`nginx
http {
  # TLS 설정
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers off;
  ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';

  # HSTS (Strict-Transport-Security)
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

  # DH 파라미터 생성 및 적용
  ssl_dhparam /etc/nginx/dhparam.pem;    # openssl dhparam -out /etc/nginx/dhparam.pem 4096

  # OCSP Stapling
  ssl_stapling on;
  ssl_stapling_verify on;
  resolver 8.8.8.8 8.8.4.4 valid=300s;

  server {
    # 보안 헤더 일괄 설정
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.example.com; img-src 'self' data: cdn.example.com; style-src 'self' 'unsafe-inline';" always;

    # 서버 정보 숨기기
    server_tokens off;

    # HTTP → HTTPS 리다이렉트
    if ($scheme = http) {
      return 301 https://$host$request_uri;
    }
  }
}
\`\`\`

---

## 5. 성능 튜닝 — worker 및 커넥션 최적화

\`\`\`nginx
# /etc/nginx/nginx.conf

user nginx;
worker_processes auto;          # CPU 코어 수에 맞게 자동 설정
worker_rlimit_nofile 65535;     # 파일 디스크립터 한도

events {
  worker_connections 4096;      # worker당 최대 연결 수
  use epoll;                    # Linux 최적화 이벤트 방식
  multi_accept on;              # 한 번에 여러 연결 수락
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;

  keepalive_timeout 65;
  keepalive_requests 1000;

  # Gzip 압축
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss;
  gzip_min_length 1024;

  # 버퍼 튜닝
  proxy_buffer_size 128k;
  proxy_buffers 4 256k;
  proxy_busy_buffers_size 256k;

  # 타임아웃
  proxy_connect_timeout 5s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
}
\`\`\`

\`\`\`bash
# 설정 검증
sudo nginx -t

# 무중단 설정 리로드
sudo nginx -s reload

# 실시간 연결 통계
sudo nginx -V 2>&1 | grep with-http_stub_status
# status 페이지 확인
curl http://localhost/nginx_status
\`\`\``,
  },

  // ── Docker / 컨테이너 ─────────────────────────────────────────────
  {
    title: '컨테이너 보안 심화 — 이미지 스캔 · 런타임 보안 · 최소 권한 원칙',
    slug: 'container-security-advanced',
    summary: 'Trivy 이미지 취약점 스캔, Seccomp·AppArmor 런타임 격리, 루트리스 컨테이너, Docker Content Trust까지 — 프로덕션 컨테이너 보안의 모든 레이어를 다룹니다.',
    category: 'Docker / 컨테이너',
    tags: ['컨테이너보안', 'Trivy', 'Seccomp', 'AppArmor', 'rootless', 'Docker', '보안'],
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'Debian', 'CentOS', 'RHEL'],
    author: 'Nodelog',
    content: `## 컨테이너 보안의 4개 레이어

컨테이너 보안은 **이미지 → 런타임 → 오케스트레이터 → 네트워크** 4개 레이어를 모두 잠가야 합니다. 하나라도 열려 있으면 전체가 노출됩니다.

---

## 1. 이미지 보안 — Trivy 취약점 스캔

### Trivy 설치 및 기본 스캔

\`\`\`bash
# 설치 (Ubuntu/Debian)
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 이미지 스캔
trivy image nginx:latest

# CRITICAL/HIGH만 표시
trivy image --severity CRITICAL,HIGH nginx:latest

# JSON 출력 (CI 파이프라인 연동)
trivy image --format json --output result.json nginx:latest

# 로컬 Dockerfile 기반 스캔 (빌드 전)
trivy config Dockerfile

# 파일시스템 스캔 (코드 저장소)
trivy fs --severity HIGH,CRITICAL .
\`\`\`

### GitHub Actions CI 통합

\`\`\`yaml
# .github/workflows/security.yml
name: Container Security Scan

on: [push, pull_request]

jobs:
  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t app:\${{ github.sha }} .

      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:\${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
          severity: CRITICAL,HIGH
          exit-code: 1          # CRITICAL 발견 시 빌드 실패

      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-results.sarif
\`\`\`

---

## 2. 최소 권한 Dockerfile

\`\`\`dockerfile
# ❌ 안티패턴
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y curl python3
COPY . /app
CMD ["python3", "/app/server.py"]
# root로 실행, 불필요한 패키지 포함

# ✅ 프로덕션 패턴
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
# 전용 비특권 사용자 생성
RUN groupadd -r appuser && useradd -r -g appuser -s /sbin/nologin appuser

WORKDIR /app
COPY --from=builder /install /usr/local
COPY --chown=appuser:appuser src/ .

# 쓰기 권한 제거
RUN chmod -R 555 /app

USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:8080/healthz || exit 1
CMD ["python3", "server.py"]
\`\`\`

### 이미지 크기 최소화

\`\`\`dockerfile
# Distroless: 쉘·패키지매니저 없는 최소 이미지
FROM gcr.io/distroless/python3-debian12
COPY --from=builder /app /app
WORKDIR /app
USER nonroot:nonroot
CMD ["server.py"]

# Alpine 기반 (Go 바이너리)
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git
WORKDIR /app
COPY go.* .
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o server .

FROM scratch               # 빈 이미지: 쉘, 라이브러리 전혀 없음
COPY --from=builder /app/server /server
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
USER 65534:65534           # nobody
ENTRYPOINT ["/server"]
\`\`\`

---

## 3. 런타임 보안 — Seccomp 프로파일

Seccomp은 컨테이너가 호출할 수 있는 시스템 콜을 허용 목록 방식으로 제한합니다.

\`\`\`json
// seccomp-profile.json (최소 허용 프로파일)
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": [
        "read", "write", "open", "close", "stat", "fstat",
        "mmap", "mprotect", "munmap", "brk",
        "rt_sigaction", "rt_sigprocmask", "rt_sigreturn",
        "ioctl", "access", "pipe", "select", "sched_yield",
        "mremap", "msync", "mincore", "madvise",
        "dup", "dup2", "pause", "nanosleep", "getitimer",
        "alarm", "setitimer", "getpid", "sendfile",
        "socket", "connect", "accept", "sendto", "recvfrom",
        "sendmsg", "recvmsg", "shutdown", "bind", "listen",
        "getsockname", "getpeername", "socketpair",
        "setsockopt", "getsockopt", "clone", "fork",
        "execve", "exit", "wait4", "kill", "uname",
        "fcntl", "flock", "fsync", "fdatasync", "truncate",
        "ftruncate", "getcwd", "chdir", "rename", "mkdir",
        "rmdir", "unlink", "symlink", "readlink", "chmod",
        "chown", "umask", "gettimeofday", "getrlimit",
        "getrusage", "sysinfo", "times", "getuid", "getgid",
        "setuid", "setgid", "geteuid", "getegid",
        "setpgid", "getppid", "getpgrp", "setsid",
        "getgroups", "arch_prctl", "futex", "set_tid_address",
        "restart_syscall", "exit_group", "epoll_wait",
        "epoll_ctl", "tgkill", "openat", "newfstatat",
        "set_robust_list", "get_robust_list", "epoll_create1",
        "accept4", "eventfd2", "pipe2", "prlimit64"
      ],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
\`\`\`

\`\`\`bash
# Seccomp 프로파일 적용
docker run --security-opt seccomp=seccomp-profile.json my-app

# 기본 Docker 프로파일로 실행 (권장)
docker run --security-opt seccomp=default my-app

# 프로파일 없이 실행하면 위험한 syscall 허용됨
# 절대 --security-opt seccomp=unconfined 사용하지 마세요
\`\`\`

---

## 4. AppArmor 프로파일 적용

\`\`\`bash
# AppArmor 프로파일 생성
sudo tee /etc/apparmor.d/docker-app << 'EOF'
#include <tunables/global>

profile docker-app flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  network inet tcp,
  network inet udp,

  file,
  deny /proc/sys/kernel/** w,
  deny /sys/firmware/** rwklx,

  # 특정 민감 경로 차단
  deny /etc/passwd w,
  deny /etc/shadow rwklx,
  deny /root/** rwklx,
}
EOF

sudo apparmor_parser -r /etc/apparmor.d/docker-app

# Docker 컨테이너에 AppArmor 프로파일 적용
docker run --security-opt apparmor=docker-app my-app
\`\`\`

---

## 5. 루트리스(Rootless) Docker

루트리스 모드에서는 Docker 데몬 자체가 일반 사용자 권한으로 실행됩니다.

\`\`\`bash
# 루트리스 Docker 설치
curl -fsSL https://get.docker.com/rootless | sh

# 환경 변수 설정 (~/.bashrc에 추가)
export PATH=/home/$USER/bin:$PATH
export DOCKER_HOST=unix:///run/user/$(id -u)/docker.sock

# 부팅 시 자동 시작
systemctl --user enable docker
sudo loginctl enable-linger $USER

# 확인
docker info | grep "rootless"
\`\`\`

---

## 6. Docker Content Trust — 이미지 서명 검증

\`\`\`bash
# Content Trust 활성화 (서명된 이미지만 pull/push 허용)
export DOCKER_CONTENT_TRUST=1

# 이미지 서명 후 push
docker trust key generate my-signing-key
docker trust signer add --key my-signing-key.pub myuser my-registry.com/myapp
docker push my-registry.com/myapp:1.0   # 자동으로 서명

# 서명 정보 확인
docker trust inspect --pretty my-registry.com/myapp:1.0

# 서명되지 않은 이미지는 pull 거부됨
docker pull my-registry.com/myapp:untagged   # Error: no trust data
\`\`\`

---

## 7. 런타임 이상 탐지 — Falco

\`\`\`bash
# Falco 설치
curl -fsSL https://falco.org/repo/falcosecurity-packages.asc | sudo gpg --dearmor -o /usr/share/keyrings/falco-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/falco-archive-keyring.gpg] https://download.falco.org/packages/deb stable main" | sudo tee /etc/apt/sources.list.d/falcosecurity.list
sudo apt update && sudo apt install -y falco
\`\`\`

\`\`\`yaml
# /etc/falco/falco_rules.local.yaml — 커스텀 탐지 룰
- rule: Container Shell Spawned
  desc: 실행 중인 컨테이너에서 쉘이 시작됨 (잠재적 침해 신호)
  condition: >
    spawned_process and container and
    proc.name in (bash, sh, zsh, ksh) and
    not proc.pname in (containerd-shim, runc)
  output: >
    Shell spawned in container (user=%user.name cmd=%proc.cmdline
    container=%container.name image=%container.image.repository)
  priority: WARNING
  tags: [container, shell, mitre_execution]

- rule: Write to /etc in Container
  desc: 컨테이너 내 /etc 디렉터리 쓰기 시도
  condition: >
    open_write and container and
    fd.name startswith /etc
  output: >
    Write to /etc in container (file=%fd.name container=%container.name)
  priority: ERROR
\`\`\`

\`\`\`bash
sudo systemctl enable --now falco

# 실시간 알림 확인
sudo journalctl -u falco -f
\`\`\``,
  },

  // ── Git / CI·CD ───────────────────────────────────────────────────
  {
    title: 'GitOps 실전 — ArgoCD로 Kubernetes 배포 완전 자동화',
    slug: 'gitops-argocd-kubernetes-deployment',
    summary: 'GitOps 원칙에 따라 ArgoCD를 구성하고, ApplicationSet·Sync Wave·Rollout을 활용해 멀티 환경 Kubernetes 배포를 코드로 완전히 자동화하는 심화 가이드.',
    category: 'Git / CI·CD',
    tags: ['GitOps', 'ArgoCD', 'Kubernetes', 'ApplicationSet', 'Rollout', 'CI/CD', 'DevOps'],
    difficulty: 'advanced',
    os_compat: ['Ubuntu', 'macOS'],
    author: 'Nodelog',
    content: `## GitOps란

GitOps는 **Git 저장소를 인프라/애플리케이션의 단일 진실 원천(Single Source of Truth)**으로 삼고, 저장소 상태와 클러스터 상태를 자동으로 일치시키는 운영 패러다임입니다.

\`\`\`
개발자 → git push → GitHub ──► ArgoCD(감지) ──► Kubernetes 클러스터
                                    ↑ 지속적으로 상태 동기화
\`\`\`

---

## 1. ArgoCD 설치

\`\`\`bash
kubectl create namespace argocd

kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# ArgoCD CLI 설치
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && sudo mv argocd /usr/local/bin

# 초기 admin 비밀번호 확인
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# 포트 포워딩으로 UI 접근
kubectl port-forward svc/argocd-server -n argocd 8080:443

# CLI 로그인
argocd login localhost:8080 --username admin --password <password> --insecure
\`\`\`

### Ingress로 외부 노출 (프로덕션)

\`\`\`yaml
# argocd-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/ssl-passthrough: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "HTTPS"
spec:
  ingressClassName: nginx
  rules:
    - host: argocd.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 443
\`\`\`

---

## 2. 저장소 구조 설계

GitOps에서는 **앱 코드 저장소**와 **인프라/배포 저장소**를 분리하는 것이 표준입니다.

\`\`\`
infra-repo/
├── apps/
│   ├── base/                    # 공통 기본 설정
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── kustomization.yaml
│   ├── overlays/
│   │   ├── dev/                 # 개발 환경 오버레이
│   │   │   ├── kustomization.yaml
│   │   │   └── patch-replicas.yaml
│   │   ├── staging/
│   │   └── production/
└── argocd/
    ├── projects/
    └── applications/
\`\`\`

### Kustomize 기반 멀티 환경 오버레이

\`\`\`yaml
# apps/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: my-registry.com/api:latest
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
---
# apps/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
patches:
  - path: patch-replicas.yaml
  - path: patch-resources.yaml
images:
  - name: my-registry.com/api
    newTag: v1.5.0    # 프로덕션은 고정 태그 사용
---
# apps/overlays/production/patch-replicas.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 5
\`\`\`

---

## 3. ApplicationSet — 멀티 환경 자동 배포

ApplicationSet은 하나의 템플릿으로 여러 환경의 Application을 자동 생성합니다.

\`\`\`yaml
# argocd/applicationset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: api-appset
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - env: dev
            cluster: https://kubernetes.default.svc
            namespace: dev
            revision: main
          - env: staging
            cluster: https://staging-cluster.example.com
            namespace: staging
            revision: main
          - env: production
            cluster: https://prod-cluster.example.com
            namespace: production
            revision: v1.5.0   # 프로덕션은 태그로 고정
  template:
    metadata:
      name: api-{{env}}
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/infra-repo
        targetRevision: "{{revision}}"
        path: apps/overlays/{{env}}
      destination:
        server: "{{cluster}}"
        namespace: "{{namespace}}"
      syncPolicy:
        automated:
          prune: true           # Git에서 삭제된 리소스 자동 제거
          selfHeal: true        # 클러스터 수동 변경 자동 원복
        syncOptions:
          - CreateNamespace=true
          - ServerSideApply=true
\`\`\`

\`\`\`bash
kubectl apply -f argocd/applicationset.yaml

# 생성된 Application 목록 확인
argocd app list

# 동기화 상태 확인
argocd app get api-production
\`\`\`

---

## 4. Sync Wave — 배포 순서 제어

Sync Wave를 사용하면 ConfigMap → DB 마이그레이션 → 애플리케이션 순서로 배포를 순차 실행할 수 있습니다.

\`\`\`yaml
# 1단계: ConfigMap 먼저 생성
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  annotations:
    argocd.argoproj.io/sync-wave: "-2"   # 음수: 가장 먼저 실행
---
# 2단계: DB 마이그레이션 Job
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  annotations:
    argocd.argoproj.io/sync-wave: "-1"
    argocd.argoproj.io/hook: Sync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: my-registry.com/api:v1.5.0
          command: ["python", "manage.py", "migrate"]
---
# 3단계: 실제 애플리케이션 (기본값: wave 0)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  annotations:
    argocd.argoproj.io/sync-wave: "0"
\`\`\`

---

## 5. Argo Rollouts — 카나리 · 블루그린 배포

\`\`\`bash
# Argo Rollouts 설치
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# kubectl 플러그인
curl -LO https://github.com/argoproj/argo-rollouts/releases/latest/download/kubectl-argo-rollouts-linux-amd64
chmod +x kubectl-argo-rollouts-linux-amd64 && sudo mv kubectl-argo-rollouts-linux-amd64 /usr/local/bin/kubectl-argo-rollouts
\`\`\`

\`\`\`yaml
# rollout.yaml — 카나리 배포 전략
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api
spec:
  replicas: 10
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: my-registry.com/api:v1.5.0
  strategy:
    canary:
      steps:
        - setWeight: 10       # 10% 트래픽을 새 버전으로
        - pause: {duration: 5m}
        - analysis:
            templates:
              - templateName: success-rate   # 에러율 분석
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100
      canaryService: api-canary
      stableService: api-stable
      trafficRouting:
        nginx:
          stableIngress: api-ingress
---
# 분석 템플릿
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  metrics:
    - name: success-rate
      interval: 1m
      successCondition: result[0] >= 0.95
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{status!~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
\`\`\`

\`\`\`bash
# 배포 시작
kubectl apply -f rollout.yaml

# 실시간 진행 모니터링
kubectl argo rollouts get rollout api --watch

# 수동으로 다음 단계 진행
kubectl argo rollouts promote api

# 문제 발생 시 즉시 롤백
kubectl argo rollouts abort api
kubectl argo rollouts undo api
\`\`\`

---

## 6. CI → GitOps 연동 — 이미지 태그 자동 업데이트

\`\`\`yaml
# .github/workflows/deploy.yml
name: Build and Update Manifest

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push image
        run: |
          docker build -t my-registry.com/api:\${{ github.sha }} .
          docker push my-registry.com/api:\${{ github.sha }}

      - name: Update infra-repo image tag
        run: |
          git clone https://x-access-token:\${{ secrets.INFRA_TOKEN }}@github.com/myorg/infra-repo.git
          cd infra-repo
          # kustomize로 이미지 태그 업데이트
          cd apps/overlays/staging
          kustomize edit set image my-registry.com/api=my-registry.com/api:\${{ github.sha }}
          git config user.email "ci@myorg.com"
          git config user.name "CI Bot"
          git add -A
          git commit -m "chore: update api to \${{ github.sha }}"
          git push
      # ArgoCD가 infra-repo 변경을 감지해 자동 배포
\`\`\``,
  },

];

async function run() {
  let ok = 0, skip = 0, fail = 0;

  for (const g of guides) {
    const { error: existErr } = await supabase
      .from('engineer_guides')
      .select('id')
      .eq('slug', g.slug)
      .single();

    if (!existErr) {
      console.log('⏭  SKIP (이미 존재):', g.slug);
      skip++;
      continue;
    }

    const { error } = await supabase.from('engineer_guides').insert({
      ...g,
      status: 'published',
      views: 0,
    });

    if (error) {
      console.error('✗  FAIL:', g.slug, error.message);
      fail++;
    } else {
      console.log('✓  OK  ', g.slug);
      ok++;
    }
  }

  console.log(`\n완료: ${ok}개 삽입, ${skip}개 건너뜀, ${fail}개 실패`);
}

run();
