import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import CommentTrail from '../components/CommentTrail';
import Icon from '../components/Icon';

const fmt     = (n) => `PKR ${parseFloat(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_ACTIONS = {
  submitted:    [
    { status: 'under_review', label: 'Mark Under Review', cls: 'btn-warning'  },
    { status: 'approved',     label: 'Approve',           cls: 'btn-success'  },
    { status: 'rejected',     label: 'Reject',            cls: 'btn-danger'   },
  ],
  under_review: [
    { status: 'approved',     label: 'Approve',           cls: 'btn-success'  },
    { status: 'rejected',     label: 'Reject',            cls: 'btn-danger'   },
  ],
  approved: [
    { status: 'reimbursed',   label: 'Mark Reimbursed',  cls: 'btn-primary'  },
  ],
};

const TIMELINE_STEPS = [
  { label: 'Submitted',    key: 'submitted',    doneWhen: () => true },
  { label: 'Under Review', key: 'under_review', doneWhen: (s) => ['under_review','approved','rejected','reimbursed'].includes(s) },
  { label: 'Decision',     key: 'decision',     doneWhen: (s) => ['approved','rejected','reimbursed'].includes(s) },
  { label: 'Reimbursed',   key: 'reimbursed',   doneWhen: (s) => s === 'reimbursed' },
];

export default function ClaimDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [claim,   setClaim]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [modal,   setModal]   = useState(null);
  const [comment, setComment] = useState('');
  const [acting,  setActing]  = useState(false);

  const load = () =>
    api.get(`/claims/${id}`)
      .then(({ data }) => setClaim(data))
      .catch(() => setError('Claim not found or you do not have access.'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id]);

  const handleAction = async () => {
    if (!modal) return;
    setActing(true);
    try {
      await api.patch(`/claims/${id}/status`, { status: modal.status, comment });
      setModal(null); setComment('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActing(false);
    }
  };

  const handleCommentAdded = (c) =>
    setClaim(prev => ({ ...prev, comments: [...(prev.comments || []), c] }));

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (error)   return <div className="alert alert-danger" style={{ margin: 24 }}><Icon name="alert-circle" size={15} />{error}</div>;
  if (!claim)  return null;

  const canAct    = (user.role === 'manager' || user.role === 'admin') && STATUS_ACTIONS[claim.status];
  const actions   = STATUS_ACTIONS[claim.status] || [];

  const totalByCategory = (claim.items || []).reduce((acc, item) => {
    acc[item.category_name] = (acc[item.category_name] || 0) + parseFloat(item.amount);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              <Icon name="arrow-left" size={14} /> Back
            </button>
            <StatusBadge status={claim.status} />
          </div>
          <h1>{claim.title}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="map-pin" size={13} style={{ color: 'var(--text-3)' }} />
              {claim.destination}
            </span>
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="calendar" size={13} style={{ color: 'var(--text-3)' }} />
              Submitted {fmtDate(claim.created_at)}
            </span>
          </p>
        </div>

        {canAct && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {actions.map(a => (
              <button key={a.status} className={`btn ${a.cls}`} onClick={() => setModal(a)}>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="claim-detail-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Trip Info */}
          <div className="card">
            <div className="card-header"><div className="card-title">Trip Information</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="detail-field"><label>Employee</label><p>{claim.employee_name}</p></div>
              <div className="detail-field"><label>Department</label><p>{claim.department || '—'}</p></div>
              <div className="detail-field"><label>Trip Start</label><p>{fmtDate(claim.trip_start)}</p></div>
              <div className="detail-field"><label>Trip End</label><p>{fmtDate(claim.trip_end)}</p></div>
              {claim.purpose && (
                <div className="detail-field" style={{ gridColumn: '1/-1' }}>
                  <label>Business Purpose</label><p>{claim.purpose}</p>
                </div>
              )}
              {claim.reviewer_name && (
                <div className="detail-field">
                  <label>Reviewed By</label><p>{claim.reviewer_name} · {fmtDate(claim.reviewed_at)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Expense Items */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Expense Items</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                {fmt(claim.total_amount)}
              </div>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th>Description</th><th>Amount</th><th>Policy</th></tr>
                </thead>
                <tbody>
                  {(claim.items || []).map(item => {
                    const over = item.limit_amount && parseFloat(item.amount) > parseFloat(item.limit_amount);
                    return (
                      <tr key={item.id}>
                        <td className="td-main">{item.category_name || '—'}</td>
                        <td>{item.description || '—'}</td>
                        <td className="td-amount">{fmt(item.amount)}</td>
                        <td>
                          {item.limit_amount
                            ? <span className={`badge ${over ? 'badge-rejected' : 'badge-approved'}`}>{over ? 'Over Limit' : 'Within Limit'}</span>
                            : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <CommentTrail
              comments={claim.comments || []}
              claimId={id}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Amount breakdown */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 14 }}>Breakdown</div>
            {Object.entries(totalByCategory).map(([cat, amt]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-2)' }}>{cat}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{fmt(amt)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 800, fontSize: 15 }}>
              <span>Total</span>
              <span style={{ color: 'var(--accent)' }}>{fmt(claim.total_amount)}</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Status Timeline</div>
            <div className="status-timeline">
              {TIMELINE_STEPS.map((step, i) => {
                const done = step.doneWhen(claim.status);
                return (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" style={{
                      background: done ? 'var(--success)' : 'var(--bg-surface-2)',
                      border: `2px solid ${done ? 'var(--success)' : 'var(--border-2)'}`,
                    }}>
                      {done && <Icon name="check" size={11} style={{ color: '#fff' }} />}
                    </div>
                    <div className="timeline-info">
                      <div className="t-label" style={{ opacity: done ? 1 : 0.45 }}>{step.label}</div>
                      {step.key === 'submitted' && claim.created_at && (
                        <div className="t-time">{fmtDate(claim.created_at)}</div>
                      )}
                      {step.key === 'decision' && claim.reviewed_at && (
                        <div className="t-time">{fmtDate(claim.reviewed_at)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal.label}</div>
            <div className="modal-subtitle">
              You are changing the status of <strong>{claim.title}</strong> to{' '}
              <strong>{modal.status.replace('_', ' ')}</strong>.
            </div>
            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea
                className="form-control"
                placeholder="Explain the decision or request revisions…"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => { setModal(null); setComment(''); }}>
                Cancel
              </button>
              <button className={`btn ${modal.cls}`} onClick={handleAction} disabled={acting}>
                {acting ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
