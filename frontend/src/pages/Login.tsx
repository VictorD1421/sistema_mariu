import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, ArrowLeft, Send, AlertCircle, LifeBuoy } from 'lucide-react';
import axios from 'axios';
import '../styles/Login.css';

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [viewMode, setViewMode] = useState<'login' | 'recovery'>('login');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const { login, logout, user } = useAuth(); 
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    localStorage.clear();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const reportAudit = async (action: string, details: any, token: string) => {
    try {
      await axios.post(`${API_URL}/audit/manual`, {
        action,
        details: { ...details, module: 'AUTH', timestamp: new Date().toISOString() }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Audit fail");
    }
  };

  const handleOpenRecovery = () => {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setRecoveryPin(pin);
    setViewMode('recovery');
    setTicketSent(false);
    setError('');
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (regex.test(value)) {
      setFullName(value);
    }
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (regex.test(value)) {
      setPosition(value);
    }
  };

  const handleSendTicket = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/users/recovery-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || 'N/A',
          fullName,
          position,
          description: problemDescription,
          ticketCode: recoveryPin,
          device: navigator.userAgent
        })
      });

      if (!response.ok) throw new Error();
      setTicketSent(true);
    } catch (err) {
      setError('Error al enviar la solicitud. Intente más tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const checkRes = await axios.get(`${API_URL}/users/check-status/${username}`);
      if (checkRes.data && checkRes.data.isActive === false) {
        setError('Tiene los accesos denegados y no puede ingresar');
        setIsSubmitting(false);
        return;
      }

      await login(username, password);
      
      const token = localStorage.getItem('MARIU_AUTH_TOKEN') || localStorage.getItem('token');
      if (token) {
        await reportAudit('INGRESO_SISTEMA', { 
          username, 
          descripcion: `Usuario ${username} ha iniciado sesión correctamente.` 
        }, token);
      }
    } catch (err: any) {
      setLoginAttempts(prev => prev + 1);
      
      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 401 || status === 403) {
        if (message?.includes('inhabilitada') || message?.includes('denegado')) {
          setError('Tiene los accesos denegados y no puede ingresar');
        } else {
          setError('Credenciales incorrectas. Verifique su usuario o contraseña.');
        }
      } else if (err.message === 'Failed to fetch') {
        setError('No se pudo conectar con el servidor.');
      } else {
        const rawMessage = message || err.message || 'Error de acceso';
        setError(Array.isArray(rawMessage) ? rawMessage[0] : rawMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="animated-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      <div className="login-wrapper">
        <main className="login-box">
          <header className="login-brand">
            <div className="brand-logo-container">
              <img src="/branding/logo.png" alt="Logo Mariu 3000" className="brand-logo-img" />
            </div>
            <h1 className="brand-title">Mariu 3000</h1>
            <p className="brand-subtitle">Suministros Mariu 3000 C.A.</p>
            <div className={`system-tag ${viewMode === 'recovery' ? 'recovery' : ''}`}>
              {viewMode === 'login' ? 'ACCESO RESTRINGIDO' : 'SOLICITUD DE SOPORTE'}
            </div>
          </header>

          {viewMode === 'login' ? (
            <>
              <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                <div className="input-group">
                  <label>Nombre de Usuario</label>
                  <div className="field-wrapper">
                    <input 
                      type="text" 
                      autoComplete="off"
                      name="login-username-field"
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="Usuario institucional" 
                      required 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Contraseña</label>
                  <div className="field-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••••••" 
                      autoComplete="off"
                      name="login-password-field"
                      required 
                    />
                    <button type="button" className="toggle-visibility" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="login-error-container">
                    <div className="error-content">
                      <AlertCircle size={18} />
                      <span className="error-text">{error}</span>
                    </div>
                    {(loginAttempts >= 3 || error.includes('denegado')) && (
                      <button type="button" className="recovery-trigger" onClick={handleOpenRecovery}>
                        ¿Problemas para acceder? Solicitar ayuda
                      </button>
                    )}
                  </div>
                )}

                <button type="submit" className="submit-button" disabled={isSubmitting}>
                  {isSubmitting ? <div className="spinner"></div> : (
                    <div className="btn-content">
                      <span>Iniciar Sesión</span>
                      <ChevronRight size={20} />
                    </div>
                  )}
                </button>
              </form>

              <div className="login-extra-options">
                <button 
                  type="button" 
                  className="support-direct-link" 
                  onClick={handleOpenRecovery}
                >
                  <LifeBuoy size={18} />
                  <span>Soporte Técnico</span>
                </button>
              </div>
            </>
          ) : (
            <div className="recovery-content">
              {!ticketSent ? (
                <form onSubmit={handleSendTicket} className="recovery-form" autoComplete="off">
                  <p className="recovery-instruction">Valide su identidad para gestionar su acceso.</p>
                  
                  <div className="ticket-display mini">
                    <small>CÓDIGO DE VALIDACIÓN</small>
                    <strong>#{recoveryPin}</strong>
                  </div>

                  <div className="input-group">
                    <label>Nombre Completo</label>
                    <input 
                      type="text" 
                      className="recovery-input"
                      value={fullName} 
                      autoComplete="off"
                      name="recovery-fullname"
                      onChange={handleFullNameChange} 
                      placeholder="Nombre completo..."
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label>Cargo / Departamento</label>
                    <input 
                      type="text" 
                      className="recovery-input"
                      value={position} 
                      autoComplete="off"
                      name="recovery-position"
                      onChange={handlePositionChange} 
                      placeholder="Departamento o cargo..."
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label>Descripción del Problema</label>
                    <textarea 
                      className="recovery-input"
                      style={{ height: '90px', paddingTop: '12px', resize: 'none' }}
                      value={problemDescription} 
                      autoComplete="off"
                      name="recovery-description"
                      onChange={(e) => setProblemDescription(e.target.value)} 
                      placeholder="Indique el motivo de su solicitud..."
                      required 
                    />
                  </div>

                  {error && (
                    <div className="login-error-container" style={{ marginBottom: '15px' }}>
                      <div className="error-content">
                        <AlertCircle size={18} />
                        <span className="error-text">{error}</span>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="submit-button recovery-btn" disabled={isSubmitting}>
                    {isSubmitting ? <div className="spinner"></div> : (
                      <div className="btn-content">
                        <span>Enviar Ticket</span>
                        <Send size={18} />
                      </div>
                    )}
                  </button>
                </form>
              ) : (
                <div className="success-recovery">
                  <div className="success-icon">✓</div>
                  <h3>Ticket Enviado</h3>
                  <p>El administrador revisará pronto su solicitud.</p>
                </div>
              )}

              <button className="back-to-login" onClick={() => { setViewMode('login'); setError(''); }}>
                <ArrowLeft size={16} /> Volver al login
              </button>
            </div>
          )}

          <footer className="login-credits">
            <p className="footer-text">© 2026 Suministros Mariu 3000 C.A.</p>
            <p className="footer-author">Desarrollado por <strong>Victor Carrillo</strong></p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Login;