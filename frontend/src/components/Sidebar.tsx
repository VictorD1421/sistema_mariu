import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Package, History, LogOut, 
  Users, Receipt, Settings, Gavel, X,
  FileBarChart, LifeBuoy, BookOpen
} from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Deberás ingresar tus credenciales nuevamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#14b8a6',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });

    if (result.isConfirmed) {
      logout();
      navigate('/login');
    }
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} 
        onClick={closeMobile}
      />

      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <img src="/branding/logo-mariu.png" alt="MARIU Logo" className="sidebar-brand-img" />
            <div className="brand-info">
              <span className="brand-sub">Suministros</span>
              <span className="brand-name">MARIU</span>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={closeMobile}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <label className="group-label">Paneles de Gestión</label>
            <NavLink to="/dashboard" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LayoutDashboard size={22} />
              <span>Inicio</span>
            </NavLink>
            <NavLink to="/inventario" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Package size={22} />
              <span>Inventario</span>
            </NavLink>
          </div>

          <div className="nav-group">
            <label className="group-label">Operaciones</label>
            <NavLink to="/ventas" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <Receipt size={22} />
              <span>Admin de Economía</span>
            </NavLink>
          </div>

          {(user?.role === 'ADMIN' || user?.role === 'SUPERUSER') && (
            <div className="nav-group">
              <label className="group-label">Gestión Interna</label>
              <NavLink to="/administracion-general" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Gavel size={22} />
                <span>Adm. General</span>
              </NavLink>
              <NavLink to="/reportes" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <FileBarChart size={22} />
                <span>Reportes</span>
              </NavLink>
              <NavLink to="/usuarios" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Users size={22} />
                <span>Usuarios</span>
              </NavLink>
            </div>
          )}

          {user?.role === 'SUPERUSER' && (
            <div className="nav-group">
              <label className="group-label">Administración</label>
              <NavLink to="/auditoria" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <History size={22} />
                <span>Historial</span>
              </NavLink>
              <NavLink to="/configuraciones" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <Settings size={22} />
                <span>Configuraciones</span>
              </NavLink>
            </div>
          )}

          <div className="nav-group">
            <label className="group-label">Ayuda y Soporte</label>
            <NavLink to="/soporte" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <LifeBuoy size={22} />
              <span>Soporte</span>
            </NavLink>
            <NavLink to="/manual-uso" onClick={closeMobile} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <BookOpen size={22} />
              <span>Manual de Uso</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button-modern">
            <div className="logout-icon-bg">
              <LogOut size={18} />
            </div>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;