import { useState, useEffect, useCallback } from 'react';
import { Trash2, Search, AlertCircle, CheckCircle2, ChevronLeft, Package } from 'lucide-react';
import '../../styles/DeleteProduct.css';

const API_URL = import.meta.env.VITE_API_URL;

interface Props {
  onBack: () => void;
  products: any[];
  onRefresh: () => void;
}

const DeleteProduct = ({ onBack, products, onRefresh }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const reportViewAccess = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/audit/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: "ACCESO_VISTA",
          details: { vista: "Módulo de Eliminación", motivo: "Búsqueda de productos para dar de baja" }
        })
      });
    } catch (err) { console.warn("Audit log failed"); }
  }, []);

  useEffect(() => { reportViewAccess(); }, [reportViewAccess]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const handleDelete = async (id: number) => {
    if (!id) return;
    setIsDeleting(true);
    setStatusMessage(null);
    const token = localStorage.getItem('token'); 

    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        setStatusMessage({ text: "Producto eliminado correctamente", type: 'success' });
        onRefresh(); 
        setConfirmId(null);
        setSearchTerm('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setStatusMessage({ 
          text: errorData.message || "Error al eliminar el producto", 
          type: 'error' 
        });
      }
    } catch (error) {
      setStatusMessage({ text: "Error de conexión con el servidor", type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="delete-page-wrapper">
      <nav className="navigation-top">
        <button className="back-nav-link" onClick={onBack}>
          <div className="back-icon-circle"><ChevronLeft size={18} /></div>
          <div className="back-text-stack">
            <span className="back-label">Regresar</span>
            <span className="back-destination">Panel de Inventario</span>
          </div>
        </button>
      </nav>

      <div className="delete-glass-card">
        <div className="card-top-decoration-danger"></div>
        
        <header className="card-info-section">
          <div className="icon-badge-danger">
            <Trash2 size={32} />
          </div>
          <div className="header-titles">
            <h2>Baja de Suministros</h2>
            <p>Busque el producto para eliminarlo permanentemente del sistema</p>
          </div>
        </header>

        <div className="delete-content-area">
          {statusMessage && (
            <div className={`status-banner-modern ${statusMessage.type}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="full-width-field">
            <label>Buscar Producto</label>
            <div className="input-wrapper main-input">
              <Search size={20} className="field-icon-muted" />
              <input 
                type="text" 
                placeholder="Escribir nombre o SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="results-scroll-area">
            {searchTerm && filtered.map(p => (
              <div key={p.id} className={`mini-result-row delete-row ${confirmId === p.id ? 'confirm-mode' : ''}`}>
                <div className="result-main-info">
                  <div className="icon-box-small-danger"><Package size={18}/></div>
                  <div>
                    <span className="sku-badge-pill">{p.sku || 'SIN SKU'}</span>
                    <p className="product-name-text">{p.name}</p>
                  </div>
                </div>

                <div className="action-zone">
                  {confirmId === p.id ? (
                    <div className="confirmation-buttons animate-in">
                      <button onClick={() => handleDelete(p.id)} className="btn-confirm-execute" disabled={isDeleting}>
                        {isDeleting ? '...' : 'Eliminar ahora'}
                      </button>
                      <button onClick={() => setConfirmId(null)} className="btn-cancel-action" disabled={isDeleting}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(p.id)} className="delete-trigger-btn" title="Borrar">
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {searchTerm && filtered.length === 0 && (
              <div className="no-results-area">
                <Search size={40} className="empty-icon-muted" />
                <p>No se encontraron productos coincidentes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProduct;