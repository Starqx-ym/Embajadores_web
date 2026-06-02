import express from 'express';
import path from 'path';
import authRoutes from './routes/authRoutes';
import { apiLimiter } from './middlewares/rateLimiter';
import activityRoutes from './routes/activityRoutes';
import cors from 'cors';

const app = express();
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://18.208.221.134', 'http://TU_DOMINIO'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como apps móviles o herramientas tipo Postman en desarrollo)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // El origen está en la lista blanca, se permite el acceso
    } else {
      callback(new Error('Bloqueado por políticas de seguridad de CORS (Origen no permitido).'));
    }
  },
  credentials: true, // Permitir envío de cabeceras seguras
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Middlewares esenciales para leer datos enviados por el usuario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos de la carpeta pública
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/actividades', activityRoutes);
// Ruta principal que carga el Login/Registro unificado
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoints de la API protegidos por el Rate Limiter
app.use('/api/auth', apiLimiter, authRoutes);

// Manejador para cualquier otra ruta de la API que no exista (404)
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: "El recurso solicitado no existe o se encuentra actualmente en desarrollo.",
        project: "Portal de Embajadores Estudiantiles v0.1"
    });
});

export default app;