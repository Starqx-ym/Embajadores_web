import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  // Si no hay token guardado, redirige de inmediato al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si la ruta pide roles específicos y el usuario no los tiene, bloquea el paso
  if (allowedRoles) {
    const normalized = allowedRoles.map(r => String(r).toLowerCase());
    const userRole = user && user.role ? String(user.role).toLowerCase() : undefined;
    if (!userRole || !normalized.some(r => userRole === r || userRole.includes(r) || r.includes(userRole))) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Si pasa los controles, renderiza la subruta del enrutador
  return <Outlet />;
}