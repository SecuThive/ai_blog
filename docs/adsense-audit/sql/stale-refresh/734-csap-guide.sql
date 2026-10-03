-- stale-refresh 2026-10-04 post #734 csap-인증-2026-가이드-하중상-등급-차이와-신청-절차-총정리
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET excerpt=$sr$공공 클라우드 입찰에 필요한 CSAP 인증을 현행 고시(과기정통부고시 제2023-4호) 기준 유형·등급, 신청 절차, 제출 서류, 갱신 관리로 정리하고, 2026-04-20 발표된 국정원 단일 검증 체계 개편(2027년 하반기 시행 예정)을 반영했습니다.$sr$, content=$sr$# CSAP 인증 2026 완벽 가이드: 하·중·상 등급 차이부터 신청 절차까지

## "이 사업, CSAP 없으면 입찰 자체가 안 됩니다"

공공기관 클라우드 사업 제안서를 준비하다 보면 입찰 공고 자격요건 맨 윗줄에서 이 문구를 자주 만나게 됩니다. **"CSAP(클라우드 서비스 보안인증)을 획득한 사업자에 한함."** 기술력이 아무리 뛰어나도 인증서가 없으면 제안서 접수조차 막힙니다. CSAP는 과학기술정보통신부의 [「클라우드컴퓨팅서비스 보안인증에 관한 고시」](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804)(과기정통부고시 제2023-4호)를 근거로 하고, 한국인터넷진흥원(KISA)과 인증기관이 인증 업무를 맡는 공공 클라우드 보안인증입니다. 지금은 공공 시장에 들어가려면 CSAP를 먼저 받은 뒤 국가정보원의 보안 검증도 거쳐야 합니다(아래 2026-04-20 발표로 바뀔 예정).

문제는 처음 준비하는 PM이나 보안담당자 입장에서 "내 서비스가 어떤 유형·등급을 받아야 하는지"부터 막힌다는 점입니다. 잘못된 트랙을 고르면 수개월의 준비와 적지 않은 비용이 통째로 새어 나갑니다. 이 글은 개념 설명을 최소화하고, **무엇을 어떻게 준비해야 하는지**에 집중합니다.

## 2026-04-20 발표: 공공 클라우드 검증을 국정원 단일 체계로 개편

과기정통부와 국정원은 2026-04-20(보도 시점 14:00, 4월 21일 조간) 「[과기정통부·국정원, 공공 인터넷 기반 자원 공유(클라우드) 시장 진입 절차 개선 방안 발표](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189)」를 공동 발표했습니다. 보도자료 원문에 적힌 내용은 다음과 같습니다.

- 지금까지는 과기정통부의 CSAP를 먼저 받은 뒤 국정원의 '보안 검증'도 거쳐야 했지만, 이를 **국정원 단일 검증 체계**로 일원화합니다.
- 2026년 상반기 중 「국가 클라우드컴퓨팅 보안 가이드라인」 등을 개정하고, **1년 유예기간**을 거쳐 **2027년 하반기부터** 본격 시행할 예정입니다.
- 단일 검증 체계 시행 전에 CSAP를 받은 제품은 **유효기간을 그대로 인정**합니다.
- 과기정통부 추천 인사 등 관계기관과 산·학·연 전문가로 구성된 '민관 검증심의위원회'가 검증 결과의 공정성·타당성을 평가하고, 기존 CSAP 평가기관의 전문성을 새 제도에 연계합니다.
- 민간 클라우드 범용 영역은 정보보호 관리체계 인증(ISMS)에 클라우드 서비스 분야 자율 보안인증으로 통합할 계획입니다.

보도자료에는 새 검증의 세부 항목·등급, 시행 월, CSAP 고시의 개정·폐지 일정이 나와 있지 않습니다. 아래 유형·등급·절차 설명은 현행 고시 기준이니, 신청 전에 개정된 지침과 KISA·국정원 공지를 확인하세요.

## CSAP 인증 유형 한눈에: IaaS / SaaS / DaaS

가장 먼저 결정할 것은 인증 트랙입니다. 내 서비스의 제공 모델에 따라 받아야 하는 유형이 다릅니다.

