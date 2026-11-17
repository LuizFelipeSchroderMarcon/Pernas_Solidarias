import { Request, Response, NextFunction } from 'express';
import { PairFormationService } from '../services/pairFormationService';

const pairFormationService = new PairFormationService();

export class PairController {
  
  async generatePairs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = Number.parseInt(eventIdParam as string, 10);
      if (Number.isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      const isPreview = req.query.preview === 'true' || req.query.salvar === 'false';
      const result = await pairFormationService.generateAutomaticPairs(eventId, isPreview);
      res.status(isPreview ? 200 : 201).json({
        message: isPreview ? 'Sugestão de duplas gerada com sucesso!' : 'Duplas formadas com sucesso!',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async savePairs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = Number.parseInt(eventIdParam as string, 10);
      if (Number.isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      const pairsInput = req.body.pairs || req.body.duplas || [];
      if (!Array.isArray(pairsInput)) {
        res.status(400).json({ error: 'Formato inválido. Envie um array de duplas.' });
        return;
      }

      const savedPairs = await pairFormationService.savePairs(eventId, pairsInput);
      res.status(200).json({
        message: 'Duplas salvas com sucesso no banco de dados!',
        data: savedPairs,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPair(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = Number.parseInt(eventIdParam as string, 10);
      const wheelchairUserId = req.body.wheelchairUserId || req.body.cd_cadeirante;
      const runnerId = req.body.runnerId || req.body.cd_condutor;

      if (Number.isNaN(eventId) || !wheelchairUserId || !runnerId) {
        res.status(400).json({
          error: 'Parâmetros inválidos. Informe o evento, cadeirante e condutor.',
        });
        return;
      }

      const createdPair = await pairFormationService.createPair(
        eventId,
        Number.parseInt(wheelchairUserId, 10),
        Number.parseInt(runnerId, 10)
      );

      res.status(201).json({
        message: 'Dupla criada com sucesso!',
        data: createdPair,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePair(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pairIdParam = req.params.pairId || req.params.cd_dupla;
      const pairId = Number.parseInt(pairIdParam as string, 10);
      if (Number.isNaN(pairId)) {
        res.status(400).json({ error: 'ID da dupla inválido.' });
        return;
      }

      await pairFormationService.deletePair(pairId);
      res.status(200).json({ message: 'Dupla removida com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async listByEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = Number.parseInt(eventIdParam as string, 10);
      if (Number.isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      const result = await pairFormationService.listByEvent(eventId);
      res.status(200).json({
        data: result.duplas,
      });
    } catch (error) {
      next(error);
    }
  }

  async editPair(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pairIdParam = req.params.pairId || req.params.cd_dupla;
      const pairId = Number.parseInt(pairIdParam as string, 10);
      const wheelchairUserId = req.body.wheelchairUserId || req.body.cd_cadeirante;
      const runnerId = req.body.runnerId || req.body.cd_condutor;

      if (Number.isNaN(pairId) || !wheelchairUserId || !runnerId) {
        res.status(400).json({
          error: 'Parâmetros inválidos. Informe o cadeirante e o condutor da dupla.',
        });
        return;
      }

      const updatedPair = await pairFormationService.editPair(
        pairId,
        Number.parseInt(wheelchairUserId, 10),
        Number.parseInt(runnerId, 10)
      );

      res.status(200).json({
        message: 'Dupla atualizada com sucesso!',
        data: updatedPair,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearPairs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventIdParam = req.params.eventId || req.params.cd_evento;
      const eventId = Number.parseInt(eventIdParam as string, 10);
      if (Number.isNaN(eventId)) {
        res.status(400).json({ error: 'ID do evento inválido.' });
        return;
      }

      await pairFormationService.clearEventPairs(eventId);
      res.status(200).json({ message: 'Duplas do evento removidas com sucesso.' });
    } catch (error) {
      next(error);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cd_evento, eventId, data_inicio, startDate, data_fim, endDate, search } = req.query;

      const eventIdParam = eventId || cd_evento;
      const startDateParam = startDate || data_inicio;
      const endDateParam = endDate || data_fim;

      const filters = {
        eventId: eventIdParam ? Number.parseInt(eventIdParam as string, 10) : undefined,
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
