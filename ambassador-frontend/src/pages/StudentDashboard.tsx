import { useEffect, useMemo, useState } from 'react';
import { Clock, Trophy } from 'lucide-react';
import api from '../config/axiosConfig';

interface Actividad {
  id: number;
  nombre?: string;
  titulo?: string;
  descripcion?: string;
  puntos?: number;
  puntos_otorgados?: number;
  cupos_disponibles?: number;
  fecha_evento?: string;
  estado?: string;
}

interface Enrollment {
  actividad_id: number;
}

interface RankingUser {
  id: number;
  email: string;
  points: number;
}

export default function StudentDashboard() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [unsubscribeId, setUnsubscribeId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const enrolledIds = useMemo(() => new Set(enrollments.map(item => item.actividad_id)), [enrollments]);

  const cargar = async () => {
    setLoading(true);
    try {
      const [activitiesRes, profileRes, rankingRes] = await Promise.all([
        api.get('/actividades', { headers }),
        api.get('/users/me', { headers }),
        api.get('/users/ranking', { headers })
      ]);

      setActividades(Array.isArray(activitiesRes.data) ? activitiesRes.data : (activitiesRes.data.data || []));
      setEnrollments(profileRes.data?.enrollments || []);
      setRanking(Array.isArray(rankingRes.data) ? rankingRes.data : []);
    } catch (err) {
      console.error('Error cargando panel de actividades', err);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleInscribir = async (id: number) => {
    try {
      await api.post(`/actividades/${id}/inscribir`, {}, { headers });
      setMessage('Inscripcion confirmada. La actividad ya aparece en tu historial.');
      cargar();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Error al inscribir';
      setMessage(msg);
    }
  };

  const handleDesinscribir = async () => {
    if (!unsubscribeId) return;

    try {
      await api.post(`/actividades/${unsubscribeId}/desinscribir`, { reason }, { headers });
      setMessage('Desinscripcion enviada. El coordinador recibira el aviso en su buzon.');
      setUnsubscribeId(null);
      setReason('');
      cargar();
    } catch (err: any) {
      setMessage(err?.response?.data?.error || 'No se pudo registrar la desinscripcion.');
    }
  };

  return (
    <div className="content-grid">
      <section className="panel-span">
        <div className="toolbar">
          <div>
            <h2>Catalogo de actividades</h2>
            <p>Consulta cupos, puntos e inscribete sin entrar al modo de administracion.</p>
          </div>
          {message && <span className="status-note">{message}</span>}
        </div>

        {loading ? <div className="empty-state">Cargando actividades...</div> : (
          <div className="activity-grid">
            {actividades.length === 0 ? (
              <div className="empty-state">No hay actividades disponibles.</div>
            ) : actividades.map(act => {
              const points = act.puntos ?? act.puntos_otorgados ?? 0;
              const cupos = act.cupos_disponibles ?? 0;
              const enrolled = enrolledIds.has(act.id);

              return (
                <article key={act.id} className="activity-card-pro">
                  <div className="activity-card-top">
                    <span className="badge-soft">{act.estado ?? 'activo'}</span>
                    <strong>{points} pts</strong>
                  </div>
                  <h3>{act.nombre ?? act.titulo ?? `Actividad ${act.id}`}</h3>
                  <p>{act.descripcion || 'Sin descripcion registrada.'}</p>
                  <div className="activity-meta">
                    <span><Clock size={15} /> {act.fecha_evento ? new Date(act.fecha_evento).toLocaleDateString() : 'Fecha por definir'}</span>
                    <span>Cupos: {cupos}</span>
                  </div>
                  {enrolled ? (
                    <button className="btn-secondary-light" onClick={() => setUnsubscribeId(act.id)}>
                      Desinscribirse
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => handleInscribir(act.id)}
                      disabled={cupos <= 0}
                    >
                      Inscribirse
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="side-panel">
        <div className="panel-title">
          <Trophy size={19} />
          <h2>Ranking</h2>
        </div>
        <div className="ranking-list">
          {ranking.length === 0 ? <p className="muted">Aun no hay ranking.</p> : ranking.slice(0, 6).map((user, index) => (
            <div key={user.id} className="ranking-row">
              <span>{index + 1}</span>
              <div>
                <strong>{user.email}</strong>
                <small>{user.points} pts</small>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {unsubscribeId && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Motivo de desinscripcion</h2>
            <p className="muted">Este motivo llegara al buzon del coordinador.</p>
            <textarea className="auth-input text-area" value={reason} onChange={event => setReason(event.target.value)} placeholder="Explica brevemente por que no podras asistir" />
            <div className="modal-actions">
              <button className="btn-secondary-light" onClick={() => { setUnsubscribeId(null); setReason(''); }}>Cancelar</button>
              <button className="btn-primary" onClick={handleDesinscribir}>Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
