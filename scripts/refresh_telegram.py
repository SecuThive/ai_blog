#!/usr/bin/env python3
"""리프레시 → 텔레그램 승인. GSC 상위 후보를 구체적 '적용 가능한 변경'으로 만들어
공유 승인 큐에 쌓고, 텔레그램으로 ✅적용/❌건너뛰기 버튼을 보낸다.

신규글 승인 봇(SAFESUARE/backend/telegram_approval_bot.py)이 rf:<id>/rfx:<id> 콜백을
처리해 라이브 글에 적용한다(제목은 PATCH, 본문은 rewrite된 전체 교체). slug(URL)는 불변.

  [제목·메타] 후보 → LLM이 개선 제목·메타 1개 생성 → type=title 큐
  [콘텐츠 보강] 후보 → LLM이 본문 전체 리라이트 → type=rewrite 큐

    python3 scripts/refresh_telegram.py            # 상위 3편
    python3 scripts/refresh_telegram.py -n 5 --no-content   # 제목류만(빠름·저위험)

pm2 blog-refresh(주간)에서 실행. 봇이 적용 시점에 revalidate 한다.
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import refresh_finder as rf
import refresh_pipeline as rp   # Supabase fetch·Ollama·ENV 재사용

# 봇과 공유하는 승인 큐 (봇이 읽어 적용). 경로는 env 로 오버라이드 가능.
QUEUE = Path(os.getenv(
    "REFRESH_APPROVAL_QUEUE",
    os.path.expanduser("~/project/SAFESUARE/backend/refresh_approvals.json")))

X_SETTINGS = Path(os.path.expanduser("~/project/SAFESUARE/backend/x_telegram_settings.json"))


def _tg_cfg():
    try:
        s = json.loads(X_SETTINGS.read_text(encoding="utf-8"))
        return s.get("telegram_bot_token", ""), str(s.get("telegram_chat_id", ""))
    except Exception:
        return "", ""


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
        print("텔레그램 전송 실패:", e); return False


def esc(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


_KO_ONLY = "★반드시 한국어로만 출력. 중국어(한자)·일본어 문장 절대 금지(영문 고유명사·약어만 허용).\n"
_TITLE_SYS = (
    _KO_ONLY +
    "너는 기술 블로그 SEO 에디터다. 이미 검색 노출되지만 CTR 이 낮은 글의 제목·메타만 "
    "개선한다. 본문은 손대지 마라. 출력은 형식만:\nTITLE: <개선 제목>\nEXCERPT: <메타 70~80자>")


def _gen_title(cur_title, topic):
    rag = rf.rag_refresh_points(topic, 2)
    out = rp.ollama_chat(_TITLE_SYS,
                         f"현재 제목: {cur_title}\n참고 원칙: {', '.join(rag) or '없음'}\n"
                         "검색될 키워드+구체적 이득/숫자를 넣어 개선하라.")
    t = re.search(r"TITLE:\s*(.+)", out)
    e = re.search(r"EXCERPT:\s*(.+)", out)
    return (t.group(1).strip() if t else ""), (e.group(1).strip() if e else "")


_REWRITE_SYS = (
    _KO_ONLY +
    "너는 기술 블로그 에디터다. 검색 노출되는 기존 글을 리프레시해 순위를 올린다. 주제·핵심은 "
    "유지하되 1차 출처·의사결정표·실행 코드/예상결과·검색의도 도입부 즉답을 보강한다. 본문 H1(#) "
    "금지(##부터). 1인칭 경험·과장 금지. 출력 형식만:\nTITLE: ...\nEXCERPT: ...\n---\n<개선 마크다운 본문>")


def _gen_rewrite(cur_title, content, topic):
    rag = rf.rag_refresh_points(topic, 3)
    out = rp.ollama_chat(_REWRITE_SYS,
                         f"제목: {cur_title}\n참고 원칙: {', '.join(rag) or '없음'}\n\n"
                         f"현재 본문:\n{content[:6000]}\n\n형식대로 리프레시하라.", timeout=400)
    t = re.search(r"TITLE:\s*(.+)", out)
    e = re.search(r"EXCERPT:\s*(.+)", out)
    body = out.split("---", 1)[1].strip() if "---" in out else out
    return (t.group(1).strip() if t else cur_title), (e.group(1).strip() if e else ""), body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=3)
    ap.add_argument("--min-impr", type=float, default=20)
    ap.add_argument("--no-content", action="store_true", help="제목·메타 후보만(본문 리라이트 생략)")
    a = ap.parse_args()

    token, chat = _tg_cfg()
    if not token or not chat:
        sys.exit("텔레그램 설정 없음 (x_telegram_settings.json)")

    ranked = rf.analyze(rf.load_pages(a.min_impr))
    # 큐 로드
    try:
        q = json.loads(QUEUE.read_text(encoding="utf-8"))
    except Exception:
        q = {"items": {}}
    q.setdefault("items", {})

    sent = 0
    for c in ranked:
        if sent >= a.n:
            break
        table = "engineer_guides" if "/engineer/" in c["url"] else "posts"
        slug = c["url"].rstrip("/").split("/")[-1]
        post = rp.fetch_post(c["url"])
        if not post:
            continue
        cur_title = post.get("title", "")

        if c["issue"] == "제목·메타":
            new_title, new_excerpt = _gen_title(cur_title, c["topic"])
            if not new_title:
                continue
            item = {"type": "title", "table": table, "slug": slug, "new_title": new_title,
                    "new_excerpt": new_excerpt, "status": "pending"}
            body_preview = (f"현재: {esc(cur_title)}\n제안: <b>{esc(new_title)}</b>\n\n"
                            f"메타: <i>{esc(new_excerpt)}</i>")
        else:
            if a.no_content:
                continue
            new_title, new_excerpt, new_content = _gen_rewrite(cur_title, post.get("content", ""), c["topic"])
            item = {"type": "rewrite", "table": table, "slug": slug, "new_title": new_title,
                    "new_excerpt": new_excerpt, "new_content": new_content, "status": "pending"}
            body_preview = (f"제목: <b>{esc(new_title)}</b>\n\n본문 리라이트 미리보기:\n"
                            f"<pre>{esc(new_content[:600])}…</pre>")

        item_id = datetime.now(timezone.utc).strftime("%m%d%H%M%S") + f"{sent}"
        q["items"][item_id] = item
        text = (f"🔧 <b>리프레시 승인 · {'제목·메타' if item['type']=='title' else '본문 보강'}</b>\n"
                f"📈 순위 {c['pos']:.1f} · 노출 {c['impr']:.0f} · CTR {c['ctr']*100:.1f}% → +{c['gain']:.0f}클릭\n"
                f"🔗 /{'engineer' if table=='engineer_guides' else 'blog'}/{esc(slug)}\n\n{body_preview}")
        if _send(token, chat, text, item_id):
            sent += 1
            print(f"  전송: [{item['type']}] {slug}")

    QUEUE.parent.mkdir(parents=True, exist_ok=True)
    QUEUE.write_text(json.dumps(q, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{sent}건 텔레그램 승인 요청 → 큐 {QUEUE}")


if __name__ == "__main__":
    main()
