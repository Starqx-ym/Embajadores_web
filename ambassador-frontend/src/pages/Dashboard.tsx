import React from 'react';
import { useNavigate } from 'react-router-dom';
import ActividadesCRUD from '../components/ActividadesCRUD'; // <-- Importa el componente

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f5f6fa', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Bienvenido al Dashboard</h1>
          <p>Usuario activo: <strong>{user.email}</strong> | Rol: <span style={{ textTransform: 'uppercase' }}>{user.role}</span></p>
        </div>
        <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </div>

      {/* 🌟 AQUÍ SE RENDERIZA TU CRUD COMPLETO CON LA TABLA Y BOTONES */}
      <ActividadesCRUD /> 
    </div>
  );
}