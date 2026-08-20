#!/usr/bin/env python3
"""주간 GSC 추세 → 텔레그램 (지난주 vs 전주). blog-refresh(월 09:00)에 얹어 자동 전송.

GSC API(서비스계정)로 date·page 차원을 뽑아 최근 7일과 그 전 7일을 비교한다.
클릭·노출·CTR·평균순위 변화 + 뜨는 글/지는 글 상위. 버튼 없는 정보 메시지.

의존성(google-auth·httpx·urllib3)은 SAFESUARE 백엔드 venv 에 있다 — 그 venv 로 실행
(run_refresh.sh 가 GSC_PYTHON 으로 지정). 자격정보 없으면 조용히 종료(exit 0).

    GSC_PYTHON=~/project/SAFESUARE/backend/venv/bin/python3 python3 scripts/gsc_trend.py
    python3 scripts/gsc_trend.py --dry-run      # 전송 없이 출력만
"""
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import quote, unquote

ROOT = Path(__file__).resolve().parent.parent
X_SETTINGS = Path(os.path.expanduser("~/project/SAFESUARE/backend/x_telegram_settings.json"))
API = "https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"


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


def _skip(msg):
    print(f"gsc_trend 스킵: {msg}")
    sys.exit(0)


def _client(cred_path):
    try:
        import httpx
        import urllib3
        from google.oauth2 import service_account
        from google.auth.transport.urllib3 import Request as U3
    except Exception as e:
        _skip(f"google-auth/httpx 미설치 — GSC_PYTHON 을 백엔드 venv 로 ({e})")
    creds = service_account.Credentials.from_service_account_file(
        cred_path, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
    creds.refresh(U3(urllib3.PoolManager()))
    return httpx, {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}


def _q(httpx, headers, url, start, end, dims):
    body = {"startDate": start.isoformat(), "endDate": end.isoformat(),
            "dimensions": dims, "rowLimit": 5000}
    r = httpx.post(url, json=body, headers=headers, timeout=60)
    r.raise_for_status()
    return r.json().get("rows", [])


def _agg(rows):
    c = sum(r["clicks"] for r in rows)
    im = sum(r["impressions"] for r in rows)
    pos = (sum(r["position"] * r["impressions"] for r in rows) / im) if im else 0
    return c, im, pos


def _pages(rows):
    """page 행 → {slug: clicks}. 홈·섹션 인덱스는 제외(실제 글만)."""
    out = {}
    for r in rows:
        u = unquote(r["keys"][0]).rstrip("/")
        slug = u.split("/")[-1]
        # 홈(호스트)·섹션 인덱스(/blog, /engineer)는 '글'이 아니라 제외
        if "." in slug or slug in ("blog", "engineer", ""):
            continue
        out[slug] = out.get(slug, 0) + r["clicks"]
    return out


def _delta(cur, prev):
    d = cur - prev
    pct = (d / prev * 100) if prev else 0
    arrow = "▲" if d > 0 else ("▼" if d < 0 else "—")
    return f"{arrow}{abs(d):.0f}" + (f" ({pct:+.0f}%)" if prev else "")


def _tg(text, dry):
    if dry:
        print(text.replace("<b>", "").replace("</b>", ""))
        return
    try:
        s = json.loads(X_SETTINGS.read_text(encoding="utf-8"))
        tok, chat = s["telegram_bot_token"], s["telegram_chat_id"]
    except Exception as e:
        _skip(f"텔레그램 설정 없음 ({e})")
    import urllib.request
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{tok}/sendMessage",
        data=json.dumps({"chat_id": chat, "text": text[:3900], "parse_mode": "HTML",
                         "disable_web_page_preview": True}).encode(),
        headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=15)


def main():
    dry = "--dry-run" in sys.argv
    env = _env()
    site = env.get("GSC_SITE_URL", "")
    cred = env.get("GSC_SERVICE_ACCOUNT_JSON", "")
    if not site or not cred or not Path(cred).exists():
        _skip("GSC_SITE_URL / GSC_SERVICE_ACCOUNT_JSON 미설정")

    httpx, headers = _client(cred)
    url = API.format(site=quote(site, safe=""))

    # 최신 가용일 기준으로 창을 잡는다(GSC 2~3일 지연 흡수)
    drows = _q(httpx, headers, url, date.today() - timedelta(days=21), date.today(), ["date"])
    if not drows:
        _skip("데이터 없음")
    drows.sort(key=lambda r: r["keys"][0])
    end = date.fromisoformat(drows[-1]["keys"][0])
    this_s, this_e = end - timedelta(days=6), end
    prev_s, prev_e = end - timedelta(days=13), end - timedelta(days=7)

    by_date = {r["keys"][0]: r for r in drows}
    this_rows = [by_date[d.isoformat()] for d in (this_s + timedelta(n) for n in range(7)) if d.isoformat() in by_date]
    prev_rows = [by_date[d.isoformat()] for d in (prev_s + timedelta(n) for n in range(7)) if d.isoformat() in by_date]
    tc, ti, tp = _agg(this_rows)
    pc, pi, pp = _agg(prev_rows)

    # 페이지 변화(뜨는/지는 글)
    cur_p = _pages(_q(httpx, headers, url, this_s, this_e, ["page"]))
    prv_p = _pages(_q(httpx, headers, url, prev_s, prev_e, ["page"]))
    diffs = []
    for slug in set(cur_p) | set(prv_p):
        d = cur_p.get(slug, 0) - prv_p.get(slug, 0)
        if d:
            diffs.append((d, slug, cur_p.get(slug, 0)))
    ups = sorted([x for x in diffs if x[0] > 0], reverse=True)[:3]
    downs = sorted([x for x in diffs if x[0] < 0])[:3]

    ctr_cur = 100 * tc / ti if ti else 0
    ctr_prv = 100 * pc / pi if pi else 0
    lines = [
        f"📊 <b>thivelab 주간 검색 추세</b>  ({this_s:%m/%d}~{this_e:%m/%d})",
        f"클릭 {pc:.0f} → <b>{tc:.0f}</b>  {_delta(tc, pc)}",
        f"노출 {pi:.0f} → <b>{ti:.0f}</b>  {_delta(ti, pi)}",
        f"CTR {ctr_prv:.1f}% → <b>{ctr_cur:.1f}%</b>",
        f"평균순위 {pp:.1f} → <b>{tp:.1f}</b>" + ("  (개선 ↑)" if tp and tp < pp else ""),
    ]
    if ups:
        lines.append("\n📈 <b>오르는 글</b>")
        lines += [f" • {s[:38]}  +{int(d)}클릭" for d, s, _ in ups]
    if downs:
        lines.append("\n📉 <b>지는 글</b>")
        lines += [f" • {s[:38]}  {int(d)}클릭" for d, s, _ in downs]
    lines.append("\n<i>월요일 자동 리포트 · GSC 2~3일 지연</i>")

    _tg("\n".join(lines), dry)
    print(f"gsc_trend {'출력' if dry else '전송'} 완료: 클릭 {pc:.0f}→{tc:.0f}")


if __name__ == "__main__":
    main()
