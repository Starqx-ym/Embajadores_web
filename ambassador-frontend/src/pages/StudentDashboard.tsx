import { useEffect, useState } from 'react';
import api from '../config/axiosConfig';

interface Actividad {
  id: number;
  nombre?: string;
  titulo?: string;
  descripcion?: string;
  puntos?: number;
  puntos_otorgados?: number;
  cupos_disponibles?: number;
}

export default function StudentDashboard() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/actividades', { headers });
      setActividades(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) {
      console.error('Error cargando actividades', err);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const saveEnrollment = (id: number) => {
    const existing = JSON.parse(localStorage.getItem('enrolledActivities') || '[]') as number[];
    if (!existing.includes(id)) {
      existing.push(id);
      localStorage.setItem('enrolledActivities', JSON.stringify(existing));
    }
  };

  const handleInscribir = async (id: number) => {
    try {
      await api.post(`/actividades/${id}/inscribir`, {}, { headers });
      saveEnrollment(id);
      alert('Inscripción confirmada.');
      cargar();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Error al inscribir';
      alert(msg);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: 'var(--morado)', marginBottom: 12 }}>Actividades disponibles</h2>
      {loading ? <div>Cargando...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          {actividades.length === 0 ? (
            <div style={{ padding: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>No hay actividades disponibles.</div>
          ) : actividades.map(act => (
            <div key={act.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--celeste-dark)' }}>{act.nombre ?? act.titulo}</h3>
              <p style={{ color: 'var(--muted)' }}>{act.descripcion}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--morado-dark)' }}>{(act.puntos ?? act.puntos_otorgados ?? 0)} pts</div>
                <div style={{ color: 'var(--muted)' }}>Cupos: {act.cupos_disponibles ?? 'N/A'}</div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleInscribir(act.id)}
                  disabled={(act.cupos_disponibles ?? 0) <= 0}
                  style={{ flex: 1, background: 'linear-gradient(90deg,var(--celeste),var(--morado))', color: 'white', border: 'none', padding: '10px 12px', borderRadius: 8, cursor: 'pointer' }}
                >
                  Inscribirse
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
