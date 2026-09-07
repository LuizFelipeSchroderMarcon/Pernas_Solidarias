import { RunnerRepository } from '../repositories/runnerRepository';
import { AppError } from '../middlewares/errorHandler';

export class RunnerService {
  private runnerRepository: RunnerRepository;

  constructor() {
    this.runnerRepository = new RunnerRepository();
  }

  async listAll(active?: boolean, search?: string) {
    return this.runnerRepository.findAll(active, search);
  }

  async getById(id: number) {
    const runner = await this.runnerRepository.findById(id);
    if (!runner) {
      throw new AppError('Condutor não encontrado.', 404);
    }
    return runner;
  }

  async create(data: {
    nm_condutor: string;
    cpf: string;
    telefone: string;
    tam_camisa: string;
    data_nascimento?: string | Date;
    sexo?: string;
    ativo?: boolean;
  }) {
    if (
      !data.nm_condutor ||
      !data.cpf ||
      !data.telefone ||
      !data.tam_camisa ||
      !data.data_nascimento ||
      !data.sexo
    ) {
      throw new AppError('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const cleanCpf = data.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new AppError('CPF deve conter exatamente 11 dígitos.');
    }

    const existing = await this.runnerRepository.findByCpf(cleanCpf);
    if (existing) {
      throw new AppError('CPF já cadastrado para outro condutor.', 409);
    }

    return this.runnerRepository.create({
      ...data,
      cpf: cleanCpf,
    });
  }

  async update(
    id: number,
    data: {
      nm_condutor: string;
      cpf: string;
      telefone: string;
      tam_camisa: string;
      data_nascimento?: string | Date;
      sexo?: string;
      ativo: boolean;
    }
  ) {
    await this.getById(id);

    if (
      !data.nm_condutor ||
      !data.cpf ||
      !data.telefone ||
      !data.tam_camisa ||
      !data.data_nascimento ||
      !data.sexo
    ) {
      throw new AppError('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const cleanCpf = data.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new AppError('CPF deve conter exatamente 11 dígitos.');
    }

    const existingWithCpf = await this.runnerRepository.findByCpf(cleanCpf);
    if (existingWithCpf && existingWithCpf.cd_condutor !== id) {
      throw new AppError('CPF já utilizado por outro condutor.', 409);
    }

    return this.runnerRepository.update(id, {
      ...data,
      cpf: cleanCpf,
    });
  }

  async toggleStatus(id: number) {
    await this.getById(id);
    return this.runnerRepository.toggleStatus(id);
  }

  async delete(id: number) {
    await this.getById(id);
    const hasHistory = await this.runnerRepository.hasPairs(id);
    if (hasHistory) {
      throw new AppError(
        'Não é possível excluir o condutor pois existem históricos de duplas vinculadas. Recomenda-se inativar o cadastro.',
        400
      );
    }
    return this.runnerRepository.delete(id);
  }
}

// Alias for backward compatibility
export { RunnerService as CondutorService };
