import { Save, Package, DollarSign, Hash, Layers, Lock, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import '../../styles/CreateProduct.css';

const API_URL = import.meta.env.VITE_API_URL;

const CreateProduct = ({ onBack, onRefresh }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [generatedSku, setGeneratedSku] = useState('');
  const [priceUSD, setPriceUSD] = useState<string>('');
  const [rate, setRate] = useState<number>(0);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'var(--bg-panel)',
    color: 'var(--text-main)',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

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

  const reportViewAccess = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/audit/manual`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "ACCESO_VISTA",
          details: { vista: "Formulario de Nuevo Suministro", timestamp: new Date().toISOString() }
        })
      });
    } catch (err) { console.warn("Auditoría no registrada"); }
  }, []);

  useEffect(() => { 
    reportViewAccess();
    fetchRate();
  }, [reportViewAccess, fetchRate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(setCategories)
      .catch(err => console.error("Error al cargar categorías:", err));
  }, []);

  useEffect(() => {
    if (productName.trim().length >= 3 && categoryId) {
      const categoryObj = categories.find(c => c.id === Number(categoryId));
      const categoryName = categoryObj?.name || 'GEN';
      
      const catPrefix = categoryName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      
      const words = productName.trim().toUpperCase().split(/\s+/);
      let namePart = "";
      
      if (words.length >= 2) {
        namePart = words.map(w => w[0]).join('').substring(0, 4);
      } else {
        namePart = words[0].substring(0, 4);
      }
      
      const timestamp = Date.now().toString().slice(-4);
      const randomPart = Math.floor(10 + Math.random() * 89);
      
      setGeneratedSku(`${namePart}-${catPrefix}-${timestamp}${randomPart}`);
    } else {
      setGeneratedSku('');
    }
  }, [productName, categoryId, categories]);

  const priceInBS = useMemo(() => {
    const numericPrice = parseFloat(priceUSD);
    if (isNaN(numericPrice) || rate === 0) return "0,00";
    return (numericPrice * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [priceUSD, rate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!generatedSku) return Toast.fire({ icon: 'warning', title: 'Faltan datos para generar el código' });
    
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      sku: generatedSku,
      name: productName,
      categoryId: Number(categoryId),
      current_stock: Number(formData.get('current_stock')),
      price: Number(priceUSD),
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        await Swal.fire({
          title: '¡Registro Exitoso!',
          text: `El producto ${productName} ha sido integrado con el código ${generatedSku}`,
          icon: 'success',
          confirmButtonColor: '#6366f1',
          background: 'var(--bg-panel)',
          color: 'var(--text-main)'
        });
        onRefresh();
        onBack();
      } else {
        Toast.fire({ icon: 'error', title: 'Error al registrar el producto' });
      }
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error de red o servidor' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-page-wrapper">
      <nav className="navigation-top">
        <button className="back-nav-link" onClick={onBack}>
          <div className="back-icon-circle">
            <ChevronLeft size={18} />
          </div>
          <div className="back-text-stack">
            <span className="back-label">Regresar</span>
            <span className="back-destination">Panel de Inventario</span>
          </div>
        </button>
      </nav>
      <div className="create-glass-card">
        <div className="card-top-decoration"></div>
        <header className="card-info-section">
          <div className="icon-badge-main">
            <Package size={32} />
          </div>
          <div className="header-titles">
            <h2>Nuevo Suministro</h2>
            <p>Complete los datos para la integración automática en el sistema</p>
          </div>
        </header>
        <form className="modern-form" onSubmit={handleSubmit}>
          <section className="form-group-container">
            <h3 className="section-title"><Layers size={18} /> Definición de Producto</h3>
            
            <div className="full-width-field">
              <label>Nombre Comercial</label>
              <div className="input-wrapper main-input">
                <input 
                  name="name" 
                  type="text" 
                  placeholder="Ej: Marcador Permanente Negro" 
                  value={productName} 
                  onChange={(e) => setProductName(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <div className="input-row-grid">
              <div className="input-field">
                <label>Categoría</label>
                <div className="input-wrapper">
                  <select name="categoryId" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Seleccionar familia...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-field">
                <label className="sku-label">
                  Código ID
                  <span className="lock-tag-pill"><Lock size={10} /> AUTO</span>
                </label>
                <div className="input-wrapper sku-readonly-box">
                  <input 
                    name="sku" 
                    type="text" 
                    value={generatedSku} 
                    readOnly 
                    placeholder="Generando código..."
                  />
                </div>
              </div>
            </div>
          </section>
          <section className="form-group-container">
            <h3 className="section-title"><DollarSign size={18} /> Parámetros de Almacén</h3>
            <div className="input-row-grid">
              <div className="input-field">
                <label>Existencia Inicial</label>
                <div className="input-wrapper">
                  <Hash size={18} className="field-icon-muted" />
                  <input name="current_stock" type="number" placeholder="Cantidad física" required />
                </div>
              </div>
              <div className="input-field">
                <label>Valor Unitario</label>
                <div className="input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input 
                    name="price" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    value={priceUSD}
                    onChange={(e) => setPriceUSD(e.target.value)}
                    required 
                  />
                </div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', justifyContent: 'flex-end' }}>
                   ≈ Bs. {priceInBS}
                </div>
              </div>
            </div>
          </section>

          <div className="form-actions-area">
            <button type="submit" disabled={isSubmitting || !generatedSku} className="primary-save-button">
              {isSubmitting ? (
                <div className="spinner-small"></div>
              ) : (
                <>
                  <Save size={20} />
                  <span>Finalizar y Registrar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;