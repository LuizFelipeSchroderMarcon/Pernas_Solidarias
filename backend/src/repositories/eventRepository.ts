import { query } from '../database/connection';
import { Evento } from '../models/types';

export class EventRepository {
  async findAll(status?: 'futuros' | 'passados' | 'todos', search?: string): Promise<any[]> {
    let sql = `
      SELECT 
        e.cd_evento,
        e.nm_evento,
        e.dt_evento,
        e.created_at,
        COUNT(d.cd_dupla)::int AS total_duplas
      FROM EVENTO e
      LEFT JOIN DUPLA d ON d.cd_evento = e.cd_evento
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status === 'futuros') {
      sql += ' AND e.dt_evento >= CURRENT_DATE';
    } else if (status === 'passados') {
      sql += ' AND e.dt_evento < CURRENT_DATE';
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND e.nm_evento ILIKE $${params.length}`;
    }

    sql += ' GROUP BY e.cd_evento, e.nm_evento, e.dt_evento, e.created_at';

    if (status === 'passados') {
      sql += ' ORDER BY e.dt_evento DESC';
    } else {
      sql += ' ORDER BY e.dt_evento ASC';
    }

    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id: number): Promise<any | null> {
    const sql = `
      SELECT 
        e.cd_evento,
        e.nm_evento,
        e.dt_evento,
        e.created_at,
        COUNT(d.cd_dupla)::int AS total_duplas
      FROM EVENTO e
      LEFT JOIN DUPLA d ON d.cd_evento = e.cd_evento
      WHERE e.cd_evento = $1
      GROUP BY e.cd_evento, e.nm_evento, e.dt_evento, e.created_at
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  async create(data: { nm_evento: string; dt_evento: string }): Promise<Evento> {
    const result = await query(
      `INSERT INTO EVENTO (nm_evento, dt_evento)
       VALUES ($1, $2)
       RETURNING *`,
      [data.nm_evento, data.dt_evento]
    );
    return result.rows[0];
  }

  async update(
    id: number,
    data: { nm_evento: string; dt_evento: string }
  ): Promise<Evento | null> {
    const result = await query(
      `UPDATE EVENTO
       SET nm_evento = $1,
           dt_evento = $2
       WHERE cd_evento = $3
       RETURNING *`,
      [data.nm_evento, data.dt_evento, id]
    );
    return result.rows[0] || null;
  }

  async hasPairs(id: number): Promise<boolean> {
    const result = await query('SELECT 1 FROM DUPLA WHERE cd_evento = $1 LIMIT 1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM EVENTO WHERE cd_evento = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

// Alias for backward compatibility
export { EventRepository as EventoRepository };
