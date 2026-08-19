import { CadeiranteRepository } from '../repositories/cadeiranteRepository';
import { AppError } from '../middlewares/errorHandler';

export class CadeiranteService {
  private cadeiranteRepository: CadeiranteRepository;

  constructor() {
    this.cadeiranteRepository = new CadeiranteRepository();
  }

  async listAll(ativo?: boolean, search?: string) {
    return this.cadeiranteRepository.findAll(ativo, search);
  }

  async getById(id: number) {
    const cadeirante = await this.cadeiranteRepository.findById(id);
    if (!cadeirante) {
      throw new AppError('Cadeirante não encontrado.', 404);
    }
    return cadeirante;
  }

  async create(data: {
    nm_cadeirante: string;
    cpf: string;
    telefone: string;
    tam_camisa: string;
    possui_cadeira_propria?: boolean;
    ativo?: boolean;
  }) {
    if (!data.nm_cadeirante || !data.cpf || !data.telefone || !data.tam_camisa) {
      throw new AppError('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const cleanCpf = data.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new AppError('CPF deve conter exatamente 11 dígitos.');
    }

    const existing = await this.cadeiranteRepository.findByCpf(cleanCpf);
    if (existing) {
      throw new AppError('CPF já cadastrado para outro participante.', 409);
    }

    return this.cadeiranteRepository.create({
      ...data,
      cpf: cleanCpf,
    });
  }

  async update(
    id: number,
    data: {
      nm_cadeirante: string;
      cpf: string;
      telefone: string;
      tam_camisa: string;
      possui_cadeira_propria: boolean;
      ativo: boolean;
    }
  ) {
    await this.getById(id);

    if (!data.nm_cadeirante || !data.cpf || !data.telefone || !data.tam_camisa) {
      throw new AppError('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const cleanCpf = data.cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new AppError('CPF deve conter exatamente 11 dígitos.');
    }

    const existingWithCpf = await this.cadeiranteRepository.findByCpf(cleanCpf);
    if (existingWithCpf && existingWithCpf.cd_cadeirante !== id) {
      throw new AppError('CPF já utilizado por outro participante.', 409);
    }

    return this.cadeiranteRepository.update(id, {
      ...data,
      cpf: cleanCpf,
    });
  }

  async toggleStatus(id: number) {
    await this.getById(id);
    return this.cadeiranteRepository.toggleStatus(id);
  }

  async delete(id: number) {
    await this.getById(id);
    const hasHistory = await this.cadeiranteRepository.hasDuplas(id);
    if (hasHistory) {
      throw new AppError(
        'Não é possível excluir o participante pois existem históricos de duplas vinculadas. Recomenda-se inativar o cadastro.',
        400
      );
    }
    return this.cadeiranteRepository.delete(id);
  }
}
