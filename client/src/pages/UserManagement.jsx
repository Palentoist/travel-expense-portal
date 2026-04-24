import { useEffect, useState } from 'react';
import api from '../api/axios';
import Icon from '../components/Icon';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const ROLES   = ['employee', 'manager', 'admin'];

const ROLE_COLORS = {
  admin:    'var(--danger)',
  manager:  'var(--warning)',
  employee: 'var(--accent)',
};

const initials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function UserManagement() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ name: '', email: '', password: '', role: 'employee', department: '' });
  const [saving,    setSaving]    = useState(false);
  const [formErr,   setFormErr]   = useState('');
  const [flash,     setFlash]     = useState('');
  const [deleting,  setDeleting]  = useState(null);

  const load = () =>
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3500); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      setFormErr('Name, email, password and role are required.');
      return;
    }
    setSaving(true); setFormErr('');
    try {
      await api.post('/admin/users', form);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'employee', department: '' });
      showFlash('User created successfully.');
      load();
    } catch (err) {
      setFormErr(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Delete "${userName}"? This action cannot be undone.`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      showFlash(`${userName} has been removed.`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Create and manage portal users and their roles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={15} /> Add User
        </button>
      </div>

      {flash && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <Icon name="check-circle" size={15} />{flash}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">All Users</div>
            <div className="card-subtitle">{users.length} registered accounts</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Claims</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: `linear-gradient(135deg, ${ROLE_COLORS[u.role]}, ${ROLE_COLORS[u.role]}88)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.02em',
                        }}>
                          {initials(u.name)}
                        </div>
                        <div>
                          <div className="td-main">{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td>{u.department || <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: u.claim_count > 0 ? 'var(--accent)' : 'var(--text-3)' }}>
                        {u.claim_count}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12.5 }}>{fmtDate(u.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)', padding: '5px 10px' }}
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={deleting === u.id}
                      >
                        <Icon name="trash" size={14} />
                        {deleting === u.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create New User</div>
            <div className="modal-subtitle">
              The new account will be active immediately with the password you set.
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-control" placeholder="Jane Doe"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address <span className="required">*</span></label>
                  <input className="form-control" type="email" placeholder="jane@company.com"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <input className="form-control" type="password" placeholder="Minimum 6 characters"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role <span className="required">*</span></label>
                  <select className="form-control" value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-control" placeholder="e.g. Sales, Marketing, Finance"
                  value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>

              {formErr && (
                <div className="alert alert-danger">
                  <Icon name="alert-circle" size={14} />{formErr}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : <><Icon name="check" size={14} /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
