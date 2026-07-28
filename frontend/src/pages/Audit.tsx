import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, RefreshCw, ChevronRight, Clock, 
  User, Activity, ShieldCheck, Database, X, Eye,
  ChevronLeft, Calendar
} from 'lucide-react';
import '../styles/Audit.css';

const API_URL = import.meta.env.VITE_API_URL;

const Auditoria: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAuditData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setLogs(Array.isArray(result) ? result : result.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error cargando auditoría:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuditData(); }, [fetchAuditData]);

  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      const term = searchTerm.toLowerCase();
      const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
      const matchesSearch = item.user?.toLowerCase().includes(term) || 
                           item.action?.toLowerCase().includes(term);
      const matchesDate = filterDate === '' || itemDate === filterDate;
      return matchesSearch && matchesDate;
    });
  }, [logs, searchTerm, filterDate]);

  const totalPages = Math.ceil(filteredLogs.length / recordsPerPage);
  
  const currentLogs = useMemo(() => {
    if (isMobile) return filteredLogs;
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return filteredLogs.slice(indexOfFirstRecord, indexOfLastRecord);
  }, [filteredLogs, currentPage, isMobile]);

  return (
    <div className="audit-page-container">
      {selectedLog && (
        <div className="audit-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="audit-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Eye size={20} color="var(--accent)"/> Registro Detallado
              </h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} color="var(--accent)"/> <strong>Operador:</strong> {selectedLog.user}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={14} color="var(--accent)"/> <strong>Acción:</strong> {selectedLog.action}</p>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={14} color="var(--accent)"/> <strong>Fecha:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</p>
            </div>

            <pre className="json-viewer">
              {JSON.stringify(selectedLog.details || selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <header className="audit-header-pro">
        <div className="title-section">
          <h1>Centro de Auditoría</h1>
          <p>Trazabilidad Completa — Suministros Mariu 3000 C.A.</p>
        </div>
        
        <button className="btn-sync" onClick={fetchAuditData} disabled={loading}>
          <RefreshCw size={20} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Sincronizando...' : 'Actualizar'}</span>
        </button>
      </header>

      <main className="audit-main-layout">
        <section className="audit-list-container">
          {!isMobile && (
            <div style={{ padding: '0 2rem', display: 'grid', gridTemplateColumns: '160px 1fr 200px 140px', gap: '20px', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12}/> TIEMPO
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <User size={12}/> OPERADOR
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Activity size={12}/> ACCIÓN
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                <Database size={12}/> DATA
              </span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Cargando bitácora...</div>
          ) : (
            <>
              {currentLogs.map((log, index) => (
                <div key={log.id || index} className="audit-row-card">
                  <div className="log-time">
                    <div style={{ fontWeight: 800 }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                  </div>

                  <div className="log-user" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                      width: 38, height: 38, borderRadius: '12px', 
                      background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                      color: 'white', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', fontWeight: 800
                    }}>
                      {log.user?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 700 }}>{log.user || 'Sistema'}</span>
                  </div>

                  <div className="log-action">
                    <span className="action-badge" style={{
                      background: log.action?.includes('DELETE') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                      color: log.action?.includes('DELETE') ? '#ef4444' : 'var(--accent)',
                    }}>
                      {log.action?.replace('METHOD_', '') || 'EVENTO'}
                    </span>
                  </div>

                  <div className="log-details-btn" style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => setSelectedLog(log)}
                      style={{ 
                        background: 'rgba(99, 102, 241, 0.1)', border: 'none',
                        color: 'var(--accent)', padding: '8px 14px', borderRadius: '10px',
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto'
                      }}
                    >
                      Detalles <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              ))}

              {!isMobile && filteredLogs.length > recordsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    style={{ background: 'none', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)' }}
                  >
                    <ChevronLeft size={18}/>
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Página {currentPage} de {totalPages}</span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    style={{ background: 'none', border: '1px solid var(--border)', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)' }}
                  >
                    <ChevronRight size={18}/>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="audit-sidebar">
          <div className="side-panel-glass">
            <h4><Search size={18} color="var(--accent)"/> Filtrado</h4>
            <div className="search-input-wrapper">
              <input 
                type="text" 
                placeholder="Usuario o evento..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <h4 style={{ marginTop: '1.5rem' }}><Calendar size={18} color="var(--accent)"/> Por Fecha</h4>
            <div className="search-input-wrapper">
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%' }}
              />
            </div>

            <div className="integrity-card">
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
                <ShieldCheck size={12} style={{ marginRight: 5 }}/> Integridad
              </div>
              <h2>100%</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Datos validados.</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default Auditoria;