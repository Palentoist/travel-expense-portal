import { useState } from 'react';
import api from '../api/axios';
import Icon from './Icon';

const fmtTime = (d) => new Date(d).toLocaleString('en-GB', {
  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});
const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function CommentTrail({ comments = [], claimId, onCommentAdded }) {
  const [msg,     setMsg]     = useState('');
  const [sending, setSending] = useState(false);
  const [err,     setErr]     = useState('');

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true); setErr('');
    try {
      const { data } = await api.post(`/comments/${claimId}`, { message: msg.trim() });
      setMsg('');
      onCommentAdded?.(data.comment);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'var(--text-1)' }}>
        Comment Trail
      </h3>

      {comments.length === 0 && (
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 16 }}>No comments yet.</p>
      )}

      <div className="comment-trail">
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className={`comment-avatar role-${c.user_role}`}>
              {initials(c.user_name)}
            </div>
            <div className="comment-body">
              <div className="comment-header">
                <span className="comment-author">{c.user_name}</span>
                <span className={`badge badge-${c.user_role}`} style={{ fontSize: 10 }}>{c.user_role}</span>
                <span className="comment-time">{fmtTime(c.created_at)}</span>
              </div>
              <div className="comment-text">{c.message}</div>
            </div>
          </div>
        ))}
      </div>

      {onCommentAdded && (
        <div className="comment-input-area" style={{ marginTop: 20 }}>
          <textarea
            className="form-control"
            placeholder="Add a comment or revision note…"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.ctrlKey && e.key === 'Enter' && handleSend()}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSend}
              disabled={sending || !msg.trim()}
              style={{ gap: 6 }}
            >
              <Icon name="send" size={13} />
              {sending ? 'Sending…' : 'Send'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>Ctrl+↵</span>
          </div>
        </div>
      )}
      {err && <p className="form-error" style={{ marginTop: 8 }}>{err}</p>}
    </div>
  );
}
