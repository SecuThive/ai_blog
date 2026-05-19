-- RAG 완전 정복 시리즈 (4편)
-- Supabase SQL Editor에 붙여넣고 실행하세요.

INSERT INTO posts (title, slug, content, excerpt, category, tags, status, author, agent_role, published_at) VALUES

(
  'RAG란 무엇인가 — 검색 증강 생성의 핵심 개념',
  'rag-series-01-what-is-rag',
  $BODY$
# RAG란 무엇인가 — 검색 증강 생성의 핵심 개념

LLM(대형 언어 모델)은 놀라운 능력을 갖추고 있지만, 치명적인 약점이 하나 있습니다. 바로 **학습 데이터의 한계**입니다. GPT-4는 2023년까지의 정보만 알고 있고, 사내 문서나 최신 기술 명세는 전혀 모릅니다. RAG(Retrieval-Augmented Generation)는 이 문제를 해결하기 위해 등장한 아키텍처 패턴입니다.

## RAG의 핵심 아이디어

RAG는 세 단계로 동작합니다.

**1. 검색 (Retrieval)**
사용자 질문을 벡터로 변환한 뒤, 문서 데이터베이스에서 의미적으로 가장 유사한 청크(chunk)를 찾아옵니다.

**2. 증강 (Augmentation)**
검색된 문서를 LLM 프롬프트에 컨텍스트로 삽입합니다. "다음 문서를 참고해서 답하시오: [문서 내용]"

**3. 생성 (Generation)**
LLM이 제공된 컨텍스트를 바탕으로 답변을 생성합니다. 모델이 직접 알고 있는 것이 아니라, 제공된 문서를 근거로 답합니다.

```
사용자 질문
    ↓
임베딩 모델 (질문 → 벡터)
    ↓
벡터 DB (유사 문서 검색)
    ↓
프롬프트 구성 (질문 + 검색 결과)
    ↓
LLM (최종 답변 생성)
```

## 왜 파인튜닝 대신 RAG인가?

파인튜닝도 모델에 지식을 주입하는 방법이지만, RAG와는 근본적으로 다릅니다.

| 항목 | 파인튜닝 | RAG |
|------|----------|-----|
| 지식 업데이트 | 재학습 필요 | 문서 DB만 수정 |
| 비용 | 높음 (GPU 필요) | 낮음 |
| 출처 추적 | 불가 | 가능 |
| 최신성 | 학습 시점 고정 | 실시간 반영 |

파인튜닝은 **스타일이나 포맷**을 바꾸는 데 적합하고, RAG는 **지식을 주입**하는 데 적합합니다.

## RAG의 한계도 알아야 한다

RAG가 만능은 아닙니다. 자주 마주치는 실패 케이스를 정리하면 다음과 같습니다.

- **검색 실패**: 관련 문서가 있어도 임베딩 유사도가 낮아 못 찾는 경우
- **컨텍스트 넘침**: 검색 결과가 너무 많아 LLM 컨텍스트 윈도우 초과
- **충돌하는 정보**: 검색된 문서들이 서로 모순된 내용을 담고 있을 때
- **Hallucination 지속**: 컨텍스트가 불충분하면 여전히 환각이 발생

이 시리즈에서는 각 단계별로 이런 문제를 어떻게 해결하는지 상세히 다룹니다.

## 이 시리즈에서 배우는 것

- **EP 02**: 벡터 DB 선택 — Pinecone, Weaviate, pgvector 비교
- **EP 03**: 청킹 전략 — 문서를 어떻게 쪼개야 검색이 잘 되나
- **EP 04**: RAGAS로 RAG 파이프라인 성능 평가하기

RAG는 LLM 애플리케이션의 표준 아키텍처가 되었습니다. 제대로 이해하고 구현할 수 있도록 처음부터 차근차근 따라가 봅시다.
  $BODY$,
  'LLM의 지식 한계를 극복하는 RAG 아키텍처의 핵심 개념을 설명합니다. Retrieval, Augmentation, Generation 세 단계와 파인튜닝과의 차이, 그리고 주요 한계점까지 다룹니다.',
  'AI & 자동화',
  ARRAY['RAG', 'LLM', '벡터DB', '생성AI', 'series:RAG 완전 정복'],
  'published',
  'Content Director',
  'content_director',
  NOW() - INTERVAL '28 days'
),

