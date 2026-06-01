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
  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si pasa los controles, renderiza la subruta del enrutador
  return <Outlet />;
}