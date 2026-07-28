import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, FileText, TrendingUp, 
  Award, Loader2, Target, CheckCircle, 
  AlertCircle, X, Package, Trophy
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import '../../styles/AnnualDetail.css';

const API_URL = import.meta.env.VITE_API_URL;

interface AnnualDetailProps {
  onBack: () => void;
  onGenerate: () => Promise<void>; 
}

const AnnualDetail: React.FC<AnnualDetailProps> = ({ onBack, onGenerate }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchAnnualSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const salesRes = await axios.get(`${API_URL}/sales`, { headers });
      setSales(Array.isArray(salesRes.data) ? salesRes.data : []);

      await reportAudit('ACCESO_REPORTE_ANUAL', { modulo: 'Balance Anual' });
    } catch (err) {
      showNotify("Error al sincronizar datos anuales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchAnnualSales(); 
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const mesesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const mesesMap = mesesNombre.map((nombre, index) => ({
      mes: nombre,
      totalUSD: 0,
      totalBS: 0,
      productos: 0,
      ventas: 0,
      index
    }));

    const productStats: Record<string, { count: number, usd: number }> = {};
    let productosMesActual = 0;
    let ventasMesActual = 0;

    sales.forEach(sale => {
      const date = new Date(sale.created_at || sale.createdAt);
      if (date.getFullYear() === currentYear) {
        const mesIdx = date.getMonth();
        
        let saleUSD = 0;
        let saleBS = 0;

        if (sale.payments && Array.isArray(sale.payments)) {
          sale.payments.forEach((p: any) => {
            saleUSD += Number(p.amount_usd || 0);
            saleBS += Number(p.amount_bs || 0);
          });
        } else {
          saleUSD = Number(sale.total_amount || 0);
          saleBS = Number(sale.total_bs || 0);
        }

        mesesMap[mesIdx].totalUSD += saleUSD;
        mesesMap[mesIdx].totalBS += saleBS;
        mesesMap[mesIdx].ventas += 1;

        if (mesIdx === currentMonthIdx) {
          ventasMesActual += 1;
        }

        sale.details?.forEach((detail: any) => {
          const pName = detail.product?.name || "Desconocido";
          const qty = Number(detail.quantity || 0);
          const subUSD = Number(detail.subtotal || 0);

          mesesMap[mesIdx].productos += qty;
          
          if (mesIdx === currentMonthIdx) {
            productosMesActual += qty;
          }

          if (!productStats[pName]) {
            productStats[pName] = { count: 0, usd: 0 };
          }
          productStats[pName].count += qty;
          productStats[pName].usd += subUSD;
        });
      }
    });

    const totalUSD = mesesMap.reduce((acc, m) => acc + m.totalUSD, 0);
    const totalBS = mesesMap.reduce((acc, m) => acc + m.totalBS, 0);
    const totalOperaciones = mesesMap.reduce((acc, m) => acc + m.ventas, 0);
    
    const mesesTranscurridos = currentMonthIdx + 1;
    const promedioMensualUSD = totalUSD > 0 ? totalUSD / mesesTranscurridos : 0;
    const promedioMensualBS = totalBS > 0 ? totalBS / mesesTranscurridos : 0;

    const rankingAnual = Object.entries(productStats)
      .map(([name, s]) => ({ name, count: s.count, usd: s.usd }))
      .sort((a, b) => b.count - a.count);

    return {
      chartData: mesesMap.map(m => ({ ...m, mesCorte: m.mes.substring(0, 3) })),
      rankingAnual: rankingAnual.slice(0, 10),
      totalUSD,
      totalBS,
      productosMesActual,
      ventasMesActual,
      nombreMesActual: mesesNombre[currentMonthIdx],
      promedioMensualUSD,
      promedioMensualBS,
      totalOperaciones,
      year: currentYear
    };
  }, [sales]);

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
      doc.text(`REPORTE DE BALANCE ANUAL ${stats.year}`, 45, 18);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("SUMINISTROS MARIU C.A. - Gestión de Inventario", 45, 24);
      doc.text(`Fecha emisión: ${new Date().toLocaleString('es-VE')}`, 45, 29);
      doc.text(`Estado del periodo: Consolidado`, 45, 34);

      autoTable(doc, {
        startY: 45,
        head: [['Métrica Anual', 'Monto USD', 'Monto BS (Histórico)', 'Ventas']],
        body: [
          [
            'Total Ingresos', 
            `$${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
            `${stats.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`,
            `${stats.totalOperaciones} op.`
          ],
          [
            'Promedio Mensual',
            `$${stats.promedioMensualUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            `${stats.promedioMensualBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`,
            '-'
          ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontStyle: 'bold' }
      });

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Mes', 'Operaciones', 'Unidades', 'Ingreso USD', 'Ingreso BS']],
        body: stats.chartData.map(m => [
          m.mes.toUpperCase(),
          m.ventas,
          m.productos,
          `$${m.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          `${m.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }
      });

      doc.save(`Balance_Anual_MARIU_${stats.year}_${Date.now()}.pdf`);
      await onGenerate();
      showNotify(`Balance anual ${stats.year} exportado.`);
    };
    img.onerror = () => img.onload?.(new Event('load'));
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProduct = data.name !== undefined;
      
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>{isProduct ? data.name : data.mes}</p>
          <p style={{ margin: '4px 0 0', color: '#4f46e5' }}>
            {isProduct ? `Cantidad: ${data.count} uds` : `USD: $${(data.totalUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </p>
          <p style={{ margin: 0, color: '#10b981' }}>
            {isProduct ? `Ingreso: $${(data.usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `Bs: ${(data.totalBS || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="annual-loading">
      <Loader2 className="spinner" size={40} />
      <p>Procesando registros anuales...</p>
    </div>
  );

  return (
    <div className="annual-detail-wrapper animate-view">
      {notification && (
        <div className={`dynamic-banner ${notification.type === 'success' ? 'banner-success' : 'banner-error'}`}>
          <div className="banner-content">
            {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="close-banner"><X size={16} /></button>
        </div>
      )}

      <nav className="detail-navigation responsivo">
        <button className="back-button-modern" onClick={onBack}>
          <ArrowLeft size={20} /> <span className="hide-mobile">Volver</span>
        </button>
        <button className="generate-pro-btn annual-btn" onClick={handleExportPDF} disabled={!stats.totalUSD}>
          <FileText size={18} /> <span className="hide-mobile">Descargar</span> Balance {stats.year}
        </button>
      </nav>

      <header className="annual-header">
        <div className="title-group">
          <h1>Rendimiento Anual</h1>
          <span className="year-pill">{stats.year}</span>
        </div>
      </header>

      <section className="annual-stats-grid responsivo">
        <div className="stat-card-annual gold">
          <TrendingUp className="icon" />
          <div className="data">
            <span className="label">Ingreso Total {stats.year}</span>
            <span className="value">${stats.totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <small>Bs. {stats.totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</small>
          </div>
        </div>
        <div className="stat-card-annual blue">
          <Package className="icon" />
          <div className="data">
            <span className="label">Salidas en {stats.nombreMesActual}</span>
            <span className="value">{stats.productosMesActual} uds</span>
            <small>{stats.ventasMesActual} ventas concretadas</small>
          </div>
        </div>
        <div className="stat-card-annual purple">
          <Target className="icon" />
          <div className="data">
            <span className="label">Promedio Mensual</span>
            <span className="value">${stats.promedioMensualUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <small>Promedio Bs: {stats.promedioMensualBS.toLocaleString('es-VE', { maximumFractionDigits: 0 })}</small>
          </div>
        </div>
      </section>

      <div className="annual-main-content">
        <div className="chart-container-annual">
          <div className="chart-info">
            <h3>Flujo de Ingresos Mensuales (USD)</h3>
          </div>
          <div className="scrollable-chart-wrapper">
            <div className="min-width-chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="mesCorte" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="totalUSD" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="annual-secondary-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div className="chart-container-annual">
            <div className="chart-info"><h3>Productos con Mayor Rotación Anual</h3></div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.rankingAnual} layout="vertical" margin={{ left: 30, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="insight-box annual-top-box">
            <header className="insight-header"><Trophy size={20} color="#eab308" /> <h4>Top 3 Más Vendidos</h4></header>
            <div className="top-list">
              {stats.rankingAnual.slice(0, 3).map((p, i) => (
                <div key={i} className="top-item">
                  <div className={`rank-circle rank-${i+1}`}>{i+1}</div>
                  <div className="item-details">
                    <p className="item-name">{p.name}</p>
                    <p className="item-qty"><strong>{p.count} unidades</strong> | ${p.usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualDetail;