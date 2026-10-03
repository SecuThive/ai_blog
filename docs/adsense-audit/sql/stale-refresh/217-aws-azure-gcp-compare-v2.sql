-- stale-refresh 2026-10-04 post #217 aws-vs-azure-vs-gcp-2025-워크로드별-클라우드-선택-완전-비교
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$## 클라우드 시장 현황 (2026년 2분기)

Synergy Research Group 집계(2026-07-30 발표)로 2026년 2분기 전 세계 클라우드 인프라 서비스 시장 점유율은 AWS 28%, Microsoft 20%, Google 15%입니다. 1년 전보다 AWS는 2%p 줄고 Google은 2%p 늘었으며 Microsoft는 같았습니다. 점유율은 조사 기관의 추정치이고 분기마다 바뀌므로 선택 기준이 아니라 생태계 규모를 가늠하는 참고값으로 보세요. 세 클라우드 모두 성숙했지만 강점이 다릅니다.

## 핵심 서비스 비교

| 서비스 | AWS | Azure | GCP |
|--------|-----|-------|-----|
| 컨테이너 | EKS | AKS | GKE |
| 서버리스 | Lambda | Functions | Cloud Run functions |
| 오브젝트 스토리지 | S3 | Blob Storage | Cloud Storage |
| 데이터 웨어하우스 | Redshift | Synapse | BigQuery |
| AI/ML | SageMaker | Azure ML | Vertex AI |

## AWS가 강한 영역

- **글로벌 인프라**: 39개 리전, 124개 가용영역(2026-10-04 공식 페이지 기준)
- **서비스 다양성**: 200개 이상의 서비스
- **스타트업 생태계**: AWS Activate, 풍부한 커뮤니티

**적합**: 스타트업, 글로벌 서비스, 서버리스, 마이크로서비스

## Azure가 강한 영역

- **Microsoft 생태계**: Active Directory, Office 365, Teams 네이티브 연동
- **하이브리드 클라우드**: Azure Arc로 온프레미스 통합 관리
- **엔터프라이즈 컴플라이언스**: GDPR, K-ISMS 인증 완비

**적합**: Windows 기반 레거시, Microsoft 365 연동, 금융·공공 엔터프라이즈

## GCP가 강한 영역

**BigQuery**: 페타바이트 규모 쿼리를 초 단위로 처리. 서버리스 과금으로 비용 효율적.

```sql
-- 10억 행 분석도 수초 완료
SELECT
  DATE(event_time) as date,
  event_name,
  COUNT(*) as event_count
FROM `project.analytics.events`
WHERE DATE(event_time) BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY 1, 2
```

- **Kubernetes**: K8s 개발자(Google)가 만든 GKE. Autopilot 모드로 노드 관리 자동화.
- **AI/ML**: Google DeepMind, Vertex AI, TPU 접근.

**적합**: 빅데이터 분석, ML/AI, Kubernetes 헤비 유저

## 비용 비교

세 클라우드의 단가는 리전, 인스턴스 세대, 약정 방식에 따라 자주 바뀌므로 이 글에는 고정 금액을 적지 않습니다. 같은 사양(예: 서울 리전 4 vCPU/16GB)을 아래 '검증' 절의 공식 가격 API나 계산기로 직접 조회해 비교하세요. 기업 할인 계약이 있으면 공시 단가와 실제 청구액이 다릅니다.

클라우드는 도구입니다. 트렌드가 아닌 비즈니스 요구사항에 맞춰 선택하세요.


## 멀티클라우드냐, 단일 클라우드냐

"세 개 다 쓰면 최고 아닌가?"라는 생각은 위험합니다. 멀티클라우드는 벤더 종속(lock-in)을 줄이고 가용성을 높이지만, **운영 복잡도·인력 역량·네트워크 비용**이 곱으로 늘어납니다.

- **단일 클라우드 권장**: 팀 규모가 작고 빠른 출시가 우선일 때. 관리형 서비스를 깊게 활용해 운영 부담을 줄이는 게 이득.
- **멀티클라우드 권장**: 규제상 특정 워크로드 분리가 필요하거나, 단일 벤더 장애가 사업에 치명적일 때. 단, 공통 추상화(Kubernetes, Terraform)로 이식성을 확보해야 함.

## 한국 리전·규제 체크포인트

글로벌 점유율만 보고 정하면 국내 요건에서 발목 잡힙니다.

