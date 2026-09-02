#!/usr/bin/env python3
"""리프레시 파이프라인 — 측정→분석→**초안 생성**→승인 큐 (발행은 사람).

반자동 루프의 자동 부분. GSC 실측으로 리프레시 최우선 글을 뽑고(refresh_finder),
각 글의 현재 제목·본문을 Supabase 에서 가져와, 사이트 관리 RAG 근거 + Claude API(키 없으면 로컬 LLM 폴백)로
**개선 제안(제목안·보강 체크리스트)** 을 만들어 `refresh_proposals/<날짜>/` 에 쌓는다.

발행은 하지 않는다 — 사람이 제안을 확인·수정·발행한다(E-E-A-T '사람 검토' 신호 유지).

    python3 scripts/refresh_pipeline.py            # 상위 5편 제안 생성
    python3 scripts/refresh_pipeline.py -n 8
    python3 scripts/refresh_pipeline.py --no-llm   # LLM 없이 RAG 체크리스트만(빠름)

cron(pm2)으로 주기 실행. GSC 자동 수집은 gsc_fetch.py 가 앞단에서 CSV 를 갱신한다.
"""
import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refresh_finder as rf   # 분석 로직 재사용

ROOT = Path(__file__).resolve().parent.parent
PROPOSAL_DIR = ROOT / "refresh_proposals"
OLLAMA = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
LLM_MODEL = os.getenv("REFRESH_LLM_MODEL", "qwen2.5:14b")
CLAUDE_MODEL = os.getenv("REFRESH_CLAUDE_MODEL", "claude-sonnet-4-6")


