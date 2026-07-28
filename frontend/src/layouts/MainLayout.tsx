import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  Sun, Moon, PanelLeftClose, PanelLeftOpen, 
  Menu, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Chatbot from '../components/Chatbot'; 
import '../styles/Layout.css';

const MainLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.scroll-container');
      if (container) setScrolled(container.scrollTop > 20);
    };
    const container = document.querySelector('.scroll-container');
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    setIsMobileOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const getInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user.username?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className={`app-layout ${isCollapsed ? 'sidebar-mini' : 'sidebar-full'} ${darkMode ? 'theme-dark' : 'theme-light'}`}>
      <Sidebar 
        isCollapsed={isCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />
      
      <main className="main-viewport">
        <header className={`global-header ${scrolled ? 'header-scrolled' : ''}`}>
          <div className="header-left">
            <button 
              className="sidebar-toggle-btn desktop-only"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <button 
              className="sidebar-toggle-btn mobile-only"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="header-actions">
            <div className="status-indicator desktop-only">
              <span className="dot online"></span>
              <span className="status-text">Activo</span>
            </div>

            <div className="divider-vertical desktop-only"></div>

            <button 
              className="theme-toggle-pro" 
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="user-profile-relative" ref={dropdownRef}>
              <div 
                className={`user-profile-pill ${isUserMenuOpen ? 'active' : ''}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <div className="user-info desktop-only">
                  <span className="user-name">
                    {user 
                      ? (user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                          : user.username)
                      : 'Invitado'}
                  </span>
                  <span className="user-role">
                    {user?.role || 'USER'}
                  </span>
                </div>
                <div className="avatar-wrapper">
                  <span className="user-initials">{getInitials()}</span>
                </div>
              </div>

              {isUserMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="dropdown-header mobile-only" style={{ padding: '10px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {user?.username}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {user?.role}
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={logout}>
                    <LogOut size={16} /> 
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="scroll-container">
          <div className="content-wrapper">
            <Outlet />
          </div>
          <footer className="main-footer">
            <p>&copy; 2026 MARIU Suministros • Gestión Administrativa</p>
          </footer>
        </div>
      </main>

      <Chatbot />
    </div>
  );
};

export default MainLayout;