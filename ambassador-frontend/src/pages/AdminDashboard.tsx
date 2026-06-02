import { useEffect, useState } from 'react';
import api from '../config/axiosConfig';
import ActividadesCRUD from '../components/ActividadesCRUD';

interface Actividad {
  id: number;
  nombre?: string;
  descripcion?: string;
  puntos?: number;
  puntos_otorgados?: number;
  cupos_disponibles?: number;
}

export default function AdminDashboard() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const cargarActividades = async () => {
    setLoading(true);
    try {
      const res = await api.get('/actividades', { headers });
      setActividades(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error('Error cargando métricas de actividades', error);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarActividades(); }, []);

  const totalActividades = actividades.length;
  const actividadesConCupo = actividades.filter(a => (a.cupos_disponibles ?? 0) > 0).length;
  const promedioPuntos = actividades.length > 0
    ? Math.round((actividades.reduce((sum, act) => sum + (act.puntos ?? act.puntos_otorgados ?? 0), 0)) / actividades.length)
    : 0;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div className="card-grid">
        <div className="metric-card">
          <h3>Total de actividades</h3>
          <p>{loading ? 'Cargando...' : totalActividades}</p>
        </div>
        <div className="metric-card">
          <h3>Cupos disponibles</h3>
          <p>{loading ? 'Cargando...' : actividadesConCupo}</p>
        </div>
        <div className="metric-card">
          <h3>Puntos promedio</h3>
          <p>{loading ? 'Cargando...' : `${promedioPuntos} pts`}</p>
        </div>
      </div>

      <div className="section-card">
        <h3>Gestionar actividades</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 18 }}>Edita, crea o elimina actividades desde esta interfaz.</p>
        <ActividadesCRUD />
      </div>
    </div>
  );
}
