import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageSquare, X, ChevronLeft, Maximize2 } from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/Chatbot.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<any>(null);
  const [mainOptions, setMainOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMainOptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/chatbot/main`);
      setMainOptions(res.data);
      setStep(null);
    } catch (e) {
      console.error("Error cargando menú principal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMainOptions();
    }
  }, [isOpen, fetchMainOptions]);

  const handleOptionClick = async (id: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/chatbot/children/${id}`);
      const contentRes = await axios.get(`${API_URL}/chatbot/main`);
      const currentItem = contentRes.data.find((i: any) => i.id === id) || 
                          res.data.find((i: any) => i.id === id);

      setStep({
        content: currentItem?.content || "Cargando contenido...",
        image_path: currentItem?.image_path || null,
        children: res.data
      });
    } catch (e) {
      console.error("Error al cargar paso");
    } finally {
      setLoading(false);
    }
  };

  const openFullscreenImage = (imgSrc: string) => {
    Swal.fire({
      imageUrl: imgSrc,
      imageAlt: 'Visualización de ayuda',
      showConfirmButton: false,
      showCloseButton: true,
      width: 'auto',
      padding: '0',
      background: 'transparent',
      customClass: {
        image: 'animate-zoom-in'
      }
    });
  };

  const toggleChat = () => {
    if (!isOpen) {
      setStep(null);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="chatbot-fixed-wrapper">
      <button 
        onClick={toggleChat}
        className={`chatbot-trigger-btn ${isOpen ? 'active' : ''}`}
        title="Asistente de Ayuda"
      >
        {isOpen ? <X size={24} /> : <div className="trigger-content"><MessageSquare size={22} /> <span>Ayuda</span></div>}
      </button>

      {isOpen && (
        <div className="chatbot-window animate-slide-up">
          <div className="chatbot-header">
            <div className="header-user-info">
              <div className="bot-avatar">M3</div>
              <div className="header-text">
                <span className="bot-name">Asistente Mariu 3000</span>
                <span className="bot-status">En línea ahora</span>
              </div>
            </div>
          </div>
          
          <div className="chatbot-body">
            {loading ? (
              <div className="bot-loading">
                <div className="dot-pulse"></div>
              </div>
            ) : step ? (
              <div className="animate-fade-in">
                <button onClick={fetchMainOptions} className="back-link-modern">
                  <ChevronLeft size={16} /> Menú Principal
                </button>
                
                <div className="message-container">
                  <div className="bot-message-bubble">
                    <div dangerouslySetInnerHTML={{ __html: step.content }} />
                    
                    {step.image_path && (
                      <div className="bot-image-wrapper" onClick={() => openFullscreenImage(step.image_path)}>
                        <img 
                          src={step.image_path} 
                          alt="Ayuda visual" 
                          className="bot-content-image"
                        />
                        <div className="image-overlay">
                          <Maximize2 size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {step.children && step.children.length > 0 && (
                  <div className="options-grid">
                    <p className="options-label">Selecciona una opción específica:</p>
                    {step.children.map((child: any) => (
                      <button 
                        key={child.id}
                        onClick={() => handleOptionClick(child.id)}
                        className="option-pill"
                      >
                        {child.trigger_text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="message-container">
                  <div className="bot-message-bubble">
                    ¡Hola! 👋 Soy tu asistente de <strong>Mariu 3000</strong>. He sido entrenado para ayudarte con el inventario, ventas y configuración. 
                    <br/><br/>
                    ¿En qué área tienes dudas hoy?
                  </div>
                </div>
                
                <div className="options-grid">
                  {mainOptions.map((opt: any) => (
                    <button 
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.id)}
                      className="option-pill main-opt"
                    >
                      {opt.trigger_text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="chatbot-footer">
            <p>Sistema Mariu - Soporte Integrado</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;