import { WheelchairUserRepository } from '../repositories/wheelchairUserRepository';
import { RunnerRepository } from '../repositories/runnerRepository';
import { AppError } from '../middlewares/errorHandler';

export class WheelchairUserService {
  private wheelchairUserRepository: WheelchairUserRepository;
  private runnerRepository: RunnerRepository;

  constructor() {
    this.wheelchairUserRepository = new WheelchairUserRepository();
    this.runnerRepository = new RunnerRepository();
  }

  async listAll(active?: boolean, search?: string) {
    return this.wheelchairUserRepository.findAll(active, search);
  }

  async getById(id: number) {
    const wheelchairUser = await this.wheelchairUserRepository.findById(id);
    if (!wheelchairUser) {
      throw new AppError('Cadeirante não encontrado.', 404);
    }
    return wheelchairUser;
  }

  async create(data: {
    nm_cadeirante: string;
    cpf: string;
    telefone: string;
    tam_camisa: string;
    data_nascimento?: string | Date;
    sexo?: string;
    possui_cadeira_propria?: boolean;
    ativo?: boolean;
  }) {
    if (
      !data.nm_cadeirante ||
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

    const existingCadeirante = await this.wheelchairUserRepository.findByCpf(cleanCpf);
    if (existingCadeirante) {
      throw new AppError('Este CPF já está cadastrado para outro cadeirante.', 409);
    }

    const existingCondutor = await this.runnerRepository.findByCpf(cleanCpf);
    if (existingCondutor) {
      throw new AppError('Este CPF já está cadastrado para um condutor. O CPF deve ser único para todos os participantes.', 409);
    }

    return this.wheelchairUserRepository.create({
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
      data_nascimento?: string | Date;
      sexo?: string;
      possui_cadeira_propria: boolean;
      ativo: boolean;
    }
  ) {
    await this.getById(id);

    if (
      !data.nm_cadeirante ||
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

    const existingWithCpf = await this.wheelchairUserRepository.findByCpf(cleanCpf);
    if (existingWithCpf && existingWithCpf.cd_cadeirante !== id) {
      throw new AppError('Este CPF já está utilizado por outro participante.', 409);
    }

    const existingCondutor = await this.runnerRepository.findByCpf(cleanCpf);
    if (existingCondutor) {
      throw new AppError('Este CPF já está cadastrado para um condutor. O CPF deve ser único para todos os participantes.', 409);
    }

    return this.wheelchairUserRepository.update(id, {
      ...data,
      cpf: cleanCpf,
    });
  }

  async toggleStatus(id: number) {
    await this.getById(id);
    return this.wheelchairUserRepository.toggleStatus(id);
  }

  async delete(id: number) {
    await this.getById(id);
    const hasHistory = await this.wheelchairUserRepository.hasPairs(id);
    if (hasHistory) {
      throw new AppError(
        'Não é possível excluir o participante pois existem históricos de duplas vinculadas. Recomenda-se inativar o cadastro.',
        400
      );
    }
    return this.wheelchairUserRepository.delete(id);
  }
}

// Alias for backward compatibility
export { WheelchairUserService as CadeiranteService };
