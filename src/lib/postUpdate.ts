// PUT /api/posts/[id]가 받을 수 있는 컬럼. 날짜·검토·지표와 slug(URL 불변)는 API로 쓰지 못한다.
export const UPDATABLE_POST_COLUMNS = [
  'title', 'content', 'excerpt', 'cover_image', 'category', 'tags', 'status', 'author', 'agent_role',
  'content_evidence', 'key_points', 'title_en', 'excerpt_en', 'content_en',
] as const;
// 요청에 있어도 컬럼으로 저장하지 않고 별도 흐름에서 처리하는 필드.
const CONTROL_FIELDS = ['approval_confirmed', 'reviewed_by'];

const STRING_MAX: Record<string, number> = {
  title: 300, excerpt: 1000, cover_image: 2048, category: 100, author: 100, agent_role: 100,
  title_en: 300, excerpt_en: 1000, content: 500_000, content_en: 500_000,
};

export function parsePostUpdate(body: unknown):
  | { ok: true; update: Record<string, unknown> }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'JSON 객체가 필요합니다.' };
  const input = body as Record<string, unknown>;
  const allowed = new Set<string>([...UPDATABLE_POST_COLUMNS, ...CONTROL_FIELDS]);
  const unknown = Object.keys(input).filter(k => !allowed.has(k));
  if (unknown.length) return { ok: false, error: `수정할 수 없는 항목입니다: ${unknown.join(', ')}` };

  const update: Record<string, unknown> = {};
  for (const key of UPDATABLE_POST_COLUMNS) {
    if (!(key in input)) continue;
    const v = input[key];
    if (key === 'status') {
      if (v !== 'draft' && v !== 'published') return { ok: false, error: 'status는 draft 또는 published여야 합니다.' };
    } else if (key === 'tags' || key === 'key_points') {
      if (v !== null && !(Array.isArray(v) && v.length <= 50 && v.every(x => typeof x === 'string' && x.length <= 200))) {
        return { ok: false, error: `${key}는 문자열 배열이어야 합니다.` };
      }
    } else if (key === 'content_evidence') {
      if (v !== null && (typeof v !== 'object' || Array.isArray(v))) return { ok: false, error: 'content_evidence는 객체여야 합니다.' };
    } else {
      const max = STRING_MAX[key];
      const nullable = key.endsWith('_en') || key === 'cover_image';
      if (v === null && nullable) { update[key] = v; continue; }
      if (typeof v !== 'string' || v.length > max) return { ok: false, error: `${key} 값을 확인해주세요. (문자열, 최대 ${max.toLocaleString()}자)` };
      if ((key === 'title' || key === 'content') && !v.trim()) return { ok: false, error: `${key}는 비울 수 없습니다.` };
    }
    update[key] = v;
  }
  return { ok: true, update };
}
