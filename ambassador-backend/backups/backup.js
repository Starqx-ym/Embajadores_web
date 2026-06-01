const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuración de la conexión leyendo el entorno o local
const DB_USER = process.env.DB_USER || 'postgres';
const DB_NAME = process.env.DB_NAME || 'ambassadors_db';
const DB_HOST = process.env.DB_HOST || 'localhost';

// Generar nombre de archivo único con la fecha de hoy
const date = new Date().toISOString().slice(0, 10);
const backupFolder = path.join(__dirname, 'backups');
const outputFile = path.join(backupFolder, `backup_embajadores_${date}.sql`);

// Asegurar que la carpeta exista
if (!fs.existsSync(backupFolder)) {
    fs.mkdirSync(backupFolder);
}

// Comando nativo de PostgreSQL para volcado de datos
const command = `pg_dump -U ${DB_USER} -h ${DB_HOST} -d ${DB_NAME} -F c -f "${outputFile}"`;

console.log('⏳ Iniciando respaldo automático de la base de datos de Embajadores...');

exec(command, { env: { PGPASSWORD: process.env.DB_PASSWORD || 'tu_clave' } }, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Error al crear el backup: ${error.message}`);
        return;
    }
    console.log(`📦 ¡Respaldo creado con éxito! Archivo guardado en: ${outputFile}`);
});