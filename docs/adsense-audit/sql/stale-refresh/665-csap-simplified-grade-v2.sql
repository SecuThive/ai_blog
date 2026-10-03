-- stale-refresh 2026-10-04 post #665 2026-csap-간편등급-준비-체크리스트-공공-saas-실전-가이드
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$# 2026 CSAP 간편등급 준비 체크리스트 — SaaS 사업자 실전 가이드

"공공기관에 SaaS 납품하려는데, CSAP가 없으면 입찰 자체가 안 된다"는 이야기를 듣고 이 글을 찾아오셨다면 제대로 오셨습니다. 지금 공공 클라우드 시장에 들어가려면 CSAP(클라우드 보안인증)를 먼저 받은 뒤 국가정보원의 보안 검증도 거쳐야 합니다.

문제는 처음 준비하는 보안·인프라 담당자가 가장 먼저 막히는 지점이 의외로 단순하다는 데 있습니다. **"우리 서비스는 표준등급이야 간편등급이야?"** 여기서부터 헷갈리면 견적도, 일정도, 산출물 준비도 전부 어긋납니다. 이 글은 그 첫 단추부터 신청 절차·비용, 자주 탈락하는 통제 항목, 복붙해서 바로 쓰는 산출물 목록까지 한 번에 정리합니다.

> ⚠️ **면책 안내**: 평가 항목 수·세부 비용·소요 기간은 KISA 및 평가기관(인증기관)의 최신 고시와 견적에 따라 달라집니다. 아래 수치는 실무 준비를 위한 개략 가이드이며, 반드시 KISA CSAP 공식 안내와 평가기관 상담으로 최종 확인하세요.

> 📌 **제도 개편 예정(2026-04-20 발표)**: 과기정통부와 국정원은 [공동 보도자료](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189)에서 CSAP와 국정원 보안 검증으로 나뉜 공공 클라우드 검증을 **국정원 단일 검증 체계**로 일원화한다고 밝혔습니다. 2026년 상반기 중 「국가 클라우드컴퓨팅 보안 가이드라인」 등을 개정하고 **1년 유예** 후 **2027년 하반기부터** 본격 시행할 예정이며, 시행 전에 받은 CSAP는 **유효기간을 그대로 인정**합니다. 민간 클라우드 범용 영역은 ISMS에 클라우드 서비스 분야 자율 보안인증으로 통합할 계획입니다. 새 검증의 세부 항목·등급은 보도자료에 없으므로, 아래 체크리스트는 현행 CSAP 기준입니다.

## 표준등급 vs 간편등급: 우리 서비스는 어디에 해당하나

현행 [「클라우드컴퓨팅서비스 보안인증에 관한 고시」](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804)(과학기술정보통신부고시 제2023-4호, 2023-01-31 시행)는 보안인증 등급을 정보보호 수준에 따라 **상·중·하**로 정하되, 상·중 등급은 별도 기준을 마련한 뒤 시행하도록 했습니다(부칙 제1조). 그 전까지는 종전 유형(IaaS, SaaS 표준, SaaS 간편 등)으로 신청할 수 있고, 기존 SaaS 간편 인증은 하등급 인증으로 인정될 수 있습니다(부칙 제3조). 상·중 등급 시행 여부와 지금 신청할 수 있는 유형은 KISA CSAP 안내에서 꼭 확인하세요. 이 글은 실무에서 쓰는 구분인 **"비중요 정보 → 간편등급(하 등급 트랙)"**, **"중요 정보 → 표준등급"**을 기준으로 설명합니다. 대부분의 협업툴·일정관리·CRM 같은 일반 업무용 SaaS는 간편등급 대상에 해당합니다.

| 구분 | 간편등급 | 표준등급 |
| --- | --- | --- |
| 적용 대상 | 비중요 정보 처리 SaaS | 중요 정보(주민번호·민감정보 등) 처리 시스템 |
| 평가 항목 수 | 상대적으로 적음(간소화) | 항목 수 많음(전체 통제) |
| 현장평가 | 원칙적으로 서면 중심(간소화) | 서면 + 현장평가 |
| 멀티테넌시 격리 | 논리적 분리 허용 폭 넓음 | 더 엄격한 분리 요건 |
| 적합한 서비스 | 일반 업무용 SaaS, 비중요 협업툴 | 행정정보·개인정보 대량 처리 서비스 |
| 준비 부담 | 중 | 상 |

