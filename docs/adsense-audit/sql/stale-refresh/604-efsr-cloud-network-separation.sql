-- stale-refresh 2026-10-04 post #604 2026-전자금융감독규정-클라우드-망분리-예외-적용-실무-가이드
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$# 2026 전자금융감독규정 클라우드 망분리 예외 적용 실무 가이드

"클라우드 쓰고 싶은데 망분리 때문에 못 한다." 금융사·핀테크 현장에서 가장 자주 듣는 말입니다. 하지만 실무에 들어가 보면 진짜 문제는 "쓸 수 없다"가 아니라 **"어떤 조건을 충족하면, 무엇을, 언제 제출해야 하는지를 모른다"**는 점입니다. 이 글은 2026-07-15 시행 전자금융감독규정(금융위원회고시 제2026-29호, [국가법령정보센터](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622), 확인일 2026-10-04) 조문을 기준으로 합니다. 이 글은 규정 원문 해석에 머물지 않고, 담당자가 바로 실행할 수 있는 체크리스트와 CSP 구현 아키텍처를 정리했습니다.

## 망분리 규정 조항, 클라우드 관점으로 다시 읽기

전자금융감독규정의 망분리 의무는 추상적으로 읽으면 "다 막아라"처럼 들리지만, 클라우드 적용 관점에서 쟁점을 분리하면 의사결정이 쉬워집니다.

| 조항/근거 | 핵심 의무 | 클라우드 적용 시 해석 쟁점 |
|---|---|---|
| 제15조(해킹 등 방지대책) | 내부 업무용시스템과 외부통신망 분리·차단(제1항제3호), 전산실 정보처리시스템과 운영·개발·보안 목적으로 직접 접속하는 단말기의 물리적 분리(제1항제5호) | "물리적 케이블 분리"가 아닌 VPC·서브넷 단위 논리 분리로 동등성 입증 가능한가 |
| 제15조 망간 자료전송 통제 | 망 사이 자료 이동 시 통제·승인 | CSP 내 VPC Peering, S3 Gateway 등 데이터 이동 경로의 통제·로깅 범위 |
| 제14조의2(클라우드컴퓨팅서비스 이용절차 등) | 이용 전 중요도 평가, CSP 건전성·안전성 평가, 업무연속성 계획·안전성 확보조치, 정보보호위원회 심의·의결, 사유 발생일부터 3개월 이내 보고 | 비중요업무는 별표 2의2·2의3·2의4의 필수항목만 평가·수립할 수 있음 |
| 제13조(전산자료 보호대책)·제19조(암호프로그램 및 키 관리 통제) | 접근권한 최소 부여, 키 주입·운용·갱신·폐기 절차 | 키 관리(KMS) 주체, CSP 책임공유 모델 경계 |
| 관련 고시(금융분야 클라우드 가이드) | 안전성 평가·이용 보고 | 평가 대상 시스템 범위와 신고 기한 산정 |

규정은 분리 원칙을 유지하면서 조문에 적힌 예외를 둡니다. 예외를 쓰려면 요건을 충족했다는 근거를 **입증**할 수 있어야 합니다.

## 현행 규정의 예외, 어디까지 되나

현행 조문에 적힌 예외는 다음과 같습니다. 무조건 풀린 것이 아니라 **요건과 승인 절차가 붙은 예외**입니다. 조문 밖의 완화 조치(규제 샌드박스 등)가 있는지는 금융위원회·금융감독원 발표를 따로 확인하세요.

| 예외 | 조문 | 요건 |
|---|---|---|
| 연구·개발 목적 | 제15조제1항제3호 가목·제5호 가목 | 이용자의 고유식별정보·개인신용정보(가명정보 제외)를 처리하지 않을 것, 자체 위험성 평가 후 금융감독원장이 정한 망분리 대체 정보보호통제 적용, 정보보호위원회 승인 |
| 업무상 불가피한 경우 | 제15조제1항제3호 나목·제5호 나목 | 금융감독원장의 확인(제3호) 또는 인정(제5호) |
| CSP 전산실 | 제14조의2제7항 | 제14조의2제1항 절차를 거친 CSP의 정보처리시스템이 있는 전산실에는 제11조제1호·제2호와 제15조제1항제5호(물리적 분리)를 적용하지 않음 |
| 고유식별정보·개인신용정보를 클라우드로 처리 | 제14조의2제7항 단서 | 제11조제2호 적용, 정보처리시스템을 국내에 설치(일부 외국금융회사 국내지점 등 제외) |

