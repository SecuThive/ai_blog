-- stale-refresh 2026-10-04 post #212 클라우드-환경-iam-설계-모범-사례-awsazuregcp-비교
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$## 클라우드 IAM의 중요성

Gartner는 「Is the Cloud Secure?」에서 2025년까지 클라우드 보안 실패의 99%는 클라우드 사업자가 아니라 고객 책임일 것이라고 전망했습니다. 전망 시점은 지났지만, 공유 책임 모델에서 계정·권한(IAM) 설정이 고객 몫이라는 점은 그대로입니다([출처](https://www.gartner.com/smarterwithgartner/is-the-cloud-secure), 확인일 2026-10-04).

## AWS IAM 모범 사례

### 최소 권한 정책

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::my-specific-bucket",
        "arn:aws:s3:::my-specific-bucket/*"
      ],
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ap-northeast-2"
        }
      }
    }
  ]
}
```

### EC2 역할(Role) 기반 접근

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ec2.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
```

절대 코드나 환경변수에 Access Key/Secret Key를 하드코딩하지 마세요.

## Azure AD 조건부 접근 정책

```json
{
  "displayName": "Require MFA for Admins",
  "state": "enabled",
  "conditions": {
    "users": {
      "includeRoles": ["GlobalAdministrator"]
    }
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": ["mfa", "compliantDevice"]
  }
}
```

**PIM(Privileged Identity Management)**: 영구적 관리자 권한 대신 필요할 때만 일시적으로 권한을 활성화합니다.

## GCP IAM - 리소스 계층 구조

```
Organization
  └── Folder (부서별)
        └── Project (서비스별)
              └── Resource
```

```bash
# 임시 권한 부여 (만료 조건 포함)
gcloud projects add-iam-policy-binding my-project \
  --member="user:dev@company.com" \
  --role="roles/viewer" \
  --condition='expression=request.time < timestamp("2026-12-31T00:00:00Z"),title=Temp'
```

## 공통 모범 사례 체크리스트

```
□ 루트/전역 관리자 계정 MFA 필수
□ 서비스 계정은 역할(Role) 사용
□ 권한 정기 검토 (분기 1회 이상)
□ CloudTrail/Activity Log 활성화
□ 비정상 권한 사용 경보 설정
□ 임시 자격증명(STS/임시 토큰) 활용
```

클라우드 IAM은 한 번 설정하면 끝나는 것이 아닙니다. 조직 변화, 서비스 추가에 따라 지속적으로 검토하고 정리해야 합니다.


## 권한이 쌓이는 걸 막는 자동화

IAM은 "설정"보다 "지속 정리"가 어렵습니다. 권한 증식(permission creep)을 도구로 관리하세요.

| 클라우드 | 도구 | 역할 |
|----------|------|------|
| AWS | IAM Access Analyzer | 미사용 권한·외부 노출 탐지, 최소권한 정책 생성 |
| Azure | PIM Access Review | 관리자 권한 주기 재인증 |
| GCP | Policy Analyzer / Recommender | 과도 권한 추천 회수 |

## 멀티계정·조직 거버넌스

계정이 늘면 개별 IAM만으로는 통제가 안 됩니다.

- **AWS Organizations + SCP**: 조직 단위로 "이 리전/서비스는 아예 금지" 같은 가드레일 강제.
- **페더레이션/SSO**: IAM 사용자 남발 대신 IdP(OIDC/SAML) 연동으로 중앙 집중. 입·퇴사 시 한 곳에서 처리.
- **임시 자격증명**: 장기 Access Key를 없애고 STS·OIDC 단기 토큰으로 대체(키 유출 리스크 제거).

## 권한 거부(AccessDenied) 디버깅 절차

최소 권한을 적용하면 필연적으로 "권한이 없다"는 오류가 늘어납니다. 이때 권한을 넓게 열어 버리지 않으려면, **어느 정책이 거부했는지**를 빠르게 찾는 절차가 필요합니다.

