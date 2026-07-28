import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShoppingCart, Trash2, Search, Plus, Minus, 
  ArrowLeft, Package, Receipt, CreditCard
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiFetch } from '../../api/axios'; 
import '../../styles/SalesOperation.css';

const API_URL = import.meta.env.VITE_API_URL;

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  current_stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

const SalesOperation = ({ onBack }: { onBack: () => void }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [rate, setRate] = useState<number>(0);
  const [isCartVisible, setIsCartVisible] = useState(false);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  });

  const fetchRate = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/exchange-rates/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.usd) {
        setRate(Number(data.usd));
      }
    } catch (err) {
      console.error(err);
      setRate(0);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data.sort((a: any, b: any) => a.name.localeCompare(b.name)) : []);
    } catch (error) {
      Swal.fire('Error', 'Error de conexión al cargar productos', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchRate();
    fetchProducts();
  }, [fetchRate]);

  const formatBs = (usdAmount: number) => {
    const currentRate = Number(rate) || 0;
    if (!usdAmount || currentRate === 0) return "0,00";
    return (usdAmount * currentRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalAmountUSD = useMemo(() => 
    cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0), 
  [cart]);

  const totalAmountBS = useMemo(() => totalAmountUSD * (Number(rate) || 0), [totalAmountUSD, rate]);

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      return Toast.fire({ icon: 'error', title: 'Producto sin existencia' });
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
      Toast.fire({ icon: 'success', title: `${product.name} añadido` });
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        if (delta > product.current_stock) {
            Toast.fire({ icon: 'error', title: 'Stock máximo alcanzado' });
            return item;
        }
        return { ...item, quantity: Math.max(0, delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleProcessSale = async () => {
    const result = await Swal.fire({
      title: '¿Confirmar Salida?',
      text: `Se registrará una salida por un total de $${totalAmountUSD.toFixed(2)} (Bs. ${totalAmountBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981'
    });

    if (result.isConfirmed) {
      await submitSale();
    }
  };

  const submitSale = async () => {
    try {
      setLoading(true);
      const payload = {
        invoice_number: `SAL-${Date.now()}`,
        items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
        payments: [
          {
            amount_usd: totalAmountUSD,
            amount_bs: totalAmountBS
          }
        ]
      };

      const res = await apiFetch('/sales', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      });

      if (res.ok) {
        await Swal.fire('¡Registrado!', 'La salida se ha guardado correctamente', 'success');
        setCart([]);
        fetchProducts();
      } else {
        const errorData = await res.json();
        Swal.fire('Error', errorData.message || "Error al registrar la salida", 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'Error de servidor. Intente más tarde.', 'error');
    } finally { 
      setLoading(false); 
    }
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm]);

  return (
    <div className={`pos-container ${isCartVisible ? 'cart-open' : ''}`}>
      <header className="pos-navbar">
        <div className="navbar-left">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={18} /> 
            <span className="hide-mobile">Volver al Panel</span>
          </button>
        </div>
        
        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Buscar productos por nombre o SKU..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="navbar-right">
          <button className="cart-toggle-btn" onClick={() => setIsCartVisible(!isCartVisible)}>
            <div className="cart-icon-wrapper">
              <ShoppingCart size={22} />
              {cart.length > 0 && <span className="cart-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>}
            </div>
            <span className="hide-mobile">Ver Salida</span>
          </button>
        </div>
      </header>

      <main className="pos-main-content">
        <section className="catalog-section">
          <div className="catalog-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-item" onClick={() => addToCart(product)}>
                <div className="product-icon"><Package size={24} /></div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <span className="sku-label">{product.sku}</span>
                </div>
                <div className="product-meta">
                  <div className="price-badge">${Number(product.price).toFixed(2)}</div>
                  <div className="total-bs">Bs. {formatBs(Number(product.price))}</div>
                  <div className={`stock-status ${product.current_stock < 5 ? 'low' : ''}`}>
                    {product.current_stock} disponibles
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="no-results">No se encontraron productos</div>
            )}
          </div>
        </section>

        <aside className={`checkout-sidebar ${isCartVisible ? 'active' : ''}`}>
          <div className="cart-header">
            <div className="header-title">
              <Receipt size={20} />
              <h2>Detalle de Salida</h2>
            </div>
            <button className="close-cart-mobile" onClick={() => setIsCartVisible(false)}>
              Cerrar
            </button>
          </div>

          <div className="cart-items-list">
            {cart.map(item => (
              <div key={item.id} className="checkout-item animate-fade-in">
                <div className="details">
                  <span className="name">{item.name}</span>
                  <div className="price-stack">
                    <span className="price">${(item.quantity * Number(item.price)).toFixed(2)}</span>
                    <span className="price-bs">Bs. {formatBs(item.quantity * Number(item.price))}</span>
                  </div>
                </div>
                <div className="controls">
                  <div className="qty-picker">
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity - 1); }}><Minus size={14}/></button>
                    <span>{item.quantity}</span>
                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.quantity + 1); }}><Plus size={14}/></button>
                  </div>
                  <button className="del-btn" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 0); }} title="Eliminar"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
                <div className="empty-cart">
                  <ShoppingCart size={48} opacity={0.2} />
                  <p>No hay productos seleccionados</p>
                  <span>Seleccione productos del catálogo para procesar la salida</span>
                </div>
            )}
          </div>

          <div className="checkout-summary">
            <div className="summary-info">
              <div className="summary-row">
                <span>Tasa de cambio:</span>
                <strong>{(Number(rate) || 0).toFixed(2)} Bs/$</strong>
              </div>
            </div>
            <div className="summary-row total-row">
              <span className="label">Total Salida</span>
              <div className="vals">
                <span className="total-val">${totalAmountUSD.toFixed(2)}</span>
                <div className="total-bs">Bs. {totalAmountBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            <button 
              className="pay-btn" 
              disabled={cart.length === 0 || loading} 
              onClick={handleProcessSale}
              style={{ backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {loading ? 'Procesando...' : (
                <>
                  <CreditCard size={20} />
                  Registrar Salida
                </>
              )}
            </button>
          </div>
        </aside>
      </main>
      
      <div 
        className={`mobile-overlay ${isCartVisible ? 'visible' : ''}`} 
        onClick={() => setIsCartVisible(false)}
      ></div>
    </div>
  );
};

export default SalesOperation;