import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import Icon from './Icon';

const fmt     = (n) => `PKR ${parseFloat(n).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ClaimCard({ claim, showEmployee = false }) {
  return (
    <Link to={`/claims/${claim.id}`} className="claim-card">
      <div className="claim-card-header">
        <div>
          <div className="claim-card-title">{claim.title}</div>
          <div className="claim-card-dest">{claim.destination}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <StatusBadge status={claim.status} />
          <div className="claim-card-amount">{fmt(claim.total_amount)}</div>
        </div>
      </div>

      <div className="claim-card-meta">
        {showEmployee && (
          <div className="claim-meta-item">
            <Icon name="user" size={13} className="claim-meta-icon" />
            <strong>{claim.employee_name}</strong>
            {claim.department && <span style={{ color: 'var(--text-3)' }}> · {claim.department}</span>}
          </div>
        )}
        <div className="claim-meta-item">
          <Icon name="calendar" size={13} className="claim-meta-icon" />
          <strong>{fmtDate(claim.trip_start)}</strong>
          <span style={{ color: 'var(--text-3)' }}>to</span>
          <strong>{fmtDate(claim.trip_end)}</strong>
        </div>
        <div className="claim-meta-item">
          <Icon name="clock" size={13} className="claim-meta-icon" />
          <span>Submitted {fmtDate(claim.created_at)}</span>
        </div>
        {claim.reviewer_name && (
          <div className="claim-meta-item">
            <Icon name="eye" size={13} className="claim-meta-icon" />
            <span>Reviewed by <strong style={{ color: 'var(--text-2)' }}>{claim.reviewer_name}</strong></span>
          </div>
        )}
      </div>
    </Link>
  );
}
