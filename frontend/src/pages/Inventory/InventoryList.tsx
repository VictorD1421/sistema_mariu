import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, AlertTriangle, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import '../../styles/InventoryList.css';

const API_URL = import.meta.env.VITE_API_URL;

const InventoryList = ({ onBack, products }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rate, setRate] = useState<number>(0);
  const itemsPerPage = 10;

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

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortBy = e.target.value;
    if (newSortBy === sortBy) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.sku || p.code || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => {
        let comparison = 0;
        if (sortBy === 'price') {
          comparison = Number(a.price) - Number(b.price);
        } else {
          comparison = String(a[sortBy]).localeCompare(String(b[sortBy]));
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [products, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const formatBS = (usdPrice: number) => {
    if (rate === 0) return "Bs. 0,00";
    return (usdPrice * rate).toLocaleString('es-VE', { 
      style: 'currency', 
      currency: 'VES',
      minimumFractionDigits: 2 
    });
  };

  return (
    <div className="inventory-page-wrapper">
      <nav className="navigation-top">
        <button className="back-nav-link" onClick={onBack}>
          <div className="back-icon-circle"><ChevronLeft size={18} /></div>
          <div className="back-text-stack">
            <span className="back-label">Regresar</span>
            <span className="back-destination">Panel de Control</span>
          </div>
        </button>
      </nav>

      <div className="inventory-glass-card">
        <div className="card-top-decoration"></div>
        
        <header className="inventory-header-section">
          <div className="branding-logo-container">
            <img 
              src="/branding/logo.png" 
              alt="Logo" 
              className="inventory-main-logo"
            />
          </div>
          <div className="header-titles">
            <h2>Inventario de Suministros</h2>
            <p>Gestión y monitoreo de existencias</p>
          </div>
        </header>

        <div className="inventory-toolbar">
          <div className="modern-input-group search-wide">
            <Search size={18} className="field-icon-muted"/>
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="sort-controls-group">
            <div className="modern-input-group sort-select">
              <Filter size={18} className="field-icon-muted"/>
              <select value={sortBy} onChange={handleSortChange}>
                <option value="sku">Código</option>
                <option value="name">Nombre</option>
                <option value="price">Precio</option>
              </select>
            </div>
            <button className="order-toggle-btn" onClick={toggleSortOrder} title="Cambiar orden">
              <ArrowUpDown size={18} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>

        <div className="table-responsive-area">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th className="hide-mobile">Categoría</th>
                <th>Precio (REF / BS)</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((p: any) => (
                <tr key={p.id}>
                  <td><span className="badge-code-modern">{p.sku || p.code}</span></td>
                  <td className="product-name-cell">
                    <div className="name-wrapper">
                      {p.name}
                      <span className="show-mobile-only small-category">
                        {p.category?.name || 'General'}
                      </span>
                    </div>
                  </td>
                  <td className="hide-mobile">
                    <span className="category-tag-muted">{p.category?.name || 'General'}</span>
                  </td>
                  <td className="price-cell">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>${Number(p.price).toFixed(2)}</span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)' }}>
                            {formatBS(Number(p.price))}
                        </span>
                    </div>
                  </td>
                  <td>
                    <span className={`stock-pill-small ${p.current_stock <= 5 ? 'danger' : 'safe'}`}>
                      {p.current_stock <= 5 && <AlertTriangle size={14} className="alert-icon"/>}
                      {p.current_stock} <span className="hide-mobile">unidades</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <Search size={48} className="empty-icon"/>
              <p>Sin resultados</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="page-btn"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="page-indicator">
              Página <strong>{currentPage}</strong> de {totalPages}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="page-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;