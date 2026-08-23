import { pool, query } from '../database/connection';
import { Dupla, DuplaDetalhada, HistoryFilters, PrioritizedParticipant } from '../models/types';

export class PairRepository {
  /**
   * Fetches all active eligible wheelchair users, ordering by longest time without running (RN03, RN07).
   */
  async findPrioritizedWheelchairUsers(): Promise<PrioritizedParticipant[]> {
    const sql = `
      SELECT 
        c.cd_cadeirante AS id,
        c.nm_cadeirante AS nome,
        c.cpf,
        c.telefone,
        c.tam_camisa,
        c.possui_cadeira_propria,
        c.ativo,
        c.created_at,
        MAX(e.dt_evento) AS dt_ultima_participacao,
        COUNT(d.cd_dupla)::int AS total_participacoes
      FROM CADEIRANTE c
      LEFT JOIN DUPLA d ON d.cd_cadeirante = c.cd_cadeirante
      LEFT JOIN EVENTO e ON e.cd_evento = d.cd_evento
      WHERE c.ativo = TRUE
      GROUP BY c.cd_cadeirante, c.nm_cadeirante, c.cpf, c.telefone, c.tam_camisa, c.possui_cadeira_propria, c.ativo, c.created_at
      ORDER BY MAX(e.dt_evento) ASC NULLS FIRST, c.created_at ASC, c.cd_cadeirante ASC
    `;
    const result = await query(sql);
    return result.rows;
  }

  /**
   * Fetches all active eligible runners with priority calculation (RN03, RN07).
   */
  async findPrioritizedRunners(): Promise<PrioritizedParticipant[]> {
    const sql = `
      SELECT 
        c.cd_condutor AS id,
        c.nm_condutor AS nome,
        c.cpf,
        c.telefone,
        c.tam_camisa,
        c.ativo,
        c.created_at,
        MAX(e.dt_evento) AS dt_ultima_participacao,
        COUNT(d.cd_dupla)::int AS total_participacoes
      FROM CONDUTOR c
      LEFT JOIN DUPLA d ON d.cd_condutor = c.cd_condutor
      LEFT JOIN EVENTO e ON e.cd_evento = d.cd_evento
      WHERE c.ativo = TRUE
      GROUP BY c.cd_condutor, c.nm_condutor, c.cpf, c.telefone, c.tam_camisa, c.ativo, c.created_at
      ORDER BY MAX(e.dt_evento) ASC NULLS FIRST, c.created_at ASC, c.cd_condutor ASC
    `;
    const result = await query(sql);
    return result.rows;
  }

