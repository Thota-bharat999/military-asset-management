import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { MdAdd, MdClose, MdLocalFireDepartment } from 'react-icons/md';

function AssignmentModal({ bases, userBase, onSave, onClose }) {
  const { isAdmin } = useAuth();
  const [form, setForm] = useState({
    assetName: '', assetType: 'weapon', quantity: '',
    baseId: userBase || '', assignedTo: '', notes: '',
    assignmentDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assignments', { ...form, quantity: Number(form.quantity) });
      toast.success('Assignment recorded successfully');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record assignment');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Assignment</h2>
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
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
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
                  <select className="form-control" disabled>
                    {bases.filter(b => b._id === userBase).map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Assigned To *</label>
                <input className="form-control" value={form.assignedTo}
                  onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} required
                  placeholder="e.g. Sgt. John Doe / Alpha Platoon" />
              </div>
              <div className="form-group">
                <label>Assignment Date</label>
                <input className="form-control" type="date" value={form.assignmentDate}
                  onChange={e => setForm(f => ({ ...f, assignmentDate: e.target.value }))} />
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
              {saving ? 'Saving...' : 'Record Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Assignments() {
  const { user, isAdmin, isCommander, isLogistics } = useAuth();
  const [data, setData] = useState({ assignments: [], total: 0, pages: 1 });
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [expendingId, setExpendingId] = useState(null);
  const [filters, setFilters] = useState({ baseId: '', startDate: '', endDate: '', assetType: '', isExpended: '' });

  const userBaseId = user?.baseId?._id || user?.baseId || '';
  const canCreate = isAdmin() || isCommander();

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      Object.entries(filters).forEach(([k, v]) => { if (v !== '') params.append(k, v); });
      const res = await api.get(`/assignments?${params}`);
      setData(res.data);
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);
  useEffect(() => { api.get('/bases').then(r => setBases(r.data)); }, []);

  const handleExpend = async (id) => {
    if (!window.confirm('Mark this assignment as expended?')) return;
    setExpendingId(id);
    try {
      await api.patch(`/assignments/${id}/expend`);
      toast.success('Asset marked as expended');
      fetchAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to expend');
    } finally { setExpendingId(null); }
  };

  const fmt = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '-';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Assignments & Expenditures</h1>
          <p>Track asset assignments to personnel and record expenditures</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><MdAdd /> New Assignment</button>
        )}
      </div>

      {/* Info bar for logistics officer */}
      {isLogistics() && (
        <div style={{ background: 'var(--yellow-bg)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--yellow)' }}>
          ℹ️ You have read-only access to assignments. Create/expend actions require Base Commander or Admin role.
        </div>
      )}

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
        <div className="filter-group">
          <label>Expended?</label>
          <select value={filters.isExpended} onChange={e => { setPage(1); setFilters(f => ({ ...f, isExpended: e.target.value })); }}>
            <option value="">All</option>
            <option value="false">Active Only</option>
            <option value="true">Expended Only</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Assignment Records</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.total} records</span>
        </div>
        {loading ? (
          <div className="empty-state"><div className="loading-spinner pulse" style={{ margin: '0 auto 1rem' }}></div>Loading...</div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr>
                <th>Asset</th><th>Type</th><th>Qty</th><th>Assigned To</th>
                <th>Base</th><th>Date</th><th>Status</th>
                {canCreate && <th>Action</th>}
              </tr></thead>
              <tbody>
                {data.assignments.length === 0 ? (
                  <tr><td colSpan={canCreate ? 8 : 7}><div className="empty-state"><div className="empty-icon">🎖️</div>No assignments found</div></td></tr>
                ) : data.assignments.map(a => (
                  <tr key={a._id}>
                    <td><strong>{a.assetName}</strong></td>
                    <td><span className={`asset-badge ${a.assetType}`}>{a.assetType}</span></td>
                    <td><strong>{a.quantity.toLocaleString()}</strong></td>
                    <td>{a.assignedTo}</td>
                    <td>{a.baseId?.name || '-'}</td>
                    <td>{fmt(a.assignmentDate)}</td>
                    <td>
                      {a.isExpended
                        ? <span className="status-badge expended">🔥 Expended</span>
                        : <span className="status-badge active">✅ Active</span>}
                    </td>
                    {canCreate && (
                      <td>
                        {!a.isExpended && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={expendingId === a._id}
                            onClick={() => handleExpend(a._id)}
                          >
                            <MdLocalFireDepartment />
                            {expendingId === a._id ? 'Processing...' : 'Expend'}
                          </button>
                        )}
                        {a.isExpended && a.expendedDate && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{fmt(a.expendedDate)}</span>
                        )}
                      </td>
                    )}
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
        <AssignmentModal bases={bases} userBase={userBaseId}
          onSave={() => { setShowModal(false); fetchAssignments(); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