**판단 팁**: 우리 서비스가 처리하는 정보가 "유출돼도 국민/행정에 미치는 영향이 제한적인가?"를 먼저 따져 보세요. 그렇다면 간편등급 트랙으로 준비하되, 발주처(수요기관)가 요구하는 등급을 사전에 반드시 확인해야 합니다. 기관이 '중' 등급을 요구하는데 '하'로 준비하면 입찰에서 무용지물입니다.

## 신청 절차·소요 기간·비용 로드맵

신청부터 인증서 발급까지는 짧게는 4개월, 보완이 길어지면 6개월 이상도 걸립니다. 일정을 거꾸로 계산해 입찰 시점에서 최소 6개월 전에는 착수하는 것을 권합니다.

| 단계 | 주체 | 누적 예상 기간 | 비용 개략(견적 의존) |
| --- | --- | --- | --- |
| 1. 신청·사전상담 | 사업자 → 평가기관 | ~0.5개월 | 상담 단계 |
| 2. 계약 | 사업자·평가기관 | ~1개월 | 평가 수수료 계약 체결 |
| 3. 평가 준비(산출물 작성) | 사업자 | ~2개월 | 내부 인건비/컨설팅 비용 |
| 4. 서면·(현장)평가 | 평가기관 | ~3.5개월 | 평가 수수료에 포함 |
| 5. 보완 조치 | 사업자 | ~4.5개월 | 보완 작업 비용 |
| 6. 인증위원회 심의 | KISA/인증기관 | ~5개월 | — |
| 7. 인증서 발급 | 인증기관 | ~5~6개월 | — |

> 비용은 시스템 규모·평가 범위에 따라 수천만 원대까지 편차가 큽니다. 정확한 금액은 평가기관 견적이 유일한 기준입니다.

## 자주 걸리는 통제 체크리스트 (복붙용)

사내 점검은 이 표를 그대로 복사해 시작하세요. 처음 준비할 때 가장 많이 지적받는 통제만 추렸습니다.

| 통제 영역 | 충족 기준 | 증빙 | 체크 |
| --- | --- | --- | --- |
| 계정·권한 분리 | 업무별 최소권한, 공용계정 미사용, 권한 부여/회수 절차 운영 | 접근권한 관리대장, 승인 이력 | ☐ |
| 관리자 접근 통제 | 관리자 콘솔 MFA 적용, 접근 IP 제한, 작업 로깅 | MFA 설정 화면, 접근통제 정책 | ☐ |
| 전송구간 암호화 | 모든 외부 통신 TLS 1.2 이상 강제 | SSL 설정, 스캔 결과 | ☐ |
| 저장 데이터 암호화 | DB·스토리지 저장 시 암호화 적용 | 암호화 설정, 적용 대상 목록 | ☐ |
| 키 관리 | 암호키 분리 보관, 주기적 교체, 접근 통제 | 키관리 정책, KMS 설정 | ☐ |
| 로그 보관기간 | 법정·기준 보관기간 충족(통상 1년 이상), 위변조 방지 | 로그관리 대장, 보존 정책 | ☐ |
| 물리·논리적 분리 | 공공 영역 분리, 멀티테넌시 테넌트 격리 | 시스템 구성도, 격리 설계서 | ☐ |
| 백업·복구 | 정기 백업, 복구 절차 및 복구 테스트 수행 | 백업 정책, 복구 테스트 기록 | ☐ |
| 보안패치 관리 | OS·미들웨어 패치 주기 정의 및 이행 | 패치 관리대장, 변경 기록 | ☐ |

## 사전 준비 산출물 목록

평가는 결국 "문서로 증명"하는 과정입니다. 운영은 잘 하는데 문서가 없어 보완으로 밀리는 경우가 가장 흔합니다. 아래 산출물을 미리 채워 두세요.

| 산출물명 | 용도 | 준비 난이도 |
| --- | --- | --- |
| 정보보호정책·지침 | 통제 운영의 근거 문서 | 중 |
| 시스템 구성도 | 인프라·네트워크·분리 구조 증빙 | 중 |
| 자산목록 | 하드웨어·소프트웨어·데이터 식별 | 하 |
| 접근권한 관리대장 | 계정·권한 부여/회수 이력 | 중 |
| 암호화 정책 | 전송·저장·키 관리 기준 명시 | 중 |
| 로그관리 대장 | 보관기간·대상·점검 주기 | 하 |
| 변경관리 기록 | 패치·구성 변경 이력 추적 | 중 |
| 위탁(CSP) 관련 증빙 | 사용 중인 IaaS의 CSAP 인증 확인서·계약서 | 상 |

