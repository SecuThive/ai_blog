import { createClient } from '@supabase/supabase-js/dist/index.mjs';

const supabase = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const guides = [
  // ── 클라우드 ──────────────────────────────────────────
  {
    title: 'AWS VPC 네트워크 설계 — 서브넷·라우팅·보안그룹',
    slug: 'aws-vpc-network-design',
    summary: 'VPC 생성, 퍼블릭·프라이빗 서브넷 설계, 인터넷 게이트웨이, NAT Gateway, 라우팅 테이블, 보안 그룹과 NACL로 AWS 네트워크를 구성하는 방법을 설명합니다.',
    category: '클라우드',
    tags: ['aws', 'vpc', '서브넷', '보안그룹', '네트워크', 'nat'],
    difficulty: 'intermediate',
    os_compat: [],
    author: 'Nodelog',
    content: `## VPC 기본 개념

| 구성 요소 | 역할 |
|---|---|
| **VPC** | 격리된 가상 네트워크 (CIDR 블록 정의) |
| **서브넷** | VPC 내 IP 범위 분할 (퍼블릭 / 프라이빗) |
| **인터넷 게이트웨이(IGW)** | 퍼블릭 서브넷의 인터넷 출구 |
| **NAT Gateway** | 프라이빗 서브넷이 인터넷 아웃바운드만 가능 |
| **라우팅 테이블** | 트래픽 경로 규칙 |
| **보안 그룹(SG)** | 인스턴스 레벨 상태형 방화벽 |
| **NACL** | 서브넷 레벨 비상태형 방화벽 |

---

## VPC 생성

\`\`\`bash
# VPC 생성 (CIDR: 10.0.0.0/16)
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=my-vpc}]'

# DNS 호스트네임 활성화
aws ec2 modify-vpc-attribute \
  --vpc-id vpc-xxxxxxxx \
  --enable-dns-hostnames
\`\`\`

---

## 서브넷 설계 (2-AZ 패턴)

\`\`\`bash
# 퍼블릭 서브넷 (로드밸런서, NAT GW)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ap-northeast-2a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-2a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ap-northeast-2c \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-2c}]'

# 프라이빗 서브넷 (앱 서버, DB)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.11.0/24 \
  --availability-zone ap-northeast-2a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-2a}]'

aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxx \
  --cidr-block 10.0.12.0/24 \
  --availability-zone ap-northeast-2c \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-2c}]'
\`\`\`

---

## 인터넷 게이트웨이 + NAT Gateway

\`\`\`bash
# 인터넷 게이트웨이 생성 및 연결
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway \
  --vpc-id vpc-xxxxxxxx \
  --internet-gateway-id igw-xxxxxxxx

# Elastic IP 할당 (NAT GW용)
aws ec2 allocate-address --domain vpc

# NAT Gateway 생성 (퍼블릭 서브넷에 위치)
aws ec2 create-nat-gateway \
  --subnet-id subnet-public-2a \
  --allocation-id eipalloc-xxxxxxxx \
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=nat-gw}]'
\`\`\`

---

## 라우팅 테이블 설정

\`\`\`bash
# 퍼블릭 라우팅 테이블 (→ IGW)
aws ec2 create-route-table --vpc-id vpc-xxxxxxxx
aws ec2 create-route \
  --route-table-id rtb-public \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-xxxxxxxx

# 퍼블릭 서브넷 연결
aws ec2 associate-route-table --subnet-id subnet-public-2a --route-table-id rtb-public
aws ec2 associate-route-table --subnet-id subnet-public-2c --route-table-id rtb-public

# 프라이빗 라우팅 테이블 (→ NAT GW)
aws ec2 create-route-table --vpc-id vpc-xxxxxxxx
aws ec2 create-route \
  --route-table-id rtb-private \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id nat-xxxxxxxx

aws ec2 associate-route-table --subnet-id subnet-private-2a --route-table-id rtb-private
aws ec2 associate-route-table --subnet-id subnet-private-2c --route-table-id rtb-private
\`\`\`

---

## 보안 그룹 설계

\`\`\`bash
# ALB 보안 그룹 (인터넷 → ALB)
aws ec2 create-security-group \
  --group-name sg-alb \
  --description "ALB Security Group" \
  --vpc-id vpc-xxxxxxxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-id \
  --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-id \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# 앱 서버 보안 그룹 (ALB → 앱)
aws ec2 create-security-group \
  --group-name sg-app \
  --description "App Server SG" \
  --vpc-id vpc-xxxxxxxx

# ALB SG에서만 3000 포트 허용
aws ec2 authorize-security-group-ingress \
  --group-id sg-app-id \
  --protocol tcp --port 3000 \
  --source-group sg-alb-id

# DB 보안 그룹 (앱 → DB)
aws ec2 create-security-group \
  --group-name sg-db \
  --description "Database SG" \
  --vpc-id vpc-xxxxxxxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-db-id \
  --protocol tcp --port 5432 \
  --source-group sg-app-id
\`\`\`

---

## VPC Flow Logs (네트워크 감사)

\`\`\`bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids vpc-xxxxxxxx \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name /aws/vpc/flowlogs \
  --deliver-logs-permission-arn arn:aws:iam::ACCOUNT:role/FlowLogsRole
\`\`\``,
  },

  {
    title: 'AWS Lambda 기초 — 서버리스 함수 작성과 배포',
    slug: 'aws-lambda-basics',
    summary: 'Lambda 함수 생성, 트리거(API Gateway·S3·EventBridge) 연결, 환경변수·IAM 역할·레이어 설정, CLI로 배포하는 방법까지 서버리스 입문을 설명합니다.',
    category: '클라우드',
    tags: ['aws', 'lambda', '서버리스', 'serverless', 'api-gateway', 'python'],
    difficulty: 'beginner',
    os_compat: [],
    author: 'Nodelog',
    content: `## Lambda 기본 개념

- **이벤트 기반 실행**: 트리거가 없으면 실행 안 됨 (유휴 비용 없음)
- **최대 실행 시간**: 15분
- **메모리**: 128MB ~ 10GB (CPU는 메모리에 비례)
- **과금**: 요청 수 + 실행 시간(ms)
- **콜드 스타트**: 처음 실행 시 컨테이너 초기화 시간

---

## 첫 번째 Lambda 함수 (Python)

\`\`\`python
# lambda_function.py
import json

def lambda_handler(event, context):
    """Lambda 핸들러 — 모든 함수의 진입점"""
    print(f"Event: {json.dumps(event)}")

    name = event.get('name', 'World')

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'message': f'Hello, {name}!'})
    }
\`\`\`

---

## CLI로 함수 생성

\`\`\`bash
# IAM 역할 생성 (Lambda 실행 권한)
aws iam create-role \
  --role-name lambda-basic-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# 기본 실행 정책 연결
aws iam attach-role-policy \
  --role-name lambda-basic-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# 코드 압축
zip function.zip lambda_function.py

# 함수 생성
aws lambda create-function \
  --function-name my-function \
  --runtime python3.12 \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-basic-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 30 \
  --memory-size 256

# 테스트 실행
aws lambda invoke \
  --function-name my-function \
  --payload '{"name": "Alice"}' \
  response.json
cat response.json

# 코드 업데이트
zip function.zip lambda_function.py
aws lambda update-function-code \
  --function-name my-function \
  --zip-file fileb://function.zip
\`\`\`

---

## 환경변수 설정

\`\`\`bash
aws lambda update-function-configuration \
  --function-name my-function \
  --environment 'Variables={DB_HOST=localhost,DB_NAME=mydb,ENV=production}'

# 함수 내에서 사용
import os
db_host = os.environ['DB_HOST']
\`\`\`

---

## API Gateway 트리거 (HTTP 엔드포인트)

\`\`\`bash
# HTTP API 생성 (v2, 더 간단하고 저렴)
aws apigatewayv2 create-api \
  --name my-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:ap-northeast-2:ACCOUNT:function:my-function

# Lambda에 API Gateway 권한 부여
aws lambda add-permission \
  --function-name my-function \
  --statement-id api-gateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com

# API 엔드포인트 확인
aws apigatewayv2 get-apis --query 'Items[0].ApiEndpoint'
\`\`\`

---

## EventBridge로 정기 실행 (cron)

\`\`\`bash
# 규칙 생성 (매일 09:00 UTC)
aws events put-rule \
  --name daily-job \
  --schedule-expression "cron(0 9 * * ? *)" \
  --state ENABLED

# Lambda를 타깃으로 설정
aws events put-targets \
  --rule daily-job \
  --targets '[{
    "Id": "lambda-target",
    "Arn": "arn:aws:lambda:ap-northeast-2:ACCOUNT:function:my-function"
  }]'

# Lambda에 EventBridge 권한 부여
aws lambda add-permission \
  --function-name my-function \
  --statement-id eventbridge-invoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:ap-northeast-2:ACCOUNT:rule/daily-job
\`\`\`

---

## S3 이벤트 트리거 (파일 업로드 시 처리)

\`\`\`bash
# S3 버킷 알림 설정
aws s3api put-bucket-notification-configuration \
  --bucket my-bucket \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [{
      "LambdaFunctionArn": "arn:aws:lambda:ap-northeast-2:ACCOUNT:function:my-function",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {"FilterRules": [{"Name": "suffix", "Value": ".jpg"}]}
      }
    }]
  }'
\`\`\`

---

## 로그 확인

\`\`\`bash
# 최근 로그 조회
aws logs tail /aws/lambda/my-function --follow

# 특정 기간
aws logs filter-log-events \
  --log-group-name /aws/lambda/my-function \
  --start-time $(date -d '1 hour ago' +%s000)
\`\`\``,
  },

  {
    title: 'AWS CloudWatch — 모니터링·알람·로그 수집 실전',
    slug: 'aws-cloudwatch-monitoring',
    summary: 'CloudWatch 메트릭 조회, 커스텀 메트릭 발행, 알람 설정, Logs Insights로 로그 쿼리, EC2·Lambda·RDS 대시보드 구성 방법을 설명합니다.',
    category: '클라우드',
    tags: ['aws', 'cloudwatch', '모니터링', '알람', '로그', 'metrics'],
    difficulty: 'intermediate',
    os_compat: [],
    author: 'Nodelog',
    content: `## CloudWatch 핵심 구성

| 구성 요소 | 역할 |
|---|---|
| **Metrics** | 시계열 수치 데이터 (CPU, 메모리 등) |
| **Alarms** | 메트릭 임계값 초과 시 알림·액션 |
| **Logs** | 로그 그룹·스트림 수집 |
| **Logs Insights** | 로그 쿼리 언어 |
| **Dashboards** | 메트릭·로그 시각화 |
| **Events/EventBridge** | 이벤트 기반 자동화 |

---

## 메트릭 조회

\`\`\`bash
# EC2 CPU 사용률 조회 (최근 1시간, 5분 평균)
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-xxxxxxxxxxxxxxxxx \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average \
  --query 'Datapoints[*].[Timestamp,Average]' \
  --output table

# 메트릭 목록 (네임스페이스별)
aws cloudwatch list-metrics --namespace AWS/EC2
aws cloudwatch list-metrics --namespace AWS/RDS
aws cloudwatch list-metrics --namespace AWS/Lambda
\`\`\`

---

## 커스텀 메트릭 발행

\`\`\`bash
# CLI로 커스텀 메트릭 발행
aws cloudwatch put-metric-data \
  --namespace "MyApp" \
  --metric-data '[{
    "MetricName": "ActiveUsers",
    "Value": 150,
    "Unit": "Count",
    "Dimensions": [
      {"Name": "Environment", "Value": "production"}
    ]
  }]'

# Python에서 발행
import boto3

cw = boto3.client('cloudwatch')
cw.put_metric_data(
    Namespace='MyApp',
    MetricData=[{
        'MetricName': 'OrderCount',
        'Value': 42,
        'Unit': 'Count',
        'Dimensions': [
            {'Name': 'Region', 'Value': 'ap-northeast-2'}
        ]
    }]
)
\`\`\`

---

## 알람 설정

\`\`\`bash
# CPU 80% 초과 5분 지속 시 SNS 알림
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-prod \
  --alarm-description "CPU over 80%" \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-xxxxxxxxx \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:ap-northeast-2:ACCOUNT:alerts \
  --ok-actions arn:aws:sns:ap-northeast-2:ACCOUNT:alerts

# 알람 목록
aws cloudwatch describe-alarms \
  --query 'MetricAlarms[*].[AlarmName,StateValue,MetricName]' \
  --output table

# 알람 상태 강제 변경 (테스트)
aws cloudwatch set-alarm-state \
  --alarm-name high-cpu-prod \
  --state-value ALARM \
  --state-reason "Testing"
\`\`\`

---

## CloudWatch Agent (EC2 메모리·디스크)

EC2 기본 메트릭에는 메모리와 디스크 사용량이 없으므로 Agent를 설치합니다.

\`\`\`bash
# Agent 설치 (Ubuntu)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# 설정 마법사 실행
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard

# 또는 설정 파일 직접 작성
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "metrics": {
    "metrics_collected": {
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["/", "/data"]
      }
    }
  }
}
EOF

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
\`\`\`

---

## Logs Insights 쿼리

\`\`\`bash
# CLI로 쿼리 실행
aws logs start-query \
  --log-group-name /aws/lambda/my-function \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 20'
\`\`\`

콘솔에서 자주 쓰는 쿼리:

\`\`\`
# Lambda 에러 분석
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)

# Lambda 실행 시간 Top 10
fields @timestamp, @duration
| sort @duration desc
| limit 10

# 특정 IP 요청 집계 (ALB 로그)
fields @timestamp, clientip, request
| filter clientip = "203.0.113.5"
| stats count() by request
\`\`\`

---

## 대시보드 생성

\`\`\`bash
aws cloudwatch put-dashboard \
  --dashboard-name production \
  --dashboard-body '{
    "widgets": [{
      "type": "metric",
      "properties": {
        "title": "EC2 CPU",
        "metrics": [["AWS/EC2","CPUUtilization","InstanceId","i-xxxxxxxx"]],
        "period": 300,
        "stat": "Average",
        "view": "timeSeries"
      }
    }]
  }'
\`\`\``,
  },

  {
    title: 'Azure 기초 — VM · 스토리지 · 네트워크 시작하기',
    slug: 'azure-basics-vm-storage-network',
    summary: 'Azure CLI 설치, 리소스 그룹·VM 생성, 스토리지 계정, 가상 네트워크, NSG 설정까지 Azure 핵심 서비스를 실습 중심으로 설명합니다.',
    category: '클라우드',
    tags: ['azure', 'vm', '클라우드', 'nsg', 'storage', 'vnet'],
    difficulty: 'beginner',
    os_compat: [],
    author: 'Nodelog',
    content: `## Azure CLI 설치 및 로그인

\`\`\`bash
# Ubuntu / Debian
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# macOS
brew install azure-cli

# 버전 확인
az --version

# 로그인
az login                         # 브라우저 인증
az login --use-device-code       # 코드 인증 (서버)

# 구독 선택
az account list --output table
az account set --subscription "구독명 또는 ID"

# 현재 컨텍스트
az account show
\`\`\`

---

## 리소스 그룹 생성

Azure의 모든 리소스는 리소스 그룹에 속합니다.

\`\`\`bash
# 리소스 그룹 생성
az group create \
  --name my-rg \
  --location koreacentral     # 한국 중부

# 위치 목록
az account list-locations --output table | grep korea

# 리소스 그룹 목록
az group list --output table

# 리소스 그룹 삭제 (내부 리소스 모두 삭제됨 — 주의)
az group delete --name my-rg --yes --no-wait
\`\`\`

---

## 가상 머신 생성

\`\`\`bash
# Ubuntu VM 생성
az vm create \
  --resource-group my-rg \
  --name my-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --location koreacentral

# Windows VM 생성
az vm create \
  --resource-group my-rg \
  --name my-win-vm \
  --image Win2022Datacenter \
  --size Standard_B2s \
  --admin-username azureuser \
  --admin-password "MyP@ssw0rd123"

# VM 목록
az vm list --output table
az vm list -g my-rg --output table

# VM 시작 / 중지 / 재시작
az vm start  --resource-group my-rg --name my-vm
az vm stop   --resource-group my-rg --name my-vm
az vm restart --resource-group my-rg --name my-vm

# SSH 접속 (공인 IP 확인)
az vm show -g my-rg -n my-vm -d --query publicIps -o tsv
\`\`\`

---

## 네트워크 보안 그룹 (NSG)

\`\`\`bash
# NSG 생성
az network nsg create \
  --resource-group my-rg \
  --name my-nsg

# 인바운드 규칙 추가
az network nsg rule create \
  --resource-group my-rg \
  --nsg-name my-nsg \
  --name allow-ssh \
  --protocol tcp \
  --direction inbound \
  --priority 100 \
  --source-address-prefix '*' \
  --destination-port-range 22 \
  --access allow

az network nsg rule create \
  --resource-group my-rg \
  --nsg-name my-nsg \
  --name allow-http \
  --protocol tcp \
  --direction inbound \
  --priority 110 \
  --source-address-prefix '*' \
  --destination-port-range 80 \
  --access allow

# NSG를 NIC에 연결
az network nic update \
  --resource-group my-rg \
  --name my-vmVMNic \
  --network-security-group my-nsg
\`\`\`

---

## 가상 네트워크 (VNet)

\`\`\`bash
# VNet 생성
az network vnet create \
  --resource-group my-rg \
  --name my-vnet \
  --address-prefix 10.0.0.0/16 \
  --location koreacentral

# 서브넷 추가
az network vnet subnet create \
  --resource-group my-rg \
  --vnet-name my-vnet \
  --name public-subnet \
  --address-prefix 10.0.1.0/24

az network vnet subnet create \
  --resource-group my-rg \
  --vnet-name my-vnet \
  --name private-subnet \
  --address-prefix 10.0.2.0/24
\`\`\`

---

## Azure Blob 스토리지

\`\`\`bash
# 스토리지 계정 생성
az storage account create \
  --name mystorageaccount1234 \
  --resource-group my-rg \
  --location koreacentral \
  --sku Standard_LRS \
  --kind StorageV2

# 컨테이너(버킷) 생성
az storage container create \
  --name mycontainer \
  --account-name mystorageaccount1234 \
  --public-access off

# 파일 업로드
az storage blob upload \
  --account-name mystorageaccount1234 \
  --container-name mycontainer \
  --file ./myfile.txt \
  --name myfile.txt

# 파일 목록
az storage blob list \
  --account-name mystorageaccount1234 \
  --container-name mycontainer \
  --output table

# 파일 다운로드
az storage blob download \
  --account-name mystorageaccount1234 \
  --container-name mycontainer \
  --name myfile.txt \
  --file ./downloaded.txt
\`\`\`

---

## 비용 절감 팁

- **B-시리즈 VM**: 개발용 저렴한 버스트형 인스턴스
- **예약 인스턴스**: 1년/3년 약정으로 최대 72% 할인
- **Spot 인스턴스**: 최대 90% 할인, 언제든 중단 가능
- 사용 안 하는 VM은 **할당 취소(deallocate)** — 중지만 하면 컴퓨팅 요금 계속 발생
\`\`\`bash
az vm deallocate --resource-group my-rg --name my-vm
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
