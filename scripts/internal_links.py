#!/usr/bin/env python3
"""내부 링크 기회 파인더 — 관련 있는데 아직 링크 안 된 글 쌍을 찾는다.

백링크 0인 신생 사이트에서 **유일하게 통제 가능한 링크 자산**이 내부 링크다(사용자 감사
결론). 트래픽 있는 글(GSC)에서 관련 글로 링크를 연결하면 크롤 효율·체류·권위 전달이 는다.

  1) 발행 글 전량 임베딩(bge-m3, 캐시)
  2) GSC 트래픽 상위 글을 '소스'로, 의미상 관련 높은 글을 '타깃'으로
  3) 소스 본문에 타깃 링크(/blog|/engineer/slug)가 이미 있으면 제외
  → 소스별 '추가하면 좋은 내부 링크' 리포트

    python3 scripts/internal_links.py                 # 트래픽 상위 20개 소스
    python3 scripts/internal_links.py -n 40 --json
    python3 scripts/internal_links.py --all-sources    # 트래픽 없어도 전체 소스

본문을 수정하지는 않는다(리포트만). 적용은 검토 후. bge-m3·Supabase 는 로컬.
"""
import argparse
import array
import csv
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts" / ".internal_links_cache.json"
GSC_PAGES = ROOT / "GSC CSV" / "페이지.csv"
OLLAMA = "http://127.0.0.1:11434/api/embed"
EMBED_MODEL = "bge-m3:latest"
SIM_MIN = 0.55


def _env():
    env = dict(os.environ)
    for l in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        l = l.strip()
        if "=" in l and not l.startswith("#"):
            k, _, v = l.partition("=")
            env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


ENV = _env()
SU = ENV.get("SUPABASE_URL", "").rstrip("/")
SK = ENV.get("SUPABASE_SERVICE_ROLE_KEY", "")


def _sb_get(table, params):
    import urllib.parse
    q = f"{SU}/rest/v1/{table}?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(q, headers={"apikey": SK, "Authorization": f"Bearer {SK}"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())


def load_posts():
    """발행 글 전량 (id, slug, title, content, section)."""
    out = []
    for table, section in (("posts", "blog"), ("engineer_guides", "engineer")):
        rows, off = [], 0
        while True:
            batch = _sb_get(table, {"status": "eq.published",
                                    "select": "id,slug,title,content",
                                    "limit": 1000, "offset": off})
            rows += batch
            if len(batch) < 1000:
                break
            off += 1000
        for r in rows:
            r["section"] = section
            out.append(r)
    return out


def embed(texts):
    req = urllib.request.Request(
        OLLAMA, data=json.dumps({"model": EMBED_MODEL, "input": texts}).encode(),
        headers={"Content-Type": "application/json"})
    raw = json.loads(urllib.request.urlopen(req, timeout=600).read())["embeddings"]
    out = []
    for v in raw:
        s = sum(x * x for x in v) ** 0.5 or 1.0
        out.append([x / s for x in v])
    return out


def get_vectors(posts):
    """제목+발췌 임베딩. 내용 해시로 캐시."""
    try:
        cache = json.loads(CACHE.read_text(encoding="utf-8"))
    except Exception:
        cache = {}
    todo = []
    for p in posts:
        key = f"{p['section']}:{p['slug']}"
        text = (p["title"] + "\n" + (p.get("content") or "")[:500])
        h = hashlib.md5(text.encode()).hexdigest()
        p["_key"] = key
        if cache.get(key, {}).get("h") != h:
            todo.append((key, h, text))
    if todo:
        print(f"· 신규 임베딩 {len(todo)}개 …", file=sys.stderr)
        for i in range(0, len(todo), 16):
            chunk = todo[i:i + 16]
            for (k, h, _), v in zip(chunk, embed([t for _, _, t in chunk])):
                cache[k] = {"h": h, "v": v}
            print(f"  {min(i+16,len(todo))}/{len(todo)}", end="\r", file=sys.stderr)
        print(file=sys.stderr)
        CACHE.write_text(json.dumps(cache), encoding="utf-8")
    return {k: array.array("f", cache[k]["v"]) for k in (p["_key"] for p in posts) if k in cache}


def gsc_traffic():
    """slug → 클릭수 (소스 우선순위용)."""
    from urllib.parse import unquote
    t = {}
    if not GSC_PAGES.exists():
        return t
    for r in csv.reader(open(GSC_PAGES, encoding="utf-8")):
        if r and r[0].startswith("http"):
            slug = unquote(r[0]).rstrip("/").split("/")[-1]
            try:
                t[slug] = float(r[1] or 0)
            except ValueError:
                pass
    return t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=20, help="소스 글 수(트래픽 상위)")
    ap.add_argument("--per", type=int, default=3, help="소스당 제안 링크 수")
    ap.add_argument("--all-sources", action="store_true", help="트래픽 없어도 전체를 소스로")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    posts = load_posts()
    print(f"· 발행 글 {len(posts)}편", file=sys.stderr)
    vecs = get_vectors(posts)
    by_key = {p["_key"]: p for p in posts}
    traffic = gsc_traffic()
    dim = len(next(iter(vecs.values())))

    # 소스 우선순위: GSC 클릭 많은 글 (링크가 값을 전달할 곳)
    def clicks(p):
        return traffic.get(p["slug"], 0)
    sources = sorted(posts, key=clicks, reverse=True)
    if not a.all_sources:
        sources = [p for p in sources if clicks(p) > 0][:a.n] or sources[:a.n]
    else:
        sources = sources[:a.n]

    report = []
    for s in sources:
        sk_ = s["_key"]
        if sk_ not in vecs:
            continue
        sv = vecs[sk_]
        content = (s.get("content") or "")
        sims = []
        for p in posts:
            if p["_key"] == sk_ or p["_key"] not in vecs:
                continue
            tv = vecs[p["_key"]]
            score = sum(sv[i] * tv[i] for i in range(dim))
            if score < SIM_MIN:
                continue
            # 이미 본문에 그 글 링크가 있으면 제외
            if f"/{p['section']}/{p['slug']}" in content:
                continue
            sims.append((score, p))
        sims.sort(key=lambda x: -x[0])
        targets = [{"title": p["title"], "url": f"/{p['section']}/{p['slug']}",
                    "score": round(sc, 3), "clicks": clicks(p)}
                   for sc, p in sims[:a.per]]
        if targets:
            report.append({"source_title": s["title"],
                           "source_url": f"/{s['section']}/{s['slug']}",
                           "source_clicks": clicks(s), "suggest": targets})

    if a.json:
        print(json.dumps(report, ensure_ascii=False, indent=2)); return
    print(f"\n내부 링크 기회 — 소스 {len(report)}편 (트래픽 있는 글에서 관련 글로 연결)\n")
    for r in report:
        print(f"■ {r['source_title'][:50]}  (클릭 {r['source_clicks']:.0f})")
        print(f"  {r['source_url']}")
        for t in r["suggest"]:
            print(f"    → [{t['score']}] {t['title'][:44]}  {t['url']}")
        print()


if __name__ == "__main__":
    main()
