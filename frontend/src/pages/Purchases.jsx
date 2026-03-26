import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdAdd, MdClose, MdFilterList } from 'react-icons/md';

function PurchaseModal({ bases, userBase, onSave, onClose }) {
  const [form, setForm] = useState({
    assetName: '', assetType: 'weapon', quantity: '', baseId: userBase || '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'), supplier: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const { isAdmin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/purchases', { ...form, quantity: Number(form.quantity) });
      toast.success('Purchase recorded successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Record Purchase</h2>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Asset Name *</label>
                <input className="form-control" value={form.assetName}
                  onChange={e => setForm(f => ({ ...f, assetName: e.target.value }))} required placeholder="e.g. M4 Carbine" />
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
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required placeholder="e.g. 50" />
              </div>
              <div className="form-group">
                <label>Base *</label>
                {isAdmin() ? (
                  <select className="form-control" value={form.baseId}
                    onChange={e => setForm(f => ({ ...f, baseId: e.target.value }))} required>
                    <option value="">Select base</option>
                    {bases.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                ) : (
                  <select className="form-control" value={form.baseId} disabled>
                    {bases.filter(b => b._id === userBase).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>Purchase Date</label>
                <input className="form-control" type="date" value={form.purchaseDate}
                  onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <input className="form-control" value={form.supplier}
                  onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Supplier name" />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>Notes</label>
              <input className="form-control" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Record Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Purchases() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState({ purchases: [], total: 0, pages: 1 });
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ baseId: '', startDate: '', endDate: '', assetType: '' });

  const userBaseId = user?.baseId?._id || user?.baseId || '';

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/purchases?${params}`);
      setData(res.data);
    } catch { toast.error('Failed to load purchases'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);
  useEffect(() => { api.get('/bases').then(r => setBases(r.data)); }, []);

  const fmt = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '-';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Purchases</h1>
          <p>Record and manage asset acquisitions across bases</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><MdAdd /> New Purchase</button>
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

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h2>Purchase History</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.total} records</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="loading-spinner pulse" style={{ margin: '0 auto 1rem' }}></div>Loading...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr>
                <th>Asset Name</th><th>Type</th><th>Qty</th><th>Base</th>
                <th>Date</th><th>Supplier</th><th>Recorded By</th>
              </tr></thead>
              <tbody>
                {data.purchases.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">📦</div>No purchases found</div></td></tr>
                ) : data.purchases.map(p => (
                  <tr key={p._id}>
                    <td><strong>{p.assetName}</strong></td>
                    <td><span className={`asset-badge ${p.assetType}`}>{p.assetType}</span></td>
                    <td><strong style={{ color: 'var(--green)' }}>{p.quantity.toLocaleString()}</strong></td>
                    <td>{p.baseId?.name || '-'}</td>
                    <td>{fmt(p.purchaseDate)}</td>
                    <td>{p.supplier || '—'}</td>
                    <td>{p.createdBy?.name || p.createdBy?.username || '—'}</td>
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
        <PurchaseModal bases={bases} userBase={userBaseId}
          onSave={() => { setShowModal(false); fetchPurchases(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
