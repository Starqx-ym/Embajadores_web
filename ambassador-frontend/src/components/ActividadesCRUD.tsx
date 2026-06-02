import React, { useState, useEffect } from 'react';
import api from '../config/axiosConfig';

interface Actividad {
  id: number;
  nombre?: string;
  titulo?: string;
  descripcion?: string;
  puntos?: number;
  puntos_otorgados?: number;
}

export default function ActividadesCRUD() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [puntos, setPuntos] = useState(10);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const API_URL = '/actividades';
  // Recuperamos el token para las peticiones protegidas
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. LEER (Read)
  const [error, setError] = useState<string | null>(null);

  const cargarActividades = async () => {
    try {
        const res = await api.get(API_URL, { headers });
        console.log("Datos recibidos del GET:", res.data);
        setError(null);

        if (Array.isArray(res.data)) {
          setActividades(res.data);
        } else if (res.data && Array.isArray(res.data.data)) {
          setActividades(res.data.data);
        } else {
          setActividades([]);
        }
    } catch (err: any) {
        const message = err?.response?.data?.error || err.message || 'Error desconocido';
        console.error("Error al cargar actividades", message);
        setError(`No se pudieron cargar actividades: ${message}`);
        setActividades([]);
    }
  };

  useEffect(() => { cargarActividades(); }, []);

  // 2. CREAR Y ACTUALIZAR (Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editandoId) {
        // Actualizar
        await api.put(`${API_URL}/${editandoId}`, { nombre, descripcion, puntos }, { headers });
        setEditandoId(null);
      } else {
        // Crear
        await api.post(API_URL, { nombre, descripcion, puntos }, { headers });
      }
      setNombre(''); setDescripcion(''); setPuntos(10);
      cargarActividades();
    } catch (err) {
      alert("No tienes permisos o el servidor falló");
    }
  };

  // 3. ELIMINAR (Delete)
  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Seguro que deseas eliminar esta actividad?')) {
      try {
        await api.delete(`${API_URL}/${id}`, { headers });
        cargarActividades();
      } catch (err) {
        alert("Error al eliminar. Verifica tus permisos.");
      }
    }
  };

  const empezarEdicion = (act: Actividad) => {
    setEditandoId(act.id);
    setNombre(act.nombre ?? act.titulo ?? '');
    setDescripcion(act.descripcion ?? '');
    setPuntos(act.puntos ?? act.puntos_otorgados ?? 10);
  };

  return (
    <div className="section-card" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Panel de Gestión de Actividades</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>Crea, edita y elimina actividades desde un panel moderno.</p>
        </div>
        <button className="btn-primary" type="submit" form="actividad-form" style={{ width: 'auto', padding: '11px 22px' }}>
          {editandoId ? 'Actualizar' : 'Crear Actividad'}
        </button>
      </div>

      <form id="actividad-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '14px', marginTop: 22 }}>
        <input className="auth-input" type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <input className="auth-input" type="text" placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
        <input className="auth-input" type="number" placeholder="Puntos" value={puntos} onChange={e => setPuntos(Number(e.target.value))} required />
        {editandoId && (
          <button type="button" className="btn-primary" style={{ background: '#9ca3af', width: '100%' }} onClick={() => { setEditandoId(null); setNombre(''); setDescripcion(''); }}>
            Cancelar
          </button>
        )}
      </form>

      {error && <div style={{ marginTop: 18, color: '#c0392b' }}>{error}</div>}

      <div className="table-card" style={{ marginTop: 24 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Puntos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                  No se encontraron actividades.
                </td>
              </tr>
            ) : actividades.map(act => (
              <tr key={act.id}>
                <td>{act.id}</td>
                <td>{act.nombre ?? act.titulo ?? '-'}</td>
                <td>{act.descripcion ?? '-'}</td>
                <td><span className="badge">{(act.puntos ?? act.puntos_otorgados ?? 0)} pts</span></td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-edit" onClick={() => empezarEdicion(act)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleEliminar(act.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tarjetas responsivas para móvil */}
        <div className="activities-cards">
          {actividades.map(act => (
            <div key={act.id} className="activity-card">
              <h4>{act.nombre ?? act.titulo ?? `Actividad ${act.id}`}</h4>
              <p>{act.descripcion ?? '-'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="badge">{(act.puntos ?? act.puntos_otorgados ?? 0)} pts</div>
                <div className="actions">
                  <button className="btn-edit" onClick={() => empezarEdicion(act)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleEliminar(act.id)}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}