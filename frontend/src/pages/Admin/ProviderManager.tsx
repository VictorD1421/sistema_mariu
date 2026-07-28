import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Calendar, User, Phone, Tag, Clock, Truck } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import '../../styles/ProviderManager.css';

const API_URL = import.meta.env.VITE_API_URL;

interface Provider {
  id: number;
  name: string;
  contact: string;
  category: string;
  last_receipt: string;
  next_receipt: string;
}

const ProviderManager: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    category: '',
    last_receipt: '',
    next_receipt: ''
  });

  const getHeaders = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }), []);

  const registerAudit = useCallback(async (action: string, details: any) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/audit/manual`, {
        action,
        details: { 
          ...details, 
          module: 'PROVIDERS', 
          timestamp: new Date().toISOString() 
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Audit fail:", error);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/providers`, { headers: getHeaders() });
      const data = await response.json();
      setProviders(Array.isArray(data) ? data : []);
      
      await registerAudit('ACCESO_MODULO', { 
        descripcion: 'Usuario ingresó a la gestión de proveedores' 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, registerAudit]);

  useEffect(() => { 
    fetchProviders(); 
  }, [fetchProviders]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'contact') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, [name]: onlyNums });
      return;
    }

    if (name === 'category') {
      const onlyLetters = value.replace(/[0-9]/g, '');
      setFormData({ ...formData, [name]: onlyLetters });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const confirm = await Swal.fire({
      title: '¿Registrar proveedor?',
      text: `Se guardará a "${formData.name}" en la base de datos.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Revisar'
    });

    if (confirm.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/providers`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await registerAudit('CREATE_PROVIDER', { 
            proveedor: formData.name, 
            categoria: formData.category,
            contacto: formData.contact 
          });
          
          Swal.fire({
            title: '¡Éxito!',
            text: 'Proveedor registrado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          
          fetchProviders();
          setShowForm(false);
          setFormData({ name: '', contact: '', category: '', last_receipt: '', next_receipt: '' });
        }
      } catch (error) {
        Swal.fire('Error', 'Hubo un problema al conectar con el servidor', 'error');
      }
    }
  };

  const deleteProvider = async (provider: Provider) => {
    const result = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `Se eliminará a ${provider.name}. Esta acción es permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_URL}/providers/${provider.id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });

        if (response.ok) {
          await registerAudit('DELETE_PROVIDER', { 
            proveedor_id: provider.id, 
            nombre: provider.name 
          });
          
          setProviders(providers.filter(p => p.id !== provider.id));
          Swal.fire('Eliminado', 'El proveedor ha sido borrado.', 'success');
        }
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar el registro', 'error');
      }
    }
  };

  return (
    <div className="provider-manager-container">
      <div className="provider-actions">
        <button className="add-provider-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> {showForm ? 'Cancelar' : 'Nuevo Proveedor'}
        </button>
      </div>

      {showForm && (
        <form className="provider-form animate-view" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label><User size={16} /> Empresa / Proveedor</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="Nombre de la entidad" 
              />
            </div>
            <div className="form-group">
              <label><Phone size={16} /> Contacto</label>
              <input 
                type="text" 
                name="contact" 
                required 
                value={formData.contact} 
                onChange={handleInputChange} 
                placeholder="Solo números" 
              />
            </div>
            <div className="form-group">
              <label><Tag size={16} /> Categoría</label>
              <input 
                type="text" 
                name="category" 
                required 
                value={formData.category} 
                onChange={handleInputChange} 
                placeholder="Solo letras" 
              />
            </div>
            <div className="form-group">
              <label><Clock size={16} /> Último Recibo</label>
              <input 
                type="date" 
                name="last_receipt" 
                required 
                value={formData.last_receipt} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="form-group">
              <label><Calendar size={16} /> Próximo Recibo</label>
              <input 
                type="date" 
                name="next_receipt" 
                required 
                value={formData.next_receipt} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          <button type="submit" className="submit-provider-btn">Confirmar y Guardar</button>
        </form>
      )}

      <div className="provider-list-grid">
        {loading ? (
          <div className="loading-state-full"><div className="loader-dots"></div></div>
        ) : providers.length > 0 ? (
          providers.map(provider => (
            <div key={provider.id} className="provider-card animate-view">
              <div className="provider-card-header">
                <div>
                  <h3>{provider.name}</h3>
                  <span className="category-tag">{provider.category}</span>
                </div>
                <button className="delete-mini-btn" onClick={() => deleteProvider(provider)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="provider-card-body">
                <p><strong>Contacto:</strong> {provider.contact}</p>
                <div className="date-info">
                  <div className="date-item last">
                    <span>Última entrega</span>
                    <strong>{provider.last_receipt}</strong>
                  </div>
                  <div className="date-item next">
                    <span>Próxima entrega</span>
                    <strong>{provider.next_receipt}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-providers">
            <Truck size={48} />
            <p>No hay proveedores registrados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderManager;