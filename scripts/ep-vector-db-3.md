## 벡터 DB는 구축보다 운영이 어렵다

2편에서 HNSW 인덱스와 하이브리드 검색으로 성능을 끌어올렸습니다. 프로덕션에서 진짜 문제는 멀티테넌트 격리, 데이터 갱신, 그리고 드리프트 모니터링입니다.

## 멀티테넌트 격리 전략

SaaS 환경에서 고객 데이터를 안전하게 분리하는 3가지 패턴:

```python
# 방법 1: Row-Level Security (권장 — 운영 단순)
# pgvector + Supabase RLS
"""
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON documents
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
"""

# 방법 2: 스키마 분리 (테넌트별 완전 격리)
async def get_tenant_client(tenant_id: str):
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.execute(f"SET search_path = tenant_{tenant_id}")
    return conn

# 방법 3: 메타데이터 필터 (간단하지만 실수 위험)
async def tenant_search(query_emb, tenant_id: str, k: int = 10):
    return await index.query(
        vector=query_emb,
        filter={"tenant_id": {"$eq": tenant_id}},
        top_k=k
    )
```

**권장**: RLS + 메타데이터 필터 이중 적용으로 격리 실패 방지.

## 증분 인덱스 갱신

문서가 추가·수정·삭제될 때 전체 재인덱싱 없이 처리합니다.

```python
import asyncio
from datetime import datetime

class IncrementalIndexer:
    async def process_change_stream(self):
        """변경 스트림을 구독해 실시간 인덱스 갱신"""
        async for event in self.db.change_stream("documents"):
            if event["operation"] == "INSERT":
                await self.add_document(event["document"])
            elif event["operation"] == "UPDATE":
                await self.update_document(event["document"])
            elif event["operation"] == "DELETE":
                await self.remove_document(event["document_id"])

    async def add_document(self, doc: dict):
        emb = await self.embed(doc["content"])
        await self.vector_db.upsert(
            id=doc["id"],
            vector=emb,
            metadata={
                "title": doc["title"],
                "tenant_id": doc["tenant_id"],
                "updated_at": datetime.utcnow().isoformat(),
            }
        )

    async def remove_document(self, doc_id: str):
        await self.vector_db.delete(ids=[doc_id])
        # 소프트 딜리트: 메타데이터에 deleted=True 마킹
```

## 임베딩 드리프트 감지

모델 업그레이드나 데이터 분포 변화로 검색 품질이 조용히 저하됩니다.

```python
import numpy as np
from scipy.spatial.distance import cosine

class DriftMonitor:
    def __init__(self, baseline_sample: np.ndarray):
        self.baseline_centroid = baseline_sample.mean(axis=0)
        self.baseline_std = baseline_sample.std(axis=0)

    def check_drift(self, new_embeddings: np.ndarray) -> dict:
        new_centroid = new_embeddings.mean(axis=0)

        centroid_shift = cosine(self.baseline_centroid, new_centroid)
        std_ratio = new_embeddings.std(axis=0).mean() / self.baseline_std.mean()

        return {
            "centroid_cosine_shift": centroid_shift,
            "std_ratio": std_ratio,
            "drift_detected": centroid_shift > 0.05 or not (0.8 < std_ratio < 1.2),
            "recommendation": self._recommend(centroid_shift, std_ratio),
        }

    def _recommend(self, shift: float, ratio: float) -> str:
        if shift > 0.1:
            return "전체 재인덱싱 필요 — 임베딩 모델 변경 의심"
        if shift > 0.05:
            return "샘플링 재검증 후 점진적 갱신 권장"
        return "정상 범위"
```

## 프로덕션 모니터링 대시보드 지표

```python
# 매 시간 수집하는 핵심 메트릭
METRICS = {
    # 검색 품질
    "recall_at_10": "golden set 기준 상위 10개 중 정답 비율",
    "mrr": "평균 역순위 (Mean Reciprocal Rank)",

    # 성능
    "p50_latency_ms": "중간값 검색 지연",
    "p99_latency_ms": "최악 케이스 지연 (SLA 기준)",

    # 운영
    "index_freshness_min": "마지막 인덱스 갱신 후 경과 분",
    "embedding_cache_hit_rate": "캐시 히트율 (목표: 40% 이상)",
    "tenant_isolation_violations": "격리 위반 건수 (0이어야 함)",
}

async def collect_metrics() -> dict:
    results = {}
    results["p50_latency_ms"] = await measure_percentile(queries=GOLDEN_QUERIES, p=50)
    results["p99_latency_ms"] = await measure_percentile(queries=GOLDEN_QUERIES, p=99)
    results["recall_at_10"] = await evaluate_recall(GOLDEN_SET, k=10)
    results["embedding_cache_hit_rate"] = cache.hit_rate()
    return results
```

## 벡터 DB 선택 가이드 (2026 기준)

| 요구사항 | 추천 DB | 이유 |
|---------|--------|------|
| 기존 Postgres 스택 | pgvector | 인프라 추가 없음 |
| 완전 관리형 SaaS | Pinecone | 운영 부담 최소 |
| 오픈소스 자체 호스팅 | Qdrant | 성능·기능 균형 |
| 수십억 벡터 이상 | Weaviate | 분산 아키텍처 |

이 3편 시리즈로 Vector DB 마스터 클래스(기초→성능→운영)가 완성됩니다.
