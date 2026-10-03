-- stale-refresh 2026-10-04 post #798 terraform-vs-opentofu-실무-선택-bsl-이후-뭘-쓰고-언제-옮길까
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$## "새 프로젝트인데 Terraform 써도 되나요?"라는 질문의 정체

2023년 HashiCorp가 Terraform을 MPL 2.0(오픈소스)에서 BSL(Business Source License) 1.1로 전환한 이후, 인프라 팀 회의에서 빠지지 않는 질문이 생겼습니다. "이거 라이선스 걸리는 거 아니야?" 그리고 2024년 IBM이 HashiCorp 인수를 발표하고 2025년 2월 27일 인수를 마치면서 이 불안은 "벤더 락인을 감수할 것인가"라는 더 큰 의사결정으로 번졌습니다.

동시에 Terraform의 커뮤니티 포크인 **OpenTofu**가 Linux Foundation에서 출발해 2025년 4월 CNCF 샌드박스 프로젝트로 합류하며, state encryption 같은 독자 기능까지 붙기 시작했습니다. 이제는 "무엇이 더 좋은가"가 아니라 **"우리 상황에서 무엇을 써야 하는가"**를 판정해야 하는 단계입니다.

이 글은 소개가 아니라 판정입니다. 각 섹션은 결정 근거로 끝나고, 마지막엔 상황별 의사결정표와 복붙 가능한 마이그레이션 명령까지 제공합니다. 참고로 아래 라이선스 해석은 실무 판단 참고용이며, **최종 결론은 반드시 사내 법무 검토를 거쳐야 합니다.**

## 라이선스 판정: 우리 회사가 BSL에 걸리는가

BSL의 핵심 조항은 흔히 오해되는 것처럼 "상업적 사용 금지"가 아닙니다. 정확히는 **"HashiCorp의 상용 제품과 경쟁하는 제품(competitive offering)을 만드는 데 사용 금지"**입니다. 즉 대부분의 사내 인프라 관리 목적 사용은 저촉되지 않습니다.

아래 Yes/No 플로우로 5분 안에 자가 판정할 수 있습니다.

```text
[시작]
  │
  ▼
① 우리는 Terraform으로 만든 결과물을
   외부에 재판매하거나 SaaS/관리형 서비스로 제공하는가?
  │
  ├── No ──▶ [BSL 저촉 가능성 낮음]
  │           (사내 인프라, 자사 서비스 배포 등 → 대부분 안전)
  │
  └── Yes
        │
        ▼
② 그 제품이 HashiCorp의 상용 제품
   (Terraform Cloud/Enterprise 등)과 경쟁하는가?
        │
        ├── No ──▶ [BSL 저촉 가능성 낮음 — 단, 법무 확인 권장]
        │
        └── Yes ──▶ [⚠ BSL 리스크 — 법무 검토 필수 / OpenTofu 검토]
```

**정리하면:**

| 사용 형태 | BSL 리스크 | 판정 |
|---|---|---|
| 사내 서버·클라우드 인프라 프로비저닝 | 낮음 | Terraform/OpenTofu 자유 선택 |
| 자사 SaaS의 백엔드 인프라 배포 | 낮음 | 대부분 안전 (판매 대상은 IaC가 아님) |
| Terraform을 래핑한 IaC 플랫폼을 유료 판매 | **높음** | OpenTofu 강력 권장 + 법무 |
| 고객 대신 인프라를 관리형으로 운영해주는 MSP/관리형 서비스 | 회색지대 | **법무 검토 필수** |

핵심 결정 근거: **당신이 인프라를 "쓰는" 쪽이면 걱정 없이 Terraform을 써도 됩니다. 인프라 자동화 자체를 "파는" 쪽이면 OpenTofu가 안전지대입니다.**

## 기능·호환성 정면 비교

