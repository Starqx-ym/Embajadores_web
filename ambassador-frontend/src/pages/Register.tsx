import React, { useState } from 'react';
import axios from 'axios';
import api from '../config/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post('/auth/register', { email, password });
      if (res.status === 201) {
        setMessage({ text: '✅ ¡Registro exitoso! Redirigiendo al login...', isError: false });
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err: any) {
      // Si el interceptor captura un 5xx o fallo de red, redirigirá a /server-error.
      const errorMsg = err.response?.data?.error || err.message || 'Error al procesar el registro.';
      setMessage({ text: `❌ ${errorMsg}`, isError: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <UserPlus size={40} color="#10b981" style={{ margin: '0 auto' }} />
        <h2 className="auth-title">Crear Cuenta</h2>
        
        <form onSubmit={handleRegister} className="auth-form">
          <label className="auth-label">Email Institucional</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="auth-input" placeholder="ejemplo@universidad.edu" required />
          
          <label className="auth-label">Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="auth-input" placeholder="Mínimo 6 caracteres" required />
          
          <button type="submit" className="btn-green">Registrar</button>
        </form>

        {message && (
          <div className={message.isError ? 'alert-error' : 'alert-success'}>
            {message.isError ? <AlertCircle size={16} style={{ flexShrink: 0 }} /> : <CheckCircle size={16} style={{ flexShrink: 0 }} />}
            <span>{message.text}</span>
          </div>
        )}
        
        <p className="auth-link-text">
          ¿Ya tienes cuenta? <Link to="/login" className="auth-link">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}