## 흔한 탈락·보완 사유 — 미리 피하세요

실무에서 반복적으로 나오는 보완 사유입니다. 착수 전에 먼저 확인하면 한 라운드를 통째로 아낄 수 있습니다.

- **로그 보관기간 미달**: "운영 편의상 30일만 보관" 같은 설정이 가장 흔한 지적. 기준 보관기간을 충족하도록 사전 설정.
- **관리자 MFA 미적용**: 서비스 사용자에는 MFA를 걸어 두고 정작 관리자 콘솔은 ID/PW만 쓰는 경우. 반드시 관리자 계정 MFA 적용.
- **IaaS CSAP 인증 미확인**: SaaS가 올라탄 클라우드 인프라(IaaS) 자체가 CSAP 인증을 받았는지 확인하지 않은 사례. **SaaS 인증은 인증받은 IaaS 위에서만 의미가 있습니다.** CSP 인증 범위를 반드시 확인하세요.
- **물리적 분리 요건 오해**: 간편등급도 표준등급 수준의 물리 분리가 필요하다고 과하게 해석하거나, 반대로 논리 격리 설계를 증빙 없이 주장하는 경우. 등급별 요건을 정확히 매핑.
- **정책문서와 실제 운영 불일치**: 문서에는 "분기별 패치"라 써 두고 실제 패치 이력이 없으면 즉시 보완. **문서는 운영을 반영해야 하고, 운영은 문서대로 이뤄져야 합니다.**

### 현장에서 느낀 한 가지

여러 첫 CSAP 준비 사례를 보면, 기술 통제보다 **"문서-운영 일치"에서 시간을 가장 많이 까먹습니다.** TLS, 암호화, MFA는 설정 한두 번이면 끝나지만, 정책문서에 적은 주기와 실제 운영 로그가 어긋나면 보완 라운드가 반복되며 한두 달이 사라집니다. 그래서 저는 산출물부터 만들지 말고, **현재 운영 상태를 먼저 정직하게 기록한 뒤 그에 맞춰 정책 문구를 정렬**하라고 권합니다. 이상적인 정책을 먼저 쓰면 반드시 운영이 못 따라옵니다.

## 결론: 준비 우선순위 3단계

1. **등급 확정**: 수요기관 요구 등급 + 처리 정보 중요도로 간편/표준을 먼저 확정한다.
2. **인프라 전제 확인**: 올라탈 IaaS의 CSAP 인증 범위를 검증하고, MFA·로그 보관·암호화 등 빈출 탈락 항목부터 설정한다.
3. **문서-운영 정렬**: 산출물 8종을 실제 운영 기준으로 작성하고, 정책과 실제 이력의 불일치를 제거한다.

이 3단계를 마치면 평가기관 상담에 들어갈 준비가 된 것입니다. 위 표들을 사내 위키에 복붙해 담당자별로 체크박스를 나눠 채워 보세요.

## 자주 묻는 질문 (FAQ)

**Q. 우리는 비중요 SaaS인데 무조건 간편등급으로 가도 되나요?**
A. 처리 정보 기준으로는 간편등급 대상이라도, **납품할 공공기관이 요구하는 등급**이 우선입니다. 입찰 공고나 사전 협의에서 요구 등급을 먼저 확인하세요.

**Q. IaaS(클라우드 인프라)도 따로 CSAP를 받아야 하나요?**
A. SaaS 사업자가 IaaS까지 인증받을 필요는 없지만, **반드시 CSAP 인증을 받은 IaaS 위에서 서비스해야** 합니다. 사용 중인 CSP의 인증 범위·확인서를 증빙으로 확보하세요.

**Q. 준비 기간과 비용은 정확히 얼마인가요?**
A. 통상 신청부터 발급까지 4~6개월, 비용은 규모에 따라 편차가 큽니다. 정확한 항목 수·수수료·기간은 KISA CSAP 공식 안내와 평가기관 견적으로 확정하는 것이 유일하게 정확한 방법입니다.

