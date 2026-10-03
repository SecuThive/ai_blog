-- stale-refresh 2026-10-04 post #704 redis-oom-에러used-memory-maxmemory-5분-응급처치-가이드
-- KO+EN content change: updated_at bumped by trigger, contentUpdatedAt set
-- Guarded by original md5 values; re-running updates 0 rows.
BEGIN;
UPDATE posts SET content=$sr$# Redis OOM 에러(used memory > maxmemory) 5분 응급처치 완벽 가이드

배포도 안 했는데 갑자기 운영 로그에 이런 메시지가 도배되기 시작합니다.

```
(error) OOM command not allowed when used memory > 'maxmemory'.
```

읽기는 되는데 `SET`, `INCR`, `LPUSH` 같은 **쓰기 명령만 전부 거부**되는 상황. 세션 저장소나 캐시로 Redis를 쓰고 있다면 그대로 서비스 장애로 직결됩니다. 이 글은 "지금 장애 중"인 분을 위해 **응급 처치를 앞에, 원인 분석을 뒤에** 배치했습니다. 아래 로드맵대로 따라오면 5분 안에 쓰기를 복구할 수 있습니다.

```
[1] INFO memory 로 현황 파악 (30초)
[2] maxmemory 늘리거나 / eviction 정책 바꿔 즉시 복구 (1분)
[3] CONFIG REWRITE 로 영구 저장 (10초)
[4] TTL · 모니터링으로 재발 방지 (이후)
```

## 1. 30초 현황 파악: INFO memory 읽는 법

가장 먼저 지금 Redis가 어떤 상태인지 봐야 합니다.

```bash
redis-cli INFO memory
```

```
# Memory
used_memory:2147483648
used_memory_human:2.00G
used_memory_rss:2415919104
used_memory_rss_human:2.25G
maxmemory:2147483648
maxmemory_human:2.00G
maxmemory_policy:noeviction
mem_fragmentation_ratio:1.12
mem_allocator:jemalloc-5.3.0
```

핵심 지표 4개만 봅니다.

| 지표 | 의미 | 판별 기준 |
|------|------|-----------|
| `used_memory` | Redis가 논리적으로 쓰는 메모리 | `maxmemory`에 근접/도달하면 위험 |
| `used_memory_rss` | OS가 실제로 점유한 물리 메모리(RSS) | used_memory보다 과도하게 크면 단편화 |
| `mem_fragmentation_ratio` | rss ÷ used_memory | 1.0~1.4 정상 / **1.5↑ 단편화** / **1.0 미만 스왑 의심** |
| `maxmemory_policy` | 한계 도달 시 동작 | `noeviction`이면 쓰기 거부의 직접 원인 |

위 예시는 `used_memory == maxmemory`이고 정책이 `noeviction`입니다. 즉, **메모리가 꽉 찼고 비울 정책도 없으니 쓰기를 거부**하는 전형적 상황입니다.

보조 명령도 알아두면 좋습니다.

```bash
redis-cli MEMORY DOCTOR          # Redis가 직접 진단 코멘트를 줌
redis-cli MEMORY USAGE mykey     # 특정 키가 차지하는 바이트
```

## 2. 즉시 복구: maxmemory 조정과 정책 선택

상황은 둘 중 하나입니다. **(A) 메모리를 더 줄 수 있다** 또는 **(B) 캐시라서 일부 버려도 된다.**

### (A) 메모리 여유가 있으면 한계만 올린다

서버 RAM에 여유가 있다면 maxmemory를 무중단으로 늘립니다.

```bash
redis-cli CONFIG SET maxmemory 4gb
```

이 명령은 즉시 적용되고, 직후부터 쓰기가 다시 동작합니다.

### (B) 순수 캐시라면 eviction 정책을 켠다

캐시 용도인데 `noeviction`으로 운영했다면 이게 근본 문제입니다. LRU 기반으로 오래된 키를 자동으로 밀어내게 합니다.

