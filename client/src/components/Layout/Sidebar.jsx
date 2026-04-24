import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../Icon';

const ROLE_LABEL = { admin: 'Administrator', manager: 'Finance Manager', employee: 'Employee' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const cls = ({ isActive }) => isActive ? 'active' : '';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <Icon name="plane" size={16} />
        </div>
        <div className="sidebar-logo-text">
          <h2>TravelExpense</h2>
          <span>Reimbursement Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Overview</p>

        <NavLink to="/dashboard" className={cls}>
          <span className="nav-icon"><Icon name="home" size={16} /></span>
          Dashboard
        </NavLink>

        {user?.role === 'employee' && (
          <>
            <p className="sidebar-section-label">My Expenses</p>
            <NavLink to="/claims/new" className={cls}>
              <span className="nav-icon"><Icon name="plus" size={16} /></span>
              Submit Claim
            </NavLink>
            <NavLink to="/my-claims" className={cls}>
              <span className="nav-icon"><Icon name="list" size={16} /></span>
              My Claims
            </NavLink>
          </>
        )}

        {(user?.role === 'manager' || user?.role === 'admin') && (
          <>
            <p className="sidebar-section-label">Review</p>
            <NavLink to="/approvals" className={cls}>
              <span className="nav-icon"><Icon name="check-circle" size={16} /></span>
              Approval Queue
            </NavLink>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <p className="sidebar-section-label">Administration</p>
            <NavLink to="/admin" end className={cls}>
              <span className="nav-icon"><Icon name="bar-chart" size={16} /></span>
              Dashboard
            </NavLink>
            <NavLink to="/admin/users" className={cls}>
              <span className="nav-icon"><Icon name="users" size={16} /></span>
              User Management
            </NavLink>
          </>
        )}
      </nav>

      {/* User panel */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <strong>{user?.name}</strong>
            <span>{ROLE_LABEL[user?.role] || user?.role}</span>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out">
            <Icon name="log-out" size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
