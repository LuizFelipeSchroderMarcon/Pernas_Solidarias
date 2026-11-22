import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import {
  metricsHandler,
  metricsMiddleware,
  metricsRegistry,
} from '../../src/middlewares/metricsMiddleware';

describe('Metrics Middleware & Endpoint', () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics();
  });

  it('deve registrar métricas com baseUrl + route.path quando a rota Express é resolvida', async () => {
    const req = {
      path: '/api/health',
      method: 'GET',
      baseUrl: '/api',
      route: { path: '/health' },
    } as any;
    const res = new EventEmitter() as any;
    res.statusCode = 200;
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    const output = await metricsRegistry.metrics();
    expect(output).toContain('http_requests_total');
    expect(output).toContain('http_request_duration_seconds');
    expect(output).toContain('route="/api/health"');
    expect(output).toContain('status_code="200"');
  });

  it('não deve contabilizar requisições feitas ao próprio /metrics', async () => {
    const req = { path: '/metrics', method: 'GET' } as any;
    const res = new EventEmitter() as any;
    res.statusCode = 200;
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    const output = await metricsRegistry.metrics();
    expect(output).not.toContain('route="/metrics"');
  });

  it('deve registrar métricas usando req.path quando não há req.route definido', async () => {
    const req = { path: '/nao-encontrada', method: 'GET', baseUrl: '' } as any;
    const res = new EventEmitter() as any;
    res.statusCode = 404;
    const next = vi.fn();

    metricsMiddleware(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    const output = await metricsRegistry.metrics();
    expect(output).toContain('route="/nao-encontrada"');
    expect(output).toContain('status_code="404"');
  });

  it('deve responder corretamente no metricsHandler com o content-type do Prometheus', async () => {
    const res = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await metricsHandler({} as any, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', metricsRegistry.contentType);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('http_requests_total'));
  });
});
