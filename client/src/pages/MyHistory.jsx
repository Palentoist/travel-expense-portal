import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ClaimCard from '../components/ClaimCard';
import Pagination from '../components/Pagination';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';

const fmt = (n) => `PKR ${parseFloat(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const STATUSES = ['all', 'submitted', 'under_review', 'approved', 'rejected', 'reimbursed'];

export default function MyHistory() {
  const [claims,     setClaims]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 8 });
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
          <h1>My Claims</h1>
          <p>Track all your submitted travel expense claims.</p>
        </div>
        <Link to="/claims/new" className="btn btn-primary">
          <Icon name="plus" size={15} /> New Claim
        </Link>
      </div>

      {summary && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard icon="layers"       label="Total"       value={summary.total}       color="var(--accent)"  />
          <StatCard icon="clock"        label="Submitted"   value={summary.submitted}   color="var(--accent)"  />
          <StatCard icon="check-circle" label="Approved"    value={summary.approved}    color="var(--success)" />
          <StatCard icon="credit-card"  label="Reimbursed"  value={fmt(summary.total_reimbursed)} color="var(--purple)" />
        </div>
      )}

      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon"><Icon name="search" size={15} /></span>
          <input className="form-control" placeholder="Search by title or destination…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setPage(1)} />
        </div>
        <div className="filter-chips">
          {STATUSES.map(s => (
            <button key={s} className={`filter-chip ${status === s ? 'active' : ''}`}
              onClick={() => { setStatus(s); setPage(1); }}>
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner" /></div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Icon name="file-text" size={40} /></div>
          <h3>No claims found</h3>
          <p>Adjust your filters or submit a new claim.</p>
          <Link to="/claims/new" className="btn btn-primary" style={{ marginTop: 16 }}>
            <Icon name="plus" size={15} /> Submit a Claim
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {claims.map(c => <ClaimCard key={c.id} claim={c} />)}
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
