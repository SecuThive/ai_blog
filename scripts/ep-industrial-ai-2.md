## 산업 데이터의 특수성

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

산업 현장의 네트워크는 불안정합니다. WAN 연결이 끊겨도 데이터가 유실되면 안 됩니다.

```python
import sqlite3

class EdgeBuffer:
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS events ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "payload TEXT NOT NULL,"
            "sent INTEGER DEFAULT 0)"
        )

    def write(self, payload: str):
        self.conn.execute("INSERT INTO events(payload) VALUES(?)", (payload,))
        self.conn.commit()

    def flush(self, producer, batch: int = 1000):
        rows = self.conn.execute(
            "SELECT id, payload FROM events WHERE sent=0 LIMIT ?", (batch,)
        ).fetchall()
        for _, p in rows:
            producer.send("sensor-events", p.encode())
        producer.flush()
        ids = [str(r[0]) for r in rows]
        self.conn.execute(
            f"UPDATE events SET sent=1 WHERE id IN ({','.join(ids)})"
        )
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

-- 자동 압축 (7일 후)
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

## Kafka vs AWS IoT Greengrass

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

3편에서는 이 파이프라인 위에서 실시간으로 동작하는 예측 유지보수 모델 배포와 드리프트 감지를 다룹니다.
