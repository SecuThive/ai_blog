'use client';

import { useCallback, useEffect, useState } from 'react';

interface Comment {
  id: number;
  name: string;
  content: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function Comments({ postSlug }: { postSlug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const loadComments = useCallback(() => {
    fetch(`/api/comments?post_slug=${encodeURIComponent(postSlug)}`)
      .then(r => r.json())
      .then(d => { setComments(d.comments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [postSlug]);

  useEffect(() => { loadComments(); }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError('');
    setSubmitted(false);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_slug: postSlug, name: name.trim() || '익명', content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '오류가 발생했습니다');
      setSubmitted(true);
      setContent('');
      setName('');
      loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="comments-section">
      <h3 className="comments-h">
        댓글{comments.length > 0 ? ` (${comments.length})` : ''}
      </h3>

      {loading ? (
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 24px' }}>불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: '0 0 24px' }}>첫 번째 댓글을 남겨보세요.</p>
      ) : (
        <ul className="comment-list">
          {comments.map(c => (
            <li key={c.id} className="comment-item">
              <div className="comment-meta">
                <span className="comment-name">{c.name}</span>
                <span className="comment-time">{timeAgo(c.created_at)}</span>
              </div>
              <p className="comment-body">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="comment-form" onSubmit={handleSubmit} aria-label="댓글 작성 폼">
        <input
          type="text"
          id="comment-name"
          placeholder="이름 (선택 · 기본: 익명)"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          className="comment-input"
          aria-label="작성자 이름 (선택)"
          autoComplete="name"
        />
        <textarea
          id="comment-content"
          placeholder="댓글을 입력하세요..."
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={1000}
          required
          rows={3}
          className="comment-textarea"
          aria-label="댓글 내용"
          aria-required="true"
        />
        {error && (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '0' }}>{error}</p>
        )}
        {submitted && (
          <p role="status" style={{ color: 'var(--success)', fontSize: 13, margin: '0' }}>댓글이 등록되었습니다.</p>
        )}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="btn btn-primary btn-sm comment-submit"
          aria-label="댓글 등록"
          aria-disabled={submitting || !content.trim()}
        >
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </form>
    </div>
  );
}
