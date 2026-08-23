import { WheelchairUserRepository } from '../repositories/wheelchairUserRepository';
import { RunnerRepository } from '../repositories/runnerRepository';
import { PairRepository } from '../repositories/pairRepository';
import { EventRepository } from '../repositories/eventRepository';
import { DetailedPair, HistoryFilters, PairFormationResult } from '../models/types';
import { AppError } from '../middlewares/errorHandler';

export class PairFormationService {
  private pairRepository: PairRepository;
  private eventRepository: EventRepository;
  private wheelchairUserRepository: WheelchairUserRepository;
  private runnerRepository: RunnerRepository;

  constructor() {
    this.pairRepository = new PairRepository();
    this.eventRepository = new EventRepository();
    this.wheelchairUserRepository = new WheelchairUserRepository();
    this.runnerRepository = new RunnerRepository();
  }

  /**
   * Executes automatic pairing based on participation history (RF03, RF04, RN01-RN04, RN07, FA02).
   */
  async generateAutomaticPairs(eventId: number): Promise<PairFormationResult> {
    // 1. Validate if event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado.', 404);
    }

    // 2. Fetch active participants ordered by priority (RN03, RN07)
    const wheelchairUsers = await this.pairRepository.findPrioritizedWheelchairUsers();
    const runners = await this.pairRepository.findPrioritizedRunners();

    // 3. Handle edge cases (FA02)
    if (wheelchairUsers.length === 0 && runners.length === 0) {
      throw new AppError('Não há cadeirantes nem condutores ativos cadastrados para formar duplas.', 400);
    }
    if (wheelchairUsers.length === 0) {
      throw new AppError('Não há cadeirantes ativos disponíveis para este evento.', 400);
    }
    if (runners.length === 0) {
      throw new AppError('Não há condutores ativos disponíveis para este evento.', 400);
    }

    // 4. Calculate total pairs to form (RN04)
    const totalPairs = Math.min(wheelchairUsers.length, runners.length);

    // 5. Match 1:1 respecting priority (RN01, RN03)
    const pairsToInsert: { wheelchairUserId: number; runnerId: number }[] = [];
    for (let i = 0; i < totalPairs; i++) {
      pairsToInsert.push({
        wheelchairUserId: wheelchairUsers[i].id,
        runnerId: runners[i].id,
      });
    }

    // 6. Persist pairs in database
    await this.pairRepository.createMany(eventId, pairsToInsert);

    // 7. Retrieve detailed saved pairs
    const savedPairs = await this.pairRepository.findByEventId(eventId);

    return {
      evento: event,
      total_duplas: savedPairs.length,
      duplas: savedPairs,
      cadeirantes_restantes: wheelchairUsers.length - totalPairs,
      condutores_restantes: runners.length - totalPairs,
    };
  }

  /**
   * Lists all pairs for a specific event (RF06).
   */
  async listByEvent(eventId: number): Promise<{ evento: any; duplas: DetailedPair[] }> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado.', 404);
    }

    const pairs = await this.pairRepository.findByEventId(eventId);
    return { evento: event, duplas: pairs };
  }

  /**
   * Allows manual editing of a pair (RF05, RN01, RN02, RN08).
   */
  async editPair(
    pairId: number,
    wheelchairUserId: number,
    runnerId: number
  ): Promise<DetailedPair> {
    // 1. Validate pair exists
    const existingPair = await this.pairRepository.findById(pairId);
    if (!existingPair) {
      throw new AppError('Dupla não encontrada.', 404);
    }

    const eventId = existingPair.cd_evento;

    // 2. Validate wheelchair user
    const wheelchairUser = await this.wheelchairUserRepository.findById(wheelchairUserId);
    if (!wheelchairUser) {
      throw new AppError('Cadeirante informado não encontrado.', 404);
    }
    if (!wheelchairUser.ativo) {
      throw new AppError('O cadeirante selecionado está inativo no sistema.', 400);
    }

    // 3. Validate runner
    const runner = await this.runnerRepository.findById(runnerId);
    if (!runner) {
      throw new AppError('Condutor informado não encontrado.', 404);
    }
    if (!runner.ativo) {
      throw new AppError('O condutor selecionado está inativo no sistema.', 400);
    }

    // 4. Validate wheelchair user uniqueness in event (RN02)
    const isWheelchairUserAllocated = await this.pairRepository.isParticipantInEvent(
      eventId,
      'wheelchair',
      wheelchairUserId,
      pairId
    );
    if (isWheelchairUserAllocated) {
      throw new AppError(
        `O cadeirante "${wheelchairUser.nm_cadeirante}" já está alocado em outra dupla neste mesmo evento.`,
        400
      );
    }

    // 5. Validate runner uniqueness in event (RN02)
    const isRunnerAllocated = await this.pairRepository.isParticipantInEvent(
      eventId,
      'runner',
      runnerId,
      pairId
    );
    if (isRunnerAllocated) {
      throw new AppError(
        `O condutor "${runner.nm_condutor}" já está alocado em outra dupla neste mesmo evento.`,
        400
      );
    }

    // 6. Update pair
    await this.pairRepository.update(pairId, { wheelchairUserId, runnerId });

    // 7. Return updated detailed pair
    const updatedPair = await this.pairRepository.findById(pairId);
    if (!updatedPair) {
      throw new AppError('Erro ao carregar a dupla atualizada.', 500);
    }

    return updatedPair;
  }

  /**
   * Clears all pairs of an event.
   */
  async clearEventPairs(eventId: number): Promise<void> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado.', 404);
    }
    await this.pairRepository.deleteByEventId(eventId);
  }

  /**
   * Retrieves pair history with filters (RF06, RF09).
   */
  async getHistory(filters: HistoryFilters): Promise<DetailedPair[]> {
    return this.pairRepository.findHistory(filters);
  }
}

// Alias for backward compatibility
export { PairFormationService as FormacaoDuplasService };
