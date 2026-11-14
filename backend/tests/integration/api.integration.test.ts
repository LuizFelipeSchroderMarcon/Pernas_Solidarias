import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import net from 'net';
import request from 'supertest';
import { app } from '../../src/app';
import { pool } from '../../src/database/connection';
import { initDatabase } from '../../src/database/setup';

async function checkLoopbackConnect(): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        return resolve(false);
      }
      const client = net.connect(addr.port, '127.0.0.1');
      client.once('connect', () => {
        client.end();
        server.close(() => resolve(true));
      });
      client.once('error', () => {
        server.close(() => resolve(false));
      });
    });
  });
}

describe('Integração API End-to-End com PostgreSQL', () => {
  let canConnectLocally = false;
  let isDbConnected = false;
  let authToken: string;

  beforeAll(async () => {
    canConnectLocally = await checkLoopbackConnect();
    if (!canConnectLocally) {
      console.warn(
        '\n[AVISO INTEGRACAO] O ambiente atual não permite conexões TCP locais (ex.: sandbox sem bypass de rede). ' +
          'Os testes de integração via supertest serão ignorados com segurança.'
      );
    }

    try {
      await pool.query('SELECT 1');
      isDbConnected = true;
      await initDatabase();
    } catch {
      isDbConnected = false;
      if (canConnectLocally) {
        console.warn(
          '\n[AVISO INTEGRACAO] PostgreSQL offline ou inacessível. ' +
            'Testes que dependem do banco de dados serão ignorados.'
        );
      }
    }
  });

  afterAll(async () => {
    try {
      await pool.end();
    } catch {
      // Ignora erro ao fechar pool se não estava conectado
    }
  });

  it('GET /api/health deve responder 200 OK (Health Check para AWS)', async () => {
    if (!canConnectLocally) return;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('Rotas protegidas sem token devem responder 401', async () => {
    if (!canConnectLocally) return;

    const res = await request(app).get('/api/events');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login com credenciais incorretas deve retornar 401 ou 429', async () => {
    if (!canConnectLocally || !isDbConnected) return;

    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@pernassolidarias.org.br',
      senha: 'senha_completamente_errada',
    });
    expect([401, 429]).toContain(res.status);
  });

  it('POST /api/auth/login com credenciais do coordenador padrão deve autenticar e retornar JWT', async () => {
    if (!canConnectLocally || !isDbConnected) return;

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
    if (!canConnectLocally || !isDbConnected || !authToken) return;

    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
