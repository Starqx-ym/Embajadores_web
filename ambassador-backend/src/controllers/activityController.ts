import { Request, Response } from 'express';
import pool from '../config/database';

export const activityController = {
  create: async (req: Request, res: Response) => {
    const { nombre, titulo, descripcion, puntos, puntos_otorgados, cupos_disponibles, fecha_evento, estado } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO public.actividades
          (nombre, titulo, descripcion, puntos, puntos_otorgados, cupos_disponibles, fecha_evento, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'activo'))
         RETURNING *`,
        [
          nombre ?? titulo,
          titulo ?? nombre,
          descripcion,
          puntos ?? puntos_otorgados ?? 0,
          puntos_otorgados ?? puntos ?? 0,
          cupos_disponibles ?? 0,
          fecha_evento || null,
          estado || 'activo'
        ]
      );

      return res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Create activity error', error);
      return res.status(500).json({ error: error.message || 'Error interno al crear actividad.' });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const usePagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;
      const offset = usePagination ? (page - 1) * limit : 0;

      const dataQuery = usePagination
        ? `SELECT * FROM public.actividades ORDER BY id DESC LIMIT $1 OFFSET $2`
        : `SELECT * FROM public.actividades ORDER BY id DESC`;

      const dataResult = await pool.query(dataQuery, usePagination ? [limit, offset] : []);

      if (usePagination) {
        const countResult = await pool.query(`SELECT COUNT(*) FROM public.actividades`);
        const totalItems = parseInt(countResult.rows[0].count, 10);

        return res.status(200).json({
          data: dataResult.rows,
          pagination: {
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            itemsPerPage: limit
          }
        });
      }

      return res.status(200).json(dataResult.rows);
    } catch (error: any) {
      console.error('Get all activities error', error);
      return res.status(500).json({ error: error.message || 'Error al obtener actividades.' });
    }
  },

  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, titulo, descripcion, puntos, puntos_otorgados, fecha_evento, cupos_disponibles, estado } = req.body;

    try {
      const result = await pool.query(
        `UPDATE public.actividades
         SET nombre = $1,
             titulo = $2,
             descripcion = $3,
             puntos = $4,
             puntos_otorgados = $5,
             fecha_evento = $6,
             cupos_disponibles = $7,
             estado = $8
         WHERE id = $9
         RETURNING *`,
        [
          nombre ?? titulo,
          titulo ?? nombre,
          descripcion,
          puntos ?? puntos_otorgados ?? 0,
          puntos_otorgados ?? puntos ?? 0,
          fecha_evento || null,
          cupos_disponibles ?? 0,
          estado || 'activo',
          id
        ]
      );

      if (result.rowCount === 0) return res.status(404).json({ error: 'Actividad no encontrada.' });
      return res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Update activity error', error);
      return res.status(500).json({ error: error.message || 'Error al actualizar actividad.' });
    }
  },

  delete: async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const result = await pool.query('DELETE FROM public.actividades WHERE id = $1', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Actividad no encontrada.' });
      return res.status(200).json({ message: 'Actividad eliminada correctamente.' });
    } catch (error: any) {
      console.error('Delete activity error', error);
      return res.status(500).json({ error: 'Error al eliminar actividad.' });
    }
  },

  enroll: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Usuario no autenticado.' });

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await client.query(
        'SELECT id FROM public.activity_enrollments WHERE user_id = $1 AND actividad_id = $2',
        [userId, id]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Ya estas inscrito en esta actividad.' });
      }

      const updateResult = await client.query(
        `UPDATE public.actividades
         SET cupos_disponibles = cupos_disponibles - 1
         WHERE id = $1 AND cupos_disponibles > 0
         RETURNING *`,
        [id]
      );

      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No hay cupos disponibles para esta actividad.' });
      }

      await client.query(
        `INSERT INTO public.activity_enrollments (user_id, actividad_id)
         VALUES ($1, $2)`,
        [userId, id]
      );

      await client.query('COMMIT');
      return res.status(200).json({ message: 'Inscripcion realizada correctamente.' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Enroll error', error);
      return res.status(500).json({ error: 'Error al procesar la inscripcion.' });
    } finally {
      client.release();
    }
  }
};
