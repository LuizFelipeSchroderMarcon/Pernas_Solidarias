import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockEventService,
  mockExportService,
  mockRunnerService,
  mockWheelchairUserService,
  mockPairFormationService,
} = vi.hoisted(() => ({
  mockEventService: {
    listAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockExportService: {
    generateCsvPairs: vi.fn(),
    generateExcelPairs: vi.fn(),
  },
  mockRunnerService: {
    listAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
    delete: vi.fn(),
  },
  mockWheelchairUserService: {
    listAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
    delete: vi.fn(),
  },
  mockPairFormationService: {
    generateAutomaticPairs: vi.fn(),
    savePairs: vi.fn(),
    createPair: vi.fn(),
    editPair: vi.fn(),
    deletePair: vi.fn(),
    listByEvent: vi.fn(),
    clearEventPairs: vi.fn(),
    getHistory: vi.fn(),
  },
}));

vi.mock('../../src/services/authService', () => {
  return {
    AuthService: vi.fn().mockImplementation(() => ({
      register: vi.fn().mockResolvedValue({ id: 1, email: 'teste@email.com' }),
      login: vi.fn().mockResolvedValue({ token: 'jwt.token.valido', user: { id: 1 } }),
      getMe: vi.fn().mockResolvedValue({ id: 1, email: 'teste@email.com' }),
    })),
  };
});

vi.mock('../../src/services/analyticsService', () => {
  return {
    AnalyticsService: vi.fn().mockImplementation(() => ({
      getRankings: vi.fn().mockResolvedValue({ top_runners: [], top_wheelchair_users: [], top_events: [] }),
    })),
  };
});

vi.mock('../../src/services/eventService', () => ({
  EventService: vi.fn().mockImplementation(() => mockEventService),
}));

vi.mock('../../src/services/exportService', () => ({
  ExportService: vi.fn().mockImplementation(() => mockExportService),
}));

vi.mock('../../src/services/runnerService', () => ({
  RunnerService: vi.fn().mockImplementation(() => mockRunnerService),
}));

vi.mock('../../src/services/wheelchairUserService', () => ({
  WheelchairUserService: vi.fn().mockImplementation(() => mockWheelchairUserService),
}));

vi.mock('../../src/services/pairFormationService', () => ({
  PairFormationService: vi.fn().mockImplementation(() => mockPairFormationService),
}));

import { AuthController } from '../../src/controllers/authController';
import { AnalyticsController } from '../../src/controllers/analyticsController';
import { EventController } from '../../src/controllers/eventController';
import { ExportController } from '../../src/controllers/exportController';
import { RunnerController } from '../../src/controllers/runnerController';
import { WheelchairUserController } from '../../src/controllers/wheelchairUserController';
import { PairController } from '../../src/controllers/pairController';

describe('Controllers Unit Tests', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {}, headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
    next = vi.fn();

    mockEventService.listAll.mockResolvedValue([{ cd_evento: 1, nm_evento: 'Corrida' }]);
    mockEventService.getById.mockResolvedValue({ cd_evento: 1, nm_evento: 'Corrida' });
    mockEventService.create.mockResolvedValue({ cd_evento: 2, nm_evento: 'Novo Evento' });
    mockEventService.update.mockResolvedValue({ cd_evento: 1, nm_evento: 'Atualizado' });
    mockEventService.delete.mockResolvedValue(true);

    mockExportService.generateCsvPairs.mockResolvedValue({ csv: 'id;nome\n1;Joao', filename: 'duplas.csv' });
    mockExportService.generateExcelPairs.mockResolvedValue({ buffer: Buffer.from('excel'), filename: 'duplas.xlsx' });

    mockRunnerService.listAll.mockResolvedValue([]);
    mockRunnerService.getById.mockResolvedValue({ cd_condutor: 1 });
    mockRunnerService.create.mockResolvedValue({ cd_condutor: 2 });
    mockRunnerService.update.mockResolvedValue({ cd_condutor: 1 });
    mockRunnerService.toggleStatus.mockResolvedValue({ cd_condutor: 1, ativo: false });
    mockRunnerService.delete.mockResolvedValue(true);

    mockWheelchairUserService.listAll.mockResolvedValue([]);
    mockWheelchairUserService.getById.mockResolvedValue({ cd_cadeirante: 1 });
    mockWheelchairUserService.create.mockResolvedValue({ cd_cadeirante: 2 });
    mockWheelchairUserService.update.mockResolvedValue({ cd_cadeirante: 1 });
    mockWheelchairUserService.toggleStatus.mockResolvedValue({ cd_cadeirante: 1, ativo: false });
    mockWheelchairUserService.delete.mockResolvedValue(true);

    mockPairFormationService.generateAutomaticPairs.mockResolvedValue({ total_duplas: 2, duplas: [] });
    mockPairFormationService.savePairs.mockResolvedValue([]);
    mockPairFormationService.createPair.mockResolvedValue({ cd_dupla: 1 });
    mockPairFormationService.editPair.mockResolvedValue({ cd_dupla: 1 });
    mockPairFormationService.deletePair.mockResolvedValue(true);
    mockPairFormationService.listByEvent.mockResolvedValue({ duplas: [] });
    mockPairFormationService.clearEventPairs.mockResolvedValue(true);
    mockPairFormationService.getHistory.mockResolvedValue([]);
  });

  describe('AuthController', () => {
    const controller = new AuthController();

    it('deve registrar usuário', async () => {
      req.body = { email: 'user@test.com', senha: '123' };
      await controller.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve fazer login', async () => {
      req.body = { email: 'user@test.com', senha: '123' };
      await controller.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar dados do usuário autenticado', async () => {
      req.user = { userId: 1 };
      await controller.me(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve retornar 401 se me() não tiver usuário na requisição', async () => {
      req.user = undefined;
      await controller.me(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('AnalyticsController', () => {
    const controller = new AnalyticsController();

    it('deve buscar rankings com limit default ou customizado', async () => {
      req.query = { limit: '10' };
      await controller.getRankings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('EventController', () => {
    const controller = new EventController();

    it('deve listar eventos, exibir por id, criar, atualizar e deletar', async () => {
      req.query = { status: 'todos', search: 'corrida' };
      await controller.index(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      req.params = { id: '1' };
      await controller.show(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      req.body = { nm_evento: 'Novo' };
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      await controller.update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve repassar erros de EventController para next', async () => {
      const err = new Error('Falha no evento');
      mockEventService.listAll.mockRejectedValueOnce(err);
      await controller.index(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockEventService.getById.mockRejectedValueOnce(err);
      req.params = { id: '1' };
      await controller.show(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockEventService.create.mockRejectedValueOnce(err);
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockEventService.update.mockRejectedValueOnce(err);
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockEventService.delete.mockRejectedValueOnce(err);
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('ExportController', () => {
    const controller = new ExportController();

    it('deve retornar 400 se eventId for inválido', async () => {
      req.params = { eventId: 'abc' };
      await controller.exportEvent(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve exportar em CSV quando solicitado', async () => {
      req.params = { eventId: '1' };
      req.query = { formato: 'csv' };
      await controller.exportEvent(req, res, next);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve exportar em Excel por padrão', async () => {
      req.params = { eventId: '1' };
      req.query = { formato: 'xlsx' };
      await controller.exportEvent(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve repassar erro de ExportController para next', async () => {
      const err = new Error('Falha no export');
      mockExportService.generateExcelPairs.mockRejectedValueOnce(err);
      req.params = { eventId: '1' };
      req.query = { formato: 'xlsx' };
      await controller.exportEvent(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('RunnerController & WheelchairUserController', () => {
    const runnerController = new RunnerController();
    const wheelchairController = new WheelchairUserController();

    it('deve executar ações completas de Condutor', async () => {
      req.query = { ativo: 'true', search: 'Silva' };
      await runnerController.index(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      req.params = { id: '1' };
      await runnerController.show(req, res, next);
      await runnerController.update(req, res, next);
      await runnerController.toggleStatus(req, res, next);
      await runnerController.delete(req, res, next);

      req.body = { nm_condutor: 'Condutor Novo' };
      await runnerController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve executar ações completas de Cadeirante', async () => {
      req.query = { active: 'true' };
      await wheelchairController.index(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      req.params = { id: '1' };
      await wheelchairController.show(req, res, next);
      await wheelchairController.update(req, res, next);
      await wheelchairController.toggleStatus(req, res, next);
      await wheelchairController.delete(req, res, next);

      req.body = { nm_cadeirante: 'Cadeirante Novo' };
      await wheelchairController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('deve repassar erros de RunnerController e WheelchairUserController para next', async () => {
      const err = new Error('Falha no banco');
      mockRunnerService.listAll.mockRejectedValueOnce(err);
      await runnerController.index(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockRunnerService.getById.mockRejectedValueOnce(err);
      req.params = { id: '1' };
      await runnerController.show(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockWheelchairUserService.listAll.mockRejectedValueOnce(err);
      await wheelchairController.index(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockWheelchairUserService.getById.mockRejectedValueOnce(err);
      req.params = { id: '1' };
      await wheelchairController.show(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('PairController', () => {
    const controller = new PairController();

    it('deve testar rotas e validações de duplas', async () => {
      // generatePairs
      req.params = { eventId: '1' };
      req.query = { preview: 'true' };
      await controller.generatePairs(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      // savePairs
      req.body = { pairs: [{ cd_cadeirante: 1, cd_condutor: 2 }] };
      await controller.savePairs(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      // createPair
      req.body = { wheelchairUserId: '1', runnerId: '2' };
      await controller.createPair(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);

      // editPair
      req.params = { pairId: '10' };
      await controller.editPair(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);

      // deletePair & clearPairs & history & listByEvent
      await controller.deletePair(req, res, next);
      await controller.clearPairs(req, res, next);
      await controller.listByEvent(req, res, next);
      await controller.history(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('deve validar parâmetros inválidos no PairController', async () => {
      req.params = { eventId: 'invalido' };
      await controller.generatePairs(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);

      req.params = { eventId: '1' };
      req.body = { pairs: 'nao-e-array' };
      await controller.savePairs(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('deve repassar erros de PairController para next', async () => {
      const err = new Error('Falha em duplas');
      mockPairFormationService.generateAutomaticPairs.mockRejectedValueOnce(err);
      req.params = { eventId: '1' };
      await controller.generatePairs(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockPairFormationService.savePairs.mockRejectedValueOnce(err);
      req.params = { eventId: '1' };
      req.body = { pairs: [{ cd_cadeirante: 1, cd_condutor: 2 }] };
      await controller.savePairs(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockPairFormationService.createPair.mockRejectedValueOnce(err);
      req.body = { wheelchairUserId: '1', runnerId: '2' };
      await controller.createPair(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockPairFormationService.editPair.mockRejectedValueOnce(err);
      req.params = { pairId: '10' };
      req.body = { cd_condutor: 2 };
      await controller.editPair(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockPairFormationService.deletePair.mockRejectedValueOnce(err);
      req.params = { pairId: '10' };
      await controller.deletePair(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockPairFormationService.listByEvent.mockRejectedValueOnce(err);
      req.params = { eventId: '1' };
      await controller.listByEvent(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockPairFormationService.clearEventPairs.mockRejectedValueOnce(err);
      req.params = { eventId: '1' };
      await controller.clearPairs(req, res, next);
      expect(next).toHaveBeenCalledWith(err);

      mockPairFormationService.getHistory.mockRejectedValueOnce(err);
      await controller.history(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
