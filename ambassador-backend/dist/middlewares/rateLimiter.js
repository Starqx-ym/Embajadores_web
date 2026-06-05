"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    // Si estamos bajo prueba masiva, permitimos 50,000 peticiones, de lo contrario el límite normal es 100
    max: process.env.NODE_ENV === 'test' ? 50000 : 200,
    message: { error: 'Demasiadas peticiones desde esta IP, intente más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});
