import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 404,
    requestId: req.requestId,
    message: 'El recurso solicitado no existe.',
    project: 'Portal de Embajadores Estudiantiles v0.1'
  });
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const durationMs = Date.now() - (req.startTimeMs || Date.now());

  logger.error({
    event: 'unhandled_error',
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: 500,
    durationMs,
    userId: req.user?.id,
    role: req.user?.role,
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  res.status(500).json({
    status: 500,
    requestId: req.requestId,
    message: 'Error interno controlado. Revise logs del servidor con el requestId.',
    reason: err.message || 'Fallo inesperado'
  });
};
