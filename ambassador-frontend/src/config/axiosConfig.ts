import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Usar ruta relativa para producción detrás de Nginx
});

// Interceptor de respuestas para capturar caídas de servidor de forma global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la petición no tiene respuesta del servidor (error de red o servidor apagado)
    if (!error.response) {
      // Redirigir físicamente a la pantalla de error de servidor
      window.location.href = '/server-error';
      return Promise.reject(error);
    }

    // Si el backend responde con un error 5xx, tratamos como caída del servidor
    if (error.response && error.response.status >= 500) {
      window.location.href = '/server-error';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;