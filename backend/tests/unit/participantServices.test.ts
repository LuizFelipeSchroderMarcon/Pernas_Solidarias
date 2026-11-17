import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WheelchairUserService } from '../../src/services/wheelchairUserService';
import { RunnerService } from '../../src/services/runnerService';

describe('Serviços de Participantes e Validações de CPF', () => {
  let wheelchairService: WheelchairUserService;
  let runnerService: RunnerService;
  let wRepo: any;
  let rRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();
    wheelchairService = new WheelchairUserService();
    runnerService = new RunnerService();
    wRepo = (wheelchairService as any).wheelchairUserRepository;
    rRepo = (runnerService as any).runnerRepository;
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
      vi.spyOn(wRepo, 'findByCpf').mockResolvedValue({ cd_cadeirante: 1 });

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
      vi.spyOn(wRepo, 'findByCpf').mockResolvedValue(null);
      vi.spyOn((wheelchairService as any).runnerRepository, 'findByCpf').mockResolvedValue({ cd_condutor: 2 });

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

    it('deve criar cadeirante com sucesso quando dados válidos', async () => {
      vi.spyOn(wRepo, 'findByCpf').mockResolvedValue(null);
      vi.spyOn((wheelchairService as any).runnerRepository, 'findByCpf').mockResolvedValue(null);
      vi.spyOn(wRepo, 'create').mockResolvedValue({ cd_cadeirante: 1 });

      const result = await wheelchairService.create({
        nm_cadeirante: 'Lucas',
        cpf: '123.456.789-01',
        telefone: '47999998888',
        tam_camisa: 'M',
        data_nascimento: '1995-01-01',
        sexo: 'M',
      });
      expect(result.cd_cadeirante).toBe(1);
    });

    it('deve listar todos, buscar por id, atualizar e alternar status', async () => {
      vi.spyOn(wRepo, 'findAll').mockResolvedValue([{ cd_cadeirante: 1 }]);
      vi.spyOn(wRepo, 'findById').mockResolvedValue({ cd_cadeirante: 1, ativo: true });
      vi.spyOn(wRepo, 'findByCpf').mockResolvedValue(null);
      vi.spyOn((wheelchairService as any).runnerRepository, 'findByCpf').mockResolvedValue(null);
      vi.spyOn(wRepo, 'update').mockResolvedValue({ cd_cadeirante: 1, nm_cadeirante: 'Novo' });
      vi.spyOn(wRepo, 'toggleStatus').mockResolvedValue({ cd_cadeirante: 1, ativo: false });

      expect(await wheelchairService.listAll(true, 'Lucas')).toHaveLength(1);
      expect((await wheelchairService.getById(1)).cd_cadeirante).toBe(1);

      const updated = await wheelchairService.update(1, {
        nm_cadeirante: 'Novo',
        cpf: '12345678901',
        telefone: '47999998888',
        tam_camisa: 'M',
        data_nascimento: '1995-01-01',
        sexo: 'M',
        possui_cadeira_propria: true,
        ativo: true,
      });
      expect(updated?.nm_cadeirante).toBe('Novo');

      const toggled = await wheelchairService.toggleStatus(1);
      expect(toggled?.ativo).toBe(false);
    });

    it('deve impedir exclusão se o cadeirante tiver duplas vinculadas (RN05)', async () => {
      vi.spyOn(wRepo, 'findById').mockResolvedValue({ cd_cadeirante: 1 });
      vi.spyOn(wRepo, 'hasPairs').mockResolvedValue(true);

      await expect(wheelchairService.delete(1)).rejects.toThrow(
        'Não é possível excluir o participante pois existem históricos de duplas vinculadas.'
      );
    });

    it('deve excluir com sucesso quando não há duplas vinculadas', async () => {
      vi.spyOn(wRepo, 'findById').mockResolvedValue({ cd_cadeirante: 1 });
      vi.spyOn(wRepo, 'hasPairs').mockResolvedValue(false);
      vi.spyOn(wRepo, 'delete').mockResolvedValue(true);

      await expect(wheelchairService.delete(1)).resolves.not.toThrow();
    });
  });

  describe('RunnerService', () => {
    it('deve rejeitar CPF já cadastrado para um cadeirante - unicidade cruzada (409)', async () => {
      vi.spyOn(rRepo, 'findByCpf').mockResolvedValue(null);
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

    it('deve criar condutor com sucesso e listar condutores', async () => {
      vi.spyOn(rRepo, 'findByCpf').mockResolvedValue(null);
      vi.spyOn((runnerService as any).wheelchairUserRepository, 'findByCpf').mockResolvedValue(null);
      vi.spyOn(rRepo, 'create').mockResolvedValue({ cd_condutor: 1 });
      vi.spyOn(rRepo, 'findAll').mockResolvedValue([{ cd_condutor: 1 }]);

      const created = await runnerService.create({
        nm_condutor: 'Condutor Válido',
        cpf: '12345678901',
        telefone: '47999998888',
        tam_camisa: 'G',
        data_nascimento: '1990-05-10',
        sexo: 'M',
      });
      expect(created.cd_condutor).toBe(1);

      const list = await runnerService.listAll(true, 'Válido');
      expect(list).toHaveLength(1);
    });

    it('deve buscar por id, atualizar, alterar status e deletar condutor', async () => {
      vi.spyOn(rRepo, 'findById').mockResolvedValue({ cd_condutor: 1, ativo: true });
      vi.spyOn(rRepo, 'findByCpf').mockResolvedValue(null);
      vi.spyOn((runnerService as any).wheelchairUserRepository, 'findByCpf').mockResolvedValue(null);
      vi.spyOn(rRepo, 'update').mockResolvedValue({ cd_condutor: 1, nm_condutor: 'Condutor Atualizado' });
      vi.spyOn(rRepo, 'toggleStatus').mockResolvedValue({ cd_condutor: 1, ativo: false });
      vi.spyOn(rRepo, 'hasPairs').mockResolvedValue(false);
      vi.spyOn(rRepo, 'delete').mockResolvedValue(true);

      expect((await runnerService.getById(1)).cd_condutor).toBe(1);
      const updatedRunner = await runnerService.update(1, {
        nm_condutor: 'Condutor Atualizado',
        cpf: '12345678901',
        telefone: '47999998888',
        tam_camisa: 'G',
        data_nascimento: '1990-05-10',
        sexo: 'M',
        ativo: true,
      });
      expect(updatedRunner?.nm_condutor).toBe('Condutor Atualizado');
      const toggledRunner = await runnerService.toggleStatus(1);
      expect(toggledRunner?.ativo).toBe(false);
      await expect(runnerService.delete(1)).resolves.not.toThrow();
    });

    it('deve impedir exclusão de condutor se tiver duplas vinculadas', async () => {
      vi.spyOn(rRepo, 'findById').mockResolvedValue({ cd_condutor: 1 });
      vi.spyOn(rRepo, 'hasPairs').mockResolvedValue(true);

      await expect(runnerService.delete(1)).rejects.toThrow(
        'Não é possível excluir o condutor pois existem históricos de duplas vinculadas.'
      );
    });
  });
});