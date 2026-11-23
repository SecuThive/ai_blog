'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Resource } from '@/lib/admin-policy';

type Row = Record<string, unknown> & { id: number };
const sections: [Resource, string, string][] = [
  ['posts', '블로그 글', '초안을 작성하고 발행된 글을 관리하세요.'],
  ['engineer_guides', '엔지니어 가이드', '실무 가이드와 지원 환경을 관리하세요.'],
  ['comments', '댓글', '독자의 댓글을 확인하고 공개 여부를 결정하세요.'],
  ['contact_messages', '문의함', '사이트를 통해 접수된 문의를 확인하세요.'],
  ['subscribers', '구독자', '뉴스레터 구독 현황을 확인하세요.'],
];
const str = (v: unknown) => typeof v === 'string' ? v : '';
const date = (v: unknown) => v ? new Date(String(v)).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const statusLabel = (v: unknown) => ({ draft: '비공개', published: '발행됨', approved: '공개', pending: '숨김' })[String(v)] || String(v);

async function api(resource: string, init?: RequestInit) {
  const response = await fetch(`/api/admin/${resource}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers }, cache: 'no-store' });
  const data = await response.json();
  if (response.status === 401) throw new Error('로그인 시간이 만료되었습니다. 새 탭에서 /admin/login에 로그인한 뒤 다시 저장해 주세요.');
  if (!response.ok) throw new Error(data.error || '처리하지 못했습니다. 다시 시도해 주세요.');
  return data;
}

export default function AdminWorkspace({ email }: { email: string }) {
  const [resource, setResource] = useState<Resource>('posts');
  const [items, setItems] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editor, setEditor] = useState<Row | null>(null);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [revision, setRevision] = useState(0);
  const requestId = useRef(0);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const content = resource === 'posts' || resource === 'engineer_guides';
  const guide = resource === 'engineer_guides';
  const section = sections.find(s => s[0] === resource)!;
  const refresh = useCallback(() => setRevision(r => r + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++requestId.current;
    // Reset the visible result when a new external request starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(''); setItems([]);
    api(`${resource}?${new URLSearchParams({ page: String(page), q: query, status })}`, { signal: controller.signal })
      .then(data => { if (requestId.current === current) { setItems(data.items); setCount(data.count); } })
      .catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [resource, page, query, status, revision]);

  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);

  function leaveEditor() {
    if (dirty && !window.confirm('저장하지 않은 변경 사항을 버릴까요?')) return false;
    setEditor(null); setDirty(false); setConfirmed(false); setPreview(false); return true;
  }
  function change(key: string, value: unknown) { setEditor(old => old ? { ...old, [key]: value } : old); setDirty(true); setConfirmed(false); }
  async function open(row: Row) {
    setBusy(true); setError(''); setMessage('');
    try { const data = await api(`${resource}?id=${row.id}`); setEditor(data.item); setDirty(false); setConfirmed(false); setPreview(false); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function remove(row: Row) {
    if (!window.confirm(`“${str(row.title || row.name || row.email) || '항목'}”을 영구 삭제할까요? 복구할 수 없습니다.${content ? ' 공개만 중단하려면 비공개로 저장하세요.' : ''}`)) return;
    setBusy(true); setError('');
    try { await api(resource, { method: 'DELETE', body: JSON.stringify({ id: row.id, confirm: true }) }); setMessage('삭제했습니다.'); setEditor(null); setDirty(false); if (items.length === 1 && page > 1) setPage(page - 1); else refresh(); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  const field = (key: string, label: string, required = false, maxLength = 200) => <label>{label}<input value={str(editor?.[key])} required={required} maxLength={maxLength} onChange={e => change(key, e.target.value)} /></label>;

  return <div className="admin-shell"><aside className="sidebar"><Link className="brand" href="/" onNavigate={event => { if (busy || !leaveEditor()) event.preventDefault(); }}>ThiveLab<span>콘텐츠 관리</span></Link><nav aria-label="관리 메뉴">{sections.map(([key, label]) => <button key={key} aria-current={resource === key ? 'page' : undefined} disabled={busy} onClick={() => { if (!leaveEditor()) return; setResource(key); setPage(1); setStatus(''); setSearch(''); setQuery(''); setMessage(''); }}>{label}</button>)}</nav><div className="account"><span>{email}</span><small>최대 1시간 로그인 유지</small><button disabled={busy} onClick={async () => { if (!leaveEditor()) return; setBusy(true); try { await api('session', { method: 'DELETE' }); window.location.assign('/admin/login'); } catch (err) { setError((err as Error).message); setBusy(false); } }}>로그아웃</button><a href="/" target="_blank" rel="noreferrer">사이트 보기 ↗</a></div></aside>
  <main className="workspace" id="main"><header className="page-heading"><div><h1>{editor ? content ? editor.id ? '콘텐츠 수정' : '새 콘텐츠 작성' : '상세 보기' : section[1]}</h1><p>{editor ? content ? '내용을 확인하고 저장하세요. 발행된 글의 변경은 사이트에 반영됩니다.' : section[2] : section[2]}</p></div>{!editor && content && <button className="primary" disabled={busy} onClick={() => { setEditor({ id: 0, title: '', slug: '', content: '', excerpt: '', summary: '', category: guide ? 'Linux' : 'AI & 자동화', author: email, tags: [], status: 'draft', cover_image: '', difficulty: 'beginner', os_compat: [], updated_at: null }); setDirty(false); setConfirmed(false); setMessage(''); }}>+ 새 {guide ? '가이드' : '글'}</button>}</header>
  {error && <div className="notice error" role="alert" ref={errorRef} tabIndex={-1}>{error} <button type="button" onClick={() => { setError(''); refresh(); }}>다시 불러오기</button> <a href="/admin/login" target="_blank" rel="noreferrer">로그인 열기 ↗</a></div>}{message && <div className="notice" role="status">{message}</div>}
  {editor ? <><button className="back" disabled={busy} onClick={leaveEditor}>← 목록으로</button>{content ? <form className="editor" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await api(resource, { method: editor.id ? 'PATCH' : 'POST', body: JSON.stringify({ ...editor, cover_image: editor.cover_image || '', confirm: confirmed }) }); setDirty(false); setEditor(null); setConfirmed(false); setMessage('저장했습니다.'); refresh(); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }}><fieldset disabled={busy}><div className="editor-main">{field('title', '제목', true)}{field('slug', '주소 (슬러그)', true, 220)}<p className="hint">문자·숫자·하이픈을 사용하세요. 발행 후 주소를 변경하면 기존 링크가 끊어질 수 있습니다.</p><label>{guide ? '요약' : '소개글'}<textarea rows={3} maxLength={1000} value={str(editor[guide ? 'summary' : 'excerpt'])} onChange={e => change(guide ? 'summary' : 'excerpt', e.target.value)} /></label><div className="editor-tools"><strong>본문</strong><button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)}>{preview ? '편집으로 돌아가기' : '미리보기'}</button></div><textarea aria-label="마크다운 본문" className={preview ? 'visually-hidden' : 'content-input'} value={str(editor.content)} maxLength={200000} required onChange={e => change('content', e.target.value)} placeholder="Markdown으로 내용을 작성하세요." />{preview && <article className="preview"><ReactMarkdown remarkPlugins={[remarkGfm]}>{str(editor.content) || '본문을 입력하면 여기에 표시됩니다.'}</ReactMarkdown></article>}</div><div className="editor-options"><h2>발행 설정</h2><label>공개 상태<select value={str(editor.status)} onChange={e => change('status', e.target.value)}><option value="draft">비공개 · 초안</option><option value="published">공개 · 발행</option></select></label>{field('category', '카테고리', true, 100)}{field('author', '작성자', true, 100)}<label>태그 (쉼표로 구분)<input value={Array.isArray(editor.tags) ? editor.tags.join(',') : ''} onChange={e => change('tags', e.target.value.split(','))} /></label>{guide ? <><label>난이도<select value={str(editor.difficulty)} onChange={e => change('difficulty', e.target.value)}><option value="beginner">입문</option><option value="intermediate">중급</option><option value="advanced">고급</option></select></label><label>지원 환경 (쉼표로 구분)<input value={Array.isArray(editor.os_compat) ? editor.os_compat.join(',') : ''} onChange={e => change('os_compat', e.target.value.split(','))} /></label></> : field('cover_image', '대표 이미지 URL', false, 2000)}{editor.status === 'published' && <label className="check"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} required />내용과 공개 여부를 검토했습니다.</label>}<button className="primary" disabled={busy || (editor.status === 'published' && !confirmed)}>{busy ? '저장 중…' : editor.status === 'published' ? '발행 상태로 저장' : '비공개로 저장'}</button><p className="hint" role="status">{dirty ? '저장하지 않은 변경 사항이 있습니다.' : '변경 사항이 없습니다.'}</p>{Boolean(editor.id) && <><p className="hint">마지막 수정: {date(editor.updated_at)}</p>{editor.status === 'published' && <a href={`/${guide ? 'engineer' : 'blog'}/${encodeURIComponent(str(editor.slug))}`} target="_blank" rel="noreferrer">공개 페이지 보기 ↗</a>}<button type="button" className="danger" onClick={() => remove(editor)}>영구 삭제</button></>}</div></fieldset></form> : <section className="detail"><dl>{Object.entries(editor).filter(([key]) => !['id', 'ip_hash', 'parent_id'].includes(key)).map(([key, value]) => <div key={key}><dt>{{ name: '이름', email: '이메일', content: '댓글', message: '문의 내용', type: '문의 유형', company: '회사', created_at: '등록일', status: '상태', post_slug: '글 주소', likes: '좋아요' }[key] || key}</dt><dd>{key === 'created_at' ? date(value) : key === 'status' ? statusLabel(value) : String(value ?? '—')}</dd></div>)}</dl><button className="danger" disabled={busy} onClick={() => remove(editor)}>영구 삭제</button></section>}</> : <><form className="toolbar" onSubmit={e => { e.preventDefault(); setQuery(search); setPage(1); }}><label className="search">검색<input value={search} maxLength={100} placeholder={content ? '제목으로 검색' : resource === 'subscribers' ? '이메일로 검색' : '내용으로 검색'} onChange={e => setSearch(e.target.value)} /></label><button disabled={loading}>검색</button>{(content || resource === 'comments') && <label>상태<select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">전체 상태</option>{(content ? ['draft', 'published'] : ['pending', 'approved']).map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></label>}<button type="button" disabled={loading} onClick={refresh}>새로고침</button></form><div className="list-summary"><strong>{section[1]}</strong><span>{loading ? '불러오는 중…' : `${count.toLocaleString()}개`}</span></div><div className="table-wrap" aria-busy={loading}><table><thead><tr><th>{content ? '제목' : resource === 'subscribers' ? '이메일' : '내용'}</th><th>{content || resource === 'comments' ? '상태' : '등록 정보'}</th><th>등록일</th><th>관리</th></tr></thead><tbody>{items.map(row => <tr key={row.id}><td><button className="row-title" disabled={busy} onClick={() => open(row)}>{str(row.title || row.content || row.message || row.email)}</button><small>{str(row.category || row.name)}{content && ` · ${Number(row.views || 0).toLocaleString()}회 조회`}</small></td><td>{row.status ? <span className={`status ${row.status}`}>{statusLabel(row.status)}</span> : str(row.email)}</td><td className="date">{date(row.created_at)}</td><td><div className="row-actions"><button disabled={busy} onClick={() => open(row)}>{content ? '수정' : '상세'}</button>{resource === 'comments' && <button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await api(resource, { method: 'PATCH', body: JSON.stringify({ id: row.id, status: row.status === 'approved' ? 'pending' : 'approved' }) }); setMessage('댓글 상태를 변경했습니다.'); refresh(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>{row.status === 'approved' ? '숨기기' : '공개'}</button>}</div></td></tr>)}</tbody></table>{!items.length && <div className="empty" role="status">{loading ? '목록을 불러오고 있습니다…' : error ? '목록을 표시할 수 없습니다.' : query || status ? '검색 조건에 맞는 항목이 없습니다.' : '등록된 항목이 없습니다.'}</div>}</div><footer className="pagination"><span>{page} / {Math.max(1, Math.ceil(count / 20))} 페이지</span><button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>이전</button><button disabled={page * 20 >= count || loading} onClick={() => setPage(page + 1)}>다음</button></footer></>}
  </main></div>;
}
