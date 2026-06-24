## 벡터 DB를 느리게 만드는 진짜 원인

1편에서 임베딩 생성과 기본 검색을 다뤘습니다. 실서비스 규모로 가면 정확도와 속도가 함께 무너지는 지점이 있습니다. 인덱스 전략과 하이브리드 검색이 그 해결책입니다.

## 인덱스 알고리즘 비교

벡터 검색의 성능은 인덱스 알고리즘 선택에서 90% 결정됩니다.

| 알고리즘 | 검색 속도 | 정확도 | 메모리 | 적합한 규모 |
|---------|---------|--------|--------|-----------|
| Flat (브루트포스) | 느림 | 100% | 낮음 | ~10만 건 |
| IVF | 빠름 | 95~98% | 중간 | 10만~1000만 |
| HNSW | 매우 빠름 | 97~99% | 높음 | 모든 규모 |
| ScaNN | 매우 빠름 | 97~99% | 낮음 | 1억 건 이상 |

### HNSW 파라미터 튜닝

```python
import hnswlib
import numpy as np

def build_hnsw_index(vectors: np.ndarray, dim: int) -> hnswlib.Index:
    index = hnswlib.Index(space="cosine", dim=dim)

    index.init_index(
        max_elements=len(vectors),
        ef_construction=200,  # 높을수록 정확, 느린 인덱싱 (권장: 100~400)
        M=16,                 # 연결 수. 높을수록 정확, 많은 메모리 (권장: 8~48)
    )
    index.add_items(vectors)

    # 검색 시 ef: 높을수록 정확, 느린 쿼리 (권장: ef_construction 이상)
    index.set_ef(50)
    return index

# 정확도 vs 속도 트레이드오프 측정
def benchmark(index, queries, ground_truth, ef_values):
    for ef in ef_values:
        index.set_ef(ef)
        labels, _ = index.knn_query(queries, k=10)
        recall = compute_recall(labels, ground_truth)
        print(f"ef={ef:3d} → recall={recall:.3f}")
```

## 하이브리드 검색: 의미 + 키워드

순수 벡터 검색은 정확한 키워드·코드·고유명사에 취약합니다. BM25와 결합하면 상호보완됩니다.

```python
from rank_bm25 import BM25Okapi
import numpy as np

class HybridSearcher:
    def __init__(self, docs: list[str], embeddings: np.ndarray):
        tokenized = [d.split() for d in docs]
        self.bm25 = BM25Okapi(tokenized)
        self.embeddings = embeddings
        self.docs = docs

    def search(self, query: str, query_emb: np.ndarray,
               alpha: float = 0.5, top_k: int = 10) -> list:
        # BM25 점수 (키워드 매칭)
        bm25_scores = self.bm25.get_scores(query.split())
        bm25_norm = bm25_scores / (bm25_scores.max() + 1e-9)

        # 코사인 유사도 (의미 매칭)
        cosine_scores = self.embeddings @ query_emb
        cosine_norm = (cosine_scores + 1) / 2  # [-1,1] → [0,1]

        # 가중 합산 (RRF 방식도 가능)
        final = alpha * cosine_norm + (1 - alpha) * bm25_norm
        top_idx = np.argsort(final)[::-1][:top_k]
        return [(self.docs[i], float(final[i])) for i in top_idx]
```

### alpha 값 선택 기준

- **alpha 0.7~0.9**: 의미 중심 (일반 Q&A, 개념 검색)
- **alpha 0.3~0.5**: 키워드 중심 (코드 검색, 제품명, 날짜)
- **alpha 0.5**: 균형 (대부분의 RAG 유스케이스)

## 메타데이터 필터링으로 검색 범위 축소

```python
# pgvector 예시 — 필터 후 벡터 검색
async def filtered_search(
    query_emb: list[float],
    department: str,
    date_from: str,
    limit: int = 10
) -> list:
    return await db.fetch("""
        SELECT id, title, content,
               1 - (embedding <=> $1::vector) AS similarity
        FROM documents
        WHERE department = $2
          AND created_at >= $3
          AND status = 'published'
        ORDER BY embedding <=> $1::vector
        LIMIT $4
    """, query_emb, department, date_from, limit)
```

필터를 먼저 적용하면 검색 대상을 줄여 **2~5배 속도 향상** 효과가 있습니다.

## 임베딩 캐싱

동일 쿼리를 반복 임베딩하는 비용을 제거합니다.

```python
import hashlib
import redis

class EmbeddingCache:
    def __init__(self, ttl: int = 3600):
        self.redis = redis.Redis()
        self.ttl = ttl

    def _key(self, text: str, model: str) -> str:
        h = hashlib.sha256(f"{model}:{text}".encode()).hexdigest()[:16]
        return f"emb:{h}"

    async def get_or_embed(self, text: str, model: str, embed_fn) -> list[float]:
        key = self._key(text, model)
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        emb = await embed_fn(text)
        self.redis.setex(key, self.ttl, json.dumps(emb))
        return emb
```

3편에서는 멀티테넌트 격리, 증분 인덱스 갱신, 프로덕션 모니터링으로 Vector DB 운영을 완성합니다.
