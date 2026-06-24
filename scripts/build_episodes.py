import json, os

def c(s): return s  # identity

posts = [
{
  "title": "엣지 AI 배포 입문: 온디바이스 AI의 원리와 아키텍처 선택 가이드",
  "published_at": "2026-05-21T14:00:00.000+00:00",
  "category": "AI & 자동화",
  "tags": ["엣지AI","온디바이스AI","TFLite","ONNX","NPU","series:엣지 AI 배포 마스터 가이드"],
  "author": "Content Reviewer",
  "agent_role": "content_reviewer",
  "content": """## 왜 지금 엣지 AI인가

클라우드 AI는 강력하지만 한계가 뚜렷합니다. 네트워크 지연이 100ms를 넘는 환경에서 실시간 의사결정이 필요한 자율주행, 산업 로봇, 스마트 카메라는 클라우드 왕복을 기다릴 여유가 없습니다. 엣지 AI는 디바이스 자체에서 추론을 실행해 이 문제를 해결합니다.

## 클라우드 vs 엣지: 의사결정 기준

| 기준 | 클라우드 AI | 엣지 AI |
|------|------------|---------|
| 지연(Latency) | 50~500ms | 1~20ms |
| 인터넷 의존성 | 필수 | 불필요 |
| 프라이버시 | 데이터 외부 전송 | 로컬 처리 |
| 운영 비용 | API 호출당 과금 | 초기 하드웨어 |

**엣지를 선택해야 하는 상황:**
- 지연 SLA < 50ms
- 오프라인 동작 필수
- GDPR/HIPAA 규제 적용
- 대량 데이터 → 클라우드 업로드 비용 과다

## 엣지 디바이스 유형과 선택

### MCU (Microcontroller Unit)
- 대표: STM32, Arduino Nano 33 BLE
- RAM: 256KB~1MB, 적합: TinyML (< 100KB 모델)
- 용도: 키워드 감지, 이상 진동 탐지

### 엣지 GPU / NPU
- 대표: NVIDIA Jetson Orin, Google Coral
- TOPS: 10~275, 적합: MobileNet, EfficientDet
- 용도: 객체 인식, 얼굴 인증

### 산업용 엣지 서버
- 대표: Intel Core Ultra + OpenVINO
- 용도: 공장 비전 검사, 예측 유지보수

## 주요 배포 프레임워크 비교

### TensorFlow Lite
```bash
tflite_convert \\
  --saved_model_dir=./model \\
  --output_file=model.tflite \\
  --optimizations=DEFAULT
```
- 장점: 생태계 최대, Android/iOS 완벽 지원
- 단점: TF 모델 전용

### ONNX Runtime
```python
import onnxruntime as ort
sess = ort.InferenceSession("model.onnx")
outputs = sess.run(None, {"input": input_data})
```
- 장점: 프레임워크 중립 (PyTorch/TF/sklearn 모두)
- 단점: 모바일 최적화는 TFLite보다 약함

### OpenVINO (Intel)
```bash
mo --input_model model.onnx --output_dir ./ir_model
```
- 장점: Intel CPU/GPU/VPU 하드웨어 가속 극대화

## 배포 전 체크리스트

1. **전력 예산**: 추론 1회당 < 100mW
2. **메모리 피크**: 런타임 최대 RAM이 디바이스 한계의 70% 이하
3. **열 관리**: 연속 추론 시 80°C 미만
4. **모델 버전 관리**: OTA 업데이트 채널 설계
5. **폴백 전략**: 추론 실패 시 규칙 기반 대안 준비

2편에서는 양자화·프루닝으로 모델 크기를 75% 줄이면서 정확도 손실을 1% 미만으로 유지하는 실전 방법을 다룹니다.""",
},
{
  "title": "AI 에이전트 자동화 테스트 전략: 비결정 시스템을 검증하는 프레임워크",
  "published_at": "2026-05-20T17:11:00.000+00:00",
  "category": "AI & 자동화",
  "tags": ["AI에이전트","MLOps","LLM테스트","자동화검증","LangSmith","series:AI 에이전트 신뢰성 검증 가이드"],
  "author": "Content Reviewer",
  "agent_role": "content_reviewer",
  "content": """## 왜 일반 테스트가 에이전트에 통하지 않는가

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

3편에서는 테스트를 통과한 에이전트가 프로덕션에서 실패할 때 자동 복구하는 Circuit Breaker·Fallback 패턴을 다룹니다.""",
},
{
  "title": "에이전트 장애 복구 설계: Circuit Breaker·Fallback·Graceful Degradation 패턴",
  "published_at": "2026-05-20T17:41:00.000+00:00",
  "category": "AI & 자동화",
  "tags": ["AI에이전트","CircuitBreaker","MLOps","장애복구","신뢰성","series:AI 에이전트 신뢰성 검증 가이드"],
  "author": "Content Reviewer",
  "agent_role": "content_reviewer",
  "content": """## 프로덕션 에이전트는 반드시 실패한다

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
        return (datetime.now() - self.last_failure_time) > timedelta(seconds=self.recovery_timeout)
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
            if i > 0: print(f"Fallback level {i} 사용")
    return "잠시 후 다시 시도해주세요."
```

## Pattern 3: Graceful Degradation

전체를 끄는 대신 핵심 기능만 유지합니다.

```python
class DegradedService:
    def __init__(self):
        self.features = {"tool_use": True, "memory": True, "personalization": True}

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
            return {"result": step.partial_result, "warning": "최대 스텝 도달"}
    return step.final_result
```

## 핵심 운영 지표

- **MTTR**: 장애 후 복구까지 평균 시간 → 목표 < 30초
- **Circuit Open Rate**: 전체 요청 중 차단 비율 → 경고 > 1%
- **Fallback Rate**: 폴백 실행 비율 → 모델별 추적

이 3편 시리즈로 에이전트 신뢰성의 3층 방어(비결정성 제어→테스트→장애 복구)가 완성됩니다.""",
},
{
  "title": "산업 데이터 파이프라인 설계: MQTT·OPC-UA에서 클라우드 데이터 레이크까지",
  "published_at": "2026-05-21T02:11:00.000+00:00",
  "category": "AI & 자동화",
  "tags": ["산업AI","OT통합","MQTT","OPC-UA","데이터파이프라인","series:산업 현장 AI 통합 아키텍처 가이드"],
  "author": "Content Reviewer",
  "agent_role": "content_reviewer",
  "content": """## 산업 데이터의 특수성

일반 웹 데이터와 달리 산업 현장 데이터는 초당 수천 건의 센서 값, 밀리초 타임스탬프 정밀도, 수십 년 된 레거시 장비의 독점 프로토콜을 가집니다. 1편의 AI-OT 게이트웨이 위에서 이 데이터를 AI가 소비할 수 있는 형태로 만드는 파이프라인을 다룹니다.

## MQTT → 표준 이벤트 스트림

```python
import paho.mqtt.client as mqtt
import json
from datetime import datetime, timezone

def on_message(client, userdata, msg):
    raw = json.loads(msg.payload)
    event = {
        "specversion": "1.0",
        "type": "sensor.measurement",
        "source": f"factory/line-A/{msg.topic}",
        "time": datetime.now(timezone.utc).isoformat(),
        "data": {
            "value": raw["v"],
            "unit": raw.get("u", "?"),
            "quality": raw.get("q", 192),
        }
    }
    kafka_producer.send("sensor-events", json.dumps(event).encode())

client = mqtt.Client()
client.on_message = on_message
client.connect("broker.factory.local", 1883)
client.subscribe("sensors/#", qos=1)
```

## 엣지 버퍼링: 네트워크 단절 대응

```python
import sqlite3

class EdgeBuffer:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL,
                sent INTEGER DEFAULT 0
            )""")

    def write(self, payload):
        self.conn.execute("INSERT INTO events(payload) VALUES(?)", (payload,))
        self.conn.commit()

    def flush(self, producer, batch=1000):
        rows = self.conn.execute(
            "SELECT id, payload FROM events WHERE sent=0 LIMIT ?", (batch,)
        ).fetchall()
        for _, p in rows:
            producer.send("sensor-events", p.encode())
        producer.flush()
        ids = [str(r[0]) for r in rows]
        self.conn.execute(f"UPDATE events SET sent=1 WHERE id IN ({','.join(ids)})")
        self.conn.commit()
```

## TimescaleDB 설계

```sql
CREATE TABLE sensor_readings (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    metric      TEXT NOT NULL,
    value       DOUBLE PRECISION
);
SELECT create_hypertable('sensor_readings', 'time',
    chunk_time_interval => INTERVAL '1 hour');

-- 자동 압축 (7일 후 데이터)
SELECT add_compression_policy('sensor_readings', INTERVAL '7 days');

-- 1분 집계 연속 뷰
CREATE MATERIALIZED VIEW sensor_1min
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', time) AS bucket,
       device_id, metric,
       AVG(value) avg_val, MAX(value) max_val
FROM sensor_readings
GROUP BY bucket, device_id, metric;
```

## Kafka vs AWS IoT Greengrass 비교

| 항목 | Apache Kafka | AWS IoT Greengrass |
|------|-------------|-------------------|
| 설치 복잡도 | 높음 | 낮음 (관리형) |
| 오프라인 버퍼링 | 직접 구현 | 내장 |
| 엣지 ML 추론 | 별도 구성 | Lambda 통합 |
| 비용 | 인프라 비용 | 사용량 과금 |

## 전체 파이프라인

```
OPC-UA / MQTT / Modbus
    ↓
엣지 게이트웨이 (EdgeBuffer + 프로토콜 변환)
    ↓ Kafka
스트림 처리 (Kafka Streams)
    ↓
TimescaleDB (단기 고해상도) + S3 (장기 콜드)
    ↓
AI 모델 (이상 탐지 / 예측 유지보수 / 품질 검사)
```

3편에서는 이 파이프라인 위에서 실시간으로 동작하는 예측 유지보수 모델 배포와 드리프트 감지를 다룹니다.""",
},
{
  "title": "제조 현장 AI 모델 운영: 저지연 추론·연속 학습·예측 유지보수 실전 가이드",
  "published_at": "2026-05-21T02:41:00.000+00:00",
  "category": "AI & 자동화",
  "tags": ["산업AI","예측유지보수","MLOps","엣지AI","제조AI","series:산업 현장 AI 통합 아키텍처 가이드"],
  "author": "Content Reviewer",
  "agent_role": "content_reviewer",
  "content": """## 제조 AI의 운영 요구사항

컨베이어 벨트는 AI 응답을 기다리지 않습니다. 제조 현장 AI는 < 50ms 추론, 오프라인 동작, 드리프트 감지 세 가지가 필수 요건입니다.

## 저지연 추론 달성

```python
import onnxruntime as ort
import numpy as np
import time

class FastInference:
    def __init__(self, model_path):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 4
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.sess = ort.InferenceSession(model_path, sess_options=opts)
        self.inp = self.sess.get_inputs()[0].name
        # 웜업: 첫 추론은 JIT 컴파일로 느림
        dummy = np.zeros((1, 128), dtype=np.float32)
        for _ in range(10):
            self.sess.run(None, {self.inp: dummy})

    def predict(self, features):
        t0 = time.perf_counter()
        out = self.sess.run(None, {self.inp: features})
        return {"value": float(out[0][0]),
                "latency_ms": (time.perf_counter() - t0) * 1000}
```

## 예측 유지보수: Isolation Forest

```python
from sklearn.ensemble import IsolationForest
import joblib

# 정상 운전 데이터만으로 학습
clf = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
clf.fit(normal_sensor_data)
joblib.dump(clf, "pdm_model.pkl")

def score(reading: np.ndarray) -> dict:
    s = clf.decision_function(reading.reshape(1, -1))[0]
    return {
        "score": float(s),
        "is_anomaly": s < -0.1,
        "severity": "HIGH" if s < -0.3 else "MEDIUM" if s < -0.1 else "NORMAL"
    }
```

## RUL(잔여 수명) 예측 — LSTM

```python
import torch
import torch.nn as nn

class RULPredictor(nn.Module):
    def __init__(self, input_size=20, hidden=64):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden, num_layers=2,
                            batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden, 1)

    def forward(self, x):  # (batch, seq, features)
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :]).squeeze()
```

## 모델 드리프트 감지

생산 환경이 변하면(계절, 원자재, 설비 노화) 모델 성능이 저하됩니다.

```python
from scipy.stats import ks_2samp