(
  '벡터 데이터베이스 선택 가이드 — Pinecone vs Weaviate vs pgvector',
  'rag-series-02-vector-db-guide',
  $BODY$
# 벡터 데이터베이스 선택 가이드 — Pinecone vs Weaviate vs pgvector

RAG 파이프라인의 핵심 인프라는 **벡터 데이터베이스**입니다. 텍스트를 수백 차원의 벡터로 변환해 저장하고, 코사인 유사도 기반으로 빠르게 검색합니다. 선택지가 많아 혼란스럽지만, 세 가지 기준으로 정리하면 명확해집니다.

## 주요 벡터 DB 비교

### Pinecone — 완전 관리형 SaaS

```python
import pinecone

pc = pinecone.Pinecone(api_key="YOUR_KEY")
index = pc.Index("my-rag-index")

# 업서트
index.upsert(vectors=[
    {"id": "doc-1", "values": embedding, "metadata": {"text": "...", "source": "..."}}
])

# 검색
results = index.query(vector=query_embedding, top_k=5, include_metadata=True)
```

**장점**: 인프라 관리 불필요, 자동 스케일링, 낮은 지연 시간
**단점**: 비용이 높음, 데이터 외부 전송, 무료 티어 제한

### Weaviate — 오픈소스 + 하이브리드 검색

Weaviate의 차별점은 **하이브리드 검색**입니다. 벡터 유사도와 키워드(BM25) 검색을 동시에 활용합니다.

```python
import weaviate

client = weaviate.connect_to_local()

# 하이브리드 검색
results = client.collections.get("Document").query.hybrid(
    query="RAG 파이프라인 설계",
    alpha=0.5,  # 0=키워드, 1=벡터
    limit=5
)
```

`alpha=0.5`는 벡터와 키워드를 50:50으로 혼합합니다. 고유명사가 많은 도메인에서 특히 효과적입니다.

**장점**: 하이브리드 검색, 자체 호스팅 가능, 멀티테넌시
**단점**: 운영 복잡도, 메모리 사용량

### pgvector — PostgreSQL 확장

이미 PostgreSQL을 쓰고 있다면 `pgvector`가 가장 현실적입니다.

```sql
-- 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 테이블 생성
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)
);

-- 코사인 유사도 검색
SELECT content, 1 - (embedding <=> $1) AS similarity
FROM documents
ORDER BY embedding <=> $1
LIMIT 5;
```

**장점**: 기존 인프라 활용, SQL 그대로, 트랜잭션 보장
**단점**: 수백만 건 이상에서 성능 저하 (HNSW 인덱스로 완화 가능)

## 선택 기준

```
스타트업 / MVP          → pgvector (빠른 시작, 비용 최소)
프로덕션 SaaS          → Pinecone (관리 부담 없음)
온프레미스 / 하이브리드  → Weaviate (자체 호스팅)
이미 PostgreSQL 사용    → pgvector (인프라 통합)
```

## HNSW vs IVFFlat — 인덱스 선택

벡터 DB를 쓸 때 인덱스 알고리즘도 중요합니다.

| 알고리즘 | 검색 속도 | 메모리 | 구축 시간 | 추천 상황 |
|----------|----------|--------|----------|----------|
| HNSW | 빠름 | 높음 | 느림 | 읽기 중심, 고정 데이터 |
| IVFFlat | 중간 | 낮음 | 빠름 | 쓰기 빈번, 대용량 |

pgvector 기준으로 HNSW 인덱스 생성:

```sql
CREATE INDEX ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

다음 편에서는 벡터 DB에 저장할 데이터를 어떻게 준비할지, **청킹 전략**을 상세히 다룹니다.
  $BODY$,
  'Pinecone, Weaviate, pgvector 세 가지 벡터 데이터베이스를 코드와 함께 비교합니다. 프로젝트 규모와 인프라 상황에 따른 선택 기준과 HNSW vs IVFFlat 인덱스 차이까지 정리합니다.',
  'AI & 자동화',
  ARRAY['RAG', '벡터DB', 'Pinecone', 'Weaviate', 'pgvector', 'series:RAG 완전 정복'],
  'published',
  'Content Director',
  'content_director',
  NOW() - INTERVAL '21 days'
),

(
  '청킹 전략의 모든 것 — 문서를 어떻게 쪼갤 것인가',
  'rag-series-03-chunking-strategies',
  $BODY$
# 청킹 전략의 모든 것 — 문서를 어떻게 쪼갤 것인가

RAG 파이프라인에서 가장 과소평가되는 단계가 **청킹(Chunking)**입니다. 청크가 너무 크면 노이즈가 많아 LLM이 핵심을 못 찾고, 너무 작으면 컨텍스트가 부족해 엉뚱한 답변이 나옵니다. 어떻게 쪼개느냐가 RAG 전체 품질을 결정합니다.

## 고정 크기 청킹 (Fixed-size Chunking)

가장 단순한 방법입니다. 지정한 토큰 수마다 자릅니다.

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    separators=["\n\n", "\n", ".", " "]
)

chunks = splitter.split_text(document)
```

`chunk_overlap`은 청크 경계에서 문맥이 끊기는 문제를 완화합니다. 앞 청크의 끝 64토큰을 다음 청크 시작에 포함시킵니다.

**적합한 경우**: 구조가 없는 원시 텍스트, 빠른 프로토타이핑

## 의미 기반 청킹 (Semantic Chunking)

문장 간 의미 변화를 감지해서 자릅니다.

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

chunker = SemanticChunker(
    OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=95
)

chunks = chunker.split_text(long_document)
```

연속된 두 문장의 임베딩 코사인 유사도가 급격히 낮아지는 지점을 경계로 삼습니다. 문단이 자연스럽게 나뉘어 품질이 높지만, 임베딩 API 호출 비용이 발생합니다.

**적합한 경우**: 다양한 주제를 다루는 긴 문서, 품질이 중요한 경우

## 계층적 청킹 (Hierarchical Chunking)

문서의 구조(헤더, 섹션)를 존중하면서 계층적으로 분리합니다.

```python
from langchain.text_splitter import MarkdownHeaderTextSplitter

headers = [
    ("#", "H1"),
    ("##", "H2"),
    ("###", "H3"),
]

splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers)
chunks = splitter.split_text(markdown_doc)

