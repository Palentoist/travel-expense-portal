import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import ClaimCard from '../components/ClaimCard';
import Icon from '../components/Icon';

const fmt = (n) => `PKR ${parseFloat(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/claims/summary'),
      api.get('/claims?limit=5'),
    ]).then(([sum, rec]) => {
      setSummary(sum.data);
      setRecent(rec.data.claims);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  const isEmployee = user?.role === 'employee';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p>
            {isEmployee
              ? `Here's an overview of your expense claims.`
              : `System-wide summary of all expense claims.`}
          </p>
        </div>
        {isEmployee && (
          <Link to="/claims/new" className="btn btn-primary">
            <Icon name="plus" size={15} /> New Claim
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="layers"        label="Total Claims"    value={summary?.total || 0}          color="var(--accent)"   />
        <StatCard icon="clock"         label="Submitted"       value={summary?.submitted || 0}      color="var(--accent)"   />
        <StatCard icon="refresh-cw"    label="Under Review"    value={summary?.under_review || 0}   color="var(--warning)"  />
        <StatCard icon="check-circle"  label="Approved"        value={summary?.approved || 0}       color="var(--success)"  />
        <StatCard icon="x-circle"      label="Rejected"        value={summary?.rejected || 0}       color="var(--danger)"   />
        {isEmployee && (
          <StatCard icon="credit-card" label="Reimbursed"      value={fmt(summary?.total_reimbursed)} color="var(--purple)" />
        )}
      </div>

      {/* Recent claims */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Claims</div>
            <div className="card-subtitle">Latest 5 submissions</div>
          </div>
          <Link to={isEmployee ? '/my-claims' : '/approvals'} className="btn btn-ghost btn-sm">
            View all <Icon name="chevron-right" size={14} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Icon name="file-text" size={40} /></div>
            <h3>No claims yet</h3>
            <p>
              {isEmployee
                ? 'Submit your first travel expense claim to get started.'
                : 'No claims have been submitted yet.'}
            </p>
            {isEmployee && (
              <Link to="/claims/new" className="btn btn-primary" style={{ marginTop: 16 }}>
                <Icon name="plus" size={15} /> Submit a Claim
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recent.map(c => <ClaimCard key={c.id} claim={c} showEmployee={!isEmployee} />)}
          </div>
        )}
      </div>
    </div>
  );
}
