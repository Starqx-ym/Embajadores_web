import { useEffect, useMemo, useState } from 'react';
import { Activity, Medal, Users } from 'lucide-react';
import api from '../config/axiosConfig';
import ActividadesCRUD from '../components/ActividadesCRUD';

interface Actividad {
  id: number;
  nombre?: string;
  titulo?: string;
  puntos?: number;
  puntos_otorgados?: number;
  cupos_disponibles?: number;
}

interface UserRow {
  id: number;
  email: string;
  role: string;
  points: number;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'actividades' | 'usuarios' | 'puntos'>('actividades');
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [usuarios, setUsuarios] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [points, setPoints] = useState(10);
  const [notice, setNotice] = useState<string | null>(null);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const userRaw = localStorage.getItem('user');
  const currentUser = userRaw ? JSON.parse(userRaw) : null;
  const role = String(currentUser?.role || '').toLowerCase();
  const isAdmin = role.includes('admin');

  const cargar = async () => {
    const activitiesRes = await api.get('/actividades', { headers });
    const activityRows = Array.isArray(activitiesRes.data) ? activitiesRes.data : (activitiesRes.data.data || []);
    setActividades(activityRows);

    if (isAdmin) {
      const usersRes = await api.get('/users', { headers });
      setUsuarios(Array.isArray(usersRes.data) ? usersRes.data : []);
    } else {
      const rankingRes = await api.get('/users/ranking', { headers });
      setUsuarios(Array.isArray(rankingRes.data) ? rankingRes.data : []);
    }
  };

  useEffect(() => { cargar().catch(console.error); }, []);

  const metrics = useMemo(() => {
    const totalPoints = actividades.reduce((sum, item) => sum + (item.puntos ?? item.puntos_otorgados ?? 0), 0);
    return {
      actividades: actividades.length,
      cupos: actividades.reduce((sum, item) => sum + (item.cupos_disponibles ?? 0), 0),
      promedio: actividades.length ? Math.round(totalPoints / actividades.length) : 0
    };
  }, [actividades]);

  const updateRole = async (id: number, newRole: string) => {
    await api.put(`/users/${id}/role`, { role: newRole }, { headers });
    setNotice('Rol actualizado.');
    cargar();
  };

  const awardPoints = async () => {
    if (!selectedUser) return;
    await api.post(`/users/${selectedUser}/points`, { points }, { headers });
    setNotice('Puntos asignados correctamente.');
    setPoints(10);
    cargar();
  };

  return (
    <div className="admin-page">
      <div className="card-grid">
        <div className="metric-card"><Activity size={22} /><h3>Actividades</h3><p>{metrics.actividades}</p></div>
        <div className="metric-card"><Users size={22} /><h3>Cupos totales</h3><p>{metrics.cupos}</p></div>
        <div className="metric-card"><Medal size={22} /><h3>Puntos promedio</h3><p>{metrics.promedio}</p></div>
      </div>

      <div className="tabs">
        <button className={tab === 'actividades' ? 'active' : ''} onClick={() => setTab('actividades')}>Actividades</button>
        {isAdmin && <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => setTab('usuarios')}>Usuarios</button>}
        <button className={tab === 'puntos' ? 'active' : ''} onClick={() => setTab('puntos')}>Puntos</button>
      </div>

      {notice && <div className="status-note">{notice}</div>}

      {tab === 'actividades' && (
        <div className="section-card">
          <div className="toolbar">
            <div>
              <h2>CRUD de actividades</h2>
              <p>Admin y coordinador pueden crear, editar y ajustar cupos/puntos.</p>
            </div>
          </div>
          <ActividadesCRUD onChanged={cargar} />
        </div>
      )}

      {tab === 'usuarios' && isAdmin && (
        <div className="table-card">
          <h2>Gestion de usuarios</h2>
          <table>
            <thead>
              <tr><th>ID</th><th>Email</th><th>Rol</th><th>Puntos</th><th>Accion</th></tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td><span className="badge">{user.role}</span></td>
                  <td>{user.points}</td>
                  <td>
                    <select className="auth-input compact-input" value={user.role} onChange={event => updateRole(user.id, event.target.value)}>
                      <option value="embajador">Embajador</option>
                      <option value="coordinador">Coordinador</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'puntos' && (
        <div className="section-card">
          <h2>Asignar puntos a embajadores</h2>
          <p className="muted">Coordinador y admin pueden reconocer participacion sumando puntos.</p>
          <div className="inline-form">
            <select className="auth-input" value={selectedUser} onChange={event => setSelectedUser(event.target.value)}>
              <option value="">Selecciona embajador</option>
              {usuarios.filter(user => user.role === 'embajador').map(user => (
                <option key={user.id} value={user.id}>{user.email} - {user.points} pts</option>
              ))}
            </select>
            <input className="auth-input" type="number" value={points} onChange={event => setPoints(Number(event.target.value))} />
            <button className="btn-primary" onClick={awardPoints}>Asignar</button>
          </div>
        </div>
      )}
    </div>
  );
}
