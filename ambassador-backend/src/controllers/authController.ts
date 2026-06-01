import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // <-- Importación vital para el 80%
import pool from '../config/database'; // Importar la base de datos real

export const register = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
    }
    
    try {
        // Verificar si el usuario ya existe
        const userExists = await pool.query('SELECT id FROM public.users WHERE email = $1', [email]);
        if (userExists.rowCount && userExists.rowCount > 0) {
            res.status(400).json({ error: 'El correo electrónico ya está registrado' });
            return;
        }

        // Cifrado obligatorio
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Guardar de verdad en la base de datos
        const newUserResult = await pool.query(
            'INSERT INTO public.users (email, password) VALUES ($1, $2) RETURNING id',
            [email, hashedPassword]
        );

        const newUserId = newUserResult.rows[0].id;

        // [LOGICA DEL 80%]: Asignar automáticamente el rol por defecto 'embajador' (asumiendo que id 3 es embajador)
        // Esto mantiene la integridad de tus tablas relacionales de roles al registrarse de forma pública
        await pool.query(
            'INSERT INTO public.user_roles (user_id, role_id) VALUES ($1, 3) ON CONFLICT DO NOTHING',
            [newUserId]
        );

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente en la BD cloud', 
            user: { email } 
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor al registrar' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        res.status(400).json({ error: 'Email y contraseña son requeridos' });
        return;
    }
    
    try {
        console.log(`🔍 Intentando login para: ${email} con contraseña: ${password}`);
        // [LOGICA DEL 80%]: Buscar usuario en la BD haciendo JOINs para extraer su rol real
        const userQuery = `
            SELECT u.*, r.name as rol_nombre
            FROM public.users u
            LEFT JOIN public.user_roles ur ON u.id = ur.user_id
            LEFT JOIN public.roles r ON ur.role_id = r.id
            WHERE u.email = $1
        `;
        const result = await pool.query(userQuery, [email]);
        
        if (result.rowCount === 0) {
            console.log("❌ CANDADO 1: El correo no existe en la base de datos.");
            res.status(401).json({ error: 'Credenciales inválidas (Usuario no existe)' });
            return;
        }

        const user = result.rows[0];

        console.log(`Found User en BD. Email: ${user.email}, Hash guardado: ${user.password}`);

        // Comparar el hash cifrado de la BD con la contraseña ingresada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
            return;
        }

        console.log("🎯 ¡TODO OK! Generando token real...");    
        // [LOGICA DEL 80%]: Control de tokens reales y expiración de sesión
        // Si no tienes configurada la variable en tu .env, usará la clave por defecto de desarrollo
        const secretKey = process.env.JWT_SECRET || 'clave_secreta_super_segura_123';
        
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.rol_nombre || 'embajador' // Si no tiene rol asignado por defecto toma embajador
            },
            secretKey,
            { expiresIn: '2h' } // <-- Requerimiento de expiración del 80%
        );

        // Login correcto con respuestas controladas
        res.status(200).json({ 
            message: 'Login correcto', 
            token: token, // <-- Ahora es un JWT criptográfico real
            user: { 
                email: user.email,
                role: user.rol_nombre || 'embajador'
            }
        });
    } catch (error) {
        console.log("❌ ERROR CRÍTICO EN EL PROCESO DE LOGIN:");
        console.error(error); 
        res.status(500).json({ error: 'Error interno del servidor al autenticar' });
    }
};