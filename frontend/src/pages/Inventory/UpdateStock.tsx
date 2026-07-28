import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Search, Package, Hash, PlusCircle, MinusCircle, DollarSign, ChevronLeft, Layers } from 'lucide-react';
import Swal from 'sweetalert2';
import '../../styles/UpdateStock.css';

const API_URL = import.meta.env.VITE_API_URL;

interface UpdateStockProps {
  onBack: () => void;
  products: any[];
  onRefresh: () => void;
}

const UpdateStock = ({ onBack, products, onRefresh }: UpdateStockProps) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rate, setRate] = useState<number>(0);
  const [priceInput, setPriceInput] = useState<string>('');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const fetchRate = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/exchange-rates/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.usd) setRate(data.usd);
    } catch (err) {
      console.error("Error al obtener tasa:", err);
    }
  }, []);

  const reportAuditAction = useCallback(async (action: string, details: object) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/audit/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, details })
      });
    } catch (err) { console.warn("Audit log failed"); }
  }, []);

  useEffect(() => { 
    reportAuditAction("ACCESO_VISTA", { vista: "Ajuste de Stock y Precios", operacion: "Consultando existencias" }); 
    fetchRate();
  }, [reportAuditAction, fetchRate]);

  useEffect(() => {
    if (selected) {
      setPriceInput(selected.price.toString());
      setOperation('add'); // Resetear a suma por defecto al cambiar producto
    }
  }, [selected]);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const formatBs = (usdPrice: number) => {
    if (!usdPrice || rate === 0) return "0,00";
    return (usdPrice * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const priceInBS = useMemo(() => {
    return formatBs(parseFloat(priceInput));
  }, [priceInput, rate]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const inputAmount = Number(formData.get('amount'));
    
    // Calcular nuevo valor
    const adjustment = operation === 'add' ? inputAmount : -inputAmount;
    const newStockValue = Number(selected.current_stock) + adjustment;

    // Validación: No permitir stock negativo
    if (newStockValue < 0) {
      Swal.fire({
        title: 'Operación Inválida',
        text: `No hay suficiente stock. El saldo actual es ${selected.current_stock} y se intentó restar ${inputAmount}.`,
        icon: 'error',
        confirmButtonColor: '#008080'
      });
      return;
    }

    setIsUpdating(true);
    const token = localStorage.getItem('token'); 

    try {
      const response = await fetch(`${API_URL}/products/${selected.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          current_stock: newStockValue,
          price: Number(priceInput) 
        }),
      });

      if (response.ok) {
        await reportAuditAction("AJUSTE_INVENTARIO", {
          producto: selected.name,
          sku: selected.sku,
          stock_anterior: selected.current_stock,
          stock_nuevo: newStockValue,
          ajuste: adjustment
        });

        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Existencias y precio guardados con éxito',
          timer: 1500,
          showConfirmButton: false
        });

        onRefresh();
        onBack();
      } else {
        Swal.fire('Error', 'No se pudo actualizar el producto', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Error de conexión', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="update-page-wrapper">
      <nav className="navigation-top">
        <button className="back-nav-link" onClick={onBack}>
          <div className="back-icon-circle"><ChevronLeft size={18} /></div>
          <div className="back-text-stack">
            <span className="back-label">Regresar</span>
            <span className="back-destination">Panel de Inventario</span>
          </div>
        </button>
      </nav>

      <div className="update-glass-card">
        <div className="card-top-decoration"></div>
        
        <header className="card-info-section">
          <div className="icon-badge-main">
            <Layers size={32} />
          </div>
          <div className="header-titles">
            <h2>{selected ? 'Ajustar Existencias' : 'Buscar Suministro'}</h2>
            <p>{selected ? `Modificando: ${selected.name}` : 'Añada existencias o actualice precios de venta'}</p>
          </div>
        </header>

        <div className="modern-form-container">
          {!selected ? (
            <div className="search-step animate-in">
              <div className="full-width-field">
                <label>Búsqueda de producto</label>
                <div className="input-wrapper main-input">
                  <Search size={20} className="field-icon-muted"/>
                  <input 
                    type="text" 
                    placeholder="Escribe nombre o SKU..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="results-scroll-area">
                {search.length > 0 ? (
                  filtered.length > 0 ? (
                    filtered.map(p => (
                      <div key={p.id} className="mini-result-row" onClick={() => setSelected(p)}>
                        <div className="result-main-info">
                           <div className="icon-box-small"><Package size={18}/></div>
                           <div>
                              <span className="sku-badge-pill">{p.sku || 'S/N'}</span>
                              <p className="product-name-text">{p.name}</p>
                           </div>
                        </div>
                        <div className="result-stats" style={{ textAlign: 'right' }}>
                          <p className="price-text-sm">${p.price}</p>
                          {rate > 0 && (
                            <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '600', marginTop: '-2px' }}>
                              Bs. {formatBs(p.price)}
                            </p>
                          )}
                          <span className={`stock-pill-small ${p.current_stock <= 5 ? 'danger' : 'safe'}`} style={{ marginTop: '4px' }}>
                             {p.current_stock} un.
                          </span>
                        </div>
                      </div>
                    ))
                  ) : <div className="no-results-text">No se encontraron coincidencias</div>
                ) : <div className="no-results-text">Inicie la búsqueda para ver resultados...</div>}
              </div>
            </div>
          ) : (
            <form className="update-step animate-in" onSubmit={handleUpdate}>
              <div className="operation-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                <button 
                  type="button" 
                  className={`toggle-btn ${operation === 'add' ? 'active-add' : ''}`}
                  onClick={() => setOperation('add')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: operation === 'add' ? 'rgba(0, 128, 128, 0.2)' : 'var(--bg-glass)', color: operation === 'add' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}
                >
                  <PlusCircle size={18} /> Sumar
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${operation === 'subtract' ? 'active-sub' : ''}`}
                  onClick={() => setOperation('subtract')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: operation === 'subtract' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-glass)', color: operation === 'subtract' ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}
                >
                  <MinusCircle size={18} /> Restar
                </button>
              </div>

              <div className="input-row-grid">
                <div className="input-field">
                  <label>Stock Actual</label>
                  <div className="input-wrapper readonly-field">
                    <Hash size={18} className="field-icon-muted"/>
                    <input type="number" value={selected.current_stock} disabled />
                  </div>
                </div>
                
                <div className="input-field">
                  <label>{operation === 'add' ? 'Añadir Cantidad' : 'Retirar Cantidad'}</label>
                  <div className="input-wrapper">
                    {operation === 'add' ? 
                      <PlusCircle size={18} className="field-icon-muted" style={{color: 'var(--primary)'}}/> :
                      <MinusCircle size={18} className="field-icon-muted" style={{color: '#ef4444'}}/>
                    }
                    <input name="amount" type="number" placeholder="Ej: 10" required autoFocus defaultValue={0} min={0} />
                  </div>
                </div>
              </div>

              <div className="full-width-field" style={{marginTop: '1.5rem'}}>
                <label>Precio Unitario de Venta ($)</label>
                <div className="input-wrapper">
                  <DollarSign size={18} className="field-icon-muted" style={{color: 'var(--accent-blue)'}}/>
                  <input 
                    name="price" 
                    type="number" 
                    step="0.01" 
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    required 
                  />
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', justifyContent: 'flex-end' }}>
                    ≈ Bs. {priceInBS}
                </div>
              </div>

              <div className="form-actions-area-horizontal">
                <button type="submit" className="primary-save-button" disabled={isUpdating}>
                  {isUpdating ? <div className="spinner-small"></div> : <><Save size={20}/> <span>Confirmar Ajuste</span></>}
                </button>
                <button type="button" onClick={() => setSelected(null)} className="secondary-cancel-button">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateStock;