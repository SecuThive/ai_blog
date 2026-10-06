-- content fix 2026-10-06 post #307 poc를-넘어-프로덕션으로-클라우드-환경에서-llm을-안정적으로-서비스화하는-기술-로드맵
-- FastAPI + Redis example (KO body + EN body content_evidence.en.content), code only:
--   1) add `from datetime import datetime` (snippet calls datetime.now()).
--   2) deprecated @app.on_event("startup") -> lifespan context manager (contextlib.asynccontextmanager),
--      app = FastAPI(lifespan=lifespan). Startup logic (await r.ping(); print) preserved; the original had no shutdown handler.
-- Idempotent: each field is rewritten only while it still contains the old block; re-running updates 0 rows.
-- updated_at bumped by trigger; published_at/status/slug untouched.
BEGIN;
UPDATE posts SET
  content = CASE WHEN strpos(content, $o307$from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

app = FastAPI()
r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@app.on_event("startup")
async def startup_event():
    await r.ping()
    print("Redis connection successful.")
$o307$) > 0 THEN replace(content, $o307$from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

app = FastAPI()
r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@app.on_event("startup")
async def startup_event():
    await r.ping()
    print("Redis connection successful.")
$o307$, $n307$from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@asynccontextmanager
async def lifespan(app: FastAPI):
    await r.ping()
    print("Redis connection successful.")
    yield

app = FastAPI(lifespan=lifespan)
$n307$) ELSE content END,
  content_evidence = CASE WHEN strpos(content_evidence->'en'->>'content', $o307$from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

app = FastAPI()
r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@app.on_event("startup")
async def startup_event():
    await r.ping()
    print("Redis connection successful.")
$o307$) > 0
    THEN jsonb_set(content_evidence, '{en,content}', to_jsonb(replace(content_evidence->'en'->>'content', $o307$from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

app = FastAPI()
r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@app.on_event("startup")
async def startup_event():
    await r.ping()
    print("Redis connection successful.")
$o307$, $n307$from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@asynccontextmanager
async def lifespan(app: FastAPI):
    await r.ping()
    print("Redis connection successful.")
    yield

app = FastAPI(lifespan=lifespan)
$n307$)))
    ELSE content_evidence END
WHERE id = 307
  AND (strpos(content, $o307$from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

app = FastAPI()
r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@app.on_event("startup")
async def startup_event():
    await r.ping()
    print("Redis connection successful.")
$o307$) > 0 OR strpos(content_evidence->'en'->>'content', $o307$from fastapi import FastAPI, HTTPException
import hashlib
import redis.asyncio as redis
import asyncio
# from your_llm_service import generate_response # 실제 추론 함수 가정

app = FastAPI()
r = redis.Redis()

# 초기화 시 Redis 연결 (실제 환경에서는 환경 변수 사용 권장)
@app.on_event("startup")
async def startup_event():
    await r.ping()
    print("Redis connection successful.")
$o307$) > 0);
COMMIT;
