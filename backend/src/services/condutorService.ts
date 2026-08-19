import { CondutorRepository } from '../repositories/condutorRepository';
import { AppError } from '../middlewares/errorHandler';

export class CondutorService {
  private condutorRepository: CondutorRepository;

  constructor() {
    this.condutorRepository = new CondutorRepository();
  }

  async listAll(ativo?: boolean, search?: string) {
    return this.condutorRepository.findAll(ativo, search);
  }

  async getById(id: number) {
    const condutor = await this.condutorRepository.findById(id);
    if (!condutor) {
      throw new AppError('Condutor não encontrado.', 404);
    }
    return condutor;
  }

  async create(data: {
    nm_condutor: string;
    cpf: string;
    telefone: string;
    tam_camisa: string;
    ativo?: boolean;
  }) {
    if (!data.nm_condutor || !data.cpf || !data.telefone || !data.tam_camisa) {
      throw new AppError('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const cleanCpf = data.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new AppError('CPF deve conter exatamente 11 dígitos.');
    }

    const existing = await this.condutorRepository.findByCpf(cleanCpf);
    if (existing) {
      throw new AppError('CPF já cadastrado para outro condutor.', 409);
    }

    return this.condutorRepository.create({
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
      ativo: boolean;
    }
  ) {
    await this.getById(id);

    if (!data.nm_condutor || !data.cpf || !data.telefone || !data.tam_camisa) {
      throw new AppError('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const cleanCpf = data.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new AppError('CPF deve conter exatamente 11 dígitos.');
    }

    const existingWithCpf = await this.condutorRepository.findByCpf(cleanCpf);
    if (existingWithCpf && existingWithCpf.cd_condutor !== id) {
      throw new AppError('CPF já utilizado por outro condutor.', 409);
    }

    return this.condutorRepository.update(id, {
      ...data,
      cpf: cleanCpf,
    });
  }

  async toggleStatus(id: number) {
    await this.getById(id);
    return this.condutorRepository.toggleStatus(id);
  }

  async delete(id: number) {
    await this.getById(id);
    const hasHistory = await this.condutorRepository.hasDuplas(id);
    if (hasHistory) {
      throw new AppError(
        'Não é possível excluir o condutor pois existem históricos de duplas vinculadas. Recomenda-se inativar o cadastro.',
        400
      );
    }
    return this.condutorRepository.delete(id);
  }
}
