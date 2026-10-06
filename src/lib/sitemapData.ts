// sitemap 데이터 조회와 장애 시 폴백 결정 로직.
//
// 이 모듈은 next/* · '@/...'를 import하지 않는다 — node --test(strip-types)로 직접 테스트한다.
//
// 원칙
// - DB 조회는 짧은 타임아웃(SITEMAP_FETCH_TIMEOUT_MS)으로 끊는다. 느린 DB가 sitemap 요청을 붙잡지 않게.
// - posts·engineer_guides 중 하나라도 실패하거나 posts가 0건이면 "실패"로 본다(throw).
//   일부만 성공한 결과나 빈 결과를 완전한 sitemap처럼 내보내거나 캐시하지 않는다.
// - 실패 시 순서: 마지막 정상 데이터(last-good) → 핵심 정적 경로 sitemap. 500은 내지 않는다.

export const SITEMAP_FETCH_TIMEOUT_MS = 4000;
/** sitemap 데이터 캐시 태그 — /api/revalidate가 revalidateTag(SITEMAP_CACHE_TAG, 'max')로 갱신. */
export const SITEMAP_CACHE_TAG = 'sitemap';

export interface SitemapPostRow {
  slug: string;
  published_at: string;
  tags: string[] | null;
  category?: string | null;
  content_updated_at?: string | null;
  change_summary?: string | null;
}

export interface SitemapGuideRow {
  slug: string;
  updated_at: string;
}

export interface SitemapData {
  posts: SitemapPostRow[];
  guides: SitemapGuideRow[];
  fetchedAt: string;
}

export type QueryResult = { data: unknown; error: { code?: string; message: string } | null };
/** (table, columns, signal) → 발행된 행 조회. 실제 구현은 supabase/PostgREST 클라이언트. */
export type PublishedQuery = (table: 'posts' | 'engineer_guides', columns: string, signal: AbortSignal) => PromiseLike<QueryResult>;

export const POST_COLUMNS =
  'slug,published_at,tags,category,content_updated_at:content_evidence->>contentUpdatedAt,change_summary:content_evidence->>changeSummary';
export const GUIDE_COLUMNS = 'slug,updated_at';

export class SitemapFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SitemapFetchError';
  }
}

/** DB에서 sitemap 데이터를 가져온다. 실패·타임아웃·빈 결과는 모두 throw. */
export async function fetchSitemapData(query: PublishedQuery, timeoutMs = SITEMAP_FETCH_TIMEOUT_MS): Promise<SitemapData> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new SitemapFetchError(`sitemap DB fetch timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    const [postsRes, guidesRes] = await Promise.race([
      Promise.all([
        query('posts', POST_COLUMNS, controller.signal),
        query('engineer_guides', GUIDE_COLUMNS, controller.signal),
      ]),
      timeout,
    ]);
    if (postsRes.error) throw new SitemapFetchError(`sitemap posts fetch failed: ${postsRes.error.code ?? ''} ${postsRes.error.message}`);
    if (guidesRes.error) throw new SitemapFetchError(`sitemap guides fetch failed: ${guidesRes.error.code ?? ''} ${guidesRes.error.message}`);
    if (!Array.isArray(postsRes.data) || !Array.isArray(guidesRes.data)) {
      throw new SitemapFetchError('sitemap fetch returned a non-array payload');
    }
    // 발행 글이 0건인 사이트가 아니므로 0건은 장애(권한·필터·스키마 문제)로 본다.
    if (postsRes.data.length === 0) throw new SitemapFetchError('sitemap posts fetch returned 0 published posts');
    return {
      posts: postsRes.data as SitemapPostRow[],
      guides: guidesRes.data as SitemapGuideRow[],
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type SitemapSource = 'db' | 'last-good' | 'static';

export interface ResolveOptions {
  /** 기본 경로: (데이터 캐시를 거친) DB 조회. 실패하면 throw. */
  load: () => Promise<SitemapData>;
  /** 마지막 정상 데이터(없으면 null). */
  lastGood: () => SitemapData | null;
  /** 정상 데이터를 last-good으로 기억. */
  remember: (data: SitemapData) => void;
  log?: (message: string) => void;
}

/** 절대 throw하지 않는다. data가 null이면 호출자는 핵심 정적 경로 sitemap을 낸다. */
export async function resolveSitemapData(opts: ResolveOptions): Promise<{ data: SitemapData | null; source: SitemapSource }> {
  const log = opts.log ?? ((m: string) => console.error(m));
  try {
    const data = await opts.load();
    if (!data || !Array.isArray(data.posts) || data.posts.length === 0) {
      throw new SitemapFetchError('sitemap data source returned no posts');
    }
    opts.remember(data);
    return { data, source: 'db' };
  } catch (err) {
    const reason = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    let last: SitemapData | null = null;
    try {
      last = opts.lastGood();
    } catch {
      last = null;
    }
    if (last && last.posts.length > 0) {
      log(`[sitemap] DB fetch failed (${reason}); serving last-good sitemap from ${last.fetchedAt}`);
      return { data: last, source: 'last-good' };
    }
    log(`[sitemap] DB fetch failed (${reason}) and no last-good copy exists; serving static core-route sitemap`);
    return { data: null, source: 'static' };
  }
}
