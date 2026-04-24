import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import Icon from '../components/Icon';

const fmt     = (n) => `PKR ${parseFloat(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLORS = {
  submitted:    '#4F7FFA',
  under_review: '#EDA024',
  approved:     '#14C583',
  rejected:     '#EF4560',
  reimbursed:   '#8F63EF',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color }}>
          {p.name}: {p.dataKey === 'amount' ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!data)   return <div className="alert alert-danger">Failed to load dashboard data.</div>;

  const { stats, byStatus, categoryBreakdown, monthlyTrend, overdueClaims } = data;

  const pieData = byStatus.map(s => ({
    name: s.status.replace('_', ' '),
    value: parseInt(s.count),
    status: s.status,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>System-wide overview of all travel expense activity.</p>
        </div>
        <Link to="/admin/users" className="btn btn-secondary">
          <Icon name="users" size={15} /> Manage Users
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard icon="layers"       label="Total Claims"    value={stats.total_claims}                      color="var(--accent)"  />
        <StatCard icon="clock"        label="Pending Review"  value={stats.pending_claims}
          sub={stats.pending_claims > 0 ? 'Needs attention' : 'All clear'}                                    color="var(--warning)" />
        <StatCard icon="check-circle" label="Approved"        value={stats.approved_claims}                   color="var(--success)" />
        <StatCard icon="credit-card"  label="This Month"      value={fmt(stats.this_month_amount)}            color="var(--purple)"  />
        <StatCard icon="dollar-sign"  label="Total Reimbursed" value={fmt(stats.reimbursed_amount)}           color="var(--gold)"    />
        <StatCard icon="alert-circle" label="Overdue Claims"  value={overdueClaims.length}
          sub="Submitted &gt;5 days, no review"
          color={overdueClaims.length > 0 ? 'var(--danger)' : 'var(--success)'}                                                    />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Claims by Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Claims by Status</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={88}
                dataKey="value" paddingAngle={3}>
                {pieData.map(entry => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#8898BE'} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                formatter={v => <span style={{ color: 'var(--text-2)', fontSize: 12 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Claim Amounts</div>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Last 6 months</span>
          </div>
          {monthlyTrend.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon"><Icon name="trending-up" size={36} /></div>
              <p>Not enough data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(79,127,250,0.06)' }} />
                <Bar dataKey="amount" name="Amount (PKR)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div className="card-title">Spend by Category</div>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Policy utilisation</span>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr><th>Category</th><th>Policy Limit</th><th>Total Spent</th><th>Items</th><th>Utilisation</th></tr>
            </thead>
            <tbody>
              {categoryBreakdown.map(cat => {
                const pct = cat.limit_amount > 0
                  ? (parseFloat(cat.total_amount) / parseFloat(cat.limit_amount)) * 100
                  : 0;
                const barColor = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--success)';
                return (
                  <tr key={cat.category}>
                    <td className="td-main">{cat.category}</td>
                    <td>{fmt(cat.limit_amount)}</td>
                    <td className="td-amount">{fmt(cat.total_amount)}</td>
                    <td>{cat.item_count}</td>
                    <td style={{ width: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', width: 34, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue Claims */}
      {overdueClaims.length > 0 && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="alert-circle" size={16} style={{ color: 'var(--danger)' }} />
              <div className="card-title" style={{ color: 'var(--danger)' }}>Overdue Claims</div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Submitted &gt; 5 days ago with no review</span>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Claim</th><th>Employee</th><th>Department</th><th>Submitted</th><th>Amount</th><th></th></tr>
              </thead>
              <tbody>
                {overdueClaims.map(c => (
                  <tr key={c.id}>
                    <td className="td-main">{c.title}</td>
                    <td>{c.employee_name}</td>
                    <td>{c.department || '—'}</td>
                    <td style={{ color: 'var(--danger)' }}>{fmtDate(c.created_at)}</td>
                    <td className="td-amount">{fmt(c.total_amount)}</td>
                    <td>
                      <a href={`/claims/${c.id}`} className="btn btn-warning btn-sm">Review</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
