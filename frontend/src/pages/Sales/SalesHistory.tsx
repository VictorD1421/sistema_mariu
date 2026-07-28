import { useState, useMemo } from 'react';
import { 
  ArrowLeft, FileText, Package, 
  Download, Clock, ShieldCheck, ChevronLeft, ChevronRight,
  Calendar, Hash, TrendingUp, Filter
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import '../../styles/SalesHistory.css';

const SalesHistory = ({ onBack, sales = [], exchangeRate = 0 }: any) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const salesPerPage = 10;

  const filteredSales = useMemo(() => {
    let baseDate = filterDate ? new Date(filterDate) : new Date();
    baseDate.setHours(0, 0, 0, 0);

    return sales.filter((sale: any) => {
      const saleDate = new Date(sale.created_at);
      saleDate.setHours(0, 0, 0, 0);

      if (filterType === 'day') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return saleDate.getTime() === today.getTime();
      }

      if (filterType === 'week' && filterDate) {
        const startOfWeek = new Date(baseDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return saleDate >= startOfWeek && saleDate <= endOfWeek;
      }

      if (filterType === 'month' && filterDate) {
        return (
          saleDate.getMonth() === baseDate.getMonth() &&
          saleDate.getFullYear() === baseDate.getFullYear()
        );
      }

      return true;
    });
  }, [sales, filterDate, filterType]);

  const indexOfLastSale = currentPage * salesPerPage;
  const indexOfFirstSale = indexOfLastSale - salesPerPage;
  const currentDisplaySales = (filterType === 'all') ? filteredSales.slice(indexOfFirstSale, indexOfLastSale) : filteredSales;
  const totalPages = Math.ceil(filteredSales.length / salesPerPage);

  const [mobileIndex, setMobileIndex] = useState(0);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setMobileIndex(0);
  };

  const formatBs = (usd: number) => {
    return (usd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 });
  };

  const generatePDF = () => {
    const img = new Image();
    img.src = '/branding/logo-mariu.png';

    img.onload = () => {
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFillColor(249, 250, 251);
      doc.rect(0, 0, pageWidth, 40, 'F');
      try { doc.addImage(img, 'PNG', 14, 8, 25, 25); } catch (e) {}
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text("HISTORIAL DE SALIDAS DE INVENTARIO", 45, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Filtro: ${filterType.toUpperCase()}`, 45, 24);
      doc.text(`Fecha emisión: ${new Date().toLocaleString('es-VE')}`, 45, 29);
      doc.text(`Tasa: ${exchangeRate.toFixed(2)} Bs/$`, 45, 34);

      const tableRows = currentDisplaySales.map((sale: any) => [
        new Date(sale.created_at).toLocaleString('es-VE'),
        sale.details?.map((d: any) => `${d.product?.name} (x${d.quantity})`).join(', '),
        `$${Number(sale.total_amount).toFixed(2)}`,
        `${(sale.total_amount * exchangeRate).toLocaleString('es-VE')} Bs`,
        sale.user?.name || 'Sistema'
      ]);

      autoTable(doc, {
        head: [["Fecha", "Productos", "USD", "BS", "Usuario"]],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
      });

      doc.save(`Reporte_MARIU_${Date.now()}.pdf`);
    };
    img.onerror = () => img.onload?.(new Event('load'));
  };

  return (
    <div className="history-container animate-view">
      <header className="history-header">
        <div className="header-nav">
          <button className="btn-back-modern" onClick={onBack}>
            <ArrowLeft size={20} />
            <span>Panel Principal</span>
          </button>
          <div className="header-title-group">
            <h1>Historial de Salidas</h1>
            <p>Auditoría de movimientos de inventario</p>
          </div>
        </div>
        
        <div className="header-actions hide-on-mobile">
          <button className="btn-export-pdf" onClick={generatePDF} disabled={currentDisplaySales.length === 0}>
            <Download size={20} />
            <div className="btn-text">
              <strong>Exportar Vista</strong>
              <span>PDF de tabla actual</span>
            </div>
          </button>
        </div>
      </header>

      <div className="filter-controls-modern glass-panel-table">
        <div className="filter-group">
          <div className="select-with-icon">
            <Filter size={18} />
            <select value={filterType} onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
              setMobileIndex(0);
            }}>
              <option value="all">Ver Todo</option>
              <option value="day">Día Actual</option>
              <option value="week">Por Semana</option>
              <option value="month">Por Mes</option>
            </select>
          </div>

          {filterType !== 'all' && filterType !== 'day' && (
            <div className="input-with-icon">
              <Calendar size={18} />
              <input 
                type={filterType === 'month' ? "month" : "date"} 
                value={filterDate} 
                onChange={(e) => setFilterDate(e.target.value)} 
              />
            </div>
          )}

          {(filterDate || filterType !== 'all') && (
            <button className="btn-clear-filters" onClick={() => { setFilterDate(''); setFilterType('all'); }}>
              Limpiar
            </button>
          )}
        </div>
        
        <div className="mini-metric">
          <Hash size={16} />
          <span>Registros: <strong>{filteredSales.length}</strong></span>
        </div>
      </div>

      {currentDisplaySales.length > 0 && (
        <div className="mobile-view-curated">
          <div className="mobile-card-wrapper glass-panel-table">
            <div className="mobile-card-header">
              <span className="count-badge">REGISTRO {mobileIndex + 1} / {filteredSales.length}</span>
              <div className="mobile-nav-pills">
                <button onClick={() => setMobileIndex(mobileIndex - 1)} disabled={mobileIndex === 0}><ChevronLeft size={18}/></button>
                <button onClick={() => setMobileIndex(mobileIndex + 1)} disabled={mobileIndex === filteredSales.length - 1}><ChevronRight size={18}/></button>
              </div>
            </div>
            <div className="mobile-card-body">
              <div className="info-group">
                <div className="data-row">
                  <span className="label"><Clock size={14}/> Fecha</span>
                  <span className="value">{new Date(filteredSales[mobileIndex].created_at).toLocaleString('es-VE')}</span>
                </div>
                <div className="data-row">
                  <span className="label"><Package size={14}/> Productos</span>
                  <div className="badges-container">
                    {filteredSales[mobileIndex].details?.map((d: any, i: number) => (
                      <span key={i} className="mini-badge-v2">{d.product?.name} <mark>x{d.quantity}</mark></span>
                    ))}
                  </div>
                </div>
              </div>
              <footer className="mobile-card-footer">
                <div className="footer-total">
                  <div className="total-amount-box">
                    <h3 className="usd">${Number(filteredSales[mobileIndex].total_amount).toFixed(2)}</h3>
                    <p className="bs">{formatBs(Number(filteredSales[mobileIndex].total_amount))} Bs.</p>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}

      <div className="desktop-table-container glass-panel-table">
        <table className="modern-data-table">
          <thead>
            <tr>
              <th><div className="th-content"><Calendar size={14}/> Emisión</div></th>
              <th><div className="th-content"><Package size={14}/> Detalle</div></th>
              <th className="text-right">Tasa</th>
              <th className="text-right">USD</th>
              <th className="text-right">BS</th>
              <th>Auditoría</th>
            </tr>
          </thead>
          <tbody>
            {currentDisplaySales.map((sale: any) => (
              <tr key={sale.id} className="table-row-hover">
                <td>
                  <div className="cell-date">
                    <span className="main">{new Date(sale.created_at).toLocaleDateString('es-VE')}</span>
                    <span className="sub"><Clock size={10} /> {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td>
                  <div className="cell-products">
                    {sale.details?.map((detail: any, idx: number) => (
                      <div key={idx} className="product-pill">
                        <span className="p-name">{detail.product?.name}</span>
                        <span className="p-qty">x{detail.quantity}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="text-right"><span className="rate-tag">{exchangeRate.toFixed(2)}</span></td>
                <td className="text-right"><span className="usd-amount">${Number(sale.total_amount).toFixed(2)}</span></td>
                <td className="text-right"><span className="bs-amount">{formatBs(Number(sale.total_amount))}</span></td>
                <td>
                  <div className="cell-audit">
                    <ShieldCheck size={14} />
                    <span>{sale.user?.name || 'Sistema'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filterType === 'all' && totalPages > 1 && (
          <nav className="pagination-bar-modern">
            <button className="page-nav-btn" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft size={20} />
              <span>Anterior</span>
            </button>
            <div className="page-numbers">Página <strong>{currentPage}</strong> de {totalPages}</div>
            <button className="page-nav-btn" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}>
              <span>Siguiente</span>
              <ChevronRight size={20} />
            </button>
          </nav>
        )}
      </div>

      {filteredSales.length === 0 && (
        <div className="empty-state-modern">
          <div className="empty-icon-box"><FileText size={64} /></div>
          <h3>Sin registros</h3>
          <p>No hay datos para el criterio seleccionado.</p>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;