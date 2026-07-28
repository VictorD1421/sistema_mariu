import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  FileText, RefreshCw, Calendar, 
  BarChart3, CalendarDays, CalendarRange, Info,
  History as HistoryIcon, TrendingUp, AlertTriangle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import '../../styles/Reports.css';

import WeeklyDetail from './WeeklyDetail'; 
import MonthlyDetail from './MonthlyDetail';
import AnnualDetail from './AnnualDetail';

const API_URL = import.meta.env.VITE_API_URL;

interface Report {
  id: number;
  type: string;
  description: string;
  file_path: string;
  created_at: string;
  data: any;
}

type ViewMode = 'menu' | 'weekly' | 'monthly' | 'yearly';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ViewMode>('menu');
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  const typeLabels: Record<string, string> = {
    'weekly': 'Semanal',
    'monthly': 'Mensual',
    'annual': 'Anual',
    'yearly': 'Anual'
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [reportsRes] = await Promise.all([
        axios.get(`${API_URL}/reports`, { headers })
      ]);

      setReports(reportsRes.data);
    } catch (error) {
      console.error("Sync error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const { paginatedReports, totalPages } = useMemo(() => {
    const total = Math.ceil(reports.length / reportsPerPage);
    const start = (currentPage - 1) * reportsPerPage;
    return {
      paginatedReports: reports.slice(start, start + reportsPerPage),
      totalPages: total
    };
  }, [reports, currentPage]);

  const renderContent = () => {
    switch (activeView) {
      case 'weekly': return <WeeklyDetail onBack={() => setActiveView('menu')} onGenerate={fetchData} />;
      case 'monthly': return <MonthlyDetail onBack={() => setActiveView('menu')} onGenerate={fetchData} />;
      case 'yearly': return <AnnualDetail onBack={() => setActiveView('menu')} onGenerate={fetchData} />;
      default: return (
        <div className="animate-view">
          <section className="reports-period-grid">
            <div className="period-card" onClick={() => setActiveView('weekly')}>
              <div className="period-icon weekly"><CalendarDays size={28} /></div>
              <div className="period-info">
                <h3>Semanales</h3>
                <p>Últimos 7 días</p>
              </div>
            </div>
            <div className="period-card" onClick={() => setActiveView('monthly')}>
              <div className="period-icon monthly"><CalendarRange size={28} /></div>
              <div className="period-info">
                <h3>Mensuales</h3>
                <p>Análisis del mes</p>
              </div>
            </div>
            <div className="period-card" onClick={() => setActiveView('yearly')}>
              <div className="period-icon yearly"><BarChart3 size={28} /></div>
              <div className="period-info">
                <h3>Anuales</h3>
                <p>Balance {new Date().getFullYear()}</p>
              </div>
            </div>
          </section>

          <section className="reports-dashboard-quick">
            <div className="insight-card">
              <div className="insight-header">
                <TrendingUp size={16} />
                <span>Administración MARIU</span>
              </div>
              <p>Sincronización en tiempo real con inventario.</p>
            </div>
            <div className="insight-card warning">
              <div className="insight-header">
                <AlertTriangle size={16} />
                <span>Auditoría</span>
              </div>
              <p>Generaciones vinculadas a su perfil de usuario.</p>
            </div>
          </section>

          <div className="history-section">
            <div className="section-title">
              <div className="title-left">
                <HistoryIcon size={20} />
                <h2>Historial de Reportes</h2>
              </div>
            </div>
            
            <div className="reports-grid">
              {reports.length === 0 ? (
                <div className="no-reports">
                  <Info size={32} />
                  <p>No hay registros disponibles.</p>
                </div>
              ) : (
                paginatedReports.map((report) => {
                  return (
                    <div key={report.id} className="report-card">
                      <div className="report-card-icon"><FileText size={22} /></div>
                      <div className="report-card-content">
                        <span className="report-type-tag">
                          {typeLabels[report.type.toLowerCase()] || report.type}
                        </span>
                        <h3>{report.description}</h3>
                        <div className="report-meta">
                          <span><Calendar size={12} /> {new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination-bar">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="page-indicator">Página {currentPage} de {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div className="header-titles">
          <h1>{activeView === 'menu' ? 'Centro de Reportes' : 'Módulo de Análisis'}</h1>
          <p>Suministros MARIU • Gestión de Reportes</p>
        </div>
        {loading && (
          <div className="loading-badge">
            <RefreshCw className="spin" size={14} />
            <span>Sincronizando...</span>
          </div>
        )}
      </header>

      <div className="reports-content-area">
        {renderContent()}
      </div>
    </div>
  );
};

export default Reports;