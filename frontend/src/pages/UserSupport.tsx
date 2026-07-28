import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  User as UserIcon, 
  Briefcase, 
  MessageSquare,
  Ticket,
  ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import '../styles/UserSupport.css';

const API_URL = import.meta.env.VITE_API_URL;

const UserSupport = () => {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState(user ? `${user.first_name} ${user.last_name}` : '');
  const [position, setPosition] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [category, setCategory] = useState('technical');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [error, setError] = useState('');
  const [ticketId] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  const reportAudit = async (action: string, details: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/audit/manual`, {
        action,
        details: { ...details, module: 'SUPPORT', timestamp: new Date().toISOString() }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Audit fail");
    }
  };

  const handleSendTicket = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/users/recovery-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username || 'internal_user',
          fullName,
          position,
          description: `[${category.toUpperCase()}] ${problemDescription}`,
          ticketCode: ticketId,
          device: navigator.userAgent
        })
      });

      if (!response.ok) throw new Error();
      await reportAudit('GENERACION_TICKET', { ticketId, categoria: category });
      setTicketSent(true);
    } catch (err) {
      setError('Error de conexión. No se pudo registrar el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="support-container">
      <div className="support-card">
        <aside className="support-sidebar">
          <div className="support-icon-box">
            <Ticket size={32} />
          </div>
          <div className="support-info">
            <h3>Centro de Soporte</h3>
            <p>Mariu 3000</p>
          </div>
          <nav className="support-nav">
            <div className="nav-item active">
              <MessageSquare size={18} /> Nuevo Ticket
            </div>
          </nav>
          <div className="support-footer-info">
            <ShieldCheck size={14} /> Sesión Protegida
          </div>
        </aside>

        <main className="support-main">
          {!ticketSent ? (
            <div className="support-content animate-fade-in">
              <header className="support-header">
                <h2>Crear Nueva Solicitud</h2>
                <span className="ticket-badge">Ticket ID: #{ticketId}</span>
              </header>

              <form onSubmit={handleSendTicket} className="support-form">
                <div className="form-grid">
                  <div className="support-input-group">
                    <label><UserIcon size={14} /> Solicitante</label>
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="support-input-group">
                    <label><Briefcase size={14} /> Departamento</label>
                    <input 
                      type="text" 
                      value={position} 
                      onChange={(e) => setPosition(e.target.value)} 
                      placeholder="Ej: Administración"
                      required 
                    />
                  </div>
                </div>

                <div className="support-input-group">
                  <label>Categoría del Problema</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="technical">Problema Técnico / Error de Sistema</option>
                    <option value="inventory">Problema en Inventario</option>
                    <option value="billing">Problema de Venta / Precios</option>
                    <option value="other">Otro / Consulta General</option>
                  </select>
                </div>

                <div className="support-input-group">
                  <label><MessageSquare size={14} /> Descripción Detallada</label>
                  <textarea 
                    value={problemDescription} 
                    onChange={(e) => setProblemDescription(e.target.value)} 
                    placeholder="Explique el inconveniente aquí..."
                    required 
                  />
                </div>

                {error && (
                  <div className="support-error">
                    <AlertCircle size={18} /> {error}
                  </div>
                )}

                <footer className="support-actions">
                  <button type="submit" className="btn-send-ticket" disabled={isSubmitting}>
                    {isSubmitting ? <span className="loader"></span> : (
                      <>
                        Enviar Ticket <Send size={18} />
                      </>
                    )}
                  </button>
                </footer>
              </form>
            </div>
          ) : (
            <div className="support-success animate-scale-up">
              <div className="success-icon-circle">
                <CheckCircle2 size={48} />
              </div>
              <h2>¡Solicitud Recibida!</h2>
              <p>Tu ticket <strong>#{ticketId}</strong> ha sido enviado al equipo de desarrollo.</p>
              <button className="btn-reset" onClick={() => { setTicketSent(false); setProblemDescription(''); }}>
                Generar otro reporte
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserSupport;