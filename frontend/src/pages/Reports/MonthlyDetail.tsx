import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, FileText, Package, DollarSign, 
  Activity, Loader2, AlertCircle, Medal,
  CheckCircle, X, Calendar, Target
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import '../../styles/MonthlyDetail.css';

const API_URL = import.meta.env.VITE_API_URL;

interface MonthlyDetailProps {
  onBack: () => void;
  onGenerate: () => Promise<void>;
}

const MonthlyDetail: React.FC<MonthlyDetailProps> = ({ onBack, onGenerate }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(36.50);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showNotify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const reportAudit = useCallback(async (action: string, details: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/audit/manual`, {
        action,
        details: { ...details, timestamp: new Date().toISOString() }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Audit fail");
    }
  }, []);

  const fetchMonthlySales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [salesRes, rateRes] = await Promise.all([
        axios.get(`${API_URL}/sales`, { headers }),
        axios.get(`${API_URL}/exchange-rates/latest`, { headers })
          .catch(() => ({ data: { usd: 36.50 } }))
      ]);

      setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      
      if (rateRes.data && rateRes.data.usd) {
        setExchangeRate(Number(rateRes.data.usd));
      }

      await reportAudit('ACCESO_REPORTE_MENSUAL', { modulo: 'Análisis Mensual' });
    } catch (err) {
      showNotify("Error al conectar con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlySales();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const getLocalYYYYMMDD = (d: Date) => d.toISOString().split('T')[0];

    const diasMesMap: Record<string, any> = {};
    const productStats: Record<string, { count: number, usd: number, bs: number }> = {};

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      const key = getLocalYYYYMMDD(d);
      diasMesMap[key] = { etiqueta: i.toString(), totalUSD: 0, totalBS: 0, productos: 0, fullDate: key };
    }

    sales.forEach(sale => {
      if (!sale.created_at) return;
      const saleDateStr = sale.created_at.split('T')[0];
      
      if (diasMesMap[saleDateStr]) {
        const saleUSD = Number(sale.total_amount || 0);
        const saleBS = Array.isArray(sale.payments) 
          ? sale.payments.reduce((acc: number, p: any) => acc + Number(p.amount_bs || 0), 0)
          : 0;

        diasMesMap[saleDateStr].totalUSD += saleUSD;
        diasMesMap[saleDateStr].totalBS += saleBS;

        sale.details?.forEach((detail: any) => {
          const pName = detail.product?.name || "Desconocido";
          const qty = Number(detail.quantity || 0);
          const subUSD = Number(detail.subtotal || 0);
          const subBS = subUSD * exchangeRate;

          if (!productStats[pName]) {
            productStats[pName] = { count: 0, usd: 0, bs: 0 };
          }
          productStats[pName].count += qty;
          productStats[pName].usd += subUSD;
          productStats[pName].bs += subBS;
          diasMesMap[saleDateStr].productos += qty;
        });
      }
    });

    const totalUSD = Object.values(diasMesMap).reduce((acc, curr: any) => acc + curr.totalUSD, 0);
    const totalBS = Object.values(diasMesMap).reduce((acc, curr: any) => acc + curr.totalBS, 0);
    
    const rankingData = Object.entries(productStats)
      .map(([name, s]) => ({ name, count: s.count, usd: s.usd, bs: s.bs }))
      .sort((a, b) => b.count - a.count);

    return {
      chartData: Object.values(diasMesMap),
      rankingData,
      topProduct: rankingData.length > 0 ? rankingData[0] : null,
      bottomProduct: rankingData.length > 1 ? rankingData[rankingData.length - 1] : null,
      totalUSD,
      totalBS,
      totalProductos: Object.values(diasMesMap).reduce((acc, curr: any) => acc + curr.productos, 0),
      monthName: now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase(),
      hoyKey: getLocalYYYYMMDD(now)
    };
  }, [sales, exchangeRate]);

  const handleExportPDF = async () => {
    const img = new Image();
    img.src = '/branding/logo-mariu.png';

    img.onload = async () => {
      const doc = new jsPDF('p', 'mm', 'a4') as any;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFillColor(6, 15, 37);
      doc.rect(0, 0, pageWidth, 40, 'F');
      try { doc.addImage(img, 'PNG', 14, 8, 25, 25); } catch (e) {}

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text("REPORTE DE CIERRE MENSUAL", 45, 18);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periodo: ${stats.monthName}`, 45, 24);
      doc.text(`Fecha emisión: ${new Date().toLocaleString('es-VE')}`, 45, 29);
      doc.text(`Tasa aplicada: ${exchangeRate.toFixed(2)} Bs/$`, 45, 34);

      autoTable(doc, {
        startY: 45,
        head: [['Resumen Mensual', 'Monto USD', 'Monto BS', 'Unidades']],
        body: [[
          'Total Acumulado', 
          `$${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
          `${stats.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`,
          `${stats.totalProductos} uds`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontStyle: 'bold' }
      });

      const productRows = stats.rankingData.map(p => [
        p.name,
        p.count,
        `$${p.usd.toFixed(2)}`,
        `${p.bs.toLocaleString('es-VE')} Bs`,
        p.name === stats.topProduct?.name ? 'TOP' : (p.name === stats.bottomProduct?.name ? 'MIN' : '-')
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Producto', 'Cant.', 'Ingreso USD', 'Ingreso BS', 'Rendimiento']],
        body: productRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 4) {
            if (data.cell.text[0] === 'TOP') data.cell.styles.textColor = [16, 185, 129];
            if (data.cell.text[0] === 'MIN') data.cell.styles.textColor = [239, 68, 68];
          }
        }
      });

      doc.save(`Reporte_Mensual_MARIU_${Date.now()}.pdf`);
      await onGenerate();
      showNotify("Reporte mensual exportado.");
    };
    img.onerror = () => img.onload?.(new Event('load'));
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{data.etiqueta ? `Día ${data.etiqueta}` : data.name}</p>
          {data.etiqueta ? (
            <>
              <p style={{ margin: '4px 0 0', color: '#3b82f6' }}>USD: ${data.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p style={{ margin: 0, color: '#10b981' }}>Bs: {data.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </>
          ) : (
            <>
              <p style={{ margin: '4px 0 0', color: '#3b82f6' }}>Cantidad: {data.count} uds</p>
              <p style={{ margin: 0, color: '#10b981' }}>Total: {data.bs.toLocaleString('es-VE')} Bs</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="monthly-detail-loading">
      <Loader2 className="spinner" size={40} />
      <p>Sincronizando con MARIU...</p>
    </div>
  );

  return (
    <div className="monthly-detail-wrapper animate-view">
      {notification && (
        <div className={`dynamic-banner ${notification.type === 'success' ? 'banner-success' : 'banner-error'}`}>
          <div className="banner-content">
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="close-banner"><X size={16} /></button>
        </div>
      )}

      <nav className="detail-navigation">
        <button className="back-button-modern" onClick={onBack}>
          <ArrowLeft size={20} /> <span className="hide-mobile">Volver</span>
        </button>
        <button className="generate-pro-btn" onClick={handleExportPDF} disabled={!stats.totalUSD}>
          <FileText size={18} /> <span className="hide-mobile">Exportar</span> PDF
        </button>
      </nav>

      <header className="detail-header-info">
        <h2>Análisis Operativo Mensual</h2>
        <p>Periodo: <strong>{stats.monthName}</strong></p>
      </header>

      <section className="monthly-stats-grid">
        <div className="stat-mini-card">
          <div className="stat-icon-wrapper income-bg"><DollarSign size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">INGRESOS</span>
            <span className="stat-value">${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
              Bs. {stats.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </small>
          </div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-icon-wrapper products-bg"><Package size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">PRODUCTOS</span>
            <span className="stat-value">{stats.totalProductos} uds</span>
          </div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-icon-wrapper status-bg"><Activity size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">DÍAS ACTIVOS</span>
            <span className="stat-value active-text">{stats.chartData.filter((d: any) => d.totalUSD > 0).length}</span>
          </div>
        </div>
      </section>

      <main className="analysis-main-grid">
        <article className="chart-container-large">
          <div className="chart-header"><h3>Tendencia Diaria de Ingresos (USD)</h3></div>
          <div className="scrollable-chart-wrapper">
            <div className="min-width-chart-container">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="etiqueta" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="totalUSD" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fullDate === stats.hoyKey ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-header" style={{ marginTop: '40px' }}><h3>Ranking de Productos por Volumen</h3></div>
          <div className="scrollable-chart-wrapper">
            <div className="min-width-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.rankingData.slice(0, 10)} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '11px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20} fill="#6366f1">
                    <LabelList dataKey="count" position="right" style={{ fontSize: '11px', fill: 'var(--text-main)' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </article>

        <aside className="analysis-sidebar">
          <div className="insight-box">
            <header className="insight-header"><Medal size={18} /> <h4>Top Rendimiento (Top 3)</h4></header>
            <div className="top-list">
              {stats.rankingData.slice(0, 3).map((p, i) => (
                <div key={i} className="top-item">
                  <div className={`rank-circle rank-${i+1}`}>{i+1}</div>
                  <div className="item-details">
                    <p className="item-name">{p.name}</p>
                    <p className="item-qty">
                      <strong>$ {p.usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> | {p.bs.toLocaleString('es-VE')} Bs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-box" style={{ marginTop: '15px' }}>
            <header className="insight-header"><Target size={18} /> <h4>Producto Estrella</h4></header>
            {stats.topProduct ? (
              <div className="top-product-highlight">
                <p className="highlight-name">{stats.topProduct.name}</p>
                <p className="highlight-val">{stats.topProduct.count} unidades vendidas</p>
              </div>
            ) : <p>Sin datos</p>}
          </div>

          <div className="insight-box" style={{ marginTop: '15px' }}>
            <header className="insight-header"><Calendar size={18} /> <h4>Cierre de Mes</h4></header>
            <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Proyección Total: <br />
              <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>
                Bs. {stats.totalBS.toLocaleString('es-VE')}
              </strong>
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default MonthlyDetail;