> **실무 팁:** 예외 적용의 출발점은 "이 시스템이 중요업무인가"를 먼저 정의하는 데이터 분류 작업입니다. 분류가 모호하면 감독 단계에서 가장 먼저 발목을 잡힙니다.

## 신고·보고 절차 체크리스트

CSP와 이용계약을 체결했다고 끝이 아닙니다. 보고 기한을 놓치면 그 자체가 지적사항이 됩니다.

- [ ] **사전(이용 전):** 중요도 평가 및 업무 영향 분석 수행
- [ ] **사전:** CSP 건전성·안전성 평가(직접 수행하거나 제37조의6제1항 침해사고대응기관의 평가 결과 활용, 제14조의2제3항). 비중요업무는 별표 2의2 필수항목만 평가 가능
- [ ] **사전:** 평가 결과·업무연속성 계획·안전성 확보조치에 대해 정보보호위원회 심의·의결(제14조의2제2항)
- [ ] **보고:** 이용계약을 새로 체결하거나 기존 계약으로 신규 업무를 처리하게 된 날부터 **3개월 이내** 금융감독원장에게 보고하고 관련 서류를 최신 상태로 유지(제14조의2제4항)
- [ ] **제출 서류:** 보고 양식과 첨부서류는 금융감독원장이 정함(제14조의2제5항). 감독원 서식을 확인
- [ ] **제출 서류:** 망분리 구성도 및 논리적 분리 통제 증빙
- [ ] **사후:** CSP 합병·분할·재위탁 등 중대한 변경, 중요 계약사항 불이행, 평가·안전성 확보조치의 중대한 변경이 생겨도 3개월 이내 보고(제14조의2제4항제2~4호). 정기 점검 결과 내부 보관
- [ ] **연계:** 별표 2의2 평가항목과 내부통제 매핑표 작성

## CSP별 논리적 망분리 아키텍처

핵심 설계 원칙은 세 가지입니다. ① VPC/서브넷으로 업무망·인터넷망을 논리 분리, ② Bastion + PAM으로 단일 진입점 통제, ③ 모든 접근을 검증하는 Zero Trust.

```
[관리자] → [PAM/Bastion(MFA)] → [Private Subnet: 업무 서버]
                                       │
                          [NAT GW] → 제한적 아웃바운드만 허용
[인터넷망 VPC] ──(전송통제·승인)── [업무망 VPC]
        모든 트래픽 로깅 → SIEM 연동
```

CSP가 달라도 통제 개념은 동일합니다. 서비스 이름만 매핑하면 됩니다.

| 기능 | AWS | Azure | NCP |
|---|---|---|---|
| 네트워크 격리 | VPC | VNet | VPC |
| 인스턴스 방화벽 | Security Group | NSG | ACG |
| 서브넷 통제 | NACL | NSG(Subnet) | Network ACL |
| 흐름 로그 | VPC Flow Logs | NSG Flow Logs | VPC Flow Logs |
| 키 관리 | KMS | Key Vault | Key Management |

업무망 서브넷은 인터넷 게이트웨이를 연결하지 않고, 외부 통신이 필요하면 승인된 경로(NAT, Endpoint)만 화이트리스트로 여는 것이 핵심입니다.

## 빈출 지적사항 Top 5와 대응

실제 점검에서 반복적으로 나오는 지적은 정해져 있습니다.

1. **접근통제 로그 미흡** → Flow Logs·Bastion 세션 기록을 [SIEM](/blog/siem-도입-실전-가이드-선택-기준부터-운영-노하우까지)에 통합, 최소 보관기간 준수
2. **망간 자료전송 통제 부재** → VPC Peering·전송 경로에 승인 워크플로우와 DLP 적용
3. **권한관리 미비** → IAM 최소권한·정기 권한 재인증, 공용 계정 제거
4. **암호화 키 관리 주체 불명확** → KMS 키 소유·회수 권한을 금융사가 보유(BYOK 검토)
5. **이용 보고 기한 누락** → 계약 체결 즉시 보고 캘린더 등록, 변경 보고 트리거 자동화

## 논리적 망분리 구성을 기술적으로 확인하는 방법

