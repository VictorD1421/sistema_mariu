import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ArrowLeft, Loader2, FolderTree, Hash, Layers } from 'lucide-react';
import Swal from 'sweetalert2';
import '../../styles/CategoryManager.css';

const API_URL = import.meta.env.VITE_API_URL;

const CategoryManager = ({ onBack }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'var(--bg-panel)',
    color: 'var(--text-main)',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  const reportAuditAction = useCallback(async (action: string, details: object) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/audit/manual`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, details })
      });
    } catch (err) {
      console.warn("Auditoría no disponible");
    }
  }, []);

  const getAuthHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error al cargar categorías' });
    }
  };

  useEffect(() => { 
    fetchCategories(); 
    reportAuditAction("ACCESO_VISTA", { vista: "Gestión de Categorías", operacion: "Revisión Ejecutiva" });
  }, [reportAuditAction]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) { 
        const createdCategory = await res.json();
        setNewName(''); 
        await fetchCategories();
        
        reportAuditAction("CREAR_CATEGORIA", { 
          id: createdCategory.id, 
          nombre: createdCategory.name 
        });

        Toast.fire({
          icon: 'success',
          title: 'Categoría registrada correctamente'
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        Swal.fire({
          title: 'Error',
          text: errData.message || "No se pudo crear la categoría",
          icon: 'error',
          confirmButtonColor: '#6366f1',
          background: 'var(--bg-panel)',
          color: 'var(--text-main)'
        });
      }
    } catch (error) {
      Toast.fire({ icon: 'error', title: 'Error de conexión' });
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (id: number) => {
    const categoryToDelete = categories.find(c => c.id === id);
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la categoría "${categoryToDelete?.name || id}" permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-panel)',
      color: 'var(--text-main)'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/categories/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
        });

        if (res.ok) {
          fetchCategories();
          
          reportAuditAction("ELIMINAR_CATEGORIA", { 
            id: id, 
            nombre: categoryToDelete?.name,
            resultado: "EXITOSO"
          });

          Toast.fire({ icon: 'success', title: 'Categoría eliminada' });
        } else {
          const errorData = await res.json().catch(() => ({}));
          
          reportAuditAction("ELIMINAR_CATEGORIA_FALLIDO", { 
            id: id, 
            motivo: errorData.message || "Error desconocido" 
          });

          Swal.fire({
            icon: 'error',
            title: 'No se puede eliminar',
            text: errorData.message || "La categoría podría tener productos asociados",
            confirmButtonColor: '#6366f1',
            background: 'var(--bg-panel)',
            color: 'var(--text-main)'
          });
        }
      } catch (error) {
        Toast.fire({ icon: 'error', title: 'Error de conexión con el servidor' });
      }
    }
  };

  return (
    <div className="category-manager-container animate-in">
      <header className="manager-header-executive">
        <button className="btn-back-minimal" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <div className="header-content">
          <div className="icon-badge">
            <Layers className="text-primary" size={24} />
          </div>
          <div className="titles">
            <h1>Arquitectura de Categorías</h1>
            <p>Define la estructura organizacional de tu inventario</p>
          </div>
        </div>
      </header>

      <div className="manager-grid-layout">
        <aside className="form-sidebar">
          <div className="glass-card">
            <h3 className="card-subtitle">Registrar Nueva Categoría</h3>
            <form onSubmit={handleAdd} className="executive-form">
              <div className="input-field-group">
                <FolderTree size={18} className="input-icon" />
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre de categoría..." 
                  disabled={loading}
                  required 
                />
              </div>
              <button type="submit" className="btn-execute-action" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <><Plus size={20}/> <span>Agregar Categoría</span></>}
              </button>
            </form>
          </div>
        </aside>

        <main className="results-main">
          <div className="results-header">
             <span className="count-badge">{categories.length} Categorías Activas</span>
          </div>

          <div className="dynamic-category-grid">
            {categories.map((cat, index) => (
              <div key={cat.id} className="executive-item-card" style={{animationDelay: `${index * 0.05}s`}}>
                <div className="item-main-info">
                  <div className="item-id-tag">
                    <Hash size={12} />
                    {cat.id}
                  </div>
                  <span className="item-name">{cat.name}</span>
                </div>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="btn-item-delete"
                  aria-label="Eliminar"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CategoryManager;