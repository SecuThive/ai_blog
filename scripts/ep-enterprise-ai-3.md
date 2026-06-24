## AI 거버넌스 없는 AI는 시한폭탄이다

2편에서 보안 아키텍처와 데이터 분류를 다뤘습니다. 이제 조직 전체의 AI를 체계적으로 관리하는 거버넌스 프레임워크와 규제 준수 자동화를 완성합니다.

## 모델 라이프사이클 관리

```python
from datetime import datetime
from enum import Enum

class ModelStatus(Enum):
    EXPERIMENTAL = "experimental"
    STAGING = "staging"
    PRODUCTION = "production"
    DEPRECATED = "deprecated"
    RETIRED = "retired"

class ModelRegistry:
    """기업 내 모든 AI 모델 중앙 관리"""

    def register(self, model_id: str, version: str, metadata: dict) -> str:
        record = {
            "model_id": model_id,
            "version": version,
            "status": ModelStatus.EXPERIMENTAL.value,
            "registered_at": datetime.utcnow().isoformat(),
            "owner_team": metadata["owner"],
            "use_case": metadata["use_case"],
            "data_classification": metadata["data_class"],
            "approved_by": None,
            "retired_at": None,
        }
        return self.db.insert("model_registry", record)

    def promote(self, model_id: str, to_status: ModelStatus, approver: str):
        if to_status == ModelStatus.PRODUCTION:
            self._require_approval(model_id, approver)
        self.db.update("model_registry",
            {"model_id": model_id},
            {"status": to_status.value, "approved_by": approver}
        )

    def deprecate(self, model_id: str, successor_id: str, sunset_date: str):
        self.db.update("model_registry",
            {"model_id": model_id},
            {
                "status": ModelStatus.DEPRECATED.value,
                "successor_model": successor_id,
                "sunset_date": sunset_date,
            }
        )
```

## 규제 준수 자동화 파이프라인

```python
class ComplianceAutomator:
    """GDPR/AI Act 준수를 코드로 강제"""

    REQUIRED_CHECKS = [
        "data_minimization",
        "consent_verified",
        "audit_log_enabled",
        "pii_masked",
        "cross_border_approved",
    ]

    async def pre_flight(self, request: AIRequest) -> ComplianceResult:
        results = {}
        for check in self.REQUIRED_CHECKS:
            handler = getattr(self, f"check_{check}")
            results[check] = await handler(request)

        failed = [k for k, v in results.items() if not v]
        if failed:
            raise ComplianceError(f"준수 실패: {', '.join(failed)}")
        return ComplianceResult(passed=True, checks=results)

    async def check_data_minimization(self, req: AIRequest) -> bool:
        # 요청에 불필요한 필드가 없는지 검사
        allowed_fields = self.policy.get_allowed_fields(req.use_case)
        return all(f in allowed_fields for f in req.data_fields)

    async def check_audit_log_enabled(self, req: AIRequest) -> bool:
        return req.audit_session_id is not None
```

## AI 감사 로그 스키마

```sql
CREATE TABLE ai_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    session_id      UUID NOT NULL,
    user_id         VARCHAR(128),
    model_id        VARCHAR(128) NOT NULL,
    use_case        VARCHAR(256),
    data_class      VARCHAR(64),
    input_tokens    INTEGER,
    output_tokens   INTEGER,
    latency_ms      INTEGER,
    compliance_tags JSONB,
    pii_detected    BOOLEAN DEFAULT FALSE,
    blocked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2년 보존 정책 (GDPR 요구)
CREATE POLICY audit_retention ON ai_audit_log
    USING (created_at > NOW() - INTERVAL '2 years');
```

## AI 거버넌스 위원회 운영 체계

| 역할 | 책임 | 결정 권한 |
|------|------|----------|
| AI 리드 | 기술 아키텍처 | 모델 선택·버전 관리 |
| 법무/컴플라이언스 | 규제 해석 | 데이터 사용 승인 |
| 정보보안 | 위협 모델링 | 보안 정책 수립 |
| 데이터 오너 | 데이터 분류 | 접근 권한 부여 |
| 사업 부서 | 유스케이스 정의 | ROI 평가 |

## 비용 거버넌스: FinOps for AI

```python
class AIFinOps:
    PRICE_PER_1K = {
        "claude-haiku-4-5":  {"input": 0.00025, "output": 0.00125},
        "claude-sonnet-4-6": {"input": 0.003,   "output": 0.015},
        "claude-opus-4-7":   {"input": 0.015,   "output": 0.075},
    }

    def calculate_cost(self, model: str, in_tokens: int, out_tokens: int) -> float:
        p = self.PRICE_PER_1K[model]
        return (in_tokens * p["input"] + out_tokens * p["output"]) / 1000

    async def enforce_budget(self, team: str, model: str, est_tokens: int):
        monthly_spend = await self.get_monthly_spend(team)
        budget = await self.get_budget(team)
        est_cost = self.calculate_cost(model, est_tokens, est_tokens)

        if monthly_spend + est_cost > budget * 0.9:
            raise BudgetExceededError(
                f"{team} 팀 예산의 90% 초과. 현재: ${monthly_spend:.2f}, 한도: ${budget:.2f}"
            )
```

## 전사 AI 거버넌스 성숙도 모델

```
Level 1 — 임시방편
  ∘ 팀별 독립 도입, 표준 없음

Level 2 — 반복 가능
  ∘ 보안 가이드라인 존재, 수동 검토

Level 3 — 정의됨  ← 대부분 기업의 목표
  ∘ 중앙 레지스트리, 자동 컴플라이언스 체크

Level 4 — 관리됨
  ∘ 실시간 모니터링, KPI 대시보드

Level 5 — 최적화됨
  ∘ 자동 정책 갱신, AI로 AI 거버넌스
```

이 3편 시리즈로 Enterprise AI Architecture Blueprint(설계→보안→거버넌스)가 완성됩니다. 체크리스트를 순서대로 적용하면 PoC에서 프로덕션까지 안전하게 이행할 수 있습니다.
