#!/usr/bin/env python3
"""리프레시 후보 파인더 — GSC 실측으로 "보강하면 회수가 큰 글"을 우선순위로 뽑는다.

신규 발행보다 **순위 5~20위(1페이지 직전)에 걸린 기존 글을 1페이지로 끌어올리는 것**이
회수가 빠르다(사용자 블로그 감사 결론과 동일). 이 스크립트는:
  1) GSC 페이지 CSV 에서 striking-distance 글을 뽑고
  2) "3위로 올라가면 클릭 몇 개 더" 를 추정해 기회 크기순 정렬하고
  3) CTR 이 순위 대비 낮으면 제목/메타 문제로 분리하고
  4) 각 글에 사이트 관리 RAG 가 뽑은 보강 포인트를 붙인다.

    python3 scripts/refresh_finder.py                 # 상위 12개
    python3 scripts/refresh_finder.py -n 20            # 상위 20개
    python3 scripts/refresh_finder.py --min-impr 50    # 노출 50 이상만
    python3 scripts/refresh_finder.py --json

GSC 데이터는 `GSC CSV/페이지.csv`(내보내기). 갱신하면 결과도 갱신된다.
"""
import argparse
import csv
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GSC_PAGES = ROOT / "GSC CSV" / "페이지.csv"

SITE_KNOWLEDGE_QUERY = os.getenv(
    "SITE_KNOWLEDGE_QUERY",
    os.path.expanduser("~/claude-web-workspace/site-knowledge/query.py"),
)

# 순위별 대략적 유기적 CTR(구글 기준 근사치) — 절대값 아닌 상대 비교용.
# "3위로 올라가면 얼마나 더 클릭되나" 추정에 쓴다.
CTR_BY_POS = {1: .28, 2: .15, 3: .11, 4: .08, 5: .07, 6: .055, 7: .043,
              8: .035, 9: .030, 10: .025}
TARGET_POS = 3          # 보강 목표 순위 (1페이지 상단)
STRIKE_LO, STRIKE_HI = 5.0, 20.0


def ctr_at(pos: float) -> float:
    """순위 → 근사 CTR. 10위 밖은 급감(페이지2는 거의 안 눌림)."""
    p = int(round(pos))
    if p <= 10:
        return CTR_BY_POS.get(max(p, 1), .025)
    return max(.012 - (p - 10) * 0.0007, .002)   # 11위부터 완만히 0으로


def slug_to_topic(url: str) -> str:
    """URL 슬러그 → 사람이 읽는 주제 (RAG 질의·표시용)."""
    slug = url.rstrip("/").split("/")[-1]
    try:
        slug = __import__("urllib.parse", fromlist=["unquote"]).unquote(slug)
    except Exception:
        pass
    return re.sub(r"[-_]+", " ", slug).strip()


def rag_refresh_points(topic: str, k: int = 3) -> list[str]:
    """사이트 관리 RAG 에서 이 글 보강에 쓸 근거 제목을 뽑는다(실패 시 빈 목록)."""
    try:
        if not os.path.exists(SITE_KNOWLEDGE_QUERY):
            return []
        out = subprocess.run(
            ["python3", SITE_KNOWLEDGE_QUERY,
             f"{topic} 리프레시 보강 순위 상승 1차출처 제목 검색의도", "--json", "-k", str(k)],
            capture_output=True, text=True, timeout=90,
        )
        return [f"[{h['category']}] {h['title']}" for h in json.loads(out.stdout or "[]")]
    except Exception:
        return []


def load_pages(min_impr: float):
    rows = []
    with open(GSC_PAGES, encoding="utf-8") as f:
        for r in csv.reader(f):
            if not r or r[0].startswith("http") is False:
                continue
            try:
                url, clicks, impr = r[0], float(r[1] or 0), float(r[2] or 0)
                ctr = float((r[3] or "0").rstrip("%")) / 100
                pos = float(r[4] or 0)
            except ValueError:
                continue
            if STRIKE_LO <= pos <= STRIKE_HI and impr >= min_impr:
                rows.append({"url": url, "clicks": clicks, "impr": impr,
                             "ctr": ctr, "pos": pos})
    return rows


def analyze(rows):
    out = []
    for r in rows:
        expected = ctr_at(r["pos"])                 # 현재 순위에서 '기대' CTR
        target_ctr = ctr_at(TARGET_POS)
        gain = r["impr"] * max(0.0, target_ctr - r["ctr"])   # 3위로 가면 +클릭 추정
        # CTR 이 순위 대비 크게 낮으면 콘텐츠가 아니라 제목/메타 문제
        ctr_gap = r["ctr"] < expected * 0.6
        r2 = {**r, "gain": round(gain, 1),
              "issue": "제목·메타" if ctr_gap else "콘텐츠 보강",
              "topic": slug_to_topic(r["url"])}
        out.append(r2)
    out.sort(key=lambda x: x["gain"], reverse=True)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=12, help="상위 몇 개")
    ap.add_argument("--min-impr", type=float, default=20, help="최소 노출")
    ap.add_argument("--no-rag", action="store_true", help="RAG 보강 포인트 생략(빠름)")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    if not GSC_PAGES.exists():
        sys.exit(f"GSC 페이지 CSV 없음: {GSC_PAGES}")

    ranked = analyze(load_pages(a.min_impr))[:a.n]
    if not a.no_rag:
        for r in ranked:
            r["refresh_points"] = rag_refresh_points(r["topic"])

    if a.json:
        print(json.dumps(ranked, ensure_ascii=False, indent=2))
        return

    tot_gain = sum(r["gain"] for r in ranked)
    print(f"\n리프레시 후보 상위 {len(ranked)}편 — 3위 도달 시 예상 추가클릭 합계 ≈ {tot_gain:.0f}/월\n")
    for i, r in enumerate(ranked, 1):
        path = r["url"].replace("https://www.thivelab.com", "")
        print(f"{i:2}. {path}")
        print(f"    순위 {r['pos']:.1f} · 노출 {r['impr']:.0f} · CTR {r['ctr']*100:.1f}% · "
              f"클릭 {r['clicks']:.0f}  →  보강 시 +{r['gain']:.0f} 클릭 추정  [{r['issue']}]")
        if r.get("refresh_points"):
            print(f"    RAG 근거: {' · '.join(r['refresh_points'])}")
    print()
    print("· [콘텐츠 보강] = 1차 출처·코드·의사결정표·검색의도 재정렬로 순위 상승")
    print("· [제목·메타]  = 순위 대비 CTR 이 낮음 → 제목/메타부터 개선(회수 가장 빠름)")


if __name__ == "__main__":
    main()
