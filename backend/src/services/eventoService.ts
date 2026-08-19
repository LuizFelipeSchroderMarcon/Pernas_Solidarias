import { EventoRepository } from '../repositories/eventoRepository';
import { AppError } from '../middlewares/errorHandler';

export class EventoService {
  private eventoRepository: EventoRepository;

  constructor() {
    this.eventoRepository = new EventoRepository();
  }

  async listAll(status?: 'futuros' | 'passados' | 'todos', search?: string) {
    return this.eventoRepository.findAll(status, search);
  }

  async getById(id: number) {
    const evento = await this.eventoRepository.findById(id);
    if (!evento) {
      throw new AppError('Evento não encontrado.', 404);
    }
    return evento;
  }

  async create(data: { nm_evento: string; dt_evento: string }) {
    if (!data.nm_evento || !data.dt_evento) {
      throw new AppError('Nome do evento e data são obrigatórios.');
    }

    return this.eventoRepository.create(data);
  }

  async update(id: number, data: { nm_evento: string; dt_evento: string }) {
    await this.getById(id);

    if (!data.nm_evento || !data.dt_evento) {
      throw new AppError('Nome do evento e data são obrigatórios.');
    }

    return this.eventoRepository.update(id, data);
  }

  async delete(id: number) {
    await this.getById(id);
    const hasDuplas = await this.eventoRepository.hasDuplas(id);
    if (hasDuplas) {
      throw new AppError(
        'Não é possível excluir o evento pois já existem duplas formadas ou histórico registrado.',
        400
      );
    }
    return this.eventoRepository.delete(id);
  }
}
