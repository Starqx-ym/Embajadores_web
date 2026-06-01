import { useNavigate } from 'react-router-dom';

export default function ServerError() {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Redirigir al login para intentar restablecer la comunicación
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 border-2 border-red-500 rounded-2xl p-8 text-center shadow-2xl">
        {/* Icono de advertencia de servidor desconectado */}
        <div className="w-20 h-20 bg-red-900/50 border border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-red-400 mb-2">Conexión Perdida</h1>
        <p className="text-gray-400 font-medium mb-1">Error de Comunicación con el Servidor</p>
        
        <div className="bg-gray-950 p-4 rounded-xl text-left text-xs font-mono text-gray-500 my-4 border border-gray-700">
          <span className="text-red-400">STATUS:</span> ERR_CONNECTION_REFUSED <br />
          <span className="text-red-400">INFO:</span> El servicio de la API de Embajadores no responde. Puede deberse a mantenimiento del sistema o caída del nodo.
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Estamos experimentando interrupciones en nuestros servicios en la nube. Por favor, verifica tu conexión o intenta reconectar.
        </p>

        <button
          onClick={handleRetry}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 transform hover:scale-[1.02] shadow-lg shadow-red-900/40"
        >
          🔄 Intentar Reconectar de Nuevo
        </button>
      </div>
    </div>
  );
}