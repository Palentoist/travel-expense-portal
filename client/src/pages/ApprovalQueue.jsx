import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import ClaimCard from '../components/ClaimCard';
import Pagination from '../components/Pagination';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';

const STATUSES = ['all', 'submitted', 'under_review', 'approved', 'rejected', 'reimbursed'];

export default function ApprovalQueue() {
  const [claims,     setClaims]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState('submitted');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10 });
    if (status !== 'all') params.set('status', status);
    if (search.trim())    params.set('search', search.trim());
    Promise.all([
      api.get(`/claims?${params}`),
      api.get('/claims/summary'),
    ]).then(([r, s]) => {
      setClaims(r.data.claims);
      setPagination(r.data.pagination);
      setSummary(s.data);
    }).finally(() => setLoading(false));
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Approval Queue</h1>
          <p>Review and action pending travel expense claims.</p>
        </div>
      </div>

      {summary && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard icon="clock"        label="Submitted"    value={summary.submitted}    color="var(--accent)"  />
          <StatCard icon="refresh-cw"   label="Under Review" value={summary.under_review} color="var(--warning)" />
          <StatCard icon="check-circle" label="Approved"     value={summary.approved}     color="var(--success)" />
          <StatCard icon="x-circle"     label="Rejected"     value={summary.rejected}     color="var(--danger)"  />
        </div>
      )}

      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon"><Icon name="search" size={15} /></span>
          <input
            className="form-control"
            placeholder="Search by title, destination, or employee…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
        </div>
        <div className="filter-chips">
          {STATUSES.map(s => (
            <button key={s} className={`filter-chip ${status === s ? 'active' : ''}`}
              onClick={() => { setStatus(s); setPage(1); }}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
              {s === 'submitted' && summary?.submitted > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--accent)', color: '#fff', borderRadius: 8, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>
                  {summary.submitted}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="check-circle" size={40} /></div>
          <h3>All caught up</h3>
          <p>No claims match the current filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {claims.map(c => <ClaimCard key={c.id} claim={c} showEmployee />)}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
