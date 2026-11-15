import { describe, it, expect, vi } from 'vitest';
import { app } from '../../src/app';
import { routes } from '../../src/routes';
import { authRoutes } from '../../src/routes/authRoutes';
import { eventRoutes } from '../../src/routes/eventRoutes';
import { runnerRoutes } from '../../src/routes/runnerRoutes';
import { wheelchairUserRoutes } from '../../src/routes/wheelchairUserRoutes';
import { pairRoutes } from '../../src/routes/pairRoutes';
import { exportRoutes } from '../../src/routes/exportRoutes';
import analyticsRoutes from '../../src/routes/analyticsRoutes';

describe('Routes Definition & App Setup', () => {
  it('deve inicializar o app Express com middlewares configurados', () => {
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
  });

  it('deve carregar app com CORS_ORIGIN customizado', async () => {
    vi.resetModules();
    process.env.CORS_ORIGIN = 'http://site1.com, http://site2.com';
    const { app: customApp } = await import('../../src/app');
    expect(customApp).toBeDefined();
    delete process.env.CORS_ORIGIN;
  });

  it('deve exportar todos os roteadores devidamente configurados', () => {
    expect(routes).toBeDefined();
    expect(authRoutes).toBeDefined();
    expect(eventRoutes).toBeDefined();
    expect(runnerRoutes).toBeDefined();
    expect(wheelchairUserRoutes).toBeDefined();
    expect(pairRoutes).toBeDefined();
    expect(exportRoutes).toBeDefined();
    expect(analyticsRoutes).toBeDefined();
  });

  it('deve possuir rotas registradas em cada roteador', () => {
    expect(authRoutes.stack.length).toBeGreaterThan(0);
    expect(eventRoutes.stack.length).toBeGreaterThan(0);
    expect(runnerRoutes.stack.length).toBeGreaterThan(0);
    expect(wheelchairUserRoutes.stack.length).toBeGreaterThan(0);
    expect(pairRoutes.stack.length).toBeGreaterThan(0);
    expect(exportRoutes.stack.length).toBeGreaterThan(0);
    expect(analyticsRoutes.stack.length).toBeGreaterThan(0);
  });
});