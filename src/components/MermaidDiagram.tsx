'use client';

import { useEffect, useId, useState } from 'react';
import { translateMermaid } from '@/i18n/english';
import type { Locale } from '@/i18n/config';

function fitMermaidSvg(svg: string): string {
  let out = svg.replace(/\s(width|height)="[^"]*"/g, '');
  if (!/\sviewBox=/.test(out)) return out;
  return out.replace('<svg ', '<svg width="100%" preserveAspectRatio="xMidYMid meet" ');
}

export default function MermaidDiagram({ chart, locale }: { chart: string; locale: Locale }) {
  const reactId = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const source = locale === 'en' ? translateMermaid(chart) : chart;

  useEffect(() => {
    let cancelled = false;
    import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        flowchart: {
          useMaxWidth: true,
          wrappingWidth: 180,
          htmlLabels: true,
          padding: 8,
          nodeSpacing: 24,
          rankSpacing: 36,
        },
      });
      const { svg: rendered } = await mermaid.render(`mermaid-${reactId}`, source);
      if (!cancelled) setSvg(fitMermaidSvg(rendered));
    }).catch((err) => {
      console.error('mermaid render failed', err);
      if (!cancelled) setSvg('');
    });
    return () => { cancelled = true; };
  }, [source, reactId]);

  if (!svg) {
    return (
      <pre className="mermaid-fallback"><code>{source}</code></pre>
    );
  }

  return (
    <figure
      className="prose-figure mermaid-figure"
      // mermaid.render() returns SVG only; securityLevel is strict.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
