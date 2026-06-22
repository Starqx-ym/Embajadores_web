"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const courseRoutes_1 = __importDefault(require("./routes/courseRoutes"));
const healthRoutes_1 = __importDefault(require("./routes/healthRoutes"));
const rateLimiter_1 = require("./middlewares/rateLimiter");
const requestLogger_1 = require("./middlewares/requestLogger");
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
const allowedOrigins = (process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://18.208.221.134']);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests without Origin, such as Postman or local health checks.
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Bloqueado por politicas de seguridad de CORS (origen no permitido).'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(requestLogger_1.requestLogger);
app.use('/api', healthRoutes_1.default);
app.use('/api/auth', rateLimiter_1.apiLimiter, authRoutes_1.default);
app.use('/api/actividades', activityRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/courses', courseRoutes_1.default);
const publicPath = path_1.default.join(__dirname, '../public');
app.use(express_1.default.static(publicPath));
app.use('/api', errorHandler_1.notFoundHandler);
app.use((req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
