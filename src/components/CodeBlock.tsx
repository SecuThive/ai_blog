'use client';

import { useState } from 'react';

const LANG_LABELS: Record<string, string> = {
  bash: 'Bash', sh: 'Shell', shell: 'Shell',
  yaml: 'YAML', yml: 'YAML',
  json: 'JSON', jsonc: 'JSON',
  ini: 'INI', toml: 'TOML', conf: 'Config',
  nginx: 'Nginx',
  sql: 'SQL',
  python: 'Python', py: 'Python',
  javascript: 'JavaScript', js: 'JavaScript',
  typescript: 'TypeScript', ts: 'TypeScript',
  dockerfile: 'Dockerfile',
  go: 'Go', rust: 'Rust',
  xml: 'XML', html: 'HTML', css: 'CSS',
};

// bash 계열에서 줄을 comment / prompt / code 로 분류
function classifyLine(line: string, lang?: string): string {
  if (!lang || !['bash', 'sh', 'shell', 'nginx', 'ini', 'toml', 'conf'].includes(lang)) return 'code';
  const t = line.trimStart();
  if (t.startsWith('#')) return 'comment';
  if (t.startsWith('>')) return 'prompt';
  return 'code';
}

export default function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const label = lang ? (LANG_LABELS[lang] ?? lang.toUpperCase()) : 'CODE';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  const needsHighlight = ['bash', 'sh', 'shell', 'nginx', 'ini', 'toml', 'conf'].includes(lang ?? '');

  return (
    <div className="code-block">
      <div className="code-head">
        <div className="dots">
          <span /><span /><span />
        </div>
        <span className="code-lang-badge">{label}</span>
        <button
          className={`code-copy-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          title="코드 복사"
        >
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              복사됨
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              복사
            </>
          )}
        </button>
      </div>
      <pre>
        <code>
          {needsHighlight
            ? lines.map((line, i) => {
                const cls = classifyLine(line, lang);
                return (
                  <span key={i} className={cls !== 'code' ? `cl-${cls}` : undefined}>
                    {line}
                    {i < lines.length - 1 && '\n'}
                  </span>
                );
              })
            : code}
        </code>
      </pre>
    </div>
  );
}