**원인 후보 (AWS 기준)**
- 자격 증명이 예상과 다른 주체(다른 역할, 다른 계정)로 잡혀 있음
- 자격 증명 기반 정책에는 허용이 있지만 SCP·권한 경계(permission boundary)·리소스 정책에서 명시적 거부
- 조건 키(출발지 IP, MFA, 태그) 불일치

**검증 명령**

```bash
# 1) 지금 누구로 호출하고 있나
aws sts get-caller-identity
# 2) 정책 시뮬레이션: 이 주체가 이 동작을 할 수 있나
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:role/app-role \
  --action-names s3:GetObject \
  --resource-arns arn:aws:s3:::my-bucket/reports/2026.csv
# 3) 실제 거부 이벤트 찾기 (CloudTrail)
aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=GetObject --max-results 20
```

AWS의 거부 메시지에 "explicit deny in a service control policy"처럼 거부 유형이 표시되면 해당 계층부터 확인합니다. (S3 데이터 이벤트는 CloudTrail 데이터 이벤트 로깅을 켜야 기록됩니다.)

**Azure·GCP**
- Azure: `az role assignment list --assignee <객체ID> --all -o table`로 실제 할당된 역할과 범위를 확인합니다.
- GCP: Policy Troubleshooter(`gcloud policy-intelligence troubleshoot-policy iam ...`)로 특정 주체·권한·리소스 조합의 허용 여부와 근거를 조회합니다.

**해결과 재발 방지**
- 필요한 동작만 추가하고, 추가 이유를 정책 변경 PR에 기록합니다.
- AWS IAM Access Analyzer의 정책 생성 기능처럼 실제 사용 기록 기반으로 정책을 만드는 도구를 활용해 권한이 다시 넓어지지 않게 합니다.

## 자주 묻는 질문 (FAQ)

**Q. 최소 권한을 어떻게 시작하나요?**
처음부터 완벽히 짜기 어렵습니다. 넓게 시작하지 말고, Access Analyzer로 **실제 사용된 권한 로그**를 기반으로 정책을 좁혀가는 접근이 현실적입니다.

**Q. 사용자마다 IAM 계정을 만들어야 하나요?**
권장하지 않습니다. IdP를 통한 SSO/페더레이션으로 중앙에서 신원을 관리하고, 클라우드에는 역할(Role)로 매핑하는 것이 보안·운영 모두 유리합니다.


## 교차 클라우드 공통 원칙

1. **사람 ≠ 장기 키**: SSO/OIDC → 역할 수임
2. **권한은 시간 제한**: JIT/PIM
3. **조직 가드레일**: SCP/Azure Policy/Org Policy로 "금지 목록" 먼저

```bash
# AWS: 미사용 권한 힌트
aws accessanalyzer list-analyzers
aws accessanalyzer list-findings --analyzer-arn "$ARN" --max-results 20
```

