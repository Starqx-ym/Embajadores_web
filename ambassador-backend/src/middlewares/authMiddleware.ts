import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extender la interfaz Request de Express para almacenar los datos del token decodificado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // Capturar el token desde las cabeceras HTTP (Authorization: Bearer XXXXXX)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const secretKey = process.env.JWT_SECRET || 'clave_secreta_super_segura_123';
    const decoded = jwt.verify(token, secretKey) as any;
    
    req.user = decoded; // Inyectamos los datos en la petición para usarlo adelante
    next();
  } catch (error: any) {
    // Captura explícita del token expirado exigido en la rúbrica
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Por favor, vuelva a iniciar sesión.' });
    }
    return res.status(403).json({ error: 'Token inválido o alterado.' });
  }
};

// Middleware para autorizar múltiples tipos de usuarios (Roles)
export const grantAccess = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso prohibido. No tiene los permisos requeridos.' });
    }
    next();
  };
};