import React from 'react';

export default function Profile() {
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : { email: '-', role: '-' };

  const enrolled = JSON.parse(localStorage.getItem('enrolledActivities') || '[]') as number[];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar" />
        <div className="profile-info">
          <p style={{ margin: 0, textTransform: 'uppercase', color: 'var(--morado)', fontWeight: 700, letterSpacing: '0.12em' }}>Embajador</p>
          <h2>{user.email}</h2>
          <p style={{ margin: '10px 0 0', color: 'var(--muted)' }}>Rol: {user.role}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat-card">
          <div>
            <h3>Puntos</h3>
            <p>-- pts</p>
          </div>
        </div>
        <div className="profile-stat-card">
          <div>
            <h3>Inscripciones</h3>
            <p>{enrolled.length}</p>
          </div>
        </div>
        <div className="profile-stat-card">
          <div>
            <h3>Beneficios</h3>
            <p>Activos</p>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="section-card">
          <h3>Actividades inscritas</h3>
          <p style={{ color: 'var(--muted)', margin: '12px 0 18px' }}>Aquí verás las actividades en las que estás inscrito.</p>
          {enrolled.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {enrolled.map(id => (
                <span key={id} className="activity-pill">Actividad #{id}</span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--muted)' }}>Aún no te has inscrito a ninguna actividad.</p>
          )}
        </div>

        <div className="section-card">
          <h3>Beneficios y premios</h3>
          <p style={{ color: 'var(--muted)' }}>Gana recompensas al completar actividades. Tu perfil se actualiza con puntos y beneficios.</p>
        </div>
      </div>

      <div className="section-card">
        <h3>Rankings</h3>
        <p style={{ color: 'var(--muted)' }}>Próximamente podrás comparar tu desempeño con otros embajadores.</p>
      </div>
    </div>
  );
}
