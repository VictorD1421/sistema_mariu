import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, RefreshCw, Layers, Package, AlertOctagon, 
  TrendingUp, Search, Trash2, Tag, Target, Zap
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import CreateProduct from './CreateProduct';
import UpdateStock from './UpdateStock';
import InventoryList from './InventoryList';
import CategoryManager from './CategoryManager';
import DeleteProduct from './DeleteProduct'; 
import '../../styles/Inventory.css';

const API_URL = import.meta.env.VITE_API_URL;

const Inventory = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'menu' | 'create' | 'update' | 'list' | 'categories' | 'delete'>('menu');
  const [quickSearch, setQuickSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(36.50);

  const hasAdvancedPrivileges = user?.role === 'SUPERUSER' || user?.role === 'ADMIN';

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

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [prodRes, rateRes] = await Promise.all([
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/exchange-rates/latest`, { headers })
      ]);

      const data = await prodRes.json();
      const rateData = await rateRes.json();

      setProducts(Array.isArray(data) ? data : []);
      if (rateData && rateData.usd) {
        setRate(rateData.usd);
      }
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const stats = useMemo(() => {
    const lowStock = products.filter(p => Number(p.current_stock) <= (p.min_stock || 5));
    const totalUSD = products.reduce((acc, p) => acc + (Number(p.price) * p.current_stock), 0);
    const totalBS = totalUSD * rate;
    const health = products.length > 0 
      ? Math.round(((products.length - lowStock.length) / products.length) * 100) 
      : 100;

    return {
      lowStock,
      totalUSD,
      totalBS,
      health,
      hasCritical: lowStock.length > 0
    };
  }, [products, rate]);

  const ringColor = stats.health > 80 ? '#10b981' : stats.health > 50 ? '#f59e0b' : '#ef4444';

  const filteredResults = quickSearch 
    ? products.filter(p => 
        p.name.toLowerCase().includes(quickSearch.toLowerCase()) || 
        (p.sku && p.sku.toLowerCase().includes(quickSearch.toLowerCase()))
      ).slice(0, 3) 
    : [];

  const handleNavigate = (view: typeof activeView) => {
    setActiveView(view);
  };

  const renderView = () => {
    if (loading && activeView === 'menu') {
      return (
        <div className="loading-container-full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <RefreshCw className="animate-spin" size={40} color="var(--primary)" />
          <p style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Sincronizando Inteligencia...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'create': return <CreateProduct onBack={() => setActiveView('menu')} onRefresh={() => { fetchInventory(); Toast.fire({ icon: 'success', title: 'Producto creado' }); }} />;
      case 'update': return <UpdateStock onBack={() => setActiveView('menu')} products={products} onRefresh={() => { fetchInventory(); Toast.fire({ icon: 'success', title: 'Stock actualizado' }); }} />;
      case 'list': return <InventoryList onBack={() => setActiveView('menu')} products={products} />;
      case 'categories': 
        return hasAdvancedPrivileges ? <CategoryManager onBack={() => setActiveView('menu')} /> : <div className="access-denied">Acceso denegado</div>;
      case 'delete': 
        return hasAdvancedPrivileges ? <DeleteProduct onBack={() => setActiveView('menu')} products={products} onRefresh={() => { fetchInventory(); Toast.fire({ icon: 'success', title: 'Registro depurado' }); }} /> : <div className="access-denied">Acceso denegado</div>;

      default: return (
        <div className="inventory-main-layout animate-view">
          <div className="main-content-flow">
            <div className="kpi-streamline">
              <KPICard 
                label="Artículos Totales" 
                value={products.length} 
                icon={<Package size={80} />} 
                color="#3b82f6" 
              />
              <KPICard 
                label="Riesgo de Stock" 
                value={stats.lowStock.length} 
                icon={<AlertOctagon size={80} />} 
                color={stats.hasCritical ? "#ef4444" : "#10b981"} 
              />
              <KPICard 
                label="Patrimonio Bruto" 
                value={`$${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                subValue={`Bs. ${stats.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
                icon={<TrendingUp size={80} />} 
                color="#10b981" 
              />
            </div>

            <h2 className="section-subtitle"><Zap size={22} color="var(--primary)"/> Operaciones Core</h2>
            <div className="action-hub-grid">
              <ActionCard 
                title="Nuevo Ingreso" 
                icon={<Plus size={32} />} 
                onClick={() => handleNavigate('create')} 
                baseColor="#3b82f6"
                hoverClass="blue-hover"
              />
              <ActionCard 
                title="Ajuste Stock" 
                icon={<RefreshCw size={32} />} 
                onClick={() => handleNavigate('update')} 
                baseColor="#10b981"
                hoverClass="green-hover"
              />
              <ActionCard 
                title="Catálogo" 
                icon={<Layers size={32} />} 
                onClick={() => handleNavigate('list')} 
                baseColor="#8b5cf6"
                hoverClass="purple-hover"
              />
              
              {hasAdvancedPrivileges && (
                <>
                  <ActionCard 
                    title="Familias" 
                    icon={<Tag size={32} />} 
                    onClick={() => handleNavigate('categories')} 
                    baseColor="#f59e0b"
                    hoverClass="orange-hover"
                  />
                  <ActionCard 
                    title="Depurar" 
                    icon={<Trash2 size={32} />} 
                    onClick={() => handleNavigate('delete')} 
                    baseColor="#ef4444"
                    hoverClass="red-hover"
                  />
                </>
              )}
            </div>
          </div>
          <aside className="stats-sidebar">
            <div className="side-panel">
              <h4><Target size={20} color="var(--primary)"/> Salud Operativa</h4>
              <div className="health-ring-wrapper">
                <div 
                  className="health-ring" 
                  style={{ background: `conic-gradient(${ringColor} ${stats.health}%, var(--border-color) 0)` }}
                >
                  <span className="health-percent">{stats.health}%</span>
                </div>
                <p className="health-status-text">
                  {stats.health === 100 ? "Inventario en estado óptimo. Sin quiebres de stock." : 
                   stats.health > 70 ? "Capacidad operativa estable. Revisar alertas menores." : 
                   "Atención requerida. Alta incidencia de inventario bajo."}
                </p>
              </div>
            </div>

            <div className="side-panel">
              <h4><Search size={20} color="var(--primary)"/> Búsqueda Global</h4>
              <div className="modern-input-group">
                <Search size={18} color="var(--text-muted)" />
                <input 
                  type="text" 
                  placeholder="Código o nombre exacto..." 
                  value={quickSearch} 
                  onChange={(e) => setQuickSearch(e.target.value)} 
                />
              </div>
              
              {quickSearch && (
                <div className="side-results">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((p) => (
                      <div key={p.id} className="mini-result-row" onClick={() => {
                        Swal.fire({
                          title: p.name,
                          html: `<p><b>Código:</b> ${p.sku}</p><p><b>Stock:</b> ${p.current_stock} unidades</p><p><b>Precio:</b> $${Number(p.price).toFixed(2)}</p>`,
                          icon: 'info',
                          confirmButtonColor: '#6366f1',
                          background: 'var(--bg-panel)',
                          color: 'var(--text-main)'
                        });
                      }}>
                        <span className="sku-tag">{p.sku}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{p.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Stock: {p.current_stock}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                      No se encontraron activos.
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      );
    }
  };

  return (
    <div className="inventory-page-container">
      {activeView === 'menu' && (
        <header className="inventory-header-pro animate-view">
          <div className="title-section">
            <h1>Gestión de Inventario</h1>
            <p>Panel de Control de Activos</p>
          </div>
          <button className="refresh-top-button" onClick={() => { fetchInventory(); Toast.fire({ icon: 'info', title: 'Datos actualizados' }); }} title="Sincronizar Datos">
            <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
          </button>
        </header>
      )}
      {renderView()}
    </div>
  );
};

const KPICard = ({ label, value, subValue, icon, color }: any) => (
  <div className="kpi-glass-card">
    <div className="kpi-label">{label}</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="kpi-value">{value}</span>
        {subValue && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginTop: '-5px' }}>{subValue}</span>}
    </div>
    <div className="kpi-icon-bg" style={{ color: color }}>
      {icon}
    </div>
  </div>
);

const ActionCard = ({ title, icon, onClick, baseColor, hoverClass }: any) => (
  <div className={`action-card-modern ${hoverClass}`} onClick={onClick}>
    <div className="icon-wrapper" style={{ backgroundColor: `${baseColor}15`, color: baseColor }}>
      {icon}
    </div>
    <h3>{title}</h3>
  </div>
);

export default Inventory;