| 항목 | 확인 포인트 |
|------|-------------|
| 리전 | AWS 서울, Azure 한국중부, GCP 서울 — 지연·데이터 주권 |
| 공공 | CSAP(클라우드 보안인증) 보유 서비스인지 |
| 금융 | 전자금융감독규정·망분리 요건 충족 여부 |
| 컴플라이언스 | K-ISMS-P, 개인정보 국외이전 동의 |

## 비용 함정 — 진짜 비싼 건 따로 있다

컴퓨팅 단가보다 **이그레스(외부 전송) 요금**과 **관리형 서비스 프리미엄**이 청구서를 키웁니다. 데이터 전송이 많은 서비스라면 같은 클라우드 안에서 처리를 끝내도록 설계하고, 약정 할인(Savings Plans/CUD)은 사용 패턴이 안정된 뒤에 적용하세요.


## 워크로드별 최종 선택 가이드

위 비교를 한 장으로 압축하면 다음과 같습니다. 자신의 첫 번째 제약 조건이 있는 행을 따르세요.

| 첫 번째 제약/요구 | 권장 | 비고 |
|---|---|---|
| 사내 Microsoft 365·AD 중심 조직 | Azure | 라이선스 혜택(AHB)·통합 인증이 총비용을 좌우 |
| 데이터 분석·ML 파이프라인이 핵심 | GCP | BigQuery 중심 설계 시 운영 부담이 가장 작음 |
| 서비스 종류가 많고 채용 풀 중요 | AWS | 레퍼런스·인력 시장이 가장 넓음 |
| 금융·공공 등 국내 규제 산업 | 3사 모두 국내 리전 보유 — 규제 인증(CSAP 등) 목록을 먼저 대조 | 서비스별 인증 범위가 다름 |
| 이그레스(전송) 비용 민감 | 아키텍처로 해결 — CDN·리전 내 처리 우선 | 어느 클라우드든 이그레스가 함정 |

**전환 비용 주의**: 관리형 DB·서버리스·전용 ML 서비스는 이전이 어렵습니다. "3년 뒤 옮길 수 있는가"를 기준으로 관리형 서비스 채택 범위를 정하는 것이 멀티클라우드 논쟁보다 실익이 큽니다.

## 선택한 뒤 비용 추정이 빗나가는 이유와 검증 방법

클라우드를 고른 뒤 첫 청구서가 예상과 크게 다른 경우가 흔합니다. 비교표의 단가가 틀려서라기보다 **추정에 넣지 않은 항목** 때문인 경우가 대부분입니다.

**원인**
- 컴퓨팅만 계산하고 데이터 전송(인터넷 이그레스, AZ 간 트래픽), NAT 게이트웨이 처리 요금, 로그 수집·보관 비용을 누락
- 리전별 단가 차이를 무시하고 미국 리전 가격으로 추정
- 관리형 DB의 스토리지·백업·IOPS를 인스턴스 요금과 별도로 계산하지 않음

**검증: 공식 가격 소스로 직접 조회**

```bash
# AWS: 서울 리전 m7i.large 온디맨드 가격 조회 (Pricing API는 us-east-1 엔드포인트)
aws pricing get-products --region us-east-1 --service-code AmazonEC2 \
  --filters Type=TERM_MATCH,Field=instanceType,Value=m7i.large \
            Type=TERM_MATCH,Field=location,Value="Asia Pacific (Seoul)" \
            Type=TERM_MATCH,Field=operatingSystem,Value=Linux \
            Type=TERM_MATCH,Field=tenancy,Value=Shared \
            Type=TERM_MATCH,Field=preInstalledSw,Value=NA \
            Type=TERM_MATCH,Field=capacitystatus,Value=Used --max-results 1
# Azure: 인증 없이 쓰는 Retail Prices API
curl -s "https://prices.azure.com/api/retail/prices?\$filter=armRegionName eq 'koreacentral' and armSkuName eq 'Standard_D2s_v5'"
```

GCP는 공식 Pricing Calculator 또는 Cloud Billing Catalog API로 같은 항목을 조회합니다.

**해결**
- 파일럿 워크로드를 2~4주 실제로 돌리고, 청구 데이터(AWS Cost Explorer, Azure Cost Management, GCP Billing export)를 서비스별로 나눠 추정치와 비교합니다.
- 차이가 큰 항목(대개 전송·로그)은 아키텍처를 조정합니다. 예: 같은 AZ 배치, VPC 엔드포인트 사용, 로그 보존 기간 단축.

