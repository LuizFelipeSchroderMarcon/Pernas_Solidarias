import { Request, Response, NextFunction } from 'express';
import { PairFormationService } from '../services/pairFormationService';

const pairFormationService = new PairFormationService();

export class PairController {
  /**
   * Triggers automatic pair formation for an event (RF03, RF04).
   */
  async generatePairs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = parseInt(eventIdParam as string, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      const result = await pairFormationService.generateAutomaticPairs(eventId);
      res.status(201).json({
        message: 'Duplas formadas com sucesso!',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists pairs formed for a specific event (RF06).
   */
  async listByEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = parseInt(eventIdParam as string, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      const result = await pairFormationService.listByEvent(eventId);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually edits a pair (RF05, RN02, RN08).
   */
  async editPair(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pairIdParam = req.params.pairId || req.params.cd_dupla;
      const pairId = parseInt(pairIdParam as string, 10);
      const wheelchairUserId = req.body.wheelchairUserId || req.body.cd_cadeirante;
      const runnerId = req.body.runnerId || req.body.cd_condutor;

      if (isNaN(pairId) || !wheelchairUserId || !runnerId) {
        res.status(400).json({
          error: 'Parâmetros inválidos. Informe o cadeirante e o condutor da dupla.',
        });
        return;
      }

      const updatedPair = await pairFormationService.editPair(
        pairId,
        parseInt(wheelchairUserId, 10),
        parseInt(runnerId, 10)
      );

      res.status(200).json({
        message: 'Dupla atualizada com sucesso!',
        data: updatedPair,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clears pairs of an event.
   */
  async clearPairs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = parseInt(eventIdParam as string, 10);
      if (isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      await pairFormationService.clearEventPairs(eventId);
      res.status(200).json({ message: 'Duplas do evento removidas com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves pair history with filters (RF06, RF09).
   */
  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cd_evento, eventId, data_inicio, startDate, data_fim, endDate, search } = req.query;

      const eventIdParam = eventId || cd_evento;
      const startDateParam = startDate || data_inicio;
      const endDateParam = endDate || data_fim;

      const filters = {
        eventId: eventIdParam ? parseInt(eventIdParam as string, 10) : undefined,
        startDate: startDateParam as string | undefined,
        endDate: endDateParam as string | undefined,
        search: search as string | undefined,
      };

      const data = await pairFormationService.getHistory(filters);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }
}

// Alias for backward compatibility
export { PairController as DuplaController };
