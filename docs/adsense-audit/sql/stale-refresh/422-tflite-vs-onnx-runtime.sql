-- stale-refresh 2026-10-04 post #422 엣지-ai-추론-엔진-완전-비교-tflite-vs-onnx-runtime-우리-프로젝트에-맞는-선택은
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$# 엣지 AI 추론 엔진 완전 비교: TFLite vs. ONNX Runtime, 우리 프로젝트에 맞는 선택은?

"모델 학습은 쉬운데, 엣지 배포가 어렵다."

혹시 이런 경험을 해보셨나요? Colab이나 로컬 GPU 환경에서는 모델이 완벽하게 작동하는데, 막상 실제 IoT 기기나 모바일 앱에 배포하려니 속도가 느리거나, 메모리 부족으로 크래시가 나거나, 혹은 특정 하드웨어에서 아예 구동조차 안 되는 상황.

머신러닝 엔지니어라면 누구나 한 번쯤 부딪히는 이 벽을 우리는 **'엣지 AI 배포의 어려움'**이라고 부릅니다.

클라우드 기반의 대규모 컴퓨팅 자원을 사용하는 것이 가장 쉽지만, 네트워크 지연(Latency)과 비용 문제 때문에 실시간성이 중요한 엣지 환경에서는 근본적인 대안이 필요합니다. 이 대안의 핵심에 바로 **'추론 엔진(Inference Engine)'**이 있습니다.

## 💡 추론 엔진, 정확히 무엇을 하는 건가요?

모델 학습(Training)은 방대한 데이터와 GPU 자원을 이용해 모델의 가중치(Weight)를 최적화하는 과정입니다. 반면, **추론(Inference)**은 이미 학습이 완료된 모델을 가져와, 새로운 입력 데이터에 대해 예측(Prediction)을 수행하는 과정입니다.

추론 엔진은 이 '예측' 과정을 **특정 하드웨어(CPU, GPU, NPU 등) 위에서 가장 빠르고 효율적으로 구동**할 수 있도록 도와주는 소프트웨어 프레임워크입니다. 단순히 모델 파일을 돌리는 것을 넘어, 하드웨어의 특성을 최대한 끌어내어 전력 효율과 속도를 극대화하는 것이 목표입니다.

이 글에서는 현업에서 가장 많이 사용되는 두 거장, **TensorFlow Lite(TFLite)**와 **ONNX Runtime**을 중심으로, 어떤 상황에서 어떤 엔진을 선택해야 할지 명쾌한 가이드라인을 제시해 드리겠습니다.

---

## 🚀 본론 1: 주요 엣지 추론 엔진 심층 분석 (The Players)

엣지 환경을 위한 추론 엔진들은 각기 다른 철학과 강점을 가지고 태어났습니다. 마치 자동차 브랜드마다 주력하는 엔진이 다른 것과 같습니다.

### 🥇 TensorFlow Lite (TFLite): 모바일 생태계의 최적화 끝판왕

