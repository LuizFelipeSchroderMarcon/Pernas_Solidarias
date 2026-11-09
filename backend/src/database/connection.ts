import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'pernas_solidarias',
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
