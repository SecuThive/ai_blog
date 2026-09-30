"""Syntax-only audit of published code fences from the local DB snapshot.

No snippet is executed. Run the read-only DB audit first to refresh the snapshot.
"""
import ast
import json
import re
import subprocess
import sys
from pathlib import Path

audit = json.loads(Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/nodelog-content-audit-2026-09-30.json').read_text())
fence = re.compile(r'^```([^\n]*)\n(.*?)^```\s*$', re.MULTILINE | re.DOTALL)
issues = []
counts = {}
for post in audit['posts']:
  for scope, body in [('ko', post.get('content') or ''), ('en', (post.get('content_evidence') or {}).get('en', {}).get('content') or '')]:
    for n, match in enumerate(fence.finditer(body), 1):
        lang = match.group(1).strip().lower().split(' ')[0]
        code = match.group(2)
        counts[lang] = counts.get(lang, 0) + 1
        if not code.strip() or re.search(r'(^|\n)\s*(\.\.\.|# .*생략|// .*omitted)', code):
            continue
        try:
            if lang in ('python', 'py'):
                ast.parse(code)
            elif lang == 'json':
                json.loads(code)
            elif lang in ('bash', 'sh', 'shell'):
                result = subprocess.run(['bash', '-n'], input=code, text=True, capture_output=True)
                if result.returncode:
                    raise SyntaxError(result.stderr.strip().splitlines()[-1])
        except (SyntaxError, ValueError, json.JSONDecodeError) as exc:
            issues.append({'id': post['id'], 'scope': scope, 'title': post['title'], 'fence': n, 'lang': lang,
                           'error': str(exc).splitlines()[0], 'sample': code[:140]})
Path('/tmp/nodelog-code-block-audit-2026-09-30.json').write_text(json.dumps(issues, ensure_ascii=False, indent=2))
print('fences:', sum(counts.values()), 'languages:', counts)
print('syntax issues:', len(issues))
for issue in issues[:60]:
    print(f"#{issue['id']} {issue['scope']} block {issue['fence']} {issue['lang']}: {issue['error']}")
