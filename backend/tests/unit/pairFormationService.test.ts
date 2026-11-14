import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PairFormationService } from '../../src/services/pairFormationService';

describe('PairFormationService', () => {
  let service: PairFormationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PairFormationService();
  });

  describe('generateAutomaticPairs', () => {
    it('deve lançar erro 404 se evento não existir', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue(null);

      await expect(service.generateAutomaticPairs(999)).rejects.toThrow('Evento não encontrado.');
    });

    it('deve lançar erro se evento já ocorreu', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue({
        cd_evento: 1,
        nm_evento: 'Evento Passado',
        dt_evento: '2020-01-01',
      });

      await expect(service.generateAutomaticPairs(1)).rejects.toThrow(
        'Não é possível formar duplas para eventos que já ocorreram.'
      );
    });

    it('deve lançar erro 400 se não houver cadeirantes nem condutores ativos', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue({
        cd_evento: 2,
        nm_evento: 'Corrida Futura',
        dt_evento: '2099-12-31',
      });
      vi.spyOn((service as any).pairRepository, 'findPrioritizedWheelchairUsers').mockResolvedValue([]);
      vi.spyOn((service as any).pairRepository, 'findPrioritizedRunners').mockResolvedValue([]);

      await expect(service.generateAutomaticPairs(2)).rejects.toThrow(
        'Não há cadeirantes nem condutores ativos cadastrados para formar duplas.'
      );
    });

    it('deve lançar erro 400 se faltar apenas cadeirantes ativos', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue({
        cd_evento: 2,
        nm_evento: 'Corrida Futura',
        dt_evento: '2099-12-31',
      });
      vi.spyOn((service as any).pairRepository, 'findPrioritizedWheelchairUsers').mockResolvedValue([]);
      vi.spyOn((service as any).pairRepository, 'findPrioritizedRunners').mockResolvedValue([
        { id: 1, nome: 'Condutor 1' } as any,
      ]);

      await expect(service.generateAutomaticPairs(2)).rejects.toThrow(
        'Não há cadeirantes ativos disponíveis para este evento.'
      );
    });

    it('deve lançar erro 400 se faltar apenas condutores ativos', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue({
        cd_evento: 2,
        nm_evento: 'Corrida Futura',
        dt_evento: '2099-12-31',
      });
      vi.spyOn((service as any).pairRepository, 'findPrioritizedWheelchairUsers').mockResolvedValue([
        { id: 1, nome: 'Cadeirante 1' } as any,
      ]);
      vi.spyOn((service as any).pairRepository, 'findPrioritizedRunners').mockResolvedValue([]);

      await expect(service.generateAutomaticPairs(2)).rejects.toThrow(
        'Não há condutores ativos disponíveis para este evento.'
      );
    });

    it('deve formar min(cadeirantes, condutores) duplas respeitando a ordem de prioridade', async () => {
      const mockEvent = { cd_evento: 10, nm_evento: 'Corrida Inclusão', dt_evento: '2099-10-10' };
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue(mockEvent);

      const mockCadeirantes = [
        { id: 101, nome: 'Cadeirante A', cpf: '111', telefone: '123', tam_camisa: 'M' },
        { id: 102, nome: 'Cadeirante B', cpf: '222', telefone: '456', tam_camisa: 'G' },
        { id: 103, nome: 'Cadeirante C', cpf: '333', telefone: '789', tam_camisa: 'P' },
      ];
      const mockCondutores = [
        { id: 201, nome: 'Condutor 1', cpf: '444', telefone: '321', tam_camisa: 'GG' },
        { id: 202, nome: 'Condutor 2', cpf: '555', telefone: '654', tam_camisa: 'M' },
      ];

      vi.spyOn((service as any).pairRepository, 'findPrioritizedWheelchairUsers').mockResolvedValue(mockCadeirantes as any);
      vi.spyOn((service as any).pairRepository, 'findPrioritizedRunners').mockResolvedValue(mockCondutores as any);

      const createManySpy = vi.spyOn((service as any).pairRepository, 'createMany').mockResolvedValue(undefined);
      vi.spyOn((service as any).pairRepository, 'findByEventId').mockResolvedValue([
        { cd_dupla: 1, cd_cadeirante: 101, cd_condutor: 201 },
        { cd_dupla: 2, cd_cadeirante: 102, cd_condutor: 202 },
      ] as any);

      const result = await service.generateAutomaticPairs(10, false);

      expect(result.total_duplas).toBe(2);
      expect(result.cadeirantes_restantes).toBe(1);
      expect(result.condutores_restantes).toBe(0);
      expect(createManySpy).toHaveBeenCalledWith(10, [
        { wheelchairUserId: 101, runnerId: 201 },
        { wheelchairUserId: 102, runnerId: 202 },
      ]);
    });

    it('modo preview não deve persistir no banco e deve retornar IDs negativos', async () => {
      const mockEvent = { cd_evento: 10, nm_evento: 'Corrida Inclusão', dt_evento: '2099-10-10' };
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue(mockEvent);

      vi.spyOn((service as any).pairRepository, 'findPrioritizedWheelchairUsers').mockResolvedValue([
        { id: 1, nome: 'Cad 1', cpf: '111', telefone: '123', tam_camisa: 'M' } as any,
      ]);
      vi.spyOn((service as any).pairRepository, 'findPrioritizedRunners').mockResolvedValue([
        { id: 2, nome: 'Run 1', cpf: '222', telefone: '456', tam_camisa: 'G' } as any,
      ]);

      const createManySpy = vi.spyOn((service as any).pairRepository, 'createMany');

      const result = await service.generateAutomaticPairs(10, true);

      expect(createManySpy).not.toHaveBeenCalled();
      expect(result.duplas[0].cd_dupla).toBe(-1);
      expect(result.duplas[0].cd_cadeirante).toBe(1);
      expect(result.duplas[0].cd_condutor).toBe(2);
    });
  });

  describe('createPair manual', () => {
    it('deve rejeitar criação se cadeirante ou condutor estiver inativo', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue({ cd_evento: 1 });
      vi.spyOn((service as any).wheelchairUserRepository, 'findById').mockResolvedValue({
        cd_cadeirante: 1,
        ativo: false,
      });

      await expect(service.createPair(1, 1, 2)).rejects.toThrow('O cadeirante selecionado está inativo no sistema.');
    });

    it('deve rejeitar se o participante já estiver alocado em outra dupla no mesmo evento', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue({ cd_evento: 1 });
      vi.spyOn((service as any).wheelchairUserRepository, 'findById').mockResolvedValue({
        cd_cadeirante: 1,
        nm_cadeirante: 'Lucas',
        ativo: true,
      });
      vi.spyOn((service as any).runnerRepository, 'findById').mockResolvedValue({
        cd_condutor: 2,
        nm_condutor: 'Pedro',
        ativo: true,
      });

      vi.spyOn((service as any).pairRepository, 'isParticipantInEvent').mockResolvedValueOnce(true);

      await expect(service.createPair(1, 1, 2)).rejects.toThrow('já está alocado em outra dupla neste mesmo evento.');
    });
  });

  describe('savePairs lote', () => {
    it('deve rejeitar payload com mesmo cadeirante ou mesmo condutor repetido na lista', async () => {
      vi.spyOn((service as any).eventRepository, 'findById').mockResolvedValue({ cd_evento: 1 });
      vi.spyOn((service as any).wheelchairUserRepository, 'findById').mockResolvedValue({
        cd_cadeirante: 1,
        nm_cadeirante: 'Cad 1',
        ativo: true,
      });
      vi.spyOn((service as any).runnerRepository, 'findById').mockResolvedValue({
        cd_condutor: 10,
        nm_condutor: 'Run 1',
        ativo: true,
      });

      await expect(
        service.savePairs(1, [
          { cd_cadeirante: 1, cd_condutor: 10 },
          { cd_cadeirante: 1, cd_condutor: 20 },
        ])
      ).rejects.toThrow('foi incluído em mais de uma dupla no mesmo evento.');
    });
  });
});
