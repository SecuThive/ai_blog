## 왜 일반 테스트가 에이전트에 통하지 않는가

단위 테스트의 전제는 결정론입니다. 같은 입력 → 항상 같은 출력. 그런데 LLM 에이전트는 temperature, 컨텍스트 노이즈, 모델 업데이트에 따라 다른 결과를 냅니다. 이번 편에서는 비결정 시스템을 체계적으로 검증하는 테스트 전략을 다룹니다.

## 에이전트 테스트의 4 레이어

```
Layer 4: End-to-End 시나리오 테스트
Layer 3: 툴 호출 정확도 테스트
Layer 2: 프롬프트 회귀 테스트
Layer 1: 출력 형식 / 스키마 검증
```

하위 레이어부터 안정화해야 상위 레이어 테스트가 의미 있습니다.

## Layer 1: 출력 스키마 검증

```python
from pydantic import BaseModel, ValidationError

class AgentResponse(BaseModel):
    action: str
    parameters: dict
    confidence: float  # 0.0 ~ 1.0

def test_schema(raw_output: str):
    try:
        r = AgentResponse.model_validate_json(raw_output)
        assert 0.0 <= r.confidence <= 1.0
        return True
    except ValidationError as e:
        print(f"Schema error: {e}")
        return False
```

Structured Output(JSON mode)을 강제하면 이 레이어 실패율을 0에 가깝게 만들 수 있습니다.

## Layer 2: 확률적 어설션

동일 입력으로 N번 실행 후 통계적으로 검증합니다.

```python
async def probabilistic_assert(agent, prompt, expected, n=20, threshold=0.8):
    results = await asyncio.gather(*[agent.run(prompt) for _ in range(n)])
    rate = Counter(r.action for r in results)[expected] / n
    assert rate >= threshold, f"통과율 {rate:.0%} < 목표 {threshold:.0%}"
```

**임계값 가이드:**
- 크리티컬 경로: 0.95 이상
- 일반 기능: 0.80 이상
- 창의적 생성: 0.60 이상 (정성 평가 병행)

## Layer 3: 툴 호출 정확도 테스트

```python
class ToolCallRecorder:
    def __init__(self): self.calls = []
    def __call__(self, tool_name, **kwargs):
        self.calls.append({"tool": tool_name, "params": kwargs})
        return mock_response(tool_name, **kwargs)

def test_tool_selection():
    recorder = ToolCallRecorder()
    agent = build_agent(tools=recorder)
    agent.run("고객 ID 12345의 최근 주문을 조회해줘")
    assert recorder.calls[0]["tool"] == "get_orders"
    assert recorder.calls[0]["params"]["customer_id"] == "12345"
```

## Layer 4: Replay 테스트 (LangSmith)

```python
from langsmith import Client

client = Client()
def export_golden_tests(project: str, limit=100):
    # 긍정 피드백을 받은 트레이스를 골든 데이터셋으로
    runs = client.list_runs(
        project_name=project,
        filter="eq(feedback_score, 1)",
        limit=limit
    )
    return [{"input": r.inputs, "expected": r.outputs} for r in runs]
```

사용자 긍정 피드백을 golden dataset으로 축적하면 모델 업데이트 시 자동 회귀 테스트가 가능합니다.

## CI 파이프라인 통합

```yaml
# .github/workflows/agent-test.yml
on: [pull_request]
jobs:
  test:
    steps:
      - run: pytest tests/test_schema.py       # 항상, 빠름
      - run: pytest tests/test_tool_calls.py   # PR마다
      - run: pytest tests/test_replay.py       # 야간 스케줄
```

3편에서는 테스트를 통과한 에이전트가 프로덕션에서 실패할 때 자동 복구하는 Circuit Breaker·Fallback 패턴을 다룹니다.