TFLite는 Google에서 개발되었으며, 이름에서 알 수 있듯이 **모바일(Android) 및 임베디드 환경에 최적화**되어 있습니다. 현재 TensorFlow Lite는 **LiteRT**라는 이름으로 이어지고 있습니다. 기존 TFLite 패키지도 계속 동작하지만 새 기능과 성능 개선은 LiteRT에만 들어가고, 패키지 이름만 바꾸면 옮겨 갈 수 있습니다([LiteRT 이전 가이드](https://ai.google.dev/edge/litert/migration)). 모델 형식은 그대로 `.tflite`입니다.

*   **강점:** Android NDK, iOS CoreML과의 통합성이 매우 높습니다. 모바일 기기의 아키텍처와 메모리 제약 사항을 깊이 이해하고 최적화되어 배포가 비교적 직관적입니다.
*   **사용 사례:** 안드로이드 기반의 스마트폰 카메라 필터, 오프라인 구동이 필수적인 모바일 AR/AI 기능.
*   **장점:** 방대한 생태계와 커뮤니티 지원, 모바일 플랫폼에 대한 깊은 최적화.
*   **단점:** TensorFlow 생태계에 종속적이라는 인식이 강합니다. 다만 LiteRT는 PyTorch 모델을 `.tflite`로 직접 변환하는 경로를 제공하므로([PyTorch 변환 문서](https://ai.google.dev/edge/litert/conversion/pytorch/overview)), ONNX를 거치지 않아도 되는 경우가 많습니다.

### 🥈 ONNX Runtime: 프레임워크 독립성을 추구하는 범용 엔진

ONNX(Open Neural Network Exchange)는 다양한 딥러닝 프레임워크(PyTorch, TensorFlow 등)가 모델 구조를 교환할 수 있게 만든 **표준 포맷**입니다. ONNX Runtime은 이 표준 포맷을 기반으로 추론을 수행하는 엔진입니다.

*   **강점:** **프레임워크 독립성(Framework Agnostic)**이 최대 무기입니다. PyTorch로 학습했든, Keras로 학습했든, 일단 ONNX로 변환만 되면 ONNX Runtime으로 돌릴 수 있습니다.
*   **사용 사례:** 여러 팀이 각기 다른 프레임워크로 모델을 개발하여, 하나의 공통된 엣지 디바이스에 통합해야 할 때.
*   **장점:** 뛰어난 범용성, 다양한 백엔드(CPU, CUDA, DirectML 등) 지원을 통한 유연한 성능 확보.
*   **단점:** TFLite처럼 특정 플랫폼(예: Android)에 깊숙이 최적화되어 있지 않아, 플랫폼별 튜닝이 추가적으로 필요할 수 있습니다.

### 🥉 (참고) 하드웨어 특화 엔진: OpenVINO, CoreML

비교의 폭을 넓히자면, 특정 하드웨어에 특화된 엔진들이 존재합니다.

*   **OpenVINO (Intel):** 인텔 CPU, iGPU, VPU 등 인텔 계열 하드웨어에 극도로 최적화되어 있습니다. 인텔 기반 엣지 디바이스를 사용한다면 최고의 선택지 중 하나입니다.
*   **CoreML (Apple):** Apple 기기(iOS/macOS)에 최적화된 네이티브 프레임워크입니다. Apple 생태계 내에서는 TFLite보다 더 깊은 최적화를 제공할 수 있습니다.

---

## 📊 본론 2: 엔진 선택의 핵심 기준과 비교 매트릭스

엔진을 고를 때 가장 중요한 것은 '어떤 것이 가장 빠르냐'가 아닙니다. **'내 프로젝트의 제약 조건(Constraint)'에 가장 잘 맞는가**가 핵심입니다.

### 1. 성능 vs. 호환성 vs. 사용 편의성 (The Trade-off Triangle)

| 기준 | TFLite | ONNX Runtime | OpenVINO (예시) |
| :--- | :--- | :--- | :--- |
| **주요 강점** | 모바일/Android 최적화, 배포 용이성 | 프레임워크 독립성, 범용성 | 특정 하드웨어(Intel) 최고 성능 |
| **추론 속도** | 매우 빠름 (모바일 환경에서) | 빠름 (백엔드에 따라 다름) | 매우 빠름 (타겟 하드웨어에 종속적) |
| **메모리 사용량** | 매우 효율적 (경량화에 강점) | 중간 수준 (유연성이 비용을 지불) | 효율적 (하드웨어 가속에 의존) |
| **모델 크기** | 작게 유지하는 데 강점 | 중간 크기 (표준 포맷 유지) | 하드웨어에 따라 최적화됨 |
| **호환성** | TensorFlow 중심 | **최고** (다양한 프레임워크 지원) | 특정 벤더에 국한됨 |

### 2. 🔄 워크플로우 비교: 모델 변환의 흐름

대부분의 엔지니어는 PyTorch나 TensorFlow로 모델을 학습시킵니다. 이 모델을 엣지 디바이스가 이해할 수 있는 형태로 변환하는 과정이 필수적입니다.

**[PyTorch $\rightarrow$ ONNX $\rightarrow$ TFLite] 변환 개념 흐름**

1.  **학습 (PyTorch/TF):** 개발자가 PyTorch로 모델을 학습시킵니다.
2.  **표준화 (ONNX):** 모델을 `torch.onnx.export()` 등을 이용해 **ONNX 포맷**으로 변환합니다. 이 단계에서 프레임워크 종속성을 제거합니다.
3.  **최적화/배포 (TFLite):** ONNX 모델을 다시 TFLite 포맷으로 변환하거나, ONNX Runtime을 통해 직접 배포합니다.

### 💡 핵심 기술: 모델 양자화 (Quantization)

어떤 엔진을 쓰든, 가장 중요한 최적화는 **모델 양자화([Quantization](/blog/엣지-llm-구동의-핵심-모델-경량화quantization-pruning-심층-가이드))**입니다. 모델의 가중치를 32비트 부동소수점(FP32) 대신 8비트 정수(INT8)로 낮추면 모델 크기가 약 1/4로 줄어듭니다. [LiteRT 문서](https://ai.google.dev/edge/litert/models/post_training_quantization)는 전체 정수 양자화의 효과를 "4배 작아지고 3배 이상 빨라짐(CPU·Edge TPU·마이크로컨트롤러)"으로 안내하지만, 실제 속도 향상은 기기와 모델에 따라 다르니 대상 기기에서 직접 재 보세요.

---

## 🎯 결론: 어떤 것을 선택해야 할까?

| 시나리오 | 추천 엔진/전략 | 이유 |
| :--- | :--- | :--- |
| **모바일 앱 배포 (iOS/Android)** | **TFLite (TensorFlow Lite)** | 모바일 환경에 최적화된 런타임워크를 제공하며, 양자화 지원이 강력합니다. |
| **다양한 백엔드 지원 필요** | **ONNX Runtime** | ONNX는 산업 표준 포맷이므로, 여러 프레임워크의 모델을 통일된 방식으로 실행하기 가장 좋습니다. |
| **특정 하드웨어 가속기 사용** | **TensorRT (NVIDIA)** | NVIDIA GPU를 사용하는 경우, TensorRT가 최고의 성능을 뽑아낼 수 있도록 최적화해줍니다. |
| **연구/PoC 단계에서 범용성 중시** | **ONNX Runtime** | 가장 적은 제약 조건 하에서 여러 모델을 테스트해보기 좋습니다. |

**요약:** 만약 모바일 앱에 넣을 것이라면 **TFLite**를, 여러 환경에서 범용적으로 돌리고 싶다면 **ONNX Runtime**을, 최고 성능의 GPU 추론이 목표라면 **TensorRT**를 고려하세요.

## 배포 단계별 문제 해결 분기표

엣지 배포는 '변환 → 로드 → 추론 → 최적화' 각 단계에서 다른 이유로 실패합니다.

| 단계 | 증상 | 확인·조치 |
|---|---|---|
| 모델 변환 | 연산자(op) 미지원 오류 | 지원 op 목록 대조 → 모델에서 해당 레이어 교체 또는 커스텀 op 등록. ONNX는 opset 버전 하향도 시도 |
| 로드 | 기기에서 로드 실패·크래시 | 런타임 버전과 변환 시 버전 일치 확인, 메모리 상한(모바일은 수백 MB 단위) 점검 |
| 추론 | 결과가 학습 환경과 다름 | 양자화 전후 출력 비교 — INT8 양자화로 정확도가 하락했다면 대표 데이터셋으로 캘리브레이션 재수행 |
| 성능 | 속도가 기대보다 느림 | 델리게이트/EP 활성화 확인 (LiteRT/TFLite: GPU delegate 또는 LiteRT의 하드웨어 가속 설정, ONNX RT: 해당 하드웨어 Execution Provider) — 미활성 시 CPU 폴백으로 조용히 느려짐. NNAPI는 Android 15에서 지원 중단되었으므로 새로 쓰지 않습니다([NNAPI 문서](https://developer.android.com/ndk/guides/neuralnetworks)) |

**가장 흔한 함정**: 하드웨어 가속이 실패해도 오류 없이 CPU로 폴백되어 "되긴 되는데 느린" 상태가 되는 것입니다. 배포 후 반드시 실제 기기에서 지연 시간을 측정해 가속 적용 여부를 검증하세요.

## 출처 · 확인일 2026-10-04
- [Google AI Edge, TensorFlow Lite에서 LiteRT로 이전](https://ai.google.dev/edge/litert/migration) — TensorFlow Lite는 이제 LiteRT, 새 기능은 LiteRT에만 추가
- [Google AI Edge, PyTorch 모델 변환](https://ai.google.dev/edge/litert/conversion/pytorch/overview) — PyTorch 모델을 .tflite로 변환
- [Google AI Edge, 학습 후 양자화](https://ai.google.dev/edge/litert/models/post_training_quantization) — 전체 정수 양자화: 4배 작아짐, 3배 이상 빨라짐 / 동적 범위 양자화: 4배 작아짐, 2~3배 빨라짐
- [Android Developers, Neural Networks API](https://developer.android.com/ndk/guides/neuralnetworks) — NNAPI는 Android 15에서 지원 중단$sr$, content_evidence=jsonb_set($j${"en": {"title": "Edge AI Inference Engines Compared: TFLite vs ONNX Runtime and How to Choose for Your Project", "content": "# Complete Comparison of Edge AI Inference Engines: TFLite vs. ONNX Runtime — Which One Fits Your Project?\n\n\"Training the model is easy. Deploying it to the edge is hard.\"\n\nHave you been there? The model runs perfectly in Colab or on a local GPU, but the moment you try to ship it to a real IoT device or a mobile app, it crawls, crashes from out-of-memory, or simply refuses to run on the target hardware.\n\nIf you're a machine learning engineer, you've probably hit this wall at least once. We call it **the difficulty of edge AI deployment**.\n\nUsing massive cloud compute is the easy path, but latency and cost make it a non-starter when real-time performance matters at the edge. The core of the alternative is the **inference engine**.\n\n## 💡 What Does an Inference Engine Actually Do?\n\nTraining is the process of optimizing a model's weights using large datasets and GPU resources. **Inference**, by contrast, takes a trained model and produces predictions on new input data.\n\nAn inference engine is the software framework that runs that prediction step **as fast and efficiently as possible on specific hardware (CPU, GPU, NPU, and so on)**. It goes beyond simply executing a model file: the goal is to squeeze the most out of the hardware's characteristics to maximize power efficiency and speed.\n\nThis post focuses on the two workhorses used most in production — **TensorFlow Lite (TFLite)** and **ONNX Runtime** — and gives you a clear guideline for which engine to pick in which situation.\n\n---\n\n## 🚀 Part 1: Deep Dive into the Major Edge Inference Engines (The Players)\n\nInference engines for the edge were born with different philosophies and strengths — much like car brands that each specialize in a different kind of engine.\n\n### 🥇 TensorFlow Lite (TFLite): The Ultimate Optimizer for the Mobile Ecosystem\n\nTFLite was developed by Google and, as the name suggests, is **optimized for mobile (Android) and embedded environments**. TensorFlow Lite now continues as **LiteRT**. Existing TFLite packages keep working, but all new features and performance work go to LiteRT, and migrating only requires a package name change ([LiteRT migration guide](https://ai.google.dev/edge/litert/migration)). The model format is still `.tflite`.\n\n*   **Strengths:** Very high integration with the Android NDK and iOS CoreML. It deeply understands mobile device architectures and memory constraints, so deployment is relatively straightforward.\n*   **Use cases:** Android smartphone camera filters; mobile AR/AI features that must run fully offline.\n*   **Pros:** Massive ecosystem and community support; deep optimization for mobile platforms.\n*   **Cons:** Strongly associated with (and perceived as locked to) the TensorFlow ecosystem. That said, LiteRT offers a direct path from PyTorch to `.tflite` ([PyTorch conversion docs](https://ai.google.dev/edge/litert/conversion/pytorch/overview)), so you often do not need to go through ONNX.\n\n### 🥈 ONNX Runtime: The General-Purpose Engine That Chases Framework Independence\n\nONNX (Open Neural Network Exchange) is a **standard format** that lets different deep learning frameworks (PyTorch, TensorFlow, and others) exchange model structures. ONNX Runtime is the engine that runs inference on that standard format.\n\n*   **Strengths:** **Framework independence (framework-agnostic)** is its biggest weapon. Whether you trained in PyTorch or Keras, once the model is converted to ONNX you can run it with ONNX Runtime.\n*   **Use cases:** When multiple teams develop models in different frameworks and need to unify them onto a single shared edge device.\n*   **Pros:** Excellent generality; flexible performance via support for many backends (CPU, CUDA, DirectML, and more).\n*   **Cons:** Not as deeply optimized for a specific platform (e.g., Android) as TFLite, so you may need extra per-platform tuning.\n\n### 🥉 (For reference) Hardware-specific engines: OpenVINO, CoreML\n\nTo widen the comparison, there are engines specialized for particular hardware.\n\n*   **OpenVINO (Intel):** Extremely optimized for Intel-family hardware such as Intel CPUs, iGPUs, and VPUs. If you are using Intel-based edge devices, it is one of the best options.\n*   **CoreML (Apple):** A native framework optimized for Apple devices (iOS/macOS). Inside the Apple ecosystem it can provide deeper optimization than TFLite.\n\n---\n\n## 📊 Part 2: Core Selection Criteria and Comparison Matrix\n\nWhen choosing an engine, the most important question is not \"which one is fastest.\" The key is **which one best fits your project's constraints**.\n\n### 1. Performance vs. Compatibility vs. Ease of Use (The Trade-off Triangle)\n\n| Criterion | TFLite | ONNX Runtime | OpenVINO (example) |\n| :--- | :--- | :--- | :--- |\n| **Primary strength** | Mobile/Android optimization, easy deployment | Framework independence, generality | Peak performance on specific hardware (Intel) |\n| **Inference speed** | Very fast (on mobile) | Fast (depends on backend) | Very fast (tied to the target hardware) |\n| **Memory usage** | Very efficient (strong at lightweighting) | Medium (you pay for flexibility) | Efficient (relies on hardware acceleration) |\n| **Model size** | Strong at keeping models small | Medium (preserves the standard format) | Optimized depending on hardware |\n| **Compatibility** | TensorFlow-centric | **Best** (supports many frameworks) | Limited to a specific vendor |\n\n### 2. 🔄 Workflow Comparison: The Model Conversion Flow\n\nMost engineers train models in PyTorch or TensorFlow. Converting those models into a form the edge device can understand is mandatory.\n\n**[PyTorch $\\rightarrow$ ONNX $\\rightarrow$ TFLite] Conceptual conversion flow**\n\n1.  **Training (PyTorch/TF):** The developer trains the model in PyTorch.\n2.  **Standardization (ONNX):** Convert the model to **ONNX format** using `torch.onnx.export()` or similar. This step removes framework lock-in.\n3.  **Optimization/deployment (TFLite):** Convert the ONNX model again to TFLite format, or deploy it directly via ONNX Runtime.\n\n### 💡 Key Technique: Model Quantization\n\nNo matter which engine you use, the most important optimization is **model quantization ([Quantization](/blog/엣지-llm-구동의-핵심-모델-경량화quantization-pruning-심층-가이드))**. Lowering model weights from 32-bit floating point (FP32) to 8-bit integers (INT8) cuts model size to about 1/4. The [LiteRT docs](https://ai.google.dev/edge/litert/models/post_training_quantization) describe full integer quantization as \"4x smaller, 3x+ speedup\" (CPU, Edge TPU, microcontrollers), but real speedups depend on the device and model, so measure on your target device.\n\n---\n\n## 🎯 Conclusion: Which One Should You Choose?\n\n| Scenario | Recommended engine/strategy | Why |\n| :--- | :--- | :--- |\n| **Mobile app deployment (iOS/Android)** | **TFLite (TensorFlow Lite)** | Provides a runtime optimized for mobile, with strong quantization support. |\n| **Need support for diverse backends** | **ONNX Runtime** | ONNX is an industry-standard format, so it is the best way to run models from multiple frameworks in a unified manner. |\n| **Using a specific hardware accelerator** | **TensorRT (NVIDIA)** | If you are using NVIDIA GPUs, TensorRT is optimized to extract peak performance. |\n| **Research/PoC stage where generality matters** | **ONNX Runtime** | Best for testing many models under the fewest constraints. |\n\n**In short:** If you are putting the model in a mobile app, go with **TFLite**. If you want to run it generally across many environments, go with **ONNX Runtime**. If peak GPU inference performance is the goal, consider **TensorRT**.\n\n## Troubleshooting Decision Table by Deployment Stage\n\nEdge deployment fails for different reasons at each stage: convert → load → infer → optimize.\n\n| Stage | Symptom | Check / action |\n|---|---|---|\n| Model conversion | Unsupported operator (op) error | Compare against the supported-op list → replace the layer in the model or register a custom op. For ONNX, also try lowering the opset version |\n| Load | Load failure or crash on device | Confirm runtime version matches the version used at conversion; check memory ceiling (on mobile, typically hundreds of MB) |\n| Inference | Results differ from the training environment | Compare outputs before and after quantization — if INT8 quantization dropped accuracy, re-run calibration with a representative dataset |\n| Performance | Slower than expected | Confirm delegates/EPs are enabled (LiteRT/TFLite: GPU delegate or LiteRT hardware acceleration settings; ONNX RT: the matching hardware Execution Provider) — if inactive, it silently falls back to CPU and gets slow. NNAPI was deprecated in Android 15, so do not adopt it for new work ([NNAPI docs](https://developer.android.com/ndk/guides/neuralnetworks)) |\n\n**The most common trap:** Hardware acceleration fails silently and falls back to CPU, so it \"works, but it's slow.\" After deployment, always measure latency on the real device and verify that acceleration is actually applied.\n\n## Sources · checked 2026-10-04\n- [Google AI Edge, Migrating from TensorFlow Lite](https://ai.google.dev/edge/litert/migration) — TensorFlow Lite is now LiteRT; new features land only in LiteRT\n- [Google AI Edge, Convert PyTorch models](https://ai.google.dev/edge/litert/conversion/pytorch/overview) — PyTorch to .tflite conversion\n- [Google AI Edge, Post-training quantization](https://ai.google.dev/edge/litert/models/post_training_quantization) — full integer: 4x smaller, 3x+ speedup; dynamic range: 4x smaller, 2x–3x speedup\n- [Android Developers, Neural Networks API](https://developer.android.com/ndk/guides/neuralnetworks) — NNAPI deprecated in Android 15", "excerpt": "A practical guide to choosing the inference engine — the most important decision when deploying AI models to edge devices. We compare the strengths, weaknesses, and performance of TFLite, ONNX Runtime, and related engines, and give clear, scenario-based selection criteria."}, "verifiedAt": "2026-10-04", "changeSummary": "TensorFlow Lite가 LiteRT로 이름을 바꾸고 새 기능은 LiteRT에만 추가된다는 점, PyTorch 모델의 .tflite 직접 변환 지원, Android 15에서 NNAPI 지원 중단을 공식 문서 기준으로 반영. 양자화 효과는 LiteRT 문서 수치로 교체. 출처·확인일 추가.", "officialSources": ["https://ai.google.dev/edge/litert/migration", "https://ai.google.dev/edge/litert/conversion/pytorch/overview", "https://ai.google.dev/edge/litert/models/post_training_quantization", "https://developer.android.com/ndk/guides/neuralnetworks"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=422 AND md5(content)='5ed8a70c0ad4b4f2722e723923999b72' AND md5(content_evidence::text)='cebfacefdf6ecfdfc2aa35070cce01ac' AND md5(coalesce(array_to_string(tags,'|'),''))='c61994748a6048ee88b5756fd21a3683';
COMMIT;
