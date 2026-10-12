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
  async generateAutomaticPairs(eventId: number, preview = false): Promise<PairFormationResult> {
    // 1. Validate if event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado.', 404);
    }

    // 2. Fetch active participants ordered by priority (RN03, RN07)
    const wheelchairUsers = await this.pairRepository.findPrioritizedWheelchairUsers(eventId);
    const runners = await this.pairRepository.findPrioritizedRunners(eventId);

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

    if (preview) {
      const previewPairs: DetailedPair[] = pairsToInsert.map((p, idx) => {
        const cad = wheelchairUsers[idx];
        const run = runners[idx];
        return {
          cd_dupla: -(idx + 1),
          cd_evento: eventId,
          nm_evento: event.nm_evento,
          dt_evento: event.dt_evento,
          cd_cadeirante: cad.id,
          nm_cadeirante: cad.nome,
          cpf_cadeirante: cad.cpf,
          telefone_cadeirante: cad.telefone,
          tam_camisa_cadeirante: cad.tam_camisa,
          possui_cadeira_propria: cad.possui_cadeira_propria ?? false,
          cd_condutor: run.id,
          nm_condutor: run.nome,
          cpf_condutor: run.cpf,
          telefone_condutor: run.telefone,
          tam_camisa_condutor: run.tam_camisa,
          created_at: new Date(),
        };
      });

      return {
        evento: event,
        total_duplas: previewPairs.length,
        duplas: previewPairs,
        cadeirantes_restantes: wheelchairUsers.length - totalPairs,
        condutores_restantes: runners.length - totalPairs,
      };
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
   * Deletes a single pair by ID.
   */
  async deletePair(pairId: number): Promise<void> {
    const existing = await this.pairRepository.findById(pairId);
    if (!existing) {
      throw new AppError('Dupla não encontrada.', 404);
    }
    await this.pairRepository.deleteById(pairId);
  }

  /**
   * Validates and saves a list of pairs for an event atomically.
   */
  async savePairs(
    eventId: number,
    pairsInput: Array<{
      cd_cadeirante?: number;
      wheelchairUserId?: number;
      cd_condutor?: number;
      runnerId?: number;
    }>
  ): Promise<DetailedPair[]> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new AppError('Evento não encontrado.', 404);
    }

    if (!pairsInput || pairsInput.length === 0) {
      await this.pairRepository.deleteByEventId(eventId);
      return [];
    }

    const seenWheelchairs = new Set<number>();
    const seenRunners = new Set<number>();
    const pairsToInsert: { wheelchairUserId: number; runnerId: number }[] = [];

    for (let i = 0; i < pairsInput.length; i++) {
      const p = pairsInput[i];
      const wheelchairUserId = p.wheelchairUserId ?? p.cd_cadeirante;
      const runnerId = p.runnerId ?? p.cd_condutor;

      if (!wheelchairUserId || !runnerId) {
        throw new AppError(`A dupla #${i + 1} precisa ter um cadeirante e um condutor válidos.`, 400);
      }

      const cadId = Number(wheelchairUserId);
      const runId = Number(runnerId);

      if (seenWheelchairs.has(cadId)) {
        throw new AppError(`O cadeirante com ID ${cadId} foi incluído em mais de uma dupla no mesmo evento.`, 400);
      }
      seenWheelchairs.add(cadId);

      if (seenRunners.has(runId)) {
        throw new AppError(`O condutor com ID ${runId} foi incluído em mais de uma dupla no mesmo evento.`, 400);
      }
      seenRunners.add(runId);

      const cadeirante = await this.wheelchairUserRepository.findById(cadId);
      if (!cadeirante) {
        throw new AppError(`Cadeirante de ID ${cadId} não encontrado.`, 404);
      }
      if (!cadeirante.ativo) {
        throw new AppError(`O cadeirante "${cadeirante.nm_cadeirante}" está inativo.`, 400);
      }

      const condutor = await this.runnerRepository.findById(runId);
      if (!condutor) {
        throw new AppError(`Condutor de ID ${runId} não encontrado.`, 404);
      }
      if (!condutor.ativo) {
        throw new AppError(`O condutor "${condutor.nm_condutor}" está inativo.`, 400);
      }

      pairsToInsert.push({ wheelchairUserId: cadId, runnerId: runId });
    }

    await this.pairRepository.createMany(eventId, pairsToInsert);
    return this.pairRepository.findByEventId(eventId);
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
