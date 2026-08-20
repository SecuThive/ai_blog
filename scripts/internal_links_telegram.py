#!/usr/bin/env python3
"""내부링크 · 카니벌라이제이션 → 텔레그램 승인 (blog-approval 봇 rf/rfx 재사용).

발행글에서 '관련 높은데 본문에 링크 안 된 글'을 골라, 글 끝에 마크다운 `## 관련 글` 섹션을
붙이는 **콘텐츠 변경 제안**을 만들어 폰 승인 큐에 올린다. 유사도 ≥0.82(거의 같은 글 =
카니벌라이제이션)는 대표글로 신호를 모으는 자리라 📌 로 먼저·강조한다.

  · slug(URL)는 안 바꾸고 content 만 바꾼다 → 봇 apply_refresh(type=rewrite)가 그대로 처리
  · 선택 근거는 site-knowledge/blog/data/blog_docs.json 의 related/linked/clicks 재사용(재임베딩 X)
  · 현재 본문은 Supabase 에서 가져와 섹션을 덧붙인다(마커로 재실행 시 교체 — 중복 방지)
  · **파괴적 병합/삭제는 안 한다** — 교차링크로 신호만 모은다(진짜 통합은 사람이 판단)

    python3 scripts/internal_links_telegram.py --dry-run        # 무엇을 보낼지 미리보기
    python3 scripts/internal_links_telegram.py -n 5             # 상위 5건 승인 요청
    python3 scripts/internal_links_telegram.py --dups-only -n 8 # 카니벌라이제이션만
"""
import argparse
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOG_DOCS = Path("/Users/mainthive/claude-web-workspace/site-knowledge/blog/data/blog_docs.json")
QUEUE = Path(os.getenv("REFRESH_APPROVAL_QUEUE",
             os.path.expanduser("~/project/SAFESUARE/backend/refresh_approvals.json")))
X_SETTINGS = Path(os.path.expanduser("~/project/SAFESUARE/backend/x_telegram_settings.json"))

DUP_MIN = 0.82          # 이보다 높으면 카니벌라이제이션(거의 같은 글)
MARK_A, MARK_B = "<!-- related-links -->", "<!-- /related-links -->"


def _env():
    env = dict(os.environ)
    f = ROOT / ".env.local"
    if f.exists():
        for l in f.read_text(encoding="utf-8").splitlines():
            l = l.strip()
            if "=" in l and not l.startswith("#"):
                k, _, v = l.partition("=")
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


ENV = _env()
SU = ENV.get("SUPABASE_URL", "").rstrip("/")
SK = ENV.get("SUPABASE_SERVICE_ROLE_KEY", "")


def fetch_content(table, slug):
    q = f"{SU}/rest/v1/{table}?" + urllib.parse.urlencode(
        {"slug": f"eq.{slug}", "select": "content"})
    req = urllib.request.Request(q, headers={"apikey": SK, "Authorization": f"Bearer {SK}"})
    rows = json.loads(urllib.request.urlopen(req, timeout=30).read())
    return rows[0]["content"] if rows else None


def _tg_cfg():
    try:
        s = json.loads(X_SETTINGS.read_text(encoding="utf-8"))
        return s.get("telegram_bot_token", ""), str(s.get("telegram_chat_id", ""))
    except Exception:
        return "", ""


def esc(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _send(token, chat, text, item_id):
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=json.dumps({
            "chat_id": chat, "text": text[:3900], "parse_mode": "HTML",
            "disable_web_page_preview": True,
            "reply_markup": {"inline_keyboard": [[
                {"text": "✅ 적용", "callback_data": f"rf:{item_id}"},
                {"text": "❌ 건너뛰기", "callback_data": f"rfx:{item_id}"}]]},
        }).encode(), headers={"Content-Type": "application/json"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=15).read()).get("ok", False)
    except Exception as e:
        print("텔레그램 전송 실패:", e)
        return False


def path_of(doc_id):
    """'section:slug' → '/section/slug' (라이브 상대경로)."""
    sec, _, slug = doc_id.partition(":")
    return f"/{sec}/{slug}"


def _anchor(title):
    """마크다운 링크 텍스트용 — 대괄호는 링크 파싱을 깨뜨리므로 제거."""
    return re.sub(r"[\[\]]", "", title).strip()


def build_section(targets):
    lines = ["## 관련 글", ""]
    for t in targets:
        star = "📌 " if t["dup"] else ""
        lines.append(f"- {star}[{_anchor(t['title'])}]({path_of(t['id'])})")
    return MARK_A + "\n" + "\n".join(lines) + "\n" + MARK_B


