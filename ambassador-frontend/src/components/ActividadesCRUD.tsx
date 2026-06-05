import React, { useEffect, useState } from 'react';
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

interface Props {
  onChanged?: () => void;
}

const emptyForm = {
  nombre: '',
  descripcion: '',
  puntos: 10,
  cupos_disponibles: 20,
  fecha_evento: '',
  estado: 'activo'
};

export default function ActividadesCRUD({ onChanged }: Props) {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const cargarActividades = async () => {
    try {
      const res = await api.get('/actividades', { headers });
      setError(null);
      setActividades(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || 'Error desconocido';
      setError(`No se pudieron cargar actividades: ${message}`);
      setActividades([]);
    }
  };

  useEffect(() => { cargarActividades(); }, []);

  const updateForm = (field: keyof typeof emptyForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditandoId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      titulo: form.nombre,
      puntos_otorgados: form.puntos,
      fecha_evento: form.fecha_evento || null
    };

    try {
      if (editandoId) {
        await api.put(`/actividades/${editandoId}`, payload, { headers });
      } else {
        await api.post('/actividades', payload, { headers });
      }
      resetForm();
      await cargarActividades();
      onChanged?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No tienes permisos o el servidor fallo.');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('Seguro que deseas eliminar esta actividad?')) return;

    try {
      await api.delete(`/actividades/${id}`, { headers });
      await cargarActividades();
      onChanged?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al eliminar. Verifica tus permisos.');
    }
  };

  const empezarEdicion = (act: Actividad) => {
    setEditandoId(act.id);
    setForm({
      nombre: act.nombre ?? act.titulo ?? '',
      descripcion: act.descripcion ?? '',
      puntos: act.puntos ?? act.puntos_otorgados ?? 10,
      cupos_disponibles: act.cupos_disponibles ?? 0,
      fecha_evento: act.fecha_evento ? act.fecha_evento.slice(0, 10) : '',
      estado: act.estado ?? 'activo'
    });
  };

  return (
    <div className="crud-layout">
      <form id="actividad-form" className="form-grid" onSubmit={handleSubmit}>
        <input className="auth-input" type="text" placeholder="Nombre" value={form.nombre} onChange={e => updateForm('nombre', e.target.value)} required />
        <input className="auth-input" type="text" placeholder="Descripcion" value={form.descripcion} onChange={e => updateForm('descripcion', e.target.value)} required />
        <input className="auth-input" type="number" placeholder="Puntos" value={form.puntos} onChange={e => updateForm('puntos', Number(e.target.value))} required />
        <input className="auth-input" type="number" placeholder="Cupos" value={form.cupos_disponibles} onChange={e => updateForm('cupos_disponibles', Number(e.target.value))} required />
        <input className="auth-input" type="date" value={form.fecha_evento} onChange={e => updateForm('fecha_evento', e.target.value)} />
        <select className="auth-input" value={form.estado} onChange={e => updateForm('estado', e.target.value)}>
          <option value="activo">Activo</option>
          <option value="pausado">Pausado</option>
          <option value="cerrado">Cerrado</option>
        </select>
        <button className="btn-primary" type="submit">{editandoId ? 'Actualizar' : 'Crear actividad'}</button>
        {editandoId && <button type="button" className="btn-secondary-light" onClick={resetForm}>Cancelar</button>}
      </form>

      {error && <div className="alert-inline">{error}</div>}

      <div className="table-card flat-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Actividad</th>
              <th>Puntos</th>
              <th>Cupos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.length === 0 ? (
              <tr><td colSpan={6} className="empty-cell">No se encontraron actividades.</td></tr>
            ) : actividades.map(act => (
              <tr key={act.id}>
                <td>{act.id}</td>
                <td>
                  <strong>{act.nombre ?? act.titulo ?? '-'}</strong>
                  <small>{act.descripcion ?? '-'}</small>
                </td>
                <td><span className="badge">{act.puntos ?? act.puntos_otorgados ?? 0} pts</span></td>
                <td>{act.cupos_disponibles ?? 0}</td>
                <td>{act.estado ?? 'activo'}</td>
                <td className="row-actions">
                  <button className="btn-edit" onClick={() => empezarEdicion(act)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleEliminar(act.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
