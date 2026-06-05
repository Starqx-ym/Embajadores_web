import React, { useEffect, useState } from 'react';
import api from '../config/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard/actividades', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.status === 200 || response.data.token) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard/actividades', { replace: true });
      }
    } catch (error: any) {
      if (error.response) {
        setError(error.response.data?.error || 'Credenciales incorrectas');
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <LogIn size={40} color="#7c3aed" style={{ margin: '0 auto' }} />
        <h2 className="auth-title">Iniciar Sesion</h2>

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-label">Email Institucional</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" placeholder="ejemplo@universidad.edu" required />

          <label className="auth-label">Contrasena</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" placeholder="********" required />

          <button type="submit" className="btn-blue">Ingresar</button>
        </form>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> <span>{error}</span>
          </div>
        )}

        <p className="auth-link-text">
          No tienes cuenta? <Link to="/register" className="auth-link">Registrate aqui</Link>
        </p>
      </div>
    </div>
  );
}
