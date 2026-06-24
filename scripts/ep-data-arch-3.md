## AI 데이터 파이프라인이 무너지는 순간

2편에서 피처 스토어와 실시간 파이프라인 설계를 다뤘습니다. 파이프라인이 가동 중일 때 조용히 시스템을 망가뜨리는 것은 데이터 품질 저하입니다. 모니터링과 거버넌스가 완성의 열쇠입니다.

## 데이터 품질 자동 검증

```python
from dataclasses import dataclass
from typing import Callable

@dataclass
class QualityRule:
    name: str
    check: Callable
    severity: str  # "error" | "warning"
    description: str

class DataQualityFramework:
    """AI 파이프라인 입구의 품질 게이트"""

    def __init__(self):
        self.rules: list[QualityRule] = []

    def add_rule(self, rule: QualityRule):
        self.rules.append(rule)

    def validate(self, df) -> dict:
        results = {"passed": [], "failed_errors": [], "failed_warnings": []}

        for rule in self.rules:
            try:
                passed = rule.check(df)
                if passed:
                    results["passed"].append(rule.name)
                elif rule.severity == "error":
                    results["failed_errors"].append({
                        "rule": rule.name,
                        "description": rule.description,
                    })
                else:
                    results["failed_warnings"].append(rule.name)
            except Exception as e:
                results["failed_errors"].append({"rule": rule.name, "error": str(e)})

        results["pipeline_blocked"] = len(results["failed_errors"]) > 0
        return results

# 실제 규칙 예시
qf = DataQualityFramework()
qf.add_rule(QualityRule(
    name="null_check_embedding",
    check=lambda df: df["embedding"].notna().all(),
    severity="error",
    description="임베딩 컬럼 NULL 값 불허",
))
qf.add_rule(QualityRule(
    name="freshness_check",
    check=lambda df: (pd.Timestamp.now() - df["updated_at"].max()).hours < 24,
    severity="warning",
    description="24시간 이내 갱신 권장",
))
```

## 데이터 리니지 추적

어떤 모델이 어떤 데이터로 학습됐는지 추적하는 것은 규제 준수와 디버깅의 기반입니다.

```python
class LineageTracker:
    def record_dataset_creation(self, dataset_id: str, sources: list[str], transform: str):
        self.db.insert("lineage_nodes", {
            "node_id": dataset_id,
            "node_type": "dataset",
            "sources": sources,
            "transform_description": transform,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": get_current_user(),
        })

    def record_model_training(self, model_id: str, dataset_ids: list[str], params: dict):
        self.db.insert("lineage_nodes", {
            "node_id": model_id,
            "node_type": "model",
            "sources": dataset_ids,
            "training_params": params,
            "created_at": datetime.utcnow().isoformat(),
        })

    def get_upstream(self, node_id: str, depth: int = 5) -> dict:
        """특정 모델/데이터셋의 upstream 전체 조회"""
        return self.db.recursive_query(
            start=node_id,
            relation="sources",
            max_depth=depth,
        )
```

## 스트리밍 피처 모니터링

실시간 파이프라인에서 피처 분포가 변하면 모델 성능이 즉각 하락합니다.

```python
import numpy as np
from scipy import stats

class StreamingFeatureMonitor:
    def __init__(self, baseline_stats: dict, window_size: int = 1000):
        self.baseline = baseline_stats
        self.window = []
        self.window_size = window_size
        self.alerts = []

    def ingest(self, features: dict):
        self.window.append(features)
        if len(self.window) >= self.window_size:
            self._check_drift()
            self.window = self.window[self.window_size // 2:]  # 슬라이딩 윈도우

    def _check_drift(self):
        for feat_name, baseline in self.baseline.items():
            current_vals = [w[feat_name] for w in self.window if feat_name in w]
            if not current_vals:
                continue

            # Kolmogorov-Smirnov 검정
            ks_stat, p_value = stats.ks_2samp(baseline["samples"], current_vals)

            if p_value < 0.05:
                self.alerts.append({
                    "feature": feat_name,
                    "ks_statistic": ks_stat,
                    "p_value": p_value,
                    "baseline_mean": baseline["mean"],
                    "current_mean": np.mean(current_vals),
                    "severity": "critical" if ks_stat > 0.3 else "warning",
                })
```

## 데이터 메시 아키텍처: 도메인별 오너십

```
중앙 집중형 (전통적)          데이터 메시 (권장)
─────────────────────         ─────────────────────
  데이터 팀 → 단일 허브         마케팅팀 → 마케팅 데이터 제품
  (병목, 느린 반응)              검색팀  → 검색 데이터 제품
                                 주문팀  → 주문 데이터 제품
                                      ↓
                               글로벌 거버넌스 레이어
                               (표준 스키마 + 품질 SLA)
```

```python
class DataProduct:
    """데이터 메시의 기본 단위"""
    def __init__(self, domain: str, owner_team: str):
        self.domain = domain
        self.owner = owner_team
        self.quality_sla = {"freshness_hours": 1, "completeness": 0.99}

    def publish(self, data, schema_version: str):
        self.validator.check(data, schema_version)
        self.catalog.register(
            product_id=f"{self.domain}/v{schema_version}",
            owner=self.owner,
            quality_metrics=self.measure_quality(data),
        )
        self.storage.write(data)
```

## AI 데이터 아키텍처 체크리스트

| 레이어 | 필수 구성 요소 | 상태 |
|--------|--------------|------|
| 수집 | 변경 데이터 캡처(CDC), 스키마 레지스트리 | |
| 저장 | 레이크하우스 (Delta/Iceberg), 피처 스토어 | |
| 품질 | 자동 검증 게이트, 이상 탐지 | |
| 거버넌스 | 리니지 추적, 데이터 카탈로그 | |
| 서빙 | 온라인/오프라인 피처 일관성, 캐싱 | |

이 3편 시리즈로 AI 데이터 아키텍처 마스터 가이드(인프라 기초→피처 파이프라인→품질·거버넌스)가 완성됩니다.
