"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database")); // Importar la base de datos real
const register = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
    }
    try {
        // Verificar si el usuario ya existe
        const userExists = await database_1.default.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rowCount && userExists.rowCount > 0) {
            res.status(400).json({ error: 'El correo electrónico ya está registrado' });
            return;
        }
        // Cifrado obligatorio (Requerimiento del 25%)
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Guardar de verdad en la base de datos (Inicio del CRUD estructurado)
        await database_1.default.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashedPassword]);
        res.status(201).json({
            message: 'Usuario registrado exitosamente en la BD cloud',
            user: { email }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor al registrar' });
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
    }
    try {
        // Buscar usuario en la base de datos
        const result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            res.status(401).json({ error: 'Credenciales inválidas (Usuario no existe)' });
            return;
        }
        const user = result.rows[0];
        // Comparar el hash cifrado de la BD con la contraseña ingresada
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
            return;
        }
        // Login correcto (Para el 80% usaremos JWT reales, aquí mandamos mock por rúbrica)
        res.status(200).json({
            message: 'Login correcto',
            token: 'fake-jwt-token-hito-25',
            user: { email: user.email }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor al autenticar' });
    }
};
exports.login = login;
