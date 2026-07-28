import React, { useState } from 'react';
import { 
  BookOpen, LayoutDashboard, Package, ShoppingCart, BarChart3, 
  ChevronRight, ChevronLeft, Info, Lightbulb, Activity, HelpCircle as HelpIcon 
} from 'lucide-react';
import UserSupport from './UserSupport'; // Asegúrate de que la ruta sea correcta
import '../styles/UserGuide.css';

interface Category {
  id: string;
  label: string;
  img: string;
  desc: string;
}

interface Module {
  title: string;
  icon: React.ReactNode;
  color: string;
  categories: Category[];
}

interface ContentStructure {
  [key: string]: Module;
}

const UserGuide: React.FC = () => {
  const [view, setView] = useState<'guide' | 'support'>('guide');
  const [activeMod, setActiveMod] = useState<string>('inicio');
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);

  const contentData: ContentStructure = {
    inicio: {
      title: 'Pantalla de Inicio',
      icon: <LayoutDashboard size={22} />,
      color: '#2dd4bf',
      categories: [
        { id: 'tasa', label: 'Tasa Actual', img: 'tasa.png', desc: 'Aquí se ajusta y actualiza la tasa de cambio.' },
        { id: 'conversor', label: 'Ingresos y Métricas', img: 'inicio1.png', desc: 'El total de los ingresos del día, el conversor de divisas para calculos rápidos, el stock crítico y el valor total del inventario.' },
        { id: 'valor', label: 'Cierre de Caja', img: 'cierre.png', desc: 'Genera un pdf con el resumen de las transacciones del día.' },
        { id: 'ingresos', label: 'Gráfico de Ingresos', img: 'inicio2.png', desc: 'Resumen gráfico del valor de las salidas en las ultimas 24 horas. Ranking de productos más vendidos.' }
      ]
    },
    inventario: {
      title: 'Inventario',
      icon: <Package size={22} />,
      color: '#3b82f6',
      categories: [
        { id: 'menu', label: 'Menú Principal', img: 'inventario.png', desc: 'Menú principal para gestionar el inventario. Antes de crear un nuevo producto, asegúrese de tener una categoría asignada.' },
        { id: 'categorias', label: 'Categorías', img: 'inventario5.png', desc: 'Aqui se crean y gestionan las categorías de productos. Cada producto pertenece a una categoría.' },
        { id: 'ingreso', label: 'Nuevo Ingreso', img: 'inventario2.png', desc: 'Formulario de entrada de nuevos productos. Ingrese el nombre, seleccione la categoría, asigne el precio y la cantidad.' },
        { id: 'ajuste', label: 'Ajuste de Stock', img: 'inventario3.png', desc: 'Busque y actualice la información de stock. Añadir o restar unidades.' },
        { id: 'catalogo', label: 'Catálogo', img: 'inventario4.png', desc: 'Vista completa de todos los productos.' },
        { id: 'depurar', label: 'Eliminar Productos', img: 'inventario6.png', desc: 'Busca el producto que desea eliminar y confirma la acción.' }
      ]
    },
    salidas: {
      title: 'Salidas',
      icon: <ShoppingCart size={22} />,
      color: '#8b5cf6',
      categories: [
        { id: 'menu', label: 'Menú de Salidas', img: 'salidas1.png', desc: 'Menú principal para gestionar las salidas de inventario.' },
        { id: 'nueva', label: 'Nueva Salida', img: 'salidas2.png', desc: 'Procesamiento de salidas de inventario. Gestione el producto que salio y la cantidad.' },
        { id: 'historial', label: 'Historial', img: 'salidas3.png', desc: 'Consulta de movimientos anteriores.' }
      ]
    },
    analiticas: {
      title: 'Analíticas',
      icon: <BarChart3 size={22} />,
      color: '#ec4899',
      categories: [
        { id: 'semanal', label: 'Reporte Semanal', img: 'reporte1.png', desc: 'Revise los movimientos y descargue un PDF con la información.' },
        { id: 'mensual', label: 'Reporte Mensual', img: 'reporte2.png', desc: 'Revise los movimientos y descargue un PDF con la información.' },
        { id: 'anual', label: 'Reporte Anual', img: 'reporte3.png', desc: 'Revise los movimientos y descargue un PDF con la información.' }
      ]
    }
  };

  const currentModule = contentData[activeMod];
  const currentCategory = currentModule.categories[activeCatIndex];

  const handleNextPage = () => {
    if (activeCatIndex < currentModule.categories.length - 1) {
      setActiveCatIndex(activeCatIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (activeCatIndex > 0) {
      setActiveCatIndex(activeCatIndex - 1);
    }
  };

  return (
    <div className="book-guide-wrapper">
      <div className="book-interface">
        <aside className="book-index">
          <div className="index-header">
            <BookOpen size={24} className="index-logo-icon" />
            <div>
              <h3>Mariu 3000</h3>
              <span>Manual de Usuario</span>
            </div>
          </div>

          <nav className="index-navigation">
            {Object.keys(contentData).map((key) => (
              <button
                key={key}
                onClick={() => { 
                  setView('guide'); 
                  setActiveMod(key); 
                  setActiveCatIndex(0); 
                }}
                className={`index-item ${view === 'guide' && activeMod === key ? 'active' : ''}`}
                style={{ '--accent': contentData[key].color } as React.CSSProperties}
              >
                <span className="index-icon">{contentData[key].icon}</span>
                <div className="index-text">
                  <span className="title">{contentData[key].title}</span>
                  <span className="pages">{contentData[key].categories.length} temas</span>
                </div>
              </button>
            ))}
          </nav>

          <div className="index-footer">
            <button 
              className={`support-trigger ${view === 'support' ? 'active-support' : ''}`} 
              onClick={() => setView('support')}
            >
              <HelpIcon size={18} />
              Solicitar Soporte
            </button>
          </div>
        </aside>

        <main className="book-content">
          {view === 'guide' ? (
            <>
              <header className="page-header">
                <div className="page-info">
                  <span className="chapter-label">{currentModule.title}</span>
                  <h2 className="page-title">{currentCategory.label}</h2>
                </div>
                <div className="pagination-top">
                  {activeCatIndex + 1} / {currentModule.categories.length}
                </div>
              </header>

              <div className="page-body">
                <div className="visual-container">
                  <div className="image-deck">
                    <img 
                      src={`/manual/${currentCategory.img}`} 
                      alt={currentCategory.label}
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/1200x800/1e293b/475569?text=Vista+de+Sistema";
                      }}
                    />
                  </div>
                </div>

                <div className="text-container">
                  <div className="content-block">
                    <div className="block-head"><Info size={18} /> Instrucciones</div>
                    <p>{currentCategory.desc}</p>
                  </div>

                  <div className="content-block tip">
                    <div className="block-head"><Lightbulb size={18} /> Tip Mariu</div>
                    <p>Verifica que los datos coincidan con los reportes físicos antes de confirmar operaciones.</p>
                  </div>

                  <div className="action-badges">
                    <span className="badge">Auditado</span>
                    <span className="badge">Admin Only</span>
                  </div>
                </div>
              </div>

              <footer className="page-footer">
                <button 
                  className="nav-arrow" 
                  onClick={handlePrevPage} 
                  disabled={activeCatIndex === 0}
                >
                  <ChevronLeft size={24} />
                </button>
                
                <div className="footer-meta">
                  <Activity size={14} /> Suministros Mariu 3000 C.A - 2026
                </div>

                <button 
                  className="nav-arrow" 
                  onClick={handleNextPage} 
                  disabled={activeCatIndex === currentModule.categories.length - 1}
                >
                  <ChevronRight size={24} />
                </button>
              </footer>
            </>
          ) : (
            <UserSupport />
          )}
        </main>
      </div>
    </div>
  );
};

export default UserGuide;