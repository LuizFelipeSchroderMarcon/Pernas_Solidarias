import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventRepository } from '../../src/repositories/eventRepository';
import { RunnerRepository } from '../../src/repositories/runnerRepository';
import { WheelchairUserRepository } from '../../src/repositories/wheelchairUserRepository';
import { PairRepository } from '../../src/repositories/pairRepository';
import { AnalyticsRepository } from '../../src/repositories/analyticsRepository';
import { UserRepository } from '../../src/repositories/userRepository';
import * as db from '../../src/database/connection';

vi.mock('../../src/database/connection', () => ({
  query: vi.fn(),
  pool: { query: vi.fn(), on: vi.fn() },
}));

describe('Repositories Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EventRepository', () => {
    const repo = new EventRepository();

    it('deve executar findAll com status passados e search', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [{ cd_evento: 1 }] } as any);
      const res = await repo.findAll('passados', 'corrida');
      expect(res).toHaveLength(1);
    });

    it('deve executar findAll com status futuros sem search', async () => {
      vi.mocked(db.query).mockResolvedValueOnce({ rows: [] } as any);
      const res = await repo.findAll('futuros');
      expect(res).toHaveLength(0);
    });

    it('deve executar findById, create, update e delete', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ cd_evento: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_evento: 2 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_evento: 1, nm_evento: 'Novo' }] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);

      expect(await repo.findById(1)).toEqual({ cd_evento: 1 });
      expect(await repo.create({ nm_evento: 'Novo', dt_evento: '2026-10-10' })).toEqual({ cd_evento: 2 });
      expect(await repo.update(1, { nm_evento: 'Novo' })).toEqual({ cd_evento: 1, nm_evento: 'Novo' });
      await repo.delete(1);
    });
  });

  describe('RunnerRepository', () => {
    const runnerRepo = new RunnerRepository();

    it('deve testar métodos de RunnerRepository', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ cd_condutor: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_condutor: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_condutor: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_condutor: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_condutor: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_condutor: 1, ativo: false }] } as any)
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ '?column?': 1 }] } as any)
        .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any);

      expect(await runnerRepo.findAll(true, 'Carlos')).toHaveLength(1);
      expect(await runnerRepo.findById(1)).toBeDefined();
      expect(await runnerRepo.findByCpf('12345678901')).toBeDefined();
      expect(await runnerRepo.create({ nm_condutor: 'C', cpf: '1', telefone: '1', tam_camisa: 'M', data_nascimento: '1990-01-01', sexo: 'M' })).toBeDefined();
      expect(await runnerRepo.update(1, { nm_condutor: 'C2' })).toBeDefined();
      expect(await runnerRepo.toggleStatus(1)).toBeDefined();
      expect(await runnerRepo.hasPairs(1)).toBe(true);
      await runnerRepo.delete(1);
    });
  });

  describe('WheelchairUserRepository', () => {
    const wheelchairRepo = new WheelchairUserRepository();

    it('deve testar métodos de WheelchairUserRepository', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ cd_cadeirante: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_cadeirante: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_cadeirante: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_cadeirante: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_cadeirante: 1 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_cadeirante: 1, ativo: false }] } as any)
        .mockResolvedValueOnce({ rowCount: 0, rows: [] } as any)
        .mockResolvedValueOnce({ rowCount: 1, rows: [] } as any);

      expect(await wheelchairRepo.findAll(false, 'Ana')).toHaveLength(1);
      expect(await wheelchairRepo.findById(1)).toBeDefined();
      expect(await wheelchairRepo.findByCpf('12345678901')).toBeDefined();
      expect(await wheelchairRepo.create({ nm_cadeirante: 'A', cpf: '1', telefone: '1', tam_camisa: 'M', data_nascimento: '1990-01-01', sexo: 'F' })).toBeDefined();
      expect(await wheelchairRepo.update(1, { nm_cadeirante: 'A2' })).toBeDefined();
      expect(await wheelchairRepo.toggleStatus(1)).toBeDefined();
      expect(await wheelchairRepo.hasPairs(1)).toBe(false);
      await wheelchairRepo.delete(1);
    });
  });

  describe('PairRepository & AnalyticsRepository & UserRepository', () => {
    const pairRepo = new PairRepository();
    const analyticsRepo = new AnalyticsRepository();
    const userRepo = new UserRepository();

    it('deve testar métodos do PairRepository', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ cd_dupla: 1, id: 1 }],
        rowCount: 1,
      } as any);

      expect(await pairRepo.findPrioritizedWheelchairUsers(1)).toHaveLength(1);
      expect(await pairRepo.findPrioritizedRunners(1)).toHaveLength(1);
      expect(await pairRepo.findByEventId(1)).toHaveLength(1);
      expect(await pairRepo.findById(1)).toBeDefined();
      expect(await pairRepo.create(1, 1, 2)).toBeDefined();
      expect(await pairRepo.update(1, 1, 3)).toBeDefined();
      expect(await pairRepo.isParticipantInEvent(1, 1, 'cadeirante')).toBe(true);
      await pairRepo.deleteById(1);
      await pairRepo.deleteByEventId(1);
      expect(await pairRepo.findHistory({ eventId: 1, startDate: '2026-01-01', endDate: '2026-12-31', search: 'João' })).toHaveLength(1);
    });

    it('deve testar AnalyticsRepository', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ cd_condutor: 1, total_participacoes: 5 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_cadeirante: 1, total_participacoes: 4 }] } as any)
        .mockResolvedValueOnce({ rows: [{ cd_evento: 1, total_duplas: 10 }] } as any);

      expect(await analyticsRepo.getTopRunners(5)).toHaveLength(1);
      expect(await analyticsRepo.getTopWheelchairUsers(5)).toHaveLength(1);
      expect(await analyticsRepo.getTopEvents(5)).toHaveLength(1);
    });

    it('deve testar UserRepository', async () => {
      vi.mocked(db.query)
        .mockResolvedValueOnce({ rows: [{ id: 1, email: 'teste@email.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, email: 'teste@email.com' }] } as any)
        .mockResolvedValueOnce({ rows: [{ id: 1, email: 'teste@email.com' }] } as any);

      expect(await userRepo.findByEmail('teste@email.com')).toBeDefined();
      expect(await userRepo.findById(1)).toBeDefined();
      expect(await userRepo.create('teste@email.com', 'hash123')).toBeDefined();
    });
  });
});