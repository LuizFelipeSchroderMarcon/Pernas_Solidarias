import { query } from '../database/connection';
import { RankingParticipant, RankingEvent } from '../models/types';

export class AnalyticsRepository {
  async getTopRunners(limit = 5): Promise<RankingParticipant[]> {
    const sql = `
      SELECT 
        c.cd_condutor AS id,
        c.nm_condutor AS nome,
        COUNT(d.cd_dupla)::int AS total_corridas
      FROM CONDUTOR c
      INNER JOIN DUPLA d ON d.cd_condutor = c.cd_condutor
      GROUP BY c.cd_condutor, c.nm_condutor
      ORDER BY total_corridas DESC, c.nm_condutor ASC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows;
  }

  async getTopWheelchairUsers(limit = 5): Promise<RankingParticipant[]> {
    const sql = `
      SELECT 
        c.cd_cadeirante AS id,
        c.nm_cadeirante AS nome,
        COUNT(d.cd_dupla)::int AS total_corridas
      FROM CADEIRANTE c
      INNER JOIN DUPLA d ON d.cd_cadeirante = c.cd_cadeirante
      GROUP BY c.cd_cadeirante, c.nm_cadeirante
      ORDER BY total_corridas DESC, c.nm_cadeirante ASC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows;
  }

  async getTopEvents(limit = 5): Promise<RankingEvent[]> {
    const sql = `
      SELECT 
        e.cd_evento AS id,
        e.nm_evento AS nome,
        e.dt_evento AS data,
        COUNT(d.cd_dupla)::int AS total_duplas
      FROM EVENTO e
      INNER JOIN DUPLA d ON d.cd_evento = e.cd_evento
      GROUP BY e.cd_evento, e.nm_evento, e.dt_evento
      ORDER BY total_duplas DESC, e.dt_evento DESC
      LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows;
  }
}