**재발 방지**
- 비용 태그(서비스, 환경, 담당 팀)를 배포 시 강제하고, 월 예산 경보를 설정합니다.

## 자주 묻는 질문 (FAQ)

**Q. 결국 어디가 제일 좋나요?**
"제일 좋은 클라우드"는 없습니다. Microsoft 생태계·엔터프라이즈면 Azure, 데이터/ML 중심이면 GCP, 서비스 다양성·생태계면 AWS가 유리한 경향일 뿐, 결정 요인은 팀 역량과 비즈니스 요건입니다.

**Q. 락인이 무서운데 어떻게 줄이나요?**
컴퓨팅은 컨테이너(K8s), 인프라는 Terraform, 데이터는 표준 포맷(Parquet 등)으로 두면 이전 비용이 크게 줄어듭니다. 다만 관리형 서비스의 편의를 포기하는 트레이드오프가 있습니다.


## 에디터 노트 — 현장에서는

'어디가 제일 좋냐'는 대개 잘못된 질문입니다. 실무에서 클라우드 선택을 좌우한 건 점유율이나 단가표가 아니라 **이미 가진 팀 역량**이었습니다. .NET·AD 기반 팀은 Azure에 빨리 적응했고, 데이터 분석 중심 팀은 BigQuery 하나 때문에 GCP를 택했습니다. 벤치마크 표를 비교하기 전에 '우리 팀이 내일부터 디버깅할 수 있는 곳이 어디인가'를 먼저 답하세요.

