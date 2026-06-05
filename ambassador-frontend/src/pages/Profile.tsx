import { useEffect, useState } from 'react';
import { Award, CalendarCheck, Trophy } from 'lucide-react';
import api from '../config/axiosConfig';

interface ProfileData {
  user?: {
    email: string;
    role: string;
    points: number;
  };
  enrollments: Array<{
    id: number;
    actividad_id: number;
    nombre: string;
    descripcion: string;
    puntos: number;
    status: string;
    enrolled_at: string;
  }>;
}

interface RankingUser {
  id: number;
  email: string;
  points: number;
}

export default function Profile() {
  const userRaw = localStorage.getItem('user');
  const fallbackUser = userRaw ? JSON.parse(userRaw) : { email: '-', role: '-' };
  const [profile, setProfile] = useState<ProfileData>({ enrollments: [] });
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    Promise.all([
      api.get('/users/me', { headers }),
      api.get('/users/ranking', { headers })
    ]).then(([profileRes, rankingRes]) => {
      setProfile({ user: profileRes.data.user, enrollments: profileRes.data.enrollments || [] });
      setRanking(Array.isArray(rankingRes.data) ? rankingRes.data : []);
    }).catch(console.error);
  }, []);

  const user = profile.user || fallbackUser;
  const position = ranking.findIndex(item => item.email === user.email) + 1;

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div className="profile-avatar"><Award size={42} /></div>
        <div className="profile-info">
          <p>{user.role}</p>
          <h2>{user.email}</h2>
          <span>Perfil actualizado con inscripciones y puntos reales.</span>
        </div>
      </section>

      <div className="profile-stats">
        <div className="profile-stat-card"><Award size={22} /><h3>Puntos</h3><p>{user.points ?? 0} pts</p></div>
        <div className="profile-stat-card"><CalendarCheck size={22} /><h3>Inscripciones</h3><p>{profile.enrollments.length}</p></div>
        <div className="profile-stat-card"><Trophy size={22} /><h3>Ranking</h3><p>{position > 0 ? `#${position}` : '--'}</p></div>
      </div>

      <div className="profile-grid">
        <div className="section-card">
          <h3>Actividades inscritas</h3>
          <div className="history-list">
            {profile.enrollments.length > 0 ? profile.enrollments.map(item => (
              <div key={item.id} className="history-item">
                <div>
                  <strong>{item.nombre}</strong>
                  <small>{new Date(item.enrolled_at).toLocaleDateString()} · {item.status}</small>
                </div>
                <span>{item.puntos} pts</span>
              </div>
            )) : <p className="muted">Aun no te has inscrito a ninguna actividad.</p>}
          </div>
        </div>

        <div className="section-card">
          <h3>Ranking de embajadores</h3>
          <div className="ranking-list">
            {ranking.slice(0, 8).map((item, index) => (
              <div key={item.id} className="ranking-row">
                <span>{index + 1}</span>
                <div>
                  <strong>{item.email}</strong>
                  <small>{item.points} pts</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
