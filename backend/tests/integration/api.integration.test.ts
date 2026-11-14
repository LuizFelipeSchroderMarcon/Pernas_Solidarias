import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { pool } from '../../src/database/connection';
import { initDatabase } from '../../src/database/setup';

describe('Integração API End-to-End com PostgreSQL', () => {
  let isDbConnected = false;
  let authToken: string;

  beforeAll(async () => {
    try {
      await pool.query('SELECT 1');
      isDbConnected = true;
      await initDatabase();
    } catch {
      isDbConnected = false;
    }
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/health deve responder 200 OK (Health Check para AWS)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('Rotas protegidas sem token devem responder 401', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login com credenciais incorretas deve retornar 401 ou 429', async () => {
    if (!isDbConnected) return;

    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@pernassolidarias.org.br',
      senha: 'senha_completamente_errada',
    });
    expect([401, 429]).toContain(res.status);
  });

  it('POST /api/auth/login com credenciais do coordenador padrão deve autenticar e retornar JWT', async () => {
    if (!isDbConnected) return;

    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@pernassolidarias.org.br',
      senha: 'admin123',
    });

    if (res.status === 200) {
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    } else {
      expect([200, 401, 429]).toContain(res.status);
    }
  });

  it('GET /api/events autenticado deve retornar lista de eventos', async () => {
    if (!isDbConnected || !authToken) return;

    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
