"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const rateLimiter_1 = require("./middlewares/rateLimiter");
const app = (0, express_1.default)();
// Middlewares esenciales para leer datos enviados por el usuario
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Servir archivos de la carpeta pública
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Ruta principal que carga el Login/Registro unificado
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Endpoints de la API protegidos por el Rate Limiter
app.use('/api/auth', rateLimiter_1.apiLimiter, authRoutes_1.default);
// Manejador para cualquier otra ruta de la API que no exista (404)
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: "El recurso solicitado no existe o se encuentra actualmente en desarrollo.",
        project: "Portal de Embajadores Estudiantiles v0.1"
    });
});
exports.default = app;