def apply_section(content, section):
    """마커가 있으면 교체(중복 방지), 없으면 글 끝에 추가."""
    if MARK_A in content and MARK_B in content:
        return re.sub(re.escape(MARK_A) + r".*?" + re.escape(MARK_B), lambda _: section,
                      content, flags=re.S)
    return content.rstrip() + "\n\n" + section + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=5, help="승인 요청 글 수")
    ap.add_argument("--per", type=int, default=3, help="글당 추가 링크 수")
    ap.add_argument("--dups-only", action="store_true", help="카니벌라이제이션 쌍만")
    ap.add_argument("--dry-run", action="store_true", help="전송 없이 미리보기")
    a = ap.parse_args()

    if not SU or not SK:
        sys.exit("Supabase 자격정보 없음(.env.local)")
    if not BLOG_DOCS.exists():
        sys.exit("발행글 색인 없음 — build_blog_index.py 먼저 실행")

    docs = json.loads(BLOG_DOCS.read_text(encoding="utf-8"))["docs"]

    # 후보: 관련 높은데 미링크된 글이 있는 소스. 카니벌라이제이션 보유 → 트래픽 순.
    cands = []
    for d in docs:
        unlinked = [r for r in d.get("related", []) if not r["linked"]]
        if not unlinked:
            continue
        has_dup = any(r["score"] >= DUP_MIN for r in unlinked)
        if a.dups_only and not has_dup:
            continue
        cands.append((d, unlinked, has_dup))
    cands.sort(key=lambda x: (0 if x[2] else 1, -x[0]["clicks"]))

    token, chat = _tg_cfg()
    if not a.dry_run and (not token or not chat):
        sys.exit("텔레그램 설정 없음 (x_telegram_settings.json)")

    try:
        q = json.loads(QUEUE.read_text(encoding="utf-8"))
    except Exception:
        q = {"items": {}}
    q.setdefault("items", {})

    sent = 0
    for d, unlinked, has_dup in cands:
        if sent >= a.n:
            break
        table = "engineer_guides" if d["section"] == "engineer" else "posts"
        # 대상: 카니벌 먼저, 그다음 유사도 높은 순
        picks = sorted(unlinked, key=lambda r: (0 if r["score"] >= DUP_MIN else 1, -r["score"]))[:a.per]
        targets = [{"id": r["id"], "title": r["title"], "score": r["score"],
                    "dup": r["score"] >= DUP_MIN} for r in picks]
        try:
            content = fetch_content(table, d["slug"])
        except Exception as e:
            print(f"! 본문 조회 실패 {d['slug']}: {e}")
            continue
        if not content:
            continue
        new_content = apply_section(content, build_section(targets))
        if new_content == content:
            continue

        item = {"type": "rewrite", "table": table, "slug": d["slug"],
                "new_content": new_content, "status": "pending",
                "kind": "internal_link"}
        item_id = datetime.now(timezone.utc).strftime("%m%d%H%M%S") + f"L{sent}"

        kind = "카니벌라이제이션 통합" if has_dup else "관련글 연결"
        lines = "\n".join(
            f" {'📌' if t['dup'] else '•'} {esc(t['title'][:38])} (유사 {round(t['score']*100)}%)"
            for t in targets)
        text = (f"🔗 <b>내부링크 승인 · {kind}</b>\n"
                f"📄 {esc(d['title'][:52])}\n"
                f"📈 클릭 {d['clicks']} · /{'engineer' if table=='engineer_guides' else 'blog'}/{esc(d['slug'])}\n\n"
                f"글 끝에 <b>관련 글</b> 링크 추가:\n{lines}")

        if a.dry_run:
            print(f"[{kind}] {d['title'][:44]} (클릭 {d['clicks']})")
            for t in targets:
                print(f"    {'📌' if t['dup'] else '→'} [{t['score']:.2f}] {t['title'][:44]}  {path_of(t['id'])}")
            sent += 1
            continue

        q["items"][item_id] = item
        if _send(token, chat, text, item_id):
            sent += 1
            print(f"  전송: {d['slug']}  (+{len(targets)} 링크{' · 카니벌' if has_dup else ''})")

    if not a.dry_run:
        QUEUE.parent.mkdir(parents=True, exist_ok=True)
        QUEUE.write_text(json.dumps(q, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n{sent}건 텔레그램 승인 요청 → 큐 {QUEUE}")
    else:
        print(f"\n[미리보기] {sent}건 (전송 안 함)")


if __name__ == "__main__":
    main()
