import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Edit3, Save, X, 
  MessageSquare, Video, 
  Loader2, Plus, Trash2, ArrowLeft,
  Bold, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import '../../styles/UserManual.css';

const API_URL = import.meta.env.VITE_API_URL;

interface ChatbotKnowledge {
  id: number;
  trigger_text: string;
  content: string;
  category: string;
  is_video: boolean;
}

const UserManual = () => {
  const [knowledgeList, setKnowledgeList] = useState<ChatbotKnowledge[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ trigger_text: "", content: "" });
  const [newForm, setNewForm] = useState({ trigger_text: "", content: "", category: "General", is_video: false });
  const [isLoading, setIsLoading] = useState(true);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const newEditorRef = useRef<HTMLDivElement>(null);

  const fetchKnowledge = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chatbot/main`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKnowledgeList(response.data);
    } catch (error) {
      Swal.fire('Error', 'Error de sincronización.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledge();
  }, [fetchKnowledge]);

  const applyBold = (e: React.MouseEvent) => {
    e.preventDefault();
    document.execCommand('bold', false);
  };

  const insertImage = (e: React.MouseEvent) => {
    e.preventDefault();
    Swal.fire({
      title: 'Insertar Imagen',
      text: 'Nombre del archivo en la carpeta public (ej: manual/foto.png)',
      input: 'text',
      inputPlaceholder: 'manual/nombre.png',
      showCancelButton: true,
      confirmButtonText: 'Insertar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const path = result.value.startsWith('/') ? result.value : `/${result.value}`;
        const imgHtml = `<img src="${path}" alt="Manual" style="max-width: 100%; border-radius: 8px; margin-top: 10px; display: block;" />`;
        document.execCommand('insertHTML', false, imgHtml);
      }
    });
  };

  const handleCreate = async () => {
    const content = newEditorRef.current ? newEditorRef.current.innerHTML : "";
    if (!newForm.trigger_text || !content) {
      return Swal.fire('Atención', 'Título y contenido son obligatorios.', 'warning');
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/chatbot/create`, {
        ...newForm,
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setKnowledgeList(prev => [response.data, ...prev]);
      setIsCreating(false);
      setNewForm({ trigger_text: "", content: "", category: "General", is_video: false });
      Swal.fire({ title: 'Creado', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', 'No se pudo crear la sección.', 'error');
    }
  };

  const handleEdit = (item: ChatbotKnowledge) => {
    setIsEditing(item.id);
    setEditForm({ trigger_text: item.trigger_text, content: item.content });
  };

  const handleSave = async (id: number) => {
    const finalContent = editorRef.current ? editorRef.current.innerHTML : editForm.content;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/chatbot/update/${id}`, {
        trigger_text: editForm.trigger_text,
        content: finalContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setKnowledgeList(prev => prev.map(item => 
        item.id === id ? { ...item, trigger_text: editForm.trigger_text, content: finalContent } : item
      ));
      
      setIsEditing(null);
      Swal.fire({ title: 'Actualizado', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', 'No se pudo guardar.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Eliminar'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/chatbot/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKnowledgeList(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        Swal.fire('Error', 'Error al eliminar.', 'error');
      }
    }
  };

  return (
    <div className="manual-container animate-view">
      <header className="manual-header">
        <div className="manual-title-area">
          <button className="btn-back-modern" onClick={() => window.history.back()}>
            <ArrowLeft size={22} />
          </button>
          <div className="icon-badge"><MessageSquare size={24} /></div>
          <div>
            <h1>Centro de Conocimiento</h1>
            <p>Gestión de respuestas del asistente.</p>
          </div>
        </div>
        <button className="btn-add-section" onClick={() => setIsCreating(true)}>
          <Plus size={20} />
          <span>Nueva Sección</span>
        </button>
      </header>

      {isLoading ? (
        <div className="manual-loading">
          <Loader2 className="spin" size={40} />
        </div>
      ) : (
        <div className="manual-grid">
          {isCreating && (
            <div className="manual-card creating pulse-border">
              <div className="card-header">
                <div className="section-info">
                  <span className="section-icon"><Plus size={20} /></span>
                  <input 
                    placeholder="Título del trigger..."
                    className="edit-trigger-input"
                    value={newForm.trigger_text}
                    onChange={(e) => setNewForm({...newForm, trigger_text: e.target.value})}
                  />
                </div>
                <div className="edit-actions">
                  <button className="btn-icon cancel" onClick={() => setIsCreating(false)}><X size={18} /></button>
                  <button className="btn-icon save" onClick={handleCreate}><Save size={18} /></button>
                </div>
              </div>
              <div className="card-body">
                <div className="editor-rich-wrapper">
                  <div className="textarea-toolbar">
                    <button type="button" className="toolbar-btn" onMouseDown={applyBold}>
                      <Bold size={16} /> <span>Negrita</span>
                    </button>
                    <button type="button" className="toolbar-btn" onMouseDown={insertImage}>
                      <ImageIcon size={16} /> <span>Imagen</span>
                    </button>
                  </div>
                  <div
                    ref={newEditorRef}
                    className="manual-editor-content"
                    contentEditable
                    suppressContentEditableWarning={true}
                  />
                </div>
              </div>
            </div>
          )}

          {knowledgeList.map((item) => (
            <div key={item.id} className={`manual-card ${isEditing === item.id ? 'editing' : ''}`}>
              <div className="card-header">
                <div className="section-info">
                  <span className="section-icon">
                    {item.is_video ? <Video size={20} /> : <BookOpen size={20} />}
                  </span>
                  {isEditing === item.id ? (
                    <input 
                      className="edit-trigger-input"
                      value={editForm.trigger_text}
                      onChange={(e) => setEditForm({...editForm, trigger_text: e.target.value})}
                    />
                  ) : (
                    <h3>{item.trigger_text}</h3>
                  )}
                </div>
                
                <div className="edit-actions">
                  {isEditing === item.id ? (
                    <>
                      <button className="btn-icon cancel" onClick={() => setIsEditing(null)}><X size={18} /></button>
                      <button className="btn-icon save" onClick={() => handleSave(item.id)}><Save size={18} /></button>
                    </>
                  ) : (
                    <>
                      <button className="btn-icon edit" onClick={() => handleEdit(item)}><Edit3 size={18} /></button>
                      <button className="btn-icon delete" onClick={() => handleDelete(item.id)}><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </div>

              <div className="card-body">
                {isEditing === item.id ? (
                  <div className="editor-rich-wrapper">
                    <div className="textarea-toolbar">
                      <button type="button" className="toolbar-btn" onMouseDown={applyBold}>
                        <Bold size={16} /> <span>Negrita</span>
                      </button>
                      <button type="button" className="toolbar-btn" onMouseDown={insertImage}>
                        <ImageIcon size={16} /> <span>Imagen</span>
                      </button>
                    </div>
                    <div
                      ref={editorRef}
                      className="manual-editor-content"
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setEditForm({...editForm, content: e.currentTarget.innerHTML})}
                      dangerouslySetInnerHTML={{ __html: editForm.content }}
                    />
                  </div>
                ) : (
                  <>
                    <div 
                      className="content-preview" 
                      dangerouslySetInnerHTML={{ __html: item.content }} 
                    />
                    <div className="item-footer">
                      <span className="category-tag">{item.category || 'General'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserManual;