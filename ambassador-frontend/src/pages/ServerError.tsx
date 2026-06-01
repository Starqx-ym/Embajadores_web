import { useNavigate } from 'react-router-dom';

export default function ServerError() {
  const navigate = useNavigate();

  const handleRetry = () => navigate('/login');
  const handleHome = () => navigate('/dashboard');

  const timestamp = new Date().toLocaleString();

  return (
    <div className="server-error-page">
      <div className="server-error-card">
        <div className="error-illustration" aria-hidden>
          <svg width="140" height="140" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="22" height="22" rx="6" stroke="url(#g1)" strokeWidth="1.5" fill="rgba(255,255,255,0.02)"/>
            <path d="M12 7v6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="17" r="1" fill="#fff" />
          </svg>
        </div>

        <div>
          <h2 className="error-title">Servicio No Disponible</h2>
          <p className="error-subtitle">No podemos conectar con el servidor en este momento.</p>

          <div className="text-slate">Estamos trabajando para resolverlo. Puedes intentar reconectar o contactar al equipo de soporte si el problema persiste.</div>

          <div className="error-actions">
            <button className="btn-retry" onClick={handleRetry}>🔄 Reintentar</button>
            <button className="btn-secondary" onClick={handleHome}>🏠 Volver al Dashboard</button>
            <a className="btn-secondary" href="mailto:soporte@embajadores.edu?subject=Error%20Servicio%20API" rel="noreferrer">✉️ Reportar</a>
          </div>

          <div className="error-meta">
            <div><strong>Estado:</strong> 503 Service Unavailable</div>
            <div><strong>Hora:</strong> {timestamp}</div>
            <div style={{marginTop:8}}>Detalles: <span style={{color:'#94a3b8'}}>El servidor no respondió a la solicitud.</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}