def _env():
    env = {}
    p = ROOT / ".env.local"
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = _env()
SUPABASE_URL = (ENV.get("SUPABASE_URL") or ENV.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_KEY = ENV.get("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "")


def fetch_post(url: str) -> dict | None:
    """URL → 현재 글(title, content). /blog/→posts, /engineer/→engineer_guides."""
    parts = url.rstrip("/").split("/")
    slug, section = parts[-1], (parts[-2] if len(parts) >= 2 else "")
    table = "engineer_guides" if section == "engineer" else "posts"
    try:
        from urllib.parse import quote
        q = f"{SUPABASE_URL}/rest/v1/{table}?slug=eq.{quote(slug)}&select=title,content&limit=1"
        req = urllib.request.Request(q, headers={
            "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
        rows = json.loads(urllib.request.urlopen(req, timeout=20).read())
        return rows[0] if rows else None
    except Exception:
        return None


import re as _re

# 한국어에 안 쓰는 중국어(간체) 글자 감지 — qwen 계열이 가끔 섞는다. 감지되면 1회 재시도.
_CJK = _re.compile(r"[一-鿿]")


def _ollama_once(system: str, user: str, timeout: int) -> str:
    req = urllib.request.Request(
        f"{OLLAMA}/api/chat",
        data=json.dumps({"model": LLM_MODEL, "stream": False,
                         "messages": [{"role": "system", "content": system},
                                      {"role": "user", "content": user}],
                         "options": {"temperature": 0.6}}).encode(),
        headers={"Content-Type": "application/json"})
    r = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
    return r["message"]["content"].strip()


def ollama_chat(system: str, user: str, timeout: int = 240) -> str:
    """qwen 이 중국어를 섞으면(한자 다수) 한국어 강제 지시를 덧붙여 1회 재시도한다."""
    try:
        out = _ollama_once(system, user, timeout)
        if len(_CJK.findall(out)) >= 3:   # 한자 3자 이상 = 중국어 섞임으로 간주
            out = _ollama_once(
                "★★★ 반드시 한국어로만 출력하라. 중국어·한자·일본어 문장은 절대 쓰지 마라. "
                "영문은 고유명사·기술약어만 허용.\n" + system, user, timeout)
        return out
    except Exception as e:
        return f"(LLM 제안 생성 실패: {e})"


def claude_chat(system: str, user: str, timeout: int = 120, max_tokens: int = 4096) -> str:
    """Claude API(Messages)로 생성. ANTHROPIC_API_KEY 필요."""
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=json.dumps({
            "model": CLAUDE_MODEL,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }).encode(),
        headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
        })
    r = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
    return "".join(b.get("text", "") for b in r.get("content", [])).strip()


def llm_chat(system: str, user: str, timeout: int = 240) -> str:
    """Claude 우선, ANTHROPIC_API_KEY 없거나 실패 시 로컬 Ollama 로 폴백(비차단 유지)."""
    if ANTHROPIC_KEY:
        try:
            return claude_chat(system, user, timeout=min(timeout, 180))
        except Exception as e:
            print(f"! Claude 호출 실패({e}) — Ollama 로 폴백")
    return ollama_chat(system, user, timeout)


_SYS = (
    "너는 기술 블로그 SEO 에디터다. 이미 검색에 노출되지만 순위·CTR 이 아쉬운 기존 글을 "
    "'리프레시'해 1페이지로 끌어올리는 개선안을 낸다. 새 글을 쓰지 말고, 기존 글을 어떻게 "
    "고칠지만 구체적으로 제안하라. 아래 형식으로만 출력한다:\n\n"
    "### 제목안 (3개)\n1. ...\n2. ...\n3. ...\n\n"
    "### 본문 보강 (우선순위)\n- ...\n\n### 메타 설명안\n..."
)


def build_proposal(c: dict, post: dict | None, use_llm: bool) -> str:
    lines = [f"# 리프레시 제안 — {c['topic']}", ""]
    lines.append(f"- URL: {c['url']}")
    lines.append(f"- 현재: 순위 {c['pos']:.1f} · 노출 {c['impr']:.0f} · CTR {c['ctr']*100:.1f}% · "
                 f"클릭 {c['clicks']:.0f}")
    lines.append(f"- 진단: **{c['issue']}** · 보강 시 +{c['gain']:.0f} 클릭 추정")
    if c.get("refresh_points"):
        lines.append(f"- RAG 근거: {', '.join(c['refresh_points'])}")
    lines.append("")
    cur_title = (post or {}).get("title", "(제목 조회 실패)")
    lines.append(f"**현재 제목:** {cur_title}")
    lines.append("")

    if use_llm and post:
        excerpt = (post.get("content") or "")[:1800]
        rag = rf.rag_refresh_points(c["topic"], k=3)
        user = (
            f"글 제목: {cur_title}\n"
            f"현재 순위 {c['pos']:.1f}위 · CTR {c['ctr']*100:.1f}% · 진단: {c['issue']}\n"
            f"참고 원칙(사내 지식 기반): {', '.join(rag) if rag else '없음'}\n\n"
            f"본문 발췌:\n{excerpt}\n\n"
            "위 글을 리프레시하는 제안을 형식대로 내라. "
            "진단이 '제목·메타'면 제목·메타 개선에 집중, '콘텐츠 보강'이면 1차 출처·"
            "의사결정표·코드/예상결과·검색의도 재정렬 중심으로."
        )
        lines.append(llm_chat(_SYS, user))
    else:
        lines.append("### 보강 체크리스트 (RAG 기준)")
        if c["issue"] == "제목·메타":
            lines += ["- 제목에 실제 검색 키워드 + 구체적 이득/숫자 배치",
                      "- 메타 설명: 이 글로 얻는 것 + 검색어 자연 포함 (70~80자)",
                      "- 낚시 금지 — 제목이 약속한 걸 본문이 지킬 것"]
        else:
            lines += ["- 실재하는 1차 공식 문서 문맥형 인용 추가",
                      "- 의사결정/비교 표 1개 이상",
                      "- 복사 실행 가능한 코드 + 예상 결과 + 실패 분기",
                      "- 검색 의도에 맞게 도입부에 즉답(역피라미드) 재배치",
                      "- 낡은 데이터·연도·죽은 링크 갱신"]
    lines.append("")
    lines.append("---\n_상태: 검토 대기 — 사람이 확인·수정 후 발행_")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=5, help="제안 생성할 상위 글 수")
    ap.add_argument("--min-impr", type=float, default=20)
    ap.add_argument("--no-llm", action="store_true", help="LLM 없이 체크리스트만")
    a = ap.parse_args()

    ranked = rf.analyze(rf.load_pages(a.min_impr))[:a.n]
    for c in ranked:
        c["refresh_points"] = rf.rag_refresh_points(c["topic"])

    stamp = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d")
    outdir = PROPOSAL_DIR / stamp
    outdir.mkdir(parents=True, exist_ok=True)

    index = [f"# 리프레시 제안 — {stamp}", "",
             f"GSC 분석 상위 {len(ranked)}편. 검토 후 발행하세요.", ""]
    for i, c in enumerate(ranked, 1):
        post = fetch_post(c["url"])
        md = build_proposal(c, post, use_llm=not a.no_llm)
        slug = c["url"].rstrip("/").split("/")[-1][:60]
        fn = f"{i:02d}-{slug}.md"
        (outdir / fn).write_text(md, encoding="utf-8")
        index.append(f"{i}. [{c['issue']}] +{c['gain']:.0f}클릭 · 순위 {c['pos']:.1f} · "
                     f"[{slug}]({fn})")
        print(f"  제안 생성: {fn}")

    (outdir / "INDEX.md").write_text("\n".join(index) + "\n", encoding="utf-8")
    print(f"\n{len(ranked)}편 제안 → {outdir}/  (INDEX.md 부터 검토)")


if __name__ == "__main__":
    main()
