export const ADMIN_COOKIE = 'thivelab_admin';

export function validOrigin(request: Request, configuredOrigin?: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const url = new URL(request.url);
    const expected = configuredOrigin ? new URL(configuredOrigin).origin : `${url.protocol}//${request.headers.get('host') || url.host}`;
    return origin === expected;
  } catch { return false; }
}

export const resources = ['posts', 'engineer_guides', 'comments', 'contact_messages', 'subscribers'] as const;
export type Resource = typeof resources[number];
export function isResource(value: string): value is Resource {
  return (resources as readonly string[]).includes(value);
}

export function contentInput(body: Record<string, unknown>, guide: boolean) {
  const text = (key: string, max: number, required = false) => {
    const value = body[key];
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
      throw new Error(`${key} 항목을 확인해 주세요. (최대 ${max.toLocaleString()}자)`);
    }
    return value.trim();
  };
  const title = text('title', 200, true);
  const slug = text('slug', 220, true);
  if (!/^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u.test(slug)) throw new Error('주소에는 문자, 숫자, 하이픈, 밑줄만 사용할 수 있습니다.');
  if (body.status !== 'draft' && body.status !== 'published') throw new Error('공개 상태를 확인해 주세요.');
  if (!Array.isArray(body.tags) || body.tags.length > 20 || body.tags.some(t => typeof t !== 'string' || t.length > 60)) throw new Error('태그는 60자 이내, 최대 20개까지 입력해 주세요.');
  const value: Record<string, unknown> = {
    title, slug, content: text('content', 200000, true), category: text('category', 100, true),
    author: text('author', 100, true), status: body.status, tags: [...new Set(body.tags.map(t => t.trim()).filter(Boolean))],
    [guide ? 'summary' : 'excerpt']: text(guide ? 'summary' : 'excerpt', 1000),
  };
  if (guide) {
    if (!['beginner', 'intermediate', 'advanced'].includes(String(body.difficulty))) throw new Error('난이도를 선택해 주세요.');
    if (!Array.isArray(body.os_compat) || body.os_compat.length > 20 || body.os_compat.some(v => typeof v !== 'string' || v.length > 60)) throw new Error('지원 환경을 확인해 주세요.');
    value.difficulty = body.difficulty;
    value.os_compat = [...new Set(body.os_compat.map(v => v.trim()).filter(Boolean))];
  } else {
    const cover = body.cover_image == null ? '' : text('cover_image', 2000);
    if (cover && !/^https:\/\//.test(cover) && !/^\/(?!\/)/.test(cover)) throw new Error('이미지는 HTTPS 주소 또는 /로 시작하는 사이트 경로를 입력해 주세요.');
    value.cover_image = cover || null;
  }
  return value;
}
