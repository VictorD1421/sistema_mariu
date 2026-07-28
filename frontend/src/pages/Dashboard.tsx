import { useState, useEffect, useMemo } from 'react';
import { 
  Save, Loader2, Wallet, Briefcase, 
  ChevronRight, Scale, Trophy, FileText, Clock, BarChart3
} from 'lucide-react';
import { 
  Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, AreaChart, Area,
  BarChart, Bar, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import '../styles/Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [ratesDB, setRatesDB] = useState({ usd: 0 });
  const [exchangeRate, setExchangeRate] = useState({ value: 0, currency: 'USD' });
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [calcInput, setCalcInput] = useState<string>("");

  const COLORES_VIBRANTES = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'var(--bg-panel)',
    color: 'var(--text-main)',
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [prodRes, salesRes, ratesRes] = await Promise.all([
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/sales`, { headers }),
        fetch(`${API_URL}/exchange-rates/latest`, { headers })
      ]);
      const prods = await prodRes.json();
      const salesData = await salesRes.json();
      const latestRates = await ratesRes.json();

      setProducts(Array.isArray(prods) ? prods : []);
      setSales(Array.isArray(salesData) ? salesData : []);
      if (latestRates) {
        const usdVal = parseFloat(latestRates.usd) || 0;
        setRatesDB({ usd: usdVal });
        setExchangeRate({ currency: 'USD', value: usdVal });
      }
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error de sincronización' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA'); 
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, total: 0 }));
    const todayProductMap: Record<string, { qty: number, totalUsd: number, totalBs: number }> = {};
    let dailyTotalUSD = 0;
    let dailyTotalBS = 0;

    sales.forEach(sale => {
      const sDate = new Date(sale.created_at);
      const sDateStr = sDate.toLocaleDateString('en-CA');

      if (sDateStr === todayStr) {
        const hour = sDate.getHours();
        const amountUsd = Number(sale.total_amount || 0);
        const amountBs = Array.isArray(sale.payments) 
          ? sale.payments.reduce((acc: number, p: any) => acc + Number(p.amount_bs || 0), 0)
          : amountUsd * ratesDB.usd;

        dailyTotalUSD += amountUsd;
        dailyTotalBS += amountBs;
        hourlyData[hour].total += amountUsd;

        const details = sale.details || [];
        details.forEach((item: any) => {
          const pName = item.product?.name || "Producto";
          const pQty = Number(item.quantity || 0);
          const pSubtotalUsd = Number(item.subtotal || 0);
          
          if (!todayProductMap[pName]) todayProductMap[pName] = { qty: 0, totalUsd: 0, totalBs: 0 };
          todayProductMap[pName].qty += pQty;
          todayProductMap[pName].totalUsd += pSubtotalUsd;
          todayProductMap[pName].totalBs += (pSubtotalUsd * ratesDB.usd);
        });
      }
    });

    const sortedProducts = Object.entries(todayProductMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty);

    return {
      hourlyData,
      todayProducts: sortedProducts,
      dailyTotalUSD,
      dailyTotalBS,
      inventoryValueUSD: products.reduce((acc, p) => acc + (Number(p.price) * p.current_stock), 0),
      criticalStock: products.filter(p => p.current_stock <= (p.min_stock || 5))
    };
  }, [sales, products, ratesDB.usd]);

  const handleCierreCaja = async () => {
    const result = await Swal.fire({
      title: '¿Generar cierre de caja?',
      text: "Se descargará un reporte basado en las ventas de hoy.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, generar PDF',
      background: 'var(--bg-panel)',
      color: 'var(--text-main)'
    });

    if (!result.isConfirmed) return;

    try {
      const doc = new jsPDF();
      const now = new Date();
      const dateStr = now.toLocaleDateString('es-VE');
      
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text('CIERRE DE CAJA DIARIO', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Suministros Mariu 3000 C.A. - Generado: ${dateStr} ${now.toLocaleTimeString()}`, 14, 28);

      autoTable(doc, {
        startY: 35,
        head: [['Concepto', 'Monto USD', 'Monto Bs.']],
        body: [
          ['Total Ventas Hoy', `$${stats.dailyTotalUSD.toFixed(2)}`, `${stats.dailyTotalBS.toLocaleString('es-VE')} Bs.`],
          ['Productos Vendidos', stats.todayProducts.reduce((a, b) => a + b.qty, 0).toString(), '-']
        ],
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] }
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Producto', 'Cant', 'Total USD', 'Total Bs.']],
        body: stats.todayProducts.map(p => [
          p.name, 
          p.qty.toString(), 
          `$${p.totalUsd.toFixed(2)}`,
          `${p.totalBs.toLocaleString('es-VE')} Bs.`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233] }
      });

      doc.save(`Cierre_Mariu_${dateStr.replace(/\//g, '-')}.pdf`);
      Toast.fire({ icon: 'success', title: 'Reporte generado' });
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error al generar PDF' });
    }
  };

  const handleSaveRate = async () => {
    if (exchangeRate.value <= 0) return Toast.fire({ icon: 'error', title: 'Tasa inválida' });
    try {
      setIsSavingRate(true);
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/exchange-rates`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: exchangeRate.currency, value: Number(exchangeRate.value) })
      });
      setRatesDB({ usd: exchangeRate.value });
      Toast.fire({ icon: 'success', title: 'Tasa actualizada' });
      fetchDashboardData();
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error al guardar tasa' });
    } finally { setIsSavingRate(false); }
  };

  const calcResult = useMemo(() => {
    const val = parseFloat(calcInput) || 0;
    return (val * ratesDB.usd).toLocaleString('es-VE', { minimumFractionDigits: 2 });
  }, [calcInput, ratesDB.usd]);

  if (loading) return <div className="dashboard-loading"><Loader2 className="spin" size={48} /></div>;

  return (
    <div className="dashboard-wrapper animate-fade-in">
      <header className="dash-nav-header">
        <div className="brand-minimal">
          <div className="m-logo">M</div>
          <div>
            <h2>Dashboard Suministros Mariu 3000 C.A.</h2>
            <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="rate-switcher">
            <Scale size={16} />
            <input 
              type="number" 
              value={exchangeRate.value} 
              onChange={(e) => setExchangeRate({...exchangeRate, value: parseFloat(e.target.value)})} 
            />
            <button onClick={handleSaveRate} disabled={isSavingRate}>
              {isSavingRate ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            </button>
          </div>
          <button className="btn-cierre-caja" onClick={handleCierreCaja}>
            <FileText size={18} /> Cierre de Caja
          </button>
        </div>
      </header>

      <div className="dash-bento-layout">
        <section className="bento-col-main">
          <div className="card-glass main-chart-card">
            <div className="card-info"><h3><Clock size={18} /> Ventas de Hoy (24h)</h3></div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.hourlyData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Ventas']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bottom-grid-two">
            <div className="card-glass">
              <h3><Trophy size={18} /> Ranking de Hoy</h3>
              <div className="top-list">
                {stats.todayProducts.length > 0 ? stats.todayProducts.slice(0, 4).map((p, i) => (
                  <div key={i} className="top-item">
                    <div className="rank-num">{i + 1}</div>
                    <div className="rank-info">
                      <p>{p.name}</p>
                      <div className="rank-breakdown">
                        <span>${p.totalUsd.toFixed(2)}</span>
                        <span className="text-bs">{p.totalBs.toLocaleString('es-VE')} Bs.</span>
                      </div>
                    </div>
                    <div className="rank-price">{p.qty} uds.</div>
                  </div>
                )) : <p style={{color: 'var(--text-dim)', fontSize: '0.9rem', padding: '10px'}}>Sin ventas hoy</p>}
              </div>
            </div>

            <div className="card-glass">
              <h3><BarChart3 size={18} /> Unidades por Producto</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.todayProducts.slice(0, 5)} layout="vertical" margin={{ left: -20, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{fill: '#94a3b8', fontSize: 10}} width={80} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                  <Bar dataKey="qty" radius={[0, 4, 4, 0]} barSize={20}>
                    {stats.todayProducts.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_VIBRANTES[index % COLORES_VIBRANTES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <aside className="bento-col-side">
          <div className="card-glass highlight-card">
            <Wallet className="icon-bg" />
            <span>Total Hoy</span>
            <h2>${stats.dailyTotalUSD.toFixed(2)}</h2>
            <p className="sub-monto-bs">{stats.dailyTotalBS.toLocaleString('es-VE')} Bs.</p>
          </div>

          <div className="card-glass converter-mini">
            <h3>Calculadora de Tasa</h3>
            <div className="conv-input">
              <input type="number" value={calcInput} onChange={e => setCalcInput(e.target.value)} placeholder="Monto USD" />
              <div className="conv-result">{calcResult} <span>Bs.</span></div>
            </div>
          </div>

          <div className="card-glass stock-alert-card">
            <h3>Inventario Crítico</h3>
            <div className="alert-scroll">
              {stats.criticalStock.map(p => (
                <div key={p.id} className="stock-row">
                  <div className={`indicator ${p.current_stock <= 0 ? 'empty' : 'low'}`}></div>
                  <div className="s-info"><p>{p.name}</p><small>Stock: {p.current_stock}</small></div>
                  <ChevronRight size={14} />
                </div>
              ))}
            </div>
          </div>

          <div className="card-glass asset-card">
            <div className="asset-info"><Briefcase size={20} /><div><p>Valor Inventario</p><h4>${stats.inventoryValueUSD.toLocaleString()}</h4></div></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;