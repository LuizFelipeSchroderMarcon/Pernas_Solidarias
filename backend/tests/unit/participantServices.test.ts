import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WheelchairUserService } from '../../src/services/wheelchairUserService';
import { RunnerService } from '../../src/services/runnerService';

describe('Serviços de Participantes e Validações de CPF', () => {
  let wheelchairService: WheelchairUserService;
  let runnerService: RunnerService;

  beforeEach(() => {
    vi.clearAllMocks();
    wheelchairService = new WheelchairUserService();
    runnerService = new RunnerService();
  });

  describe('WheelchairUserService', () => {
    it('deve exigir todos os campos obrigatórios (RF01)', async () => {
      await expect(
        wheelchairService.create({
          nm_cadeirante: '',
          cpf: '12345678901',
          telefone: '47999998888',
          tam_camisa: 'M',
          data_nascimento: '1995-01-01',
          sexo: 'M',
        })
      ).rejects.toThrow('Todos os campos obrigatórios devem ser preenchidos.');
    });

    it('deve rejeitar CPF que não tenha 11 dígitos', async () => {
      await expect(
        wheelchairService.create({
          nm_cadeirante: 'Teste',
          cpf: '12345',
          telefone: '47999998888',
          tam_camisa: 'M',
          data_nascimento: '1995-01-01',
          sexo: 'M',
        })
      ).rejects.toThrow('CPF deve conter exatamente 11 dígitos.');
    });

    it('deve rejeitar CPF já cadastrado para outro cadeirante (409)', async () => {
      vi.spyOn((wheelchairService as any).wheelchairUserRepository, 'findByCpf').mockResolvedValue({
        cd_cadeirante: 1,
      });

      await expect(
        wheelchairService.create({
          nm_cadeirante: 'Teste',
          cpf: '123.456.789-01',
          telefone: '47999998888',
          tam_camisa: 'M',
          data_nascimento: '1995-01-01',
          sexo: 'M',
        })
      ).rejects.toThrow('Este CPF já está cadastrado para outro cadeirante.');
    });

    it('deve rejeitar CPF já cadastrado para um condutor - unicidade cruzada (409)', async () => {
      vi.spyOn((wheelchairService as any).wheelchairUserRepository, 'findByCpf').mockResolvedValue(null);
      vi.spyOn((wheelchairService as any).runnerRepository, 'findByCpf').mockResolvedValue({
        cd_condutor: 2,
      });

      await expect(
        wheelchairService.create({
          nm_cadeirante: 'Teste',
          cpf: '123.456.789-01',
          telefone: '47999998888',
          tam_camisa: 'M',
          data_nascimento: '1995-01-01',
          sexo: 'M',
        })
      ).rejects.toThrow('Este CPF já está cadastrado para um condutor.');
    });

    it('deve impedir exclusão se o cadeirante tiver duplas vinculadas (RN05)', async () => {
      vi.spyOn((wheelchairService as any).wheelchairUserRepository, 'findById').mockResolvedValue({
        cd_cadeirante: 1,
      });
      vi.spyOn((wheelchairService as any).wheelchairUserRepository, 'hasPairs').mockResolvedValue(true);

      await expect(wheelchairService.delete(1)).rejects.toThrow(
        'Não é possível excluir o participante pois existem históricos de duplas vinculadas.'
      );
    });
  });

  describe('RunnerService', () => {
    it('deve rejeitar CPF já cadastrado para um cadeirante - unicidade cruzada (409)', async () => {
      vi.spyOn((runnerService as any).runnerRepository, 'findByCpf').mockResolvedValue(null);
      vi.spyOn((runnerService as any).wheelchairUserRepository, 'findByCpf').mockResolvedValue({
        cd_cadeirante: 5,
      });

      await expect(
        runnerService.create({
          nm_condutor: 'Condutor X',
          cpf: '123.456.789-01',
          telefone: '47999998888',
          tam_camisa: 'G',
          data_nascimento: '1990-05-10',
          sexo: 'M',
        })
      ).rejects.toThrow('Este CPF já está cadastrado para um cadeirante.');
    });
  });
});

