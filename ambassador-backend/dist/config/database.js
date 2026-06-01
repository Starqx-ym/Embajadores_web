"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    // Configuración para evitar caídas por exceso de conexiones concurrentes en el hito final
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// Verificar la conexión al iniciar el servidor
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error crítico: No se pudo conectar a la base de datos PostgreSQL:', err.message);
    }
    else {
        console.log('✅ Conexión exitosa a PostgreSQL. Servidor de datos listo.');
    }
});
exports.default = pool;
