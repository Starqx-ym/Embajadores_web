import { Router } from 'express';
import pool from '../config/database';

const router = Router();

router.get('/health', async (req, res) => {
  const started = Date.now();

  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      responseTimeMs: Date.now() - started,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'degraded',
      database: 'down',
      responseTimeMs: Date.now() - started,
      reason: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