감독기관 점검이나 내부 감사에서는 설계 문서보다 **실제 설정이 문서와 같은지**를 봅니다. 클라우드에서는 콘솔 조작 한 번으로 경로가 바뀔 수 있으므로, 설정을 주기적으로 조회해 증거로 남기는 절차가 필요합니다.

**어긋나는 흔한 원인**
- 내부 업무망으로 지정한 서브넷의 라우팅 테이블에 인터넷 게이트웨이(0.0.0.0/0) 경로가 추가됨
- 장애 대응 중 보안 그룹에 전체 허용(0.0.0.0/0) 인바운드 규칙을 임시로 넣고 제거하지 않음
- 개발 계정과 운영 계정 간 VPC 피어링·공유가 문서에 없는 형태로 생김

**점검 명령 (AWS 예시)**

```bash
# 인터넷 게이트웨이로 기본 경로가 나가는 라우팅 테이블
aws ec2 describe-route-tables \
  --query "RouteTables[?Routes[?GatewayId!=null && starts_with(GatewayId,'igw-') && DestinationCidrBlock=='0.0.0.0/0']].{id:RouteTableId,subnets:Associations[].SubnetId}"
# 전체 허용 인바운드가 있는 보안 그룹
aws ec2 describe-security-groups \
  --filters Name=ip-permission.cidr,Values=0.0.0.0/0 \
  --query "SecurityGroups[].{id:GroupId,name:GroupName}"
# VPC 피어링 현황
aws ec2 describe-vpc-peering-connections --query "VpcPeeringConnections[].{id:VpcPeeringConnectionId,status:Status.Code}"
```

Azure·GCP도 라우팅 테이블, NSG/방화벽 규칙, 피어링을 같은 관점으로 조회합니다.

**재발 방지**
- 위 조건을 AWS Config 규칙이나 정책 도구(예: OPA, 클라우드 보안 형상 관리 도구)로 상시 감시하고, 위반 시 경보와 변경 이력을 남깁니다.
- 점검 결과를 월별로 보관하면 보고·점검 대응 시 근거 자료로 활용할 수 있습니다. 예외 적용 요건 자체는 전자금융감독규정 원문과 금융위원회·금융감독원 안내를 기준으로 확인하세요.

## 참고 자료: 1차 출처 (법령·감독기관)

망분리 예외·완화 판단은 규정 원문 해석이 전제입니다. 아래 1차 출처에서 최신 조문과 감독기관 해석을 직접 대조하세요.

| 근거 | 소관 | 확인처 |
|---|---|---|
| 전자금융감독규정 망분리 관련 조항(예: 제15조 등) | 금융위원회·금융감독원 | 국가법령정보센터 최신 조문 |
| 클라우드 논리적 망분리 아키텍처·안전성 평가 기준 | 금융보안원 | 예외 적용 요건·구현 기준 |

