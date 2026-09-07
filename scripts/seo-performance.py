#!/usr/bin/env python3
"""Read-only GSC comparison: complete date totals, page totals, country/query opportunities.

Run with the google-auth/httpx-enabled Python used by scripts/gsc_trend.py.
Writes only the requested local JSON file; sends no messages and changes no content.
"""
import argparse
import json
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import quote

import gsc_trend as gsc


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--end', type=date.fromisoformat, help='Last complete date (YYYY-MM-DD)')
    parser.add_argument('--days', type=int, default=28)
    parser.add_argument('--country', default='kor')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not 1 <= args.days <= 90:
        parser.error('--days must be between 1 and 90')
    env = gsc._env()
    if not env.get('GSC_SITE_URL') or not Path(env.get('GSC_SERVICE_ACCOUNT_JSON', '')).is_file():
        parser.error('GSC_SITE_URL and GSC_SERVICE_ACCOUNT_JSON must be configured')
    httpx, headers = gsc._client(env['GSC_SERVICE_ACCOUNT_JSON'])
    url = gsc.API.format(site=quote(env['GSC_SITE_URL'], safe=''))

    def query(start, end, dimensions, country=None):
        body = {'startDate': start.isoformat(), 'endDate': end.isoformat(),
                'dimensions': dimensions, 'dataState': 'final', 'rowLimit': 25000}
        if country:
            body['dimensionFilterGroups'] = [{'filters': [
                {'dimension': 'country', 'operator': 'equals', 'expression': country}]}]
        rows = []
        # Pagination avoids the API row limit; anonymized/omitted rows remain unavailable.
        while True:
            body['startRow'] = len(rows)
            response = httpx.post(url, json=body, headers=headers, timeout=50)
            response.raise_for_status()
            page = response.json().get('rows', [])
            rows.extend(page)
            if len(page) < body['rowLimit']:
                return rows

    recent = query(date.today() - timedelta(days=14), date.today(), ['date'])
    if not recent:
        parser.error('No finalized GSC dates returned')
    latest = date.fromisoformat(max(row['keys'][0] for row in recent))
    end = args.end or latest
    if end > latest:
        parser.error(f'Latest finalized date is {latest}; incomplete periods are not compared')
    output = {'site': env['GSC_SITE_URL'], 'country': args.country, 'days': args.days,
              'latest_final_date': latest.isoformat(),
              'limitations': 'Date totals are authoritative for site trend. Country/page/query '
              'rows can omit anonymized data; do not sum them as total traffic or compare '
              'their CTR directly with site CTR. Page impressions also use page aggregation.',
              'periods': {}}
    for name, period_end in [('current', end), ('previous', end - timedelta(days=args.days))]:
        start = period_end - timedelta(days=args.days - 1)
        data = {'start': str(start), 'end': str(period_end)}
        data['daily_all'] = query(start, period_end, ['date'])
        data['daily_country'] = query(start, period_end, ['date'], args.country)
        data['pages_all'] = query(start, period_end, ['page'])
        data['page_queries_country'] = query(start, period_end, ['page', 'query'], args.country)
        for scope in ['all', 'country']:
            clicks, impressions, position = gsc._agg(data[f'daily_{scope}'])
            data[f'totals_{scope}'] = {'clicks': clicks, 'impressions': impressions,
                'ctr': clicks / impressions if impressions else 0, 'position': position}
        output['periods'][name] = data
        print(name, start, period_end, json.dumps(data['totals_country']))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Saved {args.output}; query rows are a partial view, not total traffic.')


if __name__ == '__main__':
    main()
