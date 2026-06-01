import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  const API_URL = 'http://localhost:3000/api/actividades';
  // Recuperamos el token para las peticiones protegidas
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. LEER (Read)
  const [error, setError] = useState<string | null>(null);

  const cargarActividades = async () => {
    try {
        const res = await axios.get(API_URL, { headers });
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
        await axios.put(`${API_URL}/${editandoId}`, { nombre, descripcion, puntos }, { headers });
        setEditandoId(null);
      } else {
        // Crear
        await axios.post(API_URL, { nombre, descripcion, puntos }, { headers });
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
        await axios.delete(`${API_URL}/${id}`, { headers });
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
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', marginTop: '20px' }}>
      <h2>🛡️ Panel de Gestión de Actividades (CRUD)</h2>
      
      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
        <input type="text" placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
        <input type="number" placeholder="Puntos" value={puntos} onChange={e => setPuntos(Number(e.target.value))} required />
        <button type="submit" style={{ background: editandoId ? '#f1c40f' : '#2ecc71', color: '#fff', border: 'none', padding: '8px 15px', cursor: 'pointer' }}>
          {editandoId ? 'Actualizar' : 'Crear Actividad'}
        </button>
        {editandoId && <button onClick={() => { setEditandoId(null); setNombre(''); setDescripcion(''); }}>Cancelar</button>}
      </form>

      {/* Tabla de Datos */}
      {error && <div style={{ marginBottom: '10px', color: '#c0392b' }}>{error}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ background: '#eee', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Puntos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {actividades.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                No se encontraron actividades.
              </td>
            </tr>
          ) : actividades.map(act => (
            <tr key={act.id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '10px' }}>{act.id}</td>
              <td>{act.nombre ?? act.titulo ?? '-'}</td>
              <td>{act.descripcion ?? '-'}</td>
              <td><span style={{ background: '#e1f5fe', padding: '3px 8px', borderRadius: '5px' }}>{(act.puntos ?? act.puntos_otorgados ?? 0)} pts</span></td>
              <td>
                <button onClick={() => empezarEdicion(act)} style={{ marginRight: '5px', background: '#3498db', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Editar</button>
                <button onClick={() => handleEliminar(act.id)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}