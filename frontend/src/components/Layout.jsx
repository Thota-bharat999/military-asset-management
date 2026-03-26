import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdDashboard, MdShoppingCart, MdSwapHoriz, MdAssignment, MdLogout, MdShield } from 'react-icons/md';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: <MdDashboard /> },
  { to: '/purchases', label: 'Purchases', icon: <MdShoppingCart /> },
  { to: '/transfers', label: 'Transfers', icon: <MdSwapHoriz /> },
  { to: '/assignments', label: 'Assignments', icon: <MdAssignment /> },
];

const pageLabels = {
  '/dashboard': { title: 'Command Dashboard', sub: 'Asset overview and key metrics' },
  '/purchases': { title: 'Purchases', sub: 'Record and manage asset acquisitions' },
  '/transfers': { title: 'Transfers', sub: 'Inter-base asset movement history' },
  '/assignments': { title: 'Assignments & Expenditures', sub: 'Track assigned and expended assets' },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const page = pageLabels[location.pathname] || { title: 'MAMS', sub: '' };

  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'U';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><MdShield /></div>
          <h1>MilitaryAMS</h1>
          <p>Asset Management System</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name" title={user?.name}>{user?.name}</div>
              <div className="user-role">{user?.role?.replace('_', ' ')}</div>
            </div>
            <button className="logout-btn" onClick={logout} title="Logout">
              <MdLogout size={16} />
            </button>
          </div>
          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
            <span className={`role-badge ${user?.role}`}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{page.title}</div>
            <div className="topbar-subtitle">{page.sub}</div>
          </div>
          {user?.baseId && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              📍 {user.baseId.name}
            </span>
          )}
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