class DriftDetector:
    def __init__(self, reference: np.ndarray, threshold=0.05):
        self.ref = reference
        self.thr = threshold

    def check(self, current: np.ndarray) -> list:
        drifted = []
        for i in range(self.ref.shape[1]):
            _, p = ks_2samp(self.ref[:, i], current[:, i])
            if p < self.thr:
                drifted.append(f"feature_{i}")
        if drifted:
            print(f"드리프트 감지: {drifted}")
            self._trigger_retrain()
        return drifted

    def _trigger_retrain(self):
        import requests
        requests.post(os.environ["RETRAIN_WEBHOOK_URL"])
```

## 운영 지표

| 지표 | 목표 | 경고 기준 |
|------|------|----------|
| 추론 지연 P99 | < 50ms | > 100ms |
| 이상 탐지 정밀도 | > 0.90 | < 0.80 |
| 드리프트 감지 주기 | 24시간 | 72시간 초과 |
| 재학습 주기 | 월 1회 이상 | 분기 1회 미만 |

이 3편 시리즈로 산업 현장 AI 통합의 전 과정(게이트웨이→파이프라인→모델 운영)이 완성됩니다.""",
},
{
  "title": "고급 프롬프트 패턴: CoT·ToT·ReAct를 프로덕션에서 활용하는 법",
  "published_at": "2026-05-21T18:02:00.000+00:00",
  "category": "AI & 자동화",
  "tags": ["프롬프트엔지니어링","CoT","ReAct","LLM","ToT","series:LLM 프롬프트 엔지니어링 마스터"],
  "author": "Content Reviewer",
  "agent_role": "content_reviewer",
  "content": """## 기초를 넘어야 하는 이유

1편의 Zero-shot·Few-shot·Role·Chain·Format 기법은 단순한 Q&A에 잘 작동합니다. 복잡한 추론과 다단계 계획, 외부 도구 활용이 필요한 프로덕션 태스크에서는 더 정교한 패턴이 필요합니다.

## Chain-of-Thought (CoT)

답변 전에 추론 과정을 단계적으로 서술하도록 유도합니다.

```python
# Zero-shot CoT: "단계별로 생각해보자" 한 줄이면 충분
zero_shot_cot = """
고객이 3개월 전 구매한 제품의 환불을 요청합니다.
환불 정책은 30일 이내만 가능하지만 제품 결함 시 예외입니다.
고객이 첨부한 사진에 명확한 제조 결함이 보입니다.

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
async def beam_search_thoughts(problem, branches=3, depth=2):
    paths = [problem]
    for _ in range(depth):
        candidates = []
        for path in paths:
            new_thoughts = await expand(path, n=branches)
            scores = await asyncio.gather(*[evaluate(t) for t in new_thoughts])
            candidates.extend(zip(scores, new_thoughts))
        candidates.sort(reverse=True)
        paths = [t for _, t in candidates[:branches]]  # 상위 유지
    return paths[0]
```

전략 수립, 복잡한 문제 분해에 효과적이나 비용 10~20배 증가에 주의하세요.

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
async def self_consistency(prompt, n=5):
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

3편에서는 이 패턴들을 체계적으로 관리하는 프롬프트 버전 관리와 A/B 테스트를 다룹니다.""",
},
{
  "title": "프롬프트 버전 관리와 A/B 테스트: 체계적인 프롬프트 최적화 파이프라인",
  "published_at": "2026-05-21T18:32:00.000+00:00",
  "category": "AI & 자동화",
  "tags": ["프롬프트엔지니어링","LLM평가","A/B테스트","PromptOps","LangSmith","series:LLM 프롬프트 엔지니어링 마스터"],
  "author": "Content Reviewer",
  "agent_role": "content_reviewer",
  "content": """## 프롬프트는 코드다

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
    def __init__(self, dir="prompts"):
        self.dir = Path(dir)

    def get(self, name, version="latest"):
        if version == "latest":
            files = sorted(self.dir.glob(f"**/{name}.v*.yaml"))
            return yaml.safe_load(files[-1].read_text())
        return yaml.safe_load((self.dir / f"{name}.{version}.yaml").read_text())
```

## A/B 테스트: 트래픽 분할

```python
import hashlib

class PromptABTest:
    def __init__(self, control, experiment, split=0.1):
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

1~5점 채점 (JSON만 반환):
- empathy: 고객 감정 공감도
- accuracy: 정보 정확도
- resolution: 문제 해결도
- overall: 종합

{{"empathy": N, "accuracy": N, "resolution": N, "overall": N}}
"""

async def llm_judge(msg, resp):
    result = await llm.generate(JUDGE.format(msg=msg, resp=resp), temperature=0)
    return json.loads(result)
```

## 통계적 유의성 검정

```python
from scipy import stats

def analyze_ab(ctrl_scores, exp_scores):
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

이 3편 시리즈로 프롬프트 엔지니어링의 전 과정(기법 습득→고급 패턴→체계적 운영)이 완성됩니다.""",
},
]

out = os.path.join(os.path.dirname(__file__), "episodes-part1.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)
print(f"저장 완료: {len(posts)}편 → {out}")
