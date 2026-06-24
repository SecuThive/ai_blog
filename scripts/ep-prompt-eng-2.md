## 기초를 넘어야 하는 이유

1편의 Zero-shot·Few-shot·Role·Chain·Format 기법은 단순한 Q&A에 잘 작동합니다. 복잡한 추론과 다단계 계획이 필요한 프로덕션 태스크에서는 더 정교한 패턴이 필요합니다.

## Chain-of-Thought (CoT)

답변 전에 추론 과정을 단계적으로 서술하도록 유도합니다.

```python
# Zero-shot CoT: "단계별로 생각해보자" 한 줄이면 충분
zero_shot_cot = """
고객이 3개월 전 구매한 제품의 환불을 요청합니다.
환불 정책은 30일 이내만 가능하지만 제품 결함 시 예외입니다.
고객 사진에 명확한 제조 결함이 보입니다.

단계별로 생각한 후 처리 방법을 결정해주세요.
"""

# Few-shot CoT: 예시로 추론 스타일 학습
few_shot_cot = """
예시:
Q: 45일 경과, 제품 이상 없음
생각: 30일 초과 + 결함 없음 → 환불 불가
답: 환불 거절, 다른 보상 안내

Q: 10일 경과, 배송 파손
생각: 30일 이내 + 배송 파손(결함 준용) → 환불 가능
답: 즉시 환불 승인

Q: {현재_케이스}
생각:"""
```

**비용 팁**: CoT는 토큰을 2~3배 소비합니다. 중요한 의사결정에만 사용하세요.

## Tree-of-Thought (ToT)

단일 체인 대신 복수 경로를 트리로 탐색합니다.

```python
async def beam_search_thoughts(problem: str, branches: int = 3, depth: int = 2):
    paths = [problem]
    for _ in range(depth):
        candidates = []
        for path in paths:
            new_thoughts = await expand(path, n=branches)
            scores = await asyncio.gather(*[evaluate(t) for t in new_thoughts])
            candidates.extend(zip(scores, new_thoughts))
        candidates.sort(reverse=True)
        paths = [t for _, t in candidates[:branches]]
    return paths[0]
```

전략 수립, 복잡한 문제 분해에 효과적이나 비용이 10~20배 증가합니다.

## ReAct: 추론 + 도구 호출 반복

```
Thought: 고객 주문 내역 확인 필요
Action: get_orders(customer_id="12345")
Observation: [{"order_id": "ORD-789", "date": "2025-12-01", "status": "delivered"}]

Thought: 30일 정책상 2025-12-31까지 환불 가능
Action: process_refund(order_id="ORD-789")
Observation: {"status": "success", "amount": 89000}

Answer: 환불 완료. 3~5 영업일 내 입금됩니다.
```

```python
REACT_SYSTEM = """다음 형식으로만 응답하세요:
Thought: [현재 분석]
Action: [tool_name(param=value)]
Observation: [결과]
... 반복 ...
Answer: [최종 응답]"""
```

## Self-Consistency: 다수결 앙상블

```python
async def self_consistency(prompt: str, n: int = 5) -> str:
    responses = await asyncio.gather(*[
        llm.generate(prompt, temperature=0.7) for _ in range(n)
    ])
    answers = [extract_answer(r) for r in responses]
    return Counter(answers).most_common(1)[0][0]
```

n=5 기준 정확도 +8~15%, 비용 5배. 고가치 의사결정에만 적용하세요.

## 패턴 선택 가이드

| 패턴 | 적합한 태스크 | 비용 배수 |
|------|-------------|----------|
| CoT | 논리 추론, 수학 | 2~3x |
| ToT | 전략 수립, 설계 | 10~20x |
| ReAct | 도구 사용, 정보 수집 | 3~5x |
| Self-Consistency | 고확신 의사결정 | 5x |

3편에서는 이 패턴들을 체계적으로 관리하는 프롬프트 버전 관리와 A/B 테스트를 다룹니다.
