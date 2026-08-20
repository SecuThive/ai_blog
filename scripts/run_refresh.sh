#!/usr/bin/env bash
# 리프레시 반자동 루프 (pm2 cron 으로 매주 실행) — 측정→분석→초안 생성.
# 발행은 하지 않는다. refresh_proposals/<날짜>/ 에 제안이 쌓이면 사람이 검토·발행.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

LOG="refresh_proposals/run.log"
mkdir -p refresh_proposals
exec >>"$LOG" 2>&1
echo "═══ $(date '+%F %T') 리프레시 루프 시작 ═══"

# 1) GSC 자동 수집 (미설정 시 스스로 건너뛰고 기존 CSV 유지 — 비차단)
#    google-auth 가 있는 파이썬을 GSC_PYTHON 으로 지정 가능(기본 python3)
GSC_PYTHON="${GSC_PYTHON:-/Users/mainthive/project/SAFESUARE/backend/venv/bin/python}"
"$GSC_PYTHON" scripts/gsc_fetch.py || echo "! GSC 수집 스킵/실패 (계속)"

# 2) 분석 + 초안 생성 → 승인 큐
# 리프레시 → 텔레그램 승인 요청(제목류+본문). 발행은 봇이 승인 시 적용.
python3 scripts/refresh_telegram.py -n 5 || echo "! 텔레그램 리프레시 실패"

# 3) 주간 검색 추세 리포트 → 텔레그램(정보 전송, 버튼 없음). google-auth 필요라 GSC_PYTHON.
"$GSC_PYTHON" scripts/gsc_trend.py || echo "! GSC 추세 리포트 스킵/실패 (계속)"

echo "═══ $(date '+%F %T') 완료 ═══"
tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
