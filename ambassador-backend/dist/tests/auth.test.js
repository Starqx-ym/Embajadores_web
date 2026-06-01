"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const database_1 = __importDefault(require("../config/database"));
// Cerrar la conexión a la base de datos al terminar los tests para que Jest no se quede colgado
afterAll(async () => {
    await database_1.default.end();
});
describe('📌 Pruebas Unitarias - Módulo de Autenticación', () => {
    it('Debiera rechazar el login si faltan campos (HTTP 400)', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({
            email: "" // Enviamos el correo vacío para forzar el error
        });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
    it('Debiera devolver 401 si las credenciales no existen en la BD', async () => {
        const response = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({
            email: 'usuario_no_existente_en_pruebas@correo.com',
            password: 'password123'
        });
        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Credenciales inválidas');
    });
});
