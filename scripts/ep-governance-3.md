## MLSecOps: AI 시스템을 DevSecOps처럼 운영하기

2편에서 모델 취약점 스캐닝과 공급망 보안을 다뤘습니다. MLSecOps의 완성은 이 모든 보안 제어를 CI/CD 파이프라인에 자동 통합하는 것입니다.

## AI 파이프라인 보안 자동화

```yaml
# .github/workflows/ml-security.yml
name: ML Security Gate

on:
  push:
    paths:
      - "models/**"
      - "training/**"
      - "inference/**"

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 모델 무결성 검증
        run: python scripts/verify_model_hashes.py

      - name: 학습 데이터 PII 스캔
        run: python scripts/scan_training_data.py --threshold 0

      - name: 의존성 취약점 검사
        run: |
          pip-audit --requirement requirements.txt
          safety check

      - name: 모델 편향성 평가
        run: python scripts/bias_eval.py --fail-threshold 0.15

      - name: 적대적 견고성 테스트
        run: python scripts/adversarial_test.py --attack pgd --eps 0.03

      - name: 보안 리포트 생성
        run: python scripts/generate_security_report.py
        if: always()
```

## 모델 편향성 자동 탐지

```python
import numpy as np
from itertools import combinations

class BiasDetector:
    """보호 속성 기준 예측 편향 자동 탐지"""

    PROTECTED_ATTRS = ["gender", "age_group", "nationality", "disability"]

    def evaluate(self, predictions: list, labels: list, metadata: list) -> dict:
        results = {}
        for attr in self.PROTECTED_ATTRS:
            groups = self._group_by(predictions, labels, metadata, attr)
            if len(groups) < 2:
                continue
            results[attr] = self._compute_metrics(groups)
        return results

    def _compute_metrics(self, groups: dict) -> dict:
        accuracies = {g: self._accuracy(p, l) for g, (p, l) in groups.items()}
        tprs = {g: self._tpr(p, l) for g, (p, l) in groups.items()}

        max_acc_gap = max(accuracies.values()) - min(accuracies.values())
        max_tpr_gap = max(tprs.values()) - min(tprs.values())

        return {
            "accuracy_by_group": accuracies,
            "tpr_by_group": tprs,
            "max_accuracy_gap": max_acc_gap,
            "max_tpr_gap": max_tpr_gap,
            "bias_detected": max_acc_gap > 0.1 or max_tpr_gap > 0.1,
        }
```

## 연합 학습 보안 (Federated Learning)

데이터를 이동시키지 않고 모델 파라미터만 공유하는 방식에서도 보안이 필요합니다.

```python
import numpy as np

class SecureAggregator:
    """차분 프라이버시 + 안전한 집계"""

    def __init__(self, epsilon: float = 1.0, delta: float = 1e-5):
        self.epsilon = epsilon  # 낮을수록 강한 프라이버시
        self.delta = delta

    def add_noise(self, gradient: np.ndarray, sensitivity: float) -> np.ndarray:
        """가우시안 메커니즘으로 그래디언트에 노이즈 추가"""
        sigma = sensitivity * np.sqrt(2 * np.log(1.25 / self.delta)) / self.epsilon
        noise = np.random.normal(0, sigma, gradient.shape)
        return gradient + noise

    def aggregate(self, client_gradients: list[np.ndarray]) -> np.ndarray:
        """클라이언트 그래디언트 안전 집계 (이상치 클리핑)"""
        clipped = []
        for g in client_gradients:
            norm = np.linalg.norm(g)
            clipped.append(g / max(1.0, norm))  # L2 클리핑
        avg = np.mean(clipped, axis=0)
        return self.add_noise(avg, sensitivity=1.0 / len(client_gradients))
```

## 모델 설명 가능성 (XAI) 컴플라이언스

EU AI Act는 고위험 AI 시스템에 설명 가능성을 의무화합니다.

```python
import shap

class ExplainabilityLayer:
    def __init__(self, model, background_data):
        self.explainer = shap.Explainer(model, background_data)

    def explain(self, input_data) -> dict:
        shap_values = self.explainer(input_data)
        feature_importance = dict(zip(
            input_data.columns,
            np.abs(shap_values.values).mean(axis=0)
        ))
        top_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        return {
            "prediction": float(self.model.predict(input_data)[0]),
            "confidence": float(self.model.predict_proba(input_data).max()),
            "top_factors": [
                {"feature": f, "importance": float(v), "direction": "increases" if shap_values[0][f] > 0 else "decreases"}
                for f, v in top_features
            ],
            "audit_record": self._log(input_data, shap_values),
        }
```

## AI 거버넌스 성숙도 체크리스트

```
보안 (Security)
  ☑ 프롬프트 인젝션 방어
  ☑ 출력 PII 필터링
  ☑ 모델 무결성 서명 검증

컴플라이언스 (Compliance)
  ☑ GDPR 데이터 최소화 적용
  ☑ AI Act 위험 분류 완료
  ☑ 설명 가능성 API 제공

운영 (Operations)
  ☑ CI/CD 보안 게이트 통합
  ☑ 실시간 편향 모니터링
  ☑ 인시던트 대응 플레이북
```

이 3편 시리즈로 AI 거버넌스 & MLSecOps 마스터 가이드(거버넌스 기초→보안 심화→운영 자동화)가 완성됩니다.