OpenTofu는 Terraform 1.5.x 시점의 포크에서 출발했기 때문에 초기 호환성이 매우 높습니다. 다만 두 프로젝트가 독립적으로 발전하면서 격차가 생기는 지점이 있습니다.

| 항목 | Terraform (BSL) | OpenTofu (MPL 2.0) |
|---|---|---|
| 라이선스 | BSL 1.1 | MPL 2.0 (완전 오픈소스) |
| HCL 문법 | 원본 | 포크 기반 — 초기 100% 호환, 이후 소폭 분기 가능 |
| state 파일 포맷 | 호환 | **상호 호환** (동일 state 읽기/쓰기) |
| Provider/모듈 레지스트리 | HashiCorp Registry | OpenTofu Registry (미러 + 자체) |
| state encryption | 미지원(백엔드 의존) | **client-side encryption 내장** |
| 거버넌스 | HashiCorp(IBM) 단독 | CNCF 샌드박스 프로젝트(2025-04 합류) |
| TFC/TFE 연동 | 네이티브 | 제한적 (remote backend는 동작) |

> ⚠️ 버전별 기능 격차(예: Terraform 1.6/1.7/1.8의 신기능이 OpenTofu 대응 버전에 반영됐는지)는 빠르게 변합니다. **확정 서술 대신 각 프로젝트의 공식 릴리스 노트를 반드시 직접 확인**하세요. 특히 최신 stacks·특정 함수·provider-defined functions 지원 여부가 자주 바뀝니다.

결정 근거: **state 호환성이 유지되므로 마이그레이션 자체는 기술적으로 저부담**입니다. state encryption이 필요하면 OpenTofu가 유일한 내장 옵션입니다.

## 마이그레이션 실전: terraform → tofu 전환 절차

기술적으로는 놀랄 만큼 간단합니다. 아래는 복붙 가능한 전체 흐름입니다.

### 1) 바이너리 설치

```bash
# macOS (Homebrew)
brew install opentofu

# Linux (스크립트 설치)
curl -fsSL https://get.opentofu.org/install-opentofu.sh -o install.sh
chmod +x install.sh
./install.sh --install-method standalone
rm install.sh

# 설치 확인
tofu version
```

예상 정상 결과:

```text
OpenTofu v1.x.x
on darwin_arm64
```

### 2) 명령 매핑 — 그냥 terraform을 tofu로 바꾸면 됩니다

| Terraform | OpenTofu |
|---|---|
| `terraform init` | `tofu init` |
| `terraform plan` | `tofu plan` |
| `terraform apply` | `tofu apply` |
| `terraform state list` | `tofu state list` |

### 3) 전환 전 반드시 state와 lock 백업

```bash
# 로컬 state인 경우
cp terraform.tfstate terraform.tfstate.bak
cp .terraform.lock.hcl .terraform.lock.hcl.bak

# 원격 backend면 콘솔/버전관리로 state 스냅샷 확보
```

### 4) 초기화 및 plan으로 no-op 확인

```bash
tofu init -upgrade
tofu plan
```

**예상 정상 결과:** `No changes. Your infrastructure matches the configuration.`

이 no-op이 뜨면 state가 정상 해석된 것입니다. 만약 리소스 재생성(destroy/create)이 계획에 잡히면 **절대 apply하지 말고** provider 버전·lock 파일 차이를 먼저 조사하세요.

### 5) CI 파이프라인 교체 (GitHub Actions)

```yaml
# Before
- uses: hashicorp/setup-terraform@v3
  with:
    terraform_version: "1.5.7"

# After
- uses: opentofu/setup-opentofu@v1
  with:
    tofu_version: "1.8.0"
```

Atlantis를 쓴다면 `atlantis.yaml` 또는 서버 설정에서 실행 바이너리를 지정합니다:

```yaml
# atlantis.yaml (프로젝트 단위)
projects:
  - dir: .
    workflow: tofu
# server-side: workflows.tofu.plan.steps 에서 tofu 바이너리 호출
```

