import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../src/services/api';
import { authService } from '../src/services/authService';
import { eventService } from '../src/services/eventService';
import { pairService } from '../src/services/pairService';
import { participantService } from '../src/services/participantService';
import { analyticsService } from '../src/services/analyticsService';
import { exportService } from '../src/services/exportService';
import { mensagemDeErro } from '../src/services/apiError';

vi.mock('../src/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../src/utils/formatters', async () => {
  const actual: any = await vi.importActual('../src/utils/formatters');
  return {
    ...actual,
    downloadBlob: vi.fn(),
  };
});

describe('Frontend Services Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authService', () => {
    it('deve chamar login e retornar dados', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { token: 'tok', user: { id: 1 } } });
      const res = await authService.login('admin@test.com', '123456');
      expect(res.token).toBe('tok');

      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { token: 'tok2', user: { id: 2 } } } });
      const res2 = await authService.login('admin2@test.com', '123456');
      expect(res2.token).toBe('tok2');
    });

    it('deve chamar register e me', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { message: 'Criado', data: { id: 1 } } });
      const reg = await authService.register('admin@test.com', '123456');
      expect(reg.message).toBe('Criado');

      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { id: 1 } } });
      const me = await authService.me();
      expect(me.user.id).toBe(1);

      vi.mocked(api.get).mockResolvedValueOnce({ data: { user: { id: 2 } } });
      const meDirect = await authService.me();
      expect(meDirect.user.id).toBe(2);
    });
  });

  describe('eventService', () => {
    it('deve listar eventos, buscar por id, criar, atualizar e excluir', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ cd_evento: 1 }] } });
      expect(await eventService.getEvents('todos', 'busca')).toHaveLength(1);

      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ cd_evento: 1 }] } });
      expect(await eventService.getEvents()).toHaveLength(1);

      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { cd_evento: 1 } } });
      expect((await eventService.getEventById(1)).cd_evento).toBe(1);

      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { cd_evento: 2 } } });
      expect(await eventService.createEvent({ nm_evento: 'Novo', dt_evento: '2026-10-10' })).toBeDefined();

      vi.mocked(api.put).mockResolvedValueOnce({ data: { data: { cd_evento: 1 } } });
      expect(await eventService.updateEvent(1, { nm_evento: 'Atualizado' })).toBeDefined();

      vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Ok' } });
      await expect(eventService.deleteEvent(1)).resolves.not.toThrow();
    });
  });

  describe('pairService', () => {
    it('deve gerar duplas, salvar, criar, editar, listar e obter histórico', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { total_duplas: 2, duplas: [] } } });
      expect(await pairService.generatePairs(1, true)).toBeDefined();

      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: [] } });
      expect(await pairService.savePairs(1, [])).toBeDefined();

      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { cd_dupla: 1 } } });
      expect(await pairService.createPair(1, 1, 2)).toBeDefined();

      vi.mocked(api.put).mockResolvedValueOnce({ data: { data: { cd_dupla: 1 } } });
      expect(await pairService.editPair(1, 1, 3)).toBeDefined();

      vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Ok' } });
      await expect(pairService.deletePair(1)).resolves.not.toThrow();

      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });
      expect(await pairService.listByEvent(1)).toBeDefined();

      vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Ok' } });
      await expect(pairService.clearPairs(1)).resolves.not.toThrow();

      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });
      expect(await pairService.getHistory()).toHaveLength(0);
    });
  });

  describe('participantService', () => {
    it('deve listar cadeirantes e condutores e realizar operações CRUD', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ cd_cadeirante: 1 }] } });
      expect(await participantService.getCadeirantes(true, 'João')).toHaveLength(1);

      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { cd_cadeirante: 1 } } });
      expect((await participantService.getCadeiranteById(1)).cd_cadeirante).toBe(1);

      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { cd_cadeirante: 1 } } });
      expect(await participantService.createCadeirante({} as any)).toBeDefined();

      vi.mocked(api.put).mockResolvedValueOnce({ data: { data: { cd_cadeirante: 1 } } });
      expect(await participantService.updateCadeirante(1, {} as any)).toBeDefined();

      vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: { cd_cadeirante: 1, ativo: false } } });
      expect(await participantService.toggleCadeiranteStatus(1)).toBeDefined();

      vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Ok' } });
      await expect(participantService.deleteCadeirante(1)).resolves.not.toThrow();

      // Condutores
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [{ cd_condutor: 1 }] } });
      expect(await participantService.getCondutores(false, 'Maria')).toHaveLength(1);

      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { cd_condutor: 1 } } });
      expect((await participantService.getCondutorById(1)).cd_condutor).toBe(1);

      vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { cd_condutor: 1 } } });
      expect(await participantService.createCondutor({} as any)).toBeDefined();

      vi.mocked(api.put).mockResolvedValueOnce({ data: { data: { cd_condutor: 1 } } });
      expect(await participantService.updateCondutor(1, {} as any)).toBeDefined();

      vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: { cd_condutor: 1, ativo: false } } });
      expect(await participantService.toggleCondutorStatus(1)).toBeDefined();

      vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Ok' } });
      await expect(participantService.deleteCondutor(1)).resolves.not.toThrow();
    });
  });

  describe('analyticsService & exportService', () => {
    it('deve buscar rankings em analyticsService', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: { top_runners: [], top_wheelchair_users: [], top_events: [] } } });
      expect(await analyticsService.getRankings(5)).toBeDefined();
    });

    it('deve chamar exportEventReport em exportService com os formatos e flags corretos', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: new Blob(['teste']),
        headers: { 'content-disposition': 'attachment; filename="duplas.xlsx"' },
      });
      await exportService.exportEventReport(1, true, 'xlsx', 'Corrida');
      expect(api.get).toHaveBeenCalledWith(
        '/export/event/1',
        expect.objectContaining({ params: { includeCpf: true, format: 'xlsx' } })
      );
    });

    it('deve sanitizar nome do arquivo quando nao houver content-disposition', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: new Blob(['teste']),
        headers: {},
      });
      await exportService.exportEventReport(1, false, 'csv', '___Corrida Inclusão 2026___');
      expect(api.get).toHaveBeenCalledWith(
        '/export/event/1',
        expect.objectContaining({ params: { includeCpf: false, format: 'csv' } })
      );

      vi.mocked(api.get).mockResolvedValueOnce({
        data: new Blob(['teste']),
        headers: {},
      });
      await exportService.exportEventReport(2, true, 'xlsx');
    });
  });

  describe('apiError utilities', () => {
    it('deve extrair mensagens de erro', () => {
      expect(mensagemDeErro(new Error('Falhou'), 'Default')).toBe('Falhou');
      expect(
        mensagemDeErro(
          { isAxiosError: true, response: { data: { message: 'Servidor caiu' } } },
          'Default'
        )
      ).toBe('Servidor caiu');
      expect(mensagemDeErro('desconhecido', 'Default')).toBe('Default');
    });
  });
});