```bash
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

정책을 바꾸는 순간 한계 초과분이 evict되며 쓰기가 즉시 복구됩니다.

### maxmemory-policy 비교표

상황에 맞는 정책을 고르는 것이 핵심입니다. Redis 8.6부터는 쓰기 시점만 기준으로 삼는 LRM 정책 2개가 추가되어 [공식 문서](https://redis.io/docs/latest/develop/reference/eviction/) 기준 10종입니다(Redis 8.6 미만과 Valkey에는 LRM이 없습니다).

| 정책 | 동작 | 대상 키 | 캐시용 | 세션·영속용 |
|------|------|---------|--------|-------------|
| `noeviction` | 한계 도달 시 쓰기 거부(에러) | - | ✕ | ◎(증설 전제) |
| `allkeys-lru` | 가장 오래 안 쓴 키 제거 | 전체 | ◎ | △ |
| `allkeys-lfu` | 가장 적게 쓰인 키 제거 | 전체 | ◎ | △ |
| `allkeys-lrm` | 가장 오래 수정되지 않은 키 제거(Redis 8.6+) | 전체 | ○(읽기 위주) | △ |
| `volatile-lru` | TTL 있는 키 중 LRU | TTL 키만 | ○ | ○ |
| `volatile-lfu` | TTL 있는 키 중 LFU | TTL 키만 | ○ | ○ |
| `volatile-lrm` | TTL 있는 키 중 LRM(Redis 8.6+) | TTL 키만 | ○ | ○ |
| `allkeys-random` | 무작위 제거 | 전체 | △ | ✕ |
| `volatile-random` | TTL 키 중 무작위 | TTL 키만 | △ | △ |
| `volatile-ttl` | 만료 임박 키 우선 제거 | TTL 키만 | ○ | ◎(TTL 혼재) |

**선택 가이드**
- **순수 캐시**: `allkeys-lru` 또는 접근 빈도 편차가 큰 경우 `allkeys-lfu`
- **TTL 키와 영속 키가 섞인 환경**: `volatile-ttl` 또는 `volatile-lru` (TTL 없는 키는 보호됨)
- **데이터 유실이 절대 불가**(세션·큐·영속 저장): `noeviction` 유지 + **메모리 증설**이 정답. 정책으로 버티려 하지 마세요.

### 영구 저장

`CONFIG SET`은 재시작하면 사라집니다. 반드시 설정 파일에 반영합니다.

```bash
redis-cli CONFIG REWRITE
```

또는 `redis.conf`를 직접 수정해 둡니다.

```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 5
```

`maxmemory-samples`는 LRU/LFU가 제거 후보를 고를 때 표본 수입니다. 기본 5면 충분하고, 정밀도를 높이려면 10까지 올릴 수 있지만 CPU를 더 씁니다.

## 3. 원인 진단: OOM을 부르는 5가지 시나리오

복구했다면 이제 왜 터졌는지 봅니다. 증상→원인→확인 순서로 정리합니다.

**① maxmemory 한계 도달**
- 증상: `used_memory ≈ maxmemory`, 쓰기 전면 거부
- 원인: 데이터 증가량이 할당 메모리를 초과
- 확인: `INFO memory`에서 두 값 비교

**② 정책이 noeviction**
- 증상: 캐시인데도 키를 안 버리고 에러만 냄
- 원인: 기본값 `noeviction`을 캐시에 그대로 사용
- 확인: `CONFIG GET maxmemory-policy`

**③ 메모리 단편화로 실질 부족**
- 증상: used_memory는 여유 있는데 OOM 또는 OS 스왑 발생
- 원인: 잦은 키 생성/삭제로 jemalloc 단편화, RSS가 부풀어 OS 메모리 압박
- 확인: `mem_fragmentation_ratio` 1.5 이상

**④ RDB/AOF rewrite의 fork(COW) 압박**
- 증상: `BGSAVE`/AOF rewrite 시점에 메모리 급증, fork 실패 로그
- 원인: fork 시 Copy-On-Write로 쓰기가 많으면 부모 메모리가 복제됨. 최악엔 2배까지 순간 점유
- 확인: 로그의 `Can't save in background: fork: Cannot allocate memory`, `INFO persistence`의 `rdb_last_bgsave_status`

**⑤ 키에 TTL 미설정으로 무한 누적**
- 증상: 시간이 갈수록 used_memory가 단조 증가
- 원인: 캐시인데 만료를 안 걸어 영원히 살아있는 키
- 확인: `redis-cli --bigkeys`, `DBSIZE` 추세 관찰

