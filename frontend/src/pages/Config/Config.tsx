import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Database, Download, Trash2, 
  Loader2, RefreshCw, 
  FileJson, CheckSquare, Square, Upload,
  BookOpen, ChevronRight, Settings, ShieldAlert
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import UserManual from './UserManual';
import '../../styles/Config.css';

const API_URL = import.meta.env.VITE_API_URL;

const Config = () => {
  const [activeView, setActiveView] = useState<'menu' | 'manual'>('menu');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reportAudit = useCallback(async (action: string, details: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/audit/manual`, {
        action,
        details: { ...details, module: 'CONFIGURACION_SISTEMA', timestamp: new Date().toISOString() }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Audit fail");
    }
  }, []);

  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/db/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filteredTables = response.data.filter((table: string) => !table.toLowerCase().includes('user'));
      setTables(filteredTables);
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el diccionario de datos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    reportAudit('ACCESO_CONFIGURACION', { descripcion: 'Acceso al panel de control de DB.' });
  }, [reportAudit, fetchTables]);

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName) 
        : [...prev, tableName]
    );
  };

  const handleBackup = async (full: boolean = false) => {
    const tablesToBackup = full ? tables : selectedTables;
    if (tablesToBackup.length === 0) return Swal.fire('Atención', 'Seleccione tablas para respaldar.', 'info');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/db/backup`, 
        { tables: tablesToBackup, type: full ? 'FULL' : 'PARTIAL' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data.data));
      const link = document.createElement('a');
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `backup_mariu_${full ? 'total' : 'parcial'}_${new Date().getTime()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      await reportAudit('RESPALDO_DB', { tipo: full ? 'TOTAL' : 'PARCIAL', tablas: tablesToBackup });
      Swal.fire('Éxito', 'Respaldo descargado correctamente.', 'success');
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar el respaldo.', 'error');
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await Swal.fire({
      title: '¿Restaurar Base de Datos?',
      text: "Se sobrescribirán las tablas con la información del archivo. Esta acción es crítica.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6C72FF',
      confirmButtonText: 'Sí, restaurar datos',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const backupData = JSON.parse(content);
          const token = localStorage.getItem('token');
          
          await axios.post(`${API_URL}/db/restore`, backupData, {
            headers: { Authorization: `Bearer ${token}` }
          });

          await reportAudit('RESTAURACION_DB', { archivo: file.name });
          Swal.fire('Restaurado', 'La base de datos ha sido actualizada.', 'success');
          fetchTables();
        } catch (error) {
          Swal.fire('Error', 'El archivo no es válido o el servidor rechazó la solicitud.', 'error');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleClearTables = async () => {
    if (selectedTables.length === 0) return Swal.fire('Atención', 'Seleccione tablas para limpiar.', 'info');

    const result = await Swal.fire({
      title: '¿Limpiar Tablas?',
      text: `Se borrará permanentemente toda la información de: ${selectedTables.join(', ')}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#FF4D4D',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/db/clear`, { tables: selectedTables }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await reportAudit('LIMPIEZA_DB', { tablas: selectedTables });
        Swal.fire('Éxito', 'Información eliminada físicamente.', 'success');
        setSelectedTables([]);
        await fetchTables();
      } catch (error) {
        Swal.fire('Error', 'No se pudo completar la limpieza.', 'error');
      }
    }
  };

  const openManual = () => {
    reportAudit('CONSULTA_MANUAL', { origen: 'Panel de Configuración' });
    setActiveView('manual');
  };

  return (
    <div className="config-container animate-view">
      <nav className="config-breadcrumb">
        <span 
          className={`breadcrumb-item ${activeView === 'menu' ? 'active' : 'link'}`}
          onClick={() => setActiveView('menu')}
        >
          <Settings size={16} /> Configuración
        </span>
        {activeView === 'manual' && (
          <>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-item active">Manual de Usuario</span>
          </>
        )}
      </nav>

      {activeView === 'menu' ? (
        <>
          <header className="config-header">
            <div className="header-info">
              <h1>Panel de Control</h1>
              <p>Herramientas de mantenimiento para el ecosistema Mariu 3000.</p>
            </div>
            <div className="system-status-pill">
              <div className="status-indicator online"></div>
              <span>Servidor: Operacional</span>
            </div>
          </header>

          <div className="config-grid">
            <section className="config-card db-management">
              <div className="card-header-config">
                <div className="title-group">
                  <Database className="text-primary" size={24} />
                  <div>
                    <h3>Esquema de Datos</h3>
                    <small>{tables.length} tablas detectadas en MariaDB</small>
                  </div>
                </div>
                <button className="refresh-tables-btn" onClick={fetchTables} disabled={isLoading}>
                  <RefreshCw size={20} className={isLoading ? 'spin' : ''} />
                </button>
              </div>

              <div className="table-selector-grid">
                {isLoading ? (
                  <div className="loading-placeholder">
                    <Loader2 className="spin" size={24} />
                    <span>Leyendo estructura de tablas...</span>
                  </div>
                ) : (
                  tables.map(table => (
                    <div 
                      key={table} 
                      className={`table-item ${selectedTables.includes(table) ? 'active' : ''}`} 
                      onClick={() => toggleTable(table)}
                    >
                      {selectedTables.includes(table) ? <CheckSquare size={20} /> : <Square size={20} />}
                      <span>{table}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="action-footer">
                <div className="selection-info">
                  <strong>{selectedTables.length}</strong> tablas seleccionadas
                </div>
                <div className="button-group-config">
                  <button className="btn-config sec" onClick={() => handleBackup(true)}>
                    <Download size={18} /> Respaldo Full
                  </button>
                  
                  <button className="btn-config pri" onClick={() => handleBackup(false)} disabled={selectedTables.length === 0}>
                    <FileJson size={18} /> Exportar Selección
                  </button>

                  <button className="btn-config sec" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={18} /> Restaurar
                    <input type="file" ref={fileInputRef} accept=".json" hidden onChange={handleRestore} />
                  </button>

                  <button className="btn-config dan" onClick={handleClearTables} disabled={selectedTables.length === 0}>
                    <Trash2 size={18} /> Purgar
                  </button>
                </div>
              </div>
            </section>

            <section className="config-sidebar">
              <div className="alert-box-warning">
                 <ShieldAlert size={28} />
                 <div>
                    <h4>Zona de Seguridad</h4>
                    <p>Las operaciones de restauración y purga son irreversibles. Verifique sus archivos de respaldo.</p>
                 </div>
              </div>

              <div className="manual-card-button" onClick={openManual}>
                <div className="manual-card-icon-wrapper">
                  <BookOpen size={36} strokeWidth={1.5} />
                </div>
                <div className="manual-card-text">
                  <h3>Manual del Asistente</h3>
                  <p>Configura el conocimiento del chatbot</p>
                </div>
                <ChevronRight size={24} className="arrow-hint" />
              </div>
            </section>
          </div>
        </>
      ) : (
        <UserManual />
      )}
    </div>
  );
};

export default Config;