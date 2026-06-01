import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Tu URL de backend
});

// Interceptor de respuestas para capturar caídas de servidor de forma global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la petición no tiene respuesta del servidor (error de red o servidor apagado)
    if (!error.response) {
      // Redirigir físicamente a la pantalla de error de servidor
      window.location.href = '/server-error';
    }
    return Promise.reject(error);
  }
);

export default api;