| 인증 유형 | 적용 대상 | 통제항목 규모 | 심사 방식 | 대표 적합 서비스 |
|---|---|---|---|---|
| **IaaS** | 인프라(컴퓨팅·스토리지·네트워크)를 제공 | 가장 많음 | 서류+현장(데이터센터 물리심사 포함) | 퍼블릭 클라우드 CSP |
| **SaaS 표준** | 공공기관에 제공하는 응용 서비스 | 중간 규모 | 서류+현장 | 그룹웨어, ERP, 보안관제 SaaS |
| **SaaS 간편** | 상대적으로 중요도가 낮은 SaaS, 빠른 진입 지원 | 표준보다 적음 | 간소화 심사 | 협업툴, 설문·예약, 단순 업무 SaaS |
| **DaaS** | 가상 데스크톱 서비스 | 중간~다수 | 서류+현장 | VDI 기반 업무환경 |

> 현행 고시 제14조의 인증 유형은 IaaS·SaaS·PaaS와 이들을 둘 이상 복합한 서비스입니다. SaaS 표준·간편은 종전 고시의 유형으로, 상·중 등급 시행 전까지 신청할 수 있습니다(부칙 제3조). DaaS를 어떤 유형으로 신청하는지는 KISA 안내로 확인하세요. 통제항목 수는 유형·등급별 세부 점검항목을 KISA가 홈페이지에 공개합니다(제15조제3항).

> **실무 팁**: 처음 진입하는 SaaS 사업자라면 간편등급으로 빠르게 레퍼런스를 확보한 뒤 표준으로 확장하는 전략이 현실적입니다. 다만 간편으로 취급할 수 있는 정보의 범위가 제한되니, 타겟 고객이 다루는 데이터 중요도를 먼저 확인하세요.

## 하·중·상 등급: 고시에 적힌 것

가장 혼선이 큰 부분입니다. 고시는 등급을 **정보보호 수준**에 따라 나눕니다. 등급별 취급 정보나 통제항목 수 같은 세부 기준은 고시 본문에 없으므로 KISA 안내로 확인하세요.

| 구분 | 고시 내용 | 근거 |
|---|---|---|
| 등급 | 정보보호 수준에 따라 상·중·하 | 제14조제2항 |
| 상·중 등급 시행 | 고시 시행 후 별도 기준을 마련한 뒤 시행 | 부칙 제1조 |
| 상·중 시행 전까지 | 종전 유형·등급(IaaS, SaaS 표준, SaaS 간편 등)으로 신청 가능, 별표 1~4 기준으로 평가 | 부칙 제3조 |
| SaaS 간편 | 기존 SaaS 간편 인증은 하등급 인증으로 인정 가능 | 부칙 제3조 |
| 공공기관에 제공 | 보안인증기준(별표 1~3)에 별표 4를 추가 적용 | 제15조제2항 |

핵심은 **"내가 입찰하려는 사업의 발주처가 요구하는 등급"에 맞춰야 한다**는 점입니다. 등급을 과하게 높이면 망분리·물리보안 요구로 비용과 기간이 폭증하고, 낮추면 정작 그 입찰에 참여할 수 없습니다. 공공 클라우드 검증 체계도 2026-04-20 발표에 따라 바뀔 예정이니(위 섹션), 최신 고시·지침 개정 사항을 반드시 확인하세요.

## 신청부터 인증서 발급까지: 단계별 흐름

전체 과정은 통상 **4~8개월** 규모입니다. 단계별 흐름과 현실적인 소요 기간은 다음과 같습니다.

```
1. 신청 접수            (1~2주)
       ↓
2. 평가·인증 계약 체결   (1~2주)
       ↓
3. 준비 / 자체 점검      (1~3개월)  ← 가장 변동 큰 구간
       ↓
4. 서류 심사            (3~4주)
       ↓
5. 현장 심사            (1~2주)
       ↓
6. 결함 보완            (심사 종료 다음날부터 30일, 최대 90일까지 연장 가능)
       ↓
7. 인증위원회 심의       (2~4주)
       ↓
8. 인증서 발급
```

