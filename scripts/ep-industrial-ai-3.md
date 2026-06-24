## 제조 AI의 운영 요구사항

컨베이어 벨트는 AI 응답을 기다리지 않습니다. 제조 현장 AI는 < 50ms 추론, 오프라인 동작, 드리프트 감지 세 가지가 필수입니다.

## 저지연 추론 달성

```python
import onnxruntime as ort
import numpy as np
import time

class FastInference:
    def __init__(self, model_path: str):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 4
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        self.sess = ort.InferenceSession(model_path, sess_options=opts)
        self.inp = self.sess.get_inputs()[0].name
        # 웜업: 첫 추론은 JIT 컴파일로 느림
        dummy = np.zeros((1, 128), dtype=np.float32)
        for _ in range(10):
            self.sess.run(None, {self.inp: dummy})

    def predict(self, features: np.ndarray) -> dict:
        t0 = time.perf_counter()
        out = self.sess.run(None, {self.inp: features})
        return {
            "value": float(out[0][0]),
            "latency_ms": (time.perf_counter() - t0) * 1000
        }
```

## 배치 처리로 처리량 향상

단일 추론보다 배치 추론이 처리량을 10~20배 높입니다.

```python
import asyncio
from collections import deque

class BatchInference:
    def __init__(self, model, batch_size=32, max_wait_ms=10):
        self.model = model
        self.batch_size = batch_size
        self.max_wait = max_wait_ms / 1000
        self.queue = deque()
        asyncio.create_task(self._loop())

    async def predict(self, features):
        fut = asyncio.Future()
        self.queue.append((features, fut))
        return await fut

    async def _loop(self):
        while True:
            await asyncio.sleep(self.max_wait)
            if not self.queue:
                continue
            batch, futs = [], []
            while self.queue and len(batch) < self.batch_size:
                f, fut = self.queue.popleft()
                batch.append(f)
                futs.append(fut)
            results = self.model.predict_batch(np.stack(batch))
            for fut, res in zip(futs, results):
                fut.set_result(res)
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

## 모델 드리프트 감지

생산 환경이 변하면(계절, 원자재, 설비 노화) 모델 성능이 저하됩니다.

```python
from scipy.stats import ks_2samp

class DriftDetector:
    def __init__(self, reference: np.ndarray, threshold: float = 0.05):
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

이 3편 시리즈로 산업 현장 AI 통합의 전 과정(게이트웨이→파이프라인→모델 운영)이 완성됩니다.
