## RAG를 넘어: 파인튜닝이 필요한 순간

1편에서 RAG로 신뢰도 높은 사내 챗봇을 만드는 방법을 다뤘습니다. RAG는 빠르고 유연하지만, 모델이 특정 도메인의 언어 스타일과 패턴을 깊이 내면화해야 할 때는 파인튜닝이 답입니다.

## RAG vs 파인튜닝: 선택 기준

| 상황 | 추천 방법 |
|------|----------|
| 최신 정보 지속 업데이트 | RAG |
| 특정 도메인 전문 용어 습득 | 파인튜닝 |
| 응답 형식/스타일 일관성 | 파인튜닝 |
| 빠른 프로토타이핑 | RAG |
| 추론 비용 최소화 | 파인튜닝 + 경량 모델 |

## LoRA: 효율적인 파인튜닝의 핵심

LoRA(Low-Rank Adaptation)는 원본 가중치를 고정하고 저차원 분해 행렬만 학습합니다. 파라미터 수를 100배 이상 줄이면서 성능은 풀 파인튜닝에 근접합니다.

```python
from peft import LoraConfig, get_peft_model, TaskType

lora_config = LoraConfig(
    r=16,               # 랭크: 낮을수록 빠름·작음, 높을수록 표현력 강함
    lora_alpha=32,      # 스케일링 팩터 (보통 r의 2배)
    target_modules=["q_proj", "v_proj"],  # 어텐션 레이어만 학습
    lora_dropout=0.1,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3-8B")
peft_model = get_peft_model(model, lora_config)
peft_model.print_trainable_parameters()
# trainable params: 4,194,304 || all params: 8,030,261,248 || 0.052%
```

## QLoRA: 소비자 GPU에서 파인튜닝하기

QLoRA는 4-bit 양자화 + LoRA를 결합해 24GB VRAM으로 70B 모델을 파인튜닝할 수 있게 합니다.

```python
from transformers import BitsAndBytesConfig
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",       # NormalFloat4: 가장 정확한 4bit 타입
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,  # 양자화 상수도 양자화
)

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    quantization_config=bnb_config,
    device_map="auto",
)
```

## 데이터셋 준비: 품질이 양보다 중요

파인튜닝에서 가장 중요한 것은 데이터 품질입니다.

```python
# 고품질 instruction-response 쌍 형식
dataset_example = {
    "instruction": "다음 고객 문의에 공감하며 간결하게 답변하세요.",
    "input": "주문한 지 이틀이 지났는데 배송 추적이 안 됩니다.",
    "output": "불편을 드려 죄송합니다. 배송사에 직접 확인해보니 물류센터에서 처리 중입니다. 오늘 중으로 출고 예정이며, 출고 시 문자로 안내해드리겠습니다."
}

# 데이터 정제 체크리스트
checklist = [
    "100~500자 사이의 적절한 응답 길이",
    "일관된 어조와 문체",
    "도메인 전문 용어 정확 사용",
    "개인정보 제거 완료",
    "사람 검수 통과",
]
```

**데이터 수량 가이드:**
- 스타일 미세 조정: 100~500개
- 도메인 특화: 1,000~5,000개
- 새로운 태스크 학습: 10,000개 이상

## 학습 설정

```python
from transformers import TrainingArguments
from trl import SFTTrainer

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,  # effective batch = 16
    warmup_ratio=0.03,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    save_strategy="epoch",
    evaluation_strategy="epoch",
    load_best_model_at_end=True,
)

trainer = SFTTrainer(
    model=peft_model,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    args=training_args,
    dataset_text_field="text",
    max_seq_length=2048,
)
trainer.train()
```

## 학습 후 평가

```python
# BLEU, ROUGE만으론 부족 — LLM 평가 추가
from evaluate import load

rouge = load("rouge")
scores = rouge.compute(predictions=model_outputs, references=reference_outputs)
print(f"ROUGE-L: {scores['rougeL']:.3f}")

# 도메인 특화 평가 (예: 법률 용어 정확도)
def domain_accuracy(outputs, references, domain_terms):
    hits = sum(any(t in o for t in domain_terms) for o in outputs)
    return hits / len(outputs)
```

3편에서는 여러 LLM을 라우팅·앙상블해 정확도와 비용을 동시에 최적화하는 전략을 다룹니다.