# 각 청크에 메타데이터 포함됨
# chunk.metadata = {"H1": "RAG란 무엇인가", "H2": "핵심 아이디어"}
```

메타데이터에 섹션 정보가 포함되어 검색 정확도가 높아집니다.

**적합한 경우**: Markdown, HTML, PDF처럼 구조가 명확한 문서

## 부모-자식 청킹 (Parent-Child Chunking)

저장은 작은 청크로(검색 정확도 향상), 검색 결과는 큰 청크로 LLM에 전달(컨텍스트 풍부)합니다.

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore

parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=400)

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=InMemoryStore(),
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)
```

벡터 DB에는 400토큰 청크의 임베딩을 저장하고, 실제 반환할 때는 해당 청크가 속한 2000토큰 부모 청크를 가져옵니다.

## 전략별 비교

| 전략 | 구현 난이도 | 품질 | 비용 | 추천 상황 |
|------|------------|------|------|----------|
| 고정 크기 | 낮음 | 보통 | 낮음 | 빠른 MVP |
| 의미 기반 | 중간 | 높음 | 중간 | 품질 우선 |
| 계층적 | 중간 | 높음 | 낮음 | 구조화 문서 |
| 부모-자식 | 높음 | 매우 높음 | 낮음 | 프로덕션 |

## 메타데이터는 필수다

어떤 전략을 쓰든, 청크에 메타데이터를 반드시 붙이세요.

```python
{
    "text": "청크 내용...",
    "source": "docs/api-guide.md",
    "page": 3,
    "section": "인증 방식",
    "created_at": "2024-01-15"
}
```

메타데이터 필터링으로 검색 범위를 좁히면 정확도가 크게 올라갑니다. "2024년 이후 문서에서만 찾기" 같은 조건이 가능해집니다.

다음 편에서는 이렇게 구축한 RAG 파이프라인을 **RAGAS 프레임워크로 정량 평가**하는 방법을 다룹니다.
  $BODY$,
  'RAG 성능을 좌우하는 청킹 전략 4가지를 코드와 함께 비교합니다. 고정 크기, 의미 기반, 계층적, 부모-자식 청킹의 차이와 적합한 사용 상황을 정리합니다.',
  'AI & 자동화',
  ARRAY['RAG', '청킹', 'LangChain', '벡터DB', 'series:RAG 완전 정복'],
  'published',
  'Content Director',
  'content_director',
  NOW() - INTERVAL '14 days'
),

