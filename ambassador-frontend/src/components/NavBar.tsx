import { Award, BookOpen, CalendarDays, LogOut, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NavBar() {
  const navigate = useNavigate();
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const currentPath = window.location.pathname;
  const canManage = user && !String(user.role).toLowerCase().includes('embajador');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const activeClass = (path: string) => currentPath.includes(path) ? 'active' : '';

  return (
    <header className="dashboard-navbar">
      <button className="brand-row brand-button" onClick={() => navigate('/dashboard/profile')} title="Ir al perfil">
        <div className="brand-mark"><Award size={20} /></div>
        <div>
          <div className="brand-title">Portal Embajadores</div>
          <div className="brand-subtitle">Actividades, puntos y ranking</div>
        </div>
      </button>

      <nav className="dashboard-nav">
        <button className={activeClass('/dashboard/actividades')} onClick={() => navigate('/dashboard/actividades')} title="Actividades">
          <CalendarDays size={17} /> Actividades
        </button>
        <button className={activeClass('/dashboard/profile')} onClick={() => navigate('/dashboard/profile')} title="Perfil">
          <User size={17} /> Perfil
        </button>
        <button className={activeClass('/dashboard/cursos')} onClick={() => navigate('/dashboard/cursos')} title="Cursos">
          <BookOpen size={17} /> Cursos
        </button>
        {canManage && (
          <button className={activeClass('/dashboard/admin')} onClick={() => navigate('/dashboard/admin')} title="Administracion">
            <Shield size={17} /> Admin
          </button>
        )}
      </nav>

      <div className="user-cluster">
        <div className="user-chip">
          <div className="user-email">{user?.email ?? 'Invitado'}</div>
          <div className="user-role">{user?.role ?? ''}</div>
        </div>
        <button onClick={handleLogout} className="icon-button" title="Salir"><LogOut size={18} /></button>
      </div>
    </header>
  );
}
