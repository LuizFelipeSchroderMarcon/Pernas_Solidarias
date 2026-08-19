import { query } from '../database/connection';
import { Evento } from '../models/types';

export class EventoRepository {
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

    const res = await query(sql, params);
    return res.rows;
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
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  }

  async create(data: { nm_evento: string; dt_evento: string }): Promise<Evento> {
    const res = await query(
      `INSERT INTO EVENTO (nm_evento, dt_evento)
       VALUES ($1, $2)
       RETURNING *`,
      [data.nm_evento, data.dt_evento]
    );
    return res.rows[0];
  }

  async update(id: number, data: { nm_evento: string; dt_evento: string }): Promise<Evento | null> {
    const res = await query(
      `UPDATE EVENTO
       SET nm_evento = $1,
           dt_evento = $2
       WHERE cd_evento = $3
       RETURNING *`,
      [data.nm_evento, data.dt_evento, id]
    );
    return res.rows[0] || null;
  }

  async hasDuplas(id: number): Promise<boolean> {
    const res = await query('SELECT 1 FROM DUPLA WHERE cd_evento = $1 LIMIT 1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const res = await query('DELETE FROM EVENTO WHERE cd_evento = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
