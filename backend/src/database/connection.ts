import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const useSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false' && Boolean(process.env.DATABASE_URL));

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number.parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'pernas_solidarias',
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
