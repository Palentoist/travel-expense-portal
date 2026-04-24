import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

const DEMO = [
  { role: 'Admin',    email: 'admin@portal.com',   password: 'password123' },
  { role: 'Manager',  email: 'manager@portal.com', password: 'password123' },
  { role: 'Employee', email: 'john@portal.com',    password: 'password123' },
  { role: 'Employee', email: 'emily@portal.com',   password: 'password123' },
];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-mark">
            <Icon name="plane" size={18} />
          </div>
          <div>
            <h1>TravelExpense</h1>
            <p>Reimbursement &amp; Approval Portal</p>
          </div>
        </div>

        <h2 className="login-heading">Sign in</h2>
        <p className="login-subheading">Enter your credentials to access the portal</p>

        {error && (
          <div className="login-error">
            <Icon name="alert-circle" size={15} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              className="form-control"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-control"
              type="password"
              placeholder="••••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            id="login-submit"
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '11px 18px' }}
          >
            {loading
              ? 'Signing in…'
              : <><Icon name="log-out" size={15} style={{ transform: 'rotate(180deg)' }} /> Sign in</>
            }
          </button>
        </form>

        {/* Demo credentials */}
        <div className="demo-box">
          <div className="demo-box-title">Demo Accounts — password: password123</div>
          {DEMO.map((u) => (
            <div key={u.email} className="demo-cred-row">
              <span className="demo-cred-role">{u.role}</span>
              <span className="demo-cred-email">{u.email}</span>
              <button
                className="demo-fill-btn"
                onClick={() => setForm({ email: u.email, password: u.password })}
              >
                Fill
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
