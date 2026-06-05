import express from 'express';
import path from 'path';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import activityRoutes from './routes/activityRoutes';
import { apiLimiter } from './middlewares/rateLimiter';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://18.208.221.134']
);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without Origin, such as Postman or local health checks.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Bloqueado por politicas de seguridad de CORS (origen no permitido).'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/actividades', activityRoutes);

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.use('/api', (req, res) => {
  res.status(404).json({
    status: 404,
    message: 'El recurso solicitado no existe o se encuentra actualmente en desarrollo.',
    project: 'Portal de Embajadores Estudiantiles v0.1'
  });
});

app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