> 실무 경험담: 실무에서 가장 자주 보고되는 원인은 ⑤번, TTL 누락입니다. 코드 리뷰에서 "이 SET에 EX 빠졌어요" 한 줄이면 막을 일을, 몇 달 뒤 새벽 장애로 되갚는 경우가 많습니다. 정책 튜닝보다 **TTL 컨벤션 강제**가 비용 대비 효과가 가장 큽니다.

## 4. 재발 방지 체크리스트

**캐시 키엔 무조건 TTL을 건다.** 쓰기 시점에 만료를 함께 지정하세요.

```bash
SET session:1234 "payload" EX 3600     # 1시간
SETEX cache:user:99 600 "..."          # 10분
```

**단편화 대응.** Redis 4.0+의 활성 디프래그를 켭니다.

```bash
redis-cli CONFIG SET activedefrag yes
```

단편화가 심해 RSS가 안 빠지면 마지막 수단으로 재시작 시 RSS가 회수됩니다(단, 데이터 영속화 후 진행).

**모니터링 알람.** `redis_exporter` + [Prometheus](/blog/uptime-kuma-vs-netdata-vs-prometheus-소규모-서버-모니터링-추천) + Grafana로 메모리 사용률 80%에서 알람을 겁니다.

```yaml
groups:
  - name: redis-memory
    rules:
      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis used_memory가 maxmemory의 80%를 초과했습니다"
```

이 알람 하나면 한계 도달 전에 증설·정리 시간을 벌 수 있습니다.

**용량 산정 팁.** 운영 데이터 기준 `used_memory_rss`에 fork/COW 여유로 1.3~1.5배를 곱해 `maxmemory`와 서버 RAM을 잡으세요. RDB를 쓴다면 더 보수적으로.

