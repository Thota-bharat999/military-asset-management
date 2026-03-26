import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdAdd, MdClose } from 'react-icons/md';

function TransferModal({ bases, userBase, onSave, onClose }) {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    assetName: '', assetType: 'vehicle', quantity: '',
    fromBase: userBase || '', toBase: '', notes: '',
    transferDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fromBase === form.toBase) return toast.error('From and To base must be different');
    setSaving(true);
    try {
      await api.post('/transfers', { ...form, quantity: Number(form.quantity) });
      toast.success('Transfer recorded successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record transfer');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Transfer</h2>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Asset Name *</label>
                <input className="form-control" value={form.assetName}
                  onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} required placeholder="e.g. Humvee" />
              </div>
              <div className="form-group">
                <label>Asset Type *</label>
                <select className="form-control" value={form.assetType}
                  onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))}>
                  <option value="vehicle">Vehicle</option>
                  <option value="weapon">Weapon</option>
                  <option value="ammunition">Ammunition</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input className="form-control" type="number" min="1" value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Transfer Date</label>
                <input className="form-control" type="date" value={form.transferDate}
                  onChange={e => setForm(f => ({ ...f, transferDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>From Base *</label>
                {isAdmin() ? (
                  <select className="form-control" value={form.fromBase}
                    onChange={e => setForm(f => ({ ...f, fromBase: e.target.value }))} required>
                    <option value="">Select base</option>
                    {bases.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                ) : (
                  <select className="form-control" disabled>
                    {bases.filter(b => b._id === userBase).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>To Base *</label>
                <select className="form-control" value={form.toBase}
                  onChange={e => setForm(f => ({ ...f, toBase: e.target.value }))} required>
                  <option value="">Select base</option>
                  {bases.filter(b => b._id !== form.fromBase).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>Notes</label>
              <input className="form-control" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Reason for transfer..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Create Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transfers() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState({ transfers: [], total: 0, pages: 1 });
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ baseId: '', startDate: '', endDate: '', assetType: '' });

  const userBaseId = user?.baseId?._id || user?.baseId || '';

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/transfers?${params}`);
      setData(res.data);
    } catch { toast.error('Failed to load transfers'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);
  useEffect(() => { api.get('/bases').then(r => setBases(r.data)); }, []);

  const fmt = (d) => d ? format(new Date(d), 'dd MMM yyyy HH:mm') : '-';

  const directionBadge = (t) => {
    const base = userBaseId;
    if (!base || isAdmin()) return null;
    if (t.toBase?._id === base || t.toBase === base) return <span className="status-badge completed">Inbound ↑</span>;
    if (t.fromBase?._id === base || t.fromBase === base) return <span className="status-badge expended">Outbound ↓</span>;
    return null;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transfers</h1>
          <p>Inter-base asset movement history and new transfers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><MdAdd /> New Transfer</button>
      </div>

      {/* Filters */}
      <div className="dashboard-filters" style={{ marginBottom: '1rem' }}>
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={filters.startDate} onChange={e => { setPage(1); setFilters(f => ({ ...f, startDate: e.target.value })); }} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={filters.endDate} onChange={e => { setPage(1); setFilters(f => ({ ...f, endDate: e.target.value })); }} />
        </div>
        {isAdmin() && (
          <div className="filter-group">
            <label>Base</label>
            <select value={filters.baseId} onChange={e => { setPage(1); setFilters(f => ({ ...f, baseId: e.target.value })); }}>
              <option value="">All Bases</option>
              {bases.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className="filter-group">
          <label>Equipment Type</label>
          <select value={filters.assetType} onChange={e => { setPage(1); setFilters(f => ({ ...f, assetType: e.target.value })); }}>
            <option value="">All Types</option>
            <option value="vehicle">Vehicle</option>
            <option value="weapon">Weapon</option>
            <option value="ammunition">Ammunition</option>
            <option value="equipment">Equipment</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Transfer History</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.total} records</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="loading-spinner pulse" style={{ margin: '0 auto 1rem' }}></div>Loading...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr>
                <th>Asset</th><th>Type</th><th>Qty</th><th>From Base</th><th>To Base</th>
                <th>Date</th><th>Status</th><th>Direction</th>
              </tr></thead>
              <tbody>
                {data.transfers.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">🔄</div>No transfers found</div></td></tr>
                ) : data.transfers.map(t => (
                  <tr key={t._id}>
                    <td><strong>{t.assetName}</strong></td>
                    <td><span className={`asset-badge ${t.assetType}`}>{t.assetType}</span></td>
                    <td><strong>{t.quantity.toLocaleString()}</strong></td>
                    <td>{t.fromBase?.name || '-'}</td>
                    <td>{t.toBase?.name || '-'}</td>
                    <td style={{ fontSize: '0.78rem' }}>{fmt(t.transferDate)}</td>
                    <td><span className={`status-badge ${t.status}`}>{t.status}</span></td>
                    <td>{directionBadge(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.pages > 1 && (
          <div className="pagination">
            <span>Page {page} of {data.pages}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-ghost btn-sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <TransferModal bases={bases} userBase={userBaseId}
          onSave={() => { setShowModal(false); fetchTransfers(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
