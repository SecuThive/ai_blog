'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import React from 'react';

const LANG_LABELS: Record<string, string> = {
  bash: 'Bash', sh: 'Shell', shell: 'Shell',
  yaml: 'YAML', yml: 'YAML',
  json: 'JSON', jsonc: 'JSON',
  ini: 'INI', toml: 'TOML', conf: 'Config',
  nginx: 'Nginx', sql: 'SQL',
  python: 'Python', py: 'Python',
  javascript: 'JavaScript', js: 'JavaScript',
  typescript: 'TypeScript', ts: 'TypeScript',
  tsx: 'TSX', jsx: 'JSX',
  dockerfile: 'Dockerfile',
  go: 'Go', rust: 'Rust',
  xml: 'XML', html: 'HTML', css: 'CSS',
};

const PY_SRC = [
  '(#.*$)',
  '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')',
  '\\b(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b',
  '\\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|with|as|pass|break|continue|lambda|yield|async|await|raise|in|not|and|or|is|del|global|nonlocal|assert|None|True|False)\\b',
  '\\b(print|len|range|type|str|int|float|bool|list|dict|set|tuple|enumerate|zip|map|filter|open|super|self|cls)\\b',
].join('|');
const PY_GROUPS = ['cmt', 'str', 'num', 'kw', 'builtin'];

const JS_SRC = [
  '(\\/\\/.*$)',
  '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`[^`]*`)',
  '\\b(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b',
  '\\b(const|let|var|function|return|if|else|for|while|do|try|catch|finally|class|extends|new|this|typeof|instanceof|import|export|default|from|async|await|switch|case|break|continue|throw|null|undefined|true|false|interface|type|enum|void|readonly|abstract|implements|override|keyof|infer|never|unknown|any)\\b',
].join('|');
const JS_GROUPS = ['cmt', 'str', 'num', 'kw'];

const JSON_SRC = [
  '("(?:[^"\\\\]|\\\\.)*")',
  '\\b(true|false|null)\\b',
  '(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)',
].join('|');
const JSON_GROUPS = ['str', 'kw', 'num'];

function applyHighlight(line: string, src: string, groups: string[]): ReactNode[] {
  const re = new RegExp(src, 'g');
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    let type: string | null = null;
    for (let g = 1; g < m.length; g++) {
      if (m[g] !== undefined) { type = groups[g - 1]; break; }
    }
    if (type) parts.push(<span key={m.index} className={`cl-${type}`}>{m[0]}</span>);
    else parts.push(m[0]);
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

function highlightLine(line: string, lang?: string): ReactNode {
  const l = lang ?? '';
  if (['bash', 'sh', 'shell'].includes(l)) {
    const t = line.trimStart();
    if (t.startsWith('#')) return <span className="cl-cmt">{line}</span>;
    if (t.startsWith('$') || t.startsWith('>')) return <span className="cl-prompt">{line}</span>;
    return line;
  }
  if (['nginx', 'ini', 'toml', 'conf'].includes(l)) {
    const t = line.trimStart();
    if (t.startsWith('#') || t.startsWith(';')) return <span className="cl-cmt">{line}</span>;
    return line;
  }
  if (['python', 'py'].includes(l)) return applyHighlight(line, PY_SRC, PY_GROUPS);
  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx'].includes(l)) return applyHighlight(line, JS_SRC, JS_GROUPS);
  if (['json', 'jsonc'].includes(l)) return applyHighlight(line, JSON_SRC, JSON_GROUPS);
  return line;
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
  const shouldHighlight = !!lang;

  return (
    <div className="code-block">
      <div className="code-head">
        <div className="dots">
          <span className="dot-red" />
          <span className="dot-yellow" />
          <span className="dot-green" />
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
          {shouldHighlight
            ? lines.map((line, i) => (
                <React.Fragment key={i}>
                  {highlightLine(line, lang)}
                  {i < lines.length - 1 ? '\n' : ''}
                </React.Fragment>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}
