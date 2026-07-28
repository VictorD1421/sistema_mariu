import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory/Inventory';
import Usuarios from './pages/Users';
import Auditoria from './pages/Audit';
import Sales from './pages/Sales/Sales';
import Reports from './pages/Reports/Reports';
import GeneralAdmin from './pages/Admin/GeneralAdmin';
import Config from './pages/Config/Config';
import UserGuide from './pages/UserGuide';
import UserSupport from './pages/UserSupport';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventario" element={<Inventory />} />
              <Route path="/ventas" element={<Sales/>} />
              <Route path="/manual-uso" element={<UserGuide />} />
              <Route path="/soporte" element={<UserSupport />} />
              <Route element={<ProtectedRoute allowedRoles={['SUPERUSER', 'ADMIN']} />}>
                <Route path="/auditoria" element={<Auditoria />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/administracion-general" element={<GeneralAdmin />} />
                <Route path="/configuraciones" element={<Config/>} />
                <Route path="/reportes" element={<Reports/>} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate replace to="/login" />} />
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;