> Redis 7.x에서는 `maxmemory-clients`로 클라이언트 버퍼까지 제한할 수 있습니다. 라이선스는 [공식 라이선스 페이지](https://redis.io/legal/licenses/) 기준으로 7.2 이하 BSD-3, 7.4부터 RSALv2/SSPLv1(2024년 3월 변경), 8.0부터 AGPLv3가 선택지로 추가되었습니다. 이 과정에서 Valkey로 옮긴 팀도 있는데, [Valkey 문서](https://valkey.io/topics/lru-cache/)의 maxmemory 정책 8종과 명령은 이 글의 내용과 같습니다(LRM 정책 제외).


## 참고: 공식 문서

이 글에서 다루는 동작·설정·에러의 1차 출처는 다음 공식 문서입니다. 버전별 옵션과 정확한 동작은 여기서 확인하세요.

- [Redis 공식 문서](https://redis.io/docs/latest/)

## 자주 묻는 질문 (FAQ)

**Q. CONFIG SET maxmemory-policy를 바꾸면 데이터가 즉시 삭제되나요?**
A. 정책을 evict 계열로 바꾸고 used_memory가 maxmemory를 초과한 상태라면, 초과분만큼 키가 즉시 제거됩니다. TTL 없는 영속 데이터가 있다면 `allkeys-*` 대신 `volatile-*`를 쓰거나 maxmemory를 먼저 늘리세요.

**Q. CONFIG SET으로 바꿨는데 재시작하면 원래대로 돌아갑니다.**
A. `CONFIG SET`은 메모리상 설정만 바꿉니다. `redis-cli CONFIG REWRITE`로 redis.conf에 반영하거나, 설정 파일을 직접 수정해야 재시작 후에도 유지됩니다.

**Q. used_memory는 여유가 있는데 OOM이 납니다. 왜죠?**
A. `mem_fragmentation_ratio`를 확인하세요. 1.5 이상이면 단편화로 RSS가 부풀어 OS 메모리가 부족한 상태입니다. `activedefrag yes`를 켜거나, 영속화 후 재시작으로 RSS를 회수하면 해결됩니다.

## 출처 · 확인일 2026-10-04
- [Redis, Key eviction](https://redis.io/docs/latest/develop/reference/eviction/) — maxmemory-policy 10종, LRM 정책은 Redis 8.6부터
- [Redis, Licenses](https://redis.io/legal/licenses/) — 7.2 이하 BSD-3, 7.4 RSALv2/SSPLv1, 8.0 이상 RSALv2/SSPLv1/AGPLv3, 2024년 3월 변경
- [Valkey, Key eviction](https://valkey.io/topics/lru-cache/) — Valkey의 maxmemory 정책 8종$sr$, content_evidence=jsonb_set($j${"en": {"title": "Redis OOM Error (used memory > maxmemory): A 5-Minute Emergency Fix Guide", "content": "# Redis OOM Error (used memory > maxmemory): A Complete 5-Minute Emergency Fix Guide\n\nYou haven't even deployed, but suddenly production logs start getting plastered with this message:\n\n```\n(error) OOM command not allowed when used memory > 'maxmemory'.\n```\n\nReads still work, but every **write command**—`SET`, `INCR`, `LPUSH`, and the like—is rejected. If you use Redis as a session store or cache, this goes straight to a service outage. This post puts **emergency treatment first and root-cause analysis second** for anyone who is in an incident right now. Follow the roadmap below and you can restore writes in five minutes.\n\n```\n[1] Assess the situation with INFO memory (30 seconds)\n[2] Raise maxmemory or change the eviction policy for immediate recovery (1 minute)\n[3] Persist with CONFIG REWRITE (10 seconds)\n[4] Prevent recurrence with TTLs and monitoring (afterward)\n```\n\n## 1. Assess the Situation in 30 Seconds: How to Read INFO memory\n\nFirst, you need to see what state Redis is in right now.\n\n```bash\nredis-cli INFO memory\n```\n\n```\n# Memory\nused_memory:2147483648\nused_memory_human:2.00G\nused_memory_rss:2415919104\nused_memory_rss_human:2.25G\nmaxmemory:2147483648\nmaxmemory_human:2.00G\nmaxmemory_policy:noeviction\nmem_fragmentation_ratio:1.12\nmem_allocator:jemalloc-5.3.0\n```\n\nLook at just these four key metrics.\n\n| Metric | Meaning | How to interpret |\n|------|------|-----------|\n| `used_memory` | Memory Redis is using logically | Danger if close to or at `maxmemory` |\n| `used_memory_rss` | Physical memory (RSS) actually occupied by the OS | Fragmentation if much larger than used_memory |\n| `mem_fragmentation_ratio` | rss ÷ used_memory | 1.0–1.4 normal / **≥1.5 fragmentation** / **<1.0 swap suspected** |\n| `maxmemory_policy` | Behavior when the limit is hit | `noeviction` is the direct cause of write rejections |\n\nIn the example above, `used_memory == maxmemory` and the policy is `noeviction`. In other words, this is the classic case: **memory is full and there is no eviction policy, so writes are refused**.\n\nThese helper commands are also worth knowing.\n\n```bash\nredis-cli MEMORY DOCTOR          # Redis itself prints a diagnostic comment\nredis-cli MEMORY USAGE mykey     # Bytes occupied by a specific key\n```\n\n## 2. Immediate Recovery: Adjusting maxmemory and Choosing a Policy\n\nYou are in one of two situations: **(A) you can give it more memory**, or **(B) it is a cache, so dropping some keys is acceptable.**\n\n### (A) If you have spare RAM, just raise the limit\n\nIf the server has spare RAM, raise maxmemory with no downtime.\n\n```bash\nredis-cli CONFIG SET maxmemory 4gb\n```\n\nThis command takes effect immediately, and writes start working again right after.\n\n### (B) If it is a pure cache, turn on an eviction policy\n\nIf you are using it as a cache but running with `noeviction`, that is the root problem. Switch to LRU so old keys are evicted automatically.\n\n```bash\nredis-cli CONFIG SET maxmemory-policy allkeys-lru\n```\n\nThe moment you change the policy, the excess is evicted and writes recover immediately.\n\n### Comparison of maxmemory-policy options\n\nPicking the policy that matches your situation is the key. Redis 8.6 added two LRM policies that only track writes, so the [official docs](https://redis.io/docs/latest/develop/reference/eviction/) now list 10 (Redis below 8.6 and Valkey have no LRM).\n\n| Policy | Behavior | Target keys | For cache | For sessions / persistence |\n|------|------|---------|--------|-------------|\n| `noeviction` | Reject writes (error) when the limit is hit | — | ✕ | ◎ (assuming you will scale memory) |\n| `allkeys-lru` | Evict the least recently used keys | All keys | ◎ | △ |\n| `allkeys-lfu` | Evict the least frequently used keys | All keys | ◎ | △ |\n| `allkeys-lrm` | Evict the least recently modified keys (Redis 8.6+) | All keys | ○ (read-heavy) | △ |\n| `volatile-lru` | LRU among keys that have a TTL | TTL keys only | ○ | ○ |\n| `volatile-lfu` | LFU among keys that have a TTL | TTL keys only | ○ | ○ |\n| `volatile-lrm` | LRM among keys that have a TTL (Redis 8.6+) | TTL keys only | ○ | ○ |\n| `allkeys-random` | Evict at random | All keys | △ | ✕ |\n| `volatile-random` | Random among TTL keys | TTL keys only | △ | △ |\n| `volatile-ttl` | Prefer keys closest to expiry | TTL keys only | ○ | ◎ (mixed TTL environment) |\n\n**Selection guide**\n- **Pure cache**: `allkeys-lru`, or `allkeys-lfu` if access-frequency skew is large\n- **Mix of TTL keys and persistent keys**: `volatile-ttl` or `volatile-lru` (keys without a TTL are protected)\n- **Data loss is absolutely not allowed** (sessions, queues, persistent storage): keep `noeviction` and **scale memory**. Do not try to ride it out with a policy change.\n\n### Persist the change\n\n`CONFIG SET` is lost on restart. You must write it into the config file.\n\n```bash\nredis-cli CONFIG REWRITE\n```\n\nOr edit `redis.conf` directly.\n\n```conf\nmaxmemory 2gb\nmaxmemory-policy allkeys-lru\nmaxmemory-samples 5\n```\n\n`maxmemory-samples` is the sample size LRU/LFU uses when picking eviction candidates. The default of 5 is enough; you can raise it to 10 for more precision, but it uses more CPU.\n\n## 3. Root-Cause Diagnosis: Five Scenarios That Trigger OOM\n\nOnce you have recovered, look at why it blew up. Organized as symptom → cause → how to confirm.\n\n**① Hit the maxmemory limit**\n- Symptom: `used_memory ≈ maxmemory`, all writes rejected\n- Cause: Data growth exceeded allocated memory\n- Confirm: Compare the two values in `INFO memory`\n\n**② Policy is noeviction**\n- Symptom: It is a cache, but keys are never dropped—only errors\n- Cause: The default `noeviction` was left in place for a cache\n- Confirm: `CONFIG GET maxmemory-policy`\n\n**③ Effective shortage due to memory fragmentation**\n- Symptom: used_memory still has headroom, but you get OOM or OS swap\n- Cause: Frequent key create/delete fragments jemalloc; RSS balloons and pressures OS memory\n- Confirm: `mem_fragmentation_ratio` of 1.5 or higher\n\n**④ fork (COW) pressure from RDB/AOF rewrite**\n- Symptom: Memory spikes at `BGSAVE`/AOF rewrite time; fork-failure logs\n- Cause: On fork, Copy-On-Write duplicates parent memory if there are many writes. Worst case, instantaneous usage can double\n- Confirm: Log line `Can't save in background: fork: Cannot allocate memory`; `rdb_last_bgsave_status` in `INFO persistence`\n\n**⑤ Unbounded growth because keys have no TTL**\n- Symptom: used_memory increases monotonically over time\n- Cause: It is a cache, but keys never expire and live forever\n- Confirm: `redis-cli --bigkeys`; watch the `DBSIZE` trend\n\n> Field note: In production, the most commonly reported cause is #5—missing TTLs. A one-line code-review comment (\"this SET is missing EX\") would have prevented it, but it comes back as a 3 a.m. outage months later. Enforcing a **TTL convention** has a better cost-to-benefit ratio than policy tuning.\n\n## 4. Recurrence-Prevention Checklist\n\n**Always put a TTL on cache keys.** Set expiry at write time.\n\n```bash\nSET session:1234 \"payload\" EX 3600     # 1 hour\nSETEX cache:user:99 600 \"...\"          # 10 minutes\n```\n\n**Handle fragmentation.** Turn on active defrag (Redis 4.0+).\n\n```bash\nredis-cli CONFIG SET activedefrag yes\n```\n\nIf fragmentation is severe and RSS will not come down, a restart as a last resort reclaims RSS (only after you have persisted the data).\n\n**Monitoring alerts.** Use `redis_exporter` + [Prometheus](/blog/uptime-kuma-vs-netdata-vs-prometheus-소규모-서버-모니터링-추천) + Grafana and fire an alert at 80% memory usage.\n\n```yaml\ngroups:\n  - name: redis-memory\n    rules:\n      - alert: RedisMemoryHigh\n        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8\n        for: 5m\n        labels:\n          severity: warning\n        annotations:\n          summary: \"Redis used_memory exceeded 80% of maxmemory\"\n```\n\nThat single alert buys you time to scale or clean up before you hit the limit.\n\n**Capacity-sizing tip.** Take production `used_memory_rss`, multiply by 1.3–1.5 for fork/COW headroom, and size `maxmemory` and server RAM from that. Be more conservative if you use RDB.\n\n> In Redis 7.x you can also cap client buffers with `maxmemory-clients`. Per the [official licenses page](https://redis.io/legal/licenses/), Redis 7.2 and earlier are BSD-3, 7.4 moved to RSALv2/SSPLv1 (March 2024), and 8.0 added AGPLv3 as an option. Some teams moved to Valkey along the way; the eight maxmemory policies and commands in the [Valkey docs](https://valkey.io/topics/lru-cache/) match this guide (it has no LRM policies).\n\n## References: Official docs\n\nThe primary source for the behavior, settings, and errors covered in this post is the official documentation below. Check it for version-specific options and exact behavior.\n\n- [Redis official documentation](https://redis.io/docs/latest/)\n\n## FAQ\n\n**Q. If I change maxmemory-policy with CONFIG SET, are keys deleted immediately?**\nA. If you switch to an evicting policy and used_memory already exceeds maxmemory, keys are removed immediately until you are back under the limit. If you have persistent data without TTLs, use `volatile-*` instead of `allkeys-*`, or raise maxmemory first.\n\n**Q. I changed it with CONFIG SET, but it reverts after a restart.**\nA. `CONFIG SET` only changes the in-memory config. Run `redis-cli CONFIG REWRITE` to write it into redis.conf, or edit the config file yourself, so it survives a restart.\n\n**Q. used_memory still has headroom, but I still get OOM. Why?**\nA. Check `mem_fragmentation_ratio`. If it is 1.5 or higher, fragmentation has ballooned RSS and the OS is short on memory. Enable `activedefrag yes`, or persist and restart to reclaim RSS.\n\n## Sources · checked 2026-10-04\n- [Redis, Key eviction](https://redis.io/docs/latest/develop/reference/eviction/) — 10 maxmemory policies; LRM policies since Redis 8.6\n- [Redis, Licenses](https://redis.io/legal/licenses/) — BSD-3 up to 7.2, RSALv2/SSPLv1 for 7.4, RSALv2/SSPLv1/AGPLv3 for 8.0+, changed March 2024\n- [Valkey, Key eviction](https://valkey.io/topics/lru-cache/) — Valkey's eight maxmemory policies", "excerpt": "Step-by-step fix for the Redis \"OOM command not allowed when used memory > maxmemory\" error—from INFO memory diagnosis to raising maxmemory, enabling allkeys-lru eviction, and preventing recurrence with TTLs—using copy-paste commands."}, "verifiedAt": "2026-10-04", "changeSummary": "Redis 라이선스 이력(BSD-3 → 7.4부터 RSALv2/SSPLv1 → 8.0부터 AGPLv3 선택 추가)을 공식 라이선스 페이지대로 바로잡고, Redis 8.6에 추가된 LRM 정책(allkeys-lrm, volatile-lrm)을 정책 비교표에 반영. 출처 없는 \"allkeys-lfu 채택 증가\" 표현 삭제, 출처·확인일 추가.", "officialSources": ["https://redis.io/legal/licenses/", "https://redis.io/docs/latest/develop/reference/eviction/", "https://valkey.io/topics/lru-cache/"]}$j$::jsonb,'{contentUpdatedAt}',to_jsonb(to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"')))
WHERE id=704 AND md5(content)='6322af3dadf763fe62853ee0a4aa2947' AND md5(content_evidence::text)='3fda37333d43e4921412a52045c973c2' AND md5(coalesce(array_to_string(tags,'|'),''))='855ab9860e719457b1036fbc66858108';
COMMIT;
