import { query } from '../database/connection';
import { Cadeirante } from '../models/types';

export class CadeiranteRepository {
  async findAll(ativo?: boolean, search?: string): Promise<Cadeirante[]> {
    let sql = 'SELECT * FROM CADEIRANTE WHERE 1=1';
    const params: any[] = [];

    if (ativo !== undefined) {
      params.push(ativo);
      sql += ` AND ativo = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (nm_cadeirante ILIKE $${params.length} OR cpf ILIKE $${params.length})`;
    }

    sql += ' ORDER BY nm_cadeirante ASC';

    const res = await query(sql, params);
    return res.rows;
  }

  async findById(id: number): Promise<Cadeirante | null> {
    const res = await query('SELECT * FROM CADEIRANTE WHERE cd_cadeirante = $1', [id]);
    return res.rows[0] || null;
  }

  async findByCpf(cpf: string): Promise<Cadeirante | null> {
    const res = await query('SELECT * FROM CADEIRANTE WHERE cpf = $1', [cpf]);
    return res.rows[0] || null;
  }

  async create(data: {
    nm_cadeirante: string;
    cpf: string;
    telefone: string;
    tam_camisa: string;
    possui_cadeira_propria?: boolean;
    ativo?: boolean;
  }): Promise<Cadeirante> {
    const res = await query(
      `INSERT INTO CADEIRANTE (nm_cadeirante, cpf, telefone, tam_camisa, possui_cadeira_propria, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.nm_cadeirante,
        data.cpf,
        data.telefone,
        data.tam_camisa,
        data.possui_cadeira_propria ?? false,
        data.ativo ?? true,
      ]
    );
    return res.rows[0];
  }

  async update(
    id: number,
    data: {
      nm_cadeirante: string;
      cpf: string;
      telefone: string;
      tam_camisa: string;
      possui_cadeira_propria: boolean;
      ativo: boolean;
    }
  ): Promise<Cadeirante | null> {
    const res = await query(
      `UPDATE CADEIRANTE
       SET nm_cadeirante = $1,
           cpf = $2,
           telefone = $3,
           tam_camisa = $4,
           possui_cadeira_propria = $5,
           ativo = $6
       WHERE cd_cadeirante = $7
       RETURNING *`,
      [
        data.nm_cadeirante,
        data.cpf,
        data.telefone,
        data.tam_camisa,
        data.possui_cadeira_propria,
        data.ativo,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async toggleStatus(id: number): Promise<Cadeirante | null> {
    const res = await query(
      `UPDATE CADEIRANTE
       SET ativo = NOT ativo
       WHERE cd_cadeirante = $1
       RETURNING *`,
      [id]
    );
    return res.rows[0] || null;
  }

  async hasDuplas(id: number): Promise<boolean> {
    const res = await query('SELECT 1 FROM DUPLA WHERE cd_cadeirante = $1 LIMIT 1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const res = await query('DELETE FROM CADEIRANTE WHERE cd_cadeirante = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
