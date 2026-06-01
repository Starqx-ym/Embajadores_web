import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card-max">
        <ShieldAlert size={56} color="#ef4444" style={{ margin: '0 auto' }} />
        <h2 className="auth-title" style={{ color: '#ef4444' }}>Error 404 - Recurso No Encontrado</h2>
        
        <p className="text-slate">
          El cliente solicitó una ruta inexistente en el clúster de navegación. El enrutador interceptó la petición en el cliente renderizando este componente de resguardo visual.
        </p>
        
        <button onClick={() => navigate('/login')} className="btn-blue" style={{ maxWidth: '200px', margin: '0 auto' }}>
          Volver al Portal
        </button>
      </div>
    </div>
  );
}