### 6) 롤백 절차

문제가 생기면 되돌리기도 간단합니다.

```bash
# 1. 백업한 state/lock 복원
cp terraform.tfstate.bak terraform.tfstate
cp .terraform.lock.hcl.bak .terraform.lock.hcl

# 2. 다시 terraform으로 초기화
terraform init -upgrade
terraform plan   # No changes 확인
```

state 포맷이 호환되므로 **양방향 전환이 가능**하다는 점이 심리적 안전판입니다.

## 실패 분기 체크리스트: 이관이 막히는 진짜 이유

명령은 쉽지만, 실제 이관을 막는 것은 아래 의존성입니다. 전환 전에 체크하세요.

- [ ] **provider가 OpenTofu Registry에 있는가?** 마이너/사내 provider가 미등록이면 소스 주소를 명시(`source = "registry.opentofu.org/..."`)하거나 미러링이 필요합니다.
- [ ] **TFC/TFE 종속 기능을 쓰는가?**
  - remote backend의 워크스페이스 관리 → 부분 호환, 재구성 필요할 수 있음
  - **Sentinel 정책** → OpenTofu 미지원 (OPA/Conftest로 대체 검토)
  - **Run Tasks / Drift Detection 등 TFC 고유 기능** → 그대로 이관 불가
- [ ] **래퍼/도구 체인 호환?**
  - Terragrunt: OpenTofu 지원 (`terraform_binary = "tofu"` 지정)
  - TFLint / tfsec / Checkov: 대부분 HCL 파싱 기반이라 호환되나 버전 확인 필요
- [ ] **모듈 소스가 특정 registry에 하드코딩됐는가?**

결정 근거: **TFC/TFE의 Sentinel·Run Tasks에 깊게 물려 있으면 마이그레이션 비용이 급증**합니다. 이 경우 OSS 이관보다 "TFC 유지 vs 셀프호스팅 전환"의 더 큰 결정이 됩니다.

## 상황별 의사결정표

| 상황 | 권장안 | 이유 |
|---|---|---|
| **신규 프로젝트** | OpenTofu 우선 검토 | 락인 회피, state encryption, 라이선스 무부담. 특별한 TFC 기능 필요 없으면 기본값으로 적합 |
| **기존 소규모 (state 몇 개, TFC 미사용)** | OpenTofu로 이관 권장 | 전환 비용 낮음, 명령만 교체하면 됨 |
| **TFC/TFE 의존 대기업** | 현행 유지 후 단계적 검토 | Sentinel·Run Tasks 대체 설계가 선행돼야 함. 성급한 이관 금지 |
| **IaC를 재판매/SaaS화하는 벤더** | OpenTofu (법무 검토 후) | BSL 저촉 리스크 회피의 핵심 대상 |

## 비용 비교: 오픈소스는 공짜, 진짜 비용은 관리 계층에서

두 CLI 도구 자체는 **둘 다 무료**입니다. 비용은 협업·정책·상태 관리를 담당하는 "관리 계층"에서 발생합니다.

| 옵션 | 형태 | 대략적 비용 감각 | 비고 |
|---|---|---|---|
| OpenTofu + Atlantis | 셀프호스팅 OSS | 인프라 운영비만 | 락인 없음, 직접 운영 부담 |
| Terraform Cloud | SaaS (유료 티어) | 리소스/시트 기반 과금 | 네이티브 기능·Sentinel |
| Spacelift | SaaS/셀프호스팅 | 워커·시트 기반 | OpenTofu 정식 지원 |
| Env0 | SaaS | 시트/사용량 기반 | 거버넌스·비용 추적 강점 |

> 구체적 단가는 벤더 정책에 따라 수시로 바뀌므로 **각 벤더 공식 가격 페이지 확인이 필요**합니다.

