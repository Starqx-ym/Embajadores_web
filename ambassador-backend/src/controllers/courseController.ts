import { Request, Response } from 'express';
import pool from '../config/database';

export const courseController = {
  list: async (req: Request, res: Response) => {
    const userId = req.user?.id;

    try {
      const result = await pool.query(`
        SELECT
          c.*,
          CASE WHEN cr.id IS NULL THEN false ELSE true END AS redeemed
        FROM public.courses c
        LEFT JOIN public.course_redemptions cr
          ON cr.course_id = c.id AND cr.user_id = $1
        WHERE c.status = 'activo'
        ORDER BY c.cost_points ASC, c.id ASC
      `, [userId]);

      return res.status(200).json(result.rows);
    } catch (error: any) {
      console.error('List courses error', error);
      return res.status(500).json({ error: error.message || 'Error al obtener cursos.' });
    }
  },

  redeem: async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const courseResult = await client.query('SELECT * FROM public.courses WHERE id = $1 AND status = $2', [id, 'activo']);
      if (courseResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Curso no encontrado.' });
      }

      const course = courseResult.rows[0];
      const pointsResult = await client.query('SELECT COALESCE(points, 0) AS points FROM public.user_points WHERE user_id = $1', [userId]);
      const availablePoints = Number(pointsResult.rows[0]?.points || 0);

      if (availablePoints < Number(course.cost_points)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No tienes puntos suficientes para canjear este curso.' });
      }

      await client.query(
        `INSERT INTO public.course_redemptions (user_id, course_id, points_spent)
         VALUES ($1, $2, $3)`,
        [userId, id, course.cost_points]
      );

      await client.query(
        `UPDATE public.user_points
         SET points = points - $1, updated_at = NOW()
         WHERE user_id = $2`,
        [course.cost_points, userId]
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Curso canjeado correctamente.' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Ya canjeaste este curso.' });
      }
      console.error('Redeem course error', error);
      return res.status(500).json({ error: error.message || 'Error al canjear curso.' });
    } finally {
      client.release();
    }
  }
};
