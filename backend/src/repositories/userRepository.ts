import { query } from '../database/connection';
import { User, UserWithLockStatus } from '../models/types';

const REMAINING_SECONDS_SQL = `
  CASE
    WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW()
    THEN CEIL(EXTRACT(EPOCH FROM (bloqueado_ate - NOW())))::INT
    ELSE 0
  END AS remaining_seconds
`;

export class UserRepository {
  async findByEmail(email: string): Promise<UserWithLockStatus | null> {
    const result = await query(
      `SELECT *,
              ${REMAINING_SECONDS_SQL}
       FROM "USER"
       WHERE LOWER(email) = LOWER(TRIM($1))`,
      [email]
    );
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

  async incrementFailedAttempts(userId: number): Promise<UserWithLockStatus> {
    const result = await query(
      `UPDATE "USER"
       SET tentativas_falhas = CASE
             WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW() THEN tentativas_falhas
             WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate <= NOW() THEN 1
             ELSE tentativas_falhas + 1
           END,
           bloqueado_ate = CASE
             WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW() THEN bloqueado_ate
             WHEN bloqueado_ate IS NOT NULL AND bloqueado_ate <= NOW() THEN NULL
             WHEN tentativas_falhas + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
             ELSE bloqueado_ate
           END
       WHERE cd_user = $1
       RETURNING cd_user, email, tentativas_falhas, bloqueado_ate, created_at,
                 ${REMAINING_SECONDS_SQL}`,
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
