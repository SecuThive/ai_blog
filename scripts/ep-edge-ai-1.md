## 왜 지금 엣지 AI인가

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
tflite_convert \
  --saved_model_dir=./model \
  --output_file=model.tflite \
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

2편에서는 양자화·프루닝으로 모델 크기를 75% 줄이면서 정확도 손실을 1% 미만으로 유지하는 실전 방법을 다룹니다.