## 출처 · 확인일 2026-10-04
- [과학기술정보통신부 보도자료, 과기정통부·국정원, 공공 인터넷 기반 자원 공유(클라우드) 시장 진입 절차 개선 방안 발표 (2026-04-20)](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189) — 국정원 단일 검증 체계, 2026년 상반기 지침 개정, 1년 유예 후 2027년 하반기 시행 예정, 기존 CSAP 유효기간 인정, 민간 범용 영역 ISMS 통합 계획
- [국가법령정보센터, 클라우드컴퓨팅서비스 보안인증에 관한 고시(과기정통부고시 제2023-4호, 2023-01-31 시행)](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804) — 제14조(유형: IaaS·SaaS·PaaS·복합, 등급: 상·중·하), 부칙 제1조(상·중 등급은 별도 기준 마련 후 시행), 부칙 제3조(종전 유형 신청, SaaS 간편 → 하등급 인정)

평가 기간·비용 수치는 공식 자료로 확인하지 못한 개략치입니다. 인증 제도와 고시는 바뀔 수 있으니 신청 전에 KISA와 과학기술정보통신부 공지를 다시 확인하세요.$sr$, content_evidence=jsonb_set($j${"en": {"title": "2026 CSAP Simplified Grade Prep Checklist — A Practical Guide for Public SaaS", "content": "# 2026 CSAP Simplified Grade Prep Checklist — A Practical Guide for SaaS Providers\n\nIf you found this article after hearing that “you cannot even bid on public-institution SaaS without CSAP,” you are in the right place. Today, entering the public cloud market requires CSAP (Cloud Security Certification) first and then an NIS security verification as well.\n\nThe first place security and infrastructure owners get stuck is surprisingly simple: **“Is our service Standard Grade or Simplified Grade?”** Get that wrong and your quotes, timeline, and deliverables all go off track. This article walks through that first decision, then the application process and costs, frequently failed controls, and a copy-paste-ready list of artifacts.\n\n> ⚠️ **Disclaimer**: The number of assessment items, detailed costs, and lead times change with the latest KISA and assessment-body (certification body) notices and quotes. Figures below are a rough guide for practical prep. Always confirm against official KISA CSAP guidance and a consultation with an assessment body.\n\n> 📌 **Reform ahead (announced 2026-04-20)**: In a [joint press release](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189), MSIT and the NIS said public cloud verification, currently split between CSAP and the NIS security verification, will be unified into a **single NIS verification system**. The National Cloud Computing Security Guideline and related rules are to be revised in the first half of 2026, with full enforcement **from the second half of 2027** after a **one-year grace period**; CSAP certifications obtained before then **keep their validity period**. The private general-purpose cloud area is planned to be folded into ISMS as a voluntary cloud-service certification. The release gives no detailed items or grades for the new verification, so the checklist below follows the current CSAP rules.\n\n## Standard Grade vs. Simplified Grade: Which applies to our service?\n\nThe current [Notice on Security Certification of Cloud Computing Services](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804) (MSIT Notice No. 2023-4, in force 2023-01-31) sets certification grades of **High, Medium and Low** by information-protection level, but High and Medium only take effect once separate criteria are prepared (Addenda Art. 1). Until then, applicants can apply under the previous types (IaaS, SaaS Standard, SaaS Simplified, etc.), and an existing SaaS Simplified certification can be recognized as Low grade (Addenda Art. 3). Check KISA's CSAP guidance for whether High/Medium are in effect and which types you can apply for now. This guide uses the split practitioners work with: **“non-critical information → Simplified Grade (Low-grade track)”** vs. **“critical information → Standard Grade.”** Most general business SaaS — collaboration tools, scheduling, CRM, and the like — falls under Simplified Grade.\n\n| Category | Simplified Grade | Standard Grade |\n| --- | --- | --- |\n| Scope | SaaS that processes non-critical information | Systems that process critical information (resident registration numbers, sensitive data, etc.) |\n| Number of assessment items | Relatively few (streamlined) | Many items (full control set) |\n| On-site assessment | Primarily document-based in principle (streamlined) | Document review + on-site assessment |\n| Multi-tenancy isolation | Broader allowance for logical isolation | Stricter isolation requirements |\n| Typical services | General business SaaS, non-critical collaboration tools | Administrative information and high-volume personal-data processing services |\n| Prep burden | Medium | High |\n\n**Decision tip**: Start by asking whether a leak of the information your service processes would have only limited impact on citizens or public administration. If so, prepare on the Simplified Grade track — but **always confirm the grade the contracting agency (demanding institution) actually requires**. If the agency requires Medium and you prepared Low, the certification is useless in the bid.\n\n## Application process, timeline, and cost roadmap\n\nFrom application to certificate issuance takes as little as 4 months, and 6 months or more if remediation drags on. Work backward from the bid date and start at least 6 months ahead.\n\n| Stage | Owner | Cumulative estimated duration | Cost (quote-dependent, approximate) |\n| --- | --- | --- | --- |\n| 1. Application and pre-consultation | Provider → assessment body | ~0.5 months | Consultation stage |\n| 2. Contract | Provider and assessment body | ~1 month | Assessment-fee contract signed |\n| 3. Assessment prep (writing artifacts) | Provider | ~2 months | Internal labor / consulting cost |\n| 4. Document and (on-site) assessment | Assessment body | ~3.5 months | Included in assessment fees |\n| 5. Remediation | Provider | ~4.5 months | Remediation work cost |\n| 6. Certification committee review | KISA / certification body | ~5 months | — |\n| 7. Certificate issuance | Certification body | ~5–6 months | — |\n\n> Costs vary widely, up into the tens of millions of KRW, depending on system scale and assessment scope. The assessment body’s quote is the only reliable figure.\n\n## Frequently flagged controls checklist (copy-paste ready)\n\nStart your internal review by copying this table as-is. These are the controls most often cited when teams prepare for the first time.\n\n| Control area | Pass criteria | Evidence | Check |\n| --- | --- | --- | --- |\n| Account and privilege separation | Least privilege by role, no shared accounts, grant/revoke procedures in operation | Access-privilege register, approval history | ☐ |\n| Administrator access control | MFA on the admin console, source-IP restriction, activity logging | MFA configuration screens, access-control policy | ☐ |\n| Encryption in transit | TLS 1.2 or higher enforced on all external communications | SSL configuration, scan results | ☐ |\n| Encryption at rest | Encryption applied to DB and storage | Encryption settings, list of in-scope assets | ☐ |\n| Key management | Keys stored separately, rotated periodically, access controlled | Key-management policy, KMS configuration | ☐ |\n| Log retention period | Meets statutory/baseline retention (typically 1 year or more), tamper protection | Log-management register, retention policy | ☐ |\n| Physical and logical isolation | Public-sector zone isolation, multi-tenant isolation | System architecture diagram, isolation design | ☐ |\n| Backup and recovery | Regular backups, recovery procedures, and recovery tests performed | Backup policy, recovery-test records | ☐ |\n| Security patch management | Defined OS/middleware patch cycle and actual execution | Patch-management register, change records | ☐ |\n\n## Pre-assessment deliverables list\n\nAssessment is ultimately a process of **proving things in writing**. The most common delay is operations that work well but have no documents, which then get pushed into remediation. Fill these artifacts in advance.\n\n| Artifact | Purpose | Prep difficulty |\n| --- | --- | --- |\n| Information security policy and guidelines | Foundational documents for how controls are operated | Medium |\n| System architecture diagram | Evidence of infrastructure, network, and isolation design | Medium |\n| Asset inventory | Identification of hardware, software, and data | Low |\n| Access-privilege register | History of account and privilege grant/revoke | Medium |\n| Encryption policy | Stated standards for transit, rest, and key management | Medium |\n| Log-management register | Retention period, in-scope logs, and review cycle | Low |\n| Change-management records | Traceability of patches and configuration changes | Medium |\n| Outsourced CSP evidence | CSAP certificate and contract for the IaaS in use | High |\n\n## Common fail and remediation reasons — avoid these in advance\n\nThese remediation findings show up repeatedly in practice. Checking them before you start can save an entire round.\n\n- **Log retention too short**: Settings such as “we only keep 30 days for operational convenience” are the most common finding. Configure retention to meet the baseline in advance.\n- **No MFA on admin accounts**: MFA is on for end users, but the admin console is still ID/password only. Apply MFA to administrator accounts without exception.\n- **IaaS CSAP certification not verified**: Cases where nobody checked whether the cloud infrastructure (IaaS) the SaaS runs on is itself CSAP-certified. **SaaS certification only means something on certified IaaS.** Always verify the CSP’s certification scope.\n- **Misreading physical-isolation requirements**: Over-interpreting Simplified Grade as needing Standard Grade–level physical isolation, or claiming logical isolation with no evidence. Map requirements accurately to the grade.\n- **Policy documents vs. actual operations**: The document says “quarterly patches” but there is no patch history — instant remediation. **Documents must reflect operations, and operations must follow the documents.**\n\n### One lesson from the field\n\nLooking at first-time CSAP preparations, teams burn more time on **document–operations alignment** than on technical controls. TLS, encryption, and MFA are a setting or two. If the cycle written in the policy does not match actual operations logs, remediation rounds repeat and a month or two disappears. That is why I recommend **not starting with artifacts**: first record how you actually operate, then align the policy language to that. Write an idealized policy first and operations will never catch up.\n\n## Conclusion: three-step prep priority\n\n1. **Lock the grade**: Confirm Simplified vs. Standard from the demanding institution’s required grade plus the criticality of the information you process.\n2. **Verify the infrastructure prerequisite**: Validate the CSAP certification scope of the IaaS you run on, and configure the high-fail items first — MFA, log retention, encryption.\n3. **Align documents and operations**: Write the eight artifacts against actual operations, and remove mismatches between policy and real history.\n\nFinish these three steps and you are ready to walk into an assessment-body consultation. Copy the tables above into your internal wiki and split the checkboxes across owners.\n\n## Frequently asked questions (FAQ)\n\n**Q. We are non-critical SaaS — can we always go Simplified Grade?**\nA. Even if the information you process would put you on Simplified Grade, **the grade the public institution you sell to requires takes priority**. Confirm the required grade in the bid notice or in pre-discussions first.\n\n**Q. Does our IaaS (cloud infrastructure) also need its own CSAP?**\nA. The SaaS provider does not need to certify the IaaS itself, but **the service must run on CSAP-certified IaaS**. Obtain the CSP’s certification scope and certificate as evidence.\n\n**Q. What are the exact prep time and cost?**\nA. Typically 4–6 months from application to issuance; cost varies widely with scale. The only accurate way to lock item counts, fees, and duration is official KISA CSAP guidance plus an assessment-body quote.\n\n## Sources · checked 2026-10-04\n- [MSIT press release, 과기정통부·국정원, 공공 인터넷 기반 자원 공유(클라우드) 시장 진입 절차 개선 방안 발표 (2026-04-20)](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189) — single NIS verification system; guideline revision in H1 2026; enforcement from H2 2027 after a one-year grace period; existing CSAP validity recognized; private general-purpose area folded into ISMS\n- [National Law Information Center, Notice on Security Certification of Cloud Computing Services (MSIT Notice No. 2023-4, in force 2023-01-31)](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804) — Art. 14 (types: IaaS, SaaS, PaaS, combined; grades: High, Medium, Low), Addenda Art. 1 (High/Medium after separate criteria), Addenda Art. 3 (previous types; SaaS Simplified recognized as Low)\n\nLead-time and cost figures are rough estimates not confirmed against official sources. The scheme and notice can change, so re-check KISA and MSIT notices before applying.", "excerpt": "A 2026 CSAP Simplified Grade preparation guide for SaaS sold to public institutions. It covers Standard vs. Simplified Grade, the application process and costs, frequently failed controls, and a copy-paste-ready deliverables checklist."}, "verifiedAt": "2026-10-04", "changeSummary": "과기정통부·국정원 공동 보도자료(2026-04-20) 원문을 반영해 공공 클라우드 검증의 국정원 단일 체계 개편(1년 유예 후 2027년 하반기 시행 예정, 시행 전 CSAP 유효기간 인정, 민간 범용 영역 ISMS 통합 계획) 안내 추가, 출처 없는 \"공공 SaaS 도입 급증\" 표현 삭제, 출처 블록에 보도자료 URL 추가.", "officialSources": ["https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189", "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804"], "contentUpdatedAt": "2026-10-03T20:07:36Z"}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=665 AND md5(content)='0198cc4b11d9be576d408ab7e2c8a638' AND md5(content_evidence::text)='a49b97a4f4e98cbe9f18b71dc6f13e8f' AND md5(coalesce(array_to_string(tags,'|'),''))='61f7f76c9d27af982462608108c28bea';
COMMIT;