대부분의 지연은 **3번(자체 점검)**과 **6번(결함 보완)**에서 발생합니다. 증적이 충분히 쌓이지 않은 상태로 심사를 신청하면, 보완 단계에서 "증적 기간 부족"으로 발이 묶입니다.

### 제출 서류 체크리스트

- [ ] 정보보호 정책서·지침서(최신 개정 이력 포함)
- [ ] 시스템·네트워크 구성도(망분리 구조 명시)
- [ ] 위험분석·평가 결과 보고서
- [ ] 접근통제 정책 및 계정·권한 관리 증적
- [ ] 로그 수집·보관·점검 증적
- [ ] 보안패치·취약점 점검 이력
- [ ] 물리보안(데이터센터 출입통제) 증적
- [ ] 침해사고 대응 절차 및 모의훈련 기록

### 자주 막히는 결함 사례

1. **증적 기간 부족** — 로그·점검 이력이 최소 수개월치 쌓여야 하는데 심사 직전에 시작
2. **망분리 구성 미흡** — 구성도와 실제 환경 불일치, 논리 분리 근거 부족
3. **보안패치 이력 누락** — 패치 적용 기록·검증 증적이 비어 있음
4. **권한 관리 부실** — 퇴사자 계정 미회수, 권한 검토 주기 미준수

## 갱신·사후심사 주기 관리

인증은 한 번 받고 끝이 아닙니다. 유지·갱신 주기를 미리 캘린더에 박아 두세요.

| 구분 | 시점 | 준비 포인트 |
|---|---|---|
| 인증 유효기간 | 보안인증서에 적힌 기간 | 기간은 인증서와 KISA 안내로 확인 |
| 사후심사(유지심사) | **매년 1회** | 운영 증적 상시 축적, 변경사항 반영 |
| 갱신평가 | 유효기간 만료일 **6개월 전까지** 신청 | 최초 심사 수준의 전체 재점검 |

가장 흔한 실수는 사후심사를 가볍게 보는 것입니다. 1년간 증적이 비면 결국 갱신 때 한꺼번에 터집니다. **증적은 평소에 쌓는 것이 비용을 가장 아끼는 길**입니다.

## 인증 범위와 실제 자산이 어긋나는 문제 점검

CSAP 심사에서 반복되는 문제 중 하나는 신청서에 적은 **인증 범위(서비스·자산 목록)와 실제 운영 환경이 일치하지 않는 것**입니다. 운영 중 자산이 계속 늘어나기 때문에, 준비 초기에 맞춰 둔 목록이 심사 시점에는 이미 달라져 있는 경우가 많습니다.

**원인**
- 신규 서버·스토리지·관리 콘솔이 인증 범위 문서에 반영되지 않음
- 개발·테스트 환경과 운영 환경의 망 경계가 문서와 다름
- 외부 SaaS(모니터링, 로그 분석 등)를 쓰면서 데이터 흐름도에 표시하지 않음

**점검 방법: 자산 목록 대조**

```bash
# 예: AWS 기준, 태그로 인증 범위를 표시했다면 해당 리소스 전체 조회
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=csap-scope,Values=in \
  --query 'ResourceTagMappingList[].ResourceARN' --output text | tr '\t' '\n' | sort > cloud_assets.txt
# 인증 범위 문서의 자산 목록(CSV 첫 열이 ARN이라고 가정)과 비교
cut -d, -f1 scope_assets.csv | sort > doc_assets.txt
comm -3 cloud_assets.txt doc_assets.txt
```

`comm -3` 결과에 나오는 항목이 문서에만 있거나 실제에만 있는 자산입니다. 태그가 없는 리소스도 있을 수 있으므로 계정 전체 조회 결과와 한 번 더 비교합니다.

**해결**
- 인증 범위에 포함되는 모든 리소스에 범위 태그를 강제하고, 태그 없는 리소스 생성을 정책으로 막습니다.
- 데이터 흐름도에 외부 연계 서비스를 모두 표시하고, 각 연계의 계약·보안 조치 근거를 함께 보관합니다.

**재발 방지**
- 월 1회 위 대조 작업을 돌려 차이를 변경 관리 티켓으로 처리하면, 사후심사·갱신 때 준비 부담이 줄어듭니다. 등급별 세부 요건은 KISA 공지와 관련 고시 원문으로 확인하세요.

