import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function Dashboard() {
  const location = useLocation();
  const current = location.pathname.split('/').pop();

  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = user && !String(user.role).toLowerCase().includes('embajador');

  // Persistible: si el admin cierra el hero, guardamos la preferencia
  const [showHero, setShowHero] = useState<boolean>(() => {
    const dismissed = localStorage.getItem('dashboardHeroDismissed');
    return dismissed === '1' ? false : true;
  });

  const title = current === 'profile'
    ? 'Perfil'
    : current === 'admin'
      ? 'Gestión de actividades'
      : 'Actividades disponibles';

  const handleCloseHero = () => {
    setShowHero(false);
    localStorage.setItem('dashboardHeroDismissed', '1');
  };

  return (
    <div className="dashboard-shell" style={{ minHeight: '100vh' }}>
      <div className="dashboard-container">
        <NavBar />

        {/* Mostrar el hero SOLO a usuarios admin y si no lo han cerrado */}
        {isAdmin && showHero && (
          <div className="dashboard-hero">
            <button onClick={handleCloseHero} aria-label="Cerrar" style={{ position: 'absolute', right: 18, top: 18, background: 'transparent', border: 'none', fontSize: 28, cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            <div className="dashboard-hero-main">
              <div style={{ maxWidth: 720 }}>
                <p style={{ margin: 0, color: 'var(--morado)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Bienvenido</p>
                <h1>Administra actividades, rankings y beneficios con estilo.</h1>
                <p>Disfruta de un panel moderno para embajadores, con navegación clara y un flujo de trabajo más profesional.</p>
              </div>
              <div style={{ position: 'absolute', right: -60, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
              <div style={{ position: 'absolute', left: -80, bottom: -50, width: 240, height: 240, borderRadius: '50%', background: 'rgba(124,58,237,0.14)' }} />
            </div>
            {/* Removed metric cards for a cleaner full-screen hero */}
          </div>
        )}

        <section className="section-card section-plain" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>Sección actual: {title}</h3>
          <div style={{ marginTop: 18 }}>
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}