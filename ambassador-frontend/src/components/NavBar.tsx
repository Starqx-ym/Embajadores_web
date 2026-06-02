import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const currentPath = window.location.pathname;
  const activeClass = (path: string) => currentPath.includes(path) ? 'active' : '';

  return (
    <header className="dashboard-navbar">
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>Portal Embajadores</div>
        <nav className="dashboard-nav">
          <button className={activeClass('/dashboard/actividades')} onClick={() => navigate('/dashboard/actividades')}>Actividades</button>
          <button className={activeClass('/dashboard/profile')} onClick={() => navigate('/dashboard/profile')}>Perfil</button>
          {user && !String(user.role).toLowerCase().includes('embajador') && (
            <button className={activeClass('/dashboard/admin')} onClick={() => navigate('/dashboard/admin')}>Admin</button>
          )}
        </nav>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>{user?.email ?? 'Invitado'}</div>
          <div style={{ fontSize: 12 }}>{user?.role ?? ''}</div>
        </div>
        <button onClick={handleLogout} className="btn-primary" style={{ padding: '9px 18px' }}>Salir</button>
      </div>
    </header>
  );
}
