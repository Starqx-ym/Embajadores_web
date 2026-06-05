import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import ServerError from './pages/ServerError';
import ActivitiesView from './pages/ActivitiesView';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/server-error" element={<ServerError />} />
        {/* Redirigir la raíz de la web automáticamente al Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* 🔓 RUTAS PÚBLICAS: Cualquiera puede entrar sin estar logueado */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 🔒 RUTAS PRIVADAS Y PROTEGIDAS (Hito del 80%) */}
        {/* Si un usuario intenta escribir manualmente /dashboard en la URL sin token, 
            este componente lo interceptará y lo expulsará de inmediato al /login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="actividades" replace />} />
            <Route path="actividades" element={<ActivitiesView />} />
            <Route path="profile" element={<Profile />} />
            <Route element={<ProtectedRoute allowedRoles={["admin", "coordinador"]} />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>
        
        {/* Capturar cualquier otra ruta como error 404 visual */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