## 출처 · 확인일 2026-10-04
- [Synergy Research Group, Q2 Cloud Market Passes $143 Billion (2026-07-30)](https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years) — 2026년 2분기 점유율(AWS 28%, Microsoft 20%, Google 15%)
- [Synergy Research Group, Q2 Cloud Market Nears $100 Billion](https://www.srgresearch.com/articles/q2-cloud-market-nears-100-billion-milestone-and-its-still-growing-by-25-year-over-year) — 2025년 2분기 점유율(AWS 30%, Microsoft 20%, Google 13%), 전년 대비 증감의 비교 기준
- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/) — 39개 리전, 124개 가용영역
- [Google Cloud, Cloud Run functions 개요](https://cloud.google.com/functions/docs/concepts/overview) — Cloud Functions의 현재 이름
- [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)

점유율은 시장 조사 기관의 추정치이고, 리전 수와 서비스 이름은 바뀔 수 있으니 결정 전에 위 페이지를 다시 확인하세요.$sr$, content_evidence=jsonb_set($j${"en": {"title": "AWS vs Azure vs GCP: Choosing a Cloud by Workload", "content": "## Cloud Market Landscape (Q2 2026)\n\nAccording to Synergy Research Group (published 2026-07-30), global cloud infrastructure services market share in Q2 2026 was AWS 28%, Microsoft 20%, and Google 15%. Year over year, AWS lost 2 points, Google gained 2 points, and Microsoft was flat. These are analyst estimates that change every quarter, so treat them as a rough gauge of ecosystem size, not a selection criterion. All three clouds are mature, but their strengths differ.\n\n## Core Service Comparison\n\n| Service | AWS | Azure | GCP |\n|--------|-----|-------|-----|\n| Containers | EKS | AKS | GKE |\n| Serverless | Lambda | Functions | Cloud Run functions |\n| Object storage | S3 | Blob Storage | Cloud Storage |\n| Data warehouse | Redshift | Synapse | BigQuery |\n| AI/ML | SageMaker | Azure ML | Vertex AI |\n\n## Where AWS Excels\n\n- **Global infrastructure**: 39 Regions, 124 Availability Zones (official page, checked 2026-10-04)\n- **Service breadth**: 200+ services\n- **Startup ecosystem**: AWS Activate, a rich community\n\n**Best for**: startups, global services, serverless, microservices\n\n## Where Azure Excels\n\n- **Microsoft ecosystem**: Native integration with Active Directory, Office 365, and Teams\n- **Hybrid cloud**: Unified on-premises management with Azure Arc\n- **Enterprise compliance**: GDPR and K-ISMS certifications in place\n\n**Best for**: Windows-based legacy systems, Microsoft 365 integration, finance and public-sector enterprises\n\n## Where GCP Excels\n\n**BigQuery**: Processes petabyte-scale queries in seconds. Cost-efficient with serverless billing.\n\n```sql\n-- 10억 행 분석도 수초 완료\nSELECT\n  DATE(event_time) as date,\n  event_name,\n  COUNT(*) as event_count\nFROM `project.analytics.events`\nWHERE DATE(event_time) BETWEEN '2025-01-01' AND '2025-01-31'\nGROUP BY 1, 2\n```\n\n- **Kubernetes**: GKE, built by the creators of K8s (Google). Autopilot mode automates node management.\n- **AI/ML**: Access to Google DeepMind, Vertex AI, and TPUs.\n\n**Best for**: big data analytics, ML/AI, heavy Kubernetes users\n\n## Cost Comparison\n\nUnit prices on all three clouds change often by Region, instance generation, and commitment model, so this article does not quote fixed amounts. Look up the same spec (for example, 4 vCPU/16 GB in a Seoul Region) with the official pricing APIs or calculators in the verification section below. Enterprise discount agreements also make actual bills differ from list prices.\n\nThe cloud is a tool. Choose based on business requirements, not trends.\n\n## Multicloud or Single Cloud?\n\nThinking “wouldn’t using all three be best?” is risky. Multicloud reduces vendor lock-in and can improve availability, but **operational complexity, staffing skills, and network costs** multiply.\n\n- **Single cloud recommended**: When the team is small and time-to-market comes first. Deep use of managed services reduces operational burden.\n- **Multicloud recommended**: When regulations require isolating certain workloads, or a single-vendor outage would be business-critical. You still need portability via common abstractions (Kubernetes, Terraform).\n\n## Korea Region and Regulatory Checkpoints\n\nPicking based on global market share alone will trip you up on domestic requirements.\n\n| Item | Checkpoint |\n|------|-------------|\n| Region | AWS Seoul, Azure Korea Central, GCP Seoul — latency and data sovereignty |\n| Public sector | Whether the service holds CSAP (Cloud Security Assurance Program) certification |\n| Finance | Compliance with Electronic Financial Supervisory Regulations and network-separation requirements |\n| Compliance | K-ISMS-P, consent for cross-border personal data transfer |\n\n## Cost Traps — The Real Expenses Are Elsewhere\n\nMore than compute unit prices, **egress (outbound transfer) fees** and **managed-service premiums** inflate the bill. If your service moves a lot of data, design so processing stays inside the same cloud, and apply commitment discounts (Savings Plans/CUD) only after usage patterns stabilize.\n\n## Final Selection Guide by Workload\n\nCompressed into one page, the comparison looks like this. Follow the row that matches your first constraint.\n\n| First constraint / need | Recommendation | Notes |\n|---|---|---|\n| Microsoft 365 / AD-centric organization | Azure | License benefits (AHB) and unified identity dominate TCO |\n| Data analytics / ML pipeline is core | GCP | BigQuery-centric design has the lowest ops burden |\n| Many service types and hiring pool matter | AWS | Broadest references and talent market |\n| Finance, public sector, and other regulated Korean industries | All three have Korea regions — first compare regulatory certifications (CSAP, etc.) | Certification scope differs by service |\n| Sensitive to egress (transfer) cost | Solve in architecture — prefer CDN and in-region processing | Egress is a trap on every cloud |\n\n**Watch switching costs**: Managed DBs, serverless, and dedicated ML services are hard to migrate. Deciding the scope of managed services based on “can we move in three years?” is more useful than the multicloud debate.\n\n## Why Cost Estimates Miss After You Choose, and How to Verify\n\nFirst bills often differ a lot from expectations. It is usually not wrong unit prices but **items left out of the estimate**.\n\n**Causes**\n- Only compute was counted; data transfer (internet egress, cross-AZ traffic), NAT gateway processing, and log ingestion/retention were omitted\n- Estimates used US region prices and ignored regional differences\n- Managed DB storage, backups, and IOPS weren't counted separately from instance cost\n\n**Verification: query official price sources**\n\n```bash\n# AWS: on-demand price for m7i.large in Seoul (Pricing API uses the us-east-1 endpoint)\naws pricing get-products --region us-east-1 --service-code AmazonEC2 \\\n  --filters Type=TERM_MATCH,Field=instanceType,Value=m7i.large \\\n            Type=TERM_MATCH,Field=location,Value=\"Asia Pacific (Seoul)\" \\\n            Type=TERM_MATCH,Field=operatingSystem,Value=Linux \\\n            Type=TERM_MATCH,Field=tenancy,Value=Shared \\\n            Type=TERM_MATCH,Field=preInstalledSw,Value=NA \\\n            Type=TERM_MATCH,Field=capacitystatus,Value=Used --max-results 1\n# Azure: Retail Prices API, no authentication\ncurl -s \"https://prices.azure.com/api/retail/prices?\\$filter=armRegionName eq 'koreacentral' and armSkuName eq 'Standard_D2s_v5'\"\n```\n\nFor GCP, check the same items in the official Pricing Calculator or the Cloud Billing Catalog API.\n\n**Fix**\n- Run a pilot workload for two to four weeks and compare billing data (AWS Cost Explorer, Azure Cost Management, GCP billing export) per service against the estimate.\n- Adjust architecture for the biggest gaps (usually transfer and logs): same-AZ placement, VPC endpoints, shorter log retention.\n\n**Prevention**\n- Enforce cost tags (service, environment, owning team) at deploy time and set monthly budget alerts.\n\n## Frequently Asked Questions (FAQ)\n\n**Q. So which one is the best?**\nThere is no “best cloud.” Azure tends to win for Microsoft ecosystems and enterprises, GCP for data/ML-centric work, and AWS for service breadth and ecosystem—but the deciding factors are team capability and business requirements.\n\n**Q. Lock-in scares me. How do I reduce it?**\nKeep compute in containers (K8s), infrastructure in Terraform, and data in standard formats (Parquet, etc.) and migration costs drop significantly. The trade-off is giving up some convenience of managed services.\n\n## Editor's Note — From the Field\n\n“Which is best?” is usually the wrong question. In practice, cloud choice was driven not by market share or price sheets but by **the skills the team already had**. .NET/AD-based teams adapted quickly to Azure; analytics-centric teams picked GCP because of BigQuery alone. Before comparing benchmark tables, answer: “Where can our team start debugging tomorrow?”\n\n## Sources · checked 2026-10-04\n- [Synergy Research Group, Q2 Cloud Market Passes $143 Billion (2026-07-30)](https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years) — Q2 2026 market share (AWS 28%, Microsoft 20%, Google 15%)\n- [Synergy Research Group, Q2 Cloud Market Nears $100 Billion](https://www.srgresearch.com/articles/q2-cloud-market-nears-100-billion-milestone-and-its-still-growing-by-25-year-over-year) — Q2 2025 market share (AWS 30%, Microsoft 20%, Google 13%), the baseline for the year-over-year change\n- [AWS Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/) — 39 Regions, 124 Availability Zones\n- [Google Cloud, Cloud Run functions overview](https://cloud.google.com/functions/docs/concepts/overview) — current name of Cloud Functions\n- [Google Cloud Architecture Framework](https://cloud.google.com/architecture/framework)\n\nMarket share figures are analyst estimates, and Region counts and service names change, so re-check these pages before deciding.", "excerpt": "In Q2 2026, AWS, Microsoft, and Google held 28%, 20%, and 15% of the global cloud infrastructure market (Synergy Research)—all mature, but with different strengths. This practitioner guide compares core services, costs, Korea region and regulatory checkpoints, and workload-based recommendations so you choose on business needs, not hype."}, "verifiedAt": "2026-10-04", "changeSummary": "2025년 시장 점유율을 Synergy Research 2026년 2분기 수치로, AWS 리전·가용영역 수를 공식 페이지 값으로 갱신. Cloud Functions → Cloud Run functions. 출처 없는 비용 비교표 삭제. 출처 블록에 수치별 원문 링크(2026년·2025년 2분기 Synergy 발표, AWS 페이지) 명시.", "officialSources": ["https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years", "https://www.srgresearch.com/articles/q2-cloud-market-nears-100-billion-milestone-and-its-still-growing-by-25-year-over-year", "https://aws.amazon.com/about-aws/global-infrastructure/", "https://cloud.google.com/functions/docs/concepts/overview"], "contentUpdatedAt": "2026-10-03T19:45:50Z"}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=217 AND md5(content)='6c3b536c53f6d77d5c7181dd08be5261' AND md5(content_evidence::text)='30bfb1746186897b6c3dd46fe8d31cd7' AND md5(coalesce(array_to_string(tags,'|'),''))='a2c394acee6378343f50ad5aefc9444a';
COMMIT;
