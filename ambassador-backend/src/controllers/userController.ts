import { Request, Response } from 'express';
import pool from '../config/database';

const allowedRoles = ['admin', 'coordinador', 'embajador'];

export const userController = {
  list: async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          u.id,
          u.email,
          COALESCE(r.name, 'embajador') AS role,
          COALESCE(up.points, 0) AS points,
          u.created_at
        FROM public.users u
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
        LEFT JOIN public.roles r ON ur.role_id = r.id
        LEFT JOIN public.user_points up ON u.id = up.user_id
        ORDER BY u.id DESC
      `);

      return res.status(200).json(result.rows);
    } catch (error: any) {
      console.error('List users error', error);
      return res.status(500).json({ error: error.message || 'Error al obtener usuarios.' });
    }
  },

  updateRole: async (req: Request, res: Response) => {
    const { id } = req.params;
    const role = String(req.body.role || '').toLowerCase();

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol no valido.' });
    }

    try {
      const roleResult = await pool.query('SELECT id FROM public.roles WHERE name = $1', [role]);
      if (roleResult.rowCount === 0) {
        return res.status(400).json({ error: 'El rol solicitado no existe en la base de datos.' });
      }

      await pool.query('DELETE FROM public.user_roles WHERE user_id = $1', [id]);
      await pool.query(
        'INSERT INTO public.user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, roleResult.rows[0].id]
      );

      return res.status(200).json({ message: 'Rol actualizado correctamente.' });
    } catch (error: any) {
      console.error('Update role error', error);
      return res.status(500).json({ error: error.message || 'Error al actualizar rol.' });
    }
  },

  awardPoints: async (req: Request, res: Response) => {
    const { id } = req.params;
    const points = Number(req.body.points);

    if (!Number.isInteger(points) || points === 0) {
      return res.status(400).json({ error: 'Los puntos deben ser un entero distinto de cero.' });
    }

    try {
      const result = await pool.query(`
        INSERT INTO public.user_points (user_id, points)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET points = public.user_points.points + EXCLUDED.points, updated_at = NOW()
        RETURNING *
      `, [id, points]);

      return res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Award points error', error);
      return res.status(500).json({ error: error.message || 'Error al asignar puntos.' });
    }
  },

  me: async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    try {
      const profileResult = await pool.query(`
        SELECT
          u.id,
          u.email,
          COALESCE(r.name, 'embajador') AS role,
          COALESCE(up.points, 0) AS points
        FROM public.users u
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
        LEFT JOIN public.roles r ON ur.role_id = r.id
        LEFT JOIN public.user_points up ON u.id = up.user_id
        WHERE u.id = $1
      `, [userId]);

      const enrollmentsResult = await pool.query(`
        SELECT
          ae.id,
          ae.status,
          ae.points_awarded,
          ae.enrolled_at,
          a.id AS actividad_id,
          COALESCE(a.nombre, a.titulo) AS nombre,
          a.descripcion,
          COALESCE(a.puntos, a.puntos_otorgados, 0) AS puntos
        FROM public.activity_enrollments ae
        JOIN public.actividades a ON a.id = ae.actividad_id
        WHERE ae.user_id = $1
        ORDER BY ae.enrolled_at DESC
      `, [userId]);

      return res.status(200).json({
        user: profileResult.rows[0],
        enrollments: enrollmentsResult.rows
      });
    } catch (error: any) {
      console.error('Profile error', error);
      return res.status(500).json({ error: error.message || 'Error al obtener perfil.' });
    }
  },

  ranking: async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          u.id,
          u.email,
          COALESCE(r.name, 'embajador') AS role,
          COALESCE(up.points, 0) AS points
        FROM public.users u
        LEFT JOIN public.user_roles ur ON u.id = ur.user_id
        LEFT JOIN public.roles r ON ur.role_id = r.id
        LEFT JOIN public.user_points up ON u.id = up.user_id
        WHERE COALESCE(r.name, 'embajador') = 'embajador'
        ORDER BY COALESCE(up.points, 0) DESC, u.id ASC
        LIMIT 20
      `);

      return res.status(200).json(result.rows);
    } catch (error: any) {
      console.error('Ranking error', error);
      return res.status(500).json({ error: error.message || 'Error al obtener ranking.' });
    }
  },

  notifications: async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT
          cn.*,
          u.email,
          COALESCE(a.nombre, a.titulo) AS actividad
        FROM public.coordinator_notifications cn
        LEFT JOIN public.users u ON u.id = cn.user_id
        LEFT JOIN public.actividades a ON a.id = cn.actividad_id
        ORDER BY cn.created_at DESC
        LIMIT 50
      `);

      return res.status(200).json(result.rows);
    } catch (error: any) {
      console.error('Notifications error', error);
      return res.status(500).json({ error: error.message || 'Error al obtener buzon.' });
    }
  },

  markNotificationRead: async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await pool.query(
        'UPDATE public.coordinator_notifications SET read_at = NOW() WHERE id = $1',
        [id]
      );

      return res.status(200).json({ message: 'Notificacion marcada como leida.' });
    } catch (error: any) {
      console.error('Mark notification error', error);
      return res.status(500).json({ error: error.message || 'Error al actualizar buzon.' });
    }
  }
};