- 전자금융감독규정 원문(2026-07-15 시행본): [국가법령정보센터](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622)
- 금융분야 클라우드 안전성 평가: [금융보안원](https://www.fsec.or.kr)

> 규정 조문 번호는 개정에 따라 달라질 수 있으므로, 보고서·품의에는 반드시 원문에서 확인한 현행 조항을 인용하세요.

## 자주 묻는 질문 (FAQ)

**Q. 논리적 망분리만으로 모든 업무를 클라우드에 올릴 수 있나요?**
A. 아닙니다. 연구·개발 목적 예외는 고유식별정보·개인신용정보를 처리하지 않는 경우에 한정되고, 클라우드를 쓰려면 업무 중요도와 관계없이 제14조의2 절차(중요도 평가, CSP 평가, 정보보호위원회 심의·의결, 보고)를 거쳐야 합니다. 고유식별정보·개인신용정보를 처리하면 정보처리시스템을 국내에 두어야 합니다.

**Q. 이용 보고는 언제까지 해야 하나요?**
A. 이용계약 신규 체결 등 사유가 발생한 날부터 3개월 이내 금융감독원장에게 보고합니다(제14조의2제4항). 중요도 평가, CSP 평가, 정보보호위원회 심의·의결은 이용 전에 거칩니다.

**Q. 감독 대응에서 가장 먼저 챙길 것은?**
A. 데이터·업무 중요도 분류와 접근통제 로그입니다. 분류가 명확하고 로그가 SIEM에 통합돼 있으면 대부분의 지적을 예방할 수 있습니다.

## 출처 · 확인일 2026-10-04
- [국가법령정보센터, 전자금융감독규정(2026-07-15 시행, 금융위원회고시 제2026-29호)](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622) — 제14조의2(클라우드 이용절차, 사유 발생일부터 3개월 이내 보고, 제7항 CSP 전산실 적용 제외·국내 설치), 제15조제1항제3호·제5호(망분리와 예외), 제8조의2(정보보호위원회), 제13조·제19조(전산자료 보호, 키 관리)$sr$, content_evidence=jsonb_set($j${"en": {"title": "Practical Guide to Cloud Network Separation Exceptions under the 2026 Electronic Financial Supervisory Regulations", "content": "# Practical Guide to Cloud Network Separation Exceptions under the 2026 Electronic Financial Supervisory Regulations\n\n\"We want to use the cloud, but network separation won't let us.\" That is the line you hear most often in the field at financial institutions and fintechs. In practice, though, the real problem is not that you cannot use the cloud—it is that **you do not know which conditions to meet, what to submit, and when**. This article follows the Electronic Financial Supervisory Regulations in force since 2026-07-15 (FSC Notice No. 2026-29; [National Law Information Center](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622), checked 2026-10-04). This article goes beyond parsing the regulation text and lays out checklists and CSP implementation architectures that practitioners can put to work immediately.\n\n## Re-reading the network separation provisions from a cloud perspective\n\nRead abstractly, the network-separation obligations in the Electronic Financial Supervisory Regulations sound like \"block everything.\" Breaking the issues down from a cloud-adoption perspective makes decisions much easier.\n\n| Provision / basis | Core obligation | Interpretation issues when applying to cloud |\n|---|---|---|\n| Article 15 (Measures against hacking, etc.) | Separate internal business systems from external networks (para. 1 item 3); physically separate data-center systems and terminals that connect directly for operations, development, or security (para. 1 item 5) | Can equivalence be demonstrated via logical separation at the VPC/subnet level rather than \"physical cable separation\"? |\n| Article 15 control of data transfer between networks | Control and approval when moving data between networks | Scope of control and logging for data-movement paths such as VPC Peering and S3 Gateway within the CSP |\n| Article 14-2 (Cloud computing service usage procedures) | Before use: criticality assessment, CSP soundness/security assessment, business continuity and security measures, review and resolution by the information security committee; report within 3 months of the triggering event | For non-critical work, only the mandatory items in Annex 2-2, 2-3 and 2-4 are required |\n| Article 13 (Protection of computer data) and Article 19 (Control of encryption programs and keys) | Least-privilege access; procedures for key injection, operation, renewal and disposal | Who owns key management (KMS); boundary of the CSP shared-responsibility model |\n| Related notices (Financial sector cloud guidelines) | Security assessment and usage reporting | Scope of systems subject to assessment and how to calculate filing deadlines |\n\nThe regulation keeps separation as the rule and lists specific exceptions. To use one, you must be able to **demonstrate** that its conditions are met.\n\n## How far do the current exceptions go?\n\nThese are the exceptions written into the current provisions. This is not an across-the-board loosening—each is an **exception with conditions and approvals attached**. Check FSC and FSS announcements separately for relaxations outside the regulation text (such as regulatory sandboxes).\n\n| Exception | Provision | Conditions |\n|---|---|---|\n| R&D purposes | Art. 15(1)3(a) and 15(1)5(a) | No processing of users' unique identifiers or personal credit information (pseudonymized data excluded); internal risk assessment, then the alternative controls set by the FSS Governor; approval by the information security committee |\n| Unavoidable business need | Art. 15(1)3(b) and 15(1)5(b) | Confirmation (item 3) or recognition (item 5) by the FSS Governor |\n| CSP data centers | Art. 14-2(7) | Data centers housing systems of a CSP that went through the Art. 14-2(1) procedure are exempt from Art. 11(1)–(2) and Art. 15(1)5 (physical separation) |\n| Processing unique identifiers or personal credit information in the cloud | Proviso to Art. 14-2(7) | Art. 11(2) applies and the systems must be located in Korea (some branches of foreign financial institutions, etc. excepted) |\n\n> **Practitioner tip:** The starting point for applying an exception is data classification that first defines whether the system is critical work. If classification is ambiguous, that is the first thing that will trip you up at the supervisory stage.\n\n## Filing and reporting procedure checklist\n\nSigning a usage contract with a CSP is not the end. Missing a reporting deadline is itself a finding.\n\n- [ ] **Before use:** Perform a criticality assessment and business impact analysis\n- [ ] **Before use:** Assess the CSP's soundness and security (do it yourself or use the assessment by an incident response institution under Art. 37-6(1), Art. 14-2(3)); for non-critical work, only the mandatory items in Annex 2-2\n- [ ] **Before use:** Have the information security committee review and resolve on the assessment results, business continuity plan and security measures (Art. 14-2(2))\n- [ ] **Report:** Report to the FSS Governor within **3 months** of signing a new usage contract or starting new work under an existing contract, and keep the documents up to date (Art. 14-2(4))\n- [ ] **Documents to submit:** The report form and attachments are set by the FSS Governor (Art. 14-2(5)); check the FSS forms\n- [ ] **Documents to submit:** Network separation architecture diagram and evidence of logical separation controls\n- [ ] **After the fact:** Also report within 3 months on material CSP changes (merger, split, re-outsourcing, etc.), failure to meet key contract terms, or material changes to assessments or security measures (Art. 14-2(4) items 2–4); retain periodic inspection results internally\n- [ ] **Linkage:** Prepare a mapping table between the Annex 2-2 assessment items and internal controls\n\n## Logical network separation architecture by CSP\n\nThere are three core design principles: (1) logically separate the business network and internet network with VPCs/subnets; (2) control a single entry point with Bastion + PAM; (3) Zero Trust that verifies every access.\n\n```\n[Admin] → [PAM/Bastion(MFA)] → [Private Subnet: business servers]\n                                       │\n                          [NAT GW] → Restricted outbound only\n[Internet-network VPC] ──(transfer control & approval)── [Business-network VPC]\n        Log all traffic → SIEM integration\n```\n\nThe control concepts are the same regardless of CSP. You only need to map the service names.\n\n| Function | AWS | Azure | NCP |\n|---|---|---|---|\n| Network isolation | VPC | VNet | VPC |\n| Instance firewall | Security Group | NSG | ACG |\n| Subnet control | NACL | NSG(Subnet) | Network ACL |\n| Flow logs | VPC Flow Logs | NSG Flow Logs | VPC Flow Logs |\n| Key management | KMS | Key Vault | Key Management |\n\nThe key is not to attach an internet gateway to the business-network subnet, and if external communication is needed, whitelist only approved paths (NAT, Endpoint).\n\n## Top 5 frequently cited findings and how to respond\n\nThe findings that come up repeatedly in actual inspections are well known.\n\n1. **Insufficient access-control logs** → Integrate Flow Logs and Bastion session records into [SIEM](/blog/siem-도입-실전-가이드-선택-기준부터-운영-노하우까지); comply with minimum retention periods\n2. **No control over inter-network data transfer** → Apply an approval workflow and DLP to VPC Peering and transfer paths\n3. **Inadequate privilege management** → IAM least privilege, periodic privilege recertification, and removal of shared accounts\n4. **Unclear ownership of encryption key management** → The financial institution retains KMS key ownership and revocation rights (consider BYOK)\n5. **Missed usage-reporting deadlines** → Register a reporting calendar as soon as the contract is signed; automate change-report triggers\n\n## Technically Verifying a Logical Network Separation Setup\n\nRegulatory inspections and internal audits look at **whether actual settings match the documents**, not just the design. In the cloud a single console action can change a path, so you need a routine that queries settings and keeps them as evidence.\n\n**Common causes of drift**\n- An internet gateway route (0.0.0.0/0) is added to a route table of a subnet designated as the internal business network\n- An allow-all (0.0.0.0/0) inbound rule added during an incident is never removed\n- VPC peering or sharing between dev and production accounts appears in a form not in the documents\n\n**Checks (AWS example)**\n\n```bash\n# route tables with a default route to an internet gateway\naws ec2 describe-route-tables \\\n  --query \"RouteTables[?Routes[?GatewayId!=null && starts_with(GatewayId,'igw-') && DestinationCidrBlock=='0.0.0.0/0']].{id:RouteTableId,subnets:Associations[].SubnetId}\"\n# security groups with allow-all inbound\naws ec2 describe-security-groups \\\n  --filters Name=ip-permission.cidr,Values=0.0.0.0/0 \\\n  --query \"SecurityGroups[].{id:GroupId,name:GroupName}\"\n# VPC peering\naws ec2 describe-vpc-peering-connections --query \"VpcPeeringConnections[].{id:VpcPeeringConnectionId,status:Status.Code}\"\n```\n\nOn Azure and GCP, query route tables, NSG/firewall rules, and peering from the same angle.\n\n**Prevention**\n- Monitor these conditions continuously with AWS Config rules or policy tools (e.g., OPA, cloud security posture management) and keep alerts and change history on violations.\n- Keeping monthly check results gives you evidence for reporting and inspections. Check the exception requirements themselves against the Electronic Financial Supervisory Regulations and guidance from the Financial Services Commission and Financial Supervisory Service.\n\n## References: primary sources (statutes and supervisory authorities)\n\nJudgments on network-separation exceptions and relaxations presuppose interpretation of the regulation text. Cross-check the latest provisions and supervisory interpretations directly from the primary sources below.\n\n| Basis | Competent authority | Where to check |\n|---|---|---|\n| Electronic Financial Supervisory Regulations provisions on network separation (e.g., Article 15) | Financial Services Commission (FSC) / Financial Supervisory Service (FSS) | Latest provisions at the National Law Information Center |\n| Cloud logical network-separation architecture and security assessment criteria | Financial Security Institute (FSI) | Exception requirements and implementation criteria |\n\n- Full text of the Electronic Financial Supervisory Regulations (version in force since 2026-07-15): [National Law Information Center](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622)\n- Financial sector cloud security assessment: [Financial Security Institute](https://www.fsec.or.kr)\n\n> Article numbers in the regulations may change with revisions, so always cite the current provisions as confirmed in the original text in reports and internal approval memos.\n\n## Frequently asked questions (FAQ)\n\n**Q. Can you put all workloads in the cloud with logical network separation alone?**\nA. No. The R&D exception only applies when no unique identifiers or personal credit information are processed, and any cloud use goes through the Art. 14-2 procedure (criticality assessment, CSP assessment, committee resolution, reporting) regardless of criticality. If you process unique identifiers or personal credit information, the systems must be located in Korea.\n\n**Q. By when must the usage report be filed?**\nA. Report to the FSS Governor within 3 months of the triggering event, such as signing a new usage contract (Art. 14-2(4)). The criticality assessment, CSP assessment and committee resolution come before use.\n\n**Q. What should you take care of first when preparing for supervision?**\nA. Data/work criticality classification and access-control logs. If classification is clear and logs are integrated into SIEM, you can prevent most findings.\n\n## Sources · checked 2026-10-04\n- [National Law Information Center, Electronic Financial Supervisory Regulations (in force 2026-07-15, FSC Notice No. 2026-29)](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622) — Art. 14-2 (cloud usage procedure, report within 3 months, para. 7 CSP data-center exemption and domestic location), Art. 15(1) items 3 and 5 (network separation and exceptions), Art. 8-2 (information security committee), Arts. 13 and 19 (data protection, key management)", "excerpt": "A checklist of the conditions for applying cloud network separation exceptions and the usage reporting procedures under the 2026 revised Electronic Financial Supervisory Regulations. Review AWS, Azure, and NCP logical network-separation architectures and how to address frequently cited findings—all in one place."}, "verifiedAt": "2026-10-04", "changeSummary": "현행 전자금융감독규정(2026-07-15 시행, 금융위원회고시 제2026-29호) 원문 대조: 클라우드 이용절차 조문을 제8조의2→제14조의2로, 없는 조문 제17조의2→제13조·제19조로 정정. 이용 보고 기한 \"계약 후 7영업일\"→사유 발생일부터 3개월 이내(제14조의2④). 근거 없는 \"2026 완화\" 표를 조문에 적힌 예외(제15조①3·5호, 제14조의2⑦)로 교체. 정보보호위원회 심의·의결, 평가 결과 활용 규정 반영. 출처·확인일 추가.", "officialSources": ["https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282622"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=604 AND md5(content)='6f4050ca2b4f5414e951947435165dd9' AND md5(content_evidence::text)='eab5d42c1058dbd2d766a8cb06a0dc2c' AND md5(coalesce(array_to_string(tags,'|'),''))='dcb579b897f83da4999bcfcb69e1d303';
COMMIT;
