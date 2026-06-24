import { createClient } from '@supabase/supabase-js';

const db = createClient(
  'https://isfzeksbzxtuqymfocqv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnpla3Nienh0dXF5bWZvY3F2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMzc2NCwiZXhwIjoyMDk0MzA5NzY0fQ.DKetrvS0DzApprniPZ0_ST1lHKLKUR6Pari4JXE7la0'
);

function slug(title) {
  return title.toLowerCase().replace(/[^\w\s가-힣]/g,'').trim().replace(/\s+/g,'-').slice(0,80);
}
function excerpt(content) {
  return content.replace(/[#*`\[\]]/g,'').replace(/\n+/g,' ').trim().slice(0,200)+'…';
}

const POSTS = [

// ── 1. 엣지 AI 배포 마스터 가이드 EP1 (기존 EP2·EP3 앞에 선행)
{
  title: '엣지 AI 배포 입문: 온디바이스 AI의 원리와 아키텍처 선택 가이드',
  published_at: '2026-05-21T14:00:00.000+00:00',
  category: 'AI & 자동화',
  tags: ['엣지AI','온디바이스AI','TFLite','ONNX','NPU','series:엣지 AI 배포 마스터 가이드'],
  author: 'Content Reviewer', agent_role: 'content_reviewer',
  content: `## 왜 지금 엣지 AI인가

클라우드 AI는 강력하지만 한계가 뚜렷합니다. 네트워크 지연이 100ms를 넘는 환경에서 실시간 의사결정이 필요한 자율주행 차량, 산업 로봇, 스마트 카메라는 클라우드 왕복을 기다릴 여유가 없습니다. 프라이버시 규제가 강화되면서 개인 데이터를 외부 서버로 보내는 비용과 리스크도 커졌습니다.

엣지 AI는 이 문제를 디바이스 자체에서 추론을 실행함으로써 해결합니다. 이 시리즈에서는 엣지 AI 배포의 전 과정을 단계적으로 다룹니다.

## 클라우드 vs 엣지: 의사결정 기준

| 기준 | 클라우드 AI | 엣지 AI |
|------|------------|---------|
| 지연(Latency) | 50~500ms | 1~20ms |
| 인터넷 의존성 | 필수 | 불필요 |
| 프라이버시 | 데이터 외부 전송 | 로컬 처리 |
| 모델 크기 | 무제한 | 수십~수백 MB |
| 운영 비용 | API 호출당 과금 | 초기 하드웨어 투자 |

**엣지를 선택해야 하는 상황:**
- 지연 SLA < 50ms
- 오프라인 동작 필수
- 개인정보 규제(GDPR, HIPAA) 적용
- 대량 데이터 지속 생성 → 클라우드 업로드 비용 과다

## 엣지 디바이스 유형과 하드웨어 선택

### MCU (Microcontroller Unit)
- 대표: STM32, Arduino Nano 33 BLE
- RAM: 256KB~1MB, 플래시: 1~2MB
- 적합 모델: TinyML (< 100KB)
- 용도: 키워드 감지, 이상 진동 탐지

### 엣지 GPU / NPU
- 대표: NVIDIA Jetson Orin, Google Coral, Apple Neural Engine
- TOPS(Tera Operations Per Second): 10~275 TOPS
- 적합 모델: MobileNet, EfficientNet, 경량 LLM
- 용도: 객체 인식, 얼굴 인증, 음성 인식

### 산업용 엣지 서버
- 대표: Intel Core Ultra + OpenVINO, AMD Ryzen AI
- 용도: 공장 비전 검사, 예측 유지보수

## 주요 배포 프레임워크 비교

### TensorFlow Lite
\`\`\`bash
# 모델 변환
tflite_convert \
  --saved_model_dir=./my_model \
  --output_file=model.tflite \
  --optimizations=DEFAULT
\`\`\`
- 장점: 생태계 최대, Android/iOS 완벽 지원
- 단점: TF 모델만 지원, 비TF는 ONNX 경유 필요

### ONNX Runtime
\`\`\`python
import onnxruntime as ort
sess = ort.InferenceSession("model.onnx",
    providers=['CPUExecutionProvider'])
outputs = sess.run(None, {"input": input_data})
\`\`\`
- 장점: 프레임워크 중립, PyTorch/TF/sklearn 모두 지원
- 단점: 모바일 최적화는 TFLite보다 약함

### OpenVINO (Intel)
\`\`\`bash
mo --input_model model.onnx --output_dir ./ir_model
\`\`\`
- 장점: Intel CPU/GPU/VPU 하드웨어 가속 극대화
- 단점: Intel 하드웨어 전용

## 배포 체크리스트

배포 전 반드시 확인해야 할 5가지:

1. **전력 예산**: 배터리 디바이스는 추론 1회당 전력 측정 필수 (< 100mW 목표)
2. **메모리 피크**: 런타임 최대 RAM 사용량이 디바이스 한계의 70% 이하인지
3. **열 관리**: 연속 추론 시 CPU/NPU 온도 80°C 미만 유지
4. **모델 버전 관리**: OTA(Over-the-Air) 업데이트 채널 설계
5. **폴백 전략**: 추론 실패 시 규칙 기반 대안 로직 준비

## 다음 편 예고

2편에서는 모델 경량화의 핵심인 **양자화(Quantization)와 프루닝(Pruning)**을 실전 코드와 함께 다룹니다. INT8 양자화로 모델 크기를 75% 줄이면서 정확도 손실을 1% 미만으로 유지하는 방법을 알아봅니다.`,
},

// ── 2. AI 에이전트 신뢰성 검증 가이드 EP2
{
  title: 'AI 에이전트 자동화 테스트 전략: 비결정 시스템을 검증하는 프레임워크',
  published_at: '2026-05-20T17:11:00.000+00:00',
  category: 'AI & 자동화',
  tags: ['AI에이전트','MLOps','LLM테스트','자동화검증','LangSmith','series:AI 에이전트 신뢰성 검증 가이드'],
  author: 'Content Reviewer', agent_role: 'content_reviewer',
  content: `## 왜 일반 테스트가 에이전트에 통하지 않는가

단위 테스트의 전제는 **결정론**입니다. 같은 입력 → 항상 같은 출력. 그런데 LLM 에이전트는 동일한 입력에도 temperature, 컨텍스트 노이즈, 모델 업데이트에 따라 다른 결과를 냅니다. "답이 달라졌다"는 것이 버그인지 정상 변동인지 구분하기 어렵습니다.

1편에서 다룬 아키텍처 레벨 비결정성 제어 위에, 이번 편에서는 **테스트 설계**로 신뢰성을 검증하는 방법을 다룹니다.

## 에이전트 테스트의 4가지 레이어

\`\`\`
Layer 4: End-to-End 시나리오 테스트
Layer 3: 툴 호출 정확도 테스트
Layer 2: 프롬프트 회귀 테스트
Layer 1: 출력 형식 / 스키마 검증
\`\`\`

하위 레이어부터 안정화해야 상위 레이어 테스트가 의미 있습니다.

## Layer 1: 출력 스키마 검증

가장 기본적이고 신뢰도 높은 테스트입니다.

\`\`\`python
from pydantic import BaseModel, ValidationError

class AgentResponse(BaseModel):
    action: str
    parameters: dict
    confidence: float  # 0.0 ~ 1.0

def test_schema_compliance(raw_output: str):
    try:
        parsed = AgentResponse.model_validate_json(raw_output)
        assert 0.0 <= parsed.confidence <= 1.0
        return True
    except ValidationError as e:
        print(f"Schema violation: {e}")
        return False
\`\`\`

Structured Output(JSON mode)을 강제하면 이 레이어 실패율을 0에 가깝게 만들 수 있습니다.

## Layer 2: 확률적 어설션

동일 입력으로 N번 실행 후 통계적으로 검증합니다.

\`\`\`python
import asyncio
from collections import Counter

async def probabilistic_assert(agent, prompt, expected_action, n=20, threshold=0.8):
    """N번 실행 중 threshold 비율 이상 올바른 action이면 통과"""
    results = await asyncio.gather(*[agent.run(prompt) for _ in range(n)])
    actions = [r.action for r in results]
    success_rate = Counter(actions)[expected_action] / n
    assert success_rate >= threshold, f"Pass rate {success_rate:.0%} < {threshold:.0%}"
    print(f"✅ '{expected_action}' 선택율: {success_rate:.0%} ({n}회 실행)")
\`\`\`

**임계값 가이드:**
- 크리티컬 경로: 0.95 이상
- 일반 기능: 0.80 이상
- 창의적 생성: 0.60 이상 (정성 평가 병행)

## Layer 3: 툴 호출 정확도 테스트

에이전트가 올바른 툴을 올바른 파라미터로 호출하는지 검증합니다.

\`\`\`python
class ToolCallRecorder:
    def __init__(self):
        self.calls = []

    def __call__(self, tool_name: str, **kwargs):
        self.calls.append({"tool": tool_name, "params": kwargs})
        return mock_tool_response(tool_name, **kwargs)

def test_tool_selection():
    recorder = ToolCallRecorder()
    agent = build_agent(tools=recorder)
    agent.run("고객 ID 12345의 최근 주문을 조회해줘")

    assert recorder.calls[0]["tool"] == "get_orders"
    assert recorder.calls[0]["params"]["customer_id"] == "12345"
\`\`\`

## Layer 4: Replay 테스트

프로덕션 트레이스를 테스트 케이스로 재활용합니다. 실제 사용자 상호작용이 가장 현실적인 테스트 소스입니다.

\`\`\`python
# LangSmith 트레이스 → 테스트 케이스 변환
from langsmith import Client

client = Client()
def export_traces_as_tests(project_name: str, limit: int = 100):
    runs = client.list_runs(project_name=project_name,
                            filter="eq(feedback_score, 1)",  # 긍정 피드백만
                            limit=limit)
    return [{"input": r.inputs, "expected_output": r.outputs} for r in runs]
\`\`\`

사용자가 👍를 누른 응답을 golden dataset으로 축적하면, 모델 업데이트 시 회귀 테스트 자동 실행이 가능합니다.

## 실전 테스트 파이프라인

\`\`\`yaml
# .github/workflows/agent-test.yml
on: [pull_request]
jobs:
  agent-tests:
    steps:
      - name: Schema tests (빠름, 항상 실행)
        run: pytest tests/test_schema.py
      - name: Probabilistic tests (느림, 야간 실행)
        if: github.event_name == 'schedule'
        run: pytest tests/test_probabilistic.py --runs=50
      - name: Replay tests (중간, PR마다 실행)
        run: pytest tests/test_replay.py --dataset=golden_v2
\`\`\`

3편에서는 테스트를 통과한 에이전트가 **프로덕션에서 실패할 때** 어떻게 자동 복구하는지 다룹니다.`,
},

// ── 3. AI 에이전트 신뢰성 검증 가이드 EP3
{
  title: '에이전트 장애 복구 설계: Circuit Breaker·Fallback·Graceful Degradation 패턴',
  published_at: '2026-05-20T17:41:00.000+00:00',
  category: 'AI & 자동화',
  tags: ['AI에이전트','CircuitBreaker','MLOps','장애복구','신뢰성','series:AI 에이전트 신뢰성 검증 가이드'],
  author: 'Content Reviewer', agent_role: 'content_reviewer',
  content: `## 프로덕션 에이전트의 장애 현실

아무리 잘 설계된 에이전트도 프로덕션에서는 예상치 못한 방식으로 실패합니다. LLM API 타임아웃, 툴 응답 오류, 무한 루프, 컨텍스트 초과. 이때 시스템 전체가 다운되지 않도록 **복구 아키텍처**가 필요합니다.

## LLM 에이전트 장애 유형 분류

| 유형 | 예시 | 빈도 | 영향도 |
|------|------|------|--------|
| API 타임아웃 | OpenAI 30s 초과 | 중간 | 높음 |
| 모델 거부 | 콘텐츠 정책 위반 | 낮음 | 중간 |
| 툴 오류 | DB 연결 실패 | 높음 | 높음 |
| 무한 루프 | 에이전트가 같은 툴 반복 호출 | 낮음 | 치명 |
| 컨텍스트 초과 | 긴 대화 후 토큰 한도 초과 | 중간 | 중간 |

## Pattern 1: Circuit Breaker

서킷 브레이커는 반복 실패를 감지하면 해당 경로를 자동으로 차단해 전체 시스템을 보호합니다.

\`\`\`python
from enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"      # 정상 동작
    OPEN = "open"          # 차단 상태
    HALF_OPEN = "half_open"  # 복구 테스트 중

class AgentCircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.last_failure_time = None
        self.recovery_timeout = recovery_timeout

    async def call(self, agent_fn, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if self._should_attempt_recovery():
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitOpenError("Circuit breaker OPEN — 대체 응답 사용")

        try:
            result = await agent_fn(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            print(f"🔴 Circuit OPEN: {self.failure_count}회 연속 실패")

    def _should_attempt_recovery(self):
        return (datetime.now() - self.last_failure_time) > timedelta(seconds=self.recovery_timeout)
\`\`\`

## Pattern 2: Fallback 체인

메인 경로 실패 시 대안을 순차적으로 시도합니다.

\`\`\`python
async def query_with_fallback(user_query: str) -> str:
    fallback_chain = [
        lambda q: claude_opus_agent(q),          # 1순위: 최고 품질
        lambda q: claude_sonnet_agent(q),         # 2순위: 빠른 모델
        lambda q: cached_response(q),             # 3순위: 캐시 히트
        lambda q: rule_based_response(q),         # 4순위: 규칙 기반
        lambda q: "죄송합니다. 잠시 후 다시 시도해주세요.",  # 최종 폴백
    ]

    for i, fn in enumerate(fallback_chain):
        try:
            result = await asyncio.wait_for(fn(user_query), timeout=10.0)
            if i > 0:
                print(f"⚠️  Fallback level {i} 사용")
            return result
        except (asyncio.TimeoutError, Exception) as e:
            print(f"Level {i} 실패: {e}")
            continue

    return fallback_chain[-1](user_query)
\`\`\`

## Pattern 3: Graceful Degradation

전체 기능을 끄는 대신 핵심 기능만 유지하며 서빙합니다.

\`\`\`python
class DegradedAgentService:
    def __init__(self):
        self.features = {
            "advanced_reasoning": True,
            "tool_use": True,
            "memory_retrieval": True,
            "personalization": True,
        }

    async def handle(self, request):
        if not self.features["advanced_reasoning"]:
            # 단순 Q&A 모드로 폴백
            return await self.simple_qa(request)

        if not self.features["tool_use"]:
            # 툴 없이 지식 기반 응답만
            return await self.knowledge_only_agent(request)

        return await self.full_agent(request)

    def degrade(self, feature: str):
        self.features[feature] = False
        print(f"⬇️  기능 비활성화: {feature}")
\`\`\`

## 무한 루프 방지: 스텝 카운터

\`\`\`python
MAX_STEPS = 15

async def run_agent_with_limit(agent, query):
    steps = 0
    async for step in agent.stream(query):
        steps += 1
        if steps >= MAX_STEPS:
            return {
                "result": step.partial_result,
                "warning": f"최대 스텝({MAX_STEPS}) 도달 — 중간 결과 반환"
            }
    return step.final_result
\`\`\`

## 종합 운영 대시보드 지표

장애 복구 아키텍처의 효과는 다음 지표로 측정합니다:

- **MTTR** (Mean Time To Recovery): 장애 후 정상화까지 평균 시간 → 목표 < 30초
- **Circuit Open Rate**: 전체 요청 중 서킷 차단 비율 → 경고 기준 > 1%
- **Fallback Activation Rate**: 폴백 실행 비율 → 모델별 추적
- **Degraded Mode Duration**: 기능 축소 서빙 시간 합계 → 월별 SLA 계산

이 3편 시리즈로 에이전트 신뢰성의 3층 방어(비결정성 제어 → 테스트 → 장애 복구)가 완성됩니다.`,
},

// ── 4. 산업 현장 AI 통합 아키텍처 EP2
{
  title: '산업 데이터 파이프라인 설계: MQTT·OPC-UA에서 클라우드 데이터 레이크까지',
  published_at: '2026-05-21T02:11:00.000+00:00',
  category: 'AI & 자동화',
  tags: ['산업AI','OT통합','MQTT','OPC-UA','데이터파이프라인','series:산업 현장 AI 통합 아키텍처 가이드'],
  author: 'Content Reviewer', agent_role: 'content_reviewer',
  content: `## 산업 데이터의 특수성

일반 웹 애플리케이션 데이터와 달리 산업 현장 데이터는 독특한 특성을 가집니다. 초당 수천 건의 센서 값, 밀리초 단위 타임스탬프 정밀도, 수십 년 된 레거시 장비에서 오는 독점 프로토콜. 이 데이터를 AI 모델이 소비할 수 있는 형태로 만드는 것이 2편의 주제입니다.

## 산업 프로토콜 표준화

### MQTT → 표준 이벤트 스트림

MQTT는 경량 Pub/Sub 프로토콜로 IoT에 최적화되어 있습니다.

\`\`\`python
import paho.mqtt.client as mqtt
import json
from datetime import datetime, timezone

def on_message(client, userdata, msg):
    raw = json.loads(msg.payload)
    # 산업 데이터를 표준 CloudEvents 형식으로 변환
    event = {
        "specversion": "1.0",
        "type": "sensor.measurement",
        "source": f"factory/line-A/{msg.topic}",
        "time": datetime.now(timezone.utc).isoformat(),
        "datacontenttype": "application/json",
        "data": {
            "value": raw["v"],
            "unit": raw.get("u", "unknown"),
            "quality": raw.get("q", 192),  # OPC-UA quality code
        }
    }
    kafka_producer.send("sensor-events", json.dumps(event).encode())

client = mqtt.Client()
client.on_message = on_message
client.connect("broker.factory.local", 1883)
client.subscribe("sensors/#", qos=1)
\`\`\`

### OPC-UA 데이터 추출

OPC-UA는 산업 자동화의 표준 통신 프로토콜입니다.

\`\`\`python
from opcua import Client as OpcClient
import asyncio

async def poll_opcua_nodes(endpoint: str, node_ids: list, interval_ms: int = 100):
    client = OpcClient(endpoint)
    client.connect()

    nodes = [client.get_node(nid) for nid in node_ids]

    while True:
        values = []
        for node in nodes:
            dv = node.get_data_value()
            values.append({
                "node_id": str(node.nodeid),
                "value": dv.Value.Value,
                "timestamp": dv.SourceTimestamp.isoformat(),
                "status_code": str(dv.StatusCode),
            })

        await send_to_kafka(values)
        await asyncio.sleep(interval_ms / 1000)
\`\`\`

## 엣지 버퍼링: 네트워크 단절 대응

산업 현장의 네트워크는 불안정합니다. WAN 연결이 끊겨도 데이터가 유실되면 안 됩니다.

\`\`\`python
import sqlite3
from contextlib import contextmanager

class EdgeBuffer:
    """SQLite 기반 로컬 버퍼 — WAL 모드로 고성능 쓰기"""

    def __init__(self, db_path: str, max_size_mb: int = 500):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL,
                created_at REAL DEFAULT (unixepoch('now','subsec')),
                sent INTEGER DEFAULT 0
            )
        """)
        self.max_size_mb = max_size_mb

    def write(self, payload: str):
        self.conn.execute("INSERT INTO events (payload) VALUES (?)", (payload,))
        self.conn.commit()

    def flush_to_kafka(self, producer, batch_size: int = 1000):
        rows = self.conn.execute(
            "SELECT id, payload FROM events WHERE sent=0 LIMIT ?", (batch_size,)
        ).fetchall()

        if not rows:
            return 0

        ids = [r[0] for r in rows]
        for _, payload in rows:
            producer.send("sensor-events", payload.encode())

        producer.flush()
        self.conn.execute(f"UPDATE events SET sent=1 WHERE id IN ({','.join('?'*len(ids))})", ids)
        self.conn.commit()
        return len(rows)
\`\`\`

## 시계열 DB 설계: TimescaleDB

\`\`\`sql
-- TimescaleDB 하이퍼테이블 생성
CREATE TABLE sensor_readings (
    time        TIMESTAMPTZ NOT NULL,
    device_id   TEXT NOT NULL,
    metric      TEXT NOT NULL,
    value       DOUBLE PRECISION,
    quality     SMALLINT DEFAULT 192
);

SELECT create_hypertable('sensor_readings', 'time', chunk_time_interval => INTERVAL '1 hour');

-- 자동 압축 (7일 이후 데이터)
SELECT add_compression_policy('sensor_readings', INTERVAL '7 days');

-- 연속 집계 (1분 평균)
CREATE MATERIALIZED VIEW sensor_1min
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 minute', time) AS bucket,
       device_id, metric,
       AVG(value) AS avg_val,
       MAX(value) AS max_val,
       MIN(value) AS min_val
FROM sensor_readings
GROUP BY bucket, device_id, metric;
\`\`\`

## 전체 파이프라인 아키텍처

\`\`\`
OPC-UA / MQTT / Modbus
    ↓
엣지 게이트웨이 (EdgeBuffer + 프로토콜 변환)
    ↓ (Kafka)
스트림 처리 (Apache Flink / Kafka Streams)
    ↓
TimescaleDB (단기 고해상도)  +  S3/GCS (장기 콜드 스토리지)
    ↓
AI 모델 (이상 탐지 / 예측 유지보수 / 품질 검사)
\`\`\`

3편에서는 이 파이프라인 위에서 실시간으로 동작하는 **예측 유지보수 모델 배포**를 다룹니다.`,
},

// ── 5. 산업 현장 AI 통합 아키텍처 EP3
{
  title: '제조 현장 AI 모델 운영: 저지연 추론·연속 학습·예측 유지보수 실전 가이드',
  published_at: '2026-05-21T02:41:00.000+00:00',
  category: 'AI & 자동화',
  tags: ['산업AI','예측유지보수','MLOps','엣지AI','제조AI','series:산업 현장 AI 통합 아키텍처 가이드'],
  author: 'Content Reviewer', agent_role: 'content_reviewer',
  content: `## 제조 AI의 운영 요구사항

제조 현장 AI는 일반 웹 서비스와 다른 SLA를 요구합니다. 컨베이어 벨트는 AI 응답을 기다리지 않습니다. 저지연 추론, 오프라인 동작, 드리프트 감지 — 이 세 가지가 제조 AI 운영의 핵심입니다.

## 저지연 추론 달성하기

### 목표: < 50ms end-to-end

\`\`\`python
import onnxruntime as ort
import numpy as np
import time

class FastInferenceEngine:
    def __init__(self, model_path: str):
        # CPU 최적화 세션 옵션
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 4
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        self.session = ort.InferenceSession(
            model_path,
            sess_options=opts,
            providers=['CPUExecutionProvider']
        )
        self.input_name = self.session.get_inputs()[0].name

        # 모델 웜업 (첫 번째 추론은 JIT 컴파일로 느림)
        dummy = np.zeros((1, 128), dtype=np.float32)
        for _ in range(10):
            self.session.run(None, {self.input_name: dummy})

    def predict(self, features: np.ndarray) -> dict:
        start = time.perf_counter()
        outputs = self.session.run(None, {self.input_name: features})
        latency_ms = (time.perf_counter() - start) * 1000

        return {
            "prediction": outputs[0][0],
            "latency_ms": latency_ms,
        }
\`\`\`

### 배치 처리로 처리량 향상

단일 추론보다 배치 추론이 처리량을 10~20배 높입니다.

\`\`\`python
import asyncio
from collections import deque

class BatchInferenceEngine:
    def __init__(self, model, batch_size=32, max_wait_ms=10):
        self.model = model
        self.batch_size = batch_size
        self.max_wait_ms = max_wait_ms
        self.queue = deque()
        self._process_task = asyncio.create_task(self._process_loop())

    async def predict(self, features):
        future = asyncio.Future()
        self.queue.append((features, future))
        return await future

    async def _process_loop(self):
        while True:
            await asyncio.sleep(self.max_wait_ms / 1000)
            if not self.queue:
                continue

            batch = []
            futures = []
            while self.queue and len(batch) < self.batch_size:
                feat, fut = self.queue.popleft()
                batch.append(feat)
                futures.append(fut)

            results = self.model.predict_batch(np.stack(batch))
            for fut, res in zip(futures, results):
                fut.set_result(res)
\`\`\`

## 예측 유지보수(PdM) 모델

### 이상 탐지: Isolation Forest

\`\`\`python
from sklearn.ensemble import IsolationForest
import joblib

# 학습 (정상 운전 데이터만 사용)
clf = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
clf.fit(normal_sensor_data)
joblib.dump(clf, "pdm_model.pkl")

# 실시간 스코어링
def anomaly_score(reading: np.ndarray) -> dict:
    score = clf.decision_function(reading.reshape(1, -1))[0]
    is_anomaly = score < -0.1  # 임계값 튜닝 필요
    return {
        "anomaly_score": float(score),
        "is_anomaly": bool(is_anomaly),
        "severity": "HIGH" if score < -0.3 else "MEDIUM" if is_anomaly else "NORMAL"
    }
\`\`\`

### 잔여 수명(RUL) 예측

\`\`\`python
import torch
import torch.nn as nn

class RULPredictor(nn.Module):
    """LSTM 기반 잔여 수명 예측"""
    def __init__(self, input_size=20, hidden_size=64):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers=2, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):  # x: (batch, seq_len, features)
        out, _ = self.lstm(x)
        return self.fc(out[:, -1, :]).squeeze()  # 마지막 타임스텝만 사용
\`\`\`

## 모델 드리프트 감지

생산 환경이 변하면 (계절, 원자재 변경, 설비 노화) 모델 성능이 저하됩니다.

\`\`\`python
from scipy.stats import ks_2samp

class DriftDetector:
    def __init__(self, reference_data: np.ndarray, threshold: float = 0.05):
        self.reference = reference_data
        self.threshold = threshold

    def check(self, current_data: np.ndarray) -> dict:
        results = {}
        for i in range(self.reference.shape[1]):
            stat, p_value = ks_2samp(self.reference[:, i], current_data[:, i])
            results[f"feature_{i}"] = {
                "ks_stat": float(stat),
                "p_value": float(p_value),
                "drifted": p_value < self.threshold,
            }

        drifted_features = [k for k, v in results.items() if v["drifted"]]
        if drifted_features:
            print(f"⚠️  드리프트 감지: {drifted_features}")
            self._trigger_retraining()

        return results

    def _trigger_retraining(self):
        # CI/CD 파이프라인 트리거 (예: GitHub Actions webhook)
        import requests
        requests.post(os.environ["RETRAIN_WEBHOOK_URL"])
\`\`\`

## 운영 지표 요약

| 지표 | 목표값 | 경고 기준 |
|------|--------|-----------|
| 추론 지연 (P99) | < 50ms | > 100ms |
| 이상 탐지 정밀도 | > 0.90 | < 0.80 |
| 드리프트 감지 주기 | 24시간 | 72시간 초과 |
| 모델 재학습 주기 | 월 1회 이상 | 분기 1회 미만 |

이 3편 시리즈로 산업 현장 AI 통합의 전 과정 — 게이트웨이 → 파이프라인 → 모델 운영 — 이 완성됩니다.`,
},

// ── 6. LLM 프롬프트 엔지니어링 마스터 EP2
{
  title: '고급 프롬프트 패턴: CoT·ToT·ReAct를 프로덕션에서 활용하는 법',
  published_at: '2026-05-21T18:02:00.000+00:00',
  category: 'AI & 자동화',
  tags: ['프롬프트엔지니어링','CoT','ReAct','LLM','ToT','series:LLM 프롬프트 엔지니어링 마스터'],
  author: 'Content Reviewer', agent_role: 'content_reviewer',
  content: `## 기초를 넘어: 왜 고급 패턴이 필요한가

1편에서 다룬 Zero-shot, Few-shot, Role, Chain, Format 기법은 단순한 Q&A에 잘 작동합니다. 하지만 복잡한 추론, 다단계 계획, 외부 도구 활용이 필요한 프로덕션 태스크에서는 더 정교한 패턴이 필요합니다.

## Chain-of-Thought (CoT): 추론 과정 명시화

LLM이 답변 전에 추론 과정을 단계적으로 서술하도록 유도합니다. 복잡한 수학 문제, 논리 추론, 다단계 계획에서 정확도를 크게 높입니다.

\`\`\`python
# Zero-shot CoT: "단계별로 생각해보자" 한 줄로 효과
zero_shot_cot = """
고객이 3개월 전 구매한 제품의 환불을 요청합니다.
환불 정책은 30일 이내만 가능하지만, 제품 결함이 있는 경우 예외입니다.
고객이 제품 사진을 첨부했고 명확한 제조 결함이 보입니다.

단계별로 생각한 후 처리 방법을 결정해주세요.
"""

# Few-shot CoT: 예시로 추론 스타일 학습
few_shot_cot = """
예시:
Q: 주문 후 45일이 지났고 제품에 이상이 없습니다.
생각: 환불 정책 30일 초과 + 결함 없음 → 환불 불가 조건 모두 해당
답: 환불 거절, 사유 설명 후 다른 보상 옵션 안내

Q: 주문 후 10일, 배송 중 파손 의심
생각: 30일 이내 + 배송 파손은 제품 결함에 준함 → 환불 가능
답: 즉시 환불 승인, 반품 레이블 발송

Q: {현재_케이스}
생각:"""
\`\`\`

**프로덕션 팁**: CoT는 토큰 소비를 2~3배 늘립니다. 비용 민감한 경우 `thinking_budget` 파라미터나 별도 추론 모델 사용을 검토하세요.

## Tree-of-Thought (ToT): 복수 경로 탐색

단일 추론 체인 대신 여러 가능성을 트리 구조로 탐색합니다. 전략 수립, 복잡한 문제 분해에 효과적입니다.

\`\`\`python
async def tree_of_thought(problem: str, branches: int = 3, depth: int = 2) -> str:
    async def generate_thoughts(context: str, n: int) -> list[str]:
        response = await llm.generate(
            f"{context}\n\n가능한 접근법 {n}가지를 간략히 제시하세요:",
            n=n, temperature=0.8
        )
        return response.choices

    async def evaluate_thought(thought: str) -> float:
        score = await llm.generate(
            f"다음 접근법의 유망성을 0~10으로 평가하세요:\n{thought}\n점수:",
            temperature=0
        )
        return float(score.strip())

    # BFS로 가장 유망한 경로 탐색
    current_paths = [problem]
    for _ in range(depth):
        all_thoughts = []
        for path in current_paths:
            thoughts = await generate_thoughts(path, branches)
            scores = await asyncio.gather(*[evaluate_thought(t) for t in thoughts])
            all_thoughts.extend(zip(scores, thoughts))

        # 상위 branches개만 유지 (빔 서치)
        all_thoughts.sort(reverse=True)
        current_paths = [t for _, t in all_thoughts[:branches]]

    return current_paths[0]  # 최고 점수 경로 반환
\`\`\`

## ReAct: 추론과 행동의 반복 루프

Reasoning + Acting의 합성어. 추론 → 도구 호출 → 관찰 → 재추론을 반복합니다.

\`\`\`
Thought: 고객의 최근 주문 내역을 확인해야 한다.
Action: get_orders(customer_id="12345")
Observation: [{"order_id": "ORD-789", "date": "2025-12-01", "status": "delivered"}]

Thought: 주문이 존재하고 배송 완료됨. 환불 정책 30일 기준으로 2025-12-31까지 가능.
Action: check_date(date="2025-12-01", days=30)
Observation: deadline="2025-12-31", today="2025-12-15", within_policy=true

Thought: 환불 정책 내. 이제 환불 처리를 실행한다.
Action: process_refund(order_id="ORD-789", reason="customer_request")
Observation: {"status": "success", "refund_amount": 89000}

Answer: 환불이 완료되었습니다. 영업일 3~5일 내 입금됩니다.
\`\`\`

\`\`\`python
REACT_SYSTEM = """당신은 고객 서비스 에이전트입니다.
다음 형식으로 응답하세요:
Thought: [현재 상황 분석]
Action: [tool_name(param=value)]
Observation: [도구 실행 결과]
... (반복)
Answer: [최종 응답]"""
\`\`\`

## Self-Consistency: 다수결 앙상블

동일 문제를 temperature > 0으로 여러 번 실행 후 가장 많은 답을 선택합니다.

\`\`\`python
async def self_consistency(prompt: str, n: int = 5) -> str:
    responses = await asyncio.gather(*[
        llm.generate(prompt, temperature=0.7) for _ in range(n)
    ])
    answers = [extract_answer(r) for r in responses]
    return Counter(answers).most_common(1)[0][0]
\`\`\`

**비용 대비 효과**: n=5일 때 정확도 +8~15%, 비용 5배. 고가치 의사결정에만 사용하세요.

## 패턴별 사용 가이드

| 패턴 | 적합한 태스크 | 비용 배수 | 지연 배수 |
|------|-------------|-----------|-----------|
| CoT | 논리 추론, 수학 | 2~3x | 2~3x |
| ToT | 전략 수립, 설계 | 10~20x | 5~10x |
| ReAct | 도구 사용, 정보 수집 | 3~5x | 3~5x |
| Self-Consistency | 고확신 의사결정 | 5x | 5x |

3편에서는 이 패턴들을 **체계적으로 관리**하는 프롬프트 버전 관리와 A/B 테스트를 다룹니다.`,
},

// ── 7. LLM 프롬프트 엔지니어링 마스터 EP3
{
  title: '프롬프트 버전 관리와 A/B 테스트: 체계적인 프롬프트 최적화 파이프라인',
  published_at: '2026-05-21T18:32:00.000+00:00',
  category: 'AI & 자동화',
  tags: ['프롬프트엔지니어링','LLM평가','A/B테스트','PromptOps','LangSmith','series:LLM 프롬프트 엔지니어링 마스터'],
  author: 'Content Reviewer', agent_role: 'content_reviewer',
  content: `## 프롬프트는 코드다

많은 팀이 프롬프트를 코드 문자열에 하드코딩합니다. 누가 언제 어떻게 바꿨는지 추적이 안 되고, 성능이 나빠져도 원인을 찾기 어렵습니다. 프롬프트를 코드처럼 관리해야 합니다.

## Git 기반 프롬프트 버전 관리

\`\`\`
prompts/
├── customer_service/
│   ├── refund_handler.v1.yaml
│   ├── refund_handler.v2.yaml  ← 현재 프로덕션
│   └── refund_handler.v3.yaml  ← 실험 중
├── content_generation/
│   └── blog_writer.v4.yaml
└── schemas/
    └── prompt_schema.json
\`\`\`

\`\`\`yaml
# refund_handler.v2.yaml
version: "2.0.1"
name: "refund_handler"
description: "환불 요청 처리 에이전트"
model: "claude-sonnet-4-6"
temperature: 0.1
max_tokens: 500
system: |
  당신은 {{company_name}}의 고객 서비스 전문가입니다.
  환불 정책: {{refund_policy}}
  항상 공감 먼저, 정책 설명 나중 순서로 응답하세요.
user_template: |
  고객 문의: {{customer_message}}
  주문 정보: {{order_info}}
metadata:
  author: "team-cx"
  created: "2026-03-15"
  changelog: "공감 표현 강화, 정책 거절 문구 부드럽게 수정"
  eval_score: 0.87
\`\`\`

\`\`\`python
import yaml
from pathlib import Path
from string import Template

class PromptRegistry:
    def __init__(self, prompts_dir: str = "prompts"):
        self.dir = Path(prompts_dir)

    def get(self, name: str, version: str = "latest") -> dict:
        if version == "latest":
            files = sorted(self.dir.glob(f"**/{name}.v*.yaml"))
            path = files[-1]  # 버전 번호 오름차순 정렬
        else:
            path = self.dir / f"{name}.{version}.yaml"

        return yaml.safe_load(path.read_text())

    def render(self, name: str, variables: dict, version: str = "latest") -> str:
        prompt = self.get(name, version)
        return Template(prompt["system"]).substitute(**variables)
\`\`\`

## 프롬프트 A/B 테스트

### 트래픽 분할

\`\`\`python
import hashlib

class PromptABTest:
    def __init__(self, control_version: str, experiment_version: str, traffic_split: float = 0.1):
        self.control = control_version
        self.experiment = experiment_version
        self.split = traffic_split  # 실험군 비율

    def assign_variant(self, user_id: str) -> str:
        """동일 user_id는 항상 같은 그룹 (일관된 UX)"""
        hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        return "experiment" if (hash_val % 100) < (self.split * 100) else "control"

    def get_prompt_version(self, user_id: str) -> str:
        variant = self.assign_variant(user_id)
        return self.experiment if variant == "experiment" else self.control
\`\`\`

### 평가 지표 수집

\`\`\`python
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PromptEvalRecord:
    prompt_version: str
    variant: str
    user_id: str
    latency_ms: float
    token_count: int
    user_rating: int | None  # 1~5, 없으면 None
    llm_score: float | None  # LLM-as-Judge 점수
    timestamp: datetime = datetime.now()

def calculate_ab_results(records: list[PromptEvalRecord]) -> dict:
    from scipy import stats

    control = [r for r in records if r.variant == "control"]
    experiment = [r for r in records if r.variant == "experiment"]

    # 평균 비교
    ctrl_scores = [r.llm_score for r in control if r.llm_score]
    exp_scores = [r.llm_score for r in experiment if r.llm_score]

    t_stat, p_value = stats.ttest_ind(ctrl_scores, exp_scores)

    return {
        "control_mean": sum(ctrl_scores)/len(ctrl_scores),
        "experiment_mean": sum(exp_scores)/len(exp_scores),
        "p_value": p_value,
        "significant": p_value < 0.05,
        "winner": "experiment" if (sum(exp_scores)/len(exp_scores) > sum(ctrl_scores)/len(ctrl_scores) and p_value < 0.05) else "control"
    }
\`\`\`

## LLM-as-Judge 자동 평가

사람 레이블 없이 GPT-4/Claude로 출력 품질을 자동 채점합니다.

\`\`\`python
JUDGE_PROMPT = """다음 고객 서비스 응답을 평가하세요.

[고객 문의]
{customer_message}

[에이전트 응답]
{agent_response}

다음 기준으로 1~5점 채점하세요:
- 공감도: 고객 감정에 공감하는가 (1~5)
- 정확성: 정책/정보가 정확한가 (1~5)
- 해결성: 문제가 실제로 해결되는가 (1~5)

JSON으로만 응답: {{"empathy": N, "accuracy": N, "resolution": N, "overall": N}}"""

async def llm_judge(customer_msg: str, agent_response: str) -> dict:
    result = await llm.generate(
        JUDGE_PROMPT.format(customer_message=customer_msg, agent_response=agent_response),
        temperature=0
    )
    return json.loads(result)
\`\`\`

## CI/CD 통합

\`\`\`yaml
# .github/workflows/prompt-eval.yml
on:
  push:
    paths: ['prompts/**/*.yaml']

jobs:
  eval:
    steps:
      - name: 프롬프트 스키마 검증
        run: python scripts/validate_prompts.py

      - name: 회귀 테스트 (골든 데이터셋)
        run: python scripts/run_evals.py --dataset golden_v3 --threshold 0.82

      - name: A/B 테스트 자동 등록
        if: success()
        run: python scripts/register_ab_test.py --new-version ${{ github.sha }}
\`\`\`

이 3편 시리즈로 프롬프트 엔지니어링의 전 과정 — 기법 습득 → 고급 패턴 → 체계적 운영 — 이 완성됩니다.`,
},

];

async function main() {
  console.log(`\n📝 ${POSTS.length}편 삽입 시작\n`);
  let ok = 0, fail = 0;

  for (const [i, p] of POSTS.entries()) {
    const payload = {
      title: p.title,
      slug: slug(p.title),
      content: p.content,
      excerpt: excerpt(p.content),
      category: p.category,
      tags: p.tags,
      author: p.author,
      agent_role: p.agent_role,
      status: 'published',
      views: 0,
      published_at: p.published_at,
      cover_image: null,
    };

    const { data, error } = await db.from('posts').insert(payload).select('id').single();
    if (error) {
      console.log(`❌ [${i+1}] ${p.title.slice(0,50)} — ${error.message}`);
      fail++;
    } else {
      console.log(`✅ [${i+1}] ID ${data.id} — ${p.title.slice(0,55)}`);
      ok++;
    }
  }

  console.log(`\n완료: 성공 ${ok}, 실패 ${fail}\n`);
}

main().catch(console.error);