## 결론 & ISMS-P vs CSAP FAQ

저의 실무 경험상, CSAP 준비에서 가장 손해 보는 패턴은 "입찰 공고를 보고 나서야 시작하는 것"입니다. 자체 점검과 증적 축적에만 1~3개월이 필요하기 때문에, 사업 기회를 인지한 순간 바로 트랙·등급부터 정하고 증적 수집을 시작해야 합니다.

## 자주 묻는 질문 (FAQ)

**Q. ISMS-P가 있으면 CSAP를 면제받나요?**
A. 면제는 아닙니다. 두 인증은 목적·대상이 다릅니다. ISMS-P는 정보보호·개인정보보호 관리체계 전반을 보는 인증이고, CSAP는 공공 클라우드 서비스의 보안성을 보는 인증으로 공공 조달 참여의 강제 요건입니다. 다만 일부 통제항목은 상호 인정되어, ISMS-P 보유 시 중복 항목의 증적을 일부 활용할 수 있습니다. 망분리·물리보안 등 CSAP 고유 요구는 별도 준비가 필요합니다. 2026-04-20 발표에 따르면 민간 클라우드 범용 영역은 ISMS로 통합할 계획이고, 공공 영역은 국정원 단일 검증으로 바뀔 예정입니다.

**Q. SaaS 간편등급으로 모든 공공 입찰에 참여할 수 있나요?**
A. 아닙니다. 간편등급은 취급 정보 중요도가 낮은 서비스에 한정됩니다. 발주처가 중·상 등급 또는 SaaS 표준을 요구하면 참여가 제한되니, 타겟 사업의 자격요건을 먼저 확인하세요.

**Q. 인증까지 전체 기간은 얼마나 잡아야 하나요?**
A. 자체 점검 수준과 결함 수에 따라 다르지만 통상 4~8개월을 권장합니다. 증적이 부족한 신규 사업자는 더 길어질 수 있으므로 여유 있게 일정을 잡으세요.

## 출처 · 확인일 2026-10-04
- [과학기술정보통신부 보도자료, 과기정통부·국정원, 공공 인터넷 기반 자원 공유(클라우드) 시장 진입 절차 개선 방안 발표 (2026-04-20)](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189) — 국정원 단일 검증 체계, 2026년 상반기 지침 개정, 1년 유예 후 2027년 하반기 시행 예정, 기존 CSAP 유효기간 인정, 민관 검증심의위원회, 민간 범용 영역 ISMS 통합 계획
- [국가법령정보센터, 클라우드컴퓨팅서비스 보안인증에 관한 고시(과기정통부고시 제2023-4호, 2023-01-31 시행)](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804) — 제14조(유형·등급 상·중·하), 제15조(별표 4 추가 적용, 세부 점검항목 KISA 공개), 제2조(사후평가 매년), 제17조제4항(결함 보완 30일, 최대 90일), 제20조제1항(만료 6개월 전 갱신 신청), 부칙 제1·3조

