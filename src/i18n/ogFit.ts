/** Fit long English (or Korean) titles into the 1200×630 OG canvas without mid-word cuts. */
export function fitOgTitle(title: string): { text: string; fontSize: number } {
  const t = title.trim();
  if (t.length <= 32) return { text: t, fontSize: 54 };
  if (t.length <= 48) return { text: t, fontSize: 44 };
  if (t.length <= 72) return { text: t, fontSize: 36 };
  if (t.length <= 96) return { text: t, fontSize: 30 };
  const sliced = t.slice(0, 108);
  const cut = Math.max(sliced.lastIndexOf(' '), sliced.lastIndexOf('·'));
  return { text: `${cut > 48 ? sliced.slice(0, cut) : sliced}…`, fontSize: 28 };
}

export function fitOgExcerpt(excerpt: string, titleLength: number): string {
  const t = excerpt.trim();
  const max = titleLength > 72 ? 90 : 120;
  if (t.length <= max) return t;
  const sliced = t.slice(0, max);
  const cut = sliced.lastIndexOf(' ');
  return `${cut > 40 ? sliced.slice(0, cut) : sliced}…`;
}
