import { revalidatePath, revalidateTag } from 'next/cache';
import { adminJson, adminUser, sameOrigin } from '@/lib/admin-auth';
import { contentInput, isResource } from '@/lib/admin-policy';
import { supabaseAdmin } from '@/lib/supabase';
import { postCacheTag, guideCacheTag } from '@/lib/cacheTags';
import { SITEMAP_CACHE_TAG } from '@/lib/sitemapData';

type Context = { params: Promise<{ resource: string }> };
const columns = {
  posts: 'id,title,slug,category,status,author,views,created_at,updated_at',
  engineer_guides: 'id,title,slug,category,status,author,views,created_at,updated_at',
  comments: 'id,name,content,post_slug,status,created_at',
  contact_messages: 'id,name,email,type,company,message,created_at',
  subscribers: 'id,email,created_at',
};

function invalidate(resource: string, slugs: string[]) {
  if (resource === 'comments') {
    for (const key of slugs) {
      const guide = key.startsWith('guide:');
      const slug = guide ? key.slice(6) : key;
      revalidateTag(guide ? guideCacheTag(slug) : postCacheTag(slug), { expire: 0 });
      for (const prefix of ['', '/ko', '/en']) revalidatePath(`${prefix}/${guide ? 'engineer' : 'blog'}/${encodeURIComponent(slug)}`);
    }
    return;
  }
  if (resource !== 'posts' && resource !== 'engineer_guides') return;
  const guide = resource === 'engineer_guides';
  for (const slug of new Set(slugs)) {
    revalidateTag(guide ? guideCacheTag(slug) : postCacheTag(slug), { expire: 0 });
    for (const prefix of ['', '/ko', '/en']) revalidatePath(`${prefix}/${guide ? 'engineer' : 'blog'}/${encodeURIComponent(slug)}`);
  }
  for (const prefix of ['', '/ko', '/en']) {
    for (const path of ['', '/engineer', '/archive', '/trending', '/series', '/tags', '/recommend']) revalidatePath(`${prefix}${path}` || '/');
  }
  revalidateTag('engineer-list', { expire: 0 });
  revalidateTag(SITEMAP_CACHE_TAG, { expire: 0 });
  revalidatePath('/sitemap.xml');
  revalidatePath('/rss');
}

export async function GET(request: Request, { params }: Context) {
  if (!await adminUser()) return adminJson({ error: '로그인이 필요합니다.' }, 401);
  const { resource } = await params;
  if (!isResource(resource)) return adminJson({ error: '찾을 수 없습니다.' }, 404);
  const search = new URL(request.url).searchParams;
  const id = search.get('id');
  const sb = supabaseAdmin();
  if (id) {
    if (!/^\d+$/.test(id)) return adminJson({ error: '잘못된 항목입니다.' }, 400);
    const { data, error } = await sb.from(resource).select('*').eq('id', id).single();
    return error ? adminJson({ error: '항목을 불러올 수 없습니다.' }, 404) : adminJson({ item: data });
  }
  const page = Math.max(1, Math.min(100000, Number(search.get('page')) || 1));
  let query = sb.from(resource).select(columns[resource], { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  const q = (search.get('q') || '').trim().slice(0, 100).replace(/[%_\\]/g, '');
  if (q) query = query.ilike(resource === 'posts' || resource === 'engineer_guides' ? 'title' : resource === 'comments' ? 'content' : resource === 'subscribers' ? 'email' : 'message', `%${q}%`);
  const status = search.get('status');
  if (status && (resource === 'posts' || resource === 'engineer_guides' || resource === 'comments')) query = query.eq('status', status);
  const { data, count, error } = await query;
  return error ? adminJson({ error: '목록을 불러오지 못했습니다. 다시 시도해 주세요.' }, 500) : adminJson({ items: data, count, page });
}

async function mutate(request: Request, { params }: Context) {
  if (!sameOrigin(request)) return adminJson({ error: '허용되지 않은 요청입니다.' }, 403);
  const user = await adminUser();
  if (!user) return adminJson({ error: '로그인이 필요합니다.' }, 401);
  const { resource } = await params;
  if (!isResource(resource)) return adminJson({ error: '찾을 수 없습니다.' }, 404);
  const raw = await request.text();
  if (raw.length > 250000) return adminJson({ error: '내용이 너무 큽니다.' }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error(); }
  catch { return adminJson({ error: '잘못된 요청입니다.' }, 400); }
  const creating = request.method === 'POST';
  const id = body.id;
  if (!creating && (!Number.isSafeInteger(id) || Number(id) <= 0)) return adminJson({ error: '잘못된 항목입니다.' }, 400);
  const content = resource === 'posts' || resource === 'engineer_guides';
  if (creating && !content) return adminJson({ error: '지원하지 않는 작업입니다.' }, 405);
  if (request.method === 'PATCH' && !content && resource !== 'comments') return adminJson({ error: '지원하지 않는 작업입니다.' }, 405);
  const sb = supabaseAdmin();
  const { data: existing, error: readError } = creating ? { data: null, error: null } : await sb.from(resource).select('*').eq('id', id).single();
  if (!creating && (readError || !existing)) return adminJson({ error: '항목을 찾을 수 없습니다.' }, 404);
  if (request.method === 'DELETE') {
    if (body.confirm !== true) return adminJson({ error: '삭제 확인이 필요합니다.' }, 400);
    const { error } = await sb.from(resource).delete().eq('id', id);
    if (error) return adminJson({ error: '삭제하지 못했습니다. 연결된 항목을 확인해 주세요.' }, 409);
    invalidate(resource, existing?.slug || existing?.post_slug ? [existing.slug || existing.post_slug] : []);
    return adminJson({ ok: true });
  }
  let value: Record<string, unknown>;
  try {
    if (content) {
      value = contentInput(body, resource === 'engineer_guides');
      if (existing && body.updated_at !== existing.updated_at) return adminJson({ error: '다른 곳에서 변경된 글입니다. 목록으로 돌아가 최신 내용을 다시 열어 주세요.' }, 409);
      if (value.status === 'published' && body.confirm !== true) throw new Error('내용 검토 후 발행 확인을 선택해 주세요.');
      value.updated_at = new Date().toISOString();
      if (value.status === 'published') {
        if (resource === 'posts') value.published_at = existing?.published_at || new Date().toISOString();
        value.reviewed_at = new Date().toISOString();
        value.reviewed_by = user.email || user.id;
      }
    } else {
      if (body.status !== 'approved' && body.status !== 'pending') throw new Error('댓글 상태를 확인해 주세요.');
      value = { status: body.status };
    }
  } catch (error) { return adminJson({ error: error instanceof Error ? error.message : '입력을 확인해 주세요.' }, 400); }
  let mutation = creating ? sb.from(resource).insert(value) : sb.from(resource).update(value).eq('id', id);
  if (!creating && content) mutation = existing?.updated_at ? mutation.eq('updated_at', existing.updated_at) : mutation.is('updated_at', null);
  const { data, error } = await mutation.select('id').maybeSingle();
  if (error) return adminJson({ error: error.code === '23505' ? '이미 사용 중인 주소입니다. 다른 주소를 입력해 주세요.' : '저장하지 못했습니다. 입력 내용과 연결 상태를 확인해 주세요.' }, 409);
  if (!data) return adminJson({ error: '다른 곳에서 변경된 항목입니다. 최신 내용을 다시 열어 주세요.' }, 409);
  invalidate(resource, [existing?.slug || existing?.post_slug, value.slug].filter((s): s is string => typeof s === 'string'));
  return adminJson({ ok: true, id: data.id }, creating ? 201 : 200);
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
