'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n/provider';
import { formatTimeAgo } from '@/i18n/format';
import { interpolate } from '@/i18n/messages';

export interface CommentRow {
  id: number;
  name: string;
  content: string;
  created_at: string;
  parent_id: number | null;
  likes: number;
}

type Variant = 'comments' | 'qa';

function useCopy(variant: Variant) {
  const { dict } = useT();
  if (variant === 'qa') {
    return {
      heading: dict.comments.qaHeading,
      empty: dict.comments.qaEmpty,
      placeholder: dict.comments.qaPlaceholder,
      submit: dict.comments.qaSubmit,
      submitting: dict.comments.submitting,
      success: dict.comments.qaSuccess,
      replyVerb: dict.comments.qaReply,
      replyPlaceholder: dict.comments.qaReplyPlaceholder,
    };
  }
  return {
    heading: dict.comments.heading,
    empty: dict.comments.empty,
    placeholder: dict.comments.placeholder,
    submit: dict.comments.submit,
    submitting: dict.comments.submitting,
    success: dict.comments.success,
    replyVerb: dict.comments.replyVerb,
    replyPlaceholder: dict.comments.replyPlaceholder,
  };
}

const LIKED_KEY = 'nodelog_liked_comments';

function readLikedSet(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    return new Set<number>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export default function Comments({
  slugKey,
  variant = 'comments',
  initialComments = [],
}: {
  slugKey: string;
  variant?: Variant;
  initialComments?: CommentRow[];
}) {
  const t = useCopy(variant);
  const { dict } = useT();
  const [comments, setComments] = useState<CommentRow[]>(initialComments);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // 답글 입력 상태 (열려 있는 부모 id 하나만 추적)
  const [replyTo, setReplyTo] = useState<number | null>(null);

  // 좋아요: localStorage 가드 + 낙관적 카운트.
  // 서버 렌더 HTML(초기 댓글)과의 하이드레이션 불일치를 피하려면 마운트 후에만
  // localStorage를 읽어야 한다 — effect 내 초기 동기화라 규칙을 의도적으로 예외 처리.
  const [liked, setLiked] = useState<Set<number>>(new Set());
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiked(readLikedSet());
  }, []);

  const loadComments = useCallback(() => {
    fetch(`/api/comments?post_slug=${encodeURIComponent(slugKey)}`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .catch(() => {});
  }, [slugKey]);

  // 스레드 구조: 최상위 + parent_id별 답글
  const { roots, repliesByParent } = useMemo(() => {
    const roots: CommentRow[] = [];
    const map = new Map<number, CommentRow[]>();
    for (const c of comments) {
      if (c.parent_id == null) roots.push(c);
      else {
        const arr = map.get(c.parent_id) ?? [];
        arr.push(c);
        map.set(c.parent_id, arr);
      }
    }
    return { roots, repliesByParent: map };
  }, [comments]);

  const totalCount = comments.length;

  async function postComment(parentId: number | null, body: string, author: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_slug: slugKey,
        name: author.trim() || dict.comments.anonymous,
        content: body.trim(),
        parent_id: parentId,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? dict.comments.errorGeneric);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    setSubmitted(false);
    try {
      await postComment(null, content, name);
      setSubmitted(true);
      setContent('');
      setName('');
      loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.comments.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: number, current: number) {
    if (liked.has(id)) return;
    // 낙관적 반영
    setLiked(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(LIKED_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
    setComments(prev => prev.map(c => (c.id === id ? { ...c, likes: current + 1 } : c)));
    try {
      const res = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && typeof data.likes === 'number') {
        setComments(prev => prev.map(c => (c.id === id ? { ...c, likes: data.likes } : c)));
      }
    } catch { /* 낙관적 값 유지 */ }
  }

  return (
    <div className="comments-section">
      <h3 className="comments-h">
        {t.heading}{totalCount > 0 ? ` (${totalCount})` : ''}
      </h3>

      {roots.length === 0 ? (
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 24px' }}>{t.empty}</p>
      ) : (
        <ul className="comment-list">
          {roots.map(c => {
            const replies = repliesByParent.get(c.id) ?? [];
            return (
              <li key={c.id} className="comment-item">
                <CommentBody
                  c={c}
                  variant={variant}
                  liked={liked.has(c.id)}
                  onLike={() => handleLike(c.id, c.likes)}
                  onReply={() => setReplyTo(replyTo === c.id ? null : c.id)}
                  replyOpen={replyTo === c.id}
                />

                {replies.length > 0 && (
                  <ul className="comment-replies">
                    {replies.map(r => (
                      <li key={r.id} className="comment-item comment-reply">
                        <CommentBody
                          c={r}
                          variant={variant}
                          liked={liked.has(r.id)}
                          onLike={() => handleLike(r.id, r.likes)}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {replyTo === c.id && (
                  <ReplyForm
                    variant={variant}
                    onCancel={() => setReplyTo(null)}
                    onSubmit={async (bodyText, author) => {
                      await postComment(c.id, bodyText, author);
                      setReplyTo(null);
                      loadComments();
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form className="comment-form" onSubmit={handleSubmit} aria-label={interpolate(dict.comments.formAria, { heading: t.heading })}>
        <input
          type="text"
          id="comment-name"
          placeholder={dict.comments.namePlaceholder}
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          className="comment-input"
          aria-label={dict.comments.nameAria}
          autoComplete="name"
        />
        <textarea
          id="comment-content"
          placeholder={t.placeholder}
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={1000}
          required
          rows={3}
          className="comment-textarea"
          aria-label={t.heading}
          aria-required="true"
        />
        {error && (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '0' }}>{error}</p>
        )}
        {submitted && (
          <p role="status" style={{ color: 'var(--success)', fontSize: 13, margin: '0' }}>{t.success}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="btn btn-primary btn-sm comment-submit"
          aria-label={t.submit}
          aria-disabled={submitting || !content.trim()}
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>
    </div>
  );
}

function CommentBody({
  c,
  variant,
  liked,
  onLike,
  onReply,
  replyOpen,
}: {
  c: CommentRow;
  variant: Variant;
  liked: boolean;
  onLike: () => void;
  onReply?: () => void;
  replyOpen?: boolean;
}) {
  const t = useCopy(variant);
  const { locale, dict } = useT();
  return (
    <>
      <div className="comment-meta">
        <span className="comment-name">{c.name}</span>
        <span className="comment-time">{formatTimeAgo(c.created_at, locale, dict)}</span>
      </div>
      <p className="comment-body">{c.content}</p>
      <div className="comment-actions">
        <button
          type="button"
          className={`comment-action-btn${liked ? ' is-liked' : ''}`}
          onClick={onLike}
          disabled={liked}
          aria-pressed={liked}
          aria-label={liked ? dict.comments.liked : dict.comments.like}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          {c.likes > 0 && <span>{c.likes}</span>}
        </button>
        {onReply && (
          <button
            type="button"
            className={`comment-action-btn${replyOpen ? ' is-active' : ''}`}
            onClick={onReply}
            aria-expanded={replyOpen}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            {t.replyVerb}
          </button>
        )}
      </div>
    </>
  );
}

function ReplyForm({
  variant,
  onSubmit,
  onCancel,
}: {
  variant: Variant;
  onSubmit: (body: string, author: string) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useCopy(variant);
  const { dict } = useT();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setErr('');
    try {
      await onSubmit(body, name);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : dict.comments.errorGeneric);
      setBusy(false);
    }
  }

  return (
    <form className="comment-form comment-reply-form" onSubmit={submit} aria-label={interpolate(dict.comments.formAria, { heading: t.replyVerb })}>
      <input
        type="text"
        placeholder={dict.comments.namePlaceholder}
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={50}
        className="comment-input"
        aria-label={dict.comments.nameAria}
        autoComplete="name"
      />
      <textarea
        placeholder={t.replyPlaceholder}
        value={body}
        onChange={e => setBody(e.target.value)}
        maxLength={1000}
        required
        rows={2}
        className="comment-textarea"
        aria-label={t.replyVerb}
        aria-required="true"
      />
      {err && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={busy || !body.trim()} className="btn btn-primary btn-sm">
          {busy ? t.submitting : interpolate(dict.comments.replySubmit, { verb: t.replyVerb })}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel}>{dict.comments.cancel}</button>
      </div>
    </form>
  );
}
