#!/usr/bin/env python3
"""GSC 자동 수집 — Search Console API → `GSC CSV/*.csv` (파이프라인이 읽는 포맷).

리프레시 파이프라인의 데이터 층. 지금은 CSV 를 수동 내보냈지만, 서비스 계정 1회 설정하면
cron 이 매주 최신 데이터를 직접 끌어온다.

설정(1회, 사람이):
  1. Google Cloud 콘솔 → 프로젝트 → "Search Console API" 사용 설정
  2. 서비스 계정 생성 → JSON 키 다운로드
  3. Search Console → 속성 설정 → 사용자·권한 → 서비스 계정 이메일을 **전체(또는 제한)**로 추가
  4. .env.local 에 추가:
       GSC_SERVICE_ACCOUNT_JSON=/절대경로/service-account.json
       GSC_SITE_URL=https://www.thivelab.com     (또는 sc-domain:thivelab.com)
  5. google-auth 설치: `pip install google-auth requests`
     (또는 run_refresh.sh 에서 GSC_PYTHON 을 google-auth 있는 venv 로 지정)

미설정·미설치면 **안내만 하고 조용히 종료(비차단)** — 파이프라인은 기존 CSV 로 계속된다.

    python3 scripts/gsc_fetch.py            # 최근 28일
    python3 scripts/gsc_fetch.py --days 90
"""
import argparse
import csv
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GSC_DIR = ROOT / "GSC CSV"
API = "https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"


def _env():
    env = dict(os.environ)
    p = ROOT / ".env.local"
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    return env


def _skip(msg: str):
    print(f"[gsc_fetch] 건너뜀 — {msg}\n  설정법은 이 파일 상단 주석 참고. "
          f"기존 GSC CSV 로 파이프라인은 계속됩니다.")
    sys.exit(0)   # 비차단: cron 이 멈추지 않게 0 종료


def fetch(site, cred_path, days):
    # requests 대신 httpx + urllib3 트랜스포트를 쓴다 — SAFESUARE 백엔드 venv 로 바로 실행 가능
    # (google-auth·httpx·urllib3 는 있고 requests 는 없다). GSC_PYTHON 으로 그 venv 지정.
    try:
        import httpx
        import urllib3 as _urllib3
        from google.oauth2 import service_account
        from google.auth.transport.urllib3 import Request as _U3Request
    except Exception:
        _skip("google-auth/httpx 미설치 — GSC_PYTHON 을 백엔드 venv 로 지정하거나 "
              "pip install google-auth httpx")

    from urllib.parse import quote as _quote
    creds = service_account.Credentials.from_service_account_file(
        cred_path, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
    creds.refresh(_U3Request(_urllib3.PoolManager()))   # 서비스계정 → 액세스 토큰
    headers = {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}

    end = date.today()
    start = end - timedelta(days=days)
    url = API.format(site=_quote(site, safe=""))

    def query(dimension):
        body = {"startDate": start.isoformat(), "endDate": end.isoformat(),
                "dimensions": [dimension], "rowLimit": 5000}
        r = httpx.post(url, json=body, headers=headers, timeout=60)
        r.raise_for_status()
        return r.json().get("rows", [])

    return query("page"), query("query")


def write_csv(path: Path, header_key: str, rows):
    """GSC rows → 파이프라인 포맷 CSV (인기X,클릭수,노출,CTR,게재 순위)."""
    GSC_DIR.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow([header_key, "클릭수", "노출", "CTR", "게재 순위"])
        from urllib.parse import unquote
        for r in sorted(rows, key=lambda x: -x.get("clicks", 0)):
            key = r["keys"][0]
            # 페이지 URL 은 API 가 퍼센트 인코딩해 준다 → 디코딩해 DB slug(한글)와 맞춘다.
            # (수동 UI 내보내기와 동일 포맷. 검색어는 그대로.)
            if key.startswith("http"):
                key = unquote(key)
            w.writerow([key, int(r.get("clicks", 0)), int(r.get("impressions", 0)),
                        f"{r.get('ctr', 0) * 100:.2f}%", f"{r.get('position', 0):.2f}"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=28)
    a = ap.parse_args()

    env = _env()
    site = env.get("GSC_SITE_URL", "")
    cred = env.get("GSC_SERVICE_ACCOUNT_JSON", "")
    if not site or not cred:
        _skip("GSC_SITE_URL / GSC_SERVICE_ACCOUNT_JSON 미설정")
    if not os.path.exists(cred):
        _skip(f"서비스 계정 JSON 경로 없음: {cred}")

    pages, queries = fetch(site, cred, a.days)
    write_csv(GSC_DIR / "페이지.csv", "인기 페이지", pages)
    write_csv(GSC_DIR / "검색어 수.csv", "인기 검색어", queries)
    print(f"[gsc_fetch] 갱신 완료 — 페이지 {len(pages)} · 검색어 {len(queries)} "
          f"(최근 {a.days}일, {site})")


if __name__ == "__main__":
    main()
