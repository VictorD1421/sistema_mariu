import React, { useState, useEffect } from 'react';
import { 
  Gavel, Truck, ChevronLeft, 
  ArrowRight, LifeBuoy 
} from 'lucide-react';

import '../../styles/GeneralAdmin.css';
import TicketList from './TicketList';
import ProviderManager from './ProviderManager';

const API_URL = import.meta.env.VITE_API_URL;

const GeneralAdmin: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'menu' | 'tickets' | 'providers'>('menu');

  const registerAudit = async (viewName: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/audit/manual`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: `ACCESO_MODULO_ADMIN`,
          details: {
            module: 'GeneralAdmin',
            section: viewName,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error("Error en auditoría:", error);
    }
  };

  useEffect(() => {
    registerAudit(activeSection === 'menu' ? 'Main Menu' : activeSection);
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'tickets':
        return (
          <div className="admin-detail-view animate-view">
            <header className="detail-header">
              <button onClick={() => setActiveSection('menu')} className="back-btn-simple">
                <ChevronLeft size={20} /> Volver al Menú
              </button>
              <h2>Tickets de Recuperación</h2>
            </header>
            <div className="admin-component-body">
              <TicketList />
            </div>
          </div>
        );

      case 'providers':
        return (
          <div className="admin-detail-view animate-view">
            <header className="detail-header">
              <button onClick={() => setActiveSection('menu')} className="back-btn-simple">
                <ChevronLeft size={20} /> Volver al Menú
              </button>
              <h2>Gestión de Proveedores</h2>
            </header>
            <div className="admin-component-body">
              <ProviderManager />
            </div>
          </div>
        );

      default:
        return (
          <div className="admin-menu-grid animate-view">
            <AdminOption 
              title="Tickets de Recuperación"
              description="Gestiona solicitudes de acceso y soporte de credenciales."
              icon={<LifeBuoy size={28} />}
              color="#ef4444"
              onClick={() => setActiveSection('tickets')}
            />
            <AdminOption 
              title="Proveedores"
              description="Directorio de entidades y contactos de suministro de mercancía."
              icon={<Truck size={28} />}
              color="#10b981"
              onClick={() => setActiveSection('providers')}
            />
          </div>
        );
    }
  };

  return (
    <div className="admin-page-container">
      {activeSection === 'menu' && (
        <header className="admin-header-main">
          <div className="header-info">
            <div className="title-with-icon">
              <Gavel className="icon-main" size={32} />
              <h1>Administración General</h1>
            </div>
            <p>Panel de control para entidades maestras y soporte técnico</p>
          </div>
        </header>
      )}
      <div className="admin-content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
};

interface AdminOptionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const AdminOption: React.FC<AdminOptionProps> = ({ title, description, icon, color, onClick }) => (
  <div className="admin-card-option" onClick={onClick}>
    <div className="card-icon-box" style={{ backgroundColor: `${color}15`, color: color }}>
      {icon}
    </div>
    <div className="card-text">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <div className="card-arrow">
      <ArrowRight size={20} />
    </div>
  </div>
);

export default GeneralAdmin;