(
  'RAG 평가 프레임워크 — RAGAS로 성능 측정하기',
  'rag-series-04-ragas-evaluation',
  $BODY$
# RAG 평가 프레임워크 — RAGAS로 성능 측정하기

RAG 파이프라인을 구축했다면 다음 질문이 생깁니다. "얼마나 잘 동작하고 있는가?" 인간이 직접 평가하는 건 느리고 비쌉니다. **RAGAS(RAG Assessment)**는 LLM을 심판으로 활용해 RAG 파이프라인을 자동으로 평가하는 프레임워크입니다.

## RAGAS의 4가지 핵심 지표

### 1. Faithfulness (충실성)

생성된 답변이 **검색된 컨텍스트에 얼마나 충실한가**를 측정합니다. 컨텍스트에 없는 내용을 지어내면 점수가 낮아집니다.

```
점수 = (컨텍스트로 뒷받침되는 주장 수) / (답변의 총 주장 수)
```

값이 낮으면 모델이 환각(Hallucination)을 일으키고 있다는 신호입니다.

### 2. Answer Relevancy (답변 관련성)

생성된 답변이 **질문에 얼마나 적절한가**를 측정합니다. 관련 없는 내용이 많으면 점수가 낮습니다.

```
점수 = avg(cosine_similarity(질문, 역생성된 질문들))
```

RAGAS는 답변에서 역으로 질문을 여러 개 생성하고, 원래 질문과의 유사도를 계산합니다.

### 3. Context Precision (컨텍스트 정밀도)

검색된 컨텍스트 중 **실제로 유용한 청크의 비율**입니다. 관련 없는 문서가 많이 검색될수록 낮아집니다.

### 4. Context Recall (컨텍스트 재현율)

정답을 생성하는 데 필요한 정보가 **검색된 컨텍스트에 얼마나 포함되어 있는가**입니다. 정답 데이터셋이 필요합니다.

## 실전 코드

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from datasets import Dataset

# 평가 데이터셋 구성
eval_data = {
    "question": ["RAG와 파인튜닝의 차이는?", "벡터 DB란?"],
    "answer": ["RAG는 검색 기반...", "벡터 DB는..."],
    "contexts": [
        ["RAG는 Retrieval-Augmented...", "파인튜닝은 모델 가중치를..."],
        ["벡터 데이터베이스는 고차원 벡터를..."],
    ],
    "ground_truth": ["RAG는 지식을 외부에서 가져오고...", "벡터 DB는 임베딩을 저장하는..."],
}

dataset = Dataset.from_dict(eval_data)

result = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
)

print(result)
# {'faithfulness': 0.89, 'answer_relevancy': 0.92, 'context_precision': 0.85, 'context_recall': 0.78}
```

## 점수 해석과 개선 방향

| 낮은 지표 | 원인 | 해결책 |
|----------|------|--------|
| Faithfulness | 환각 발생 | 프롬프트에 "컨텍스트만 참고" 강조, temperature 낮춤 |
| Answer Relevancy | 두루뭉술한 답변 | 프롬프트 구체화, 출력 형식 제한 |
| Context Precision | 노이즈 검색 | top_k 줄이기, 유사도 임계값 높이기 |
| Context Recall | 관련 문서 누락 | 청킹 전략 변경, 하이브리드 검색 도입 |

## 평가 데이터셋을 자동으로 생성하기

레이블된 Q&A 데이터가 없어도 RAGAS로 합성 데이터셋을 만들 수 있습니다.

```python
from ragas.testset.generator import TestsetGenerator
from ragas.testset.evolutions import simple, reasoning, multi_context
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

generator = TestsetGenerator.from_langchain(
    generator_llm=ChatOpenAI(model="gpt-4o"),
    critic_llm=ChatOpenAI(model="gpt-4o"),
    embeddings=OpenAIEmbeddings(),
)

testset = generator.generate_with_langchain_docs(
    documents=docs,
    test_size=50,
    distributions={simple: 0.5, reasoning: 0.3, multi_context: 0.2},
)
```

## CI에 평가 통합하기

RAG 파이프라인을 변경할 때마다 자동으로 평가가 돌아가야 합니다.

```yaml
# .github/workflows/rag-eval.yml
- name: RAG Evaluation
  run: python eval/run_ragas.py
- name: Check Thresholds
  run: |
    python -c "
    import json
    r = json.load(open('eval/results.json'))
    assert r['faithfulness'] > 0.85, 'Faithfulness 기준 미달'
    assert r['context_recall'] > 0.75, 'Context Recall 기준 미달'
    "
```

점수가 기준치 아래로 떨어지면 PR을 블로킹할 수 있습니다.

---

이것으로 **RAG 완전 정복** 시리즈를 마칩니다. 개념 이해(EP 01) → 벡터 DB 선택(EP 02) → 청킹 전략(EP 03) → 평가(EP 04) 순서로 따라왔다면, 프로덕션 수준의 RAG 파이프라인을 설계하고 측정할 준비가 된 겁니다.
  $BODY$,
  'RAGAS 프레임워크로 RAG 파이프라인을 자동 평가하는 방법을 설명합니다. Faithfulness, Answer Relevancy, Context Precision, Context Recall 4가지 지표의 의미와 개선 방향, CI 통합까지 다룹니다.',
  'AI & 자동화',
  ARRAY['RAG', 'RAGAS', '평가', 'LLM', 'CI/CD', 'series:RAG 완전 정복'],
  'published',
  'Content Director',
  'content_director',
  NOW() - INTERVAL '7 days'
);
