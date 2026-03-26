import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdShield, MdPerson, MdLock } from 'react-icons/md';

const DEMO_CREDS = [
  { username: 'admin', password: 'admin123', label: 'Admin' },
  { username: 'commander_alpha', password: 'pass123', label: 'Commander (Alpha)' },
  { username: 'logistics1', password: 'pass123', label: 'Logistics Officer' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred) => setForm({ username: cred.username, password: cred.password });

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon"><MdShield /></div>
          <h1>Military AMS</h1>
          <p>Asset Management System — Secure Access</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label>Username</label>
            <div style={{ position: 'relative' }}>
              <MdPerson style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: '2rem' }}
                type="text"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <MdLock style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: '2rem' }}
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Credentials</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {DEMO_CREDS.map(c => (
              <button
                key={c.username}
                onClick={() => fillDemo(c)}
                style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.75rem',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.75rem', transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.username} / {c.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