## 참고 자료

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Azure RBAC](https://learn.microsoft.com/azure/role-based-access-control/best-practices)
- [GCP IAM](https://cloud.google.com/iam/docs/best-practices)

## 자주 묻는 질문 (FAQ) — 보강

**Q. Admin 역할을 아예 없앨 수 있나요?**  
비상용 break-glass 계정만 남기고, 평시에는 작업 단위 역할을 쓰세요. break-glass는 알람·승인 로그 필수입니다.


## 검증 환경·편집자 주

- 검증 시점: 2026-09 (문서·CLI 플래그는 벤더 업데이트에 따라 달라질 수 있음)
- 명령어는 읽기 전용 조회 위주이며, 프로덕션 적용 전 스테이징에서 plan/dry-run을 권장합니다.
- 본문은 공식 문서 링크와 운영에서 반복되는 실패 패턴을 기준으로 편집 검토했습니다.

## 실무 적용 순서 (요약)

1. 현재 상태 측정(메트릭·비용·오류율) 없이 도구부터 바꾸지 말 것
2. 가장 작은 범위에서 변경 → 롤백 조건 명시
3. 체크리스트를 런북/티켓 템플릿에 옮겨 팀 공유
4. 한 달 뒤 지표로 효과 재평가 후 확대
$sr$, tags=ARRAY[$t$IAM$t$,$t$클라우드보안$t$,$t$AWS$t$,$t$Azure$t$,$t$최소권한원칙$t$,$t$i18n.title:Cloud IAM Design Best Practices: Comparing AWS, Azure, and GCP$t$,$t$i18n.excerpt:Under the shared responsibility model, IAM configuration is the customer’s job. This post compares practical IAM design patterns across AWS, Azure, and GCP—least privilege, role$t$]::text[], content_evidence=jsonb_set($j${"en": {"title": "Cloud IAM Design Best Practices: Comparing AWS, Azure, and GCP", "content": "## Why Cloud IAM Matters\n\nIn “Is the Cloud Secure?”, Gartner predicted that through 2025, 99% of cloud security failures would be the customer’s fault, not the provider’s. That date has passed, but under the shared responsibility model, identity and access (IAM) configuration is still the customer’s job ([source](https://www.gartner.com/smarterwithgartner/is-the-cloud-secure), checked 2026-10-04).\n\n## AWS IAM Best Practices\n\n### Least-Privilege Policies\n\n```json\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Effect\": \"Allow\",\n      \"Action\": [\"s3:GetObject\", \"s3:ListBucket\"],\n      \"Resource\": [\n        \"arn:aws:s3:::my-specific-bucket\",\n        \"arn:aws:s3:::my-specific-bucket/*\"\n      ],\n      \"Condition\": {\n        \"StringEquals\": {\n          \"aws:RequestedRegion\": \"ap-northeast-2\"\n        }\n      }\n    }\n  ]\n}\n```\n\n### EC2 Role-Based Access\n\n```json\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [{\n    \"Effect\": \"Allow\",\n    \"Principal\": { \"Service\": \"ec2.amazonaws.com\" },\n    \"Action\": \"sts:AssumeRole\"\n  }]\n}\n```\n\nNever hardcode Access Keys or Secret Keys in source code or environment variables.\n\n## Azure AD Conditional Access Policies\n\n```json\n{\n  \"displayName\": \"Require MFA for Admins\",\n  \"state\": \"enabled\",\n  \"conditions\": {\n    \"users\": {\n      \"includeRoles\": [\"GlobalAdministrator\"]\n    }\n  },\n  \"grantControls\": {\n    \"operator\": \"AND\",\n    \"builtInControls\": [\"mfa\", \"compliantDevice\"]\n  }\n}\n```\n\n**PIM (Privileged Identity Management)**: Instead of standing administrator privileges, activate access only when it is needed, and only for a limited time.\n\n## GCP IAM — Resource Hierarchy\n\n```\nOrganization\n  └── Folder (per department)\n        └── Project (per service)\n              └── Resource\n```\n\n```bash\n# 임시 권한 부여 (만료 조건 포함)\ngcloud projects add-iam-policy-binding my-project \\\n  --member=\"user:dev@company.com\" \\\n  --role=\"roles/viewer\" \\\n  --condition='expression=request.time < timestamp(\"2026-12-31T00:00:00Z\"),title=Temp'\n```\n\n## Shared Best-Practices Checklist\n\n```\n□ MFA required on root / global administrator accounts\n□ Use roles for service accounts\n□ Review permissions regularly (at least quarterly)\n□ Enable CloudTrail / Activity Log\n□ Alert on anomalous permission use\n□ Prefer temporary credentials (STS / short-lived tokens)\n```\n\nCloud IAM is not a one-time setup. You have to keep reviewing and pruning it as the organization changes and new services come online.\n\n## Automation to Stop Permission Creep\n\nWith IAM, ongoing cleanup is harder than the initial setup. Use tooling to manage permission creep.\n\n| Cloud | Tool | Purpose |\n|----------|------|------|\n| AWS | IAM Access Analyzer | Detect unused permissions and external exposure; generate least-privilege policies |\n| Azure | PIM Access Review | Periodic recertification of administrator privileges |\n| GCP | Policy Analyzer / Recommender | Recommend reclaiming excessive permissions |\n\n## Multi-Account and Organization Governance\n\nOnce accounts multiply, per-account IAM is no longer enough to stay in control.\n\n- **AWS Organizations + SCP**: Enforce organization-wide guardrails such as “this region or service is forbidden entirely.”\n- **Federation / SSO**: Instead of proliferating IAM users, centralize identity through an IdP (OIDC/SAML). Handle onboarding and offboarding in one place.\n- **Temporary credentials**: Eliminate long-lived Access Keys and replace them with STS/OIDC short-lived tokens (removing key-leak risk).\n\n## Debugging AccessDenied\n\nLeast privilege inevitably produces more \"access denied\" errors. To avoid opening permissions wide, you need a quick way to find **which policy denied the request**.\n\n**Likely causes (AWS)**\n- Credentials resolve to a different principal than expected (another role or account)\n- The identity policy allows it, but an SCP, permission boundary, or resource policy explicitly denies\n- Condition keys (source IP, MFA, tags) don't match\n\n**Verification**\n\n```bash\n# 1) who am I calling as?\naws sts get-caller-identity\n# 2) policy simulation: can this principal do this action?\naws iam simulate-principal-policy \\\n  --policy-source-arn arn:aws:iam::123456789012:role/app-role \\\n  --action-names s3:GetObject \\\n  --resource-arns arn:aws:s3:::my-bucket/reports/2026.csv\n# 3) find the actual denial events (CloudTrail)\naws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=GetObject --max-results 20\n```\n\nIf the AWS error states the denial type, such as \"explicit deny in a service control policy,\" start with that layer. (S3 object-level events are only recorded when CloudTrail data event logging is enabled.)\n\n**Azure and GCP**\n- Azure: `az role assignment list --assignee <object-id> --all -o table` shows actual role assignments and scopes.\n- GCP: Policy Troubleshooter (`gcloud policy-intelligence troubleshoot-policy iam ...`) explains whether a principal/permission/resource combination is allowed and why.\n\n**Fix and prevention**\n- Add only the needed action and record the reason in the policy-change PR.\n- Use tools that generate policies from actual usage, such as IAM Access Analyzer policy generation, so permissions don't widen again.\n\n## FAQ\n\n**Q. How do I get started with least privilege?**\nYou will not get it perfect on day one. Do not start wide. A realistic approach is to tighten policies based on **logs of permissions that were actually used**, using Access Analyzer.\n\n**Q. Should I create an IAM user for every person?**\nNot recommended. Manage identity centrally via SSO/federation with an IdP, and map people to roles in the cloud. That is better for both security and operations.", "excerpt": "Under the shared responsibility model, IAM configuration is the customer’s job. This post compares practical IAM design patterns across AWS, Azure, and GCP—least privilege, roles, Conditional Access, hierarchy, and org-level governance."}, "verifiedAt": "2026-10-04", "changeSummary": "이미 지난 Gartner \"2025년까지\" 전망을 원문 표현(클라우드 보안 실패의 99%는 고객 책임)으로 바로잡고, 다른 전망을 섞은 \"그중 75%가 과도한 권한\" 문구 삭제. 임시 권한 조건 예시의 만료일을 지난 날짜(2025-12-31)에서 2026-12-31로 갱신. 출처 추가.", "officialSources": ["https://www.gartner.com/smarterwithgartner/is-the-cloud-secure"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=212 AND md5(content)='8a7aa3ebb4d4e5212206111eea77a17e' AND md5(content_evidence::text)='2b25710c9a7ec92f5e01cf7e0fb52566' AND md5(coalesce(array_to_string(tags,'|'),''))='a7aa3abd4c2a4cc26033862cfb8e50b2';
COMMIT;
