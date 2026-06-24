## 기업 AI의 가장 큰 위협은 외부가 아니다

1편에서 PoC에서 프로덕션으로 가는 아키텍처 청사진을 다뤘습니다. 보안은 청사진이 완성된 후에 생각하는 것이 아니라 설계 단계부터 내재화해야 합니다.

## 기업 AI의 3가지 핵심 보안 위협

### 1. 프롬프트 인젝션 (Prompt Injection)

악의적인 사용자가 시스템 프롬프트를 우회하거나 덮어쓰려는 공격입니다.

```python
class PromptInjectionGuard:
    INJECTION_PATTERNS = [
        "ignore previous instructions",
        "system: you are now",
        "forget everything above",
        "새로운 역할",
        "이전 지시를 무시",
    ]

    def check(self, user_input: str) -> bool:
        lower = user_input.lower()
        for pattern in self.INJECTION_PATTERNS:
            if pattern in lower:
                return False  # 차단
        return True

    def sanitize(self, user_input: str) -> str:
        # 사용자 입력을 명시적으로 구분
        return f"[USER INPUT START]\n{user_input}\n[USER INPUT END]"
```

### 2. 데이터 유출 (Data Exfiltration)

모델이 학습 데이터나 시스템 프롬프트의 민감 정보를 노출하는 위험입니다.

```python
import re

class OutputFilter:
    PII_PATTERNS = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "phone": r'\b\d{2,3}[-.]?\d{3,4}[-.]?\d{4}\b',
        "ssn": r'\b\d{6}[-]?\d{7}\b',
        "card": r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b',
    }

    def filter(self, text: str) -> str:
        for pii_type, pattern in self.PII_PATTERNS.items():
            text = re.sub(pattern, f"[{pii_type.upper()} REDACTED]", text)
        return text
```

## 데이터 분류와 AI 파이프라인 분리

```python
from enum import Enum

class DataClassification(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

class AIGateway:
    """데이터 분류에 따라 사용 가능한 모델 제한"""

    MODEL_PERMISSIONS = {
        DataClassification.PUBLIC: ["claude-sonnet-4-6", "gpt-4o"],
        DataClassification.INTERNAL: ["claude-sonnet-4-6"],          # 외부 모델 불가
        DataClassification.CONFIDENTIAL: ["private-llm-on-prem"],    # 온프레미스만
        DataClassification.RESTRICTED: [],                             # AI 사용 불가
    }

    def allowed_models(self, classification: DataClassification) -> list:
        return self.MODEL_PERMISSIONS.get(classification, [])

    async def query(self, prompt: str, classification: DataClassification) -> str:
        models = self.allowed_models(classification)
        if not models:
            raise PermissionError(f"{classification.value} 데이터는 AI 처리 불가")
        return await llm_call(models[0], prompt)
```

## LLM 게이트웨이 아키텍처

```
사용자 요청
    ↓
[입력 필터]
  - 프롬프트 인젝션 탐지
  - PII 감지 및 마스킹
  - 토큰 한도 확인
    ↓
[인증/인가]
  - JWT 검증
  - RBAC 권한 확인
  - 데이터 분류 결정
    ↓
[LLM 호출]
  - 허용된 모델만 사용
  - 감사 로그 기록
    ↓
[출력 필터]
  - PII 재검사
  - 유해 콘텐츠 필터
  - 응답 로깅
    ↓
사용자 응답
```

## 모델 접근 제어 (RBAC)

```python
from functools import wraps

ROLE_MODEL_ACCESS = {
    "viewer": ["claude-haiku-4-5"],
    "editor": ["claude-haiku-4-5", "claude-sonnet-4-6"],
    "admin": ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"],
}

def require_model_access(model: str):
    def decorator(fn):
        @wraps(fn)
        async def wrapper(user_role: str, *args, **kwargs):
            allowed = ROLE_MODEL_ACCESS.get(user_role, [])
            if model not in allowed:
                raise PermissionError(f"{user_role}는 {model} 사용 불가")
            return await fn(*args, **kwargs)
        return wrapper
    return decorator

@require_model_access("claude-opus-4-7")
async def complex_analysis(text: str) -> str:
    return await llm_call("claude-opus-4-7", text)
```

## GDPR/CCPA 대응 체크리스트

| 요구사항 | 구현 방법 |
|---------|----------|
| 데이터 최소화 | 필요한 컨텍스트만 LLM에 전달 |
| 삭제 권리 | 벡터 DB에서 개인 데이터 삭제 API |
| 처리 목적 명시 | AI 사용 동의 팝업 + 로그 |
| 국외 이전 제한 | 온프레미스 또는 국내 리전 전용 |
| 감사 추적 | 모든 LLM 호출 로그 2년 보존 |

3편에서는 모델 라이프사이클 관리와 규제 준수 자동화를 포함한 AI 거버넌스 체계를 다룹니다.
