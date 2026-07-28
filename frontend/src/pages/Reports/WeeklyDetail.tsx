import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, FileText, 
  Package, DollarSign, Target, 
  Activity, Loader2, AlertCircle, CheckCircle, X,
  TrendingDown, Calendar
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import '../../styles/WeeklyDetail.css';

const API_URL = import.meta.env.VITE_API_URL;

interface WeeklyDetailProps {
  onBack: () => void;
  onGenerate: () => Promise<void>;
}

const WeeklyDetail: React.FC<WeeklyDetailProps> = ({ onBack, onGenerate }) => {
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
      console.warn("Audit fail");
    }
  }, []);

  const fetchData = async () => {
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
      if (rateRes.data?.usd) setExchangeRate(Number(rateRes.data.usd));
      
      await reportAudit('ACCESO_REPORTE_SEMANAL', { modulo: 'Análisis Semanal' });
    } catch (err) {
      showNotify("Error al conectar con la base de datos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    const diffToMonday = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    
    const monday = new Date(now);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const getFormatKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const diasSemanaMap: Record<string, any> = {};
    const productStats: Record<string, { count: number, usd: number, bs: number }> = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = getFormatKey(d);
      diasSemanaMap[key] = { 
        dia: d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace('.', ''), 
        totalUSD: 0,
        totalBS: 0,
        productos: 0,
        fullDate: key
      };
    }

    let totalSemanaUSD = 0;
    let totalSemanaBS = 0;

    sales.forEach(sale => {
      if (!sale.created_at) return;
      const sDate = new Date(sale.created_at);
      
      if (sDate >= monday && sDate <= sunday) {
        const saleKey = getFormatKey(sDate);
        if (diasSemanaMap[saleKey]) {
          const saleUSD = Number(sale.total_amount || 0);
          const saleBS = Array.isArray(sale.payments) 
            ? sale.payments.reduce((acc: number, p: any) => acc + Number(p.amount_bs || 0), 0)
            : 0;

          diasSemanaMap[saleKey].totalUSD += saleUSD;
          diasSemanaMap[saleKey].totalBS += saleBS;
          totalSemanaUSD += saleUSD;
          totalSemanaBS += saleBS;

          const details = sale.details || [];
          details.forEach((detail: any) => {
            const pName = detail.product?.name || "Desconocido";
            const qty = Number(detail.quantity || 0);
            const subtotalUSD = Number(detail.subtotal || 0);
            const subtotalBS = subtotalUSD * exchangeRate; 

            if (!productStats[pName]) {
              productStats[pName] = { count: 0, usd: 0, bs: 0 };
            }
            productStats[pName].count += qty;
            productStats[pName].usd += subtotalUSD;
            productStats[pName].bs += subtotalBS;
            diasSemanaMap[saleKey].productos += qty;
          });
        }
      }
    });

    const entries = Object.entries(productStats).sort((a, b) => b[1].count - a[1].count);
    const rankingData = entries.map(([name, stat]) => ({ name, count: stat.count, usd: stat.usd, bs: stat.bs }));

    return {
      chartData: Object.values(diasSemanaMap),
      rankingData,
      topProduct: rankingData.length > 0 ? rankingData[0] : null,
      bottomProduct: rankingData.length > 1 ? rankingData[rankingData.length - 1] : null,
      totalUSD: totalSemanaUSD,
      totalBS: totalSemanaBS,
      totalProductos: Object.values(diasSemanaMap).reduce((acc, curr: any) => acc + curr.productos, 0),
      range: {
        start: monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        end: sunday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      },
      hoyKey: getFormatKey(new Date())
    };
  }, [sales, exchangeRate]);

  const handleExportPDF = async () => {
    const img = new Image();
    img.src = '/branding/logo-mariu.png';

    img.onload = async () => {
      const doc = new jsPDF('p', 'mm', 'a4') as any;
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFillColor(249, 250, 251);
      doc.rect(0, 0, pageWidth, 40, 'F');
      try { doc.addImage(img, 'PNG', 14, 8, 25, 25); } catch (e) {}

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text("REPORTE DE RENDIMIENTO SEMANAL", 45, 18);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Periodo: ${stats.range.start} al ${stats.range.end}`, 45, 24);
      doc.text(`Fecha emisión: ${new Date().toLocaleString('es-VE')}`, 45, 29);

      autoTable(doc, {
        startY: 45,
        head: [['Resumen General', 'Monto USD', 'Monto BS', 'Unidades']],
        body: [[
          'Ingresos Totales Semanales', 
          `$${stats.totalUSD.toFixed(2)}`, 
          `${stats.totalBS.toLocaleString('es-VE')} Bs`,
          `${stats.totalProductos} uds`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontStyle: 'bold' }
      });

      const productRows = stats.rankingData.map(p => [
        p.name,
        p.count,
        `$${p.usd.toFixed(2)}`,
        `${p.bs.toLocaleString('es-VE')} Bs`,
        p.name === stats.topProduct?.name ? 'ESTRELLA' : (p.name === stats.bottomProduct?.name ? 'BAJO' : '-')
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Producto', 'Cant.', 'Ingreso USD', 'Ingreso BS', 'Estado']],
        body: productRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 4) {
            if (data.cell.text[0] === 'ESTRELLA') data.cell.styles.textColor = [16, 185, 129];
            if (data.cell.text[0] === 'BAJO') data.cell.styles.textColor = [239, 68, 68];
          }
        }
      });

      doc.save(`Reporte_Semanal_MARIU_${Date.now()}.pdf`);
      await onGenerate();
      showNotify("Reporte generado exitosamente.");
    };
    img.onerror = () => img.onload?.(new Event('load'));
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="nx-glass-tooltip" style={{ background: 'var(--bg-panel)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{data.dia || data.name}</p>
          {data.dia ? (
            <>
              <p style={{ color: '#10b981' }}>USD: ${data.totalUSD.toFixed(2)}</p>
              <p style={{ color: '#3b82f6' }}>VES: {data.totalBS.toLocaleString('es-VE')} Bs</p>
            </>
          ) : (
            <>
              <p style={{ color: '#10b981' }}>Cantidad: {data.count} uds</p>
              <p style={{ color: '#3b82f6' }}>Total: {data.bs.toLocaleString('es-VE')} Bs</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="weekly-detail-loading">
      <Loader2 className="spinner" size={40} />
      <p>Analizando datos de ventas...</p>
    </div>
  );

  return (
    <div className="weekly-detail-wrapper animate-view">
      {notification && (
        <div className={`dynamic-banner ${notification.type}`}>
          <div className="banner-content">
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="close-banner"><X size={16} /></button>
        </div>
      )}

      <div className="detail-navigation">
        <button className="back-button-modern" onClick={onBack}><ArrowLeft size={20} /> Volver</button>
        <button className="generate-pro-btn" onClick={handleExportPDF} disabled={!stats.totalUSD && !stats.totalBS}>
          <FileText size={18} /> Exportar PDF
        </button>
      </div>

      <header className="detail-header-info">
        <h2>Rendimiento Semanal</h2>
        <p>Periodo: <strong>{stats.range.start}</strong> - <strong>{stats.range.end}</strong></p>
      </header>

      <div className="weekly-stats-grid">
        <div className="stat-mini-card">
          <div className="stat-icon income-bg"><DollarSign /></div>
          <div className="stat-info">
            <span className="stat-label">Ingresos Semanales</span>
            <span className="stat-value">${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</span>
            <span className="stat-sub-value">{stats.totalBS.toLocaleString('es-VE')} Bs</span>
          </div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-icon products-bg"><Package /></div>
          <div className="stat-info">
            <span className="stat-label">Unidades Vendidas</span>
            <span className="stat-value">{stats.totalProductos} uds</span>
          </div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-icon status-bg"><TrendingDown /></div>
          <div className="stat-info">
            <span className="stat-label">Menos Vendido</span>
            <span className="stat-value warning-text" style={{ fontSize: '1rem' }}>
              {stats.bottomProduct ? stats.bottomProduct.name : 'N/A'}
            </span>
            <span className="stat-sub-value">{stats.bottomProduct ? `${stats.bottomProduct.count} uds` : ''}</span>
          </div>
        </div>
      </div>

      <div className="analysis-main-grid">
        <div className="chart-container-large">
          <div className="chart-header"><h3>Distribución de Ingresos (USD)</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalUSD" radius={[4, 4, 0, 0]} barSize={40}>
                {stats.chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.fullDate === stats.hoyKey ? '#10b981' : '#10b98180'} />
                ))}
                <LabelList dataKey="totalUSD" position="top" formatter={(v: any) => `$${Number(v).toFixed(0)}`} style={{ fontSize: '10px', fill: 'var(--text-main)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="chart-header" style={{ marginTop: '30px' }}><h3>Ranking de Productos Vendidos</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.rankingData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={25} fill="#3b82f6">
                <LabelList dataKey="count" position="right" style={{ fontSize: '12px', fill: 'var(--text-main)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <aside className="analysis-sidebar">
          <div className="insight-box">
            <h4><Target size={18} /> Producto Estrella</h4>
            {stats.topProduct ? (
              <div className="top-product-item">
                <span className="p-name">{stats.topProduct.name}</span>
                <span className="p-qty">{stats.topProduct.count} uds</span>
              </div>
            ) : <p>Sin registros</p>}
          </div>
          <div className="insight-box" style={{ marginTop: '15px' }}>
            <h4><Calendar size={18} /> Fecha Actual</h4>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
              {new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WeeklyDetail;