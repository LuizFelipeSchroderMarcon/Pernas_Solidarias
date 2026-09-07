import { query } from '../database/connection';
import { User } from '../models/types';

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM "USER" WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await query(
      'SELECT cd_user, email, created_at FROM "USER" WHERE cd_user = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const result = await query(
      'INSERT INTO "USER" (email, senha) VALUES ($1, $2) RETURNING cd_user, email, created_at',
      [email, passwordHash]
    );
    return result.rows[0];
  }

  async incrementFailedAttempts(userId: number): Promise<User> {
    const result = await query(
      `UPDATE "USER"
       SET tentativas_falhas = tentativas_falhas + 1,
           bloqueado_ate = CASE 
             WHEN tentativas_falhas + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
             ELSE bloqueado_ate
           END
       WHERE cd_user = $1
       RETURNING cd_user, email, tentativas_falhas, bloqueado_ate, created_at`,
      [userId]
    );
    return result.rows[0];
  }

  async resetFailedAttempts(userId: number): Promise<void> {
    await query(
      `UPDATE "USER"
       SET tentativas_falhas = 0,
           bloqueado_ate = NULL
       WHERE cd_user = $1`,
      [userId]
    );
  }
}
