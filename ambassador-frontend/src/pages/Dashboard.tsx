import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function Dashboard() {
  const location = useLocation();
  const current = location.pathname.split('/').pop();
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  const title = current === 'profile'
    ? 'Perfil del embajador'
    : current === 'admin'
      ? 'Panel de administracion'
      : 'Actividades disponibles';

  return (
    <div className="dashboard-shell">
      <NavBar />
      <main className="dashboard-main">
        <div className="page-heading">
          <div>
            <p>{user?.role ?? 'Usuario'}</p>
            <h1>{title}</h1>
          </div>
          <span>{user?.email ?? ''}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
