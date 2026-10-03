-- Phase 2 content-quality fixes, batch 2 (home latest posts #813 #814 #815).
-- Each UPDATE is guarded on md5 of the original column value: re-running is a no-op (0 rows).
-- KO updates record content_evidence.contentUpdatedAt/changeSummary (substantive change). EN-only updates do not.
-- No COMMIT: run inside BEGIN; review row counts; COMMIT manually after a backup.
BEGIN;

-- post 815: ASM 복제본 과금 정정, '경험적 손익분기 100~150개'를 손익분기 식으로 교체, ESO apiVersion v1 수정, sops 키 경로·오류 해석·수신자 제거 절차 수정
UPDATE posts SET content=$q$## "시크릿 관리 뭐 쓰세요?"에 정답이 없는 진짜 이유

시크릿 관리 도구 비교 글은 넘쳐나는데, 읽고 나면 항상 같은 자리로 돌아옵니다. 기능표에는 Vault가 압도적으로 많은 체크 표시를 받고, 그래서 Vault를 도입해야 할 것 같은데, 막상 우리 팀 시크릿은 30개 남짓이고 인프라 담당자는 1.5명입니다.

문제는 비교 기준이 잘못됐다는 데 있습니다. 도구 선택의 실제 비용은 **월 인프라 청구서 + 운영 인건비 + 장애 시 복구 시간**의 합인데, 대부분의 비교표는 첫 번째 항목조차 계산해주지 않습니다. 시크릿 30개짜리 팀이 Vault HA 3노드를 올리면, EC2 비용보다 unseal 절차를 문서화하고 Raft 스냅샷 복구를 리허설하는 데 들어가는 인건비가 몇 배 더 나옵니다.

이 글은 세 도구를 다음 기준으로만 판정합니다.

- 시나리오별 **월 청구서를 산식 그대로** 공개
- 새벽 3시에 장애가 났을 때 **영향 범위(블라스트 반경)**
- ISMS-P 심사에서 **어떤 증적을 제출할 수 있는가**

쿠버네티스 연동 아키텍처 자체를 더 깊게 보고 싶다면 [쿠버네티스 시크릿 보안 취약점, Vault와 CSI Driver로 완벽히 관리하는 방법](/blog/쿠버네티스-시크릿-보안-취약점-vault와-csi-driver로-완벽히-관리하는-방법)과 [Kubernetes 비밀 관리, Vault vs AWS Secrets Manager 비교 및 최적 아키텍처 가이드](/blog/kubernetes-비밀-관리-vault-vs-aws-secrets-manager-비교-및-최적-아키텍처-가이드)를 함께 보시면 됩니다. 이 글은 아키텍처가 아니라 **돈과 사람** 쪽에 집중합니다.

## 셋은 애초에 다른 종류의 물건입니다

가장 먼저 정리할 것: **SOPS는 시크릿 저장소가 아니라 암호화 포맷입니다.** Vault와 ASM은 "시크릿을 보관하고 API로 내주는 서버"지만, SOPS는 "YAML/JSON 파일의 값 부분만 암호화하는 CLI 도구"입니다. 저장소는 여러분의 Git 리포지토리가 담당합니다. 이 차이를 놓치면 비교 자체가 성립하지 않습니다.

| 축 | HashiCorp Vault | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| 중앙 서버 | 필수 (셀프호스트 또는 HCP) | 관리형, 서버 운영 없음 | 서버 없음 (파일 + Git) |
| 동적 시크릿 | 지원 (DB·클라우드 크레덴셜 TTL 발급) | 미지원 (정적 값 + 로테이션) | 미지원 |
| 감사 로그 | audit device (file/syslog/socket) | CloudTrail 이벤트 | Git 커밋 히스토리로 대체 |
| 자동 로테이션 | 내장 (엔진별 rotate) | Lambda 기반 로테이션 | 수동 (재암호화 후 커밋) |
| K8s 연동 | Vault Agent Injector 사이드카 주입 / Secrets Store CSI Driver | External Secrets Operator가 폴링해 Secret 생성 | kustomize-sops가 빌드 타임 복호화 |
| 멀티클라우드 | 클라우드 중립 | AWS 종속 | 클라우드 중립 (KMS/age 선택) |

여기서 갈리는 결정적 축은 **동적 시크릿**입니다. "DB 접속 계정을 요청 시점에 1시간짜리로 발급하고 자동 폐기"라는 요구가 실제로 있다면 Vault 외의 선택지는 사실상 없습니다. 반대로 그 요구가 없다면, Vault가 가진 기능표 우위의 상당 부분은 우리 팀에 청구되지 않는 가치입니다.

## 월 비용 계산: 단가와 산식을 그대로 공개합니다

**계산 기준 시점: 2026년 8월 / 리전: 서울(ap-northeast-2) / 온디맨드 기준.** AWS 단가는 변경될 수 있으므로 최종 판단 전 AWS 공식 요금 페이지에서 반드시 재확인하시기 바랍니다.

핵심 산식은 세 줄입니다.

- **AWS Secrets Manager**: `시크릿 수 × $0.40 + (API 호출 수 ÷ 10,000) × $0.05`
- **SOPS + age**: KMS를 병행할 경우 `키 개수 × $1.00` + 복호화 API 호출 비용. age 키만 쓰면 인프라 비용 **$0**
- **Vault 셀프호스트**: `EC2 인스턴스비 + EBS + NLB` + **운영 인건비(월 투입 시간 × 시급)**

운영 인건비를 별도 행으로 분리하는 게 이 계산의 핵심입니다. 시급은 계산 편의상 **50,000원(약 $36)** 으로 잡았습니다. 팀 실제 인건비로 바꿔 다시 계산해 보세요. 표의 운영 시간(월 8시간 등)도 측정값이 아니라 설명을 위한 가정입니다. 팀의 실제 작업 기록으로 바꿔 넣어야 결론이 의미가 있습니다.

### 시나리오 ① 시크릿 30개 / API 5만 콜 / 개발자 3명

| 항목 | Vault(셀프호스트 단일노드) | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| 인프라 | t3.small 1대 ≈ $19 + EBS 20GB ≈ $2 | $0 | $0 |
| 시크릿/API | - | 30 × $0.40 = $12 + (50,000÷10,000)×$0.05 = $0.25 → **$12.25** | $0 |
| 운영 인건비 | 월 8시간 × $36 = **$288** | 월 1시간 = $36 | 월 1시간 = $36 |
| **월 합계** | **약 $309** | **약 $48** | **약 $36** |

30개 규모에서 Vault는 인프라비($21)보다 운영 인건비($288)가 13배 큽니다. 이 구간에서 Vault를 올리는 건 명백한 과잉투자입니다.

### 시나리오 ② 시크릿 300개 / API 200만 콜 / 서비스 15개

| 항목 | Vault(HA 3노드) | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| 인프라 | t3.medium ×3 ≈ $114 + EBS ≈ $9 + NLB ≈ $20 → **$143** | $0 | $0 |
| 시크릿/API | - | 300 × $0.40 = $120 + (2,000,000÷10,000)×$0.05 = $10 → **$130** | $0 |
| 운영 인건비 | 월 20시간 × $36 = **$720** | 월 4시간 = $144 | 월 16시간 = **$576** |
| **월 합계** | **약 $863** | **약 $274** | **약 $612** |

**여기가 뒤집히는 지점입니다.** SOPS는 인프라 비용이 계속 $0이지만, 시크릿이 300개를 넘고 서비스가 15개로 갈라지면 "누가 어떤 키로 무엇을 복호화할 수 있는가"를 `.sops.yaml`의 creation_rules로 관리하는 부담이 급격히 커집니다. 개발자 입퇴사 시 age 수신자 목록에서 키를 빼고 **전체 파일을 재암호화**해야 하는데, 이 작업 하나가 파일 수에 비례합니다.

손익분기는 시크릿 개수 하나로 정해지지 않습니다. 두 방식의 월 비용을 같게 놓으면 다음 식이 나옵니다.

`N × $0.40 + (월 API 호출 ÷ 10,000) × $0.05 = (SOPS 운영 시간 − ASM 운영 시간) × 시급`

시나리오 ②의 가정(SOPS 16시간, ASM 4시간, 시급 $36, API 200만 콜)을 넣으면 오른쪽은 $432, 왼쪽은 `N × $0.40 + $10`이므로 N이 약 1,055개가 될 때까지 ASM이 쌉니다. 운영 시간 차이가 월 2시간뿐이라면 오른쪽은 $72이고, N이 약 155개를 넘으면 SOPS가 쌉니다. 결론은 시크릿 개수보다 **운영 시간 차이**에 훨씬 민감합니다. 한 달 동안 키 추가·제거·재암호화에 실제로 쓴 시간을 기록해 넣으세요.

### 시나리오 ③ 시크릿 1,000개 / 멀티리전·멀티클라우드

| 항목 | Vault(HA 3노드 ×2리전) | AWS Secrets Manager(복제) | SOPS + age |
|---|---|---|---|
| 인프라 | 약 $290 | $0 | $0 |
| 시크릿/API | - | 원본 1,000 × $0.40 = $400 + 복제본 1,000 × $0.40 = $400(복제본도 별도 시크릿으로 과금) + API 비용 → **$800 이상** | $0 |
| 운영 인건비 | 월 40시간 = **$1,440** | 월 8시간 = $288 | 실질적으로 관리 불가 |
| **월 합계** | **약 $1,730** | **약 $1,090 이상** | 권장하지 않음 |

복제본 과금은 AWS 보안 블로그의 [리전 간 복제 안내](https://aws.amazon.com/blogs/security/how-to-replicate-secrets-aws-secrets-manager-multiple-regions/)에 "각 복제본은 별도 시크릿으로 과금"된다고 나와 있습니다. 단가는 [AWS Secrets Manager 요금](https://aws.amazon.com/secrets-manager/pricing/)을 기준으로 했습니다.

이 구간에서 SOPS는 비용이 아니라 **운영 가능성**에서 탈락합니다. 반대로 AWS 단일 클라우드라면 ASM이 여전히 유리하고, 멀티클라우드거나 동적 크레덴셜이 필수라면 Vault의 $1,730이 정당화됩니다.

## 돈 말고 사람: 러닝커브와 블라스트 반경

| 항목 | Vault | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| 초기 구축 시간 | HA 구성 기준 며칠 | 반나절 (ESO 연동 포함) | 30분 |
| 봉인(Seal) 운영 | unseal 키 분산 보관 필요, Auto-unseal(KMS) 전환 권장 | 해당 없음 | 해당 없음 |
| 장애 시 영향 범위 | Vault seal → **신규 배포·재기동 전면 중단** | AWS 리전 장애 시 ESO 동기화 실패 (기존 Secret은 유지) | 이미 배포된 워크로드 **무영향** (빌드 타임 복호화) |
| 백업·복구 | Raft snapshot 저장·복구 리허설 필수 | 관리형, 삭제 대기기간 내 복구 가능 | age 개인키 백업이 전부 (단, 분실 시 전량 복구 불가) |
| 사고 유형 | 운영 실수형 (seal, 토큰 만료, 정책 오류) | 권한/한도형 (IAM, 스로틀링) | 키 분실형 (되돌릴 수 없음) |

블라스트 반경만 놓고 보면 SOPS가 가장 안전합니다. 복호화가 배포 파이프라인에서 끝나므로 런타임 의존성이 없습니다. 반대로 Vault는 런타임 의존성이 가장 크고, 그래서 **Auto-unseal은 선택이 아니라 사실상 필수**입니다. 수동 unseal 체제로 운영하면 새벽 장애 때 unseal 키 3개를 가진 사람 3명을 동시에 깨워야 합니다.

### Vault BSL 전환: 언제 문제가 되고 언제 무관한가

2023년 8월, HashiCorp는 주요 제품 라이선스를 MPL 2.0에서 **BSL(Business Source License)** 로 변경했습니다. 이후 리눅스 재단 산하에서 **OpenBao**라는 커뮤니티 포크가 출범해 MPL 계열 라이선스로 개발이 이어지고 있습니다.

판정 기준은 의외로 단순합니다.

- **무관한 경우**: 자사 서비스 운영을 위해 Vault를 내부에 설치해 사내 시크릿을 관리 → 일반적인 내부 사용은 BSL 제한 대상이 아닙니다. 대부분의 스타트업·중견 기업이 여기 해당합니다.
- **검토가 필요한 경우**: Vault를 기반으로 **고객에게 시크릿 관리 서비스를 제공**하거나, SaaS 상품의 핵심 기능으로 재판매하는 형태 → HashiCorp가 제한하는 "경쟁 제품" 해석에 걸릴 수 있으므로 법무 검토가 필요합니다.

라이선스 조항의 최종 해석은 원문과 법무 검토를 따라야 합니다. 여기서는 판정의 방향만 제시하며, 도입 결정 시 BSL 원문 및 사내 법무 확인을 권합니다. 라이선스 리스크가 신경 쓰이지만 Vault의 동적 시크릿은 필요하다면 OpenBao가 현실적인 대안입니다.

### ISMS-P 암호키 관리 통제항목 대응

국내 인증 심사에서 자주 요구되는 증적은 "키 생성·보관·회전·폐기 이력"과 "접근 통제 기록"입니다.

| 요구 증적 | Vault | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| 접근 기록 | audit device JSON 로그 (요청자·경로·시각) | CloudTrail 이벤트 (GetSecretValue 등) | Git 커밋 로그 (누가 언제 변경) — 조회 기록은 없음 |
| 키 회전 이력 | 로테이션 로그 + 버전 | 버전 스탬프 + 로테이션 이력 | 재암호화 커밋 이력 |
| 권한 분리 | 정책(policy) 문서 | IAM 정책 + 리소스 정책 | `.sops.yaml` creation_rules |

SOPS의 약점은 명확합니다. **"누가 이 시크릿을 열람했는가"를 남길 수 없습니다.** 변경 이력만 있고 조회 이력이 없습니다. 열람 감사 증적이 필수인 심사 항목이 있다면 SOPS 단독은 부적합할 가능성이 높으니, 심사 요구사항 원문을 먼저 확인하시기 바랍니다.

리전·지원 측면에서 AWS Secrets Manager는 서울 리전(ap-northeast-2)을 지원하고 한국어 문서와 유료 서포트 플랜을 통한 한국어 대응이 가능합니다. Vault·SOPS는 커뮤니티 중심이며 공식 문서는 영문 기준입니다.

## 의사결정표: 5개 질문으로 판정

| # | 질문 | Yes → | No → |
|---|---|---|---|
| 1 | DB 크레덴셜을 요청 시점 TTL로 발급해야 하는가? | **Vault / OpenBao** | 2번으로 |
| 2 | 멀티클라우드 또는 온프레미스 병행인가? | **Vault / OpenBao** | 3번으로 |
| 3 | AWS 단일 클라우드이고, 위 손익분기 식에서 ASM 쪽이 싼가? | **ASM + ESO** | 4번으로 |
| 4 | GitOps로 매니페스트와 시크릿을 Git에 함께 두고 싶은가? | **SOPS + age** | 5번으로 |
| 5 | 시크릿 **열람** 감사 로그 제출이 필수인가? | **ASM(CloudTrail)** | **SOPS + age** |

현실적인 조합 패턴도 있습니다. 애플리케이션 설정은 SOPS로 Git에 두고, DB 비밀번호처럼 로테이션이 필요한 것만 ASM에 두는 방식입니다. ASM 요금은 ASM에 둔 시크릿 수에만 붙으므로, 로테이션이 필요한 시크릿이 전체의 일부일 때 비용을 줄일 수 있습니다.

## 오늘 바로 실행: .env → SOPS 암호화 5단계

```bash
# 1. age 키 생성 (개인키는 절대 커밋 금지)
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt
# macOS에서 sops의 기본 경로는 ~/Library/Application Support/sops/age/keys.txt 이므로 이 경로를 지정한다
export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt

# 2. 공개키 확인 (age1... 로 시작하는 문자열)
grep "public key" ~/.config/sops/age/keys.txt

# 3. .sops.yaml 작성 — 복수 수신자로 키 분실 대비
cat > .sops.yaml <<'EOF'
creation_rules:
  - path_regex: secrets/.*\.yaml$
    age: >-
      age1abc...개발자A공개키,
      age1def...백업용공개키
EOF

# 4. 평문 YAML 암호화 (값만 암호화, 키 이름은 평문 유지)
sops -e secrets/prod.yaml > secrets/prod.enc.yaml && rm secrets/prod.yaml

# 5. 커밋
git add .sops.yaml secrets/prod.enc.yaml && git commit -m "chore: encrypt prod secrets with SOPS"
```

정상 결과: `secrets/prod.enc.yaml`을 열면 키 이름은 읽히고 값이 `ENC[AES256_GCM,data:...]` 형태로 바뀌어 있으며, 파일 하단에 `sops:` 메타데이터 블록이 붙습니다. 값이 평문 그대로라면 `.sops.yaml`의 `path_regex`가 실제 경로와 맞지 않는 것이니 경로 패턴부터 확인하세요.

복호화 확인은 `sops -d secrets/prod.enc.yaml`입니다. `no matching creation rules`는 암호화(`sops -e`) 때 입력 경로가 `path_regex`와 맞지 않으면 나옵니다. 복호화 때 `failed to get the data key`가 나오면 sops가 개인키를 찾지 못한 것입니다. 기본 경로는 Linux `~/.config/sops/age/keys.txt`, macOS `~/Library/Application Support/sops/age/keys.txt`이고(`XDG_CONFIG_HOME`이 없을 때), 다른 곳에 두었다면 `SOPS_AGE_KEY_FILE`로 지정합니다([SOPS age 문서](https://getsops.io/docs/usage/identities/age/)).

### ASM을 쓴다면: ESO 최소 YAML

`external-secrets.io/v1`은 ESO v0.16.2부터 쓸 수 있고, v0.17.0부터는 `v1beta1`을 더 이상 제공하지 않습니다([v0.17.0 릴리스 노트](https://github.com/external-secrets/external-secrets/releases/tag/v0.17.0)). 예전 예제의 `v1beta1`은 최신 ESO에 적용되지 않습니다.

```yaml
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: aws-secretsmanager
  namespace: prod
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: app-db-secret
  namespace: prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: app-db-secret
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/app/db
        property: password
```

적용 후 `kubectl get externalsecret -n prod` 결과의 STATUS가 `SecretSynced`면 정상입니다. `SecretSyncedError`라면 IRSA 서비스 어카운트에 `secretsmanager:GetSecretValue` 권한이 있는지부터 확인하세요.

## 실패 분기 3종 체크리스트

**① Vault가 seal 되어 배포가 전면 중단됐다**

```bash
vault status                      # Sealed: true 확인
vault operator unseal <key-share-1>
vault operator unseal <key-share-2>
vault operator unseal <key-share-3>   # threshold 만큼 반복
```

재발 방지는 KMS Auto-unseal 전환입니다. 설정 후 재기동하면 사람 개입 없이 unseal 됩니다.

```hcl
seal "awskms" {
  region     = "ap-northeast-2"
  kms_key_id = "arn:aws:kms:ap-northeast-2:<account-id>:key/<key-id>"
}
```

**② age 개인키를 분실했다**

복구 방법은 없습니다. 사전 대비만이 답입니다. 암호화 시점에 수신자를 복수로 지정해 두세요.

```bash
sops -e --age "age1개발자키,age1백업키,age1CI키" secrets/prod.yaml > secrets/prod.enc.yaml
# 이미 암호화된 파일에 수신자 추가: .sops.yaml의 age 목록에 새 공개키를 먼저 넣고 실행
sops updatekeys secrets/prod.enc.yaml
```

수신자를 뺄 때(퇴사 등)는 `.sops.yaml`에서 키를 지우고 `sops updatekeys` 다음에 `sops rotate --in-place`로 데이터 키를 바꿉니다([SOPS 키 관리 문서](https://getsops.io/docs/usage/key-management/)). 그래도 Git 이력에 남은 예전 암호문은 뺀 키로 열 수 있으므로, 그 사람이 볼 수 있던 시크릿 값은 교체해야 합니다.

**③ ASM 시크릿을 삭제했는데 같은 이름으로 재생성이 안 된다**

ASM은 삭제 시 복구 대기기간(기본 30일, 7~30일로 지정 가능)을 두므로, 대기 중인 이름은 재사용할 수 없습니다. 복제본이 있으면 복제본부터 지워야 삭제됩니다. 강제 삭제 뒤 `aws secretsmanager describe-secret --secret-id prod/app/db`가 `ResourceNotFoundException`을 내면 완료된 것입니다(짧은 지연이 있습니다).

```bash
# 복구 (권장)
aws secretsmanager restore-secret --secret-id prod/app/db --region ap-northeast-2

# 즉시 완전 삭제 후 재생성 — 복구 불가, 신중히
aws secretsmanager delete-secret --secret-id prod/app/db \
  --force-delete-without-recovery --region ap-northeast-2
```

## 자주 묻는 질문 (FAQ)

**Q. 시크릿이 몇 개부터 AWS Secrets Manager로 넘어가는 게 맞나요?**
A. 정해진 개수는 없습니다. 인프라 비용만 보면 SOPS가 항상 싸고, 운영 시간을 넣으면 위의 손익분기 식으로 갈립니다. 예를 들어 시크릿 150개면 ASM 요금은 `150 × $0.40 = $60`이므로, SOPS 쪽 키 관리·재암호화에 ASM보다 월 약 1.7시간(시급 $36 기준) 이상 더 들면 ASM이 쌉니다.

**Q. Vault BSL 전환 때문에 지금 쓰던 Vault를 걷어내야 하나요?**
A. 자사 서비스 운영을 위한 내부 사용이라면 일반적으로 문제되지 않습니다. Vault를 기반으로 고객에게 시크릿 관리 기능을 제공·재판매하는 형태만 법무 검토 대상입니다. 라이선스 리스크 자체를 피하고 싶다면 OpenBao 포크가 대안입니다.

**Q. SOPS만으로 ISMS-P 암호키 관리 항목을 통과할 수 있나요?**
A. 변경 이력(Git 커밋)은 제출할 수 있지만 **열람 이력은 남지 않습니다.** 조회 감사가 요구되는 항목이 있다면 SOPS 단독은 부족할 수 있으니, 해당 통제항목의 요구 원문을 확인하고 필요하면 ASM(CloudTrail) 또는 Vault audit device를 병행하는 구성을 검토하세요.$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$ASM 복제본 과금 정정, '경험적 손익분기 100~150개'를 손익분기 식으로 교체, ESO apiVersion v1 수정, sops 키 경로·오류 해석·수신자 제거 절차 수정$q$::text))
WHERE id=815 AND md5(content)='d32fd843eed13e4066358deddbf4c246';

UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$## Why “What do you use for secrets?” has no single right answer

Secret-management comparison posts are everywhere, but after reading them you end up right back where you started. Feature tables give Vault an overwhelming number of checkmarks, so it feels like you should adopt Vault—except your team has maybe 30 secrets and 1.5 infrastructure people.

The problem is the comparison criteria. The real cost of choosing a tool is **monthly infrastructure bill + ops labor + recovery time when something breaks**, yet most comparison tables don’t even calculate the first item. If a 30-secret team stands up a 3-node Vault HA cluster, the labor spent documenting unseal procedures and rehearsing Raft snapshot recovery will dwarf the EC2 bill.

This post judges the three tools on these criteria only:

- Scenario-by-scenario **monthly bills, with the formulas shown as-is**
- **Blast radius** when an incident hits at 3 a.m.
- **What evidence you can submit** in an ISMS-P audit

If you want a deeper look at Kubernetes integration architecture itself, see [How to Fully Manage Kubernetes Secret Security Vulnerabilities with Vault and the CSI Driver](/blog/쿠버네티스-시크릿-보안-취약점-vault와-csi-driver로-완벽히-관리하는-방법) and [Kubernetes Secret Management: Vault vs AWS Secrets Manager Comparison and Optimal Architecture Guide](/blog/kubernetes-비밀-관리-vault-vs-aws-secrets-manager-비교-및-최적-아키텍처-가이드). This post focuses on **money and people**, not architecture.

## These three are different kinds of things to begin with

First thing to get straight: **SOPS is not a secret store; it is an encryption format.** Vault and ASM are “servers that store secrets and serve them over an API,” while SOPS is “a CLI tool that encrypts only the value portions of YAML/JSON files.” Storage is your Git repository’s job. Miss this difference and the comparison doesn’t even hold.

| Axis | HashiCorp Vault | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| Central server | Required (self-hosted or HCP) | Managed; no server ops | No server (files + Git) |
| Dynamic secrets | Supported (DB/cloud credentials issued with TTL) | Not supported (static values + rotation) | Not supported |
| Audit logs | audit device (file/syslog/socket) | CloudTrail events | Substituted by Git commit history |
| Automatic rotation | Built-in (per-engine rotate) | Lambda-based rotation | Manual (re-encrypt then commit) |
| K8s integration | Vault Agent Injector sidecar injection / Secrets Store CSI Driver | External Secrets Operator polls and creates Secrets | kustomize-sops decrypts at build time |
| Multi-cloud | Cloud-neutral | AWS-bound | Cloud-neutral (choose KMS or age) |

The decisive axis that splits the field is **dynamic secrets**. If you actually need “issue a one-hour DB login at request time and auto-revoke it,” there is effectively no choice besides Vault. If you don’t have that requirement, a large share of Vault’s feature-table advantage is value that never gets billed to your team.

## Monthly cost: unit prices and formulas, shown as-is

**Pricing snapshot: August 2026 / region: Seoul (ap-northeast-2) / on-demand.** AWS unit prices can change, so reconfirm on the official AWS pricing page before making a final decision.

The core formulas are three lines:

- **AWS Secrets Manager**: `secret count × $0.40 + (API calls ÷ 10,000) × $0.05`
- **SOPS + age**: If you also use KMS, `number of keys × $1.00` + decrypt API call cost. Using age keys only, infrastructure cost is **$0**
- **Vault self-hosted**: `EC2 instance + EBS + NLB` + **ops labor (hours/month × hourly rate)**

Splitting ops labor into its own row is the point of this calculation. For convenience, hourly rate is set at **₩50,000 (about $36)**. Plug in your team’s actual labor cost and recalculate. The ops hours in the tables (8 hours/month and so on) are also illustrative assumptions, not measurements; the conclusion only holds once you replace them with your team’s own time logs.

### Scenario 1: 30 secrets / 50,000 API calls / 3 developers

| Item | Vault (self-hosted, single node) | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| Infrastructure | 1× t3.small ≈ $19 + 20 GB EBS ≈ $2 | $0 | $0 |
| Secrets/API | - | 30 × $0.40 = $12 + (50,000÷10,000)×$0.05 = $0.25 → **$12.25** | $0 |
| Ops labor | 8 hours/month × $36 = **$288** | 1 hour/month = $36 | 1 hour/month = $36 |
| **Monthly total** | **≈ $309** | **≈ $48** | **≈ $36** |

At 30 secrets, Vault’s ops labor ($288) is 13× the infrastructure cost ($21). Standing up Vault in this range is clearly over-investment.

### Scenario 2: 300 secrets / 2 million API calls / 15 services

| Item | Vault (HA, 3 nodes) | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| Infrastructure | 3× t3.medium ≈ $114 + EBS ≈ $9 + NLB ≈ $20 → **$143** | $0 | $0 |
| Secrets/API | - | 300 × $0.40 = $120 + (2,000,000÷10,000)×$0.05 = $10 → **$130** | $0 |
| Ops labor | 20 hours/month × $36 = **$720** | 4 hours/month = $144 | 16 hours/month = **$576** |
| **Monthly total** | **≈ $863** | **≈ $274** | **≈ $612** |

**This is where it flips.** SOPS infrastructure stays $0, but once you pass 300 secrets and 15 services, the burden of managing “who can decrypt what with which key” via `creation_rules` in `.sops.yaml` grows sharply. When a developer joins or leaves, you remove their key from the age recipient list and **re-encrypt every file**—and that work scales with the number of files.

There is no single break-even secret count. Set the two monthly costs equal and you get:

`N × $0.40 + (monthly API calls ÷ 10,000) × $0.05 = (SOPS ops hours − ASM ops hours) × hourly rate`

With Scenario 2’s assumptions (SOPS 16 h, ASM 4 h, $36/h, 2M API calls) the right side is $432 and the left is `N × $0.40 + $10`, so ASM stays cheaper until N ≈ 1,055. If the ops-time gap is only 2 hours a month, the right side is $72 and SOPS becomes cheaper above N ≈ 155. The answer is far more sensitive to the **ops-time gap** than to the secret count, so log the time you actually spend adding, removing and re-encrypting keys for a month and plug that in.

### Scenario 3: 1,000 secrets / multi-region, multi-cloud

| Item | Vault (HA 3 nodes × 2 regions) | AWS Secrets Manager (replication) | SOPS + age |
|---|---|---|---|
| Infrastructure | ≈ $290 | $0 | $0 |
| Secrets/API | - | 1,000 primaries × $0.40 = $400 + 1,000 replicas × $0.40 = $400 (each replica is billed as a separate secret) + API cost → **$800+** | $0 |
| Ops labor | 40 hours/month = **$1,440** | 8 hours/month = $288 | Effectively unmanageable |
| **Monthly total** | **≈ $1,730** | **≈ $1,090+** | Not recommended |

The replica charge comes from the AWS Security Blog’s [cross-Region replication post](https://aws.amazon.com/blogs/security/how-to-replicate-secrets-aws-secrets-manager-multiple-regions/) (“each replica secret is billed as a separate secret”); unit prices follow [AWS Secrets Manager pricing](https://aws.amazon.com/secrets-manager/pricing/).

In this range SOPS drops out not on cost but on **operability**. If you are AWS-only, ASM is still cheaper; if you are multi-cloud or dynamic credentials are mandatory, Vault’s $1,730 is justified.

## Beyond money: learning curve and blast radius

| Item | Vault | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| Initial setup time | Several days for HA | Half a day (including ESO) | 30 minutes |
| Seal operations | Unseal keys must be stored separately; Auto-unseal (KMS) strongly recommended | N/A | N/A |
| Blast radius on failure | Vault seal → **all new deploys and restarts stop** | ESO sync fails during an AWS region outage (existing Secrets remain) | **No impact** on already-deployed workloads (decrypt at build time) |
| Backup & recovery | Raft snapshot save/restore rehearsal required | Managed; recoverable within the deletion waiting period | Backing up the age private key is everything (if lost, nothing is recoverable) |
| Failure mode | Operator error (seal, token expiry, policy mistakes) | Permissions/limits (IAM, throttling) | Key loss (irreversible) |

On blast radius alone, SOPS is the safest. Decryption finishes in the deploy pipeline, so there is no runtime dependency. Vault has the largest runtime dependency, which is why **Auto-unseal is not optional—it is effectively mandatory**. If you run with manual unseal, a 3 a.m. incident means waking three people who each hold one of three unseal key shares at the same time.

### Vault’s BSL switch: when it matters and when it doesn’t

In August 2023, HashiCorp changed the license of its major products from MPL 2.0 to the **BSL (Business Source License)**. A community fork, **OpenBao**, later launched under the Linux Foundation and continues development under an MPL-family license.

The decision rule is surprisingly simple.

- **Doesn’t apply**: You install Vault internally to manage in-house secrets for your own services → ordinary internal use is not restricted by BSL. Most startups and mid-size companies fall here.
- **Needs review**: You **offer secret-management as a service to customers** on top of Vault, or resell it as a core feature of a SaaS product → this can fall under HashiCorp’s “competitive product” interpretation, so legal review is required.

Final interpretation of the license terms must follow the original text and legal review. This section only sketches the direction; confirm against the BSL text and in-house counsel before adopting. If license risk bothers you but you still need Vault’s dynamic secrets, OpenBao is a practical alternative.

### Mapping to ISMS-P cryptographic-key management controls

Evidence commonly requested in Korean certification audits is “key generation, storage, rotation, and destruction history” plus “access-control records.”

| Required evidence | Vault | AWS Secrets Manager | SOPS + age |
|---|---|---|---|
| Access records | audit device JSON logs (requester, path, timestamp) | CloudTrail events (GetSecretValue, etc.) | Git commit log (who changed what, when) — no read/access log |
| Key rotation history | Rotation logs + versions | Version stamps + rotation history | Re-encryption commit history |
| Separation of duties | policy documents | IAM policies + resource policies | `.sops.yaml` creation_rules |

SOPS’s weakness is clear: **it cannot record who read a secret.** You have change history, not access history. If an audit item requires read-audit evidence, SOPS alone is likely insufficient—check the original control language first.

On region and support, AWS Secrets Manager is available in Seoul (ap-northeast-2) and offers Korean documentation plus Korean-language response via paid support plans. Vault and SOPS are community-centric; official docs are English-first.

## Decision table: five questions

| # | Question | Yes → | No → |
|---|---|---|---|
| 1 | Must DB credentials be issued with a TTL at request time? | **Vault / OpenBao** | Go to 2 |
| 2 | Multi-cloud or on-prem in parallel? | **Vault / OpenBao** | Go to 3 |
| 3 | AWS-only, and ASM comes out cheaper in the break-even formula above? | **ASM + ESO** | Go to 4 |
| 4 | Want manifests and secrets together in Git (GitOps)? | **SOPS + age** | Go to 5 |
| 5 | Is submitting **read** audit logs for secrets mandatory? | **ASM (CloudTrail)** | **SOPS + age** |

There is also a realistic hybrid: keep application config in Git with SOPS, and put only rotation-needed items like DB passwords in ASM. ASM charges only for the secrets stored in ASM, so this cuts cost when only part of your secrets need rotation.

## Do this today: five steps to encrypt .env with SOPS

```bash
# 1. age 키 생성 (개인키는 절대 커밋 금지)
mkdir -p ~/.config/sops/age
age-keygen -o ~/.config/sops/age/keys.txt
# On macOS sops defaults to ~/Library/Application Support/sops/age/keys.txt, so point it at this path
export SOPS_AGE_KEY_FILE=~/.config/sops/age/keys.txt

# 2. 공개키 확인 (age1... 로 시작하는 문자열)
grep "public key" ~/.config/sops/age/keys.txt

# 3. .sops.yaml 작성 — 복수 수신자로 키 분실 대비
cat > .sops.yaml <<'EOF'
creation_rules:
  - path_regex: secrets/.*\.yaml$
    age: >-
      age1abc...개발자A공개키,
      age1def...백업용공개키
EOF

# 4. 평문 YAML 암호화 (값만 암호화, 키 이름은 평문 유지)
sops -e secrets/prod.yaml > secrets/prod.enc.yaml && rm secrets/prod.yaml

# 5. 커밋
git add .sops.yaml secrets/prod.enc.yaml && git commit -m "chore: encrypt prod secrets with SOPS"
```

Expected result: open `secrets/prod.enc.yaml` and the key names are readable, values have become `ENC[AES256_GCM,data:...]`, and a `sops:` metadata block is appended at the bottom. If values are still plaintext, `path_regex` in `.sops.yaml` doesn’t match the actual path—fix the path pattern first.

To verify decryption: `sops -d secrets/prod.enc.yaml`. `no matching creation rules` appears when encrypting (`sops -e`) a path that no `path_regex` matches. `failed to get the data key` on decrypt means sops could not find the private key. The defaults are `~/.config/sops/age/keys.txt` on Linux and `~/Library/Application Support/sops/age/keys.txt` on macOS (when `XDG_CONFIG_HOME` is unset); anywhere else, set `SOPS_AGE_KEY_FILE` ([SOPS age docs](https://getsops.io/docs/usage/identities/age/)).

### If you use ASM: minimal ESO YAML

`external-secrets.io/v1` is available from ESO v0.16.2, and v0.17.0 stopped serving `v1beta1` ([v0.17.0 release notes](https://github.com/external-secrets/external-secrets/releases/tag/v0.17.0)). Older `v1beta1` examples will not apply on current ESO.

```yaml
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: aws-secretsmanager
  namespace: prod
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: app-db-secret
  namespace: prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: app-db-secret
  data:
    - secretKey: DB_PASSWORD
      remoteRef:
        key: prod/app/db
        property: password
```

After applying, if `kubectl get externalsecret -n prod` shows STATUS `SecretSynced`, you’re good. If you see `SecretSyncedError`, first check that the IRSA service account has `secretsmanager:GetSecretValue`.

## Failure-path checklist (three cases)

**1. Vault is sealed and deploys are fully stopped**

```bash
vault status                      # Sealed: true 확인
vault operator unseal <key-share-1>
vault operator unseal <key-share-2>
vault operator unseal <key-share-3>   # threshold 만큼 반복
```

Prevention is switching to KMS Auto-unseal. After you configure it, a restart unseals without human intervention.

```hcl
seal "awskms" {
  region     = "ap-northeast-2"
  kms_key_id = "arn:aws:kms:ap-northeast-2:<account-id>:key/<key-id>"
}
```

**2. You lost the age private key**

There is no recovery. Prevention is the only answer. Specify multiple recipients at encrypt time.

```bash
sops -e --age "age1<dev-key>,age1<backup-key>,age1<ci-key>" secrets/prod.yaml > secrets/prod.enc.yaml
# Add a recipient to an already-encrypted file: add the new public key to .sops.yaml first, then run
sops updatekeys secrets/prod.enc.yaml
```

To remove a recipient (someone leaving), delete the key from `.sops.yaml`, run `sops updatekeys`, then `sops rotate --in-place` to replace the data key ([SOPS key management](https://getsops.io/docs/usage/key-management/)). Old ciphertext in Git history can still be opened with the removed key, so rotate the secret values that person could see.

**3. You deleted an ASM secret and cannot recreate it under the same name**

ASM schedules deletion with a recovery window (30 days by default, configurable from 7 to 30), and a name in that window cannot be reused. If the secret has replicas, remove them first. After a forced delete, `aws secretsmanager describe-secret --secret-id prod/app/db` returning `ResourceNotFoundException` confirms it (there is a short delay).

```bash
# 복구 (권장)
aws secretsmanager restore-secret --secret-id prod/app/db --region ap-northeast-2

# 즉시 완전 삭제 후 재생성 — 복구 불가, 신중히
aws secretsmanager delete-secret --secret-id prod/app/db \
  --force-delete-without-recovery --region ap-northeast-2
```

## FAQ

**Q. At what secret count should you move to AWS Secrets Manager?**
A. There is no fixed count. On infrastructure alone SOPS is always cheaper; once ops time is included, the break-even formula above decides. At 150 secrets, for example, ASM costs `150 × $0.40 = $60`, so if SOPS key management and re-encryption take about 1.7 more hours a month than ASM (at $36/h), ASM is cheaper.

**Q. Do we have to rip out Vault because of the BSL change?**
A. Internal use for running your own services is generally fine. Legal review is needed only if you provide or resell secret-management to customers on top of Vault. If you want to avoid license risk entirely, the OpenBao fork is the alternative.

**Q. Can SOPS alone pass ISMS-P cryptographic-key management controls?**
A. You can submit change history (Git commits), but **there is no read history.** If a control requires access/read audit, SOPS alone may not be enough. Check the original control language and, if needed, consider pairing ASM (CloudTrail) or a Vault audit device.$q$::text))
WHERE id=815 AND md5(content_evidence->'en'->>'content')='4c511c5560185511453a879c0933702b';

-- post 814: 토큰 만료 연장(--service-account-extend-token-expiration) 반영, 버전표 기능 게이트 기준으로 정정, 레거시 토큰 정리 범위 정정, JWT 디코딩 명령 수정, PSS 오기재 정정
UPDATE posts SET content=$q$## 403은 3편, 401·"토큰 파일 없음"은 이번 편입니다

먼저 결론부터 말하면, **401 Unauthorized와 "토큰 파일이 없다"는 RBAC 문제가 아닙니다.** 이 둘은 아예 다른 층위입니다.

- **401 Unauthorized / 토큰 없음** → *인증(authentication)* 실패. "너 누구야?"에 대답을 못 한 상태. RBAC RoleBinding을 아무리 고쳐도 절대 안 고쳐집니다.
- **403 Forbidden** → *인가(authorization)* 실패. 신원은 확인됐는데 권한이 없는 상태. 이건 [K8s RBAC Forbidden 403 진단](/blog/k8s-livenessreadiness-probe-failedconnection-refused-원인별-해결) 계열의 접근이 필요합니다.

또 하나 경계를 그어둡니다. 기존에 발행한 [kubectl Unauthorized 원인별 3분 진단·복구 런북 (EKS 재발급)](/blog/kubectl-unauthorized-원인별-3분-진단복구-런북-eks-재발급)은 **내 노트북의 kubeconfig 인증**이 깨진 경우를 다룹니다. 이 글은 **Pod 내부에서 돌아가는 워크로드가 API 서버를 호출할 때** 쓰는 ServiceAccount 토큰이 주제입니다. 오퍼레이터, 사이드카, 인그레스 컨트롤러, in-cluster CI 러너처럼 컨테이너 안에서 `rest.InClusterConfig()`를 쓰는 코드가 대상입니다.

이 증상이 2022년 이후 급증한 배경은 명확합니다. Kubernetes 1.24에서 **ServiceAccount에 대한 Secret 자동 생성이 폐지**됐고, 그 이전부터 진행되던 BoundServiceAccountTokenVolume 전환으로 토큰이 **만료되는 단기 자격증명**으로 바뀌었기 때문입니다. 1.23 이하에서 잘 돌던 매니페스트를 1.24+ 클러스터에 그대로 올리면, 특히 `secretName`을 직접 참조하던 파이프라인이 조용히 깨집니다.

## 30초 판정표: 에러 원문 역인덱스

검색창에 친 문자열 그대로 아래 표에서 찾으세요. 각 행의 "점프" 열이 해당 처방 섹션입니다.

| 에러 원문 / 증상 | 1차 원인 갈래 | 점프 |
|---|---|---|
| `open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory` | automount 비활성(SA 또는 Pod 레벨) | [automount 우선순위](#a-automount-우선순위-pod가-sa를-이깁니다) |
| `Unauthorized` (본문 그대로 한 단어) | 토큰이 만료됐거나 앱이 옛 토큰을 캐싱 | [토큰 캐싱](#c-앱이-토큰을-한-번만-읽고-캐싱하는-함정) |
| `the server has asked for the client to provide credentials` | 토큰 자체가 요청에 안 붙음(경로 오인식·빈 파일) | [automount 우선순위](#a-automount-우선순위-pod가-sa를-이깁니다) |
| `token is expired` / `Token has expired` | 토큰 만료(아래 표의 만료 설명 참고) + 앱의 재읽기 미구현 | [토큰 캐싱](#c-앱이-토큰을-한-번만-읽고-캐싱하는-함정) |
| `serviceaccounts "xxx" not found` | SA 미생성 또는 네임스페이스 불일치 | [진단 2줄 컷](#버전별-동작-차이표와-진단-2줄-컷) |
| SA를 만들었는데 `kubectl get secret`에 토큰 Secret이 안 보임 | 1.24+ 정책 변경(자동 생성 폐지) | [장기 토큰이 필요할 때](#d-ci외부-시스템용-장기-토큰이-필요할-때) |
| 처방 다 했는데 여전히 401 | audience 불일치 / issuer 설정 / 노드 시계 오차 | [그래도 401일 때](#그래도-401일-때-실패-분기-체크리스트) |

## 버전별 동작 차이표와 진단 2줄 컷

이 경우 정답은 **"내 클러스터 마이너 버전부터 확인"**입니다. 같은 YAML이 버전에 따라 전혀 다르게 동작합니다.

| 버전 | 토큰 형태 | 만료 | SA Secret 자동 생성 | 갱신 주체 |
|---|---|---|---|---|
| ~1.20 | Secret 기반 레거시 JWT | 없음(무기한) | O (SA 생성 시 자동) | 없음 |
| 1.21 | projected 바운드 토큰 기본 마운트(BoundServiceAccountTokenVolume beta) | kubelet 요청 3607초, 연장 시 최대 1년(아래) | O | kubelet |
| 1.22~1.23 | 같음(GA) | 같음 | O | kubelet |
| 1.24~1.25 | projected 바운드 토큰 | 같음 | **X** (LegacyServiceAccountTokenNoAutoGeneration beta) — `kubectl create token` 사용 | kubelet |
| 1.26~1.28 | 같음 | 같음 | X (GA). 1.28부터 레거시 토큰 마지막 사용일 라벨 `kubernetes.io/legacy-token-last-used` GA | kubelet |
| 1.29 이상 | 같음 | 같음 | X. 자동 생성된 레거시 토큰 정리(1.29 beta, 1.30 GA) | kubelet + 정리 컨트롤러 |

**만료 시간 주의**: kubelet은 projected 토큰을 `expirationSeconds: 3607`로 요청하지만, kube-apiserver의 `--service-account-extend-token-expiration`(기본값 true)이 켜져 있으면 자동 주입 토큰의 만료가 최대 1년까지 늘어납니다. 그래서 기본 설정 클러스터에서 토큰을 디코딩하면 `exp`가 1시간 뒤가 아니라 훨씬 뒤로 보일 수 있습니다. 1시간 만료를 전제로 진단하지 말고, 아래 명령으로 실제 `exp`를 확인하세요([kube-apiserver 옵션](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/)). 관리형 서비스는 이 플래그 값을 바꿔 둘 수 있으니 공급자 문서를 확인합니다.

**레거시 토큰 정리 범위**: 1.29부터 정리 컨트롤러는 **자동 생성된** 레거시 토큰 Secret(ServiceAccount의 `secrets` 필드가 가리키는 것)만 다룹니다. 기본 1년 동안 쓰이지 않으면 `kubernetes.io/legacy-token-invalid-since` 라벨로 무효 처리하고, 다시 1년이 지나면 삭제합니다. 사람이 직접 만든 `kubernetes.io/service-account-token` Secret은 정리 대상이 아니지만 만료도 없으므로, 그런 토큰에 기대는 파이프라인은 유출 시 피해가 큽니다([Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)).

### 진단 명령 3종 (복붙용)

**1) SA 레벨 automount 설정 확인**

```bash
kubectl -n <ns> get sa <sa-name> -o jsonpath='{.metadata.name}{"  automount="}{.automountServiceAccountToken}{"\n"}'
```

예상 정상 결과: `my-sa  automount=` (비어 있으면 기본값 true라 마운트됨).
`automount=false`가 찍히면 → automount 갈래로 이동.

**2) Pod 안에 토큰 파일이 실제로 있는지 + 만료 시각 디코딩**

```bash
kubectl -n <ns> exec <pod> -- ls -l /var/run/secrets/kubernetes.io/serviceaccount/
kubectl -n <ns> exec <pod> -- cat /var/run/secrets/kubernetes.io/serviceaccount/token \
  | cut -d. -f2 | tr '_-' '/+' \
  | awk '{n=length($0)%4; if(n) $0=$0 substr("==",1,4-n); print}' \
  | base64 -d | jq '.exp, .iat, .aud, .sub'
```

예상 정상 결과: `ca.crt`, `namespace`, `token` 3개 파일이 보이고, JSON에 `exp`(만료 epoch), `aud`(대상 audience, 보통 `["https://kubernetes.default.svc"]`), `sub`(`system:serviceaccount:<ns>:<sa>`)가 출력됩니다.

분기:
- `No such file or directory` → automount 비활성. (a) 섹션.
- 파일은 있는데 `exp`가 현재 시각보다 과거 → 앱이 갱신된 파일을 다시 읽지 않았을 가능성. (c) 섹션.
- `aud`가 `sts.amazonaws.com` 같은 외부 값만 있음 → API 서버용 audience가 아님. 실패 분기 섹션.
- `base64: invalid input`이나 jq 파싱 오류 → 토큰 파일이 비었거나 JWT가 아님. JWT 본문은 패딩 없는 base64url이라 `base64 -d`에 그대로 넣으면 정상 토큰도 실패하므로, 위처럼 `tr`과 패딩 보정을 거칩니다.
- 이미지에 `cat`이 없으면(distroless) `kubectl debug`로 임시 컨테이너를 붙이거나 `kubectl create token`으로 발급 자체를 먼저 확인합니다.

**3) 토큰 발급 자체가 되는지 검증**

```bash
kubectl -n <ns> create token <sa-name> --duration=30m
```

정상이면 `eyJ...`로 시작하는 JWT가 출력됩니다. 여기서 `serviceaccounts "xxx" not found`가 나면 SA 자체가 없거나 네임스페이스를 잘못 본 것이고, 이건 RBAC이 아니라 오브젝트 부재 문제입니다.

## 원인별 처방

### (a) automount 우선순위: Pod가 SA를 이깁니다

이 경우 정답은 **"Pod spec의 설정이 ServiceAccount 설정을 덮어쓴다"**를 기억하는 것입니다. SA에서 켜 뒀어도 Pod에서 껐으면 안 붙습니다.

| SA `automountServiceAccountToken` | Pod spec `automountServiceAccountToken` | 결과 |
|---|---|---|
| 미지정(기본 true) | 미지정 | 마운트됨 ✅ |
| `false` | 미지정 | **마운트 안 됨** ❌ |
| `false` | `true` | 마운트됨 ✅ (Pod가 우선) |
| 미지정 / `true` | `false` | **마운트 안 됨** ❌ (Pod가 우선) |

두 값을 한 번에 보는 명령:

```bash
kubectl -n <ns> get pod <pod> -o jsonpath='{.spec.serviceAccountName}{" podAutomount="}{.spec.automountServiceAccountToken}{"\n"}'
```

흔한 원인은 보안 하드닝(CIS Kubernetes Benchmark 대응, Kyverno/OPA 정책)으로 `default` SA의 automount를 일괄로 끈 경우입니다. Pod Security Standards(restricted 포함)는 이 필드를 검사하지 않으므로, PSS만 켰다고 토큰이 사라지지는 않습니다. 정책은 유지하되, API를 호출해야 하는 워크로드만 Pod 레벨에서 예외 처리하는 방식이 안전합니다.

```yaml
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: true   # 정책으로 SA가 false여도 이 Pod만 예외
```

### (b) projected volume로 만료·audience 직접 제어

이 경우 정답은 **"automount에 맡기지 말고 projected volume을 명시"**입니다. 만료 시간과 audience를 코드가 기대하는 값으로 고정할 수 있습니다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-caller
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: false     # 기본 마운트는 끄고
  containers:
    - name: app
      image: my/app:1.0
      volumeMounts:
        - name: sa-token
          mountPath: /var/run/secrets/tokens
          readOnly: true
  volumes:
    - name: sa-token
      projected:
        sources:
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600      # 최소 600, 요청값은 클러스터 정책에 의해 조정될 수 있음
              audience: https://kubernetes.default.svc
```

`audience`를 지정하면 그 토큰은 해당 대상에만 유효합니다. EKS IRSA나 GKE Workload Identity가 바로 이 메커니즘을 씁니다 — 클라우드 STS용 audience 토큰을 별도 경로에 주입하죠. 그래서 **IRSA용 토큰 경로를 API 호출에 재사용하면 401**이 납니다. 두 토큰은 목적이 다릅니다.

### (c) 앱이 토큰을 한 번만 읽고 캐싱하는 함정

이 경우 정답은 **"파일을 주기적으로 다시 읽어라"**입니다. kubelet은 토큰 파일을 만료 전에 갱신해 주지만, 애플리케이션이 프로세스 시작 시 한 번 읽고 메모리에 들고 있으면 갱신본을 영원히 못 봅니다. 결과는 정확히 1시간 뒤 `Unauthorized` 또는 `token is expired`.

- **client-go 최신 버전**: `rest.InClusterConfig()` 경로로 만든 클라이언트는 토큰 파일 변경을 감지해 다시 읽습니다. 이 경우 보통 문제가 없습니다.
- **직접 `os.ReadFile`로 읽어 헤더에 붙이는 코드 / curl 스크립트 / 자체 HTTP 클라이언트**: 갱신을 못 봅니다. 여기가 대부분의 사고 지점입니다.

Go에서 매 요청마다 다시 읽는 최소 패턴:

```go
const tokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type reloadingTransport struct{ base http.RoundTripper }

func (t *reloadingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	b, err := os.ReadFile(tokenPath) // 매 요청 재읽기 (tmpfs라 비용 낮음)
	if err != nil {
		return nil, fmt.Errorf("SA 토큰 읽기 실패: %w", err)
	}
	r := req.Clone(req.Context())
	r.Header.Set("Authorization", "Bearer "+strings.TrimSpace(string(b)))
	return t.base.RoundTrip(r)
}
```

Bash/사이드카에서 호출한다면 변수에 담아두지 말고 매번 `$(cat ...)`로 읽는 것만으로 해결됩니다.

```bash
curl -sS --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  https://kubernetes.default.svc/api/v1/namespaces/default/pods
```

파이썬(`kubernetes` 클라이언트)의 경우도 `config.load_incluster_config()`를 프로세스 시작 시 한 번만 호출하고 장시간 구동하는 데몬이라면 주기적 재호출 또는 재인증 로직이 필요합니다.

### (d) CI·외부 시스템용 장기 토큰이 필요할 때

이 경우 정답은 **"수동 Secret 대신 `kubectl create token` 주기 갱신"**입니다.

```bash
# CI 파이프라인 스텝마다 짧게 발급 (권장)
TOKEN=$(kubectl -n ci create token ci-runner-sa --duration=1h)
```

| 방식 | 만료 | 유출 시 회수 | 감사 추적 | 권장 |
|---|---|---|---|---|
| `kubectl create token --duration` | 지정한 짧은 기간 | 만료로 자연 소멸 | 발급 이벤트 남음 | ✅ |
| 수동 `kubernetes.io/service-account-token` Secret | 사실상 무기한 | Secret 삭제로 즉시 회수 | 사용 추적 어려움 | ⚠️ 최후 수단 |
| 클라우드 워크로드 아이덴티티(IRSA/Pod Identity/GKE WI) | 단기 자동 갱신 | IAM 정책으로 통제 | 클라우드 감사로그 | ✅ (클라우드 한정) |

`--duration`은 API 서버의 `--service-account-max-token-expiration` 설정에 의해 상한이 걸릴 수 있습니다. 요청한 값보다 짧게 발급될 수 있으니 발급 후 `exp`를 디코딩해 실제 값을 확인하세요.

수동 Secret이 정말 불가피하다면(예: 토큰 갱신을 지원하지 않는 레거시 외부 시스템) 최소 권한 전용 SA를 별도로 만들고, 만료가 없다는 점을 리스크 등록부에 명시하고, 정기 로테이션 일정을 잡아두는 것이 최소한의 방어선입니다.

## 보안 관점: 끄기, 회수, 추적

**끄기.** `default` SA의 automount를 끄는 것은 좋은 기본값입니다. API를 호출하지 않는 대다수 워크로드에 자격증명을 뿌리지 않게 되니까요.

```bash
kubectl -n <ns> patch serviceaccount default -p '{"automountServiceAccountToken": false}'
```

파급 효과: 이 네임스페이스에서 `default` SA를 쓰면서 API를 호출하던 워크로드가 즉시 깨집니다. 적용 전에 해당 네임스페이스의 Pod들이 어떤 SA를 쓰는지 훑어보세요.

```bash
kubectl -n <ns> get pods -o custom-columns='POD:.metadata.name,SA:.spec.serviceAccountName'
```

**회수.** 여기가 중요합니다 — **바운드 토큰은 개별 무효화가 안 됩니다.**

| 토큰 유형 | 유출 시 회수 방법 |
|---|---|
| projected 바운드 토큰 | 토큰별 취소 API는 없음. 토큰이 묶인 **Pod를 삭제**하면 그 토큰은 무효가 됩니다. **SA 삭제·재생성**은 그 SA의 모든 토큰을 무효화하며, 이 SA를 쓰는 Pod 전부 재시작이 필요합니다. 만료를 기다리는 방법은 위 연장 설정 때문에 최대 1년일 수 있습니다 |
| 레거시 Secret 토큰 | 해당 Secret 삭제 → 즉시 무효 |
| 노드에 바인딩된 토큰 | 해당 Pod/노드 삭제 시 자동 무효화(바인딩 대상 소멸) |

바운드 토큰은 `.spec.boundObjectRef`로 Pod에 묶이기 때문에, Pod가 사라지면 토큰도 유효성을 잃습니다. 사고 대응 시 "Pod 삭제"가 곧 부분적 회수 조치가 되는 셈입니다.

**추적.** 감사로그(audit log)에서 특정 SA의 사용 이력을 뽑는 쿼리 패턴:

```bash
# 감사로그 JSON 라인에서 특정 SA의 호출만 추출
jq -c 'select(.user.username == "system:serviceaccount:prod:my-operator-sa")
       | {ts: .requestReceivedTimestamp, verb, uri: .requestURI, ip: .sourceIPs[0], code: .responseStatus.code}' \
  audit.log | head -50
```

`responseStatus.code`가 401이면 인증 실패, 403이면 인가 실패 — 로그 한 줄에서 이번 글의 주제인지 3편의 주제인지 바로 갈립니다. 예상치 못한 `sourceIPs`가 보이면 토큰 유출을 의심할 근거가 됩니다.

## 그래도 401일 때: 실패 분기 체크리스트

위 처방을 다 했는데도 401이면 순서대로 확인하세요.

1. **audience 불일치.** 토큰의 `aud`가 API 서버가 허용하는 값인지 확인합니다. `kubectl create token <sa> | cut -d. -f2 | base64 -d | jq .aud`로 기본 audience를 확인하고, Pod의 토큰과 비교하세요. IRSA/Workload Identity를 쓰는 클러스터에서 클라우드용 토큰을 API 호출에 잘못 쓰는 사례가 흔합니다.
2. **API 서버 설정.** `--service-account-issuer`, `--api-audiences`, `--service-account-key-file` 값이 발급/검증 양쪽에서 일관적인지 봅니다. 관리형 클러스터(EKS/GKE/AKS)는 직접 수정 불가이므로, 이 단계에서 이상하면 클라우드 공식 문서 확인이 필요합니다.
3. **노드 시계 오차.** `iat`/`nbf`가 미래로 잡히면 API 서버가 거부합니다. `kubectl exec <pod> -- date -u`와 컨트롤 플레인 시각을 비교하고, 노드의 NTP(chronyd/systemd-timesyncd) 동기화 상태를 확인하세요. 수 분 단위 오차만으로도 재현됩니다.
4. **인증 웹훅/프록시.** 사내 인증 프록시나 서비스 메시가 `Authorization` 헤더를 덮어쓰거나 제거하는지 확인합니다. mTLS 사이드카가 헤더를 재작성하는 구성에서 종종 발생합니다.
5. **토큰 파일 개행/공백.** 셸로 조립한 헤더에서 개행이 섞이면 헤더가 깨집니다. `tr -d '\n'` 또는 `TrimSpace`를 반드시 넣으세요.

### 재발 방지

- 배포 템플릿에 `automountServiceAccountToken`을 **명시적으로** 적어 기본값 변화에 흔들리지 않게 합니다.
- API를 호출하는 앱은 "토큰 재읽기" 여부를 코드리뷰 체크리스트에 넣습니다.
- 스테이징에서 `expirationSeconds: 600` 같은 짧은 만료로 돌려 만료 처리 버그를 조기에 노출시킵니다.
- 클러스터 업그레이드 전, 수동 SA 토큰 Secret과 `secretName` 참조를 전수 조사합니다.

```bash
kubectl get secrets -A --field-selector type=kubernetes.io/service-account-token
```

여기에 결과가 나온다면 1.24+ 환경에서 레거시 방식에 의존 중이라는 뜻입니다. 마이그레이션 대상 목록으로 삼으세요.

## 자주 묻는 질문 (FAQ)

**Q1. 1.24로 올렸더니 SA를 만들어도 Secret이 안 생깁니다. 버그인가요?**
버그가 아니라 의도된 변경입니다. 1.24부터 ServiceAccount 생성 시 토큰 Secret을 자동 생성하지 않습니다. 토큰이 필요하면 `kubectl create token <sa>`로 단기 토큰을 발급하거나, Pod에서는 projected volume(기본 automount)을 사용하세요.

**Q2. 401과 403 중 어느 쪽인지 로그만 보고 구분하는 방법은?**
HTTP 상태 코드로 갈립니다. 401은 "누군지 모르겠다"(토큰 없음·만료·서명 검증 실패), 403은 "누군지는 알겠는데 권한이 없다"입니다. 403 메시지에는 보통 `User "system:serviceaccount:ns:sa" cannot list resource ...`처럼 신원이 찍혀 있습니다. 신원이 찍혔으면 인증은 성공한 것이므로 RBAC을 보면 됩니다.

**Q3. 토큰이 주기적으로 바뀌는데 그때마다 앱을 재시작해야 하나요?**
아닙니다. kubelet이 만료 전에 토큰 파일을 갱신합니다. 앱이 파일을 다시 읽기만 하면 됩니다. 재시작이 필요한 상황이라면 그건 캐싱 버그이므로, 위의 재읽기 패턴을 적용하는 것이 정답입니다.

**Q4. `expirationSeconds`를 아주 길게(예: 1년) 설정할 수 있나요?**
요청은 할 수 있지만 API 서버 정책 상한에 의해 잘릴 수 있고, 보안상 권장되지 않습니다. 단기 자격증명이 제로트러스트 모델의 기본 전제이기 때문입니다. 장기 자격증명이 정말 필요한 외부 연동이라면 토큰 대신 클라우드 워크로드 아이덴티티나 주기적 재발급 파이프라인을 쓰는 편이 낫습니다.

**Q5. 토큰이 유출됐습니다. 즉시 무효화할 방법이 있나요?**
바운드 토큰은 개별 취소 API가 없습니다. 현실적인 선택지는 (1) 해당 SA를 삭제 후 재생성해 기존 토큰 전부를 무효화하고 관련 Pod를 재시작하거나, (2) 토큰이 Pod에 바인딩돼 있다면 그 Pod를 삭제하거나, (3) 만료를 기다리는 것입니다. 레거시 Secret 토큰이라면 Secret을 지우면 즉시 회수됩니다. 병행해서 감사로그로 유출 기간 동안의 호출 이력을 반드시 확인하세요.

**Q6. `default` SA의 automount를 끄면 어떤 게 깨지나요?**
그 네임스페이스에서 `default` SA를 쓰면서 API 서버를 호출하던 모든 Pod가 토큰 파일을 잃습니다. 대표적으로 일부 모니터링 에이전트, 서비스 디스커버리를 하는 앱, 자체 리더 선출 로직을 가진 앱이 영향을 받습니다. 적용 전에 네임스페이스의 Pod-SA 매핑을 조회하고, 필요한 Pod에는 Pod 레벨 `automountServiceAccountToken: true`로 예외를 주세요.

**Q7. EKS에서 IRSA를 쓰는데 API 서버 호출이 401입니다.**
IRSA가 주입하는 토큰(`AWS_WEB_IDENTITY_TOKEN_FILE`)은 audience가 `sts.amazonaws.com`으로, AWS STS 전용입니다. Kubernetes API 호출에는 `/var/run/secrets/kubernetes.io/serviceaccount/token`을 써야 합니다. 두 경로를 혼동하지 않았는지 먼저 확인하세요.

---

다음 5편에서는 **네트워크 레벨 차단 — NetworkPolicy와 mTLS 실패 진단**을 다룹니다. 인증도 인가도 통과했는데 연결 자체가 막히는 경우, `connection refused`와 `i/o timeout`을 어떻게 갈라내고 정책 규칙을 역추적할지 같은 방식의 판정표로 정리하겠습니다.$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$토큰 만료 연장(--service-account-extend-token-expiration) 반영, 버전표 기능 게이트 기준으로 정정, 레거시 토큰 정리 범위 정정, JWT 디코딩 명령 수정, PSS 오기재 정정$q$::text))
WHERE id=814 AND md5(content)='ef2d206f8d85281692dc2c8fb0367931';

UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$## Part 3 is 403; this part is 401 and "token file not found"

Let's start with the conclusion: **401 Unauthorized and "token file not found" are not RBAC problems.** They live on an entirely different layer.

- **401 Unauthorized / missing token** → *authentication* failure. You couldn't answer "who are you?" No amount of RoleBinding fixes will ever resolve this.
- **403 Forbidden** → *authorization* failure. Identity was verified, but you lack permission. That needs the approach in [Diagnosing Kubernetes RBAC Forbidden 403](/blog/k8s-livenessreadiness-probe-failedconnection-refused-원인별-해결).

One more boundary: the previously published [kubectl Unauthorized: 3-minute diagnosis and recovery runbook (EKS reissue)](/blog/kubectl-unauthorized-원인별-3분-진단복구-런북-eks-재발급) covers **broken kubeconfig authentication on your laptop**. This article is about the ServiceAccount token that **workloads running inside a Pod use when calling the API server**. The audience is code that uses `rest.InClusterConfig()` from inside a container — operators, sidecars, ingress controllers, in-cluster CI runners, and the like.

The reason this symptom exploded after 2022 is clear. Kubernetes 1.24 **stopped auto-creating Secrets for ServiceAccounts**, and the BoundServiceAccountTokenVolume migration that had already been underway turned tokens into **short-lived, expiring credentials**. If you take a manifest that worked on 1.23 or earlier and apply it unchanged to a 1.24+ cluster, pipelines that directly referenced `secretName` fail silently.

## 30-second triage table: reverse index by error text

Find the exact string you typed into the search box in the table below. The "Jump" column on each row points to the matching fix section.

| Error text / symptom | Primary cause | Jump |
|---|---|---|
| `open /var/run/secrets/kubernetes.io/serviceaccount/token: no such file or directory` | automount disabled (SA or Pod level) | [automount precedence](#a-automount-precedence-the-pod-wins-over-the-sa) |
| `Unauthorized` (the single word, as-is in the body) | Token expired, or the app is caching an old token | [token caching](#c-the-trap-of-reading-the-token-once-and-caching-it) |
| `the server has asked for the client to provide credentials` | Token never attached to the request (wrong path or empty file) | [automount precedence](#a-automount-precedence-the-pod-wins-over-the-sa) |
| `token is expired` / `Token has expired` | Token expiry (see the expiry notes in the table below) + app never re-reads the file | [token caching](#c-the-trap-of-reading-the-token-once-and-caching-it) |
| `serviceaccounts "xxx" not found` | SA never created, or namespace mismatch | [two-line diagnostic cut](#version-behavior-differences-and-a-two-line-diagnostic-cut) |
| You created an SA but `kubectl get secret` shows no token Secret | Policy change in 1.24+ (auto-creation removed) | [when you need a long-lived token](#d-when-you-need-a-long-lived-token-for-ci-or-external-systems) |
| You applied every fix and still get 401 | Audience mismatch / issuer config / node clock skew | [still getting 401](#still-getting-401-failure-branch-checklist) |

## Version behavior differences and a two-line diagnostic cut

The answer here is **"start by checking your cluster's minor version."** The same YAML behaves completely differently depending on the version.

| Version | Token form | Expiry | SA Secret auto-creation | Who renews |
|---|---|---|---|---|
| ~1.20 | Secret-based legacy JWT | None (never expires) | Yes (automatic on SA creation) | None |
| 1.21 | Projected bound token mounted by default (BoundServiceAccountTokenVolume beta) | kubelet requests 3607 s; up to 1 year when extended (below) | Yes | kubelet |
| 1.22~1.23 | Same (GA) | Same | Yes | kubelet |
| 1.24~1.25 | Projected bound token | Same | **No** (LegacyServiceAccountTokenNoAutoGeneration beta) — use `kubectl create token` | kubelet |
| 1.26~1.28 | Same | Same | No (GA). From 1.28 the legacy-token last-used label `kubernetes.io/legacy-token-last-used` is GA | kubelet |
| 1.29+ | Same | Same | No. Cleanup of auto-generated legacy tokens (beta 1.29, GA 1.30) | kubelet + cleanup controller |

**Expiry caveat**: kubelet requests projected tokens with `expirationSeconds: 3607`, but when kube-apiserver’s `--service-account-extend-token-expiration` is on (default true), admission-injected tokens are extended up to one year. On a default cluster the decoded `exp` can therefore be far later than one hour. Don’t diagnose on a one-hour assumption; check the real `exp` with the command below ([kube-apiserver flags](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/)). Managed services may set this flag differently, so check the provider’s docs.

**Legacy-token cleanup scope**: from 1.29 the cleaner only handles **auto-generated** legacy token Secrets (the ones referenced from the ServiceAccount’s `secrets` field). After one unused year (default) it marks them invalid with the `kubernetes.io/legacy-token-invalid-since` label, and deletes them after another year. Manually created `kubernetes.io/service-account-token` Secrets are not cleaned up, but they never expire either, so a pipeline that depends on one carries a large blast radius if it leaks ([Managing Service Accounts](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/)).

### Three diagnostic commands (copy-paste ready)

**1) Check SA-level automount settings**

```bash
kubectl -n <ns> get sa <sa-name> -o jsonpath='{.metadata.name}{"  automount="}{.automountServiceAccountToken}{"\n"}'
```

Expected healthy result: `my-sa  automount=` (empty means the default of true, so it is mounted).
If you see `automount=false` → go to the automount branch.

**2) Confirm the token file actually exists inside the Pod, and decode the expiry**

```bash
kubectl -n <ns> exec <pod> -- ls -l /var/run/secrets/kubernetes.io/serviceaccount/
kubectl -n <ns> exec <pod> -- cat /var/run/secrets/kubernetes.io/serviceaccount/token \
  | cut -d. -f2 | tr '_-' '/+' \
  | awk '{n=length($0)%4; if(n) $0=$0 substr("==",1,4-n); print}' \
  | base64 -d | jq '.exp, .iat, .aud, .sub'
```

Expected healthy result: you see the three files `ca.crt`, `namespace`, and `token`, and the JSON prints `exp` (expiry epoch), `aud` (audience, usually `["https://kubernetes.default.svc"]`), and `sub` (`system:serviceaccount:<ns>:<sa>`).

Branches:
- `No such file or directory` → automount is disabled. Section (a).
- File exists but `exp` is in the past → the app likely never re-read the renewed file. Section (c).
- `aud` contains only an external value like `sts.amazonaws.com` → this is not an API-server audience. See the failure-branch section.
- `base64: invalid input` or a jq parse error → the token file is empty or not a JWT. The JWT payload is unpadded base64url, so piping it straight into `base64 -d` fails even for valid tokens; that is why the command translates characters and restores padding first.
- If the image has no `cat` (distroless), attach an ephemeral container with `kubectl debug`, or check issuance first with `kubectl create token`.

**3) Verify that token issuance itself works**

```bash
kubectl -n <ns> create token <sa-name> --duration=30m
```

If healthy, you get a JWT starting with `eyJ...`. If you get `serviceaccounts "xxx" not found`, the SA itself is missing or you looked at the wrong namespace — that's a missing-object problem, not RBAC.

## Fixes by cause

### (a) automount precedence: the Pod wins over the SA

The answer here is to remember that **"the Pod spec overrides the ServiceAccount setting."** Even if you turned it on at the SA, it will not be mounted if the Pod turned it off.

| SA `automountServiceAccountToken` | Pod spec `automountServiceAccountToken` | Result |
|---|---|---|
| Unspecified (default true) | Unspecified | Mounted ✅ |
| `false` | Unspecified | **Not mounted** ❌ |
| `false` | `true` | Mounted ✅ (Pod wins) |
| Unspecified / `true` | `false` | **Not mounted** ❌ (Pod wins) |

Command to see both values at once:

```bash
kubectl -n <ns> get pod <pod> -o jsonpath='{.spec.serviceAccountName}{" podAutomount="}{.spec.automountServiceAccountToken}{"\n"}'
```

A common cause is hardening (CIS Kubernetes Benchmark work, Kyverno/OPA policies) that bulk-disables automount on the `default` SA. Pod Security Standards (including restricted) do not check this field, so enabling PSS alone does not remove the token. Keep the policy, but carve out a Pod-level exception only for workloads that actually need to call the API.

```yaml
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: true   # 정책으로 SA가 false여도 이 Pod만 예외
```

### (b) Control expiry and audience directly with a projected volume

The answer here is **"don't rely on automount — declare a projected volume."** You can pin expiry and audience to the values your code expects.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: api-caller
spec:
  serviceAccountName: my-operator-sa
  automountServiceAccountToken: false     # 기본 마운트는 끄고
  containers:
    - name: app
      image: my/app:1.0
      volumeMounts:
        - name: sa-token
          mountPath: /var/run/secrets/tokens
          readOnly: true
  volumes:
    - name: sa-token
      projected:
        sources:
          - serviceAccountToken:
              path: token
              expirationSeconds: 3600      # 최소 600, 요청값은 클러스터 정책에 의해 조정될 수 있음
              audience: https://kubernetes.default.svc
```

Setting `audience` makes the token valid only for that audience. EKS IRSA and GKE Workload Identity use exactly this mechanism — they inject a cloud-STS audience token at a separate path. That's why **reusing the IRSA token path for API calls produces 401**. The two tokens serve different purposes.

### (c) The trap of reading the token once and caching it

The answer here is **"re-read the file periodically."** kubelet renews the token file before it expires, but if the application reads it once at process start and holds it in memory, it will never see the renewed copy. The result is `Unauthorized` or `token is expired` exactly one hour later.

- **Recent client-go**: clients built via `rest.InClusterConfig()` detect token-file changes and re-read. This path is usually fine.
- **Code that `os.ReadFile`s once and stuffs it into a header / curl scripts / homegrown HTTP clients**: they never see the renewal. This is where most incidents happen.

Minimal Go pattern that re-reads on every request:

```go
const tokenPath = "/var/run/secrets/kubernetes.io/serviceaccount/token"

type reloadingTransport struct{ base http.RoundTripper }

func (t *reloadingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	b, err := os.ReadFile(tokenPath) // 매 요청 재읽기 (tmpfs라 비용 낮음)
	if err != nil {
		return nil, fmt.Errorf("SA 토큰 읽기 실패: %w", err)
	}
	r := req.Clone(req.Context())
	r.Header.Set("Authorization", "Bearer "+strings.TrimSpace(string(b)))
	return t.base.RoundTrip(r)
}
```

If you call from Bash or a sidecar, don't stash the token in a variable — just `$(cat ...)` every time and you're done.

```bash
curl -sS --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
  -H "Authorization: Bearer $(cat /var/run/secrets/kubernetes.io/serviceaccount/token)" \
  https://kubernetes.default.svc/api/v1/namespaces/default/pods
```

Same for Python (`kubernetes` client): if you call `config.load_incluster_config()` once at process start and run as a long-lived daemon, you need periodic re-load or re-auth logic.

### (d) When you need a long-lived token for CI or external systems

The answer here is **"periodic `kubectl create token` instead of a hand-made Secret."**

```bash
# CI 파이프라인 스텝마다 짧게 발급 (권장)
TOKEN=$(kubectl -n ci create token ci-runner-sa --duration=1h)
```

| Method | Expiry | Revocation on leak | Audit trail | Recommended |
|---|---|---|---|---|
| `kubectl create token --duration` | Specified short period | Natural expiry | Issuance event is recorded | ✅ |
| Manual `kubernetes.io/service-account-token` Secret | Effectively never | Immediate via Secret deletion | Hard to track usage | ⚠️ last resort |
| Cloud workload identity (IRSA / Pod Identity / GKE WI) | Short-lived, auto-renewed | Controlled by IAM policy | Cloud audit logs | ✅ (cloud only) |

`--duration` can be capped by the API server's `--service-account-max-token-expiration`. The issued token may be shorter than requested, so decode `exp` after issuance and check the actual value.

If a manual Secret is truly unavoidable (e.g., a legacy external system that cannot refresh tokens), create a dedicated least-privilege SA, record the lack of expiry in your risk register, and put a regular rotation schedule on the calendar. That's the minimum defensive line.

## Security: disable, revoke, track

**Disable.** Turning off automount on the `default` SA is a good default. You stop spraying credentials onto the majority of workloads that never call the API.

```bash
kubectl -n <ns> patch serviceaccount default -p '{"automountServiceAccountToken": false}'
```

Blast radius: any workload in this namespace that uses the `default` SA and calls the API will break immediately. Before applying, scan which SA each Pod in the namespace uses.

```bash
kubectl -n <ns> get pods -o custom-columns='POD:.metadata.name,SA:.spec.serviceAccountName'
```

**Revoke.** This is the important part — **bound tokens cannot be invalidated individually.**

| Token type | How to revoke on leak |
|---|---|
| Projected bound token | No per-token revoke API. **Deleting the Pod** the token is bound to invalidates that token. **Deleting and recreating the SA** invalidates every token for that SA, and all Pods using it must be restarted. Waiting for expiry can take up to a year because of the extension setting above |
| Legacy Secret token | Delete the Secret → immediately invalid |
| Node-bound token | Automatically invalid when the Pod/node is deleted (the binding target is gone) |

Bound tokens are tied to a Pod via `.spec.boundObjectRef`, so when the Pod disappears the token loses validity. In incident response, "delete the Pod" is itself a partial revocation action.

**Track.** Query pattern to extract a given SA's usage history from the audit log:

```bash
# 감사로그 JSON 라인에서 특정 SA의 호출만 추출
jq -c 'select(.user.username == "system:serviceaccount:prod:my-operator-sa")
       | {ts: .requestReceivedTimestamp, verb, uri: .requestURI, ip: .sourceIPs[0], code: .responseStatus.code}' \
  audit.log | head -50
```

If `responseStatus.code` is 401 it's an authentication failure; 403 is authorization — one log line tells you whether this article or part 3 applies. Unexpected `sourceIPs` are grounds to suspect a token leak.

## Still getting 401: failure-branch checklist

If you've applied every fix above and still get 401, check these in order.

1. **Audience mismatch.** Confirm the token's `aud` is a value the API server accepts. Check the default audience with `kubectl create token <sa> | cut -d. -f2 | base64 -d | jq .aud` and compare it to the Pod's token. On clusters using IRSA/Workload Identity, mistakenly using the cloud token for API calls is a common case.
2. **API server flags.** Check that `--service-account-issuer`, `--api-audiences`, and `--service-account-key-file` are consistent on both the issue and verify sides. Managed clusters (EKS/GKE/AKS) cannot be edited directly, so if something looks off at this step you need the cloud vendor's official docs.
3. **Node clock skew.** If `iat`/`nbf` is in the future, the API server rejects the token. Compare `kubectl exec <pod> -- date -u` with control-plane time, and check the node's NTP (chronyd/systemd-timesyncd) sync status. A skew of just a few minutes is enough to reproduce this.
4. **Auth webhook/proxy.** Check whether an in-house auth proxy or service mesh is overwriting or stripping the `Authorization` header. This often shows up in setups where an mTLS sidecar rewrites headers.
5. **Newlines/whitespace in the token file.** If a newline sneaks into a header assembled in the shell, the header breaks. Always use `tr -d '\n'` or `TrimSpace`.

### Preventing recurrence

- Set `automountServiceAccountToken` **explicitly** in deploy templates so default-value changes don't shake you.
- For apps that call the API, put "does it re-read the token?" on the code-review checklist.
- In staging, run with a short expiry like `expirationSeconds: 600` so expiry-handling bugs surface early.
- Before a cluster upgrade, inventory every hand-made SA token Secret and every `secretName` reference.

```bash
kubectl get secrets -A --field-selector type=kubernetes.io/service-account-token
```

If this returns results, you are still depending on the legacy path in a 1.24+ environment. Treat the output as your migration backlog.

## FAQ

**Q1. After upgrading to 1.24, creating an SA no longer creates a Secret. Is this a bug?**
No — it's an intentional change. From 1.24, creating a ServiceAccount no longer auto-creates a token Secret. If you need a token, issue a short-lived one with `kubectl create token <sa>`, or use a projected volume (the default automount) inside the Pod.

**Q2. How do I tell 401 from 403 from logs alone?**
Split on the HTTP status code. 401 is "I don't know who you are" (missing/expired token or signature verification failure); 403 is "I know who you are, but you don't have permission." A 403 message usually includes the identity, like `User "system:serviceaccount:ns:sa" cannot list resource ...`. If the identity is printed, authentication succeeded — look at RBAC.

**Q3. The token rotates periodically — do I have to restart the app each time?**
No. kubelet renews the token file before it expires. The app just has to re-read the file. If a restart is required, that's a caching bug — apply the re-read pattern above.

**Q4. Can I set `expirationSeconds` very long (e.g. one year)?**
You can request it, but the API server policy cap may truncate it, and it is not recommended for security. Short-lived credentials are a baseline assumption of a zero-trust model. If an external integration truly needs long-lived credentials, prefer cloud workload identity or a periodic re-issue pipeline over a long-lived token.

**Q5. A token leaked. Can I invalidate it immediately?**
Bound tokens have no per-token cancel API. Realistic options are (1) delete and recreate the SA to invalidate every existing token and restart related Pods, (2) if the token is bound to a Pod, delete that Pod, or (3) wait for expiry. For a legacy Secret token, deleting the Secret revokes it immediately. In parallel, always pull the call history for the leak window from the audit log.

**Q6. What breaks if I turn off automount on the `default` SA?**
Every Pod in that namespace that uses the `default` SA and calls the API server loses its token file. Typical casualties include some monitoring agents, apps that do service discovery, and apps with their own leader-election logic. Before applying, query the namespace's Pod-to-SA mapping and grant a Pod-level `automountServiceAccountToken: true` exception where needed.

**Q7. I'm using IRSA on EKS and API server calls return 401.**
The token IRSA injects (`AWS_WEB_IDENTITY_TOKEN_FILE`) has audience `sts.amazonaws.com` — it is AWS STS only. Kubernetes API calls must use `/var/run/secrets/kubernetes.io/serviceaccount/token`. First check that you didn't mix up the two paths.

---

In part 5 we'll cover **network-level blocking — diagnosing NetworkPolicy and mTLS failures**. When authentication and authorization both pass but the connection itself is blocked, we'll use the same style of lookup table to split `connection refused` from `i/o timeout` and reverse-engineer the policy rules.$q$::text))
WHERE id=814 AND md5(content_evidence->'en'->>'content')='8d0f28f43c108c597421f26d13b3835d';

-- post 813: PostgreSQL 14+ 오류 메시지 형식(no encryption/SSL encryption, connection to server at) 반영, include·정규식 지원 버전을 16으로 정정
UPDATE posts SET content=$q$## 에러 메시지를 읽는 순서가 틀려서 30분을 날린다

장애 상황에서 가장 자주 반복되는 오진 패턴은 두 가지입니다.

- `FATAL: no pg_hba.conf entry for host ...`를 보고 방화벽·보안그룹을 30분 동안 뒤진다.
- `could not connect to server: Connection refused`를 보고 `pg_hba.conf`를 열어 `0.0.0.0/0 trust`를 추가한다.

둘 다 계층을 잘못 짚은 경우입니다. PostgreSQL 접속은 아래 세 단계를 **순서대로** 통과합니다.

1. **TCP 도달** — 클라이언트 패킷이 postmaster가 listen 중인 소켓까지 도착하는가
2. **pg_hba 룰 매칭** — 접속 정보(TYPE/DB/USER/소스IP)와 일치하는 라인이 있는가
3. **인증 검증** — 매칭된 라인의 METHOD로 자격 증명이 통과하는가

중요한 사실은 **각 단계가 서로 다른 문구를 낸다**는 점입니다. 즉 에러 원문 자체가 이미 "몇 번 단계에서 떨어졌는지"를 알려주고 있습니다. `Connection refused`가 떴다면 서버는 아직 여러분의 요청을 본 적도 없으므로 pg_hba.conf 수정은 100% 무의미하고, `password authentication failed`가 떴다면 pg_hba 라인은 이미 매칭에 성공한 상태이므로 pg_hba를 더 만지는 건 시간 낭비입니다.

이 글은 PostgreSQL 12~17, Linux(Debian/Ubuntu·RHEL 계열) 및 Docker/Kubernetes/관리형 DB 환경을 대상으로, 에러 원문 → 계층 → 첫 명령을 30초 안에 매핑하는 절차를 정리합니다.

## 에러 원문 대조표: 6종 메시지를 3계층에 매핑한다

먼저 지금 보고 있는 에러를 아래 표에서 찾으세요. 해당 행의 "첫 확인 명령"만 실행하면 됩니다.

| # | 에러 원문 | 계층 | 첫 확인 명령 | 흔한 오진 방향 |
|---|---|---|---|---|
| (a) | `psql: error: connection to server at "10.0.3.10", port 5432 failed: Connection refused` (libpq 14+; 13 이하는 `could not connect to server: Connection refused ... Is the server running on host "10.0.3.10" and accepting TCP/IP connections on port 5432?`) | 네트워크 | `ss -lntp \| grep 5432` | pg_hba.conf 편집 (무의미) |
| (b) | `FATAL: no pg_hba.conf entry for host "10.0.3.51", user "app", database "prod", no encryption` (서버 14+; 13 이하는 `SSL off`) | pg_hba | `SELECT * FROM pg_hba_file_rules;` | 방화벽/보안그룹 점검 |
| (c) | `FATAL: no pg_hba.conf entry for host "10.0.3.51", user "app", database "prod", SSL encryption` (서버 14+; 13 이하는 `SSL on`) | pg_hba | 동일 + `hostnossl` 라인 확인 | "SSL을 꺼야 하나" 삽질 |
| (d) | `FATAL: password authentication failed for user "app"` | 인증 | `SELECT rolname, substring(rolpassword,1,4) FROM pg_authid;` | pg_hba 재편집 (이미 통과함) |
| (e) | `psql: error: FATAL: Peer authentication failed for user "app"` | 인증 + 로컬 소켓 | `psql -h 127.0.0.1 -U app -d prod` | 비밀번호 재설정 반복 |
| (f) | `FATAL: sorry, too many clients already` | 세션 슬롯 (범위 밖) | `SHOW max_connections;` | 이미 pg_hba·인증 통과 상태 |

몇 가지 해석 규칙을 못 박아 둡니다.

**(a) 네트워크 계층.** 서버 프로세스가 죽었거나, `listen_addresses`가 `localhost`이거나, 방화벽/보안그룹/컨테이너 포트 매핑에서 막힌 상태입니다. 로컬 루프백에서 같은 증상이 나오는 경우의 일반 디버깅 절차는 [connection refused / ECONNREFUSED 127.0.0.1 30초 진단 런북](/blog/connection-refused-econnrefused-127001-30초-진단-런북)에 정리되어 있으니 그쪽을 먼저 보세요. 여기서는 PostgreSQL 고유 항목만 다룹니다.

**(b)와 (c)의 끝부분(14+ `no encryption` / `SSL encryption`, 13 이하 `SSL off` / `SSL on`)은 원인이 아니라 "접속 방식 기록"입니다.** 아래에서는 13 이하 표기로 설명합니다. 메시지 형식은 PostgreSQL 14에서 바뀌었습니다(서버 `auth.c`, libpq `fe-connect.c` 소스 기준). 서버가 "이 접속은 평문/TLS였다"고 사실을 진술하는 것뿐입니다. 그래서 해석은 정반대가 됩니다.

- `SSL off` → 클라이언트가 평문으로 붙었는데 서버에는 `hostssl` 라인만 있다. → 클라이언트에 `sslmode=require`를 주거나 `host` 라인을 만든다.
- `SSL on` → TLS로 붙었는데 `hostnossl`만 있거나, ADDRESS CIDR가 실제 소스 IP를 포함하지 않는다.

두 경우 모두 "매칭되는 라인이 하나도 없다"는 같은 결론이며, 차이는 어떤 TYPE의 라인을 만들어야 하느냐에 있습니다.

**(d)는 pg_hba가 이미 통과했다는 증거입니다.** 매칭된 라인의 METHOD(`scram-sha-256`/`md5`)로 인증을 시도했고 실패한 것이므로, 분기는 ①비밀번호 오타 ②해시 알고리즘 불일치 ③롤 미존재 셋뿐입니다.

**(e)는 `-h` 없이 붙어 유닉스 소켓 경로를 탄 경우**입니다. `peer` 인증은 OS 계정명과 DB 롤명이 같아야 통과합니다. `psql -h 127.0.0.1`로 바꿔 증상이 달라지면 즉시 확진입니다.

**(f)는 이 글의 범위 밖**입니다. 판정 정보 한 줄만: 이 메시지가 나왔다는 건 네트워크·pg_hba·인증을 모두 통과했다는 뜻입니다. 원인과 복구는 [PostgreSQL too many clients already 30초 판정 복구 런북](/blog/postgresql-too-many-clients-already-30초-판정-복구-런북)과 [PostgreSQL 'too many clients already' 5분 진단부터 PgBouncer 해결까지](/blog/postgresql-too-many-clients-already-5분-진단부터-pgbouncer-해결까지)를 참고하세요.

## 3계층 진단 순서: 명령 6개로 원인 위치를 확정한다

표에서 계층을 좁혔다면 아래 고정 시퀀스를 순서대로 실행합니다. 각 명령마다 **예상 정상 출력**과 **다를 때의 분기**를 붙였습니다.

### 1단계 — `ss -lntp`로 리슨 소켓 확인 (서버에서 실행)

```bash
sudo ss -lntp | grep 5432
```

예상 출력(원격 접속 가능 상태):

```
LISTEN 0  244  0.0.0.0:5432  0.0.0.0:*  users:(("postgres",pid=1234,fd=7))
LISTEN 0  244     [::]:5432     [::]:*  users:(("postgres",pid=1234,fd=7))
```

분기:

- `127.0.0.1:5432`만 보인다 → **원격 접속 불가 확정**. `listen_addresses='localhost'` 상태이며 pg_hba를 아무리 고쳐도 (a) 에러가 계속됩니다.
- 아무 줄도 없다 → 서버가 죽었거나 다른 포트. `systemctl status postgresql` / `journalctl -u postgresql -n 50`.

### 2단계 — 구동 중 프로세스의 실제 값 확인

설정 파일을 눈으로 읽는 대신 반드시 실행 중 값을 조회하세요. `listen_addresses`를 고치고 reload만 하면 값이 반영되지 않기 때문에, 파일과 실제 값이 어긋난 상태가 흔합니다.

```sql
SHOW listen_addresses;
SHOW port;
SHOW hba_file;
SHOW config_file;
```

예상 출력:

```
 listen_addresses
------------------
 *

 port
------
 5432

              hba_file
-------------------------------------
 /etc/postgresql/16/main/pg_hba.conf
```

분기: `hba_file` 경로가 여러분이 편집한 파일과 다르면 그 자체가 원인입니다. 패키지 설치본은 `/etc/postgresql/<major>/main/`, 소스 빌드·RHEL 계열은 `/var/lib/pgsql/<major>/data/`, 공식 Docker 이미지는 `/var/lib/postgresql/data/pg_hba.conf`를 씁니다.

### 3단계 — 원격에서 실제 접속 시도

```bash
psql "host=10.0.3.10 port=5432 user=app dbname=prod sslmode=prefer" -c 'select 1'
```

여기서 나온 에러 원문을 다시 2장 표에 대입합니다. 이 시점부터는 추측이 아니라 표 기반 판정입니다.

### 4단계 — 서버 로그에 기록된 실제 소스 IP 확인

```sql
ALTER SYSTEM SET log_connections = on;
SELECT pg_reload_conf();
```

로그 예시:

```
2026-08-25 10:12:33 KST [2311] LOG:  connection received: host=10.0.7.88 port=51422
2026-08-25 10:12:33 KST [2311] FATAL:  no pg_hba.conf entry for host "10.0.7.88", user "app", database "prod", SSL off
```

분기: 서버가 기록한 IP가 여러분이 아는 클라이언트 IP와 다르다면 LB/NAT/사이드카가 소스 IP를 치환한 것입니다. 뒤의 "환경별 분기"로 바로 점프하세요. IP 기반 룰 디버깅은 **로그에 찍힌 IP가 진실**입니다.

### 5단계 — 룰 파싱 결과를 SQL로 확인 (PG 10+)

```sql
SELECT line_number, type, database, user_name, address, netmask, auth_method, error
FROM pg_hba_file_rules
ORDER BY line_number;
```

예상 출력:

```
 line_number |  type   | database | user_name |  address  |    netmask    |  auth_method   | error
-------------+---------+----------+-----------+-----------+---------------+----------------+-------
          89 | local   | {all}    | {all}     |           |               | peer           |
          92 | host    | {all}    | {all}     | 127.0.0.1 | 255.255.255.0 | scram-sha-256  |
          95 | host    | {prod}   | {app}     | 10.0.3.0  | 255.255.255.0 | scram-sha-256  |
```

분기: `error` 컬럼이 NULL이 아니면 그 줄은 **로드되지 않았습니다**. 오타·잘못된 CIDR·존재하지 않는 METHOD가 대표 원인입니다. 다음 쿼리를 습관처럼 돌리세요.

```sql
SELECT line_number, error FROM pg_hba_file_rules WHERE error IS NOT NULL;
```

## pg_hba.conf 문법과 첫 매치 규칙: 넓은 reject 한 줄이 전체를 무력화한다

라인 문법은 다음과 같습니다.

```
TYPE  DATABASE  USER  ADDRESS  METHOD  [OPTIONS]
```

TYPE 값의 의미와 (b)(c) 에러의 연결:

| TYPE | 대상 | 관련 에러 |
|---|---|---|
| `local` | 유닉스 도메인 소켓 (`-h` 미지정) | (e) Peer authentication failed |
| `host` | TCP, 평문·TLS 모두 매칭 | (b)(c) 양쪽 모두 해결 가능 |
| `hostssl` | TLS 접속만 매칭 | `SSL off`로 붙으면 (b) 발생 |
| `hostnossl` | 평문 접속만 매칭 | TLS로 붙으면 (c) 발생 |

ADDRESS는 CIDR 표기(`10.0.3.0/24`, `10.0.3.51/32`)를 쓰며, `all`·`samehost`·`samenet` 키워드도 사용할 수 있습니다.

### 첫 매치 우선 규칙

PostgreSQL은 파일을 **위에서부터 스캔하다 처음 매치되는 라인에서 멈추고**, 그 라인의 METHOD로 인증합니다. **실패해도 아래 라인으로 내려가지 않습니다.** 이 규칙을 모르면 아래 같은 파일을 만들고 "분명히 라인을 추가했는데 왜 안 되지"로 몇 시간을 씁니다.

Before — 아래 라인이 영원히 무시되는 파일:

```conf
# TYPE  DATABASE  USER  ADDRESS        METHOD
local   all       all                  peer
host    all       all   127.0.0.1/32   scram-sha-256
host    all       all   0.0.0.0/0      reject        # ← 여기서 모든 원격 접속이 종결됨
host    prod      app   10.0.3.0/24    scram-sha-256 # ← 도달 불가 (죽은 룰)
```

After — 구체적인 허용을 먼저, 포괄 거부를 마지막에:

```conf
# TYPE     DATABASE  USER  ADDRESS        METHOD
local      all       all                  peer
host       all       all   127.0.0.1/32   scram-sha-256

# 변경1: 앱 서버 서브넷만 TLS 강제로 허용 (구체적 룰을 위로 이동)
hostssl    prod      app   10.0.3.0/24    scram-sha-256

# 변경2: 같은 대상의 평문 접속은 명시적으로 차단
hostnossl  prod      app   10.0.3.0/24    reject

# 변경3: 포괄 거부는 반드시 마지막 줄로 (기존 3번째 줄에서 이동)
host       all       all   0.0.0.0/0      reject
```

죽은 룰을 눈으로 확인하려면 `pg_hba_file_rules`의 `line_number` 순서와 위 규칙을 대조하면 됩니다. 넓은 `reject`보다 아래에 있는 허용 라인은 전부 무효라고 보면 됩니다.

### METHOD 의사결정표

| METHOD | 보안 등급 | 클라이언트 호환성 | 권장 용도 |
|---|---|---|---|
| `trust` | 없음 (무인증) | 전부 | **운영 금지.** 초기 부트스트랩 한정, 반드시 티켓화 |
| `peer` | 중 (OS 계정 신뢰) | `local` 전용 | 서버 로컬 유지보수(postgres 계정) |
| `ident` | 중 | ident 서버 필요 | 레거시 내부망, 신규 도입 비권장 |
| `md5` | 낮음 (레거시 해시) | 구형 JDBC/psycopg2 포함 전부 | 구형 드라이버 호환 목적의 한시적 사용 |
| `scram-sha-256` | 높음 | PG 10+ 서버, 최신 드라이버 | **기본 권장값** |
| `cert` | 매우 높음 (mTLS) | 클라이언트 인증서 배포 필요 | 인터넷 경유·규제 환경 |

### PG 14 분기: scram으로 바꿨는데 (d) 에러가 계속되는 경우

PostgreSQL 14부터 `password_encryption` 기본값이 `scram-sha-256`으로 바뀌었습니다. 문제는 **기존 사용자 비밀번호는 여전히 md5 해시로 저장돼 있다**는 점입니다. pg_hba만 `scram-sha-256`으로 바꾸면 저장된 해시와 인증 방식이 어긋나 `password authentication failed`가 납니다.

진단:

```sql
SELECT rolname, substring(rolpassword, 1, 4) AS hash_prefix
FROM pg_authid
WHERE rolcanlogin;
```

예상 출력:

```
 rolname  | hash_prefix
----------+-------------
 postgres | SCRA
 app      | md5          ← 이 줄이 원인
```

복구(비밀번호를 다시 설정해 재해싱):

```sql
SET password_encryption = 'scram-sha-256';
ALTER USER app WITH PASSWORD '새비밀번호';
```

확인 — `hash_prefix`가 `SCRA`로 바뀌었는지 재조회한 뒤 실제 접속 검증:

```bash
psql "host=10.0.3.10 user=app dbname=prod sslmode=require" -c 'select current_user'
```

`SET`은 세션 한정이므로, 앞으로 만들 계정에도 적용하려면 `postgresql.conf`의 `password_encryption`을 확인하세요. 구형 JDBC(9.4.12 미만) 등 SCRAM 미지원 드라이버가 남아 있다면 드라이버 업그레이드가 정공법이고, `md5`는 어디까지나 임시 우회입니다.

### 버전별 차이

| 버전 | 기본 해시 | pg_hba 관련 기능 |
|---|---|---|
| 9.6~13 | md5 | `include` 지시자 없음, `pg_hba_file_rules`는 10부터 |
| 14 | scram-sha-256으로 전환 | 기존 md5 사용자 재해싱 필요 |
| 15 | scram-sha-256 | 14와 같음 |
| 16·17 | scram-sha-256 | `include`·`include_if_exists`·`include_dir`, 사용자·DB 이름 정규식 매칭(`/^app_.*`) 지원([PostgreSQL 16 릴리스 노트](https://www.postgresql.org/docs/release/16.0/)) |

정규식 매칭 예시(PG 16+):

```conf
hostssl  prod  "/^app_.*"  10.0.3.0/24  scram-sha-256
```

## 환경별 분기: Docker·Kubernetes·관리형 DB

| 환경 | 소스 IP의 정체 | 핵심 설정 | 대표 함정 |
|---|---|---|---|
| Docker | 브리지 네트워크의 컨테이너 IP(`172.17.0.0/16` 등) | `listen_addresses='*'` + `-p 5432:5432` | 컨테이너 내부 `127.0.0.1`은 컨테이너 자신. `POSTGRES_HOST_AUTH_METHOD=trust`가 초기화 시 pg_hba를 통째로 덮어씀 |
| Kubernetes | Service ClusterIP가 아니라 **Pod CIDR** | `kubectl cluster-info dump \| grep -i cidr`로 확인 후 CIDR 기입 | 사이드카/프록시 경유 시 소스 IP가 `127.0.0.1`로 바뀜 |
| RDS / Cloud SQL | VPC 내부 IP | pg_hba **편집 불가** → 보안그룹·승인 네트워크 + `rds.force_ssl=1` 파라미터그룹 | pg_hba를 찾다 시간 낭비. 접근 통제는 SG가 대체 |

Docker에서 소스 IP 확인:

```bash
docker network inspect bridge --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{println}}{{end}}'
```

Kubernetes에서 Pod CIDR 확인:

```bash
kubectl cluster-info dump | grep -i -m2 'cluster-cidr'
# 예상: --cluster-cidr=10.244.0.0/16
```

확인된 대역을 그대로 pg_hba에 반영합니다.

```conf
hostssl  prod  app  10.244.0.0/16  scram-sha-256
```

## 반영 절차: reload로 충분한 것 vs restart가 필요한 것

| 항목 | reload | restart |
|---|---|---|
| `pg_hba.conf` 전체 | ✅ | 불필요 |
| `pg_ident.conf` | ✅ | 불필요 |
| `log_connections`, `log_min_duration_statement` | ✅ | 불필요 |
| `listen_addresses` | ❌ | ✅ 필요 |
| `port` | ❌ | ✅ 필요 |
| `max_connections` | ❌ | ✅ 필요 |
| `shared_buffers` | ❌ | ✅ 필요 |

reload 실행:

```sql
SELECT pg_reload_conf();
```

```
 pg_reload_conf
----------------
 t
```

또는 셸에서:

```bash
sudo -u postgres pg_ctl reload -D /var/lib/pgsql/16/data
# 또는
sudo systemctl reload postgresql
```

반영 확인은 두 가지를 함께 봅니다.

```bash
sudo tail -n 20 /var/log/postgresql/postgresql-16-main.log | grep -i sighup
# 예상: LOG:  received SIGHUP, reloading configuration files
```

```sql
SELECT line_number, address, auth_method FROM pg_hba_file_rules WHERE error IS NULL;
```

`t`가 반환됐는데 `pg_hba_file_rules`에 새 줄이 없다면 편집한 파일이 `SHOW hba_file;` 경로와 다른 것입니다.

## 고쳤는데도 안 될 때: 실패 분기 트리

### 분기 ① 나는 psql로 되는데 앱만 계속 실패한다

커넥션 풀이 예전 커넥션 또는 옛 설정을 붙들고 있는 경우입니다. HikariCP라면 `maxLifetime`(기본 30분)이 지나야 재생성됩니다.

```yaml
spring:
  datasource:
    hikari:
      max-lifetime: 900000      # 15분
      keepalive-time: 300000
```

확진 방법은 단순합니다. 앱을 재기동해 즉시 성공하면 원인은 풀 캐시입니다. 서버 쪽에서는 실제 연결 주체를 확인하세요.

```sql
SELECT client_addr, usename, state, backend_start
FROM pg_stat_activity
WHERE datname = 'prod'
ORDER BY backend_start DESC LIMIT 10;
```

### 분기 ② pgbouncer를 경유한다

이 경우 진짜 관문은 pg_hba가 아니라 pgbouncer의 인증 설정입니다.

```bash
psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c 'SHOW CONFIG;' | grep -E 'auth_type|auth_file'
```

```
auth_type | scram-sha-256
auth_file | /etc/pgbouncer/userlist.txt
```

`userlist.txt`의 해시가 DB의 `rolpassword`와 어긋나면 pg_hba를 아무리 고쳐도 실패합니다. PG 14 이후 scram 전환 시 이 파일을 함께 갱신하지 않는 사고가 특히 잦습니다.

```
"app" "SCRAM-SHA-256$4096:...$...:..."
```

### 분기 ③ 서버 로그의 소스 IP가 낯설다

LB·NAT·서비스 메시 사이드카가 소스 IP를 치환한 상태입니다. 선택지는 둘입니다.

- 로그에 찍힌 IP 대역을 그대로 CIDR에 반영한다(가장 빠름, 단 범위가 넓어질 수 있음).
- 소스 IP 보존이 필요하면 프록시 계층에서 proxy protocol 또는 IP 보존 옵션을 검토한다.

이때 IP 기반 룰이 사실상 무력화되므로, 인증 강도(`scram-sha-256` 또는 `cert`)와 TLS 강제로 통제를 옮기는 편이 현실적입니다.

### 안전 원칙 — 급하다고 넘지 말아야 할 선

```conf
# 절대 금지 조합
host  all  all  0.0.0.0/0  trust
```

- `trust` + `0.0.0.0/0`은 인증 없는 전면 개방입니다. 어떤 상황에서도 운영에 두지 않습니다.
- CIDR는 최소 범위로: 가능하면 `/32`, 아니면 애플리케이션 서브넷 단위.
- 평문 차단은 `hostssl` 허용 + `hostnossl ... reject` 조합으로 명시합니다.
- 임시 완화 조치는 반드시 티켓으로 남기고 만료일을 지정하세요. 임시 `trust` 한 줄이 몇 년 남아 있는 경우가 실무에서 가장 자주 보고되는 사고 유형입니다.

공식 문서는 PostgreSQL 매뉴얼의 "Client Authentication" 장(`pg_hba.conf` File, Authentication Methods)과 `pg_hba_file_rules` 뷰 설명을 함께 확인하시면 됩니다.

## 결론: 접속 에러 3계층 체크리스트

| 에러 원문 키워드 | 계층 | 첫 명령 |
|---|---|---|
| `Connection refused ... 5432` | 네트워크 | `ss -lntp \| grep 5432` |
| `no pg_hba.conf entry ... SSL off/on` | pg_hba | `SELECT * FROM pg_hba_file_rules;` |
| `password authentication failed` | 인증 | `SELECT rolname, substring(rolpassword,1,4) FROM pg_authid;` |
| `Peer authentication failed` | 인증(로컬 소켓) | `psql -h 127.0.0.1 ...`로 재시도 |
| `too many clients already` | 세션 슬롯 | 별도 런북 참조 |

기억할 문장은 두 개입니다.

1. **pg_hba.conf를 열기 전에 `ss -lntp`부터.**
2. **`password authentication failed`가 떴다면 pg_hba는 이미 통과한 것이다.**

지금 바로 자기 서버에서 아래 두 줄을 실행해 잠재 오류를 점검해 보세요. 장애가 나기 전에 죽은 룰과 파싱 오류를 찾아내는 가장 값싼 방법입니다.

```sql
SHOW hba_file;
SELECT line_number, error FROM pg_hba_file_rules WHERE error IS NOT NULL;
```

여기까지 통과했는데도 접속이 막힌다면 남은 후보는 커넥션 슬롯 고갈입니다. [PostgreSQL too many clients already 30초 판정 복구 런북](/blog/postgresql-too-many-clients-already-30초-판정-복구-런북)으로 이어서 확인하세요.

## 자주 묻는 질문 (FAQ)

**Q1. `no pg_hba.conf entry ... SSL off` 에러가 났는데, 서버에서 SSL을 꺼야 하나요?**
아닙니다. `SSL off`는 원인이 아니라 "이 접속이 평문이었다"는 기록입니다. 서버에 `hostssl` 라인만 있는 상황일 가능성이 높으므로, 클라이언트 접속 문자열에 `sslmode=require`를 추가하거나 서버에 적절한 `host` 라인을 추가하는 것이 정상 대응입니다.

**Q2. pg_hba.conf를 고쳤는데 반영이 안 됩니다.**
세 가지를 순서대로 확인하세요. ① `SHOW hba_file;`로 실제 적용 경로가 편집한 파일과 같은지, ② `SELECT pg_reload_conf();`가 `t`를 반환하는지, ③ `SELECT line_number, error FROM pg_hba_file_rules WHERE error IS NOT NULL;`에 파싱 오류가 없는지. 참고로 `listen_addresses`와 `port` 변경은 reload가 아니라 restart가 필요합니다.

**Q3. RDS나 Cloud SQL에서는 pg_hba.conf를 어디서 편집하나요?**
관리형 DB는 pg_hba.conf를 직접 편집할 수 없습니다. 접근 제어는 보안그룹·승인된 네트워크가, TLS 강제는 파라미터 그룹의 `rds.force_ssl=1` 같은 설정이 대신합니다. 인증 강도는 `password_encryption`과 롤 비밀번호 재설정으로 관리하며, 세부 파라미터명은 각 클라우드 공식 문서 확인이 필요합니다.$q$,
  content_evidence = jsonb_set(jsonb_set(coalesce(content_evidence,'{}'::jsonb),'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'))),'{changeSummary}',to_jsonb($q$PostgreSQL 14+ 오류 메시지 형식(no encryption/SSL encryption, connection to server at) 반영, include·정규식 지원 버전을 16으로 정정$q$::text))
WHERE id=813 AND md5(content)='654ff3d9b0313dbf6af8c700822b65ce';

UPDATE posts SET content_evidence = jsonb_set(content_evidence,'{en,content}',to_jsonb($q$## You waste 30 minutes because you read the error in the wrong order

In an incident, the two most common misdiagnosis patterns are:

- You see `FATAL: no pg_hba.conf entry for host ...` and spend 30 minutes chasing firewalls and security groups.
- You see `could not connect to server: Connection refused` and open `pg_hba.conf` to add `0.0.0.0/0 trust`.

Both cases pick the wrong layer. A PostgreSQL connection has to pass the following three stages **in order**.

1. **TCP reachability** — Does the client packet actually arrive at the socket postmaster is listening on?
2. **pg_hba rule match** — Is there a line that matches the connection (TYPE/DB/USER/source IP)?
3. **Authentication** — Do the credentials pass using the METHOD on the matched line?

The important fact: **each stage produces a different message**. The error text itself already tells you which stage failed. If you got `Connection refused`, the server has never even seen your request, so editing pg_hba.conf is 100% pointless. If you got `password authentication failed`, a pg_hba line already matched, so further pg_hba edits are a waste of time.

This post covers PostgreSQL 12–17 on Linux (Debian/Ubuntu and RHEL-family) plus Docker/Kubernetes/managed DB environments, and maps error text → layer → first command in 30 seconds.

## Error-text lookup table: map six messages onto three layers

Find the error you are looking at in the table below. Run only that row’s “first check command.”

| # | Error text | Layer | First check command | Common wrong turn |
|---|---|---|---|---|
| (a) | `psql: error: connection to server at "10.0.3.10", port 5432 failed: Connection refused` (libpq 14+; 13 and earlier: `could not connect to server: Connection refused ... Is the server running on host "10.0.3.10" and accepting TCP/IP connections on port 5432?`) | Network | `ss -lntp \| grep 5432` | Editing pg_hba.conf (pointless) |
| (b) | `FATAL: no pg_hba.conf entry for host "10.0.3.51", user "app", database "prod", no encryption` (server 14+; `SSL off` on 13 and earlier) | pg_hba | `SELECT * FROM pg_hba_file_rules;` | Checking firewalls/security groups |
| (c) | `FATAL: no pg_hba.conf entry for host "10.0.3.51", user "app", database "prod", SSL encryption` (server 14+; `SSL on` on 13 and earlier) | pg_hba | Same + check `hostnossl` lines | “Do I need to turn SSL off?” rabbit hole |
| (d) | `FATAL: password authentication failed for user "app"` | Auth | `SELECT rolname, substring(rolpassword,1,4) FROM pg_authid;` | Re-editing pg_hba (already passed) |
| (e) | `psql: error: FATAL: Peer authentication failed for user "app"` | Auth + local socket | `psql -h 127.0.0.1 -U app -d prod` | Repeatedly resetting the password |
| (f) | `FATAL: sorry, too many clients already` | Session slots (out of scope) | `SHOW max_connections;` | Network/pg_hba/auth already passed |

A few interpretation rules to lock in.

**(a) Network layer.** The server process is down, `listen_addresses` is `localhost`, or a firewall/security group/container port mapping is blocking you. If the same symptom appears on local loopback, follow the general debug procedure in [connection refused / ECONNREFUSED 127.0.0.1 30-second diagnostic runbook](/blog/connection-refused-econnrefused-127001-30초-진단-런북) first. This post covers only PostgreSQL-specific items.

**(b) and (c): the trailing part (14+: `no encryption` / `SSL encryption`; 13 and earlier: `SSL off` / `SSL on`) is not the cause — it is a record of how the client connected.** The text below uses the 13-and-earlier wording; the format changed in PostgreSQL 14 (server `auth.c` and libpq `fe-connect.c` source). The server is only stating “this connection was plaintext/TLS.” Interpretation is therefore the opposite of what people assume.

- `SSL off` → the client connected in plaintext, but the server only has `hostssl` lines. → Give the client `sslmode=require`, or add a `host` line.
- `SSL on` → the client connected with TLS, but you only have `hostnossl`, or the ADDRESS CIDR does not include the real source IP.

In both cases the conclusion is the same: “no matching line exists.” The difference is which TYPE of line you need to create.

**(d) is proof that pg_hba already passed.** Auth was attempted with the matched line’s METHOD (`scram-sha-256`/`md5`) and failed, so the only remaining branches are ① wrong password, ② hash-algorithm mismatch, or ③ the role does not exist.

**(e) is connecting without `-h`, so you took the Unix-socket path.** `peer` auth requires the OS account name and the DB role name to be the same. If switching to `psql -h 127.0.0.1` changes the symptom, that is an immediate confirmation.

**(f) is out of scope for this post.** One diagnostic fact: this message means you already passed network, pg_hba, and authentication. For cause and recovery, see [PostgreSQL too many clients already 30-second diagnosis and recovery runbook](/blog/postgresql-too-many-clients-already-30초-판정-복구-런북) and [PostgreSQL 'too many clients already': 5-minute diagnosis through a PgBouncer fix](/blog/postgresql-too-many-clients-already-5분-진단부터-pgbouncer-해결까지).

## Three-layer diagnostic sequence: pin the failure with six commands

Once the table has narrowed the layer, run the following fixed sequence in order. Each command includes **expected healthy output** and **the branch if it differs**.

### Step 1 — Check the listen socket with `ss -lntp` (run on the server)

```bash
sudo ss -lntp | grep 5432
```

Expected output (remote connections possible):

```
LISTEN 0  244  0.0.0.0:5432  0.0.0.0:*  users:(("postgres",pid=1234,fd=7))
LISTEN 0  244     [::]:5432     [::]:*  users:(("postgres",pid=1234,fd=7))
```

Branches:

- Only `127.0.0.1:5432` is shown → **remote access is confirmed impossible**. `listen_addresses='localhost'`, and no amount of pg_hba editing will stop error (a).
- No lines at all → the server is down or on another port. `systemctl status postgresql` / `journalctl -u postgresql -n 50`.

### Step 2 — Read the running process’s actual values

Do not eyeball config files; always query the live values. Changing `listen_addresses` and only reloading does not apply it, so file vs. runtime mismatch is common.

```sql
SHOW listen_addresses;
SHOW port;
SHOW hba_file;
SHOW config_file;
```

Expected output:

```
 listen_addresses
------------------
 *

 port
------
 5432

              hba_file
-------------------------------------
 /etc/postgresql/16/main/pg_hba.conf
```

Branch: if the `hba_file` path is not the file you edited, that itself is the cause. Package installs use `/etc/postgresql/<major>/main/`, source builds and RHEL-family use `/var/lib/pgsql/<major>/data/`, and the official Docker image uses `/var/lib/postgresql/data/pg_hba.conf`.

### Step 3 — Attempt a real connection from remote

```bash
psql "host=10.0.3.10 port=5432 user=app dbname=prod sslmode=prefer" -c 'select 1'
```

Take the error text from this attempt and plug it back into the table in section 2. From this point on you are judging from the table, not guessing.

### Step 4 — Confirm the actual source IP recorded in the server log

```sql
ALTER SYSTEM SET log_connections = on;
SELECT pg_reload_conf();
```

Log example:

```
2026-08-25 10:12:33 KST [2311] LOG:  connection received: host=10.0.7.88 port=51422
2026-08-25 10:12:33 KST [2311] FATAL:  no pg_hba.conf entry for host "10.0.7.88", user "app", database "prod", SSL off
```

Branch: if the IP the server logged is not the client IP you think you have, an LB/NAT/sidecar rewrote the source IP. Jump straight to “Environment-specific branches” below. When debugging IP-based rules, **the IP in the log is the truth**.

### Step 5 — Inspect parsed rules via SQL (PG 10+)

```sql
SELECT line_number, type, database, user_name, address, netmask, auth_method, error
FROM pg_hba_file_rules
ORDER BY line_number;
```

Expected output:

```
 line_number |  type   | database | user_name |  address  |    netmask    |  auth_method   | error
-------------+---------+----------+-----------+-----------+---------------+----------------+-------
          89 | local   | {all}    | {all}     |           |               | peer           |
          92 | host    | {all}    | {all}     | 127.0.0.1 | 255.255.255.0 | scram-sha-256  |
          95 | host    | {prod}   | {app}     | 10.0.3.0  | 255.255.255.0 | scram-sha-256  |
```

Branch: if the `error` column is not NULL, **that line was not loaded**. Typical causes are typos, a bad CIDR, or a nonexistent METHOD. Make a habit of running:

```sql
SELECT line_number, error FROM pg_hba_file_rules WHERE error IS NOT NULL;
```

## pg_hba.conf syntax and first-match: one broad reject line can disable everything

Line syntax:

```
TYPE  DATABASE  USER  ADDRESS  METHOD  [OPTIONS]
```

Meaning of TYPE values and how they connect to errors (b) and (c):

| TYPE | Matches | Related error |
|---|---|---|
| `local` | Unix domain socket (no `-h`) | (e) Peer authentication failed |
| `host` | TCP, both plaintext and TLS | Can fix both (b) and (c) |
| `hostssl` | TLS connections only | Connecting with `SSL off` produces (b) |
| `hostnossl` | Plaintext connections only | Connecting with TLS produces (c) |

ADDRESS uses CIDR (`10.0.3.0/24`, `10.0.3.51/32`); keywords `all`, `samehost`, and `samenet` are also allowed.

### First-match-wins rule

PostgreSQL **scans the file from the top, stops at the first matching line**, and authenticates with that line’s METHOD. **On failure it does not fall through to later lines.** If you do not know this rule, you write a file like the one below and then spend hours on “I clearly added a line, why doesn’t it work?”

Before — a file where the lower line is ignored forever:

```conf
# TYPE  DATABASE  USER  ADDRESS        METHOD
local   all       all                  peer
host    all       all   127.0.0.1/32   scram-sha-256
host    all       all   0.0.0.0/0      reject        # ← all remote connections terminate here
host    prod      app   10.0.3.0/24    scram-sha-256 # ← unreachable (dead rule)
```

After — specific allows first, catch-all reject last:

```conf
# TYPE     DATABASE  USER  ADDRESS        METHOD
local      all       all                  peer
host       all       all   127.0.0.1/32   scram-sha-256

# Change 1: allow only the app-server subnet, TLS required (move the specific rule up)
hostssl    prod      app   10.0.3.0/24    scram-sha-256

# Change 2: explicitly block plaintext for the same target
hostnossl  prod      app   10.0.3.0/24    reject

# Change 3: catch-all reject must be the last line (moved from the old 3rd line)
host       all       all   0.0.0.0/0      reject
```

To spot dead rules by eye, compare `pg_hba_file_rules` `line_number` order against the rule above. Treat every allow line that sits below a broad `reject` as invalid.

### METHOD decision table

| METHOD | Security level | Client compatibility | Recommended use |
|---|---|---|---|
| `trust` | None (no auth) | All | **Forbidden in production.** Bootstrap only, and always ticket it |
| `peer` | Medium (trust OS account) | `local` only | Local server maintenance (postgres account) |
| `ident` | Medium | Needs an ident server | Legacy internal networks; not recommended for new setups |
| `md5` | Low (legacy hash) | All, including old JDBC/psycopg2 | Temporary use for old-driver compatibility |
| `scram-sha-256` | High | PG 10+ server, modern drivers | **Default recommendation** |
| `cert` | Very high (mTLS) | Requires distributing client certs | Internet-facing / regulated environments |

### PG 14 branch: you switched to scram but error (d) keeps happening

Starting with PostgreSQL 14, the default `password_encryption` is `scram-sha-256`. The catch: **existing user passwords are still stored as md5 hashes**. If you only change pg_hba to `scram-sha-256`, the stored hash and the auth method disagree and you get `password authentication failed`.

Diagnose:

```sql
SELECT rolname, substring(rolpassword, 1, 4) AS hash_prefix
FROM pg_authid
WHERE rolcanlogin;
```

Expected output:

```
 rolname  | hash_prefix
----------+-------------
 postgres | SCRA
 app      | md5          ← this row is the cause
```

Recover (reset the password so it is rehashed):

```sql
SET password_encryption = 'scram-sha-256';
ALTER USER app WITH PASSWORD 'new_password';
```

Verify — re-query until `hash_prefix` is `SCRA`, then test a real connection:

```bash
psql "host=10.0.3.10 user=app dbname=prod sslmode=require" -c 'select current_user'
```

`SET` is session-scoped, so for future accounts check `password_encryption` in `postgresql.conf`. If you still have old JDBC (below 9.4.12) or other drivers that do not support SCRAM, upgrading the driver is the real fix; `md5` is only a temporary workaround.

### Version differences

| Version | Default hash | pg_hba-related features |
|---|---|---|
| 9.6–13 | md5 | No `include` directive; `pg_hba_file_rules` from 10 |
| 14 | Switched to scram-sha-256 | Existing md5 users must be rehashed |
| 15 | scram-sha-256 | Same as 14 |
| 16·17 | scram-sha-256 | `include`·`include_if_exists`·`include_dir`, regex matching of user and database names (`/^app_.*`) ([PostgreSQL 16 release notes](https://www.postgresql.org/docs/release/16.0/)) |

Regex matching example (PG 16+):

```conf
hostssl  prod  "/^app_.*"  10.0.3.0/24  scram-sha-256
```

## Environment-specific branches: Docker, Kubernetes, managed DB

| Environment | What the source IP actually is | Key settings | Classic trap |
|---|---|---|---|
| Docker | Container IP on the bridge network (`172.17.0.0/16`, etc.) | `listen_addresses='*'` + `-p 5432:5432` | `127.0.0.1` inside the container is the container itself. `POSTGRES_HOST_AUTH_METHOD=trust` rewrites pg_hba wholesale at init |
| Kubernetes | **Pod CIDR**, not the Service ClusterIP | Confirm with `kubectl cluster-info dump \| grep -i cidr`, then put that CIDR in | Sidecar/proxy hops rewrite the source IP to `127.0.0.1` |
| RDS / Cloud SQL | VPC internal IP | pg_hba **cannot be edited** → security groups / authorized networks + `rds.force_ssl=1` parameter group | Wasting time looking for pg_hba. Access control is replaced by SGs |

Confirm source IPs in Docker:

```bash
docker network inspect bridge --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{println}}{{end}}'
```

Confirm Pod CIDR in Kubernetes:

```bash
kubectl cluster-info dump | grep -i -m2 'cluster-cidr'
# expected: --cluster-cidr=10.244.0.0/16
```

Put the confirmed range into pg_hba as-is.

```conf
hostssl  prod  app  10.244.0.0/16  scram-sha-256
```

## Applying changes: what reload is enough for vs. what needs a restart

| Item | reload | restart |
|---|---|---|
| Entire `pg_hba.conf` | ✅ | Not needed |
| `pg_ident.conf` | ✅ | Not needed |
| `log_connections`, `log_min_duration_statement` | ✅ | Not needed |
| `listen_addresses` | ❌ | ✅ Required |
| `port` | ❌ | ✅ Required |
| `max_connections` | ❌ | ✅ Required |
| `shared_buffers` | ❌ | ✅ Required |

Run reload:

```sql
SELECT pg_reload_conf();
```

```
 pg_reload_conf
----------------
 t
```

Or from the shell:

```bash
sudo -u postgres pg_ctl reload -D /var/lib/pgsql/16/data
# or
sudo systemctl reload postgresql
```

Confirm application with both of these:

```bash
sudo tail -n 20 /var/log/postgresql/postgresql-16-main.log | grep -i sighup
# expected: LOG:  received SIGHUP, reloading configuration files
```

```sql
SELECT line_number, address, auth_method FROM pg_hba_file_rules WHERE error IS NULL;
```

If you got `t` but the new line is missing from `pg_hba_file_rules`, the file you edited is not the path from `SHOW hba_file;`.

## Still broken after the fix: failure-branch tree

### Branch ① psql works for me, but the app keeps failing

The connection pool is holding old connections or old settings. With HikariCP, connections are not recreated until `maxLifetime` (default 30 minutes) expires.

```yaml
spring:
  datasource:
    hikari:
      max-lifetime: 900000      # 15 minutes
      keepalive-time: 300000
```

Confirmation is simple. If restarting the app makes it succeed immediately, the cause is pool cache. On the server, check who is actually connected:

```sql
SELECT client_addr, usename, state, backend_start
FROM pg_stat_activity
WHERE datname = 'prod'
ORDER BY backend_start DESC LIMIT 10;
```

### Branch ② traffic goes through pgbouncer

In this case the real gate is not pg_hba but pgbouncer’s auth settings.

```bash
psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c 'SHOW CONFIG;' | grep -E 'auth_type|auth_file'
```

```
auth_type | scram-sha-256
auth_file | /etc/pgbouncer/userlist.txt
```

If the hash in `userlist.txt` disagrees with the DB’s `rolpassword`, no amount of pg_hba editing will help. After PG 14 scram migrations, forgetting to update this file at the same time is an especially common accident.

```
"app" "SCRAM-SHA-256$4096:...$...:..."
```

### Branch ③ the source IP in the server log is unfamiliar

An LB, NAT, or service-mesh sidecar rewrote the source IP. You have two options.

- Put the CIDR of the IP that appeared in the log into pg_hba as-is (fastest, but the range may get wider).
- If you need to preserve the real source IP, look at proxy protocol or IP-preservation options on the proxy layer.

At that point IP-based rules are effectively useless, so it is more realistic to move control to auth strength (`scram-sha-256` or `cert`) plus forced TLS.

### Safety principles — lines you must not cross even when you are in a hurry

```conf
# Never-do combination
host  all  all  0.0.0.0/0  trust
```

- `trust` + `0.0.0.0/0` is unauthenticated, fully open access. Never leave it in production under any circumstances.
- Keep CIDRs as tight as possible: `/32` if you can, otherwise the application subnet.
- Block plaintext explicitly with `hostssl` allow + `hostnossl ... reject`.
- Temporary relaxations must be ticketed with an expiry date. A leftover temporary `trust` line that sits around for years is the incident type reported most often in practice.

For official docs, see the “Client Authentication” chapter in the PostgreSQL manual (`pg_hba.conf` File, Authentication Methods) together with the `pg_hba_file_rules` view description.

## Conclusion: three-layer connection-error checklist

| Error-text keyword | Layer | First command |
|---|---|---|
| `Connection refused ... 5432` | Network | `ss -lntp \| grep 5432` |
| `no pg_hba.conf entry ... SSL off/on` | pg_hba | `SELECT * FROM pg_hba_file_rules;` |
| `password authentication failed` | Auth | `SELECT rolname, substring(rolpassword,1,4) FROM pg_authid;` |
| `Peer authentication failed` | Auth (local socket) | Retry with `psql -h 127.0.0.1 ...` |
| `too many clients already` | Session slots | See the separate runbook |

Two sentences to remember.

1. **Run `ss -lntp` before you open pg_hba.conf.**
2. **If you got `password authentication failed`, pg_hba already passed.**

Run the two lines below on your own server right now and check for latent errors. It is the cheapest way to find dead rules and parse errors before an incident.

```sql
SHOW hba_file;
SELECT line_number, error FROM pg_hba_file_rules WHERE error IS NOT NULL;
```

If you got this far and connections are still blocked, the remaining candidate is connection-slot exhaustion. Continue with [PostgreSQL too many clients already 30-second diagnosis and recovery runbook](/blog/postgresql-too-many-clients-already-30초-판정-복구-런북).

## FAQ

**Q1. I got `no pg_hba.conf entry ... SSL off`. Should I turn SSL off on the server?**
No. `SSL off` is not the cause; it is a record that this connection was plaintext. You most likely only have `hostssl` lines on the server, so the correct response is to add `sslmode=require` to the client connection string, or add an appropriate `host` line on the server.

**Q2. I edited pg_hba.conf but the change is not applying.**
Check three things in order. ① `SHOW hba_file;` — is the live path the file you edited? ② Does `SELECT pg_reload_conf();` return `t`? ③ Does `SELECT line_number, error FROM pg_hba_file_rules WHERE error IS NOT NULL;` show any parse errors? Note that changing `listen_addresses` and `port` requires a restart, not a reload.

**Q3. Where do I edit pg_hba.conf on RDS or Cloud SQL?**
You cannot edit pg_hba.conf on managed databases. Access control is done with security groups / authorized networks, and TLS enforcement with parameter-group settings such as `rds.force_ssl=1`. Auth strength is managed via `password_encryption` and resetting role passwords; confirm exact parameter names in each cloud vendor’s official docs.$q$::text))
WHERE id=813 AND md5(content_evidence->'en'->>'content')='018cda5d2375ffe5bc960777f6773c7e';

-- Expected: 6 x UPDATE 1 on the 2026-10-03 04:17 backup; 6 x UPDATE 0 on re-run.
