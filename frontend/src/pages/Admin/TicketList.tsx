import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, Search, RefreshCw, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import '../../styles/TicketList.css';

const API_URL = import.meta.env.VITE_API_URL;

interface RecoveryTicket {
  id: number;
  username: string;
  full_name: string;
  position: string;
  description: string;
  ticket_code: string;
  status: 'PENDING' | 'RESOLVED';
  created_at: string;
}

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<RecoveryTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const itemsPerPage = isMobile ? 1 : 10;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const reportAudit = useCallback(async (action: string, details: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/audit/manual`, {
        action,
        details: { ...details, module: 'SOPORTE_TICKETS', timestamp: new Date().toISOString() }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Audit fail");
    }
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/recovery-tickets`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setTickets(Array.isArray(data) ? data : []);
      
      await reportAudit('ACCESO_LISTADO_TICKETS', { descripcion: 'Visualización de bandeja de soporte' });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (ticket: RecoveryTicket) => {
    const result = await Swal.fire({
      title: '¿Resolver ticket?',
      text: `Se marcará como solucionado el acceso para ${ticket.username}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, resolver',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/recovery-tickets/${ticket.id}/status`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'RESOLVED' })
        });

        if (response.ok) {
          await reportAudit('RESOLVER_TICKET', { 
            ticket_id: ticket.id, 
            codigo: ticket.ticket_code, 
            usuario_afectado: ticket.username 
          });
          
          setTickets(tickets.map(t => t.id === ticket.id ? { ...t, status: 'RESOLVED' } : t));
          Swal.fire('¡Listo!', 'El ticket ha sido actualizado.', 'success');
        }
      } catch (error) {
        Swal.fire('Error', 'No se pudo actualizar el ticket.', 'error');
      }
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const allFiltered = tickets.filter(t => 
    t.ticket_code.toLowerCase().includes(filter.toLowerCase()) ||
    t.username.toLowerCase().includes(filter.toLowerCase()) ||
    t.full_name.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPages = Math.ceil(allFiltered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredTickets = allFiltered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="ticket-list-wrapper animate-view">
      <div className="table-controls">
        <div className="search-box-modern">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Filtrar por código, usuario o nombre..." 
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button className="refresh-btn" onClick={fetchTickets} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="tickets-table-container">
        {loading ? (
          <div className="loading-state"><div className="loader-dots"></div></div>
        ) : (
          <>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Usuario</th>
                  <th>Cargo</th>
                  <th className="desktop-only">Descripción</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id} className={ticket.status.toLowerCase()}>
                      <td data-label="Código"><span className="ticket-badge">{ticket.ticket_code}</span></td>
                      <td data-label="Usuario">
                        <div className="user-info-cell">
                          <strong>{ticket.username}</strong>
                          <span>{ticket.full_name}</span>
                        </div>
                      </td>
                      <td data-label="Cargo" className="desktop-only">{ticket.position}</td>
                      <td data-label="Descripción" className="desc-cell desktop-only">{ticket.description}</td>
                      <td data-label="Estado">
                        <span className={`status-pill ${ticket.status.toLowerCase()}`}>
                          {ticket.status === 'PENDING' ? <Clock size={14}/> : <CheckCircle size={14}/>}
                          {ticket.status}
                        </span>
                      </td>
                      <td data-label="Fecha">{new Date(ticket.created_at).toLocaleDateString()}</td>
                      <td data-label="Acción">
                        {ticket.status === 'PENDING' ? (
                          <button className="action-icon-btn check-btn" onClick={() => handleToggleStatus(ticket)}>
                            <Check size={18} />
                          </button>
                        ) : (
                          <span className="resolved-check"><CheckCircle size={18} color="#10b981" /></span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="empty-table-msg">No se encontraron tickets en el sistema.</td></tr>
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination-container">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="pagi-btn"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="pagi-info">
                  Página <strong>{currentPage}</strong> de {totalPages}
                  <small className="mobile-only">({allFiltered.length} total)</small>
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="pagi-btn"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TicketList;