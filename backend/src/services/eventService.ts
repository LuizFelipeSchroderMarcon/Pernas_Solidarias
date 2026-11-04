import { EventRepository } from '../repositories/eventRepository';
import { AppError } from '../middlewares/errorHandler';

export class EventService {
  private eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  async listAll(status?: 'futuros' | 'passados' | 'todos', search?: string) {
    return this.eventRepository.findAll(status, search);
  }

  async getById(id: number) {
    const event = await this.eventRepository.findById(id);
    if (!event) {
      throw new AppError('Evento não encontrado.', 404);
    }
    return event;
  }

  async create(data: { nm_evento: string; dt_evento: string }) {
    if (!data.nm_evento || !data.dt_evento) {
      throw new AppError('Nome do evento e data são obrigatórios.');
    }

    return this.eventRepository.create(data);
  }

  async update(id: number, data: { nm_evento: string; dt_evento: string }) {
    await this.getById(id);

    if (!data.nm_evento || !data.dt_evento) {
      throw new AppError('Nome do evento e data são obrigatórios.');
    }

    return this.eventRepository.update(id, data);
  }

  async delete(id: number) {
    await this.getById(id);
    const hasPairs = await this.eventRepository.hasPairs(id);
    if (hasPairs) {
      throw new AppError(
        'Não é possível excluir o evento pois já existem duplas formadas ou histórico registrado.',
        400
      );
    }
    return this.eventRepository.delete(id);
  }
}

// Alias for backward compatibility
export { EventService as EventoService };
