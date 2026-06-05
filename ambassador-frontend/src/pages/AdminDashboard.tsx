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

interface NotificationRow {
  id: number;
  email?: string;
  actividad?: string;
  message: string;
  reason?: string;
  read_at?: string | null;
  created_at: string;
}

interface CourseRow {
  id: number;
  title: string;
  description?: string;
  cost_points: number;
  provider?: string;
  redeemed?: boolean;
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<'actividades' | 'usuarios' | 'puntos' | 'cursos' | 'buzon'>('actividades');
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [usuarios, setUsuarios] = useState<UserRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    cost_points: 80,
    provider: 'Embajadores'
  });
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

    const notificationsRes = await api.get('/users/notifications', { headers });
    setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);

    const coursesRes = await api.get('/courses', { headers });
    setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
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

  const markRead = async (id: number) => {
    await api.put(`/users/notifications/${id}/read`, {}, { headers });
    cargar();
  };

  const createCourse = async () => {
    await api.post('/courses', courseForm, { headers });
    setNotice('Curso agregado para embajadores.');
    setCourseForm({ title: '', description: '', cost_points: 80, provider: 'Embajadores' });
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
        <button className={tab === 'cursos' ? 'active' : ''} onClick={() => setTab('cursos')}>Cursos</button>
        <button className={tab === 'buzon' ? 'active' : ''} onClick={() => setTab('buzon')}>Buzon</button>
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

      {tab === 'cursos' && (
        <div className="section-card">
          <h2>Agregar cursos para embajadores</h2>
          <p className="muted">Admin y coordinador pueden publicar cursos canjeables con puntos.</p>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <input className="auth-input" placeholder="Titulo del curso" value={courseForm.title} onChange={event => setCourseForm(prev => ({ ...prev, title: event.target.value }))} />
            <input className="auth-input" placeholder="Proveedor" value={courseForm.provider} onChange={event => setCourseForm(prev => ({ ...prev, provider: event.target.value }))} />
            <input className="auth-input" type="number" placeholder="Costo en puntos" value={courseForm.cost_points} onChange={event => setCourseForm(prev => ({ ...prev, cost_points: Number(event.target.value) }))} />
            <button className="btn-primary" onClick={createCourse}>Agregar curso</button>
          </div>
          <textarea className="auth-input text-area" style={{ marginTop: 12 }} placeholder="Descripcion del curso" value={courseForm.description} onChange={event => setCourseForm(prev => ({ ...prev, description: event.target.value }))} />

          <div className="course-grid">
            {courses.length === 0 ? <p className="muted">Aun no hay cursos publicados.</p> : courses.map(course => (
              <article key={course.id} className="course-card">
                <span className="badge-soft">{course.provider || 'Embajadores'}</span>
                <h3>{course.title}</h3>
                <p>{course.description || 'Sin descripcion.'}</p>
                <strong>{course.cost_points} pts</strong>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'buzon' && (
        <div className="section-card">
          <h2>Buzon de coordinacion</h2>
          <p className="muted">Avisos de embajadores que se desinscriben de actividades.</p>
          <div className="notification-list">
            {notifications.length === 0 ? <p className="muted">No hay avisos pendientes.</p> : notifications.map(item => (
              <div key={item.id} className={`notification-item ${item.read_at ? 'read' : ''}`}>
                <div>
                  <strong>{item.email || 'Embajador'} · {item.actividad || 'Actividad'}</strong>
                  <p>{item.message}</p>
                  <small>Motivo: {item.reason || '-'} · {new Date(item.created_at).toLocaleString()}</small>
                </div>
                {!item.read_at && <button className="btn-secondary-light" onClick={() => markRead(item.id)}>Marcar leido</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
