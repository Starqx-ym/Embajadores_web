import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    // Si estamos bajo prueba masiva, permitimos 50,000 peticiones, de lo contrario el límite normal es 100
    max: process.env.NODE_ENV === 'test' ? 50000 : 200, 
    message: { error: 'Demasiadas peticiones desde esta IP, intente más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});