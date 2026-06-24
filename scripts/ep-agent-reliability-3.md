## 프로덕션 에이전트는 반드시 실패한다

LLM API 타임아웃, 툴 오류, 무한 루프 — 잘 설계된 에이전트도 프로덕션에서 예상 밖의 방식으로 실패합니다. 이때 시스템 전체가 다운되지 않도록 복구 아키텍처가 필요합니다.

## LLM 에이전트 장애 유형

| 유형 | 예시 | 빈도 | 영향도 |
|------|------|------|--------|
| API 타임아웃 | OpenAI 30s 초과 | 중간 | 높음 |
| 모델 거부 | 콘텐츠 정책 위반 | 낮음 | 중간 |
| 툴 오류 | DB 연결 실패 | 높음 | 높음 |
| 무한 루프 | 같은 툴 반복 호출 | 낮음 | 치명 |
| 컨텍스트 초과 | 토큰 한도 초과 | 중간 | 중간 |

## Pattern 1: Circuit Breaker

반복 실패를 감지하면 해당 경로를 자동 차단해 전체 시스템을 보호합니다.

```python
from enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class AgentCircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.last_failure_time = None

    async def call(self, agent_fn, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if self._should_recover():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker OPEN")
        try:
            result = await agent_fn(*args, **kwargs)
            self.failure_count = 0
            self.state = CircuitState.CLOSED
            return result
        except Exception:
            self.failure_count += 1
            self.last_failure_time = datetime.now()
            if self.failure_count >= self.failure_threshold:
                self.state = CircuitState.OPEN
                print(f"서킷 OPEN: {self.failure_count}회 연속 실패")
            raise

    def _should_recover(self):
        elapsed = datetime.now() - self.last_failure_time
        return elapsed > timedelta(seconds=self.recovery_timeout)
```

## Pattern 2: Fallback 체인

메인 경로 실패 시 대안을 순차적으로 시도합니다.

```python
async def query_with_fallback(query: str) -> str:
    chain = [
        lambda q: claude_opus(q),      # 1순위: 최고 품질
        lambda q: claude_sonnet(q),    # 2순위: 빠른 모델
        lambda q: cached_response(q),  # 3순위: 캐시
        lambda q: rule_based(q),       # 4순위: 규칙 기반
    ]
    for i, fn in enumerate(chain):
        try:
            return await asyncio.wait_for(fn(query), timeout=10.0)
        except Exception as e:
            if i > 0:
                print(f"Fallback level {i} 사용")
    return "잠시 후 다시 시도해주세요."
```

## Pattern 3: Graceful Degradation

전체를 끄는 대신 핵심 기능만 유지합니다.

```python
class DegradedService:
    def __init__(self):
        self.features = {
            "tool_use": True,
            "memory": True,
            "personalization": True
        }

    async def handle(self, request):
        if not self.features["tool_use"]:
            return await self.knowledge_only(request)
        return await self.full_agent(request)

    def disable(self, feature: str):
        self.features[feature] = False
        print(f"기능 비활성화: {feature}")
```

## 무한 루프 방지

```python
MAX_STEPS = 15

async def safe_run(agent, query):
    steps = 0
    async for step in agent.stream(query):
        steps += 1
        if steps >= MAX_STEPS:
            return {
                "result": step.partial_result,
                "warning": f"최대 스텝({MAX_STEPS}) 도달 — 중간 결과 반환"
            }
    return step.final_result
```

## 핵심 운영 지표

- **MTTR**: 장애 후 복구까지 평균 시간 → 목표 < 30초
- **Circuit Open Rate**: 전체 요청 중 차단 비율 → 경고 > 1%
- **Fallback Rate**: 폴백 실행 비율 → 모델별 추적

이 3편 시리즈로 에이전트 신뢰성의 3층 방어(비결정성 제어→테스트→장애 복구)가 완성됩니다.
