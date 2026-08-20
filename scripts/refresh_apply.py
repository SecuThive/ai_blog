#!/usr/bin/env python3
"""리프레시 발행 — 사람이 승인한 개선안을 라이브 글(Supabase)에 반영한다.

**사람이 직접 실행**하는 도구다(무인 자동발행 아님). 루프의 마지막 반쪽:
  refresh_pipeline.py 가 제안을 쌓으면 → 사람이 검토 → 이 도구로 반영.

slug(=URL)는 절대 바꾸지 않는다. title·메타(excerpt)·content 만 갱신해 순위를 유지한 채 개선한다.

세 가지 모드:
  1) 제목·메타만 (가장 빠른 회수 — 순위는 되는데 CTR 낮은 글):
       python3 scripts/refresh_apply.py <url> --title "새 제목" [--excerpt "메타설명"]
  2) 본문까지 LLM 리라이트 → **스테이징 파일**(발행 안 함, 사람이 최종 검토):
       python3 scripts/refresh_apply.py <url> --rewrite
  3) 검토 끝난 스테이징 파일을 발행:
       python3 scripts/refresh_apply.py --publish <파일.final.md> [--dry-run]

항상 --dry-run 으로 무엇이 바뀔지 먼저 확인할 수 있다. 발행은 published.log 에 기록된다.
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refresh_pipeline as rp   # ENV·Supabase·Ollama·RAG 재사용

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "refresh_proposals" / "published.log"


def table_slug(url: str):
    parts = url.rstrip("/").split("/")
    slug, section = parts[-1], (parts[-2] if len(parts) >= 2 else "")
    return ("engineer_guides" if section == "engineer" else "posts"), slug


def sb_get(table, slug):
    q = f"{rp.SUPABASE_URL}/rest/v1/{table}?slug=eq.{quote(slug)}&limit=1"
    req = urllib.request.Request(q, headers={
        "apikey": rp.SUPABASE_KEY, "Authorization": f"Bearer {rp.SUPABASE_KEY}"})
    rows = json.loads(urllib.request.urlopen(req, timeout=20).read())
    return rows[0] if rows else None


def sb_patch(table, slug, fields, dry):
    if dry:
        print("  [dry-run] 반영 안 함. 바뀔 필드:", ", ".join(fields))
        for k, v in fields.items():
            print(f"    {k}: {str(v)[:80]}{'…' if len(str(v)) > 80 else ''}")
        return True
    q = f"{rp.SUPABASE_URL}/rest/v1/{table}?slug=eq.{quote(slug)}"
    req = urllib.request.Request(
        q, data=json.dumps(fields).encode(), method="PATCH", headers={
            "apikey": rp.SUPABASE_KEY, "Authorization": f"Bearer {rp.SUPABASE_KEY}",
            "Content-Type": "application/json", "Prefer": "return=representation"})
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=30).read())
        return bool(resp)
    except Exception as e:
        print(f"  ! 발행 실패: {e}")
        return False


def _log(action, table, slug):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"{datetime.now(timezone.utc).astimezone():%F %T}  {action}  {table}/{slug}\n")


# ── 모드 1: 제목·메타 직접 반영 ────────────────────────────────
def apply_title(url, title, excerpt, dry):
    table, slug = table_slug(url)
    row = sb_get(table, slug)
    if not row:
        sys.exit(f"글을 못 찾음: {table}/{slug}")
    fields = {}
    if title:
        print(f"현재 제목: {row['title']}\n새 제목:   {title}")
        fields["title"] = title
    if excerpt is not None and "excerpt" in row:
        fields["excerpt"] = excerpt
    if table == "engineer_guides":
        fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    if not fields:
        sys.exit("바꿀 내용 없음 (--title 또는 --excerpt 지정)")
    if sb_patch(table, slug, fields, dry) and not dry:
        _log("title", table, slug)
        print("✓ 반영됨 (slug·URL 유지)")


# ── 모드 2: LLM 리라이트 → 스테이징(발행 안 함) ────────────────
_SYS = (
    "너는 기술 블로그 에디터다. 이미 검색 노출되는 기존 글을 '리프레시'해 순위·CTR 을 "
    "올린다. 주제·핵심 정보는 유지하되, 1차 출처·의사결정표·실행 가능한 코드/예상결과·"
    "검색의도에 맞는 도입부 즉답을 보강한다. 본문 H1(#) 금지(##부터). 확인 불가한 1인칭 경험 "
    "서술·과장 표현 금지. 출력은 다음 형식만:\n"
    "TITLE: <개선 제목>\nEXCERPT: <메타 설명 70~80자>\n---\n<개선된 마크다운 본문>"
)


def apply_rewrite(url):
    table, slug = table_slug(url)
    row = sb_get(table, slug)
    if not row:
        sys.exit(f"글을 못 찾음: {table}/{slug}")
    topic = rp.rf.slug_to_topic(url)
    rag = rp.rf.rag_refresh_points(topic, k=3)
    user = (
        f"제목: {row['title']}\n참고 원칙(사내 지식): {', '.join(rag) or '없음'}\n\n"
        f"현재 본문:\n{(row.get('content') or '')[:6000]}\n\n"
        "위 글을 리프레시해 형식대로 출력하라.")
    out = rp.ollama_chat(_SYS, user, timeout=400)

    m = re.search(r"TITLE:\s*(.+)", out)
    e = re.search(r"EXCERPT:\s*(.+)", out)
    body = out.split("---", 1)[1].strip() if "---" in out else out
    stamp = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d")
    outdir = ROOT / "refresh_proposals" / stamp / "applied"
    outdir.mkdir(parents=True, exist_ok=True)
    fp = outdir / f"{slug[:60]}.final.md"
    fp.write_text(
        f"---\nurl: {url}\ntitle: {(m.group(1).strip() if m else row['title'])}\n"
        f"excerpt: {(e.group(1).strip() if e else '')}\n---\n{body}\n",
        encoding="utf-8")
    print(f"✓ 리라이트 → 스테이징(발행 안 함): {fp}\n"
          f"  검토·수정 후:  python3 scripts/refresh_apply.py --publish {fp}")


# ── 모드 3: 스테이징 최종본 발행 ──────────────────────────────
def publish_final(path, dry):
    raw = Path(path).read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.DOTALL)
    if not m:
        sys.exit("frontmatter(--- ---) 형식이 아님")
    fm, body = m.group(1), m.group(2).strip()
    meta = {}
    for line in fm.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    url = meta.get("url", "")
    if not url:
        sys.exit("frontmatter 에 url 이 없음")
    table, slug = table_slug(url)
    fields = {"title": meta.get("title", ""), "content": body}
    if meta.get("excerpt") and table == "posts":
        fields["excerpt"] = meta["excerpt"]
    if table == "engineer_guides":
        fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    print(f"발행 대상: {table}/{slug}  (제목: {fields['title'][:50]})")
    if sb_patch(table, slug, fields, dry) and not dry:
        _log("publish", table, slug)
        print("✓ 발행됨 (slug·URL 유지)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url", nargs="?", help="대상 글 URL")
    ap.add_argument("--title")
    ap.add_argument("--excerpt")
    ap.add_argument("--rewrite", action="store_true")
    ap.add_argument("--publish", metavar="FINAL_MD")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    if not (rp.SUPABASE_URL and rp.SUPABASE_KEY):
        sys.exit("Supabase 설정 없음(.env.local)")
    if a.publish:
        return publish_final(a.publish, a.dry_run)
    if not a.url:
        sys.exit("URL 또는 --publish 필요")
    if a.rewrite:
        return apply_rewrite(a.url)
    return apply_title(a.url, a.title, a.excerpt, a.dry_run)


if __name__ == "__main__":
    main()
