import { query } from '../database/connection';
import { User } from '../models/types';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const res = await query('SELECT * FROM "USER" WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const res = await query('SELECT cd_user, email, created_at FROM "USER" WHERE cd_user = $1', [id]);
    return res.rows[0] || null;
  }

  async create(email: string, senhaHash: string): Promise<User> {
    const res = await query(
      'INSERT INTO "USER" (email, senha) VALUES ($1, $2) RETURNING cd_user, email, created_at',
      [email, senhaHash]
    );
    return res.rows[0];
  }
}