**국내 현황 한 문단:** 국내에서도 클라우드 MSP와 플랫폼 팀을 중심으로 OpenTofu 도입 사례가 늘고 있으며, 한글 자료와 커뮤니티 발표도 꾸준히 축적되는 추세입니다. 다만 상용 지원 계약이 필요한 대기업이라면 Terraform Cloud/Enterprise의 공식 지원 채널이나 Spacelift·Env0 같은 상용 벤더의 국내 파트너십 유무를 별도로 확인하는 편이 안전합니다.

## 결론: 한 줄 판정

- **인프라를 쓰는 쪽 + 신규 프로젝트** → OpenTofu를 기본값으로.
- **TFC 고유 기능에 깊게 물린 조직** → 대체 설계 전까지 현행 유지.
- **IaC를 파는 벤더** → OpenTofu + 법무 검토.

기술적 마이그레이션은 `terraform`을 `tofu`로 바꾸고 `tofu plan`에서 no-op을 확인하는 수준으로 가볍습니다. 진짜 의사결정은 라이선스와 TFC 종속성에 있습니다.

## 자주 묻는 질문 (FAQ)

**Q. 사내 인프라만 관리하는데 Terraform BSL에 걸리나요?**
A. 일반적으로 저촉되지 않습니다. BSL은 "HashiCorp 상용 제품과 경쟁하는 제품"에 사용하는 것을 제한하며, 자사 인프라 프로비저닝은 여기에 해당하지 않습니다. 다만 최종 판단은 사내 법무 검토가 필요합니다.

**Q. OpenTofu로 옮기면 기존 state를 다시 만들어야 하나요?**
A. 아니요. state 포맷이 호환되어 동일한 state 파일을 그대로 읽습니다. 백업 후 `tofu init`, `tofu plan`으로 no-op(No changes)이 나오는지만 확인하면 됩니다. 문제 시 terraform으로 롤백도 가능합니다.

**Q. Terraform Cloud의 Sentinel 정책을 쓰고 있는데 OpenTofu로 갈 수 있나요?**
A. Sentinel은 OpenTofu에서 지원되지 않습니다. OPA(Open Policy Agent)/Conftest 같은 오픈소스 정책 엔진으로 대체 설계를 먼저 마친 뒤 이관하는 것을 권장합니다.

