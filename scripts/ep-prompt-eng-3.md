## 프롬프트는 코드다

많은 팀이 프롬프트를 하드코딩합니다. 누가 언제 왜 바꿨는지 추적이 안 되고, 성능이 나빠져도 원인을 찾기 어렵습니다.

## Git 기반 프롬프트 레지스트리

```
prompts/
├── customer_service/
│   ├── refund_handler.v1.yaml
│   ├── refund_handler.v2.yaml  ← 현재 프로덕션
│   └── refund_handler.v3.yaml  ← 실험 중
└── content_generation/
    └── blog_writer.v4.yaml
```

```yaml
# refund_handler.v2.yaml
version: "2.0.1"
model: "claude-sonnet-4-6"
temperature: 0.1
system: |
  당신은 {{company_name}}의 CS 전문가입니다.
  환불 정책: {{refund_policy}}
metadata:
  author: "team-cx"
  eval_score: 0.87
  changelog: "공감 표현 강화, 거절 문구 부드럽게"
```

```python
class PromptRegistry:
    def __init__(self, dir: str = "prompts"):
        self.dir = Path(dir)

    def get(self, name: str, version: str = "latest") -> dict:
        if version == "latest":
            files = sorted(self.dir.glob(f"**/{name}.v*.yaml"))
            return yaml.safe_load(files[-1].read_text())
        return yaml.safe_load((self.dir / f"{name}.{version}.yaml").read_text())
```

## A/B 테스트: 트래픽 분할

```python
import hashlib

class PromptABTest:
    def __init__(self, control: str, experiment: str, split: float = 0.1):
        self.control = control
        self.experiment = experiment
        self.split = split

    def get_version(self, user_id: str) -> str:
        # 동일 user_id는 항상 같은 그룹 (일관된 UX)
        h = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        return self.experiment if (h % 100) < (self.split * 100) else self.control
```

## LLM-as-Judge 자동 평가

```python
JUDGE = """
고객 문의: {msg}
에이전트 응답: {resp}

1~5점 채점 후 JSON만 반환:
- empathy: 고객 감정 공감도
- accuracy: 정보 정확도
- resolution: 문제 해결도
- overall: 종합

{"empathy": N, "accuracy": N, "resolution": N, "overall": N}
"""

async def llm_judge(msg: str, resp: str) -> dict:
    result = await llm.generate(JUDGE.format(msg=msg, resp=resp), temperature=0)
    return json.loads(result)
```

## 통계적 유의성 검정

```python
from scipy import stats

def analyze_ab(ctrl_scores: list, exp_scores: list) -> dict:
    _, p = stats.ttest_ind(ctrl_scores, exp_scores)
    ctrl_m = sum(ctrl_scores) / len(ctrl_scores)
    exp_m = sum(exp_scores) / len(exp_scores)
    return {
        "control_mean": ctrl_m,
        "experiment_mean": exp_m,
        "improvement": f"{(exp_m - ctrl_m) / ctrl_m * 100:+.1f}%",
        "p_value": p,
        "significant": p < 0.05,
        "winner": "experiment" if exp_m > ctrl_m and p < 0.05 else "control"
    }
```

## CI/CD 통합

```yaml
# .github/workflows/prompt-eval.yml
on:
  push:
    paths: ["prompts/**/*.yaml"]
jobs:
  eval:
    steps:
      - run: python scripts/validate_prompts.py
      - run: python scripts/run_evals.py --dataset golden --threshold 0.82
      - run: python scripts/register_ab_test.py --version ${{ github.sha }}
```

이 3편 시리즈로 프롬프트 엔지니어링의 전 과정(기법 습득→고급 패턴→체계적 운영)이 완성됩니다.
