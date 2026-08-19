import { query } from '../database/connection';
import { Condutor } from '../models/types';

export class CondutorRepository {
  async findAll(ativo?: boolean, search?: string): Promise<Condutor[]> {
    let sql = 'SELECT * FROM CONDUTOR WHERE 1=1';
    const params: any[] = [];

    if (ativo !== undefined) {
      params.push(ativo);
      sql += ` AND ativo = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (nm_condutor ILIKE $${params.length} OR cpf ILIKE $${params.length})`;
    }

    sql += ' ORDER BY nm_condutor ASC';

    const res = await query(sql, params);
    return res.rows;
  }

  async findById(id: number): Promise<Condutor | null> {
    const res = await query('SELECT * FROM CONDUTOR WHERE cd_condutor = $1', [id]);
    return res.rows[0] || null;
  }

  async findByCpf(cpf: string): Promise<Condutor | null> {
    const res = await query('SELECT * FROM CONDUTOR WHERE cpf = $1', [cpf]);
    return res.rows[0] || null;
  }

  async create(data: {
    nm_condutor: string;
    cpf: string;
    telefone: string;
    tam_camisa: string;
    ativo?: boolean;
  }): Promise<Condutor> {
    const res = await query(
      `INSERT INTO CONDUTOR (nm_condutor, cpf, telefone, tam_camisa, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.nm_condutor,
        data.cpf,
        data.telefone,
        data.tam_camisa,
        data.ativo ?? true,
      ]
    );
    return res.rows[0];
  }

  async update(
    id: number,
    data: {
      nm_condutor: string;
      cpf: string;
      telefone: string;
      tam_camisa: string;
      ativo: boolean;
    }
  ): Promise<Condutor | null> {
    const res = await query(
      `UPDATE CONDUTOR
       SET nm_condutor = $1,
           cpf = $2,
           telefone = $3,
           tam_camisa = $4,
           ativo = $5
       WHERE cd_condutor = $6
       RETURNING *`,
      [
        data.nm_condutor,
        data.cpf,
        data.telefone,
        data.tam_camisa,
        data.ativo,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async toggleStatus(id: number): Promise<Condutor | null> {
    const res = await query(
      `UPDATE CONDUTOR
       SET ativo = NOT ativo
       WHERE cd_condutor = $1
       RETURNING *`,
      [id]
    );
    return res.rows[0] || null;
  }

  async hasDuplas(id: number): Promise<boolean> {
    const res = await query('SELECT 1 FROM DUPLA WHERE cd_condutor = $1 LIMIT 1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const res = await query('DELETE FROM CONDUTOR WHERE cd_condutor = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
