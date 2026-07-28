import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  History, TrendingUp, DollarSign, 
  Plus, Clock, Receipt, Award, 
  ArrowUpRight, ArrowDownRight, Activity, Wallet, AlertTriangle, PlusCircle,
  BarChart3, ArrowDown
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, Line, ComposedChart
} from 'recharts';
import Swal from 'sweetalert2';
import SalesOperation from './SalesOperation';
import SalesHistory from './SalesHistory';
import '../../styles/Sales.css'; 

const API_URL = import.meta.env.VITE_API_URL;

const Sales = () => {
  const [activeView, setActiveView] = useState<'menu' | 'pos' | 'history'>('menu');
  const [sales, setSales] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'var(--bg-panel)',
    color: 'var(--text-main)',
  });

  const registerAudit = useCallback(async (viewName: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/audit/manual`, { 
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: `ACCESO_MODULO_SALIDAS`,
          details: { section: viewName, module: 'Sales', timestamp: new Date().toISOString() }
        })
      });
    } catch (error) {
      console.warn("Audit error silenced");
    }
  }, []);

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const [salesRes, rateRes] = await Promise.all([
        fetch(`${API_URL}/sales`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/exchange-rates/latest`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const salesData = await salesRes.json();
      const rateData = await rateRes.json();
      
      setSales(Array.isArray(salesData) ? salesData : []);
      setExchangeRate(Number(rateData?.usd || 0));
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error de sincronización' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchSalesData(); 
  }, []);

  useEffect(() => {
    registerAudit(activeView);
  }, [activeView, registerAudit]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = now.toLocaleDateString('en-CA');
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const productCounts: Record<string, Record<string, number>> = { daily: {}, monthly: {}, historic: {} };
    const weeklyData: Record<string, any> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-CA');
      weeklyData[key] = { 
        name: d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', ''), 
        ventas: 0, 
        dinero: 0,
        dineroBs: 0
      };
    }

    let dailyIncomeUSD = 0;
    let dailyIncomeBS = 0;
    let totalMonthlyUSD = 0;
    let totalMonthlyOps = 0;

    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at);
      const saleDateStr = saleDate.toLocaleDateString('en-CA');
      
      const isToday = saleDateStr === todayKey;
      const isThisMonth = saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      
      const amountUsd = Number(sale.total_amount || 0);
      const amountBs = Array.isArray(sale.payments) 
        ? sale.payments.reduce((acc: number, p: any) => acc + Number(p.amount_bs || 0), 0)
        : 0;

      if (isToday) {
        dailyIncomeUSD += amountUsd;
        dailyIncomeBS += amountBs;
      }
      
      if (isThisMonth) {
        totalMonthlyUSD += amountUsd;
        totalMonthlyOps += 1;
      }

      if (weeklyData[saleDateStr]) {
        weeklyData[saleDateStr].ventas += 1;
        weeklyData[saleDateStr].dinero += amountUsd;
        weeklyData[saleDateStr].dineroBs += amountBs;
      }

      sale.details?.forEach((detail: any) => {
        const pName = detail.product?.name || "Desconocido";
        const qty = Number(detail.quantity || 0);
        productCounts.historic[pName] = (productCounts.historic[pName] || 0) + qty;
        if (isThisMonth) productCounts.monthly[pName] = (productCounts.monthly[pName] || 0) + qty;
        if (isToday) productCounts.daily[pName] = (productCounts.daily[pName] || 0) + qty;
      });
    });

    const chartArray = Object.values(weeklyData);
    
    const getTopProduct = (obj: Record<string, number>): string => {
      const entries = Object.entries(obj);
      return entries.length > 0 ? entries.reduce((a, b) => a[1] > b[1] ? a : b)[0] : "N/A";
    };

    const getLeastSold = (obj: Record<string, number>) => {
      const entries = Object.entries(obj);
      if (entries.length === 0) return { name: "N/A", count: 0 };
      const least = entries.reduce((a, b) => a[1] < b[1] ? a : b);
      return { name: least[0], count: least[1] };
    };

    const todayVal = chartArray[6] || { ventas: 0, dinero: 0 };
    const yesterdayVal = chartArray[5] || { ventas: 0, dinero: 0 };

    return {
      topDaily: getTopProduct(productCounts.daily),
      topMonthly: getTopProduct(productCounts.monthly),
      topHistoric: getTopProduct(productCounts.historic),
      leastMonthly: getLeastSold(productCounts.monthly),
      chartData: chartArray,
      dailyIncomeUSD,
      dailyIncomeBS,
      totalMonthlyUSD,
      totalMonthlyOps,
      growth: yesterdayVal.dinero > 0 ? ((todayVal.dinero - yesterdayVal.dinero) / yesterdayVal.dinero) * 100 : 0,
      avgTicket: todayVal.ventas > 0 ? dailyIncomeUSD / todayVal.ventas : 0
    };
  }, [sales]);

  if (isLoading) return <div className="loading-screen">Cargando...</div>;

  const renderView = () => {
    switch (activeView) {
      case 'pos': return <SalesOperation onBack={() => { setActiveView('menu'); fetchSalesData(); }} />;
      case 'history': return <SalesHistory onBack={() => setActiveView('menu')} sales={sales} exchangeRate={exchangeRate} />;
      default: return (
        <div className="sales-dashboard-layout animate-view">
          <div className="main-stats-area">
            <div className="hero-action-section" style={{ display: 'flex', gap: '15px' }}>
              <button className="prominent-pos-btn" onClick={() => setActiveView('pos')} style={{ flex: 1 }}>
                <div className="btn-content">
                  <div className="icon-wrapper"><PlusCircle size={32} /></div>
                  <div className="text-wrapper">
                    <span className="label">Registros de Salida</span>
                    <span className="title">Nueva Operación</span>
                  </div>
                </div>
              </button>
              <button className="prominent-pos-btn" onClick={() => setActiveView('history')} style={{ flex: 1, background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                <div className="btn-content">
                  <div className="icon-wrapper" style={{ background: '#3b82f620', color: '#3b82f6' }}><History size={32} /></div>
                  <div className="text-wrapper">
                    <span className="label" style={{ color: '#94a3b8' }}>Consultar histórico</span>
                    <span className="title" style={{ color: 'var(--text-main)' }}>Ver Historial</span>
                  </div>
                </div>
              </button>
            </div>

            <div className="kpi-grid-modern">
              <KPICard 
                label="Salidas de Hoy" 
                value={`$${stats.dailyIncomeUSD.toFixed(2)}`} 
                subValue={`${stats.dailyIncomeBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.`} 
                icon={<DollarSign />} 
                trend={stats.growth} 
                color="#10b981" 
              />
              <KPICard label="Menor Salida (Mes)" value={stats.leastMonthly.name} subValue={`${stats.leastMonthly.count} unidades vendidas`} icon={<ArrowDown />} color="#ef4444" />
              <KPICard label="Producto Estrella" value={stats.topMonthly} subValue="Líder en salidas del mes" icon={<Award />} color="#f59e0b" />
            </div>

            <div className="charts-main-section">
              <div className="chart-glass-wrapper">
                <div className="chart-header-actions">
                  <div>
                    <h3>Análisis de Rendimiento</h3>
                    <p>Comparativa de flujo monetario y frecuencia de salidas</p>
                  </div>
                  <div className="chart-legend-custom">
                    <span className="dot money"></span> Dinero ($)
                    <span className="dot sales"></span> Vol. Salidas
                  </div>
                </div>
                <div className="responsive-chart-box">
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={stats.chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDinero" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="dinero" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDinero)" />
                      <Line type="monotone" dataKey="ventas" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <aside className="sales-insights-sidebar">
            <div className="insight-card">
              <div className="insight-header"><div className="icon-box"><BarChart3 size={18}/></div><h4>Resumen del Mes</h4></div>
              <div className="insight-content">
                <div className="metric-row"><span>Ingreso Mensual</span><strong>${stats.totalMonthlyUSD.toFixed(2)}</strong></div>
                <div className="metric-row"><span>Ticket Promedio</span><strong>${stats.avgTicket.toFixed(2)}</strong></div>
                <div className="metric-row"><span>Operaciones Totales</span><strong>{stats.totalMonthlyOps}</strong></div>
              </div>
            </div>

            <div className="recent-activity-panel">
              <div className="panel-header"><h4><Clock size={18} /> Actividad</h4><button onClick={() => setActiveView('history')}>Ver todo</button></div>
              <div className="activity-list">
                {sales.filter(s => new Date(s.created_at).toLocaleDateString('en-CA') === new Date().toLocaleDateString('en-CA')).slice(0, 5).map((sale) => {
                  const saleBs = Array.isArray(sale.payments) 
                    ? sale.payments.reduce((acc: number, p: any) => acc + Number(p.amount_bs || 0), 0)
                    : 0;
                  return (
                    <div key={sale.id} className="activity-item">
                      <div className="activity-icon"><Receipt size={16}/></div>
                      <div className="activity-info">
                        <div className="info-top"><span>#{sale.id}</span><strong>${Number(sale.total_amount).toFixed(2)}</strong></div>
                        <div className="info-bottom" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                            {saleBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em', opacity: 0.8 }}>
                            <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ranking-panel">
              <h4><TrendingUp size={18}/> Rankings</h4>
              <div className="rank-item"><span>Líder Histórico</span><strong>{stats.topHistoric}</strong></div>
              <div className="rank-item"><span>Líder Hoy</span><strong>{stats.topDaily}</strong></div>
              <div className="rank-item"><span>Tasa del Día</span><strong>{exchangeRate.toFixed(2)} Bs</strong></div>
            </div>
          </aside>
        </div>
      );
    }
  };

  return (
    <div className="sales-page-container">
      {activeView === 'menu' && (
        <header className="sales-header-minimal">
          <div className="brand-badge">REGISTRO DE MOVIMIENTOS</div>
          <div className="title-section">
            <h1>Panel de Salidas</h1>
            <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </header>
      )}
      {renderView()}
    </div>
  );
};

const KPICard = ({ label, value, subValue, icon, color, trend }: any) => (
  <div className="kpi-modern-card">
    <div className="kpi-icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>{icon}</div>
    <div className="kpi-data">
      <span className="kpi-label">{label}</span>
      <h2 className="kpi-value">{value}</h2>
      <span className="kpi-subvalue" style={{ fontSize: '0.9rem', opacity: 0.9 }}>{subValue}</span>
    </div>
    {trend !== undefined && (
      <div className={`kpi-trend ${trend >= 0 ? 'up' : 'down'}`}>
        {trend >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
        {Math.abs(trend).toFixed(1)}%
      </div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="modern-chart-tooltip">
        <p className="tooltip-date">{data.name}</p>
        <p>USD: <strong>${data.dinero.toFixed(2)}</strong></p>
        <p>Bs: <strong>{data.dineroBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</strong></p>
        <p>Operaciones: <strong>{data.ventas}</strong></p>
      </div>
    );
  }
  return null;
};

export default Sales;