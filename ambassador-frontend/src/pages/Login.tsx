import React, { useState } from 'react';
import api from '../config/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const response = await api.post('/auth/login', { email, password });

        console.log("Respuesta del servidor:", response.data);

        if (response.status === 200 || response.data.token) {
          const { token, user } = response.data;

          // Guardar el token de forma síncrona en el navegador
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user)); 

          console.log("🔒 Token guardado en LocalStorage con éxito.");

          // Le damos un respiro de 100ms al navegador para asegurar que guardó el token
          // antes de obligar a React a cambiar de pantalla
          setTimeout(() => {
              navigate('/dashboard');
          }, 100);
      }
    } catch (error: any) {
      // Si el interceptor detecta un 5xx o error de red, redirigirá a /server-error.
      if (error.response) {
          console.error("Error desde el backend:", error.response.data?.error || error.response.statusText);
          setError(error.response.data?.error || 'Credenciales incorrectas');
      } else {
          console.error("Error de conexión:", error.message);
          setError('No se pudo conectar con el servidor.');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <LogIn size={40} color="#3b82f6" style={{ margin: '0 auto' }} />
        <h2 className="auth-title">Iniciar Sesión</h2>
        
        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-label">Email Institucional</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" placeholder="ejemplo@universidad.edu" required />
          
          <label className="auth-label">Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" placeholder="••••••••" required />
          
          <button type="submit" className="btn-blue">Ingresar</button>
        </form>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> <span>{error}</span>
          </div>
        )}
        
        <p className="auth-link-text">
          ¿No tienes cuenta? <Link to="/register" className="auth-link">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}