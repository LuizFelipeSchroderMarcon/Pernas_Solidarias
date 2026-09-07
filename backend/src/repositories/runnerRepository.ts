import { query } from '../database/connection';
import { Condutor } from '../models/types';

export class RunnerRepository {
  async findAll(active?: boolean, search?: string): Promise<Condutor[]> {
    let sql = 'SELECT * FROM CONDUTOR WHERE 1=1';
    const params: any[] = [];

    if (active !== undefined) {
      params.push(active);
      sql += ` AND ativo = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (nm_condutor ILIKE $${params.length} OR cpf ILIKE $${params.length})`;
    }

    sql += ' ORDER BY nm_condutor ASC';

    const result = await query(sql, params);
    return result.rows;
  }

  async findById(id: number): Promise<Condutor | null> {
    const result = await query('SELECT * FROM CONDUTOR WHERE cd_condutor = $1', [id]);
    return result.rows[0] || null;
  }

  async findByCpf(cpf: string): Promise<Condutor | null> {
    const result = await query('SELECT * FROM CONDUTOR WHERE cpf = $1', [cpf]);
    return result.rows[0] || null;
  }

  async create(data: {
    nm_condutor: string;
    cpf: string;
    telefone: string;
    tam_camisa: string;
    data_nascimento?: string | Date;
    sexo?: string;
    ativo?: boolean;
  }): Promise<Condutor> {
    const result = await query(
      `INSERT INTO CONDUTOR (nm_condutor, cpf, telefone, tam_camisa, data_nascimento, sexo, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.nm_condutor,
        data.cpf,
        data.telefone,
        data.tam_camisa,
        data.data_nascimento || null,
        data.sexo || null,
        data.ativo ?? true,
      ]
    );
    return result.rows[0];
  }

  async update(
    id: number,
    data: {
      nm_condutor: string;
      cpf: string;
      telefone: string;
      tam_camisa: string;
      data_nascimento?: string | Date;
      sexo?: string;
      ativo: boolean;
    }
  ): Promise<Condutor | null> {
    const result = await query(
      `UPDATE CONDUTOR
       SET nm_condutor = $1,
           cpf = $2,
           telefone = $3,
           tam_camisa = $4,
           data_nascimento = $5,
           sexo = $6,
           ativo = $7
       WHERE cd_condutor = $8
       RETURNING *`,
      [
        data.nm_condutor,
        data.cpf,
        data.telefone,
        data.tam_camisa,
        data.data_nascimento || null,
        data.sexo || null,
        data.ativo,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async toggleStatus(id: number): Promise<Condutor | null> {
    const result = await query(
      `UPDATE CONDUTOR
       SET ativo = NOT ativo
       WHERE cd_condutor = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  async hasPairs(id: number): Promise<boolean> {
    const result = await query('SELECT 1 FROM DUPLA WHERE cd_condutor = $1 LIMIT 1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM CONDUTOR WHERE cd_condutor = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

// Alias for backward compatibility
export { RunnerRepository as CondutorRepository };
