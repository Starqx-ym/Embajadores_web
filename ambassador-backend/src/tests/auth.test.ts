import request from 'supertest';
import app from '../app';
import pool from '../config/database';

// Cerrar la conexión a la base de datos al terminar los tests para que Jest no se quede colgado
afterAll(async () => {
    await pool.end();
});

describe('📌 Pruebas Unitarias - Módulo de Autenticación', () => {

    it('Debiera rechazar el login si faltan campos (HTTP 400)', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: "" // Enviamos el correo vacío para forzar el error
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });

    it('Debiera devolver 401 si las credenciales no existen en la BD', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'usuario_no_existente_en_pruebas@correo.com',
                password: 'password123'
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Credenciales inválidas');
    });
});