평가 기간(4~8개월)과 단계별 소요 기간은 공식 자료로 확인하지 못한 개략치입니다.$sr$, content_evidence=jsonb_set($j${"en": {"title": "CSAP Certification (2026): Low/Medium/High Grade Differences, Application Steps, and Required Documents", "content": "# CSAP Certification 2026 Complete Guide: From Low, Medium, and High Grade Differences to the Application Process\n\n## \"Without CSAP, you cannot even bid on this project\"\n\nWhen preparing proposals for public-sector cloud projects, you often see this at the top of the RFP eligibility requirements: **\"Limited to businesses that have obtained CSAP (Cloud Security Assurance Program) certification.\"** No matter how strong your technology is, without the certificate you cannot even submit a proposal. CSAP is based on MSIT's [Notice on Security Certification of Cloud Computing Services](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804) (MSIT Notice No. 2023-4), with KISA and certification bodies handling certification. Today, entering the public market requires CSAP first and then an NIS security verification as well (set to change under the 2026-04-20 announcement below).\n\nThe problem for PMs and security officers preparing for the first time is that they get stuck at the very first question: which type and grade does my service need? Choosing the wrong track can waste months of preparation and a non-trivial amount of money. This article minimizes conceptual explanation and focuses on **what to prepare and how**.\n\n## 2026-04-20 announcement: public cloud verification moves to a single NIS system\n\nOn 2026-04-20 (embargo 14:00; April 21 morning papers), MSIT and the National Intelligence Service (NIS) jointly announced \"[과기정통부·국정원, 공공 인터넷 기반 자원 공유(클라우드) 시장 진입 절차 개선 방안 발표](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189)\" (plan to improve market-entry procedures for public cloud). The original release states:\n\n- Until now, providers had to obtain MSIT's CSAP first and then also pass the NIS \"security verification\"; this is being unified into a **single NIS verification system**.\n- The National Cloud Computing Security Guideline and related rules are to be revised in the first half of 2026, then fully enforced **from the second half of 2027** after a **one-year grace period**.\n- Products certified under CSAP before the single system takes effect **keep their validity period**.\n- A public–private verification review committee, including members recommended by MSIT and experts from industry, academia and research, will assess the fairness and validity of verification results, and the expertise of existing CSAP assessment bodies will be carried into the new system.\n- For the private sector, the general-purpose cloud area is planned to be folded into ISMS as a voluntary cloud-service security certification.\n\nThe release does not give the new verification's detailed items or grades, the exact start month, or a schedule for amending or repealing the CSAP notice. The types, grades and procedures below follow the current notice, so check the revised guideline and KISA/NIS notices before applying.\n\n## CSAP Certification Types at a Glance: IaaS / SaaS / DaaS\n\nThe first decision is the certification track. The type you need depends on your service delivery model.\n\n| Certification Type | Applicable To | Control Item Scale | Assessment Method | Typical Suitable Services |\n|---|---|---|---|---|\n| **IaaS** | Providing infrastructure (compute, storage, network) | Largest | Documents + on-site (including data center physical review) | Public cloud CSPs |\n| **SaaS Standard** | Application services provided to public agencies | Medium scale | Documents + on-site | Groupware, ERP, security monitoring SaaS |\n| **SaaS Simplified** | Relatively lower-importance SaaS; supports faster entry | Fewer than Standard | Simplified assessment | Collaboration tools, surveys/reservations, simple business SaaS |\n| **DaaS** | Virtual desktop services | Medium to large | Documents + on-site | VDI-based work environments |\n\n> Under Art. 14 of the current notice, the certification types are IaaS, SaaS, PaaS, and services combining two or more of them. SaaS Standard/Simplified are types from the previous notice that can still be applied for until the High/Medium grades take effect (Addenda Art. 3). Check KISA's guidance for how DaaS is applied for. KISA publishes the detailed check items by type and grade on its website (Art. 15(3)).\n\n> **Practical tip**: For SaaS providers entering for the first time, a realistic strategy is to quickly secure references with Simplified grade, then expand to Standard. However, the scope of information that can be handled under Simplified is limited, so first check the data sensitivity of your target customers.\n\n## Low, Medium and High Grades: What the Notice Says\n\nThis is the most confusing part. The notice divides grades by **information-protection level**. Detailed criteria such as information handled or control-item counts per grade are not in the notice text, so check KISA's guidance.\n\n| Item | What the notice says | Provision |\n|---|---|---|\n| Grades | High, Medium, Low by information-protection level | Art. 14(2) |\n| High/Medium start | Take effect after separate criteria are prepared | Addenda Art. 1 |\n| Until then | Apply under the previous types/grades (IaaS, SaaS Standard, SaaS Simplified, etc.), assessed against Annexes 1–4 | Addenda Art. 3 |\n| SaaS Simplified | An existing SaaS Simplified certification can be recognized as Low grade | Addenda Art. 3 |\n| Serving public agencies | Annex 4 is applied on top of the criteria in Annexes 1–3 | Art. 15(2) |\n\nThe key is that **you must match the grade required by the contracting agency for the project you want to bid on**. Raising the grade too high causes cost and timeline to explode because of network separation and physical security requirements; lowering it means you cannot participate in that bid. The public cloud verification system is also set to change under the 2026-04-20 announcement (section above), so be sure to check the latest notice and guideline revisions.\n\n## From Application to Certificate Issuance: Step-by-Step Flow\n\nThe overall process typically takes **4–8 months**. The step-by-step flow and realistic timeframes are as follows.\n\n```\n1. Application submission            (1–2 weeks)\n       ↓\n2. Evaluation/certification contract (1–2 weeks)\n       ↓\n3. Preparation / self-assessment     (1–3 months)  ← Most variable stage\n       ↓\n4. Document review                   (3–4 weeks)\n       ↓\n5. On-site assessment                (1–2 weeks)\n       ↓\n6. Defect remediation                (30 days from the day after the audit ends; extendable up to 90)\n       ↓\n7. Certification committee review    (2–4 weeks)\n       ↓\n8. Certificate issuance\n```\n\nMost delays occur at **step 3 (self-assessment)** and **step 6 (defect remediation)**. If you apply for assessment without enough accumulated evidence, you get stuck at remediation with “insufficient evidence period.”\n\n### Document Submission Checklist\n\n- [ ] Information security policy and guidelines (including latest revision history)\n- [ ] System and network diagrams (explicitly showing network separation architecture)\n- [ ] Risk analysis and assessment report\n- [ ] Access control policy and account/privilege management evidence\n- [ ] Log collection, retention, and inspection evidence\n- [ ] Security patch and vulnerability assessment history\n- [ ] Physical security (data center access control) evidence\n- [ ] Incident response procedures and tabletop/drill records\n\n### Common Defect Cases That Get You Stuck\n\n1. **Insufficient evidence period** — Logs and inspection history need several months accumulated, but you only started just before assessment\n2. **Inadequate network separation** — Diagrams do not match the actual environment; insufficient justification for logical separation\n3. **Missing security patch history** — No records of patch application or verification evidence\n4. **Poor privilege management** — Departed employee accounts not revoked; privilege review cycle not followed\n\n## Managing Renewal and Surveillance Assessment Cycles\n\nCertification is not a one-and-done. Put maintenance and renewal cycles on the calendar in advance.\n\n| Category | Timing | Preparation Points |\n|---|---|---|\n| Certification validity | Period stated on the certificate | Confirm on the certificate and with KISA |\n| Surveillance (maintenance) assessment | **Once per year** | Continuously accumulate operational evidence; reflect changes |\n| Renewal assessment | Apply **at least 6 months before** expiry | Full re-assessment at initial assessment level |\n\nThe most common mistake is taking surveillance assessments lightly. If evidence is empty for a year, it all blows up at renewal. **Accumulating evidence as you go is the cheapest path.**\n\n## Checking for Gaps Between Certification Scope and Real Assets\n\nA recurring issue in CSAP audits is that **the certification scope in the application (services and asset list) doesn't match the running environment**. Assets keep growing in operation, so a list aligned early in preparation is often out of date by audit time.\n\n**Causes**\n- New servers, storage, or admin consoles aren't reflected in the scope document\n- Network boundaries between dev/test and production differ from the document\n- External SaaS (monitoring, log analytics) is used but missing from the data flow diagram\n\n**Check: reconcile asset lists**\n\n```bash\n# e.g. on AWS, if scope is marked with a tag, list all such resources\naws resourcegroupstaggingapi get-resources \\\n  --tag-filters Key=csap-scope,Values=in \\\n  --query 'ResourceTagMappingList[].ResourceARN' --output text | tr '\\t' '\\n' | sort > cloud_assets.txt\n# compare with the scope document's asset list (assume ARN in first CSV column)\ncut -d, -f1 scope_assets.csv | sort > doc_assets.txt\ncomm -3 cloud_assets.txt doc_assets.txt\n```\n\nLines printed by `comm -3` exist only in the document or only in reality. Some resources may be untagged, so compare once more against a full-account listing.\n\n**Fix**\n- Enforce a scope tag on every in-scope resource and block creation of untagged resources by policy.\n- Show every external integration on the data flow diagram and keep the contract and security-control evidence for each.\n\n**Prevention**\n- Run this reconciliation monthly and handle differences as change tickets; it reduces the load at surveillance and renewal audits. Check grade-specific requirements against KISA notices and the original regulatory text.\n\n## Conclusion & ISMS-P vs CSAP FAQ\n\nIn my practical experience, the most costly pattern in CSAP preparation is starting only after you see the RFP. Self-assessment and evidence accumulation alone take 1–3 months, so as soon as you recognize a business opportunity, decide the track and grade and start collecting evidence.\n\n## Frequently Asked Questions (FAQ)\n\n**Q. If we have ISMS-P, are we exempt from CSAP?**\nA. No. The two certifications have different purposes and scopes. ISMS-P covers the overall information security and personal information protection management system, while CSAP assesses the security of public cloud services and is a mandatory requirement for participating in public procurement. However, some control items are mutually recognized, so if you hold ISMS-P you can reuse some evidence for overlapping items. CSAP-specific requirements such as network separation and physical security still need separate preparation. Under the 2026-04-20 announcement, the private general-purpose cloud area is planned to be folded into ISMS, while the public sector moves to a single NIS verification.\n\n**Q. Can we participate in all public bids with SaaS Simplified grade?**\nA. No. Simplified grade is limited to services with lower information sensitivity. If the contracting agency requires Medium/High grade or SaaS Standard, participation is restricted, so check the eligibility requirements of your target projects first.\n\n**Q. How long should we plan for the entire process through certification?**\nA. It varies by self-assessment maturity and number of findings, but typically 4–8 months is recommended. New providers with insufficient evidence may take longer, so build in buffer.\n\n## Sources · checked 2026-10-04\n- [MSIT press release, 과기정통부·국정원, 공공 인터넷 기반 자원 공유(클라우드) 시장 진입 절차 개선 방안 발표 (2026-04-20)](https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189) — single NIS verification system; guideline revision in H1 2026; full enforcement from H2 2027 after a one-year grace period; existing CSAP validity recognized; public–private review committee; private general-purpose area folded into ISMS\n- [National Law Information Center, Notice on Security Certification of Cloud Computing Services (MSIT Notice No. 2023-4, in force 2023-01-31)](https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804) — Art. 14 (types; grades High/Medium/Low), Art. 15 (Annex 4 for public agencies; KISA publishes check items), Art. 2 (annual surveillance assessment), Art. 17(4) (remediation 30 days, up to 90), Art. 20(1) (renewal application 6 months before expiry), Addenda Arts. 1 and 3\n\nThe overall timeline (4–8 months) and per-step durations are rough estimates not confirmed against official sources.", "excerpt": "A guide to CSAP certification for public cloud bids in Korea: types and grades under the current notice (MSIT Notice No. 2023-4), the application process, documents, and renewal—updated for the 2026-04-20 announcement of a single NIS verification system (planned from the second half of 2027)."}, "verifiedAt": "2026-10-04", "changeSummary": "과기정통부·국정원 공동 보도자료(2026-04-20, 공공 클라우드 시장 진입 절차 개선 방안) 원문을 반영해 국정원 단일 검증 체계 개편(1년 유예 후 2027년 하반기 시행 예정, 기존 CSAP 유효기간 인정, 민간 범용 영역 ISMS 통합 계획) 섹션 추가. 고시 소관을 디지털플랫폼정부위원회→과기정통부(과기정통부고시 제2023-4호)로 정정, 근거 없는 등급별 세부표를 고시 조문(제14조, 부칙 제1·3조, 제15조②) 표로 교체, 결함 보완 기한·갱신 신청 시점을 고시대로 수정, 출처 없는 통제항목 수·SaaS 수요 증가·망분리 완화 논의 서술 삭제. 출처·확인일 추가.", "officialSources": ["https://www.msit.go.kr/bbs/view.do?sCode=user&mId=307&mPid=208&bbsSeqNo=94&nttSeqNo=3187189", "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000218804"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=734 AND md5(content)='4c5794a9b90df756a8413633457e9149' AND md5(content_evidence::text)='416387db73fabc2c132fc56ea1eb8b6d' AND md5(coalesce(array_to_string(tags,'|'),''))='08b6958ea2fb11f0952b55a51b9b46dc';
COMMIT;
