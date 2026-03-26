import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MdTrendingUp, MdInventory, MdSwapHoriz, MdAssignment, MdLocalFireDepartment, MdClose, MdShoppingCart, MdArrowUpward, MdArrowDownward } from 'react-icons/md';
import { format } from 'date-fns';

// ─── Net Movement Modal ───────────────────────────────────────────────────────
function NetMovementModal({ filters, onClose }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('purchases');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    api.get(`/dashboard/net-movement-detail?${params}`).then(r => {
      setData(r.data);
      setLoading(false);
    });
  }, []);

  const fmt = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '-';

  const tabs = [
    { key: 'purchases', label: `Purchases (${data?.purchases?.length ?? '…'})`, icon: <MdShoppingCart /> },
    { key: 'transfersIn', label: `Transfer In (${data?.transfersIn?.length ?? '…'})`, icon: <MdArrowUpward /> },
    { key: 'transfersOut', label: `Transfer Out (${data?.transfersOut?.length ?? '…'})`, icon: <MdArrowDownward /> },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Net Movement Detail</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Breakdown of all components contributing to Net Movement
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><MdClose /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
              Loading data...
            </div>
          ) : (
            <>
              <div className="tab-list">
                {tabs.map(t => (
                  <button key={t.key} className={`tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {tab === 'purchases' && (
                <div className="table-scroll">
                  <table>
                    <thead><tr>
                      <th>Asset</th><th>Type</th><th>Qty</th><th>Base</th><th>Date</th><th>Supplier</th>
                    </tr></thead>
                    <tbody>
                      {data.purchases.length === 0
                        ? <tr><td colSpan={6}><div className="empty-state">No purchases found</div></td></tr>
                        : data.purchases.map(p => (
                          <tr key={p._id}>
                            <td><strong>{p.assetName}</strong></td>
                            <td><span className={`asset-badge ${p.assetType}`}>{p.assetType}</span></td>
                            <td><strong style={{ color: 'var(--green)' }}>+{p.quantity}</strong></td>
                            <td>{p.baseId?.name}</td>
                            <td>{fmt(p.purchaseDate)}</td>
                            <td>{p.supplier || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'transfersIn' && (
                <div className="table-scroll">
                  <table>
                    <thead><tr>
                      <th>Asset</th><th>Type</th><th>Qty</th><th>From Base</th><th>Date</th>
                    </tr></thead>
                    <tbody>
                      {data.transfersIn.length === 0
                        ? <tr><td colSpan={5}><div className="empty-state">No inbound transfers found</div></td></tr>
                        : data.transfersIn.map(t => (
                          <tr key={t._id}>
                            <td><strong>{t.assetName}</strong></td>
                            <td><span className={`asset-badge ${t.assetType}`}>{t.assetType}</span></td>
                            <td><strong style={{ color: 'var(--green)' }}>+{t.quantity}</strong></td>
                            <td>{t.fromBase?.name}</td>
                            <td>{fmt(t.transferDate)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'transfersOut' && (
                <div className="table-scroll">
                  <table>
                    <thead><tr>
                      <th>Asset</th><th>Type</th><th>Qty</th><th>To Base</th><th>Date</th>
                    </tr></thead>
                    <tbody>
                      {data.transfersOut.length === 0
                        ? <tr><td colSpan={5}><div className="empty-state">No outbound transfers found</div></td></tr>
                        : data.transfersOut.map(t => (
                          <tr key={t._id}>
                            <td><strong>{t.assetName}</strong></td>
                            <td><span className={`asset-badge ${t.assetType}`}>{t.assetType}</span></td>
                            <td><strong style={{ color: 'var(--red)' }}>-{t.quantity}</strong></td>
                            <td>{t.toBase?.name}</td>
                            <td>{fmt(t.transferDate)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    baseId: isAdmin() ? '' : (user?.baseId?._id || user?.baseId || ''),
    startDate: '',
    endDate: '',
    assetType: '',
  });

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await api.get(`/dashboard?${params}`);
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => {
    if (isAdmin()) api.get('/bases').then(r => setBases(r.data));
  }, []);

  const metricCards = metrics ? [
    { label: 'Opening Balance', value: metrics.openingBalance, color: 'blue', icon: '📦', sub: 'Baseline inventory units' },
    { label: 'Closig Balance', value: metrics.closingBalance, color: 'green', icon: '✅', sub: 'Opening + Net Movement' },
    { label: 'Net Movement', value: metrics.netMovement, color: 'yellow', icon: '📊', sub: 'Purchases + In − Out', clickable: true },
    { label: 'Purchases', value: metrics.purchases, color: 'cyan', icon: '🛒', sub: 'Total units acquired' },
    { label: 'Transfer In', value: metrics.transferIn, color: 'purple', icon: '⬆️', sub: 'Units received from bases' },
    { label: 'Transfer Out', value: metrics.transferOut, color: 'red', icon: '⬇️', sub: 'Units sent to other bases' },
    { label: 'Assigned', value: metrics.assigned, color: 'blue', icon: '🎖️', sub: 'Currently assigned units' },
    { label: 'Expended', value: metrics.expended, color: 'red', icon: '🔥', sub: 'Consumed / expended units' },
  ] : [];

  return (
    <>
      {/* Filters */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <label>Start Date</label>
          <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        {isAdmin() && (
          <div className="filter-group">
            <label>Base</label>
            <select value={filters.baseId} onChange={e => setFilters(f => ({ ...f, baseId: e.target.value }))}>
              <option value="">All Bases</option>
              {bases.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className="filter-group">
          <label>Equipment Type</label>
          <select value={filters.assetType} onChange={e => setFilters(f => ({ ...f, assetType: e.target.value }))}>
            <option value="">All Types</option>
            <option value="vehicle">Vehicle</option>
            <option value="weapon">Weapon</option>
            <option value="ammunition">Ammunition</option>
            <option value="equipment">Equipment</option>
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          Loading metrics...
        </div>
      ) : (
        <div className="metrics-grid">
          {metricCards.map(card => (
            <div
              key={card.label}
              className={`metric-card ${card.color}${card.clickable ? ' clickable' : ''}`}
              onClick={card.clickable ? () => setShowModal(true) : undefined}
              title={card.clickable ? 'Click to view breakdown' : undefined}
            >
              <div className="metric-icon">{card.icon}</div>
              <div className="metric-label">{card.label}</div>
              <div className={`metric-value ${card.color}`}>{card.value?.toLocaleString()}</div>
              <div className="metric-sub">{card.sub}</div>
              {card.clickable && (
                <div className="metric-chip">🔍 Click for details</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Net Movement Modal (Bonus) */}
      {showModal && <NetMovementModal filters={filters} onClose={() => setShowModal(false)} />}
    </>
  );
}
