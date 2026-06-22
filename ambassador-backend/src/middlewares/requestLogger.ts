import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTimeMs?: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = randomUUID();
  req.startTimeMs = Date.now();
  res.setHeader('X-Request-Id', req.requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - (req.startTimeMs || Date.now());
    const payload = {
      event: 'http_request',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id,
      role: req.user?.role,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };

    if (res.statusCode >= 500) {
      logger.error(payload);
      return;
    }

    if (res.statusCode >= 400 || durationMs > Number(process.env.SLOW_REQUEST_MS || 1500)) {
      logger.warn(payload);
      return;
    }

    logger.info(payload);
  });

  next();
};
