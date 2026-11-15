import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../../src/services/analyticsService';
import { AnalyticsRepository } from '../../src/repositories/analyticsRepository';

vi.mock('../../src/repositories/analyticsRepository');

describe('AnalyticsService Unit Tests', () => {
  let service: AnalyticsService;
  let repoMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AnalyticsService();
    repoMock = (service as any).analyticsRepository;
  });

  it('deve retornar os rankings com limite padrão de 5', async () => {
    repoMock.getTopRunners = vi.fn().mockResolvedValue([{ cd_condutor: 1, total_participacoes: 10 }]);
    repoMock.getTopWheelchairUsers = vi.fn().mockResolvedValue([{ cd_cadeirante: 2, total_participacoes: 8 }]);
    repoMock.getTopEvents = vi.fn().mockResolvedValue([{ cd_evento: 3, total_duplas: 15 }]);

    const result = await service.getRankings();

    expect(repoMock.getTopRunners).toHaveBeenCalledWith(5);
    expect(repoMock.getTopWheelchairUsers).toHaveBeenCalledWith(5);
    expect(repoMock.getTopEvents).toHaveBeenCalledWith(5);
    expect(result.top_runners).toHaveLength(1);
    expect(result.top_wheelchair_users).toHaveLength(1);
    expect(result.top_events).toHaveLength(1);
  });

  it('deve aceitar limite customizado', async () => {
    repoMock.getTopRunners = vi.fn().mockResolvedValue([]);
    repoMock.getTopWheelchairUsers = vi.fn().mockResolvedValue([]);
    repoMock.getTopEvents = vi.fn().mockResolvedValue([]);

    await service.getRankings(10);

    expect(repoMock.getTopRunners).toHaveBeenCalledWith(10);
  });
});
