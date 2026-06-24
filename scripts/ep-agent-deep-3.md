## 에이전트가 실패하는 가장 흔한 이유

2편에서 도구 호출 오케스트레이션과 플래닝을 다뤘습니다. 프로덕션 에이전트의 실제 실패 원인은 대부분 평가 체계 부재와 디버깅 어려움에서 옵니다.

## 에이전트 평가 프레임워크

단순 출력 품질 평가로는 에이전트를 제대로 평가할 수 없습니다. 실행 경로·도구 선택·효율성을 함께 측정해야 합니다.

```python
from dataclasses import dataclass

@dataclass
class AgentTrace:
    task: str
    steps: list[dict]          # 각 단계: {thought, action, observation}
    final_answer: str
    total_tokens: int
    elapsed_ms: int
    tool_calls: list[str]
    success: bool

class AgentEvaluator:
    def evaluate(self, trace: AgentTrace, golden: dict) -> dict:
        return {
            "task_success": self._check_success(trace.final_answer, golden["answer"]),
            "tool_precision": self._tool_precision(trace.tool_calls, golden["expected_tools"]),
            "efficiency_score": self._efficiency(trace),
            "hallucination_rate": self._check_hallucination(trace),
            "step_count": len(trace.steps),
            "token_efficiency": golden.get("min_tokens", 500) / max(trace.total_tokens, 1),
        }

    def _tool_precision(self, used: list, expected: list) -> float:
        if not expected:
            return 1.0
        correct = sum(1 for t in used if t in expected)
        return correct / len(used) if used else 0.0

    def _efficiency(self, trace: AgentTrace) -> float:
        # 최적 경로 대비 실제 단계 수 비율
        optimal_steps = 3  # 도메인 지식으로 설정
        return min(1.0, optimal_steps / max(len(trace.steps), 1))
```

## 구조화된 추적 (Structured Tracing)

```python
import contextvars
import uuid
from datetime import datetime

trace_id_var = contextvars.ContextVar("trace_id")

class AgentTracer:
    def __init__(self, backend="langfuse"):
        self.backend = backend

    def start_trace(self, task: str) -> str:
        tid = str(uuid.uuid4())
        trace_id_var.set(tid)
        self._emit({
            "event": "trace_start",
            "trace_id": tid,
            "task": task,
            "timestamp": datetime.utcnow().isoformat(),
        })
        return tid

    def log_step(self, step_type: str, content: dict):
        self._emit({
            "event": "step",
            "trace_id": trace_id_var.get(),
            "step_type": step_type,  # thought | action | observation | answer
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
        })

    def end_trace(self, success: bool, final_answer: str):
        self._emit({
            "event": "trace_end",
            "trace_id": trace_id_var.get(),
            "success": success,
            "final_answer": final_answer,
            "timestamp": datetime.utcnow().isoformat(),
        })
```

## 멀티 에이전트 오케스트레이터

단일 에이전트의 한계를 넘어 전문 에이전트들이 협력하는 패턴:

```python
class OrchestratorAgent:
    """복잡한 태스크를 전문 에이전트에게 위임"""

    AGENTS = {
        "research": ResearchAgent(),     # 정보 수집·요약
        "code":     CodeAgent(),          # 코드 생성·실행
        "data":     DataAnalysisAgent(),  # 데이터 분석
        "writer":   WriterAgent(),        # 보고서 작성
    }

    async def execute(self, task: str) -> str:
        # 1. 태스크 분해
        subtasks = await self.decompose(task)

        # 2. 병렬 실행 (독립 태스크)
        results = {}
        independent = [s for s in subtasks if not s.dependencies]
        parallel_results = await asyncio.gather(*[
            self.AGENTS[s.agent_type].run(s.prompt)
            for s in independent
        ])
        for s, r in zip(independent, parallel_results):
            results[s.id] = r

        # 3. 순차 실행 (의존 태스크)
        dependent = [s for s in subtasks if s.dependencies]
        for s in dependent:
            context = {dep: results[dep] for dep in s.dependencies}
            results[s.id] = await self.AGENTS[s.agent_type].run(
                s.prompt, context=context
            )

        # 4. 결과 통합
        return await self.synthesize(task, results)
```

## Human-in-the-Loop 패턴

자율 에이전트에 필요한 지점에만 사람이 개입하는 설계:

```python
class HumanInLoopAgent:
    HIGH_RISK_ACTIONS = {
        "delete_records", "send_email", "execute_payment", "deploy_code"
    }

    async def execute_action(self, action: str, params: dict) -> dict:
        if action in self.HIGH_RISK_ACTIONS:
            approved = await self.request_approval(
                action=action,
                params=params,
                context=self.current_trace(),
                timeout_seconds=300,
            )
            if not approved:
                return {"status": "rejected", "action": action}

        return await self.tool_registry.call(action, **params)

    async def request_approval(self, **kwargs) -> bool:
        # Slack / 웹훅 / 이메일로 승인 요청
        approval_id = await self.notify_reviewer(**kwargs)
        return await self.wait_for_approval(approval_id, kwargs["timeout_seconds"])
```

## 에이전트 안정성 지표 (프로덕션 SLA)

| 지표 | 목표 | 알람 기준 |
|------|------|----------|
| 태스크 성공률 | ≥ 90% | < 85% |
| 평균 단계 수 | ≤ 8 | > 12 |
| 도구 정밀도 | ≥ 85% | < 75% |
| P95 지연 | ≤ 30s | > 45s |
| 환각 감지율 | ≤ 5% | > 8% |

이 3편 시리즈로 LLM 에이전트 심화 마스터 가이드(기초→도구 오케스트레이션→평가·운영)가 완성됩니다.