  /**
   * Inserts multiple pairs inside an atomic transaction.
   */
  async createMany(
    eventId: number,
    pairs: { wheelchairUserId: number; runnerId: number }[]
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clear previous pairs for regeneration
      await client.query('DELETE FROM DUPLA WHERE cd_evento = $1', [eventId]);

      for (const pair of pairs) {
        await client.query(
          `INSERT INTO DUPLA (cd_evento, cd_cadeirante, cd_condutor)
           VALUES ($1, $2, $3)`,
          [eventId, pair.wheelchairUserId, pair.runnerId]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Finds all detailed pairs for a given event.
   */
  async findByEventId(eventId: number): Promise<DuplaDetalhada[]> {
    const sql = `
      SELECT 
        d.cd_dupla,
        d.cd_evento,
        e.nm_evento,
        e.dt_evento,
        cad.cd_cadeirante,
        cad.nm_cadeirante,
        cad.cpf AS cpf_cadeirante,
        cad.telefone AS telefone_cadeirante,
        cad.tam_camisa AS tam_camisa_cadeirante,
        cad.possui_cadeira_propria,
        con.cd_condutor,
        con.nm_condutor,
        con.cpf AS cpf_condutor,
        con.telefone AS telefone_condutor,
        con.tam_camisa AS tam_camisa_condutor,
        d.created_at
      FROM DUPLA d
      INNER JOIN EVENTO e ON e.cd_evento = d.cd_evento
      INNER JOIN CADEIRANTE cad ON cad.cd_cadeirante = d.cd_cadeirante
      INNER JOIN CONDUTOR con ON con.cd_condutor = d.cd_condutor
      WHERE d.cd_evento = $1
      ORDER BY d.cd_dupla ASC
    `;
    const result = await query(sql, [eventId]);
    return result.rows;
  }

  /**
   * Finds a single pair by ID with details.
   */
  async findById(pairId: number): Promise<DuplaDetalhada | null> {
    const sql = `
      SELECT 
        d.cd_dupla,
        d.cd_evento,
        e.nm_evento,
        e.dt_evento,
        cad.cd_cadeirante,
        cad.nm_cadeirante,
        cad.cpf AS cpf_cadeirante,
        cad.telefone AS telefone_cadeirante,
        cad.tam_camisa AS tam_camisa_cadeirante,
        cad.possui_cadeira_propria,
        con.cd_condutor,
        con.nm_condutor,
        con.cpf AS cpf_condutor,
        con.telefone AS telefone_condutor,
        con.tam_camisa AS tam_camisa_condutor,
        d.created_at
      FROM DUPLA d
      INNER JOIN EVENTO e ON e.cd_evento = d.cd_evento
      INNER JOIN CADEIRANTE cad ON cad.cd_cadeirante = d.cd_cadeirante
      INNER JOIN CONDUTOR con ON con.cd_condutor = d.cd_condutor
      WHERE d.cd_dupla = $1
    `;
    const result = await query(sql, [pairId]);
    return result.rows[0] || null;
  }

  /**
   * Updates a pair manually.
   */
  async update(
    pairId: number,
    data: { wheelchairUserId: number; runnerId: number }
  ): Promise<Dupla | null> {
    const sql = `
      UPDATE DUPLA
      SET cd_cadeirante = $1,
          cd_condutor = $2
      WHERE cd_dupla = $3
      RETURNING *
    `;
    const result = await query(sql, [data.wheelchairUserId, data.runnerId, pairId]);
    return result.rows[0] || null;
  }

  /**
   * Checks if a participant is already allocated in another pair in the same event (RN02).
   */
  async isParticipantInEvent(
    eventId: number,
    participantType: 'wheelchair' | 'runner',
    participantId: number,
    ignorePairId?: number
  ): Promise<boolean> {
    const column = participantType === 'wheelchair' ? 'cd_cadeirante' : 'cd_condutor';
    let sql = `SELECT 1 FROM DUPLA WHERE cd_evento = $1 AND ${column} = $2`;
    const params: any[] = [eventId, participantId];

    if (ignorePairId) {
      sql += ` AND cd_dupla != $3`;
      params.push(ignorePairId);
    }

    sql += ' LIMIT 1';
    const result = await query(sql, params);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Deletes all pairs of an event.
   */
  async deleteByEventId(eventId: number): Promise<number> {
    const result = await query('DELETE FROM DUPLA WHERE cd_evento = $1', [eventId]);
    return result.rowCount ?? 0;
  }

  /**
   * Retrieves pair history with optional filters (RF06, RF09).
   */
  async findHistory(filters: HistoryFilters): Promise<DuplaDetalhada[]> {
    let sql = `
      SELECT 
        d.cd_dupla,
        d.cd_evento,
        e.nm_evento,
        e.dt_evento,
        cad.cd_cadeirante,
        cad.nm_cadeirante,
        cad.cpf AS cpf_cadeirante,
        cad.telefone AS telefone_cadeirante,
        cad.tam_camisa AS tam_camisa_cadeirante,
        cad.possui_cadeira_propria,
        con.cd_condutor,
        con.nm_condutor,
        con.cpf AS cpf_condutor,
        con.telefone AS telefone_condutor,
        con.tam_camisa AS tam_camisa_condutor,
        d.created_at
      FROM DUPLA d
      INNER JOIN EVENTO e ON e.cd_evento = d.cd_evento
      INNER JOIN CADEIRANTE cad ON cad.cd_cadeirante = d.cd_cadeirante
      INNER JOIN CONDUTOR con ON con.cd_condutor = d.cd_condutor
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.eventId) {
      params.push(filters.eventId);
      sql += ` AND d.cd_evento = $${params.length}`;
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND e.dt_evento >= $${params.length}`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND e.dt_evento <= $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      sql += ` AND (
        e.nm_evento ILIKE $${params.length} OR 
        cad.nm_cadeirante ILIKE $${params.length} OR 
        con.nm_condutor ILIKE $${params.length}
      )`;
    }

    sql += ' ORDER BY e.dt_evento DESC, d.cd_dupla ASC';

    const result = await query(sql, params);
    return result.rows;
  }
}

// Alias for backward compatibility
export { PairRepository as DuplaRepository };
