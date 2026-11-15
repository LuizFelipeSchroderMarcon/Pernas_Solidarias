import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from '../../src/controllers/authController';
import { AnalyticsController } from '../../src/controllers/analyticsController';
import { EventController } from '../../src/controllers/eventController';
import { ExportController } from '../../src/controllers/exportController';
import { RunnerController } from '../../src/controllers/runnerController';
import { WheelchairUserController } from '../../src/controllers/wheelchairUserController';
import { PairController } from '../../src/controllers/pairController';

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

vi.mock('../../src/services/eventService', () => {
  return {
    EventService: vi.fn().mockImplementation(() => ({
      listAll: vi.fn().mockResolvedValue([{ cd_evento: 1, nm_evento: 'Corrida' }]),
      getById: vi.fn().mockResolvedValue({ cd_evento: 1, nm_evento: 'Corrida' }),
      create: vi.fn().mockResolvedValue({ cd_evento: 2, nm_evento: 'Novo Evento' }),
      update: vi.fn().mockResolvedValue({ cd_evento: 1, nm_evento: 'Atualizado' }),
      delete: vi.fn().mockResolvedValue(true),
    })),
  };
});

vi.mock('../../src/services/exportService', () => {
  return {
    ExportService: vi.fn().mockImplementation(() => ({
      generateCsvPairs: vi.fn().mockResolvedValue({ csv: 'id;nome\n1;Joao', filename: 'duplas.csv' }),
      generateExcelPairs: vi.fn().mockResolvedValue({ buffer: Buffer.from('excel'), filename: 'duplas.xlsx' }),
    })),
  };
});

vi.mock('../../src/services/runnerService', () => {
  return {
    RunnerService: vi.fn().mockImplementation(() => ({
      listAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ cd_condutor: 1 }),
      create: vi.fn().mockResolvedValue({ cd_condutor: 2 }),
      update: vi.fn().mockResolvedValue({ cd_condutor: 1 }),
      toggleStatus: vi.fn().mockResolvedValue({ cd_condutor: 1, ativo: false }),
      delete: vi.fn().mockResolvedValue(true),
    })),
  };
});

vi.mock('../../src/services/wheelchairUserService', () => {
  return {
    WheelchairUserService: vi.fn().mockImplementation(() => ({
      listAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ cd_cadeirante: 1 }),
      create: vi.fn().mockResolvedValue({ cd_cadeirante: 2 }),
      update: vi.fn().mockResolvedValue({ cd_cadeirante: 1 }),
      toggleStatus: vi.fn().mockResolvedValue({ cd_cadeirante: 1, ativo: false }),
      delete: vi.fn().mockResolvedValue(true),
    })),
  };
});

vi.mock('../../src/services/pairFormationService', () => {
  return {
    PairFormationService: vi.fn().mockImplementation(() => ({
      generateAutomaticPairs: vi.fn().mockResolvedValue({ total_duplas: 2, duplas: [] }),
      savePairs: vi.fn().mockResolvedValue([]),
      createPair: vi.fn().mockResolvedValue({ cd_dupla: 1 }),
      editPair: vi.fn().mockResolvedValue({ cd_dupla: 1 }),
      deletePair: vi.fn().mockResolvedValue(true),
      listByEvent: vi.fn().mockResolvedValue({ duplas: [] }),
      clearEventPairs: vi.fn().mockResolvedValue(true),
      getHistory: vi.fn().mockResolvedValue([]),
    })),
  };
});

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
  });
});
