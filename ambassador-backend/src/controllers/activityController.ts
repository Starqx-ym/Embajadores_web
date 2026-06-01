import { Request, Response } from 'express';
import { Pool } from 'pg';

// Suponiendo que tienes tu pool de conexión exportado en src/config/db.ts
import pool from '../config/database'; 

export const activityController = {
  // 1. CREATE
  create: async (req: Request, res: Response) => {
    const { nombre, descripcion, puntos } = req.body;
    try {
      try {
        const query = `INSERT INTO public.actividades (nombre, descripcion, puntos) VALUES ($1, $2, $3) RETURNING *`;
        const result = await pool.query(query, [nombre, descripcion, puntos]);
        return res.status(201).json(result.rows[0]);
      } catch (innerError: any) {
        const query = `INSERT INTO public.actividades (titulo, descripcion, puntos_otorgados) VALUES ($1, $2, $3) RETURNING *`;
        const result = await pool.query(query, [nombre, descripcion, puntos]);
        return res.status(201).json(result.rows[0]);
      }
    } catch (error: any) {
      console.error('Create activity error', error);
      return res.status(500).json({ error: error.message || 'Error interno al crear actividad.' });
    }
  },

  // 2. READ (Devuelve todas las actividades si no hay paginación explícita)
  getAll: async (req: Request, res: Response) => {
    try {
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const usePagination = Number.isInteger(page) && page > 0 && Number.isInteger(limit) && limit > 0;
      const offset = usePagination ? (page - 1) * limit : 0;

      const dataQuery = usePagination
        ? `SELECT * FROM actividades ORDER BY id DESC LIMIT $1 OFFSET $2`
        : `SELECT * FROM actividades ORDER BY id DESC`;

      const dataResult = await pool.query(
        dataQuery,
        usePagination ? [limit, offset] : []
      );

      if (usePagination) {
        const countQuery = `SELECT COUNT(*) FROM actividades`;
        const countResult = await pool.query(countQuery);
        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
          data: dataResult.rows,
          pagination: {
            totalItems,
            totalPages,
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

  // 3. UPDATE
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, titulo, descripcion, puntos, puntos_otorgados, fecha_evento, cupos_disponibles, estado } = req.body;
    try {
      try {
        const result = await pool.query(
          `UPDATE actividades SET nombre=$1, descripcion=$2, puntos=$3 WHERE id=$4 RETURNING *`,
          [nombre ?? titulo, descripcion, puntos ?? puntos_otorgados, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Actividad no encontrada.' });
        return res.status(200).json(result.rows[0]);
      } catch (innerError: any) {
        const result = await pool.query(
          `UPDATE actividades SET titulo=$1, descripcion=$2, puntos_otorgados=$3 WHERE id=$4 RETURNING *`,
          [titulo ?? nombre, descripcion, puntos_otorgados ?? puntos, id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Actividad no encontrada.' });
        return res.status(200).json(result.rows[0]);
      }
    } catch (error: any) {
      console.error('Update activity error', error);
      return res.status(500).json({ error: error.message || 'Error al actualizar actividad.' });
    }
  },

  // 4. DELETE
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM actividades WHERE id = $1', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Actividad no encontrada.' });
      return res.status(200).json({ message: 'Actividad eliminada correctamente.' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Error al eliminar actividad.' });
    }
  }
};