## 출처 · 확인일 2026-10-04
- [IBM, HashiCorp 인수 완료 발표 (2025-02-27)](https://newsroom.ibm.com/2025-02-27-ibm-completes-acquisition-of-hashicorp,-creates-comprehensive,-end-to-end-hybrid-cloud-platform)
- [CNCF, OpenTofu 프로젝트 페이지](https://www.cncf.io/projects/opentofu/) — 2025-04-23 샌드박스 단계로 합류$sr$, content_evidence=jsonb_set($j${"en": {"title": "Terraform vs OpenTofu in Practice: What to Use After BSL, and When to Switch", "content": "## What “Can we still use Terraform on a new project?” actually means\n\nSince HashiCorp moved Terraform from MPL 2.0 (open source) to BSL (Business Source License) 1.1 in 2023, one question has become a fixture in infrastructure team meetings: “Does this trip the license?” And once IBM announced its acquisition of HashiCorp in 2024 and completed it on February 27, 2025, that anxiety grew into a larger decision: “Are we willing to accept vendor lock-in?”\n\nAt the same time, **OpenTofu**—the community fork of Terraform—started at the Linux Foundation, joined the CNCF as a Sandbox project in April 2025, and has started shipping its own features, such as state encryption. The question is no longer “which is better,” but **“which should we use in our situation.”**\n\nThis post is a decision, not an introduction. Every section ends with a decision rationale, and the end includes a situation-by-situation decision table plus copy-pasteable migration commands. The license interpretation below is for practical judgment only; **the final call must go through your in-house legal review.**\n\n## License judgment: does BSL actually apply to our company?\n\nThe core BSL clause is not, as often misunderstood, “no commercial use.” Precisely, it **prohibits use to create a competitive offering against HashiCorp’s commercial products**. Most in-house infrastructure management use does not trigger it.\n\nYou can self-assess in about five minutes with this Yes/No flow.\n\n```text\n[시작]\n  │\n  ▼\n① 우리는 Terraform으로 만든 결과물을\n   외부에 재판매하거나 SaaS/관리형 서비스로 제공하는가?\n  │\n  ├── No ──▶ [BSL 저촉 가능성 낮음]\n  │           (사내 인프라, 자사 서비스 배포 등 → 대부분 안전)\n  │\n  └── Yes\n        │\n        ▼\n② 그 제품이 HashiCorp의 상용 제품\n   (Terraform Cloud/Enterprise 등)과 경쟁하는가?\n        │\n        ├── No ──▶ [BSL 저촉 가능성 낮음 — 단, 법무 확인 권장]\n        │\n        └── Yes ──▶ [⚠ BSL 리스크 — 법무 검토 필수 / OpenTofu 검토]\n```\n\n**In short:**\n\n| Usage pattern | BSL risk | Verdict |\n|---|---|---|\n| Provisioning in-house servers and cloud infrastructure | Low | Free choice of Terraform or OpenTofu |\n| Deploying backend infrastructure for your own SaaS | Low | Mostly safe (what you sell is not IaC) |\n| Selling a paid IaC platform that wraps Terraform | **High** | Strongly recommend OpenTofu + legal |\n| MSP / managed service that operates infrastructure for customers | Gray area | **Legal review required** |\n\nCore decision rationale: **If you *use* infrastructure, you can keep using Terraform without much worry. If you *sell* infrastructure automation itself, OpenTofu is the safe zone.**\n\n## Head-to-head: features and compatibility\n\nOpenTofu started as a fork of Terraform 1.5.x, so early compatibility is very high. As the two projects evolve independently, though, gaps appear.\n\n| Item | Terraform (BSL) | OpenTofu (MPL 2.0) |\n|---|---|---|\n| License | BSL 1.1 | MPL 2.0 (fully open source) |\n| HCL syntax | Original | Fork-based — 100% compatible at first, modest divergence possible later |\n| State file format | Compatible | **Interoperable** (same state read/write) |\n| Provider/module registry | HashiCorp Registry | OpenTofu Registry (mirror + own) |\n| State encryption | Not supported (backend-dependent) | **Built-in client-side encryption** |\n| Governance | HashiCorp (IBM) alone | CNCF Sandbox project (joined 2025-04) |\n| TFC/TFE integration | Native | Limited (remote backend works) |\n\n> ⚠️ Feature gaps by version (e.g. whether Terraform 1.6/1.7/1.8 features landed in the matching OpenTofu release) change quickly. **Do not treat any snapshot as definitive—always check each project’s official release notes.** Support for stacks, certain functions, and provider-defined functions in particular shifts often.\n\nDecision rationale: **Because state remains compatible, the migration itself is technically low-burden.** If you need state encryption, OpenTofu is the only built-in option.\n\n## Migration in practice: terraform → tofu procedure\n\nTechnically it is surprisingly simple. Below is the full copy-pasteable flow.\n\n### 1) Install the binary\n\n```bash\n# macOS (Homebrew)\nbrew install opentofu\n\n# Linux (스크립트 설치)\ncurl -fsSL https://get.opentofu.org/install-opentofu.sh -o install.sh\nchmod +x install.sh\n./install.sh --install-method standalone\nrm install.sh\n\n# 설치 확인\ntofu version\n```\n\nExpected healthy output:\n\n```text\nOpenTofu v1.x.x\non darwin_arm64\n```\n\n### 2) Command mapping — just replace terraform with tofu\n\n| Terraform | OpenTofu |\n|---|---|\n| `terraform init` | `tofu init` |\n| `terraform plan` | `tofu plan` |\n| `terraform apply` | `tofu apply` |\n| `terraform state list` | `tofu state list` |\n\n### 3) Always back up state and lock before switching\n\n```bash\n# 로컬 state인 경우\ncp terraform.tfstate terraform.tfstate.bak\ncp .terraform.lock.hcl .terraform.lock.hcl.bak\n\n# 원격 backend면 콘솔/버전관리로 state 스냅샷 확보\n```\n\n### 4) Init and confirm a no-op plan\n\n```bash\ntofu init -upgrade\ntofu plan\n```\n\n**Expected healthy result:** `No changes. Your infrastructure matches the configuration.`\n\nIf you get that no-op, state was interpreted correctly. If the plan shows resource recreation (destroy/create), **do not apply**—investigate provider version and lock-file differences first.\n\n### 5) Swap the CI pipeline (GitHub Actions)\n\n```yaml\n# Before\n- uses: hashicorp/setup-terraform@v3\n  with:\n    terraform_version: \"1.5.7\"\n\n# After\n- uses: opentofu/setup-opentofu@v1\n  with:\n    tofu_version: \"1.8.0\"\n```\n\nIf you use Atlantis, set the execution binary in `atlantis.yaml` or server config:\n\n```yaml\n# atlantis.yaml (프로젝트 단위)\nprojects:\n  - dir: .\n    workflow: tofu\n# server-side: workflows.tofu.plan.steps 에서 tofu 바이너리 호출\n```\n\n### 6) Rollback procedure\n\nIf something goes wrong, reverting is equally simple.\n\n```bash\n# 1. 백업한 state/lock 복원\ncp terraform.tfstate.bak terraform.tfstate\ncp .terraform.lock.hcl.bak .terraform.lock.hcl\n\n# 2. 다시 terraform으로 초기화\nterraform init -upgrade\nterraform plan   # No changes 확인\n```\n\nBecause the state format is compatible, **two-way switching is possible**—that is the psychological safety net.\n\n## Failure-branch checklist: what actually blocks a migration\n\nThe commands are easy. What actually blocks a move is the dependencies below. Check these before you switch.\n\n- [ ] **Is the provider on the OpenTofu Registry?** If a minor or in-house provider is unregistered, you need an explicit source (`source = \"registry.opentofu.org/...\"`) or a mirror.\n- [ ] **Do you depend on TFC/TFE-specific features?**\n  - Workspace management via remote backend → partially compatible; reconfiguration may be needed\n  - **Sentinel policies** → not supported on OpenTofu (consider OPA/Conftest as a replacement)\n  - **TFC-only features such as Run Tasks / Drift Detection** → cannot be migrated as-is\n- [ ] **Are wrappers and the tool chain compatible?**\n  - Terragrunt: OpenTofu supported (`terraform_binary = \"tofu\"`)\n  - TFLint / tfsec / Checkov: mostly HCL-parse based so they work, but confirm versions\n- [ ] **Are module sources hardcoded to a specific registry?**\n\nDecision rationale: **If you are deeply tied to TFC/TFE Sentinel and Run Tasks, migration cost spikes.** In that case the real decision is larger than “move to OSS”: keep TFC vs. switch to self-hosting.\n\n## Decision table by situation\n\n| Situation | Recommendation | Why |\n|---|---|---|\n| **New project** | Prefer OpenTofu | Avoid lock-in, state encryption, no license burden. A good default unless you need specific TFC features |\n| **Existing small setup (a few states, no TFC)** | Recommend migrating to OpenTofu | Low switching cost; mostly a command swap |\n| **Large enterprise dependent on TFC/TFE** | Stay put, then review in stages | Replacement design for Sentinel and Run Tasks must come first. Do not rush the move |\n| **Vendor that resells / SaaS-ifies IaC** | OpenTofu (after legal review) | The core case for avoiding BSL risk |\n\n## Cost comparison: open source is free; the real cost is the management layer\n\nBoth CLIs themselves are **free**. Cost shows up in the “management layer” that handles collaboration, policy, and state.\n\n| Option | Form | Rough cost feel | Notes |\n|---|---|---|---|\n| OpenTofu + Atlantis | Self-hosted OSS | Infra ops cost only | No lock-in, you operate it |\n| Terraform Cloud | SaaS (paid tiers) | Resource/seat-based billing | Native features and Sentinel |\n| Spacelift | SaaS / self-hosted | Worker- and seat-based | Official OpenTofu support |\n| Env0 | SaaS | Seat/usage-based | Strong on governance and cost tracking |\n\n> Exact unit prices change with vendor policy, so **check each vendor’s official pricing page**.\n\n**Korea in one paragraph:** In Korea, OpenTofu adoption is growing among cloud MSPs and platform teams, and Korean-language materials and community talks keep accumulating. That said, large enterprises that need a commercial support contract should separately confirm Terraform Cloud/Enterprise’s official support channels, or whether vendors such as Spacelift and Env0 have local partnerships.\n\n## Conclusion: one-line verdicts\n\n- **You use infrastructure + new project** → OpenTofu as the default.\n- **Org deeply tied to TFC-specific features** → stay as-is until a replacement is designed.\n- **Vendor that sells IaC** → OpenTofu + legal review.\n\nThe technical migration is as light as swapping `terraform` for `tofu` and confirming a no-op on `tofu plan`. The real decision is license and TFC dependency.\n\n## FAQ\n\n**Q. We only manage in-house infrastructure. Does Terraform BSL apply?**\nA. Generally no. BSL restricts use to create a product that competes with HashiCorp’s commercial offerings, and provisioning your own infrastructure is not that. Final judgment still needs in-house legal review.\n\n**Q. If we move to OpenTofu, do we have to rebuild existing state?**\nA. No. The state format is compatible, so the same state file is read as-is. After a backup, run `tofu init` and `tofu plan` and confirm a no-op (`No changes`). You can also roll back to terraform if needed.\n\n**Q. We use Terraform Cloud Sentinel policies. Can we go to OpenTofu?**\nA. Sentinel is not supported on OpenTofu. Finish a replacement design with an open-source policy engine such as OPA (Open Policy Agent)/Conftest first, then migrate.\n\n## Sources · checked 2026-10-04\n- [IBM, completion of the HashiCorp acquisition (2025-02-27)](https://newsroom.ibm.com/2025-02-27-ibm-completes-acquisition-of-hashicorp,-creates-comprehensive,-end-to-end-hybrid-cloud-platform)\n- [CNCF, OpenTofu project page](https://www.cncf.io/projects/opentofu/) — accepted at the Sandbox level on 2025-04-23", "excerpt": "After HashiCorp’s BSL switch, this post helps you decide Terraform vs OpenTofu for new IaC and when to migrate existing code to tofu, using a self-assessment flowchart. It covers the license decision tree, migration and rollback commands, failure branches, and a cost comparison."}, "verifiedAt": "2026-10-04", "changeSummary": "\"2024년 IBM의 HashiCorp 인수 확정\"을 2024년 발표·2025-02-27 인수 완료로 정정하고, OpenTofu 거버넌스를 Linux Foundation에서 CNCF 샌드박스(2025-04-23 합류)로 갱신. 출처·확인일 추가.", "officialSources": ["https://newsroom.ibm.com/2025-02-27-ibm-completes-acquisition-of-hashicorp,-creates-comprehensive,-end-to-end-hybrid-cloud-platform", "https://www.cncf.io/projects/opentofu/"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=798 AND md5(content)='81b775b511b4e9b36bc8e65c1d702704' AND md5(content_evidence::text)='40183001a37ad21272172f9512097095' AND md5(coalesce(array_to_string(tags,'|'),''))='c4b898521b7221da8dae71c5f3cb5d59';
COMMIT;
