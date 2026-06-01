import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
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
    } else {
        console.log('✅ Conexión exitosa a PostgreSQL. Servidor de datos listo.');
    }
});

export default pool;