import Icon from './Icon';

// Maps color CSS vars to their pre-defined dim equivalents
const DIM_MAP = {
  'var(--accent)':   'var(--accent-dim)',
  'var(--success)':  'var(--success-dim)',
  'var(--warning)':  'var(--warning-dim)',
  'var(--danger)':   'var(--danger-dim)',
  'var(--purple)':   'var(--purple-dim)',
  'var(--gold)':     'var(--gold-dim)',
  'var(--info)':     'var(--accent-dim)',
};

export default function StatCard({ icon, label, value, sub, color = 'var(--accent)' }) {
  const iconBg = DIM_MAP[color] || 'rgba(255,255,255,0.06)';
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-icon-wrap" style={{ background: iconBg }}>
          <Icon name={icon} size={17} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="stat-card-value" style={{ color }}>{value}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  );
}
