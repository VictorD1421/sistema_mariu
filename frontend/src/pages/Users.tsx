import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  UserPlus, Trash2, Shield, Pencil, 
  Mail, Key, ShieldCheck, Loader2, Search, 
  User as UserIcon, ChevronLeft, ChevronRight,
  SortAsc, Filter, UserX, UserCheck
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { apiFetch } from '../api/axios';
import '../styles/Users.css';

const MySwal = withReactContent(Swal);
const API_URL = import.meta.env.VITE_API_URL;

const Usuarios = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [formData, setFormData] = useState({ 
    username: '', password: '', first_name: '', last_name: '', role: 'USER'
  });

  const toast = MySwal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const reportAudit = useCallback(async (action: string, details: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/audit/manual`, {
        action,
        details: { ...details, module: 'USUARIOS', timestamp: new Date().toISOString() }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Audit fail");
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/users');
      const userData = await response.json();
      setUsers(Array.isArray(userData) ? userData : []);
      
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser(payload);
      }
    } catch (error) {
      toast.fire({ icon: 'error', title: 'Falla de sincronización' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleStatus = async (user: any) => {
    if (user.username === 'super_Victor') {
      toast.fire({ icon: 'error', title: 'Acción no permitida' });
      return;
    }

    const result = await MySwal.fire({
      title: user.isActive ? '¿Inhabilitar usuario?' : '¿Reactivar usuario?',
      text: user.isActive 
        ? `El usuario @${user.username} perderá el acceso al sistema inmediatamente.`
        : `El usuario @${user.username} podrá acceder nuevamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: user.isActive ? '#f59e0b' : '#10b981',
      confirmButtonText: user.isActive ? 'Sí, inhabilitar' : 'Sí, reactivar',
    });

    if (result.isConfirmed) {
      try {
        const response = await apiFetch(`/users/${user.id}/status`, { method: 'PATCH' });
        if (response.ok) {
          await reportAudit('CAMBIO_ESTADO_USUARIO', {
            target_username: user.username,
            new_status: !user.isActive
          });
          toast.fire({ icon: 'success', title: 'Estado actualizado' });
          fetchData();
        }
      } catch {
        toast.fire({ icon: 'error', title: 'Error al cambiar estado' });
      }
    }
  };

  const handleOpenModal = (user?: any) => {
    if (user) {
      if (user.role === 'SUPERUSER' && currentUser?.role !== 'SUPERUSER') {
        toast.fire({ icon: 'error', title: 'Acceso denegado' });
        return;
      }
      setEditingId(user.id);
      setFormData({
        username: user.username,
        password: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role,
      });
    } else {
      setEditingId(null);
      setFormData({ username: '', password: '', first_name: '', last_name: '', role: 'USER' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!nameRegex.test(formData.first_name) || !nameRegex.test(formData.last_name)) {
      toast.fire({ icon: 'error', title: 'Nombres y apellidos inválidos' });
      return;
    }
    if (!editingId || (editingId && formData.password)) {
      const { password } = formData;
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^a-zA-Z0-9]/.test(password);
      if (password.length < 6 || !hasLetter || !hasNumber || !hasSpecial) {
        MySwal.fire({
          icon: 'error',
          title: 'Contraseña insegura',
          text: 'Debe tener al menos 6 caracteres, una letra, un número y un carácter especial.',
          confirmButtonColor: 'var(--primary)'
        });
        return;
      }
    }
    setIsSubmitting(true);
    const endpoint = editingId ? `/users/${editingId}` : '/users';
    const method = editingId ? 'PATCH' : 'POST';
    const payload = { ...formData };
    if (editingId && !payload.password) delete (payload as any).password;
    try {
      const response = await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
      if (response.ok) {
        await reportAudit(editingId ? 'EDITAR_USUARIO' : 'CREAR_USUARIO', {
          target_username: formData.username,
          role: formData.role,
          name: `${formData.first_name} ${formData.last_name}`
        });
        toast.fire({ icon: 'success', title: editingId ? "Perfil actualizado" : "Acceso concedido" });
        setShowModal(false);
        fetchData();
      } else {
        const err = await response.json();
        toast.fire({ icon: 'error', title: err.message || "Error en parámetros" });
      }
    } catch {
      toast.fire({ icon: 'error', title: "Error de red" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: any) => {
    if (user.role === 'SUPERUSER' && currentUser?.role !== 'SUPERUSER') {
      toast.fire({ icon: 'error', title: 'Acceso denegado' });
      return;
    }
    const result = await MySwal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará permanentemente a @${user.username}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
    });
    if (result.isConfirmed) {
      try {
        const response = await apiFetch(`/users/${user.id}`, { method: 'DELETE' });
        if (response.ok) {
          await reportAudit('ELIMINAR_USUARIO', { target_id: user.id, target_username: user.username });
          toast.fire({ icon: 'success', title: "Usuario eliminado" });
          fetchData();
        }
      } catch {
        toast.fire({ icon: 'error', title: "Error al eliminar" });
      }
    }
  };

  const processedUsers = useMemo(() => {
    let result = users.filter(u => {
      const matchesSearch = `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      return matchesSearch && matchesRole;
    });
    return result.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
  }, [users, searchTerm, filterRole]);

  const totalPages = Math.ceil(processedUsers.length / recordsPerPage);
  const currentUsers = useMemo(() => {
    const last = currentPage * recordsPerPage;
    const first = last - recordsPerPage;
    return processedUsers.slice(first, last);
  }, [processedUsers, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterRole]);

  return (
    <div className="users-page-wrapper">
      <header className="users-page-header">
        <div className="header-text">
          <h1>Directorio</h1>
          <p>Control de acceso y estados de cuenta.</p>
        </div>
        <button className="btn-add-user" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          <span>Nuevo Registro</span>
        </button>
      </header>

      <div className="users-content-card">
        <div className="table-controls">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Buscar usuarios..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Filter size={18} color="var(--text-muted)" />
            <select className="role-filter-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="ALL">Todos los niveles</option>
              <option value="USER">Usuarios</option>
              <option value="ADMIN">Administradores</option>
              <option value="SUPERUSER">Super Usuarios</option>
            </select>
          </div>
          <span className="user-count-badge"><strong>{processedUsers.length}</strong> usuarios</span>
        </div>

        {isLoading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={32} />
            <p>Sincronizando registros...</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th><SortAsc size={14} /> Identidad</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Nivel</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user.id} className={`user-row ${!user.isActive ? 'is-disabled' : ''}`}>
                      <td>
                        <div className="user-profile-cell">
                          <div className={`avatar-circle ${!user.isActive ? 'grayscale' : ''}`}>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </div>
                          <div className="identity-info">
                            <span className="full-name">{user.first_name} {user.last_name}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="username-tag">@{user.username}</span></td>
                      <td>
                        <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Activo' : 'Inhabilitado'}
                        </span>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          <Shield size={12} /> {user.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-group">
                          {!(user.role === 'SUPERUSER' && currentUser?.role !== 'SUPERUSER') && (
                            <>
                              <button 
                                className={`btn-action ${user.isActive ? 'disable' : 'enable'}`} 
                                title={user.isActive ? 'Inhabilitar' : 'Habilitar'}
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                              </button>
                              <button className="btn-action edit" onClick={() => handleOpenModal(user)}>
                                <Pencil size={18} />
                              </button>
                              <button className="btn-action delete" onClick={() => handleDelete(user)}>
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-pagination">
                  <ChevronLeft size={20} />
                </button>
                <span>Página {currentPage} de {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="btn-pagination">
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-root">
          <div className="modal-backdrop" onClick={() => !isSubmitting && setShowModal(false)} />
          <div className="modal-main">
            <header className="modal-head">
              <div className="head-titles">
                <h3>{editingId ? 'Modificar Usuario' : 'Crear Usuario'}</h3>
                <p>Nivel de acceso y credenciales</p>
              </div>
            </header>
            <form onSubmit={handleSubmit} className="modal-body" autoComplete="off">
              <div className="form-grid">
                <div className="row-dual">
                  <div className="input-group">
                    <label className="field-label">Nombre</label>
                    <div className="input-wrapper">
                      <UserIcon size={16} />
                      <input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')})} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="field-label">Apellidos</label>
                    <div className="input-wrapper">
                      <UserIcon size={16} />
                      <input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '')})} />
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <label className="field-label">Nombre de Usuario</label>
                  <div className="input-wrapper">
                    <Mail size={16} />
                    <input required disabled={!!editingId} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="field-label">Contraseña</label>
                  <div className="input-wrapper">
                    <Key size={16} />
                    <input type="password" required={!editingId} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="field-label">Nivel de Acceso</label>
                  <div className="input-wrapper select-type">
                    <ShieldCheck size={16} />
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option value="USER">Usuario</option>
                      <option value="ADMIN">Administrador</option>
                      {currentUser?.role === 'SUPERUSER' && <option value="SUPERUSER">Super Usuario Desarrollador</option>}
                    </select>
                  </div>
                </div>
              </div>
              <footer className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="spinner" size={18} /> : (editingId ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;